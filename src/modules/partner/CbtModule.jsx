import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Wallet, Settings,
  ClipboardList, MapPin, Loader2, CheckCircle,
  XCircle, LogOut, Edit2, Eye, Plus, Calendar,
  Clock, ChevronRight, Trash2, ToggleLeft, ToggleRight
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

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    green: { bg: 'bg-reads-green-bg', text: 'text-reads-green' },
    navy:  { bg: 'bg-blue-50',        text: 'text-reads-navy' },
    gold:  { bg: 'bg-amber-50',       text: 'text-amber-600' },
    red:   { bg: 'bg-red-50',         text: 'text-red-500' },
  }[color] || { bg: 'bg-gray-100', text: 'text-gray-600' };

  return (
    <div className="reads-card px-4 py-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
        <Icon size={20} className={colors.text} />
      </div>
      <div>
        <p className="text-reads-muted text-xs">{label}</p>
        <p className="font-black text-reads-navy text-lg leading-tight">{value}</p>
      </div>
    </div>
  );
};

const EXAM_TYPES = ['JAMB', 'WAEC', 'NECO', 'BECE', 'IELTS', 'SAT'];

// ── Overview ──────────────────────────────────────────────────────────────────
function CbtOverview({ profile, onNavigate }) {
  return (
    <div className="px-4 pt-2 pb-4 space-y-5 animate-fade-in">
      <div>
        <h2 className="font-black text-reads-navy text-lg">{profile?.name || 'CBT Centre'}</h2>
        <p className="text-reads-muted text-xs flex items-center gap-1 mt-0.5">
          <MapPin size={11} /> {profile?.address || 'Address not set'}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users}         label="Total Candidates"  value={profile?.total_candidates ?? 0}  color="green" />
        <StatCard icon={ClipboardList} label="Exam Windows"      value={profile?.exams_scheduled ?? 0}   color="navy" />
        <StatCard icon={MapPin}        label="State"             value={profile?.state || '—'}            color="gold" />
        <StatCard icon={Settings}      label="Status"            value={profile?.status ?? 'Active'}      color="red" />
      </div>
      <div className="reads-card px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-reads-navy text-sm">Centre Details</p>
          <button onClick={() => onNavigate('profile')}
            className="flex items-center gap-1 text-reads-green text-xs font-bold">
            <Edit2 size={12} /> Edit
          </button>
        </div>
        <div className="space-y-1.5 text-sm">
          {[['State', profile?.state], ['LGA', profile?.lga], ['Capacity', profile?.capacity]].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-reads-muted">{k}</span>
              <span className="font-semibold text-reads-navy">{v || '—'}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => onNavigate('exams')}
        className="reads-btn-primary w-full flex items-center justify-center gap-2">
        <Calendar size={16} /> Manage Exam Windows
      </button>
    </div>
  );
}

