import { useState, useEffect } from 'react';
import { BookOpen, Coins, Trophy, ArrowRight, TrendingUp, Star, Zap, ChevronRight, GraduationCap, Flame, Award, Clock, Lightbulb, Target } from 'lucide-react';
import { api } from '../../services/api.js';
import { TokenBadge, Badge, LoadingOverlay } from '../../components/UI.jsx';

const StatTile = ({ icon: Icon, value, label, bg, color }) => (
  <div className="reads-card p-3 text-center">
    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mx-auto mb-2`}>
      <Icon size={16} className={color} />
    </div>
    <p className="font-black text-reads-navy text-lg leading-none">{value}</p>
    <p className="text-reads-muted text-xs mt-0.5">{label}</p>
  </div>
);

const QuickAction = ({ icon: Icon, label, onClick, bg, iconColor }) => (
  <button onClick={onClick}
    className="flex flex-col items-center gap-2 p-4 reads-card active:scale-95 transition-transform">
    <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
      <Icon size={22} className={iconColor} />
    </div>
    <span className="text-reads-navy font-semibold text-xs text-center leading-tight">{label}</span>
  </button>
);

const LessonCard = ({ lesson, onClick }) => (
  <button onClick={() => onClick(lesson)}
    className="flex-shrink-0 w-48 reads-card p-4 text-left active:scale-95 transition-transform">
    <div className="w-9 h-9 bg-reads-green-bg rounded-xl flex items-center justify-center mb-3">
      <BookOpen size={18} className="text-reads-green" />
    </div>
    <p className="text-reads-navy font-bold text-xs leading-snug mb-2 line-clamp-2">{lesson.title}</p>
    <div className="flex items-center justify-between">
      <span className="text-reads-muted text-xs">{lesson.subject}</span>
      <TokenBadge amount={lesson.token_reward} />
    </div>
  </button>
);

// Leaderboard row — "This Week" points ranking
const LeaderboardRow = ({ entry, rank, isMe }) => (
  <div className={`flex items-center gap-3 py-2.5 px-2 rounded-xl ${isMe ? 'bg-reads-green-bg' : ''}`}>
    <span className={`w-5 text-center text-xs font-black ${rank <= 3 ? 'text-reads-gold-dark' : 'text-reads-muted'}`}>{rank}</span>
    <img src={entry.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(entry.full_name || 'U')}&backgroundColor=16a34a&fontColor=ffffff`}
      className="w-8 h-8 rounded-lg flex-shrink-0" alt="" />
    <span className={`flex-1 text-sm truncate ${isMe ? 'font-black text-reads-green' : 'font-semibold text-reads-navy'}`}>
      {isMe ? 'You' : entry.full_name}
    </span>
    <span className="text-reads-navy text-sm font-black">{(entry.points ?? 0).toLocaleString()} pts</span>
  </div>
);

// "Pick up where you stopped" — the feature card the mockup leads with
const ContinueLearningCard = ({ lesson, onClick }) => (
  <div className="reads-card p-4">
    <p className="text-reads-muted text-xs font-semibold uppercase tracking-wide mb-3">Pick up where you stopped</p>
    <div className="flex gap-3">
      <div className="w-16 h-16 bg-reads-green-bg rounded-2xl flex items-center justify-center flex-shrink-0">
        <BookOpen size={26} className="text-reads-green" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-reads-navy font-black text-sm leading-snug truncate">{lesson.title}</p>
        <p className="text-reads-muted text-xs mt-0.5">{lesson.subject}{lesson.track ? ` · ${lesson.track}` : ''}</p>
        <div className="flex items-center gap-2 mt-2">
          <TokenBadge amount={lesson.token_reward} />
          {lesson.duration_minutes && (
            <span className="text-reads-muted text-xs flex items-center gap-1">
              <Clock size={11} /> {lesson.duration_minutes} min
            </span>
          )}
        </div>
      </div>
    </div>
    <button onClick={() => onClick(lesson)}
      className="reads-btn-primary w-full mt-4 flex items-center justify-center gap-2">
      Continue Lesson <ArrowRight size={16} />
    </button>
  </div>
);

