# Entities & Data Model

All types live in `src/types/` (one file per entity, barrel-exported from `src/types/index.ts`).
**Product, Category, Theme, PrizePool/PrizeItem, BirthdayPackage, and SeasonalCollection are all
now live in Postgres** — `src/lib/catalogue.ts` maps DB rows onto these exact same types, which is
why every mock-to-DB swap so far has touched zero component shapes (see [[02-architecture]]'s Data
flow section). `src/data/*.ts` mock files for these entities are kept in the repo deliberately, not
imported anywhere at runtime — see [[10-admin-panel]]'s Phase 2a completion note for why.

## Product (`types/product.ts`, DB-backed via `lib/catalogue.ts`)

The catalogue item for the three shop categories (Jewellery, Makeup & Beauty, Stationery). Key
fields: `category` (`CategorySlug`), `themeIds` (links to `Theme`), `price` (GBP as a plain
number, e.g. `10` = £10.00 — formatted via `formatPrice()` in `lib/utils.ts`; the Prisma `Product`
model stores this as `pricePence`, an integer, converted at the `lib/catalogue.ts` boundary),
`whatCouldBeInside` (the UK-consumer-law-motivated transparency panel content, shown in a `Modal`
via the "Peek inside" button on every `ProductCard`), `featured`/`seasonal` flags. `images` isn't
guaranteed non-empty for real products the way every mock product was — `ProductCard` handles a
missing image with a placeholder rather than assuming `images[0]` exists.

## Category (`types/category.ts`, DB-backed via `lib/catalogue.ts`)

Just the three shop categories — `jewellery`, `makeup-beauty`, `stationery`. Deliberately not a
generic catalogue-wide taxonomy; Mystery Eggs, Wheel Spin, and Birthday Packages are separate
top-level sections (see below), not `Category` values, because they have fundamentally different
shapes (a `PrizePool` vs a `Product`). `priceFrom` isn't a stored column — `lib/catalogue.ts`
computes it as `min(price)` across that category's active products via a Prisma `groupBy`, exactly
as planned in [[09-database-schema]].

## Theme (`types/theme.ts`, DB-backed via `lib/catalogue.ts`)

Cross-cutting tags (Kawaii Pastels, Y2K Sparkle, etc. — see [[01-overview]] for why these are
original rather than licensed character themes) that both `Product` and `BirthdayPackage` can
reference via `themeIds`, so the storefront can filter across categories by theme
(`ProductFilterGrid` does this today on the three shop category pages). `ProductCard` and
`ProductFilterGrid` used to import the mock `themes` array directly inside the component — now
that theme IDs are real DB UUIDs (not the old `"theme-kawaii-pastels"`-style mock IDs), both
instead take `themes` as a prop from a Server Component ancestor that calls `getThemes()`.

## PrizePool / PrizeItem (`types/prize-pool.ts`, DB-backed via `lib/catalogue.ts` — both kinds)

Backs **both** Wheel Spin and Mystery Eggs — `kind: "wheel" | "egg"` distinguishes them, same table
in Postgres (`prize_pools`/`prize_items`) either way, and both are fully wired to the storefront now
(`getWheelPrizePool()` / `getEggPrizePools()`). `quantity` is set for egg tiers (1/5/10/15) and
`undefined`/`null` for the wheel. Each `PrizeItem` has a `weight` (relative odds, genuinely
admin-editable at `/admin/prize-pools` without touching code — the nested prize-item editor
supports reordering and shows live odds %) and a `rarity` (`common | uncommon | rare | jackpot`,
drives the `RevealPanel` badge color/label). `pickWeighted()` in `lib/utils.ts` still does the
actual weighted-random selection **client-side** for both kinds — wiring these to the database
changed where the prize *data* comes from, not where the pick happens; there is still no
server-side odds enforcement (see [[07-roadmap]] — that remains a real Phase 2/3 concern, since a
motivated user could inspect the client-side weights before spinning).

## BirthdayPackage (`types/birthday-package.ts`, DB-backed via `lib/catalogue.ts`)

`audience: "kids" | "adult-party"` splits the two Birthday Packages sub-pages. `includes` is
exposed to the type as a plain string list, but is a real one-to-many table
(`birthday_package_includes`, ordered) at the DB layer, not a Postgres array column — same
delete-then-recreate-on-update pattern as `PrizeItem`/`ProductImage`. `themeIds` is a genuine
many-to-many join (`birthday_package_themes`), admin-editable via a checkbox multi-select in
`/admin/birthday-packages`, same mechanism as Products' theme picker. Still string labels, not
`Product`/`PrizePool` references — that remains a possible future step if packages ever need real
inventory tracking, not something this build added.

## CustomRequestInput (`types/custom-request.ts`, DB-backed — Phase 2b, live)

Backs `CustomRequestForm` at its own dedicated `/custom-request` page — recipient type, age range,
occasion, theme preference, budget, notes, contact details. **This is a custom gift-box-packing
request for one recipient, not a party-booking or multi-person quote** — `budget` is GBP *per
box*, not per attendee (an earlier version of this form was framed around party planning with a
per-person budget; that framing was deliberately dropped). Originally embedded twice, once per
`/birthday-packages/{kids,adult-party}` page via a `defaultRecipientType` prop — now one form, one
page, with an in-form Kids/Adult toggle instead. Persisted via `src/lib/custom-requests.ts` (public
write, no admin auth) into the `custom_requests` table, replacing the old client-only
`setIsSubmitted(true)` fake confirmation; triaged at `/admin/custom-requests` — see
[[10-admin-panel]].

## SeasonalCollection (`types/seasonal.ts`, DB-backed via `lib/catalogue.ts`)

Christmas/Valentine's/Mother's Day/Easter drops. `productIds` is a real many-to-many join
(`seasonal_collection_products`), admin-editable via a checkbox multi-select of every product in
`/admin/seasonal` — still intentionally empty for every seeded collection, since real seasonal SKUs
get assigned closer to each date, but the picker is fully wired and ready for that. The
pages/routing exist ahead of stock so the seasonal calendar structure is already in place.

## Order / OrderItem / Customer (`types/order.ts`, `types/customer.ts`)

**Phase 2 stubs, not wired to any UI.** Defined now so the shape is agreed before checkout/auth
get built, per the original request to plan the full entity model up front. Nothing in Phase 1
constructs these.
