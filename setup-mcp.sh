#!/usr/bin/env bash
# Point this repo at the catalog MCP by writing `.mcp.json`.
#
# The catalog is the one thing a creator's machine cannot know on its own — block list, prop
# schemas, token contract, existing fleet. It moves on the platform's schedule, so it is served
# over HTTP rather than vendored here.
#
#   ./setup-mcp.sh <token>              # point at the local server on :8787
#   ./setup-mcp.sh <token> <url>        # point at another one (staging, a dev tunnel)
#   ./setup-mcp.sh --env                # reference $CATALOG_TOKEN instead of writing the token
#   ./setup-mcp.sh --remove             # drop the entry again
#   ./setup-mcp.sh --show               # print what is configured now
#
# Only the `blackdash-catalog` entry is touched; any other server in `.mcp.json` is preserved.
#
# `.mcp.json` is gitignored here, so a token written into it stays local. `--env` is still there
# if you would rather keep the token in your shell than on disk.
#
# `mcp/tunnel.sh` calls this for you, so starting the server also points the repo at it. Run it
# by hand only to change the endpoint or to check what is configured.
set -euo pipefail
cd "$(dirname "$0")"

FILE=".mcp.json"
NAME="blackdash-catalog"
DEFAULT_URL="http://127.0.0.1:8787"

case "${1:-}" in
  --remove|--show)
    ACTION="${1#--}"
    ;;
  --env)
    ACTION="set"
    TOKEN='${CATALOG_TOKEN}'   # expanded by the MCP client at read time, not by this script
    URL="${2:-${CATALOG_URL:-$DEFAULT_URL}}"
    ;;
  -h|--help|"")
    grep '^#' "$0" | grep -v '^#!' | sed 's/^# \{0,1\}//'
    exit 0
    ;;
  *)
    ACTION="set"
    TOKEN="$1"
    URL="${2:-${CATALOG_URL:-$DEFAULT_URL}}"
    ;;
esac

[ -f "$FILE" ] || echo '{ "mcpServers": {} }' > "$FILE"

ACTION="$ACTION" FILE="$FILE" NAME="$NAME" URL="${URL:-}" TOKEN="${TOKEN:-}" node --input-type=module - <<'JS'
import { readFileSync, writeFileSync } from 'node:fs'

const { ACTION, FILE, NAME, URL, TOKEN } = process.env
const config = JSON.parse(readFileSync(FILE, 'utf8'))
config.mcpServers ??= {}

if (ACTION === 'show') {
  const entry = config.mcpServers[NAME]
  if (!entry) { console.log(`${NAME}: not configured — run ./setup-mcp.sh <token>`); process.exit(0) }
  // Never echo the token back; the point of the file is that it holds the only copy.
  console.log(`${NAME}: ${entry.url ?? `${entry.command} ${(entry.args ?? []).join(' ')}`}`)
  process.exit(0)
}

if (ACTION === 'remove') {
  if (!config.mcpServers[NAME]) { console.log(`${NAME}: nothing to remove`); process.exit(0) }
  delete config.mcpServers[NAME]
  writeFileSync(FILE, JSON.stringify(config, null, 2) + '\n')
  console.log(`${NAME}: removed from ${FILE}`)
  process.exit(0)
}

const base = URL.replace(/\/+$/, '')
config.mcpServers[NAME] = {
  type: 'http',
  url: `${base}/mcp`,
  headers: { Authorization: `Bearer ${TOKEN}` },
}
writeFileSync(FILE, JSON.stringify(config, null, 2) + '\n')
console.log(`${NAME}: ${base}/mcp written to ${FILE}`)
console.log(`check it:  curl -sS ${base}/health`)
if (TOKEN.startsWith('${')) console.log(`export ${TOKEN.slice(2, -1)}=<token> before starting your agent.`)
else console.log(`${FILE} holds a live token; it is gitignored.`)
console.log('restart your editor / agent so it picks the server up.')
JS
