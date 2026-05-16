import * as XLSX from 'xlsx';

export interface SheetData {
  name: string;
  headers: string[];
  rows: Record<string, string>[];
}

export interface ParsedFile {
  fileName: string;
  sheets: SheetData[];
}

export function parseExcelBuffer(buffer: Buffer, fileName: string): ParsedFile {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheets: SheetData[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName]!;
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
      raw: false,
    });

    if (jsonRows.length === 0) continue;

    const headers = Object.keys(jsonRows[0]!).filter(h => h.trim() !== '');
    const rows = jsonRows.map(row =>
      Object.fromEntries(
        headers.map(h => [h, String(row[h] ?? '').trim()])
      ) as Record<string, string>
    ).filter(row => headers.some(h => row[h] !== ''));

    if (rows.length > 0) {
      sheets.push({ name: sheetName, headers, rows });
    }
  }

  return { fileName, sheets };
}

// ─── Sheet-type detection ──────────────────────────────────────────────────────

function hasCol(sheet: SheetData, ...keywords: string[]): boolean {
  const lh = sheet.headers.map(h => h.toLowerCase());
  return keywords.every(k => lh.some(h => h.includes(k.toLowerCase())));
}

function col(sheet: SheetData, ...keywords: string[]): string {
  return sheet.headers.find(h =>
    keywords.some(k => h.toLowerCase().includes(k.toLowerCase()))
  ) ?? '';
}

// ─── Intake sheet (Section | Field | Value) ───────────────────────────────────

function formatIntakeSheet(sheet: SheetData): string[] {
  const sectionC = col(sheet, 'section');
  const fieldC   = col(sheet, 'field');
  const valueC   = col(sheet, 'value');
  if (!fieldC || !valueC) return formatGenericSheet(sheet);

  const lines: string[] = [
    `\n=== SHEET: ${sheet.name} — Service Metadata (map to serviceCard fields) ===`,
  ];

  for (const row of sheet.rows) {
    const section = sectionC ? row[sectionC] : '';
    const field   = row[fieldC];
    const value   = row[valueC];

    if (section && !field && !value) {
      lines.push(`\n[${section}]`);
    } else if (field && value) {
      lines.push(`${field}: ${value}`);
    }
  }
  return lines;
}

// ─── Task Register (Task ID | Task Name | Module | Role | Digitization Mode) ──

function bpmnTaskType(digitization: string, role: string): string {
  const d = digitization.toLowerCase();
  const r = role.toLowerCase();
  if (d.includes('automat') || r === 'system') return 'serviceTask [colorKey: system]';
  if (d.includes('manual'))                    return 'manualTask  [colorKey: manual]';
  return                                              'userTask    [colorKey: manual]';
}

function formatTaskSheet(sheet: SheetData): string[] {
  const taskIdC   = col(sheet, 'task id');
  const taskNameC = col(sheet, 'task name');
  const moduleC   = col(sheet, 'module id', 'module');
  const purposeC  = col(sheet, 'purpose', 'outcome');
  const triggerC  = col(sheet, 'trigger');
  const roleC     = col(sheet, 'role');
  const digitC    = col(sheet, 'digitiz', 'mode');

  const lines: string[] = [
    `\n=== SHEET: ${sheet.name} — BPMN Task Register ===`,
    'Map each task to a BPMN element using the Digitization Mode + Primary Role:',
    '  Automated / System  → serviceTask  (colorKey: system)',
    '  Assisted            → userTask     (colorKey: manual)',
    '  Manual              → manualTask   (colorKey: manual)',
    '',
  ];

  let currentModule = '';
  for (const row of sheet.rows) {
    const module      = moduleC   ? row[moduleC]   : '';
    const taskId      = taskIdC   ? row[taskIdC]   : '';
    const taskName    = taskNameC ? row[taskNameC] : '';
    const role        = roleC     ? row[roleC]     : '';
    const digitization= digitC    ? row[digitC]    : '';
    const purpose     = purposeC  ? row[purposeC]  : '';
    const trigger     = triggerC  ? row[triggerC]  : '';

    if (module && module !== currentModule) {
      currentModule = module;
      lines.push(`\n[Module: ${module}]`);
    }

    if (taskName) {
      const bpmnType = bpmnTaskType(digitization, role);
      lines.push(`  [${taskId}] "${taskName}" → ${bpmnType}`);
      if (role)    lines.push(`    Role: ${role}`);
      if (trigger) lines.push(`    Trigger: ${trigger}`);
      if (purpose) lines.push(`    Purpose: ${purpose}`);
    }
  }
  return lines;
}

