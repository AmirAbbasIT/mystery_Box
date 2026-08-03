# Admin Panel (Phase 2 plan)

**Status: all three phases are now live.** Phase 2a catalogue content is fully built end-to-end
(DB → service → admin UI) for every entity — Products, Categories, Themes, Prize Pools, Birthday
Packages, Seasonal Collections — plus Phase 2b's custom-requests inbox and Site Settings, and now
Phase 2c: real guest checkout via Stripe, plus `/admin/orders`/`/admin/customers`. Decisions below
were made explicitly with the user rather than assumed, since they're hard to reverse cheaply
later — recorded here so they're not re-litigated by accident.

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
  - **Production incident (Aug 2026):** first real Vercel deployment crashed `/admin` with
    Postgres `(EMAXCONN) max client connections reached, limit: 200`. Root cause was in
    `src/lib/db/client.ts`: the `globalThis` singleton cache was gated `if (NODE_ENV !==
    "production")` — a pattern copied from traditional single-process Node hosting, where you
    *want* a fresh client in production (one stable process, created once) and only need the
    dev-mode cache to survive hot-reload. On Vercel, "production" is many short-lived serverless
    instances that can go **warm** and get reused across requests — gating the cache to dev-only
    meant production never reused a pool at all, opening a brand-new one on every single call
    (three per admin dashboard load, since Products/Categories/Themes fetch in parallel). Fixed by
    caching unconditionally, plus `max: 1` on the pg.Pool (`DATABASE_URL` already points at
    Supabase's transaction-mode pooler, which does its own multiplexing — each serverless instance
    should hold as few real connections to it as possible, per Prisma's own serverless guidance).

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

BirthdayPackages/SeasonalCollections get the same `page.tsx` + `[id]/page.tsx` + `new/page.tsx` +
`actions.ts` + a shared `*Form.tsx` shape as `products/`, replicating what's already there rather
than a new pattern — Prize Pools already does (see below).

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
| Prize Pools ✅ live (wheel only) | table: name, kind, price, prize count | name, slug, kind, quantity (egg only), price, image (real upload via `ImagePicker`), **nested prize-item editor** (label, rarity, weight, reorder via ↑/↓, live odds %) — **plus a live spinning preview** for `kind: "wheel"` (see below) | `src/data/prize-pools.ts` |
| Birthday Packages ✅ live | table: name, audience, price from | name, slug, audience, description, price from, includes (list), age range, themes (multi-select) | `src/data/birthday-packages.ts` |
| Seasonal Collections ✅ live | table: name, date range, product count | name, slug, description, start/end date, hero image, product picker (multi-select) | `src/data/seasonal.ts` |

Each list/form pair is a thin admin page calling its matching service's `list()`/`get()`/
`create()`/`update()` — no admin-specific business logic beyond form validation. One exception:
`deleteCategoryAction` catches Prisma's `P2003` (foreign key violation) specifically, since
`Product.categoryId` has no cascade — deleting a category still assigned to products returns a
friendly inline error instead of a hard crash. Deleting a Theme has no such guard because
`ProductTheme.theme` *is* `onDelete: Cascade` — that's an intentional difference (removing a theme
just untags it from products, not destructive to the product itself).

**Live preview panels** (Products, Themes, Prize Pools): a client-side, controlled-input mirror of
the form's own fields rendered next to it, so the admin sees the result before saving. Products'
preview literally imports `ProductCard`'s own `.module.scss` (not a re-implementation) so it's
pixel-true to the real storefront card, swapping only `next/image` for a plain `<img>` and dropping
the entrance animation, since both fight live typing. Themes' preview is new UI, not a mirror of
anything — a repo-wide grep confirmed `Theme.colorSwatch` isn't rendered anywhere in the storefront
today (`ProductFilterGrid`'s chips are active/inactive-styled, not swatch-colored), so this is the
first actual visual use of that field, not a copy of an existing one. Prize Pools' preview goes a
step further than pixel-true — it's the **actual live component**: `PrizePoolForm` renders the real
`WheelSpinLoader` (dynamic-imported GSAP wheel, same as `/wheel-spin`) fed directly by the
in-progress prize-item rows, so the admin can genuinely spin the wheel they're still editing,
odds and all, before saving. Only shown for `kind: "wheel"` — there's no equivalent live-preview
component for `kind: "egg"` (no `EggRevealLoader`-based preview built yet), even though Mystery
Eggs is now wired to the storefront the same as Wheel Spin.

## Site Settings — a singleton, not a catalogue entity

`/admin/settings` breaks the list/new/[id] pattern every other admin screen follows, on purpose:
`SiteSettings` is a single DB row (see [[09-database-schema]]), not a list of records, so there's
nothing to list and nothing to create — just one form that reads and updates that one row.
Currently manages exactly one setting: the site's active **colour palette** (4 curated presets —
Blush Rose, Ocean Blue, Meadow Green, Sunset Orange — deliberately distinct hue families, not a
full custom colour editor; see
[[04-design-system]] for the CSS mechanism). Saving calls `revalidatePath('/', 'layout')`, since
the palette affects the storefront's root layout and therefore every single page — the "revalidate
all data" pattern from Next's own docs, not something scoped to one route the way every other
admin action here is. The live preview is the same `data-color-theme` attribute trick used
site-wide, just scoped to a `<div>` instead of `<html>` — real `Button`/`Badge`/`PriceTag`
components, zero duplicated colour values between the preview and the real site.

