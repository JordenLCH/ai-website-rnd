---
name: create-webpage
description: Generate a complete, maintainable marketing website from a client brief — as validated JSON (content + design tokens), never hand-written HTML. Use this whenever the user wants to build, generate, scaffold, redesign, or re-theme a website, landing page, or set of marketing pages for a company or client; when they mention a client brief, brand colours, or a site they need built; when they ask to change a site's look, art direction, or theme; or when they want to add or reorder sections on a generated site. Use it even if they just say "build me a site for X" without mentioning JSON, blocks, or themes — this skill is how sites get built here.
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

Blocks ship weekly, so anything written down in this skill is a snapshot that will eventually be
wrong. Generating against a stale catalog does not fail loudly: it produces a bundle you believe is
valid, that the client approves, and that is rejected at upload after all the work is done. Every
hour saved by carrying on without the catalog is repaid with interest at the moment of publishing.

So when the MCP is unreachable, the correct output is a sentence — "the block catalog is not
reachable, so I can't generate against it; the server may be down" — and nothing else. Not a bundle
built from memory, and not one built from this skill's `references/catalog.md`, which is
documentation for people and not a source to generate from.

Then call `catalog_get` for just the blocks you intend to use — pulling all of them wastes the
context you need for composition. Say in your handoff which `catalogVersion` you built against —
there is no field for it in `site.json`, so it belongs in your written summary, not in the JSON.

### Two ways to run this, and how to tell which you are in

**Look at what you have before you plan the work.** If you can run shell commands in a checkout of
the starter, you are on the local path. If you are in a chat with the connector and no filesystem —
no repo, no npm — you are on the chat path, and every instruction below that starts with `npm` does
not apply to you.

| | you can run commands | chat only |
|---|---|---|
| Validate | `npm run validate -- <client>` | `bundle_validate` — pass the bundle, same module |
| Preview | `npm run dev`, port 5183 | `site_preview` — renders in the conversation |
| Package | `./package.sh <client>` | export the JSON and the asset archive from the chat |

Both validators are the same module the build farm imports, so a bundle that passes on either path
cannot fail at upload for schema reasons. Neither is a friendlier second opinion, and if you ever
find yourself wanting one, that is the bug.

Validate before previewing: it costs a second and catches what a screenshot never will. Package the
SOURCE bundle, never a build — shipping HTML freezes the site, and it can then never be re-themed or
receive a fleet-wide patch.

**On the chat path, `site_preview` does not show photographs.** The preview has no filesystem, so
every image comes up blank. Layout, tone and type are truthful; photography is not. Say that when
you show it, or the person approves a design believing they have seen it finished — and the picture
is the part they will care most about.

### Where files go

```
content/<client>/site.json      the pages
content/<client>/theme.json     the tokens and slug mappings
content/<client>/org.json       the organisation facts
assets/<client>/<file>.webp     every image for that client
```

**An image at `assets/<client>/photo.webp` is referenced in JSON as `/img/<client>/photo.webp`.**
The preview serves `/img/` out of `assets/`. Put a client's images under their own folder — the
packager zips only that folder, so a flat `assets/` ships every other client's photographs inside
the bundle.

**On the chat path there is no `assets/` folder, so reference the path the person actually uploaded**
— whatever the archive calls it, verbatim, including its capitalisation
(`uploads/OPTIMISED/LOGO/logo.svg`). Do not invent a tidy path and do not rename anything: the upload
step resolves every reference against the real archive, and a path you improved is a broken image
nobody sees until the site is live.

You can *see* the photographs the person uploaded, and that is the point — it is the one moment
anything in this pipeline knows what a picture is actually of. So:

- write `alt` from the image, never from the filename. `08-rd-design.webp` being an open-plan office
  and not a design studio is invisible to every check and a lie to the person it is read aloud to
- set `imageKind` from what you can see — `environment` for a scene with depth, `cutout` for a
  product on a plain ground, `detail` for a close crop. The validator refuses a cutout under
  `overlay-fullbleed` because text on it is unreadable, and it can only refuse what you declared
- if the shape is wrong for the frame you had in mind, say so and pick another frame. A portrait
  photograph in a `wide` frame shows about a third of itself, and the build farm rejects anything
  cropped past half

`references/catalog.md` is human documentation, not a fallback: if the MCP is unreachable, stop
rather than generate from it (see above).

## Workflow — checkpoints, not one long generation

