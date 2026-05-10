import { useState, useEffect } from 'react';
import {
  Award, LayoutDashboard, BookOpen, Wallet, User, Grid,
  Bell, Shield, School, SettingsIcon,
  GraduationCap, ShoppingBag, ClipboardList, Sparkles, Trophy
} from 'lucide-react';

import { api } from './services/api.js';

// ── Modules ───────────────────────────────────────────────────────────────────
import WelcomePage          from './modules/welcome/WelcomePage.jsx';
import AuthModule           from './modules/auth/AuthModule.jsx';
import ResetPasswordPage    from './modules/auth/ResetPasswordPage.jsx';
import AcceptInvitePage     from './modules/auth/AcceptInvitePage.jsx';
import LoadingScreen        from './components/LoadingScreen.jsx';
import Dashboard            from './modules/dashboard/Dashboard.jsx';
import LearnModule          from './modules/learn/LearnModule.jsx';
import WalletModule         from './modules/wallet/WalletModule.jsx';
import ProfileModule        from './modules/profile/ProfileModule.jsx';
import SettingsModule       from './modules/settings/SettingsModule.jsx';
import NotificationInbox    from './modules/notifications/NotificationInbox.jsx';
import SchoolModule         from './modules/school/SchoolModule.jsx';
import StudentPortalModule  from './modules/school/StudentPortalModule.jsx';
import ChallengeModule      from './modules/challenges/ChallengeModule.jsx';
import TutorsModule         from './modules/tutors/TutorsModule.jsx';
import ExamsModule          from './modules/exams/ExamsModule.jsx';
import MarketplaceModule    from './modules/marketplace/MarketplaceModule.jsx';
import AITutorModule        from './modules/ai-tutor/AITutorModule.jsx';
import AdminModule          from './modules/admin/AdminModule.jsx';
import PartnerModule        from './modules/partner/PartnerModule.jsx';

