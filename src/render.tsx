import { catalog } from './blocks'
import type { Page, Site, Theme } from './schema'
import { SiteSchema, ThemeSchema } from './schema'
import { validateBundle, type Density, type Issue } from './validate-bundle'

export type { Issue, Density }

/** The preview validates through the same module the build farm runs. Keeping a second,
 *  friendlier copy here is how "valid in preview, rejected on publish" gets born, so this
 *  only parses the tree for rendering and defers every judgement to validateBundle. */
export function validate(rawSite: unknown, rawTheme: unknown):
  { site?: Site; theme?: Theme; issues: Issue[]; density: Density[]; unverified: string[] } {
  const report = validateBundle(rawSite, rawTheme)
  const s = SiteSchema.safeParse(rawSite)
  const t = ThemeSchema.safeParse(rawTheme)
  return {
    site: s.success ? s.data : undefined,
    theme: t.success ? t.data : undefined,
    ...report,
  }
}

function Section({ block, theme, pageKey }: {
  block: Page['blocks'][number]; theme: Theme; pageKey?: string
}) {
  const entry = catalog[block.type]
  const style = theme.sectionStyles[block.variant]
  if (!entry || !style) return null
  const parsed = entry.schema.safeParse(block.props)
  if (!parsed.success) return null
  const { Component } = entry
  // Chrome is declared once for the site, so it cannot know which page it is drawn on.
  // The renderer supplies that, and Nav marks the matching item `aria-current="page"`.
  const props = pageKey ? { ...(parsed.data as object), currentPage: pageKey } : parsed.data
  return (
    <div className="section" data-tone={style.tone}
      {...(block.unverified ? { 'data-unverified': 'true' } : {})}
      style={style.vars as React.CSSProperties}>
      <Component props={props} layout={style.layout} />
    </div>
  )
}

export function PageView({ page, pageKey, chrome, theme, onNavigate }: {
  page: Page; pageKey?: string
  chrome?: { header?: Page['blocks'][number]; footer?: Page['blocks'][number] }
  theme: Theme; onNavigate?: (p: string) => void
}) {
  return (
    <div className="site" style={theme.tokens as React.CSSProperties}
      onClick={(e) => {
        const el = (e.target as HTMLElement).closest('[data-page]')
        if (el && onNavigate) onNavigate(el.getAttribute('data-page')!)
      }}>
      {chrome?.header && <Section block={chrome.header} theme={theme} pageKey={pageKey} />}
      {page.blocks.map((b, i) => <Section key={i} block={b} theme={theme} />)}
      {chrome?.footer && <Section block={chrome.footer} theme={theme} pageKey={pageKey} />}
    </div>
  )
}
