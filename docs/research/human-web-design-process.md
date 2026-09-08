# How a studio actually builds a marketing site — and where our pipeline has no analogue

Tick 1 of the research loop. Purpose: take the real end-to-end process a design studio runs for a
client marketing site, name the **artifact** each stage produces, and mark which of those artifacts
this repo produces, produces informally, or does not produce at all.

Our nine stages (`docs/how-a-site-gets-generated.md` §2, implemented in
`skills/create-webpage/SKILL.md`) already mirror the studio order — content → structure → look. This
doc is not a critique of that order. It is a search for the **missing artifacts**: things a studio
writes down and hands over, that we currently either hold in conversation or skip.

Legend: **✅ have** · **◐ informal** (happens, but leaves no artifact that survives the session) ·
**✗ absent**.

---

## The stages, the artifacts, and our coverage

### 1. Discovery — stakeholder + customer interviews
**Studio artifact:** a discovery summary. Who buys, what they are actually choosing between, what
kills a deal, what the client believes about themselves that customers do not.

**Us: ◐.** `SKILL.md:141` asks the human "who buys from them, what the site must make happen, and any
page that must exist for a non-obvious reason" — the right three questions. But the answers go
nowhere. There is no file for them. `org.json` (`SKILL.md:96`) holds *facts about the entity*, not
*facts about the buyer*, and nothing in `renderer/src/validate-bundle.ts` knows the answers exist.

Consequence: by stage 5 the copy is being written from brief prose alone, which is why the skill has
to defend against generic headlines with a rule (`SKILL.md:288`) rather than with an input.

### 2. Positioning / messaging hierarchy
**Studio artifact:** a positioning statement and a messaging hierarchy — one primary claim, three
supporting claims, the proof for each, and the words the client is *not* allowed to use because a
competitor owns them.

**Us: ✗.** Nothing. `grep -rniE "positioning|messaging hierarchy|value prop"` over
`skills/create-webpage/` returns zero hits. This is the largest single gap in the process.

Why it matters here specifically: the messaging hierarchy is what makes section *roles* (stage 3)
non-arbitrary. Right now a role sequence like proof → range → story is chosen for rhythm and
divergence; in a studio it is chosen because claim 2 needs proof before claim 3 is credible. Without
it, structure is an aesthetic decision wearing an editorial hat.

It is also the missing input to the "concrete noun a competitor could not also claim" rule. That rule
asks the model to *avoid* a failure at write time. A messaging hierarchy *prevents* it at input time,
because the claim and its proof were both written down before any headline existed.

### 3. Competitive / category audit
**Studio artifact:** a landscape doc — screenshots of the 3–5 closest competitors, and an explicit
list of the category's shared conventions.

