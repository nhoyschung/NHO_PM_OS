'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TaskDetail } from '@/modules/tasks/components/task-detail';
import { transitionTaskStatus } from '@/modules/tasks/actions';
import type { TaskDetail as TaskDetailType, TaskStatus } from '@/modules/tasks/types';

interface TaskDetailClientProps {
  task: TaskDetailType;
}

export function TaskDetailClient({ task }: TaskDetailClientProps) {
  const router = useRouter();

  const handleTransition = useCallback(
    async (fromStatus: TaskStatus, toStatus: TaskStatus, notes?: string) => {
      const result = await transitionTaskStatus({ taskId: task.id, fromStatus, toStatus, notes });
      if (!result.success) {
        throw new Error(result.error ?? 'Đã xảy ra lỗi khi chuyển trạng thái.');
      }
      router.refresh();
    },
    [task.id, router],
  );

  return <TaskDetail task={task} onTransition={handleTransition} />;
}
