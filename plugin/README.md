# Website create plugin

One install gives a creator both halves of the pipeline:

- **skill** `create-webpage` — the workflow: read the brief, propose a sitemap, sample art
  directions, compose `site.json` + `theme.json`, validate, package.
- **skill** `edit-webpage` — a scoped change to a site that already exists: one page, one
  section, one token.
- **skill** `check-webpage` — the nine-check design-QA pass, with a script that computes contrast,
  theme coverage, alt text and form labels. `create-webpage` calls it at stage 7.
- **skill** `sourcing-stock-photos` — photography when the brief has none; usable on its own.
- **MCP** `blackdash-catalog` — the things a skill must not hard-code because they drift:
  block catalog, prop schemas, the token contract, and the existing fleet.
- **command** `/website-create:setup` — keys in the catalog API key.

## Install (direct, no public storefront)

`plugin/` is self-contained: it carries both `plugin.json` and a `marketplace.json` whose only
entry is itself (`source: "./"`). Claude Code always installs *through* a marketplace — that
manifest is the install record, not a listing anywhere. Hand a known user the folder (a zip, a
private repo, a shared drive) and they run:

```bash
claude plugin marketplace add ./website-create-plugin   # or a private GitHub repo
claude plugin install website-create@blackdash
```

Then, once:

```
/website-create:setup <the catalog token>
```

That writes `env.CATALOG_TOKEN` into `~/.claude/settings.json` — the only place Claude Code
reads variables from before it starts an MCP server — and checks the token against the live
server, so a wrong one is reported as wrong instead of surfacing later as an unexplained
connection failure. The value only reaches the server on the **next session start**.

`/website-create:setup show` reports what is stored (masked) and whether the server still
accepts it; `/website-create:setup clear` removes it.

Install-time prompting is not a thing plugins can do — there is no input hook, and `.mcp.json`
only expands environment variables. The setup command is the closest equivalent: the key is
typed once, by the person installing, and persists across sessions.

## Two failure modes worth telling apart

- **401 / tools failed to connect** — no token, or the wrong one. `/website-create:setup show`.
- **502 from the tunnel** — Cloudflare is up and the catalog server behind it is not. Never a
  tunnel problem; start the server (`cd mcp && ./tunnel.sh`).

## claude.ai (no plugins there — add it as a connector)

Settings → Connectors → Add custom connector

| Field | Value |
|---|---|
| Name | Blackdash catalog |
| URL | `https://catalog.blackdash.my/mcp` |
| Authentication | Request headers (not OAuth) |
| Header name | `x-api-key` |
| Header value | the catalog token |

**Use `x-api-key`, not `Authorization`** — claude.ai reserves that header for its own OAuth and
refuses a connector that sets it. The server accepts `x-api-key`, `x-auth-token` or
`Authorization`, with or without a `Bearer ` prefix; the plugin sends `x-api-key` so both paths
are configured identically.

The skill half is uploaded separately there (Skills → the `.skill` archive that
`./package-plugin.sh` writes into `dist-plugin/`).

## Source of truth

`plugin/skills/<name>/` is the source, and the only copy. Edit it directly.

There used to be a second tree at `skills/<name>/` that an `install.sh` rsynced here. It was
removed on 2026-09-11: two identical trees is one that goes stale, and the sync step was
something a release could skip in silence. A local-directory plugin install serves the skill
straight out of `plugin/skills/`, so this is the copy that actually runs.

Archives are built, never committed: `./package-plugin.sh` writes the plugin zip and one
`.skill` per skill into `dist-plugin/`, both from this directory. Nothing is hand-zipped.
