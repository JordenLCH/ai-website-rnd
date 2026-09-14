---
name: create-webpage
description: Use when someone wants a website, landing page, or set of marketing pages built, generated, scaffolded, redesigned or re-themed for a company or client; when they share a client brief, company documents or brand colours and ask for a site; or when they ask to change a site's whole look or art direction. Use it even if they only say "build me a site for X". For a scoped change to a site that already exists, such as one page, one section or one token, use edit-webpage instead.
---

# Create a webpage

Generate the website as **data**, not code. A site is two JSON artifacts validated against a fixed
component catalog:

- **`site.json`** — pages, and for each page an ordered list of sections: `{type, variant, props}`
- **`theme.json`** — 37 required design tokens, 45 optional ones, plus a map of variant slugs → `{layout, tone, vars?}`

A build step renders those into static HTML. Never write HTML, CSS, or components: bespoke markup
cannot inherit the platform's later schema and component fixes on rebuild.

## Why the split matters

| Layer | Who decides | Failure if you get it wrong |
|---|---|---|
| **Structure** — which blocks, what order, what copy | fixed catalog | free-form markup → unmaintainable, unpatchable |
| **Art direction** — tokens, which layout & tone each slug resolves to | generated per client | reused defaults → every site looks like the same template |

Keep the vocabulary rigid: the block catalog is fixed and you never write markup. Make the
**composition** and the **art direction** genuinely different for each client.

Two terms run through every stage. **The mode** is the likeliest thing to propose: the first art
direction, the first page ordering, the arrangement every competitor uses. **The tail** is everything
else you sampled. At stages 3 and 4, generate several candidates, identify the mode, and choose from
the tail.

## Get the catalog from the platform, not from memory

**Call `catalog_list` first, every time. If it fails, you may not compose a bundle.**

Blocks ship weekly, so anything written into this skill is a snapshot that will eventually be wrong.
A stale catalog validates locally and is rejected at upload, after the work is done. Never substitute
one from memory or from `references/catalog.md`. Read that file freely at stages 4–6 to remind
yourself what a block takes; it cannot stand in for a live call, because it carries no
`catalogVersion` build hash and without that string the bundle cannot be drift-checked.

**The stop is stage 4, not the session.** Stages 1–3 name no block and read no schema, so run them.
Stage 4 maps roles to block types, needs the `catalogVersion`, and calls `fleet_siblings`. If the
catalog is unreachable, say which stage you reached and which tool you are waiting on, so the human
knows what restarting the server unblocks.

Then call `catalog_get` for only the blocks you intend to use, to save context.

### The chat path is the default; a checkout is the exception

| | chat (default) | in a checkout |
|---|---|---|
| Photographs | `assets_open` at stage 1, then `assets_list` / `assets_view` | the files are already on disk — see `references/local-path.md` |
| Validate | `bundle_validate` | `npm run validate -- <client>` |
| Preview | `site_preview` — renders in the conversation | `npm run dev`, port 5183 |
| Publish | `bundle_publish` — returns the *same* photo link `assets_open` minted, now with a checklist | `./package.sh <client>`, upload the zip |

Both validators are the same module the build farm imports, so a bundle that passes either cannot
fail at upload for schema reasons. Publish the SOURCE bundle: built HTML cannot be re-themed or
patched.

**Hold a draft and patch it.** `bundle_put(site, theme, org)` returns a `draftId`; every edit after
that is `bundle_patch(draftId, target, ops)`, and `site_preview(draftId)` draws the result.
**`target` is `site`, `theme` or `org` and defaults to `site`**, so a token fix or a new slug needs
`target: "theme"` explicitly; without it the ops apply to the pages and fail on a path that isn't
there.

**The photographs are collected at stage 1.** `assets_open(domain, client)` mints the browser upload
page before any bundle exists, so the client uploads while you are still discussing the sitemap.
`assets_list` and `assets_view` read and show you what arrived.

**Publish at stage 5 and after every stage that adds an image.** Publishing creates a draft, never a
live deploy, and upserts onto the same pool. It is what points `site_preview` at the uploaded files
(before it, every `<img>` is blank however full the pool is) and what refreshes the upload page's
checklist. `references/live-preview.md` has the op shapes, the publish cadence and the 2h hold.

**Reference the name the file is stored under, verbatim.** On the chat path that is the name
`assets_list` reports: the pool sanitises what the client dropped and re-encodes it, so
`Showroom Front.JPG` becomes `showroom-front.webp`, and SVG is refused. In a checkout it is the path
on disk, capitalisation included. An invented filename renders blank with no error anywhere.

**You can see the photographs.** Write `alt` from the image, never from the filename, and set
`imageKind` from what is in frame: `environment` for a scene with depth, `cutout` for a product on a
plain ground, `detail` for a close crop. The validator refuses a `cutout` under `overlay-fullbleed`,
and it can only check what you declared.

