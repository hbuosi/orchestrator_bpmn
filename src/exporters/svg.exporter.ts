import puppeteer from 'puppeteer';
import { bpmnViewerTemplate } from '../templates/bpmn-viewer.html.js';

export async function exportBpmnToSvg(bpmnXml: string): Promise<string> {
  const html = bpmnViewerTemplate(bpmnXml, { hiddenForExport: true });

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.djs-container', { timeout: 10_000 });

  // Extract SVG from bpmn-js canvas
  const svg = await page.evaluate(() => {
    const container = document.querySelector('.djs-container svg');
    return container ? container.outerHTML : null;
  });

  await browser.close();

  if (!svg) throw new Error('Failed to extract SVG from bpmn-js renderer');
  return svg;
}
