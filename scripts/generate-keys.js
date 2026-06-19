const crypto = require('crypto');

console.log('\n========================================================');
console.log('🔐 NEXLAB - GÉNÉRATEUR DE CLÉS DE SÉCURITÉ (INSTALLATION)');
console.log('========================================================\n');

console.log('Copiez-collez les lignes suivantes dans le fichier .env du nouveau laboratoire :\n');

// 1. AUTH_SECRET (Base64, 32 bytes)
const authSecret = crypto.randomBytes(32).toString('base64');
console.log(`AUTH_SECRET="${authSecret}"`);

// 2. SEAL_SECRET (Base64, 32 bytes)
const sealSecret = crypto.randomBytes(32).toString('base64');
console.log(`SEAL_SECRET="${sealSecret}"`);

// 3. INTERNAL_PRINT_TOKEN (Hex, 24 bytes)
const printToken = crypto.randomBytes(24).toString('hex');
console.log(`INTERNAL_PRINT_TOKEN="${printToken}"`);

// 4. DATABASE_ENCRYPTION_KEY (Hex, 32 bytes)
const dbKey = crypto.randomBytes(32).toString('hex');
console.log(`DATABASE_ENCRYPTION_KEY="${dbKey}"`);

// 5. BACKUP_ENCRYPTION_KEY (Hex, 32 bytes)
const backupKey = crypto.randomBytes(32).toString('hex');
console.log(`BACKUP_ENCRYPTION_KEY="${backupKey}"`);

console.log('\n========================================================');
console.log('⚠️  IMPORTANT :');
console.log('1. Ne perdez jamais la SEAL_SECRET, sinon les anciens résultats validés seront considérés comme falsifiés.');
console.log('2. Gardez une copie de la BACKUP_ENCRYPTION_KEY en lieu sûr (hors du serveur) pour pouvoir restaurer les sauvegardes en cas de crash total.');
console.log('========================================================\n');
