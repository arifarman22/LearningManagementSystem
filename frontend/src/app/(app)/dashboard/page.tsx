'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { defaultRouteForRole } from '@/lib/auth-redirect';

export default function DashboardRedirectPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    const route = defaultRouteForRole(user?.role?.type);
    // Prevent infinite loop if role is unknown
    if (route === '/dashboard') { router.replace('/student/dashboard'); return; }
    router.replace(route);
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}
