# Flow audit — the pipeline end to end, 2026-09-08

Tick 4 of the research loop. Evaluates the current pipeline against the findings of
[`docs/research/human-web-design-process.md`](research/human-web-design-process.md) (tick 1),
[`docs/research/creative-and-upgradeable.md`](research/creative-and-upgradeable.md) (tick 2) and
[`docs/research/aeo-geo-seo.md`](research/aeo-geo-seo.md) (tick 3).

**No code was changed.** Every claim names a file, checked on 2026-09-08.

Effort key: **S** ≈ under a day · **M** ≈ 1–3 days · **L** ≈ a week or more.

---

## What is genuinely strong

Stating this first because the ranked list below is all defects, and the ratio would otherwise
mislead.

- **The checkpoint structure.** Content → structure → look, nine stages, sampled at two of them with
  the likeliest discarded (`docs/how-a-site-gets-generated.md:79`). Tick 1 found no studio stage
  missing from the *middle* of the process; the gaps are at both ends.
- **`theme.direction`** (`validate-bundle.ts:301-320`) — the direction in words, audited back against
  the values at QA. This is the single best idea in the repo and the template for three fixes below.
- **The `unverified` → `verified()` gate** (`platform/src/seo.ts:45,62`). Visible on the page, absent
  from the graph, never the reverse. Correct answer to the 2026-07-24 fake-review policy.
- **Honest `lastmod`** (`seo.ts:265,286` + `build.ts:199-207`) — content-hashed, so a date never
  bumps without a real diff. A rule implemented as a mechanism.
- **Deprecation arrays with enforced fixtures** (`renderer/src/blocks/shared.ts`,
  `renderer/tools/migrations.ts`).
- **Statutory footer compliance** (`validate-bundle.ts:462-518`) — SSM registration number gate, an
  `error`. Ahead of most studios.

---

## Two open questions from earlier ticks — now answered

**Q: Is stage 10 (field CWV + scroll depth) implemented?** **No. Nothing exists.**
`grep -rniE "scroll.?depth|web-vitals|LCP|INP|CLS|p75|field data"` over `platform/`, `mcp/`,
`renderer/src` and `renderer/tools` returns only false positives (a `cls()` classname helper in
`renderer/src/blocks/primitives.tsx:109`). `docs/how-a-site-gets-generated.md:237` describes stage 10
as "the loop that makes a site better, not just not-worse". It is specification only.

**Q: Does `sectionStyles` vary `--density` per section?** **Only in one theme.**

| Theme | `sectionStyles` slugs | slugs carrying `vars` | slugs setting `--density` |
|---|---|---|---|
| `aonic` | 47 | 0 | 0 |
| `firstmetrology` | 18 | 0 | 0 |
| `gmr` | 47 | 0 | 0 |
| `merryfair` | 47 | 1 | 0 |
| `merryfair-dense` | 47 | 2 | 0 |
| `merryfair-free` | 47 | 2 | 0 |
| `wungadv` | 11 | **11** | **11** |

And the slugs themselves are not per-client at all: `aonic ∩ gmr` = **47 of 47 identical slug names**;
`aonic ∩ merryfair` = 47. Six themes share one copied slug set. `wungadv` has 11 slugs, 8 of which
overlap that set — a deliberately smaller, fully-parameterised map.

Combined with tick 2 (6 of 7 themes set **zero** structural tokens and have no `direction`): **for six
of seven sites, the theme layer varies colour values and nothing else.** That is precisely what
`validate-bundle.ts:217` warns about in its own words, and it means `fleet_siblings` divergence is
currently measured against a set of near-clones.

---

## Ranked gaps

### 1. `FreeSection` erases the structured-data signal — **M**
**Files:** `platform/src/seo.ts` (emitters at `:177,198,208,224,233,243`); pattern to copy at
`renderer/src/validate-bundle.ts:678-684`.

