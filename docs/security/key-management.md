# NexLab LIMS — Key Rotation Procedures

> **Status**: Production-Ready (v1.0)  
> **Last Updated**: June 2026  
> **Audience**: System Administrators, IT Security, Lab Directors

---

## Table of Contents

1. [Overview](#overview)
2. [When to Rotate Keys](#when-to-rotate-keys)
3. [Pre-Rotation Checklist](#pre-rotation-checklist)
4. [Step-by-Step Rotation Procedure](#step-by-step-rotation-procedure)
5. [Verification & Testing](#verification--testing)
6. [Emergency Key Recovery](#emergency-key-recovery)
7. [Documentation & Compliance](#documentation--compliance)

---

## Overview

Key rotation is the process of replacing old encryption keys with new ones. It's a critical security practice to:

- Limit exposure window if key is compromised
- Meet compliance requirements (annual rotation)
- Respond to staff changes
- Proactively manage key lifecycle

### NexLab Key Types

| Key | Purpose | Rotation Frequency | Impact |
|-----|---------|-------------------|--------|
| `DATABASE_ENCRYPTION_KEY` | Encrypts SQLite database | Annually (minimum) | Requires database re-encryption |
| `BACKUP_ENCRYPTION_KEY` | Encrypts backup files | Annually (minimum) | Creates new encrypted backups |
| `AUTH_SECRET` | NextAuth sessions | When compromised | Active sessions invalidate |

---

## When to Rotate Keys

### Scheduled Rotation (Recommended)
- **Annual rotation**: Every 12 months as part of IT security policy
- **Calendar**: Plan for Q1 or Q4 (low lab activity periods)
- **Notice**: Announce 2 weeks in advance, minimal downtime

### Incident-Based Rotation (Immediate)
- Employee departure with key access
- Key compromise suspected (leaked, exposed in logs, etc.)
- Integration with third-party system that had key access
- Compliance audit findings
- Security breach or data exposure

### Opportunistic Rotation
- During planned maintenance windows
- After major software updates
- When adding new backup locations

---

## Pre-Rotation Checklist

Before starting rotation, ensure:

**System Status**
- [ ] Application is stable and running
- [ ] No users currently working with sensitive operations
- [ ] Schedule rotation during low-traffic hours (e.g., 2 AM)
- [ ] Lab operations won't be affected by downtime

**Backups & Recovery**
- [ ] Latest backup is available and tested
- [ ] Recovery bundle exists and validates successfully
- [ ] Offsite backup is current
- [ ] Backup encryption key is securely stored (separate from database key)

**Key Management**
- [ ] New encryption keys generated and stored securely
- [ ] Old keys documented with rotation date
- [ ] Key custodian notified (IT Manager, Lab Director, etc.)
- [ ] Key recovery procedures reviewed

**Documentation**
- [ ] Key rotation log template prepared
- [ ] Staff notifications drafted
- [ ] Runbook reviewed with IT team
- [ ] Rollback procedure understood

---

## Step-by-Step Rotation Procedure

### Phase 1: Pre-Rotation (30 minutes before start)

```bash
# 1. Generate new encryption keys
# Store in secure location (NOT in terminal history!)

# Generate DATABASE_ENCRYPTION_KEY
NEW_DB_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "NEW_DB_KEY=$NEW_DB_KEY"
# Save this securely: pass to IT Manager, vault system, etc.

# Generate BACKUP_ENCRYPTION_KEY
NEW_BACKUP_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "NEW_BACKUP_KEY=$NEW_BACKUP_KEY"
# Save this securely: DIFFERENT from database key!

# 2. Document current keys (for recovery if needed)
echo "OLD_DB_KEY=$(grep DATABASE_ENCRYPTION_KEY .env | cut -d= -f2)" > /secure/location/rotation-$(date +%Y%m%d).log
echo "OLD_BACKUP_KEY=$(grep BACKUP_ENCRYPTION_KEY .env | cut -d= -f2)" >> /secure/location/rotation-$(date +%Y%m%d).log
chmod 600 /secure/location/rotation-$(date +%Y%m%d).log

# 3. Notify team
echo "Key rotation starting at $(date). Lab will be offline for ~5 minutes."
# Send message to lab staff, update status page if applicable

# 4. Create backup with current keys
npm run backup:bundle
# Output: Created recovery-bundle-TIMESTAMP.tar.gz.enc
```

### Phase 2: Database Re-encryption (5-10 minutes downtime)

```bash
# 1. Stop the application
docker compose down
# or: npm stop

# 2. Backup database file (just in case)
cp data/nexlab.db data/nexlab.db.backup-before-rotation-$(date +%Y%m%d-%H%M%S)

# 3. Update .env with new DATABASE_ENCRYPTION_KEY
# CRITICAL: Only update DATABASE_ENCRYPTION_KEY now
# Backup encryption will be updated after backup verification

# Option A: Using sed (for automation)
sed -i "s/DATABASE_ENCRYPTION_KEY=.*/DATABASE_ENCRYPTION_KEY=$NEW_DB_KEY/" .env

# Option B: Manual edit
nano .env
# Find: DATABASE_ENCRYPTION_KEY=<old-key>
# Replace: DATABASE_ENCRYPTION_KEY=<new-key>
# Save: Ctrl+X, Y, Enter

# 4. Verify .env is updated
grep DATABASE_ENCRYPTION_KEY .env
# Expected: DATABASE_ENCRYPTION_KEY=<new-64-char-key>

# 5. Run database encryption migration
# This decrypts with old key, re-encrypts with new key
export DATABASE_ENCRYPTION_KEY=$NEW_DB_KEY
npm run db:encrypt

# Expected output:
# ✅ SUCCÈS: La base de données a été chiffrée avec succès.
#    L'ancienne base en clair a été sauvegardée sous: dev.backup-TIMESTAMP.db

# Check that backup was created
ls -lh data/dev.backup-*.db
# Should see old database backup

# 6. Restart application with new database key
npm run dev
# or: docker compose up -d

# Wait for startup (watch logs for: "✅ Database encryption: ENABLED")
sleep 10
npm run health-check || docker compose logs nexlab | grep -i encryption
```

### Phase 3: Verify Database Encryption (5 minutes)

```bash
# 1. Health check endpoint
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/database/health | jq '.database.encryptionKey'

# Expected:
# {
#   "configured": true,
#   "keyLength": 64
# }

# 2. Run test suite to verify database integrity
npm run test
# All tests should pass

# 3. Spot-check some data
# - Query some patients from UI
# - View some analyses
# - Print a report
# Verify nothing is corrupted

# 4. Check application logs for errors
docker compose logs nexlab | tail -20
# Should NOT see decryption errors or "corrupted database"
```

### Phase 4: Backup Encryption Update (5 minutes)

```bash
# 1. Update BACKUP_ENCRYPTION_KEY in .env
# Now that database is verified, rotate backup key

# Option A: Using sed
sed -i "s/BACKUP_ENCRYPTION_KEY=.*/BACKUP_ENCRYPTION_KEY=$NEW_BACKUP_KEY/" .env

# Option B: Manual edit
nano .env
# Find: BACKUP_ENCRYPTION_KEY=<old-key>
# Replace: BACKUP_ENCRYPTION_KEY=<new-key>

# 2. Create backup with new encryption key
# This verifies the new backup key works
npm run backup:bundle

# Expected output:
# Backup created: backups/recovery/recovery-bundle-TIMESTAMP.tar.gz.enc

# 3. Verify backup encryption
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:3000/api/database/backups | jq '.[] | {fileName, encrypted}'

# Expected: latest backup should have "encrypted": true

# 4. Test restoration from new encrypted backup (CRITICAL!)
# This ensures we can recover with new key if disaster happens
npm run test:restore
# or use API:
curl -X POST \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"backupPath":"backups/recovery/recovery-bundle-TIMESTAMP.tar.gz.enc"}' \
  http://localhost:3000/api/database/recovery-bundles/restore-test

# Expected: { "valid": true, "issues": [] }
```

### Phase 5: Cleanup & Verification (10 minutes)

```bash
# 1. Clean up old database backup (after verification period)
# Keep for 24 hours in case rollback needed, then delete
ls -lh data/dev.backup-*.db
# rm data/dev.backup-2026-06-04-120000.db  # Delete after 24h

# 2. Archive old encryption keys (for 7-year retention)
# Store in secure location, encrypted
tar czf /secure/nexlab-rotation-2026-06-04.tar.gz \
  /secure/location/rotation-2026-06-04.log \
  backups/recovery/recovery-bundle-2026-06-04-*.tar.gz.enc

# Securely delete old keys from memory
unset NEW_DB_KEY NEW_BACKUP_KEY

# 3. Verify files permissions
chmod 600 .env
chmod 700 data/ backups/
ls -la .env data/ backups/

# 4. Verify audit trail shows rotation
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  'http://localhost:3000/api/audit?action=encryption_key_rotation' | jq '.[]'

# 5. Clear server logs of new keys
# These should NOT appear in logs, but verify:
grep -r "$NEW_DB_KEY" /var/log/ || echo "✅ Keys not in logs"
docker compose logs nexlab | grep -i "encryption_key\|DATABASE_KEY" | head
# Should only show general encryption status, not actual key values

# 6. Notify team
echo "✅ Key rotation completed successfully at $(date)"
# Send notification: Lab is back online, all systems verified
```

---

## Verification & Testing

### Mandatory Verification Steps

After rotation, **ALL** of these must pass:

```bash
# 1. Application starts and responds
curl http://localhost:3000/health
# Expected: HTTP 200

# 2. Database encryption is configured
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/database/health | \
  jq '.database.encryptionKey.configured'
# Expected: true

# 3. Database integrity is intact
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/database/health | \
  jq '.integrity.ok'
# Expected: true

# 4. Can read patient data
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/patients?limit=1
# Expected: 200 with patient data

# 5. Can create new analysis
# (Test through UI or API)
# Expected: New analysis saves correctly with new database key

# 6. Backup encryption works
npm run backup:bundle
ls -lh backups/recovery/recovery-bundle-*.tar.gz.enc
# Expected: *.tar.gz.enc file (encrypted, not plain)

# 7. Backup restoration works
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"backupPath":"latest"}' \
  http://localhost:3000/api/database/recovery-bundles/restore-test
# Expected: { "valid": true }

# 8. Audit trail shows encryption events
curl -H "Authorization: Bearer TOKEN" \
  'http://localhost:3000/api/audit?action=database.backup_created&limit=5' | \
  jq '.[] | {action, timestamp}'
# Expected: Recent backup creation events

# 9. No errors in logs
docker compose logs nexlab | grep -i "error\|failed\|decrypt" | grep -v "ERROR_BOUNDARY"
# Expected: No encryption-related errors

# 10. Full test suite passes
npm run test
npm run test:e2e
# Expected: All tests pass
```

### Post-Rotation Monitoring (First 24 Hours)

Monitor these metrics after rotation:

```bash
# Every 4 hours, check:

# Health endpoint
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/database/health | jq '{
    encryption: .database.encryptionKey,
    integrity: .integrity,
    backups: .backups.encryptionConfigured
  }'

# Application performance
# - Response times should be normal (< 200ms)
# - No CPU spikes
# - Memory usage stable
# - Disk space stable

# Error logs
docker compose logs nexlab --since 1h | grep -i error | wc -l
# Expected: No encryption-related errors
```

---

## Emergency Key Recovery

### If Rotation Fails Partway

**Scenario**: Database re-encryption started but failed

**Recovery**:
```bash
# 1. Stop application
docker compose down

# 2. Restore database from backup
cp data/dev.backup-before-rotation-*.db data/nexlab.db

# 3. Revert .env to old keys
git checkout .env
# or manually restore old DATABASE_ENCRYPTION_KEY

# 4. Restart with old keys
npm run dev

# 5. Troubleshoot root cause
# - Check disk space
# - Check permissions
# - Verify old key was correct
# - Review logs: docker compose logs nexlab

# 6. Retry rotation after fixing issue
```

### If Encryption Key Is Lost

**Scenario**: New key was set but somehow lost/corrupted

**Recovery**:
```bash
# 1. If you have backup of old key:
# Update .env with recovered old key
sed -i "s/DATABASE_ENCRYPTION_KEY=.*/DATABASE_ENCRYPTION_KEY=$OLD_DB_KEY/" .env

# 2. Restart application
npm run dev

# 3. If database works with old key:
# Create backup immediately with old key
npm run backup:bundle

# 4. Then retry rotation with NEW key:
sed -i "s/DATABASE_ENCRYPTION_KEY=.*/DATABASE_ENCRYPTION_KEY=$NEW_DB_KEY/" .env
npm run db:encrypt

# If old key is truly lost:
# THIS IS A CRITICAL SITUATION
# - Database is no longer accessible
# - Restore from previous backup (before rotation attempt)
# - If backup is also encrypted with lost key, data is unrecoverable
# - Contact support: support@nexlab.io
```

---

## Documentation & Compliance

### Key Rotation Log

After each rotation, document:

```bash
# File: /secure/location/key-rotation-log.txt

=== Key Rotation: 2026-06-04 ===
Time Started: 2026-06-04 02:00 UTC
Time Completed: 2026-06-04 02:12 UTC
Duration: 12 minutes
Rotated By: [Your Name], IT Manager
Reason: Annual scheduled rotation

Old Keys (Archived):
- DATABASE_ENCRYPTION_KEY: (stored in secure vault)
- BACKUP_ENCRYPTION_KEY: (stored in secure vault)

New Keys:
- DATABASE_ENCRYPTION_KEY: a7f3c2e8... (last 8 chars only, stored in vault)
- BACKUP_ENCRYPTION_KEY: b8e4d3f9... (last 8 chars only, stored in vault)

Verification Results:
✅ Database integrity check passed
✅ Backup encryption working
✅ Restoration test passed
✅ All application tests passed
✅ No errors in logs

Status: SUCCESSFUL

Next Rotation: 2027-06-04
```

### Audit Trail Entry

All key rotation events are automatically logged:

```bash
# View rotation events
curl -H "Authorization: Bearer TOKEN" \
  'http://localhost:3000/api/audit?action=encryption_key_change' | jq '.[]'

# Expected output:
# {
#   "id": "...",
#   "action": "encryption_key_change",
#   "entity": "database",
#   "timestamp": "2026-06-04T02:00:00Z",
#   "userId": "admin@nexlab.local",
#   "severity": "CRITICAL",
#   "details": "Database encryption key rotated"
# }
```

### Compliance Documentation

Key rotation is required for:

- **GDPR**: Article 32 - Encryption and key management
- **HIPAA**: ¶ 164.312(a)(2)(ii) - Encryption and decryption
- **ISO 27001**: A.10.1.2 - Key management
- **Tunisian Healthcare**: CNAM compliance for medical data protection

**Update your compliance documentation to note**:
- Key rotation procedure implemented
- Annual rotation schedule established
- Audit trail captures all key changes
- Recovery procedures tested quarterly

---

## Checklist: Complete Rotation

Before closing out the rotation, verify:

- [ ] New database encryption key generated and verified
- [ ] New backup encryption key generated and verified
- [ ] Old keys archived securely (7-year retention)
- [ ] Database successfully re-encrypted
- [ ] All data integrity checks pass
- [ ] Backup encryption verified and tested
- [ ] Restoration from backup successful
- [ ] All application tests pass
- [ ] No errors in application logs
- [ ] Audit trail shows rotation event
- [ ] Key rotation log completed
- [ ] Staff notified of completion
- [ ] Health check endpoint verified
- [ ] Monitoring alerts verified
- [ ] Compliance documentation updated
- [ ] Next rotation scheduled (12 months from now)

---

## Support & References

For questions or issues:

- **Full Encryption Guide**: docs/ENCRYPTION_AT_REST_GUIDE.md
- **Troubleshooting**: docs/ENCRYPTION_AT_REST_GUIDE.md#recovery--troubleshooting
- **Support**: support@nexlab.io

---

**Last Updated**: June 2026 | **Version**: 1.0 | **Status**: Production Ready 🔐
