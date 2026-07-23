import { useState, useEffect } from 'react';
import {
  School, Users, BookOpen, ClipboardList, ChevronRight,
  Search, UserPlus, Loader2, ArrowLeft, GraduationCap,
  CheckCircle, XCircle, Upload, Download, Users2, Percent,
  Star, AlertCircle, Clock, Gift, ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay, EmptyState, Badge, Modal, Toast, SectionHeader, ProgressBar, TokenBadge } from '../../components/UI.jsx';

const AVATAR_FALLBACK = (name) =>
  `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || 'U')}&backgroundColor=16a34a&fontColor=ffffff`;

// ── Academic Snapshot tile ────────────────────────────────────────────────────
const SnapshotTile = ({ icon: Icon, value, label, bg, color }) => (
  <div className="reads-card p-3 text-center">
    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mx-auto mb-2`}>
      <Icon size={16} className={color} />
    </div>
    <p className="font-black text-reads-navy text-base leading-none">{value}</p>
    <p className="text-reads-muted-light text-[10px] mt-1">{label}</p>
  </div>
);

// ── Today's class row ──────────────────────────────────────────────────────────
const ClassRow = ({ cls }) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
    <div className="w-14 flex-shrink-0">
      <p className="text-reads-navy font-bold text-xs">{cls.time}</p>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-reads-navy font-semibold text-sm truncate">{cls.subject}</p>
      <p className="text-reads-muted text-xs">{cls.venue}</p>
    </div>
    {cls.join_url ? (
      <a href={cls.join_url} target="_blank" rel="noreferrer"
        className="reads-btn-primary px-3 py-1.5 text-xs flex-shrink-0">Join</a>
    ) : (
      <span className="text-reads-muted-light text-xs flex-shrink-0">—</span>
    )}
  </div>
);

// ── Subject / course card with progress ────────────────────────────────────────
const SubjectCard = ({ subject }) => (
  <div className="reads-card p-4">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-10 h-10 bg-reads-green-bg rounded-xl flex items-center justify-center flex-shrink-0">
        <BookOpen size={18} className="text-reads-green" />
      </div>
      <div className="min-w-0">
        <p className="text-reads-navy font-bold text-sm truncate">{subject.name}</p>
        {subject.code && <p className="text-reads-muted text-xs">{subject.code}</p>}
      </div>
    </div>
    <ProgressBar value={subject.progress_pct ?? 0} max={100} color="green" />
    <div className="flex items-center justify-between mt-2">
      {subject.next_topic && <p className="text-reads-muted-light text-[10px]">Next: {subject.next_topic}</p>}
      <span className="text-reads-navy text-xs font-bold">{subject.progress_pct ?? 0}%</span>
    </div>
  </div>
);

// ── Assignment row ──────────────────────────────────────────────────────────────
const AssignmentRow = ({ a, onSubmit }) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
    <div className="w-10 h-10 bg-reads-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
      <ClipboardList size={18} className="text-reads-gold-dark" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-reads-navy font-semibold text-sm truncate">{a.title}</p>
      <p className="text-reads-muted text-xs">
        {a.subject}{a.due_date ? ` · Due ${new Date(a.due_date).toLocaleDateString()}` : ''}
      </p>
    </div>
    {a.status === 'submitted' ? (
      <Badge label="Submitted" variant="green" />
    ) : (
      <button onClick={() => onSubmit(a)} className="reads-btn-outline px-3 py-1.5 text-xs flex-shrink-0">
        Submit
      </button>
    )}
  </div>
);

// ── Assignment submission modal ───────────────────────────────────────────────
function SubmitAssignmentModal({ assignment, onClose, onSubmitted, showToast }) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!response.trim()) return showToast('Write your response before submitting.', 'error');
    setLoading(true);
    try {
      await api.students.submitAssignment(assignment.id, { response });
      showToast('Assignment submitted!');
      onSubmitted();
      onClose();
    } catch (e) {
      // Endpoint isn't live yet — be honest rather than fake a submission.
      showToast("Assignment submission isn't supported by the backend yet.", 'error');
    } finally { setLoading(false); }
  };

  return (
    <Modal title={assignment.title} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-reads-muted text-sm">{assignment.subject}</p>
        <div>
          <label className="reads-label">Your Response</label>
          <textarea className="reads-input resize-none" rows={6}
            placeholder="Write your answer here…" value={response} onChange={(e) => setResponse(e.target.value)} />
        </div>
        <button onClick={submit} disabled={loading} className="reads-btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={16} className="animate-spin" />} Submit Assignment
        </button>
      </div>
    </Modal>
  );
}

// ── Rate School modal ─────────────────────────────────────────────────────────
function RateSchoolModal({ onClose, showToast }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!rating) return showToast('Select a star rating.', 'error');
    setLoading(true);
    try {
      await api.students.rateSchool(rating, comment);
      showToast('Thanks for your feedback!');
      onClose();
    } catch (e) {
      showToast("Ratings aren't supported by the backend yet.", 'error');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Rate Your School" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)}>
              <Star size={32} className={n <= rating ? 'text-reads-gold fill-reads-gold' : 'text-gray-200'} />
            </button>
          ))}
        </div>
        <textarea className="reads-input resize-none" rows={4} placeholder="Tell us about your experience (optional)"
          value={comment} onChange={(e) => setComment(e.target.value)} />
        <button onClick={submit} disabled={loading} className="reads-btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={16} className="animate-spin" />} Submit Rating
        </button>
      </div>
    </Modal>
  );
}

// ── School message row ────────────────────────────────────────────────────────
const MessageRow = ({ m }) => (
  <div className="py-3 border-b border-gray-50 last:border-0">
    <div className="flex items-center justify-between">
      <p className="text-reads-navy font-bold text-sm">{m.title}</p>
      <span className="text-reads-muted-light text-[10px] flex-shrink-0">
        {m.created_at ? new Date(m.created_at).toLocaleDateString() : ''}
      </span>
    </div>
    {m.sender_name && <p className="text-reads-muted-light text-[10px]">From {m.sender_name}</p>}
    <p className="text-reads-muted text-xs mt-1 leading-snug">{m.body}</p>
  </div>
);

// ── Join School Flow ───────────────────────────────────────────────────────────
function JoinSchoolFlow({ onJoined, onClose }) {
  const [schoolCode, setSchoolCode] = useState('');
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [step, setStep] = useState(1); // 1=code, 2=class, 3=pending
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
      setStep(3); // show pending confirmation
    } catch (e) {
      setError(e.message || 'Request failed.');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Join a School" onClose={onClose}>
      {step === 3 ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto">
            <span className="text-3xl">⏳</span>
          </div>
          <div>
            <p className="font-black text-reads-navy text-lg">Request Sent!</p>
            <p className="text-reads-muted text-sm mt-1">
              Your request to join <span className="font-bold text-reads-navy">{schoolInfo?.name}</span> has been sent.
              You'll be notified once the school approves your affiliation.
            </p>
          </div>
          <button onClick={onClose} className="reads-btn-primary w-full">Done</button>
        </div>
      ) : step === 1 ? (
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
      ) : step === 2 ? (
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
            <p className="text-reads-muted text-sm text-center py-2">No classes set up yet — you can still send a request.</p>
          )}
          {error && <p className="text-reads-red text-sm">{error}</p>}
          <button onClick={enroll} disabled={loading || (classes.length > 0 && !selectedClass)}
            className="reads-btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 size={18} className="animate-spin" />}
            Send Affiliation Request
          </button>
        </div>
      ) : null}
    </Modal>
  );
}

// ── Student View — My School ───────────────────────────────────────────────────
function MySchool({ user, tokenBalance, onBalanceUpdate }) {
  const [profile, setProfile] = useState(null); // { status, ...data }
  const [fees, setFees] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [continueLesson, setContinueLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [showRecover, setShowRecover] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [submittingFor, setSubmittingFor] = useState(null);
  const [recoverCode, setRecoverCode] = useState('');
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.school.getProfile();
      setProfile(data);
      if (data?.status === 'enrolled') {
        const [feesRes, snapRes, ttRes, subRes, asgRes, lessonRes, msgRes] = await Promise.allSettled([
          api.students.getMyFees(),
          api.students.getAcademicSnapshot(),
          api.students.getTimetable(),
          api.students.getMySubjects(),
          api.students.getAssignments(),
          api.lessons.list({ limit: 1 }),
          api.students.getSchoolMessages(),
        ]);
        if (feesRes.status === 'fulfilled') setFees(feesRes.value?.fees || []);
        if (snapRes.status === 'fulfilled') setSnapshot(snapRes.value || null);
        if (ttRes.status === 'fulfilled') setTimetable(ttRes.value?.classes || []);
        if (subRes.status === 'fulfilled') setSubjects(subRes.value?.subjects || []);
        if (asgRes.status === 'fulfilled') setAssignments(asgRes.value?.assignments || []);
        if (lessonRes.status === 'fulfilled') setContinueLesson((lessonRes.value?.lessons || [])[0] || null);
        if (msgRes.status === 'fulfilled') setMessages(msgRes.value?.messages || []);
      }
    } catch (_) { setProfile({ status: 'none' }); }
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

  const handleRecoveryRequest = async () => {
    if (!recoverCode.trim()) return showToast('Enter your school code', 'error');
    setRecoverLoading(true);
    try {
      await api.post('/students/recovery-request', { school_code: recoverCode.trim().toUpperCase() });
      showToast('Recovery request sent! Await school approval.');
      setShowRecover(false);
      load();
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
    finally { setRecoverLoading(false); }
  };

  if (loading) return <LoadingOverlay message="Loading school…" />;

  // ── Pending state ────────────────────────────────────────────────────────
  if (profile?.status === 'pending') {
    return (
      <div className="px-4 pt-10 pb-8 flex flex-col items-center text-center animate-fade-in">
        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-5">
          <span className="text-4xl">⏳</span>
        </div>
        <h2 className="font-display font-black text-reads-navy text-xl mb-2">
          {profile.is_recovery ? 'Recovery Request Pending' : 'Affiliation Request Pending'}
        </h2>
        <p className="text-reads-muted text-sm mb-6 max-w-xs">
          Your request to {profile.is_recovery ? 're-join' : 'join'} <span className="font-bold text-reads-navy">{profile.pending_school_name}</span> is awaiting approval from the school.
        </p>
        <div className="reads-card px-5 py-4 w-full max-w-xs text-left space-y-2 mb-6">
          <p className="text-reads-muted text-xs">You'll receive a notification once the school reviews your request. Check back here to see your status.</p>
        </div>
        <button onClick={async () => {
          try {
            await api.students.unenroll();
            showToast('Request cancelled.');
            load();
          } catch (err) { showToast(err.message || 'Failed', 'error'); }
        }} className="reads-btn-secondary text-sm">
          Cancel Request
        </button>
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ── Deaffiliated — recovery window ────────────────────────────────────────
  if (profile?.status === 'deaffiliated') {
    return (
      <div className="px-4 pt-10 pb-8 flex flex-col items-center text-center animate-fade-in">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-5">
          <span className="text-4xl">🏫</span>
        </div>
        <h2 className="font-display font-black text-reads-navy text-xl mb-2">You Left Your School</h2>
        <p className="text-reads-muted text-sm mb-1 max-w-xs">
          You have <span className="font-bold text-reads-red">{profile.days_left} day{profile.days_left !== 1 ? 's' : ''}</span> left to request re-affiliation and recover your school data.
        </p>
        <p className="text-reads-muted text-xs mb-6 max-w-xs">After the window expires you will need to apply to a school as a new student.</p>

        {!showRecover ? (
          <div className="space-y-3 w-full max-w-xs">
            <button onClick={() => setShowRecover(true)} className="reads-btn-primary w-full">
              Request Re-affiliation
            </button>
            <button onClick={() => setShowJoin(true)} className="reads-btn-secondary w-full text-sm">
              Join a Different School
            </button>
          </div>
        ) : (
          <div className="space-y-3 w-full max-w-xs text-left">
            <p className="text-reads-muted text-xs">Enter the school code for the school you want to re-join:</p>
            <input
              className="reads-input font-mono uppercase tracking-widest"
              placeholder="e.g. SCH-ABC123"
              value={recoverCode}
              onChange={e => setRecoverCode(e.target.value.toUpperCase())}
              maxLength={12}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowRecover(false)} className="flex-1 reads-btn-secondary text-sm">Back</button>
              <button onClick={handleRecoveryRequest} disabled={recoverLoading}
                className="flex-1 reads-btn-primary text-sm flex items-center justify-center gap-1">
                {recoverLoading && <Loader2 size={14} className="animate-spin" />}
                Send Request
              </button>
            </div>
          </div>
        )}

        {showJoin && (
          <JoinSchoolFlow
            onJoined={() => { setShowJoin(false); load(); }}
            onClose={() => setShowJoin(false)}
          />
        )}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ── Not enrolled ─────────────────────────────────────────────────────────
  if (!profile || profile.status === 'none') {
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
            onJoined={() => { setShowJoin(false); showToast('Request sent!'); load(); }}
            onClose={() => setShowJoin(false)}
          />
        )}
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ── Enrolled ─────────────────────────────────────────────────────────────
  const unpaidFees = fees.filter(f => f.status !== 'acknowledged');
  const paidFees = fees.filter(f => f.status === 'acknowledged');
  const school = profile; // alias
  const outstandingBalance = unpaidFees.reduce((s, f) => s + (f.amount || 0), 0);

  return (
    <div className="px-4 pt-4 pb-8 animate-fade-in space-y-5">
      {/* Profile header card */}
      <div className="reads-card p-4">
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar_url || AVATAR_FALLBACK(user?.full_name)}
            alt={user?.full_name}
            className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="font-black text-reads-navy text-base truncate">{user?.full_name || 'Student'}</p>
            <p className="text-reads-muted text-xs">
              {school.current_class || 'Level —'}{school.department ? ` · ${school.department}` : ''}
            </p>
            {school.matric_no && <p className="text-reads-muted-light text-xs font-mono">{school.matric_no}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge label={school.name} variant="navy" />
          <Badge label="Verified Student" variant="green" />
        </div>
      </div>

      {/* Academic Snapshot */}
      <div>
        <p className="font-black text-reads-navy text-sm mb-2">Academic Snapshot</p>
        <div className="grid grid-cols-4 gap-2">
          <SnapshotTile icon={BookOpen} value={snapshot?.courses_registered ?? '—'} label="Courses" bg="bg-reads-green-bg" color="text-reads-green" />
          <SnapshotTile icon={Percent} value={snapshot ? `${snapshot.attendance_pct ?? 0}%` : '—'} label="Attendance" bg="bg-reads-green-bg" color="text-reads-green" />
          <SnapshotTile icon={Star} value={snapshot?.gpa ?? '—'} label="GPA" bg="bg-reads-gold/10" color="text-reads-gold-dark" />
          <SnapshotTile icon={AlertCircle} value={snapshot?.assignments_due ?? '—'} label="Due Soon" bg="bg-reads-red-bg" color="text-reads-red" />
        </div>
      </div>

      {/* Today's Classes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="font-black text-reads-navy text-sm">Today's Classes</p>
        </div>
        {timetable.length === 0 ? (
          <div className="reads-card p-4">
            <p className="text-reads-muted text-xs text-center py-2">No classes scheduled for today yet.</p>
          </div>
        ) : (
          <div className="reads-card px-4">
            {timetable.map((cls) => <ClassRow key={cls.id} cls={cls} />)}
          </div>
        )}
      </div>

      {/* Continue Learning */}
      {continueLesson && (
        <div>
          <p className="font-black text-reads-navy text-sm mb-2">Continue Learning</p>
          <div className="reads-card p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-reads-green-bg rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen size={20} className="text-reads-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-reads-navy font-bold text-sm truncate">{continueLesson.title}</p>
              <p className="text-reads-muted text-xs">{continueLesson.subject}</p>
            </div>
            <TokenBadge amount={continueLesson.token_reward} />
          </div>
        </div>
      )}

      {/* My Subjects */}
      {subjects.length > 0 && (
        <div>
          <p className="font-black text-reads-navy text-sm mb-2">My Subjects</p>
          <div className="grid grid-cols-1 gap-3">
            {subjects.map((s) => <SubjectCard key={s.id} subject={s} />)}
          </div>
        </div>
      )}

      {/* Assignments */}
      <div>
        <p className="font-black text-reads-navy text-sm mb-2">Assignments</p>
        {assignments.length === 0 ? (
          <div className="reads-card p-4">
            <p className="text-reads-muted text-xs text-center py-2">No assignments due right now.</p>
          </div>
        ) : (
          <div className="reads-card px-4">
            {assignments.map((a) => <AssignmentRow key={a.id} a={a} onSubmit={setSubmittingFor} />)}
          </div>
        )}
      </div>

      {/* Messages from my school */}
      {messages.length > 0 && (
        <div>
          <p className="font-black text-reads-navy text-sm mb-2">Messages</p>
          <div className="reads-card px-4">
            {messages.slice(0, 5).map((m) => <MessageRow key={m.id} m={m} />)}
          </div>
        </div>
      )}

      {/* Fees & Payments */}
      <div>
        <p className="font-black text-reads-navy text-sm mb-2">Fees & Payments</p>
        {fees.length === 0 ? (
          <div className="reads-card p-4">
            <p className="text-reads-muted text-xs text-center py-2">No fees on record.</p>
          </div>
        ) : (
          <>
            <div className="reads-card p-4 mb-2 flex items-center justify-between">
              <div>
                <p className="text-reads-muted text-xs">Outstanding Balance</p>
                <p className="font-black text-reads-red text-lg">{outstandingBalance.toLocaleString()} $READS</p>
              </div>
              <div className="text-right">
                <p className="text-reads-muted text-xs">Wallet Balance</p>
                <p className="font-bold text-reads-navy text-sm">{(tokenBalance || 0).toLocaleString()} $READS</p>
              </div>
            </div>
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
          </>
        )}
      </div>

      {/* Invite & Earn */}
      {user?.referral_code && (
        <div className="relative bg-reads-navy rounded-2xl p-4 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-reads-green/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative z-10">
            <p className="font-black text-white text-sm mb-1">Invite & Earn</p>
            <p className="text-white/70 text-xs mb-3">Invite your classmates and earn 500 $READS each.</p>
            <button
              onClick={() => { navigator.clipboard.writeText(user.referral_code); showToast('Referral code copied!'); }}
              className="bg-reads-green text-white text-sm font-bold rounded-xl px-4 py-2 active:scale-95 transition-transform">
              Copy Code — {user.referral_code}
            </button>
          </div>
        </div>
      )}

      {/* Rate & Leave school */}
      <div className="reads-card px-4 py-3 flex items-center justify-between">
        <button onClick={() => setShowRate(true)} className="text-reads-navy text-sm font-semibold flex items-center gap-1.5 py-1">
          <Star size={14} className="text-reads-gold" /> Rate Your School
        </button>
        <button
          onClick={async () => {
            if (!confirm('Leave this school? You will lose access to school lessons and results.')) return;
            try {
              await api.students.unenroll();
              showToast('Left school successfully.');
              load();
            } catch (err) { showToast(err.message || 'Failed to leave school', 'error'); }
          }}
          className="text-reads-red text-sm font-semibold py-1">
          Leave School
        </button>
      </div>

      {submittingFor && (
        <SubmitAssignmentModal
          assignment={submittingFor}
          onClose={() => setSubmittingFor(null)}
          onSubmitted={load}
          showToast={showToast}
        />
      )}
      {showRate && <RateSchoolModal onClose={() => setShowRate(false)} showToast={showToast} />}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function SchoolModule({ user, tokenBalance, onBalanceUpdate }) {
  return (
    <div className="animate-fade-in">
      <div className="px-4 pt-4">
        <h1 className="font-display font-black text-reads-navy text-2xl mb-1">My School</h1>
        <p className="text-reads-muted text-sm mb-4">Your campus. Your community.</p>
      </div>
      <MySchool user={user} tokenBalance={tokenBalance} onBalanceUpdate={onBalanceUpdate} />
    </div>
  );
}
