import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Wallet, Settings,
  ClipboardList, MapPin, Loader2, CheckCircle,
  XCircle, LogOut, Edit2
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
        <StatCard icon={Users}        label="Candidates"       value={profile?.total_candidates ?? 0} color="green" />
        <StatCard icon={ClipboardList} label="Exams Scheduled" value={profile?.exams_scheduled ?? 0}  color="navy" />
        <StatCard icon={Wallet}       label="Token Balance"    value="0"                               color="gold" />
        <StatCard icon={Settings}     label="Status"           value={profile?.status ?? 'Active'}     color="red" />
      </div>

      <div className="reads-card px-4 py-4">
        <p className="font-bold text-reads-navy text-sm mb-1">Centre Details</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-reads-muted">State</span>
            <span className="font-semibold text-reads-navy">{profile?.state || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-reads-muted">LGA</span>
            <span className="font-semibold text-reads-navy">{profile?.lga || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-reads-muted">Capacity</span>
            <span className="font-semibold text-reads-navy">{profile?.capacity || '—'}</span>
          </div>
        </div>
        <button onClick={() => onNavigate('profile')}
          className="mt-3 flex items-center gap-1.5 text-reads-green text-xs font-bold">
          <Edit2 size={13} /> Edit Profile
        </button>
      </div>

      <div className="reads-card px-4 py-4 border-l-4 border-amber-400 bg-amber-50">
        <p className="font-bold text-amber-700 text-sm">Coming Soon</p>
        <p className="text-amber-600 text-xs mt-1">
          Candidate booking, exam scheduling, and results management are being built for Phase 2.
        </p>
      </div>
    </div>
  );
}

// ── Profile Edit ──────────────────────────────────────────────────────────────
function CbtProfileEdit({ profile, onSaved }) {
  const [form, setForm] = useState({
    name: profile?.name || '',
    address: profile?.address || '',
    state: profile?.state || '',
    lga: profile?.lga || '',
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
    } catch (e) {
      showToast(e.message || 'Failed to save', 'error');
    } finally { setSaving(false); }
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

// ── Nav ───────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'wallet',   label: 'Wallet',   icon: Wallet },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CbtModule({ user, onLogout }) {
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
        {section === 'overview' && (
          <CbtOverview profile={profile} onNavigate={setSection} />
        )}
        {section === 'profile' && (
          <CbtProfileEdit profile={profile} onSaved={() => setSection('overview')} />
        )}
        {section === 'wallet' && (
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
