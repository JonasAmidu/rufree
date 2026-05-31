#!/usr/bin/env bash
set -eu

HOST_IP="${1:-}"

cd /home/jonas/.openclaw/workspace/rufree/frontend
pkill -f "expo start" 2>/dev/null || true
rm -f /tmp/rufree-live.log

if [ -n "$HOST_IP" ]; then
  export REACT_NATIVE_PACKAGER_HOSTNAME="$HOST_IP"
  export EXPO_DEVTOOLS_LISTEN_ADDRESS="0.0.0.0"
  setsid sh -c 'exec npx expo start --clear --host lan --port 8083 > /tmp/rufree-live.log 2>&1' >/dev/null 2>&1 < /dev/null &
else
  setsid sh -c 'exec npx expo start --clear --port 8083 > /tmp/rufree-live.log 2>&1' >/dev/null 2>&1 < /dev/null &
fi

sleep 20
curl -I -m 20 http://127.0.0.1:8083
echo "---LOG---"
sed -n '1,260p' /tmp/rufree-live.log
