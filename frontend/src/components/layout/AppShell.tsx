'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { Sidebar, SidebarProvider, useSidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { MobileNav } from './MobileNav';

// ── Inner shell (needs sidebar context) ──────────────────────────────────────
function ShellInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile nav */}
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Top nav */}
      <TopNav
        mobileMenuOpen={mobileOpen}
        onMobileMenuToggle={() => setMobileOpen((v) => !v)}
      />

      {/* Main content */}
      <main
        className={cn(
          'pt-[3.75rem] min-h-screen transition-all duration-250 ease-smooth',
          'md:pl-64',
          collapsed && 'md:pl-[4.5rem]',
        )}
      >
        <div className="p-6 max-w-screen-2xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

// ── AppShell ──────────────────────────────────────────────────────────────────
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ShellInner>{children}</ShellInner>
    </SidebarProvider>
  );
}

// ── Page header ───────────────────────────────────────────────────────────────
export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, breadcrumbs, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumbs && <div className="mb-3">{breadcrumbs}</div>}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-neutral-500">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
