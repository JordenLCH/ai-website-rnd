#!/usr/bin/env bash
# Build the uploadable plugin zip.
#
# claude.ai takes a plugin as a .zip under 50 MB, with the plugin's own files at the ARCHIVE
# ROOT — .claude-plugin/plugin.json must be at the top level, not one folder down. Zipping the
# parent directory produces an archive that uploads and then does nothing.
#
# plugin/skills/<name>/ IS the source of every skill — there is no second copy to sync and no
# sync step that can be skipped. The skills ship inside this zip and only inside it: they call
# each other and share references/, so a standalone single-skill archive is a broken half.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="$ROOT/dist-plugin"
VERSION="$(node -p "require('$ROOT/plugin/.claude-plugin/plugin.json').version")"

claude plugin validate "$ROOT/plugin" >/dev/null
claude plugin validate "$ROOT/plugin/.claude-plugin/plugin.json" >/dev/null

# The MCP config ships inside the zip, so whatever is on this disk is what every creator gets.
# Two ways that goes wrong silently, both seen: the file is absent (a fresh clone used to ignore it,
# so the plugin shipped with no catalog at all and simply never connected), or a developer pointed it
# at the local tunnel to test and packaged without pointing it back. Neither produces an error for
# the person who installs it — the catalog is just not there. So refuse to build instead.
MCP="$ROOT/plugin/.mcp.json"
PROD_HOST="catalog.blackdash.my"
[ -f "$MCP" ] || { echo "✗ $MCP is missing — the plugin would ship with no catalog config" >&2; exit 1; }
MCP_URL="$(node -e '
  try {
    process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))
      .mcpServers["blackdash-catalog"].url)
  } catch (e) { process.stdout.write("") }
' "$MCP")"
case "$MCP_URL" in
  *"$PROD_HOST"*) ;;
  "") echo "✗ $MCP has no blackdash-catalog url" >&2; exit 1 ;;
  *) echo "✗ $MCP points at $MCP_URL, not $PROD_HOST." >&2
     echo "  That is a local-dev target. Point it back at production before packaging," >&2
     echo "  or set ALLOW_NONPROD_CATALOG=1 if you really mean to ship this." >&2
     [ "${ALLOW_NONPROD_CATALOG:-}" = "1" ] || exit 1
     echo "  ALLOW_NONPROD_CATALOG=1 — shipping $MCP_URL anyway." >&2 ;;
esac
echo "· catalog: $MCP_URL"

mkdir -p "$OUT"
ZIP="$OUT/bd-website-create-v$VERSION.zip"
rm -f "$ZIP"
( cd "$ROOT/plugin" && zip -qr "$ZIP" . -x '.DS_Store' '**/.DS_Store' )

# The upload dialog accepts .zip or .plugin; they are the same archive under two names.
PLUGIN_FILE="${ZIP%.zip}.plugin"
cp -f "$ZIP" "$PLUGIN_FILE"

echo "✓ $ZIP  ($(du -h "$ZIP" | cut -f1))"
echo "✓ $PLUGIN_FILE"

unzip -l "$ZIP" | sed -n '4,20p'
