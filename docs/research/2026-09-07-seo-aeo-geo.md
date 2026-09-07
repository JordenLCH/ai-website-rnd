# SEO / AEO / GEO — state of play, September 2026

Research only. No product code touched. Compiled via web search + primary-source
fetches on 2026-09-07; see Sources for URLs.

## 1. Executive summary

- Google **deprecated FAQ rich results Search-wide on 2026-05-07** and removed the
  docs page in June 2026; HowTo rich results have been gone since Sept 2023. FAQPage/HowTo
  markup is still valid schema.org and harmless to emit, but it earns **zero** Google SERP
  benefit now. [Strong/primary]
- Google **explicitly stated in June 2026 Search Central doc updates that llms.txt does
  nothing for Search or AI Overviews/AI Mode** — no ranking help, no harm. [Strong/primary]
- llms.txt has real but narrow uptake: Anthropic/Claude retrieval workflows and OpenAI's own
  developer docs use the pattern; Perplexity appears to opportunistically read it; but an
  Ahrefs-cited analysis found 97% of published llms.txt files got zero crawler requests in
  May 2026. Treat it as a low-cost nicety, not an AEO lever. [Medium — mixes primary + one
  industry analysis]
- Review, Product, LocalBusiness, Organization, BreadcrumbList and Article/Q&A/HowTo(defunct)
  remain in Google's current 31-type rich-result gallery — our derivation set (minus FAQ/HowTo
  value) is still largely correct. [Strong/primary]
- Google added an explicit **fake-review / undisclosed-incentive ban to review-snippet
  structured-data guidelines on 2026-07-24**, and ties spam policy enforcement to AI Overviews
  and AI Mode too. Auto-derived Review JSON-LD from Testimonials must only encode reviews we
  can show are genuine and attributable. [Strong/primary]
- Core Web Vitals remain an official ranking factor but function mainly as a **tiebreaker**
  among otherwise-similar pages, not a primary lever. [Strong/primary + one large-sample
  correlational study]
- No search engine or AI answer engine has published an actual citation-selection algorithm.
  The one semi-documented common thread across ChatGPT/Perplexity/Google AI Overviews is:
  indexability, structured-data parseability, extractable Q&A-shaped passages, and
  corroboration across independent sources (citation graph / cross-source consensus). Most
  detailed "GEO ranking factor" content on the web is SEO-vendor inference, not disclosed
  fact. [Explicitly flagged as weak below]
- Genuinely new since mid-2025: **WebMCP** (Google + Microsoft, announced 2026-02-10, Chrome
  origin trial by I/O 2026) lets a site expose an explicit "tool contract" for browser agents;
  **NLWeb** (Microsoft, 2025, led by schema.org's RV Guha) gives sites a standard `/ask`
  endpoint over schema.org/JSON-LD data; **agents.json** (`/.well-known/agents.json`) extends
  OpenAPI for agent-callable flows. None of these are crawler/ranking signals — they are
  agent-*action* protocols, a different problem than citation/AEO. [Medium — vendor/community
  specs, not yet W3C-ratified standards]
- IndexNow (Bing/Yandex/others) is unrelated to Google but plausibly relevant to us because
  Bing's index feeds Copilot and ChatGPT Search (OAI-SearchBot draws on Bing infrastructure per
  industry reporting) — worth a ping-on-publish hook later, low priority. [Medium]

## 2. What we should derive that we currently don't (ranked by evidence strength)

**Strong**
- **Review-snippet compliance metadata**: explicit non-incentivized, first-party attribution
  for any Testimonials → Review JSON-LD, given the 2026-07-24 fake-review ban. If a testimonial
  can't be shown genuine/sourced, don't emit `Review`/`AggregateRating` for it.
- **`Organization.sameAs` completeness check** at build time — this is the one E-E-A-T carrier
  every doc (Google's own quality guidance, corroborated informally by AI-citation research
  on cross-source consensus) agrees actually matters for both search and AI-citation
  corroboration. Already planned per org.json; worth a build-time lint that flags orgs with
  zero or one `sameAs` entry.

**Medium**
- **IndexNow ping on publish** to Bing/Yandex — cheap, official protocol, feeds Bing's index
  which multiple 2026 AI-search products sit on top of.
- **A generated `/.well-known/agents.json` or NLWeb-style `/ask` shape is premature** for a
  marketing-site generator (these target transactional/agentic sites), but the JSON content
  model we already have (typed blocks) would map onto NLWeb's schema.org+JSON-LD approach with
  little rework if it matures. Flag for later, don't build now.

