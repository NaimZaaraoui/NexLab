import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/authz';
import { createAuditLog, getRequestMeta } from '@/lib/audit';

const NFS_SORT_ORDER = [
  'GB', 'WBC', 'PNN', 'NEUT', 'PNNA', 'PNN_ABS', 'NEUTA',
  'LYM', 'LYMPH', 'LYMA', 'LYM_ABS', 'LYMPHA',
  'MONO', 'MONA', 'MONO_ABS', 'EOS', 'EOS_ABS',
  'BASO', 'BASA', 'BASO_ABS', 'GR', 'RBC', 'HB', 'HGB',
  'HT', 'HCT', 'VGM', 'CCMH', 'TCMH', 'PLT'
];

const DEFAULT_CATEGORY_RANKS: Record<string, number> = {
  'NFS': 0,
  'Hématologie': 1,
  'Biochimie': 2,
  'Urologie': 3,
  'Microbiologie': 4,
  'Divers': 100
};

export async function POST(request: Request) {
  try {
    const guard = await requireAnyRole(['ADMIN']);
    if (!guard.ok) return guard.error;
    const meta = getRequestMeta({ headers: request.headers });

    console.log('[API /categories/reset] Starting reset...');

    // 1. Réinitialiser les rangs des catégories
    const categories = await prisma.category.findMany();
    
    for (const category of categories) {
      const defaultRank = DEFAULT_CATEGORY_RANKS[category.name] ?? 50;
      await prisma.category.update({
        where: { id: category.id },
        data: { rank: defaultRank }
      });
    }

    console.log(`[API /categories/reset] Reset ${categories.length} category ranks`);

    // 2. Réinitialiser les rangs des tests
    const tests = await prisma.test.findMany();
    
    for (const test of tests) {
      let rank = 100; // Rang par défaut
      
      // Si le test est dans NFS_SORT_ORDER, utiliser cet ordre
      if (test.code && NFS_SORT_ORDER.includes(test.code)) {
        rank = NFS_SORT_ORDER.indexOf(test.code);
      }
      
      await prisma.test.update({
        where: { id: test.id },
        data: { rank }
      });
    }

    console.log(`[API /categories/reset] Reset ${tests.length} test ranks`);

    await createAuditLog({
      action: 'category.reset_order',
      severity: 'WARN',
      entity: 'category',
      details: {
        categoriesReset: categories.length,
        testsReset: tests.length,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Ordre réinitialisé avec succès',
      stats: {
        categoriesReset: categories.length,
        testsReset: tests.length
      }
    });

  } catch (error) {
    console.error('[API /categories/reset] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to reset order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
