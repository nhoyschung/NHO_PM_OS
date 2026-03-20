'use client';

import { TrendingUp, TrendingDown, Scale, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import type { FinanceSummary } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface FinanceSummaryCardsProps {
  summary: FinanceSummary;
}

// ── Summary Card ──────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}

function SummaryCard({ label, value, subLabel, icon, colorClass, bgClass }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 flex items-center gap-4">
      <div className={cn('rounded-full p-3', bgClass)}>
        <div className={colorClass}>{icon}</div>
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={cn('text-xl font-bold tabular-nums', colorClass)}>{value}</p>
        {subLabel && <p className="text-xs text-gray-400 mt-0.5">{subLabel}</p>}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────

export function FinanceSummaryCards({ summary }: FinanceSummaryCardsProps) {
  const { totalIncome, totalExpense, balance, totalRecords } = summary;

  const balanceIsPositive = balance >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Tổng thu */}
      <SummaryCard
        label="Tổng thu"
        value={formatCurrency(totalIncome)}
        subLabel="Thu nhập / phân bổ ngân sách"
        icon={<TrendingUp className="h-5 w-5" />}
        colorClass="text-green-700"
        bgClass="bg-green-100"
      />

      {/* Tổng chi */}
      <SummaryCard
        label="Tổng chi"
        value={formatCurrency(totalExpense)}
        subLabel="Chi phí / hóa đơn / thanh toán"
        icon={<TrendingDown className="h-5 w-5" />}
        colorClass="text-red-700"
        bgClass="bg-red-100"
      />

      {/* Số dư */}
      <SummaryCard
        label="Số dư"
        value={`${balanceIsPositive ? '+' : ''}${formatCurrency(balance)}`}
        subLabel={balanceIsPositive ? 'Dư dương' : 'Vượt chi'}
        icon={<Scale className="h-5 w-5" />}
        colorClass={balanceIsPositive ? 'text-blue-700' : 'text-orange-700'}
        bgClass={balanceIsPositive ? 'bg-blue-100' : 'bg-orange-100'}
      />

      {/* Số bản ghi */}
      <SummaryCard
        label="Số bản ghi"
        value={totalRecords.toLocaleString('vi-VN')}
        subLabel="Tổng số giao dịch"
        icon={<BarChart2 className="h-5 w-5" />}
        colorClass="text-gray-700"
        bgClass="bg-gray-100"
      />
    </div>
  );
}
