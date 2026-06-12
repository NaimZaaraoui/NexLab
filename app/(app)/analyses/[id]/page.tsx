// src/app/analyses/[id]/page.tsx

import { prisma } from '@/lib/db/prisma';
import { ResultatsForm } from '@/components/analyses/ResultatsForm';

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const current = await prisma.analysis.findUnique({
    where: { id },
    select: { creationDate: true },
  });

  const [prev, next] = current
    ? await Promise.all([
        prisma.analysis.findFirst({
          where: { creationDate: { lt: current.creationDate } },
          orderBy: { creationDate: 'desc' },
          select: { id: true },
        }),
        prisma.analysis.findFirst({
          where: { creationDate: { gt: current.creationDate } },
          orderBy: { creationDate: 'asc' },
          select: { id: true },
        }),
      ])
    : [null, null];

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto w-full max-w-[1640px]">
        <ResultatsForm
          analysisId={id}
          prevId={prev?.id ?? null}
          nextId={next?.id ?? null}
        />
      </div>
    </div>
  );
}
