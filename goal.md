Goal
- Make sites maintenance easier when new things come out, especially now AI things grow fast
- Save time for POC to design the website & lower the barrier to entry for AEO/GEO/SEO optimised UI/UX design
- Reduce AI token usage from our own site & make sure our server is slim, no need those bloat UI / framework for UI/UX generation portal. our tools will also iterate faster if no need to develop advanced admin UI eg: feedback system, - drag and drop etc

 
## Requirement
- Site generated must be unique / not too template, don't too "AI Slop"
- Got some variation which the ppl who "design" the website can edit or change if needed, so that human still can decide what they want & it even work if ppl don't really know what they want or what works for them
- They will generate the site using their own AI credit & AI tools, probably connect using skill, MCP or other tools
- Final output will be either JSON, markdown, HTML, or zip, which then can be uploaded and hosted in our platform
- As the generated things are optimised & according to our stacks, we can make sure things are updatable
- We will run cronjob periodically / manually rebuild / trigger to refresh content & patch when got new SEO, AEO, GEO or other new things for web
- Used by our team or ppl related to our team, not someone on internet so some step which too complicated to automate still can use manual step eg: when need to verify the fact of text content / replace the image to use
- **No install required.** Some of the people doing this don't have a dev machine, or a computer at all beyond a browser. A flow that starts with "clone the repo and install node" excludes them, so it cannot be the only flow.


## The shape, in one paragraph

**The skill is the prompt and the judgement. The MCP is everything that changes.** A creator opens
a chat, the skill walks them through it, and every fact that could go stale — the block catalog,
the prop schemas, the token contract, the fleet, and the verdict on whether a bundle is valid —
comes from our server at the moment it is asked for. Nothing is installed. What comes out is the
same bundle a developer would have produced locally, and the platform can rebuild it forever.

Two things follow, and both are settled rather than assumed:

- **Validation moved off the creator's machine.** It is reached over MCP now, not run by node. But
  it is the *same module* the build farm imports — `renderer/src/validate-bundle.ts`. MCP is a
  transport, never a second validator. Two validators means "valid in chat, rejected on publish".
