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
