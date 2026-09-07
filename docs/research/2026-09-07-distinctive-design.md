# Distinctive design vs. templated / AI-slop — research findings

Scope: what makes a site read as bespoke, current tells of AI/template design, how good
template systems get variety, what token sets mature systems use, and the vocabulary for
page architecture. Findings feed the block-catalog + theme-token generator in this repo.

Convention: **[FACT]** = stated by a cited source. **[JUDGEMENT]** = my synthesis/opinion,
flagged so it can be argued with.

---

## 1. Ranked levers, cost to implement in a token+block system

Ranked by how much perceived-identity change per unit of implementation effort — highest
leverage first.

### 1. Layout selection per section (not just per page) — very high leverage, low cost
**[JUDGEMENT]** This repo already has a layout-map divergence score against sibling sites,
which is the right instinct. The lever is discrete choice (which layout for "what comes after
hero"), not a continuous token — so it costs a decision table, not new CSS. Frank Chimero's
"Web's Grain" argues the web has no fixed canvas; distinctive sites are the ones that treat
each section as its own composition problem rather than reusing one box shape everywhere
[FACT, frankchimero.com/blog/2015/the-webs-grain]. Cost: near-zero marginal (catalog already
has variants); the leverage comes from *forcing* the generator to justify each section's
layout choice against its neighbours, not just its own content.

### 2. Contrast strategy (not colour hue) — high leverage, low cost
**[FACT]** The distinctive-feeling brands analysed (Stripe, Linear, Vercel) share "black on
white, white on black, nothing muddy in between" as a named principle, deployed with a single
accent colour against an otherwise monochrome base [pixeldarts.com]. **[JUDGEMENT]** This
means *contrast ratio and colour-use discipline* (how many colours appear per section, how
saturated the accent is against a neutral field) carries more identity than the hue itself —
which is nearly free to encode as a rule ("max 1 accent colour visible per fold") layered on
top of existing colour tokens, no new tokens required.

### 3. Whitespace/density as a deliberate dial — high leverage, already partially built
**[FACT]** "Take the spacing that feels like enough, then double it" is cited as one of the
four Stripe/Linear/Vercel principles [pixeldarts.com]. This repo's density gate (words/nodes
per section) already targets this. **[JUDGEMENT]** The gap: density is currently pass/fail
against an average; it should instead be a per-section *dial* the art-direction step sets
deliberately (tight/editorial vs. loose/breathing) and varies across sections — uniform
density across a whole site is itself a tell of an unconsidered choice.

