import { useState, useEffect } from 'react';
import {
  School, Users, BookOpen, ClipboardList, ChevronRight,
  Search, UserPlus, Loader2, ArrowLeft, GraduationCap,
  CheckCircle, XCircle, Upload, Download
} from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay, EmptyState, Badge, Modal, Toast, SectionHeader } from '../../components/UI.jsx';

// ── Join School Flow ───────────────────────────────────────────────────────────
function JoinSchoolFlow({ onJoined, onClose }) {
  const [schoolCode, setSchoolCode] = useState('');
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [step, setStep] = useState(1); // 1=code, 2=class
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchClasses = async () => {
    if (!schoolCode.trim()) return setError('Enter a school code.');
    setLoading(true); setError('');
    try {
      const data = await api.students.lookupSchool(schoolCode.trim().toUpperCase());
      setSchoolInfo(data);
      setClasses(data?.classes || []);
      setStep(2);
    } catch (e) {
      setError('School not found. Check the code and try again.');
    } finally { setLoading(false); }
  };

  const enroll = async () => {
    setLoading(true); setError('');
    try {
      await api.students.enroll(schoolCode.trim().toUpperCase(), selectedClass || null);
      onJoined();
    } catch (e) {
      setError(e.message || 'Enrollment failed.');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Join a School" onClose={onClose}>
      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <label className="reads-label">School Code</label>
            <input
              className="reads-input font-mono uppercase tracking-widest"
              placeholder="e.g. SCH-ABC123"
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
              maxLength={12}
            />
          </div>
          {error && <p className="text-reads-red text-sm">{error}</p>}
          <button onClick={fetchClasses} disabled={loading}
            className="reads-btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 size={18} className="animate-spin" />}
            Find School
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {schoolInfo && (
            <div className="reads-card p-3 border-l-4 border-reads-green bg-reads-green-bg">
              <p className="font-black text-reads-navy text-sm">{schoolInfo.name}</p>
              {schoolInfo.address && <p className="text-reads-muted text-xs">{schoolInfo.address}</p>}
            </div>
          )}
          {classes.length > 0 ? (
            <>
              <p className="text-reads-muted text-sm">Select your class:</p>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {classes.map((cls) => (
                  <button key={cls.id} onClick={() => setSelectedClass(cls.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      selectedClass === cls.id ? 'border-reads-green bg-reads-green-bg' : 'border-gray-100 bg-white'
                    }`}>
                    <p className="font-semibold text-reads-navy text-sm">{cls.name}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-reads-muted text-sm text-center py-2">No classes set up yet — you can still enroll.</p>
          )}
          {error && <p className="text-reads-red text-sm">{error}</p>}
          <button onClick={enroll} disabled={loading || (classes.length > 0 && !selectedClass)}
            className="reads-btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 size={18} className="animate-spin" />}
            Enroll in School
          </button>
        </div>
      )}
    </Modal>
  );
}

// ── Student View — My School ───────────────────────────────────────────────────
function MySchool({ tokenBalance, onBalanceUpdate }) {
  const [school, setSchool] = useState(null);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [toast, setToast] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.school.getProfile();
      setSchool(data);
      // Load fees if enrolled
      const feesData = await api.students.getMyFees().catch(() => ({ fees: [] }));
      setFees(feesData?.fees || []);
    } catch (_) { setSchool(null); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handlePay = async (feeId) => {
    setPayingId(feeId);
    try {
      await api.students.payFee(feeId);
      showToast('Fee paid successfully!');
      const feesData = await api.students.getMyFees();
      setFees(feesData?.fees || []);
      if (onBalanceUpdate) {
        const bal = await api.wallet.getBalance();
        onBalanceUpdate(bal);
      }
    } catch (err) { showToast(err.message || 'Payment failed', 'error'); }
    finally { setPayingId(null); }
  };

  if (loading) return <LoadingOverlay message="Loading school…" />;

  if (!school) {
    return (
      <div className="px-4 pt-6 animate-fade-in">
        <EmptyState
          icon={School}
          title="Not Enrolled in a School"
          description="Join a school with your school code to access school-specific lessons, results, and more."
          action={
            <button onClick={() => setShowJoin(true)} className="reads-btn-primary px-6">
              Join a School
            </button>
          }
        />
        {showJoin && (
          <JoinSchoolFlow
            onJoined={() => { setShowJoin(false); showToast('Enrolled successfully!'); load(); }}
            onClose={() => setShowJoin(false)}
          />
        )}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  const unpaidFees = fees.filter(f => f.status !== 'acknowledged');
  const paidFees = fees.filter(f => f.status === 'acknowledged');

  return (
    <div className="px-4 pt-4 pb-8 animate-fade-in space-y-4">
      {/* School card */}
      <div className="reads-card p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-reads-navy rounded-2xl flex items-center justify-center flex-shrink-0">
            <School size={28} className="text-reads-gold" />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-black text-reads-navy text-lg leading-tight">{school.name}</h2>
            {school.address && <p className="text-reads-muted text-sm">{school.address}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge label={school.school_code} variant="gray" />
              <Badge label={school.status === 'active' ? 'Active' : 'Suspended'}
                variant={school.status === 'active' ? 'green' : 'red'} />
            </div>
          </div>
        </div>
      </div>

      {/* Class & Session info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="reads-card p-4">
          <GraduationCap size={18} className="text-reads-green mb-2" />
          <p className="font-black text-reads-navy text-sm">{school.current_class || '—'}</p>
          <p className="text-reads-muted text-xs">Your Class</p>
        </div>
        <div className="reads-card p-4">
          <BookOpen size={18} className="text-reads-green mb-2" />
          <p className="font-black text-reads-navy text-sm">{school.current_session || '—'}</p>
          <p className="text-reads-muted text-xs">Current Session</p>
        </div>
      </div>

      {/* Fees */}
      {fees.length > 0 && (
        <div>
          <p className="font-black text-reads-navy text-xs uppercase tracking-wide mb-2">School Fees</p>
          <div className="space-y-2">
            {unpaidFees.map(f => (
              <div key={f.id} className="reads-card px-4 py-3 border-l-4 border-amber-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-reads-navy text-sm">Term {f.term} — {f.class_name}</p>
                    <p className="text-reads-muted text-xs">{f.amount} $READS{f.due_date ? ` · Due ${new Date(f.due_date).toLocaleDateString()}` : ''}</p>
                  </div>
                  <button
                    onClick={() => handlePay(f.id)}
                    disabled={payingId === f.id}
                    className="reads-btn-primary px-3 py-1.5 text-xs flex items-center gap-1">
                    {payingId === f.id ? <Loader2 size={12} className="animate-spin" /> : null}
                    Pay
                  </button>
                </div>
              </div>
            ))}
            {paidFees.map(f => (
              <div key={f.id} className="reads-card px-4 py-3 border-l-4 border-reads-green opacity-70">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-reads-navy text-sm">Term {f.term} — {f.class_name}</p>
                    <p className="text-reads-muted text-xs">{f.amount} $READS</p>
                  </div>
                  <div className="flex items-center gap-1 text-reads-green text-xs font-bold">
                    <CheckCircle size={14} /> Paid
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave school */}
      <div className="reads-card px-4 py-3">
        <button
          onClick={async () => {
            if (!confirm('Leave this school? You will lose access to school lessons and results.')) return;
            try {
              await api.students.unenroll();
              showToast('Left school successfully.');
              setSchool(null);
              setFees([]);
            } catch (err) { showToast(err.message || 'Failed to leave school', 'error'); }
          }}
          className="text-reads-red text-sm font-semibold py-1">
          Leave School
        </button>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function SchoolModule({ tokenBalance, onBalanceUpdate }) {
  return (
    <div className="animate-fade-in">
      <div className="px-4 pt-4">
        <h1 className="font-display font-black text-reads-navy text-2xl mb-1">My School</h1>
        <p className="text-reads-muted text-sm mb-4">Your school enrollment and details</p>
      </div>
      <MySchool tokenBalance={tokenBalance} onBalanceUpdate={onBalanceUpdate} />
    </div>
  );
}