## Workflow — checkpoints, not one long generation

Each stage produces something small enough to review in seconds. Stop and wait at every ▸ mark.

```
1  intake             (human)  drop the documents first, you read them, then ask what's left
                              — including the brand colour, which stage 3 is built from,
                              and the photo link, so the pictures arrive while you work
                                                                   ▸ human corrects the blocker table
2  content inventory  (you)    what copy exists and what it breaks, and what photographs
                              turned up while you worked — prep, no gate
3  theme              (you)    3 proposed, shown as style tiles
4  sitemap            (you)    pages + section roles, sampled, plus a skeleton of the home page
                                                                   ▸ human decides or revises (2+3+4)
5  home page          (you)    one page, real copy, published      ▸ human decides or revises
6  proof pages        (you)    the two densest, corrections applied ▸ human decides or revises
7  remaining pages    (you)    the rest, if any
8  design QA          (you)    breakpoints, states, contrast        ▸ human sees the list
9  assets & facts     (both)   the gaps only — stock for what the pool never had, verified numbers
10 hand off           (you)    validate, publish, hand over the upload link
```

Everything after the upload — SEO/AEO/GEO artifacts, hosting, scheduled refresh — happens on the
platform. See "After you hand off".

**Stage 1 ends at its own checkpoint** — the five-row blocker table, corrected by the human. It is
the only stage whose output is otherwise a conversation, which is what made it the one that got
skipped: the run to the stage-4 gate passes straight through it and nothing is missing from the
screen afterwards.

**Stages 2, 3 and 4 then share one checkpoint**, at the end of stage 4: show the gap list, the style
tiles and the sitemap together and ask once. Do the content inventory before the theme, and sample
the sitemap independently — a structure chosen after the look is fitted to it, and the safe structure
fits every look.

### ▸ is a hard stop, not a suggestion

**At every ▸ call `AskUserQuestion` and end your turn.** The human is the one who has to live with
the site, or answer to the customer who does.

**If your message contains the words "I picked" or "I'll go with", it should have been an
`AskUserQuestion` instead.** Recommend, don't decide.

**If you are about to propose a theme and have not seen the logo file, stop and ask for it.** A pale,
gold or thin-stroked wordmark measures under 3:1 on white and forces every direction onto a dark
header band. Three directions proposed without that reading are three that may all have to be
redrawn, and the human will have approved one of them by then.

| At a ▸ | Do |
|---|---|
| The choice has options to compare — a look, a layout, a page list, a density | Push a screen (see "Showing work visually"), then `AskUserQuestion` with the same A/B/C labels |
| The choice is a single fact — a number, a name, yes/no | `AskUserQuestion` directly, no screen needed |
| You genuinely have one option | Still ask — "proceed / change something" — the human may know a constraint you don't |

Three legitimate exceptions, and only these: the human said "don't ask, just build"; you are running
as a subagent with no human attached; or a prior answer at this same checkpoint already covers the
question. Say which one applies, once, rather than silently skipping.

**The person in the chat is also the person who uploads the photographs.** They read your messages
and they open the photo page. The page exists because a picture dropped into the conversation never
reaches the server, not because a second person is doing the uploading.

**Between ▸ marks, run straight through to the next one.** The ten stages are the checkpoints.

**But never run silently.** Stages 2–4 share one gate, so that stretch is three stages of work with
nothing to look at. **Open each stage with one line naming it and what it will produce** — "Stage 3
of 10 — three looks to choose from, coming up" — then do the work. One line, not a preamble.

**That line is bookkeeping between you and the operator. It never touches a script.** Several stages
hand over wording meant to go straight to the client — the document request, the photo page, the
address at handoff. Those are quoted blocks, and **nothing is prepended to one**: no stage number, no
count of what comes next, no tool name, no "then I'll do X". "Stage 1 of 10 — intake" sitting above
a request for someone's brochures tells them they are an item in a workflow, which is the one thing
the plain language was there to avoid. Put the stage line in its own paragraph before the block, or
leave it out of that turn.

**Emit each stage's artifact as it finishes, not batched at the gate**, so the human can start
reading each one as it exists. The question is still asked once, at the end of stage 4.

### The person deciding is not a designer

Assume the human has never built a website, does not know what a hero is, and cannot tell you whether
they want a 1.25 type scale. They know their business, their customers, and what looks right to them.
**Everything shown at a ▸ must be answerable from that alone.**

A question in catalog vocabulary gets answered anyway, wrongly, and you build on the answer.
`references/plain-language.md` is the translation table; consult it while writing anything a human
reads.

