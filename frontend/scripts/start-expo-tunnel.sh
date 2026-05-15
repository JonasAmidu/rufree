#!/usr/bin/env bash
set -eu

cd /home/jonas/.openclaw/workspace/rufree/frontend
pkill -f "expo start" 2>/dev/null || true
rm -f /tmp/rufree-tunnel.log

setsid sh -c 'exec npx expo start --clear --tunnel --port 8081 > /tmp/rufree-tunnel.log 2>&1' >/dev/null 2>&1 < /dev/null &

sleep 35
echo "---LOG---"
sed -n '1,260p' /tmp/rufree-tunnel.log