// ─────────────────────────────────────────────
// "More" tile grid
// ─────────────────────────────────────────────
const MoreModule = ({ onNavigate }) => {
  const tiles = [
    { label: 'My School',   icon: School,       view: 'school',      color: '#16A34A', bg: '#f0fdf4' },
    { label: 'My Results',  icon: Award,        view: 'student-portal', color: '#0D1F3C', bg: '#f0fdf4' },
    { label: 'Challenge',    icon: Trophy,       view: 'challenge',     color: '#FFD700', bg: '#1a2a4a' },
    { label: 'Tutors',      icon: GraduationCap, view: 'tutors',     color: '#6366F1', bg: '#eef2ff' },
    { label: 'Exams',       icon: ClipboardList, view: 'exams',      color: '#0D7A6E', bg: '#f0fdfa' },
    { label: 'Marketplace', icon: ShoppingBag,   view: 'marketplace',color: '#D4A017', bg: '#fffbeb' },
    { label: 'AI Tutor',    icon: Sparkles,      view: 'ai-tutor',   color: '#7C3AED', bg: '#f5f3ff' },
    { label: 'Notifications',icon: Bell,         view: 'notifications',color: '#F59E0B', bg: '#fff7ed' },
    { label: 'Settings',    icon: SettingsIcon,  view: 'settings',   color: '#6B7280', bg: '#f9fafb' },
  ];

  return (
    <div className="px-4 pt-6 pb-8 animate-fade-in">
      <h2 className="font-display font-black text-reads-navy text-xl mb-5">More</h2>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map(({ label, icon: Icon, view, color, bg }) => (
          <button key={view} onClick={() => onNavigate(view)}
            className="flex flex-col items-start gap-3 p-5 reads-card active:scale-95 transition-transform text-left">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: bg }}>
              <Icon size={24} style={{ color }} />
            </div>
            <p className="text-reads-navy font-bold text-sm">{label}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Bottom Navigation Bar
// ─────────────────────────────────────────────
const BottomNav = ({ view, onNavigate, isAdmin, unreadCount }) => {
  const tabs = [
    { name: 'Home',    icon: LayoutDashboard, view: 'dashboard' },
    { name: 'Learn',   icon: BookOpen,        view: 'learn' },
    { name: 'Wallet',  icon: Wallet,          view: 'wallet' },
    { name: 'Profile', icon: User,            view: 'profile' },
    { name: 'More',    icon: Grid,            view: 'more' },
  ];
  if (isAdmin) tabs.push({ name: 'Admin', icon: Shield, view: 'admin' });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-2px_16px_rgba(0,0,0,0.07)]">
      <div className="max-w-lg mx-auto flex items-center justify-around px-1 pb-safe">
        {tabs.map((tab) => {
          const active = view === tab.view || (tab.view === 'more' && !['dashboard','learn','wallet','profile'].includes(view));
          return (
            <button key={tab.name} onClick={() => onNavigate(tab.view)}
              className="flex flex-col items-center gap-0.5 py-3 px-3 min-w-[54px] relative transition-colors">
              {/* Active dot */}
              {active && <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-reads-green rounded-full" />}
              <tab.icon
                size={22}
                className={`transition-colors ${active ? 'text-reads-green' : 'text-reads-muted'}`}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={`text-[10px] font-semibold transition-colors ${active ? 'text-reads-green' : 'text-reads-muted'}`}>
                {tab.name}
              </span>
              {/* Unread badge on Profile */}
              {tab.view === 'more' && unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-reads-red text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// ─────────────────────────────────────────────
// Top Bar (logo + bell)
// ─────────────────────────────────────────────
const TopBar = ({ unreadCount, onBell }) => (
  <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm">
    <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-reads-navy rounded-xl flex items-center justify-center">
          <img src="/assets/reads-logo.png" alt="$READS" className="w-6 h-6 object-contain" />
        </div>
        <span className="font-display font-black text-reads-navy text-base">$READS</span>
      </div>
      <button onClick={onBell}
        className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
        <Bell size={20} className="text-reads-navy" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-reads-red text-white text-xs font-black rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────
export default function App() {
  const [user, setUser]               = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [view, setView]               = useState('welcome');
  const [isLoading, setIsLoading]     = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Detect special URL paths
  const path = window.location.pathname;
  const isPasswordReset = path === '/reset-password';
  const isStaffInvite   = path === '/accept-invite';

  const navigate = (newView) => setView(newView);

  const handleLoginSuccess = async () => {
    const userData = await api.auth.me();
    if (!userData) { handleLogout(); return; }
    const [stats, balance, notifData] = await Promise.allSettled([
      api.profile.getStats(),
      api.wallet.getBalance(),
      api.notifications.getUnreadCount(),
    ]);
    const s = stats.status === 'fulfilled' ? stats.value : {};
    setUser({
      ...userData,
      lessons_completed: s.lessons_completed ?? 0,
      quizzes_taken: s.quizzes_taken ?? 0,
    });
    setTokenBalance(balance.status === 'fulfilled' ? balance.value : 0);
    setUnreadCount(notifData.status === 'fulfilled' ? notifData.value?.count ?? 0 : 0);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await api.auth.logout().catch(() => {});
    setUser(null);
    setTokenBalance(0);
    setUnreadCount(0);
    setView('welcome');
  };

  // Session restore
  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        await handleLoginSuccess();
      } else {
        setView('welcome');
      }
      setIsLoading(false);
    };
    restore();
  }, []);

  // Content protection — disable right-click, text selection, copy, screenshot keys
  useEffect(() => {
    const noContext  = (e) => e.preventDefault();
    const noCopy     = (e) => { if (e.type === 'copy' || e.type === 'cut') e.preventDefault(); };
    const noKeys     = (e) => {
      // Block PrintScreen, Ctrl+P (print), Ctrl+S (save), Ctrl+U (source)
      if (e.key === 'PrintScreen') e.preventDefault();
      if (e.ctrlKey && ['p','s','u'].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const noSelect   = () => { if (window.getSelection) window.getSelection().removeAllRanges(); };

    document.addEventListener('contextmenu', noContext);
    document.addEventListener('copy',        noCopy);
    document.addEventListener('cut',         noCopy);
    document.addEventListener('keydown',     noKeys);
    document.addEventListener('keyup',       (e) => { if (e.key === 'PrintScreen') noSelect(); });

    return () => {
      document.removeEventListener('contextmenu', noContext);
      document.removeEventListener('copy',        noCopy);
      document.removeEventListener('cut',         noCopy);
      document.removeEventListener('keydown',     noKeys);
    };
  }, []);

  // Refresh balance on wallet/dashboard view
  useEffect(() => {
    if (user && (view === 'dashboard' || view === 'wallet')) {
      api.wallet.getBalance().then(setTokenBalance);
    }
  }, [view, user]);

  // ── Special routes ──────────────────────────────────────────────────────────
  if (isStaffInvite)   return <AcceptInvitePage />;
  if (isPasswordReset) return <ResetPasswordPage />;
  if (isLoading)       return <LoadingScreen />;

  // ── Unauthenticated ─────────────────────────────────────────────────────────
  if (!user) {
    if (view === 'welcome') return <WelcomePage onGetStarted={() => setView('login')} />;
    return <AuthModule onLoginSuccess={handleLoginSuccess} />;
  }

  // ── Partner portal ──────────────────────────────────────────────────────────
  if (user.account_type === 'partner') {
    return <PartnerModule onLogout={handleLogout} />;
  }

  // ── AI Tutor — full-screen (no top/bottom bar) ──────────────────────────────
  if (view === 'ai-tutor') {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="max-w-lg mx-auto h-screen flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
            <button onClick={() => navigate('more')} className="text-reads-muted text-sm font-semibold">← Back</button>
          </div>
          <div className="flex-1 overflow-hidden">
            <AITutorModule />
          </div>
        </div>
      </div>
    );
  }

  // ── Main student app ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <TopBar unreadCount={unreadCount} onBell={() => setShowNotifications(true)} />

      {/* Notification drawer */}
      {showNotifications && (
        <NotificationInbox
          onClose={() => setShowNotifications(false)}
          onUnreadCountChange={setUnreadCount}
        />
      )}

      <main className="max-w-lg mx-auto w-full pb-24 pt-14 min-h-screen">

        {view === 'dashboard' && (
          <Dashboard
            user={user}
            wallet={{ balance: tokenBalance }}
            onNavigate={navigate}
          />
        )}

        {view === 'learn' && (
          <LearnModule onUpdateWallet={setTokenBalance} />
        )}

        {view === 'wallet' && (
          <WalletModule
            balance={tokenBalance}
            onUpdateBalance={setTokenBalance}
          />
        )}

        {view === 'profile' && (
          <ProfileModule
            user={user}
            tokenBalance={tokenBalance}
            onLogout={handleLogout}
            onUserUpdate={setUser}
          />
        )}

        {view === 'settings' && <SettingsModule />}

        {view === 'school' && (
          <SchoolModule tokenBalance={tokenBalance} onBalanceUpdate={setTokenBalance} />
        )}
        {view === 'student-portal' && (
          <StudentPortalModule onBack={() => navigate('more')} />
        )}
        {view === 'challenge' && (
          <ChallengeModule onBack={() => navigate('more')} />
        )}

        {view === 'tutors' && (
          <TutorsModule tokenBalance={tokenBalance} onUpdateBalance={setTokenBalance} />
        )}

        {view === 'exams' && (
          <ExamsModule tokenBalance={tokenBalance} onUpdateBalance={setTokenBalance} />
        )}

        {view === 'marketplace' && (
          <MarketplaceModule tokenBalance={tokenBalance} onUpdateBalance={setTokenBalance} />
        )}

        {view === 'notifications' && (
          <NotificationInbox
            onClose={() => navigate('more')}
            onUnreadCountChange={setUnreadCount}
          />
        )}

        {view === 'admin' && user?.is_admin && (
          <AdminModule currentUserId={user.id} />
        )}

        {view === 'more' && (
          <MoreModule onNavigate={navigate} />
        )}

      </main>

      <BottomNav
        view={view}
        onNavigate={navigate}
        isAdmin={user?.is_admin}
        unreadCount={unreadCount}
      />
    </div>
  );
}
