import { useState, useEffect } from 'react';
import {
  Award, ShieldCheck, BookOpen, Star, ArrowLeft, Download, Share2,
  CheckCircle, Sparkles, UserCheck, ChevronRight, Zap, Flame, Target,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { LoadingOverlay, EmptyState, Badge, Toast } from '../../components/UI.jsx';

const TYPE_ICON = { course: BookOpen, quiz: Star, special: Award };
const TABS = [
  { key: 'badges', label: 'Badges' },
  { key: 'results', label: 'Results' },
  { key: 'certificates', label: 'Certificates' },
];

// Badge icon lookup — falls back to a generic award icon for badge types we
// don't specifically recognize by name.
const BADGE_ICON = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('streak') || t.includes('consistent')) return Flame;
  if (t.includes('quiz')) return Target;
  if (t.includes('quick') || t.includes('fast')) return Zap;
  return Award;
};

const gradeColor = (g) => (g === 'A' ? 'text-reads-green' : g === 'F' ? 'text-reads-red' : 'text-reads-navy');
const gradeBg = (g) => (g === 'A' ? 'bg-reads-green-bg' : g === 'F' ? 'bg-reads-red-bg' : 'bg-gray-100');

// ── Badge tile ─────────────────────────────────────────────────────────────────
const BadgeTile = ({ achievement }) => {
  const Icon = BADGE_ICON(achievement.title || achievement.name);
  return (
    <div className="reads-card p-4 text-center">
      <div className="w-12 h-12 bg-reads-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
        <Icon size={22} className="text-reads-gold-dark" />
      </div>
      <p className="text-reads-navy font-bold text-xs leading-tight">{achievement.title || achievement.name}</p>
      {achievement.earned_at && (
        <p className="text-reads-muted-light text-[10px] mt-1">
          {new Date(achievement.earned_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>
      )}
    </div>
  );
};

// ── Result row (real data via students.getMyResults) ────────────────────────────
const ResultRow = ({ r }) => (
  <div className="reads-card px-4 py-3 flex items-center gap-3">
    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${gradeBg(r.grade)}`}>
      <span className={`font-black text-sm leading-tight ${gradeColor(r.grade)}`}>{r.grade || '—'}</span>
      {r.score != null && <span className="text-[9px] text-reads-muted font-semibold">{r.score}%</span>}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-reads-navy text-sm truncate">{r.subject_name}</p>
      {r.remarks && <p className="text-reads-muted text-xs mt-0.5 truncate">{r.remarks}</p>}
    </div>
    {!r.is_published && (
      <span className="text-[10px] bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded-full flex-shrink-0">Pending</span>
    )}
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
  const [tab, setTab] = useState('badges');
  const [certs, setCerts] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    Promise.allSettled([
      api.certifications.list(),
      api.profile.getAchievements(),
      api.students.getMyResults(),
    ]).then(([certR, achR, resR]) => {
      if (certR.status === 'fulfilled') setCerts(certR.value?.certificates || []);
      if (achR.status === 'fulfilled') setAchievements(achR.value?.achievements || []);
      if (resR.status === 'fulfilled') setResults(resR.value?.results || []);
    }).finally(() => setLoading(false));
  }, []);

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

  const byTerm = results.reduce((acc, r) => {
    const key = r.term ? `Term ${r.term}` : 'Results';
    (acc[key] = acc[key] || []).push(r);
    return acc;
  }, {});

  return (
    <div className="px-4 pt-4 pb-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <h1 className="font-display font-black text-reads-navy text-2xl">My Certifications</h1>
        <ShieldCheck size={20} className="text-reads-green" />
      </div>
      <p className="text-reads-muted text-sm mb-4">View, download and share your certificates.</p>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-4">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              tab === t.key ? 'bg-white text-reads-navy shadow-sm' : 'text-reads-muted'
            }`}>
            {t.label}{t.key === 'badges' && achievements.length > 0 ? ` (${achievements.length})` : ''}
          </button>
        ))}
      </div>

      {loading ? <LoadingOverlay message="Loading…" /> : (
        <>
          {/* ── Badges tab ─────────────────────────────────────────────── */}
          {tab === 'badges' && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="font-black text-reads-navy text-sm">Badges</p>
              </div>
              {achievements.length === 0 ? (
                <EmptyState icon={Award} title="No badges yet" description="Complete lessons and quizzes to start earning badges." />
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {achievements.map((a) => <BadgeTile key={a.id} achievement={a} />)}
                </div>
              )}

              {certs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-black text-reads-navy text-sm">Recent Certificates</p>
                    <button onClick={() => setTab('certificates')} className="text-reads-teal text-xs font-semibold">View all</button>
                  </div>
                  {certs.slice(0, 2).map((c) => <CertRow key={c.id} cert={c} onView={setSelected} />)}
                </div>
              )}
            </>
          )}

          {/* ── Results tab (real data) ───────────────────────────────────── */}
          {tab === 'results' && (
            results.length === 0 ? (
              <EmptyState icon={Award} title="No results yet" description="Results will appear here once published by your school." />
            ) : (
              <div className="space-y-4">
                {Object.entries(byTerm).map(([term, items]) => (
                  <div key={term}>
                    <p className="font-black text-reads-navy text-xs uppercase tracking-widest mb-2">{term}</p>
                    <div className="space-y-2">
                      {items.map((r) => <ResultRow key={r.id} r={r} />)}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── Certificates tab ──────────────────────────────────────────── */}
          {tab === 'certificates' && (
            certs.length === 0 ? (
              <EmptyState icon={Award} title="No certificates yet"
                description="Complete lessons, quizzes, and courses to start earning certificates." />
            ) : (
              <div>{certs.map((c) => <CertRow key={c.id} cert={c} onView={setSelected} />)}</div>
            )
          )}
        </>
      )}

      {/* Certificate Features */}
      <div className="reads-card p-4 mt-5">
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
