import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Loader2, User, ArrowLeft, Lightbulb, BookOpen, Zap } from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay } from '../../components/UI.jsx';

const SUGGESTIONS = [
  'Explain photosynthesis simply',
  'Help me with quadratic equations',
  'What are Newton\'s laws of motion?',
  'Summarise the causes of World War 1',
  'How does the digestive system work?',
  'Explain ionic and covalent bonding',
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

// ── Main AI Tutor Module ──────────────────────────────────────────────────────
export default function AITutorModule() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your $READS AI Tutor. I can help you understand lessons, answer exam questions, and explain concepts across all your subjects. What would you like to learn today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    api.aiTutor.getRecommendations()
      .then((d) => setRecommendations(d?.recommendations || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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

  return (
    <div className="flex flex-col h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
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
