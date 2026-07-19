import { useState, useEffect, useRef } from 'react';
import {
  GraduationCap, Star, Clock, Calendar, MessageSquare,
  ChevronRight, Search, Loader2, ArrowLeft, Coins,
  CheckCircle, XCircle, MessageCircle, AlertTriangle,
  Users, BookOpen, ShieldCheck, LayoutGrid, MoreHorizontal,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay, EmptyState, Badge, Modal, Toast, TokenBadge } from '../../components/UI.jsx';

// ── Platform stat tile ────────────────────────────────────────────────────────
const StatTile = ({ icon: Icon, value, label, sub, bg, color }) => (
  <div className="reads-card p-3 text-center">
    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
      <Icon size={18} className={color} />
    </div>
    <p className="font-black text-reads-navy text-base leading-none">{value}</p>
    <p className="text-reads-muted-light text-[10px] mt-1">{label}</p>
  </div>
);

// ── Subject filter chip ───────────────────────────────────────────────────────
const SubjectChip = ({ subject, active, onClick }) => (
  <button onClick={onClick}
    className={`flex-shrink-0 flex flex-col items-center gap-1.5 w-16 transition-transform active:scale-95`}>
    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
      active ? 'bg-reads-green text-white' : 'bg-gray-100 text-reads-muted'
    }`}>
      {subject === 'All Tutors' ? <LayoutGrid size={18} /> : subject === 'More' ? <MoreHorizontal size={18} /> : <BookOpen size={18} />}
    </div>
    <span className={`text-[10px] font-semibold text-center leading-tight ${active ? 'text-reads-green' : 'text-reads-muted'}`}>
      {subject}
    </span>
  </button>
);

// ── Become a Tutor apply modal ────────────────────────────────────────────────
function ApplyTutorModal({ onClose }) {
  const [form, setForm] = useState({ specialization: '', subjects: '', experience: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handle = async () => {
    if (!form.specialization.trim() || !form.subjects.trim()) {
      return setError('Fill in your specialization and subjects.');
    }
    setLoading(true); setError('');
    try {
      await api.tutors.applyToTutor(form);
      setSubmitted(true);
    } catch (e) {
      // Endpoint isn't live yet — be honest rather than fake a success state.
      setError("This feature is launching soon — we couldn't submit your application yet. Check back shortly!");
    } finally { setLoading(false); }
  };

  if (submitted) return (
    <Modal title="Application Sent" onClose={onClose}>
      <div className="text-center py-4 space-y-3">
        <CheckCircle size={40} className="text-reads-green mx-auto" />
        <p className="text-reads-navy font-bold">Thanks for applying!</p>
        <p className="text-reads-muted text-sm">We'll review your application and follow up by email.</p>
        <button onClick={onClose} className="reads-btn-primary w-full">Done</button>
      </div>
    </Modal>
  );

  return (
    <Modal title="Become a Tutor" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="reads-label">Specialization</label>
          <input className="reads-input" placeholder="e.g. Mathematics & Physics"
            value={form.specialization} onChange={set('specialization')} />
        </div>
        <div>
          <label className="reads-label">Subjects you can teach</label>
          <input className="reads-input" placeholder="e.g. Mathematics, Physics, JAMB Prep"
            value={form.subjects} onChange={set('subjects')} />
        </div>
        <div>
          <label className="reads-label">Experience (optional)</label>
          <textarea className="reads-input resize-none" rows={3}
            placeholder="Tell us about your teaching or tutoring background…"
            value={form.experience} onChange={set('experience')} />
        </div>
        {error && <p className="text-reads-red text-sm">{error}</p>}
        <button onClick={handle} disabled={loading}
          className="reads-btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={18} className="animate-spin" />}
          Submit Application
        </button>
      </div>
    </Modal>
  );
}

// ── Tutor Card ────────────────────────────────────────────────────────────────
function TutorCard({ tutor, onClick, topBadge = false }) {
  return (
    <button onClick={() => onClick(tutor)}
      className="reads-card p-4 mb-3 w-full text-left active:scale-98 transition-transform relative">
      {topBadge && (
        <span className="absolute top-3 left-3 bg-reads-green text-white text-[10px] font-black px-2 py-0.5 rounded-full z-10">
          Top Tutor
        </span>
      )}
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', background: 'white' }}>
      {/* Header */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid #f3f4f6', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ padding: 6, borderRadius: 10, background: '#f3f4f6', border: 'none', cursor: 'pointer' }}>
          <XCircle size={18} className="text-reads-muted" />
        </button>
        <div>
          <p style={{ fontWeight: 900, color: '#0D1F3C', fontSize: 14, margin: 0 }}>{session.tutor_name}</p>
          <p style={{ color: '#9CA3AF', fontSize: 12, margin: 0 }}>{session.subject}</p>
        </div>
      </div>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, paddingTop: 32 }}>No messages yet. Say hello!</p>
        )}
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.is_mine ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '78%', padding: '10px 14px', borderRadius: 18,
              fontSize: 14, lineHeight: 1.4,
              background: m.is_mine ? '#16A34A' : '#F3F4F6',
              color: m.is_mine ? 'white' : '#0D1F3C',
              borderBottomRightRadius: m.is_mine ? 4 : 18,
              borderBottomLeftRadius: m.is_mine ? 18 : 4,
            }}>
              <p style={{ margin: 0 }}>{m.content}</p>
              <p style={{ margin: '4px 0 0', fontSize: 10, opacity: 0.6 }}>
                {new Date(m.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {/* Input */}
      <div style={{ flexShrink: 0, borderTop: '1px solid #f3f4f6', padding: '12px 16px', display: 'flex', gap: 8, background: 'white' }}>
        <input
          style={{ flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '10px 14px', fontSize: 14, outline: 'none', background: 'white' }}
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
        />
        <button onClick={send} disabled={sending || !text.trim()}
          style={{ background: '#16A34A', color: 'white', border: 'none', borderRadius: 12, padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: (sending || !text.trim()) ? 0.5 : 1, display: 'flex', alignItems: 'center' }}>
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


// ── End Session Early Modal ───────────────────────────────────────────────────
function EndEarlyModal({ session, onClose, onEnded }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const now = new Date();
  const scheduled = new Date(session.scheduled_at);
  const hoursUntil = (scheduled - now) / (1000 * 60 * 60);
  const refund = hoursUntil >= 24
    ? session.cost_tokens
    : Math.round(session.cost_tokens * 0.5);
  const isPartial = hoursUntil < 24;

  const handle = async () => {
    setLoading(true);
    try {
      await api.tutors.cancelSession(session.id, 'Student ended session early');
      onEnded();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up p-5 space-y-4">
        <h3 className="font-black text-reads-navy text-base">End Session Early?</h3>
        <div className={`rounded-xl p-3 ${isPartial ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
          <p className={`text-xs font-semibold ${isPartial ? 'text-amber-700' : 'text-reads-green'}`}>
            {isPartial
              ? `Session is within 24 hours. You will receive a 50% refund of ${refund} $READS.`
              : `Full refund of ${refund} $READS will be returned to your wallet.`}
          </p>
        </div>
        <p className="text-reads-muted text-xs">
          The tutor will be notified. This action cannot be undone.
        </p>
        {error && <p className="text-reads-red text-sm">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 reads-btn-outline">Keep Session</button>
          <button onClick={handle} disabled={loading}
            className="flex-1 text-white font-bold py-3 rounded-xl bg-reads-red flex items-center justify-center gap-2">
            {loading && <Loader2 size={15} className="animate-spin" />}
            End Session
          </button>
        </div>
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
  const [endSession, setEndSession] = useState(null);
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
                    {s.status === 'confirmed' && (
                      <button onClick={() => setEndSession(s)}
                        className="flex items-center gap-1 text-reads-red text-xs font-bold px-3 py-1.5 bg-red-50 rounded-lg">
                        <XCircle size={12} /> End Early
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
      {endSession && <EndEarlyModal session={endSession} onClose={() => setEndSession(null)} onEnded={() => { setEndSession(null); showToast('Session ended. Refund processed.'); load(); }} />}
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
  const [subjectFilter, setSubjectFilter] = useState('All Tutors');
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('browse'); // browse | sessions
  const [platformStats, setPlatformStats] = useState(null);
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    api.tutors.list()
      .then((d) => setTutors(d?.tutors || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    api.tutors.getStats().then(setPlatformStats).catch(() => {}); // falls back to client-derived stats below
  }, []);

  // Top subjects derived from real tutor data — used for both the stat tile and chip row
  const subjectCounts = tutors.reduce((acc, t) => {
    (t.subjects || []).forEach((s) => { acc[s] = (acc[s] || 0) + 1; });
    return acc;
  }, {});
  const topSubjects = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s);
  const avgRating = tutors.length
    ? (tutors.reduce((s, t) => s + (t.rating || 0), 0) / tutors.length).toFixed(1)
    : '—';

  const filtered = tutors.filter((t) => {
    const matchSearch = !search ||
      t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.specialization?.toLowerCase().includes(search.toLowerCase()) ||
      t.subjects?.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchSubject = subjectFilter === 'All Tutors' || subjectFilter === 'More' ||
      t.subjects?.includes(subjectFilter);
    return matchSearch && matchSubject;
  });

  const topRated = [...tutors].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);

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
      <p className="text-reads-muted text-sm mb-4">Find expert tutors and get help to excel.</p>

      <div className="relative mb-3">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-reads-muted-light" />
        <input className="reads-input pl-10" placeholder="Search tutors or subjects…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Subject chips */}
      <div className="flex gap-3 overflow-x-auto pb-1 mb-4 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {['All Tutors', ...topSubjects, 'More'].map((s) => (
          <SubjectChip key={s} subject={s} active={subjectFilter === s}
            onClick={() => setSubjectFilter(subjectFilter === s ? 'All Tutors' : s)} />
        ))}
      </div>

      {/* Platform stats */}
      {tutors.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          <StatTile icon={Users} value={platformStats?.total_tutors ?? tutors.length} label="Tutors" bg="bg-reads-green-bg" color="text-reads-green" />
          <StatTile icon={BookOpen} value={platformStats?.subjects_covered ?? Object.keys(subjectCounts).length} label="Subjects" bg="bg-purple-50" color="text-purple-600" />
          <StatTile icon={Star} value={platformStats?.avg_rating ?? avgRating} label="Avg Rating" bg="bg-reads-gold/10" color="text-reads-gold-dark" />
        </div>
      )}

      {/* Top Rated Tutors */}
      {!search && subjectFilter === 'All Tutors' && topRated.length > 0 && (
        <div className="mb-5">
          <p className="font-black text-reads-navy text-sm mb-2">Top Rated Tutors</p>
          {topRated.map((t, i) => (
            <TutorCard key={t.id} tutor={t} onClick={setSelected} topBadge={i === 0} />
          ))}
        </div>
      )}

      {/* All / filtered tutors — excludes tutors already shown above in Top Rated */}
      {(() => {
        const topRatedIds = new Set(!search && subjectFilter === 'All Tutors' ? topRated.map(t => t.id) : []);
        const remaining = filtered.filter((t) => !topRatedIds.has(t.id));
        const heading = search || subjectFilter !== 'All Tutors' ? 'Results' : 'More Tutors';
        if (loading) return <LoadingOverlay message="Loading tutors…" />;
        if (filtered.length === 0) return (
          <EmptyState icon={GraduationCap} title="No tutors found"
            description={search ? 'Try a different search.' : 'No tutors available yet.'} />
        );
        if (remaining.length === 0) return null;
        return (
          <>
            <p className="font-black text-reads-navy text-sm mb-2">{heading}</p>
            {remaining.map((t) => <TutorCard key={t.id} tutor={t} onClick={setSelected} />)}
          </>
        );
      })()}

      {/* Become a Tutor */}
      <div className="relative bg-reads-navy rounded-2xl p-4 mt-2 overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-reads-gold/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="relative z-10">
          <p className="font-black text-white text-sm mb-1">Become a Tutor</p>
          <p className="text-white/70 text-xs mb-3">Share your knowledge and earn $READS points.</p>
          <button onClick={() => setShowApply(true)}
            className="bg-reads-gold text-reads-navy text-sm font-bold rounded-xl px-4 py-2 active:scale-95 transition-transform">
            Apply Now
          </button>
        </div>
      </div>

      {showApply && <ApplyTutorModal onClose={() => setShowApply(false)} />}
    </div>
  );
}
