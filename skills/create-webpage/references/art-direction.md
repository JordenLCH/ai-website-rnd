# Art direction

`theme.json` is where a site gets its identity. It has two parts:

```jsonc
{ "name": "acme-industrial",
  "tokens": { "--color-bg": "...", "--font-display": "...", ... },   // 39 tokens
  "sectionStyles": {                                                 // slug -> resolution
    "hero/home": { "layout": "overlay-fullbleed", "tone": "inverse" },
    "hero/statement": { "layout": "centered-poster", "tone": "default",
                        "vars": { "--display-size": "clamp(3rem, 9.5cqi, 7.4rem)" } } } }
```

Every slug used anywhere in `site.json` must exist here. `vars` overrides tokens **for that section
only** — the escape hatch for a signature moment without touching any code.

## What actually creates difference

Ranked by how much visual identity each one carries. This ordering is measured, not intuition —
teams reliably over-invest in colour and under-invest in the top three.

1. **Layout selection per slug** — which of a block's layouts each role resolves to
2. **Tone assignment** — which sections go `inverse` / `accent` / `surface` rather than `default`
3. **Font pairing + display weight** — 800 vs 300 changes a brand more than any hue
4. **Vertical rhythm and radius** — `--pad-y` 104px vs 156px, `--radius` 0 vs 18px
5. **Colour roles** — last, and least

A theme that only changes colours will look like the same site in a different shirt. If two of your
themes share a layout map, they are the same theme.

## Tokens

**Colour (11):** `--color-bg --color-surface --color-ink --color-muted --color-line --color-accent
--color-on-accent --color-inverse-bg --color-inverse-ink --color-inverse-muted --color-inverse-line`

**Type (4 + 9):** `--font-display --font-body --font-eyebrow --font-numeral` ·
`--display-size --display-weight --display-tracking --display-leading --heading-size
--eyebrow-transform --eyebrow-tracking --eyebrow-size` · `--body-size --lede-size --body-leading`

**Form (11):** `--radius --radius-img --border --pad-y --gap --maxw --shadow --btn-radius --btn-pad
--btn-weight --img-filter`

**Scene (2):** `--hero-min` (hero height in `cqi`), `--overlay` (gradient over hero photos)

Sizes use `clamp()` with `cqi` units so sections survive being rendered at any width — editor panes,
previews, split views. Media queries would break those; container units don't.

`--color-on-accent` must have real contrast against `--color-accent`. A mid-green with white text
fails WCAG; use a near-black instead. Check it rather than assuming.

## Tones

Each section resolves to one tone, which rebinds `--bg/--ink/--muted/--line/--btn-bg/--btn-fg`:

- `default` — page background
- `surface` — the raised/card colour, for a quiet change of register
- `inverse` — dark on light themes, light on dark ones
- `accent` — brand colour as the field; text flips to `--color-on-accent`

Design the tone *rhythm* for the page, not section by section. A workable default: lead inverse,
one accent band as punctuation, everything else alternating default/surface. Using accent more than
once or twice per page turns a brand colour into wallpaper.

## Choosing a direction: sample, don't settle

The first art direction a model proposes is the mode of its training distribution — which is exactly
why so many generated sites look alike. Mode collapse is measurable, and the cheap fix is
**verbalized sampling**: produce several candidates *with self-assessed probabilities*, then choose
deliberately from the tail.

Do this:

1. Write **four** directions, one line each, with a rough probability you'd have produced it by default.
2. Discard the highest-probability one on principle — that's the template.
3. Pick from the tail whichever genuinely suits the client's category, buyers and assets.
4. State the four and your pick in one short paragraph, so the choice is reviewable.

Worked example, furniture manufacturer:

| Direction | Self-assessed | Verdict |
|---|---|---|
| Warm minimal serif, soft shadows, pill buttons | ~45% | the mode — reject |
| Swiss industrial catalogue: condensed caps, hairlines, zero radius, spec-sheet numerals | ~15% | **picked** — matches a 50-year manufacturer and its spec-buying audience |
| Dark material study, photography-led | ~25% | plausible, weaker for spec buyers |
| Editorial magazine | ~15% | too close to the mode |

Adopting a distinct *persona* per client before designing also measurably widens the spread — "you
are an art director who works mainly on industrial catalogues" produces different output from a
neutral prompt.

## Slop tells to avoid

These read as machine-made because they are the defaults everything converges on:

- Beige-and-terracotta palettes (`#F4F1EA`, `#D97757` and neighbours)
- Purple-to-blue gradients on everything
- Rounded pill buttons plus large blur shadows on every card
- Emoji as section icons
- Centre-aligned everything, all sections at identical rhythm
- Generic Inter/Poppins for both display and body
- Full-width hero, three feature cards, testimonial, CTA — in that order, every time

None of these are forbidden individually. The tell is using several together with no reason.

## Keeping a fleet distinct

When generating for a client who already has siblings in the fleet, read the existing themes first
and diverge deliberately: a different layout map, a different font class, a different tone rhythm.
Two sites that share a layout map will read as the same template no matter how far apart their
palettes are.
