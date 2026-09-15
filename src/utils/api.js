// =============================================================
// SiKEPo Frontend — API Client
// Semua data diambil LANGSUNG dari backend Go Fiber (localhost:5000)
// Tidak ada localStorage fallback / mock data
// Field names disesuaikan 1:1 dengan model GORM backend
// =============================================================

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
const EQUIPMENT_CACHE_KEY = 'sikepo_created_equipment';

export function getCachedEquipment() {
  try {
    const cached = JSON.parse(localStorage.getItem(EQUIPMENT_CACHE_KEY) || '[]');
    return Array.isArray(cached) ? cached : [];
  } catch {
    return [];
  }
}

export function cacheEquipment(equipment) {
  const current = getCachedEquipment();
  const identity = equipment.id || equipment.nomor_aset;
  const next = [equipment, ...current.filter((item) => (item.id || item.nomor_aset) !== identity)];
  localStorage.setItem(EQUIPMENT_CACHE_KEY, JSON.stringify(next));
  return next;
}

export function formatPhotoUrl(foto) {
  if (!foto) return null;
  if (typeof foto !== 'string') return null;
  const clean = foto.trim();
  if (!clean || clean === 'null' || clean === 'undefined' || clean === 'none' || clean === '-') return null;

  if (clean.startsWith('data:image/')) {
    return clean;
  }
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  // Base64 string tanpa header prefix data:image/
  if (/^[A-Za-z0-9+/=]{80,}$/.test(clean)) {
    return `data:image/png;base64,${clean}`;
  }

  const normalizedPath = clean.startsWith('/') ? clean : `/${clean}`;
  return `${API_BASE}${normalizedPath}`;
}

// -------------------------------------------------------------
// fetchWithAuth — wrapper dengan JWT Bearer header
// -------------------------------------------------------------
export async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('sikepo_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('sikepo_token');
      localStorage.removeItem('sikepo_user');
      window.dispatchEvent(new CustomEvent('sikepo_session_expired'));
    }
    const errorMsg = data?.message || data?.error || `HTTP error ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

// -------------------------------------------------------------
// AUTH — Login & ReCaptcha
// POST /api/users/login  →  { success, token, data: User }
// GET  /recaptcha/sitekey → { site_key }
// -------------------------------------------------------------
export const authApi = {
  login: async ({ email, password, recaptcha_token }) => {
    const response = await fetch(`${API_BASE}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, recaptcha_token })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      const errorMsg = data?.message || data?.error || `Login gagal (Status ${response.status})`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }
    return data;
  },

  getSiteKey: async () => {
    const response = await fetch(`${API_BASE}/recaptcha/sitekey`);
    if (!response.ok) return null;
    const data = await response.json().catch(() => ({}));
    return data?.site_key || null;
  }
};

// -------------------------------------------------------------
// Session helpers
// -------------------------------------------------------------
export function getStoredUser() {
  const raw = localStorage.getItem('sikepo_user');
  if (raw) {
    try { return JSON.parse(raw); } catch (e) {
      console.error('Failed to parse sikepo_user', e);
    }
  }
  return null;
}

export function setStoredUser(user) {
  if (!user) {
    localStorage.removeItem('sikepo_user');
  } else {
    localStorage.setItem('sikepo_user', JSON.stringify(user));
  }
  window.dispatchEvent(new CustomEvent('sikepo_user_changed', { detail: user }));
}

