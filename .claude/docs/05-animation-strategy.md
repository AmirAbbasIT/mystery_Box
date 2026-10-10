# Animation Strategy

Goal: "tons of animation" without hurting Core Web Vitals or ranking. The rule that governs
everything below — **animate only `transform` and `opacity`** (compositor-friendly), never
`width`/`top`/`box-shadow`/`height` directly, with one documented, scoped exception (see
Accordion below).

## Library split and why

| Library | Used for | Loading |
|---|---|---|
| **Framer Motion** | Page/section entrances (`whileInView`), hover/tap states, mobile nav drawer, modal open/close | Always loaded — core UI dependency, tree-shakeable |
| **GSAP** | Wheel Spin rotation/deceleration, Egg Reveal shake-and-pop | Dynamically imported (`await import("gsap")`) only inside the click handler that needs it |
| **canvas-confetti** | Win-moment celebration only | Dynamically imported inside `fireConfettiBurst()` (`src/components/animations/ConfettiBurst.ts`) |

Framer Motion is the general-purpose library because it's React-native and small enough to load
everywhere. GSAP and canvas-confetti are reserved for the two signature interactions and the win
moment specifically — general animation libraries do timeline-based physics (the wheel's
`power4.out` deceleration, the egg's shake sequence) less cleanly than GSAP, and there's no reason
to ship either library's JS to a product listing page that never uses them.

## The `*Loader.tsx` pattern

Next.js 16 only allows `next/dynamic(..., { ssr: false })` inside a Client Component — calling it
from a Server Component throws (`ssr: false is not allowed with next/dynamic in Server
Components`). So `WheelSpin`/`EggReveal` each ship as a pair:

- `WheelSpin.tsx` — the real, heavy, `'use client'` component that imports GSAP on demand.
- `WheelSpinLoader.tsx` — a tiny `'use client'` wrapper that does
  `dynamic(() => import("./WheelSpin"), { ssr: false, loading: ... })`.

Server Component pages (`app/wheel-spin/page.tsx`) import the `Loader`, not the component
directly. This keeps GSAP out of the server-rendered HTML and out of the initial client bundle for
every page that doesn't render a wheel or egg.

## Reduced motion

Two layers, both required:

1. **CSS layer** — `base/_reset.scss` has a global `@media (prefers-reduced-motion: reduce)` block
   that collapses all CSS transitions/animations to near-zero duration. Covers hover states, the
   mobile nav drawer's CSS transitions, etc.
2. **JS layer** — `usePrefersReducedMotion()` (`src/hooks/`, backed by `useMediaQuery` via
   `useSyncExternalStore`) is checked explicitly inside `WheelSpin` and `EggReveal` before
   starting a GSAP timeline. If the user prefers reduced motion, the prize is still picked via
   `pickWeighted()` and revealed instantly — the *outcome* logic never changes, only whether it's
   animated.

The CSS layer alone doesn't stop GSAP or Framer Motion (both drive styles via JS/inline styles,
not CSS `transition`/`animation`), which is why the JS check is mandatory for the two GSAP
components. Framer Motion's `whileInView` entrance animations are left as-is under reduced motion
(they're small opacity/y-offset fades, not full-screen or physics-heavy).

## The one intentional exception

`components/ui/Accordion/Accordion.tsx` animates `height: 0 → "auto"` via Framer Motion. Height is
a layout property, not transform/opacity — called out explicitly in a code comment. It's a
deliberate, scoped exception: one small disclosure panel, not page-wide motion, and there is no
compositor-only way to animate to an unknown "auto" height.

## Bundle verification

`npm run build` output should be checked (`Route (app)` table / `First Load JS`) to confirm GSAP
and canvas-confetti don't appear in the shared/first-load JS for routes that don't render a wheel
or egg. See [[07-roadmap]] / verification notes for how this was checked in Phase 1.
