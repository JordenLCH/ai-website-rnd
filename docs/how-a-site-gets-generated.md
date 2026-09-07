# How a site gets generated

End-to-end: what a creator does, what the AI does, what the platform does, and where each
safeguard sits. Written 2026-09-07, after the first full audit of a generated site.

If you only read one thing: **a site is data, never markup.** Everything else follows from that.

---

## 1. The shape of a site

Three JSON files per client, in `content/<client>/`:

| File | Holds | Rule |
|---|---|---|
| `site.json` | `{ client, chrome: { header, footer }, pages: { <key>: { title, blocks: [] } } }` | No hex, no px, no font names. Content and structure only |
| `theme.json` | 39 core tokens + 8 structural, plus `sectionStyles` mapping variant slug → `{layout, tone, vars?}` | The only place appearance is decided |
| `org.json` | Legal name, registration, address, `sameAs`, credentials | Facts a model must never invent |

A block is `{ type, variant, props }`. `type` comes from a fixed catalog of 25. `variant` is an
**opaque editorial slug** — `hero/home`, never `hero/dark-overlay` — and the theme decides what it
looks like. That indirection is the whole architecture: swapping one JSON file re-skins every page
because no site contains a single hand-written style.

**Nav and Footer live in `chrome`, once per site.** Repeating them per page means five copies to
keep in sync and a header that can silently differ between pages.

### Why not just let the AI write HTML

Because the promise is *"ship a fix to a block and every site inherits it on rebuild"*, and that
promise is void the moment one site contains bespoke markup — nothing in the bundle would even
record that it had opted out. Every defect in §6 was fixed once, in one CSS file, and every site got
the fix on its next build. That only works because there is nothing else to fix.

There is deliberately **no raw HTML/CSS escape hatch**, including on the AI path. A block the
catalog cannot express is a catalog gap to close in-session, not a reason to open a hole.
`FreeSection` plus 20 typed primitives is the escape valve, and it is still validated JSON.

---

## 2. The nine stages

Checkpoints, not one long generation. Work that survives a checkpoint is never regenerated.

```
 1  intake             (human)  documents, org facts, brand colour
 2  content inventory  (AI)     words available + what the content breaks  ▸ human fills gaps
 3  sitemap            (AI)     category default named, then roles sampled ▸ human edits
 4  style tile         (AI)     type, colour, spacing on one sheet         ▸ human picks
                                + direction recorded as three adjectives
 5  key + dense page   (AI)     home *and* the most structured page        ▸ human corrects
 6  remaining pages    (AI)     applying the corrections
 7  design QA          (AI)     widths, extremes, greyscale, focus, targets ▸ human sees the list
 8  assets & facts     (human)  real photos, verified numbers
 9  hand off           (AI)     validate, package, upload
10  field feedback     (both)   p75 CWV + scroll depth → next rebuild
```

**The order is content → structure → look, never the reverse.** This is not ceremony. A visual
direction chosen before anyone knows how much copy each section carries is a guess, and the page
then gets bent to fit the guess. We measured it: three independent runs of one brief that picked art
direction first produced three palettes and *one* page structure, because the structure was fitted
to a look that was already locked, and the safe structure fits every look.

Four stages carry most of the value:

- **Stage 2, content inventory.** Total the words actually available per topic *before* designing.
  Under ~1,200 words of source material you cannot honestly fill more than a home page and two
  subpages. Say so then, not at stage 6 when the whole site exists.
- **Stage 4, style tile.** Show type, colour and spacing on one sheet — deliberately *not* a mocked
  page with lorem in it. A human shown a fake page judges the fake copy and the invented layout
  instead of the two decisions you are actually asking about.
- **Stage 5, the dense page.** The home page is a hero, a proof strip and a CTA — nearly any token
  set survives it. The system is only tested by the page carrying a spec table, a nine-item
  catalogue or a form, which is why both are written in the same pass. Every worst layout defect in
  §6 lived on a dense section that nothing had exercised.
- **Stage 7, design QA.** Validation proves the JSON is legal, not that the page works. See §6.

### Sampling, at two stages

The first thing a model proposes is the mode of its training data. So at **stage 3** (page
architecture) and **stage 4** (art direction), the AI generates four candidates with self-assessed
probabilities, **discards the likeliest**, and picks from the tail.

