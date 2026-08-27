'use client';

import * as React from 'react';
import Link from 'next/link';
import { BookOpen, FileText, Layers, Award, Plus, ArrowRight, Globe, EyeOff, Edit3, PenLine } from 'lucide-react';
import { useAuth } from '@/store/auth';
import { useAllCourses, useAllBlogPosts } from '@/hooks/useContent';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: number | string; sub?: string;
  icon: React.ReactNode; color: 'violet' | 'blue' | 'emerald' | 'amber' | 'rose';
}) {
  const colors = {
    violet: 'bg-violet-50 text-violet-600 border-violet-200',
    blue:   'bg-blue-50 text-blue-600 border-blue-200',
    emerald:'bg-emerald-50 text-emerald-600 border-emerald-200',
    amber:  'bg-amber-50 text-amber-600 border-amber-200',
    rose:   'bg-rose-50 text-rose-600 border-rose-200',
  };
  return (
    <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="mt-1.5 text-3xl font-bold text-neutral-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-neutral-400">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colors[color]}`}>
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

  const publishedCourses = courses.filter(c => c.status === 'published').length;
  const draftCourses = courses.filter(c => c.status === 'draft').length;
  const totalLessons = courses.reduce((s, c) => s + (c.lessons?.length ?? 0), 0);
  const publishedPosts = posts.filter(p => p.status === 'published').length;
  const draftPosts = posts.filter(p => p.status === 'draft').length;

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-500">{greeting}, {user?.username}</p>
          <h1 className="text-2xl font-bold text-neutral-900 mt-0.5">Content Manager</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" asChild leftIcon={<Plus size={15} />}>
            <Link href="/content/courses/new" className="no-underline">New Course</Link>
          </Button>
          <Button asChild leftIcon={<PenLine size={15} />}>
            <Link href="/content/blog/new" className="no-underline">New Post</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cLoading || pLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-neutral-200/60 bg-white p-6">
              <Skeleton className="h-4 w-20 rounded mb-2" />
              <Skeleton className="h-8 w-12 rounded" />
            </div>
          ))
        ) : (
          <>
            <StatCard label="Total Courses" value={courses.length} sub={`${publishedCourses} published`} icon={<BookOpen size={18} />} color="violet" />
            <StatCard label="Draft Courses" value={draftCourses} icon={<EyeOff size={18} />} color="amber" />
            <StatCard label="Total Lessons" value={totalLessons} icon={<Layers size={18} />} color="blue" />
            <StatCard label="Blog Posts" value={posts.length} sub={`${publishedPosts} published`} icon={<FileText size={18} />} color="emerald" />
            <StatCard label="Draft Posts" value={draftPosts} icon={<PenLine size={18} />} color="rose" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={14} /> Recent Courses
            </h2>
            <Link href="/content/courses" className="text-xs font-medium text-violet-600 hover:text-violet-700 no-underline flex items-center gap-1 group">
              View all <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="rounded-2xl border border-neutral-200/60 bg-white overflow-hidden">
            {cLoading ? (
              <div className="divide-y divide-neutral-100">
                {[0,1,2,3].map(i => <div key={i} className="px-5 py-4"><Skeleton className="h-5 w-full rounded" /></div>)}
              </div>
            ) : courses.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-neutral-400">No courses yet.</div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {courses.slice(0, 5).map(course => (
                  <div key={course.documentId} className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{course.title}</p>
                      <p className="text-xs text-neutral-400">{course.lessons?.length ?? 0} lessons · {course.instructor?.username ?? 'No instructor'}</p>
                    </div>
                    <Badge variant={course.status === 'published' ? 'published' : 'draft'} size="sm" dot>{course.status}</Badge>
                    <Button variant="ghost" size="xs" asChild>
                      <Link href={`/content/courses/${course.documentId}/edit`} className="no-underline"><Edit3 size={13} /></Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Recent Blog Posts */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} /> Recent Posts
            </h2>
            <Link href="/content/blog" className="text-xs font-medium text-violet-600 hover:text-violet-700 no-underline flex items-center gap-1 group">
              View all <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="rounded-2xl border border-neutral-200/60 bg-white overflow-hidden">
            {pLoading ? (
              <div className="divide-y divide-neutral-100">
                {[0,1,2,3].map(i => <div key={i} className="px-5 py-4"><Skeleton className="h-5 w-full rounded" /></div>)}
              </div>
            ) : posts.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-neutral-400">No posts yet.</div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {posts.slice(0, 5).map(post => (
                  <div key={post.documentId} className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{post.title}</p>
                      <p className="text-xs text-neutral-400">{post.author?.username ?? 'Unknown'}</p>
                    </div>
                    <Badge variant={post.status === 'published' ? 'published' : 'draft'} size="sm" dot>{post.status}</Badge>
                    <Button variant="ghost" size="xs" asChild>
                      <Link href={`/content/blog/${post.documentId}/edit`} className="no-underline"><Edit3 size={13} /></Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