**Weak**
- Anything claimed as a specific "AI citation ranking factor" beyond structured-data validity,
  crawlability, and Q&A-shaped concise passages — see Section 5.

## 3. What we currently derive that may now be worthless or harmful

- **FAQPage JSON-LD**: worthless for Google Search rich results as of 2026-05-07. Not harmful
  to keep emitting (still valid schema.org, may still be read by some AI crawlers/RAG
  pipelines), but the platform doc/marketing claim "FAQ block → rich result" is now false for
  Google and should be corrected to "→ FAQPage JSON-LD (machine-readable, no Google SERP
  effect since May 2026)."
- **`llms.txt` positioned as an AEO/GEO feature**: Google has said on the record it is not used
  for ranking or AI Overviews/AI Mode. It is not harmful to keep generating (near-zero cost),
  but internal messaging should stop implying it moves the needle with Google. Its only
  plausible value is as a light aid for agentic/IDE tooling and possibly Anthropic-side
  retrieval — not a general AEO lever.
- Nothing else in the current derivation list (LocalBusiness, Review, HowTo→Steps,
  Product/SpecTable, BreadcrumbList, Organization) is deprecated — HowTo is the one dead type
  in that list (Google removed it Sept 2023, still true in 2026); the "Steps → HowTo" mapping
  should get the same "no Google SERP effect, still valid markup" caveat as FAQPage.

## 4. What the periodic refresh job should and should not touch

