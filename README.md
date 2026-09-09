# blackdash-site-platform

The server side of AI site generation. Deployed once; every client site is built from it.

Sites are **validated JSON**, never hand-written HTML — a block catalog plus a swappable theme,
rendered to static HTML at build time. That is what makes a fleet maintainable: ship a fix to a block
and every site inherits it on the next rebuild, because no site contains bespoke markup.

## Packages

| Path | Role |
|---|---|
| `renderer/` | submodule → `website-renderer`. `@blackdash/renderer`: block catalog, validator, preview server. Shared with site-starter; preview and checking only |
| `content/` | the fleet — one folder per client, gitignored |
| `mcp/` | read-only catalog MCP. Serves what drifts: blocks, schemas, token contract, fleet |
| `platform/` | build farm — renders a bundle to static HTML and derives every SEO/AEO/GEO artifact |
| `skills/create-webpage/` | source of the skill shipped inside starter repos |
| `website_info/` | real client briefs used for testing |
| `docs/` | research and findings, with the reasoning behind each decision |

The companion repo is **site-starter** — content only, one clone per client. It installs the
renderer as an npm git dependency; this repo carries it as a submodule. Why they differ, and what
the arrangement replaced, is in
[`docs/2026-09-09-renderer-as-a-shared-repo.md`](docs/2026-09-09-renderer-as-a-shared-repo.md).

## Run

```bash
git submodule update --init                # renderer/ is a submodule

cd mcp && npm run smoke                  # validate every bundle, prove the gates fire
cd mcp && npm start                      # catalog over stdio
cd mcp && ./tunnel.sh                    # catalog over HTTP + public tunnel

cd platform && npm run build -- <bundle-dir> <out-dir>

./scripts/release-renderer.sh            # pack the renderer for creator repos
```

## What the build produces

From `site.json` + `theme.json` + `org.json`, with no markup parsed anywhere:

- static HTML per page, rendered from the same React catalog the creator previewed
- JSON-LD derived from block types — `FAQ` → `FAQPage`, `Locations` → `LocalBusiness`,
  `SpecTable` → `Product`, `Testimonials` → `Review`, `Steps` → `HowTo`
- `Organization` schema from `org.json`, carrying the E-E-A-T signals
- per-page title, description, canonical and Open Graph
- `sitemap.xml`, `robots.txt`, and an `llms.txt` written for answer engines

## Versioning

`CATALOG_VERSION` in `mcp/src/source.ts` is recorded in every bundle's manifest. Bump it whenever a
block's schema or layout set changes, so an old bundle can still be rebuilt faithfully — and add a
migration when the change is breaking.

## Still to build

- **Auth and upload endpoint** — `POST /api/publish`, API key per creator
- **Deployment** — `wrangler pages deploy` after build
- **Payload CMS** — bundle storage and the editor for later content changes
- **Asset pipeline** — originals in, responsive webp/avif out
- **Refresh cron** — patch lane publishes unattended; content lane produces drafts for approval
- **Migrations** — transform older bundles when a block's schema changes
