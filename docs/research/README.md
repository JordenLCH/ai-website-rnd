# Research index and roadmap

Written 2026-09-08 by a five-tick research loop. Docs only — no code was changed in any tick.

## The one-paragraph version

The pipeline's *middle* is complete and in places ahead of studio practice. Nearly every
recommendation from the 2026-09-07 research shipped into the contract, the validator and the build
farm within a day. But **almost none of it was adopted by the fleet**, because every new rule ships as
a `warning`; and a layout escape hatch (`FreeSection`) that arrived at the same time has taken over
54% of the fleet, silently disabling most structured-data derivation. The two things the product
claims as its value — *fleet-wide patchability* and *entity clarity* — are both currently true in the
code and false in the fleet.

## The documents

| Doc | What it answers |
|---|---|
| [`human-web-design-process.md`](human-web-design-process.md) | How a studio builds a site stage by stage, what artifact each stage produces, and which of those we don't produce |
| [`creative-and-upgradeable.md`](creative-and-upgradeable.md) | Delta on the 2026-09-07 design + maintainability docs: what shipped, what the fleet adopted, what the escape hatch cost |
| [`aeo-geo-seo.md`](aeo-geo-seo.md) | Delta on the 2026-09-07 SEO doc: 2026 facts re-verified, what shipped in `platform/`, derive-vs-author map |
| [`../flow-audit.md`](../flow-audit.md) | End-to-end audit, 12 ranked gaps with file paths and effort estimates |
| [`_loop-state.md`](_loop-state.md) | Loop bookkeeping and carry-forward notes |

Prior work these build on, not replace: [`2026-09-07-distinctive-design.md`](2026-09-07-distinctive-design.md),
[`2026-09-07-maintainable-generation.md`](2026-09-07-maintainable-generation.md),
[`2026-09-07-seo-aeo-geo.md`](2026-09-07-seo-aeo-geo.md),
[`2026-09-04-block-catalog-site-generation.md`](2026-09-04-block-catalog-site-generation.md).

## The three findings that matter

**1. The system absorbed the research; the fleet did not.** All six token recommendations shipped into
`renderer/src/tokens.ts` — as `OPTIONAL_TOKENS`, while the low-identity colour tokens stayed
`REQUIRED_TOKENS`. Six of seven themes set zero of them, have no `theme.direction`, and share an
identical 47-slug `sectionStyles` map (`aonic ∩ gmr` = 47/47). For six of seven sites the theme layer
varies colour and nothing else. Validator severity mix is 19 `error` / 16 `warning` / 20 `info`, and
every identity rule is a warning — so nothing forces the sweep and `fleet_siblings` now scores
divergence against near-clones.

**2. Distinctiveness and machine-readability are in unchosen conflict.** `FreeSection` is 54% of the
fleet (71/132 blocks) and the only block type in the four newest sites. `platform/src/seo.ts` resolves
every JSON-LD emitter by strict block type, so those four sites emit `Organization` + `WebPage` and
nothing else — no Product, LocalBusiness, Review, FAQPage, HowTo or BreadcrumbList. `FreeSection.tsx:9`
kept a `role` enum *specifically* so JSON-LD would keep working; `seo.ts` reads it in one place. The
four most visually considered sites have the weakest entity signal, and nobody decided that.

**3. The gaps are at the ends, not the middle.** Tick 1 went looking for missing studio stages and
found the middle complete. What's missing is the front — positioning, discovery answers, the category
do-not list, all asked-then-discarded — and the back: launch checklist, working contact form,
redirects, and stage 10, which is specified in detail and implemented nowhere.

## Roadmap

Sequenced by dependency and by cost-to-value, not by the audit's severity order. Effort: **S** ≈ under
a day, **M** ≈ 1–3 days, **L** ≈ a week+.

### Phase 0 — decisions, before any code (hours)

Both are writing, not engineering, and everything downstream depends on them.

1. **Decide what `FreeSection` is for** and write it into `CLAUDE.md`. Prototyping surface whose
   recurring shapes get harvested into named variants, or the real authoring surface — in which case
   the fleet-patchability pitch needs rewriting. The docs currently claim one and the fleet does the
   other. Everything in Phase 2 depends on this answer.
