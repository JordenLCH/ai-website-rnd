# Handoff — FreeSection layout audit, and the rule-registry refactor that follows

Written 2026-09-14 by the agent that did the work (`cc-free`), for whoever picks it up next.

> **Status, 2026-09-14 16:10 (`cc-rules`): everything in here is done and pushed.** The layout work
> is `renderer` `2cf8c1b`; the registry and the drift guard are `69b5e3f` + `d845d7b`, with
> `21d349b` + `078a390` in this repo. `website-renderer` `main` and `ai-website-rnd` `main` both
> carry them, so they ship on the next prod deploy. The document is kept for its reasoning, not as
> a task list — every section below records why a decision was made, and §4 is the specification
> the registry was built from. What is genuinely still open is at the bottom of §5.

Two things were in here, and they were different in kind:

1. **Work that was finished and verified but *not committed*** — 25 changed files plus 3 new ones in
   the `renderer` submodule, and 2 in this repo. Committed as `2cf8c1b` / `6e40ecc`; §1 stays as the
   record of what changed and why.
2. **One open task with a real design behind it** — making the validator's rules enumerable so
   `house-rules.md` can be drift-guarded the way `catalog.md` already is. [§4](#4-the-open-task)
   is the specification. **Done**, with two amendments recorded there.

---

## 1. Uncommitted work

```
renderer/   25 files changed, 728 insertions(+), 131 deletions(-)
            + untracked: src/freesection.test.ts, tools/fuzz.ts, tools/layout-qa.js
            on branch main, last commit 338edb0
this repo   plugin/skills/create-webpage/references/house-rules.md
            plugin/skills/create-webpage/references/composing-sections.md
            renderer (gitlink, dirty)
```

**Nothing here is committed. Commit before doing anything else.** Per `CLAUDE.md` a renderer change
is two commits: one inside `renderer/` pushed to `website-renderer`, then one here bumping the
gitlink.

**Pushing `renderer` to `main` is shipping.** `site-hosting/update.sh` runs
`git submodule update --remote`, so whatever is on `website-renderer`'s `main` goes live on the next
prod deploy — no pin bump, no second gate. Decide that deliberately; committing locally is safe and
separate.

The catalog fingerprint moved to `0.5.0+111ef2f724764fe5` (the token contract is now hashed into it,
see below), so every stored bundle will report forward drift on its next rebuild. That is the
expected, harmless direction — `catalogDrift` reports it as info.

### What changed, and why

Roughly four groups. The reasoning for each is in the source comments; this is the index.

**Layout defects found by fuzzing and fixed in `styles.css`**

| Symptom | Cause | Fix |
|---|---|---|
| A Row containing a Carousel resolved to 16 777 216px (CSS infinity) and dragged the page with it | `align: center` on a Stack sets `justify-items: center`; a non-stretch grid item is shrink-to-fit, sized from its own max-content, and a Carousel's max-content is cyclic | `:where(.p-stack, .p-grid, .free__grid, .p-card, .p-figure) > * { max-width: 100% }` — the percentage resolves against a definite track, which caps the contribution and ends the cycle |
| A KeyValue's value track at **0px wide** holding 375px of text | `.p-kv__row` collapsed at `@container (max-width: 820px)` — but a container query measures the nearest *ancestor container*, which is `.site`. The row was 44px wide at a 1425px viewport, so it never fired | Rebuilt as `flex-wrap` with a `min(14rem, 100%)` basis: self-triggering at any nesting depth, no breakpoint |
| A hero headline at **123px in a 325px column** — 79 characters over 20 lines, a 2791px band | `--display-size` is a free-form string; a theme wrote a flat `7.71rem`. The only cap was against screen *height* | `min(var(--display-size), 14svh, 12cqi)` on `.display` (which had **no** cap at all) and `.p-h--display` |
| Nested grids kept their **desktop column count on a phone** — 13.5px tracks at 405px | `.p-grid[data-spans="true"]` (0,2,0) outranks the `@container` collapse rule (0,1,0) | Name the attribute selector in the mobile rule and reset children's `grid-column` |
| SpecTable's label crushed to 0px wide, 174px tall | A sentence-length value in a `max-content` track; `max-content`'s implicit minimum beats `minmax(0, …)` | `minmax(min(8rem, 100%), auto) … minmax(0, max-content)` |
| Classic hero at 2.1 screens under a swapped theme | `.block` padding is `--pad-y × --density`, sized in `cqi` — a *horizontal* unit with nothing tying it to the screen | `.hero[data-layout]` padding capped at `16svh` |
| `hard-panel` CTA butted straight into the footer with zero air | Its own `padding` shorthand replaces `.block`'s, leaving the section with none | `.section:has(> .cta[data-layout="hard-panel"])` carries the band rhythm |
| `soft-band` CTA's note sat off to the left of a centred band | The note became a direct child of `.cta` (see below), inheriting `.block > * { margin-inline: auto }` — and its `margin: 1.2rem 0 0` shorthand set that back to 0 | `margin: 1.2rem auto 0` |

**Two validator rules that were wrong, not merely missing**

- **`overlay-fullbleed` tone check was backwards on dark themes.** It read *"tone must be `inverse`
  or `accent`"*. But `inverse` means the flip of the page ground: on a light theme that is a dark
  band with light ink and the rule held **by luck**; on a dark theme `inverse` is the light-paper
  flip, so its ink is near-black. It therefore **passed** a hero rendering black serif type on a
  dark photograph and **refused** the correct choice. Its own comment admitted the derivation —
  *"all six in the repo are dark… this makes the pairing a rule rather than a habit"*. Now resolves
  the tone's actual ink token and requires `relLum >= .4`. Verified in both directions.
- **The narrow-Grid rule was ~3× optimistic.** It compared *shares* of the rail, ignoring gutters
  and assuming a rail wider than any theme's `--maxw`. A `cols: 8` Grid it scored as acceptable
  rendered 12px tracks. Rewritten in pixels (`RAIL_PX = 1100`, the `--sp-*` scale as `GAP_PX`),
  gutters subtracted, with the floor written as `RAIL_PX / 12` so a twelve-column Grid on the full
  rail — the reference case — lands exactly on it rather than a third of a pixel under.

**Token contract**

- `--display-tracking`, `--eyebrow-tracking` and `--eyebrow-transform` moved REQUIRED → OPTIONAL
  (now **36 required / 46 optional**). A required token has to be filled in, and no generator writes
  `0` into a box labelled "tracking" — it writes a number that looks like a decision, which is how
  six of seven themes arrived at an eyebrow tracked wider than anything a typographer recommends.
  Stylesheet defaults them to `0` / `none` on `.site`.
- `catalogFingerprint()` now hashes the three token lists. It previously hashed only block layouts
  and prop-schema shape, so moving a token between REQUIRED and OPTIONAL loosened the theme contract
  **invisibly** — an old farm meeting a new theme would refuse it for a token it still called
  required, with `catalogDrift` reporting nothing.

**The eyebrow-rate rule** — see [§3](#3-the-eyebrow-finding) for the evidence.

### Verification actually performed

Do not re-derive this; it is expensive.

- 50/50 tests, migrations, `catalog-doc`, `vite build` — all green
- All six bundles in `dev/fleet-archive/` valid, zero errors
- **216 site×theme combinations** (all 6 sites × all 6 themes, desktop *and* ~405px) measured clean
  with `tools/layout-qa.js` — no infinity, offstage, collapsed, over-tall hero, or broken carousel
- 80 hostile fuzz pages at both widths, 428 carousels — clean, zero horizontal overflow
- ~4 000 fuzz seeds across several fresh ranges — no generation, validation or render throw

---

## 2. The two tools, and how to use them

They are the reason the defects above were findable at all, and they are halves of one check.

### `renderer/tools/fuzz.ts` — `npm run fuzz`

Seeded property-based generation across the **whole permitted range**: `Grid cols` 2–12 at every
nesting depth, spans, every gap and pad step, carousels of every `perView`, **and random theme token
values** — the axis the fleet's seven hand-written themes cannot cover.

```bash
npm run fuzz                        # 200 seeds: generate + validate + render
npm run fuzz -- --seeds 1000        # before a release
npm run fuzz -- --seed 7 --out ../dev/fuzz   # write one bundle out to look at
```

It asserts only what is wrong under every intent: generation, validation and render must not throw,
and **a bundle the validator calls valid must then render**.

> **Read the `N valid, M refused` line.** If more than half the corpus is refused, most seeds never
> reached the render assertion and the run is green on nothing. It prints a warning when that
> happens. The generator deliberately mirrors two validator rules (`gap: "xl"` on a wide rail, and
> `MIN_TRACK_SHARE`) so it stays inside the contract — **if you tighten a validator rule, teach the
> generator about it too**, or the corpus collapses. This already happened once: 95 of 100 refused.

### `renderer/tools/layout-qa.js` — paste into the preview console

Returns JSON: `infinity`, `offstage`, `collapsed`, `squeezed`, `runaway`, `tall`, `carousel`, and a
`clean` boolean to assert on. `squeezed` and `tall` are deliberately outside `clean` — they are
composition decisions, not defects.

`tools/design-qa.js` is the companion: overflow, clipped text, per-tone contrast. **Run both.**

> **`design-qa.js`'s ground flaw is fixed (2026-09-14).** It measured text against the *section's*
> background, but a button and an accent CTA panel paint their own. It now walks up to the nearest
> ancestor that actually paints, compositing translucent layers on a canvas, and reports anything it
> cannot compute — text over a photograph, which is every `overlay-fullbleed` hero — in a new
> `unknown` list rather than as a ratio. Measured across all 36 site×theme combinations: 3 false
> `1.03:1` findings became 0, and an injected dark-on-dark panel the old version passed in silence
> is now caught at 1.08:1. **`unknown` entries are not passes.** Look at each one.

### Four lessons that cost real time

1. **Run any new auditor against the real bundles before trusting a finding.** `layout-qa.js`'s
   first version reported 8–12 collapsed elements per real page, all false: `display: contents`
   wrappers, `<option>`s, and descendants of a hidden nav. `el.getClientRects().length === 0`
   answers all three at once. The fleet is useless as a specification and invaluable as a
   false-positive corpus.
2. **Never tune a threshold to make the fleet pass.** Those bundles are generated output.
   `HERO_MAX_SCREENS` is argued from what a hero *is*, not from what the six sites measured.
3. **Sweep every site against every theme.** Two of the worst defects appeared *only* under a
   swapped theme — which is exactly what the variant indirection promises and what a per-site
   eyeball never covers.
4. **Measure the layout box, not the painted one.** `getBoundingClientRect()` includes ancestor 3D
   transforms; a Swiper coverflow slide 1053px wide reported 105 776px. Use `offsetWidth`.

### Preview gotcha

`CONTENT_DIR` is globbed **at server start**. After generating new fuzz bundles you must restart
`npm run dev` — reloading the page silently shows a stale subset. This cost a whole audit pass that
reported clean numbers for a corpus that was not loaded.

---

## 3. The eyebrow finding

Included because it is the model for how a "taste" argument should be settled here, and because the
rule it produced is the one whose documentation exposed the gap in §4.

`Eyebrow` was being emitted on most sections. Measured with `getComputedStyle` on four production
sites in this catalog's territory — hermanmiller.com, steelcase.com, humanscale.com, stripe.com —
there are **zero eyebrows across 48 headings**. A second sweep of Stripe for *any* short text ≤15px
that is uppercase or wide-tracked, anywhere on the page, also found none. This pipeline's own fleet
had one on **85 of 144 sections** (57%, 65%, 80% on individual sites). CFPB's design system defines
it as *"an additional label that can be used to support the main H1 heading on a page"* — page
opener, section use not contemplated.

Closed at both ends, which is the pattern to copy:

- `renderer/src/validate-bundle.ts` — warns past **2 per page** (twice the documented rate, because
  a rule that fires at the first departure from a style guide gets ignored)
- `plugin/skills/create-webpage/references/house-rules.md` — so the model knows *before* composing
- `.../composing-sections.md` — the positive instruction and the alternatives

---

## 4. The task that was handed off — done

**Make the validator's rules enumerable, then drift-guard `house-rules.md`.**

> **Built as specified, with two amendments and one finding that changed the urgency.**
> `renderer/src/rules.ts` is the registry (95 rules), `tools/house-rules-drift.ts` the guard
> (`npm run house-rules`), and `house-rules.md` carries a `[rule:…]` tag per documented rule.
>
> The finding first: the drift below was described as a future risk, and it had already happened in
> *both* directions. The doc stated four Gate 3 rules that exist nowhere in the renderer — "mosaic
> galleries need >= 5 images" against a `.min(3).max(9)` schema whose check Gallery's own source
> says was deliberately deleted; "single-large takes exactly one quote" against `.min(1).max(6)`;
> short quotes for `quote-row`; landscape images for `wide-list`, which belongs to CatalogGrid and
> has no `check()` at all. Meanwhile eleven rules that do fire were documented nowhere.
>
> **Amendment 1 — `rule` is required, not added.** The scope note below ("must be finished in one
> pass") is solved by the type rather than by discipline: making `rule` required on `Issue`, and
> removing the bare-string form of a `check()` result, means a half-migrated registry does not
> compile. The compiler enumerated the call sites instead of a checklist.
>
> **Amendment 2 — `teach` decides what the doc owes.** Demanding doc coverage for all 95 ids would
> have forced ~35 self-explanatory rules into the prose and made the doc worse. 62 are marked as
> needing to be known *before* composing; the reverse check (a tag naming a rule that does not
> exist) applies to all of them, since that is the direction the four invented rules were.
>
> Step 5's threshold check was worth doing and is narrower than proposed: it searches the tagged
> bullet, not the paragraph, because in a list of a dozen rules a paragraph-wide number search
> passes by coincidence. The **alternative** below (serve the rules over MCP, delete the doc) was
> measured and declined: ~92 of the file's 205 lines mirror enumerable rules and ~113 are editorial
> — the same split `catalog-doc-drift.ts` records for `catalog.md` (44/97), where the decision was
> also keep-and-guard.

### The problem

`house-rules.md` (184 lines, shipped inside the plugin) is a hand-written mirror of rules that live
in the renderer. There is **no guard** keeping them in sync, and they ship on different clocks: the
validator goes live on the next prod deploy, the doc only when a creator reinstalls a bumped plugin.

| `house-rules.md` section | Mirrors | Count |
|---|---|---|
| Gate 0 density, Gate 2 theme coverage, Gate 4 jurisdiction, Chrome, eyebrow rate | `renderer/src/validate-bundle.ts` | 46 `issues.push` |
| Gate 3 content-suits-layout, **FreeSection rules** | `renderer/src/blocks/*.tsx` `check()` | 21 `out.push` |
| Gate 2's token list | `renderer/src/tokens.ts` | 3 lists |
| Gate 1 schema | `blocks/*.tsx` zod schemas | — **already safe**, covered by the guarded `catalog.md` |
| Microcopy | nothing enforces it — the doc says so | — |

The drift is concrete, not theoretical. The doc states *"60+ words and 6+ content nodes (warning
below 20 and 3)… 700+ words"*; the source says:

```ts
const WORDS_TARGET = 60, WORDS_FLOOR = 20
const LEAVES_TARGET = 6, LEAVES_FLOOR = 3
const PAGE_WORDS_TARGET = 700
```

Correct today. Four numbers hand-copied across a submodule boundary into a separately-released
plugin. Change `WORDS_TARGET` to 80 and nothing tells you the doc now lies to every creator.

### Why `catalog.md` gets away with it

`catalog-doc-drift.ts` works because `catalog.md` mirrors **enumerable** things — block types and
layout names, read straight out of `catalog` and diffed. `house-rules.md` mirrors prose and
thresholds, and there is no list to diff against because every rule is an inline string at its call
site. **Making them enumerable is the whole task.**

### Proposed design

Deliberately preserves the hand-written prose — a generated rules doc would be worse to read, and
the prose is doing real teaching work. Only *coverage* becomes provable.

1. **Give every rule a stable id.** Widen `Issue` (currently
   `{ where; message; severity }`) with `rule: string` — kebab-case, stable across message rewrites,
   e.g. `density/section-thin`, `overlay/ink-too-dark`, `eyebrow/rate`. Same for the block `check()`
   results (`shared.ts` already allows `string | { message, severity }`; add `rule`).
2. **Export the registry.** `renderer/src/rules.ts` — the list of ids with a one-line summary and
   which gate it belongs to. Import it where the rules fire so the id cannot be invented at the call
   site and forgotten in the registry.
3. **Tag the doc.** A `[rule:density/section-thin]` marker in `house-rules.md` beside the prose that
   documents it. Invisible enough not to hurt reading, greppable.
4. **Guard it.** `renderer/tools/house-rules-drift.ts`, modelled on `catalog-doc-drift.ts`: every
   registered id must appear in the doc, every id in the doc must exist. Wire to `npm run
   house-rules` and into whatever runs `catalog-doc`.
5. **Thresholds too, if cheap.** Emit the numeric constants into the registry so the guard can check
   the doc quotes the current value. This is what would have caught the `WORDS_TARGET` case. Do it
   only if it does not force the prose into a table.

Scope: **67 call sites across ~16 files.** Mechanical but long, and it must be finished in one pass —
a half-migrated registry is worse than none, because the guard then reports false coverage.

### The alternative worth considering first

`CLAUDE.md` says *"MCP serves only what drifts"* and *"anything written into the skill is a snapshot
that will eventually be wrong"*. By that logic the right answer may not be to synchronise the
snapshot but to **delete it**: serve the rules over MCP from the validator (a `house_rules` tool
beside `catalog_list`), and demote `house-rules.md` to an offline fallback exactly as `catalog.md`
already is. Same registry work underneath, so step 1–2 above are not wasted either way.

Note the constraint before proposing a script instead: **the user generates sites in claude.ai, not
in Claude Code.** Skill steps must not assume local binaries — which is why MCP exists and why "ship
a script they can run" is not an option for the generation path.

---

## 5. Also open

- **`dev/preview-nocturne/` and `dev/themes/nocturne/`** are scratch from a theme-generation request
  (`nocturne-press`, a dark theme covering all 43 fleet slugs). `dev/` is gitignored; delete freely.

## Conventions worth knowing before you start

From `CLAUDE.md`, the ones that bite:

- **Read `workers.md` at the repo root and claim your files before editing.** Concurrent agents
  share this repo; a second agent was active throughout this session and twice swept files from
  this one into its commits via a broad `git add`. Stage only your own paths.
- **No destructive git** — `reset` in every form, `stash`, `clean -f`, `push --force` — without
  explicit per-action approval. The index is shared process-wide.
- **Never reason from `dev/fleet-archive/` or `site-hosting/content/` as evidence.** They are this
  pipeline's own output from a POC: one distribution, a handful of draws. Decide what the renderer
  *should* do from real production practice and by measuring real sites in a browser. There is a
  section in `CLAUDE.md` on this, written after three instances of getting it wrong in one day.
