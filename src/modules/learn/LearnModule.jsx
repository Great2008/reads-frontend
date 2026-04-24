import { useState, useEffect, useRef } from 'react';
import {
  BookOpen, ChevronRight, ChevronLeft, Search, Filter,
  CheckCircle, XCircle, Loader2, Clock, Coins, Trophy, RotateCcw, ArrowLeft
} from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay, EmptyState, TokenBadge, Badge, ProgressBar, Toast } from '../../components/UI.jsx';

// ─────────────────────────────────────────────
// Quiz View
// ─────────────────────────────────────────────
function QuizView({ lessonId, lessonTitle, quizCount, tokenReward, onDone, onBack }) {
  const [state, setState] = useState('loading'); // loading | quiz | submitting | result
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const start = async () => {
      try {
        const data = await api.lessons.startQuiz(lessonId);
        setQuestions(data.questions || []);
        setAttemptId(data.attempt_id);
        setTimeLeft((data.questions?.length || quizCount) * 60);
        setState('quiz');
      } catch (e) {
        setState('error');
      }
    };
    start();
  }, [lessonId]);

  useEffect(() => {
    if (state !== 'quiz') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [state]);

  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    setState('submitting');
    const formatted = questions.map((q) => ({
      question_id: q.id,
      selected: answers[q.id] ?? null,
    }));
    try {
      const res = await api.lessons.submitQuiz(lessonId, {
        attempt_id: attemptId,
        answers: formatted,
      });
      setResult(res);
      setState('result');
    } catch (_) { setState('result'); }
  };

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const q = questions[current];
  const answered = Object.keys(answers).length;
  const pct = questions.length ? Math.round((answered / questions.length) * 100) : 0;

  if (state === 'loading') return <LoadingOverlay message="Loading quiz…" />;

  if (state === 'result' || state === 'submitting') {
    const score = result?.score ?? 0;
    const total = result?.total ?? questions.length;
    const earned = result?.tokens_earned ?? 0;
    const passed = score / total >= 0.5;

    return (
      <div className="px-4 pt-6 pb-8 flex flex-col items-center animate-fade-in">
        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-5 ${passed ? 'bg-reads-green-bg' : 'bg-reads-red-bg'}`}>
          {passed ? <Trophy size={40} className="text-reads-green" /> : <XCircle size={40} className="text-reads-red" />}
        </div>
        <h2 className="font-display font-black text-reads-navy text-2xl mb-1">
          {passed ? 'Well Done!' : 'Keep Trying!'}
        </h2>
        <p className="text-reads-muted text-sm mb-6">
          {score} / {total} correct
        </p>

        {/* Score ring */}
        <div className="reads-card p-5 w-full mb-4 text-center">
          <div className="text-5xl font-black text-reads-navy mb-1">
            {Math.round((score / total) * 100)}%
          </div>
          <ProgressBar value={score} max={total} color={passed ? 'green' : 'gold'} />
        </div>

        {earned > 0 && (
          <div className="reads-card p-4 w-full mb-5 flex items-center gap-3">
            <Coins size={24} className="text-reads-gold flex-shrink-0" />
            <div>
              <p className="font-black text-reads-navy">+{earned} $READS earned!</p>
              <p className="text-reads-muted text-xs">Added to your wallet</p>
            </div>
          </div>
        )}

        {/* Per-question review */}
        {result?.breakdown && (
          <div className="reads-card p-4 w-full mb-5">
            <p className="font-bold text-reads-navy text-sm mb-3">Question Review</p>
            <div className="space-y-2">
              {result.breakdown.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  {item.correct
                    ? <CheckCircle size={16} className="text-reads-green flex-shrink-0" />
                    : <XCircle size={16} className="text-reads-red flex-shrink-0" />
                  }
                  <p className="text-xs text-reads-muted truncate flex-1">{item.question}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 w-full">
          <button onClick={onBack} className="reads-btn-outline flex-1">
            Back to Lessons
          </button>
          <button onClick={onDone} className="reads-btn-primary flex-1">
            Done
          </button>
        </div>
      </div>
    );
  }

  if (!q) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-4 pb-6 flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-reads-muted text-xs">{current + 1} / {questions.length}</p>
          <ProgressBar value={current + 1} max={questions.length} />
        </div>
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${timeLeft < 60 ? 'bg-reads-red-bg text-reads-red' : 'bg-gray-100 text-reads-muted'}`}>
          <Clock size={14} />
          <span className="text-sm font-bold">{fmtTime(timeLeft)}</span>
        </div>
      </div>

      {/* Question */}
      <div className="reads-card p-4 mb-4 flex-shrink-0">
        <p className="font-bold text-reads-navy text-sm leading-relaxed">{q.question_text}</p>
      </div>

      {/* Options */}
      <div className="space-y-3 flex-1">
        {q.options?.map((opt, i) => {
          const letter = ['A', 'B', 'C', 'D'][i];
          const selected = answers[q.id] === i;
          return (
            <button
              key={i}
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-98 ${
                selected
                  ? 'border-reads-green bg-reads-green-bg'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                selected ? 'bg-reads-green text-white' : 'bg-gray-100 text-reads-navy'
              }`}>
                {letter}
              </div>
              <span className="text-reads-navy text-sm flex-1">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="reads-btn-outline px-4 disabled:opacity-30"
        >
          <ChevronLeft size={20} />
        </button>
        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent((c) => c + 1)} className="reads-btn-primary flex-1">
            Next <ChevronRight size={18} className="inline ml-1" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={answered < questions.length}
            className="reads-btn-gold flex-1 flex items-center justify-center gap-2"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Lesson Detail View
// ─────────────────────────────────────────────
function LessonDetail({ lesson, onBack, onQuizDone }) {
  const [tab, setTab] = useState('content'); // content | quiz
  const [readSeconds, setReadSeconds] = useState(0);
  const [canQuiz, setCanQuiz] = useState(false);
  const startRef = useRef(Date.now());

  // Track reading time — need min 30s before quiz
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      setReadSeconds(elapsed);
      if (elapsed >= 30) setCanQuiz(true);
    }, 1000);
    return () => {
      clearInterval(interval);
      api.lessons.updateProgress(lesson.id, {
        status: 'in_progress',
        read_duration_secs: Math.floor((Date.now() - startRef.current) / 1000),
      }).catch(() => {});
    };
  }, [lesson.id]);

  if (tab === 'quiz') {
    return (
      <QuizView
        lessonId={lesson.id}
        lessonTitle={lesson.title}
        quizCount={lesson.quiz_count || 10}
        tokenReward={lesson.token_reward}
        onDone={() => { onQuizDone(); onBack(); }}
        onBack={() => setTab('content')}
      />
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-reads-muted text-sm mb-3">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-reads-muted text-xs mb-1">{lesson.subject} · {lesson.track?.toUpperCase()}</p>
            <h2 className="font-display font-black text-reads-navy text-xl leading-tight">{lesson.title}</h2>
          </div>
          <TokenBadge amount={lesson.token_reward} size="sm" />
        </div>
        <div className="flex gap-2 mt-2">
          {lesson.term && <Badge label={`Term ${lesson.term}`} variant="gray" />}
          {lesson.week && <Badge label={`Week ${lesson.week}`} variant="gray" />}
          {lesson.is_general && <Badge label="General" variant="teal" />}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div
          className="prose prose-sm max-w-none text-reads-navy leading-relaxed"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />
      </div>

      {/* Take Quiz CTA */}
      <div className="px-4 pb-6 pt-3 border-t border-gray-100 flex-shrink-0">
        {!canQuiz && (
          <p className="text-reads-muted text-xs text-center mb-2">
            Read for {Math.max(0, 30 - readSeconds)}s more to unlock quiz
          </p>
        )}
        <button
          onClick={() => setTab('quiz')}
          disabled={!canQuiz || lesson.quiz_count === 0}
          className="reads-btn-primary w-full flex items-center justify-center gap-2"
        >
          <Trophy size={18} />
          {lesson.quiz_count === 0 ? 'No Quiz for This Lesson' : `Take Quiz · Earn ${lesson.token_reward} $READS`}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Lessons List
// ─────────────────────────────────────────────
const LessonListItem = ({ lesson, onClick }) => (
  <button
    onClick={() => onClick(lesson)}
    className="flex items-center gap-3 w-full py-3.5 px-4 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-98 transition-transform text-left mb-2"
  >
    <div className="w-10 h-10 bg-reads-green-bg rounded-xl flex items-center justify-center flex-shrink-0">
      <BookOpen size={18} className="text-reads-green" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-reads-navy font-bold text-sm leading-tight truncate">{lesson.title}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-reads-muted text-xs">{lesson.subject}</span>
        {lesson.term && <span className="text-reads-muted text-xs">· T{lesson.term}</span>}
        {lesson.status === 'completed' && (
          <CheckCircle size={12} className="text-reads-green" />
        )}
      </div>
    </div>
    <div className="flex flex-col items-end gap-1 flex-shrink-0">
      <TokenBadge amount={lesson.token_reward} />
      <ChevronRight size={16} className="text-reads-muted-light" />
    </div>
  </button>
);

// ─────────────────────────────────────────────
// Main Learn Module
// ─────────────────────────────────────────────
export default function LearnModule({ onUpdateWallet }) {
  const [view, setView] = useState('list'); // list | detail
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | completed | pending
  const [activeLesson, setActiveLesson] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.lessons.list();
        setLessons(data?.lessons || []);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const filtered = lessons.filter((l) => {
    const matchSearch = l.title?.toLowerCase().includes(search.toLowerCase()) ||
      l.subject?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'completed') return matchSearch && l.status === 'completed';
    if (filter === 'pending') return matchSearch && l.status !== 'completed';
    return matchSearch;
  });

  if (view === 'detail' && activeLesson) {
    return (
      <LessonDetail
        lesson={activeLesson}
        onBack={() => { setView('list'); setActiveLesson(null); }}
        onQuizDone={async () => {
          showToast('Quiz completed! Tokens added to wallet.');
          const bal = await api.wallet.getBalance();
          onUpdateWallet?.(bal);
        }}
      />
    );
  }

  return (
    <div className="px-4 pt-4 pb-4 animate-fade-in">
      <h1 className="font-display font-black text-reads-navy text-2xl mb-4">Learn</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-reads-muted-light" />
        <input
          type="text"
          placeholder="Search lessons…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="reads-input pl-10"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'pending', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-reads-green text-white shadow-reads-green'
                : 'bg-gray-100 text-reads-muted'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Lessons */}
      {loading ? (
        <LoadingOverlay message="Loading lessons…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No lessons found"
          description={search ? 'Try a different search.' : 'No lessons available yet.'}
        />
      ) : (
        <div>
          {filtered.map((lesson) => (
            <LessonListItem
              key={lesson.id}
              lesson={lesson}
              onClick={(l) => { setActiveLesson(l); setView('detail'); }}
            />
          ))}
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
