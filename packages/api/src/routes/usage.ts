import { Hono } from 'hono';
import { db } from '../db/index.js';
import { usageLogs, apis } from '../db/schema.js';
import { eq, sql, and, gte } from 'drizzle-orm';
import type { AppEnv } from '../lib/types.js';

const usage = new Hono<AppEnv>();

usage.get('/v1/usage', async (c) => {
  const auth = c.get('auth');
  const days = Math.min(Math.max(Number(c.req.query('days') || '30'), 1), 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const stats = await db
    .select({
      apiSlug: apis.slug,
      apiName: apis.name,
      totalRequests: sql<number>`count(*)::int`,
      avgLatencyMs: sql<number>`round(avg(${usageLogs.latencyMs}))::int`,
      errorCount: sql<number>`count(*) filter (where ${usageLogs.statusCode} >= 400)::int`,
    })
    .from(usageLogs)
    .innerJoin(apis, eq(usageLogs.apiId, apis.id))
    .where(
      and(
        eq(usageLogs.apiKeyId, auth.apiKeyId),
        gte(usageLogs.createdAt, since),
      ),
    )
    .groupBy(apis.slug, apis.name);

  const totalRequests = stats.reduce((sum, s) => sum + s.totalRequests, 0);

  return c.json({ days, totalRequests, byApi: stats });
});

export default usage;
