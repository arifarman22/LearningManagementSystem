'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookMarked, Menu, X, LogIn, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';

const NAV_LINKS = [
  { label: 'Courses', href: '/courses' },
  { label: 'Blog', href: '/blog' },
];

export function PublicNav() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // Close mobile menu on route change
  React.useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <BookMarked size={16} className="text-white" />
          </div>
          <span className="text-base font-bold text-neutral-900">LearnHub</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors no-underline',
                pathname.startsWith(l.href)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {!mounted || isLoading ? (
            <div className="h-8 w-24 rounded-lg bg-neutral-100 animate-pulse" />
          ) : isAuthenticated ? (
            <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors no-underline">
              <Avatar name={user!.username} size="xs" />
              <span>Dashboard</span>
              <LayoutDashboard size={14} className="text-neutral-400" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 no-underline transition-colors">
                Sign in
              </Link>
              <Button size="sm" asChild>
                <Link href="/register" className="no-underline text-white">Get started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="flex md:hidden items-center justify-center w-9 h-9 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-neutral-100 bg-white px-4 py-4 space-y-1 animate-fade-up">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors',
                pathname.startsWith(l.href)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-neutral-700 hover:bg-neutral-100',
              )}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2">
            {!mounted ? null : isAuthenticated ? (
              <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 no-underline">
                <LayoutDashboard size={16} />
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 no-underline">
                  <LogIn size={16} />
                  Sign in
                </Link>
                <Button fullWidth asChild>
                  <Link href="/register" className="no-underline text-white">Get started free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 no-underline mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                <BookMarked size={16} className="text-white" />
              </div>
              <span className="text-base font-bold text-neutral-900">LearnHub</span>
            </Link>
            <p className="text-sm text-neutral-500 leading-relaxed">
              A modern learning platform built for curious minds.
            </p>
          </div>

          {/* Learn */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 mb-3">Learn</h4>
            <ul className="space-y-2">
              {[['Courses', '/courses'], ['Blog', '/blog']].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-neutral-500 hover:text-neutral-900 no-underline transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 mb-3">Account</h4>
            <ul className="space-y-2">
              {[['Sign in', '/login'], ['Register', '/register'], ['Dashboard', '/dashboard']].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-neutral-500 hover:text-neutral-900 no-underline transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 mb-3">Company</h4>
            <ul className="space-y-2">
              {[['About', '#'], ['Privacy', '#'], ['Terms', '#']].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-neutral-500 hover:text-neutral-900 no-underline transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-400">© {new Date().getFullYear()} LearnHub. All rights reserved.</p>
          <p className="text-xs text-neutral-400">Built with Next.js &amp; Strapi</p>
        </div>
      </div>
    </footer>
  );
}
