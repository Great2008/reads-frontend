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
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [step, setStep] = useState(1); // 1=code, 2=class
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchClasses = async () => {
    if (!schoolCode.trim()) return setError('Enter a school code.');
    setLoading(true); setError('');
    try {
      const data = await api.school.getClasses();
      setClasses(data?.classes || []);
      setStep(2);
    } catch (e) {
      setError(e.message || 'School not found.');
    } finally { setLoading(false); }
  };

  const enroll = async () => {
    if (!selectedClass) return setError('Select a class.');
    setLoading(true); setError('');
    try {
      await api.students.enroll(schoolCode.trim().toUpperCase(), selectedClass);
      onJoined();
    } catch (e) {
      setError(e.message);
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
          {error && <p className="text-reads-red text-sm">{error}</p>}
          <button onClick={enroll} disabled={loading || !selectedClass}
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
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.school.getProfile();
        setSchool(data);
      } catch (_) { setSchool(null); }
      setLoading(false);
    };
    load();
  }, []);

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
            onJoined={() => { setShowJoin(false); showToast('Enrolled successfully!'); window.location.reload(); }}
            onClose={() => setShowJoin(false)}
          />
        )}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-6 animate-fade-in">
      {/* School card */}
      <div className="reads-card p-5 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-reads-navy rounded-2xl flex items-center justify-center flex-shrink-0">
            <School size={28} className="text-reads-gold" />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-black text-reads-navy text-lg leading-tight">{school.name}</h2>
            <p className="text-reads-muted text-sm">{school.address}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge label={school.school_code} variant="gray" />
              <Badge label={school.status === 'active' ? 'Active' : 'Suspended'} variant={school.status === 'active' ? 'green' : 'red'} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: 'Your Class', value: school.current_class || '—', icon: GraduationCap },
          { label: 'Track', value: school.track_type || '—', icon: BookOpen },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="reads-card p-4">
            <Icon size={18} className="text-reads-green mb-2" />
            <p className="font-black text-reads-navy text-sm">{value}</p>
            <p className="text-reads-muted text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Leave school */}
      <div className="reads-card px-4 py-3">
        <button
          onClick={async () => {
            if (!confirm('Leave this school?')) return;
            await api.students.unenroll();
            showToast('Left school successfully.');
            setSchool(null);
          }}
          className="text-reads-red text-sm font-semibold py-1"
        >
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
