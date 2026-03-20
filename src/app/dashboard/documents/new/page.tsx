'use client';

import { useCallback } from 'react';
import { DocumentUploadForm } from '@/modules/documents/components/document-upload-form';
import { uploadDocument } from '@/modules/documents/actions';
import type { DocumentFormData } from '@/modules/documents/types';

export default function NewDocumentPage() {
  const handleSubmit = useCallback(async (data: DocumentFormData) => {
    return uploadDocument(data);
  }, []);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <DocumentUploadForm
        onSubmit={handleSubmit}
        title="Tạo tài liệu mới"
      />
    </div>
  );
}
