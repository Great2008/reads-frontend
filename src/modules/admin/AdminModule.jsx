import { useState, useEffect } from 'react';
import {
  Shield, Users, BookOpen, BarChart2, Bell, CheckCircle,
  XCircle, Loader2, ChevronRight, AlertTriangle, Building2,
  GraduationCap, Settings, ClipboardList, Sparkles, Eye,
  Edit2, Trash2, Plus, Search, ArrowLeft, RefreshCw,
  HelpCircle, FileText, School, ClipboardList
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingOverlay />;

  return (
    <div className="px-4 pt-2 pb-4 space-y-5 animate-fade-in">
      <SectionHeader title="Admin Dashboard" subtitle="Platform overview" />
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Total Users" value={(stats?.total_users ?? 0).toLocaleString()} color="green" onClick={() => onNavigate('users')} />
        <StatCard icon={BookOpen} label="Total Lessons" value={stats?.total_lessons ?? 0} color="navy" onClick={() => onNavigate('lessons')} />
        <StatCard icon={Building2} label="Active Partners" value={stats?.active_partners ?? 0} color="gold" onClick={() => onNavigate('partners')} />
        <StatCard icon={ClipboardList} label="Pending Applications" value={stats?.pending_applications ?? 0} color="red" onClick={() => onNavigate('applications')} />
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

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.admin.getLessons({ limit: 30 })
      .then((d) => setLessons(d?.lessons || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = (lesson) => {
    setEditLesson(lesson);
    setEditForm({
      title: lesson.title || '',
      subject: lesson.subject || '',
      content: lesson.content || '',
      class_name: lesson.class_name || '',
      track: lesson.track || 'school',
      token_reward: lesson.token_reward || 5,
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
      showToast('Lesson published! 3-hour cooldown started.');
      setLessons((prev) => prev.map((l) => l.id === id ? { ...l, status: 'cooldown' } : l));
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
            <div key={l.id} className="reads-card px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-reads-navy text-sm truncate">{l.title}</p>
                <p className="text-reads-muted text-xs">{l.subject} · {l.track?.toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge label={l.status} variant={STATUS_COLOR[l.status] || 'gray'} className="capitalize" />
                <button onClick={() => handleEdit(l)}
                  className="text-reads-muted hover:text-reads-navy transition-colors">
                  <Edit2 size={15} />
                </button>
                {l.status === 'draft' && (
                  <button onClick={() => handlePublish(l.id)}
                    className="text-reads-green font-bold text-xs px-2 py-1 bg-reads-green-bg rounded-lg">
                    Publish
                  </button>
                )}
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
  const [curriculum, setCurriculum] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cLoading, setCLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    api.admin.getSchools()
      .then(d => setSchools(d?.schools || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadCurriculum = async (school) => {
    setSelectedSchool(school);
    setCLoading(true);
    try {
      const d = await api.admin.getSchoolCurriculum(school.id);
      setCurriculum(d?.curriculum || []);
    } catch { }
    finally { setCLoading(false); }
  };

  const toggle = (key) => setExpanded(e => ({ ...e, [key]: !e[key] }));

  if (loading) return <LoadingOverlay />;

  if (selectedSchool) return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <button onClick={() => setSelectedSchool(null)} className="flex items-center gap-1 text-reads-muted text-sm mb-3">← Back</button>
      <SectionHeader title={selectedSchool.name} subtitle="Curriculum" />
      {cLoading ? <LoadingOverlay /> : curriculum.length === 0 ? (
        <EmptyState icon={FileText} title="No curriculum uploaded" description="This school hasn't uploaded curriculum yet." />
      ) : (
        <div className="space-y-3">
          {curriculum.map(cls => (
            <div key={cls.class_id} className="reads-card overflow-hidden">
              <button onClick={() => toggle(cls.class_id)}
                className="w-full px-4 py-3 flex items-center justify-between">
                <p className="font-bold text-reads-navy text-sm">{cls.class_name}</p>
                <span className="text-reads-muted text-xs">{cls.subjects.length} subjects</span>
              </button>
              {expanded[cls.class_id] && (
                <div className="border-t border-gray-100 divide-y divide-gray-100">
                  {cls.subjects.map(subj => (
                    <div key={subj.id}>
                      <button onClick={() => toggle(subj.id)}
                        className="w-full px-4 py-2 flex items-center justify-between bg-gray-50">
                        <p className="font-semibold text-reads-navy text-xs">{subj.name}</p>
                        <span className="text-reads-muted text-xs">{subj.topics.length} topics</span>
                      </button>
                      {expanded[subj.id] && (
                        <div className="px-4 py-2 space-y-1">
                          {subj.topics.map(t => (
                            <div key={t.id} className="flex items-start gap-2 py-1">
                              <span className="text-[10px] bg-reads-green-bg text-reads-green px-1.5 py-0.5 rounded font-bold flex-shrink-0">T{t.term}{t.week ? ` W${t.week}` : ''}</span>
                              <div>
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
  { key: 'quiz',         label: 'Quiz',         icon: HelpCircle },
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
      {section === 'quiz'          && <QuizSection />}
      {section === 'curriculum'    && <SchoolCurriculumSection />}
    </div>
  );
}
