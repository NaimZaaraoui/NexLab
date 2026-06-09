# Phase 1: Critical Security Hardening — Implementation Guide

**Timeline**: 1-2 weeks  
**Priority**: BLOCKING commercial deployment  
**Status**: Ready to implement

---

## 1A: Secrets Management ✅ COMPLETE

### What was done:
- Created `.env.example` template with documentation
- Verified `.env*` is in `.gitignore`
- Confirmed no secrets in git history

### No further action needed. ✅

---

## 1B: CSRF Protection — TODO

### Current Status:
- ❌ NO CSRF protection detected in API routes
- ❌ State-changing endpoints (POST/PUT/DELETE) vulnerable to cross-origin attacks
- Risk: Attacker could forge requests on behalf of authenticated user

### Implementation Steps:

#### Step 1: Integrate CSRF middleware into auth flow
**File**: `lib/auth.ts`

After successful login (in the JWT callback), generate and set CSRF token:

```typescript
// In the jwt callback:
if (user) {
  // ... existing code ...
  
  // Generate CSRF token for this session
  const csrfToken = generateCSRFToken();
  await setCSRFTokenCookie(csrfToken);
}
```

**File to modify**: `/home/naim/nexlab/lib/auth.ts` (around line 115)

---

#### Step 2: Add CSRF validation to all mutation API routes

**Example**: `/app/api/analyses/route.ts`

```typescript
import { enforceCSRF } from '@/lib/csrf-protection';

export async function POST(request: Request) {
  // CSRF validation FIRST
  try {
    await enforceCSRF(request);
  } catch (error) {
    return NextResponse.json(
      { error: 'CSRF validation failed' },
      { status: 403 }
    );
  }

  // Then proceed with business logic...
}
```

**Files to update** (all API mutation endpoints):
- `/app/api/analyses/route.ts` - POST
- `/app/api/analyses/[id]/route.ts` - PUT, DELETE
- `/app/api/results/route.ts` - POST, PUT
- `/app/api/users/route.ts` - POST, PUT
- `/app/api/users/[id]/route.ts` - PUT, DELETE
- `/app/api/auth/change-password/route.ts` - POST
- Any other state-changing endpoints

---

#### Step 3: Client-side token passing

For **API calls** from components:

```typescript
// Add CSRF token to all mutation requests
const response = await fetch('/api/analyses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken, // Get from component context
  },
  body: JSON.stringify(data),
});
```

For **HTML forms** (if any):

```typescript
// Use lib/csrf-protection.ts:
export async function getCSRFFieldHTML(): Promise<string> {
  // Returns: <input type="hidden" name="csrf-token" value="..." />
}
```

---

#### Step 4: Testing

Create test file: `/tests/e2e/csrf-protection.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('should reject POST without CSRF token', async ({ page, context }) => {
  // Login to get session
  await page.goto('/login');
  // ... login flow ...

  // Attempt API call without CSRF token
  const response = await context.request.post('/api/analyses', {
    data: { patientId: '123' },
  });

  expect(response.status()).toBe(403);
  expect(await response.json()).toMatchObject({ error: 'CSRF' });
});

test('should accept POST with valid CSRF token', async ({ page }) => {
  // Login to get CSRF token in cookie
  await page.goto('/dashboard');
  
  // Make request with token
  const csrfToken = await page.evaluate(() => {
    // Extract token from page context (set after login)
    return document.querySelector('body')?.getAttribute('data-csrf-token');
  });

  const response = await page.request.post('/api/analyses', {
    headers: { 'X-CSRF-Token': csrfToken },
    data: { patientId: '123' },
  });

  expect(response.status()).toBe(200);
});
```

---

## 1C: Audit Trail Immutability — TODO

### Current Status:
- ✅ AuditLog table exists with correct fields
- ❌ NO database triggers to prevent modification/deletion
- ❌ Application can still UPDATE/DELETE audit logs (security hole)

### Implementation Steps:

#### Step 1: Create Prisma migration

```bash
cd /home/naim/nexlab
npx prisma migrate dev --name add_audit_trail_immutability
```

This will create a new migration file. Edit it to add the triggers from [AUDIT_TRAIL_IMMUTABILITY_MIGRATION.sql](./AUDIT_TRAIL_IMMUTABILITY_MIGRATION.sql):

The migration file should be at:
`prisma/migrations/[timestamp]_add_audit_trail_immutability/migration.sql`

Copy the SQL from the docs file into this migration.

---

#### Step 2: Deploy the migration

```bash
npx prisma migrate deploy
```

---

#### Step 3: Test immutability

