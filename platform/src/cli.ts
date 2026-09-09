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

/** A missing file used to arrive as a bare ENOENT, which says which path was not found and
 *  nothing about why the build wanted it. org.json is the one people actually hit: it holds the
 *  facts no marketing copy states and no model may invent, and the entity graph — the highest-value
 *  thing this pipeline emits — is derived entirely from it. */
const read = (f: string) => {
  try {
    return JSON.parse(readFileSync(join(bundleDir, f), 'utf8'))
  } catch (e) {
    const why = (e as NodeJS.ErrnoException).code === 'ENOENT'
      ? f === 'org.json'
        ? 'every published site needs it: legal name, registration number, address, phone, sameAs profiles. ' +
          'These are collected at intake and never guessed — the Organization/LocalBusiness graph is built from this file alone'
        : 'a bundle is site.json, theme.json and org.json'
      : `it is not valid JSON — ${(e as Error).message}`
    console.error(`✗ ${join(bundleDir, f)}: ${why}`)
    process.exit(1)
  }
}
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
