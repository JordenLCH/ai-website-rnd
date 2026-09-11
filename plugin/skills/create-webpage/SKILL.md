---
name: create-webpage
description: Use when someone wants a website, landing page, or set of marketing pages built, generated, scaffolded, redesigned or re-themed for a company or client; when they share a client brief, company documents or brand colours and ask for a site; or when they ask to change a site's whole look or art direction. Use it even if they only say "build me a site for X". For a scoped change to a site that already exists — one page, one section, one token — use edit-webpage instead.
---

# Create a webpage

You are generating a website as **data**, not code. A site is two JSON artifacts validated against a fixed component catalog:

- **`site.json`** — pages, and for each page an ordered list of sections: `{type, variant, props}`
- **`theme.json`** — 39 required design tokens, 43 optional ones, plus a map of variant slugs → `{layout, tone, vars?}`

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
| Validate | `bundle_validate` | `npm run validate -- <client>` |
| Preview | `site_preview` — renders in the conversation | `npm run dev`, port 5183 |
| Publish | `bundle_publish` — returns a link for the pictures | `./package.sh <client>`, upload the zip |

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

**Publish early, once you have a domain and a draftId.** Publishing only ever creates a draft, never
a live deploy, so it is safe to call early or repeatedly — and until pictures are uploaded every
`<img>` in the preview is blank, logo included. Hand over the upload link at stage 5 and say
"upload now, it'll show up in the preview live."

**Reference the path the human actually uploaded**, verbatim, including its capitalisation
(`uploads/OPTIMISED/LOGO/logo.svg`). A tidier path you invented is a broken image nobody sees until
the site is live.

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
                              — including the brand colour, which stage 3 is built from
2  content inventory  (you)    what copy exists and what it breaks — prep, no gate
3  theme              (you)    3 proposed, shown as style tiles
4  sitemap            (you)    pages + section roles, sampled, plus a skeleton of the home page
                                                                   ▸ human decides or revises (2+3+4)
5  first pages        (you)    home + the two densest, real copy    ▸ human decides or revises
6  remaining pages    (you)    applying the corrections
7  design QA          (you)    breakpoints, states, contrast        ▸ human sees the list
8  assets & facts     (both)   real photos, verified numbers — you source stock for the gaps
9  hand off           (you)    validate, publish, hand over the upload link
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

**Between ▸ marks, run straight through to the next one.** The nine stages are the checkpoints; a
checkpoint every two paragraphs moves the work back onto the human, which is what the gates exist to
prevent.

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
usually four or five things instead of sixteen. A person retyping their own phone number out of
their own PDF is the skill doing its extraction work for it, badly.

The facts become `org.json` — the third artifact of the bundle, sent with `bundle_put` on the chat
path and written to `content/<client>/org.json` in a checkout. They never appear in marketing copy,
cannot be inferred, and must not be invented — a fabricated registration number is worse than a missing one,
so cite where each extracted value came from and let the human correct it in one pass.

**Both wordings — the "send me your files" opener and the follow-up gap list — are in
`references/intake.md`, along with the `org.json` schema and the Malaysia registration-number rule.
Use them verbatim.** Left to invent the wording, one model produces a tidy form and another files
asset questions under a heading like "Platform details", and the difference lands on the client.
The human-facing text carries **no schema jargon** — not `sameAs`, not `areaServed`, not a statute
number. Ask for "links to your company anywhere else online"; do the mapping to field names
yourself.

The blockers are five: registration number, legal name, phone/email, the **domain** the site will
live at, and the **logo file** (raster — WebP/JPEG/PNG/AVIF; flag now if it's only available as SVG,
see `references/live-preview.md`). A provisional domain is fine and a wrong one is cheap to fix with
`bundle_discard` — but it is needed before stage 5 publishes, so it is asked for here.
`references/intake.md` has why.

Everything else either shapes the site (buyer, goal, scope, sections, tone) or strengthens
it (`sameAs`, certifications, named people) without blocking the build — `references/intake.md` has
the full breakdown and why each item is where it is.

