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

export default function Signup() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { toasts, removeToast, success, error: showError } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ 
    name?: string; 
    email?: string; 
    password?: string; 
    confirmPassword?: string 
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const metadata = name ? { name } : undefined;
      const { user, error } = await signUp(email, password, metadata);

      if (error) {
        showError(error.message || 'Failed to create account. Please try again.');
        setIsLoading(false);
        return;
      }

      if (user) {
        success('Account created successfully! Redirecting...');
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/my-data');
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
        <title>Sign Up - HeartSense</title>
        <meta name="description" content="Create a HeartSense account to save and manage your analyses" />
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
                  Create an account
                </h1>
                <p className="text-gray-600">
                  Sign up to save and manage your analyses
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  type="text"
                  label="Full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  error={errors.name}
                  placeholder="John Doe"
                  autoComplete="name"
                  disabled={isLoading}
                />

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
                  placeholder="Create a strong password"
                  helperText="Must be 8+ characters with uppercase, lowercase, and number"
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />

                <Input
                  type="password"
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  error={errors.confirmPassword}
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />

                {/* Submit button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full mt-6"
                  isLoading={isLoading}
                >
                  Create Account
                </Button>
              </form>

              {/* Terms text */}
              <p className="mt-4 text-xs text-center text-gray-500">
                By creating an account, you agree to our{' '}
                <Link href="/privacy" className="text-red-600 hover:text-red-700 underline">
                  Privacy Policy
                </Link>
              </p>

              {/* Sign in link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="text-red-600 hover:text-red-700 font-semibold focus:outline-none focus:underline"
                  >
                    Sign in
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
