import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

/** Content lives outside the renderer. A creator points CONTENT_DIR at their own repo and
 *  never sees a block component — the catalog is a dependency, not something they maintain. */
const CONTENT = process.env.CONTENT_DIR
  ? resolve(process.cwd(), process.env.CONTENT_DIR)
  : resolve(import.meta.dirname, 'src/content')

export default defineConfig({
  plugins: [react()],
  server: { port: 5183, fs: { allow: [import.meta.dirname, CONTENT] } },
  resolve: { alias: { '@content': CONTENT } },
})
