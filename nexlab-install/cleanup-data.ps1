# =============================================================================
# NexLab LIMS — Database Cleanup Script for Windows
# Usage: .\cleanup-data.ps1
# This script removes all test configurations and clinical data to allow
# starting with a fresh configuration. Users and settings are preserved.
# =============================================================================

$ErrorActionPreference = "Stop"
$DB_FILE = "nexlab.db"
$VOLUME_NAME = "nexlab-db"
$CONTAINER_NAME = "nexlab-app"

Write-Host ""
Write-Host "╔═════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🧹 NexLab Database Cleanup (Windows)                           ║" -ForegroundColor Cyan
Write-Host "╚═════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if DB file exists
if (-not (Test-Path $DB_FILE)) {
    Write-Host "❌ Error: $DB_FILE not found in the current directory." -ForegroundColor Red
    Write-Host "   Ensure you are in the nexlab-install folder." -ForegroundColor Gray
    exit 1
}

# Warning
Write-Host "⚠️  This will delete all tests, categories, patients, and results." -ForegroundColor Yellow
Write-Host "   Users and system settings will be preserved." -ForegroundColor Gray
Write-Host ""
Write-Host "Are you sure you want to proceed? (Y/N): " -NoNewline -ForegroundColor Yellow
$answer = Read-Host
if ($answer -notmatch "^[Yy]") {
    Write-Host "Cleanup cancelled." -ForegroundColor Cyan
    exit 0
}

# Stop Docker services
Write-Host "🛑 Stopping Docker services..." -ForegroundColor Cyan
docker compose stop

# Prepare SQL commands
Write-Host "🧼 Cleaning up database tables using Docker (Alpine)..." -ForegroundColor Cyan

$sqlCommands = @"
PRAGMA foreign_keys = OFF;

-- Clinical Data
DELETE FROM results;
DELETE FROM analysis_consumptions;
DELETE FROM analyses;
DELETE FROM patients;

-- Test Configuration
DELETE FROM _BilanToTest;
DELETE FROM bilans;
DELETE FROM tests;
DELETE FROM categories;
DELETE FROM item_test_rules;

-- Quality Control
DELETE FROM qc_results;
DELETE FROM qc_values;
DELETE FROM qc_lots;
DELETE FROM qc_materials;
DELETE FROM qc_targets;

-- Operational Data
DELETE FROM audit_logs;
DELETE FROM audit_logs_archive;
DELETE FROM notifications;
DELETE FROM stock_movements;
DELETE FROM inventory_lots;
DELETE FROM inventory_items;
DELETE FROM temperature_readings;

-- Sequences
DELETE FROM sqlite_sequence WHERE name IN (
    'results', 'analysis_consumptions', 'analyses', 'patients',
    'bilans', 'tests', 'categories', 'item_test_rules',
    'qc_results', 'qc_values', 'qc_lots', 'qc_materials', 'qc_targets',
    'audit_logs', 'audit_logs_archive', 'notifications', 'stock_movements',
    'inventory_lots', 'inventory_items', 'temperature_readings'
);

PRAGMA foreign_keys = ON;
VACUUM;
"@

# Write SQL to temporary file
$sqlCommands | Out-File -FilePath "cleanup.sql" -Encoding UTF8

$currentPath = (Get-Location).Path

# Run sqlite3 inside a temporary alpine container so we don't need sqlite installed on Windows host
try {
    docker run --rm -v "${currentPath}:/workdir" -w /workdir alpine sh -c "apk add --no-cache sqlite && sqlite3 $DB_FILE < cleanup.sql"
    Write-Host "✅ Database cleaned locally." -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to clean database. Ensure Docker is running." -ForegroundColor Red
    Remove-Item "cleanup.sql" -ErrorAction SilentlyContinue
    exit 1
}

# Cleanup temp file
Remove-Item "cleanup.sql" -ErrorAction SilentlyContinue

# Update Docker volume
Write-Host "🔗 Updating Docker volume '$VOLUME_NAME'..." -ForegroundColor Cyan
docker run --rm `
  -v "${VOLUME_NAME}:/app/data" `
  -v "${currentPath}:/backup" `
  alpine sh -c "cp /backup/$DB_FILE /app/data/$DB_FILE && chmod 644 /app/data/$DB_FILE"

Write-Host "✅ Docker volume updated." -ForegroundColor Green

# Restart services
Write-Host "🚀 Restarting Docker services..." -ForegroundColor Cyan
docker compose start

Write-Host ""
Write-Host "✨ Cleanup complete! You can now access NexLab to enter your own tests." -ForegroundColor Green
Write-Host "🌐 URL: http://localhost" -ForegroundColor Cyan
Write-Host ""
