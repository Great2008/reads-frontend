// ClaimPage.jsx
// Standalone page at /claim?voucher=...
// Uses Mesh SDK to build + sign + submit the claim tx.
// Mesh bundles the same CSL as Eternl — no CBOR tag mismatches possible.

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, ExternalLink, Copy } from 'lucide-react';
import { api } from '../../services/api.js';

// Mesh is NOT imported at the top level — it bundles ~4 MB of WASM which
// crashes on mobile browsers. We dynamic-import it only when the user
// clicks "Sign & Claim" (desktop wallet flow only).
const loadMesh = () => import('@meshsdk/core');

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';
const WALLETS  = ['eternl', 'nami', 'typhon', 'vespr', 'flint'];

const STEPS = {
  loading:    'Loading voucher…',
  ready:      'Ready to claim',
  connecting: 'Connecting wallet…',
  building:   'Building transaction…',
  signing:    'Waiting for signature…',
  submitting: 'Submitting to blockchain…',
  confirmed:  'Tokens claimed!',
  error:      'Something went wrong',
};

export default function ClaimPage() {
  const [step, setStep]         = useState('loading');
  const [voucher, setVoucher]   = useState(null);
  const [error, setError]       = useState('');
  const [txHash, setTxHash]     = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);

  // ── Parse voucher from URL ──────────────────────────────────────────────────
  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const raw      = params.get('voucher');
    const urlToken = params.get('token');

    if (!raw) {
      setError('No voucher found in URL.');
      setStep('error');
      return;
    }

    try {
      const v = JSON.parse(decodeURIComponent(raw));
      if (!v.reward_id || !v.amount || !v.platform_signature) {
        throw new Error('Invalid voucher format');
      }
      setVoucher(v);

      if (urlToken) {
        localStorage.setItem('access_token', decodeURIComponent(urlToken));
      }

      const token = urlToken || localStorage.getItem('access_token');
      if (!token) setNeedsLogin(true);

      setStep('ready');
    } catch {
      setError('Invalid voucher data. Please go back and try again.');
      setStep('error');
    }
  }, []);

  // ── Main claim handler ──────────────────────────────────────────────────────
  const handleClaim = async () => {
    try {
      // 1. Detect & connect wallet
      setStep('connecting');
      const walletName = WALLETS.find(w => window.cardano?.[w]);
      if (!walletName) {
        throw new Error(
          'No Cardano wallet detected.\n' +
          'Open this page inside Eternl → DApp Browser tab, or use desktop Eternl/Nami.'
        );
      }

      // Load Mesh only now — keeps the page lightweight on mobile
      const { BrowserWallet, Transaction, resolvePaymentKeyHash } = await loadMesh();

      const wallet = await BrowserWallet.enable(walletName);

      // 2. Get student address (bech32 from Mesh — always valid format)
      const studentAddress = await wallet.getChangeAddress();

      // 3. Fetch claim data from backend (UTxO, script, datum — no tx building)
      setStep('building');
      const cd = await api.wallet.getClaimData({
        reward_id:          voucher.reward_id,
        student_address:    studentAddress,
        amount:             voucher.amount,
        expires_slot:       voucher.expires_slot,
        platform_signature: voucher.platform_signature,
        platform_vkey:      voucher.platform_vkey,
      });

      // 4. Resolve student PKH from address
      const studentPkh = resolvePaymentKeyHash(studentAddress);

      // 5. Describe the script UTxO Mesh will spend
      const scriptUtxo = {
        input: {
          txHash:      cd.utxo_tx_hash,
          outputIndex: cd.utxo_tx_index,
        },
        output: {
          address:    cd.contract_address,
          amount:     cd.utxo_amount,   // [{unit, quantity}, ...]
          plutusData: cd.datum_cbor,    // raw CBOR hex string
        },
      };

      // 6. Describe the PlutusV3 script
      const script = {
        code:    cd.script_cbor,
        version: 'V3',
      };

      // 7. Build the redeemer — Mesh handles all CBOR encoding internally.
      //    field order matches Aiken ClaimRedeemer:
      //    { student_pkh, amount, reward_id, expires_slot, platform_signature }
      const redeemer = {
        data: {
          alternative: 0,
          fields: [
            { bytes: studentPkh },
            { int: cd.amount },
            { bytes: voucher.reward_id.replace(/-/g, '') },
            { int: cd.expires_slot },
            { bytes: voucher.platform_signature },
          ],
        },
        exUnits: {
          mem:   500_000,
          steps: 200_000_000,
        },
      };

      // 8. Compose the asset id
      const assetUnit = cd.policy_id + cd.asset_name_hex;

      // 9. Build tx with Mesh — it handles CBOR, witnesses, script data hash
      const tx = new Transaction({ initiator: wallet })
        .redeemValue({
          value:    scriptUtxo,
          script:   script,
          redeemer: redeemer,
        })
        .sendValue(
          studentAddress,
          { lovelace: '2000000', [assetUnit]: String(cd.amount) }
        )
        .setTimeToExpire(String(cd.expires_slot))
        .setRequiredSigners([studentAddress]);

      const unsignedTx = await tx.build();

      // 10. Ask wallet to sign (partialSign=true — Mesh already added the script witness)
      setStep('signing');
      let signedTx;
      try {
        signedTx = await wallet.signTx(unsignedTx, true);
      } catch (signErr) {
        const info = signErr?.info || signErr?.message || String(signErr);
        if (
          info.toLowerCase().includes('cancel') ||
          info.toLowerCase().includes('declined') ||
          signErr?.code === 2
        ) {
          setError('Transaction cancelled. You can try again.');
          setStep('ready');
          return;
        }
        throw new Error(`Wallet signing failed: ${info}`);
      }

      // 11. Submit via backend → Blockfrost
      setStep('submitting');
      const result = await api.wallet.submitClaimTx({
        reward_id:       voucher.reward_id,
        tx_cbor:         signedTx,
        witness_set:     '',          // not needed — Mesh builds complete tx
        student_address: studentAddress,
      });

      setTxHash(result.tx_hash);
      setStep('confirmed');

    } catch (err) {
      const msg = err?.message || 'Unknown error';
      if (msg === 'SESSION_EXPIRED' || msg.includes('SESSION_EXPIRED')) {
        localStorage.removeItem('access_token');
        setNeedsLogin(true);
        setStep('ready');
      } else if (
        msg.toLowerCase().includes('cancel') ||
        msg.toLowerCase().includes('declined')
      ) {
        setError('Transaction cancelled. You can try again.');
        setStep('ready');
      } else {
        setError(msg);
        setStep('error');
      }
    }
  };

  // ── Copy URL helper ─────────────────────────────────────────────────────────
  const copyUrl = () => navigator.clipboard.writeText(window.location.href);

  const walletDetected = WALLETS.find(w => window.cardano?.[w]);
  const isProcessing   = ['connecting', 'building', 'signing', 'submitting'].includes(step);

  // ── Embedded login ──────────────────────────────────────────────────────────
  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading,  setLoginLoading]  = useState(false);
  const [loginError,    setLoginError]    = useState('');

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginError('Enter your email and password.');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
      setNeedsLogin(false);
      setLoginEmail('');
      setLoginPassword('');
      setStep('ready');
    } catch (e) {
      setLoginError(e.message);
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-reads-cream flex flex-col items-center justify-center p-4">

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-reads-navy rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg">
          <span className="text-reads-gold font-black text-2xl">₳</span>
        </div>
        <p className="font-black text-reads-navy text-xl">$READS Claim</p>
        <p className="text-reads-muted text-sm">Cardano Learn-to-Earn</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-3xl shadow-reads-card p-6 space-y-5">

        {/* Loading */}
        {step === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 size={32} className="animate-spin text-reads-green" />
            <p className="text-reads-muted text-sm">Loading voucher…</p>
          </div>
        )}

        {/* Ready */}
        {step === 'ready' && voucher && (
          <>
            <div className="space-y-1">
              <p className="font-black text-reads-navy text-lg">Claim Your Tokens</p>
              <p className="text-reads-muted text-sm">Verify the details and sign with your wallet</p>
            </div>

            {/* Voucher details */}
            <div className="bg-reads-cream rounded-2xl p-4 space-y-3">
              {[
                ['Amount',  `${voucher.amount?.toLocaleString()} $READS`],
                ['Reward',  voucher.description || 'Quiz/Tournament reward'],
                ['Expires', `Slot ${voucher.expires_slot?.toLocaleString()}`],
                ['Network', 'Cardano Preprod'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-reads-muted text-xs">{label}</span>
                  <span className="text-reads-navy font-bold text-xs text-right">{val}</span>
                </div>
              ))}
            </div>

            {/* Embedded login */}
            {needsLogin && (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                  <p className="text-amber-700 text-xs font-semibold">
                    Log in to $READS to claim your tokens
                  </p>
                </div>
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-reads-green transition-colors"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-reads-green transition-colors"
                  />
                  {loginError && (
                    <p className="text-reads-red text-xs px-1">{loginError}</p>
                  )}
                  <button
                    onClick={handleLogin}
                    disabled={loginLoading}
                    className="w-full bg-reads-navy text-white font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
                  >
                    {loginLoading
                      ? <Loader2 size={16} className="animate-spin" />
                      : null}
                    {loginLoading ? 'Logging in…' : 'Log In & Continue'}
                  </button>
                </div>
              </div>
            )}

            {/* No wallet warning */}
            {!walletDetected && !needsLogin && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 space-y-2">
                <p className="text-blue-700 text-xs font-semibold">No wallet detected</p>
                <p className="text-blue-600 text-xs">
                  Open this page inside <strong>Eternl mobile</strong> → DApp Browser tab,
                  or use a desktop browser with Eternl/Nami installed.
                </p>
                <button
                  onClick={copyUrl}
                  className="flex items-center gap-1.5 text-blue-600 text-xs font-bold"
                >
                  <Copy size={12} /> Copy this page URL
                </button>
              </div>
            )}

            {/* Claim button */}
            {!needsLogin && (
              <button
                onClick={handleClaim}
                disabled={!walletDetected}
                className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all
                  ${walletDetected
                    ? 'bg-reads-green text-white active:scale-95 shadow-reads-green'
                    : 'bg-gray-100 text-reads-muted cursor-not-allowed'}`}
              >
                <span>₳</span>
                {walletDetected
                  ? `Sign & Claim ${voucher.amount?.toLocaleString()} $READS`
                  : 'Wallet Required'}
              </button>
            )}
          </>
        )}

        {/* Processing */}
        {isProcessing && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-3xl bg-reads-green-bg flex items-center justify-center">
              <Loader2 size={28} className="animate-spin text-reads-green" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-black text-reads-navy">{STEPS[step]}</p>
              {step === 'building' && (
                <p className="text-reads-muted text-xs">Preparing your transaction…</p>
              )}
              {step === 'signing' && (
                <p className="text-reads-muted text-xs">Your wallet app will open for approval</p>
              )}
              {step === 'submitting' && (
                <p className="text-reads-muted text-xs">Broadcasting to Cardano network…</p>
              )}
            </div>
            <div className="flex gap-1.5">
              {['connecting', 'building', 'signing', 'submitting'].map((s, i) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-all
                    ${['connecting', 'building', 'signing', 'submitting'].indexOf(step) >= i
                      ? 'bg-reads-green'
                      : 'bg-gray-200'}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Confirmed */}
        {step === 'confirmed' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-reads-green-bg flex items-center justify-center">
              <CheckCircle size={36} className="text-reads-green" />
            </div>
            <div className="space-y-1">
              <p className="font-black text-reads-navy text-xl">
                {voucher?.amount?.toLocaleString()} $READS Claimed!
              </p>
              <p className="text-reads-muted text-sm">
                Tokens sent to your Cardano wallet
              </p>
            </div>
            {txHash && (
              <a
                href={`https://preprod.cardanoscan.io/transaction/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-reads-green text-xs font-bold"
              >
                View on Cardanoscan <ExternalLink size={12} />
              </a>
            )}
            <a
              href="/"
              className="w-full py-3 rounded-2xl bg-reads-navy text-white font-bold text-sm text-center block"
            >
              Back to $READS
            </a>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-reads-red-bg flex items-center justify-center">
              <XCircle size={28} className="text-reads-red" />
            </div>
            <div className="space-y-1">
              <p className="font-black text-reads-navy">Claim Failed</p>
              <p className="text-reads-muted text-xs whitespace-pre-line">{error}</p>
            </div>
            <button
              onClick={() => { setError(''); setStep('ready'); }}
              className="w-full py-3 rounded-2xl bg-gray-100 text-reads-navy font-bold text-sm"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <p className="text-reads-muted text-[10px] mt-6 text-center">
        $READS · Cardano Preprod · Powered by Aiken
      </p>
    </div>
  );
}
