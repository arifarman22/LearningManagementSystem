'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Award, CheckCircle, Clock } from 'lucide-react';
import { useCourse, useCourseStudents } from '@/hooks/useInstructor';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';

export default function AdminCourseStudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { course, loading: courseLoading } = useCourse(id);
  const totalLessons = course?.lessons?.length ?? 0;

  return courseLoading
    ? <StudentsLoading />
    : <StudentsView id={id} course={course} totalLessons={totalLessons} />;
}

function StudentsLoading() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
    </div>
  );
}

function StudentsView({ id, course, totalLessons }: { id: string; course: any; totalLessons: number }) {
  const { students, loading, error } = useCourseStudents(id, totalLessons);

  const avgProgress = students.length
    ? Math.round(students.reduce((s, st) => s + st.percentage, 0) / students.length)
    : 0;
  const completed = students.filter((s) => s.percentage === 100).length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 no-underline mb-4">
          <ArrowLeft size={15} /> All Courses
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Student Progress</h1>
        {course && <p className="text-sm text-neutral-500 mt-0.5 truncate">{course.title}</p>}
      </div>

      {!loading && students.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-neutral-200/60 bg-white p-5 text-center">
            <p className="text-2xl font-bold text-neutral-900">{students.length}</p>
            <p className="text-xs text-neutral-500 mt-1 flex items-center justify-center gap-1"><Users size={12} /> Enrolled</p>
          </div>
          <div className="rounded-2xl border border-neutral-200/60 bg-white p-5 text-center">
            <p className="text-2xl font-bold text-emerald-600">{completed}</p>
            <p className="text-xs text-neutral-500 mt-1 flex items-center justify-center gap-1"><CheckCircle size={12} /> Completed</p>
          </div>
          <div className="rounded-2xl border border-neutral-200/60 bg-white p-5 text-center">
            <p className="text-2xl font-bold text-violet-600">{avgProgress}%</p>
            <p className="text-xs text-neutral-500 mt-1 flex items-center justify-center gap-1"><Clock size={12} /> Avg Progress</p>
          </div>
        </div>
      )}

      {loading ? (
        <StudentsLoading />
      ) : error ? (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
          <Users size={36} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-sm font-medium text-neutral-600">No students enrolled yet</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200/60 bg-white overflow-hidden">
          <div className="divide-y divide-neutral-100">
            {students.map(({ enrollment, completedLessons, totalLessons: tl, percentage, quizResults }) => {
              const student = enrollment.student;
              const bestQuiz = quizResults.length > 0
                ? quizResults.reduce((best, r) => r.score > best.score ? r : best, quizResults[0])
                : null;
              return (
                <div key={enrollment.documentId} className="px-5 py-4">
                  <div className="flex items-start gap-4">
                    <Avatar name={student?.username ?? '?'} size="sm" className="shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{student?.username ?? 'Unknown'}</p>
                          <p className="text-xs text-neutral-400">{student?.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {percentage === 100 && <Badge variant="success" size="sm" dot>Completed</Badge>}
                          {bestQuiz && (
                            <div className="flex items-center gap-1 text-xs">
                              <Award size={12} className="text-amber-500" />
                              <span className={`font-semibold ${bestQuiz.score >= 80 ? 'text-emerald-600' : bestQuiz.score >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {Math.round(bestQuiz.score)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ProgressBar value={percentage} size="sm" color={percentage === 100 ? 'success' : 'brand'} showValue />
                      <p className="text-xs text-neutral-400 mt-1">
                        {completedLessons} / {tl} lessons complete
                        {quizResults.length > 0 && ` · ${quizResults.length} quiz attempt${quizResults.length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
