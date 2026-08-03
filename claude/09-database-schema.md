# Database Schema (Phase 2 plan)

**Status: every table below is live in a real Supabase Postgres database, queried via Prisma —
catalogue, custom requests, site settings, and now orders/customers/checkout too.** The database
*engine* is Supabase-hosted Postgres (resolved below); the *client library* talking to it is
**Prisma** (`@prisma/client` + `@prisma/adapter-pg`), not the `@supabase/supabase-js` REST client
this doc originally assumed — see [[10-admin-panel]]'s Decisions locked in for why that changed.
`prisma/schema.prisma` is now the source of truth for the schema (matching the tables below
exactly); `prisma/migrations/` records the full history (`0_init` baseline plus one migration per
feature since — `prisma migrate dev` is the normal workflow now that `DIRECT_URL` is configured).
Three consumers, one shared client (`src/lib/db/client.ts`, deliberately moved out of `src/admin/`
once the storefront needed it too): `src/admin/services/*.ts` (admin writes/reads, all rows
including inactive), `src/lib/catalogue.ts` (storefront reads, active-only, shaped to match the
existing `Product`/`Category`/`Theme`/`PrizePool`/`BirthdayPackage`/`SeasonalCollection` types
exactly — see [[02-architecture]]'s Data flow section), and `src/lib/orders.ts` (the one place
`orders`/`customers` rows are ever written — see below). `PrizePool` (both `kind` values),
`BirthdayPackage`, and `SeasonalCollection` are all fully live with admin CRUD — no table in this
schema still reads from `src/data/` at runtime (those mock files are kept only as the seed script's
hand-mirrored reference — see [[10-admin-panel]]'s Phase 2a completion note). `SiteSettings` (see
below) is a small addition for the colour-palette feature, not part of the original catalogue plan.

## Engine: resolved to Supabase

| | Supabase (Postgres) | Firebase (Firestore) |
|---|---|---|
| Fit for this model | Strong — `Product↔Theme` is many-to-many, `Order→OrderItem→Product` needs referential integrity, `PrizePool→PrizeItem` is a clean parent-child. All three are relational joins today's mock arrays already imply via id references. | Weak-to-medium — no native joins; the relations above would need denormalizing (embedding theme names on the product doc, embedding product snapshots in order items) or resolving in app code. |
| Included for free | Auth, Row-Level Security, Storage (product images) | Auth, Storage; security via Firestore rules (less expressive than SQL RLS for cross-collection checks) |
| Migration from mock data | Near-direct — `src/data/*.ts` arrays are already shaped like rows (see below) | Needs restructuring into denormalized documents first |
| Cost model | Predictable, generous free tier | Pay-per-read/write — weighted prize picks and admin list views (many small reads) can add up |

**Recommendation: Supabase.** The typed mock data already models this domain relationally
(`themeIds: string[]` on `Product`, `productIds: string[]` on `SeasonalCollection`,
`prizes: PrizeItem[]` nested under `PrizePool`) — that's foreign keys and joins waiting to happen,
not documents waiting to be denormalized. The schema below is written in Postgres/Supabase terms.
If Firebase is chosen instead, see **Firestore mapping notes** at the bottom rather than redesigning
from scratch.

## Entity-relationship overview

Tables map 1:1 to `src/types/*.ts` files — see [[06-entities-data-model]] for field-level *why*.
`id` columns are `uuid default gen_random_uuid()` throughout; `slug` stays the human-facing
lookup key used in URLs (unique, indexed).

### Catalogue (promoted from `src/data/`)

```
categories        (id, slug unique, name, tagline, hero_image, created_at)
themes             (id, slug unique, name, color_swatch, description, created_at)
products           (id, slug unique, name, description, price_pence int, category_id fk→categories,
                    stock int, active bool, age_suitability text[], what_could_be_inside text[],
                    featured bool default false, seasonal bool default false, created_at, updated_at)
product_images      (id, product_id fk→products, src, alt, sort_order int)
product_themes      (product_id fk→products, theme_id fk→themes, primary key(product_id, theme_id))

prize_pools         (id, slug unique, name, kind text check in ('wheel','egg'), quantity int null,
                    price_pence int, image, created_at, updated_at)
prize_items         (id, prize_pool_id fk→prize_pools, label, rarity text check in
                    ('common','uncommon','rare','jackpot'), weight numeric, sort_order int)

birthday_packages   (id, slug unique, audience text check in ('kids','adult-party'), name,
                    description, price_from_pence int, age_range text null, image, created_at, updated_at)
birthday_package_includes (id, birthday_package_id fk, label, sort_order int)
birthday_package_themes   (birthday_package_id fk, theme_id fk, primary key(birthday_package_id, theme_id))

seasonal_collections (id, slug unique, name, description, starts_at date, ends_at date, hero_image, created_at)
seasonal_collection_products (seasonal_collection_id fk, product_id fk, primary key(seasonal_collection_id, product_id))
```

