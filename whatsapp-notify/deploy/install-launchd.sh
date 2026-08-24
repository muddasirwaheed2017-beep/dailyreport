#!/usr/bin/env bash
# Fills in the paths in the launchd plist and loads it. Run from the module root:
#   bash deploy/install-launchd.sh
set -euo pipefail

MODULE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE="$(command -v node)"
LABEL="com.maliksons.wa-notify"
TARGET="$HOME/Library/LaunchAgents/$LABEL.plist"

[ -f "$MODULE/.env" ] || { echo "error: $MODULE/.env is missing — copy .env.example and fill it in first"; exit 1; }

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
echo "check it:   launchctl list | grep wa-notify"
echo "logs:       tail -f $MODULE/logs/listener.out.log"
echo "stop:       launchctl unload -w $TARGET"
