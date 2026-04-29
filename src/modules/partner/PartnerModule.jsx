import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, Wallet,
  Settings, UserPlus, Upload, Download, ChevronRight,
  School, Loader2, ArrowLeft, CheckCircle, XCircle, Edit2, Trash2
} from 'lucide-react';
import { api } from '../../services/api.js';
import SchoolPortalModule from './SchoolPortalModule.jsx';
import { LoadingOverlay, EmptyState, Badge, Modal, Toast, SectionHeader, TokenBadge, StatCard } from '../../components/UI.jsx';

// ── Overview ──────────────────────────────────────────────────────────────────
function Overview({ stats, onNavigate }) {
  return (
    <div className="px-4 pt-2 pb-4 space-y-5 animate-fade-in">
      <SectionHeader title="Dashboard" subtitle="Partner overview" />
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Total Students" value={stats.total_students ?? 0} color="green" onClick={() => onNavigate('students')} />
        <StatCard icon={BookOpen} label="Active Lessons" value={stats.active_lessons ?? 0} color="navy" onClick={() => onNavigate('lessons')} />
        <StatCard icon={Wallet} label="Token Balance" value={(stats.token_balance ?? 0).toLocaleString()} color="gold" onClick={() => onNavigate('wallet')} />
        <StatCard icon={ClipboardList} label="Pending Fees" value={stats.pending_fees ?? 0} color="red" onClick={() => onNavigate('fees')} />
      </div>
    </div>
  );
}

