/** Smoke test: run the real validator over the real bundles, then prove the
 *  content-vs-layout gate actually rejects a mismatch. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CATALOG_VERSION, listBlocks, getBlocks, FLEET } from './source.ts'
import { validateBundle } from '@blackdash/renderer/validate-bundle'
import { divergence } from './fleet.ts'

const read = (p: string) => JSON.parse(readFileSync(join(FLEET, p), 'utf8'))

const blocks = listBlocks()
console.log(`catalog ${CATALOG_VERSION}: ${blocks.length} blocks, ${blocks.reduce((n, b) => n + b.layouts.length, 0)} layouts`)

for (const [site, theme] of [
  ['merryfair/site.json', 'merryfair/theme.json'],
  ['merryfair/site.json', 'merryfair-free/theme.json'],
  ['merryfair-free/site.json', 'merryfair-free/theme.json'],
  ['aonic/site.json', 'aonic/theme.json'],
  ['firstmetrology/site.json', 'firstmetrology/theme.json'],
] as const) {
  const r = validateBundle(read(site), read(theme))
  const errs = r.issues.filter((i) => i.severity === 'error')
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${site} × ${theme}  (${errs.length} errors, ${r.issues.length - errs.length} warnings)`)
  for (const i of r.issues.slice(0, 3)) console.log(`      ${i.severity}: ${i.where} — ${i.message}`)
}

// deliberately break it: a cutout photo under an overlay hero
const broken = read('merryfair/site.json')
const hero = broken.pages.home.blocks.find((b: any) => b.type === 'Hero')
hero.props.imageKind = 'cutout'
const r = validateBundle(broken, read('merryfair-free/theme.json'))
console.log(`\ngate check: ${r.ok ? 'DID NOT CATCH (bad)' : 'caught'} — ${r.issues.find((i) => i.severity === 'error')?.message}`)

console.log('\nschema fetch:', getBlocks(['Hero'])[0].layouts)
console.log('\ndivergence of merryfair-industrial vs fleet:')
console.table(divergence(read('merryfair-free/theme.json')))