Generating a whole site and then asking "is this right?" is the expensive way to be wrong. Each stage
below produces something small enough to review in seconds, and you stop and wait at every ▸ mark.
Work that survives a checkpoint is never regenerated.

```
1  intake             (human)  documents, org facts, phone, socials, brand colour
2  content inventory  (you)    what copy exists and what it breaks — prep, no gate
3  theme              (you)    4 sampled, 3 shown as style tiles
4  sitemap            (you)    pages + section roles, sampled       ▸ human decides or revises  (3 + 4)
5  first pages        (you)    home + the densest page, real copy   ▸ human decides or revises
6  remaining pages    (you)    applying the corrections
7  design QA          (you)    breakpoints, states, contrast        ▸ human sees the list
8  assets & facts     (human)  real photos, verified numbers
9  hand off           (you)    validate, package, upload
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

**Between ▸ marks, do not stop.** A checkpoint every two paragraphs is as bad as none — it moves the
work onto the human. The nine stages are the checkpoints; there are no others.

### Showing work visually — never make a human imagine it

A look, a layout, a tone rhythm and a page structure are all things a human judges in two seconds by
eye and cannot judge at all from prose. **Prose is the wrong medium for stages 3, 4 and 7.** Three
routes, in order of preference:

1. **The real preview** (`npm run dev`, port 5183) — the only one that is actually the renderer, so
   what is on screen is what ships. Use it the moment real JSON exists: stage 4's tile, stage 5's
   home page, stage 7's QA pass. Say which page and which width you are showing.
2. **`npm run screens`** (port 5190) for choices that exist *before* any JSON does — the art
   directions, sitemap shapes, anything with options to compare. Write one HTML file into
   `.preview/screens/` and the server shows the newest. Write a **content fragment** — no `<html>`,
   no `<head>` — and it gets wrapped in the frame. `.preview/` is gitignored; nothing here ships.

   ```
   .preview/screens/art-direction.html   one file per screen, never reuse a name
   ```

   Label the options **A / B / C** plainly on the page. Images resolve from `assets/` at
   `/img/<client>/<file>` — use the client's real photography when the question is whether a
   direction suits it.
3. **A published page** (an Artifact, or whatever your harness offers) when the human is not at the
   same machine and the choice needs to survive the session.

**The screen shows; the terminal decides.** The page is display-only on purpose — no clicking, no
selection state, no event file. The human looks at the screen and answers in the terminal, where you
are already asking with `AskUserQuestion`. A second input channel in the browser would be one more
thing to build and maintain, and it still could not wake you between turns, so it buys nothing.

Both modes are `preview.mjs` in the starter — node builtins, no plugin, no install. A visual step
that depends on a plugin the creator has no other reason to have is a visual step that silently does
not happen.

`AskUserQuestion`'s option previews render **monospace markdown** — no colour, no type, no layout.
They are fine for a page list. They cannot show an art direction, and a direction shown that way is
being chosen on its *name*, which is the one thing about it that does not matter.

**Render the tokens, not a description of them.** A style tile written from the real token values —
even hand-written HTML that never ships — is faithful. A tile written from your idea of what "warm
editorial" looks like is a different design being approved under the same name.

### 1. Intake — collect, do not guess
Take the documents (PDF, brief, deck) and the brand colour, then collect the organisation facts into
`content/<client>/org.json`. These never appear in marketing copy, cannot be inferred, and must not
be invented — a fabricated registration number is worse than a missing one.

```jsonc
{ "name": "...", "legalName": "... Sdn Bhd", "url": "https://...",
  "description": "one sentence, what they actually do",
  "foundingDate": "1974", "registration": "...", "vatId": "...",
  "phone": "...", "email": "...",
  "address": { "street": "...", "locality": "...", "region": "...", "postalCode": "...", "country": "MY" },
  "sameAs": ["https://linkedin.com/company/...", "https://g.page/..."],
  "certifications": ["ISO 9001", "..."], "awards": ["..."],
  "areaServed": ["Malaysia", "Singapore"],
  "people": [{ "name": "...", "role": "...", "credential": "...", "sameAs": "..." }],
  "numberOfEmployees": "..." }
