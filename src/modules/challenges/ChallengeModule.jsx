import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trophy, Shield, Clock, Star, AlertTriangle,
  CheckCircle, XCircle, Loader2, ArrowLeft,
  Lock, Eye, Users, Zap
} from 'lucide-react';
import { api } from '../../services/api.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
const Toast = ({ msg, type }) => (
  <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 animate-fade-in
    ${type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-reads-green border border-green-200'}`}>
    {type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
    {msg}
  </div>
);

const STAGE_COLORS = {
  school:   { bg: 'bg-blue-50',        text: 'text-blue-600',   border: 'border-blue-200' },
  state:    { bg: 'bg-amber-50',       text: 'text-amber-600',  border: 'border-amber-200' },
  national: { bg: 'bg-purple-50',      text: 'text-purple-600', border: 'border-purple-200' },
  global:   { bg: 'bg-reads-green-bg', text: 'text-reads-green', border: 'border-reads-green' },
};

// ── Join Screen ───────────────────────────────────────────────────────────────
function JoinScreen({ onJoined }) {
  const [accessId, setAccessId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!accessId.trim()) return setError('Enter your access ID');
    setLoading(true); setError('');
    try {
      await api.students.joinTournament({ access_id: accessId.trim().toUpperCase() });
      onJoined();
    } catch (e) {
      setError(e.message || 'Invalid access ID');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-reads-navy flex flex-col items-center justify-center px-6 pb-20">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-reads-gold rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Trophy size={40} className="text-reads-navy" />
        </div>
        <h1 className="font-black text-white text-2xl">Smart User Challenge</h1>
        <p className="text-white/60 text-sm mt-2">Enter your access ID to join</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <input
          className="w-full bg-white/10 border-2 border-white/20 text-white placeholder-white/40 rounded-2xl px-4 py-4 text-center text-xl font-black tracking-widest uppercase focus:outline-none focus:border-reads-gold"
          placeholder="SUC-XXXXXXXX"
          value={accessId}
          onChange={e => setAccessId(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          maxLength={12}
        />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button onClick={handleJoin} disabled={loading}
          className="w-full bg-reads-gold text-reads-navy font-black py-4 rounded-2xl text-lg flex items-center justify-center gap-2">
          {loading ? <Loader2 size={22} className="animate-spin" /> : <Zap size={22} />}
          Join Challenge
        </button>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ tournament, onStartQuiz, onViewStandings, onRefresh }) {
  const stage = tournament.stage;
  const colors = STAGE_COLORS[stage] || STAGE_COLORS.school;
  const daysLeft = tournament.end_date
    ? Math.max(0, Math.ceil((new Date(tournament.end_date) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="px-4 pt-2 pb-4 space-y-4 animate-fade-in">
      {/* Header card */}
      <div className={`rounded-2xl p-5 border-2 ${colors.bg} ${colors.border}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-reads-navy rounded-2xl flex items-center justify-center">
            <Trophy size={24} className="text-reads-gold" />
          </div>
          <div>
            <p className={`font-black text-sm uppercase tracking-wide ${colors.text}`}>{stage} stage</p>
            <p className="font-black text-reads-navy text-base leading-tight">{tournament.name}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            ['Points', tournament.total_points],
            ['Quizzes', tournament.quizzes_taken],
            ['Days Left', daysLeft ?? '—'],
          ].map(([label, val]) => (
            <div key={label} className="bg-white rounded-xl p-2 text-center">
              <p className="font-black text-reads-navy text-xl">{val}</p>
              <p className="text-reads-muted text-[10px]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Access ID */}
      <div className="reads-card px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-reads-muted text-xs">Your Access ID</p>
          <p className="font-black text-reads-navy tracking-widest text-sm">{tournament.access_id}</p>
        </div>
        <Lock size={16} className="text-reads-muted" />
      </div>

      {/* Cheat warnings */}
      {tournament.cheat_flags > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="font-bold text-red-700 text-sm">Anti-cheat warning</p>
            <p className="text-red-500 text-xs">{tournament.cheat_flags}/3 strikes. 3 = disqualified.</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <button onClick={onStartQuiz}
        className="w-full bg-reads-navy text-white font-black py-4 rounded-2xl text-base flex items-center justify-center gap-2">
        <Zap size={20} className="text-reads-gold" /> Start Quiz
        <span className="text-white/60 text-xs ml-1">+{tournament.points_per_correct} pts/correct</span>
      </button>

      <button onClick={onViewStandings}
        className="w-full reads-card py-3 flex items-center justify-center gap-2 font-bold text-reads-navy text-sm">
        <Users size={16} /> View Leaderboard
      </button>

      <div className="reads-card px-4 py-3 bg-gray-50">
        <p className="font-bold text-reads-navy text-xs mb-1">How scoring works</p>
        <p className="text-reads-muted text-xs">+{tournament.points_per_correct} points per correct answer. Tiebreaker: speed. Top 3 advance to next stage.</p>
      </div>
    </div>
  );
}

// ── Anti-cheat hook ───────────────────────────────────────────────────────────
function useAntiCheat({ tournamentId, attemptId, active, onFlag }) {
  const visibilityCount = useRef(0);
  const lastFlagTime = useRef(0);

  const submitFlag = useCallback(async (flag_type, data = {}) => {
    const now = Date.now();
    if (now - lastFlagTime.current < 10000) return; // debounce 10s
    lastFlagTime.current = now;
    try {
      await api.students.submitCheatFlag({ tournament_id: tournamentId, attempt_id: attemptId, flag_type, flag_data: data });
      onFlag(flag_type);
    } catch {}
  }, [tournamentId, attemptId, onFlag]);

  useEffect(() => {
    if (!active) return;

    // Tab visibility change detection
    const handleVisibility = () => {
      if (document.hidden) {
        visibilityCount.current++;
        submitFlag('suspicious_activity', { reason: 'Tab switched or minimized', count: visibilityCount.current });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [active, submitFlag]);

  return { submitFlag };
}

// ── Quiz Screen ───────────────────────────────────────────────────────────────
function QuizScreen({ tournament, onComplete, onBack }) {
  const [phase, setPhase] = useState('loading'); // loading | quiz | result
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(600);
  const [startTime] = useState(Date.now());
  const [result, setResult] = useState(null);
  const [flags, setFlags] = useState([]);
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const handleFlag = useCallback((type) => {
    setFlags(prev => [...prev, type]);
    setToast({ msg: '⚠ Anti-cheat alert detected', type: 'error' });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const { submitFlag } = useAntiCheat({
    tournamentId: tournament.id,
    attemptId: attempt?.attempt_id,
    active: phase === 'quiz',
    onFlag: handleFlag,
  });

  useEffect(() => {
    api.students.startTournamentQuiz(tournament.id)
      .then(d => {
        setAttempt(d);
        setQuestions(d.questions || []);
        setTimeLeft(d.time_limit_secs || 600);
        setPhase('quiz');
      })
      .catch(e => {
        setToast({ msg: e.message || 'Failed to start quiz', type: 'error' });
        setTimeout(onBack, 2000);
      });
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== 'quiz') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const handleAnswer = (qId, idx) => {
    setAnswers(prev => ({ ...prev, [qId]: idx }));
    if (current < questions.length - 1) {
      setTimeout(() => setCurrent(c => c + 1), 300);
    }
  };

  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    try {
      const res = await api.students.submitTournamentQuiz(tournament.id, {
        attempt_id: attempt.attempt_id,
        answers,
        time_taken_secs: timeTaken,
      });
      setResult(res);
      setPhase('result');
      onComplete(res);
    } catch (e) {
      setToast({ msg: e.message || 'Submit failed', type: 'error' });
    }
  };

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const q = questions[current];

  if (phase === 'loading') return (
    <div className="min-h-screen bg-reads-navy flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-reads-gold" />
    </div>
  );

  if (phase === 'result') return (
    <div className="min-h-screen bg-reads-navy flex flex-col items-center justify-center px-6 text-center">
      <Trophy size={60} className="text-reads-gold mb-4" />
      <p className="font-black text-white text-3xl">{result?.score}/{result?.total}</p>
      <p className="text-white/60 text-sm mt-1">Questions correct</p>
      <div className="mt-6 bg-white/10 rounded-2xl px-6 py-4">
        <p className="text-reads-gold font-black text-4xl">+{result?.points_earned}</p>
        <p className="text-white/60 text-sm">points earned</p>
        <p className="text-white text-sm mt-2">Total: <strong>{result?.total_points} pts</strong></p>
      </div>
      {flags.length > 0 && (
        <div className="mt-4 bg-red-900/40 rounded-2xl px-4 py-3">
          <p className="text-red-300 text-xs">⚠ {flags.length} anti-cheat flag(s) recorded this session.</p>
        </div>
      )}
      <button onClick={onBack} className="mt-8 bg-reads-gold text-reads-navy font-black px-8 py-3 rounded-2xl">
        Back to Dashboard
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-reads-navy flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-reads-gold" />
          <span className="text-white/60 text-xs">Anti-cheat active</span>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${timeLeft < 60 ? 'bg-red-500' : 'bg-white/10'}`}>
          <Clock size={14} className="text-white" />
          <span className="font-black text-white text-sm">{mins}:{secs}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 mb-4">
        <div className="flex justify-between text-white/40 text-xs mb-1">
          <span>Question {current + 1} of {questions.length}</span>
          <span>{Object.keys(answers).length} answered</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-reads-gold rounded-full transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 px-4 pb-4">
        {q && (
          <div className="animate-fade-in">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
              <p className="text-white font-semibold text-base leading-relaxed">{q.question_text}</p>
            </div>
            <div className="space-y-3">
              {q.options.map((opt, i) => {
                const chosen = answers[q.id] === i;
                return (
                  <button key={i} onClick={() => handleAnswer(q.id, i)}
                    className={`w-full text-left px-4 py-4 rounded-2xl border-2 font-semibold text-sm transition-all
                      ${chosen
                        ? 'border-reads-gold bg-reads-gold/20 text-white'
                        : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30'
                      }`}>
                    <span className={`font-black mr-3 ${chosen ? 'text-reads-gold' : 'text-white/40'}`}>
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {current > 0 && (
                <button onClick={() => setCurrent(c => c - 1)}
                  className="flex-1 bg-white/10 text-white font-bold py-3 rounded-2xl text-sm">
                  ← Previous
                </button>
              )}
              {current < questions.length - 1 ? (
                <button onClick={() => setCurrent(c => c + 1)}
                  className="flex-1 bg-white/10 text-white font-bold py-3 rounded-2xl text-sm">
                  Next →
                </button>
              ) : (
                <button onClick={handleSubmit}
                  className="flex-1 bg-reads-gold text-reads-navy font-black py-3 rounded-2xl text-sm">
                  Submit Quiz
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {toast && <Toast {...toast} />}
    </div>
  );
}

// ── Standings Screen ──────────────────────────────────────────────────────────
function StandingsScreen({ tournament, onBack }) {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.students.getTournamentStandings(tournament.id)
      .then(d => setStandings(d?.standings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-reads-navy">
      <div className="px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="text-white/60">
          <ArrowLeft size={20} />
        </button>
        <p className="font-black text-white">Leaderboard</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-reads-gold" /></div>
      ) : (
        <div className="px-4 space-y-2 pb-10">
          {standings.map(s => (
            <div key={s.rank}
              className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${s.is_me ? 'bg-reads-gold/20 border-2 border-reads-gold' : 'bg-white/5 border border-white/10'}`}>
              <span className="text-xl w-8 text-center">
                {s.rank <= 3 ? medals[s.rank - 1] : <span className="font-black text-white/40 text-sm">#{s.rank}</span>}
              </span>
              <div className="flex-1">
                <p className={`font-bold text-sm ${s.is_me ? 'text-reads-gold' : 'text-white'}`}>
                  {s.full_name} {s.is_me ? '(You)' : ''}
                </p>
                <p className="text-white/40 text-xs">{s.quizzes_taken} quizzes</p>
              </div>
              <p className={`font-black text-lg ${s.is_me ? 'text-reads-gold' : 'text-white'}`}>{s.total_points}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Not Invited Screen ────────────────────────────────────────────────────────
function NotInvitedScreen() {
  return (
    <div className="min-h-screen bg-reads-navy flex flex-col items-center justify-center px-6 text-center pb-20">
      <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
        <Lock size={36} className="text-white/40" />
      </div>
      <h2 className="font-black text-white text-xl mb-2">Challenge Locked</h2>
      <p className="text-white/60 text-sm max-w-xs">
        The Smart User Challenge is invite-only. Keep learning and climbing the leaderboard to qualify for the next round!
      </p>
      <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-left max-w-xs w-full">
        <p className="text-reads-gold font-bold text-sm mb-2">How to qualify</p>
        <div className="space-y-2 text-white/60 text-xs">
          <p>📚 Complete more lessons</p>
          <p>🧠 Take more quizzes</p>
          <p>🏆 Reach top 10 in your school leaderboard</p>
          <p>✉️ Watch for an invitation email</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Module ───────────────────────────────────────────────────────────────
export default function ChallengeModule({ onBack }) {
  const [screen, setScreen] = useState('loading'); // loading | not-invited | join | dashboard | quiz | standings
  const [tournament, setTournament] = useState(null);
  const [toast, setToast] = useState(null);

  const loadTournament = async () => {
    try {
      const d = await api.students.getMyTournament();
      if (!d.tournament) {
        setScreen('not-invited');
      } else {
        setTournament(d.tournament);
        setScreen('dashboard');
      }
    } catch {
      setScreen('not-invited');
    }
  };

  useEffect(() => { loadTournament(); }, []);

  const handleJoined = () => { loadTournament(); };

  const handleQuizComplete = (result) => {
    // Refresh tournament data after quiz
    loadTournament();
  };

  if (screen === 'loading') return (
    <div className="min-h-screen bg-reads-navy flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-reads-gold" />
    </div>
  );

  if (screen === 'quiz' && tournament) return (
    <QuizScreen
      tournament={tournament}
      onComplete={handleQuizComplete}
      onBack={() => setScreen('dashboard')}
    />
  );

  if (screen === 'standings' && tournament) return (
    <StandingsScreen tournament={tournament} onBack={() => setScreen('dashboard')} />
  );

  return (
    <div className="min-h-screen bg-reads-navy">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="text-white/60">
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <p className="font-black text-white text-sm">Smart User Challenge</p>
          <p className="text-white/40 text-xs">by $READS</p>
        </div>
        <Trophy size={20} className="text-reads-gold ml-auto" />
      </div>

      {screen === 'not-invited' && <NotInvitedScreen />}
      {screen === 'join' && <JoinScreen onJoined={handleJoined} />}
      {screen === 'dashboard' && tournament && (
        <Dashboard
          tournament={tournament}
          onStartQuiz={() => setScreen('quiz')}
          onViewStandings={() => setScreen('standings')}
          onRefresh={loadTournament}
        />
      )}
      {toast && <Toast {...toast} />}
    </div>
  );
}
