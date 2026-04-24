import { useState, useEffect } from 'react';
import {
  Trophy, Zap, Users, ChevronRight, Star, Target,
  Lock, CheckCircle, Crown, ArrowLeft, Loader2, Medal
} from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay, EmptyState, Badge, TokenBadge, Toast } from '../../components/UI.jsx';

const TIER_META = {
  school:   { label: 'School',   icon: '🏫', color: 'text-reads-green',     bg: 'bg-reads-green-bg',  gradient: 'from-green-500 to-emerald-600' },
  state:    { label: 'State',    icon: '🏙️', color: 'text-reads-gold-dark', bg: 'bg-reads-gold/10',   gradient: 'from-amber-400 to-yellow-500' },
  national: { label: 'National', icon: '🇳🇬', color: 'text-reads-teal',     bg: 'bg-teal-50',         gradient: 'from-teal-500 to-cyan-600' },
  global:   { label: 'Global',   icon: '🌍', color: 'text-purple-600',       bg: 'bg-purple-50',       gradient: 'from-purple-500 to-violet-600' },
};

const AGE_BRACKETS = [
  { value: 'u15',  label: 'U-15' },
  { value: 'u17',  label: 'U-17' },
  { value: 'u21',  label: 'U-21' },
  { value: 'open', label: 'Open' },
];

// ── Leaderboard Row ───────────────────────────────────────────────────────────
function LeaderboardRow({ entry, rank, isMe }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  return (
    <div className={`flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 ${isMe ? 'bg-reads-green-bg/30 -mx-4 px-4 rounded-xl' : ''}`}>
      <div className="w-8 text-center flex-shrink-0">
        {medals[rank] ? (
          <span className="text-lg">{medals[rank]}</span>
        ) : (
          <span className="font-black text-reads-muted text-sm">#{rank}</span>
        )}
      </div>
      <img
        src={entry.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(entry.full_name)}&backgroundColor=16a34a&fontColor=ffffff`}
        alt={entry.full_name}
        className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm truncate ${isMe ? 'text-reads-green' : 'text-reads-navy'}`}>
          {entry.full_name} {isMe && '(You)'}
        </p>
        <p className="text-reads-muted text-xs">{entry.school_name || entry.state || 'Independent'}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-black text-reads-navy text-sm">{entry.score?.toLocaleString()}</p>
        <p className="text-reads-muted-light text-xs">pts</p>
      </div>
    </div>
  );
}

