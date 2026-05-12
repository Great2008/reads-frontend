import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Calendar, Wallet, Settings,
  Loader2, CheckCircle, XCircle, LogOut,
  Star, Clock, User, BookOpen, ToggleLeft,
  ToggleRight, Edit2, ChevronRight, Coins,
  AlertCircle, Plus, Trash2
} from 'lucide-react';
import { api } from '../../services/api.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 animate-fade-in
    ${type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-reads-green border border-green-200'}`}>
    {type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
    {msg}
  </div>
);

const StatCard = ({ icon: Icon, label, value, color = 'green', sub }) => {
  const colors = {
    green: { bg: 'bg-reads-green-bg', text: 'text-reads-green' },
    navy:  { bg: 'bg-blue-50',        text: 'text-reads-navy'  },
    gold:  { bg: 'bg-amber-50',       text: 'text-amber-600'   },
  }[color];
  return (
    <div className="reads-card px-4 py-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
        <Icon size={20} className={colors.text} />
      </div>
      <div>
        <p className="text-reads-muted text-xs">{label}</p>
        <p className="font-black text-reads-navy text-lg leading-tight">{value}</p>
        {sub && <p className="text-reads-muted text-[10px]">{sub}</p>}
      </div>
    </div>
  );
};

const STATUS_STYLE = {
  pending:   { bg: 'bg-amber-50',   text: 'text-amber-600',  label: 'Pending'   },
  confirmed: { bg: 'bg-blue-50',    text: 'text-reads-navy', label: 'Confirmed' },
  completed: { bg: 'bg-green-100',  text: 'text-reads-green',label: 'Completed' },
  cancelled: { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Cancelled' },
};

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}


// ── Session Chat Modal ────────────────────────────────────────────────────────
function SessionChatModal({ session, onClose, isTutor = false }) {
  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const [lastSince, setLastSince] = useState(null);
  const bottomRef                 = useRef(null);

  const load = async (since = null) => {
    try {
      const api_obj = isTutor ? api.tutorPortal : api.tutors;
      const d = await api_obj.getMessages(session.id, since);
      if (since) {
        setMessages(prev => [...prev, ...(d.messages || [])]);
      } else {
        setMessages(d.messages || []);
      }
      if (d.messages?.length) {
        setLastSince(d.messages[d.messages.length - 1].created_at);
      }
    } catch (_) {}
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => load(lastSince), 5000);
    return () => clearInterval(interval);
  }, [session.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const api_obj = isTutor ? api.tutorPortal : api.tutors;
      const msg = await api_obj.sendMessage(session.id, text.trim());
      setMessages(prev => [...prev, msg]);
      setText('');
    } catch (_) {}
    finally { setSending(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', flexDirection:'column', background:'white' }}>
      <div style={{ flexShrink:0, borderBottom:'1px solid #f3f4f6', padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onClose} style={{ padding:6, borderRadius:10, background:'#f3f4f6', border:'none', cursor:'pointer' }}>
          <XCircle size={18} className="text-reads-muted" />
        </button>
        <div>
          <p style={{ fontWeight:900, color:'#0D1F3C', fontSize:14, margin:0 }}>
            {isTutor ? session.student_name : session.tutor_name}
          </p>
          <p style={{ color:'#9CA3AF', fontSize:12, margin:0 }}>{session.subject}</p>
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
        {messages.length === 0 && (
          <p style={{ textAlign:'center', color:'#9CA3AF', fontSize:14, paddingTop:32 }}>No messages yet. Say hello!</p>
        )}
        {messages.map(m => (
          <div key={m.id} style={{ display:'flex', justifyContent: m.is_mine ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth:'78%', padding:'10px 14px', borderRadius:18,
              fontSize:14, lineHeight:1.4,
              background: m.is_mine ? '#16A34A' : '#F3F4F6',
              color: m.is_mine ? 'white' : '#0D1F3C',
              borderBottomRightRadius: m.is_mine ? 4 : 18,
              borderBottomLeftRadius: m.is_mine ? 18 : 4,
            }}>
              <p style={{ margin:0 }}>{m.content}</p>
              <p style={{ margin:'4px 0 0', fontSize:10, opacity:0.6 }}>
                {new Date(m.created_at).toLocaleTimeString('en-NG', { hour:'2-digit', minute:'2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ flexShrink:0, borderTop:'1px solid #f3f4f6', padding:'12px 16px', display:'flex', gap:8, background:'white' }}>
        <input
          style={{ flex:1, border:'1.5px solid #e5e7eb', borderRadius:12, padding:'10px 14px', fontSize:14, outline:'none', background:'white' }}
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
        />
        <button onClick={send} disabled={sending || !text.trim()}
          style={{ background:'#16A34A', color:'white', border:'none', borderRadius:12, padding:'10px 18px', fontWeight:700, fontSize:14, cursor:'pointer', opacity:(sending || !text.trim()) ? 0.5 : 1, display:'flex', alignItems:'center' }}>
          {sending ? <Loader2 size={16} className="animate-spin" /> : 'Send'}
        </button>
      </div>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function TutorOverview({ profile, earnings, onNavigate, onToggleAvail }) {
  return (
    <div className="px-4 pt-2 pb-4 space-y-5 animate-fade-in">
      {/* Profile header */}
      <div className="reads-card p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-reads-green-bg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            : <User size={28} className="text-reads-green" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-reads-navy text-base leading-tight">{profile?.full_name}</p>
          <p className="text-reads-muted text-xs mt-0.5">{profile?.specialization || 'No specialization set'}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              profile?.status === 'approved' ? 'bg-green-100 text-reads-green' : 'bg-amber-50 text-amber-600'
            }`}>{profile?.status?.toUpperCase()}</span>
            <span className="flex items-center gap-0.5 text-reads-gold text-xs font-bold">
              <Star size={11} fill="currentColor" /> {profile?.rating?.toFixed(1)} ({profile?.review_count})
            </span>
          </div>
        </div>
        <button onClick={() => onNavigate('profile')} className="p-2 rounded-xl bg-gray-100">
          <Edit2 size={16} className="text-reads-muted" />
        </button>
      </div>

      {/* Availability toggle */}
      <div className="reads-card p-4 flex items-center justify-between">
        <div>
          <p className="font-bold text-reads-navy text-sm">Availability</p>
          <p className="text-reads-muted text-xs mt-0.5">
            {profile?.is_available ? 'Visible to students for booking' : 'Hidden from student search'}
          </p>
        </div>
        <button onClick={onToggleAvail}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-colors ${
            profile?.is_available ? 'bg-reads-green text-white' : 'bg-gray-100 text-reads-muted'
          }`}>
          {profile?.is_available
            ? <><ToggleRight size={18} /> Available</>
            : <><ToggleLeft size={18} /> Unavailable</>}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Coins}    label="Wallet Balance"     value={`${earnings?.wallet_balance ?? 0} $READS`} color="gold" />
        <StatCard icon={BookOpen} label="Sessions Done"      value={earnings?.sessions_completed ?? 0} color="green" />
        <StatCard icon={Calendar} label="Pending Sessions"   value={earnings?.pending_sessions ?? 0} color="navy" />
        <StatCard icon={Coins}    label="In Escrow"          value={`${earnings?.pending_escrow ?? 0} $READS`} color="gold" />
      </div>

      <button onClick={() => onNavigate('sessions')}
        className="reads-btn-primary w-full flex items-center justify-center gap-2">
        <Calendar size={16} /> Manage Sessions
      </button>
    </div>
  );
}

// ── Sessions ──────────────────────────────────────────────────────────────────
function TutorSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [toast, setToast]       = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = () => {
    setLoading(true);
    api.tutorPortal.getSessions()
      .then(d => setSessions(d?.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id, action) => {
    try {
      let res;
      if (action === 'confirm')  res = await api.tutorPortal.confirmSession(id);
      if (action === 'complete') res = await api.tutorPortal.completeSession(id);
      if (action === 'cancel')   res = await api.tutorPortal.cancelSession(id, '');
      showToast(res?.message || 'Done');
      load();
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
  };

  const [chatSession, setChatSession] = useState(null);

  const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];
  const filtered = sessions.filter(s => filter === 'all' || s.status === filter);

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <h2 className="font-black text-reads-navy text-lg mb-3">My Sessions</h2>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 capitalize transition-all ${
              filter === f ? 'bg-reads-navy text-white' : 'bg-gray-100 text-reads-muted'
            }`}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-reads-green" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 text-reads-muted text-sm">No {filter === 'all' ? '' : filter} sessions.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const st = STATUS_STYLE[s.status] || STATUS_STYLE.pending;
            return (
              <div key={s.id} className="reads-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-reads-navy text-sm">{s.subject}</p>
                    <p className="text-reads-muted text-xs">{s.student_name}</p>
                    <p className="text-reads-muted text-xs flex items-center gap-1 mt-0.5">
                      <Clock size={11} /> {fmtDate(s.scheduled_at)} · {s.duration_minutes} mins
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${st.bg} ${st.text}`}>
                    {st.label}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-reads-gold font-black text-sm">{s.cost_tokens} $READS</span>
                  <div className="flex gap-2">
                    {s.status === 'pending' && (
                      <>
                        <button onClick={() => handleAction(s.id, 'confirm')}
                          className="text-reads-green text-xs font-bold px-3 py-1.5 bg-reads-green-bg rounded-lg">
                          Confirm
                        </button>
                        <button onClick={() => handleAction(s.id, 'cancel')}
                          className="text-reads-red text-xs font-bold px-3 py-1.5 bg-red-50 rounded-lg">
                          Decline
                        </button>
                      </>
                    )}
                    {s.status === 'confirmed' && (
                      <>
                        <button onClick={() => setChatSession(s)}
                          className="text-reads-navy text-xs font-bold px-3 py-1.5 bg-gray-100 rounded-lg">
                          Chat
                        </button>
                        <button onClick={() => handleAction(s.id, 'complete')}
                          className="text-white text-xs font-bold px-3 py-1.5 bg-reads-green rounded-lg">
                          Mark Complete
                        </button>
                      </>
                    )}
                    {s.status === 'completing' && (
                      <>
                        <button onClick={() => setChatSession(s)}
                          className="text-reads-navy text-xs font-bold px-3 py-1.5 bg-gray-100 rounded-lg">
                          Chat
                        </button>
                        <span className="text-amber-600 text-xs font-semibold">Awaiting student...</span>
                      </>
                    )}
                  </div>
                </div>
                {s.note && <p className="text-reads-muted text-xs mt-2 italic">"{s.note}"</p>}
              </div>
            );
          })}
        </div>
      )}
      {chatSession && <SessionChatModal session={chatSession} onClose={() => setChatSession(null)} isTutor={true} />}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ── Wallet ────────────────────────────────────────────────────────────────────
function TutorWallet({ earnings }) {
  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in space-y-4">
      <h2 className="font-black text-reads-navy text-lg">Wallet & Earnings</h2>
      <div className="reads-card p-5 bg-reads-navy text-white rounded-2xl">
        <p className="text-white/70 text-xs mb-1">Available Balance</p>
        <p className="font-black text-3xl">{earnings?.wallet_balance ?? 0} <span className="text-lg font-semibold">$READS</span></p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Coins}    label="Total Earned"   value={`${earnings?.total_earned ?? 0} $READS`}   color="gold"  />
        <StatCard icon={Calendar} label="In Escrow"      value={`${earnings?.pending_escrow ?? 0} $READS`} color="navy"  />
        <StatCard icon={BookOpen} label="Sessions Done"  value={earnings?.sessions_completed ?? 0}          color="green" />
        <StatCard icon={Star}     label="Pending"        value={earnings?.pending_sessions ?? 0}             color="navy"  />
      </div>
      <div className="reads-card p-4 bg-amber-50 border border-amber-200">
        <p className="text-amber-700 text-xs font-semibold">
          Cardano wallet withdrawals coming in Phase 2. Your $READS balance is securely held.
        </p>
      </div>
    </div>
  );
}

