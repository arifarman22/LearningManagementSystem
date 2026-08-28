import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, User } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Course, BlogPost } from '@/types';

// Deterministic Unsplash fallback images by keyword in title
const COURSE_IMAGES = [
  { k: ['javascript', 'js'],          url: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=640&q=75' },
  { k: ['react', 'next'],             url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=640&q=75' },
  { k: ['python', 'machine', 'data'], url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=640&q=75' },
  { k: ['ui', 'ux', 'design'],        url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=640&q=75' },
  { k: ['css', 'html', 'web'],        url: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=640&q=75' },
  { k: ['node', 'backend', 'api'],    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=640&q=75' },
];
const COURSE_DEFAULT = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=640&q=75';

const BLOG_IMAGES = [
  { k: ['consistent', 'learn', 'code'],  url: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=640&q=75' },
  { k: ['rest', 'graphql', 'api'],       url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=640&q=75' },
  { k: ['big o', 'notation', 'algo'],    url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=640&q=75' },
  { k: ['junior', 'developer', 'guide'], url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=640&q=75' },
  { k: ['css', 'grid', 'flexbox'],       url: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=640&q=75' },
  { k: ['what is', 'plain', 'english'],  url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=640&q=75' },
];
const BLOG_DEFAULT = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=640&q=75';

function getFallbackImage(title: string, map: typeof COURSE_IMAGES, def: string): string {
  const t = title.toLowerCase();
  return map.find(({ k }) => k.some(kw => t.includes(kw)))?.url ?? def;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:1337';

function resolveUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

// ── CourseCard ────────────────────────────────────────────────────────────────
export function CourseCard({ course, className }: { course: Course; className?: string }) {
  const thumb = resolveUrl(course.thumbnail?.url) ?? getFallbackImage(course.title, COURSE_IMAGES, COURSE_DEFAULT);
  const lessonCount = course.lessons?.length ?? 0;

  return (
    <Link
      href={`/courses/${course.slug ?? course.documentId}`}
      className={cn(
        'group flex flex-col rounded-xl border border-neutral-200 bg-white overflow-hidden',
        'shadow-sm hover:shadow-md transition-all duration-200 no-underline',
        className,
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={thumb}
          alt={course.thumbnail?.alternativeText ?? course.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3">
          <Badge variant={course.status === 'published' ? 'published' : 'draft'} dot size="sm">
            {course.status === 'published' ? 'Published' : 'Draft'}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-sm font-semibold text-neutral-900 leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors">
          {course.title}
        </h3>

        {course.description && (
          <p className="mt-2 text-xs text-neutral-500 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between gap-2">
          {course.instructor && (
            <div className="flex items-center gap-1.5 min-w-0">
              <User size={13} className="text-neutral-400 shrink-0" />
              <span className="text-xs text-neutral-500 truncate">{course.instructor.username}</span>
            </div>
          )}
          {lessonCount > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <BookOpen size={13} className="text-neutral-400" />
              <span className="text-xs text-neutral-500">{lessonCount} lesson{lessonCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CourseCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm', className)}>
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-3/4 rounded" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}

// ── BlogCard ──────────────────────────────────────────────────────────────────
export function BlogCard({ post, className }: { post: BlogPost; className?: string }) {
  const cover = resolveUrl(post.coverImageUrl) ?? getFallbackImage(post.title, BLOG_IMAGES, BLOG_DEFAULT);
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : null;
  const excerpt = post.body?.replace(/[#*`>\-_[\]()]/g, '').slice(0, 140).trim();

  return (
    <Link
      href={`/blog/${post.slug ?? post.documentId}`}
      className={cn(
        'group flex flex-col rounded-xl border border-neutral-200 bg-white overflow-hidden',
        'shadow-sm hover:shadow-md transition-all duration-200 no-underline',
        className,
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={cover}
          alt={post.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-sm font-semibold text-neutral-900 leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors">
          {post.title}
        </h3>
        {excerpt && (
          <p className="mt-2 text-xs text-neutral-500 line-clamp-3 leading-relaxed">{excerpt}…</p>
        )}
        <div className="mt-auto pt-4 flex items-center justify-between gap-2">
          {post.author && (
            <div className="flex items-center gap-1.5 min-w-0">
              <User size={13} className="text-neutral-400 shrink-0" />
              <span className="text-xs text-neutral-500 truncate">{post.author.username}</span>
            </div>
          )}
          {date && <span className="text-xs text-neutral-400 shrink-0">{date}</span>}
        </div>
      </div>
    </Link>
  );
}

export function BlogCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm', className)}>
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}