// ─── Module Register (Module ID | Module Name | Category | Purpose) ───────────

function formatModuleSheet(sheet: SheetData): string[] {
  const idC       = col(sheet, 'module id');
  const nameC     = col(sheet, 'module name');
  const categoryC = col(sheet, 'category');
  const coreC     = col(sheet, 'core', 'elective');
  const purposeC  = col(sheet, 'purpose', 'outcome');

  const lines: string[] = [
    `\n=== SHEET: ${sheet.name} — Process Modules (defines BPMN happy-path sequence) ===`,
  ];

  for (const row of sheet.rows) {
    const id      = idC       ? row[idC]       : '';
    const name    = nameC     ? row[nameC]     : '';
    const cat     = categoryC ? row[categoryC] : '';
    const core    = coreC     ? row[coreC]     : '';
    const purpose = purposeC  ? row[purposeC]  : '';

    if (name) {
      lines.push(`\n[${id}] ${name}  (Category: ${cat} | ${core})`);
      if (purpose) lines.push(`  → ${purpose}`);
    }
  }
  return lines;
}

// ─── Variant Register (Variant ID | Name | Trigger Key | Eligibility) ─────────

function formatVariantSheet(sheet: SheetData): string[] {
  const variantIdC  = col(sheet, 'variant id');
  const variantNameC= col(sheet, 'variant name');
  const triggerC    = col(sheet, 'trigger key', 'trigger');
  const eligC       = col(sheet, 'eligibility');
  const notesC      = col(sheet, 'notes');

  const lines: string[] = [
    `\n=== SHEET: ${sheet.name} — Service Variants → BPMN Gateway Branches ===`,
    'Each variant maps to an exclusiveGateway branch in BPMN.',
    'Use Variant Trigger Key as gateway condition; Eligibility Rules describe when the branch fires.',
    '',
  ];

  for (const row of sheet.rows) {
    const id      = variantIdC   ? row[variantIdC]   : '';
    const name    = variantNameC ? row[variantNameC] : '';
    const trigger = triggerC     ? row[triggerC]     : '';
    const elig    = eligC        ? row[eligC]        : '';
    const notes   = notesC       ? row[notesC]       : '';

    if (name) {
      lines.push(`Branch [${id}]: "${name}"`);
      if (trigger) lines.push(`  Condition / Trigger: ${trigger}`);
      if (elig)    lines.push(`  Eligibility: ${elig}`);
      if (notes)   lines.push(`  Notes: ${notes}`);
      lines.push('');
    }
  }
  return lines;
}

// ─── Stakeholders sheet ────────────────────────────────────────────────────────

function formatStakeholderSheet(sheet: SheetData): string[] {
  const lines: string[] = [
    `\n=== SHEET: ${sheet.name} — Stakeholders (use for targetSegment, owningEntity, laneParticipants) ===`,
  ];
  for (const row of sheet.rows) {
    const parts = sheet.headers.map(h => `${h}: ${row[h]}`).filter(p => !p.endsWith(': '));
    if (parts.length) lines.push(parts.join(' | '));
  }
  return lines;
}

// ─── Change Impact sheet ───────────────────────────────────────────────────────

