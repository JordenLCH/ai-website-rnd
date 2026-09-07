# How designers actually design a website

*A mentoring guide — what happens between "here's the brief" and "here's the page", the craft
moves that separate a junior from a senior, and a learning path that produces them.*

Companions: `the-pre-ai-web-studio.md` (the process and role rules),
`choosing-sections-and-motion.md` (what sections to use, when to animate).

---

## 1. The thing nobody tells juniors first

Designing is not drawing. It is **making a ranked sequence of decisions, each one narrowing the
next.** The drawing is what a decision looks like after it has been made.

The decisions, in the order they actually get made:

```
Who is this for, and what must they do?      ← content strategy
  What must be said, in what order?          ← IA + section selection
    What is most important on this screen?   ← hierarchy
      How is that importance expressed?      ← scale, weight, space, position, colour
        What system makes it repeatable?     ← grid, type scale, tokens, components
          What does it feel like?            ← art direction: type pairing, imagery, tone, motion
```

Juniors typically start four rows down and work upward, which is why their pages look decorated
rather than designed. **Never open the canvas before you can say, in one sentence, what the page's
job is and what the single most important element on it is.**

---

## 2. Sitting down to a blank canvas: the actual sequence

This is the working session, not the project plan. Roughly a day for a key page.

### Step 1 — Re-read the content, out loud (20 min)
Not the brief — the *copy*. Longest headline, shortest headline, the product name that's 47
characters, the testimonial with no attribution. Layout decisions made before reading the content
get undone by the content.

Output: a list of the constraints the content imposes. *"Three of five services have no photo."*
*"The main headline is 9 words, the sub is 40."*

### Step 2 — Gather reference, then deliberately go elsewhere (30–45 min)
Collect 15–25 references — and not just websites. Book covers, signage, packaging, magazine
spreads, dashboards, transit maps. Mark what specifically works in each: *the measure*, *that rule
weight*, *the way the caption sits under the image*.

Then look at the client's three closest competitors and write down what they all share. That shared
thing is the **default of the category** — and it's what you must not do, or the site is
indistinguishable at a glance. This is the single most reliable way to avoid a templated result.

### Step 3 — Name the direction in three adjectives (10 min)
Not "modern, clean, professional" — those are the null adjectives, they describe every site. Force
specificity, and make one adjective slightly uncomfortable:

- *quiet, precise, expensive* → thin rules, huge margins, small type, one accent
- *loud, industrial, blunt* → heavy condensed caps, tight leading, hard edges, no radius
- *warm, hand-made, unhurried* → generous leading, off-grid photos, one serif doing all the work

The adjectives are a contract. Every later decision gets tested against them: *does a 24px radius
say "precise"? No — it says "friendly". Change it or change the adjective.*

### Step 4 — Grid and type scale, before any composition (30 min)
Decide: column count per breakpoint, page margin, gutter, spacing scale (4 or 8px base). Decide the
type scale as a ratio with 5–7 steps, each with line-height and max measure. Pick the display and
body faces here.

This is boring and it is the difference. **A designer with a system spends their time on
composition; a designer without one spends it renegotiating padding forever.**

### Step 5 — Design one key screen, plus one hard screen (2–4 hrs)
The key screen is usually the hero + first two sections. The hard screen is whatever is densest —
a spec table, a pricing comparison, a form. Do them together, because a system that survives both
is a real system; a system proven only on a hero collapses in week 3 of build.

### Step 6 — Extend, don't invent (rest of the day)
Every remaining section is assembled from what steps 4–5 established. **The moment you need a value
that isn't on the scale, stop.** Either the scale is wrong (fix it globally) or you're decorating.

### Step 7 — The sweep
Zoom to 50%, scroll the whole page. You're checking rhythm, not detail: do sections alternate in
density and tone, or is it six identical rows? Is there one obvious focal point per screenful?

---

## 3. The craft moves that separate junior from senior

These are learnable, and they are most of the visible gap.

