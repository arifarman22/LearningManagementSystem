'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Globe, EyeOff, Save } from 'lucide-react';
import { api, ApiClientError } from '@/lib/api';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { BlogPost } from '@/types';

interface BlogPostFormProps {
  initial?: Partial<BlogPost>;
  documentId?: string;
}

export function BlogPostForm({ initial, documentId }: BlogPostFormProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState(initial?.title ?? '');
  const [slug, setSlug] = React.useState(initial?.slug ?? '');
  const [body, setBody] = React.useState(initial?.body ?? '');
  const [coverImageUrl, setCoverImageUrl] = React.useState(
    initial?.coverImage && typeof initial.coverImage === 'object'
      ? (initial.coverImage as { url: string }).url ?? ''
      : '',
  );
  const [status] = React.useState<'draft' | 'published'>(initial?.status ?? 'draft');
  const [saving, setSaving] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!documentId && title) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  }, [title, documentId]);

  function validate() {
    const e: Record<string, string> = {};
    if (title.trim().length < 3) e.title = 'Title must be at least 3 characters';
    if (!body.trim()) e.body = 'Body is required';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save(targetStatus?: 'draft' | 'published') {
    if (!validate()) return;
    targetStatus ? setPublishing(true) : setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { title, slug, body };
      if (coverImageUrl.trim()) payload.coverImageUrl = coverImageUrl.trim();

      if (documentId) {
        await api.put(`/blog-posts/${documentId}`, { data: payload });
        if (targetStatus && targetStatus !== initial?.status) {
          await api.patch(`/blog-posts/${documentId}/${targetStatus === 'published' ? 'publish' : 'unpublish'}`, {});
        }
      } else {
        await api.post('/blog-posts', { data: { ...payload, status: targetStatus ?? 'draft' } });
      }
      router.push('/content/blog');
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Save failed');
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  }

  const isPublished = initial?.status === 'published';

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <Input
        label="Title"
        required
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Post title..."
        error={fieldErrors.title}
      />

      <Input
        label="Slug"
        value={slug}
        onChange={e => setSlug(e.target.value)}
        placeholder="url-friendly-slug"
        helperText="Auto-generated from title. Edit if needed."
      />

      <Input
        label="Cover Image URL"
        value={coverImageUrl}
        onChange={e => setCoverImageUrl(e.target.value)}
        placeholder="https://example.com/image.jpg"
        helperText="Optional. Paste a direct image URL."
      />

      {coverImageUrl.trim() && (
        <div className="rounded-xl overflow-hidden border border-neutral-200 h-44 bg-neutral-100">
          <img
            src={coverImageUrl}
            alt="Cover preview"
            className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      <Textarea
        label="Body"
        required
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Write your post content here..."
        rows={16}
        error={fieldErrors.body}
      />

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-100">
        <Button loading={saving} onClick={() => save()} leftIcon={<Save size={15} />}>
          Save Draft
        </Button>
        {!isPublished || !documentId ? (
          <Button
            variant="secondary"
            loading={publishing}
            onClick={() => save('published')}
            leftIcon={<Globe size={15} />}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            Save & Publish
          </Button>
        ) : (
          <Button
            variant="secondary"
            loading={publishing}
            onClick={() => save('draft')}
            leftIcon={<EyeOff size={15} />}
          >
            Unpublish
          </Button>
        )}
        <Button variant="ghost" onClick={() => router.push('/content/blog')}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
