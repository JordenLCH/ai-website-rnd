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
| `platform/` | **git submodule** → [`website-platform`](https://github.com/JordenLCH/website-platform). The server side — build farm and SEO/AEO/GEO derivation. Runs after upload, and `site-hosting` pins the same repo |
| `plugin/` | the `website-create` plugin — the skill and the catalog MCP packaged as one install. Self-contained: it carries its own marketplace entry, so it needs no public storefront. `plugin/skills/` is **generated** — see [`docs/plugin-release-sop.md`](docs/plugin-release-sop.md) before touching it |
| `skills/` | the distributable skills and **the source copy** — `create-webpage` (the workflow) and `sourcing-stock-photos` (photography when a brief has none, usable on its own). `./skills/install.sh [../site-starter]` syncs every directory holding a `SKILL.md` into `plugin/skills/` and a starter checkout; adding a skill is adding a directory. Copies drift: the starter's still told creators to fall back to a stale catalog after this one stopped |
| `website_info/` | five real client briefs with copy, brand colours and local images |
| `docs/` | research + spike findings, with the reasoning behind every design decision |

`mcp/` (the catalog MCP server) and `content/` (the fleet) moved to `site-hosting` on 2026-09-10 —
see [`docs/superpowers/specs/2026-09-10-mcp-content-to-site-hosting-design.md`](docs/superpowers/specs/2026-09-10-mcp-content-to-site-hosting-design.md)
for why. They previously depended on `file:../platform` and `file:../renderer` from *this* repo's
checkouts, a second independent pin of the same submodules site-hosting already carries — the
persistent-server move made that drift real instead of latent. Both now live at
`site-hosting/mcp/` and `site-hosting/content/`, resolving `file:../farm/platform` and
`file:../farm/renderer` there instead. Start the catalog server from `site-hosting/mcp` (`./tunnel.sh`),
not from here.

**Start with [`docs/how-a-site-gets-generated.md`](docs/how-a-site-gets-generated.md)** — the
end-to-end account of the pipeline: the nine workflow stages and why they run content → structure →
look, the four safeguard layers and what each can actually see, what the platform derives after
upload, and the defects the first full block audit found. This file is the reference; the sections
below are the working detail.

**Shipping a fix to a creator is [`docs/plugin-release-sop.md`](docs/plugin-release-sop.md)** —
the version bump is the only signal a user has that their copy is stale, `plugin/skills/` is an
rsync target that a `--delete` sync will silently overwrite, and claude.ai needs the connector
configured separately because the plugin's `${CATALOG_TOKEN}` cannot expand on the web.

Content lives in `site-hosting/content/<client>/` as three files: `site.json`, `theme.json`, `org.json`.
The renderer discovers them by folder — adding a client is adding a directory, not editing an import.
Point a local preview at it with `CONTENT_DIR=<path-to-site-hosting>/content`.

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
npm --prefix renderer install && npm --prefix platform install
```

There is no root package manifest — each of `renderer/` and `platform/` installs its own. `mcp/`
now lives in `site-hosting`, where it resolves `platform`/`renderer` the same way, by `file:` path
into that repo's own submodule checkout — see the note under Layout above.

**`platform/` is a submodule for the same reason**, added later: it has two consumers that are not
each other — this repo, where it is developed beside the catalog, and `site-hosting`, which runs it
on every publish. The second used to reach it by filesystem path (`PLATFORM_DIR`), so a checkout
nobody had updated built sites against an old catalog with nothing to say so. It keeps
`file:../renderer`, which means **both are checked out side by side, and the pair moves together** —
a host repo carrying one without the other, or at mismatched pins, is the situation the
`file:` path exists to prevent.

Two rules that matter:

- **Work on a branch inside the submodule.** A fresh `git submodule update` leaves it on a detached
  HEAD, and commits made there are unreachable once you switch away. `cd renderer && git checkout main`,
  and the same for `platform`.
- **A renderer change is two commits.** One in `renderer/`, pushed to `website-renderer`; then one
  here bumping the gitlink. Until you bump, this repo still builds against the old catalog.
  `site-hosting` pins its own `farm/renderer` separately, so a renderer change only reaches
  production once that pin moves too — same two-commit shape, done again over there.

  **A build-farm change is different: `site-hosting` no longer pins `farm/platform` by hand.**
  `update.sh` runs `git submodule update --remote farm/platform` on every deploy, so whatever is on
  `website-platform`'s `main` goes live on the *next prod deploy after you push* — no gitlink bump,
  no second commit, no "forgot to update the pin" failure mode (2026-09-10, after finding platform
  had no drift guard the way renderer's `catalogDrift` does). Push to `website-platform` main only
  when you mean for it to ship. This repo's own `platform/` stays a manually-pinned submodule for
  local dev/testing before that push — it is not what `update.sh` reads.

Never import the renderer by relative path — `../../renderer/src/…` is what made it unmovable, and
`mcp` had four of them. Import by package name, the way `platform` already did.

## The two artifacts

- **`site.json`** — `{ client, chrome: { header, footer }, pages: { <key>: { title, blocks: [...] } } }`
  where each block is `{ type, variant, props }`.

  **`chrome` is where Nav and Footer go — once for the whole site.** The renderer draws
  `chrome.header`, then the page's blocks, then `chrome.footer`. Page `blocks` arrays must not
  contain Nav or Footer; repeating them per page means five copies to keep in sync and a header
  that can silently differ between pages. `chrome` is optional in the schema only so older bundles
  keep validating — every bundle in `site-hosting/content/` now uses it, so copy that shape.
- **`theme.json`** — `{ name, tokens: {39 CSS custom properties}, sectionStyles: { <slug>: {layout, tone, vars?} } }`

The `variant` is an **opaque slug** (`hero/home`, not `hero/dark-overlay`). The theme decides what it
looks like. That indirection is why swapping one JSON file re-skins every page — layouts, tone
rhythm and type all change while content stays untouched.

## Commands

```bash
# preview the real fleet — content now lives in site-hosting, point the preview at it
cd renderer && CONTENT_DIR=<path-to-site-hosting>/content npm run dev         # :5183
cd renderer && npm run validate -- <path-to-site-hosting>/content/<client>/site.json <path-to-site-hosting>/content/<client>/theme.json

# creator side lives in the site-starter repo, which installs the renderer from git
#   npm run dev / npm run validate / npm run package

# platform side
cd platform && npm run build -- <bundle-dir> <out-dir>   # HTML + JSON-LD + sitemap + llms.txt
cd platform && npm run build -- <bundle-dir> <out-dir> --deploy=<domain>   # …and push it to Cloudflare Pages

# catalog MCP now lives in site-hosting — run these from site-hosting/mcp, not here
#   npm run smoke / ./tunnel.sh (:8787, bearer auth) / npm start (stdio) / npm run prove

# publishing: put these in site-hosting/mcp/.env.local, which tunnel.sh sources, and `bundle_publish` appears
#   SITE_HOSTING_URL=http://127.0.0.1:3000  SITE_HOSTING_KEY=<site-hosting's BUNDLE_KEY>
# without them the tool says so rather than pretending to store anything
# going live is a second, separate pair, and it lives in site-hosting/.env, not here:
#   CLOUDFLARE_API_TOKEN  CLOUDFLARE_ACCOUNT_ID   — absent, a publish builds but never deploys
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

**Where the site actually lands: Cloudflare Pages.** The last step of a publish is
`platform/src/deploy.ts` — one Pages project per site, named from the domain (`merryfair.com` →
`merryfair-com.pages.dev`), direct-uploaded with `wrangler pages deploy`, custom domain attached
over the API afterwards. Deploying is opt-in at every layer, and each layer says so rather than
guessing: the farm CLI only deploys when passed `--deploy=<domain>`, `deployToPages` returns
`{status:'skipped'}` when the credentials are absent, and hosting's publish route sets
`deploy: Boolean(CLOUDFLARE_API_TOKEN && CLOUDFLARE_ACCOUNT_ID)`. A build that published every
time it ran would publish a bundle somebody was only checking.

That last gate is the one that surprises people: with those two variables unset in
`site-hosting/.env`, publish still answers `202 {"deploying":false}` and builds happily into
`dist-tenants/<domain>/` — a success that never went live. **`deploying` in the publish response is
the field to read**, not the build status.

### Running the whole chain locally

Four processes, in this order. Each one's absence has a different symptom, which is why they are
worth naming separately.

```bash
docker compose up -d database                 # in site-hosting — Payload has no store without it
cd site-hosting && npm run dev                # :3000 — stores bundles, serves /upload/<code>, runs the farm
cd site-hosting/mcp && ./tunnel.sh            # :8787 — catalog + bundle_* tools, behind the named tunnel
```

`bundle_publish` appears only when the **catalog server** has a hosting target, and the catalog
server gets its environment from `tunnel.sh`, not from a shell you happened to export in. It
sources an untracked `site-hosting/mcp/.env.local` for exactly this:

```bash
SITE_HOSTING_URL=http://127.0.0.1:3000
SITE_HOSTING_KEY=<site-hosting's BUNDLE_KEY, copied verbatim from its .env>
```

So the credentials arrive in two different places for two different reasons, and mixing them up
produces two different failures. `SITE_HOSTING_*` belongs to **`site-hosting/mcp/.env.local`** —
without it `bundle_publish` refuses with a message saying nothing was stored. `CLOUDFLARE_API_TOKEN`
and `CLOUDFLARE_ACCOUNT_ID` belong to **`site-hosting/.env`** — without them the site builds and
never deploys. Neither is inherited from the other process; a restart of the wrong one changes nothing.

**Proven end to end on 2026-09-10**, fixture `site-hosting/mcp/fixtures/merryfair` published as
`e2e-proof.example`: 22 pictures uploaded through the browser half, farm build green
(platform `f3ad99e`, renderer `de22a2f`, catalog `0.5.0`), `wrangler` deployed, and
`e2e-proof-example.pages.dev` served all four pages plus `sitemap.xml`, `llms.txt`, the JSON-LD
graph and the `.webp` assets. The custom-domain attach was the one step that did not complete —
`.example` is not a real zone, so whether that token carries the zone scope `attachDomain` needs is
still unproven. `attachDomain` is best-effort by design: it logs and returns `null` rather than
failing the deploy, so a site can go live at `*.pages.dev` with its own domain silently unattached.
Check the `domain` field in the deploy result, not just the exit code.

The preview app has three dropdowns — `site`, `theme`, and page tabs — plus a status readout that
turns red and lists issues when a bundle is invalid.

## Where each concern lives, and why

**Never hand-edit `.mcp.json`.** It is gitignored in every repo and written by `setup-mcp.sh`
(each repo keeps its own copy of this script — it just writes local config), because it holds a
live token and because an edited copy drifts out of sync with the server's `.catalog-token` — which
surfaces as an unexplained auth failure at the next session start. `site-hosting/mcp/tunnel.sh` runs
the script *in site-hosting* for you when it starts the server; this repo's own copy still needs
running by hand to point *this* repo's agent at that server, since mcp no longer lives here.

```bash
./setup-mcp.sh --show          # what is configured now
./setup-mcp.sh --env           # reference $CATALOG_TOKEN instead of writing the token
./setup-mcp.sh <token> <url>   # point this repo at the running catalog server, e.g. http://127.0.0.1:8787
```

Both repos use `type: "http"` with a bearer token — this repo against `127.0.0.1:8787` (or wherever
site-hosting's mcp is actually running), and `site-starter` against the public tunnel, which is
what a creator on another machine gets. The
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
`merryfair` and `aonic` were already built — they are in `dev/fleet-archive/`, so generating those
proves nothing.

1. **Connect the catalog.** `cd site-hosting/mcp && ./tunnel.sh`, then confirm `catalog_list` returns
   the block count and a `catalogVersion`. If the MCP shows as disconnected, the server is not
   running — start it rather than falling back to the offline catalog, or `fleet_siblings` silently
   never runs and the divergence check in step 3 is skipped without saying so.
2. **Invoke the `create-webpage` skill** and follow it. Read the brief, propose a sitemap, sample
   four art directions and justify the pick, then compose.
3. **Check divergence** with `fleet_siblings` before writing content. Layout-map overlap above ~0.7
   against a sibling means change the layout map, not the palette. The fleet is empty until a site is
   written into `site-hosting/content/`, and the tool now answers `checked: false` and says so — that
   is the check not running, not a pass. Restore a comparison set from `dev/fleet-archive/` if you
   want one.
4. **Write** `site-hosting/content/<client>/site.json` and `site-hosting/content/<client>/theme.json`.
   There is nothing to register — the preview globs `content/*/`, so a new folder just appears in the
   dropdown. Put Nav and Footer in `site.chrome`, not in each page's `blocks`.
5. **Validate** until clean, then **preview** (`CONTENT_DIR=<path-to-site-hosting>/content`) and
   actually look at all pages at two widths.
6. **Package** with `renderer/tools/compress.sh` and confirm the zip contains source JSON and assets
   — never `dist/`.

**Report back:** whether the site reads as a different company from the three existing ones; anything
the catalog could not express; any validator message that was wrong, unclear, or missing; and whether
the skill's instructions were sufficient without reading this file. That last one matters most — the
skill ships to people who will not have this repo's context.