Stage 3 needed this as much as stage 4 and did not have it — which is exactly why three sites came
out as one site in three colourways.

### The category default, which divergence cannot see

`fleet_siblings` measures a new site against *ours*. It has no view of the client's own market, so a
bundle can be comfortably distinct from every site in the fleet and still be the fourth identical
site in its trade. Stage 3 therefore starts by naming what the client's three closest competitors
share — *hero photo of one product on white, three-up benefit trio, product grid* — and treating that
as a **do-not list** carried through stages 4–6.

This is the manual half of divergence, and it is the half a studio does first. Overlap above ~0.7
against the fleet says we repeated ourselves; the do-not list is the only thing that catches us
repeating the market.

### The direction, in words, before any values

Stage 4 records the chosen direction as three adjectives, what was rejected, and why —
`theme.direction`, a first-class optional field on the theme:

```json
"direction": { "adjectives": ["quiet", "precise", "expensive"],
               "rejected": ["warm editorial — undersells a specification-led buyer"],
               "why": "they sell on tolerance figures; restraint reads as confidence" }
```

It costs three lines and buys two things. Stage 7 audits the tokens against it — "precise" carried by
nothing, or contradicted by a 28px radius and a 600ms ease, is a finding. And the next session to
open this theme reads the intent instead of inferring it from the values, which is how a considered
theme drifts back to the default one token at a time. The validator flags a theme with no direction,
and flags *modern / clean / professional* as adjectives that rule nothing out.

---

## 3. What decides whether it looks generated

Ranked by identity carried per unit of effort. Teams reliably over-invest in the last one.

1. **Layout selection per slug** — which of a block's layouts each editorial role resolves to
2. **Tone assignment** — which sections go `inverse` / `accent` / `surface` rather than `default`
3. **Font pairing and display weight** — 800 vs 300 changes a brand more than any hue
4. **Structural tokens** — type-scale *ratio*, density multiplier, motion duration and easing,
   grid columns, breakout distance, the tight/loose radius *pair*, elevation steps
5. **Colour roles** — last, and least

Colour is the cheapest kind of variation because a model can randomise a hex code plausibly. Ratio,
rhythm and motion change the page's *structure*, which is much harder to fake.

**Density is the single largest quality lever.** Aim for 60+ words and 6+ content nodes per section,
700+ words per page. A section that fills a screen and carries forty words is what makes a generated
site read as an unfinished template. Measured in words per 1000px of rendered page:

| Build | words / 1000px |
|---|---|
| merryfair, before this work | 58 |
| merryfair-a / b / c | 121 / 125 / 135 |
| wungadv | 136 |

---

## 4. The safeguards, and what each one can actually see

Four layers. Each catches a class the others cannot.

**A. Schema (Zod, per block).** Wrong prop names, wrong types, out-of-range counts. Cannot see
anything about meaning or appearance.

**B. `renderer/src/validate-bundle.ts`** — the authoritative validator, imported by both the creator
CLI and the build farm. **Never two copies**: "valid locally, fails on publish" erodes trust in a
platform faster than any missing feature, and an editor that accepts what the generator would reject
is the same bug wearing a different hat. It checks:

- density per section and per page (AND thresholds, not OR)
- tone rhythm across a page
- cut-out images placed on inverse-tone grounds
- one photograph carrying four or more sections
- WCAG AA on six token pairs, from `theme.json` alone
- three mechanical slop tells: uniform *non-zero* radius, an indigo/violet accent on an otherwise
  neutral palette, monospace confined to labels
- whether the theme sets any structural tokens at all
- **page order, four rules a studio applies by eye** — the same shape twice in a row (two adjacent
  sections of one type and layout scroll as a single block, and the second stops being read); an ask
  placed ahead of all the evidence; a long page whose only action sits at the bottom; and one action
  worded three different ways across the site, which reads as three different offers
- **system habits a palette skips** — depth expressed only by shadow with no surface ramp (Material 3's
  rule after a decade of shadow-everything: raise the surface, keep shadow for things that float and
  can be dismissed — a shadow on a near-black ground is barely visible, so a dark theme with no ramp
  has no depth cue at all); no focus-indicator token, or one under 3:1 against either ground; a body
  measure outside 45–75ch
