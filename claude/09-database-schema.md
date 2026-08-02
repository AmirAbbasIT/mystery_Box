# Database Schema (Phase 2 plan)

**Status: catalogue tables are live in a real Supabase Postgres database, queried via Prisma, and
read by both the admin panel and the real storefront.** The database *engine* is Supabase-hosted
Postgres (resolved below); the *client library* talking to it is **Prisma** (`@prisma/client` +
`@prisma/adapter-pg`), not the `@supabase/supabase-js` REST client this doc originally assumed —
see [[10-admin-panel]]'s Decisions locked in for why that changed. `prisma/schema.prisma` is now
the source of truth for the schema (matching the tables below exactly); `prisma/migrations/0_init/`
is the baseline migration recording what's already live (plus incremental migrations since —
`prisma migrate dev` is the normal workflow now that `DIRECT_URL` is configured, not the manual
`migrate resolve` dance the baseline needed). Two consumers, one shared client
(`src/lib/db/client.ts`, deliberately moved out of `src/admin/` once the storefront needed it too):
`src/admin/services/*.ts` (admin writes, all rows including inactive) and `src/lib/catalogue.ts`
(storefront reads, active-only, shaped to match the existing `Product`/`Category`/`Theme`/
`PrizePool` types exactly — see [[02-architecture]]'s Data flow section). `orders`/`customers`/
`custom_requests` tables (see below) aren't written yet — Phase 2b/2c per [[10-admin-panel]].
`BirthdayPackage`/`SeasonalCollection` tables exist in this schema but have no admin CRUD yet —
those storefront pages still read `src/data/` untouched. `PrizePool` (both `kind` values) is fully
live. `SiteSettings` (see below) is a small addition for the colour-palette feature, not part of
the original catalogue plan.

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

### Orders & customers (net-new — Phase 2 stubs today in `src/types/order.ts` / `customer.ts`)

```
customers    (id, email unique, name, created_at)
orders       (id, customer_id fk→customers, status text check in
             ('pending','paid','fulfilled','cancelled'), total_pence int, created_at)
order_items  (id, order_id fk→orders, product_id fk→products, quantity int, unit_price_pence int)
```

`order_items.unit_price_pence` is captured at order time (not read live from `products.price_pence`
at display time) — prices change; an order must show what the customer actually paid, not today's
price.

### Custom requests (net-new — Phase 2 persistence for `CustomRequestInput`)

```
custom_requests (id, recipient_type text check in ('kids','adult'), age_range, occasion,
                 theme_preference text null, budget_pence int, notes text null,
                 contact_name, contact_email,
                 status text check in ('new','contacted','quoted','completed','archived')
                 default 'new',
                 staff_notes text null, created_at, updated_at)
```

`status`/`staff_notes` are the only fields not already in `CustomRequestInput` — added so
[[10-admin-panel]]'s inbox has something to triage against.

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
`price` → `price_pence` unit change above. `prisma/seed.mjs` does this today for Categories and
Themes (run via `npx prisma db seed`); Products/PrizePools/BirthdayPackages/SeasonalCollections
aren't seeded yet since their admin CRUD isn't built (see [[10-admin-panel]]).

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
  `products.service.ts` actually does *not* use yet — it currently does a real `delete`. Revisit if
  hard-deleting a product that's referenced by past orders ever becomes a real scenario (it isn't
  yet, since `order_items` doesn't exist).