## Phase 2a completion note: Birthday Packages & Seasonal Collections (Aug 2026)

Both built the same day, replicating the Products/Prize Pools pattern exactly rather than
inventing a new shape — see `src/admin/services/birthday-packages.service.ts` and
`seasonal-collections.service.ts`, and `/admin/birthday-packages` + `/admin/seasonal`. Notes:

- **The Prisma schema and initial migration already had these models** (`BirthdayPackage`,
  `BirthdayPackageInclude`, `BirthdayPackageTheme`, `SeasonalCollection`,
  `SeasonalCollectionProduct`) — written ahead of time in the original `0_init` migration per the
  user's original ask to plan the full entity model up front (see [[06-entities-data-model]]). Only
  the service layer, admin CRUD, storefront wiring, and seed data were missing; no new migration
  was needed for this build.
- **`includes`** (Birthday Packages) is a real one-to-many table (`birthday_package_includes`,
  ordered by `sortOrder`), not a plain string array — same delete-then-recreate-on-update pattern as
  `PrizeItem`/`ProductImage`, exposed to the admin form as a one-line-per-item textarea (same UX as
  Products' `whatCouldBeInside`).
- **`themeIds`** (Birthday Packages) and **`productIds`** (Seasonal Collections) are both
  many-to-many join tables, rendered as a scrollable checkbox-fieldset multi-select in their forms —
  identical mechanism to Products' theme picker.
- **`src/data/birthday-packages.ts` and `src/data/seasonal.ts` were deliberately kept in the repo**,
  matching the precedent already set by `categories.ts`/`themes.ts`/`products.ts`/`prize-pools.ts`:
  no runtime code imports them anymore, but `prisma/seed.mts` mirrors their exact content by hand, so
  they stay as the readable source-of-truth for what the dev seed reproduces. Not deleted, not dead
  weight — a deliberate convention, not an oversight.
- Storefront pages (`/birthday-packages`, `/birthday-packages/kids`, `/birthday-packages/adult-party`,
  `/seasonal`) now call `getBirthdayPackages()`/`getSeasonalCollections()`
  (`src/lib/catalogue.ts`) instead of importing the mock arrays — zero component/type shape changes,
  same as every prior catalogue-to-DB swap this project has done.

## Phase 2b: custom-requests inbox ✅ live

`CustomRequestForm` now POSTs through `src/lib/custom-requests.ts` (a public, create-only write —
no admin auth involved, since this is a customer submitting a request) into the `custom_requests`
table, replacing the old local-only `setIsSubmitted(true)` fake confirmation. `/admin/custom-requests`
is list + detail only (no create/delete — submissions are always customer-originated and kept as a
permanent record, not deleted): the list shows status/contact/occasion/budget/date; the detail page
shows every submitted field read-only plus an editable `status` + `staff_notes` form, moving status
through `new → contacted → quoted → completed/archived`. No auth needed on the public form side —
that's unchanged; only the inbox itself sits behind the PIN gate. One UX tradeoff accepted: the old
"Submit another request" reset button is gone — `useActionState`'s persisted success state doesn't
have a built-in reset the way local component state did, and re-submitting immediately is an edge
case not worth the extra complexity for.

## Phase 2c: checkout, orders & customers ✅ live (Aug 2026)

**Scope decisions locked in with the user before building** (this phase was explicitly flagged as
needing its own scoping conversation, unlike every prior phase which just extended an established
pattern):
- **Guest checkout only** — no customer accounts/login. Matches every other auth decision in this
  project (shared PIN admin, no user auth anywhere). `customers` is a plain email-deduped record
  captured at checkout time, not an authenticated entity — see [[06-entities-data-model]].
- **Stripe Checkout (hosted), not Stripe Elements** — redirect to Stripe's own payment page and
  back, rather than an embedded card form. Least code and PCI/security surface, matching the
  project's recurring "no money to spend yet" constraint (see the Hosting note above).
- **Shop Products only for v1** — Wheel Spin, Mystery Eggs, and Birthday Packages are not
  purchasable yet. Each has its own fulfillment wrinkle a normal product line item doesn't (a wheel
  spin/egg purchase needs the prize resolved server-side *at the moment of purchase*, not just
  added to a cart) — deliberately scoped out rather than bolted on.

