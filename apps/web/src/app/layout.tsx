'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 3000,
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    <html lang="id" className="dark">
      <head>
        <title>SolanaTradeMemes | Pure Client-Side Trading Terminal</title>
        <meta
          name="description"
          content="Pure Client-Side Multi-Wallet Trading Terminal for Solana Memecoins with zero backend custody and parallel sub-second execution."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-zinc-950 text-zinc-100 min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
