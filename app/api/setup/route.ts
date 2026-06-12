import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

async function isAlreadySetup(): Promise<boolean> {
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  return adminCount > 0;
}

export async function GET() {
  try {
    const done = await isAlreadySetup();
    return NextResponse.json({ setupDone: done });
  } catch {
    return NextResponse.json({ setupDone: false });
  }
}

export async function POST(request: Request) {
  try {
    if (await isAlreadySetup()) {
      return NextResponse.json(
        { error: 'Ce système est déjà configuré. Accès refusé.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      labName, labSubtitle, labParent, labAddress1, labAddress2,
      labPhone, labEmail, labBioName, labBioTitle,
      adminName, adminEmail, adminPassword, includeDemo,
    } = body;

    if (!labName?.trim()) {
      return NextResponse.json({ error: 'Le nom du laboratoire est requis.' }, { status: 400 });
    }
    if (!adminEmail?.trim() || !adminName?.trim() || !adminPassword?.trim()) {
      return NextResponse.json({ error: 'Les informations du compte administrateur sont requises.' }, { status: 400 });
    }
    if (adminPassword.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // ── 1. Lab settings (sequential upserts — no transaction to avoid libSQL timeout) ──
    const settings = [
      { key: 'lab_name',           value: labName },
      { key: 'lab_subtitle',       value: labSubtitle || 'Service de Laboratoire' },
      { key: 'lab_parent',         value: labParent || '' },
      { key: 'lab_address_1',      value: labAddress1 || '' },
      { key: 'lab_address_2',      value: labAddress2 || '' },
      { key: 'lab_phone',          value: labPhone || '' },
      { key: 'lab_email',          value: labEmail || '' },
      { key: 'lab_bio_name',       value: labBioName || '' },
      { key: 'lab_bio_title',      value: labBioTitle || 'Docteur' },
      { key: 'lab_bio_onmpt',      value: '' },
      { key: 'lab_footer_text',    value: '' },
      { key: 'lab_stamp_image',    value: '' },
      { key: 'lab_bio_signature',  value: '' },
      { key: 'tat_warn',           value: '45' },
      { key: 'tat_alert',          value: '60' },
      { key: 'sample_types',       value: 'Sang total, Sérum, Plasma, Urine, LCR, Plèvre, Ascite' },
      { key: 'sample_containers',  value: 'Tube EDTA, Tube sec, Tube citrate, Tube héparine, Tube gel séparateur, Flacon urines, Écouvillon, Pot stérile' },
      { key: 'sample_conditions',  value: 'Conforme, Hémolysé, Lipémique, Ictérique, Coagulé, Volume insuffisant, Tube mal identifié, Échantillon altéré' },
      { key: 'provenance_options', value: 'Consultation, Externe, Interne, Urgence, Médecin traitant, Maternité, Chirurgie' },
      { key: 'prescriber_options', value: '' },
      { key: 'amount_unit',        value: 'DA' },
      { key: 'diatron_enabled',    value: 'false' },
    ];

    for (const s of settings) {
      await prisma.setting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: s,
      });
    }

    // ── 2. Admin user ─────────────────────────────────────────────────────────
    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail.toLowerCase().trim(),
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        mustChangePassword: true,
      },
    });

    // ── 3. Demo test catalog (optional, batched to stay within libSQL limits) ─
    if (includeDemo) {
      const [hematoCat, bioCat, ionoCat, hepatoCat, thyroidCat, seroCat, lipidCat, coagCat] =
        await Promise.all([
          prisma.category.upsert({ where: { name: 'Hématologie' },    update: { rank: 1, icon: 'droplets' },      create: { name: 'Hématologie',    rank: 1, icon: 'droplets' } }),
          prisma.category.upsert({ where: { name: 'Biochimie' },      update: { rank: 2, icon: 'flask-conical' }, create: { name: 'Biochimie',      rank: 2, icon: 'flask-conical' } }),
          prisma.category.upsert({ where: { name: 'Ionogramme' },     update: { rank: 3, icon: 'wave' },          create: { name: 'Ionogramme',     rank: 3, icon: 'wave' } }),
          prisma.category.upsert({ where: { name: 'Bilan Hépatique' },update: { rank: 4, icon: 'activity' },      create: { name: 'Bilan Hépatique',rank: 4, icon: 'activity' } }),
          prisma.category.upsert({ where: { name: 'Thyroïde' },       update: { rank: 5, icon: 'zap' },           create: { name: 'Thyroïde',       rank: 5, icon: 'zap' } }),
          prisma.category.upsert({ where: { name: 'Sérologie' },      update: { rank: 6, icon: 'shield' },        create: { name: 'Sérologie',      rank: 6, icon: 'shield' } }),
          prisma.category.upsert({ where: { name: 'Bilan Lipidique' },update: { rank: 7, icon: 'heart' },         create: { name: 'Bilan Lipidique',rank: 7, icon: 'heart' } }),
          prisma.category.upsert({ where: { name: 'Hémostase' },      update: { rank: 8, icon: 'droplet' },       create: { name: 'Hémostase',      rank: 8, icon: 'droplet' } }),
        ]);

      type DemoTest = {
        code: string; name: string; categoryId: string; unit?: string;
        minValue?: number; maxValue?: number;
        minValueM?: number; maxValueM?: number;
        minValueF?: number; maxValueF?: number;
        price: number; rank?: number; decimals?: number;
      };

      const demoTests: DemoTest[] = [
        { code: 'NFS-RBC',   name: 'Globules Rouges (GR)',          categoryId: hematoCat.id,  unit: '10^6/µL', minValueM: 4.5, maxValueM: 5.9, minValueF: 3.8, maxValueF: 5.1, price: 8,  rank: 1 },
        { code: 'NFS-HGB',   name: 'Hémoglobine',                   categoryId: hematoCat.id,  unit: 'g/dL',   minValueM: 13,  maxValueM: 17,  minValueF: 12,  maxValueF: 16,  price: 8,  rank: 2 },
        { code: 'NFS-HCT',   name: 'Hématocrite',                   categoryId: hematoCat.id,  unit: '%',      minValueM: 40,  maxValueM: 54,  minValueF: 36,  maxValueF: 47,  price: 8,  rank: 3 },
        { code: 'NFS-VGM',   name: 'VGM',                           categoryId: hematoCat.id,  unit: 'fL',     minValue: 80,   maxValue: 100,  price: 0, rank: 4 },
        { code: 'NFS-TGMH',  name: 'TGMH',                          categoryId: hematoCat.id,  unit: 'pg',     minValue: 27,   maxValue: 33,   price: 0, rank: 5 },
        { code: 'NFS-CCMH',  name: 'CCMH',                          categoryId: hematoCat.id,  unit: 'g/dL',   minValue: 32,   maxValue: 36,   price: 0, rank: 6 },
        { code: 'NFS-WBC',   name: 'Leucocytes (GB)',                categoryId: hematoCat.id,  unit: '10^3/µL',minValue: 4,    maxValue: 10,   price: 8, rank: 7 },
        { code: 'NFS-NEU',   name: 'Neutrophiles',                  categoryId: hematoCat.id,  unit: '%',      minValue: 50,   maxValue: 70,   price: 0, rank: 8 },
        { code: 'NFS-LYM',   name: 'Lymphocytes',                   categoryId: hematoCat.id,  unit: '%',      minValue: 20,   maxValue: 40,   price: 0, rank: 9 },
        { code: 'NFS-MON',   name: 'Monocytes',                     categoryId: hematoCat.id,  unit: '%',      minValue: 2,    maxValue: 10,   price: 0, rank: 10 },
        { code: 'NFS-EOS',   name: 'Éosinophiles',                  categoryId: hematoCat.id,  unit: '%',      minValue: 1,    maxValue: 5,    price: 0, rank: 11 },
        { code: 'NFS-BAS',   name: 'Basophiles',                    categoryId: hematoCat.id,  unit: '%',      minValue: 0,    maxValue: 1,    price: 0, rank: 12 },
        { code: 'NFS-PLT',   name: 'Plaquettes (PLT)',              categoryId: hematoCat.id,  unit: '10^3/µL',minValue: 150,  maxValue: 400,  price: 8, rank: 13 },
        { code: 'NFS-VS1',   name: 'VS 1ère heure',                 categoryId: hematoCat.id,  unit: 'mm/h',   minValueM: 3,   maxValueM: 15,  minValueF: 6, maxValueF: 20, price: 5, rank: 14 },
        { code: 'HEM-TP',    name: 'Taux de Prothrombine (TP)',     categoryId: coagCat.id,    unit: '%',      minValue: 70,   maxValue: 100,  price: 10, rank: 1 },
        { code: 'HEM-INR',   name: 'INR',                           categoryId: coagCat.id,    unit: '',       minValue: 0.8,  maxValue: 1.2,  price: 0,  rank: 2 },
        { code: 'HEM-TCA',   name: 'TCA',                           categoryId: coagCat.id,    unit: 's',      minValue: 26,   maxValue: 40,   price: 10, rank: 3 },
        { code: 'HEM-FIB',   name: 'Fibrinogène',                  categoryId: coagCat.id,    unit: 'g/L',    minValue: 2,    maxValue: 4,    price: 12, rank: 4 },
        { code: 'BIO-GLU',   name: 'Glycémie',                      categoryId: bioCat.id,     unit: 'g/L',    minValue: 0.7,  maxValue: 1.1,  price: 10, rank: 1 },
        { code: 'BIO-HBA1C', name: 'HbA1c',                         categoryId: bioCat.id,     unit: '%',      minValue: 4,    maxValue: 5.7,  price: 18, rank: 2 },
        { code: 'BIO-UREE',  name: 'Urée',                          categoryId: bioCat.id,     unit: 'g/L',    minValue: 0.15, maxValue: 0.45, price: 10, rank: 3 },
        { code: 'BIO-CREA',  name: 'Créatinine',                    categoryId: bioCat.id,     unit: 'mg/L',   minValueM: 7,   maxValueM: 13,  minValueF: 6, maxValueF: 11, price: 10, rank: 4 },
        { code: 'DFG',       name: 'DFG estimé CKD-EPI 2021',      categoryId: bioCat.id,     unit: 'mL/min/1.73m²', minValue: 60, price: 0, rank: 5, decimals: 0 },
        { code: 'BIO-AU',    name: 'Acide Urique',                  categoryId: bioCat.id,     unit: 'mg/L',   minValueM: 35,  maxValueM: 70,  minValueF: 25, maxValueF: 60, price: 10, rank: 6 },
        { code: 'BIO-PROT',  name: 'Protéines Totales',             categoryId: bioCat.id,     unit: 'g/L',    minValue: 60,   maxValue: 80,   price: 10, rank: 7 },
        { code: 'BIO-ALB',   name: 'Albumine',                      categoryId: bioCat.id,     unit: 'g/L',    minValue: 35,   maxValue: 50,   price: 10, rank: 8 },
        { code: 'ION-NA',    name: 'Sodium (Na+)',                  categoryId: ionoCat.id,    unit: 'mEq/L',  minValue: 135,  maxValue: 145,  price: 10, rank: 1 },
        { code: 'ION-K',     name: 'Potassium (K+)',                categoryId: ionoCat.id,    unit: 'mEq/L',  minValue: 3.5,  maxValue: 5.0,  price: 10, rank: 2 },
        { code: 'ION-CL',    name: 'Chlore (Cl-)',                  categoryId: ionoCat.id,    unit: 'mEq/L',  minValue: 95,   maxValue: 107,  price: 10, rank: 3 },
        { code: 'ION-CA',    name: 'Calcium (Ca2+)',                categoryId: ionoCat.id,    unit: 'mg/L',   minValue: 85,   maxValue: 105,  price: 10, rank: 4 },
        { code: 'ION-MG',    name: 'Magnésium (Mg2+)',             categoryId: ionoCat.id,    unit: 'mg/L',   minValue: 18,   maxValue: 24,   price: 10, rank: 5 },
        { code: 'ION-PHOS',  name: 'Phosphore',                     categoryId: ionoCat.id,    unit: 'mg/L',   minValue: 25,   maxValue: 45,   price: 10, rank: 6 },
        { code: 'HEP-ASAT',  name: 'ASAT (TGO)',                    categoryId: hepatoCat.id,  unit: 'UI/L',   minValue: 0,    maxValue: 40,   price: 12, rank: 1 },
        { code: 'HEP-ALAT',  name: 'ALAT (TGP)',                    categoryId: hepatoCat.id,  unit: 'UI/L',   minValue: 0,    maxValue: 40,   price: 12, rank: 2 },
        { code: 'HEP-GGT',   name: 'GGT (Gamma GT)',                categoryId: hepatoCat.id,  unit: 'UI/L',   minValueM: 0,   maxValueM: 50,  minValueF: 0, maxValueF: 35, price: 12, rank: 3 },
        { code: 'HEP-PAL',   name: 'Phosphatases Alcalines (PAL)', categoryId: hepatoCat.id,  unit: 'UI/L',   minValue: 40,   maxValue: 130,  price: 12, rank: 4 },
        { code: 'HEP-BILT',  name: 'Bilirubine Totale',             categoryId: hepatoCat.id,  unit: 'mg/L',   minValue: 2,    maxValue: 10,   price: 10, rank: 5 },
        { code: 'HEP-BILD',  name: 'Bilirubine Directe',            categoryId: hepatoCat.id,  unit: 'mg/L',   minValue: 0,    maxValue: 2.5,  price: 10, rank: 6 },
        { code: 'HEP-LDH',   name: 'LDH',                           categoryId: hepatoCat.id,  unit: 'UI/L',   minValue: 120,  maxValue: 240,  price: 12, rank: 7 },
        { code: 'THY-TSH',   name: 'TSH',                           categoryId: thyroidCat.id, unit: 'µUI/mL', minValue: 0.4,  maxValue: 4.0,  price: 20, rank: 1 },
        { code: 'THY-T4L',   name: 'T4 Libre (FT4)',                categoryId: thyroidCat.id, unit: 'ng/dL',  minValue: 0.8,  maxValue: 1.8,  price: 20, rank: 2 },
        { code: 'THY-T3L',   name: 'T3 Libre (FT3)',                categoryId: thyroidCat.id, unit: 'pg/mL',  minValue: 2.3,  maxValue: 4.2,  price: 20, rank: 3 },
        { code: 'SER-CRP',   name: 'CRP (Protéine C-Réactive)',     categoryId: seroCat.id,    unit: 'mg/L',   minValue: 0,    maxValue: 5,    price: 12, rank: 1 },
        { code: 'SER-ASLO',  name: 'ASLO',                          categoryId: seroCat.id,    unit: 'UI/mL',  minValue: 0,    maxValue: 200,  price: 15, rank: 2 },
        { code: 'SER-WIDAL', name: 'Widal-Félix',                  categoryId: seroCat.id,    unit: '',       price: 15, rank: 3 },
        { code: 'SER-TOXO',  name: 'Toxoplasmose IgG',              categoryId: seroCat.id,    unit: 'UI/mL',  price: 20, rank: 4 },
        { code: 'SER-HBS',   name: 'Ag HBs',                        categoryId: seroCat.id,    unit: '',       price: 20, rank: 5 },
        { code: 'SER-VIH',   name: 'Sérologie VIH (combiné)',       categoryId: seroCat.id,    unit: '',       price: 25, rank: 6 },
        { code: 'LIP-CT',    name: 'Cholestérol Total',             categoryId: lipidCat.id,   unit: 'g/L',    minValue: 0,    maxValue: 2.0,  price: 10, rank: 1 },
        { code: 'LIP-TG',    name: 'Triglycérides',                categoryId: lipidCat.id,   unit: 'g/L',    minValue: 0.5,  maxValue: 1.5,  price: 10, rank: 2 },
        { code: 'LIP-HDL',   name: 'HDL-Cholestérol',              categoryId: lipidCat.id,   unit: 'g/L',    minValueM: 0.4, maxValueM: 1.8, minValueF: 0.5, maxValueF: 2.0, price: 10, rank: 3 },
        { code: 'LIP-LDL',   name: 'LDL-Cholestérol',              categoryId: lipidCat.id,   unit: 'g/L',    minValue: 0,    maxValue: 1.6,  price: 10, rank: 4 },
      ];

      // Upsert in parallel batches of 8 to stay within Turso connection limits
      const BATCH = 8;
      for (let i = 0; i < demoTests.length; i += BATCH) {
        const batch = demoTests.slice(i, i + BATCH);
        await Promise.all(batch.map((t) =>
          prisma.test.upsert({
            where:  { code: t.code },
            update: { name: t.name, unit: t.unit ?? null, categoryId: t.categoryId, minValue: t.minValue ?? null, maxValue: t.maxValue ?? null, minValueM: t.minValueM ?? null, maxValueM: t.maxValueM ?? null, minValueF: t.minValueF ?? null, maxValueF: t.maxValueF ?? null, price: t.price, rank: t.rank ?? 0, decimals: t.decimals ?? 1 },
            create: { name: t.name, code: t.code, unit: t.unit ?? null, categoryId: t.categoryId, minValue: t.minValue ?? null, maxValue: t.maxValue ?? null, minValueM: t.minValueM ?? null, maxValueM: t.maxValueM ?? null, minValueF: t.minValueF ?? null, maxValueF: t.maxValueF ?? null, price: t.price, rank: t.rank ?? 0, decimals: t.decimals ?? 1 },
          })
        ));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Setup API error:', error);
    return NextResponse.json({ error: 'La configuration a échoué. Veuillez réessayer.' }, { status: 500 });
  }
}