**Look at the logo, don't just accept the file.** Two things decide theme decisions three stages
later, so establish them here. **Its contrast against white**: a gold, pale or thin-stroked wordmark
on a transparent ground can measure under 3:1 on paper, which means every direction you propose has
to put the header on a dark band — a constraint, not a preference, and much cheaper to know now than
at stage 7. And **its actual colours**: sample the file rather than trusting the brief. A brand sheet
saying `#D4AF37` over a wordmark that is really `#CFB66F` is a question for the client, not a
discrepancy for you to silently resolve either way.

**Deliberately not asked: "how many directions do you want to see".** Stage 3 always proposes three,
one per objective; stage 4 always samples orderings and drops the mode. Letting the human dial either
down to one hands them the mode.

**Section photography is not an intake question; the logo is.** Bulk photos wait for stage 8, after
the layout exists and you know which images it actually needs. The logo is the exception: one fixed
file whose header/footer role never depends on layout, so collect it now, the same turn as the legal
facts.

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
| Topics with no usable photo | 3 of 7 services — those sections must work type-only, or take stock at stage 8 |
| Mandatory text | licence number and disclaimer must appear on every page |
| Uneven lists | product range is 9 items, accreditations are 2 |
| Supplied photographs that are stock | 10 images arrived, all Unsplash — none of the client, the place or the people |
| What the client may not legally say | regulated profession: no outcome claims, no testimonials |

This table is the input to stage 7's content-extreme pass — without it that pass invents its own
extremes and tests the layout against content the client will never have.

**Photographs that arrived with the brief are not automatically assets.** A folder of stock the
client already chose looks like a solved problem and often is not — it validates, it looks plausible,
and nothing downstream ever questions it. Open every one and say what is actually in the frame, not
what the filename claims. Three failure kinds, all seen on real briefs: a **recognisable place**
standing in for the client's own (a famous library captioned as their office); **third-party
branding** in shot, which is stage 8's check arriving five stages early; and an object that is simply
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
constraint you found, and you have said out loud whether the total supports the scope asked for at
intake.

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

Put it at `theme.direction`, top level — `references/proposing-themes.md` has the shape. At stage 7
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

### 5. First pages — three of them, then stop
Write **three pages fully: the home page, and the two that carry the most structured content** — the
spec table, the price comparison, the nine-item catalogue, the form. Then stop.

Three, not one: a home page is a hero, a proof strip and a call to action, and almost any set of
tokens survives it. The system only proves itself on the dense pages — which is why studios design
the key screen and the hardest screen in the same sitting, and why layout defects concentrate on
dense sections nothing has exercised yet. Two dense pages rather than one also catches the defect a single page cannot show: a slug that
was quietly tuned to suit *that* page and breaks on the next one using it.

**If the sitemap has three pages or fewer, this stage is the whole site** — say so, take the
corrections, and stage 6 has nothing to do. Four or five pages: still write three. The point is to
spend the correction round on the pages carrying the most structure, not to get closest to
finishing.

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

These three settle every question that generalises: tone of voice, how much detail a section
carries, what terminology the client uses for their own products, what claims are off-limits. The
home page in particular exercises most of the range — hero, proof, capability, story, call to
action — so a correction there lands on most of what follows.

**Publish here, before the corrections.** You have real pages and you took the domain at intake, so
`bundle_publish` now and hand over the upload link — this is the moment the site gains any route at
all for a photograph, and every later stage assumes the link is already in their hands. It creates a
draft, never a live site, and re-publishing keeps both the link and anything already uploaded. Tell
them plainly: "that page lists the photos the site is asking for, by name — rename yours to match
and drop them in whenever you like. They'll appear as they land, and nothing is public until we say
so."

The page derives that checklist from the `src` values already in the bundle, so it works from here
on. Stage 8 is where you turn it into a brief they can act on — what each picture has to *show* —
but a client who wants to start now is not blocked.

▸ Take the corrections before writing anything else. Collected after the whole site exists, they mean
rewriting the whole site; collected here, they cost three pages at most — and usually none, because
a correction to tone or density is applied to stage 6's pages as they are written.