```

This file is the site's **E-E-A-T** carrier — the platform turns it into `Organization` /
`LocalBusiness` schema. Each field answers a question a search or answer engine asks about
trustworthiness:

- **Experience** — `foundingDate`, `numberOfEmployees`: how long, at what scale
- **Expertise** — `certifications`, `people[].credential`: qualifications granted by someone else
- **Authoritativeness** — `sameAs`: profiles the client does not control, so a crawler can corroborate
  the entity elsewhere. This is the highest-value field here and the one most often skipped
- **Trustworthiness** — `legalName`, `registration`, `address`, `phone`: a real accountable entity

Ask for anything missing. Omitting a field is fine; guessing at one is not — wrong registration
details are a legal problem, not a formatting one.

**Malaysia — the registration number is not optional.** If `address.country` is `MY` (or the legal
name carries `Sdn Bhd` / `Berhad` / `PLT`), s.30(2) Companies Act 2016 requires the **registered name
and company registration number on the company's website** — the subsection names websites
explicitly, alongside letters and invoices, and non-compliance carries up to RM50,000. Put both in
`chrome.footer`'s `legal.line`, never in a page's blocks: the footer is the only element that appears
on every page, and a compliance line on the home page is a line missing from the other four.

```jsonc
"legal": { "line": "Acme Precision Sdn. Bhd. (Registration No. 202001012345 (1234567-X)) · © 2026",
           "links": [{ "label": "Privacy", "page": "privacy" }] }
```

Use the number exactly as SSM issued it — the 12-digit form with the old `1234567-X` number in
brackets, if the client gave both. `validate` fails the bundle when the footer is missing either
half, so collect `registration` and `legalName` at intake or the site cannot ship.

#### Ask with this list, verbatim

Do not compose your own intake questions. Emit this, filling in what the documents already answer so
the human only sees what is genuinely missing. Left to invent the wording, one model produces a tidy
form and another produces headings like "Platform details" with asset questions filed under them —
same skill, different model, and the difference lands on the client.

Say plainly which items block the build, because they are not equally urgent and a flat list of
twelve questions reads as though they are.

```
ANSWERED FROM YOUR DOCUMENTS — correct me if any of this is wrong
  <field>: <value>            ← list every one you filled, so it can be checked
  ...

BLOCKS THE BUILD — I cannot produce a shippable site without these
  1. Registration number      (Malaysia: s.30(2), the footer gate fails without it)
  2. Legal name, exactly as registered
  3. Phone and email

SHAPES THE SITE — I will ask again before writing copy if these change
  4. Who buys from them       (the buyer decides whether pages split by product or by audience)
  5. What the site must make happen
                              (a quote request and a spec download are different sites)
  6. Any page that must exist for a reason I would not guess

STRENGTHENS THE SITE — omit any of these and the site still ships
  7. sameAs profiles          (LinkedIn, Google Business — the highest-value field here and
                               the most skipped: it is how a crawler corroborates the entity
                               somewhere the client does not control)
  8. Certifications, named exactly   ("ISO 9001", not "ISO standards")
  9. Employee count, awards, area served
 10. Named people with credentials