**How it actually works, end to end:**
1. **Cart is entirely client-side** — `src/lib/cart/CartContext.tsx`, a React Context +
   `localStorage`-persisted reducer, provided at the root layout. No cart table, no session
   management; this is the correct-sized solution for guest-only checkout. `ProductCard`'s "Peek
   inside" modal is the only add-to-basket entry point today; `Header` shows a live item-count
   badge next to a `/basket` link.
2. **`/basket`** (`BasketView.tsx`) lets the customer adjust quantity/remove lines, then submits a
   form (cart JSON in a hidden field, same serialize-into-hidden-input pattern Prize Pools/Products
   already use for nested data) to `createCheckoutSessionAction`
   (`src/app/basket/actions.ts`). **The server never trusts the client's cart snapshot** — every
   `productId` is re-looked-up against `products` for current price/stock/active before a Stripe
   Checkout Session is created; a stale or tampered cart gets a clear inline error, not a bad
   charge. On success, `redirect()`s straight to Stripe's hosted `session.url`.
3. **The Stripe webhook is the only place an `Order` is ever created** — see
   [[09-database-schema]]'s Orders & customers section for the full reasoning (idempotency,
   why status defaults to `paid` not `pending`, the SetNull FK). Route:
   `src/app/api/webhooks/stripe/route.ts` (raw-body signature verification via
   `STRIPE_WEBHOOK_SECRET`) → `src/lib/orders.ts`'s `fulfillCheckoutSession()` (Customer upsert +
   Order/OrderItem creation + stock decrement, one transaction).
4. **`/checkout/success`** looks up the Order by `stripe_checkout_session_id` and shows a real
   receipt if the webhook has already landed, or a generic "confirmation coming by email" message if
   it hasn't yet (a real race — the browser's redirect back can arrive before Stripe's webhook does
   — handled gracefully rather than erroring). Also clears the cart client-side. **`/checkout/cancel`**
   is a simple "no payment taken, your basket is still here" page.
5. **`/admin/orders`** (list + detail with a status dropdown: `paid → fulfilled/cancelled`) and
   **`/admin/customers`** (list with email search + detail showing order history) are read/status-
   update only, per the original plan — no create/delete, since every row here traces back to a
   real Stripe payment. `src/admin/services/orders.service.ts` /
   `customers.service.ts` own this read layer.

**Requires user-supplied Stripe credentials to actually process a payment**: `STRIPE_SECRET_KEY`
and `STRIPE_WEBHOOK_SECRET` in `.env.local` (see `.env.local.example`) — nothing in this build can
create real Stripe keys; test-mode ones from the Stripe dashboard are enough to exercise the whole
flow before going live.

**Not addressed by this build, worth tracking:**
- **Admin auth is still the shared PIN**, not upgraded to per-staff accounts — this is exactly the
  point the project's own plan (see **Access control** above) said to revisit, since `/admin/orders`
  and `/admin/customers` are now real customer PII (name, email, shipping address) behind that same
  gate. Deliberately not blocking this build on that upgrade — implemented as planned, but flagged
  again here since this is the trigger point the earlier note was written for.
- Stock-decrement race under concurrent purchases of the last unit — see
  [[09-database-schema]]'s accepted-limitation note.
- No refund flow — cancelling an order in `/admin/orders` updates our `status` only, it does not
  call Stripe to actually refund the charge.

## Explicitly deferred (not in this planning pass)

- Per-staff accounts, roles/permissions, audit log — see **Access control** for when to revisit.
- Bulk import/export (CSV etc.) for catalogue data.
- Analytics/reporting beyond simple counts on the dashboard home.
- ~~Image upload UI~~ **Built:** `src/admin/components/ImagePicker/` (upload, thumbnail preview,
  remove) backed by Supabase Storage — see [[09-database-schema]]'s resolved open question. Used
  by Products (multiple images + alt text) and Categories (single hero image).
- Drag-and-drop reordering for multi-image pickers (Products) — currently upload order only, no
  manual reorder. Not needed yet with one photo per product being the common case.
