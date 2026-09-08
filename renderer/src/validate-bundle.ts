/** The authoritative validator, living beside the renderer it validates against.
 *  The creator's CLI and the platform's build farm import this same module, so a
 *  bundle that passes locally cannot fail at publish time for schema reasons.
 *  "Valid on my machine, broken on deploy" is the failure that erodes trust in a
 *  platform fastest, and the only durable defence is refusing to keep two copies. */
import { catalog } from './blocks/index'
import { SiteSchema, ThemeSchema } from './schema'
import { unservedFamilies } from './fonts'

export type Issue = { where: string; message: string; severity: 'error' | 'warning' | 'info' }

/** Per-section content measurement. A section that occupies a screen and says forty words
 *  is what makes a generated site read as an unfinished template rather than a company's
 *  website, so density is measured and reported rather than left to taste. */
export type Density = { where: string; words: number; leaves: number; images: number; sparseOk: boolean; imageCapable: boolean }

/** Structure, not copy: enum values, asset paths, grid coordinates, page keys. Everything
 *  else in a props tree is counted, because the first version of this whitelisted the copy
 *  keys instead and silently scored a six-question FAQ at zero — a whitelist fails closed on
 *  every key nobody thought of, and it fails on the blocks that carry the most content. */
const STRUCTURAL_KEYS = new Set([
  'el', 'type', 'variant', 'layout', 'kind', 'size', 'tone', 'align', 'justify', 'maxw',
  'ratio', 'role', 'style', 'area', 'span', 'page', 'level', 'cols', 'gap', 'pad', 'accent',
  'alt', 'imageAlt', 'imageKind', 'motion', 'parallax', 'delay', 'href', 'url', 'id', 'slug',
])
const IMAGE_KEYS = new Set(['src', 'image', 'logo', 'photo', 'ogImage'])

/** An enum slipping past the key filter still should not read as content. Copy is either
 *  multi-word or capitalised; a bare lowercase token like "fade-up" is a value. */
const ENUMISH = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/

/** Blocks whose schema caps how much they can hold: a Stats bar is four short figures and a
 *  title, and no amount of authoring makes it reach a prose floor. Flagging them taught
 *  creators to pad the one block that must not be padded. */
const SPARSE_TYPES = new Set([
  'Hero', 'CTA', 'Breadcrumb', 'Nav', 'Footer', 'LogoWall', 'Promo', 'Stats', 'Locations',
])
const SPARSE_ROLES = new Set(['hero', 'cta', 'quote', 'nav', 'footer'])

/** Types whose schema has somewhere to put a picture. The images-per-page target is measured
 *  against these, because an Steps/Timeline/FAQ page cannot reach it at any effort. */
const IMAGE_CAPABLE = new Set([
  'Hero', 'MediaText', 'Gallery', 'CatalogGrid', 'Team', 'PostList', 'Promo', 'LogoWall',
  'Testimonials', 'FreeSection',
])

const WORDS_TARGET = 60, WORDS_FLOOR = 20
const LEAVES_TARGET = 6, LEAVES_FLOOR = 3
const PAGE_WORDS_TARGET = 700

function measure(props: unknown): { words: number; leaves: number; images: number } {
  let words = 0, leaves = 0, images = 0
  const visit = (v: unknown, key?: string) => {
    if (typeof v === 'string') {
      if (key && IMAGE_KEYS.has(key)) { images++; return }
      if (key && STRUCTURAL_KEYS.has(key)) return
      const t = v.trim()
      if (!t || ENUMISH.test(t)) return
      const w = t.split(/\s+/).length
      words += w; leaves++
      return
    }
    if (Array.isArray(v)) { for (const x of v) visit(x, key); return }
    if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) visit(x, k)
    }
  }
  visit(props)
  return { words, leaves, images }
}

/** Every declared image kind in a props tree, wherever it is spelled. */
function imageKinds(props: unknown): string[] {
  const out: string[] = []
  const visit = (v: unknown) => {
    if (Array.isArray(v)) { v.forEach(visit); return }
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>
      for (const k of ['kind', 'imageKind']) if (typeof o[k] === 'string') out.push(o[k] as string)
      Object.values(o).forEach(visit)
    }
  }
  visit(props)
  return out
}

/** Every image path in a props tree. */
function imagePaths(props: unknown): string[] {
  const out: string[] = []
  const visit = (v: unknown, key?: string) => {
    if (typeof v === 'string') { if (key && IMAGE_KEYS.has(key)) out.push(v); return }
    if (Array.isArray(v)) { v.forEach((x) => visit(x, key)); return }
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v as Record<string, unknown>)) visit(x, k)
  }
  visit(props)
  return out
}

/** Walk any props tree looking for the node-level provenance mark. */
function hasUnverifiedNode(props: unknown): boolean {
  if (Array.isArray(props)) return props.some(hasUnverifiedNode)
  if (props && typeof props === 'object') {
    const o = props as Record<string, unknown>
    if (o.unverified === true) return true
    return Object.values(o).some(hasUnverifiedNode)
  }
  return false
}

