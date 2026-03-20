import { notFound } from 'next/navigation';
import { getFinanceRecordById } from '@/modules/finance/queries';
import { FinanceDetailClient } from './finance-detail-client';

interface FinanceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FinanceDetailPage({ params }: FinanceDetailPageProps) {
  const { id } = await params;
  const record = await getFinanceRecordById(id);

  if (!record) {
    notFound();
  }

  return <FinanceDetailClient record={record} />;
}
