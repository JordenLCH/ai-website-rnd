import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, extname } from 'node:path'
import { createReadStream, existsSync } from 'node:fs'

/** Content lives outside the renderer. A creator points CONTENT_DIR at their own repo and
 *  never sees a block component — the catalog is a dependency, not something they maintain. */
const CONTENT = process.env.CONTENT_DIR
  ? resolve(process.cwd(), process.env.CONTENT_DIR)
  : resolve(import.meta.dirname, 'src/content')

/** A creator's images live in their own repo, but vite runs with its cwd inside this package,
 *  so publicDir points here and the creator's assets/ is never served. Every image in a
 *  starter bundle then renders broken, with nothing in the starter repo to fix it from. */
const ASSETS = process.env.ASSETS_DIR ? resolve(process.cwd(), process.env.ASSETS_DIR) : null

/** Serve /img/<client>/<file> out of the creator's assets dir, falling through to this
 *  package's own public/img for in-repo development. */
function creatorAssets(): Plugin {
  return {
    name: 'blackdash-creator-assets',
    configureServer(server) {
      if (!ASSETS) return
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/img/')) return next()
        const rel = decodeURIComponent(req.url.split('?')[0].slice('/img/'.length))
        if (rel.includes('..')) return next()
        const file = resolve(ASSETS, rel)
        if (!file.startsWith(ASSETS) || !existsSync(file)) return next()
        res.setHeader('Content-Type', TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream')
        createReadStream(file).pipe(res)
      })
    },
  }
}

const TYPES: Record<string, string> = {
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.avif': 'image/avif',
}

export default defineConfig({
  plugins: [react(), creatorAssets()],
  server: { port: 5183, fs: { allow: [import.meta.dirname, CONTENT, ...(ASSETS ? [ASSETS] : [])] } },
  resolve: { alias: { '@content': CONTENT } },
})