/** Every `accent` must be a verbatim slice of its own `text`, or the renderer silently
 *  drops the emphasis and the section quietly loses the detail it was written for. */
function accentMismatches(props: unknown, path: string[] = []): string[] {
  const out: string[] = []
  const visit = (v: unknown, path: string) => {
    if (Array.isArray(v)) { v.forEach((x, i) => visit(x, `${path}[${i}]`)); return }
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>
      if (typeof o.accent === 'string' && typeof o.text === 'string' && !o.text.includes(o.accent)) {
        out.push(`accent "${o.accent}" is not a substring of its text — emphasis will not render`)
      }
      for (const [k, x] of Object.entries(o)) visit(x, `${path}.${k}`)
    }
  }
  visit(props, '')
  return out
}

/** Rough hue of a CSS colour, 0-360, or null if it isn't one we can read.
 *  Only hex and hsl() — enough for a theme token, and a wrong guess here should
 *  produce silence, not a false accusation. */
function hueOf(v: string): number | null {
  const hsl = /hsla?\(\s*([\d.]+)/.exec(v)
  if (hsl) return Number(hsl[1]) % 360
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v.trim())
  if (!hex) return null
  const h = hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1]
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  if (d === 0) return null
  const deg = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return (deg * 60 + 360) % 360
}

/** Design tells that are checkable from theme.json alone, no rendering needed.
 *
 *  None of these are errors. Each names a pattern that is fine when it was chosen and
 *  telling when it was defaulted into — which is a distinction a validator cannot make,
 *  so the output is "say why", not "change it". */
function slopTells(theme: { name: string; tokens: Record<string, string> }): Issue[] {
  const out: Issue[] = []
  const t = theme.tokens

  // 1. One radius on every surface. The dominant tell of mechanically assembled design:
  //    buttons, cards, images and fields all sharing an identical corner reads as a kit,
  //    because a designer sizes the radius to the surface.
  //    Zero everywhere is the exception and is deliberately not flagged: a hard-cornered Swiss or
  //    brutalist theme is a stated position, and the first version of this rule fired on five of the
  //    most considered themes in the fleet while staying silent on the defaulted ones. The tell is a
  //    shared *non-zero* radius — "pick a number, apply it to every surface".
  const radii = ['--radius', '--radius-img', '--btn-radius', '--radius-tight']
    .map((k) => t[k]).filter(Boolean)
  const allZero = radii.every((r) => /^0(px|rem|em|%)?$/.test(r.trim()))
  if (radii.length >= 3 && new Set(radii).size === 1 && !allZero) {
    out.push({
      where: 'theme.tokens',
      message: `every radius token is "${radii[0]}" — one corner on every surface is the most common tell of assembled-not-designed. Size the radius to the surface, or set --radius-tight smaller`,
      severity: 'warning',
    })
  }

  // 2. Indigo/violet accent as the only non-neutral colour. Traced directly to Tailwind's
  //    bg-indigo-500 default and named as the loudest single AI tell of 2026.
  const accentHue = hueOf(t['--color-accent'] ?? '')
  if (accentHue !== null && accentHue >= 235 && accentHue <= 285) {
    const others = ['--color-bg', '--color-surface', '--color-ink', '--color-inverse-bg']
      .map((k) => hueOf(t[k] ?? '')).filter((h): h is number => h !== null)
    if (others.length === 0) {
      out.push({
        where: 'theme.tokens.--color-accent',
        message: `accent sits in the indigo/violet band (hue ${Math.round(accentHue)}) against an otherwise neutral palette — that is the Tailwind default and the loudest current AI tell. Keep it only if the brand actually owns that colour`,
        severity: 'warning',
      })
    }
  }

  // 3. Monospace-for-labels already has a rule further up with a better message. One tell, one
  //    warning — a duplicate teaches people to skim the list, which costs more than it catches.

  // Not a tell, but the reason the tells above are the only ones worth checking: a theme that
  // varies nothing but colour and size has left the levers that carry identity untouched.
  const structural = ['--scale-ratio', '--density', '--motion-duration', '--motion-ease', '--grid-cols', '--radius-tight']
  if (!structural.some((k) => k in t)) {
    out.push({
      where: 'theme.tokens',
      message: `no structural tokens set (${structural.join(', ')}) — this theme varies only colour and size, which is the cheapest kind of variation and the easiest to see through. Rhythm, ratio and motion carry more identity than hue`,
      severity: 'info',
    })
  }

  return out
}

