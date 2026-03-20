'use client';

import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────

interface ReportPreviewProps {
  columns: { key: string; header: string }[];
  rows: Record<string, unknown>[];
  formatters?: Record<string, (value: unknown) => string>;
}

// ── Component ────────────────────────────────────────────────────

export function ReportPreview({ columns, rows, formatters }: ReportPreviewProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-sm text-gray-500">Không có dữ liệu để hiển thị.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {rows.slice(0, 50).map((row, idx) => (
            <tr key={idx} className={cn(idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
              {columns.map((col) => {
                const value = row[col.key];
                const formatter = formatters?.[col.key];
                const display = formatter
                  ? formatter(value)
                  : value instanceof Date
                    ? value.toISOString().split('T')[0]
                    : String(value ?? '—');
                return (
                  <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 50 && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-center text-xs text-gray-500">
          Hiển thị 50 / {rows.length} dòng. Tải xuống để xem toàn bộ.
        </div>
      )}
    </div>
  );
}
