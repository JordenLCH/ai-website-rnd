# How professionals actually choose a colour scheme

Research, 2026-09-10. Companion to `docs/2026-09-10-why-themes-come-out-warm.md` (why our output
drifts warm) and `skills/create-webpage/references/palette.md` (the procedure we shipped this
morning). This file does not repeat either: it goes to the design systems that publish their colour
*method* and reports what they actually document, with numbers, so the shipped procedure can be
judged against something other than taste.

**How to read the labels.** Every claim is tagged:

- **[doc]** — the system documents this, quoted or paraphrased from its own page/source.
- **[practice]** — widely done, visible in shipped token values, but nobody writes down the reason.
- **[inference]** — mine, computed or reasoned from the [doc] material. Arguable.
- **[gap]** — I could not verify it from a primary source. Named rather than filled.

All hex/contrast/chroma numbers in the tables below I computed from the systems' published token
values (sRGB → OKLCh, WCAG 2.x relative luminance). Sources at the bottom.

---

## 1. The process

No system publishes "the ordered steps." Two publish enough of the machinery that the order is
unambiguous, and they order it the same way.

### Material 3 — the only fully mechanised process **[doc]**

M3 documents a six-step pipeline, and it is worth noting that colour selection happens *once*, at
step 1; everything after it is derivation.

> "1. It starts with a source color … 2. Feed the source color into an algorithm … 3. The algorithm
> generates key colors … 4. The algorithm creates tonal palettes … 5. The algorithm assigns tones to
> color roles … 6. The new colors are applied to the UI"
> — https://m3.material.io/styles/color/system/how-the-system-works

The five key colours are `Primary, Secondary, Tertiary, Neutral, Neutral variant` — i.e. **the
neutrals are derived from the brand colour, not chosen next to it.** Tonal palettes run "a number
from 0 to 100 in increments of 10, as well as 95, 98, and 99." Tone is the accessibility instrument:

> "Because tone can describe the lightness or darkness of a color, it's used to define accessible
> color relationships." (same page)

And the ground is *not* decided by a designer at all — it is `tone 98` of the neutral palette in
light and `tone 6` in dark
(`color_spec_2021.ts`, `surface()`: `tone: (s) => s.isDark ? 6 : 98`).

### Adobe Spectrum — contrast-first, background-first **[doc]**

> "Each color theme uses gray-100 as the default background color (except when using background
> layers). … Spectrum generates all other gray color values by target contrast ratios with the
> background color value."
> — https://spectrum.adobe.com/page/color-system/

So the order is: **pick the background → every other neutral is generated against it by target
contrast ratio.** Leonardo, Adobe's open-source tool, exists to do exactly that, and states the
motive:

> conform to WCAG minimum contrast standards "by using contrast ratio as the starting point, rather
> than a post-color-selection auditing process"
> — https://github.com/adobe/leonardo (README)

### USWDS — start achromatic **[doc]**

> "Start in black and white. Start with your core message and use type scale and hierarchy to test
> and refine its effectiveness. Then, introduce color to support that message."
> "Put the practical before the emotional. … Limit the complexity of color by concentrating on
> functional requirements (like status states or directions) first. Then, use color as progressive
> enhancement…"
> — https://designsystem.digital.gov/design-tokens/color/overview/

### Where the ground gets decided, and against what

Synthesising the three **[inference]**, the professional order is:

1. **Brand anchor** — one source colour (M3: literally one; Spectrum: the theme's accent).
2. **Ground** — chosen *before* the rest of the neutrals, because everything else is generated
   against it (Spectrum [doc]; M3 [doc] via `highestSurface` being the background argument of every
   contrast curve).
3. **Neutral ramp** derived from the ground by target contrast, not picked.
4. **Semantic roles** bound to ramp steps (all systems).
5. **Contrast verification** — which in M3/Spectrum/Leonardo is not a verification step at all: the
   values were *generated* from the contrast targets, so it cannot fail.
6. **Dark mode derived**, from the same roles with different tones — never by inverting hexes
   ("these colors aren't necessarily inversions of their light counterparts", Apple HIG,
   https://developer.apple.com/design/human-interface-guidelines/dark-mode).

The thing our pipeline does — choose eleven final hex values and then check the ratios — is the
workflow all three of these systems were explicitly built to replace. **[inference]**

---

## 2. Roles vs values: what each step of a ramp is for

Every mature system separates *the colour* (a value on a ramp) from *what the colour is for* (a
semantic token). Carbon states the separation in four terms:

> "*Theme*: A theme is a collection of colors designed to create a specific aesthetic. … *Token*: A
> token is the role-based identifier that assigns a color. Unlike hex codes, tokens apply universally
> across themes. … *Role*: A role is the systematic usage of a color assigned to a token. Roles
> cannot be changed between themes. … *Value*: A value is the unique visual attribute (hex code, rgba
> value) assigned to a token through the use of themes."
> — https://carbondesignsystem.com/elements/color/overview/

Four documented ramp conventions, side by side:

| System | Steps | Backgrounds | Borders | Text | Solid/accent fill |
|---|---|---|---|---|---|
| **Radix** | 12 (1–12) | 1 app bg, 2 subtle bg, 3 component, 4 hover, 5 active/selected | 6 subtle/non-interactive, 7 interactive + focus ring, 8 hovered/stronger | 11 low-contrast, 12 high-contrast | 9 solid, 10 solid hover |
| **Primer** | 14 (0–13) | "first six steps" | "Steps 7 and 8" | "Steps 9 and 10" | semantic `-emphasis` tokens |
| **Carbon** | 12 grades (Black, White, 10–100) | White/Gray 10 light; Gray 90/100 dark | `$border-subtle` etc. | Gray 100–60 light, White–Gray 50 dark | Blue 60 primary action |
| **USWDS** | 10 grades (5–90; 0 = white, 100 = black) | low grades | — | ≥50 magic-number apart | — |
| **M3** | tone 0–100 (+95/98/99) | surface 98 / surface-container-* 100→90 | outline 50, outline-variant 80 | on-surface 10, on-surface-variant 30 | primary 40 (light) / 80 (dark) |

Radix's step definitions **[doc]**, verbatim, are the most explicit statement of intent published by
anyone (https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale):

> "1 App background · 2 Subtle background · 3 UI element background · 4 Hovered UI element
> background · 5 Active / Selected UI element background · 6 Subtle borders and separators · 7 UI
> element border and focus rings · 8 Hovered UI element border · 9 Solid backgrounds · 10 Hovered
> solid backgrounds · 11 Low-contrast text · 12 High-contrast text"

and its contrast guarantee is stated in APCA, not WCAG:

> "Steps 11 and 12—which are designed for text—are guaranteed to Lc 60 and Lc 90 APCA contrast ratio
> on top of a step 2 background from the same scale."

Two things fall out that matter for a system like ours with **eleven flat tokens and no ramp**:

- **The interaction states are ramp steps, not opacity tricks.** Carbon: hover values are "half
  steps" between adjacent palette grades; active is "two full steps"; selected is "one full step"
  (Carbon overview, Interaction states). Radix reserves 4, 5, 10 for the same purpose. **[doc]**
- **Borders are a documented band of the ramp**, one to two steps below text. Primer: "Step 8 is
  considered the minimum contrast value for interactive control borders against bgColor-muted."
  **[doc]** Our `--color-line` = ink at 0.12–0.16 alpha lands near Radix 6–7 by eye; I did not verify
  the equivalence numerically. **[gap]**

USWDS's "magic number" is the cheapest ramp discipline anyone has published, and is directly
implementable **[doc]**:

> "A magic number of 40+ results in WCAG 2.0 AA Large Text contrast … 50+ results in WCAG 2.0 AA
> contrast … 70+ results in WCAG 2.0 AAA contrast. Colors of grade 50 result in Section 508 AA
> contrast against both pure white (grade 0) and pure black (grade 100)."
> — https://designsystem.digital.gov/design-tokens/color/overview/

with a published luminance range per grade (grade 50 = relative luminance 0.175–0.183, etc.). That
is a *lookup table replacing a contrast calculation*, which is exactly the shape of thing a
generation prompt can follow reliably.

---

## 3. White vs grey vs black grounds — the documented criteria

This is the section where I expected the most and found the most *specific* material, all of it from
product-UI systems. Read the caveat at the end of the section before applying any of it to a
marketing page.

### 3a. The layering argument — the strongest documented reason, and it favours grey

**Spectrum is explicit that the app frame ground is a mid-light grey and content sits on lighter
layers above it.** **[doc]** From https://spectrum.adobe.com/page/using-color/:

| Background layer | Light theme | Dark and darkest themes |
|---|---|---|
| Background base | gray-200 | gray-50 |
| Background layer 1 | gray-100 | gray-75 |
| Background layer 2 | gray-50 | gray-100 |

In Spectrum's light theme those resolve to `gray-200 #e6e6e6`, `gray-100 #f8f8f8`, `gray-50 #ffffff`
(https://spectrum.adobe.com/page/color-palette/). So in light mode the layers go **darker at the
back, white at the front**; in dark mode the ordering inverts. The rationale is stated:

> "Background layer colors create dimension, hierarchy, and separation between content. Use these in
> large regions of layout — not for component backgrounds."
> "Background base should only be used as empty space surrounding content or regions in professional
> editing applications. Placing components, icons, or text content directly on background base may
> not provide sufficient contrast in light theme."
> "Background layer colors are alias tokens … They reference different gray color tokens per theme,
> creating dimensionality that persists across themes."

**Carbon does the same thing and names it the layering model** **[doc]**
(https://carbondesignsystem.com/elements/color/overview/):

> "Colors in the neutral gray palette are layered on top of each other to create depth and spatial
> associations."
> "In the light themes, layers alternate between White and Gray 10 with each added layer."
> "In the dark themes, layers become one step lighter with each added layer."

and Carbon ships **both** light grounds as first-class themes named after them: "There are two
default *light* themes and two default *dark* themes. … they actually get their names from their
background color", with `$background` = `#ffffff` (White theme) or `#f4f4f4` (Gray 10 theme). Which
one you take determines what a card is: on the White theme the first layer is Gray 10; on the Gray 10
theme the first layer is White. Carbon adds a do/don't: **"Avoid use of midtones"** (a Gray 10
dropdown on a Gray 20 background is the "don't").

**M3's light ground is not white either** **[doc]**: `surface` is neutral **tone 98**, while
`surfaceContainerLowest` is **tone 100** — the page ground is one notch below white and the
lowest-emphasis container is white
(`color_spec_2021.ts`: `surface` `tone: isDark ? 6 : 98`; `surfaceContainerLowest`
`isDark ? 4..0 : 100`).

**So the answer to "does a white ground force shadows?" is documented, and it is: a white ground
removes the cheapest elevation instrument, and the systems that need elevation choose grey.**
**[inference, from three [doc] sources]** Atlassian states the corresponding rule for the dark case
directly (https://atlassian.design/foundations/elevation):

> "Shadows can be harder to see in dark mode, so dark mode elevations also rely on different surface
> colors. Imagine that the surfaces are distantly lit from the front — the higher the elevation, the
> lighter the surface looks."

and Apple documents the same mechanism as a shipped system behaviour **[doc]**
(https://developer.apple.com/design/human-interface-guidelines/dark-mode):

> "In Dark Mode, the system uses two sets of background colors — called base and elevated — to
> enhance the perception of depth when one dark interface is layered above another. The base colors
> are dimmer, making background interfaces appear to recede, and the elevated colors are brighter,
> making foreground interfaces appear to advance."

Atlassian also documents the anti-pattern that a grey ground invites, which is worth carrying into
our tone rhythm **[doc]**:

> "Raised elevations can create visual noise, so don't use to group content when a border or white
> space would suffice."

### 3b. The white-ground camp, and what they actually say

**GOV.UK** ships `body-background #ffffff` with `template-background #f4f8fb` (a faint blue-tinted
grey behind the `<html>` element) and `text #0b0c0c`
(https://design-system.service.gov.uk/styles/colour/). The colour page gives **no aesthetic
rationale at all** — the only stated rule is:

> "You must make sure that the contrast ratio of text and interactive elements in your service meets
> Web Content Accessibility Guidelines (WCAG 2.2) success criterion 1.4.3 Contrast (minimum) level
> AA."
> "Do not copy the specific hexadecimal (hex) colour values."

That is the whole documented method: use the functional token, meet AA. **[doc]** Why white and not
grey is **[gap]** — GOV.UK does not say.

**Primer** does not publish a rationale for the page ground either; what it publishes is the ramp
allocation **[doc]** (https://primer.style/product/getting-started/foundations/color-usage/):

> "The first six steps of the neutral scales are typically used for background colors. The two most
> commonly used background colors are bgColor-default and bgColor-muted. **All contrast values for
> text and borders are calculated against bgColor-muted to ensure proper contrast ratios for both
> muted and default.**"

That last sentence is a genuinely transferable rule: **verify contrast against your *second*
background, not your lightest one.** A palette verified only against `#ffffff` is unverified for
every card, band and inset on the page. **[doc]**

Primer also documents that dark mode is not an inversion of values but an inversion of the *scale
direction*, so roles survive: "The light and dark scale directions are inverted, with the light scale
starting with white and the dark scale starting with black. By inverting the scales, light and dark
themes are able to share many of the same functional color tokens without custom overrides."

### 3c. Dark grounds: what is actually established

The strongest primary result here is not a design system, it is the psychology literature, and it
says something more precise than "dark mode is harder to read."

Buchner, Mayr & Brandt (2009), *Ergonomics* 52(7), 882–886, "The advantage of positive
text-background polarity is due to high display luminance" — abstract, verbatim **[doc]**:

> "No positive polarity advantage was observed when overall display luminance of positive and
> negative polarity displays was equivalent. There was only an effect of display luminance, with
> better performance for the higher-luminance displays. This suggests that the positive polarity
> advantage is in fact due to the typically higher luminance of positive polarity displays. …
> Display polarity per se does not affect readability."

So: **dark-on-light wins for reading, but the cause is total display luminance, not polarity.**
**[doc]** The practical reading **[inference]**: a dark site is a readability cost that scales with
how much continuous prose it asks for, and it is *not* fixed by raising text contrast — it is a
property of the page's overall luminance. A dark ground is defensible for a page that is mostly
photography, video or short blocks; it is a real cost on a long article or a spec sheet.

Carbon's own justification for offering dark mode is preference and accommodation, not readability
**[doc]** (https://carbondesignsystem.com/elements/color/usage/):

> "While some research shows that unimpaired sighted user preform better in light mode, it also shows
> that dark mode is better for people with cataract and related disorders."

USWDS states one more claim I could not trace to a primary study **[doc, unsourced by them]**:

> "The best combination is the maximum color contrast of white or light text on black or dark
> background because it seems to visually work well for all."

which directly contradicts the Buchner result. USWDS gives no citation for it. **[gap]** I would not
build on that sentence.

**OLED power arguments: [gap].** I found no design-system documentation asserting an OLED battery
rationale for a dark theme. Apple documents dark mode as an appearance the system manages, not an
energy feature. Do not repeat the OLED argument as if a system endorsed it.

**Ambient light: partially [doc].** Spectrum documents *chromatic adaptation* as the reason its greys
are neutral (see §4), and offers dark theme in light device mode "for experiences that are optimal
with a darker interface regardless of the device mode, such as photo and video editing"
(https://spectrum.adobe.com/page/color-fundamentals/). That is the closest thing to a documented
"photography-led interfaces go dark" rule I found, and it is about *editing* imagery, not displaying
it. **[doc]**

### 3d. What none of this covers — read this before using §3

Every source above is a **product-UI** system: apps with panels, cards, tables, elevation and
interaction states. **No system in this study documents a criterion for the ground colour of a
marketing page.** **[gap]** The layering argument (§3a) is the strongest one available, and it
transfers only to the extent that our pages actually have layers — a hero, alternating tone bands,
cards on a grid. Where our page is a full-bleed photograph and a column of type, the systems say
nothing, and anyone who tells you otherwise is quoting a blog.

What does transfer, and is worth stating as our own rule **[inference]**:

- If the design leans on **cards, tiles or a catalogue grid**, a white ground forces you to draw
  every card with a border or a shadow; a light-grey ground lets white cards do that work for free —
  which is precisely the choice Spectrum and Carbon encode.
- If the design is **type on a measure with hairline rules** (our `--border` at 0.14 alpha), a white
  ground is the correct one: there is nothing to elevate, and grey only muddies the photographs.
- **Photography-led** pages are the one case where a dark ground has documented support, and the
  support is about not distorting the perception of the image (§4), not about mood.

---

## 4. Neutrals: pure vs tinted — the highest-value section, with numbers

### What the systems document

**Spectrum: fully desaturated, and it publishes the reason.** **[doc]** This is the single most
useful sentence I found all day, twice stated:

> "Spectrum uses 11 tints and shades of gray per color theme. These grays are neutral (fully
> desaturated), which means that they can work alongside any color. Neutral grays help to prevent the
> misinterpretation of colors due to chromatic adaptation or simultaneous contrast within color or
> image manipulation workflows."
> — https://spectrum.adobe.com/page/color-system/

> "Spectrum uses fully desaturated grays to prevent the misinterpretation of colors due to chromatic
> adaptation caused by the user interface."
> "Spectrum uses fully desaturated grays, and uses color sparingly to prevent the effects of
> simultaneous contrast from influencing image manipulation workflows."
> — https://spectrum.adobe.com/page/color-fundamentals/

Verified in the shipped tokens: Spectrum light `gray-50 #ffffff`, `gray-75 #fdfdfd`,
`gray-100 #f8f8f8`, `gray-200 #e6e6e6` — RGB channel spread **0** on every one.

**Radix: both, with a documented choosing rule.** **[doc]**
(https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette):

> "Radix Colors provides a pure gray and a few tinted gray scales. … gray is pure gray · mauve is
> based on a purple hue · slate is based on a blue hue · sage is based on a green hue · olive is
> based on a lime hue · sand is based on a yellow hue"
> "**Neutral pairing** — If you want a neutral vibe, or you want to keep things simple, gray will work
> well with any hue or palette."
> "**Natural pairing** — Alternatively, choose the gray scale which is saturated with the hue closest
> to your accent hue. The difference is subtle, but this will create a more colorful and harmonius
> vibe."
> "Note: If your project uses a lot of colorful UI components like Badge, be careful when using
> saturated grays for your app background, especially in dark mode. Colorful UI components may clash
> with your saturated gray background color."

Radix also publishes the pairing table (mauve↔tomato/red/pink/plum/purple; slate↔iris/indigo/blue/
sky/cyan; sage↔mint/teal/jade/green; olive↔grass/lime; sand↔yellow/amber/orange/brown). **That is
"hue unity between neutrals and accent", published, and it is a stronger rule than our ±10° between
neutrals — it ties the neutral hue to the *brand* hue.** **[doc]**

**Material 3: neutrals are derived from the source colour at a fixed low chroma, and here are the
exact numbers.** **[doc]** From `material-color-utilities`:

| Scheme / spec | Neutral chroma | Neutral-variant chroma |
|---|---|---|
| 2021 `TONAL_SPOT` (Material You default) | **6.0** | **8.0** |
| 2021 `NEUTRAL` | 2.0 | 4.0 (×2 of neutral) |
| 2021 `MONOCHROME` / `RAINBOW` | 0.0 | 0.0 |
| 2021 `CONTENT` / `FIDELITY` | `sourceChroma / 8` | `sourceChroma / 4` |
| 2021 `VIBRANT` | 10 | 12 |
| 2021 `EXPRESSIVE` | 8 (hue +15°) | 12 (hue +15°) |
| 2025 `TONAL_SPOT`, phone | 5 | 5 × 1.7 = **8.5** |
| 2025 `NEUTRAL`, phone | **1.4** | 1.4 × 2.2 ≈ 3.1 |
| legacy `CorePalette` (non-content) | 4 | 8 |
| legacy `CorePalette` (content) | `min(chroma/12, 4)` | `min(chroma/6, 8)` |

(sources: `typescript/dynamiccolor/dynamic_scheme.ts` `getNeutralPalette` / `getNeutralVariantPalette`
for both spec delegates; `typescript/palettes/core_palette.ts` for the legacy numbers.)

Three things to take from that table **[inference]**:

1. **The neutral hue is the brand hue** — `TonalPalette.fromHueAndChroma(sourceColorHct.hue, 6.0)`.
   Same rule as Radix's "natural pairing", implemented.
2. **Chroma 4–8 HCT is the professional band for a tinted neutral**, and HCT chroma ~6 at tone 98 is
   *visually almost nothing*: with a saturated blue source it renders `#faf8ff`.
3. **The variant palette carries ~1.7–2.2× the neutral's chroma** and is used for *outlines and
   secondary text* (`outline` = neutral-variant tone 50, `on-surface-variant` = tone 30). The tint
   gets stronger as you go down the ramp, not weaker. Our flat `--color-line`-from-ink-alpha does
   approximately this by accident.

**Carbon: three parallel grey families, published as equals.** **[doc]** `gray-10 #f4f4f4` (spread
0), `coolGray-10 #f2f4f8` (spread 6), `warmGray-10 #f7f3f2` (spread 5) — see
`packages/colors/src/colors.ts`. Carbon's default themes use the neutral one; the tinted families
exist for products that want them. Carbon documents no rule for choosing between them. **[gap]**

### The measured comparison — where our ceiling actually sits

Computed by me from the published values above (`spread` = max RGB byte − min RGB byte;
`C` = OKLCh chroma):

| Swatch | Hex | spread | OKLCh C | Contrast vs `#fff` |
|---|---|---|---|---|
| Spectrum gray-100 (light ground) | `#f8f8f8` | 0 | 0.0000 | 1.06 |
| Carbon Gray 10 (theme ground) | `#f4f4f4` | 0 | 0.0000 | 1.10 |
| Radix gray-2 | `#f9f9f9` | 0 | 0.0000 | 1.05 |
| Radix sand-2 (tinted, warm) | `#f9f9f8` | 1 | 0.0013 | 1.05 |
| Radix slate-2 (tinted, cool) | `#f9f9fb` | 2 | 0.0026 | 1.05 |
| Radix mauve-2 | `#faf9fb` | 2 | 0.0028 | 1.05 |
| Primer neutral-1 (`bgColor-muted`) | `#f6f8fa` | 4 | 0.0034 | 1.06 |
| Carbon warmGray 10 | `#f7f3f2` | 5 | 0.0045 | 1.10 |
| Carbon coolGray 10 | `#f2f4f8` | 6 | 0.0058 | 1.10 |
| GOV.UK template-background | `#f4f8fb` | 7 | 0.0059 | 1.07 |
| M3 surface, tone 98, neutral chroma 6, blue source | `#faf8ff` | 7 | 0.0095 | 1.05 |
| **our `art-direction.md` slop tell** | `#f4f1ea` | 10 | 0.0098 | 1.13 |
| **our `palette.md` Bone ground** | `#f8f6f1` | 7 | 0.0070 | 1.08 |
| **our merryfair ground** | `#fbfaf7` | 4 | 0.0041 | 1.04 |
| **our merryfair-dense ground** | `#e7e4db` | 12 | 0.0125 | 1.27 |

**The finding: our chroma ceiling of `0x0A` is roughly 2–5× more permissive than every professionally
shipped tinted near-white except Material's.** **[inference, from the [doc] values]** Radix — the
system that ships *deliberately tinted* greys and tells you when to use them — puts its tinted ground
at spread 1–2 / C ≈ 0.0013–0.0028. Ours permits spread 10 / C ≈ 0.010. The banned swatch `#F4F1EA`
sits at C 0.0098, i.e. **just inside our own ceiling**. The rule as written does not exclude the thing
the rule was written to exclude.

Ink, same treatment — real systems land *higher* than our band's top:

| Ink on its own ground | Contrast |
|---|---|
| GOV.UK `#0b0c0c` on `#ffffff` | 19.6:1 |
| Spectrum gray-800 `#222222` on `#f8f8f8` | 15.0:1 |
| Carbon `#161616` on `#f4f4f4` | 16.5:1 |
| Radix slate-12 `#1c2024` on slate-1 | 16.0:1 |
| M3 on-surface tone 10 on surface tone 98 | 16.3:1 |
| Primer neutral-12 `#25292e` on `#f6f8fa` | 13.7:1 |
| our Paper white `#16181b` on `#ffffff` | 17.8:1 |

**Our 12–17:1 band is right, and empirically slightly low at the top.** **[inference]** Note also
that *nobody uses `#000`* — GOV.UK's near-black is `#0b0c0c`, Carbon's is `#161616`, Radix's inks
carry spread 5–8. USWDS documents the reason **[doc]**:

> "Avoiding pure black text on a white background helps dyslexia, Irlen Syndrome, light sensitivity,
> and autism."

That is a documented accessibility rationale for the rule `palette.md` already states on aesthetic
grounds. Use it.

### The instrument: channel spread vs OKLCh chroma

`palette.md` correctly rejects HSL saturation. The W3C states the general form of that objection
**[doc]** (https://www.w3.org/TR/css-color-4/):

> "sRGB blue is `oklch(0.452 0.313 264.1)` while sRGB yellow is `oklch(0.968 0.211 109.8)`. The OkLCh
> Lightnesses of 0.452 and 0.968 clearly reflect the visual lightnesses of the two colors."
> "The hue angle in HSL is not perceptually uniform; colors appear bunched up in some areas and widely
> spaced in others."
> Oklab "was produced by numerical optimization of a large dataset of visually similar colors, and has
> improved hue linearity, hue uniformity, and chroma uniformity compared to CIE LCH."

Channel spread is a decent proxy and has the merit of being readable off a hex with no maths. But it
is lightness-dependent — the same spread means much more chroma at L 0.92 than at L 0.99 — which is
why `#e7e4db` (spread 12) and `#fbfaf7` (spread 4) feel closer than the numbers suggest. **OKLCh
chroma is the instrument the industry actually uses**, and it is one line of CSS
(`oklch(98% 0.004 250)`), so the ceiling can be stated in the space the colour is authored in.
**[inference]**

---

## 5. Accent discipline

- **Spectrum** **[doc]**: "Colors are used sparingly and intentionally to reinforce hierarchies and to
  create clear modes of communication. **Using too much color can be visually overwhelming and
  impacts user experience.**" (https://spectrum.adobe.com/page/color-system/)
- **Carbon** **[doc]**: "The core blue family serves as the primary action color across all IBM
  products and experiences. **Additional colors are used sparingly and purposefully.**" — one accent,
  system-wide, named as the action colour.
- **Radix** **[doc]** does not cap accent usage but caps *accent as text*: steps 11 and 12 are the
  text steps, and only they carry the contrast guarantee (Lc 60 / Lc 90 on step 2). Step 9 — "the
  highest chroma of all steps" — is a *background*, and "Most step 9 colors are designed for white
  foreground text. Sky, Mint, Lime, Yellow, and Amber are designed for dark foreground text."
- **Spectrum** **[doc]** has the identical carve-out on the fill side: "Most colors have white text
  placed over the color. To maintain the identifiability of yellow, orange, chartreuse, and cyan while
  still meeting these requirements, these colors must be used with black text."
- **Spectrum on coloured text** **[doc]**: "Color 900 is used for colored text content, but **Spectrum
  only supports the use of colored text for the accent and negative semantics.**"
- **USWDS** **[doc]**: "Don't use color exclusively to convey meaning."
- **Radix on text colour choice** **[doc]**: "Using your accent scale will result in a more colorful
  vibe. … Using your gray scale will result in a more functional vibe. … You may want to experiment
  with using your accent scale for text in your marketing sites, and your gray scale for text in your
  apps."

**How the systems solve accent-as-text-contrast-failure**: universally, by keeping a *separate,
darker step of the same hue* for text (Radix 11/12, Spectrum colour-900, M3 `on-*-container` and
`primary` tone 40). Nobody adjusts the fill colour to make text work; they add a step. `palette.md`'s
`--color-accent-ink` is the same move with one step instead of a ramp — **that one is right.**
**[inference]**

**A documented budget number: [gap].** No system publishes "N accent uses per page." "Sparingly" is
as specific as it gets. Our "two or three per page" is a house rule with no external support — which
is fine, but it should not be presented as industry practice.

---

## 6. Where our shipped procedure agrees, contradicts, or is missing something

### Agrees, and is backed by primary sources it does not currently cite

| `palette.md` says | Backed by |
|---|---|
| Neutrals share one hue | Radix "natural pairing" [doc]; M3 derives neutrals from `sourceColorHct.hue` [doc] |
| Ink is the family hue at L 8–12%, never `#000` | USWDS on pure black [doc]; every system's ink carries hue [practice] |
| Ink contrast 12–17:1, not "clear 4.5" | Measured 13.7–19.6:1 across five systems [inference]; Apple "strive for a contrast ratio of 7:1" as a floor [doc] |
| `--color-accent-ink` for accent-as-text | Radix 11/12, Spectrum colour-900 [doc] |
| `--color-on-accent` computed, not assumed | Spectrum's yellow/orange/chartreuse/cyan black-text carve-out [doc]; Radix's Sky/Mint/Lime/Yellow/Amber [doc] |
| HSL saturation is the wrong instrument | CSS Color 4 on HSL non-uniformity [doc] |
| Accent used sparingly | Spectrum, Carbon [doc] |

### Contradicts, or is measurably too loose

1. **The chroma ceiling is 2–5× too permissive.** `0x0A` spread admits `#F4F1EA` (C 0.0098), the very
   swatch `art-direction.md` bans by name. Radix's tinted grounds sit at C 0.0013–0.0028; Primer at
   0.0034; Carbon's tinted families at 0.0045–0.0058. **Concrete change: ground (L > 0.95) chroma
   ≤ 0.006 OKLCh, equivalently channel spread ≤ `0x06`.** That keeps every professional tinted
   near-white in the table above (except M3's most saturated case) and excludes `#F4F1EA` (C 0.0098)
   and `#E7E4DB` (C 0.0125).

   Two consequences worth stating plainly rather than hiding. **`palette.md`'s own Bone ground
   `#F8F6F1` fails the tighter ceiling** (C 0.0070, spread 7) — it would have to move to about
   `#F9F8F4` (C ≈ 0.005). And `#F7F5F1`, a cream of exactly the family the slop list is aimed at,
   *passes* at C 0.0057 — so chroma alone was never going to be the whole discriminator, and the
   `direction.palette.rejected` requirement is still doing the work the number cannot.
   **[inference, checked against the table]**

2. **Hue unity ±10° across neutrals is the wrong axis of unity.** Radix and M3 both tie the neutral
   hue **to the accent/source hue**, not merely to each other. A theme with a bone ground (h≈90°) and
   a blue accent (h≈250°) satisfies our rule and violates both of theirs. **Concrete change: the
   neutral hue must be either 0-chroma or within ~30° of the accent hue** — or the divergence must be
   stated as a deliberate complementary choice in `direction.palette.why`. **[inference]**

3. **"Aim 12–17:1" undershoots the shipped norm.** Half the systems measured exceed 16:1. Widen to
   **13–19:1**, and note GOV.UK's `#0b0c0c` as the top of the practical range. **[inference]**

4. **We verify contrast against the wrong background.** Primer verifies everything against
   `bgColor-muted`, the *second* background, so both grounds pass. We check ink against `--color-bg`
   only, leaving `--color-surface` — where a large share of body copy actually sits — unverified.
   **Concrete change: check ink and muted against whichever of `--color-bg` / `--color-surface` is
   lighter, and require both to pass.** **[doc → inference]**

### Missing — the things real systems do that we do not

5. **"Four families, pick one" is a crude stand-in for a derived tonal ramp, and yes, it should be
   replaced.** What M3, Spectrum and Leonardo all do instead — and what is implementable here — is:

   ```
   input:  brand hue H (from the accent), a ground lightness target, a neutral chroma C
   step 1: C = 0        if the brief has no brand colour, or the page is photography-led
           C = 0.004    default tinted neutral
           C = 0.006    maximum
   step 2: ground   = oklch(L_bg  C H)      L_bg  ∈ {1.00, 0.985, 0.965}   ← the white/off-white/grey decision
           surface  = oklch(L_bg ± 0.02 C H)  lighter if the ground is grey, darker if the ground is white
           ink      = oklch(0.22  C*1.8 H)   then push L down until ink-on-ground ≥ 13:1
           muted    = oklch(0.50  C*1.8 H)   then adjust until muted-on-ground ∈ 5–7:1
           line     = oklch(0.85  C*1.8 H)   ≈ Radix step 6/7
   step 3: inverse set = the same five at inverted L
   ```

   Two properties this has and the table of four families does not: the neutral is **tied to the
   brand**, so two clients with different accents cannot receive the same greys; and the values are
   **generated from contrast targets**, so the check in step 4 of `palette.md` cannot fail. Note the
   `C*1.8` on the darker steps — that is M3's neutral-variant multiplier (×1.7 in the 2025 spec,
   ×2.0 in 2021), and it is the reason professional ramps look tinted at the border/text end while
   the ground looks white. **[inference, mechanism from [doc]]**

6. **We have no ramp, and interaction/elevation states are the cost.** Eleven flat tokens cannot
   express hover, pressed, subtle-border-vs-interactive-border, or two levels of surface. Carbon
   ("half steps" for hover, "two full steps" for active) and Radix (3/4/5, 6/7/8) both encode those as
   ramp positions. Our `--elev-1`/`--elev-2` covers the shadow half and nothing covers the surface
   half. **[inference]** Smallest useful addition: a second surface token (`--color-surface-2`) so
   the layering model of §3a is expressible at all.

7. **The ground decision has no documented criterion in our procedure.** `palette.md` chooses the
   ground as a side effect of choosing a family. The systems choose it *first and for a reason*.
   Concretely, add to step 1: **does this page's design lean on cards/tiles?** If yes, prefer a grey
   ground and white surfaces (Spectrum/Carbon layering). If it is type-and-hairlines, prefer white.
   If it is photography-led with continuous imagery, dark is defensible — and note that the
   readability cost is a luminance cost (Buchner 2009), so long-form pages should not take it.
   **[inference, from §3a/§3c]**

8. **Nothing in the procedure records the derivation, only the choice.** M3 stores a source colour
   and regenerates; we store eleven resolved hexes. A `theme.json` that recorded
   `{ hue, chroma, groundL }` alongside the resolved tokens would make a fleet-wide palette migration
   possible in the same way `deprecated`/`migrate()` makes a block change possible. **[inference]**

9. **APCA exists and our validator does not know about it.** Radix's text guarantee is stated in Lc,
   not WCAG ratio, because WCAG 2.x "far overstates contrast for dark colors to the point that 4.5:1
   can be functionally unreadable when a color is near black" and "cannot be used for guidance
   designing 'dark mode'" (https://git.apcacontrast.com/documentation/WhyAPCA.html). **Our inverse
   tone pairs — the exact case `palette.md` step 4 flags as most often skipped — are the case WCAG 2
   is documented to get wrong.** **[doc]** Adding an Lc check for the inverse pairs is the
   highest-value validator addition after the ones already listed in the warm-themes doc.

---

## Gaps — named, not filled

- **No system documents a ground-colour criterion for marketing pages.** All of §3 is product-UI
  reasoning, transferred by me.
- **Shopify Polaris**: its colour documentation was not reachable at
  `polaris.shopify.com/design/colors` or `polaris-react.shopify.com/design/colors` on 2026-09-10 —
  both now resolve to app-surface docs. Nothing from Polaris is cited here.
- **Microsoft Fluent 2** and **Nord**: not investigated. Out of budget, not out of scope.
- **Carbon does not document how to choose between its neutral, cool and warm grey families**, nor
  between the White and Gray 10 themes beyond the layering consequence.
- **GOV.UK does not document why its body background is white.**
- **No published "accent uses per page" number** from any system.
- **OLED/battery arguments for dark grounds**: no primary design-system source found.
- **USWDS's "white or light text on black … works well for all"** is uncited by USWDS and contradicts
  Buchner et al. Treated as unreliable.
- **`--color-line` at 0.12–0.16 alpha vs Radix step 6/7**: I did not verify the equivalence
  numerically.
- **Spectrum's "polynomial curve" for gray target contrast ratios** is described but the coefficients
  are not published on the page; I did not chase them into `spectrum-tokens`.

---

## Sources

Design-system documentation (all fetched 2026-09-10):

- Material 3 — https://m3.material.io/styles/color/system/how-the-system-works ·
  /styles/color/roles · /styles/color/choosing-a-scheme
- Material Color Utilities (source of truth for the chroma numbers) —
  https://github.com/material-foundation/material-color-utilities —
  `typescript/dynamiccolor/dynamic_scheme.ts`, `typescript/dynamiccolor/color_spec_2021.ts`,
  `typescript/palettes/core_palette.ts`
- IBM Carbon — https://carbondesignsystem.com/elements/color/overview/ · /usage/ ; token values from
  `carbon-design-system/carbon`, `packages/colors/src/colors.ts`
- Adobe Spectrum — https://spectrum.adobe.com/page/color-fundamentals/ · /page/color-system/ ·
  /page/using-color/ · /page/color-palette/
- Adobe Leonardo — https://github.com/adobe/leonardo
- Radix Colors — https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale ·
  /composing-a-palette ; hex values from `radix-ui/colors`, `src/light.ts`
- GitHub Primer — https://primer.style/product/getting-started/foundations/color-usage/ ; hex values
  from `primer/primitives`, `src/tokens/base/color/light/light.json5`
- Atlassian — https://atlassian.design/foundations/elevation
- Apple HIG — https://developer.apple.com/design/human-interface-guidelines/color ·
  /human-interface-guidelines/dark-mode
- GOV.UK Design System — https://design-system.service.gov.uk/styles/colour/
- USWDS — https://designsystem.digital.gov/design-tokens/color/overview/

Standards and colour science:

- WCAG 2.2, SC 1.4.3 / 1.4.6 / 1.4.11 — https://www.w3.org/TR/WCAG22/#contrast-minimum
- APCA, *Why APCA* — https://git.apcacontrast.com/documentation/WhyAPCA.html
- CSS Color Module Level 4 (Lab/Oklab/OkLCh) — https://www.w3.org/TR/css-color-4/

Reading research:

- Buchner, A., Mayr, S. & Brandt, M. (2009). "The advantage of positive text-background polarity is
  due to high display luminance." *Ergonomics* 52(7), 882–886. DOI 10.1080/00140130802641635 —
  PDF at https://www.psychologie.hhu.de/fileadmin/redaktion/Oeffentliche_Medien/Fakultaeten/Mathematisch-Naturwissenschaftliche_Fakultaet/Psychologie/AAP/Publikationen/2009/Buchner_Mayr_Brandt__2009_.pdf
- Buchner, A. & Baumgartner, N. (2007). "Text–background polarity affects performance irrespective of
  ambient illumination and colour contrast." *Ergonomics* 50(7) —
  https://www.tandfonline.com/doi/abs/10.1080/00140130701306413 (abstract only; not quoted here)
