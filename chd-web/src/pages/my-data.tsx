import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../lib/supabaseClient';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Button from '../components/ui/Button';
import { listUserCSVs, downloadCSV, type UserCsvObject } from '../lib/storage';
import Papa from 'papaparse';

export default function MyData() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<UserCsvObject[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [combined, setCombined] = useState<Record<string, string>[] | null>(null);
  const [isCombining, setIsCombining] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/login?next=/my-data');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const list = await listUserCSVs(user);
        setRows(list);
      } catch (e: any) {
        setErr(e?.message || 'Failed to load your files');
      }
    };
    load();
  }, [user]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>My Data - HeartSense</title>
        <meta name="description" content="View and manage your saved HeartSense analyses" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/heart_icon.svg" />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Nav />

        <main className="flex-grow bg-gradient-to-br from-red-50 to-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Data</h1>
              <p className="text-gray-600">Your saved analyses and predictions</p>
            </div>

            {/* Saved CSVs */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Saved CSV Files</h2>
                <Link href="/predictor"><Button variant="secondary" size="sm">New Assessment</Button></Link>
              </div>
              {err && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">{err}</div>
              )}
              {rows && rows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="px-3 py-2 border-b">File</th>
                        <th className="px-3 py-2 border-b">Updated</th>
                        <th className="px-3 py-2 border-b">Size</th>
                        <th className="px-3 py-2 border-b text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.path}>
                          <td className="px-3 py-2 border-b">{r.name}</td>
                          <td className="px-3 py-2 border-b">{r.updated_at ? new Date(r.updated_at).toLocaleString() : '—'}</td>
                          <td className="px-3 py-2 border-b">{typeof r.size === 'number' ? `${(r.size/1024).toFixed(1)} KB` : '—'}</td>
                          <td className="px-3 py-2 border-b text-right">
                            <Button
                              variant="primary"
                              size="sm"
                              isLoading={downloading === r.path}
                              onClick={async () => {
                                try {
                                  setDownloading(r.path);
                                  const text = await downloadCSV(r.path);
                                  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = r.name || 'data.csv';
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                } finally {
                                  setDownloading(null);
                                }
                              }}
                            >Download</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-600">No files yet. Run a single or batch prediction to save results.</div>
              )}
            </div>

            {/* Combined Table */}
            {rows && rows.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">All Data (Combined)</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={isCombining}
                      onClick={async () => {
                        if (!rows) return;
                        setIsCombining(true);
                        setErr(null);
                        try {
                          const all: Record<string, string>[] = [];
                          for (const r of rows) {
                            const text = await downloadCSV(r.path);
                            const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
                            if (parsed.data) all.push(...parsed.data);
                          }
                          setCombined(all);
                          setPage(1);
                        } catch (e: any) {
                          setErr(e?.message || 'Failed to build combined table');
                        } finally {
                          setIsCombining(false);
                        }
                      }}
                    >Load Combined Table</Button>
                    {combined && combined.length > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const csv = Papa.unparse(combined);
                          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'heartsense_combined.csv';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                      >Export CSV</Button>
                    )}
                  </div>
                </div>
                {combined && (
                  combined.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600">
                            {Object.keys(combined[0]).slice(0, 30).map((h) => (
                              <th key={h} className="px-3 py-2 border-b">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {combined.slice((page-1)*pageSize, page*pageSize).map((row, idx) => (
                            <tr key={idx}>
                              {Object.keys(combined[0]).slice(0, 30).map((h) => (
                                <td key={h} className="px-3 py-2 border-b">{row[h] ?? ''}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                        <div>
                          Showing {(page-1)*pageSize+1}-{Math.min(page*pageSize, combined.length)} of {combined.length}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" disabled={page===1} onClick={() => setPage((p)=>Math.max(1,p-1))}>Prev</Button>
                          <Button variant="ghost" size="sm" disabled={page*pageSize>=combined.length} onClick={() => setPage((p)=>p+1)}>Next</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-600">No rows found in your CSVs.</div>
                  )
                )}
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
