import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Button from '../components/ui/Button';
import { useAuth } from '../lib/supabaseClient';

export default function SelectRole() {
  const router = useRouter();
  const { user, loading, updateUserMetadata } = useAuth();
  const [role, setRole] = useState<'patient'|'doctor'|''>('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const handleSave = async () => {
    if (!role) { setError('Please select a role'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { role };
      if (name) payload.name = name;
      await updateUserMetadata(payload);
      const next = (typeof window !== 'undefined')
        ? (localStorage.getItem('heartsense_oauth_postrole_next') || '/my-data')
        : '/my-data';
      if (typeof window !== 'undefined') {
        try { localStorage.removeItem('heartsense_oauth_postrole_next'); } catch(_){}
      }
      router.replace(next);
    } catch (e: any) {
      setError(e?.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <Head>
        <title>Select your role - HeartSense</title>
      </Head>
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-grow bg-gradient-to-br from-red-50 to-gray-50 py-16">
          <div className="max-w-lg mx-auto bg-white border border-gray-100 rounded-2xl shadow p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h1>
            <p className="text-gray-600 mb-6">Before continuing, please confirm your role and optionally your name.</p>

            {error && (
              <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name (optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="John Doe"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`px-4 py-3 rounded-xl border ${role==='patient' ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  🧑 Patient
                </button>
                <button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={`px-4 py-3 rounded-xl border ${role==='doctor' ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  👨‍⚕️ Doctor
                </button>
              </div>
            </div>

            <Button
              onClick={handleSave}
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={saving}
              disabled={saving || !role}
            >
              Continue
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