- **whether the direction was written down**, and whether its adjectives forbid anything

> **A rule that names a token ships in the same commit as the CSS that reads it.**
>
> Three checks — the focus indicator, the surface ramp and the body measure — each shipped asking a
> theme to set a token no stylesheet read. An author who followed the advice added a line that
> rendered nothing; an author who ignored it lost nothing. The surface-ramp rule fired on 6 of 6
> themes with no way to resolve it, which is how a validator teaches people to skim its output.
>
> The two halves live in different files and nothing links them, so they can ship apart and nobody
> notices until someone tries to act on the message. A grep-based test was tried and rejected: most
> rules name their token in code rather than in the message string, so it passed while covering
> almost nothing. Until a fourth instance appears, the guard is this sentence, not a test.

**C. Provenance.** Invented content is marked, not banned. Prose and captions are free; a figure,
price, date or testimonial not in the brief needs `"unverified": true` on the block. The preview
lists it, the build farm strips it from JSON-LD and `llms.txt`, and **publishing is refused** until
the list is empty. Google's 2026-07-24 fake-review policy makes this compliance, not hygiene.

**D. Design QA (stage 7), `renderer/tools/block-audit.js`.** Four widths (360/768/1280/1600),
content extremes *taken from the stage-2 constraints table* rather than invented, contrast on every
tone, and the page read with images off. The probe also reports:

- **tap targets** — under 24px is the WCAG 2.2 AA failure, under 44px is under every design system's
  own floor (M3 48dp, HIG 44pt). Inline links inside prose are exempt, as 2.5.8 exempts them
- **content hidden at rest** — text at `opacity: 0` or under a collapsing `clip-path`. A reveal that
  never fires leaves a section that validates, renders and says nothing; the rule that kills the whole
  class is that animation starts from a *visible* state

Two human checks belong here and cost seconds, because both run on a screenshot: **greyscale** (does
hierarchy survive without colour, or was colour carrying structure's job?) and **squint** at 25% (one
focal point per screenful, or even grey mush?).

### What none of them can see

Whether the photography is generic, whether a headline would still be true with a competitor's name
in it, whether a claim is *correct*. Those are stage 8, and they are human by design.

---

## 5. After upload

The bundle is **source, never built HTML**. Built HTML cannot be re-themed, cannot receive a
fleet-wide patch, and cannot be migrated when a block changes.

The build farm renders the same React catalog the preview uses, then derives every artifact from the
content tree. Structured data is derived, never authored — do not hand-write schema into props.

| Source | Becomes | What it buys, as of 2026-09 |
|---|---|---|
| `org.json` | `Organization` / `LocalBusiness` | **Entity understanding — the real payoff** |
| `Locations` | `LocalBusiness` + `PostalAddress` | Local pack eligibility |
| `SpecTable` / `CatalogGrid` | `Product` | Product rich results — live |
| `Hero.breadcrumb` | `BreadcrumbList` | Breadcrumb trail — live |
| `Testimonials` | `Review` | Comprehension only; no stars since 2019 |
| `FAQ` | `FAQPage` | **No rich result** — deprecated Search-wide 2026-05-07 |
| `Steps` | `HowTo` | **No rich result** — retired September 2023 |

Do not tell a client an FAQ block earns a rich result. It has not for years. `llms.txt` is emitted
because it is nearly free, but Google stated in June 2026 that it does nothing for Search or AI
Overviews. The honest pitch is entity clarity via `org.json` — the one thing a competitor cannot
copy off the page.

### Stage 10 — the loop that makes a site better, not just not-worse

A studio's last phase never ends: field data shortens the page over its life. The pipeline stopped at
hand-off, which means nothing a live site learns has ever reached the bundle it was built from.

Two signals are enough, and both are cheap because the platform already serves the pages:

| Signal | Read at | Acts on |
|---|---|---|
| Core Web Vitals, **p75 of real users** (LCP ≤2.5s, INP ≤200ms, CLS ≤0.1) | monthly | the theme and the assets — a lab run on a fast laptop flatters, field data ranks |
| Scroll depth per section | monthly | the sitemap — a section under ~20% reach either moves up or comes out |

