#!/usr/bin/env bash
# Package a site for the platform to build.
#
# This zips the SOURCE bundle, never built HTML. Shipping HTML would freeze the site:
# it could not be re-themed, could not receive a fleet-wide SEO/AEO patch, and could not
# be migrated when a block's schema changes. The platform builds from these artifacts
# using the catalog version recorded in the manifest.
set -euo pipefail

CLIENT="${1:?usage: compress.sh <client> <site.json> <theme.json> [assets-dir] [org.json]}"
SITE="${2:?missing site.json}"
THEME="${3:?missing theme.json}"
ASSETS="${4:-}"

# org.json is the third artifact of a bundle and the build farm refuses to build without it —
# it is where the identity facts live (legal name, registration, address) and the source of the
# Organization/LocalBusiness graph. It used to be left out of the zip entirely, so a bundle
# packaged here always failed at publish with an error about a file the packager never asked
# for. Discovered beside site.json, which is the conventional layout, or named explicitly.
ORG="${5:-$(dirname "$SITE")/org.json}"
if [ ! -f "$ORG" ]; then
  echo "✗ no org.json found at $ORG" >&2
  echo "  The build farm requires it: legal name, registration number, address, sameAs profiles." >&2
  echo "  Create it beside site.json, or pass its path as the fifth argument." >&2
  exit 1
fi
API="${PLATFORM_API:-https://platform.example.com}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$(mktemp -d)"
OUT="$ROOT/dist-bundles"
mkdir -p "$OUT"

# Validate *with* org.json. Without it the identity rules never run, so a bundle passed here
# and was rejected at publish for a missing registration number — the slowest possible place
# to learn it, and one the creator cannot debug from the error alone.
echo "→ validating"
( cd "$ROOT" && npm run --silent validate -- "$SITE" "$THEME" "$ORG" )

# Stamp the catalog the bundle was generated against. The bundle is the stored artifact and the
# catalog moves underneath it, so a rebuild months from now can say whether the two still agree.
# Derived from the catalog's shape, never typed by hand — see renderer/src/catalog-version.ts.
CATALOG_VERSION="$(cd "$ROOT" && node --import tsx -e \
  "import('./src/catalog-version.ts').then(m=>process.stdout.write(m.CATALOG_VERSION))")"
node -e '
  const fs = require("fs")
  const site = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))
  site.catalogVersion = process.argv[3]
  fs.writeFileSync(process.argv[2], JSON.stringify(site, null, 2) + "\n")
' "$SITE" "$STAGE/site.json" "$CATALOG_VERSION"
cp "$THEME" "$STAGE/theme.json"
cp "$ORG" "$STAGE/org.json"
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
