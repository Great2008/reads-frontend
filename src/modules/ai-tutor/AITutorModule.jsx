import { useState, useEffect, useRef } from 'react';
import {
  Send, Sparkles, Loader2, User, ArrowLeft, Lightbulb, BookOpen, Zap,
  MessageSquare, Calculator, HelpCircle, FileText, PenLine, MoreHorizontal,
  Flame, Star, CheckCircle2, ChevronRight, Crown, Sigma, FlaskConical, Leaf, Languages,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay, Toast } from '../../components/UI.jsx';

const SUGGESTIONS = [
  'Explain photosynthesis simply',
  'Help me with quadratic equations',
  'What are Newton\'s laws of motion?',
  'Summarise the causes of World War 1',
  'How does the digestive system work?',
  'Explain ionic and covalent bonding',
];

const SUBJECT_ICONS = {
  Mathematics: Sigma, Physics: Zap, Chemistry: FlaskConical,
  Biology: Leaf, English: Languages,
};

const QUICK_ACTIONS = [
  { key: 'explain',   label: 'Explain',   icon: Lightbulb,     prefill: 'Explain ' },
  { key: 'solve',     label: 'Solve',     icon: Calculator,    prefill: 'Solve this problem: ' },
  { key: 'quiz',      label: 'Quiz',      icon: HelpCircle,    prefill: 'Quiz me on ' },
  { key: 'summarize', label: 'Summarize', icon: FileText,      prefill: 'Summarize this: ' },
  { key: 'more',      label: 'More',      icon: MoreHorizontal, prefill: '' },
];

// ── Simple markdown renderer (covers Groq output) ────────────────────────────
function renderMarkdown(text) {
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '<pre class="bg-gray-100 rounded-lg p-3 my-2 text-xs overflow-x-auto whitespace-pre-wrap"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/^### (.+)$/gm, '<p class="font-bold text-reads-navy mt-3 mb-1 text-sm">$1</p>')
    .replace(/^## (.+)$/gm, '<p class="font-bold text-reads-navy mt-3 mb-1">$1</p>')
    .replace(/^# (.+)$/gm, '<p class="font-black text-reads-navy mt-3 mb-1">$1</p>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/^[-•*]\s+(.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/(<li[^>]*>[\s\S]*?<\/li>)/g, '<ul class="my-1 space-y-0.5">$1</ul>')
    .replace(/\n\n+/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
  return html;
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-end gap-2 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 ${
        isUser ? 'bg-reads-navy' : 'bg-reads-green'
      }`}>
        {isUser
          ? <User size={16} className="text-white" />
          : <Sparkles size={16} className="text-white" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-reads-navy text-white rounded-br-sm'
          : 'bg-white text-reads-navy shadow-reads-card rounded-bl-sm'
      }`}>
        {isUser
          ? <span>{msg.content}</span>
          : <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
        }
      </div>
    </div>
  );
}

// ── Thinking indicator ────────────────────────────────────────────────────────
function ThinkingBubble() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-8 h-8 rounded-full bg-reads-green flex items-center justify-center flex-shrink-0">
        <Sparkles size={16} className="text-white" />
      </div>
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-reads-card">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 bg-reads-green rounded-full animate-bounce"
              style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Recommendation Card ───────────────────────────────────────────────────────
function RecommendationCard({ rec, onClick }) {
  return (
    <button onClick={() => onClick(rec)}
      className="reads-card p-3 text-left active:scale-95 transition-transform flex-shrink-0 w-44">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
        rec.type === 'lesson' ? 'bg-reads-green-bg' : 'bg-reads-gold/10'
      }`}>
        {rec.type === 'lesson' ? <BookOpen size={16} className="text-reads-green" /> : <Zap size={16} className="text-reads-gold-dark" />}
      </div>
      <p className="text-reads-navy font-semibold text-xs leading-snug line-clamp-2">{rec.title}</p>
      <p className="text-reads-muted text-xs mt-1">{rec.subject}</p>
    </button>
  );
}

// ── Hub: quick action icon button ─────────────────────────────────────────────
function QuickActionBtn({ action, onClick }) {
  const Icon = action.icon;
  return (
    <button onClick={() => onClick(action)}
      className="flex flex-col items-center gap-1.5 w-16 flex-shrink-0 active:scale-95 transition-transform">
      <div className="w-12 h-12 bg-reads-green-bg rounded-2xl flex items-center justify-center">
        <Icon size={20} className="text-reads-green" />
      </div>
      <span className="text-reads-navy text-[10px] font-semibold">{action.label}</span>
    </button>
  );
}

// ── Hub: stat tile ───────────────────────────────────────────────────────────
function StatTile({ icon: Icon, value, label, bg, color }) {
  return (
    <div className="reads-card p-3 text-center">
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mx-auto mb-2`}>
        <Icon size={16} className={color} />
      </div>
      <p className="font-black text-reads-navy text-lg leading-none">{value}</p>
      <p className="text-reads-muted-light text-[10px] mt-1">{label}</p>
    </div>
  );
}