```bash
# Test in SQLite shell:
sqlite3 dev.db

-- Try to update an audit log (should fail)
UPDATE audit_logs SET action = 'modified' WHERE id = 'some-id';
-- Expected: Error: Audit logs cannot be modified (immutability enforced)

-- Try to delete an audit log (should fail)
DELETE FROM audit_logs WHERE id = 'some-id';
-- Expected: Error: Audit logs cannot be deleted (immutability enforced)

-- Try to INSERT (should work - append-only)
INSERT INTO audit_logs (id, action, entity, createdAt) 
VALUES ('test-id', 'TEST_ACTION', 'TEST_ENTITY', datetime('now'));
-- Expected: Success
```

---

#### Step 4: Integrate integrity checks

Add to system health checks (e.g., `/api/system/health`):

```typescript
import { validateAuditLogIntegrity } from '@/lib/audit-trail-immutability';

export async function GET() {
  const auditStatus = await validateAuditLogIntegrity();
  
  if (auditStatus.status === 'CRITICAL') {
    // Alert admins, fail health check
    return NextResponse.json(
      { error: 'Audit trail integrity compromised' },
      { status: 500 }
    );
  }

  return NextResponse.json({ audit: auditStatus });
}
```

---

#### Step 5: Set up nightly archival (optional but recommended)

Add to a scheduled task (e.g., using `node-cron` in Next.js):

```typescript
import { archiveOldAuditLogs } from '@/lib/audit-trail-immutability';

// In a background job (e.g., run daily at 2 AM):
await archiveOldAuditLogs(365); // Archive logs older than 1 year
```

---

## 1D: Password Hashing & Rate Limiting Check ✅ VERIFIED GOOD

### Current Status:
- ✅ Password hashing: bcrypt with **12 rounds** (excellent!)
- ✅ Rate limiting: Implemented on `/api/auth` endpoint
- ✅ Inactive user check: Enforced
- ✅ Email uniqueness: Enforced with `@unique` in schema

### Verification:

Check `/lib/auth.ts`:
```typescript
const hashedPassword = await bcrypt.hash(password, 12); // ✅ 12 rounds
const valid = await bcrypt.compare(credentials.password, user.password); // ✅ Compare
```

Check rate limiting in `/lib/rate-limit.ts`:
```typescript
const isAllowed = await checkRateLimit(ip); // ✅ Per-IP limiting
```

### Documentation Needed:

Create `/docs/SECURITY_PASSWORD_POLICY.md`:
```markdown
# Password Security Policy

## Hashing
- Algorithm: bcrypt with 12 rounds (OWASP recommended)
- Salt: Automatically generated per password
- Timing: ~100ms per hash (prevents brute force)

## Minimum Requirements
- Length: 8 characters
- Complexity: No additional complexity requirements (bcrypt strength compensates)

## Rate Limiting
- Max 5 failed login attempts per IP per 15 minutes
- After 5 failures, client must wait 15+ minutes
- Blocks prevent brute-force attacks

## Password Reset
- Reset links expire after 1 hour
- Old password hash retained for audit trail
- Admin can force password reset (sets mustChangePassword flag)

## Two-Factor Authentication
- Not yet implemented
- Planned for v2.0
```

### No changes needed. ✅

---

## Summary: Phase 1 Implementation Checklist

- [ ] **1A - Secrets Management**: ✅ DONE
  - [x] Created `.env.example`
  - [x] Verified `.env` in `.gitignore`

- [ ] **1B - CSRF Protection**: In Progress
  - [ ] Add imports to `/lib/auth.ts`
  - [ ] Integrate `enforceCSRF()` into all POST/PUT/DELETE API routes
  - [ ] Client-side: Add `X-CSRF-Token` header to API calls
  - [ ] Create E2E tests for CSRF validation
  - [ ] **Estimated time: 3-4 hours**

- [ ] **1C - Audit Trail Immutability**: In Progress
  - [ ] Create Prisma migration with SQL triggers
  - [ ] Run migration: `npx prisma migrate dev`
  - [ ] Test: Verify UPDATE/DELETE blocked in SQLite
  - [ ] Integrate health check into `/api/system/health`
  - [ ] Set up nightly archival job
  - [ ] **Estimated time: 2-3 hours**

- [ ] **1D - Password & Rate Limiting**: ✅ VERIFIED
  - [x] Bcrypt 12 rounds confirmed
  - [x] Rate limiting confirmed
  - [ ] Create security documentation (password policy)
  - [ ] **Estimated time: 30 minutes**

---

## Next Steps (After Phase 1)

Once Phase 1 is complete:

1. **Phase 2**: Data Encryption at Rest (SQLCipher)
2. **Phase 3**: Dependency Audit (npm audit, security updates)
3. **Phase 4**: Medical Compliance (formula validation)
4. **Phase 5-6**: Documentation, reference ranges, ISO 15189

---

## Resources

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [bcrypt Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Audit Trail Immutability (NIST Guidelines)](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-98.pdf)
- [Medical Data Protection (ISO 15189)](https://www.iso.org/standard/42641.html)