Evidence base: Google's own public position is that freshness weight is **query-dependent**
(Query Deserves Freshness), and that a superficial datestamp change without "volume of change"
does not fool ranking systems — this is long-standing Google guidance reaffirmed in current-year
commentary, not a new 2026 finding. No controlled/causal study proves refresh cadence itself
raises rank; only correlational, non-peer-reviewed vendor reports (e.g., "median 106% traffic
increase after updates") claim specific effect sizes — treat those numbers as folklore.

**Should touch (auto-safe, factual, source-backed):**
- Dates that are structurally derived and always true at build time: `dateModified` /
  `datePublished` fields already tied to actual content change, sitemap `lastmod`.
- Numeric facts sourced from `org.json`/content JSON that changed for a real reason (a new
  cert, a new founding fact, a corrected phone number) — i.e., re-run derivation whenever the
  underlying JSON changes, which our architecture already does for free.
- Schema/JSON-LD shape itself when a schema.org type or Google requirement changes — this is
  the platform's actual structural advantage and squarely inside "should touch."

**Should NOT touch:**
- Never bump `dateModified` without a real content diff — that is the exact "surface freshness
  spam" Google's own docs describe as ineffective/detectable.
- Never fabricate updated stats, prices, or testimonials to simulate freshness — violates the
  project's own "never invent facts" rule and Google's fake-content spam policy.
- Never alter author/reviewer bylines, credentials, or testimonial attribution content — these
  are trust/E-E-A-T signals; touching them without a real personnel change is misrepresentation,
  not refresh.
- Don't auto-regenerate prose/copy on a timer "for freshness" — no evidence supports rewriting
  substantively-unchanged content, and it risks introducing invented facts.

## 5. Evidence is weak here / folklore

- **"AI citation ranking factors" lists** (structured-data weight, "concision score," "chunk
  size," "entity density," etc.) circulating on SEO-agency blogs are not disclosed by OpenAI,
  Anthropic, Perplexity, or Google. The one 2026 meta-survey found (arXiv 2607.14035, a
  literature review of 45 GEO studies through July 2026) explicitly notes terminology and
  evidence standards are still "heterogeneous" across the field — i.e., academia itself hasn't
  converged. Treat any specific numeric claim from an SEO blog ("bullet points increase
  citation by 40%") as unverified marketing content.
- **llms.txt "adoption growing 8.8x"** and **"97% of files get zero requests"** figures trace to
  a single Ahrefs-style industry analysis, not a disclosed crawler log from OpenAI/Anthropic/
  Perplexity/Google. Directionally plausible, not primary-sourced.
- **Perplexity's actual citation logic** ("citation-first, freshness-first, UGC-friendly" vs.
  ChatGPT's "editorial + Wikipedia" pattern) comes from a third-party citation-volume analysis
  (Averi, cited via secondary blog coverage), not from Perplexity's own documentation. Useful as
  a directional signal, not a specification.
- **Specific traffic-lift percentages for content refresh** ("106% increase," "4.6 SERP
  positions") are vendor-report numbers with no visible methodology or peer review — folklore
  tier, cited above only to name the source of the claim.
- **Whether Perplexity's crawler evades robots.txt via rotating undeclared agents** rests on
  Cloudflare's August 2025 disclosure, which is a primary/first-party source but is
  Cloudflare's characterization of Perplexity's behavior, not something Perplexity has
  confirmed — flagged as one-sided evidence, not settled fact.

## 6. Notes on individual questions not fully covered above

- **Q1 mechanism**: no vendor has published a citation-ranking spec. Beyond crawlability
  (definitional — a blocked bot can't cite what it can't fetch), the closest things to disclosed
  signals are cross-source corroboration and structured-data parseability, both named in a 2026
  arXiv literature survey (2607.14035, "Optimizing Visibility in Generative Engines," through
  July 2026) as the two most-supported factors across the field — which otherwise frames GEO as a
  multi-stage RAG pipeline (retrieve → score → synthesize+cite), not a single ranking formula.
  Google states AI Overviews/AI Mode draw on the same core web index and quality systems as
  organic Search with no extra technical requirements (per Search Engine Land's summary of
  Google's public statements — Google itself has not published a standalone AI Overviews spec).
- **Q3 Bing**: not primary-sourced this pass; secondary coverage suggests a broadly similar
  rich-result set plus IndexNow for fast reindexing. Flag as a gap, not a finding.
- **Q6 agent-action protocols**: beyond WebMCP and NLWeb (§1), `/.well-known/agents.json`
  extends OpenAPI for agent-callable flows/auth — community-driven, not yet ratified. None of
  the three are crawler/ranking signals; they solve agent *action*, a different problem from
  citation. No vendor has proposed a full replacement for llms.txt as an AI-citation control
  file — the trend runs toward agent-action protocols instead.

## Sources

- Google Search Central — FAQPage structured data (deprecation notice): https://developers.google.com/search/docs/appearance/structured-data/faqpage (fetched 2026-09-07)
- Google Search Central — HowTo structured data (removed): https://developers.google.com/search/docs/appearance/structured-data/how-to (fetched 2026-09-07)
- Google Search Central — Search Gallery (current supported rich-result types): https://developers.google.com/search/docs/appearance/structured-data/search-gallery (fetched 2026-09-07)
- Google Search Central — General Structured Data Guidelines (fake reviews / spam prohibitions, last updated 2026-07-10): https://developers.google.com/search/docs/appearance/structured-data/sd-policies (fetched 2026-09-07)
- OpenAI developer docs — crawler bots (GPTBot, OAI-SearchBot, ChatGPT-User, llms.txt reference): https://developers.openai.com/api/docs/bots (fetched 2026-09-07)
- Anthropic/Claude support — crawler bots and blocking: https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler (fetched 2026-09-07)
- Perplexity docs — crawlers: https://docs.perplexity.ai/docs/resources/perplexity-crawlers (referenced via search, 2026-09-07)
- Perplexity Help Center — robots.txt behavior: https://www.perplexity.ai/help-center/en/articles/10354969-how-does-perplexity-follow-robots-txt (referenced via search, 2026-09-07)
- Search Engine Land — "Google says llms.txt files won't harm or help your search rankings": https://searchengineland.com/google-says-llms-txt-files-wont-harm-or-help-your-search-rankings-480264 (2026-06, referenced via search)
- Cloudflare disclosure on Perplexity undeclared crawlers (Aug 2025), referenced via secondary coverage in AI-crawler roundups (2026-09-07 search) — primary Cloudflare post not independently re-fetched this pass.
- Chrome for Developers — WebMCP / Google I/O 2026 agentic web updates: https://developer.chrome.com/blog/chrome-at-io26 (referenced via search, 2026-09-07)
- NLWeb specification and docs: https://nlweb.ai/docs/specification , https://nlweb.ai/docs/intro (referenced via search, 2026-09-07)
- arXiv 2607.14035 — "Optimizing Visibility in Generative Engines: A Critical Survey of Generative Engine Optimization (2023–2026)": https://arxiv.org/abs/2607.14035 (referenced via search, 2026-09-07)
- Princeton GEO paper (2023, foundational): https://collaborate.princeton.edu/en/publications/geo-generative-engine-optimization/
- Industry/secondary sources used only where explicitly flagged as such in Section 5 (Ahrefs-style llms.txt adoption stats, Averi ChatGPT-vs-Perplexity citation-overlap analysis, various SEO-agency 2026 guides on Core Web Vitals, content freshness, and AI crawler management) — treated as directional, not authoritative.
