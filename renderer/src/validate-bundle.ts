/** The authoritative validator, living beside the renderer it validates against.
 *  The creator's CLI and the platform's build farm import this same module, so a
 *  bundle that passes locally cannot fail at publish time for schema reasons.
 *  "Valid on my machine, broken on deploy" is the failure that erodes trust in a
 *  platform fastest, and the only durable defence is refusing to keep two copies. */
import { catalog } from './blocks/index'
import { SiteSchema, ThemeSchema } from './schema'

export type Issue = { where: string; message: string; severity: 'error' | 'warning' }

export function validateBundle(rawSite: unknown, rawTheme: unknown): { ok: boolean; issues: Issue[] } {
  const issues: Issue[] = []
  const s = SiteSchema.safeParse(rawSite)
  const t = ThemeSchema.safeParse(rawTheme)
  if (!s.success) {
    for (const i of s.error.issues) issues.push({ where: `site.${i.path.join('.')}`, message: i.message, severity: 'error' })
  }
  if (!t.success) {
    for (const i of t.error.issues) issues.push({ where: `theme.${i.path.join('.')}`, message: i.message, severity: 'error' })
  }
  if (!s.success || !t.success) return { ok: false, issues }

  const site = s.data, theme = t.data
  const sections: Array<[string, { type: string; variant: string; props: Record<string, unknown> }]> = []
  if (site.chrome?.header) sections.push(['chrome.header', site.chrome.header])
  if (site.chrome?.footer) sections.push(['chrome.footer', site.chrome.footer])
  for (const [pageKey, page] of Object.entries(site.pages)) {
    page.blocks.forEach((b, i) => sections.push([`pages.${pageKey}.blocks[${i}]`, b]))
  }

  const usedSlugs = new Set<string>()
  let h1Pages = new Map<string, number>()

  for (const [where, b] of sections) {
    const entry = catalog[b.type]
    if (!entry) { issues.push({ where, message: `unknown block type "${b.type}"`, severity: 'error' }); continue }

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

  for (const [page, count] of h1Pages) {
    if (count > 1) issues.push({ where: `pages.${page}`, message: `${count} Hero blocks on one page — only one should carry the h1`, severity: 'error' })
  }
  for (const pageKey of Object.keys(site.pages)) {
    if (!h1Pages.has(pageKey)) issues.push({ where: `pages.${pageKey}`, message: 'page has no Hero, so no h1 — bad for SEO and for orientation', severity: 'warning' })
  }

  const unused = Object.keys(theme.sectionStyles).filter((k) => !usedSlugs.has(k))
  // A shared theme legitimately defines slugs this site does not use, so this is
  // informational only — it matters when a slug was meant to be used and was missed.
  if (unused.length) {
    issues.push({ where: 'theme.sectionStyles', message: `${unused.length} slugs defined but unused by this site`, severity: 'warning' })
  }

  return { ok: issues.every((i) => i.severity !== 'error'), issues }
}
