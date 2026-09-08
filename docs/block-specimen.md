# Block specimen — every component and variation

25 block types, 63 layout variants. Generated from the catalog, not hand-listed.

Rendered sheet: `renderer/public/specimen.html` — open `http://localhost:5183/specimen.html` with `cd renderer && npm run dev`.

`fleet` = times this exact type+layout is placed across the four bundles in `renderer/src/content/`.

| Block | Variant (layout) | fleet |
|---|---|---|
| Breadcrumb | `inline` | — |
| Breadcrumb | `boxed` | — |
| CTA | `hard-panel` | 3 |
| CTA | `soft-band` | 5 |
| CTA | `centered-poster` | 2 |
| CatalogGrid | `cards-grid` | 2 |
| CatalogGrid | `hairline-catalog` | — |
| CatalogGrid | `wide-list` | — |
| ContactForm | `split-form` | 2 |
| ContactForm | `stacked-centered` | — |
| FAQ | `accordion-stack` | 1 |
| FAQ | `two-col-list` | — |
| Features | `grid-hairline` | 1 |
| Features | `alternating-rows` | 1 |
| Features | `cards-soft` | 2 |
| Features | `text-columns` | 1 |
| Footer | `columns` | 2 |
| Footer | `centered-minimal` | 1 |
| FreeSection | `free` | 53 |
| Gallery | `mosaic` | 1 |
| Gallery | `uniform-grid` | — |
| Gallery | `filmstrip` | — |
| Hero | `overlay-fullbleed` | 5 |
| Hero | `split-editorial` | 1 |
| Hero | `centered-poster` | 1 |
| Hero | `stacked-title` | 4 |
| Locations | `cards` | — |
| Locations | `split-panel` | 2 |
| LogoWall | `hairline-row` | 1 |
| LogoWall | `muted-grid` | 1 |
| MediaText | `image-right` | 3 |
| MediaText | `image-left` | 2 |
| MediaText | `overlap-offset` | 1 |
| Nav | `inline-left` | 1 |
| Nav | `split-rail` | 2 |
| Notice | `inline-rule` | — |
| Notice | `boxed-aside` | — |
| Notice | `footnote` | — |
| PostList | `cards-three` | — |
| PostList | `list-rows` | — |
| Pricing | `cards-tiers` | 1 |
| Pricing | `table-compare` | — |
| Promo | `split-strip` | 1 |
| Promo | `centered-strip` | — |
| RichText | `prose-narrow` | 1 |
| RichText | `two-col-prose` | 1 |
| RichText | `lead-aside` | 1 |
| SpecTable | `stacked-rows` | — |
| SpecTable | `two-col-groups` | 2 |
| SpecTable | `compact-hairline` | 1 |
| Stats | `inline-bar` | 1 |
| Stats | `airy-columns` | 2 |
| Stats | `boxed-grid` | 2 |
| Steps | `numbered-rail` | 3 |
| Steps | `cards-row` | — |
| Steps | `inline-flow` | — |
| Team | `photo-grid` | — |
| Team | `minimal-list` | — |
| Testimonials | `single-large` | 1 |
| Testimonials | `two-col` | — |
| Testimonials | `quote-row` | 1 |
| Timeline | `vertical-rail` | 1 |
| Timeline | `horizontal-steps` | — |

## Never used by any bundle (23 of 63)

These render correctly on the specimen sheet but have zero production evidence:

- `Breadcrumb/inline`
- `Breadcrumb/boxed`
- `CatalogGrid/hairline-catalog`
- `CatalogGrid/wide-list`
- `ContactForm/stacked-centered`
- `FAQ/two-col-list`
- `Gallery/uniform-grid`
- `Gallery/filmstrip`
- `Locations/cards`
- `Notice/inline-rule`
- `Notice/boxed-aside`
- `Notice/footnote`
- `PostList/cards-three`
- `PostList/list-rows`
- `Pricing/table-compare`
- `Promo/centered-strip`
- `SpecTable/stacked-rows`
- `Steps/cards-row`
- `Steps/inline-flow`
- `Team/photo-grid`
- `Team/minimal-list`
- `Testimonials/two-col`
- `Timeline/horizontal-steps`

## Audit results

Every one of the 63 variants was rendered and measured, twice: at a 1280px container and again at
420px (the layouts are container-queried, so shrinking `.site` is the real test).

Checks run per variant: measure-capped children off-centre inside a centred parent; any element
spilling past the section box; sections that render nothing; text clipped by an `overflow:hidden`
ancestor.

**Result: 63/63 clean at both widths.** One reported spill is correct behaviour —
`Gallery/filmstrip` sets `overflow-x: auto` on its own track and the page itself never scrolls
sideways.

That is *after* the centring fix. Before it, `ContactForm/stacked-centered` and the two centred
CTA variants put a `max-width`-capped `h2` flush left inside a centred column — see
`docs/images/centred-heading-before.png`.

## Defect found while building this sheet

**Declared migrations never reach a renderer.** `validate-bundle.ts:558` parses the bundle with
`SiteSchema.safeParse(rawSite)` and works on `s.data` — a zod *clone*. The migration then does
`b.props = forward.data` on that clone (`validate-bundle.ts:611`) and reports "migrated in place",
but the caller's object is untouched and the clone is discarded: `validateBundle` returns only
`{ ok, issues, density, unverified }`.

Both consumers validate first and then render their own copy — `App.tsx:27` and
`platform/src/build.ts:61` — so the props that reach `Section` are the pre-migration ones.
`render.tsx:27` drops a block whose props fail to parse (`if (!parsed.success) return null`),
silently.

Live effect today: `Footer`'s `links` became `{label, page?}` on 2026-09-08. All four stored
bundles still hold the old `["Agriculture", …]` string form. So **every site currently renders
with no footer at all**, in the preview and in the build farm, while the validator says
`✓ valid` and prints an info line claiming the migration was applied.

This defeats the guarantee in CLAUDE.md — "a site written against last year's catalog stays valid
and renders correctly with no bulk rewrite of stored JSON". It stays valid. It does not render.

Fix shape: `validateBundle` should return the migrated site (and theme), and both callers should
render *that* rather than their own copy. It is a small change but it touches the signature used
by the preview and the build farm, so it wants a deliberate pass rather than a drive-by.
