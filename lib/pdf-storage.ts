import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { generateAnalysisPDF } from '@/lib/pdf-server';
import { prisma } from '@/lib/prisma';

// Utilise le répertoire de données persistant de l'application
const PDF_BASE_DIR = path.join(process.cwd(), 'data', 'pdfs');

export async function saveAnalysisPdf(analysisId: string, pdfBuffer: Buffer): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  // Ex: data/pdfs/2026/06
  const relativeDir = path.join(year, month);
  const absoluteDir = path.join(PDF_BASE_DIR, relativeDir);
  
  // Crée les dossiers si nécessaires
  await fs.mkdir(absoluteDir, { recursive: true });
  
  const filename = `${analysisId}.pdf`;
  const absolutePath = path.join(absoluteDir, filename);
  
  // Stockage chemin relatif pour la BDD (plus facile à migrer)
  const relativePath = path.join(relativeDir, filename);
  
  await fs.writeFile(absolutePath, Buffer.from(pdfBuffer));
  
  return relativePath;
}

export async function getAnalysisPdf(relativePath: string): Promise<Buffer | null> {
  const absolutePath = path.join(PDF_BASE_DIR, relativePath);
  try {
    return await fs.readFile(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function deleteAnalysisPdf(relativePath: string): Promise<boolean> {
  const absolutePath = path.join(PDF_BASE_DIR, relativePath);
  try {
    await fs.unlink(absolutePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false; // Already deleted or doesn't exist
    }
    throw error;
  }
}

export async function backgroundGenerateAndCachePdf(analysisId: string, origin: string) {
  try {
    console.log(`[PDF Cache] Starting background generation for analysis ${analysisId}`);
    // 1. Generate PDF (using existing Puppeteer logic)
    const pdfUint8Array = await generateAnalysisPDF(analysisId, origin);
    const pdfBuffer = Buffer.from(pdfUint8Array);
    
    // 2. Save to disk
    const relativePath = await saveAnalysisPdf(analysisId, pdfBuffer);
    
    // 3. Update DB with path and simple hash
    const hash = crypto.randomBytes(8).toString('hex');
    
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        pdfReportPath: relativePath,
        pdfReportHash: hash,
        pdfGeneratedAt: new Date(),
      }
    });
    console.log(`[PDF Cache] Successfully cached PDF for analysis ${analysisId}`);
  } catch (error) {
    console.error(`[PDF Cache] Background generation failed for ${analysisId}:`, error);
  }
}
