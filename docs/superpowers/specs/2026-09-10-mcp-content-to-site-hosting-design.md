# Move mcp/ + content/ into site-hosting

## Problem

`site-hosting` already carries `platform` and `renderer` as pinned git submodules
(`file:../platform`, `file:../renderer`), and runs a single `update.sh` (git pull →
install → migrate → build → pm2 reload) to deploy.

`mcp/` currently lives in `ai-website` and *also* depends on `file:../platform` and
`file:../renderer` — its own, separately checked-out and separately pinned copies.
Today mcp only runs via `tunnel.sh` on a dev laptop, so the two pins drifting apart
is latent. The moment mcp needs to run as a persistent prod service (so real
creators on claude.ai aren't depending on someone's laptop being on), it becomes
two independently-updated checkouts of the same submodules with no guarantee they
ever agree — which is exactly the failure mode `catalogDrift` in the renderer was
built to catch between mcp and the farm, reintroduced one level up.

Deploying two separate repos also means two separate manual steps with no shared
guarantee they land together.

## Decision

Move `mcp/` and `content/` into the `site-hosting` repo. Site-hosting becomes the
single runtime repo: platform (farm) + renderer + mcp (catalog server) + content
(the live fleet), all sharing one submodule checkout, deployed by one script.

`ai-website` keeps everything that is source/instructions rather than a running
service: `skills/`, `docs/`, `website_info/`, `plugin/`, its own `renderer/`
checkout for local preview.

### Why the split lands here and not elsewhere

Two different kinds of dependency were being conflated during discussion, and only
one of them requires co-location:

- **Filesystem/build coupling** (`file:../platform`, `file:../renderer`) — a
  build-time import. Two checkouts of the same submodule can silently diverge.
  This is the actual bug class in play, and it only touches mcp, platform, and
  renderer.
- **Network coupling** (skills calling mcp's tools over HTTP: `catalog_list`,
  `bundle_put`, `fleet_siblings`, `bundle_publish`) — a runtime API contract.
  Identical behavior regardless of which repo the caller's source lives in. This
  is how skills, `site-starter`, and claude.ai itself already talk to mcp, and
  none of those get folded in — moving `skills/`/`docs/` into site-hosting would
  change zero bytes of how that call works.

`website_info/` was also considered and excluded: it's read-only intake data a
human drops in before generation starts (client brief, colours, images). Grep
across the repo confirms nothing at runtime reads or writes it — the pipeline's
first write happens into `content/<client>/site.json`, produced by the skill,
after the brief has already been read once. No runtime dependency, no reason to
move it.

### content/'s role

`fleet_siblings` reads `content/` live for divergence checking during generation.
Whichever mcp instance is actually serving creators needs it locally — so it moves
to wherever mcp ends up running, i.e. site-hosting.

To avoid recreating the same drift problem one layer up (two copies of content/,
one per repo, silently diverging), `content/` is **not duplicated**. It's:

- Physically stored in `site-hosting/content/` (colocated with the always-on mcp).
- Read by `ai-website`'s local preview via a **path override**, the same pattern
  mcp already uses for `PLATFORM_DIR`: `CONTENT_DIR=/path/to/site-hosting/content`
  instead of the current `../content`, when a developer wants to preview against
  the real fleet. `ai-website` does not get its own copy.

## Scope

**Moves to site-hosting** (fresh copy, no git history rewrite — old files are
removed from ai-website with a note pointing at the new location; history is
still recoverable from ai-website's existing commits if ever needed):

- `mcp/` (server code, `tunnel.sh`, fixtures)
- `content/` (currently gitignored/empty in ai-website; moves as a directory, no
  data migration needed since it starts empty)

**Stays in ai-website:**

- `skills/`, `plugin/`, `docs/`, `website_info/`, `dev/fleet-archive/`
- `renderer/` (ai-website keeps its own submodule checkout for local block
  preview/dev — this copy's pin is allowed to drift from site-hosting's; it's
  dev-only and never touches prod)

**Deploy:**

- `site-hosting/update.sh` gains an mcp build+restart step (or a sibling
  `update-mcp.sh` invoked from it) — pm2-managed process alongside the existing
  `site-hosting` and `rag-worker` processes.
- One `git pull` now updates farm, renderer, catalog server, and content
  together — the specific goal of this change.

## Known conflict — must clear before implementation

`workers.md` in ai-website shows agent `opus-draft-patch` actively editing
`mcp/src/**` and `mcp/.gitignore` right now (commit at 2026-09-10 10:23, files
modified minutes ago — not stale). Moving `mcp/` wholesale will collide with that
in-flight work. Implementation must not start on the mcp move until that claim
clears, or the two efforts get explicitly coordinated (e.g., let that work land
and merge first, then move the settled `mcp/` tree).

## Out of scope

- Changing how `fleet_siblings` sources its data (e.g., querying site-hosting's
  Payload DB of published bundles instead of a local folder) — a real
  architectural improvement candidate for later, but not needed to fix the
  immediate deploy/drift problem and adds scope beyond what was asked.
- Any change to the mcp↔site-hosting HTTP contract (`SITE_HOSTING_URL`/`KEY`,
  `bundle_publish`) — unaffected by where mcp's source lives.
- Preserving git history for the moved files (explicitly declined — fresh copy).

## Migration steps (detail belongs in the implementation plan)

1. Wait for `mcp/src/**` conflict to clear (see above).
2. Copy `mcp/` into `site-hosting/mcp/`; copy `content/` into
   `site-hosting/content/`.
3. Point `site-hosting/mcp`'s `file:` deps at its new sibling `../platform` /
   `../renderer` (same submodules site-hosting already has — no new checkout).
4. Remove `mcp/` and `content/` from ai-website; leave a short pointer note
   (e.g. in `CLAUDE.md`) saying where they went and why.
5. Update ai-website's preview docs/commands to use
   `CONTENT_DIR=<path-to-site-hosting>/content` instead of `../content`.
6. Add mcp build+restart to `site-hosting/update.sh` (or a called sibling
   script), as its own pm2 process, isolated from the CMS build/migrate steps so
   a failure in one doesn't block the other.
7. Update `mcp/tunnel.sh` / `setup-mcp.sh` references and any doc mentioning
   mcp's location relative to ai-website.
8. Smoke test: `cd mcp && npm run smoke` and `npm run prove` from the new
   location; confirm `catalog_list` and `fleet_siblings` work against the
   colocated content/renderer/platform.