// AI-recommendation chip, sourced from api.aiTutor.getRecommendations()
const RecommendationRow = ({ rec, onClick }) => (
  <button onClick={() => onClick(rec)}
    className="flex items-center gap-3 w-full py-2.5 text-left active:scale-98 transition-transform">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
      rec.type === 'lesson' ? 'bg-reads-green-bg' : 'bg-purple-50'
    }`}>
      {rec.type === 'lesson' ? <Target size={16} className="text-reads-green" /> : <Lightbulb size={16} className="text-purple-600" />}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-reads-navy font-semibold text-sm leading-tight truncate">{rec.title}</p>
      {rec.subject && <p className="text-reads-muted text-xs mt-0.5">{rec.subject}</p>}
    </div>
    <ChevronRight size={16} className="text-reads-muted-light flex-shrink-0" />
  </button>
);

const TransactionRow = ({ tx }) => {
  const isPositive = tx.type === 'earned' || tx.type === 'received';
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isPositive ? 'bg-reads-green-bg' : 'bg-reads-red-bg'
      }`}>
        <Coins size={16} className={isPositive ? 'text-reads-green' : 'text-reads-red'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-reads-navy font-semibold text-sm truncate">{tx.description}</p>
        <p className="text-reads-muted text-xs">{new Date(tx.created_at).toLocaleDateString()}</p>
      </div>
      <span className={`font-black text-sm ${isPositive ? 'text-reads-green' : 'text-reads-red'}`}>
        {isPositive ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}
      </span>
    </div>
  );
};