**Done when** three pages carry real copy and every section on them is either off thin or on the
exempt list — counted, not estimated.

### 6. Remaining pages
Apply stage 5's corrections to every remaining page. If stage 5 covered the whole site, say that and
move to stage 7 rather than inventing a page to fill this stage. If a correction contradicts something in
the approved sitemap, raise it rather than quietly resolving it — the human knows which one they meant.

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

### 7. Design QA — the pass that is not "does it validate"
**REQUIRED SUB-SKILL:** use `check-webpage`. It owns the nine checks, the script that computes
contrast and theme coverage, and the report format.

**If that skill is not available**, you are running this one on its own — `package-plugin.sh`
builds a standalone `.skill` per skill, and a single-skill upload carries no sibling. Say so
rather than improvising the pass: name what is not being done and, if the human wants it,
point them at installing the full `website-create` plugin.

Two things carry over from here that it cannot know: stage 2's content-extremes table is the input
to its check 2, and `theme.direction` from stage 3 is what its check 5 audits the tokens against. A
theme with no `direction` block fails that check for want of anything to compare to — write it at
stage 3, not here.

Report to the client as two lists in their language — **what you fixed**, and **what is their
call** — never as nine rows of ratios they cannot verify.

**Done when** `check-webpage` reports all nine rows with a Who and a Result, and its browser-only
questions have been put to the human.

### 8. Assets and facts — name every picture the site needs
The layout now exists, so you know exactly which images it wants and what each one has to be. Turn
that into a list and hand it over — a human asked "send me some photos" sends whatever is on their
phone; a human asked for "your workshop, wide, showing the bays in use" sends that.

**Produce the picture list first**, one row per image slot the bundle references. **The filename
column is the point** — the upload page matches dropped files by name against the `src` in your
props, so a row without the exact filename is a row the human cannot deliver:

| Save it as | Where it goes | What it has to show | Shape |
|---|---|---|---|
| `hero-workshop.jpg` | top of the home page | the workshop with bays in use, room at the top for the headline | wide |
| `cfm-backrest.jpg` | products, third card | the backrest alone on a plain ground | square |
| `founder-portrait.jpg` | about page | the founder, waist-up | portrait |

**`alt` is written twice, and the validator polices neither.** At stage 5 you have no pixels, so
write the alt the picture list *specifies* — "the cold store, down an aisle, racking either side" —
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
permanently blank with no error anywhere. So `hero-workshop.jpg` in the table below means
`"src": "/img/john/hero-workshop.jpg"` in the props.

Name each file for what it shows before you hand the list over; `image-1.jpg` leaves them no way to
tell which is which.

**Hand over the list with this, adapted.** Everything in it is something clients hit and are
surprised by, so it belongs in the words they read rather than in a note to yourself to mention it:

> **Your photo page:** <upload link>
>
> It lists every photo the site is waiting for, by name. Open it in a browser — your phone is fine,
> that's where the pictures are.
>
> - **Rename each photo to the name on the list, then drop it in.** That's how the page knows which
>   picture goes where. **Don't convert or resize anything** — send them straight off your phone in
>   whatever format they are, and the site sorts that out.
> - **Dropped the wrong one somewhere?** Delete it on that page, or just drop the right one in under
>   the same name. Nothing to start over.
> - You can close the page and come back — it remembers what's already in.
> - Nothing is public while you do this.
>
> When the last photo is in, a **"Publish the site"** button on that page comes alive. Pressing it
> is what puts the site live — it does not happen on its own.
>
> Worth knowing now: **once you publish, that page stops accepting photos.** If you want to swap one
> later, come back to me and I'll reopen it. The link isn't broken, it's finished.

Why each line is there: hosting decodes JPEG, PNG, WebP, AVIF, **HEIC**, TIFF and GIF and re-encodes
to the format the *name* says, so "convert it first" is work the server already does and an iPhone
photo goes up as it came off the phone. A wrong name is refused with the full list of names it
wanted, which reads as an error rather than as guidance. And after publishing, uploads answer "this
site is published; re-publish from the conversation to change it" — a client who was not told that
concludes the link died.

