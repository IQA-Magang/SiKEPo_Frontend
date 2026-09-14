// Ponytail: lightweight fetch wrapper for backend API with JWT Bearer auth
// Gunakan env variable VITE_API_BASE untuk production (set di Vercel dashboard)
// Fallback ke localhost:5000 untuk development lokal
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

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
    // If token expired or unauthorized, clear invalid session
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

export const authApi = {
  // POST /api/users/login
  login: async ({ email, password, recaptcha_token }) => {
    const response = await fetch(`${API_BASE}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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

  // GET /recaptcha/sitekey
  getSiteKey: async () => {
    const response = await fetch(`${API_BASE}/recaptcha/sitekey`);
    if (!response.ok) return null;
    const data = await response.json().catch(() => ({}));
    return data?.site_key || null;
  }
};

export function getStoredUser() {
  const raw = localStorage.getItem('sikepo_user');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse sikepo_user from localStorage', e);
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
  // Dispatch custom window event so all open views and Topbar stay reactive in real-time
  window.dispatchEvent(new CustomEvent('sikepo_user_changed', { detail: user }));
}

export const userApi = {
  // GET /api/users (List all users)
  getAll: () => fetchWithAuth('/api/users'),

  // GET /api/users/:id
  getById: (id) => fetchWithAuth(`/api/users/${id}`),

  // POST /api/users (Admin only)
  create: (userData) =>
    fetchWithAuth('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  // PUT /api/users/:id (Admin only)
  update: (id, userData) => {
    if (!id) {
      return Promise.reject(new Error('ID user tidak valid untuk pembaruan data'));
    }
    return fetchWithAuth(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  // DELETE /api/users/:id (Admin only)
  delete: (id) =>
    fetchWithAuth(`/api/users/${id}`, {
      method: 'DELETE'
    })
};

// ========================================
// LABS API (/api/v1/labs)
// ========================================
export const labsApi = {
  // GET /api/v1/labs
  getAll: () => fetchWithAuth('/api/v1/labs'),

  // GET /api/v1/labs/:id
  getById: (id) => fetchWithAuth(`/api/v1/labs/${id}`),

  // POST /api/v1/labs (Admin only)
  create: (data) =>
    fetchWithAuth('/api/v1/labs', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // PUT /api/v1/labs/:id (Admin only)
  update: (id, data) =>
    fetchWithAuth(`/api/v1/labs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // DELETE /api/v1/labs/:id (Admin only)
  delete: (id) =>
    fetchWithAuth(`/api/v1/labs/${id}`, {
      method: 'DELETE'
    })
};

// ========================================
// RUANGAN API (/api/v1/ruangan)
// ========================================
export const ruanganApi = {
  // GET /api/v1/ruangan
  getAll: () => fetchWithAuth('/api/v1/ruangan'),

  // GET /api/v1/ruangan/:id
  getById: (id) => fetchWithAuth(`/api/v1/ruangan/${id}`),

  // GET /api/v1/ruangan/labs/:labs_id
  getByLabsId: (labsId) => fetchWithAuth(`/api/v1/ruangan/labs/${labsId}`),

  // GET /api/v1/ruangan/pic/:pic_user_id
  getByPicId: (picUserId) => fetchWithAuth(`/api/v1/ruangan/pic/${picUserId}`),

  // POST /api/v1/ruangan (Admin only)
  create: (data) =>
    fetchWithAuth('/api/v1/ruangan', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // PUT /api/v1/ruangan/:id (Admin only)
  update: (id, data) =>
    fetchWithAuth(`/api/v1/ruangan/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // DELETE /api/v1/ruangan/:id (Admin only)
  delete: (id) =>
    fetchWithAuth(`/api/v1/ruangan/${id}`, {
      method: 'DELETE'
    })
};

// ========================================
// KELOMPOK ASSET API (/api/v1/kelompok-asset)
// ========================================
export const kelompokAssetApi = {
  // GET /api/v1/kelompok-asset (Search, Lab filter, PIC filter)
  getAll: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.lab_id) q.append('lab_id', params.lab_id);
    if (params.pic_id) q.append('pic_id', params.pic_id);

    const queryStr = q.toString();
    return fetchWithAuth(`/api/v1/kelompok-asset${queryStr ? `?${queryStr}` : ''}`);
  },

  // GET /api/v1/kelompok-asset/:id
  getById: (id) => fetchWithAuth(`/api/v1/kelompok-asset/${id}`),

  // POST /api/v1/kelompok-asset (Admin / Auth)
  create: (data) =>
    fetchWithAuth('/api/v1/kelompok-asset', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // PUT /api/v1/kelompok-asset/:id (Admin / Auth)
  update: (id, data) =>
    fetchWithAuth(`/api/v1/kelompok-asset/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // DELETE /api/v1/kelompok-asset/:id (Admin / Auth)
  delete: (id) =>
    fetchWithAuth(`/api/v1/kelompok-asset/${id}`, {
      method: 'DELETE'
    })
};

// ========================================
// PERALATAN API (/api/v1/peralatan)
// ========================================
export const peralatanApi = {
  // GET /api/v1/peralatan
  getAll: (params = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.append('page', params.page);
    if (params.limit) q.append('limit', params.limit);
    if (params.search) q.append('search', params.search);
    if (params.ruangan_id) q.append('ruangan_id', params.ruangan_id);
    if (params.pic_id) q.append('pic_id', params.pic_id);
    if (params.status_kelayakan) q.append('status_kelayakan', params.status_kelayakan);

    const queryStr = q.toString();
    return fetchWithAuth(`/api/v1/peralatan${queryStr ? `?${queryStr}` : ''}`);
  },

  // GET /api/v1/peralatan/:id
  getById: (id) => fetchWithAuth(`/api/v1/peralatan/${id}`),

  // POST /api/v1/peralatan
  create: (data) =>
    fetchWithAuth('/api/v1/peralatan', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // PUT /api/v1/peralatan/:id
  update: (id, data) =>
    fetchWithAuth(`/api/v1/peralatan/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // DELETE /api/v1/peralatan/:id
  delete: (id) =>
    fetchWithAuth(`/api/v1/peralatan/${id}`, {
      method: 'DELETE'
    })
};

// ========================================
// DETAIL PEMINJAMAN API (/api/detail-peminjaman)
// ========================================
export const peminjamanApi = {
  // GET /api/detail-peminjaman
  getAll: () => fetchWithAuth('/api/detail-peminjaman'),

  // GET /api/detail-peminjaman/:id
  getById: (id) => fetchWithAuth(`/api/detail-peminjaman/${id}`),

  // GET /api/detail-peminjaman/peminjaman/:peminjaman_id
  getByPeminjamanId: (peminjamanId) =>
    fetchWithAuth(`/api/detail-peminjaman/peminjaman/${peminjamanId}`),

  // POST /api/detail-peminjaman (Admin, Staff, Manager)
  create: (data) =>
    fetchWithAuth('/api/detail-peminjaman', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // PUT /api/detail-peminjaman/:id (Admin, Staff, Manager)
  update: (id, data) =>
    fetchWithAuth(`/api/detail-peminjaman/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // PUT /api/detail-peminjaman/:id/approve (Manager, Staff)
  approve: (id, note = '') =>
    fetchWithAuth(`/api/detail-peminjaman/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ verification_note: note })
    }),

  // PUT /api/detail-peminjaman/:id/reject (Manager, Staff)
  reject: (id, note = '') =>
    fetchWithAuth(`/api/detail-peminjaman/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ verification_note: note })
    }),

  // PUT /api/detail-peminjaman/:id/kondisi-pinjam (Admin, Staff, Manager)
  setKondisiPinjam: (id, { kondisi, catatan = '' }) =>
    fetchWithAuth(`/api/detail-peminjaman/${id}/kondisi-pinjam`, {
      method: 'PUT',
      body: JSON.stringify({ kondisi, catatan })
    }),

  // PUT /api/detail-peminjaman/:id/kondisi-kembali (Admin, Staff, Manager)
  setKondisiKembali: (id, { kondisi, catatan = '' }) =>
    fetchWithAuth(`/api/detail-peminjaman/${id}/kondisi-kembali`, {
      method: 'PUT',
      body: JSON.stringify({ kondisi, catatan })
    }),

  // DELETE /api/detail-peminjaman/:id (Admin, Manager)
  delete: (id) =>
    fetchWithAuth(`/api/detail-peminjaman/${id}`, {
      method: 'DELETE'
    })
};

// ========================================
// VERIFIKASI API (/api/verifikasi)
// ========================================
export const verifikasiApi = {
  // GET /api/verifikasi
  getAll: () => fetchWithAuth('/api/verifikasi'),

  // GET /api/verifikasi/:id
  getById: (id) => fetchWithAuth(`/api/verifikasi/${id}`),

  // GET /api/verifikasi/peralatan/:peralatan_id
  getByPeralatan: (peralatanId) =>
    fetchWithAuth(`/api/verifikasi/peralatan/${peralatanId}`),

  // POST /api/verifikasi (Staff PIC)
  create: (data) =>
    fetchWithAuth('/api/verifikasi', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // PUT /api/verifikasi/:id/approve (Manager)
  approve: (id) =>
    fetchWithAuth(`/api/verifikasi/${id}/approve`, {
      method: 'PUT'
    }),

  // DELETE /api/verifikasi/:id (Admin)
  delete: (id) =>
    fetchWithAuth(`/api/verifikasi/${id}`, {
      method: 'DELETE'
    })
};

