import { useState, useEffect } from 'react';
import {
  Trophy, ArrowLeft, KeyRound, Loader2, Users, Target, Award,
  CheckCircle, XCircle, Star, Clock, ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay, EmptyState, Badge, Toast } from '../../components/UI.jsx';

const STAGE_LABEL = { school: 'School', state: 'Regional', national: 'National', global: 'Global' };

// ── How it Works step ─────────────────────────────────────────────────────────
const HowItWorksStep = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3">
    <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
      <Icon size={16} className="text-reads-gold" />
    </div>
    <div>
      <p className="text-white font-bold text-sm">{title}</p>
      <p className="text-white/60 text-xs mt-0.5">{description}</p>
    </div>
  </div>
);

// ── Leaderboard row ────────────────────────────────────────────────────────────
const LeaderboardRow = ({ entry, rank, isMe }) => (
  <div className={`flex items-center gap-3 py-3 px-3 rounded-xl ${isMe ? 'bg-reads-green-bg' : ''}`}>
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
      rank === 1 ? 'bg-reads-gold text-reads-navy' : rank === 2 ? 'bg-gray-300 text-reads-navy' : rank === 3 ? 'bg-amber-700 text-white' : 'bg-gray-100 text-reads-muted'
    }`}>
      {rank}
    </div>
    <img src={entry.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(entry.full_name || 'U')}&backgroundColor=16a34a&fontColor=ffffff`}
      className="w-8 h-8 rounded-lg flex-shrink-0" alt="" />
    <span className={`flex-1 text-sm truncate ${isMe ? 'font-black text-reads-green' : 'font-semibold text-reads-navy'}`}>
      {isMe ? 'You' : entry.full_name}
    </span>
    <span className="text-reads-navy text-sm font-black">{entry.points?.toLocaleString() ?? 0} pts</span>
  </div>
);

// ── Quiz-taking flow ──────────────────────────────────────────────────────────
function QuizView({ tournament, quiz, onFinish, onExit }) {
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const questions = quiz?.questions || [];
  const q = questions[current];
  const isLast = current === questions.length - 1;

  const selectAnswer = (val) => setAnswers((a) => ({ ...a, [q.id]: val }));

  const handleNext = async () => {
    if (!isLast) { setCurrent((c) => c + 1); return; }
    setSubmitting(true);
    try {
      const payload = {
        quiz_id: quiz.quiz_id,
        answers: Object.entries(answers).map(([question_id, answer]) => ({ question_id, answer })),
      };
      const result = await api.tournament.submitQuiz(tournament.id, payload);
      onFinish(result);
    } catch (e) {
      onFinish({ error: e.message || 'Could not submit your quiz. Please try again.' });
    } finally { setSubmitting(false); }
  };

  if (!q) return (
    <div className="px-4 pt-8 text-center">
      <p className="text-reads-muted text-sm">This quiz has no questions available right now.</p>
      <button onClick={onExit} className="reads-btn-outline mt-4 px-6 py-2 text-sm">Back</button>
    </div>
  );

  return (
    <div className="px-4 pt-4 pb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onExit} className="text-reads-muted text-sm font-semibold flex items-center gap-1">
          <ArrowLeft size={16} /> Exit
        </button>
        <span className="text-reads-muted text-xs font-bold">Question {current + 1} of {questions.length}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full mb-5 overflow-hidden">
        <div className="h-full bg-reads-green transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="reads-card p-4 mb-4">
        <p className="font-bold text-reads-navy text-base leading-snug">{q.question}</p>
      </div>

      <div className="space-y-2 mb-6">
        {(q.options || []).map((opt, i) => (
          <button key={i} onClick={() => selectAnswer(opt)}
            className={`w-full text-left px-4 py-3 rounded-2xl border-2 transition-all ${
              answers[q.id] === opt ? 'border-reads-green bg-reads-green-bg text-reads-navy font-bold' : 'border-gray-100 text-reads-navy'
            }`}>
            {opt}
          </button>
        ))}
      </div>

      <button onClick={handleNext} disabled={answers[q.id] == null || submitting}
        className="reads-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40">
        {submitting && <Loader2 size={16} className="animate-spin" />}
        {isLast ? 'Submit Quiz' : 'Next Question'}
      </button>
    </div>
  );
}

