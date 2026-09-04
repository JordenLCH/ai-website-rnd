import { catalog } from './blocks'
import type { Page, Site, Theme } from './schema'
import { SiteSchema, ThemeSchema } from './schema'

export type Issue = { where: string; message: string }

/** Validate a site against the catalog AND the theme. Everything the AI emits passes here. */
export function validate(rawSite: unknown, rawTheme: unknown):
  { site?: Site; theme?: Theme; issues: Issue[] } {
  const s = SiteSchema.safeParse(rawSite)
  const t = ThemeSchema.safeParse(rawTheme)
  if (!s.success) return { issues: [{ where: 'site', message: s.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') }] }
  if (!t.success) return { issues: [{ where: 'theme', message: t.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') }] }

  const site = s.data, theme = t.data
  const issues: Issue[] = []

  const chromeBlocks: [string, typeof site.pages[string]['blocks'][number]][] = []
  if (site.chrome?.header) chromeBlocks.push(['chrome.header', site.chrome.header])
  if (site.chrome?.footer) chromeBlocks.push(['chrome.footer', site.chrome.footer])

  for (const [pageKey, page] of [...chromeBlocks.map(([k, b]) => [k, { blocks: [b] }] as const),
                                 ...Object.entries(site.pages)]) {
    page.blocks.forEach((b, i) => {
      const where = pageKey.startsWith('chrome.') ? `${pageKey} ${b.type}` : `${pageKey}.blocks[${i}] ${b.type}`
      const entry = catalog[b.type]
      if (!entry) { issues.push({ where, message: `unknown block type "${b.type}" — not in catalog` }); return }
      const p = entry.schema.safeParse(b.props)
      if (!p.success) issues.push({ where, message: p.error.issues.map(x => `props.${x.path.join('.')}: ${x.message}`).join('; ') })
      const style = theme.sectionStyles[b.variant]
      if (!style) { issues.push({ where, message: `variant "${b.variant}" not defined by theme "${theme.name}"` }); return }
      if (!entry.layouts.includes(style.layout)) {
        issues.push({ where, message: `theme maps "${b.variant}" -> layout "${style.layout}", not supported by ${b.type} (${entry.layouts.join(', ')})` })
      } else if (entry.check && p.success) {
        for (const m of entry.check(p.data, style.layout)) issues.push({ where, message: m })
      }
    })
  }

  return { site, theme, issues }
}

function Section({ block, theme }: { block: Page['blocks'][number]; theme: Theme }) {
  const entry = catalog[block.type]
  const style = theme.sectionStyles[block.variant]
  if (!entry || !style) return null
  const parsed = entry.schema.safeParse(block.props)
  if (!parsed.success) return null
  const { Component } = entry
  return (
    <div className="section" data-tone={style.tone} style={style.vars as React.CSSProperties}>
      <Component props={parsed.data} layout={style.layout} />
    </div>
  )
}

export function PageView({ page, chrome, theme, onNavigate }: {
  page: Page; chrome?: { header?: Page['blocks'][number]; footer?: Page['blocks'][number] }
  theme: Theme; onNavigate?: (p: string) => void
}) {
  return (
    <div className="site" style={theme.tokens as React.CSSProperties}
      onClick={(e) => {
        const el = (e.target as HTMLElement).closest('[data-page]')
        if (el && onNavigate) onNavigate(el.getAttribute('data-page')!)
      }}>
      {chrome?.header && <Section block={chrome.header} theme={theme} />}
      {page.blocks.map((b, i) => <Section key={i} block={b} theme={theme} />)}
      {chrome?.footer && <Section block={chrome.footer} theme={theme} />}
    </div>
  )
}
