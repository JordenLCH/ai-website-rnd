/** Creator-side validation. Same module the build farm runs — run this before publishing. */
import { readFileSync } from 'node:fs'
import { validateBundle } from '../src/validate-bundle'

const [sitePath, themePath, orgPath] = process.argv.slice(2)
if (!sitePath || !themePath) {
  console.error('usage: npm run validate -- <site.json> <theme.json> [org.json]')
  process.exit(2)
}

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'))
// org.json is optional here and mandatory at publish, so pass it when it exists — the
// jurisdiction rules (Malaysian s.30 disclosure) are otherwise skipped silently and the
// bundle first fails on the build farm, which is exactly the split this repo avoids.
const { ok, issues } = validateBundle(read(sitePath), read(themePath), orgPath ? read(orgPath) : undefined)

for (const i of issues) console.log(`${i.severity === 'error' ? '✗' : '!'} ${i.where} — ${i.message}`)
console.log(ok ? `\n✓ valid — ${issues.length} warning(s)` : `\n✗ ${issues.filter(i => i.severity === 'error').length} error(s)`)
process.exit(ok ? 0 : 1)
