'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { Skeleton } from '@/components/ui/Skeleton';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const role = user?.role?.type;

  React.useEffect(() => {
    if (!isLoading && role && role !== 'instructor' && role !== 'admin' && role !== 'content-manager') {
      router.replace('/dashboard');
    }
  }, [isLoading, role, router]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded" />
      </div>
    );
  }

  if (!isLoading && role && role !== 'instructor' && role !== 'admin' && role !== 'content-manager') {
    return null;
  }

  return <>{children}</>;
}
