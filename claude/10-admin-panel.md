# Admin Panel (Phase 2 plan)

**Status: Products is built end-to-end (DB → service → admin UI); the rest of this doc is still
the plan.** Decisions below were made explicitly with the user rather than assumed, since they're
hard to reverse cheaply later — recorded here so they're not re-litigated by accident.

## Decisions locked in

- **Embedded `/admin` route group in this Next.js app**, not a separate Vite app. [[07-roadmap]]'s
  original Phase 2 sketch proposed a standalone admin app up front; the user chose to defer that,
  consistent with how Phase 1 already deliberately deferred the monorepo split (see
  [[02-architecture]]). Revisit only if embedding actually becomes a problem (deploy coupling,
  admin bundle bloating the storefront) — not speculatively.
  - **Hosting note (checked against Vercel's actual pricing, Aug 2026):** splitting into a second
    project was considered specifically to save Vercel free-tier usage, and rejected — Hobby-plan
    limits (bandwidth, function invocations, build minutes, etc.) are pooled at the **account
    level** across every project, not per-project, so two projects on one account share one quota
    rather than getting two. Vercel functions are also serverless per-request, so a storefront
    traffic spike doesn't starve admin the way two apps sharing one server's CPU would — there's no
    performance-isolation win from splitting either. Worth remembering: the Hobby plan is
    restricted to non-commercial use anyway, so Pro ($20/seat/month, usage still pooled per team)
    is needed once this is a live storefront regardless of this decision. The real reasons to split
    later are security blast-radius isolation and independent deploys — see the access-control gap
    below — not billing.
- **Access: a shared PIN/passphrase gate, not per-staff accounts.** Simpler to ship, no user
  management needed for a small team. Explicitly flagged as a gap to revisit — see **Access
  control** below for why.
- **Scope order:** catalogue content first, then the custom-requests inbox, then orders/customers
  last (blocked on Stripe/checkout existing — see [[07-roadmap]]).
- **Business logic lives in a services layer**, decoupled from both the admin UI and the DB engine,
  so either can change independently — this was an explicit ask, not just a nice-to-have. See
  **Layering** below.
- **Everything admin/Phase-2-specific that isn't a Next.js route lives in `src/admin/`** (`auth/`,
  `db/`, `services/`), separate from the Phase 1 storefront's `src/lib/`, `src/data/`, `src/types/`.
  An explicit ask, so admin code reads as one subtree and is easy to physically extract later if a
  separate app is ever justified — see **Folder structure** below for the two Next.js-mandated
  exceptions (`src/proxy.ts`, `src/app/admin/`) that can't move into it.
- **Prisma, not the plain `@supabase/supabase-js` client** (revisited after actually hitting the
  friction — see the Prisma decision note below). The database itself is still Supabase-hosted
  Postgres; only the client library talking to it changed.
  - **Prisma decision note (Aug 2026):** originally chose the plain Supabase client specifically to
    avoid serverless connection-pooling friction and to keep the door open to native Supabase Auth
    + RLS. In practice, the actual pain hit was different: Supabase's PostgREST layer (what
    `supabase-js` talks to) stopped auto-exposing newly created tables to its Data API as of
    ~April 2026, requiring manual `GRANT`/`NOTIFY pgrst, 'reload schema'` after every schema change
    — a Supabase-API-layer problem, not a Postgres one. Prisma connects straight to Postgres via a
    connection string (through `@prisma/adapter-pg`, Prisma 7's required driver-adapter API — see
    [[09-database-schema]]), bypassing PostgREST and that whole class of problem entirely. Tradeoff
    accepted: type-safe queries mean `products.service.ts` no longer hand-maps snake_case rows
    (Prisma generates the types from `prisma/schema.prisma`), at the cost of needing both a pooled
    (`DATABASE_URL`, runtime) and direct (`DIRECT_URL`, CLI/migrations) connection string instead of
    one API key. The native-Supabase-Auth argument for `supabase-js` still applies if that gate ever
    gets adopted — Prisma doesn't block using `@supabase/supabase-js` alongside it later purely for
    Auth/Storage (see [[09-database-schema]]'s open questions on image storage).

## Layering (why "loosely coupled services")

Four layers, each depending only on the one below it:

```
UI (admin pages, storefront pages)
   ↓ calls
Server Actions / Route Handlers   — thin: parse form input, call a service, redirect/respond
   ↓ calls
Services (src/admin/services/*.ts) — business logic: validation, "pick a prize respecting odds",
                                     "compute order total" — engine-agnostic where possible
   ↓ calls
DB client (src/admin/db/)           — the actual Prisma client and queries
```

This is what makes the two hard decisions ([[09-database-schema]]'s engine/client choice, and
admin staying embedded vs. splitting out later) each a one-layer change instead of a rewrite —
proven for real when the DB client was swapped from `supabase-js` to Prisma without touching the
admin UI or Server Actions at all, only `src/admin/db/client.ts` and the internals of
`src/admin/services/products.service.ts`:

- Swapping the DB engine/client touches `src/admin/db/` and the internals of
  `src/admin/services/*.ts` — never the UI or the Server Actions calling them, because they only
  see the services' typed return values, not raw rows.
- Splitting `/admin` into a separate app later (per the original roadmap sketch) touches only the
  Action layer — Server Actions become `fetch()` calls to a real API that wraps the same services.
  The services themselves don't move or change.

`pickWeighted()` (`src/lib/utils.ts`) is the one piece of this logic that already exists — in
Phase 2 it moves into (or is called by) `prize-pools.service.ts` so the weighted pick can be
computed server-side, since there's now a real backend to trust for it (Phase 1 does it
client-side — see [[06-entities-data-model]]).

