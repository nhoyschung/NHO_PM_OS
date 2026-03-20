'use client';

import { useState, useRef, useTransition } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CSV_REQUIRED_COLUMNS } from '../constants';
import type { CsvImportResult } from '../types';

// ── Types ─────────────────────────────────────────────────────────

interface FinanceCsvImportProps {
  onImport: (rows: Record<string, unknown>[]) => Promise<{ success: boolean; data?: CsvImportResult; error?: string }>;
}

// ── CSV Parser ────────────────────────────────────────────────────

function parseCsvText(text: string): { headers: string[]; rows: Record<string, unknown>[] } {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]!.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]!] = values[j] ?? '';
    }
    rows.push(row);
  }

  return { headers, rows };
}

// ── Component ─────────────────────────────────────────────────────

export function FinanceCsvImport({ onImport }: FinanceCsvImportProps) {
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[] | null>(null);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setParseError(null);
    setParsedRows(null);
    setResult(null);
    setServerError(null);
    setFileName(file.name);

    if (!file.name.endsWith('.csv')) {
      setParseError('Chỉ hỗ trợ file CSV.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCsvText(text);

      // Validate required columns
      const missingCols = CSV_REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
      if (missingCols.length > 0) {
        setParseError(`Thiếu các cột bắt buộc: ${missingCols.join(', ')}`);
        return;
      }

      if (rows.length === 0) {
        setParseError('File CSV không có dữ liệu.');
        return;
      }

      setParsedRows(rows);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = () => {
    if (!parsedRows) return;
    setServerError(null);

    startTransition(async () => {
      const res = await onImport(parsedRows);
      if (!res.success) {
        setServerError(res.error ?? 'Có lỗi xảy ra khi nhập dữ liệu.');
      } else if (res.data) {
        setResult(res.data);
        setParsedRows(null);
      }
    });
  };

  const handleReset = () => {
    setFileName(null);
    setParseError(null);
    setParsedRows(null);
    setResult(null);
    setServerError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Nhập CSV</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Nhập nhiều bản ghi tài chính từ file CSV.
          </p>
        </div>
        {(fileName || result) && (
          <button onClick={handleReset} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            <X className="h-4 w-4" />
            Đặt lại
          </button>
        )}
      </div>

      {/* Required columns info */}
      <div className="rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <p className="font-medium mb-1">Các cột bắt buộc trong file CSV:</p>
        <p className="font-mono text-xs">{CSV_REQUIRED_COLUMNS.join(', ')}</p>
      </div>

      {/* Drop zone */}
      {!parsedRows && !result && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100',
          )}
        >
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">
            Kéo thả file CSV vào đây hoặc{' '}
            <span className="text-blue-600">click để chọn</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Chỉ hỗ trợ .csv</p>
          {fileName && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              {fileName}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* Parse error */}
      {parseError && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {parseError}
        </div>
      )}

      {/* Preview */}
      {parsedRows && !result && (
        <div className="space-y-3">
          <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              <span className="font-medium">{fileName}</span> — {parsedRows.length} dòng dữ liệu
            </span>
          </div>

          {serverError && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {serverError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {isPending ? 'Đang nhập...' : `Nhập ${parsedRows.length} bản ghi`}
            </button>
            <button
              onClick={handleReset}
              disabled={isPending}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <p className="font-medium">Nhập hoàn tất</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center rounded-md bg-green-50 p-3">
              <p className="text-2xl font-bold text-green-700">{result.imported}</p>
              <p className="text-gray-600 mt-0.5">Thành công</p>
            </div>
            <div className="text-center rounded-md bg-yellow-50 p-3">
              <p className="text-2xl font-bold text-yellow-700">{result.skipped}</p>
              <p className="text-gray-600 mt-0.5">Bỏ qua</p>
            </div>
            <div className="text-center rounded-md bg-red-50 p-3">
              <p className="text-2xl font-bold text-red-700">{result.errors.length}</p>
              <p className="text-gray-600 mt-0.5">Lỗi</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="rounded-md bg-red-50 p-3 space-y-1">
              <p className="text-sm font-medium text-red-700">Chi tiết lỗi:</p>
              <ul className="text-xs text-red-600 space-y-0.5 max-h-32 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <li key={i}>Dòng {e.row}: {e.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
