import { useState, useEffect } from 'react';
import {
  Award, ShieldCheck, BookOpen, Star, ArrowLeft, Download, Share2,
  CheckCircle, Sparkles, UserCheck, ChevronDown, MoreVertical,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay, EmptyState, Badge, Toast } from '../../components/UI.jsx';

const TYPE_ICON = { course: BookOpen, quiz: Star, special: Award };

const FILTERS = [
  { key: 'all',     label: 'All Certificates' },
  { key: 'course',  label: 'Course Certificates' },
  { key: 'quiz',    label: 'Quiz Certificates' },
  { key: 'special', label: 'Special Achievements' },
  { key: 'on_chain',label: 'On-chain Certificates' },
];

// ── Stat tile ──────────────────────────────────────────────────────────────────
const StatTile = ({ icon: Icon, value, label, sub, bg, color }) => (
  <div className="reads-card p-3">
    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-2`}>
      <Icon size={18} className={color} />
    </div>
    <p className="font-black text-reads-navy text-lg leading-none">{value}</p>
    <p className="text-reads-muted text-xs mt-1">{label}</p>
    {sub && <p className="text-reads-muted-light text-[10px]">{sub}</p>}
  </div>
);

// ── Certificate row ──────────────────────────────────────────────────────────
const CertRow = ({ cert, onView }) => {
  const Icon = TYPE_ICON[cert.type] || Award;
  return (
    <div className="reads-card p-4 mb-3">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 bg-reads-green-bg rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-reads-green" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-black text-reads-navy text-sm leading-tight">{cert.title}</p>
            <Badge label={cert.on_chain ? 'On-chain' : 'Verified'} variant={cert.on_chain ? 'navy' : 'green'} />
          </div>
          {cert.description && <p className="text-reads-muted text-xs mt-1 leading-snug">{cert.description}</p>}
          <p className="text-reads-muted-light text-[10px] mt-1.5">
            Earned on {new Date(cert.earned_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
      <button onClick={() => onView(cert)} className="reads-btn-outline w-full mt-3 text-xs py-2">
        View Certificate
      </button>
    </div>
  );
};

// ── Certificate detail / preview ─────────────────────────────────────────────
function CertificateDetail({ cert, studentName, onBack, showToast }) {
  const handleDownload = () => {
    // TODO(backend): /certifications/{id}/download doesn't exist yet.
    window.open(api.certifications.downloadUrl(cert.id), '_blank');
  };

  const handleShare = async () => {
    const shareData = {
      title: cert.title,
      text: `I just earned "${cert.title}" on READS!`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (_) {}
    } else {
      navigator.clipboard.writeText(shareData.text);
      showToast('Copied to clipboard!');
    }
  };

  return (
    <div className="px-4 pt-4 pb-8 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1.5 text-reads-muted text-sm font-semibold mb-4">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Certificate preview card */}
      <div className="relative bg-reads-navy rounded-2xl p-6 mb-4 overflow-hidden border-4 border-reads-gold/30">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-reads-gold/10 rounded-full" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-reads-green/10 rounded-full" />
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <BookOpen size={18} className="text-reads-gold" />
            <span className="font-display font-black text-white text-sm tracking-wide">READS</span>
          </div>
          <p className="text-reads-gold text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Certificate of Achievement</p>
          <p className="text-white/70 text-xs mb-4">This is to certify that</p>
          <p className="font-display font-black text-white text-2xl mb-4">{studentName}</p>
          <p className="text-white/70 text-xs mb-1">has successfully completed</p>
          <p className="font-black text-reads-gold text-lg leading-tight mb-4">{cert.title}</p>
          {cert.description && <p className="text-white/60 text-xs leading-snug mb-4">{cert.description}</p>}
          <div className="flex items-center justify-between text-left mt-6 pt-4 border-t border-white/10">
            <div>
              <p className="text-white/50 text-[10px]">Issued on</p>
              <p className="text-white text-xs font-semibold">
                {new Date(cert.earned_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px]">{cert.issuer || 'READS Technologies'}</p>
              <p className="text-white text-xs font-semibold">Authorized</p>
            </div>
          </div>
        </div>
      </div>

      {cert.on_chain && (
        <div className="reads-card p-3 mb-4 flex items-center gap-2">
          <ShieldCheck size={16} className="text-reads-green flex-shrink-0" />
          <p className="text-reads-navy text-xs font-semibold">
            Secured on Cardano{cert.tx_hash ? ` · ${cert.tx_hash.slice(0, 10)}…` : ''}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={handleDownload} className="reads-btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
          <Download size={16} /> Download
        </button>
        <button onClick={handleShare} className="reads-btn-outline flex-1 flex items-center justify-center gap-2 text-sm">
          <Share2 size={16} /> Share
        </button>
      </div>
    </div>
  );
}

// ── Main Certifications Module ────────────────────────────────────────────────
export default function CertificationsModule({ user }) {
  const [certs, setCerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    api.certifications.list()
      .then((d) => { setCerts(d?.certificates || []); setStats(d?.stats || null); })
      .catch(() => {}) // backend not live yet — empty state below, no fabricated certificates
      .finally(() => setLoading(false));
  }, []);

  const filtered = certs.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'on_chain') return c.on_chain;
    return c.type === filter;
  });

  if (selected) {
    return (
      <CertificateDetail
        cert={selected}
        studentName={user?.full_name || 'Student'}
        onBack={() => setSelected(null)}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="px-4 pt-4 pb-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <h1 className="font-display font-black text-reads-navy text-2xl">My Certifications</h1>
        <ShieldCheck size={20} className="text-reads-green" />
      </div>
      <p className="text-reads-muted text-sm mb-4">View, download and share your certificates.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatTile icon={Award} value={stats?.total_earned ?? certs.length} label="Earned" sub="Total all time"
          bg="bg-reads-green-bg" color="text-reads-green" />
        <StatTile icon={ShieldCheck} value={stats?.on_chain_count ?? certs.filter(c => c.on_chain).length} label="On-chain" sub="Verified on blockchain"
          bg="bg-purple-50" color="text-purple-600" />
        <StatTile icon={BookOpen} value={stats?.courses_completed ?? '—'} label="Courses" sub="This month"
          bg="bg-amber-50" color="text-amber-600" />
        <StatTile icon={CheckCircle} value={stats?.points_earned ?? '—'} label="Points Earned" sub="From certified achievements"
          bg="bg-blue-50" color="text-blue-600" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
              filter === f.key ? 'bg-reads-green text-white' : 'bg-gray-100 text-reads-muted'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Certificate list */}
      {loading ? (
        <LoadingOverlay message="Loading certificates…" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Award} title="No certificates yet"
          description="Complete lessons, quizzes, and courses to start earning certificates." />
      ) : (
        <div>
          <p className="font-black text-reads-navy text-sm mb-2">Your Certificates</p>
          {filtered.map((c) => <CertRow key={c.id} cert={c} onView={setSelected} />)}
        </div>
      )}

      {/* Certificate Features */}
      <div className="reads-card p-4 mt-2">
        <p className="font-black text-reads-navy text-sm mb-3">Certificate Features</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles size={15} className="text-purple-600" />
            </div>
            <div>
              <p className="text-reads-navy font-semibold text-xs">On-chain Verification</p>
              <p className="text-reads-muted text-xs mt-0.5">Secured on the Cardano blockchain. It cannot be altered or tampered with.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-reads-green-bg rounded-lg flex items-center justify-center flex-shrink-0">
              <Share2 size={15} className="text-reads-green" />
            </div>
            <div>
              <p className="text-reads-navy font-semibold text-xs">Share Anywhere</p>
              <p className="text-reads-muted text-xs mt-0.5">Share your achievement on LinkedIn, Twitter and with employers.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <UserCheck size={15} className="text-blue-600" />
            </div>
            <div>
              <p className="text-reads-navy font-semibold text-xs">Improve Your Profile</p>
              <p className="text-reads-muted text-xs mt-0.5">Add certificates to your profile and stand out among other learners.</p>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  );
}
