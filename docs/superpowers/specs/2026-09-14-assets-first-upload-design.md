# Assets-first upload — the photographs arrive at stage 1

**Date:** 2026-09-14
**Repos touched:** `site-hosting` (upload page, assets API, bundle store, catalog MCP),
`ai-website` (the `create-webpage` skill)

## The problem

Today a photograph cannot reach a site until after the site exists. `bundle_publish` is what mints
the upload link, and it requires a validated `site.json`, `theme.json` and `org.json`. The upload
page then derives its checklist from that bundle's `src` values and **refuses anything else**:

```
if (!m.expected.includes(name)) return no(400, `"${name}" is not a picture this site references …`)
```

Three consequences, all of which the skill currently works around in prose rather than in the
mechanism:

1. **The human waits.** They hand over documents at intake and then have nothing to do until
   stage 5, when the first page is composed and published. The photographs — the one thing only
   they can supply — are collected last.
2. **The first preview is blank.** `site_preview` on a fresh draft shows every `<img>` empty, logo
   included. The first time anyone sees the site with pictures in it is after stage 5's publish.
3. **The model never sees a photograph, so it guesses.** `alt` text, `imageKind`
   (`environment` / `cutout` / `detail`) and the art direction in stage 3 are all written from
   invented filenames. The validator refuses a `cutout` under `overlay-fullbleed` because text on it
   is unreadable — but it can only refuse what was *declared*, and the declaration is a guess.

The direction of the whole flow is backwards: the site names the pictures, so the pictures cannot
come first.

## The change, in one sentence

Invert it — a **photo pool** is opened at intake from nothing but a domain and a client slug, the
human drops everything they have into the browser page straight away, and the skill reads that pool
(names, dimensions, and thumbnails it can actually look at) and writes the real filenames into
`site.json` as it composes. The first `site_preview` after stage 5's publish has the real
photographs in it — that publish is what points the preview at the uploaded files.

The bytes never touch the conversation. They go to our own page, from the human's browser, exactly
as they do today — that property is the reason the browser half exists and nothing here changes it.

## Design

### 1. A draft can exist before a bundle (`site-hosting/src/bundles/store.ts`)

`Manifest.status` gains `'intake'`:

```ts
status: 'intake' | 'draft' | 'published'
```

New `store.open(domain, client)`: creates `bundles/<domain>/` with `assets/`, a manifest with
`expected: []` and `status: 'intake'`, and **no** `site.json` / `theme.json` / `org.json`. Idempotent
— called again for the same domain it returns the existing manifest untouched, keeping the code and
every uploaded file, **except** when the slug differs: that throws, naming the recorded one, because
the slug is the public `/img/<client>/` path and moving it orphans a site that already references it. `client` is checked with the same `checkClientSlug` rule `put` uses, because it
names a directory and later becomes a path.

`store.put` (the publish path) is an upsert onto whatever is there: an existing `'intake'` manifest
keeps its `code`, its `createdAt` and its `assets/`, and flips to `'draft'`. So the link handed over
at stage 1 is the same link used at hand-off, and nothing uploaded is ever orphaned by publishing.

Every reader that assumes a bundle exists (`store.site`, the build path, `/api/rebuild`) must treat
`'intake'` as "not buildable yet" rather than crashing on a missing `site.json`.

### 2. Uploads become a pool (`src/app/api/bundle/[code]/assets/route.ts`)

`POST` accepts every upload. A name the bundle already references is stored verbatim — that one came
from the site's own props; everything else becomes a pool file. (Wider than this spec's first draft,
which kept the `expected`-only rule once a bundle existed: that broke the promise made at intake —
"come back whenever you find more" — at the first publish, when an unlisted name became a 400 the
client could do nothing about.) A pool name is derived from the uploaded filename, never trusted
from it:

- basename only, lowercased, spaces and separators to `-`, everything outside `[a-z0-9-_]` dropped,
  collapsed dashes, 64 chars max, empty result becomes `photo`
- the extension is **replaced with `.webp`** — `compress()` picks its encoder from the name, so a
  pool file is always one format, and the name the skill reads back is the name the site will
  reference
- a collision appends `-2`, `-3`, … rather than overwriting. The name is chosen before a re-encode
  of hundreds of milliseconds, and the page uploads three at a time, so taking it is a separate
  race: `store.writeAssetUnique` creates exclusively (`wx`) and re-derives on `EEXIST`. Overwriting
  happens only when the caller asks — `replace=1`, the update path (see CRUD below)

Everything else on this route is unchanged: the 40 MB ceiling, `compress()` at `MAX_EDGE`, EXIF
rotation, sRGB, metadata stripped, no SVG. `DELETE ?name=` already removes one file and works for
pool names as-is.

Extras — files uploaded but not referenced by the published bundle — never block publishing.
`store.missing()` is still `expected` minus `uploaded`, so an unused photograph is dead weight in
the store, not a gate. The bound is a per-domain ceiling instead: `POOL_MAX_FILES` (150) and
`POOL_MAX_BYTES` (500 MB), applied to pool files only — a slot the bundle named is a picture the
site needs, and refusing it would break a publish over a quota.

