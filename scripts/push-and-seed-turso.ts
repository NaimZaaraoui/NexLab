/**
 * Push SQLite schema to Turso and seed demo data.
 * Run: npm run demo:push-and-seed
 */

import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import { resolve } from 'path';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('❌ DATABASE_URL and DATABASE_AUTH_TOKEN must be set in .env.turso');
  process.exit(1);
}

// TS narrowing doesn't cross process.exit() — assert after the guard
const DB_URL: string = url;
const DB_TOKEN: string = authToken;

const DEMO_PASSWORD = 'DemoLab2026!';

// ── 1. Push schema ─────────────────────────────────────────────────────────────
async function pushSchema() {
  console.log('📐 Pushing schema to Turso...');

  // Get CREATE TABLE statements from local backup db
  const localDb = new Database(resolve(process.cwd(), 'dev.backup-1780553557763.db'), { readonly: true });
  const tables = localDb.prepare(
    `SELECT sql FROM sqlite_master
     WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'
     ORDER BY name`
  ).all() as Array<{ sql: string }>;

  const indexes = localDb.prepare(
    `SELECT sql FROM sqlite_master
     WHERE type='index' AND sql IS NOT NULL AND name NOT LIKE 'sqlite_%'
     ORDER BY name`
  ).all() as Array<{ sql: string }>;

  localDb.close();

  const turso = createClient({ url: DB_URL, authToken: DB_TOKEN });

  // Drop all existing tables first (clean slate)
  const existing = await turso.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
  );

  if (existing.rows.length > 0) {
    console.log(`  ⚠️  Found ${existing.rows.length} existing tables — dropping...`);
    await turso.execute('PRAGMA foreign_keys = OFF');
    for (const row of existing.rows) {
      await turso.execute(`DROP TABLE IF EXISTS "${row.name}"`);
    }
    await turso.execute('PRAGMA foreign_keys = ON');
  }

  // Create tables
  await turso.execute('PRAGMA foreign_keys = OFF');
  for (const { sql } of tables) {
    try {
      await turso.execute(sql);
    } catch (e) {
      console.warn(`  ⚠️  Skipped table: ${String(e).slice(0, 80)}`);
    }
  }

  // Create indexes
  for (const { sql } of indexes) {
    try {
      await turso.execute(sql);
    } catch (e) {
      console.warn(`  ⚠️  Skipped index: ${String(e).slice(0, 80)}`);
    }
  }
  await turso.execute('PRAGMA foreign_keys = ON');

  await turso.close();
  console.log(`  ✅ Schema pushed (${tables.length} tables, ${indexes.length} indexes)`);
}

