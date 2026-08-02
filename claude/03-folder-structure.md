# Folder Structure

```
mystery_box/
├── claude/                     # this documentation folder (not .claude/, the tool config dir)
├── public/
│   ├── images/
│   │   ├── products/            # placeholder SVG art per category/prize-pool/season
│   │   └── brand/                # logo.svg, hero-gift.svg
│   └── icons/
├── src/
│   ├── app/                      # App Router — one folder per route
│   │   ├── layout.tsx            # root layout: fonts, Header, Footer, SkipToContent
│   │   ├── page.tsx               # Home — async, fetches categories via lib/catalogue.ts
│   │   ├── globals.scss           # single `@use "../styles/index"` — the only global CSS import
│   │   ├── not-found.tsx          # custom 404
│   │   ├── error.tsx              # root error boundary — DB-backed pages can hit real errors now
│   │   ├── shop/
│   │   │   ├── page.tsx           # category index + bestsellers — DB-backed, revalidate=60
│   │   │   ├── jewellery/page.tsx    # DB-backed (Products/Categories/Themes), revalidate=60
│   │   │   ├── makeup-beauty/page.tsx
│   │   │   └── stationery/page.tsx
│   │   ├── mystery-eggs/
│   │   │   ├── page.tsx
│   │   │   └── EggTierSelector.tsx   # route-colocated, not reused elsewhere
│   │   ├── wheel-spin/page.tsx
│   │   ├── birthday-packages/
│   │   │   ├── page.tsx
│   │   │   ├── PackageCard.tsx        # route-colocated, shared by index/kids/adult-party
│   │   │   ├── kids/page.tsx
│   │   │   └── adult-party/page.tsx
│   │   ├── seasonal/page.tsx
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   └── legal-notice/page.tsx
│   ├── components/
│   │   ├── layout/       # Header, MobileNav, Footer, SkipToContent
│   │   ├── home/          # Hero, ShopByCategory, HowItWorks, Testimonials, TrustSignals
│   │   ├── product/       # PriceTag, ProductCard, CategoryCard, ProductGrid,
│   │   │                  # ProductFilterGrid (theme/sort filtering), CategoryShopSection
│   │   ├── animations/    # WheelSpin/, EggReveal/, RevealPanel/, ConfettiBurst.ts
│   │   ├── forms/          # CustomRequestForm (birthday builder), ContactForm
│   │   └── ui/             # Button, Badge, Modal, Accordion, StickyAddToBasket
│   ├── data/                # typed mock catalogue — PrizePool/BirthdayPackage/SeasonalCollection
│   │                          # only now (Products/Categories/Themes moved to the DB — see below)
│   ├── types/                # entity types, barrel-exported from types/index.ts — unchanged by
│   │                          # the DB swap; lib/catalogue.ts maps DB rows onto these same shapes
│   ├── styles/                # the SCSS design system — see 04-design-system.md
│   ├── lib/
│   │   ├── constants.ts, utils.ts (formatPrice, cx, pickWeighted)
│   │   ├── db/client.ts        # getPrismaClient() — shared by admin services AND catalogue.ts
│   │   └── catalogue.ts        # storefront reads: getProducts, getProductsByCategory,
│   │                            # getCategories, getCategoryBySlug, getThemes — see [[02-architecture]]
│   └── hooks/                  # usePrefersReducedMotion, useMediaQuery
├── eslint.config.mjs, .prettierrc.json, .stylelintrc.json, next.config.ts, tsconfig.json
```

## Conventions

- **Every component folder colocates its `.module.scss`** next to the `.tsx` file
  (`Button/Button.tsx` + `Button/Button.module.scss`).
- **Route-specific, non-reusable pieces live inside their `app/` route folder**, not in
  `components/` — e.g. `EggTierSelector.tsx` and `PackageCard.tsx`. If a second route ever needs
  one of them, promote it into `components/` at that point.
- **Barrel files** (`index.ts`) exist per component category (`ui`, `product`, `home`,
  `animations`, `forms`) and per data/types folder, so pages import from
  `@/components/ui`, `@/data`, `@/types`, etc. rather than deep-importing individual files.
- **`*Loader.tsx` files** (`WheelSpinLoader.tsx`, `EggRevealLoader.tsx`) are the
  `next/dynamic(..., { ssr: false })` client wrapper for a heavy GSAP component — see
  [[02-architecture]] for why this pattern exists, and [[05-animation-strategy]] for the
  performance reasoning.
