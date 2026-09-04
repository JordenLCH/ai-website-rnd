#!/usr/bin/env bash
# Expose the catalog server through a Cloudflare quick tunnel and print the client config.
#
# Quick tunnels are ephemeral: the hostname is random and dies with the process. Fine for
# testing that a second machine can reach the catalog; for the real platform use a named
# tunnel bound to a DNS record, or just deploy the server and skip tunnelling entirely.
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-8787}"
[ -f .catalog-token ] || openssl rand -hex 16 > .catalog-token
chmod 600 .catalog-token
TOKEN="$(cat .catalog-token)"

CATALOG_TOKEN="$TOKEN" PORT="$PORT" npm run --silent http & SERVER=$!
trap 'kill $SERVER $TUNNEL 2>/dev/null || true' EXIT
sleep 2

cloudflared tunnel --url "http://localhost:$PORT" > /tmp/cf-catalog.log 2>&1 & TUNNEL=$!
for _ in $(seq 30); do
  URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cf-catalog.log | head -1 || true)"
  [ -n "$URL" ] && break
  sleep 1
done
[ -n "${URL:-}" ] || { echo "tunnel did not come up; see /tmp/cf-catalog.log"; exit 1; }

echo
echo "catalog live at $URL/mcp"
echo "health:        curl -sS $URL/health"
echo
echo "add to the creator's .mcp.json:"
cat <<JSON

{
  "mcpServers": {
    "blackdash-catalog": {
      "type": "http",
      "url": "$URL/mcp",
      "headers": { "Authorization": "Bearer $TOKEN" }
    }
  }
}
JSON
echo
echo "ctrl-c to stop both."
wait
