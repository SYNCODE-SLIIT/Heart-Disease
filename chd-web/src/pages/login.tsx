import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../lib/supabaseClient';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toast, { useToast } from '../components/ui/Toast';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { toasts, removeToast, success, error: showError } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Get redirect path from query params
  const next = (router.query.next as string) || '/my-data';

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { user, error } = await signIn(email, password);

      if (error) {
        showError(error.message || 'Failed to sign in. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      if (user) {
        success('Successfully signed in!');
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push(next || '/profile');
        }, 500);
      }
    } catch {
      showError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In - HeartSense</title>
        <meta name="description" content="Sign in to access your HeartSense account" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/heart_icon.svg" />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Nav />

        {/* Main Content */}
        <div className="flex-grow flex items-center justify-center px-4 py-12 bg-gradient-to-br from-red-50 to-gray-50">
          <div className="w-full max-w-md">
            {/* Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              {/* Headline */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back
                </h1>
                <p className="text-gray-600">
                  Sign in to access your saved analyses
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  type="email"
                  label="Email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  error={errors.email}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />

                <Input
                  type="password"
                  label="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  error={errors.password}
                  placeholder="Enter your password"
                  helperText="Password must be at least 6 characters"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />

                {/* Forgot password link */}
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    className="text-sm text-red-600 hover:text-red-700 font-medium focus:outline-none focus:underline"
                    onClick={() => showError('Password reset feature coming soon')}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                >
                  Sign In
                </Button>
              </form>

              {/* Sign up link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/signup"
                    className="text-red-600 hover:text-red-700 font-semibold focus:outline-none focus:underline"
                  >
                    Create one now
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        <Footer />

        {/* Toast notifications */}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </>
  );
}