// ── Profile Edit ──────────────────────────────────────────────────────────────
function TutorProfileEdit({ profile, onSaved }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    specialization: profile?.specialization || '',
    rate_per_hour: profile?.rate_per_hour || 100,
    subjects: (profile?.subjects || []).join(', '),
    qualifications: (profile?.qualifications || []).join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.tutorPortal.updateProfile({
        ...form,
        rate_per_hour: parseInt(form.rate_per_hour) || 100,
        subjects: form.subjects.split(',').map(s => s.trim()).filter(Boolean),
        qualifications: form.qualifications.split(',').map(s => s.trim()).filter(Boolean),
      });
      showToast('Profile updated');
      setTimeout(onSaved, 1000);
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in space-y-4">
      <h2 className="font-black text-reads-navy text-lg">Edit Profile</h2>
      {[
        { label: 'Full Name',         key: 'full_name',      placeholder: 'Your full name' },
        { label: 'Specialization',    key: 'specialization', placeholder: 'e.g. JAMB Mathematics Expert' },
        { label: 'Hourly Rate ($READS tokens)', key: 'rate_per_hour', placeholder: '100', type: 'number' },
        { label: 'Subjects (comma-separated)',  key: 'subjects',     placeholder: 'Mathematics, Physics, Chemistry' },
        { label: 'Qualifications (comma-separated)', key: 'qualifications', placeholder: 'B.Sc Mathematics, PGDE' },
      ].map(({ label, key, placeholder, type }) => (
        <div key={key}>
          <label className="reads-label">{label}</label>
          <input className="reads-input" type={type || 'text'} placeholder={placeholder}
            value={form[key]} onChange={set(key)} />
        </div>
      ))}
      <div>
        <label className="reads-label">Bio</label>
        <textarea className="reads-input" rows={3} placeholder="Tell students about yourself..."
          value={form.bio} onChange={set('bio')} />
      </div>
      <button onClick={handleSave} disabled={saving}
        className="reads-btn-primary w-full flex items-center justify-center gap-2">
        {saving && <Loader2 size={16} className="animate-spin" />}
        Save Changes
      </button>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { key: 'sessions',  label: 'Sessions',  icon: Calendar        },
  { key: 'wallet',    label: 'Wallet',    icon: Wallet          },
  { key: 'profile',   label: 'Profile',   icon: Settings        },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TutorPortalModule({ onLogout }) {
  const [section, setSection] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = async () => {
    try {
      const [prof, earn] = await Promise.all([
        api.tutorPortal.getProfile(),
        api.tutorPortal.getEarnings(),
      ]);
      setProfile(prof);
      setEarnings(earn);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleToggleAvail = async () => {
    try {
      const res = await api.tutorPortal.setAvailability({});
      setProfile(p => ({ ...p, is_available: res.is_available }));
      showToast(res.is_available ? 'You are now available for bookings' : 'You are now hidden from search');
    } catch (e) { showToast(e.message, 'error'); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-reads-green" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-reads-navy rounded-xl flex items-center justify-center">
              <img src="/assets/reads-logo.png" alt="$READS" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <p className="font-black text-reads-navy text-sm leading-tight">$READS</p>
              <p className="text-reads-muted text-[10px]">Tutor Portal</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-reads-muted text-xs font-semibold">
            <LogOut size={14} /> Log out
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto pt-16 pb-24">
        {section === 'overview' && (
          <TutorOverview
            profile={profile}
            earnings={earnings}
            onNavigate={setSection}
            onToggleAvail={handleToggleAvail}
          />
        )}
        {section === 'sessions' && <TutorSessions />}
        {section === 'wallet'   && <TutorWallet earnings={earnings} />}
        {section === 'profile'  && (
          <TutorProfileEdit profile={profile} onSaved={() => { load(); setSection('overview'); }} />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-2px_16px_rgba(0,0,0,0.07)]">
        <div className="max-w-lg mx-auto flex items-center justify-around px-1 pb-safe">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setSection(key)}
              className="flex flex-col items-center gap-0.5 py-3 px-4 relative transition-colors">
              {section === key && <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-reads-green rounded-full" />}
              <Icon size={22} className={section === key ? 'text-reads-green' : 'text-reads-muted'}
                strokeWidth={section === key ? 2.5 : 1.8} />
              <span className={`text-[10px] font-semibold ${section === key ? 'text-reads-green' : 'text-reads-muted'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
