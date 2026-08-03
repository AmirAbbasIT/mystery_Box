# Roadmap

## Phase 1 — this build (current)

Static, animated, accessible, mobile-first Next.js site. All sections built: Home, Shop (3
categories with theme/price filtering), Mystery Eggs (tier selector + interactive reveal),
Wheel Spin, Birthday Packages (kids + adult, each with a custom-request builder), Seasonal, About,
Contact, Legal Notice, 404. Mock data only, no backend, no payments, no real basket — see
[[02-architecture]] for the phase boundary and [[08-features]] for the pre-launch punch list of
placeholder content that needs replacing.

## Phase 2 — dynamic backend + admin

Planning for this phase is now written up in detail — see [[09-database-schema]] (tables, engine
tradeoff) and [[10-admin-panel]] (admin architecture, access control, scope). Key decisions made
so far:

- Database engine (**Supabase** vs **Firebase**) is deliberately left open — see
  [[09-database-schema]]'s comparison table; Supabase is the documented recommendation given how
  relational the existing entity model already is, but the final call is still pending.
- Business logic lives in a **services layer** (`src/services/*.ts`), sitting between Server
  Actions/Route Handlers and the DB client, so the storefront and admin dashboard share one
  implementation of things like "pick a prize respecting odds" or "validate a custom request" —
  see [[10-admin-panel]]'s Layering section for the full 4-layer breakdown.
- **Stripe** for checkout/payments (unchanged from original plan) — blocks Phase 2c
  (orders/customers admin) per [[10-admin-panel]].
- **Admin dashboard starts embedded as `/admin` inside this Next.js app**, not a separate app — the
  user chose to defer the standalone-app split (originally sketched as a Vite/React app below)
  the same way Phase 1 deferred the monorepo split. Revisit only if embedding actually becomes a
  real problem, not speculatively.
- **Admin access starts as a shared PIN/passphrase gate**, not per-staff accounts — explicitly
  flagged in [[10-admin-panel]] as something to revisit before Phase 2c (orders/customers) ships,
  since that phase adds real customer PII behind the same gate.
- Build order: **Phase 2a catalogue content admin ✅ (including Birthday Packages/Seasonal
  Collections) → Phase 2b custom-requests inbox ✅ → Phase 2c orders/customers** (blocked on
  Stripe existing) — see [[10-admin-panel]] for the reasoning.
- ~~`CustomRequestInput` becomes a real persisted `CustomRequest`~~ **Done** — see [[10-admin-panel]].
- `PrizePool` odds move from hardcoded mock weights to admin-editable data (Phase 2a) — **done**.
- **Repo restructure to a monorepo** (Turborepo or plain workspaces): `apps/web` (this storefront),
  `apps/admin`, `packages/api`, `packages/types`, `packages/ui`, shared ESLint/Prettier/TypeScript
  config — deferred indefinitely now that admin is starting embedded rather than standalone; only
  becomes relevant if/when the admin app actually gets split out. See [[02-architecture]] for why
  Phase 1 already avoided setting this up speculatively.

## Phase 3 — growth

- Customer accounts / order history (needs the `Customer`/`Order` entities already stubbed in
  [[06-entities-data-model]]).
- SEO content scaling as the catalogue grows.
- Seasonal campaign tooling (so non-technical admin can spin up a new seasonal collection without
  a developer).
- Dark/light theme toggle — deliberately made low-cost by the CSS-custom-property token layer
  built in Phase 1 (see [[04-design-system]]); this was a specific ask ("should not be difficult
  later on").