// ── Students Section ──────────────────────────────────────────────────────────
function StudentsSection() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.partner.getStudents()
      .then((d) => setStudents(d?.students || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) =>
    !search || s.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <SectionHeader title="Students" subtitle={`${students.length} enrolled`} />
      <input className="reads-input mb-4" placeholder="Search students…"
        value={search} onChange={(e) => setSearch(e.target.value)} />
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No students" description="Students who enroll with your school code appear here." />
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.id} className="flex items-center gap-3 reads-card px-4 py-3">
              <img src={`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(s.full_name)}&backgroundColor=16a34a&fontColor=ffffff`}
                alt={s.full_name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-reads-navy text-sm truncate">{s.full_name}</p>
                <p className="text-reads-muted text-xs">{s.class_name} · {s.email}</p>
              </div>
              <Badge label={s.fee_status === 'paid' ? 'Paid' : 'Unpaid'} variant={s.fee_status === 'paid' ? 'green' : 'red'} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Staff Section ─────────────────────────────────────────────────────────────
function StaffSection() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('academic_officer');
  const [inviting, setInviting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const loadStaff = () => {
    api.partner.getStaff()
      .then((d) => setStaff(d?.staff || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStaff(); }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await api.partner.inviteStaff(inviteEmail.trim(), inviteRole);
      showToast(`Invite sent to ${inviteEmail}`);
      setShowInvite(false);
      setInviteEmail('');
      loadStaff();
    } catch (e) {
      showToast(e.message, 'error');
    } finally { setInviting(false); }
  };

  const handleRemove = async (staffId) => {
    if (!confirm('Remove this staff member?')) return;
    try {
      await api.partner.removeStaff(staffId);
      showToast('Staff removed.');
      loadStaff();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  if (loading) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <SectionHeader
        title="Staff"
        action={
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 text-reads-green font-bold text-sm">
            <UserPlus size={16} /> Invite
          </button>
        }
      />
      {staff.length === 0 ? (
        <EmptyState icon={Users} title="No staff" description="Invite staff members to help manage your school." />
      ) : (
        <div className="space-y-2">
          {staff.map((s) => (
            <div key={s.id} className="flex items-center gap-3 reads-card px-4 py-3">
              <div className="w-10 h-10 bg-reads-navy rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{s.full_name?.[0] || '?'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-reads-navy text-sm truncate">{s.full_name || s.email}</p>
                <p className="text-reads-muted text-xs capitalize">{s.role?.replace('_', ' ')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge label={s.status === 'active' ? 'Active' : 'Invited'} variant={s.status === 'active' ? 'green' : 'gold'} />
                <button onClick={() => handleRemove(s.id)} className="text-reads-muted hover:text-reads-red transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showInvite && (
        <Modal title="Invite Staff" onClose={() => setShowInvite(false)}>
          <div className="space-y-4">
            <div>
              <label className="reads-label">Email Address</label>
              <input className="reads-input" type="email" placeholder="staff@school.edu"
                value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div>
              <label className="reads-label">Role</label>
              <select className="reads-input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="academic_officer">Academic Officer</option>
                <option value="finance_officer">Finance Officer</option>
                <option value="principal">Principal</option>
              </select>
            </div>
            <button onClick={handleInvite} disabled={inviting}
              className="reads-btn-primary w-full flex items-center justify-center gap-2">
              {inviting && <Loader2 size={18} className="animate-spin" />}
              Send Invite
            </button>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── Wallet Section ────────────────────────────────────────────────────────────
function PartnerWalletSection() {
  const [wallet, setWallet] = useState(null);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.partner.getWallet(), api.partner.getTransactions()])
      .then(([w, t]) => {
        if (w.status === 'fulfilled') setWallet(w.value);
        if (t.status === 'fulfilled') setTxs(t.value?.transactions || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <SectionHeader title="Partner Wallet" />
      <div className="bg-reads-navy rounded-3xl p-5 mb-4">
        <p className="text-reads-muted-light text-xs uppercase tracking-widest mb-1">Token Balance</p>
        <p className="font-black text-reads-gold text-3xl">{(wallet?.balance ?? 0).toLocaleString()}</p>
        <p className="text-reads-muted-light text-sm">$READS</p>
      </div>
      <div className="reads-card px-4">
        <p className="font-bold text-reads-navy text-sm py-3 border-b border-gray-50">Recent Transactions</p>
        {txs.length === 0 ? (
          <p className="text-reads-muted text-sm py-4 text-center">No transactions yet.</p>
        ) : (
          txs.slice(0, 10).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-reads-navy font-semibold text-sm">{tx.description}</p>
                <p className="text-reads-muted text-xs">{new Date(tx.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`font-black text-sm ${tx.amount > 0 ? 'text-reads-green' : 'text-reads-red'}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { key: 'students',  label: 'Students',  icon: Users },
  { key: 'staff',     label: 'Staff',     icon: UserPlus },
  { key: 'wallet',    label: 'Wallet',    icon: Wallet },
];

// ── Main Partner Module ───────────────────────────────────────────────────────
export default function PartnerModule({ user, onLogout }) {
  const [section, setSection] = useState('overview');
  const [stats, setStats] = useState({});
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      api.partner.getDashboardStats(),
      api.partner.getProfile(),
    ]).then(([s, p]) => {
      if (s.status === 'fulfilled') setStats(s.value || {});
      if (p.status === 'fulfilled') setProfile(p.value);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-reads-navy rounded-lg flex items-center justify-center">
              <School size={16} className="text-reads-gold" />
            </div>
            <div>
              <p className="font-bold text-reads-navy text-sm">{profile?.name || 'Partner Portal'}</p>
              <p className="text-reads-muted text-xs">{profile?.school_code || ''}</p>
            </div>
          </div>
          <button onClick={onLogout} className="text-reads-muted text-xs font-semibold">Log out</button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto pt-14 pb-24 min-h-screen">
        {section === 'overview' && <Overview stats={stats} onNavigate={setSection} />}
        {section === 'students' && <StudentsSection />}
        {section === 'staff' && <StaffSection />}
        {section === 'wallet' && <PartnerWalletSection />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-lg mx-auto flex items-center justify-around px-2">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const active = section === key;
            return (
              <button key={key} onClick={() => setSection(key)}
                className="flex flex-col items-center gap-1 py-3 px-4 min-w-[60px]">
                <Icon size={22} className={active ? 'text-reads-green' : 'text-reads-muted'} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] font-semibold ${active ? 'text-reads-green' : 'text-reads-muted'}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
