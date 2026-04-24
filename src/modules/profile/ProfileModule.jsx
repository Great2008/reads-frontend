import { useState } from 'react';
import { User, Mail, Phone, Shield, Bell, Trash2, LogOut, ChevronRight, Edit2, Camera, CheckCircle, Loader2, Star } from 'lucide-react';
import { api } from '../../services/api.js';
import { Badge, Modal, Toast, ProgressBar } from '../../components/UI.jsx';

const AVATAR_FALLBACK = (name) =>
  `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || 'U')}&backgroundColor=16a34a&fontColor=ffffff`;

// ── Edit Profile Modal ────────────────────────────────────────────────────────
const EditProfileModal = ({ user, onClose, onSaved }) => {
  const [form, setForm] = useState({
    full_name: user.full_name || '',
    phone: user.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!form.full_name.trim()) return setError('Name is required.');
    setLoading(true);
    try {
      await api.auth.updateProfile(form);
      onSaved(form);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="reads-label">Full Name</label>
          <input className="reads-input" value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
        </div>
        <div>
          <label className="reads-label">Phone</label>
          <input className="reads-input" type="tel" value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        {error && <p className="text-reads-red text-sm">{error}</p>}
        <button onClick={save} disabled={loading}
          className="reads-btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={18} className="animate-spin" />}
          Save Changes
        </button>
      </div>
    </Modal>
  );
};

// ── Change Password Modal ──────────────────────────────────────────────────────
const ChangePasswordModal = ({ onClose }) => {
  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const save = async () => {
    if (!form.current || !form.newPw) return setError('Fill in all fields.');
    if (form.newPw.length < 8) return setError('Minimum 8 characters.');
    if (form.newPw !== form.confirm) return setError('Passwords do not match.');
    setLoading(true); setError('');
    try {
      await api.auth.changePassword(form.current, form.newPw);
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  if (done) return (
    <Modal title="Password Changed" onClose={onClose}>
      <div className="text-center py-4">
        <CheckCircle size={40} className="text-reads-green mx-auto mb-3" />
        <p className="text-reads-navy font-bold">Password updated successfully!</p>
        <button onClick={onClose} className="reads-btn-primary w-full mt-4">Done</button>
      </div>
    </Modal>
  );

  return (
    <Modal title="Change Password" onClose={onClose}>
      <div className="space-y-4">
        {['current', 'newPw', 'confirm'].map((k) => (
          <div key={k}>
            <label className="reads-label">
              {k === 'current' ? 'Current Password' : k === 'newPw' ? 'New Password' : 'Confirm New Password'}
            </label>
            <input className="reads-input" type="password" value={form[k]}
              onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
          </div>
        ))}
        {error && <p className="text-reads-red text-sm">{error}</p>}
        <button onClick={save} disabled={loading}
          className="reads-btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={18} className="animate-spin" />}
          Update Password
        </button>
      </div>
    </Modal>
  );
};

// ── Delete Account Modal ───────────────────────────────────────────────────────
const DeleteAccountModal = ({ onClose, onDeleted }) => {
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    if (confirm !== 'DELETE') return setError('Type DELETE to confirm.');
    setLoading(true);
    try {
      await api.profile.deleteAccount();
      onDeleted();
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Delete Account" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-reads-red-bg border border-reads-red/20 rounded-xl p-3">
          <p className="text-reads-red text-sm font-semibold">This action is permanent and cannot be undone.</p>
          <p className="text-reads-red/80 text-xs mt-1">All your data, tokens, and progress will be deleted.</p>
        </div>
        <div>
          <label className="reads-label">Type DELETE to confirm</label>
          <input className={`reads-input ${confirm === 'DELETE' ? 'border-reads-red' : ''}`}
            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {error && <p className="text-reads-red text-sm">{error}</p>}
        <button onClick={handle} disabled={loading || confirm !== 'DELETE'}
          className="w-full bg-reads-red text-white font-bold rounded-xl py-3 disabled:opacity-40 flex items-center justify-center gap-2 active:scale-95 transition-transform">
          {loading && <Loader2 size={18} className="animate-spin" />}
          Delete My Account
        </button>
      </div>
    </Modal>
  );
};

// ── Settings Row ──────────────────────────────────────────────────────────────
const SettingRow = ({ icon: Icon, iconColor, iconBg, label, sub, onClick, danger = false, right }) => (
  <button onClick={onClick}
    className="flex items-center gap-3 w-full py-3.5 text-left active:scale-98 transition-transform">
    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
      <Icon size={18} className={iconColor} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={`font-semibold text-sm ${danger ? 'text-reads-red' : 'text-reads-navy'}`}>{label}</p>
      {sub && <p className="text-reads-muted text-xs">{sub}</p>}
    </div>
    {right ?? <ChevronRight size={16} className="text-reads-muted-light flex-shrink-0" />}
  </button>
);

// ── Main Profile Module ───────────────────────────────────────────────────────
export default function ProfileModule({ user, tokenBalance, onLogout, onUserUpdate }) {
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [localUser, setLocalUser] = useState(user);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const handleSaved = (updates) => {
    const updated = { ...localUser, ...updates };
    setLocalUser(updated);
    onUserUpdate?.(updated);
    setModal(null);
    showToast('Profile updated!');
  };

  const handleLogout = async () => {
    await api.auth.logout().catch(() => {});
    onLogout();
  };

  if (!localUser) return null;

  return (
    <div className="px-4 pt-4 pb-8 animate-fade-in">
      {/* Avatar & basic info */}
      <div className="flex flex-col items-center pt-4 pb-6">
        <div className="relative mb-4">
          <img
            src={localUser.avatar_url || AVATAR_FALLBACK(localUser.full_name)}
            alt={localUser.full_name}
            className="w-24 h-24 rounded-3xl object-cover shadow-reads-card"
          />
          <button
            onClick={() => showToast('Avatar upload coming soon!', 'info')}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-reads-green rounded-xl flex items-center justify-center shadow-reads-green"
          >
            <Camera size={16} className="text-white" />
          </button>
        </div>
        <h2 className="font-display font-black text-reads-navy text-xl">{localUser.full_name}</h2>
        <p className="text-reads-muted text-sm">{localUser.email}</p>
        <div className="flex gap-2 mt-2">
          {localUser.is_premium
            ? <Badge label="⭐ Premium" variant="gold" />
            : <Badge label="Free Plan" variant="gray" />
          }
          {localUser.role && <Badge label={localUser.role} variant="navy" className="capitalize" />}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Balance', value: `${(tokenBalance || 0).toLocaleString()}`, sub: '$READS' },
          { label: 'Lessons', value: localUser.lessons_completed ?? 0, sub: 'completed' },
          { label: 'Quizzes', value: localUser.quizzes_taken ?? 0, sub: 'taken' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="reads-card p-3 text-center">
            <p className="font-black text-reads-navy text-lg leading-none">{value}</p>
            <p className="text-reads-muted text-xs mt-0.5">{sub}</p>
            <p className="text-reads-muted-light text-[10px]">{label}</p>
          </div>
        ))}
      </div>

      {/* Referral code */}
      {localUser.referral_code && (
        <div className="reads-card p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-reads-muted text-xs">Referral Code</p>
            <p className="font-black text-reads-navy text-lg tracking-wider">{localUser.referral_code}</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(localUser.referral_code);
              showToast('Referral code copied!');
            }}
            className="reads-btn-outline px-3 py-2 text-xs"
          >
            Copy
          </button>
        </div>
      )}

      {/* Account Settings */}
      <div className="reads-card px-4 mb-4">
        <p className="text-reads-muted text-xs font-semibold uppercase tracking-wide py-3">Account</p>
        <div className="divide-y divide-gray-50">
          <SettingRow icon={Edit2} iconBg="bg-reads-green-bg" iconColor="text-reads-green"
            label="Edit Profile" sub="Name, phone" onClick={() => setModal('edit')} />
          <SettingRow icon={Shield} iconBg="bg-reads-navy/10" iconColor="text-reads-navy"
            label="Change Password" onClick={() => setModal('password')} />
          <SettingRow icon={Bell} iconBg="bg-reads-gold/10" iconColor="text-reads-gold-dark"
            label="Notifications"
            right={
              <div className={`w-10 h-6 rounded-full transition-all ${localUser.email_notifications ? 'bg-reads-green' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm m-0.5 transition-all ${localUser.email_notifications ? 'translate-x-4' : ''}`} />
              </div>
            }
          />
        </div>
      </div>

      {/* Premium */}
      {!localUser.is_premium && (
        <div className="reads-card px-4 mb-4">
          <div className="py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-reads-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Star size={18} className="text-reads-gold-dark" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-reads-navy text-sm">Go Premium</p>
                <p className="text-reads-muted text-xs">Earn 2× tokens on every lesson & quiz</p>
              </div>
              <button onClick={() => showToast('Coming soon!', 'info')}
                className="reads-btn-gold text-sm px-3 py-2">
                Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="reads-card px-4">
        <p className="text-reads-muted text-xs font-semibold uppercase tracking-wide py-3">Account Actions</p>
        <div className="divide-y divide-gray-50">
          <SettingRow icon={LogOut} iconBg="bg-gray-100" iconColor="text-reads-muted"
            label="Log Out" onClick={handleLogout} />
          <SettingRow icon={Trash2} iconBg="bg-reads-red-bg" iconColor="text-reads-red"
            label="Delete Account" danger onClick={() => setModal('delete')} />
        </div>
      </div>

      {/* Modals */}
      {modal === 'edit' && <EditProfileModal user={localUser} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal === 'password' && <ChangePasswordModal onClose={() => setModal(null)} />}
      {modal === 'delete' && (
        <DeleteAccountModal
          onClose={() => setModal(null)}
          onDeleted={() => { setModal(null); onLogout(); }}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
