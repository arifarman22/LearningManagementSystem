'use client';

import * as React from 'react';
import { Award, BookOpen, HelpCircle, BarChart2 } from 'lucide-react';
import { api, ApiClientError } from '@/lib/api';
import { PageHeader } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, TableLoading, TableEmpty } from '@/components/ui/Table';
import type { Quiz, ApiListResponse } from '@/types';

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = React.useState<Quiz[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api.get<ApiListResponse<Quiz>>(
      '/quizzes?populate[course]=true&populate[questions][populate][options]=true&pagination[pageSize]=100',
    )
      .then((r) => setQuizzes(r.data ?? []))
      .catch((e) => setError(e instanceof ApiClientError ? e.message : 'Failed to load quizzes'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quizzes"
        description={`${quizzes.length} quizzes across all courses`}
      />

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      <div className="rounded-2xl border border-neutral-200/60 bg-white overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Quiz</TableHeaderCell>
              <TableHeaderCell>Course</TableHeaderCell>
              <TableHeaderCell>Questions</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
            </TableRow>
          </TableHead>
          {loading ? (
            <TableBody><TableLoading cols={4} rows={5} /></TableBody>
          ) : quizzes.length === 0 ? (
            <TableBody><TableEmpty cols={4} icon={<Award size={32} />} title="No quizzes yet" /></TableBody>
          ) : (
            <TableBody>
              {quizzes.map((quiz) => (
                <TableRow key={quiz.documentId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                        <Award size={15} />
                      </div>
                      <p className="font-medium text-neutral-900">{quiz.title}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                      <BookOpen size={13} className="text-neutral-400" />
                      {quiz.course?.title ?? <span className="text-neutral-300 italic">No course</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                      <HelpCircle size={13} className="text-neutral-400" />
                      {quiz.questions?.length ?? 0} questions
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-neutral-500">
                    {new Date(quiz.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>
    </div>
  );
}
