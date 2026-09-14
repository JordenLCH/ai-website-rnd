# House rules

Four independent gates run over generated JSON. The first two are ordinary validation; the third is
the one that actually protects design quality, and the fourth is the one with a statute behind it.
Between Gate 0 and Gate 1 sits the microcopy section — rules nothing enforces, which is exactly why
they are the ones that slip.

The `[rule:…]` markers are the validator's own names for these rules. They appear in its output, and
`npm run house-rules` in the renderer fails if this file describes a rule that does not exist or
leaves out one that does. Ignore them while reading; quote one when reporting a problem.

## Gate 0 — density and provenance

Two checks run before the others are worth caring about, because a structurally perfect page that
says nothing still reads as a free template.

- **Density.** Per section: 60+ words and 6+ content nodes (warning below 20 and 3). Per page: 700+
  words, and one image per two sections that can carry one. Exempt: `Hero`, `CTA`, quote, nav,
  footer, and blocks whose schema caps them (`Stats`, `Locations`). A section with no readable copy
  at all is an error rather than a warning. Reach for `Figure`+`Caption`, `KeyValue`, `Marker` and
  `Badge` before writing more prose — specificity is what raises density, length is not.
  [rule:density/section-empty] [rule:density/section-thin] [rule:density/section-under-filled]
  [rule:density/page-words] [rule:density/page-images]
- **Imagery.** A `cutout` image in an inverse-tone section disappears against the dark ground — the
  section has pictures and still looks empty. [rule:image/cutout-on-inverse] And no photograph
  should carry four sections: one image placed 4 or more times across a site, or appearing on 3
  separate pages, is what makes two sites from one asset folder look like the same site.
  [rule:image/overused] [rule:variation/image-across-pages]
- **Type.** Monospace on `--font-eyebrow` / `--font-numeral` is flagged. Those two tokens feed ~20
  call sites, so choosing mono once sets 30-45 elements on a page in it, captions included.
  [rule:type/mono-labels]
- **Provenance.** Invented content is marked, not banned. Prose and captions are free; a figure,
  price, date or testimonial you did not get from the brief needs `"unverified": true` on the block,
  which excludes it from JSON-LD and llms.txt and blocks publish until a human clears it. Identity
  facts in `org.json` are never invented. See the tier table in SKILL.md.
  [rule:provenance/unverified]

## Microcopy — the labels a generator writes without thinking

Not a gate; nothing rejects these. That is the problem. Every `action.label` in the catalog has a
default the model reaches for, the defaults are the same across every brief, and a page of them is
how a bespoke site starts reading like a template even when the layout does not.

- **Plain and conventional beats clever.** `Contact us`, `Get started`, `Get in touch` are fine and
  usually right: a visitor has seen them a thousand times and does not have to decode them.
  Familiarity is doing real work, so do not spend it to look original. The failure this rule guards
  against is the opposite one — straining for a distinctive label and landing on something stiff.
  "Enquire about a matter" on a law firm's nav is not more precise than "Contact us", it is just
  more awkward, and it was repeated six times on one site before anyone noticed.
  Reach for a specific label only where it genuinely tells the visitor something the generic one
  does not — "Download the spec sheet", "Book a site visit", "Request a quote" all name an outcome
  worth naming. Still avoid `Submit` (names the mechanism, not the outcome), `Click here`, and a
  bare `Read more` with nothing to say what is being read.
- **`Hero.actions` takes two, and they must not be synonyms.** Primary names the commitment, ghost
  names the cheaper way in — "Request a quote" / "Browse the range", not "Get in touch" / "Contact
  us". Two labels meaning the same thing is a decision the visitor now has to make for no reason.
- **One term per thing, site-wide.** If the nav says "Range", the hero does not say "Catalogue" and
  the footer does not say "Products". Pick the client's own word from the brief and use only it.
  This is the cheapest consistency win available and the easiest to lose across nine sections.
- **`ContactForm.note` is where the form stops being a void.** Say what happens next and when — "We
  reply within one working day" — because a send button with no stated consequence is the single
  most common reason a form is abandoned. Left out, the visitor submits into silence.
- **`ContactForm.fields[].label` names the real-world thing asked for**, never a placeholder in
  disguise. "Company name", not "Enter your company". The label is announced to a screen reader and
  its text is the click target; a placeholder is neither, and disappears the moment typing starts.
- **`FAQ` questions are written the way a visitor would ask them**, in their words and first person
  — "Do you ship outside Malaysia?" — not as headings ("Shipping"). The block exists because the
  question is the content; flattening it into a topic label throws that away.
