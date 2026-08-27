'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { api, ApiClientError } from '@/lib/api';
import { Button } from '@/components/ui/Button';

interface Props {
  courseDocumentId: string;
  courseSlug: string;
}

export function EnrollButton({ courseDocumentId, courseSlug }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [enrolling, setEnrolling] = React.useState(false);
  const [enrolled, setEnrolled] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Check if already enrolled
  React.useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get<{ data: unknown[] }>('/my-courses')
      .then((res) => {
        const enrolled = (res.data ?? []).some(
          (e: any) => e.course?.documentId === courseDocumentId
        );
        if (enrolled) setEnrolled(true);
      })
      .catch(() => {});
  }, [isAuthenticated, courseDocumentId]);

  if (isLoading) return <Button size="lg" fullWidth disabled>Loading…</Button>;

  // Not logged in → redirect to login with return URL
  if (!isAuthenticated) {
    return (
      <Button
        size="lg"
        fullWidth
        onClick={() => router.push(`/login?from=/courses/${courseSlug}`)}
      >
        Enroll now — it&apos;s free
      </Button>
    );
  }

  // Already enrolled → go to course
  if (enrolled) {
    return (
      <Button
        size="lg"
        fullWidth
        variant="secondary"
        onClick={() => router.push(`/learn/${courseSlug}`)}
      >
        Go to course →
      </Button>
    );
  }

  // Role check — only students (and authenticated) can enroll
  const role = user?.role?.type;
  if (role && !['student', 'authenticated'].includes(role)) {
    return (
      <Button size="lg" fullWidth disabled variant="secondary">
        Enrollment is for students
      </Button>
    );
  }

  async function handleEnroll() {
    setEnrolling(true);
    setError(null);
    try {
      await api.post('/enrollments', { data: { course: courseDocumentId } });
      setEnrolled(true);
      router.push(`/learn/${courseSlug}`);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        setEnrolled(true);
        router.push(`/learn/${courseSlug}`);
      } else {
        setError(err instanceof ApiClientError ? err.message : 'Enrollment failed. Please try again.');
      }
    } finally {
      setEnrolling(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
      <Button size="lg" fullWidth loading={enrolling} onClick={handleEnroll}>
        Enroll now — it&apos;s free
      </Button>
    </div>
  );
}
