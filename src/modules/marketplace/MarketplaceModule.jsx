import { useState, useEffect } from 'react';
import { ShoppingBag, Search, Tag, BookOpen, FileText, Loader2, ChevronRight, Plus, X } from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay, EmptyState, Badge, Modal, Toast, TokenBadge } from '../../components/UI.jsx';

const CATEGORIES = ['All', 'Notes', 'Past Questions', 'Textbooks', 'Study Guides', 'Other'];

// ── Item Card ─────────────────────────────────────────────────────────────────
function ItemCard({ item, onBuy }) {
  const catIcon = item.category === 'Notes' || item.category === 'Study Guides' ? FileText : BookOpen;
  const CatIcon = catIcon;

  return (
    <div className="reads-card p-4 mb-3">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 bg-reads-green-bg rounded-xl flex items-center justify-center flex-shrink-0">
          <CatIcon size={22} className="text-reads-green" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-reads-navy text-sm leading-tight">{item.title}</p>
          <p className="text-reads-muted text-xs mt-0.5">{item.seller_name}</p>
          <div className="flex gap-1.5 mt-1.5">
            <Badge label={item.category} variant="gray" />
            {item.exam_type && <Badge label={item.exam_type} variant="navy" />}
          </div>
        </div>
      </div>
      {item.description && (
        <p className="text-reads-muted text-xs mb-3 line-clamp-2">{item.description}</p>
      )}
      <div className="flex items-center justify-between">
        <TokenBadge amount={item.price_tokens} size="lg" />
        <button onClick={() => onBuy(item)}
          className="reads-btn-primary text-sm px-4 py-2 flex items-center gap-1.5">
          Buy Now
        </button>
      </div>
    </div>
  );
}

// ── Buy Confirm Modal ─────────────────────────────────────────────────────────
function BuyModal({ item, onClose, onBought }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    setLoading(true); setError('');
    try {
      await api.marketplace.buy(item.id);
      onBought();
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Confirm Purchase" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="font-bold text-reads-navy text-sm">{item.title}</p>
          <p className="text-reads-muted text-xs mt-0.5">{item.category} · {item.seller_name}</p>
        </div>
        <div className="bg-reads-gold/10 border border-reads-gold/20 rounded-xl p-3 flex justify-between items-center">
          <span className="text-reads-navy font-semibold text-sm">Total Cost</span>
          <TokenBadge amount={item.price_tokens} size="lg" />
        </div>
        {error && <p className="text-reads-red text-sm">{error}</p>}
        <button onClick={handle} disabled={loading}
          className="reads-btn-gold w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={18} className="animate-spin" />}
          Confirm Purchase
        </button>
      </div>
    </Modal>
  );
}

// ── List Item Modal ───────────────────────────────────────────────────────────
function ListItemModal({ onClose, onListed }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'Notes', exam_type: '', price_tokens: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handle = async () => {
    if (!form.title || !form.price_tokens) return setError('Title and price are required.');
    const price = parseInt(form.price_tokens);
    if (isNaN(price) || price < 1) return setError('Enter a valid token price.');
    setLoading(true); setError('');
    try {
      await api.marketplace.list_item({ ...form, price_tokens: price });
      onListed();
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <Modal title="List an Item" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="reads-label">Title</label>
          <input className="reads-input" placeholder="e.g. WAEC Biology Past Questions 2020–2024" value={form.title} onChange={set('title')} />
        </div>
        <div>
          <label className="reads-label">Category</label>
          <select className="reads-input" value={form.category} onChange={set('category')}>
            {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="reads-label">Exam Type (optional)</label>
          <select className="reads-input" value={form.exam_type} onChange={set('exam_type')}>
            <option value="">General</option>
            {['JAMB', 'WAEC', 'NECO', 'BECE', 'IELTS', 'SAT'].map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="reads-label">Description</label>
          <textarea className="reads-input resize-none" rows={2} placeholder="Briefly describe the content…"
            value={form.description} onChange={set('description')} />
        </div>
        <div>
          <label className="reads-label">Price (in $READS tokens)</label>
          <input type="number" className="reads-input" placeholder="e.g. 50" min="1"
            value={form.price_tokens} onChange={set('price_tokens')} />
        </div>
        {error && <p className="text-reads-red text-sm">{error}</p>}
        <button onClick={handle} disabled={loading}
          className="reads-btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={18} className="animate-spin" />}
          List Item
        </button>
      </div>
    </Modal>
  );
}

// ── Main Marketplace Module ───────────────────────────────────────────────────
export default function MarketplaceModule({ tokenBalance, onUpdateBalance }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [buyTarget, setBuyTarget] = useState(null);
  const [showList, setShowList] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'All') params.category = category;
      if (search) params.search = search;
      const data = await api.marketplace.list(params);
      setItems(data?.items || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [category]);

  const handleBought = async () => {
    setBuyTarget(null);
    showToast('Purchase successful! Check your purchases.');
    const newBal = await api.wallet.getBalance();
    onUpdateBalance?.(newBal);
    load();
  };

  const handleListed = () => {
    setShowList(false);
    showToast('Item listed successfully!');
    load();
  };

  const filtered = items.filter((item) =>
    !search ||
    item.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-4 pt-4 pb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display font-black text-reads-navy text-2xl">Marketplace</h1>
        <button onClick={() => setShowList(true)}
          className="flex items-center gap-1.5 bg-reads-green text-white text-sm font-bold px-3 py-2 rounded-xl active:scale-95 transition-transform">
          <Plus size={16} /> Sell
        </button>
      </div>
      <p className="text-reads-muted text-sm mb-4">Buy & sell study materials with $READS tokens</p>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-reads-muted-light" />
        <input className="reads-input pl-10" placeholder="Search materials…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
              category === cat ? 'bg-reads-navy text-white' : 'bg-gray-100 text-reads-muted'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingOverlay message="Loading marketplace…" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No items found"
          description={search ? 'Try a different search.' : 'No items listed yet. Be the first to sell!'}
          action={<button onClick={() => setShowList(true)} className="reads-btn-primary px-6">List an Item</button>}
        />
      ) : (
        filtered.map((item) => <ItemCard key={item.id} item={item} onBuy={setBuyTarget} />)
      )}

      {buyTarget && (
        <BuyModal item={buyTarget} onClose={() => setBuyTarget(null)} onBought={handleBought} />
      )}
      {showList && (
        <ListItemModal onClose={() => setShowList(false)} onListed={handleListed} />
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
