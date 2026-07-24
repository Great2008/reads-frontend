import { useState, useEffect, useRef } from 'react';
import {
  BookOpen, DollarSign, BarChart2, Layers,
  Plus, Trash2, Upload, Download, ChevronDown,
  Loader2, CheckCircle, XCircle, AlertCircle,
  FileSpreadsheet, Users, BookMarked, Award, Search, ArrowLeft, MessageSquare,
} from 'lucide-react';
import { api } from '../../../services/api.js';

// ── Tiny helpers ──────────────────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
  <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 animate-fade-in
    ${type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-reads-green border border-green-200'}`}>
    {type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
    {msg}
  </div>
);

const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };
  return [toast, show];
};

const EmptyCard = ({ icon: Icon, title, desc, action }) => (
  <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
      <Icon size={28} className="text-gray-400" />
    </div>
    <p className="font-bold text-reads-navy text-sm mb-1">{title}</p>
    <p className="text-reads-muted text-xs mb-5 max-w-xs">{desc}</p>
    {action}
  </div>
);

const Select = ({ value, onChange, options, placeholder }) => (
  <div className="relative">
    <select value={value} onChange={e => onChange(e.target.value)}
      className="reads-input appearance-none pr-8 cursor-pointer">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-reads-muted pointer-events-none" />
  </div>
);

