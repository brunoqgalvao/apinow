import { Next } from 'hono';
import type { Context } from 'hono';
import { UnauthorizedError } from '../lib/errors.js';
import { db } from '../db/index.js';
import { apiKeys } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import type { AppEnv } from '../lib/types.js';

export interface AuthContext {
  apiKeyId: string;
  userId: string;
}

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7);
  const prefix = token.slice(0, 12);

  // Find key candidates by prefix
  const candidates = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.keyPrefix, prefix), eq(apiKeys.isActive, true)));

  for (const candidate of candidates) {
    const match = await bcrypt.compare(token, candidate.keyHash);
    if (match) {
      c.set('auth', {
        apiKeyId: candidate.id,
        userId: candidate.userId,
      } as AuthContext);
      return next();
    }
  }

  throw new UnauthorizedError('Invalid API key');
}