// -------------------------------------------------------------
// USERS — /api/users
// Model: { user_id, nip, name, email, role, position, pic }
// Routes: GET all, GET :id, POST, PUT :id (admin), DELETE :id (admin)
// -------------------------------------------------------------
export const userApi = {
  getAll:  ()          => fetchWithAuth('/api/users'),
  getById: (id)        => fetchWithAuth(`/api/users/${id}`),
  create:  (data)      => fetchWithAuth('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  update:  (id, data)  => {
    if (!id) return Promise.reject(new Error('ID user tidak valid'));
    return fetchWithAuth(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  delete: (id) => fetchWithAuth(`/api/users/${id}`, { method: 'DELETE' })
};

// -------------------------------------------------------------
// LABS — /api/labs
// Model: { id, nama_labs, kode_labs, manager_id, manager? }
// Routes: GET all, GET :id, POST (admin), PUT :id (admin), DELETE :id (admin)
// -------------------------------------------------------------
export const labsApi = {
  getAll:  ()          => fetchWithAuth('/api/labs'),
  getById: (id)        => fetchWithAuth(`/api/labs/${id}`),
  create:  (data)      => fetchWithAuth('/api/labs', { method: 'POST', body: JSON.stringify(data) }),
  update:  (id, data)  => fetchWithAuth(`/api/labs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete:  (id)        => fetchWithAuth(`/api/labs/${id}`, { method: 'DELETE' })
};

// -------------------------------------------------------------
// RUANGAN — /api/ruangan
// Model: { id, nama_ruangan, kode_ruangan, lantai_ruangan, labs_id, pic_user_id, labs?, pic_user? }
// Routes: GET all, GET :id, GET /labs/:labs_id, GET /pic/:pic_user_id,
//         POST (admin), PUT :id (admin), DELETE :id (admin)
// -------------------------------------------------------------
export const ruanganApi = {
  getAll:      ()             => fetchWithAuth('/api/ruangan'),
  getById:     (id)           => fetchWithAuth(`/api/ruangan/${id}`),
  getByLabsId: (labsId)       => fetchWithAuth(`/api/ruangan/labs/${labsId}`),
  getByPicId:  (picUserId)    => fetchWithAuth(`/api/ruangan/pic/${picUserId}`),
  create:      (data)         => fetchWithAuth('/api/ruangan', { method: 'POST', body: JSON.stringify(data) }),
  update:      (id, data)     => fetchWithAuth(`/api/ruangan/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete:      (id)           => fetchWithAuth(`/api/ruangan/${id}`, { method: 'DELETE' })
};

// -------------------------------------------------------------
// KELOMPOK ASSET — /api/kelompok-asset
// Model: { id, lab_id, pic_id, kode, nama, lab?, pic? }
// Routes: GET all, GET :id, POST, PUT :id, DELETE :id
// -------------------------------------------------------------
export const kelompokAssetApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search)  q.append('search',  params.search);
    if (params.lab_id)  q.append('lab_id',  params.lab_id);
    if (params.pic_id)  q.append('pic_id',  params.pic_id);
    const qs = q.toString();
    return fetchWithAuth(`/api/kelompok-asset${qs ? `?${qs}` : ''}`);
  },
  getById: (id)        => fetchWithAuth(`/api/kelompok-asset/${id}`),
  create:  (data)      => fetchWithAuth('/api/kelompok-asset', { method: 'POST', body: JSON.stringify(data) }),
  update:  (id, data)  => fetchWithAuth(`/api/kelompok-asset/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete:  (id)        => fetchWithAuth(`/api/kelompok-asset/${id}`, { method: 'DELETE' })
};

// -------------------------------------------------------------
// PERALATAN — /api/peralatan
// Model: { id, nomor_aset, nama_peralatan, kategori_id, kelompok_aset_id,
//          ruangan_id, pic_id, merek, tipe_model, nomor_seri, foto,
//          status_alat, keterangan, kategori_peralatan_id }
// Routes AKTIF: GET /, GET /:id, POST /, GET /:id/qr
// Routes BELUM ADA: PUT /:id, DELETE /:id
// -------------------------------------------------------------
export const peralatanApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.ruangan_id) query.append('ruangan_id', params.ruangan_id);
    if (params.status_alat) query.append('status_alat', params.status_alat);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return fetchWithAuth(`/api/peralatan${suffix}`);
  },

  getById: (id) => fetchWithAuth(`/api/peralatan/${id}`),

  // POST /api/peralatan — AKTIF
  // Payload: CreatePeralatanRequest { nomor_aset, nama_peralatan, kategori_id,
  //   kelompok_aset_id, ruangan_id, pic_id, merek, tipe_model, nomor_seri,
  //   foto, status_alat, keterangan, detail: map[string]interface{} }
  create: (data) =>
    fetchWithAuth('/api/peralatan', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // GET /api/peralatan/next-nomor-aset
  getNextNomorAset: (kelompokAsetId = '') => {
    const qs = kelompokAsetId ? `?kelompok_aset_id=${kelompokAsetId}` : '';
    return fetchWithAuth(`/api/peralatan/next-nomor-aset${qs}`);
  },

  // GET /api/peralatan/:id/qr — AKTIF, returns PNG image
  getQrCodeUrl: (id) => `${API_BASE}/api/peralatan/${id}/qr`
};

// -------------------------------------------------------------
// DOKUMEN PERALATAN — /api/dokumen-peralatan
// Routes AKTIF: GET all, GET /peralatan/:id, GET /:id,
//               POST (admin), PUT :id (admin), DELETE :id (admin)
// -------------------------------------------------------------
export const dokumenPeralatanApi = {
  getAll:          ()             => fetchWithAuth('/api/dokumen-peralatan'),
  getByPeralatanId: (peralatanId) => fetchWithAuth(`/api/dokumen-peralatan/peralatan/${peralatanId}`),
  getById:         (id)           => fetchWithAuth(`/api/dokumen-peralatan/${id}`),
  create:          (data)         => fetchWithAuth('/api/dokumen-peralatan', { method: 'POST', body: JSON.stringify(data) }),
  update:          (id, data)     => fetchWithAuth(`/api/dokumen-peralatan/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete:          (id)           => fetchWithAuth(`/api/dokumen-peralatan/${id}`, { method: 'DELETE' })
};

