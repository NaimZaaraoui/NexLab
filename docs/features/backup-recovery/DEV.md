# Sauvegardes et reprise

Ce document explique, côté développeur, comment fonctionne réellement la feature de sauvegarde / reprise dans NexLab.

## 1. Vue d’ensemble

La feature repose sur 3 axes :

1. backup SQLite
2. recovery bundle
3. supervision / validation / audit

## 2. Fichiers principaux

### Logique cœur

1. [database-backups.ts](/home/naim/labcare-cssb/lib/database-backups.ts)
2. [recovery-bundles.ts](/home/naim/labcare-cssb/lib/recovery-bundles.ts)
3. [backup-sync.ts](/home/naim/labcare-cssb/lib/backup-sync.ts)
4. [database-integrity.ts](/home/naim/labcare-cssb/lib/database-integrity.ts)

### Endpoints

1. [backups route](/home/naim/labcare-cssb/app/api/database/backups/route.ts)
2. [backup restore route](/home/naim/labcare-cssb/app/api/database/backups/[fileName]/restore/route.ts)
3. [backup validate route](/home/naim/labcare-cssb/app/api/database/backups/[fileName]/validate/route.ts)
4. [backup upload route](/home/naim/labcare-cssb/app/api/database/backups/upload/route.ts)
5. [backup prune route](/home/naim/labcare-cssb/app/api/database/backups/prune/route.ts)
6. [recovery bundles route](/home/naim/labcare-cssb/app/api/database/recovery-bundles/route.ts)
7. [recovery restore route](/home/naim/labcare-cssb/app/api/database/recovery-bundles/[fileName]/restore/route.ts)
8. [recovery validate route](/home/naim/labcare-cssb/app/api/database/recovery-bundles/[fileName]/validate/route.ts)
9. [recovery import route](/home/naim/labcare-cssb/app/api/database/recovery-bundles/import/route.ts)
10. [health route](/home/naim/labcare-cssb/app/api/database/health/route.ts)
11. [full export route](/home/naim/labcare-cssb/app/api/database/export-full/route.ts)

### UI

1. [useDatabaseSettings.ts](/home/naim/labcare-cssb/components/database-settings/useDatabaseSettings.ts)
2. [database overview page](/home/naim/labcare-cssb/app/(app)/dashboard/settings/database/page.tsx)
3. [database backups page](/home/naim/labcare-cssb/app/(app)/dashboard/settings/database/backups/page.tsx)
4. [database supervision page](/home/naim/labcare-cssb/app/(app)/dashboard/settings/database/supervision/page.tsx)
5. [DatabaseFileTable.tsx](/home/naim/labcare-cssb/components/database-settings/DatabaseFileTable.tsx)
6. [DatabaseHealthSection.tsx](/home/naim/labcare-cssb/components/database-settings/DatabaseHealthSection.tsx)
7. [DatabaseRetentionSection.tsx](/home/naim/labcare-cssb/components/database-settings/DatabaseRetentionSection.tsx)
8. [DatabaseRestoreSummary.tsx](/home/naim/labcare-cssb/components/database-settings/DatabaseRestoreSummary.tsx)
9. [DatabaseSectionNav.tsx](/home/naim/labcare-cssb/components/database-settings/DatabaseSectionNav.tsx)

## 3. Base active

La base active est résolue par :

- [getDatabaseFilePath()](/home/naim/labcare-cssb/lib/database-backups.ts)

Logique :

1. lire `DATABASE_URL`
2. fallback : `file:./dev.db`
3. convertir en chemin absolu

## 4. Backup SQLite

### Création

Fonction :

- [createDatabaseBackup()](/home/naim/labcare-cssb/lib/database-backups.ts)

Mécanisme :

1. crée `backups/database`
2. ouvre la base en lecture seule
3. utilise `better-sqlite3` + `backup()`
4. retourne les métadonnées du fichier

### Validation

Fonctions :

1. [validateDatabaseBackupFile()](/home/naim/labcare-cssb/lib/database-backups.ts)
2. [validateActiveDatabase()](/home/naim/labcare-cssb/lib/database-backups.ts)

Mécanisme :

1. ouverture SQLite en readonly
2. exécution de `PRAGMA integrity_check`
3. retour :
   - `valid`
   - `issues`

### Restauration

Route :

- [backup restore route](/home/naim/labcare-cssb/app/api/database/backups/[fileName]/restore/route.ts)

Flux :

1. créer un backup de sécurité `pre-restore-safety-*`
2. `prisma.$disconnect()`
3. restaurer la base choisie
4. valider la base active restaurée
5. créer un audit log
6. renvoyer :
   - `restoredFrom`
   - `safetyBackup`
   - `validation`

## 5. Recovery bundle

### Création

Fonction :

- [createRecoveryBundle()](/home/naim/labcare-cssb/lib/recovery-bundles.ts)

Contenu du bundle :

1. `data/database.sqlite`
2. `app-files/uploads`
3. `manifest.json`
4. `RESTORE.txt`
5. éventuellement `docker-compose.yml`
6. éventuellement `schema.prisma`

