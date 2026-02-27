export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  userId: string;
  keyHash: string;
  keyPrefix: string; // First 8 chars for display
  name: string;
  isActive: boolean;
  createdAt: Date;
}

export type AuthType = 'none' | 'api_key' | 'bearer' | 'basic';
export type ApiStatus = 'active' | 'inactive' | 'deprecated';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface Api {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  openapiSpec: Record<string, any> | null;
  embedding: number[] | null;
  baseUrl: string;
  authType: AuthType;
  authConfig: Record<string, any> | null;
  status: ApiStatus;
  pricing: Record<string, any> | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Endpoint {
  id: string;
  apiId: string;
  method: HttpMethod;
  path: string;
  summary: string;
  description: string | null;
  embedding: number[] | null;
  parameters: Record<string, any> | null;
  requestBodySchema: Record<string, any> | null;
  responseSchema: Record<string, any> | null;
  createdAt: Date;
}

export interface UsageLog {
  id: string;
  apiKeyId: string;
  apiId: string;
  endpointId: string | null;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  requestBodySize: number;
  responseBodySize: number;
  createdAt: Date;
}

export interface DiscoverResult {
  api: Api;
  endpoints: Endpoint[];
  relevanceScore: number;
  usageExample: string;
  curlCommand: string;
}

// API response types
export interface DiscoverResponse {
  query: string;
  results: DiscoverResult[];
}

export interface ApiCatalogResponse {
  apis: Api[];
  total: number;
}

export interface ApiDetailResponse {
  api: Api;
  endpoints: Endpoint[];
}

export interface UsageResponse {
  logs: UsageLog[];
  total: number;
  totalCost: number;
}