export default function Dashboard({ user, wallet, onNavigate }) {
  const [recentLessons, setRecentLessons] = useState([]);
  const [recentTxs, setRecentTxs] = useState([]);
  const [stats, setStats] = useState({ lessons_completed: 0, quizzes_taken: 0, streak: 0 });
  const [badgeCount, setBadgeCount] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [lessonRes, txRes, statsRes, achievementsRes, recsRes, lbRes] = await Promise.allSettled([
          api.lessons.list({ limit: 5 }),
          api.wallet.getTransactions({ limit: 5 }),
          api.profile.getStats(),
          api.profile.getAchievements(),
          api.aiTutor.getRecommendations(),
          api.students.getLeaderboard(),
        ]);
        if (lessonRes.status === 'fulfilled') setRecentLessons(lessonRes.value?.lessons || []);
        if (txRes.status === 'fulfilled') setRecentTxs(txRes.value?.transactions || []);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value || stats);
        if (achievementsRes.status === 'fulfilled') setBadgeCount((achievementsRes.value?.achievements || []).length);
        if (recsRes.status === 'fulfilled') setRecommendations((recsRes.value?.recommendations || []).slice(0, 3));
        if (lbRes.status === 'fulfilled') setLeaderboard(lbRes.value?.entries || null);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const firstName = user?.full_name?.split(' ')[0] || 'Student';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const [continueLesson, ...upNextLessons] = recentLessons;

  return (
    <div className="px-4 pt-2 pb-4 space-y-6 animate-fade-in">

      {/* Greeting */}
      <div className="pt-2">
        <p className="text-reads-muted text-sm">{greeting}, {firstName}! 👋</p>
        <h1 className="font-display font-black text-reads-navy text-2xl leading-tight">Keep learning, keep growing.</h1>
        {user?.is_premium && (
          <Badge label="⭐ Premium" variant="gold" className="mt-1" />
        )}
      </div>

      {/* Stats row: Lessons / Streak / Badges — mirrors the Home mockup's tri-stat row */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={BookOpen} value={stats.lessons_completed ?? 0} label="Lessons" bg="bg-reads-green-bg" color="text-reads-green" />
        <StatTile icon={Flame} value={stats.streak ?? 0} label="Streak" bg="bg-amber-50" color="text-amber-600" />
        <StatTile icon={Award} value={badgeCount} label="Badges" bg="bg-reads-gold/10" color="text-reads-gold-dark" />
      </div>

      {/* Wallet Card */}
      <div className="relative bg-reads-navy rounded-3xl p-5 overflow-hidden shadow-reads-card">
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-reads-gold/10 rounded-full" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-reads-green/10 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-reads-muted-light text-xs uppercase tracking-wider">Token Balance</p>
              <p className="font-black text-reads-gold text-3xl mt-0.5">
                {(wallet?.balance ?? 0).toLocaleString()}
                <span className="text-reads-muted-light font-semibold text-base ml-1">$READS</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-reads-gold/10 rounded-2xl flex items-center justify-center">
              <Coins size={24} className="text-reads-gold" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onNavigate('wallet')}
              className="flex-1 bg-reads-gold text-reads-navy font-bold text-sm rounded-xl py-2.5 active:scale-95 transition-transform">
              Wallet
            </button>
            <button onClick={() => onNavigate('marketplace')}
              className="flex-1 bg-white/10 text-white font-bold text-sm rounded-xl py-2.5 active:scale-95 transition-transform">
              Marketplace
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-black text-reads-navy text-base mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          <QuickAction icon={BookOpen} label="Learn" onClick={() => onNavigate('learn')} bg="bg-reads-green-bg" iconColor="text-reads-green" />
          <QuickAction icon={GraduationCap} label="Exams" onClick={() => onNavigate('exams')} bg="bg-reads-navy/10" iconColor="text-reads-navy" />
          <QuickAction icon={Star} label="AI Tutor" onClick={() => onNavigate('ai-tutor')} bg="bg-purple-50" iconColor="text-purple-600" />
          <QuickAction icon={TrendingUp} label="Compete" onClick={() => onNavigate('challenge')} bg="bg-reads-gold/10" iconColor="text-reads-gold-dark" />
        </div>
      </div>

      {/* Pick up where you stopped */}
      {loading ? (
        <LoadingOverlay message="Loading lessons…" />
      ) : continueLesson ? (
        <ContinueLearningCard lesson={continueLesson} onClick={(l) => onNavigate('learn', 'lesson', l)} />
      ) : null}

      {/* Up Next — remaining lessons as a horizontal scroller */}
      {upNextLessons.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-reads-navy text-base">Up Next</h2>
            <button onClick={() => onNavigate('learn')} className="text-reads-teal text-sm font-semibold flex items-center gap-1">
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {upNextLessons.map((l) => (
              <LessonCard key={l.id} lesson={l} onClick={() => onNavigate('learn', 'lesson', l)} />
            ))}
          </div>
        </div>
      )}

      {/* AI Review — personalized recommendations */}
      {recommendations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-black text-reads-navy text-base">AI Review</h2>
              <p className="text-reads-muted text-xs">Recommendations for you</p>
            </div>
            <button onClick={() => onNavigate('ai-tutor')} className="text-reads-teal text-sm font-semibold flex items-center gap-1">
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div className="reads-card px-4 divide-y divide-gray-50">
            {recommendations.map((r) => (
              <RecommendationRow key={r.id} rec={r} onClick={() => onNavigate('ai-tutor')} />
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard — This Week */}
      {leaderboard && leaderboard.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-reads-navy text-base">Leaderboard</h2>
            <span className="text-reads-muted text-xs font-semibold">This Week</span>
          </div>
          <div className="reads-card px-3 py-1">
            {leaderboard.slice(0, 5).map((entry, i) => (
              <LeaderboardRow key={entry.user_id || i} entry={entry} rank={i + 1}
                isMe={entry.is_me || entry.user_id === user?.id} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {recentTxs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-reads-navy text-base">Recent Activity</h2>
            <button onClick={() => onNavigate('wallet')} className="text-reads-teal text-sm font-semibold flex items-center gap-1">
              See all <ChevronRight size={14} />
            </button>
          </div>
          <div className="reads-card px-4">
            {recentTxs.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
          </div>
        </div>
      )}

      {/* Premium upsell if not premium */}
      {!user?.is_premium && (
        <div className="relative bg-gradient-to-br from-reads-gold to-reads-gold-dark rounded-2xl p-4 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Star size={16} className="text-reads-navy" />
              <span className="font-black text-reads-navy text-sm">Go Premium</span>
            </div>
            <p className="text-reads-navy/70 text-xs mb-3">Earn 2× tokens on every lesson & quiz!</p>
            <button onClick={() => onNavigate('settings', 'billing')}
              className="bg-reads-navy text-reads-gold text-sm font-bold rounded-xl px-4 py-2 active:scale-95 transition-transform">
              Upgrade Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
