# Chat path: drafts, patches, and real pictures in the preview

Referenced from `SKILL.md`'s "Two ways to run this" section. Applies only to the chat/connector
path — the local path has a filesystem and none of this exists.

## Hold a draft, patch it — don't resend the whole bundle

Every tool that takes `site`/`theme` inline re-sends the whole bundle — tens of KB, every single
edit — which is most of why editing feels slow once a draft is real. There's a cheaper path:

1. `bundle_put(site, theme, org)` **once**, the first time a draft is real JSON (in practice, right
   after stage 5's first pages) → get back a `draftId`. Held server-side for 2h of inactivity; if a
   later call says the id is unknown, the hold expired — `bundle_put` again.
2. Every edit after that is `bundle_patch(draftId, ops)` — RFC-6902-style ops, JSON Pointer paths:
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

## Uploading pictures early — the preview shows the real file, live

`bundle_publish` does two things: it stores the JSON on the hosting side (as a **draft**, not a
live site — see "What publishing here does and does not do" below), and it returns a browser link
where pictures get uploaded. Historically the advice was to call this once, at stage 9, after
everything else was done. That is no longer the only good time to call it.

**Once a draftId has been published at least once, `site_preview(draftId)` automatically points
every `<img>` at the real uploaded file instead of the site's own unresolvable `/img/<client>/...`
path.** Concretely: `bundle_publish` records which hosting draft a `draftId` last went to;
`site_preview` reads that back and, for every image the site actually references, substitutes the
real `/api/bundle/<code>/assets?name=...` URL in the rendered HTML before showing it. So the moment
the human drops a file into the browser upload page, the *next* `site_preview` call in the
conversation shows that real picture — not a blob, not a broken image, the actual file, at the
actual crop.

Practically, this means: **as soon as you have a domain and a draftId with real pages, call
`bundle_publish` and hand the human the link — tell them "upload now, it'll show up in the preview
live."** They don't have to wait for the whole site to be finished, and you don't have to re-explain
the upload step later. Re-publishing (calling `bundle_publish` again after more edits) is safe and
expected — it keeps the same code and keeps whatever was already uploaded (see the `site-hosting`
side note below); it does not go live on its own.

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

The upload endpoint accepts only WebP, JPEG, PNG or AVIF. This is deliberate, not a gap: an SVG can
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
