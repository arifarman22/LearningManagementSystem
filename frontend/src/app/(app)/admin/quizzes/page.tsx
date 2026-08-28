'use client';

import * as React from 'react';
import Link from 'next/link';
import { Award, BookOpen, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { useAllCourses } from '@/hooks/useContent';
import { QuizEditor } from '@/components/instructor/QuizEditor';
import { PageHeader } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AdminQuizzesPage() {
  const { courses, loading, error } = useAllCourses();
  const [expanded, setExpanded] = React.useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quizzes"
        description="Create and manage quizzes for any course"
      />

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
          <BookOpen size={32} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-sm font-medium text-neutral-600">No courses yet</p>
          <Link href="/content/courses/new" className="text-xs text-violet-600 hover:underline mt-1 inline-block">Create a course first</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => {
            const isOpen = expanded === course.documentId;
            return (
              <div key={course.documentId} className="rounded-2xl border border-neutral-200/60 bg-white overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : course.documentId)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Award size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{course.title}</p>
                    <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                      <Layers size={11} /> {course.lessons?.length ?? 0} lessons
                    </p>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-neutral-400 shrink-0" /> : <ChevronDown size={16} className="text-neutral-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="border-t border-neutral-100 px-5 py-5">
                    <QuizEditor courseDocumentId={course.documentId} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
