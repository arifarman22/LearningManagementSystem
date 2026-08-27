import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, User, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import type { BlogPost, ApiListResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:1337';

function resolveUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    // Try by slug
    const res = await api.get<ApiListResponse<BlogPost>>(
      `/blog-posts/slug/${encodeURIComponent(slug)}?populate[author]=true&populate[coverImage]=true`,
      { token: null },
    );
    // getBySlug returns a single object wrapped in data
    const item = (res as unknown as { data: BlogPost })?.data ?? (res as unknown as BlogPost);
    if (item?.id) return item;
  } catch {
    // fall through to list lookup
  }

  try {
    const res = await api.get<ApiListResponse<BlogPost>>(
      `/blog-posts?filters[slug][$eq]=${encodeURIComponent(slug)}&filters[status]=published&populate[author]=true&populate[coverImage]=true`,
      { token: null },
    );
    return res.data?.[0] ?? null;
  } catch {
    return null;
  }
}

// Minimal markdown-to-HTML: bold, italic, headings, paragraphs, line breaks
function renderBody(body: string): string {
  return body
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-neutral-900 mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-neutral-900 mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-neutral-900 mt-8 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p class="mb-4 text-neutral-700 leading-relaxed">')
    .replace(/\n/g, '<br />')
    .replace(/^/, '<p class="mb-4 text-neutral-700 leading-relaxed">')
    .replace(/$/, '</p>');
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || post.status !== 'published') notFound();

  const cover = resolveUrl(post.coverImage?.url);
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 no-underline mb-8 transition-colors"
      >
        <ArrowLeft size={15} />
        All articles
      </Link>

      {/* Cover */}
      {cover && (
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-8 bg-neutral-100">
          <Image
            src={cover}
            alt={post.coverImage?.alternativeText ?? post.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight mb-5">
        {post.title}
      </h1>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-5 text-sm text-neutral-500 pb-8 border-b border-neutral-100 mb-8">
        {post.author && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold shrink-0">
              {post.author.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex items-center gap-1.5">
              <User size={13} className="text-neutral-400" />
              <span>{post.author.username}</span>
            </div>
          </div>
        )}
        {date && (
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-neutral-400" />
            <span>{date}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <article
        className="prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: renderBody(post.body ?? '') }}
      />

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-neutral-100">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 no-underline transition-colors"
        >
          <ArrowLeft size={15} />
          Back to all articles
        </Link>
      </div>
    </div>
  );
}
