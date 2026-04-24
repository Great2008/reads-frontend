import { useState, useEffect } from 'react';
import { Coins, ArrowUpRight, ArrowDownLeft, Send, RefreshCw, Copy, CheckCircle, Loader2, Filter } from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay, EmptyState, Badge, Modal, Toast } from '../../components/UI.jsx';

const TX_TYPES = {
  earned:    { label: 'Earned',    color: 'text-reads-green', bg: 'bg-reads-green-bg',   icon: ArrowDownLeft },
  received:  { label: 'Received',  color: 'text-reads-green', bg: 'bg-reads-green-bg',   icon: ArrowDownLeft },
  sent:      { label: 'Sent',      color: 'text-reads-red',   bg: 'bg-reads-red-bg',     icon: ArrowUpRight  },
  spent:     { label: 'Spent',     color: 'text-reads-red',   bg: 'bg-reads-red-bg',     icon: ArrowUpRight  },
  fee:       { label: 'Fee',       color: 'text-reads-muted', bg: 'bg-gray-100',         icon: ArrowUpRight  },
};

const TxRow = ({ tx }) => {
  const meta = TX_TYPES[tx.type] || TX_TYPES.sent;
  const Icon = meta.icon;
  const positive = tx.type === 'earned' || tx.type === 'received';
  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-gray-50 last:border-0">
      <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-reads-navy font-semibold text-sm truncate">{tx.description}</p>
        <p className="text-reads-muted text-xs mt-0.5">
          {new Date(tx.created_at).toLocaleString()} · <span className="capitalize">{meta.label}</span>
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`font-black text-sm ${positive ? 'text-reads-green' : 'text-reads-red'}`}>
          {positive ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}
        </p>
        <p className="text-reads-muted-light text-[10px]">$READS</p>
      </div>
    </div>
  );
};

// ── Send Modal ────────────────────────────────────────────────────────────────
const SendModal = ({ balance, onClose, onSent }) => {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    const amt = parseFloat(amount);
    if (!to.trim()) return setError('Enter recipient address or username.');
    if (!amt || amt <= 0) return setError('Enter a valid amount.');
    if (amt > balance) return setError('Insufficient balance.');
    setLoading(true); setError('');
    try {
      await api.wallet.send({ recipient: to.trim(), amount: amt, note });
      onSent(amt);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Send $READS" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="reads-label">Recipient</label>
          <input className="reads-input" placeholder="Wallet address or username"
            value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="reads-label">Amount</label>
          <div className="relative">
            <input type="number" className="reads-input pr-20" placeholder="0"
              value={amount} onChange={(e) => setAmount(e.target.value)} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-reads-muted text-sm font-bold">$READS</span>
          </div>
          <p className="text-reads-muted text-xs mt-1">Balance: {balance.toLocaleString()} $READS</p>
        </div>
        <div>
          <label className="reads-label">Note (optional)</label>
          <input className="reads-input" placeholder="What's this for?" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {error && <p className="text-reads-red text-sm">{error}</p>}
        <button onClick={handleSend} disabled={loading}
          className="reads-btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Sending…' : 'Send Tokens'}
        </button>
      </div>
    </Modal>
  );
};

