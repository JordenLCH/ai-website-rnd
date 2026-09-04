/** Creator-side validation. Same module the build farm runs — run this before publishing. */
import { readFileSync } from 'node:fs'
import { validateBundle } from '../src/validate-bundle'

const [sitePath, themePath] = process.argv.slice(2)
if (!sitePath || !themePath) {
  console.error('usage: npm run validate -- <site.json> <theme.json>')
  process.exit(2)
}

const read = (p: string) => JSON.parse(readFileSync(p, 'utf8'))
const { ok, issues } = validateBundle(read(sitePath), read(themePath))

for (const i of issues) console.log(`${i.severity === 'error' ? '✗' : '!'} ${i.where} — ${i.message}`)
console.log(ok ? `\n✓ valid — ${issues.length} warning(s)` : `\n✗ ${issues.filter(i => i.severity === 'error').length} error(s)`)
process.exit(ok ? 0 : 1)
