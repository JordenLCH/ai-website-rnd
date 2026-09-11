# Adding a block type

There was no written procedure for this, and the absence showed up as a question nobody could answer
quickly: *should this be a new block, or a new layout on one we have?* The catalog is at 24 types.
Every one of them is permanent surface — a schema that can never break, a deprecation lane, a
theming obligation on every theme that ever renders it, and a row in a reference file a creator
reads offline. The count only ever goes up, because dropping a type means rewriting stored bundles.

So the expensive part of a new block is not building it. It is carrying it.

## Gate — answer this before writing code

Fill in the table. If every row's third column is thin, the answer is a layout, not a type.

| Related block | What it already shares | Why it isn't enough |
|---|---|---|
| `Features` | eyebrow, title, 2–6 items with image and body | *…and the reason that shape genuinely cannot carry this* |

Three cheaper answers, in the order to try them:

1. **A new `layout` on an existing block.** Layouts are a `readonly string[]` on the entry plus CSS.
   No schema change, so `deprecated` stays empty and no stored bundle notices. This is the right
   answer far more often than it feels like it is — "a testimonial that looks completely different"
   is `Testimonials` with a fourth layout.
2. **A new variant slug.** If the props and the layout both already exist and only the *editorial
   role* is new, that is a slug (`hero/statement` beside `hero/home`) and costs nothing but a
   `sectionStyles` entry.
3. **`FreeSection`.** It exists precisely so a one-off composition does not become a catalog entry.
   If this shape will appear on one client's site and nowhere else, it is a `FreeSection`, and
   promoting it to a type later is easy. Promoting is easy; demoting is not.

A new type earns its place when the shape is **semantically distinct and will recur** — distinct
because the platform reads block *type* to derive JSON-LD (see the table in
`plugin/skills/create-webpage/references/composing-sections.md`), and recurring because a type used
once is a `FreeSection` with extra maintenance.

## What it costs, permanently

Every one of these is a real touch point, verified against the tree:

| Where | What |
|---|---|
| `renderer/src/blocks/<Name>.tsx` | the `entry: CatalogEntry` — `schema`, `layouts`, `Component`, optional `check(props, layout)` |
| `renderer/src/blocks/index.ts` | import the entry and add it to the `catalog` record; nothing else discovers it |
| `renderer/src/styles.css` | one file, ~132 KB, holds every block's CSS — there is no per-block stylesheet |
| `plugin/skills/create-webpage/references/catalog.md` | the offline fallback a creator reads when MCP is down; a type missing here is a type they cannot use on a bad day |
| every `theme.json` | Gate 2 requires each slug the pages use to resolve, and the layout named to be one the block implements. A new type with no themed slug renders unstyled |
| `renderer/tools/migrations.ts` | only once the block gains a `deprecated` entry — but `npm run migrations` fails the day it does, so the fixture is due the same day |
| forever | the schema can be extended but never narrowed without a `deprecated` entry plus a pure `migrate()`, newest-first |

## What it does *not* cost

Worth stating, because the fear here is misplaced and it steers people toward cramming new shapes
into old blocks, which is worse.

`catalogVersion` is **derived, not remembered** — `renderer/src/catalog-version.ts` fingerprints
every block's layouts and prop shape, so adding a type bumps it automatically. That bump is *forward*
drift for every stored bundle, and forward drift is a note, not a failure: `catalogDrift` only
refuses a farm **older** than the bundle. So adding a block cannot break a site that already exists.

The expensive direction is changing a block that already ships. That needs the `deprecated` lane and
is a different job with different rules.

## Procedure

1. Fill in the gate table above and write down which of the three cheaper answers you rejected and
   why. Put it in the PR body — this is the artifact that stops the catalog drifting to 40 types.
2. Write the entry in `renderer/src/blocks/<Name>.tsx`. Props are editorial, never presentational:
   no hex, no px, no font names, no layout hints in prop names.
3. Register it in `index.ts`.
4. CSS into `styles.css`, driven by tokens only.
5. Add a `check(props, layout)` if any layout has a content precondition — the `overlay-fullbleed`
   needs `imageKind: "environment"` rule is the model. A precondition left uncoded is one the
   validator cannot enforce and the skill has to remember.
6. **`image` implies `imageAlt`.** If the block carries a picture, make `imageAlt` required unless
   there is a reason not to — seven existing blocks made it optional and every one of them renders
   `alt=""` on omission, which is the hole `check-theme.py` now reports.
7. Document it in `references/catalog.md`, with the layouts and the props, in the style of its
   neighbours: what it is *for*, not just what it accepts.
8. Style its slugs in at least one theme and look at it in the preview at 360 and 1280.
9. Two commits: one in `renderer/`, pushed to `website-renderer`; then one here bumping the gitlink.
   Pushing to `website-renderer` `main` ships it to production on the next deploy — `site-hosting`
   pulls `--remote`, so there is no second pin to forget and no staging step either. Push when you
   mean it.
