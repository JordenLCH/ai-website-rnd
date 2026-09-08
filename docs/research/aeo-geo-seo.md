# SEO / AEO / GEO — delta on the 2026-09-07 research

Tick 3 of the research loop. **Not a fresh survey.** `docs/research/2026-09-07-seo-aeo-geo.md` did the
primary-source work on 2026-09-07. This doc, written 2026-09-08, answers three things:

1. Do the load-bearing 2026 facts still hold when checked independently?
2. Which of that doc's recommendations shipped into `platform/`?
3. Where should each concern be **derived** (platform) vs **authored** (bundle)?

One-line answer: **the derivation code is better than the research asked for; the content it derives
from is almost entirely absent, and the `FreeSection` takeover from tick 2 has made most of the
JSON-LD emitters unreachable.**

---

## 1. Facts re-verified

Both load-bearing claims confirmed independently on 2026-09-08, with one detail the prior doc did not
have:

- **FAQ rich results deprecated 2026-05-07.** Confirmed. New detail: Search Console reporting and
  Rich Results Test support ended **June 2026**, and Search Console **API** support ends **August
  2026** — so the reporting surface is now gone too, not just the SERP feature. `FAQPage` remains
  valid schema.org and Google states unused structured data causes no problem for Search
  ([Search Engine Journal](https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/)).
