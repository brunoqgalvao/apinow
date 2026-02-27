import { Hono } from 'hono';
import { db } from '../db/index.js';
import { users, creditTransactions } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import type { AppEnv } from '../lib/types.js';

const account = new Hono<AppEnv>();

// Get account info + balance
account.get('/v1/account', async (c) => {
  const auth = c.get('auth');

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      creditsBalance: users.creditsBalance,
      stripeCustomerId: users.stripeCustomerId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, auth.userId))
    .limit(1);

  if (!user) {
    return c.json({ error: 'Account not found' }, 404);
  }

  const baseUrl = `${c.req.url.split('/v1')[0]}`;

  return c.json({
    ...user,
    has_payment_method: !!user.stripeCustomerId,
    payment_url: `${baseUrl}/pay/${user.id}`,
  });
});

// Get recent credit transactions
account.get('/v1/account/transactions', async (c) => {
  const auth = c.get('auth');
  const limit = Math.min(Number(c.req.query('limit') || 50), 100);

  const txs = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, auth.userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit);

  return c.json({ transactions: txs });
});

// Get payment URL for topping up credits
account.get('/v1/account/payment-url', async (c) => {
  const auth = c.get('auth');
  const baseUrl = `${c.req.url.split('/v1')[0]}`;

  // TODO: When Stripe is wired up, generate a real Stripe Checkout session URL here.
  // For now, return the placeholder payment page URL.
  return c.json({
    payment_url: `${baseUrl}/pay/${auth.userId}`,
    methods: ['card'],
    // x402 info for crypto-native agents
    x402: {
      supported: true,
      hint: 'Include x402 payment headers on any proxy request to pay per-call with USDC.',
    },
  });
});

export default account;
