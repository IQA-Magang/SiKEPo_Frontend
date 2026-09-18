export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const TOKEN_KEY = 'sikepo_token';
const USER_KEY = 'sikepo_user';

// ------------------------------------------------------------------
// Helper: ambil token dari sessionStorage (dengan migrasi legacy localStorage)
// ------------------------------------------------------------------
export function getToken() {
  let token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) {
    // Migrasi otomatis jika sebelumnya tersimpan di localStorage
    const legacy = localStorage.getItem(TOKEN_KEY);
    if (legacy) {
      sessionStorage.setItem(TOKEN_KEY, legacy);
      localStorage.removeItem(TOKEN_KEY);
      token = legacy;
    }
  }
  return token;
}

// ------------------------------------------------------------------
// Helper: ambil user yang sedang login
// ------------------------------------------------------------------
export function getCurrentUser() {
  try {
    let raw = sessionStorage.getItem(USER_KEY);
    if (!raw) {
      const legacy = localStorage.getItem(USER_KEY);
      if (legacy) {
        sessionStorage.setItem(USER_KEY, legacy);
        localStorage.removeItem(USER_KEY);
        raw = legacy;
      }
    }
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// Central Error Formatter
// ------------------------------------------------------------------
export function parseApiError(data, status) {
  if (!data) {
    if (status === 401) return 'Sesi telah berakhir atau belum terautentikasi. Silakan login kembali.';
    if (status === 403) return 'Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.';
    if (status === 404) return 'Resource yang diminta tidak ditemukan.';
    if (status >= 500) return 'Terjadi gangguan pada server. Silakan coba beberapa saat lagi.';
    return `Terjadi kesalahan (HTTP ${status || 'Unknown'})`;
  }

  if (typeof data === 'string') return data;
  if (data.message && typeof data.message === 'string') return data.message;
  if (data.error && typeof data.error === 'string') return data.error;
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.map(e => e.message || e).join(', ');
  }

  return `Operasi gagal (Status ${status})`;
}

// ------------------------------------------------------------------
// fetchWithAuth — wrapper dengan Bearer token otomatis & central error handling
// ------------------------------------------------------------------
export async function fetchWithAuth(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  } catch (networkErr) {
    const err = new Error('Koneksi jaringan terputus atau backend tidak dapat dijangkau.');
    err.isNetworkError = true;
    throw err;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // 401: Auto Logout & cleanup
    if (res.status === 401) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new CustomEvent('sikepo_session_expired', {
        detail: { message: 'Sesi login Anda telah berakhir. Silakan masuk kembali.' }
      }));
    }

    // 403: Forbidden handling
    if (res.status === 403) {
      window.dispatchEvent(new CustomEvent('sikepo_auth_forbidden', {
        detail: { message: data?.message || 'Akses ditolak: Role Anda tidak memiliki izin untuk tindakan ini.' }
      }));
    }

    const errorMsg = parseApiError(data, res.status);
    const err = new Error(errorMsg);
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

// ID ini adalah primary key peralatan yang dipakai oleh seluruh endpoint.
// Alias dipertahankan agar frontend tetap kompatibel dengan bentuk respons lama.
export function getEquipmentId(peralatan) {
  return peralatan?.id ?? peralatan?.peralatan_id ?? peralatan?.id_peralatan ?? peralatan?.equipment_id ?? null;
}

// Normalisasi kategori_id vs kategori_peralatan_id
export function getEquipmentCategoryId(peralatan) {
  return peralatan?.kategori_id ?? peralatan?.kategori_peralatan_id ?? null;
}

// =============================================================
// AUTH
// POST /api/users/login
// GET  /recaptcha/sitekey
// =============================================================
export const authApi = {
  login: async ({ email, password, recaptcha_token }) => {
    // Bersihkan sesi lama sebelum mengirim request login baru
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    let res;
    try {
      res = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, recaptcha_token }),
      });
    } catch (networkErr) {
      throw new Error('Koneksi jaringan terputus atau server backend tidak dapat dijangkau.');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      const errMsg = parseApiError(data, res.status);
      throw new Error(errMsg || `Login gagal (${res.status})`);
    }

    // Simpan ke sessionStorage (Prioritas 1: Hindari localStorage untuk mitigasi risiko XSS)
    sessionStorage.setItem(TOKEN_KEY, data.data.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.data.user));

    return data.data;
  },

  logout: () => {
    // Hapus seluruh data sesi dan kredensial sensitif dari semua tempat
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new CustomEvent('sikepo_auth_logout'));
  },

  getRecaptchaSiteKey: async () => {
    try {
      const res = await fetch(`${API_BASE}/recaptcha/sitekey`);
      const data = await res.json().catch(() => ({}));
      return data.site_key || null;
    } catch {
      return null;
    }
  },
};

// =============================================================
// USERS  — /api/users
// GET /          → { success, data: User[] }
// GET /:id       → { success, data: User }
// POST /         → { success, data: User }  [admin]
// PUT /:id       → { success, data: User }  [admin]
// PUT /me/password → { success, message }
// DELETE /:id    → { success }              [admin]
// =============================================================
export const usersApi = {
  getAll: () => fetchWithAuth('/api/users'),
  getById: (id) => fetchWithAuth(`/api/users/${id}`),
  create: (body) =>
    fetchWithAuth('/api/users/', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) =>
    fetchWithAuth(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (body) =>
    fetchWithAuth('/api/users/me/password', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
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


export const KATEGORI_OPTIONS = [
  { id: 1, label: 'Alat Ukur',            desc: 'Peralatan uji dengan parameter metrologi & kalibrasi' },
  { id: 2, label: 'Alat Bantu',           desc: 'Peralatan pendukung dengan pemeriksaan berkala' },
  { id: 3, label: 'Artefak Acuan',        desc: 'Standar referensi dengan karakterisasi acuan' },
  { id: 4, label: 'Komponen Pendukung',   desc: 'Material/komponen pendukung operasional' },
];

export const STATUS_ALAT_OPTIONS = [
  'Aktif', 'Dipinjam', 'Dalam Kalibrasi', 'Rusak', 'Dihapuskan'
];
