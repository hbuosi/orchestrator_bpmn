import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseExcelBuffer, parsedFileToText } from '../excel.parser';
import type { ParsedFile, SheetData } from '../excel.parser';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeBuffer(sheetName: string, rows: Record<string, unknown>[]): Buffer {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

function makeMultiSheetBuffer(sheets: { name: string; rows: Record<string, unknown>[] }[]): Buffer {
  const wb = XLSX.utils.book_new();
  for (const { name, rows } of sheets) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
  }
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

// ─── parseExcelBuffer ─────────────────────────────────────────────────────────

describe('parseExcelBuffer', () => {
  it('returns fileName and sheets from a valid buffer', () => {
    const buf = makeBuffer('Sheet1', [{ Col1: 'A', Col2: 'B' }]);
    const result = parseExcelBuffer(buf, 'test.xlsx');
    expect(result.fileName).toBe('test.xlsx');
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0]!.name).toBe('Sheet1');
  });

  it('extracts correct headers from first row', () => {
    const buf = makeBuffer('Data', [{ Name: 'Alice', Age: '30' }]);
    const { sheets } = parseExcelBuffer(buf, 'x.xlsx');
    expect(sheets[0]!.headers).toEqual(['Name', 'Age']);
  });

  it('returns rows as string-keyed Record<string, string>', () => {
    const buf = makeBuffer('Data', [{ Name: 'Alice', Age: 30 }]);
    const { sheets } = parseExcelBuffer(buf, 'x.xlsx');
    expect(sheets[0]!.rows[0]).toEqual({ Name: 'Alice', Age: '30' });
  });

  it('handles multiple sheets', () => {
    const buf = makeMultiSheetBuffer([
      { name: 'Sheet1', rows: [{ A: '1' }] },
      { name: 'Sheet2', rows: [{ B: '2' }] },
    ]);
    const { sheets } = parseExcelBuffer(buf, 'multi.xlsx');
    expect(sheets).toHaveLength(2);
    expect(sheets.map(s => s.name)).toEqual(['Sheet1', 'Sheet2']);
  });

  it('skips completely empty sheets', () => {
    const buf = makeMultiSheetBuffer([
      { name: 'Empty', rows: [] },
      { name: 'Full', rows: [{ X: 'val' }] },
    ]);
    const { sheets } = parseExcelBuffer(buf, 'skip.xlsx');
    expect(sheets.map(s => s.name)).toEqual(['Full']);
  });

  it('trims leading and trailing whitespace from cell values', () => {
    const buf = makeBuffer('S', [{ Field: '  hello  ' }]);
    const { sheets } = parseExcelBuffer(buf, 'trim.xlsx');
    expect(sheets[0]!.rows[0]!['Field']).toBe('hello');
  });

  it('filters out rows where all values are empty strings', () => {
    const buf = makeBuffer('S', [
      { Field: 'Value' },
      { Field: '' },
    ]);
    const { sheets } = parseExcelBuffer(buf, 'filter.xlsx');
    // Row with empty value should be excluded
    expect(sheets[0]!.rows.every(r => Object.values(r).some(v => v !== ''))).toBe(true);
  });
});

// ─── parsedFileToText — header block ─────────────────────────────────────────

describe('parsedFileToText — header block', () => {
  it('includes the file name in the header line', () => {
    const parsed: ParsedFile = { fileName: 'myfile.xlsx', sheets: [] };
    const text = parsedFileToText(parsed);
    expect(text).toContain('SERVICE DESIGN FILE: myfile.xlsx');
  });

  it('includes the generation instructions block', () => {
    const parsed: ParsedFile = { fileName: 'x.xlsx', sheets: [] };
    const text = parsedFileToText(parsed);
    expect(text).toContain('=== GENERATION INSTRUCTIONS ===');
    expect(text).toContain('SERVICE CARD:');
    expect(text).toContain('BPMN PROCESS:');
    expect(text).toContain('BPMN GATEWAYS:');
  });

  it('lists detected sheet names in header', () => {
    const parsed: ParsedFile = {
      fileName: 'x.xlsx',
      sheets: [
        { name: 'Intake', headers: ['Section', 'Field', 'Value'], rows: [] },
        { name: 'Tasks', headers: ['Task Name', 'Role'], rows: [] },
      ],
    };
    const text = parsedFileToText(parsed);
    expect(text).toContain('Sheets detected: Intake | Tasks');
  });
});

