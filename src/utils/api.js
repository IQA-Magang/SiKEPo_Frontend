// =============================================================
// SiKEPo Frontend — API Client
// Terhubung langsung ke backend Go Fiber (https://si-ke-po-backend-dkfe-31rhkxj8d-rendy-kamaluddins-projects.vercel.app)
// JWT token disimpan di localStorage sebagai 'sikepo_token'
// =============================================================

export const API_BASE = import.meta.env.VITE_API_BASE || 'https://si-ke-po-backend-dkfe-31rhkxj8d-rendy-kamaluddins-projects.vercel.app';

// ------------------------------------------------------------------
// Helper: ambil token dari localStorage
// ------------------------------------------------------------------
function getToken() {
  return localStorage.getItem('sikepo_token');
}

// ------------------------------------------------------------------
// Helper: ambil user yang sedang login
// ------------------------------------------------------------------
export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('sikepo_user') || 'null');
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// fetchWithAuth — wrapper dengan Bearer token otomatis
// ------------------------------------------------------------------
export async function fetchWithAuth(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('sikepo_token');
      localStorage.removeItem('sikepo_user');
      window.dispatchEvent(new CustomEvent('sikepo_session_expired'));
    }
    const msg = data?.message || data?.error || `HTTP error ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ------------------------------------------------------------------
// fetchFormData — untuk upload file (multipart)
// ------------------------------------------------------------------
export async function fetchFormData(endpoint, formData) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || `Upload gagal (${res.status})`);
  }
  return data;
}

// ------------------------------------------------------------------
// Helper: format URL foto/gambar
// ------------------------------------------------------------------
export function formatPhotoUrl(foto) {
  if (!foto) return null;
  const clean = String(foto).trim();
  if (!clean || ['null', 'undefined', 'none', '-'].includes(clean)) return null;
  if (clean.startsWith('data:image/') || clean.startsWith('http')) return clean;
  const path = clean.startsWith('/') ? clean : `/${clean}`;
  return `${API_BASE}${path}`;
}

// =============================================================
// AUTH
// POST /api/users/login
// GET  /recaptcha/sitekey
// =============================================================
export const authApi = {
  login: async ({ email, password, recaptcha_token }) => {
    const res = await fetch(`${API_BASE}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, recaptcha_token }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data?.message || `Login gagal (${res.status})`);
    }
    // Simpan ke localStorage
    localStorage.setItem('sikepo_token', data.data.token);
    localStorage.setItem('sikepo_user', JSON.stringify(data.data.user));
    return data.data;
  },

  logout: () => {
    localStorage.removeItem('sikepo_token');
    localStorage.removeItem('sikepo_user');
  },

  getRecaptchaSiteKey: async () => {
    const res = await fetch(`${API_BASE}/recaptcha/sitekey`);
    const data = await res.json().catch(() => ({}));
    return data.site_key || null;
  },
};

