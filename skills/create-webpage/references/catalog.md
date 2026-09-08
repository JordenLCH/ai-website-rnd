# Catalog reference

**Call `catalog_list` first.** This file is the offline fallback — the live catalog ships weekly and
your repo does not contain it. A creator repo holds content only: `content/<client>/site.json`,
`theme.json`, `org.json` and `assets/`. There are no block components to read, and no CSS to edit.

24 block types. A block instance is `{ "type": <name>, "variant": <slug>, "props": {...} }`.
The **variant is an opaque slug** — the theme decides what it looks like. Never name a slug after an
appearance (`hero/dark-overlay`); name it after its editorial role (`hero/home`).

## Contents
1. Chrome — Nav, Footer, Breadcrumb
2. Lead — Hero, Promo
3. Content — Features, MediaText, RichText, Steps, Timeline
4. Evidence — Stats, Testimonials, LogoWall, SpecTable
5. Commerce — CatalogGrid, Pricing, Gallery
6. Conversion — CTA, ContactForm, Locations, FAQ
7. People & posts — Team, PostList, Notice
8. FreeSection + primitives

---

## 1. Chrome

Header and footer belong to **`site.chrome`**, declared once for the whole site. The renderer draws
`chrome.header`, then the page's blocks, then `chrome.footer`, so a page's `blocks` array contains
only that page's content:

```jsonc
{ "client": "acme",
  "chrome": {
    "header": { "type": "Nav",    "variant": "nav/main",    "props": { ... } },
    "footer": { "type": "Footer", "variant": "footer/main", "props": { ... } } },
  "pages": {
    "home": { "title": "Home", "blocks": [ /* no Nav, no Footer */ ] } } }
```

Putting Nav or Footer inside a page's `blocks` still validates — the schema allows it so older
bundles keep working — but it is wrong: you end up with one copy per page to keep in sync, and a
header that can drift between pages without anything complaining.

**Nav** — layouts `inline-left`, `split-rail`
`{ brand, logo?, utility?: [{label, page?}] (1–4), items: [{label, page, children?: [{label, page}] (2–8)}] (2–7), action?: {label, page?} }`

`utility` is the thin strip above the main bar — a phone number, an email, a portal login. Put
contact details there rather than spending one of the seven `items` slots on them; `page` takes
`"tel:+60..."` and `"mailto:..."` as well as a page key. `items[].children` is a submenu, so a
twelve-page site can still show five top-level items. The nav collapses behind a menu button below
620px and marks the current page `aria-current` — both are automatic, nothing to declare.

**Footer** — layouts `columns`, `centered-minimal`
```jsonc
{ "brand": "...", "logo": "...", "tagline": "one line, what they do",
  "columns": [{ "title": "Products", "links": [{ "label": "...", "page": "products" }] }],   // 1–4
  "contact": { "label": "Contact", "address": ["...", "..."], "phone": "...", "email": "..." },
  "social":  [{ "label": "LinkedIn", "href": "https://..." }],                                // ≤6
  "legal":   { "line": "Acme Sdn. Bhd. (Registration No. 202001012345) · © 2026",
               "links": [{ "label": "Privacy", "page": "privacy" }] },                        // ≤4
  "note": "editorial line — ISO certified since 1982" }
```

Every `links` entry needs a `page` or it renders as plain text and the validator warns: a page key,
a full URL, a `mailto:` or a `tel:`. `contact` renders as its own column with real `tel:`/`mailto:`
anchors — the footer is the only place contact details reach every page, so leaving it out is
warned about too. `legal` is the bottom row and is kept apart from `note` because it is not
editorial: copyright, and where the law requires it the registered name and company registration
number. `social` takes text labels, not icons — the catalog ships no icon set.

Older bundles wrote `links` as `[string]`. They still validate and render exactly as before; the
migration carries each string to `{label}` and leaves `page` unset for a human to fill in.

**Breadcrumb** — layouts `inline`, `boxed`
`{ items: [{label, page?}] (2–5) }` — last item omits `page`.