// ─── Intake sheet detection ───────────────────────────────────────────────────

describe('parsedFileToText — Intake sheet (Section|Field|Value)', () => {
  function makeIntakeParsed(rows: Record<string, string>[]): ParsedFile {
    return {
      fileName: 'intake.xlsx',
      sheets: [{
        name: 'Intake',
        headers: ['Section', 'Field', 'Value'],
        rows,
      }],
    };
  }

  it('detects Intake sheet and uses Service Metadata label', () => {
    const parsed = makeIntakeParsed([{ Section: '', Field: 'Service name', Value: 'My Service' }]);
    const text = parsedFileToText(parsed);
    expect(text).toContain('Service Metadata (map to serviceCard fields)');
  });

  it('renders field: value rows for non-empty field+value pairs', () => {
    const parsed = makeIntakeParsed([
      { Section: '', Field: 'Service name', Value: 'My Service' },
    ]);
    const text = parsedFileToText(parsed);
    expect(text).toContain('Service name: My Service');
  });

  it('renders section headers as [Section] when field and value are empty', () => {
    const parsed = makeIntakeParsed([
      { Section: 'General Info', Field: '', Value: '' },
    ]);
    const text = parsedFileToText(parsed);
    expect(text).toContain('[General Info]');
  });

  it('skips rows where both field and value are empty', () => {
    const parsed = makeIntakeParsed([
      { Section: '', Field: '', Value: '' },
    ]);
    const text = parsedFileToText(parsed);
    // Should not produce a bare ": " line
    expect(text).not.toMatch(/^: $/m);
  });
});

// ─── Task Register detection ──────────────────────────────────────────────────

describe('parsedFileToText — Task Register sheet', () => {
  function makeTaskParsed(rows: Record<string, string>[]): ParsedFile {
    return {
      fileName: 'tasks.xlsx',
      sheets: [{
        name: 'Task Register',
        headers: ['Task ID', 'Task Name', 'Module', 'Role', 'Digitization Mode'],
        rows,
      }],
    };
  }

  it('detects Task Register sheet via "Task Name" header', () => {
    const parsed = makeTaskParsed([
      { 'Task ID': 'T1', 'Task Name': 'Validate Documents', Module: 'M1', Role: 'System', 'Digitization Mode': 'Automated' },
    ]);
    const text = parsedFileToText(parsed);
    expect(text).toContain('BPMN Task Register');
  });

  it('maps Automated/System to serviceTask', () => {
    const parsed = makeTaskParsed([
      { 'Task ID': 'T1', 'Task Name': 'Validate Docs', Module: 'M1', Role: 'System', 'Digitization Mode': 'Automated' },
    ]);
    const text = parsedFileToText(parsed);
    expect(text).toContain('serviceTask');
    expect(text).toContain('system');
  });

  it('maps Manual to manualTask', () => {
    const parsed = makeTaskParsed([
      { 'Task ID': 'T2', 'Task Name': 'Sign Form', Module: 'M1', Role: 'Applicant', 'Digitization Mode': 'Manual' },
    ]);
    const text = parsedFileToText(parsed);
    expect(text).toContain('manualTask');
  });

  it('maps Assisted (non-automated, non-manual) to userTask', () => {
    const parsed = makeTaskParsed([
      { 'Task ID': 'T3', 'Task Name': 'Review File', Module: 'M1', Role: 'Officer', 'Digitization Mode': 'Assisted' },
    ]);
    const text = parsedFileToText(parsed);
    expect(text).toContain('userTask');
  });

  it('groups tasks under Module headers', () => {
    const parsed = makeTaskParsed([
      { 'Task ID': 'T1', 'Task Name': 'Task A', Module: 'MOD-1', Role: 'System', 'Digitization Mode': 'Automated' },
      { 'Task ID': 'T2', 'Task Name': 'Task B', Module: 'MOD-1', Role: 'System', 'Digitization Mode': 'Automated' },
    ]);
    const text = parsedFileToText(parsed);
    // Module header should appear once
    const occurrences = (text.match(/\[Module: MOD-1\]/g) ?? []).length;
    expect(occurrences).toBe(1);
  });
});

