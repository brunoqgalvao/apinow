import { Hono } from 'hono';
import { db } from '../db/index.js';
import { apis } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { AppEnv } from '../lib/types.js';

const proxy = new Hono<AppEnv>();

proxy.all('/v1/proxy/:apiSlug/*', async (c) => {
  const apiSlug = c.req.param('apiSlug');

  const [api] = await db
    .select()
    .from(apis)
    .where(eq(apis.slug, apiSlug))
    .limit(1);

  if (!api) {
    return c.json({ error: `API "${apiSlug}" not found` }, 404);
  }

  if (api.status !== 'active') {
    return c.json({ error: `API "${apiSlug}" is ${api.status}` }, 410);
  }

  // Set apiId for metering middleware
  c.set('apiId', api.id);

  // Build target URL
  const fullPath = c.req.path;
  const proxyPrefix = `/v1/proxy/${apiSlug}`;
  const remainingPath = fullPath.slice(proxyPrefix.length);
  const targetUrl = new URL(remainingPath || '/', api.baseUrl);

  // Forward query params
  const sourceUrl = new URL(c.req.url);
  sourceUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  // Prepare headers
  const headers = new Headers();
  headers.set('User-Agent', 'ApiNow/1.0');

  // Inject external API auth
  const authConfig = api.authConfig as Record<string, string> | null;
  if (api.authType === 'api_key' && authConfig) {
    if (authConfig.type === 'query_param') {
      targetUrl.searchParams.set(authConfig.param_name, authConfig.key);
    } else if (authConfig.type === 'header') {
      headers.set(authConfig.header_name, authConfig.key);
    }
  } else if (api.authType === 'bearer' && authConfig) {
    headers.set(authConfig.header || 'Authorization', `Bearer ${authConfig.key}`);
  }

  // Forward request body for POST/PUT/PATCH
  let body: string | undefined;
  if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
    body = await c.req.text();
    headers.set('Content-Type', c.req.header('Content-Type') || 'application/json');
  }

  try {
    const start = Date.now();
    const response = await fetch(targetUrl.toString(), {
      method: c.req.method,
      headers,
      body,
    });
    const latency = Date.now() - start;

    const responseBody = await response.text();

    return new Response(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'X-ApiNow-Latency': `${latency}ms`,
        'X-ApiNow-Api': apiSlug,
      },
    });
  } catch (err) {
    return c.json({ error: 'Upstream API request failed', details: String(err) }, 502);
  }
});

export default proxy;
