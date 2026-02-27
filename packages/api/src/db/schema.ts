import { pgTable, uuid, text, timestamp, boolean, varchar, jsonb, integer, pgEnum, customType } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Custom pgvector type for embeddings
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]) {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string) {
    return value.slice(1, -1).split(',').map(Number);
  },
});

// Enums
export const authTypeEnum = pgEnum('auth_type', ['none', 'api_key', 'bearer', 'basic']);
export const apiStatusEnum = pgEnum('api_status', ['active', 'inactive', 'deprecated']);
export const httpMethodEnum = pgEnum('http_method', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

// Enums for credit transactions
export const creditTxTypeEnum = pgEnum('credit_tx_type', ['topup', 'usage', 'refund', 'promo', 'signup_bonus']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 50 }),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash'),
  creditsBalance: integer('credits_balance').notNull().default(0),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// API Keys table
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  keyHash: text('key_hash').notNull(),
  keyPrefix: varchar('key_prefix', { length: 12 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// APIs table
export const apis = pgTable('apis', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  openapiSpec: jsonb('openapi_spec'),
  embedding: vector('embedding'),
  baseUrl: text('base_url').notNull(),
  authType: authTypeEnum('auth_type').notNull().default('none'),
  authConfig: jsonb('auth_config'),
  status: apiStatusEnum('status').notNull().default('active'),
  pricing: jsonb('pricing'),
  tags: text('tags').array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Endpoints table
export const endpoints = pgTable('endpoints', {
  id: uuid('id').primaryKey().defaultRandom(),
  apiId: uuid('api_id').notNull().references(() => apis.id, { onDelete: 'cascade' }),
  method: httpMethodEnum('method').notNull(),
  path: text('path').notNull(),
  summary: text('summary').notNull(),
  description: text('description'),
  embedding: vector('embedding'),
  parameters: jsonb('parameters'),
  requestBodySchema: jsonb('request_body_schema'),
  responseSchema: jsonb('response_schema'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Usage Logs table
export const usageLogs = pgTable('usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  apiKeyId: uuid('api_key_id').notNull().references(() => apiKeys.id, { onDelete: 'cascade' }),
  apiId: uuid('api_id').notNull().references(() => apis.id, { onDelete: 'cascade' }),
  endpointId: uuid('endpoint_id').references(() => endpoints.id, { onDelete: 'set null' }),
  method: varchar('method', { length: 10 }).notNull(),
  path: text('path').notNull(),
  statusCode: integer('status_code').notNull(),
  latencyMs: integer('latency_ms').notNull(),
  requestBodySize: integer('request_body_size').notNull().default(0),
  responseBodySize: integer('response_body_size').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Credit Transactions table (audit trail for all balance changes)
export const creditTransactions = pgTable('credit_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(), // positive = add, negative = spend
  type: creditTxTypeEnum('type').notNull(),
  reference: text('reference'), // stripe payment intent ID, usage_log ID, etc.
  balanceAfter: integer('balance_after').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
