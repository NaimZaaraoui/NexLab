/**
 * Demo Seed Script — Turso / libSQL
 * Run: npm run demo:seed-turso
 *
 * Credentials are loaded from .env.turso automatically.
 */

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';

const DEMO_PASSWORD = 'DemoLab2026!';

async function main() {
  console.log('🌱 Seeding demo database on Turso...\n');

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log('👤 Creating users...');

  await prisma.user.upsert({
    where: { email: 'admin.demo@nexlab.dz' },
    update: { password: hashedPassword, mustChangePassword: false, isActive: true },
    create: {
      name: 'Administrateur Démo',
      email: 'admin.demo@nexlab.dz',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: false,
    },
  });

  await prisma.user.upsert({
    where: { email: 'tech.demo@nexlab.dz' },
    update: { password: hashedPassword, mustChangePassword: false, isActive: true },
    create: {
      name: 'Technicien Démo',
      email: 'tech.demo@nexlab.dz',
      password: hashedPassword,
      role: 'TECHNICIEN',
      isActive: true,
      mustChangePassword: false,
    },
  });

  // ── Settings ───────────────────────────────────────────────────────────────
  console.log('⚙️  Configuring lab settings...');

  const settings: Array<{ key: string; value: string }> = [
    { key: 'lab_name', value: 'NexLab — Démonstration' },
    { key: 'lab_subtitle', value: 'Centre de Santé de Services de Base' },
    { key: 'lab_parent', value: 'Données fictives — Demo uniquement' },
    { key: 'lab_phone', value: '+213 000 000 000' },
    { key: 'lab_email', value: 'demo@nexlab.dz' },
    { key: 'lab_address', value: '12 Rue de la Science, Alger' },
    { key: 'lab_director', value: 'Dr. Démo Directeur' },
    { key: 'currency', value: 'DZD' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }

  // ── Test Categories ────────────────────────────────────────────────────────
  console.log('🗂️  Creating test categories...');

  const hematoCat = await prisma.category.upsert({
    where: { name: 'Hématologie' },
    update: {},
    create: { name: 'Hématologie', icon: 'Droplets', rank: 1 },
  });

  const biochimCat = await prisma.category.upsert({
    where: { name: 'Biochimie' },
    update: {},
    create: { name: 'Biochimie', icon: 'FlaskConical', rank: 2 },
  });

  const seroCat = await prisma.category.upsert({
    where: { name: 'Sérologie' },
    update: {},
    create: { name: 'Sérologie', icon: 'Microscope', rank: 3 },
  });

  // ── Tests ──────────────────────────────────────────────────────────────────
  console.log('🧪 Creating tests...');

  const nfsGroup = await prisma.test.upsert({
    where: { code: 'NFS' },
    update: {},
    create: {
      code: 'NFS',
      name: 'Numération Formule Sanguine',
      resultType: 'text',
      isGroup: true,
      categoryId: hematoCat.id,
      rank: 1,
      price: 450,
    },
  });

  const nfsTests = [
    { code: 'GB',   name: 'Globules Blancs',   unit: '10³/µL', minValue: 4,   maxValue: 10,  decimals: 2 },
    { code: 'GR',   name: 'Globules Rouges',   unit: '10⁶/µL', minValue: 4.2, maxValue: 5.9, decimals: 2 },
    { code: 'HGB',  name: 'Hémoglobine',       unit: 'g/dL',   minValue: 12,  maxValue: 17,  decimals: 1 },
    { code: 'HCT',  name: 'Hématocrite',       unit: '%',      minValue: 36,  maxValue: 52,  decimals: 1 },
    { code: 'PLT',  name: 'Plaquettes',        unit: '10³/µL', minValue: 150, maxValue: 400, decimals: 0 },
    { code: 'VGM',  name: 'VGM',              unit: 'fL',     minValue: 80,  maxValue: 100, decimals: 1 },
    { code: 'TGMH', name: 'TGMH',            unit: 'pg',     minValue: 27,  maxValue: 32,  decimals: 1 },
    { code: 'CCMH', name: 'CCMH',            unit: 'g/dL',   minValue: 32,  maxValue: 36,  decimals: 1 },
  ];

  for (let i = 0; i < nfsTests.length; i++) {
    const t = nfsTests[i];
    await prisma.test.upsert({
      where: { code: t.code },
      update: {},
      create: {
        ...t,
        resultType: 'numeric',
        categoryId: hematoCat.id,
        parentId: nfsGroup.id,
        rank: i + 1,
        price: 0,
      },
    });
  }

  const biochimTests = [
    { code: 'GLY',  name: 'Glycémie',          unit: 'g/L',    minValue: 0.7,  maxValue: 1.1,  decimals: 2, price: 200 },
    { code: 'URE',  name: 'Urée',              unit: 'g/L',    minValue: 0.15, maxValue: 0.45, decimals: 2, price: 200 },
    { code: 'CREA', name: 'Créatinine',        unit: 'mg/L',   minValue: 6,    maxValue: 12,   decimals: 1, price: 250 },
    { code: 'UA',   name: 'Acide Urique',      unit: 'mg/L',   minValue: 35,   maxValue: 70,   decimals: 0, price: 200 },
    { code: 'CHOL', name: 'Cholestérol Total', unit: 'g/L',    minValue: 1.5,  maxValue: 2.0,  decimals: 2, price: 300 },
    { code: 'TG',   name: 'Triglycérides',    unit: 'g/L',    minValue: 0.5,  maxValue: 1.5,  decimals: 2, price: 300 },
    { code: 'HDL',  name: 'HDL Cholestérol',  unit: 'g/L',    minValue: 0.4,  maxValue: 0.6,  decimals: 2, price: 350 },
    { code: 'LDL',  name: 'LDL Cholestérol',  unit: 'g/L',    minValue: 1.0,  maxValue: 1.6,  decimals: 2, price: 350 },
    { code: 'ALT',  name: 'ALAT (TGP)',        unit: 'UI/L',   minValue: 7,    maxValue: 40,   decimals: 0, price: 250 },
    { code: 'AST',  name: 'ASAT (TGO)',        unit: 'UI/L',   minValue: 5,    maxValue: 40,   decimals: 0, price: 250 },
  ];

  for (let i = 0; i < biochimTests.length; i++) {
    const t = biochimTests[i];
    await prisma.test.upsert({
      where: { code: t.code },
      update: {},
      create: {
        ...t,
        resultType: 'numeric',
        categoryId: biochimCat.id,
        rank: i + 1,
      },
    });
  }

  const seroTests = [
    { code: 'WRIGH', name: 'Widal & Wright', unit: null, price: 400 },
    { code: 'TPHA',  name: 'TPHA',           unit: null, price: 500 },
    { code: 'HIV',   name: 'HIV Ag/Ac',      unit: null, price: 600 },
    { code: 'HBSAG', name: 'HBs Ag',         unit: null, price: 600 },
    { code: 'HCVAC', name: 'HCV Ac',         unit: null, price: 600 },
  ];

  for (let i = 0; i < seroTests.length; i++) {
    const t = seroTests[i];
    await prisma.test.upsert({
      where: { code: t.code },
      update: {},
      create: {
        ...t,
        resultType: 'dropdown',
        options: 'Négatif, Positif',
        categoryId: seroCat.id,
        rank: i + 1,
      },
    });
  }

  // ── Patients & Analyses ────────────────────────────────────────────────────
  console.log('🏥 Creating patients and analyses...');

  const patients = [
    { firstName: 'Ahmed',   lastName: 'Benali',    gender: 'M', age: 45 },
    { firstName: 'Fatima',  lastName: 'Khelif',    gender: 'F', age: 32 },
    { firstName: 'Karim',   lastName: 'Messaoudi', gender: 'M', age: 58 },
    { firstName: 'Aicha',   lastName: 'Hamidi',    gender: 'F', age: 27 },
    { firstName: 'Yacine',  lastName: 'Rouabah',   gender: 'M', age: 63 },
  ];

  const nfsTestIds = await prisma.test.findMany({
    where: { parentId: nfsGroup.id },
    select: { id: true, code: true },
  });

  const glyCrea = await prisma.test.findMany({
    where: { code: { in: ['GLY', 'CREA', 'CHOL', 'TG', 'ALT', 'AST'] } },
    select: { id: true, code: true },
  });

  const nfsValues: Record<string, string[]> = {
    GB:   ['7.2', '5.8', '11.3', '4.1', '8.9'],
    GR:   ['4.8', '4.2', '4.5', '4.6', '4.0'],
    HGB:  ['14.2', '12.1', '13.8', '12.9', '11.8'],
    HCT:  ['43', '37', '42', '39', '36'],
    PLT:  ['220', '185', '310', '198', '142'],
    VGM:  ['89', '88', '93', '85', '90'],
    TGMH: ['29.6', '28.8', '30.7', '28.0', '29.5'],
    CCMH: ['33.0', '32.7', '32.9', '33.1', '32.8'],
  };

  const biochimValues: Record<string, string[]> = {
    GLY:  ['0.95', '1.35', '1.12', '0.88', '1.80'],
    CREA: ['8.5', '7.2', '14.2', '6.8', '18.5'],
    CHOL: ['1.85', '2.10', '2.45', '1.62', '2.30'],
    TG:   ['1.2', '0.9', '1.8', '0.7', '2.2'],
    ALT:  ['22', '18', '45', '15', '62'],
    AST:  ['24', '20', '38', '17', '55'],
  };

  for (let i = 0; i < patients.length; i++) {
    const p = patients[i];
    const orderNum = `DEM-${String(i + 1).padStart(4, '0')}`;

    const patient = await prisma.patient.upsert({
      where: { id: `demo-patient-${i + 1}` },
      update: {},
      create: {
        id: `demo-patient-${i + 1}`,
        firstName: p.firstName,
        lastName: p.lastName,
        gender: p.gender,
        phoneNumber: `0550${String(100000 + i)}`,
        createdAt: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.analysis.upsert({
      where: { orderNumber: orderNum },
      update: {},
      create: {
        orderNumber: orderNum,
        patientId: patient.id,
        provenance: i % 2 === 0 ? 'Interne' : 'Externe',
        medecinPrescripteur: i % 3 === 0 ? 'Dr. Mansouri' : 'Dr. Belkacem',
        status: i < 3 ? 'validated' : i === 3 ? 'in_progress' : 'pending',
        totalPrice: i < 2 ? 1200 : 800,
        amountPaid: i < 2 ? 1200 : 0,
        paymentStatus: i < 2 ? 'PAID' : 'UNPAID',
        creationDate: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000),
        results: {
          create: [
            ...nfsTestIds.map((t) => ({
              testId: t.id,
              value: nfsValues[t.code]?.[i] ?? null,
              abnormal: t.code === 'PLT' && i === 4,
            })),
            ...glyCrea.map((t) => ({
              testId: t.id,
              value: biochimValues[t.code]?.[i] ?? null,
              abnormal: ['GLY','CREA','ALT','AST'].includes(t.code) && (i === 4 || i === 2),
            })),
          ],
        },
      },
    });
  }

  console.log('\n✅ Demo database seeded successfully!');
  console.log('─────────────────────────────────────');
  console.log('🔑 Admin:      admin.demo@nexlab.dz');
  console.log('🔑 Technicien: tech.demo@nexlab.dz');
  console.log(`🔑 Password:   ${DEMO_PASSWORD}`);
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
