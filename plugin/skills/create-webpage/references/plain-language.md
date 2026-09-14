# Talking to the client — the translation table

Referenced from `SKILL.md`, "The person deciding is not a designer". Consult it while writing
anything a human reads at a ▸: an option, a question, a QA report, the handoff.

| Instead of | Say |
|---|---|
| hero, CTA, media+text, catalogue grid, spec table | the big banner at the top · the "get in touch" bar · a picture with text beside it · your products in a grid · the specifications table |
| tone band, inverse, accent, surface | a dark section · your brand colour as a full-width background |
| type scale, 1.25, weight 800 | how big the headings are next to the body text · how heavy the lettering is |
| density, tight/loose | how much breathing room between things |
| tokens, slugs, variants, blocks, props, JSON | nothing — these are how the site is stored, not anything they choose |
| contrast 2.45:1, 44px tap targets | "the grey text on the dark band is too faint to read" · "these buttons are too small to hit on a phone" |
| `unverified`, the validator, the build farm | "these four claims need you to confirm before it can go live" |
| draftId, bundle, props' `src` | "here's your link — drop your photos in and they appear on the page" |


Two more that catch people out:

| Instead of | Say |
|---|---|
| "the bundle", "the draft", "publish" | "your site as it stands" · "putting it live" |
| "validator warning", "density floor" | "this section is too short to look finished" |
| `catalogVersion`, migration, schema | nothing — this is bookkeeping, and saying it invites a question you then have to answer |
| "SEO/AEO/GEO artifacts are generated server-side after upload, from the company record and the block types I choose" | "what helps people find you is being the same, checkable company everywhere someone looks — so send me your registration details and your links" |

**Never explain the machinery, even when it is true and interesting.** Where something is generated,
what reads it, which file it lands in, what you chose in order to make it work — none of it changes
what the client does next, and all of it invites a question you then have to answer. Say what they
get and what you need from them. The test for a question is whether they could answer it from knowing
their own business; the test for a statement is whether they could act on it.

The test: could they answer from knowing their own business? If answering needs them to know how the
site is stored, the sentence is wrong.

## The scripts

Use these rather than an improvised version. They carry facts clients are surprised by, so the
wording belongs in what they read. Adapt the details, keep the substance.

**Send a script with nothing in front of it.** No "Stage 1 of 10", no "here's what happens next", no
tool or artefact name. The stage numbering is how you and the operator track the run; to the person
reading it, it says they are an item being processed. Every word in a script has to be one they could
have heard from a person who does this for a living.

### Stage 1 — asking for their profiles elsewhere

The highest-value thing on the gap list, and the one that sounds least important, so it needs saying
in terms of what it buys them:

> One more, and it's the most valuable item left: links to you anywhere else online — LinkedIn, your
> Google Business listing, an industry directory, a trade association, anywhere you're listed.
>
> Being findable has less to do with the words on your site than with being the same, checkable
> company everywhere someone looks. Your registration details, your address and those profiles are
> what do that work, so they're worth more than anything I could write.

Say nothing about where the markup is produced or what reads it. They cannot act on it, and it turns
an easy request into a conversation about infrastructure.

### Stage 1 — handing over the photo page

> **Your photo page:** <link>
> Drop in every photograph you have: logo, products, the team, the premises, anything from an old
> site. Names don't matter, and spares are useful. I'll fit them to the pages as I write them.
> Come back to the same link whenever you find more, right up until the site goes live.

**Three answers to have ready.** Each comes up and none is in the mechanism:

- **Nothing has arrived by stage 2.** Ask once, and say what it costs: *"No photos yet. Nothing's
  blocked, but two things need them: the logo decides the colours I propose next, and any page
  without a picture has to be written to work without one. Even phone snaps of the premises help."*
  Then carry on; do not stall stages 3–5 for uploads.
- **"Can you take the photos off my old website?"** Not automatically, and not without asking whose
  they are. If the client owns them, they download and drop them in like any other file. If a
  photographer or a previous agency shot them, the licence may not have come with the site. That is
  a question for the client, not an assumption to make.
- **"What happens to my photos if we don't go ahead?"** They are deleted with the draft, and nothing
  else keeps a copy. Say so rather than letting them assume either an archive or an exposure.

### Stage 9 — asking for the pictures that are still missing

> **Same photo page as before:** <upload link>
>
> Everything you've already sent is still there. Nothing to re-send, nothing to rename. These are
> the pictures the site still doesn't have anywhere:
>
> [the list]
>
> - **Just drop them in.** Any filename is fine; I'll put each one where it belongs. **Don't convert
>   or resize anything.** Straight off your phone, in whatever format they are.
> - **Something wrong?** Every picture on the page has *replace* and *remove* beside it. Replace
>   swaps the file and keeps its place on the site.
> - You can close the page and come back. It remembers what's already in.
> - Nothing is public while you do this.
>
> When the last photo is in, a **"Publish the site"** button on that page comes alive. Pressing it
> is what puts the site live. It does not happen on its own.
>
> Worth knowing now: **once you publish, that page stops accepting photos.** If you want to swap one
> later, come back to me and I'll reopen it. The link isn't broken, it's finished.

Why those lines are there: hosting decodes JPEG, PNG, WebP, AVIF, HEIC, TIFF and GIF, so converting
first is work the server already does. Filenames are not the client's problem: anything that matches
no slot is stored as a spare under a derived name, and wiring it to the right section is your job
(read the new name from `assets_list`, look at it with `assets_view`, patch the slot's `src`). After
publishing, uploads answer "this site is published; re-publish from the conversation to change it",
and a client who was not told that concludes the link is broken.

**Limits, if they come up:** 40 MB a file, 2400px on the longest edge (everything is resized on
arrival), 150 pictures or 500 MB per site, and no SVG, so a logo needs PNG or WebP. Photo metadata is
dropped on re-encode, which matters to anyone who assumes their copyright EXIF travels with the file.
If they mention having hundreds of photographs, say the ceiling before they meet it: *"Send the best
of them rather than all of them. The page holds 150 pictures, and a site this size uses maybe
twenty."*

### Stage 10 — the address

When the publish response says `deploying` is true:

> Your site is live: **john-com-my.pages.dev**. That address works right now, you can send it to
> anyone. It's on your photo page too.

When `deploying` is false, the build succeeded but no address exists:

> Your site is finished and everything is in place. It isn't on a public address yet: that's a step on
> our side, and the team will sort it and send you the link.

Either way, for their own domain:

> Want it on **john.com.my** instead? Talk to the Blackdash team and we'll take you through the next
> step. Same site, same pages, with your own name in front.

Never give a DNS instruction, and never promise there is nothing for them to do: connecting a domain
needs access we may not have, so it is a conversation the team has. Do not describe the custom address
as broken or pending.
