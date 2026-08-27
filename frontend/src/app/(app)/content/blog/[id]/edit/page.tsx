'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe, EyeOff } from 'lucide-react';
import { useBlogPost } from '@/hooks/useContent';
import { BlogPostForm } from '@/components/content/BlogPostForm';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ContentEditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { post, loading, forbidden, error } = useBlogPost(id);

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-6 w-32 rounded" />
        <Skeleton className="h-8 w-64 rounded" />
        <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 space-y-4">
          {[0,1,2,3,4].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (forbidden) return (
    <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
      You can only edit your own blog posts.
    </div>
  );

  if (error || !post) return (
    <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
      {error ?? 'Post not found'}
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/content/blog" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 no-underline mb-4">
          <ArrowLeft size={15} /> Back to posts
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-neutral-900 truncate">{post.title}</h1>
          <Badge variant={post.status === 'published' ? 'published' : 'draft'} dot>
            {post.status}
          </Badge>
        </div>
        <p className="text-sm text-neutral-500 mt-1">
          By {post.author?.username ?? 'Unknown'}
          {post.publishedAt && ` · Published ${new Date(post.publishedAt).toLocaleDateString()}`}
        </p>
      </div>
      <div className="rounded-2xl border border-neutral-200/60 bg-white p-6">
        <BlogPostForm initial={post} documentId={id} />
      </div>
    </div>
  );
}
