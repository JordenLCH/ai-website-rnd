# Proposing three themes

Stage 3 currently samples four directions, discards the likeliest as "the mode", and presents the
remaining three. The intent is right and the mechanism is weak: all four candidates come out of one
generator with one objective, so rejecting the top one shifts the centre without guaranteeing spread.
The skill's own notes record the result — three blind runs of one brief produced three names for the
same look.

**Propose from three different objectives instead.** Candidates drawn from objectives that genuinely
pull apart cannot collapse into each other, which is a structural guarantee rather than a hope.

| | optimises | what it is for |
|---|---|---|
| **Measured** | processing fluency | the theoretically best page this brand colour allows — highest legible contrast, lowest-chroma ground, neutrals locked to the accent hue, ornament held down |
| **Fit** | prototypicality for the category | what this buyer expects, because expectation is reassurance when the buyer is de-risking |
| **Spark** | novelty, inside the same measured floor | the deliberate deviation — worth showing, not automatically worth shipping |

Present them in that order. Resolve **Fit first**, though: it is the most constrained — there is
usually exactly one shape a category expects — and letting an unconstrained principle pick ahead of
it strands the obvious answer. In testing, Measured took the serif editorial shape and pushed the
serif counsel shape out of a law firm's options, which is exactly backwards.

## State each one's cost

A pitch without a cost is decoration, and it makes the three unreviewable — everything sounds good.

- **Measured** — correct before it is memorable. Nothing will be mistaken for another company; nothing
  will be quoted back to you either.
- **Fit** — typicality is the point, so distinctiveness is what it spends. It will resemble the better
  sites in the field, which is both the intention and the risk.
- **Spark** — novelty reads as risk to someone de-risking a decision. Name the consequence level, and
  say plainly that this is the gamble.

## Force the three apart on the levers that carry identity

Three levers decide whether two themes read as different directions or one direction shown twice:

1. **polarity** — light ground / dark ground
2. **type class** — grotesk / condensed sans / serif
3. **rhythm** — even / soft / hard

**Two proposals matching on two of those three is a collapse.** Regenerate one. This is a comparison
between your own three candidates, not against the fleet, so it costs nothing to run and it catches
the failure the current sampling step cannot see.

Across a fleet there is a second collapse to catch, and per-shape divergence does not catch it: two
clients in one category can each pick a different-but-still-diverged shape at every slot and arrive
at the same *triple*. Check the triple as a unit, and re-resolve Spark — the freest slot — when it
collides.

## Audience: what it may and may not decide

**It decides typicality, density, contrast and what carries proof. It does not decide hue.**

Hue semantics — "blue means trust", "green means natural", warm yellow for anything involving
children — does not survive contact with the evidence. It is culture-bound and does not replicate,
and a generator built on it invents precision it does not have. Hue is the one colour fact a brief
actually gives you: it comes from the logo. Leave it there.

What does hold up is that preference tracks how easily a page is processed, and that the balance
between prototypical and novel shifts with how much a wrong choice costs the buyer. So four axes:

| axis | values | what it moves |
|---|---|---|
| `decides` | specification / affect | density — specification buyers read more per screen |
| `consequence` | 0–1 | the typicality target, and inversely the ornament budget |
| `proof` | data / photography / prose | which shapes can carry the argument at all |
| `cadence` | considered / quick | the ink contrast target |

Typicality target ≈ `0.35 + 0.5 × consequence`. **This is the whole reason a B2B supplier and a
consumer product page differ** — not that B2B buyers like grey, but that deviation costs more when
the buyer is de-risking a capital purchase. A furniture manufacturer specified into a project
(consequence 0.85) and a consumer product bought on impulse (0.3) sit at opposite ends, and every
structural decision follows from that one number rather than from a mood.

`proof` earns its place separately, and skipping it is expensive: without it, ties break by
declaration order. That handed a law firm a grotesk and gave five different clients the identical
"measured" shape.

**A warm ground is not how a brief becomes warm.** Warmth in an education or care brief belongs in
the photography, the room the layout leaves, and the type scale — the palette stays the brand's.

## Working reference

`dev/theme-bakeoff/` holds a runnable implementation: `audience.mjs` (categories and axes),
`propose.mjs` (the three objectives, orthogonality, fleet divergence), `build.mjs` (OKLCh derivation),
`color.mjs` (colour maths and contrast solving). `node emit2.mjs` writes fifteen proposals — five
clients, three principles — every one of which clears every band in `palette.md` and validates
against the live token contract and layout vocabulary.
