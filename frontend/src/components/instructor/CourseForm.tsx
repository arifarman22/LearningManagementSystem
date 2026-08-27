'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiClientError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Course, User } from '@/types';

interface CourseFormProps {
  initial?: Partial<Course>;
  documentId?: string;
  redirectBase?: string; // e.g. '/content/courses' or '/instructor/courses'
}

export function CourseForm({ initial, documentId, redirectBase }: CourseFormProps) {
  const router = useRouter();
  const { user: me } = useAuth();
  const canAssignInstructor = me?.role?.type === 'admin' || me?.role?.type === 'content-manager';
  const [title, setTitle] = React.useState(initial?.title ?? '');
  const [description, setDescription] = React.useState(initial?.description ?? '');
  const [slug, setSlug] = React.useState(initial?.slug ?? '');
  const [status, setStatus] = React.useState<'draft' | 'published'>(initial?.status ?? 'draft');
  const [instructorId, setInstructorId] = React.useState<string>(String(initial?.instructor?.id ?? ''));
  const [instructors, setInstructors] = React.useState<User[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!canAssignInstructor) return;
    api.get<{ data: User[] }>('/admin-panel/users')
      .then(res => setInstructors((res.data ?? []).filter(u => u.role?.type === 'instructor')))
      .catch(() => {});
  }, [canAssignInstructor]);

  // Auto-generate slug from title on create
  React.useEffect(() => {
    if (!documentId && title) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  }, [title, documentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const instructorPayload = canAssignInstructor ? { instructor: instructorId ? Number(instructorId) : null } : {};
      if (documentId) {
        const updateData: any = { title, slug, ...instructorPayload };
        if (description.trim()) updateData.description = description.trim();
        await api.put(`/courses/${documentId}`, { data: updateData });
        const current = initial?.status;
        if (status !== current) {
          await api.patch(`/courses/${documentId}/${status === 'published' ? 'publish' : 'unpublish'}`, {});
        }
        const base = redirectBase ?? '/instructor/courses';
        router.push(`${base}/${documentId}`);
      } else {
        const res = await api.post<{ data: Course }>('/courses', { data: { title, description, slug, status, ...instructorPayload } });
        const base = redirectBase ?? '/instructor/courses';
        router.push(`${base}/${res.data.documentId}`);
      }
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}
      <Input
        label="Course Title"
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Introduction to React"
      />
      <Input
        label="Slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="e.g. intro-to-react"
        helperText="URL-friendly identifier"
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What will students learn in this course?"
        rows={4}
      />
      <Select
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
        options={[
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
        ]}
      />
      {canAssignInstructor && (
        <Select
          label="Instructor"
          value={instructorId}
          onChange={(e) => setInstructorId(e.target.value)}
          options={[
            { value: '', label: '— No instructor —' },
            ...instructors.map(u => ({ value: String(u.id), label: u.username })),
          ]}
        />
      )}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={saving}>
          {documentId ? 'Save Changes' : 'Create Course'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
