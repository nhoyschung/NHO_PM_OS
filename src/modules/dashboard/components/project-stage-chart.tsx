'use client';

import { STAGE_LABELS, STAGE_COLORS } from '@/modules/projects/constants';
import type { ProjectStage } from '@/modules/projects/types';

// ── Stage Order for Chart ───────────────────────────────────────

const STAGE_ORDER: ProjectStage[] = [
  'initiation',
  'planning',
  'in_progress',
  'review',
  'testing',
  'staging',
  'deployment',
  'monitoring',
  'handover',
  'completed',
];

// ── Project Stage Chart Component (CSS-based bar chart) ─────────

interface ProjectStageChartProps {
  countByStage: Record<string, number>;
}

export function ProjectStageChart({ countByStage }: ProjectStageChartProps) {
  const maxCount = Math.max(
    1,
    ...STAGE_ORDER.map((stage) => countByStage[stage] ?? 0),
  );

  const totalProjects = STAGE_ORDER.reduce(
    (sum, stage) => sum + (countByStage[stage] ?? 0),
    0,
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="pb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Dự án theo giai đoạn
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({totalProjects} tổng)
          </span>
        </h3>
      </div>
      <div className="space-y-3">
        {STAGE_ORDER.map((stage) => {
          const stageCount = countByStage[stage] ?? 0;
          const percentage = (stageCount / maxCount) * 100;
          const colors = STAGE_COLORS[stage];

          return (
            <div key={stage} className="flex items-center gap-3">
              <div className="w-28 text-xs text-gray-500 truncate flex-shrink-0">
                {STAGE_LABELS[stage]}
              </div>
              <div className="flex-1 h-6 bg-gray-100 rounded-sm overflow-hidden">
                <div
                  className={`h-full ${colors.bg} rounded-sm transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-8 text-xs font-medium text-right flex-shrink-0 text-gray-900">
                {stageCount}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
