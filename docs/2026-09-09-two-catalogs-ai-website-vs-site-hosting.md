# Two catalogs: `ai-website` and `site-hosting`

Written 2026-09-09, before any implementation plan, because the MCP work was about to be planned
into one repo while a second repo solved an overlapping problem with a different content model.

**Corrected after a first draft:** `site-hosting` is the *earlier R&D*, and this repo is the
successor written after it. It has **no real customers on it**, so migration cost is near zero and
"which repo wins" was the wrong question. The right one: **what did the earlier round solve better,
and what must be carried forward before it is forgotten?** Prior work that is not salvaged is not
neutral — it gets rediscovered later at full price.

## How this was read, and what that is worth

I read `ai-website` fully (it is this repo) and `site-hosting` selectively over about half an hour:
`README.md`, `CONTEXT.md`, `docs/architecture/*` headings, `docs/adr/0003`, `src/collections/Pages.ts`,
`src/puck/catalog.ts`, `src/theme/*` exports, `package.json`, and greps across `src/` and `scripts/`.

**Not read:** `src/render/renderPage.tsx` (31 KB), `src/collections/Tenants.ts` (34 KB), the
`poc-json-render` / `poc-json-blocks` / `poc-website-catalog` directories beyond their file lists,
and the nine-layer validation doc beyond its headings. I ran none of its tests.

Two of its documents are stale in ways that matter for trust: `README.md` calls Puck the visual
editor when Puck is **not installed and not imported** (ADR 0003 retired it), and
`docs/architecture/preview-and-static-build.md` still describes **Directus** as the CMS. Treat any
single document there as a claim to verify, not a fact — including, by symmetry, this one.

## The two systems

| | `ai-website` | `site-hosting` |
|---|---|---|
| What it is | a generation pipeline | a hosting platform |
| Content unit | `site.json` — pages as an **ordered array of blocks** `{type, variant, props}` | Payload `Pages` doc — **fixed named field groups** (`hero`, `richText`, `cardGroup`, `testimonial`, `stats`, `faq`…) shown per template |
| Catalog size | 24 block components | 12 components, 5 page types, 1–2 templates each |
| Who composes | the model, freely, then a human reviews | the consultant, filling slots the template defines |
| Look | `theme.json` — 39 tokens + `sectionStyles` mapping opaque variant slugs to layouts | Payload theme presets + `generateLightTheme()`, per tenant |
| Storage | JSON files on disk, uploaded | Postgres, via Payload, multi-tenant |
| Editing | regenerate, or hand-edit JSON | Payload admin document view |
| Output | build farm → static HTML + JSON-LD + sitemap + llms.txt | `scripts/build-tenant.ts` → per-tenant static → Caddy CDN |
| Tests | **none** — `mcp/npm run smoke` prints, asserts nothing; `platform`'s `smoke` script points at a file that does not exist | vitest, with real unit tests beside the code |
| Also has | deprecations + `migrate()` for stored bundles, density + `unverified` gates, fleet divergence, the creator skill, the MCP App preview | tenants, domains, tiers, page-type access gating, RAG chatbot, contact forms, OG images, migrations, auth |

## The real difference is the composition model

Everything else is detail. One stores **an ordered list the generator chose**; the other stores
**a fixed set of slots the template defines**.

That difference is deliberate on both sides, and each side is right about its own problem:

- Free composition is what `ai-website`'s anti-template strategy rests on. Layout selection and tone
  rhythm carry identity; if every page is the same slots in the same order, colour is the only thing
  left to vary, and colour carries the least identity. The variant-slug indirection exists so one
  theme swap re-skins a whole site.
- Fixed slots are what makes a page **maintainable by a person in a CMS**. Switching template never
  drops content, because all templates under a page type share the field schema. Validation is
  trivial. A consultant cannot make a mess.

`site-hosting` has already run this experiment. ADR 0002 chose Puck (a drag canvas) with guardrails
so consultants "could only fill fixed slots"; ADR 0003 retired it, reasoning that *"for the current
POC scope, the drag-canvas editor is more machinery than needed"* — the slot model was the intent
throughout, and Puck was the machinery that got dropped. Puck is unwired but retained for rollback,
which leaves two render paths in `renderPage.tsx` and a `puckData` column still on the collection.

