'use client';

import * as React from 'react';
import { Plus, Trash2, CheckCircle, Circle, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { api, ApiClientError } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { PermissionError } from './PermissionError';
import { useCourseQuiz } from '@/hooks/useInstructor';
import type { Quiz, Question, Option } from '@/types';

// ── Option row ────────────────────────────────────────────────────────────────
function OptionRow({ option, isCorrect, onToggleCorrect, onDelete, onTextChange }: {
  option: Option; isCorrect: boolean;
  onToggleCorrect: () => void; onDelete: () => void; onTextChange: (text: string) => void;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-neutral-200 bg-white'}`}>
      <button onClick={onToggleCorrect} className="shrink-0" title={isCorrect ? 'Mark incorrect' : 'Mark correct'}>
        {isCorrect ? <CheckCircle size={16} className="text-emerald-600" /> : <Circle size={16} className="text-neutral-300" />}
      </button>
      <input
        className="flex-1 text-sm bg-transparent outline-none text-neutral-900 placeholder:text-neutral-400"
        value={option.text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Option text..."
      />
      <button onClick={onDelete} className="shrink-0 text-neutral-300 hover:text-rose-500 transition-colors">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ── Question card ─────────────────────────────────────────────────────────────
function QuestionCard({ question, index, onDeleted, onSaved }: {
  question: Question; index: number; onDeleted: () => void; onSaved: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [text, setText] = React.useState(question.text);
  const [options, setOptions] = React.useState<Option[]>(question.options ?? []);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      // Update question text
      await api.put(`/questions/${question.documentId}`, { data: { text } });
      // Update each option
      await Promise.all(options.map((opt) =>
        api.put(`/options/${opt.documentId}`, { data: { text: opt.text, isCorrect: opt.isCorrect ?? false } }),
      ));
      setExpanded(false);
      onSaved();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function addOption() {
    try {
      const res = await api.post<{ data: Option }>('/options', {
        data: { text: 'New option', isCorrect: false, question: question.documentId },
      });
      setOptions((prev) => [...prev, res.data]);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Failed to add option');
    }
  }

  async function deleteOption(opt: Option) {
    try {
      await api.delete(`/options/${opt.documentId}`);
      setOptions((prev) => prev.filter((o) => o.documentId !== opt.documentId));
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Failed to delete option');
    }
  }

  async function handleDeleteQuestion() {
    setDeleting(true);
    try {
      await api.delete(`/questions/${question.documentId}`);
      setConfirmDelete(false);
      onDeleted();
    } catch {
      setDeleting(false);
    }
  }

  function toggleCorrect(optDocId: string) {
    setOptions((prev) => prev.map((o) => ({ ...o, isCorrect: o.documentId === optDocId ? !o.isCorrect : o.isCorrect })));
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-xs font-mono text-neutral-400 w-5 shrink-0">Q{index + 1}</span>
        <p className="flex-1 text-sm font-medium text-neutral-900 truncate">{question.text}</p>
        <span className="text-xs text-neutral-400 shrink-0">{options.length} options</span>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="xs" onClick={() => setExpanded((v) => !v)}>
            {expanded ? <X size={14} /> : 'Edit'}
          </Button>
          <Button variant="ghost" size="xs" className="text-rose-500 hover:bg-rose-50" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-neutral-100 px-4 py-4 space-y-3 bg-neutral-50">
          {error && <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">{error}</div>}
          <Input label="Question Text" value={text} onChange={(e) => setText(e.target.value)} required />
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-600">Options <span className="text-neutral-400">(click circle to mark correct)</span></p>
            {options.map((opt) => (
              <OptionRow
                key={opt.documentId}
                option={opt}
                isCorrect={opt.isCorrect ?? false}
                onToggleCorrect={() => toggleCorrect(opt.documentId)}
                onDelete={() => deleteOption(opt)}
                onTextChange={(t) => setOptions((prev) => prev.map((o) => o.documentId === opt.documentId ? { ...o, text: t } : o))}
              />
            ))}
            <button
              onClick={addOption}
              className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium"
            >
              <Plus size={13} /> Add option
            </button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" loading={saving} onClick={save} leftIcon={<Save size={13} />}>Save</Button>
            <Button size="sm" variant="secondary" onClick={() => setExpanded(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(false)}
        title="Delete question?"
        description="This question and all its options will be permanently deleted."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDeleteQuestion}
      />
    </div>
  );
}

// ── Add question form ─────────────────────────────────────────────────────────
function AddQuestionForm({ quizDocumentId, nextOrder, onAdded }: { quizDocumentId: string; nextOrder: number; onAdded: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleAdd() {
    if (!text.trim()) { setError('Question text is required'); return; }
    setSaving(true);
    setError(null);
    try {
      await api.post('/questions', { data: { text, order: nextOrder, quiz: quizDocumentId } });
      setText(''); setOpen(false); onAdded();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Failed to add question');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 py-3 text-sm text-neutral-500 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
      >
        <Plus size={15} /> Add Question
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3">
      {error && <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">{error}</div>}
      <Input label="Question Text" value={text} onChange={(e) => setText(e.target.value)} required autoFocus />
      <div className="flex gap-2">
        <Button size="sm" loading={saving} onClick={handleAdd} leftIcon={<Plus size={13} />}>Add Question</Button>
        <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Quiz Editor ───────────────────────────────────────────────────────────────
export function QuizEditor({ courseDocumentId }: { courseDocumentId: string }) {
  const { quiz, loading, forbidden, error, reload } = useCourseQuiz(courseDocumentId);
  const [creating, setCreating] = React.useState(false);
  const [quizTitle, setQuizTitle] = React.useState('');
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [confirmDeleteQuiz, setConfirmDeleteQuiz] = React.useState(false);
  const [deletingQuiz, setDeletingQuiz] = React.useState(false);

  async function createQuiz() {
    if (!quizTitle.trim()) { setCreateError('Title is required'); return; }
    setCreating(true);
    setCreateError(null);
    try {
      await api.post('/quizzes', { data: { title: quizTitle, course: courseDocumentId } });
      setQuizTitle('');
      reload();
    } catch (e) {
      setCreateError(e instanceof ApiClientError ? e.message : 'Failed to create quiz');
    } finally {
      setCreating(false);
    }
  }

  async function deleteQuiz() {
    if (!quiz) return;
    setDeletingQuiz(true);
    try {
      await api.delete(`/quizzes/${quiz.documentId}`);
      setConfirmDeleteQuiz(false);
      reload();
    } catch {
      setDeletingQuiz(false);
    }
  }

  if (forbidden) return <PermissionError message="You can only manage quizzes for your own courses." />;
  if (error) return <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>;

  if (loading) {
    return <div className="space-y-2">{[0, 1].map((i) => <div key={i} className="h-14 rounded-xl bg-neutral-100 animate-pulse" />)}</div>;
  }

  if (!quiz) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-neutral-400 text-center py-2">No quiz for this course yet.</p>
        {createError && <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{createError}</div>}
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            placeholder="Quiz title..."
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
          />
          <Button size="sm" loading={creating} onClick={createQuiz} leftIcon={<Plus size={13} />}>Create Quiz</Button>
        </div>
      </div>
    );
  }

  const questions = quiz.questions ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-900">{quiz.title}</p>
          <p className="text-xs text-neutral-400">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="ghost" size="xs" className="text-rose-500 hover:bg-rose-50" onClick={() => setConfirmDeleteQuiz(true)}>
          <Trash2 size={14} />
        </Button>
      </div>

      <div className="space-y-2">
        {questions.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-2">No questions yet.</p>
        ) : (
          questions.map((q, i) => (
            <QuestionCard key={q.documentId} question={q} index={i} onDeleted={reload} onSaved={reload} />
          ))
        )}
        <AddQuestionForm quizDocumentId={quiz.documentId} nextOrder={questions.length + 1} onAdded={reload} />
      </div>

      <ConfirmDialog
        open={confirmDeleteQuiz}
        onOpenChange={(o) => !o && setConfirmDeleteQuiz(false)}
        title={`Delete quiz "${quiz.title}"?`}
        description="All questions and options will be permanently deleted."
        confirmLabel="Delete Quiz"
        loading={deletingQuiz}
        onConfirm={deleteQuiz}
      />
    </div>
  );
}
