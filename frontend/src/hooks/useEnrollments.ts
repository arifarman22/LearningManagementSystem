'use client';

import * as React from 'react';
import { api } from '@/lib/api';
import type { Enrollment, CourseProgress, ApiListResponse } from '@/types';

export interface EnrollmentWithProgress {
  enrollment: Enrollment;
  progress: CourseProgress | null;
}

export function useEnrollments() {
  const [data, setData] = React.useState<EnrollmentWithProgress[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiListResponse<Enrollment>>('/my-courses');
      const enrollments = res.data ?? [];

      // Fetch progress for each enrolled course in parallel
      const withProgress = await Promise.all(
        enrollments.map(async (enrollment) => {
          const courseDocId = enrollment.course?.documentId;
          if (!courseDocId) return { enrollment, progress: null };
          try {
            const prog = await api.get<CourseProgress>(
              `/lesson-progress/course-progress?course=${courseDocId}`,
            );
            return { enrollment, progress: prog };
          } catch {
            return { enrollment, progress: null };
          }
        }),
      );

      setData(withProgress);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load };
}
