'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus, BookOpen, Edit3, Trash2, Users, Layers, Globe, EyeOff, Search } from 'lucide-react';
import { useInstructorCourses } from '@/hooks/useInstructor';
import { api, ApiClientError } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/Modal';
import type { Course } from '@/types';

export default function InstructorCoursesPage() {
  const { courses, loading, error, reload } = useInstructorCourses();
  const [search, setSearch] = React.useState('');
  const [deleteTarget, setDeleteTarget] = React.useState<Course | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/courses/${deleteTarget.documentId}`);
      setDeleteTarget(null);
      reload();
    } catch (e) {
      setActionError(e instanceof ApiClientError ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  async function togglePublish(course: Course) {
    setActionLoading(course.documentId);
    setActionError(null);
    try {
      if (course.status === 'published') {
        await api.patch(`/courses/${course.documentId}/unpublish`, {});
      } else {
        await api.patch(`/courses/${course.documentId}/publish`, {});
      }
      reload();
    } catch (e) {
      setActionError(e instanceof ApiClientError ? e.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Courses</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{courses.length} course{courses.length !== 1 ? 's' : ''} total</p>
        </div>
        <Button asChild leftIcon={<Plus size={16} />}>
          <Link href="/instructor/courses/new" className="no-underline">New Course</Link>
        </Button>
      </div>

      {actionError && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{actionError}</div>
      )}

      {/* Search */}
      <Input
        placeholder="Search courses..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftElement={<Search size={15} />}
      />

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : error ? (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
          <BookOpen size={36} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-sm font-medium text-neutral-600">
            {search ? 'No courses match your search' : 'No courses yet'}
          </p>
          {!search && (
            <Button asChild size="sm" className="mt-4" leftIcon={<Plus size={14} />}>
              <Link href="/instructor/courses/new" className="no-underline">Create your first course</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200/60 bg-white overflow-hidden">
          <div className="divide-y divide-neutral-100">
            {filtered.map((course) => (
              <div key={course.documentId} className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <BookOpen size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{course.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      <Layers size={11} /> {course.lessons?.length ?? 0} lessons
                    </span>
                  </div>
                </div>
                <Badge variant={course.status === 'published' ? 'published' : 'draft'} dot>
                  {course.status}
                </Badge>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost" size="xs"
                    loading={actionLoading === course.documentId}
                    onClick={() => togglePublish(course)}
                    title={course.status === 'published' ? 'Unpublish' : 'Publish'}
                  >
                    {course.status === 'published' ? <EyeOff size={14} /> : <Globe size={14} />}
                  </Button>
                  <Button variant="ghost" size="xs" asChild>
                    <Link href={`/instructor/courses/${course.documentId}`} className="no-underline" title="Manage content"><Layers size={14} /></Link>
                  </Button>
                  <Button variant="ghost" size="xs" asChild>
                    <Link href={`/instructor/courses/${course.documentId}/edit`} className="no-underline" title="Edit details"><Edit3 size={14} /></Link>
                  </Button>
                  <Button variant="ghost" size="xs" className="text-rose-500 hover:bg-rose-50" onClick={() => setDeleteTarget(course)} title="Delete">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This will permanently delete the course and all its lessons. This cannot be undone."
        confirmLabel="Delete Course"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
