import { notFound } from 'next/navigation';
import { getHandoverById } from '@/modules/handovers/queries';
import { HandoverDetailClient } from './handover-detail-client';

interface HandoverDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function HandoverDetailPage({ params }: HandoverDetailPageProps) {
  const { id } = await params;
  const handover = await getHandoverById(id);

  if (!handover) {
    notFound();
  }

  return <HandoverDetailClient handover={handover} />;
}
