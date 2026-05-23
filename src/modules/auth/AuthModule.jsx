import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, ShieldCheck, Loader2, Building2, GraduationCap } from 'lucide-react';
import { api } from '../../services/api.js';

// ── Password strength ──────────────────────────────────────────────────────────
const getStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', 'bg-reads-red', 'bg-amber-400', 'bg-reads-gold', 'bg-reads-green'];

const PasswordStrength = ({ password }) => {
  const s = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= s ? STRENGTH_COLORS[s] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-xs ${s <= 1 ? 'text-reads-red' : s === 2 ? 'text-amber-500' : s === 3 ? 'text-reads-gold-dark' : 'text-reads-green'}`}>
        {STRENGTH_LABELS[s]}
      </p>
    </div>
  );
};

// ── Input Field ────────────────────────────────────────────────────────────────
const Field = ({ icon: Icon, type = 'text', placeholder, value, onChange, error, rightEl, label }) => (
  <div>
    {label && <label className="reads-label">{label}</label>}
    <div className="relative">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-reads-muted-light pointer-events-none">
          <Icon size={18} />
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`reads-input ${Icon ? 'pl-11' : ''} ${rightEl ? 'pr-11' : ''} ${error ? 'border-reads-red' : ''}`}
      />
      {rightEl && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
      )}
    </div>
    {error && <p className="text-reads-red text-xs mt-1">{error}</p>}
  </div>
);

// ── Header ─────────────────────────────────────────────────────────────────────
const AuthHeader = ({ onBack, title, subtitle }) => (
  <div className="mb-7">
    {onBack && (
      <button onClick={onBack} className="flex items-center gap-1.5 text-reads-muted text-sm mb-5 hover:text-reads-navy transition-colors">
        <ArrowLeft size={16} /> Back
      </button>
    )}
    <h1 className="font-display font-black text-reads-navy text-3xl leading-tight">{title}</h1>
    {subtitle && <p className="text-reads-muted mt-1.5 text-sm leading-relaxed">{subtitle}</p>}
  </div>
);

// ── LOGIN ──────────────────────────────────────────────────────────────────────
const LoginView = ({ onLoginSuccess, onGoRegister, onGoForgot, onPartnerPending, onNeedsVerification }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) return setError('Please fill in all fields.');
    setLoading(true); setError('');
    try {
      await api.auth.login(email.trim().toLowerCase(), password);
      await onLoginSuccess();
    } catch (e) {
      const msg = e.message || '';
      if (msg === 'PARTNER_PENDING') {
        onPartnerPending && onPartnerPending(email.trim().toLowerCase());
        return;
      }
      if (msg.startsWith('EMAIL_NOT_VERIFIED:')) {
        const userId = msg.replace('EMAIL_NOT_VERIFIED:', '').trim();
        onNeedsVerification && onNeedsVerification(userId, email.trim().toLowerCase());
        return;
      }
      if (msg.startsWith('PARTNER_REJECTED:')) {
        const reason = msg.replace('PARTNER_REJECTED:', '').trim();
        setError(reason ? `Application rejected: ${reason}` : 'Your application was not approved. Contact support.');
      } else if (msg === 'SESSION_EXPIRED') {
        setError('Session expired. Please log in again.');
      } else {
        setError(msg || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <AuthHeader
        title="Welcome back"
        subtitle="Log in to continue learning and earning $READS tokens."
      />
      <div className="space-y-4">
        <Field icon={Mail} type="email" placeholder="Email address"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field icon={Lock} type={showPw ? 'text' : 'password'}
          placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          rightEl={
            <button type="button" onClick={() => setShowPw(!showPw)} className="text-reads-muted">
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />
        <div className="text-right">
          <button onClick={onGoForgot} className="text-reads-teal text-sm font-semibold hover:text-reads-teal-light transition-colors">
            Forgot password?
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-reads-red-bg border border-reads-red/20 rounded-xl p-3">
          <p className="text-reads-red text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="reads-btn-primary w-full mt-6 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {loading ? 'Logging in…' : 'Log In'}
      </button>

      <p className="text-center text-reads-muted text-sm mt-5">
        Don't have an account?{' '}
        <button onClick={onGoRegister} className="text-reads-teal font-bold hover:text-reads-teal-light transition-colors">
          Sign up free
        </button>
      </p>
    </div>
  );
};

// ── REGISTER ───────────────────────────────────────────────────────────────────
const RegisterView = ({ onSuccess, onBack }) => {
  const [step, setStep] = useState(1); // 1=account type, 2=details
  const [accountType, setAccountType] = useState(''); // student | partner
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', confirmPw: '',
    birth_year: '', state: '',
    primary_track: 'school', school_code: '', partner_type: '',
    business_name: '', contact_email: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validateStep2 = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email.';
    if (!form.phone.trim()) errs.phone = 'Phone is required.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 8) errs.password = 'Minimum 8 characters.';
    if (form.password !== form.confirmPw) errs.confirmPw = 'Passwords do not match.';
    if (accountType === 'partner') {
      if (!form.partner_type) errs.partner_type = 'Select partner type.';
      if (!form.business_name.trim()) errs.business_name = 'Business name is required.';
    }
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validateStep2();
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true); setErrors({});
    try {
      if (accountType === 'student') {
        const result = await api.auth.register({
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          primary_track: form.primary_track,
          school_code: form.school_code.trim() || undefined,
          birth_year: form.birth_year ? parseInt(form.birth_year) : undefined,
          state: form.state.trim() || undefined,
        });
        onSuccess({ userId: result.user_id, email: form.email });
      } else {
        await api.auth.partnerSignup({
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          partner_type: form.partner_type,
          business_name: form.business_name.trim(),
          contact_email: form.contact_email.trim() || form.email.trim(),
        });
        onSuccess({ userId: null, email: form.email, isPartner: true });
      }
    } catch (e) {
      setErrors({ submit: e.message });
    } finally {
      setLoading(false);
    }
  };

  const TRACKS = [
    { value: 'school', label: 'School Student' },
    { value: 'jamb', label: 'JAMB' },
    { value: 'waec', label: 'WAEC / SSCE' },
    { value: 'neco', label: 'NECO' },
    { value: 'bece', label: 'BECE / JSS' },
    { value: 'ielts', label: 'IELTS' },
    { value: 'sat', label: 'SAT' },
  ];

  if (step === 1) {
    return (
      <div className="animate-fade-in">
        <AuthHeader onBack={onBack} title="Create account" subtitle="What best describes you?" />
        <div className="space-y-3">
          {[
            { type: 'student', Icon: GraduationCap, label: 'Student', desc: 'Learn, take quizzes & earn tokens' },
            { type: 'partner', Icon: Building2, label: 'Partner (School / CBT Centre)', desc: 'Manage students, fees & results' },
          ].map(({ type, Icon, label, desc }) => (
            <button
              key={type}
              onClick={() => { setAccountType(type); setStep(2); }}
              className="w-full flex items-center gap-4 p-4 reads-card border-2 border-transparent hover:border-reads-gold active:scale-95 transition-all text-left"
            >
              <div className="w-12 h-12 bg-reads-green-bg rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon size={24} className="text-reads-green" />
              </div>
              <div>
                <p className="font-bold text-reads-navy text-sm">{label}</p>
                <p className="text-reads-muted text-xs">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <AuthHeader onBack={() => setStep(1)} title={accountType === 'student' ? 'Student Sign Up' : 'Partner Sign Up'} />
      <div className="space-y-4">
        <Field icon={User} placeholder="Full name" value={form.full_name} onChange={set('full_name')} error={errors.full_name} />
        <Field icon={Mail} type="email" placeholder="Email address" value={form.email} onChange={set('email')} error={errors.email} />
        <Field icon={Phone} type="tel" placeholder="Phone number" value={form.phone} onChange={set('phone')} error={errors.phone} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="reads-label">Birth Year</label>
            <input className="reads-input" type="number" placeholder="e.g. 2005"
              min="1950" max={new Date().getFullYear()}
              value={form.birth_year} onChange={set('birth_year')} />
          </div>
          <div>
            <label className="reads-label">State</label>
            <input className="reads-input" placeholder="e.g. Rivers State"
              value={form.state} onChange={set('state')} />
          </div>
        </div>

        {accountType === 'student' && (
          <div>
            <label className="reads-label">Primary Track</label>
            <select className="reads-input" value={form.primary_track} onChange={set('primary_track')}>
              {TRACKS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        )}
        {accountType === 'student' && (
          <Field placeholder="School Code (optional)" value={form.school_code} onChange={set('school_code')} />
        )}

        {accountType === 'partner' && (
          <>
            <div>
              <label className="reads-label">Partner Type</label>
              <select className="reads-input" value={form.partner_type} onChange={set('partner_type')}>
                <option value="">Select type…</option>
                <option value="school">School</option>
                <option value="cbt_centre">CBT Centre</option>
                <option value="tutor">Tutor</option>
              </select>
              {errors.partner_type && <p className="text-reads-red text-xs mt-1">{errors.partner_type}</p>}
            </div>
            <Field placeholder="Business / School name" value={form.business_name} onChange={set('business_name')} error={errors.business_name} />
          </>
        )}

        <div>
          <Field icon={Lock} type={showPw ? 'text' : 'password'} placeholder="Password"
            value={form.password} onChange={set('password')} error={errors.password}
            rightEl={
              <button type="button" onClick={() => setShowPw(!showPw)} className="text-reads-muted">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <PasswordStrength password={form.password} />
        </div>
        <Field icon={Lock} type="password" placeholder="Confirm password" value={form.confirmPw} onChange={set('confirmPw')} error={errors.confirmPw} />

        {errors.submit && (
          <div className="bg-reads-red-bg border border-reads-red/20 rounded-xl p-3">
            <p className="text-reads-red text-sm">{errors.submit}</p>
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          className="reads-btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </div>
    </div>
  );
};

// ── OTP VERIFY ─────────────────────────────────────────────────────────────────
const OtpView = ({ userId, email, onVerified, onBack, fromLogin }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) return setError('Enter the 6-digit code.');
    setLoading(true); setError('');
    try {
      await api.auth.verifyOtp({ user_id: userId, otp });
      onVerified();
    } catch (e) {
      setError(e.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.auth.resendOtp({ user_id: userId });
      setResent(true); setTimeout(() => setResent(false), 4000);
    } catch (_) {}
    setResending(false);
  };

  const subtitle = fromLogin
    ? `Your account isn't verified yet. We sent a new 6-digit code to ${email} — enter it below to complete verification.`
    : `We sent a 6-digit code to ${email}. Enter it below to activate your account.`;

  return (
    <div className="animate-fade-in">
      <AuthHeader onBack={onBack} title="Verify Email" subtitle={subtitle} />
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-reads-green-bg rounded-2xl flex items-center justify-center">
          <ShieldCheck size={32} className="text-reads-green" />
        </div>
      </div>
      <div className="space-y-4">
        <input
          type="text" inputMode="numeric" maxLength={6}
          placeholder="000000"
          value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className="reads-input text-center text-3xl font-black tracking-[0.4em] letter-spacing"
        />
        {error && <p className="text-reads-red text-sm text-center">{error}</p>}
        {resent && <p className="text-reads-green text-sm text-center">Code resent!</p>}
        <button onClick={handleVerify} disabled={loading}
          className="reads-btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Verifying…' : 'Verify Email'}
        </button>
        <button onClick={handleResend} disabled={resending}
          className="w-full text-center text-reads-teal text-sm font-semibold py-2">
          {resending ? 'Sending…' : 'Resend Code'}
        </button>
      </div>
    </div>
  );
};

