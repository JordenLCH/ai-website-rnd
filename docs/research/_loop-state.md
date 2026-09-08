# Research loop — state

Self-paced loop, docs-only. No code edits. Ran and **completed** 2026-09-08, five ticks.
Start at [`README.md`](README.md) — index, three headline findings, and the phased roadmap.
This file is loop bookkeeping; it is kept only so a later session can see what was checked and how.

## Discovery that changed the plan (tick 1)

`docs/research/` already held substantial prior work that overlaps ticks 2 and 3:

- `2026-09-07-distinctive-design.md` (21.7K) — ranked levers, slop tells, token count analysis.
  Covers most of planned tick 2.
- `2026-09-07-maintainable-generation.md` (14.6K) — deprecation arrays, escape-hatch question,
  minimum viable content editor. Covers the "upgradeable" half of tick 2.
- `2026-09-07-seo-aeo-geo.md` (13.8K) — state of play Sept 2026. Covers most of planned tick 3.

**Therefore ticks 2 and 3 are re-scoped from surveys to deltas**: what has changed, what the prior
docs got wrong or left open, and what is unimplemented in the repo despite being recommended. Writing
fresh surveys would duplicate ~36K of existing research.

## Ticks

| # | Topic | Output | Status |
|---|---|---|---|
| 1 | Human studio process, stage-by-stage, vs our nine stages | `docs/research/human-web-design-process.md` | **done** |
| 2 | Creative + upgradeable — **delta** on the two 2026-09-07 docs | `docs/research/creative-and-upgradeable.md` | **done** |
| 3 | AEO/GEO/SEO — **delta** on `2026-09-07-seo-aeo-geo.md`, plus derive-vs-author mapping to `platform/` files | `docs/research/aeo-geo-seo.md` | **done** |
| 4 | Flow audit end to end vs ticks 1–3, ranked gaps with file + effort | `docs/flow-audit.md` | **done** |
| 5 | Synthesis + prioritised roadmap, then stop loop | `docs/research/README.md` | **done** |

## Carry-forward for later ticks

From tick 1, gaps to re-test in tick 4 rather than re-derive:

- No positioning / messaging hierarchy artifact anywhere (`grep` over `skills/create-webpage/` is
  empty). Ranked #1.
- `renderer/src/blocks/ContactForm.tsx:13,38` — `action` is a label only; form submits nowhere.
  Defect, not a gap.
- No redirect handling anywhere in `platform/`.
- No favicon/manifest emission in `platform/src/build.ts`; OG image tag is conditional on an
  authored value with no generator behind it.
- Category do-not list is conversational, never persisted — apply the `theme.direction` pattern.
- Stage 10 (field feedback, `docs/how-a-site-gets-generated.md:237`) is specified; **verify in tick 4
  whether it is implemented**.

From tick 2 (see `creative-and-upgradeable.md` for evidence):

- **`FreeSection` is 54% of the fleet (71/132 blocks); 4 of 7 sites are 100% `FreeSection`, 1 distinct
  block type each** — gmr, wungadv, merryfair-free, merryfair-dense. The newest four. Fleet-wide
  patchability is void for them. Ranked #1 for tick 4.
- All six token recommendations from `2026-09-07-distinctive-design.md` §4 shipped into
  `renderer/src/tokens.ts` — but as `OPTIONAL_TOKENS`, while the low-identity colour tokens are
  `REQUIRED_TOKENS`. 6 of 7 themes set none of them and have no `theme.direction`; only `wungadv` does.
- Three of four §2 validator checks shipped (`validate-bundle.ts:175,193,841`) plus three unrequested
  ones (`:213`, `:301`, `:326`). All `severity: 'warning'` — legacy themes stay valid forever.
- Open for tick 4: does `sectionStyles` actually vary `--density` per section, or is it theme-level
  only? §1 lever 3 asked for per-section rhythm.
- `renderer/tools/build_free.py` (29K) is a dedicated `FreeSection` authoring tool — evidence the
  escape hatch is a deliberate road, not a slip.

From tick 3 (see `aeo-geo-seo.md` for evidence):

- **Only one `org.json` exists in the whole repo** (`renderer/src/content/wungadv/org.json`) and its
  `sameAs` is `[]`. The pipeline's stated highest-value output is populated for 0 of 7 sites.
  Caveat: `buildSite()` (`platform/src/build.ts:112`) takes `org` as a parameter, so these are
  fixtures not necessarily failed uploads — but the JSON-LD path has one fixture that can exercise it.
- **`FreeSection` blinds the JSON-LD emitters.** `seo.ts`'s `first()` is a strict block-type match;
  only `outline()` (`:85`) and `heroOf()` (`:102`) know FreeSection exists. The four 100%-FreeSection
  sites can emit **Organization + WebPage only** — no Product, LocalBusiness, Review, FAQPage, HowTo
  or BreadcrumbList. Distinctiveness and structured data are in direct conflict and it was not chosen.
- Shipped and good: `unverified()`/`verified()` Review gate (`seo.ts:45,62,222`); honest FAQ/HowTo
  comments (`:198,:233`); `contentHash` + previous-manifest `lastmod` so dates never bump without a
  real diff (`seo.ts:265,286`, `build.ts:199-207`).
- Not shipped: `sameAs` completeness lint (rated Strong), IndexNow ping (Medium).
- 2026 facts re-verified by search: FAQ deprecation 2026-05-07 (Search Console API support ends Aug
  2026); Google states llms.txt does nothing for Search/AI Overviews/AI Mode, and **no special schema
  is required** for AI Overviews. Sources cited in the doc.
- Still open for tick 4: is stage 10 (field CWV + scroll depth) implemented? Does `sectionStyles` vary
  `--density` per section?

From tick 4 (see `docs/flow-audit.md` for the ranked list and effort estimates):

- **Both open questions answered.** Stage 10 (field CWV + scroll depth) is **not implemented at all** —
  zero real hits across `platform/`, `mcp/`, `renderer/`. `--density` varies per section in **one**
  theme only (`wungadv`, 11/11 slugs); every other theme has 0.
- **Six themes share an identical 47-slug `sectionStyles` map** (`aonic ∩ gmr` = 47/47,
  `aonic ∩ merryfair` = 47). With zero structural tokens, the theme layer varies colour and nothing
  else for 6 of 7 sites — so `fleet_siblings` scores divergence against near-clones.
- Validator severity mix: 19 `error` / 16 `warning` / 20 `info`. Every identity and direction rule is
  a warning → legacy bundles stay valid forever, adoption is never forced.
- **`validate-bundle.ts:678-684` already solved the FreeSection problem** for the layout map
  (`free:${role}:${cols}` synthetic shape). That is the fix template `seo.ts` needs — which is why
  gap #1 is M, not L.
- No org schema in the validator at all (`:462` is only a comment) — a bundle with no entity data
  validates clean.
- Ranked gaps 1-12 with files and effort are in `docs/flow-audit.md`; tick 5 should turn them into a
  sequenced roadmap, not re-derive them.

## Rules in force

- Docs only. No edits to `renderer/`, `platform/`, `mcp/`, `skills/`.
- Every claim about this codebase names a file path, checked not recalled.
- Web-search + cite for time-sensitive SEO/AEO facts (tick 3).
- `workers.md` claim: `opus-loop-research`, files `docs/research/**`, `docs/flow-audit.md`.
  Delete on stop.
