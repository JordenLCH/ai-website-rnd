# ai-website — AI site generation POC

Sites are generated as **validated JSON**, never hand-written HTML. A block catalog plus a
swappable theme produces the page; a build step renders it to static HTML. This is what keeps
every generated site patchable: ship a fix to a block and every site inherits it on rebuild —
but only because no site contains bespoke markup.

If you are here to **test the flow**, jump to "Test task" at the bottom.

## Layout

| Path | What it is |
|---|---|
| `spike/` | `@blackdash/renderer` — block catalog, validator, preview server. Consumed as a dependency; creators never edit it |
| `mcp/` | read-only catalog MCP server (HTTP + bearer, plus a stdio entry point) |
| `platform/` | the server side — build farm and SEO/AEO/GEO derivation. Runs after upload |
| `starter/` | what a creator clones: content JSON and assets only, no catalog |
| `skills/create-webpage/` | the distributable skill creators use. Also installed at `~/.claude/skills/` |
| `website_info/` | five real client briefs with copy, brand colours and local images |
| `docs/` | research + spike findings, with the reasoning behind every design decision |

Content lives in `<repo>/content/<client>/` as three files: `site.json`, `theme.json`, `org.json`.
The renderer discovers them by folder — adding a client is adding a directory, not editing an import.

## The two artifacts

- **`site.json`** — `{ client, chrome: { header, footer }, pages: { <key>: { title, blocks: [...] } } }`
  where each block is `{ type, variant, props }`.

  **`chrome` is where Nav and Footer go — once for the whole site.** The renderer draws
  `chrome.header`, then the page's blocks, then `chrome.footer`. Page `blocks` arrays must not
  contain Nav or Footer; repeating them per page means five copies to keep in sync and a header
  that can silently differ between pages. `chrome` is optional in the schema only so older bundles
  keep validating — every spec in `renderer/src/specs/` now uses it, so copy that shape.
- **`theme.json`** — `{ name, tokens: {39 CSS custom properties}, sectionStyles: { <slug>: {layout, tone, vars?} } }`

The `variant` is an **opaque slug** (`hero/home`, not `hero/dark-overlay`). The theme decides what it
looks like. That indirection is why swapping one JSON file re-skins every page — layouts, tone
rhythm and type all change while content stays untouched.

## Commands

```bash
# creator side — starter/ has no catalog in it
cd starter && npm run dev                  # preview at :5183, renderer comes from node_modules
cd starter && npm run validate
cd starter && ./package.sh <client>        # zips the source bundle for upload

# platform side
cd platform && npm run build -- <bundle-dir> <out-dir>   # HTML + JSON-LD + sitemap + llms.txt
cd mcp && npm run smoke                    # validates every bundle, proves the gates fire
cd mcp && ./tunnel.sh                      # start the catalog server (HTTP :8787, bearer auth)
cd mcp && npm start                        # stdio form, if you need it standalone
```

The preview app has three dropdowns — `site`, `theme`, and page tabs — plus a status readout that
turns red and lists issues when a bundle is invalid.

## Where each concern lives, and why

**The catalog MCP is HTTP, not stdio.** Both `.mcp.json` files use `type: "http"` with a bearer
token. `ai-website/.mcp.json` is committed, so it reads the token from `${CATALOG_TOKEN}` rather than
holding it — export it before starting a session:

```bash
export CATALOG_TOKEN="$(cat mcp/.catalog-token)"   # worth putting in your shell profile
```

`site-starter/.mcp.json` is gitignored and carries the literal token and the public tunnel URL, which
is what a creator on another machine gets from `./setup-mcp.sh`. The stdio form was the earlier
default and was dropped as the config: it cold-starts `tsx` at session init and intermittently
misses the client's connect timeout, which surfaces as `CONNECTION_CLOSED` with nothing to debug.
An already-running HTTP server survives client restarts.

Two failure modes worth telling apart. `CONNECTION_CLOSED` / connection refused means the local
server on `:8787` is not running. A **502 from the tunnel** means the same thing seen from outside —
Cloudflare is up and the origin behind it is not; it is never a tunnel problem.

**MCP serves only what drifts**: the block catalog, prop schemas, the token contract, and the fleet
of existing sites. Those change on the platform's schedule and a creator's machine cannot know them.
Anything written into the skill is a snapshot that will eventually be wrong, so the skill calls
`catalog_list` first and treats its bundled `references/catalog.md` as an offline fallback.

**Validation lives with the renderer** (`renderer/src/validate-bundle.ts`), imported by both the
creator CLI and — in production — the build farm. Two copies of a validator means "valid locally,
fails on publish", which erodes trust in a platform faster than any missing feature.

**Publishing is a plain HTTP upload** of the source bundle. Never upload built HTML: it cannot be
re-themed, cannot receive a fleet-wide SEO/AEO patch, and cannot be migrated when a block changes.

**SEO/AEO/GEO, hosting and refresh are server concerns**, implemented in `platform/`. The build farm
renders the same React catalog the preview uses, then derives every artifact from the content tree:

| Source | Becomes |
|---|---|
| `FAQ` block | `FAQPage` |
| `Locations` block | `LocalBusiness` + `PostalAddress` |
| `SpecTable` / `CatalogGrid` | `Product` + `additionalProperty` |
| `Testimonials` | `Review` |
| `Steps` | `HowTo` |
| `Hero.breadcrumb` | `BreadcrumbList` |
| `org.json` | `Organization` — the E-E-A-T carrier |

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
4. **Write** `renderer/src/specs/<client>.json` and `renderer/src/themes/<client>.json`, then register both
   in `renderer/src/App.tsx` so they appear in the dropdowns. Put Nav and Footer in `site.chrome`, not
   in each page's `blocks`.
5. **Validate** until clean, then **preview** and actually look at all pages at two widths.
6. **Package** with `compress.sh` and confirm the zip contains source JSON and assets — never `dist/`.

**Report back:** whether the site reads as a different company from the three existing ones; anything
the catalog could not express; any validator message that was wrong, unclear, or missing; and whether
the skill's instructions were sufficient without reading this file. That last one matters most — the
skill ships to people who will not have this repo's context.