- **The preview moved into the conversation.** Our server serves the real catalog as an
  [MCP App](https://modelcontextprotocol.io/extensions/apps/overview), so the page is rendered by
  the same React components the build farm uses, inside the chat, with no local server.
  Proven end to end — see `poc/mcp-app/`.


## Where this runs

| Surface | Skills | MCP | Verdict |
|---|---|---|---|
| **Claude chat (claude.ai)** | yes | yes, custom connector | **the generation host** |
| **Claude Code** | yes | yes | same flow, for whoever has a machine |
| **Claude Design** | *not documented* | *not documented* | **not a host** — see below |

**Claude Design cannot run this flow.** Its announcement and help centre document uploads, a
canvas, and exports (`.zip`, PDF, PPTX, standalone HTML, a Claude Code handoff bundle) and mention
neither Skills nor MCP connectors. Anthropic says integrations are "coming weeks" work.

That does not make it useless — it makes it an **input and asset stage**: organise the client's
photographs, work up visual direction, then export the archive and carry it into the chat where
generation happens. If it later supports skills and connectors, it becomes a host too and nothing
about the bundle changes.

Worth testing other GUIs the same way, for whichever produces the most predictable output. The bar
is exactly two questions: does it load a skill, and does it connect an MCP server. Everything else
is preference.


## The flow

**Stage 1 — generate, in a chat**

1. Person uploads the brief (pdf / doc) **and the real images**, and types what a document never
   states: phone, address, social URLs, registration number, founding date. That is `org.json`, and
   it is the highest-value thing the whole pipeline produces
1. Person picks the brand colour
1. Agent calls `catalog_list`. **Down means stop** — never generate against a stale catalog
1. Agent proposes theme + art direction, and renders a skeleton preview **in the conversation** so
   the person judges it by looking rather than by reading a description
1. Agent proposes the sitemap; `fleet_siblings` checks divergence against sites we already built
1. Person decides / revises
1. First 3 pages → `bundle_validate` → preview
1. Person decides / revises
1. Remaining pages → `bundle_validate` → preview
1. Person exports: the JSON bundle plus the asset archive

**Stage 2 — upload**

Drag the archive onto a hosted page. It re-runs the same validator server-side (stage 1 ran on a
machine we do not control), resolves every image path, and reports **missing** and **unused** files
— the second is what catches the wrong photograph being wired up. Errors print as one
copy-pasteable block, worded to paste straight back into the chat: the person's debugger is the AI
that wrote the bundle.

**Stage 3 — server side**

1. Derive AEO / GEO / SEO from the content tree (`org.json` → entity, blocks → structured data)
1. Build and deploy — **Cloudflare Pages**, direct upload per site, custom domain via the Pages API
1. Cronjob to refresh content and to patch the fleet when the catalog or the SEO rules change


## Images

The person uploads photographs into the chat, so the agent has *seen* them — `alt` and `imageKind`
are grounded in the actual picture rather than guessed from a filename. The bundle stores the real
relative path into the archive (`uploads/OPTIMISED/LOGO/FIRST/logo.svg`), so no mapping layer is
needed at upload.

The in-chat preview has no filesystem, so photographs come up blank there. **Layout and tone are
truthful; photography is not.** The real images first appear after upload — and the checks that
need to open the files (see below) run on the platform, not in the chat.


## Keeping strangers out

Settled, with the answer being the key we already had:

- Claude's Add-custom-connector dialog has a **Request headers** section: set Authentication to
  **None**, enter the key on `authorization` as `Bearer <token>` (sent verbatim — the scheme must
  be typed). Our existing `CATALOG_TOKEN` works unchanged, shared across our org. It is **beta and
  limited to some organizations**, so confirming the dialog has it is the first thing to check
- If it is missing, the fallback is OAuth (`oauth_cimd` — Claude identifies itself with an
  Anthropic-hosted metadata document, nothing to register). Real work; front it with an existing
  identity provider rather than writing an authorization server
- **Choosing OAuth means Claude owns the `Authorization` header** and refuses to let a request
  header claim it — a shared key then has to answer on `x-api-key` or `x-auth-token`
- Lock the server to Anthropic's egress range `160.79.104.0/21`. That is not identity — all Claude
  traffic comes from there — but it removes the open internet
- **Never put the token in a URL.** Anthropic's docs call it a vulnerability and the MCP spec
  prohibits it: URLs land in logs, proxies and history
- Connector auth cannot be edited after adding. Rotating the key is remove-and-re-add, and everyone
  reconnects — a scheduled team action, not a quiet ops change

**Discoverability is deliberately zero.** Listing in Anthropic's connector directory needs their
review and is for public servers; this one is internal. People get the URL and the key from us.


## Not "AI slop": what is actually checked

Judgement made checkable, because taste does not survive being a guideline. Per page: density,
shape repetition, evidence before the ask, one loud heading. Across the pages of one site: a
repeated opening band, a repeated tone rhythm, one photograph carrying three pages. Across the
fleet: layout-map divergence, so a new site does not resolve its slugs the way an existing one does.

Ported from the earlier round of this work (`site-hosting`), which found these by measuring rather
than guessing — all four are in now:

- **the picture-crop check** reads the image header and compares the photograph's real shape to the
  frame it was put in, refusing anything cropped past about half of itself. It runs in the build
  farm, not in the validator, because it is the only check that opens a file — and the in-chat
  preview has no filesystem. Two real defects found in `merryfair-free`
- **theme integrity** runs on the rendered markup, because a colour hardcoded in a component is
  invisible to every check that reads the JSON — `site.json` carries no colours at all

And the honest part, which no check replaces: **the layers catch structure and monotony, never
proportion and never truth.** A bundle that passes everything is a bundle worth looking at, not a
finished site. Facts still need a human.


## Open decision: facts as data, not as copy

The earlier round stored facts by reference — `"Call [phone]"`, `{ source: "products" }` — and
failed the build when a token or column did not exist. This repo bakes them into `site.json` as
copy.

It matters here because of the refresh cronjob. With facts as copy, "keep the content fresh" means
regenerating and re-reviewing a page **per fact, forever**, and the same fact drifts between two
pages of one site. With references, a refresh is a data update the build picks up, and a renamed
field breaks the build instead of quietly emptying a column.

**This changes what the bundle contains and what the cronjob is**, so decide it before the upload
page and the platform are built around today's shape.


## What is done, and what is left

Done and proven: the MCP App preview rendering the real catalog inside claude.ai from a custom
connector with a shared key (`poc/mcp-app/`, `npm run prove`); the auth answer; the between-pages
variation checks in the validator.

Also done: all four checks ported from the earlier round, and Cloudflare Pages deploy
(`npm run build -- <bundle> <out> --deploy=<domain>` — opt-in, skips without credentials).

Left:

- `bundle_validate` and `site_preview` on the real catalog server (`mcp/`) — the transport already
  suits both, no rewrite
- the preview UI built against the catalog, calling the platform's renderer rather than copying it
- the upload page
- skill changes: image paths, and hard-fail when the catalog is unreachable
- an always-on deploy, with the auth question answered
- **`org.json` is missing from every bundle in `content/`**, so `npm run build` cannot run on any of
  them as they stand. One exists in `site-starter/content/merryfair/`. The packager should be
  writing it
