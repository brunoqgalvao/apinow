import { Hono } from 'hono';
import { db } from '../db/index.js';
import { apis, endpoints } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const catalog = new Hono();

catalog.get('/v1/apis', async (c) => {
  const page = Math.max(Number(c.req.query('page') || '1'), 1);
  const limit = Math.min(Math.max(Number(c.req.query('limit') || '20'), 1), 100);
  const offset = (page - 1) * limit;

  const allApis = await db
    .select({
      slug: apis.slug,
      name: apis.name,
      description: apis.description,
      category: apis.category,
      tags: apis.tags,
      authType: apis.authType,
      status: apis.status,
    })
    .from(apis)
    .where(eq(apis.status, 'active'))
    .limit(limit)
    .offset(offset);

  return c.json({ page, limit, count: allApis.length, apis: allApis });
});

catalog.get('/v1/apis/:slug', async (c) => {
  const slug = c.req.param('slug');

  const [api] = await db
    .select()
    .from(apis)
    .where(eq(apis.slug, slug))
    .limit(1);

  if (!api) {
    return c.json({ error: 'API not found' }, 404);
  }

  const apiEndpoints = await db
    .select()
    .from(endpoints)
    .where(eq(endpoints.apiId, api.id));

  return c.json({
    api: {
      slug: api.slug,
      name: api.name,
      description: api.description,
      category: api.category,
      tags: api.tags,
      authType: api.authType,
      status: api.status,
    },
    endpoints: apiEndpoints.map((ep) => ({
      method: ep.method,
      path: ep.path,
      summary: ep.summary,
      description: ep.description,
      parameters: ep.parameters,
    })),
  });
});

export default catalog;
