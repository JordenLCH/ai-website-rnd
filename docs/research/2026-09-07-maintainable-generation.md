# Maintainable content-as-data generation: research findings

Scope: patterns worth adopting for a system where AI tools generate validated JSON
against a block catalog, a platform hosts and patches the fleet, and non-technical
editors later touch content through a lightweight editor. Research task, no code
changed.

Confidence key: **[V]** verified against a primary source. **[I]** inference —
my synthesis, not stated by any one source.

---

## 1. Patterns worth adopting, ranked by payoff

### 1.1 Version blocks, not sites — deprecation arrays, not one-shot migrations **[V]**

WordPress's block editor solves exactly our "40 live sites, one block's schema
changed" problem, without a migration-on-save model. Each block definition can
carry a `deprecated` array of prior shapes. When saved content no longer
validates against the current schema, the editor tries each deprecated entry in
order; the first one whose `save` output matches gets its optional
`migrate(oldAttributes, innerBlocks)` run to produce current-shape attributes.
Two properties matter here: **it's not a chain** — deprecated versions are tried
independently, not passed through each other, so a v1→v4 jump needs only a
v1→v4 entry, not a working v1→v2→v3→v4 pipeline — and **it's lazy and
per-document**, running only when that content is touched, so a schema change
ships once and forty sites aren't migrated in one batch job that can partially
fail. The failure this prevents: a fleet-wide migration script that partially
fails mid-run with no clean rollback unit. Caveat from WordPress's own docs: a
deprecated entry's `save` must keep working forever, and its `migrate` is
skipped entirely if `save` stops validating — deprecated entries need fixture
tests, not just the current schema.
[Block Deprecation — Block Editor Handbook](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/)

**For us:** `renderer/src/validate-bundle.ts` today treats a bundle as valid or
not, with no "old but known" shape. A `deprecated` list per block type, each with
a pure `migrate(oldProps) -> newProps`, turns a block's schema change from a
fleet-wide incident into a bounded, testable function per historical shape.

### 1.2 Two-phase, reversible field removal **[V]**

