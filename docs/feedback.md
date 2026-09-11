# Production-readiness feedback

**Date:** 2026-09-08 · **Reviewed:** `renderer/`, `platform/`, `mcp/` at `density-and-provenance`

## Scope of this document

This is a review of what stands between the current repo and running this pipeline for paying
clients on public domains. It is deliberately narrow: **security, data integrity, and the operational
layers that do not exist yet.** Design critique is out of scope except where a design choice creates
an exposure.

**The stage matters for how you read it.** This is a POC and it reads like one — which is the correct
shape for where the project is. The architectural bets have been made and they are good ones. What is
missing is the unglamorous half: escaping, isolation, tests, deploy. That half is cheap relative to
what has already been built, but none of it is optional, and two items in it are exploitable today.

So: nothing below says "the design is wrong". Everything below says "this specific thing will hurt a
real client the first week it is public".

---

## What the architecture already gets right

Listed because these are the expensive decisions, they are correct, and none of the fixes below
should be allowed to erode them.

| Decision | Why it holds up |
|---|---|
| JSON as the stored artifact, HTML as a build product | Fleet-wide patch = ship a block, rebuild. No bespoke markup to migrate. |
| One validator ([`renderer/src/validate-bundle.ts`](../renderer/src/validate-bundle.ts)) imported by preview *and* build farm | Kills "valid locally, rejected on publish". Best single decision in the repo. |
| `deprecated[]` + pure `migrate()`, never chained | Right migration model for an enumerable fleet. |
| Opaque variant slugs (`hero/home`, not `hero/dark-overlay`) | The indirection is what makes a re-theme actually a re-theme. |
| `unverified` provenance gate | Page shows it, JSON-LD strips it, publish refuses. Most generation pipelines have nothing here at all. |
| [`renderer/src/ssr.ts`](../renderer/src/ssr.ts) as the single React resolution point | Correct fix for a real, badly-shaped bug. |
| MCP is read-only, no write path, serves only what drifts | Correct scope. Means the catalog server needs almost no trust. |

---

## Blockers — do not put a client domain behind this until these are closed

### 1. HTML injection in the build farm — exploitable today

