---
name: create-webpage
description: Use when someone wants a website, landing page, or set of marketing pages built, generated, scaffolded, redesigned or re-themed for a company or client; when they share a client brief, company documents or brand colours and ask for a site; or when they ask to change a site's whole look or art direction. Use it even if they only say "build me a site for X". For a scoped change to a site that already exists — one page, one section, one token — use edit-webpage instead.
---

# Create a webpage

You are generating a website as **data**, not code. A site is two JSON artifacts validated against a fixed component catalog:

- **`site.json`** — pages, and for each page an ordered list of sections: `{type, variant, props}`
- **`theme.json`** — 37 required design tokens, 45 optional ones, plus a map of variant slugs → `{layout, tone, vars?}`

A build step renders those into static HTML. You never write HTML, CSS, or components. This is what keeps every generated site patchable later: when the platform ships new SEO/AEO schema or fixes a component, every site inherits it on rebuild — but only because no site contains bespoke markup.

## Why the split matters

Two failure modes kill generated sites. Both come from confusing these layers:

| Layer | Who decides | Failure if you get it wrong |
|---|---|---|
| **Structure** — which blocks, what order, what copy | fixed catalog | free-form markup → unmaintainable, unpatchable |
| **Art direction** — tokens, which layout & tone each slug resolves to | generated per client | reused defaults → every site looks like the same template |

So: keep the *vocabulary* rigid — the block catalog is fixed, and you never write markup — but make both the **composition** and the **art direction** genuinely different each time. Reusing the catalog is the point; reusing an ordering of it is the failure.

Two words carry that through every stage below. **The mode** is the likeliest thing to propose: the first art direction, the first page ordering, the arrangement every competitor already uses. It arrives without being chosen, and a site that looks templated is almost always the mode wearing a new palette. **The tail** is everything else you sampled. Stages 3 and 4 both work the same way — generate, identify the mode, then choose from the tail.

## Get the catalog from the platform, not from memory

**Call `catalog_list` first, every time. If it fails, you may not compose a bundle.**

Blocks ship weekly, so anything written into this skill is a snapshot that will eventually be wrong.
Generating against a stale catalog does not fail loudly: it produces a bundle you believe is valid,
that the client approves, and that is rejected at upload after all the work is done. So a catalog
you cannot reach is never *substituted* — not from memory, and not from `references/catalog.md`.

That file is a reading reference, not a second source of truth, and the distinction is exact: read it
freely at stages 4–6 to remind yourself what a block takes, while a live catalog is what you are
composing against. It cannot stand in for one, because it carries no `catalogVersion` build hash —
and without that string the bundle you write cannot be drift-checked by the farm at all.

**The stop is stage 4, not the session.** Stages 1–3 name no block and read no schema: intake is a
conversation about a registration number, the inventory counts words, the theme is tokens. Run them.
Stage 4 is where it bites — it maps roles to block types, needs the `catalogVersion` including the
build hash, and calls `fleet_siblings`. Say plainly which stage you reached and which tool you are
waiting on, so the human knows what restarting the server unblocks.

Then call `catalog_get` for only the blocks you intend to use — pulling all of them wastes the
context you need for composition.

### The chat path is the default; a checkout is the exception

| | chat (default) | in a checkout |
|---|---|---|
| Photographs | `assets_open` at stage 1, then `assets_list` / `assets_view` | the files are already on disk — see `references/local-path.md` |
| Validate | `bundle_validate` | `npm run validate -- <client>` |
| Preview | `site_preview` — renders in the conversation | `npm run dev`, port 5183 |
| Publish | `bundle_publish` — returns the *same* photo link `assets_open` minted, now with a checklist | `./package.sh <client>`, upload the zip |

Both validators are the same module the build farm imports, so a bundle passing on either cannot
fail at upload for schema reasons; wanting a friendlier second opinion is a bug. Publish the SOURCE
bundle — built HTML freezes the site out of re-theming and fleet patches.
`references/local-path.md` holds everything that exists only in a checkout.

**Hold a draft and patch it.** `bundle_put(site, theme, org)` once real JSON exists returns a
`draftId`; every edit after is `bundle_patch(draftId, target, ops)` — ~100 bytes instead of
resending 25 KB. **`target` is `site`, `theme` or `org` and defaults to `site`**, so a token fix or
a new slug needs `target: "theme"` explicitly; sent without it the ops are applied to the pages and
fail on a path that isn't there —
and `site_preview(draftId)` draws the result. `references/live-preview.md` has the op shapes and the
2h hold.

**The pictures come first now.** `assets_open(domain, client)` at stage 1 mints the browser upload
page before any bundle exists, so the client is dropping photographs while you are still discussing
the sitemap — and `assets_list` / `assets_view` let you read and *look at* what arrived. Write those
stored filenames into your props and the first `site_preview` **after the first `bundle_publish`**
has real pictures in it, rather than the page of empty frames this flow used to start with. That
publish is the step that points the preview at the uploaded files — before it, every `<img>` is still
blank however full the pool is, so stage 5 publishes as soon as the home page is real.

**Publish early too, once you have a draftId.** Publishing only ever creates a draft, never a live
deploy, so it is safe to call early or repeatedly, and it upserts onto the same pool: same link, same
uploads, nothing lost. What it adds is the checklist — from that point the upload page also names the
pictures the site still wants.

**Then re-publish at the end of every stage that adds an image.** The upload page derives its
checklist from the *published* bundle, so a picture added at stage 6 or 7 is invisible on that page
until the next `bundle_publish` — the human is looking at a list that stopped growing at the home
page, with no way to upload the photograph you just asked for. Re-publishing keeps the same link and
everything already uploaded, so this costs one call. After it, `site_preview(draftId)` shows every
file they have dropped in so far, at the real crop — which is how the site fills with real pictures
while it is still being written, instead of arriving blank at hand-off.

