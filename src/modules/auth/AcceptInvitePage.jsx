import { useState, useEffect } from 'react';
import { UserCheck, Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.js';

export default function AcceptInvitePage() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') || '');
  const [preview, setPreview] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setError('Invalid or missing invite token.'); setLoading(false); return; }
    api.auth.previewStaffInvite(token)
      .then(setPreview)
      .catch((e) => setError(e.message || 'Invalid or expired invite link.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!password) return setError('Enter a password.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPw) return setError('Passwords do not match.');
    setSubmitting(true); setError('');
    try {
      await api.auth.acceptStaffInvite(token, password);
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-reads-cream flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-reads-green" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-reads-cream flex flex-col">
      <div className="h-1.5 bg-gradient-to-r from-reads-gold via-reads-green to-reads-gold-light" />
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full px-6 py-10">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-reads-navy rounded-2xl flex items-center justify-center shadow-reads-card">
            <img src="/assets/reads-logo.png" alt="$READS" className="w-8 h-8 object-contain" />
          </div>
        </div>

        {done ? (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 bg-reads-green-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-reads-green" />
            </div>
            <h1 className="font-display font-black text-reads-navy text-2xl mb-2">Account Created!</h1>
            <p className="text-reads-muted text-sm mb-6">
              Your staff account is active. You can now log in to the $READS Partner Portal.
            </p>
            <button onClick={() => window.location.href = '/'}
              className="reads-btn-primary w-full">
              Go to Login
            </button>
          </div>
        ) : error && !preview ? (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 bg-reads-red-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-reads-red" />
            </div>
            <h1 className="font-display font-black text-reads-navy text-xl mb-2">Invalid Invite</h1>
            <p className="text-reads-muted text-sm mb-6">{error}</p>
            <button onClick={() => window.location.href = '/'} className="reads-btn-outline w-full">
              Back to Login
            </button>
          </div>
        ) : preview ? (
          <div className="animate-fade-in">
            {/* Invite info */}
            <div className="reads-card p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-reads-green-bg rounded-xl flex items-center justify-center">
                  <UserCheck size={20} className="text-reads-green" />
                </div>
                <div>
                  <p className="font-black text-reads-navy text-sm">Staff Invitation</p>
                  <p className="text-reads-muted text-xs">{preview.school_name}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-reads-muted">Email:</span>
                  <span className="font-semibold text-reads-navy">{preview.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-reads-muted">Role:</span>
                  <span className="font-semibold text-reads-navy capitalize">{preview.role?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-reads-muted">School:</span>
                  <span className="font-semibold text-reads-navy">{preview.school_name}</span>
                </div>
              </div>
            </div>

            <h2 className="font-display font-black text-reads-navy text-2xl mb-1">Set Your Password</h2>
            <p className="text-reads-muted text-sm mb-5">Create a secure password to activate your account.</p>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="reads-input pr-11"
                />
                <button onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-reads-muted">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="reads-input"
              />
              {error && <p className="text-reads-red text-sm">{error}</p>}
              <button onClick={handleAccept} disabled={submitting}
                className="reads-btn-primary w-full flex items-center justify-center gap-2">
                {submitting && <Loader2 size={18} className="animate-spin" />}
                Activate Account
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