The output is a diff against `site.json`, not a redesign: sections reordered or removed, images
re-cut. Because the bundle is source and the page is derived, that diff is a normal rebuild — which
is the whole reason for §1's rule. A fleet that never reads its own field data can only stay as good
as the day it shipped.

### Surviving a catalog change

A block declares `deprecated: [{ schema, migrate, note }]`. The validator tries the current schema
first, then those newest-first, taking the first that parses. A site written against last year's
catalog stays valid and renders correctly with **no bulk rewrite of stored JSON** — which would be a
migration with no undo, run against sites whose owners did not ask for it.

Rules: `migrate` is pure (it runs on every validation of every site); never chain (each entry goes
straight to *current*); guess in the direction that leaves the rendered page unchanged; add a
fixture to `renderer/tools/migrations.ts` the same day — `npm run migrations` fails if a declared
deprecation has none.

---

## 6. What the first full audit found

Nineteen block types, 25 layouts, five pages, three widths. Recorded because the *pattern* matters
more than the individual bugs.

| Defect | Root cause |
|---|---|
| Grids stopped collapsing at 2 columns | `[data-count="6"]` carries attribute specificity; container queries carry none, so count rules silently outranked every responsive rule |
| Timeline printed marker over title | Fixed `8rem` track; grid items do not clip |
| Gallery `uniform-grid` was not uniform | `height: 100%` beats `aspect-ratio` in a stretched grid row |
| Hero taller than the viewport | `--hero-min` is in `cqi` — a *width* unit — so height grew with the monitor |
| Hero still too tall after capping | `min-height` cannot shrink a section below its content; `--pad-y × 1.15` was the real driver |
| Heading as 7 stacked lines | 24ch cap tuned on short headings, punishing long ones |
| Notice box around 400px of nothing | Body capped at 78ch, box stretched to `--maxw` |
| Accent illegible as text | One token doing two jobs — a good *field* colour is rarely a legible *type* colour |
| Cards only sometimes cards | Four card layouts had radius and border but no elevation |
| Every FreeSection site failed to build | Two React instances — `react-dom/server` from `platform/`, `react` from `renderer/` |
| Every built site shipped wrong images | Build copied the renderer's demo images, never the bundle's `assets/` |

**Four lessons worth keeping:**

1. **Most defects were invisible to every existing check.** A validator sees JSON. It cannot see
   that a border is wider than the text beneath it, or that a colour bright enough to back a button
   is unreadable as type. Some of this needs eyes.
2. **The measuring tools were wrong before the code was.** The QA probe reported a viewport it had
   never set, parsed `oklab()` as RGB (so a real contrast fix looked like it changed nothing),
   measured text against the section instead of the button it sat on, and once turned a finding into
   a parse error that printed as "clean". *Verify the instrument before trusting the reading.*
3. **A bug that only hits the newest path is the worst shape.** FreeSection sites were unpublishable
   while catalog-block sites built fine — it read as a content problem.
4. **The repo's own samples hid two blockers.** Both asset bugs were invisible from inside this repo,
   because the sample bundles are exactly the ones whose images live in the renderer.

---

## 7. Commands

```bash
# creator
cd site-starter && npm run dev              # preview :5183, renderer from node_modules
cd site-starter && bash validate.sh <client>
cd site-starter && ./package.sh <client>    # source bundle zip — never dist/

# platform
cd platform && npm run build -- <bundle-dir> <out-dir> [--allow-unverified]
cd mcp && npm run smoke                     # validates every bundle, proves gates fire
cd mcp && ./tunnel.sh                       # catalog server, HTTP :8787 + bearer

# quality
cd renderer && npm run bench -- <dirs>      # density, tokens, layout-map overlap
cd renderer && npm run migrations           # deprecation fixtures
# renderer/tools/block-audit.js             # paste into any preview console
```

`content/` and `assets/` are gitignored in `site-starter`: a bundle is one creator's client work,
including a real company's registration number and phone. It goes up via `package.sh`; it does not
come down via git.

Never hand-edit `.mcp.json` — it holds a live token and is written by `setup-mcp.sh`.
