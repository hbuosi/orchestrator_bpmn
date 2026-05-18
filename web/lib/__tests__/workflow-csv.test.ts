import { describe, it, expect } from 'vitest';
import { generateWorkflowCsv } from '../generators/workflow-csv.generator';
import type { WorkflowCsvSpec } from '../schemas/manifest.schema';

// ─── Shared test fixture ──────────────────────────────────────────────────────

const SPEC: WorkflowCsvSpec = {
  lanes: ['Reporter', 'System', 'Cyber Analyst', 'Cyber Lead / IC', 'IT Support', 'Risk & Compliance'],
  shapes: [
    { id: 3, shapeType: 'Terminator', label: 'Start', lane: 1 },
    { id: 4, shapeType: 'Process', label: 'Submit Report [M1]', lane: 1, taskTypeCode: 'BT-INT', moduleId: 'M-INT-01', moduleName: 'Incident Intake' },
    { id: 5, shapeType: 'Process', label: 'Acknowledge & Log [15m]', lane: 2, taskTypeCode: 'BT-INT', moduleId: 'M-INT-01', moduleName: 'Incident Intake' },
    { id: 6, shapeType: 'Delay', label: 'SLA Timer Start [24h]', lane: 2, taskTypeCode: 'BT-TRK', moduleId: 'M-TRK-01', moduleName: 'Tracking' },
    { id: 7, shapeType: 'Process', label: 'Perform Triage [45m]', lane: 3, taskTypeCode: 'BT-TRI', moduleId: 'M-TRI-01', moduleName: 'Triage' },
    { id: 8, shapeType: 'Decision', label: 'Is it Critical?', lane: 4, taskTypeCode: 'BT-APR1', moduleId: 'M-APR-01', moduleName: 'Escalation Gate' },
    { id: 9, shapeType: 'Terminator', label: 'End - Resolved', lane: 4 },
  ],
  connections: [
    { id: 100, source: 3, destination: 4 },
    { id: 101, source: 4, destination: 5 },
    { id: 102, source: 5, destination: 6 },
    { id: 103, source: 6, destination: 7 },
    { id: 104, source: 7, destination: 8 },
    { id: 105, source: 8, destination: 9, label: 'Yes' },
    { id: 106, source: 8, destination: 7, label: 'No' },
  ],
};

