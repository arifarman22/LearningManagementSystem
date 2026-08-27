'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit3, Users, BookOpen, Award, Globe, EyeOff, Layers } from 'lucide-react';
import { useCourse } from '@/hooks/useInstructor';
import { api, ApiClientError } from '@/lib/api';
import { LessonEditor } from '@/components/instructor/LessonEditor';
import { QuizEditor } from '@/components/instructor/QuizEditor';
import { PermissionError } from '@/components/instructor/PermissionError';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

type Tab = 'lessons' | 'quiz' | 'overview';

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { course, loading, forbidden, error, reload } = useCourse(id);
  const [tab, setTab] = React.useState<Tab>('lessons');
  const [publishing, setPublishing] = React.useState(false);
  const [publishError, setPublishError] = React.useState<string | null>(null);

  async function togglePublish() {
    if (!course) return;
    setPublishing(true);
    setPublishError(null);
    try {
      if (course.status === 'published') {
        await api.patch(`/courses/${id}/unpublish`, {});
      } else {
        await api.patch(`/courses/${id}/publish`, {});
      }
      reload();
    } catch (e) {
      setPublishError(e instanceof ApiClientError ? e.message : 'Action failed');
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32 rounded" />
        <Skeleton className="h-8 w-72 rounded" />
        <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 space-y-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (forbidden) return <PermissionError />;
  if (error || !course) return (
    <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
      {error ?? 'Course not found'}
    </div>
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'lessons', label: 'Lessons', icon: <Layers size={14} /> },
    { id: 'quiz', label: 'Quiz', icon: <Award size={14} /> },
    { id: 'overview', label: 'Overview', icon: <BookOpen size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link href="/instructor/courses" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 no-underline mb-4">
          <ArrowLeft size={15} /> My Courses
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-neutral-900 truncate">{course.title}</h1>
              <Badge variant={course.status === 'published' ? 'published' : 'draft'} dot>
                {course.status}
              </Badge>
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              {course.lessons?.length ?? 0} lessons
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              loading={publishing}
              onClick={togglePublish}
              leftIcon={course.status === 'published' ? <EyeOff size={14} /> : <Globe size={14} />}
            >
              {course.status === 'published' ? 'Unpublish' : 'Publish'}
            </Button>
            <Button variant="secondary" size="sm" asChild leftIcon={<Edit3 size={14} />}>
              <Link href={`/instructor/courses/${id}/edit`} className="no-underline">Edit</Link>
            </Button>
            <Button variant="secondary" size="sm" asChild leftIcon={<Users size={14} />}>
              <Link href={`/instructor/courses/${id}/students`} className="no-underline">Students</Link>
            </Button>
          </div>
        </div>
        {publishError && (
          <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{publishError}</div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border border-neutral-200/60 bg-white p-6">
        {tab === 'lessons' && <LessonEditor courseDocumentId={id} />}
        {tab === 'quiz' && <QuizEditor courseDocumentId={id} />}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                {course.description || <span className="text-neutral-400 italic">No description yet.</span>}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Slug</p>
              <code className="text-sm text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">{course.slug}</code>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">Created</p>
              <p className="text-sm text-neutral-700">{new Date(course.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
