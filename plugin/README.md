# Website create plugin

One install gives a creator both halves of the pipeline:

- **skill** `create-webpage` — the workflow: read the brief, propose a sitemap, sample art
  directions, compose `site.json` + `theme.json`, validate, package.
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
| URL | `https://tools.cod3r.men/mcp` |
| Authentication | Request headers (not OAuth) |
| Header name | `x-api-key` |
| Header value | the catalog token |

**Use `x-api-key`, not `Authorization`** — claude.ai reserves that header for its own OAuth and
refuses a connector that sets it. The server accepts `x-api-key`, `x-auth-token` or
`Authorization`, with or without a `Bearer ` prefix; the plugin sends `x-api-key` so both paths
are configured identically.

The skill half is uploaded separately there (Skills → `skills/create-webpage.zip`).

## Source of truth

`skills/create-webpage/` in this repo is the source. `plugin/skills/create-webpage/` is a synced
copy — never edit it directly; run `./skills/install.sh`, which refreshes it.

The script no longer installs to `~/.claude/skills/`, and deletes a copy left there by an older
run. A local-directory plugin install serves the skill straight out of `plugin/skills/`, so a
second copy under the same name is the same skill loaded twice — and one refresh away from the
two disagreeing about which is current. Copies that remain: the source, the plugin's, and a
starter checkout's if you pass one.
