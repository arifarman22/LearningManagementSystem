'use client';

import * as React from 'react';
import { Search, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { BlogCard, BlogCardSkeleton } from '@/components/public/Cards';
import type { BlogPost, ApiListResponse } from '@/types';

const PAGE_SIZE = 9;

export default function BlogPage() {
  const [posts, setPosts] = React.useState<BlogPost[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');

  const debouncedSearch = useDebounce(search, 350);

  React.useEffect(() => { setPage(1); }, [debouncedSearch]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      'filters[status]': 'published',
      'populate[author]': 'true',
      'pagination[page]': String(page),
      'pagination[pageSize]': String(PAGE_SIZE),
      'sort': 'publishedAt:desc',
    });

    if (debouncedSearch.trim()) {
      params.set('filters[title][$containsi]', debouncedSearch.trim());
    }

    api.get<ApiListResponse<BlogPost>>(`/blog-posts?${params}`, { token: null })
      .then((res) => {
        if (cancelled) return;
        setPosts(res.data ?? []);
        setTotal(res.meta?.pagination?.total ?? 0);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? 'Failed to load posts');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [debouncedSearch, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900">Blog</h1>
        <p className="mt-2 text-neutral-500">
          {loading ? 'Loading…' : `${total} article${total !== 1 ? 's' : ''} published`}
        </p>
      </div>

      {/* Search */}
      <div className="mb-8 max-w-md">
        <Input
          placeholder="Search articles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftElement={<Search size={15} />}
          rightElement={
            search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-neutral-400 hover:text-neutral-600 text-xs font-medium"
              >
                Clear
              </button>
            ) : undefined
          }
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-5 py-4 text-sm text-danger-700 mb-8">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => <BlogCardSkeleton key={i} />)}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<FileText size={28} />}
          title={debouncedSearch ? 'No articles match your search' : 'No articles yet'}
          description={debouncedSearch ? 'Try a different keyword.' : 'Check back soon for new content.'}
          action={
            debouncedSearch ? (
              <Button variant="secondary" onClick={() => setSearch('')}>Clear search</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p) => <BlogCard key={p.id} post={p} />)}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-neutral-500 px-3">Page {page} of {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
