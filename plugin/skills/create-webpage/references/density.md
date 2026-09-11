# Density, and marking what you invented

Referenced from `SKILL.md` stage 5. These two travel together: thin sections are what tempt you to
invent, and invented content is what makes a thin section look full.


A professional site is dense and specific. A generated one drifts sparse, because abstract copy has
nothing to lay out: large type in empty bands is what the model reaches for when it has no facts.

The validator measures every section and reports:

| | Warning below | Aim for |
|---|---|---|
| Words per section | 20 | **60+** |
| Content nodes per section | 3 | **6+** |
| Words per page | — | **700+** |
| Images per page | — | one per two sections |

Hero, CTA, quote, nav and footer are exempt — they are meant to be short.

Density does not come from longer paragraphs. It comes from **specificity**: a caption naming what is
in the photograph, a spec row with a real value, a numbered step, a badge carrying a certification.
Reach for these before writing another sentence of prose:

| Primitive | Use |
|---|---|
| `Figure` + `caption` | a photograph that says what it shows, not decoration |
| `Caption` | a note under an image, table or stat |
| `KeyValue` | spec rows — composition, dimensions, warranty, lead time |
| `Badge` | certifications, materials, markets, standards |
| `Marker` | `01` / `02` step and item numbering |
| `Heading.accent` / `Text.accent` | one phrase of the heading in the accent colour — a verbatim substring, not markup |

Run `validate` and clear the density warnings before handing off. A page that trips them will look
like a free template no matter how good the theme is.

## Invented content — mark it, do not avoid it

You are expected to compose plausible copy so a page arrives whole rather than as a skeleton. What
you must never do is let an invention pass as sourced. Three tiers:

| Tier | What | Rule |
|---|---|---|
| **Write freely** | headings, section copy, captions, feature framing, step names, alt text | no mark needed |
| **Write and mark** | stats, spec values, prices, dates, counts, testimonials | allowed, set `"unverified": true` on the block |
| **Never** | `org.json`: legal name, registration number, certifications, credentialled people, `sameAs`; and any **named** person or post | leave the field out |

For a client who does not publish their people, `Team` accepts entries with a `role` and
`credential` but no `name` — describe who would handle the work rather than inventing partners.
For regulated copy ("not legal advice", "no solicitor-client relationship"), use the `Notice`
block, never `RichText`: it is excluded from JSON-LD and `llms.txt`, which `RichText` is not.
Set `org.businessType` (`LegalService`, `Dentist`, `AutoRepair`, `Accounting`…) and
`org.people[].personType` (`Attorney`, `Physician`…) at intake — a professional practice typed
as a bare `LocalBusiness` is indexed as a shop with an address.

`"unverified": true` on a block does three things: the preview marks it and lists it as the human's
edit checklist, the build farm **excludes it from JSON-LD and llms.txt**, and publishing is refused
until it is confirmed or corrected.

That exclusion is the reason the tiers exist. Marketing copy a human will proofread can be a draft.
A `Review` or a `Product` spec asserted in structured data is a claim made to a search engine in the
client's name — fabricated, it is a manual action and a legal exposure, and it lands after handoff
where nobody is looking. Prose can be wrong and get fixed; schema gets believed.

Say plainly in your handoff which sections are marked and what needs confirming.
