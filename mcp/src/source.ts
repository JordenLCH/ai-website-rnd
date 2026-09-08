/** The catalog is imported from the renderer package, not copied.
 *  That is the whole point: if a block ships, the MCP serves it the same day,
 *  and no distributed skill can go stale describing blocks that changed. */
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { catalog } from '../../renderer/src/blocks/index.ts'

const here = dirname(fileURLToPath(import.meta.url))
export const RENDERER = join(here, '..', '..', 'renderer', 'src')

/** Derived from the catalog's own shape — see renderer/src/catalog-version.ts. It was a literal
 *  here, bumped by hand, and it had already fallen behind two schema changes. */
export { CATALOG_VERSION } from '../../renderer/src/catalog-version.ts'

/** One line per block: enough for a model to choose, cheap enough to send every session. */
const SUMMARY: Record<string, string> = {
  Nav: 'Site header: brand, links, one action. Belongs in site.chrome.',
  Footer: 'Site footer: brand, link columns, legal note. Belongs in site.chrome.',
  Breadcrumb: 'Trail back to the parent page. Subpages only.',
  Hero: 'Page opener. Eyebrow, title, body, up to two actions, optional photo.',
  Promo: 'Thin announcement band for one message.',
  Features: 'Two to six capabilities or product families, optionally with images.',
  MediaText: 'One image beside several paragraphs. The workhorse story section.',
  RichText: 'Prose without imagery, optionally with an aside.',
  Steps: 'An ordered process, numbered automatically.',
  Timeline: 'Dated or staged history.',
  Stats: 'Two to four headline numbers.',
  Testimonials: 'Customer quotes, one large or several small.',
  LogoWall: 'Text labels for certifications, markets or partners.',
  SpecTable: 'Grouped key/value specifications.',
  CatalogGrid: 'Product cards with image, blurb, meta and optional tag.',
  Pricing: 'Two to four plans with feature lists.',
  Gallery: 'Three to nine images, captioned.',
  CTA: 'A single call to action with one button.',
  ContactForm: 'Labelled fields plus a submit action.',
  Locations: 'Addresses, optionally beside a photo.',
  FAQ: 'Questions and answers.',
  Team: 'People with names and roles. Only with real people in the brief.',
  PostList: 'Articles or news. Only with real posts in the brief.',
  FreeSection: 'Escape hatch: a grid recipe plus a tree of primitives. Use sparingly.',
}

export type BlockSummary = { type: string; summary: string; layouts: string[]; hasContentRules: boolean }

export function listBlocks(): BlockSummary[] {
  return Object.entries(catalog).map(([type, entry]) => ({
    type,
    summary: SUMMARY[type] ?? '',
    layouts: [...entry.layouts],
    hasContentRules: typeof entry.check === 'function',
  }))
}

export function getBlocks(types: string[]) {
  return types.map((type) => {
    const entry = catalog[type]
    if (!entry) return { type, error: `unknown block "${type}"` }
    return {
      type,
      summary: SUMMARY[type] ?? '',
      layouts: [...entry.layouts],
      props: zodToJsonSchema(entry.schema as never, { target: 'jsonSchema7', $refStrategy: 'none' }),
      contentRules: typeof entry.check === 'function'
        ? 'This block cross-checks props against the chosen layout; validate before publishing.'
        : null,
    }
  })
}

/** The fleet, read from the renderer's content directory — one folder per site. */
export function readThemes(): Record<string, any> {
  const dir = join(RENDERER, 'content')
  const out: Record<string, any> = {}
  for (const client of readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const file = join(dir, client.name, 'theme.json')
    try {
      const theme = JSON.parse(readFileSync(file, 'utf8'))
      out[theme.name ?? client.name] = theme
    } catch { /* a client folder without a theme yet is fine */ }
  }
  return out
}