```

Three rules for running this list:

- **A vague answer is a missing answer.** "ISO standards" is not a certification; ask which one.
  Writing `ISO 9001` because it is the common one is inventing a credential.
- **Never fill a blocker to keep moving.** A wrong registration number is a legal problem, not a
  formatting one. Stop and ask, or ship with the field absent and say so.
- **Assets and branding are not intake questions.** Photos, logo and guidelines arrive at stage 8,
  after the layout exists and you know which images it actually needs. Asking for them now gets you
  a folder of whatever the client had to hand.

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

This is the oldest step in the trade — content precedes design, because design in the absence of
content is decoration. It is also the cheapest possible fix for the failure this pipeline actually
has: a 380-word brief silently becomes a nine-section site of forty-word sections, and nobody sees
the problem until the whole thing is written.

Total the "words available" column. **Under ~1,200 words of real source material you cannot fill more
than a home page and two subpages at honest density.** Say that now. The human either supplies more,
accepts fewer pages, or accepts that some sections will be written by you and shipped `unverified`.
All three are fine; discovering it at stage 6 is not.

**Then write down what the content will break.** A studio reads the client's copy before drawing
anything, and what it records is not the total — it is the extremes the layout has to survive:

| Constraint | Example from this brief |
|---|---|
| Longest product/service name | "Constant Force Mechanism (CFM) backrest" — 39 chars, will wrap in a card title |
| Longest / shortest headline | 9 words vs 3 — one type size cannot flatter both |
| Topics with no usable photo | 3 of 7 services — those sections must work type-only |
| Mandatory text | licence number and disclaimer must appear on every page |
| Uneven lists | product range is 9 items, accreditations are 2 |

This table is the input to stage 7's content-extreme pass — without it that pass invents its own
extremes and tests the layout against content the client will never have.

Anything missing here is a question for stage 4's checkpoint, not a stop of its own — carry the
gap list forward and ask once.

### 3. Theme — the look on one sheet, not a fake page
Now, and not before, choose the visual direction. The first direction a model proposes is the mode of
its training data, which is why generated sites look alike. Generate four candidates with a
self-assessed probability for each, discard the likeliest, and present **three**.

Present each in about two lines — the register, the type pairing and its *scale ratio*, the density
dial, the tone rhythm, one sentence on why it suits this client and this sitemap. **Do not write
theme JSON yet.** Three full themes is roughly ten times the tokens of three descriptions, and two of
them are going in the bin.

> **A** Swiss catalogue — Archivo 800, 1.25 scale, tight density, hairlines, zero radius, bone/ink, accent as a marker
> **B** Warm editorial — Fraunces 300, 1.414 scale, loose density, soft shadows, cream ground
> **C** Precision lab — condensed caps, 1.2 scale, tight density, white ground, thin rules, blue accent on data only
>
> Recommend **A**: they sell on specification, and the catalogue register signals that before a word is read.

**Only these families are served. A theme naming any other renders as system-ui, silently:**

```
Archivo · Archivo Narrow · Barlow Condensed · Chivo · DM Mono · Familjen Grotesk
Fraunces · IBM Plex Mono · IBM Plex Sans · Inter · JetBrains Mono · Karla
Public Sans · Space Grotesk
```

There is no error and no validator message — the page just renders in the system font and looks
unstyled for reasons nobody can see. So the tile must use the **same family string** you will put in
`--font-display` and `--font-body`. `npm run screens` loads all fourteen for you, in fragments and
full documents alike — do not add your own font link, and do not assume a family renders just because
you named it correctly. A tile drawn in Georgia while the prose promises Fraunces is a
different design being approved under the wrong name, and the substitution surfaces two stages later
as "the theme looks nothing like the tile".

Name the typeface decision *against its alternatives*. "Inter" is not a bad font; **Inter unchosen is
the tell** — it signals nobody made a typography decision. The same is now true of monospace for
small labels and numerals: it reads as structured and technical, which is exactly why every generator
reaches for it, and it is on track to be as telling as an indigo gradient. Use it if you can say what
it does here that a small-caps sans would not.

**Build the tile, not a page.** A style tile is what a studio shows at this point — deliberately
*not* a mocked page with lorem in it, because a human shown a fake page judges the fake copy and the
invented layout instead of the type and colour you actually want a decision on.

**All six elements, in every tile. A tile missing one is not a shorter tile, it is a tile that cannot
answer the question it was drawn for:**

```
1  type scale      every step you will actually use — display, heading, lede, body, eyebrow
2  tone bands      all four: default · surface · inverse · accent, each labelled, each
                   showing its own text colour on its own ground
