# Entities & Data Model

All types live in `src/types/` (one file per entity, barrel-exported from `src/types/index.ts`).
**Product, Category, and Theme are now live in Postgres** — `src/lib/catalogue.ts` maps DB rows
onto these exact same types, which is why the swap from `src/data/*.ts` touched zero component
shapes (see [[02-architecture]]'s Data flow section). PrizePool, PrizeItem, BirthdayPackage, and
SeasonalCollection are still populated by hand-written mock data in `src/data/` — the types were
always written to match what a real backend would return, so their transition (whenever it
happens) will be the same kind of data-fetching-only change.

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

## PrizePool / PrizeItem (`types/prize-pool.ts` — `kind: "wheel"` DB-backed via `lib/catalogue.ts`, `kind: "egg"` still `data/prize-pools.ts`)

Backs **both** Wheel Spin and Mystery Eggs — `kind: "wheel" | "egg"` distinguishes them, same table
in Postgres (`prize_pools`/`prize_items`) either way. `quantity` is set for egg tiers (1/5/10/15)
and `undefined`/`null` for the wheel. Each `PrizeItem` has a `weight` (relative odds, now genuinely
admin-editable at `/admin/prize-pools` without touching code — the nested prize-item editor
supports reordering and shows live odds %) and a `rarity` (`common | uncommon | rare | jackpot`,
drives the `RevealPanel` badge color/label). `pickWeighted()` in `lib/utils.ts` still does the
actual weighted-random selection **client-side** for both kinds — wiring Wheel Spin to the database
changed where the prize *data* comes from, not where the pick happens; there is still no
server-side odds enforcement (see [[07-roadmap]] — that remains a real Phase 2/3 concern, since a
motivated user could inspect the client-side weights before spinning).

## BirthdayPackage (`types/birthday-package.ts`, `data/birthday-packages.ts`)

`audience: "kids" | "adult-party"` splits the two Birthday Packages sub-pages. `includes` is a
plain string list (not structured line items) — good enough for Phase 1 display, would likely
become a list of `Product`/`PrizePool` references in Phase 2 if packages need real inventory
tracking.

## CustomRequestInput (`types/custom-request.ts`)

Backs the guided birthday builder form (`components/forms/CustomRequestForm.tsx`) — recipient
type, age range, occasion, theme preference, budget, notes, contact details. **Not persisted
anywhere yet** — the form validates client-side and shows a static confirmation. Phase 2: this
becomes a real `CustomRequest` entity with a POST endpoint, replacing the "email us" flow the old
site relied on.

## SeasonalCollection (`types/seasonal.ts`, `data/seasonal.ts`)

Christmas/Valentine's/Mother's Day/Easter drops. `productIds` is intentionally empty in every
current entry — real seasonal SKUs get added closer to each date. The pages/routing exist ahead of
stock so the seasonal calendar structure is already in place.

## Order / OrderItem / Customer (`types/order.ts`, `types/customer.ts`)

**Phase 2 stubs, not wired to any UI.** Defined now so the shape is agreed before checkout/auth
get built, per the original request to plan the full entity model up front. Nothing in Phase 1
constructs these.
