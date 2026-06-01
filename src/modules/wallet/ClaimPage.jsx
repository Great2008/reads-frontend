// ClaimPage.jsx
// Option 4: Platform signs + submits the tx server-side.
// No wallet connection needed — tokens go to the address linked in the user's profile.

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react';
import { api } from '../../services/api.js';

const CARDANOSCAN = 'https://preprod.cardanoscan.io/transaction/';

export default function ClaimPage() {
  const [step, setStep]         = useState('loading');   // loading|ready|claiming|confirmed|error|login
  const [voucher, setVoucher]   = useState(null);
  const [error, setError]       = useState('');
  const [txHash, setTxHash]     = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);

  // ── Parse voucher from URL ────────────────────────────────────────────────
  useEffect(() => {
    try {
      const params  = new URLSearchParams(window.location.search);
      const encoded = params.get('voucher');
      if (!encoded) { setError('Missing voucher parameter in URL.'); setStep('error'); return; }
      // Inject JWT from URL into localStorage so API calls are authenticated
      const urlToken = params.get('token');
      if (urlToken) localStorage.setItem('access_token', decodeURIComponent(urlToken));
      // URL uses encodeURIComponent(JSON.stringify(...)) — not base64
      const v = JSON.parse(decodeURIComponent(encoded));
      if (!v.reward_id || !v.amount || !v.platform_signature) {
        setError('Invalid or incomplete voucher.'); setStep('error'); return;
      }
      setVoucher(v);
      setStep('ready');
    } catch {
      setError('Could not parse voucher. The link may be corrupted.'); setStep('error');
    }
  }, []);

  // ── Check auth ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'ready') return;
    api.auth.me().catch(() => setNeedsLogin(true));
  }, [step]);

  const handleLogin = () => {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `/?redirect=${returnUrl}`;
  };

  // ── Claim ─────────────────────────────────────────────────────────────────
  const handleClaim = async () => {
    try {
      setStep('claiming');
      setError('');

      // Step 1: issue voucher
      await api.wallet.issueVoucher(voucher.reward_id);

      // Step 2: platform signs + submits tx — no wallet needed
      const result = await api.wallet.platformClaim({ reward_id: voucher.reward_id });

      if (!result?.tx_hash) throw new Error('No transaction hash returned from server.');
      setTxHash(result.tx_hash);
      setStep('confirmed');
    } catch (err) {
      const msg = err?.message || 'Unknown error';
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        setNeedsLogin(true);
        setStep('ready');
      } else {
        setError(msg);
        setStep('error');
      }
    }
  };

  const copyTx = () => navigator.clipboard.writeText(txHash).catch(() => {});

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-reads-cream flex flex-col items-center justify-center p-4">

      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-reads-navy rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg">
          <span className="text-reads-gold font-black text-2xl">₳</span>
        </div>
        <h1 className="font-black text-reads-navy text-2xl">$READS Claim</h1>
        <p className="text-reads-muted text-sm mt-1">Cardano Learn-to-Earn</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-lg p-6 w-full max-w-sm">

        {/* Loading */}
        {step === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-10 h-10 text-reads-navy animate-spin" />
            <p className="text-reads-muted text-sm">Loading voucher…</p>
          </div>
        )}

        {/* Ready */}
        {step === 'ready' && voucher && (
          <>
            <div className="space-y-1 mb-4">
              <p className="font-black text-reads-navy text-lg">Claim Your Tokens</p>
              <p className="text-reads-muted text-sm">Tokens will be sent to your linked Cardano address.</p>
            </div>

            {/* Details */}
            <div className="bg-reads-cream rounded-2xl p-4 space-y-2 mb-5 text-sm">
              {[
                ['Amount',  `${voucher.amount?.toLocaleString()} $READS`],
                ['Reward',  voucher.description || 'Learn-to-Earn reward'],
                ['Expires', `Slot ${voucher.expires_slot?.toLocaleString()}`],
                ['Network', 'Cardano Preprod'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-reads-muted">{k}</span>
                  <span className="font-bold text-reads-navy text-right">{v}</span>
                </div>
              ))}
            </div>

            {needsLogin ? (
              <div className="space-y-3">
                <p className="text-reads-muted text-sm text-center">Log in to claim your tokens.</p>
                <button onClick={handleLogin}
                  className="w-full bg-reads-navy text-white font-black py-4 rounded-2xl">
                  Log In to Claim
                </button>
              </div>
            ) : (
              <button onClick={handleClaim}
                className="w-full bg-reads-green text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-base shadow-md">
                <span>✦</span>
                Claim {voucher.amount?.toLocaleString()} $READS
              </button>
            )}

            <p className="text-xs text-reads-muted text-center mt-3">
              No wallet app needed — tokens are sent directly to your linked address.
            </p>
          </>
        )}

        {/* Claiming */}
        {step === 'claiming' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-12 h-12 text-reads-navy animate-spin" />
            <p className="font-black text-reads-navy text-lg">Processing Claim…</p>
            <p className="text-reads-muted text-sm text-center">
              Building and submitting your transaction. This takes ~10 seconds.
            </p>
          </div>
        )}

        {/* Confirmed */}
        {step === 'confirmed' && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-reads-green" />
            </div>
            <p className="font-black text-reads-navy text-xl">
              {voucher?.amount?.toLocaleString()} $READS Claimed!
            </p>
            <p className="text-reads-muted text-sm">
              Tokens are on their way to your Cardano wallet. Allow ~30 seconds for confirmation.
            </p>
            <div className="flex gap-2 w-full mt-2">
              <button onClick={copyTx}
                className="flex-1 border border-reads-navy text-reads-navy font-bold py-3 rounded-2xl text-sm">
                Copy TX
              </button>
              <a href={`${CARDANOSCAN}${txHash}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 bg-reads-navy text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-1">
                View <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <p className="font-black text-reads-navy">Claim Failed</p>
            <p className="text-reads-muted text-sm break-words">{error}</p>
            <button onClick={() => { setError(''); setStep('ready'); }}
              className="w-full bg-gray-100 text-reads-navy font-bold py-3 rounded-2xl text-sm">
              Try Again
            </button>
          </div>
        )}

      </div>

      <p className="text-xs text-reads-muted mt-6">
        $READS · Cardano Preprod · Powered by Aiken
      </p>
    </div>
  );
}
