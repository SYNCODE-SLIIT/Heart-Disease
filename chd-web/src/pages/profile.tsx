import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Button from '../components/ui/Button';
import { useAuth } from '../lib/supabaseClient';
import { supabase } from '../lib/supabaseClient';

export default function Profile() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [err, setErr] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/profile');
  }, [loading, user, router]);

  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url as string);
    }
  }, [user]);

  if (loading || (!user && !err)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Head>
  <title>My Profile - HeartSense</title>
  <meta name="description" content="Manage your profile information" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/heart_icon.svg" />
      </Head>
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-grow bg-gradient-to-br from-red-50 to-gray-50 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600">View and update your profile information.</p>
            </div>

            {err && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{err}</div>
            )}

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="flex-shrink-0">
                  <div className="w-28 h-28 rounded-full overflow-hidden bg-red-100 flex items-center justify-center text-red-700 text-3xl font-bold">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      (user.email?.[0] || '?').toUpperCase()
                    )}
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Full name</div>
                      <div className="text-base font-medium text-gray-900">{(user.user_metadata as any)?.name || '—'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="text-base font-medium text-gray-900">{user.email}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Role</div>
                      <div className="text-base font-medium text-gray-900">{(user.user_metadata as any)?.role || '—'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">User ID</div>
                      <div className="text-xs font-mono text-gray-700 break-all">{user.id}</div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload profile picture</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f || !supabase) return;
                          try {
                            setIsUploading(true);
                            const path = `${user.id}/${Date.now()}_${f.name}`;
                            const { error: upErr } = await supabase.storage.from('avatars').upload(path, f, { upsert: false, cacheControl: '3600' });
                            if (upErr) throw upErr;
                            const { data } = supabase.storage.from('avatars').getPublicUrl(path);
                            const publicUrl = data.publicUrl;
                            const { error: uErr } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
                            if (uErr) throw uErr;
                            setAvatarUrl(publicUrl);
                          } catch (e: any) {
                            setErr(e?.message || 'Failed to upload avatar');
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                      />
                      <Button variant="secondary" size="sm" disabled={isUploading}>{isUploading ? 'Uploading…' : 'Choose file'}</Button>
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