Every JSON-LD emitter resolves content by strict block type (`const first = (page, type) =>
page.blocks.find(b => b.type === type)`, `seo.ts` ~`:72`). Only `outline()` (`:85`) and `heroOf()`
(`:102`) know `FreeSection` exists. The four 100%-`FreeSection` sites — `gmr`, `wungadv`,
`merryfair-free`, `merryfair-dense`, which are the four newest — can emit **`Organization` + `WebPage`
only**.

`CLAUDE.md` states the principle: *"block type is what the generator reads."* `FreeSection` erases
block type. Its `role` enum (`renderer/src/blocks/FreeSection.tsx:9`) exists specifically so JSON-LD
keeps working (see the comment on line 8) — and `seo.ts` reads `role` in exactly one place.

**Why M and not L:** the fix template is already in this repo. `validate-bundle.ts:678-684` hit the
identical problem for the layout map and solved it by deriving a synthetic shape:

```
const shape = b.type === 'FreeSection' ? `free:${p?.role}:${p?.grid?.cols}` : style.layout
```

`seo.ts` needs the same move — resolve by `role` plus node shape rather than by type. One module,
one pattern, already proven next door.

### 2. `org.json` is absent fleet-wide and nothing enforces it — **S** (code) / human (data)
**Files:** `renderer/src/validate-bundle.ts` (no org schema at all — the only `org.json` mention,
`:462`, is a comment); `skills/create-webpage/SKILL.md:93` (intake).

`find . -name org.json -not -path "*/node_modules/*"` returns **one file**:
`renderer/src/content/wungadv/org.json`, whose `sameAs` is `[]`. The docs call this the pipeline's
highest-value output and honest pitch; it is populated for zero of seven sites.

The validator gates the *footer* registration line (`:506-518`, an `error`) but never checks that
`org.json` exists or is complete — so a bundle with no entity data at all validates clean. Add an org
schema plus a `sameAs` completeness check (tick 3 rated the latter **Strong** and it is still
unbuilt: `grep -rniE "sameAs" platform/src/` returns emission sites only).

Caveat, stated so the finding is not overclaimed: `buildSite()` (`platform/src/build.ts:112`) takes
`org` as a parameter, so `renderer/src/content/*` are fixtures rather than proven failed uploads. The
consequence holds either way — the JSON-LD path has one fixture in the repo that can exercise it.

### 3. Stage 10 does not exist — **L**
**Files:** none — nothing to point at.

The documented feedback loop that turns a site from *not-worse* into *better* is unimplemented.
Everything upstream is a one-shot generator with no measurement returning to it. This is the largest
gap by ambition and the least urgent by client impact, which is why it sits third rather than first.

### 4. No governance for `FreeSection` — **M** policy, **L** tooling
**Files:** `CLAUDE.md` (the patchability claim), `renderer/tools/build_free.py` (29K authoring tool),
`docs/research/2026-09-07-maintainable-generation.md` §1.4 (Rule of Three).

`FreeSection` is 54% of the fleet (71 of 132 blocks) and the *only* block type in four sites. The
`CLAUDE.md` promise — "ship a fix to a block and every site inherits it on rebuild" — is literally
true (no site holds bespoke *markup*) and void in practice (they hold bespoke *layout*).

The decision to make is cheap; the tooling is not. **Decide first, in `CLAUDE.md`**: is `FreeSection`
a prototyping surface whose recurring shapes get harvested into named variants, or the real authoring
surface, in which case the fleet-patchability pitch needs rewriting? Right now the docs claim one and
the fleet does the other. The harvest tooling (cluster 71 node-trees, promote any shape seen three
times) is the L half and can follow.

### 5. Six of seven themes are clones — **M**
**Files:** `renderer/src/content/*/theme.json`; contract at `renderer/src/tokens.ts`; warnings at
`validate-bundle.ts:213-217,301-320`.

