'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BlogPostForm } from '@/components/content/BlogPostForm';

export default function ContentNewBlogPostPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/content/blog" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 no-underline mb-4">
          <ArrowLeft size={15} /> Back to posts
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">New Blog Post</h1>
        <p className="text-sm text-neutral-500 mt-1">Write and publish a new article.</p>
      </div>
      <div className="rounded-2xl border border-neutral-200/60 bg-white p-6">
        <BlogPostForm />
      </div>
    </div>
  );
}