3  a button        the real --btn-radius, --btn-pad and --btn-weight, not a browser default
4  a rule          the real --border and --color-line, at the weight the theme uses
5  a caption       smallest text, in --color-muted, on the default ground
6  a table row     a label and a value, because specification content is where type breaks
```

**The tone bands are the ones that get dropped, and they are the ones that matter most.** Which
sections go inverse or accent carries more brand identity than the colour values do, so three tiles
without tone bands read as three fonts on one background — and the human, correctly, says they all
look the same. If you draw only one element, draw those.

Use the client's real words for the sample strings — a product name, a real figure. Not lorem, and
not "The quick brown fox": the tile has to survive the words it will actually hold.

Iterate on tokens only. Content does not exist yet, so nothing is wasted.

**Write the pick down as three adjectives, and treat them as binding.** A studio names the direction
before it sets values, because the adjectives are what every later decision gets tested against —
"precise" and a 28px radius contradict each other, and the contradiction is only visible if the word
was written down. Avoid *modern*, *clean* and *professional*: they describe every site ever made.
Make one adjective slightly uncomfortable, and record what you rejected.

```json
"direction": {
  "adjectives": ["quiet", "precise", "expensive"],
  "rejected": ["warm editorial — the register undersells a specification-led buyer"],
  "why": "they sell on tolerance figures; restraint reads as confidence in the numbers"
}
```

Put it at the top level of `theme.json`. It costs nothing, it survives the session, and at stage 7
it is the thing you audit the tokens against — including for the next agent, who otherwise re-derives
the direction from the values and gets it wrong.

### 4. Sitemap — sample the architecture, then roles, still no copy
A **section role** is the job a section does on the page — proof, range, story, spec, process —
not a block type and not a theme slug. A page is an ordered list of roles:

> **Products** — hero (subpage) · catalogue grid · spec table · media+text · CTA

**First, name the category default — then refuse it.** `fleet_siblings` tells you whether this site
resembles *ours*. It cannot see that every competitor in the client's own category is built the same
way, and that you are about to land on it too. So before sampling, list what the client's three
closest competitors (named in the brief, or the obvious ones in that trade) all share:

> *Every ergonomic-chair site opens with a hero photo of one chair on white, then a three-up
> "Comfort / Support / Design" trio, then a product grid.*

That shared structure is the **do-not list**, and it carries through stages 4–6. This is the single
most reliable way to avoid a site that is technically distinct from our fleet and still
indistinguishable from its own market. State the list explicitly; it is also what you show the human
when they ask why the page does not look like the competitor they had in mind.

**Then sample the home-page architecture the way stage 3 samples art direction.** Write three orderings
with self-assessed probabilities, discard the likeliest, and pick from the tail. Without this every
site opens `hero → stats → catalogue`, because that is the mode.

Things to vary, in descending order of how much they change the page:

1. **What comes first after the hero** — proof figures, the range itself, a single story, or a
   spec table. Leading with the catalogue instead of stats is a different company.
2. **Whether a role appears at all.** A site with no FAQ and no gallery is not an incomplete site.
   Five strong sections beat nine even ones — and the inventory from stage 2 tells you which five
   you can actually fill.
3. **Where the dark and accent bands fall**, which the tone rhythm rule already checks.
4. **Page count and page split.** Four pages that each answer one question beat six that overlap.

Fewer sections, more content per section, is almost always the better tail choice — it is also what
the density gate rewards.

Give each role a rough word budget drawn from the stage-2 inventory. A role with no source and no
budget should not be in the sitemap.

**The output is a page list, not only a home-page ordering.** Sampling the home page is step one of
two; a run that shows three orderings of the same page and calls it a sitemap has not proposed an
architecture, and the human cannot add or remove a page they were never shown. Show, for every
option: the pages, and for each page its ordered roles.

```
B — Buyer-led · 3 pages
   Home           hero · range · proof · terms · CTA
   Chairs         hero · catalogue grid · spec · comparison
   Buying from us hero · warranty · customisation · delivery
