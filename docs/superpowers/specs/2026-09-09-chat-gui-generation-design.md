# Generating a site from a chat GUI, with nothing installed

**Status:** design approved 2026-09-09. Revised the same day after checking the platform docs and
building a POC — the preview mechanism changed. Not yet implemented in `mcp/`.

**Revision note.** The first version of this spec assumed the preview had to be a published
claude.ai Artifact with the catalog inlined, because an artifact cannot fetch anything. It also
assumed Claude Design could host the flow. Both were wrong, and the correction is in
"Preview is an MCP App" below.

## The problem

The creator path we built assumes a developer. `site-starter` starts with "clone the repo, install
node, `npm run dev`" — and the people who will actually run this are not all developers. Some do not
have a dev machine; some do not have a computer beyond a browser. An install step does not make the
flow harder for them, it makes it impossible.

That is a distribution flaw, not a feature gap. Everything downstream of generation — validated JSON,
one catalog, fleet-wide patching — is unaffected and stays exactly as it is. What has to change is
where the *generation* happens.

## The decision

Add a second creator path that runs entirely in a chat GUI. Do not remove the first.

Both paths produce the same three files and are checked by the same validator. Neither reimplements
the other. The new work is two MCP tools and one upload page.

| | Path A — site-starter | Path B — chat GUI |
|---|---|---|
| Requires | node, an IDE agent | a browser |
| Catalog | MCP | MCP |
| Preview | `npm run dev` | in-chat artifact, catalog served by MCP |
| Validate | `npm run validate` | `bundle_validate` over MCP |
| Deliver | `compress.sh` → zip | drop the project folder |

Path B's reference host is Claude Design, because its project folder already organises uploaded
images under `uploads/` — which is what makes image references work without a mapping layer. Any
chat GUI with skills + MCP works; the folder convention is what Claude Design gives for free.

## Why each choice, and what it rules out

### Preview is an artifact built from the real catalog, not a re-implementation

The obvious way to preview in a chat GUI is to have the model write HTML that looks like the blocks.
That is a second renderer, and a second renderer is the thing this repo is organised to prevent — it
drifts from the catalog, and the drift surfaces as "the preview looked right, the published site does
not".