**Space is grouped, not distributed.** Related things sit closer than unrelated things — always.
The gap between a label and its input must be smaller than the gap to the next field. Junior work
uses one uniform gap everywhere, which makes the reader do the grouping work.

**Whitespace is a budget, spent unevenly.** Sections that matter get more air around them. Uniform
padding on everything says everything matters equally, i.e. nothing does.

**Fewer alignments.** Count the distinct vertical alignment lines on your page. If it's more than
3–4 per screen, tidy it. Most "messy but I can't say why" comes from six near-alignments that
aren't quite the same.

**Optical over mathematical.** Centred text in a button often needs a pixel of adjustment; a
triangular play icon must be nudged right to *look* centred; capital letters and round letters sit
differently against a baseline. Trust the eye over the number.

**Hierarchy by one channel at a time.** To emphasise, change *one* of: size, weight, colour,
space, position. Juniors change all five at once — bigger, bolder, brighter, boxed, centred — and
the page ends up with five competing focal points.

**Contrast is created by restraint elsewhere.** A single 72px headline is dramatic on a page of
16px text. On a page where everything is 24–48px, nothing is.

**Colour: neutrals do the work.** 90% of the pixels are neutral surfaces and text. Pick the neutral
deliberately — a grey biased slightly toward the accent hue reads as chosen; pure #808080 reads as
default. Use the accent in one or two places per screen, not fifteen.

**Type pairing rule of thumb:** high contrast between the two faces (a grotesque display + a serif
body), or the same superfamily in two widths. What fails is two faces that are *nearly* the same —
it looks like a mistake rather than a decision.

**Set the measure, then everything else.** Body text at 45–75 characters determines your content
column width, which determines the grid, which determines everything. Designers who set the width
first and the type after end up with 110-character lines.

**Images are cropped, not placed.** Choose the crop for what it does compositionally — where the
subject's eyeline points, where the negative space falls so text can sit in it. A rectangle filled
with a photo is not a design decision.

**Borders, fills, radii and shadows are separation devices — spend them by role.** If every block
has all four, hierarchy is flat. Lift the one element that needs lifting.

**Edges and rhythm.** Content should relate to the page edge consistently. A rule that's wider than
the text it separates, a card that breaks the margin for no reason — these read as errors even to
people who can't name them.

---

## 4. How a design gets reviewed (teach juniors to self-review first)

Run these before showing anyone. They catch ~80% of what a critique would say.

| Test | How | What it exposes |
|---|---|---|
| **Squint test** | Blur your eyes or zoom to 25% | Whether the focal point is actually focal. If everything blurs to grey mush, hierarchy failed |
| **Greyscale test** | Remove all colour | Whether hierarchy survives without colour. If it doesn't, colour is carrying work that structure should |
| **5-second test** | Show the top of the page for 5s, ask what the company does | Whether the hero states the offer |
| **The one-thing test** | Name the single most important element per screenful | If you can't, neither can the visitor |
| **Real-content test** | Longest name, missing image, empty state, 3 items and 30 items | Whether the layout is a design or a coincidence |
| **Mirror it** | Flip the layout horizontally | Composition problems you've gone blind to |
| **Print at 50%** | Or view the whole page zoomed out | Rhythm across the page: repetition, density, tone changes |
| **Keyboard-only pass** | Tab through it | Focus states, order, traps |
| **Contrast check** | In-tool contrast plugin | Failures that are cheap now and a rebrand later |

**The critique format worth teaching** (works in both directions):

1. *What is this trying to do?* — restate the goal, so the critique is against the goal, not taste.
2. *What's working, and specifically why.*
3. *Where does it not achieve the goal?* — describe the **symptom**, not the prescription.
   "My eye lands on the image before the headline" beats "make the headline bigger".
4. *One question, not one instruction.* "What made you choose the serif here?" surfaces reasoning.

And for the person receiving: **the symptom is data, the prescription is opinion.** Accept the
symptom, then solve it your own way.

---

## 5. Junior mistakes, and the fix

