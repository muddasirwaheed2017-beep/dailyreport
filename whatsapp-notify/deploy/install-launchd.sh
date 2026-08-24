#!/usr/bin/env bash
# Fills in the paths in the launchd plist and loads it. Run from the module root:
#   bash deploy/install-launchd.sh
set -euo pipefail

MODULE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE="$(command -v node)"
LABEL="com.maliksons.wa-notify"
TARGET="$HOME/Library/LaunchAgents/$LABEL.plist"

[ -f "$MODULE/.env" ] || { echo "error: $MODULE/.env is missing — copy .env.example and fill it in first"; exit 1; }

# Two listeners sharing one auth folder and one checkpoint will both analyse the
# same batch and send the brief twice. Refuse rather than create that.
if pgrep -f "cli.js listen" >/dev/null 2>&1; then
  echo "error: a listener is already running (probably 'npm start' in a Terminal window)."
  echo "       Stop it with Ctrl-C in that window, then run this again."
  exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents" "$MODULE/logs"
sed -e "s|REPLACE_ME_NODE_PATH|$NODE|g" \
    -e "s|REPLACE_ME_MODULE_PATH|$MODULE|g" \
    "$MODULE/deploy/$LABEL.plist" > "$TARGET"

launchctl unload "$TARGET" 2>/dev/null || true
launchctl load -w "$TARGET"

echo "loaded $LABEL"
echo "  node   $NODE"
echo "  module $MODULE"
echo

# Loading is not the same as running — a bad path or a crash on boot both leave
# it loaded but dead, so confirm rather than assume.
sleep 3
if launchctl list | grep -q "$LABEL"; then
  STATUS="$(launchctl list | grep "$LABEL")"
  PID="$(echo "$STATUS" | awk '{print $1}')"
  EXIT="$(echo "$STATUS" | awk '{print $2}')"
  if [ "$PID" != "-" ]; then
    echo "RUNNING — pid $PID"
  else
    echo "NOT RUNNING — last exit code $EXIT"
    echo "look at: $MODULE/logs/listener.err.log"
  fi
else
  echo "WARNING: $LABEL is not in launchctl list — the load did not take"
fi

echo
echo "is it alive:  launchctl list | grep wa-notify"
echo "what it did:  cd $MODULE && npm run doctor"
echo "live log:     tail -f $MODULE/logs/listener.out.log"
echo "stop it:      launchctl unload -w $TARGET"
