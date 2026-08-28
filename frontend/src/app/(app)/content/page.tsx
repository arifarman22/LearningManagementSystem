'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BookOpen, FileText, Layers, Plus, ArrowUpRight, Edit3, PenLine, EyeOff,
} from 'lucide-react';
import { useAuth } from '@/store/auth';
import { useAllCourses, useAllBlogPosts } from '@/hooks/useContent';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

function StatCard({ label, value, sub, icon, accent }: {
  label: string; value: number | string; sub?: string;
  icon: React.ReactNode; accent: 'cyan' | 'blue' | 'emerald' | 'amber' | 'rose';
}) {
  const bars = { cyan: 'bg-brand-500', blue: 'bg-blue-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500' };
  const icons = { cyan: 'bg-brand-50 text-brand-600', blue: 'bg-blue-50 text-blue-600', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', rose: 'bg-rose-50 text-rose-600' };
  return (
    <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${bars[accent]}`} />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-neutral-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-neutral-400">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${icons[accent]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function ContentDashboardPage() {
  const { user } = useAuth();
  const { courses, loading: cLoading } = useAllCourses();
  const { posts, loading: pLoading } = useAllBlogPosts();

  const publishedCourses = courses.filter((c) => c.status === 'published').length;
  const draftCourses = courses.filter((c) => c.status === 'draft').length;
  const totalLessons = courses.reduce((s, c) => s + (c.lessons?.length ?? 0), 0);
  const publishedPosts = posts.filter((p) => p.status === 'published').length;
  const draftPosts = posts.filter((p) => p.status === 'draft').length;

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500">{greeting}, {user?.username} 👋</p>
          <h1 className="text-2xl font-bold text-neutral-900 mt-0.5">Content Manager</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" asChild leftIcon={<Plus size={14} />} size="sm">
            <Link href="/content/courses/new" className="no-underline">New Course</Link>
          </Button>
          <Button asChild leftIcon={<PenLine size={14} />} size="sm">
            <Link href="/content/blog/new" className="no-underline">New Post</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cLoading || pLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5">
              <Skeleton className="h-3 w-16 rounded mb-3" />
              <Skeleton className="h-7 w-12 rounded" />
            </div>
          ))
        ) : (
          <>
            <StatCard label="Total Courses" value={courses.length} sub={`${publishedCourses} published`} icon={<BookOpen size={17} />} accent="cyan" />
            <StatCard label="Draft Courses" value={draftCourses}   icon={<EyeOff size={17} />}           accent="amber" />
            <StatCard label="Total Lessons" value={totalLessons}   icon={<Layers size={17} />}           accent="blue" />
            <StatCard label="Blog Posts"    value={posts.length}   sub={`${publishedPosts} published`}   icon={<FileText size={17} />} accent="emerald" />
            <StatCard label="Draft Posts"   value={draftPosts}     icon={<PenLine size={17} />}          accent="rose" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide flex items-center gap-2">
              <BookOpen size={13} /> Recent Courses
            </p>
            <Link href="/content/courses" className="text-xs font-medium text-brand-600 hover:text-brand-700 no-underline flex items-center gap-1 group">
              View all <ArrowUpRight size={12} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            {cLoading ? (
              <div className="divide-y divide-neutral-100">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex-1"><Skeleton className="h-3.5 w-40 rounded mb-2" /><Skeleton className="h-3 w-24 rounded" /></div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <p className="text-sm text-neutral-400">No courses yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {courses.slice(0, 6).map((course) => (
                  <div key={course.documentId} className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <BookOpen size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">{course.title}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {course.lessons?.length ?? 0} lessons · {course.instructor?.username ?? 'No instructor'}
                      </p>
                    </div>
                    <Badge variant={course.status === 'published' ? 'published' : 'draft'} size="sm" dot>
                      {course.status}
                    </Badge>
                    <Button variant="ghost" size="xs" asChild>
                      <Link href={`/content/courses/${course.documentId}/edit`} className="no-underline">
                        <Edit3 size={13} />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Blog Posts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide flex items-center gap-2">
              <FileText size={13} /> Recent Posts
            </p>
            <Link href="/content/blog" className="text-xs font-medium text-brand-600 hover:text-brand-700 no-underline flex items-center gap-1 group">
              View all <ArrowUpRight size={12} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            {pLoading ? (
              <div className="divide-y divide-neutral-100">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex-1"><Skeleton className="h-3.5 w-40 rounded mb-2" /><Skeleton className="h-3 w-24 rounded" /></div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <p className="text-sm text-neutral-400">No posts yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {posts.slice(0, 6).map((post) => (
                  <div key={post.documentId} className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <FileText size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">{post.title}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{post.author?.username ?? 'Unknown'}</p>
                    </div>
                    <Badge variant={post.status === 'published' ? 'published' : 'draft'} size="sm" dot>
                      {post.status}
                    </Badge>
                    <Button variant="ghost" size="xs" asChild>
                      <Link href={`/content/blog/${post.documentId}/edit`} className="no-underline">
                        <Edit3 size={13} />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
