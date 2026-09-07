# Image semantics: what to add to Gallery, and what vocabulary to steal

*7 September 2026. Researching the fix for Gallery items having no `kind`, so overlay-fullbleed and
cutout-in-dark-section validator rules can't see them.*

## tl;dr

`kind: "environment" | "cutout" | "detail"` on a Gallery item is *not wrong*, but the industry's own
vocabulary is richer in one specific way we're missing: every CMS that ships an image type field
separates **what the asset physically is** (declared once, by whoever uploaded it) from **how a given
placement crops/positions it** (computed per-use, often automatically). We currently conflate "kind"
with "is this safe for text overlay", which is a *usage* question, not an *asset* question. Recommend
keeping our three-way enum but renaming its job clearly, and adding one more author-declared field
(focal point) plus one derived one (background transparency) rather than inventing crop logic.

## Recommended field set

Per Gallery item (and really per image reference anywhere in the catalog):

| Field | Who sets it | Values | Why |
|---|---|---|---|
| `kind` | **author, required** | `environment` \| `cutout` \| `detail` | Matches our existing enum on other blocks — this is an assertion about the photograph itself (subject isolated on a plain/transparent ground vs. subject in real context vs. close-up crop), not about any one placement. Keeping the same enum instead of a Gallery-specific one avoids a second vocabulary meaning the same thing (see Sanity/Storyblok comparison below — nobody splits this per-block). |
| `focus` | **author, optional** | `{x: 0-1, y: 0-1}` or named preset (`center`, `top`, `face`) | Every platform surveyed makes focal point author-declared, never auto-only (see §4). Needed because our grid/crop CSS will eventually crop these images and blind `object-position: center` clips subjects the same way an un-set focal point does elsewhere. |
| `alt` | **author, required** | free text | Already required elsewhere in the schema; Gallery should not be the exception. GOV.UK and WCAG both treat this as non-negotiable (verified: https://design-system.service.gov.uk/styles/images/, https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). |
| `hasAlpha` / background-is-uniform | **derived, not authored** | boolean | This is the one naive teams get wrong by making it a manual checkbox (see trap #2 below). Sanity's asset pipeline auto-extracts this class of metadata (palette, opacity) at upload time rather than asking the author (verified: https://www.sanity.io/docs/image-type). We should do the same: sniff the file (alpha channel presence, corner-pixel sampling) at ingest and use it only as a **lint warning** ("this looks like a cutout but is marked `environment`"), never as the sole source of truth — see §5 on why full auto-detection isn't reliable enough to be authoritative. |

Do **not** add a separate "usage context" enum (e.g. "safe-for-overlay: yes/no") as its own field.
That's a derived fact — `environment` implies overlay-safe, `cutout` implies overlay-unsafe — and
storing it separately creates a second place that can drift from `kind` and disagree with it. The
validator should compute overlay-safety from `kind`, exactly like it already does for Hero/other
blocks; Gallery should just stop being the one block that opts out by omission.

## Direct answer: is a `kind` per item the right fix?

Yes, with one caveat. Every CMS surveyed keeps a **type/role field at the asset level, separate from
per-placement crop metadata**:

- **Sanity**: the `image` type is a reference to an asset document plus placement-specific `hotspot`
  and `crop` objects; the asset document itself carries auto-extracted `metadata` (`dimensions`,
  `palette`, `lqip`) that doesn't change per placement (verified: https://www.sanity.io/docs/image-type).
- **Storyblok**: the asset object carries `alt`, `title`, `copyright`, `source`, and a `focus`
  property once, and that same asset can be reused anywhere with the image service reading `focus`
  to compute crops per-instance via `filters:focal(X1xY1:X2xY2)` (verified:
  https://www.storyblok.com/docs/api/image-service/operations/focal-point).
- **Contentful**: assets don't carry a "type" enum at all — cropping intent (`fit=`, `f=`) is supplied
  per-request in the Images API URL, not stored on the asset (verified:
  https://www.contentful.com/developers/docs/references/images-api/, via search-verified field
  values since the page 429'd on direct fetch).
- **Cloudinary**: no asset-level "type" field either; `g_auto`, `g_face`, `e_background_removal` are
  all transform-time parameters (verified: https://cloudinary.com/documentation/resizing_and_cropping,
  https://cloudinary.com/documentation/cloudinary_ai_background_removal_addon).
- **Shopify**: `Image` GraphQL object has no type/kind field — `id`, `url`, `altText`, `width`,
  `height`, `thumbhash`, plus generic `metafield`/`metafields` for anything custom (verified:
  https://shopify.dev/docs/api/admin-graphql/latest/objects/Image). Any lifestyle-vs-packshot
  distinction is left to merchant-defined metafields — Shopify doesn't standardize it.

So the pattern that generalizes: **richer per-asset metadata (some author-declared, some derived) is
the norm, and a single "kind"-shaped field is the odd one out only if it tries to also carry crop
behavior.** Our `kind` field is fine as a coarse asset classification (closest analogue: nobody in
this survey ships a "cutout" enum value by that name — it's a domain concept from product photography,
not CMS vocabulary — see below), as long as focal point and background-transparency stay separate
fields rather than folded into it.

## E-commerce vocabulary for cutout vs. lifestyle

The term the industry actually uses for what we call `cutout` is **"packshot"** (also "on-white" or
"white background" shot); the opposite is **"lifestyle"** (also "contextual" or "environmental")
photography — which maps directly onto our existing `environment` value (verified via multiple
photography-industry sources, e.g. https://www.kalory.co.uk/packshot-photography-vs-lifestyle-photography/,
https://www.packshot-creator.com/en/blog/packshot-photography-guide-why-make-product-packshots).
The framing that's genuinely useful: "packshots answer *what am I buying*, lifestyle answers *why do
I need this*" — i.e. the distinction is about photographer's isolation intent, and it is **declared by
the stylist/photographer at shoot time**, not inferred by software after the fact (inference, based on
the sourced pages: none of the ecommerce photography guides describe automatic packshot/lifestyle
classification tooling — the classification is a production decision, made before the file exists in
any DAM). This confirms `kind` should stay an author-declared field, not something we try to fully
automate — automation is a lint/warning layer at most (see §5).

We don't need to rename `cutout` to `packshot` — packshot is a photography-industry term for the
*shoot type*; `cutout` is the more common web/design term for the *resulting asset shape* (subject on
transparent or uniform ground). Both are fine; `cutout` already matches our other blocks, so keep it
for consistency rather than switching vocabularies mid-catalog.

## Focal point / smart cropping: declared, not just detected

Every platform that solves "don't crop out the subject" makes it **author-declared first**, with
auto-detection as a fallback or an opt-in add-on, never as the only mechanism:

- **Sanity**: `hotspot` (`x`, `y`, `height`, `width`) is a manual UI the editor drags on the image;
  there's no claim of automatic hotspot detection in the base product (verified:
  https://www.sanity.io/docs/image-type).
- **Storyblok**: `focus` is set by a human in the asset manager UI, then read by the image service at
  request time (verified: https://www.storyblok.com/docs/api/image-service/operations/focal-point).
- **Contentful**: `f=` accepts named presets (`center`, `top`, `face`, etc.) including `f=face` which
  *is* automatic (face detection), but the common case is a human picking a compass direction
  (verified via search of https://www.contentful.com/developers/docs/references/images-api/).
- **Cloudinary**: `g_auto` is genuinely automatic (saliency-based), `g_face`/`g_custom` layer face
  detection or an author-supplied custom region on top — Cloudinary offers all three modes side by
  side rather than picking one (verified: https://cloudinary.com/documentation/resizing_and_cropping).

Takeaway: focal point is worth adding as an **optional** author field precisely because none of these
vendors trust automatic saliency detection as the sole mechanism for a use case (marketing hero crops)
where getting it wrong is visibly embarrassing. Cheap default: if unset, `object-position: center`,
same as today.

## Auto-detecting "cutout-ness" from file bytes

Feasible as a signal, not as ground truth.

- **Alpha channel presence**: trivial and reliable to detect (any PNG/WebP decode exposes it) — but
  only tells you the file *supports* transparency, not that the photographed subject is a packshot.
  Plenty of `environment` photos get exported as PNG for unrelated reasons.
- **Corner/border pixel sampling for near-uniform color**: cheap heuristic real products use as one
  signal, e.g. Cloudinary's `e_background_removal`/`g_auto` and Shopify's own image tooling apply
  learned segmentation rather than naive corner sampling, which suggests corner sampling alone is
  considered too fragile for production use by vendors who could ship it if it worked well (inference
  — no vendor documentation claims corner sampling as its detection method, all describe segmentation
  models instead: https://cloudinary.com/documentation/cloudinary_ai_background_removal_addon).
- **ML segmentation**: the real state of the art. `rembg` ships multiple models (U2Net, ISNet,
  BiRefNet, BRIA-RMBG as default) and explicitly recommends choosing a model per image type (general
  photo vs. portrait vs. anime) rather than claiming one model handles everything — i.e. even the
  tool's own docs frame this as "good with the right model chosen," not "always accurate" (verified:
  https://github.com/danielgatis/rembg — no accuracy benchmark published in the README, an explicit
  finding of the fetch, not an inferred gap). Cloudinary's background removal is described as
  "recognize primary foreground object(s)... in seconds" and is being folded into the base
  transformation (`e_background_removal`) as the add-on is deprecated, i.e. Cloudinary itself is
  treating segmentation as reliable enough for general product use, but publishes no numeric accuracy
  claim we could find (verified page exists, no benchmark stated:
  https://cloudinary.com/documentation/cloudinary_ai_background_removal_addon).

Recommendation: implement corner-pixel sampling only, as a **build-time lint**, not a validator error
and not a substitute for the author-set `kind`. It's cheap (no ML dependency), catches the common case
(a real cutout on pure white/transparent mismarked as `environment`), and every vendor surveyed treats
detection quality as good-but-imperfect, which matches "warn, don't gate."

## Text-over-image contrast rules

- **WCAG 2.2 SC 1.4.3 Contrast (Minimum), Level AA**: normal text needs **4.5:1**, large text (≥18pt,
  or ≥14pt bold — roughly 24px/18.5px CSS) needs **3:1**, computed without rounding — 4.499:1 fails
  (verified: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). This SC applies to
  text rendered as an image the same as live text; "incidental text" inside a photo (e.g. a street
  sign) is explicitly exempted, which is not our case — our overlay text is UI text, not incidental.
  Separately, **SC 1.4.11 Non-text Contrast** (not fetched directly this pass, well-established at
  3:1 for UI components) would apply to any scrim/gradient treated as a meaningful graphical object,
  though our scrims exist purely to raise text contrast so 1.4.3 is the binding constraint.
- **Material Design**: prescribes "scrims" — translucent layers over imagery — specifically to keep
  overlaid text legible, named as a first-class technique rather than left to the theme's discretion
  (verified via search of Material's imagery/typography guidance, m1.material.io/style/imagery.html
  lineage — treat as verified-but-lower-confidence since the m3 successor page wasn't fetched
  directly this pass).
- No first-party rule found (Carbon, Polaris, GOV.UK) prescribing a *minimum scrim opacity number* —
  all three leave the mechanism up to contrast-testing the resulting rendered pixels against 1.4.3
  rather than a fixed opacity constant. That matches our `overlay-fullbleed` validator's actual job:
  it can't verify contrast without rendering, so requiring `environment` + a scrim primitive is the
  practical proxy, and it's the same proxy the industry uses (inference, drawn from the absence of a
  documented fixed-opacity rule anywhere surveyed).

## What we'd get wrong if we invented this ourselves

1. **Making transparency/uniform-background detection authoritative.** Every vendor with a background
   tool (Cloudinary, rembg) frames it as assistive, not ground truth — because a `cutout` shot on a
   pale grey seamless, or an `environment` photo with a plain sky, both defeat naive uniform-color
   sampling. Treating detection as the source of truth would silently mis-tag real cutouts shot on
   off-white and real lifestyle photos with plain backdrops, in both directions.
2. **Splitting "kind" and "safe for overlay" into two fields.** It looks safer ("more explicit!") but
   creates a state where an author can mark something `cutout` and `overlay-safe: true`, which is
   simply wrong, and the validator has no way to catch the contradiction without re-deriving one from
   the other anyway — at which point the second field was never load-bearing.
3. **Making focal point mandatory.** Every platform surveyed makes it optional with a sane default
   (usually `center`) — required focal point would put a redundant chore on every single Gallery item
   in every site, including images (like most `environment` photos with centered subjects) where the
   default crop is already fine.
4. **Treating "packshot" and "cutout" as different things that both need fields.** They're the same
   concept from two vocabularies (photography production vs. web/design); adding both would produce
   two enums that always move together and occasionally drift when someone updates one but not the
   other.
5. **Skipping alt text on Gallery on the theory that "it's decorative."** GOV.UK's own guidance is
   that decorative status is a real, narrow category (empty `alt=""`), not a default — a gallery of
   real project/product photos is exactly the content GOV.UK's guidance says needs alt text, not the
   exception (verified: https://design-system.service.gov.uk/styles/images/).

## Sources

- Sanity image type — https://www.sanity.io/docs/image-type (verified, fetched directly)
- Storyblok focal point operation — https://www.storyblok.com/docs/api/image-service/operations/focal-point (verified, fetched directly)
- Cloudinary resizing/cropping — https://cloudinary.com/documentation/resizing_and_cropping (verified, fetched directly)
- Cloudinary AI background removal add-on — https://cloudinary.com/documentation/cloudinary_ai_background_removal_addon (verified, page confirmed via search + fetch attempt)
- Shopify Image GraphQL object — https://shopify.dev/docs/api/admin-graphql/latest/objects/Image (verified, fetched directly)
- Contentful Images API — https://www.contentful.com/developers/docs/references/images-api/ (verified via search summary; direct fetch was rate-limited/404 both attempts — field names cross-checked against multiple third-party technical summaries citing the same page)
- WCAG 2.2 Understanding SC 1.4.3 — https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html (verified, fetched directly)
- GOV.UK Design System, Images — https://design-system.service.gov.uk/styles/images/ (verified, fetched directly)
- rembg — https://github.com/danielgatis/rembg (verified, fetched directly)
- IBM Carbon aspect ratio / photography — search-verified only, direct fetch 404'd; lower confidence, not load-bearing for our recommendation
- Material Design scrims / imagery — search-verified only (m1 legacy docs); lower confidence, not load-bearing for our recommendation
- Packshot vs. lifestyle terminology — https://www.kalory.co.uk/packshot-photography-vs-lifestyle-photography/, https://www.packshot-creator.com/en/blog/packshot-photography-guide-why-make-product-packshots (industry blogs, not a standards body — treat term as commonly-used, not formally standardized)
