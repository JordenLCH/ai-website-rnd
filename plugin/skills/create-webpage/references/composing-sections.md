# Composing sections — `FreeSection` first, typed blocks where they earn it

Referenced from `SKILL.md` stage 5. Read before writing the first page.

## Composing sections: reach for `FreeSection` first

Twenty-four blocks, two or three layouts each, and every site in the fleet drawing from the same
bag is *why generated sites resemble each other*. A typed block is a decision somebody else already
made about what that section looks like; a page assembled entirely from them is a page nobody
designed. `FreeSection` is the answer, and it is not an escape hatch — **it is the default for any
section that carries the site's identity.**

It is not bespoke markup. It is pure JSON, themed by the same tokens, validated by the same
validator, and patched by the same fleet sweep. What it does *not* inherit is a fix to a typed
block's internals — which only matters for the sections listed below.

```jsonc
{ "type": "FreeSection", "variant": "story/origin", "props": {
    "role": "story",                                  // required — see below
    "grid": { "cols": 12, "gap": "lg", "pad": "xl", "align": "start" },
    "bg": { "image": "...", "kind": "environment", "overlay": true, "parallax": 0.2 },
    "children": [ /* Stack | Row | Grid | Card | Heading | Text | Eyebrow | Quote | Button |
                     Image | Stat | List | Figure | Caption | Badge | Marker | KeyValue |
                     Carousel | Divider | Spacer | Field */ ] } }
```

### The six sections that must stay typed, and exactly why

The build farm derives structured data by looking up **block type**. `FreeSection` is read for the
page's outline, its meta description and its OG image — `role: "hero"` is understood — but every
typed derivation below is a `first(page, '<Type>')` lookup, so a `FreeSection` in its place emits
nothing and says nothing about it.

| Keep the typed block | What is lost otherwise |
|---|---|
| `Locations` | `LocalBusiness` + `PostalAddress` — local pack eligibility |
| `SpecTable` / `CatalogGrid` | `Product` + `additionalProperty` — the one rich result still live |
| `Hero` (when it carries `breadcrumb`) | `BreadcrumbList` — the SERP trail |
| `Testimonials` | `Review` — comprehension only, and stripped when `unverified` |
| `FAQ` | `FAQPage` — no rich result since 2026-05-07, still machine-readable |
| `Steps` | `HowTo` — retired 2023, same status |

The first three are worth real money and the rule is simple: **anything a machine has to read stays
typed; everything else is yours.** Range, proof, story, process copy, CTAs, the parts of a page a
person forms an opinion from — compose those freely.

`role` is required on every `FreeSection` and is not decoration: it is what survives free
composition for the house rules, and for the hero it is what the meta description and OG image are
read from. One of `hero · proof · range · story · spec · quote · process · contact · cta · nav ·
footer · media`.

> **Known gap, worth knowing before you rely on it.** `FreeSection`'s schema comment says role is
> what "JSON-LD and house rules depend on", but `platform/src/seo.ts` only acts on `role: "hero"`.
> A `role: "spec"` or `role: "contact"` section produces no typed schema today. The comment promises
> more than the code delivers — which is the reason for the table above rather than a note saying
> "set the role and you're fine".

### What keeps free composition from becoming slop

These are enforced, and each exists because it broke something real:

- **Nesting depth ≤ 5.** Flatten it.
- **Exactly one level-1 `Heading` in the hero, and none anywhere else.**
- **One display-size heading per section** (`Stat` is exempt — a row of figures is one gesture).
- **`span` only means something inside a `Grid`** or at the top level of the section. On a child of a
  `Stack` it creates implicit columns and lays the stack out sideways: it renders, it validates, and
  it looks like a stylesheet bug.
- **At most 8 animated nodes** in a section.
- **A `Text` node over 420 characters** needs splitting, or `role: "story"`.
- **An overlay background needs `kind: "environment"`** — a cutout under text is unreadable.

### Still propose a new block when the shape recurs

If the same composition shows up on a third site, that is a block, not a FreeSection. Propose it to
the shared catalog as a change request. What you must never do is write component code inside a
client site — that cannot be patched centrally and it will drift.
