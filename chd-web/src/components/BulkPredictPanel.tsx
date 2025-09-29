"use client";

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { postBatchPredict, getBatchExportUrl } from '../lib/api';
import type { BatchPredictResponse, BatchRow, RiskLevel } from '../lib/types';

function riskChip(level: RiskLevel) {
  const styles: Record<RiskLevel, string> = {
    Low: 'bg-green-100 text-green-800',
    Medium: 'bg-amber-100 text-amber-800',
    High: 'bg-red-100 text-red-800',
  };
  return styles[level];
}

export default function BulkPredictPanel() {
  const [threshold, setThreshold] = useState(0.3);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BatchPredictResponse | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Please select a CSV or XLSX file');
      const res = await postBatchPredict(file, threshold, true, 100);
      setResult(res);
      return res;
    },
  });

  const rowCount = result?.total ?? 0;
  const rows: BatchRow[] | undefined =
    result && 'rows' in result ? (result.rows as BatchRow[]) : result && 'preview_rows' in result ? (result.preview_rows as BatchRow[]) : undefined;

  const handleFileChange = (f: File | null) => setFile(f);

  return (
    <div className="space-y-6">
      {/* Uploader */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Batch Upload</h3>
          <div className="text-sm text-gray-500">CSV or XLSX up to ~20MB</div>
        </div>

        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-gray-50">
          <input
            type="file"
            accept=".csv, .xls, .xlsx"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
          <div className="text-center">
            <div className="text-4xl mb-2">📤</div>
            <div className="text-gray-700">{file ? file.name : 'Drag & drop or click to upload'}</div>
          </div>
        </label>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Classification Threshold</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0.05}
                max={0.95}
                step={0.01}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full"
              />
              <input
                type="number"
                min={0.05}
                max={0.95}
                step={0.01}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-24 px-3 py-2 border rounded-lg"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Lower = more positives (sensitivity↑); Higher = fewer positives (specificity↑).</p>
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={!file || mutation.isPending}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-6 py-3 rounded-xl font-semibold"
          >
            {mutation.isPending ? 'Processing…' : 'Run Predictions'}
          </button>
        </div>

        {rowCount > 0 && (
          <div className="mt-4 text-sm text-gray-600">Detected rows: {rowCount}</div>
        )}
      </div>

      {/* Diagnostics */}
      {result && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Data Checks</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div><strong>Model version:</strong> {result.model_version}</div>
              <div><strong>Threshold used:</strong> {result.threshold}</div>
              {result.missing_inserted?.length > 0 && (
                <div className="mt-2"><strong>Missing inserted:</strong> {result.missing_inserted.join(', ')}</div>
              )}
              {result.extras_dropped?.length > 0 && (
                <div className="mt-1"><strong>Extras dropped:</strong> {result.extras_dropped.join(', ')}</div>
              )}
            </div>
            <div>
              {result.warnings?.length > 0 && (
                <div>
                  <strong>Warnings:</strong>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    {result.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table / Preview */}
      {rows && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-md font-semibold text-gray-900">{rowCount <= 100 ? 'Results' : 'Preview (first 10 rows)'}</div>
            {result && (
              <div className="flex gap-2">
                <a href={getBatchExportUrl(result.batch_id, 'csv')} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">CSV</a>
                <a href={getBatchExportUrl(result.batch_id, 'xlsx')} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">Excel</a>
                <a href={getBatchExportUrl(result.batch_id, 'pdf')} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">PDF</a>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  {Object.keys(rows[0] || {}).map((h) => (
                    <th key={h} className="px-3 py-2 border-b">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const level = r.risk_level as RiskLevel;
                  const rowBg = level === 'High' ? 'bg-red-50' : level === 'Medium' ? 'bg-amber-50' : '';
                  return (
                    <tr key={idx} className={rowBg}>
                      {Object.entries(r).map(([k, v]) => (
                        <td key={k} className="px-3 py-2 border-b align-top">
                          {k === 'risk_level' ? (
                            <span aria-label={`Risk: ${String(v)}`} className={`px-2 py-1 rounded-full text-xs font-medium ${riskChip(level)}`}>{String(v)}</span>
                          ) : (
                            String(v ?? '')
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
