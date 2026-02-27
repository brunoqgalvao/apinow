import { Hono } from 'hono';
import { db } from '../db/index.js';
import { apiKeys } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import type { AppEnv } from '../lib/types.js';

const keys = new Hono<AppEnv>();

keys.get('/v1/keys', async (c) => {
  const auth = c.get('auth');
  const userKeys = await db
    .select({
      id: apiKeys.id,
      keyPrefix: apiKeys.keyPrefix,
      name: apiKeys.name,
      isActive: apiKeys.isActive,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, auth.userId));

  return c.json({ keys: userKeys });
});

keys.post('/v1/keys', async (c) => {
  const auth = c.get('auth');
  const body = await c.req.json();
  const name = body.name;

  if (!name || typeof name !== 'string' || name.length < 1) {
    return c.json({ error: 'Name is required' }, 400);
  }

  const rawKey = `apn_${nanoid(32)}`;
  const keyHash = await bcrypt.hash(rawKey, 10);

  const [created] = await db
    .insert(apiKeys)
    .values({
      userId: auth.userId,
      keyHash,
      keyPrefix: rawKey.slice(0, 12),
      name,
    })
    .returning({
      id: apiKeys.id,
      keyPrefix: apiKeys.keyPrefix,
      name: apiKeys.name,
      createdAt: apiKeys.createdAt,
    });

  return c.json({ key: rawKey, ...created }, 201);
});

keys.delete('/v1/keys/:id', async (c) => {
  const auth = c.get('auth');
  const keyId = c.req.param('id');

  const [updated] = await db
    .update(apiKeys)
    .set({ isActive: false })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, auth.userId)))
    .returning();

  if (!updated) {
    return c.json({ error: 'Key not found' }, 404);
  }

  return c.json({ message: 'Key deactivated' });
});

export default keys;