- **Path alias**: `@/*` → `src/*`, used in all `.ts`/`.tsx` imports. SCSS files use relative
  `@use` paths instead (e.g. `@use "../../styles/abstracts" as *;`) — Sass module resolution
  doesn't reliably honour the tsconfig alias, so relative paths are the deliberate, robust choice
  there.

## Phase 2a additions (Products, Categories, Themes — live)

Everything admin-*write*-specific that isn't a Next.js route lives under `src/admin/` — kept
separate from the storefront's `src/lib/`, `src/data/`, `src/types/` so it reads as one subtree and
is easy to extract later if a separate app is ever justified (see [[10-admin-panel]]'s Decisions
locked in). `src/proxy.ts` and `src/app/admin/` are the only two pieces that can't move in
there — Next.js's file conventions require both to stay exactly where they are. One thing that
*did* move back out: the Prisma client itself (`src/lib/db/client.ts`) — it started in
`src/admin/db/` but moved once the storefront needed DB reads too (see [[09-database-schema]]),
since a storefront page importing from inside `src/admin/` would defeat the whole point of keeping
admin separable.

```
src/
├── proxy.ts                        # Next 16 proxy (not middleware.ts, deprecated in v16) —
│                                      optimistic /admin/* gate, checks the signed session cookie
├── app/admin/
│   ├── login/
│   │   ├── page.tsx                  # PIN entry (outside the dashboard route group — no nav shell)
│   │   ├── login.module.scss
│   │   └── actions.ts                 # login()/logout() Server Actions
│   ├── upload-image-action.ts       # shared Server Action, bound per-folder — see ImagePicker below
│   └── (dashboard)/                 # route group — shares layout, doesn't affect the URL
│       ├── layout.tsx                 # calls requireAdmin(), renders nav + logout
│       ├── dashboard.module.scss
│       ├── page.tsx                    # dashboard home (product counts)
│       ├── home.module.scss
│       ├── products/
│       │   ├── page.tsx                 # list + delete
│       │   ├── new/page.tsx
│       │   ├── [id]/page.tsx
│       │   ├── ProductForm.tsx           # shared client component (new + edit)
│       │   ├── ProductPreview.tsx         # live preview — reuses ProductCard's own .module.scss
│       │   ├── actions.ts                 # create/update/delete Server Actions
│       │   └── products.module.scss
│       ├── categories/                # same shape as products/ (no preview panel)
│       │   ├── page.tsx, new/page.tsx, [id]/page.tsx, CategoryForm.tsx, actions.ts
│       │   └── categories.module.scss
│       └── themes/                    # same shape, plus a live colour-swatch preview
│           ├── page.tsx, new/page.tsx, [id]/page.tsx, ThemeForm.tsx, actions.ts
│           └── themes.module.scss
├── admin/                           # everything admin-write-specific, not routes — see above
│   ├── services/
│   │   ├── products.service.ts        # list/get/create/update/delete — see [[10-admin-panel]]
│   │   ├── categories.service.ts
│   │   └── themes.service.ts
│   ├── storage/
│   │   ├── client.ts                   # getStorageClient() — @supabase/supabase-js, Storage only
│   │   └── upload.ts                    # uploadImage(file, folder) → public URL
│   ├── components/
│   │   └── ImagePicker/                # shared upload widget — Products (multi) + Categories (single)
│   │       ├── ImagePicker.tsx
│   │       └── ImagePicker.module.scss
│   └── auth/
│       ├── session.ts                 # jose sign/verify — pure, importable from proxy.ts
│       ├── dal.ts                      # requireAdmin()/isAdminAuthenticated() — server-only
│       └── pin.ts                      # scrypt hash/verify for the admin PIN
├── generated/prisma/                # gitignored — regenerated via `postinstall: prisma generate`
scripts/
├── hash-admin-pin.mjs               # standalone CLI to generate ADMIN_PIN_HASH
└── create-storage-bucket.mjs        # one-time setup — creates the public "catalogue-images" bucket
prisma/
├── schema.prisma                    # source of truth for the schema — see [[09-database-schema]]
├── migrations/0_init/                # baseline migration matching what's already live
└── seed.mts                          # seeds Categories + Themes (`npx prisma db seed`, runs via tsx)
prisma.config.ts                     # CLI-side config (migrate/generate) — connection URL lives
                                        here, not in schema.prisma (Prisma 7)
```

**Not built yet:** PrizePools/BirthdayPackages/SeasonalCollections admin CRUD (same pattern as
Products/Categories/Themes, not yet replicated), and the orders/custom-requests tables — see
[[10-admin-panel]]
for the remaining Phase 2a/2b/2c scope.
