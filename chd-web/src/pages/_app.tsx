import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import '../styles/globals.css';
import FlashBanner from '../components/FlashBanner';
import VerifyEmailBanner from '../components/VerifyEmailBanner';

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <FlashBanner />
      <VerifyEmailBanner />
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}