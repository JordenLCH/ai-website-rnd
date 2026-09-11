# Art direction

`theme.json` is where a site gets its identity. It has two parts:

```jsonc
{ "name": "acme-industrial",
  "tokens": { "--color-bg": "...", "--font-display": "...", ... },   // 39 required + 43 optional
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
4. **Vertical rhythm, type ratio and radius pairing** — `--pad-y` 104px vs 156px, `--scale-ratio`
   1.2 vs 1.414, `--radius` 18px against a `--radius-tight` of 2px
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

**Structural (8, optional but the highest-leverage set):**

| Token | Typical range | What it decides |
|---|---|---|
| `--scale-ratio` | `1.2` – `1.5` | The type scale *ratio*, not a resolved size. 1.2 is tight and high-contrast; 1.414 is generous and editorial. This is the number a designer would name |
| `--density` | `0.7` – `1.4` | Multiplier on section padding. Set it **per section** via `vars` — uniform density across a whole site is itself a tell that nobody made a choice |
| `--motion-duration` | `280ms` – `700ms` | Half of the motion decision |
| `--motion-ease` | a `cubic-bezier` | The other half, and the one that carries personality — springy reads differently from soft. Both have defaults, so a theme that omits them still animates |
| `--grid-cols` | `6` – `16` | Column count for grid-aware layouts |
| `--breakout` | `0` – `18cqi` | How far a dominant image or pull-quote escapes `--maxw`. `0` means this theme never breaks the measure |
| `--radius-tight` | `0` – `8px` | The **small-surface** radius: chips, fields, table cells. Pairs with `--radius` for cards. One radius on every surface is the most mechanical-looking tell in generated design, and the validator flags it |
| `--elev-1` | a shadow | The near step. `--elev-2` defaults to `--shadow`, so cards sit close to the page and photographic media floats above it — two steps, not one shadow reused everywhere at 0.1 opacity |

These matter more than colour because a model can randomise a hex code plausibly, so palette
variation is the cheapest kind and reads as the same site recoloured. Ratio, rhythm and motion change
the page's structure, which is much harder to fake and much harder to mistake for another site.

Sizes use `clamp()` with `cqi` units so sections survive being rendered at any width — editor panes,
previews, split views. Media queries would break those; container units don't.

`--color-on-accent` must have real contrast against `--color-accent`. A mid-green with white text
fails WCAG; use a near-black instead. Check it rather than assuming.

**Colour ranks last here, and that is the reason it goes wrong.** *Last* gets read as *don't think
about it*, and an unthought palette is not a neutral one — it is the model's prior, which is a warm
off-white ground every time. `references/palette.md` is the positive procedure: four neutral families
to select from rather than compose, hue unity and a chroma ceiling you can read off a hex, the accent
as a spend budget, and the five contrast pairs. Read it before writing the eleven colour tokens.

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

**The procedure for stage 3 is not here — it is in `references/proposing-themes.md`.** Sampling
four candidates from one generator and dropping the likeliest was the old mechanism, and it was
weak: all four come out of one distribution, so rejecting the top one shifts the centre without
guaranteeing spread. Three blind runs of one brief produced three names for the same look. Themes
now come from **three objectives that pull apart by construction** — Measured, Fit, Spark. Read that
file before proposing anything.

What is still worth having from the old method is the *habit*: name the mode explicitly before you
choose, so that rejecting it is a decision rather than an accident. Stage 4 does the same thing to
home-page orderings, and SKILL.md carries that step inline.

Recognising the mode is the part that transfers. For a furniture manufacturer it looks like this:

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
- **Monospace for `--font-eyebrow` and `--font-numeral`.** This is the most-reached-for "technical"
  gesture and it is now the single strongest tell. Those two tokens feed roughly twenty call sites —
  eyebrows, stat figures, photo captions, product meta, footer headings, legal notes — so choosing
  mono once puts 30–45 monospaced elements on a page. Real manufacturer, law and clinic sites do not
  do this. Figures want `font-variant-numeric: tabular-nums`, not a second typeface, and the renderer
  already applies it. If a technical register is genuinely the direction, buy it with weight,
  tracking and rule-work; at most keep mono for step numbers and nothing else.

- **One radius on every surface.** A card, a button, an input and an image all at the same corner
  reads as a kit rather than a design — a person sizes the radius to the surface. Set `--radius-tight`
  below `--radius` and the tell disappears.
- **An indigo or violet accent against an otherwise neutral palette.** This is Tailwind's
  `bg-indigo-500` default and the loudest single tell of 2026. Use it only if the brand owns it.
- **A soft shadow at ~0.1 opacity on everything.** That is what CSS tutorials teach first, not an
  elevation system. Two steps (`--elev-1`, `--elev-2`) is enough and reads as considered.
- **Weightless headline copy** — "Build faster. Ship smarter." If the headline stays true with a
  competitor's name in place of the client's, it is decoration. This one is not visual and no
  validator can catch it.

None of these are forbidden individually. The tell is using several together with no reason.

**Three of these are now checked mechanically** from `theme.json` alone — uniform radius, an
indigo-band accent on a neutral palette, and monospace confined to labels. They come back as
*warnings*, not errors, because each is fine when it was chosen and telling when it was defaulted
into, and a validator cannot tell those apart. Answer them with a reason or a change; do not clear
them by reflex.

## Two numbers to check before you commit a theme

Both were caught in review after three independent runs got them wrong the same way.

- **Display size against the column it sits in, not against the viewport.** A `--display-size` that
  resolves to ~100px inside a 560px hero column breaks a headline into six two-word lines. Divide the
  column width by the rendered size: fewer than about 18 characters per line means the type is too
  big for the space, however good it looks alone. `clamp(2.2rem, 5.4cqi, 4rem)` is a safe ceiling for
  a half-width hero; only go past it when the column is full-bleed.
- **Item counts against the grid they land in.** `hairline-catalog` is 3-up, `grid-hairline` is 4-up.
  Four products into a 3-up grid leaves a one-cell final row. The renderer now picks a column count
  that divides the items, but the composition still reads better when the count fits the grid — 4 or
  6 products, not 5 or 7.

## The example below is a mode generator — read it, then go somewhere else

A blind run building this exact client rejected the worked example below on the grounds that it *is*
the worked example, and still landed beside it. Three runs of the same brief produced three names for
one look: same block order, same layout map, same palette, same photographs in the same roles. Treat
what follows as the direction to beat, not the direction to take.

## Keeping a fleet distinct

When generating for a client who already has siblings in the fleet, read the existing themes first
and diverge deliberately: a different layout map, a different font class, a different tone rhythm.
Two sites that share a layout map will read as the same template no matter how far apart their
palettes are.
