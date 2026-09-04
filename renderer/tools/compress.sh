#!/usr/bin/env bash
# Package a site for the platform to build.
#
# This zips the SOURCE bundle, never built HTML. Shipping HTML would freeze the site:
# it could not be re-themed, could not receive a fleet-wide SEO/AEO patch, and could not
# be migrated when a block's schema changes. The platform builds from these artifacts
# using the catalog version recorded in the manifest.
set -euo pipefail

CLIENT="${1:?usage: compress.sh <client> <site.json> <theme.json> [assets-dir]}"
SITE="${2:?missing site.json}"
THEME="${3:?missing theme.json}"
ASSETS="${4:-}"
API="${PLATFORM_API:-https://platform.example.com}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$(mktemp -d)"
OUT="$ROOT/dist-bundles"
mkdir -p "$OUT"

echo "→ validating"
( cd "$ROOT" && npm run --silent validate -- "$SITE" "$THEME" )

CATALOG_VERSION="$(node -e "process.stdout.write(require('fs').readFileSync('$ROOT/../mcp/src/source.ts','utf8').match(/CATALOG_VERSION = '([^']+)'/)[1])")"

cp "$SITE" "$STAGE/site.json"
cp "$THEME" "$STAGE/theme.json"
[ -n "$ASSETS" ] && cp -R "$ASSETS" "$STAGE/assets"

cat > "$STAGE/manifest.json" <<JSON
{
  "client": "$CLIENT",
  "catalogVersion": "$CATALOG_VERSION",
  "packagedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "schemaVersion": 1
}
JSON

STAMP="$(date -u +%Y%m%d-%H%M%S)"
BUNDLE="$OUT/$CLIENT-$STAMP.zip"
( cd "$STAGE" && zip -qr "$BUNDLE" . )
rm -rf "$STAGE"

echo "→ bundle: $BUNDLE  (catalog $CATALOG_VERSION)"
echo "→ upload:"
echo "   curl -sS -X POST $API/api/publish \\"
echo "     -H \"Authorization: Bearer \$PLATFORM_TOKEN\" \\"
echo "     -F client=$CLIENT -F bundle=@$BUNDLE"