- **Every option carries a consequence in their terms, not an adjective.** "Warm editorial" tells
  them nothing; "reads like a magazine — better if people browse, worse if they're comparing
  specifications" is a choice they can make.
- **Say what you recommend, in one sentence.** Recommending is not deciding.
- **"I don't like it but I can't say why" is a complete answer.** Take it and propose a different
  direction. Keep "change something" on the table at every gate.

This governs client-facing sentences only. Your notes and everything written to disk keep the precise
vocabulary.

### Show the work, never make them imagine it

A look, a layout, a tone rhythm and a page structure are judged by eye. **Prose is the wrong medium
for stages 3, 4 and 7.**

- **`site_preview(draftId)` once a bundle exists** — the real renderer and stylesheet, so what is on
  screen is what ships. Use it from stage 5 on, after every material patch, instead of narrating the
  change.
- **The `design` skill's canvas before one exists** — stage 3's tiles, stage 4's skeletons, stage
  7's findings. It publishes as an Artifact, so it survives the session, and where canvas-editing is
  enabled the human can click an element and comment rather than describing "the second tile". A
  plain Artifact is the fallback.

**The decision still runs through `AskUserQuestion`.** Canvas comments narrow what A/B/C means; they
don't replace picking one. `AskUserQuestion`'s option previews are monospace markdown: fine for a
page list, useless for an art direction.

**Render the tokens, not a description of them.** Build each tile from the real token values, even as
hand-written HTML that never ships. A tile drawn from your idea of "warm editorial" is a different
design approved under the same name.

### 1. Intake — documents first, questions second

**Open by asking for the files, not for the fields.** The client already has a company profile, a
deck, a brochure and a logo, and those contain most of what `org.json` needs. Ask them to drag the
lot into the chat, read every one, then ask only for what is still missing.

The facts become `org.json`, the third artifact of the bundle, sent with `bundle_put` on the chat
path and written to `content/<client>/org.json` in a checkout. Never invent them: cite the source
document for each extracted value so the human can correct it in one pass.

**Only the client is a source.** A fact you remember, a fact from a previous build for this client,
and a fact from their live website are all **provisional**: name that origin in the table below and
read it back for confirmation. None of them closes a gap. Their website is what they published, not
what they have approved for this one; a registration number you recall is one you cannot cite; and
the POC you built last year was working from a brief that has since changed.

This is the failure that looks least like one. Research and memory make the gap list short, a short
gap list reads as a footnote rather than as a blocker, and nothing downstream can tell a fact the
client confirmed from a fact you found. Fill the cells from anywhere you like — then ask.

**The opener and the follow-up gap list are in `references/intake.md`**, with the `org.json` schema
and the Malaysia registration-number rule. Use them verbatim, as markdown in the chat, never inside a
code block. Cut every item the documents already answered. Client-facing text carries no schema
jargon: ask for "links to your company anywhere else online", and map it to `sameAs` yourself.

**Five blockers:** registration number, legal name, phone/email, the **domain**, and the **logo file**
(raster: WebP/JPEG/PNG/AVIF; flag now if it is only available as SVG).

A provisional domain is fine, but it keys the photo pool, so `bundle_discard` deletes the client's
uploads with it. **Read the domain back before calling `assets_open`** — "so the site is filed under
northwind-seating.example, yes?" — and derive the slug from it
(`northwind-seating.example` → `northwind-seating`). The slug
is frozen once the pool is open: it becomes the public `/img/<client>/` path, and a second
`assets_open` with a different slug is refused, naming the one already recorded.

Everything else either shapes the site (buyer, goal, scope, sections, tone) or strengthens it
(`sameAs`, certifications, named people) without blocking the build. `references/intake.md` has the
full breakdown.

**Look at the logo, don't just accept the file.** Two things decide theme decisions three stages
later. **Its contrast against white**: a gold, pale or thin-stroked wordmark can measure under 3:1,
which forces every direction you propose to put the header on a dark band. And **its actual colours**:
sample the file rather than trusting the brief, and ask if the two disagree.

**Do not ask how many directions they want to see.** Stage 3 always proposes three; stage 4 always
samples orderings and drops the mode.

**Open the photo page in this same turn.** As soon as you have the domain and the slug, call
`assets_open(domain, client)` and hand over the link. The wording, and the three standing answers for
"nothing has arrived yet", "can you take the photos off my old site" and "what happens to my photos
if we don't go ahead", are in `references/plain-language.md`.

Chase the logo first if nothing arrives: stage 3's contrast reading depends on it.

**Emit the blocker table before going on — all five rows, every cell filled:**

| Blocker | Value | Where it came from |
|---|---|---|
| Legal name | Northwind Seating Sdn Bhd | company profile p.1 |
| Registration number | 000000-X | **their website — unconfirmed** |
| Phone / email | +60 3 0000 0000 / none found | brochure p.4; no email anywhere |
| Domain | northwind-seating.example | they said so, read back |
| Logo file | **not supplied** | asked; chasing |