// ── Main Wallet Module ────────────────────────────────────────────────────────
export default function WalletModule({ balance: initialBalance, onUpdateBalance }) {
  const [balance, setBalance] = useState(initialBalance ?? 0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txFilter, setTxFilter] = useState('all');
  const [showSend, setShowSend] = useState(false);
  const [copied, setCopied] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [bal, txData, me] = await Promise.allSettled([
          api.wallet.getBalance(),
          api.wallet.getTransactions({ limit: 50 }),
          api.auth.me(),
        ]);
        if (bal.status === 'fulfilled') {
          setBalance(bal.value);
          onUpdateBalance?.(bal.value);
        }
        if (txData.status === 'fulfilled') setTransactions(txData.value?.transactions || []);
        if (me.status === 'fulfilled' && me.value?.cardano_address) {
          setWalletAddress(me.value.cardano_address);
        }
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSent = async (amt) => {
    setShowSend(false);
    showToast(`Sent ${amt} $READS successfully!`);
    const newBal = await api.wallet.getBalance();
    setBalance(newBal);
    onUpdateBalance?.(newBal);
    const txData = await api.wallet.getTransactions({ limit: 50 });
    setTransactions(txData?.transactions || []);
  };

  const filtered = transactions.filter((tx) => {
    if (txFilter === 'in') return tx.type === 'earned' || tx.type === 'received';
    if (txFilter === 'out') return tx.type === 'sent' || tx.type === 'spent';
    return true;
  });

  // Stats
  const totalEarned = transactions
    .filter((t) => t.type === 'earned' || t.type === 'received')
    .reduce((s, t) => s + t.amount, 0);
  const totalSpent = transactions
    .filter((t) => t.type === 'sent' || t.type === 'spent')
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="px-4 pt-4 pb-6 animate-fade-in">
      <h1 className="font-display font-black text-reads-navy text-2xl mb-5">Wallet</h1>

      {/* Balance card */}
      <div className="relative bg-reads-navy rounded-3xl p-6 mb-5 overflow-hidden shadow-reads-card">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-reads-gold/10 rounded-full" />
        <div className="absolute -bottom-10 -left-6 w-28 h-28 bg-reads-green/10 rounded-full" />

        <div className="relative z-10">
          <p className="text-reads-muted-light text-xs uppercase tracking-widest mb-1">Total Balance</p>
          <div className="flex items-end gap-2 mb-4">
            <span className="font-black text-reads-gold text-4xl">{balance.toLocaleString()}</span>
            <span className="text-reads-muted-light font-semibold text-sm pb-1">$READS</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowSend(true)}
              className="flex-1 bg-reads-gold text-reads-navy font-bold text-sm rounded-2xl py-3 flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
              <Send size={16} /> Send
            </button>
            <button className="flex-1 bg-white/10 text-white font-bold text-sm rounded-2xl py-3 flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
              <RefreshCw size={16} /> Convert
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="reads-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft size={16} className="text-reads-green" />
            <p className="text-reads-muted text-xs">Total Earned</p>
          </div>
          <p className="font-black text-reads-navy text-lg">{totalEarned.toLocaleString()}</p>
          <p className="text-reads-muted text-xs">$READS</p>
        </div>
        <div className="reads-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight size={16} className="text-reads-red" />
            <p className="text-reads-muted text-xs">Total Spent</p>
          </div>
          <p className="font-black text-reads-navy text-lg">{totalSpent.toLocaleString()}</p>
          <p className="text-reads-muted text-xs">$READS</p>
        </div>
      </div>

      {/* Cardano address */}
      {walletAddress && (
        <div className="reads-card p-4 mb-5">
          <p className="text-reads-muted text-xs mb-1.5">Cardano Wallet Address</p>
          <div className="flex items-center gap-2">
            <code className="text-reads-navy text-xs font-mono flex-1 truncate">{walletAddress}</code>
            <button onClick={copyAddress} className="flex-shrink-0 text-reads-muted hover:text-reads-navy transition-colors">
              {copied ? <CheckCircle size={18} className="text-reads-green" /> : <Copy size={18} />}
            </button>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-reads-navy text-base">Transactions</h2>
          <div className="flex gap-1.5">
            {['all', 'in', 'out'].map((f) => (
              <button key={f} onClick={() => setTxFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  txFilter === f ? 'bg-reads-green text-white' : 'bg-gray-100 text-reads-muted'
                }`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingOverlay message="Loading transactions…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Coins} title="No transactions" description="Your transaction history will appear here." />
        ) : (
          <div className="reads-card px-4">
            {filtered.map((tx) => <TxRow key={tx.id} tx={tx} />)}
          </div>
        )}
      </div>

      {showSend && (
        <SendModal balance={balance} onClose={() => setShowSend(false)} onSent={handleSent} />
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
