import { Next } from 'hono';
import type { Context } from 'hono';
import { db } from '../db/index.js';
import { users, creditTransactions } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { PaymentRequiredError } from '../lib/errors.js';
import type { AppEnv } from '../lib/types.js';

// Cost per proxy request in credits (1 credit = 1 cent)
const DEFAULT_COST = 1;

export async function creditsMiddleware(c: Context<AppEnv>, next: Next) {
  const auth = c.get('auth');
  if (!auth) return next(); // auth middleware hasn't run yet somehow

  // Check balance
  const [user] = await db
    .select({ creditsBalance: users.creditsBalance })
    .from(users)
    .where(eq(users.id, auth.userId))
    .limit(1);

  if (!user || user.creditsBalance < DEFAULT_COST) {
    const baseUrl = `${c.req.url.split('/v1')[0]}`;
    throw new PaymentRequiredError('Insufficient credits', {
      balance: user?.creditsBalance ?? 0,
      cost: DEFAULT_COST,
      payment_url: `${baseUrl}/pay/${auth.userId}`,
      payment_api: 'GET /v1/account/payment-url',
      x402: {
        supported: true,
        hint: 'Include x402 payment headers to pay per-call with USDC.',
      },
    });
  }

  // Proceed with request
  await next();

  // Deduct credits after successful response (only on 2xx)
  if (c.res.status >= 200 && c.res.status < 300) {
    // Atomic decrement + log transaction
    db.transaction(async (tx) => {
      const [updated] = await tx
        .update(users)
        .set({
          creditsBalance: sql`${users.creditsBalance} - ${DEFAULT_COST}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, auth.userId))
        .returning({ creditsBalance: users.creditsBalance });

      await tx.insert(creditTransactions).values({
        userId: auth.userId,
        amount: -DEFAULT_COST,
        type: 'usage',
        reference: `${c.req.method} ${c.req.path}`,
        balanceAfter: updated.creditsBalance,
      });
    }).catch((err) => console.error('Failed to deduct credits:', err));
  }
}
