import { readFileSync } from 'fs';
import { ServiceDefinitionSchema } from './schemas/service-definition.schema.js';
import { ZodError } from 'zod';

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help') {
  console.log(`
Usage: bun run validate <service-definition.json>

Validates the JSON against:
  - UAE TDRA ServiceCard schema (15 mandatory fields)
  - BPMN process structure (gateways, branches, IDs, colorKeys)
  - Business rules (max 7 journey steps, valid channels, etc.)
`);
  process.exit(0);
}

const file = args[0]!;
let raw: unknown;

try {
  raw = JSON.parse(readFileSync(file, 'utf-8'));
} catch {
  console.error(`\n✗ Cannot read file: ${file}\n`);
  process.exit(1);
}

console.log(`\nValidating: ${file}\n`);

// ─── Schema validation ────────────────────────────────────────────────────────
const result = ServiceDefinitionSchema.safeParse(raw);

if (!result.success) {
  console.error('✗ Schema errors:\n');
  formatZodErrors(result.error);
  process.exit(1);
}

const def = result.data;

// ─── Business rule checks ─────────────────────────────────────────────────────
const warnings: string[] = [];
const errors: string[] = [];

// Journey steps max 7 (TAMM UX guideline)
if (def.serviceCard.journeySteps.length > 7) {
  errors.push(`serviceCard.journeySteps has ${def.serviceCard.journeySteps.length} steps — TAMM max is 7`);
}

// UAE Pass level required if enabled
if (def.serviceCard.uaePassEnabled && !def.serviceCard.uaePassLevel) {
  warnings.push('serviceCard.uaePassEnabled is true but uaePassLevel is not set (should be 1, 2, or 3)');
}

// At least one fee entry
if (def.serviceCard.fees.length === 0) {
  warnings.push('serviceCard.fees is empty — add at least one entry (use amountAED: 0 if free)');
}

// SLA keys should match channels
const validChannels = new Set(def.serviceCard.channels);
for (const ch of Object.keys(def.serviceCard.slaDays)) {
  if (!validChannels.has(ch as never)) {
    warnings.push(`serviceCard.slaDays has channel "${ch}" not listed in channels`);
  }
}

// BPMN: check for duplicate IDs
const ids = new Set<string>();
let dupCount = 0;
walkElements(def.bpmnProcess.elements, (el) => {
  if (ids.has(el.id)) { errors.push(`bpmnProcess: duplicate element id "${el.id}"`); dupCount++; }
  ids.add(el.id);
});

// BPMN: must start with startEvent
const first = def.bpmnProcess.elements[0];
if (first?.type !== 'startEvent') {
  errors.push(`bpmnProcess.elements[0] must be a startEvent, got "${first?.type}"`);
}

// BPMN: all elements must have a colorKey
walkElements(def.bpmnProcess.elements, (el) => {
  if (!el.colorKey) warnings.push(`bpmnProcess: element "${el.id}" (${el.type}) has no colorKey`);
});

// BPMN: gateway branches must have conditions
walkElements(def.bpmnProcess.elements, (el) => {
  if ('branches' in el && el.branches) {
    for (const b of el.branches) {
      if (!b.condition?.trim()) errors.push(`bpmnProcess: gateway "${el.id}" has a branch with empty condition`);
    }
  }
});

// ─── Report ───────────────────────────────────────────────────────────────────
const hasErrors = errors.length > 0;

console.log(`  Service:  ${def.serviceCard.nameEn}`);
console.log(`  Code:     ${def.serviceCard.serviceCode}`);
console.log(`  Steps:    ${def.serviceCard.journeySteps.length}/7`);
console.log(`  Elements: ${ids.size} BPMN elements`);
console.log(`  Channels: ${def.serviceCard.channels.join(', ')}`);
console.log();

if (errors.length > 0) {
  console.error(`✗ ${errors.length} error(s):\n`);
  errors.forEach(e => console.error(`  • ${e}`));
  console.log();
}

if (warnings.length > 0) {
  console.warn(`⚠  ${warnings.length} warning(s):\n`);
  warnings.forEach(w => console.warn(`  • ${w}`));
  console.log();
}

if (!hasErrors) {
  console.log(`✓ Valid — ready to generate\n`);
  console.log(`  Run: bun run generate ${file}\n`);
}

process.exit(hasErrors ? 1 : 0);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function walkElements(elements: unknown[], cb: (el: Record<string, unknown>) => void) {
  for (const el of elements) {
    const e = el as Record<string, unknown>;
    cb(e);
    if (Array.isArray(e['branches'])) {
      for (const b of e['branches'] as Array<{ path?: unknown[] }>) {
        if (b.path) walkElements(b.path, cb);
      }
    }
    if (Array.isArray(e['elements'])) walkElements(e['elements'] as unknown[], cb);
  }
}

function formatZodErrors(error: ZodError) {
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    console.error(`  • ${path ? path + ': ' : ''}${issue.message}`);
  }
  console.log();
}
