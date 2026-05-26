import { useState, useEffect } from 'react';
import {
  Shield, Users, BookOpen, BarChart2, Bell, CheckCircle,
  XCircle, Loader2, ChevronRight, AlertTriangle, Building2,
  GraduationCap, Settings, ClipboardList, Sparkles, Eye,
  Edit2, Trash2, Plus, Search, ArrowLeft, RefreshCw,
  HelpCircle, FileText, School, Trophy
} from 'lucide-react';
import { api } from '../../services/api.js';
import {
  LoadingOverlay, EmptyState, Badge, Modal,
  Toast, SectionHeader, StatCard, TokenBadge
} from '../../components/UI.jsx';

// ─────────────────────────────────────────────
// Stats Dashboard
// ─────────────────────────────────────────────
function AdminStats({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.admin.getStats(),
      api.admin.getRevenue(),
    ]).then(([s, r]) => { setStats(s); setRevenue(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingOverlay />;

  const BREAKDOWN_LABELS = {
    marketplace_buyer:  'Marketplace (buyer)',
    marketplace_seller: 'Marketplace (seller)',
    p2p_transfer:       'P2P Transfers',
    tutor:              'Tutor Sessions',
    exam:               'Exam Registrations',
  };

  return (
    <div className="px-4 pt-2 pb-4 space-y-5 animate-fade-in">
      <SectionHeader title="Admin Dashboard" subtitle="Platform overview" />
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Total Users" value={(stats?.total_users ?? 0).toLocaleString()} color="green" onClick={() => onNavigate('users')} />
        <StatCard icon={BookOpen} label="Total Lessons" value={stats?.total_lessons ?? 0} color="navy" onClick={() => onNavigate('lessons')} />
        <StatCard icon={Building2} label="Active Partners" value={stats?.active_partners ?? 0} color="gold" onClick={() => onNavigate('partners')} />
        <StatCard icon={ClipboardList} label="Pending Applications" value={stats?.pending_applications ?? 0} color="red" onClick={() => onNavigate('applications')} />
      </div>

      {/* Platform Revenue */}
      <div className="reads-card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-black text-reads-navy text-sm">Platform Revenue</p>
          <span className="text-reads-green font-black text-lg">{revenue?.total ?? 0} <span className="text-xs font-semibold">$READS</span></span>
        </div>
        {revenue?.breakdown && Object.keys(revenue.breakdown).length > 0 ? (
          <div className="space-y-1.5">
            {Object.entries(revenue.breakdown).map(([type, amount]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-reads-muted text-xs">{BREAKDOWN_LABELS[type] || type}</span>
                <span className="text-reads-navy text-xs font-bold">{amount} $READS</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-reads-muted text-xs">No revenue recorded yet.</p>
        )}
      </div>

      {stats?.pending_edit_requests > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-amber-800 text-sm">{stats.pending_edit_requests} pending edit requests</p>
            <p className="text-amber-600 text-xs">Schools are waiting for lesson edits to be reviewed.</p>
          </div>
          <button onClick={() => onNavigate('edit-requests')} className="text-amber-700 font-bold text-xs">Review</button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// User Management
// ─────────────────────────────────────────────
function UsersSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    setLoading(true);
    api.admin.getUsers(search ? { search } : {})
      .then((d) => setUsers(d?.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggleSuspend = async (user) => {
    try {
      if (user.is_suspended) await api.admin.activateUser(user.id);
      else await api.admin.suspendUser(user.id);
      showToast(`User ${user.is_suspended ? 'activated' : 'suspended'}.`);
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <SectionHeader title="Users" subtitle={`${users.length} total`} />
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-reads-muted-light" />
          <input className="reads-input pl-9 text-sm" placeholder="Search by name or email…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()} />
        </div>
        <button onClick={load} className="reads-btn-outline px-3 py-2">
          <RefreshCw size={16} />
        </button>
      </div>
      {loading ? <LoadingOverlay /> : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="reads-card px-4 py-3 flex items-center gap-3">
              <img src={`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(u.full_name || u.email)}&backgroundColor=0d1f3c&fontColor=e8b84b`}
                alt={u.full_name} className="w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-reads-navy text-sm truncate">{u.full_name || '(No name)'}</p>
                <p className="text-reads-muted text-xs truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge label={u.role || 'student'} variant={u.is_admin ? 'navy' : 'gray'} />
                <button onClick={() => handleToggleSuspend(u)}
                  className={`text-xs font-bold px-2 py-1 rounded-lg ${u.is_suspended ? 'bg-reads-green-bg text-reads-green' : 'bg-reads-red-bg text-reads-red'}`}>
                  {u.is_suspended ? 'Restore' : 'Suspend'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// Partner Applications
// ─────────────────────────────────────────────
function ApplicationsSection() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    api.admin.getApplications({ status: 'pending' })
      .then((d) => setApps(d?.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handle = async (appId, status, reason) => {
    try {
      await api.admin.reviewApplication(appId, { status, rejection_reason: reason });
      showToast(`Application ${status}.`);
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  if (loading) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <SectionHeader title="Partner Applications" subtitle={`${apps.length} pending`} />
      {apps.length === 0 ? (
        <EmptyState icon={Building2} title="No pending applications" description="All applications have been reviewed." />
      ) : (
        apps.map((app) => (
          <div key={app.id} className="reads-card p-4 mb-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-black text-reads-navy text-sm">{app.business_name}</p>
                <p className="text-reads-muted text-xs">{app.contact_email}</p>
              </div>
              <Badge label={app.partner_type} variant="navy" className="capitalize" />
            </div>
            <p className="text-reads-muted text-xs mb-3">
              Submitted {new Date(app.submitted_at).toLocaleDateString()}
            </p>
            <div className="flex gap-2">
              <button onClick={() => handle(app.id, 'approved')}
                className="flex-1 flex items-center justify-center gap-1.5 bg-reads-green-bg text-reads-green font-bold text-sm py-2.5 rounded-xl active:scale-95 transition-transform">
                <CheckCircle size={16} /> Approve
              </button>
              <button onClick={() => {
                const reason = prompt('Rejection reason (optional):') || '';
                handle(app.id, 'rejected', reason);
              }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-reads-red-bg text-reads-red font-bold text-sm py-2.5 rounded-xl active:scale-95 transition-transform">
                <XCircle size={16} /> Reject
              </button>
            </div>
          </div>
        ))
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// Lessons Management
// ─────────────────────────────────────────────
function LessonsSection() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiModal, setAiModal] = useState(false);
  const [aiForm, setAiForm] = useState({ topic: '', subject: '', class_name: '', track: 'school' });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [editLesson, setEditLesson] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [schools, setSchools] = useState([]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.admin.getSchools().then(d => setSchools(d?.schools || [])).catch(() => {});
  }, []);

  const loadLessons = () => {
    Promise.all([
      api.admin.getLessons({ limit: 100 }),
      api.admin.getSchools(),
    ]).then(([ld, sd]) => {
      setLessons(ld?.lessons || []);
      setSchools(sd?.schools || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadLessons(); }, []);

  const handleToggleCooldown = async (id) => {
    try {
      const res = await api.admin.toggleCooldown(id);
      showToast(res.message);
      loadLessons();
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
  };

  const handleDeleteLesson = async (id) => {
    if (!window.confirm('Delete this lesson? This cannot be undone.')) return;
    try {
      await api.admin.deleteLesson(id);
      showToast('Lesson deleted.');
      loadLessons();
    } catch (e) { showToast(e.message || 'Failed to delete', 'error'); }
  };

  const handleEdit = (lesson) => {
    setEditLesson(lesson);
    setEditForm({
      title: lesson.title || '',
      subject: lesson.subject || '',
      content: lesson.content || '',
      class_name: lesson.class_name || '',
      track: lesson.track || 'school',
      token_reward: lesson.token_reward || 10,
      is_general: lesson.is_general || false,
      school_id: lesson.school_id || null,
      quiz_pass_mark: lesson.quiz_pass_mark ?? 60,
      quiz_perfect_bonus: lesson.quiz_perfect_bonus ?? 0,
      quiz_time_limit_secs: lesson.quiz_time_limit_secs ?? null,
      quiz_max_attempts: lesson.quiz_max_attempts ?? null,
      quiz_questions_per_attempt: lesson.quiz_questions_per_attempt ?? null,
      quiz_min_read_secs: lesson.quiz_min_read_secs ?? 30,
      quiz_shuffle: lesson.quiz_shuffle ?? true,
      school_id: lesson.school_id || null,
    });
  };

  const handleSaveEdit = async () => {
    if (!editLesson) return;
    setEditSaving(true);
    try {
      await api.admin.updateLesson(editLesson.id, editForm);
      showToast('Lesson updated');
      setLessons((prev) => prev.map((l) => l.id === editLesson.id ? { ...l, ...editForm } : l));
      setEditLesson(null);
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setEditSaving(false); }
  };

  const handlePublish = async (id) => {
    try {
      await api.admin.publishLesson(id);
      showToast('Lesson published!');
      loadLessons();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const handleAIGenerate = async () => {
    if (!aiForm.topic) return showToast('Enter a topic.', 'error');
    setAiLoading(true); setAiResult(null);
    try {
      const res = await api.admin.aiGenerate(aiForm);
      setAiResult(res);
    } catch (e) { showToast(e.message, 'error'); }
    setAiLoading(false);
  };

  const STATUS_COLOR = {
    draft:     'gray', cooldown: 'gold', published: 'green', archived: 'red',
  };

  if (loading) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <SectionHeader
        title="Lessons"
        subtitle={`${lessons.length} lessons`}
        action={
          <button onClick={() => setAiModal(true)}
            className="flex items-center gap-1.5 bg-reads-green text-white text-sm font-bold px-3 py-2 rounded-xl">
            <Sparkles size={14} /> AI Generate
          </button>
        }
      />
      <div className="space-y-2">
        {lessons.length === 0 ? (
          <EmptyState icon={BookOpen} title="No lessons yet" />
        ) : (
          lessons.map((l) => (
            <div key={l.id} className="reads-card px-4 py-3 mb-2">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-reads-navy text-sm truncate">{l.title}</p>
                  <p className="text-reads-muted text-xs">{l.subject} · {l.track?.toUpperCase()}</p>
                  <p className="text-reads-muted text-xs mt-0.5">
                    {new Date(l.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <Badge label={l.status?.toUpperCase()} variant={STATUS_COLOR[l.status] || 'gray'} />
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                <button onClick={() => handleEdit(l)}
                  className="flex items-center gap-1 text-reads-muted hover:text-reads-navy text-xs font-semibold px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <Edit2 size={12} /> Edit
                </button>
                {l.status === 'draft' && (
                  <button onClick={() => handlePublish(l.id)}
                    className="text-reads-green font-bold text-xs px-2 py-1 bg-reads-green-bg rounded-lg">
                    Publish
                  </button>
                )}
                {l.status === 'published' && (
                  <button onClick={() => handleToggleCooldown(l.id)}
                    className="text-amber-600 font-bold text-xs px-2 py-1 bg-amber-50 rounded-lg">
                    Cooldown
                  </button>
                )}
                {l.status === 'cooldown' && (
                  <button onClick={() => handleToggleCooldown(l.id)}
                    className="text-reads-green font-bold text-xs px-2 py-1 bg-reads-green-bg rounded-lg">
                    Go Live
                  </button>
                )}
                <button onClick={() => handleDeleteLesson(l.id)}
                  className="ml-auto flex items-center gap-1 text-reads-red text-xs font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Lesson Modal */}
      {editLesson && (
        <Modal title="Edit Lesson" onClose={() => setEditLesson(null)}>
          <div className="space-y-3">
            {editLesson.status === 'cooldown' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <p className="text-amber-700 text-xs font-semibold">⏱ Cooldown active — admin override enabled</p>
              </div>
            )}
            <div>
              <label className="reads-label">Title</label>
              <input className="reads-input" value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="reads-label">Subject</label>
              <input className="reads-input" value={editForm.subject}
                onChange={(e) => setEditForm((f) => ({ ...f, subject: e.target.value }))} />
            </div>
            <div>
              <label className="reads-label">Class</label>
              <input className="reads-input" value={editForm.class_name}
                onChange={(e) => setEditForm((f) => ({ ...f, class_name: e.target.value }))} />
            </div>
            <div>
              <label className="reads-label">Track</label>
              <select className="reads-input" value={editForm.track}
                onChange={(e) => setEditForm((f) => ({ ...f, track: e.target.value }))}>
                {['school', 'jamb', 'waec', 'neco', 'bece', 'ielts', 'sat'].map((t) => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="reads-label">Token Reward</label>
              <input className="reads-input" type="number" value={editForm.token_reward}
                onChange={(e) => setEditForm((f) => ({ ...f, token_reward: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_general" checked={editForm.is_general || false}
                onChange={(e) => setEditForm((f) => ({ ...f, is_general: e.target.checked, school_id: e.target.checked ? null : f.school_id }))} />
              <label htmlFor="is_general" className="reads-label mb-0">General lesson (visible to all students)</label>
            </div>
            {!editForm.is_general && (
              <div>
                <label className="reads-label">Scope to School <span className="text-reads-muted font-normal">(leave blank for all schools)</span></label>
                <select className="reads-input" value={editForm.school_id || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, school_id: e.target.value || null }))}>
                  <option value="">All Schools</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name} ({s.school_code})</option>)}
                </select>
              </div>
            )}

            {/* ── Quiz Configuration ── */}
            <div className="border-t border-gray-100 pt-4">
              <p className="font-black text-reads-navy text-sm mb-3">Quiz Configuration</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="reads-label">Pass Mark (%)</label>
                    <input className="reads-input" type="number" min="0" max="100"
                      value={editForm.quiz_pass_mark ?? 60}
                      onChange={(e) => setEditForm((f) => ({ ...f, quiz_pass_mark: parseInt(e.target.value) || 60 }))} />
                  </div>
                  <div>
                    <label className="reads-label">Perfect Score Bonus</label>
                    <input className="reads-input" type="number" min="0"
                      value={editForm.quiz_perfect_bonus ?? 0}
                      onChange={(e) => setEditForm((f) => ({ ...f, quiz_perfect_bonus: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="reads-label">Time Limit (secs)</label>
                    <input className="reads-input" type="number" min="0"
                      placeholder="No limit"
                      value={editForm.quiz_time_limit_secs ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, quiz_time_limit_secs: e.target.value ? parseInt(e.target.value) : null }))} />
                  </div>
                  <div>
                    <label className="reads-label">Max Attempts</label>
                    <input className="reads-input" type="number" min="1"
                      placeholder="Unlimited"
                      value={editForm.quiz_max_attempts ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, quiz_max_attempts: e.target.value ? parseInt(e.target.value) : null }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="reads-label">Questions Per Attempt</label>
                    <input className="reads-input" type="number" min="1"
                      placeholder="All"
                      value={editForm.quiz_questions_per_attempt ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, quiz_questions_per_attempt: e.target.value ? parseInt(e.target.value) : null }))} />
                  </div>
                  <div>
                    <label className="reads-label">Min Read Time (secs)</label>
                    <input className="reads-input" type="number" min="0"
                      value={editForm.quiz_min_read_secs ?? 30}
                      onChange={(e) => setEditForm((f) => ({ ...f, quiz_min_read_secs: parseInt(e.target.value) || 30 }))} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="quiz_shuffle" checked={editForm.quiz_shuffle ?? true}
                    onChange={(e) => setEditForm((f) => ({ ...f, quiz_shuffle: e.target.checked }))} />
                  <label htmlFor="quiz_shuffle" className="reads-label mb-0">Shuffle questions & answers</label>
                </div>
              </div>
            </div>

            <div>
              <label className="reads-label">Content</label>
              <textarea className="reads-input" rows={6} value={editForm.content}
                onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))} />
            </div>
            <button onClick={handleSaveEdit} disabled={editSaving}
              className="reads-btn-primary w-full flex items-center justify-center gap-2">
              {editSaving && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </Modal>
      )}

      {/* AI Generate Modal */}
      {aiModal && (
        <Modal title="AI Lesson Generator" onClose={() => { setAiModal(false); setAiResult(null); }}>
          {aiResult ? (
            <div className="space-y-4">
              <div className="bg-reads-green-bg border border-reads-green/20 rounded-xl p-3">
                <p className="font-bold text-reads-navy text-sm">✅ Lesson Generated!</p>
                <p className="text-reads-muted text-xs mt-1">Review the lesson in your drafts.</p>
              </div>
              <p className="font-bold text-reads-navy text-sm">{aiResult.title}</p>
              <div className="max-h-40 overflow-y-auto text-reads-muted text-xs leading-relaxed rounded-xl bg-gray-50 p-3">
                {aiResult.content?.substring(0, 300)}…
              </div>
              <button onClick={() => { setAiModal(false); setAiResult(null); }} className="reads-btn-primary w-full">
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="reads-label">Topic</label>
                <input className="reads-input" placeholder="e.g. Newton's Laws of Motion"
                  value={aiForm.topic} onChange={(e) => setAiForm((f) => ({ ...f, topic: e.target.value }))} />
              </div>
              <div>
                <label className="reads-label">Subject</label>
                <input className="reads-input" placeholder="e.g. Physics"
                  value={aiForm.subject} onChange={(e) => setAiForm((f) => ({ ...f, subject: e.target.value }))} />
              </div>
              <div>
                <label className="reads-label">Class</label>
                <input className="reads-input" placeholder="e.g. SS2"
                  value={aiForm.class_name} onChange={(e) => setAiForm((f) => ({ ...f, class_name: e.target.value }))} />
              </div>
              <div>
                <label className="reads-label">Track</label>
                <select className="reads-input" value={aiForm.track}
                  onChange={(e) => setAiForm((f) => ({ ...f, track: e.target.value }))}>
                  {['school', 'jamb', 'waec', 'neco', 'bece', 'ielts', 'sat'].map((t) => (
                    <option key={t} value={t}>{t.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleAIGenerate} disabled={aiLoading}
                className="reads-btn-primary w-full flex items-center justify-center gap-2">
                {aiLoading ? <><Loader2 size={18} className="animate-spin" /> Generating…</> : <><Sparkles size={18} /> Generate Lesson</>}
              </button>
            </div>
          )}
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}



// ─────────────────────────────────────────────
// Quiz Manager Section
// ─────────────────────────────────────────────
function QuizSection() {
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qLoading, setQLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editQ, setEditQ] = useState(null);
  const [form, setForm] = useState({ question_text: '', options: ['', '', '', ''], correct_index: 0, explanation: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    api.admin.getLessons({ limit: 100 })
      .then((d) => setLessons(d?.lessons || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadQuestions = async (lesson) => {
    setSelectedLesson(lesson);
    setQLoading(true);
    try { const d = await api.admin.getQuestions(lesson.id); setQuestions(d?.questions || []); }
    catch { showToast('Failed to load questions', 'error'); }
    finally { setQLoading(false); }
  };

  const resetForm = () => setForm({ question_text: '', options: ['', '', '', ''], correct_index: 0, explanation: '' });

  const handleSave = async () => {
    if (!form.question_text || form.options.some(o => !o.trim())) return showToast('Fill all fields', 'error');
    setSaving(true);
    try {
      if (editQ) {
        await api.admin.updateQuestion(editQ.id, form);
        showToast('Question updated');
      } else {
        await api.admin.createQuestion(selectedLesson.id, form);
        showToast('Question added');
      }
      setShowForm(false); setEditQ(null); resetForm();
      loadQuestions(selectedLesson);
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return;
    try { await api.admin.deleteQuestion(id); showToast('Deleted'); loadQuestions(selectedLesson); }
    catch (e) { showToast(e.message || 'Failed', 'error'); }
  };

  const handleEdit = (q) => {
    setEditQ(q);
    setForm({ question_text: q.question_text, options: [...q.options], correct_index: q.correct_index, explanation: q.explanation || '' });
    setShowForm(true);
  };

  if (loading) return <LoadingOverlay />;

  if (selectedLesson) return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <button onClick={() => setSelectedLesson(null)} className="flex items-center gap-1 text-reads-muted text-sm mb-3">← Back</button>
      <SectionHeader title={selectedLesson.title} subtitle={`${questions.length} questions`}
        action={<button onClick={() => { setShowForm(true); setEditQ(null); resetForm(); }} className="flex items-center gap-1.5 bg-reads-green text-white text-xs font-bold px-3 py-2 rounded-xl"><Plus size={14} /> Add</button>} />

      {showForm && (
        <div className="reads-card px-4 py-4 mb-4 space-y-3 border-2 border-reads-green">
          <p className="font-bold text-reads-navy text-sm">{editQ ? 'Edit Question' : 'New Question'}</p>
          <div>
            <label className="reads-label">Question</label>
            <textarea className="reads-input" rows={3} value={form.question_text}
              onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))} />
          </div>
          {['A', 'B', 'C', 'D'].map((letter, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" checked={form.correct_index === i}
                onChange={() => setForm(f => ({ ...f, correct_index: i }))} />
              <input className="reads-input flex-1" placeholder={`Option ${letter}`}
                value={form.options[i]}
                onChange={e => { const opts = [...form.options]; opts[i] = e.target.value; setForm(f => ({ ...f, options: opts })); }} />
            </div>
          ))}
          <p className="text-reads-muted text-xs">Select the radio button next to the correct answer</p>
          <div>
            <label className="reads-label">Explanation (optional)</label>
            <textarea className="reads-input" rows={2} value={form.explanation}
              onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="reads-btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />} Save
            </button>
            <button onClick={() => { setShowForm(false); setEditQ(null); resetForm(); }} className="reads-card px-4 py-2 text-sm font-bold text-reads-muted">Cancel</button>
          </div>
        </div>
      )}

      {qLoading ? <LoadingOverlay /> : questions.length === 0 ? (
        <EmptyState icon={HelpCircle} title="No questions yet" description="Add quiz questions for this lesson." />
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={q.id} className="reads-card px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-reads-navy text-sm flex-1">Q{idx + 1}. {q.question_text}</p>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleEdit(q)} className="text-reads-muted hover:text-reads-navy"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(q.id)} className="text-reads-muted hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                {q.options.map((opt, i) => (
                  <p key={i} className={`text-xs px-2 py-1 rounded-lg ${i === q.correct_index ? 'bg-reads-green-bg text-reads-green font-bold' : 'text-reads-muted'}`}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </p>
                ))}
              </div>
              {q.explanation && <p className="text-reads-muted text-xs mt-2 italic">{q.explanation}</p>}
            </div>
          ))}
        </div>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <SectionHeader title="Quiz Manager" subtitle="Select a lesson to manage its questions" />
      <div className="space-y-2">
        {lessons.map(l => (
          <button key={l.id} onClick={() => loadQuestions(l)}
            className="w-full reads-card px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between">
            <div>
              <p className="font-bold text-reads-navy text-sm">{l.title}</p>
              <p className="text-reads-muted text-xs">{l.subject} · {l.track?.toUpperCase()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge label={l.status} variant={{ draft: 'gray', cooldown: 'gold', published: 'green' }[l.status] || 'gray'} />
              <HelpCircle size={16} className="text-reads-muted" />
            </div>
          </button>
        ))}
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// School Curriculum Section
// ─────────────────────────────────────────────
function SchoolCurriculumSection() {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [topics, setTopics] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filterClass, setFilterClass] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [cLoading, setCLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };

  // Admin view is read-only — schools manage their own curriculum

  useEffect(() => {
    api.admin.getSchools()
      .then(d => setSchools(d?.schools || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadCurriculum = async (school, classId = '', term = '') => {
    setSelectedSchool(school);
    setCLoading(true);
    try {
      const params = new URLSearchParams();
      if (classId) params.append('class_id', classId);
      if (term) params.append('term', term);
      const qs = params.toString();
      const d = await api.get(`/admin/schools/${school.id}/curriculum${qs ? `?${qs}` : ''}`);
      setTopics(d?.topics || []);
      setClasses(d?.classes || []);
    } catch { }
    finally { setCLoading(false); }
  };

  const handleDelete = null; // Admin is read-only for curriculum

  const toggle = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }));

  // Group flat topics → class → subject → topics
  const grouped = topics.reduce((acc, t) => {
    const cKey = t.class_id;
    if (!acc[cKey]) acc[cKey] = { class_id: cKey, class_name: t.class_name, subjects: {} };
    const sKey = t.subject_id;
    if (!acc[cKey].subjects[sKey]) acc[cKey].subjects[sKey] = { id: sKey, name: t.subject_name, topics: [] };
    acc[cKey].subjects[sKey].topics.push(t);
    return acc;
  }, {});
  const groupedList = Object.values(grouped).map(c => ({ ...c, subjects: Object.values(c.subjects) }));

  if (loading) return <LoadingOverlay />;

  if (selectedSchool) return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <button onClick={() => { setSelectedSchool(null); setTopics([]); setFilterClass(''); setFilterTerm(''); }}
        className="flex items-center gap-1 text-reads-muted text-sm mb-3">← Back</button>
      <SectionHeader title={selectedSchool.name} subtitle="Curriculum" />

      {/* Filters */}
      <div className="flex gap-2 mb-3">
        <select className="reads-input flex-1 text-sm"
          value={filterClass} onChange={e => { setFilterClass(e.target.value); loadCurriculum(selectedSchool, e.target.value, filterTerm); }}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="reads-input w-28 text-sm"
          value={filterTerm} onChange={e => { setFilterTerm(e.target.value); loadCurriculum(selectedSchool, filterClass, e.target.value); }}>
          <option value="">All Terms</option>
          <option value="1">Term 1</option>
          <option value="2">Term 2</option>
          <option value="3">Term 3</option>
        </select>
      </div>

      {cLoading ? <LoadingOverlay /> : groupedList.length === 0 ? (
        <EmptyState icon={FileText} title="No curriculum yet" description="This school hasn't added any curriculum topics." />
      ) : (
        <div className="space-y-3">
          {groupedList.map(cls => (
            <div key={cls.class_id} className="reads-card overflow-hidden">
              <button onClick={() => toggle(cls.class_id)}
                className="w-full px-4 py-3 flex items-center justify-between">
                <p className="font-bold text-reads-navy text-sm">{cls.class_name}</p>
                <span className="text-reads-muted text-xs">{cls.subjects.length} subject{cls.subjects.length !== 1 ? 's' : ''}</span>
              </button>
              {expanded[cls.class_id] && (
                <div className="border-t border-gray-100 divide-y divide-gray-100">
                  {cls.subjects.map(subj => (
                    <div key={subj.id}>
                      <button onClick={() => toggle(subj.id)}
                        className="w-full px-4 py-2 flex items-center justify-between bg-gray-50">
                        <p className="font-semibold text-reads-navy text-xs">{subj.name}</p>
                        <span className="text-reads-muted text-xs">{subj.topics.length} topic{subj.topics.length !== 1 ? 's' : ''}</span>
                      </button>
                      {expanded[subj.id] && (
                        <div className="px-4 py-2 space-y-1">
                          {subj.topics.map(t => (
                            <div key={t.id} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
                              <span className="text-[10px] bg-reads-green-bg text-reads-green px-1.5 py-0.5 rounded font-bold flex-shrink-0 mt-0.5">
                                T{t.term}{t.week ? ` W${t.week}` : ''}
                              </span>
                              <div className="min-w-0">
                                <p className="text-reads-navy text-xs font-semibold">{t.topic}</p>
                                {t.subtopic && <p className="text-reads-muted text-[10px]">{t.subtopic}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold bg-reads-navy text-white animate-fade-in">
          {toastMsg}
        </div>
      )}
    </div>
  );

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <SectionHeader title="School Curricula" subtitle="View uploaded curriculum by school" />
      {schools.length === 0 ? (
        <EmptyState icon={School} title="No schools yet" />
      ) : (
        <div className="space-y-2">
          {schools.map(s => (
            <button key={s.id} onClick={() => loadCurriculum(s)}
              className="w-full reads-card px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between">
              <div>
                <p className="font-bold text-reads-navy text-sm">{s.name}</p>
                <p className="text-reads-muted text-xs">{s.school_code}</p>
              </div>
              <FileText size={16} className="text-reads-muted" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────
// Exam Management Section
// ─────────────────────────────────────────────


// ── Tournaments Section ───────────────────────────────────────────────────────
function TournamentsSection() {
  const [tournaments, setTournaments] = useState([]);
  const [flags, setFlags]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState('list'); // list | create | flags | standings
  const [selected, setSelected]     = useState(null);
  const [standings, setStandings]   = useState([]);
  const [toast, setToast]           = useState(null);
  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const [form, setForm] = useState({
    name: '', stage: 'school', age_category: 'open', subject: '',
    questions_per_round: 10, time_per_question: 30, points_per_correct: 5,
    prize_tokens: 0, prize_2nd: 0, prize_3rd: 0,
    duration_days: 14, start_date: '', end_date: '', school_id: '', state: '',
  });

  const load = () => {
    setLoading(true);
    Promise.all([api.tournament.adminList(), api.tournament.adminFlags()])
      .then(([td, fd]) => { setTournaments(td?.tournaments || []); setFlags(fd?.flags || []); })
      .catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); },[]);

  const handleCreate = async () => {
    try {
      await api.tournament.adminCreate({
        ...form,
        questions_per_round: parseInt(form.questions_per_round),
        time_per_question: parseInt(form.time_per_question),
        points_per_correct: parseInt(form.points_per_correct),
        prize_tokens: parseInt(form.prize_tokens),
        prize_2nd: parseInt(form.prize_2nd),
        prize_3rd: parseInt(form.prize_3rd),
        duration_days: parseInt(form.duration_days),
        school_id: form.school_id || null,
        state: form.state || null,
      });
      showToast('Tournament created!');
      setView('list');
      load();
    } catch(e) { showToast(e.message, 'error'); }
  };

  const handleStatus = async (id, status) => {
    try {
      await api.tournament.adminSetStatus(id, status);
      showToast(`Tournament ${status}`);
      load();
    } catch(e) { showToast(e.message, 'error'); }
  };

  const handleAdvance = async (id) => {
    try {
      const res = await api.tournament.adminAdvanceTop3(id);
      showToast(res.message);
    } catch(e) { showToast(e.message, 'error'); }
  };

  const handleViewStandings = async (t) => {
    setSelected(t);
    const d = await api.tournament.adminStandings(t.id).catch(()=>({standings:[]}));
    setStandings(d.standings || []);
    setView('standings');
  };

  const handleReviewFlag = async (id, decision) => {
    try {
      await api.tournament.adminReviewFlag(id, decision);
      showToast(`Flag marked ${decision}`);
      load();
    } catch(e) { showToast(e.message, 'error'); }
  };

  const STAGE_COLOR = { school:'bg-green-100 text-reads-green', state:'bg-blue-100 text-blue-700', national:'bg-purple-100 text-purple-700', global:'bg-amber-100 text-amber-700' };
  const STATUS_COLOR = { upcoming:'bg-gray-100 text-gray-600', active:'bg-green-100 text-reads-green', completed:'bg-blue-100 text-blue-700' };
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  if (view === 'standings' && selected) return (
    <div className="space-y-3">
      <button onClick={()=>setView('list')} className="text-reads-muted text-sm">← Back</button>
      <SectionHeader title={selected.name} subtitle="Standings" />
      <button onClick={()=>handleAdvance(selected.id)} className="reads-btn-primary w-full">Advance Top 3 to Next Stage</button>
      {standings.map((s,i) => (
        <div key={s.user_id} className="reads-card p-3 flex items-center gap-3">
          <span className="font-black text-reads-navy w-6 text-center">{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-reads-navy text-sm truncate">{s.full_name}</p>
            <p className="text-reads-muted text-xs">{s.school || 'Unaffiliated'} · {s.state || '—'}</p>
          </div>
          <div className="text-right">
            <p className="font-black text-reads-navy text-sm">{s.total_points} pts</p>
            <p className="text-reads-muted text-xs">{s.quizzes_taken} rounds</p>
            {s.is_disqualified && <span className="text-reads-red text-[10px] font-bold">DQ</span>}
          </div>
        </div>
      ))}
    </div>
  );

  if (view === 'flags') return (
    <div className="space-y-3">
      <button onClick={()=>setView('list')} className="text-reads-muted text-sm">← Back</button>
      <SectionHeader title="Cheat Flags" subtitle={`${flags.filter(f=>f.status==='pending').length} pending`} />
      {flags.length === 0 ? <EmptyState icon={Shield} title="No flags" description="All clear." />
      : flags.map(f => (
        <div key={f.id} className="reads-card p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-bold text-reads-navy text-sm">{f.user_name}</p>
              <p className="text-reads-muted text-xs">{f.tournament_name}</p>
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-1 rounded-full capitalize">{f.flag_type.replace('_',' ')}</span>
          </div>
          <p className="text-reads-muted text-xs mb-2">Total flags: {f.total_flags} · Tab: {f.flag_data?.tab_switches||0} · Copy: {f.flag_data?.copy_attempts||0}</p>
          {f.status === 'pending' && (
            <div className="flex gap-2">
              <button onClick={()=>handleReviewFlag(f.id,'guilty')} className="flex-1 text-white text-xs font-bold py-2 rounded-xl bg-reads-red">Guilty</button>
              <button onClick={()=>handleReviewFlag(f.id,'cleared')} className="flex-1 reads-btn-outline text-xs py-2">Clear</button>
            </div>
          )}
          {f.status !== 'pending' && <p className={`text-xs font-bold capitalize ${f.status==='guilty'?'text-reads-red':'text-reads-green'}`}>{f.status}</p>}
        </div>
      ))}
    </div>
  );

  if (view === 'create') return (
    <div className="space-y-4">
      <button onClick={()=>setView('list')} className="text-reads-muted text-sm">← Back</button>
      <SectionHeader title="Create Tournament" subtitle="Set up a new challenge" />
      <div><label className="reads-label">Name</label><input className="reads-input" value={form.name} onChange={set('name')} placeholder="e.g. JSS1 Mathematics Challenge Q1" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="reads-label">Stage</label>
          <select className="reads-input" value={form.stage} onChange={set('stage')}>
            {['school','state','national','global'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="reads-label">Age Category</label>
          <select className="reads-input" value={form.age_category} onChange={set('age_category')}>
            {['u15','u17','u21','open'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div><label className="reads-label">Subject</label><input className="reads-input" value={form.subject} onChange={set('subject')} placeholder="e.g. Mathematics" /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="reads-label">Questions</label><input className="reads-input" type="number" value={form.questions_per_round} onChange={set('questions_per_round')} /></div>
        <div><label className="reads-label">Secs/Q</label><input className="reads-input" type="number" value={form.time_per_question} onChange={set('time_per_question')} /></div>
        <div><label className="reads-label">Pts/Correct</label><input className="reads-input" type="number" value={form.points_per_correct} onChange={set('points_per_correct')} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="reads-label">🥇 Prize</label><input className="reads-input" type="number" value={form.prize_tokens} onChange={set('prize_tokens')} /></div>
        <div><label className="reads-label">🥈 Prize</label><input className="reads-input" type="number" value={form.prize_2nd} onChange={set('prize_2nd')} /></div>
        <div><label className="reads-label">🥉 Prize</label><input className="reads-input" type="number" value={form.prize_3rd} onChange={set('prize_3rd')} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="reads-label">Start Date</label><input className="reads-input" type="datetime-local" value={form.start_date} onChange={set('start_date')} /></div>
        <div><label className="reads-label">End Date</label><input className="reads-input" type="datetime-local" value={form.end_date} onChange={set('end_date')} /></div>
      </div>
      <div><label className="reads-label">Scope to School (optional)</label><input className="reads-input" value={form.school_id} onChange={set('school_id')} placeholder="School UUID or leave blank" /></div>
      <div><label className="reads-label">Scope to State (optional)</label><input className="reads-input" value={form.state} onChange={set('state')} placeholder="e.g. Rivers State" /></div>
      <button onClick={handleCreate} className="reads-btn-primary w-full">Create Tournament</button>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="Tournaments" subtitle={`${tournaments.length} total`} />
        <div className="flex gap-2">
          <button onClick={()=>setView('flags')}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl ${flags.filter(f=>f.status==='pending').length > 0 ? 'bg-reads-red text-white' : 'bg-gray-100 text-reads-muted'}`}>
            🚩 {flags.filter(f=>f.status==='pending').length} Flags
          </button>
          <button onClick={()=>setView('create')} className="reads-btn-primary text-xs px-3 py-1.5">+ New</button>
        </div>
      </div>

      {loading ? <LoadingOverlay /> : tournaments.length === 0 ? (
        <EmptyState icon={Trophy} title="No tournaments" description="Create your first tournament." />
      ) : tournaments.map(t => (
        <div key={t.id} className="reads-card p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-bold text-reads-navy text-sm">{t.name}</p>
              <div className="flex gap-1.5 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STAGE_COLOR[t.stage]||''}`}>{t.stage}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLOR[t.status]||''}`}>{t.status}</span>
                {t.subject && <span className="text-[10px] font-semibold text-reads-muted bg-gray-100 px-2 py-0.5 rounded-full">{t.subject}</span>}
              </div>
            </div>
            <span className="text-reads-muted text-xs">{t.participants} participants</span>
          </div>
          <div className="flex gap-1 text-[10px] text-reads-muted mb-3">
            <span>{t.questions_per_round}Q · {t.time_per_question}s · {t.points_per_correct||5}pts</span>
            <span className="ml-2">🥇{t.prize_tokens} 🥈{t.prize_2nd} 🥉{t.prize_3rd}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={()=>handleViewStandings(t)} className="text-xs font-bold px-3 py-1.5 bg-gray-100 text-reads-navy rounded-lg">Standings</button>
            {t.status === 'upcoming' && <button onClick={()=>handleStatus(t.id,'active')} className="text-xs font-bold px-3 py-1.5 bg-reads-green text-white rounded-lg">Activate</button>}
            {t.status === 'active'   && <button onClick={()=>handleStatus(t.id,'completed')} className="text-xs font-bold px-3 py-1.5 bg-reads-navy text-white rounded-lg">End & Award</button>}
          </div>
        </div>
      ))}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}

// ── Disputes Section ──────────────────────────────────────────────────────────
function DisputesSection() {
  const [disputes, setDisputes]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [note, setNote]           = useState('');
  const [toast, setToast]         = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = () => {
    setLoading(true);
    api.admin.getDisputes()
      .then(d => setDisputes(d?.disputes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleReview = async (id, decision) => {
    try {
      const res = await api.admin.reviewDispute(id, { decision, admin_note: note });
      showToast(res.message);
      setReviewing(null);
      setNote('');
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const STATUS_STYLE = {
    pending:  { bg: 'bg-amber-50',  text: 'text-amber-600',  label: 'Pending'  },
    approved: { bg: 'bg-green-100', text: 'text-reads-green',label: 'Approved' },
    rejected: { bg: 'bg-gray-100',  text: 'text-gray-500',   label: 'Rejected' },
  };

  if (loading) return <LoadingOverlay message="Loading disputes…" />;

  return (
    <div className="space-y-3">
      <SectionHeader title="Session Disputes" subtitle={`${disputes.filter(d => d.status === 'pending').length} pending review`} />

      {disputes.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No disputes" description="All sessions are running smoothly." />
      ) : disputes.map(d => {
        const st = STATUS_STYLE[d.status] || STATUS_STYLE.pending;
        const isExpanded = expanded === d.id;
        return (
          <div key={d.id} className="reads-card p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-reads-navy text-sm">{d.subject}</p>
                <p className="text-reads-muted text-xs">{d.student_name} vs {d.tutor_name}</p>
                <p className="text-reads-muted text-xs mt-0.5">
                  {new Date(d.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${st.bg} ${st.text}`}>
                {st.label}
              </span>
            </div>

            {/* Reason */}
            <div className="bg-red-50 rounded-xl p-3 mb-3">
              <p className="text-reads-red text-xs font-semibold mb-1">Student's Reason:</p>
              <p className="text-reads-navy text-xs">{d.reason}</p>
            </div>

            {/* Cost */}
            <p className="text-reads-muted text-xs mb-2">
              Session value: <span className="font-bold text-reads-gold">{d.cost_tokens} $READS</span>
            </p>

            {/* Chat history toggle */}
            <button onClick={() => setExpanded(isExpanded ? null : d.id)}
              className="text-reads-green text-xs font-bold mb-3 flex items-center gap-1">
              {isExpanded ? '▲' : '▼'} {d.chat_history?.length || 0} chat messages
            </button>

            {isExpanded && d.chat_history?.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 mb-3 max-h-48 overflow-y-auto space-y-2">
                {d.chat_history.map((m, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-bold text-reads-navy">{m.sender}: </span>
                    <span className="text-reads-muted">{m.content}</span>
                    <span className="text-gray-400 ml-1">
                      {new Date(m.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {isExpanded && (!d.chat_history || d.chat_history.length === 0) && (
              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                <p className="text-reads-muted text-xs text-center">No chat messages in this session.</p>
              </div>
            )}

            {/* Admin note if already reviewed */}
            {d.admin_note && (
              <div className="bg-blue-50 rounded-xl p-3 mb-3">
                <p className="text-reads-navy text-xs font-semibold mb-1">Admin Note:</p>
                <p className="text-reads-muted text-xs">{d.admin_note}</p>
              </div>
            )}

            {/* Review actions */}
            {d.status === 'pending' && (
              reviewing === d.id ? (
                <div className="space-y-3 border-t border-gray-100 pt-3">
                  <textarea className="reads-input resize-none" rows={2}
                    placeholder="Optional admin note…"
                    value={note} onChange={e => setNote(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={() => handleReview(d.id, 'approve')}
                      className="flex-1 reads-btn-primary text-sm py-2 flex items-center justify-center gap-1">
                      <CheckCircle size={14} /> Pay Tutor
                    </button>
                    <button onClick={() => handleReview(d.id, 'reject')}
                      className="flex-1 text-white text-sm font-bold py-2 rounded-xl bg-reads-red flex items-center justify-center gap-1">
                      <XCircle size={14} /> Refund Student
                    </button>
                  </div>
                  <button onClick={() => { setReviewing(null); setNote(''); }}
                    className="w-full text-reads-muted text-xs text-center">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setReviewing(d.id)}
                  className="w-full reads-btn-primary text-sm py-2">
                  Review Dispute
                </button>
              )
            )}
          </div>
        );
      })}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function ExamSection() {
  const [tab, setTab] = useState("windows");
  const [windows, setWindows] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    exam_type: "JAMB", subject: "", centre_name: "", centre_address: "",
    exam_date: "", duration_minutes: 180, total_slots: 50, fee_tokens: 100,
  });
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("proof_uploaded");
  const [toast, setToast] = useState(null);
  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const loadWindows = () => {
    api.admin.getExamWindows()
      .then(d => setWindows(d?.windows || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadRegistrations = (status) => {
    api.admin.getExamRegistrations({ status })
      .then(d => setRegistrations(d?.registrations || []))
      .catch(() => {});
  };

  useEffect(() => { loadWindows(); }, []);
  useEffect(() => { if (tab === "registrations") loadRegistrations(statusFilter); }, [tab, statusFilter]);

  const handleCreate = async () => {
    if (!form.centre_name || !form.exam_date) return showToast("Fill required fields", "error");
    setSaving(true);
    try {
      await api.admin.createExamWindow(form);
      showToast("Exam window created");
      setShowCreate(false);
      setForm({ exam_type: "JAMB", subject: "", centre_name: "", centre_address: "",
        exam_date: "", duration_minutes: 180, total_slots: 50, fee_tokens: 100 });
      loadWindows();
    } catch (e) { showToast(e.message || "Failed", "error"); }
    finally { setSaving(false); }
  };

  const handleVerify = async (id, approved) => {
    try {
      await api.admin.verifyExamProof(id, { approved });
      showToast(approved ? "Proof approved" : "Registration cancelled");
      loadRegistrations(statusFilter);
    } catch (e) { showToast(e.message || "Failed", "error"); }
  };

  const handleReleaseEscrow = async (id) => {
    if (!confirm("Release escrow to CBT centre?")) return;
    try {
      await api.admin.releaseExamEscrow(id);
      showToast("Escrow released");
      loadRegistrations(statusFilter);
    } catch (e) { showToast(e.message || "Failed", "error"); }
  };

  const EXAM_TYPES = ["JAMB","WAEC","NECO","BECE","IELTS","SAT"];

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <div className="flex gap-2 mb-4">
        {[["windows","Exam Windows"],["registrations","Registrations"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`text-xs font-bold px-3 py-2 rounded-xl transition-colors ${tab===k ? "bg-reads-navy text-white" : "bg-gray-100 text-reads-muted"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "windows" && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="font-black text-reads-navy text-sm">{windows.length} exam windows</p>
            <button onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-1.5 bg-reads-green text-white text-xs font-bold px-3 py-2 rounded-xl">
              <Plus size={14} /> Create Window
            </button>
          </div>

          {showCreate && (
            <div className="reads-card px-4 py-4 mb-4 space-y-3 border-2 border-reads-green">
              <p className="font-bold text-reads-navy text-sm">New Exam Window</p>
              <div>
                <label className="reads-label">Exam Type</label>
                <select className="reads-input" value={form.exam_type}
                  onChange={e => setForm(f=>({...f,exam_type:e.target.value}))}>
                  {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="reads-label">Subject (optional)</label>
                <input className="reads-input" placeholder="e.g. Mathematics" value={form.subject}
                  onChange={e => setForm(f=>({...f,subject:e.target.value}))} />
              </div>
              <div>
                <label className="reads-label">Centre Name *</label>
                <input className="reads-input" placeholder="CBT Centre name" value={form.centre_name}
                  onChange={e => setForm(f=>({...f,centre_name:e.target.value}))} />
              </div>
              <div>
                <label className="reads-label">Centre Address</label>
                <input className="reads-input" placeholder="Full address" value={form.centre_address}
                  onChange={e => setForm(f=>({...f,centre_address:e.target.value}))} />
              </div>
              <div>
                <label className="reads-label">Exam Date & Time *</label>
                <input className="reads-input" type="datetime-local" value={form.exam_date}
                  onChange={e => setForm(f=>({...f,exam_date:e.target.value}))} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="reads-label">Duration (min)</label>
                  <input className="reads-input" type="number" value={form.duration_minutes}
                    onChange={e => setForm(f=>({...f,duration_minutes:parseInt(e.target.value)}))} />
                </div>
                <div>
                  <label className="reads-label">Total Slots</label>
                  <input className="reads-input" type="number" value={form.total_slots}
                    onChange={e => setForm(f=>({...f,total_slots:parseInt(e.target.value)}))} />
                </div>
                <div>
                  <label className="reads-label">Fee (tokens)</label>
                  <input className="reads-input" type="number" value={form.fee_tokens}
                    onChange={e => setForm(f=>({...f,fee_tokens:parseInt(e.target.value)}))} />
                </div>
              </div>
              <button onClick={handleCreate} disabled={saving}
                className="reads-btn-primary w-full flex items-center justify-center gap-2">
                {saving && <Loader2 size={16} className="animate-spin" />} Create Exam Window
              </button>
            </div>
          )}

          {loading ? <LoadingOverlay /> : windows.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No exam windows" description="Create an exam window to get started." />
          ) : (
            <div className="space-y-2">
              {windows.map(w => (
                <div key={w.id} className="reads-card px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-reads-navy text-sm">{w.exam_type} {w.subject ? `— ${w.subject}` : ""}</p>
                      <p className="text-reads-muted text-xs">{w.centre_name}</p>
                      <p className="text-reads-muted text-xs">{new Date(w.exam_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-reads-navy font-bold text-xs">{w.available_slots}/{w.total_slots} slots</p>
                      <Badge label={w.status} variant={w.status==="open"?"green":"gray"} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "registrations" && (
        <>
          <div className="flex gap-2 mb-3 flex-wrap">
            {["proof_uploaded","registered","verified","cancelled"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl capitalize ${statusFilter===s?"bg-reads-navy text-white":"bg-gray-100 text-reads-muted"}`}>
                {s.replace(/_/g," ")}
              </button>
            ))}
          </div>
          {registrations.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No registrations" description={`No ${statusFilter.replace(/_/g," ")} registrations.`} />
          ) : (
            <div className="space-y-3">
              {registrations.map(r => (
                <div key={r.id} className="reads-card px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-bold text-reads-navy text-sm">{r.student_name}</p>
                      <p className="text-reads-muted text-xs">{r.exam_type} · Seat: {r.seat_number}</p>
                      <p className="text-reads-muted text-xs">{r.exam_date ? new Date(r.exam_date).toLocaleDateString() : ""}</p>
                    </div>
                    <Badge label={r.status.replace(/_/g," ")} variant={r.status==="verified"?"green":r.status==="proof_uploaded"?"gold":"gray"} />
                  </div>
                  {r.proof_url && (
                    <a href={r.proof_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-reads-green font-bold flex items-center gap-1 mb-2">
                      <Eye size={12} /> View Proof
                    </a>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {r.status === "proof_uploaded" && (
                      <>
                        <button onClick={() => handleVerify(r.id, true)}
                          className="text-xs font-bold bg-reads-green text-white px-3 py-1.5 rounded-xl flex items-center gap-1">
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button onClick={() => handleVerify(r.id, false)}
                          className="text-xs font-bold bg-red-500 text-white px-3 py-1.5 rounded-xl flex items-center gap-1">
                          <XCircle size={12} /> Reject
                        </button>
                      </>
                    )}
                    {r.status === "verified" && (
                      <button onClick={() => handleReleaseEscrow(r.id)}
                        className="text-xs font-bold bg-reads-gold text-reads-navy px-3 py-1.5 rounded-xl">
                        Release Escrow
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}


// ─────────────────────────────────────────────
// Tournament Section
// ─────────────────────────────────────────────
function TournamentSection() {
  const [tab, setTab] = useState("tournaments");
  const [tournaments, setTournaments] = useState([]);
  const [flags, setFlags] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [lbType, setLbType] = useState("unaffiliated");
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [form, setForm] = useState({
    name: "", stage: "school", age_category: "u17",
    duration_days: 14, start_date: "", school_id: "", state: ""
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const loadTournaments = () => {
    api.tournament.adminList()
      .then(d => setTournaments(d?.tournaments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadFlags = () => {
    api.admin.getCheatFlags({ status: "pending" })
      .then(d => setFlags(d?.flags || []))
      .catch(() => {});
  };

  const loadLeaderboard = async () => {
    try {
      const params = lbType === "unaffiliated"
        ? { unaffiliated: true }
        : { school_id: selectedSchool };
      if (lbType === "school" && !selectedSchool) return;
      const d = await api.admin.getTournamentLeaderboard(params);
      setLeaderboard(d?.users || []);
    } catch (e) { showToast("Failed to load leaderboard", "error"); }
  };

  useEffect(() => {
    loadTournaments();
    loadFlags();
    api.admin.getSchools().then(d => setSchools(d?.schools || [])).catch(() => {});
  }, []);

  useEffect(() => { loadLeaderboard(); }, [lbType, selectedSchool]);

  const toggleUser = (user) => {
    setSelectedUsers(prev =>
      prev.find(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (!form.name || selectedUsers.length === 0) return showToast("Fill name and select participants", "error");
    setSaving(true);
    try {
      const res = await api.tournament.adminCreate({
        ...form,
        participant_ids: selectedUsers.map(u => u.id),
      });
      showToast(res.message || "Tournament created!");
      setShowCreate(false);
      setSelectedUsers([]);
      loadTournaments();
    } catch (e) { showToast(e.message || "Failed", "error"); }
    finally { setSaving(false); }
  };

  const handleReviewFlag = async (id, verdict) => {
    try {
      await api.admin.reviewCheatFlag(id, { verdict });
      showToast(`Flag marked as ${verdict}`);
      loadFlags();
    } catch (e) { showToast(e.message || "Failed", "error"); }
  };

  const viewStandings = async (t) => {
    setSelectedTournament(t);
    try {
      const d = await api.admin.getTournamentStandings(t.id);
      setStandings(d?.standings || []);
    } catch { showToast("Failed to load standings", "error"); }
  };

  const handleQualifyTop3 = async () => {
    if (!confirm("Qualify top 3 and close this tournament?")) return;
    try {
      const res = await api.admin.qualifyTop3(selectedTournament.id);
      showToast(res.message || "Done");
      setSelectedTournament(null);
      loadTournaments();
    } catch (e) { showToast(e.message || "Failed", "error"); }
  };

  const STAGES = ["school","state","national","global"];
  const CATEGORIES = ["u15","u17","u21","open"];
  const stageColor = { school:"green", state:"gold", national:"navy", global:"red" };

  if (selectedTournament) return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <button onClick={() => setSelectedTournament(null)} className="flex items-center gap-1 text-reads-muted text-sm mb-3">← Back</button>
      <SectionHeader title={selectedTournament.name} subtitle={`${selectedTournament.stage} · ${selectedTournament.age_category?.toUpperCase()}`} />
      <div className="space-y-2 mb-4">
        {standings.map(s => (
          <div key={s.participant_id} className={`reads-card px-4 py-3 flex items-center gap-3 ${s.rank<=3 ? 'border-l-4 border-reads-gold':''}`}>
            <span className={`font-black text-lg w-8 text-center ${s.rank===1?'text-reads-gold':s.rank===2?'text-gray-400':s.rank===3?'text-amber-700':'text-reads-muted'}`}>
              {s.rank <= 3 ? ["🥇","🥈","🥉"][s.rank-1] : s.rank}
            </span>
            <div className="flex-1">
              <p className="font-bold text-reads-navy text-sm">{s.full_name}</p>
              <p className="text-reads-muted text-xs">{s.quizzes_taken} quizzes · {Math.floor(s.total_time_secs/60)}m total</p>
            </div>
            <div className="text-right">
              <p className="font-black text-reads-navy">{s.total_points}pts</p>
              {s.cheat_flags > 0 && <p className="text-red-500 text-[10px]">⚠ {s.cheat_flags} flags</p>}
              {s.qualified_next && <p className="text-reads-green text-[10px] font-bold">✓ Qualified</p>}
            </div>
          </div>
        ))}
      </div>
      {selectedTournament.status === "active" && (
        <button onClick={handleQualifyTop3} className="w-full bg-reads-gold text-reads-navy font-bold py-3 rounded-xl">
          🏆 Qualify Top 3 & Close Tournament
        </button>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <div className="flex gap-2 mb-4 flex-wrap">
        {[["tournaments","Tournaments"],["create","Create"],["flags",`Flags${flags.length>0?` (${flags.length})`:""}`]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`text-xs font-bold px-3 py-2 rounded-xl ${tab===k?"bg-reads-navy text-white":"bg-gray-100 text-reads-muted"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === "tournaments" && (
        <>
          {loading ? <LoadingOverlay /> : tournaments.length === 0 ? (
            <EmptyState icon={Trophy} title="No tournaments yet" description="Create the first Smart User Challenge." />
          ) : (
            <div className="space-y-2">
              {tournaments.map(t => (
                <button key={t.id} onClick={() => viewStandings(t)}
                  className="w-full reads-card px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-reads-navy text-sm">{t.name}</p>
                      <p className="text-reads-muted text-xs">{t.stage} · {t.age_category?.toUpperCase()} · {t.participant_count} participants</p>
                    </div>
                    <Badge label={t.status} variant={t.status==="active"?"green":"gray"} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "create" && (
        <div className="space-y-4">
          <p className="font-black text-reads-navy text-sm">New Tournament</p>
          <div className="reads-card px-4 py-4 space-y-3">
            <div>
              <label className="reads-label">Tournament Name</label>
              <input className="reads-input" placeholder="e.g. Matro School Challenge Q2 2025"
                value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="reads-label">Stage</label>
                <select className="reads-input" value={form.stage}
                  onChange={e => setForm(f=>({...f,stage:e.target.value}))}>
                  {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="reads-label">Age Category</label>
                <select className="reads-input" value={form.age_category}
                  onChange={e => setForm(f=>({...f,age_category:e.target.value}))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="reads-label">Duration (days)</label>
                <input className="reads-input" type="number" value={form.duration_days}
                  onChange={e => setForm(f=>({...f,duration_days:parseInt(e.target.value)}))} />
              </div>
              <div>
                <label className="reads-label">Start Date</label>
                <input className="reads-input" type="date" value={form.start_date}
                  onChange={e => setForm(f=>({...f,start_date:e.target.value}))} />
              </div>
            </div>
          </div>

          {/* Leaderboard to pick participants */}
          <div className="reads-card px-4 py-4 space-y-3">
            <p className="font-bold text-reads-navy text-sm">Select Participants</p>
            <div className="flex gap-2">
              <button onClick={() => setLbType("unaffiliated")}
                className={`text-xs font-bold px-3 py-2 rounded-xl ${lbType==="unaffiliated"?"bg-reads-navy text-white":"bg-gray-100 text-reads-muted"}`}>
                Unaffiliated Top 10
              </button>
              <button onClick={() => setLbType("school")}
                className={`text-xs font-bold px-3 py-2 rounded-xl ${lbType==="school"?"bg-reads-navy text-white":"bg-gray-100 text-reads-muted"}`}>
                School Top 10
              </button>
            </div>
            {lbType === "school" && (
              <select className="reads-input" value={selectedSchool}
                onChange={e => setSelectedSchool(e.target.value)}>
                <option value="">— Select school —</option>
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {leaderboard.map((u, i) => {
                const selected = selectedUsers.find(s => s.id === u.id);
                return (
                  <button key={u.id} onClick={() => toggleUser(u)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border-2 transition-colors ${selected?"border-reads-green bg-reads-green-bg":"border-gray-100 bg-white"}`}>
                    <span className="font-black text-reads-muted w-6 text-sm">#{i+1}</span>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-reads-navy text-sm">{u.full_name}</p>
                      <p className="text-reads-muted text-xs">{u.lessons_completed} lessons · {u.quizzes_taken} quizzes</p>
                    </div>
                    {selected && <CheckCircle size={16} className="text-reads-green flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
            {selectedUsers.length > 0 && (
              <p className="text-reads-green text-xs font-bold">{selectedUsers.length} participants selected</p>
            )}
          </div>

          <button onClick={handleCreate} disabled={saving || !form.name || selectedUsers.length === 0}
            className="reads-btn-primary w-full flex items-center justify-center gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            🏆 Launch Tournament & Send Invites
          </button>
        </div>
      )}

      {tab === "flags" && (
        <>
          {flags.length === 0 ? (
            <EmptyState icon={Flag} title="No pending flags" description="Anti-cheat flags will appear here for review." />
          ) : (
            <div className="space-y-3">
              {flags.map(f => (
                <div key={f.id} className="reads-card px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-bold text-reads-navy text-sm">{f.full_name}</p>
                      <p className="text-reads-muted text-xs capitalize">{f.flag_type?.replace(/_/g," ")}</p>
                      <p className="text-reads-muted text-xs">{new Date(f.created_at).toLocaleString()}</p>
                    </div>
                    <span className="text-[10px] bg-amber-50 text-amber-600 font-bold px-2 py-1 rounded-full">Pending</span>
                  </div>
                  {f.flag_data?.screenshot && (
                    <img src={f.flag_data.screenshot} alt="flag" className="w-full h-24 object-cover rounded-xl mb-2" />
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => handleReviewFlag(f.id, "guilty")}
                      className="flex-1 text-xs font-bold bg-red-500 text-white py-2 rounded-xl flex items-center justify-center gap-1">
                      <XCircle size={13} /> Guilty
                    </button>
                    <button onClick={() => handleReviewFlag(f.id, "cleared")}
                      className="flex-1 text-xs font-bold bg-reads-green text-white py-2 rounded-xl flex items-center justify-center gap-1">
                      <CheckCircle size={13} /> Clear
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// Audit Log Section
// ─────────────────────────────────────────────
function AuditLogSection() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getAuditLog({ limit: 50 })
      .then((d) => setLogs(d?.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const actionColor = (action) => {
    if (action?.includes('delete') || action?.includes('reject') || action?.includes('suspend')) return 'text-red-500';
    if (action?.includes('approve') || action?.includes('publish') || action?.includes('create')) return 'text-reads-green';
    return 'text-reads-muted';
  };

  if (loading) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <SectionHeader title="Audit Log" subtitle={`${logs.length} recent actions`} />
      {logs.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No audit logs yet" />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="reads-card px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-sm ${actionColor(log.action)}`}>{log.action?.replace(/_/g, ' ')}</p>
                  <p className="text-reads-muted text-xs truncate">{log.actor_name || log.actor_id}</p>
                  {log.entity_type && (
                    <p className="text-reads-muted text-xs">{log.entity_type} · {log.entity_id?.substring(0, 8)}…</p>
                  )}
                </div>
                <p className="text-reads-muted text-[10px] flex-shrink-0">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Edit Requests Section
// ─────────────────────────────────────────────
function EditRequestsSection() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    api.admin.getEditRequests()
      .then((d) => setRequests(d?.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleReview = async (id, status) => {
    try {
      await api.admin.reviewEditRequest(id, { status });
      showToast(`Edit request ${status}.`);
      load();
    } catch (e) { showToast(e.message, 'error'); }
  };

  if (loading) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <SectionHeader title="Lesson Edit Requests" subtitle={`${requests.length} pending`} />
      {requests.length === 0 ? (
        <EmptyState icon={Edit2} title="No pending edit requests" />
      ) : (
        requests.map((r) => (
          <div key={r.id} className="reads-card p-4 mb-3">
            <p className="font-bold text-reads-navy text-sm">{r.lesson_title}</p>
            <p className="text-reads-muted text-xs mb-1">From: {r.school_name}</p>
            {r.reason && <p className="text-reads-muted text-xs italic mb-3">"{r.reason}"</p>}
            <div className="flex gap-2">
              <button onClick={() => handleReview(r.id, 'approved')}
                className="flex-1 bg-reads-green-bg text-reads-green font-bold text-sm py-2.5 rounded-xl">
                Approve
              </button>
              <button onClick={() => handleReview(r.id, 'rejected')}
                className="flex-1 bg-reads-red-bg text-reads-red font-bold text-sm py-2.5 rounded-xl">
                Reject
              </button>
            </div>
          </div>
        ))
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// Notifications Section
// ─────────────────────────────────────────────
function NotificationsSection() {
  const [form, setForm] = useState({ title: '', message: '', target: 'all', type: 'system' });
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.admin.getNotificationHistory()
      .then((d) => setHistory(d?.notifications || []))
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!form.message.trim()) return showToast('Message is required.', 'error');
    setLoading(true);
    try {
      await api.admin.sendNotification(form);
      showToast('Notification sent!');
      setForm((f) => ({ ...f, message: '', title: '' }));
    } catch (e) { showToast(e.message, 'error'); }
    setLoading(false);
  };

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <SectionHeader title="Send Notification" />
      <div className="reads-card p-4 mb-4 space-y-3">
        <div>
          <label className="reads-label">Target Audience</label>
          <select className="reads-input" value={form.target}
            onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}>
            <option value="all">All Users</option>
            <option value="students">Students Only</option>
            <option value="partners">Partners Only</option>
            <option value="premium">Premium Users</option>
          </select>
        </div>
        <div>
          <label className="reads-label">Title</label>
          <input className="reads-input" placeholder="Notification title"
            value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div>
          <label className="reads-label">Message</label>
          <textarea className="reads-input resize-none" rows={3} placeholder="Notification message…"
            value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
        </div>
        <button onClick={handleSend} disabled={loading}
          className="reads-btn-primary w-full flex items-center justify-center gap-2">
          {loading && <Loader2 size={18} className="animate-spin" />}
          <Bell size={16} /> Send Notification
        </button>
      </div>

      {history.length > 0 && (
        <div>
          <p className="font-bold text-reads-navy text-sm mb-2">Recent Notifications</p>
          <div className="reads-card px-4">
            {history.slice(0, 10).map((n, i) => (
              <div key={i} className="py-3 border-b border-gray-50 last:border-0">
                <p className="font-semibold text-reads-navy text-sm">{n.title}</p>
                <p className="text-reads-muted text-xs mt-0.5">{n.message}</p>
                <p className="text-reads-muted-light text-xs mt-0.5">{new Date(n.sent_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// Admin Nav
// ─────────────────────────────────────────────
const ADMIN_NAV = [
  { key: 'dashboard',     label: 'Overview',     icon: BarChart2 },
  { key: 'users',         label: 'Users',        icon: Users },
  { key: 'lessons',       label: 'Lessons',      icon: BookOpen },
  { key: 'applications',  label: 'Applications', icon: Building2 },
  { key: 'edit-requests', label: 'Requests',     icon: Edit2 },
  { key: 'tournament',   label: 'Challenge',    icon: Trophy },
  { key: 'exams',        label: 'Exams',        icon: ClipboardList },
  { key: 'quiz',         label: 'Quiz',         icon: HelpCircle },
  { key: 'disputes',     label: 'Disputes',     icon: AlertTriangle },
  { key: 'tournaments',  label: 'Tournaments',  icon: Trophy },
  { key: 'curriculum',  label: 'Curriculum',  icon: FileText },
  { key: 'audit-log',   label: 'Audit Log',   icon: ClipboardList },
  { key: 'notifications', label: 'Notify',       icon: Bell },
];

// ─────────────────────────────────────────────
// Main Admin Module
// ─────────────────────────────────────────────
export default function AdminModule({ currentUserId }) {
  const [section, setSection] = useState('dashboard');

  return (
    <div className="animate-fade-in">
      {/* Admin badge header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <div className="w-8 h-8 bg-reads-navy rounded-xl flex items-center justify-center">
          <Shield size={16} className="text-reads-gold" />
        </div>
        <div>
          <p className="font-black text-reads-navy text-base">Admin Panel</p>
          <p className="text-reads-muted text-xs">Full platform control</p>
        </div>
      </div>

      {/* Section tabs — horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 pt-1" style={{ scrollbarWidth: 'none' }}>
        {ADMIN_NAV.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setSection(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${
              section === key ? 'bg-reads-navy text-white shadow-reads-card' : 'bg-gray-100 text-reads-muted'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {section === 'dashboard'     && <AdminStats onNavigate={setSection} />}
      {section === 'users'         && <UsersSection />}
      {section === 'lessons'       && <LessonsSection />}
      {section === 'applications'  && <ApplicationsSection />}
      {section === 'edit-requests' && <EditRequestsSection />}
      {section === 'notifications' && <NotificationsSection />}
      {section === 'audit-log'     && <AuditLogSection />}
      {section === 'tournament'    && <TournamentSection />}
      {section === 'exams'         && <ExamSection />}
      {section === 'quiz'          && <QuizSection />}
      {section === 'disputes'      && <DisputesSection />}
      {section === 'tournaments'    && <TournamentsSection />}
      {section === 'curriculum'    && <SchoolCurriculumSection />}
    </div>
  );
}
