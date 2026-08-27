'use client';

import * as React from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Video, FileText, Save, X } from 'lucide-react';
import { api, ApiClientError } from '@/lib/api';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { PermissionError } from './PermissionError';
import { useCourseLessons } from '@/hooks/useInstructor';
import type { Lesson } from '@/types';

interface LessonRowProps {
  lesson: Lesson;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onSaved: () => void;
}

function LessonRow({ lesson, index, total, onMoveUp, onMoveDown, onDelete, onSaved }: LessonRowProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [title, setTitle] = React.useState(lesson.title);
  const [content, setContent] = React.useState(lesson.content ?? '');
  const [videoUrl, setVideoUrl] = React.useState(lesson.videoUrl ?? '');
  const [type, setType] = React.useState<'text' | 'video'>(lesson.videoUrl ? 'video' : 'text');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api.put(`/lessons/${lesson.documentId}`, {
        data: { title, content: type === 'text' ? content : null, videoUrl: type === 'video' ? videoUrl : null },
      });
      setExpanded(false);
      onSaved();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex flex-col gap-0.5 shrink-0">
          <button onClick={onMoveUp} disabled={index === 0} className="p-0.5 text-neutral-300 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronUp size={14} />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="p-0.5 text-neutral-300 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronDown size={14} />
          </button>
        </div>
        <span className="text-xs font-mono text-neutral-400 w-5 shrink-0">{index + 1}</span>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
          {lesson.videoUrl ? <Video size={13} /> : <FileText size={13} />}
        </div>
        <p className="flex-1 text-sm font-medium text-neutral-900 truncate">{lesson.title}</p>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="xs" onClick={() => setExpanded((v) => !v)}>
            {expanded ? <X size={14} /> : 'Edit'}
          </Button>
          <Button variant="ghost" size="xs" className="text-rose-500 hover:bg-rose-50" onClick={onDelete}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-neutral-100 px-4 py-4 space-y-4 bg-neutral-50">
          {error && <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">{error}</div>}
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as 'text' | 'video')}
            options={[{ value: 'text', label: 'Text / Article' }, { value: 'video', label: 'Video' }]}
          />
          {type === 'video' ? (
            <Input label="Video URL" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube, Vimeo, or direct URL" />
          ) : (
            <Textarea label="Content" value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
          )}
          <div className="flex gap-2">
            <Button size="sm" loading={saving} onClick={save} leftIcon={<Save size={13} />}>Save</Button>
            <Button size="sm" variant="secondary" onClick={() => setExpanded(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface AddLessonFormProps {
  courseDocumentId: string;
  nextOrder: number;
  onAdded: () => void;
}

function AddLessonForm({ courseDocumentId, nextOrder, onAdded }: AddLessonFormProps) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [type, setType] = React.useState<'text' | 'video'>('text');
  const [content, setContent] = React.useState('');
  const [videoUrl, setVideoUrl] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleAdd() {
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError(null);
    try {
      await api.post('/lessons', {
        data: {
          title,
          course: courseDocumentId,
          order: nextOrder,
          content: type === 'text' ? content : null,
          videoUrl: type === 'video' ? videoUrl : null,
        },
      });
      setTitle(''); setContent(''); setVideoUrl(''); setOpen(false);
      onAdded();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Failed to add lesson');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 py-3 text-sm text-neutral-500 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
      >
        <Plus size={15} /> Add Lesson
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3">
      {error && <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">{error}</div>}
      <Input label="Lesson Title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
      <Select
        label="Type"
        value={type}
        onChange={(e) => setType(e.target.value as 'text' | 'video')}
        options={[{ value: 'text', label: 'Text / Article' }, { value: 'video', label: 'Video' }]}
      />
      {type === 'video' ? (
        <Input label="Video URL" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube, Vimeo, or direct URL" />
      ) : (
        <Textarea label="Content (optional)" value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
      )}
      <div className="flex gap-2">
        <Button size="sm" loading={saving} onClick={handleAdd} leftIcon={<Plus size={13} />}>Add Lesson</Button>
        <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

export function LessonEditor({ courseDocumentId }: { courseDocumentId: string }) {
  const { lessons, setLessons, loading, forbidden, error, reload } = useCourseLessons(courseDocumentId);
  const [deleteTarget, setDeleteTarget] = React.useState<Lesson | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [reordering, setReordering] = React.useState(false);

  if (forbidden) return <PermissionError message="You can only manage lessons for your own courses." />;
  if (error) return <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>;

  async function move(index: number, direction: 'up' | 'down') {
    const newLessons = [...lessons];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newLessons[index], newLessons[swapIndex]] = [newLessons[swapIndex], newLessons[index]];
    setLessons(newLessons);
    setReordering(true);
    try {
      await api.patch(`/courses/${courseDocumentId}/lessons/reorder`, {
        orderedIds: newLessons.map((l) => l.documentId),
      });
    } catch {
      reload(); // revert on failure
    } finally {
      setReordering(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/lessons/${deleteTarget.documentId}`);
      setDeleteTarget(null);
      reload();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-neutral-100 animate-pulse" />)}</div>
      ) : lessons.length === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-4">No lessons yet. Add your first lesson below.</p>
      ) : (
        lessons.map((lesson, i) => (
          <LessonRow
            key={lesson.documentId}
            lesson={lesson}
            index={i}
            total={lessons.length}
            onMoveUp={() => move(i, 'up')}
            onMoveDown={() => move(i, 'down')}
            onDelete={() => setDeleteTarget(lesson)}
            onSaved={reload}
          />
        ))
      )}

      <AddLessonForm courseDocumentId={courseDocumentId} nextOrder={lessons.length + 1} onAdded={reload} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.title}"?`}
        description="This lesson will be permanently deleted."
        confirmLabel="Delete Lesson"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
