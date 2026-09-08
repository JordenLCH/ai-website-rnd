# Measurement loop — state

Self-paced, docs only. Ran and **completed** 2026-09-08, five ticks.
Verdict is §5 of the measurement doc; it **supersedes** the cut-to-8-blocks suggestion in
`README.md` and `flow-audit.md`.
Started 2026-09-08 15:29. Output builds up in
[`measure-freesection-vs-blocks.md`](measure-freesection-vs-blocks.md).

**Question:** does `FreeSection` deliver more distinctive sites than the 25 catalog blocks, or do the
blocks deliver stability free composition loses? Decision pending: cut ~15 blocks to ~8 semantic ones,
or keep the catalog.

Harness: `scratchpad/measure.py` (throwaway, not in repo). Content dirs are gitignored as of `95ba318`
but present on disk; `wungadv` untracked and included.

## Ticks

| # | Topic | Status |
|---|---|---|
| 1 | Metrics + cost (tokens/section, content vs scaffold, tokens per word) | **done** |
| 2 | Distinctiveness — pairwise layout overlap, tone rhythm, composition repetition | **done** |
| 3 | Stability — real validator run, issues by severity/site/rule, depth, verbatim repeats | **done** |
| 4 | Natural experiment head to head: `merryfair` / `-free` / `-dense` on every metric | **done** |
| 5 | Verdict + cut/keep/hybrid recommendation, then stop | **done** |

## Carry-forward

From tick 1:

- **FreeSection costs 3.65× tokens/section** (895 vs 245) and 2.33× **per word of copy delivered**
  (12.62 vs 5.41). `goal.md` bullet 3 wants token usage reduced — direct tension, now quantified.
- **But free sites are genuinely denser**: 70 words/section vs 45 (+56%). Density is the failure mode
  `SKILL.md:269` cares most about, so this is a real win. Cost is partly buying something.
- **The clean pair kills the density defence for one case**: `merryfair` (block) 46 words/section at
  5.10 tok/word vs `merryfair-free` 42 words/section at 17.06 — same client, same brief, same density,
  **3.35× the cost**. Reads as a mechanical conversion with no content gain.
- **FreeSection done well vs done mechanically is 1.8× apart**: `wungadv` 9.25 tok/word at 91
  words/section vs `merryfair-free` 17.06 at 42. The variance within FreeSection is larger than some
  of the gap to blocks — worth testing whether that holds on distinctiveness too.
- Content share drops 48% → 36% under free composition; scaffold chars/section 268 → 772.
- Node depth: free sites max 4, except `merryfair-free` at 2 (further evidence it is a flat
  mechanical conversion, not composed).

From tick 2 — **the premise behind the cut question did not survive**:

- **Found a real defect.** `validate-bundle.ts:678-684` and `fleet_siblings` shape a FreeSection as
  `free:<role>:<cols>` — a 12×12 vocabulary, so any two free sites collide. It reports free-free
  overlap at 0.60–0.90 (four pairs above the 0.7 "change the layout map" threshold). Measured on
  actual node-tree structure the same pairs are **0.00–0.40**; the pair flagged at 0.90 shares **one**
  structure out of 41. **False divergence alarms, worsening as more sites go free. Fix regardless of
  the cut/keep decision.**
- **Cross-site divergence: tie.** free 0.00–0.40, block 0.00–0.33. Neither converging.
- **Within-site variety: tie.** Same client: `merryfair-free` 0.79 vs `merryfair` 0.78. Vocabulary
  comparable (26 distinct node structures vs 29 block shapes). Zero verbatim duplicate sections
  anywhere.
- **Tone rhythm: free wins.** Flatness `merryfair` 0.33 vs `merryfair-free` 0.12; free sites 0.00–0.12
  vs block 0.00–0.33, and free uses 4 tones where `merryfair` uses 3.
- **Conclusion so far:** the catalog is NOT producing templated sites, so the main argument for
  FreeSection fails. Free's real wins are density and tone rhythm — both composition/theme discipline,
  not consequences of free composition itself. `merryfair-free` proves it: free-composed and the worst
  free site on cost, joint-worst on variety, worst on flatness.
- **Variance within FreeSection exceeds the free-vs-block gap on every distinctiveness metric.**

From tick 3 — **the stability metric does not discriminate**:

- Real validator run (`npm run validate` from `renderer/`, log at `scratchpad/validate.log`).
  Raw: block 1.07 issues/section, free 0.58. But it decomposes away.
