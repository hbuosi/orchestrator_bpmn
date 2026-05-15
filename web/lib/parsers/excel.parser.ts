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

export function parsedFileToText(parsed: ParsedFile): string {
  const lines: string[] = [
    `File: ${parsed.fileName}`,
    `Sheets: ${parsed.sheets.map(s => s.name).join(', ')}`,
    '',
  ];

  for (const sheet of parsed.sheets) {
    lines.push(`=== Sheet: ${sheet.name} ===`);
    lines.push(`Columns: ${sheet.headers.join(' | ')}`);
    lines.push('');

    for (const row of sheet.rows) {
      const pairs = sheet.headers
        .map(h => `${h}: ${row[h]}`)
        .filter(p => !p.endsWith(': '));
      if (pairs.length > 0) lines.push(pairs.join(' | '));
    }

    lines.push('');
  }

  return lines.join('\n');
}
