

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
      const isValidLength = keyLength === 64; // 32 bytes = 64 hex chars

      if (isValidLength) {
        console.log(
          '[NexLab] ✅ Database encryption: ENABLED (256-bit AES)'
        );
      } else {
        console.warn(
          `[NexLab] ⚠️ Database encryption key configured but invalid length: ${keyLength} chars (expected 64)`
        );
      }
    } else {
      console.warn(
        '[NexLab] ⚠️ DATABASE_ENCRYPTION_KEY not configured. Database will not be encrypted.'
      );
      console.warn(
        '[NexLab] For production use, set DATABASE_ENCRYPTION_KEY in .env with a 64-character hex key.'
      );
      console.warn(
        '[NexLab] Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
      );
    }

    // Verify backup encryption configuration
    const backupKey = process.env.BACKUP_ENCRYPTION_KEY;
    if (backupKey) {
      const keyLength = backupKey.length;
      if (keyLength === 64) {
        console.log(
          '[NexLab] ✅ Backup encryption: ENABLED (separate key, 256-bit AES-GCM)'
        );
      } else {
        console.warn(
          `[NexLab] ⚠️ Backup encryption key invalid length: ${keyLength} chars (expected 64)`
        );
      }
    } else if (encryptionKey) {
      console.log(
        '[NexLab] ✅ Backup encryption: ENABLED (using database encryption key)'
      );
    } else {
      console.warn('[NexLab] ⚠️ Backup encryption not configured');
    }
  }
}
