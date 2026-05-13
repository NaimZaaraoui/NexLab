const { SignJWT } = require('jose');
const fs = require('fs');

/**
 * NexLab License Generator (Vendor Script)
 * Run this locally on your machine to generate a license key for a client.
 * 
 * Usage: node generate-license.js <MACHINE_ID> <DAYS_VALID>
 * Example: node generate-license.js NXL-A1B2-C3D4 365
 */

// MUST match the secret in lib/license.ts
const LICENSE_SECRET = new TextEncoder().encode('nexlab_super_secret_vendor_key_2026_!@#$');

async function generate() {
  const machineId = process.argv[2];
  const days = parseInt(process.argv[3], 10);

  if (!machineId) {
    console.error('Erreur: Vous devez spécifier le MACHINE_ID du client.');
    console.log('Usage: node generate-license.js <MACHINE_ID> <DAYS>');
    process.exit(1);
  }

  if (!days || isNaN(days)) {
    console.error('Erreur: Vous devez spécifier le nombre de jours de validité (ex: 365).');
    process.exit(1);
  }

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);

  try {
    const jwt = await new SignJWT({ machineId, type: 'NEXLAB_PRO' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('NexLab Vendor')
      .setAudience('NexLab Client')
      .setExpirationTime(`${days}d`)
      .sign(LICENSE_SECRET);

    console.log('\n======================================================');
    console.log('✨ LICENCE GÉNÉRÉE AVEC SUCCÈS ✨');
    console.log('======================================================\n');
    console.log(`🔑 Client Machine ID : ${machineId}`);
    console.log(`📅 Valide jusqu'au   : ${expirationDate.toLocaleDateString('fr-FR')} (${days} jours)\n`);
    console.log('📋 CLÉ À FOURNIR AU CLIENT :');
    console.log('\n' + jwt + '\n');
    console.log('======================================================');

  } catch (err) {
    console.error('Erreur lors de la génération:', err);
  }
}

generate();
