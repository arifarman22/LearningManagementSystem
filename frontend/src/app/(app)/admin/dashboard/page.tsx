'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BookOpen, Users, GraduationCap, FileText, Award,
  ArrowUpRight, Layers, Shield, TrendingUp, Activity,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import type { PlatformStats } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const ACCENT_COLORS = {
  cyan:    { bar: 'bg-brand-500',   icon: 'bg-brand-50 text-brand-600',   text: 'text-brand-600' },
  emerald: { bar: 'bg-emerald-500', icon: 'bg-emerald-50 text-emerald-600', text: 'text-emerald-600' },
  blue:    { bar: 'bg-blue-500',    icon: 'bg-blue-50 text-blue-600',     text: 'text-blue-600' },
  amber:   { bar: 'bg-amber-500',   icon: 'bg-amber-50 text-amber-600',   text: 'text-amber-600' },
  purple:  { bar: 'bg-purple-500',  icon: 'bg-purple-50 text-purple-600', text: 'text-purple-600' },
  rose:    { bar: 'bg-rose-500',    icon: 'bg-rose-50 text-rose-600',     text: 'text-rose-600' },
} as const;

type AccentKey = keyof typeof ACCENT_COLORS;

function StatCard({ label, value, icon, sub, accent }: {
  label: string; value: number | string; icon: React.ReactNode; sub?: string; accent: AccentKey;
}) {
  const c = ACCENT_COLORS[accent];
  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${c.bar}`} />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-neutral-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-neutral-400">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${c.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, desc, href, icon, accent }: {
  title: string; desc: string; href: string; icon: React.ReactNode; accent: AccentKey;
}) {
  const c = ACCENT_COLORS[accent];
  return (
    <Link href={href} className="block no-underline group">
      <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${c.icon} group-hover:scale-105 transition-transform`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-800 group-hover:text-neutral-900">{title}</p>
          <p className="text-xs text-neutral-400 mt-0.5 truncate">{desc}</p>
        </div>
        <ArrowUpRight size={15} className="text-neutral-300 group-hover:text-neutral-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<PlatformStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get<{ data: PlatformStats }>('/admin-panel/stats')
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statItems = stats ? [
    { label: 'Total Users',  value: stats.users.total,        icon: <Users size={17} />,        sub: `${stats.users.byRole?.student ?? 0} students`,  accent: 'cyan'    as AccentKey },
    { label: 'Courses',      value: stats.courses.total,      icon: <BookOpen size={17} />,     sub: `${stats.courses.published} published`,           accent: 'emerald' as AccentKey },
    { label: 'Enrollments',  value: stats.enrollments.total,  icon: <GraduationCap size={17} />,sub: `${stats.enrollments.active} active`,             accent: 'blue'    as AccentKey },
    { label: 'Blog Posts',   value: stats.blogPosts.total,    icon: <FileText size={17} />,     sub: `${stats.blogPosts.published} published`,         accent: 'amber'   as AccentKey },
    { label: 'Quizzes',      value: stats.quizzes.total,      icon: <Award size={17} />,        sub: `${stats.quizzes.results} submissions`,           accent: 'purple'  as AccentKey },
    { label: 'Lessons',      value: stats.lessons.total,      icon: <Layers size={17} />,                                                              accent: 'rose'    as AccentKey },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500">{greeting()}, {user?.username} 👋</p>
          <h1 className="text-2xl font-bold text-neutral-900 mt-0.5">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 shadow-sm">
          <Activity size={14} className="text-emerald-500" />
          <span className="text-xs font-medium text-neutral-600">Platform live</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5">
                <Skeleton className="h-3 w-16 rounded mb-3" />
                <Skeleton className="h-7 w-12 rounded" />
              </div>
            ))
          : statItems.map((item, i) => <StatCard key={i} {...item} />)
        }
      </div>

      {/* Overview row */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Users by Role</p>
            <div className="space-y-2.5">
              {[
                { label: 'Students',         value: stats.users.byRole?.student ?? 0,         color: 'bg-brand-500' },
                { label: 'Instructors',      value: stats.users.byRole?.instructor ?? 0,      color: 'bg-emerald-500' },
                { label: 'Content Managers', value: stats.users.byRole?.content_manager ?? 0, color: 'bg-amber-500' },
                { label: 'Admins',           value: stats.users.byRole?.admin ?? 0,           color: 'bg-purple-500' },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${r.color}`} />
                    <span className="text-sm text-neutral-600 truncate">{r.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Course Status</p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-neutral-600">Published</span>
                  <span className="font-semibold text-neutral-900">{stats.courses.published}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: stats.courses.total ? `${(stats.courses.published / stats.courses.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-neutral-600">Draft</span>
                  <span className="font-semibold text-neutral-900">{stats.courses.draft}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: stats.courses.total ? `${(stats.courses.draft / stats.courses.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Enrollments</p>
            <div className="flex items-end gap-3">
              <div>
                <p className="text-3xl font-bold text-neutral-900">{stats.enrollments.active}</p>
                <p className="text-xs text-neutral-400 mt-1">Active enrollments</p>
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium mb-1">
                <TrendingUp size={13} />
                <span>{stats.enrollments.total} total</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction title="User Management" desc="Manage users & roles"       href="/admin/users"   icon={<Users size={17} />}    accent="cyan" />
          <QuickAction title="All Courses"     desc="View and manage courses"    href="/admin/courses" icon={<BookOpen size={17} />} accent="emerald" />
          <QuickAction title="Quizzes"         desc="Create & manage quizzes"    href="/admin/quizzes" icon={<Award size={17} />}    accent="purple" />
          <QuickAction title="Blog Posts"      desc="Write and publish articles" href="/admin/blog"    icon={<FileText size={17} />} accent="amber" />
        </div>
      </div>
    </div>
  );
}