Prefer `Hero.breadcrumb` instead. A trail placed above the hero pushes the headline down the page
in exchange for two words of orientation, which is a bad trade on a five-page marketing site. Use
this standalone block only for deep content hierarchies (docs, a large product tree) where the trail
is genuinely load-bearing.

## 2. Lead

**Hero** — layouts `overlay-fullbleed`, `split-editorial`, `centered-poster`, `stacked-title`
`{ breadcrumb?: [{label, page?}] (2–5), eyebrow?, title, body?, actions: [{label, kind: primary|ghost}] (≤2), image?, imageAlt?, imageKind: environment|cutout|detail }`
`breadcrumb` renders inside the hero, above the eyebrow — the right home for a trail on a subpage.
`overlay-fullbleed` requires `imageKind: "environment"` — text sits on the photo.

**Promo** — layouts `split-strip`, `centered-strip`
`{ kicker?, title, body?, action?: {label}, image?, imageAlt? }` — a thin announcement band.

## 3. Content

**Features** — layouts `grid-hairline`, `alternating-rows`, `cards-soft`, `text-columns`
`{ eyebrow?, title, items: [{title, body, image?, imageAlt?}] (2–6) }`

**MediaText** — layouts `image-right`, `image-left`, `overlap-offset`
`{ eyebrow?, title, body: [string], image, imageAlt, action?: {label} }`

**RichText** — layouts `prose-narrow`, `two-col-prose`, `lead-aside`
`{ eyebrow?, title?, paragraphs: [string], aside? }`

**Steps** — layouts `numbered-rail`, `cards-row`, `inline-flow`
`{ eyebrow?, title, items: [{title, body}] (2–6) }` — numbering is automatic.

**Timeline** — layouts `vertical-rail`, `horizontal-steps`
`{ eyebrow?, title, items: [{marker, title, body}] (2–8) }` — `marker` is a year or stage.

## 4. Evidence

**Stats** — layouts `inline-bar`, `airy-columns`, `boxed-grid`
`{ title?, items: [{value, label}] (2–4) }` — keep values short (`10M+`, `5 yr`, `82`).

**Testimonials** — layouts `single-large`, `two-col`, `quote-row`
`{ eyebrow?, title?, items: [{quote, author, role?}] (1–6) }`
`single-large` takes exactly one quote and sets it at display size.

**LogoWall** — layouts `hairline-row`, `muted-grid`
`{ title?, items: [{label, note?}] (3–10) }` — text labels; use for certifications or markets.

**SpecTable** — layouts `stacked-rows`, `two-col-groups`, `compact-hairline`
`{ eyebrow?, title, groups: [{label, rows: [{k, v}]}] (1–6) }`

## 5. Commerce

**CatalogGrid** — layouts `cards-grid`, `hairline-catalog`, `wide-list`
`{ eyebrow?, title, items: [{name, body?, points?: [string] (2–8), meta?, tag?, image, imageAlt}] (2–8) }`
Use `points` for sub-items under one entry — practice sub-services, product variants, included
scope. Do not flatten a list into `meta` as slash-separated prose; `meta` is one short line.

**Pricing** — layouts `cards-tiers`, `table-compare`
`{ eyebrow?, title, tiers: [{name, price, unit?, body?, features: [string], action: {label}, featured?}] (2–4) }`
If the brief has no prices, use honest values — `Included`, `Quoted`, `Per unit` — never invent numbers.

**Gallery** — layouts `mosaic`, `uniform-grid`, `filmstrip`
`{ eyebrow?, title?, items: [{image, imageAlt, caption?}] (3–9) }` — `mosaic` reads best with ≥5.

## 6. Conversion

**CTA** — layouts `hard-panel`, `soft-band`, `centered-poster`
`{ title, body?, action: {label}, note? }`

**ContactForm** — layouts `split-form`, `stacked-centered`
`{ eyebrow?, title, body?, fields: [{label, type: text|email|tel|textarea|select, options?}] (2–8), action: {label} }`

**Locations** — layouts `cards`, `split-panel`
`{ eyebrow?, title, items: [{name, address, note?}] (1–4), image?, imageAlt? }` — `address` honours newlines.

**FAQ** — layouts `accordion-stack`, `two-col-list`
`{ eyebrow?, title, items: [{q, a}] (2–10) }`