### Validation

Fonction :

- [validateRecoveryBundleFile()](/home/naim/labcare-cssb/lib/recovery-bundles.ts)

Mécanisme :

1. lecture de l’archive via `tar -tzf`
2. vérification des entrées obligatoires
3. retour :
   - `valid`
   - `issues`
   - `entries`

### Import

Route :

- [recovery import route](/home/naim/labcare-cssb/app/api/database/recovery-bundles/import/route.ts)

Flux :

1. accepte uniquement `.tar.gz`
2. nettoie le nom
3. évite les collisions
4. écrit le fichier
5. valide l’archive
6. applique la rétention
7. journalise l’audit

### Restauration

Route :

- [recovery restore route](/home/naim/labcare-cssb/app/api/database/recovery-bundles/[fileName]/restore/route.ts)

Flux :

1. créer un bundle de sécurité
2. `prisma.$disconnect()`
3. extraire l’archive
4. restaurer `data/database.sqlite`
5. restaurer `app-files/uploads` si présent
6. valider la base active
7. journaliser l’audit
8. renvoyer :
   - `restoredFrom`
   - `restoredUploads`
   - `safetyBundle`
   - `validation`

## 6. Rétention

### Settings

1. `database_backup_retention_count`
2. `database_recovery_retention_count`

Déclarés dans :

- [settings-schema.ts](/home/naim/labcare-cssb/lib/settings-schema.ts)

Validés dans :

- [settings route](/home/naim/labcare-cssb/app/api/settings/route.ts)

### Fonctions

1. [pruneDatabaseBackups()](/home/naim/labcare-cssb/lib/database-backups.ts)
2. [pruneRecoveryBundles()](/home/naim/labcare-cssb/lib/recovery-bundles.ts)

### Comportement actuel

1. trie du plus récent au plus ancien
2. garde les `N` premiers
3. supprime les suivants
4. si `N <= 0`, pas de suppression effective

## 7. Test sans restauration

Ajout Lot 3 :

### Backups

Route :

- [backup validate route](/home/naim/labcare-cssb/app/api/database/backups/[fileName]/validate/route.ts)

Action audit :

- `database.backup_test`

### Bundles

Route :

- [recovery validate route](/home/naim/labcare-cssb/app/api/database/recovery-bundles/[fileName]/validate/route.ts)

Action audit :

- `database.recovery_bundle_test`

## 8. Santé système

Route :

- [health route](/home/naim/labcare-cssb/app/api/database/health/route.ts)

Retourne :

1. état base
2. état backups
3. état bundles
4. validation du dernier backup
5. validation du dernier bundle
6. espace libre
7. cible externe
8. maintenance
9. logs critiques
10. dernier test backup
11. dernier test bundle

## 9. Copie externe

Logique :

- [backup-sync.ts](/home/naim/labcare-cssb/lib/backup-sync.ts)

Le système :

1. crée `database/` et `recovery/` dans la cible
2. copie le dernier backup
3. copie le dernier bundle
4. écrit `latest-sync.json`

Ce n’est pas encore :

1. du cloud natif
2. du chiffrement natif
3. de la réplication distribuée

## 10. Script planifié

Script :

- [run-scheduled-backups.ts](/home/naim/labcare-cssb/scripts/run-scheduled-backups.ts)

Fait :

1. backup SQLite
2. bundle de reprise
3. prune backups
4. prune bundles
5. sync externe éventuelle

## 11. UI actuelle

### Vue générale

- [database overview page](/home/naim/labcare-cssb/app/(app)/dashboard/settings/database/page.tsx)

Rôle :

1. orienter l’utilisateur
2. éviter une grosse page monolithique

### Sauvegardes

- [database backups page](/home/naim/labcare-cssb/app/(app)/dashboard/settings/database/backups/page.tsx)

Rôle :

1. actions fréquentes
2. imports
3. tests
4. restaurations
5. résumé de dernière restauration

### Supervision

- [database supervision page](/home/naim/labcare-cssb/app/(app)/dashboard/settings/database/supervision/page.tsx)

Rôle :

1. santé
2. rétention
3. maintenance
4. cible externe
5. audit
6. guide

## 12. Limites actuelles

1. pas de vraie restauration automatisée sur sandbox de test
2. pas de chiffrement des backups
3. pas de checksum signé
4. pas de test automatique d’une vraie reprise complète sur machine propre
5. la “preuve” reste bonne pour petit labo, pas niveau infra enterprise

## 13. Quand modifier cette feature

Touchez cette feature si vous changez :

1. le chemin de la base active
2. la structure des bundles
3. les règles de rétention
4. la stratégie de copie externe
5. les états santé
6. le flux UI base de données

## 14. Règle de maintenance

Quand vous ajoutez une amélioration à cette feature :

1. mettez à jour `USER.md` si le comportement utilisateur change
2. mettez à jour `DEV.md` si l’architecture ou le flux technique change
3. gardez la différence claire entre :
   - backup SQLite
   - recovery bundle
   - export complet JSON
