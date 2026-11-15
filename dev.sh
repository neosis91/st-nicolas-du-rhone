#!/bin/sh
cd "$(dirname "$0")" || exit 1

cleanup() {
  trap - INT TERM EXIT
  if [ -n "$api" ]; then kill "$api" 2>/dev/null; fi
  if [ -n "$web" ]; then kill "$web" 2>/dev/null; fi
  wait 2>/dev/null
}

trap cleanup INT TERM EXIT

echo "API  → http://127.0.0.1:3000"
echo "Site → http://localhost:4200/  (utilisez localhost, pas 127.0.0.1, pour les clés d’accès)"
echo

npm run start:dev --prefix apps/api &
api=$!
npm run start --prefix apps/web &
web=$!

wait
