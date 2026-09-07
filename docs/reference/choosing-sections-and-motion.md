# Choosing sections, and when to animate

Companion to `the-pre-ai-web-studio.html`. That page covers the pipeline and the per-role
do/don't. This one goes deeper on the two decisions people ask about most, because both are
where generated pages most visibly differ from designed ones:

1. **Which sections a page gets, and in what order.**
2. **Whether a thing should move at all.**

---

# Part A — Choosing sections

## A1. The rule everything else hangs off

> **A section exists to answer exactly one question the visitor is already asking.**
> If you cannot write that question in one sentence, the section is decoration — cut it.

This is how designers avoid the two standard failures: a page assembled from whatever the
template offered, and a page that repeats the same claim in four different visual costumes.

Practical test, done before any layout: write the page as a list of questions, in the order a
real visitor asks them. That list *is* the section stack. Layout comes after.

## A2. The question ladder

A stranger works down this ladder. Sections map one-to-one onto rungs. Skipping a rung is where
bounce happens; answering one twice is where boredom happens.

| # | Visitor question | Section that answers it |
|---|---|---|
| 1 | What is this, in five seconds? | Hero — headline states the offer, not a slogan |
| 2 | Is it for someone like me? | Audience/segment strip, or problem statement |
| 3 | What problem does it solve? | Problem / before-after / pain framing |
| 4 | How does it actually work? | Steps, "how it works", product tour |
| 5 | What exactly do I get? | Feature detail, spec table, catalogue grid |
| 6 | Why should I believe you? | Proof: logos, testimonials, case study, data, credentials |
| 7 | How do you compare? | Comparison table, alternatives |
| 8 | What does it cost? | Pricing, quote request, "from £X" |
| 9 | What's the risk to me? | Guarantee, FAQ, security/compliance, returns |
| 10 | What do I do now? | CTA band, contact, booking, form |

**Rungs 1, 6 and 10 are mandatory on every commercial page.** Everything between is optional and
selected, not assumed.

## A3. Three inputs decide how many sections

Designers do not pick a length. Three facts pick it:

**Traffic temperature.** Cold traffic (ads, cold search) has not accepted the problem yet, so
rungs 2–3 are required and the page is long. Branded/returning traffic already accepted it —
those sections become friction, and the page shortens to hero → proof → action.

**Decision cost.** A £20 impulse purchase needs 4–6 sections. A £40k considered purchase or a
regulated service (legal, medical, insurance) needs 10–14, because every unanswered objection is
an exit.

**Content that actually exists.** No testimonials on file means no testimonial section — not a
placeholder, not an invented one. The brief is the constraint; a section with nothing true to put
in it is deleted, and the gap is reported to the client as something to collect.

## A4. Section inventory — use when / skip when

| Section | Question answered | Requires | Skip when |
|---|---|---|---|
| Hero | What is this? | One clear offer sentence + one action | Never skipped |
| Value trio | Why this over nothing? | 3 distinct benefits, not 3 features | Benefits are really one benefit restated |
| Problem / agitation | Do I have this problem? | A named, specific pain | Warm traffic; B2B where it reads condescending |
| How it works (steps) | What happens if I say yes? | 3–5 genuinely sequential stages | Steps are not sequential — then it's a feature list |
| Feature detail (alternating) | What do I get? | Real screenshots/photos per feature | Fewer than 3 features worth a paragraph each |
| Spec table | Does it fit my requirement? | Comparable attributes across items | Prose would be shorter |
| Catalogue grid | Which one do I want? | 4+ items, real images, real names | 1–3 items — use feature detail instead |
| Stats band | How big/proven is this? | Verifiable numbers with a source | Numbers are vanity or unverifiable |
| Logos | Who else trusted you? | Permission to use the marks | Fewer than 5, or unrecognisable to this audience |
| Testimonials | Do people like me succeed? | Attributed quote — name, role, company | Anonymous or written in-house |
| Case study | Does it work in my situation? | Situation → action → measured result | No measured result exists |
| Comparison | How do you differ? | Honest criteria, including where you lose | You'd have to misrepresent the alternative |
| Pricing | Can I afford it? | Real numbers or an honest "from" | Genuinely bespoke — replace with a quote flow |
| FAQ | What's my remaining objection? | Questions sales actually gets asked | Invented questions to pad the page |
| Team | Who am I dealing with? | Real people, real photos, real roles | Trust isn't personal to the sale |
| Locations | Where are you? | Address, hours, service area | Not location-bound |
| Logistics / process | What's the commitment? | Timeline, deliverables, terms | Already covered by steps |
| CTA band | Ready now? | One action, repeated wording | Fewer than ~2 screens since the last one |

