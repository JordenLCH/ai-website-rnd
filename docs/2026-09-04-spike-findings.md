# Spike findings — block catalog × swappable themes (throwaway code)

Code: `spike/` (Vite + React, `npm run dev` → http://localhost:5183). **Throwaway.** Not the foundation.

## Question
Does the WordPress-style two-layer split (variant = opaque slug on the block instance, resolved by swappable theme JSON) produce two genuinely unrelated-looking sites from one component catalog?

## Answer: yes.

Built: 4 blocks (Hero, Features, Stats, CTA), 2 layouts each, 2 themes, 2 specs written from the real Aonic / Merryfair briefs.

Verified in-browser:
- Aonic (dark overlay hero, Space Grotesk 700, orange accent strip, hairline grid, 2px radius) vs Merryfair (light editorial split hero, Fraunces 300, alternating rows, 18px radius, green band) read as unrelated sites.
- **Theme swap works**: same `aonic` content JSON rendered under `merryfair` theme changes hero *layout*, tone, type and shape — zero component edits, zero content edits.
- Validator catches all four failure classes: missing required props, unknown block type, cardinality violation (`items` min 2), variant not defined by theme.
- Token discipline holds: 0 hex/px literals in block components; 0 hex in `.site` CSS rules.

## What actually created the difference
39 tokens per theme. Colour did **least** of the work. Ranked by visible impact:
1. Layout selection per section (`overlay-fullbleed` vs `split-editorial`)
2. Tone assignment per section (which sections go inverse/accent)
3. Font pairing + display weight (700 vs 300)
4. Vertical rhythm (`--pad-y` 104px vs 156px) and radius (2px vs 18px)
5. Colour roles

Confirms research thread 4: tokens alone would not have been enough.

## Design consequences (carry into the real build)
- **Layout CSS belongs to the component**, not the theme. Theme *selects* from an enumerated list the component publishes; validator rejects a theme naming a layout the component doesn't implement (proved).
- **Tone must be a per-section scoped token set** (Shopify Dawn's `color_scheme`), not a global mode. Buttons need `--btn-bg`/`--btn-fg` per tone or they vanish on accent backgrounds.
- Container queries, not media queries — sections must survive being rendered at arbitrary widths (editor panes, previews).
- Same variant slugs across clients (`hero/main`, `stats/main`) is what makes re-theming total. Keep slugs semantic, never descriptive of appearance.

## Not tested
Real responsive breakpoints, a11y/contrast gates, Astro static build, AI generation of the specs, multi-page, images pipeline, fleet package bump.

---

# Round 2 — 16 blocks, 40 layouts, Merryfair 5-page site

Catalog grounded in real theme inventories rather than invented: [TT5 patterns](https://github.com/WordPress/twentytwentyfive/tree/trunk/patterns) and [Shopify Dawn sections](https://github.com/Shopify/dawn/tree/main/sections). The converged vocabulary across both is what the 16 blocks cover.

**Catalog (16):** Nav, Hero, MediaText, Gallery, SpecTable, Features, Stats, Testimonials, LogoWall, FAQ, Timeline, Locations, ContactForm, RichText, CTA, Footer — 40 layouts total.

**Site:** Merryfair, 5 pages (Home, Products, Technology, About, Contact), 43 block instances, all content from the real brief. Validator reports `✓ valid`.

**28 semantic variant slugs**, defined by *both* themes. Switching the theme dropdown re-resolves every slug across all 5 pages: layout, tone, type, rhythm and shape all change. Content JSON untouched.

## New findings

1. **Slug granularity is the design decision that matters.** One slug per block type is too coarse for a 5-page site — `hero/home`, `hero/page` and `hero/statement` must resolve differently. Slugs are *editorial roles*, not block types. Expect ~2 slugs per block type.
2. **Per-section `vars` overrides are the creative-freedom escape hatch.** `hero/statement` overrides `--display-size` and `--pad-y` in the theme only. AI can bend one section without touching code and without breaking fleet patching.
3. **Bug worth remembering:** a block whose direct child resets `margin: 0` (list resets) silently defeats the `.block > * { margin-inline: auto }` centering. Found in Timeline. In the real build this is a lint rule, not a fix.
4. **Tone assignment carries more identity than colour values.** Aonic-theming the Merryfair pages reads as a different company mostly because different sections go inverse/accent.

---

# Round 3 — harvest, compose, art-direct

## Harvested from shadcnstudio (MIT, Astro variants)

Cloned `zolt` (portfolio), `bistro` (restaurant), `ink` (publication), `track` (SaaS changelog) and extracted what each page actually stacks:

| Template | Sections it ships |
|---|---|
| zolt | Hero, About, Experience, FeaturedWorks, Services, HireMe (pricing), SelectService (stepper), Testimonials, ContactHero |
| bistro | Hero, AboutUs, PopularDishes, NewItems, Offers, Testimonials, ContactUs |
| ink | Hero, Blog list, RelatedPosts, CTA, ContactUs, Breadcrumb, TOC |
| track | Hero, ChangelogTimeline, FAQ, CTA, CopyCode |

Their **layouts are conventional** (`grid-cols-3`, `aspect-video`, `rounded-lg` — no novel structures). The value is the **section inventory**, so each unseen section became one block: **Pricing, CatalogGrid, Steps, Team, Promo, PostList, Breadcrumb**. Catalog now **23 blocks / 57 layouts**.

Deliberately left unused in the specs: **Team** and **PostList** — populating them for a real company means inventing employees or news items. They exist in the catalog for clients who supply that content.

## Compose pass
Merryfair grew 43 → 51 blocks: promo strip and process steps on Home, breadcrumbs on all subpages, CatalogGrid replacing the product Gallery, service-plan Pricing (no invented prices — "Included / Quoted / Per unit"), a second Steps on Contact.

## Art-direct pass — third theme, `merryfair-industrial`
Generated four directions and took the **off-mode** one (Verbalized Sampling), rejecting the warm-minimal-serif default as the AI-slop mode:
Swiss industrial catalogue — Archivo 800 at `-0.045em`, Barlow Condensed caps eyebrows and numerals, bone `#E7E4DB` / ink `#15160F`, **zero radius, zero shadow**, hairline rules, green used once per page as a marker rather than a mood.

Same content, same components, third distinct identity. Verdict: **art-direct alone (no code) is enough to re-skin a whole site convincingly.**

## The important new finding: layout choice depends on asset type

The industrial theme mapped `hero/home` → `overlay-fullbleed` while Merryfair's hero was a **product cutout on a plain background**. Result: unreadable, washed-out hero. Tokens can't fix that — it's a mismatch between a layout's requirement and what the photo *is*.

Fix now in the spike, and required in the real build:
- Blocks declare asset semantics — `imageKind: 'environment' | 'cutout' | 'detail'`.
- `CatalogEntry` gained an optional `check(props, layout)` — a **cross-check between content and the layout the theme chose**, beyond schema validation.
- Hero refuses `overlay-fullbleed` unless `imageKind === 'environment'`.

This is a third validation axis nobody in the prior art has: not "are the props valid", not "does the component support this layout", but **"does this content suit this layout"**. Expect one such rule per layout family (overlays need environments, mosaics need ≥5 images, wide-list needs landscape, quote-row needs short quotes).

---

# Round 4 — free composition, motion, standardised chrome

## What changed

The whole Merryfair site (5 pages, 33 sections) is now **one block type**: `FreeSection`. No fixed section components — each section is a **grid recipe plus a tree of 14 primitives**, all still JSON.

- **Primitives (14):** Stack, Row, Grid, Card, Heading, Text, Eyebrow, Quote, Button, Image, Stat, List, Divider, Spacer.
- **No raw values anywhere** — `gap:"lg"` → `var(--sp-lg)`, `size:"display"` → `var(--display-size)`. All three themes still re-skin freely-composed sections.
- **Header and footer are site-level `chrome`**, declared once in `site.chrome`, rendered around every page. Pages contain only their own content. Header is sticky with `backdrop-filter: blur(10px)`.
- **Motion is declared in the JSON** (`motion: {type, delay}`, `parallax: 0..1`) and executed by a 60-line engine: IntersectionObserver for reveals, rAF for parallax, disabled under `prefers-reduced-motion`. No animation library.

Motion register matched to Emit Solar Mobile v3 (read from the local standalone HTML): `translateY(14px)` + opacity, 0.12–0.26s transitions, `backdrop-filter: blur(8–10px)`. Restrained, not showy.

## House rules — what stops free composition becoming slop

`FreeSection.check()` rejects a section that breaks any of:
- nesting depth > 5
- a `hero` without exactly one level-1 Heading; any level-1 outside a hero
- more than one `display`-size element in a section
- more than 8 animated nodes in a section
- a Text node over 420 characters
- a background overlay over a non-`environment` image

## Three bugs worth carrying into the real build

1. **`clip-path` defeats its own reveal.** `clip-path: inset(0 0 100% 0)` shrinks the element's box for IntersectionObserver, so intersectionRatio is永远 0 and the reveal never fires. Leave a sliver (`88%`) or observe a parent.
2. **Unscoped `[data-tone]` collided with the section's own tone**, painting accent-green text on an accent-green band. Primitive attributes must be namespaced (`data-ptone`).
3. **A sticky element inside a section sticks for zero pixels** — its containing block is that section. The *section wrapper* has to be sticky (`.site > .section:has([data-role="nav"])`).

## Verdict

Free composition works and is still fully data — themeable, validatable, patchable. But it is **strictly more expensive to author and to review** than picking a variant, and every section is now bespoke. Recommendation stands: fixed blocks for ~85% of sections, `FreeSection` reserved for signature moments.
