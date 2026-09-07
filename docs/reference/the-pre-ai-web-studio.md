# The pre-AI web studio

How humans designed and built websites before generative AI — the pipeline, the tools that
shaped it, and the do/don't rules each role earned the hard way.

Markdown twin of `the-pre-ai-web-studio.html`. Section-selection and motion detail live in
`choosing-sections-and-motion.md`.

---

## 1. The pipeline a studio actually runs

Seven phases, in order, because each one's output is the next one's input. Durations are typical
agency figures for a 12–24 week marketing site; a product team compresses these into sprints but
does not skip them.

| # | Phase | What happens | Artifact | Typical |
|---|---|---|---|---|
| 01 | Discovery & research | Stakeholder interviews, competitor teardown, analytics of the old site, user interviews. Ends with agreement on *who this is for and what one action matters* — not on any visual | Creative brief, personas, JTBD statements, success metrics | 2–3 wk |
| 02 | Information architecture | Card sorting, tree testing, content inventory. Every page gets an owner and a word count before anyone draws a box | Sitemap, user flows, content matrix, URL scheme | 1–2 wk |
| 03 | Wireframes | Greyscale, no type personality, no photography. Deliberately ugly so review is about hierarchy, not colour. Cheap to throw away — that's the point | Low-fi wireframes at 2–3 breakpoints, annotated states | 2–3 wk |
| 04 | Visual design / comps | Art direction lands: type scale, palette, grid, photography treatment, motion language | Style tiles, hi-fi mockups, design tokens, component library | 2–4 wk |
| 05 | Prototype & validate | Clickable flow tested with 5 users per round. Fix in the prototype, where a change costs an hour instead of a sprint | Interactive prototype, usability findings, revised screens | 1–2 wk |
| 06 | Build | Components first, pages second. Real CMS content loaded early, because real copy breaks layouts that lorem never does | Coded component library, CMS models, staging env | 4–8 wk |
| 07 | QA, launch, iterate | Device matrix, keyboard + screen-reader pass, performance budget, redirect map for every old URL | QA matrix, a11y audit, redirect map, analytics | 1–2 wk + ongoing |

---

## 2. How the tools changed the flow

| Era | Shift | Tools |
|---|---|---|
| 1995–99 | Print workflow, web output. Layouts nested in `<table>` with `spacer.gif`; fixed-width pages treated the browser as paper | Photoshop 5.5 + ImageReady, "Save for Web" (1999), slicing |
| 2000–06 | CSS separates structure from presentation. "PSD to HTML" becomes a job title — one person draws, another rebuilds in markup | CSS 2.1, float layouts, Dreamweaver, Firebug |
| 2007–09 | The grid era: 960px, 12 columns, everywhere. Handoff became mechanical — and every site of the period looked related | 960.gs, Blueprint, jQuery |
| 2010–12 | Responsive breaks the comp. Marcotte names RWD (2010): fluid grid, flexible images, media queries. A static comp can't describe a page with no fixed width, so studios adopt style tiles, element collages, designing in the browser | Media queries, mobile-first, Bootstrap |
| 2013–17 | Symbols and the design system. Sketch makes reuse the default unit of design; atomic design gives design and dev one vocabulary | Sketch, InVision, Zeplin, Atomic Design |
| 2018–26 | Multiplayer, token-driven. Figma kills version-conflict handoff; components + variants + variables map near 1:1 onto coded components and CSS custom properties | Figma, design tokens, Storybook, visual regression in CI |

> **The lasting lesson of responsive design: a page is not a picture.** Once the deliverable stops
> being a fixed image, the deliverable becomes the system that generates images.

---

## 3. UX designer — structure, flow, research

Rooted in Nielsen's 10 usability heuristics (1994) — still the working checklist because they
describe human memory and attention, not any interface fashion.

| Do | Don't | Why |
|---|---|---|
| Decide the page's single job before drawing, and let one primary action own the hierarchy | Start in a visual tool — colour and type crowd out structure and always win | Two equal CTAs means the page has no CTA |
| Show system status: loading, saving, saved, error — feedback within ~1s or a spinner | Leave an action with no acknowledgement | Heuristic 1, visibility of system status |
| Use the user's vocabulary — people manage *notifications*, not *webhook configs* | Name things after the system's internals | Heuristic 2, match to the real world |
| Give every destructive path an exit: undo, confirm, or back | Assume the user meant to get here | Heuristic 3, user control and freedom |
| Show in step 4 whatever was entered in step 2 | Rely on recall across steps | Heuristic 6, recognition over recall |
| Keep patterns consistent — same control, same place, same word | Invent a bespoke pattern where a convention exists | Heuristic 4, consistency and standards |
| Test 5 users per round, then fix and re-test | Treat stakeholder opinion as user data | Rounds beat sample size; the loudest voice isn't the segment |
| Design empty, loading, error, partial and overflow states with the happy path | Design only the state where everything went right | Real content is uneven; only mockups are tidy |
| Write errors that name cause *and* fix — "Card declined — try another card or contact your bank" | Ship "Something went wrong" | Heuristic 9, help users recover |
| Walk every flow keyboard-only before handoff | Ship an untested keyboard path | Keyboard traps are found in 30 seconds or never |
| Label icon-only controls, or give them an accessible name | Use mystery-meat navigation | An icon is a mnemonic, not a definition |
| Prevent the error (constrain input, sane defaults) | Rely on validating it afterwards | Heuristic 5, error prevention beats error messages |

