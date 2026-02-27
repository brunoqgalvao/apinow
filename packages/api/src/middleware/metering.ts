import { Next } from 'hono';
import type { Context } from 'hono';
import { db } from '../db/index.js';
import { usageLogs } from '../db/schema.js';
import type { AppEnv } from '../lib/types.js';

export async function meteringMiddleware(c: Context<AppEnv>, next: Next) {
  const start = Date.now();

  await next();

  const auth = c.get('auth');
  const apiId = c.get('apiId');
  if (!auth || !apiId) return;

  const latencyMs = Date.now() - start;

  // Fire and forget — don't block the response
  db.insert(usageLogs)
    .values({
      apiKeyId: auth.apiKeyId,
      apiId,
      endpointId: c.get('endpointId') ?? null,
      method: c.req.method,
      path: c.req.path,
      statusCode: c.res.status,
      latencyMs,
    })
    .catch((err) => console.error('Failed to log usage:', err));
}
