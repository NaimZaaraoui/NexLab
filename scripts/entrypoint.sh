#!/bin/sh
set -e

echo "[NexLab] Starting initialization..."

# 1. Enforce correct permissions on persistent SQLite mount
echo "[NexLab] Setting up volume permissions..."
mkdir -p /app/data
if ! chown -R nextjs:nodejs /app/data 2>/dev/null; then
  echo "[NexLab] Warning: unable to change ownership on /app/data, continuing with existing permissions."
fi

# 2. Sync database schema safely
echo "[NexLab] Pushing Prisma schema..."
if ! npx prisma db push --accept-data-loss; then
  echo "[NexLab] ❌ Database sync failed. The database might be corrupted or locked."
  echo "[NexLab] ❌ Halting startup to prevent data damage."
  exit 1
fi

echo "[NexLab] Database initialized successfully."

# 3. Start nightly auto-backup scheduler (runs in background)
# Waits 5 minutes after boot so the app fully initializes,
# then runs a backup every 24 hours.
echo "[NexLab] Starting nightly backup scheduler..."
(
  while true; do
    sleep 300  # Initial 5-minute delay to let the app start cleanly
    echo "[NexLab][Backup] Running scheduled backup at $(date -u +%Y-%m-%dT%H:%M:%SZ)..."
    if node -e "
      const { execSync } = require('child_process');
      try {
        execSync('npx tsx scripts/run-scheduled-backups.ts', { stdio: 'inherit', cwd: '/app' });
        console.log('[NexLab][Backup] ✅ Backup completed successfully.');
      } catch(e) {
        console.error('[NexLab][Backup] ❌ Backup failed:', e.message);
      }
    " 2>&1; then
      echo "[NexLab][Backup] Done."
    fi
    sleep 86100  # Sleep ~23h55m until next run (total cycle ~24h)
  done
) &

BACKUP_PID=$!
echo "[NexLab] Backup scheduler started (PID: $BACKUP_PID)."

# 4. Start the Next.js server
echo "[NexLab] Starting server on port $PORT..."
exec node server.js
