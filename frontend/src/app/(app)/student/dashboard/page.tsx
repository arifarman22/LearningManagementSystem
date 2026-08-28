'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BookOpen, GraduationCap, FileText, Award,
  ArrowUpRight, CheckCircle, Clock, PlayCircle,
  Target, Zap,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import { useEnrollments } from '@/hooks/useEnrollments';
import type { QuizResult, ApiListResponse } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'Just now';
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { data: enrollments, loading: enrollLoading } = useEnrollments();
  const [quizResults, setQuizResults] = React.useState<QuizResult[]>([]);
  const [quizLoading, setQuizLoading] = React.useState(true);

  React.useEffect(() => {
    api.get<ApiListResponse<QuizResult>>(
      '/quiz-results?populate[quiz]=true&sort=submittedAt:desc&pagination[pageSize]=5',
    )
      .then((r) => setQuizResults(r.data ?? []))
      .catch(() => {})
      .finally(() => setQuizLoading(false));
  }, []);

  const continueItem = enrollments.find(
    ({ progress }) => progress && progress.percentage > 0 && progress.percentage < 100,
  ) ?? enrollments[0];

  const totalEnrolled = enrollments.length;
  const completed = enrollments.filter(({ progress }) => progress?.percentage === 100).length;
  const avgProgress = totalEnrolled
    ? Math.round(enrollments.reduce((s, { progress }) => s + (progress?.percentage ?? 0), 0) / totalEnrolled)
    : 0;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500">{greeting()}, {user?.username} 👋</p>
          <h1 className="text-2xl font-bold text-neutral-900 mt-0.5">My Dashboard</h1>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link href="/courses" className="no-underline flex items-center gap-1.5">
            <BookOpen size={14} /> Browse Courses
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled',      value: totalEnrolled,      icon: <BookOpen size={17} />,     bar: 'bg-brand-500',   ic: 'bg-brand-50 text-brand-600' },
          { label: 'Completed',     value: completed,          icon: <CheckCircle size={17} />,  bar: 'bg-emerald-500', ic: 'bg-emerald-50 text-emerald-600' },
          { label: 'Avg Progress',  value: `${avgProgress}%`,  icon: <Target size={17} />,       bar: 'bg-blue-500',    ic: 'bg-blue-50 text-blue-600' },
          { label: 'Quizzes Taken', value: quizResults.length, icon: <Award size={17} />,        bar: 'bg-amber-500',   ic: 'bg-amber-50 text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${s.bar}`} />
            <div className="flex items-start justify-between gap-3 pl-2">
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{s.label}</p>
                <p className="mt-1.5 text-2xl font-bold text-neutral-900">{s.value}</p>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.ic}`}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Continue Learning */}
      {!enrollLoading && continueItem && (
        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock size={13} /> Continue Learning
          </p>
          <Link
            href={`/learn/${continueItem.enrollment.course?.slug ?? continueItem.enrollment.course?.documentId}`}
            className="block no-underline group"
          >
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-brand-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-blue-600 text-white shadow-sm group-hover:scale-105 transition-transform">
                  <PlayCircle size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-800 truncate group-hover:text-brand-600 transition-colors">
                    {continueItem.enrollment.course?.title}
                  </p>
                  <div className="mt-2.5 space-y-1">
                    <ProgressBar value={continueItem.progress?.percentage ?? 0} size="sm" color="brand" showValue />
                    <p className="text-xs text-neutral-400">
                      {continueItem.progress?.completedLessons ?? 0} / {continueItem.progress?.totalLessons ?? 0} lessons complete
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={18} className="text-neutral-300 group-hover:text-brand-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </div>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Courses */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">My Courses</p>
            <Link href="/my-learning" className="text-xs font-medium text-brand-600 hover:text-brand-700 no-underline flex items-center gap-1 group">
              View all <ArrowUpRight size={12} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {enrollLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <Skeleton className="h-4 w-3/4 rounded mb-3" />
                  <Skeleton className="h-2 w-full rounded mb-2" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : enrollments.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                <BookOpen size={22} className="text-neutral-400" />
              </div>
              <p className="text-sm font-medium text-neutral-600">No courses yet</p>
              <p className="text-xs text-neutral-400 mt-1 mb-4">Browse the catalog and start learning.</p>
              <Button asChild size="sm"><Link href="/courses" className="no-underline">Browse courses</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {enrollments.slice(0, 4).map(({ enrollment, progress }) => (
                <Link
                  key={enrollment.id}
                  href={`/learn/${enrollment.course?.slug ?? enrollment.course?.documentId}`}
                  className="block no-underline group"
                >
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-brand-200 transition-all h-full">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="text-sm font-semibold text-neutral-800 line-clamp-2 group-hover:text-brand-600 transition-colors">
                        {enrollment.course?.title}
                      </p>
                      {progress?.percentage === 100 && (
                        <Badge variant="success" size="sm" className="shrink-0">
                          <CheckCircle size={11} className="mr-1" /> Done
                        </Badge>
                      )}
                    </div>
                    <ProgressBar
                      value={progress?.percentage ?? 0}
                      size="sm"
                      color={progress?.percentage === 100 ? 'success' : 'brand'}
                      showValue
                    />
                    <p className="mt-1.5 text-xs text-neutral-400">
                      {progress?.completedLessons ?? 0} / {progress?.totalLessons ?? 0} lessons
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quiz Results */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Quiz Results</p>
              {quizResults.length > 0 && <Badge variant="brand" size="sm">{quizResults.length}</Badge>}
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              {quizLoading ? (
                <div className="divide-y divide-neutral-100">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="px-4 py-3.5">
                      <Skeleton className="h-3.5 w-32 rounded mb-2" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                  ))}
                </div>
              ) : quizResults.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <p className="text-sm text-neutral-400">No quiz attempts yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {quizResults.map((r) => {
                    const scoreColor = r.score >= 80 ? 'text-emerald-600' : r.score >= 50 ? 'text-amber-600' : 'text-rose-600';
                    const scoreBg = r.score >= 80 ? 'bg-emerald-50' : r.score >= 50 ? 'bg-amber-50' : 'bg-rose-50';
                    return (
                      <div key={r.id} className="flex items-center gap-3 px-4 py-3.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-800 truncate">{r.quiz?.title ?? 'Quiz'}</p>
                          <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                            <Clock size={10} /> {timeAgo(r.submittedAt)}
                          </p>
                        </div>
                        <div className={`flex items-center justify-center h-9 w-9 rounded-lg text-sm font-bold ${scoreBg} ${scoreColor}`}>
                          {Math.round(r.score)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Zap size={13} /> Quick Actions
            </p>
            <div className="space-y-2">
              {[
                { label: 'Browse Courses', icon: <BookOpen size={15} />,     href: '/courses',     color: 'text-brand-600 bg-brand-50' },
                { label: 'My Learning',    icon: <GraduationCap size={15} />, href: '/my-learning', color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Blog',           icon: <FileText size={15} />,      href: '/blog',        color: 'text-blue-600 bg-blue-50' },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="block no-underline group">
                  <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 hover:border-neutral-300 hover:shadow-sm transition-all">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-md ${item.color}`}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">{item.label}</span>
                    <ArrowUpRight size={13} className="ml-auto text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