So `preview_bundle` returns **the actual block catalog**, compiled to one self-contained file
(inlined CSS, no external fetches — an artifact's CSP blocks them anyway). The agent fetches it once
per session and writes an artifact that is that shell plus the bundle JSON inlined. Re-rendering after
an edit costs only the JSON, not the catalog.

What this cannot do: load the client's local images. The artifact has no filesystem and the CSP
blocks arbitrary hosts. Blocks therefore draw a labelled placeholder showing the image path and its
`imageKind`. **Layout and tone are truthful; photography is not.** Real images first appear after
upload. This is a real limitation and the skill must say so rather than let someone approve a design
believing they have seen it finished.

### Preview is an MCP App, not a published artifact

**Claude Design cannot host this flow.** Its announcement and help centre document uploads,
a canvas, and exports (`.zip`, PDF, PPTX, standalone HTML, a Claude Code handoff bundle) — and
mention neither Skills nor MCP connectors. So the host is an ordinary claude.ai chat, where both
are documented: Skills since October 2025, remote MCP custom connectors since January 2026.
Claude Design remains useful as the place assets get organised, then exported — an input stage.

The preview itself is an **MCP App** (the MCP Apps extension, shipped January 2026, supported by
Claude and Claude Desktop). A tool declares `_meta.ui.resourceUri` pointing at a `ui://` resource;
the host fetches that resource and renders it in a sandboxed iframe inside the conversation, with
a JSON-RPC channel back over postMessage.

Why this beats the artifact route, which the first draft chose:

- **The app can call our tools.** `app.callServerTool()` round-trips through the host, so
  validation happens on a click inside the preview rather than by another turn of conversation.
  No CORS, no declared origin, and the viewer's connector credentials are reused.
- **The catalog is served, not inlined.** No 16 MB page budget, no re-publishing the whole page
  to change one block.
- **One server owns catalog, validator and preview.** They cannot drift apart, because they are
  the same deployment.

A published Artifact remains the fallback if MCP Apps ever proves unavailable to us: the
`downloads` capability's allowlist covers `json` and `zip`, and the `mcp` capability lets a page
call the viewer's connectors. It is a worse fit, not an impossible one.

### Validation is the same validator, reached over MCP

`bundle_validate` runs `renderer/src/validate-bundle.ts` — the same module the build farm runs. Not a
port, not a subset. Two validators means "valid locally, fails on publish", which erodes trust in the
platform faster than any missing feature.

The MCP stays stateless: it validates and returns issues, it stores nothing. Upload is a separate
stage with its own storage and its own auth.

### The catalog MCP is a hard dependency — no offline fallback

If `catalog_list` fails, generation **stops and says so**. It does not fall back to the skill's
bundled `references/catalog.md`.

The reasoning: a stale catalog does not fail loudly. It produces a bundle that the model believes is
valid, that the person approves, and that is rejected at upload — after all the work. Every hour
saved by a fallback is repaid with interest at the moment of publishing. `references/catalog.md`
stays in the repo as human documentation, but the skill stops instructing the agent to read it. This
rule applies to **both** paths.

The consequence has to be stated plainly: **the MCP becomes infrastructure.** Today it is
`mcp/tunnel.sh` running on a laptop behind a Cloudflare tunnel, and a 502 already has a known
diagnosis. Once generation hard-fails without it, a 502 means nobody in the company can generate
anything. An always-on deploy is a blocking prerequisite for Path B, not a follow-up.

### Images are real relative paths, not invented ones or logical slots

The person uploads the photos into the chat project, so the agent has *seen* them — `alt` and
`imageKind` are grounded in the actual image rather than guessed from a filename. The prop stores the
real path into the project folder (`uploads/OPTIMISED/LOGO/FIRST/logo.svg`).

This rules out two alternatives. A model-invented path (`images/hero.jpg`) means nothing until
someone happens to name a file to match, and the mismatch only surfaces at upload. A logical-slot
indirection (`{ id: "hero-main" }` mapped at upload time) adds a mapping layer to solve a problem the
folder convention already solves.

The validator checks path shape and `imageKind` against the layout — `overlay-fullbleed` still
requires `environment`, since that rule is about legibility and holds whether or not the file exists
yet. It does **not** check that the file exists; that is the upload page's job, because only the
upload page has the files.

## Stage 1 — generation, in the chat GUI

1. Person uploads the brief and the real images into the chat project; types what a brief never
   states — phone, address, social URLs, registration number, founding date (this is `org.json`, and
   per the pipeline's own reasoning it is the highest-value output of the whole flow)
2. Person picks the brand colour
3. `catalog_list` — **down means stop**
4. Art direction: sample four, discard the likeliest, justify the pick; render a skeleton preview
   artifact so the person judges by looking
5. Sitemap proposed; `fleet_siblings` checks layout-map divergence against the existing fleet
6. Person decides or revises
7. First 3 pages → `bundle_validate` → preview artifact
8. Person decides or revises
9. Remaining pages → `bundle_validate` → preview artifact
10. Write `site.json`, `theme.json`, `org.json` into the project folder, beside `uploads/`

Nav and Footer go in `site.chrome`, once, as they already must.

## Stage 2 — the upload page

One page in `platform/`. Accepts a zip from Path A or a folder from Path B; the bundle inside is
identical.

- Re-runs the same validator server-side. Stage 1 ran on a machine we do not control, so this gate is
  not optional even though stage 1 already validated
- Rejects a bundle with an unknown catalog version, or a version the current catalog cannot migrate
- Resolves every image path against the folder and reports **missing** (referenced, no file) and
  **unused** (file present, nothing references it). The second matters more than it looks: it is what
  catches the wrong photo being wired up, which no validator can see
- Prints all errors as a single copy-pasteable block, worded to paste straight back into the chat.
  The person's debugger is the AI that wrote the bundle, so the error text is an interface, not a log
- On accept, hands to the existing derive → build → deploy path

## Stage 3 — server side

Unchanged. SEO/AEO/GEO derivation from the content tree, build, deploy, cron refresh and fleet-wide
patching.

## What the POC settled

`poc/mcp-app/` — throwaway, `npm run prove` for the assertions — stood the whole loop up against
the real catalog and a real MCP Apps host. Ten checks pass: the app tool advertises its UI, the
`ui://` resource serves over the same stateless transport `mcp/src/http.ts` already uses, the real
validator answers over MCP and rejects a broken bundle with an issue naming the break, the real
catalog renders, and a click inside the app calls the server again and re-renders another page.

Not covered: rendering inside claude.ai specifically. That needs a public URL, a connector, and a
person to add it — everything up to that point is verified.

Four things it changed:

- **`mcp/` needs no transport change.** It is already `McpServer` + `StreamableHTTPServerTransport`,
  stateless per request, which is exactly what MCP Apps wants.
- **Auth: resolved, see below.** The static bearer we already have is supported by Claude, through
  a dialog section the earlier draft did not know about.
- **CORS becomes a decision.** A host that connects browser-side preflights; `CATALOG_ORIGINS`
  currently allows nothing, deliberately.
- **The UI must be one self-contained file.** The iframe CSP is deny-by-default. `vite-plugin-singlefile`
  produced 235 KB for the POC's app, so this costs nothing in practice.

## Auth: a shared org key, which is what we already have

The requirement is narrow — only our own people, holding a key we issue, because this drives an
internal tool and a stranger stumbling in is the thing to prevent. Claude supports exactly that
shape, and `mcp/src/http.ts`'s existing `CATALOG_TOKEN` bearer needs no redesign.

**`static_headers`.** The Add-custom-connector dialog has a **Request headers** section: an
organization administrator enters a fixed credential once, Claude stores it write-only and sends it
on every request. Set Authentication to **None** and put the key in a header — `authorization` and
`x-api-key` are pre-approved names, so no review is needed. The value is sent **verbatim, with no
scheme added**, so the entry must read `Bearer <token>`, space included, to match what our
`tokenOk()` already compares against.

The credential is shared by the organization rather than per user, which is precisely the intended
model here: everyone doing this work is on our team, and the key marks the tool as ours rather than
identifying an individual.

Two operational facts that matter more than they look:

- **It is beta, limited to some organizations.** If the Request headers section is not in the dialog,
  we do not have it, and the fallback below applies. This is the first thing to check — the whole
  plan for Path B hinges on it and it costs one minute to confirm.
- **Auth settings cannot be edited after a connector is added.** Rotating the key means removing the
  connector and re-adding it, and every member reconnecting. So rotation is a scheduled team action,
  not a quiet ops change, and the key should be treated accordingly.

**Fallback if the beta is unavailable: OAuth.** Claude supports `oauth_cimd` (it identifies itself
with an Anthropic-hosted Client ID Metadata Document — nothing to register) and `oauth_dcr`. Either
way we must serve OAuth 2.0 Protected Resource Metadata (RFC 9728) and return
`401` + `WWW-Authenticate: Bearer resource_metadata="…"`, pointing at an authorization server that
does S256 PKCE. Standing that up ourselves is disproportionate for an internal tool; front the
server with an existing identity provider instead and let it issue the tokens. This is real work,
which is why the beta check comes first.

**Not an option: a token in the URL.** Anthropic's docs call it a security vulnerability and the MCP
authorization spec prohibits access tokens in the query string — URLs land in logs, proxies and
history. The earlier draft floated an unguessable URL; withdrawn.

**Defence in depth, whichever path.** Anthropic's egress is `160.79.104.0/21`, so the server can
refuse everything else. That is not identity — every Claude user's traffic comes from that range —
but it removes the entire internet as an attack surface and leaves the key doing the work it is
good at. Keep the existing per-address rate limit.

**Claude Code needs none of this.** It supports `headers.Authorization` in its MCP config directly,
so Path A works against our current token today. This whole section is about claude.ai web.

## Scope

**In:** `bundle_validate` and the `site_preview` MCP App on the existing catalog server; the upload
page; skill changes for Path B (image paths, hard-fail on MCP down); removing the offline-catalog
fallback from both paths; an always-on public deploy with the auth question answered.

**Out:** removing or changing Path A; any change to the block catalog, the theme contract, or the
derivation pipeline; the later "Wordpress-like" content editor for months-later edits.

## Open questions deferred deliberately

**Auth**, above — it is now the gating decision for Path B rather than a detail, because a custom
connector cannot be added without answering it.

**Upload from inside the preview.** The app could POST the finished bundle straight to the platform,
which would collapse the upload page into the preview. Images are what stops it being free: binary
does not belong in a JSON-RPC tool call, so a direct upload needs `_meta.ui.csp.connectDomains` plus
a real CORS origin. Keep it out of v1; the upload page stays separate until images are solved.
