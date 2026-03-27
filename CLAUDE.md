# Pianito

## Project structure

pnpm monorepo with three packages:
- `packages/api` — Backend API (Fastify + Drizzle + PostgreSQL)
- `packages/web` — Frontend (React + Vite + TanStack Router)
- `packages/shared` — Shared types, schemas, and utilities

## Commands

- `pnpm dev` — Start all packages in dev mode
- `pnpm check` — Run lint + typecheck + tests (use this to validate changes)
- `pnpm lint` — Biome check
- `pnpm lint:fix` — Biome auto-fix
- `pnpm typecheck` — TypeScript check across all packages
- `pnpm test` — Vitest unit tests
- `pnpm e2e` — Playwright end-to-end tests

## Conventions

- **Linter/formatter**: Biome (not ESLint/Prettier)
- **Branching**: Use `ts-pattern` `match()` instead of switch/if-else for type-safe branching
- **Tests**: Vitest for unit, Playwright for e2e
- **Commits**: Conventional commits (feat:, fix:, refactor:, etc.)
- **Package manager**: pnpm (never npm or yarn)
- **i18n**: All user-facing text in `packages/web` must use `react-i18next`. Never hardcode strings in JSX — use `t("namespace.key")` from `useTranslation()`. When adding or modifying rendered text, always add the corresponding translation keys to all four locale files in `packages/web/src/localizations/` (en, fr, es, zh)
