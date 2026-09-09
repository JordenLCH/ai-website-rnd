# Two catalogs: `ai-website` and `site-hosting`

Written 2026-09-09, before any implementation plan, because the MCP work was about to be planned
into one repo while a second repo solved an overlapping problem with a different content model.
The question this answers: **which repo owns the block catalog and the content contract?**

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

## Options

**A. One catalog: `ai-website`'s renderer, hosted by `site-hosting`.** `site-hosting` takes
`@blackdash/renderer` as a dependency; a Payload collection stores the bundle; `build-tenant.ts`
renders through the shared catalog; the MCP mounts as a Next route handler in the Payload app,
which answers the deployment and auth prerequisites outright. Slot-editing survives as a
*constrained view over* a blocks array for tenants who need hand-editing — the tier system already
exists to express "generated sites are a higher tier".

*Cost:* real migration. Two component libraries must become one, `renderPage.tsx`'s two render
paths become three before they become one, and the live tenants have to move.

**B. `site-hosting`'s model wins; rebuild the skill against it.** Treat `ai-website` as the
prototype that answered the research questions — it has, and cheaply. *Cost:* discard the catalog,
the theme contract, the migrations, five built bundles, and re-prove the MCP App preview against a
different catalog. The generation quality argument (free composition, tone rhythm) has to be
re-made inside a slot model, or abandoned.

**C. Keep both, deliberately.** Different products for different customers. *Cost:* fleet-wide
patching — the entire premise of this repo — only ever covers one of the two fleets, and the
duplicated component libraries drift forever.

## Recommendation

**A**, on this reasoning: the things `site-hosting` has and this repo lacks are *expensive and
boring* — auth, tenancy, a database, a CDN, migrations, tests. The things this repo has and
`site-hosting` lacks are *cheap to move and hard to re-derive* — a catalog, a token contract, a
skill, and a set of decisions already argued out in `docs/`. Moving a library into a platform is
ordinary work; rebuilding a platform under a library is not.

The honest counter-argument, which is a product question and not a technical one: if the people
using `site-hosting` are consultants filling slots rather than agents generating sites, then A
imports composition machinery that its actual users do not want, and C is the truthful answer.
**Nobody can settle that from the code** — it depends on who the customer is.

## What I could not determine

1. Are these the same product? `site-hosting` serves tenants with tiers and a chatbot;
   `ai-website` generates a bundle and hands it over. They may be one funnel or two businesses.
2. Are the live tenants in `site-hosting` real customers? That sets the cost of any migration.
3. What does `renderPage.tsx` (31 KB, two render paths) actually cost to maintain? If it is already
   painful, that argues for A sooner.
4. Does the nine-layer validation scheme subsume this repo's density and divergence checks, or
   complement them?

Answer 1 and 2 and the decision mostly makes itself.
