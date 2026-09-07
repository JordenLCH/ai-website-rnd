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

If the `blackdash-catalog` MCP is connected, **call `catalog_list` first, every time**. Blocks ship
weekly; anything written down in this skill is a snapshot that will eventually be wrong. Then call
`catalog_get` for just the blocks you intend to use — pulling all of them wastes the context you
need for composition. Say in your handoff which `catalogVersion` you built against — there is no
field for it in `site.json`, so it belongs in your written summary, not in the JSON.

The MCP serves the catalog only — it is read-only, and everything else is a repo script:

```
npm run validate -- <client>   # same module the build farm runs
npm run dev                    # preview at :5183, hot-reloads on JSON edits
./package.sh <client>          # zips the SOURCE bundle for upload
```

Validate before previewing: it costs a second and catches what a screenshot never will. Package with
`package.sh` rather than zipping a build — shipping HTML freezes the site, and it can then never be
re-themed or receive a fleet-wide patch.

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

`references/catalog.md` is the offline fallback for when the MCP is unreachable. Say which one you
used, so a stale-catalog bug is diagnosable later.

## Workflow — checkpoints, not one long generation

Generating a whole site and then asking "is this right?" is the expensive way to be wrong. Each stage
below produces something small enough to review in seconds, and you stop and wait at every ▸ mark.
Work that survives a checkpoint is never regenerated.

```
1  intake             (human)  documents, org facts, brand colour
2  content inventory  (you)    what copy actually exists, per page  ▸ human fills gaps
3  sitemap            (you)    pages + section roles, sampled       ▸ human edits
4  style tile         (you)    type, colour, spacing on one sheet   ▸ human picks
5  home page          (you)    real copy in the real theme          ▸ human corrects
6  remaining pages    (you)    applying the corrections
7  design QA          (you)    breakpoints, states, contrast        ▸ human sees the list
8  assets & facts     (human)  real photos, verified numbers
9  hand off           (you)    validate, package, upload
```

Everything after the upload — SEO/AEO/GEO artifacts, hosting, scheduled refresh — happens on the
platform. See "After you hand off".

**The order is content, then structure, then look — never the reverse.** That is how a studio has
always run a site build, and the reason is not ceremony: a visual direction chosen before anyone
knows how much copy each section carries is a guess, and the page then gets bent to fit the guess.
The failure is measurable — three independent runs of one brief that picked their art direction first
produced three palettes and *one* page structure, because the structure was fitted to a look that was
already locked, and the safe structure fits every look. Choosing the look at stage 4, after the
sitemap exists, means the type scale and density are chosen *for the content that will actually be
there*.

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

Also ask what you cannot infer: who buys from them, what the site must make happen, and any page
that must exist for a non-obvious reason.

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

▸ Show the table. Wait for the gaps to be filled or waived.

### 3. Sitemap — sample the architecture, then roles, still no copy
A **section role** is the job a section does on the page — proof, range, story, spec, process —
not a block type and not a theme slug. A page is an ordered list of roles:

> **Products** — hero (subpage) · catalogue grid · spec table · media+text · CTA

**Sample the home-page architecture the way stage 4 samples art direction.** Write three orderings
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

A wrong sitemap caught here costs one message. Caught after copy exists it costs a rewrite.
▸ Let the human add, remove and reorder.

### 4. Style tile — the look on one sheet, not a fake page
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

Name the typeface decision *against its alternatives*. "Inter" is not a bad font; **Inter unchosen is
the tell** — it signals nobody made a typography decision. The same is now true of monospace for
small labels and numerals: it reads as structured and technical, which is exactly why every generator
reaches for it, and it is on track to be as telling as an indigo gradient. Use it if you can say what
it does here that a small-caps sans would not.

▸ Wait for the pick. **Then build the tile, not a page:** one preview screen showing the type scale at
every step, the tone bands, a button, a rule, a caption and a table row. That is a style tile, and it
is what a studio shows at this point — deliberately *not* a mocked page with lorem in it, because a
human shown a fake page judges the fake copy and the invented layout instead of the type and colour
you actually want a decision on.

Iterate on tokens only. Content does not exist yet, so nothing is wasted.

### 5. Home page — one page of real copy, then stop
Write the home page fully. Nothing else. Stop.

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

Report the findings as a short list. Some are for you to fix; some are the human's call.

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
