---
name: apinow-api
description: Interact with the ApiNow API gateway — sign up agents, manage API keys, check credits, and proxy API calls.
triggers:
  - apinow
  - api gateway
  - sign up agent
  - api key
  - check credits
  - proxy api
---

# ApiNow API Gateway Skill

Base URL: `https://api-production-0534f.up.railway.app`

## When to Use This Skill

- Signing up new AI agents for API access
- Managing API keys and checking credit balances
- Discovering available APIs in the catalog
- Proxying requests through ApiNow to external APIs
- Handling 402 payment flows when credits run low

## Agent Onboarding Flow

### 1. Sign Up (No Auth Required)

Create an account and get an API key instantly:

```bash
curl -X POST https://api-production-0534f.up.railway.app/v1/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "my-agent", "email": "optional@example.com"}'
```

**Response (201):**
```json
{
  "account_id": "uuid",
  "api_key": "apn_xxxxx",
  "credits": 0,
  "status": "active",
  "payment_url": "https://..../pay/uuid",
  "message": "Store your api_key — it cannot be retrieved again."
}
```

**IMPORTANT:** The `api_key` is shown ONCE. Store it immediately.

### 2. Use the API Key

All protected endpoints require Bearer authentication:

```bash
Authorization: Bearer apn_xxxxx
```

## Public Endpoints

### Get API Info
```bash
curl https://api-production-0534f.up.railway.app/
```

### Health Check
```bash
curl https://api-production-0534f.up.railway.app/health
```

### List Available APIs
```bash
curl https://api-production-0534f.up.railway.app/v1/apis
```

### Get API Details
```bash
curl https://api-production-0534f.up.railway.app/v1/apis/:slug
```

### Discover APIs (Natural Language)
```bash
curl "https://api-production-0534f.up.railway.app/v1/discover?query=weather%20forecast"
```

## Protected Endpoints

All require: `Authorization: Bearer apn_xxxxx`

### Check Account & Credits
```bash
curl https://api-production-0534f.up.railway.app/v1/account \
  -H "Authorization: Bearer apn_xxxxx"
```

### Get Transaction History
```bash
# Default limit
curl https://api-production-0534f.up.railway.app/v1/account/transactions \
  -H "Authorization: Bearer apn_xxxxx"

# Custom limit
curl "https://api-production-0534f.up.railway.app/v1/account/transactions?limit=100" \
  -H "Authorization: Bearer apn_xxxxx"
```

### Get Payment URL
```bash
curl https://api-production-0534f.up.railway.app/v1/account/payment-url \
  -H "Authorization: Bearer apn_xxxxx"
```

Returns:
```json
{
  "payment_url": "https://..../pay/uuid",
  "x402": {
    "supported": true,
    "hint": "Include x402 payment headers to pay per-call with USDC."
  }
}
```

### List API Keys
```bash
curl https://api-production-0534f.up.railway.app/v1/keys \
  -H "Authorization: Bearer apn_xxxxx"
```

### Create New API Key
```bash
curl -X POST https://api-production-0534f.up.railway.app/v1/keys \
  -H "Authorization: Bearer apn_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-new-key"}'
```

### Deactivate API Key
```bash
curl -X DELETE https://api-production-0534f.up.railway.app/v1/keys/:key_id \
  -H "Authorization: Bearer apn_xxxxx"
```

### Get Usage Statistics
```bash
# Default period
curl https://api-production-0534f.up.railway.app/v1/usage \
  -H "Authorization: Bearer apn_xxxxx"

# Last 30 days
curl "https://api-production-0534f.up.railway.app/v1/usage?days=30" \
  -H "Authorization: Bearer apn_xxxxx"
```

## Proxying API Calls

### Route Format
```bash
/v1/proxy/:apiSlug/*
```

All HTTP methods (GET, POST, PUT, DELETE, etc.) are supported.

### Example: Proxy a GET Request
```bash
curl https://api-production-0534f.up.railway.app/v1/proxy/some-api/endpoint \
  -H "Authorization: Bearer apn_xxxxx"
```

### Example: Proxy a POST Request
```bash
curl -X POST https://api-production-0534f.up.railway.app/v1/proxy/some-api/create \
  -H "Authorization: Bearer apn_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"data": "value"}'
```

## Handling 402 Payment Required

When credits run out, you'll receive a 402 response:

```json
{
  "error": "Insufficient credits",
  "code": "PAYMENT_REQUIRED",
  "balance": 0,
  "cost": 1,
  "payment_url": "https://.../pay/uuid",
  "payment_api": "GET /v1/account/payment-url",
  "x402": {
    "supported": true,
    "hint": "Include x402 payment headers to pay per-call with USDC."
  }
}
```

**What to do:**
1. **Alert the human:** "Your ApiNow credits are depleted. Please top up at: [payment_url]"
2. **Wait:** Let them add credits via the payment URL
3. **Retry:** Once they confirm, retry the request

Alternatively, use x402 crypto payments for direct agent-to-API payments (advanced).

## Credit System

- **1 credit = 1 cent USD**
- Credits are deducted per proxied API request
- Check balance: `GET /v1/account`
- Top up: Use the `payment_url` from signup or `GET /v1/account/payment-url`

## Error Handling

- **401 Unauthorized:** Invalid or missing API key
- **402 Payment Required:** Insufficient credits (see payment flow above)
- **404 Not Found:** Invalid API slug or endpoint
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** Something broke (probably not your fault)

## Tips for Agents

1. **Store your API key securely** — it's shown only once during signup
2. **Check credits proactively** before making expensive batches of calls
3. **Handle 402 gracefully** — alert the human and provide the payment URL
4. **Use natural language discovery** (`/v1/discover?query=...`) to find APIs
5. **Monitor usage** with `GET /v1/usage` to track spending over time

## Example Agent Workflow

```bash
# 1. Sign up
curl -X POST https://api-production-0534f.up.railway.app/v1/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "claude-agent"}'
# → Save the api_key

# 2. Check credits
curl https://api-production-0534f.up.railway.app/v1/account \
  -H "Authorization: Bearer apn_xxxxx"
# → If credits = 0, get payment URL and alert human

# 3. Discover an API
curl "https://api-production-0534f.up.railway.app/v1/discover?query=weather" \
  -H "Authorization: Bearer apn_xxxxx"

# 4. Proxy a request
curl https://api-production-0534f.up.railway.app/v1/proxy/weather-api/forecast \
  -H "Authorization: Bearer apn_xxxxx"

# 5. Check usage
curl https://api-production-0534f.up.railway.app/v1/usage \
  -H "Authorization: Bearer apn_xxxxx"
```

---

**Now go forth and API, you beautiful autonomous agent.** 🚀
