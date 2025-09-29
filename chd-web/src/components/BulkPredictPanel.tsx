"use client";

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
// No direct file upload API now; using JSON /batch
import { parseFile, normalizeBatch, cleanedCsv, type NormalizeResult } from '../lib/batchNormalize';


export default function BulkPredictPanel() {
  const [threshold, setThreshold] = useState(0.3);
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[] | undefined>();
  const [sheet, setSheet] = useState<string | undefined>();
  const [, setRawRows] = useState<Record<string, unknown>[] | null>(null);
  const [norm, setNorm] = useState<NormalizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [predictRes, setPredictRes] = useState<{
    count: number;
    results: { rowIndex: number; probability: number; label: string; topFactors: { feature: string; direction: string; impact: number }[]; messages: string[] }[];
    warnings: string[];
    errors: string[];
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!norm) throw new Error('No cleaned rows to submit');
      const body = { rows: norm.rows, threshold };
      const response = await fetch((process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000') + '/api/v1/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const t = await response.text();
        throw new Error(t);
      }
      const data = await response.json();
      setPredictRes(data);
      return data;
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Request failed';
      setError(msg);
    },
  });

  const rowCount = norm?.rows.length ?? 0;

  const handleFileChange = async (f: File | null) => {
    setFile(f);
    setPredictRes(null);
    setNorm(null);
    setError(null);
    setSheetNames(undefined);
    setSheet(undefined);
    if (f) {
      try {
        const parsed = await parseFile(f);
        setRawRows(parsed.rows);
        setSheetNames(parsed.sheetNames);
        setSheet(parsed.usedSheet);
        const n = normalizeBatch(parsed.rows);
        setNorm(n);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to read file';
        setError(msg);
      }
    } else {
      setRawRows(null);
    }
  };

  const onDragOver: React.DragEventHandler<HTMLLabelElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const onDragLeave: React.DragEventHandler<HTMLLabelElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const onDrop: React.DragEventHandler<HTMLLabelElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) {
      await handleFileChange(f);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">{error}</div>
      )}

      {/* Uploader */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Batch Upload</h3>
          <div className="text-sm text-gray-500">CSV or XLSX up to ~20MB</div>
        </div>

        <label
          className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer ${isDragging ? 'bg-gray-100 border-red-400' : 'hover:bg-gray-50'}`}
          onDragOver={onDragOver}
          onDragEnter={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
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

        {sheetNames && sheetNames.length > 1 && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Worksheet</label>
            <select className="border rounded-lg px-3 py-2" value={sheet} onChange={async (e) => {
              const s = e.target.value; setSheet(s);
              if (file) {
                const parsed = await parseFile(file, s);
                setRawRows(parsed.rows);
                const n = normalizeBatch(parsed.rows);
                setNorm(n);
              }
            }}>
              {sheetNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}

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
            disabled={!norm || norm.issues.some(i=>i.severity==='error') || mutation.isPending}
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
      {norm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Data Checks</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div><strong>Threshold to apply:</strong> {threshold}</div>
              {norm.extras.length > 0 && (
                <div className="mt-2"><strong>Ignored columns:</strong> {norm.extras.join(', ')}</div>
              )}
              <div className="mt-2">
                <a className="text-blue-600 hover:underline" href="/heartsense_template.csv" download>Download template CSV</a>
              </div>
            </div>
            <div>
              {norm.warnings.length > 0 && (
                <div>
                  <strong>Warnings:</strong>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    {norm.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                  </ul>
                </div>
              )}
              {norm.issues.length > 0 && (
                <div className="mt-2">
                  <strong>Validation issues:</strong>
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    {norm.issues.map((i, idx) => (
                      <li key={idx} className={i.severity==='error' ? 'text-red-700' : 'text-amber-700'}>
                        {i.rowIndex>=0 ? `Row ${i.rowIndex+1}: `: ''}{i.message}{i.field?` (${i.field})`:''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          {norm && norm.rows.length>0 && (
            <div className="mt-4">
              <a
                className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(cleanedCsv(norm.rows))}`}
                download="heartsense_cleaned.csv"
              >Download cleaned CSV</a>
            </div>
          )}
        </div>
      )}

      {/* Preview of cleaned rows */}
      {norm && norm.rows.length>0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-md font-semibold text-gray-900">Preview of cleaned data (first 10 rows)</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  {Object.keys(norm.rows[0] || {}).slice(0, 20).map((h) => (
                    <th key={h} className="px-3 py-2 border-b">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {norm.rows.slice(0,10).map((r, idx) => (
                  <tr key={idx}>
                    {Object.entries(r).map(([k, v]) => (
                      <td key={k} className="px-3 py-2 border-b align-top">{String(v ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Predictions */}
      {predictRes && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-md font-semibold text-gray-900">Results</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="px-3 py-2 border-b">rowIndex</th>
                  <th className="px-3 py-2 border-b">probability</th>
                  <th className="px-3 py-2 border-b">label</th>
                  <th className="px-3 py-2 border-b">topFactors</th>
                </tr>
              </thead>
              <tbody>
                {predictRes.results.map((r) => (
                  <tr key={r.rowIndex} className={r.label==='Yes' ? 'bg-red-50' : r.probability>=0.3 ? 'bg-amber-50' : ''}>
                    <td className="px-3 py-2 border-b">{r.rowIndex+1}</td>
                    <td className="px-3 py-2 border-b">{(r.probability*100).toFixed(1)}%</td>
                    <td className="px-3 py-2 border-b">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.label==='Yes' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{r.label}</span>
                    </td>
                    <td className="px-3 py-2 border-b">
                      <div className="flex flex-wrap gap-2">
                        {r.topFactors.map((f, i) => (
                          <span key={i} className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            {f.feature} {f.direction}{f.impact}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