| Symptom | Root cause | Fix |
|---|---|---|
| "It looks fine but not designed" | No system — every value nudged individually | Impose a spacing and type scale, redo it on the scale |
| Everything is a card with a shadow | Separation devices used as default styling | Remove all shadows, add back only where z-relationship is real |
| Page reads as a list of equal blocks | Uniform section height, padding and structure | Vary density and tone; alternate section shapes |
| Text is hard to read but "looks nice" | Measure too long, leading too tight, contrast too low | 45–75ch, 1.5–1.6 line-height, ≥4.5:1 |
| Dozens of tiny inconsistencies | Copy-pasting rather than reusing components | Build components; forbid one-off values |
| Design collapses when built | Only one width designed, no states | Design 2 widths + all 5 interaction states + empty/error |
| Looks like every other site in the category | First idea taken, no divergence step | Do the competitor-overlap exercise (§2 step 2) |
| Client can't say why they don't like it | Design was never framed against the goal | Present with the goal, the constraints, and the reasoning |
| Loads slowly, looks great in the file | Six webfonts, uncompressed hero, no budget | Font subset, 2 faces max, image budget, measure in the field |

---

## 6. A learning path that works (roughly 12 weeks, part-time)

**Weeks 1–2 · See properly.**
Deconstruct one well-designed site per day. Screenshot it, then annotate: grid columns, type scale
(measure the sizes), spacing values, how many alignments, where the accent is used, how many
distinct components. Write one paragraph on *why* it works. Twenty of these teaches more than
twenty tutorials.

**Weeks 3–4 · Copy work, deliberately.**
Rebuild three sites you admire, pixel-close, in code or Figma. Not to publish — to feel the
decisions. This is standard practice in every other visual craft and skipped in most design
education. You learn what 96px of section padding actually feels like.

**Weeks 5–6 · Typography alone.**
One page, one typeface, black on white, no images, no colour. Make it beautiful with size, weight,
space and measure only. Then do it again with a second face. This exercise fixes more bad design
than any other single thing.

**Weeks 7–8 · Systems.**
Build a small design system: 6 type steps, spacing scale, neutral ramp + one accent, 8 components
with all five states. Then build two visually different pages from it *without adding new values*.
The constraint is the lesson.

**Weeks 9–10 · Real content, real constraints.**
Redesign a real local business site — one with bad photos, too much copy and a legal disclaimer
that must appear. Redesigns of Airbnb are portfolio theatre; a plumber's site with 14 services and
three usable photos is the actual job.

**Weeks 11–12 · Ship in the browser.**
Build one of your designs as a real, responsive, accessible page. Hit ≥4.5:1 contrast, full
keyboard operation, LCP ≤2.5s on a throttled connection. Designers who have built a page design
differently — and better — forever after.

**Ongoing, forever:** run one usability test a month, on anything, with five people. Watching a
stranger fail on something you thought was obvious is the fastest correction available.

### Reading, in the order it's actually useful

1. **Refactoring UI** — Wathan & Schoger. The most direct route from "fine" to "good".
2. **Practical Typography** — Butterick, free online. Read the "Summary of key rules" first.
3. **Don't Make Me Think** — Krug. Short; the usability baseline.
4. **NN/g articles** — Nielsen Norman Group. The heuristics, then whatever matches your current problem.
5. **Laws of UX** — Yablonski. Names the psychology (Fitts, Hick, Miller, von Restorff) you're already using.
6. **Grid Systems in Graphic Design** — Müller-Brockmann. Where the grid discipline comes from.
7. **The Elements of Typographic Style** — Bringhurst. Slow, worth it, read a chapter at a time.
8. **web.dev + MDN** — the performance and accessibility reality your design has to survive.
9. **Material 3 / Apple HIG** — read as *worked examples of systems*, not as rules to copy.
10. **Inclusive Components** — Heydon Pickering. How accessible components are actually built.

### Daily and weekly drills

- **Daily, 15 min:** redraw one component you saw today (a nav, a pricing card, a table row) from
  memory, then compare.
