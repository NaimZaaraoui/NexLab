const { PrismaClient } = require('../app/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'admin@nexlab.local';
  const newPassword = process.argv[3] || 'NexLab2026!';

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.error(`User with email ${email} not found.`);
    process.exit(1);
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { 
      password: hashedPassword,
      mustChangePassword: true 
    }
  });

  console.log(`Password reset for ${email}.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
