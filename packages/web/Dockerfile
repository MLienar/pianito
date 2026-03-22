FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/web/package.json ./packages/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --filter @pianito/web --filter @pianito/shared

FROM base AS build
WORKDIR /app
COPY --from=deps /app .
COPY packages/shared ./packages/shared
COPY packages/web ./packages/web
COPY tsconfig.json ./
RUN pnpm --filter @pianito/shared build && pnpm --filter @pianito/web build

FROM nginx:alpine AS runtime
COPY --from=build /app/packages/web/dist /usr/share/nginx/html
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
