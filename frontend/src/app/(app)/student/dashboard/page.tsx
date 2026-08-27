'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BookOpen, GraduationCap, FileText, TrendingUp, Award,
  ArrowRight, CheckCircle, Clock, PlayCircle,
  Layers, Target, Star, Zap, Sun, Sunset, Moon,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { api } from '@/lib/api';
import { useEnrollments } from '@/hooks/useEnrollments';
import type { QuizResult, ApiListResponse } from '@/types';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getGreetingIcon() {
  const h = new Date().getHours();
  if (h < 12) return <Sun size={14} className="text-amber-300" />;
  if (h < 17) return <Sunset size={14} className="text-orange-300" />;
  return <Moon size={14} className="text-indigo-300" />;
}

function scoreColor(s: number) {
  if (s >= 80) return 'text-emerald-600';
  if (s >= 50) return 'text-amber-600';
  return 'text-rose-600';
}
function scoreBg(s: number) {
  if (s >= 80) return 'bg-emerald-50 border-emerald-200';
  if (s >= 50) return 'bg-amber-50 border-amber-200';
  return 'bg-rose-50 border-rose-200';
}
function scoreIcon(s: number) {
  if (s >= 80) return <Star size={16} className="text-amber-500 fill-amber-400" />;
  if (s >= 50) return <TrendingUp size={16} className="text-blue-500" />;
  return <BookOpen size={16} className="text-violet-500" />;
}
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'Just now';
}

