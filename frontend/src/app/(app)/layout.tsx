'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-32 rounded-lg mx-auto" />
          <Skeleton className="h-4 w-48 rounded mx-auto" />
          <Skeleton className="h-4 w-40 rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <AppShell>{children}</AppShell>;
}
