---
name: edit-webpage
description: Use when the ask is a change to a site that already exists — "add a careers page", "fix the hero headline", "make the CTA button bigger", "remove the testimonials section", reorder sections, swap an image, tweak one theme token, or clear one validator warning. If there is no site.json/theme.json for this client yet, use create-webpage instead.
---

# Edit a webpage

You are changing a handful of fields in an existing bundle, not regenerating a site. **The whole
point of this skill is that a small ask stays small** — one JSON Pointer patch, one preview call,
done. If you find yourself about to rewrite a whole page or a whole `theme.json`, stop: that is
`create-webpage`'s "remaining pages" or "re-theming" work, not this.

## The loop

1. **Get the bundle held as a draft**, if it isn't already:
   - Already have a `draftId` from earlier in this conversation? Reuse it — don't `bundle_put` again.
   - Local path: read `content/<client>/site.json` + `theme.json` (+ `org.json`), `bundle_put` them.
   - Chat path with no draft yet: ask for the domain/client name, then either the person pastes the
     bundle or you resume it from wherever it's held (there is no "fetch by domain" tool — the
     bundle lives in the conversation or the filesystem, never fetched fresh from hosting).
2. **Write the ops.** One `bundle_patch(draftId, target, ops)` call, `ops` as RFC-6902-style
   `{op, path, value}` — see "Common edits" below for the exact shapes. Batch every op for one
   logical change into a single `bundle_patch` call; don't make five calls to add one page.
3. **Read the verdict `bundle_patch` returns** — it's already run the validator. `ok:false` means
   the patch was rejected outright (bad path) or the result doesn't validate; fix the ops, don't
   retry blindly.
4. **`site_preview(draftId, page)`** to see it drawn — same MCP App as create-webpage, real
   renderer. Say which page you're showing if it isn't obvious.
5. Nothing to hand off unless the person asks to publish — then it's the same `bundle_publish`
   create-webpage ends with. An edit session can just... end, once the preview looks right.

If any step here is unfamiliar, `create-webpage/references/live-preview.md` has the full
draft/patch/preview mechanics and the reasoning for why patching beats resending — **that path
exists only when the whole `website-create` plugin is installed.** Uploaded as a standalone
`.skill`, this skill has no sibling directory and the file will not be there; the mechanics below
are enough to work from, so carry on rather than stopping, and say the reference was unavailable. That same file
covers uploading a picture: once the site has been `bundle_publish`ed at least once, dropping a new
file at the upload link and then calling `site_preview` shows it for real — no separate step needed
here beyond telling the human to upload and re-checking the preview.

## Common edits

**Change a prop** (copy, an image path, a button label):
```json
{"op": "replace", "path": "/pages/home/blocks/2/props/title", "value": "New headline"}
```
Find the block index by asking for the page's block list first if you don't already know it —
guessing an index and hitting the wrong block is worse than one extra read.

**Add a page.** `site.pages` is an object keyed by slug, not an array — `add` a whole page object
at that key, then wire it into the nav (and footer, if the footer repeats nav links) in the *same*
`bundle_patch` call so the bundle is never left with an orphaned page nothing links to:
```json
[
  {"op": "add", "path": "/pages/careers", "value": {"title": "Careers", "blocks": [/* at least a Hero */]}},
  {"op": "add", "path": "/chrome/header/props/items/-", "value": {"label": "Careers", "page": "careers"}}
]
```
The new page needs real content, not a stub — if you don't have copy for it yet, say so and ask
before adding a page that will validate but read as empty. A bare `Hero` with no body sections
trips the same density warnings `create-webpage` stage 7 checks for; run `bundle_validate` (or read
the patch verdict) after adding one.

**Remove a page.** Remove the page itself and its nav entry — leaving the nav link means a 404 on
click, which no validator catches (it isn't a build-time link checker):
```json
[
  {"op": "remove", "path": "/pages/careers"},
  {"op": "remove", "path": "/chrome/header/props/items/4"}
]
```
Index-based removal on an array is position-sensitive — read the current `items` array first if
more than one thing might have changed since you last saw it.

**Reorder sections on a page.** RFC 6902's `move` is deliberately not supported. Do it as
`remove` then `add` at the new index, in that order within one ops array, since ops apply in
sequence and indices shift after a `remove`:
```json
[
  {"op": "remove", "path": "/pages/home/blocks/3"},
  {"op": "add", "path": "/pages/home/blocks/1", "value": {"...": "the block you just removed"}}
]
```
You need the block's full JSON to re-add it — read it before removing, or the `remove` loses it.

**Remove a section.** `{"op": "remove", "path": "/pages/home/blocks/3"}`. Check first whether
removing it drops the page below the density floor (`bundle_validate` warns; it won't block you).

**Add a section.** `add` at a specific index, or `-` to append:
```json
{"op": "add", "path": "/pages/home/blocks/-", "value": {"type": "FAQ", "variant": "faq/default", "props": {"...": "..."}}}
```
Pick the block type and variant the way `create-webpage` stage 4 would — a role first, then the
block that serves it. Call `catalog_get` for its prop shape; shapes differ between blocks that look
alike.

**A theme token or slug tweak** (one colour, one radius, add a `sectionStyles` entry): same
`bundle_patch`, `target: "theme"`. This is the one edit that's allowed to touch every page's look
at once — that's what the token indirection is for. If the ask is "make it look completely
different," that's `create-webpage`'s re-theming path (a new `theme.json`), not a patch.

## Where the edges are

- **Patch straight through.** The person already told you what to change, so the checkpoint
  ceremony `create-webpage` runs does not apply. Ask when the request is genuinely ambiguous (which
  of three CTAs, which page) or when it touches an org fact — a registration number or legal name is
  the human's to state.
- **An edit that changes the architecture belongs to `create-webpage`.** "Actually split this into
  two pages", "the whole tone should shift" — say so and hand off to the stage that owns it, which
  is cheaper than improvising a smaller version of stage 4 or stage 3 here.
- **Mark what you add the way a first draft would.** A stat or testimonial introduced by an edit
  carries `unverified` exactly as it would at stage 5.
- **Publishing stays an explicit act.** Patching a held draft touches nothing live; `bundle_publish`
  is the only thing that does.

**Check anything that touched the theme.** A one-token patch reaches every page: darkening a colour
can push text on the inverse band under 4.5:1, and adding a section can use a slug the theme never
defined, which renders unstyled while validating cleanly. Neither is visible in a preview of the
page you happened to look at. **REQUIRED SUB-SKILL:** `check-webpage`, whenever the patch touched
`theme` or added a block.

A copy-only patch — a headline, a phone number, a button label — needs no such pass.

**Done when** the patch verdict comes back `ok:true`, the preview shows the change you intended, any
theme-touching patch has been through `check-webpage`, and you have said which page you changed.

## When you don't have a draft to patch

If nothing is held server-side (fresh conversation, no prior `bundle_put`) and you're on the chat
path with no filesystem, the bundle has to come from somewhere: the person pastes it, or points you
at a domain you can `bundle_publish`-replace later but cannot currently fetch back down — there is
no "pull the live bundle" tool. Say that plainly rather than fabricating a bundle to edit.
