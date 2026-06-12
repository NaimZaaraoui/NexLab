# Runbook — Plan de Reprise d'Activité (PRA / DRP)

Ce document opérationnel (Disaster Recovery Plan) guide l'équipe face à une panne cataclysmique (corruption de base de données, perte de serveur) pour restaurer NexLab.

## Objectifs (SLA Internes)
- **RTO (Recovery Time Objective)** : **< 1 heure**. Temps maximum acceptable pour remettre le laboratoire en état de marche.
- **RPO (Recovery Point Objective)** : **< 24 heures**. (ou < 1 heure via backups fréquents). Perte de données acceptable maximale.

## Stratégie de Backup
Les données résident sur une base SQLite / LibSQL gérée via Prisma.
Le script automatisé `scripts/run-scheduled-backups.ts` prend en charge la sauvegarde.
- **Quotidien** : Création d'un bundle d'archive complet via `scripts/create-recovery-bundle.ts`. Archive chiffrée stockée en externe ou sur un disque distant.
- **Continuité** : Utilisation du mode WAL (Write-Ahead Logging) pour récupérer les coupures de courant locales sans corruption de DB.

---

## Procédure Catastrophe (Severity 1)

### Scénario A : Le disque local ou la VM a crashé (Données locales perdues)
1. **Provisionner l'App Server** :
   ```bash
   git clone https://github.com/naim/labcare-cssb
   cd labcare-cssb
   npm ci
   ```
2. **Récupérer l'archive de Backup**
   Télécharger le dernier fichier ZIP généré par `create-recovery-bundle.ts` depuis le stockage froid (S3/Drive distant).
3. **Restaurer la Base**
   - Remplacer le fichier `sqlite.db` par celui contenu dans l'archive.
   - Pousser le changement aux schémas : `npx prisma db push` (Si modifications de volume).
   - Rétablir le fichier `.env` contenant le `AUTH_SECRET`.
4. **Relancer le système**
   ```bash
   npm run build
   npm run start
   ```

### Scénario B : Corruption ou Mise à jour (Migration) désastreuse
*Symptôme : Les données sont physiquement là mais l'application refuse d'écrire/crash "Database Error".*
1. Couper le service (`pm2 stop nexlab` ou container stop).
2. Lancer le script de **migration safety** (Priority 1.4) :
   ```bash
   npm run prisma:rollback
   ```
3. Si la base est corrompue (SQLite Header Error) :
   * Ne **PAS** utiliser un utilitaire de réparation qui ne connait pas l'ORM. Écrasez `sqlite.db` par la copie `sqlite.db.backup` prise automatiquement "pre-migration" par notre script existant.

### Scénario C : Falsification / Intrusion détectée
1. Isoler le serveur d'internet.
2. Analyser les archives d'audit de la table `audit_logs`.
3. Invalider tous les accès applicatifs :
   Changer impérativement le `AUTH_SECRET` dans `.env` et redémarrer, forçant ainsi tout le monde à se reconnecter instantanément. (Session Cookie Invalidation).


# NexLab LIMS — Emergency Recovery Procedures for Encrypted Backups

> **Status**: Production-Ready (v1.0)  
> **Last Updated**: June 2026  
> **Audience**: System Administrators, IT Support, Lab Directors  
> **Urgency**: Use this guide ONLY in emergency situations

---

## Quick Reference: Emergency Contacts & Actions

