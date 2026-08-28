'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BookOpen, Layers, Award, TrendingUp, Plus,
  ArrowUpRight, Edit3, BarChart3,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { useInstructorCourses } from '@/hooks/useInstructor';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ApiListResponse, QuizResult } from '@/types';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({ label, value, icon, sub, accent }: {
  label: string; value: number | string; icon: React.ReactNode; sub?: string;
  accent: 'cyan' | 'emerald' | 'blue' | 'amber';
}) {
  const bars = { cyan: 'bg-brand-500', emerald: 'bg-emerald-500', blue: 'bg-blue-500', amber: 'bg-amber-500' };
  const icons = { cyan: 'bg-brand-50 text-brand-600', emerald: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600' };
  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${bars[accent]}`} />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-neutral-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-neutral-400">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${icons[accent]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function InstructorDashboardPage() {
  const { user } = useAuth();
  const { courses, loading } = useInstructorCourses();
  const [quizResults, setQuizResults] = React.useState<QuizResult[]>([]);
  const [quizLoading, setQuizLoading] = React.useState(true);

  React.useEffect(() => {
    api.get<ApiListResponse<QuizResult>>(
      '/quiz-results?populate[quiz]=true&populate[student]=true&sort=submittedAt:desc&pagination[pageSize]=5',
    )
      .then((r) => setQuizResults(r.data ?? []))
      .catch(() => {})
      .finally(() => setQuizLoading(false));
  }, []);

  const published = courses.filter((c) => c.status === 'published').length;
  const draft = courses.filter((c) => c.status === 'draft').length;
  const totalLessons = courses.reduce((s, c) => s + (c.lessons?.length ?? 0), 0);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500">{greeting()}, {user?.username} 👋</p>
          <h1 className="text-2xl font-bold text-neutral-900 mt-0.5">Instructor Dashboard</h1>
        </div>
        <Button asChild leftIcon={<Plus size={15} />} size="sm">
          <Link href="/instructor/courses/new" className="no-underline">New Course</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5">
              <Skeleton className="h-3 w-16 rounded mb-3" />
              <Skeleton className="h-7 w-12 rounded" />
            </div>
          ))
        ) : (
          <>
            <StatCard label="Total Courses"    value={courses.length}    icon={<BookOpen size={17} />}    sub={`${published} published, ${draft} draft`} accent="cyan" />
            <StatCard label="Total Lessons"    value={totalLessons}      icon={<Layers size={17} />}      accent="blue" />
            <StatCard label="Published"        value={published}         icon={<TrendingUp size={17} />}  accent="emerald" />
            <StatCard label="Quiz Submissions" value={quizResults.length} icon={<Award size={17} />}      accent="amber" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Courses */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide flex items-center gap-2">
              <BookOpen size={13} /> My Courses
            </p>
            <Link href="/instructor/courses" className="text-xs font-medium text-brand-600 hover:text-brand-700 no-underline flex items-center gap-1 group">
              View all <ArrowUpRight size={12} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="divide-y divide-neutral-100">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                    <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                    <div className="flex-1"><Skeleton className="h-3.5 w-40 rounded mb-2" /><Skeleton className="h-3 w-24 rounded" /></div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="h-12 w-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-3">
                  <BookOpen size={22} className="text-neutral-400" />
                </div>
                <p className="text-sm font-medium text-neutral-600">No courses yet</p>
                <p className="text-xs text-neutral-400 mt-1 mb-4">Create your first course to get started.</p>
                <Button asChild size="sm" leftIcon={<Plus size={13} />}>
                  <Link href="/instructor/courses/new" className="no-underline">Create Course</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {courses.slice(0, 6).map((course) => (
                  <div key={course.documentId} className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 transition-colors">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <BookOpen size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">{course.title}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{course.lessons?.length ?? 0} lessons</p>
                    </div>
                    <Badge variant={course.status === 'published' ? 'published' : 'draft'} size="sm" dot>
                      {course.status}
                    </Badge>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="xs" asChild title="Manage">
                        <Link href={`/instructor/courses/${course.documentId}`} className="no-underline"><Layers size={13} /></Link>
                      </Button>
                      <Button variant="ghost" size="xs" asChild title="Edit">
                        <Link href={`/instructor/courses/${course.documentId}/edit`} className="no-underline"><Edit3 size={13} /></Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quiz Results */}
        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide flex items-center gap-2 mb-3">
            <BarChart3 size={13} /> Recent Submissions
          </p>
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
              <div className="py-10 px-4 text-center">
                <p className="text-sm text-neutral-400">No submissions yet.</p>
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
                        <p className="text-xs text-neutral-400 mt-0.5">{r.student?.username ?? 'Student'}</p>
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
      </div>
    </div>
  );
}
