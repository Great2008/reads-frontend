import { useState, useEffect, useRef } from 'react';
import {
  GraduationCap, Star, Clock, Calendar, MessageSquare,
  ChevronRight, Search, Loader2, ArrowLeft, Coins,
  CheckCircle, XCircle, MessageCircle, AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay, EmptyState, Badge, Modal, Toast, TokenBadge } from '../../components/UI.jsx';

// ── Tutor Card ────────────────────────────────────────────────────────────────
function TutorCard({ tutor, onClick }) {
  return (
    <button onClick={() => onClick(tutor)}
      className="reads-card p-4 mb-3 w-full text-left active:scale-98 transition-transform">
      <div className="flex items-start gap-3">
        <img
          src={tutor.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(tutor.full_name)}&backgroundColor=16a34a&fontColor=ffffff`}
          alt={tutor.full_name}
          className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <p className="font-black text-reads-navy text-base">{tutor.full_name}</p>
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <Star size={13} className="text-reads-gold fill-reads-gold" />
              <span className="text-reads-navy font-bold text-sm">{tutor.rating?.toFixed(1) || '5.0'}</span>
            </div>
          </div>
          <p className="text-reads-muted text-xs mt-0.5">{tutor.specialization}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tutor.subjects?.slice(0, 3).map((s) => (
              <Badge key={s} label={s} variant="gray" />
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-reads-muted text-xs">
          <Clock size={13} /> <span>{tutor.sessions_completed || 0} sessions</span>
        </div>
        <TokenBadge amount={tutor.rate_per_hour} />
      </div>
    </button>
  );
}

// ── Book Session Modal ────────────────────────────────────────────────────────
function BookModal({ tutor, onClose, onBooked }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState(60);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cost = Math.round((duration / 60) * (tutor.rate_per_hour || 100));

  const handle = async () => {
    if (!date || !time || !subject) return setError('Fill in date, time and subject.');
    setLoading(true); setError('');
    try {
      await api.tutors.book(tutor.id, {
        scheduled_at: `${date}T${time}:00`,
        subject,
        duration_minutes: duration,
        note,
      });
      onBooked(cost);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <Modal title={`Book ${tutor.full_name}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="reads-label">Date</label>
            <input type="date" className="reads-input"
              min={new Date().toISOString().split('T')[0]}
              value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="reads-label">Time</label>
            <input type="time" className="reads-input"
              value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="reads-label">Subject</label>
          <select className="reads-input" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">Select subject…</option>
            {tutor.subjects?.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="reads-label">Duration</label>
          <div className="flex gap-2">
            {[30, 60, 90, 120].map((d) => (
              <button key={d} onClick={() => setDuration(d)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                  duration === d ? 'bg-reads-green text-white' : 'bg-gray-100 text-reads-muted'
                }`}>
                {d < 60 ? `${d}m` : `${d / 60}h`}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="reads-label">Note (optional)</label>
          <textarea className="reads-input resize-none" rows={2} placeholder="Topics to cover…"
            value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="bg-reads-gold/10 border border-reads-gold/20 rounded-xl p-3 flex items-center justify-between">
          <span className="text-reads-navy text-sm font-semibold">Session Cost</span>
          <TokenBadge amount={cost} size="lg" />
        </div>
        {error && <p className="text-reads-red text-sm">{error}</p>}
        <button onClick={handle} disabled={loading}
          className="reads-btn-gold w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={18} className="animate-spin" />}
          Confirm Booking
        </button>
      </div>
    </Modal>
  );
}

// ── Tutor Detail View ─────────────────────────────────────────────────────────
function TutorDetail({ tutor, onBack, onBooked }) {
  const [showBook, setShowBook] = useState(false);
  const [toast, setToast] = useState(null);

  const handleBooked = (cost) => {
    setShowBook(false);
    setToast({ msg: `Session booked! ${cost} $READS held in escrow.`, type: 'success' });
    setTimeout(() => { setToast(null); onBooked?.(); }, 3000);
  };

  return (
    <div className="px-4 pt-4 pb-6 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1.5 text-reads-muted text-sm mb-4">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Profile */}
      <div className="reads-card p-5 mb-4">
        <div className="flex items-start gap-4 mb-4">
          <img
            src={tutor.avatar_url || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(tutor.full_name)}&backgroundColor=16a34a&fontColor=ffffff`}
            alt={tutor.full_name}
            className="w-20 h-20 rounded-2xl object-cover"
          />
          <div>
            <h2 className="font-display font-black text-reads-navy text-xl">{tutor.full_name}</h2>
            <p className="text-reads-muted text-sm">{tutor.specialization}</p>
            <div className="flex items-center gap-1 mt-1">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} size={14} className={i <= Math.round(tutor.rating || 5) ? 'text-reads-gold fill-reads-gold' : 'text-gray-200'} />
              ))}
              <span className="text-reads-muted text-xs ml-1">({tutor.review_count || 0} reviews)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Sessions', value: tutor.sessions_completed || 0 },
            { label: 'Rating', value: tutor.rating?.toFixed(1) || '5.0' },
            { label: 'Rate/hr', value: `${tutor.rate_per_hour} ₿` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="font-black text-reads-navy text-lg">{value}</p>
              <p className="text-reads-muted text-xs">{label}</p>
            </div>
          ))}
        </div>

        {tutor.bio && (
          <div>
            <p className="font-bold text-reads-navy text-sm mb-1">About</p>
            <p className="text-reads-muted text-sm leading-relaxed">{tutor.bio}</p>
          </div>
        )}
      </div>

      {/* Subjects */}
      {tutor.subjects?.length > 0 && (
        <div className="reads-card p-4 mb-4">
          <p className="font-bold text-reads-navy text-sm mb-2">Subjects</p>
          <div className="flex flex-wrap gap-2">
            {tutor.subjects.map((s) => <Badge key={s} label={s} variant="green" />)}
          </div>
        </div>
      )}

      {/* Qualifications */}
      {tutor.qualifications?.length > 0 && (
        <div className="reads-card p-4 mb-5">
          <p className="font-bold text-reads-navy text-sm mb-2">Qualifications</p>
          <ul className="space-y-1">
            {tutor.qualifications.map((q, i) => (
              <li key={i} className="flex items-center gap-2 text-reads-muted text-sm">
                <CheckCircle size={14} className="text-reads-green flex-shrink-0" /> {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={() => setShowBook(true)} className="reads-btn-gold w-full">
        Book a Session
      </button>

      {showBook && <BookModal tutor={tutor} onClose={() => setShowBook(false)} onBooked={handleBooked} />}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}



// ── Session Chat Modal (student side) ─────────────────────────────────────────
function StudentChatModal({ session, onClose }) {
  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const [lastSince, setLastSince] = useState(null);
  const bottomRef                 = useRef(null);

  const load = async (since = null) => {
    try {
      const d = await api.tutors.getMessages(session.id, since);
      if (since) setMessages(prev => [...prev, ...(d.messages || [])]);
      else setMessages(d.messages || []);
      if (d.messages?.length) setLastSince(d.messages[d.messages.length - 1].created_at);
    } catch (_) {}
  };

  useEffect(() => {
    load();
    const iv = setInterval(() => load(lastSince), 5000);
    return () => clearInterval(iv);
  }, [session.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await api.tutors.sendMessage(session.id, text.trim());
      setMessages(prev => [...prev, msg]);
      setText('');
    } catch (_) {} finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-xl bg-gray-100">
          <XCircle size={18} className="text-reads-muted" />
        </button>
        <div>
          <p className="font-black text-reads-navy text-sm">{session.tutor_name}</p>
          <p className="text-reads-muted text-xs">{session.subject}</p>
        </div>
      </div>
      {/* Messages — pb-24 clears the fixed input bar */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-reads-muted text-sm pt-8">No messages yet. Say hello!</p>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm ${
              m.is_mine ? 'bg-reads-green text-white rounded-br-sm' : 'bg-gray-100 text-reads-navy rounded-bl-sm'
            }`}>
              <p>{m.content}</p>
              <p className={`text-[10px] mt-1 ${m.is_mine ? 'text-white/60' : 'text-reads-muted'}`}>
                {new Date(m.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {/* Input — fixed above bottom nav (z-60 beats nav z-50) */}
      <div className="fixed bottom-0 left-0 right-0 z-60 px-4 py-3 border-t border-gray-100 flex gap-2 bg-white"
           style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
        <input className="flex-1 reads-input" placeholder="Type a message…"
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} />
        <button onClick={send} disabled={sending || !text.trim()}
          className="bg-reads-green text-white px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center">
          {sending ? <Loader2 size={16} className="animate-spin" /> : 'Send'}
        </button>
      </div>
    </div>
  );
}

// ── Rate Modal ────────────────────────────────────────────────────────────────
function RateModal({ session, onClose, onRated }) {
  const [stars, setStars]     = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handle = async () => {
    setLoading(true);
    try {
      await api.tutors.rateSession(session.id, stars, comment);
      onRated();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up p-5 space-y-4">
        <h3 className="font-black text-reads-navy text-base">Rate {session.tutor_name}</h3>
        <div className="flex gap-2 justify-center">
          {[1,2,3,4,5].map(s => (
            <button key={s} onClick={() => setStars(s)}>
              <Star size={32} className={s <= stars ? 'text-reads-gold' : 'text-gray-200'}
                fill={s <= stars ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
        <textarea className="reads-input resize-none" rows={3}
          placeholder="Leave a comment (optional)..."
          value={comment} onChange={e => setComment(e.target.value)} />
        {error && <p className="text-reads-red text-sm">{error}</p>}
        <button onClick={handle} disabled={loading}
          className="reads-btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={16} className="animate-spin" />}
          Submit Rating
        </button>
      </div>
    </div>
  );
}

// ── Dispute Modal ─────────────────────────────────────────────────────────────
function DisputeModal({ session, onClose, onDisputed }) {
  const [reason, setReason]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handle = async () => {
    if (!reason.trim()) return setError('Please provide a reason.');
    setLoading(true);
    try {
      await api.tutors.disputeSession(session.id, reason);
      onDisputed();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up p-5 space-y-4">
        <h3 className="font-black text-reads-navy text-base">Raise Dispute</h3>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-amber-700 text-xs font-semibold">
            Admin will review the session and full chat history. If approved, tutor gets paid. If rejected, you get a full refund.
          </p>
        </div>
        <textarea className="reads-input resize-none" rows={4}
          placeholder="Describe the issue clearly…"
          value={reason} onChange={e => setReason(e.target.value)} />
        {error && <p className="text-reads-red text-sm">{error}</p>}
        <button onClick={handle} disabled={loading}
          className="reads-btn-primary w-full flex items-center justify-center gap-2 bg-reads-red">
          {loading && <Loader2 size={16} className="animate-spin" />}
          Submit Dispute
        </button>
      </div>
    </div>
  );
}

// ── My Sessions (student) ─────────────────────────────────────────────────────
function MySessionsView({ onBack }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [chatSession, setChatSession] = useState(null);
  const [rateSession, setRateSession] = useState(null);
  const [disputeSession, setDisputeSession] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = () => {
    setLoading(true);
    api.tutors.getSessions()
      .then(d => setSessions(d?.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleConfirm = async (id) => {
    try {
      const res = await api.tutors.confirmSession(id);
      showToast(res.message);
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const ST = {
    pending:    { bg: 'bg-amber-50',  text: 'text-amber-600',  label: 'Pending'    },
    confirmed:  { bg: 'bg-blue-50',   text: 'text-reads-navy', label: 'Confirmed'  },
    completing: { bg: 'bg-purple-50', text: 'text-purple-600', label: 'Needs Your Confirmation' },
    completed:  { bg: 'bg-green-100', text: 'text-reads-green',label: 'Completed'  },
    cancelled:  { bg: 'bg-gray-100',  text: 'text-gray-500',   label: 'Cancelled'  },
    disputed:   { bg: 'bg-red-50',    text: 'text-reads-red',  label: 'Disputed'   },
  };

  return (
    <div className="px-4 pt-4 pb-6 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-reads-muted text-sm mb-4">← Back</button>
      <h1 className="font-black text-reads-navy text-2xl mb-4">My Sessions</h1>

      {loading ? <LoadingOverlay message="Loading sessions…" />
      : sessions.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No sessions yet"
          description="Book a tutor session to get started." />
      ) : (
        <div className="space-y-3">
          {sessions.map(s => {
            const st = ST[s.status] || ST.pending;
            return (
              <div key={s.id} className="reads-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-reads-navy text-sm">{s.subject}</p>
                    <p className="text-reads-muted text-xs">{s.tutor_name}</p>
                    <p className="text-reads-muted text-xs flex items-center gap-1 mt-0.5">
                      <Clock size={11} />
                      {new Date(s.scheduled_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      · {s.duration_minutes} mins
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${st.bg} ${st.text}`}>
                    {st.label}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 flex-wrap gap-2">
                  <span className="text-reads-gold font-black text-sm">{s.cost_tokens} $READS</span>
                  <div className="flex gap-2 flex-wrap">
                    {(s.status === 'confirmed' || s.status === 'completing') && (
                      <button onClick={() => setChatSession(s)}
                        className="flex items-center gap-1 text-reads-navy text-xs font-bold px-3 py-1.5 bg-gray-100 rounded-lg">
                        <MessageCircle size={12} /> Chat
                      </button>
                    )}
                    {s.status === 'completing' && (
                      <>
                        <button onClick={() => handleConfirm(s.id)}
                          className="flex items-center gap-1 text-reads-green text-xs font-bold px-3 py-1.5 bg-reads-green-bg rounded-lg">
                          <CheckCircle size={12} /> Confirm
                        </button>
                        <button onClick={() => setDisputeSession(s)}
                          className="flex items-center gap-1 text-reads-red text-xs font-bold px-3 py-1.5 bg-red-50 rounded-lg">
                          <AlertTriangle size={12} /> Dispute
                        </button>
                      </>
                    )}
                    {s.status === 'completed' && !s.already_rated && (
                      <button onClick={() => setRateSession(s)}
                        className="flex items-center gap-1 text-reads-gold text-xs font-bold px-3 py-1.5 bg-amber-50 rounded-lg">
                        <Star size={12} /> Rate
                      </button>
                    )}
                    {s.status === 'completed' && s.already_rated && (
                      <span className="text-reads-muted text-xs italic">Rated ✓</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {chatSession     && <StudentChatModal session={chatSession} onClose={() => setChatSession(null)} />}
      {rateSession     && <RateModal session={rateSession} onClose={() => setRateSession(null)} onRated={() => { setRateSession(null); showToast('Rating submitted!'); load(); }} />}
      {disputeSession  && <DisputeModal session={disputeSession} onClose={() => setDisputeSession(null)} onDisputed={() => { setDisputeSession(null); showToast('Dispute raised. Admin will review.'); load(); }} />}
      {toast && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold ${
          toast.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-reads-green'
        }`}>{toast.msg}</div>
      )}
    </div>
  );
}

// ── Main Tutors Module ────────────────────────────────────────────────────────
export default function TutorsModule({ tokenBalance, onUpdateBalance }) {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('browse'); // browse | sessions

  useEffect(() => {
    api.tutors.list()
      .then((d) => setTutors(d?.tutors || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = tutors.filter((t) =>
    !search ||
    t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.specialization?.toLowerCase().includes(search.toLowerCase()) ||
    t.subjects?.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  if (selected) {
    return (
      <TutorDetail
        tutor={selected}
        onBack={() => setSelected(null)}
        onBooked={async () => {
          const newBal = await api.wallet.getBalance();
          onUpdateBalance?.(newBal);
        }}
      />
    );
  }

  if (tab === 'sessions') {
    return <MySessionsView onBack={() => setTab('browse')} />;
  }

  return (
    <div className="px-4 pt-4 pb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display font-black text-reads-navy text-2xl">Tutors</h1>
        <button onClick={() => setTab('sessions')}
          className="flex items-center gap-1.5 text-reads-green text-sm font-bold px-3 py-1.5 bg-reads-green-bg rounded-xl">
          <Clock size={14} /> My Sessions
        </button>
      </div>
      <p className="text-reads-muted text-sm mb-4">1-on-1 sessions with verified tutors</p>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-reads-muted-light" />
        <input className="reads-input pl-10" placeholder="Search by name or subject…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <LoadingOverlay message="Loading tutors…" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No tutors found"
          description={search ? 'Try a different search.' : 'No tutors available yet.'} />
      ) : (
        filtered.map((t) => <TutorCard key={t.id} tutor={t} onClick={setSelected} />)
      )}
    </div>
  );
}
