# Features Checklist

Living document — update this when features are added/changed, don't let it drift from the code.
"Pages built" below is mostly Phase 1 (static mock data) but **`/`, `/shop`, the three category
pages, `/wheel-spin`, and `/mystery-eggs` are DB-backed now** — flagged individually in that table,
not a clean split anymore. For the full Phase 2 plan, see [[09-database-schema]] and
[[10-admin-panel]].

## Phase 2 — database + admin (in progress)

| Piece | Status | Notes |
|---|---|---|
| Catalogue DB schema | ✅ | `prisma/schema.prisma` (source of truth) + `prisma/migrations/0_init/` — live and seeded in Supabase Postgres |
| Admin PIN auth | ✅ | `src/proxy.ts` gate + `src/admin/auth/`; generate a PIN hash with `node scripts/hash-admin-pin.mjs <pin>` and set `ADMIN_PIN_HASH`/`ADMIN_SESSION_SECRET` before `/admin` will work |
| Services layer | 🟡 | `src/admin/services/{products,categories,themes,prize-pools}.service.ts` (Prisma-backed) — BirthdayPackages/SeasonalCollections not yet built |
| `/admin/products` | ✅ | List, create, edit, delete, real image upload (`ImagePicker`, multiple + alt text), plus a live preview panel (reuses the real `ProductCard` styles) that updates as the form is filled in |
| `/admin/categories` | ✅ | List, create, edit, delete, real image upload (`ImagePicker`, single) — delete is blocked with a friendly message (not a crash) if products still reference the category |
| `/admin/themes` | ✅ | List, create, edit, delete, plus a live colour-swatch preview — first real visual use of `colorSwatch` anywhere in the app (the storefront's filter chips don't use it) |
| `/admin/prize-pools` | ✅ | List, create, edit, delete; nested prize-item editor (label/rarity/weight, ↑/↓ reorder, live odds %); real image upload; for `kind: "wheel"` a **live spinning preview** using the actual `WheelSpinLoader` component fed by the in-progress form state. Covers both `kind` values (wheel/egg) since it's one shared table — both are now wired to the storefront. |
| Image storage | ✅ | Supabase Storage, public `catalogue-images` bucket (`node scripts/create-storage-bucket.mjs`) — not the database, not `public/images/`; see [[09-database-schema]] |
| Storefront wired to DB | ✅ | `src/lib/catalogue.ts` — `/`, `/shop`, `/shop/{jewellery,makeup-beauty,stationery}`, `/wheel-spin`, `/mystery-eggs` read real data now, not `src/data/`. ISR (`revalidate = 60`), not full SSR. |
| `/admin/settings` | ✅ | Site-wide colour palette picker — 4 curated presets (not a full theme editor), applied instantly across the whole storefront via `revalidatePath('/', 'layout')`. Live preview wraps real `Button`/`Badge`/`PriceTag` in a scoped `data-color-theme` div — same CSS rule as the site-wide one, zero duplicated colour values. Singleton (`SiteSettings`, one DB row), not the usual list/new/[id] pattern. |
| `/admin/birthday-packages`, `/admin/seasonal-collections` | ⬜ | Not built — same pattern as Products/Categories/Themes/Prize Pools, see [[10-admin-panel]] |
| `/admin/custom-requests`, `/admin/orders`, `/admin/customers` | ⬜ | Phase 2b/2c, blocked on scope per [[10-admin-panel]] |

**To run this locally:** copy `.env.local.example` to `.env.local`, fill in `DATABASE_URL`/
`DIRECT_URL` from your Supabase project's connection strings and `SUPABASE_URL`/`SUPABASE_SECRET_KEY`
(needed now for Storage, not just kept for later), run `npx prisma migrate deploy` (or `migrate
reset` on a fresh empty dev database), `npx prisma db seed` to seed Categories/Themes/the 5 prize
pools (1 wheel + 4 egg tiers), `node scripts/create-storage-bucket.mjs` to create the image bucket,
generate a PIN hash, then `npm run dev` and visit `/admin/login`.

## Pages built

