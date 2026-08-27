'use client';

import * as React from 'react';
import Link from 'next/link';
import { BookOpen, Users, Layers, Award, TrendingUp, Plus, ArrowRight, Eye, Edit3, BarChart3, Clock } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { useInstructorCourses } from '@/hooks/useInstructor';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { ApiListResponse, QuizResult } from '@/types';

function StatCard({ label, value, icon, sub, color }: {
  label: string; value: number | string; icon: React.ReactNode; sub?: string;
  color: 'emerald' | 'blue' | 'violet' | 'amber' | 'rose';
}) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    violet: 'bg-violet-50 text-violet-600 border-violet-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
  };
  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="mt-1.5 text-3xl font-bold text-neutral-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-neutral-400">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colors[color]}`}>
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
    api.get<ApiListResponse<QuizResult>>('/quiz-results?populate[quiz]=true&populate[student]=true&sort=submittedAt:desc&pagination[pageSize]=5')
      .then((r) => setQuizResults(r.data ?? []))
      .catch(() => {})
      .finally(() => setQuizLoading(false));
  }, []);

  const published = courses.filter((c) => c.status === 'published').length;
  const draft = courses.filter((c) => c.status === 'draft').length;
  const totalLessons = courses.reduce((s, c) => s + (c.lessons?.length ?? 0), 0);
  const totalStudents = 0; // enrollments not aggregated here — shown per course

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500 flex items-center gap-1.5">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <BookOpen size={11} />
          </span>
          {greeting()}, {user?.username}
        </p>
          <h1 className="text-2xl font-bold text-neutral-900 mt-0.5">Instructor Dashboard</h1>
        </div>
        <Button asChild leftIcon={<Plus size={16} />}>
          <Link href="/instructor/courses/new" className="no-underline">New Course</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-neutral-200/60 bg-white p-6">
              <Skeleton className="h-4 w-20 rounded mb-2" />
              <Skeleton className="h-8 w-12 rounded" />
            </div>
          ))
        ) : (
          <>
            <StatCard label="Total Courses" value={courses.length} icon={<BookOpen size={18} />} sub={`${published} published, ${draft} draft`} color="violet" />
            <StatCard label="Total Lessons" value={totalLessons} icon={<Layers size={18} />} color="blue" />
            <StatCard label="Published" value={published} icon={<TrendingUp size={18} />} color="emerald" />
            <StatCard label="Quiz Submissions" value={quizResults.length} icon={<Award size={18} />} color="amber" />
          </>
        )}
      </div>

      {/* My Courses */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
            <BookOpen size={14} /> My Courses
          </h2>
          <Link href="/instructor/courses" className="text-xs font-medium text-violet-600 hover:text-violet-700 no-underline flex items-center gap-1 group">
            View all <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
            <BookOpen size={32} className="mx-auto text-neutral-300 mb-3" />
            <p className="text-sm font-medium text-neutral-600">No courses yet</p>
            <p className="text-xs text-neutral-400 mt-1 mb-4">Create your first course to get started.</p>
            <Button asChild size="sm" leftIcon={<Plus size={14} />}>
              <Link href="/instructor/courses/new" className="no-underline">Create Course</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.slice(0, 5).map((course) => (
              <div key={course.documentId} className="flex items-center gap-4 rounded-2xl border border-neutral-200/60 bg-white px-5 py-4 hover:shadow-sm transition-shadow">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <BookOpen size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{course.title}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{course.lessons?.length ?? 0} lessons</p>
                </div>
                <Badge variant={course.status === 'published' ? 'published' : 'draft'} dot>
                  {course.status}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="xs" asChild>
                    <Link href={`/instructor/courses/${course.documentId}`} className="no-underline"><Eye size={14} /></Link>
                  </Button>
                  <Button variant="ghost" size="xs" asChild>
                    <Link href={`/instructor/courses/${course.documentId}/edit`} className="no-underline"><Edit3 size={14} /></Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Quiz Results */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2 mb-4">
          <Award size={14} /> Recent Quiz Submissions
        </h2>
        {quizLoading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
        ) : quizResults.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200/60 bg-white p-8 text-center">
            <p className="text-sm text-neutral-400">No quiz submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {quizResults.map((r) => (
              <div key={r.id} className="flex items-center gap-4 rounded-2xl border border-neutral-200/60 bg-white px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{r.quiz?.title ?? 'Quiz'}</p>
                  <p className="text-xs text-neutral-400">{r.student?.username ?? 'Student'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${r.score >= 80 ? 'text-emerald-600' : r.score >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {Math.round(r.score)}%
                  </span>
                  <span className="text-xs text-neutral-400">{r.correctAnswers}/{r.totalQuestions}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