function formatChangeImpactSheet(sheet: SheetData): string[] {
  const lines: string[] = [
    `\n=== SHEET: ${sheet.name} — Change Impact (use for transformationStage, integrationApis context) ===`,
  ];
  for (const row of sheet.rows) {
    const parts = sheet.headers.map(h => `${h}: ${row[h]}`).filter(p => !p.endsWith(': '));
    if (parts.length) lines.push(parts.join(' | '));
  }
  return lines;
}

// ─── Generic fallback ──────────────────────────────────────────────────────────

function formatGenericSheet(sheet: SheetData): string[] {
  const lines: string[] = [
    `\n=== SHEET: ${sheet.name} ===`,
    `Columns: ${sheet.headers.join(' | ')}`,
    '',
  ];
  for (const row of sheet.rows) {
    const pairs = sheet.headers
      .map(h => `${h}: ${row[h]}`)
      .filter(p => !p.endsWith(': '));
    if (pairs.length) lines.push(pairs.join(' | '));
  }
  return lines;
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function parsedFileToText(parsed: ParsedFile): string {
  const lines: string[] = [
    `=== SERVICE DESIGN FILE: ${parsed.fileName} ===`,
    `Sheets detected: ${parsed.sheets.map(s => s.name).join(' | ')}`,
    '',
    '=== GENERATION INSTRUCTIONS ===',
    'SERVICE CARD: Extract fields from the Intake/metadata sheet (Section→Field→Value rows).',
    '  - "Service name" / "Service ID" → nameEn / serviceCode',
    '  - "Channels" → channels array (map to: online | app | call-center | in-person)',
    '  - "High-level stages" / "Journey stages" → journeySteps (max 7 — merge if needed)',
    '  - "Turnaround targets" / "SLA" → slaDays',
    '  - "Regulatory / compliance" → legalBasis',
    '  - "Business owner" / "Organisational role" → owningEntity / category',
    '  - "Transformation stage" / "Digitization" → transformationStage',
    '',
    'BPMN PROCESS: Build from Task Register (use ALL tasks in module order):',
    '  - Digitization Mode = Automated → serviceTask (colorKey: system)',
    '  - Digitization Mode = Assisted  → userTask    (colorKey: manual)',
    '  - Digitization Mode = Manual    → manualTask  (colorKey: manual)',
    '  - Group tasks by Module ID; each Module → a logical stage in the happy path',
    '',
    'BPMN GATEWAYS: Use Variant Register → each variant = an exclusiveGateway branch.',
    '  - Variant Trigger Key = gateway condition label',
    '  - Eligibility Rules = when branch fires',
    '  - EVERY non-happy-path branch MUST end with endEvent',
    '',
    'STAKEHOLDERS: Use Role column for BPMN pool/lane labels and targetSegment values.',
    '',
  ];

  for (const sheet of parsed.sheets) {
    let sheetLines: string[];

    if (hasCol(sheet, 'section', 'field', 'value')) {
      sheetLines = formatIntakeSheet(sheet);
    } else if (hasCol(sheet, 'task name') || (hasCol(sheet, 'task') && hasCol(sheet, 'digitiz'))) {
      sheetLines = formatTaskSheet(sheet);
    } else if (hasCol(sheet, 'module') && hasCol(sheet, 'category')) {
      sheetLines = formatModuleSheet(sheet);
    } else if (hasCol(sheet, 'variant') || hasCol(sheet, 'trigger key')) {
      sheetLines = formatVariantSheet(sheet);
    } else if (hasCol(sheet, 'interest', 'stake') || hasCol(sheet, 'influence')) {
      sheetLines = formatStakeholderSheet(sheet);
    } else if (hasCol(sheet, 'current state', 'future state') || hasCol(sheet, 'change impact')) {
      sheetLines = formatChangeImpactSheet(sheet);
    } else {
      sheetLines = formatGenericSheet(sheet);
    }

    lines.push(...sheetLines, '');
  }

  return lines.join('\n');
}
