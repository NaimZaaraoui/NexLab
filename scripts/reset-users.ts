import bcrypt from 'bcryptjs';
import { PrismaClient } from '../app/generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const connectionString = process.env.DATABASE_URL || 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.argv[2] || 'admin@nexlab.local';
  const adminPassword = process.argv[3] || 'NexLab2026!';
  const adminName = process.argv[4] || 'Administrateur NexLab';

  const password = await bcrypt.hash(adminPassword, 12);

  await prisma.user.deleteMany({});

  const admin = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password,
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: true,
    },
  });

  console.log('All existing users deleted.');
  console.log(`New admin created: ${admin.email}`);
  console.log(`Temporary password: ${adminPassword}`);
  console.log(`Admin id: ${admin.id}`);
}

main()
  .catch((error) => {
    console.error('Failed to reset users:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
