#!/usr/bin/env bash
# Verify every submodule pin before a push. Run from a pre-push hook (husky, or core.hooksPath).
#
#   check-submodules.sh            warn if a pin is behind origin/main
#   check-submodules.sh --strict   refuse the push if a pin is behind origin/main
#
# Two different failures, and only one of them is ever acceptable:
#
#   1. The pin names a commit that is on no remote branch. Always blocked. You committed inside the
#      submodule, bumped the pin, pushed the parent and forgot to push the submodule — so the pin
#      resolves only on your laptop and everyone else's `git submodule update` fails on it.
#
#   2. The pin is behind the submodule's origin/main. Blocked under --strict, which is for repos
#      whose deploy tracks origin/main (site-hosting's update.sh runs `git submodule update
#      --remote`). There, pushing a behind pin means shipping a version this repo never saw.
#
# Bypass, when you mean it: git push --no-verify
set -uo pipefail

strict=0
[ "${1:-}" = "--strict" ] && strict=1

fail=0
# Submodule paths as recorded in the commit being pushed — mode 160000 is a gitlink.
subs="$(git ls-files -s | awk '$1 == "160000" { print $4 }')"
[ -n "$subs" ] || exit 0

while IFS= read -r path; do
  [ -n "$path" ] || continue
  pinned="$(git ls-files -s -- "$path" | awk '{print $2}')"

  if [ ! -e "$path/.git" ]; then
    echo "submodules: $path is not checked out — cannot verify its pin (${pinned:0:8}). Skipping." >&2
    continue
  fi

  git -C "$path" fetch --quiet origin 2>/dev/null || \
    echo "submodules: could not fetch $path's origin; checking against the last known remote refs." >&2

  if ! git -C "$path" cat-file -e "$pinned^{commit}" 2>/dev/null; then
    echo "submodules: BLOCKED — $path is pinned at ${pinned:0:8}, which its own checkout does not have." >&2
    fail=1
    continue
  fi

  if [ -z "$(git -C "$path" branch -r --contains "$pinned" 2>/dev/null)" ]; then
    echo "submodules: BLOCKED — $path is pinned at ${pinned:0:8}, which is on no remote branch." >&2
    echo "            Push the submodule first:  git -C $path push origin HEAD" >&2
    fail=1
    continue
  fi

  behind="$(git -C "$path" rev-list --count "$pinned..origin/main" 2>/dev/null || echo 0)"
  if [ "${behind:-0}" -gt 0 ]; then
    if [ "$strict" -eq 1 ]; then
      echo "submodules: BLOCKED — $path pin is $behind commit(s) behind origin/main." >&2
      echo "            This repo deploys from origin/main, so the pin is not what will run." >&2
      echo "            Sync:  git submodule update --remote $path && git add $path" >&2
      fail=1
    else
      echo "submodules: warning — $path pin is $behind commit(s) behind origin/main." >&2
    fi
    continue
  fi

  # States that are fine mid-work but usually mean the pin is not what you meant.
  head="$(git -C "$path" rev-parse HEAD)"
  [ "$head" != "$pinned" ] && \
    echo "submodules: warning — $path HEAD (${head:0:8}) differs from the pin (${pinned:0:8}); the pin is what ships." >&2
  [ -n "$(git -C "$path" status --porcelain)" ] && \
    echo "submodules: warning — $path has uncommitted changes; they are not in the pin." >&2
done <<< "$subs"

if [ "$fail" -ne 0 ]; then
  echo >&2
  echo "submodules: push refused. Fix the pins above and retry. Override: git push --no-verify" >&2
  exit 1
fi
exit 0
