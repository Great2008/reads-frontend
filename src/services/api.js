// ─────────────────────────────────────────────────────────────────────────────
// $READS API Service Layer
// Base URL: /api  (proxied to FastAPI backend)
// Auth: JWT in localStorage — Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

// ── Helpers ──────────────────────────────────────────────────────────────────

const getHeaders = (auth = true) => {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = localStorage.getItem('access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleError = async (res, action) => {
  let message = `Failed to ${action} (${res.status})`;

  if (res.status === 401) {
    localStorage.removeItem('access_token');
    try {
      const json = await res.json();
      const detail = json.detail || '';
      if (
        detail.startsWith('EMAIL_NOT_VERIFIED:') ||
        detail === 'PARTNER_PENDING' ||
        detail.startsWith('PARTNER_REJECTED:')
      ) {
        throw new Error(detail);
      }
      throw new Error(json.detail || 'Session expired. Please log in again.');
    } catch (e) {
      throw e;
    }
  }

  if (res.status === 409) throw new Error('Email already Registered');
  if (res.status === 429) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.detail || 'Rate limit exceeded. Please try again later.');
  }

  try {
    const json = await res.json();
    message = json.detail || json.message || message;
  } catch (_) {}

  throw new Error(message);
};

const req = async (method, path, body = null, auth = true) => {
  const opts = { method, headers: getHeaders(auth) };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${path}`, opts);
  if (!res.ok) await handleError(res, `${method} ${path}`);
  return res.json();
};

const get  = (path, auth = true)        => req('GET',    path, null, auth);
const post = (path, body, auth = true)  => req('POST',   path, body, auth);
const put  = (path, body, auth = true)  => req('PUT',    path, body, auth);
const patch = (path, body, auth = true) => req('PATCH',  path, body, auth);
const del  = (path, auth = true)        => req('DELETE', path, null, auth);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  /** Register student. Sends OTP verification email. */
  register: (data) => post('/auth/register/student', data, false),

  /** Verify email OTP → activates account. */
  verifyOtp: (data) => post('/auth/verify-otp', data, false),

  /** Login → returns { access_token, refresh_token, role } */
  login: async (email, password) => {
    const data = await post('/auth/login', { email, password }, false);
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
    return data;
  },

  /** Refresh access token silently. */
  refresh: async () => {
    const refresh_token = localStorage.getItem('refresh_token');
    const data = await post('/auth/refresh', { refresh_token }, false);
    localStorage.setItem('access_token', data.access_token);
    return data;
  },

  /** Logout — invalidates session token. */
  logout: async () => {
    try { await post('/auth/logout'); } catch (_) {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  /** Send password-reset OTP. */
  forgotPassword: (email) => post('/auth/forgot-password', { email }, false),

  /** Reset password using OTP. */
  resetPassword: (email, otp, new_password) =>
    post('/auth/reset-password', { email, otp, new_password }, false),

  /** Get current user profile. */
  me: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return null;
    try {
      return await get('/auth/me');
    } catch (_) {
      return null;
    }
  },

  /** Update own profile. */
  updateProfile: (data) => patch('/auth/me', data),

  /** Change password. */
  changePassword: (current_password, new_password) =>
    patch('/auth/me/password', { current_password, new_password }),

  /** Preview staff invite before accepting. */
  previewStaffInvite: (token) => get(`/auth/staff/accept-invite?token=${encodeURIComponent(token)}`, false),

  /** Accept staff invite. */
  acceptStaffInvite: (token, password) =>
    post('/auth/staff/accept-invite', { token, password }, false),

  /** Partner application signup. */
  partnerSignup: (data) => post('/auth/register/partner', data, false),
};

// ── Students ──────────────────────────────────────────────────────────────────
export const students = {
  lookupSchool: (code) => get(`/students/school/lookup?code=${encodeURIComponent(code)}`, false),
  enroll: (school_code, class_id) => post('/students/enroll', { school_code, class_id }),
  unenroll: () => post('/students/unenroll', {}),
  getTracks: () => get('/students/tracks'),
  applyTrack: (track) => post('/students/tracks/apply', { track }),
  getProgress: () => get('/students/progress'),
  getPromotionHistory: () => get('/students/promotion-history'),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notifications = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/notifications${qs ? `?${qs}` : ''}`);
  },
  markRead: (id) => patch(`/notifications/${id}/read`, {}),
  markAllRead: () => patch('/notifications/read-all', {}),
  getUnreadCount: () => get('/notifications/unread-count'),
};

