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

## First turn: ask for the documents, not for the fields

**Never open with the question list.** A person who has a company profile PDF, a deck and a logo on
their desktop should not be transcribing a phone number out of them by hand — they drop the files in
and you read them. Asking sixteen questions first makes them do the extraction you are better at,
and most of the answers arrive wrong or not at all.

So the first thing you emit is this, and nothing else:

```
Send me whatever you already have about the company — drag the files straight into this chat:

  • company profile, brief, deck, brochure, product catalogue — PDF, Word, slides, all fine
  • the logo (PNG, JPG or WebP — not SVG, it won't upload)
  • brand guidelines, if there are any
  • a link to your current website, and to any competitor worth reacting to

Send the messy versions. I'll read them and fill in everything I can, then come back with a short
list of what's genuinely still missing — probably four or five things, in plain English.
```

Then read every file before you say anything else. Rules for reading them:

- **Say where each fact came from.** "Phone: 03-1234 5678 (company profile, p.4)" is checkable;
  a bare value is not. This is the whole reason the human can approve the list in seconds.
- **A scanned PDF with no text layer is not read.** If you cannot extract text, say so by name —
  "`profile.pdf` is a scan, I can't read it; can you retype the contact block or send the original?"
  — rather than quietly treating it as a document with nothing in it.
- **Two documents disagreeing is a question, not a tiebreak.** An old address in the brochure and a
  new one on the website is exactly the thing to ask about; picking the newer-looking one silently
  puts a wrong address in schema markup.
- **Marketing adjectives are not facts.** "Leading manufacturer since the 70s" gives you neither
  `foundingDate` nor anything else. Extract only what is stated.
- The documents are also stage 2's source material — note word counts as you read, so the content
  inventory is not a second pass over the same PDFs.

## Then ask for the gaps, in this wording

Emit this second, with everything the documents already answered pre-filled so the human only sees
what is genuinely missing. Do not compose your own wording: left to invent it, one model produces a
tidy form and another produces headings like "Platform details" with asset questions filed under
them — same skill, different model, and the difference lands on the client.

**No schema jargon in anything the human reads.** They do not have to know what `sameAs`,
`areaServed` or s.30(2) is, and a field name in a question is a field they answer wrongly. The
parenthetical says why it matters in their language; `org.json` is your problem, not theirs.

Say plainly which items block the build, because they are not equally urgent and a flat list of
sixteen questions reads as though they are.

```
FROM YOUR DOCUMENTS — have a quick look, tell me anything that's wrong or out of date
  <what it is>: <value>   (where you found it)    ← list every one, so it can be checked
  ...

STILL NEED THESE — I can't ship a site without them
  1. Company name exactly as it's registered      (e.g. "Acme Precision Sdn. Bhd.")
  2. Company registration number                  (Malaysian law requires the registered name and
                                                   number to appear on the website, so the site
                                                   won't pass its checks without it — the SSM
                                                   number, exactly as issued)
  3. The phone number and email you want on the site
  4. The logo file                                (PNG, JPG or WebP — if you only have an SVG I'll
                                                   need it converted before it can go up)
  5. What web address will this live at?          (yoursite.com.my — if you haven't bought one yet
                                                   just tell me the name you're leaning towards;
                                                   I only need something to file the draft under
                                                   and it can be changed later)

ABOUT THE SITE — a sentence each is plenty
  6. Your brand colour                            (the exact code if you know it — "#1B4D3E" or a
                                                   Pantone — otherwise just name it, or point me at
                                                   the logo and I'll read it off that. If the
                                                   company doesn't have one, say so: I'll propose
                                                   three and you pick)
  7. Who buys from you?
  8. What should the site actually make happen?   (get quote requests, explain the range, look
                                                   credible to a buyer, hire people, sell online)
  9. How big?                                     (homepage only / home plus 2-3 pages / full site)
 10. What must the homepage cover?                (beyond the top banner — products or services,
                                                   industries you serve, case studies, numbers,
                                                   technology, partners, customer quotes, news,
                                                   careers, contact)
 11. How should it sound?                         (technical and precise / bold and visionary /
                                                   plain and practical)
 12. Any page you need that I wouldn't think to add?
 13. A site you like, or one you'd hate to look like?

NICE TO HAVE — the site ships without these, but they make it stronger
 14. Links to your company anywhere else online   (LinkedIn, Google Business, Facebook, Instagram,
                                                   an industry directory — these are how Google
                                                   confirms you're a real company, and they're the
                                                   most-skipped thing on this list)
 15. Certifications, with the exact name          ("ISO 9001", not "ISO standards")
 16. Roughly how many staff, any awards, which countries or states you cover
 17. Key people worth naming, and their qualifications
```

Items 1-4 map to `legalName`, `registration`, `phone`/`email` and the logo; 14 is `sameAs`, 16 is
`numberOfEmployees` / `awards` / `areaServed`, 17 is `people[]`. Do that mapping yourself when you
write `org.json` — never by showing the human the field names.

**Motion is not on this list.** Someone who has not seen the page cannot tell you whether they want
"lively" — the answer comes back as a mood, not a decision. Stage 3 sets it with the rest of the
direction, and the human judges it on the real preview at stage 5, where there is something to look
at.

**Item 6 does not block the build, and is still not optional to ask.** Every theme candidate at
stage 3 is built *from* the brand colour, so a run that never asked is a run that invented one and
designed three themes around the invention. A brand guide constrains stage 3 before you sample
anything; having no brand colour is a real answer and stage 3 proposes instead. Picking one quietly
is the only wrong move.

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


## Why the domain is a blocker, and why a provisional one is fine

It looks like a launch detail, so it gets left to the end — and on the chat path that breaks the
pictures. `bundle_publish` takes a domain, publishing is what mints the upload link, and the upload
link is the **only** route a photograph has into the site. No domain, no link, no pictures: you reach
stage 8 holding a list of images with no way to deliver any of them.

So ask at intake, and make it cheap to answer. Publishing creates a *draft*, never a live site, so
the domain is just the key the draft is filed under — `sterlingcoldchain.com.my` works whether or not
they own it yet. If it turns out wrong, `bundle_discard` withdraws the draft and you publish again
under the right one. What you must not do is wait: a client who "will sort the domain later" has
also, without knowing it, postponed every photograph on their site.