- **`Notice` and empty-ish states say what, why, and the way out.** A band announcing a factory
  shutdown needs the dates and who to contact meanwhile, or it is an apology with no action in it.

## The eyebrow is a page label, not a section one

**A warning fires when more than 2 sections on a page open with an eyebrow.** [rule:eyebrow/rate]

An eyebrow labels the page, above its opening headline. It does not label each section. Production
sites in this category use none at all: four measured with `getComputedStyle` carried zero across 48
headings, while this pipeline's own fleet had put one on 85 of 144 sections. CFPB's design system
defines it as "an additional label that can be used to support the main H1 heading on a page";
section use is not contemplated.

**At most one, on the page opener.** The threshold is two only because a rule that fires at the
first departure from a style guide is a rule people learn to ignore. A section that genuinely needs
marking can take a rule, a number, a colour shift or a sentence-case label — and most of the time
the headline is enough on its own. Repeated over every band, an eyebrow stops labelling anything
and becomes the clearest tell that nobody chose it.

## Gate 1 — schema
Every block's props parse against its schema: required fields present, arrays within min/max,
enums legal. Unknown block types are rejected. Three content-shaped rules ride along with it,
because the type system cannot see inside a string: a link may only be `https:`, `mailto:` or
`tel:`; an image must be site-relative under `/img/<client>/`; and `accent` must be a verbatim
slice of its own `text`, or the emphasis silently does not render.

`references/catalog.md` is the reference for the schemas themselves and is drift-checked against
the catalog separately, so nothing here repeats it.

## Gate 2 — theme coverage
Every `variant` slug used in `site.json` exists in `theme.json` [rule:theme/variant-undefined], and
the layout it maps to is one the block actually implements [rule:theme/layout-unimplemented]. A
theme naming a layout a block doesn't have is an error, not a fallback.

The token contract is checked at the same time, and all three failures are silent in the browser:

- **A missing required token** is a brand decision replaced by a browser default — the stylesheet
  reads these with no fallback. [rule:theme/missing-required-token]
- **A token the catalog does not read** does nothing at all. Check the spelling against
  `theme_contract`. [rule:theme/unknown-token]
- **A tone-derived token set in `theme.tokens`** paints every section the same ground regardless of
  its tone. Use `sectionStyles[slug].vars` for a one-section override.
  [rule:theme/derived-token-set]
- **A font family the platform does not serve** renders in the system stack with no error anywhere
  — the page loads, the layout is right, and only the typeface is wrong.
  [rule:type/font-unserved]

## Gate 3 — content suits the layout
Schema validity does not mean the section will look right. These rules catch the mismatches:

- **Overlay heroes need environment photos.** `overlay-fullbleed` puts text on the image; a product
  cutout on a white background gives unreadable text and a washed-out hero. The layout needs an
  image at all [rule:hero/layout-needs-image], needs `imageKind` declared rather than left to
  guesswork [rule:hero/overlay-needs-image-kind], and needs that kind to be `environment`
  [rule:hero/overlay-needs-environment].
- **An overlay hero's tone must resolve to light ink.** The scrim over the photograph is dark, so
  the copy on it has to be light. This is a question about the theme, not about the tone's name:
  `inverse` is the flip of the page ground, which is light ink on a light theme and near-black on a
  dark one. Pick the tone whose ink is the light one on the theme in hand.
  [rule:overlay/ink-too-dark]
- **`photo-grid` needs a name and an image on every member.** Without names it is a grid of stock
  photography; without photographs it is a wide-gapped name list, which is what `minimal-list` is
  for. [rule:team/photo-grid-needs-names] [rule:team/photo-grid-needs-images]
- **A `Notice` title stays under 80 characters** — a notice is a footnote, not a section headline.
  [rule:notice/title-too-long]

### FreeSection rules
Free composition is where a generator can build something no fixed block would allow, which is the
point of it and also the risk. Every rule here was a real rendered defect first.

- Nesting depth ≤ 5. Deeper trees are unreviewable and usually mean a fixed block was the right
  call. [rule:free/nesting-too-deep]
- Exactly one level-1 `Heading`, in the hero [rule:free/hero-needs-one-h1]; none elsewhere
  [rule:free/h1-outside-hero].
- At most one display-size element per section — two compete and neither leads.
  [rule:free/multiple-display]
- At most 8 animated nodes per section; beyond that motion reads as noise rather than emphasis.
  [rule:free/too-many-animated]
