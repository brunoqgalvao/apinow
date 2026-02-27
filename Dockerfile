FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY packages/api/package.json packages/api/tsconfig.json ./packages/api/
RUN pnpm install --frozen-lockfile

COPY packages/shared/ ./packages/shared/
COPY packages/api/ ./packages/api/
RUN pnpm --filter @apinow/shared build
RUN pnpm --filter @apinow/api build

FROM base AS production
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
RUN pnpm install --frozen-lockfile --prod

COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/api/dist ./packages/api/dist
COPY packages/api/drizzle ./packages/api/drizzle
COPY packages/api/drizzle.config.ts ./packages/api/drizzle.config.ts

EXPOSE 3001
ENV PORT=3001
CMD ["node", "packages/api/dist/index.js"]
