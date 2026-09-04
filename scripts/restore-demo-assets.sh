#!/usr/bin/env bash
# Repopulate the demo imagery the sample content references.
#
# These photos are client source material, not platform code, so they are not tracked here
# and are not shipped inside the renderer package — otherwise every creator installing
# @blackdash/renderer would download several megabytes of someone else's photography.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="${1:-website_info}"
[ -d "$SRC" ] || { echo "no source at $SRC — pass the path to the briefs directory"; exit 1; }

# Only the clients the sample content actually references — copying every brief would
# pull in imagery no page uses.
CLIENTS="$(grep -ho '/img/[a-z0-9-]*/' renderer/src/content/*/site.json | cut -d/ -f3 | sort -u)"

n=0
for client in $CLIENTS; do
  [ -d "$SRC/$client/images" ] || { echo "  no images for $client in $SRC — skipped"; continue; }
  mkdir -p "renderer/public/img/$client"
  cp "$SRC/$client/images"/*.webp "renderer/public/img/$client/" 2>/dev/null || true
  n=$((n + $(ls "$SRC/$client/images"/*.webp 2>/dev/null | wc -l)))
done
echo "restored $n images for: $(echo $CLIENTS | tr '\n' ' ')"