// ── PARTNER PENDING ────────────────────────────────────────────────────────────
const PartnerPendingView = ({ email }) => (
  <div className="animate-fade-in text-center">
    <div className="flex justify-center mb-5">
      <div className="w-20 h-20 bg-reads-gold/10 rounded-2xl flex items-center justify-center">
        <Building2 size={40} className="text-reads-gold-dark" />
      </div>
    </div>
    <h2 className="font-black text-reads-navy text-2xl mb-2">Application Received</h2>
    <p className="text-reads-muted text-sm leading-relaxed mb-1">
      Your partner application is under review. We'll notify you at:
    </p>
    <p className="text-reads-navy font-bold text-sm mb-5">{email}</p>
    <p className="text-reads-muted text-xs">
      This usually takes 1–3 business days. You'll receive an email once approved.
    </p>
  </div>
);

// ── FORGOT PASSWORD ────────────────────────────────────────────────────────────
const ForgotPasswordView = ({ onBack }) => {
  const [step, setStep] = useState(1); // 1=email, 2=otp+new pw
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const sendOtp = async () => {
    if (!email.trim()) return setError('Enter your email.');
    setLoading(true); setError('');
    try {
      await api.auth.forgotPassword(email.trim().toLowerCase());
      setStep(2);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const resetPw = async () => {
    if (!otp || !newPw) return setError('Fill in all fields.');
    if (newPw.length < 8) return setError('Password must be at least 8 characters.');
    if (newPw !== confirmPw) return setError('Passwords do not match.');
    setLoading(true); setError('');
    try {
      await api.auth.resetPassword(email.trim().toLowerCase(), otp, newPw);
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  if (done) {
    return (
      <div className="animate-fade-in text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-reads-green-bg rounded-2xl flex items-center justify-center">
            <ShieldCheck size={32} className="text-reads-green" />
          </div>
        </div>
        <h2 className="font-black text-reads-navy text-xl mb-2">Password Reset!</h2>
        <p className="text-reads-muted text-sm mb-5">Your password has been successfully updated.</p>
        <button onClick={onBack} className="reads-btn-primary w-full">Back to Login</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <AuthHeader onBack={onBack} title="Reset Password"
        subtitle={step === 1 ? 'Enter your email to receive a reset code.' : `Enter the code sent to ${email}`}
      />
      <div className="space-y-4">
        {step === 1 ? (
          <Field icon={Mail} type="email" placeholder="Email address"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        ) : (
          <>
            <input type="text" inputMode="numeric" maxLength={6}
              placeholder="6-digit OTP" value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="reads-input text-center text-2xl tracking-widest font-bold"
            />
            <Field icon={Lock} type="password" placeholder="New password"
              value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            <PasswordStrength password={newPw} />
            <Field icon={Lock} type="password" placeholder="Confirm new password"
              value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </>
        )}
        {error && <p className="text-reads-red text-sm">{error}</p>}
        <button onClick={step === 1 ? sendOtp : resetPw} disabled={loading}
          className="reads-btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Please wait…' : step === 1 ? 'Send Reset Code' : 'Reset Password'}
        </button>
      </div>
    </div>
  );
};

// ── MAIN AUTH MODULE ───────────────────────────────────────────────────────────
export default function AuthModule({ onLoginSuccess }) {
  const [view, setView] = useState('login');
  const [pendingOtp, setPendingOtp] = useState(null); // { userId, email }
  const [partnerEmail, setPartnerEmail] = useState('');

  const handleRegisterSuccess = ({ userId, email, isPartner }) => {
    if (isPartner) {
      setPartnerEmail(email);
      setView('partner-pending');
    } else {
      setPendingOtp({ userId, email });
      setView('otp');
    }
  };

  const handleOtpVerified = async () => {
    await onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-reads-cream flex flex-col">
      {/* Decorative top banner */}
      <div className="h-2 bg-gradient-to-r from-reads-gold via-reads-green to-reads-gold-light" />

      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full px-6 py-8 justify-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-1 mb-10">
          <div className="w-16 h-16 bg-reads-navy rounded-2xl flex items-center justify-center shadow-reads-card mb-2">
            <img src="/assets/reads-logo.png" alt="$READS" className="w-8 h-8 object-contain" />
          </div>
          <p className="font-display font-black text-reads-navy text-xl">$READS</p>
          <p className="text-reads-muted text-xs tracking-wider uppercase">Learn · Earn · Excel</p>
        </div>

        {view === 'login' && (
          <LoginView
            onLoginSuccess={onLoginSuccess}
            onGoRegister={() => setView('register')}
            onGoForgot={() => setView('forgot')}
            onPartnerPending={(email) => { setPartnerEmail(email); setView('partner-pending'); }}
            onNeedsVerification={(userId, email) => {
              setPendingOtp({ userId, email, fromLogin: true });
              setView('otp');
            }}
          />
        )}
        {view === 'register' && (
          <RegisterView onSuccess={handleRegisterSuccess} onBack={() => setView('login')} />
        )}
        {view === 'otp' && pendingOtp && (
          <OtpView
            userId={pendingOtp.userId}
            email={pendingOtp.email}
            fromLogin={pendingOtp.fromLogin}
            onVerified={handleOtpVerified}
            onBack={() => setView(pendingOtp.fromLogin ? 'login' : 'register')}
          />
        )}
        {view === 'partner-pending' && (
          <PartnerPendingView email={partnerEmail} />
        )}
        {view === 'forgot' && (
          <ForgotPasswordView onBack={() => setView('login')} />
        )}
      </div>

      <div className="text-center pb-6">
        <p className="text-reads-muted text-xs">© {new Date().getFullYear()} READS Technologies</p>
      </div>
    </div>
  );
}
