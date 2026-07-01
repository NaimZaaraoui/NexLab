/**
 * Reset admin password script.
 * Run from the project root: node scripts/reset-admin.mjs <email> <newpassword>
 * 
 * This uses the same encrypted libSQL client as the app.
 */
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually
const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
  }
}

const DATABASE_URL = env.DATABASE_URL;
const DATABASE_ENCRYPTION_KEY = env.DATABASE_ENCRYPTION_KEY;
const DATABASE_AUTH_TOKEN = env.DATABASE_AUTH_TOKEN;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

const [,, email, password] = process.argv;

if (!email || !password) {
  console.log('Usage: node scripts/reset-admin.mjs <email> <newpassword>');
  console.log('');
  console.log('This script will:');
  console.log('  1. List all users in the database');
  console.log('  2. If email is provided, reset that user password');
  console.log('  3. If no user exists, create a new ADMIN user');
  process.exit(0);
}

const clientConfig = { url: DATABASE_URL };
if (DATABASE_ENCRYPTION_KEY) clientConfig.encryptionKey = DATABASE_ENCRYPTION_KEY;
if (DATABASE_AUTH_TOKEN) clientConfig.authToken = DATABASE_AUTH_TOKEN;

const client = createClient(clientConfig);

try {
  // List users
  const users = await client.execute('SELECT id, name, email, role, isActive FROM User');
  console.log('\n📋 Current users in database:');
  if (users.rows.length === 0) {
    console.log('  (no users found)');
  } else {
    for (const row of users.rows) {
      console.log(`  - ${row.email} [${row.role}] active=${row.isActive} name="${row.name}"`);
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const existing = users.rows.find(r => r.email === email.toLowerCase().trim());

  if (existing) {
    // Update password
    await client.execute({
      sql: 'UPDATE User SET password = ?, isActive = 1, mustChangePassword = 0 WHERE email = ?',
      args: [hashedPassword, email.toLowerCase().trim()],
    });
    console.log(`\n✅ Password updated for ${email}`);
  } else {
    // Create new admin
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await client.execute({
      sql: `INSERT INTO User (id, name, email, password, role, isActive, mustChangePassword, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, 'ADMIN', 1, 0, ?, ?)`,
      args: [id, 'Administrateur', email.toLowerCase().trim(), hashedPassword, now, now],
    });
    console.log(`\n✅ New ADMIN user created: ${email}`);
  }

  console.log(`\n🔑 You can now log in with:`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log('');

} catch (err) {
  console.error('❌ Error:', err.message);
  if (err.message?.includes('file is not a database')) {
    console.error('   The database file is encrypted but the key may not match.');
    console.error('   Check DATABASE_ENCRYPTION_KEY in your .env file.');
  }
} finally {
  client.close();
}
