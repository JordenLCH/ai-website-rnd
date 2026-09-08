# Creative *and* upgradeable — delta on the 2026-09-07 research

Tick 2 of the research loop. **Not a fresh survey.** `docs/research/2026-09-07-distinctive-design.md`
and `docs/research/2026-09-07-maintainable-generation.md` already cover the ground. This doc answers
one question against the repo as it stands on 2026-09-08:

> Of everything those two docs recommended, what shipped, what did not, and what did the shipping
> itself break?

Answer, in one line: **the contract and the validator absorbed nearly every recommendation; the fleet
did not adopt them; and the escape hatch that shipped alongside has eaten 54% of the fleet.**

---

## 1. Recommendations that shipped, verbatim

`2026-09-07-distinctive-design.md` §4 proposed six token additions. All six are in
`renderer/src/tokens.ts`:

| Recommended (§4) | Shipped as | Where |
|---|---|---|
| 1. Type-scale ratio token | `--scale-ratio` | `renderer/src/tokens.ts` OPTIONAL_TOKENS |
| 2. Density / spacing multiplier | `--density` | same |
| 3. Motion tokens (duration + easing) | `--motion-duration`, `--motion-ease`, `--motion-state`, `--motion-distance` | same |
| 4. Grid / column token + breakout | `--grid-cols`, `--breakout` | same |
| 5. Radius as a *pair* | `--radius-tight` alongside `--radius` | same |
| 6. Elevation scale, named intent | `--elev-1`, `--elev-2` + surface ramp `--color-surface-2/-3` | same |

§2 proposed four validator checks. Three of the four shipped, and a fourth rule was added that the
research did not ask for:

| Recommended (§2) | Shipped? | Where |
|---|---|---|
| 1. Uniform border-radius across surfaces | ✅ | `renderer/src/validate-bundle.ts:175-188` — compares `--radius`, `--radius-img`, `--btn-radius`, `--radius-tight`, warns on a shared non-zero value |
| 2. Indigo/violet accent as sole non-neutral | ✅ | `validate-bundle.ts:193-202`, with a real `hueOf()` parser at `:150` |
| 3. Monospace present but used only for labels | ✅ | `validate-bundle.ts:841-848` |
| 4. Headline specificity — keep as guidance, not a rule | ✅ (correctly *not* implemented) | `skills/create-webpage/SKILL.md:288` |
| — (not requested) shadow-only depth with no surface ramp | ✅ | `validate-bundle.ts:326-335` |
| — (not requested) structural tokens all unset | ✅ | `validate-bundle.ts:213-217` |
| — (not requested) `theme.direction` missing / null adjectives | ✅ | `validate-bundle.ts:301-320` |

`2026-09-07-maintainable-generation.md` §4 (migration mechanics) also shipped: `deprecated` arrays
exist on `renderer/src/blocks/shared.ts`, `Footer.tsx` and `Gallery.tsx`, with the fixture-test
requirement enforced by `renderer/tools/migrations.ts`.

This is an unusually high implementation rate. The delta below is not "you ignored the research".

---

## 2. The gap that opened instead: contract adopted, fleet didn't

Every identity-carrying token is in `OPTIONAL_TOKENS` (`renderer/src/tokens.ts`). Every
colour token is in `REQUIRED_TOKENS`. So the contract **requires the eleven tokens the research says
carry the least identity, and makes optional all six that carry the most.**

Measured across `renderer/src/content/*/theme.json` on 2026-09-08:

| Theme | `direction` set? | Structural tokens set |
|---|---|---|
| `aonic` | no | none |
| `firstmetrology` | no | none |
| `gmr` | no | none |
| `merryfair` | no | none |
| `merryfair-dense` | no | none |
| `merryfair-free` | no | none |
| `wungadv` | **yes** | **all 8** (`--scale-ratio`, `--density`, `--motion-duration`, `--motion-ease`, `--grid-cols`, `--radius-tight`, `--elev-1`, `--breakout`) |