**That is not evidence that composable blocks failed.** It is evidence that a *drag-and-drop editor
for humans* was more than that product needed. `ai-website`'s composer is a model, not a person, and
it emits JSON — it needs no canvas at all. The ADR's reasoning does not transfer, but it does tell
you what that product optimises for, and it is not the same thing.

## What is duplicated, and what is not

**Duplicated, wastefully** — two of each, drifting independently: a block catalog, a component
library (`Hero`, `CTA`, `FAQ`, `Gallery`, `Stats`, `Testimonial`, `RichText`, `ContactForm` exist in
both), a theme/token system, a validator, a static build, and an anti-slop checking regime
(`ai-website`: density, fleet divergence, unverified; `site-hosting`: a nine-layer scheme with
design variation, site variation, theme integrity, contrast, golden diff).

The nine-layer document is the strongest single artifact I found on either side for this problem.
Whichever way the decision goes, it should be read before more validation work happens here.

**Not duplicated at all** — each has something the other completely lacks:

- Only `site-hosting` has hosting, tenants, domains, auth, tiers, a database, a CDN, migrations,
  and a test suite. Every "blocking prerequisite" in the chat-GUI spec — an always-on MCP, an
  authenticated upload, somewhere to put images — is **already solved there**.
- Only `ai-website` has the 24-block catalog, the variant-slug theme indirection, the deprecation +
  migration machinery for stored bundles, the SEO/AEO derivation, the creator skill, and the proven
  MCP App preview.

## Where each one is actually better

Judged per area, not per repo. "Better" means: solves the problem this pipeline actually has.

### `site-hosting` is ahead on checking a generated page

`docs/architecture/validation-layers.md` (describing `poc-json-blocks/`) is the most advanced
thinking in either repo on the question this whole project exists for — *how do you tell that a
generated page is bad before a client does?* Nine layers, of which two come from a library and
seven were written there. Four have no equivalent here:

- **Layer 6 — data and tokens.** A spec refers to data rather than restating it:
  `{"type":"DataTable","props":{"source":"products","columns":[...]}}` and
  `"Call [phone], or come to [address.short]."` A collection, column or token that does not exist
  fails the build. Renaming a field breaks the build of every page that used it instead of quietly
  emptying a column; a typo fails instead of printing `[phome]` onto the page.
- **Layer 7 — design variation.** Monotony, measured rather than guessed: no three consecutive
  bands with the same background *and* padding, three distinct paddings, three distinct
  backgrounds, three distinct picture shapes, exactly one `display` heading. Plus the one check
  that opens a file — `imagesize.mjs` reads pixel dimensions from the image header (forty lines, no
  dependency) and **rejects a photograph cropped past about half of itself**. Of seventeen
  corrections made to four generated pages, **seven were picture shape** — the one judgement the
  model reliably got wrong, because nothing showed it the consequence.
- **Layer 8 — site variation.** Every Merryfair page passed 7/7 while three of four opened with the
  same band, two using the same photograph. Nothing was wrong with any page; the fault existed only
  *between* them. This repo checks divergence **between sites** (`fleet_siblings`) and nothing
  **between the pages of one site**. That is a real hole, and it is the failure mode most likely to
  make a client say "every page looks the same".
- **Layer 9 — theme integrity, run on rendered markup rather than the spec.** A fixed colour that
  leaked out of a component — `bg-indigo-500`, an inline `#7BB241` — survives every spec-level
  check, because specs carry no colours. The rule here is "no raw values in `site.json`", which
  polices the input and cannot see the output. Their note on *why* `indigo-500` specifically is the
  tell of a generated site is worth reading on its own.

And the doc's best section is **"What no layer can see"**: of the last ten real defects, six were
found by opening the page and looking at it — line measure, implicit grid columns, whether the
photograph matches the words beside it, whether a fact is true, whether the argument is any good.
That honesty is the part to copy, not just the checks.

### `site-hosting` is ahead on shipping

