import { useState, useEffect } from 'react';
import {
  GraduationCap, Star, Clock, Calendar, MessageSquare,
  ChevronRight, Search, Loader2, ArrowLeft, Coins, CheckCircle
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

// ── Main Tutors Module ────────────────────────────────────────────────────────
export default function TutorsModule({ tokenBalance, onUpdateBalance }) {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

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

  return (
    <div className="px-4 pt-4 pb-6 animate-fade-in">
      <h1 className="font-display font-black text-reads-navy text-2xl mb-1">Tutors</h1>
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
