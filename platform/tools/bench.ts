/** Fleet benchmark. Static half — everything measurable without rendering.
 *
 *  Usage: npm run bench -- <dir-containing-bundle-dirs> [more dirs...]
 *  A bundle dir is any directory holding site.json + theme.json.
 *
 *  The browser half (words per 1000px of rendered page) lives in bench-render.mjs, because
 *  density per *screen* is the number that actually separates a site from a blog post and it
 *  cannot be derived from JSON — a section with 60 words is dense at 400px tall and thin at 900.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { validateBundle } from '@blackdash/renderer/validate-bundle'

const STRUCTURAL = ['--scale-ratio', '--density', '--motion-duration', '--motion-ease',
  '--grid-cols', '--breakout', '--radius-tight', '--elev-1']

type Row = {
  bundle: string; pages: number; sections: number; words: number; wordsPerPage: number
  wordsPerSection: number; images: number; thin: number; err: number; warn: number
  structural: number; tells: string[]; layoutMap: string
}

const rows: Row[] = []

for (const root of process.argv.slice(2)) {
  for (const name of readdirSync(root)) {
    const dir = join(root, name)
    const sitePath = join(dir, 'site.json'), themePath = join(dir, 'theme.json')
    if (!existsSync(sitePath) || !existsSync(themePath)) continue
    const site = JSON.parse(readFileSync(sitePath, 'utf8'))
    const theme = JSON.parse(readFileSync(themePath, 'utf8'))
    const { issues, density } = validateBundle(site, theme)

    const words = density.reduce((a, d) => a + d.words, 0)
    const images = density.reduce((a, d) => a + d.images, 0)
    // "thin" uses the validator's own bar, so the number moves when the bar does.
    const thin = density.filter((d) => !d.sparseOk && d.words < 60).length
    const pages = Object.keys(site.pages).length

    // The layout map is the fingerprint that matters — two sites sharing it are one site in two
    // colourways, however different the palettes look.
    const layoutMap = Object.entries(theme.sectionStyles as Record<string, any>)
      .map(([slug, s]) => `${slug}=${s.layout}/${s.tone}`).sort().join('|')

    rows.push({
      bundle: name, pages, sections: density.length, words,
      wordsPerPage: Math.round(words / pages),
      wordsPerSection: Math.round(words / (density.length || 1)),
      images, thin,
      err: issues.filter((i) => i.severity === 'error').length,
      warn: issues.filter((i) => i.severity === 'warning').length,
      structural: STRUCTURAL.filter((k) => k in theme.tokens).length,
      tells: issues.filter((i) => i.severity === 'warning' && i.where.startsWith('theme.tokens'))
        .map((i) => i.message.split('—')[0].trim().slice(0, 34)),
      layoutMap,
    })
  }
}

console.table(rows.map(({ layoutMap, tells, ...r }) => ({ ...r, tells: tells.length })))

console.log('\nTheme tells:')
for (const r of rows) for (const t of r.tells) console.log(`  ${r.bundle.padEnd(20)} ${t}`)

// Pairwise layout-map overlap. Above ~0.7 the two sites are structurally the same site.
console.log('\nLayout-map overlap (>0.70 = same site, recoloured):')
const pairs: Array<{ a: string; b: string; overlap: number }> = []
for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
  const A = new Set(rows[i].layoutMap.split('|')), B = new Set(rows[j].layoutMap.split('|'))
  const shared = [...A].filter((x) => B.has(x)).length
  const overlap = shared / Math.max(A.size, B.size, 1)
  if (overlap > 0.4) pairs.push({ a: rows[i].bundle, b: rows[j].bundle, overlap: Number(overlap.toFixed(2)) })
}
pairs.sort((x, y) => y.overlap - x.overlap)
console.table(pairs.slice(0, 12))
