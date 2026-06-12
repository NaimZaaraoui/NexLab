-- AddAuditTrailImmutability
-- Enforce audit trail immutability via database triggers
-- 
-- Medical compliance requirement (ISO 15189):
-- Audit logs must be append-only and cannot be modified or deleted
-- This trigger ensures data integrity at the database level

-- Prevent UPDATE on active audit logs
CREATE TRIGGER IF NOT EXISTS audit_log_prevent_update
BEFORE UPDATE ON audit_logs
BEGIN
  SELECT RAISE(ABORT, 'Audit logs cannot be modified (immutability enforced)');
END;

-- Prevent DELETE on active audit logs
CREATE TRIGGER IF NOT EXISTS audit_log_prevent_delete
BEFORE DELETE ON audit_logs
BEGIN
  SELECT RAISE(ABORT, 'Audit logs cannot be deleted (immutability enforced)');
END;

-- Prevent UPDATE on archived audit logs
CREATE TRIGGER IF NOT EXISTS audit_log_archive_prevent_update
BEFORE UPDATE ON audit_log_archives
BEGIN
  SELECT RAISE(ABORT, 'Archived audit logs cannot be modified (immutability enforced)');
END;

-- Prevent DELETE on archived audit logs
CREATE TRIGGER IF NOT EXISTS audit_log_archive_prevent_delete
BEFORE DELETE ON audit_log_archives
BEGIN
  SELECT RAISE(ABORT, 'Archived audit logs cannot be deleted (immutability enforced)');
END;