**Reference the name the file is actually stored under, verbatim.** On the chat path that is the
name `assets_list` reports — the pool sanitises what the client dropped and re-encodes it, so
`Showroom Front.JPG` is `showroom-front.webp` and an SVG is refused outright. In a checkout it is the
path on disk, capitalisation included (`uploads/OPTIMISED/LOGO/logo.svg`). Either way a tidier name
you invented is a broken image nobody sees until the site is live.

You can *see* the photographs, which is the one moment anything in this pipeline knows what a
picture is of. So write `alt` from the image and never from the filename, and set `imageKind` from
what you can see — `environment` for a scene with depth, `cutout` for a product on a plain ground,
`detail` for a close crop. The validator refuses a cutout under `overlay-fullbleed` because text on
it is unreadable, and it can only refuse what you declared.
## Workflow — checkpoints, not one long generation

Generating a whole site and then asking "is this right?" is the expensive way to be wrong. Each stage
below produces something small enough to review in seconds, and you stop and wait at every ▸ mark.

```
1  intake             (human)  drop the documents first, you read them, then ask what's left
                              — including the brand colour, which stage 3 is built from,
                              and the photo link, so the pictures arrive while you work
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

**Stages 2, 3 and 4 share one checkpoint**, at the end of stage 4. Show the gap list, the style tiles
and the sitemap together and ask once: the look and the structure are two halves of the same question
— what this site is and what it looks like — and stage 2's unanswered gaps are what the human needs
in front of them to answer it. Splitting them costs round trips for nothing.

The risk in choosing the look before the structure is real and worth naming: three independent runs
of one brief that picked art direction first produced three palettes and *one* page structure,
because the structure was fitted to a look already locked, and the safe structure fits every look.
**Stage 2 is what defuses it.** Do the content inventory during intake, before either, and the type
scale and density are chosen against how much copy will actually be there. Sample the sitemap
independently — not as the arrangement that suits the tile you just drew.

### ▸ is a hard stop, not a suggestion

**At every ▸ you call `AskUserQuestion` and end your turn.** Not "here are three options, I picked
A, moving on" — that is a generation with a commentary track, and it is the failure this workflow
exists to prevent. The human is the client's proxy; they are the only one who knows which of two
defensible choices is the one they will have to live with.

The rule that catches the common self-deception: **if your message contains the words "I picked" or
"I'll go with", it should have been an `AskUserQuestion` instead.** Recommending is fine and
expected — deciding is not.

| At a ▸ | Do |
|---|---|
| The choice has options to compare — a look, a layout, a page list, a density | Push a screen (see "Showing work visually"), then `AskUserQuestion` with the same A/B/C labels |
| The choice is a single fact — a number, a name, yes/no | `AskUserQuestion` directly, no screen needed |
| You genuinely have one option | Still ask — "proceed / change something" — the human may know a constraint you don't |

Three legitimate exceptions, and only these: the human said "don't ask, just build"; you are running
as a subagent with no human attached; or a prior answer at this same checkpoint already covers the
question. Say which one applies, once, rather than silently skipping.

**Between ▸ marks, run straight through to the next one.** The ten stages are the checkpoints; a
checkpoint every two paragraphs moves the work back onto the human, which is what the gates exist to
prevent.

**But never run silently.** Stages 2, 3 and 4 share one gate, so that stretch is three stages of work
with nothing to look at — and a human watching a model generate for minutes with no sign of what it
is doing cannot tell progress from a hang. **Open each stage with one line naming it and what it will
produce** — "Stage 3 of 10 — three looks to choose from, coming up" — then do the work. One line, not
a preamble; the deliverable is still the message.

**Emit each stage's artifact as it finishes, not batched at the gate.** The content inventory table,
the style tiles and the sitemap are three separate things the human can start reading the moment each
exists. Holding all three back to arrive together triples the wait before anything appears on screen
and buys nothing — the *question* is still asked once, at the end of stage 4.

### The person deciding is not a designer

Assume the human has never built a website, does not know what a hero is, and cannot tell you
whether they want a 1.25 type scale. They know their business, their customers, and what looks right
to them. **Everything shown at a ▸ must be answerable from that alone.**

A question in catalog vocabulary still gets answered — people don't like admitting they didn't
follow — and an answer given without understanding arrives with false confidence and you build on
it. `references/plain-language.md` is the translation table; consult it while writing anything a
human reads.

Three rules follow:

- **Every option carries a consequence in their terms, not an adjective.** "Warm editorial" tells
  them nothing; "reads like a magazine — better if people browse, worse if they're comparing
  specifications" is a choice they can make.
- **Say what you recommend, in one sentence.** A non-expert shown three equal options is being asked
  to do your job. Recommending is not deciding.
- **"I don't like it but I can't say why" is a complete answer.** Take it and propose a different
  direction. Keep "change something" on the table at every gate.

Your notes and everything written to disk keep the precise vocabulary. This governs sentences a
person reads.

### Show the work, never make them imagine it

A look, a layout, a tone rhythm and a page structure are judged by eye in two seconds and cannot be
judged from prose at all. **Prose is the wrong medium for stages 3, 4 and 7.**

- **`site_preview(draftId)` once a bundle exists** — the real renderer and stylesheet, so what is on
  screen is what ships. Use it from stage 5 on, after every material patch, instead of narrating the
  change.
- **The `design` skill's canvas before one exists** — stage 3's tiles, stage 4's skeletons, stage
  7's findings. It publishes as an Artifact, so it survives the session, and where canvas-editing is
  enabled the human can click an element and comment rather than describing "the second tile". A
  plain Artifact is the fallback.

**The decision still runs through `AskUserQuestion`.** Canvas comments narrow what A/B/C means; they
don't replace picking one. `AskUserQuestion`'s option previews are monospace markdown — fine for a
page list, useless for an art direction, and a direction chosen from its *name* is chosen on the one
thing about it that doesn't matter.

**Render the tokens, not a description of them.** A tile built from the real token values — even
hand-written HTML that never ships — is faithful. A tile drawn from your idea of "warm editorial" is
a different design approved under the same name.
### 1. Intake — documents first, questions second
**Open by asking for the files, not for the fields.** The client already has a company profile, a
deck, a brochure and a logo; those documents contain most of what `org.json` needs. Ask them to drag
the lot into the chat, read every one, and only then ask about what is actually still missing —
usually four or five things instead of fifteen. A person retyping their own phone number out of
their own PDF is the skill doing its extraction work for it, badly.

The facts become `org.json` — the third artifact of the bundle, sent with `bundle_put` on the chat
path and written to `content/<client>/org.json` in a checkout. They never appear in marketing copy,
cannot be inferred, and must not be invented — a fabricated registration number is worse than a missing one,
so cite where each extracted value came from and let the human correct it in one pass.

**Both wordings — the "send me your files" opener and the follow-up gap list — are in
`references/intake.md`, along with the `org.json` schema and the Malaysia registration-number rule.
Use them verbatim, as markdown in the chat — never inside a code block, and never with hand-padded
columns.** Fenced monospace reads as a printout rather than a message, and a client who has to work
through seventeen aligned lines answers the first four. Cut every item the documents already
answered: the list in the reference is the maximum, not a form to reproduce. Left to invent the wording, one model produces a tidy form and another files
asset questions under a heading like "Platform details", and the difference lands on the client.
The human-facing text carries **no schema jargon** — not `sameAs`, not `areaServed`, not a statute
number. Ask for "links to your company anywhere else online"; do the mapping to field names
yourself.

The blockers are five: registration number, legal name, phone/email, the **domain** the site will
live at, and the **logo file** (raster — WebP/JPEG/PNG/AVIF; flag now if it's only available as SVG,
see `references/live-preview.md`). A provisional domain is fine, but it is no longer cheap to get wrong: it is the key the photo pool
is filed under, so `bundle_discard` now takes the client's uploaded photographs with it and they
re-upload from scratch. **Read the domain back to them before calling `assets_open`** — "so the site
is filed under merryfair.com, yes?" — and take the client slug from it (the domain's own name,
lowercased, letters, numbers and hyphens: `merryfair.com` → `merryfair`). The slug is frozen once the
pool is open: it becomes the public `/img/<client>/` path, and a second `assets_open` with a
different one is **refused**, with an error naming the slug already recorded — use that one, or
`bundle_discard` and start the pool again. `references/intake.md` has why the domain is asked
for here at all.

Everything else either shapes the site (buyer, goal, scope, sections, tone) or strengthens
it (`sameAs`, certifications, named people) without blocking the build — `references/intake.md` has
the full breakdown and why each item is where it is.

**Look at the logo, don't just accept the file.** Two things decide theme decisions three stages
later, so establish them here. **Its contrast against white**: a gold, pale or thin-stroked wordmark
on a transparent ground can measure under 3:1 on paper, which means every direction you propose has
to put the header on a dark band — a constraint, not a preference, and much cheaper to know now than
at stage 8. And **its actual colours**: sample the file rather than trusting the brief. A brand sheet
saying `#D4AF37` over a wordmark that is really `#CFB66F` is a question for the client, not a
discrepancy for you to silently resolve either way.

