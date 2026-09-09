# Generating a site from a chat GUI, with nothing installed

**Status:** design approved 2026-09-09, not yet implemented.

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

## Scope

**In:** `bundle_validate` and `preview_bundle` MCP tools; the upload page; skill changes for Path B
(image paths, artifact preview, hard-fail on MCP down); removing the offline-catalog fallback from
both paths; an always-on MCP deploy.

**Out:** removing or changing Path A; any change to the block catalog, the theme contract, or the
derivation pipeline; the later "Wordpress-like" content editor for months-later edits.

## Open question deferred deliberately

Auth on the upload page and on the write side generally. Stage 1 needs no new auth — the MCP is
already bearer-token'd and stays read-only. The upload page is the first thing that accepts data from
outside, and it should be designed with that question answered, not before.
