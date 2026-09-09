/** blackdash-build <bundle-dir> <out-dir> — what the platform runs on upload. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildSite } from './build'
import { deployToPages } from './deploy'

const args = process.argv.slice(2)
const allowUnverified = args.includes('--allow-unverified')
/** Deploying is opt-in and takes the domain explicitly. A build that published every time it ran
 *  would publish a bundle somebody was only checking. */
const deployTo = args.find((a) => a.startsWith('--deploy='))?.slice('--deploy='.length)
const [bundleDir, outDir] = args.filter((a) => !a.startsWith('--'))
if (!bundleDir || !outDir) {
  console.error('usage: npm run build -- <bundle-dir> <out-dir> [--allow-unverified] [--deploy=<domain>]')
  process.exit(2)
}

const read = (f: string) => JSON.parse(readFileSync(join(bundleDir, f), 'utf8'))
const r = buildSite(read('site.json'), read('theme.json'), read('org.json'), outDir, { allowUnverified, bundleDir })

for (const i of r.issues) console.log(`${i.severity}: ${i.where} — ${i.message}`)
if (!r.ok) { console.error('✗ bundle invalid — nothing built'); process.exit(1) }
console.log(`✓ built ${r.written.length} files into ${outDir}`)

if (deployTo) {
  const d = await deployToPages(deployTo, outDir)
  if (d.status === 'skipped') console.log(`deploy skipped — ${d.reason}`)
  else {
    console.log(`✓ deployed to Cloudflare Pages project "${d.project}"`)
    if (d.domain) console.log(`  ${d.domain.name}: ${d.domain.status}`)
    else console.log(`  no custom domain attached — check the domain and the API token's Pages scope`)
  }
}
