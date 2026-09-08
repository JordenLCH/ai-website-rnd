# FreeSection vs the catalog blocks — measured

Settling by evidence, not opinion: does `FreeSection` deliver more distinctive sites than the 25
catalog blocks, or do the blocks deliver stability that free composition loses?

Decision pending: cut ~15 blocks down to ~8 semantic ones, or keep the catalog. **No code has been
cut, and none will be inside this document.**

Harness: `scratchpad/measure.py`, run as `python3 measure.py <repo-root>`. Every number below is
derived from `renderer/src/content/*/site.json` as it exists on disk on 2026-09-08. Note
`renderer/src/content` is gitignored as of commit `95ba318`, so these files are present locally and
not in the repo; `wungadv` is untracked but included.

Token estimates are `characters / 4`. That is a rough heuristic, stated so the *ratios* below are
read as ratios and not as billing figures.

---

## 1. Cost — measured first, because it is a stated goal

`goal.md` bullet 3: *"Reduce AI token usage from our own site."* Nobody had measured this.

### Per site

| Site | Kind | Pages | Sections | Bytes | ~Tokens | ~Tok/section | Content % | Nodes | Max depth |
|---|---|---|---|---|---|---|---|---|---|
| `aonic` | block | 1 | 4 | 5,093 | 1,273 | 318 | 52% | — | — |
| `firstmetrology` | block | 5 | 20 | 19,742 | 4,936 | 246 | 43% | — | — |
| `merryfair` | block | 5 | 37 | 35,039 | 8,760 | **236** | 49% | — | — |
| `gmr` | free | 1 | 6 | 36,057 | 9,014 | 1,502 | 38% | 112 | 4 |
| `merryfair-dense` | free | 1 | 8 | 41,636 | 10,409 | 1,301 | 41% | 120 | 4 |
| `merryfair-free` | free | 5 | 33 | 95,630 | 23,908 | 724 | **26%** | 333 | 2 |
| `wungadv` | free | 4 | 24 | 81,038 | 20,260 | 844 | 45% | 232 | 4 |

*Content %* = share of JSON characters that are prose string values, versus scaffolding (keys, enum
values, grid numbers, punctuation).

### Aggregate

| Kind | Sites | Sections | ~Tok/section | Content % | Scaffold chars/section |
|---|---|---|---|---|---|
| block | 3 | 61 | **245** | 48% | 268 |
| free | 4 | 71 | **895** | 36% | 772 |

**FreeSection costs 3.65× more tokens per section, and a smaller share of those tokens is content.**

### The fairness control: is the cost buying more content?

Partly. Controlling for words of actual copy:

| Site | Kind | Sections | Words | Words/section | **Tokens per word delivered** |
|---|---|---|---|---|---|
| `merryfair` | block | 37 | 1,717 | 46 | **5.10** |
| `firstmetrology` | block | 20 | 869 | 43 | 5.68 |
| `aonic` | block | 4 | 183 | 46 | 6.96 |
| `wungadv` | free | 24 | 2,190 | **91** | 9.25 |
| `merryfair-dense` | free | 8 | 835 | **104** | 12.47 |
| `gmr` | free | 6 | 612 | **102** | 14.73 |
| `merryfair-free` | free | 33 | 1,401 | 42 | **17.06** |

| Kind | Words/section | Tokens per word |
|---|---|---|
| block | 45 | **5.41** |
| free | 70 | **12.62** |

Two things are true at once, and both matter:

1. **FreeSection sites are genuinely denser** — 70 words/section vs 45, +56%. Density is the failure
   mode `SKILL.md:269` cares most about, so this is a real win, not an artifact.
2. **It still costs 2.33× more tokens per word of copy delivered.** Density explains part of the
   3.65× gap; it does not explain all of it.

### The clean case inside the natural experiment

`merryfair` and `merryfair-free` are the same client and brief:

| | `merryfair` (block) | `merryfair-free` (free) |
|---|---|---|
| Sections | 37 | 33 |
| Words | 1,717 | 1,401 |
| **Words/section** | **46** | **42** |
| ~Tokens | 8,760 | 23,908 |
| **Tokens per word** | **5.10** | **17.06** |

Density is essentially identical — 46 vs 42 words per section. So for this pair the density defence
does not apply at all: **`merryfair-free` spends 3.35× the tokens to deliver the same amount of copy
for the same client.** It reads as a mechanical conversion of the block site into node trees, with no
content gain to show for it.

Meanwhile `wungadv` — the best-composed free site, and the only one with `theme.direction` and all
eight structural tokens — is the cheapest free site at 9.25 tokens/word while carrying **twice** the
copy per section of any block site. FreeSection done well and FreeSection done mechanically are 1.8×
apart on cost.

### What cost alone does and does not settle

It settles that free composition is **not** cheaper, and that `goal.md` bullet 3 is in real tension
with the current direction. It does **not** settle the decision: 2.33× per word is a price, and a
price is only bad relative to what it buys.

**What it must buy to be worth it is distinctiveness.** That is tick 2, and it is the tick that
decides this.

---

*Ticks 2–5 (distinctiveness, stability, the full head-to-head, verdict) follow.*

---

## 2. Distinctiveness — the deciding tick

Harness: `scratchpad/distinct.py` and `scratchpad/fair.py`.

### 2a. A measurement bug found first — the repo's divergence check is wrong for FreeSection

The first pass used the shape notion the repo itself uses
(`renderer/src/validate-bundle.ts:678-684`): a block is `Type/layout`, a `FreeSection` is
`free:<role>:<cols>`. On that basis the four free sites look badly converged:

| Pair | Overlap (repo's shape notion) |
|---|---|
| `merryfair-free` ∩ `wungadv` | **0.90** |
| `merryfair-dense` ∩ `merryfair-free` | **0.80** |
| `gmr` ∩ `merryfair-dense` | **0.75** |
| `merryfair-dense` ∩ `wungadv` | **0.70** |
| `gmr` ∩ `wungadv` | 0.67 |
| `gmr` ∩ `merryfair-free` | 0.60 |

All six free-free pairs ≥ 0.60; four exceed the ~0.7 threshold `CLAUDE.md` names as "change the layout
map, not the palette".

**That is an artifact.** `free:<role>:<cols>` has a tiny vocabulary — 12 roles × 12 column counts —
so any two free sites collide constantly. Re-measured on the actual node-tree structure (element
types and nesting, text ignored), the picture inverts:

| Pair | Overlap (node-tree structure) | Shared structures |
|---|---|---|
| `gmr` ∩ `merryfair-dense` | 0.40 | 4 |
| `gmr` ∩ `merryfair-free` | 0.03 | 1 |
| `merryfair-dense` ∩ `merryfair-free` | 0.03 | 1 |
| `merryfair-free` ∩ `wungadv` | **0.02** | 1 |
| `gmr` ∩ `wungadv` | **0.00** | 0 |
| `merryfair-dense` ∩ `wungadv` | **0.00** | 0 |

Compare block sites on their own like-for-like basis (`Type/layout`):

| Pair | Overlap |
|---|---|
| `firstmetrology` ∩ `merryfair` | 0.33 |
| `aonic` ∩ `firstmetrology` | 0.12 |
| `aonic` ∩ `merryfair` | 0.00 |

**Free sites structurally overlap at 0.00–0.40. Block sites overlap at 0.00–0.33. They are the same,
and neither is converging.** The `merryfair-free` ∩ `wungadv` pair the repo's own check would flag at
0.90 shares exactly **one** structure out of 41.

**This is an actionable defect, independent of the cut/keep decision.** `validate-bundle.ts:678-684`
and `fleet_siblings` will raise false divergence alarms on any two FreeSection sites, and the alarm
gets louder the more sites move to free composition. Whatever is decided below, this needs fixing —
the shape for a `FreeSection` must be derived from its node tree, not from `role:cols`.

### 2b. Within-site variety — no difference

Distinct compositions as a fraction of sections, measured on node-tree structure for free sites and
`Type/layout` for block sites:

| Site | Kind | Sections | Distinct | Variety |
|---|---|---|---|---|
| `gmr` | free | 6 | 6 | 1.00 |
| `merryfair-dense` | free | 8 | 8 | 1.00 |
| `merryfair-free` | free | 33 | 26 | **0.79** |
| `wungadv` | free | 24 | 16 | 0.67 |
| `aonic` | block | 4 | 4 | 1.00 |
| `merryfair` | block | 37 | 29 | **0.78** |
| `firstmetrology` | block | 20 | 15 | 0.75 |

The same-client pair is the cleanest read: **`merryfair-free` 0.79 vs `merryfair` 0.78.** Identical.
Free composition bought no additional structural variety for that client.

Vocabulary size is also comparable — `merryfair-free` uses 26 distinct node structures, `merryfair`
uses 29 distinct block shapes. **Zero verbatim-duplicate sections in any free site.**

### 2c. Tone rhythm — a genuine FreeSection win

Flatness = share of adjacent section pairs with no tone change. Lower is better; a flat tone run is
itself a templated tell (`2026-09-07-distinctive-design.md` §5).

| Site | Kind | Distinct tones | Changes | **Flatness** |
|---|---|---|---|---|
| `gmr` | free | 4 | 5 | **0.00** |
| `merryfair-dense` | free | 4 | 7 | **0.00** |
| `wungadv` | free | 4 | 22 | **0.04** |
| `merryfair-free` | free | 4 | 28 | **0.12** |
| `aonic` | block | 3 | 3 | 0.00 |
| `firstmetrology` | block | 4 | 15 | 0.21 |
| `merryfair` | block | 3 | 24 | **0.33** |

Free sites alternate tone more consistently (0.00–0.12) than block sites (0.00–0.33), and the
same-client pair confirms it: `merryfair` 0.33 vs `merryfair-free` 0.12. Free sites also use 4 tones
where `merryfair` uses 3.

### 2d. What tick 2 actually settles

| Dimension | Winner | Margin |
|---|---|---|
| Cross-site divergence | **tie** | free 0.00–0.40, block 0.00–0.33 |
| Within-site variety | **tie** | 0.79 vs 0.78 on the same client |
| Tone rhythm | **free** | 0.12 vs 0.33 flatness, same client |
| Density (tick 1) | **free** | 70 vs 45 words/section |
| Token cost (tick 1) | **block** | 2.33× per word delivered |

**The premise behind the cut question does not survive the measurement.** The case for FreeSection
was that the catalog produces templated sites. It does not: `merryfair` (37 blocks, catalog) diverges
from its siblings as well as any free site does, and varies its own sections just as much.

FreeSection's real wins are **density and tone rhythm** — both of which are theme- and
composition-discipline properties, not consequences of free composition per se. `merryfair-free` is
the counter-example that makes this concrete: it is free-composed, and it is the *worst* free site on
cost (17.06 tok/word), joint-worst on within-site variety (0.79), and worst on flatness (0.12). Free
composition did not make it good.

The variance *within* FreeSection (`wungadv` 9.25 tok/word, 91 words/section vs `merryfair-free` 17.06,
42 words/section) is larger than the gap between the two approaches on every distinctiveness metric
here. **What separates good sites from templated ones in this fleet is not the block-vs-free choice.**

Tick 3 tests the remaining claim: that blocks buy *stability* — measured with the real validator.

---

## 3. Stability — does the catalog buy safety free composition loses?

The real validator, not a reimplementation: `npm run validate -- <site.json> <theme.json> [org.json]`
from `renderer/`, which runs `renderer/src/validate-bundle.ts` — the same module the build farm uses.
Full output logged to `scratchpad/validate.log` (134 lines).

### 3a. Headline result

| Site | Kind | Sections | Issues | Errors | **Issues/section** |
|---|---|---|---|---|---|
| `aonic` | block | 4 | 16 | 0 | 4.00 |
| `firstmetrology` | block | 20 | 21 | 0 | 1.05 |
| `merryfair` | block | 37 | 28 | 0 | 0.76 |
| `gmr` | free | 6 | 7 | 0 | 1.17 |
| `merryfair-dense` | free | 8 | 9 | 0 | 1.12 |
| `merryfair-free` | free | 33 | 21 | 0 | 0.64 |
| `wungadv` | free | 24 | 4 | **1** | **0.17** |

| Kind | Issues | Sections | Issues/section |
|---|---|---|---|
| block | 65 | 61 | **1.07** |
| free | 41 | 71 | **0.58** |

Free composition produces *fewer* validator issues per section, not more. But that result does not
survive decomposition — see 3c.

### 3b. Two confounders that change how this reads

**Only one site was fully checked.** `wungadv` is the only bundle with an `org.json`
(established in `aeo-geo-seo.md` §3a), and `renderer/tools/validate.ts` passes org only when the file
exists — its own comment notes that the Malaysian s.30 jurisdiction rules are "otherwise skipped
silently". So the six "✓ valid" results are **partly unchecked, not clean**. `wungadv`'s single error
is the proof:

```
✗ org — Malaysian company: org.registration is required — s.30(2) Companies Act 2016 …
```

The site that supplied entity data is the only one that could fail on it. The other six would very
likely raise the same error the moment an `org.json` appears. **Six of seven bundles are passing a
test they are not sitting for.**

**Chrome quality, not composition, explains much of the gap.** All seven sites have both
`chrome.header` and `chrome.footer`, so the difference is not a missing element. But every block site
raises 4 chrome warnings and every free site raises 0:

| Rule (block sites only) | Count |
|---|---|
| `Footer uses a deprecated prop shape and was migrated` | 3 |
| `no "contact"` in footer | 3 |
| `no "legal.line"` in footer | 3 |
| `no "utility" strip` | 3 |

Those are the three older bundles carrying older, less complete footers — an age difference, not a
composition difference.

### 3c. What the rules actually say — the metric does not discriminate

Ranked rules by kind:

| Rule | block | free |
|---|---|---|
| `under-filled` (density) | 7 | 5 |
| `no catalogVersion recorded` | 3 | 3 |
| `no structural tokens set` | 3 | 3 |
| `no "direction" recorded` | 3 | 3 |
| `depth is expressed only by shadow` | 3 | 3 |
| `no focus-indicator token` | 3 | 3 |
| monospace `--font-eyebrow`/`--font-numeral` | 2 | 0 |
| accent text contrast below 3:1 | 0 | **2** |
| `NN slugs defined but unused by this site` | 0 | 2 |

**Five of the top six rules fire identically — 3 and 3 — on both kinds.** They are theme rules
(`catalogVersion`, structural tokens, `direction`, shadow-only depth, focus token), and they fire on
whichever six themes are unswept, exactly as `flow-audit.md` predicted. They say nothing about
composition.

The rules that do differ split one each way and are both theme-level too: block sites carry the
monospace tell, free sites carry two real **accent contrast failures at 1.99:1 and 2.45:1** — an
accessibility defect, and the only genuine quality gap the validator found in either direction.

Density normalises to a slight free advantage: `under-filled` at 0.11/section (block) vs 0.07/section
(free), consistent with tick 1's word counts.

The validator also confirms the 47-slug finding independently: *"39 slugs defined but unused by this
site"* and *"37 slugs defined but unused"*.

**Stated plainly, per the loop's own rule: this metric does not discriminate.** The validator cannot
tell a block site from a free site. What it detects is unswept themes, old footers and one bad accent
colour — none of which are consequences of the composition model.

### 3d. The one real stability difference, which the validator cannot see

`measure()` in `validate-bundle.ts:59` walks props generically, so density *does* work inside
`FreeSection` trees (5 `under-filled` warnings fired on free sites). Structural safety is bounded by
`MAX_DEPTH = 5` in `renderer/src/blocks/FreeSection.tsx:28`, and no free site exceeds depth 4.

So free composition is not producing structurally unsafe bundles. The asymmetry established in
`aeo-geo-seo.md` §3b stands as the actual cost, and it is a **semantic** loss rather than a stability
one: a free site's content is invisible to `platform/src/seo.ts`, which resolves by block type. The
validator is content-shape-agnostic and therefore unaffected; the SEO derivation is not.

**Blocks do not buy stability. They buy machine-readability.**

---

## 4. The natural experiment, head to head

`merryfair`, `merryfair-free` and `merryfair-dense` are the same client. This tick establishes how
controlled the comparison actually is, then reports every metric side by side.

### 4a. How controlled is it? — very, for one pair

| | `merryfair` | `merryfair-free` | `merryfair-dense` |
|---|---|---|---|
| Pages | 5 | 5 | 1 |
| Page keys | home, products, technology, about, contact | **identical** | home |
| Unique sentences (≥4 words) | 165 | 148 | 73 |
| Copy shared with `merryfair` | — | **106 sentences (72% of its own copy)** | 16 (22%) |
| Theme name | `merryfair` | `merryfair-industrial` | `merryfair-dense` |
| Identical token *values* vs `merryfair` | — | **2 of 39** | 2 of 39 |
| `theme.direction` | none | none | none |
| `sectionStyles` slugs | 47 | 47 | 47 |

**`merryfair` → `merryfair-free` is a genuine controlled pair**: same client, same five page keys,
**72% of the copy is verbatim shared**, and the theme was genuinely re-skinned (only 2 of 39 token
values carried over). The one variable that changed materially is the composition model.

**`merryfair-dense` is not a conversion** — 22% copy overlap, one page, mostly new writing. It is a
fresh dense rewrite and should be read as a separate data point, not as the third arm of an A/B.
This corrects an assumption in this loop's own framing.

### 4b. Every metric, side by side

| Metric | `merryfair` (block) | `merryfair-free` (free) | Winner |
|---|---|---|---|
| Sections | 37 | 33 | — |
| Words | 1,717 | 1,401 | — |
| Words/section | 46 | 42 | tie |
| **~Tokens** | **8,760** | **23,908** | **block, 2.73×** |
| **Tokens per word** | **5.10** | **17.06** | **block, 3.35×** |
| Content share of JSON | 49% | 26% | block |
| Within-site variety | 0.78 | 0.79 | tie |
| Distinct compositions | 29 shapes | 26 structures | tie |
| Verbatim-duplicate sections | 0 | 0 | tie |
| Tone flatness | 0.33 | **0.12** | **free** |
| Distinct tones used | 3 | 4 | free |
| Max node depth | — | 2 | — |
| Validator issues/section | 0.76 | 0.64 | tie (theme rules) |
| Validator errors | 0 | 0 | tie (both unchecked — no `org.json`) |
| **Schema-bearing blocks** | **7 types** | **none** | **block** |
| **JSON-LD emitted** | full graph | **`Organization` + `WebPage` only** | **block** |

### 4c. What the controlled pair shows

Holding client, sitemap and 72% of the copy constant, moving from catalog blocks to free composition:

- **cost 3.35× more tokens per word**, and dropped content share from 49% to 26%
- **produced no more structural variety** (0.79 vs 0.78) and no more distinct compositions
  (26 vs 29)
- **did improve tone rhythm** (flatness 0.12 vs 0.33, 4 tones vs 3)
- **did not improve density** (42 vs 46 words/section — slightly worse)
- **lost the entire structured-data graph**

Node depth 2 is the tell. Every other free site reaches depth 4; `merryfair-free` is flat. Together
with 72% shared copy, that is the signature of a **mechanical re-scaffolding** of an existing block
site rather than a fresh composition — the same content poured into node trees.

### 4d. Where the density win actually came from

Tick 1 found free sites carry 70 words/section against blocks' 45. The controlled pair shows that gap
is **not** attributable to free composition: `merryfair-free` is 42, *below* `merryfair`'s 46.

The fleet-level density advantage comes from `merryfair-dense` (104), `gmr` (102) and `wungadv` (91) —
all **newly written** sites, produced after the density guidance in `SKILL.md:269` and the
`under-filled` validator rule existed. `merryfair-dense` proves it directly: same client, 22% copy
overlap, 104 words/section against `merryfair`'s 46. It is dense because it was *written* dense, and
its name says so.

**Density is a briefing and validator effect, not a composition effect.** The one metric where free
composition looked strongest does not survive the controlled comparison.

---

## 5. Verdict

### (a) Does FreeSection solve the templated-site problem?

**No — because the measurements do not find that problem in the block catalog.**

The case for free composition was that a fixed catalog produces same-looking sites. Measured:

| Test | Block sites | Free sites | Result |
|---|---|---|---|
| Cross-site structural overlap | 0.00–0.33 | 0.00–0.40 | **no difference** |
| Within-site variety (same client) | 0.78 | 0.79 | **no difference** |
| Distinct compositions (same client) | 29 | 26 | **no difference** |
| Verbatim-duplicate sections | 0 | 0 | **no difference** |

`merryfair` composes 37 sections from the catalog into 29 distinct shapes and overlaps its siblings no
more than any free site does. The catalog is not the source of templating.

The two things free composition did appear to win, tested against the controlled pair:

- **Density — dissolved.** Fleet-level 70 vs 45 words/section reverses under control: `merryfair-free`
  42 vs `merryfair` 46. The advantage belongs to the *newly written* sites (`merryfair-dense` 104,
  `gmr` 102, `wungadv` 91), produced after `SKILL.md:269` and the `under-filled` rule existed. Density
  is a briefing and validator effect.
- **Tone rhythm — survives.** Flatness 0.12 vs 0.33 on the controlled pair, 4 tones vs 3. This is
  FreeSection's one measured, un-confounded win.

Against that, the costs are large and consistent: **3.35× tokens per word of copy** on the controlled
pair (17.06 vs 5.10), content share of the JSON falling 49% → 26%, and the entire JSON-LD graph lost.

**Where the templating actually lives:** six of seven themes set zero structural tokens, have no
`theme.direction`, and share an identical 47-slug `sectionStyles` map — a finding the validator now
reports itself (*"39 slugs defined but unused by this site"*). The variance *within* FreeSection
(`wungadv` 9.25 tok/word at 91 words/section vs `merryfair-free` 17.06 at 42) exceeds the gap between
the two composition models on every distinctiveness metric measured here. **What separates a good site
from a templated one in this fleet is the theme and the brief, not the composition model.**

### (b) Which blocks earn their place, on evidence

Usage counted across all seven bundles; schema role from `platform/src/seo.ts`.

| Block | Uses | Sites | Carries JSON-LD | Verdict |
|---|---|---|---|---|
| `Hero` | 11 | 3 | `BreadcrumbList` (`seo.ts:243`) | **keep** |
| `Nav` | 3 | 3 | — (chrome, required) | **keep** |
| `Footer` | 3 | 3 | — (chrome, statutory gate) | **keep** |
| `Locations` | 2 | 2 | `LocalBusiness`+`PostalAddress` (`:177`) | **keep** |
| `SpecTable` | 3 | 2 | `Product` (`:208`) | **keep** |
| `CatalogGrid` | 2 | 2 | `Product` (`:209`) | **keep** |
| `Testimonials` | 2 | 1 | `Review` (`:224`) | **keep** |
| `FAQ` | 1 | 1 | `FAQPage` (`:198`) | **keep** |
| `Steps` | 3 | 2 | `HowTo` (`:233`) | **keep** |
| `CTA` | 10 | 3 | — | keep (usage) |
| `MediaText` | 6 | 2 | — | keep (usage) |
| `Features` | 5 | 3 | — | keep (usage) |
| `Stats` | 5 | 3 | — | keep (usage) |
| `RichText` | 3 | 2 | — | keep (usage) |
| `ContactForm` | 2 | 2 | — | keep, but **defective** (`ContactForm.tsx:13,38` — no endpoint) |
| `LogoWall` | 2 | 2 | — | keep (usage) |
| `Gallery` | 1 | 1 | — | thin |
| `Pricing` | 1 | 1 | — | thin |
| `Promo` | 1 | 1 | — | thin |
| `Timeline` | 1 | 1 | — | thin |
| `Breadcrumb` | **0** | 0 | — (`seo.ts:243` reads `Hero.breadcrumb`, not this block) | **cut** |
| `Notice` | **0** | 0 | — | **cut** |
| `PostList` | **0** | 0 | — | **cut** |
| `Team` | **0** | 0 | — | **cut** |
| `FreeSection` | 79 | 4 | — (invisible to `seo.ts`) | keep |

**Four blocks are cuttable on evidence, not fifteen.** Nine earn their place by carrying JSON-LD or
being chrome; six more by real usage; four are thin but used.

### (c) Recommendation: semantic-first hybrid. Do not cut 15, and do not make FreeSection the default.

The evidence does not support either extreme. It supports a rule about *when* each is used:

> **If a semantic block fits the content, use it. If none fits, use `FreeSection`.**

The block is cheaper (3.35× on the controlled pair) and machine-readable; free composition is the
fallback that guarantees nothing is inexpressible. That preserves "the AI can always compose freely"
while defaulting to the form that costs less and emits schema.

Ranked actions, with the number behind each:

1. **Fix `seo.ts` FreeSection blindness — biggest single win, and it needs no content change.**
   **21 of 71 free sections (30%) already contain schema-eligible primitives** that `seo.ts` cannot
   see: 13 `KeyValue` uses (→ `Product.additionalProperty`), 5 `Quote` (→ `Review`), 38 `Stat`, 12
   `Field`. The data is written; only the resolver is missing. Fix template exists at
   `validate-bundle.ts:678-684`.
2. **Fix the divergence-shape bug** (`validate-bundle.ts:678-684`, `fleet_siblings`). `free:<role>:<cols>`
   reports free-free overlap at 0.60–0.90 when true structural overlap is 0.00–0.40; the pair flagged
   at 0.90 shares **one structure out of 41**. False alarms today, worse as more sites go free.
3. **Sweep the six clone themes** — zero structural tokens, no `direction`, 47 identical slugs. This
   is where the templating actually is, and the validator already reports it.
4. **Cut the four zero-usage blocks**: `Breadcrumb`, `Notice`, `PostList`, `Team`. Low value, low risk;
   confirm `Breadcrumb` is redundant with `Hero.breadcrumb` before removing.
5. **Fix the two accent-contrast failures** (1.99:1, 2.45:1) — the only real defect the validator found.
6. **Collect `org.json`.** Six of seven bundles are passing jurisdiction checks they are not sitting
   for, per `renderer/tools/validate.ts`'s own comment.

**Not recommended:** cutting to ~8 blocks. It would delete six blocks with real usage and four thin
ones to solve a templating problem the measurements locate in the themes instead, while raising cost
per word and shrinking schema coverage further.

**Note on the earlier recommendation.** `docs/research/README.md` and `docs/flow-audit.md` floated
cutting 25 blocks to ~8. That was reasoning from usage share alone; the controlled comparison does not
support it. Treat this section as superseding it.

### Reproducing everything here

```
scratchpad/measure.py   # cost: tokens/section, content vs scaffold, tokens per word
scratchpad/distinct.py  # variety, repo-shape overlap, tone rhythm, structural repetition
scratchpad/fair.py      # like-for-like cross-site overlap
cd renderer && npm run validate -- src/content/<c>/site.json src/content/<c>/theme.json [org.json]
```

All inputs are `renderer/src/content/*/` on disk as of 2026-09-08 (gitignored since `95ba318`).