## A5. Page recipes

Studio starting points, adjusted per brief — not templates to apply unread.

```
Home           Hero → Value trio → Proof strip → How it works → Feature detail ×2–3
               → Case study/testimonial → Objection (FAQ) → CTA band

Service/product Hero → Problem → Solution/how → Feature detail → Spec/comparison
               → Proof → Pricing/quote → FAQ → CTA

Pricing        Hero (plain) → Plan comparison → What's included detail
               → Proof → Pricing FAQ → CTA

About          Hero (statement) → Origin/story → Values in practice → Team
               → Credentials/certifications → Locations → CTA

Contact        Hero (minimal) → Form + direct channels side by side
               → Locations/hours → Response-time expectation

Case study     Hero (client + headline result) → Context → Challenge → Approach
               → Result with numbers → Client quote → Related work → CTA

Paid landing   Hero (matches the ad's promise word-for-word) → Problem
               → Offer → Proof → Objection → Single CTA. No nav. One action only.
```

## A6. Ordering rules

1. **Proof follows claim.** A testimonial lands only after the reader has been given something
   to doubt. Proof at the top of a page has nothing to support.
2. **Strongest proof goes above the first ask.** Whatever section contains the price or form,
   the best evidence sits immediately before it.
3. **Objections come last, before the final CTA.** FAQ near the top signals a difficult product.
4. **Repeat the action roughly every two screens** on a long page, using identical wording every
   time. Different wording reads as different actions.
5. **Alternate texture.** Never place two structurally identical sections back to back — two
   three-column grids in a row read as one long grid, and the second stops being read.
6. **Tone rhythm beats colour.** Contrast between sections (dense vs airy, dark vs light,
   image-led vs type-led) is what creates the sense of progress down the page. This is the single
   biggest lever on whether a page feels designed.
7. **One idea per section.** Two ideas means two sections, or one of them is filler.

## A7. Kill criteria

Delete a section when any of these is true:

- You cannot name the visitor question it answers.
- Another section already answers that question.
- The content would have to be invented to fill it.
- It exists because the template/reference site had one.
- Scroll analytics show <20% of visitors ever reach it *and* it isn't load-bearing.

## A8. How the choice gets validated

- **Content-first outline** — the question list, written in a doc, approved before wireframes.
- **Greyscale block model** — the stack drawn as unlabelled boxes; if the hierarchy reads with
  no copy and no colour, the structure is sound.
- **5-second test** — show the hero for 5s, ask what the company does and who for. Failures here
  are never fixed by sections 2–10.
- **Scroll depth + click maps** post-launch — sections nobody reaches get moved up or removed;
  the page gets shorter over its life, not longer.

## A9. Do & don't — section selection

| Do | Don't |
|---|---|
| Write the question list before opening a design tool | Start from a template's section menu and delete what doesn't fit |
| Let content that exists decide which sections exist | Add a Team/Blog/Testimonials section and fill it later |
| Repeat one CTA with identical wording | Offer three competing actions in one section |
| Vary section shape and tone down the page | Ship six alternating image-left/image-right rows |
| State the offer in the hero headline | Use a slogan as the hero headline |
| Report gaps back to the client as content to collect | Invent prices, stats, staff or reviews to fill a layout |

---

# Part B — Animation

## B1. The gate

Motion is allowed if it does **one** of these jobs. If it does none, cut it.

1. **Feedback** — confirms input was received (button press, toggle, form submit).
2. **State transition** — shows something changed and what it became (open/closed, added/removed).
3. **Spatial continuity** — shows where a thing came from or went, so the user keeps their model
   of the interface (a panel sliding from the edge it belongs to, a row expanding in place).
4. **Attention direction** — draws the eye to a change the user didn't cause (a toast, a
   validation error, an updated total).
5. **Atmosphere / brand** — the only decorative one. Legitimate, but budgeted: one moment per
   page, not one per section.

Everything else — the fade-up on every heading, the counter that ticks, the parallax on a
paragraph — fails the gate.

## B2. Timing and easing

| Motion | Duration | Easing | Note |
|---|---|---|---|
| Hover / focus feedback | 80–150 ms | ease-out | Must feel instant; >200 ms feels laggy |
| Small state change (toggle, checkbox, chip) | 150–250 ms | ease-out | |
| Element enters (dropdown, tooltip, toast) | 200–300 ms | ease-out (decelerate) | Fast start, soft landing |
| Element exits | 150–200 ms | ease-in (accelerate) | **Exits are faster than entrances** — nobody watches something leave |
| Panel / modal / drawer | 250–400 ms | ease-in-out | Larger travel earns more time |
| Full-page or shared-element transition | 400–600 ms | emphasised / custom curve | Above ~600 ms it reads as slow, not smooth |
| Ambient / looping | 3 s+ | linear or sine | Only linear is acceptable for loops and spinners |

