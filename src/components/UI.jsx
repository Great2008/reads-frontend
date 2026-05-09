// ─────────────────────────────────────────────────────────────────────────────
// Shared UI Components for $READS
// ─────────────────────────────────────────────────────────────────────────────
import { Loader2, AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

// ── Spinner ───────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 20, className = '' }) => (
  <Loader2 size={size} className={`animate-spin text-reads-green ${className}`} />
);

// ── Loading overlay ───────────────────────────────────────────────────────────
export const LoadingOverlay = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <Spinner size={32} />
    <p className="text-reads-muted text-sm">{message}</p>
  </div>
);

// ── Empty state ───────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
    {Icon && (
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={28} className="text-reads-muted" />
      </div>
    )}
    <h3 className="font-bold text-reads-navy text-base mb-1">{title}</h3>
    {description && <p className="text-reads-muted text-sm mb-4">{description}</p>}
    {action && action}
  </div>
);

// ── Toast ─────────────────────────────────────────────────────────────────────
const TOAST_ICONS = {
  success: <CheckCircle size={18} className="text-reads-green flex-shrink-0" />,
  error:   <XCircle    size={18} className="text-reads-red flex-shrink-0" />,
  info:    <Info       size={18} className="text-reads-gold flex-shrink-0" />,
  warning: <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />,
};

export const Toast = ({ message, type = 'info', onClose }) => (
  <div className={`
    fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm
    bg-white rounded-2xl shadow-reads-card border border-gray-100 
    px-4 py-3 flex items-center gap-3 animate-slide-up
  `}>
    {TOAST_ICONS[type]}
    <p className="text-reads-navy text-sm font-medium flex-1">{message}</p>
    <button onClick={onClose} className="text-reads-muted hover:text-reads-navy transition-colors">
      <X size={16} />
    </button>
  </div>
);

// ── Bottom Sheet Modal ────────────────────────────────────────────────────────
export const BottomSheet = ({ title, children, onClose, footer }) => (
  <div className="fixed inset-0 z-50 flex flex-col justify-end">
    {/* Backdrop */}
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    {/* Sheet */}
    <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col animate-slide-up">
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="font-black text-reads-navy text-base">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-reads-muted" />
          </button>
        </div>
      )}
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {children}
      </div>
      {/* Footer */}
      {footer && (
        <div className="px-5 pb-6 pt-3 border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  </div>
);

// ── Modal (centered) ──────────────────────────────────────────────────────────
export const Modal = ({ title, children, onClose, maxWidth = 'max-w-sm' }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-6">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} animate-slide-up flex flex-col`}
         style={{ maxHeight: '90vh' }}>
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-black text-reads-navy text-base">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} className="text-reads-muted" />
          </button>
        </div>
      )}
      <div className="p-5 overflow-y-auto flex-1">{children}</div>
    </div>
  </div>
);

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  green:  'bg-reads-green-bg text-reads-green',
  gold:   'bg-reads-gold/10 text-reads-gold-dark',
  red:    'bg-reads-red-bg text-reads-red',
  gray:   'bg-gray-100 text-gray-600',
  navy:   'bg-reads-navy/10 text-reads-navy',
  teal:   'bg-teal-50 text-reads-teal',
};

export const Badge = ({ label, variant = 'green', className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${BADGE_STYLES[variant]} ${className}`}>
    {label}
  </span>
);

// ── Token display ─────────────────────────────────────────────────────────────
export const TokenBadge = ({ amount, size = 'sm' }) => {
  const text = size === 'lg' ? 'text-base' : 'text-xs';
  const px = size === 'lg' ? 'px-3 py-1.5' : 'px-2 py-0.5';
  return (
    <span className={`inline-flex items-center gap-1 bg-reads-gold/10 text-reads-gold-dark font-bold rounded-full ${px} ${text}`}>
      <img src="/assets/reads-logo.png" alt="$READS" className="w-6 h-6 object-contain" />
      {typeof amount === 'number' ? amount.toLocaleString() : amount} $READS
    </span>
  );
};

// ── Input ──────────────────────────────────────────────────────────────────────
export const Input = ({ label, error, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="reads-label">{label}</label>}
    <input
      className={`reads-input ${error ? 'border-reads-red' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-reads-red text-xs mt-1">{error}</p>}
  </div>
);

// ── Textarea ──────────────────────────────────────────────────────────────────
export const Textarea = ({ label, error, rows = 4, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="reads-label">{label}</label>}
    <textarea
      rows={rows}
      className={`reads-input resize-none ${error ? 'border-reads-red' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-reads-red text-xs mt-1">{error}</p>}
  </div>
);

// ── Select ─────────────────────────────────────────────────────────────────────
export const Select = ({ label, error, options = [], className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="reads-label">{label}</label>}
    <select
      className={`reads-input ${error ? 'border-reads-red' : ''} ${className}`}
      {...props}
    >
      {options.map((opt) =>
        typeof opt === 'string'
          ? <option key={opt} value={opt}>{opt}</option>
          : <option key={opt.value} value={opt.value}>{opt.label}</option>
      )}
    </select>
    {error && <p className="text-reads-red text-xs mt-1">{error}</p>}
  </div>
);

// ── Section Header ────────────────────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-4">
    <div>
      <h2 className="text-reads-navy font-black text-lg leading-tight">{title}</h2>
      {subtitle && <p className="text-reads-muted text-sm mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0 ml-3">{action}</div>}
  </div>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, trend, color = 'green', onClick }) => {
  const colors = {
    green: { bg: 'bg-reads-green-bg', text: 'text-reads-green' },
    gold:  { bg: 'bg-reads-gold/10',  text: 'text-reads-gold-dark' },
    navy:  { bg: 'bg-reads-navy/10',  text: 'text-reads-navy' },
    red:   { bg: 'bg-reads-red-bg',   text: 'text-reads-red' },
  };
  const c = colors[color] || colors.green;
  return (
    <button
      onClick={onClick}
      className="reads-card p-4 text-left w-full active:scale-95 transition-transform"
    >
      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
        <Icon size={20} className={c.text} />
      </div>
      <p className="text-reads-muted text-xs font-medium mb-0.5">{label}</p>
      <p className="text-reads-navy font-black text-xl">{value}</p>
      {trend && <p className="text-reads-green text-xs mt-1">{trend}</p>}
    </button>
  );
};

// ── Progress Bar ──────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, max = 100, label, color = 'green' }) => {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor = color === 'gold' ? 'bg-reads-gold' : 'bg-reads-green';
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-reads-muted">{label}</span>
          <span className="text-xs font-bold text-reads-navy">{pct}%</span>
        </div>
      )}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ── List Item Row ─────────────────────────────────────────────────────────────
export const ListRow = ({ icon: Icon, iconColor = 'text-reads-green', iconBg = 'bg-reads-green-bg', title, subtitle, right, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full py-3 text-left ${onClick ? 'active:scale-98 transition-transform' : ''} ${className}`}
  >
    {Icon && (
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={iconColor} />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-reads-navy font-semibold text-sm leading-tight truncate">{title}</p>
      {subtitle && <p className="text-reads-muted text-xs mt-0.5">{subtitle}</p>}
    </div>
    {right && <div className="flex-shrink-0 ml-2">{right}</div>}
  </button>
);
