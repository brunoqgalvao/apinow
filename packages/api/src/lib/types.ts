import type { Hono } from 'hono';
import type { AuthContext } from '../middleware/auth.js';

// Hono environment type for routes that use context variables
export type AppEnv = {
  Variables: {
    auth: AuthContext;
    apiId: string;
    endpointId: string;
  };
};

export type AppHono = Hono<AppEnv>;