function parseRows(csv: string): string[][] {
  return csv
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      // Simple CSV row parser that handles quoted cells
      const cells: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          cells.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
      cells.push(current);
      return cells;
    });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('generateWorkflowCsv', () => {
  it('outputs the correct header row', () => {
    const csv = generateWorkflowCsv(SPEC, 'CYB-IR001');
    const rows = parseRows(csv);
    const header = rows[0];
    expect(header[0]).toBe('Id');
    expect(header[1]).toBe('Name');
    expect(header[2]).toBe('Shape Library');
    expect(header[3]).toBe('Page ID');
    expect(header[4]).toBe('Contained By');
    expect(header[5]).toBe('Line Source');
    expect(header[6]).toBe('Line Destination');
    expect(header[7]).toBe('Source Arrow');
    expect(header[8]).toBe('Destination Arrow');
    expect(header[9]).toBe('Text Area 1');
    expect(header[10]).toBe('Text Area 2');
    expect(header[11]).toBe('Text Area 3');
    expect(header[12]).toBe('Text Area 4');
    expect(header[13]).toBe('Text Area 5');
    expect(header[14]).toBe('Text Area 6');
  });

  it('includes the Page row as id=1 with "Page 1" in Text Area 1', () => {
    const csv = generateWorkflowCsv(SPEC, 'CYB-IR001');
    const rows = parseRows(csv);
    const pageRow = rows[1];
    expect(pageRow[0]).toBe('1');
    expect(pageRow[1]).toBe('Page');
    expect(pageRow[2]).toBe('');          // Shape Library blank
    expect(pageRow[9]).toBe('Page 1');   // Text Area 1
  });

  it('includes the Swim Lane row as id=2 with lane names in Text Areas 1–6', () => {
    const csv = generateWorkflowCsv(SPEC, 'CYB-IR001');
    const rows = parseRows(csv);
    const laneRow = rows[2];
    expect(laneRow[0]).toBe('2');
    expect(laneRow[1]).toBe('Swim Lane');
    expect(laneRow[2]).toBe('Flowchart Shapes');
    expect(laneRow[3]).toBe('1');   // Page ID
    expect(laneRow[9]).toBe('Reporter');
    expect(laneRow[10]).toBe('System');
    expect(laneRow[11]).toBe('Cyber Analyst');
    expect(laneRow[12]).toBe('Cyber Lead / IC');
    expect(laneRow[13]).toBe('IT Support');
    expect(laneRow[14]).toBe('Risk & Compliance');
  });

  it('maps shape Contained By correctly as "2:{lane}"', () => {
    const csv = generateWorkflowCsv(SPEC, 'CYB-IR001');
    const rows = parseRows(csv);
    // Shape rows start at index 3 (0-based: header=0, page=1, lane=2, shapes=3+)
    const startShape = rows[3]; // id=3, lane=1
    expect(startShape[0]).toBe('3');
    expect(startShape[1]).toBe('Terminator');
    expect(startShape[4]).toBe('2:1');  // Contained By

    const systemShape = rows[5]; // id=5, lane=2
    expect(systemShape[4]).toBe('2:2');

    const analystShape = rows[6]; // id=6, lane=2 (SLA Timer)
    expect(analystShape[4]).toBe('2:2');

    const triageShape = rows[7]; // id=7, lane=3
    expect(triageShape[4]).toBe('2:3');

    const decisionShape = rows[8]; // id=8, lane=4
    expect(decisionShape[4]).toBe('2:4');
  });

  it('puts Task Type Codes in Text Area 2 for non-terminator shapes', () => {
    const csv = generateWorkflowCsv(SPEC, 'CYB-IR001');
    const rows = parseRows(csv);

    // id=4: Process with BT-INT
    const processRow = rows[4];
    expect(processRow[0]).toBe('4');
    expect(processRow[10]).toBe('BT-INT'); // Text Area 2

    // id=3: Terminator — taskTypeCode should be blank
    const terminatorRow = rows[3];
    expect(terminatorRow[0]).toBe('3');
    expect(terminatorRow[10]).toBe(''); // Text Area 2 blank for terminators
  });

  it('puts Module IDs in Text Area 3 for shapes that have them', () => {
    const csv = generateWorkflowCsv(SPEC, 'CYB-IR001');
    const rows = parseRows(csv);

    // id=4: Process with M-INT-01
    const processRow = rows[4];
    expect(processRow[11]).toBe('M-INT-01'); // Text Area 3

    // id=7: Process with M-TRI-01
    const triageRow = rows[7];
    expect(triageRow[11]).toBe('M-TRI-01');
  });

  it('puts Module Names in Text Area 4 for shapes that have them', () => {
    const csv = generateWorkflowCsv(SPEC, 'CYB-IR001');
    const rows = parseRows(csv);

    // id=5: Process with moduleName "Incident Intake"
    const processRow = rows[5];
    expect(processRow[12]).toBe('Incident Intake'); // Text Area 4
  });

  it('outputs line rows with Source=None and Destination=Arrow', () => {
    const csv = generateWorkflowCsv(SPEC, 'CYB-IR001');
    const rows = parseRows(csv);

    // Line rows follow all shape rows.
    // shapes count = 7 (ids 3–9), so lines start at row index 3+7 = 10
    const firstLineRow = rows[3 + SPEC.shapes.length]; // id=100
    expect(firstLineRow[0]).toBe('100');
    expect(firstLineRow[1]).toBe('Line');
    expect(firstLineRow[2]).toBe('');        // Shape Library blank for lines
    expect(firstLineRow[3]).toBe('1');       // Page ID
    expect(firstLineRow[4]).toBe('');        // Contained By blank for lines
    expect(firstLineRow[5]).toBe('3');       // Line Source
    expect(firstLineRow[6]).toBe('4');       // Line Destination
    expect(firstLineRow[7]).toBe('None');    // Source Arrow
    expect(firstLineRow[8]).toBe('Arrow');   // Destination Arrow
    expect(firstLineRow[9]).toBe('');        // Text Area 1 (no branch label)
  });

  it('includes branch labels in Text Area 1 for labeled connections', () => {
    const csv = generateWorkflowCsv(SPEC, 'CYB-IR001');
    const rows = parseRows(csv);

    // Connection id=105 has label "Yes", id=106 has label "No"
    // Shapes: 7 rows (index 3..9), connections start at index 10
    const lineRows = rows.slice(3 + SPEC.shapes.length);
    const yesLine = lineRows.find(r => r[0] === '105');
    const noLine = lineRows.find(r => r[0] === '106');

    expect(yesLine).toBeDefined();
    expect(yesLine![9]).toBe('Yes');   // Text Area 1

    expect(noLine).toBeDefined();
    expect(noLine![9]).toBe('No');
  });

  it('CSV-escapes cells that contain commas', () => {
    const specWithComma: WorkflowCsvSpec = {
      lanes: ['Requester', 'System', 'Analyst', 'Approver'],
      shapes: [
        { id: 3, shapeType: 'Terminator', label: 'Start', lane: 1 },
        { id: 4, shapeType: 'Process', label: 'Review, Validate', lane: 2, taskTypeCode: 'BT-VAL', moduleId: 'M-VAL-01', moduleName: 'Validation, Check' },
        { id: 5, shapeType: 'Terminator', label: 'End', lane: 4 },
      ],
      connections: [
        { id: 100, source: 3, destination: 4 },
        { id: 101, source: 4, destination: 5 },
        { id: 102, source: 5, destination: 5 }, // extra to meet min=4
        { id: 103, source: 4, destination: 3 }, // extra to meet min=4
      ],
    };
    const csv = generateWorkflowCsv(specWithComma, 'TST-001');
    // Shape label "Review, Validate" must be quoted
    expect(csv).toContain('"Review, Validate"');
    // Module name "Validation, Check" must be quoted
    expect(csv).toContain('"Validation, Check"');
  });

  it('CSV-escapes cells that contain double-quote characters', () => {
    const specWithQuote: WorkflowCsvSpec = {
      lanes: ['Requester', 'System', 'Analyst', 'Approver'],
      shapes: [
        { id: 3, shapeType: 'Terminator', label: 'Start', lane: 1 },
        { id: 4, shapeType: 'Process', label: 'Say "Hello"', lane: 2, taskTypeCode: 'BT-INT', moduleId: 'M-INT-01', moduleName: 'Intake' },
        { id: 5, shapeType: 'Terminator', label: 'End', lane: 4 },
      ],
      connections: [
        { id: 100, source: 3, destination: 4 },
        { id: 101, source: 4, destination: 5 },
        { id: 102, source: 5, destination: 5 },
        { id: 103, source: 4, destination: 3 },
      ],
    };
    const csv = generateWorkflowCsv(specWithQuote, 'TST-002');
    // Label `Say "Hello"` must be wrapped in quotes with doubled internal quotes
    expect(csv).toContain('"Say ""Hello"""');
  });

  it('produces exactly 15 total rows for the shared fixture (header + page + lane + 7 shapes + 7 connections)', () => {
    const csv = generateWorkflowCsv(SPEC, 'CYB-IR001');
    const rows = parseRows(csv);
    // 1 header + 1 page + 1 swim lane + 7 shapes + 7 connections = 17
    expect(rows.length).toBe(1 + 1 + 1 + SPEC.shapes.length + SPEC.connections.length);
  });

  it('each row has exactly 15 columns', () => {
    const csv = generateWorkflowCsv(SPEC, 'CYB-IR001');
    const rows = parseRows(csv);
    for (const row of rows) {
      expect(row.length).toBe(15);
    }
  });
});
