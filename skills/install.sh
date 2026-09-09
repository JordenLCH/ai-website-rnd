#!/usr/bin/env bash
# Push the skills from this repo — the source — to the places that consume them.
#
# Every skill directory under skills/ is synced. Adding a skill is adding a directory here; there
# is no list to update, because a list is the thing that silently stops including the newest one.
#
# They are copies, not links, so they drift silently: the starter's copy once still told creators
# to fall back to a bundled catalog when the MCP was down, an instruction this repo had already
# removed. A creator following a stale copy produces a bundle the platform refuses, and nothing in
# the failure points at the skill.
#
# The plugin copy (plugin/skills/<name>) is the one destination that always syncs — it is what
# `plugin install website-create` ships, so a stale one is a stale release.
#
# It used to also install to ~/.claude/skills. It no longer does: the plugin is installed from
# this directory, so the agent already reads the skills through plugin/skills. A second copy at
# ~/.claude/skills/<name> is the same skill under the same name, loaded twice, and it only has to
# be refreshed once for the two to disagree about which one is current.
#
#   ./skills/install.sh                  # plugin copies only
#   ./skills/install.sh ../site-starter  # and a starter checkout
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"

# Every directory here holding a SKILL.md. Anything else under skills/ (this script, packaged
# archives) is not a skill and is not synced.
SKILLS=()
for d in "$HERE"/*/; do
  [ -f "$d/SKILL.md" ] && SKILLS+=("$(basename "$d")")
done
[ ${#SKILLS[@]} -gt 0 ] || { echo "✗ no skills found under $HERE" >&2; exit 1; }

install_to() {
  local src="$1" dest="$2"
  mkdir -p "$dest"
  rsync -a --delete --exclude '.DS_Store' "$src/" "$dest/"
  echo "→ $dest"
}

for name in "${SKILLS[@]}"; do
  install_to "$HERE/$name" "$ROOT/plugin/skills/$name"

  # Left over from when this script installed there directly — remove it, or it shadows the
  # plugin's copy with whatever the skill looked like the last time that path was written.
  LEGACY="$HOME/.claude/skills/$name"
  [ -d "$LEGACY" ] && { rm -rf "$LEGACY"; echo "✗ removed legacy copy at $LEGACY (the plugin ships it now)"; }

  for starter in "$@"; do
    [ -d "$starter/.claude/skills" ] || { echo "✗ $starter has no .claude/skills — is it a starter checkout?" >&2; exit 1; }
    install_to "$HERE/$name" "$starter/.claude/skills/$name"
  done
done

# A skill deleted from source but still sitting in plugin/skills/ would keep shipping. rsync only
# prunes inside a destination it was given, so the directory itself has to be removed here.
for d in "$ROOT"/plugin/skills/*/; do
  [ -d "$d" ] || continue
  name="$(basename "$d")"
  [ -d "$HERE/$name" ] || { rm -rf "$d"; echo "✗ removed $name from plugin/skills (no longer in source)"; }
done

echo "done — ${#SKILLS[@]} skill(s): ${SKILLS[*]}"
