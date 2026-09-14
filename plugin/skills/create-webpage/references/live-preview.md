# Chat path: drafts, patches, and real pictures in the preview

Referenced from `SKILL.md`'s "The chat path is the default" section. Applies only to the chat/connector
path — the local path has a filesystem and none of this exists.

## Hold a draft, patch it — don't resend the whole bundle

Every tool that takes `site`/`theme` inline re-sends the whole bundle — tens of KB, every single
edit — which is most of why editing feels slow once a draft is real. There's a cheaper path:

1. `bundle_put(site, theme, org)` **once**, the first time a draft is real JSON (in practice, right
   after stage 5's home page) → get back a `draftId`. Held server-side for 2h of inactivity; if a
   later call says the id is unknown, the hold expired — `bundle_put` again.
2. Every edit after that is `bundle_patch(draftId, target, ops)` — `target` is `site`, `theme` or `org` and
   defaults to `site`, so a theme edit must say so or the ops are applied to the pages and fail on a
   path that isn't there. RFC-6902-style ops, JSON Pointer paths:
   `{op:"replace", path:"/pages/home/blocks/2/props/headline", value:"..."}`. A one-line copy fix
   costs ~100 bytes instead of resending 25 KB, and the reply is the same compact verdict
   `site_preview` gives, so you know immediately whether the edit was legal — no separate validate
   round trip needed for a single small change.
3. `site_preview(draftId)` (add `page` only to switch tabs) draws the result inline — this **is**
   the live preview, the real renderer and stylesheet, not a description of one. Call it after every
   material patch instead of narrating the change in prose.
4. `bundle_publish(draftId, domain, org)` at handoff — and see "Uploading pictures early" below,
   because calling this sooner than "at handoff" is now often the right move. Nothing needs to be
   pasted back in full at any point after the initial `bundle_put`.

Before a first draft exists — stages 2–4, nothing is real JSON yet — there is nothing to hold, so
this doesn't apply; keep composing inline as usual until stage 5.

## The photo pool — the upload page exists before the site does

`assets_open(domain, client)` mints the browser upload link from nothing but a domain and a client
slug. There is no bundle behind it yet, and that is the point: the photographs are the one thing
only the client can supply, and collecting them last meant the pages were written around filenames
nobody had seen, with the client's first view of their own site showing empty frames.

Three tools, and the order matters:

| Call | When | What it costs |
|---|---|---|
| `assets_open(domain, client)` | stage 1, the moment the domain is answered | one call; idempotent, so calling it again keeps the link and the files |
| `assets_list(domain)` | stage 2, and again whenever they say they've added more | cheap — names, pixel dimensions, sizes, plus `srcPrefix` |
| `assets_view(domain, names)` | stage 2, before writing any `alt` or `imageKind` | a thumbnail each, up to 8 a call — the only time you see the pictures |

**The stored name is the server's, not the client's.** Everything in the pool is re-encoded to
`.webp` under a sanitised name: `Showroom Front.JPG` becomes `showroom-front.webp`, two files that
would collide are suffixed `-2`, `-3`. So `src` is `srcPrefix` + the name `assets_list` gave you,
verbatim — anything tidier you invent points at a file that is not there.

**After the first `bundle_publish` the same page gains its checklist.** The pool does not go away:
publishing upserts onto it, keeps the code and keeps every file, and the page then shows the
pictures the site references, with anything left over listed underneath as spares. Late arrivals are
still accepted — a client who finds more photographs at stage 7 can still drop them in, and they land
as spares for you to place. An unplaced photograph never blocks publishing. Every row on that page —
checklist slot or spare — carries `replace` and `remove`, so a wrong or corrected picture is fixed on
the page rather than through you.

Two ceilings worth knowing before promising anything: **150 pictures or 500 MB per site**, and a
single file over 40 MB is refused. No real brief comes close, but "drop in everything you have" is
the instruction that eventually meets one.

## Resuming: `bundle_resume(domain)`

A draft is held for two hours of inactivity, and the flow now explicitly invites a client to take
their time over the photographs — so the conversation outliving the draft is the normal case, not an
edge one. `bundle_resume(domain)` reads back what hosting stored at the last `bundle_publish` and
returns a fresh `draftId` already pointed at the same upload code, so `site_preview` shows the real
photographs immediately. Patch it as usual.

What it cannot return is an edit that was never published. That is the practical reason to
`bundle_publish` at stage 5 and after each stage that changes something: publishing is also the save.

## The first publish — what it adds to a pool that already exists

`bundle_publish` does two things: it stores the JSON on the hosting side (as a **draft**, not a live
site — see "What publishing here does and does not do" below), and it upserts onto the pool
`assets_open` created, returning the same link. The link is not news to the client by then; two other
things are.

**Once a draftId has been published at least once, `site_preview(draftId)` automatically points
every `<img>` at the real uploaded file instead of the site's own unresolvable `/img/<client>/...`
path.** Concretely: `bundle_publish` records which hosting draft a `draftId` last went to;
`site_preview` reads that back and, for every image the site actually references, substitutes the
real `/api/bundle/<code>/assets?name=...` URL in the rendered HTML before showing it. So the moment
the human drops a file into the browser upload page, the *next* `site_preview` call in the
conversation shows that real picture — not a blob, not a broken image, the actual file, at the
actual crop.

**The checklist is only as current as the last publish.** That page is generated from the stored
bundle's `src` values, so images introduced after it — stage 6's proof pages, stage 7's remaining
pages — do not appear on it until you call `bundle_publish` again. Re-publish at the end of each
stage that adds one. It keeps the code, keeps the uploads, and is the difference between a human who
can upload as the site is written and one who gets a wall of twenty requests at hand-off.

Practically, this means: **publish as soon as stage 5's home page is real.** That is the call that
makes the preview show photographs the client uploaded days earlier — until it, every `<img>` is
blank however full the pool is, because nothing has told `site_preview` which hosting draft this
`draftId` belongs to. Re-publishing after more edits is safe and expected: same code, same uploads,
no deploy.

**What publishing here does and does not do.** `bundle_publish` always creates or updates a
*draft* on the hosting side — it never triggers a real deploy. Only an explicit, separate,
human-triggered publish step on `site-hosting`'s side takes a site live, and that step is gated on
every expected picture being present. So calling `bundle_publish` early, more than once, or before
the site is finished, is safe: worst case is an upload link that expects more pictures than exist
yet, which is exactly the state `bundle_status` reports.

**Before that first `bundle_publish`, or for any image nothing has been uploaded for yet**, the
preview app still offers the local fallback: a broken `<img>` becomes a drop target, and dropping a
file shows it via a `blob:` URL — instant, no network call, but **not saved anywhere**. Say this
plainly: nothing goes to the server, nothing goes in the bundle, and closing the tab loses it — the
real image still needs the browser upload step. Once that upload happens, the *next* preview call
shows the real file and the blob fallback is no longer needed for that image.

## Pictures must be raster — no SVG

Anything a camera, phone, drone or generator produces is decoded and re-encoded on arrival — JPEG,
PNG, WebP, AVIF, HEIC, TIFF and GIF — so nobody needs to convert anything first. The one exclusion is
SVG, and it is deliberate, not a gap: an SVG can
carry a `<script>`, and the file would be served from the site's own origin — accepting one would
let an uploaded "picture" execute in the context of the client's site. If a client's logo file is
only available as an SVG, convert it to PNG or WebP before upload (a transparent-background PNG for
a logo works everywhere the SVG would have). Say this at intake (see `references/intake.md`, item
4), not as a surprise when the upload is rejected.

## Why the pictures never go through the conversation

Base64 in a transcript is several times the file size and is re-sent on every later turn, so one
site's photography would cost more than the site. The chat carries paths and, once a draft is
published, real hosted URLs; the browser carries bytes. This is also why `site_preview` on a fresh
draft (nothing published yet) starts every `<img>` blank, logo included — the MCP App draws the
rendered HTML verbatim, with no filesystem and no asset-serving route of its own before a bundle has
somewhere real to point at.