// ── Hub: subject chip (Popular Subjects), derived from real lesson data ───────
function SubjectChip({ subject, onClick }) {
  const Icon = SUBJECT_ICONS[subject] || BookOpen;
  return (
    <button onClick={onClick}
      className="flex-shrink-0 flex flex-col items-center gap-1.5 w-16 active:scale-95 transition-transform">
      <div className="w-11 h-11 bg-gray-100 rounded-2xl flex items-center justify-center">
        <Icon size={18} className="text-reads-navy" />
      </div>
      <span className="text-reads-muted text-[10px] font-semibold text-center leading-tight">{subject}</span>
    </button>
  );
}

// ── Hub: recent conversation row ──────────────────────────────────────────────
function ConversationRow({ conv, onClick }) {
  return (
    <button onClick={() => onClick(conv)}
      className="flex items-center gap-3 w-full py-3 text-left active:scale-98 transition-transform">
      <div className="w-9 h-9 bg-reads-green-bg rounded-xl flex items-center justify-center flex-shrink-0">
        <MessageSquare size={16} className="text-reads-green" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-reads-navy font-semibold text-sm truncate">{conv.title}</p>
        <p className="text-reads-muted text-xs">
          {conv.subject}{conv.subject ? ' · ' : ''}{conv.last_message_at ? timeAgo(conv.last_message_at) : ''}
        </p>
      </div>
      <ChevronRight size={16} className="text-reads-muted-light flex-shrink-0" />
    </button>
  );
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diffMs / 3600000);
  if (hrs < 1) return 'Just now';
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}