**Deliberately not asked: "how many directions do you want to see".** Stage 3 always proposes three,
one per objective; stage 4 always samples orderings and drops the mode. Letting the human dial either
down to one hands them the mode.

**Open the photo page in this same turn, and ask for everything.** As soon as you have the domain
and the client slug, call `assets_open(domain, client)` and hand over the link it returns:

> **Your photo page:** <link>
> Drop in every photograph you have — logo, products, the team, the premises, anything from an old
> site. Names don't matter and spares are useful; I'll fit them to the pages as I write them. The
> link keeps working, so come back whenever you find more.

This used to be a stage 9 question, and putting it last was the mistake: the pages got written
around filenames that existed nowhere, the client's first sight of their own site was a page of
empty frames, and the one thing only they can supply was collected after everything built on it.
Now the photographs arrive while stages 2–4 are still being discussed, and the **first** preview of
the home page has real pictures in it.

Two things follow from opening it here. The domain is a genuine blocker at stage 1 rather than a
stage 5 one — `assets_open` files the pool under it. And the logo is no longer a special case: it is
simply the first thing on the photo page, and the one to chase if nothing else arrives, because
stage 3's contrast reading depends on it.

**Done when** every blocker carries a value or an explicit "they don't have one", and every fact
you filled in from a document cites the document it came from, so the human can correct it in one
pass.

Nothing about hosting, SEO or refresh belongs in intake either. Those are derived server-side after
upload and need nothing from the creator — see "After you hand off".

### 2. Content inventory — count what exists before designing for it
Before any structure or any look, write down what copy you actually have, where it came from, and
what is missing. One table, no prose:

| Topic | Source | Words available | Verdict |
|---|---|---|---|
| What they make | brief p.2 | ~180 | enough for a section |
| Manufacturing process | brief, one line | ~15 | needs the human, or mark `unverified` |
| Testimonials | — | 0 | omit the role, or ask |

A 380-word brief silently becomes nine thin sections, and nobody sees it until the whole thing is
written.

Total the "words available" column. **Under ~1,200 words of real source material you cannot fill more
than a home page and two subpages without going thin.** Say that now. The human either supplies more,
accepts fewer pages, or accepts that some sections will be written by you and shipped `unverified`.
All three are fine; discovering it at stage 6 is not.

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

This table is the input to stage 8's content-extreme pass — without it that pass invents its own
extremes and tests the layout against content the client will never have.

