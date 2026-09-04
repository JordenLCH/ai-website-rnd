# blackdash-catalog MCP

A **read-only catalog service**. Nothing here writes, so it needs no auth.

The catalog is imported from the renderer, not copied — if a block ships, this serves it the
same day. That is the whole reason it exists: a skill distributed to creators is a snapshot,
and snapshots go stale.

## What belongs in the MCP

Anything that changes on the platform's schedule and must stay in sync with what the build farm
will actually render. A creator's machine cannot know any of it.

| Tool | Why it must be served, not bundled |
|---|---|
| `catalog_list` | blocks and variants ship weekly |
| `catalog_get` | prop schemas change with them |
| `theme_contract` | the token contract moves when the renderer's tokens move |
| `fleet_siblings` | the fleet changes every time anyone publishes |

Resource `catalog://version` — pin it in the bundle manifest at generation time.

## What deliberately lives elsewhere

- **Validation** → `renderer/src/validate-bundle.ts`, run by creators as `npm run validate`.
  The build farm imports the same module, so "valid locally, fails on publish" cannot happen.
- **Publishing** → `spike/tools/compress.sh` zips the source bundle, then a plain authenticated
  HTTP POST. MCP is a poor transport for files, and keeping the write path out is what lets this
  server stay unauthenticated.

## Run

```bash
npm install
npm run smoke     # validates the real bundles, proves the content-vs-layout gate fires
npm start         # stdio — one creator, local
npm run http      # HTTP on :8787 — many creators, one endpoint
./tunnel.sh       # HTTP + Cloudflare quick tunnel, prints the client config
```

The HTTP transport is **stateless**: a fresh server and transport per request, so any number of
creators can share one endpoint behind a tunnel or load balancer. Since the catalog is read-only,
no request can corrupt anything for anyone else.

Set `CATALOG_TOKEN` to require `Authorization: Bearer <token>`. `tunnel.sh` generates one into
`.catalog-token` (gitignored) automatically. `/health` stays open so uptime checks work.

```jsonc
// local, stdio
{ "mcpServers": {
    "blackdash-catalog": {
      "command": "node",
      "args": ["--import", "tsx", "/abs/path/to/mcp/src/server.ts"] } } }

// remote — what creators actually get
{ "mcpServers": {
    "blackdash-catalog": {
      "type": "http",
      "url": "https://catalog.example.com/mcp",
      "headers": { "Authorization": "Bearer <token>" } } } }
```

Quick tunnel hostnames are random and die with the process — useful for proving a second machine can
reach the catalog, not for production. For that, use a named tunnel bound to a DNS record, or deploy
the server and drop tunnelling altogether.

## Not built yet

- **Build farm** — render a bundle with its pinned `catalogVersion`, then `wrangler pages deploy`.
- **Asset pipeline** — originals in, responsive webp/avif out.
- **Migrations** — transform older bundles when a block's schema changes.
