/** Smoke test: run the real validator over the real bundles, then prove the
 *  content-vs-layout gate actually rejects a mismatch. */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CATALOG_VERSION, listBlocks, getBlocks, FIXTURES } from './source.ts'
import { validateBundle } from '@blackdash/renderer/validate-bundle'
import { divergence } from './fleet.ts'

const read = (p: string) => JSON.parse(readFileSync(join(FIXTURES, p), 'utf8'))
const has = (...p: string[]) => p.every((f) => existsSync(join(FIXTURES, f)))

const blocks = listBlocks()
console.log(`catalog ${CATALOG_VERSION}: ${blocks.length} blocks, ${blocks.reduce((n, b) => n + b.layouts.length, 0)} layouts`)

for (const [site, theme] of [
  ['merryfair/site.json', 'merryfair/theme.json'],
  ['merryfair/site.json', 'merryfair-free/theme.json'],
  ['merryfair-free/site.json', 'merryfair-free/theme.json'],
] as const) {
  /* The fixtures are gitignored client copies, so a fresh clone has none. Say so and move on —
     a smoke test that dies on a missing fixture reads as a broken catalog. */
  if (!has(site, theme)) { console.log(`SKIP  ${site} × ${theme}  (no fixture — see mcp/fixtures/README.md)`); continue }
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
if (has('merryfair-free/theme.json')) {
  const d = divergence(read('merryfair-free/theme.json'))
  console.log(`\ndivergence of merryfair-free vs fleet (${d.length} sibling(s)):`)
  if (d.length) console.table(d)
  else console.log('  content/ is empty — nothing to diverge from, so this check did not run')
}