// ── 2. Seed demo data via Turso HTTP ──────────────────────────────────────────
async function seedData() {
  console.log('\n🌱 Seeding demo data...');
  const turso = createClient({ url: DB_URL, authToken: DB_TOKEN });
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);

  const now = new Date().toISOString();

  // Users
  console.log('  👤 Users...');
  for (const user of [
    { id: 'demo-admin-1',  name: 'Administrateur Démo', email: 'admin.demo@nexlab.dz', role: 'ADMIN' },
    { id: 'demo-tech-1',   name: 'Technicien Démo',     email: 'tech.demo@nexlab.dz',  role: 'TECHNICIEN' },
  ]) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO users (id, name, email, password, role, isActive, mustChangePassword, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?)`,
      args: [user.id, user.name, user.email, hashedPassword, user.role, now, now],
    });
  }

  // Settings
  console.log('  ⚙️  Settings...');
  const settings = [
    ['lab_name',           'NexLab — Démonstration'],
    ['lab_subtitle',       'Centre de Santé de Services de Base'],
    ['lab_parent',         'Données fictives — Demo uniquement'],
    ['lab_phone',          '+213 000 000 000'],
    ['lab_email',          'demo@nexlab.dz'],
    ['lab_address_1',      '12 Rue de la Science, Alger'],
    ['lab_bio_name',       'Dr. Démo Directeur'],
    ['lab_bio_title',      'Docteur en Biologie'],
    ['tat_warn',           '45'],
    ['tat_alert',          '60'],
    ['amount_unit',        'DA'],
    ['diatron_enabled',    'false'],
    ['sample_types',       'Sang total, Sérum, Plasma, Urine, LCR'],
    ['sample_containers',  'Tube EDTA, Tube sec, Tube citrate, Tube héparine'],
    ['sample_conditions',  'Conforme, Hémolysé, Lipémique, Ictérique, Coagulé'],
    ['provenance_options', 'Consultation, Externe, Interne, Urgence'],
    ['prescriber_options', ''],
    ['lab_bio_onmpt',      ''],
    ['lab_footer_text',    ''],
    ['lab_stamp_image',    ''],
    ['lab_bio_signature',  ''],
    ['lab_address_2',      ''],
  ];
  for (const [key, value] of settings) {
    const id = `setting-${key}`;
    await turso.execute({
      sql: `INSERT OR REPLACE INTO settings (id, key, value, updatedAt) VALUES (?, ?, ?, ?)`,
      args: [id, key, value, now],
    });
  }

  // Categories
  console.log('  🗂️  Categories...');
  const categories = [
    ['cat-hemato',  'Hématologie',    'droplets',      1],
    ['cat-bio',     'Biochimie',      'flask-conical', 2],
    ['cat-iono',    'Ionogramme',     'wave',          3],
    ['cat-hepato',  'Bilan Hépatique','activity',      4],
    ['cat-thyroid', 'Thyroïde',       'zap',           5],
    ['cat-sero',    'Sérologie',      'shield',        6],
    ['cat-lipid',   'Bilan Lipidique','heart',         7],
    ['cat-coag',    'Hémostase',      'droplet',       8],
  ] as const;

  for (const [id, name, icon, rank] of categories) {
    await turso.execute({
      sql: `INSERT OR IGNORE INTO categories (id, name, icon, rank, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, name, icon, rank, now, now],
    });
  }

  // Tests (key subset)
  console.log('  🧪 Tests...');
  type T = [string, string, string, string|null, number|null, number|null, number, number, number];
  const tests: T[] = [
    ['NFS-HGB', 'Hémoglobine',      'cat-hemato', 'g/dL',   12,  17,  8,  1, 1],
    ['NFS-WBC', 'Leucocytes (GB)',  'cat-hemato', '10^3/µL', 4,  10,  8,  2, 1],
    ['NFS-PLT', 'Plaquettes',       'cat-hemato', '10^3/µL',150, 400, 8,  3, 0],
    ['NFS-HCT', 'Hématocrite',      'cat-hemato', '%',       36,  52,  8,  4, 1],
    ['BIO-GLU', 'Glycémie',         'cat-bio',    'g/L',    0.7, 1.1, 10,  1, 2],
    ['BIO-UREE','Urée',             'cat-bio',    'g/L',   0.15,0.45, 10,  2, 2],
    ['BIO-CREA','Créatinine',       'cat-bio',    'mg/L',    6,  12,  10,  3, 1],
    ['HEP-ALAT','ALAT (TGP)',       'cat-hepato', 'UI/L',    0,  40,  12,  1, 0],
    ['HEP-ASAT','ASAT (TGO)',       'cat-hepato', 'UI/L',    0,  40,  12,  2, 0],
    ['THY-TSH', 'TSH',              'cat-thyroid','µUI/mL', 0.4, 4.0, 20,  1, 2],
    ['LIP-CT',  'Cholestérol Total','cat-lipid',  'g/L',    1.5, 2.0, 10,  1, 2],
    ['LIP-TG',  'Triglycérides',   'cat-lipid',  'g/L',    0.5, 1.5, 10,  2, 2],
    ['SER-CRP', 'CRP',              'cat-sero',   'mg/L',    0,   5,  12,  1, 1],
  ];

  for (const [code, name, catId, unit, minVal, maxVal, price, rank, decimals] of tests) {
    const id = `test-${code.toLowerCase()}`;
    await turso.execute({
      sql: `INSERT OR IGNORE INTO tests
            (id, code, name, categoryId, unit, minValue, maxValue, price, rank, decimals, resultType, isGroup, isOptional, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'numeric', 0, 0, ?, ?)`,
      args: [id, code, name, catId, unit, minVal, maxVal, price, rank, decimals, now, now],
    });
  }

  // Patients & Analyses
  console.log('  🏥 Patients & analyses...');
  const patients = [
    { id: 'demo-p1', fn: 'Ahmed',   ln: 'Benali',    g: 'M', age: 45 },
    { id: 'demo-p2', fn: 'Fatima',  ln: 'Khelif',    g: 'F', age: 32 },
    { id: 'demo-p3', fn: 'Karim',   ln: 'Messaoudi', g: 'M', age: 58 },
    { id: 'demo-p4', fn: 'Aicha',   ln: 'Hamidi',    g: 'F', age: 27 },
    { id: 'demo-p5', fn: 'Yacine',  ln: 'Rouabah',   g: 'M', age: 63 },
  ];

  for (let i = 0; i < patients.length; i++) {
    const p = patients[i];
    const createdAt = new Date(Date.now() - (5 - i) * 86400000).toISOString();

    await turso.execute({
      sql: `INSERT OR IGNORE INTO patients (id, firstName, lastName, gender, phoneNumber, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [p.id, p.fn, p.ln, p.g, `0550${100000 + i}`, createdAt, createdAt],
    });

    const ordNum = `DEM-${String(i + 1).padStart(4, '0')}`;
    const status = i < 3 ? 'validated' : i === 3 ? 'in_progress' : 'pending';

    await turso.execute({
      sql: `INSERT OR IGNORE INTO analyses
            (id, orderNumber, patientId,
             provenance, medecinPrescripteur, status, totalPrice, paymentStatus, creationDate, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        `demo-a${i + 1}`, ordNum, p.id,
        i % 2 === 0 ? 'Interne' : 'Externe',
        i % 2 === 0 ? 'Dr. Mansouri' : 'Dr. Belkacem',
        status, 1200, i < 2 ? 'PAID' : 'UNPAID',
        createdAt, createdAt, createdAt,
      ],
    });
  }

  await turso.close();
}

async function main() {
  console.log('🚀 NexLab Demo — Turso Setup\n');
  await pushSchema();
  await seedData();

  console.log('\n✅ Done!');
  console.log('─────────────────────────────────────');
  console.log('🔑 Admin:      admin.demo@nexlab.dz');
  console.log('🔑 Technicien: tech.demo@nexlab.dz');
  console.log(`🔑 Password:   ${DEMO_PASSWORD}`);
  console.log('─────────────────────────────────────');
}

main().catch((e) => {
  console.error('❌ Failed:', e);
  process.exit(1);
});
