import type { RoleType } from '@/types';

/**
 * Single source of truth: where each role lands after login.
 * All role-based routing decisions must go through here.
 */
export function defaultRouteForRole(role: RoleType | undefined | null): string {
  switch (role) {
    case 'admin':            return '/admin/dashboard';
    case 'instructor':       return '/instructor';
    case 'content-manager':  return '/content';
    case 'student':          return '/student/dashboard';
    case 'authenticated':    return '/student/dashboard';
    default:                 return '/dashboard';
  }
}

/**
 * Validates that a redirect path is safe (same-origin, not an auth route).
 */
export function sanitizeRedirect(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith('/')) return null;
  if (path.startsWith('/login') || path.startsWith('/register')) return null;
  return path;
}