// ── Shared API wrapper that adds /school prefix ───────────────────────────────
const school = {
  getClasses: () => api.partner.getClasses(),
  getSubjects: (class_id) => api.get(`/school/classes/${class_id}/subjects`),
  addSubject: (data) => api.post(`/school/classes/${data.class_id}/subjects`, data),
  deleteSubject: (id) => api.del(`/school/subjects/${id}`),
  downloadCurrTemplate: (class_id) => `/school/curriculum/template/${class_id}`,
  uploadCurriculum: (class_id, formData) => api.upload(`/school/curriculum/upload/${class_id}`, formData),
  getCurriculum: (class_id, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/school/curriculum/${class_id}${q ? '?' + q : ''}`);
  },
  getSessions: () => api.get('/school/sessions'),
  createSession: (data) => api.post('/school/sessions', data),
  getFees: (params = {}) => { const q = new URLSearchParams(params).toString(); return api.get(`/school/fees${q ? '?' + q : ''}`); },
  createFee: (data) => api.post('/school/fees', data),
  getFeePayments: (fee_id) => api.get(`/school/fees/${fee_id}/payments`),
  recordPayment: (fee_id, data) => api.post(`/school/fees/${fee_id}/payments`, data),
  acknowledgePayment: (payment_id) => api.patch(`/school/fees/payments/${payment_id}/acknowledge`, {}),
  getPaymentHistory: (params = {}) => { const q = new URLSearchParams(params).toString(); return api.get(`/school/payments/history${q ? '?' + q : ''}`); },
  getStudents: (params = {}) => { const q = new URLSearchParams(params).toString(); return api.get(`/school/students${q ? '?' + q : ''}`); },
  downloadResultsTemplate: (class_id, term) => `/school/results/template/${class_id}/${term}`,
  uploadResults: (class_id, term, session_id, formData) => {
    const q = new URLSearchParams({ class_id, term, ...(session_id ? { session_id } : {}) }).toString();
    return api.upload(`/school/results/upload?${q}`, formData);
  },
  getResults: (params = {}) => { const q = new URLSearchParams(params).toString(); return api.get(`/school/results${q ? '?' + q : ''}`); },
  manualResult: (data) => api.post('/school/results/manual', data),
  publishResult: (id) => api.patch(`/school/results/${id}/publish`, {}),
  getBehaviourFlags: (params = {}) => { const q = new URLSearchParams(params).toString(); return api.get(`/school/behaviour-flags${q ? '?' + q : ''}`); },
  getMessages: () => api.get('/school/messages'),
  sendMessage: (data) => api.post('/school/messages', data),
};

// ═══════════════════════════════════════════════════════════════════════════
// SUBJECTS SECTION
// ═══════════════════════════════════════════════════════════════════════════
function SubjectsSection({ classes }) {
  const [selectedClass, setSelectedClass] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();

  const load = async (cid) => {
    if (!cid) return;
    setLoading(true);
    try { const d = await school.getSubjects(cid); setSubjects(d?.subjects || []); }
    catch { showToast('Failed to load subjects', 'error'); }
    finally { setLoading(false); }
  };

  const handleClassChange = (cid) => { setSelectedClass(cid); load(cid); };

  const handleAdd = async () => {
    if (!newName.trim() || !selectedClass) return;
    setSaving(true);
    try {
      await school.addSubject({ class_id: selectedClass, name: newName.trim() });
      showToast(`'${newName}' added`);
      setNewName('');
      load(selectedClass);
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete subject '${name}'?`)) return;
    try { await school.deleteSubject(id); showToast('Deleted'); load(selectedClass); }
    catch (e) { showToast(e.message || 'Failed', 'error'); }
  };

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in space-y-4">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="font-black text-reads-navy text-lg">Subjects</h2>
          <p className="text-reads-muted text-xs">Add subjects per class before uploading curriculum</p>
        </div>
      </div>

      <Select value={selectedClass} onChange={handleClassChange}
        placeholder="— Select a class —"
        options={classes.map(c => ({ value: c.id, label: c.name }))} />

      {selectedClass && (
        <>
          <div className="flex gap-2">
            <input className="reads-input flex-1" placeholder="Subject name e.g. Mathematics"
              value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            <button onClick={handleAdd} disabled={saving || !newName.trim()}
              className="reads-btn-primary px-4 flex items-center gap-1.5">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Add
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-reads-green" /></div>
          ) : subjects.length === 0 ? (
            <EmptyCard icon={BookMarked} title="No subjects yet"
              desc="Add subjects for this class to enable curriculum upload." />
          ) : (
            <div className="space-y-2">
              {subjects.map(s => (
                <div key={s.id} className="flex items-center gap-3 reads-card px-4 py-3">
                  <div className="w-9 h-9 bg-reads-green-bg rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen size={16} className="text-reads-green" />
                  </div>
                  <p className="flex-1 font-semibold text-reads-navy text-sm">{s.name}</p>
                  <button onClick={() => handleDelete(s.id, s.name)}
                    className="text-reads-muted hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {toast && <Toast {...toast} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CURRICULUM SECTION
// ═══════════════════════════════════════════════════════════════════════════
const TERM_OPTS = [
  { value: '1', label: 'Term 1' },
  { value: '2', label: 'Term 2' },
  { value: '3', label: 'Term 3' },
];

// ── Manual row form ──────────────────────────────────────────────────────────
function ManualEntryMethod({ classId, subjects, onSuccess, showToast }) {
  const empty = { subject_id: '', term: '1', week: '', topic: '', subtopic: '', objectives: '' };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const f = (k) => (v) => setForm(p => ({ ...p, [k]: typeof v === 'string' ? v : v.target.value }));

  const handleSave = async () => {
    if (!form.subject_id || !form.term || !form.topic.trim())
      return showToast('Subject, term and topic are required', 'error');
    setSaving(true);
    try {
      await api.post('/school/curriculum/manual', {
        class_id: classId,
        subject_id: form.subject_id,
        term: parseInt(form.term),
        week: form.week ? parseInt(form.week) : null,
        topic: form.topic.trim(),
        subtopic: form.subtopic.trim() || null,
        objectives: form.objectives.trim() || null,
      });
      showToast('Topic saved!');
      setForm(empty);
      onSuccess();
    } catch (err) { showToast(err.message || 'Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <Select value={form.subject_id} onChange={f('subject_id')}
        placeholder="— Subject —"
        options={subjects.map(s => ({ value: s.id, label: s.name }))} />
      <div className="grid grid-cols-2 gap-2">
        <Select value={form.term} onChange={f('term')} options={TERM_OPTS} />
        <input className="reads-input" placeholder="Week (optional)" type="number"
          value={form.week} onChange={f('week')} />
      </div>
      <input className="reads-input" placeholder="Topic *" value={form.topic} onChange={f('topic')} />
      <input className="reads-input" placeholder="Subtopic (optional)" value={form.subtopic} onChange={f('subtopic')} />
      <textarea className="reads-input min-h-[72px] resize-none" placeholder="Objectives (optional)"
        value={form.objectives} onChange={f('objectives')} />
      <button onClick={handleSave} disabled={saving}
        className="reads-btn-primary w-full flex items-center justify-center gap-2">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add Topic
      </button>
    </div>
  );
}

// ── Paste method ─────────────────────────────────────────────────────────────
function PasteMethod({ classId, subjects, onSuccess, showToast }) {
  const [subjectId, setSubjectId] = useState('');
  const [term, setTerm] = useState('1');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const placeholder =
    `Paste rows — one topic per line.\nFormat: week  topic  subtopic  objectives\n(Tab-separated, like copying from Excel/Sheets)\n\nExample:\n1\tMeasurement\tLength and Mass\tStudents can measure...\n2\tFractions\tProper Fractions\t`;

  const handleSubmit = async () => {
    if (!subjectId || !term || !text.trim())
      return showToast('Select subject, term and paste your data', 'error');
    setSaving(true); setResult(null);
    try {
      const rows = text.trim().split('\n').filter(Boolean).map(line => {
        const cols = line.split('\t');
        const [weekRaw, topic, subtopic, objectives] = cols;
        const week = parseInt(weekRaw);
        return { week: isNaN(week) ? null : week, topic: (topic || weekRaw || '').trim(), subtopic: (subtopic || '').trim() || null, objectives: (objectives || '').trim() || null };
      }).filter(r => r.topic);
      if (!rows.length) return showToast('No valid rows found', 'error');
      const res = await api.post('/school/curriculum/paste', {
        class_id: classId, subject_id: subjectId, term: parseInt(term), rows,
      });
      setResult(res);
      showToast(res.message || 'Saved!');
      setText('');
      onSuccess();
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <p className="text-reads-muted text-xs">Copy rows from Excel or Google Sheets and paste below. One row = one topic.</p>
      <Select value={subjectId} onChange={setSubjectId}
        placeholder="— Subject —"
        options={subjects.map(s => ({ value: s.id, label: s.name }))} />
      <Select value={term} onChange={setTerm} options={TERM_OPTS} />
      <textarea
        className="reads-input min-h-[160px] resize-none font-mono text-xs"
        placeholder={placeholder}
        value={text}
        onChange={e => setText(e.target.value)}
      />
      {result && (
        <div className={`reads-card px-4 py-3 ${result.errors?.length ? 'border-l-4 border-amber-400' : 'border-l-4 border-reads-green'}`}>
          <p className="font-bold text-reads-navy text-sm">{result.message}</p>
          {result.errors?.slice(0, 5).map((err, i) => <p key={i} className="text-xs text-amber-600 mt-1">⚠ {err}</p>)}
        </div>
      )}
      <button onClick={handleSubmit} disabled={saving}
        className="reads-btn-primary w-full flex items-center justify-center gap-2">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Save Topics
      </button>
    </div>
  );
}

// ── Google Sheets method ──────────────────────────────────────────────────────
function SheetsMethod({ classId, subjects, onSuccess, showToast }) {
  const [url, setUrl] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [term, setTerm] = useState('1');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const handleFetch = async () => {
    if (!url.trim() || !subjectId || !term)
      return showToast('Paste a Sheets URL, select subject and term', 'error');
    if (!url.includes('docs.google.com/spreadsheets'))
      return showToast('Please paste a Google Sheets URL', 'error');
    setSaving(true); setResult(null);
    try {
      const res = await api.post('/school/curriculum/sheets', {
        class_id: classId, subject_id: subjectId, term: parseInt(term), url: url.trim(),
      });
      setResult(res);
      showToast(res.message || 'Imported!');
      setUrl('');
      onSuccess();
    } catch (err) { showToast(err.message || 'Failed to import', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      <div className="reads-card px-4 py-3 bg-blue-50 border-blue-200">
        <p className="text-xs font-bold text-blue-700 mb-1">How to share your sheet</p>
        <p className="text-xs text-blue-600">In Google Sheets: <span className="font-bold">File → Share → Anyone with the link → Viewer</span>, then copy the link.</p>
        <p className="text-xs text-blue-600 mt-1">Columns: <span className="font-mono">Week | Topic | Subtopic | Objectives</span> (row 1 = header, ignored)</p>
      </div>
      <Select value={subjectId} onChange={setSubjectId}
        placeholder="— Subject —"
        options={subjects.map(s => ({ value: s.id, label: s.name }))} />
      <Select value={term} onChange={setTerm} options={TERM_OPTS} />
      <input className="reads-input" placeholder="Paste Google Sheets URL"
        value={url} onChange={e => setUrl(e.target.value)} />
      {result && (
        <div className={`reads-card px-4 py-3 ${result.errors?.length ? 'border-l-4 border-amber-400' : 'border-l-4 border-reads-green'}`}>
          <p className="font-bold text-reads-navy text-sm">{result.message}</p>
          {result.errors?.slice(0, 5).map((e, i) => <p key={i} className="text-xs text-amber-600 mt-1">⚠ {e}</p>)}
        </div>
      )}
      <button onClick={handleFetch} disabled={saving}
        className="reads-btn-primary w-full flex items-center justify-center gap-2">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Import from Sheets
      </button>
    </div>
  );
}

// ── Main CurriculumSection ────────────────────────────────────────────────────
function CurriculumSection({ classes }) {
  const [selectedClass, setSelectedClass] = useState('');
  const [method, setMethod] = useState(null); // 'manual' | 'paste' | 'sheets'
  const [filterTerm, setFilterTerm] = useState('');
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, showToast] = useToast();

  const handleTopicDelete = async (topicId) => {
    if (!confirm('Delete this topic?')) return;
    try {
      await api.del(`/school/curriculum/topics/${topicId}`);
      setTopics(prev => prev.filter(t => t.id !== topicId));
      showToast('Topic deleted');
    } catch (err) { showToast(err.message || 'Failed to delete', 'error'); }
  };

  const loadTopics = async (cid, term) => {
    if (!cid) return;
    setLoading(true);
    try {
      const params = {};
      if (term) params.term = term;
      const d = await school.getCurriculum(cid, params);
      setTopics(d?.topics || []);
    } catch { showToast('Failed to load curriculum', 'error'); }
    finally { setLoading(false); }
  };

  const loadSubjects = async (cid) => {
    try {
      const d = await api.get(`/school/classes/${cid}/subjects`);
      setSubjects(d?.subjects || []);
    } catch { setSubjects([]); }
  };

  const handleClassChange = (cid) => {
    setSelectedClass(cid); setTopics([]); setMethod(null);
    if (cid) { loadSubjects(cid); loadTopics(cid, ''); }
  };

  const onSuccess = () => loadTopics(selectedClass, filterTerm);

  const termGroups = topics.reduce((acc, t) => {
    const key = `Term ${t.term}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const methodOptions = [
    { key: 'manual', icon: Plus,         label: 'Add Manually',    desc: 'Type topics one by one' },
    { key: 'paste',  icon: FileSpreadsheet, label: 'Paste from Excel', desc: 'Copy-paste rows from a spreadsheet' },
    { key: 'sheets', icon: BookMarked,   label: 'Google Sheets',   desc: 'Import from a shared Sheets link' },
  ];

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in space-y-4">
      <div>
        <h2 className="font-black text-reads-navy text-lg">Curriculum</h2>
        <p className="text-reads-muted text-xs">Add topics for each class and subject.</p>
      </div>

      <Select value={selectedClass} onChange={handleClassChange}
        placeholder="— Select a class —"
        options={classes.map(c => ({ value: c.id, label: c.name }))} />

      {selectedClass && (
        <>
          {/* Method picker */}
          {!method ? (
            <div className="space-y-2">
              <p className="text-reads-muted text-xs font-bold uppercase tracking-wide">How do you want to add topics?</p>
              {methodOptions.map(({ key, icon: Icon, label, desc }) => (
                <button key={key} onClick={() => setMethod(key)}
                  className="w-full reads-card px-4 py-3 flex items-center gap-3 text-left active:scale-95 transition-transform">
                  <div className="w-10 h-10 rounded-2xl bg-reads-green flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-reads-navy text-sm">{label}</p>
                    <p className="text-reads-muted text-xs">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <button onClick={() => setMethod(null)}
                className="text-reads-muted text-xs font-bold flex items-center gap-1">
                ← Change method
              </button>
              <div className="reads-card px-4 py-4">
                {method === 'manual' && (
                  <ManualEntryMethod classId={selectedClass} subjects={subjects} onSuccess={onSuccess} showToast={showToast} />
                )}
                {method === 'paste' && (
                  <PasteMethod classId={selectedClass} subjects={subjects} onSuccess={onSuccess} showToast={showToast} />
                )}
                {method === 'sheets' && (
                  <SheetsMethod classId={selectedClass} subjects={subjects} onSuccess={onSuccess} showToast={showToast} />
                )}
              </div>
            </div>
          )}

          {/* Topic list */}
          <div className="flex items-center gap-2 pt-2">
            <p className="text-reads-navy font-black text-xs uppercase tracking-wide flex-1">Topics</p>
            <Select value={filterTerm} onChange={t => { setFilterTerm(t); loadTopics(selectedClass, t); }}
              placeholder="All Terms"
              options={TERM_OPTS} />
            <button onClick={() => loadTopics(selectedClass, filterTerm)}
              className="reads-card px-3 py-2.5 text-xs font-bold text-reads-navy">↻</button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-reads-green" /></div>
          ) : topics.length === 0 ? (
            <EmptyCard icon={Layers} title="No topics yet" desc="Choose a method above to add your first topic." />
          ) : (
            Object.entries(termGroups).map(([term, items]) => (
              <div key={term}>
                <p className="font-black text-reads-navy text-xs uppercase tracking-widest mb-2 mt-4">{term}</p>
                <div className="space-y-2">
                  {items.map(t => (
                    <div key={t.id} className="reads-card px-4 py-3 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {t.week && <span className="text-[10px] font-bold bg-reads-green-bg text-reads-green px-2 py-0.5 rounded-full">Wk {t.week}</span>}
                          <span className="text-[10px] text-reads-muted">{t.subject_name}</span>
                        </div>
                        <p className="font-semibold text-reads-navy text-sm">{t.topic}</p>
                        {t.subtopic && <p className="text-reads-muted text-xs mt-0.5">{t.subtopic}</p>}
                      </div>
                      <button
                        onClick={() => handleTopicDelete(t.id)}
                        className="text-reads-red text-[10px] font-bold px-2 py-1 rounded hover:bg-red-50 flex-shrink-0">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}
      {toast && <Toast {...toast} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FEES SECTION
// ═══════════════════════════════════════════════════════════════════════════
// ── Manually Log Payment ──────────────────────────────────────────────────────
function LogPaymentView({ fees, classes, onBack, onLogged, showToast }) {
  const [feeId, setFeeId] = useState('');
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.school.getStudents().then((d) => setStudents(d?.students || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const fee = fees.find((f) => f.id === feeId);
    if (fee) setAmount(String(fee.amount));
  }, [feeId, fees]);

  const filteredStudents = students.filter((s) =>
    !studentSearch || s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()));

  const submit = async () => {
    if (!feeId || !studentId || !amount) return showToast('Select a fee, student, and amount', 'error');
    setSaving(true);
    try {
      await school.recordPayment(feeId, {
        student_id: studentId, amount_paid: parseFloat(amount), method, paid_at: date, notes,
      });
      showToast('Payment logged');
      onLogged();
    } catch (e) { showToast(e.message || 'Failed to log payment', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-reads-muted text-sm mb-1">
        <ArrowLeft size={16} /> Back
      </button>
      <h2 className="font-black text-reads-navy text-lg">Manually Log Payment</h2>

      <div>
        <label className="reads-label">Fee Schedule</label>
        <Select value={feeId} onChange={setFeeId} placeholder="— Select fee —"
          options={fees.map((f) => ({ value: f.id, label: `${f.class_name} — Term ${f.term} (₦${f.amount?.toLocaleString()})` }))} />
      </div>

      <div>
        <label className="reads-label">Student</label>
        <div className="relative mb-2">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-reads-muted-light" />
          <input className="reads-input pl-9" placeholder="Search students…"
            value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
        </div>
        <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-1.5">
          {filteredStudents.slice(0, 30).map((s) => (
            <button key={s.id} onClick={() => setStudentId(s.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${studentId === s.id ? 'bg-reads-green-bg text-reads-green font-bold' : 'text-reads-navy'}`}>
              {s.full_name}
            </button>
          ))}
          {filteredStudents.length === 0 && <p className="text-reads-muted text-xs text-center py-3">No students found</p>}
        </div>
      </div>

      <div>
        <label className="reads-label">Amount (₦)</label>
        <input className="reads-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>

      <div>
        <label className="reads-label">Payment Method</label>
        <Select value={method} onChange={setMethod}
          options={[
            { value: 'cash', label: 'Cash' },
            { value: 'bank_transfer', label: 'Bank Transfer' },
            { value: 'card', label: 'Card' },
            { value: 'reads_wallet', label: '$READS Wallet' },
          ]} />
      </div>

      <div>
        <label className="reads-label">Payment Date</label>
        <input className="reads-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div>
        <label className="reads-label">Notes (Optional)</label>
        <textarea className="reads-input resize-none" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <button onClick={submit} disabled={saving} className="reads-btn-primary w-full flex items-center justify-center gap-2">
        {saving && <Loader2 size={16} className="animate-spin" />} Log Payment
      </button>
    </div>
  );
}

// ── Fee Payment History (consolidated) ────────────────────────────────────────
function PaymentHistoryView({ onBack }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    school.getPaymentHistory()
      .then((d) => setPayments(d?.payments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-reads-muted text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <button className="flex items-center gap-1.5 text-reads-green text-xs font-bold">
          <Download size={14} /> Download
        </button>
      </div>
      <h2 className="font-black text-reads-navy text-lg mb-4">Fee Payment History</h2>

      {loading ? (
        <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-reads-green" /></div>
      ) : payments.length === 0 ? (
        <EmptyCard icon={DollarSign} title="No payment records"
          desc="Payments logged here, or paid by students directly, will show up as a consolidated history." />
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="reads-card px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-reads-navy text-sm">{p.student_name}</p>
                <p className="text-reads-muted text-xs">{p.fee_type || p.class_name} · {new Date(p.paid_at).toLocaleDateString()}</p>
              </div>
              <p className="font-black text-reads-navy text-sm">₦{p.amount_paid?.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeesSection({ classes }) {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showPayments, setShowPayments] = useState(null);
  const [payments, setPayments] = useState([]);
  const [view, setView] = useState('list'); // list | log | history
  const [form, setForm] = useState({ class_id: '', term: '1', amount: '', due_date: '' });
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();

  const loadFees = async () => {
    try { const d = await school.getFees(); setFees(d?.fees || []); }
    catch { showToast('Failed to load fees', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadFees(); }, []);

  const handleCreate = async () => {
    if (!form.class_id || !form.amount) return showToast('Fill class and amount', 'error');
    setSaving(true);
    try {
      await school.createFee({ ...form, term: parseInt(form.term), amount: parseFloat(form.amount) });
      showToast('Fee schedule created');
      setShowAdd(false);
      setForm({ class_id: '', term: '1', amount: '', due_date: '' });
      loadFees();
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const openPayments = async (fee) => {
    setShowPayments(fee);
    try { const d = await school.getFeePayments(fee.id); setPayments(d?.payments || []); }
    catch { showToast('Failed to load payments', 'error'); }
  };

  const handleAcknowledge = async (payment_id) => {
    try {
      await school.acknowledgePayment(payment_id);
      showToast('Payment acknowledged');
      openPayments(showPayments);
    } catch (e) { showToast(e.message || 'Failed', 'error'); }
  };

  if (loading) return <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-reads-green" /></div>;

  if (showPayments) return (
    <div className="px-4 pt-2 pb-4 animate-fade-in">
      <button onClick={() => setShowPayments(null)} className="flex items-center gap-1 text-reads-muted text-sm mb-4">
        ← Back to fees
      </button>
      <h2 className="font-black text-reads-navy text-lg mb-1">{showPayments.class_name} — Term {showPayments.term}</h2>
      <p className="text-reads-muted text-xs mb-4">₦{showPayments.amount?.toLocaleString()} · {showPayments.acknowledged_payments}/{showPayments.total_payments} acknowledged</p>
      {payments.length === 0 ? (
        <EmptyCard icon={DollarSign} title="No payments yet" desc="Payments recorded by finance officers appear here." />
      ) : (
        <div className="space-y-2">
          {payments.map(p => (
            <div key={p.id} className="reads-card px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-reads-navy text-sm">{p.student_name}</p>
                  <p className="text-reads-muted text-xs">₦{p.amount_paid?.toLocaleString()} · {new Date(p.paid_at).toLocaleDateString()}</p>
                  {p.notes && <p className="text-reads-muted text-xs italic">{p.notes}</p>}
                </div>
                {p.status === 'acknowledged' ? (
                  <span className="text-[10px] font-bold bg-green-50 text-reads-green px-2 py-1 rounded-full">Acknowledged</span>
                ) : (
                  <button onClick={() => handleAcknowledge(p.id)}
                    className="text-[10px] font-bold bg-reads-navy text-white px-3 py-1.5 rounded-full">
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && <Toast {...toast} />}
    </div>
  );

  if (view === 'log') return (
    <LogPaymentView fees={fees} classes={classes} showToast={showToast}
      onBack={() => setView('list')}
      onLogged={() => { setView('list'); loadFees(); }} />
  );

  if (view === 'history') return (
    <PaymentHistoryView onBack={() => setView('list')} />
  );

  const totalCollectible = fees.reduce((s, f) => s + (f.amount || 0) * (f.total_payments || 0), 0);
  const totalCollected = fees.reduce((s, f) => s + (f.amount || 0) * (f.acknowledged_payments || 0), 0);

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-reads-navy text-lg">Fees</h2>
          <p className="text-reads-muted text-xs">Set fee schedules per class and term</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 text-reads-green font-bold text-sm">
          <Plus size={16} /> Add Fee
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="reads-card p-3 text-center">
          <p className="font-black text-reads-navy text-lg leading-none">{fees.length}</p>
          <p className="text-reads-muted-light text-[10px] mt-1">Fee Schedules</p>
        </div>
        <div className="reads-card p-3 text-center">
          <p className="font-black text-reads-green text-lg leading-none">₦{totalCollected.toLocaleString()}</p>
          <p className="text-reads-muted-light text-[10px] mt-1">Collected</p>
        </div>
        <div className="reads-card p-3 text-center">
          <p className="font-black text-reads-red text-lg leading-none">₦{Math.max(0, totalCollectible - totalCollected).toLocaleString()}</p>
          <p className="text-reads-muted-light text-[10px] mt-1">Outstanding</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <button onClick={() => setView('log')} className="reads-btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5">
          <Plus size={14} /> Log Payment
        </button>
        <button onClick={() => setView('history')} className="reads-btn-outline flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5">
          <Download size={14} /> Payment History
        </button>
      </div>

      {showAdd && (
        <div className="reads-card px-4 py-4 space-y-3 border-2 border-reads-green">
          <p className="font-bold text-reads-navy text-sm">New Fee Schedule</p>
          <Select value={form.class_id} onChange={v => setForm(f => ({ ...f, class_id: v }))}
            placeholder="— Select class —"
            options={classes.map(c => ({ value: c.id, label: c.name }))} />
          <Select value={form.term} onChange={v => setForm(f => ({ ...f, term: v }))}
            options={[{ value: '1', label: 'Term 1' }, { value: '2', label: 'Term 2' }, { value: '3', label: 'Term 3' }]} />
          <input className="reads-input" type="number" placeholder="Amount (₦)"
            value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          <div>
            <label className="reads-label">Due Date (optional)</label>
            <input className="reads-input" type="date"
              value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
          <button onClick={handleCreate} disabled={saving}
            className="reads-btn-primary w-full flex items-center justify-center gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />} Create Fee Schedule
          </button>
        </div>
      )}

      {fees.length === 0 ? (
        <EmptyCard icon={DollarSign} title="No fee schedules"
          desc="Create fee schedules for each class and term." />
      ) : (
        <div className="space-y-2">
          {fees.map(f => (
            <button key={f.id} onClick={() => openPayments(f)}
              className="w-full reads-card px-4 py-3 text-left hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-reads-navy text-sm">{f.class_name} — Term {f.term}</p>
                  <p className="text-reads-muted text-xs">₦{f.amount?.toLocaleString()} · {f.acknowledged_payments}/{f.total_payments} paid</p>
                  {f.due_date && <p className="text-reads-muted text-xs">Due: {new Date(f.due_date).toLocaleDateString()}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-reads-green rounded-full transition-all"
                      style={{ width: f.total_payments ? `${(f.acknowledged_payments / f.total_payments) * 100}%` : '0%' }} />
                  </div>
                  <span className="text-[10px] text-reads-muted">View payments →</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      {toast && <Toast {...toast} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RESULTS SECTION
// ═══════════════════════════════════════════════════════════════════════════
function ResultsSection({ classes }) {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('1');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileRef = useRef();
  const [toast, showToast] = useToast();

  const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

  const loadResults = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const d = await school.getResults({ class_id: selectedClass, term: selectedTerm });
      setResults(d?.results || []);
    } catch { showToast('Failed to load results', 'error'); }
    finally { setLoading(false); }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedClass) return showToast('Select a class first', 'error');
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API_BASE}/school/results/template/${selectedClass}/${selectedTerm}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `results_template_term${selectedTerm}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch { showToast('Failed to download template', 'error'); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    const inputEl = e.target;
    if (!file || !selectedClass) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const r = await school.uploadResults(selectedClass, selectedTerm, null, formData);
      setUploadResult(r);
      showToast(r.message || 'Uploaded!');
      loadResults();
    } catch (err) { showToast(err.message || 'Upload failed', 'error'); }
    finally { setUploading(false); if (inputEl) inputEl.value = ''; }
  };

  const handlePublish = async (id) => {
    try { await school.publishResult(id); showToast('Published'); loadResults(); }
    catch (e) { showToast(e.message || 'Failed', 'error'); }
  };

  const gradeColor = (grade) => {
    if (!grade) return 'text-reads-muted';
    if (['A1', 'B2', 'B3'].includes(grade)) return 'text-reads-green';
    if (['C4', 'C5', 'C6'].includes(grade)) return 'text-amber-600';
    return 'text-red-500';
  };

  // Group results by student
  const byStudent = results.reduce((acc, r) => {
    if (!acc[r.student_id]) acc[r.student_id] = { name: r.student_name, subjects: [] };
    acc[r.student_id].subjects.push(r);
    return acc;
  }, {});

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in space-y-4">
      <div>
        <h2 className="font-black text-reads-navy text-lg">Results</h2>
        <p className="text-reads-muted text-xs">Upload term results or enter manually</p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Select value={selectedClass} onChange={setSelectedClass}
            placeholder="— Class —"
            options={classes.map(c => ({ value: c.id, label: c.name }))} />
        </div>
        <div className="w-28">
          <Select value={selectedTerm} onChange={setSelectedTerm}
            options={[{ value: '1', label: 'Term 1' }, { value: '2', label: 'Term 2' }, { value: '3', label: 'Term 3' }]} />
        </div>
      </div>

      {selectedClass && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleDownloadTemplate}
              className="flex items-center justify-center gap-2 reads-card px-3 py-3 text-sm font-bold text-reads-navy hover:bg-gray-50 transition-colors">
              <Download size={16} className="text-reads-green" /> Template
            </button>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center justify-center gap-2 reads-btn-primary px-3 py-3 text-sm">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Upload
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload} />
          </div>

          <button onClick={loadResults}
            className="w-full reads-card py-2.5 text-sm font-bold text-reads-navy hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <BarChart2 size={15} className="text-reads-green" /> View Results
          </button>

          {uploadResult && (
            <div className={`reads-card px-4 py-3 ${uploadResult.errors?.length ? 'border-l-4 border-amber-400' : 'border-l-4 border-reads-green'}`}>
              <p className="font-bold text-reads-navy text-sm">{uploadResult.message}</p>
              {uploadResult.errors?.slice(0, 5).map((err, i) => (
                <p key={i} className="text-xs text-amber-600 mt-1">⚠ {err}</p>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-reads-green" /></div>
          ) : Object.keys(byStudent).length === 0 ? null : (
            <div className="space-y-3">
              {Object.entries(byStudent).map(([sid, { name, subjects }]) => (
                <div key={sid} className="reads-card px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-reads-navy text-sm">{name}</p>
                    {!subjects[0]?.is_published && (
                      <button onClick={() => subjects.forEach(s => handlePublish(s.id))}
                        className="text-[10px] font-bold bg-reads-navy text-white px-3 py-1.5 rounded-full">
                        Publish All
                      </button>
                    )}
                    {subjects[0]?.is_published && (
                      <span className="text-[10px] font-bold bg-green-50 text-reads-green px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle size={10} /> Published
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {subjects.map(s => (
                      <div key={s.id} className="flex items-center justify-between">
                        <span className="text-xs text-reads-muted truncate max-w-[100px]">{s.subject_name}</span>
                        <span className={`text-xs font-black ml-2 ${gradeColor(s.grade)}`}>
                          {s.grade} {s.score !== null ? `(${s.score})` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {toast && <Toast {...toast} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STUDENTS SECTION
// ═══════════════════════════════════════════════════════════════════════════
function StudentsSection() {
  const [view, setView] = useState('enrolled'); // 'enrolled' | 'requests'
  const [students, setStudents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(null);
  const [toast, showToast] = useToast();

  const loadStudents = async () => {
    setLoading(true);
    try {
      const d = await api.school.getStudents();
      setStudents(d?.students || []);
    } catch { showToast('Failed to load students', 'error'); }
    finally { setLoading(false); }
  };

  const loadRequests = async () => {
    setLoading(true);
    try {
      const d = await api.get('/school/students/requests');
      setRequests(d?.requests || []);
    } catch { showToast('Failed to load requests', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (view === 'enrolled') loadStudents();
    else loadRequests();
  }, [view]);

  const handleApprove = async (studentId) => {
    setActing(studentId);
    try {
      await api.post(`/school/students/requests/${studentId}/approve`, {});
      showToast('Student approved and enrolled');
      loadRequests();
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
    finally { setActing(null); }
  };

  const handleRecover = async (studentId) => {
    setActing(studentId);
    try {
      await api.post(`/school/students/${studentId}/recover`, {});
      showToast('Student re-affiliated successfully');
      loadRequests();
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
    finally { setActing(null); }
  };

  const handleReject = async (studentId) => {
    if (!confirm('Reject this affiliation request?')) return;
    setActing(studentId + '_reject');
    try {
      await api.post(`/school/students/requests/${studentId}/reject`, {});
      showToast('Request rejected');
      loadRequests();
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
    finally { setActing(null); }
  };

  const [deaffiliateTarget, setDeaffiliateTarget] = useState(null);
  const [deaffReason, setDeaffReason] = useState('withdrew');
  const [deaffDetail, setDeaffDetail] = useState('');

  const handleDeaffiliate = async () => {
    if (!deaffiliateTarget) return;
    if (deaffReason === 'other' && !deaffDetail.trim())
      return showToast('Please describe the reason', 'error');
    setActing(deaffiliateTarget.id + '_deaff');
    try {
      await api.post(`/school/students/${deaffiliateTarget.id}/deaffiliate`, {
        reason: deaffReason,
        reason_detail: deaffReason === 'other' ? deaffDetail.trim() : null,
      });
      showToast(`${deaffiliateTarget.full_name} removed`);
      setDeaffiliateTarget(null);
      setDeaffReason('withdrew');
      setDeaffDetail('');
      loadStudents();
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
    finally { setActing(null); }
  };

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in space-y-4">
      <div>
        <h2 className="font-black text-reads-navy text-lg">Students</h2>
        <p className="text-reads-muted text-xs">Manage enrolled students and affiliation requests.</p>
      </div>

      {/* Toggle */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        {[
          { key: 'enrolled', label: 'Enrolled' },
          { key: 'requests', label: `Requests${requests.length ? ` (${requests.length})` : ''}` },
        ].map(t => (
          <button key={t.key} onClick={() => setView(t.key)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all
              ${view === t.key ? 'bg-white text-reads-navy shadow-sm' : 'text-reads-muted'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-reads-green" /></div>
      ) : view === 'enrolled' ? (
        students.length === 0 ? (
          <EmptyCard icon={Users} title="No students yet" desc="Students will appear here once their affiliation requests are approved." />
        ) : (
          <div className="space-y-2">
            {students.map(s => (
              <div key={s.id} className="reads-card px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-reads-green-bg flex items-center justify-center flex-shrink-0">
                  <span className="font-black text-reads-green text-sm">{s.full_name?.[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-reads-navy text-sm truncate">{s.full_name}</p>
                  <p className="text-reads-muted text-xs">{s.class_name || 'No class'}</p>
                </div>
                <button
                  onClick={() => { setDeaffiliateTarget(s); setDeaffReason('withdrew'); setDeaffDetail(''); }}
                  className="text-reads-red text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors flex-shrink-0">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        requests.length === 0 ? (
          <EmptyCard icon={Users} title="No pending requests" desc="When students request to join your school, they'll appear here for you to approve or reject." />
        ) : (
          <div className="space-y-2">
            {requests.map(r => (
              <div key={r.id} className="reads-card px-4 py-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <span className="font-black text-amber-500 text-sm">{r.full_name?.[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-reads-navy text-sm truncate">{r.full_name}</p>
                      {r.type === 'recovery' && (
                        <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full flex-shrink-0">
                          RECOVERY · {r.days_left_in_window}d left
                        </span>
                      )}
                    </div>
                    <p className="text-reads-muted text-xs">{r.email}</p>
                    {r.requested_class && <p className="text-reads-muted text-xs">Class: {r.requested_class}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => r.type === 'recovery' ? handleRecover(r.id) : handleApprove(r.id)}
                    disabled={acting === r.id}
                    className="flex-1 reads-btn-primary py-2 text-xs flex items-center justify-center gap-1">
                    {acting === r.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                    {r.type === 'recovery' ? 'Re-affiliate' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(r.id)}
                    disabled={acting === r.id + '_reject'}
                    className="flex-1 reads-btn-secondary py-2 text-xs text-reads-red border-red-200 flex items-center justify-center gap-1">
                    {acting === r.id + '_reject' ? '…' : <><XCircle size={12} /> Reject</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
      {toast && <Toast {...toast} />}

      {/* Deaffiliate reason modal */}
      {deaffiliateTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-t-3xl px-5 py-6 space-y-4">
            <p className="font-black text-reads-navy text-base">Remove {deaffiliateTarget.full_name}?</p>
            <p className="text-reads-muted text-xs">They will have a 30-day recovery window. Select a reason:</p>
            <div className="space-y-2">
              {[
                { value: 'withdrew', label: 'Withdrew' },
                { value: 'transfer', label: 'Transfer to another school' },
                { value: 'other', label: 'Other' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setDeaffReason(opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold
                    ${deaffReason === opt.value ? 'border-reads-red bg-red-50 text-reads-red' : 'border-gray-100 text-reads-navy'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            {deaffReason === 'other' && (
              <textarea
                className="reads-input min-h-[72px] resize-none"
                placeholder="Describe reason..."
                value={deaffDetail}
                onChange={e => setDeaffDetail(e.target.value)}
              />
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setDeaffiliateTarget(null)}
                className="flex-1 reads-btn-secondary py-3 text-sm">Cancel</button>
              <button
                onClick={handleDeaffiliate}
                disabled={acting === deaffiliateTarget?.id + '_deaff'}
                className="flex-1 bg-reads-red text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {acting === deaffiliateTarget?.id + '_deaff' ? <Loader2 size={14} className="animate-spin" /> : null}
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════
// BEHAVIOUR & QUIZ FLAGS SECTION
// ═══════════════════════════════════════════════════════════════════════════
function BehaviourFlagsSection() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    school.getBehaviourFlags()
      .then((d) => setFlags(d?.flags || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = flags.filter((f) => filter === 'all' || f.status === filter);
  const underReview = flags.filter((f) => f.status === 'under_review').length;
  const actioned = flags.filter((f) => f.status === 'actioned').length;

  if (loading) return <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-reads-green" /></div>;

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in space-y-4">
      <div>
        <h2 className="font-black text-reads-navy text-lg">Behaviour & Quiz Flags</h2>
        <p className="text-reads-muted text-xs">Suspicious quiz activity and behaviour reports for your students</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="reads-card p-3 text-center">
          <p className="font-black text-reads-navy text-lg leading-none">{flags.length}</p>
          <p className="text-reads-muted-light text-[10px] mt-1">Total Flags</p>
        </div>
        <div className="reads-card p-3 text-center">
          <p className="font-black text-amber-600 text-lg leading-none">{underReview}</p>
          <p className="text-reads-muted-light text-[10px] mt-1">Under Review</p>
        </div>
        <div className="reads-card p-3 text-center">
          <p className="font-black text-reads-green text-lg leading-none">{actioned}</p>
          <p className="text-reads-muted-light text-[10px] mt-1">Action Taken</p>
        </div>
      </div>

      <div className="flex gap-1.5">
        {['all', 'under_review', 'actioned'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === f ? 'bg-reads-green text-white' : 'bg-gray-100 text-reads-muted'
            }`}>
            {f === 'all' ? 'All' : f === 'under_review' ? 'Under Review' : 'Action Taken'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyCard icon={AlertCircle} title="No flags" desc="Flagged quiz or behaviour activity for your students will appear here." />
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => (
            <div key={f.id} className="reads-card px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-reads-navy text-sm">{f.student_name}</p>
                  <p className="text-reads-muted text-xs">{f.class_name} · {f.description}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                  f.status === 'actioned' ? 'bg-green-50 text-reads-green' : 'bg-amber-50 text-amber-600'
                }`}>
                  {f.status === 'actioned' ? 'Action Taken' : 'Under Review'}
                </span>
              </div>
              {f.flagged_at && <p className="text-reads-muted-light text-[10px] mt-2">{new Date(f.flagged_at).toLocaleDateString()}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGES SECTION
// ═══════════════════════════════════════════════════════════════════════════
function MessagesSection({ classes }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [audience, setAudience] = useState('all'); // all | individual
  const [classId, setClassId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, showToast] = useToast();

  const load = () => {
    school.getMessages()
      .then((d) => setMessages(d?.messages || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const send = async () => {
    if (!title.trim() || !body.trim()) return showToast('Add a title and message', 'error');
    setSending(true);
    try {
      await school.sendMessage({ title, body, audience, class_id: audience === 'individual' ? classId : undefined });
      showToast('Message sent');
      setTitle(''); setBody(''); setComposing(false);
      load();
    } catch (e) { showToast(e.message || "Messaging isn't supported by the backend yet", 'error'); }
    finally { setSending(false); }
  };

  if (loading) return <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-reads-green" /></div>;

  if (composing) return (
    <div className="px-4 pt-2 pb-4 animate-fade-in space-y-4">
      <button onClick={() => setComposing(false)} className="flex items-center gap-1.5 text-reads-muted text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <h2 className="font-black text-reads-navy text-lg">New Message</h2>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
        {[{ key: 'all', label: 'Broadcast' }, { key: 'individual', label: 'Individual Class' }].map((a) => (
          <button key={a.key} onClick={() => setAudience(a.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              audience === a.key ? 'bg-white text-reads-navy shadow-sm' : 'text-reads-muted'
            }`}>
            {a.label}
          </button>
        ))}
      </div>

      {audience === 'individual' && (
        <Select value={classId} onChange={setClassId} placeholder="— Select class —"
          options={classes.map((c) => ({ value: c.id, label: c.name }))} />
      )}

      <input className="reads-input" placeholder="Message title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="reads-input resize-none" rows={5} placeholder="Write your message…" value={body} onChange={(e) => setBody(e.target.value)} />

      <button onClick={send} disabled={sending} className="reads-btn-primary w-full flex items-center justify-center gap-2">
        {sending && <Loader2 size={16} className="animate-spin" />} Send Message
      </button>
      {toast && <Toast {...toast} />}
    </div>
  );

  return (
    <div className="px-4 pt-2 pb-4 animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-reads-navy text-lg">Messages</h2>
          <p className="text-reads-muted text-xs">Send messages & notifications to students</p>
        </div>
        <button onClick={() => setComposing(true)} className="flex items-center gap-1.5 text-reads-green font-bold text-sm">
          <Plus size={16} /> New
        </button>
      </div>

      {messages.length === 0 ? (
        <EmptyCard icon={MessageSquare} title="No messages yet" desc="Messages you send to students will appear here." />
      ) : (
        <div className="space-y-2">
          {messages.map((m) => (
            <div key={m.id} className="reads-card px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-reads-navy text-sm">{m.title}</p>
                <span className="text-reads-muted-light text-[10px] flex-shrink-0">
                  {m.sent_at ? new Date(m.sent_at).toLocaleDateString() : ''}
                </span>
              </div>
              <p className="text-reads-muted text-xs mt-1">{m.body}</p>
              <span className="inline-block mt-1.5 text-[10px] font-semibold text-reads-green bg-reads-green-bg px-2 py-0.5 rounded-full">
                {m.audience === 'individual' ? m.recipient_name || 'Class' : 'All Students'}
              </span>
            </div>
          ))}
        </div>
      )}
      {toast && <Toast {...toast} />}
    </div>
  );
}

const TABS = [
  { key: 'students',    label: 'Students',    icon: Users },
  { key: 'subjects',    label: 'Subjects',    icon: BookMarked },
  { key: 'curriculum',  label: 'Curriculum',  icon: Layers },
  { key: 'fees',        label: 'Fees',        icon: DollarSign },
  { key: 'results',     label: 'Results',     icon: Award },
  { key: 'flags',       label: 'Flags',       icon: AlertCircle },
  { key: 'messages',    label: 'Messages',    icon: MessageSquare },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN MODULE
// ═══════════════════════════════════════════════════════════════════════════
export default function SchoolPortalModule({ onBack }) {
  const [tab, setTab] = useState('subjects');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    api.partner.getClasses()
      .then(d => setClasses(d?.classes || []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="text-reads-muted">
              ←
            </button>
          )}
          <div>
            <p className="font-black text-reads-navy text-sm">School Portal</p>
            <p className="text-reads-muted text-xs">Curriculum · Fees · Results</p>
          </div>
        </div>
        {/* Tab bar */}
        <div className="max-w-lg mx-auto flex border-t border-gray-100">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-bold transition-colors
                ${tab === key ? 'text-reads-green border-b-2 border-reads-green' : 'text-reads-muted'}`}>
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-lg mx-auto pt-28 pb-10">
        {tab === 'students'   && <StudentsSection />}
        {tab === 'subjects'   && <SubjectsSection   classes={classes} />}
        {tab === 'curriculum' && <CurriculumSection classes={classes} />}
        {tab === 'fees'       && <FeesSection        classes={classes} />}
        {tab === 'results'    && <ResultsSection     classes={classes} />}
        {tab === 'flags'      && <BehaviourFlagsSection />}
        {tab === 'messages'   && <MessagesSection    classes={classes} />}
      </main>
    </div>
  );
}
