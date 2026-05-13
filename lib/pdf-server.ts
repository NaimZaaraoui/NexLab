import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

function resolveChromiumPath() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ].filter(Boolean) as string[];

  const existing = candidates.find((path) => fs.existsSync(path));
  return { existing, candidates };
}

export async function generateAnalysisPDF(analysisId: string, origin?: string, printToken?: string) {
  const { existing: executablePath, candidates } = resolveChromiumPath();
  if (!executablePath) {
    throw new Error(
      `Chromium introuvable. Définissez CHROMIUM_PATH. Chemins testés: ${candidates.join(', ')}`
    );
  }

  const port = process.env.PORT || 3000;
  const baseUrl = origin ? `${origin}/analyses/${analysisId}/export` : `http://127.0.0.1:${port}/analyses/${analysisId}/export`;
  const url = printToken
    ? `${baseUrl}?printToken=${encodeURIComponent(printToken)}`
    : baseUrl;

  const launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-crash-reporter',
    '--crash-dumps-dir=/tmp',
  ];

  const maxAttempts = 2;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
    try {
      browser = await puppeteer.launch({
        executablePath,
        args: launchArgs,
        headless: true,
      });

      const page = await browser.newPage();
      page.setDefaultTimeout(30000);
      page.setDefaultNavigationTimeout(30000);
      await page.setViewport({ width: 1240, height: 1754 });

      console.log(`Puppeteer visiting (attempt ${attempt}/${maxAttempts}): ${url}`);

      page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
      page.on('pageerror', (err: unknown) => console.log('PAGE ERROR:', err instanceof Error ? err.message : String(err)));
      page.on('response', (response) => console.log('PAGE RESPONSE:', response.url(), response.status()));
      page.on('requestfailed', (request) => console.log('PAGE REQUEST FAILED:', request.url(), request.failure()?.errorText));

      await page.goto(url, {
        waitUntil: 'networkidle0', // Better for fonts and external assets
        timeout: 30000,
      });

      await page.waitForSelector('#render-complete', { timeout: 20000 });
      // Ensure all custom fonts (like Inter) are fully loaded and rendered
      await page.evaluateHandle('document.fonts.ready');
      
      // Ensure all images (Signature, Stamp, Logos) are fully downloaded and decoded
      await page.evaluate(async () => {
        const images = Array.from(document.querySelectorAll('img'));
        await Promise.all(images.map(img => {
          if (img.complete) return;
          return new Promise((resolve) => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve); // Resolve on error to avoid infinite hang
          });
        }));
      });

      // Force white background globally to prevent gray background artifacts
      await page.addStyleTag({ content: 'body, html, main { background: white !important; background-color: white !important; }' });
      
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      return pdfBuffer;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      const shouldRetry =
        attempt < maxAttempts &&
        (message.includes('navigating frame was detached') ||
          message.includes('lifecyclewatcher disposed') ||
          message.includes('target closed'));

      console.error(`Error generating PDF with Puppeteer (attempt ${attempt}/${maxAttempts}):`, error);
      if (!shouldRetry) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Erreur inconnue lors de la génération du PDF');
}
