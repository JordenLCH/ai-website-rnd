---
name: sourcing-stock-photos
description: Use when photographs are needed and none have been supplied — finding stock photos, searching Pexels or Unsplash, replacing placeholder images, filling a page or document that has no pictures, or asking whether an image is licensed for commercial use. Also use when stock images have already been chosen and someone needs to know whether they are safe to publish.
---

# Sourcing stock photos

Free stock photography, without an API key and without a stock-photo MCP server. Pexels, Unsplash
and Pixabay serve their search pages and their image CDN to an ordinary fetch, and their licences
cover commercial use directly.

**The core principle: a photograph is not safe to use until something has looked at it.** Every
failure this skill exists to prevent — a competitor's logo in frame, foreign-language signage, a
watermark, an `alt` that describes a different picture — is invisible in a search result and obvious
in the image. A search title is a keyword string a contributor typed. It is wrong about the frame
roughly as often as a filename is.

## When not to use it

Stock fills a gap the client cannot; it never replaces photography they have. And a generic stock
image is worse than no image — it is the single strongest signal that a page was generated. If the
layout can work type-only, let it. One or two placed deliberately; never a set.

## The licences

- **Unsplash License**: *"download, copy, modify, distribute, perform, and use images from Unsplash
  for free, including for commercial purposes, without permission from or attributing the
  photographer."* Forbidden: reselling unmodified, or compiling a competing library. The
  hotlink-only rule people cite lives in the **API Guidelines** and binds API consumers — it does
  not reach a plain download.
- **Pexels** and **Pixabay** are the same shape: free commercial use, no attribution required, no
  standalone resale.

Three prohibitions apply to all of them and matter more than the permissions:

| Prohibited | What it rules out |
|---|---|
| Use as part of a trade mark, design mark, trade name or service mark | Logos, favicons, wordmarks, anything filed with a registry |
| Implying endorsement by people or brands depicted | Captioning stock as your own staff, premises or customers |
| Redistributing to other stock platforms, or scraping at scale | A scripted sweep of a provider. One search page and a handful of files is use |

## Procedure

Four steps, and **none of them is optional.**

```bash
# 1. WebFetch https://www.pexels.com/search/<query>/ asking for direct
#    images.pexels.com/photos/... URLs with titles and photographers.
#    Encode what the frame must be in the query — "workshop interior wide",
#    not "car" — there are no orientation filters without the API.

# 2. VERIFY. WebFetch answers through a small model; its URLs are a guess until checked.
for id in <ids>; do
  u="https://images.pexels.com/photos/$id/pexels-photo-$id.jpeg"
  echo "$id -> $(curl -s -o /dev/null -w '%{http_code} %{content_type}' -L "$u")"
done

# 3. Download the shortlist at target width — ?w= and ?h= work, don't pull originals.
curl -sL "https://images.pexels.com/photos/$id/pexels-photo-$id.jpeg?auto=compress&cs=tinysrgb&w=1600" \
  -o "<dest>/<slug>.jpg"

# 4. Do NOT convert. No image binary is guaranteed anywhere this runs, and a conversion
#    that silently fails leaves a reference pointing at a file that was never written.
```

A `403` on a `www.pexels.com` **page** is Cloudflare refusing curl's user agent, not a bad link —
the CDN answers `200` regardless. Judge the URL by the CDN check in step 2, never by the page.

**Then look at every file with `Read` before it ships.**

## Reject on sight

| Seen in the frame | Why it fails |
|---|---|
| A legible make, model badge or brand mark | Third-party branding. A car with `FORESTER` readable on the door is not a photo of *their* workshop |
| Signage, posters or packaging in another language | Places the business somewhere it is not |
| A watermark or overlaid text | Never ships |
| Obviously staged, evenly lit, everyone smiling | The stock look. Reads as generated even when nothing is wrong with it |
| A portrait file for a wide slot | `object-fit: cover` crops it silently — the page renders showing a third of the picture |

Expect to discard most of what you fetch, and expect the titles to have warned you about none of it.
A three-photo set chosen from search titles alone, for a Malaysian workshop, lost two on sight: a
"car repair shop" was a US tuning bay holding a BMW M4 with the roundel legible on the wheel, a
Porsche behind it and a `BENDPAK` lift post down one edge; an "interior of auto repair workshop" was
a Chinese yard with 严禁站人 safety signage on the pillar — and was portrait, for a wide slot. Both
were defensible from their titles. Neither survived being looked at.

Shortlist by title, then look at three or four. Each `Read` costs real tokens, so do not page
through twenty.

## Record what you took