// ── School Portal ─────────────────────────────────────────────────────────────
export const school = {
  // Profile
  getProfile: () => get('/school/profile'),
  updateProfile: (data) => patch('/school/profile', data),

  // Staff
  getStaff: () => get('/school/staff'),
  inviteStaff: (email, role) => post('/school/staff/invite', { email, role }),
  removeStaff: (staff_id) => del(`/school/staff/${staff_id}`),

  // Classes & Subjects
  getClasses: () => get('/partner/school/classes'),
  getSubjects: (class_id) => get(`/school/classes/${class_id}/subjects`),
  addSubject: (class_id, data) => post(`/school/classes/${class_id}/subjects`, data),
  removeSubject: (subject_id) => del(`/school/subjects/${subject_id}`),

  // Curriculum
  getCurriculumTemplate: (class_id) => get(`/school/curriculum/template/${class_id}`),
  uploadCurriculum: (class_id, formData) =>
    fetch(`${API_URL}/school/curriculum/upload/${class_id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      body: formData,
    }).then((r) => r.json()),
  getCurriculum: (class_id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/school/curriculum/${class_id}${qs ? `?${qs}` : ''}`);
  },

  // Lessons (school view)
  getLessons: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/school/lessons${qs ? `?${qs}` : ''}`);
  },
  submitEditRequest: (lesson_id, data) =>
    post(`/school/lessons/${lesson_id}/edit-request`, data),
  getEditRequests: () => get('/school/lessons/edit-requests'),

  // Students
  getStudents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/school/students${qs ? `?${qs}` : ''}`);
  },
  getStudent: (student_id) => get(`/school/students/${student_id}`),
  promoteStudent: (student_id, data) =>
    post(`/school/students/${student_id}/promotion`, data),
  bulkPromote: (promotions) =>
    post('/school/students/promotions/bulk', { promotions }),

  // Sessions
  getSessions: () => get('/school/sessions'),

  // Results
  getResultsTemplate: (class_id, term) =>
    get(`/school/results/template/${class_id}/${term}`),
  uploadResults: (formData) =>
    fetch(`${API_URL}/school/results/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      body: formData,
    }).then((r) => r.json()),
  submitManualResult: (data) => post('/school/results/manual', data),
  getResults: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/school/results${qs ? `?${qs}` : ''}`);
  },

  // Fees
  getFees: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/school/fees${qs ? `?${qs}` : ''}`);
  },
  createFee: (data) => post('/school/fees', data),
  acknowledgeFee: (fee_id) => post(`/school/fees/${fee_id}/acknowledge`, {}),
};

// ── Content & Learning ────────────────────────────────────────────────────────
export const lessons = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/lessons${qs ? `?${qs}` : ''}`);
  },
  get: (lesson_id) => get(`/lessons/${lesson_id}`),
  updateProgress: (lesson_id, data) => post(`/lessons/${lesson_id}/progress`, data),

  // Quizzes
  startQuiz: (lesson_id) => post(`/lessons/${lesson_id}/quiz/start`, {}),
  submitQuiz: (lesson_id, data) => post(`/lessons/${lesson_id}/quiz/submit`, data),
  getAttempts: (lesson_id) => get(`/lessons/${lesson_id}/quiz/attempts`),
};

// ── Exams ─────────────────────────────────────────────────────────────────────
export const exams = {
  getWindows: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/exams/windows${qs ? `?${qs}` : ''}`);
  },
  register: (window_id) => post('/exams/register', { window_id }),
  getRegistrations: () => get('/exams/registrations'),
  getSlot: (registration_id) => get(`/exams/registrations/${registration_id}/slot`),
  startExam: (registration_id) => post(`/exams/${registration_id}/start`, {}),
  submitExam: (registration_id, data) => post(`/exams/${registration_id}/submit`, data),
  uploadProof: (registration_id, formData) =>
    fetch(`${API_URL}/exams/${registration_id}/upload-proof`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      body: formData,
    }).then((r) => r.json()),
};

// ── Tutors ────────────────────────────────────────────────────────────────────
export const tutors = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/tutors${qs ? `?${qs}` : ''}`);
  },
  get: (tutor_id) => get(`/tutors/${tutor_id}`),
  book: (tutor_id, data) => post(`/tutors/${tutor_id}/book`, data),
  getSessions: () => get('/tutors/sessions'),
  confirmSession: (session_id) => post(`/tutors/sessions/${session_id}/confirm`, {}),
  cancelSession: (session_id, reason) =>
    post(`/tutors/sessions/${session_id}/cancel`, { reason }),
};

