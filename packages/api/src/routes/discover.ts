import { Hono } from 'hono';
import { db } from '../db/index.js';
import { apis, endpoints } from '../db/schema.js';
import { eq, ilike, or, sql } from 'drizzle-orm';

const discover = new Hono();

discover.get('/v1/discover', async (c) => {
  const query = c.req.query('query') || c.req.query('q') || '';
  const limit = Math.min(Math.max(Number(c.req.query('limit') || '5'), 1), 20);
  const category = c.req.query('category');

  if (!query) {
    return c.json({ error: 'Missing query parameter. Use ?query=your+question' }, 400);
  }

  // For MVP: text search using ILIKE on name, description, and tags
  // TODO: Replace with pgvector semantic search once embeddings are generated
  const searchPattern = `%${query}%`;

  let conditions = or(
    ilike(apis.name, searchPattern),
    ilike(apis.description, searchPattern),
    sql`${apis.tags}::text ILIKE ${searchPattern}`,
  );

  const results = await db
    .select()
    .from(apis)
    .where(conditions)
    .limit(limit);

  const filtered = category
    ? results.filter((api) => api.category === category)
    : results;

  const response = await Promise.all(
    filtered.map(async (api) => {
      const apiEndpoints = await db
        .select()
        .from(endpoints)
        .where(eq(endpoints.apiId, api.id));

      return {
        api: {
          slug: api.slug,
          name: api.name,
          description: api.description,
          category: api.category,
          tags: api.tags,
          authType: api.authType,
        },
        endpoints: apiEndpoints.map((ep) => ({
          method: ep.method,
          path: ep.path,
          summary: ep.summary,
          description: ep.description,
          parameters: ep.parameters,
        })),
        usageExample: `curl -H "Authorization: Bearer YOUR_APINOW_KEY" http://localhost:3001/v1/proxy/${api.slug}${apiEndpoints[0]?.path || ''}`,
      };
    }),
  );

  return c.json({
    query,
    count: response.length,
    results: response,
  });
});

export default discover;