// ── Quiz result screen ────────────────────────────────────────────────────────
function QuizResult({ result, onDone }) {
  if (result.error) {
    return (
      <div className="px-4 pt-16 text-center animate-fade-in">
        <XCircle size={48} className="text-reads-red mx-auto mb-4" />
        <p className="font-black text-reads-navy text-lg">Submission Failed</p>
        <p className="text-reads-muted text-sm mt-2">{result.error}</p>
        <button onClick={onDone} className="reads-btn-primary mt-6 px-8">Back</button>
      </div>
    );
  }
  const passed = result.passed ?? (result.score >= 50);
  return (
    <div className="px-4 pt-16 text-center animate-fade-in">
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-reads-green-bg' : 'bg-reads-red-bg'}`}>
        {passed ? <CheckCircle size={40} className="text-reads-green" /> : <XCircle size={40} className="text-reads-red" />}
      </div>
      <p className="font-black text-reads-navy text-xl">{passed ? 'Quiz Complete!' : 'Quiz Submitted'}</p>
      {result.score != null && <p className="text-reads-muted text-sm mt-2">Score: {result.score}%</p>}
      <div className="flex justify-center gap-4 mt-4">
        {result.points_earned != null && (
          <div className="reads-card px-4 py-3">
            <p className="font-black text-reads-navy text-lg">{result.points_earned}</p>
            <p className="text-reads-muted-light text-[10px]">Points</p>
          </div>
        )}
        {result.fair_points_earned != null && (
          <div className="reads-card px-4 py-3">
            <p className="font-black text-reads-navy text-lg">{result.fair_points_earned}</p>
            <p className="text-reads-muted-light text-[10px]">Fair Points</p>
          </div>
        )}
      </div>
      <button onClick={onDone} className="reads-btn-primary mt-8 px-8">Done</button>
    </div>
  );
}

