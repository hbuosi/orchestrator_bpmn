import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { ServiceDefinitionSchema } from './schemas/service-definition.schema.js';
import { generateBpmnXml } from './generators/bpmn-xml.generator.js';
import { applyAutoLayout } from './generators/bpmn-layout.js';
import { applyColors } from './generators/bpmn-colors.js';
import { generateServiceCardHtml } from './generators/service-card.generator.js';
import { exportHtmlToPdf, exportBpmnToPdf } from './exporters/pdf.exporter.js';
import { exportBpmnToSvg } from './exporters/svg.exporter.js';
import { bpmnViewerTemplate } from './templates/bpmn-viewer.html.js';

const args = process.argv.slice(2);
const inputFile = args.find(a => !a.startsWith('--'));
const onlyFlag = args.find(a => a.startsWith('--only='))?.split('=')[1];

if (!inputFile) {
  console.error('Usage: bun run src/orchestrator.ts <service-definition.json> [--only=bpmn|card]');
  process.exit(1);
}

const raw = JSON.parse(readFileSync(inputFile, 'utf-8'));
const parsed = ServiceDefinitionSchema.safeParse(raw);

if (!parsed.success) {
  console.error('Invalid service definition:');
  console.error(parsed.error.flatten());
  process.exit(1);
}

const def = parsed.data;
const code = def.serviceCard.serviceCode.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
const outDir = path.resolve('output');
mkdirSync(outDir, { recursive: true });

const generateBpmn = (!onlyFlag || onlyFlag === 'bpmn') && def.generate.bpmn;
const generateCard = (!onlyFlag || onlyFlag === 'card') && def.generate.serviceCard;

console.log(`\nGenerating documents for: ${def.serviceCard.nameEn} (${code})\n`);

if (generateBpmn) {
  console.log('  [1/4] Generating BPMN XML...');
  const rawXml = await generateBpmnXml(def.bpmnProcess);

  console.log('  [2/4] Applying auto-layout (zero overlap)...');
  const layoutedXml = await applyAutoLayout(rawXml);

  console.log('  [3/4] Applying color conventions...');
  const coloredXml = await applyColors(layoutedXml, def.bpmnProcess);

  const xmlPath = path.join(outDir, `${code}-bpmn.xml`);
  writeFileSync(xmlPath, coloredXml);
  console.log(`       Saved: ${xmlPath}`);

  if (def.generate.standaloneHtml) {
    const viewerHtml = bpmnViewerTemplate(coloredXml, { title: def.serviceCard.nameEn });
    const htmlPath = path.join(outDir, `${code}-bpmn-viewer.html`);
    writeFileSync(htmlPath, viewerHtml);
    console.log(`       Saved: ${htmlPath}`);
  }

  if (def.generate.svg) {
    console.log('  [4/4] Exporting SVG...');
    const svg = await exportBpmnToSvg(coloredXml);
    const svgPath = path.join(outDir, `${code}-bpmn.svg`);
    writeFileSync(svgPath, svg);
    console.log(`       Saved: ${svgPath}`);
  }

  if (def.generate.pdf) {
    console.log('       Exporting BPMN PDF...');
    const viewerHtml = bpmnViewerTemplate(coloredXml, { title: def.serviceCard.nameEn });
    const pdfPath = path.join(outDir, `${code}-bpmn.pdf`);
    await exportBpmnToPdf(viewerHtml, pdfPath);
    console.log(`       Saved: ${pdfPath}`);
  }
}

if (generateCard) {
  console.log('\n  [1/2] Generating Service Card HTML...');
  const cardHtml = generateServiceCardHtml(def.serviceCard);
  const htmlPath = path.join(outDir, `${code}-service-card.html`);
  writeFileSync(htmlPath, cardHtml);
  console.log(`       Saved: ${htmlPath}`);

  if (def.generate.pdf) {
    console.log('  [2/2] Exporting Service Card PDF...');
    const pdfPath = path.join(outDir, `${code}-service-card.pdf`);
    await exportHtmlToPdf(cardHtml, pdfPath);
    console.log(`       Saved: ${pdfPath}`);
  }
}

console.log('\nDone.\n');
