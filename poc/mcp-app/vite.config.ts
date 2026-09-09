import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

/* Single-file because the MCP App iframe is deny-by-default CSP: anything not inlined
   needs an explicit origin in _meta.ui.csp. Inlining is the cheaper answer for a POC. */
export default defineConfig({
  plugins: [viteSingleFile()],
  build: { outDir: 'dist', rollupOptions: { input: 'app.html' } },
})