2. **Decide whether the six legacy themes get swept or frozen.** If swept, the identity warnings can
   become errors. If frozen, say so and stop measuring divergence against them.

### Phase 1 — stop the bleeding (S–M, ~1 week)

Highest value per day of work; none blocked by Phase 0.

3. **Make `seo.ts` FreeSection-aware** — M. Resolve by `role` + node shape instead of `b.type ===`.
   The template already exists at `renderer/src/validate-bundle.ts:678-684`, which solved the same
   problem for the layout map. Recovers structured data for four sites.
4. **Add an org schema to the validator + `sameAs` completeness check** — S. Today a bundle with zero
   entity data validates clean; `find . -name org.json` returns one file, with `sameAs: []`. Make it
   an error, given this is the pipeline's stated primary value.
5. **Fix `ContactForm`** — M. `renderer/src/blocks/ContactForm.tsx:13,38` has a label, no endpoint. A
   form that discards enquiries is a defect, not a missing feature.
6. **Launch artifacts** — S–M. Favicon, webmanifest, OG image generation
   (`platform/src/build.ts:184` emits the tag only if one was authored, and nothing authors one).

### Phase 2 — close the process gaps (S–M, ~1–2 weeks)

7. **Messaging hierarchy stage** — S, skill-only. A new stage between `SKILL.md:93` and `:143`: one
   primary claim, three supporting claims with proof, and the words a competitor already owns. Apply
   the `theme.direction` pattern — written down, auditable at stage 7. The same move persists the
   discovery answers (`:141`) and the category do-not list (`:186`), both currently discarded.
8. **Split the stage-5 review** — S. Words, then layout. One checkpoint carrying both means the
   reviewer comments on whichever is more wrong and the other ships unread.
9. **Sweep the six themes onto structural tokens + `direction`; promote `theme.direction` to `error`
   for new bundles** — M. Gated on decision 2.
10. **Redirect map as an authored bundle field** — M. The only gap here that loses *existing* client
    traffic, and most client work is a redesign.
11. **IndexNow ping on publish** — S.

### Phase 3 — the expensive, genuinely valuable ones (L)

12. **`FreeSection` harvest loop** — L. Cluster the 71 live node-trees; any shape appearing three
    times becomes a reviewed named variant (the Rule of Three from
    `2026-09-07-maintainable-generation.md` §1.4). Without this the ratchet only turns one way. Gated
    on decision 1.
13. **Stage 10 — field feedback** — L. p75 CWV plus scroll depth returning to the next rebuild. Fully
    specified at `docs/how-a-site-gets-generated.md:237`, implemented nowhere: a grep for
    `scroll.?depth|web-vitals|LCP|INP|CLS|p75` across `platform/`, `mcp/` and `renderer/` returns only
    a `cls()` classname helper. Largest gap by ambition, smallest by immediate client impact.

## What not to do

- **Don't add more validator warnings.** The evidence of this loop is that warnings don't change the
  fleet. Existing rules becoming errors beats new rules being added.
- **Don't claim FAQ or Steps blocks earn a rich result.** FAQ rich results were deprecated
  2026-05-07 (Search Console API support ends August 2026); HowTo has been gone since September 2023.
  Emitting them is still correct for non-Google consumers; the pitch is entity clarity.
- **Don't position `llms.txt` as an AEO lever.** Google's June 2026 Search Central docs state it is not
  used for Search, AI Overviews or AI Mode, and that no special schema is required for either.
- **Don't bump `dateModified` on a timer.** `seo.ts:265,286` already does this correctly via content
  hashing; keep it.

Sources for the 2026 claims are cited inline in [`aeo-geo-seo.md`](aeo-geo-seo.md).

## Method

Five self-paced ticks, docs only. Every claim about this codebase was checked against a file on
2026-09-08 rather than recalled; block, token, theme and `org.json` censuses were computed directly
from `renderer/src/content/*` rather than estimated. The two time-sensitive external facts were
re-verified by web search rather than carried forward on trust from the day-old prior doc.
