'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, GraduationCap,
  FileText, ChevronLeft, ChevronRight,
  BookMarked, Shield, Award, Layers,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/store/auth';
import { Avatar } from '@/components/ui/Avatar';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',  href: '/admin/dashboard',   icon: <LayoutDashboard size={17} />, roles: ['admin'] },
  { label: 'Dashboard',  href: '/instructor',         icon: <LayoutDashboard size={17} />, roles: ['instructor'], exact: true },
  { label: 'Dashboard',  href: '/content',            icon: <LayoutDashboard size={17} />, roles: ['content-manager'], exact: true },
  { label: 'Dashboard',  href: '/student/dashboard',  icon: <LayoutDashboard size={17} />, roles: ['student', 'authenticated'] },
  { label: 'Users',       href: '/admin/users',         icon: <Shield size={17} />,         roles: ['admin'] },
  { label: 'My Learning', href: '/my-learning',         icon: <GraduationCap size={17} />,  roles: ['student', 'authenticated'] },
  { label: 'My Courses',  href: '/instructor/courses',  icon: <BookOpen size={17} />,       roles: ['instructor'] },
  { label: 'Content',     href: '/content',             icon: <Layers size={17} />,         roles: ['admin'] },
  { label: 'Courses',     href: '/content/courses',     icon: <BookOpen size={17} />,       roles: ['content-manager'], exact: true },
  { label: 'Blog',        href: '/content/blog',        icon: <FileText size={17} />,       roles: ['content-manager'], exact: true },
  { label: 'Courses',     href: '/courses',             icon: <BookOpen size={17} />,       roles: ['student', 'authenticated'] },
  { label: 'All Courses', href: '/admin/courses',        icon: <BookOpen size={17} />,       roles: ['admin'] },
  { label: 'Blog Posts',  href: '/admin/blog',           icon: <FileText size={17} />,       roles: ['admin'] },
  { label: 'Quizzes',     href: '/admin/quizzes',        icon: <Award size={17} />,          roles: ['admin'] },
  { label: 'Blog',        href: '/blog',                icon: <FileText size={17} />,       roles: ['student', 'authenticated', 'admin'] },
];

// Group labels per role
const GROUP_LABELS: Record<string, { label: string; hrefs: string[] }[]> = {
  admin: [
    { label: 'Overview',  hrefs: ['/admin/dashboard'] },
    { label: 'Manage',    hrefs: ['/admin/users', '/admin/courses', '/admin/blog', '/admin/quizzes', '/content'] },
    { label: 'Explore',   hrefs: ['/blog'] },
  ],
  instructor: [
    { label: 'Overview',  hrefs: ['/instructor'] },
    { label: 'Content',   hrefs: ['/instructor/courses'] },
  ],
  'content-manager': [
    { label: 'Overview',  hrefs: ['/content'] },
    { label: 'Manage',    hrefs: ['/content/courses', '/content/blog'] },
  ],
  student: [
    { label: 'Overview',  hrefs: ['/student/dashboard'] },
    { label: 'Learning',  hrefs: ['/my-learning', '/courses'] },
    { label: 'Explore',   hrefs: ['/blog'] },
  ],
  authenticated: [
    { label: 'Overview',  hrefs: ['/student/dashboard'] },
    { label: 'Learning',  hrefs: ['/my-learning', '/courses'] },
    { label: 'Explore',   hrefs: ['/blog'] },
  ],
};

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

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const { user } = useAuth();
  const pathname = usePathname();
  const role = user?.role?.type ?? '';

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  const groups = GROUP_LABELS[role] ?? [];

  // Build grouped structure
  const grouped = groups.map((g) => ({
    label: g.label,
    items: visibleItems.filter((item) => g.hrefs.includes(item.href)),
  })).filter((g) => g.items.length > 0);

  // Fallback: ungrouped
  const renderItems = grouped.length > 0 ? null : visibleItems;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 flex h-full flex-col',
        'bg-[#0f172a] border-r border-[#1e293b]',
        'transition-all duration-200 ease-in-out',
        collapsed ? 'w-[4.5rem]' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex h-[3.75rem] items-center border-b border-[#1e293b] px-4 shrink-0',
        collapsed ? 'justify-center' : 'gap-3',
      )}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500">
          <BookMarked size={15} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold text-white tracking-wide">LMS</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {grouped.length > 0 ? (
          <div className="space-y-5 px-3">
            {grouped.map((group) => (
              <div key={group.label}>
                {!collapsed && (
                  <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    {group.label}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-0.5 px-3">
            {(renderItems ?? []).map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
            ))}
          </ul>
        )}
      </nav>

      {/* User + collapse */}
      <div className="border-t border-[#1e293b] p-3 shrink-0">
        {user && !collapsed && (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 mb-2">
            <Avatar name={user.username} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user.username}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user.role?.name}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500',
            'hover:bg-[#1e293b] hover:text-slate-300 transition-colors duration-150',
            collapsed && 'justify-center',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : (
            <>
              <ChevronLeft size={15} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

function NavLink({ item, pathname, collapsed }: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const isActive = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
            : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200 border border-transparent',
          collapsed && 'justify-center px-2',
        )}
        title={collapsed ? item.label : undefined}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className={cn('shrink-0', isActive ? 'text-brand-400' : 'text-slate-500')}>
          {item.icon}
        </span>
        {!collapsed && <span>{item.label}</span>}
        {!collapsed && item.badge && (
          <span className="ml-auto rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-semibold text-brand-400">
            {item.badge}
          </span>
        )}
      </Link>
    </li>
  );
}