// =============================================================
// USERS  — /api/users
// GET /          → { success, data: User[] }
// GET /:id       → { success, data: User }
// POST /         → { success, data: User }  [admin]
// PUT /:id       → { success, data: User }  [admin]
// DELETE /:id    → { success }              [admin]
// =============================================================
export const usersApi = {
  getAll: () => fetchWithAuth('/api/users'),
  getById: (id) => fetchWithAuth(`/api/users/${id}`),
  create: (body) =>
    fetchWithAuth('/api/users/', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) =>
    fetchWithAuth(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => fetchWithAuth(`/api/users/${id}`, { method: 'DELETE' }),
};

// =============================================================
// LABS  — /api/labs
// =============================================================
export const labsApi = {
  getAll: () => fetchWithAuth('/api/labs'),
  getById: (id) => fetchWithAuth(`/api/labs/${id}`),
  create: (body) =>
    fetchWithAuth('/api/labs/', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) =>
    fetchWithAuth(`/api/labs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => fetchWithAuth(`/api/labs/${id}`, { method: 'DELETE' }),
};

// =============================================================
// RUANGAN  — /api/ruangan
// =============================================================
export const ruanganApi = {
  getAll: () => fetchWithAuth('/api/ruangan'),
  getByLabsId: (labsId) => fetchWithAuth(`/api/ruangan/labs/${labsId}`),
  getByPicId: (picId) => fetchWithAuth(`/api/ruangan/pic/${picId}`),
  getById: (id) => fetchWithAuth(`/api/ruangan/${id}`),
  create: (body) =>
    fetchWithAuth('/api/ruangan/', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) =>
    fetchWithAuth(`/api/ruangan/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => fetchWithAuth(`/api/ruangan/${id}`, { method: 'DELETE' }),
};

// =============================================================
// KELOMPOK ASSET  — /api/kelompok-asset
// =============================================================
export const kelompokAssetApi = {
  getAll: () => fetchWithAuth('/api/kelompok-asset'),
  getById: (id) => fetchWithAuth(`/api/kelompok-asset/${id}`),
  create: (body) =>
    fetchWithAuth('/api/kelompok-asset/', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) =>
    fetchWithAuth(`/api/kelompok-asset/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => fetchWithAuth(`/api/kelompok-asset/${id}`, { method: 'DELETE' }),
};

// =============================================================
// PERALATAN  — /api/peralatan
// GET /      → { status, data: Peralatan[] }
// POST /     → { status, nomor_aset, id }
// POST /:id/foto   → multipart upload
// GET  /:id/qr     → image/png
// =============================================================
export const peralatanApi = {
  getAll: () => fetchWithAuth('/api/peralatan'),
  create: (body) =>
    fetchWithAuth('/api/peralatan/', { method: 'POST', body: JSON.stringify(body) }),
  uploadFoto: (id, file) => {
    const form = new FormData();
    form.append('foto', file);
    return fetchFormData(`/api/peralatan/${id}/foto`, form);
  },
  getQRCodeUrl: (id) => `${API_BASE}/api/peralatan/${id}/qr`,
};

// =============================================================
// DOKUMEN PERALATAN  — /api/dokumen-peralatan
// =============================================================
export const dokumenApi = {
  getAll: () => fetchWithAuth('/api/dokumen-peralatan'),
  getByPeralatanId: (id) => fetchWithAuth(`/api/dokumen-peralatan/peralatan/${id}`),
  getById: (id) => fetchWithAuth(`/api/dokumen-peralatan/${id}`),
  create: (body) =>
    fetchWithAuth('/api/dokumen-peralatan/', { method: 'POST', body: JSON.stringify(body) }),
  upload: (peralatanId, file, namaDokumen = file.name) => {
    const form = new FormData();
    form.append('dokumen', file);
    form.append('nama_dokumen', namaDokumen);
    form.append('peralatan_id', String(peralatanId));
    return fetchFormData('/api/dokumen-peralatan/', form);
  },
  update: (id, body) =>
    fetchWithAuth(`/api/dokumen-peralatan/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => fetchWithAuth(`/api/dokumen-peralatan/${id}`, { method: 'DELETE' }),
};

// =============================================================
// NOTIFICATIONS  — /api/notifications  [manager only]
// GET /user/:user_id  → { status, data: Notification[], count }
// PATCH /:id/read     → { status }
// =============================================================
export const notificationApi = {
  getByUserId: (userId) => fetchWithAuth(`/api/notifications/user/${userId}`),
  markRead: (id) =>
    fetchWithAuth(`/api/notifications/${id}/read`, { method: 'PATCH' }),
};

// =============================================================
// KATEGORI PERALATAN  — /api/kategori-peralatan
// =============================================================
export const kategoriApi = {
  getAll: () => fetchWithAuth('/api/kategori-peralatan').catch(() => null),
  getById: (id) => fetchWithAuth(`/api/kategori-peralatan/${id}`).catch(() => null),
  create: (body) =>
    fetchWithAuth('/api/kategori-peralatan/', { method: 'POST', body: JSON.stringify(body) }).catch(() => null),
  update: (id, body) =>
    fetchWithAuth(`/api/kategori-peralatan/${id}`, { method: 'PUT', body: JSON.stringify(body) }).catch(() => null),
  delete: (id) => fetchWithAuth(`/api/kategori-peralatan/${id}`, { method: 'DELETE' }).catch(() => null),
};

export const KATEGORI_OPTIONS = [
  { id: 1, label: 'Alat Ukur',            desc: 'Peralatan uji dengan parameter metrologi & kalibrasi' },
  { id: 2, label: 'Alat Bantu',           desc: 'Peralatan pendukung dengan pemeriksaan berkala' },
  { id: 3, label: 'Artefak Acuan',        desc: 'Standar referensi dengan karakterisasi acuan' },
  { id: 4, label: 'Komponen Pendukung',   desc: 'Material/komponen pendukung operasional' },
];

export const STATUS_ALAT_OPTIONS = [
  'Aktif', 'Dipinjam', 'Dalam Kalibrasi', 'Rusak', 'Dihapuskan'
];
