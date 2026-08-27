import * as React from 'react';
import { api, ApiClientError } from '@/lib/api';
import type { Course, Lesson, Quiz, Question, Option, Enrollment, QuizResult, ApiListResponse, ApiSingleResponse } from '@/types';

// ── Instructor courses ────────────────────────────────────────────────────────
export function useInstructorCourses() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiListResponse<Course>>(
        '/courses?populate[instructor]=true&populate[lessons]=true&pagination[pageSize]=100',
      );
      setCourses(res.data ?? []);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);
  return { courses, loading, error, reload: load };
}

// ── Single course ─────────────────────────────────────────────────────────────
export function useCourse(documentId: string) {
  const [course, setCourse] = React.useState<Course | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [forbidden, setForbidden] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    setForbidden(false);
    setError(null);
    try {
      const res = await api.get<ApiSingleResponse<Course>>(
        `/courses/${documentId}?populate[instructor]=true&populate[lessons]=true`,
      );
      setCourse(res.data);
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 403) setForbidden(true);
      else setError(e instanceof ApiClientError ? e.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  React.useEffect(() => { load(); }, [load]);
  return { course, loading, forbidden, error, reload: load };
}

// ── Lessons for a course ──────────────────────────────────────────────────────
export function useCourseLessons(courseDocumentId: string) {
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [forbidden, setForbidden] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!courseDocumentId) return;
    setLoading(true);
    setForbidden(false);
    setError(null);
    try {
      const res = await api.get<ApiListResponse<Lesson>>(
        `/lessons?filters[course][documentId][$eq]=${courseDocumentId}&sort=order:asc&pagination[pageSize]=100`,
      );
      setLessons(res.data ?? []);
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 403) setForbidden(true);
      else setError(e instanceof ApiClientError ? e.message : 'Failed to load lessons');
    } finally {
      setLoading(false);
    }
  }, [courseDocumentId]);

  React.useEffect(() => { load(); }, [load]);
  return { lessons, setLessons, loading, forbidden, error, reload: load };
}

// ── Quiz for a course ─────────────────────────────────────────────────────────
export function useCourseQuiz(courseDocumentId: string) {
  const [quiz, setQuiz] = React.useState<Quiz | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [forbidden, setForbidden] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!courseDocumentId) return;
    setLoading(true);
    setForbidden(false);
    setError(null);
    try {
      const res = await api.get<ApiListResponse<Quiz>>(
        `/quizzes?filters[course][documentId][$eq]=${courseDocumentId}&populate[questions][populate][options]=true&pagination[pageSize]=1`,
      );
      setQuiz(res.data?.[0] ?? null);
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 403) setForbidden(true);
      else setError(e instanceof ApiClientError ? e.message : 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  }, [courseDocumentId]);

  React.useEffect(() => { load(); }, [load]);
  return { quiz, loading, forbidden, error, reload: load };
}

// ── Enrollments for instructor's course ───────────────────────────────────────
export interface EnrollmentWithProgress {
  enrollment: Enrollment;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  quizResults: QuizResult[];
}

export function useCourseStudents(courseDocumentId: string, totalLessons: number) {
  const [students, setStudents] = React.useState<EnrollmentWithProgress[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [forbidden, setForbidden] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!courseDocumentId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setForbidden(false);
      setError(null);
      try {
        const res = await api.get<ApiListResponse<Enrollment>>(
          `/enrollments?filters[course][documentId]=${courseDocumentId}&populate[student]=true&populate[course]=true&pagination[pageSize]=100`,
        );
        const enrollments = res.data ?? [];

        const withProgress = await Promise.all(
          enrollments.map(async (enrollment) => {
            try {
              const [progressRes, quizRes] = await Promise.all([
                api.get<{ completedLessons: number; totalLessons: number; percentage: number }>(
                  `/lesson-progress/course-progress?courseId=${courseDocumentId}&studentId=${enrollment.student?.id}`,
                ).catch(() => ({ completedLessons: 0, totalLessons, percentage: 0 })),
                api.get<ApiListResponse<QuizResult>>(
                  `/quiz-results?filters[student][id]=${enrollment.student?.id}&populate[quiz]=true&pagination[pageSize]=10`,
                ).catch(() => ({ data: [] as QuizResult[] })),
              ]);
              return {
                enrollment,
                completedLessons: progressRes.completedLessons ?? 0,
                totalLessons: progressRes.totalLessons ?? totalLessons,
                percentage: progressRes.percentage ?? 0,
                quizResults: quizRes.data ?? [],
              };
            } catch {
              return { enrollment, completedLessons: 0, totalLessons, percentage: 0, quizResults: [] };
            }
          }),
        );

        if (!cancelled) setStudents(withProgress);
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiClientError && e.status === 403) setForbidden(true);
          else setError(e instanceof ApiClientError ? e.message : 'Failed to load students');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [courseDocumentId, totalLessons]);

  return { students, loading, forbidden, error };
}