- **llms.txt does nothing for Google Search.** Confirmed and stated unambiguously in Google's June
  2026 Search Central docs — not for rankings, not for AI Overviews, not for AI Mode. Ranking in AI
  Overviews comes from the same fundamentals as Search: useful content, crawlable pages, clear
  structure. Google also states **no special schema is required** for AI Overviews or AI Mode
  ([Search Engine Land](https://searchengineland.com/google-says-normal-seo-works-for-ranking-in-ai-overviews-and-llms-txt-wont-be-used-459422),
  [Search Engine Journal](https://www.searchenginejournal.com/googles-llms-txt-guidance-depends-on-which-product-you-ask/575431/)).

Nothing found that contradicts the prior doc. Its HowTo, Review-policy, CWV-as-tiebreaker and
"no published citation algorithm" positions stand unamended.

The "no special schema required for AI Overviews" line is worth internalising: it means the honest
case for our JSON-LD is **entity clarity and non-Google consumers**, not AI-answer placement — which
is what `CLAUDE.md` already says. Good; keep saying it.

---

## 2. Recommendations that shipped

| Recommendation (prior doc §2/§3/§4) | Status | Evidence |
|---|---|---|
| **Review-snippet compliance** — never emit `Review` for a testimonial that cannot be shown genuine | ✅ **shipped, well built** | `platform/src/seo.ts:45` `unverified()` deep-scans props for any `unverified: true`; `:62` `verified()` filters those blocks out of the graph *before* any derivation; `:222` comment cites the 2026-07-24 policy by date. The stated invariant — "visible on the page and absent from the graph, never the reverse" — is the right one |
| **FAQ/HowTo honesty** — stop claiming rich results | ✅ shipped | `seo.ts:198` (FAQPage) and `:233` (HowTo) both emit with comments stating there is no Search benefit; the `CLAUDE.md` derivation table carries the same caveats per row |
| **llms.txt as nicety, not lever** | ✅ shipped | emitted at `platform/src/build.ts:209` via `llmsTxt()` (`seo.ts:316`); positioned correctly in `skills/create-webpage/SKILL.md:383` |
| **Never bump `dateModified` without a real content diff** | ✅ **shipped, exactly as specified** | `seo.ts:265` `contentHash()`; `build.ts:199-207` reads the previous `sitemap-lastmod.json` so an unchanged page keeps the date it last actually changed. This is the §4 "should NOT touch" rule implemented as a mechanism rather than a guideline |
| **`Organization` / `sameAs` emission** | ✅ shipped | `seo.ts:137-150`, with `hasCredential` for certifications (`:153`) and people (`:161`) |

Two "Strong"/"Medium" items did **not** ship:

| Not shipped | Priority in prior doc | Evidence |
|---|---|---|
| **`sameAs` completeness lint** — flag orgs with 0 or 1 entry at build time | **Strong** | `grep -rniE "sameAs" platform/src/` returns only emission sites (`seo.ts:28,148,150,162`). Nothing checks count |
| **IndexNow ping on publish** | Medium | zero hits for `indexnow` anywhere in `platform/` |

---

## 3. The finding this tick actually turns on

### 3a. `org.json` — the "highest-value output" — exists once, and is empty

`CLAUDE.md` names `org.json` → `Organization`/`LocalBusiness` as "the highest-value output here" and
"the honest pitch for this pipeline". `SKILL.md:96` calls it "the site's **E-E-A-T** carrier" and
`sameAs` "the highest-value field here and the one most often skipped".

Measured across the repo on 2026-09-08 (`find . -name org.json -not -path "*/node_modules/*"`):

| Site | `org.json` | `sameAs` entries |
|---|---|---|
| `aonic` | **absent** | — |
| `firstmetrology` | **absent** | — |
| `gmr` | **absent** | — |
| `merryfair` | **absent** | — |
| `merryfair-dense` | **absent** | — |
| `merryfair-free` | **absent** | — |
| `wungadv` | present | **0** |

**One `org.json` in the entire repo, and its `sameAs` array is empty.** The field the docs call the
single highest-value thing the pipeline produces is populated for zero of seven sites.

Fair caveat: `renderer/src/content/*` are renderer/preview fixtures, and `buildSite()`
(`platform/src/build.ts:112`) takes `org` as a parameter rather than reading the folder — so these are
not necessarily *uploaded bundles* that failed to include one. But the consequence is the same in two
directions: the fleet carries no entity data, and the entire JSON-LD path in `seo.ts:130-256` has
only one fixture in the repo that can exercise it end to end.

This also makes the missing `sameAs` lint moot in the worst way — a lint that would fire on 100% of
the fleet is not the binding constraint; **collecting the data at intake is**. The lint should still
exist, and it should probably be an error, not a warning.

### 3b. `FreeSection` blinds every JSON-LD emitter but two

This is the cross-tick finding: tick 2's escape-hatch takeover directly disables tick 3's derivation.

Every derivation in `seo.ts` resolves content by **block type**, through a strict equality lookup:

```
const first = (page: Page, type: string) => page.blocks.find((b) => b.type === type)   // seo.ts, ~line 72
```

Used for `Locations` (`:177`), `FAQ` (`:198`), `SpecTable`/`CatalogGrid` (`:208-209`), `Testimonials`
(`:224`), `Steps` (`:233`), and `Hero.breadcrumb` (`:243`).

Only **two** places know `FreeSection` exists: `outline()` (`:85`, harvests headings) and `heroOf()`
(`:102`, matches `role === 'hero'`). Every other emitter is a plain type match, so a page built from
`FreeSection` has none of them.

Combined with the tick 2 census, schema-bearing blocks per site:

| Site | Schema-bearing blocks present | JSON-LD it can emit |
|---|---|---|
| `merryfair` | CatalogGrid, FAQ, Hero, Locations, SpecTable, Steps, Testimonials | full graph |
| `firstmetrology` | CatalogGrid, Hero, Locations, SpecTable, Steps | most of the graph |
| `aonic` | Hero | Organization, WebPage, BreadcrumbList |
| `gmr` | **none** | Organization + WebPage only |
| `merryfair-dense` | **none** | Organization + WebPage only |
| `merryfair-free` | **none** | Organization + WebPage only |
| `wungadv` | **none** | Organization + WebPage only |

`CLAUDE.md` states the design principle plainly:

> The lever at generation time is choosing the semantically correct block, because **block type is
> what the generator reads.**

`FreeSection` erases block type. Its `role` enum (`renderer/src/blocks/FreeSection.tsx:9`) was
retained *specifically* so "JSON-LD and house rules" keep working — the comment on line 8 says so —
but `seo.ts` reads `role` in exactly one place (`:102`, hero). The mechanism was designed and then
only 1/7th wired up.

So the four newest sites, which are the four most visually distinctive, are also the four that emit
almost no structured data. **The two goals are in direct, measurable conflict, and nobody chose it.**

---

## 4. Derive vs author — where each concern belongs

Requested mapping. "Derive" = `platform/` computes it from the content tree; "author" = it must be in
the uploaded bundle because no amount of computation can invent it.

| Concern | Where | Status |
|---|---|---|
| Legal name, registration, address, phone, founding date, `sameAs`, certifications, people, areaServed | **author** (`org.json`) — cannot be inferred, must not be invented | ✗ absent for 6/7; empty `sameAs` for the 7th |
| `Organization` / `LocalBusiness` JSON-LD | derive (`seo.ts:137`) | ✅ |
| `title`, `description`, canonical, OG/Twitter | derive from page content (`seo.ts:115`, `build.ts:179-185`) | ✅ |
| `BreadcrumbList` | derive from `Hero.breadcrumb` (`seo.ts:243`) | ✅ for Hero sites, ✗ for FreeSection sites |
| `Product`, `LocalBusiness+PostalAddress`, `Review`, `FAQPage`, `HowTo` | derive from block type (`seo.ts:198-241`) | ✅ for catalog sites, ✗ for FreeSection sites |
| Genuineness of a testimonial | **author** (`unverified` flag) | ✅ mechanism exists (`seo.ts:45`) |
| `sitemap.xml` + honest `lastmod` | derive with content hashing (`seo.ts:265,286`; `build.ts:199-207`) | ✅ |
| `robots.txt`, `llms.txt` | derive (`build.ts:208-209`) | ✅ |
| Semantic HTML / heading structure | derive from blocks + `outline()` (`seo.ts:77`) | ✅ |
| Core Web Vitals | derive at build + measure in field (stage 10) | implementation unverified — tick 4 |
| OG **image** | derive (generate) or author | ◐ tag emitted only `if (meta.ogImage)` (`build.ts:184`); no generator |
| favicon / webmanifest | derive | ✗ absent |
| Redirects from a previous site | **author** (only the client knows the old URLs) | ✗ no mechanism anywhere in `platform/` |
| IndexNow ping | derive (publish hook) | ✗ not built |

---

## 5. Recommendations, ranked

For tick 4 to cost out. **No code changed in this tick.**

1. **Make `FreeSection` derivable.** Either `seo.ts` resolves content by `role` + node shape rather
   than by block type, or `FreeSection` sites accept `Organization`-only structured data as a stated
   trade. Currently the trade is being made silently, four sites deep. Largest gap.
2. **Collect `org.json` at intake and fail without it.** It is the pipeline's stated primary value and
   the fleet has none. Six sites have no file at all; the seventh has `sameAs: []`.
3. **`sameAs` completeness check** — prior doc rated it Strong, still not built. Error, not warning,
   given #2.
4. **OG image generation, favicon, webmanifest** — small, mechanical, currently absent
   (`build.ts:184` and no manifest emission).
5. **Redirect map as an authored bundle field** — the only item here that loses existing traffic when
   omitted, and most client work is a redesign.
6. **IndexNow ping** — cheap, unchanged in priority (Medium) from the prior doc.

## Method note

Repo claims checked against the cited files on 2026-09-08. The `org.json` census used
`find . -name org.json -not -path "*/node_modules/*"` over the whole repo, not a directory listing.
The 2026 external facts were re-verified by web search rather than carried over on trust; sources
linked inline above.

Sources:
- [Google Drops FAQ Rich Results From Search — Search Engine Journal](https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/)
- [Google says normal SEO works for ranking in AI Overviews and llms.txt won't be used — Search Engine Land](https://searchengineland.com/google-says-normal-seo-works-for-ranking-in-ai-overviews-and-llms-txt-wont-be-used-459422)
- [Google's llms.txt Guidance Depends On Which Product You Ask — Search Engine Journal](https://www.searchenginejournal.com/googles-llms-txt-guidance-depends-on-which-product-you-ask/575431/)