// ─── Module Register detection ────────────────────────────────────────────────

describe('parsedFileToText — Module Register sheet', () => {
  it('detects Module Register via "Module" + "Category" columns', () => {
    const parsed: ParsedFile = {
      fileName: 'modules.xlsx',
      sheets: [{
        name: 'Module Register',
        headers: ['Module ID', 'Module Name', 'Category', 'Purpose'],
        rows: [
          { 'Module ID': 'M1', 'Module Name': 'Application', Category: 'Core', Purpose: 'Handle intake' },
        ],
      }],
    };
    const text = parsedFileToText(parsed);
    expect(text).toContain('Process Modules (defines BPMN happy-path sequence)');
  });

  it('renders module name with category', () => {
    const parsed: ParsedFile = {
      fileName: 'modules.xlsx',
      sheets: [{
        name: 'Modules',
        headers: ['Module ID', 'Module Name', 'Category'],
        rows: [{ 'Module ID': 'M1', 'Module Name': 'Intake', Category: 'Core' }],
      }],
    };
    const text = parsedFileToText(parsed);
    expect(text).toContain('Intake');
    expect(text).toContain('Core');
  });
});

// ─── Variant Register detection ───────────────────────────────────────────────

describe('parsedFileToText — Variant Register sheet', () => {
  it('detects Variant Register via "Variant" column', () => {
    const parsed: ParsedFile = {
      fileName: 'variants.xlsx',
      sheets: [{
        name: 'Variants',
        headers: ['Variant ID', 'Variant Name', 'Trigger Key', 'Eligibility'],
        rows: [{ 'Variant ID': 'V1', 'Variant Name': 'Fast Track', 'Trigger Key': 'Priority', Eligibility: 'VIP only' }],
      }],
    };
    const text = parsedFileToText(parsed);
    expect(text).toContain('Service Variants');
    expect(text).toContain('BPMN Gateway Branches');
  });

  it('detects Variant Register via "Trigger Key" column alone', () => {
    const parsed: ParsedFile = {
      fileName: 'variants.xlsx',
      sheets: [{
        name: 'Variants',
        headers: ['ID', 'Name', 'Trigger Key'],
        rows: [{ ID: 'V1', Name: 'Standard', 'Trigger Key': 'Default' }],
      }],
    };
    const text = parsedFileToText(parsed);
    expect(text).toContain('Service Variants');
  });

  it('renders branch label, condition, and eligibility', () => {
    const parsed: ParsedFile = {
      fileName: 'variants.xlsx',
      sheets: [{
        name: 'Variants',
        headers: ['Variant ID', 'Variant Name', 'Trigger Key', 'Eligibility'],
        rows: [{ 'Variant ID': 'V1', 'Variant Name': 'Fast Track', 'Trigger Key': 'Priority=High', Eligibility: 'VIP only' }],
      }],
    };
    const text = parsedFileToText(parsed);
    expect(text).toContain('Branch [V1]: "Fast Track"');
    expect(text).toContain('Condition / Trigger: Priority=High');
    expect(text).toContain('Eligibility: VIP only');
  });
});

// ─── Stakeholders detection ───────────────────────────────────────────────────

describe('parsedFileToText — Stakeholders sheet', () => {
  it('detects via "stake" keyword in a header', () => {
    const parsed: ParsedFile = {
      fileName: 'stake.xlsx',
      sheets: [{
        name: 'Stakeholders',
        headers: ['Stakeholder', 'Role', 'Interest'],
        rows: [{ Stakeholder: 'MoI', Role: 'Owner', Interest: 'High' }],
      }],
    };
    const text = parsedFileToText(parsed);
    expect(text).toContain('Stakeholders (use for targetSegment');
  });

  it('detects via "influence" column header', () => {
    const parsed: ParsedFile = {
      fileName: 'stake.xlsx',
      sheets: [{
        name: 'Power Grid',
        headers: ['Name', 'Influence', 'Support'],
        rows: [{ Name: 'DHA', Influence: 'High', Support: 'Yes' }],
      }],
    };
    const text = parsedFileToText(parsed);
    expect(text).toContain('Stakeholders (use for targetSegment');
  });
});

