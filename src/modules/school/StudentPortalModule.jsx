import { useState, useEffect } from 'react';
import {
  Award, DollarSign, TrendingUp, ChevronRight,
  ArrowLeft, Loader2, CheckCircle, XCircle,
  AlertCircle, BookOpen, Star
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

const gradeColor = (grade) => {
  if (!grade) return 'text-reads-muted';
  if (['A1', 'B2', 'B3'].includes(grade)) return 'text-reads-green';
  if (['C4', 'C5', 'C6'].includes(grade)) return 'text-amber-600';
  return 'text-red-500';
};

const gradeBg = (grade) => {
  if (!grade) return 'bg-gray-100';
  if (['A1', 'B2', 'B3'].includes(grade)) return 'bg-reads-green-bg';
  if (['C4', 'C5', 'C6'].includes(grade)) return 'bg-amber-50';
  return 'bg-red-50';
};

// ── Results Section ───────────────────────────────────────────────────────────
function ResultsSection() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState('');

  useEffect(() => {
    api.students.getMyResults()
      .then(d => setResults(d?.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterTerm
    ? results.filter(r => r.term === parseInt(filterTerm))
    : results;

  // Group by term
  const byTerm = filtered.reduce((acc, r) => {
    const key = `Term ${r.term}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  // Calculate average per term
  const termAvg = (items) => {
    const scored = items.filter(r => r.score !== null);
    if (!scored.length) return null;
    return (scored.reduce((s, r) => s + r.score, 0) / scored.length).toFixed(1);
  };

  if (loading) return (
    <div className="flex justify-center py-14">
      <Loader2 size={24} className="animate-spin text-reads-green" />
    </div>
  );

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in space-y-4">
      <div>
        <h2 className="font-black text-reads-navy text-lg">My Results</h2>
        <p className="text-reads-muted text-xs">Academic performance by term</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', '1', '2', '3'].map(t => (
          <button key={t} onClick={() => setFilterTerm(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors
              ${filterTerm === t ? 'bg-reads-navy text-white' : 'bg-gray-100 text-reads-muted'}`}>
            {t === '' ? 'All' : `Term ${t}`}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Award size={28} className="text-gray-400" />
          </div>
          <p className="font-bold text-reads-navy text-sm">No results yet</p>
          <p className="text-reads-muted text-xs mt-1">Results will appear here once published by your school.</p>
        </div>
      ) : (
        Object.entries(byTerm).map(([term, items]) => (
          <div key={term}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-black text-reads-navy text-xs uppercase tracking-widest">{term}</p>
              {termAvg(items) && (
                <div className="flex items-center gap-1.5">
                  <Star size={12} className="text-reads-gold" />
                  <span className="font-bold text-reads-navy text-xs">Avg: {termAvg(items)}%</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {items.map(r => (
                <div key={r.id} className="reads-card px-4 py-3 flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${gradeBg(r.grade)}`}>
                    <span className={`font-black text-sm leading-tight ${gradeColor(r.grade)}`}>{r.grade || '—'}</span>
                    {r.score !== null && <span className="text-[9px] text-reads-muted font-semibold">{r.score}%</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-reads-navy text-sm truncate">{r.subject_name}</p>
                    {r.remarks && <p className="text-reads-muted text-xs mt-0.5 truncate">{r.remarks}</p>}
                  </div>
                  {!r.is_published && (
                    <span className="text-[10px] bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-full flex-shrink-0">Pending</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Fees Section ──────────────────────────────────────────────────────────────
function FeesSection() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const load = () => {
    api.students.getMyFees()
      .then(d => setFees(d?.fees || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handlePay = async (fee) => {
    if (!confirm(`Pay ₦${fee.amount?.toLocaleString()} from your token balance for Term ${fee.term}?`)) return;
    setPaying(fee.id);
    try {
      await api.students.payFee(fee.id);
      showToast('Payment submitted! Awaiting school confirmation.');
      load();
    } catch (e) {
      showToast(e.message || 'Payment failed', 'error');
    } finally { setPaying(null); }
  };

  const statusColor = (s) => {
    if (s === 'acknowledged') return 'text-reads-green';
    if (s === 'pending') return 'text-amber-600';
    return 'text-reads-muted';
  };

  const statusLabel = (s) => {
    if (s === 'acknowledged') return 'Paid ✓';
    if (s === 'pending') return 'Pending';
    return 'Unpaid';
  };

  const unpaidTotal = fees.filter(f => f.status === 'unpaid').reduce((s, f) => s + f.amount, 0);

  if (loading) return (
    <div className="flex justify-center py-14">
      <Loader2 size={24} className="animate-spin text-reads-green" />
    </div>
  );

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in space-y-4">
      <div>
        <h2 className="font-black text-reads-navy text-lg">School Fees</h2>
        <p className="text-reads-muted text-xs">Pay fees using your $READS tokens</p>
      </div>

      {unpaidTotal > 0 && (
        <div className="reads-card px-4 py-3 border-l-4 border-red-400 bg-red-50">
          <p className="font-bold text-red-700 text-sm">Outstanding Balance</p>
          <p className="font-black text-red-600 text-xl">₦{unpaidTotal.toLocaleString()}</p>
        </div>
      )}

      {fees.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <DollarSign size={28} className="text-gray-400" />
          </div>
          <p className="font-bold text-reads-navy text-sm">No fee schedules yet</p>
          <p className="text-reads-muted text-xs mt-1">Your school hasn't set up fees yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fees.map(f => (
            <div key={f.id} className="reads-card px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-reads-navy text-sm">Term {f.term} — {f.class_name}</p>
                  <p className="font-black text-reads-navy text-lg">₦{f.amount?.toLocaleString()}</p>
                  {f.due_date && (
                    <p className="text-reads-muted text-xs">Due: {new Date(f.due_date).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-bold ${statusColor(f.status)}`}>{statusLabel(f.status)}</span>
                  {f.status === 'unpaid' && (
                    <button onClick={() => handlePay(f)} disabled={paying === f.id}
                      className="reads-btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
                      {paying === f.id && <Loader2 size={14} className="animate-spin" />}
                      Pay Now
                    </button>
                  )}
                  {f.status === 'pending' && (
                    <span className="text-[10px] bg-amber-50 text-amber-600 font-bold px-2 py-1 rounded-full">
                      Awaiting confirmation
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && <Toast {...toast} />}
    </div>
  );
}

// ── Promotion History ─────────────────────────────────────────────────────────
function PromotionSection() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.students.getPromotionHistory()
      .then(d => setHistory(d?.history || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const typeConfig = {
    promoted:  { label: 'Promoted',  color: 'text-reads-green',  bg: 'bg-reads-green-bg' },
    repeated:  { label: 'Repeated',  color: 'text-amber-600',    bg: 'bg-amber-50' },
    graduated: { label: 'Graduated', color: 'text-purple-600',   bg: 'bg-purple-50' },
  };

  if (loading) return (
    <div className="flex justify-center py-14">
      <Loader2 size={24} className="animate-spin text-reads-green" />
    </div>
  );

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in space-y-4">
      <div>
        <h2 className="font-black text-reads-navy text-lg">Academic History</h2>
        <p className="text-reads-muted text-xs">Your class promotions and academic milestones</p>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp size={28} className="text-gray-400" />
          </div>
          <p className="font-bold text-reads-navy text-sm">No history yet</p>
          <p className="text-reads-muted text-xs mt-1">Your promotion history will appear here.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />
          <div className="space-y-4">
            {history.map((p, i) => {
              const cfg = typeConfig[p.type] || typeConfig.promoted;
              return (
                <div key={p.id} className="flex items-start gap-4 relative">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10 ${cfg.bg}`}>
                    <TrendingUp size={16} className={cfg.color} />
                  </div>
                  <div className="reads-card flex-1 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-reads-muted text-[10px]">{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    {p.from_class && p.to_class && (
                      <p className="text-reads-navy text-sm font-semibold mt-1">
                        {p.from_class} → {p.to_class}
                      </p>
                    )}
                    {p.to_class && !p.from_class && (
                      <p className="text-reads-navy text-sm font-semibold mt-1">{p.to_class}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'results',    label: 'Results',    icon: Award },
  { key: 'fees',       label: 'Fees',       icon: DollarSign },
  { key: 'history',   label: 'History',    icon: TrendingUp },
];

export default function StudentPortalModule({ onBack }) {
  const [tab, setTab] = useState('results');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="text-reads-muted">
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <p className="font-black text-reads-navy text-sm">Student Portal</p>
            <p className="text-reads-muted text-xs">Results · Fees · History</p>
          </div>
        </div>
        <div className="max-w-lg mx-auto flex border-t border-gray-100">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-bold transition-colors
                ${tab === key ? 'text-reads-green border-b-2 border-reads-green' : 'text-reads-muted'}`}>
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>
      <main className="max-w-lg mx-auto pt-28 pb-10">
        {tab === 'results' && <ResultsSection />}
        {tab === 'fees'    && <FeesSection />}
        {tab === 'history' && <PromotionSection />}
      </main>
    </div>
  );
}