/** Relative luminance of a hex colour, or null if it isn't a plain hex. */
function relLum(v: string): number | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v.trim())
  if (!hex) return null
  const h = hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1]
  const ch = [0, 2, 4].map((i) => {
    const v2 = parseInt(h.slice(i, i + 2), 16) / 255
    return v2 <= 0.03928 ? v2 / 12.92 : Math.pow((v2 + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}

function contrastRatio(a: string, b: string): number | null {
  const [x, y] = [relLum(a), relLum(b)]
  if (x === null || y === null) return null
  const [hi, lo] = x > y ? [x, y] : [y, x]
  return (hi + 0.05) / (lo + 0.05)
}

/** WCAG AA on the pairs a theme actually paints, checkable from theme.json alone.
 *
 *  This exists because a whole-fleet design QA pass found the starter's own default theme —
 *  the one every creator clones — running muted body text at 3.48:1 on white. Nothing caught it:
 *  the renderer cannot know which pairs are text-on-background, and by the time a person is
 *  looking at a rendered page they are judging the layout, not sampling colours.
 *
 *  Only body-size text is checked, at 4.5:1. Display type is often large enough for the 3:1 bar,
 *  and guessing which is which from tokens alone would produce false accusations. */
function contrastIssues(theme: { tokens: Record<string, string> }): Issue[] {
  const t = theme.tokens
  const out0: Issue[] = []
  const pairs: Array<[string, string, string]> = [
    ['--color-muted', '--color-bg', 'muted body text on the page background'],
    ['--color-muted', '--color-surface', 'muted body text on a surface-tone section'],
    ['--color-ink', '--color-bg', 'body text on the page background'],
    ['--color-on-accent', '--color-accent', 'text on an accent-tone section'],
    ['--color-inverse-muted', '--color-inverse-bg', 'muted body text on an inverse-tone section'],
    ['--color-inverse-ink', '--color-inverse-bg', 'body text on an inverse-tone section'],
  ]
  // --color-accent has two jobs and only one of them is text. As a field it backs buttons and
  // accent bands; as type it colours step numbers, credentials, markers and list bullets. A
  // colour bright enough to be a good field is usually illegible as type on a light ground —
  // wungadv's gold read 2.10:1 — so the text role gets its own token, falling back to the accent.
  const accentInk = t['--color-accent-ink'] ?? t['--color-accent']
  if (accentInk) {
    for (const bg of ['--color-bg', '--color-surface'] as const) {
      if (!(bg in t)) continue
      const r = contrastRatio(accentInk, t[bg])
      if (r === null || r >= 4.5) continue
      out0.push({
        where: '--color-accent-ink' in t ? 'theme.tokens.--color-accent-ink' : 'theme.tokens.--color-accent',
        message: `accent used as text is ${r.toFixed(2)}:1 against ${bg} — step numbers, credentials and markers are set in it. Set --color-accent-ink to a darker form; --color-accent stays as the field colour for buttons and accent bands`,
        severity: 'warning',
      })
    }
  }
  const out: Issue[] = [...out0]
  for (const [fg, bg, what] of pairs) {
    if (!(fg in t) || !(bg in t)) continue
    const r = contrastRatio(t[fg], t[bg])
    if (r === null || r >= 4.5) continue
    out.push({
      where: `theme.tokens.${fg}`,
      message: `${what} is ${r.toFixed(2)}:1 against ${bg} — WCAG AA needs 4.5:1 for body text. Darken ${fg} (or lighten it, on a dark ground) until it clears`,
      severity: 'warning',
    })
  }
  return out
}

/** Three system-level habits every mature design system encodes and a hand-assembled theme
 *  usually skips. All are checkable from theme.json alone, none is an error.
 *
 *  They are grouped because they share a cause: a theme that sets colours and sizes but never
 *  decides *by role* — which surface is raised, what a focused control looks like, how wide a
 *  line of text is allowed to get. That is the difference between a palette and a system. */
function systemIssues(theme: { tokens: Record<string, string>; direction?: { adjectives: string[] } }): Issue[] {
  const out: Issue[] = []
  const t = theme.tokens
  const has = (re: RegExp) => Object.keys(t).some((k) => re.test(k))

  // 0. The direction, in words. Not a design rule — a legibility one: without it nobody, human or
  //    agent, can say whether a later value supports the intent or fights it.
  if (!theme.direction) {
    out.push({
      where: 'theme',
      message: 'no "direction" recorded — three adjectives, what was rejected, and why. The values cannot be audited against an intent that was never written down, and the next session re-derives the intent from the values, which is how a considered theme drifts back to the default',
      severity: 'info',
    })
  } else {
    // "Modern, clean, professional" describes every website ever made, so it constrains nothing.
    const null_ = theme.direction.adjectives.filter((a) => /^(modern|clean|professional|minimal|sleek|elegant)$/i.test(a.trim()))
    if (null_.length) {
      out.push({
        where: 'theme.direction',
        message: `${null_.join(', ')} — these describe every site ever made, so they rule nothing out. Replace with adjectives that forbid something, and make one of them slightly uncomfortable`,
        severity: 'info',
      })
    }
  }

  // 1. Depth. Material 3's rule after a decade of shadow-everything: express elevation with a
  //    surface step first, shadow only for things that genuinely float and can be dismissed.
  //    A shadow on a near-black ground is close to invisible, so a dark theme with shadows and no
  //    surface ramp has no working depth cue at all.
  const shadows = Object.keys(t).filter((k) => /shadow|elevation/i.test(k))
  const ramp = has(/^--(color-)?surface-([2-9]|raised|high)/)
  if (shadows.length && !ramp) {
    out.push({
      where: 'theme.tokens',
      message: `depth is expressed only by shadow (${shadows.join(', ')}) with no surface ramp — add --color-surface-2/-3 and raise the surface instead. Shadow reads weakly on dark grounds and flattens hierarchy when every block carries one; keep it for things that float and can be dismissed (menus, dialogs, toasts)`,
      severity: 'info',
    })
  }

  // 2. Focus. The one state auditors check first and designers forget, because it never appears
  //    in a static comp. WCAG 2.2 wants the indicator itself at 3:1 against what it sits on.
  const focus = t['--color-focus'] ?? t['--focus-ring'] ?? t['--color-focus-ring']
  if (!focus) {
    out.push({
      where: 'theme.tokens',
      message: 'no focus-indicator token (--color-focus) — keyboard users get whatever the browser default is, which is frequently invisible against a branded ground. Set one and check it on both the light and inverse grounds',
      severity: 'info',
    })
  } else {
    for (const bg of ['--color-bg', '--color-inverse-bg'] as const) {
      if (!(bg in t)) continue
      const r = contrastRatio(focus, t[bg])
      if (r === null || r >= 3) continue
      out.push({
        where: 'theme.tokens.--color-focus',
        message: `focus indicator is ${r.toFixed(2)}:1 against ${bg} — WCAG 2.2 AA needs 3:1 for the indicator itself, not just for text`,
        severity: 'warning',
      })
    }
  }

  // 3. Measure. Two of the audit's layout bugs came from per-block character caps tuned on one
  //    heading — the studio habit is to set the measure once, as a token, and let the column
  //    follow from it.
  const measure = t['--measure'] ?? t['--measure-body']
  const ch = measure ? Number(/^([\d.]+)ch$/.exec(measure.trim())?.[1]) : NaN
  if (measure && Number.isFinite(ch) && (ch < 45 || ch > 75)) {
    out.push({
      where: 'theme.tokens',
      message: `body measure is ${ch}ch — running text reads best between 45 and 75 characters; outside that the eye loses the line on the return sweep`,
      severity: 'warning',
    })
  }

  return out
}

/** Blocks a visitor reads as evidence, and blocks that ask for something. A studio orders a page
 *  so the evidence lands before the ask — proof placed after the request has nothing left to
 *  support. Both sets are deliberately small: a wrong guess here produces a false accusation
 *  about editorial judgement, which is worse than staying quiet. */
const PROOF_TYPES = new Set(['Testimonials', 'LogoWall', 'Stats', 'Team'])
const ASK_TYPES = new Set(['CTA'])

/** Every plausible spelling of a call-to-action label in a props tree. Used only to compare
 *  wordings with each other, never to judge the copy itself. */
function ctaLabels(props: unknown): string[] {
  const out: string[] = []
  const visit = (v: unknown, key?: string) => {
    if (typeof v === 'string') {
      if (key && /^(label|cta|action|buttonText)$/i.test(key) && v.trim()) out.push(v.trim())
      return
    }
    if (Array.isArray(v)) { v.forEach((x) => visit(x, key)); return }
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v as Record<string, unknown>)) visit(x, k)
  }
  visit(props)
  return out
}

type Placed = { where: string; type: string; layout: string; tone: string }

/** Page-order rules a studio applies by eye, made checkable.
 *
 *  None are errors. Each describes a page that validates, renders and still reads as assembled:
 *  the same shape twice in a row, an ask with no evidence in front of it, a long page with one
 *  action at the bottom, or the same action called three different things. All four are visible
 *  in a 50%-zoom scroll and invisible to every other check here. */
function structureIssues(pages: Map<string, Placed[]>): Issue[] {
  const out: Issue[] = []
  for (const [page, run] of pages) {
    // 1. Two consecutive sections of the same type *and* layout read as one long section, and the
    //    second one stops being read. Alternating image-left / image-right counts as one shape.
    for (let i = 1; i < run.length; i++) {
      if (run[i].type === run[i - 1].type && run[i].layout === run[i - 1].layout) {
        out.push({
          where: run[i].where,
          message: `same shape twice in a row — ${run[i].type}/${run[i].layout} follows an identical section. Two adjacent sections of one shape scroll as a single block; change the layout on one of them or merge them`,
          severity: 'info',
        })
        break
      }
    }

    // 2. Proof belongs in front of the first ask.
    const firstAsk = run.findIndex((b) => ASK_TYPES.has(b.type))
    if (firstAsk > 0) {
      const proofBefore = run.slice(0, firstAsk).some((b) => PROOF_TYPES.has(b.type))
      const proofAfter = run.slice(firstAsk).some((b) => PROOF_TYPES.has(b.type))
      if (!proofBefore && proofAfter) {
        out.push({
          where: run[firstAsk].where,
          message: `the first ask on this page comes before any evidence — the proof sections all sit after it. Move one above the ask; a testimonial the visitor reads after being asked has nothing left to support`,
          severity: 'info',
        })
      }
    }

    // 3. A long page with a single action at the very end asks once, after the reader has already
    //    decided. Studios repeat the same action roughly every two screens.
    const asks = run.map((b, i) => (ASK_TYPES.has(b.type) ? i : -1)).filter((i) => i >= 0)
    if (run.length >= 8 && asks.length === 1 && asks[0] >= run.length - 2) {
      out.push({
        where: `pages.${page}`,
        message: `${run.length} sections and one action, at the bottom — repeat the same CTA around the midpoint. Identical wording, so it reads as one action offered twice, not two different ones`,
        severity: 'info',
      })
    }
  }
  return out
}

/** The identity facts this validator needs. A structural subset of the platform's `Org`,
 *  redeclared rather than imported so the renderer keeps no dependency on `platform/`. */
export type OrgFacts = {
  name?: string
  legalName?: string
  registration?: string
  address?: { country?: string }
}

/** Every letter and digit, lowercased — so "202001012345 (1234567-X)" in org.json still
 *  matches "Registration No. 202001012345 (1234567-X)" set with different punctuation,
 *  spacing or a non-breaking space in the footer copy. */
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

const MY_COUNTRY = /^(my|mys|malaysia)$/i
const MY_ENTITY = /\b(sdn\.?\s*bhd|sendirian\s+berhad|berhad|bhd)\b|\(\s*\d{12}\s*\)|\bplt\b/i

/** Is this a Malaysian company? The registered address is the fact; the entity suffix is
 *  a fallback for a brief that gave the legal name but no address. */
function isMalaysian(org: OrgFacts): boolean {
  const country = org.address?.country?.trim()
  if (country) return MY_COUNTRY.test(country)
  return MY_ENTITY.test(org.legalName ?? '') || MY_ENTITY.test(org.name ?? '')
}

/** Section 30(2) Companies Act 2016 requires a Malaysian company to disclose its registered
 *  name *and* company registration number on its website — the subsection names websites
 *  explicitly, alongside letters and invoices. Non-compliance is an offence carrying up to
 *  RM50,000. Because the footer is site chrome it appears on every page, which is what makes
 *  it the right and only place for this: a compliance line in a page's blocks is a line that
 *  is missing from four other pages.
 *
 *  This is a jurisdiction rule, not a schema rule — it cannot live in Footer's props, because
 *  the same footer shape is correct for a client outside Malaysia. */
function jurisdictionIssues(
  footer: { props: Record<string, unknown> } | undefined,
  org: OrgFacts | undefined,
): Issue[] {
  if (!org || !isMalaysian(org)) return []

  const registered = org.legalName ?? org.name
  const missing: string[] = []
  if (!org.registration) missing.push('org.registration')
  if (!registered) missing.push('org.legalName')
  if (missing.length) {
    return [{
      where: 'org',
      message: `Malaysian company: ${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} required — s.30(2) Companies Act 2016 obliges the registered name and registration number to appear on the company's website. Ask the client; never guess a registration number`,
      severity: 'error',
    }]
  }
  if (!footer) {
    return [{
      where: 'site.chrome.footer',
      message: 'Malaysian company: the site has no footer, so the registered name and registration number appear nowhere — s.30(2) Companies Act 2016 requires both on the website',
      severity: 'error',
    }]
  }

  const text = squash(JSON.stringify(footer.props))
  const absent: string[] = []
  if (!text.includes(squash(org.registration!))) absent.push(`registration number "${org.registration}"`)
  if (!text.includes(squash(registered!))) absent.push(`registered name "${registered}"`)
  if (!absent.length) return []
  return [{
    where: 'site.chrome.footer',
    message: `Malaysian company: footer is missing ${absent.join(' and ')} — s.30(2) Companies Act 2016. Put both in the footer's legal.line, e.g. "${registered} (Registration No. ${org.registration}) · © ${new Date().getFullYear()}"`,
    severity: 'error',
  }]
}

/** Chrome is the only part of a site that appears on every page, so a weakness here is a
 *  weakness repeated everywhere — which is why these are checked separately from a block's own
 *  `check`, whose findings are errors. None of these should stop a build; all of them should be
 *  fixed before a client sees the site. */
function chromeIssues(site: { chrome?: { header?: { type: string; props: Record<string, unknown> }; footer?: { type: string; props: Record<string, unknown> } } }): Issue[] {
  const out: Issue[] = []
  const footer = site.chrome?.footer
  if (footer?.type === 'Footer') {
    const p = footer.props as {
      columns?: Array<{ title: string; links: Array<{ label: string; page?: string } | string> }>
      contact?: unknown; legal?: { line?: string }
    }
    // The catalog rendered these as bare list items for the whole life of the project: words
    // that look like links, are not focusable, are not announced as links and go nowhere.
    const inert = (p.columns ?? []).flatMap((c) =>
      (c.links ?? []).filter((l) => typeof l === 'string' || !l.page)
        .map((l) => `${c.title} › ${typeof l === 'string' ? l : l.label}`))
    if (inert.length) {
      out.push({
        where: 'site.chrome.footer',
        message: `${inert.length} footer link(s) have no "page" and render as plain text (${inert.slice(0, 4).join(', ')}${inert.length > 4 ? ', …' : ''}) — give each a page key, a URL, a "mailto:" or a "tel:"`,
        severity: 'warning',
      })
    }
    if (!p.contact) {
      out.push({
        where: 'site.chrome.footer',
        message: 'no "contact" — a phone, email or address in the footer is what visitors come here for, and the footer is the only place it reaches every page',
        severity: 'warning',
      })
    }
    if (!p.legal?.line) {
      out.push({
        where: 'site.chrome.footer',
        message: 'no "legal.line" — the copyright line, and in some jurisdictions the registered name and company registration number, belong in this row',
        severity: 'info',
      })
    }
  }
  const header = site.chrome?.header
  if (header?.type === 'Nav') {
    const p = header.props as { utility?: unknown; action?: unknown }
    if (!p.utility) {
      out.push({
        where: 'site.chrome.header',
        message: 'no "utility" strip — a phone number or email above the main bar is how contact details reach every page without spending one of the seven nav slots',
        severity: 'info',
      })
    }
  }
  return out
}

export function validateBundle(rawSite: unknown, rawTheme: unknown, rawOrg?: unknown):
  { ok: boolean; issues: Issue[]; density: Density[]; unverified: string[] } {
  const issues: Issue[] = []
  const s = SiteSchema.safeParse(rawSite)
  const t = ThemeSchema.safeParse(rawTheme)
  if (!s.success) {
    for (const i of s.error.issues) issues.push({ where: `site.${i.path.join('.')}`, message: i.message, severity: 'error' })
  }
  if (!t.success) {
    for (const i of t.error.issues) issues.push({ where: `theme.${i.path.join('.')}`, message: i.message, severity: 'error' })
  }
  if (!s.success || !t.success) return { ok: false, issues, density: [], unverified: [] }

  const site = s.data, theme = t.data
  const sections: Array<[string, { type: string; variant: string; props: Record<string, unknown>; unverified?: boolean }]> = []
  if (site.chrome?.header) sections.push(['chrome.header', site.chrome.header])
  if (site.chrome?.footer) sections.push(['chrome.footer', site.chrome.footer])
  for (const [pageKey, page] of Object.entries(site.pages)) {
    page.blocks.forEach((b, i) => sections.push([`pages.${pageKey}.blocks[${i}]`, b]))
  }

  const usedSlugs = new Set<string>()
  let h1Pages = new Map<string, number>()
  const density: Density[] = []
  const unverified: string[] = []
  /** tone per page, in document order, for the band-rhythm check */
  const toneRun = new Map<string, string[]>()
  /** how often each image is placed, across the whole site */
  const imageUse = new Map<string, number>()
  /** type + resolved layout per page, in document order, for the page-order rules */
  const placed = new Map<string, Placed[]>()
  /** every wording used for a call to action, across the site */
  const askWordings = new Set<string>()

  for (const [where, b] of sections) {
    const entry = catalog[b.type]
    if (!entry) { issues.push({ where, message: `unknown block type "${b.type}"`, severity: 'error' }); continue }

    if (b.unverified === true || hasUnverifiedNode(b.props)) unverified.push(where)
    for (const m of accentMismatches(b.props)) issues.push({ where, message: m, severity: 'warning' })

    // Current shape first; on failure, the block's declared old shapes, newest first. A bundle
    // written against last year's catalog stays valid and renders correctly — the alternative is
    // a fleet-wide rewrite of stored JSON every time a prop is renamed, which is a migration with
    // no undo. See Deprecation in blocks/shared.ts.
    let parsed = entry.schema.safeParse(b.props)
    if (!parsed.success && entry.deprecated?.length) {
      for (const d of entry.deprecated) {
        const old = d.schema.safeParse(b.props)
        if (!old.success) continue
        const forward = entry.schema.safeParse(d.migrate(old.data))
        if (!forward.success) {
          // The migration itself is broken. That is a platform bug, not a content bug, and it must
          // not read as "the author wrote bad props".
          issues.push({ where, message: `migration for ${b.type} (${d.note}) produced props the current schema rejects — platform bug, not a content problem`, severity: 'error' })
          break
        }
        parsed = forward
        b.props = forward.data as Record<string, unknown>
        issues.push({ where, message: `${b.type} uses a deprecated prop shape and was migrated in place: ${d.note}. Re-package to persist it`, severity: 'info' })
        break
      }
    }
    if (!parsed.success) {
      for (const i of parsed.error.issues) {
        issues.push({ where: `${where}.props.${i.path.join('.')}`, message: i.message, severity: 'error' })
      }
    }

    const style = theme.sectionStyles[b.variant]
    if (!style) {
      issues.push({ where, message: `variant "${b.variant}" is not defined by theme "${theme.name}"`, severity: 'error' })
      continue
    }
    usedSlugs.add(b.variant)

    if (!entry.layouts.includes(style.layout)) {
      issues.push({
        where,
        message: `theme maps "${b.variant}" to layout "${style.layout}", which ${b.type} does not implement (${entry.layouts.join(', ')})`,
        severity: 'error',
      })
    } else if (entry.check && parsed.success) {
      for (const m of entry.check(parsed.data, style.layout)) {
        issues.push({ where, message: m, severity: 'error' })
      }
    }

    if (style) {
      const page = where.startsWith('pages.') ? where.split('.')[1] : null
      if (page) {
        toneRun.set(page, [...(toneRun.get(page) ?? []), style.tone])
        // Every FreeSection resolves to the one layout "free", so type+layout says nothing about
        // what it looks like — its shape is the role and the column count it was composed with.
        const p = b.props as any
        const shape = b.type === 'FreeSection'
          ? `free:${p?.role ?? '?'}:${p?.grid?.cols ?? '?'}`
          : style.layout
        placed.set(page, [...(placed.get(page) ?? []), { where, type: b.type, layout: shape, tone: style.tone }])
      }
    }
    if (ASK_TYPES.has(b.type)) for (const l of ctaLabels(b.props)) askWordings.add(l.toLowerCase())

    // Every theme's --overlay is a dark scrim — that is what the token is for, and all six in
    // the repo are dark. The copy on top of it inherits the section's tone, so pairing the
    // layout with a light tone paints dark ink on a darkened photograph. Nothing caught it,
    // because both halves are individually valid. Every shipped bundle already pairs it with
    // "inverse"; this makes the pairing a rule rather than a habit.
    if (style && style.layout === 'overlay-fullbleed' && style.tone !== 'inverse' && style.tone !== 'accent') {
      issues.push({
        where,
        message: `layout "overlay-fullbleed" paints a dark scrim over the image, so its copy needs a light tone — this variant is "${style.tone}". Set the section's tone to "inverse" (or "accent")`,
        severity: 'error',
      })
    }

    // A product shot on white, dropped into an inverse-tone section, reads as a hole
    // punched in the page — the section has images and still looks empty. The same
    // reasoning already gates overlay-fullbleed; it applies to any dark ground.
    if (style && style.tone === 'inverse' && imageKinds(b.props).includes('cutout')) {
      issues.push({
        where,
        message: 'a "cutout" image sits in an inverse-tone section — a product shot on white disappears against a dark ground; use an "environment" or "detail" image, or move the section to a light tone',
        severity: 'warning',
      })
    }
    for (const src of imagePaths(b.props)) imageUse.set(src, (imageUse.get(src) ?? 0) + 1)

    const role = (b.props as any)?.role
    const sparseOk = SPARSE_TYPES.has(b.type) || (typeof role === 'string' && SPARSE_ROLES.has(role))
    const m = measure(b.props)
    density.push({ where, ...m, sparseOk, imageCapable: IMAGE_CAPABLE.has(b.type) })
    if (!sparseOk) {
      if (m.leaves === 0) {
        issues.push({ where, message: 'section carries no readable copy at all', severity: 'error' })
      } else if (m.words < WORDS_FLOOR && m.leaves < LEAVES_FLOOR) {
        issues.push({
          where,
          message: `thin section — ${m.words} words across ${m.leaves} content nodes (floor ${WORDS_FLOOR}/${LEAVES_FLOOR}, aim ${WORDS_TARGET}/${LEAVES_TARGET}). A full-height section this empty reads as a template placeholder`,
          severity: 'warning',
        })
      } else if (m.words < WORDS_TARGET && m.leaves < LEAVES_TARGET) {
        issues.push({
          where,
          message: `under-filled — ${m.words} words across ${m.leaves} content nodes, aim ${WORDS_TARGET}/${LEAVES_TARGET}. Add captions, spec rows or numbered detail rather than more whitespace`,
          severity: 'info',
        })
      }
    }

    // page-level house rule: exactly one h1, and it lives in the hero.
    // A FreeSection with role "hero" carries the h1 too — counting only the Hero
    // block type would flag every freely-composed page as missing one.
    const isHero = b.type === 'Hero' || (b.type === 'FreeSection' && (b.props as any)?.role === 'hero')
    if (parsed.success && isHero) {
      if (where.startsWith('pages.')) {
        const page = where.split('.')[1]
        h1Pages.set(page, (h1Pages.get(page) ?? 0) + 1)
      }
    }
  }

  for (const [page, tones] of toneRun) {
    let run = 1
    for (let i = 1; i < tones.length; i++) {
      run = tones[i] === tones[i - 1] ? run + 1 : 1
      if (run === 4) {
        issues.push({
          where: `pages.${page}`,
          message: `${run}+ consecutive sections share tone "${tones[i]}" — without a band break the page scrolls as one undifferentiated column`,
          severity: 'info',
        })
        break
      }
    }
  }

  for (const pageKey of Object.keys(site.pages)) {
    const own = density.filter((d) => d.where.startsWith(`pages.${pageKey}.`))
    if (own.length < 3) continue
    const words = own.reduce((a, d) => a + d.words, 0)
    const images = own.reduce((a, d) => a + d.images, 0)
    const capable = own.filter((d) => d.imageCapable).length
    if (words < PAGE_WORDS_TARGET) {
      issues.push({
        where: `pages.${pageKey}`,
        message: `${words} words across ${own.length} sections — a page a visitor treats as a real company's site runs nearer ${PAGE_WORDS_TARGET}`,
        severity: 'info',
      })
    }
    if (capable && images < Math.ceil(capable / 2)) {
      issues.push({
        where: `pages.${pageKey}`,
        message: `${images} images across ${capable} sections that can carry one — aim for one per two`,
        severity: 'info',
      })
    }
  }

  if (unverified.length) {
    issues.push({
      where: 'site',
      message: `${unverified.length} section(s) marked unverified — excluded from JSON-LD and blocking publish until a human confirms or corrects them`,
      severity: 'info',
    })
  }

  for (const [page, count] of h1Pages) {
    if (count > 1) issues.push({ where: `pages.${page}`, message: `${count} Hero blocks on one page — only one should carry the h1`, severity: 'error' })
  }
  for (const pageKey of Object.keys(site.pages)) {
    if (!h1Pages.has(pageKey)) issues.push({ where: `pages.${pageKey}`, message: 'page has no Hero, so no h1 — bad for SEO and for orientation', severity: 'warning' })
  }

  // A font the platform does not serve is the quietest possible failure: the page loads,
  // the layout is correct, and only the typeface is wrong — and typography is the layer
  // carrying the most identity after the layout map. Nothing else in the pipeline notices,
  // because a missing webfont is not an error in CSS, it is a fallback.
  const unserved = unservedFamilies(theme.tokens)
  if (unserved.length) {
    issues.push({
      where: 'theme.tokens',
      message: `${unserved.join(', ')} ${unserved.length > 1 ? 'are' : 'is'} not served by the platform — the page will silently render in the system stack instead. Either choose a family the platform loads, or ask for it to be added to renderer/src/fonts.ts along with the weights that family actually publishes`,
      severity: 'error',
    })
  }

  // Monospace for eyebrows and numerals is the most-reached-for "technical" gesture
  // and now the strongest sameness tell: those two tokens feed ~20 call sites, so one
  // choice puts 30-45 monospaced elements on a page — captions, product meta, every
  // figure. Numerals want tabular-nums, which the renderer already applies.
  const monoTokens = (['--font-eyebrow', '--font-numeral'] as const)
    .filter((k) => /\bmono(space)?\b|ui-monospace|Courier/i.test(theme.tokens[k] ?? ''))
  if (monoTokens.length) {
    issues.push({
      where: 'theme.tokens',
      message: `${monoTokens.join(' and ')} set to a monospace face — it reaches ~20 call sites and reads as a generated-site tell; use the body stack and let font-variant-numeric handle figure alignment`,
      severity: 'warning',
    })
  }

  // The same photograph in the same role across a site is what makes two sites built
  // from one asset folder look like one site.
  for (const [src, n] of imageUse) {
    if (n >= 4) {
      issues.push({
        where: 'site',
        message: `"${src.split('/').pop()}" is placed ${n} times — one photograph carrying four sections reads as a thin asset set; vary it or cut a section`,
        severity: 'info',
      })
    }
  }

  // One action, called three things, reads as three different offers — so the wordings are
  // compared across the whole site rather than per page.
  if (askWordings.size >= 3) {
    issues.push({
      where: 'site',
      message: `the call to action is worded ${askWordings.size} different ways (${[...askWordings].slice(0, 4).join(' / ')}) — repeat one wording so it reads as the same action offered again, not a new one`,
      severity: 'info',
    })
  }

  issues.push(...chromeIssues(site))
  issues.push(...jurisdictionIssues(site.chrome?.footer, rawOrg as OrgFacts | undefined))
  issues.push(...structureIssues(placed))
  issues.push(...slopTells(theme))
  issues.push(...systemIssues(theme))
  issues.push(...contrastIssues(theme))

  const unused = Object.keys(theme.sectionStyles).filter((k) => !usedSlugs.has(k))
  // A shared theme legitimately defines slugs this site does not use, so this is
  // informational only — it matters when a slug was meant to be used and was missed.
  if (unused.length) {
    issues.push({ where: 'theme.sectionStyles', message: `${unused.length} slugs defined but unused by this site`, severity: 'warning' })
  }

  return { ok: issues.every((i) => i.severity !== 'error'), issues, density, unverified }
}
