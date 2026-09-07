# Generating Black Dash — what broke, 2026-09-07

First run of the pipeline against `website_info/blackdash.docx`, built as a creator would in
`site-starter/content/blackdash/` rather than in `renderer/src/content/`. The bundle validates and
packages; the interesting output is the defect list, because most of it was invisible until a site
with no photography went through.

## The brief, and what it could not support

~900 words for a five-page site. Everything below is absent from the brief and was therefore left
out rather than invented:

| Missing | Consequence |
|---|---|
| Any photograph | No `MediaText`, `Gallery`, `CatalogGrid` (image is required), no image-bearing hero |
| Any named person | No `Team`. A fabricated founder is the worst thing this pipeline could emit |
| Any testimonial | No `Testimonials` |
| Any price | No `Pricing` |
| An office address | `Organization`, not `LocalBusiness` — correct for a remote agency |
| `sameAs` URLs | The single highest-value `org.json` field is empty. Recorded in `org.json._gaps` |

Page word counts land at 160–460 against the validator's 700 target. That gap is intake work, not
generation work: reaching 700/page from a 900-word brief means inventing about 2,600 words.

## The direction

Four sampled, likeliest discarded. The mode for "AI agency" is dark ground + violet-to-cyan
gradient + centred hero + three icon cards — which is simultaneously five named slop tells, so
discarding it was not a stylistic preference.

Chosen: **bone and ink, one signal yellow used only as a marker, zero radius, monospace for
metadata, no photography at all.** Identity carried by type scale and tone rhythm. Recorded in
`theme.direction` so the next session can audit values against an intent instead of re-deriving it.

Divergence from the fleet: no shared font, no shared accent hue, and the only light-ground site
that alternates full ink bands.

## Defects found

Each was invisible before this run. All are fixed and committed.

### 1. The platform served fonts nobody could name (`6bec8e6`)

The webfont list was written out twice — a literal `<link>` in `renderer/index.html` and a string
constant in `platform/src/build.ts` — and nothing compared either copy to what a theme asked for.
A missing webfont is not a CSS error, it is a fallback, so this failed silently at every layer.

**4 of 13 bundles in the fleet were affected.** `firstmetrology` had *all four* of its faces
missing and has never once rendered as designed.

`renderer/src/fonts.ts` is now the single declaration; the validator errors on an unserved family.

### 2. Column counts ignored item counts (`15d1247`)

Fourteen grid layouts hardcoded `repeat(3, 1fr)` or `repeat(4, 1fr)`. Three had been hand-patched
with a couple of `[data-count]` overrides; eleven had none. Four items in a three-column grid leave
one alone beside two empty cells; three stats in a four-column bar sit off-centre in the band whose
job is to anchor the page.

One shared ladder now maps count to columns, preferring a divisor. Nine blocks gained `data-count`.

### 3. Two layouts assumed content that is optional (`15d1247`)

- `alternating-rows` is copy-beside-picture and `Features.image` is optional. With no image the
  second track stayed open: every row was text in the left half of the page beside nothing, which
  reads as a broken image rather than as whitespace.
- `centered-poster` capped its hero copy at `42ch`. A `ch` cap resolves against the font the
  *column* inherits — body size — so the column came out ~360px wide and then had to hold an 86px
  headline. Five ragged lines in a triangle.

**The general rule both instances point at: a `ch` cap on a container that sets no `font-size` of
its own is measuring the wrong font.** Use absolute units for container caps; keep `ch` for the
element that actually sets the type.

### 4. Every CTA was an underlined link (`15d1247`)

Buttons became `<a>` elements when links were given real destinations, and inherited the UA
underline. Fleet-wide, on every site, since that change.

## What the validator got wrong

**It contradicts `docs/reference/tips-and-tricks.md` on monospace.** The validator warns that
`--font-eyebrow` / `--font-numeral` set to a monospace face "reads as a generated-site tell". §2 of
the tips doc says the opposite: "monospace for labels, captions and data is cheap personality", and
names neo-serif-plus-monospace as the 2026 pairing that reads art-directed.

Both cannot be right. The rule also fires on `aonic`, which is a considered theme. This is the same
shape as the radius rule that once fired on the five best themes in the fleet: the tell is *the
default reach*, not the technique. Suggested narrowing — flag monospace only when it is the *body*
face, or when the theme varies nothing else.

Left unchanged, because the user asked for a site and this is a judgement call for whoever owns the
validator.

## What the skill got wrong

**`~/.claude/skills/create-webpage/SKILL.md` is stale.** It still ships the old 8-stage,
art-direction-first workflow. The repo copy is the 9-stage content-first one. A creator installing
the skill today gets the superseded process.

## Still open

- No photography. Stage 8 is a human stage and it has not run.
- `org.json.sameAs` is empty — the highest-value E-E-A-T field.
- `foundingDate` and the production domain are inferences, not facts. Both flagged in `_gaps`.
- The catalog MCP could not be reached this session: the server on `:8787` was already running, but
  the client connects at session start and does not retry. Block schemas were read from
  `renderer/src/blocks/` directly, which is the ground truth the MCP serves anyway.
