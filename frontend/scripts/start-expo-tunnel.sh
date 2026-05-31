#!/usr/bin/env bash
set -eu

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."
pkill -f "expo start" 2>/dev/null || true
rm -f /tmp/rufree-tunnel.log

EXPO_PORT="${EXPO_PORT:-8083}"
setsid sh -c "exec npx expo start --clear --tunnel --port $EXPO_PORT > /tmp/rufree-tunnel.log 2>&1" >/dev/null 2>&1 < /dev/null &

sleep 35
echo "---LOG---"
sed -n '1,260p' /tmp/rufree-tunnel.log
