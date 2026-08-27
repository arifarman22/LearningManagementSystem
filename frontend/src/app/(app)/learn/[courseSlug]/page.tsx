'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle, Circle, ChevronLeft, ChevronRight, Menu, X,
  PlayCircle, FileText, BookOpen, ArrowLeft, ClipboardList,
} from 'lucide-react';
import { api, ApiClientError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import type { Course, Lesson, LessonProgress, CourseProgress, Quiz, ApiListResponse } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────
interface LessonWithProgress extends Lesson {
  progressRecord?: LessonProgress;
  completed: boolean;
}

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadCourse(slug: string): Promise<Course | null> {
  try {
    // Try slug-based lookup, then re-fetch via documentId to get lessons populated
    const res = await api.get<ApiListResponse<Course>>(
      `/courses?filters[slug][$eq]=${encodeURIComponent(slug)}`,
    );
    const found = res.data?.[0];
    if (found) {
      const full = await api.get<{ data: Course }>(`/courses/${found.documentId}`);
      return full.data ?? found;
    }
  } catch {}
  try {
    // Fallback: treat as documentId directly
    const res = await api.get<{ data: Course }>(`/courses/${encodeURIComponent(slug)}`);
    if (res.data) return res.data;
  } catch {}
  return null;
}

async function loadProgress(courseDocId: string): Promise<{ lessonProgress: LessonProgress[]; courseProgress: CourseProgress | null }> {
  try {
    const [lpRes, cpRes] = await Promise.all([
      api.get<ApiListResponse<LessonProgress>>(
        `/lesson-progress?filters[lesson][course][documentId][$eq]=${courseDocId}&populate[lesson]=true&pagination[pageSize]=100`,
      ),
      api.get<CourseProgress>(`/lesson-progress/course-progress?course=${courseDocId}`),
    ]);
    return { lessonProgress: lpRes.data ?? [], courseProgress: cpRes };
  } catch {
    return { lessonProgress: [], courseProgress: null };
  }
}

async function loadLesson(lessonDocId: string): Promise<Lesson | null> {
  try {
    const res = await api.get<{ data: Lesson }>(`/lessons/${lessonDocId}`);
    return res.data ?? null;
  } catch { return null; }
}

async function loadQuizForCourse(courseDocId: string): Promise<Quiz | null> {
  try {
    const res = await api.get<ApiListResponse<Quiz>>(
      `/quizzes?filters[course][documentId][$eq]=${courseDocId}&pagination[pageSize]=1`,
    );
    return res.data?.[0] ?? null;
  } catch { return null; }
}

// ── Lesson content ────────────────────────────────────────────────────────────
function VideoEmbed({ url }: { url: string }) {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) {
    return (
      <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Lesson video"
        />
      </div>
    );
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return (
      <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          title="Lesson video"
        />
      </div>
    );
  }
  // Direct video file
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) {
    return (
      <video controls className="w-full rounded-xl bg-black" src={url}>
        Your browser does not support video playback.
      </video>
    );
  }
  // Fallback link
  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-5 py-4">
      <PlayCircle size={20} className="text-brand-600 shrink-0" />
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-700 hover:underline">
        Open video in new tab
      </a>
    </div>
  );
}

