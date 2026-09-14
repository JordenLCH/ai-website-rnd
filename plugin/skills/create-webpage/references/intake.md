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

**Not every Malaysian client is a company, and the gate does not know that.** It fires on
`address.country == MY` alone, but s.30(2) binds *companies* — a law firm, clinic, architecture or
accountancy practice is typically a partnership, sole proprietorship or LLP registered under a
different regime (and in Sarawak, under Sarawak's own ordinances), and may hold no SSM company
number at all. The gate still demands both halves of `legal.line`, so a professional practice can
reach publish with nothing that satisfies it. **Ask for the identifier the client already prints on
their letterhead** — a business registration number, a practice or firm number — and use that,
rather than citing the statute at someone it does not govern. If they genuinely have none, that is a
finding to report, not a number to invent: say the compliance line cannot be written and let them
take it to whoever registered the practice.

Use the number exactly as SSM issued it — the 12-digit form with the old `1234567-X` number in
brackets, if the client gave both. `validate` fails the bundle when the footer is missing either
half, so collect `registration` and `legalName` at intake or the site cannot ship.

## First turn: ask for the documents, not for the fields

**Never open with the question list.** A person who has a company profile PDF, a deck and a logo on
their desktop should not be transcribing a phone number out of them by hand — they drop the files in
and you read them. Asking sixteen questions first makes them do the extraction you are better at,
and most of the answers arrive wrong or not at all.

So the first thing you emit is this, and nothing else — **as markdown in the chat, not inside a code
block**. A fenced block renders as monospace, which reads as a config file rather than a message to a
person:

> Send me whatever you already have about the company. Drag the files straight into this chat:
>
> - company profile, brief, deck, brochure, product catalogue. PDF, Word, slides, all fine
> - the logo (PNG, JPG or WebP, not SVG, which won't upload)
> - brand guidelines, if there are any
> - a link to your current website, and to any competitor worth reacting to
>
> Send the messy versions. I'll read them and fill in everything I can, then come back with a short
> list of what's genuinely still missing: probably four or five things, in plain English.

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

> **Here's what I pulled from your documents.** Skim it, and tell me anything wrong or out of date.
>
> | | | |
> |---|---|---|
> | Registered name | Acme Precision Sdn. Bhd. | profile.pdf p.1 |
> | Address | … | brochure, back page |
>
> *(one row per fact, every one with its source, which is what lets it be checked in seconds)*
>
> **Two things in your documents disagree.** Which is right?
>
> 1. **Brand colour.** The brief says green, the logo is turquoise. Which one?
> 2. …
>
> *(drop this section entirely if nothing conflicts)*
>
> **Can't build the site without these:**
>
> 1. Your company name exactly as registered, and your registration number. Malaysian law requires
>    both to appear on your website, so the site can't go live without them.
> 2. The phone number and email for the site
> 3. The logo file, as PNG, JPG or WebP (an SVG needs converting first)
> 4. What web address this will live at. If you haven't bought one yet, tell me the one you intend
>    to buy, or just your business name and I'll file it under that for now.
>
> **A sentence each is plenty:**
>
> 5. Your brand colour: a code if you have one, otherwise just name it, or I'll read it off the
>    logo. No brand colour? Say so and I'll propose three.
> 6. Who buys from you?
> 7. What should the site actually make happen: quote requests, explain the range, look credible,
>    hire people, sell online?
> 8. How big: homepage only, home plus 2–3 pages, or a full site?
> 9. Beyond the top banner, what must the homepage cover? (products, industries, case studies,
>    numbers, customer quotes, careers, contact…)
> 10. How should it sound: technical, bold, or plain and practical?
> 11. Any page you need that I wouldn't think to add? A site you like, or one you'd hate to resemble?
>
> **Optional. The site ships without these, but they make it stronger:**
>
> 12. Links to you anywhere else online: LinkedIn, Google Business, Facebook, a trade directory.
>     This is how Google confirms you're a real company, and it's the most-skipped item here.
> 13. Certifications, with the exact name ("ISO 9001", not "ISO standards")
> 14. Roughly how many staff, any awards, which countries or states you cover
> 15. Key people worth naming, and their qualifications
>
> Once I have the web address I'll send you a photo page, and that's the next thing to do. Drop
> **every** photograph you have into it: logo, products, the team, the premises, anything from an
> old site. Names don't matter, and extras are useful. I'll fit them to the pages as I write them,
> and I'll show you the pages with your photographs in them as soon as the first one is written.

**Emit it as markdown, not inside a code block.** The layout above is the whole point of the
wording: fenced text renders monospace and column-aligned, which reads as a printout rather than a
message, and the person answering gives up before item 4. Same reason there are no hand-padded
columns — let the renderer align the table.

**Cut every line the documents already answered.** The list above is the maximum, not a form to
reproduce. If the brief gave you the buyer, the goal and the tone, ask four questions, not fifteen,
and renumber. A client re-answering something they already sent stops trusting that you read it.

**Keep each parenthetical under about a dozen words.** They exist to stop a wrong answer, not to
teach the pipeline — the registration line earns its clause because it is a legal requirement
nobody expects; "explain the range" does not need three lines of examples.

Items 1-3 map to `legalName`/`registration`, `phone`/`email` and the logo; 12 is `sameAs`, 14 is
`numberOfEmployees` / `awards` / `areaServed`, 15 is `people[]`. Do that mapping yourself when you
write `org.json` — never by showing the human the field names.

**Motion is not on this list.** Someone who has not seen the page cannot tell you whether they want
"lively" — the answer comes back as a mood, not a decision. Stage 3 sets it with the rest of the
direction, and the human judges it on the real preview at stage 5, where there is something to look
at.

**The brand colour does not block the build, and is still not optional to ask.** Every theme candidate at
stage 3 is built *from* the brand colour, so a run that never asked is a run that invented one and
designed three themes around the invention. A brand guide constrains stage 3 before you sample
anything; having no brand colour is a real answer and stage 3 proposes instead. Picking one quietly
is the only wrong move.

**Deliberately not on this list: "how many directions do you want to see".** Stage 3 always
proposes three, one from each of three objectives that pull apart, and stage 4 always samples the
tail of home-page orderings —
that sampling is what keeps sites from converging on the training-data default, and letting the
human dial it down to one undoes the reason it exists. Recommend one, show the sampling; don't ask
how many to generate.

Three rules for running this list:

- **A vague answer is a missing answer.** "ISO standards" is not a certification; ask which one.
  Writing `ISO 9001` because it is the common one is inventing a credential.
- **Never fill a blocker to keep moving.** A wrong registration number is a legal problem, not a
  formatting one. Stop and ask, or ship with the field absent and say so.
- **Ask for the photographs here, and ask for all of them.** This reverses the old rule, which held
  bulk photos back to stage 9 on the grounds that asking early gets you a folder of whatever the
  client had to hand. It does — and that folder is worth more than a tidy list arriving after the
  pages are written. Open the pool with `assets_open(domain, client)`, hand over the link, and say
  names don't matter and spares are useful. You then *look* at what arrives (`assets_view`) and
  compose the pages around it, instead of specifying pictures nobody has taken. The precise,
  shot-by-shot request list still exists — it is stage 9, and it now covers only the gaps the pool
  never filled. The logo is simply the first thing on that page, and the one to chase, because
  stage 3's contrast reading depends on it.

Nothing about hosting, SEO or refresh belongs in intake either. Those are derived server-side after
upload and need nothing from the creator — see "After you hand off" in `SKILL.md`.


## Why the domain is a blocker, and why a provisional one is fine

It looks like a launch detail, so it gets left to the end — and on the chat path that breaks the
pictures. The domain is the key the photo pool is filed under: `assets_open(domain, client)` is what
mints the upload link, and that link is the **only** route a photograph has into the site. No domain,
no link, no pictures — and now the cost lands at stage 1 rather than stage 9, because the whole point
of opening the pool early is that the client uploads while the site is still being written. Answer it
late and every picture arrives late with it.

So ask at intake, and open the pool in the same turn — but read the domain back before you do.
`bundle_discard` still refiles a wrong one, and it now deletes the photographs uploaded against it,
so a typo caught after the client has spent an evening uploading costs them that evening. The client
slug comes from the domain (`merryfair.com` → `merryfair`) and is frozen once the pool is open: it
becomes the public `/img/<client>/` path, and a second `assets_open` with a different slug is
refused, naming the one already recorded. While the site is still a draft the domain is only the key it is filed under, and
`bundle_discard` lets you refile it — so a client who does not yet own the name is not blocked, and
you must not let them postpone it: "we'll sort the domain later" silently postpones every photograph
on the site.

**But it names the live site.** The domain becomes the hosting project name — lowercased, every dot
and anything else non-alphanumeric turned into a hyphen — and that is the address the site actually
goes live on: `john.com.my` publishes to **`john-com-my.pages.dev`**. Changing it afterwards does not
rename anything; it builds a second site at a second address and leaves the first standing. So a provisional answer is fine at intake, and **confirm it before the publish that
goes live** — "this is the address it will have, still right?"

**Their own domain is connected afterwards, by the Blackdash team, not by this pipeline.** The site
is live and complete at the `.pages.dev` address; getting their own name to reach it is a separate
step, and what a client needs to hear is "talk to us and we'll take you through it". Say that when
you hand the site over, so nobody sits waiting for their own address to start working on its own —
and say it that way round: a client told to "point your domain at the site" is being given a task
they cannot do, and the site goes unused rather than unfinished. Do not promise it takes nothing
from them either — a domain nobody has given us access to cannot be connected. It is not a missing
step or a failure; it is where this pipeline ends and we pick it up by hand.
