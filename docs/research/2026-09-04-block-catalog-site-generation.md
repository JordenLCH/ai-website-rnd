# Generating visually distinct sites from a fixed block catalog + design tokens

Research date: 2026-09-04. Primary sources only (official docs, GitHub source, specs, first-party posts). Every claim carries its source URL. Where a source is thin or the conclusion is inference, it says so.

---

## TL;DR

1. **The architecture is solved and commoditised — do not invent a page-model format.** "LLM emits JSON of `{type, variant, props}` against a schema-validated catalog; a registry maps names to real components" is [vercel-labs/json-render](https://github.com/vercel-labs/json-render) (Apache-2.0, ~13k stars), Google's [A2UI](https://a2ui.org), literally-your-field-names [buildingopen/openpage](https://github.com/buildingopen/openpage), and — with a shipped headless LLM API — [Puck](https://puckeditor.com/docs/ai/headless-generation).
2. **Steal WordPress's two-layer split; it is the only architecture that solves fleet patching *and* visual difference.** Persist `variant` as an opaque slug on the block instance (`is-style-{slug}`); resolve slug → styles in swappable theme JSON that references tokens indirectly (`var:preset|color|accent-5`, never a hex) ([Section Styles](https://make.wordpress.org/core/2024/06/24/section-styles/), [TT5 section-1.json](https://github.com/WordPress/twentytwentyfive/blob/trunk/styles/sections/section-1.json)). Add Shopify Dawn's per-section `color_scheme` class for scoped token sets ([Dawn](https://github.com/Shopify/dawn/blob/main/sections/featured-collection.liquid)). Twenty Twenty-Five's 8 style variations over one block library is the closest existing proof that same-catalog sites can look unalike.
3. **Nobody does automatic variant selection, and nobody constrains sequence.** Across Puck, Payload, Builder, Storyblok, Sanity, Gutenberg, Shopify, Webflow, Framer: all composition constraints are flat allowlists; none expresses "exactly one Hero, first" or "no two Testimonials adjacent". Both are unclaimed ground and both are exactly where template-sameness lives. Build them.
4. **Tokens alone will not make sites distinct — no primary source claims otherwise.** Material's 10 "variants" reduce to ~6 chroma constants plus hue rotations ([dynamic_scheme.ts](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/dynamic_scheme.ts)), and its image seeder hard-codes a Google-Blue fallback and strips low-chroma hues ([score.ts](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/score/score.ts)) — it actively regresses to the mean. OpenPage's entire identity surface is six scalars and ten presets. Distinctiveness has to come from variant selection, layout archetype, type pairing, density and image treatment.
5. **Mode collapse is measured and has two cheap, evidence-backed prompt-layer fixes.** Doshi & Hauser (*Science Advances* 2024) showed GenAI outputs are individually better but **collectively more similar** ([10.1126/sciadv.adn5290](https://www.science.org/doi/10.1126/sciadv.adn5290)); Kirk et al. traced it to RLHF ([arXiv:2310.06452](https://arxiv.org/abs/2310.06452)); Zhang et al. traced it to typicality bias and gave a training-free 2-3x fix — **ask for N art directions with self-assessed probabilities and pick off-mode** ([arXiv:2510.01171](https://arxiv.org/abs/2510.01171)); [arXiv:2504.13868](https://arxiv.org/abs/2504.13868) restored collective diversity to human baseline using **10 distinct AI personas at the input stage**. Note your structured-JSON constraint is itself a diversity-reducing pressure ([arXiv:2505.18949](https://arxiv.org/abs/2505.18949)). And Anthropic's own `frontend-design` skill already enumerates the AI-slop tells *with hex values* — encode it as a negative constraint set in the validator, not prose in a prompt.

---

## Thread 1 — Generative / parametric design systems: what a token generator can and cannot buy you

### Material Design 3 dynamic colour — the deepest prior art, and the clearest warning

The docs at `m3.material.io` are client-rendered and unfetchable; everything below is read from source at [material-foundation/material-color-utilities](https://github.com/material-foundation/material-color-utilities) (MCU). Components per the README: `Hct` (CAM16 hue/chroma + L\* tone), `TonalPalette`, `Scheme`, `QuantizerCelebi` (Wu + WSMeans image→palette), `Score`, `Blend`, `DynamicColor`, `DislikeAnalyzer`, `TemperatureCache`, `Contrast`. Ports for C++, Dart, Java, Swift, TypeScript, Kotlin.

Pipeline:

1. Seed → `CorePalettes{primary, secondary, tertiary, neutral, neutralVariant}` — *"Generated from a source color, these palettes will then be part of a [DynamicScheme] together with appearance preferences"* ([core_palettes.ts](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/palettes/core_palettes.ts)).
2. `TonalPalette.fromHueAndChroma(hue, chroma).tone(t)` — a palette is just (hue, chroma) plus a tone function over 0–100 ([tonal_palette.ts](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/palettes/tonal_palette.ts)).
3. `DynamicScheme` inputs are exactly `sourceColorHcts`, `variant`, `contrastLevel` (−1..1), `isDark`, `platform`, `specVersion` ([dynamic_scheme.ts](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/dynamic_scheme.ts)); spec versions `color_spec_2021/2025/2026.ts` are in tree.
4. ~50+ named roles are emitted (`material_dynamic_colors.ts`): surface / surfaceDim / surfaceContainerLowest→Highest, onSurface, outline / outlineVariant, inverseSurface, primary / onPrimary / primaryContainer / primaryFixed / primaryFixedDim, ditto secondary / tertiary / error.
5. **Contrast is guaranteed, not hoped for.** Each role carries a `ContrastCurve(low, normal, medium, high)` — `onError` is `(4.5, 7, 11, 21)`, `errorContainer` is `(1, 1, 3, 4.5)` — plus `ToneDeltaPair` constraints enforcing minimum tone distance between paired roles ([color_spec_2021.ts](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/color_spec_2021.ts)).

Exactly ten variants exist ([variant.ts](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/variant.ts)): `MONOCHROME, NEUTRAL, TONAL_SPOT, VIBRANT, EXPRESSIVE, FIDELITY, CONTENT, RAINBOW, FRUIT_SALAD, CMF`.

**How different are they, really?** Blunt answer from the source: a small table of chroma constants plus piecewise hue rotations. Primary chroma is `0.0` (MONOCHROME), `12.0` (NEUTRAL), `16.0` (TONAL_SPOT), `36.0`, `48.0`, `200.0` (VIBRANT, i.e. clamp to max); secondary/tertiary chromas 8/16/24/36 ([dynamic_scheme.ts](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/dynamic_scheme.ts), L648-793). `SchemeExpressive` rotates tertiary hue via `getRotatedHue(hct, [0,21,51,121,151,191,271,321,360], [45,95,45,20,45,90,45,45,45])`; `SchemeVibrant` rotates 10–18°. `SchemeExpressive`'s own doc comment: *"A Dynamic Color theme that is intentionally detached from the source color."*

**Image seeding actively homogenises.** `sourceColorFromImage()` → `QuantizerCelebi` → `Score.score()`. [score.ts](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/score/score.ts) hard-codes `TARGET_CHROMA = 48.0`, `WEIGHT_PROPORTION = 0.7`, `CUTOFF_CHROMA = 5.0`, `desired: 4`, and `fallbackColorARGB: 0xff4285f4 // Google Blue`. It explicitly removes hues "not used often enough" and near-greyscale colours — i.e. it pulls extracted palettes toward mid-chroma UI-safe colour. If you seed art direction from client logos/photos, expect regression to the mean unless you counteract it.

Effective output space: 1 seed × 10 variants × {light, dark} × 5 contrast levels ≈ 100 schemes, but only ~10 differ *in kind*; the rest are tone/contrast re-solves of the same hue. One-call API: `themeFromSourceColor(source, customColors[])` + `applyTheme()` ([theme_utils.ts](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/utils/theme_utils.ts)).

### Adobe Leonardo — contrast-first, the inverse formulation

[adobe/leonardo](https://github.com/adobe/leonardo), package `@adobe/leonardo-contrast-colors`. Stated goal: make it easier to conform to WCAG minimum contrast *"by using contrast ratio as the starting point"*. API: `Color({name, colorKeys, colorspace, ratios, smooth, output})`, `BackgroundColor`, `Theme({colors, backgroundColor, lightness, contrast, saturation, output})`, `generateContrastColors()`, `createScale()`; interpolation in LCH, LAB, CAM02, HSL, HSLuv, HSV, RGB ([packages/contrast-colors](https://github.com/adobe/leonardo/tree/main/packages/contrast-colors)).

You declare the ratios you need and it solves for colours. `lightness` / `contrast` / `saturation` are three continuous global knobs — genuinely parametric art direction, and the right tool if the requirement is "every generated site provably passes AA".

### Open Props — a taxonomy, not a generator

[open-props.style](https://open-props.style/) is a fixed preset library ("sub-atomic styles"), covering colours, sizes, fonts, easings, animations, shadows, gradients, masks/noise, z-index, media queries. The props are generated from JS source into CSS by a build script (`npm run gen:op`), and it ships `open-props.tokens.json` plus Style Dictionary and Figma exports ([argyleink/open-props](https://github.com/argyleink/open-props)). Value to you: a proven **token taxonomy** and multi-format export target. It is not generative.

### Radix Colors — the semantic contract worth copying verbatim

The 12-step scale has documented per-step *meaning*: 1–2 backgrounds, 3 component normal, 4 hover, 5 *"pressed or selected states"*, 6 subtle non-interactive borders, 7 interactive borders, 8 *"stronger borders… and focus rings"*, 9 *"the purest step"* solid, 10 solid hover, 11 low-contrast text, 12 high-contrast text ([Understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)). Package `@radix-ui/colors` v3 ([install](https://www.radix-ui.com/colors/docs/overview/installation)); the [custom palette generator](https://www.radix-ui.com/colors/custom) takes accent + gray + background and emits 12-step light and dark scales.

**This is the single most directly copyable artefact for your token JSON**: the step semantics are a contract an LLM can target without knowing any colour science. **Caveat:** that page does not document the algorithm or its limits, and no primary description of the maths was found.

### Utopia — fluid type and space, fully parametric, WCAG-checked

`utopia-core` on npm ([trys/utopia-core](https://github.com/trys/utopia-core#readme), v1.6.0, *"The calculations behind Utopia.fyi"*). `calculateTypeScale({minWidth, maxWidth, minFontSize, maxFontSize, minTypeScale, maxTypeScale, negativeSteps, positiveSteps, relativeTo, labelStyle})` returns steps with `{minFontSize, maxFontSize, clamp, wcagViolation}` — it flags viewports where a step fails [WCAG SC 1.4.4](https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html), a machine-checkable guarantee. `calculateSpaceScale({...})` returns sizes plus `oneUpPairs` and `customPairs`. Output shape: `--step-0: clamp(1.125rem, 1.0739rem + 0.2273vw, 1.25rem)` ([calculator](https://utopia.fyi/type/calculator/)).

**Six numbers define an entire type-scale identity.** After colour, this is your highest-leverage generative axis — and unlike colour, it is under-exploited by every generator surveyed.

### Every Layout — algorithmic layout primitives

13 primitives — Stack, Box, Center, Cluster, Sidebar, Switcher, Cover, Grid, Frame, Reel, Imposter, Icon, Container — composed *"without the need for `@media` breakpoints"* ([every-layout.dev/layouts](https://every-layout.dev/layouts/)). The thesis: *"We make many of our biggest mistakes as visual designers for the web by insisting on hard coding designs"*; *"Documentation is to a system what extrapolation is to an algorithm. Algorithms amplify design"* ([Algorithmic Design](https://every-layout.dev/blog/algorithmic-design/)). Each primitive's variability is 1–2 numeric props (gap, threshold, side width, minimum inline size) — exactly the shape of an LLM-emittable prop bag.

Note the framing carefully: Every Layout claims **robustness**, not distinctiveness. Algorithms amplify design; they do not author it.

### Tailwind v4 `@theme` — the injection point

*"Theme variables are special CSS variables defined using the `@theme` directive that influence which utility classes exist"* ([tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme)). Namespaces `--color-*`, `--font-*`, `--spacing-*`, `--breakpoint-*`, `--radius-*`, `--shadow-*`; all compile to `:root` CSS vars *and* generate utilities. `@theme inline {}` inlines a referenced value rather than emitting a var reference. `--color-*: initial` wipes a namespace; `--*: initial` wipes everything for a fully custom theme.

That last detail matters for you: **`--*: initial` lets a per-client token set fully replace Tailwind's defaults**, so the shared block package stays byte-identical across the fleet while every site's utility vocabulary differs.

### W3C DTCG format — stable enough to adopt, if you pin the version

**Design Tokens Format Module 2025.10 is stable**, published 28 Oct 2025 as a Final Community Group Report: *"This specification is considered stable. Further updates will be provided in superseding specifications"* ([designtokens.org/TR/2025.10/format/](https://www.designtokens.org/TR/2025.10/format/)); the homepage announces "First stable version 2025.10 now available" ([designtokens.org](https://www.designtokens.org/)). It is **not** a W3C Standard — it is a Community Group report under the Final Specification Agreement.

Normative surface: `$value` (required), `$type`, `$description`, `$extensions`, `$deprecated`; types color, dimension, fontFamily, fontWeight, duration, cubicBezier, number, plus composites strokeStyle, border, transition, shadow, gradient, typography; aliases via `{group.token}` and JSON Pointer `$ref`; MIME `application/design-tokens+json`, extensions `.tokens` / `.tokens.json`. Date-as-version convention per the [community-group README](https://github.com/design-tokens/community-group).

**Warning:** the drafts URL ([designtokens.org/TR/drafts/format/](https://www.designtokens.org/TR/drafts/format/), dated 30 Jul 2026) states *"Do not attempt to implement this version… Do not reference this version as authoritative."* Pin to 2025.10.

[Style Dictionary](https://styledictionary.com/) is the transform pipeline; npm `latest` is **5.5.2** (registry dist-tags — note the docs site still documents v4, so docs lag the release). It advertises forward-compatibility with DTCG.

### What is generatable vs what must be designed

**Algorithmically solvable today, with guarantees:** colour ramps, role assignment and contrast (MCU `ContrastCurve` / `ToneDeltaPair`; Leonardo ratio inversion); fluid type and space scales with WCAG 1.4.4 checking (utopia-core); radius / border / shadow ramps (trivial geometric series — no primary source claims taste is involved); layout parameters (Every Layout's numeric props).

**Not generatable from a seed, per the sources' own scope:** typeface selection and pairing (no primary generator exists — Open Props ships fixed stacks, MCU has no type module), imagery and art direction, motion character (Open Props ships fixed easings; MCU's `Blend` animates colour only), compositional rhythm and asymmetry, editorial taste. *Inference, flagged as such:* none of this prior art even attempts these, which is itself the evidence.

### Does anyone claim tokens alone yield distinct identities? No.

- MCU's own variant table shows differentiation reduces to ~6 chroma constants and a few hue rotations — a **mood** axis, not an **identity** axis.
- `Score` hard-codes a fallback to Google Blue and filters low-chroma hues, actively pulling outputs toward a mean ([score.ts](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/score/score.ts)).
- Google's own design library argues the opposite of "let the algorithm decide": *"Color is one of the most important elements of your brand identity… If you've developed a strong color story for your brand, stick with it"* ([design.google](https://design.google/library/staying-true-to-your-identity-material-branding)).
- Every Layout's claim is explicitly about robustness, not distinctiveness.
- **No primary source was found claiming a generated token set yields a distinct visual identity.** Popular criticism of Material You sameness exists (e.g. [Android Police](https://www.androidpolice.com/everything-i-hate-about-material-you/)) but is non-primary — anecdote, not evidence.

**Implication for failure mode (a)/(b): colour, type and space tokens are the *least* differentiating layer you have.** Distinctiveness must come from things your JSON also carries — block-variant selection, layout archetype, typeface pairing from a curated set, image treatment, density and section rhythm — not from the token generator.

---

## Thread 2 — Block/section catalogs and JSON page models: how "variant" is actually modelled

### Headline

**Nobody treats "variant" as a first-class citizen in the stored page model.** Across nine systems a variant is one of four things: (1) an enum prop/setting, (2) a separately registered component type, (3) a seeded preset that dissolves into props on insert, or (4) — uniquely, and only in WordPress — **a named style variation that persists as an identifier on the instance and is resolved against a swappable theme layer at render time**. Only (4) survives central patching, and WordPress 6.6 shipped it as "Section Styles".

Second headline: **Puck now ships almost exactly your architecture**, including a headless LLM emission API constrained by your component registry.

### Puck — closest structural match, and it already has the AI layer

`Data = { root: RootData, content: ComponentData[], zones?: Record<string, ComponentData[]> }` where `ComponentData = { type: string, props: { id: string, ... } }` ([Data.tsx](https://github.com/puckeditor/puck/blob/main/packages/core/types/Data.tsx), [Data reference](https://puckeditor.com/docs/api-reference/data)). `zones` is deprecated in favour of **slot fields** which nest `ComponentData[]` inline.

Variant is **not** first class: the field union is `text | richtext | textarea | number | select | radio | array | object | external | custom | slot` ([Fields.ts](https://github.com/puckeditor/puck/blob/main/packages/core/types/Fields.ts)). A variant is a `select`/`radio` prop, nothing more.

Composition constraints exist but are shallow: `SlotField` carries `allow?: string[]` / `disallow?: string[]`, enforced at field level rather than only in the UI ([slot docs](https://puckeditor.com/docs/api-reference/fields/slot)). Flat allowlists per slot; no sequencing, no conditional composition.

Headless rendering is fully supported — `<Render config={config} data={data} />` from `@puckeditor/core`, no editor dependency, SSR/SSG friendly ([Render docs](https://puckeditor.com/docs/api-reference/components/render)). That works in an Astro build.

**Puck AI is the important part.** `import { generate } from "@puckeditor/cloud-client"`; `generate({ prompt, config, pageData?, mode?, designMode? })` resolves to Puck `Data` ([headless generation](https://puckeditor.com/docs/ai/headless-generation), [Puck AI 0.3](https://puckeditor.com/blog/puck-ai-03)). Two modes — **assembly** (compose only from registered components) and **design** (invent new component types) ([AI overview](https://puckeditor.com/docs/ai/overview)). Assembly mode *is* your constraint.

The guardrail machinery is the most directly stealable thing found anywhere: an `ai` object on components and fields supporting `instructions` (e.g. component-level `"Always place this first"`), `exclude: true` to delete a component from the agent's vocabulary, `required`, `bind` (tie a field to a tool's output such as `getImageUrl`), and `stream` ([AI configuration](https://puckeditor.com/docs/ai/ai-configuration)). For fields Puck can't infer, you supply a **JSON Schema subset**: `string, integer, number, boolean, object, array, enum, anyOf`, with string `pattern`/`format`, numeric `minimum`/`maximum`/`multipleOf`, array `minItems`/`maxItems` ([field AI config](https://puckeditor.com/docs/api-reference/ai/configuration/fields)). **`enum` is supported, so variant selection is constrained-decodable.**

Active development (v0.23.0, Aug 2026). `resolveData` / `resolveFields` / `resolvePermissions` run on data change and can rewrite props or lock fields ([ComponentConfig](https://puckeditor.com/docs/api-reference/configuration/component-config)) — a usable post-LLM normalisation hook. Caveat: `generate()` routes through Puck Cloud, which may be disqualifying given you run your own credits.

### WordPress Gutenberg — the deepest and most relevant prior art

WP is the only ecosystem that has independently solved *both* halves of your problem and separates them cleanly.

**Three distinct mechanisms, often conflated:**

- **Block variations** (`registerBlockVariation`, or `variations` in `block.json`) = a *pre-seeded block*: `{ name, title, attributes, innerBlocks, scope, isDefault, isActive, icon, keywords }`, `scope` ∈ `"block" | "inserter" | "transform"` ([Block Variations](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-variations/)). **The variation identity is not stored** — attributes are copied onto the block, and WP recovers identity heuristically via `isActive` (an attribute-name array or a matcher function). That reconstruction hack is direct evidence that *not* persisting the variant slug is a design mistake. Note this for your own schema.
- **Block styles / block style variations** = the persistent kind. A named style puts `is-style-{slug}` on the block wrapper and **the style definition lives in the theme, not the content** ([Section Styles dev note](https://make.wordpress.org/core/2024/06/24/section-styles/)).
- **Block patterns** = pre-composed markup, filtered by `blockTypes`, `postTypes`, `templateTypes`, `categories`, `inserter` ([Block Patterns](https://developer.wordpress.org/themes/features/block-patterns/)). Composition templates, not variants.

**The 6.6 mechanism that answers "one library, many looks".** WP 6.6 made block style variations registerable from `styles/*.json` with a top-level `blockTypes` array, applying one named style across multiple block types ([WP 6.6 dev news](https://developer.wordpress.org/news/2024/06/styling-sections-nested-elements-and-more-with-block-style-variations-in-wordpress-6-6/)). Twenty Twenty-Five ships exactly this:

```json
// styles/sections/section-1.json
{ "$schema": "https://schemas.wp.org/trunk/theme.json", "version": 3,
  "slug": "section-1", "title": "Style 1",
  "blockTypes": ["core/group","core/columns","core/column"],
  "styles": { "color": { "background": "var:preset|color|accent-5",
                         "text": "var:preset|color|contrast" },
              "blocks": { "core/separator": {}, "core/site-title": {} } } }
```
([twentytwentyfive/styles/sections/section-1.json](https://github.com/WordPress/twentytwentyfive/blob/trunk/styles/sections/section-1.json))

Three properties matter enormously:

1. **Variant identity persists on the instance** as `is-style-section-1`, and the *meaning* of that slug comes from a swappable JSON file. Change the theme, every instance re-themes. **Fleet patching by construction.**
2. **Styles reference tokens indirectly** — `var:preset|color|accent-5`, never a hex. `theme.json` settings compile to CSS custom properties on a strict schema: `--wp--preset--color--{slug}`, `--wp--preset--font-size--large`, `--wp--preset--spacing--50`, `--wp--custom--line-height--body` ([Global Settings & Styles](https://developer.wordpress.org/block-editor/how-to-guides/themes/global-settings-and-styles/)). Your design-token JSON is this layer.
3. **Section styles cascade into nested blocks and elements** — a variation's `styles.blocks["core/post-terms"]` and `styles.elements.link` restyle *children*, enabled by WP 6.6 flattening Global Styles specificity to a uniform `0-1-0` ([Section Styles](https://make.wordpress.org/core/2024/06/24/section-styles/)). One "Section 1" style repaints a whole hero including its buttons and separators.

Theme style variations are the coarse layer: `styles/*.json` files are wholesale alternative `theme.json`s ([Style Variations](https://developer.wordpress.org/themes/global-settings-and-styles/style-variations/)). TT4 ships 7 (ember, fossil, ice, maelstrom, mint, onyx, rust); TT5 ships 8 global plus `blocks/`, `colors/`, `sections/`, `typography/` subfolders. **Same block library, same content JSON, visually unlike sites.** That is the closest thing to an anti-sameness existence proof in this whole document.

Both layers have published JSON Schemas — `https://schemas.wp.org/trunk/theme.json` (draft-07, ~103KB) and `https://schemas.wp.org/trunk/block.json` both return 200. Machine-validatable, LLM-constrainable.

**Composition grammar — the best of any system.** `block.json` supports `parent` (direct-parent whitelist), `ancestor` (anywhere in subtree, 6.0+) and `allowedBlocks` (direct-children whitelist, 6.5+) ([Block Registration](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/)); `core/column` declares `"parent": ["core/columns"]` ([source](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/column/block.json)). **Block Hooks** are the only algorithmic composition found anywhere: `blockHooks: { 'core/verse': 'before', 'core/group': 'lastChild' }` auto-inserts a block relative to another ([Block Registration](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/#block-hooks)) — placement, not variant selection.

For fleet patching: `theme.json` merges in four filterable layers — `wp_theme_json_data_default`, `_blocks`, `_theme`, `_user`, each mutable via `update_with()` ([Global Styles filters](https://developer.wordpress.org/block-editor/how-to-guides/themes/global-styles/)). A shared package injecting a layer is precisely your npm-bump model.

### Shopify OS 2.0 — the production-proven page-model envelope

`templates/*.json` is `{ layout?, wrapper?, sections: { id: { type, settings, blocks: { id: {type, settings} }, block_order: [] } }, order: [] }`, capped at 25 sections/template and 50 blocks/section ([JSON templates](https://shopify.dev/docs/storefronts/themes/architecture/templates/json-templates); real example [dawn/templates/index.json](https://github.com/Shopify/dawn/blob/main/templates/index.json)). Section groups hoist the same shape above templates ([dawn/sections/header-group.json](https://github.com/Shopify/dawn/blob/main/sections/header-group.json)).

**Presets are seeds, not variants**: `{name, category?, settings?, blocks?}` copied into the template on insert and then forgotten ([section-schema](https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema)). Every Dawn section ships exactly one. Real variation in Dawn is `select` settings — `card_style`, `image_ratio`, `image_shape`, `heading_size`, `desktop_content_position`.

**How Dawn powers visually unlike stores — and it is not presets:**

1. `config/settings_schema.json` (~40KB) defines global typed tokens: typography scales, `page_width`, spacing, and per-primitive banks (buttons, cards, inputs, popups, media) each with `border_thickness`, `radius`, `shadow_*` ([source](https://github.com/Shopify/dawn/blob/main/config/settings_schema.json)). `layout/theme.liquid` compiles these to `:root { --font-body-family: …; --page-width: …rem; }`.
2. **`color_scheme_group` → scoped token sets.** `theme.liquid` emits `.color-{scheme.id} { --color-background: …; --color-foreground: … }` per scheme; each section carries a `color_scheme` setting and renders `class="color-{{ section.settings.color_scheme }}"` ([featured-collection.liquid](https://github.com/Shopify/dawn/blob/main/sections/featured-collection.liquid)). **Per-block token scoping via a class — copy this verbatim for Astro/React.** It is how you get within-page visual rhythm without new components.
3. `config/settings_data.json` holds `{current, presets}` — up to five named theme styles overwriting *presentational* settings only, leaving content untouched ([settings-data-json](https://shopify.dev/docs/storefronts/themes/architecture/config/settings-data-json)).

Constraints: `limit` per section, `max_blocks`, block-`type` whitelists, `enabled_on`/`disabled_on` scoping ([section-schema](https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema)); theme blocks add whitelist-constrained multi-level nesting via `{"type":"@theme"}` + `{% content_for 'blocks' %}` ([theme-blocks](https://shopify.dev/docs/storefronts/themes/architecture/blocks/theme-blocks)).

**Shopify's AI went the opposite way from you:** Sidekick generates *Liquid code* for new theme blocks, not JSON ([ai-generated-theme-blocks](https://shopify.dev/docs/storefronts/themes/architecture/blocks/ai-generated-theme-blocks)). No algorithmic preset selection.

### The CMSes — short version

**Payload.** The `blocks` field stores heterogeneous objects discriminated by `blockType` (= the block `slug`), plus optional `blockName` ([docs](https://payloadcms.com/docs/fields/blocks), [blocks.mdx](https://github.com/payloadcms/payload/blob/main/docs/fields/blocks.mdx)). Constraints: `minRows`/`maxRows`, custom `validate`, and `filterOptions` (a function returning allowed block slugs per context, with removal-triggering validation errors on save). No variant concept. **Best LLM ergonomics of any CMS**: `payload.create()` validates against the collection schema on write, and a `jsonSchema` field override is documented as used for MCP validation.

**Builder.io.** Content is `{data: {blocks: [{component: {name, options}, responsiveStyles, "@type": "@builder.io/sdk:Element"}]}}` ([how Builder works](https://www.builder.io/c/docs/how-builder-works-technical)). Code *or* data, depending on product: Visual Copilot / Figma-to-code emits **code** via Mitosis ([blog](https://www.builder.io/blog/figma-to-code-visual-copilot)); the in-editor Visual Editor AI emits **data**, composing "your Space's registered design tokens, custom components, templates, and Symbols" ([docs/ai](https://www.builder.io/c/docs/ai)). Builder has the **most expressive composition grammar**: `childRequirements` as a MongoDB-style sift query (`{query: {'component.name': {$in: ['Button','Text']}}}`), plus `requiresParent`, `canHaveChildren`, `models` ([registerComponent options](https://www.builder.io/c/docs/register-components-options)). Variant is an `enum` input.

**Storyblok.** `{component, _uid, ...props}` ([Blocks](https://www.storyblok.com/docs/concepts/blocks)). Per-slot constraints are good: `restrict_components`, `component_whitelist`, `component_group_whitelist`, `restrict_type`, `maximum`/`minimum` ([Component Schema Field Object](https://www.storyblok.com/docs/api/management/components/the-component-schema-field-object)). **Presets are the variant mechanism and they are lossy** — `{id, name, preset: {…field values}, image}` copied into content on insert ([Presets](https://www.storyblok.com/docs/api/management/presets.md)), so variant identity does not persist and you cannot re-theme by variant. This is precisely the failure mode to avoid.

**Sanity.** `{_type, _key, ...props}` in arrays with an `of` allowlist ([Array type](https://www.sanity.io/docs/studio/array-type)); Portable Text is the same pattern for rich text ([spec](https://github.com/portabletext/portabletext)). Sanity's own guidance argues *against* a variant field: *"keep presentation-related concerns out of your content models… your next redesign budget will thank you"* ([page building guide](https://www.sanity.io/docs/developer-guides/how-to-use-structured-content-for-page-building)). Worth taking seriously — the WordPress answer is that a variant slug is *semantic* ("Section Style 1") whose appearance lives in the theme layer, which satisfies the objection. **Sanity Agent Actions** is real schema-constrained document generation: `client.agent.action.generate({schemaId, targetDocument, instruction, target: {path}})` ([quickstart](https://www.sanity.io/docs/agent-actions/generate-quickstart)).

**TeleportHQ.** Actively maintained (commits Sept 2026, v0.43.61 on npm), formal `ComponentUIDL`/`ProjectUIDL` with a typed node union (`static|dynamic|element|conditional|repeat|slot|cms-list|…`), `designLanguage.tokens`, `styleSetDefinitions` ([uidl.ts](https://github.com/teleporthq/teleport-code-generators/blob/development/packages/teleport-types/src/uidl.ts)). Validation is runtime decoders, **not** JSON Schema ([validator](https://github.com/teleporthq/teleport-code-generators/blob/development/packages/teleport-uidl-validator/src/validator/index.ts)). **Do not adopt.** UIDL is a DOM-level IR — `elementType`, `attrs`, `style`, arbitrary nesting. An LLM emitting UIDL is writing HTML in JSON, i.e. your explicitly prohibited failure mode. No variant concept.

**Webflow.** Variants are first class in the Designer (one variant property per component, conditionally bindable to CMS fields) ([Component variants](https://help.webflow.com/hc/en-us/articles/51307110086547-Component-variants)), with typed component properties ([University](https://university.webflow.com/lesson/component-properties)). But the Data API returns a flat node list with `propertyOverrides`, explicitly excluding structural/design metadata ([get-content](https://developers.webflow.com/data/reference/pages-and-components/pages/get-content)) — you can fill slots, never author a page. Not adoptable.

**Framer.** Variants are first-class canvas objects including breakpoint variants ([Academy](https://www.framer.com/academy/lessons/framer-fundamentals-components)). **Thin/unverified**: no first-party developer docs exposing a JSON page model or variant-addressable API were found (`framer.com/developers/components-variants` 404s). Treat "no LLM-emittable JSON model" as unsupported-by-evidence, not confirmed.

### Blunt answers

**Which variant model survives central patching?** Only WordPress's block style variation. Enum props (Puck, Builder, Payload, Sanity, Shopify settings) survive fine but push all styling decisions into the prop value, so re-theming means rewriting content. Presets (Shopify, Storyblok) **do not survive at all**. Separate registered types (Payload slugs) survive but explode the catalog combinatorially. **Do: persist `variant` as an opaque slug on the block instance; resolve slug → styles in a theme JSON layer shipped by the shared package.** That is literally `is-style-{slug}` + `styles/*.json`.

**Automatic variant selection?** **No. Nowhere. Not one system.** Puck AI selects *components* (constrained by config + `ai.instructions` + `exclude`); Sanity Agent Actions fills *fields*; Builder AI composes registered components; Shopify AI writes Liquid. WP's `isActive` *detects* which variation a block matches — the inverse. Unclaimed ground, and exactly where your sameness risk lives.

**Composition constraints, ranked:** Builder.io (sift queries in `childRequirements`, `requiresParent`, `models`) > Gutenberg (`parent`/`ancestor`/`allowedBlocks` + `blockHooks` + pattern filters) > Storyblok (per-slot whitelists + min/max) > Shopify (`limit`, `max_blocks`, type whitelists, `enabled_on`) > Puck / Payload / Sanity (flat allowlists).

**Nobody constrains sequence.** No system expresses "a Testimonials block may not immediately follow another Testimonials block", or "a page must contain exactly one Hero, first". Every one is "array of allowed types". Your composition grammar — required slots, ordering rules, adjacency bans, per-page cardinality — has **no prior art to copy**, and is likely your strongest structural defence against template-sameness.

**Thin sources, stated plainly.** Framer: no first-party JSON page model found, expected docs path 404s. Storyblok: docs don't state whether a preset reference persists on the blok; inferred from the preset object shape, unconfirmed. Payload `blockReferences`: found via search snippet only, not in `blocks.mdx`; semantics unverified. Builder "AI emits data": inferred from the Visual Editor AI composing registered components into the editor's storage format, never stated literally. Puck AI: no published rationale for data-over-code, model/provider undocumented.

---

## Thread 3 — AI site generators that emit structured data rather than code

### vercel-labs/json-render — the closest published match to your architecture

Apache-2.0, launched January 2026, >13k stars, 200+ releases ([repo](https://github.com/vercel-labs/json-render)). The README's own framing: *"Generate dynamic, personalized UIs from prompts without sacrificing reliability"*, with three claimed properties — **Guardrailed** (AI can only use components you define), **Predictable** (JSON matches your schema), **Fast** (streaming).

Mechanism, from [the docs](https://json-render.dev/docs):

- **Catalog** (`defineCatalog()` in `@json-render/core`) is *"the vocabulary for your UI"*, while the schema is *"the grammar"* ([catalog docs](https://json-render.dev/docs/catalog)). Components declare Zod prop schemas and named **slots**:
  ```js
  Card: {
    props: z.object({
      title: z.string(),
      description: z.string().nullable(),
      padding: z.enum(["sm", "md", "lg"]).nullable(),
    }),
    slots: ["default"],
    description: "Container card for grouping content",
  }
  ```
- **`catalog.prompt()`** auto-generates the system prompt from the catalog, and accepts `customRules: [...]` ([catalog docs](https://json-render.dev/docs/catalog)). This is directly reusable: your block catalog becomes the prompt, so catalog and prompt can never drift.
- **Spec** is a flat adjacency structure — a `root` id plus an `elements` map of `{type, props, children, slots}` — described as *"the actual JSON that describes a UI"* that can be *"generated by AI in real-time, stored in a database, streamed progressively from a server, or hand-authored as JSON files"* ([specs docs](https://json-render.dev/docs/specs)). `validateSpec` from core does structural validation.
- **Registry** (`defineRegistry()`) maps abstract catalog names to real framework components — the indirection that makes fleet-wide patching possible.
- Packages: `@json-render/core`, `@json-render/react`, `@json-render/shadcn` (36 shadcn components), `@json-render/next`, plus Vue/Svelte/Solid/RN/PDF/email/video/terminal renderers ([README](https://github.com/vercel-labs/json-render)).

**Fit verdict.** The catalog/spec/registry split is exactly right and worth copying wholesale. But json-render is built for *interactive, runtime, streaming* generative UI — `$state`/`$cond`/`$template` dynamic props, `setState` actions, watchers, StateProvider/VisibilityProvider ([README](https://github.com/vercel-labs/json-render), [specs docs](https://json-render.dev/docs/specs)). You want build-time static marketing pages with zero client JS. Most of the runtime machinery is dead weight for you.

**Gaps for us:** (i) no theming or design-token layer at all — the spec describes structure, never art direction; (ii) `variant` is only ever a Zod enum prop, not a first-class concept; (iii) the docs *"[don't] explicitly detail versioning or patching strategies for specs"* ([specs docs](https://json-render.dev/docs/specs)) — the fleet-patching story is yours to build; (iv) nothing constrains *which* block may follow which beyond slots.

### A2UI (Google) — a standardised flat UI protocol

*"Enables AI agents to generate rich, interactive user interfaces that render natively across web, mobile, and desktop — without executing arbitrary code"* ([a2ui.org](https://a2ui.org)). Created by Google with CopilotKit and community contributions, Apache-2.0, repo at [github.com/a2ui-project/a2ui](https://github.com/a2ui-project/a2ui); spec v1.0 is at candidate-release, v0.9.1 is the current production release ([a2ui.org](https://a2ui.org)). It uses an **adjacency-list model** — *"a flat list of components with ID references"* explicitly so that **individual components can be patched** ([json-render A2UI docs](https://json-render.dev/docs/a2ui)). json-render can render A2UI natively with no conversion layer, since `@json-render/core` is schema-agnostic ([custom schema docs](https://json-render.dev/docs/custom-schema)).

**Relevance:** the adjacency-list-for-patchability argument is the strongest structural argument found for a flat `elements` map over a nested tree. Adopt the shape even if you don't adopt the protocol. A2UI itself is aimed at agent-to-client chat surfaces, not marketing sites; it has no token/theme layer either.

### Code-emitting generators (v0, Lovable, Bolt) — wrong side of the line

- **v0** outputs *real code*, not data: *"create real code and full-stack apps"*, targeting *"Next.js, Tailwind, shadcn/ui, and more"* ([v0.app/docs](https://v0.app/docs/)). The docs contain no mention of design tokens, theme management, or brand-distinctiveness features (checked 2026-09-04). Not centrally patchable — once code lands in a repo, a fleet bump is N merge conflicts.
- **Lovable / Bolt** likewise emit code to a git repo. I could not reach authoritative first-party docs pinning their output contract; treat as **uncertain in detail, certain in kind** (both are code generators — Bolt's own support docs discuss importing/exporting projects and repos, e.g. [support.bolt.new](https://support.bolt.new/integrations/lovable-import)).
- **Locofy / Anima** run the *opposite* direction (design → code) and are irrelevant to a brief → JSON pipeline.

The blunt structural point: **code output cannot be fleet-patched.** Your JSON-only constraint is the correct one and is the same conclusion OpenPage reached (below).

### Relume — the only mainstream product doing automatic block selection from a fixed catalog

Relume generates a sitemap from a prompt, then *"turns your Sitemap into wireframes in one click generating real components un-styled with copy"*, choosing from a library of 1000+ pre-built components/sections ([relume.ai](https://www.relume.ai/)). The selection signal is first-party-documented: *"The title and description of a section in the sitemap helps inform AI what component to generate in the wireframes. We call this the section prompt"* ([Relume docs](https://www.relume.ai/resources/docs/how-to-create-and-edit-wireframes-in-the-relume-site-builder)).

So: a two-stage pipeline — **brief → sitemap with per-section intent strings → component selection** — is validated in production. Relume also supports *"replace a component but keep the same copy easily"* and global sections that become global components on Webflow/Figma export ([same doc](https://www.relume.ai/resources/docs/how-to-create-and-edit-wireframes-in-the-relume-site-builder)).

**Gap:** Relume's output is deliberately **unstyled**. It solves structure and copy; art direction is explicitly handed back to the human in Webflow/Figma. No first-party docs found on how (or whether) it varies visual identity. That is a strong signal that the hard half of your problem is the half Relume declined to automate.

### Wix ADI — the historical precedent, and a cautionary tale

Wix shipped ADI in 2016; first-party account: it *"asked a few questions (in the vein of 'Do you like this, or do you like that?') and then mocked up a site according to each user's selections"* ([wix.com/blog](https://www.wix.com/blog/wix-artificial-design-intelligence)). Wix **discontinued ADI sites on 10 Nov 2024** ([support.wix.com](https://support.wix.com/en/article/adi-sites-no-longer-supported)) and replaced the architecture entirely with Wix Harmony, of which Wix says: *"Wix Harmony is not 'AI sprinkled on top' of the old Wix editor. We completely changed the architecture so that vibe coding and visual editing work harmoniously together on the same project"* ([wix.com/blog](https://www.wix.com/blog/wix-artificial-design-intelligence)).

**Explicit uncertainty:** the widely repeated claims about ADI selecting from *"billions of high-quality combinations"* of sections/fonts/palettes appear only in secondary reviews, not in any Wix engineering post I could locate. I could find **no first-party Wix engineering writing** describing the combinatorial design engine. Do not build a plan on the "billions of combinations" figure.

The decision-relevant fact is the outcome, which *is* first-party: the combinatorial-selection ADI approach was retired and replaced by a code-and-canvas hybrid.

---

## Thread 4 — Documented evidence of the "everything looks the same" problem, and measured mitigations

### The effect is real, causal, and measured

- **Doshi & Hauser, *Science Advances* 2024** ([doi:10.1126/sciadv.adn5290](https://www.science.org/doi/10.1126/sciadv.adn5290)): an online experiment on short-story writing found access to GenAI ideas makes individual stories *more* creative and better-written — *especially for less-creative writers* — but **GenAI-enabled stories are more similar to each other than human-only stories**. The authors frame it as a social dilemma: individually better off, collectively narrower. Data deposited at [Dryad](https://datadryad.org/dataset/doi:10.5061/dryad.qfttdz0pm). This is the canonical citation for your feared failure mode (c).
- **Kirk et al., ICLR 2024, "Understanding the Effects of RLHF on LLM Generalisation and Diversity"** ([arXiv:2310.06452](https://arxiv.org/abs/2310.06452)): stage-by-stage analysis (SFT → reward model → RLHF) across two base models and two tasks. Finding: RLHF generalises better than SFT but **substantially reduces output diversity both per-input and across-input** — an inherent generalisation↔diversity trade-off. Diversity measured syntactically, semantically and logically.
- **Format itself collapses diversity**: "The Price of Format: Diversity Collapse in LLMs" ([arXiv:2505.18949](https://arxiv.org/abs/2505.18949)). Directly relevant given you are forcing structured JSON output — **structured-output constraints are themselves a diversity-reducing pressure**, on top of RLHF. This is a real cost of your hard constraint and should be planned for, not discovered later.
- **Homogenisation of creative work generally**: an empirical human-vs-ChatGPT writing comparison found human-written essays contributed roughly **2-8x more to collective semantic diversity** than GPT-4 essays across three studies ([ScienceDirect, S294988212500091X](https://www.sciencedirect.com/science/article/pii/S294988212500091X)).

### Mitigations with published evidence

**1. Verbalized Sampling (strongest, cheapest, adopt this).** [arXiv:2510.01171](https://arxiv.org/abs/2510.01171), Zhang, Yu, Chong et al. (Northeastern/Stanford); code at [CHATS-lab/verbalized-sampling](https://github.com/CHATS-lab/verbalized-sampling). The paper's causal claim is different from prior work: mode collapse is driven by **typicality bias in preference data** — annotators systematically prefer familiar text — not by an algorithmic limitation. The fix is a training-free prompt shape: ask the model to *verbalize a probability distribution over a set of responses* (e.g. "generate 5 X and their corresponding probabilities"). Reported **1.6-2.1x diversity gain in creative writing**, 2-3x headline, quality maintained, **model-agnostic and orthogonal to temperature** ([repo README](https://github.com/CHATS-lab/verbalized-sampling)).

Direct application: do not ask Claude for "the art direction". Ask for **5 candidate art directions with self-assessed probabilities**, then deliberately select a low-probability one that still passes your token validator. This is the single highest-leverage thing in this document.

**2. Diverse personas at the input stage.** [arXiv:2504.13868](https://arxiv.org/abs/2504.13868) prompted **10 diverse GenAI personas to generate 300 story plots** and found *"diverse GenAI inputs can preserve story diversity compared to a human-only baseline"* — i.e. the collective-diversity loss was **eliminated**. The authors' conclusion is the useful one: the trade-off *"may emerge from uniform deployment practices rather than from an inherent limitation of GenAI, and ... diversity can be intentionally built into AI-mediated collaboration."*

Direct application: maintain a roster of named art-director personas (with genuinely different aesthetic commitments) and assign one per client, rather than running one uniform "design a website" prompt across the fleet.

**3. Quality-Diversity / MAP-Elites — theoretically the right frame, no published design-token application found.** MAP-Elites (Mouret & Clune, [arXiv:1504.04909](https://arxiv.org/abs/1504.04909); reference implementation [resibots/pymap_elites](https://github.com/resibots/pymap_elites)) maintains an archive of the best solution *per cell* of an explicitly-defined behaviour space, rather than one global optimum — hence "illumination algorithm" ([Mouret's QD page](https://members.loria.fr/jbmouret/qd.html)). Published applications are robot gaits and procedural game content; I found **no primary source applying QD to design tokens or web layout**. Treat as an adaptable idea, not prior art.

The adaptable idea is precise and cheap, though: define a **behaviour space of art-direction descriptors** (e.g. hue family × contrast regime × type-classification pairing × density × radius regime × section-rhythm signature), quantise it into cells, and **keep an archive of which cells the fleet already occupies**. New client → forbid occupied cells. This is a database table, not an evolutionary algorithm.

**4. Nobody keeps such a registry today.** Searched for prior art on used-combination registries forcing divergence across generated sites; found none in primary sources. The nearest thing is [nexu-io/open-design](https://github.com/nexu-io/open-design) (Apache-2.0), whose `DESIGN.md` format is a 9-section portable spec — *color, typography, spacing, layout, components, motion, voice, brand, and **anti-patterns*** — and which offers 5 curated visual directions, *"each a deterministic OKLch palette + font stack"* ([opendesigner.io](https://opendesigner.io/)). The **`anti-patterns` section as a first-class part of the design spec** is the single most directly stealable idea here. But 5 fixed directions is a preset picker, not diversity generation.

### What "AI slop" actually looks like — a first-party, hex-level list

Anthropic's own `frontend-design` skill is the most specific primary source found on the visual tells, and it is on this machine at `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/frontend-design/skills/frontend-design/SKILL.md`. It states that *"AI-generated design right now clusters around some traits"* and enumerates them:

1. *"a warm cream background (near #F4F1EA) with a high-contrast serif display and a terracotta or warm-clay accent (often near #D97757 — Anthropic's own Claude-interaction accent, so on a user's brief it reads as a tell)"*
2. *"a near-black background with a single bright acid-green or vermilion accent"*
3. *"a broadsheet-style layout with hairline rules, zero border-radius, and dense newspaper-like columns"*
4. *"the SaaS-card kit: content chopped into identical rounded cards, one border-radius on everything regardless of hierarchy, the same soft grey shadow (rgba(0,0,0,.1)) under each, and gradient washes as decoration"*
5. *"template chrome that appears whatever the subject: a tracked-out ALL-CAPS eyebrow label above every heading; meta strings joined with middle dots ('A · B · C'); labels built as 'WORD — fragment' with a spaced em dash; tinted near-black (#0B0B0B, #111) standing in for black; a monospace face for small data labels; a '→' appended to link and button text."*

Plus typographic tells called out separately: *"Accenting just a single word or phrase in a headline"*, *"Using all caps for labels"*, *"Adding unnecessary typographic labels above content"*, and — for motion — *"fade-and-slide-up entrances on each section and hover transitions on every card are the generic default and read as AI-generated."*

The skill's crucial framing: *"All traits are legitimate for some briefs, but they are defaults rather than choices, and they appear regardless of subject. Where the brief pins down a visual direction, follow it exactly ... Where it leaves an axis free, don't spend that freedom on one of these defaults."*

**This is machine-checkable.** Most of that list can be enforced by a validator over the emitted token JSON and page model — perceptual distance from `#F4F1EA`/`#D97757`, "is every block using the same radius", "does every heading have an eyebrow", "is `→` in CTA copy", "is the same entrance animation on every section". Do that in CI, not in the prompt; prompts drift, validators don't.

The skill also prescribes a two-pass process worth copying into the pipeline: brainstorm a compact token system (4-6 named hex values, typeface roles, layout concept with ASCII wireframes, principles), then **review that plan against the brief and revise anything that reads as a generic default before generating anything else**.

### Benchmarks that exist for measuring this

- **UI-Bench** ([arXiv:2508.20410](https://arxiv.org/pdf/2508.20410)): 10 tools, 30 prompts, 300 generated sites, 4,000+ expert pairwise judgements, TrueSkill-derived ranking with calibrated confidence intervals; prompts, evaluation framework and leaderboard released. Measures **quality**, and the abstract does not report a sameness finding — do not cite it as evidence of homogeneity.
- **WebGen-Bench** ([arXiv:2505.03733](https://arxiv.org/abs/2505.03733)) and **WebGen-V Bench** ([arXiv:2510.15306](https://arxiv.org/html/2510.15306v1), notable for a *"structured, section-wise data representation that integrates metadata, localized UI screenshots, and JSON-formatted text and image assets"* — close to your page model) measure functional/instruction-following quality.
- A "Generation Diversity (GD)" metric measuring *"the low-level visual diversity among generated prototypes"* appears in the LLM-UI-evaluation literature ([arXiv:2412.20071](https://arxiv.org/html/2412.20071v3)). **Uncertain**: I did not verify its exact definition or whether it is reusable off-the-shelf. Worth 30 minutes before you invent your own diversity metric.

---

## Thread 5 — Automated design-quality gates in CI

Versions verified 2026-09-04 via GitHub/npm APIs and vendor docs.

### Token-only lint — forbidding raw hex/px

**stylelint 17.14.1** (2026-07-20) still ships the relevant rules; the 16.0 migration removed only stylistic rules, and the [to-17 removals](https://github.com/stylelint/stylelint/blob/main/docs/migration-guide/to-17.md) (CommonJS Node API, Node <20.19) don't touch them.

`declaration-property-value-allowed-list` takes regex on keys and values ([docs](https://stylelint.io/user-guide/rules/declaration-property-value-allowed-list/)):

```json
{ "declaration-property-value-allowed-list": {
    "/color$/": ["/^var\\(--/", "transparent", "currentColor", "inherit"],
    "/^(margin|padding|gap)/": ["/^var\\(--/", "0", "auto"] } }
```

Documented trap: regexes match **the entire declaration value**, so `border: 1px solid #f00` and `box-shadow` shorthands slip past naive patterns. `color-no-hex` is weaker than it sounds — its own docs list `color: black`, `rgb(0,0,0)`, `rgba(...)` as *not* problems ([docs](https://stylelint.io/user-guide/rules/color-no-hex/)), so named colours and `oklch()`/`color-mix()` pass freely.

The strongest CSS-side gate is **stylelint-declaration-strict-value 1.12.1** (published 2026-08-24, peer `stylelint >=16 <=17` — healthy, not abandoned). Its defaults `ignoreVariables: true, ignoreFunctions: true` silently permit `color: rgb(255 0 0)`; invert them:

```json
{ "scale-unlimited/declaration-strict-value": [
    ["/color$/","fill","stroke","/^(margin|padding|gap|border-radius)/","font-size"],
    { "ignoreFunctions": false, "expandShorthand": true, "recurseLonghand": true,
      "ignoreValues": ["transparent","currentColor","inherit","0"] } ] }
```

**Hard limit: stylelint cannot see Tailwind classes.** `class="bg-[#ff0000]"` in JSX is not CSS; `@apply text-[#f00]` is an at-rule *prelude*, not a declaration, so declaration-value rules never fire ([get-started](https://github.com/stylelint/stylelint/blob/main/docs/user-guide/get-started.md)).

**Tailwind v4** (4.3.3, 2026-07-16): `@theme` emits `:root` custom properties and generates utilities; `--*: initial` wipes defaults so only client tokens produce utilities ([theme docs](https://tailwindcss.com/docs/theme)). That constrains the *named* scale but does nothing about `p-[13px]`. **There is no first-party arbitrary-value switch, by explicit design** — Adam Wathan, 2023-05-25: *"Nah probably not going to build that… I think this is better handled by code review/team standards"* ([discussion #11286](https://github.com/tailwindlabs/tailwindcss/discussions/11286)). `disableArbitraryValues` never shipped. In v4 the blocklist equivalent is `@source not inline("…")`, literal names only, no `*-[...]` wildcard ([docs](https://tailwindcss.com/docs/detecting-classes-in-source-files)).

The JSX gate is therefore third-party: **eslint-plugin-tailwindcss v4.4.0** (2026-08-21, peer `tailwindcss ^4.0.0` — v4 support shipped). `no-arbitrary-value` is **off in `recommended`**; turn it on, plus `no-custom-classname`. Requires `cssConfigPath` pointing at your v4 theme CSS. Blind to template literals (`` `bg-${x}` ``) and runtime class maps. Tailwind Labs ships no ESLint plugin — `prettier-plugin-tailwindcss` only sorts. Biome has `style/noHexColors` and `nursery/noUndeclaredCustomProperties` (useful for catching `var(--typo)`) but no allowed-list rule ([CSS rules](https://biomejs.dev/linter/css/rules/)).

**Uncatchable by any of this:** inline `style={{}}`, computed class strings, colours inside SVG assets. *Design implication: forbid arbitrary Tailwind values by convention in the block package and make the CI rule the backstop, not the plan.*

### Rendering under hostile themes — Storybook

Current major is **Storybook 10** (10.0 Oct 2025). Set defaults with **`initialGlobals`** (project-level `globals` was renamed) and override per story:

```ts
const preview: Preview = {
  globalTypes: { theme: { toolbar: { items: ['light','dark'], dynamicTitle: true } } },
  initialGlobals: { theme: 'light' },
};
export const OnDark: Story = { globals: { theme: 'dark' } };  // since 8.3
```

`@storybook/addon-themes` is first-party ([source](https://github.com/storybookjs/storybook/tree/next/code/addons/themes)); `withThemeFromJSXProvider` is the right fit for token-JSON — pass N generated theme objects.

**`@storybook/test-runner` is officially superseded**: *"The test runner has been superseded by the Vitest addon"* ([docs](https://storybook.js.org/docs/writing-tests/integrations/test-runner)). It survives only for Webpack/RsPack builders; the Vitest addon is Vite-only. **There is no `storybook test` CLI command** — CI runs plain `vitest --project=storybook`.

The one first-party answer to the matrix question is one Vitest project per theme, each pinning `initialGlobals`:

```ts
const proj = (theme: string) => ({ extends: true,
  plugins: [storybookTest({ configDir: '.storybook', initialGlobals: { theme } })],
  test: { name: `storybook-${theme}`,
          browser: { enabled: true, provider: playwright({}), headless: true } } });
export default defineConfig({ test: { projects: themes.map(proj) } });
```

Map that over N generated themes and every story × theme fails CI on render error, play assertion, or a11y violation. **Storybook has no "story × N themes" feature beyond this pattern** — the docs show two themes and say nothing about scaling.

**Storybook Composition is the wrong tool.** `refs` in `main.ts` aggregates *published* Storybooks for browsing; the docs warn addons don't work normally in composed Storybooks, and there is no cross-ref test collection. Keep one Storybook; multiply at the Vitest-project layer.

### Contrast and a11y gates

axe-core 4.13.0. `color-contrast` is on by default (`wcag2aa`, `wcag143`); `color-contrast-enhanced` (AAA) is **`"enabled": false`** in [its rule JSON](https://github.com/dequelabs/axe-core/blob/develop/lib/rules/color-contrast-enhanced.json).

Two limits that matter enormously for *generated* palettes:

1. **jsdom cannot do contrast** — README: *"Currently the `color-contrast` rule is known not to work with JSDOM."* The gate must run in a real browser.
2. Worse: *"This rule will not report on text elements that have a `background-image`, are obscured by other elements or are images of text."* Unresolvable cases land in **`results.incomplete`**, which the canonical `expect(violations).toEqual([])` does **not** fail on ([axe-core#4628](https://github.com/dequelabs/axe-core/issues/4628): *"axe-core currently assumes elements only have a single background color; if a single color cannot be determined, axe-core gives up"*). Gradient heroes and translucent surfaces — exactly what generated palettes produce — pass silently. Assert both:

```ts
expect(r.violations).toEqual([]);
expect(r.incomplete.filter(i => i.id.startsWith('color-contrast'))).toEqual([]);
```

Storybook's a11y addon **can** fail CI, opt-in only: accessibility tests only error in CI when `parameters.a11y.test` is `'error'` (values `'error' | 'todo' | 'off'`).

pa11y-ci 4.1.1 (2026-05-12) is maintained, but its default runner is **HTML_CodeSniffer, not axe** — `runners: ["axe"]` opts in. Lighthouse CI `@lhci/cli@0.15.1` is slow-moving (last publish 2025-06-25) and its a11y score is a coarse weighted average; assert the `color-contrast` audit id directly, not the category score.

**APCA / WCAG 3: do not gate on it.** WCAG 3.0 is a Working Draft dated 03 March 2026 — *"It is inappropriate to cite this document as other than a work in progress"* — and **does not name APCA**. `apca-w3@0.1.9` last published 2022-07-04 with npm license `"Limited W3 License"`, restricted to WCAG use and excluding medical/aerospace/military applications. WCAG 2.x 4.5:1 / 3:1 via axe is the only defensible automatable gate today.

### Visual regression — real costs and real flakiness

**Chromatic** billing is explicit: **billed snapshots = Tests × Builds × Browsers × Modes** (a11y snapshots are per-mode but not per-browser) ([billing](https://www.chromatic.com/docs/billing/)). Pricing fetched 2026-09-04: Free 5,000/mo Chrome-only; Starter $179 / 35,000, overage **$0.008**; Pro $399 / 85,000 (Pro/Free overage rates unpublished).

Do the arithmetic before committing: 60 components × 4 themes × 2 viewports = 8 modes = **480 visual snapshots per build on Chrome alone**; +480 with a11y; ×4 browsers = 2,400/build. At 300 builds/month → 144,000 → roughly **$870–1,050/mo**, plus 4× the human approval clicks since every mode carries its own baseline.

**TurboSnap fails on precisely your worst case.** A full rebuild is forced by *"Changes to dependency versions in `package.json`, if no valid lockfile is available"*, *"Changes to your Storybook's configuration"*, and *"Changes in files that are imported by your `preview.js`"* ([docs](https://www.chromatic.com/docs/turbosnap/)). A fleet-wide shared-package bump moves the lockfile and your theme decorators — the builds you most want cheap are billed at full rate.

**Playwright** is free but you own determinism. Verbatim: *"Browser rendering can vary based on the host OS, version, settings, hardware, power source (battery vs. power adapter), headless mode, and other factors. For consistent screenshots, run tests in the same environment where the baseline screenshots were generated"* — baselines are named `…-chromium-darwin.png` ([test-snapshots](https://playwright.dev/docs/test-snapshots)). Defaults: `threshold: 0.2`, `animations: "disabled"`, `caret: "hide"`; `--update-snapshots=changed` landed in 1.50. Note the Docker-pinning workaround is **community lore** — [playwright.dev/docs/docker](https://playwright.dev/docs/docker) never claims rendering consistency.

**Lost Pixel is dead — do not adopt.** Repo `archived: true`; README: *"Lost Pixel is joining Figma — We are sunsetting the product."* Last release 2024-11-14. **jest-image-snapshot** v6.5.2 has peer `Jest >=20 <=29` — no Jest 30, Vitest unmentioned. **Percy** is alive (`percy/cli` 1.32.8, 2026-09-03) with the same width × browser multiplication and an unpublished overage rate.

### The gap: nobody proves a catalog survives arbitrary tokens

**No first-party tooling exists for "M components × N generated themes."** The closest real precedent is **GitHub Primer**: [`primer/primitives/e2e/storybook.test.ts`](https://github.com/primer/primitives/blob/main/e2e/storybook.test.ts) pulls Storybook's `/index.json` and loops **14 hand-listed themes** via `iframe.html?globals=theme:X`, with a `reorderStoriesForBalancedShards()` helper — proof the combinatorics hurt. Primer also runs `a11y-contrast.yml` against a **hand-curated pair list** in `scripts/colorContrast.config.ts`. Carbon defines `allModes` for Chromatic but its a11y specs hardcode `globals: {theme: 'white'}`. **All enumerated, none fuzzed.**

Property-based theming has **zero official precedent** — fast-check's docs never mention CSS or themes. **Terrazzo** is the only DTCG toolchain with a real linter including **`a11y/min-contrast`** ([docs](https://terrazzo.app/docs/linting/)); best off-the-shelf fit, but a small single-maintainer project. There is now an official DTCG JSON Schema (`@dtcg/schemas`, `$id: https://www.designtokens.org/schemas/2025.10/format.json`) despite the draft's own editor's note — **cheapest possible gate: AJV the AI's token output before build.**

`material-color-utilities` gives a structural guarantee worth exploiting upstream of rendering: *"A difference of 40 in HCT tone guarantees a contrast ratio >= 3.0, and a difference of 50 guarantees a contrast ratio >= 4.5."* Constrain the generator on tone deltas and contrast is safe before anything renders.

For overflow, nothing first-party exists; Firefox's `intl.l10n.pseudo=accented` (+30% string length, bracket markers) is the transform worth copying. No stylelint rule requires a `var()` fallback — closest is community `csstools/stylelint-value-no-unknown-custom-properties`.

**Build it yourself in four layers:** AJV against the DTCG schema → Terrazzo `a11y/min-contrast` on declared pairs → fast-check `fc.record` emitting hostile themes (0px radii, 96px base font, near-identical fg/bg, +30% pseudo-localised copy) into a Primer-shaped Playwright loop over `?globals=` → **assert `scrollWidth > clientWidth` rather than pixel-diffing**, since screenshots are meaningless when the theme is random. Reserve Chromatic for a handful of blessed real client themes.

---

## Thread 6 — Is there something that is straightforwardly the whole solution?

**No. But one project is close enough that you should read its source before writing a line.**

### buildingopen/openpage — your architecture, already built, but tiny and stale

MIT, TypeScript, React 19 + Tailwind v4 + Zustand + Vite 7 ([repo](https://github.com/buildingopen/openpage)). Its own thesis is verbatim yours: *"an open-source website builder that uses JSON as the single source of truth ... Unlike code generators (Lovable, v0, Bolt) that produce fragile output, or visual editors (Framer, Webflow) that lock you into proprietary formats, OpenPage gives both humans and AI agents a shared, predictable interface"*, and *"Code generation is fragile: LLMs hallucinate imports, break builds, produce unmergeable diffs"* ([README](https://github.com/buildingopen/openpage/blob/master/README.md)).

Its `SiteConfig` is, field for field, the schema you described:

```json
{
  "name": "My Startup",
  "theme": { "bg0": "#09090b", "text0": "#fafafa", "accent": "#22c55e",
             "fontSans": "Inter", "fontDisplay": "Space Grotesk", "radius": 8 },
  "blocks": [
    { "id": "hero-1", "type": "hero", "variant": "centered",
      "props": { "badge": "Now in beta", "headline": "...", "primaryCta": "..." } }
  ]
}
```

19 block types / 42 layout variants (`hero`: centered, split, gradient, minimal; `features`: grid, list, alternating; `testimonials`: cards, carousel, spotlight; etc.), 10 theme presets, `POST /api/generate` takes a prompt and *"Returns a full `SiteConfig` with theme, blocks, and content"*, one-click standalone-HTML export ([README](https://github.com/buildingopen/openpage/blob/master/README.md)).

**Do not adopt it.** GitHub API, checked 2026-09-04: **48 stars, 21 forks, created 2026-02-26, last push 2026-03-07** — six months without a commit, ~9,300 LoC, single-vendor AI (Gemini), Tailwind-via-CDN export, no CMS story, no Astro. It is a demo, not a platform.

**Do steal:** the `SiteConfig` shape (it validates your instincts), the block/variant taxonomy as a starting catalog inventory, and the comparison-table argument for JSON over code.

**And note the damning bit for your fear (a):** OpenPage's entire visual identity surface is **six scalars and ten presets**. Two OpenPage sites with different content and the same preset are the same site. It demonstrates precisely that the JSON-block architecture *does not by itself* buy distinctiveness — you get patchability for free and distinctiveness not at all.

### Everything else, ruled out

| Candidate | Why not the whole solution |
|---|---|
| json-render | No token/theme layer, no variant concept, runtime-interactive focus, no patching story ([specs docs](https://json-render.dev/docs/specs)) |
| A2UI | Agent-chat UI protocol, no art direction, no static-site build ([a2ui.org](https://a2ui.org)) |
| Relume | Deliberately unstyled output; styling handed to a human in Webflow/Figma ([docs](https://www.relume.ai/resources/docs/how-to-create-and-edit-wireframes-in-the-relume-site-builder)) |
| open-design | 5 fixed directions + `DESIGN.md`; a design-spec format, not a site generator ([opendesigner.io](https://opendesigner.io/)) |
| v0 / Lovable / Bolt | Emit code; not fleet-patchable ([v0.app/docs](https://v0.app/docs/)) |
| Wix ADI | Discontinued 2024-11-10 ([support.wix.com](https://support.wix.com/en/article/adi-sites-no-longer-supported)) |

---

## Adopt / Steal / Avoid

| Verdict | Thing | Why | Concrete handle |
|---|---|---|---|
| **Adopt** | DTCG Design Tokens Format Module **2025.10** | First stable version; declared stable by the CG; official JSON Schema exists | [designtokens.org/TR/2025.10/format/](https://www.designtokens.org/TR/2025.10/format/); `@dtcg/schemas`, `$id: .../schemas/2025.10/format.json`. **Pin 2025.10** — the drafts doc says "Do not attempt to implement this version" |
| **Adopt** | `utopia-core` | Six numbers → a whole fluid type identity, with `wcagViolation` flags per step | `calculateTypeScale()`, `calculateSpaceScale()` ([repo](https://github.com/trys/utopia-core#readme)) |
| **Adopt** | `material-color-utilities` for the contrast *guarantee*, not the aesthetics | "A difference of 40 in HCT tone guarantees contrast >= 3.0, 50 guarantees >= 4.5" — enforce upstream of rendering | `Hct`, `TonalPalette`, `ContrastCurve`, `ToneDeltaPair` ([repo](https://github.com/material-foundation/material-color-utilities)) |
| **Adopt** | `@adobe/leonardo-contrast-colors` where you need ratio-first solving | Declare required ratios; it solves for colour. `lightness`/`contrast`/`saturation` are continuous art-direction knobs | `Theme({colors, backgroundColor, lightness, contrast, saturation})` ([repo](https://github.com/adobe/leonardo/tree/main/packages/contrast-colors)) |
| **Adopt** | Tailwind v4 `@theme` + `--*: initial` as the per-site sink | Shared block package stays byte-identical; each site's utility vocabulary is generated from its token JSON | [tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme) |
| **Adopt** | Verbalized Sampling in the art-direction prompt | 1.6–2.1x measured diversity gain, training-free, orthogonal to temperature | [arXiv:2510.01171](https://arxiv.org/abs/2510.01171), [CHATS-lab/verbalized-sampling](https://github.com/CHATS-lab/verbalized-sampling) |
| **Adopt** | AJV over the token JSON before build | Cheapest possible gate; schema already published | `@dtcg/schemas` |
| **Steal** | WP's `is-style-{slug}` + `styles/*.json` two-layer model | The only variant model that survives a fleet-wide re-theme | [Section Styles](https://make.wordpress.org/core/2024/06/24/section-styles/); [TT5 `styles/sections/`](https://github.com/WordPress/twentytwentyfive/blob/trunk/styles/sections/section-1.json) |
| **Steal** | WP token naming + indirection (`var:preset|color|accent-5` → `--wp--preset--color--accent-5`) | Variant styles never contain a literal colour; that is what makes patching safe | [Global Settings & Styles](https://developer.wordpress.org/block-editor/how-to-guides/themes/global-settings-and-styles/) |
| **Steal** | Shopify Dawn's per-section `color_scheme` class | Scoped token sets give within-page rhythm with zero new components | [featured-collection.liquid](https://github.com/Shopify/dawn/blob/main/sections/featured-collection.liquid) |
| **Steal** | Shopify JSON-template envelope: `{sections: {id: {...}}, order: []}` | Production-proven at enormous scale; id-map + order array beats a bare array for patchability | [JSON templates](https://shopify.dev/docs/storefronts/themes/architecture/templates/json-templates) |
| **Steal** | Puck's `ai` config object — `instructions`, `exclude`, `required`, `bind` — and its JSON-Schema-subset field spec incl. `enum` | Best published pattern for constraining an LLM against a component registry | [AI configuration](https://puckeditor.com/docs/ai/ai-configuration), [field AI config](https://puckeditor.com/docs/api-reference/ai/configuration/fields) |
| **Steal** | json-render's catalog/spec/registry split + `catalog.prompt()` | Catalog *is* the prompt, so they cannot drift | [catalog docs](https://json-render.dev/docs/catalog) |
| **Steal** | Gutenberg's `parent` / `ancestor` / `allowedBlocks` and Builder's `childRequirements` sift queries | The two most expressive published composition grammars | [Block Registration](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-registration/), [registerComponent options](https://www.builder.io/c/docs/register-components-options) |
| **Steal** | Radix's documented 12-step scale semantics | A contract an LLM can target without colour science | [Understanding the scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) |
| **Steal** | `open-design`'s `DESIGN.md` **`anti-patterns` section** | Anti-patterns as a first-class part of the design spec, not prompt prose | [opendesigner.io](https://opendesigner.io/), [nexu-io/open-design](https://github.com/nexu-io/open-design) |
| **Steal** | Primer's `e2e/storybook.test.ts` theme loop over `iframe.html?globals=theme:X` | Closest real precedent for M components × N themes in CI | [source](https://github.com/primer/primitives/blob/main/e2e/storybook.test.ts) |
| **Steal** | Anthropic `frontend-design` slop tells, as validator rules | Machine-checkable: ΔE from `#F4F1EA`/`#D97757`, uniform radius across blocks, eyebrow-on-every-heading, `→` in CTA copy, identical entrance animation on every section | `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/frontend-design/skills/frontend-design/SKILL.md` |
| **Avoid** | TeleportHQ UIDL | DOM-level IR (`elementType`, `attrs`, `style`) — an LLM emitting it is writing HTML in JSON, your prohibited failure mode | [uidl.ts](https://github.com/teleporthq/teleport-code-generators/blob/development/packages/teleport-types/src/uidl.ts) |
| **Avoid** | Storyblok/Shopify **presets** as your variant mechanism | Variant identity dissolves into props on insert; re-theming becomes content rewriting | [Storyblok Presets](https://www.storyblok.com/docs/api/management/presets.md) |
| **Avoid** | Gutenberg-style unpersisted block *variations* | WP itself has to reconstruct identity with `isActive` heuristics. Persist the slug | [Block Variations](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-variations/) |
| **Avoid** | Adopting OpenPage as a platform | 48 stars, no commit since 2026-03-07, Gemini-only, Tailwind-via-CDN export | [repo](https://github.com/buildingopen/openpage) |
| **Avoid** | Lost Pixel | Archived; "joining Figma — we are sunsetting the product" | repo `archived: true` |
| **Avoid** | APCA / WCAG 3 as a CI gate | WCAG 3.0 WD 2026-03-03 says "inappropriate to cite… as other than a work in progress" and never names APCA; `apca-w3` unpublished since 2022 under a restricted W3 licence | — |
| **Avoid** | Chromatic across the full theme matrix | Billed = Tests × Builds × Browsers × Modes; TurboSnap force-rebuilds on exactly the shared-package bump you care about | [billing](https://www.chromatic.com/docs/billing/), [turbosnap](https://www.chromatic.com/docs/turbosnap/) |
| **Avoid** | Seeding art direction from client imagery via MCU `Score` without correction | Hard-coded Google-Blue fallback, `CUTOFF_CHROMA = 5.0`, strips uncommon hues — regression to the mean by construction | [score.ts](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/score/score.ts) |
| **Evaluate, don't assume** | Puck `generate()` in assembly mode | It is your emission layer, already shipped — but routes through Puck Cloud, likely disqualifying given own-credits requirement | [headless generation](https://puckeditor.com/docs/ai/headless-generation) |

---

## Remaining gaps we must build ourselves

Ranked by how much of the project's risk they carry.

**1. Automatic variant selection (no prior art anywhere).** Every surveyed system has a human pick the variant. Puck AI picks *components*; Relume picks *sections* from a section prompt but ships them unstyled. You need brief → block sequence → variant per block, and it is the main lever on failure mode (a). Relume's two-stage pattern (brief → sitemap with per-section intent strings → selection) is the only production-validated shape to start from ([Relume docs](https://www.relume.ai/resources/docs/how-to-create-and-edit-wireframes-in-the-relume-site-builder)).

**2. A composition grammar with sequence, cardinality and adjacency rules.** No system expresses "exactly one Hero, first", "no two Testimonials adjacent", "a Pricing block requires a preceding Features block", or "alternate media side across consecutive split blocks". Every published constraint mechanism is a flat allowlist. This is probably your single strongest structural defence against template-sameness and it has zero prior art to copy.

**3. A fleet-wide art-direction registry that forces divergence.** Nothing found keeps a record of already-used design combinations. Build the MAP-Elites *idea* without the algorithm: define a behaviour space of art-direction descriptors (hue family × contrast regime × type-classification pairing × density × radius regime × section-rhythm signature), quantise into cells, store which cells the fleet occupies, and refuse or re-roll an occupied cell for a new client. It is a table and a constraint, not an evolutionary search ([MAP-Elites, arXiv:1504.04909](https://arxiv.org/abs/1504.04909)).

**4. Machine-checkable anti-slop rules.** The `frontend-design` tells are specific enough to test: perceptual distance from `#F4F1EA` and `#D97757`; "is every block using the same border-radius"; "does every section have an ALL-CAPS eyebrow"; "does CTA copy contain `→`"; "is the same fade-and-slide-up on every section". These must live in the validator, because prompts drift and validators don't. **No off-the-shelf tool does any of this.**

**5. Typeface pairing.** No generator exists in any surveyed source — MCU has no type module, Open Props ships fixed stacks, Utopia is scale-only. You need a curated pairing set with metadata (classification, x-height, width, mood, licence, self-hostable subset) and selection rules. This is hand-designed work that then becomes machine-selectable, and it is a bigger differentiator than colour.

**6. Diversity measurement.** You cannot manage failure mode (a) without measuring it. The "Generation Diversity (GD)" metric in the LLM-UI literature ([arXiv:2412.20071](https://arxiv.org/html/2412.20071v3)) is **unverified** — check its definition before inventing your own. Minimum viable: pairwise distance across the fleet in your behaviour-space coordinates, plus perceptual-hash distance on rendered hero screenshots, tracked over time.

**7. Property-based theme fuzzing in CI.** No first-party tooling; Primer enumerates 14 themes, nobody fuzzes. Build: AJV on the token JSON → Terrazzo `a11y/min-contrast` on declared pairs ([Terrazzo](https://terrazzo.app/docs/linting/)) → fast-check `fc.record` emitting hostile themes (0px radii, 96px base font, near-identical fg/bg, +30% pseudo-localised copy à la Firefox `intl.l10n.pseudo=accented`) → Playwright loop over `iframe.html?globals=` asserting **`scrollWidth > clientWidth`** rather than pixel-diffing. Assert `results.incomplete` alongside `results.violations` or gradient heroes pass silently ([axe-core#4628](https://github.com/dequelabs/axe-core/issues/4628)).

**8. The fleet-patching contract itself.** json-render's docs *"[don't] explicitly detail versioning or patching strategies for specs"* ([specs docs](https://json-render.dev/docs/specs)); OpenPage has none; Puck has none. The nearest published model is WP's four filterable `theme.json` layers (`_default`, `_blocks`, `_theme`, `_user`, each mutable via `update_with()`) ([Global Styles filters](https://developer.wordpress.org/block-editor/how-to-guides/themes/global-styles/)). You need: a page-model schema version on every bundle, a migration runner in the shared package, and a rebuild-all with visual diff against blessed baselines only.

### Explicit uncertainties in this document

- **Framer**: no first-party JSON page model found; the expected docs path 404s. Unsupported by evidence, not disproven.
- **Wix ADI**: the "billions of combinations" figure appears only in secondary reviews. No Wix engineering post describing the combinatorial engine was located. The *discontinuation* is first-party and verified.
- **Radix Colors**: the custom-palette generator's algorithm is not publicly documented.
- **Material Design 3 prose docs**: `m3.material.io` is client-rendered and unfetchable; all M3 claims here come from source.
- **Builder.io "AI emits data"**: inferred from the Visual Editor AI composing registered components into the editor's storage format; never stated literally.
- **Storyblok preset persistence**: inferred from the preset object shape, unconfirmed in first-party docs.
- **Lovable / Bolt output contracts**: authoritative first-party docs not reached. Certain in kind (code generators), uncertain in detail.
- **Chromatic Free/Pro and Percy overage rates**: unpublished. Only Chromatic's Starter rate ($0.008) is on the pricing page.
- **"Generation Diversity" metric**: definition not verified.
- **No primary maintainer statement anywhere** addresses "does token generation cause sameness". The [design.google](https://design.google/library/staying-true-to-your-identity-material-branding) quote is the closest first-party signal and it predates Material You.