function LessonBody({ lesson }: { lesson: Lesson }) {
  if (!lesson.content && !lesson.videoUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText size={40} className="text-neutral-300 mb-3" />
        <p className="text-neutral-500 text-sm">No content for this lesson yet.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {lesson.videoUrl && <VideoEmbed url={lesson.videoUrl} />}
      {lesson.content && (
        <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed whitespace-pre-line">
          {lesson.content}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function LearnPageInner() {
  const params = useParams<{ courseSlug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [course, setCourse] = React.useState<Course | null>(null);
  const [lessons, setLessons] = React.useState<LessonWithProgress[]>([]);
  const [courseProgress, setCourseProgress] = React.useState<CourseProgress | null>(null);
  const [currentLesson, setCurrentLesson] = React.useState<Lesson | null>(null);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [quiz, setQuiz] = React.useState<Quiz | null>(null);
  const [pageLoading, setPageLoading] = React.useState(true);
  const [lessonLoading, setLessonLoading] = React.useState(false);
  const [markingComplete, setMarkingComplete] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Initial load
  React.useEffect(() => {
    let cancelled = false;
    async function init() {
      setPageLoading(true);
      const c = await loadCourse(params.courseSlug);
      if (cancelled) return;
      if (!c) { setError('Course not found.'); setPageLoading(false); return; }

      const sortedLessons = (c.lessons ?? []).slice().sort((a, b) => a.order - b.order);
      const { lessonProgress, courseProgress: cp } = await loadProgress(c.documentId);
      if (cancelled) return;

      const withProgress: LessonWithProgress[] = sortedLessons.map((l) => {
        const rec = lessonProgress.find((lp) => lp.lesson?.documentId === l.documentId || lp.lesson?.id === l.id);
        return { ...l, progressRecord: rec, completed: rec?.completed ?? false };
      });

      setCourse(c);
      setLessons(withProgress);
      setCourseProgress(cp);

      // Determine starting lesson: from URL param, or first incomplete, or first
      const lessonParam = searchParams.get('lesson');
      let startIdx = 0;
      if (lessonParam) {
        const idx = withProgress.findIndex((l) => l.documentId === lessonParam || String(l.id) === lessonParam);
        if (idx >= 0) startIdx = idx;
      } else {
        const firstIncomplete = withProgress.findIndex((l) => !l.completed);
        startIdx = firstIncomplete >= 0 ? firstIncomplete : 0;
      }

      setCurrentIdx(startIdx);

      // Load full lesson content
      if (withProgress[startIdx]) {
        const full = await loadLesson(withProgress[startIdx].documentId);
        if (!cancelled) setCurrentLesson(full ?? withProgress[startIdx]);
      }

      // Load quiz
      const q = await loadQuizForCourse(c.documentId);
      if (!cancelled) setQuiz(q);

      setPageLoading(false);
    }
    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.courseSlug]);

  const switchLesson = React.useCallback(async (idx: number) => {
    if (idx < 0 || idx >= lessons.length) return;
    setSidebarOpen(false);
    setLessonLoading(true);
    setCurrentIdx(idx);
    const full = await loadLesson(lessons[idx].documentId);
    setCurrentLesson(full ?? lessons[idx]);
    setLessonLoading(false);
  }, [lessons]);

  const markComplete = async () => {
    const lesson = lessons[currentIdx];
    if (!lesson || lesson.completed || markingComplete) return;
    setMarkingComplete(true);
    try {
      await api.post('/lesson-progress', {
        data: { lesson: lesson.documentId, completed: true },
      });
      // Update local state
      setLessons((prev) => prev.map((l, i) => i === currentIdx ? { ...l, completed: true } : l));
      // Refresh course progress
      if (course) {
        const cp = await api.get<CourseProgress>(`/lesson-progress/course-progress?course=${course.documentId}`);
        setCourseProgress(cp);
      }
      // Auto-advance to next lesson
      if (currentIdx < lessons.length - 1) {
        setTimeout(() => switchLesson(currentIdx + 1), 600);
      }
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        // Already marked — update local state silently
        setLessons((prev) => prev.map((l, i) => i === currentIdx ? { ...l, completed: true } : l));
      }
    } finally {
      setMarkingComplete(false);
    }
  };

  if (pageLoading) return <LearnPageSkeleton />;
  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-neutral-500">{error ?? 'Course not found.'}</p>
        <Button variant="secondary" asChild>
          <Link href="/my-learning" className="no-underline">Back to My Learning</Link>
        </Button>
      </div>
    );
  }

  const lesson = currentLesson ?? lessons[currentIdx];
  const isCompleted = lessons[currentIdx]?.completed ?? false;
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < lessons.length - 1;

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.75rem)] -m-6">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 bg-white shrink-0">
        <Link href="/my-learning" className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 no-underline transition-colors shrink-0">
          <ArrowLeft size={15} />
          <span className="hidden sm:inline">My Learning</span>
        </Link>
        <div className="h-4 w-px bg-neutral-200 shrink-0" />
        <p className="text-sm font-semibold text-neutral-900 truncate flex-1">{course.title}</p>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <ProgressBar value={courseProgress?.percentage ?? 0} size="sm" className="w-24" />
          <span className="text-xs text-neutral-500 whitespace-nowrap">
            {courseProgress?.completedLessons ?? 0}/{courseProgress?.totalLessons ?? lessons.length}
          </span>
        </div>
        {quiz && (
          <Button size="xs" variant="secondary" asChild className="shrink-0 hidden sm:flex">
            <Link href={`/learn/${params.courseSlug}/quiz/${quiz.documentId}`} className="no-underline flex items-center gap-1.5">
              <ClipboardList size={13} />
              Take quiz
            </Link>
          </Button>
        )}
        {/* Mobile sidebar toggle */}
        <button
          className="flex md:hidden items-center justify-center w-8 h-8 rounded-lg text-neutral-500 hover:bg-neutral-100 shrink-0"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Toggle lesson list"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Lesson sidebar ───────────────────────────────────────────── */}
        <aside className={cn(
          'flex-col w-72 border-r border-neutral-200 bg-white overflow-y-auto shrink-0',
          'hidden md:flex',
          // Mobile overlay
          sidebarOpen && 'fixed inset-y-0 left-0 z-40 flex w-72 pt-[3.75rem] shadow-xl',
        )}>
          <div className="px-4 py-3 border-b border-neutral-100">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
            </p>
            <ProgressBar
              value={courseProgress?.percentage ?? 0}
              size="xs"
              className="mt-2"
              showValue
            />
          </div>

          <nav className="flex-1 py-2">
            {lessons.map((l, idx) => (
              <button
                key={l.id}
                onClick={() => switchLesson(idx)}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                  idx === currentIdx
                    ? 'bg-brand-50 border-r-2 border-brand-600'
                    : 'hover:bg-neutral-50',
                )}
              >
                <span className="shrink-0 mt-0.5">
                  {l.completed
                    ? <CheckCircle size={16} className="text-success-500" />
                    : <Circle size={16} className={idx === currentIdx ? 'text-brand-500' : 'text-neutral-300'} />
                  }
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-xs font-medium leading-snug line-clamp-2',
                    idx === currentIdx ? 'text-brand-700' : l.completed ? 'text-neutral-500' : 'text-neutral-700',
                  )}>
                    {idx + 1}. {l.title}
                  </p>
                  {l.videoUrl && (
                    <span className="text-2xs text-neutral-400 flex items-center gap-1 mt-0.5">
                      <PlayCircle size={10} /> Video
                    </span>
                  )}
                </div>
              </button>
            ))}

            {quiz && (
              <Link
                href={`/learn/${params.courseSlug}/quiz/${quiz.documentId}`}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 no-underline transition-colors hover:bg-neutral-50',
                  'border-t border-neutral-100 mt-1',
                )}
              >
                <ClipboardList size={16} className="text-brand-500 shrink-0" />
                <span className="text-xs font-medium text-brand-700">Course Quiz</span>
                <Badge variant="brand" size="sm" className="ml-auto">Quiz</Badge>
              </Link>
            )}
          </nav>
        </aside>

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Main content ─────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
            {lessonLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-2/3 rounded" />
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
                <Skeleton className="h-4 w-4/6 rounded" />
              </div>
            ) : lesson ? (
              <div className="space-y-6">
                {/* Lesson header */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-neutral-400">
                      Lesson {currentIdx + 1} of {lessons.length}
                    </span>
                    {isCompleted && (
                      <Badge variant="success" dot size="sm">Completed</Badge>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">{lesson.title}</h1>
                </div>

                {/* Content */}
                <LessonBody lesson={lesson} />

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-neutral-100">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!hasPrev}
                    onClick={() => switchLesson(currentIdx - 1)}
                    leftIcon={<ChevronLeft size={15} />}
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-3 justify-center">
                    {!isCompleted ? (
                      <Button
                        size="sm"
                        loading={markingComplete}
                        onClick={markComplete}
                        leftIcon={<CheckCircle size={15} />}
                      >
                        Mark complete
                      </Button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm text-success-600 font-medium">
                        <CheckCircle size={15} />
                        Completed
                      </span>
                    )}
                  </div>

                  <Button
                    variant={hasNext ? 'primary' : 'secondary'}
                    size="sm"
                    disabled={!hasNext}
                    onClick={() => switchLesson(currentIdx + 1)}
                    rightIcon={<ChevronRight size={15} />}
                  >
                    Next
                  </Button>
                </div>

                {/* Course complete banner */}
                {courseProgress?.percentage === 100 && (
                  <div className="rounded-xl bg-success-50 border border-success-200 px-5 py-4 flex items-center gap-3">
                    <CheckCircle size={20} className="text-success-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-success-800">Course complete! 🎉</p>
                      <p className="text-xs text-success-600 mt-0.5">You've finished all lessons in this course.</p>
                    </div>
                    {quiz && (
                      <Button size="xs" asChild className="ml-auto shrink-0">
                        <Link href={`/learn/${params.courseSlug}/quiz/${quiz.documentId}`} className="no-underline">
                          Take quiz
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <BookOpen size={40} className="text-neutral-300 mb-3" />
                <p className="text-neutral-500 text-sm">Select a lesson to begin.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function LearnPage() {
  return (
    <React.Suspense fallback={<LearnPageSkeleton />}>
      <LearnPageInner />
    </React.Suspense>
  );
}

function LearnPageSkeleton() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.75rem)] -m-6">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 bg-white">
        <Skeleton className="h-5 w-24 rounded" />
        <Skeleton className="h-5 flex-1 rounded" />
      </div>
      <div className="flex flex-1">
        <div className="hidden md:block w-72 border-r border-neutral-200 bg-white p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
        </div>
        <div className="flex-1 p-8 space-y-4 max-w-3xl">
          <Skeleton className="h-6 w-1/3 rounded" />
          <Skeleton className="h-7 w-2/3 rounded" />
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
        </div>
      </div>
    </div>
  );
}