| Situation | Action | Contact |
|-----------|--------|---------|
| Database corrupted, backup available | [Restore from Backup](#restore-from-encrypted-backup) | IT Admin |
| Encryption key lost | [Recover Key](#if-encryption-key-is-lost) | IT Manager, Vault Admin |
| All backups lost | [Rebuild from Latest](#if-all-backups-are-lost) | IT Director, Compliance |
| Lab can't operate (> 30 min) | [Escalate to Vendor](#contact-vendor-support) | support@nexlab.io |

---

## Scenario 1: Database Corrupted (Backup Available)

**Symptoms**:
- "Database corrupt" error in logs
- Application won't start
- Health check shows `integrity.ok: false`
- Users can't log in

**Recovery Time**: 5-15 minutes

### Step-by-Step Recovery

```bash
# 1. Stop the application immediately
docker compose down
# or: systemctl stop nexlab

# 2. Verify backup exists and is valid
ls -lh backups/recovery/recovery-bundle-*.tar.gz.enc
# Should see recent backup file (within last 24 hours)

# 3. Verify encryption key is available
echo $DATABASE_ENCRYPTION_KEY | wc -c
# Should output: 65 (64 chars + newline)

# 4. CRITICAL: Do NOT delete database file yet!
# Keep original for forensics
cp -r data data.backup-corrupted-$(date +%Y%m%d-%H%M%S)

# 5. Remove corrupted database
rm data/nexlab.db*
# Keep the backup copy you just created

# 6. Restore from encrypted backup
npm run backup:restore
# or manually:
curl -X POST \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bundlePath":"backups/recovery/recovery-bundle-LATEST.tar.gz.enc"}' \
  http://localhost:3000/api/database/recovery-bundles/restore

# 7. Restart application
docker compose up -d
# or: systemctl start nexlab

# 8. Verify recovery
docker compose logs nexlab | tail -20
# Look for: "Database integrity check: OK"

# 9. Check data integrity
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/database/health | jq '.integrity'
# Expected: { "ok": true, "details": "ok" }

# 10. Spot-check data
# - Log in with test account
# - View recent patient records
# - Verify no data loss
# - Check last entry time matches backup time

# 11. Notify users
echo "✅ Database recovered from backup at $(date)"
```

**If Restoration Fails**:
```bash
# 1. Check error message
docker compose logs nexlab | grep -i "restore\|decrypt\|error"

# 2. If encryption key is wrong:
# Retrieve correct key from vault
# Update .env with correct key
# Retry restoration

# 3. If backup file is corrupted:
# Try previous backup
ls -lh backups/recovery/ | head -20
# Use second-most recent backup:
curl -X POST ... -d '{"bundlePath":"recovery-bundle-PREVIOUS.tar.gz.enc"}'

# 4. If no valid backup exists:
# Go to: Scenario 4 (If All Backups Are Lost)
```

---

## Scenario 2: Application Won't Start (Decryption Error)

**Symptoms**:
- "Cannot decrypt database" error
- "Invalid encryption key" message
- Application crashes on startup
- Health check returns 500 error

**Recovery Time**: 5-10 minutes

### Step-by-Step Recovery

```bash
# 1. Check what error message is shown
docker compose logs nexlab | tail -30
# Look for: "encryption", "decrypt", "key"

# 2. Verify encryption key environment variable
echo $DATABASE_ENCRYPTION_KEY
# If empty, key is missing from environment

# 3. Check .env file exists and has correct key
grep DATABASE_ENCRYPTION_KEY .env
# Format should be: DATABASE_ENCRYPTION_KEY=<64 hex chars>

# 4. If key is missing or wrong:
# Retrieve from secure vault/storage
# Temporarily set in shell:
export DATABASE_ENCRYPTION_KEY="<correct-64-char-key-from-vault>"

# 5. Verify key format
echo $DATABASE_ENCRYPTION_KEY | wc -c
# Should output: 65 (64 chars + newline)

# 6. Update .env with correct key
# SECURITY: Be very careful with this step
nano .env
# Find line: DATABASE_ENCRYPTION_KEY=...
# Replace with correct value from vault
# Save file with: Ctrl+X, Y, Enter

# 7. Restart application
docker compose restart nexlab
# or: npm run dev

# 8. Monitor logs
docker compose logs -f nexlab | grep -i "encryption\|integrity\|database"
# Should see: "Database encryption: ENABLED"

# 9. Test connectivity
sleep 5
curl http://localhost:3000/api/database/health
# Expected: HTTP 200 with health data

# If still failing:
# → Go to Scenario 3 (Key is Truly Lost)
```

---

## Scenario 3: If Encryption Key Is Lost

**Symptoms**:
- Can't recover old encryption key
- Database is encrypted but key is unavailable
- Vault system is offline/corrupted

**Recovery Time**: 30 minutes to 2 hours (depends on backup location)

### This Is Critical: Data May Be Unrecoverable

⚠️ **WARNING**: If you have no backup and have lost the encryption key, the database is **permanently inaccessible**. You cannot recover it. This is by design — encryption is irreversible without the key.

### Recovery Strategy

#### Option 1: Restore from Offsite Backup (Recommended)

If you have an offsite backup with a DIFFERENT encryption key:

```bash
# 1. Retrieve old encryption key from offsite vault
# (Should be stored separately from on-site backups)
OLD_KEY=$(vault kv get -field=database_encryption_key secret/nexlab/backup-location-2)
export DATABASE_ENCRYPTION_KEY=$OLD_KEY

# 2. Locate offsite backup
ls /mnt/offsite-backup/recovery-bundles/ | sort -r | head -3
# Find most recent: recovery-bundle-2026-06-03-XXXX.tar.gz.enc

# 3. Copy to local backup location
cp /mnt/offsite-backup/recovery-bundles/recovery-bundle-LATEST.tar.gz.enc \
   backups/recovery/recovery-bundle-restored-$(date +%Y%m%d).tar.gz.enc

# 4. Update .env with old key
sed -i "s/DATABASE_ENCRYPTION_KEY=.*/DATABASE_ENCRYPTION_KEY=$OLD_KEY/" .env

# 5. Restore from backup
docker compose down
rm -rf data/nexlab.db*
docker compose up -d

# Wait for startup
sleep 10

# 6. Verify restoration
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/database/health | jq '.integrity'

# 7. IMMEDIATELY create new key and rotate
# (Don't want to lose data again with single key)
NEW_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# Store securely, then rotate: docs/KEY_ROTATION_PROCEDURES.md
```

#### Option 2: Restore From Any Backup With Original Key

```bash
# 1. You must retrieve original encryption key from:
#    - IT Manager / System Admin
#    - Key management system (Vault, Secrets Manager, etc.)
#    - Secure backup location
#    - Insurance/legal documentation

# 2. Set the correct key
export DATABASE_ENCRYPTION_KEY="<original-64-char-key>"

# 3. Find oldest valid backup
ls -lhrt backups/recovery/ | tail -5

# 4. Restore from backup
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bundlePath":"recovery-bundle-OLDEST.tar.gz.enc"}' \
  http://localhost:3000/api/database/recovery-bundles/restore

# 5. Verify data integrity
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/database/health | jq '.integrity'

# 6. Check data loss scope
# How old is the restored backup?
# What data is missing since then?
```

#### Option 3: If NO Encryption Key Can Be Found

**Data is permanently lost.** This is a worst-case scenario.

**Actions**:

```bash
# 1. Declare data loss incident
# Document:
#   - Date/time key was discovered lost
#   - How loss occurred
#   - Who knew about the key
#   - When it was last used

# 2. Contact IT Director and Compliance Officer
# This is a DATA BREACH and must be reported

# 3. Contact vendor support
# support@nexlab.io
# Provide:
#   - Database file (anonymized if needed)
#   - Error messages
#   - Backup file (if available)
#   - Key rotation history

# 4. Notify affected parties (if required by law)
# - Patients may need to be notified of data loss
# - Regulatory authorities may require reporting
# - Insurance should be notified

# 5. Start fresh
# Create new database with strong encryption:
rm -rf data/
docker compose down
# Set strong new key:
export DATABASE_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# Store this key in MULTIPLE secure locations
docker compose up -d

# 6. Restore available data
# If you have CSV exports, archives, or paper records:
# Re-import patient data from alternative sources
# Reconstruct what you can
```

---

## Scenario 4: If All Backups Are Lost

**Symptoms**:
- Database corrupted and no backups exist
- Backup directory deleted or unavailable
- All backup devices failed
- No recovery bundles anywhere

**Recovery Time**: Not possible (Unrecoverable)

### Prevention Is The Only Option

This is **unrecoverable** if:
- Database is encrypted
- Encryption key is available (but database is corrupted)
- No backups exist

**Only solution**: Delete corrupted database and start fresh

```bash
# 1. Accept data loss
# There is no recovery from this situation

# 2. Start with fresh database
docker compose down
rm -rf data/nexlab.db*

# 3. Create new system with encryption
export DATABASE_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
docker compose up -d

# 4. Store key in MULTIPLE locations immediately
# Don't let this happen again

# 5. Re-import data
# From paper records, patient files, or external systems

# 6. Implement backup procedure
# Daily backups with off-site replication
# See: docs/ENCRYPTION_AT_REST_GUIDE.md#backup-encryption
```

---

## Scenario 5: Backup File Is Corrupted (But Database Is OK)

**Symptoms**:
- Backup validation fails: "invalid file format"
- Can't decrypt backup with correct key
- Backup file size is wrong (too small)

**Recovery Time**: 5 minutes

### Check Backup Integrity

```bash
# 1. List backup files
ls -lh backups/recovery/
# Check file size (must be > 1MB for typical lab)
# If < 100KB, likely corrupted

# 2. Check file magic bytes (should start with encryption header)
file backups/recovery/recovery-bundle-*.tar.gz.enc
# Should show: "data"

# 3. Validate backup
curl -H "Authorization: Bearer TOKEN" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"bundlePath":"recovery-bundle-CORRUPTED.tar.gz.enc"}' \
  http://localhost:3000/api/database/recovery-bundles/validate

# 4. Check error message
docker compose logs nexlab | grep -i "corrupt\|invalid\|format"

# 5. Try previous backup
ls -lhrt backups/recovery/ | tail -10
# Use second-most recent backup

# 6. If all backups corrupted
# Database is still intact (unencrypted copy on disk)
# Create new backup:
npm run backup:bundle

# 7. Verify new backup works
curl -H "Authorization: Bearer TOKEN" \
  -X POST \
  -d '{"bundlePath":"recovery-bundle-LATEST.tar.gz.enc"}' \
  http://localhost:3000/api/database/recovery-bundles/restore-test
```

---

## Scenario 6: Emergency System Replacement

**Situation**: Current server failed completely, need to migrate to new hardware

**Recovery Time**: 15-30 minutes

### Migration Procedure

```bash
# ON OLD SYSTEM:
# 1. Create backup bundle
npm run backup:bundle
# Output: backups/recovery/recovery-bundle-TIMESTAMP.tar.gz.enc

# 2. Verify backup is valid
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/database/health | jq '.backups.latestValidation'
# Expected: { "valid": true, "encrypted": true }

# 3. Copy to external drive/cloud
cp backups/recovery/recovery-bundle-LATEST.tar.gz.enc /external-drive/
cp .env /external-drive/  # SECURITY: Protect encryption keys!
chmod 600 /external-drive/.env

# ON NEW SYSTEM:
# 4. Install NexLab
docker compose up -d
# Wait for initialization

# 5. Copy backup and .env
cp /external-drive/.env ./
cp /external-drive/recovery-bundle-*.tar.gz.enc backups/recovery/

# 6. Update .env if needed
# Verify DATABASE_ENCRYPTION_KEY and BACKUP_ENCRYPTION_KEY are present
grep "ENCRYPTION_KEY" .env

# 7. Stop application and restore
docker compose down
rm -rf data/nexlab.db*
docker compose up -d

# Wait for startup
sleep 10

# 8. Verify restoration
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/database/health | jq '.database'

# 9. Test data integrity
# - Log in with known credentials
# - Verify patient records
# - Check last analysis entered

echo "✅ Migration complete"
```

---

## Contact Vendor Support

If you cannot recover using these procedures:

### When to Contact Support

- Unable to decrypt database after following all recovery procedures
- Encrypted backup won't restore despite correct key
- Performance is extremely slow after recovery
- Data appears corrupted after restoration

### Information to Provide

```bash
# Prepare this information before contacting support:

# 1. Error logs
docker compose logs nexlab > /tmp/nexlab-error.log
# Attach: /tmp/nexlab-error.log

# 2. Database file info
file data/nexlab.db
ls -lh data/nexlab.db

# 3. Backup file info
ls -lh backups/recovery/ | head -5

# 4. Environment check (hide keys!)
echo "DATABASE_ENCRYPTION_KEY length: $(echo $DATABASE_ENCRYPTION_KEY | wc -c)"
echo "BACKUP_ENCRYPTION_KEY configured: $([ -n "$BACKUP_ENCRYPTION_KEY" ] && echo yes || echo no)"

# 5. Approximate data loss
# If recovering from backup:
# "Latest backup is from 2026-06-01, current date is 2026-06-04"
# "Lost approximately 3 days of data"

# 6. Timeline
# "Key lost on: 2026-06-04 at 14:30 UTC"
# "Discovered at: 2026-06-04 at 18:00 UTC"
# "Recovery attempt started at: 2026-06-04 at 20:00 UTC"
```

### Contact Information

- **Email**: support@nexlab.io
- **Phone**: +1-555-NEXLAB-1 (24/7 emergency line)
- **Portal**: https://support.nexlab.io (create support ticket)

---

## Post-Recovery Checklist

After successfully recovering:

- [ ] Verify all patient data is intact
- [ ] Verify audit trail is complete
- [ ] Check for data loss (date range affected)
- [ ] Create new encrypted backup immediately
- [ ] Store backup in 2+ secure locations
- [ ] Update encryption key (if compromised)
- [ ] Test restoration procedure
- [ ] Document what happened
- [ ] Update disaster recovery plan
- [ ] Brief IT team on lessons learned
- [ ] Update insurance/compliance records
- [ ] Increase backup frequency (if data loss was significant)

---

## Lessons Learned

For future prevention:

1. **Automate Backups**: Never rely on manual backups
2. **Test Backups**: Restore test monthly
3. **Store Keys Securely**: Multiple locations, encrypted
4. **Document Procedures**: Keep runbook updated
5. **Monitor Health**: Set up alerts for backup failures
6. **Off-Site Storage**: Separate key from backup location
7. **Staff Training**: All IT staff must know recovery procedures

---

## Support & References

- **Encryption Guide**: docs/ENCRYPTION_AT_REST_GUIDE.md
- **Key Rotation**: docs/KEY_ROTATION_PROCEDURES.md
- **Backup Strategy**: docs/DISASTER_RECOVERY_RUNBOOK.md
- **Support**: support@nexlab.io

---

**Last Updated**: June 2026 | **Version**: 1.0 | **Status**: Production Ready 🔐

**Remember**: The best disaster recovery is one you never need to use. Maintain regular backups, test restoration quarterly, and keep encryption keys secure.


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


# Sauvegardes et reprise

Ce document explique, côté utilisateur, comment fonctionne la sauvegarde dans NexLab et comment l’utiliser sans entrer dans les détails techniques internes.

## 1. À quoi sert cette fonction

La fonction de sauvegarde sert à protéger le laboratoire contre :

1. une erreur humaine
2. une base corrompue
3. une panne du poste principal
4. une restauration après incident

## 2. Les 3 types de fichiers

### 1. Sauvegarde SQLite

C’est une copie de la base de données.

Elle sert à :

1. restaurer rapidement les données du LIMS
2. revenir à un état précédent

### 2. Bundle de reprise

C’est une archive plus complète.

Elle contient :

1. la base
2. les uploads utiles
3. des fichiers d’aide à la reprise

Elle sert à :

1. reprendre NexLab sur une autre machine
2. restaurer plus complètement qu’une simple sauvegarde SQLite

### 3. Export complet

C’est un export métier en JSON.

Il sert surtout à :

1. audit
2. extraction
3. archivage métier

Il ne remplace pas une vraie restauration technique.

## 3. Où aller dans l’application

Dans NexLab :

1. `Paramètres`
2. `Base de données`
3. puis :
   - `Sauvegardes`
   - ou `Supervision`

## 4. Page Sauvegardes

La page `Sauvegardes` sert à agir directement.

On peut :

1. créer une sauvegarde
2. créer un bundle de reprise
3. tester un fichier sans restaurer
4. télécharger un fichier
5. restaurer un fichier
6. importer une sauvegarde `.sqlite`
7. importer un bundle `.tar.gz`

## 5. Créer une sauvegarde

Utilisez :

- `Créer une sauvegarde`

À faire :

1. avant une maintenance importante
2. avant une mise à jour
3. avant une restauration
4. avant un import massif

## 6. Créer un bundle de reprise

Utilisez :

- `Créer un bundle de reprise`

À faire :

1. régulièrement
2. avant migration de machine
3. avant intervention technique importante

Le bundle est particulièrement utile si le poste principal tombe en panne.

## 7. Tester un backup ou un bundle

Utilisez :

- `Tester`

Cette action :

1. ne restaure rien
2. ne modifie pas la base active
3. vérifie seulement que le fichier est valide

C’est une très bonne habitude avant de compter sur un fichier de secours.

## 8. Restaurer un backup

Utilisez :

- `Restaurer`

Quand vous restaurez :

1. la base active est remplacée
2. NexLab crée d’abord un fichier de sécurité
3. NexLab exécute ensuite une validation automatique

Après restauration, l’application affiche un résumé de l’opération.

## 9. Restaurer un bundle de reprise

Utilisez :

- `Restaurer`

sur la ligne d’un bundle.

Quand vous restaurez un bundle :

1. la base active est remplacée
2. les uploads peuvent aussi être restaurés
3. un bundle de sécurité est créé avant écrasement
4. une validation est exécutée après restauration

## 10. Importer des fichiers externes

### Sauvegarde SQLite

Formats acceptés :

- `.sqlite`

### Bundle de reprise

Formats acceptés :

- `.tar.gz`

Les fichiers importés sont testés avant d’être acceptés.

## 11. Page Supervision

La page `Supervision` sert à surveiller et configurer.

On y trouve :

1. l’état de santé du système
2. la politique de rétention
3. la cible externe
4. le mode maintenance
5. l’historique des actions
6. la checklist opérateur

## 12. Bonnes pratiques

Pour un petit labo, je recommande :

1. créer une sauvegarde avant toute opération sensible
2. créer aussi des bundles de reprise
3. tester régulièrement un backup ou un bundle
4. garder une copie externe
5. vérifier la page `Supervision`

## 13. Ce qu’il faut retenir

La logique simple est :

1. `backup SQLite` = restauration rapide de la base
2. `bundle de reprise` = reprise plus complète
3. `test` = vérifier sans restaurer
4. `supervision` = surveiller la protection du labo
