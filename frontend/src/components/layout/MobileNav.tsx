'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, GraduationCap, FileText,
  BookMarked, X, Shield,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/store/auth';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard',  icon: <LayoutDashboard size={18} />, roles: ['admin'] },
  { label: 'Dashboard', href: '/instructor',        icon: <LayoutDashboard size={18} />, roles: ['instructor'] },
  { label: 'Dashboard', href: '/content',           icon: <LayoutDashboard size={18} />, roles: ['content-manager'] },
  { label: 'Dashboard', href: '/student/dashboard', icon: <LayoutDashboard size={18} />, roles: ['student', 'authenticated'] },
  { label: 'Admin',       href: '/admin/users',         icon: <Shield size={18} />,         roles: ['admin'] },
  { label: 'My Learning', href: '/my-learning',         icon: <GraduationCap size={18} />,  roles: ['student', 'authenticated'] },
  { label: 'My Courses',  href: '/instructor/courses',  icon: <BookOpen size={18} />,       roles: ['instructor'] },
  { label: 'Content',     href: '/content',             icon: <FileText size={18} />,       roles: ['admin'] },
  { label: 'Courses',     href: '/content/courses',     icon: <BookOpen size={18} />,       roles: ['content-manager'] },
  { label: 'Blog',        href: '/content/blog',        icon: <FileText size={18} />,       roles: ['content-manager'] },
  { label: 'Courses',     href: '/courses',             icon: <BookOpen size={18} />,       roles: ['student', 'authenticated', 'admin'] },
  { label: 'Blog',        href: '/blog',                icon: <FileText size={18} />,       roles: ['student', 'authenticated', 'admin'] },
];

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const role = user?.role?.type ?? '';

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.roles.includes(role),
  );

  // Close on route change
  React.useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-neutral-950/50 backdrop-blur-sm md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl md:hidden',
          'animate-slide-in-left',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex h-[3.75rem] items-center justify-between border-b border-neutral-100 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <BookMarked size={16} className="text-white" />
            </div>
            <span className="text-base font-bold text-neutral-900">LMS</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-0.5" role="list">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className={cn('shrink-0', isActive ? 'text-brand-600' : 'text-neutral-400')}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}
