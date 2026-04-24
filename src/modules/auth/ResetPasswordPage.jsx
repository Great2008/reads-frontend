import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.js';

export default function ResetPasswordPage() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') || '');
  const [email] = useState(() => new URLSearchParams(window.location.search).get('email') || '');
  const [otp, setOtp] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handle = async () => {
    if (!newPw) return setError('Enter a new password.');
    if (newPw.length < 8) return setError('Password must be at least 8 characters.');
    if (newPw !== confirmPw) return setError('Passwords do not match.');
    setLoading(true); setError('');
    try {
      await api.auth.resetPassword(email, otp || token, newPw);
      setDone(true);
    } catch (e) {
      setError(e.message || 'Reset failed. The link may have expired.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-reads-cream flex flex-col">
      <div className="h-1.5 bg-gradient-to-r from-reads-gold via-reads-green to-reads-gold-light" />
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full px-6 py-10">

        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-reads-navy rounded-2xl flex items-center justify-center shadow-reads-card">
            <span className="font-display font-black text-reads-gold text-2xl">₿</span>
          </div>
        </div>

        {done ? (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 bg-reads-green-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-reads-green" />
            </div>
            <h1 className="font-display font-black text-reads-navy text-2xl mb-2">Password Reset!</h1>
            <p className="text-reads-muted text-sm mb-6">Your password has been updated. You can now log in.</p>
            <button onClick={() => window.location.href = '/'} className="reads-btn-primary w-full">
              Back to Login
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            <h1 className="font-display font-black text-reads-navy text-2xl mb-1">Reset Password</h1>
            <p className="text-reads-muted text-sm mb-6">Enter your OTP code and a new password.</p>
            <div className="space-y-4">
              {!token && (
                <div>
                  <label className="reads-label">OTP Code</label>
                  <input type="text" inputMode="numeric" maxLength={6}
                    className="reads-input text-center text-2xl font-bold tracking-widest"
                    placeholder="000000" value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
                </div>
              )}
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} placeholder="New password"
                  value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  className="reads-input pr-11" />
                <button onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-reads-muted">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <input type="password" placeholder="Confirm new password"
                value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                className="reads-input" />
              {error && <p className="text-reads-red text-sm">{error}</p>}
              <button onClick={handle} disabled={loading}
                className="reads-btn-primary w-full flex items-center justify-center gap-2">
                {loading && <Loader2 size={18} className="animate-spin" />}
                Reset Password
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