// ── Profile Edit ──────────────────────────────────────────────────────────────
function CbtProfileEdit({ profile, onSaved }) {
  const [form, setForm] = useState({
    name: profile?.name || '', address: profile?.address || '',
    state: profile?.state || '', lga: profile?.lga || '',
    capacity: profile?.capacity || '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.partner.updateCbtProfile({ ...form, capacity: form.capacity ? parseInt(form.capacity) : null });
      showToast('Profile updated');
      setTimeout(onSaved, 1000);
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in space-y-4">
      <div>
        <h2 className="font-black text-reads-navy text-lg">Edit Profile</h2>
        <p className="text-reads-muted text-xs">Update your CBT centre details</p>
      </div>
      {[
        { label: 'Centre Name', key: 'name', placeholder: 'e.g. Excellence CBT Centre' },
        { label: 'Address', key: 'address', placeholder: 'Full address' },
        { label: 'State', key: 'state', placeholder: 'e.g. Rivers State' },
        { label: 'LGA', key: 'lga', placeholder: 'Local Government Area' },
        { label: 'Capacity', key: 'capacity', placeholder: 'Max candidates per session', type: 'number' },
      ].map(({ label, key, placeholder, type }) => (
        <div key={key}>
          <label className="reads-label">{label}</label>
          <input className="reads-input" type={type || 'text'} placeholder={placeholder}
            value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
        </div>
      ))}
      <button onClick={handleSave} disabled={saving}
        className="reads-btn-primary w-full flex items-center justify-center gap-2">
        {saving && <Loader2 size={16} className="animate-spin" />}
        Save Changes
      </button>
      {toast && <Toast {...toast} />}
    </div>
  );
}

// ── Create Exam Window Modal ───────────────────────────────────────────────────
function CreateWindowModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    exam_type: 'JAMB', subject: '', exam_date: '',
    duration_minutes: 180, total_slots: 100, fee_tokens: 500,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handle = async () => {
    if (!form.exam_date) return setError('Exam date is required.');
    setLoading(true); setError('');
    try {
      await api.partner.createCbtWindow({
        ...form,
        duration_minutes: parseInt(form.duration_minutes),
        total_slots: parseInt(form.total_slots),
        fee_tokens: parseInt(form.fee_tokens),
      });
      onCreated();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-black text-reads-navy text-base">New Exam Window</h3>
          <button onClick={onClose}><XCircle size={20} className="text-reads-muted" /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-3">
          <div>
            <label className="reads-label">Exam Type</label>
            <select className="reads-input" value={form.exam_type} onChange={set('exam_type')}>
              {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="reads-label">Subject (optional)</label>
            <input className="reads-input" placeholder="e.g. Mathematics" value={form.subject} onChange={set('subject')} />
          </div>
          <div>
            <label className="reads-label">Exam Date & Time</label>
            <input className="reads-input" type="datetime-local" value={form.exam_date} onChange={set('exam_date')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="reads-label">Duration (mins)</label>
              <input className="reads-input" type="number" value={form.duration_minutes} onChange={set('duration_minutes')} />
            </div>
            <div>
              <label className="reads-label">Total Slots</label>
              <input className="reads-input" type="number" value={form.total_slots} onChange={set('total_slots')} />
            </div>
          </div>
          <div>
            <label className="reads-label">Fee (in $READS tokens)</label>
            <input className="reads-input" type="number" value={form.fee_tokens} onChange={set('fee_tokens')} />
          </div>
          {error && <p className="text-reads-red text-sm">{error}</p>}
          <button onClick={handle} disabled={loading}
            className="reads-btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Create Window
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Exam Windows Section ──────────────────────────────────────────────────────
function ExamWindowsSection() {
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [regLoading, setRegLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = () => {
    setLoading(true);
    api.partner.getCbtWindows()
      .then(d => setWindows(d?.windows || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id) => {
    try {
      const res = await api.partner.toggleCbtWindowStatus(id);
      showToast(res.message);
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleViewRegs = async (w) => {
    setSelectedWindow(w);
    setRegLoading(true);
    try {
      const d = await api.partner.getCbtWindowRegistrations(w.id);
      setRegistrations(d?.registrations || []);
    } catch (_) {}
    finally { setRegLoading(false); }
  };

  if (selectedWindow) return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <button onClick={() => setSelectedWindow(null)}
        className="flex items-center gap-1 text-reads-muted text-sm mb-4">
        ← Back to Windows
      </button>
      <h2 className="font-black text-reads-navy text-lg mb-1">{selectedWindow.exam_type} Registrations</h2>
      <p className="text-reads-muted text-xs mb-4">
        {new Date(selectedWindow.exam_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
      {regLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-reads-green" /></div>
      ) : registrations.length === 0 ? (
        <div className="text-center py-12 text-reads-muted text-sm">No registrations yet.</div>
      ) : (
        <div className="space-y-3">
          {registrations.map(r => (
            <div key={r.id} className="reads-card p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-reads-navy text-sm">{r.student_name}</p>
                  <p className="text-reads-muted text-xs">{r.student_email}</p>
                  <p className="text-reads-muted text-xs mt-0.5">Seat: {r.seat_number || 'Unassigned'}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                  r.status === 'confirmed' ? 'bg-green-100 text-reads-green'
                  : r.status === 'proof_uploaded' ? 'bg-amber-50 text-amber-600'
                  : 'bg-gray-100 text-reads-muted'
                }`}>{r.status?.replace('_', ' ').toUpperCase()}</span>
              </div>
              {r.proof_url && (
                <a href={r.proof_url} target="_blank" rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1 text-reads-green text-xs font-bold">
                  <Eye size={12} /> View Payment Proof
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-black text-reads-navy text-lg">Exam Windows</h2>
          <p className="text-reads-muted text-xs">{windows.length} total</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-reads-green text-white text-sm font-bold px-3 py-2 rounded-xl">
          <Plus size={15} /> New
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-reads-green" /></div>
      ) : windows.length === 0 ? (
        <div className="text-center py-14">
          <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-reads-navy text-sm">No exam windows yet</p>
          <p className="text-reads-muted text-xs mt-1">Create your first exam window for students to register.</p>
          <button onClick={() => setShowCreate(true)} className="reads-btn-primary mt-4 px-6">Create Window</button>
        </div>
      ) : (
        <div className="space-y-3">
          {windows.map(w => (
            <div key={w.id} className="reads-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-reads-navy text-sm">{w.exam_type}{w.subject ? ` — ${w.subject}` : ''}</p>
                  <p className="text-reads-muted text-xs flex items-center gap-1 mt-0.5">
                    <Calendar size={11} />
                    {new Date(w.exam_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-reads-muted text-xs flex items-center gap-1">
                    <Clock size={11} /> {w.duration_minutes} mins · {w.fee_tokens} $READS
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                  w.status === 'open' ? 'bg-green-100 text-reads-green' : 'bg-gray-100 text-reads-muted'
                }`}>{w.status?.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-reads-muted text-xs">
                  {w.available_slots}/{w.total_slots} slots available
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleViewRegs(w)}
                    className="flex items-center gap-1 text-reads-navy text-xs font-bold px-2 py-1 rounded-lg bg-gray-100">
                    <Users size={12} /> Registrations
                  </button>
                  <button onClick={() => handleToggle(w.id)}
                    className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
                      w.status === 'open' ? 'bg-red-50 text-reads-red' : 'bg-green-50 text-reads-green'
                    }`}>
                    {w.status === 'open' ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                    {w.status === 'open' ? 'Close' : 'Open'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateWindowModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); showToast('Exam window created!'); }}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'exams',    label: 'Exams',    icon: Calendar },
  { key: 'wallet',   label: 'Wallet',   icon: Wallet },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CbtModule({ onLogout }) {
  const [section, setSection] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.partner.getCbtProfile(),
      api.partner.getCbtStats(),
    ]).then(([prof, stats]) => {
      setProfile({ ...prof, ...stats });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

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
              <p className="text-reads-muted text-[10px]">CBT Centre Portal</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-reads-muted text-xs font-semibold">
            <LogOut size={14} /> Log out
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto pt-16 pb-24">
        {section === 'overview' && <CbtOverview profile={profile} onNavigate={setSection} />}
        {section === 'profile'  && <CbtProfileEdit profile={profile} onSaved={() => { setSection('overview'); }} />}
        {section === 'exams'    && <ExamWindowsSection />}
        {section === 'wallet'   && (
          <div className="px-4 pt-4">
            <p className="font-black text-reads-navy text-lg mb-2">Wallet</p>
            <p className="text-reads-muted text-sm">Token wallet coming in Phase 2.</p>
          </div>
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
    </div>
  );
}
