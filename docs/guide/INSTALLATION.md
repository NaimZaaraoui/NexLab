# Guide d'Installation NexLab LIMS

## Prérequis

| Composant | Version minimale |
|-----------|-----------------|
| Docker Desktop | 24.x |
| Docker Compose | v2+ |
| RAM disponible | 2 Go |
| Espace disque | 5 Go |

## Installation (toutes plateformes)

```bash
# 1. Télécharger le kit d'installation
cd nexlab-install/

# 2. Windows
install.bat

# 3. Linux / macOS
chmod +x install.sh
./install.sh
```

Le script :
- Télécharge l'image Docker NexLab
- Crée les volumes de données persistants
- Lance le service sur le port **3000**
- Affiche l'URL d'accès locale

## Accès après installation

| Endpoint | URL par défaut |
|----------|----------------|
| Interface web | `http://localhost:3000` |
| Config réseau local | `http://<IP-du-serveur>:3000` |

Au premier lancement, le **Setup Wizard** s'affiche pour configurer le laboratoire.

## Variables d'environnement (.env)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Chemin SQLite (géré automatiquement) |
| `NEXTAUTH_SECRET` | Clé secrète JWT (générée à l'install) |
| `NEXTAUTH_URL` | URL de base de l'application |
| `RESEND_API_KEY` | Clé API pour l'envoi d'emails (optionnel) |

## Mise à jour

```bash
cd nexlab-install/
docker compose pull
docker compose up -d
```

> **Important** : Effectuez toujours une sauvegarde avant la mise à jour.

## Désinstallation

```bash
docker compose down -v   # Supprime les containers et volumes
```

---
*Voir aussi : [Guide Administrateur](ADMIN_GUIDE.md) | [Sauvegarde & Restauration](../features/backup-recovery/)*
