/** Fixture check for block deprecations.
 *
 *  A migration nobody has ever run is not a migration. Every entry in a block's `deprecated`
 *  array needs a fixture here on the day it is added, because these functions only execute
 *  when someone's two-year-old bundle shows up — which is exactly when nobody is watching.
 *
 *  No test framework on purpose: this runs under the same `tsx` the validator CLI already uses,
 *  so it costs no dependency. Add a case, run `npm run migrations`, ship.
 */
import { catalog } from '../src/blocks/index'

type Case = { block: string; note: string; old: unknown; expect: (out: any) => void }

const cases: Case[] = [
  {
    block: 'Gallery',
    note: 'kind became required',
    old: {
      title: 'The workshop',
      items: [
        { image: '/img/a.webp', imageAlt: 'a' },
        { image: '/img/b.webp', imageAlt: 'b', caption: 'b' },
        { image: '/img/c.webp', imageAlt: 'c' },
      ],
    },
    expect: (out) => {
      assert(out.items.length === 3, 'kept all three items')
      assert(out.items.every((i: any) => i.kind === 'environment'), 'every item defaulted to environment')
      assert(out.items[1].caption === 'b', 'kept the caption it already had')
      assert(out.title === 'The workshop', 'kept unrelated props')
    },
  },
  {
    block: 'Footer',
    note: 'columns[].links became {label, page?}',
    old: {
      brand: 'Merryfair Chair System',
      columns: [
        { title: 'Products', links: ['Wau 2 Series', 'Tune Series'] },
        { title: 'Company', links: ['About'] },
      ],
      note: 'ISO certified manufacturing since 1982',
    },
    expect: (out) => {
      assert(out.columns.length === 2, 'kept both columns')
      assert(out.columns[0].links.length === 2, 'kept both links in the first column')
      assert(out.columns[0].links[0].label === 'Wau 2 Series', 'the string became the label')
      assert(out.columns[0].links.every((l: any) => l.page === undefined),
        'left page unset — the old shape had no destination to carry forward')
      assert(out.note === 'ISO certified manufacturing since 1982', 'kept unrelated props')
      assert(out.brand === 'Merryfair Chair System', 'kept the brand')
    },
  },
]

let failed = 0
function assert(ok: boolean, what: string) {
  if (!ok) { failed++; console.error(`    ✗ ${what}`) } else console.log(`    ✓ ${what}`)
}

for (const c of cases) {
  console.log(`${c.block} — ${c.note}`)
  const entry = catalog[c.block]
  if (!entry) { failed++; console.error(`    ✗ no such block`); continue }
  const dep = entry.deprecated?.find((d) => d.schema.safeParse(c.old).success)
  if (!dep) { failed++; console.error(`    ✗ no deprecation accepts this fixture`); continue }

  const migrated = dep.migrate(dep.schema.parse(c.old))
  const forward = entry.schema.safeParse(migrated)
  assert(forward.success, 'migrated props satisfy the current schema')
  if (forward.success) c.expect(forward.data)

  // Purity: same input, same output. A migration that reads a clock or a random number silently
  // produces a different site on every rebuild.
  assert(
    JSON.stringify(dep.migrate(dep.schema.parse(c.old))) === JSON.stringify(migrated),
    'migration is pure — twice over the same input gives the same output',
  )
}

// Every declared deprecation needs a fixture; an unexercised one is where the rot starts.
for (const [name, entry] of Object.entries(catalog)) {
  for (const d of entry.deprecated ?? []) {
    if (!cases.some((c) => c.block === name && d.schema.safeParse(c.old).success)) {
      failed++
      console.error(`${name} — deprecation "${d.note}" has no fixture in this file`)
    }
  }
}

console.log(failed ? `\n${failed} failed` : '\nall migrations pass')
process.exit(failed ? 1 : 0)
