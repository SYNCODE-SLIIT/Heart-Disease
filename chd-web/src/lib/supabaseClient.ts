import { createClient, SupabaseClient, User, AuthError } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// User metadata interface
interface UserMetadata {
  name?: string;
  role?: 'patient' | 'doctor';
}

// Initialize Supabase client (or null if not configured)
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mock auth provider for local development
class MockAuthProvider {
  private listeners: ((user: User | null) => void)[] = [];
  private currentUser: User | null = null;

  constructor() {
    // Try to restore user from localStorage
    if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('heartsense_mock_user');
      if (stored) {
        try {
          // Defensive parse: stored should be a JSON string. If it's something like
          // "[object Object]" or otherwise not JSON, avoid throwing and clear it.
          if (typeof stored === 'string') {
            const trimmed = stored.trim();
                if (trimmed === '[object Object]' || trimmed === 'undefined' || trimmed === 'null') {
                  console.warn('Found non-JSON mock user value in localStorage, clearing:', trimmed);
                  localStorage.removeItem('heartsense_mock_user');
            } else {
              // Only attempt JSON.parse if it looks like JSON
              if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                this.currentUser = JSON.parse(stored);
              } else {
                // Not JSON — log and clear to avoid downstream parse errors
                console.warn('Stored mock_auth_user is not JSON; clearing stored value.', stored);
                localStorage.removeItem('mock_auth_user');
              }
            }
          }
        } catch (err) {
          console.warn('Failed to parse stored user', err);
          try { localStorage.removeItem('mock_auth_user'); } catch{}
        }
      }
    }
  }

  getUser(): User | null {
    return this.currentUser;
  }

  async signIn(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> {
    // Mock sign in - just validate format
    if (!email || !password) {
      return {
        user: null,
        error: { message: 'Email and password are required', name: 'AuthError', status: 400 } as AuthError,
      };
    }

    if (!email.includes('@')) {
      return {
        user: null,
        error: { message: 'Invalid email format', name: 'AuthError', status: 400 } as AuthError,
      };
    }

    if (password.length < 6) {
      return {
        user: null,
        error: { message: 'Password must be at least 6 characters', name: 'AuthError', status: 400 } as AuthError,
      };
    }

    // Create mock user
    const mockUser: User = {
      id: `mock-${Date.now()}`,
      email,
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      role: 'authenticated',
    } as User;

    this.currentUser = mockUser;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_auth_user', JSON.stringify(mockUser));
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(mockUser));

    return { user: mockUser, error: null };
  }

  async signUp(email: string, password: string, metadata?: { name?: string; role?: 'patient'|'doctor' }): Promise<{ user: User | null; error: AuthError | null }> {
    // Mock sign up - similar to sign in
    if (!email || !password) {
      return {
        user: null,
        error: { message: 'Email and password are required', name: 'AuthError', status: 400 } as AuthError,
      };
    }

    if (!email.includes('@')) {
      return {
        user: null,
        error: { message: 'Invalid email format', name: 'AuthError', status: 400 } as AuthError,
      };
    }

    if (password.length < 8) {
      return {
        user: null,
        error: { message: 'Password must be at least 8 characters', name: 'AuthError', status: 400 } as AuthError,
      };
    }

    // Create mock user with metadata
    const mockUser: User = {
      id: `mock-${Date.now()}`,
      email,
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: metadata || {},
      aud: 'authenticated',
      role: 'authenticated',
    } as User;

    this.currentUser = mockUser;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_auth_user', JSON.stringify(mockUser));
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(mockUser));

    return { user: mockUser, error: null };
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    this.currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_auth_user');
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener(null));

    return { error: null };
  }

  async updateUserMetadata(data: Record<string, unknown>): Promise<{ user: User | null; error: AuthError | null }> {
    if (!this.currentUser) {
      return { user: null, error: { name: 'AuthError', message: 'No user', status: 400 } as AuthError };
    }
    const mergedMeta = { ...(this.currentUser.user_metadata || {}), ...data } as Record<string, unknown>;
    this.currentUser = { ...this.currentUser, user_metadata: mergedMeta } as User;
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('mock_auth_user', JSON.stringify(this.currentUser)); } catch (_) {}
    }
    this.listeners.forEach((l) => l(this.currentUser));
    return { user: this.currentUser, error: null };
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    
    // Call immediately with current state
    callback(this.currentUser);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