**Read the photo pool before anything else in this stage.** `assets_list(domain)` says what turned
up, under the names it is stored as; `assets_view(domain, names)` shows you up to eight of them at a
time, small (pass `max` up to 768 for a closer look at one logo). Look at them — this is the only moment anything in this pipeline knows what a picture is
*of*, and three later decisions are made from it: `alt` written from the image rather than the
filename, `imageKind` (`environment` / `cutout` / `detail`, which the validator checks against
`overlay-fullbleed` and can only check against what you declared), and stage 3's direction, which
should answer the client's real photography instead of imagining it.

**An empty pool is an answer, not a wait.** If nothing has arrived yet, say so at the stage 4
checkpoint and keep going: propose the direction and the sitemap on the assumption that photography
will exist, mark which section roles depend on it, and chase the logo specifically, because stage 3's
contrast reading needs it. Do not stall stages 3–5 for uploads — the pool accepts them the whole way
through, and the pages are re-previewed as they land.

Add what you saw to the inventory: one row per picture — the stored name, what is actually in frame,
and which section role it could carry. That list is also the honest version of the gap question at
stage 4's checkpoint: "the pages I'm proposing need a picture of X and there isn't one" is something
the client can act on while there is still time, which is the entire reason this moved to stage 1.

**Photographs that arrived with the brief are not automatically assets.** A folder of stock the
client already chose looks like a solved problem and often is not — it validates, it looks plausible,
and nothing downstream ever questions it. Open every one and say what is actually in the frame, not
what the filename claims. Three failure kinds, all seen on real briefs: a **recognisable place**
standing in for the client's own (a famous library captioned as their office); **third-party
branding** in shot, which is stage 9's check arriving six stages early; and an object that is simply
**wrong for the jurisdiction or trade** — a gavel on a Malaysian or any Commonwealth legal site,
where courts do not use them. Identifiable faces are their own problem: stock models placed near
"our team" read as staff who do not exist. A stock image the client picked is a row on the gap list,
not a row filled.

**Ask whether the category is regulated, because it constrains copy more than any validator does.**
Law, medicine, dentistry, financial advice and education all sit under publicity rules that restrict
outcome claims, superlatives and testimonials — and the brief's own marketing adjectives are usually
the first casualty, so they cannot be lifted into headlines verbatim. You are not the one who decides
what is permitted: name the constraint, say which sections it removes (`Testimonials` and any
results-based `Stats` are the usual two), and put the wording question to the client. Discovering it
at stage 5 means rewriting copy that was already approved.

Anything missing here is a question for stage 4's checkpoint, not a stop of its own — carry the
gap list forward and ask once.

**Done when** the words-available column is totalled, the extremes table has a row for every
constraint you found, every photograph in the pool has been looked at and described, and you have
said out loud whether the total supports the scope asked for at intake.

### 3. Theme — the look on one sheet, not a fake page
Now, and not before, choose the visual direction. The first direction you think of is the mode, which
is why generated sites look alike.

**Propose three, each from a different objective** — Measured (processing fluency), Fit
(prototypicality for the category), Spark (novelty inside the same measured floor). Candidates drawn
from objectives that pull apart cannot collapse into three names for one look — which is what
sampling alone kept producing, because three samples of one distribution share its mode. Resolve Fit first, present Measured first, give each a
stated **cost** as well as a pitch. The protocol, the orthogonality check, the served font families
and the six elements every style tile must carry are in `references/proposing-themes.md`. Read it
before proposing.

Fix each candidate's specification for yourself, then **pitch it in the human's language**, two
lines: what it reads like, and what it costs. Pitch in prose and keep the JSON for the winner —
three full themes costs ten times three descriptions, and two are going in the bin.

> **A — Product catalogue.** Dense and precise, everything aligned to a grid, almost no decoration.
> Reads like a specification sheet in the best way. Costs you warmth — it will never feel friendly.
>
> **B — Magazine.** Large headlines, lots of white space, fewer things per screen. Good if people
> arrive to browse. Costs you speed — a buyer comparing numbers has to scroll further.
>
> **C — Technical.** Crisp and light, colour only on the figures that matter. Costs you
> distinctiveness — it is the most familiar of the three.
>
> I'd pick **A**: you sell on tolerances, and this says so before anyone reads a word.

Naming the typeface in the pitch asks somebody to have an opinion about a word they have never seen
set in type. Keep it in your notes. Name it *against its alternatives* there: "Inter" is not a bad
font, but **Inter unchosen is the tell** — it signals nobody made a typography decision. The same now
goes for monospace on small labels: it reads structured and technical, which is why every generator
reaches for it. Use it if you can say what it does here that small-caps sans would not.

**Motion is part of the direction, so set it here.** Four tokens carry it — `--motion-duration`,
`--motion-ease`, `--motion-state`, `--motion-distance` — plus per-section reveals, with
`prefers-reduced-motion` honoured for you. Default to subtle scroll reveals. Say in the pitch what it
implies — "things fade in gently as you scroll", or "nothing moves".

**Write the pick down as three adjectives and treat them as binding.** They are what every later
decision gets tested against — "precise" and a 28px radius contradict each other, and the
contradiction is only visible if the word was written down. Pick adjectives a competitor could not also claim, and make one of the three slightly
uncomfortable — the discomfort is what stops the set collapsing into the words every site uses.
Record what you rejected.

Put it at `theme.direction`, top level — `references/proposing-themes.md` has the shape. At stage 8
it is what you audit the tokens against, including for the next agent, who otherwise re-derives the
direction from the values and gets it wrong.

**Done when** three candidates exist, each with a stated cost, and the winner's three adjectives are
written into `theme.direction` with what you rejected.

