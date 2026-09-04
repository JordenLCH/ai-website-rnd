# House rules

Three independent gates run over generated JSON. The first two are ordinary validation; the third is
the one that actually protects design quality.

## Gate 1 — schema
Every block's props parse against its schema: required fields present, arrays within min/max,
enums legal. Unknown block types are rejected.

## Gate 2 — theme coverage
Every `variant` slug used in `site.json` exists in `theme.json`, and the layout it maps to is one the
block actually implements. A theme naming a layout a block doesn't have is an error, not a fallback.

## Gate 3 — content suits the layout
Schema validity does not mean the section will look right. These rules catch the mismatches:

- **Overlay heroes need environment photos.** `overlay-fullbleed` puts text on the image; a product
  cutout on a white background gives unreadable text and a washed-out hero. Declare `imageKind` and
  respect it.
- **Mosaic galleries need ≥5 images** — fewer leaves holes in the grid.
- **`wide-list` needs landscape images**; portraits distort the row rhythm.
- **`quote-row` needs short quotes** — long ones destroy the three-across balance. Use `single-large`.
- **`single-large` takes exactly one quote.**

### FreeSection rules
- Nesting depth ≤ 5. Deeper trees are unreviewable and usually mean a fixed block was the right call.
- Exactly one level-1 `Heading`, in the hero; none elsewhere.
- At most one display-size element per section — two compete and neither leads.
- At most 8 animated nodes per section; beyond that motion reads as noise rather than emphasis.
- No `Text` node over 420 characters — long prose belongs in a `story` section with a prose layout.
- A background `overlay` requires `kind: "environment"`.

## Pitfalls with non-obvious causes

Each of these was a real bug; the cause is worth knowing because the symptom is misleading.

**A `clip-path` reveal that never fires.** `clip-path: inset(0 0 100% 0)` shrinks the element's box
as IntersectionObserver measures it, so the ratio is permanently 0 and the reveal never triggers —
the property that hides the element also prevents it from ever being shown. Leave a sliver (≈88%) or
observe a parent.

**A sticky header that sticks for zero pixels.** A sticky element's containing block is its nearest
scroll-clipping ancestor. Sticky on a block *inside* a section pins it within that section only. The
section wrapper must be sticky.

**Accent text on an accent background.** Unscoped attribute selectors like `[data-tone="accent"]`
match both the section's tone attribute and a primitive's, so the primitive rule repaints the whole
section's text in the accent colour. Namespace primitive attributes.

**Centering silently lost.** A block whose direct child resets `margin: 0` (list resets do this)
defeats the parent's `margin-inline: auto`. Use `margin: 0 auto`.

**Chrome that overlaps when narrow.** Fixed 12-column grid areas in a header collide as the viewport
shrinks because areas don't shrink. Headers and footers should be flex rows with `justify: between`.

## What to check by eye after validation passes

Validation proves the data is legal, not that the page is good. Look at the preview and ask:

- Does the hero photo actually support the text on top of it?
- Do consecutive sections use different layouts, or does the page read as one repeated shape?
- Is the accent colour used as punctuation, or has it become the background of half the page?
- At a narrow width, does anything overlap or overflow?
- Does every page share a rhythm, or does one page feel like a different site?

## What you are not responsible for

SEO/AEO/GEO artifacts, hosting and scheduled refresh are produced by the platform after upload, from
the content tree you hand over. Writing JSON-LD, meta tags or keyword-padded copy into props competes
with that generator and loses. Choose the semantically right block instead — `FAQ` over questions
buried in `RichText`, `Locations` over an address in a paragraph — because the block type is what the
schema generator reads.