// ─── Change Impact detection ───────────────────────────────────────────────────

describe('parsedFileToText — Change Impact sheet', () => {
  it('detects via "current state" + "future state" headers', () => {
    const parsed: ParsedFile = {
      fileName: 'change.xlsx',
      sheets: [{
        name: 'Change Impact',
        headers: ['Process', 'Current State', 'Future State'],
        rows: [{ Process: 'Submission', 'Current State': 'Paper', 'Future State': 'Digital' }],
      }],
    };
    const text = parsedFileToText(parsed);
    expect(text).toContain('Change Impact (use for transformationStage');
  });

  it('detects via "change impact" header', () => {
    const parsed: ParsedFile = {
      fileName: 'change.xlsx',
      sheets: [{
        name: 'Impact',
        headers: ['Area', 'Change Impact', 'Owner'],
        rows: [{ Area: 'IT', 'Change Impact': 'High', Owner: 'CIO' }],
      }],
    };
    const text = parsedFileToText(parsed);
    expect(text).toContain('Change Impact (use for transformationStage');
  });
});

// ─── Generic fallback ──────────────────────────────────────────────────────────

describe('parsedFileToText — generic fallback', () => {
  it('falls back to generic format for unrecognised sheets', () => {
    const parsed: ParsedFile = {
      fileName: 'unknown.xlsx',
      sheets: [{
        name: 'Random Data',
        headers: ['Foo', 'Bar'],
        rows: [{ Foo: 'x', Bar: 'y' }],
      }],
    };
    const text = parsedFileToText(parsed);
    expect(text).toContain('=== SHEET: Random Data ===');
    expect(text).toContain('Columns: Foo | Bar');
  });

  it('renders key:value pairs in generic output', () => {
    const parsed: ParsedFile = {
      fileName: 'unknown.xlsx',
      sheets: [{
        name: 'Random Data',
        headers: ['Foo', 'Bar'],
        rows: [{ Foo: 'hello', Bar: 'world' }],
      }],
    };
    const text = parsedFileToText(parsed);
    expect(text).toContain('Foo: hello');
    expect(text).toContain('Bar: world');
  });

  it('omits key:value pairs where value is empty', () => {
    const parsed: ParsedFile = {
      fileName: 'unknown.xlsx',
      sheets: [{
        name: 'Data',
        headers: ['Foo', 'Bar'],
        rows: [{ Foo: 'hello', Bar: '' }],
      }],
    };
    const text = parsedFileToText(parsed);
    expect(text).not.toContain('Bar: ');
  });
});

// ─── parseExcelBuffer round-trip with parsedFileToText ────────────────────────

describe('parseExcelBuffer + parsedFileToText integration', () => {
  it('round-trips an Intake sheet from real buffer to structured text', () => {
    const buf = makeBuffer('Intake', [
      { Section: '', Field: 'Service name', Value: 'Vehicle Registration' },
      { Section: '', Field: 'Service ID', Value: 'TAMM-VR-001' },
    ]);
    const parsed = parseExcelBuffer(buf, 'vehicle.xlsx');
    const text = parsedFileToText(parsed);
    expect(text).toContain('Service name: Vehicle Registration');
    expect(text).toContain('Service ID: TAMM-VR-001');
    expect(text).toContain('Service Metadata');
  });

  it('round-trips a Task Register sheet from real buffer', () => {
    const buf = makeBuffer('Task Register', [
      { 'Task ID': 'T1', 'Task Name': 'Verify Identity', Module: 'M1', Role: 'System', 'Digitization Mode': 'Automated' },
    ]);
    const parsed = parseExcelBuffer(buf, 'tasks.xlsx');
    const text = parsedFileToText(parsed);
    expect(text).toContain('BPMN Task Register');
    expect(text).toContain('Verify Identity');
    expect(text).toContain('serviceTask');
  });
});
