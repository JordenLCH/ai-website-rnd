#!/usr/bin/env bash
# Build the uploadable plugin zip.
#
# claude.ai takes a plugin as a .zip under 50 MB, with the plugin's own files at the ARCHIVE
# ROOT — .claude-plugin/plugin.json must be at the top level, not one folder down. Zipping the
# parent directory produces an archive that uploads and then does nothing.
#
# Re-syncs the skill copy first, because the most likely thing to ship stale is the skill.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist-plugin"
VERSION="$(node -p "require('$ROOT/plugin/.claude-plugin/plugin.json').version")"

"$ROOT/skills/install.sh" >/dev/null
claude plugin validate "$ROOT/plugin" >/dev/null
claude plugin validate "$ROOT/plugin/.claude-plugin/plugin.json" >/dev/null

mkdir -p "$OUT"
ZIP="$OUT/website-create-v$VERSION.zip"
rm -f "$ZIP"
( cd "$ROOT/plugin" && zip -qr "$ZIP" . -x '.DS_Store' '**/.DS_Store' )

# The upload dialog accepts .zip or .plugin; they are the same archive under two names.
PLUGIN_FILE="${ZIP%.zip}.plugin"
cp -f "$ZIP" "$PLUGIN_FILE"

echo "✓ $ZIP  ($(du -h "$ZIP" | cut -f1))"
echo "✓ $PLUGIN_FILE"
unzip -l "$ZIP" | sed -n '4,20p'
