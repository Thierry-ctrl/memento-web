# Memento

Premium Kigali photo-experience website with booking requests, availability management, and a protected administrator workspace.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/memento run dev` — run the Memento website through its managed workflow
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required secret: `ADMIN_EMAIL` — allowlisted administrator email
- Optional env: `VITE_PUBLIC_CONTACT_EMAIL` — public contact email; hidden when absent

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/memento` — React website, routes, booking flow, and admin UI
- `artifacts/memento/src/index.css` — central Memento visual tokens
- `lib/api-spec/openapi.yaml` — API contract
- `lib/db/src/schema/memento.ts` — booking, availability, notes, and settings schema
- `artifacts/api-server/src/routes/memento.ts` — booking and admin API

## Architecture decisions

- Bookings are requests, never instant confirmations.
- A saved booking is not rolled back if optional notification delivery is unavailable.
- Pending requests may overlap but are conflict-flagged; confirmed and blocked windows are publicly unavailable.
- The fallback brand palette is centralized so final Figma variables can replace it without component edits.

## Product

Public brand pages, editorial gallery placeholders, a locally persisted five-step booking request, confirmation references, WhatsApp follow-up, and protected booking/availability administration.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