## 7. People & posts

**Team** — layouts `photo-grid`, `minimal-list`
`{ eyebrow?, title, items: [{name?, role, credential?, bio?, image?, imageAlt?}] (2–8) }`
`name` is optional. A firm that does not publish who works there can still describe the roles that
would handle the work — `role` + `credential` + `bio`, no name — and that is the honest way to write
the section instead of inventing partners or dropping the page. Only named members become `Person`
in JSON-LD. Unnamed entries require `minimal-list`; `photo-grid` without names is a grid of stock
photography and the validator rejects it.

**PostList** — layouts `cards-three`, `list-rows` — `{ eyebrow?, title, items: [{title, excerpt?, meta, image?, imageAlt?}] (2–6) }`

Never invent a named person or a post. An unnamed `Team` entry is the supported alternative; there is
no equivalent for `PostList` — omit it.

**Notice** — layouts `inline-rule`, `boxed-aside`, `footnote`
`{ kind: legal|regulatory|safety|pricing, title?, body, meta? }`
Disclaimers and regulated-industry notices: "nothing here is legal advice", "no solicitor-client
relationship is created", a safety warning, a pricing caveat. **Use this rather than `RichText`.**
Block type is what the schema generator reads, so a disclaimer written as `RichText` is
indistinguishable from marketing prose and gets harvested into the page description and `llms.txt`
as though the client were asserting it. `Notice` is excluded from both by design.

## 8. FreeSection

One block whose props are a layout recipe rather than fixed slots. Reach for it only when the catalog
genuinely cannot express a section.

```jsonc
{ "type": "FreeSection", "variant": "hero/home", "props": {
  "role": "hero",                                  // hero|proof|range|story|spec|quote|process|contact|cta|nav|footer|media
  "grid": { "cols": 12, "gap": "lg", "align": "end", "pad": "xl", "minH": "70cqi" },
  "bg": { "image": "...", "kind": "environment", "overlay": true, "parallax": 0.55 },
  "children": [ /* primitive tree */ ] }}
```

**Primitives (20).** Layout: `Stack`, `Row`, `Grid` (`cols`), `Card`, `Figure` (`caption`, wraps an
`Image`). Content: `Heading` (`level` 1–6, `size` display|heading|title|body, `accent?`), `Text`
(`size` lede|body|small, `accent?`), `Eyebrow`, `Quote`, `Caption`, `Stat`,
`List` (`style` plain|dashed|rows), `Image` (`kind`, `ratio`), `Button` (`kind`, `page?`),
`Field` (`type` text|email|tel|textarea|select), `Divider`, `Spacer`,
`Badge` (`text`, `kind` accent|quiet|outline), `Marker` (`text` — `"01"`),
`KeyValue` (`rows: [{k, v}]`, min 2).

**The detail primitives are what make a section read as professional rather than as a blog post.**
`Figure` + `Caption` under a photograph, `KeyValue` for specifications, `Marker` for numbered steps,
`Badge` for certifications and materials. A section built only from `Heading` + `Text` + `Image` is
the shape of a template no matter what the theme does with it.

`accent` colours **one verbatim substring** of the same node's `text` — it is a substring, not markup,
so the heading stays one string for outline and JSON-LD extraction. An `accent` that does not occur in
`text` renders unchanged and the validator warns.

**Every node accepts:** `area` (grid-area `"r/c/r/c"`), `span`, `gap`, `pad`, `align`, `justify`,
`maxw`, `tone`, `motion: {type, delay}`, `parallax`, `unverified`.

**Motion types:** `fade`, `fade-up`, `slide-left`, `slide-right`, `scale-in`, `reveal-clip`.
Stagger with `delay` in 60–90 ms steps. Motion is disabled automatically under `prefers-reduced-motion`.

**Sizing values are token names, never raw values** — `gap: "lg"` resolves to a theme token. A raw
`"24px"` is invalid and would break re-theming.

**Chrome caveat:** build headers and footers from a single `Row` with `justify: "between"`, not fixed
grid areas — areas overlap when the viewport narrows, flex just shrinks.