- **Cloudflare Pages deployment already works.** `scripts/build-tenant.ts` →
  `uploadToCloudflarePages()`: `wrangler pages deploy` direct-upload per tenant, custom domain
  attached through the Pages API, skipped cleanly when `CLOUDFLARE_API_TOKEN` /
  `CLOUDFLARE_ACCOUNT_ID` are absent. The VPS/Caddy path it replaced is still there, commented out.
- Tenants, domains, tiers, page-type access, auth, migrations, a database.
- **A test suite that runs.** This repo has none: `mcp`'s `smoke` prints and asserts nothing, and
  `platform`'s `smoke` script points at a file that does not exist.

### This repo is ahead on the pipeline itself

- 24 finished blocks against 12 components; deprecations with `migrate()` so stored bundles survive
  a catalog change; the 39-token contract with variant-slug indirection; SEO/AEO/GEO derivation
  from `org.json`; `unverified` gating; the creator skill; and the MCP App preview proven in
  claude.ai.
- **Granularity went the other way, and that is worth knowing.** `poc-json-blocks` uses a
  *primitive* catalogue — six containers, eighteen atoms — and its layer 4 (every element a child of
  exactly one thing) exists *because* of that: "a primitive catalogue needs it far more than a menu
  of finished sections did". This repo chose finished sections with `FreeSection` as the escape
  hatch. Finished sections buy fewer ways to be wrong; primitives buy expressiveness. Both rounds
  hit the same tension and resolved it differently — this is the one place where the newer answer is
  not obviously the better one, and the layer-4 problem is the price of the older one.

## Verdict

**Keep this repo's pipeline. Port four things out of the older round before they are lost.**

Ranked by value:

1. **Data references instead of baked facts (their layer 6).** This is the highest-value idea in
   either repo and it is missing here entirely. `goal.md` wants a cronjob that keeps content fresh —
   with prices and phone numbers baked into `site.json` as copy, "fresh" means regenerating and
   re-reviewing a page per fact, forever, with the same fact drifting between two pages of one site.
   With a reference (`[phone]`, `source: "products"`), a refresh is a data update and the build
   picks it up. **This changes what the cronjob even is**, so it should be decided before the
   upload page and the platform are built around the current shape.
2. **Site-variation checking (their layer 8).** `fleet_siblings` covers between-sites; nothing
   covers between-pages. Cheapest of the four to add, and it catches the most visible defect.
3. **The image-crop check (inside their layer 7).** Forty lines reading an image header, catching
   the error class that accounted for seven of seventeen corrections. This repo has `imageKind` and
   a layout rule, but nothing that compares a photograph's real proportions to the frame it lands
   in — and nothing at all for images that only arrive at upload time.
4. **Theme integrity checked on rendered output (their layer 9).** The principle transfers even
   though the stack differs: check what the page *shows*, not only what the JSON *says*.

**Take the Cloudflare Pages deploy as-is.** `uploadToCloudflarePages()` is roughly one function plus
the custom-domain call, it is already the decided direction there (the Caddy path is commented out),
and it is exactly the "build and deploy" step of `goal.md`'s server side. Do not re-derive it.

**Leave behind:** the fixed-slot `Pages` content model, the dormant Puck code and `puckData` column,
the Caddy/VPS deploy path, and the stale documents (`README.md` on Puck,
`preview-and-static-build.md` on Directus).

**Steal the format, not just the content.** `validation-layers.md`'s "What no layer can see" section
is a better piece of engineering writing than anything in `docs/` here: it states what the system
cannot do, with counted evidence. Whatever gets ported should keep that section.

## Open question this does not settle

Whether the Payload app should host the MCP endpoint. Its case is strong — auth, a database,
always-on, and `docs/IMPLEMENTATION-PLAN.md` already specifies *"Payload (API + admin + MCP)"* and
*"MCP as a thin adapter"* over a shared core. Against it: this repo's MCP is four small files with
one dependency, and moving it into a Next/Payload app buys a database and a deployment story at the
cost of coupling the catalog server to a CMS it does not otherwise need. Worth deciding when the
upload page is designed, since both answers hinge on where uploaded images are stored.