`CREDITS.json` alongside the files — `{ file, source, photographer, url }` per image. Attribution is
not required by any of these licences, but the record is what makes the next two operations
possible: **replacing** a photo means rewriting its entry, and **removing** one means deleting the
file, its entry, and every reference pointing at it. A credits file that outlives its image is how
someone ends up crediting a photographer whose work is no longer on the page.

## Say these things when you hand the set over

Not caveats — the parts a person acts on:

- **Not for the logo.** The trade-mark prohibition covers favicon, wordmark, and any registry filing.
- **Caption it generically.** Alt text and captions describe *a* workshop, *an* office, *a* clinic.
  "Our workshop" and "our team" claim the endorsement the licence forbids, and presenting stock as
  your own premises is the kind of claim that attracts advertising-standards complaints.
- **This is scaffolding.** For a service business especially, an afternoon with a decent phone at the
  real place — their bay, their staff, their signage — outperforms any of it, because the customer is
  trying to judge whether *that* place looks competent. Put the real shoot in the backlog.
- **Get releases for the real shoot.** Written consent from anyone identifiable; avoid customer
  plate numbers and faces.

## Where there is no filesystem

Steps 3 and 4 need `curl` and `Read`. Three cases, and they are not the same:

| Surface | Can it finish? |
|---|---|
| Claude Code | Yes — filesystem and network both present |
| claude.ai with a skill uploaded and code execution on | A VM with bash exists, but network access "may be full, partial, or none" per user/admin settings. Try step 2; if it fails, degrade |
| Plain chat, no code execution | No. Degrade |

**Degrading means stopping after the search and the URL check**, then handing over a shortlist:
photo page link, provider, and the contributor's own title **quoted as theirs**, not restated as
fact. Then say, in as many words, that you have not seen these images and the branding check has not
happened.

Hand over the shortlist and stop there. Three guardrails, because an agent working from titles alone
produced each of these:

- **No `alt`.** An `alt` describes a photograph, and you have looked at none.
- **No image-kind or aspect judgement.** Depth and framing are things you see, not things you infer.
- **No markup, and no width and height.** An agent asked for stock photography on this path produced
  a page of hand-written HTML with placeholder dimensions in it — a plausible-looking answer to a
  question nobody asked.

The licence reasoning above needs no pixels. Give all of it. Just never let it stand in for having
looked.

## Using this inside a generated site

`create-webpage` arrives here with a gap list — the image slots its layout needs and the client could
not fill. Where the file goes next depends on the surface, and getting it wrong leaves a reference
pointing at nothing:

| Surface | Where the picture actually goes |
|---|---|
| A checkout | download to `assets/<client>/<slug>.jpg`; the prop reads `/img/<client>/<slug>.jpg` |
| Chat, code execution on | you can fetch and look, but there is no `assets/` folder the site reads from — the file reaches the site through the browser upload link |
| Chat, no code execution | hand over the shortlist; the human downloads and uploads |

On both chat rows the upload page is the delivery mechanism, and it asks for files **by the name the
prop uses**. So the shortlist you hand over is not a list of links — it is a set of delivery
instructions, one per gap, and each one carries the filename:

```
1.  hero-workshop.jpg    ← save it under exactly this name
    https://www.pexels.com/photo/12345678/
    Pexels · "Interior of an auto repair workshop" (the contributor's title, not mine —
    I have not seen this image)
    Hit the free download, choose Large, rename it to exactly that, drop it on your upload page.
    No need to convert or resize it — the server does both.
```

Three things make that work and are easy to drop: the **exact filename**, the provider's own title
marked as theirs, and the sentence saying you have not seen it. A shortlist missing the filename
produces files the upload page cannot match, and the human cannot tell why nothing appeared.

Then ask them to tell you when the files are up, and check `bundle_status(domain)` — it is keyed by
the site's domain, so if you are running standalone and don't have one, ask for it rather than
trusting the answer — a photo saved as `pexels-photo-12345678.jpg` is invisible to the matcher even though it is
sitting right there on the page.

**Nothing requires `.webp`.** The `src` prop is a plain string and the build resolves any path
matching `/img/<client>/<file>` whatever the extension. The fleet is all `.webp` because the humans
who supplied those photographs had already optimised them — optimisation is the build farm's job,
past the upload, where the toolchain is known.

`alt` and `imageKind` are written from the pixels once step 3 has run — `environment` for a scene
with depth, `cutout` for a product on a plain ground, `detail` for a close crop. The validator
refuses a cutout under `overlay-fullbleed` because text on it would be unreadable, and it can only
refuse what you declared.

## Done when

The set is finished when every file has been opened with `Read`, `CREDITS.json` has an entry per
file, and every `alt` describes the picture you looked at. On a surface where the download cannot
happen, it is finished when the shortlist is handed over **and you have said in as many words that
you have not seen these images** — an unseen shortlist presented as a chosen set is the one failure
this skill cannot recover from later.
