import { Hono } from 'hono';
import { db } from '../db/index.js';
import { users, apiKeys } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

const signup = new Hono();

// Agent-first signup: POST name + optional contact, get back an API key
signup.post('/v1/signup', async (c) => {
  const body = await c.req.json();
  const name = body.name;
  const email = body.email || body.contact || null;
  const phone = body.phone || null;

  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    return c.json({ error: 'name is required' }, 400);
  }

  // Check if email already taken
  if (email) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return c.json({ error: 'An account with this email already exists' }, 409);
    }
  }

  // Create user (no password needed for agent accounts)
  const [user] = await db
    .insert(users)
    .values({
      name: name.trim(),
      email: email || null,
      phone,
      creditsBalance: 0,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      creditsBalance: users.creditsBalance,
      createdAt: users.createdAt,
    });

  // Generate API key
  const rawKey = `apn_${nanoid(32)}`;
  const keyHash = await bcrypt.hash(rawKey, 10);

  const [key] = await db
    .insert(apiKeys)
    .values({
      userId: user.id,
      keyHash,
      keyPrefix: rawKey.slice(0, 12),
      name: 'default',
    })
    .returning({
      id: apiKeys.id,
      keyPrefix: apiKeys.keyPrefix,
      createdAt: apiKeys.createdAt,
    });

  const baseUrl = `${c.req.url.split('/v1')[0]}`;

  return c.json(
    {
      account_id: user.id,
      api_key: rawKey, // shown ONCE — agent must store this
      credits: user.creditsBalance,
      status: 'active',
      payment_url: `${baseUrl}/pay/${user.id}`,
      message: 'Store your api_key — it cannot be retrieved again.',
    },
    201,
  );
});

export default signup;
