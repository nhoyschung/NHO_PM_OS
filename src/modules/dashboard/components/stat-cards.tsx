'use client';

import {
  FolderKanban,
  Loader,
  AlertTriangle,
  ArrowRightLeft,
  DollarSign,
  CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import type { DashboardStats } from '../types';

// ── Color Map ───────────────────────────────────────────────────

const ICON_COLORS = {
  blue: 'text-blue-600 bg-blue-100',
  green: 'text-green-600 bg-green-100',
  red: 'text-red-600 bg-red-100',
  yellow: 'text-yellow-600 bg-yellow-100',
  purple: 'text-purple-600 bg-purple-100',
  orange: 'text-orange-600 bg-orange-100',
} as const;

// ── Stat Cards Component ────────────────────────────────────────

interface StatCardsProps {
  stats: DashboardStats;
}

export function StatCards({ stats }: StatCardsProps) {
  const activeCount = stats.projects.totalProjects -
    (stats.projects.countByStage['completed'] ?? 0);

  const cards = [
    {
      label: 'Tổng dự án',
      value: String(stats.projects.totalProjects),
      sublabel: `${activeCount} đang hoạt động`,
      icon: FolderKanban,
      color: 'blue' as const,
    },
    {
      label: 'Dự án đang thực hiện',
      value: String(stats.projects.countByStage['in_progress'] ?? 0),
      sublabel: `${stats.projects.countByStage['review'] ?? 0} đang đánh giá`,
      icon: Loader,
      color: 'purple' as const,
    },
    {
      label: 'Công việc quá hạn',
      value: String(stats.tasks.overdueCount),
      sublabel: `${stats.tasks.totalTasks} tổng công việc`,
      icon: AlertTriangle,
      color: (stats.tasks.overdueCount > 0 ? 'red' : 'green') as 'red' | 'green',
    },
    {
      label: 'Bàn giao chờ phê duyệt',
      value: String(stats.pendingHandovers),
      sublabel: undefined,
      icon: ArrowRightLeft,
      color: (stats.pendingHandovers > 0 ? 'orange' : 'green') as 'orange' | 'green',
    },
    {
      label: 'Số dư tài chính',
      value: formatCurrency(stats.finance.balance),
      sublabel: `Thu: ${formatCurrency(stats.finance.totalIncome)} / Chi: ${formatCurrency(stats.finance.totalExpense)}`,
      icon: DollarSign,
      color: (stats.finance.balance >= 0 ? 'green' : 'red') as 'green' | 'red',
    },
    {
      label: 'Công việc hoàn thành',
      value: String(stats.tasks.countByStatus['done'] ?? 0),
      sublabel: `${stats.tasks.countByStatus['in_progress'] ?? 0} đang thực hiện`,
      icon: CheckSquare,
      color: 'green' as const,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <div className={cn('rounded-md p-2', ICON_COLORS[card.color])}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            {card.sublabel && (
              <p className="text-xs text-gray-500 mt-1">{card.sublabel}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
