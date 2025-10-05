import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { supabase, useAuth } from '../../lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  useAuth();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Supabase handles the session parsing on redirect automatically.
        // We just need to decide where to go next.
        const savedNext = (typeof window !== 'undefined')
          ? (localStorage.getItem('heartsense_oauth_next') || '/my-data')
          : '/my-data';
        if (typeof window !== 'undefined') {
          try { localStorage.removeItem('heartsense_oauth_next'); } catch {}
        }

        // Ensure we have user and try to auto-fill profile details from provider
        let dest = savedNext;
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();

          // Try to auto-fill name and avatar from OAuth identity if missing
          try {
            if (user) {
              type ProviderIdentity = { provider?: string; identity_data?: Record<string, unknown> };
              type Meta = { name?: string; full_name?: string; given_name?: string; family_name?: string; avatar_url?: string; picture?: string; role?: 'patient'|'doctor' };
              const meta = (user.user_metadata || {}) as Meta;
              const identities = ((user as unknown as { identities?: ProviderIdentity[] })?.identities) || [];
              let providerData: Record<string, unknown> | null = null;
              if (identities && identities.length > 0) {
                providerData = identities.find((id) => id.provider === 'google')?.identity_data
                  || identities.find((id) => id.provider === 'facebook')?.identity_data
                  || identities[0]?.identity_data
                  || null;
              }
              const candidateName = meta.name || meta.full_name || (meta.given_name && meta.family_name ? `${meta.given_name} ${meta.family_name}` : undefined) || providerData?.name || (providerData?.given_name && providerData?.family_name ? `${providerData?.given_name} ${providerData?.family_name}` : undefined);
              const candidateAvatar = meta.avatar_url || meta.picture || providerData?.avatar_url || providerData?.picture;
              const updates: Record<string, unknown> = {};
              if (!meta.name && candidateName) updates.name = candidateName;
              if (!meta.avatar_url && candidateAvatar) {
                updates.avatar_url = candidateAvatar;
                // Also store original picture field for fallback rendering
                updates.picture = candidateAvatar;
              }
              if (Object.keys(updates).length > 0) {
                await supabase.auth.updateUser({ data: updates });
              }
            }
          } catch {
            // ignore metadata update failures
          }

          // Role-based redirect decision
          const userRole = (user?.user_metadata as { role?: 'patient'|'doctor' } | undefined)?.role;
          if (!userRole) {
            dest = '/select-role';
            if (typeof window !== 'undefined') {
              try { localStorage.setItem('heartsense_oauth_postrole_next', savedNext); } catch {}
            }
          }
        }

        try {
          localStorage.setItem('heartsense_flash', JSON.stringify({
            message: 'If you haven\'t already, please check your email to verify your account. Some features may remain limited until verification is complete.',
            type: 'info'
          }));
        } catch {}
        if (isMounted) router.replace(dest);
      } catch {
        if (isMounted) router.replace('/my-data');
      }
    })();
    return () => { isMounted = false; };
  }, [router]);

  return (
    <>
      <Head>
        <title>Signing you in…</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4" />
          <p className="text-gray-600">Completing sign-in…</p>
        </div>
      </div>
    </>
  );
}
