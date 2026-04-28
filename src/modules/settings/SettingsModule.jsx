import { useState } from 'react';
import { Shield, Bell, Eye, Info, ChevronRight, Moon, Globe, Smartphone, Lock } from 'lucide-react';
import { Toast } from '../../components/UI.jsx';

const SettingSection = ({ title, children }) => (
  <div className="mb-5">
    <p className="text-reads-muted text-xs font-semibold uppercase tracking-wide px-1 mb-2">{title}</p>
    <div className="reads-card px-4 divide-y divide-gray-50">
      {children}
    </div>
  </div>
);

const SettingRow = ({ icon: Icon, iconBg, iconColor, label, sub, right, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 py-3.5 ${onClick ? 'cursor-pointer active:scale-98 transition-transform' : ''}`}
  >
    <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
      <Icon size={18} className={iconColor} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-reads-navy font-semibold text-sm">{label}</p>
      {sub && <p className="text-reads-muted text-xs">{sub}</p>}
    </div>
    {right ?? (onClick && <ChevronRight size={16} className="text-reads-muted-light flex-shrink-0" />)}
  </div>
);

const Toggle = ({ value, onChange }) => (
  <button onClick={() => onChange(!value)}
    className={`w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${value ? 'bg-reads-green' : 'bg-gray-300'}`}>
    <div className={`w-5 h-5 bg-white rounded-full shadow-sm m-0.5 transition-all duration-300 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

export default function SettingsModule() {
  const [prefs, setPrefs] = useState({
    push_notifications: true,
    email_notifications: true,
    quiz_reminders: true,
    reward_alerts: true,
    marketing_emails: false,
    two_factor: false,
    private_profile: false,
    show_wallet: true,
  });
  const [toast, setToast] = useState(null);

  const set = (k) => (v) => {
    setPrefs((p) => ({ ...p, [k]: v }));
    setToast({ msg: 'Setting saved', type: 'success' });
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="px-4 pt-4 pb-8 animate-fade-in">
      <h1 className="font-display font-black text-reads-navy text-2xl mb-5">Settings</h1>

      <SettingSection title="Notifications">
        <SettingRow icon={Bell} iconBg="bg-reads-gold/10" iconColor="text-reads-gold-dark"
          label="Push Notifications" sub="In-app alerts"
          right={<Toggle value={prefs.push_notifications} onChange={set('push_notifications')} />}
        />
        <SettingRow icon={Globe} iconBg="bg-reads-navy/10" iconColor="text-reads-navy"
          label="Email Notifications" sub="Account updates via email"
          right={<Toggle value={prefs.email_notifications} onChange={set('email_notifications')} />}
        />
        <SettingRow icon={Bell} iconBg="bg-reads-green-bg" iconColor="text-reads-green"
          label="Quiz Reminders" sub="Daily learning nudges"
          right={<Toggle value={prefs.quiz_reminders} onChange={set('quiz_reminders')} />}
        />
        <SettingRow icon={Bell} iconBg="bg-reads-gold/10" iconColor="text-reads-gold-dark"
          label="Reward Alerts" sub="When you earn $READS tokens"
          right={<Toggle value={prefs.reward_alerts} onChange={set('reward_alerts')} />}
        />
        <SettingRow icon={Globe} iconBg="bg-gray-100" iconColor="text-reads-muted"
          label="Marketing Emails" sub="Promotions and product news"
          right={<Toggle value={prefs.marketing_emails} onChange={set('marketing_emails')} />}
        />
      </SettingSection>

      <SettingSection title="Security">
        <SettingRow icon={Shield} iconBg="bg-reads-navy/10" iconColor="text-reads-navy"
          label="Two-Factor Authentication" sub={prefs.two_factor ? 'Enabled' : 'Disabled — tap to enable'}
          right={<Toggle value={prefs.two_factor} onChange={set('two_factor')} />}
        />
        <SettingRow icon={Lock} iconBg="bg-reads-green-bg" iconColor="text-reads-green"
          label="Active Sessions" sub="Manage devices logged in"
          onClick={() => setToast({ msg: 'Coming soon!', type: 'info' })}
        />
        <SettingRow icon={Smartphone} iconBg="bg-reads-gold/10" iconColor="text-reads-gold-dark"
          label="Login History" sub="View recent logins"
          onClick={() => setToast({ msg: 'Coming soon!', type: 'info' })}
        />
      </SettingSection>

      <SettingSection title="Privacy">
        <SettingRow icon={Eye} iconBg="bg-reads-navy/10" iconColor="text-reads-navy"
          label="Private Profile" sub="Hide profile from other users"
          right={<Toggle value={prefs.private_profile} onChange={set('private_profile')} />}
        />
        <SettingRow icon={Eye} iconBg="bg-reads-green-bg" iconColor="text-reads-green"
          label="Show Wallet Balance" sub="Visible on leaderboard"
          right={<Toggle value={prefs.show_wallet} onChange={set('show_wallet')} />}
        />
      </SettingSection>

      <SettingSection title="About">
        <SettingRow icon={Info} iconBg="bg-reads-navy/10" iconColor="text-reads-navy"
          label="App Version" sub="v2.0.0"
          right={<span className="text-reads-muted text-sm">v2.0.0</span>}
        />
        <SettingRow icon={Info} iconBg="bg-gray-100" iconColor="text-reads-muted"
          label="Privacy Policy"
          onClick={() => window.open('https://readstechnet.vercel.app/privacy-policy.html', '_blank')}
        />
        <SettingRow icon={Info} iconBg="bg-gray-100" iconColor="text-reads-muted"
          label="Terms of Service"
          onClick={() => window.open('https://readstechnet.vercel.app/terms-of-service.html', '_blank')}
        />
      </SettingSection>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
