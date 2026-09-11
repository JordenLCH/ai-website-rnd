# Does restructuring `create-webpage` change what it produces? — 2026-09-11

**Answer: no, not measurably. Null result.** Three variants of the skill, two clean runs each, same
brief, pre-registered rubric. Every arm scored 11–12 out of 12. Keep the current structure, or change
it on taste — there is no evidence either way, and this document exists so nobody runs the experiment
again expecting a different answer.

The exercise paid for itself anyway, but through a side effect: **six careful readers went through
the skill at once and found five real defects in it**, all arm-independent. Those are fixed. That is
the actual yield.

## What was tested

Prompted by the Claude Design plugin's skills, which are short and consistently shaped, and the
question of whether ours should be too.

| Arm | What it was | `SKILL.md` |
|---|---|---|
| **C** | control — the shipping skill, untouched | 701 lines |
| **A** | restructured: workflow front-loaded, preamble compressed into 10 hard rules as a table, the rationale moved out to `references/why-this-shape.md`, stages 1–3 given a fixed Purpose / Do / Watch for / Done when shape | 593 + 100-line reference |
| **B** | shape only: original preamble kept verbatim, stages 1–3 given the same four headings, nothing moved out | 704 lines |

Stages 4–9 were byte-identical across all three, so the only variable was the preamble and stages
1–3 — which is all the task exercised.

Brief: `website_info/wungadv/` (Wung & Co Advocates), never generated before. Task: run stages 1–3
and stop. The catalog MCP was down for all six runs, which turned out to be informative rather than
a problem.

## Method

The rubric was written and committed to disk **before any run returned**, so scoring could not be
fitted to results. Twelve binary items covering the things stages 1–3 are supposed to produce:
documents-before-fields intake, source citations, no invented facts, the words-available total stated
against the ~1,200-word floor, the extremes table, three themes from three distinct objectives each
with a stated cost, no typeface named in the client-facing pitch, `theme.direction` written with its
rejects.

## Result

All six runs scored 11–12. **Ceiling effect: the rubric cannot separate the arms**, and with n=2 per
arm nothing smaller than a large effect was detectable anyway. No arm produced a failure the others
avoided. Every arm named the subagent checkpoint exception rather than skipping it silently; every
arm refused to generate a bundle without the catalog; every arm caught that 283 words is a quarter of
the floor and said so.

What this does **not** license: a claim that structure does not matter, or that the restructure is
worthless. It says this rubric, this brief and this sample size did not detect a difference.

## The five defects, all confirmed independently before fixing

Found by the runs, verified by reading the files rather than taken on an agent's word.

| Defect | Found by | Verification |
|---|---|---|
| `references/proposing-themes.md` carried a **corrupted duplicate block** — two headings repeated, the first copy truncated mid-sentence with an orphaned code fence | all 3 arms | headings at lines 94/145 and 115/161; 200 → 168 lines after excision |
| **Three-vs-four contradiction.** `art-direction.md` said "Write **four** directions" and `intake.md` said "samples four and discards the likeliest", while `SKILL.md` and `proposing-themes.md` had already moved to three-from-three-objectives | C | confirmed by grep; my own first check was too narrow and wrongly dismissed it |
| **The Malaysian registration gate is unsatisfiable for a professional practice.** It fires on `address.country == MY` alone and cites s.30(2) Companies Act 2016 — which binds companies. A law firm is typically a partnership with no SSM company number, so it trips a gate nothing can clear | all 3 arms | `house-rules.md:92`, `intake.md:34` |
| **Exactly one serif** among the fourteen served families (Fraunces). "Type class" is one of three orthogonality levers, so for any category whose expected shape is a serif — law, accountancy, medicine, heritage — Fit has one possible answer and cannot be sampled | C, A | counted in `renderer/src/fonts.ts` |
| **The catalog-down rule reads as all-or-nothing.** "Stop and say so — do not generate" sits above the whole workflow, but stages 1–3 name no block. Read literally it halts an intake conversation about a registration number | all 3 arms | the runs proceeded anyway and each flagged that they were technically disobeying |

Two more, added on the same evidence rather than as defects:

- **Photographs supplied with a brief are not automatically assets.** This brief arrived with ten
  Unsplash images. Runs independently identified a recognisable Dublin landmark standing in for the
  firm's library, visible third-party branding on a crane, filenames contradicting contents, and two
  gavels — an object Commonwealth courts do not use. Nothing before stage 8 told anyone to look.
- **Regulated categories constrain copy more than any validator.** Law, medicine, financial advice
  and education restrict outcome claims and testimonials, and the brief's own marketing adjectives
  are the first casualty.

One finding worth keeping as a method note: a run sampled the logo file and found its actual gold is
`#CFB66F`, against `#D4AF37` in the brand sheet. Verified by decoding the image. Sampling the asset
instead of trusting the document is now an intake step.

## What changed

`plugin/skills/create-webpage/` — `SKILL.md` (catalog refusal scoped to stage 4; stage 2 rows and
guidance for supplied stock and regulated categories; logo contrast and colour sampling at intake),
`references/proposing-themes.md` (corruption excised, serif ceiling documented),
`references/art-direction.md` and `references/intake.md` (four-sample procedure scoped to stage 4),
`references/house-rules.md` and `references/intake.md` (professional-practice branch).

The A and B variants are not kept. If the structure question comes back, the honest framing is that
it is a taste and maintenance decision, not a quality one.
