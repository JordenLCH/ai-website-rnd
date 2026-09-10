# Intake — the org.json schema and the verbatim question list

Referenced from `SKILL.md` stage 1. Collect these before any structure or look exists — they never
appear in marketing copy, cannot be inferred, and must not be invented.

## `org.json`

```jsonc
{ "name": "...", "legalName": "... Sdn Bhd", "url": "https://...",
  "description": "one sentence, what they actually do",
  "foundingDate": "1974", "registration": "...", "vatId": "...",
  "phone": "...", "email": "...",
  "address": { "street": "...", "locality": "...", "region": "...", "postalCode": "...", "country": "MY" },
  "sameAs": ["https://linkedin.com/company/...", "https://g.page/..."],
  "certifications": ["ISO 9001", "..."], "awards": ["..."],
  "areaServed": ["Malaysia", "Singapore"],
  "people": [{ "name": "...", "role": "...", "credential": "...", "sameAs": "..." }],
  "numberOfEmployees": "..." }
```

This file is the site's **E-E-A-T** carrier — the platform turns it into `Organization` /
`LocalBusiness` schema. Each field answers a question a search or answer engine asks about
trustworthiness:

- **Experience** — `foundingDate`, `numberOfEmployees`: how long, at what scale
- **Expertise** — `certifications`, `people[].credential`: qualifications granted by someone else
- **Authoritativeness** — `sameAs`: profiles the client does not control, so a crawler can corroborate
  the entity elsewhere. This is the highest-value field here and the one most often skipped
- **Trustworthiness** — `legalName`, `registration`, `address`, `phone`: a real accountable entity

Ask for anything missing. Omitting a field is fine; guessing at one is not — wrong registration
details are a legal problem, not a formatting one.

**Malaysia — the registration number is not optional.** If `address.country` is `MY` (or the legal
name carries `Sdn Bhd` / `Berhad` / `PLT`), s.30(2) Companies Act 2016 requires the **registered name
and company registration number on the company's website** — the subsection names websites
explicitly, alongside letters and invoices, and non-compliance carries up to RM50,000. Put both in
`chrome.footer`'s `legal.line`, never in a page's blocks: the footer is the only element that appears
on every page, and a compliance line on the home page is a line missing from the other four.

```jsonc
"legal": { "line": "Acme Precision Sdn. Bhd. (Registration No. 202001012345 (1234567-X)) · © 2026",
           "links": [{ "label": "Privacy", "page": "privacy" }] }
```

Use the number exactly as SSM issued it — the 12-digit form with the old `1234567-X` number in
brackets, if the client gave both. `validate` fails the bundle when the footer is missing either
half, so collect `registration` and `legalName` at intake or the site cannot ship.

## Ask with this list, verbatim

Do not compose your own intake questions. Emit this, filling in what the documents already answer so
the human only sees what is genuinely missing. Left to invent the wording, one model produces a tidy
form and another produces headings like "Platform details" with asset questions filed under them —
same skill, different model, and the difference lands on the client.

Say plainly which items block the build, because they are not equally urgent and a flat list of
twelve questions reads as though they are.

```
ANSWERED FROM YOUR DOCUMENTS — correct me if any of this is wrong
  <field>: <value>            ← list every one you filled, so it can be checked
  ...

BLOCKS THE BUILD — I cannot produce a shippable site without these
  1. Registration number      (Malaysia: s.30(2), the footer gate fails without it)
  2. Legal name, exactly as registered
  3. Phone and email
  4. Logo file, and brand guidelines if any exist
                              (this is the one asset collected now, not at stage 8 — it's a fixed
                               file, not a folder to sort, and its role in the header/footer
                               doesn't depend on which sitemap or theme gets picked. If the client
                               has a brand guide, its colours and type constrain stage 3 before you
                               sample anything against a blank slate. If the logo file is an SVG,
                               say now that it needs converting to PNG/WebP before upload — see
                               "Uploading pictures" in SKILL.md for why)

SHAPES THE SITE — I will ask again before writing copy if these change
  5. Who buys from them       (the buyer decides whether pages split by product or by audience)
  6. What the site must make happen
                              (book a demo, explain the lineup, establish credibility, recruit,
                               drive a purchase — a quote request and a spec download are
                               different sites)
  7. Scope                    (homepage only / home + 2-3 key pages / full multi-page site —
                               this sets the size of every stage after intake, ask it before
                               stage 2's inventory, not after)
  8. Which sections the homepage must carry
                              (hero is assumed; beyond that — products/services, industries
                               served, case studies, stats, technology, partners, testimonials,
                               news, careers, contact — so stage 4 samples against a real list
                               instead of guessing one)
  9. Copy tone                (technical & precise / bold & visionary / plain & practical —
                               stage 5 writes to this from the first sentence)
 10. Motion                   (static / subtle scroll reveals / rich & animated — default to
                               subtle if unanswered; this is a section-style choice, not a
                               per-block one, so get it before stage 6)
 11. Any page that must exist for a reason I would not guess
 12. An existing site, codebase, or screenshot to react to
                              (not to copy — it tells you what to avoid as much as what to keep;
                               feed it into stage 4's do-not-list, same as a named competitor)

STRENGTHENS THE SITE — omit any of these and the site still ships
 13. sameAs profiles          (LinkedIn, Google Business — the highest-value field here and
                               the most skipped: it is how a crawler corroborates the entity
                               somewhere the client does not control)
 14. Certifications, named exactly   ("ISO 9001", not "ISO standards")
 15. Employee count, awards, area served
 16. Named people with credentials
```

**Deliberately not on this list: "how many directions do you want to see".** Stage 3 always
samples four and discards the likeliest, stage 4 always samples the tail of home-page orderings —
that sampling is what keeps sites from converging on the training-data default, and letting the
human dial it down to one undoes the reason it exists. Recommend one, show the sampling; don't ask
how many to generate.

Three rules for running this list:

- **A vague answer is a missing answer.** "ISO standards" is not a certification; ask which one.
  Writing `ISO 9001` because it is the common one is inventing a credential.
- **Never fill a blocker to keep moving.** A wrong registration number is a legal problem, not a
  formatting one. Stop and ask, or ship with the field absent and say so.
- **Section photography is not an intake question; the logo is.** Bulk photos wait for stage 8,
  after the layout exists and you know which images it actually needs — asking for those now gets
  you a folder of whatever the client had to hand. The logo is the exception: it's one fixed file
  whose header/footer role never depends on layout, so collect it now, the same turn as the legal
  facts.

Nothing about hosting, SEO or refresh belongs in intake either. Those are derived server-side after
upload and need nothing from the creator — see "After you hand off" in `SKILL.md`.
