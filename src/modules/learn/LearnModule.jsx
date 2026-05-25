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
function QuizView({ lessonId, lessonTitle, quizCount, tokenReward, timeLimitSecs, passMark = 60, maxAttempts, perfectBonus = 0, onDone, onBack }) {
  const [state, setState] = useState('loading'); // loading | quiz | submitting | result | error
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [serverPassMark, setServerPassMark] = useState(passMark);
  const [errorMsg, setErrorMsg] = useState('');
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const start = async () => {
      try {
        const data = await api.lessons.startQuiz(lessonId);
        setQuestions(data.questions || []);
        setAttemptId(data.attempt_id);
        setAttemptsUsed(data.attempts_used ?? 0);
        setServerPassMark(data.pass_mark ?? passMark);
        if (data.time_limit_secs) setTimeLeft(data.time_limit_secs);
        startTimeRef.current = Date.now();
        setState('quiz');
      } catch (e) {
        setErrorMsg(e.message || 'Failed to load quiz');
        setState('error');
      }
    };
    start();
  }, [lessonId]);

  useEffect(() => {
    if (state !== 'quiz' || timeLeft === null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [state, timeLeft]);

  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    setState('submitting');
    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const formatted = questions.map((q) => ({
      question_id: q.id,
      selected: answers[q.id]?.index ?? null,      // legacy fallback
      selected_text: answers[q.id]?.text ?? null,  // shuffle-safe grading
    }));
    try {
      const res = await api.lessons.submitQuiz(lessonId, {
        attempt_id: attemptId,
        answers: formatted,
        time_taken_secs: timeTaken,
      });
      setResult({ ...res, time_taken_secs: timeTaken });
      setState('result');
    } catch (_) { setState('result'); }
  };

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const q = questions[current];
  const answered = Object.keys(answers).length;
  const pct = questions.length ? Math.round((answered / questions.length) * 100) : 0;

  if (state === 'loading') return <LoadingOverlay message="Loading quiz…" />;

  // Show dedicated loading screen while waiting for server score
  if (state === 'submitting') return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-4">
      <div className="w-20 h-20 rounded-3xl bg-reads-green-bg flex items-center justify-center animate-pulse">
        <span className="text-3xl">📊</span>
      </div>
      <div className="text-center space-y-2">
        <p className="font-black text-reads-navy text-xl">Calculating Score…</p>
        <p className="text-reads-muted text-sm">Checking your answers, please wait</p>
      </div>
      <div className="flex gap-1.5 mt-2">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-reads-green animate-bounce"
            style={{animationDelay: `${i * 0.15}s`}} />
        ))}
      </div>
    </div>
  );

  if (state === 'error') return (
    <div className="px-4 pt-10 flex flex-col items-center gap-4">
      <XCircle size={40} className="text-reads-red" />
      <p className="font-bold text-reads-navy text-center">{errorMsg}</p>
      <button onClick={onBack} className="reads-btn-outline px-6">Go Back</button>
    </div>
  );

  if (state === 'result') {
    const score    = result?.score ?? 0;
    const total    = result?.total ?? questions.length;
    const earned   = result?.tokens_earned ?? 0;
    const bonus    = result?.bonus_tokens ?? 0;
    const passed   = result?.passed ?? (score / total >= 0.5);
    const perfect  = score === total && total > 0;
    const pct      = total > 0 ? Math.round((score / total) * 100) : 0;
    const timeTaken = result?.time_taken_secs ?? null;

    const grade = pct >= 80 ? { label: 'Excellent', color: 'text-reads-green' }
                : pct >= 60 ? { label: 'Good',      color: 'text-reads-navy'  }
                : pct >= 40 ? { label: 'Fair',       color: 'text-reads-gold'  }
                :             { label: 'Poor',       color: 'text-reads-red'   };

    return (
      <div className="px-4 pt-6 pb-10 overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-4 ${passed ? 'bg-reads-green-bg' : 'bg-red-50'}`}>
            {perfect ? <Trophy size={42} className="text-reads-gold" />
              : passed ? <Trophy size={42} className="text-reads-green" />
              : <XCircle size={42} className="text-reads-red" />}
          </div>
          <h2 className="font-display font-black text-reads-navy text-2xl">
            {perfect ? 'Perfect Score! 🎉' : passed ? 'Well Done!' : 'Keep Trying!'}
          </h2>
          <p className="text-reads-muted text-sm mt-1">{lessonTitle}</p>
        </div>

        {/* Score card */}
        <div className="reads-card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-reads-muted text-sm">Your Score</span>
            <span className={`font-black text-2xl ${grade.color}`}>{pct}%</span>
          </div>
          <ProgressBar value={score} max={total} color={passed ? 'green' : 'gold'} />
          <div className="flex justify-between mt-3 text-xs text-reads-muted">
            <span>{score} of {total} correct</span>
            <span className={`font-bold ${grade.color}`}>{grade.label}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="reads-card p-3 text-center">
            <p className="text-reads-green font-black text-lg">{score}</p>
            <p className="text-reads-muted text-xs">Correct</p>
          </div>
          <div className="reads-card p-3 text-center">
            <p className="text-reads-red font-black text-lg">{total - score}</p>
            <p className="text-reads-muted text-xs">Wrong</p>
          </div>
          <div className="reads-card p-3 text-center">
            <p className="text-reads-navy font-black text-lg">
              {timeTaken ? `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s` : `${total}`}
            </p>
            <p className="text-reads-muted text-xs">{timeTaken ? 'Time' : 'Questions'}</p>
          </div>
        </div>

        {/* Tokens earned */}
        {(earned > 0 || bonus > 0) && (
          <div className="reads-card p-4 mb-4 bg-reads-gold/5 border border-reads-gold/20">
            <p className="font-bold text-reads-navy text-sm mb-2">Tokens Earned</p>
            <div className="space-y-1.5">
              {earned > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-reads-muted">Quiz reward</span>
                  <span className="font-bold text-reads-green">+{earned} $READS</span>
                </div>
              )}
              {bonus > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-reads-muted">Perfect score bonus 🎯</span>
                  <span className="font-bold text-reads-gold">+{bonus} $READS</span>
                </div>
              )}
              <div className="border-t border-reads-gold/20 pt-1.5 flex justify-between text-sm font-black">
                <span className="text-reads-navy">Total</span>
                <span className="text-reads-green">+{earned + bonus} $READS</span>
              </div>
            </div>
          </div>
        )}

        {!passed && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
            <p className="text-amber-700 text-xs font-semibold">
              You need {result?.pass_mark ?? 50}% to pass and earn tokens. Review the lesson and try again!
            </p>
          </div>
        )}

        {/* Per-question breakdown */}
        {result?.breakdown && result.breakdown.length > 0 && (
          <div className="reads-card p-4 mb-6">
            <p className="font-bold text-reads-navy text-sm mb-3">Question Breakdown</p>
            <div className="space-y-3">
              {result.breakdown.map((item, i) => (
                <div key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2 mb-1">
                    {item.correct
                      ? <CheckCircle size={15} className="text-reads-green flex-shrink-0 mt-0.5" />
                      : <XCircle size={15} className="text-reads-red flex-shrink-0 mt-0.5" />
                    }
                    <p className="text-xs text-reads-navy font-semibold leading-snug">{item.question}</p>
                  </div>
                  {!item.correct && item.correct_answer && (
                    <p className="text-xs text-reads-green ml-5">
                      ✓ Correct: {item.correct_answer}
                    </p>
                  )}
                  {item.explanation && (
                    <p className="text-xs text-reads-muted ml-5 mt-0.5 italic">{item.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onBack} className="reads-btn-outline flex-1">Back</button>
          <button onClick={onDone} className="reads-btn-primary flex-1">Done</button>
        </div>
      </div>
    );
  }

  if (!q) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-4 pb-6 flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-reads-muted text-xs font-semibold">Question {current + 1} of {questions.length}</p>
          <div className="flex items-center gap-2">
            {maxAttempts && (
              <span className="text-reads-muted text-xs">Attempt {attemptsUsed + 1}/{maxAttempts}</span>
            )}
            {timeLeft !== null && (
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${timeLeft < 60 ? 'bg-reads-red-bg text-reads-red animate-pulse' : 'bg-gray-100 text-reads-muted'}`}>
                <Clock size={12} />
                {fmtTime(timeLeft)}
              </div>
            )}
          </div>
        </div>
        <ProgressBar value={current + 1} max={questions.length} />
        <div className="flex justify-between mt-1">
          <span className="text-reads-muted text-xs">{answered}/{questions.length} answered</span>
          <span className="text-reads-muted text-xs">Pass: {serverPassMark}%</span>
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
          const selected = answers[q.id]?.index === i;
          return (
            <button
              key={i}
              onClick={() => setAnswers((a) => ({ ...a, [q.id]: { index: i, text: opt } }))}
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
function LessonDetail({ lesson: lessonMeta, onBack, onQuizDone }) {
  const [lesson, setLesson] = useState(lessonMeta);
  const [contentLoading, setContentLoading] = useState(!lessonMeta.content);
  const [tab, setTab] = useState('content'); // content | quiz
  const [readSeconds, setReadSeconds] = useState(0);
  const [canQuiz, setCanQuiz] = useState(false);
  const startRef = useRef(Date.now());

  // Fetch full lesson content if not already loaded
  useEffect(() => {
    if (!lessonMeta.content) {
      setContentLoading(true);
      api.lessons.get(lessonMeta.id)
        .then(full => setLesson(full))
        .catch(() => {})
        .finally(() => setContentLoading(false));
    }
  }, [lessonMeta.id]);

  // Track reading time — need min 30s before quiz
  useEffect(() => {
    const minRead = lesson.quiz_min_read_secs ?? 30;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      setReadSeconds(elapsed);
      if (elapsed >= minRead) setCanQuiz(true);
    }, 1000);
    return () => {
      clearInterval(interval);
      api.lessons.updateProgress(lessonMeta.id, {
        status: 'in_progress',
        read_duration_secs: Math.floor((Date.now() - startRef.current) / 1000),
      }).catch(() => {});
    };
  }, [lessonMeta.id]);

  if (tab === 'quiz') {
    return (
      <QuizView
        lessonId={lesson.id}
        lessonTitle={lesson.title}
        quizCount={lesson.quiz_count || 10}
        tokenReward={lesson.token_reward}
        timeLimitSecs={lesson.quiz_time_limit_secs}
        passMark={lesson.quiz_pass_mark ?? 60}
        maxAttempts={lesson.quiz_max_attempts}
        perfectBonus={lesson.quiz_perfect_bonus ?? 0}
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
        {contentLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-reads-green" />
          </div>
        ) : lesson.content ? (
          <div
            className="prose prose-sm max-w-none text-reads-navy leading-relaxed"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        ) : (
          <p className="text-reads-muted text-sm text-center py-12">No content available for this lesson yet.</p>
        )}
      </div>

      {/* Take Quiz CTA */}
      <div className="px-4 pb-6 pt-3 border-t border-gray-100 flex-shrink-0">
        {!canQuiz && (
          <p className="text-reads-muted text-xs text-center mb-2">
            Read for {Math.max(0, (lesson.quiz_min_read_secs ?? 30) - readSeconds)}s more to unlock quiz
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
