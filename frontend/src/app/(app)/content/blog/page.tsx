'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus, Search, Edit3, Trash2, Globe, EyeOff, FileText } from 'lucide-react';
import { useAllBlogPosts } from '@/hooks/useContent';
import { api, ApiClientError } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, TableLoading, TableEmpty } from '@/components/ui/Table';
import type { BlogPost } from '@/types';

type StatusFilter = 'all' | 'published' | 'draft';

export default function ContentBlogPage() {
  const { posts, loading, error, reload } = useAllBlogPosts();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [deleteTarget, setDeleteTarget] = React.useState<BlogPost | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const filtered = posts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.author?.username ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function togglePublish(post: BlogPost) {
    setActionLoading(post.documentId);
    setActionError(null);
    try {
      await api.patch(`/blog-posts/${post.documentId}/${post.status === 'published' ? 'unpublish' : 'publish'}`, {});
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
      await api.delete(`/blog-posts/${deleteTarget.documentId}`);
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
          <h1 className="text-2xl font-bold text-neutral-900">Blog Posts</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{posts.length} total · {posts.filter(p => p.status === 'published').length} published</p>
        </div>
        <Button asChild leftIcon={<Plus size={15} />}>
          <Link href="/content/blog/new" className="no-underline">New Post</Link>
        </Button>
      </div>

      {actionError && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{actionError}</div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input placeholder="Search by title or author..." value={search} onChange={e => setSearch(e.target.value)} leftElement={<Search size={15} />} />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1">
          {(['all', 'published', 'draft'] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${statusFilter === s ? 'bg-violet-600 text-white' : 'text-neutral-500 hover:text-neutral-700'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Title</TableHeaderCell>
            <TableHeaderCell>Author</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Published</TableHeaderCell>
            <TableHeaderCell>Created</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        {loading ? (
          <TableLoading cols={6} rows={5} />
        ) : filtered.length === 0 ? (
          <TableEmpty cols={6} icon={<FileText size={32} />} title={search || statusFilter !== 'all' ? 'No posts match your filters' : 'No posts yet'} description={!search && statusFilter === 'all' ? 'Create your first blog post.' : undefined} />
        ) : (
          <TableBody>
            {filtered.map(post => (
              <TableRow key={post.documentId} className="hover:bg-neutral-50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <FileText size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 truncate max-w-[220px]">{post.title}</p>
                      <p className="text-xs text-neutral-400 font-mono truncate max-w-[220px]">{post.slug}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-neutral-600">{post.author?.username ?? <span className="text-neutral-300 italic">Unknown</span>}</TableCell>
                <TableCell>
                  <Badge variant={post.status === 'published' ? 'published' : 'draft'} dot>{post.status}</Badge>
                </TableCell>
                <TableCell className="text-neutral-500 text-xs">
                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : <span className="text-neutral-300">—</span>}
                </TableCell>
                <TableCell className="text-neutral-500 text-xs">{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="xs" loading={actionLoading === post.documentId} onClick={() => togglePublish(post)} title={post.status === 'published' ? 'Unpublish' : 'Publish'}>
                      {post.status === 'published' ? <EyeOff size={14} /> : <Globe size={14} />}
                    </Button>
                    <Button variant="ghost" size="xs" asChild>
                      <Link href={`/content/blog/${post.documentId}/edit`} className="no-underline" title="Edit"><Edit3 size={14} /></Link>
                    </Button>
                    <Button variant="ghost" size="xs" className="text-rose-500 hover:bg-rose-50" onClick={() => setDeleteTarget(post)} title="Delete">
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
        description="This blog post will be permanently deleted."
        confirmLabel="Delete Post"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