### 4. Sitemap — sample the architecture, then roles, still no copy
A **section role** is the job a section does — proof, range, story, spec, process — not a block type
and not a theme slug. A page is an ordered list of roles, and that shorthand is for your notes:

> **Products** — hero (subpage) · catalogue grid · spec table · media+text · CTA
>
> *shown to the human as:* opening banner · every chair laid out in a grid · the full specifications
> table · one model in detail with text beside it · "request a quote" at the bottom

**Call `fleet_siblings` before writing content**, passing the theme you are leaning towards. It
compares this site against the ones already built and reports layout-map overlap; above ~0.7 against
a sibling, change the layout map rather than the palette. On an empty fleet it answers
`checked: false` — that is the check *not running*, not a pass, and it should be said out loud
rather than quietly read as clearance.

**It sees our fleet, not the client's category.** That tool tells you whether this site resembles
*ours*. It cannot see that every competitor in the client's own category is built the same
way and that you are about to land on it too. So list what the client's three closest competitors all
share:

> *Every ergonomic-chair site opens with a hero photo of one chair on white, then a three-up
> "Comfort / Support / Design" trio, then a product grid.*

That shared structure is the **do-not list**, and it carries through stages 4–6. It is the most
reliable way to avoid a site that is distinct from our fleet and still indistinguishable from its own
market. It is also what you show the human when they ask why the page doesn't look like the
competitor they had in mind.

**Then sample the home-page architecture.** Write three orderings with self-assessed probabilities,
drop the mode, take from the tail — otherwise every site opens `hero → stats → catalogue`. Vary, in descending order of effect: what comes first after the hero
(leading with the catalogue instead of stats is a different company); whether a role appears at all
(five strong sections beat nine even ones, and stage 2 tells you which five you can fill); where the
dark and accent bands fall; page count and split. Fewer sections with more content each is almost
always the better tail choice: it is how you avoid nine thin sections.

Give each role a word budget from the stage-2 inventory. A role with no source and no budget should
not be in the sitemap.

**The output is a page list, not only a home-page ordering.** Three orderings of one page is not an
architecture, and the human cannot add or remove a page they were never shown.

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

Boxes and role labels only — a human shown invented copy judges the copy, so the restriction is the
same one stage 3 puts on style tiles. Height matters: draw a section holding 200 words taller than
one holding a button, or the skeleton lies about density, which is the thing it shows best. Stage 3's
tile answers "what does the type feel like"; the skeleton answers "where does the dark band land".
Show both or the human approves a palette and is surprised by a page.

A wrong sitemap caught here costs one message; caught after copy exists it costs a rewrite.

▸ **The checkpoint for stages 2, 3 and 4 together.** One screen: the gap list, the style tiles, the
sitemaps with their skeletons. Then ask for the theme pick and the sitemap pick in one
`AskUserQuestion`.

**The options list holds the tail only.** Name the mode below it, as reasoning — visible and
unpickable. Presenting the mode *as an option* annotated "avoid this one" puts it back on the table,
and it gets chosen.

**Record the `catalogVersion` in two places.** It is a real optional field at the top level of
`site.json` — write it there, verbatim from `catalog_list`, **including the build hash**
(`0.5.0+1ed25a77e046c01d`, not `0.5.0`). That string is what the farm's drift guard compares
against, and a bundle carrying only the short version cannot be checked. Then say it in your handoff
summary too, for the human. A bundle built against a stale catalog fails at build rather than at
validation, and without the field nobody can tell which happened.


**Done when** every option shows every page with its ordered roles *and* a skeleton, the do-not list
is stated, and the human has picked a theme and a sitemap at the ▸.

### 5. Home page — one page, then stop
Write **the home page only**, at full density, and stop. Nothing else, no matter how ready the
sitemap looks.

One page, not three: the home page exercises most of the range the rest of the site reuses — hero,
proof, capability, story, call to action — so a correction here lands on nearly everything that
follows. And it is the shortest possible distance between "approved a sitemap" and "looking at a real
page". Writing three pages before the first gate is 2,000+ words of full-density copy composed
against an unvalidated reading of the tone, which is a long wait to find out the voice is wrong and
a costly one to redo.

Write it **at full density**: **60+ words and 6+ content nodes per section**, **700+ words per
page**, one image per two sections that can carry one. Hero, CTA, quote, nav and footer are exempt,
as are blocks that cannot hold more (`Stats`, `Locations`).

A section that fills a screen and carries forty words is **thin**. Thin is what makes a generated
site read as an unfinished template rather than a company's website, and it is the most common
failure here — more damaging than any colour or layout choice, and the one a human notices first
without being able to name it. `references/density.md` has the primitives that get a section off
thin; read it before writing, not after.

Headlines must carry a concrete noun from the brief that a competitor could not also claim. "Build
faster. Ship smarter." is a slop tell independent of any visual choice: if the headline would still
be true with the client's name swapped for a rival's, it is decoration, not copy.

**Write `src` from the pool, not from your imagination.** Every picture already uploaded has a
stored name; `assets_list` gives it plus `srcPrefix`, and the prop is the two joined —
`"src": "/img/merryfair/showroom-front.webp"`. The pool stores everything as `.webp` under a
sanitised name, so a tidier one you invented points at nothing: the upload page never asks for it,
`bundle_status` never reports it missing, and the image is permanently blank with no error anywhere.
Only pictures that do not exist yet get names you choose, and those are stage 9's table.

**Publish here, before the corrections.** `bundle_publish` upserts onto the pool the client has been
filling since stage 1: same link, same photographs, nothing lost. Two things change at this call, and
both matter. The preview starts showing the real uploaded files instead of blank frames — which is
why this publish happens now rather than at hand-off. And the upload page gains its checklist, so the
client can see which pictures the site is still short of.