"They don't have one" is a filled cell. "Not supplied" is a filled cell. An empty cell is not, and
neither is one whose only origin is your own memory — that one gets the word **unconfirmed** next to
it and goes to the human as a question.

▸ **Put the table up and ask them to correct it**, before the content inventory. Stages 2, 3 and 4
each end in something visible, so skipping one of those shows. Stage 1 ends in a conversation, and an
unenforced stage that produces no artifact is the one that gets compressed when you are heading for
the first checkpoint. The table is what makes it visible, and this gate is what makes it a stage.

You will reach stage 3 with an empty logo cell otherwise, and stage 3 cannot be done without it.

**A returning client is a new build, not a continuation.** Nothing carries over on its own. Every
fact is re-confirmed at this table regardless of how sure you are, because the thing that changed
since the last build is exactly what nobody will think to mention. And a new domain is a new photo
pool — `assets_open` keys on the domain, so the previous site's uploads are not in it and the client
uploads again. Say that in the first message rather than when they ask where their pictures went.

Nothing about hosting, SEO or refresh belongs in intake. Those are derived server-side after upload.

### 2. Content inventory — count what exists before designing for it

Before any structure or any look, write down what copy you have, where it came from, and what is
missing. One table, no prose:

| Topic | Source | Words available | Verdict |
|---|---|---|---|
| What they make | brief p.2 | ~180 | enough for a section |
| Manufacturing process | brief, one line | ~15 | needs the human, or mark `unverified` |
| Testimonials | — | 0 | omit the role, or ask |

Total the "words available" column. **Under ~1,200 words of real source material you cannot fill more
than a home page and two subpages without going thin.** Say so now. The human then supplies more,
accepts fewer pages, or accepts that some sections ship `unverified`.

**Then write down what the content will break** — not the total, the extremes the layout has to
survive:

| Constraint | Example from this brief |
|---|---|
| Longest product/service name | "Constant Force Mechanism (CFM) backrest" — 39 chars, will wrap in a card title |
| Longest / shortest headline | 9 words vs 3 — one type size cannot flatter both |
| Topics with no usable photo | 3 of 7 services — those sections must work type-only, or take stock at stage 9 |
| Mandatory text | licence number and disclaimer must appear on every page |
| Uneven lists | product range is 9 items, accreditations are 2 |
| Supplied photographs that are stock | 10 images arrived, all Unsplash — none of the client, the place or the people |
| What the client may not legally say | regulated profession: no outcome claims, no testimonials |

This table is the input to `check-webpage`'s check 2 at stage 8.

**Read the photo pool before anything else in this stage.** `assets_list(domain)` reports what
arrived, under the names it is stored as. `assets_view(domain, names)` shows you up to eight at a
time (pass `max` up to 768 for a closer look at one logo). Three later decisions depend on having
looked: `alt` written from the image, `imageKind` set from what is in frame, and stage 3's direction,
which should answer the client's real photography.

Add one row per picture to the inventory: the stored name, what is in frame, and which section role
it could carry.

**An empty pool is an answer, not a wait.** Say so at the stage 4 checkpoint and keep going: propose
the direction and the sitemap on the assumption that photography will exist, and mark which roles
depend on it. The pool accepts uploads the whole way through, and pages are re-previewed as they land.

**Photographs supplied with the brief are not automatically assets.** Open every one and say what is
in the frame, not what the filename claims. `references/house-rules.md` has the three failure kinds
and the regulated-category limits, which restrict copy more than any validator does — ask whether the
category is regulated here, not at stage 5.

Carry anything still missing to stage 4's checkpoint and ask once.

**Done when** the words-available column is totalled, the extremes table has a row for every
constraint, every photograph in the pool has been looked at and described, and you have said whether
the total supports the scope asked for at intake.

### 3. Theme — the look on one sheet, not a fake page

**Open by stating the logo's contrast ratio against white**, measured from the file, not from the
brief. It is an input to this stage, not a note left behind in stage 1: under 3:1 every direction you
propose needs a dark header band, and that is a decision about all three candidates rather than a
detail of one. If the file never arrived, say so in the same breath and propose only directions that
survive either answer — then chase it before stage 5, where the header gets built.

**Propose three, each from a different objective**: Measured (processing fluency), Fit
(prototypicality for the category), Spark (novelty inside the same measured floor). Three samples of
one distribution share its mode, so the objectives are what keep the candidates apart. Resolve Fit
first, present Measured first, and give each a stated **cost** as well as a pitch.

`references/proposing-themes.md` has the protocol, the orthogonality check, the served font families,
the six elements every style tile must carry, a worked A/B/C pitch, and the typography rules. Read it
before proposing.

