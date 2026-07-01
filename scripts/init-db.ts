/**
 * Initialize the encrypted NexLab database schema.
 * Creates all tables from the Prisma schema using the encrypted libSQL client.
 * Run: node --import tsx scripts/init-db.ts
 */
import 'dotenv/config';
import { createClient } from '@libsql/client';

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_ENCRYPTION_KEY = process.env.DATABASE_ENCRYPTION_KEY;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

console.log('🔧 Initializing NexLab encrypted database...');
console.log(`   URL: ${DATABASE_URL}`);
console.log(`   Encryption: ${DATABASE_ENCRYPTION_KEY ? 'ENABLED' : 'DISABLED'}`);

const client = createClient({
  url: DATABASE_URL,
  encryptionKey: DATABASE_ENCRYPTION_KEY,
});

const schema = `
-- Categories
CREATE TABLE IF NOT EXISTS "categories" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "rank" INTEGER NOT NULL DEFAULT 0,
  "icon" TEXT,
  "parentId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tests
CREATE TABLE IF NOT EXISTS "tests" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL UNIQUE,
  "unit" TEXT,
  "minValue" REAL,
  "maxValue" REAL,
  "minValueM" REAL,
  "maxValueM" REAL,
  "minValueF" REAL,
  "maxValueF" REAL,
  "price" REAL NOT NULL DEFAULT 0,
  "rank" INTEGER NOT NULL DEFAULT 0,
  "decimals" INTEGER NOT NULL DEFAULT 1,
  "categoryId" TEXT NOT NULL,
  "isActive" INTEGER NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "tests_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Users
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'TECHNICIEN',
  "isActive" INTEGER NOT NULL DEFAULT 1,
  "mustChangePassword" INTEGER NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- Settings
CREATE TABLE IF NOT EXISTS "settings" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "value" TEXT NOT NULL,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Patients
CREATE TABLE IF NOT EXISTS "patients" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "dateOfBirth" DATETIME,
  "gender" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- Analyses
CREATE TABLE IF NOT EXISTS "analyses" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "analysisNumber" TEXT NOT NULL UNIQUE,
  "patientId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "prescriber" TEXT,
  "provenance" TEXT,
  "sampleType" TEXT,
  "sampleContainer" TEXT,
  "sampleCondition" TEXT,
  "clinicalInfo" TEXT,
  "totalPrice" REAL NOT NULL DEFAULT 0,
  "paidAmount" REAL NOT NULL DEFAULT 0,
  "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
  "urgency" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "collectedAt" DATETIME,
  "validatedAt" DATETIME,
  "validatedBy" TEXT,
  "sealedAt" DATETIME,
  "validationSeal" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "analyses_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Analysis Items (link between analyses and tests)
CREATE TABLE IF NOT EXISTS "analysis_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "analysisId" TEXT NOT NULL,
  "testId" TEXT NOT NULL,
  "result" TEXT,
  "unit" TEXT,
  "normalRange" TEXT,
  "flag" TEXT,
  "notes" TEXT,
  "price" REAL NOT NULL DEFAULT 0,
  "rank" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "analysis_items_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "analysis_items_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Audit logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "userEmail" TEXT,
  "action" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "resourceId" TEXT,
  "details" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- QC Records
CREATE TABLE IF NOT EXISTS "qc_records" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "testId" TEXT NOT NULL,
  "value" REAL NOT NULL,
  "mean" REAL,
  "sd" REAL,
  "cv" REAL,
  "zScore" REAL,
  "level" TEXT NOT NULL,
  "lot" TEXT,
  "instrumentId" TEXT,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'IN_CONTROL',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "qc_records_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Temperature Records
CREATE TABLE IF NOT EXISTS "temperature_records" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "equipmentName" TEXT NOT NULL,
  "temperature" REAL NOT NULL,
  "minTemp" REAL,
  "maxTemp" REAL,
  "status" TEXT NOT NULL DEFAULT 'NORMAL',
  "notes" TEXT,
  "recordedBy" TEXT,
  "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- Inventory
CREATE TABLE IF NOT EXISTS "inventory_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "reference" TEXT,
  "category" TEXT,
  "currentStock" REAL NOT NULL DEFAULT 0,
  "minStock" REAL NOT NULL DEFAULT 0,
  "unit" TEXT,
  "expiryDate" DATETIME,
  "location" TEXT,
  "supplier" TEXT,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- Documents
CREATE TABLE IF NOT EXISTS "documents" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "category" TEXT,
  "version" TEXT,
  "content" TEXT,
  "filePath" TEXT,
  "createdBy" TEXT,
  "reviewedBy" TEXT,
  "approvedBy" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "expiryDate" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- Rate limit
CREATE TABLE IF NOT EXISTS "rate_limits" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ip" TEXT NOT NULL UNIQUE,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "blockedUntil" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- Notifications
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT,
  "isRead" INTEGER NOT NULL DEFAULT 0,
  "data" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

try {
  // Execute each statement individually for better error reporting
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 10 && !s.startsWith('--'));

  let created = 0;
  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      if (stmt.includes('CREATE TABLE')) {
        const tableName = stmt.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1];
        if (tableName) {
          console.log(`  ✅ Table: ${tableName}`);
          created++;
        }
      }
    } catch (err: any) {
      if (!err.message?.includes('already exists')) {
        console.warn(`  ⚠️ Statement skipped: ${err.message}`);
      }
    }
  }

  // Verify
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  console.log(`\n✅ Database ready with ${tables.rows.length} tables:`);
  for (const row of tables.rows) {
    console.log(`   - ${row.name}`);
  }
  console.log('\n🚀 You can now run: npm run dev');
  console.log('   Then visit http://localhost:3000 to run the setup wizard');
  console.log('   (The app will detect no admin user and redirect to setup)');

} catch (err: any) {
  console.error('❌ Error:', err.message);
} finally {
  client.close();
}