Tell them plainly: "your photo page now also lists what the site is still missing — same link as
before, everything you've already sent is still there. Nothing is public until we say so." Do **not**
tell them to rename files to match: that was the old flow, and names in the pool are ours to derive.
Stage 9 is where the remaining gaps become a brief they can act on — what each picture has to *show*.

▸ Take the corrections before writing anything else. This gate settles what generalises: tone of
voice, how much detail a section carries, what terminology the client uses for their own products,
what claims are off-limits. Collected after the whole site exists, those corrections mean rewriting
the whole site; collected here, they cost one page.

**Done when** one page carries real copy, every section on it is either off thin or on the exempt
list — counted, not estimated — and the upload link is in their hands.

### 6. Proof pages — the two densest, with the corrections applied
Now write **the two pages carrying the most structured content** — the spec table, the price
comparison, the nine-item catalogue, the form — applying every correction from stage 5.

These are the pages the *system* is proved on. A home page is a hero, a proof strip and a call to
action, and almost any set of tokens survives it; layout defects concentrate on dense sections
nothing has exercised yet. Two of them rather than one catches the defect a single page cannot show:
a slug that was quietly tuned to suit *that* page and breaks on the next one using it.

**If the sitemap has three pages or fewer, this stage finishes the site** — say so, take the
corrections, and stage 7 has nothing to do. Four or five pages: still only these two. The point is
to spend the correction rounds on the pages carrying the most structure, not to get closest to
finishing.

Same density floor as stage 5, and the same rule on headlines.

▸ Take the corrections. This gate is narrower than stage 5's — tone is settled, so what surfaces
here is structural: a table that is unreadable at the density you chose, a slug that works on one
page and not the other. Those are cheap now and expensive once five more pages use the same slug.

**Done when** both pages carry real copy at the density floor, and every slug they introduced
resolves in `theme.json`.

### 7. Remaining pages
Apply both correction rounds to every remaining page. If stages 5 and 6 covered the whole site, say
that and move to stage 8 rather than inventing a page to fill this stage. If a correction contradicts
something in the approved sitemap, raise it rather than quietly resolving it — the human knows which
one they meant.

There is no gate here: the two rounds already settled voice, density and the slug system, so these
pages are applying decisions rather than proposing them. **If more than about five pages remain,
show the first one before writing the rest** — a long tail built on one approval is where drift
reappears.

When a page needs a look the theme has no slug for, **add the slug to `theme.json` and reuse it**, do
not invent a one-off. Adding a bespoke treatment per page as you go is the junior habit that produces
a theme with fourteen near-identical slugs and no system; the senior habit is to notice the second
occurrence and name the shared thing.

**Two slugs per block type is the ceiling everywhere except `Hero`.** The validator wants each page
to open distinctly, so a four-page site carries four hero slugs — `hero/home`, `hero/services`,
`hero/about`, `hero/contact` — and that is the rule working, not slug sprawl. The ceiling is about
*body* sections, where a fourteenth near-identical card treatment means nobody built a system.


**Done when** every page in the approved sitemap exists, and every slug used resolves in
`theme.json`. A slug a page invented and the theme never defined renders unstyled.

### 8. Design QA — the pass that is not "does it validate"
**REQUIRED SUB-SKILL:** use `check-webpage`. It owns the nine checks, the script that computes
contrast and theme coverage, and the report format.

Two things carry over from here that it cannot know: stage 2's content-extremes table is the input
to its check 2, and `theme.direction` from stage 3 is what its check 5 audits the tokens against. A
theme with no `direction` block fails that check for want of anything to compare to — write it at
stage 3, not here.

Report to the client as two lists in their language — **what you fixed**, and **what is their
call** — never as nine rows of ratios they cannot verify.

**Done when** `check-webpage` reports all nine rows with a Who and a Result, and its browser-only
questions have been put to the human.

### 9. Assets and facts — the gaps the pool never filled
Most of the photography arrived at stage 1 and is already placed, so this stage is now about the
difference: slots the pool has nothing for. Run `assets_list` once more first — clients keep
uploading after the conversation moves on — and only then write the request list.

The layout now exists, so you know exactly which images are still wanted and what each one has to
be. Turn that into a list and hand it over — a human asked "send me some photos" sends whatever is on
their phone; a human asked for "your workshop, wide, showing the bays in use" sends that.

**Produce the list first**, one row per slot still empty. **The description column is the point** —
what the picture has to show is the only part the client can act on, and the difference between
"send me some photos" and a photograph you can actually use:

| What to send | Where it goes | Shape | (your slot name) |
|---|---|---|---|
| the workshop with bays in use, room at the top for the headline | top of the home page | wide | `hero-workshop.webp` |
| the backrest alone on a plain ground | products, third card | square | `cfm-backrest.webp` |
| the founder, waist-up | about page | portrait | `founder-portrait.webp` |

The last column is **yours, not theirs** — it is the `src` you already wrote, and what a slot is
called is now invisible to the client. Whatever name their file arrives under, the picture lands in
the pool and you point the slot at it. Keep the column in your own notes so you know which arrival
answers which row; do not put it in front of them.

**For the pictures in this stage's table `alt` is written twice, and the validator polices neither.**
These are the ones nobody has taken yet, so — unlike everything in the pool, which you can look at —
you have no pixels here. Write the alt the list *specifies* — "the cold store, down an aisle, racking either side" —
never the filename. Then when the photograph is actually up and you can see it in the preview,
correct any alt the real image contradicts. An empty `alt` string validates cleanly and ships, so
nothing will catch it for you.

**Choosing an overlay layout commits that row to an `environment` photo.** `overlay-fullbleed` puts
text on the picture, and the validator refuses a `cutout` under it — so the `imageKind` is decided
at stage 5 when you pick the layout, and the picture list must then *ask for* a photo that suits it
("shot wide, with empty sky at the top for the headline"). That is the one place declaring a kind
before seeing the pixels is correct: you are not describing a photo, you are specifying one.

