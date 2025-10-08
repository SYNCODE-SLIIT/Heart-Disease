import { useState } from 'react';
import { supabase, useAuth } from '../lib/supabaseClient';

export default function VerifyEmailBanner() {
  const { user, loading } = useAuth();
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (loading) return null;
  // Only show if Supabase is configured and user is present and email not confirmed
  const needsVerify = Boolean(supabase && user && !user.email_confirmed_at);
  if (!needsVerify) return null;

  const email = user?.email ?? '';

  const resend = async () => {
    const client = supabase;
    if (!client || !email) return;
    setSending(true);
    setErr(null);
    setMsg(null);
    try {
      const origin = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_FORCE_OAUTH_ORIGIN || window.location.origin) : undefined;
      const emailRedirectTo = origin ? `${origin}/auth/callback` : undefined;
      // Supabase resend verification email
      // See: https://supabase.com/docs/reference/javascript/auth-resend
      // type: 'signup' triggers re-sending the confirmation email
      const params: Parameters<typeof client.auth.resend>[0] = {
        type: 'signup',
        email,
        options: emailRedirectTo ? { emailRedirectTo } : undefined,
      };
      const { error } = await client.auth.resend(params);
      if (error) throw error;
      setMsg('Verification email sent. Please check your inbox.');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErr(error.message);
      } else {
        setErr('Failed to send verification email');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="sticky top-0 z-40">
      <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 text-amber-900">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3 text-sm">
          <span>Confirm your email to unlock all features.</span>
          <button
            type="button"
            onClick={resend}
            disabled={sending}
            className="px-3 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Resend verification email'}
          </button>
          {msg && <span className="text-green-700">{msg}</span>}
          {err && <span className="text-red-700">{err}</span>}
        </div>
      </div>
    </div>
  );
}
