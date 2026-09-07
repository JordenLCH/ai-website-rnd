# Web design tips & tricks

*Tactical layer. The three companion docs cover process — this one is the pile of concrete moves
that make a page look nicer, feel more considered, and read as a specific company rather than a
template.*

Companions: `the-pre-ai-web-studio.md` (pipeline, per-role do/don't),
`how-designers-actually-design.md` (craft, review tests, learning path),
`choosing-sections-and-motion.md` (section selection, motion gate).

Web sources are cited inline and listed at the bottom. Where a popular tip is **wrong**, it is
marked ⚠️ with the correction — several of the most-repeated "make your site nicer" tips are the
exact tells of an undesigned page.

---

## 1. The six tips everyone repeats, graded

| Common advice | Verdict |
|---|---|
| "Card + shadow looks nice" | ⚠️ **Half wrong.** Shadow means *distance*, not importance. If every block is a card, nothing is emphasised. Default to surface tone steps for depth; reserve shadow for things that genuinely float and can be dismissed (menu, dialog, toast, drag state) |
| "Add border-radius to images" | ✅ — but assign radius **by role**, not one value everywhere. Radius carries tone: `0` reads precise/editorial, `24px` reads friendly/consumer. One radius on everything is the builder-default look |
| "`object-fit: cover` for responsive images" | ✅ — always paired with `aspect-ratio` on the wrapper plus `width`/`height` attributes, or you trade a crop bug for a CLS bug |
| "Fluid type with `clamp()`" | ✅ — but clamp the *scale steps*, not every element, and always cap the max. Uncapped `vw` headings blow past a readable 32ch measure on wide screens |
| "Use the primary colour for headings and CTAs" | ⚠️ **Mostly wrong.** Headings should be the neutral text token. Accent belongs in one or two places per screen — the CTA is that place. Colouring headings *and* the CTA means the CTA stops reading as the action |
| "Tailwind is good" | ✅ as an engine. But unmodified Tailwind/shadcn defaults are a recognisable look, which is the category-default trap at system scale. Overwrite the theme before shipping |

---

## 2. Typography — the highest-leverage layer

```css
:root{
  --step--1: clamp(0.875rem, 0.85rem + 0.15vw, 0.9375rem);
  --step-0:  clamp(1rem,     0.95rem + 0.25vw, 1.125rem);
  --step-3:  clamp(2rem,     1.4rem  + 3vw,    4rem);   /* cap the max, always */
}
h1{ font-size:var(--step-3); line-height:1.05; letter-spacing:-0.02em;
    text-wrap:balance; max-width:32ch }
p { max-width:65ch; line-height:1.6; text-wrap:pretty }
```

- **Line-height is inverse to size.** 1.5–1.6 for body, 1.05–1.15 for display. The same line-height
  at every size is one of the clearest amateur tells.
- **Tracking follows size too.** Negative (`-0.02em`) on large display type, slightly positive on
  small caps and eyebrow labels.
- `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs — kills orphans and ragged
  headline breaks for free, no JS.
- `font-variant-numeric: tabular-nums` on every price, stat, and table column so digits stop
  dancing.
- **Two faces maximum, ~4 weights.** A variable font is one file for the whole range. Stay at
  weight ≥400 for body — de-emphasise with colour or size, never with a lighter weight
  ([Refactoring UI summary](https://gist.github.com/selcukcihan/b9418596a98abfcd4bbc622550820cc5)).
- `font-display: swap` plus a metric-compatible fallback (`size-adjust`, `ascent-override`) →
  effectively zero font-swap CLS.
- Body ≥16px on mobile, or iOS Safari zooms the page on input focus.
- **Neo-serif display + monospace metadata** is the 2026 pairing that reads as art-directed rather
  than default; monospace for labels, captions, and data is cheap personality
  ([Fireart](https://fireart.studio/blog/the-best-web-design-trends/)).

---

## 3. Colour — derive, don't pick

```css
:root{
  --bg:#fbfaf8;
  --surface:#ffffff;
  --surface-2:#f3f1ed;                                     /* tone ramp = depth */
  --text:#16150f;
  --muted:color-mix(in oklch, var(--text) 62%, var(--bg));
  --border:color-mix(in oklch, var(--text) 12%, var(--bg));
  --accent:#b4451f;
  --on-accent:#ffffff;
}
```

- **Derive the ramp from the accent** with `color-mix(in oklch, …)`. Hand-picked greys drift out of
  family; derived ones can't.
- Use `oklch()` for ramps — perceptually even lightness, unlike HSL where 50% lightness means
  something different per hue.
- A neutral biased slightly toward the accent hue reads *chosen*; pure `#808080` reads *default*.
- **Every background token ships its `on-` foreground token.** An orphan background is how an
  unreadable theme switch happens.
- Keep semantic colours (success/warning/danger) on a separate axis from the brand accent, or
  error states read as branding.
- `light-dark(#fff, #111)` + `color-scheme` gives dark mode with no media query. Dark mode is now
  table stakes — one tracked portfolio reports 82% of smartphone users running at least one app in
  dark mode and 18% longer sessions
  ([StudioMeyer](https://studiomeyer.io/en/blog/webdesign-trends-2026-reality-check)).
- Never encode meaning in colour alone. Pair with icon, label, or shape (~8% of men can't separate
  your red from your green).
- `accent-color: var(--accent)` brands native checkboxes, radios and range inputs in one line.

---

## 4. Images — where amateur pages lose most

```css
img{ display:block; max-width:100%; height:auto }
.media{ aspect-ratio:4/3; overflow:hidden; border-radius:var(--r-m) }
.media img{ width:100%; height:100%; object-fit:cover; object-position:center 30% }
```

- `aspect-ratio` on the **wrapper** + `cover` on the image = any source ratio, zero layout shift.
- `object-position` is free crop control. Portraits usually want `center 30%`, not centre.
- Hero image: `fetchpriority="high"`, never `loading="lazy"`. Everything below the fold:
  `loading="lazy" decoding="async"`.
- `<picture>` with AVIF → WebP → JPEG, and a real `sizes` attribute, or you ship a 3000px file to a
  phone.
- **Text on a photo:** not a flat black overlay — a gradient scrim
  (`linear-gradient(to top, rgb(0 0 0/.7), transparent 60%)`) only where the text sits.
- **Bad client photography is fixable by treatment.** A shared duotone, grayscale-plus-accent, or a
  consistent warm grade makes five mismatched photos look art-directed. This is the single biggest
  visual rescue on a small-business brief.
- Replacing stock imagery with real photography is consistently ranked the fastest change that
  removes "template vibes" ([TechRadar](https://www.techradar.com/pro/website-building/how-to-customize-a-website-template-5-tips),
  [Showit](https://showit.com/website-tips/how-to-customize-website-templates/)).

---

## 5. Depth — tone first, shadow second

```css
--e0: none;                                                    /* page surface, flat */
--e1: 0 1px 2px rgb(0 0 0/.04), 0 2px 8px rgb(0 0 0/.06);      /* genuinely floating */
--e2: 0 4px 8px rgb(0 0 0/.06), 0 12px 32px rgb(0 0 0/.10);    /* modal, menu */
```

- **Two layers, always:** a tight key shadow plus a wide ambient one. A single
  `0 2px 4px rgba(0,0,0,.5)` on everything is the tell.
- Higher elevation = larger, softer, *more* transparent — not darker.
- Card at rest: `background: var(--surface); border: 1px solid var(--border)`. No shadow. Add
  shadow on hover only if the card is genuinely liftable.
- **Dark mode: raise the surface, don't deepen the shadow.** Shadows barely register on near-black.
- Animate a shadow by cross-fading a pseudo-element's `opacity`, never the `box-shadow` value
  itself ([Social Animal](https://socialanimal.dev/blog/micro-interactions-web-design/)):

```css
.card::before{ box-shadow:var(--e1); opacity:0; transition:opacity 150ms ease-out }
.card:hover::before{ opacity:1 }
```

- Border, fill, radius and shadow are **four devices with four jobs**: boundary, grouping,
  softness, distance. Using all four on every block flattens hierarchy.
- Glassmorphism (`backdrop-filter: blur()`) costs 15–30% FPS on mid-tier Android — worth it on a
  nav bar or a modal, not on a grid of cards
  ([StudioMeyer](https://studiomeyer.io/en/blog/webdesign-trends-2026-reality-check)).

---

## 6. Spacing & layout

- **One scale, 4px base:** `4 8 12 16 24 32 48 64 96 128`. Needing a value that isn't on it means
  either the scale is wrong (fix globally) or you're decorating.
- **Space is grouped, not distributed.** Gap between a label and its input must be smaller than the
  gap to the next field. Always more space *around* a group than *within* it.
- **When in doubt, add more.** Start at the next step up — `padding: 32px` before `16px`. The most
  common single fix in UI critique is "give it more room"
  ([Refactoring UI notes](https://gist.github.com/selcukcihan/b9418596a98abfcd4bbc622550820cc5)).
- One rule for vertical rhythm: `.stack > * + * { margin-block-start: var(--gap) }`.
- Fluid section padding: `padding-block: clamp(3rem, 8vw, 8rem)`.

```css
.wrap{ width:min(100% - 2rem, 72rem); margin-inline:auto }
.auto-grid{ display:grid; gap:var(--sp-6);
  grid-template-columns:repeat(auto-fit, minmax(min(18rem,100%), 1fr)) }
```

- The `min(18rem, 100%)` is what stops the grid overflowing at 320px. Without it, `minmax` blows
  out the viewport.
- **Container queries beat media queries for components.** `container-type: inline-size` on the
  parent, `@container (min-width: 32rem)` on the child — the same card then works in a sidebar and
  in main content with no variant.
- `grid-template-columns: subgrid` aligns card headings and footers across a row regardless of copy
  length. This is the fix for "the cards look ragged" that people usually attempt with fixed heights.
- **Count your alignments.** More than 3–4 distinct vertical lines per screen is what "messy but I
  can't say why" actually is.

---

## 7. Interaction states — all five, derived not hand-picked

```css
.btn{ transition:background .12s ease-out, transform .12s ease-out }
.btn:hover{ background:color-mix(in oklch, var(--accent) 92%, black) }
.btn:active{ transform:translateY(1px) }
.btn:focus-visible{ outline:2px solid var(--accent); outline-offset:2px }
.btn:disabled{ opacity:.5; cursor:not-allowed }
@media (hover:none){ .btn:hover{ background:var(--accent) } }   /* no sticky hover on touch */
```

- Material 3's approach is the one worth stealing wholesale: derive states from a fixed overlay
  opacity of the content colour — hover 8%, focus 10%, pressed 10%, dragged 16%. One rule, every
  component, both themes, contrast guaranteed.
- `:focus-visible`, not `:focus`. Never `outline: none` without a replacement. `outline-offset` is
  what makes a focus ring look designed rather than tolerated.
- Hit area ≥44px even when the icon is 20px — pad the target, don't inflate the glyph.
- **The four micro-interactions with the best return per hour:** state feedback, hover affordance,
  loading indicators, inline validation on blur (not on keystroke)
  ([Social Animal](https://socialanimal.dev/blog/micro-interactions-web-design/)).
- **3–5 purposeful micro-animations per page reads as premium; 20 reads as chaos**
  ([SkillValix](https://www.skillvalix.com/blog/css-animations-micro-interactions-guide)).
- Response-time thresholds worth designing against: <100ms feels instant (no feedback needed);
  100ms–1s wants a spinner; 1–10s wants a progress bar plus an explanation; >10s needs a percentage
  or people leave.

Timing table, cross-checked against the motion doc:

| Interaction | Duration | Easing |
|---|---|---|
| Hover / focus | 100–150 ms | ease-out |
| Button press | ~100 ms | ease-out |
| Toggle, checkbox | 150–200 ms | ease-in-out |
| Modal / drawer open | 200–250 ms | ease-out |
| Modal / drawer close | 150–200 ms | ease-in |
| Page or section fade-in | 200–300 ms | ease-out |

**Exits are always faster than entrances.** Nobody watches something leave.

---

## 8. Making it look *unique* — what actually differentiates

The 2026 consensus across trend write-ups is that AI-generated polish is abundant and
interchangeable, so the differentiator moved from polish to *evidence of decision*
([Envato](https://elements.envato.com/learn/web-design-trends),
[Figma](https://www.figma.com/resource-library/web-design-trends/)).

**Ranked by identity carried per unit of effort:**

1. **Layout map + tone rhythm.** Two sites with the same palette and different layout maps read as
   different companies. The reverse is not true. Alternate density, tone and section *shape* down
   the page.
2. **Typography.** An oversized viewport-scaled headline carrying the brand message replaces the
   generic hero image entirely — currently the most visible single move in award work.
3. **Real imagery and a consistent treatment.** Stock photography is the loudest template signal
   there is.
4. **One asymmetry.** A 7/5 split instead of 6/6, one element overlapping a section boundary, one
   full-bleed break of the page margin. "An irregular layout suggests that real decisions were
   made" ([Envato](https://elements.envato.com/learn/web-design-trends)).
5. **Texture.** A subtle CSS grain filter or animated SVG noise overlay over a flat background
   breaks digital perfection and reads as tactile
   ([Fireart](https://fireart.studio/blog/the-best-web-design-trends/)).
6. **Colour.** Last. It carries the least identity of anything on this list.

**Cheap moves that read as "designed":**

- One oversized element per page — a huge number, one giant word, one full-bleed image.
- Hairline rules (`1px solid var(--border)`) separating list items instead of wrapping each in a card.
- Overlap one element across a section boundary (`margin-block-start: -4rem`).
- Alternate section tone: light → tinted → dark → light.
- A consistent edge relationship — everything aligns to the page margin, or deliberately breaks it.
  *Near*-misses read as errors even to people who can't name why.
- Monospace for metadata, captions and eyebrow labels.
- One orchestrated motion moment per page, not one per section.

**The divergence exercise, which is the actual method:** list what the client's three closest
competitors all share. That shared thing is the category default — and it is what you must not do.
In this repo that exercise is automated as `fleet_siblings`; overlap above ~0.7 means you landed on
the default.

### Style directions currently doing the differentiating

| Direction | Reads as | Concrete markers |
|---|---|---|
| **Bento grid** | Organised, product-led, Apple-adjacent | Modular tiles of unequal size, one feature per tile. Reported ~23% more scroll depth vs a 12-column grid ([StudioMeyer](https://studiomeyer.io/en/blog/webdesign-trends-2026-reality-check)) — but now ubiquitous, so it is fast becoming the new default |
| **Soft brutalism / anti-grid** | Respected before liked — editorial, fashion, indie SaaS | 2–4px borders, near-black border colour, radius 0–8px, muted pastel grounds, heavy grotesque or monospace, no shadows, hierarchy by overlap and z-index ([Brainy](https://brainy.ink/paper/brutalist-web-design-2026)) |
| **Tactile / textured** | Human, hand-made, anti-AI | Film grain, CRT scanlines, paper texture, sketchy lines, collage ([Fireart](https://fireart.studio/blog/the-best-web-design-trends/)) |
| **Kinetic type** | Confident, editorial | Viewport-scaled headlines edge to edge; weight/width mapped to scroll position |
| **Dopamine / Y2K** | Playful, consumer, young | Saturated palettes, neon gradients, high-contrast pairings ([Wix](https://www.wix.com/blog/web-design-trends)) |

Pick one and commit. Mixing three is how a page ends up looking like a moodboard.

---

## 9. AI slop — the 2026 tells, and why they happen

The category default is no longer "what other law firms look like". It is **the statistical average
of every landing page a model was trained on**. A generator asked for "a modern SaaS site" with no
direction returns the mode: centred hero, badge above the H1, three icon-top cards, testimonials,
pricing, CTA. The look now has a name — *AI slop* — and clients are starting to recognise it.

Two of these are worth calling out because they are the ones people notice first without being able
to name them:

- **The hairline.** A 1px grey border on every card, usually paired with a wide diffuse shadow. It
  is a recurring generated-UI signature — the model hedges, so it applies both separation devices
  everywhere rather than choosing one per role.
- **The stroke.** A 3–4px coloured stripe on the left edge of a card or blockquote, nearly always
  purple, blue or a gradient. One of the most reliable single tells there is
  ([Developers Digest](https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it)).

### The full tell list

| # | Tell | Signature | Fix |
|---|---|---|---|
| 1 | **Inter everywhere** | Inter + system fallback, no other typographic decision | Any deliberate face — Geist, Söhne, Untitled Sans, a grotesque with character |
| 2 | **The rotating AI font set** | Space Grotesk / Instrument Serif / Geist cycling across pages | One display + one body, chosen once |
| 3 | **Serif italic accent word** | One italic serif word inside an otherwise-Inter headline | Consistency; emphasise with size or space |
| 4 | **VibeCode purple** | Tailwind `indigo-500`, `from-blue-600 to-purple-600` | Any committed palette — earth, cream+ink, black + one bright |
| 5 | **Gradient headings** | Purple→blue→teal, often animated on loop | One flat accent, held across the page |
| 6 | **Permanent dark mode** | Dark ground, mid-grey body text, all-caps labels | Light mode by default, or an actual toggle |
| 7 | **Low-contrast body text** | Grey-on-dark failing WCAG AA | ≥4.5:1, checked |
| 8 | **Coloured glows / shadows** | Big coloured `box-shadow` blooms | Neutral, two-layer shadows, sparingly |
| 9 | **The hairline** | 1px grey border on every card + wide soft shadow | Pick *one* separation device per role |
| 10 | **The stroke** | 3–4px coloured left border on cards/quotes | Delete it; use type or space for emphasis |
| 11 | **Centred hero** | Centred headline, centred sub, centred button | Asymmetric hero; left-align and let the image carry the other half |
| 12 | **Badge above the H1** | Pill chip — "✨ Now in beta" — over the headline | Cut, or fold into the headline |
| 13 | **Eyebrow labels** | Tiny uppercase letter-spaced text above every section | Keep at most one, or none |
| 14 | **Icon-top card ×3** | Three identical cards, `lg:grid-cols-3`, icon on top | Vary card treatment, or drop to two with real images |
| 15 | **Decorative numbered steps** | `01 02 03` on content already in reading order | Numbers only when order is genuinely non-obvious |
| 16 | **Stat banner row** | Four unsourced metrics in a strip | Only with verifiable numbers and a source |
| 17 | **Emoji icons** | Emoji standing in for an icon set | Real icon set, or typographic nav |
| 18 | **Uniform sizing** | Same 16px radius, 24px padding, same card height everywhere | Assign radius and density by role |
| 19 | **Dead motion** | Hover states that do nothing, buttons that snap, one generic fade-up on every element | Four purposeful micro-interactions (§7), nothing else |
| 20 | **Em dash flood** | `—` in headlines, buttons, testimonials — one audit found 31 on a single site | Period, comma, colon or hyphen |
| 21 | **Vague headline** | "Build the future of work", "Scale without limits" | State the actual offer in the hero |
| 22 | **Stock or absent imagery** | Diverse team at a laptop in a perfect office; abstract 3D blobs; coloured squares with initials where founder photos go | At least one real image on every page that matters |
| 23 | **Fabricated proof** | Unsourced stats, first-name-only testimonials with initial avatars | Real name, role, company — or cut the section |

### Why it happens, mechanically

For a visual choice, "most probable" is the average of millions of templates. Tailwind UI shipped
`bg-indigo-500` on every button five years ago; Adam Wathan publicly acknowledged the consequence in
2025, and that single default is a large part of why generated interfaces are purple
([DEV](https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p)).
shadcn/ui compounded it: teams shipped the defaults — no custom colour, no adjusted spacing, no
brand — straight to production, so the defaults became the training data for the next model.

**The consequence for this repo's method:** discarding the likeliest of four sampled directions is
not a stylistic preference, it is the only mechanism that escapes the mode.

### The lookalike test — the cheapest diagnostic there is

Screenshot your homepage. Reduce it to a ~200px-wide black-on-white silhouette. Do the same for
five competitors. Lay all six side by side.

**If you can't pick yours out, the page is structurally slop** — no amount of palette tweaking fixes
it, because the sameness is in the layout map, not the colour
([925 Studios](https://www.925studios.co/blog/ai-slop-web-design-guide)).

This is the manual form of the `fleet_siblings` overlap check, and it is why that check compares
layout maps rather than palettes.

### Two more checks worth running

- **Voice check:** "Would the client's founder actually say this sentence out loud?" Generated copy
  defaults to generalisation because the model has no specific experience to draw on.
- **Specificity count:** count the concrete nouns on the page — real place names, real product
  names, real numbers with sources, real people. Slop scores near zero.

---

## 10. The unique-looking things that cost you the site

Every one of these is a technique people reach for to look distinctive, that measurably backfires:

- **3D / WebGL heroes** — 800 KB–2 MB of JS before anything renders; Core Web Vitals failures and
  mobile abandonment on 4G. Awwwards jurors test on real devices, and an 18fps hero on a mid-range
  phone doesn't win ([StudioMeyer](https://studiomeyer.io/en/blog/webdesign-trends-2026-reality-check),
  [Hon Tran](https://www.hontran.dev/blog/best-award-winning-websites-2026)).
- **Kinetic typography everywhere** — fights screen readers, fights crawlers, adds layout shift.
  Confine it to hero headlines and section transitions.
- **Glassmorphism on every card** — see the FPS cost above.
- **Auto-rotating carousels** — faster than reading, slower than clicking.
- **Scroll-jacking and heavy parallax** — the top complaint in usability testing of award-style
  sites, and a genuine vestibular-disorder problem.
- **Custom cursors that replace the pointer** — fine as an accent, breaks affordance when the real
  cursor is hidden and the replacement lags.
- **Content gated behind a scroll reveal.** The resting state must be visible; the animation adds a
  small offset *from* visible. If JS fails or the element is already on screen at load, the content
  must still read.

The award-work summary is consistent: the differentiator is *balance* — bold identity plus fluid
navigation plus 60fps plus fast load. Beauty that costs six seconds does not place.

---

## 11. Modern CSS worth reaching for

- `:has()` — the parent selector. `.card:has(img)`, `nav:has(:focus-visible)`, form-validity styling
  with no JS.
- `dvh` instead of `vh` — fixes the mobile URL-bar jump. `min-height: 100dvh`.
- `scrollbar-gutter: stable` — kills the layout jump when a modal locks scroll.
- `overscroll-behavior: contain` on scrollable panels — stops scroll chaining to the body.
- `@starting-style` + `transition-behavior: allow-discrete` — animate `display: none → block`, no JS.
- Native `<dialog>` and the `popover` attribute — free focus trap, Escape handling, top layer.
- `field-sizing: content` — auto-growing textareas without a resize observer.
- `scroll-margin-top` on anchor targets so a sticky header doesn't cover them.
- `padding-bottom: env(safe-area-inset-bottom)` for iPhone sticky bars.
- Scroll-driven animations (`animation-timeline: view()`) — reveals that run off the main thread,
  no IntersectionObserver.
- `content-visibility: auto` + `contain-intrinsic-size` on below-fold sections — large paint win.
- `will-change` only for the duration of the animation, on ~10 elements max, removed after. Left on
  permanently it is a memory leak.

---

## 12. If you're using Tailwind

1. **Overwrite the theme first.** Your spacing scale, type steps, radius set, palette. Delete the
   defaults you don't use. Unmodified Tailwind/shadcn is a recognisable house style, not an art
   direction.
2. **Semantic tokens in `@theme`**, not raw values — `bg-surface`, `text-muted`, never `bg-gray-100`.
   Role names survive a rebrand; value names don't.
3. Extract to a component the moment a class string repeats. `@apply` sparingly — a component
   boundary is better than a CSS alias.
4. An arbitrary value (`p-[13px]`) means you left the system. Same rule as any scale.
5. Fix a utility order convention (layout → box → type → colour → state) or diffs become unreadable.
6. `prose` for CMS long-form, capped at `max-w-[65ch]`.

---

## 13. Free QA that catches most of it

Run before showing anyone. All of these work on a screenshot except the last two.

**Squint** (or zoom to 25%) — is the focal point actually focal, or does it blur to grey mush?
**Greyscale** — does hierarchy survive with no colour? If not, colour is carrying structural work.
**5-second** — show the hero for 5s; can someone say what the company does?
**One-thing** — name the single most important element per screenful.
**Real content** — longest name, missing image, empty state, 3 items and 30 items.
**Mirror** — flip the layout horizontally; composition problems you've gone blind to reappear.
**50% zoom scroll** — rhythm across the whole page: six identical rows, or actual variation?
**Keyboard-only** — tab through everything: focus states, order, traps.
**Contrast** — text ≥4.5:1, large text ≥3:1, UI and focus indicators ≥3:1.

And the numbers that decide it: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1, target size ≥24×24px (design to
44–48), JS ≤400 KB gz.

---

## Notes for this repo

- §8's ranking (layout map and tone rhythm over colour) is the concrete form of the art-direction
  rule in `CLAUDE.md`, and what `sectionStyles` exists to express.
- §3's "every background token ships its `on-` foreground" is a theme-contract rule — a bundle that
  defines a surface without its text token will pass the schema and fail on the page.
- §9's "never gate content on a reveal" is the `clip-path: inset(0 0 100% 0)` gotcha already in
  known gotchas, stated as the general rule rather than the one instance.
- The grain/texture and asymmetry moves in §8 are theme-level, not content-level — they belong in
  `theme.json` tokens and `sectionStyles`, never as raw values in `site.json`.

---

## Sources

1. [Web design trends for 2026: kinetic type, broken grids and the return of visual personality](https://elements.envato.com/learn/web-design-trends) — Envato
2. [Web Design Trends 2026: What Actually Held Up After Six Months](https://studiomeyer.io/en/blog/webdesign-trends-2026-reality-check) — StudioMeyer
3. [Web Design Trends 2026: Tactile Brutalism & Invisible Architecture](https://fireart.studio/blog/the-best-web-design-trends/) — Fireart Studio
4. [Micro-Interactions: Timing, CSS, and INP](https://socialanimal.dev/blog/micro-interactions-web-design/) — Social Animal
5. [CSS Micro Animations & Micro-Interactions: Complete Guide 2026](https://www.skillvalix.com/blog/css-animations-micro-interactions-guide) — SkillValix
6. [Brutalist Web Design 2026: When It Works, When It Fails](https://brainy.ink/paper/brutalist-web-design-2026) — Brainy Papers
7. [Bento Grid Design: A 2026 Guide to Layouts and Spacing](https://brainy.ink/paper/bento-grid-design-guide) — Brainy Papers
8. [10 tips to win a Site of the Day on Awwwards](https://www.elias.studio/en/blog/post/10-conseils-pour-gagner-un-site-of-the-day-sotd-sur-awwwards) — Elias Studio
9. [10 Award-Winning Websites of 2026, Judged](https://www.hontran.dev/blog/best-award-winning-websites-2026) — Hon Tran
10. [Notes from "Refactoring UI"](https://gist.github.com/selcukcihan/b9418596a98abfcd4bbc622550820cc5) — Wathan & Schoger, summarised
11. [How to customize a website template: 5 tips](https://www.techradar.com/pro/website-building/how-to-customize-a-website-template-5-tips) — TechRadar
12. [How to Customize Website Templates to Look Like They Were Designed From Scratch](https://showit.com/website-tips/how-to-customize-website-templates/) — Showit
13. [Top Web Design Trends for 2026](https://www.figma.com/resource-library/web-design-trends/) — Figma
14. [The 11 Biggest Web Design Trends of 2026](https://www.wix.com/blog/web-design-trends) — Wix
15. [Elevation — Material Design 3](https://m3.material.io/styles/elevation) — Google
16. [AI Design Slop: 16 Patterns That Out Your App as Vibe-Coded](https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it) — Developers Digest
17. [AI slop: 8 signs a website was generated by AI](https://tenex.studio/en/blog/ai-slop-ui-8-signes/) — TeneX Studio
18. [AI Slop Web Design: Complete Guide to Spotting and Fixing Generic Websites (2026)](https://www.925studios.co/blog/ai-slop-web-design-guide) — 925 Studios
19. [Why Every AI-Built Website Looks the Same (Blame Tailwind's Indigo-500)](https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p) — DEV
20. [Why AI-generated UI all looks the same (and how to fix it)](https://slicer.dev/blog/why-ai-generated-ui-looks-the-same) — Slicer
21. [Design Systems ♡ Lovable, Bolt, V0 and Replit](https://www.designsystemscollective.com/design-systems-lovable-bolt-v0-and-replit-50a0a197bc35) — Design Systems Collective
22. [Why Do Most AI-Generated Websites Look the Same?](https://shuffle.dev/blog/2026/01/why-do-most-ai-generated-websites-look-the-same/) — Shuffle
