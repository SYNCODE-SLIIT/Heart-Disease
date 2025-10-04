import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Button from '../components/ui/Button';
import { useAuth } from '../lib/supabaseClient';
import { supabase } from '../lib/supabaseClient';
import AvatarDebug from '../components/AvatarDebug';

export default function Profile() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/profile');
  }, [loading, user, router]);

  useEffect(() => {
    const metaUrl = (user?.user_metadata?.avatar_url || (user?.user_metadata as any)?.picture) as string | undefined;
    if (metaUrl) {
      // Try to display stored URL, but if bucket is private the image may not load.
      // We'll attempt to derive a storage path and request a signed URL as a fallback.
      setAvatarUrl(metaUrl);
      (async () => {
        try {
          if (!supabase) return;
          // If metaUrl is a Supabase public URL, attempt to extract the object path
          const marker = '/storage/v1/object/public/avatars/';
          const idx = metaUrl.indexOf(marker);
          if (idx > -1) {
            const path = metaUrl.slice(idx + marker.length);
            const { data: signedData, error: signErr } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60);
            if (!signErr && signedData?.signedUrl) {
              setAvatarUrl(signedData.signedUrl);
            }
          }
        } catch (e) {
          // ignore fallback errors
        }
      })();
    }
  }, [user]);

  // Verify avatar URL is reachable; if not, attempt to create a signed URL as a fallback
  useEffect(() => {
    if (!avatarUrl) return;
    (async () => {
      try {
        console.log('Checking avatar URL reachability:', avatarUrl);
        const res = await fetch(avatarUrl, { method: 'GET' });
        console.log('Avatar URL fetch status', res.status);
        if (res.status === 403 || res.status === 404) {
          console.warn('Avatar URL not directly accessible, attempting signed URL fallback');
          if (!supabase) return;
          const marker = '/storage/v1/object/public/avatars/';
          const idx = avatarUrl.indexOf(marker);
          if (idx > -1) {
            const path = avatarUrl.slice(idx + marker.length);
            const { data: signedData, error: signErr } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60);
            if (!signErr && signedData?.signedUrl) {
              console.log('Created signed URL fallback:', signedData.signedUrl);
              setAvatarUrl(signedData.signedUrl);
            } else {
              console.error('Signed URL error', signErr);
            }
          }
        }
      } catch (e) {
        console.error('Error checking avatar URL', e);
      }
    })();
  }, [avatarUrl]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setShowAvatarMenu(false);
      }
    };

    if (showAvatarMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAvatarMenu]);

  const handleFileUpload = async (file: File) => {
    if (!supabase) return;
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErr('File size must be less than 5MB');
      return;
    }
    
    try {
      setIsUploading(true);
      setErr(null);
      setSuccessMsg(null);
      const path = `${user!.id}/${Date.now()}_${file.name}`;
      
      console.log('Uploading avatar to path:', path);
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: false, cacheControl: '3600' });
      if (upErr) {
        console.error('Upload error:', upErr);
        throw upErr;
      }
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = data.publicUrl;
      console.log('Generated public URL:', publicUrl);
      
      // Also create a signed URL for immediate display (works even if bucket is private)
      let signedUrl: string | null = publicUrl;
      try {
        const { data: signedData, error: signErr } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60);
        if (!signErr && signedData?.signedUrl) signedUrl = signedData.signedUrl;
      } catch (_) {
        // ignore
      }

      const { error: uErr } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (uErr) {
        console.error('Update user error:', uErr);
        throw uErr;
      }
      
      // Force state update
      setAvatarUrl(signedUrl ?? publicUrl);
      setShowAvatarMenu(false);
      setSuccessMsg('Profile picture updated successfully!');
      
      // Refresh user session to get updated metadata
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('Avatar URL in session:', session.user.user_metadata.avatar_url);
      }
    } catch (e: any) {
      console.error('Avatar upload failed:', e);
      setErr(e?.message || 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!supabase || !confirm('Remove your profile picture?')) return;
    
    try {
      setIsUploading(true);
      setErr(null);
      const { error: uErr } = await supabase.auth.updateUser({ data: { avatar_url: null } });
      if (uErr) throw uErr;
      setAvatarUrl(null);
      setShowAvatarMenu(false);
    } catch (e: any) {
      setErr(e?.message || 'Failed to remove avatar');
    } finally {
      setIsUploading(false);
    }
  };

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
        <style>{`
          @keyframes heartbeat {
            0%, 100% { transform: scale(1); }
            10% { transform: scale(1.1); }
            20% { transform: scale(1); }
            30% { transform: scale(1.15); }
            40% { transform: scale(1); }
          }
          
          @keyframes pulse-wave {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          .heartbeat-icon {
            animation: heartbeat 2s ease-in-out infinite;
          }
          
          .pulse-line {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 60px;
            overflow: hidden;
          }
          
          .pulse-wave {
            position: absolute;
            bottom: 0;
            width: 200%;
            height: 100%;
            animation: pulse-wave 3s linear infinite;
          }
        `}</style>
      </Head>
      
      <div className="min-h-screen flex flex-col">
        <Nav />
        
        <main className="flex-grow bg-gradient-to-br from-red-50 to-gray-50 py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="mb-10 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                My <span className="text-red-600">Profile</span>
              </h1>
              <p className="text-lg text-gray-600">Manage your account information and preferences</p>
            </div>

            {err && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{err}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Animated Banner Section with Heartbeat Pattern */}
              <div className="relative h-32 bg-gradient-to-r from-red-500 via-red-600 to-red-500 overflow-hidden">
                {/* Animated heartbeat icon */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <svg className="w-16 h-16 text-white opacity-20 heartbeat-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                
                {/* ECG-style pulse wave */}
                <div className="pulse-line">
                  <svg className="pulse-wave" viewBox="0 0 800 60" preserveAspectRatio="none">
                    <path 
                      d="M0,30 L200,30 L210,10 L220,50 L230,30 L400,30 L410,10 L420,50 L430,30 L600,30 L610,10 L620,50 L630,30 L800,30" 
                      fill="none" 
                      stroke="rgba(255,255,255,0.3)" 
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                
                {/* Medical cross pattern overlay */}
                <div className="absolute inset-0 opacity-10">
                  <div className="grid grid-cols-6 h-full">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="border-r border-white" />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="px-8 pb-8">
                {/* Avatar Section with Click-to-Edit */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-16 mb-8">
                  <div className="relative group">
                    <div 
                      className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105 bg-transparent"
                      onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                    >
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={avatarUrl}
                          src={avatarUrl}
                          alt="Profile"
                          className="w-full h-full relative z-10"
                          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', backgroundColor: 'transparent' }}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          onLoad={() => console.log('Top avatar loaded OK')}
                          onError={(e) => {
                            console.error('Top avatar failed to load (kept URL):', avatarUrl, e);
                            // keep the URL; debug image below will show the image if reachable
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-4xl font-bold">
                          {(user.email?.[0] || '?').toUpperCase()}
                        </div>
                      )}
                      
                      {/* Overlay on hover (transparent by default; z-index below the img) */}
                      <div className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none transition-colors bg-black/0 group-hover:bg-black/40 z-0">
                        <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      
                      {/* Loading spinner during upload */}
                      {isUploading && (
                        <div className="absolute inset-0 rounded-full bg-black bg-opacity-60 flex items-center justify-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Context Menu */}
                    {showAvatarMenu && (
                      <div ref={avatarMenuRef} className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20 min-w-[180px]">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {avatarUrl ? 'Change Picture' : 'Upload Picture'}
                        </button>
                        
                        {avatarUrl && (
                          <button
                            onClick={handleRemoveAvatar}
                            disabled={isUploading}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove Picture
                          </button>
                        )}
                        
                        <button
                          onClick={() => setShowAvatarMenu(false)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 transition-colors border-t border-gray-100 mt-1"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                  </div>
                </div>

                {/* Profile Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Personal Information Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Full Name</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {(user.user_metadata as any)?.name || <span className="text-gray-400 italic">Not set</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Email Address</div>
                        <div className="text-base font-medium text-gray-900 flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Details Card */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Role</div>
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-600 text-white">
                          {(user.user_metadata as any)?.role === 'doctor' ? '👨‍⚕️ Doctor' : '🧑 Patient'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">User ID</div>
                        <div className="text-xs font-mono text-gray-700 bg-white px-3 py-2 rounded border border-gray-200 break-all">
                          {user.id}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Account Status</p>
                        <p className="text-lg font-bold text-blue-900 mt-1">Active</p>
                      </div>
                      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Member Since</p>
                        <p className="text-lg font-bold text-green-900 mt-1">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '2025'}
                        </p>
                      </div>
                      <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Email Verified</p>
                        <p className="text-lg font-bold text-purple-900 mt-1">Yes</p>
                      </div>
                      <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Debug image removed: direct avatar render deleted now that top-left placeholder is working */}
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}
