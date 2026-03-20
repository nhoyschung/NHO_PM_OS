'use client';

import { cn } from '@/lib/utils';
import type { ComplianceReport } from '../types';

// ── Status Badge Colors ────────────────────────────────────────────

const STATUS_CONFIG = {
  pass: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đạt' },
  fail: { bg: 'bg-red-100', text: 'text-red-800', label: 'Không đạt' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Cảnh báo' },
} as const;

// ── Props ──────────────────────────────────────────────────────────

interface ComplianceDashboardProps {
  report: ComplianceReport;
}

// ── Component ──────────────────────────────────────────────────────

export function ComplianceDashboard({ report }: ComplianceDashboardProps) {
  const passRateColor =
    report.passRate >= 80
      ? 'text-green-700'
      : report.passRate >= 50
        ? 'text-yellow-700'
        : 'text-red-700';

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Tỷ lệ tuân thủ
            </h3>
            <p className="text-sm text-gray-500">
              Kiểm tra lần cuối:{' '}
              {report.timestamp.toLocaleString('vi-VN')}
            </p>
          </div>
          <div className={cn('text-4xl font-bold', passRateColor)}>
            {report.passRate}%
          </div>
        </div>
      </div>

      {/* Checks Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Kiểm tra
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Mô tả
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Trạng thái
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Chi tiết
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {report.checks.map((check, index) => {
              const config = STATUS_CONFIG[check.status];
              return (
                <tr key={index}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {check.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {check.description}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                        config.bg,
                        config.text,
                      )}
                    >
                      {config.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {check.details}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
