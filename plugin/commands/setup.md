---
description: Store the Blackdash catalog API key the catalog MCP authenticates with (set / show / clear)
argument-hint: "[<token> | show | clear]"
allowed-tools: Bash(${CLAUDE_PLUGIN_ROOT}/scripts/catalog-token.sh:*)
---

Configure the catalog token for the `blackdash-catalog` MCP server.

`$ARGUMENTS` is one of: a token to store, `show`, `clear`, or empty (treat empty as `show`).

Run exactly one of these, then report its output verbatim — do not paste the token itself back:

- a token was given → `${CLAUDE_PLUGIN_ROOT}/scripts/catalog-token.sh set <token>`
- `show` or empty  → `${CLAUDE_PLUGIN_ROOT}/scripts/catalog-token.sh show`
- `clear`          → `${CLAUDE_PLUGIN_ROOT}/scripts/catalog-token.sh clear`

The script writes `env.CATALOG_TOKEN` into `~/.claude/settings.json` and checks the token
against the live server. If it reports the server rejected the token, say so plainly — the
tools will show as failed to connect until it is right. A stored token only reaches the MCP
server on the next session start, so tell the user to restart.