Fix each candidate's specification for yourself, then pitch it in the human's language, in two lines:
what it reads like, and what it costs. Keep the JSON for the winner only.

**Motion is part of the direction, so set it here.** Four tokens carry it: `--motion-duration`,
`--motion-ease`, `--motion-state`, `--motion-distance`, plus per-section reveals, with
`prefers-reduced-motion` honoured for you. Default to subtle scroll reveals, and say in the pitch what
it implies: "things fade in gently as you scroll", or "nothing moves".

**Write the pick down as three adjectives and treat them as binding.** Every later decision is tested
against them: "precise" and a 28px radius contradict each other, and the contradiction is only
visible if the word was written down. Choose adjectives a competitor could not also claim, make one
of the three slightly uncomfortable, and record what you rejected.

Put it at `theme.direction`, top level. At stage 8 it is what the token audit compares against, and
it is what the next agent reads instead of re-deriving the direction from the values.

**Done when** three candidates exist, each with a stated cost, and the winner's three adjectives are
written into `theme.direction` with what you rejected.

### 4. Sitemap — sample the architecture, then roles, still no copy

A **section role** is the job a section does — proof, range, story, spec, process — not a block type
and not a theme slug. A page is an ordered list of roles. The shorthand is for your notes:

> **Products:** hero (subpage) · catalogue grid · spec table · media+text · CTA
>
> *shown to the human as:* opening banner · every chair laid out in a grid · the full specifications
> table · one model in detail with text beside it · "request a quote" at the bottom

**Call `fleet_siblings` before writing content**, passing the theme you are leaning towards. It
reports layout-map overlap against the sites already built; above ~0.7 against a sibling, change the
layout map rather than the palette. On an empty fleet it answers `checked: false`. Say so: that is
the check not running, not a pass.

**It compares against our fleet, not the client's category.** So also list what the client's three
closest competitors all share:

> *Every ergonomic-chair site opens with a hero photo of one chair on white, then a three-up
> "Comfort / Support / Design" trio, then a product grid.*

That shared structure is the **do-not list**, and it carries through stages 4–6. It is also what you
show the human when they ask why the page doesn't look like the competitor they had in mind.

**Then sample the home-page architecture.** Write three orderings with self-assessed probabilities,
drop the mode, take from the tail. Vary, in descending order of effect: what comes first after the
hero; whether a role appears at all (five strong sections beat nine even ones, and stage 2 tells you
which five you can fill); where the dark and accent bands fall; page count and split. Fewer sections
with more content each is almost always the better tail choice.

Give each role a word budget from the stage-2 inventory. A role with no source and no budget does not
belong in the sitemap.

**Show every page, not only home-page orderings** — the human cannot add or remove a page they were
never shown.

```
B — Buyer-led · 3 pages
   Home           hero · range · proof · terms · CTA
   Chairs         hero · catalogue grid · spec · comparison
   Buying from us hero · warranty · customisation · delivery
```

**Draw each option as a skeleton beside its role list.** Grey boxes in page order, at real
proportions, painted in the recommended theme's tone bands so the light/dark/accent rhythm is
visible:

```
┌──────────────────────────────┐  full-bleed hero        default
│                              │
├──────┬──────┬──────┬─────────┤  4-up range grid        surface
├──────────────────────────────┤  proof figures          INVERSE
├───────────────┬──────────────┤  media + text           default
└──────────────────────────────┘  CTA                    accent
```

Boxes and role labels only: a human shown invented copy judges the copy. Draw section heights in
proportion to their word counts, or the skeleton misrepresents density, which is what it shows best.
Stage 3's tile answers "what does the type feel like"; the skeleton answers "where does the dark band
land". Show both.

▸ **The checkpoint for stages 2, 3 and 4 together.** One screen: the gap list, the style tiles, the
sitemaps with their skeletons. Then ask for the theme pick and the sitemap pick in one
`AskUserQuestion`.

**The options list holds the tail only.** Name the mode below it, as reasoning: visible and
unpickable. Presenting the mode as an option annotated "avoid this one" puts it back on the table.

**Record the `catalogVersion` in two places.** It is a real optional field at the top level of
`site.json`. Write it there, verbatim from `catalog_list`, **including the build hash**
(`0.5.0+1ed25a77e046c01d`, not `0.5.0`), because the short version cannot be drift-checked. Then
state it in your handoff summary.

**Done when** every option shows every page with its ordered roles *and* a skeleton, the do-not list
is stated, and the human has picked a theme and a sitemap at the ▸.

### 5. Home page — one page, then stop

Write **the home page only**, at full density, and stop. The home page exercises most of the range
the rest of the site reuses — hero, proof, capability, story, call to action — so a correction here
lands on nearly everything that follows.

