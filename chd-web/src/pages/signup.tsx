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
  const { signUp, signInWithGoogle, signInWithFacebook } = useAuth();
  const { toasts, removeToast, success, error: showError } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ 
    name?: string; 
    email?: string; 
    password?: string; 
    confirmPassword?: string,
    role?: string,
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'patient'|'doctor'|''>('');

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

    if (!role) {
      newErrors.role = 'Please select a role';
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
  const metadata = { ...(name ? { name } : {}), ...(role ? { role } : {}) } as { name?: string; role?: 'patient'|'doctor' } | undefined;
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
          const uRole = (user.user_metadata as { role?: 'patient'|'doctor' } | undefined)?.role;
          router.push(uRole === 'doctor' ? '/profile' : '/my-data');
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

                {/* Role selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={role}
                    onChange={(e) => {
                      const v = e.target.value as 'patient'|'doctor'|'';
                      setRole(v);
                      if (errors.role) setErrors({ ...errors, role: undefined });
                    }}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 border ${errors.role ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white`}
                  >
                    <option value="">Select your role</option>
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                  </select>
                  {errors.role && (
                    <p className="text-red-600 text-sm mt-1">{errors.role}</p>
                  )}
                </div>

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

                {/* Or divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">or continue with</span>
                  </div>
                </div>

                {/* Google OAuth */}
                <button
                  type="button"
                  onClick={() => signInWithGoogle('/my-data')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.531,6.053,29.018,4,24,4C12.955,4,4,12.955,4,24 s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,16.469,19.004,14,24,14c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C33.531,6.053,29.018,4,24,4C16.318,4,9.656,8.214,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c4.936,0,9.448-1.896,12.857-4.999l-5.943-5.025C29.869,35.091,27.104,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.027C9.505,39.738,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.101,5.654c0.001-0.001,0.002-0.001,0.003-0.002 l6.571,4.819C36.556,39.682,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
                  Continue with Google
                </button>

                {/* Facebook OAuth (hidden by default via env flag) */}
                {process.env.NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED === 'true' && (
                  <button
                    type="button"
                    onClick={() => signInWithFacebook('/my-data')}
                    className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className="h-5 w-5" aria-hidden><path fill="#1877F2" d="M279.14 288l14.22-92.66h-88.91V127.77c0-25.35 12.42-50.06 52.24-50.06H295V6.26S259.88 0 225.36 0C141.09 0 89.09 54.42 89.09 153.12V195.3H0v92.66h89.09V512h107.73V288z"/></svg>
                    Continue with Facebook
                  </button>
                )}
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
