'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ProjectListItem } from '@/modules/projects/types';

// ── Stage / Priority Label Maps (Vietnamese) ────────────────────────

const STAGE_LABELS: Record<string, string> = {
  initiation: 'Khởi tạo',
  planning: 'Lập kế hoạch',
  in_progress: 'Đang thực hiện',
  review: 'Đánh giá',
  testing: 'Kiểm thử',
  staging: 'Tiền triển khai',
  deployment: 'Triển khai',
  monitoring: 'Giám sát',
  handover: 'Bàn giao',
  completed: 'Hoàn thành',
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Nghiêm trọng',
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: 'bg-red-100', text: 'text-red-800' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  low: { bg: 'bg-green-100', text: 'text-green-800' },
};

// ── Props ──────────────────────────────────────────────────────────

interface PartnerProjectListProps {
  projects: ProjectListItem[];
}

// ── Component ──────────────────────────────────────────────────────

export function PartnerProjectList({ projects }: PartnerProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-500">Bạn chưa tham gia dự án nào.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Mã
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Tên dự án
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Giai đoạn
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Ưu tiên
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Tiến độ
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {projects.map((project) => {
            const priorityConfig = PRIORITY_COLORS[project.priority] ?? {
              bg: 'bg-gray-100',
              text: 'text-gray-800',
            };
            return (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-gray-500">
                  {project.code}
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  <Link
                    href={`/partner/projects/${project.id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {project.name}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {STAGE_LABELS[project.stage] ?? project.stage}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                      priorityConfig.bg,
                      priorityConfig.text,
                    )}
                  >
                    {PRIORITY_LABELS[project.priority] ?? project.priority}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {project.progressPercentage ?? 0}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
