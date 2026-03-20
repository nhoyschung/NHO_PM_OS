import type { CsvColumn } from './types';
import { UTF8_BOM } from './constants';

/** Escape a CSV field — wrap in quotes if it contains comma, newline, or quote. */
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Convert data rows to a CSV string with UTF-8 BOM for Excel compatibility. */
export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: CsvColumn<T>[],
): string {
  const header = columns.map((col) => escapeCsvField(col.header)).join(',');

  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        const formatted = col.format ? col.format(value) : String(value ?? '');
        return escapeCsvField(formatted);
      })
      .join(','),
  );

  return UTF8_BOM + [header, ...rows].join('\n');
}
