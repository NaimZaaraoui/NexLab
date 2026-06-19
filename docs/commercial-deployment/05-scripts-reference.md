# NexLab LIMS — Guide des Scripts du Dossier `nexlab-install`

> *Ce document explique le rôle exact de chaque script du dossier d'installation et dans quelle situation l'utiliser.*

---

## Vue d'Ensemble

```
nexlab-install/
├── install.ps1        ← Installation initiale (Windows)
├── install.sh         ← Installation initiale (Linux/macOS)
├── backup-now.ps1     ← Sauvegarde immédiate (Windows)
├── backup-now.sh      ← Sauvegarde immédiate (Linux)
├── restore-backup.ps1 ← Restauration d'une sauvegarde (Windows)
├── restore-backup.sh  ← Restauration d'une sauvegarde (Linux)
├── update.ps1         ← Mise à jour de NexLab (Windows)
├── update.sh          ← Mise à jour de NexLab (Linux)
├── cleanup-data.sh    ← Effacement des données de démo (Linux)
├── docker-compose.yml ← Configuration du conteneur
├── nexlab-image.tar   ← L'application NexLab (~800 Mo)
└── nexlab.db          ← Base de données pré-configurée (optionnel)
```

---

## `install.ps1` / `install.sh` — Installation Initiale

**Quand l'utiliser :** Une seule fois, lors de l'installation chez un nouveau client.

**Ce qu'il fait :**
1. Vérifie si Docker est installé. Si non, le télécharge et l'installe automatiquement.
2. Vérifie Docker Compose v2.
3. Crée le fichier `.env` de configuration (seulement s'il n'existe pas encore).
4. Charge l'image NexLab depuis `nexlab-image.tar` (sans internet requis).
5. Crée le volume Docker `nexlab-db` (stockage persistant de la base).
6. Restaure `nexlab.db` dans le volume si le fichier est présent.
7. Lance NexLab et attend qu'il soit prêt.
8. Crée un raccourci sur le Bureau et dans le Menu Démarrer.

**Note importante sur le `.env` :**
Le script crée un `.env` minimal avec un `AUTH_SECRET` généré aléatoirement. Vous devez **ensuite** y ajouter manuellement les clés `SEAL_SECRET`, `INTERNAL_PRINT_TOKEN`, `BACKUP_ENCRYPTION_KEY`, etc. (voir guide d'installation).

---

## `backup-now.ps1` / `backup-now.sh` — Sauvegarde Immédiate

**Quand l'utiliser :**
- Avant une intervention technique risquée (modification de la base, test d'une nouvelle fonctionnalité).
- Quand le client vous appelle pour avoir une sauvegarde "de ce soir, pas de demain matin".
- En urgence, si la sauvegarde automatique nocturne a échoué.

**Ce qu'il fait :**
1. Vérifie que Docker tourne.
2. Copie la base de données depuis le conteneur en cours.
3. Enregistre le fichier `.db` dans le dossier `./backups/` avec un horodatage.
4. Supprime automatiquement les sauvegardes au-delà des 10 dernières.

**Usage :**
```powershell
# Windows
.\backup-now.ps1

# Linux
./backup-now.sh
```

**Résultat :** Un fichier `nexlab_backup_20240615_023000.db` dans `./backups/`.

---

## `restore-backup.ps1` / `restore-backup.sh` — Restauration

**Quand l'utiliser :**
- En cas de catastrophe (crash, erreur humaine majeure, panne disque sur nouveau PC).
- Pour revenir à l'état d'hier si une manipulation a corrompu les données.

**Ce qu'il fait :**
1. Vérifie que le fichier de sauvegarde fourni est une base SQLite valide.
2. Demande une confirmation explicite ("oui/non") car l'opération est irréversible.
3. Arrête NexLab.
4. Remplace la base de données active par la sauvegarde.
5. Redémarre NexLab et attend qu'il soit prêt.

**Usage :**
```powershell
# Windows — Spécifiez le fichier de sauvegarde
.\restore-backup.ps1 .\backups\nexlab_backup_20240615_023000.db

# Linux
./restore-backup.sh ./backups/nexlab_backup_20240615_023000.db
```

> [!WARNING]
> Cette opération **écrase la base actuelle**. Toutes les données saisies depuis la sauvegarde seront perdues. Ne faites pas cette opération sans l'accord du directeur du laboratoire.

---

## `update.ps1` / `update.sh` — Mise à Jour de NexLab

**Quand l'utiliser :**
- Quand vous avez développé une nouvelle version de NexLab et souhaitez la déployer chez un client existant.

**Comment préparer la mise à jour :**
1. Sur votre PC de développement, construisez la nouvelle image Docker :
   ```bash
   docker build -t nexlab:offline .
   docker save nexlab:offline -o nexlab-image.tar
   ```
2. Copiez le nouveau `nexlab-image.tar` dans le dossier `nexlab-install/` chez le client (via clé USB ou partage réseau).
3. Lancez le script de mise à jour.

**Ce qu'il fait :**
1. Vérifie Docker.
2. **Sauvegarde automatiquement** la base de données dans `./backups/pre-update/` avant toute opération.
3. Arrête NexLab proprement.
4. Charge la nouvelle image depuis `nexlab-image.tar`.
5. Redémarre NexLab. Les migrations Prisma s'exécutent automatiquement si le schéma a changé.

**Usage :**
```powershell
# Windows
.\update.ps1

# Linux
./update.sh
```

> [!NOTE]
> Ne lancez jamais ce script sans avoir d'abord copié le nouveau `nexlab-image.tar` dans le dossier. Si le script ne trouve pas le fichier, il arrête NexLab et abandonne sans mettre à jour — le service sera coupé tant que vous ne relancez pas `docker compose up -d`.

---

## `cleanup-data.sh` — Nettoyage des Données de Démo

**Quand l'utiliser :**
- Après installation, si vous avez utilisé une base `nexlab.db` qui contenait des données de démonstration (patients fictifs, analyses tests).
- Avant de livrer le système au client, pour qu'il parte d'une base vierge.

**Ce qu'il supprime :**
- Tous les patients, analyses et résultats.
- Tous les lots QC, résultats QC.
- Tout l'inventaire et les mouvements de stock.
- Les logs d'audit et les notifications.

**Ce qu'il conserve :**
- La configuration des tests et catégories (votre travail de paramétrage).
- Les comptes utilisateurs et les rôles.
- Les paramètres du laboratoire (logo, signature, etc.).

**Usage :**
```bash
# Linux uniquement (nécessite sqlite3 sur le serveur)
./cleanup-data.sh
```

---

## Commandes Docker Utiles (Rappel)

| Besoin | Commande |
|---|---|
| Voir si NexLab tourne | `docker compose ps` |
| Voir les logs en direct | `docker compose logs -f` |
| Arrêter NexLab | `docker compose stop` |
| Démarrer NexLab | `docker compose start` |
| Redémarrer après modif `.env` | `docker compose restart` |
| Tout arrêter et supprimer | `docker compose down` |
