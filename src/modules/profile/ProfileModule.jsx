import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Shield, Bell, Trash2, LogOut, ChevronRight, ChevronLeft,
  Edit2, Camera, CheckCircle, Loader2, Star, Award, BookOpen, Flame, Bookmark, BarChart3,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { Badge, Modal, Toast, ProgressBar, EmptyState, LoadingOverlay } from '../../components/UI.jsx';

const AVATAR_FALLBACK = (name) =>
  `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || 'U')}&backgroundColor=16a34a&fontColor=ffffff`;

// ── Edit Profile Modal ────────────────────────────────────────────────────────
const EditProfileModal = ({ user, onClose, onSaved }) => {
  const [form, setForm] = useState({
    full_name: user.full_name || '',
    phone: user.phone || '',
    birth_year: user.birth_year ? String(user.birth_year) : '',
    state: user.state || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!form.full_name.trim()) return setError('Name is required.');
    setLoading(true);
    try {
      await api.auth.updateProfile({
        ...form,
        birth_year: form.birth_year ? parseInt(form.birth_year) : null,
        state: form.state.trim() || null,
      });
      onSaved({ ...form, birth_year: form.birth_year ? parseInt(form.birth_year) : null });
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="reads-label">Birth Year</label>
            <input className="reads-input" type="number" placeholder="e.g. 2005"
              min="1950" max={new Date().getFullYear()}
              value={form.birth_year}
              onChange={(e) => setForm((f) => ({ ...f, birth_year: e.target.value }))} />
          </div>
          <div>
            <label className="reads-label">State</label>
            <input className="reads-input" placeholder="e.g. Rivers State"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
          </div>
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

// ── Achievement badge tile ────────────────────────────────────────────────────
const AchievementBadge = ({ achievement }) => (
  <div className="flex flex-col items-center text-center gap-2 w-20 flex-shrink-0">
    <div className="w-14 h-14 rounded-2xl bg-reads-gold/10 flex items-center justify-center">
      <Award size={24} className="text-reads-gold-dark" />
    </div>
    <div>
      <p className="text-reads-navy font-bold text-xs leading-tight">{achievement.title || achievement.name}</p>
      {achievement.earned_at && (
        <p className="text-reads-muted-light text-[10px] mt-0.5">
          {new Date(achievement.earned_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>
      )}
    </div>
  </div>
);

// ── Learning goal row ─────────────────────────────────────────────────────────
const GoalRow = ({ label, value, target }) => (
  <div className="mb-3 last:mb-0">
    <div className="flex justify-between mb-1">
      <span className="text-reads-navy text-sm font-semibold">{label}</span>
      <span className="text-reads-muted text-xs font-bold">{Math.min(value, target)} / {target}</span>
    </div>
    <ProgressBar value={value} max={target} color={value >= target ? 'green' : 'gold'} />
  </div>
);

// ── Vertical nav row (Overview / Achievements / etc.) ─────────────────────────
const NavRow = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick}
    className={`flex items-center gap-3 w-full py-3 px-3 rounded-xl text-left transition-colors ${
      active ? 'bg-reads-green-bg' : 'active:bg-gray-50'
    }`}>
    <Icon size={18} className={active ? 'text-reads-green' : 'text-reads-muted'} />
    <span className={`font-semibold text-sm flex-1 ${active ? 'text-reads-green' : 'text-reads-navy'}`}>{label}</span>
    <ChevronRight size={16} className="text-reads-muted-light" />
  </button>
);

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
  const [subview, setSubview] = useState('overview'); // overview | achievements | activity | saved | settings
  const [stats, setStats] = useState({ lessons_completed: 0, quizzes_taken: 0, streak: 0 });
  const [achievements, setAchievements] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, achRes] = await Promise.allSettled([
          api.profile.getStats(),
          api.profile.getAchievements(),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value || stats);
        if (achRes.status === 'fulfilled') setAchievements(achRes.value?.achievements || []);
      } catch (_) {}
      setLoadingExtras(false);
    };
    load();
  }, []);

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

  const lessonsCompleted = stats.lessons_completed ?? localUser.lessons_completed ?? 0;
  const quizzesTaken = stats.quizzes_taken ?? localUser.quizzes_taken ?? 0;
  const streak = stats.streak ?? 0;

  const NAV_ITEMS = [
    { key: 'overview', icon: User, label: 'Overview' },
    { key: 'edit', icon: Edit2, label: 'Edit Profile', isModal: true },
    { key: 'achievements', icon: Award, label: 'Achievements' },
    { key: 'activity', icon: BarChart3, label: 'Learning Activity' },
    { key: 'saved', icon: Bookmark, label: 'Saved Items' },
    { key: 'settings', icon: Shield, label: 'Settings' },
  ];

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

      {/* Stats — Lessons / Streak / Badges */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="reads-card p-3 text-center">
          <BookOpen size={16} className="text-reads-green mx-auto mb-1" />
          <p className="font-black text-reads-navy text-lg leading-none">{lessonsCompleted}</p>
          <p className="text-reads-muted-light text-[10px] mt-0.5">Lessons</p>
        </div>
        <div className="reads-card p-3 text-center">
          <Flame size={16} className="text-amber-500 mx-auto mb-1" />
          <p className="font-black text-reads-navy text-lg leading-none">{streak}</p>
          <p className="text-reads-muted-light text-[10px] mt-0.5">Streak</p>
        </div>
        <div className="reads-card p-3 text-center">
          <Award size={16} className="text-reads-gold-dark mx-auto mb-1" />
          <p className="font-black text-reads-navy text-lg leading-none">{achievements.length}</p>
          <p className="text-reads-muted-light text-[10px] mt-0.5">Badges</p>
        </div>
      </div>

      {/* Nav list */}
      <div className="reads-card px-2 py-1 mb-5">
        {NAV_ITEMS.map((item) => (
          <NavRow
            key={item.key}
            icon={item.icon}
            label={item.label}
            active={subview === item.key}
            onClick={() => item.isModal ? setModal('edit') : setSubview(item.key)}
          />
        ))}
      </div>

      {/* ── Overview ────────────────────────────────────────────────────── */}
      {subview === 'overview' && (
        <>
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

          {/* Learning Goals — derived from real stats; targets are sensible defaults
              until the backend exposes user-set goals via /profile/goals. */}
          <div className="reads-card p-4 mb-5">
            <p className="font-black text-reads-navy text-sm mb-3">Learning Goals</p>
            <GoalRow label="Complete 50 lessons" value={lessonsCompleted} target={50} />
            <GoalRow label="Maintain 7-day streak" value={streak} target={7} />
            <GoalRow label="Complete 20 quizzes" value={quizzesTaken} target={20} />
          </div>

          {/* Achievements preview */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-black text-reads-navy text-sm">Achievements</p>
              <button onClick={() => setSubview('achievements')} className="text-reads-teal text-xs font-semibold">
                View all
              </button>
            </div>
            {loadingExtras ? (
              <LoadingOverlay message="Loading achievements…" />
            ) : achievements.length === 0 ? (
              <p className="text-reads-muted text-xs">Complete lessons and quizzes to start earning badges!</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
                {achievements.slice(0, 6).map((a) => <AchievementBadge key={a.id} achievement={a} />)}
              </div>
            )}
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
        </>
      )}

      {/* ── Achievements (full list) ───────────────────────────────────── */}
      {subview === 'achievements' && (
        <div className="mb-5">
          {loadingExtras ? (
            <LoadingOverlay message="Loading achievements…" />
          ) : achievements.length === 0 ? (
            <EmptyState icon={Award} title="No badges yet" description="Complete lessons and quizzes to start earning badges." />
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {achievements.map((a) => <AchievementBadge key={a.id} achievement={a} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Learning Activity ──────────────────────────────────────────── */}
      {subview === 'activity' && (
        <div className="mb-5">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="reads-card p-4 text-center">
              <p className="font-black text-reads-navy text-2xl">{lessonsCompleted}</p>
              <p className="text-reads-muted text-xs mt-1">Lessons Completed</p>
            </div>
            <div className="reads-card p-4 text-center">
              <p className="font-black text-reads-navy text-2xl">{quizzesTaken}</p>
              <p className="text-reads-muted text-xs mt-1">Quizzes Taken</p>
            </div>
          </div>
          {/* TODO(backend): a /profile/activity endpoint returning daily lesson-time
              would let us render the activity line chart from the mockup here. */}
          <p className="text-reads-muted text-xs text-center py-4">
            Detailed daily activity charts are coming soon.
          </p>
        </div>
      )}

      {/* ── Saved Items ─────────────────────────────────────────────────── */}
      {subview === 'saved' && (
        <div className="mb-5">
          {/* TODO(backend): needs a bookmarks endpoint (e.g. POST/GET /lessons/{id}/save) */}
          <EmptyState icon={Bookmark} title="No saved items yet" description="Bookmark lessons while browsing to find them here." />
        </div>
      )}

      {/* ── Settings ────────────────────────────────────────────────────── */}
      {subview === 'settings' && (
        <>
          <div className="reads-card px-4 mb-4">
            <p className="text-reads-muted text-xs font-semibold uppercase tracking-wide py-3">Account</p>
            <div className="divide-y divide-gray-50">
              <SettingRow icon={Edit2} iconBg="bg-reads-green-bg" iconColor="text-reads-green"
                label="Edit Profile" sub="Name, phone, birth year, state" onClick={() => setModal('edit')} />
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

          <div className="reads-card px-4">
            <p className="text-reads-muted text-xs font-semibold uppercase tracking-wide py-3">Account Actions</p>
            <div className="divide-y divide-gray-50">
              <SettingRow icon={LogOut} iconBg="bg-gray-100" iconColor="text-reads-muted"
                label="Log Out" onClick={handleLogout} />
              <SettingRow icon={Trash2} iconBg="bg-reads-red-bg" iconColor="text-reads-red"
                label="Delete Account" danger onClick={() => setModal('delete')} />
            </div>
          </div>
        </>
      )}

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
