# House rules

Four independent gates run over generated JSON. The first two are ordinary validation; the third is
the one that actually protects design quality, and the fourth is the one with a statute behind it.

## Gate 0 — density and provenance

Two checks run before the others are worth caring about, because a structurally perfect page that
says nothing still reads as a free template.

- **Density.** Per section: 60+ words and 6+ content nodes (warning below 20 and 3). Per page: 700+
  words, and one image per two sections that can carry one. Exempt: `Hero`, `CTA`, quote, nav,
  footer, and blocks whose schema caps them (`Stats`, `Locations`). Reach for `Figure`+`Caption`,
  `KeyValue`, `Marker` and `Badge` before writing more prose — specificity is what raises density,
  length is not.
- **Imagery.** A `cutout` image in an inverse-tone section disappears against the dark ground — the
  section has pictures and still looks empty. And no photograph should carry four sections: one
  image placed four or more times across a site is what makes two sites from one asset folder look
  like the same site.
- **Type.** Monospace on `--font-eyebrow` / `--font-numeral` is flagged. Those two tokens feed ~20
  call sites, so choosing mono once sets 30-45 elements on a page in it, captions included.
- **Provenance.** Invented content is marked, not banned. Prose and captions are free; a figure,
  price, date or testimonial you did not get from the brief needs `"unverified": true` on the block,
  which excludes it from JSON-LD and llms.txt and blocks publish until a human clears it. Identity
  facts in `org.json` are never invented. See the tier table in SKILL.md.

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

## Gate 4 — jurisdiction

Rules that come from where the client is registered rather than from the design. They read
`org.json`, so they only run when it is supplied — pass it to `validate` as the third argument, or
they are skipped in preview and first fail at publish.

- **A Malaysian company must disclose its registered name and registration number on its website.**
  s.30(2) Companies Act 2016 lists websites explicitly, next to business letters and invoices;
  non-compliance is an offence carrying up to RM50,000. The gate fires when `org.address.country` is
  `MY` (or, with no address, when the legal name carries `Sdn Bhd` / `Berhad` / `PLT`), and it wants
  both halves inside `chrome.footer` — in `legal.line`, the row that exists for exactly this, and
  the footer because it is the only element on every page.
  Missing `org.registration` or `org.legalName` fails too: the fix is to ask the client. A guessed
  registration number is a legal problem, not a formatting one.

## Chrome — checked separately, because it is on every page

Nav and Footer are declared once in `chrome`, so a weakness in either is a weakness repeated on
every page. Three warnings, none of them build-stopping:

- **Footer links with no `page`** render as plain text. They look like links, are not focusable, are
  not announced as links and go nowhere — which is what the whole catalog did until the `links`
  shape changed from `[string]` to `[{label, page?}]`. Give each one a page key, a URL, a `mailto:`
  or a `tel:`.
- **No `contact` in the footer.** A phone, email or address there is what visitors come to a footer
  for, and it is the only place those reach every page.
- **No `utility` strip on the Nav.** It is the thin row above the main bar and the way contact
  details get onto every page without spending one of the seven nav slots.

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
