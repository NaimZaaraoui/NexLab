#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_DIR="${ROOT_DIR}/nexlab-install"
IMAGE_NAME="nexlab:offline"

echo "==> Building NexLab offline image..."
docker build -t "${IMAGE_NAME}" "${ROOT_DIR}"

echo "==> Exporting Docker image..."
docker save -o "${INSTALL_DIR}/nexlab-image.tar" "${IMAGE_NAME}"

if [ -f "${ROOT_DIR}/dev.db" ]; then
  cp "${ROOT_DIR}/dev.db" "${INSTALL_DIR}/nexlab.db"
  echo "Copied dev.db to nexlab-install/nexlab.db"
fi

mkdir -p "${INSTALL_DIR}/uploads"
if [ -d "${ROOT_DIR}/public/uploads" ]; then
  cp -R "${ROOT_DIR}/public/uploads/." "${INSTALL_DIR}/uploads/" 2>/dev/null || true
fi

echo "Offline installer prepared in: ${INSTALL_DIR}"
echo "Files ready:"
echo " - nexlab-image.tar"
echo " - nexlab.db"
echo " - docker-compose.yml"
echo " - install.sh"
echo " - update.sh"
echo " - backup-now.sh"
echo " - restore-backup.sh"
echo " - README.md"
echo
echo "==> Build complete! You can now zip the 'nexlab-install' folder and deploy it."