Two corollaries designers use as sanity checks:

- **Distance sets duration, not taste.** A 20px move at 400ms looks broken; a full-screen panel
  at 120ms looks like a jump cut.
- **Never `linear` for anything a user triggered.** Real objects accelerate and decelerate;
  linear motion is the clearest tell of unconsidered animation.

## B3. Scroll-triggered reveals — the rules

The most abused effect on the marketing web. If used at all:

- **Small distance:** 8–24px of travel. More than that and the page feels like it's assembling
  itself while you read.
- **Short:** 200–400 ms, stagger ≤ 60 ms between siblings, cap the stagger chain at ~5 items.
- **Once.** Never re-animate on scroll back up.
- **Never gate content on it.** The resting state must be *visible*; the animation starts from
  visible and adds a small offset, never `opacity: 0` waiting on an observer. If JS fails, the
  observer never fires, or the element is already on screen at load, the content must still read.
- **Trigger early** (~10–20% visible), so the animation finishes before the element reaches
  reading position.
- **Above the fold: never.** The first screen should be complete at load.

## B4. Don't animate

- Body copy or anything the user is actively reading.
- Layout-affecting properties in a loop — animating `width`, `height`, `top`, `margin` forces
  layout on every frame. Animate `transform` and `opacity`; those run on the compositor.
- Anything that delays input. A 400ms animation before a menu is usable is a 400ms tax on every
  use, forever.
- More than one thing at a time in the same region — competing motion cancels the attention it
  was supposed to direct.
- Auto-rotating carousels. They move faster than reading and slower than clicking, and users
  scroll past them.
- Hover-only effects with no touch equivalent.

## B5. Accessibility and performance obligations

- **`prefers-reduced-motion: reduce`** — honour it. Reduce means *replace with a cross-fade or
  nothing*, not "slightly slower". Vestibular disorders make large parallax and zoom genuinely
  nauseating.
- **WCAG 2.2 · 2.2.2 Pause, Stop, Hide** — anything that moves automatically for more than 5
  seconds needs a control to stop it.
- **WCAG 2.2 · 2.3.3 Animation from Interactions** (AAA) — motion triggered by interaction should
  be disableable.
- **WCAG 2.2 · 2.3.1** — nothing flashes more than 3× per second.
- **INP budget** — animation work competes with input handling on the main thread. Keep animation
  off it: compositor-only properties, no layout thrash in scroll handlers, and no
  `will-change` left permanently on dozens of elements (each one costs memory).

## B6. Decision flow

```
Does this movement do one of the five jobs (B1)?
├─ no  → delete it
└─ yes → Is it user-triggered?
         ├─ yes → 80–300ms, ease-out in / ease-in out, transform+opacity only
         └─ no  → Does it interrupt reading?
                  ├─ yes → delete it
                  └─ no  → ≤400ms, starts from a visible state, plays once,
                           has a reduced-motion path, and there is no other
                           motion competing in the same region
```

## B7. Do & don't — motion

| Do | Don't |
|---|---|
| Animate `transform` / `opacity` | Animate `width`, `height`, `top`, `left` |
| Make exits faster than entrances | Use one duration for everything |
| Budget one orchestrated moment per page | Fade-up every section on scroll |
| Start reveals from a visible resting state | Park content at `opacity: 0` until an observer fires |
| Provide a reduced-motion path | Treat reduced-motion as an edge case |
| Use motion to explain where something came from | Use motion to prove effort was spent |

---

## Notes specific to this repo

- **Section choice is the generator's main lever.** Block *type* is what the SEO/AEO derivation
  reads (`Steps` → `HowTo`, `SpecTable` → `Product`, `Locations` → `LocalBusiness`), so picking
  the semantically correct block is both an editorial and a machine-readability decision. A11y and
  schema both degrade when a section is chosen for its shape rather than its meaning.
- **A6 rule 6 (tone rhythm) is what `sectionStyles` exists for.** Divergence between generated
  sites comes from the layout map and tone sequence, not the palette — consistent with the art
  direction rule in `CLAUDE.md`.
- **B3's "never gate content on it"** is the same bug already recorded in known gotchas:
  `clip-path: inset(0 0 100% 0)` collapses the observed box, so the reveal can never fire. Leaving
  a visible resting state prevents the whole class of failure, not just that instance.
