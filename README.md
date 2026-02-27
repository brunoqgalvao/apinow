# ApiNow

> APIs for the Agent Economy

A unified API gateway that lets AI agents discover and integrate thousands of APIs with a single key.

## Structure

```
apinow/
├── packages/
│   ├── shared/          # Shared TypeScript types and Zod schemas
│   ├── api/             # Hono backend (port 3001)
│   └── web/             # Next.js frontend
├── apis/                # API definition files (YAML)
├── docker-compose.yml   # PostgreSQL + pgvector
└── turbo.json          # Turborepo config
```

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start the database

```bash
docker compose up -d
```

### 3. Set up environment variables

Copy `.env.example` to `.env` and fill in your OpenAI API key:

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 4. Generate and run database migrations

```bash
cd packages/api
pnpm db:generate
pnpm db:migrate
```

### 5. Start the dev servers

```bash
# From root
pnpm dev
```

This will start:
- API server on http://localhost:3001
- Web frontend on http://localhost:3000

## Architecture

### Core Features

- **🔍 Discovery**: Natural language API search using pgvector embeddings
- **🔑 Authentication**: Unified API key system - one key for all APIs
- **🚀 Proxy Gateway**: `/v1/proxy/:apiSlug/*` handles auth injection and request forwarding
- **📊 Metering**: Automatic usage tracking and cost calculation
- **📚 Catalog**: Browse and explore available APIs

### Tech Stack

- **Backend**: Hono (lightweight, fast HTTP framework)
- **Database**: PostgreSQL 16 + pgvector (vector similarity search)
- **ORM**: Drizzle ORM
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Monorepo**: pnpm workspaces + Turborepo
- **Embeddings**: OpenAI text-embedding-3-small

## API Routes

- `GET /health` - Health check
- `GET /v1/discover?q=...` - Natural language API discovery
- `GET /v1/apis` - List all APIs
- `GET /v1/apis/:slug` - Get API details
- `ALL /v1/proxy/:apiSlug/*` - Proxy requests to external APIs
- `GET /v1/keys` - List API keys
- `POST /v1/keys` - Create API key
- `GET /v1/usage` - Get usage statistics

## Development

```bash
# Build all packages
pnpm build

# Run dev mode
pnpm dev

# Lint
pnpm lint

# Clean build artifacts
pnpm clean
```

## Database Management

```bash
cd packages/api

# Generate migrations from schema changes
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

## Adding New APIs

Add YAML files to the `apis/` directory following the structure in `apis/weather.yaml`.

## License

MIT
