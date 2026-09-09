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


## Two creator paths, one catalog

Both paths produce the exact same bundle (`site.json`, `theme.json`, `org.json`) and are checked by
the exact same validator. Neither is a copy of the other — that is what stops "valid here, fails on
publish".

| | Path A — site-starter (existing) | Path B — chat GUI (new) |
|---|---|---|
| Who | has node + an IDE agent (VS Code, Cursor, Antigravity) | has a browser, nothing else |
| Catalog | MCP | MCP |
| Preview | local `npm run dev` | in-chat HTML artifact, real catalog served by MCP |
| Validate | `npm run validate` | `bundle_validate` over MCP |
| Deliver | `compress.sh` → zip → upload page | drop the project folder on the upload page |

**The catalog MCP is a hard dependency on both paths.** If it is down, generation stops and says so.
There is no offline catalog fallback: a stale catalog produces a bundle that looks valid in chat and
is rejected at upload, which is the failure this whole pipeline exists to prevent.


## Steps for users — Path A (site-starter, needs node)

1. Clone our boilerplate repo, we set the skill, claude.md / agent.md or whatever relevant so that we can set some limitation & user don't need to manually configure everything, the repo can then open using tools like visual studio code, cursor, antigravity etc
1. The person add relevant info to text / markdown, add some images to be included, run it, preview it
1. Manually edit some part / give verbal feedback if things off eg: section 3 of contact page not nice, need tweak, hero image should use a new one created by the graphics designer or from their own existing image gallery
1. After all done, run a script to package the output then it will be processed in our platform (ADD AEO GEO SEO things), then push to cloudflare pages or something similar
1. If further edit is required few months later, maybe some product discontinued / spec change, we can edit the source manually or have basic editor like Wordpress page where ppl can manually update the content


## Steps for users — Path B (chat GUI, no install)

Runs in any chat GUI that supports skills + MCP (Claude Design is the reference host, because its
project folder already keeps uploaded images organised under `uploads/`).

1. Person uploads the brief (pdf / doc) **and the real images** into the chat project, and types the
   things a document never states — phone, address, social URLs, registration number
1. Person picks the brand colour
1. Agent calls `catalog_list`. **Down → stop and say so.** No generation on a stale catalog
1. Agent proposes theme + art direction, and renders a skeleton preview as an in-chat artifact so the
   person judges it by looking, not by reading a description
1. Agent proposes the sitemap; `fleet_siblings` checks divergence against sites we already built
1. Person decides / revises
1. Agent generates the first 3 pages → `bundle_validate` → preview artifact
1. Person decides / revises
1. Agent generates the remaining pages → `bundle_validate` → preview artifact
1. Agent writes `site.json`, `theme.json`, `org.json` into the project folder, beside `uploads/`

Image props carry the **real relative path** into that folder
(`uploads/OPTIMISED/LOGO/FIRST/logo.svg`) — the agent has seen the photo, so `alt` and `imageKind`
are grounded rather than guessed. The preview artifact cannot load local files, so it draws a
labelled placeholder showing the path and kind: layout is truthful, photography is not. Real images
first appear after upload.


## Upload — where both paths meet

A hosted drag-drop page. Zip from Path A, folder from Path B, same bundle either way.

1. Re-runs the same validator server-side. Stage 1 ran on a machine we do not control, so this gate
   is not optional
1. Rejects any bundle stamped with an unknown catalog version, or one the current catalog cannot migrate
1. Resolves every image path against `uploads/` and reports **missing** (referenced, no file) and
   **unused** (file present, nothing references it — this is what catches the wrong photo being picked)
1. Prints errors as one copy-pasteable block, worded to paste straight back into the chat


## Server side

1. Derive AEO / GEO / SEO from the content tree (`org.json` → entity, blocks → structured data)
1. Build and deploy
1. (Automated) run cronjob to repeat the generation periodically to make the content fresh, and to
   patch the fleet when the catalog or the SEO rules change


## What this needs before it can ship

- **Two new MCP tools**: `bundle_validate` (runs the real `validate-bundle.ts`) and `preview_bundle`
  (the real block catalog compiled to one self-contained file, fetched once per session and reused —
  so re-rendering after an edit costs only the JSON)
- **The upload page**
- **An always-on catalog MCP.** Today it is `mcp/tunnel.sh` on a laptop. Once the MCP is a hard
  dependency, a 502 means nobody in the company can generate anything. This is a blocking
  prerequisite, not a nice-to-have
