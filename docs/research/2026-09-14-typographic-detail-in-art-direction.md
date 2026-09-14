# What real art directors do with tracking, and what our themes do instead

Research, 2026-09-14. Companion to `docs/research/human-web-design-process.md` (the studio
*process*) and `docs/2026-09-10-how-professionals-choose-colour.md` (colour *method*). Neither of
those, nor any other file in this repo, contains a single letter-spacing number — this one does.

Asked because every generated theme reaches for wide-tracked uppercase micro-labels, and the
question was put plainly: *do people actually use it?*

**How to read the labels**, same scheme as the colour file:

- **[doc]** — the system or typographer documents this, quoted from its own page.
- **[measured]** — I loaded the live site in a browser and read `getComputedStyle`. Reproducible.
- **[inference]** — mine, reasoned from the above. Arguable.
- **[gap]** — could not verify from a primary source. Named rather than filled.

---

## 0. A correction that has to come first

An earlier note in this session contrasted "six generated themes" against `merryfair`, described
as hand-made. **That was wrong and the conclusion drawn from it was unsound.**

- `dev/` is gitignored, so no theme in `dev/fleet-archive/` has any history to inspect. **[measured]**
- `docs/2026-09-04-spike-findings.md:78` records `merryfair-industrial` as generated: "Generated
  four directions and took the **off-mode** one (Verbalized Sampling)… Archivo 800 at
  `-0.045em`". **[doc]**
- For the plain `merryfair` theme there is **no evidence either way**. It was called hand-made
  because it was the outlier in a table — inferring the cause from the desired result. **[gap]**

So: **7 of 7 fleet themes are model output and there was no human control group.** The uniformity
observation survives on its own (six of seven independently chose the same move); the claim that
"the human chose differently" does not. This document exists to supply the control group the
archive never had.

---

## 1. What the typographers say

| Source | Rule | Value |
|---|---|---|
| Butterick, *Practical Typography* | letterspace all caps and small caps | **"5–12% extra space"**, i.e. `0.05em`–`0.12em`; "particularly important at small sizes" **[doc]** |
| Butterick | lowercase | "Lowercase letters don't ordinarily need letterspacing" **[doc]** |
| Butterick | the ceiling | too wide when "spaces between letters are large enough to fit more letters" **[doc]** |
| Pimp My Type | all-caps starting point | **`0.1em`**, then adjust by eye **[doc]** |
| Pimp My Type | modifiers | light weights need more, **bold needs less**; sans needs more than serif **[doc]** |
| Goudy, via Butterick | the old saw | "Anyone who would letterspace lowercase would steal sheep" **[doc]** |

Two things follow that our themes do not encode. Tracking is a function of **size** (smaller wants
more) and of **weight** (bolder wants less) — so a single `--eyebrow-tracking` token applied at
whatever size the eyebrow happens to render is already the wrong shape of control. **[inference]**

## 2. What the design systems ship

Material 3's published type-scale tokens, in full **[doc]**:

| Role | Size | Tracking | As em |
|---|---|---|---|
| Display Large | 57px | -0.25px | **-0.004em** |
| Display Medium / Small | 45 / 36px | 0 | **0** |
| Headline L/M/S | 32 / 28 / 24px | 0 | **0** |
| Title Large | 22px | 0 | 0 |
| Title Medium / Small | 16 / 14px | 0.15 / 0.1px | +0.009 / +0.007em |
| Body Large / Medium / Small | 16 / 14 / 12px | 0.5 / 0.25 / 0.4px | +0.031 / +0.018 / +0.033em |
| Label Large | 14px | 0.1px | +0.007em |
| Label Medium / Small | 12 / 11px | 0.5px | **+0.042 / +0.045em** |

M3's own label styles — the role our "eyebrow" occupies — top out at **+0.045em**, and M3 sets
them in **sentence case**; the all-caps button of M2 was dropped. IBM Carbon is in the same
territory: its expressive `label-02` is 14px with `0.16px` of letter-spacing, **+0.011em**. **[doc]**

Note the direction of travel across the whole M3 table: **tracking falls as size rises**, reaching
zero or slightly negative at display sizes. That is the same law the typographers state.

## 3. What real sites actually ship

Loaded in a browser, `getComputedStyle` read off the live pages, 2026-09-14. **[measured]**

| Site | Largest heading | Body | Uppercase micro-labels |
|---|---|---|---|
| stripe.com | 34px @ **-0.01em**, some -0.02em | 22px @ -0.01em | **none on the page** |
| pentagram.com | 36px @ **-0.01em** | 16px @ **0** | **none** |
| apple.com/mac | 40px @ **0**, 32px @ +0.004em | 12px @ -0.01em | **none** |
| aesop.com | 24–25px @ **0** | 14px @ 0 | present but @ **0** |
| nytimes.com | — | — | 11px @ **+0.1em**; 10px @ +0.05em |