## Folder structure — Products built, rest planned

See [[03-folder-structure]] for the exact live tree. Two refinements made during the build that
this doc's original sketch didn't anticipate:

- `/admin/login` lives *outside* the `app/admin/(dashboard)/` route group (a Next.js route group —
  doesn't affect the URL, just groups shared layout), so the PIN-gated nav shell in
  `(dashboard)/layout.tsx` never wraps the login page itself.
- Everything non-route (auth, DB client, services) lives in `src/admin/`, not scattered across
  `src/lib/` and `src/services/` — see the Decisions locked in section above.

Themes/PrizePools/BirthdayPackages/SeasonalCollections each get the same
`page.tsx` + `[id]/page.tsx` + `new/page.tsx` + `actions.ts` + a shared `*Form.tsx` shape as
`products/`, replicating what's already there rather than a new pattern.

Also: Next.js 16 renamed `middleware.ts` to `proxy.ts` (middleware is deprecated) — the actual gate
lives at `src/proxy.ts`, not the `middleware.ts` this doc originally assumed. Check
`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` before touching it.

## Access control

Mechanism, as built: `ADMIN_PIN_HASH` env var (never the raw PIN, generated via
`node scripts/hash-admin-pin.mjs <pin>`, scrypt salt:hash) → `/admin/login`'s Server Action
(`src/app/admin/login/actions.ts`) verifies it via `src/admin/auth/pin.ts` → on match, signs a
12-hour JWT (`src/admin/auth/session.ts`, `jose`) into an `httpOnly` cookie → `src/proxy.ts` checks
that cookie on every `/admin/*` request except `/admin/login` (optimistic check) → every admin
Server Action also calls `requireAdmin()` (`src/admin/auth/dal.ts`) independently, per Next's
documented auth guidance that proxy/middleware alone isn't a sufficient boundary.

**Explicitly flagged, not silently accepted:** a shared PIN means no per-staff accountability —
there's no record of *which* staff member edited a price, changed prize odds, or viewed a
customer's order. That's an acceptable tradeoff for catalogue-only editing by a small trusted team
today. It stops being acceptable once **orders/customers** (Phase 2c) are in scope, since that's
real customer PII behind the same gate. Revisit before Phase 2c ships — swapping the PIN check for
Supabase Auth is a change to `src/proxy.ts`, `src/admin/auth/`, and the login page only, not to any
service or the routes/pages above, because of the layering above.

## Error handling

`src/app/admin/error.tsx` wraps everything under `/admin` (login + dashboard) in Next's
file-convention error boundary, so an unhandled throw — most commonly Prisma's "Can't reach
database server" during a transient Supabase/network hiccup — shows a friendly "Something went
wrong" page with a **Try again** button (`unstable_retry()`, Next 16.2+; prefer this over the
older `reset()`) and a link back to `/admin`, instead of crashing to Next's raw dev/prod overlay.
Worth knowing: `error.message` is only the real message in development — in production Next
deliberately replaces Server Component error messages with a generic one plus a `digest` ID, to
avoid leaking internals to the client. Both are shown in the fallback UI; `digest` is what you'd
grep server logs for once this is deployed. Scoped to `/admin` only, not the whole storefront —
Phase 1 pages don't hit the database yet, so this class of error can't happen there.