- No `Text` node over 420 characters — long prose belongs in a `story` section with a prose layout,
  which is exempt. [rule:free/text-node-too-long]
- A background `overlay` requires `kind: "environment"`. [rule:free/overlay-needs-environment]
- **`gap: "xl"` on a rail of 8 or more columns** puts more width in the gutters than in the content:
  every track computes to zero and the children are clipped with nothing in the console. Use `md` or
  `lg` and give the children wider spans. [rule:free/gap-xl-on-wide-rail]
- **A `display` or `heading` size in a column under a third of the rail** breaks mid-word and reads
  as a stack of fragments. Type size is a theme value measured against the page; the column it lands
  in is yours. Widen the span or use `title`. [rule:free/heading-in-narrow-column]
- **A display heading over ~70 characters** is many lines at poster scale and a band nobody can see
  past. Keep a display line short, or set `size: "heading"`. [rule:free/display-heading-too-long]
- **`span` on a child of a `Stack` or `Row` does not merely do nothing** — a Stack is an implicit
  single-column grid, so one `span: 8` inside it creates eight implicit columns and lays the stack
  out sideways. Drop it, or make the parent a `Grid`. [rule:free/span-outside-grid]
- **Width only ever shrinks, and the whole chain multiplies.** A section child takes `span/cols` of
  the rail, a Grid inside it divides that again, a child of that Grid takes its own share of what is
  left. Below one rail column at twelve there is no layout left, and the validator computes the
  pixels with the gutters subtracted rather than trusting the share.
  [rule:free/track-too-narrow]
- **Running copy needs a measure.** Prose in a sliver of the rail
  [rule:free/prose-share-too-small], or in a column that works out at fewer than a dozen characters
  per line [rule:free/copy-column-too-narrow], renders as a vertical stack of fragments. Widen the
  column, or make it a label instead.
- **A `Carousel` whose `perView` exceeds its slide count** silently loses loop mode and renders
  short. Add slides or lower `perView`. [rule:free/carousel-too-few-slides]

## Gate 4 — jurisdiction

Rules that come from where the client is registered rather than from the design. They read
`org.json`, so they only run when it is supplied — pass it to `validate` as the third argument, or
they are skipped in preview and first fail at publish.

- **A Malaysian company must disclose its registered name and registration number on its website.**
  s.30(2) Companies Act 2016 lists websites explicitly, next to business letters and invoices;
  non-compliance is an offence carrying up to RM50,000. The gate fires when `org.address.country` is
  `MY` (or, with no address, when the legal name carries `Sdn Bhd` / `Berhad` / `PLT`), and it wants
  both halves inside `chrome.footer` — in `legal.line`, the row that exists for exactly this, and
  the footer because it is the only element on every page. [rule:jurisdiction/my-footer-missing]
  A site with no footer at all fails the same rule, because the line then appears nowhere.
  [rule:jurisdiction/my-no-footer]
  Missing `org.registration` or `org.legalName` fails too: the fix is to ask the client. A guessed
  registration number is a legal problem, not a formatting one.
  [rule:jurisdiction/my-missing-facts]
  **The gate keys on country, but the statute binds companies.** A Malaysian professional practice —
  law, medicine, architecture, accountancy — is often a partnership or sole proprietorship with no
  SSM company number, and it trips this gate with nothing that can satisfy it. Ask for the number
  the client prints on their letterhead and use that; if none exists, report that the line cannot be
  written rather than inventing one. See `references/intake.md`.

## Chrome — checked separately, because it is on every page

Nav and Footer are declared once in `chrome`, so a weakness in either is a weakness repeated on
every page.

Two are errors. **No Nav anywhere** means every page renders without navigation and nothing but the
home page is reachable [rule:chrome/no-nav]. **No Footer anywhere** means the contact details and
the statutory legal line have nowhere to live, and the jurisdiction checks above cannot run at all
[rule:chrome/no-footer].

The rest are warnings, none of them build-stopping:

- **Footer links with no `page`** render as plain text. They look like links, are not focusable, are
  not announced as links and go nowhere — which is what the whole catalog did until the `links`
  shape changed from `[string]` to `[{label, page?}]`. Give each one a page key, a URL, a `mailto:`
  or a `tel:`. [rule:chrome/footer-inert-links]
- **No `contact` in the footer.** A phone, email or address there is what visitors come to a footer
  for, and it is the only place those reach every page. [rule:chrome/footer-no-contact]
- **No `legal.line`.** That row carries the copyright, and in some jurisdictions the registered name
  and company registration number. [rule:chrome/footer-no-legal-line]
