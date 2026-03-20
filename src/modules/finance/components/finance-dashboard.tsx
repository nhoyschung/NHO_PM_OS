'use client';

import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import type { ProjectFinanceSummary } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface FinanceDashboardProps {
  summaries: ProjectFinanceSummary[];
}

// ── Component ─────────────────────────────────────────────────────

export function FinanceDashboard({ summaries }: FinanceDashboardProps) {
  if (summaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500 rounded-lg border border-gray-200 bg-white">
        <AlertTriangle className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-sm">Chưa có dữ liệu tài chính theo dự án.</p>
      </div>
    );
  }

  // Grand totals
  const grandIncome = summaries.reduce((sum, s) => sum + s.totalIncome, 0);
  const grandExpense = summaries.reduce((sum, s) => sum + s.totalExpense, 0);
  const grandBalance = grandIncome - grandExpense;
  const grandRecords = summaries.reduce((sum, s) => sum + s.recordCount, 0);

  return (
    <div className="space-y-4">
      {/* Overview header */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Tổng quan tài chính theo dự án
        </h2>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Tên dự án
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Tổng thu
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Tổng chi
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Số dư
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Số bản ghi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summaries.map((row) => {
                const isDeficit = row.balance < 0;
                return (
                  <tr key={row.projectId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {isDeficit && (
                          <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        )}
                        {row.projectName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-green-700">
                      {formatCurrency(row.totalIncome)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-red-700">
                      {formatCurrency(row.totalExpense)}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 text-right font-semibold tabular-nums',
                        isDeficit ? 'text-orange-700' : 'text-blue-700',
                      )}
                    >
                      {row.balance >= 0 ? '+' : ''}
                      {formatCurrency(row.balance)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {row.recordCount.toLocaleString('vi-VN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Grand total footer */}
            <tfoot className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
              <tr>
                <td className="px-4 py-3 text-gray-900">Tổng cộng</td>
                <td className="px-4 py-3 text-right tabular-nums text-green-700">
                  {formatCurrency(grandIncome)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-red-700">
                  {formatCurrency(grandExpense)}
                </td>
                <td
                  className={cn(
                    'px-4 py-3 text-right tabular-nums',
                    grandBalance >= 0 ? 'text-blue-700' : 'text-orange-700',
                  )}
                >
                  {grandBalance >= 0 ? '+' : ''}
                  {formatCurrency(grandBalance)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                  {grandRecords.toLocaleString('vi-VN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
