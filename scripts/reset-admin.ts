import 'dotenv/config';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    encryptionKey: process.env.DATABASE_ENCRYPTION_KEY,
  });

  const [,, email, password] = process.argv;

  try {
    // List all tables first
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    console.log('\n📋 Database tables:', tables.rows.map(r => r.name).join(', '));

    // Determine user table name
    const userTable = tables.rows.find(r => String(r.name).toLowerCase() === 'users') ? 'users' : 'User';
    const users = await client.execute(`SELECT id, name, email, role, isActive FROM "${userTable}" LIMIT 20`);
    
    console.log('\n👤 Users in database:');
    if (users.rows.length === 0) {
      console.log('  (no users found)');
    } else {
      for (const row of users.rows) {
        console.log(`  - [${row.role}] ${row.email}  (${row.name})  active=${row.isActive}`);
      }
    }

    if (email && password) {
      const hashed = await bcrypt.hash(password, 12);
      const existing = users.rows.find(r => String(r.email).toLowerCase() === email.toLowerCase());
      
      if (existing) {
        await client.execute({
          sql: `UPDATE "${userTable}" SET password = ?, isActive = 1, mustChangePassword = 0 WHERE email = ?`,
          args: [hashed, email.toLowerCase()],
        });
        console.log(`\n✅ Password reset for: ${email}`);
      } else {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        await client.execute({
          sql: `INSERT INTO "${userTable}" (id, name, email, password, role, isActive, mustChangePassword, createdAt, updatedAt) VALUES (?, 'Administrateur', ?, ?, 'ADMIN', 1, 0, ?, ?)`,
          args: [id, email.toLowerCase(), hashed, now, now],
        });
        console.log(`\n✅ New ADMIN user created: ${email}`);
      }
      
      console.log(`\n🔑 Login credentials:`);
      console.log(`   Email:    ${email}`);
      console.log(`   Password: ${password}`);
    } else {
      console.log('\n💡 To reset a password: node --import tsx scripts/reset-admin.ts admin@lab.dz newpassword');
    }

  } catch (err: any) {
    console.error('❌ Error:', err.message);
  } finally {
    client.close();
  }
}

main();
