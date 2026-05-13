import { readdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const args = process.argv.slice(2);
const outDir = path.resolve('output');

if (!existsSync(outDir) || readdirSync(outDir).length === 0) {
  console.error('\nNo files in output/ yet. Run generate first.\n');
  process.exit(1);
}

const files = readdirSync(outDir).map(f => path.join(outDir, f));

// Filter by service code if provided
const filter = args[0];
const filtered = filter
  ? files.filter(f => path.basename(f).startsWith(filter.toLowerCase().replace(/[^a-z0-9-]/g, '-')))
  : files;

if (filtered.length === 0) {
  console.log(`\nNo files matching "${filter}" in output/`);
  console.log('Available:', readdirSync(outDir).join(', '));
  process.exit(1);
}

// Prefer: combined.html first (both card + BPMN), then standalone viewer, then card, etc.
const priority = (f: string) => {
  if (f.endsWith('combined.html')) return 0;
  if (f.endsWith('bpmn-viewer.html')) return 1;
  if (f.endsWith('service-card.html')) return 2;
  if (f.endsWith('.html')) return 3;
  if (f.endsWith('.pdf')) return 4;
  return 5;
};

const toOpen = filtered.sort((a, b) => priority(a) - priority(b)).slice(0, 2);

console.log('\nOpening:');
for (const f of toOpen) {
  console.log(`  ${path.basename(f)}`);
  execSync(`open "${f}"`);
}
console.log();
