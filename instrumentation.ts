export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { checkDatabaseIntegrity } = await import('./lib/db/database-integrity');
    await checkDatabaseIntegrity();

    const { installAuditImmutabilityTriggers } = await import('./lib/security/audit-trail-setup');
    await installAuditImmutabilityTriggers();

    // Verify encryption configuration on startup
    const encryptionKey = process.env.DATABASE_ENCRYPTION_KEY;
    if (encryptionKey) {
      const keyLength = encryptionKey.length;
      const isValidLength = keyLength === 64;
      if (isValidLength) {
        console.log('[NexLab] ✅ Database encryption: ENABLED (256-bit AES)');
      } else {
        console.warn(`[NexLab] ⚠️ Database encryption key configured but invalid length: ${keyLength} chars (expected 64)`);
      }
    } else {
      console.warn('[NexLab] ⚠️ DATABASE_ENCRYPTION_KEY not configured. Database will not be encrypted.');
      console.warn('[NexLab] For production use, set DATABASE_ENCRYPTION_KEY in .env with a 64-character hex key.');
    }

    // Verify backup encryption configuration
    const backupKey = process.env.BACKUP_ENCRYPTION_KEY;
    if (backupKey) {
      const keyLength = backupKey.length;
      if (keyLength === 64) {
        console.log('[NexLab] ✅ Backup encryption: ENABLED (separate key, 256-bit AES-GCM)');
      } else {
        console.warn(`[NexLab] ⚠️ Backup encryption key invalid length: ${keyLength} chars (expected 64)`);
      }
    } else if (encryptionKey) {
      console.log('[NexLab] ✅ Backup encryption: ENABLED (using database encryption key)');
    } else {
      console.warn('[NexLab] ⚠️ Backup encryption not configured');
    }

    // ── Validate all critical security secrets ───────────────────────────────
    const issues: string[] = [];

    if (!process.env.SEAL_SECRET) {
      issues.push('SEAL_SECRET is not set — validated medical reports cannot be cryptographically sealed.');
    }
    if (!process.env.INTERNAL_PRINT_TOKEN) {
      issues.push('INTERNAL_PRINT_TOKEN is not set — internal print API routes are disabled for safety.');
    }
    if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
      issues.push('AUTH_SECRET is missing or too short (min 32 chars) — user sessions are insecure.');
    }

    if (issues.length > 0) {
      console.warn('\n[NexLab] ⚠️  SECURITY CONFIGURATION ISSUES DETECTED:');
      issues.forEach((issue, i) => console.warn(`  ${i + 1}. ${issue}`));
      console.warn('[NexLab] Fix these in your .env file before going to production.\n');
    } else {
      console.log('[NexLab] ✅ Security environment: All secrets configured correctly.');
    }

    // ── Schedule automatic nightly backup ────────────────────────────────────
    const { scheduleAutoBackup } = await import('./lib/db/auto-backup');
    scheduleAutoBackup();
  }
}