```

A wrong sitemap caught here costs one message. Caught after copy exists it costs a rewrite.
▸ **The checkpoint for stages 2, 3 and 4 together.** One screen: the gap list, the style tiles,
the sampled sitemaps. Then ask for the theme pick and the sitemap pick in one `AskUserQuestion`.

**Discarded means not offered.** The likeliest candidate comes off the list — it is not presented as
an option annotated "the category default, avoid". Offering something while advising against it puts
the mode back on the table and invites the human to choose it, which is the outcome the sampling
exists to prevent. Name what you discarded and why, below the options, so the reasoning is visible
and unpickable.

**Say which `catalogVersion` you built against** — one line, from `catalog_list`. There is no other
acceptable source: a bundle built against a stale catalog fails at build rather than
at validation, and without this line nobody can tell which happened.

### 5. First pages — home plus the densest page, then stop
Write the home page fully, **and the one page in the sitemap that carries the most structured
content** — the spec table, the price comparison, the nine-item catalogue, the form. Then stop.

The second page is not extra work, it is the test that matters. A home page is a hero, a proof strip
and a call to action: almost any set of tokens survives it. The system only proves itself on the
dense page, which is why studios design the key screen and the hardest screen in the same sitting —
and why the audit's worst layout defects (a notice box around 400px of nothing, cards with a radius
and a border and no elevation, a grid that stopped collapsing at two columns) all lived on dense
sections that nothing had exercised yet.

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

One page is enough to settle every question that generalises: tone of voice, how much detail a
section carries, what terminology the client uses for their own products, what claims are off-limits.
The home page in particular exercises most of the range — hero, proof, capability, story, call to
action — so a correction there lands on most of what follows.

▸ Take the corrections before writing anything else. Collected after the whole site exists, they mean
rewriting the whole site; collected here, they cost one page.

### 6. Remaining pages
Apply the home page's corrections to every remaining page. If a correction contradicts something in
the approved sitemap, raise it rather than quietly resolving it — the human knows which one they meant.

When a page needs a look the theme has no slug for, **add the slug to `theme.json` and reuse it**, do
not invent a one-off. Adding a bespoke treatment per page as you go is the junior habit that produces
a theme with fourteen near-identical slugs and no system; the senior habit is to notice the second
occurrence and name the shared thing. Two slugs per block type is the ceiling.

### 7. Design QA — the pass that is not "does it validate"
Validation proves the JSON is legal. It does not prove the page works. Do this pass yourself before
handing anything over, and report what you found rather than quietly patching it.

Check, in this order:

1. **Four widths, not two** — 360, 768, 1280, 1600. Most breakage lives at 768 and at 360, and a
   site checked only at "narrow and wide" reliably ships a nav that wraps into itself. Blocks respond
   to their own container, so a section can break at a width the page does not.
2. **Content extremes, not average content** — the longest product name in the catalogue, the
   shortest, a list with one item and a list with nine, a card with no image. Real content is uneven;
   the layout that only works on the sample is the layout that fails on delivery.
3. **Contrast on every tone** — accent text on the dark band, on the accent band, on the light band.
   Body text at 4.5:1, large text at 3:1. Accent colours legible on light grounds routinely fail on
   dark ones, and nothing in the validator sees it.
4. **The slop tells** — is every surface on the same radius? Is the accent the only non-neutral
   colour and is it in the indigo/violet band? Is monospace used for labels and nowhere else? Any
   "yes" needs a reason, not a fix by reflex.
5. **Read the page with the images turned off.** If it stops making sense, the copy is leaning on
   photography that the client may replace with something else entirely.
6. **Greyscale, then squint.** Screenshot the page, strip the colour (`filter: grayscale(1)` on
   `.stage`), and check the hierarchy still reads. If it collapses, colour was carrying work that
   structure should do. Then zoom out to 25% and look for one focal point per screenful — if the
   whole page blurs into even grey, every section is competing at the same weight. Both tests take
   seconds, both work on a screenshot, and neither is visible to any JSON check.
7. **Tap targets and focus.** Tab through the page: every control needs a visible focus ring at 3:1
   against what it sits on, and no keyboard trap. Controls want 44–48px; WCAG 2.2's 24px is the
   legal floor, not the target. `block-audit.js` reports both.
8. **Nothing hidden at rest.** Any section that only becomes readable after a scroll reveal is one
   observer failure away from being blank. Animations start from a *visible* state; `block-audit.js`
   flags text sitting at `opacity: 0` or under a collapsing `clip-path`.
9. **Audit the tokens against `theme.direction`.** Take the three adjectives and name, for each, the
   token that carries it. If "precise" is carried by nothing — or contradicted by a 28px radius and a
   600ms ease — either the tokens or the adjective is wrong. This is the check that keeps a
   deliberately chosen direction from decaying into the default one value at a time.

#### How to actually run checks 1, 3, 7 and 8

`block-audit.js` and `design-qa.js` are **browser snippets, not node scripts** — each is an IIFE that
measures the live page and returns a report. There is no `npm run` for them because they need a
rendered DOM. They ship inside the installed package:

```
node_modules/@blackdash/renderer/tools/design-qa.js     overflow · tiny targets · collisions · contrast
node_modules/@blackdash/renderer/tools/block-audit.js   the above plus hidden-at-rest and focus rings
```

Start `npm run dev`, then evaluate the file's contents in the page — your browser tool's
"evaluate script" call, or paste into the devtools console. Both read `.stage`, so scroll that
element, not the window, and reset any `zoom` on it to `1` first or the intersection maths is wrong.

**Scroll the whole page in small steps before judging anything.** Reveal animations fire on
intersection; a page that was jump-scrolled reports sections as hidden that a human would have seen,
and that false positive has cost more than one debugging session.

#### Report it as a table, not prose

A prose summary of nine checks hides which ones were skipped. One row per check, every check present,
`n/a` where it does not apply — and a run that cannot do a check says so rather than omitting the row:

```
#  Check              Result   Detail
1  Four widths        FAIL     nav wraps into itself at 768
2  Content extremes   PASS     9-item list, 1-item list, no-image card
3  Contrast           FAIL     accent on inverse 2.45:1 (needs 4.5)
4  Slop tells         PASS     radius varies, accent is green not indigo
5  Images off         PASS
6  Greyscale/squint   WARN     stats and range compete at the same weight
7  Targets and focus  FAIL     3 controls at 24px, no focus ring on footer links
8  Hidden at rest     PASS     24 of 24 sections reveal
9  Direction audit    WARN     "precise" carried by nothing
```

Then split the findings: **what you fixed**, and **what is the human's call** — a failing contrast
ratio is yours, a section competing for attention may be intentional. Never report a check as passing
because you did not run it.

### 8. Assets and facts — the human's job
Work the `unverified` checklist in the preview: every marked section is either confirmed, corrected,
or removed. Until it is empty the build farm refuses to publish.

Swap placeholder photography for real images, verify every number and claim. Some of this is not
automatable and should not be: a wrong specification on a manufacturer's site is a commercial problem,
not a formatting one.

Check images for **third-party branding** — a competitor's logo on a worker's jacket in a stock photo
is a real problem no validator will catch.

### 9. Hand off
Validate, preview one last time, package, upload. See below for what the platform does next.

## After you hand off

The bundle you upload is source, not a built site. The platform stores it (Payload CMS), renders it
with the catalog version you pinned, and deploys the result. Three consequences worth understanding,
because they change what you should and should not put in the content:

**Structured data is derived, never authored.** JSON-LD, meta tags, Open Graph, sitemaps, `llms.txt`
and the AEO/GEO artifacts are generated server-side by reading the validated content tree. Do not
hand-write schema markup into props, and do not stuff keywords into copy — both fight a generator
that already knows the page's structure and will win.

Your actual lever on search and answer-engine visibility is **choosing the semantically correct
block**. An `FAQ` block becomes `FAQPage`; `Locations` becomes `LocalBusiness`; `SpecTable` becomes
product properties; `Testimonials` becomes reviews. Putting questions and answers inside a `RichText`
block instead of `FAQ` produces the same pixels and loses the schema — that is the whole reason
content is structured rather than markup.

Be honest with the client about what that buys, because two of these no longer buy what people
assume. **FAQ rich results were deprecated Search-wide on 2026-05-07 and HowTo was retired in
September 2023** — the markup is still correct and still machine-readable, but neither changes the
SERP. `Product`, `BreadcrumbList` and `LocalBusiness` do still produce rich results. The real payoff
is `Organization` from `org.json`: entity clarity is what an answer engine grounds a claim on, and it
is the one thing a competitor cannot copy off your page. Similarly, `llms.txt` is emitted because it
is cheap and some non-Google readers consume it — **Google stated in June 2026 that it has no effect
on Search or AI Overviews**. Do not sell it as the AEO feature.

**Fleet patches arrive without you.** When the platform ships new schema types or fixes a block,
every site inherits it on rebuild. That only holds because no site contains bespoke markup, which is
why the escape hatches are narrow.

**Refresh is scheduled server-side**, in two lanes: deterministic patches publish unattended, while
content rewrites become drafts for a human to approve. Neither is your job during generation — you
are not responsible for keeping the site fresh, only for handing over content a machine can keep fresh.

## Token discipline

The point of the checkpoints is that expensive work only happens after cheap work has been approved.

- Describe options in prose; write JSON only for the one chosen.
- Call `catalog_get` for the blocks you are actually using, never the whole catalog.
- A style tile, not a mocked page, for the look decision — and no copy in it at all.
- Real copy only once the sitemap is agreed.
- One page of real copy before the rest — corrections generalise, so paying for them once is enough.
- Reuse approved pages verbatim — never regenerate a page to change a different one.
- When the human asks for a change, edit the affected sections, not the file.

## Density — the difference between a website and a blog post

A professional site is dense and specific. A generated one drifts sparse, because abstract copy has
nothing to lay out: large type in empty bands is what the model reaches for when it has no facts.

The validator measures every section and reports:

| | Warning below | Aim for |
|---|---|---|
| Words per section | 20 | **60+** |
| Content nodes per section | 3 | **6+** |
| Words per page | — | **700+** |
| Images per page | — | one per two sections |

Hero, CTA, quote, nav and footer are exempt — they are meant to be short.

Density does not come from longer paragraphs. It comes from **specificity**: a caption naming what is
in the photograph, a spec row with a real value, a numbered step, a badge carrying a certification.
Reach for these before writing another sentence of prose:

| Primitive | Use |
|---|---|
| `Figure` + `caption` | a photograph that says what it shows, not decoration |
| `Caption` | a note under an image, table or stat |
| `KeyValue` | spec rows — composition, dimensions, warranty, lead time |
| `Badge` | certifications, materials, markets, standards |
| `Marker` | `01` / `02` step and item numbering |
| `Heading.accent` / `Text.accent` | one phrase of the heading in the accent colour — a verbatim substring, not markup |

Run `validate` and clear the density warnings before handing off. A page that trips them will look
like a free template no matter how good the theme is.

## Invented content — mark it, do not avoid it

You are expected to compose plausible copy so a page arrives whole rather than as a skeleton. What
you must never do is let an invention pass as sourced. Three tiers:

| Tier | What | Rule |
|---|---|---|
| **Write freely** | headings, section copy, captions, feature framing, step names, alt text | no mark needed |
| **Write and mark** | stats, spec values, prices, dates, counts, testimonials | allowed, set `"unverified": true` on the block |
| **Never** | `org.json`: legal name, registration number, certifications, credentialled people, `sameAs`; and any **named** person or post | leave the field out |

For a client who does not publish their people, `Team` accepts entries with a `role` and
`credential` but no `name` — describe who would handle the work rather than inventing partners.
For regulated copy ("not legal advice", "no solicitor-client relationship"), use the `Notice`
block, never `RichText`: it is excluded from JSON-LD and `llms.txt`, which `RichText` is not.
Set `org.businessType` (`LegalService`, `Dentist`, `AutoRepair`, `Accounting`…) and
`org.people[].personType` (`Attorney`, `Physician`…) at intake — a professional practice typed
as a bare `LocalBusiness` is indexed as a shop with an address.

`"unverified": true` on a block does three things: the preview marks it and lists it as the human's
edit checklist, the build farm **excludes it from JSON-LD and llms.txt**, and publishing is refused
until it is confirmed or corrected.

That exclusion is the reason the tiers exist. Marketing copy a human will proofread can be a draft.
A `Review` or a `Product` spec asserted in structured data is a claim made to a search engine in the
client's name — fabricated, it is a manual action and a legal exposure, and it lands after handoff
where nobody is looking. Prose can be wrong and get fixed; schema gets believed.

Say plainly in your handoff which sections are marked and what needs confirming.

## Rules that prevent the common failures

These come from real breakages; `references/house-rules.md` has the full list and the reasoning.

- **Content must suit the layout.** An overlay hero needs an *environment* photo; a product cutout on a white background becomes unreadable under a dark overlay. Declare `imageKind` and respect it.
- **One `h1` per page**, in the hero. At most one display-size *heading* per section (`Stat` is exempt — a row of large figures is one gesture).
- **Vary the tone rhythm.** Which sections go inverse/accent carries more brand identity than the colour values themselves. Don't leave every section on the default tone.
- **Slugs are editorial roles, not block types.** `hero/home`, `hero/page` and `hero/statement` should resolve differently. Expect ~2 slugs per block type.
- **Never put raw values in content.** No hex, no px, no font names in `site.json` — those belong to the theme, and hardcoding them breaks re-theming.

## Re-theming an existing site

If the user wants a different look, write a **new `theme.json` only**. Do not touch `site.json`. A correct architecture means changing the tokens and the slug mappings restyles every page — different layouts, different tone rhythm, different type. If you find yourself editing content to change the look, something is mis-modelled; say so rather than working around it.

## Adding a section the catalog can't express

First check whether an existing block with a different variant does the job — it almost always does, and it stays patchable. If it genuinely doesn't, two options:

1. **`FreeSection`** (if the project has it): compose from primitives — a grid recipe plus a tree of Stack/Row/Grid/Card/Heading/Text/Image/Button/Field/etc. Still pure JSON, still themeable, still validated. Use it for one or two signature moments per site, not everywhere: when every section is bespoke, nothing looks designed and review costs multiply.
2. **Propose a new block** to the shared catalog as a change request. Don't write component code inside a client site — it can't be patched centrally, and it will drift.

## Reference files

- `references/catalog.md` — every block, its variants, its props, and the primitives for `FreeSection`
- `references/art-direction.md` — the tokens, what drives distinctiveness, off-mode sampling, slop tells
- `references/house-rules.md` — validation gates, content-vs-layout rules, and known pitfalls with their causes
