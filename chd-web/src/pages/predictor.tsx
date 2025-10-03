import { useEffect, useState } from 'react';
import Head from 'next/head';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import PredictorForm from '../components/PredictorForm';
import BulkPredictPanel from '../components/BulkPredictPanel';
import ProbabilityCard from '../components/ProbabilityCard';
import { PredictOut } from '../lib/types';
import { useAuth } from '../lib/supabaseClient';
import { uploadUserCSV } from '../lib/storage';
import Papa from 'papaparse';

export default function Predictor() {
  const [result, setResult] = useState<PredictOut | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const { user, isAuthenticated } = useAuth();
  const [lastInput, setLastInput] = useState<Record<string, unknown> | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleResult = (newResult: PredictOut) => {
    setResult(newResult);
    // Scroll to result
    setTimeout(() => {
      const resultElement = document.getElementById('prediction-result');
      if (resultElement) {
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Persist latest single prediction input+output to storage as CSV when available
  const persistSingle = async (input: Record<string, unknown>, output: PredictOut) => {
    if (!user) return;
    const row = { ...input, probability: output.probability, prediction: output.prediction, threshold: output.threshold, model_version: output.model_version };
    const csv = Papa.unparse([row]);
    await uploadUserCSV(user, csv, 'single_prediction');
  };

  // After login, if we have a pending CSV in localStorage, upload it
  useEffect(() => {
    const tryUploadPending = async () => {
      if (!isAuthenticated || !user) return;
      if (typeof window === 'undefined') return;
      const key = 'heartsense_pending_csv';
      const nameKey = 'heartsense_pending_filename';
      const csv = localStorage.getItem(key);
      if (csv) {
        try {
          setSaving(true);
          const fname = localStorage.getItem(nameKey) || 'prediction';
          await uploadUserCSV(user, csv, fname);
          setSaveMsg('Saved to your profile.');
        } catch (e) {
          setSaveMsg('Failed to save pending data.');
        } finally {
          setSaving(false);
          localStorage.removeItem(key);
          localStorage.removeItem(nameKey);
        }
      }
    };
    tryUploadPending();
  }, [isAuthenticated, user]);

  return (
    <>
      <Head>
        <title>Risk Predictor - HeartSense Assessment Tool</title>
        <meta name="description" content="Calculate your 10-year coronary heart disease risk using our advanced machine learning model." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/heart_icon.svg" />
      </Head>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Nav />
        
        <main className="flex-grow py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                <span className="text-red-600 font-bold">Heart</span>Sense
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Complete the form below to calculate your 10-year coronary heart disease risk probability. 
                Our AI model will analyze your health factors and provide a personalized assessment.
              </p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
              <div className="flex gap-2 border-b pb-2">
                <button
                  className={`px-4 py-2 rounded-lg ${activeTab==='single' ? 'bg-red-600 text-white' : 'hover:bg-gray-100'}`}
                  onClick={() => setActiveTab('single')}
                >
                  Single Patient
                </button>
                <button
                  className={`px-4 py-2 rounded-lg ${activeTab==='batch' ? 'bg-red-600 text-white' : 'hover:bg-gray-100'}`}
                  onClick={() => setActiveTab('batch')}
                >
                  Batch Upload
                </button>
              </div>
              {/* React state-based tab toggle */}
              {activeTab==='single' && (
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <div>
                  <div className="mb-3 text-sm text-gray-500">Using classification threshold <span className="font-semibold text-red-600">0.30</span></div>
                  {!isAuthenticated && (
                    <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800">
                      You don’t need an account to get predictions. Sign in only if you want to save your results to your profile.
                    </div>
                  )}
                  <PredictorForm onResult={async (r) => {
                    handleResult(r);
                    // Try to capture the last submitted form values from DOM; as a fallback we store just the output
                    try {
                      const formEl = document.querySelector('form');
                      const fd = formEl ? new FormData(formEl as HTMLFormElement) : null;
                      const obj: Record<string, unknown> = {};
                      if (fd) {
                        fd.forEach((v, k) => { obj[k] = v; });
                      }
                      setLastInput(obj);
                      await persistSingle(obj, r);
                    } catch {
                      setLastInput(null);
                      await persistSingle({}, r);
                    }
                  }} />
                </div>
                <div className="lg:sticky lg:top-8">
                  {result ? (
                    <div id="prediction-result" className="space-y-6">
                      {saveMsg && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">{saveMsg}</div>
                      )}
                      <ProbabilityCard result={result} />
                      <div className="flex gap-2">
                        <button
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300"
                          disabled={saving}
                          onClick={async () => {
                            setSaveMsg(null);
                            const input = lastInput || {};
                            const output = result;
                            const row = { ...input, probability: output.probability, prediction: output.prediction, threshold: output.threshold, model_version: output.model_version } as Record<string, unknown>;
                            const csv = Papa.unparse([row]);
                            if (!isAuthenticated || !user) {
                              if (typeof window !== 'undefined') {
                                localStorage.setItem('heartsense_pending_csv', csv);
                                localStorage.setItem('heartsense_pending_filename', 'single_prediction');
                                window.location.href = '/login?next=/predictor';
                              }
                              return;
                            }
                            try {
                              setSaving(true);
                              await uploadUserCSV(user, csv, 'single_prediction');
                              setSaveMsg('Saved to your profile.');
                            } catch (e) {
                              setSaveMsg('Failed to save.');
                            } finally {
                              setSaving(false);
                            }
                          }}
                        >{saving ? 'Saving…' : 'Save this result'}</button>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                        <div className="flex items-start">
                          <div className="text-yellow-600 text-2xl mr-3">⚠️</div>
                          <div>
                            <h3 className="font-semibold text-yellow-800 mb-2">Important Disclaimer</h3>
                            <p className="text-yellow-700 text-sm leading-relaxed">
                              This prediction is for <strong>educational and research purposes only</strong>.
                              It should not be used as a substitute for professional medical advice, diagnosis,
                              or treatment. Always consult with qualified healthcare providers for medical decisions
                              and personalized cardiovascular risk management.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                        <h3 className="font-semibold text-blue-800 mb-3">💡 Next Steps</h3>
                        <ul className="text-blue-700 text-sm space-y-2">
                          <li>• Discuss these results with your healthcare provider</li>
                          <li>• Consider lifestyle modifications if appropriate</li>
                          <li>• Follow up with regular health screenings</li>
                          <li>• Monitor and manage modifiable risk factors</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                      <div className="text-gray-400 text-6xl mb-4">📊</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Results Will Appear Here</h3>
                      <p className="text-gray-600">Complete the form to the left to calculate your CHD risk probability.</p>
                    </div>
                  )}
                </div>
              </div>
              )}
              {activeTab==='batch' && (
                <div className="mt-4">
                  {!isAuthenticated && (
                    <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800">
                      You can run batch predictions without signing in. Sign in only if you want the results saved to your profile.
                    </div>
                  )}
                  <BulkPredictPanel />
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}