'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CourseForm } from '@/components/instructor/CourseForm';

export default function ContentNewCoursePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/content/courses" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 no-underline mb-4">
          <ArrowLeft size={15} /> Back to courses
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Create New Course</h1>
        <p className="text-sm text-neutral-500 mt-1">Fill in the details to create a new course.</p>
      </div>
      <div className="rounded-2xl border border-neutral-200/60 bg-white p-6">
        <CourseForm redirectBase="/content/courses" />
      </div>
    </div>
  );
}
