import { createClient, SupabaseClient, User, AuthError } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

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
      const stored = localStorage.getItem('mock_auth_user');
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored);
        } catch {
          console.warn('Failed to parse stored user');
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
    signOut: auth.signOut,
    isAuthenticated: !!user,
    role: (user?.user_metadata as any)?.role as ('patient'|'doctor'|undefined),
  };
}

// Log configuration status
if (typeof window !== 'undefined') {
  console.log(
    `🔐 Auth configured: ${isSupabaseConfigured ? 'Supabase (real)' : 'Mock (local dev)'}`
  );
}
