# POC — the catalog as an MCP App

**Throwaway.** Built to answer one question: can a creator with nothing installed preview and
validate a site inside a chat GUI? Answer: yes, and the parts that had to be proved are proved.
Delete this folder once the real implementation lands in `mcp/`.

Design it belongs to: [`docs/superpowers/specs/2026-09-09-chat-gui-generation-design.md`](../../docs/superpowers/specs/2026-09-09-chat-gui-generation-design.md).

## What it does

Two tools on a stateless HTTP MCP server:

- `bundle_validate` — runs the real `validateBundle` from `@blackdash/renderer`. This is what
  replaces `npm run validate` for someone who cannot run npm.
- `site_preview` — an **MCP App**: declares `_meta.ui.resourceUri`, so a host fetches the
  `ui://` resource and renders it in the conversation. Returns the validator's verdict plus
  server-rendered HTML from the real catalog.

## Run it

```bash
npm install
npm run build          # bundles the UI to one self-contained dist/app.html
npm run serve          # http://127.0.0.1:8788/mcp
npm run prove          # headless: 10 assertions over real MCP, no browser needed
```

To see it render in a real MCP Apps host:

```bash
git clone --depth 1 https://github.com/modelcontextprotocol/ext-apps.git
cd ext-apps/examples/basic-host && npm install
SERVERS='["http://127.0.0.1:8788/mcp"]' npm start     # http://localhost:8080
```

Pick `site_preview`, input `{"client":"merryfair"}`, Call Tool. To reach claude.ai instead,
`npx cloudflared tunnel --url http://localhost:8788` and add the URL as a custom connector.

## What it proves, and what it doesn't

Proved: the app tool advertises its UI; the `ui://` resource serves over the same stateless
transport `mcp/src/http.ts` already uses; the real validator answers over MCP and rejects a
broken bundle with an issue naming the break; the real catalog renders; and a click inside the
app calls the server again and re-renders a different page.

Not proved: rendering inside **claude.ai specifically** — that needs a public URL, a connector,
and a human to add it. Everything up to that point is verified here.

## What building it taught us

- **`_meta.ui.resourceUri` is what makes a tool an app.** Nothing else changes about the tool.
- **The tool-result notification's `params` IS the `CallToolResult`.** Reading `params.result`
  gets you an app that renders nothing, with no error in any console the host can show you —
  the app's own console does not reach the host. Instrument the app's boot and its failures
  into its own UI, or debugging is blind. This cost most of the time spent here.
- **Use `addEventListener("toolresult")`.** The `ontoolresult` setter is deprecated in 2.x.
- **A browser-side host needs CORS.** `mcp/src/http.ts` allows no origins by default, on
  purpose — so `CATALOG_ORIGINS` has to be set for any web host, and that decision needs
  making rather than inheriting.
- **The UI must be one self-contained file.** The iframe CSP is deny-by-default; anything not
  inlined needs an explicit origin in `_meta.ui.csp`. `vite-plugin-singlefile` yields 235 KB
  for this app, well inside any limit.
- **npm `latest` for `@modelcontextprotocol/ext-apps` is 2.x.** A `^0.4.0` pin silently
  installs a dead major.
- **Local images do not render.** The broken hero in the screenshot is the predicted
  limitation, demonstrated: the app has no filesystem, so photography only appears after
  upload. Layout and tone are truthful; the picture is not.

## The one thing not to copy

`renderPage` here is a deliberate copy of `platform/src/build.ts`. That is acceptable for a
POC and wrong for the real thing — two renderers is precisely the drift this repo is built to
prevent. Production must call the platform's renderer, not duplicate it.
