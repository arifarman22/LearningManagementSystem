'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, GraduationCap, FileText,
  BookMarked, X, Shield, Award, Layers,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/store/auth';
import { Avatar } from '@/components/ui/Avatar';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/admin/dashboard',  icon: <LayoutDashboard size={17} />, roles: ['admin'] },
  { label: 'Dashboard',  href: '/instructor',        icon: <LayoutDashboard size={17} />, roles: ['instructor'] },
  { label: 'Dashboard',  href: '/content',           icon: <LayoutDashboard size={17} />, roles: ['content-manager'] },
  { label: 'Dashboard',  href: '/student/dashboard', icon: <LayoutDashboard size={17} />, roles: ['student', 'authenticated'] },
  { label: 'Users',       href: '/admin/users',         icon: <Shield size={17} />,         roles: ['admin'] },
  { label: 'My Learning', href: '/my-learning',         icon: <GraduationCap size={17} />,  roles: ['student', 'authenticated'] },
  { label: 'My Courses',  href: '/instructor/courses',  icon: <BookOpen size={17} />,       roles: ['instructor'] },
  { label: 'Content',     href: '/content',             icon: <Layers size={17} />,         roles: ['admin'] },
  { label: 'Courses',     href: '/content/courses',     icon: <BookOpen size={17} />,       roles: ['content-manager'] },
  { label: 'Blog',        href: '/content/blog',        icon: <FileText size={17} />,       roles: ['content-manager'] },
  { label: 'Courses',     href: '/courses',             icon: <BookOpen size={17} />,       roles: ['student', 'authenticated', 'admin'] },
  { label: 'Blog',        href: '/blog',                icon: <FileText size={17} />,       roles: ['student', 'authenticated', 'admin'] },
];

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const role = user?.role?.type ?? '';

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  // Close on route change
  React.useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-neutral-950/60 backdrop-blur-sm md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed inset-y-0 left-0 z-50 w-72 bg-[#0f172a] shadow-2xl md:hidden animate-slide-in-left flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex h-[3.75rem] items-center justify-between border-b border-[#1e293b] px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <BookMarked size={15} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-wide">LMS</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-[#1e293b] hover:text-slate-200 transition-colors"
            aria-label="Close menu"
          >
            <X size={17} />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e293b]">
            <Avatar name={user.username} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{user.username}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role?.name}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
          <ul className="space-y-0.5">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                        : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200 border border-transparent',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className={cn('shrink-0', isActive ? 'text-brand-400' : 'text-slate-500')}>
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
