---
name: create-webpage
description: Use when someone wants a website, landing page, or set of marketing pages built, generated, scaffolded, redesigned or re-themed for a company or client; when they share a client brief, company documents or brand colours and ask for a site; or when they ask to change a site's whole look or art direction. Use it even if they only say "build me a site for X". For a scoped change to a site that already exists — one page, one section, one token — use edit-webpage instead.
---

# Create a webpage

You are generating a website as **data**, not code. A site is two JSON artifacts validated against a fixed component catalog:

- **`site.json`** — pages, and for each page an ordered list of sections: `{type, variant, props}`
- **`theme.json`** — 39 core design tokens, 8 optional structural ones, plus a map of variant slugs → `{layout, tone, vars?}`

A build step renders those into static HTML. You never write HTML, CSS, or components. This is what keeps every generated site patchable later: when the platform ships new SEO/AEO schema or fixes a component, every site inherits it on rebuild — but only because no site contains bespoke markup.

## Why the split matters

Two failure modes kill generated sites. Both come from confusing these layers:

| Layer | Who decides | Failure if you get it wrong |
|---|---|---|
| **Structure** — which blocks, what order, what copy | fixed catalog | free-form markup → unmaintainable, unpatchable |
| **Art direction** — tokens, which layout & tone each slug resolves to | generated per client | reused defaults → every site looks like the same template |

So: keep the *vocabulary* rigid — the block catalog is fixed, and you never write markup — but make both the **composition** and the **art direction** genuinely different each time. Reusing the catalog is the point; reusing an ordering of it is the failure. A site that looks templated is usually a site where the page structure was the model's default, wearing a new palette.

## Get the catalog from the platform, not from memory

**Call `catalog_list` first, every time. If it fails, stop and say so — do not generate.**

Blocks ship weekly, so anything written into this skill is a snapshot that will eventually be wrong.
Generating against a stale catalog does not fail loudly: it produces a bundle you believe is valid,
that the client approves, and that is rejected at upload after all the work is done. When the MCP is
unreachable the correct output is one sentence — "the block catalog is not reachable, so I can't
generate against it; the server may be down" — and nothing else. Not a bundle from memory, and not
one from `references/catalog.md`, which is documentation for people.

Then call `catalog_get` for only the blocks you intend to use — pulling all of them wastes the
context you need for composition.

### The chat path is the default; a checkout is the exception

| | chat (default) | in a checkout |
|---|---|---|
| Validate | `bundle_validate` | `npm run validate -- <client>` |
| Preview | `site_preview` — renders in the conversation | `npm run dev`, port 5183 |
| Publish | `bundle_publish` — returns a link for the pictures | `./package.sh <client>`, upload the zip |

Both validators are the same module the build farm imports, so a bundle that passes on either cannot
fail at upload for schema reasons. Neither is a friendlier second opinion; wanting one is a bug.
Validate before previewing. Publish the SOURCE bundle, never a build — shipping HTML freezes the
site and it can never be re-themed or patched.

Everything that only exists in a checkout — the servers, the folder layout, the QA scripts — is in
`references/local-path.md`. The rest of this file assumes chat.

**Hold a draft and patch it.** `bundle_put(site, theme, org)` once real JSON exists returns a
`draftId`; every edit after is `bundle_patch(draftId, ops)` — ~100 bytes instead of resending 25 KB —
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
Work that survives a checkpoint is never regenerated.

```
1  intake             (human)  drop the documents first, you read them, then ask what's left
                              — including the brand colour, which stage 3 is built from
2  content inventory  (you)    what copy exists and what it breaks — prep, no gate
3  theme              (you)    3 proposed, shown as style tiles
4  sitemap            (you)    pages + section roles, sampled, plus a skeleton of the home page
                                                                   ▸ human decides or revises  (3 + 4)
5  first pages        (you)    home + the two densest, real copy    ▸ human decides or revises
6  remaining pages    (you)    applying the corrections
7  design QA          (you)    breakpoints, states, contrast        ▸ human sees the list
8  assets & facts     (both)   real photos, verified numbers — you source stock for the gaps
9  hand off           (you)    validate, publish, hand over the upload link
```

Everything after the upload — SEO/AEO/GEO artifacts, hosting, scheduled refresh — happens on the
platform. See "After you hand off".

**Stages 3 and 4 share one checkpoint.** Show the style tiles and the sitemap together and ask once:
they are the two halves of the same question — what this site is and what it looks like — and
splitting them costs a round trip for nothing.

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
it.

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
  change. Say which page you are showing.
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

