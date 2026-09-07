# Making generated sites look designed, not templated

*7 September 2026. Supersedes the assumption that the gap was motion.*

## What was actually wrong

Two reference sites were supplied for comparison (`better_AI_demo/`): a standalone Emit Solar page
and a Relume screenshot. Both were measured against `merryfair-free` rendered in the preview.

| per 1000px of page | merryfair-free | Emit demo |
|---|---|---|
| words | 55 | **168** |
| DOM nodes | 27 | **63** |
| images | 0.96 | **1.8** |
| distinct font sizes (page) | 12 | **27** |
| scroll-linked motion | 6 reveal types | **none** |

The Emit page's entire motion budget is a sticky nav and two keyframes. It has no parallax and no
scroll-linked animation, and it still reads as a real company's website. **The gap was never motion.**

It was density and specificity. `merryfair-free`'s home page carried 343 words and 6 images over
6,273px — full-height sections holding a headline and a sentence. That is the visual signature of an
unfinished template, and no amount of theme work fixes it.

Three things caused it:

1. **Nothing measured density.** The validator checked structure, never whether a section said
   anything.
2. **No detail vocabulary.** The 15 primitives had no caption, badge, step marker or spec row — the
   elements a professional page is actually built from. A section could only be heading + text + image.
3. **"Never invent facts" and density were in direct conflict.** The rule stopped the generator
   filling a page, so it shipped empty ones instead. Notably the *brief was not the constraint* —
   `website_info/merryfair/merryfair.md` contains composition percentages, delivery windows, warranty
   terms and export figures that the generated site never used.

## What changed

**Density is measured and reported.** `validate-bundle.ts` walks each block's props for copy-bearing
strings (a key whitelist, so `src` and `area` don't flatter an empty section) and reports words,
content nodes and images per section. Warning below 20 words / 3 nodes, informational below 60 / 6,
plus page-level targets of 700 words and one image per two sections. Hero, CTA, quote, nav and footer
are exempt.

Severity is `warning`/`info`, never `error`. A hard gate would have failed every existing bundle at
the build farm, and blocking the fleet to make a point about typography is the wrong trade. The
pressure comes from the preview surfacing per-section counts and the skill making a clean run a
handoff requirement.

**Five detail primitives**, each a typed enum with a house rule — `Figure` (image + caption),
`Caption`, `Badge`, `Marker`, `KeyValue` — plus `accent` on `Heading`/`Text`, which colours one
verbatim substring. A substring, not markup: the heading stays one string for outline extraction and
JSON-LD, and content never becomes a place markup can hide.

**Invention is tiered rather than forbidden.** Free for prose and captions; allowed but marked
`unverified: true` for stats, prices, dates and testimonials; still refused for `org.json` identity
fields. The mark does three things: the preview lists it as the human's edit checklist, the build farm
strips those blocks out of JSON-LD *and* `llms.txt`, and publishing is refused until the list is empty
(`--allow-unverified` overrides, deliberately).

The asymmetry is the point. Prose a human proofreads can be a draft. A `Review` asserted in structured
data is a claim made to a search engine in the client's name, it lands after handoff where nobody is
looking, and fabricated it is a manual action and a legal exposure. **Copy can be wrong and get fixed;
schema gets believed.**

## Bugs found while proving it

- `FreeSection.check` capped display-size elements at one *including* `Stat`, so a four-figure proof
  band was invalid. A row of large numbers is one gesture, not four competing ones — `Stat` is now
  exempt.
- The 420-character rule told authors to "use role story" for long copy, but never exempted role
  `story`. The only escape it offered did not work.
- `.p-grid` used `repeat(cols, 1fr)`; `1fr` floors at min-content, so a card containing a spec table
  pushed the row wider than its container and the last column fell off the page. Now `minmax(0, 1fr)`.
- Cutouts photographed on white vanish on a light surface — the page has images and still looks empty.
  They now get a tinted plate. `mix-blend-mode: multiply` was tried and reverted: it assumes a pure
  white backdrop and stains anything shot warm.

## Result

`content/merryfair-dense/` is one home page rebuilt with the new vocabulary, from the same brief and
the same images, against the same theme.

| per 1000px | merryfair-free | **merryfair-dense** | Emit demo |
|---|---|---|---|
| words | 55 | **111** | 168 |
| DOM nodes | 27 | **37** | 63 |
| images | 0.96 | **1.1** | 1.8 |
| font sizes (page) | 12 | **16** | 27 |

905 words and 9 images where the old page had 343 and 6, and it passes with zero density warnings.
Almost none of it is invented — the facts were in the brief the whole time. One testimonial is marked
`unverified`, which is the workflow doing its job.

## What is still open

- **Motion is untouched.** Scroll-linked motion, pinning and stagger remain the genuine ceiling-raiser
  for a signature moment. They are no longer the priority, and the measurements say why.
- **Node density trails the reference** (37 vs 63 per 1000px). Closing it means richer section
  interiors — overlap, asymmetric spans, mixed column widths — not more words.
- **Intake is the real ceiling.** Density is only honest when the brief carries specifics. A thin
  brief now produces a page that is either sparse or heavily `unverified`. That is the correct
  failure, and it moves the problem to where it belongs: collection.
