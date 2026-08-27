'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus, Search, Edit3, Trash2, Globe, EyeOff, BookOpen, Layers, Filter } from 'lucide-react';
import { useAllCourses } from '@/hooks/useContent';
import { api, ApiClientError } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, TableLoading, TableEmpty } from '@/components/ui/Table';
import type { Course } from '@/types';

type StatusFilter = 'all' | 'published' | 'draft';

export default function ContentCoursesPage() {
  const { courses, loading, error, reload } = useAllCourses();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [deleteTarget, setDeleteTarget] = React.useState<Course | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const filtered = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.instructor?.username ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function togglePublish(course: Course) {
    setActionLoading(course.documentId);
    setActionError(null);
    try {
      await api.patch(`/courses/${course.documentId}/${course.status === 'published' ? 'unpublish' : 'publish'}`, {});
      reload();
    } catch (e) {
      setActionError(e instanceof ApiClientError ? e.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/courses/${deleteTarget.documentId}`);
      setDeleteTarget(null);
      reload();
    } catch (e) {
      setActionError(e instanceof ApiClientError ? e.message : 'Delete failed');
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Courses</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{courses.length} total</p>
        </div>
        <Button asChild leftIcon={<Plus size={15} />}>
          <Link href="/content/courses/new" className="no-underline">New Course</Link>
        </Button>
      </div>

      {actionError && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{actionError}</div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input placeholder="Search by title or instructor..." value={search} onChange={e => setSearch(e.target.value)} leftElement={<Search size={15} />} />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1">
          {(['all', 'published', 'draft'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${statusFilter === s ? 'bg-violet-600 text-white' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Course</TableHeaderCell>
            <TableHeaderCell>Instructor</TableHeaderCell>
            <TableHeaderCell>Lessons</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        {loading ? (
          <TableBody><TableLoading cols={6} rows={5} /></TableBody>
        ) : filtered.length === 0 ? (
          <TableBody><TableEmpty cols={6} icon={<BookOpen size={32} />} title={search || statusFilter !== 'all' ? 'No courses match your filters' : 'No courses yet'} /></TableBody>
        ) : (
          <TableBody>
            {filtered.map(course => (
              <TableRow key={course.documentId} className="hover:bg-neutral-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                      <BookOpen size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 truncate max-w-[200px]">{course.title}</p>
                      <p className="text-xs text-neutral-400 font-mono truncate max-w-[200px]">{course.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-neutral-600">{course.instructor?.username ?? <span className="text-neutral-300 italic">None</span>}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 text-neutral-600"><Layers size={13} /> {course.lessons?.length ?? 0}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={course.status === 'published' ? 'published' : 'draft'} dot>{course.status}</Badge>
                </TableCell>
                <TableCell className="text-neutral-500 text-xs">{new Date(course.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="xs" loading={actionLoading === course.documentId} onClick={() => togglePublish(course)} title={course.status === 'published' ? 'Unpublish' : 'Publish'}>
                      {course.status === 'published' ? <EyeOff size={14} /> : <Globe size={14} />}
                    </Button>
                    <Button variant="ghost" size="xs" asChild>
                      <Link href={`/content/courses/${course.documentId}`} className="no-underline" title="Manage lessons & quiz">
                        <Layers size={14} />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="xs" asChild>
                      <Link href={`/content/courses/${course.documentId}/edit`} className="no-underline" title="Edit"><Edit3 size={14} /></Link>
                    </Button>
                    <Button variant="ghost" size="xs" className="text-rose-500 hover:bg-rose-50" onClick={() => setDeleteTarget(course)} title="Delete">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={o => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This will permanently delete the course and all its lessons. This cannot be undone."
        confirmLabel="Delete Course"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
