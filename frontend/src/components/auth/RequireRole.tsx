'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import type { RoleType } from '@/types';

interface RequireRoleProps {
  /** Allowed roles. If empty, any authenticated user is allowed. */
  roles?: RoleType[];
  /** Where to redirect if the role check fails. Defaults to /dashboard. */
  fallback?: string;
  children: React.ReactNode;
}

/**
 * Renders children only when the current user has one of the allowed roles.
 * Redirects otherwise. This is a UX guard — the backend is the real security boundary.
 */
export function RequireRole({ roles = [], fallback = '/dashboard', children }: RequireRoleProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (roles.length > 0 && !roles.includes(user?.role?.type as RoleType)) {
      router.replace(fallback);
    }
  }, [isLoading, isAuthenticated, user, roles, fallback, router]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;
  if (roles.length > 0 && !roles.includes(user?.role?.type as RoleType)) return null;

  return <>{children}</>;
}