| Route | Status | Notes |
|---|---|---|
| `/` | ✅ **DB-backed** | Hero, Shop by category (3 real categories from Postgres + 3 hardcoded extras: eggs/wheel/birthday), How it works, Testimonials, Trust signals |
| `/shop` | ✅ **DB-backed** | 3 category cards + bestsellers grid, real Products/Categories |
| `/shop/jewellery`, `/shop/makeup-beauty`, `/shop/stationery` | ✅ **DB-backed** | Theme filter chips + price sort (still client-side, now over real data), "Peek inside" transparency modal per product, `notFound()` if the category row is missing instead of a crash |
| `/mystery-eggs` | ✅ **DB-backed** | Tier selector (single/5/10/15), interactive crack-to-reveal per egg, odds accordion, real `PrizePool`/`PrizeItem` (`kind: "egg"`); friendly "check back soon" empty state if no egg tiers exist |
| `/wheel-spin` | ✅ **DB-backed** | Interactive GSAP wheel, confetti + reveal on win, published odds table, real `PrizePool`/`PrizeItem`; friendly "check back soon" empty state (not a crash) if no wheel pool exists |
| `/birthday-packages` | ✅ | Index linking to kids/adult-party |
| `/birthday-packages/kids` | ✅ | Kids packages + custom request builder (defaults to "kids") |
| `/birthday-packages/adult-party` | ✅ | Adult packages + custom request builder (defaults to "adult") |
| `/seasonal` | ✅ | Christmas/Valentine's/Mother's Day/Easter collection cards with date ranges |
| `/about` | ✅ | Brand story + trust signals |
| `/contact` | ✅ | Contact form + email fallback |
| `/legal-notice` | ✅ | Placeholder template — see Pre-launch TODOs |
| 404 | ✅ | Custom not-found page |

## Cross-cutting features

- Sticky header, mobile hamburger drawer (Framer Motion, focus-trapped-adjacent, Escape closes,
  body scroll lock while open).
- Skip-to-content link, keyboard-operable Wheel Spin/Egg Reveal, `aria-live` announcements on
  reveal outcomes, `prefers-reduced-motion` respected at both CSS and JS layers.
- "What could be inside" / odds transparency panels on every mystery product (UK consumer law
  motivated — see [[06-entities-data-model]]).
- Theme + price filtering on all three shop category pages, sharing one `ProductFilterGrid`
  component.
- `src/app/error.tsx` — root error boundary for the whole storefront, added once Products/
  Categories/Themes became DB-backed and could actually fail at runtime (a transient DB connection
  error, for instance) — see [[02-architecture]]'s Data flow section.
- `ProductCard` shows a plain placeholder box instead of crashing if a product has zero images —
  real DB products aren't guaranteed to have one the way every mock product always did.
- **Reveal experience honesty (Aug 2026 decision):** both `/wheel-spin` and `/mystery-eggs` state
  plainly ("try a preview... no purchase needed... every real order gets its own genuine surprise")
  that the on-screen crack/spin reveal is a preview of the published odds, not a guarantee of what
  ships. This was a deliberate call, not an oversight: the reveal is a client-side `pickWeighted()`
  pick with no link to any real order (there's no checkout yet — Phase 2c), so implying it
  determines what a customer receives would be misleading, especially given kids/teens are a named
  audience and this brand already treats odds-transparency as UK-consumer-law-motivated rather than
  decorative (see [[06-entities-data-model]]). The fun interactive mechanic stays — it's explicit
  brand positioning (see [[01-overview]]) — only the framing changed. Revisit if/when checkout
  exists and a real order-linked reveal (the pick happens server-side at purchase, then fulfilment
  packs that specific prize) becomes viable — not before.

## Explicitly out of scope for Phase 1

- Real basket/checkout — `StickyAddToBasket` and product "Add to Basket" buttons are
  presentational only (local confirmation state, no persistence).
- Any form submission persistence — `CustomRequestForm`/`ContactForm` show a static confirmation,
  nothing is sent anywhere.
- Product detail pages (`/shop/[category]/[product]`) — deliberately not built; the "reveal
  theatre" lives in Wheel Spin/Mystery Eggs instead, and the transparency panel covers the
  "what's inside" need at the card level via a modal.

## Pre-launch TODOs (placeholder content that must be replaced)

- **`CONTACT_EMAIL`** in `src/lib/constants.ts` is a placeholder (`hello@mysteryboxuk.example`) —
  replace with the real inbox.
- **All product/category/prize imagery** is generated placeholder SVG art
  (`public/images/products/*.svg`, `public/images/brand/*.svg`) — replace with real photography
  before launch.
- **Testimonials** (`components/home/Testimonials.tsx`) are fabricated placeholder copy attributed
  to fictional customers — flagged in a code comment. Replace with real, consented reviews before
  launch; publishing them as-is would breach UK consumer protection / ASA rules on fake reviews.
- **Legal Notice** (`app/legal-notice/page.tsx`) is a bracketed template
  (`[Company Legal Name]`, `[Registration Number]`, etc.) — needs real company details, ideally
  reviewed by a solicitor, before going live.
- **Themes** are original/non-licensed by design (see [[01-overview]]) — this is not a TODO to
  "fix", just a documented decision; don't reintroduce trademarked character names without a
  license.
