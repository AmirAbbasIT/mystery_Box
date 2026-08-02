# Architecture

## Phase boundary

This repo is now **mid-Phase-2**, not Phase-1-only — Products, Categories, Themes, and the Wheel
Spin `PrizePool` are live in a real Supabase Postgres database (via Prisma) and the storefront reads
them for real, not from mock data. See [[09-database-schema]]/[[10-admin-panel]] for how that got
built. `PrizePool` rows with `kind: "egg"` (Mystery Eggs), BirthdayPackage, and SeasonalCollection
are still Phase 1: no admin CRUD/DB rows for the first, and no admin CRUD at all for the latter two,
so Mystery Eggs, Birthday Packages, and Seasonal still read the typed mock files in `src/data/`.
There is still no auth for customers, no payments, and no real basket. The mock data was
deliberately shaped to match the entities documented in [[06-entities-data-model]] specifically so
this kind of partial swap — done per-entity (and even per-`kind`, for PrizePool) rather than
all-at-once — was possible without touching component shapes. See [[07-roadmap]] for what's left in
Phase 2 and what Phase 3 adds.

## Stack (Phase 1)

- **Next.js 16 (App Router) + TypeScript, strict mode.** No `output: 'export'` — pages are plain
  SSG (statically generated at build because they use no dynamic data fetching), which keeps the
  door open for adding Route Handlers/ISR/SSR later without a config migration.
- **SCSS with CSS Modules** — the project's "custom design library". See [[04-design-system]].
- **Framer Motion** — general UI motion (entrances, hover/tap, mobile nav drawer, modals). Always
  loaded; it's a core UI dependency.
- **GSAP** — Wheel Spin and Egg Reveal only, dynamically imported so it never ships to pages that
  don't use it. See [[05-animation-strategy]].
- **canvas-confetti** — dynamically imported, win moments only.
- **next/font** — self-hosted Baloo 2 (display) + Nunito Sans (body), no external font requests.
- **next/image** — all product/theme imagery.
- ESLint (flat config, `eslint-config-next` + Prettier integration) + Stylelint (SCSS) + Prettier.

## Why this stack

- Next.js App Router gives SSR/SSG for SEO now, with a clean path to add server-side data fetching
  later without switching frameworks.
- SCSS + CSS Modules (rather than a utility framework) was chosen because the brief explicitly
  asked for a hand-built design system with predefined tokens, not a third-party utility layer.
- GSAP is deliberately *not* used for general UI motion — it's scoped to the two interactions
  (physics-feeling wheel deceleration, egg shake/crack) that a general-purpose animation library
  does less well, and dynamic-imported so its cost is paid only on the pages that need it.

## Important Next.js 16 specifics

Next.js 16 has real breaking changes from older training data. Two that matter here:

- **`params`/`searchParams` are Promises** in Server Components — `const { slug } = await params`.
- **`next/dynamic` with `ssr: false` is only allowed inside a Client Component** (`'use client'`
  file) — calling it directly in a Server Component throws. This is why `WheelSpin`/`EggReveal`
  each have a `*Loader.tsx` client wrapper that does the `dynamic(..., { ssr: false })` call, so
  the Server Component pages can still import them directly.

Before writing new App Router code, check `node_modules/next/dist/docs/01-app/` (bundled with the
installed version) rather than relying on prior knowledge of Next.js.

## Repo layout

Flat single Next.js app at the repo root — **not** a monorepo yet. The user chose this
deliberately over a monorepo-ready `apps/web` layout for Phase 1, since there's no admin
dashboard or API service to isolate yet. See [[07-roadmap]] for when that changes.

## Data flow

Two parallel paths now, depending on the entity:

- **Products, Categories, Themes, Wheel Spin's `PrizePool` (DB-backed):** `src/lib/catalogue.ts`
  (server-only, calls Prisma via the shared `src/lib/db/client.ts`) → `await`ed directly inside
  `async` Server Component pages (`src/app/page.tsx`, `src/app/shop/**`, `src/app/wheel-spin/`) →
  passed as props into presentational/client components exactly as before — `ProductCard`,
  `ProductGrid`, `ProductFilterGrid`, `ShopByCategory`, and `WheelSpinLoader` didn't change shape,
  they just now receive their data as explicit props instead of importing `@/data/*` directly (some
  are Client Components, which can't `await` Prisma themselves — see [[10-admin-panel]] for the
  equivalent pattern on the admin side, including a live preview that reuses `WheelSpinLoader`
  directly). Pages using this path set `export const revalidate = 60` — ISR, not full SSR — so
  admin edits show up within a minute without hitting Postgres on every single page view.
- **Mystery Eggs' `PrizePool` rows, BirthdayPackage, SeasonalCollection (still mock):**
  `src/data/*.ts` (typed mock arrays) → imported directly into Server Component pages → passed as
  props, unchanged from Phase 1. No fetch layer, no DB round-trip, available at build time. Note
  `PrizePool` itself is split by `kind` across both paths — `"wheel"` is DB-backed, `"egg"` isn't,
  since it's the same table but only Wheel Spin has been wired to the storefront so far.

`src/lib/utils.ts` has the one piece of "business logic" that predates the backend and still
applies to the mock-data path: `pickWeighted()`, a weighted-random selector used by both WheelSpin
and EggReveal to choose a prize client-side from a `PrizePool`'s `weight` values.

Because the storefront now genuinely talks to a database, it can hit real errors it never could in
Phase 1 (a transient "can't reach database server", for instance) — `src/app/error.tsx` is the
root error boundary that catches this, mirroring `src/app/admin/error.tsx`. See
[[10-admin-panel]]'s Error handling section for the dev-vs-production error detail nuance, which
applies here too.
