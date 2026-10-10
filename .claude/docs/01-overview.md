# Overview

## What this is

Mystery Box UK is a rebuild of an existing basic storefront (mysterypickedgifts.com) into a
purpose-built, animation-rich mystery gifting brand for the UK market. The old site was five
static pages with no reveal experience, no theme filtering, and copy referencing products that
didn't actually exist in the catalogue. This project replaces it with a proper Next.js site built
around a "theatre of the reveal" concept.

## Target audience

Framed as overlapping segments, not one persona:

- **Core (13–35, self-treat buyers)** — the highest-intent, highest-repeat-purchase group, buying
  jewellery/beauty/stationery mystery boxes for themselves.
- **Gifting buyers** — birthdays, "just because", Christmas — want more excitement than a
  standard present, drawn to the reveal/surprise factor.
- **Parents** — buying kids' party favours and milestone birthday boxes, themed and priced for
  party bags.
- **Adult party/hen-do buyers** — want a "build your own party box" with customisable items.
- **Seasonal buyers** — Christmas, Valentine's, Mother's Day, Easter (pairs naturally with the egg
  concept) — UK gifting demand spikes hard around these dates.

## Brand identity

Pink/purple, playful, girls-and-women-focused. Warm, personal, family-run voice — not a faceless
warehouse brand. The wheel spin and egg reveal are centerpiece interactions, not side gimmicks:
spend-to-unlock-a-spin mechanics are already common in UK retail social marketing, and no UK
competitor currently combines jewellery + beauty + stationery + egg-reveal + wheel-spin + party
packages under one polished, animation-rich brand. That combination is the differentiation.

## A note on themes

The old site's copy referenced third-party character IP (Hello Kitty, Kuromi, Disney, Lilo &
Stitch) as box themes without an apparent license. This rebuild deliberately uses **original,
non-licensed themes** instead (Kawaii Pastels, Y2K Sparkle, Cottagecore Florals, Celestial &
Stars, Retro Cartoon, Unicorn Dreams) that evoke the same aesthetics without the legal exposure of
selling unlicensed branded merchandise. See [[06-entities-data-model]] for the `Theme` entity and
`src/data/themes.ts` for the current set. If real licensing is ever secured, swap the theme data —
the catalogue is built so that's a data change, not a rebuild.
