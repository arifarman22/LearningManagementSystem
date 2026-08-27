'use client';

import * as React from 'react';
import { PublicNav, PublicFooter } from '@/components/public/PublicNav';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/store/auth';

export function PublicLayoutClient({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && isAuthenticated) {
    return <AppShell>{children}</AppShell>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