Notes:
- `price` moves from a plain GBP number to `price_pence` (integer) once it's a real database —
  floating-point currency in a DB invites rounding bugs; `formatPrice()` in `lib/utils.ts` already
  centralizes formatting, so it becomes the one place that also handles the pence→display
  conversion.
- `includes: string[]` (BirthdayPackage) and `what_could_be_inside: text[]` (Product) stay as
  native Postgres arrays, not child tables — they're display-only ordered lists with no fields of
  their own, so a join table would be pure overhead. `product_images` and
  `birthday_package_includes` *do* get child tables because images need `alt` text and ordering
  beyond what an array-of-strings can hold.
- `Category.priceFrom` isn't stored — it's `min(products.price_pence)` for that category, computed
  at query time (or cached/materialized later if it shows up as a real perf cost, not before).

### Orders & customers (live — Phase 2c, guest checkout via Stripe Checkout)

```
customers    (id, email unique, name, created_at)
orders       (id, customer_id fk→customers, status text check in ('paid','fulfilled','cancelled')
             default 'paid', total_pence int, stripe_checkout_session_id unique,
             shipping_name, shipping_line1, shipping_line2 null, shipping_city,
             shipping_postcode, shipping_country default 'GB', created_at, updated_at)
order_items  (id, order_id fk→orders (cascade), product_id fk→products null (set null on delete),
             product_name, unit_price_pence int, quantity int)
```

Key decisions, made explicitly (see [[10-admin-panel]]'s Phase 2c section for the fuller
walkthrough):
- **Guest checkout only — no customer accounts/login.** `customers` exists purely so admin can look
  someone up by email and see their order history; it's populated by an `upsert(where: {email})`,
  never by a signup flow.