function StatCard({ label, value, icon, color }: {
  label: string; value: number | string; icon: React.ReactNode;
  color: 'brand' | 'emerald' | 'blue' | 'purple';
}) {
  const colors = {
    brand:   'bg-violet-50 text-violet-600 border-violet-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    blue:    'bg-blue-50 text-blue-600 border-blue-200',
    purple:  'bg-purple-50 text-purple-600 border-purple-200',
  };
  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 hover:shadow-md transition-all hover:scale-[1.02]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="mt-1.5 text-3xl font-bold text-neutral-900">{value}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
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
    <div className="space-y-8 animate-fade-up">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-8 text-white shadow-2xl shadow-violet-500/20">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-violet-200 mb-1">
              {getGreetingIcon()}
              <span>{greeting()}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{user?.username}</h1>
            <p className="mt-2 text-violet-200 text-sm">
              {totalEnrolled === 0
                ? 'Start your learning journey today.'
                : `You're enrolled in ${totalEnrolled} course${totalEnrolled !== 1 ? 's' : ''}. Keep it up!`}
            </p>
          </div>
          {totalEnrolled > 0 && (
            <div className="flex flex-wrap gap-6 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
              <div className="text-center"><div className="text-2xl font-bold">{totalEnrolled}</div><div className="text-xs text-violet-200">Enrolled</div></div>
              <div className="text-center"><div className="text-2xl font-bold">{completed}</div><div className="text-xs text-violet-200">Completed</div></div>
              <div className="text-center"><div className="text-2xl font-bold">{avgProgress}%</div><div className="text-xs text-violet-200">Progress</div></div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Enrolled"     value={totalEnrolled}      icon={<BookOpen size={18} />}    color="brand" />
        <StatCard label="Completed"    value={completed}          icon={<CheckCircle size={18} />} color="emerald" />
        <StatCard label="Avg Progress" value={`${avgProgress}%`}  icon={<Target size={18} />}      color="blue" />
        <StatCard label="Quizzes Taken" value={quizResults.length} icon={<Award size={18} />}      color="purple" />
      </div>

      {/* Continue Learning */}
      {!enrollLoading && continueItem && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} /> Continue Learning
            </h2>
            <Badge variant="brand" size="sm">In Progress</Badge>
          </div>
          <Link href={`/learn/${continueItem.enrollment.course?.slug ?? continueItem.enrollment.course?.documentId}`} className="block no-underline group">
            <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 hover:shadow-xl hover:border-violet-200 hover:scale-[1.01] transition-all">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                  <PlayCircle size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-neutral-900 truncate group-hover:text-violet-600 transition-colors">
                    {continueItem.enrollment.course?.title}
                  </p>
                  <div className="mt-3 space-y-1.5">
                    <ProgressBar value={continueItem.progress?.percentage ?? 0} size="sm" color="brand" showValue />
                    <p className="text-xs text-neutral-400">
                      {continueItem.progress?.completedLessons ?? 0} / {continueItem.progress?.totalLessons ?? 0} lessons complete
                    </p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-neutral-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* My Courses */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            <Layers size={14} /> My Courses
          </h2>
          <Link href="/my-learning" className="text-xs font-medium text-violet-600 hover:text-violet-700 no-underline flex items-center gap-1 group">
            View all <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        {enrollLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0,1,2,3].map(i => <div key={i} className="animate-pulse"><SkeletonCard /></div>)}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200/60 bg-white p-12 text-center">
            <BookOpen size={32} className="mx-auto text-neutral-300 mb-3" />
            <p className="text-sm font-medium text-neutral-600">No courses yet</p>
            <p className="text-xs text-neutral-400 mt-1 mb-4">Browse the catalog and start learning.</p>
            <Button asChild><Link href="/courses" className="no-underline">Browse courses</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrollments.slice(0, 4).map(({ enrollment, progress }, i) => (
              <Link key={enrollment.id} href={`/learn/${enrollment.course?.slug ?? enrollment.course?.documentId}`} className="block no-underline group">
                <div className="rounded-2xl border border-neutral-200/60 bg-white p-5 hover:shadow-xl hover:border-violet-200 hover:scale-[1.02] transition-all h-full">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <p className="text-sm font-semibold text-neutral-900 line-clamp-2 group-hover:text-violet-600 transition-colors">
                      {enrollment.course?.title}
                    </p>
                    {progress?.percentage === 100 && (
                      <Badge variant="success" size="sm" className="shrink-0">
                        <CheckCircle size={12} className="mr-1" /> Done
                      </Badge>
                    )}
                  </div>
                  <ProgressBar value={progress?.percentage ?? 0} size="sm" color={progress?.percentage === 100 ? 'success' : 'brand'} showValue />
                  <p className="mt-2 text-xs text-neutral-400">{progress?.completedLessons ?? 0} / {progress?.totalLessons ?? 0} lessons</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quiz Results */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            <Award size={14} /> Recent Quiz Results
          </h2>
          {quizResults.length > 0 && <Badge variant="brand" size="sm">{quizResults.length} attempts</Badge>}
        </div>
        {quizLoading ? (
          <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : quizResults.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200/60 bg-white p-8 text-center">
            <p className="text-sm text-neutral-400">No quiz attempts yet. Enroll in a course and take a quiz!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizResults.map((r) => (
              <div key={r.id} className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 ${scoreBg(r.score)} transition-all hover:shadow-md`}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/50">{scoreIcon(r.score)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{r.quiz?.title ?? 'Quiz'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-neutral-500">{r.correctAnswers} / {r.totalQuestions} correct</p>
                      <span className="text-xs text-neutral-300">•</span>
                      <p className="text-xs text-neutral-500 flex items-center gap-1"><Clock size={10} />{timeAgo(r.submittedAt)}</p>
                    </div>
                  </div>
                </div>
                <span className={`text-xl font-bold ${scoreColor(r.score)}`}>{Math.round(r.score)}%</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2 mb-4">
          <Zap size={14} /> Quick Actions
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Browse Courses', icon: <BookOpen size={18} />, href: '/courses', color: 'violet' },
            { label: 'My Learning',    icon: <GraduationCap size={18} />, href: '/my-learning', color: 'emerald' },
            { label: 'Blog',           icon: <FileText size={18} />, href: '/blog', color: 'blue' },
          ].map((item, i) => (
            <Link key={i} href={item.href} className="block no-underline group">
              <div className="rounded-2xl border border-neutral-200/60 bg-white p-4 text-center hover:shadow-lg hover:scale-[1.05] transition-all">
                <div className={`flex items-center justify-center text-${item.color}-600 group-hover:scale-110 transition-transform`}>{item.icon}</div>
                <p className="mt-2 text-xs font-medium text-neutral-700 group-hover:text-violet-600 transition-colors">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
