# Why generated themes come out warm, and why they read as slop

R&D, 2026-09-10. Question asked: the pipeline keeps producing warm palettes and the results feel
machine-made. What in the system causes it, and what fixes it.

Outcome: `skills/create-webpage/references/palette.md`, linked from `SKILL.md` and
`art-direction.md`. This file is the reasoning; the reference is the procedure.

## The claim is real, but the archive is not the evidence

Measured hue, saturation and lightness of every token in `dev/fleet-archive/*/theme.json`:

| theme | `--color-bg` | ground temp | accent |
|---|---|---|---|
| aonic | `#F3F4F6` h220 s14 | cool | `#F26522` h19 (warm) |
| firstmetrology | `#FFFFFF` | none | `#0066CC` h210 |
| gmr | `#FFFFFF` | none | `#0033A0` h221 |
| merryfair | `#FBFAF7` h45 s33 | **warm** | `#7BB241` h89 |
| merryfair-dense | `#E7E4DB` h45 s20 | **warm** | `#7BB241` h89 |
| merryfair-industrial | `#E7E4DB` h45 s20 | **warm** | `#7BB241` h89 |

Three of six are warm, and all three are the same client. The archive is not a uniform warm fleet —
which matters, because it means the cause is not "the fleet is warm so new sites copy it". The cause
sits upstream of the output, in how the theme step is instructed.

## Four mechanisms, compounding

### 1. Colour is ranked last, and *last* is read as *unconsidered*

`art-direction.md` ranks the levers that create difference and puts colour fifth: "last, and least".
That ranking is correct — layout map and tone rhythm genuinely carry more identity. But the model
allocates deliberation by rank. Ranked last, the eleven colour tokens get no sampling step, no
alternatives, no rejection note — while `--scale-ratio`, `--density`, `--motion-*` and `--radius-*`
each get a typical range and a sentence on what they decide.

An unthought decision is not a neutral decision. It is the prior emitted verbatim. The prior for
"premium / considered / editorial / craft" is a warm off-white ground with a yellow-trace near-black
ink, because that is the dominant register in the design work the model has read — and it is the
house style of the tool doing the generating.

### 2. Every colour rule in the system is negative, and negative rules are satisfied by the nearest neighbour

The slop-tells list bans `#F4F1EA` with `#D97757`, and bans indigo. It never says how to *build* a
palette. Given a ban and no procedure, the cheapest satisfying move is to shift a few degrees of hue
and a couple of points of chroma — `#FBFAF7`, `#F7F5F1`, `#E7E4DB` — all of which clear the ban and
none of which leave the neighbourhood. The ban removes one address, not the street.

Everything else in the theme contract has a positive form: ranges, a "typical" column, a worked
example. Colour has one WCAG sentence and a do-not list.

### 3. Enforcement is asymmetric — the cool tell is checked, the warm one is not

`slopTells()` in `renderer/src/validate-bundle.ts` checks three things from `theme.json`: uniform
non-zero radius, an accent in the indigo/violet band (hue 235–285) against neutrals, and monospace on
label tokens. Plus an info-level nudge when no structural token is set.

There is no check on ground temperature, no check on chroma, no check on hue unity across the
neutrals. So the **only mechanically punished palette direction is the cool one**. A warm ground at
s20–s33 passes in silence. A validator that flags indigo and ignores cream applies a steady pressure
toward warm on every run, independent of anything in the prose.

### 4. The worked example is a warm example, and worked examples out-pull prose

`SKILL.md`'s stage-3 sample tiles list "**B** Warm editorial — Fraunces 300, 1.414 scale, loose
density, soft shadows, cream ground". `art-direction.md`'s sampling table opens with "Warm minimal
serif, soft shadows, pill buttons — ~45% — the mode, reject". And merryfair, the most-referenced site
in the repo, *is* that direction, shipped.

`art-direction.md` already documents this failure mode for structure — "the example below is a mode
generator, read it then go somewhere else", after three blind runs landed on the worked example. The
same effect operates on colour, and there is no equivalent warning there.

## Beyond warm: what the "slop" texture actually is

Temperature is the symptom people name. Four other things do more of the work:

- **Hue drift across the neutrals.** A ground at h45 with an ink at h220 — two tints fighting,
  neither committed. This is the most common reason a page reads faintly dirty with no nameable
  cause, and nothing in the system checks it.
- **Tinted grounds.** A near-white carrying real chroma tints every photograph laid on it. HSL
  saturation is useless for catching this (`#FBFAF7` reads as s33 and is nearly colourless), which is
  why the new reference specifies **RGB channel spread** instead — readable straight off the hex.
- **Contrast landing on the floor.** WCAG minima are a floor, not a target. Ink at 7:1 reads washed
  out on any screen that is not the author's; designed work sits at 12–17:1.
- **Accent as decoration.** A brand colour applied everywhere it fits stops meaning "act here". The
  system says "once or twice per page" for tones and says nothing about the accent's total spend.

## What was shipped

`skills/create-webpage/references/palette.md`:

1. **Select a neutral family from four** — Paper white, Cool grey, Bone, Ink-first — with exact hex
   for bg/surface/ink/muted/line, rather than composing a ramp. Composing is where the prior
   re-enters; selecting from a bounded set is where it cannot. Bone is one of four and requires a
   stated reason from the brief.
2. **Hue unity ±10° across every neutral**, with pure grey exempt.
3. **Chroma ceiling as channel spread** — a ground may spread at most `0x0A`. Verified: `#F8F6F1`
   spreads 7 (passes), `#E7E4DB` spreads 12 (fails), which is the discrimination wanted.
4. **Ink is the family hue at L 8–12%**, never `#000`; `--color-line` is derived from ink at
   0.12–0.16 alpha rather than picked.
5. **Accent as a spend budget** — one accent, two or three uses per page, `--color-accent-ink`
   mandatory when accent text sits on a light ground, and a second banned band (hue 12–28 at high
   chroma — terracotta, the warm half of the indigo tell).
6. **Five contrast pairs as bands, not floors**, with the numbers.
7. **`direction.palette.rejected`** written into `theme.json` — the only artefact that distinguishes
   a selection from an emitted prior.

Contrast and hue for all four families were computed, not asserted: ink-on-bg lands 16.1–17.8:1 and
muted-on-bg 5.2–7.1:1 across the set, inside the stated bands.

## Recommended next, not done here

- **A validator check for the warm side**, to remove the asymmetry in mechanism 3. Three cheap
  additions to `slopTells()`, all warning-level: ground channel spread over `0x0A`; neutral hue
  spread over 20°; an accent in hue 12–28 at s > 60 against neutrals. Without this, the guide is
  prose competing with a validator that pushes the other way — and the validator wins.
- **Ship it.** `plugin/skills/` is an rsync target of `skills/`, so the guide does not reach a
  creator on claude.ai until `./skills/install.sh` runs and the plugin version is bumped — see
  `docs/plugin-release-sop.md`. Left undone deliberately: a release is a version decision.
- **Re-balance the worked examples.** Stage 3's three sample tiles should not lead with a cream
  ground, and `art-direction.md`'s "the example is a mode generator" warning should be repeated over
  the colour section.
