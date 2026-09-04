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

n=0
for dir in "$SRC"/*/; do
  client="$(basename "$dir")"
  [ -d "$dir/images" ] || continue
  mkdir -p "renderer/public/img/$client"
  cp "$dir"images/*.webp "renderer/public/img/$client/" 2>/dev/null || true
  n=$((n + $(ls "$dir"images/*.webp 2>/dev/null | wc -l)))
done
echo "restored $n images into renderer/public/img/"
