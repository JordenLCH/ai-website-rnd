#!/usr/bin/env bash
# Expose the catalog server through a Cloudflare quick tunnel and print the client config.
#
# Quick tunnels are ephemeral: the hostname is random and dies with the process. Fine for
# testing that a second machine can reach the catalog; for the real platform use a named
# tunnel bound to a DNS record, or just deploy the server and skip tunnelling entirely.
set -euo pipefail
cd "$(dirname "$0")"

PORT=8787
URL="https://tools.cod3r.men"
[ -f .catalog-token ] || openssl rand -hex 16 > .catalog-token
chmod 600 .catalog-token
TOKEN="$(cat .catalog-token)"

CATALOG_TOKEN="$TOKEN" PORT="$PORT" npm run --silent http & SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT

# Point this repo at the server we just started. Hand-editing .mcp.json is how it drifts out of
# sync with the token on disk, which surfaces as an unexplained auth failure at session start.
../setup-mcp.sh "$TOKEN" "http://127.0.0.1:$PORT" >/dev/null

# Dynamic cloudflared quick-tunnel disabled — fixed port 8787, named tunnel
# (cod3r.men -> localhost:8787) added manually via cloudflared config.
# cloudflared tunnel --url "http://localhost:$PORT" > /tmp/cf-catalog.log 2>&1 & TUNNEL=$!
# for _ in $(seq 30); do
#   URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cf-catalog.log | head -1 || true)"
#   [ -n "$URL" ] && break
#   sleep 1
# done
# [ -n "${URL:-}" ] || { echo "tunnel did not come up; see /tmp/cf-catalog.log"; exit 1; }

echo
echo "catalog live at $URL/mcp"
echo "health:        curl -sS $URL/health"
echo
echo "this repo is configured against http://127.0.0.1:$PORT/mcp — restart your agent to pick it up."
echo
echo "in the creator's site-starter checkout:"
echo
echo "  ./setup-mcp.sh $TOKEN $URL"
echo
echo "or paste into .mcp.json by hand:"
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
echo "ctrl-c to stop."
wait
