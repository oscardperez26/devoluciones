# AGENTS.md

## Project overview
This repository contains V1 of a returns-management system.

## Mandatory stack
- NestJS backend
- React + Vite frontend
- PostgreSQL + Prisma
- Redis + BullMQ
- Zod validation
- Zustand + TanStack Query

## Read first
- README.md
- CLAUDE.md
- docs/arquitectura_v3.md

## Implementation rules
- Do not switch to Express or Next.js
- Do not redesign architecture without explicit request
- Keep V1 scope only
- Respect ReturnAccessService design
- Keep admin auth separate from customer order+email access
- Prefer small, verifiable changes

## Validation commands
- install: `pnpm install`
- backend lint: `pnpm --filter api lint`
- backend test: `pnpm --filter api test`
- backend typecheck: `pnpm --filter api typecheck`
- frontend lint: `pnpm --filter web lint`
- frontend test: `pnpm --filter web test`
- frontend typecheck: `pnpm --filter web typecheck`

## Expected modules
- return-access
- orders
- returns
- evidences
- stores
- notifications
- admin
- audit