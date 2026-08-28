'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, GraduationCap,
  FileText, ChevronLeft, ChevronRight,
  BookMarked, Shield, Award,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/store/auth';
import { Avatar } from '@/components/ui/Avatar';

// ── Nav items ─────────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard',   icon: <LayoutDashboard size={18} />, roles: ['admin'] },
  { label: 'Dashboard', href: '/instructor',         icon: <LayoutDashboard size={18} />, roles: ['instructor'], exact: true },
  { label: 'Dashboard', href: '/content',            icon: <LayoutDashboard size={18} />, roles: ['content-manager'] },
  { label: 'Dashboard', href: '/student/dashboard',  icon: <LayoutDashboard size={18} />, roles: ['student', 'authenticated'] },
  { label: 'Admin',       href: '/admin/users',         icon: <Shield size={18} />,         roles: ['admin'] },
  { label: 'My Learning', href: '/my-learning',         icon: <GraduationCap size={18} />,  roles: ['student', 'authenticated'] },
  { label: 'My Courses',  href: '/instructor/courses',  icon: <BookOpen size={18} />,       roles: ['instructor'] },
  { label: 'Content',     href: '/content',             icon: <FileText size={18} />,       roles: ['content-manager', 'admin'] },
  { label: 'Courses',     href: '/content/courses',     icon: <BookOpen size={18} />,       roles: ['content-manager'] },
  { label: 'Blog',        href: '/content/blog',        icon: <FileText size={18} />,       roles: ['content-manager'] },
  { label: 'Courses',     href: '/courses',             icon: <BookOpen size={18} />,       roles: ['student', 'authenticated'] },
  { label: 'All Courses', href: '/admin/courses',        icon: <BookOpen size={18} />,       roles: ['admin'] },
  { label: 'Blog Posts',  href: '/admin/blog',           icon: <FileText size={18} />,       roles: ['admin'] },
  { label: 'Quizzes',     href: '/admin/quizzes',        icon: <Award size={18} />,          roles: ['admin'] },
  { label: 'Blog',        href: '/blog',                icon: <FileText size={18} /> },
];

// ── Sidebar context ───────────────────────────────────────────────────────────
interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextValue>({
  collapsed: false,
  setCollapsed: () => {},
});

export function useSidebar() {
  return React.useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const { user } = useAuth();
  const pathname = usePathname();
  const role = user?.role?.type ?? '';

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 flex h-full flex-col border-r border-neutral-200 bg-white',
        'transition-all duration-250 ease-smooth',
        collapsed ? 'w-[4.5rem]' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex h-[3.75rem] items-center border-b border-neutral-100 px-4 shrink-0',
        collapsed ? 'justify-center' : 'gap-3',
      )}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600">
          <BookMarked size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold text-neutral-900 tracking-tight">
            LearnHub
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-hide">
        <ul className="space-y-0.5" role="list">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || (!item.exact && pathname.startsWith(item.href + '/'));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                    collapsed && 'justify-center px-2',
                  )}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={cn('shrink-0', isActive ? 'text-brand-600' : 'text-neutral-400')}>
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="ml-auto rounded-full bg-brand-100 px-2 py-0.5 text-2xs font-semibold text-brand-700">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User + collapse */}
      <div className="border-t border-neutral-100 p-2 shrink-0">
        {user && !collapsed && (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1">
            <Avatar name={user.username} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{user.username}</p>
              <p className="text-xs text-neutral-400 truncate capitalize">{user.role?.name}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-500',
            'hover:bg-neutral-100 hover:text-neutral-700 transition-colors duration-150',
            collapsed && 'justify-center',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : (
            <>
              <ChevronLeft size={16} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
