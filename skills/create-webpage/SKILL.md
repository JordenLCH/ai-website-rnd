---
name: create-webpage
description: Generate a complete, maintainable marketing website from a client brief — as validated JSON (content + design tokens), never hand-written HTML. Use this whenever the user wants to build, generate, scaffold, redesign, or re-theme a website, landing page, or set of marketing pages for a company or client; when they mention a client brief, brand colours, or a site they need built; when they ask to change a site's look, art direction, or theme; or when they want to add or reorder sections on a generated site. Use it even if they just say "build me a site for X" without mentioning JSON, blocks, or themes — this skill is how sites get built here.
---

# Create a webpage

You are generating a website as **data**, not code. A site is two JSON artifacts validated against a fixed component catalog:

- **`site.json`** — pages, and for each page an ordered list of sections: `{type, variant, props}`
- **`theme.json`** — 39 design tokens plus a map of variant slugs → `{layout, tone, vars?}`

A build step renders those into static HTML. You never write HTML, CSS, or components. This is what keeps every generated site patchable later: when the platform ships new SEO/AEO schema or fixes a component, every site inherits it on rebuild — but only because no site contains bespoke markup.

## Why the split matters

Two failure modes kill generated sites. Both come from confusing these layers:

| Layer | Who decides | Failure if you get it wrong |
|---|---|---|
| **Structure** — which blocks, what order, what copy | fixed catalog | free-form markup → unmaintainable, unpatchable |
| **Art direction** — tokens, which layout & tone each slug resolves to | generated per client | reused defaults → every site looks like the same template |

So: keep structure rigid, make art direction genuinely different each time. A site that looks templated is almost always a site where the art direction was copied instead of designed.

## Get the catalog from the platform, not from memory

If the `blackdash-catalog` MCP is connected, **call `catalog_list` first, every time**. Blocks ship
weekly; anything written down in this skill is a snapshot that will eventually be wrong. Then call
`catalog_get` for just the blocks you intend to use — pulling all of them wastes the context you
need for composition. Record the returned `catalogVersion` in the bundle.

The MCP serves the catalog only — it is read-only, and everything else is a repo script:

```
npm run validate -- site.json theme.json   # same module the build farm runs
npm run dev                                # preview, hot-reloads on JSON edits
./tools/compress.sh <client> site.json theme.json assets/   # zips the SOURCE bundle
```

Validate before previewing: it costs a second and catches what a screenshot never will. Package with
`compress.sh` rather than zipping a build — shipping HTML freezes the site, and it can then never be
re-themed or receive a fleet-wide patch. The platform builds from the bundle using the pinned
`catalogVersion`.

`references/catalog.md` is the offline fallback for when the MCP is unreachable. Say which one you
used, so a stale-catalog bug is diagnosable later.

## Workflow — checkpoints, not one long generation

Generating a whole site and then asking "is this right?" is the expensive way to be wrong. Each stage
below produces something small enough to review in seconds, and you stop and wait at every ▸ mark.
Work that survives a checkpoint is never regenerated.

```
1  intake            (human)  documents, org facts, brand colour
2  art direction     (you)    3 options as token diffs   ▸ human picks
3  skeleton preview  (you)    themed page, placeholder copy ▸ human reacts
4  sitemap           (you)    pages + section roles, no copy ▸ human edits
5  home page         (you)    real copy, one page        ▸ human corrects
6  remaining pages   (you)    applying the corrections
7  assets & facts    (human)  real photos, verified numbers
8  hand off          (you)    validate, package, upload
```

Everything after the upload — SEO/AEO/GEO artifacts, hosting, scheduled refresh — happens on the
platform. See "After you hand off".

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

### 2. Art direction — offer three, do not decide alone
The first direction a model proposes is the mode of its training data, which is why generated sites
look alike. Generate four candidates with a self-assessed probability for each, discard the
likeliest, and present **three** to the human.