**6 of 7 themes vary only colour and size** — precisely the failure `validate-bundle.ts:217` describes
in its own warning text ("this theme varies only colour and size, which is the cheapest kind of
variation and the easiest to see through"). Only `wungadv` — untracked at the time of writing, per
`git status` — is on the new contract.

Two consequences worth stating plainly:

1. **The warnings are `severity: 'warning'`, not `'error'`** (`validate-bundle.ts:12` defines the
   union; the structural-token and direction rules use `'warning'`/`'info'`). A legacy theme is valid
   forever. Nothing forces the sweep, so the gap does not close on its own.
2. **`fleet_siblings` divergence is now measured against a weak baseline.** If six of seven fleet
   members vary only in hue, "diverge from the fleet" is a low bar that a new site clears while still
   being generic. The divergence score's usefulness degrades as long as the fleet is unswept — and
   this is invisible from inside the score, which is exactly the class of problem
   `docs/how-a-site-gets-generated.md:88` already names for the *category* default.

---

## 3. The headline delta: the escape hatch took over

`2026-09-07-maintainable-generation.md` §3 gave an unambiguous recommendation:

> **no free-text HTML/CSS escape hatch in `site.json`, ever — including on the AI-generation path.**

with one carve-out: *bounded freeform is legitimate as rich text within one prop, as a
Portable-Text-style array of typed nodes.*

### What shipped got the *shape* right

`renderer/src/blocks/FreeSection.tsx` is the carve-out, honestly built:

- `children: z.array(NodeSchema).min(1)` (line 23) — typed nodes, not an HTML string.
- No `dangerouslySetInnerHTML`, no `rawHtml` prop, no free CSS string. The only `style=` is a
  two-property CSS-var pass-through (line 46).
- `MAX_DEPTH = 5` (line 28) caps nesting.
- `role` is a closed enum (line 9) and is retained *specifically* so JSON-LD and house rules keep
  working — the comment says so.

Judged against the recommendation's letter, this is compliant. It is not raw markup.

### What shipped got the *scope* wrong

The recommendation's carve-out was **rich text within one prop**. `FreeSection` is not that: it also
takes a `grid` object (cols 1–12, gap, align, minH, pad, bleed — lines 10-17) and an optional `bg`
with parallax (lines 18-22). That is **layout composition as per-site data**, which is a different
thing from rich text, and it is the thing §3 argued should become a new catalog variant instead.

Then the adoption. Block-type census across `renderer/src/content/*/site.json`, 2026-09-08:

| Site | Total blocks | `FreeSection` | Distinct block types |
|---|---|---|---|
| `aonic` | 4 | 0 | 4 |
| `firstmetrology` | 20 | 0 | 12 |
| `merryfair` | 37 | 0 | 18 |
| `gmr` | 6 | **6 (100%)** | **1** |
| `merryfair-dense` | 8 | **8 (100%)** | **1** |
| `merryfair-free` | 33 | **33 (100%)** | **1** |
| `wungadv` | 24 | **24 (100%)** | **1** |
| **fleet** | **132** | **71 (54%)** | — |

**Four of seven sites contain zero catalog blocks.** They are 100% `FreeSection`. And they are the
*newest* four — the three that use the catalog are the older ones.

This is the trap `2026-09-07-maintainable-generation.md` §2 was written to give early warning of, and
the warning sign it named has already fired. Restating the cost in this repo's own terms
(`CLAUDE.md`):

> ship a fix to a block and every site inherits it on rebuild — but only because no site contains
> bespoke markup.

Literally true still: no site contains bespoke *markup*. But a `FreeSection` site contains bespoke
*layout* — grid columns, gaps, padding, bleed, parallax, and a node tree, all as site-local data. Fix
`Features.tsx` and four of seven sites inherit nothing, because they do not use `Features`. The
guarantee has been preserved at the level it was written and voided at the level it mattered.

Supporting evidence that this is a road being paved, not an accident:
`renderer/tools/build_free.py` is 29K — a dedicated tool for authoring `FreeSection` trees.

### The honest counter-argument

`FreeSection` may be *why* `wungadv` is the only theme carrying a real direction and all eight
structural tokens. Free composition is plainly the shortest path to the per-section layout variety
that `2026-09-07-distinctive-design.md` ranks as lever #1. The tension is real, not a mistake:

- **Catalog blocks** buy fleet-wide patchability and cost expressive range.
- **`FreeSection`** buys expressive range and costs fleet-wide patchability.

The research's own answer to that tension is §1.4, the **Rule of Three**: a visual need seen three
times becomes a reviewed catalog block, inherited fleet-wide. With 71 `FreeSection` instances live
and no process that harvests recurring node-trees back into named variants, the ratchet only turns
one way.

---

## 4. Recommendations still open

Ranked by cost of continued inaction. All are for tick 4 to cost out; **no code was changed here.**

1. **Decide what `FreeSection` is for, and write it down.** Either it is a *prototyping* surface
   whose output gets harvested into catalog variants, or it is the real authoring surface and the
   fleet-patchability pitch in `CLAUDE.md` needs rewriting to match. Right now the docs claim one and
   the fleet does the other. Cheapest possible fix, highest value.
2. **Harvest loop for the Rule of Three.** Cluster the 71 live `FreeSection` node-trees; any shape
   appearing three times becomes a named variant. Without this, §1.4 is aspirational.
3. **Sweep the six legacy themes onto the structural tokens + `direction`.** Until then
   `fleet_siblings` measures divergence against a fleet that varies only in hue.
4. **Reconsider required-vs-optional.** The tokens that carry identity are optional; the ones that do
   not are required. At minimum, promote `theme.direction` from warning to error for *new* bundles —
   it costs three lines and it is the audit anchor for stage 7 (`SKILL.md:309` item 9).
5. **Per-section density as a dial.** `--density` exists as a theme-level token; §1 lever 3 asked for
   density to *vary section to section* ("flat rhythm is itself a tell"). Whether `sectionStyles`
   vars actually vary it per section is unverified here — flag for tick 4.

## Method note

Every claim above was checked against the cited file on 2026-09-08. Block and token censuses were
computed from `renderer/src/content/*/site.json` and `*/theme.json` directly, not estimated. No
external sources were needed for this tick — the prior docs carry the citations, and this is a
delta against the repo.