Five sites, four of them with no tracked-caps label anywhere in content. The one that uses them —
a newspaper, where the kicker is an editorial function with a century of precedent — sets them at
**11px and +0.1em**, the top of Butterick's range and no further.

Display tracking across every site measured lands in **-0.02em to 0**. Nobody went past -0.02em.

## 4. Our themes against that baseline

Values read from `dev/fleet-archive/*/theme.json` and `site-hosting/content/*/theme.json`. **[measured]**

| Theme | `--display-tracking` | `--eyebrow-tracking` | eyebrow case |
|---|---|---|---|
| aonic | -0.03em | **0.2em** | uppercase |
| firstmetrology | -0.01em | **0.18em** | uppercase |
| gmr | -0.025em | **0.16em** | uppercase |
| merryfair-dense | **-0.045em** | **0.16em** | uppercase |
| merryfair-free | **-0.045em** | **0.16em** | uppercase |
| wungadv | -0.015em | **0.2em** | uppercase |
| merryfair | -0.012em | 0.01em | none |

Two findings, of different weight.

**The display column is mostly fine.** Four of seven sit inside the measured -0.02em–0 band or
just outside it. The two at `-0.045em` are tighter than any site measured here — and that value is
traceable: `docs/2026-09-04-spike-findings.md` records it as a deliberate art-direction choice
("Archivo 800 at `-0.045em`", Swiss industrial catalogue). A heavy grotesque at poster size is
exactly the case where tight tracking is correct. **It is defensible; it is just at the edge, and
nothing in the system knows it is at the edge.** **[inference]**

**The eyebrow column is the real finding.** `0.16em`–`0.2em` is:

- **above Butterick's stated ceiling** of 0.12em for caps,
- **3.5–4.4×** M3's widest label (0.045em),
- **1.6–2×** what the NYT uses on kickers, its house speciality,
- and applied at `--eyebrow-size: 0.86rem` ≈ 13.8px, where the typographers' rule asks for *less*
  than at the 10–11px those references are describing.

And six of seven reached for it independently. That is not six art directions; that is one mode.
The repo already names the mechanism — "the first direction a model proposes is the mode of its
training data" — this is a measurable instance of it. **[inference]**

## 5. What this implies for the pipeline

Ordered by evidence strength, not by ease.

1. **Give `--eyebrow-tracking` a documented range in the skill's art-direction reference:
   `0.05em`–`0.12em`, citing Butterick, with `0.1em` as the starting point.** A theme wanting more
   should have to say why. Not a stylesheet clamp — the stylesheet must not overrule an art
   direction, and this session already tried and reverted that. **[inference]**
2. **Treat "uppercase eyebrow" as a choice with an alternative, not a default.** M3 dropped
   all-caps labels outright; four of five measured sites carry none. The reference should offer
   sentence-case small labels, no label at all, and a rule or colour shift as the ways to mark a
   section opener — and note that if every sampled direction has tracked caps, only one direction
   was sampled.
3. **Tracking should fall as size rises, and it currently cannot.** One token applied at one size
   cannot express the law every source states. The honest fix is a size-aware pair
   (`--tracking-display` near 0, `--tracking-micro` in the caps range) rather than the current
   single value reused wherever a display face appears. **[gap]** — worth a spike, not a guess.
4. **The archive is not a baseline.** It is seven samples from one generator. Any future "do our
   themes look normal?" question needs measured outside evidence, as here; this file's §3 table is
   reusable and the measuring script is four lines of `getComputedStyle`.

## 6. What this file does not cover

- Kerning, optical sizing, and variable-font `opsz` axes — untouched. **[gap]**
- Whether wide tracked caps are *correct* in luxury/fashion, where the convention is strongest.
  Aesop, the obvious test, ships `0`. One counter-example is not a survey. **[gap]**
- Non-Latin scripts, where letterspacing ranges from meaningless to actively wrong. **[gap]**

## Sources

- [Butterick's Practical Typography — Letterspacing](https://practicaltypography.com/letterspacing.html)
- [Pimp My Type — Spacing all caps](https://pimpmytype.com/spacing-all-caps/)
- [Material Design 3 — type scale tokens](https://m3.material.io/styles/typography/type-scale-tokens) (values via the mirrored token table at [material-design-skill/references/typography.md](https://github.com/yhongm/material-design-skill/blob/master/references/typography.md))
- [Carbon Design System — type sets](https://carbondesignsystem.com/elements/typography/type-sets/)
- [Verdigris Design System — Eyebrow typography](https://design.verdigris.co/categories/typography/eyebrow)
- Live measurements: [stripe.com](https://stripe.com), [pentagram.com](https://www.pentagram.com), [apple.com/mac](https://www.apple.com/mac/), [aesop.com](https://www.aesop.com/us/), [nytimes.com](https://www.nytimes.com)
