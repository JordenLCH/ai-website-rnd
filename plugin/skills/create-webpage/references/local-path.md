# Local path — running this skill in a checkout

`SKILL.md` is written for the chat path, because that is where most sites get made: a conversation,
the catalog connector, no filesystem. This file is everything that only exists when you have a
checkout of the starter and can run commands. If you cannot run `npm`, none of it applies and
nothing here is a capability you are missing — `SKILL.md` names the chat-path equivalent at each
point.

## Commands

```bash
npm run validate -- <client>     # same validator the build farm imports
npm run dev                      # the real renderer, port 5183
npm run screens                  # scratch screens for pre-JSON choices, port 5190
./package.sh <client>            # zips the source bundle for upload
```

## Where files go

```
content/<client>/site.json      the pages
content/<client>/theme.json     the tokens and slug mappings
content/<client>/org.json       the organisation facts
assets/<client>/<file>.webp     every image for that client
```

**An image at `assets/<client>/photo.webp` is referenced in JSON as `/img/<client>/photo.webp`** —
the preview serves `/img/` out of `assets/`. Keep each client's images under their own folder: the
packager zips only that folder, so a flat `assets/` ships every other client's photography inside
the bundle.

## `npm run screens` — the easel for stages 3 and 4

For choices that happen *before* real JSON exists: style tiles, sitemap skeletons, QA findings laid
out as one screen. Write one HTML file into `.preview/screens/` and the server shows the newest.
Write a **content fragment** — no `<html>`, no `<head>` — and it gets wrapped in the frame.
`.preview/` is gitignored; nothing here ships.

```
.preview/screens/art-direction.html   one file per screen, never reuse a name
```

Label options **A / B / C** plainly on the page. Images resolve from `assets/` at
`/img/<client>/<file>` — use the client's real photography when the question is whether a direction
suits it. All fourteen served font families are loaded for you, in fragments and full documents
alike: do not add your own font link.

The page is display-only on purpose — no clicking, no selection state, no event file. A second input
channel would be one more thing to build and still could not wake you between turns. **The decision
runs through `AskUserQuestion`.**

Both servers are `preview.mjs` in the starter — node builtins, no plugin, no install. A visual step
that depends on a plugin the creator has no other reason to have is a visual step that silently does
not happen.

## Stage 7 — the four checks that need a rendered page

On this path you run them yourself instead of asking the client. Two browser snippets ship inside
the installed package — IIFEs that measure the live page and return a report, not node scripts,
because they need a rendered DOM:

```
node_modules/@blackdash/renderer/tools/design-qa.js     overflow · tiny targets · collisions · contrast
node_modules/@blackdash/renderer/tools/block-audit.js   the above plus hidden-at-rest and focus rings
```

Start `npm run dev`, then evaluate the file's contents in the page — a browser tool's "evaluate
script" call, or the devtools console. Both read `.stage`, so scroll **that element**, not the
window, and reset any `zoom` on it to `1` first or the intersection maths is wrong.

**Scroll the whole page in small steps before judging anything.** Reveal animations fire on
intersection; a jump-scrolled page reports sections as hidden that a human would have seen.

Record these rows in the stage 7 table as `me`, not `client`.