Zero structural tokens, no `direction`, and an identical 47-slug `sectionStyles` map. The warnings
that would catch this all ship as `severity: 'warning'` (`validate-bundle.ts:12` defines the union;
current mix is 19 `error` / 16 `warning` / 20 `info`), so legacy themes stay valid forever and the
gap never closes on its own.

Two moves, both small individually: sweep the six themes onto structural tokens + `direction`, and
promote `theme.direction` to `error` for new bundles. Until then, divergence scoring is measuring
against near-clones — a degradation invisible from inside the score.

### 6. No positioning / messaging hierarchy artifact — **S**
**Files:** `skills/create-webpage/SKILL.md` (would be a new stage between `:93` intake and `:143`
inventory).

`grep -rniE "positioning|messaging hierarchy|value prop"` over `skills/create-webpage/` returns
nothing. Section roles and headlines are both downstream of a claim structure that is never written
down, which is why the skill has to *defend* against generic headlines with a rule (`:288`) instead of
*preventing* them with an input.

Skill-only change, no schema. Apply the `theme.direction` pattern: one primary claim, three supporting
claims with their proof, and the words a competitor already owns — written down, and auditable at
stage 7. The same move fixes the discovery answers (`:141`, asked and discarded) and the category
do-not list (`:186`, carried in conversation only).

### 7. `ContactForm` submits nowhere — **M**
**File:** `renderer/src/blocks/ContactForm.tsx:13,38`.

`action: z.object({ label: z.string() })` — a label, no endpoint, no method. It renders a bare
`<button type="submit">`. No success state, no spam handling. A contact form that silently discards
enquiries is worse than no contact form, and this is a defect rather than a missing feature.

### 8. No redirect mechanism — **M**
**Files:** `platform/` (no hit for `redirect` anywhere), plus a new authored bundle field.

Most client work is a redesign, and this is the only item on this list that loses *existing* traffic
when omitted. Must be authored — only the client knows the old URLs.

### 9. Launch artifacts: favicon, webmanifest, OG image — **S–M**
**File:** `platform/src/build.ts:184` (OG tag emitted only `if (meta.ogImage)`; nothing generates
one), no `favicon`/`manifest` emission anywhere.

Mechanical, self-contained, and currently the difference between a site that looks finished when
shared and one that does not.

### 10. Copy is not its own reviewed artifact — **S**
**File:** `skills/create-webpage/SKILL.md:269` (stage 5).

Copy and layout are approved in one checkpoint, so the reviewer comments on whichever is more wrong
and the other ships unread. Splitting the stage-5 review into "words" then "layout" is a skill edit,
not a schema change.

### 11. `sameAs` completeness lint — **S**
Folded into #2 above; listed separately because tick 3 rated it Strong on its own evidence.

### 12. IndexNow ping on publish — **S**
**File:** `platform/` publish path. Unchanged Medium priority from
`docs/research/2026-09-07-seo-aeo-geo.md` §2. Cheap, official, feeds the Bing index that several 2026
AI-search products sit on.

---

## The shape of the whole thing

Three observations that only appear when the ticks are read together.

**The system absorbed the research; the fleet did not.** Nearly every recommendation from the
2026-09-07 docs shipped into `tokens.ts`, `validate-bundle.ts` and `seo.ts` — and then six of seven
themes and six of seven bundles stayed on the old shape, because every new rule is a `warning`. The
binding constraint is not knowing what to build. It is that nothing forces adoption.

**Distinctiveness and machine-readability are in direct, unchosen conflict.** `FreeSection` is
plausibly *why* `wungadv` is the only theme with a real direction, all eight structural tokens and a
per-section density map — and it is also why `wungadv` emits almost no structured data. The four most
visually considered sites are the four with the weakest entity signal. Nobody decided this; it fell
out of a strict `b.type ===` comparison in one module.

**The gaps are at the ends, not the middle.** Tick 1 looked for missing studio stages and found the
middle of the pipeline complete or better than standard practice. What is missing is the front
(positioning, discovery persisted) and the back (launch checklist, field feedback) — the two ends
that face the client rather than the page.
