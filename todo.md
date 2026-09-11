# TODO

## Under-engineered vs `goal.md` — revisit later

Found 2026-09-08 by auditing the code against `goal.md`. All three are stated goals with **zero
implementation**. Full context: [`docs/flow-audit.md`](docs/flow-audit.md) and
[`docs/research/README.md`](docs/research/README.md).

### 1. Cronjob / periodic refresh
**Goal:** bullet 4 ("run cronjob periodically / manually rebuild / trigger to refresh content & patch
when got new SEO, AEO, GEO or other new things") and flow step 10 ("run cronjob to repeat the
generation periodically to make the content fresh"). Stated twice.

**Status:** nothing. No `cron`, no scheduled rebuild, no trigger anywhere in `platform/`.

**Notes when picking this up:**
- The refresh discipline is already researched — `docs/research/2026-09-07-seo-aeo-geo.md` §4 lists
  what a refresh job should and must not touch. Read it first.
- `platform/src/seo.ts:265,286` + `platform/src/build.ts:199-207` already do content-hashed `lastmod`,
  so a rebuild that changes nothing correctly leaves dates alone. The cron job can lean on that.
- Never bump `dateModified` without a real content diff; never regenerate prose on a timer.
- **Not** the same as stage 10 (p75 CWV + scroll-depth field feedback) in
  `docs/how-a-site-gets-generated.md:237`. That is RUM telemetry and is **out of scope for
  `goal.md`** — do not build it as part of this.

### 2. Package → host (deploy step)
**Goal:** step 4 — "run a script to package the output then it will be processed in our platform (ADD
AEO GEO SEO things), then push to cloudflare pages or something similar".

**Status:** `renderer/tools/compress.sh` packages the bundle. Nothing after it — no upload, no
Cloudflare Pages push, no deploy target.

**Notes:** `platform/src/build.ts` produces the static output (HTML + JSON-LD + sitemap + robots +
llms.txt). The missing piece is only the publish hop. `platform/src/cli.ts` is 925B — likely where the
entry point goes.

### 3. Re-edit months later
**Goal:** step 5 — "If further edit is required few months later, maybe some product discontinued /
spec change, we can edit the source manually or have basic editor like Wordpress page where ppl can
manually update the content".

**Status:** nothing.

**Notes:**
- Tension to resolve first: goal bullet 3 says explicitly **no bloat admin UI** ("no need those bloat
  UI / framework for UI/UX generation portal... our tools will also iterate faster if no need to
  develop advanced admin UI eg: feedback system, drag and drop"). Step 5 wants a basic editor. Decide
  which wins before building — "edit the source manually" may be the whole answer for an internal team.
- `docs/research/2026-09-07-maintainable-generation.md` §5 already researched the minimum viable
  content editor. Start there rather than re-deriving.

### 4. Server-side asset processing
**Not from the `goal.md` audit** — found 2026-09-09 while adding stock-photo sourcing to
`plugin/skills/create-webpage/SKILL.md`. Recorded here because the skill now depends on it.

**Goal:** the creator's surface drops a correctly-named image file under `assets/<client>/` and
stops. Conversion, resizing and format negotiation happen in `platform/` after upload.

**Status:** nothing. `platform/` has no `sharp` and no decode step of any kind. Its only image code,
`platform/src/image-fit.ts`, parses **headers only** — deliberately: *"Header parsing only: no
decode, no dependency."* It catches aspect-ratio mismatches and nothing else.

**Why it became urgent:** the skill previously told creators to run `cwebp`. That was wrong — no
image binary is guaranteed on claude.ai (where sites are actually generated) or on an arbitrary
Claude Code machine, and a conversion that silently fails leaves a `src` prop pointing at a file
that was never written. The step has been removed, so bundles can now arrive holding `.jpg`
originals at whatever dimensions the source had. Nothing downstream fixes that yet.

**Notes when picking this up:**
- **Nothing requires `.webp` and nothing ever did.** `Img` in `renderer/src/blocks/shared.ts:46` is
  `z.object({ src: z.string(), alt: z.string() })`; `ASSET_RE` in `platform/src/assets.ts` is
  `/^\/img\/([^/]+)\/(.+)$/`. Both extension-agnostic. The fleet is all `.webp` only because the
  humans supplied optimised photographs. Do not add an extension gate to "fix" this — the fix is to
  convert server-side and rewrite the `src`, or to serve by content negotiation.
- If `src` gets rewritten during the build, `referencedAssets()` in `platform/src/assets.ts` is the
  single source of truth for what a bundle expects, and both the MCP announcement and the upload
  gate call it. Rewriting extensions without going through it will make those two disagree about
  what "complete" means — which its header comment says is the exact thing it exists to prevent.
- `image-fit.ts` already resolves `/img/<client>/x` to a path on disk and reads dimensions. A
  processing step has that plumbing available and should reuse it rather than re-globbing `assets/`.
- Adding a decode dependency (`sharp`) reverses a deliberate choice. Read the `image-fit.ts` header
  comment before doing it, and keep the header-only fast path for the fit check.
- Related: `docs/how-a-site-gets-generated.md` describes what the platform derives after upload —
  this belongs in that account once it exists.

---

## Also noted, not yet actioned

Over-engineering found in the same audit (detail in `docs/research/README.md`):

- **Cut** `renderer/tools/build_free.py` (379 lines, Python in a TS repo — if the AI writes JSON
  directly this layer shouldn't exist).
- **Cut** the 4 blocks used zero times fleet-wide: `Breadcrumb`, `Notice`, `PostList`, `Team`.
- **Cut** the 47-slug `sectionStyles` map copied identically across 6 themes (`wungadv` uses 11
  designed slugs and is the better theme).
- **Relax** the deprecation *process* (fixture-the-same-day, never-chain, sweep-before-drop). It
  guards fleet-wide silent breakage; `goal.md` says internal team, manual steps acceptable, and the
  fleet is 7 sites you can regenerate. Keep the `deprecated` arrays, drop the ritual until the fleet
  is external.
- **Decide** whether the 25 catalog blocks shrink to ~8 that exist purely to carry JSON-LD meaning
  (`Locations`, `SpecTable`, `FAQ`, `Testimonials`, `Steps`, `CatalogGrid`, `Nav`, `Footer`), with
  everything expressive being `FreeSection`. Usage today: `FreeSection` 79 uses, next highest `Hero`
  at 11.

Not over-engineering, leave alone: the slop/contrast/system taste rules (`goal.md` requires "not too
template, don't too AI Slop"), the Malaysian statutory footer gate, and the URL/image security checks.
