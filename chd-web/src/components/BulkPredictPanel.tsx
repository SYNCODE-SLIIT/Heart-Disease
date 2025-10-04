"use client";

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
// No direct file upload API now; using JSON /batch
import { parseFile, normalizeBatch, cleanedCsv, type NormalizeResult } from '../lib/batchNormalize';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useAuth, supabase } from '../lib/supabaseClient';
import { uploadUserCSV } from '../lib/storage';


export default function BulkPredictPanel() {
  const { user } = useAuth();
  const [threshold, setThreshold] = useState(0.3);
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[] | undefined>();
  const [sheet, setSheet] = useState<string | undefined>();
  const [, setRawRows] = useState<Record<string, unknown>[] | null>(null);
  const [norm, setNorm] = useState<NormalizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [predictRes, setPredictRes] = useState<{
    count: number;
    results: { rowIndex: number; probability: number; label: string; topFactors: { feature: string; direction: string; impact: number }[]; messages: string[] }[];
    warnings: string[];
    errors: string[];
  } | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv'|'xlsx'>('xlsx');
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const mergedRows = (): Record<string, unknown>[] => {
    if (!norm || !predictRes) return [];
    const out: Record<string, unknown>[] = [];
    for (let i = 0; i < Math.min(norm.rows.length, predictRes.results.length); i++) {
      const base = norm.rows[i] as Record<string, unknown>;
      const r = predictRes.results[i];
      const tf = r.topFactors || [];
      const merged: Record<string, unknown> = {
        ...base,
        probability: r.probability,
        label: r.label,
      };
      // flatten top 3 factors
      tf.slice(0, 3).forEach((f, idx) => {
        const k = idx + 1;
        merged[`top${k}_feature`] = f.feature;
        merged[`top${k}_direction`] = f.direction;
        merged[`top${k}_impact`] = f.impact;
      });
      out.push(merged);
    }
    return out;
  };

  const downloadCsv = () => {
    const rows = mergedRows();
    if (!rows.length) return;
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heartsense_results_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setSheetNames(undefined);
    setSheet(undefined);
    setRawRows(null);
    setNorm(null);
    setPredictRes(null);
    setError(null);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Scroll back to top of the uploader
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const downloadXlsx = () => {
    const rows = mergedRows();
    if (!rows.length) return;
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    const fname = `heartsense_results_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.xlsx`;
    XLSX.writeFile(wb, fname);
  };

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
    onSuccess: () => {
      // Scroll to results after predictions are ready
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
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
        // Scroll to preview once normalized rows are set
        setTimeout(() => {
          previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
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
            ref={fileInputRef}
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
          <div className="md:col-span-3 flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="mt-2 inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              title="Reset and upload another file"
            >
              ↺ Reset
            </button>
          </div>
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
        <div ref={previewRef} className="bg-white rounded-2xl border border-gray-200 p-6">
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
          {/* Save cleaned preview removed — saving now occurs from the Results section and only saves prediction results (merged rows) */}
        </div>
      )}

      {/* Predictions */}
      {predictRes && (
        <div ref={resultsRef} className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-md font-semibold text-gray-900">Results</div>
            <div className="flex items-stretch gap-0 relative">
              {/* Left-side dropdown toggle */}
              <button
                type="button"
                onClick={() => setShowFormatMenu((s)=>!s)}
                className="px-3 py-2 border border-red-700 text-red-700 rounded-l-xl bg-white hover:bg-red-50"
                aria-haspopup="listbox"
                aria-expanded={showFormatMenu}
                title="Select format"
              >
                {exportFormat.toUpperCase()} ▾
              </button>
              {showFormatMenu && (
                <ul className="absolute right-36 top-10 z-10 bg-white border rounded-lg shadow text-sm" role="listbox">
                  <li
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    role="option"
                    aria-selected={exportFormat==='xlsx'}
                    onClick={()=>{setExportFormat('xlsx'); setShowFormatMenu(false);}}
                  >
                    XLSX
                  </li>
                  <li
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    role="option"
                    aria-selected={exportFormat==='csv'}
                    onClick={()=>{setExportFormat('csv'); setShowFormatMenu(false);}}
                  >
                    CSV
                  </li>
                </ul>
              )}
              {/* Big red download button */}
              <button
                type="button"
                onClick={() => exportFormat==='xlsx' ? downloadXlsx() : downloadCsv()}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-r-xl font-semibold"
              >
                Download
              </button>
              {/* Save to profile button - only available when user is signed in and predictions exist */}
              {user && (
                <button
                  type="button"
                  onClick={async () => {
                    setIsSaving(true);
                    setSaveStatus(null);
                    try {
                      const rows = mergedRows();
                      if (!rows || rows.length === 0) {
                        setSaveStatus('No prediction results to save. Run predictions first.');
                        return;
                      }

                      // Try to fetch model_version from the API meta endpoint; fallback to 'local-dev'
                      let modelVersion = 'local-dev';
                      try {
                        const metaRes = await fetch((process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000') + '/api/v1/meta');
                        if (metaRes.ok) {
                          const metaJson = await metaRes.json();
                          if (metaJson?.model_version) modelVersion = String(metaJson.model_version);
                        }
                      } catch (e) {
                        console.debug('Could not fetch model meta for model_version, using fallback', e);
                      }

                      // Augment rows with numeric prediction, threshold and model_version to match single-patient format
                      const enriched = rows.map((r) => {
                        const out = { ...r } as Record<string, unknown>;
                        // If label exists ('Yes'/'No'), derive numeric prediction
                        if (typeof out.label === 'string') {
                          out.prediction = out.label === 'Yes' ? 1 : 0;
                        } else if (typeof out.prediction === 'undefined') {
                          // keep existing prediction if present, else set to 0
                          out.prediction = 0;
                        }
                        out.threshold = threshold;
                        out.model_version = modelVersion;
                        return out;
                      });

                      const csv = Papa.unparse(enriched);
                      const filenameHint = 'batch_predictions';

                      if (!supabase) {
                        if (typeof window !== 'undefined') {
                          try {
                            localStorage.setItem('heartsense_pending_csv', String(csv));
                            localStorage.setItem('heartsense_pending_filename', filenameHint);
                            setSaveStatus('Saved locally. Configure Supabase (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY) to persist to your project.');
                          } catch (err) {
                            console.error('Failed to write pending CSV to localStorage', err);
                            setSaveStatus('Failed to save locally');
                          }
                        } else {
                          setSaveStatus('Supabase is not configured and localStorage is not available.');
                        }
                        return;
                      }

                      await uploadUserCSV(user!, csv, filenameHint);
                      setSaveStatus('Saved to your profile');
                    } catch (e: unknown) {
                      const msg = e instanceof Error ? e.message : 'Failed to save';
                      setSaveStatus(msg);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving || !(predictRes && predictRes.results && predictRes.results.length > 0)}
                  className="ml-3 px-4 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl"
                >
                  {isSaving ? 'Saving…' : 'Save to profile'}
                </button>
              )}
            </div>
          </div>
          {saveStatus && (
            <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm">{saveStatus}</div>
          )}
          {!user && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              Tip: Sign in to automatically save these batch results to your profile.
            </div>
          )}
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
