'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useCourse } from '@/hooks/useInstructor';
import { CourseForm } from '@/components/instructor/CourseForm';
import { PermissionError } from '@/components/instructor/PermissionError';
import { Skeleton } from '@/components/ui/Skeleton';

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { course, loading, forbidden, error } = useCourse(id);

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-6 w-32 rounded" />
        <Skeleton className="h-8 w-64 rounded" />
        <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 space-y-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (forbidden) return <PermissionError message="You can only edit your own courses." />;
  if (error || !course) return (
    <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
      {error ?? 'Course not found'}
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/instructor/courses" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 no-underline mb-4">
          <ArrowLeft size={15} /> Back to my courses
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Edit Course</h1>
        <p className="text-sm text-neutral-500 mt-1 truncate">{course.title}</p>
      </div>
      <div className="rounded-2xl border border-neutral-200/60 bg-white p-6">
        <CourseForm initial={course} documentId={id} />
      </div>
    </div>
  );
}