**Us: ◐.** This exists and is well argued (`docs/how-a-site-gets-generated.md:88`, "The category
default, which divergence cannot see"; `SKILL.md:186`). The do-not list is generated at stage 3 and
carried through stages 4–6.

But it is carried *in the conversation*. It is not written to the bundle, so:
- stage 7's QA cannot audit against it the way it audits against `theme.direction`;
- the next session to open the site cannot see what the market default was;
- `fleet_siblings` (MCP) measures divergence from *our* fleet, and there is still no persisted record
  of divergence from the client's market.

`theme.direction` (`docs/how-a-site-gets-generated.md:100`) solved exactly this problem for art
direction — three adjectives, what was rejected, why — and the same trick is unapplied to the
category default.

### 4. Content audit / inventory
**Studio artifact:** an inventory of existing copy and assets, with gaps marked.

**Us: ✅ — and stronger than typical.** `SKILL.md:143` requires two tables: words available per topic,
and *what the content will break* (longest product name, uneven list lengths, topics with no photo).
The second table is better practice than most studios manage, and it is the declared input to stage
7's content-extreme pass. The ~1,200-word floor is a real gate.

### 5. IA / sitemap
**Studio artifact:** a sitemap plus, usually, a page-level content outline.

**Us: ✅.** `SKILL.md:179`, with four sampled architectures and the likeliest discarded
(`docs/how-a-site-gets-generated.md:79`). Section *roles* rather than block types is the correct
abstraction.

### 6. Wireframes / greybox
**Studio artifact:** low-fidelity page structure, approved before any visual design.

**Us: ◐ (arguably by design).** Stage 3's role sequence is the wireframe, expressed as words instead
of boxes. The argument for this is sound — a greybox in this system would be a rendering of blocks
that do not have content yet, which is the "fake page with lorem" failure the skill explicitly rejects
at `SKILL.md:246`.

The residual gap is that the human approves a *list of role names* and then next sees a *fully
themed, fully written page*. Two large decisions collapse into one review. Worth noting; not
obviously worth fixing.

### 7. Art direction / style tile
**Studio artifact:** style tile — type scale, colour, one button, one rule, one caption. Plus a
written direction.

**Us: ✅ — best-covered stage in the pipeline.** `SKILL.md:221`. Four candidates, likeliest discarded,
three presented as prose before any JSON, tile not a fake page, direction recorded as three adjectives
with rejections in `theme.direction`, audited back at stage 7 item 9. This matches or exceeds studio
practice.

### 8. Copywriting
**Studio artifact:** a copy deck — a document of final words, reviewed and signed off, usually
separately from and often before visual design.

**Us: ✗ as a separate stage.** Copy is generated *inside* stages 5 and 6, interleaved with layout and
theme application. The skill mitigates this by writing the home page plus the densest page first and
taking corrections (`SKILL.md:269`), which is a good checkpoint — but it is one checkpoint carrying
two kinds of feedback.

The practical symptom: a human reviewing stage 5 sees words and layout at once and tends to comment on
whichever is more wrong, so the other silently ships. A studio separates them precisely because a copy
note and a layout note travel to different people.

Note this cuts against the "content → structure → look" principle the pipeline is built on. Content
inventory precedes structure (good), but the actual *writing* happens after look is locked.

### 9. Design system / component documentation
**Studio artifact:** a component library with usage rules.

**Us: ✅ — structurally better than a studio deliverable.** The catalog is executable
(`renderer/src/blocks/`, 26 blocks), the contract is served live over MCP (`catalog_list`,
`theme_contract`), and prop shapes are versioned with migrations
(`renderer/src/blocks/shared.ts` deprecations + `renderer/tools/migrations.ts`). A studio hands over a
Figma file that goes stale; this cannot.

### 10. Build
**Studio artifact:** the site.

**Us: ✅.** `platform/src/build.ts`.

### 11. QA
**Studio artifact:** a QA pass — cross-browser, responsive, accessibility, link check, form test.

**Us: ✅ for design QA, ◐ for accessibility, ✗ for functional QA.**

`SKILL.md:309` is a strong nine-item design QA pass — four widths, content extremes, contrast per
tone, slop tells, images-off read, greyscale + squint, tap targets and focus, nothing hidden at rest,
tokens vs `theme.direction`. Items 3, 7 and 8 cover the accessibility failures that actually occur.

What is not covered: no formal WCAG conformance claim, no accessibility statement page, no link check,
no cross-browser pass, and **no form test — because there is nothing to test**. See stage 12.

### 12. Launch
**Studio artifact:** a launch checklist. This is where our coverage is thinnest, so itemised:

| Launch item | Us | Evidence |
|---|---|---|
| `sitemap.xml` | ✅ | `platform/src/build.ts:206` |
| `robots.txt` | ✅ | `build.ts:208` |
| `llms.txt` | ✅ | `build.ts:209` |
| canonical, description, OG/Twitter tags | ✅ | `build.ts:179-185` |
| JSON-LD | ✅ | `build.ts:20` via `./seo` |
| **OG image** | ◐ | `build.ts:184` emits the tag only `if (meta.ogImage)`. Nothing *generates* one, so a bundle without an authored image ships with no social card |
| **favicon / touch icon / webmanifest** | ✗ | no hit for `favicon` or `manifest` in `build.ts` |
| **redirects from the old site** | ✗ | no hit for `redirect` anywhere in `platform/`. For a *redesign* — which most client work is — this is the item whose omission actually loses traffic |
| **contact form delivery** | ✗ | `renderer/src/blocks/ContactForm.tsx` declares `action: { label }` only (line 13) and renders a bare `<button type="submit">` (line 38). No endpoint, no method, no success state, no spam handling. The form is decorative |
| analytics / consent | ✗ | none |
| 404 page | ✗ | not a page key convention anywhere in the specs |
| privacy / cookie policy | ◐ | footer can link one (`SKILL.md` legal example), but no page is required or generated |
| DNS / TLS / hosting cutover | — | platform concern, out of bundle scope |

Malaysian statutory footer compliance (`SKILL.md:120`) *is* handled and validator-enforced — good, and
notably ahead of most studios.

### 13. Iterate
**Studio artifact:** a post-launch review, usually 4–8 weeks out.

**Us: ✅ in design.** Stage 10 (`docs/how-a-site-gets-generated.md:237`) — p75 CWV plus scroll depth
feeding the next rebuild. Worth confirming separately whether it is implemented or only specified.

### 14. Content governance / handover
**Studio artifact:** a CMS and training, or a documented edit path.

**Us: ✗ / deliberately deferred.** Covered as an open question in
`docs/research/2026-09-07-maintainable-generation.md` §5 ("minimum viable content editor"). Not a
process gap so much as an unbuilt product surface.

---

## Summary — ranked gaps

Ranked by how much the absence changes the finished site.

1. **Messaging hierarchy (stage 2) — ✗.** No positioning artifact. Section roles and headlines are
   both downstream of a claim structure that is never written down. Biggest leverage.
2. **Launch checklist (stage 12) — mostly ✗.** Redirects and a working contact form are the two that
   cause real, measurable client harm. `ContactForm.tsx` submitting nowhere is a defect, not a gap.
3. **Copy as its own reviewed artifact (stage 8) — ✗.** Copy and layout are approved in one
   checkpoint; one of the two always gets the shallower read.
4. **Discovery answers persisted (stage 1) — ◐.** The right questions are asked and the answers are
   thrown away.
5. **Category default persisted (stage 3) — ◐.** Apply the `theme.direction` pattern to the do-not
   list so stage 7 can audit against it.
6. **Formal accessibility conformance + link/form QA (stage 11) — ✗.** Design QA is strong; functional
   QA does not exist.

Stages 4, 5, 7, 9, 10, 13 need nothing.

---

## Method note

Every "us" claim above was checked against a file in this repo at the path cited, on 2026-09-08, not
recalled. The studio-side account is standard practice and is not sourced to a URL; where it matters,
the claim is about what artifact exists, which is verifiable independent of any one studio's habits.
