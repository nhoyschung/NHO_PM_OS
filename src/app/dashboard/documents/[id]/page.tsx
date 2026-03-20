import { notFound } from 'next/navigation';
import { getDocumentById } from '@/modules/documents/queries';
import { DocumentDetailClient } from './document-detail-client';

interface DocumentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { id } = await params;
  const document = await getDocumentById(id);

  if (!document) {
    notFound();
  }

  return <DocumentDetailClient document={document} />;
}