**The `src` you write must be `/img/<client>/<filename>`** — hosting matches uploads against that
shape exactly, and a `src` of `"hero-workshop.jpg"` or `"images/hero.jpg"` is silently dropped: the
upload page never asks for it, `bundle_status` never reports it missing, and the image is
permanently blank with no error anywhere. So `hero-workshop.webp` in the table above means
`"src": "/img/john/hero-workshop.webp"` in the props.

**For a picture already in the pool the filename is not yours to choose** — copy it verbatim from
`assets_list`, as stage 5 says. Only the *new* requests in this stage's table get names you pick.

Name each slot for what it shows — `image-1.webp` leaves *you* no way to tell which arrival answers
which row, which is the only thing slot names are now for.

**Hand over the list with this, adapted.** Everything in it is something clients hit and are
surprised by, so it belongs in the words they read rather than in a note to yourself to mention it:

>
> **Same photo page as before:** <upload link>
>
> Everything you've already sent is still there — nothing to re-send, nothing to rename. These are
> the pictures the site still doesn't have anywhere:
>
> [the list]
>
> - **Just drop them in.** Any filename is fine; I'll put each one where it belongs. **Don't convert
>   or resize anything** — straight off your phone in whatever format they are.
> - **Something wrong?** Every picture on the page has *replace* and *remove* beside it — replace
>   swaps the file and keeps its place on the site.
> - You can close the page and come back — it remembers what's already in.
> - Nothing is public while you do this.
>
> When the last photo is in, a **"Publish the site"** button on that page comes alive. Pressing it
> is what puts the site live — it does not happen on its own.
>
> Worth knowing now: **once you publish, that page stops accepting photos.** If you want to swap one
> later, come back to me and I'll reopen it. The link isn't broken, it's finished.

Why each line is there: hosting decodes JPEG, PNG, WebP, AVIF, **HEIC**, TIFF and GIF, so "convert
it first" is work the server already does and an iPhone photo goes up as it came off the phone.
Filenames are not the client's problem any more — anything that does not match a slot is stored as a
spare under a name the server derives, and **wiring it to the right section is your job**: read the
new names from `assets_list`, look at them with `assets_view`, and patch the `src` of the slot each
one belongs to. And after publishing, uploads answer "this site is published; re-publish from the
conversation to change it" — a client who was not told that concludes the link died.

Three limits, if they come up: **40 MB** a file, **2400px** on the longest edge (everything is
resized down on arrival, so a print-resolution original is not what gets served), and **no SVG** —
a logo needs PNG or WebP. Photo metadata is dropped in re-encoding, which matters to anyone who
assumes their copyright EXIF travels with the file.

Their own photographs were asked for at stage 1 and most of them are already placed, so do not run
that request again — this list is only what the pool never had. Chase it once; a real picture of the
actual place beats anything you can source. Rows still empty after that are the gap list, and only
the gap list goes to stock.

**`bundle_status(domain)` is the loop's exit condition** — it is keyed by the domain, not the
draftId. It reports exactly which expected files are still missing, so work it until it is empty
rather than asking "did you upload them?" — the human often believes they did. Check `extras` in the
same breath: a picture that arrived under a name no slot uses is sitting in the pool, invisible to
the checklist, and it is usually the very photograph you asked for. Look at it, patch the slot's
`src` to that name, and re-publish.

**Then work the `unverified` checklist**: every marked section is confirmed, corrected, or removed.
Until it is empty the build farm refuses to publish. Verify every number and claim while you are
there — a wrong specification on a manufacturer's site is a commercial problem, not a formatting
one, which is why this part stays the human's.

Check every image for **third-party branding** — a competitor's logo on a worker's jacket is a real
problem no validator catches.


**Spares are not a mess to tidy.** A client told to send everything will send more than the site
uses, and those pictures are what a later page, a second language or a re-theme is composed from.
They never block publishing. Leave them, and mention them only if the pool is near its ceiling (150
files or 500 MB), where the page's *remove* control is the answer.

**Done when** `bundle_status` reports no missing files, every remaining slot is deliberately
type-only, and the `unverified` list is empty.

#### Filling the gaps with stock

**REQUIRED SUB-SKILL:** use `sourcing-stock-photos` for anything on the gap list. It carries the
search procedure, the licence terms and the reject list.

Stock is scaffolding for a slot the client cannot fill today. A section that stage 2 marked as
having no usable photo is allowed to work type-only, and often should: one or two stock images
placed deliberately read as considered, a full set reads as generated. Say which is which when you
hand the list over, so the real shoot stays on their backlog.

Two things the sub-skill cannot know, because they are this pipeline's:

- **Where the file goes.** In a checkout, `assets/<client>/<slug>.jpg`, referenced as
  `/img/<client>/<slug>.jpg`. On the chat path there is no `assets/` folder — the picture reaches
  the site through the browser upload link, so hand the human the shortlist and let them drop the
  files there. Nothing requires `.webp` — hosting re-encodes on upload, before the farm ever runs.
- **`alt` and `imageKind` come from the pixels**, once there is a file to look at. Where the
  download cannot happen, leave both empty and say why — a guessed `imageKind` defeats the one check
  the validator performs with it.

### 10. Hand off
Validate, preview one last time, then `bundle_publish` — the domain, the bundle, and `org.json`,
which is required because the entity graph is built from it alone and a site without one is refused
here rather than at upload. The client has had the upload link since stage 1, so this call
re-publishes the finished JSON to that *same* link; say so, rather than handing over what looks like
a second, different one.

**If publishing fails, say so and stop there.** Hosting being down is not something to work around.
Tell them plainly — "I can't push the finished pages to hosting right now. Your photo page and
everything you've uploaded are untouched; I'll re-publish shortly" — and keep the draft. (The "I
can't generate your upload link" wording belongs at stage 1, where an `assets_open` failure really
does leave a photograph with no route into the site.) Nothing is lost: the bundle is
still held, and re-running `bundle_publish` later picks up exactly here. What you must not do is
improvise a substitute route for the pictures or describe the site as finished.

