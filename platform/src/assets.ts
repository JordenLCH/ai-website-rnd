/** Which images a bundle expects, read from the bundle rather than from a folder listing.
 *
 *  The chat path has no folder to list. A creator composing in a browser produces `site.json`
 *  full of `/img/<client>/…` paths and a pile of pictures on their desktop, and something has to
 *  say which of those pictures the site is actually waiting for. That answer must come from the
 *  props, because the props are what the build will try to resolve — a manifest written alongside
 *  them would be a second source of truth and would drift the first time someone edited a `src`.
 *
 *  Both halves of the upload use this: the MCP tool announces what is expected, and the intake
 *  refuses to publish while anything is still missing. One function, so the two cannot disagree
 *  about what "complete" means. */

/** The path convention every bundle's image props use, and the one `buildSite` copies `assets/`
 *  to. Anchored: a value that merely mentions `/img/` somewhere is not an image reference. */
const ASSET_RE = /^\/img\/([^/]+)\/(.+)$/

/** Every distinct image path in `site`, in first-seen order.
 *
 *  Walks values rather than known prop names on purpose. Blocks add image props regularly, and a
 *  list of prop names here would silently stop reporting the day one was added — the failure mode
 *  being a site published with a missing picture, which is exactly what this exists to prevent. */
export function referencedAssets(site: unknown): string[] {
  const found = new Set<string>()
  const walk = (node: unknown): void => {
    if (typeof node === 'string') {
      if (ASSET_RE.test(node)) found.add(node)
      return
    }
    if (Array.isArray(node)) { for (const v of node) walk(v); return }
    if (node && typeof node === 'object') for (const v of Object.values(node)) walk(v)
  }
  walk(site)
  return [...found]
}

/** The name a referenced path has inside the bundle's own `assets/` directory.
 *
 *  `/img/acme/hero.webp` is `hero.webp` in `assets/`; the `/img/<client>/` prefix is added by the
 *  build, not stored. Returns null for anything outside the convention so a caller never writes a
 *  file for a path the build will not look up. */
export function assetFileName(path: string): string | null {
  const m = ASSET_RE.exec(path)
  if (!m) return null
  const name = m[2]
  /* A path that climbs, absolutises, or hides a separator is refused rather than sanitised: these
     arrive from a model-written bundle and are used to name a file on the intake server, and a
     "cleaned" traversal is a write outside the bundle that nobody reads as one. */
  if (name.includes('..') || name.startsWith('/') || name.includes('\\')) return null
  return name
}

/** What the intake still needs before a bundle can be built: referenced, minus already uploaded. */
export function missingAssets(site: unknown, uploaded: Iterable<string>): string[] {
  const have = new Set(uploaded)
  return referencedAssets(site).filter((p) => {
    const name = assetFileName(p)
    return name !== null && !have.has(name)
  })
}
