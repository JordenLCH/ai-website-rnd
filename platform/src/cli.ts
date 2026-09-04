/** blackdash-build <bundle-dir> <out-dir> — what the platform runs on upload. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildSite } from './build'

const [bundleDir, outDir] = process.argv.slice(2)
if (!bundleDir || !outDir) { console.error('usage: npm run build -- <bundle-dir> <out-dir>'); process.exit(2) }

const read = (f: string) => JSON.parse(readFileSync(join(bundleDir, f), 'utf8'))
const r = buildSite(read('site.json'), read('theme.json'), read('org.json'), outDir)

for (const i of r.issues) console.log(`${i.severity}: ${i.where} — ${i.message}`)
if (!r.ok) { console.error('✗ bundle invalid — nothing built'); process.exit(1) }
console.log(`✓ built ${r.written.length} files into ${outDir}`)
