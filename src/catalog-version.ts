/** The catalog version, derived rather than remembered.
 *
 *  It was a hand-typed string with a comment asking you to bump it when a schema changed. Nothing
 *  checked that you had, and the two schema changes made on 2026-09-08 (Team's photo-grid check,
 *  CatalogGrid's meta placement) went in without it moving. A version that depends on someone
 *  remembering is not a version; it is a note.
 *
 *  The fingerprint is a structural description of every block — its layouts, and the *shape* of
 *  its props schema — so it moves when the contract moves and stays put when a comment or a
 *  component's markup changes. Hashing the source files would have been simpler and wrong: every
 *  docstring edit would have invalidated every stored bundle's recorded version. */
import { catalog } from './blocks/index'

/** Human-facing line. The hash is what actually enforces change; this says roughly how far we are. */
const CATALOG_SEMVER = '0.4.1'

/** A stable, comment-free description of a zod schema's shape. Only the constructs the catalog
 *  actually uses are handled; anything else falls back to its type name, which still changes the
 *  fingerprint if a prop's type changes. */
function describe(schema: unknown, depth = 0): unknown {
  const def = (schema as { _def?: Record<string, unknown> })?._def
  if (!def || depth > 12) return '?'
  const name = def.typeName as string
  switch (name) {
    case 'ZodObject': {
      const shape = (def.shape as () => Record<string, unknown>)()
      return Object.keys(shape).sort().map((k) => `${k}:${JSON.stringify(describe(shape[k], depth + 1))}`)
    }
    case 'ZodArray':
      return { a: describe(def.type, depth + 1), min: (def.minLength as { value: number } | null)?.value ?? null, max: (def.maxLength as { value: number } | null)?.value ?? null }
    case 'ZodOptional': return { opt: describe(def.innerType, depth + 1) }
    case 'ZodNullable': return { nul: describe(def.innerType, depth + 1) }
    case 'ZodDefault': return { def: describe(def.innerType, depth + 1) }
    case 'ZodEffects': return { fx: describe(def.schema, depth + 1) }
    case 'ZodEnum': return { enum: [...(def.values as string[])].sort() }
    case 'ZodLiteral': return { lit: def.value }
    case 'ZodUnion': return { or: (def.options as unknown[]).map((o) => describe(o, depth + 1)) }
    case 'ZodRecord': return { rec: describe(def.valueType, depth + 1) }
    default: return name
  }
}

/** 64-bit-ish FNV pair, hex. No crypto import: this runs in the browser build too. */
function hash(input: string): string {
  let h1 = 0x811c9dc5, h2 = 0x01000193
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}

export function catalogFingerprint(): string {
  const shape = Object.keys(catalog).sort().map((type) => {
    const e = catalog[type] as { layouts: readonly string[]; schema: unknown; deprecated?: readonly { note: string }[] }
    return {
      type,
      layouts: [...e.layouts].sort(),
      props: describe(e.schema),
      // A deprecation is part of what the catalog accepts, so declaring one is a contract change.
      deprecated: (e.deprecated ?? []).map((d) => d.note).sort(),
    }
  })
  return hash(JSON.stringify(shape))
}

/** `0.4.1+<fingerprint>`. The suffix is the part that cannot drift. */
export const CATALOG_VERSION = `${CATALOG_SEMVER}+${catalogFingerprint()}`
