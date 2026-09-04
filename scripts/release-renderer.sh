#!/usr/bin/env bash
# Pack the renderer for creator repos to install.
#
# Starter repos must not vendor the catalog, so they depend on a versioned tarball instead.
# Publishing to a registry (npm private, GitHub Packages) is the same idea with retries and
# auth handled for you — this is the dependency-free version.
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION="$(node -p "require('./renderer/package.json').version")"
CATALOG="$(grep -oE "CATALOG_VERSION = '[^']+'" mcp/src/source.ts | cut -d"'" -f2)"
mkdir -p dist/releases

( cd renderer && npm pack --silent --pack-destination ../dist/releases )
TARBALL="$(ls -t dist/releases/*.tgz | head -1)"

echo "renderer $VERSION packed (catalog $CATALOG): $TARBALL"
echo
echo "point a starter repo at it:"
echo "  \"@blackdash/renderer\": \"https://platform.example.com/releases/$(basename "$TARBALL")\""
echo
echo "bump mcp/src/source.ts CATALOG_VERSION whenever a block's schema or layout set changes,"
echo "so bundles record what they were generated against and can be rebuilt faithfully later."
