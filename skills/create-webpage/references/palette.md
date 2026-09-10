# Palette — building the eleven colour tokens on purpose

`art-direction.md` ranks colour **last** among the things that create difference. That ranking is
correct and it is also how every generated palette in this system went wrong: *last* got read as
*don't think about it*, and an unthought colour decision is not a neutral one — it is the model's
prior, emitted verbatim. This file is the positive procedure that was missing. Use it after the
layout map and tone rhythm are settled, and before you write `theme.json`.

## The failure this exists to stop

Three things compound into the same output every time.

1. **Warm off-white is the prior.** "Premium", "considered", "editorial" and "craft" all resolve to a
   cream ground (`#FBFAF7`, `#F7F5F1`, `#E7E4DB`) with a near-black ink carrying a trace of yellow.
   It is the most common register in the design work a model has read, and it is the house style of
   the tool generating it. It arrives without being chosen.
2. **The slop list is negative, and negative constraints get satisfied by the nearest neighbour.**
   `art-direction.md` bans `#F4F1EA` with `#D97757`. A model satisfies that by moving eight degrees
   of hue and two points of chroma, not by picking a different family. The ban removes one address,
   not the neighbourhood.
3. **Enforcement is asymmetric.** `slopTells()` flags the *cool* tell — an indigo accent — and has no
   check at all on a warm ground. So the only mechanically-punished direction is the cool one, and
   every run drifts to the unpunished side.

The fix is not "use cool colours". It is: **select a ramp, don't generate one**, and be able to say
which of four families you took and why this client is in it.

## Step 1 — choose a neutral family, from four

The ground, surface, line and ink tokens are not five independent decisions. They are one decision:
which neutral family this brand sits in. Pick one row, copy the hex values, then tune — do not
compose a ramp from scratch, because composing is exactly where the prior re-enters.

| Family | When it fits | `--color-bg` | `--color-surface` | `--color-ink` | `--color-muted` | `--color-line` |
|---|---|---|---|---|---|---|
| **Paper white** — no hue at all | precision, medical, legal, data; anywhere a tint would read as decoration | `#FFFFFF` | `#F4F5F6` | `#16181B` | `#5C6169` | `rgba(22,24,27,0.14)` |
| **Cool grey** — blue-leaning | engineering, software, security, transport | `#F5F7F9` | `#FFFFFF` | `#0F1723` | `#586475` | `rgba(15,23,35,0.15)` |
| **Bone** — warm, low chroma | craft, furniture, hospitality, food, heritage | `#F8F6F1` | `#FFFFFF` | `#1A1917` | `#6B675F` | `rgba(26,25,23,0.13)` |
| **Ink-first** — dark ground | a photography-led or nocturnal brand; the whole site is inverse | `#101214` | `#191C1F` | `#ECEEF0` | `#9AA0A7` | `rgba(236,238,240,0.16)` |

**Bone is one of four, not the default.** If you land on it, the direction paragraph must say what in
the *client* put you there — a material, a heritage date, a photographed workshop. "It felt premium"
is the prior talking. Four clients in a row on Bone means the selection is not happening.

Inverse tokens come with the family. For the three light families: `--color-inverse-bg` is the ink
value darkened to L≈8–12%, `--color-inverse-ink` is the bg value, `--color-inverse-muted` sits at
L≈62–68% on the same hue, `--color-inverse-line` is the inverse-ink at 0.16–0.20 alpha.

## Step 2 — one hue, one chroma budget

Every neutral in a theme must share a **single hue** and stay under a **chroma ceiling**. This is
what actually reads as clean; it is more of the effect than the hue choice itself.

- **Same hue on every neutral.** `--color-bg`, `--color-surface`, `--color-ink`, `--color-muted` and
  the inverse set all sit within **±10° of one hue**. A bg at h45 with an ink at h220 is the single
  most common reason a generated page looks slightly dirty for no nameable reason — two tints
  fighting, neither committed. A pure grey or pure white has no hue and is exempt; it pairs with any
  family, which is why Paper white is the safe answer when the brand does not supply one.
- **Chroma ceiling, measured as channel spread.** Read it straight off the hex: subtract the smallest
  RGB byte from the largest. **A ground (anything above L 90%) may spread at most `0x0A` (10/255).**
  `#F8F6F1` spreads 7 — a bone neutral. `#E7E4DB` spreads 12 — a pale yellow field, and it tints
  every photograph laid on it. Use channel spread rather than HSL saturation here: HSL saturation is
  meaningless near white (`#FBFAF7` reads as s33 and is almost colourless), so it will talk you into
  the wrong call in exactly the range grounds live in.