## Phase 2a: catalogue content (build first)

| Entity | List view | Form fields | Replaces |
|---|---|---|---|
| Products ✅ live | table: name, category, price, stock, active toggle | name, slug, description, price, category, themes (multi-select), images (real upload via `ImagePicker`, multiple + alt text), age suitability, stock, "what could be inside" lines, featured/seasonal flags — **plus a live preview panel** (see below) | `src/data/products.ts` |
| Categories ✅ live | table: name, slug, product count | name, slug, tagline, hero image (real upload via `ImagePicker`, single) | `src/data/categories.ts` |
| Themes ✅ live | table: swatch dot, name, slug, product count | name, slug, colour swatch (colour picker + hex input), description — **plus a live preview panel** (see below) | `src/data/themes.ts` |
| Prize Pools | table: name, kind, item count | name, slug, kind, quantity (egg only), price, image, **nested prize-item editor** (label, rarity, weight, reorder) | `src/data/prize-pools.ts` |
| Birthday Packages | table: name, audience, price from | name, slug, audience, description, price from, includes (list), age range, themes | `src/data/birthday-packages.ts` |
| Seasonal Collections | table: name, date range | name, slug, description, start/end date, hero image, product picker | `src/data/seasonal.ts` |

Each list/form pair is a thin admin page calling its matching service's `list()`/`get()`/
`create()`/`update()` — no admin-specific business logic beyond form validation. One exception:
`deleteCategoryAction` catches Prisma's `P2003` (foreign key violation) specifically, since
`Product.categoryId` has no cascade — deleting a category still assigned to products returns a
friendly inline error instead of a hard crash. Deleting a Theme has no such guard because
`ProductTheme.theme` *is* `onDelete: Cascade` — that's an intentional difference (removing a theme
just untags it from products, not destructive to the product itself).

**Live preview panels** (Products, Themes): a client-side, controlled-input mirror of the form's
own fields rendered next to it, so the admin sees the result before saving. Products' preview
literally imports `ProductCard`'s own `.module.scss` (not a re-implementation) so it's pixel-true
to the real storefront card, swapping only `next/image` for a plain `<img>` and dropping the
entrance animation, since both fight live typing. Themes' preview is new UI, not a mirror of
anything — a repo-wide grep confirmed `Theme.colorSwatch` isn't rendered anywhere in the storefront
today (`ProductFilterGrid`'s chips are active/inactive-styled, not swatch-colored), so this is the
first actual visual use of that field, not a copy of an existing one.

## Phase 2b: custom-requests inbox

`CustomRequestForm` (already live, currently shows a static confirmation — see [[08-features]])
starts POSTing through `custom-requests.service.ts` into the `custom_requests` table instead. The
admin inbox is list + detail only (no create — submissions are always customer-originated): filter
by `status`, read the request, add `staff_notes`, move status through
`new → contacted → quoted → completed/archived`. No auth needed on the public form side — that's
unchanged; only the inbox itself sits behind the PIN gate.

## Phase 2c: orders & customers

Blocked on Stripe/checkout existing per [[07-roadmap]] — there's nothing for this screen to show
until real orders exist. Once they do: order list (filter by status), order detail (line items,
customer, status update dropdown), basic customer lookup (email search → their order history). No
new business logic beyond what checkout already needs to write — this is read/status-update only.

## Explicitly deferred (not in this planning pass)

- Per-staff accounts, roles/permissions, audit log — see **Access control** for when to revisit.
- Bulk import/export (CSV etc.) for catalogue data.
- Analytics/reporting beyond simple counts on the dashboard home.
- ~~Image upload UI~~ **Built:** `src/admin/components/ImagePicker/` (upload, thumbnail preview,
  remove) backed by Supabase Storage — see [[09-database-schema]]'s resolved open question. Used
  by Products (multiple images + alt text) and Categories (single hero image).
- Drag-and-drop reordering for multi-image pickers (Products) — currently upload order only, no
  manual reorder. Not needed yet with one photo per product being the common case.
