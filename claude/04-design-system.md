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
│   └── _tokens.scss        # emits :root CSS custom properties from the variables maps
└── index.scss               # @forward tokens + reset + typography — the one global entry point
```

## The token → CSS custom property split (important)

`abstracts/_variables.scss` holds raw Sass maps. They are read from exactly two places:
`themes/_tokens.scss` (to emit `--color-primary`, `--space-4`, etc. as CSS custom properties) and
`abstracts/_mixins.scss` (breakpoints only, since `@media` can't consume `var()`).

**Everywhere else — every component's `.module.scss` — should reference the CSS custom
properties (`var(--color-primary)`, `var(--space-4)`), never the Sass maps directly.** This is
deliberate: the user asked for no dark/light mode in Phase 1, but wanted it to be easy to add
later. Because every color/spacing/radius value is already a runtime-swappable CSS custom
property, adding a theme toggle later means swapping the values inside a
`:root[data-theme="dark"] { --color-surface: ...; }` block — not touching a single component.

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
