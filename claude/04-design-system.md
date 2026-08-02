# Design System

The SCSS layer under `src/styles/` is the project's "custom design library" per the brief — no
Tailwind or other utility framework. It's a small, modern take on 7-1 architecture:

```
src/styles/
├── abstracts/     # Sass-only: variables, functions, mixins — emits no CSS by itself
│   ├── _variables.scss   # raw token maps ($colors, $spacing, $radius, $shadows, ...)
│   ├── _functions.scss   # rem() px→rem conversion
│   ├── _mixins.scss       # breakpoints, focus-visible, touch-target, reduced-motion, form-input...
│   └── _index.scss        # @forward's the three above — `@use ".../abstracts" as *;`
├── base/
│   ├── _reset.scss         # modern reset + global prefers-reduced-motion kill-switch
│   └── _typography.scss    # heading scale (fluid clamp()), body defaults
├── themes/
│   ├── _tokens.scss        # emits :root CSS custom properties from the variables maps
│   └── _palettes.scss       # selectable colour palette overrides — see below, live now
└── index.scss               # @forward tokens + palettes + reset + typography — the entry point
```

## The token → CSS custom property split (important)

`abstracts/_variables.scss` holds raw Sass maps. They are read from exactly two places:
`themes/_tokens.scss` (to emit `--color-primary`, `--space-4`, etc. as CSS custom properties) and
`abstracts/_mixins.scss` (breakpoints only, since `@media` can't consume `var()`).

**Everywhere else — every component's `.module.scss` — should reference the CSS custom
properties (`var(--color-primary)`, `var(--space-4)`), never the Sass maps directly.** This was
deliberate from Phase 1: the user asked for no dark/light mode then, but wanted it to be easy to
add later, because every color/spacing/radius value being a runtime-swappable CSS custom property
means a theme toggle is a value swap, not a rewrite. **This promise got cashed in** — see
"Selectable colour palettes" below, admin-controlled at `/admin/settings`. The same mechanism
(`[data-color-theme="..."]` blocks) is exactly what a future dark/light toggle would also use.

## Selectable colour palettes (live)

`themes/_palettes.scss` defines four named palettes — Blush Rose (pink/purple, the original
default), Ocean Blue, Meadow Green, Sunset Orange (see `src/lib/color-palettes.ts` for the
canonical list) — as plain attribute-selector blocks:
`[data-color-theme="ocean-blue"] { --color-primary: ...; }`. Deliberately distinct hue families,
not shades of the same one — an earlier version had four pink/purple variations that were hard to
tell apart in the admin picker. Also deliberately **not** `:root`-scoped, unlike a typical
dark/light toggle would be — that lets the identical CSS rule apply two ways with zero
duplication:

- **Site-wide**: `src/app/layout.tsx` sets `data-color-theme` on `<html>`, driven by
  `src/lib/site-settings.ts`'s read of the admin-selected value (`SiteSettings.activeColorPalette`,
  a singleton DB row — see [[09-database-schema]]).
- **Scoped preview**: `/admin/settings`'s live preview wraps a plain `<div data-color-theme="...">`
  around real `Button`/`Badge`/`PriceTag` components — same CSS rule, same hex values, zero
  duplication between the preview and the real site, and zero code changes needed in those
  components (they already only ever read `var(--color-primary)` etc.).

Every palette redefines the same brand-identity tokens (`primary`/`-dark`/`-light`,
`secondary`/`-dark`/`-light`, `surface`/`-alt`/`-sunk`, `text`/`-muted`/`-on-primary`, `border`).
`accent` (the gold "win moment" color) and the semantic `success`/`error`/`white`/`black` tokens
stay constant across every palette on purpose — varying the win-moment color per palette would
weaken that signal, and semantic colors aren't a brand-aesthetic concern (it's also why there's no
yellow/gold palette option — that would visually compete with accent). Every palette uses white
`--color-text-on-primary`, since all four keep primary/secondary at medium-to-vivid saturation
specifically to keep that contrast safe (a pastel-toned palette would need a dark
`--color-text-on-primary` instead, the way an earlier discarded "Cotton Candy" variant did).

## Palette

Pink/purple, chosen for the girls/women UK audience:

| Token | Hex | Use |
|---|---|---|
| `--color-primary` | `#ff6fa5` | blush rose — primary brand color |
| `--color-secondary` | `#9b5de5` | lilac purple — secondary brand color |
| `--color-accent` | `#ffd166` | gold — reveal/win moments only |
| `--color-surface` | `#fff8fb` | warm off-white page background |
| `--color-text` | `#3b2545` | deep plum — checked for 4.5:1 AA contrast on `--color-surface` |

Full palette (including `-dark`/`-light` variants, `--color-border`, `--color-success/error`) is
in `abstracts/_variables.scss`.

## Type

`next/font/google`: **Baloo 2** (display/headings, weights 600/700/800) + **Nunito Sans**
(body, weights 400–700), both self-hosted via Next's font optimization (no external requests, no
CLS). Exposed as `--font-family-display` / `--font-family-body` in `themes/_tokens.scss`, which
read the `--font-display` / `--font-body` CSS variables that `next/font` sets on `<html>` in
`app/layout.tsx`. Headings use `clamp()` for fluid sizing.

## Spacing / radius / shadow scale

4px-based spacing scale (`--space-0` through `--space-9`, i.e. 0/4/8/12/16/24/32/48/64/96px),
soft rounded radii (`--radius-sm/md/lg/pill`), pastel-tinted shadows (`--shadow-sm/md/lg`). All in
`abstracts/_variables.scss` → emitted as CSS vars.

## Breakpoints (mobile-first)

`abstracts/_mixins.scss` exposes `@include tablet-up`, `@include desktop-up`, `@include wide-up`
(600px / 1024px / 1440px). Every layout is written mobile-first (base styles = mobile, then
progressively enhanced upward) — never desktop-first with max-width overrides.

## Accessibility mixins

`@include focus-visible` (brand-colored focus ring on `:focus-visible`), `@include touch-target`
(44×44px minimum), `@include visually-hidden` (for skip links / sr-only live regions),
`@include reduced-motion { @content }` (wraps `@media (prefers-reduced-motion: reduce)`). Use
these instead of hand-rolling the underlying media queries/properties, so the rules stay
consistent site-wide.
