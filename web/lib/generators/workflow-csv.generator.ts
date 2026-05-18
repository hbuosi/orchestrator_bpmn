import type { WorkflowCsvSpec } from '../schemas/manifest.schema';

/**
 * Escapes a single CSV cell value:
 * - wraps in double-quotes if the value contains commas, double-quotes, or newlines
 * - doubles any internal double-quote characters
 */
function csvCell(value: string | number | undefined): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Joins an array of cell values into a CSV row string (no trailing newline).
 */
function csvRow(cells: (string | number | undefined)[]): string {
  return cells.map(csvCell).join(',');
}

/**
 * Generates a Lucidchart-compatible CSV from a WorkflowCsvSpec.
 *
 * Format:
 *   Row 1: header
 *   Row 2: Page row  (id=1)
 *   Row 3: Swim Lane row (id=2), lane names in Text Area 1–6
 *   Rows 4+: Shape rows (shapes[].id, must start at 3+)
 *   Then: Line rows (connections[].id, recommended 100+)
 *
 * @param spec        The WorkflowCsvSpec produced by the AI
 * @param serviceCode The service code used to name the diagram (informational)
 */
export function generateWorkflowCsv(spec: WorkflowCsvSpec, serviceCode: string): string {
  const lines: string[] = [];

  // ── Header ────────────────────────────────────────────────────────────────
  lines.push(
    'Id,Name,Shape Library,Page ID,Contained By,Line Source,Line Destination,' +
    'Source Arrow,Destination Arrow,Text Area 1,Text Area 2,Text Area 3,Text Area 4,Text Area 5,Text Area 6'
  );

  // ── Page row ──────────────────────────────────────────────────────────────
  // Id=1, Name=Page, rest blank except Text Area 1 = "Page 1"
  lines.push(csvRow([1, 'Page', '', '', '', '', '', '', '', 'Page 1', '', '', '', '', '']));

  // ── Swim Lane row ─────────────────────────────────────────────────────────
  // Id=2, Name=Swim Lane, ShapeLibrary=Flowchart Shapes, PageID=1
  // Lane names fill Text Area 1–6 (up to 6 lanes; unused slots are blank)
  const laneCells: (string | undefined)[] = [
    spec.lanes[0],
    spec.lanes[1],
    spec.lanes[2],
    spec.lanes[3],
    spec.lanes[4],
    spec.lanes[5],
  ];
  lines.push(csvRow([
    2, 'Swim Lane', 'Flowchart Shapes', 1, '', '', '', '', '',
    laneCells[0], laneCells[1], laneCells[2], laneCells[3], laneCells[4], laneCells[5],
  ]));

  // ── Shape rows ────────────────────────────────────────────────────────────
  // Contained By = "2:{lane}" where lane is 1-indexed position in lanes array
  for (const shape of spec.shapes) {
    const containedBy = `2:${shape.lane}`;
    lines.push(csvRow([
      shape.id,
      shape.shapeType,
      'Flowchart Shapes',
      1,
      containedBy,
      '',                   // Line Source (blank for shapes)
      '',                   // Line Destination (blank for shapes)
      '',                   // Source Arrow (blank for shapes)
      '',                   // Destination Arrow (blank for shapes)
      shape.label,          // Text Area 1: shape label
      shape.taskTypeCode,   // Text Area 2: Task Type Code (omit for terminators)
      shape.moduleId,       // Text Area 3: Module ID
      shape.moduleName,     // Text Area 4: Module name
      '',                   // Text Area 5: (reserved)
      '',                   // Text Area 6: (reserved)
    ]));
  }

  // ── Line rows ─────────────────────────────────────────────────────────────
  // Source Arrow = None, Destination Arrow = Arrow
  // Branch label goes in Text Area 1 (only for branch/decision lines)
  for (const conn of spec.connections) {
    lines.push(csvRow([
      conn.id,
      'Line',
      '',                   // Shape Library (blank for lines)
      1,                    // Page ID
      '',                   // Contained By (blank for lines)
      conn.source,          // Line Source
      conn.destination,     // Line Destination
      'None',               // Source Arrow
      'Arrow',              // Destination Arrow
      conn.label,           // Text Area 1: branch label (blank if none)
      '',                   // Text Area 2
      '',                   // Text Area 3
      '',                   // Text Area 4
      '',                   // Text Area 5
      '',                   // Text Area 6
    ]));
  }

  return lines.join('\n') + '\n';
}
