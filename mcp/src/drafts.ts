/** A place to hold a bundle between edits, so changing one field is a ~100 byte patch instead of a
 *  ~25 KB resend of the whole thing. In-memory only, keyed by a random id, swept on a TTL — this
 *  server has no other persistence, and an editing session that outlives the process was never
 *  going to survive a restart anyway. Distinct from `Draft` in ./publish.ts, which is a bundle
 *  already uploaded to the *hosting* server; this one is a bundle still being written. */
import { randomUUID } from 'node:crypto'

export type DraftBundle = {
  site: unknown; theme: unknown; org?: unknown
  /** The hosting-side draft this bundle was last published to, if any — set once bundle_publish
   *  succeeds for this draftId. Lets site_preview point an <img> at the real uploaded file instead
   *  of the site's own `/img/<client>/…` path, which nothing in a chat-only preview can resolve. */
  hostingCode?: string
}
type Entry = DraftBundle & { touched: number }

const TTL_MS = 2 * 60 * 60 * 1000
const store = new Map<string, Entry>()

function sweep() {
  const cutoff = Date.now() - TTL_MS
  for (const [id, e] of store) if (e.touched < cutoff) store.delete(id)
}

export function putBundle(b: DraftBundle): string {
  sweep()
  const id = randomUUID()
  store.set(id, { ...b, touched: Date.now() })
  return id
}

function entry(id: string): Entry {
  const e = store.get(id)
  if (!e) throw new Error(`no draft "${id}" — either it was never created, or its 2h hold expired. bundle_put it again.`)
  e.touched = Date.now()
  return e
}

export function getBundle(id: string): DraftBundle {
  const { site, theme, org, hostingCode } = entry(id)
  return { site, theme, org, hostingCode }
}

export function replaceBundle(id: string, b: DraftBundle) {
  entry(id) // throws if missing, and refreshes nothing we're about to overwrite
  store.set(id, { ...b, touched: Date.now() })
}

/** Record which hosting draft this bundle was last published to. Separate from `replaceBundle`
 *  so publishing never has to carry the site/theme/org through just to attach one string. */
export function setHostingCode(id: string, hostingCode: string) {
  const e = entry(id)
  store.set(id, { ...e, hostingCode, touched: Date.now() })
}

export type PatchOp = { op: 'replace' | 'add' | 'remove'; path: string; value?: unknown }

function segments(path: string): string[] {
  if (path === '' || path === '/') return []
  if (!path.startsWith('/')) throw new Error(`patch path "${path}" must start with "/"`)
  return path.slice(1).split('/').map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'))
}

/** RFC 6902's three content ops, applied to a deep clone. move/copy/test are left out on purpose —
 *  a tool built for "change one field" has no use for them, and every op left out is a shape of
 *  patch this function does not have to get right. */
export function applyPatch(root: unknown, ops: PatchOp[]): unknown {
  const doc = structuredClone(root)
  for (const { op, path, value } of ops) {
    const keys = segments(path)
    if (keys.length === 0) throw new Error('patch path "/" would replace the whole document — bundle_put a new one instead')
    let node: any = doc
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      if (node == null || !(k in node)) throw new Error(`patch path "${path}" — "${k}" does not exist`)
      node = node[k]
    }
    const last = keys[keys.length - 1]
    if (op === 'remove') {
      if (Array.isArray(node)) node.splice(Number(last), 1)
      else delete node[last]
    } else {
      if (Array.isArray(node) && last === '-') node.push(value)
      else if (Array.isArray(node)) node[Number(last)] = value
      else node[last] = value
    }
  }
  return doc
}