The facts go into `content/<client>/org.json`. They never appear in marketing copy, cannot be
inferred, and must not be invented — a fabricated registration number is worse than a missing one,
so cite where each extracted value came from and let the human correct it in one pass.

**Both wordings — the "send me your files" opener and the follow-up gap list — are in
`references/intake.md`, along with the `org.json` schema and the Malaysia registration-number rule.
Use them verbatim.** Left to invent the wording, one model produces a tidy form and another files
asset questions under a heading like "Platform details", and the difference lands on the client.
The human-facing text carries **no schema jargon** — not `sameAs`, not `areaServed`, not a statute
number. Ask for "links to your company anywhere else online"; do the mapping to field names
yourself.

The blockers are: registration number, legal name, phone/email, and the **logo file** (raster —
WebP/JPEG/PNG/AVIF; flag now if it's only available as SVG, see `references/live-preview.md`).
Everything else either shapes the site (buyer, goal, scope, sections, tone) or strengthens
it (`sameAs`, certifications, named people) without blocking the build — `references/intake.md` has
the full breakdown and why each item is where it is.

**Deliberately not asked: "how many directions do you want to see".** Stage 3 always samples four
and discards the likeliest, stage 4 samples the tail of home-page orderings — that sampling is what
keeps sites from converging on the training-data default, and letting the human dial it down to one
undoes the reason it exists.

**Section photography is not an intake question; the logo is.** Bulk photos wait for stage 8, after
the layout exists and you know which images it actually needs. The logo is the exception: one fixed
file whose header/footer role never depends on layout, so collect it now, the same turn as the legal
facts.

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

Content precedes design, because design in the absence of content is decoration — and this is the
cheapest fix for the failure this pipeline actually has, where a 380-word brief silently becomes a
nine-section site of forty-word sections and nobody sees it until the whole thing is written.

Total the "words available" column. **Under ~1,200 words of real source material you cannot fill more
than a home page and two subpages at honest density.** Say that now. The human either supplies more,
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

This table is the input to stage 7's content-extreme pass — without it that pass invents its own
extremes and tests the layout against content the client will never have.

Anything missing here is a question for stage 4's checkpoint, not a stop of its own — carry the
gap list forward and ask once.

### 3. Theme — the look on one sheet, not a fake page
Now, and not before, choose the visual direction. The first direction a model proposes is the mode of
its training data, which is why generated sites look alike.

**Propose three, each from a different objective** — Measured (processing fluency), Fit
(prototypicality for the category), Spark (novelty inside the same measured floor). Candidates drawn
from objectives that pull apart cannot collapse into three names for one look, which is what
sampling-and-discarding kept producing. Resolve Fit first, present Measured first, give each a
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

Iterate on tokens only; content does not exist yet, so nothing is wasted.

**Write the pick down as three adjectives and treat them as binding.** They are what every later
decision gets tested against — "precise" and a 28px radius contradict each other, and the
contradiction is only visible if the word was written down. Pick adjectives a competitor could not also claim, and make one of the three slightly
uncomfortable — the discomfort is what stops the set collapsing into the words every site uses.
Record what you rejected.

```json
"direction": {
  "adjectives": ["quiet", "precise", "expensive"],
  "rejected": ["warm editorial — the register undersells a specification-led buyer"],
  "why": "they sell on tolerance figures; restraint reads as confidence in the numbers"
}
```

Put it at the top level of `theme.json`. At stage 7 it is what you audit the tokens against —
including for the next agent, who otherwise re-derives the direction from the values and gets it
wrong.
### 4. Sitemap — sample the architecture, then roles, still no copy
A **section role** is the job a section does — proof, range, story, spec, process — not a block type
and not a theme slug. A page is an ordered list of roles, and that shorthand is for your notes:

> **Products** — hero (subpage) · catalogue grid · spec table · media+text · CTA
>
> *shown to the human as:* opening banner · every chair laid out in a grid · the full specifications
> table · one model in detail with text beside it · "request a quote" at the bottom

**First, name the category default — then refuse it.** `fleet_siblings` tells you whether this site
resembles *ours*. It cannot see that every competitor in the client's own category is built the same
way and that you are about to land on it too. So list what the client's three closest competitors all
share:

> *Every ergonomic-chair site opens with a hero photo of one chair on white, then a three-up
> "Comfort / Support / Design" trio, then a product grid.*

That shared structure is the **do-not list**, and it carries through stages 4–6. It is the most
reliable way to avoid a site that is distinct from our fleet and still indistinguishable from its own
market. It is also what you show the human when they ask why the page doesn't look like the
competitor they had in mind.

**Then sample the home-page architecture.** Write three orderings with self-assessed probabilities,
discard the likeliest, pick from the tail — otherwise every site opens `hero → stats → catalogue`,
because that is the mode. Vary, in descending order of effect: what comes first after the hero
(leading with the catalogue instead of stats is a different company); whether a role appears at all
(five strong sections beat nine even ones, and stage 2 tells you which five you can fill); where the
dark and accent bands fall; page count and split. Fewer sections with more content each is almost
always the better tail choice, and it is what the density gate rewards.

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

**The options list holds the tail candidates only.** Name the likeliest one below the options, as
reasoning — visible and unpickable. Presenting it *as an option* annotated "the category default,
avoid" puts the mode back on the table, and it gets chosen.

**Say which `catalogVersion` you built against** — one line, from `catalog_list`. A bundle built
against a stale catalog fails at build rather than at validation, and without this line nobody can
tell which happened.

### 5. First pages — three of them, then stop
Write **three pages fully: the home page, and the two that carry the most structured content** — the
spec table, the price comparison, the nine-item catalogue, the form. Then stop.

Three, not one: a home page is a hero, a proof strip and a call to action, and almost any set of
tokens survives it. The system only proves itself on the dense pages, which is why studios design
the key screen and the hardest screens in the same sitting — and why the audit's worst layout
defects (a notice box around 400px of nothing, cards with a radius and a border and no elevation, a
grid that stopped collapsing at two columns) all lived on dense sections that nothing had exercised
yet. Two dense pages rather than one also catches the defect a single page cannot show: a slug that
was quietly tuned to suit *that* page and breaks on the next one using it.

**If the sitemap has three pages or fewer, this stage is the whole site** — say so, take the
corrections, and stage 6 has nothing to do. Four or five pages: still write three. The point is to
spend the correction round on the pages carrying the most structure, not to get closest to
finishing.

Write it **at full density**: aim for **60+ words and 6+ content nodes per section**, **700+ words
per page**, and one image per two sections that can carry one. A section that fills a screen and
carries forty words is what makes a generated site read as an unfinished template rather than a
company's website, and it is the single most common failure here — more damaging than any colour or
layout choice. Hero, CTA, quote, nav and footer are exempt; so are blocks that cannot hold more
(`Stats`, `Locations`). The full guidance, and the primitives that get you there, are under
"Density" below — read it before writing, not after.

Headlines must carry a concrete noun from the brief that a competitor could not also claim. "Build
faster. Ship smarter." is a slop tell independent of any visual choice: if the headline would still
be true with the client's name swapped for a rival's, it is decoration, not copy.

These three settle every question that generalises: tone of voice, how much detail a section
carries, what terminology the client uses for their own products, what claims are off-limits. The
home page in particular exercises most of the range — hero, proof, capability, story, call to
action — so a correction there lands on most of what follows.

▸ Take the corrections before writing anything else. Collected after the whole site exists, they mean
rewriting the whole site; collected here, they cost three pages at most — and usually none, because
a correction to tone or density is applied to stage 6's pages as they are written.

### 6. Remaining pages
Apply stage 5's corrections to every remaining page. If stage 5 covered the whole site, say that and
move to stage 7 rather than inventing a page to fill this stage. If a correction contradicts something in
the approved sitemap, raise it rather than quietly resolving it — the human knows which one they meant.

When a page needs a look the theme has no slug for, **add the slug to `theme.json` and reuse it**, do
not invent a one-off. Adding a bespoke treatment per page as you go is the junior habit that produces
a theme with fourteen near-identical slugs and no system; the senior habit is to notice the second
occurrence and name the shared thing. Two slugs per block type is the ceiling.

### 7. Design QA — the pass that is not "does it validate"
Validation proves the JSON is legal. It does not prove the page works.

**Five checks you run from the bundle, no browser needed:** contrast (you hold the hex values —
compute relative luminance and the ratio; 4.5:1 body, 3:1 large), content extremes (find stage 2's
longest name and nine-item list in the JSON), slop tells (same radius everywhere? accent in the
indigo band? monospace only on labels?), the page read with images ignored, and the tokens audited
against `theme.direction`.

**Four that need eyes on a rendered page** — four widths, greyscale-and-squint, tap targets and
focus, nothing hidden at rest. In a checkout you run these yourself (`references/local-path.md`). On
chat you cannot: `site_preview` draws the page but you cannot resize it, screenshot it, tab through
it or run script in it. Once the draft is published the human has a real page in a real browser —
the only pair of eyes in the room. Ask them:

> Four things I can't check from here — could you open the site and look?
>
> 1. On your phone, scroll all the way down. Anything overlapping, cut off, or spilling sideways?
> 2. Same page on a laptop, then drag the window narrower. Anything collapse badly in between?
> 3. Press Tab a few times. Does something visibly light up as you go?
> 4. Scroll down slowly. Any section that stays blank instead of appearing?

`references/design-qa.md` has all nine in full, the report table with its **Who** column, and why
`NOT RUN` is an honest row where a tick is not. Report to the client as two lists in their language —
**what you fixed**, and **what is their call** — never as nine rows of ratios they cannot verify.
### 8. Assets and facts — name every picture the site needs
The layout now exists, so you know exactly which images it wants and what each one has to be. Turn
that into a list and hand it over — a human asked "send me some photos" sends whatever is on their
phone; a human asked for "your workshop, wide, showing the bays in use" sends that.

**Produce the picture list first**, one row per image slot the bundle references:

| Where | What it has to show | Shape | They have it? |
|---|---|---|---|
| Home hero | the workshop with bays in use, room at the top for the headline | wide, `environment` | ask |
| Products, card 3 | the CFM backrest alone on a plain ground | square, `cutout` | ask |
| About, portrait | the founder, waist-up | portrait, `detail` | ask |

Ask for their own photographs against that list — they almost always have more than they think, and
a real picture of the actual place beats anything you can source. What comes back with nothing
against it is the gap list, and only that gap list goes to stock.

**Then work the `unverified` checklist**: every marked section is confirmed, corrected, or removed.
Until it is empty the build farm refuses to publish. Verify every number and claim while you are
there — a wrong specification on a manufacturer's site is a commercial problem, not a formatting
one, which is why this part stays the human's.

Check every image for **third-party branding** — a competitor's logo on a worker's jacket is a real
problem no validator catches.

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
  files there. Nothing requires `.webp`; optimisation is the build farm's job.
- **`alt` and `imageKind` come from the pixels**, once there is a file to look at. Where the
  download cannot happen, leave both empty and say why — a guessed `imageKind` defeats the one check
  the validator performs with it.

### 9. Hand off
Validate, preview one last time, then `bundle_publish` — the domain, the bundle, and `org.json`,
which is required because the entity graph is built from it alone and a site without one is refused
here rather than at upload. If you already sent the upload link at stage 5 or 8, this call
re-publishes the finished JSON to the *same* link; say so, rather than handing over what looks like
a second, different one.

**Explain the link to someone who has never uploaded a file to a website before:**

> Here's your link: <url>
>
> Open it in a browser. It lists every photo the site needs, with the name it expects — drag your
> files onto it and each one drops into place. You can close the page and come back; it remembers.
> When the last one's in, the site goes live on its own. Nothing is public until then.

Not "the bundle awaits asset resolution". Say plainly why the photos go through a browser and not
the chat — a transcript re-sends every picture on every later turn, so one site's photography would
cost more than the site. That is not an apology for a missing feature; it is why this works for
someone with no development machine at all.

**The names in your props are the names the human will be asked for.** A `src` of
`/img/acme/hero-workshop.webp` asks them for `hero-workshop.webp`, so name images for what they
show — `image-1.webp` leaves the person matching them up with no way to know which is which.

`bundle_status` reports what is still missing; `bundle_discard` withdraws a draft, which is how a
mistyped domain is fixed. Once a site is live it can only be changed by publishing again.

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
  resolve differently. About two slugs per block type.
- **Content must suit the layout.** `overlay-fullbleed` puts text on the photo, so it requires
  `imageKind: "environment"`.

These come from real breakages; `references/house-rules.md` has the full list and the reasoning.

## Reference files
Read these when the stage that needs them arrives — not upfront.

| File | Read it at |
|---|---|
| `references/intake.md` | stage 1 — the `org.json` schema and the verbatim question list |
| `references/proposing-themes.md` | stage 3 — the three-proposal protocol, served fonts, the style tile |
| `references/palette.md` | stage 3 — the eleven colour tokens, hue unity, accent budget |
| `references/art-direction.md` | stages 3–4 — tokens, what drives distinctiveness, slop tells |
| `references/catalog.md` | stages 4–6 — every block, variant, prop, and the primitives |
| `references/composing-sections.md` | stage 5 — `FreeSection` and the six typed sections |
| `references/density.md` | stage 5 — hitting density, and marking `unverified` |
| `references/house-rules.md` | stages 5–6 — validation gates and known pitfalls |
| `references/design-qa.md` | stage 7 — the nine checks and the report table |
| `references/live-preview.md` | stages 5–9 — draft/patch ops, uploading pictures early |
| `references/after-handoff.md` | stage 9 — what the platform derives, honestly |
| `references/local-path.md` | only in a checkout — servers, folder layout, QA scripts |