- **Weekly:** one "constraint" page — no colour, or one typeface, or no images, or must fit one screen.
- **Weekly:** critique someone else's work using the four-step format. Articulating why is how
  taste becomes transferable.
- **Monthly:** revisit something you made three months ago and list what you'd change. If the list
  is empty, you've stopped progressing.

---

## 7. What progression actually looks like

Observable behaviours, not years.

**Junior** — asks *what should I make?*; designs the happy path at one width; changes five things
to emphasise one; explains choices as "it looks better"; presents screens.

**Mid** — asks *what problem is this solving?*; designs states and breakpoints; builds and reuses a
system; explains choices against the goal; presents the reasoning with the screens; can say what
they'd cut if the deadline halved.

**Senior** — asks *should this page exist?*; changes the brief when the brief is wrong; designs the
system others work inside; can produce three genuinely different directions and argue against their
own favourite; makes the trade-off explicit ("this is 200ms slower, here's what it buys"); their
work is legible to the developer without a meeting.

The one habit that moves someone along fastest: **make the reasoning explicit, in writing, every
time.** A design you can defend in three sentences is a design you can improve. A design you can
only point at is a design you got lucky with.

---

## 8. Borrowing from mature systems — Material 3 as the worked example

Read a big design system as a *worked example of decisions*, not a rulebook to copy. Material 3 is
the most completely documented one, so it is the best teaching object — its numbers are Android
dp, but the reasoning transfers directly to CSS.

### 8.1 Elevation and shadow — the part everyone gets wrong

M3 defines **six elevation levels**, each a dp distance on the z-axis:

| Level | dp | Typical use |
|---|---|---|
| 0 | 0 | Flat components — filled buttons, outlined cards, the page surface |
| 1 | 1 | Elevated cards, bottom sheets at rest |
| 2 | 3 | Navigation bar, menus |
| 3 | 6 | Dialogs, FAB — things overlaying everything else |
| 4 | 8 | Transient raised states (e.g. a component being dragged toward the top) |
| 5 | 12 | Rare; the highest transient state |

The important shift from Material 2: **elevation is expressed by tone first, shadow second.**

- **Tonal elevation** — a raised surface uses a *lighter/more prominent surface colour*, not a
  shadow. M3 ships five surface-container roles for exactly this: `surface-container-lowest`,
  `-low`, `surface-container`, `-high`, `-highest`. Higher container = more prominent = reads as
  raised. It is theme-aware, works with dynamic colour, and costs nothing to render.
- **Shadow elevation** — light and blur. Effective in light theme and over busy backgrounds, weak
  in dark theme (a shadow on near-black is nearly invisible, which is why dark mode elevation must
  be tonal).
- **Combined** — both, for the few elements that need real separation.

> **M3's own guidance: prefer tonal elevation. Use shadow (and scrims) only for elements that need
> more focus, or where overlapping elements would otherwise blend together.**

Practical translation to a web page:

- Default to **surface steps** — a ramp of 3–5 background tones — for panels, cards and sticky bars.
  Shadow is reserved for things that genuinely float above the page and can be dismissed: menus,
  dialogs, popovers, toasts, drag states.
- One shadow per z-relationship, not one per component. If your page has four shadow values and
  three of them are on non-floating elements, delete those three.
- A shadow should be **larger and softer the higher the element**, with a subtle ambient layer plus
  a directional key layer. A single hard `0 2px 4px rgba(0,0,0,.5)` on everything is the tell.
- In dark theme, **raise the surface, don't deepen the shadow.**
- Shadow is not decoration and never a border substitute. Border = boundary. Shadow = distance.
  Fill = grouping. Radius = softness. Four devices, four different jobs.

### 8.2 State layers — how M3 handles hover/focus/press

Instead of hand-picking a hover colour per component, M3 overlays the *content* colour on the
surface at a fixed opacity:

| State | Opacity of the state layer |
|---|---|
| Hover | 8% |
| Focus | 10% |
| Pressed | 10% |
| Dragged | 16% |

One rule, every component, both themes, automatically correct contrast. This is the pattern worth
stealing wholesale: **derive interaction states from tokens, don't design them individually.**
Focus additionally gets a visible indicator (≥3:1 contrast) — the state layer alone is not a focus
indicator.

### 8.3 Shape, size and motion scales

- **Shape scale:** none 0 · XS 4 · S 8 · M 12 · L 16 · XL 28 · full (pill). Radius is assigned *by
  component role* — a small chip and a large sheet do not share a radius. Pick 3 of these steps for
  a website, not all seven.
- **Touch targets:** M3 minimum **48 × 48 dp**; Apple HIG **44 × 44 pt**; WCAG 2.2 AA floor
  **24 × 24 px**. Design to 44–48; treat 24 as the legal minimum, not the target. The target can be
  larger than the visible control — pad the hit area, don't inflate the icon.
- **Motion tokens:** durations run `short1–4` (50/100/150/200 ms), `medium1–4` (250–400 ms),
  `long1–4` (450–600 ms), `extra-long1–4` (700–1000 ms), paired with named easings (*standard* for
  ordinary transitions, *emphasized* for the one moment that should feel expressive, plus
  accelerate/decelerate variants for exits and entrances). Same principle as §B of
  `choosing-sections-and-motion.md`: **durations are tokens assigned by role, not numbers picked
  per animation.**

### 8.4 Colour roles, not colour values

M3 names colour by *role and pairing*: `primary` / `on-primary`, `primary-container` /
`on-primary-container`, `surface` / `on-surface`, `surface-variant`, `outline`, `error` /
`on-error`. Every background role ships with the foreground role guaranteed to be legible on it.

Two things to take from this even on a small site:

1. **Always define the `on-` pair.** A background token without its text token is how unreadable
   theme switches happen.
2. **Semantic colours (error/warning/success) are a separate axis from the brand accent.** Sharing
   them means an error state that reads as branding.

### 8.5 What *not* to copy

- Don't adopt M3's visual look (the pill buttons, the tonal palette, the 28px radius) unless it
  suits the client — that's the category-default trap from §2, applied at system scale.
- Don't import the whole token set for a five-page marketing site. Take the *structure* — role
  names, paired foregrounds, scales by role — and keep the values yours.
- Component-library defaults are a starting point for a product UI, not an art direction. A site
  that looks like unmodified Material, Bootstrap or shadcn has had no art direction applied.

### 8.6 The transferable best practices, condensed

| Practice | Because |
|---|---|
| Prefer tonal/surface steps over shadow for depth | Works in both themes; cheap; doesn't flatten hierarchy |
| Reserve shadow for genuinely floating, dismissible things | Shadow means distance, not importance |
| Raise the surface in dark mode, don't deepen the shadow | Shadows barely read on dark grounds |
| Derive states from a fixed overlay opacity | One rule beats per-component guesswork |
| Assign radius, duration and elevation *by role* | Scales exist so values stop being opinions |
| Pair every surface token with its `on-` foreground | Guarantees contrast survives theme changes |
| Keep semantic colour separate from brand accent | Otherwise error states read as branding |
| Design targets at 44–48px, not the 24px legal floor | Fitts's law; thumbs aren't cursors |

Sources: [Elevation — Material Design 3](https://m3.material.io/styles/elevation),
[Material 3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3),
[material-web elevation docs](https://github.com/material-components/material-web/blob/main/docs/components/elevation.md).

---

## Notes for this repo

- §2 step 2 (find the category default, then don't do it) is the manual version of the
  `fleet_siblings` divergence check — overlap above ~0.7 means you landed on the category default.
- §3's "hierarchy by one channel at a time" and "neutrals do the work" are the concrete form of the
  rule that colour carries the least identity; layout map and tone rhythm carry the most.
- §4's greyscale and squint tests are the cheapest QA available on a generated page, and both work
  on a screenshot.
