#!/usr/bin/env bash
# Store, show or remove the catalog token the blackdash-catalog MCP authenticates with.
#
# The token goes in ~/.claude/settings.json under `env`, because that is the only place
# Claude Code reads variables from before it starts an MCP server — the plugin's .mcp.json
# sends `x-api-key: ${CATALOG_TOKEN}`, and an unset variable is a 401 with nothing to debug.
#
#   catalog-token.sh set <token>   # write it, session restart picks it up
#   catalog-token.sh show          # masked, plus whether the server accepts it
#   catalog-token.sh clear         # remove it again
set -euo pipefail

SETTINGS="$HOME/.claude/settings.json"

# The catalog URL is NOT a second constant. Read it from the plugin's own .mcp.json — the file
# Claude Code actually connects through. A hardcoded default here meant `setup` could validate a
# token against one deployment while the MCP authenticated against another, and print a tick for a
# token the server then rejected: precisely the unexplained auth failure this script exists to
# prevent. One value, one place.
MCP_JSON="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.mcp.json"
URL="${CATALOG_URL:-$(node -e '
  try {
    const u = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))
      .mcpServers["blackdash-catalog"].url
    process.stdout.write(u.replace(/\/mcp\/?$/, ""))
  } catch {}
' "$MCP_JSON")}"
[ -z "$URL" ] && { echo "✗ could not read the catalog URL from $MCP_JSON" >&2; exit 2; }
ACTION="${1:-show}"
TOKEN="${2:-}"

[ "$ACTION" = "set" ] && [ -z "$TOKEN" ] && { echo "✗ usage: catalog-token.sh set <token>" >&2; exit 2; }

ACTION="$ACTION" TOKEN="$TOKEN" SETTINGS="$SETTINGS" URL="$URL" node --input-type=module - <<'JS'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const { ACTION, TOKEN, SETTINGS, URL } = process.env
const read = () => { try { return JSON.parse(readFileSync(SETTINGS, 'utf8')) } catch { return {} } }
const write = (o) => {
  mkdirSync(dirname(SETTINGS), { recursive: true })
  writeFileSync(SETTINGS, JSON.stringify(o, null, 2) + '\n')
}
const mask = (t) => t.length <= 8 ? '••••' : `${t.slice(0, 4)}…${t.slice(-4)}`

const settings = read()
const current = settings.env?.CATALOG_TOKEN ?? process.env.CATALOG_TOKEN ?? ''

if (ACTION === 'clear') {
  if (!settings.env?.CATALOG_TOKEN) { console.log('nothing stored — already clear'); process.exit(0) }
  delete settings.env.CATALOG_TOKEN
  if (Object.keys(settings.env).length === 0) delete settings.env
  write(settings)
  console.log(`✓ removed CATALOG_TOKEN from ${SETTINGS}`)
  console.log('  restart the session — the catalog tools will stop connecting')
  process.exit(0)
}

const token = ACTION === 'set' ? TOKEN : current
if (!token) {
  console.log(`✗ no token stored in ${SETTINGS} and none in the environment`)
  console.log('  run: /website-create:setup <token>')
  process.exit(1)
}

if (ACTION === 'set') {
  settings.env = { ...(settings.env ?? {}), CATALOG_TOKEN: token }
  write(settings)
  console.log(`✓ stored CATALOG_TOKEN (${mask(token)}) in ${SETTINGS}`)
} else {
  console.log(`CATALOG_TOKEN ${mask(token)} — ${settings.env?.CATALOG_TOKEN ? SETTINGS : 'from the environment'}`)
}

// Prove it against the live server rather than reporting success for a value nobody checked.
const base = URL.replace(/\/+$/, '')
try {
  const res = await fetch(`${base}/mcp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'x-api-key': token },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  })
  if (res.status === 401 || res.status === 403) console.log(`✗ ${base} rejected it (${res.status}) — wrong token`)
  else if (res.status === 502) console.log(`✗ 502 from ${base} — tunnel is up, the catalog server behind it is not`)
  else if (!res.ok) console.log(`? ${base} answered ${res.status}`)
  else console.log(`✓ ${base} accepts it`)
} catch (err) {
  console.log(`? could not reach ${base}: ${err.message}`)
}

if (ACTION === 'set') console.log('  restart the session (or /mcp reconnect) so the server picks the variable up')
JS