export default function AITutorModule({ user }) {
  const [view, setView] = useState('hub'); // hub | chat
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your $READS AI Tutor. I can help you understand lessons, answer exam questions, and explain concepts across all your subjects. What would you like to learn today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showAllPrompts, setShowAllPrompts] = useState(false);
  const [toast, setToast] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    api.aiTutor.getRecommendations()
      .then((d) => setRecommendations(d?.recommendations || []))
      .catch(() => {});
    api.aiTutor.getStats().then(setStats).catch(() => {}); // falls back to '—' tiles below until this ships
    api.aiTutor.getHistory()
      .then((d) => setHistory(d?.conversations || []))
      .catch(() => {});
    api.lessons.list()
      .then((d) => {
        const counts = {};
        (d?.lessons || []).forEach((l) => { if (l.subject) counts[l.subject] = (counts[l.subject] || 0) + 1; });
        setSubjects(Object.keys(counts).slice(0, 5));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (view === 'chat') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, view]);

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg = { role: 'user', content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const data = await api.aiTutor.chat(
        newMessages.map((m) => ({ role: m.role, content: m.content })),
        {}
      );
      setMessages([...newMessages, { role: 'assistant', content: data.reply || 'I\'m not sure about that. Try rephrasing your question.' }]);
    } catch (_) {
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickAction = (action) => {
    if (action.key === 'more') { setShowAllPrompts(true); return; }
    setView('chat');
    setInput(action.prefill);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const openConversation = (conv) => {
    if (conv.messages?.length) {
      setMessages(conv.messages);
      setView('chat');
    } else {
      // Backend doesn't return full transcripts yet — be honest instead of faking a resume.
      showToast('Full conversation history is coming soon.');
    }
  };

  // ── Hub (landing) view ─────────────────────────────────────────────────────
  if (view === 'hub') {
    return (
      <div className="px-4 pt-4 pb-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="font-display font-black text-reads-navy text-2xl">AI Tutor</h1>
          <Sparkles size={18} className="text-reads-green" />
        </div>
        <p className="text-reads-muted text-sm mb-4">Your personal AI learning companion.</p>

        {/* Quick actions */}
        <div className="flex gap-3 overflow-x-auto pb-1 mb-4 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
          {QUICK_ACTIONS.map((a) => <QuickActionBtn key={a.key} action={a} onClick={handleQuickAction} />)}
        </div>

        {/* Hello card */}
        <div className="reads-card p-4 mb-5 bg-reads-green-bg border-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-reads-green rounded-2xl flex items-center justify-center flex-shrink-0">
              <Sparkles size={22} className="text-white" />
            </div>
            <div>
              <p className="font-black text-reads-navy text-base">Hello {user?.full_name?.split(' ')[0] || 'there'}! 👋</p>
              <p className="text-reads-muted text-xs">How can I help you learn today?</p>
            </div>
          </div>
          <button onClick={() => { setView('chat'); setTimeout(() => inputRef.current?.focus(), 50); }}
            className="reads-btn-primary w-full text-sm">
            Start a Conversation
          </button>
        </div>

        {/* Popular Subjects */}
        {subjects.length > 0 && (
          <div className="mb-5">
            <p className="font-black text-reads-navy text-sm mb-2">Popular Subjects</p>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
              {subjects.map((s) => (
                <SubjectChip key={s} subject={s} onClick={() => { setView('chat'); sendMessage(`Help me understand ${s} topics`); }} />
              ))}
            </div>
          </div>
        )}

        {/* Suggested Prompts */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-black text-reads-navy text-sm">Suggested Prompts</p>
            {!showAllPrompts && (
              <button onClick={() => setShowAllPrompts(true)} className="text-reads-teal text-xs font-semibold">See more</button>
            )}
          </div>
          <div className="space-y-2">
            {(showAllPrompts ? SUGGESTIONS : SUGGESTIONS.slice(0, 3)).map((s) => (
              <button key={s} onClick={() => { setView('chat'); sendMessage(s); }}
                className="reads-card w-full px-4 py-3 text-left flex items-center justify-between active:scale-98 transition-transform">
                <span className="text-reads-navy text-sm font-medium">{s}</span>
                <ChevronRight size={15} className="text-reads-muted-light flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Learning Stats */}
        <div className="mb-5">
          <p className="font-black text-reads-navy text-sm mb-2">Learning Stats</p>
          <div className="grid grid-cols-4 gap-2">
            <StatTile icon={MessageSquare} value={stats?.questions_asked ?? '—'} label="Questions" bg="bg-reads-green-bg" color="text-reads-green" />
            <StatTile icon={BookOpen} value={stats?.topics_explored ?? '—'} label="Topics" bg="bg-purple-50" color="text-purple-600" />
            <StatTile icon={CheckCircle2} value={stats?.problems_solved ?? '—'} label="Solved" bg="bg-blue-50" color="text-blue-600" />
            <StatTile icon={Flame} value={stats?.study_streak ?? '—'} label="Streak" bg="bg-amber-50" color="text-amber-600" />
          </div>
        </div>

        {/* Recent Conversations */}
        {history.length > 0 && (
          <div className="mb-5">
            <p className="font-black text-reads-navy text-sm mb-2">Recent Conversations</p>
            <div className="reads-card px-4 divide-y divide-gray-50">
              {history.slice(0, 5).map((c) => <ConversationRow key={c.id} conv={c} onClick={openConversation} />)}
            </div>
          </div>
        )}

        {/* Upgrade to Pro */}
        {!user?.is_premium && (
          <div className="relative bg-reads-navy rounded-2xl p-4 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-reads-gold/10 rounded-full -translate-y-8 translate-x-8" />
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-1">
                <Crown size={15} className="text-reads-gold" />
                <p className="font-black text-white text-sm">Unlock the Full Power of AI Tutor</p>
              </div>
              <p className="text-white/70 text-xs mb-3">Unlimited questions, advanced explanations, file uploads, and more.</p>
              <button onClick={() => showToast('Coming soon!')}
                className="bg-reads-gold text-reads-navy text-sm font-bold rounded-xl px-4 py-2 active:scale-95 transition-transform">
                Upgrade to Pro
              </button>
            </div>
          </div>
        )}

        {toast && <Toast message={toast} type="info" onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ── Chat view ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => setView('hub')} className="text-reads-muted flex-shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 bg-reads-green rounded-xl flex items-center justify-center">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <p className="font-black text-reads-navy text-base">AI Tutor</p>
          <p className="text-reads-green text-xs font-semibold">● Online</p>
        </div>
      </div>

      {/* Recommendations strip */}
      {recommendations.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
          <p className="text-reads-muted text-xs font-semibold mb-2 flex items-center gap-1">
            <Lightbulb size={12} /> Recommended for you
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {recommendations.map((r) => (
              <RecommendationCard key={r.id} rec={r} onClick={(rec) => sendMessage(`Help me understand: ${rec.title}`)} />
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        {loading && <ThinkingBubble />}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips — shown when only initial message */}
      {messages.length === 1 && !loading && (
        <div className="px-4 pb-2">
          <p className="text-reads-muted text-xs mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => sendMessage(s)}
                className="bg-white border border-gray-200 text-reads-navy text-xs font-medium px-3 py-1.5 rounded-full active:scale-95 transition-transform shadow-sm">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 pb-safe flex items-end gap-2 flex-shrink-0">
        <textarea
          ref={inputRef}
          rows={1}
          placeholder="Ask a question…"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
          }}
          onKeyDown={handleKeyDown}
          className="reads-input flex-1 resize-none py-3 min-h-[46px]"
          style={{ overflow: 'hidden' }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="w-11 h-11 bg-reads-green rounded-xl flex items-center justify-center flex-shrink-0 active:scale-95 transition-all disabled:opacity-40 shadow-reads-green"
        >
          {loading
            ? <Loader2 size={18} className="text-white animate-spin" />
            : <Send size={18} className="text-white" />
          }
        </button>
      </div>
    </div>
  );
}