// ── Active tournament overview ────────────────────────────────────────────────
function TournamentOverview({ t, onBack, showToast }) {
  const [view, setView] = useState('overview'); // overview | leaderboard | quiz | result
  const [leaderboard, setLeaderboard] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  const loadLeaderboard = async () => {
    setLoading(true); setView('leaderboard');
    try {
      const d = await api.tournament.getLeaderboard(t.id);
      setLeaderboard(d?.leaderboard || d?.standings || []);
    } catch (_) { setLeaderboard([]); }
    setLoading(false);
  };

  const handleStartQuiz = async () => {
    setStarting(true);
    try {
      const d = await api.tournament.startQuiz(t.id);
      setQuiz(d);
      setView('quiz');
    } catch (e) {
      showToast(e.message || "This tournament's quiz isn't available right now.", 'error');
    } finally { setStarting(false); }
  };

  if (view === 'quiz' && quiz) {
    return (
      <QuizView tournament={t} quiz={quiz}
        onFinish={(r) => { setResult(r); setView('result'); }}
        onExit={() => setView('overview')} />
    );
  }
  if (view === 'result' && result) {
    return <QuizResult result={result} onDone={() => { setResult(null); setView('overview'); }} />;
  }

  return (
    <div className="px-4 pt-4 pb-8 animate-fade-in">
      <button onClick={view === 'leaderboard' ? () => setView('overview') : onBack}
        className="flex items-center gap-1.5 text-reads-muted text-sm font-semibold mb-4">
        <ArrowLeft size={16} /> {view === 'leaderboard' ? 'Back to Tournament' : 'Back'}
      </button>

      {view === 'overview' && (
        <>
          <div className="relative bg-reads-navy rounded-2xl p-5 mb-5 overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-reads-gold/10 rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={20} className="text-reads-gold" />
                {t.stage && <Badge label={STAGE_LABEL[t.stage] || t.stage} variant="gold" />}
              </div>
              <p className="font-display font-black text-white text-xl">{t.name}</p>
              {t.status && <p className="text-white/60 text-xs mt-1 capitalize">{t.status}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <button onClick={handleStartQuiz} disabled={starting}
              className="reads-btn-primary flex items-center justify-center gap-2 py-3">
              {starting ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />}
              Start Quiz
            </button>
            <button onClick={loadLeaderboard} className="reads-btn-outline flex items-center justify-center gap-2 py-3">
              <Users size={16} /> Leaderboard
            </button>
          </div>

          {(t.prize_tokens || t.points_per_correct || t.questions_per_round) && (
            <div className="reads-card p-4">
              <p className="font-black text-reads-navy text-sm mb-3">Tournament Details</p>
              <div className="space-y-2">
                {t.questions_per_round && (
                  <div className="flex justify-between text-sm">
                    <span className="text-reads-muted">Questions per quiz</span>
                    <span className="text-reads-navy font-semibold">{t.questions_per_round}</span>
                  </div>
                )}
                {t.prize_tokens && (
                  <div className="flex justify-between text-sm">
                    <span className="text-reads-muted">Star Prize</span>
                    <span className="text-reads-navy font-semibold">{t.prize_tokens.toLocaleString()} $READS</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {view === 'leaderboard' && (
        loading ? <LoadingOverlay message="Loading leaderboard…" /> :
        leaderboard.length === 0 ? (
          <EmptyState icon={Users} title="No rankings yet" description="Be the first to take a quiz and claim the top spot." />
        ) : (
          <div className="reads-card px-2 py-1">
            {leaderboard.map((entry, i) => (
              <LeaderboardRow key={entry.user_id || i} entry={entry} rank={i + 1} isMe={entry.is_me} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ── Access code entry / landing ───────────────────────────────────────────────
export default function TournamentModule() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const load = () => {
    api.tournament.list()
      .then((d) => setTournaments(d?.tournaments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleRedeem = async () => {
    if (!code.trim()) return;
    setRedeeming(true);
    try {
      await api.tournament.redeemAccessCode(code.trim());
      showToast('Access code accepted! Tournament unlocked.');
      setCode('');
      load();
    } catch (e) {
      showToast(e.message || "Access codes aren't supported yet — check back soon.", 'error');
    } finally { setRedeeming(false); }
  };

  if (selected) {
    return <TournamentOverview t={selected} onBack={() => setSelected(null)} showToast={showToast} />;
  }

  const activeTournaments = tournaments.filter((t) => t.status === 'active');

  return (
    <div className="px-4 pt-4 pb-8 animate-fade-in">
      <h1 className="font-display font-black text-reads-navy text-2xl mb-1">Smart User Challenge</h1>
      <p className="text-reads-muted text-sm mb-4">The annual $READS quiz tournament for smart learners.</p>

      {/* Hero banner */}
      <div className="relative bg-reads-navy rounded-2xl p-5 mb-5 overflow-hidden text-center">
        <div className="absolute -top-8 -left-8 w-32 h-32 bg-reads-gold/10 rounded-full" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-reads-green/10 rounded-full" />
        <div className="relative z-10">
          <Trophy size={36} className="text-reads-gold mx-auto mb-2" />
          <p className="font-black text-white text-base">The ultimate quiz tournament for smart learners!</p>
        </div>
      </div>

      {/* Your active tournaments */}
      {loading ? (
        <LoadingOverlay message="Checking for tournaments…" />
      ) : activeTournaments.length > 0 ? (
        <div className="mb-5">
          <p className="font-black text-reads-navy text-sm mb-2">Your Tournaments</p>
          {activeTournaments.map((t) => (
            <button key={t.id} onClick={() => setSelected(t)}
              className="reads-card w-full p-4 mb-2 flex items-center gap-3 text-left active:scale-98 transition-transform">
              <div className="w-10 h-10 bg-reads-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trophy size={18} className="text-reads-gold-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-reads-navy text-sm truncate">{t.name}</p>
                {t.stage && <p className="text-reads-muted text-xs">{STAGE_LABEL[t.stage] || t.stage} Stage</p>}
              </div>
              <ChevronRight size={16} className="text-reads-muted-light flex-shrink-0" />
            </button>
          ))}
        </div>
      ) : null}

      {/* How it Works */}
      <div className="bg-reads-navy rounded-2xl p-5 mb-5 space-y-4">
        <p className="text-reads-gold text-xs font-bold uppercase tracking-wide">How it Works</p>
        <HowItWorksStep icon={Star} title="Qualify from your school"
          description="Top 10 from each school + top 10 non-school users per region." />
        <HowItWorksStep icon={Target} title="Compete & Earn Points"
          description="Answer quizzes, earn points, and climb the leaderboard." />
        <HowItWorksStep icon={Award} title="Win Amazing Prizes"
          description="Top performers win exciting prizes and certificates." />
      </div>

      {/* Access code entry */}
      <div className="reads-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound size={16} className="text-reads-green" />
          <p className="font-black text-reads-navy text-sm">Enter Access Code</p>
        </div>
        <p className="text-reads-muted text-xs mb-3">
          Qualified learners receive an access code by notification when a tournament round opens.
        </p>
        <div className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. RD-2026-XXXX" className="reads-input flex-1 tracking-wider font-mono text-sm" />
          <button onClick={handleRedeem} disabled={redeeming || !code.trim()}
            className="reads-btn-primary px-5 flex items-center gap-2 disabled:opacity-40">
            {redeeming && <Loader2 size={14} className="animate-spin" />} Enter
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
