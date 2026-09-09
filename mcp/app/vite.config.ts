import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

/* One self-contained file: the MCP App iframe runs a deny-by-default CSP, so anything not
   inlined would need an explicit origin in _meta.ui.csp. Inlining is cheaper than a policy. */
export default defineConfig({
  plugins: [viteSingleFile()],
  build: { outDir: 'dist', emptyOutDir: true, rollupOptions: { input: 'app.html' } },
})
