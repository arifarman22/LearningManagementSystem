'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle, XCircle, ArrowLeft, RotateCcw, Trophy, AlertCircle } from 'lucide-react';
import { api, ApiClientError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { Quiz, QuizResult, QuizAnswers, ApiListResponse } from '@/types';

// ── Data ──────────────────────────────────────────────────────────────────────
async function loadQuiz(quizDocId: string): Promise<Quiz | null> {
  try {
    const res = await api.get<{ data: Quiz }>(
      `/quizzes/${quizDocId}?populate[questions][populate][options]=true&populate[course]=true`,
    );
    return res.data ?? null;
  } catch { return null; }
}

async function loadPreviousResult(quizDocId: string): Promise<QuizResult | null> {
  try {
    const res = await api.get<ApiListResponse<QuizResult>>(
      `/quiz-results?filters[quiz][documentId][$eq]=${encodeURIComponent(quizDocId)}&populate[quiz]=true&sort=submittedAt:desc&pagination[pageSize]=1`,
    );
    return res.data?.[0] ?? null;
  } catch { return null; }
}

// ── Score helpers ─────────────────────────────────────────────────────────────
function scoreLabel(score: number) {
  if (score === 100) return { label: 'Perfect!', color: 'text-success-700', bg: 'bg-success-50 border-success-200' };
  if (score >= 80)  return { label: 'Excellent!', color: 'text-success-700', bg: 'bg-success-50 border-success-200' };
  if (score >= 60)  return { label: 'Good job!', color: 'text-warning-700', bg: 'bg-warning-50 border-warning-200' };
  if (score >= 40)  return { label: 'Keep trying!', color: 'text-warning-700', bg: 'bg-warning-50 border-warning-200' };
  return { label: 'Needs work', color: 'text-danger-700', bg: 'bg-danger-50 border-danger-200' };
}

// ── Result view ───────────────────────────────────────────────────────────────
function QuizResultView({
  result,
  quizTitle,
  courseSlug,
  onRetry,
  isPrevious,
}: {
  result: QuizResult;
  quizTitle: string;
  courseSlug: string;
  onRetry: () => void;
  isPrevious?: boolean;
}) {
  const pct = Math.round(Number(result.score) || 0);
  const correct = Number(result.correctAnswers) || 0;
  const total = Number(result.totalQuestions) || 0;
  const { label, color, bg } = scoreLabel(pct);

  return (
    <div className="max-w-lg mx-auto animate-fade-up">
      <div className={cn('rounded-2xl border p-8 text-center', bg)}>
        <div className="flex justify-center mb-4">
          {pct >= 60
            ? <Trophy size={48} className="text-warning-500" />
            : <AlertCircle size={48} className="text-danger-400" />
          }
        </div>
        <h2 className={cn('text-2xl font-bold mb-1', color)}>{label}</h2>
        <p className="text-neutral-500 text-sm mb-6">{quizTitle}</p>

        <div className="text-5xl font-bold text-neutral-900 mb-2">{pct}%</div>
        <ProgressBar
          value={pct}
          size="lg"
          color={pct >= 80 ? 'success' : pct >= 60 ? 'warning' : 'danger'}
          className="mb-4"
        />

        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-success-600 mb-1">
              <CheckCircle size={16} />
              <span className="text-lg font-bold">{correct}</span>
            </div>
            <p className="text-xs text-neutral-500">Correct</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-danger-500 mb-1">
              <XCircle size={16} />
              <span className="text-lg font-bold">{total - correct}</span>
            </div>
            <p className="text-xs text-neutral-500">Incorrect</p>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-neutral-700 mb-1">{total}</div>
            <p className="text-xs text-neutral-500">Total</p>
          </div>
        </div>

        {isPrevious && (
          <p className="text-xs text-neutral-400 mb-4">
            Submitted {new Date(result.submittedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button variant="secondary" asChild fullWidth>
          <Link href={`/learn/${courseSlug}`} className="no-underline flex items-center gap-2">
            <ArrowLeft size={15} />
            Back to course
          </Link>
        </Button>
        {isPrevious && (
          <Button fullWidth onClick={onRetry} leftIcon={<RotateCcw size={15} />}>
            Retake quiz
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Quiz taking view ──────────────────────────────────────────────────────────
type QuizPhase = 'loading' | 'previous-result' | 'taking' | 'submitting' | 'result' | 'error';

export default function QuizPage() {
  const params = useParams<{ courseSlug: string; quizId: string }>();

  const [phase, setPhase] = React.useState<QuizPhase>('loading');
  const [quiz, setQuiz] = React.useState<Quiz | null>(null);
  const [previousResult, setPreviousResult] = React.useState<QuizResult | null>(null);
  const [result, setResult] = React.useState<QuizResult | null>(null);
  const [answers, setAnswers] = React.useState<QuizAnswers>({});
  const [currentQ, setCurrentQ] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function init() {
      const [q, prev] = await Promise.all([
        loadQuiz(params.quizId),
        loadPreviousResult(params.quizId),
      ]);
      if (!q) { setPhase('error'); setError('Quiz not found.'); return; }
      setQuiz(q);
      if (prev) {
        setPreviousResult(prev);
        setPhase('previous-result');
      } else {
        setPhase('taking');
      }
    }
    init();
  }, [params.quizId]);

  const questions = React.useMemo(
    () => (quiz?.questions ?? []).slice().sort((a, b) => a.order - b.order),
    [quiz],
  );

  const startFresh = () => {
    setAnswers({});
    setCurrentQ(0);
    setResult(null);
    setPhase('taking');
  };

  const selectOption = (questionId: number, optionId: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const submit = async () => {
    if (!quiz) return;
    setPhase('submitting');
    try {
      const res = await api.post<{ data: QuizResult }>('/quiz-results/submit', {
        quizId: quiz.id,
        quizDocumentId: quiz.documentId,
        answers,
      });
      setResult(res.data);
      setPhase('result');
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        // Already submitted — load the existing result
        const prev = await loadPreviousResult(params.quizId);
        if (prev) { setResult(prev); setPhase('result'); }
        else { setError('Already submitted. Reload to see your result.'); setPhase('error'); }
      } else {
        setError(err instanceof Error ? err.message : 'Submission failed.');
        setPhase('error');
      }
    }
  };

  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const q = questions[currentQ];

  // ── Render ────────────────────────────────────────────────────────────────
  if (phase === 'loading') return <QuizSkeleton />;

  if (phase === 'error') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <p className="text-neutral-500 mb-4">{error ?? 'Something went wrong.'}</p>
        <Button variant="secondary" asChild>
          <Link href={`/learn/${params.courseSlug}`} className="no-underline">Back to course</Link>
        </Button>
      </div>
    );
  }

  if (phase === 'previous-result' && previousResult) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href={`/learn/${params.courseSlug}`} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 no-underline transition-colors">
            <ArrowLeft size={15} /> Back to course
          </Link>
        </div>
        <h1 className="text-xl font-bold text-neutral-900 mb-6">{quiz?.title}</h1>
        <QuizResultView
          result={previousResult}
          quizTitle={quiz?.title ?? ''}
          courseSlug={params.courseSlug}
          onRetry={startFresh}
          isPrevious
        />
      </div>
    );
  }

  if (phase === 'result' && result) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-xl font-bold text-neutral-900 mb-6">{quiz?.title}</h1>
        <QuizResultView
          result={result}
          quizTitle={quiz?.title ?? ''}
          courseSlug={params.courseSlug}
          onRetry={startFresh}
        />
      </div>
    );
  }

  if ((phase === 'taking' || phase === 'submitting') && quiz && q) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-up">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/learn/${params.courseSlug}`} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 no-underline transition-colors mb-4">
            <ArrowLeft size={15} /> Back to course
          </Link>
          <h1 className="text-xl font-bold text-neutral-900">{quiz.title}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {answeredCount} of {questions.length} answered
          </p>
        </div>

        {/* Progress */}
        <ProgressBar
          value={answeredCount}
          max={questions.length}
          size="sm"
          color="brand"
          className="mb-6"
        />

        {/* Question tabs (small screens: counter; large: dots) */}
        <div className="flex items-center gap-1.5 mb-6 flex-wrap">
          {questions.map((question, idx) => (
            <button
              key={question.id}
              onClick={() => setCurrentQ(idx)}
              className={cn(
                'w-8 h-8 rounded-full text-xs font-semibold transition-colors',
                idx === currentQ
                  ? 'bg-brand-600 text-white'
                  : answers[question.id] !== undefined
                    ? 'bg-success-100 text-success-700'
                    : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200',
              )}
              aria-label={`Question ${idx + 1}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Question card */}
        <div className="card p-6 mb-6">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Question {currentQ + 1} of {questions.length}
          </p>
          <p className="text-base font-semibold text-neutral-900 leading-relaxed mb-5">{q.text}</p>

          <div className="space-y-2.5">
            {(q.options ?? []).map((opt) => {
              const selected = answers[q.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => selectOption(q.id, opt.id)}
                  disabled={phase === 'submitting'}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    selected
                      ? 'border-brand-500 bg-brand-50 text-brand-800 font-medium'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-brand-300 hover:bg-brand-50/50',
                    phase === 'submitting' && 'opacity-60 cursor-not-allowed',
                  )}
                >
                  <span className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    selected ? 'border-brand-600 bg-brand-600' : 'border-neutral-300',
                  )}>
                    {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                  {opt.text}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={currentQ === 0}
            onClick={() => setCurrentQ((i) => i - 1)}
            leftIcon={<ArrowLeft size={15} />}
          >
            Previous
          </Button>

          {currentQ < questions.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setCurrentQ((i) => i + 1)}
            >
              Next question
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={!allAnswered}
              loading={phase === 'submitting'}
              onClick={submit}
            >
              {allAnswered ? 'Submit quiz' : `${questions.length - answeredCount} unanswered`}
            </Button>
          )}
        </div>

        {/* Submit from any question if all answered */}
        {allAnswered && currentQ < questions.length - 1 && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              loading={phase === 'submitting'}
              onClick={submit}
            >
              All answered — submit now
            </Button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

function QuizSkeleton() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
      <Skeleton className="h-5 w-32 rounded" />
      <Skeleton className="h-7 w-2/3 rounded" />
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="card p-6 space-y-4">
        <Skeleton className="h-4 w-1/4 rounded" />
        <Skeleton className="h-5 w-full rounded" />
        <Skeleton className="h-5 w-4/5 rounded" />
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
      </div>
    </div>
  );
}
