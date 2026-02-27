import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { ApiError, PaymentRequiredError } from './lib/errors.js';
import { authMiddleware } from './middleware/auth.js';
import { meteringMiddleware } from './middleware/metering.js';
import { creditsMiddleware } from './middleware/credits.js';
import discover from './routes/discover.js';
import catalog from './routes/catalog.js';
import proxy from './routes/proxy.js';
import keys from './routes/keys.js';
import usage from './routes/usage.js';
import signup from './routes/signup.js';
import account from './routes/account.js';
import admin from './routes/admin.js';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', cors());

// Root info
app.get('/', (c) =>
  c.json({
    name: 'ApiNow',
    version: '0.1.0',
    tagline: 'APIs for the Agent Economy',
    docs: '/v1/apis',
    discover: '/v1/discover?query=your+question',
    signup: 'POST /v1/signup',
  }),
);

app.get('/health', (c) => c.json({ status: 'ok' }));

// Public routes (no auth)
app.route('/', discover);
app.route('/', catalog);
app.route('/', signup);

// Protected routes
app.use('/v1/proxy/*', authMiddleware, creditsMiddleware, meteringMiddleware);
app.use('/v1/keys/*', authMiddleware);
app.use('/v1/usage/*', authMiddleware);
app.use('/v1/account/*', authMiddleware);
app.use('/v1/account', authMiddleware);

app.route('/', proxy);
app.route('/', keys);
app.route('/', usage);
app.route('/', account);
app.route('/', admin);

// Error handler
app.onError((err, c) => {
  console.error('[ERROR]', err);

  if (err instanceof PaymentRequiredError) {
    return c.json(
      {
        error: err.message,
        code: err.code,
        ...err.paymentOptions,
      },
      402 as const,
    );
  }

  if (err instanceof ApiError) {
    return c.json(
      { error: err.message, code: err.code },
      err.statusCode as 400,
    );
  }
  return c.json({ error: 'Internal server error' }, 500);
});

app.notFound((c) => c.json({ error: 'Not found' }, 404));

const port = Number(process.env.PORT || 3001);
console.log(`ApiNow API running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