### The UX artifacts, and what each is *for*

- **Personas / JTBD** — a tiebreaker for scope arguments, not decoration. If it never settles an
  argument, it wasn't worth making.
- **User flow** — one diagram per task, showing decision points and failure branches. The failure
  branches are the value; happy paths design themselves.
- **Sitemap** — URL structure and nav grouping, agreed *before* wireframes so navigation labels
  aren't invented during visual design.
- **Wireframe** — hierarchy and sequence only. Greyscale is a discipline, not a limitation.
- **Prototype** — the cheapest place a flow can be wrong.

---

## 4. UI / visual designer — type, colour, grid, system

The craft layer. Most of what separates a designed page from a generated one lives in spacing
discipline and type scale, not in the palette.

| Do | Don't | Why |
|---|---|---|
| Set a type scale (e.g. 1.2/1.25 ratio) and a 4 or 8px spacing scale, then stay on both | Nudge values per element until it looks right | Arbitrary values are what "unpolished" actually means |
| Keep running text 45–75 characters per line | Run paragraphs the full width of a desktop container | Long measures lose the line on return sweep |
| Body copy ≥16px on mobile | Set 14px body text on forms | Below 16px, iOS Safari zooms the page on input focus |
| Use 2–3 typefaces max, ~4 weights | Add a face for variety | Contrast comes from size and weight; each face costs 30–120 KB |
| Pair status colour with icon, label or shape | Encode meaning in colour alone | ~8% of men can't separate your red from your green |
| Design mobile-first, let layout earn extra columns | Design 1440px first and squeeze it down | Constraint sorts the hierarchy for you |
| Use the client's real longest product name and worst photo | Design against lorem and perfect crops | Real copy is the stress test the comp skipped |
| Name tokens by role — `surface-raised`, not `grey-200` | Name tokens by value | Role names survive a rebrand; hex names don't |
| Spend border/fill/radius/shadow by role | Put a border, radius and shadow on everything | If every block is a card, nothing is emphasised |
| Give interactive elements all five states: rest, hover, focus-visible, active, disabled | Design the rest state only | Focus is the one everyone forgets and auditors check first |
| Make motion explain a relationship, 150–300ms, with a reduced-motion path | Animate for its own sake | See `choosing-sections-and-motion.md` §B |
| Hand over components, variants, tokens and usage rules | Hand over a pixel-exact comp for one width | The gaps get invented by whoever builds it |
| Check contrast in the design tool, before build | Leave contrast to the a11y audit | A palette that fails is a rebrand, not a bug fix |

### The visual system, in the order it gets built

1. **Grid & spacing** — column count per breakpoint, gutter, page margin, and one spacing scale.
   Everything else sits on this.
2. **Type scale** — one ratio, 5–7 steps, each with a line-height and a max measure. Decide the
   heading/body pairing here, not per page.