[`platform/src/build.ts:99-118`](../platform/src/build.ts#L99-L118) interpolates content-derived
strings into the document head with no escaping:

```ts
<title>${meta.title}</title>                                      // unescaped
<link rel="canonical" href="${meta.canonical}">                   // unescaped
<meta name="description" content="${meta.description.replace(/"/g, '&quot;')}">  // quotes only
<meta property="og:title" content="${meta.title}">                // unescaped
<script type="application/ld+json">${JSON.stringify(ld[0])}</script>  // no `</script>` guard
```

`meta.title` and `meta.description` come from `metaFor()`, which reads the hero title and body
straight out of `site.json`. `site.json` is model-generated, then human-edited, then uploaded from a
machine you do not control.

**Repro shape:** a hero body containing `</script><script>…</script>` breaks out of the JSON-LD block
and executes on the client's own domain. A hero title containing `"><script>` does the same from the
`og:title` attribute. React escapes the `<body>` correctly — this is the head only, which is exactly
the part that bypasses React.

**Fix:** an `escapeHtml()` applied to every interpolation in the head, plus `</` → `<\/` (and
optionally ``/``) on the serialised JSON-LD. Hours of work.

**Related, same line:** the file writes `ld[0]` but `jsonLd()` returns `object[]`. Correct today
because the function returns a single `@graph` wrapper — silently drops everything if that ever
returns two entries.

### 2. The build farm has no isolation

`buildSite()` takes an uploaded bundle and, in the host process:

- renders arbitrary JSON through the React catalog — no time budget, no memory budget
- `cpSync(join(bundleDir, 'assets'), …)` ([`build.ts:130-135`](../platform/src/build.ts#L130-L135))
  with no symlink check, no path-traversal check, no size cap, no file-type allowlist

A tenant's zip is untrusted input. Today a symlinked `assets/` entry can read outside the bundle into
the output directory, and a pathological content tree can pin the build host.

**Fix:** run builds in a container or a short-lived worker with a wall-clock timeout, a memory cap,
and a disk quota. Copy assets with an explicit allowlist of extensions and `lstat` refusal of
symlinks, rather than `cpSync(recursive)`.

### 3. Unvalidated URL props reach rendered `href` / `src`

Every link and image path in a bundle is a free-form string. No scheme allowlist, no asset-path
constraint:

- [`renderer/src/blocks/Footer.tsx:60,103`](../renderer/src/blocks/Footer.tsx#L60) — social
  `s.href` rendered directly
- `img src` in `Hero`, `Features`, `Gallery`, `CatalogGrid`, `Locations`, `MediaText`, `Promo`,
  `PostList`, `Team`, `primitives` — arbitrary URLs

Two consequences: `javascript:` and `data:` schemes in link props, and off-domain image URLs that
turn every client page into a request beacon to a third party.

**Fix:** in `validate-bundle.ts`, require link hrefs to be `https:`, `mailto:` or `tel:`, and require
image paths to be site-relative under `/img/<client>/`. This is validator work, not renderer work —
it belongs in the one gate both preview and farm already share.

### 4. Zero tests, zero CI

There is no `*.test.*` anywhere in the repo and no `.github/`.

This is the item that makes every other fix temporary. Specifically untested:

- **`validate-bundle.ts`, 833 lines**, encoding WCAG contrast maths, page-structure heuristics,
  and Malaysian Companies Act s.30(2) disclosure rules. A silent regression here does not fail a
  build — it publishes a non-compliant site.
- **Migrations.** `npm run migrations` exists and enforces "every deprecation has a fixture", but
  nothing runs it. The rule in `CLAUDE.md` about adding a fixture the same day is currently an
  honour system.
- **`seo.ts` derivations.** The `verified()` filter is the thing standing between a fabricated
  testimonial and `Review` markup published in the client's name under Google's 2026-07-24
  fake-review policy. It has no test proving it filters.

**Fix:** a test runner, fixture bundles that must stay valid, fixture bundles that must stay
*invalid* for a named reason, and CI running `validate` + `migrations` on every push. This is the
highest-leverage item in the document even though it is not itself a vulnerability.

### 5. There is no publish layer

`platform/` writes HTML to a local directory. Absent entirely: object storage, CDN, TLS/domain
handling, upload endpoint and its authn/authz, per-tenant separation, build versioning, rollback,
build logs, error reporting, alerting.

`CLAUDE.md` describes upload, hosting and refresh as if they exist. They do not. This is the largest
gap between the documentation and the repo, and it matters for the review because the security
posture of the pipeline is mostly decided in this missing layer — who may upload which client's
bundle, and what a bad build does to the site already serving.

**Fix:** treat it as a design task, not a coding task, and decide the tenancy model before writing
it. At minimum: authenticated upload scoped to one client, immutable versioned build outputs, an
atomic pointer swap on publish, and a rollback that is a pointer move rather than a rebuild.

---

## Serious, but will not hurt a client on day one

### 6. A failed block silently disappears from a published page

Both [`render.tsx:26-30`](../renderer/src/render.tsx#L26-L30) and
[`build.ts:41-45`](../platform/src/build.ts#L41-L45) `return null` when a block type is unknown or
its props fail to parse. In the preview this is reasonable. In the build farm it means a page ships
missing a section, with exit code 0 and a `✓ built` line.

The validator is meant to be the only gate, so any divergence between validator and renderer becomes
silent data loss rather than a failed build.

**Fix:** the farm should throw. If the validator passed and the renderer then cannot render, that is
a bug in the pair and should stop the build loudly.

### 7. `platform` reaches into `renderer/src` by relative path

[`build.ts:11-16`](../platform/src/build.ts#L11-L16) imports `../../renderer/src/…`. `renderer` is
already versioned (`0.4.1`) with a `files:` field — it is packaged to be a dependency and is not
consumed as one.

Consequences: `platform` cannot be deployed without the sibling checkout, and the version the farm
builds against is "whatever is on disk", so a rebuild of an old bundle silently uses today's catalog.

**Fix:** make it a real dependency, and pin per-build.

### 8. `CATALOG_VERSION` is hand-maintained and unenforced

[`mcp/src/source.ts:14`](../mcp/src/source.ts#L14) is a hardcoded string with a comment saying to bump
it when a schema changes. Nothing verifies it was bumped. The docs say bundles record the version they
were generated against so old bundles can be rebuilt — but nothing writes that field and nothing reads
it, so the rebuild guarantee is not actually implemented.

**Fix:** derive the version from a hash of the catalog schemas, write it into the bundle at generation
time, and have the farm resolve that version.

### 9. The token contract is not a contract

`ThemeSchema.tokens` is `z.record(z.string())` — the "39 tokens" are typed nowhere. Worse,
`theme_contract` publishes the token list as `Object.keys(Object.values(themes)[0].tokens)`
([`mcp/src/mcp.ts:44`](../mcp/src/mcp.ts#L44)) — the keys of *an arbitrary existing theme*, whichever
the filesystem lists first. Edit that client's theme and the contract every creator is generating
against changes with it.

**Fix:** declare the token set explicitly in one place; validate themes against it; serve that.

### 10. MCP HTTP hardening

[`mcp/src/http.ts`](../mcp/src/http.ts) is sound in shape (stateless, read-only, bearer-gated) but
missing the usual public-endpoint furniture:

- `Access-Control-Allow-Origin: *` with no `Origin` validation — DNS-rebinding exposure for the
  local-server case, which is how creators run it
- no rate limiting
- oversize body rejects the promise but never destroys the socket, so a sender can keep streaming
- token compared with `!==`, not a constant-time compare

Low severity given the data is read-only and non-secret, but it is a public endpoint.

### 11. `sitemap.xml` claims every URL changed today, every build

[`seo.ts:sitemap`](../platform/src/seo.ts) sets `lastmod` to the build date for every URL. A weekly
rebuild tells crawlers the whole site changed weekly. That is an actively misleading signal, not a
neutral one — and this pipeline's pitch is signal quality.

**Fix:** derive `lastmod` per page from a hash of that page's content tree, and only move it when the
hash moves. Also XML-escape the URLs while you are in there.

### 12. Smaller items

- `lang="en"` is hardcoded in the built document, in a pipeline whose validator encodes Malaysian
  jurisdiction rules.
- [`App.tsx`](../renderer/src/App.tsx) keys themes by `theme.name`: two clients choosing the same
  theme name collide silently, and `keys[0]!` throws on an empty content directory.
- **Doc drift.** `CLAUDE.md` refers to `spike/`, `starter/`, `renderer/src/specs/` and `compress.sh`.
  The repo has `renderer/`, `renderer/src/content/`, and `package.sh`, and no `starter/` at all. The
  "Test task" at the bottom of that file cannot be followed as written — which matters more than
  usual, because the file's own stated goal is that the skill work for someone without this context.

---

## Suggested order

Sequenced by "what stops a real client being harmed", not by effort.

1. **Escape the document head and the JSON-LD block.** Hours. Blocks any public deployment.
2. **URL scheme and asset-path validation in `validate-bundle.ts`.** Same gate, same day.
3. **Tests + CI** — validator fixtures, migration fixtures, `verified()` filter. Unblocks everything
   after it, because without it each fix below can silently regress.
4. **Renderer throws instead of dropping sections** in the farm path.
5. **Sandbox and quota the build farm**; harden the asset copy.
6. **Design and build the publish layer** — tenancy, versioning, atomic swap, rollback.
7. **`platform` → real dependency on `@blackdash/renderer`**, pinned per build.
8. **Derive `CATALOG_VERSION`; record and honour it in bundles.**
9. Typed token contract; MCP endpoint hardening; `lastmod` from content hash.
10. Reconcile `CLAUDE.md` with the actual tree.

Items 1–2 are a single afternoon and remove the exploitable surface. Item 3 is the one that decides
whether the rest stays fixed.

---

# 2026-09-08 — changes to make to the generation flow

From one end-to-end run: `website_info/wungadv/` (Wung & Co Advocates) built as **100% FreeSection**,
plus a Swiper carousel and parallax, taken through preview, static build and packaging.

This section is written as **edits to make**, keyed to the nine workflow stages in
[`plugin/skills/create-webpage/SKILL.md`](../plugin/skills/create-webpage/SKILL.md). Each item says where it goes,
what to add, and what it cost when it was missing. Renderer-side fixes already applied are marked
**[done]** — they are listed because the skill text still needs to change alongside them.

Ordered by how much rework each one prevents.

---

## A. Stage 5–6 (compose) — three JSON rules that must be in the skill body

These three cost the most rework in this run, and none of them is discoverable from the catalog.
They belong in SKILL.md itself, not a reference file, because they are what the generator gets wrong
while writing its first section.

### A1. `span` is a grid statement and nowhere else

> **Add to §5, before the first block is written:**
> - Every **direct child of a section grid** needs an explicit `span`. Without one it occupies
>   **1 of 12 columns** — the section renders as a narrow left-hand strip.
> - **Never put `span` on a child of a `Stack` or `Row`.** A Stack is an implicit single-column grid;
>   one `span: 8` inside it creates eight implicit columns and lays the whole stack out sideways.

Cost when missing: the hero rendered as a horizontal row of fragments and every section was ~8% wide.
Both validated cleanly and looked like stylesheet bugs. Two full review rounds.

**[done]** `FreeSection.check` now rejects the second case, naming the offending parent.

### A2. `align` flips axis between `Row` and `Grid`

| container | `align: "center"` resolves to | effect |
|---|---|---|
| `Row` (flex) | `align-items` | centres **vertically** |
| `Grid` | `justify-items` + `text-align` | centres **horizontally** |

> **Add to §5:** `align` on a `Grid` centres **copy**, not the row. If you want a two-column split
> vertically centred, there is currently **no way to express it** — omit `align` and accept top
> alignment.

Cost when missing: 18 sections silently centred all their body copy when Rows were changed to Grids.
It reads as a deliberate design choice, so a human reviewer will not flag it.

**Worth fixing properly in the catalog rather than documenting**: make `align` on a Grid mean
`align-items` (its natural meaning) and route horizontal centring through `justify`. That is a
breaking change for existing freeform bundles, so it needs a `deprecated` entry + migration.

### A3. Nothing may depend on preview-only JavaScript

> **Add as a house rule (`references/house-rules.md`) and repeat in §7:**
> The preview app and the build farm are **two renderers**. The preview attaches click handlers and
> mounts React; the farm emits `renderToStaticMarkup` plus two inline scripts and nothing else.
> Any affordance that works only because the preview shell is present is broken in production.

This is the single highest-value invariant from the run. Two separate defects came from it:

- `Text` with `page` rendered `<p data-page="...">` and relied on the preview's click delegate. In
  published output **the entire nav and every footer link was inert**, unfocusable, and invisible to
  a crawler — while `Button` resolved its href correctly the whole time. **[done]** — linked `Text`
  now renders an anchor; the home page went from 6 to 10 anchors.
- `swiper/react` would have animated in preview and shipped dead. Used `swiper-element` instead.

## B. Stage 7 (Design QA) — the checks that would have caught all of the above

§7 currently asks the generator to look at the preview. Every defect in section A survives that.

> **Replace the §7 checklist with one that runs against the built output:**
>
> 1. `cd platform && npm run build -- <bundle> <out>` — QA the **built** site, not the preview.
> 2. **Count anchors per page.** `grep -c '<a ' out/index.html`. A page with fewer links than its
>    nav has items means something rendered as text instead of a link.
> 3. **List every internal href** and confirm each resolves to a real page key.
> 4. **Grep the emitted JSON-LD types.** `grep -o '"@type":"[A-Za-z]*"'`. If a page has an address,
>    a spec table or a review and no corresponding type, the derivation did not fire.
> 5. **Check both widths on the built page**, and force reveals before judging
>    (`document.querySelectorAll('[data-motion]').forEach(e => e.dataset.inview = 'true')`) — a
>    screenshot mid-animation looks exactly like a broken grid. I misread staggered cards as a layout
>    bug until measuring: all four shared the same `y`.

## C. Stage 3 (Sitemap) — the divergence check is broken for freeform

`fleet_siblings` scores **layout-map overlap**, and every freeform slot's layout is the literal
string `"free"`. The new theme came back **1.0, "too similar"** against five sites it resembles in no
way at all.

> **Add to §3:** if the site is freeform, `fleet_siblings` cannot tell you anything. Compare tone
> rhythm, grid recipes and primitive mix by hand instead, and say in the handoff that the automated
> check did not apply.

**Platform fix needed** before the catalog is thinned: re-base `fleet_siblings` on something
freeform-visible — the ordered tone sequence, section roles, grid column counts, primitive
histogram. As it stands, a freeform-first pipeline has **no working anti-sameness guard**.

## D. Stage 4 (Style tile) — the levers that carry identity are the ones nobody sets

Measured across the five pre-existing themes:

| | Finding |
|---|---|
| Optional tokens | **0 of 43 set** in any theme — `--scale-ratio`, `--density`, `--sp-*`, `--measure`, `--grid-cols`, `--breakout`, `--motion-*` all fell to one stylesheet default |
| `direction` | **recorded by none**, though the schema has the field and the validator asks at `info` |
| `sectionStyles` | **39–41 dead slots per theme**, copied wholesale from another client (`aonic` defines 47, uses 6) |

So every site shared a spacing rhythm, a type ratio and a motion feel; only colour and a few sizes
varied. That is the templated feel, and **it has nothing to do with the block catalog** — thinning
the catalog would not have touched any of it.

> **Add to §4, as a gate rather than advice:** a style tile is not finished until it sets
> `--scale-ratio`, a `--sp-*` scale, `--measure`, the `--motion-*` pair, and **per-section
> `--density` that actually varies**. Uniform density across a site is itself a tell.

**Validator changes to match** (currently all `info`, therefore ignored — 0/5 compliance):
- no `direction` → **warning**
- fewer than ~4 optional form tokens set → **warning**
- `sectionStyles` slots defined but never referenced by the site → **warning**, with the count

## E. Stage 1 (Intake) — pull the publish-blocking facts forward

The build farm refuses a Malaysian bundle without a registration number (s.30(2) Companies Act 2016)
**and** refuses it if the number is absent from the footer. Correct behaviour. But `compress.sh`
neither included `org.json` in the zip nor passed it to the validator, so a bundle packaged clean and
failed on the platform — the slowest possible place to learn it, and undebuggable from the error.

**[done]** `compress.sh` now discovers `org.json` beside `site.json`, ships it, and validates with
it, so the error fires at package time.

> **Add to §1 as a blocking checklist**, not prose: legal name, registration number, registered
> address, phone, email, `sameAs` profiles, `businessType`. State plainly that **the site cannot be
> published without the registration number** and that it must also appear in the footer copy.

## F. Stage 8/9 — voice discipline and honest gaps

- **Occupational vocabulary must come from the brief.** This run labelled a footer address column
  "CHAMBERS" — real legal English, but *barrister* vocabulary for a firm of advocates and solicitors
  running an office. The art direction was reaching for a register and invented a term. Same class of
  error as inventing a statistic, and the existing "never invent facts" rule does not obviously cover
  it. **Add: never invent professional or sector terminology.**
- **Say what the catalog could not express.** From this run, for the handoff:
  - `Text` does not render `\n` — a postal address runs onto one line. `KeyValue` is the workaround.
  - No section-level `id`, so a footer list of six practice areas can only point at one page.
  - No `aria-current` in a freeform nav; the catalog `Nav` block gets it from `currentPage`.
  - No vertical alignment on a `Grid` (see A2).

---

## Catalog / renderer work this run created

Applied, and relevant to the flow because each removes a rule the generator would otherwise have to
remember:

| Change | Removes the need to |
|---|---|
| `List` items accept `{ text, page?, href? }` (additive; string form still valid) | build footer link columns out of stacked `Text` nodes |
| Linked `Text` renders an anchor | — (it was simply broken) |
| Controls no longer stretch on either grid axis | hand-place every `Button` and `Badge` |
| Nested `Grid` spans reset past the mobile breakpoint | write a second mobile layout |
| `--nav-logo-h` / `--foot-logo-h` scoped to freeform chrome | avoid real logos in a freeform nav |
| `Carousel` primitive (`swiper-element`, per-page bundle, no CDN) | choose between preview and production |

## Verdict on "thin the catalog and let the agent compose"

The freeform path works and the result reads as a different company. Nothing in the catalog forced a
templated look.

But the sameness was in section D — unused form tokens and cloned layout maps — and thinning the
catalog does not touch that. Thinning also disables **two things that key off block type**: the
divergence check (section C) and the JSON-LD derivation, which collapsed to
`Organization + PostalAddress + WebPage` with no warning, losing `LocalBusiness` despite
`businessType: "LegalService"`.

**Sequence: D first (cheapest, largest effect), then C and the `seo.ts` role-based derivation, and
only then consider thinning the catalog** — by which point the reason to thin it may have gone.
