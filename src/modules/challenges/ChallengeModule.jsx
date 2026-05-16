import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trophy, Star, Clock, Users, ChevronRight, Zap,
  Shield, AlertTriangle, CheckCircle, XCircle,
  Loader2, Medal, Crown, Target, BarChart2, LogOut
} from 'lucide-react';
import { api } from '../../services/api.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
const STAGE_LABEL  = { school: 'School', state: 'State', national: 'National', global: 'Global' };
const STAGE_COLOR  = { school: '#16A34A', state: '#2563EB', national: '#7C3AED', global: '#B8860B' };
const AGE_LABEL    = { u15: 'Under 15', u17: 'Under 17', u21: 'Under 21', open: 'Open' };

function fmtTime(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function PrizeRow({ t }) {
  return (
    <div className="flex gap-2 text-xs mt-2">
      {t.prize_tokens > 0 && <span className="bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full">🥇 {t.prize_tokens} $READS</span>}
      {t.prize_2nd    > 0 && <span className="bg-gray-100  text-gray-600  font-bold px-2 py-0.5 rounded-full">🥈 {t.prize_2nd}</span>}
      {t.prize_3rd    > 0 && <span className="bg-amber-50/50 text-amber-600 font-bold px-2 py-0.5 rounded-full">🥉 {t.prize_3rd}</span>}
    </div>
  );
}

// ── Tournament Card ───────────────────────────────────────────────────────────
function TournamentCard({ t, onStart }) {
  const stageColor = STAGE_COLOR[t.stage] || '#16A34A';
  return (
    <div className="reads-card p-4 mb-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
              style={{ background: stageColor }}>
              {STAGE_LABEL[t.stage]?.toUpperCase()}
            </span>
            <span className="text-[10px] font-semibold text-reads-muted bg-gray-100 px-2 py-0.5 rounded-full">
              {AGE_LABEL[t.age_category]}
            </span>
          </div>
          <p className="font-black text-reads-navy text-sm">{t.name}</p>
          {t.subject && <p className="text-reads-muted text-xs mt-0.5">📚 {t.subject}</p>}
        </div>
        {t.my_rank && (
          <div className="text-center ml-3">
            <p className="font-black text-reads-navy text-lg leading-none">#{t.my_rank}</p>
            <p className="text-reads-muted text-[10px]">Your Rank</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-reads-muted mb-2">
        <span className="flex items-center gap-1"><Users size={11} /> {t.total_participants} participants</span>
        <span className="flex items-center gap-1"><Target size={11} /> {t.questions_per_round} questions</span>
        <span className="flex items-center gap-1"><Clock size={11} /> {t.time_per_question}s each</span>
      </div>

      <PrizeRow t={t} />

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div>
          <p className="text-reads-muted text-xs">{fmtDate(t.start_date)} – {fmtDate(t.end_date)}</p>
          {t.my_points > 0 && <p className="text-reads-green text-xs font-bold mt-0.5">{t.my_points} pts earned</p>}
        </div>
        {t.status === 'active' && !t.is_disqualified && (
          <button onClick={() => onStart(t)}
            className="flex items-center gap-1.5 bg-reads-green text-white text-sm font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform">
            <Zap size={14} /> Play
          </button>
        )}
        {t.is_disqualified && (
          <span className="text-reads-red text-xs font-bold px-3 py-1.5 bg-red-50 rounded-lg">Disqualified</span>
        )}
        {t.status === 'upcoming' && (
          <span className="text-reads-muted text-xs font-semibold px-3 py-1.5 bg-gray-100 rounded-lg">Upcoming</span>
        )}
        {t.status === 'completed' && (
          <span className="text-reads-muted text-xs font-semibold px-3 py-1.5 bg-gray-100 rounded-lg">Ended</span>
        )}
      </div>
    </div>
  );
}

// ── Leaderboard View ──────────────────────────────────────────────────────────
function LeaderboardView({ tournament, onBack }) {
  const [scope, setScope]       = useState('all');
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [meta, setMeta]         = useState(null);

  const load = async (s) => {
    setLoading(true);
    setError('');
    try {
      const d = await api.tournament.getLeaderboard(tournament.id, s);
      setData(d.leaderboard || []);
      setMeta(d.tournament);
    } catch (e) {
      setError(e.message || 'Failed to load leaderboard');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(scope); }, [scope]);

  const SCOPES = [
    { key: 'all',           label: 'All'          },
    { key: 'school',        label: 'Schools'      },
    { key: 'unaffiliated',  label: 'Unaffiliated' },
  ];

  const rankIcon = (r) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r}`;

  return (
    <div className="px-4 pt-2 pb-6 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-reads-muted text-sm mb-3">← Back</button>
      <h2 className="font-black text-reads-navy text-lg mb-1">{tournament.name}</h2>
      {meta && <PrizeRow t={meta} />}

      {/* Scope filter */}
      <div className="flex gap-2 mt-3 mb-4">
        {SCOPES.map(s => (
          <button key={s.key} onClick={() => setScope(s.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              scope === s.key ? 'bg-reads-navy text-white' : 'bg-gray-100 text-reads-muted'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-reads-green" /></div>
      ) : error ? (
        <div className="text-center py-12 text-reads-red text-sm">{error}</div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-reads-muted text-sm">No participants yet.</div>
      ) : (
        <div className="space-y-2">
          {data.map((entry) => (
            <div key={entry.user_id}
              className={`reads-card px-4 py-3 flex items-center gap-3 ${entry.is_me ? 'border-2 border-reads-green' : ''}`}>
              <span className="text-xl w-8 text-center flex-shrink-0">{rankIcon(entry.rank)}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm truncate ${entry.is_me ? 'text-reads-green' : 'text-reads-navy'}`}>
                  {entry.full_name} {entry.is_me && '(You)'}
                </p>
                <p className="text-reads-muted text-xs">
                  {entry.school_name || 'Unaffiliated'}{entry.state ? ` · ${entry.state}` : ''}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-black text-reads-navy text-sm">{entry.total_points} pts</p>
                <p className="text-reads-muted text-[10px]">{entry.quizzes_taken} rounds · {fmtTime(entry.total_time_secs)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Quiz View ─────────────────────────────────────────────────────────────────
function QuizView({ tournament, onDone }) {
  const [state, setState]     = useState('loading'); // loading | quiz | submitting | result
  const [questions, setQs]    = useState([]);
  const [attemptId, setAid]   = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [result, setResult]   = useState(null);
  const timerRef              = useRef(null);
  const startRef              = useRef(Date.now());
  const reportedEvents        = useRef(new Set());

  // Anti-cheat — tab visibility
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && state === 'quiz') {
        reportCheat('tab_switch');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [state]);

  const reportCheat = async (eventType) => {
    try {
      await api.tournament.reportCheat({
        tournament_id: tournament.id,
        attempt_id: attemptId,
        event_type: eventType,
      });
    } catch (_) {}
  };

  useEffect(() => {
    api.tournament.startQuiz(tournament.id)
      .then(d => {
        setQs(d.questions || []);
        setAid(d.attempt_id);
        setTimeLeft(tournament.time_per_question);
        setState('quiz');
        startRef.current = Date.now();
      })
      .catch(e => { alert(e.message); onDone(); });
  }, []);

  // Per-question timer
  useEffect(() => {
    if (state !== 'quiz') return;
    clearInterval(timerRef.current);
    setTimeLeft(tournament.time_per_question);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          // Auto-advance to next question
          setCurrent(c => {
            if (c + 1 >= questions.length) {
              handleSubmit();
              return c;
            }
            return c + 1;
          });
          return tournament.time_per_question;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [current, state]);

  const handleAnswer = (qId, idx) => {
    setAnswers(a => ({ ...a, [qId]: idx }));
    // Auto-advance after answering
    setTimeout(() => {
      if (current + 1 >= questions.length) {
        handleSubmit();
      } else {
        setCurrent(c => c + 1);
      }
    }, 400);
  };

  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    setState('submitting');
    const timeTaken = Math.floor((Date.now() - startRef.current) / 1000);
    setTotalTime(timeTaken);
    const formatted = questions.map(q => ({
      question_id: q.id,
      selected: answers[q.id] ?? -1,
    }));
    try {
      const res = await api.tournament.submitQuiz(tournament.id, {
        attempt_id: attemptId,
        answers: formatted,
        time_taken_secs: timeTaken,
      });
      setResult(res);
      setState('result');
    } catch (e) { alert(e.message); onDone(); }
  };

  if (state === 'loading') return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-reads-green" />
    </div>
  );

  if (state === 'result') {
    const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    return (
      <div className="px-4 pt-6 pb-10 animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-3xl bg-reads-gold/10 flex items-center justify-center mb-4">
            <Trophy size={44} className="text-reads-gold" />
          </div>
          <h2 className="font-display font-black text-reads-navy text-2xl">Round Complete!</h2>
          <p className="text-reads-muted text-sm mt-1">{tournament.name}</p>
        </div>
        <div className="reads-card p-5 mb-4 text-center">
          <p className="text-5xl font-black text-reads-navy mb-1">{pct}%</p>
          <p className="text-reads-muted text-sm">{result.score} / {result.total} correct</p>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="reads-card p-3 text-center">
            <p className="font-black text-reads-green text-lg">{result.points_earned}</p>
            <p className="text-reads-muted text-xs">Points</p>
          </div>
          <div className="reads-card p-3 text-center">
            <p className="font-black text-reads-navy text-lg">{result.total_points}</p>
            <p className="text-reads-muted text-xs">Total</p>
          </div>
          <div className="reads-card p-3 text-center">
            <p className="font-black text-reads-gold text-lg">{fmtTime(totalTime)}</p>
            <p className="text-reads-muted text-xs">Time</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onDone} className="reads-btn-outline flex-1">Back</button>
          <button onClick={() => { setAnswers({}); setCurrent(0); setResult(null); setState('loading');
            api.tournament.startQuiz(tournament.id).then(d => { setQs(d.questions); setAid(d.attempt_id); setState('quiz'); startRef.current = Date.now(); });
          }} className="reads-btn-primary flex-1">Play Again</button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  if (!q) return null;
  const pct = timeLeft / tournament.time_per_question;
  const timerColor = pct > 0.5 ? '#16A34A' : pct > 0.25 ? '#F59E0B' : '#EF4444';

  return (
    <div className="flex flex-col h-full px-4 pt-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <p className="text-reads-muted text-xs font-semibold">Question {current + 1} of {questions.length}</p>
          <div className="h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-reads-green rounded-full transition-all"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
          </div>
        </div>
        {/* Timer */}
        <div className="ml-4 w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `conic-gradient(${timerColor} ${pct * 360}deg, #f3f4f6 0deg)` }}>
          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
            <span className="font-black text-reads-navy text-sm">{timeLeft}</span>
          </div>
        </div>
      </div>

      {/* Anti-cheat warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4 flex items-center gap-2">
        <Shield size={14} className="text-amber-600 flex-shrink-0" />
        <p className="text-amber-700 text-[11px] font-semibold">Stay on this screen. Tab switching and copying are monitored.</p>
      </div>

      {/* Question */}
      <div className="reads-card p-5 mb-4 flex-1">
        <p className="font-bold text-reads-navy text-base leading-snug">{q.question_text}</p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {(q.options || []).map((opt, idx) => {
          const selected = answers[q.id] === idx;
          return (
            <button key={idx} onClick={() => handleAnswer(q.id, idx)}
              className={`w-full text-left px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-98 ${
                selected
                  ? 'bg-reads-green text-white shadow-lg'
                  : 'bg-white border-2 border-gray-200 text-reads-navy hover:border-reads-green'
              }`}>
              <span className="mr-2 opacity-60">{String.fromCharCode(65 + idx)}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      <button onClick={handleSubmit}
        className="mt-4 text-reads-muted text-xs text-center w-full">
        Submit early
      </button>
    </div>
  );
}

// ── Main Challenge Module ─────────────────────────────────────────────────────
export default function ChallengeModule({ user }) {
  const [view, setView]             = useState('home'); // home | leaderboard | quiz
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [tab, setTab]               = useState('active'); // active | upcoming | completed

  const load = () => {
    setLoading(true);
    api.tournament.list()
      .then(d => setTournaments(d?.tournaments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Re-load when returning from quiz
  useEffect(() => {
    if (view === 'home') load();
  }, [view]);

  if (view === 'leaderboard' && selected) {
    return <LeaderboardView tournament={selected} onBack={() => { setView('home'); setSelected(null); }} />;
  }

  if (view === 'quiz' && selected) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
          <p className="font-black text-reads-navy text-sm truncate flex-1">{selected.name}</p>
          <button onClick={() => { setView('home'); setSelected(null); }}
            className="text-reads-muted text-xs font-semibold ml-3">Exit</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <QuizView tournament={selected} onDone={() => { setView('home'); setSelected(null); }} />
        </div>
      </div>
    );
  }

  const filtered = tournaments.filter(t => {
    if (tab === 'active')    return t.status === 'active';
    if (tab === 'upcoming')  return t.status === 'upcoming';
    if (tab === 'completed') return t.status === 'completed';
    return true;
  });

  const myBestRank = tournaments.filter(t => t.my_rank).sort((a, b) => (a.my_rank || 999) - (b.my_rank || 999))[0];

  return (
    <div className="px-4 pt-4 pb-6 animate-fade-in">
      <h1 className="font-display font-black text-reads-navy text-2xl mb-1">Challenge</h1>
      <p className="text-reads-muted text-sm mb-4">Compete, earn prizes, advance through stages</p>

      {/* My best rank card */}
      {myBestRank && (
        <div className="reads-card p-4 mb-4 bg-reads-navy text-white flex items-center gap-4">
          <Crown size={32} className="text-reads-gold flex-shrink-0" />
          <div>
            <p className="font-black text-lg leading-tight">Rank #{myBestRank.my_rank}</p>
            <p className="text-white/70 text-xs">{myBestRank.name} · {myBestRank.my_points} pts</p>
          </div>
        </div>
      )}

      {/* Tab filter */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-4">
        {['active', 'upcoming', 'completed'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              tab === t ? 'bg-white text-reads-navy shadow-sm' : 'text-reads-muted'
            }`}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-reads-green" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14">
          <Trophy size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-reads-navy text-sm">No {tab} tournaments</p>
          <p className="text-reads-muted text-xs mt-1">Check back soon for new challenges.</p>
        </div>
      ) : filtered.map(t => (
        <div key={t.id}>
          <TournamentCard t={t} onStart={(t) => { setSelected(t); setView('quiz'); }} />
          <button onClick={() => { setSelected(t); setView('leaderboard'); }}
            className="w-full flex items-center justify-center gap-1.5 text-reads-green text-xs font-bold mb-3 -mt-1">
            <BarChart2 size={13} /> View Leaderboard
          </button>
        </div>
      ))}
    </div>
  );
}
