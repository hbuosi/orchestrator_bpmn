import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { definitionFromText } from './llm/definition-from-text.js';
import { generateBpmnXml } from './generators/bpmn-xml.generator.js';
import { applyAutoLayout } from './generators/bpmn-layout.js';
import { applyColors } from './generators/bpmn-colors.js';
import { generateServiceCardHtml } from './generators/service-card.generator.js';
import { exportHtmlToPdf, exportBpmnToPdf } from './exporters/pdf.exporter.js';
import { exportBpmnToSvg } from './exporters/svg.exporter.js';
import { bpmnViewerTemplate } from './templates/bpmn-viewer.html.js';

// ─── Parse args ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help') {
  console.log(`
Usage:
  bun run generate:from-text "description of the service"
  bun run generate:from-text --file description.txt
  bun run generate:from-text --save-json   (also saves the generated JSON to examples/)

Options:
  --file <path>   Read description from a text file instead of inline
  --save-json     Save the generated service-definition.json to examples/
  --only=bpmn     Generate BPMN only
  --only=card     Generate service card only

Examples:
  bun run generate:from-text "Trade name reservation for Abu Dhabi businesses, online only, AED 620, 1 business day SLA"
  bun run generate:from-text --file services/vehicle-registration.txt --save-json
`);
  process.exit(0);
}

const saveJson = args.includes('--save-json');
const onlyFlag = args.find(a => a.startsWith('--only='))?.split('=')[1];
const fileFlag = args.findIndex(a => a === '--file');
const otherArgs = args.filter(a => !a.startsWith('--'));

let description: string;
if (fileFlag !== -1) {
  const filePath = args[fileFlag + 1];
  if (!filePath) { console.error('--file requires a path argument'); process.exit(1); }
  description = readFileSync(filePath, 'utf-8').trim();
} else {
  description = otherArgs.join(' ').trim();
}

if (!description) {
  console.error('Error: provide a service description as argument or via --file');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY is not set. Add it to your .env file.');
  process.exit(1);
}

// ─── Run ─────────────────────────────────────────────────────────────────────
console.log('\nGenerating service definition from description...\n');
console.log(`  "${description.slice(0, 120)}${description.length > 120 ? '...' : ''}"\n`);

const def = await definitionFromText(description);
const code = def.serviceCard.serviceCode.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
const outDir = path.resolve('output');
mkdirSync(outDir, { recursive: true });

console.log(`  Service: ${def.serviceCard.nameEn}`);
console.log(`  Code:    ${def.serviceCard.serviceCode}`);

if (saveJson) {
  const jsonPath = path.resolve(`examples/${code}.service-definition.json`);
  writeFileSync(jsonPath, JSON.stringify(def, null, 2));
  console.log(`  JSON:    examples/${code}.service-definition.json\n`);
}

const generateBpmn = (!onlyFlag || onlyFlag === 'bpmn') && def.generate.bpmn;
const generateCard = (!onlyFlag || onlyFlag === 'card') && def.generate.serviceCard;

if (generateBpmn) {
  console.log('\n  [BPMN 1/4] Generating XML...');
  const rawXml = await generateBpmnXml(def.bpmnProcess);

  console.log('  [BPMN 2/4] Applying auto-layout...');
  const layoutedXml = await applyAutoLayout(rawXml);

  console.log('  [BPMN 3/4] Applying colors...');
  const coloredXml = await applyColors(layoutedXml, def.bpmnProcess);

  writeFileSync(path.join(outDir, `${code}-bpmn.xml`), coloredXml);
  console.log(`       → ${code}-bpmn.xml`);

  if (def.generate.standaloneHtml) {
    const viewerHtml = bpmnViewerTemplate(coloredXml, { title: def.serviceCard.nameEn });
    writeFileSync(path.join(outDir, `${code}-bpmn-viewer.html`), viewerHtml);
    console.log(`       → ${code}-bpmn-viewer.html`);
  }

  console.log('  [BPMN 4/4] Exporting SVG + PDF...');
  const svg = await exportBpmnToSvg(coloredXml);
  writeFileSync(path.join(outDir, `${code}-bpmn.svg`), svg);
  console.log(`       → ${code}-bpmn.svg`);

  const viewerHtml = bpmnViewerTemplate(coloredXml, { title: def.serviceCard.nameEn });
  await exportBpmnToPdf(viewerHtml, path.join(outDir, `${code}-bpmn.pdf`));
  console.log(`       → ${code}-bpmn.pdf`);
}

if (generateCard) {
  console.log('\n  [Card 1/2] Generating HTML...');
  const cardHtml = generateServiceCardHtml(def.serviceCard);
  writeFileSync(path.join(outDir, `${code}-service-card.html`), cardHtml);
  console.log(`       → ${code}-service-card.html`);

  console.log('  [Card 2/2] Exporting PDF...');
  await exportHtmlToPdf(cardHtml, path.join(outDir, `${code}-service-card.pdf`));
  console.log(`       → ${code}-service-card.pdf`);
}

console.log(`\nDone. Files in output/${code}-*\n`);