Present each in about two lines — the register, the type pairing, the tone rhythm, one sentence on
why it suits this client. **Do not write theme JSON yet.** Three full themes is roughly ten times the
tokens of three descriptions, and two of them are going in the bin.

> **A** Swiss catalogue — Archivo 800, hairlines, zero radius, bone/ink, accent as a marker
> **B** Warm editorial — Fraunces 300, generous rhythm, soft shadows, cream ground
> **C** Precision lab — condensed caps, white ground, thin rules, blue accent on data only
>
> Recommend **A**: they sell on specification, and the catalogue register signals that before a word is read.

▸ Wait for the pick. Then write one `theme.json`.

### 3. Skeleton preview — shape before words
Build the chosen theme with **one page of placeholder copy** — real structure, lorem-grade text.
This answers "do I like the look" for a fraction of a full generation, and look is the thing most
likely to be sent back.

▸ Show it. Iterate on tokens only. Content does not exist yet, so nothing is wasted.

### 4. Sitemap — roles, still no copy
Propose pages and, for each, an ordered list of **section roles**:

> **Products** — hero (subpage) · catalogue grid · spec table · media+text · CTA

A wrong sitemap caught here costs one message. Caught after copy exists it costs a rewrite.
▸ Let the human add, remove and reorder.

### 5. Home page — one page of real copy, then stop
Write the home page fully. Nothing else. Stop.

Write it **at full density**. A section that fills a screen and carries forty words is what makes a
generated site read as an unfinished template rather than a company's website, and it is the single
most common failure here — more damaging than any colour or layout choice. See "Density" below.

One page is enough to settle every question that generalises: tone of voice, how much detail a
section carries, what terminology the client uses for their own products, what claims are off-limits.
The home page in particular exercises most of the range — hero, proof, capability, story, call to
action — so a correction there lands on most of what follows.

▸ Take the corrections before writing anything else. Collected after the whole site exists, they mean
rewriting the whole site; collected here, they cost one page.

### 6. Remaining pages
Apply the home page's corrections to every remaining page, then validate, preview and package. If a
correction contradicts something in the approved sitemap, raise it rather than quietly resolving it —
the human knows which one they meant.

### 7. Assets and facts — the human's job
Work the `unverified` checklist in the preview: every marked section is either confirmed, corrected,
or removed. Until it is empty the build farm refuses to publish.

Swap placeholder photography for real images, verify every number and claim. Some of this is not
automatable and should not be: a wrong specification on a manufacturer's site is a commercial problem,
not a formatting one.

Check images for **third-party branding** — a competitor's logo on a worker's jacket in a stock photo
is a real problem no validator will catch.

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
- Placeholder copy for structural review; real copy only once the structure is agreed.
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
| **Never** | `org.json`: legal name, registration number, certifications, credentialled people, `sameAs` | leave the field out |

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

If the user wants a different look, write a **new `theme.json` only**. Do not touch `site.json`. A correct architecture means changing 39 tokens and 35 slug mappings restyles every page — different layouts, different tone rhythm, different type. If you find yourself editing content to change the look, something is mis-modelled; say so rather than working around it.

## Adding a section the catalog can't express

First check whether an existing block with a different variant does the job — it almost always does, and it stays patchable. If it genuinely doesn't, two options:

1. **`FreeSection`** (if the project has it): compose from primitives — a grid recipe plus a tree of Stack/Row/Grid/Card/Heading/Text/Image/Button/Field/etc. Still pure JSON, still themeable, still validated. Use it for one or two signature moments per site, not everywhere: when every section is bespoke, nothing looks designed and review costs multiply.
2. **Propose a new block** to the shared catalog as a change request. Don't write component code inside a client site — it can't be patched centrally, and it will drift.

## Reference files

- `references/catalog.md` — every block, its variants, its props, and the primitives for `FreeSection`
- `references/art-direction.md` — the 39 tokens, what drives distinctiveness, off-mode sampling, slop tells
- `references/house-rules.md` — validation gates, content-vs-layout rules, and known pitfalls with their causes