### 4. Type scale ratio and pairing — medium-high leverage, low-medium cost
**[FACT]** Type scales are built from a base size and a ratio (Minor Third 1.2, Major Third
1.25, Perfect Fourth 1.333, etc.), and design-token systems increasingly encode the ratio
itself as a token, not just resolved sizes [penpot.app/blog, cieden.com]. **[JUDGEMENT]** A
system exposing only resolved font-size tokens (as this repo's 39 do, presumably) cannot let
a generator express "tight, high-contrast hierarchy" vs. "generous, editorial hierarchy" — the
*ratio* is what a designer would name as the decision. Adding a scale-ratio token (plus a base
size) is cheap and directly answers "what would a designer call this choice."

### 5. Typeface choice as a stated decision — medium leverage, zero cost, easy to get wrong
**[FACT]** "The tell is not that Inter is bad, it is that Inter unchosen signals nobody made a
typography decision" [925studios.co]. Refactoring UI names font, border-radius and colour as
the three choices to make deliberately and early to establish personality
[dev.to/christianmay21 on Refactoring UI]. **[JUDGEMENT]** Cost is zero — this is a prompting/
skill-guidance fix, not a schema change: require the art-direction step to name *why* a
typeface was picked relative to the alternatives it discarded, the same way the skill already
requires four art directions with the likeliest discarded.

### 6. Motion restraint and named easing — medium leverage, medium cost
**[FACT]** Mature systems tokenise motion as duration + easing curve + property, and treat
easing choice ("playful springy" vs. "soft subtle") as a brand-personality decision the same
way colour is [designsystemscollective.com, atlassian.design/foundations/motion]. This repo's
39 tokens are described as static CSS custom properties; there is no evidence of motion tokens
in the questions asked, so this is likely a genuine gap. Cost: medium — needs 2-3 tokens
(duration scale, one or two easing curves) plus block-level rules for what may animate, but
pays for itself because motion is one of the harder things for a human to eyeball-copy from a
brief, so it's an area where LLM output currently defaults to either nothing or a generic
fade/slide.

### 7. Editorial grid / asymmetry as a per-page structural choice — medium leverage, higher cost
**[FACT]** 2026 design commentary describes a shift "toward more expressive compositions —
editorial grids, type-first heroes, asymmetry, stacked narratives, cinematic framing" as a
reaction against centred, templated hero patterns [lexingtonthemes.com]. Classic grid theory
(breakouts reserved for dominant images/pull-quotes) gives a vocabulary for *when* to break
the grid, not just that one should [awwwards.com/inspiration/editorial-layout]. **[JUDGEMENT]**
This is more expensive than the above because it requires block/layout variants that support
off-grid image bleeds, column-span breaks and pull-quote treatments — real component work, not
a token. Worth doing but it's a catalog expansion, not a theme change.

### 8. Copy register and specificity — high leverage, cannot be tokenised
**[FACT]** "Weightless headline copy" ("Build faster. Ship smarter") is named as a distinct
AI-slop tell independent of visual design [925studios.co]. **[JUDGEMENT]** This is squarely in
the generator's hands already (it writes copy), so the lever is a skill instruction, not a
schema change: forbid verb-adverb headline templates, require the headline to contain a
concrete noun from the brief that a competitor's headline could not also claim.

---

## 2. Concrete, current slop tells (candidates for validator warnings / skill guidance)

All of the following are **[FACT]**, sourced from designer/practitioner-adjacent commentary on
2025-2026 AI-generated sites (cited inline), not generic listicles:

- **Purple/indigo gradient hero or CTA.** Traced to Tailwind's `bg-indigo-500` default,
  "the single loudest AI tell in 2026" [925studios.co; dev.to/alanwest].
- **Inter/Roboto/Manrope/Poppins as the unstated default typeface.** Not bad fonts — the tell
  is the *absence of a stated reason* for picking them [925studios.co].
- **Three (or four) rounded cards in a row, each with a thin-line icon, under a feature
  heading.** Named as "the dominant feature section pattern" in AI-generated pages
  [925studios.co; prg.sh].
- **Uniform border-radius applied to every surface** (buttons, cards, inputs, modals) —
  reads as "mechanically assembled" once every component shares the exact same radius
  [dev.to/alanwest via search synthesis, corroborated by 925studios.co card pattern].
- **Soft drop-shadows at ~0.1 opacity on everything**, mirroring "what CSS animation
  tutorials teach first" rather than a deliberate elevation system [prg.sh].
- **Monospace for small labels/numerals with no other monospace use on the page.** This
  repo's own three-agent test found all three independently reached for it — consistent with
  2025-2026 commentary that monospace is trending specifically because it reads as
  "structured/technical/credible" by default, i.e. it's becoming the *new* safe choice, not a
  considered one [vistaprint.com/hub/font-trends; artcoastdesign.com]. **[JUDGEMENT]**: treat
  monospace-for-labels as a flagged pattern the same way indigo gradients are — not banned,
  but require it be justified against an alternative, since it is on track to become as
  telling as Inter.
- **Weightless, interchangeable headline copy** ("Build faster. Ship smarter") that could
  belong to any competitor in the category [925studios.co].
- **Generic, interchangeable line-icon sets** with no relationship to the specific product
  [925studios.co].
- **Category-wide convergence on "premium minimal"**: dark panels, clean grids, muted rounded
  everything — originally Stripe/Linear's *specific* solution, now copied context-free by
  companies with unrelated positioning [ssustudio.com; altersquare.io].

**[JUDGEMENT] — recommended validator-level checks**, ordered by how mechanically checkable
they are:
1. Flag if the same border-radius token is applied to >90% of bordered surfaces on a page
   (currently invisible to a JSON validator; would need to inspect resolved theme values against
   block usage).
2. Flag if the accent colour token's saturation/lightness places it in the indigo/violet
   hue band *and* it is the only non-neutral colour used — this is checkable purely from
   `theme.json` tokens without touching content.
3. Flag if monospace is present in the theme's font tokens but used only for labels/numerals
   and nowhere else — cross-reference token usage, not content.
4. Headline specificity is not mechanically checkable; keep as skill guidance ("headline must
   contain a fact from the brief a competitor could not also claim"), not a validator rule.

---

## 3. How good template systems achieve variety inside constraints

**[FACT]** Relume (Webflow/Figma component library, 3,000+ components) achieves apparent
per-project variety by separating a large *component* surface (many pre-built section layouts)
from a small, centrally-updated *style* surface (the Client-First style system): update the
style tokens once and every component reflows, but the component/layout choice itself is a
large enumerated set a human picks from per project [webflow.com/made-in-webflow, relume.ai].
This is structurally identical to this repo's block-catalog-plus-theme split.

**[FACT]** Framer and Webflow diverge on *where* the constraint lives: Webflow centres a class
system (change a class, every instance updates); Framer lets designers shape layout/type/
components/breakpoints more freely on a canvas without a class being the unit of change
[brixtemplates.com; diversekit.com — comparison-farm sourcing, treat as directional not
authoritative].

**[FACT]** Stripe's own documented position is that its distinctiveness is *not* a
transplantable visual system at all — "design is a relationship between form and content...
the moment you separate Stripe's form from Stripe's content, the magic evaporates" — and that
what actually differentiates it is unscalable practice (the CEO visiting customers' offices to
watch installs, an animation refined repeatedly until it read as "human") rather than a
token set [eleken.co/blog-posts/making-it-like-stripe].

**[JUDGEMENT] — what this implies for a token+block system**: the parameterised part
(component library + token resolution) is necessary but provably insufficient — Relume-built
sites still read as templated to a trained eye precisely because the component/layout choice,
not the token values, is what a designer would call "hand-set." The lever this repo controls
(art-direction sampling, divergence scoring against siblings) is aimed at the right target;
the gap is that it currently biases toward palette variation (cheap, tokenised) over layout/
copy variation (expensive, requires real judgement) because palette is what's easiest to
randomise.

---

## 4. Design tokens in practice — is 39 the right order of magnitude, and what's missing

**[FACT]** Mature design-token systems commonly cover: colour, typography (family, size,
weight, line-height), spacing, sizing, border/radius, elevation/shadow, opacity, grid, and —
increasingly — motion (duration, easing) and z-index [uxpin.com; design.dev; jisem-journal.com].
That's roughly 8-10 *categories*, which at even 3-5 values each (a spacing scale, a type
scale, a few radii) reaches 40-60 individual tokens quickly — so **39 tokens is a plausible
order of magnitude for a system covering colour+type+spacing+radius**, but is likely light if
it doesn't yet cover motion, grid, or elevation as separate categories.

**[FACT]** Modular type scales are commonly expressed as a *base size + ratio* pair (Minor
Third 1.2 through Perfect Fourth 1.333 and beyond), with the ratio itself increasingly treated
as a first-class token rather than baked into resolved sizes [penpot.app/blog;
cieden.com/book/sub-atomic/typography].

**[JUDGEMENT] — specific additions, ranked by what each newly lets a generator express:**

1. **Type-scale ratio token** (e.g. `--type-scale-ratio: 1.25`), separate from resolved
   sizes. Lets a generator express "tight/technical hierarchy" (1.125-1.2) vs. "loud/editorial
   hierarchy" (1.333-1.5) as one number instead of hand-tuning 6 size tokens toward an implicit
   ratio it can't name or reason about.
2. **A density/spacing-scale multiplier**, distinct from the base spacing unit — lets a
   generator dial "editorial and airy" vs. "dense and information-forward" per section (see
   lever #3 above) without redefining every spacing token.
3. **Motion tokens**: 1 duration scale (fast/base/slow) + 1-2 named easing curves. Lets a
   generator express restraint vs. energy as a brand trait, currently inexpressible if the
   token set is static-CSS only.
4. **A grid/column token** (column count + gutter, maybe a "breakout" width for full-bleed
   sections) — lets a generator express asymmetric/editorial layouts as data the block
   templates can consume, rather than needing a bespoke component per asymmetric layout.
5. **Border-radius as a *pair*, not a single value**: a "tight" radius (buttons/inputs) and a
   "loose" radius (cards/images), explicitly allowed to differ — directly counters the "same
   radius on everything reads as mechanical" tell [dev.to/alanwest].
6. **An elevation/shadow scale (2-3 steps)**, tokenised with named intent (resting, raised,
   overlay) rather than one flat shadow value repeated — counters the "soft shadow at 0.1
   opacity on everything" tell [prg.sh].

**[JUDGEMENT]**: colour and static type/spacing tokens carry the *least* identity precisely
because they're the easiest to randomise plausibly (per this repo's own CLAUDE.md: "Colour
carries the least identity"). The tokens above (scale ratio, density multiplier, motion,
grid/asymmetry support) carry more identity because they change *structure and rhythm*, which
is harder to get by chance and therefore harder for three independent agents to converge on —
which is exactly the failure mode described in this task's context.

---

## 5. Editorial/layout grammar — vocabulary for "what comes after the hero"

**[FACT]** Chimero's foundational framing: the web has no fixed canvas ("edgeless surface of
unknown proportions," closer to a Hockney photo-collage than a bounded painting), and text
gets *shorter* as it gets wider while images get *taller* — an irreducible tension a designer
manages rather than solves. Distinctive web design, in his framing, starts from assembling
content and letting size follow, rather than starting from a box [frankchimero.com/blog/2015/
the-webs-grain].

**[FACT]** Editorial-grid vocabulary treats "breakouts" (content escaping the main column
width) as reserved for a small number of deliberate moments — a dominant image, a pull-quote,
a folio-level typographic statement — not applied everywhere
[awwwards.com/inspiration/editorial-layout].

**[FACT]** Current (2026) commentary on what follows a hero describes a documented shift away
from "safe, centre-aligned" hero-then-cards patterns toward "editorial grids, type-first
heroes, asymmetry, stacked narratives, cinematic framing" [lexingtonthemes.com] — though this
source is closer to trend-commentary than a working designer's own account, so treat the
*direction* as corroborated by the brutalism/anti-design sources below but the specific list
as illustrative, not definitive.

**[JUDGEMENT] — a working vocabulary this repo's block catalog could reason in**, synthesised
from the above:
- **Rhythm**: does density/whitespace alternate section-to-section (tight → loose → tight) or
  stay flat? Flat rhythm is itself a tell.
- **Breakout frequency**: how many sections, if any, escape the base grid column width — and
  is it reserved (1-2 per page) or absent (0, which reads as timid) or constant (which reads
  as chaotic/brutalist by choice, a different but valid register).
- **Anchor vs. drift**: does the page have one dominant compositional idea the hero states and
  later sections vary (anchor), or is each section an independent template instance with no
  visual through-line (drift, the templated tell)?
- **Image role discipline**: environment vs. product-cutout vs. portrait vs. abstract-texture —
  already partially enforced by this repo's `imageKind` rule; the grammar point is that
  *mixing all four kinds across one page* reads as stock-photo grab-bag, not that any one kind
  is wrong.

---

## 6. What cannot be systematised and needs a human

**[FACT]**, per Stripe's own account: the things that actually produced its distinctiveness —
watching real customers, refining one animation until it felt human, building
personalisation into docs from real account data — are described explicitly as *not*
replicable visual systems but "deep user knowledge and meticulous craftsmanship"
[eleken.co/blog-posts/making-it-like-stripe].

**[JUDGEMENT], specific to this generator:**
- **Whether a headline claims something only this specific client could claim.** A validator
  can check a headline isn't empty or isn't a template phrase; it cannot verify the claim is
  true and specific without the brief being genuinely read and cross-checked, which is a
  judgement call each time, not a rule.
- **Whether the chosen art direction is actually the *least* likely one, honestly assessed.**
  The self-assessment-of-probability step this repo already uses is exactly right but is
  gameable by an LLM that rationalises after the fact; a human spot-check of "does this really
  feel like the tail, or did it just relabel the median" is likely still needed periodically.
- **Photograph selection and cropping** for a specific brand feel (the "atmospheric
  photography" Chimero notes as one of the web's recurring, legitimate patterns) — an
  `imageKind` tag can enforce category fit, not whether the *specific* photo has the right
  mood for this specific client.
- **Recognising when a "slop tell" is actually the right choice for this brief** (e.g. a
  fintech client for whom the Stripe-style monochrome-plus-one-accent register is genuinely
  correct, not lazy). A rule that penalises the pattern outright would be wrong there — this
  needs the reviewer to ask *why*, not just detect the pattern.

---

## Sources

- Frank Chimero, "The Web's Grain" (2015) — https://frankchimero.com/blog/2015/the-webs-grain/
- pixeldarts, "Four design principles behind Stripe, Linear, and Vercel" — https://www.pixeldarts.com/en/post/four-design-principles-behind-stripe-linear-and-vercel
- Eleken, "'Make It Like Stripe,' or Why Imitation Is a Tricky Design Strategy" — https://www.eleken.co/blog-posts/making-it-like-stripe
- 925 Studios, "AI Slop Fonts and Gradients: The Tells That Give Away AI Design" — https://www.925studios.co/blog/ai-slop-design-tells
- prg.sh, "Why Your AI Keeps Building the Same Purple Gradient Website" — https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website
- dev.to (alanwest), "Why Every AI-Built Website Looks the Same (Blame Tailwind's Indigo-500)" — https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p
- SSU Studio, "Why Every B2B SaaS Brand Looks the Same" — https://ssustudio.com/blog-why-b2b-saas-brands-look-the-same
- AlterSquare, "Why Your SaaS Looks Like Every Other SaaS (And How to Fix It)" — https://altersquare.io/why-your-saas-looks-like-every-other-saas-and-how-to-fix-it/
- Webflow (made-in-webflow), Relume Library style-guide page — https://webflow.com/made-in-webflow/website/relume-library-styleguide
- Relume — https://www.relume.ai/components
- Awwwards, "Editorial Layout" inspiration collection — https://www.awwwards.com/inspiration/editorial-layout
- Penpot blog, "Using design tokens for a proportional typographic scale" — https://penpot.app/blog/using-design-tokens-for-a-proportional-typographic-scale/
- cieden.com, "What are the different types of typographic scales?" — https://cieden.com/book/sub-atomic/typography/different-type-scale-types
- Design Systems Collective, "Not Just Colors and Fonts: Why Motion Tokens Belong in Every Modern Design System" — https://www.designsystemscollective.com/not-just-colors-and-fonts-why-motion-tokens-belong-in-every-modern-design-system-8a2dcdc00659
- Atlassian Design, Motion foundations — https://atlassian.design/foundations/motion
- dev.to (christianmay21), summary of Refactoring UI's early-decision advice (font, radius, colour) — https://dev.to/christianmay21/top-4-design-choices-you-should-make-before-building-a-website-according-to-refactoring-ui-2beo
- VistaPrint, "8 Fresh Font Trends 2026" (monospace resurgence) — https://www.vistaprint.com/hub/font-trends
- Toptal, "Brutalist Web Design, Minimalist Web Design, and the Future of Web UX" — https://www.toptal.com/designers/ux/minimalist-brutalist-web-design
- lexingtonthemes.com, "Stunning hero sections for 2026: Layouts, patterns" — https://lexingtonthemes.com/blog/stunning-hero-sections-2026

Lower-confidence / trend-commentary sources (used only for directional corroboration, not as
primary evidence): brixtemplates.com, diversekit.com, gapsystudio.com, ekwebtasarim.com,
oliverrevelo.com — these read as SEO content rather than practitioner writing; treat any claim
sourced only to them as weak signal.
