'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const role = user?.role?.type;

  React.useEffect(() => {
    if (!isLoading && role && role !== 'instructor') {
      router.replace('/dashboard');
    }
  }, [isLoading, role, router]);

  if (!isLoading && role && role !== 'instructor') {
    return null;
  }

  return <>{children}</>;
}
