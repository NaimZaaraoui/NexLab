import { prisma } from '../lib/prisma';

async function main() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ['lab_stamp_image', 'lab_bio_signature']
      }
    }
  });

  for (const s of settings) {
    console.log(`${s.key}: ${s.value.length} characters`);
  }
}

main();
