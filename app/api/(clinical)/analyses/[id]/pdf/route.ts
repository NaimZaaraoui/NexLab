import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAuthUser, getInternalPrintToken } from '@/lib/security/authz';
import { getAnalysisPdf, backgroundGenerateAndCachePdf } from '@/lib/documents/pdf-storage';
import type { AnalysisStatus } from '@/lib/analysis/status-flow';
import { isTerminalStatus } from '@/lib/analysis/status-flow';
import { generateAnalysisPDF } from '@/lib/documents/pdf-server';

function toPdfResponse(data: Buffer | Uint8Array, filename: string, source: 'cache' | 'dynamic') {
  const bytes = new Uint8Array(data);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': data.byteLength.toString(),
      'Cache-Control': source === 'cache' ? 'private, max-age=3600' : 'no-store',
      'X-PDF-Source': source,
    }
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuthUser();
    if (!guard.ok) return guard.error;

    const { id } = await params;

    const analysis = await prisma.analysis.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        pdfReportPath: true,
        orderNumber: true,
        patientLastName: true,
      }
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analyse introuvable' }, { status: 404 });
    }

    const origin = request.headers.get('origin') || `http://${request.headers.get('host')}` || 'http://localhost:3000';
    const safeName = `rapport_${analysis.patientLastName || 'patient'}_${analysis.orderNumber}.pdf`;
    const status = (analysis.status ?? 'pending') as AnalysisStatus;

    // ✅ Cas 1 : Rapport validé + PDF en cache → service direct (instantané, 0% CPU)
    if (isTerminalStatus(status) && analysis.pdfReportPath) {
      const pdfBuffer = await getAnalysisPdf(analysis.pdfReportPath);

      if (pdfBuffer) {
        return toPdfResponse(pdfBuffer, safeName, 'cache');
      }

      // Fichier absent du disque (ex: restauration) → régénère silencieusement
      Promise.resolve().then(() => backgroundGenerateAndCachePdf(id, origin));
    }

    const printToken = getInternalPrintToken();
    const pdfData = await generateAnalysisPDF(id, origin, printToken);
    return toPdfResponse(Buffer.from(pdfData), safeName, 'dynamic');

  } catch (error) {
    console.error('[PDF Route] Error:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération du rapport PDF.' }, { status: 500 });
  }
}