- **An `orders` row only ever gets created by the Stripe `checkout.session.completed` webhook**
  (`src/app/api/webhooks/stripe/route.ts` → `src/lib/orders.ts`'s `fulfillCheckoutSession()`), never
  optimistically when the customer clicks "proceed to checkout." A row existing here always means
  Stripe actually confirmed payment — that's also why `status` defaults to `'paid'`, not `'pending'`:
  nothing in this build ever writes a not-yet-paid order.
- `stripe_checkout_session_id` is `unique` specifically for webhook idempotency — Stripe delivers
  webhooks at-least-once, so the handler checks for an existing row with that session ID first and
  no-ops on a duplicate delivery, rather than double-charging inventory or creating two orders for
  one payment.
- `order_items.product_id` is **nullable with `onDelete: SetNull`**, deliberately unlike every other
  child-table FK in this schema (which cascade). `product_name`/`unit_price_pence` are captured at
  order time, not read live from `products` at display time — prices change and products get
  deleted, but an order must always show what the customer actually paid for what they actually
  bought, so the FK going null on a later product deletion must never take the historical row with
  it.
- Stock is decremented (`products.stock`) inside the same transaction as order creation, via
  `updateMany` (not `update`) specifically so a since-deleted product is a silent no-op instead of a
  thrown error — recording a confirmed payment must never fail because of an inventory
  reconciliation edge case. **Known accepted limitation:** this decrement isn't protected against a
  race between two simultaneous checkouts both passing the earlier stock check in
  `createCheckoutSessionAction` — stock could theoretically go negative under concurrent purchases
  of the last unit. Not solved here (no inventory holds/locking) — small-scale, guest-checkout,
  no-real-traffic-yet tradeoff, revisit if it ever actually happens.
- Cart itself (pre-checkout) has **no table** — it's client-only, `localStorage`-persisted React
  state (`src/lib/cart/CartContext.tsx`), matching the guest-checkout/no-accounts posture. The only
  point cart contents cross to the server is `createCheckoutSessionAction`
  (`src/app/basket/actions.ts`), which always re-reads price/stock/active from `products` — the
  client's cart snapshot is a UI convenience copy, never trusted for money.

### Custom requests (live — Phase 2b persistence for `CustomRequestInput`)

```
custom_requests (id, recipient_type text check in ('kids','adult'), age_range, occasion,
                 theme_preference text null, budget_pence int, notes text null,
                 contact_name, contact_email,
                 status text check in ('new','contacted','quoted','completed','archived')
                 default 'new',
                 staff_notes text null, created_at, updated_at)
```

`status`/`staff_notes` are the only fields not already in `CustomRequestInput` — added so
[[10-admin-panel]]'s inbox has something to triage against. Two separate write paths, same
split as the catalogue entities: `src/lib/custom-requests.ts` (public, create-only — the
customer-facing form, no admin auth) vs `src/admin/services/custom-requests.service.ts`
(admin-only, list/get/update-status — never creates a row).

### Site Settings (live — singleton, not a catalogue entity)

```
site_settings (id, active_color_palette text default 'blush-rose', updated_at)
```

Exactly one row ever exists — `site-settings.service.ts`'s `getOrCreateSettings()` is the only
code allowed to touch this table, so nothing else has to reason about "what if the row doesn't
exist yet." `active_color_palette` is a free-text slug validated in application code
(`isValidColorPaletteId()` in `src/lib/color-palettes.ts`) against the 4 curated presets, not a DB
enum — adding a 5th preset later is a code change (new palette + new SCSS block), not a migration.
This table doesn't fit the list/new/[id] admin CRUD pattern the rest of this doc uses — see
[[10-admin-panel]] for why `/admin/settings` is a single form instead.

## Migration path from mock data

Because `src/data/*.ts` was deliberately shaped to match the entity types (see [[02-architecture]]
— "so swapping in a real API touches only the data-fetching layer, not components"), the seed
script is close to a direct transform: iterate each mock array, insert one row per item, resolve
`themeIds`/`productIds` arrays into join-table inserts. No mock field needs renaming except the
`price` → `price_pence` unit change above. `prisma/seed.mts` (TypeScript, run via `npx prisma db
seed`, since the generated Prisma client is TS source — see [[10-admin-panel]]) now seeds
Categories, Themes, Prize Pools, Birthday Packages, and Seasonal Collections this way. Products
aren't seeded (real inventory is admin-entered, not mock-derived) and orders/customers can't be
seeded this way at all — they're only ever created by a real Stripe webhook firing, not a
`create()` call, so there's nothing meaningful to mirror from mock data for them.

## Firestore mapping notes (if Firebase is chosen instead)

- `products`, `themes`, `prize_pools`, `birthday_packages`, `seasonal_collections` become top-level
  collections.
- `product_themes`/`birthday_package_themes` many-to-many joins disappear — embed
  `theme_ids: string[]` directly on the document (matches the current mock shape almost exactly)
  and denormalize `theme name`/`color_swatch` onto the product doc if the storefront needs to
  render a chip without a second read.
- `prize_items` and `product_images` become **subcollections** or embedded arrays on the parent
  doc (embedded is simpler here — neither needs independent querying).
- `order_items` should stay embedded on the `orders` doc (not a subcollection) — an order's line
  items are always read together with the order, never independently.
- Referential integrity (an `order_items` row can't reference a deleted product) is enforced in
  application code / Cloud Functions instead of the database, since Firestore has no foreign keys.

## Open questions still remaining

- ~~Product image storage~~ **Resolved:** Supabase Storage (public `catalogue-images` bucket,
  created via `scripts/create-storage-bucket.mjs`), not the database and not `public/images/`.
  Blobs-in-Postgres was never the right call regardless of volume — Postgres has no CDN, and
  `next/image` needs a URL to fetch, not a column to read. `@supabase/supabase-js` came back into
  the project *only* for this (`src/admin/storage/`) — Prisma still owns every Postgres query. See
  [[10-admin-panel]]'s Phase 2a table for the `ImagePicker` component this powers.
- `products.active = false` (soft delete via flag) is what `deleteProduct()` in
  `products.service.ts` actually does *not* use yet — it currently does a real `delete`. Now that
  `order_items` really exists and references `products`, this is a live (if still unaddressed)
  scenario: deleting a product referenced by past orders is handled at the schema level
  (`onDelete: SetNull` — see the Orders & customers section above), so it won't crash or corrupt
  order history, but the admin has no warning before doing it. Revisit if that gap ever bites.
