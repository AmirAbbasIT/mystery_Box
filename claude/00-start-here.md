# Start Here

This `claude/` folder (not `.claude/`, the tool config dir) is the project's living design memory —
the "why" behind decisions that aren't recoverable by reading the code alone. Read the relevant
doc before touching an area of the codebase; update the doc in the same change if you alter the
decision it records. Don't let these drift from the code — [[08-features]] says this explicitly
and it applies to all of them.

## Read order

| Doc | Read when |
|---|---|
| [[01-overview]] | Onboarding — brand, audience, why original themes not licensed IP |
| [[02-architecture]] | Before writing any App Router code — stack, phase boundary, Next.js 16 gotchas |
| [[03-folder-structure]] | Before adding a file — where new code should live |
| [[04-design-system]] | Before writing any `.module.scss` — token layer, palette, breakpoints |
| [[05-animation-strategy]] | Before adding motion — library split, `*Loader.tsx` pattern, reduced-motion rules |
| [[06-entities-data-model]] | Before touching `src/types/` or `src/data/` — entity shapes and why |
| [[07-roadmap]] | Before planning new work — what's Phase 1/2/3 and what depends on what |
| [[08-features]] | Before shipping — what's live, what's explicitly out of scope, pre-launch TODOs |
| [[09-database-schema]] | Phase 2 — table/entity design once a backend gets built |
| [[10-admin-panel]] | Phase 2 — admin dashboard architecture, scope, and access control |

## Efficient exploration

- **Start from the barrels, not a grep.** `src/types/index.ts`, `src/data/index.ts`, and each
  `src/components/*/index.ts` re-export everything in that folder — read the barrel first to see
  the full surface area before opening individual files.
- **The entity model is the map of the domain.** `src/types/*.ts` (one file per entity, ~10–30
  lines each) tells you what the business objects are faster than reading the pages that render
  them. Cross-reference with [[06-entities-data-model]] for the *why* behind each field.
- **Route-colocated components aren't in `components/`.** If you're looking for something used on
  one page only (`EggTierSelector.tsx`, `PackageCard.tsx`), check inside its `app/<route>/` folder
  first — see [[03-folder-structure]] for the rule.
- **Ignore `node_modules/`, `.next/`, `tsconfig.tsbuildinfo`** when exploring — noise, not signal.
  The one exception: `node_modules/next/dist/docs/01-app/`, which is the bundled doc set for the
  *actually installed* Next.js 16 version — check it before writing App Router code instead of
  relying on prior training data, per `AGENTS.md`.
- **No inline comments by convention** — this codebase explains itself through naming and through
  these docs, not code comments. If you need the "why" for something, it's more likely to live
  here in `claude/` than in a comment near the code.
- **For anything spanning many files** (e.g. "how does the reveal flow work end to end") prefer
  the `Explore` agent over manual grepping — it's built for exactly this and won't burn main
  context on file contents you don't need to keep around.
