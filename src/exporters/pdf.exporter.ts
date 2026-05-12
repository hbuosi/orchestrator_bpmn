import puppeteer from 'puppeteer';
import path from 'path';

export async function exportHtmlToPdf(html: string, outputPath: string): Promise<void> {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 2 });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
  });

  await browser.close();
}

export async function exportBpmnToPdf(bpmnViewerHtml: string, outputPath: string): Promise<void> {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.setContent(bpmnViewerHtml, { waitUntil: 'domcontentloaded' });
  await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });

  // Wait for bpmn-js to finish rendering
  await page.waitForSelector('.djs-container', { timeout: 10_000 });

  await page.pdf({
    path: outputPath,
    format: 'A3',
    landscape: true,
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
  });

  await browser.close();
}