**The upload wording lives at stage 9** — hand over that script, not a shorter improvised version.
If they have already had it, do not re-explain: say the link is the same one and their uploads are
still there.

**When it goes live, give them the real address and name the last step.** The site publishes to a
`.pages.dev` address built from their domain, with every dot turned into a hyphen — so `john.com.my`
is live at `john-com-my.pages.dev`. That is a complete, working, shareable site. Their own web
address is connected afterwards, **by the Blackdash team, not by them**:

> Your site is live: **john-com-my.pages.dev**. That address works right now, you can send it to
> anyone. It's on the upload page too, once the build finishes.
>
> Want it on **john.com.my** instead? Talk to the Blackdash team and we'll take you through the next
> step. Same site, same pages, with your own name in front.

**Never hand them a DNS instruction.** Not "add a CNAME", not "ask whoever manages your domain to
point it at the site", not the words Cloudflare or Pages. The person on the other end has no
development machine and no reason to know what any of that means; an instruction they cannot act on
produces a finished site nobody ever uses. Connecting a domain is our work — point them at us.

Do not promise there is nothing for them to do either. A domain we have no access to cannot be
connected, so at some point somebody with the registrar login is involved; that is a conversation
the team has, not a step to spell out here. "Talk to us and we'll take you through it" is the whole
message: true, and the reassurance they are actually looking for.

**Write it the way a person writes.** No em dashes in anything you hand a client: they read as
machine-written, and a site pitched to their customers is the worst place to sound like one. Two
short sentences beat one with a dash in the middle.

Do not describe the custom address as broken or pending while that connection has not happened. The
site is finished; the name is a job we do next.

Say plainly why photos go through a browser and not the chat — a transcript re-sends every picture
on every later turn, so one site's photography would cost more than the site. Not "the bundle awaits
asset resolution". That is not an apology for a missing feature; it is why this works for someone
with no development machine at all.

`bundle_status` reports what is still missing; `bundle_discard` withdraws a draft, which is how a
mistyped domain is fixed. Once a site is live it can only be changed by publishing again.

**Done when** `bundle_publish` has returned a link, the human has been told what to do with it, and
your summary states the `catalogVersion` you built against.

## After you hand off
The bundle you publish is source, not a built site: hosting stores it, renders it with the same build
farm the preview used, and derives every SEO/AEO/GEO artifact from the content tree. Nothing in a
bundle should contain schema markup or hand-written meta — the lever at generation time is choosing
the semantically correct block, because block type is what the generator reads.

Be honest about what that buys. `org.json` becomes the entity graph, which is the real value. FAQ and
Steps blocks no longer earn rich results and have not for years; emitting them is still right, but do
not sell them. `references/after-handoff.md` has the full table, the refresh story, and what to tell
a client who asks.

## Density, and what you invented
Where the brief is thin, **write the section and mark it `unverified`** rather than omitting it or
inventing a fact. Never fabricate prices, staff, testimonials, news or credentials.
`references/density.md` carries the stage-5 targets, the primitives that reach them, and the rules
for marking.

## Composing sections
Reach for `FreeSection` first: it composes primitives, so the shape follows the content rather than
the content being trimmed to fit a block. Six section types must stay typed — the platform reads them
to derive schema, and a `FreeSection` imitation is invisible to it.
`references/composing-sections.md` has the six, why each, and what keeps free composition from
becoming slop.

## Re-theming an existing site
A new `theme.json` against the same `site.json`. Nothing in the content changes; if you find yourself
editing `site.json` to make a theme work, the theme is wrong.

## Rules that prevent the common failures
- **Never invent facts.** If a block needs content the brief lacks, leave it out and say why.
- **No raw values in `site.json`** — no hex, no px, no font names. Those belong to the theme.
- **`chrome` carries Nav and Footer once for the whole site.** Page `blocks` arrays must not repeat
  them.
- **Slugs are editorial roles**, not block types: `hero/home`, `hero/page`, `hero/statement` should
  resolve differently. About two slugs per block type — except `Hero`, which takes one per page.
- **Content must suit the layout.** `overlay-fullbleed` puts text on the photo, so it requires
  `imageKind: "environment"`.

These come from real breakages; `references/house-rules.md` has the full list and the reasoning.

## Reference files
Read these when the stage that needs them arrives — not upfront.

| File | Read it at |
|---|---|
| `references/intake.md` | stage 1 — the `org.json` schema and the verbatim question list |
| `references/plain-language.md` | every ▸ — the client-facing translation table |
| `references/proposing-themes.md` | stage 3 — the three-proposal protocol, served fonts, the style tile |
| `references/palette.md` | stage 3 — the eleven colour tokens, hue unity, accent budget |
| `references/art-direction.md` | stages 3–4 — tokens, what drives distinctiveness, slop tells |
| `references/catalog.md` | stages 4–6 — every block, variant, prop, and the primitives |
| `references/composing-sections.md` | stages 5-7 — `FreeSection` and the six typed sections |
| `references/density.md` | stages 5-7 — hitting density, and marking `unverified` |
| `references/house-rules.md` | stages 5–6 — validation gates and known pitfalls |
| `references/live-preview.md` | stages 1–9 — the photo pool and its tools, draft/patch ops, pictures in the preview |
| `references/after-handoff.md` | stage 10 — what the platform derives, honestly |
| `references/local-path.md` | only in a checkout — servers, folder layout, QA scripts |

Stage 8 lives in a skill of its own — `check-webpage` — because a finished site gets checked more
often than it gets built, and `edit-webpage` needs the same pass after a token change.