- **Five of the top six rules fire 3-and-3 on both kinds** — all theme rules (catalogVersion,
  structural tokens, direction, shadow-only depth, focus token). They detect unswept themes, not
  composition.
- Block-only 4 chrome warnings/site (deprecated Footer shape, no contact, no legal.line, no utility)
  = the three older bundles have older footers. Age, not composition. All 7 sites DO have chrome.
- Free-only: **2 real accent contrast failures at 1.99:1 and 2.45:1** — the one genuine quality gap
  the validator found, and it is theme-level.
- **Confounder that matters: only `wungadv` has org.json, so only it ran the jurisdiction rules** —
  and it is the only site with an error (`org.registration` required, s.30(2)). The other six are
  partly UNCHECKED, not clean. `renderer/tools/validate.ts` says so in its own comment.
- Density works inside FreeSection trees (`validate-bundle.ts:59` walks props generically; 5
  `under-filled` fired on free sites). MAX_DEPTH=5 in `FreeSection.tsx:28`, no site exceeds 4.
- **Conclusion: blocks do not buy stability. They buy machine-readability** — the seo.ts asymmetry
  from `aeo-geo-seo.md` §3b is the real and only cost of free composition.
- Validator independently confirms the 47-slug boilerplate: "39 slugs defined but unused".

From tick 4 — **the controlled pair kills the last argument for free composition**:

- **`merryfair` -> `merryfair-free` is a genuine controlled pair**: identical 5 page keys, **72% of
  copy verbatim shared** (106 of 148 sentences), theme genuinely re-skinned (only 2 of 39 token values
  carried over). Composition model is the variable that changed.
- **`merryfair-dense` is NOT a conversion** — 22% copy overlap, 1 page, mostly new writing. Corrects
  this loop's own framing: it is a separate data point, not the third arm of the A/B.
- Controlled pair result: free cost **3.35x tokens/word**, content share 49% -> 26%, **no more
  variety** (0.79 vs 0.78, 26 vs 29 distinct compositions), **worse density** (42 vs 46 words/section),
  better tone rhythm (flatness 0.12 vs 0.33), and **lost the entire JSON-LD graph**.
- Node depth 2 for `merryfair-free` vs 4 everywhere else + 72% shared copy = signature of mechanical
  re-scaffolding, not composition.
- **THE DENSITY WIN DISSOLVES.** Tick 1's 70-vs-45 words/section gap is not a composition effect: the
  controlled pair goes the wrong way (42 vs 46). The fleet-level density advantage comes from
  `merryfair-dense` (104), `gmr` (102), `wungadv` (91) — all NEWLY WRITTEN after the `SKILL.md:269`
  density guidance and the `under-filled` rule existed. Density is a briefing + validator effect.
- Free composition's only surviving win is **tone rhythm**.

From tick 5 — **verdict: semantic-first hybrid, cut 4 blocks not 15**:

- FreeSection does NOT solve the templated-site problem, because the catalog does not cause it.
  Templating lives in the themes: 6 of 7 set zero structural tokens, no `direction`, 47 identical slugs.
- Free composition's only un-confounded win is tone rhythm (0.12 vs 0.33 flatness).
- **30% of free sections (21 of 71) already carry schema-eligible primitives invisible to `seo.ts`**:
  13 `KeyValue` (-> Product.additionalProperty), 5 `Quote` (-> Review), 38 `Stat`, 12 `Field`. Fixing
  the resolver recovers schema with zero content change. Biggest single win.
- Cuttable on evidence: `Breadcrumb`, `Notice`, `PostList`, `Team` (0 uses each). Nine blocks earn
  their place by JSON-LD or chrome; six more by usage; four are thin but used.
- Rule proposed: if a semantic block fits the content use it; otherwise FreeSection.

**Superseded note.** Cost says free composition is 2.33× more expensive per word. That is
only justified if it buys measurably more distinctiveness. If overlap and repetition show free sites
converging on their own repeated node-trees, the premium buys nothing and the answer is to cut.

## Rules in force

- Docs only. No code edits, no cuts, no branch.
- Scripts in scratchpad, never in the repo.
- Measure, don't assert. Every number reproducible from a named file or command.
- If a metric doesn't discriminate, say so plainly.
- Tick 3 must run the REAL validator (`renderer/tools/validate.ts`), not a reimplementation, and log
  to the scratchpad rather than re-running.
- `workers.md` claim: `opus-measure`, files `docs/research/**`. Delete on stop.