### 3. The upload page has two states (`src/app/(upload)/upload/[code]/`)

**Intake** (`status === 'intake'`): no checklist, because there is nothing to check against yet.

> **Drop in every photo you have.** Logo, product shots, the team, the building, anything from a
> previous site. Names don't matter — we'll fit them to the pages as they're written. Extras are
> fine; nothing here is published yet.

**Draft / published**: today's checklist of `expected`, plus an "also uploaded" list showing pool
files the site does not (yet) reference, each with a `replace` and a `remove` control. The current
`not referenced by this site, so not uploaded` warning disappears with the rule that produced it.

### 4. Three MCP tools (`site-hosting/mcp/src/mcp.ts`)

| Tool | Input | Returns |
|---|---|---|
| `assets_open` | `domain`, `client` | `code`, `uploadUrl` — mints the pool with no bundle. The stage-1 tool |
| `assets_list` | `domain` | one row per file: `name`, `width`, `height`, `bytes`. Cheap, call freely |
| `assets_view` | `domain`, `names[]` (≤ 8) | each file re-encoded to a ≤ 384px WebP and returned as image content |

`assets_view` is the deliberate expense, and it is worth it. It is the only moment anything in this
pipeline knows what a picture is *of*. At ~250 tokens a thumbnail, looking at twenty photographs
costs about 5k tokens and buys: `alt` written from the image, `imageKind` set from what is actually
in frame rather than from a filename, and an art direction in stage 3 that responds to the client's
real photography instead of imagining it. The resize happens server-side with `sharp` (already a
dependency); full-size bytes never enter the conversation.

Hosting side: `GET /api/bundle?domain=…&assets=1` returns the listing with dimensions, and the
existing per-file `GET /api/bundle/<code>/assets?name=` gains `&max=384` for the thumbnail.
Dimensions are read with `sharp(...).metadata()` at list time — a header read, not a decode — rather
than recorded on the manifest, so a file written by any path still reports honestly. The
`Publish the site` control stays hidden while `status === 'intake'`: there is no bundle to build.

### 5. The skill (`plugin/skills/create-webpage/`)

- **Stage 1 (intake)** — the domain question already lives here and already blocks on being
  answered ("no domain, no link, no pictures"). It now pays off immediately: `assets_open`, hand
  over the link, *"drop everything you have now — it'll appear in the site as it's written."*
- **Stage 2 (content inventory)** — becomes content **and photo** inventory. `assets_list`, then
  `assets_view` on the ones that will carry a page. The gap list shown at the stage-4 checkpoint now
  covers missing *photographs* as well as missing copy, at the point where the human can still act.
- **Stage 3 (art direction)** — the tiles are proposed against real photography.
- **Stage 5 (home page)** — `src` is `/img/<client>/<real pool filename>`, verbatim from
  `assets_list`. The first `site_preview` after the first `bundle_publish` shows real pictures.
- **Stage 9 (assets & facts)** — shrinks to what the pool is missing: gaps, stock sourcing, verified
  numbers. The re-publish-at-every-stage-that-adds-an-image rule stays, because stock images sourced
  later still need to appear on the checklist.
- `references/live-preview.md` and `references/intake.md` carry the detail; `SKILL.md` carries the
  stage-1 instruction and the pool-name rule.

### CRUD

The pool is a created thing, so it ships complete: **create** = drop a file, **update** = the
`replace` control on a pool row, which re-uploads over that stored name (`replace=1`) rather than
adding a second file the pages do not reference, **delete** = the `remove` control on the same row,
hitting the `DELETE` route that already exists. Discarding a whole pool
is `bundle_discard(domain)`, which already removes the draft and its pictures — the remedy for a
domain typed wrong at stage 1.

## What this does not do

- **No change to how bytes travel.** Browser → our page → store. No base64 in a transcript, ever.
- **No change to publishing or deploying.** `assets_open` creates an intake draft; only
  `bundle_publish` stores JSON, and only the human's button on the upload page builds and deploys.
- **No new credential.** The code in the link is still the whole credential, still authorises
  exactly one domain, and the domain is still re-derived from the code on every route.

## Risks

- **A domain typed wrong at stage 1** opens a pool under the wrong key. `bundle_discard` covers it;
  the skill should confirm the domain back before handing the link over.
- **An intake draft nobody finishes** is a directory with photographs and no bundle. Same shape as
  today's abandoned drafts, and the same answer — no new pruning is in scope here. The ceiling above
  is what keeps a forwarded link from filling the disk in the meantime.
- **`assets_open` on a domain that already has a bundle** returns that site's existing upload page,
  not a new pool. The tool says which case it is rather than repeating "ask for every photograph" —
  on a published site every upload is refused, and on a draft the page is a checklist.
- **Pool names are ours, not the client's.** A human who uploads `IMG_4821.HEIC` gets
  `img-4821.webp`. The upload page must show the stored name back, or the two halves disagree about
  what the file is called.