// ── Wallet ────────────────────────────────────────────────────────────────────
export const wallet = {
  getBalance: async () => {
    try {
      const data = await get('/wallet/balance');
      return data.balance ?? 0;
    } catch (_) {
      return 0;
    }
  },
  getTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/wallet/transactions${qs ? `?${qs}` : ''}`);
  },
  send: (data) => post('/wallet/send', data),
  convertFiat: (data) => post('/wallet/convert', data),
  getStats: () => get('/wallet/stats'),
};

// ── Marketplace ───────────────────────────────────────────────────────────────
export const marketplace = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/marketplace${qs ? `?${qs}` : ''}`);
  },
  get: (item_id) => get(`/marketplace/${item_id}`),
  buy: (item_id) => post(`/marketplace/${item_id}/buy`, {}),
  list_item: (data) => post('/marketplace', data),
  delist: (item_id) => del(`/marketplace/${item_id}`),
};

// ── AI Tutor ──────────────────────────────────────────────────────────────────
export const aiTutor = {
  chat: (messages, context = {}) => post('/ai-tutor/chat', { messages, context }),
  getRecommendations: () => get('/ai-tutor/recommendations'),
  getHistory: () => get('/ai-tutor/history'),
};

// ── Profile ───────────────────────────────────────────────────────────────────
export const profile = {
  getStats: () => get('/profile/stats'),
  getAchievements: () => get('/profile/achievements'),
  uploadAvatar: (formData) =>
    fetch(`${API_URL}/profile/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      body: formData,
    }).then((r) => r.json()),
  deleteAccount: () => del('/profile/account'),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const admin = {
  // Dashboard stats
  getStats: () => get('/admin/stats'),

  // Users
  getUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/admin/users${qs ? `?${qs}` : ''}`);
  },
  getUser: (user_id) => get(`/admin/users/${user_id}`),
  suspendUser: (user_id) => post(`/admin/users/${user_id}/suspend`, {}),
  activateUser: (user_id) => post(`/admin/users/${user_id}/activate`, {}),
  deleteUser: (user_id) => del(`/admin/users/${user_id}`),

  // Partner Applications
  getApplications: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/admin/partners/applications${qs ? `?${qs}` : ''}`);
  },
  reviewApplication: (app_id, data) =>
    patch(`/admin/partners/applications/${app_id}`, data),

  // Partners
  getPartners: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/admin/partners${qs ? `?${qs}` : ''}`);
  },
  suspendPartner: (partner_id) => post(`/admin/partners/${partner_id}/suspend`, {}),
  activatePartner: (partner_id) => post(`/admin/partners/${partner_id}/activate`, {}),

  // Lessons
  getLessons: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/admin/lessons${qs ? `?${qs}` : ''}`);
  },
  createLesson: (data) => post('/admin/lessons', data),
  updateLesson: (lesson_id, data) => patch(`/admin/lessons/${lesson_id}`, data),
  publishLesson: (lesson_id) => post(`/admin/lessons/${lesson_id}/publish`, {}),
  aiGenerate: (data) => post('/admin/lessons/ai-generate', data),
  getEditRequests: () => get('/admin/lessons/edit-requests'),
  reviewEditRequest: (request_id, data) =>
    patch(`/admin/lessons/edit-requests/${request_id}`, data),

  // Quizzes
  getQuestions: (lesson_id) => get(`/admin/lessons/${lesson_id}/questions`),
  createQuestion: (lesson_id, data) =>
    post(`/admin/lessons/${lesson_id}/questions`, data),
  updateQuestion: (question_id, data) =>
    patch(`/admin/questions/${question_id}`, data),
  deleteQuestion: (question_id) => del(`/admin/questions/${question_id}`),

  // Exams
  getExamWindows: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/admin/exams/windows${qs ? `?${qs}` : ''}`);
  },
  createExamWindow: (data) => post('/admin/exams/windows', data),
  updateExamWindow: (window_id, data) =>
    patch(`/admin/exams/windows/${window_id}`, data),
  getExamRegistrations: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/admin/exams/registrations${qs ? `?${qs}` : ''}`);
  },
  verifyExamProof: (registration_id, data) =>
    post(`/admin/exams/registrations/${registration_id}/verify`, data),
  releaseEscrow: (registration_id) =>
    post(`/admin/exams/registrations/${registration_id}/release-escrow`, {}),

  // Tutors
  getTutorApplications: () => get('/admin/tutors/applications'),
  reviewTutorApplication: (tutor_id, data) =>
    patch(`/admin/tutors/applications/${tutor_id}`, data),

  // Wallet settings
  getWalletSettings: () => get('/admin/wallet/settings'),
  updateWalletSettings: (data) => patch('/admin/wallet/settings', data),

  // Notifications
  sendNotification: (data) => post('/admin/notifications/send', data),
  getNotificationHistory: () => get('/admin/notifications/history'),

  // Marketplace
  getMarketplaceItems: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/admin/marketplace${qs ? `?${qs}` : ''}`);
  },
  approveMarketplaceItem: (item_id) =>
    post(`/admin/marketplace/${item_id}/approve`, {}),
  rejectMarketplaceItem: (item_id) =>
    post(`/admin/marketplace/${item_id}/reject`, {}),

  // School Curriculum (admin view)
  getSchoolCurriculum: (school_id) => get(`/admin/schools/${school_id}/curriculum`),

  // Audit Log
  getAuditLog: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/admin/audit${qs ? `?${qs}` : ''}`);
  },
};

// ── Partner (School/CBT Centre) Portal ────────────────────────────────────────
export const partner = {
  getProfile: () => get('/partner/profile'),
  updateProfile: (data) => patch('/partner/profile', data),
  getDashboardStats: () => get('/partner/stats'),
  getWallet: () => get('/partner/wallet'),
  getTransactions: () => get('/partner/wallet/transactions'),

  // School-specific
  getStaff: () => get('/partner/school/staff'),
  inviteStaff: (email, role) => post('/partner/school/staff/invite', { email, role }),
  removeStaff: (staff_id) => del(`/partner/school/staff/${staff_id}`),
  getStudents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/partner/school/students${qs ? `?${qs}` : ''}`);
  },
  getResults: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/partner/school/results${qs ? `?${qs}` : ''}`);
  },
  getFees: () => get('/partner/school/fees'),
  getSessions: () => get('/partner/school/sessions'),

  // Classes
  getClasses: () => get('/partner/school/classes'),
  createClass: (data) => post('/partner/school/classes', data),
  deleteClass: (class_id) => del(`/partner/school/classes/${class_id}`),

  // CBT Centre
  getCbtProfile: () => get('/partner/cbt/profile'),
  getCbtStats: () => get('/partner/cbt/stats'),
  updateCbtProfile: (data) => patch('/partner/cbt/profile', data),
};

// ── Tutor Portal ──────────────────────────────────────────────────────────────
export const tutorPortal = {
  getProfile: () => get('/tutor/profile'),
  updateProfile: (data) => patch('/tutor/profile', data),
  getSessions: () => get('/tutor/sessions'),
  confirmSession: (session_id) => post(`/tutor/sessions/${session_id}/confirm`, {}),
  cancelSession: (session_id, reason) =>
    post(`/tutor/sessions/${session_id}/cancel`, { reason }),
  setAvailability: (data) => post('/tutor/availability', data),
  getEarnings: () => get('/tutor/earnings'),
};
const upload = async (path, formData) => {
  const token = localStorage.getItem('reads_token') || localStorage.getItem('access_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: formData });
  if (!res.ok) await handleError(res, `UPLOAD ${path}`);
  return res.json();
};
// ── Single export ──────────────────────────────────────────────────────────────
export const api = {
  // Base HTTP methods
  get,
  post,
  patch,
  del,
  upload,

  // Modules
  auth,
  students,
  notifications,
  school,
  lessons,
  exams,
  tutors,
  wallet,
  marketplace,
  aiTutor,
  profile,
  admin,
  partner,
  tutorPortal,
};