'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, CheckCircle, Clock, PlayCircle, User } from 'lucide-react';
import { useEnrollments } from '@/hooks/useEnrollments';
import { PageHeader } from '@/components/layout/AppShell';
import { Card, CardBody, CardFooter } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:1337';

function resolveUrl(url?: string | null) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

function CourseCardSkeleton() {
  return (
    <div className="card p-0 overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function MyLearningPage() {
  const { data: enrollments, loading, error, refetch } = useEnrollments();

  const active = enrollments.filter(({ progress }) => (progress?.percentage ?? 0) < 100);
  const done = enrollments.filter(({ progress }) => progress?.percentage === 100);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="My Learning"
        description={loading ? '' : `${enrollments.length} course${enrollments.length !== 1 ? 's' : ''} enrolled`}
      />

      {error && (
        <div className="mb-6 rounded-xl border border-danger-200 bg-danger-50 px-5 py-4 text-sm text-danger-700">
          {error} —{' '}
          <button onClick={refetch} className="underline font-medium">retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)}
        </div>
      ) : enrollments.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={28} />}
          title="You haven't enrolled in any courses yet"
          description="Browse the catalog and start learning today."
          action={
            <Button asChild>
              <Link href="/courses" className="no-underline">Browse courses</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-10">
          {/* In progress */}
          {active.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                In progress ({active.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {active.map(({ enrollment, progress }) => {
                  const course = enrollment.course!;
                  const thumb = resolveUrl(course.thumbnail?.url);
                  const lessonCount = course.lessons?.length ?? 0;
                  const href = `/learn/${course.slug ?? course.documentId}`;

                  return (
                    <Card key={enrollment.id} padding="none" className="overflow-hidden flex flex-col">
                      {/* Thumbnail */}
                      <Link href={href} className="no-underline block">
                        <div className="relative aspect-video bg-gradient-to-br from-brand-100 to-brand-200 overflow-hidden">
                          {thumb ? (
                            <Image src={thumb} alt={course.title} fill className="object-cover hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, 33vw" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <PlayCircle size={36} className="text-brand-400 opacity-60" />
                            </div>
                          )}
                        </div>
                      </Link>

                      <CardBody className="p-5 flex-1 flex flex-col">
                        <Link href={href} className="no-underline">
                          <h3 className="text-sm font-semibold text-neutral-900 leading-snug line-clamp-2 hover:text-brand-700 transition-colors mb-3">
                            {course.title}
                          </h3>
                        </Link>

                        {course.instructor && (
                          <div className="flex items-center gap-1.5 mb-3">
                            <User size={13} className="text-neutral-400" />
                            <span className="text-xs text-neutral-500">{course.instructor.username}</span>
                          </div>
                        )}

                        <div className="mt-auto">
                          <ProgressBar
                            value={progress?.percentage ?? 0}
                            size="sm"
                            color="brand"
                            showValue
                            label={`${progress?.completedLessons ?? 0} / ${progress?.totalLessons ?? lessonCount} lessons`}
                          />
                        </div>
                      </CardBody>

                      <CardFooter className="px-5 pb-5 pt-0 border-0 mt-0">
                        <Button asChild fullWidth size="sm">
                          <Link href={href} className="no-underline">
                            {(progress?.completedLessons ?? 0) === 0 ? 'Start learning' : 'Continue'}
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Completed */}
          {done.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                Completed ({done.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {done.map(({ enrollment, progress }) => {
                  const course = enrollment.course!;
                  const thumb = resolveUrl(course.thumbnail?.url);
                  const href = `/learn/${course.slug ?? course.documentId}`;

                  return (
                    <Card key={enrollment.id} padding="none" className="overflow-hidden flex flex-col opacity-90">
                      <Link href={href} className="no-underline block">
                        <div className="relative aspect-video bg-gradient-to-br from-success-100 to-success-200 overflow-hidden">
                          {thumb ? (
                            <Image src={thumb} alt={course.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <CheckCircle size={36} className="text-success-500 opacity-60" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <Badge variant="success" dot size="sm">Completed</Badge>
                          </div>
                        </div>
                      </Link>

                      <CardBody className="p-5 flex-1 flex flex-col">
                        <Link href={href} className="no-underline">
                          <h3 className="text-sm font-semibold text-neutral-900 leading-snug line-clamp-2 hover:text-brand-700 transition-colors mb-3">
                            {course.title}
                          </h3>
                        </Link>
                        <ProgressBar value={100} size="sm" color="success" showValue />
                        <p className="mt-1 text-xs text-neutral-400">{progress?.totalLessons} lessons completed</p>
                      </CardBody>

                      <CardFooter className="px-5 pb-5 pt-0 border-0 mt-0">
                        <Button asChild fullWidth size="sm" variant="secondary">
                          <Link href={href} className="no-underline">Review course</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
