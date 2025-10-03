import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../lib/supabaseClient';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Button from '../components/ui/Button';

export default function MyData() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/login?next=/my-data');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>My Data - HeartSense</title>
        <meta name="description" content="View and manage your saved HeartSense analyses" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/heart_icon.svg" />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Nav />

        <main className="flex-grow bg-gradient-to-br from-red-50 to-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                My Data
              </h1>
              <p className="text-xl text-gray-600">
                Your saved analyses and predictions
              </p>
            </div>

            {/* Main Content Card */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12">
                {/* Icon */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
                    <svg 
                      className="w-10 h-10 text-red-600" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                      />
                    </svg>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Coming Soon
                  </h2>
                  
                  <p className="text-lg text-gray-600 mb-2">
                    Your saved results will appear here
                  </p>
                  
                  <p className="text-gray-500 max-w-md mx-auto">
                    We&apos;re working on bringing you the ability to save, view, and manage 
                    your cardiovascular risk assessments. Stay tuned!
                  </p>
                </div>

                {/* User Info */}
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {user.email?.[0].toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">Signed in as</p>
                      <p className="text-base font-medium text-gray-900">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Feature Preview */}
                <div className="space-y-4 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Planned Features:
                  </h3>
                  
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-gray-700">Save and track your risk assessments over time</p>
                  </div>
                  
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-gray-700">Export your results as PDF or CSV</p>
                  </div>
                  
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-gray-700">View trends and changes in your health metrics</p>
                  </div>
                  
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-gray-700">Share reports securely with healthcare providers</p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/predictor" className="flex-1">
                    <Button variant="primary" size="lg" className="w-full">
                      Run New Assessment
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="secondary" 
                    size="lg" 
                    className="flex-1"
                    disabled
                    title="Export feature coming soon"
                  >
                    Export Data
                  </Button>
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
