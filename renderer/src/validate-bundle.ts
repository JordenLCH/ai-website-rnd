/** The authoritative validator, living beside the renderer it validates against.
 *  The creator's CLI and the platform's build farm import this same module, so a
 *  bundle that passes locally cannot fail at publish time for schema reasons.
 *  "Valid on my machine, broken on deploy" is the failure that erodes trust in a
 *  platform fastest, and the only durable defence is refusing to keep two copies. */
import { catalog } from './blocks/index'
import { SiteSchema, ThemeSchema } from './schema'

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

export function validateBundle(rawSite: unknown, rawTheme: unknown):
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

  for (const [where, b] of sections) {
    const entry = catalog[b.type]
    if (!entry) { issues.push({ where, message: `unknown block type "${b.type}"`, severity: 'error' }); continue }

    if (b.unverified === true || hasUnverifiedNode(b.props)) unverified.push(where)
    for (const m of accentMismatches(b.props)) issues.push({ where, message: m, severity: 'warning' })

    const parsed = entry.schema.safeParse(b.props)
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
      if (page) toneRun.set(page, [...(toneRun.get(page) ?? []), style.tone])
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

  const unused = Object.keys(theme.sectionStyles).filter((k) => !usedSlugs.has(k))
  // A shared theme legitimately defines slugs this site does not use, so this is
  // informational only — it matters when a slug was meant to be used and was missed.
  if (unused.length) {
    issues.push({ where: 'theme.sectionStyles', message: `${unused.length} slugs defined but unused by this site`, severity: 'warning' })
  }

  return { ok: issues.every((i) => i.severity !== 'error'), issues, density, unverified }
}
