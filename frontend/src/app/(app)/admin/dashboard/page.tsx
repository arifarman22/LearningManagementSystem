'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BookOpen, Users, GraduationCap, FileText, Award,
  ArrowRight, Layers, Shield, Crown,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import type { PlatformStats } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({ label, value, icon, sub, color }: {
  label: string; value: number | string; icon: React.ReactNode; sub?: string;
  color: 'brand' | 'emerald' | 'amber' | 'blue' | 'purple' | 'rose';
}) {
  const colors = {
    brand:   'bg-violet-50 text-violet-600 border-violet-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    amber:   'bg-amber-50 text-amber-600 border-amber-200',
    blue:    'bg-blue-50 text-blue-600 border-blue-200',
    purple:  'bg-purple-50 text-purple-600 border-purple-200',
    rose:    'bg-rose-50 text-rose-600 border-rose-200',
  };
  return (
    <div className="group rounded-2xl border border-neutral-200/60 bg-white p-6 hover:shadow-lg transition-all hover:scale-[1.02]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="mt-1.5 text-3xl font-bold text-neutral-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-neutral-400">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colors[color]} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
    </div>
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
    { label: 'Total Users',  value: stats.users.total,        icon: <Users size={18} />,       sub: `${stats.users.byRole?.student ?? 0} students`,       color: 'brand'   as const },
    { label: 'Courses',      value: stats.courses.total,      icon: <BookOpen size={18} />,    sub: `${stats.courses.published} published`,               color: 'emerald' as const },
    { label: 'Enrollments',  value: stats.enrollments.total,  icon: <GraduationCap size={18}/>,sub: `${stats.enrollments.active} active`,                 color: 'blue'    as const },
    { label: 'Blog Posts',   value: stats.blogPosts.total,    icon: <FileText size={18} />,    sub: `${stats.blogPosts.published} published`,             color: 'amber'   as const },
    { label: 'Quizzes',      value: stats.quizzes.total,      icon: <Award size={18} />,       sub: `${stats.quizzes.results} submissions`,               color: 'purple'  as const },
    { label: 'Lessons',      value: stats.lessons.total,      icon: <Layers size={18} />,                                                                 color: 'rose'    as const },
  ] : [];

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-8 text-white shadow-2xl shadow-violet-500/20">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-violet-200 mb-1">
              <Crown size={14} className="text-amber-300" />
              <span>Admin Dashboard</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {greeting()}, {user?.username}!
            </h1>
            <p className="mt-2 text-violet-200 text-sm">Here's what's happening on your platform today.</p>
          </div>
          <Badge variant="brand" size="lg" className="bg-white/20 text-white border-white/20 self-start md:self-auto">
            <Shield size={14} className="mr-1" /> Admin Access
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200/60 bg-white p-6 animate-pulse">
                <Skeleton className="h-4 w-20 rounded mb-2" />
                <Skeleton className="h-8 w-12 rounded" />
              </div>
            ))
          : statItems.map((item, i) => <StatCard key={i} {...item} />)
        }
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'User Management', desc: 'Manage users & assign roles', href: '/admin/users',   icon: <Users size={20} />,    color: 'blue'   as const },
          { title: 'All Courses',     desc: 'View and manage all courses', href: '/admin/courses', icon: <BookOpen size={20} />, color: 'emerald' as const },
          { title: 'Blog Posts',      desc: 'Write and publish articles',  href: '/admin/blog',    icon: <FileText size={20} />, color: 'amber'  as const },
        ].map((item, i) => (
          <Link key={i} href={item.href} className="block no-underline group">
            <div className="relative overflow-hidden rounded-2xl border border-neutral-200/60 bg-white p-6 transition-all hover:shadow-xl hover:scale-[1.02]">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-${item.color}-50 text-${item.color}-600 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 group-hover:text-violet-600 transition-colors">{item.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{item.desc}</p>
                </div>
                <ArrowRight size={16} className="text-neutral-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
