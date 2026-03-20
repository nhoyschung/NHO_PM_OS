import { notFound } from 'next/navigation';
import { getTaskById } from '@/modules/tasks/queries';
import { TaskDetailClient } from './task-detail-client';

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;
  const task = await getTaskById(id);

  if (!task) {
    notFound();
  }

  return <TaskDetailClient task={task} />;
}
