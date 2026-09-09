#!/usr/bin/env bash
# Push the skill from this repo — the source — to the places that consume it.
#
# The same four files live in three places: here, the starter a creator clones, and the agent's
# own ~/.claude/skills. They are copies, not links, so they drift silently: today the starter's
# copy still told creators to fall back to a bundled catalog when the MCP was down, an instruction
# this repo had already removed. A creator following a stale copy produces a bundle the platform
# refuses, and nothing in the failure points at the skill.
#
#   ./skills/install.sh                  # ~/.claude/skills only
#   ./skills/install.sh ../site-starter  # and a starter checkout
set -euo pipefail
SRC="$(cd "$(dirname "$0")/create-webpage" && pwd)"

install_to() {
  local dest="$1"
  mkdir -p "$dest"
  rsync -a --delete "$SRC/" "$dest/"
  echo "→ $dest"
}

install_to "$HOME/.claude/skills/create-webpage"
for starter in "$@"; do
  [ -d "$starter/.claude/skills" ] || { echo "✗ $starter has no .claude/skills — is it a starter checkout?" >&2; exit 1; }
  install_to "$starter/.claude/skills/create-webpage"
done
echo "done — $(cd "$SRC" && ls | wc -l | tr -d ' ') entries from $SRC"