- **Ink is the ground hue, not black.** `#000000` is never right and a hue-mismatched near-black is
  worse. Take the family hue down to L 8–12%, s 6–14%.
- **`--color-line` is derived, not picked.** It is `--color-ink` at **0.12–0.16 alpha** on light
  grounds, 0.16–0.20 on dark. A hairline at 0.28 is a border pretending to be a rule; below 0.10 it
  disappears on a bad monitor.

## Step 3 — the accent is a signal budget, not a colour

- **One accent.** Not a pair, not a gradient. A second brand colour belongs in `--color-accent-ink`
  (the accent darkened for text on a light ground), not as a second field colour.
- **Spend it two or three times per page, total.** Counting: an accent-tone band, the primary button,
  and one marker or rule. Every third card carrying accent text is wallpaper, and wallpaper is why a
  brand colour stops meaning "act here".
- **`--color-on-accent` is computed, not assumed.** A mid-chroma accent (greens, oranges, yellows,
  most teals) fails white text. Put the accent's own hue at L 8–14% behind it instead — that reads as
  a considered pairing, white-on-mud reads as an oversight. Check the ratio, don't estimate it.
- **`--color-accent-ink` exists because accent-as-text almost never passes.** Set it whenever accent
  text appears on the default or surface ground: same hue, L pulled down until it clears 4.5:1.
- **Two bands to stay out of** unless the brand genuinely owns them: **hue 235–285** (Tailwind
  indigo — the validator flags it) and **hue 12–28 at s > 60** (terracotta — it is not flagged, and
  it is the warm half of the same tell).

## Step 4 — contrast as a band, not a floor

WCAG minima are a floor to clear, not a target to land on. Design work sits above them, and the
top of the range matters too.

| Pair | Aim for | Why not just the minimum |
|---|---|---|
| `--color-ink` on `--color-bg` | **12:1 – 17:1** | Under ~10:1 a page reads washed out on any screen that isn't the author's |
| `--color-muted` on `--color-bg` | **5:1 – 7:1** | 4.5 exactly is where "secondary" becomes "unreadable at 14px" |
| `--color-on-accent` on `--color-accent` | **≥ 7:1** | Buttons get hit at odd angles and in sunlight |
| `--color-accent-ink` on `--color-bg` | **≥ 4.5:1** | Accent as link and emphasis text |
| `--color-inverse-muted` on `--color-inverse-bg` | **≥ 4.5:1** | The pair most often skipped; inverse muted is where dark sections fail |

Check all five before writing the file. `design-qa` catches the failures at stage 7, but by then the
palette is load-bearing across sixty sections and moving it is a rewrite.

## Step 5 — say what you chose

Add to the `direction` block already going into `theme.json`:

```json
"direction": {
  "adjectives": ["quiet", "precise", "expensive"],
  "palette": {
    "family": "cool grey",
    "why": "calibration lab — a tint on the ground would read as decoration next to instrument photography",
    "rejected": "bone — the warm ground is the default this pipeline drifts to, and nothing in the brief asks for it"
  }
}
```

The `rejected` line is the load-bearing one. It is the only artefact that proves a selection happened
rather than a prior being emitted.

## What "clean and professional" actually is

None of this is about restraint for its own sake. The four things that separate a designed palette
from an assembled one, in order of how much they carry:

1. **Hue unity across neutrals.** One family, ±10°. This is most of it.
2. **High ink contrast.** 12:1+, not 7:1. Confident type is dark type.
3. **Hairlines instead of boxes.** `--border: 1px` at 0.14 alpha doing the work `--shadow` would
   otherwise do. A page held together by rules reads sharper than one held together by cards.
4. **Accent scarcity.** Two or three uses. Scarcity is what makes a colour read as a decision.

And the inverse — the four that make a palette read as generated: a tinted near-white, a
hue-mismatched ink, a soft shadow on every surface at ~0.1 alpha, and an accent applied everywhere it
would fit.

## Quick audit before you commit `theme.json`

- [ ] Named the neutral family, and can say what in the brief chose it
- [ ] Every neutral within ±10° of one hue
- [ ] No ground above L 90% with an RGB channel spread over `0x0A`
- [ ] `--color-ink` at L 8–12%, on the family hue, not `#000`
- [ ] `--color-line` = ink at 0.12–0.16 alpha, not a picked colour
- [ ] All five contrast pairs inside their bands
- [ ] `--color-accent-ink` set if accent text appears on a light ground
- [ ] Accent hue outside 235–285 and outside 12–28-at-high-chroma, or a stated reason
- [ ] Accent spent ≤ 3 times on the busiest page
- [ ] `direction.palette.rejected` written
