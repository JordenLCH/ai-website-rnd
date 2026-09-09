# ai-website — AI site generation POC

Sites are generated as **validated JSON**, never hand-written HTML. A block catalog plus a
swappable theme produces the page; a build step renders it to static HTML. This is what keeps
every generated site patchable: ship a fix to a block and every site inherits it on rebuild —
but only because no site contains bespoke markup.

If you are here to **test the flow**, jump to "Test task" at the bottom.

## Layout

| Path | What it is |
|---|---|
| `renderer/` | **git submodule** → [`website-renderer`](https://github.com/JordenLCH/website-renderer). `@blackdash/renderer`: block catalog, validator, preview server. Preview and checking only — no fleet, no SEO, no MCP |
| `mcp/` | the catalog MCP server (HTTP + bearer, plus a stdio entry point). Read-only, except for the three `bundle_*` tools that hand a finished bundle to hosting — the store stays on the far side |
| `platform/` | **git submodule** → [`website-platform`](https://github.com/JordenLCH/website-platform). The server side — build farm and SEO/AEO/GEO derivation. Runs after upload, and `site-hosting` pins the same repo |
| `content/` | the fleet — one folder per client, gitignored. This repo's work product, not catalog code |
| `skills/create-webpage/` | the distributable skill creators use, and **the source copy** — `./skills/install.sh [../site-starter]` pushes it to `~/.claude/skills/` and a starter checkout. Three copies exist and they drift: the starter's still told creators to fall back to a stale catalog after this one stopped |
| `website_info/` | five real client briefs with copy, brand colours and local images |
| `docs/` | research + spike findings, with the reasoning behind every design decision |

**Start with [`docs/how-a-site-gets-generated.md`](docs/how-a-site-gets-generated.md)** — the
end-to-end account of the pipeline: the nine workflow stages and why they run content → structure →
look, the four safeguard layers and what each can actually see, what the platform derives after
upload, and the defects the first full block audit found. This file is the reference; the sections
below are the working detail.

Content lives in `<repo>/content/<client>/` as three files: `site.json`, `theme.json`, `org.json`.
The renderer discovers them by folder — adding a client is adding a directory, not editing an import.

## Two submodules: the renderer and the platform

Full reasoning — what this replaced, why the two consumers use different mechanisms, and the
defects extraction exposed — is in
[`docs/2026-09-09-renderer-as-a-shared-repo.md`](docs/2026-09-09-renderer-as-a-shared-repo.md).

`renderer/` is a checkout of **website-renderer**, the repo that owns the catalog. Both this repo
and `site-starter` consume that one source; neither owns a copy. It was a one-way subtree mirror
before, which let the two drift — and they had, by one commit.

```bash
git clone --recurse-submodules <this repo>     # or, in an existing clone:
git submodule update --init                    # brings both renderer/ and platform/
```

`platform` and `mcp` still resolve `file:../renderer`, so nothing about their imports changed.

**`platform/` is a submodule for the same reason**, added later: it has two consumers that are not
each other — this repo, where it is developed beside the catalog, and `site-hosting`, which runs it
on every publish. The second used to reach it by filesystem path (`PLATFORM_DIR`), so a checkout
nobody had updated built sites against an old catalog with nothing to say so. It keeps
`file:../renderer`, which means **both are checked out side by side, and the pair moves together** —
a host repo carrying one without the other, or at mismatched pins, is the situation the
`file:` path exists to prevent.

Two rules that matter:

- **Work on a branch inside the submodule.** A fresh `git submodule update` leaves it on a detached
  HEAD, and commits made there are unreachable once you switch away. `cd renderer && git checkout main`.
- **A block change is two commits.** One in `renderer/`, pushed to `website-renderer`; then one here
  bumping the gitlink. Until you bump, this repo still builds against the old catalog.

Never import the renderer by relative path — `../../renderer/src/…` is what made it unmovable, and
`mcp` had four of them. Import by package name, the way `platform` already did.

## The two artifacts

- **`site.json`** — `{ client, chrome: { header, footer }, pages: { <key>: { title, blocks: [...] } } }`
  where each block is `{ type, variant, props }`.

  **`chrome` is where Nav and Footer go — once for the whole site.** The renderer draws
  `chrome.header`, then the page's blocks, then `chrome.footer`. Page `blocks` arrays must not
  contain Nav or Footer; repeating them per page means five copies to keep in sync and a header
  that can silently differ between pages. `chrome` is optional in the schema only so older bundles
  keep validating — every bundle in `content/` now uses it, so copy that shape.
- **`theme.json`** — `{ name, tokens: {39 CSS custom properties}, sectionStyles: { <slug>: {layout, tone, vars?} } }`

The `variant` is an **opaque slug** (`hero/home`, not `hero/dark-overlay`). The theme decides what it
looks like. That indirection is why swapping one JSON file re-skins every page — layouts, tone
rhythm and type all change while content stays untouched.

## Commands

```bash
# preview this repo's fleet — content lives outside the renderer, so point at it
cd renderer && CONTENT_DIR=../content npm run dev         # :5183
cd renderer && npm run validate -- ../content/<client>/site.json ../content/<client>/theme.json

# creator side lives in the site-starter repo, which installs the renderer from git
#   npm run dev / npm run validate / npm run package

# platform side
cd platform && npm run build -- <bundle-dir> <out-dir>   # HTML + JSON-LD + sitemap + llms.txt
cd mcp && npm run smoke                    # validates every bundle, proves the gates fire
cd mcp && ./tunnel.sh                      # start the catalog server (HTTP :8787, bearer auth)
cd mcp && npm start                        # stdio form, if you need it standalone
cd mcp && npm run prove                    # 20 headless checks, including the publish path

# publishing: set these on the catalog server and `bundle_publish` appears
#   SITE_HOSTING_URL=http://127.0.0.1:3000  SITE_HOSTING_KEY=<site-hosting's BUNDLE_KEY>
# without them the tool says so rather than pretending to store anything
```

## Publishing, and where the other half lives

A creator on the chat path ends at `bundle_publish`. That sends the validated JSON to
**`site-hosting`**, which stores it, serves the browser page where the photographs are added
(`/upload/<code>`), and then builds the site by invoking *this* repo's build farm as a child
process. Nothing is rendered twice: hosting hosts, the farm renders.

The pictures never travel through the conversation — base64 in a transcript is several times the
file size and is re-sent every turn, so one site's photography would cost more than the site. The
chat carries paths; the browser carries bytes. `platform/src/assets.ts` is the single answer to
"which pictures does this site need", read from the props the build will actually resolve and sent
to hosting rather than recomputed there.

**How the two repos are joined, and what defends the joint.** `site-hosting` carries the same two
submodules and runs the farm from its own checkout (`PLATFORM_DIR` still overrides, for a
development farm). That records which farm it expects; it does not guarantee the checkout is
current. The guarantee is `catalogDrift` in the renderer: every bundle stores the catalog it was
composed against, and **a farm older than the bundle refuses to build**. That direction is the
dangerous one — migrations only run forwards, so an out-of-date farm renders a page that parses,
looks fine, and is the wrong site. Forward drift stays a note, because that is the fleet-patch
story working.

The preview app has three dropdowns — `site`, `theme`, and page tabs — plus a status readout that
turns red and lists issues when a bundle is invalid.

## Where each concern lives, and why

**Never hand-edit `.mcp.json`.** It is gitignored in both repos and written by `setup-mcp.sh`,
because it holds a live token and because an edited copy drifts out of sync with
`mcp/.catalog-token` — which surfaces as an unexplained auth failure at the next session start.
`mcp/tunnel.sh` runs the script for you, so starting the server also configures this repo.

```bash
./setup-mcp.sh --show          # what is configured now
./setup-mcp.sh --env           # reference $CATALOG_TOKEN instead of writing the token
./setup-mcp.sh <token> <url>   # another endpoint: staging, a dev tunnel
```

Both repos use `type: "http"` with a bearer token — this repo against `127.0.0.1:8787`, and
`site-starter` against the public tunnel, which is what a creator on another machine gets. The
stdio form still exists as an entry point but is no longer the config: it cold-starts `tsx` at
session init and intermittently misses the client's connect timeout, which surfaces as
`CONNECTION_CLOSED` with nothing to debug. An already-running HTTP server survives client restarts.

Two failure modes worth telling apart. `CONNECTION_CLOSED` / connection refused means the local
server on `:8787` is not running. A **502 from the tunnel** means the same thing seen from outside —
Cloudflare is up and the origin behind it is not; it is never a tunnel problem.

**MCP serves only what drifts**: the block catalog, prop schemas, the token contract, and the fleet
of existing sites. Those change on the platform's schedule and a creator's machine cannot know them.
Anything written into the skill is a snapshot that will eventually be wrong, so the skill calls
`catalog_list` first and treats its bundled `references/catalog.md` as an offline fallback.

**Block schemas change; stored bundles do not get rewritten.** A block's `deprecated` array
(`renderer/src/blocks/shared.ts`) holds each old prop shape plus a pure `migrate()` to the current
one. `validate-bundle.ts` tries the current schema first, then these newest-first, taking the first
that parses — so a site written against last year's catalog stays valid and renders correctly with no
bulk rewrite of stored JSON, which is a migration with no undo. Rules: pure functions only, never
chain (each entry migrates straight to *current*), and add a fixture to `renderer/tools/migrations.ts`
the same day — `npm run migrations` fails if a declared deprecation has none. Drop an entry only once
a fleet sweep shows zero sites on that shape; unlike a public CMS the fleet here is enumerable, so
that cleanup can actually finish.

**Validation lives with the renderer** (`renderer/src/validate-bundle.ts`), imported by both the
creator CLI and — in production — the build farm. Two copies of a validator means "valid locally,
fails on publish", which erodes trust in a platform faster than any missing feature.

**Publishing is a plain HTTP upload** of the source bundle. Never upload built HTML: it cannot be
re-themed, cannot receive a fleet-wide SEO/AEO patch, and cannot be migrated when a block changes.

**SEO/AEO/GEO, hosting and refresh are server concerns**, implemented in `platform/`. The build farm
renders the same React catalog the preview uses, then derives every artifact from the content tree:

| Source | Becomes | What it actually buys, as of 2026-09 |
|---|---|---|
| `org.json` | `Organization` / `LocalBusiness` | **Entity understanding.** The highest-value output here — this is what a knowledge panel and an AI answer are grounded on |
| `Locations` block | `LocalBusiness` + `PostalAddress` | Local pack eligibility |
| `SpecTable` / `CatalogGrid` | `Product` + `additionalProperty` | Product rich results — still live |
| `Hero.breadcrumb` | `BreadcrumbList` | Breadcrumb trail in the SERP — still live |
| `Testimonials` | `Review` | Comprehension only. Self-serving `Review` has not produced stars since 2019, and Google's **2026-07-24 fake-review policy** makes an unverified one a liability — which is why the `unverified` gate strips it |
| `FAQ` block | `FAQPage` | **No rich result.** Deprecated Search-wide on **2026-05-07**. Valid markup, machine-readable, zero SERP effect |
| `Steps` block | `HowTo` | **No rich result.** Retired **September 2023**. Same status as FAQ |

Do not tell a client that an FAQ or Steps block earns a rich result — it has not for years. Emitting
them is still right (they cost nothing and describe the page accurately to non-Google consumers), but
the honest pitch for this pipeline is **entity clarity via `org.json`**, not SERP decoration.

`org.json` holds what marketing copy never states and a model must not invent: legal name, founding
date, registration number, address, phone, email, `sameAs` profiles, certifications, credentialled
people, area served. `sameAs` matters most — it lets a crawler corroborate the entity somewhere the
client does not control. Collect these at intake.

Nothing in a bundle should contain schema markup or hand-written meta. The lever at generation time
is choosing the semantically correct block, because block type is what the generator reads.

## Rules that matter when generating

- **Never invent facts.** No fabricated prices, staff, testimonials or news. If a block needs content
  the brief lacks (`Team`, `PostList`), leave it out and say why.
- **Art direction is where sites become templated.** The first direction a model proposes is the mode
  of its training data. Generate four with self-assessed probabilities, discard the likeliest, pick
  from the tail. Colour carries the *least* identity; layout selection and tone rhythm carry the most.
- **Content must suit the layout.** `overlay-fullbleed` puts text on the photo, so it requires
  `imageKind: "environment"` — a product cutout on white becomes unreadable. The validator enforces this.
- **No raw values in `site.json`** — no hex, no px, no font names. Those belong to the theme.
- **Slugs are editorial roles**, not block types: `hero/home`, `hero/page`, `hero/statement` should
  resolve differently. Expect ~2 slugs per block type.

## Known gotchas

Each was a real bug; the symptom misleads, so the cause is worth knowing.

- `clip-path: inset(0 0 100% 0)` shrinks the box IntersectionObserver measures, so a reveal gated on
  it can never fire. Leave a sliver.
- A sticky element inside a section sticks for zero pixels — its containing block is that section.
  The section wrapper must be sticky.
- Unscoped `[data-tone]` selectors match both a section's tone and a primitive's, painting accent
  text on an accent background. Primitive attributes are namespaced `data-p*`.
- A child that resets `margin: 0` (list resets) defeats the parent's `margin-inline: auto`.
- Fixed grid areas in a header overlap as the viewport narrows. Chrome uses flex rows with
  `justify: between`.

## Preview quirks

The preview scrolls inside `.stage`, not the window — scroll that element, and pass it as the
IntersectionObserver root. `zoom` on `.stage` is handy for full-page screenshots but distorts
intersection maths, so reset it to `1` before judging motion.

---

# Test task

Goal: exercise the whole flow on a brief nobody has generated yet, and report where it breaks.

**Use `website_info/gmr/` (Guard My Ride) or `website_info/wungadv/` (Wung & Co Advocates).**
`merryfair` and `aonic` are already built — generating those proves nothing.

1. **Connect the catalog.** `cd mcp && ./tunnel.sh`, then confirm `catalog_list` returns the block
   count and a `catalogVersion`. If the MCP shows as disconnected, the server is not running — start
   it rather than falling back to the offline catalog, or `fleet_siblings` silently never runs and
   the divergence check in step 3 is skipped without saying so.
2. **Invoke the `create-webpage` skill** and follow it. Read the brief, propose a sitemap, sample
   four art directions and justify the pick, then compose.
3. **Check divergence** with `fleet_siblings` before writing content. Layout-map overlap above ~0.7
   against `merryfair`, `merryfair-industrial` or `aonic` means change the layout map, not the palette.
4. **Write** `content/<client>/site.json` and `content/<client>/theme.json`. There is nothing to
   register — the preview globs `content/*/`, so a new folder just appears in the dropdown. Put Nav
   and Footer in `site.chrome`, not in each page's `blocks`.
5. **Validate** until clean, then **preview** (`CONTENT_DIR=../content`) and actually look at all
   pages at two widths.
6. **Package** with `renderer/tools/compress.sh` and confirm the zip contains source JSON and assets
   — never `dist/`.

**Report back:** whether the site reads as a different company from the three existing ones; anything
the catalog could not express; any validator message that was wrong, unclear, or missing; and whether
the skill's instructions were sufficient without reading this file. That last one matters most — the
skill ships to people who will not have this repo's context.
