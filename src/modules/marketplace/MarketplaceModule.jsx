import { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag, Search, BookOpen, FileText, Loader2, Plus,
  Download, Package, Tag, Trash2, CheckCircle, Clock, FileUp,
  ChevronRight, BarChart2, X
} from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay, EmptyState, Badge, Modal, Toast, TokenBadge } from '../../components/UI.jsx';

const CATEGORIES = ['All', 'Notes', 'Past Questions', 'Textbooks', 'Study Guides', 'Other'];
const EXAM_TYPES = ['JAMB', 'WAEC', 'NECO', 'BECE', 'IELTS', 'SAT'];

const STATUS_STYLE = {
  active:   { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Active'   },
  delisted: { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Delisted' },
  sold:     { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Sold'     },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function catIcon(category) {
  return category === 'Notes' || category === 'Study Guides' ? FileText : BookOpen;
}

function fmt(iso) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Browse Item Card ──────────────────────────────────────────────────────────
function ItemCard({ item, onBuy }) {
  const Icon = catIcon(item.category);
  return (
    <div className="reads-card p-4 mb-3">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 bg-reads-green-bg rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon size={22} className="text-reads-green" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-reads-navy text-sm leading-tight">{item.title}</p>
          <p className="text-reads-muted text-xs mt-0.5">{item.seller_name}</p>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            <Badge label={item.category} variant="gray" />
            {item.exam_type && <Badge label={item.exam_type} variant="navy" />}
            {item.has_file && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-reads-green bg-reads-green-bg px-2 py-0.5 rounded-full">
                <FileUp size={10} /> File
              </span>
            )}
          </div>
        </div>
      </div>
      {item.description && (
        <p className="text-reads-muted text-xs mb-3 line-clamp-2">{item.description}</p>
      )}
      <div className="flex items-center justify-between">
        <TokenBadge amount={item.price_tokens} size="lg" />
        {item.already_bought ? (
          <span className="flex items-center gap-1 text-reads-green text-xs font-bold">
            <CheckCircle size={14} /> Purchased
          </span>
        ) : (
          <button onClick={() => onBuy(item)}
            className="reads-btn-primary text-sm px-4 py-2 flex items-center gap-1.5">
            Buy Now
          </button>
        )}
      </div>
    </div>
  );
}

// ── Buy Confirm Modal ─────────────────────────────────────────────────────────
function BuyModal({ item, onClose, onBought }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

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
          {item.has_file && (
            <p className="text-reads-green text-xs mt-1 flex items-center gap-1">
              <FileUp size={11} /> Includes downloadable file
            </p>
          )}
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

// ── List Item Modal (with file upload) ────────────────────────────────────────
function ListItemModal({ onClose, onListed }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'Notes', exam_type: '', price_tokens: ''
  });
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const fileRef               = useRef();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(f.type)) {
      setError('Only PDF, Word, or image files are allowed.'); return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File must be under 20 MB.'); return;
    }
    setError(''); setFile(f);
  };

  const handle = async () => {
    if (!form.title || !form.price_tokens) return setError('Title and price are required.');
    const price = parseInt(form.price_tokens);
    if (isNaN(price) || price < 1) return setError('Enter a valid token price.');
    setLoading(true); setError('');
    try {
      await api.marketplace.list_item({ ...form, price_tokens: price }, file);
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
          <input className="reads-input" placeholder="e.g. WAEC Biology Past Questions 2020–2024"
            value={form.title} onChange={set('title')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="reads-label">Category</label>
            <select className="reads-input" value={form.category} onChange={set('category')}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="reads-label">Exam Type</label>
            <select className="reads-input" value={form.exam_type} onChange={set('exam_type')}>
              <option value="">General</option>
              {EXAM_TYPES.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="reads-label">Description</label>
          <textarea className="reads-input resize-none" rows={2}
            placeholder="Briefly describe the content…"
            value={form.description} onChange={set('description')} />
        </div>
        <div>
          <label className="reads-label">Price (in $READS tokens)</label>
          <input type="number" className="reads-input" placeholder="e.g. 50" min="1"
            value={form.price_tokens} onChange={set('price_tokens')} />
        </div>

        {/* File upload */}
        <div>
          <label className="reads-label">Attach File <span className="text-reads-muted font-normal">(optional — PDF, Word, Image · max 20 MB)</span></label>
          <input ref={fileRef} type="file" className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            onChange={handleFile} />
          {file ? (
            <div className="flex items-center gap-2 bg-reads-green-bg rounded-xl p-3">
              <FileUp size={18} className="text-reads-green flex-shrink-0" />
              <span className="text-reads-navy text-sm font-semibold flex-1 truncate">{file.name}</span>
              <button onClick={() => { setFile(null); fileRef.current.value = ''; }}
                className="text-reads-muted hover:text-reads-red transition-colors">
                <X size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-reads-muted text-sm hover:border-reads-green hover:text-reads-green transition-colors">
              <FileUp size={20} className="mx-auto mb-1" />
              Tap to attach file
            </button>
          )}
        </div>

        {error && <p className="text-reads-red text-sm">{error}</p>}
        <button onClick={handle} disabled={loading}
          className="reads-btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? (file ? 'Uploading…' : 'Listing…') : 'List Item'}
        </button>
      </div>
    </Modal>
  );
}

// ── My Purchases Tab ──────────────────────────────────────────────────────────
function PurchasesTab() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.marketplace.myPurchases()
      .then(d => setPurchases(d.purchases || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = (item_id) => {
    // Opens the gated download URL in a new tab — browser handles redirect to Supabase
    const url = api.marketplace.downloadUrl(item_id);
    const token = localStorage.getItem('access_token');
    // Fetch with auth then open blob — needed because download endpoint is gated
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = '';
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => alert('Download failed. Please try again.'));
  };

  if (loading) return <LoadingOverlay message="Loading purchases…" />;
  if (!purchases.length) return (
    <EmptyState icon={Package} title="No purchases yet"
      description="Browse the marketplace and buy study materials." />
  );

  return (
    <div className="space-y-3">
      {purchases.map(p => {
        const Icon = catIcon(p.category);
        return (
          <div key={p.purchase_id} className="reads-card p-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 bg-reads-green-bg rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-reads-green" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-reads-navy text-sm leading-tight">{p.title}</p>
                <p className="text-reads-muted text-xs mt-0.5">{p.seller_name}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge label={p.category} variant="gray" />
                  {p.exam_type && <Badge label={p.exam_type} variant="navy" />}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1 text-reads-muted text-xs">
                <Clock size={12} />
                {fmt(p.purchased_at)} · <TokenBadge amount={p.tokens_paid} />
              </div>
              {p.has_file ? (
                <button onClick={() => handleDownload(p.item_id)}
                  className="flex items-center gap-1.5 bg-reads-green text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
                  <Download size={13} /> Download
                </button>
              ) : (
                <span className="text-reads-muted text-xs italic">No file</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── My Listings Tab ───────────────────────────────────────────────────────────
function ListingsTab({ onNewListing }) {
  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [delisting, setDelisting] = useState(null);
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    api.marketplace.myListings()
      .then(d => setListings(d.listings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelist = async (id) => {
    setDelisting(id);
    try {
      await api.marketplace.delist(id);
      showToast('Item delisted successfully.');
      load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally { setDelisting(null); }
  };

  if (loading) return <LoadingOverlay message="Loading listings…" />;

  return (
    <>
      <div className="flex justify-end mb-3">
        <button onClick={onNewListing}
          className="flex items-center gap-1.5 bg-reads-green text-white text-sm font-bold px-3 py-2 rounded-xl active:scale-95 transition-transform">
          <Plus size={15} /> New Listing
        </button>
      </div>

      {!listings.length ? (
        <EmptyState icon={Tag} title="No listings yet"
          description="List your notes, past questions, or study guides to earn $READS."
          action={<button onClick={onNewListing} className="reads-btn-primary px-6">List an Item</button>}
        />
      ) : (
        <div className="space-y-3">
          {listings.map(item => {
            const Icon = catIcon(item.category);
            const st   = STATUS_STYLE[item.status] || STATUS_STYLE.active;
            return (
              <div key={item.id} className="reads-card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-reads-green-bg rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-reads-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-reads-navy text-sm leading-tight flex-1 truncate">{item.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge label={item.category} variant="gray" />
                      {item.exam_type && <Badge label={item.exam_type} variant="navy" />}
                      {item.has_file && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-reads-green bg-reads-green-bg px-2 py-0.5 rounded-full">
                          <FileUp size={10} /> File
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <TokenBadge amount={item.price_tokens} size="lg" />
                    <span className="flex items-center gap-1 text-reads-muted text-xs">
                      <BarChart2 size={12} /> {item.purchases} sold
                    </span>
                  </div>
                  {item.status === 'active' && (
                    <button
                      onClick={() => handleDelist(item.id)}
                      disabled={delisting === item.id}
                      className="flex items-center gap-1 text-reads-red text-xs font-bold px-3 py-1.5 rounded-lg border border-reads-red/30 hover:bg-reads-red/5 active:scale-95 transition-all disabled:opacity-50">
                      {delisting === item.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Trash2 size={12} />}
                      Delist
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

// ── Main Marketplace Module ───────────────────────────────────────────────────
export default function MarketplaceModule({ tokenBalance, onUpdateBalance }) {
  const [tab, setTab]         = useState('browse'); // browse | purchases | listings
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [buyTarget, setBuyTarget] = useState(null);
  const [showList, setShowList]   = useState(false);
  const [toast, setToast]         = useState(null);

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

  useEffect(() => { if (tab === 'browse') load(); }, [category, tab]);

  const handleBought = async () => {
    setBuyTarget(null);
    showToast('Purchase successful! Check My Purchases to download.');
    const newBal = await api.wallet.getBalance().catch(() => null);
    if (newBal) onUpdateBalance?.(newBal);
    load();
  };

  const handleListed = () => {
    setShowList(false);
    showToast('Item listed! It\'s now live in the marketplace.');
    if (tab === 'browse') load();
  };

  const filtered = items.filter(item =>
    !search ||
    item.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.description?.toLowerCase().includes(search.toLowerCase())
  );

  const TABS = [
    { key: 'browse',    label: 'Browse',      icon: ShoppingBag },
    { key: 'purchases', label: 'My Purchases', icon: Package     },
    { key: 'listings',  label: 'My Listings',  icon: Tag         },
  ];

  return (
    <div className="px-4 pt-4 pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display font-black text-reads-navy text-2xl">Marketplace</h1>
        {tab === 'browse' && (
          <button onClick={() => setShowList(true)}
            className="flex items-center gap-1.5 bg-reads-green text-white text-sm font-bold px-3 py-2 rounded-xl active:scale-95 transition-transform">
            <Plus size={16} /> Sell
          </button>
        )}
      </div>
      <p className="text-reads-muted text-sm mb-4">Buy & sell study materials with $READS tokens</p>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-4">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === key ? 'bg-white text-reads-navy shadow-sm' : 'text-reads-muted'
            }`}>
            <Icon size={13} />
            <span className="hidden xs:inline">{label}</span>
            <span className="xs:hidden">{key === 'browse' ? 'Browse' : key === 'purchases' ? 'Bought' : 'Listed'}</span>
          </button>
        ))}
      </div>

      {/* Browse Tab */}
      {tab === 'browse' && (
        <>
          <div className="relative mb-3">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-reads-muted-light" />
            <input className="reads-input pl-10" placeholder="Search materials…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
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
            filtered.map(item => <ItemCard key={item.id} item={item} onBuy={setBuyTarget} />)
          )}
        </>
      )}

      {/* Purchases Tab */}
      {tab === 'purchases' && <PurchasesTab />}

      {/* Listings Tab */}
      {tab === 'listings' && (
        <ListingsTab onNewListing={() => setShowList(true)} />
      )}

      {/* Modals */}
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
