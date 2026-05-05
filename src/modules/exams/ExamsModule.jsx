import { useState, useEffect } from 'react';
import {
  ClipboardList, Calendar, MapPin, Clock, CheckCircle,
  AlertCircle, ChevronRight, Loader2, Upload, ArrowLeft, Coins,
  FileText, Download, Eye, XCircle, Info
} from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay, EmptyState, Badge, Modal, Toast, TokenBadge } from '../../components/UI.jsx';

const STATUS_META = {
  upcoming:   { label: 'Upcoming',   variant: 'navy' },
  registered: { label: 'Registered', variant: 'gold' },
  completed:  { label: 'Completed',  variant: 'green' },
  cancelled:  { label: 'Cancelled',  variant: 'red' },
};

const EXAM_TYPES = ['JAMB', 'WAEC', 'NECO', 'BECE', 'IELTS', 'SAT'];

// ── Register Modal ────────────────────────────────────────────────────────────
function RegisterModal({ window: win, onClose, onRegistered }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    setLoading(true); setError('');
    try {
      await api.exams.register(win.id);
      onRegistered();
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Register for Exam" onClose={onClose}>
      <div className="space-y-4">
        <div className="reads-card p-4 bg-gray-50 border-0">
          <p className="font-black text-reads-navy text-base">{win.exam_type} Exam</p>
          <div className="flex items-center gap-2 mt-2 text-reads-muted text-sm">
            <Calendar size={14} /> <span>{new Date(win.exam_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-reads-muted text-sm">
            <MapPin size={14} /> <span>{win.centre_name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-reads-muted text-sm">
            <Clock size={14} /> <span>{win.duration_minutes} minutes</span>
          </div>
        </div>
        <div className="bg-reads-gold/10 border border-reads-gold/20 rounded-xl p-3">
          <p className="text-reads-navy font-semibold text-sm">Registration Fee</p>
          <TokenBadge amount={win.fee_tokens} size="lg" />
          <p className="text-reads-muted text-xs mt-1">Paid in $READS tokens · held in escrow until exam</p>
        </div>
        {error && <p className="text-reads-red text-sm">{error}</p>}
        <button onClick={handle} disabled={loading}
          className="reads-btn-gold w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={18} className="animate-spin" />}
          Confirm Registration
        </button>
      </div>
    </Modal>
  );
}

// ── Exam Window Card ──────────────────────────────────────────────────────────
function ExamWindowCard({ win, onRegister }) {
  const isRegistered = win.user_registered;
  return (
    <div className="reads-card p-4 mb-3">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-black text-reads-navy text-base">{win.exam_type}</p>
          <p className="text-reads-muted text-xs">{win.subject || 'All subjects'}</p>
        </div>
        <Badge
          label={isRegistered ? 'Registered' : 'Available'}
          variant={isRegistered ? 'gold' : 'green'}
        />
      </div>
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-sm text-reads-muted">
          <Calendar size={14} className="text-reads-green flex-shrink-0" />
          <span>{new Date(win.exam_date).toLocaleDateString('en-NG', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-reads-muted">
          <MapPin size={14} className="text-reads-green flex-shrink-0" />
          <span>{win.centre_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-reads-muted">
          <Clock size={14} className="text-reads-green flex-shrink-0" />
          <span>{win.duration_minutes} minutes · {win.available_slots} slots left</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <TokenBadge amount={win.fee_tokens} />
        {!isRegistered && win.available_slots > 0 ? (
          <button onClick={() => onRegister(win)}
            className="reads-btn-primary text-sm px-4 py-2">
            Register
          </button>
        ) : isRegistered ? (
          <span className="flex items-center gap-1 text-reads-green text-sm font-semibold">
            <CheckCircle size={16} /> Registered
          </span>
        ) : (
          <span className="text-reads-muted text-sm">Full</span>
        )}
      </div>
    </div>
  );
}

// ── My Registrations ──────────────────────────────────────────────────────────
function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slipReg, setSlipReg] = useState(null);
  const [slip, setSlip] = useState(null);
  const [slipLoading, setSlipLoading] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const load = () => {
    api.exams.getRegistrations()
      .then((d) => setRegistrations(d?.registrations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const viewSlip = async (reg) => {
    setSlipReg(reg); setSlipLoading(true);
    try {
      const d = await api.exams.getSlip(reg.id);
      setSlip(d);
    } catch { showToast('Failed to load slip', 'error'); }
    finally { setSlipLoading(false); }
  };

  const uploadProof = async (reg, file) => {
    setUploading(reg.id);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.upload(`/exams/${reg.id}/upload-proof`, formData);
      showToast('Proof uploaded! Admin will verify shortly.');
      load();
    } catch (e) { showToast(e.message || 'Upload failed', 'error'); }
    finally { setUploading(null); }
  };

  if (loading) return <LoadingOverlay />;

  if (slipReg) return (
    <div className="space-y-4 animate-fade-in">
      <button onClick={() => { setSlipReg(null); setSlip(null); }}
        className="flex items-center gap-1 text-reads-muted text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      {slipLoading ? <LoadingOverlay /> : slip ? (
        <div className="reads-card p-5 space-y-4">
          <div className="text-center border-b border-gray-100 pb-4">
            <p className="font-black text-reads-navy text-xl">{slip.exam_type} EXAM</p>
            <p className="text-reads-muted text-sm">Admission Slip</p>
          </div>
          <div className="space-y-3">
            {[
              ['Student', slip.student_name],
              ['Email', slip.student_email],
              ['Subject', slip.subject || 'All Subjects'],
              ['Date', new Date(slip.exam_date).toLocaleDateString('en-NG', {weekday:'long',year:'numeric',month:'long',day:'numeric'})],
              ['Time', new Date(slip.exam_date).toLocaleTimeString('en-NG', {hour:'2-digit',minute:'2-digit'})],
              ['Duration', `${slip.duration_minutes} minutes`],
              ['Centre', slip.centre_name],
              ['Address', slip.centre_address],
              ['Seat No.', slip.seat_number],
            ].map(([label, val]) => val ? (
              <div key={label} className="flex justify-between gap-4">
                <span className="text-reads-muted text-sm">{label}</span>
                <span className="font-semibold text-reads-navy text-sm text-right flex-1">{val}</span>
              </div>
            ) : null)}
          </div>
          <div className={`rounded-xl px-4 py-2 text-center font-bold text-sm ${
            slip.status === 'verified' ? 'bg-reads-green-bg text-reads-green' :
            slip.status === 'proof_uploaded' ? 'bg-amber-50 text-amber-600' :
            'bg-blue-50 text-blue-600'
          }`}>
            Status: {slip.status?.replace(/_/g, ' ').toUpperCase()}
          </div>
          {slip.status === 'registered' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-amber-700 text-xs font-semibold">⚠ Bring this slip on exam day. Upload payment proof if required by your centre.</p>
            </div>
          )}
        </div>
      ) : null}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );

  if (!registrations.length) return (
    <EmptyState icon={ClipboardList} title="No registrations" description="Register for an exam to see it here." />
  );

  return (
    <div className="space-y-3">
      {registrations.map((reg) => {
        const meta = STATUS_META[reg.status] || STATUS_META.upcoming;
        const needsProof = reg.status === 'registered';
        const fileRef = { current: null };
        return (
          <div key={reg.id} className="reads-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-black text-reads-navy">{reg.exam_type}</p>
                <p className="text-reads-muted text-xs">{reg.centre_name}</p>
              </div>
              <Badge label={meta.label} variant={meta.variant} />
            </div>
            <div className="flex items-center gap-2 text-reads-muted text-sm mb-2">
              <Calendar size={14} />
              <span>{new Date(reg.exam_date).toLocaleDateString()}</span>
            </div>
            {reg.seat_number && (
              <div className="mb-3 bg-reads-green-bg rounded-xl px-3 py-2 inline-flex items-center gap-2">
                <span className="text-reads-green text-xs font-bold">Seat: {reg.seat_number}</span>
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <button onClick={() => viewSlip(reg)}
                className="flex items-center gap-1.5 text-xs font-bold text-reads-navy bg-gray-100 px-3 py-2 rounded-xl">
                <FileText size={13} /> View Slip
              </button>
              {needsProof && (
                <>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-white bg-reads-green px-3 py-2 rounded-xl cursor-pointer">
                    {uploading === reg.id ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    Upload Proof
                    <input type="file" accept="image/*,.pdf" className="hidden"
                      onChange={e => e.target.files?.[0] && uploadProof(reg, e.target.files[0])} />
                  </label>
                </>
              )}
            </div>
          </div>
        );
      })}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── Main Exams Module ─────────────────────────────────────────────────────────
export default function ExamsModule({ tokenBalance, onUpdateBalance }) {
  const [tab, setTab] = useState('browse'); // browse | mine
  const [examType, setExamType] = useState('');
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registerTarget, setRegisterTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = examType ? { exam_type: examType } : {};
        const data = await api.exams.getWindows(params);
        setWindows(data?.windows || []);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, [examType]);

  const handleRegistered = async () => {
    setRegisterTarget(null);
    showToast('Exam registration successful! Check "My Exams" for your slot details.');
    const newBal = await api.wallet.getBalance();
    onUpdateBalance?.(newBal);
    // Refresh windows
    const data = await api.exams.getWindows(examType ? { exam_type: examType } : {});
    setWindows(data?.windows || []);
  };

  return (
    <div className="px-4 pt-4 pb-6 animate-fade-in">
      <h1 className="font-display font-black text-reads-navy text-2xl mb-1">Exams</h1>
      <p className="text-reads-muted text-sm mb-4">Register for JAMB, WAEC, NECO & more</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[{ key: 'browse', label: 'Browse' }, { key: 'mine', label: 'My Registrations' }].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
              tab === key ? 'bg-reads-green text-white shadow-reads-green' : 'bg-gray-100 text-reads-muted'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <>
          {/* Filter by exam type */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-4" style={{ scrollbarWidth: 'none' }}>
            <button onClick={() => setExamType('')}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                !examType ? 'bg-reads-navy text-white' : 'bg-gray-100 text-reads-muted'
              }`}>
              All
            </button>
            {EXAM_TYPES.map((t) => (
              <button key={t} onClick={() => setExamType(t === examType ? '' : t)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  examType === t ? 'bg-reads-navy text-white' : 'bg-gray-100 text-reads-muted'
                }`}>
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <LoadingOverlay message="Loading exam windows…" />
          ) : windows.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No exams available" description="Check back later for upcoming exam windows." />
          ) : (
            windows.map((win) => (
              <ExamWindowCard key={win.id} win={win} onRegister={setRegisterTarget} />
            ))
          )}
        </>
      )}

      {tab === 'mine' && <MyRegistrations />}

      {registerTarget && (
        <RegisterModal
          window={registerTarget}
          onClose={() => setRegisterTarget(null)}
          onRegistered={handleRegistered}
        />
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
