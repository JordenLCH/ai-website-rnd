/** Smoke test: run the real validator over the real bundles, then prove the
 *  content-vs-layout gate actually rejects a mismatch. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CATALOG_VERSION, listBlocks, getBlocks, RENDERER } from './source.ts'
import { validateBundle } from '../../renderer/src/validate-bundle.ts'
import { divergence } from './fleet.ts'

const read = (p: string) => JSON.parse(readFileSync(join(RENDERER, p), 'utf8'))

const blocks = listBlocks()
console.log(`catalog ${CATALOG_VERSION}: ${blocks.length} blocks, ${blocks.reduce((n, b) => n + b.layouts.length, 0)} layouts`)

for (const [site, theme] of [
  ['content/merryfair/site.json', 'content/merryfair/theme.json'],
  ['content/merryfair/site.json', 'content/merryfair-free/theme.json'],
  ['content/merryfair-free/site.json', 'content/merryfair-free/theme.json'],
  ['content/aonic/site.json', 'content/aonic/theme.json'],
  ['content/firstmetrology/site.json', 'content/firstmetrology/theme.json'],
] as const) {
  const r = validateBundle(read(site), read(theme))
  const errs = r.issues.filter((i) => i.severity === 'error')
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${site} × ${theme}  (${errs.length} errors, ${r.issues.length - errs.length} warnings)`)
  for (const i of r.issues.slice(0, 3)) console.log(`      ${i.severity}: ${i.where} — ${i.message}`)
}

// deliberately break it: a cutout photo under an overlay hero
const broken = read('content/merryfair/site.json')
const hero = broken.pages.home.blocks.find((b: any) => b.type === 'Hero')
hero.props.imageKind = 'cutout'
const r = validateBundle(broken, read('content/merryfair-free/theme.json'))
console.log(`\ngate check: ${r.ok ? 'DID NOT CATCH (bad)' : 'caught'} — ${r.issues.find((i) => i.severity === 'error')?.message}`)

console.log('\nschema fetch:', getBlocks(['Hero'])[0].layouts)
console.log('\ndivergence of merryfair-industrial vs fleet:')
console.table(divergence(read('content/merryfair-free/theme.json')))