- **No `utility` strip on the Nav.** It is the thin row above the main bar and the way contact
  details get onto every page without spending one of the seven nav slots.
  [rule:chrome/nav-no-utility]

## Page order and site-wide rhythm

None of these are errors except the h1 rules. Each describes a page that validates, renders, and
still reads as assembled — and all of them are visible in a 50%-zoom scroll and invisible to every
other check here.

- **Exactly one h1 per page, and it lives in the hero.** Two Hero blocks on a page is an error
  [rule:structure/multiple-h1]; a page with no Hero has no h1 at all, which costs both SEO and
  orientation [rule:structure/no-h1].
- **Two adjacent sections of the same type and layout** scroll as one long section, and the second
  stops being read. Change the layout on one of them or merge them.
  [rule:structure/same-shape-twice]
- **Proof belongs in front of the first ask.** A testimonial the visitor reads after being asked has
  nothing left to support. [rule:structure/ask-before-proof]
- **A long page with a single action at the very end** asks once, after the reader has already
  decided. Repeat the same CTA around the midpoint, worded identically.
  [rule:structure/single-late-cta]
- **One action called three different things** reads as three different offers. Compare the wordings
  across the whole site, not per page. [rule:copy/cta-wordings]
- **Four or more consecutive sections sharing a tone** scroll as one undifferentiated column. Break
  the run. [rule:rhythm/tone-run]
- **Pages that open with the same band** read as one page repeated, however much each varies
  internally. Change the opener on all but one. [rule:variation/shared-opener]
- **Two pages whose tones run in the same order** scroll as the same page at a distance, because
  band rhythm is what the eye reads before the copy. [rule:variation/shared-tone-rhythm]

## The theme, checked without rendering anything

These read `theme.json` alone. None is an error: each names a pattern that is fine when it was
chosen and telling when it was defaulted into, which is a distinction a validator cannot make. The
output is "say why", not "change it".

- **One non-zero radius on every surface** — buttons, cards, images and fields sharing an identical
  corner — is the dominant tell of mechanically assembled design, because a designer sizes the
  radius to the surface. Zero everywhere is a stated position and is not flagged.
  [rule:theme/uniform-radius]
- **An indigo or violet accent against an otherwise neutral palette** is Tailwind's default and the
  loudest single current tell. Keep it only if the brand actually owns that colour.
  [rule:theme/indigo-accent]
- **A theme that sets no structural token** (`--scale-ratio`, `--density`, `--motion-duration`,
  `--motion-ease`, `--grid-cols`, `--radius-tight`) varies only colour and size, which is the
  cheapest kind of variation and the easiest to see through. [rule:theme/no-structural-tokens]
- **No written `direction`** means no later value can be audited against an intent, and the next
  session re-derives the intent from the values — which is how a considered theme drifts back to
  the default. [rule:theme/no-direction]
- **"Modern, clean, professional"** describes every website ever made, so it constrains nothing.
  Use adjectives that forbid something, and make one of them slightly uncomfortable.
  [rule:theme/null-adjectives]

Contrast, focus indicators, depth and measure are checked too, and their messages say everything
needed at the moment they fire.

## Pitfalls with non-obvious causes

Each of these was a real bug; the cause is worth knowing because the symptom is misleading. None is
checked by anything — they are here because the symptom sends you to the wrong file.

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

## Photographs supplied with the brief

A folder of stock the client already chose validates and looks plausible, so nothing downstream
questions it. Open every one and say what is in the frame, not what the filename claims. Three
failure kinds:

- a **recognisable place** standing in for the client's own, such as a famous library captioned as
  their office
- **third-party branding** in shot, which is the stage 9 check arriving early
- an object that is **wrong for the jurisdiction or trade**: a gavel on a Malaysian or any
  Commonwealth legal site, where courts do not use them

Identifiable faces are their own problem: stock models placed near "our team" read as staff who do
not exist. A stock image the client picked is a row on the gap list, not a row filled.

## Regulated categories

Ask at stage 2 whether the category is regulated. Law, medicine, dentistry, financial advice and
education sit under publicity rules restricting outcome claims, superlatives and testimonials, and
the brief's own marketing adjectives are usually the first casualty, so they cannot be lifted into
headlines verbatim.

You do not decide what is permitted. Name the constraint, say which sections it removes
(`Testimonials` and results-based `Stats` are the usual two), and put the wording question to the
client. Discovering this at stage 5 means rewriting approved copy.
