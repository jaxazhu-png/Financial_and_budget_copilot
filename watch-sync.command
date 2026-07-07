#!/bin/bash
# Auto-sync: watches this folder and commits + pushes to GitHub on every change.
#
# Start it ONCE and leave the window open. Best way to run (shows output, avoids
# the .command/zsh quirks):
#     bash ~/Desktop/"Claude Code"/financial-budgeting-copilot/watch-sync.command
# (Double-click also works once it's executable: chmod +x watch-sync.command)
#
# Requires git auth cached once (after your first successful `git push` the macOS
# keychain remembers it). Ctrl+C to stop.

cd "$(dirname "$0")" || { echo "cannot cd to script folder"; exit 1; }

# make sure tracking is set so plain `git push` works
git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1 || git branch --set-upstream-to=origin/main main >/dev/null 2>&1

echo "Auto-sync watching: $(pwd)"
echo "Commits + pushes to origin/main whenever files change. Ctrl+C to stop."
echo

while true; do
  if [ -n "$(git status --porcelain)" ]; then
    git add -A
    git commit -m "auto-sync: $(date '+%Y-%m-%d %H:%M:%S')" >/dev/null 2>&1
    if git push origin main 2>/tmp/wsync.err; then
      echo "[$(date '+%H:%M:%S')] pushed: $(git rev-parse --short HEAD)"
    else
      # remote moved ahead? try to integrate then push once more
      if git pull --rebase origin main >/dev/null 2>&1 && git push origin main >/tmp/wsync.err 2>&1; then
        echo "[$(date '+%H:%M:%S')] pushed after rebase: $(git rev-parse --short HEAD)"
      else
        echo "[$(date '+%H:%M:%S')] commit done, push FAILED:"; sed 's/^/    /' /tmp/wsync.err | tail -4
      fi
    fi
  fi
  sleep 8
done
