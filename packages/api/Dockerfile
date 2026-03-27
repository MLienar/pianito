FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --filter @pianito/api --filter @pianito/shared

FROM base AS build
WORKDIR /app
COPY --from=deps /app .
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api
COPY tsconfig.json ./
RUN pnpm --filter @pianito/shared build && pnpm --filter @pianito/api build

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build /app/packages/api/dist ./packages/api/dist
COPY --from=build /app/packages/api/package.json ./packages/api/
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/api/drizzle ./packages/api/drizzle
COPY packages/api/drizzle.config.ts ./packages/api/

ENV NODE_ENV=production
EXPOSE 3000
WORKDIR /app/packages/api
CMD ["node", "dist/cluster.js"]
