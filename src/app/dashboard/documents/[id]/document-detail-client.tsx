'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentDetail } from '@/modules/documents/components/document-detail';
import { uploadNewVersion } from '@/modules/documents/actions';
import type { DocumentDetail as DocumentDetailType } from '@/modules/documents/types';

interface DocumentDetailClientProps {
  document: DocumentDetailType;
}

export function DocumentDetailClient({ document }: DocumentDetailClientProps) {
  const router = useRouter();

  const handleUploadVersion = useCallback(
    async (data: { documentId: string; changeSummary?: string; content?: string }) => {
      const result = await uploadNewVersion(data);
      if (result.success) {
        router.refresh();
      }
      return result;
    },
    [router],
  );

  return <DocumentDetail document={document} onUploadVersion={handleUploadVersion} />;
}