Contentful requires marking a field deleted (hidden, still present) before true
deletion, to give client code and editors a window to react before data loss is
irreversible.
[Content types — Contentful docs](https://www.contentful.com/developers/docs/references/content-management-api/content-types/)
Sanity's equivalent: deprecation annotations with a stated reason, visible in
Studio and the API before removal.
[Deprecation support for Documents and Fields](https://www.sanity.io/docs/changelog/5a99e214-6088-4d10-a0b7-14ca7c555c01)
Prevents: silent blank renders after a rename, no diagnostic trail. Named risk
if phase two never happens: fields accumulate as "archaeological layers" **[I]**
(see §2).

**For us:** let the validator mark a prop `deprecated: "reason"` (still
accepted, warned) before a schema change removes it — a clear signal for the
build farm to auto-patch rather than fail the build.

### 1.3 Boring technology / innovation-token budget **[V]**

Dan McKinley's "Choose Boring Technology": a team has roughly three innovation
tokens to spend for a long while, best spent on the actual product — because
boring tools have well-understood failure modes and novel ones carry unknown
unknowns that surface later, in production.
[Choose Boring Technology](https://mcfunley.com/choose-boring-technology)
Prevents: a "slim server" goal undone by a bespoke migration DSL, a custom
visual-editor framework, and a novel state-sync layer, each individually
justified, collectively requiring a specialist to operate.

**For us:** spend the budget on the block catalog and validator — the actual
differentiator — not on a hand-rolled visual builder or bespoke editor
templating language (see §5).

### 1.4 Rule of Three before abstracting a block **[V]**

Sandi Metz: "duplication is far cheaper than the wrong abstraction." The
failure mode matches this project exactly — two similar blocks get merged into
one parameterized block, a third near-fit arrives and gets forced in via another
prop flag and a conditional, and the block becomes "a tangle of special cases."
Her fix once this has happened: inline the abstraction back into each call
site, delete what's irrelevant per site, and only re-abstract once three real
instances reveal the actual shared shape.
[The Wrong Abstraction — Sandi Metz](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction)
Prevents: a `Hero` block with nine boolean-ish props where no one can predict
what a given combination renders, and the validator can't usefully constrain it.

**For us:** this is the strongest argument for CLAUDE.md's "~2 slugs per block
type, slugs are editorial roles not block types" rule. A new `variant` slug is
cheap (duplicated entry in the theme's `sectionStyles`); a new prop on an
existing block is expensive (touches every site using it, needs a §1.1
deprecation entry if it changes existing behavior). Prefer the slug until a
fourth real site proves a prop is the correct axis.

### 1.5 CMS-agnostic content, not CMS-coupled frontend **[I, single source]**

Recurring theme in headless-CMS write-ups: components calling the CMS SDK
directly everywhere end up "deeply married" to that CMS's shape, so any schema
change ripples through the whole frontend. **For us:** already the architecture
(`site.json`/`theme.json` are the sole content boundary). Watch that platform
code (`platform/src/build.ts`, `seo.ts`) treats the bundle schema as the
contract rather than reaching into renderer internals.

---

## 2. Traps specific to this system, with early warning signs

**The catalog becomes a page-builder in disguise.** A content model that starts
as typed data (Hero: headline, image, CTA) slides into a builder (Hero: `layout`
enum, `columns`, `customCss`) as one-off requests accrue. Hygraph names
"pages and their sections" content-modeling as a recognized headless-CMS
anti-pattern for this reason.
[Headless CMS vs. page builder — Hygraph](https://hygraph.com/blog/headless-website-builder)
**Warning sign:** a prop whose value is presentational (alignment, spacing,
raw class name) rather than content — that belongs in `theme.json`, not
`site.json`.

**Soft deprecation that never completes.** Contentful's and Sanity's mechanisms
are a staging area, not a destination; skipping the follow-through leaves
fields nobody uses that the validator must still account for years later.
**Warning sign:** several `deprecated` entries on one block type with no site
left using them. Since every bundle here is enumerable (unlike a CMS with
unknown external consumers), there's no excuse — once `fleet_siblings`-style
tooling confirms zero usage, delete the entry and its migrate function together.

**Preview/editorial tooling treated as a later nice-to-have.** Convergent regret
across headless-CMS retrospectives: content models not shaped for what an
editor needs to see caused painful rework once editing tools were finally built.
**[I]** **Warning sign:** a field with a cross-field constraint an editor needs
context for (e.g. `imageKind` matching layout, per this repo's validator) that
the minimum-viable editor (§5) can't surface before save, only after a failed
rebuild.

**AI-generation and human-edit paths drift on what "valid" means.** This system
is unusual versus the sources above — one authoring surface (AI agent + skill)
generates content, a different, simpler surface (human editor) edits it months
later. **[I, no direct source — specific to this architecture.]**
**Warning sign:** the editor UI accepts an edit the generation-time validator
would reject (e.g. swapping a product cutout into an `overlay-fullbleed` hero,
breaking the documented `imageKind` contract). Fix: the editor must call the
same `renderer/src/validate-bundle.ts`, never a second copy.

**Cron-driven patching mutates content with no audit trail.** No CMS researched
auto-mutates live content unattended — migrations are explicit, dry-run-first
(Sanity's CLI defaults to dry-run, per the migrations doc cited in §1.2).
**Warning sign:** the refresh cron applies a `migrate` function and republishes
with no before/after diff logged anywhere reviewable.

---

## 3. The escape-hatch question: recommendation

Sources converge: escape hatches are necessary but must be a **named, bounded
surface**, not an ambient capability — `children`/slots in component libraries
generally **[V]**; Sanity Studio's documented path of replacing one input
component with custom React, not allowing arbitrary markup anywhere **[V]**.
[Studio customization — Sanity Docs](https://www.sanity.io/docs/studio/studio-customization)

**Recommendation: no free-text HTML/CSS escape hatch in `site.json`, ever —
including on the AI-generation path.**

1. CLAUDE.md's core value prop ("fix a block, every site inherits it") is void
   once one site holds raw markup the renderer doesn't own — with nothing in
   the bundle format flagging that it opted out.
2. Generation is an AI agent following a skill, not a human under deadline
   pressure — the classic "abstraction doesn't fit yet, ship today" argument for
   an escape hatch doesn't apply. A missing block type is a same-session
   skill/catalog gap. The skill already models the right instinct ("if a brief
   lacks content a block needs, leave it out and say why") — extend that to
   layout: say so and propose a new `variant`/block type, don't hand-write markup.
3. A genuinely recurring visual need (Rule of Three, §1.4) becomes a **new
   catalog block or variant**, reviewed once, inherited fleet-wide.

**Where bounded freeform is legitimate:** rich text within one prop, as a
Portable-Text-style array of typed nodes (paragraph, bold span, link) rather
than an HTML string — still fully renderer-owned, just finer-grained than a
whole block. Sanity's rationale applies directly: serializes to any output,
stays diffable, and a validator/agent can reason about structure precisely.
[Why Portable Text is awesome — Sanity](https://www.sanity.io/blog/why-structured-text-is-awesome-and-you-totally-want-it-in-your-cms)

**If pressure for raw HTML/CSS becomes overwhelming anyway** (worse options, in
order): (a) one named block (`CustomEmbed`) sandboxed in an iframe with no
access to site tokens/JS, never inline in the render tree; (b) flag any bundle
using it "non-conforming" so it visibly opts out of fleet-wide patches. Never a
generic `rawHtml` prop on an existing block — that reintroduces coupling inside
every block that adopts it.

---

## 4. Migration mechanics to actually build

1. Add an optional `deprecated` array to a block's schema: each entry has the
   old prop shape plus a pure `migrate(oldProps) -> newProps`.
2. `validate-bundle.ts` tries the current schema first, then each deprecated
   entry in order (first-match, non-chained, matching Gutenberg); on match, run
   `migrate` and re-validate the result before accepting.
3. Build farm chooses: patch-and-rewrite the bundle in place (preferred — keeps
   `deprecated` arrays short, per §2) vs. migrate-on-render only (defers
   rewrite, lets deprecated arrays grow unless swept).
4. Every `migrate` needs a fixture test frozen at deprecation time — Gutenberg's
   docs flag this as exactly what breaks silently when skipped.
5. Track fleet usage per deprecated entry (`fleet_siblings`-style); when usage
   hits zero, delete the entry and its test in the same change.

---

## 5. Minimum viable content editor

Sources sit on a spectrum between "fielded form" (Contentful/Sanity: one field
per schema prop) and "slice/component builder" (Storyblok bloks, Prismic
slices: still schema-backed, but arranged visually in page context).
[Prismic vs Storyblok](https://prismic.io/vs/storyblok)

**Recommendation:**

- **Form-per-block, not drag-and-drop-per-pixel.** Generate the edit form from
  each block's existing prop schema — correct input per prop type (image picker
  constrained by `imageKind`, enum dropdown for `variant`, not free text).
  Cheapest to build: schema already exists, nothing new to keep in sync.
- **Page-level block list with add/remove/reorder**, picking only from existing
  catalog block types — no inventing new block types/props here (stays
  developer/skill-mediated).
- **Validate on save with the exact same `renderer/src/validate-bundle.ts`**
  the CLI and build farm use — the direct fix for the drift trap in §2.
- **No live visual canvas for v1.** Live preview is high-value but a
  substantial ongoing investment (drift between preview and production render).
  A form plus "preview in a new tab against the real renderer" (reuse
  `starter/`'s preview app) is a legitimate v1 cut, matching the slim-server goal.
- **Chrome (nav/footer) edited once, at site level** — mirrors the existing
  `site.json` `chrome` design; don't re-flatten to per-page editing.

This keeps the editor a thin form generator over an already-enforced schema —
no second content model, no page builder, no new server infrastructure.

---

## 6. Source list

Verified/fetched directly: [Block Deprecation — WP Block Editor Handbook](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/) ·
[Sanity: schema and content migrations](https://www.sanity.io/docs/content-lake/schema-and-content-migrations) ·
[Sanity: field/doc deprecation](https://www.sanity.io/docs/changelog/5a99e214-6088-4d10-a0b7-14ca7c555c01) ·
[Sanity Studio customization](https://www.sanity.io/docs/studio/studio-customization) ·
[Sanity: Portable Text](https://www.sanity.io/blog/why-structured-text-is-awesome-and-you-totally-want-it-in-your-cms) ·
[Contentful content types](https://www.contentful.com/developers/docs/references/content-management-api/content-types/) ·
[The Wrong Abstraction — Sandi Metz](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction) ·
[Choose Boring Technology — Dan McKinley](https://mcfunley.com/choose-boring-technology) ·
[Headless CMS vs. page builder — Hygraph](https://hygraph.com/blog/headless-website-builder) ·
[Prismic vs Storyblok](https://prismic.io/vs/storyblok)

Lower confidence, read via search snippets only, marked [I] above: a
Substack/DEV piece on headless-CMS frontend architecture (istealersn), a blog
post on Sanity content versioning (Nayan Kyada), general JAMstack-agency
retrospectives — directional, not independently verified.

Not found: a citable case study of exactly "40 sites on one shared block
catalog, migrated live." Closest analogues are WordPress core (millions of
sites, per-post lazy migration) and Sanity/Contentful (per-tenant, developer-
triggered). Our shape — one operator, many tenants, cron-triggered patch — sits
between these with no existing playbook; §4 is a synthesis, not a copy.