Write it **at full density**: **60+ words and 6+ content nodes per section**, **700+ words per page**,
one image per two sections that can carry one. Hero, CTA, quote, nav and footer are exempt, as are
blocks that cannot hold more (`Stats`, `Locations`).

A section under 60 words is thin, and thin sections are the most common failure at this stage.
`references/density.md` has the primitives that fix it; read it before writing.

Headlines must carry a concrete noun from the brief that a competitor could not also claim. If the
headline would still be true with a rival's name in place of the client's, it is decoration, not copy.

**Write `src` from the pool, not from your imagination.** `assets_list` gives the stored name plus
`srcPrefix`; the prop is the two joined: `"src": "/img/northwind-seating/showroom-front.webp"`. An invented
name points at nothing — the upload page never asks for it, `bundle_status` never reports it missing,
and the image is permanently blank. Only pictures that do not exist yet get names you choose, and
those are stage 9's table.

**Publish before you preview, and preview before you show anyone.** In that order, every time.
`bundle_publish` upserts onto the pool the client has been filling since stage 1: same link, same
photographs. Only then does `site_preview` point `<img>` at the uploaded files; before it, the props
still name `/img/<client>/…`, which is a path nothing serves.

**A preview built too early does not fail — it renders.** The pages come out complete and every
photograph is blank, with no error in the tool result and nothing in the preview saying why. Sending
that to a human costs you the one thing stage 5 exists to get: a correction on the real page.

Tell them the link is the same one and everything they sent is still there. Do not ask them to rename
files to match the checklist; pool names are derived server-side.

▸ Take the corrections before writing anything else. This gate settles what generalises: tone of
voice, how much detail a section carries, what terminology the client uses, what claims are
off-limits.

**Done when** one page carries real copy, every section on it is either off thin or on the exempt
list — counted, not estimated — and the upload link is in their hands.

### 6. Proof pages — the two densest, with the corrections applied

Write **the two pages carrying the most structured content** — the spec table, the price comparison,
the nine-item catalogue, the form — applying every correction from stage 5. Layout defects concentrate
in dense sections. Two of them rather than one catches the defect a single page cannot show: a slug
quietly tuned to suit that page which breaks on the next one using it.

**If the sitemap has three pages or fewer, this stage finishes the site.** Say so, take the
corrections, and stage 7 has nothing to do. Four or five pages: still only these two.

Same density floor as stage 5, and the same rule on headlines.

▸ Take the corrections. This gate is narrower than stage 5's: tone is settled, so what surfaces here
is structural — a table unreadable at the density you chose, a slug that works on one page and not
the other.

**Done when** both pages carry real copy at the density floor, and every slug they introduced
resolves in `theme.json`.

### 7. Remaining pages

Apply both correction rounds to every remaining page. If stages 5 and 6 covered the whole site, say
so and move to stage 8 rather than inventing a page to fill this stage. If a correction contradicts
the approved sitemap, raise it rather than resolving it quietly.

There is no gate here: the two rounds already settled voice, density and the slug system. **If more
than about five pages remain, show the first one before writing the rest.**

When a page needs a look the theme has no slug for, **add the slug to `theme.json` and reuse it**.
When the same treatment appears twice, name it once as a shared slug.

**Two slugs per block type is the ceiling everywhere except `Hero`**, which takes one per page, so a
four-page site carries four hero slugs. The ceiling applies to body sections.

**Done when** every page in the approved sitemap exists, and every slug used resolves in
`theme.json`. A slug the theme never defined renders unstyled.

### 8. Design QA — the pass that is not "does it validate"

**REQUIRED SUB-SKILL:** use `check-webpage`. It owns the nine checks, the script that computes
contrast and theme coverage, and the report format.

Two things carry over that it cannot know: stage 2's content-extremes table is the input to its
check 2, and `theme.direction` from stage 3 is what its check 5 audits the tokens against. A theme
with no `direction` block fails check 5.

Report to the client as two lists in their language — **what you fixed**, and **what is their call**
— never as nine rows of ratios they cannot verify.

**Done when** `check-webpage` reports all nine rows with a Who and a Result, and its browser-only
questions have been put to the human.

### 9. Assets and facts — the gaps the pool never filled

This stage covers only slots the pool has nothing for. Run `assets_list` once more first, because
clients keep uploading after the conversation moves on.

**Produce the list first**, one row per empty slot. **Fill the description column**: it is the only
column the client can act on.

| What to send | Where it goes | Shape | (your slot name) |
|---|---|---|---|
| the workshop with bays in use, room at the top for the headline | top of the home page | wide | `hero-workshop.webp` |
| the backrest alone on a plain ground | products, third card | square | `cfm-backrest.webp` |
| the founder, waist-up | about page | portrait | `founder-portrait.webp` |

