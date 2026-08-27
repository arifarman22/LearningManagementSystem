import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BookOpen, User, Calendar, PlayCircle, ArrowLeft, Clock, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { EnrollButton } from '@/components/public/EnrollButton';
import type { Course, ApiListResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:1337';

function resolveUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

async function getCourse(slug: string): Promise<Course | null> {
  try {
    // Try by slug first
    const res = await api.get<ApiListResponse<Course>>(
      `/courses?filters[slug][$eq]=${encodeURIComponent(slug)}&populate[instructor]=true&populate[lessons]=true&populate[thumbnail]=true`,
      { token: null },
    );
    if (res.data?.[0]) return res.data[0];

    // Fallback: try by documentId
    const res2 = await api.get<ApiListResponse<Course>>(
      `/courses?filters[documentId][$eq]=${encodeURIComponent(slug)}&populate[instructor]=true&populate[lessons]=true&populate[thumbnail]=true`,
      { token: null },
    );
    return res2.data?.[0] ?? null;
  } catch {
    return null;
  }
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourse(slug);

  if (!course) notFound();

  const thumb = resolveUrl(course.thumbnail?.url);
  const lessons = course.lessons ?? [];
  const publishedAt = course.updatedAt
    ? new Date(course.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 no-underline mb-8 transition-colors"
      >
        <ArrowLeft size={15} />
        All courses
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero image */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-brand-100 to-brand-200">
            {thumb ? (
              <Image
                src={thumb}
                alt={course.thumbnail?.alternativeText ?? course.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle size={56} className="text-brand-400 opacity-50" />
              </div>
            )}
          </div>

          {/* Title + meta */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant={course.status === 'published' ? 'published' : 'draft'} dot>
                {course.status === 'published' ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 leading-tight">{course.title}</h1>

            <div className="mt-4 flex flex-wrap gap-5 text-sm text-neutral-500">
              {course.instructor && (
                <div className="flex items-center gap-1.5">
                  <User size={15} className="text-neutral-400" />
                  <span>{course.instructor.username}</span>
                </div>
              )}
              {lessons.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <BookOpen size={15} className="text-neutral-400" />
                  <span>{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</span>
                </div>
              )}
              {publishedAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={15} className="text-neutral-400" />
                  <span>Updated {publishedAt}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {course.description && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">About this course</h2>
              <p className="text-neutral-600 leading-relaxed whitespace-pre-line">{course.description}</p>
            </div>
          )}

          {/* Lessons */}
          {lessons.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                Course curriculum
                <span className="ml-2 text-sm font-normal text-neutral-400">({lessons.length} lessons)</span>
              </h2>
              <div className="rounded-xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
                {lessons
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((lesson, idx) => (
                    <div key={lesson.id} className="flex items-center gap-4 px-5 py-3.5 bg-white hover:bg-neutral-50 transition-colors">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-xs font-semibold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{lesson.title}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-400 shrink-0">
                        {lesson.videoUrl ? (
                          <PlayCircle size={15} />
                        ) : (
                          <Clock size={15} />
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar / Enrollment card ─────────────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-8 text-white text-center">
              <div className="text-3xl font-bold mb-1">Free</div>
              <p className="text-brand-200 text-sm">Enroll and start learning today</p>
            </div>

            <div className="p-6 space-y-4">
              {/* What's included */}
              <ul className="space-y-2.5">
                {[
                  `${lessons.length || 'Multiple'} on-demand lessons`,
                  'Full lifetime access',
                  'Access on any device',
                  'Progress tracking',
                  ...(course.lessons?.some((l) => l.videoUrl) ? ['Video content included'] : []),
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-neutral-700">
                    <CheckCircle size={15} className="text-success-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="pt-2 space-y-3">
                <EnrollButton courseDocumentId={course.documentId} courseSlug={slug} />
                <p className="text-center text-xs text-neutral-400">
                  Sign in or create an account to enroll
                </p>
              </div>

              {/* Instructor */}
              {course.instructor && (
                <div className="pt-4 border-t border-neutral-100">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Instructor</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-sm font-semibold">
                      {course.instructor.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{course.instructor.username}</p>
                      <p className="text-xs text-neutral-400">{course.instructor.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
