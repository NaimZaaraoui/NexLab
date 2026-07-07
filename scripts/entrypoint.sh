#!/bin/sh
set -e

echo "[NexLab] Starting initialization..."

# 1. Ensure data directory exists and is writable
echo "[NexLab] Setting up volume permissions..."
mkdir -p /app/data
if ! chown -R nextjs:nodejs /app/data 2>/dev/null; then
  echo "[NexLab] Warning: unable to change ownership on /app/data, continuing with existing permissions."
fi

# 2. Apply database migrations using our custom migration runner
#    (does NOT require the Prisma CLI -- uses @libsql/client directly)
echo "[NexLab] Applying database migrations..."
if ! node /app/scripts/docker-migrate.cjs; then
  echo "[NexLab] ❌ Database migration failed. The database might be corrupted or locked."
  echo "[NexLab] ❌ Halting startup to prevent data damage."
  exit 1
fi

echo "[NexLab] Database ready."

# 3. Start nightly auto-backup scheduler (background, fire-and-forget loop)
# Waits for the app to be fully up, then triggers backup every 24h via internal API.
echo "[NexLab] Starting nightly backup scheduler..."
(
  while true; do
    sleep 300  # Initial 5-minute delay so the app is fully up before first backup
    TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    echo "[NexLab][Backup] Triggering backup at ${TIMESTAMP}..."
    if curl -sf -X POST http://127.0.0.1:3000/api/cron/backup > /dev/null 2>&1; then
      echo "[NexLab][Backup] ✅ Backup completed successfully."
    else
      echo "[NexLab][Backup] ❌ Backup failed (app may not be fully started yet, will retry in 24h)."
    fi
    sleep 86100  # ~23h55m until next cycle
  done
) &

BACKUP_PID=$!
echo "[NexLab] Backup scheduler started (PID: ${BACKUP_PID})."

# 4. Start the Next.js standalone server
echo "[NexLab] Starting server on port ${PORT:-3000}..."
exec node server.js