Three limits, if they come up: **40 MB** a file, **2400px** on the longest edge (everything is
resized down on arrival, so a print-resolution original is not what gets served), and **no SVG** —
a logo needs PNG or WebP. Photo metadata is dropped in re-encoding, which matters to anyone who
assumes their copyright EXIF travels with the file.

Ask for their own photographs first — they almost always have more than they think, and a real
picture of the actual place beats anything you can source. Rows that come back empty are the gap
list, and only the gap list goes to stock.

**`bundle_status(domain)` is the loop's exit condition** — it is keyed by the domain, not the draftId. It reports exactly which expected files are still
missing, so work it until it is empty rather than asking "did you upload them?" — the human often
believes they did, and a file that landed under the wrong name is invisible to both of you.

**Then work the `unverified` checklist**: every marked section is confirmed, corrected, or removed.
Until it is empty the build farm refuses to publish. Verify every number and claim while you are
there — a wrong specification on a manufacturer's site is a commercial problem, not a formatting
one, which is why this part stays the human's.

Check every image for **third-party branding** — a competitor's logo on a worker's jacket is a real
problem no validator catches.


**Done when** `bundle_status` reports no missing files, every remaining slot is deliberately
type-only, and the `unverified` list is empty.

#### Filling the gaps with stock

**REQUIRED SUB-SKILL:** use `sourcing-stock-photos` for anything on the gap list. It carries the
search procedure, the licence terms and the reject list.

**If that skill is not available**, you are running this one on its own — `package-plugin.sh`
builds a standalone `.skill` per skill, and a single-skill upload carries no sibling. Say so
rather than improvising the pass: name what is not being done and, if the human wants it,
point them at installing the full `website-create` plugin.

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

### 9. Hand off
Validate, preview one last time, then `bundle_publish` — the domain, the bundle, and `org.json`,
which is required because the entity graph is built from it alone and a site without one is refused
here rather than at upload. If you already sent the upload link at stage 5 or 8, this call
re-publishes the finished JSON to the *same* link; say so, rather than handing over what looks like
a second, different one.

**If publishing fails, say so and stop there.** Hosting being down is not something to work around:
the upload link is the only route a photograph has into the site, so there is no partial version of
this stage. Tell them plainly — "the hosting service isn't reachable right now, so I can't generate
your upload link; let's try again shortly" — and keep the draft. Nothing is lost: the bundle is
still held, and re-running `bundle_publish` later picks up exactly here. What you must not do is
improvise a substitute route for the pictures or describe the site as finished.

**The upload wording lives at stage 8** — hand over that script, not a shorter improvised version.
If they have already had it, do not re-explain: say the link is the same one and their uploads are
still there.

**When it goes live, give them the real address and name the last step.** The site publishes to a
`.pages.dev` address built from their domain, with every dot turned into a hyphen — so `john.com.my`
is live at `john-com-my.pages.dev`. That is a complete, working, shareable site. Their own web
address is pointed at it separately, by whoever manages that domain:

> Your site is live: **john-com-my.pages.dev** — that address works right now, you can send it to
> anyone.
>
> If you'd rather people reached it at **john.com.my**, that's one step outside this: whoever looks
> after your domain needs to point it at the site. Send them the address above and they'll know what
> to do. Same site, same pages — just your own name in front of it.

Do not describe the custom address as broken or pending while that handover has not happened. The
site is finished; the name is somebody else's job.

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
| `references/composing-sections.md` | stage 5 — `FreeSection` and the six typed sections |
| `references/density.md` | stage 5 — hitting density, and marking `unverified` |
| `references/house-rules.md` | stages 5–6 — validation gates and known pitfalls |
| `references/live-preview.md` | stages 5–9 — draft/patch ops, uploading pictures early |
| `references/after-handoff.md` | stage 9 — what the platform derives, honestly |
| `references/local-path.md` | only in a checkout — servers, folder layout, QA scripts |

Stage 7 lives in a skill of its own — `check-webpage` — because a finished site gets checked more
often than it gets built, and `edit-webpage` needs the same pass after a token change.