// ── Challenge Card ────────────────────────────────────────────────────────────
function ChallengeCard({ tier, bracket, onJoin, joined }) {
  const meta = TIER_META[tier] || TIER_META.school;
  return (
    <div className={`relative bg-gradient-to-br ${meta.gradient} rounded-3xl p-5 text-white overflow-hidden mb-3`}>
      <div className="absolute -top-6 -right-6 text-7xl opacity-20">{meta.icon}</div>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-black text-xl">{meta.label} Challenge</p>
            <p className="text-white/80 text-sm">{bracket?.label} Bracket</p>
          </div>
          {joined ? (
            <span className="flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <CheckCircle size={12} /> Joined
            </span>
          ) : (
            <button onClick={onJoin}
              className="bg-white text-reads-navy font-bold text-sm px-4 py-2 rounded-xl active:scale-95 transition-transform">
              Join
            </button>
          )}
        </div>
        <div className="flex gap-4 text-sm">
          <div>
            <p className="font-black text-lg">24h</p>
            <p className="text-white/70 text-xs">Duration</p>
          </div>
          <div>
            <p className="font-black text-lg">500+</p>
            <p className="text-white/70 text-xs">Prize Pool</p>
          </div>
          <div>
            <p className="font-black text-lg">40</p>
            <p className="text-white/70 text-xs">Questions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Challenges Module ────────────────────────────────────────────────────
export default function ChallengesModule({ user, tokenBalance, onUpdateBalance }) {
  const [tab, setTab] = useState('challenges'); // challenges | leaderboard
  const [selectedTier, setSelectedTier] = useState('school');
  const [selectedBracket, setSelectedBracket] = useState('u21');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/challenges/leaderboard?tier=${selectedTier}&bracket=${selectedBracket}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } }
      );
      const data = await res.json();
      setLeaderboard(data?.entries || []);
    } catch (_) {
      // Use mock data for now
      setLeaderboard([
        { id: '1', full_name: 'Adaeze Okonkwo', score: 9840, school_name: 'FGGC Abuja' },
        { id: '2', full_name: 'Emeka Nwachukwu', score: 9620, school_name: 'Kings College Lagos' },
        { id: '3', full_name: 'Fatima Ibrahim', score: 9410, state: 'Kano State' },
        { id: '4', full_name: 'Chuka Okafor', score: 9200, school_name: 'GRA Secondary School' },
        { id: '5', full_name: 'Amina Suleiman', score: 8990, state: 'Kaduna State' },
        { id: '6', full_name: user?.full_name || 'You', score: 7650, school_name: 'Your School' },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tab === 'leaderboard') loadLeaderboard();
  }, [tab, selectedTier, selectedBracket]);

  const handleJoin = async (tier) => {
    try {
      await fetch(`/api/challenges/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ tier, bracket: selectedBracket }),
      });
      setJoined((j) => ({ ...j, [tier]: true }));
      showToast(`Joined ${TIER_META[tier].label} Challenge!`);
    } catch (e) {
      showToast(e.message || 'Failed to join.', 'error');
    }
  };

  const myRank = leaderboard.findIndex((e) => e.id === user?.id || e.full_name === user?.full_name) + 1;

  return (
    <div className="px-4 pt-4 pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 bg-reads-gold/10 rounded-xl flex items-center justify-center">
          <Trophy size={22} className="text-reads-gold-dark" />
        </div>
        <div>
          <h1 className="font-display font-black text-reads-navy text-xl">Challenges</h1>
          <p className="text-reads-muted text-xs">Compete · Earn · Rise</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[{ key: 'challenges', label: 'Active Challenges' }, { key: 'leaderboard', label: 'Leaderboard' }].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
              tab === key ? 'bg-reads-navy text-white' : 'bg-gray-100 text-reads-muted'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Age bracket filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {AGE_BRACKETS.map(({ value, label }) => (
          <button key={value} onClick={() => setSelectedBracket(value)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold flex-shrink-0 transition-all ${
              selectedBracket === value ? 'bg-reads-gold text-reads-navy' : 'bg-gray-100 text-reads-muted'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'challenges' && (
        <div>
          {/* My rank card */}
          {user && (
            <div className="reads-card p-4 mb-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-reads-gold/10 rounded-2xl flex items-center justify-center">
                <Medal size={24} className="text-reads-gold-dark" />
              </div>
              <div className="flex-1">
                <p className="font-black text-reads-navy text-sm">Your current rank</p>
                <p className="text-reads-muted text-xs">School Challenge · {AGE_BRACKETS.find((b) => b.value === selectedBracket)?.label}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-reads-navy text-2xl">#{user.rank || '—'}</p>
              </div>
            </div>
          )}

          {/* Challenge tiers */}
          {Object.keys(TIER_META).map((tier) => (
            <ChallengeCard
              key={tier}
              tier={tier}
              bracket={AGE_BRACKETS.find((b) => b.value === selectedBracket)}
              onJoin={() => handleJoin(tier)}
              joined={joined[tier]}
            />
          ))}

          {/* How it works */}
          <div className="reads-card p-4 mt-2">
            <p className="font-bold text-reads-navy text-sm mb-2 flex items-center gap-2">
              <Target size={16} className="text-reads-green" /> How It Works
            </p>
            <div className="space-y-2 text-reads-muted text-xs leading-relaxed">
              <p>1. Join a challenge in your age bracket</p>
              <p>2. Answer 40 questions in 24 hours</p>
              <p>3. Top scorers advance: School → State → National → Global</p>
              <p>4. Winners earn $READS tokens and NFT trophies</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'leaderboard' && (
        <div>
          {/* Tier selector */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {Object.entries(TIER_META).map(([tier, meta]) => (
              <button key={tier} onClick={() => setSelectedTier(tier)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold flex-shrink-0 transition-all ${
                  selectedTier === tier ? `${meta.bg} ${meta.color}` : 'bg-gray-100 text-reads-muted'
                }`}>
                <span>{meta.icon}</span> {meta.label}
              </button>
            ))}
          </div>

          {loading ? <LoadingOverlay /> : (
            <>
              {/* User rank summary */}
              {myRank > 0 && (
                <div className="bg-reads-green-bg border border-reads-green/20 rounded-2xl px-4 py-3 mb-3 flex items-center justify-between">
                  <p className="text-reads-green font-bold text-sm">Your Rank</p>
                  <p className="font-black text-reads-green text-xl">#{myRank}</p>
                </div>
              )}

              <div className="reads-card px-4">
                {leaderboard.length === 0 ? (
                  <EmptyState icon={Trophy} title="No data yet" description="Be the first to compete!" />
                ) : (
                  leaderboard.map((entry, i) => (
                    <LeaderboardRow
                      key={entry.id || i}
                      entry={entry}
                      rank={i + 1}
                      isMe={entry.id === user?.id || entry.full_name === user?.full_name}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