3. **Colour** — neutrals first (they're 90% of the pixels), then one accent, then semantic colours
   (success/warning/danger) kept separate from the accent.
4. **Elevation & shape** — radius scale and 2–3 shadow levels, each meaning a specific z-relationship.
5. **Components** — built from 1–4, never with new one-off values.
6. **Motion** — durations and easings as tokens, applied by role.

A useful gut check: **colour carries the least identity; layout selection and tone rhythm carry
the most.** Two sites with the same palette and different layout maps read as different companies;
the reverse does not.

---

## 5. Frontend developer — markup, performance, resilience

| Do | Don't | Why |
|---|---|---|
| Reach for the semantic element first: `button`, `nav`, `main`, `label`, headings in order | Rebuild a native control from `div`s + ARIA | ARIA patches semantics, never adds behaviour. No ARIA beats bad ARIA |
| Set a performance budget in CI and fail on regression (e.g. ≤400 KB gz JS) | Let the bundle grow unmeasured | Unbudgeted bundles only grow |
| Give every image/embed explicit `width`/`height` or `aspect-ratio` | Ship layout-shifting media | This is most of a bad CLS score |
| Build components once, feed them data | Hand-write per-page markup | Bespoke markup can't be patched fleet-wide; it has no undo |
| Test latest 2 versions of Chrome/Safari/Firefox/Edge + a real low-end Android | Test on your laptop only | Your machine is not the p75 device |
| `font-display: swap`, preconnect, metric-compatible fallback | Block first paint on webfonts | Invisible text is a blank page to the user |
| Validate server-side as well as client-side; escape output | Trust any client value | Client validation is UX; server validation is security |
| Server-render what can be read as HTML | Require JS for content | Crawlers, slow links and JS errors all read HTML |
| Measure with field data (RUM at p75) | Judge by one lab run | Lab scores flatter; field scores rank |
| Bake a11y into the component, once | Schedule an "audit sprint" before launch | Retro-fixing 40 pages costs 40× fixing one component |

---

## 6. The numbers people actually check (2026)

| Metric | Target | Fails on | Standard |
|---|---|---|---|
| Largest Contentful Paint | ≤ 2.5 s | Unoptimised hero image, render-blocking CSS/JS | Core Web Vitals |
| Interaction to Next Paint | ≤ 200 ms | Long main-thread tasks, heavy hydration | Core Web Vitals |
| Cumulative Layout Shift | ≤ 0.1 | Images without dimensions, late banners, font swap | Core Web Vitals |
| Text contrast | ≥ 4.5 : 1 | Grey-on-grey body copy, placeholder text | WCAG 2.2 AA · 1.4.3 |
| Large text (≥24px / 18.66px bold) | ≥ 3 : 1 | Tinted headings over photography | WCAG 2.2 AA · 1.4.3 |
| UI & focus indicator contrast | ≥ 3 : 1 | Hairline borders, default focus ring on dark | WCAG 2.2 AA · 1.4.11 |
| Target size | ≥ 24 × 24 px | Icon-only buttons, dense table row actions | WCAG 2.2 AA · 2.5.8 |
| Dragging movements | Alternative required | Drag-only reorder, slider with no keyboard input | WCAG 2.2 AA · 2.5.7 |
| Line length | 45–75 chars | Full-width paragraphs on desktop | Typographic convention |
| JS budget, interactive page | ≤ 400 KB gz | Whole-library imports, duplicated polyfills | Common engineering budget |

---

## 7. The handoff contract

Where handoff fails, it's almost always one of these six being assumed rather than stated.

1. **Tokens, not values** — colour, spacing, radius, type scale, motion as named variables that map to CSS custom properties.
2. **States, all five** — rest, hover, focus-visible, active, disabled; plus empty, loading, error for any data view.
3. **Breakpoint behaviour** — what reflows, what hides, what reorders. Two widths designed, the rule stated for everything between.
4. **Content rules** — max characters per field, truncate vs wrap, what happens when the image is missing or portrait.
5. **Accessible names** — the label a screen reader announces for every icon-only control, and the page's heading order.
6. **Back from the dev** — what was impossible or expensive, and what shipped instead, so the design file matches production.

---

## 8. What generation changes, and what it can't

- **Compressed:** phases 03–04. Wireframes and comps used to cost weeks; generation makes them
  minutes, so their value shifts from production to *selection*.
- **Unchanged:** phases 01–02. Discovery and IA depend on facts only the client holds — legal name,
  real prices, actual staff, what the business sells. Nothing invents those safely.
- **Heavier, not lighter:** phase 07. Same QA matrix, keyboard pass and performance budget, plus
  the new job of checking nothing was fabricated.
- **The new failure mode:** plausible sameness. Human studios diverged because they had different
  clients, constraints and taste; a model's first proposal is the mode of its training data — so
  generate several directions and deliberately discard the likeliest.
- **The durable rule:** ship a system, not pages. Bespoke markup couldn't be patched fleet-wide in
  2005 and still can't in 2026 — which is why generated sites should be structured content plus a
  swappable theme, never hand-written HTML.

---

## Sources

1. [The 7 Key Stages of Every Web Design Process](https://cliquestudios.com/university/resources/web-design-process) — Clique Studios
2. [Prototype vs. Wireframe vs. Mockup](https://www.uxpin.com/studio/blog/prototypes-wireframes-mockup-difference/) — UXPin
3. [Jakob Nielsen's 10 Usability Heuristics](https://ux247.com/usability-principles/) — UX24/7
4. [A Brief History of Responsive Web Design](https://www.freecodecamp.org/news/a-brief-history-of-responsive-web-design/) — freeCodeCamp
5. [Photoshop Etiquette for Responsive Web Design](https://www.smashingmagazine.com/2016/08/photoshop-etiquette-for-responsive-web-design/) — Smashing Magazine
6. [Design Systems: From the Basics to Big Things Ahead](https://www.figma.com/blog/design-systems-from-the-basics-to-big-things-ahead/) — Figma
7. [Web Development Best Practices 2026](https://pagepro.co/blog/web-development-best-practices/) — Pagepro
8. [Web development best practices: a 2026 engineering guide](https://www.netguru.com/blog/web-development-best-practices) — Netguru
