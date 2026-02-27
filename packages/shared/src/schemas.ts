import { z } from 'zod';

export const AuthTypeSchema = z.enum(['none', 'api_key', 'bearer', 'basic']);
export const ApiStatusSchema = z.enum(['active', 'inactive', 'deprecated']);
export const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  passwordHash: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  keyHash: z.string(),
  keyPrefix: z.string().length(8),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
});

export const ApiSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  openapiSpec: z.record(z.any()).nullable(),
  embedding: z.array(z.number()).nullable(),
  baseUrl: z.string().url(),
  authType: AuthTypeSchema,
  authConfig: z.record(z.any()).nullable(),
  status: ApiStatusSchema,
  pricing: z.record(z.any()).nullable(),
  tags: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const EndpointSchema = z.object({
  id: z.string().uuid(),
  apiId: z.string().uuid(),
  method: HttpMethodSchema,
  path: z.string(),
  summary: z.string(),
  description: z.string().nullable(),
  embedding: z.array(z.number()).nullable(),
  parameters: z.record(z.any()).nullable(),
  requestBodySchema: z.record(z.any()).nullable(),
  responseSchema: z.record(z.any()).nullable(),
  createdAt: z.date(),
});

export const UsageLogSchema = z.object({
  id: z.string().uuid(),
  apiKeyId: z.string().uuid(),
  apiId: z.string().uuid(),
  endpointId: z.string().uuid().nullable(),
  method: z.string(),
  path: z.string(),
  statusCode: z.number(),
  latencyMs: z.number(),
  requestBodySize: z.number(),
  responseBodySize: z.number(),
  createdAt: z.date(),
});

export const DiscoverResultSchema = z.object({
  api: ApiSchema,
  endpoints: z.array(EndpointSchema),
  relevanceScore: z.number(),
  usageExample: z.string(),
  curlCommand: z.string(),
});

// API request/response schemas
export const DiscoverQuerySchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().max(50).optional().default(10),
});

export const DiscoverResponseSchema = z.object({
  query: z.string(),
  results: z.array(DiscoverResultSchema),
});

export const ApiCatalogResponseSchema = z.object({
  apis: z.array(ApiSchema),
  total: z.number(),
});

export const ApiDetailResponseSchema = z.object({
  api: ApiSchema,
  endpoints: z.array(EndpointSchema),
});

export const UsageResponseSchema = z.object({
  logs: z.array(UsageLogSchema),
  total: z.number(),
  totalCost: z.number(),
});

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(255),
});

export const UpdateApiKeySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional(),
});
