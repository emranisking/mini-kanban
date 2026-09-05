#!/bin/sh
set -e

echo "[backend] Waiting for PostgreSQL at ${DATABASE_HOST:-postgres}:${DATABASE_PORT:-5432}..."
ATTEMPTS=0
until node -e "
const net = require('net');
const socket = net.createConnection(${DATABASE_PORT:-5432}, '${DATABASE_HOST:-postgres}');
socket.on('connect', () => { socket.end(); process.exit(0); });
socket.on('error', () => process.exit(1));
" 2>/dev/null; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge 60 ]; then
    echo "[backend] PostgreSQL did not become ready in time." >&2
    exit 1
  fi
  sleep 1
done
echo "[backend] PostgreSQL is up."

echo "[backend] Running database migrations..."
node ./node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js

echo "[backend] Starting application..."
exec "$@"
