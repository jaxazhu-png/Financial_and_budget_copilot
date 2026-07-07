#!/bin/bash
# One-off "sync to GitHub" — double-click this file (or run it) to commit + push the
# current folder to origin/main. Safe to run anytime; it handles the common snags
# (detached HEAD, remote ahead) automatically.
#
# First run only: make it double-clickable with
#     chmod +x sync-now.command
# If macOS blocks it ("unidentified developer"), right-click → Open the first time.

cd "$(dirname "$0")" || { echo "Cannot enter script folder"; exit 1; }
echo "── Sync to GitHub ──"
echo "Folder: $(pwd)"
echo

# 1) make sure we are ON main (fixes detached-HEAD pushes that go nowhere)
branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
if [ "$branch" != "main" ]; then
  echo "Not on main (was: $branch) — moving main to current commit…"
  git checkout -B main >/dev/null 2>&1
fi

# 2) stage + commit (skip if nothing changed)
git add -A
if git diff --cached --quiet; then
  echo "No file changes to commit."
else
  git commit -m "sync: $(date '+%Y-%m-%d %H:%M:%S')" >/dev/null && echo "Committed: $(git rev-parse --short HEAD)"
fi

# 3) push, with automatic recovery if the remote is ahead
echo "Pushing to origin/main…"
if git push origin main 2>/tmp/syncerr; then
  echo "✓ Pushed."
else
  echo "Push rejected — trying to integrate remote (rebase)…"
  if git pull --rebase origin main >/dev/null 2>&1 && git push origin main >/tmp/syncerr 2>&1; then
    echo "✓ Pushed after rebase."
  else
    echo "Rebase didn't apply cleanly — forcing (this folder wins)…"
    if git push --force-with-lease origin main >/tmp/syncerr 2>&1; then
      echo "✓ Force-pushed (local is now the source of truth)."
    else
      echo "✗ Push still failing:"; sed 's/^/    /' /tmp/syncerr | tail -6
    fi
  fi
fi

echo
echo "Latest commit: $(git log -1 --oneline 2>/dev/null)"
echo "Done. Press Enter to close."
read -r _
