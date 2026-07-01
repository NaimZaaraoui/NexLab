#!/bin/bash
# =============================================================================
# NexLab LIMS — Script de mise à jour
# Usage: ./update.sh [VERSION]
# Exemple: ./update.sh 1.2.0
# Si aucune version n'est spécifiée, la version "latest" sera utilisée.
# =============================================================================

set -e

VERSION="${1:-latest}"
IMAGE="nexlab-app"
COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="./backups/pre-update"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   NexLab — Mise à jour v${VERSION}   "
echo "╚══════════════════════════════════════╝"
echo ""

# -----------------------------------------------------------------------------
# 0. Vérifier que docker compose est disponible
# -----------------------------------------------------------------------------
if ! command -v docker &> /dev/null; then
  echo "❌ Docker n'est pas installé ou non accessible."
  exit 1
fi

# -----------------------------------------------------------------------------
# 1. Sauvegarde automatique AVANT la mise à jour
# -----------------------------------------------------------------------------
echo "📦 Étape 1/5 : Sauvegarde de sécurité pré-mise à jour..."
mkdir -p "$BACKUP_DIR"

# Copier le volume SQLite depuis le conteneur en cours
if docker ps --format '{{.Names}}' | grep -q "nexlab-app"; then
  docker exec nexlab-app sh -c \
    "cp /app/data/nexlab.db /tmp/nexlab-preupdate.db && echo OK" && \
  docker cp nexlab-app:/tmp/nexlab-preupdate.db \
    "${BACKUP_DIR}/nexlab_${TIMESTAMP}.db"
  echo "   ✅ Base de données sauvegardée: ${BACKUP_DIR}/nexlab_${TIMESTAMP}.db"
else
  echo "   ⚠️  Conteneur non démarré, tentative de copie depuis le volume..."
  # Try volume-based backup
  docker run --rm \
    -v nexlab_nexlab-db:/data \
    -v "$(pwd)/${BACKUP_DIR}:/backup" \
    alpine sh -c "cp /data/nexlab.db /backup/nexlab_${TIMESTAMP}.db" 2>/dev/null || \
    echo "   ⚠️  Impossible de sauvegarder le volume. Continuez manuellement si nécessaire."
fi

echo ""

# -----------------------------------------------------------------------------
# 2. Arrêt propre du conteneur
# -----------------------------------------------------------------------------
echo "⏹️  Étape 2/5 : Arrêt du service..."
docker compose -f "$COMPOSE_FILE" down --timeout 15
echo "   ✅ Service arrêté."
echo ""

# -----------------------------------------------------------------------------
# 3. Mise à jour de l'image
# -----------------------------------------------------------------------------
echo "🔄 Étape 3/5 : Téléchargement de la nouvelle version (${VERSION})..."
if [ "$VERSION" = "latest" ]; then
  docker compose -f "$COMPOSE_FILE" pull
else
  # Pour les images versionnées avec un tag
  docker compose -f "$COMPOSE_FILE" pull
fi
echo "   ✅ Image mise à jour."
echo ""

# -----------------------------------------------------------------------------
# 4. Rebuild si nécessaire (builds locaux)
# -----------------------------------------------------------------------------
echo "🔨 Étape 4/5 : Rebuild du conteneur..."
docker compose -f "$COMPOSE_FILE" build --no-cache
echo "   ✅ Conteneur reconstruit."
echo ""

# -----------------------------------------------------------------------------
# 5. Redémarrage (les migrations Prisma s'exécutent automatiquement via entrypoint.sh)
# -----------------------------------------------------------------------------
echo "🚀 Étape 5/5 : Démarrage..."
docker compose -f "$COMPOSE_FILE" up -d

echo ""
echo "⏳ Attente du démarrage complet (30 secondes)..."
sleep 30

# Vérifier le healthcheck
if docker ps --filter "name=nexlab-app" --filter "health=healthy" | grep -q nexlab-app; then
  echo ""
  echo "╔══════════════════════════════════════╗"
  echo "║  ✅ Mise à jour réussie !            ║"
  echo "╚══════════════════════════════════════╝"
  echo ""
  echo "  🌐 Application disponible sur http://localhost"
  echo "  📦 Sauvegarde pré-update: ${BACKUP_DIR}/nexlab_${TIMESTAMP}.db"
  echo ""
else
  echo ""
  echo "╔══════════════════════════════════════╗"
  echo "║  ⚠️  Vérification du statut requise  ║"
  echo "╚══════════════════════════════════════╝"
  echo ""
  echo "  Vérifiez manuellement : docker logs nexlab-app"
  echo "  En cas de problème, restaurez la sauvegarde :"
  echo "  docker cp ${BACKUP_DIR}/nexlab_${TIMESTAMP}.db nexlab-app:/app/data/nexlab.db"
  echo ""
fi

echo "🔍 Logs récents :"
docker logs nexlab-app --tail 20