// Create mock auth provider instance
const mockAuth = new MockAuthProvider();

// Auth helper functions
export const auth = {
  /**
   * Get the current user
   */
  async getUser(): Promise<User | null> {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
    return mockAuth.getUser();
  },

  /** Update user metadata (e.g., role, name) */
  async updateUserMetadata(data: Record<string, unknown>): Promise<{ user: User | null; error: AuthError | null }> {
    if (supabase) {
      const { data: upd, error } = await supabase.auth.updateUser({ data });
      return { user: upd.user ?? null, error: error as AuthError | null };
    }
    return mockAuth.updateUserMetadata(data);
  },

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(nextPath?: string): Promise<void> {
    if (!supabase) {
      // In mock mode, just simulate a Google sign in by creating a mock user
      // and redirecting immediately.
      const mockEmail = `google_user_${Date.now()}@example.com`;
      await mockAuth.signIn(mockEmail, 'oauth');
      if (typeof window !== 'undefined') {
        const next = nextPath || localStorage.getItem('heartsense_oauth_next') || '/my-data';
        window.location.href = next;
      }
      return;
    }

    if (typeof window !== 'undefined') {
      if (nextPath) {
        try { localStorage.setItem('heartsense_oauth_next', nextPath); } catch (_) {}
      } else {
        // If there is a next param in URL, store it as well
        const url = new URL(window.location.href);
        const qNext = url.searchParams.get('next');
        if (qNext) { try { localStorage.setItem('heartsense_oauth_next', qNext); } catch (_) {} }
      }
    }

    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  },

  /**
   * Sign in with Facebook OAuth
   */
  async signInWithFacebook(nextPath?: string): Promise<void> {
    if (!supabase) {
      // Mock mode: simulate OAuth
      const mockEmail = `fb_user_${Date.now()}@example.com`;
      await mockAuth.signIn(mockEmail, 'oauth');
      if (typeof window !== 'undefined') {
        const next = nextPath || localStorage.getItem('heartsense_oauth_next') || '/my-data';
        window.location.href = next;
      }
      return;
    }

    if (typeof window !== 'undefined') {
      if (nextPath) {
        try { localStorage.setItem('heartsense_oauth_next', nextPath); } catch (_) {}
      } else {
        const url = new URL(window.location.href);
        const qNext = url.searchParams.get('next');
        if (qNext) { try { localStorage.setItem('heartsense_oauth_next', qNext); } catch (_) {} }
      }
    }

    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined;
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo,
      },
    });
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { user: data.user, error };
    }
    return mockAuth.signIn(email, password);
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, metadata?: { name?: string; role?: 'patient'|'doctor' }): Promise<{ user: User | null; error: AuthError | null }> {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      return { user: data.user, error };
    }
    return mockAuth.signUp(email, password, metadata);
  },

  /**
   * Sign out
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    if (supabase) {
      return await supabase.auth.signOut();
    }
    return mockAuth.signOut();
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null);
      });
      return () => subscription.unsubscribe();
    }
    return mockAuth.onAuthStateChange(callback);
  },
};

// Custom hook for auth state
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    auth.getUser().then((user) => {
      setUser(user);
      setLoading(false);
    });

    // Subscribe to auth changes
    const unsubscribe = auth.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    signIn: auth.signIn,
    signUp: auth.signUp,
    signInWithGoogle: auth.signInWithGoogle,
    signInWithFacebook: auth.signInWithFacebook,
    signOut: auth.signOut,
    updateUserMetadata: auth.updateUserMetadata,
    isAuthenticated: !!user,
    role: (user?.user_metadata as UserMetadata)?.role,
  };
}

// Log configuration status
if (typeof window !== 'undefined') {
  console.log(
    `🔐 Auth configured: ${isSupabaseConfigured ? 'Supabase (real)' : 'Mock (local dev)'}`
  );
}
