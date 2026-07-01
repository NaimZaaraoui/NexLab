$ErrorActionPreference = "Stop"

$RootDir = (Get-Item .).FullName
$InstallDir = Join-Path $RootDir "nexlab-install"
$ImageName = "nexlab:offline"

if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir | Out-Null
}

Write-Host "==> Building NexLab offline image..." -ForegroundColor Cyan
docker build -t $ImageName $RootDir
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Docker build failed." -ForegroundColor Red
    exit 1
}

Write-Host "==> Exporting Docker image..." -ForegroundColor Cyan
docker save -o "$InstallDir\nexlab-image.tar" $ImageName
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Docker save failed." -ForegroundColor Red
    exit 1
}

if (Test-Path "$RootDir\dev.db") {
    Copy-Item "$RootDir\dev.db" "$InstallDir\nexlab.db" -Force
    Write-Host "Copied dev.db to nexlab-install\nexlab.db" -ForegroundColor Green
}

$UploadsDir = Join-Path $InstallDir "uploads"
if (-not (Test-Path $UploadsDir)) {
    New-Item -ItemType Directory -Path $UploadsDir | Out-Null
}

if (Test-Path "$RootDir\public\uploads") {
    Copy-Item "$RootDir\public\uploads\*" "$UploadsDir\" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "`nOffline installer prepared in: $InstallDir" -ForegroundColor Cyan
Write-Host "Files ready:"
Write-Host " - nexlab-image.tar"
Write-Host " - nexlab.db"
Write-Host " - docker-compose.yml"
Write-Host " - install.sh (for Linux clients)"
Write-Host " - update.sh"
Write-Host " - backup-now.sh"
Write-Host " - restore-backup.sh"
Write-Host " - README.md`n"

Write-Host "==> Build complete! You can now zip the 'nexlab-install' folder and deploy it." -ForegroundColor Green
