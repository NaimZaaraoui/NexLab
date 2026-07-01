import 'dotenv/config';
import { prisma } from '../lib/db/prisma';

async function migrateQcAccumulation() {
  console.log('--- NexLab LIMS: Migration Données QC Accumulation ---');

  const targets = await prisma.qcTarget.findMany({
    where: {
      controlMode: 'STATISTICAL'
    }
  });

  console.log(`Trouvé ${targets.length} cibles statistiques à migrer.`);

  let migratedCount = 0;

  for (const target of targets) {
    // Re-compter les points existants non exclus
    const values = await prisma.qcValue.findMany({
      where: {
        testCode: target.testCode,
        result: { lotId: target.lotId },
        isExcluded: false,
      },
      orderBy: {
        result: { performedAt: 'asc' }
      },
      select: { measured: true, id: true, flag: true }
    });

    const validPoints = values.length;

    if (validPoints >= 20) {
      // Calculer meanLoc et sdLoc sur les 20 premiers points (ou les plus récents ? En fait sur les 20 plus récents pour être cohérent avec le roulement si jamais)
      // Standard: on prend les 20 premiers points historiques pour fixer la cible locale initiale.
      const first20 = values.slice(0, 20);
      const measurements = first20.map(v => v.measured);

      const sum = measurements.reduce((a, b) => a + b, 0);
      const meanLoc = sum / measurements.length;
      
      const varianceSum = measurements.reduce((a, b) => a + Math.pow(b - meanLoc, 2), 0);
      const sdLoc = Math.sqrt(varianceSum / (measurements.length - 1));

      await prisma.qcTarget.update({
        where: { id: target.id },
        data: {
          phase: 'ROUTINE',
          validPoints,
          meanLoc,
          sdLoc
        }
      });
      migratedCount++;

      // Marquer les points précédents comme "accumulation" si on veut être strict, mais pas obligatoire.
    } else {
      await prisma.qcTarget.update({
        where: { id: target.id },
        data: {
          phase: 'ACCUMULATION',
          validPoints,
          meanLoc: null,
          sdLoc: null
        }
      });
      migratedCount++;
    }
  }

  console.log(`✅ SUCCÈS: ${migratedCount} cibles mises à jour.`);
}

migrateQcAccumulation()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