The last column is yours: it is the `src` you already wrote, and it is how you match an arrival to a
row. Do not ask the client to use those names. Do not tell them the names are invisible either —
after the first publish the upload page lists each slot's filename. If they ask what
`hero-workshop.webp` is, answer from that row's description.

Name each slot for what it shows; `image-1.webp` leaves you unable to tell which arrival answers
which row.

**The `src` you write must be `/img/<client>/<filename>`.** Hosting matches uploads against that
shape exactly; `"hero-workshop.jpg"` or `"images/hero.jpg"` is silently dropped and renders blank with
no error. For a picture already in the pool, copy the filename verbatim from `assets_list`.

**For these pictures `alt` is written twice and the validator checks neither.** Nobody has taken
them yet, so write the alt the list specifies ("the cold store, down an aisle, racking either side")
and correct it against the real image once it is uploaded. Likewise `imageKind`: `overlay-fullbleed`
puts text on the picture and the validator refuses a `cutout` under it, so the layout you picked at
stage 5 decides the kind, and the request must specify a photo that suits it ("shot wide, with empty
sky at the top for the headline"). This is the one case where you declare a kind before seeing the
file, because you are specifying the shot.

**The script to hand over is in `references/plain-language.md`**, with the accepted formats, the
40 MB / 2400px / 150-file limits, and what to say about the page closing after publish. Use it rather
than an improvised version. If the client mentions having hundreds of photographs, say the 150-file
ceiling before they meet it.

Do not repeat the stage-1 request for their own photographs. Chase this list once; rows still empty
after that are the gap list, and only the gap list goes to stock.

**`bundle_status(domain)` is the loop's exit condition**, keyed by the domain, not the draftId. It
reports which expected files are still missing, so work it until it is empty rather than asking "did
you upload them?". Check `extras` in the same breath: a picture that arrived under a name no slot uses
is invisible to the checklist. Look at it, patch the slot's `src` to that name, and re-publish.

**Then work the `unverified` checklist**: every marked section is confirmed, corrected, or removed.
Until it is empty the build farm refuses to publish. The human verifies every number and claim.

Check every image for **third-party branding**, which no validator catches.

**Spares never block publishing.** Leave them; they are what a later page or a re-theme is composed
from. Mention them only if the pool is near its 150-file or 500 MB ceiling, where the page's *remove*
control is the answer.

**Done when** `bundle_status` reports no missing files, every remaining slot is deliberately
type-only, and the `unverified` list is empty.

#### Filling the gaps with stock

**REQUIRED SUB-SKILL:** use `sourcing-stock-photos` for anything on the gap list. It carries the
search procedure, the licence terms and the reject list.

One or two stock images placed deliberately read as considered; a full set reads as generated. A
section stage 2 marked as having no usable photo is allowed to work type-only, and often should. Say
which is which when you hand the list over, so the real shoot stays on the client's backlog.

Two things the sub-skill does not cover:

- **Where the file goes.** In a checkout, `assets/<client>/<slug>.jpg`, referenced as
  `/img/<client>/<slug>.jpg`. On the chat path there is no `assets/` folder: hand over the shortlist
  and let the client drop the files into the upload page.
- **`alt` and `imageKind` come from the pixels.** Where the download cannot happen, leave both empty
  and say why; a guessed `imageKind` defeats the one check the validator performs with it.

### 10. Hand off

**`bundle_resume(domain)` recovers a site after the conversation ends.** It fetches the stored
`site.json`, `theme.json` and `org.json` back from hosting and returns a fresh `draftId` with the
uploaded photographs still attached. It reads the **last published** bundle, which is the other reason
to publish at stage 5 and after every stage that changes anything.

Validate, preview one last time, then `bundle_publish` with the domain, the bundle, and `org.json`,
which is required because the entity graph is built from it alone.

**Paste the link. Every time, in full, even though they have had it since stage 1.** It republishes
to that same link, so name it as the same one — "same page as before, nothing you uploaded has
moved" — but a sentence telling someone to go and open a page, with no page in it, sends them to
scroll back through a conversation to find one. Saying "the upload page" is not giving a link.

**Never describe what they will see there. Read it.** "The button should be live" is a guess about
state you did not check, and it is wrong in the two cases that matter: before any bundle has been
published onto the pool the page has no button at all, only a line saying there is nothing to publish
yet; and once the site is live the button reads *Published* and does nothing. `bundle_status` reports
which of those it is. If for any reason you cannot read it, describe what you did and let them tell
you what they see, rather than narrating a page you are imagining.

**If publishing fails, say so and stop there.** Do not improvise a substitute route for the pictures
or describe the site as finished. Tell them the pages could not be pushed to hosting, that their photo
page and uploads are untouched, and that you will republish shortly. The bundle is still held, and
re-running `bundle_publish` picks up exactly here.

**Read `deploying` and `url` in the publish response before announcing an address.** Hosting deploys
only when it has Cloudflare credentials. Without them the build succeeds, the site is marked
published, and no address exists anywhere. When `deploying` is true the site is live at a `.pages.dev`
address built from the domain with every dot turned into a hyphen: `john.com.my` →
`john-com-my.pages.dev`. When it is false, say the site is built but not yet on a public address, and
that the team will send the link.

**Never hand them a DNS instruction.** Not "add a CNAME", not "ask whoever manages your domain to
point it at the site", not the words Cloudflare or Pages. Connecting a domain is Blackdash's work;
point them at the team. Do not promise there is nothing for them to do either, and do not describe
their custom address as broken or pending. Both wordings are in `references/plain-language.md`.

**No em dashes in anything you hand a client.** Two short sentences beat one with a dash in the
middle.

Say plainly why photographs go through a browser and not the chat: a transcript re-sends every picture
on every later turn, so one site's photography would cost more than the site.

`bundle_status` reports what is still missing. `bundle_discard` withdraws a draft, which is how a
mistyped domain is fixed, and it deletes the uploads with it. Once a site is live it can only be
changed by publishing again.

**Done when** `bundle_publish` has returned a link, the human has been told what to do with it, and
your summary states the `catalogVersion` you built against.

## After you hand off

The bundle you publish is source, not a built site: hosting stores it, renders it with the same build
farm the preview used, and derives every SEO/AEO/GEO artifact from the content tree. Nothing in a
bundle should contain schema markup or hand-written meta. The lever at generation time is choosing the
semantically correct block, because block type is what the generator reads.

Be honest about what that buys. `org.json` becomes the entity graph, which is the real value. FAQ and
Steps blocks no longer earn rich results; emitting them is still right, but do not sell them.
`references/after-handoff.md` has the full table, the refresh story, and what to tell a client who
asks.

## Density, and what you invented

Where the brief is thin, **write the section and mark it `unverified`** rather than omitting it or
inventing a fact. Never fabricate prices, staff, testimonials, news or credentials.
`references/density.md` carries the stage-5 targets, the primitives that reach them, and the rules for
marking.

## Composing sections

Reach for `FreeSection` first: it composes primitives, so the shape follows the content. Six section
types must stay typed, because the platform reads them to derive schema and a `FreeSection` imitation
is invisible to it. `references/composing-sections.md` has the six, why each, and what keeps free
composition from becoming slop.

## Re-theming an existing site

A new `theme.json` against the same `site.json`. Nothing in the content changes; if you find yourself
editing `site.json` to make a theme work, the theme is wrong.

## Rules that prevent the common failures

- **Never invent facts.** If a block needs content the brief lacks, leave it out and say why.
- **No raw values in `site.json`** — no hex, no px, no font names. Those belong to the theme.
- **`chrome` carries Nav and Footer once for the whole site.** Page `blocks` arrays must not repeat
  them.
- **Slugs are editorial roles**, not block types: `hero/home`, `hero/page`, `hero/statement` should
  resolve differently. About two slugs per block type, except `Hero`, which takes one per page.
- **Content must suit the layout.** `overlay-fullbleed` puts text on the photo, so it requires
  `imageKind: "environment"`.

`references/house-rules.md` has the full list and the reasoning.

## Reference files

Read these when the stage that needs them arrives, not upfront.

| File | Read it at |
|---|---|
| `references/intake.md` | stage 1 — the `org.json` schema and the verbatim question list |
| `references/plain-language.md` | every ▸ — the translation table and every client-facing script |
| `references/proposing-themes.md` | stage 3 — the three-proposal protocol, served fonts, the style tile, the worked pitch |
| `references/palette.md` | stage 3 — the eleven colour tokens, hue unity, accent budget |
| `references/art-direction.md` | stages 3–4 — tokens, what drives distinctiveness, slop tells |
| `references/catalog.md` | stages 4–6 — every block, variant, prop, and the primitives |
| `references/composing-sections.md` | stages 5-7 — `FreeSection` and the six typed sections |
| `references/density.md` | stages 5-7 — hitting density, and marking `unverified` |
| `references/house-rules.md` | stages 2, 5–6 — supplied stock, regulated categories, validation gates |
| `references/live-preview.md` | stages 1–9 — the photo pool and its tools, draft/patch ops, publish cadence |
| `references/after-handoff.md` | stage 10 — what the platform derives, honestly |
| `references/local-path.md` | only in a checkout — servers, folder layout, QA scripts |

Stage 8 lives in `check-webpage`, because `edit-webpage` needs the same pass after a token change.
