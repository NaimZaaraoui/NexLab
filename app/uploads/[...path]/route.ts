import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  props: { params: Promise<{ path: string[] }> }
) {
  try {
    const params = await props.params;
    
    // Construct the absolute path to the file in the public/uploads directory.
    // In Next.js standalone, process.cwd() is the root of the app where public exists.
    const filePath = path.join(process.cwd(), 'public', 'uploads', ...params.path);
    
    // Check if file exists and read it
    const file = await fs.readFile(filePath);
    
    // Determine content type based on extension
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.webp') contentType = 'image/webp';
    
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        // Add cache control headers so the browser doesn't re-fetch unchanged images needlessly
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error) {
    // Return 404 if the file isn't found
    return new NextResponse('File not found', { status: 404 });
  }
}
