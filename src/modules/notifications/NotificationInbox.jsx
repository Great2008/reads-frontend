import { useState, useEffect } from 'react';
import { Bell, CheckCheck, X, Info, AlertCircle, CheckCircle, Coins, BookOpen } from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay, EmptyState } from '../../components/UI.jsx';

const TYPE_META = {
  lesson:      { icon: BookOpen,      bg: 'bg-reads-green-bg',  color: 'text-reads-green' },
  reward:      { icon: Coins,         bg: 'bg-reads-gold/10',   color: 'text-reads-gold-dark' },
  system:      { icon: Info,          bg: 'bg-reads-navy/10',   color: 'text-reads-navy' },
  warning:     { icon: AlertCircle,   bg: 'bg-amber-50',        color: 'text-amber-600' },
  success:     { icon: CheckCircle,   bg: 'bg-reads-green-bg',  color: 'text-reads-green' },
};

const NotifCard = ({ notif, onRead }) => {
  const meta = TYPE_META[notif.type] || TYPE_META.system;
  const Icon = meta.icon;

  return (
    <button
      onClick={() => !notif.is_read && onRead(notif.id)}
      className={`flex items-start gap-3 w-full p-4 rounded-2xl border text-left transition-all mb-2 active:scale-98 ${
        notif.is_read ? 'bg-white border-gray-100' : 'bg-reads-green-bg/30 border-reads-green/20'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon size={18} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${notif.is_read ? 'text-reads-navy' : 'text-reads-navy font-semibold'}`}>
          {notif.message}
        </p>
        <p className="text-reads-muted text-xs mt-1">
          {new Date(notif.created_at).toLocaleString()}
        </p>
      </div>
      {!notif.is_read && (
        <div className="w-2 h-2 bg-reads-green rounded-full flex-shrink-0 mt-2" />
      )}
    </button>
  );
};

export default function NotificationInbox({ onClose, onUnreadCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.notifications.list({ limit: 50 });
        setNotifications(data?.notifications || []);
        const unread = (data?.notifications || []).filter((n) => !n.is_read).length;
        onUnreadCountChange?.(unread);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const handleRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
      );
      const unread = notifications.filter((n) => !n.is_read && n.id !== id).length;
      onUnreadCountChange?.(unread);
    } catch (_) {}
  };

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      onUnreadCountChange?.(0);
    } catch (_) {}
    setMarking(false);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel — slides up from bottom */}
      <div className="relative mt-auto bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-reads-navy" />
            <h3 className="font-black text-reads-navy text-base">Notifications</h3>
            {unreadCount > 0 && (
              <span className="w-5 h-5 bg-reads-red text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} disabled={marking}
                className="flex items-center gap-1 text-reads-teal text-xs font-semibold">
                <CheckCheck size={14} />
                {marking ? 'Marking…' : 'Mark all read'}
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <X size={20} className="text-reads-muted" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <LoadingOverlay message="Loading notifications…" />
          ) : notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
          ) : (
            notifications.map((n) => (
              <NotifCard key={n.id} notif={n} onRead={handleRead} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
