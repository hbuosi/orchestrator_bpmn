import puppeteer from 'puppeteer';

const PUPPETEER_ARGS = ['--no-sandbox', '--disable-dev-shm-usage'];

export async function exportHtmlToPdf(html: string, outputPath: string): Promise<void> {
  const browser = await puppeteer.launch({ headless: true, args: PUPPETEER_ARGS });
  const page = await browser.newPage();
  await page.setViewport({ width: 1587, height: 1122, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({
    path: outputPath,
    format: 'A3',
    landscape: true,
    printBackground: true,
    margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' },
  });
  await browser.close();
}

export async function exportBpmnToPdf(bpmnViewerHtml: string, outputPath: string): Promise<void> {
  const browser = await puppeteer.launch({ headless: true, args: PUPPETEER_ARGS });
  const page = await browser.newPage();
  await page.setViewport({ width: 1587, height: 1122, deviceScaleFactor: 2 });
  // 'load' waits for CDN scripts; data-bpmn-ready signals importXML completion
  await page.setContent(bpmnViewerHtml, { waitUntil: 'load' });
  await page.waitForSelector('[data-bpmn-ready]', { timeout: 20_000 });
  await page.pdf({
    path: outputPath,
    format: 'A3',
    landscape: true,
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
  });
  await browser.close();
}

export async function exportCombinedToPdf(combinedHtml: string, outputPath: string): Promise<void> {
  const browser = await puppeteer.launch({ headless: true, args: PUPPETEER_ARGS });
  const page = await browser.newPage();
  await page.setViewport({ width: 1587, height: 1122, deviceScaleFactor: 2 });
  await page.setContent(combinedHtml, { waitUntil: 'load' });
  await page.waitForSelector('[data-bpmn-ready]', { timeout: 20_000 });
  await page.pdf({
    path: outputPath,
    format: 'A3',
    landscape: true,
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
  });
  await browser.close();
}
