# What the platform does after you hand off

Referenced from `SKILL.md` stage 9. Read when a client asks what they are getting, or what
publishing buys them — most of it is not visible in the bundle you wrote.


The bundle you publish is source, not a built site. The hosting server stores it, renders it with
the same build farm the preview used, and deploys the result. Three consequences worth understanding,
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
