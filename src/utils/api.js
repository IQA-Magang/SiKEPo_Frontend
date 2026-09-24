export const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000').replace(/\/+$/, '');

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
    if (res.status === 403 && !options.silentForbidden) {
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
// fetchBlobWithAuth — untuk resource binary yang dilindungi autentikasi
// ------------------------------------------------------------------
export async function fetchBlobWithAuth(endpoint) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new Error('Koneksi jaringan terputus atau backend tidak dapat dijangkau.');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(parseApiError(data, res.status));
  }

  return res.blob();
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

// Backend memakai kategori_peralatan_id sebagai foreign key.
// kategori_id tetap didukung untuk respons lama, tetapi nilai 0 bukan ID valid.
export function getEquipmentCategoryId(peralatan) {
  const legacyId = Number(peralatan?.kategori_id);
  if (Number.isInteger(legacyId) && legacyId > 0) return legacyId;

  const categoryId = Number(peralatan?.kategori_peralatan_id);
  return Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null;
}

export const STATIC_EQUIPMENT_CATEGORIES = [
  {
    id: 1,
    label: 'Alat Ukur',
    desc: 'Peralatan yang menghasilkan nilai terukur, dan ketelitiannya mempengaruhi keabsahan hasil yang dilaporkan.',
  },
  {
    id: 2,
    label: 'Alat Bantu',
    desc: 'Peralatan yang diperlukan agar pengujian dapat berjalan, tetapi pembacaannya tidak masuk ke perhitungan hasil.',
  },
  {
    id: 3,
    label: 'Artefak Acuan',
    desc: 'Benda yang menjadi acuan pembanding sebagai yang diukur, bukan yang membaca. Mencakup Alat Standar dan Golden Sample.',
  },
  {
    id: 4,
    label: 'Komponen Pendukung',
    desc: 'Bahan atau data yang habis, kedaluwarsa, atau diperbarui — bukan barang inventaris yang tetap.',
  },
];

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
  getAll: (options = {}) => {
    const user = getCurrentUser();
    // Endpoint /api/users di backend dilindungi RequireRoles("admin").
    // Non-admin (manager & staff) tidak memiliki akses ke endpoint ini.
    if (user && user.role !== 'admin') {
      return Promise.resolve({ success: true, data: [] });
    }
    return fetchWithAuth('/api/users', { ...options, silentForbidden: true });
  },
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
  update: (id, body) => fetchWithAuth(`/api/peralatan/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
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
// KATEGORI PERALATAN  — /api/kategori-peralatan
// =============================================================
export const kategoriPeralatanApi = {
  getAll: () => fetchWithAuth('/api/kategori-peralatan/'),
  getById: (id) => fetchWithAuth(`/api/kategori-peralatan/${id}`),
  create: (body) =>
    fetchWithAuth('/api/kategori-peralatan/', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) =>
    fetchWithAuth(`/api/kategori-peralatan/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => fetchWithAuth(`/api/kategori-peralatan/${id}`, { method: 'DELETE' }),
};

// =============================================================
// VERIFIKASI PERALATAN — /api/verifikasi
// =============================================================
export const verifikasiApi = {
  getAll: () => fetchWithAuth('/api/verifikasi/'),
  getPengajuan: () => fetchWithAuth('/api/verifikasi/pengajuan'),
  getLogPeninjauan: () => fetchWithAuth('/api/verifikasi/log-peninjauan'),
  getLogByPeralatanId: (peralatanId) =>
    fetchWithAuth(`/api/verifikasi/log-peninjauan/peralatan/${peralatanId}`),
  getByPeralatanId: (peralatanId) =>
    fetchWithAuth(`/api/verifikasi/peralatan/${peralatanId}`),
  getById: (id) => fetchWithAuth(`/api/verifikasi/${id}`),
  create: (body) =>
    fetchWithAuth('/api/verifikasi/', { method: 'POST', body: JSON.stringify(body) }),
  signPic: (id, signature) =>
    fetchWithAuth(`/api/verifikasi/${id}/sign-pic`, {
      method: 'PUT', body: JSON.stringify({ signature }),
    }),
  approve: (id, signature) =>
    fetchWithAuth(`/api/verifikasi/${id}/approve`, {
      method: 'PUT', body: JSON.stringify({ signature }),
    }),
  reject: (id, body) =>
    fetchWithAuth(`/api/verifikasi/${id}/reject`, {
      method: 'PUT', body: JSON.stringify(body),
    }),
  delete: (id) => fetchWithAuth(`/api/verifikasi/${id}`, { method: 'DELETE' }),
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


export const STATUS_ALAT_OPTIONS = [
  'Karantina', 'Aktif', 'Dipinjam', 'Dalam Kalibrasi', 'Rusak', 'Dihapuskan'
];

export const STATUS_BADGE_CLASS = {
  'Aktif': 'badge-aktif',
  'Dipinjam': 'badge-dipinjam',
  'Dalam Kalibrasi': 'badge-kalibrasi',
  'Rusak': 'badge-rusak',
  'Dihapuskan': 'badge-dihapuskan',
  'Karantina': 'badge-rusak',
};

// =============================================================
// ATURAN BISNIS SRS SIKEPO (ISO/IEC 17025)
// =============================================================

// Pemicu Verifikasi P1–P9 (SRS Section 10)
export const VERIFIKASI_PEMICU_OPTIONS = [
  ['P1', 'P1 — Peralatan baru diterima'],
  ['P2', 'P2 — Setelah kalibrasi'],
  ['P3', 'P3 — Setelah verifikasi fungsi'],
  ['P4', 'P4 — Setelah pengecekan antara / karakterisasi ulang'],
  ['P5', 'P5 — Setelah dipinjam / dipindahkan atau dikembalikan'],
  ['P6', 'P6 — Setelah pemeliharaan'],
  ['P7', 'P7 — Setelah penyesuaian'],
  ['P8', 'P8 — Setelah perbaikan'],
  ['P9', 'P9 — Kembali dari peninjauan tanpa perbaikan'],
  ['P2+P5', 'P2+P5 — Kalibrasi dan pengembalian'],
  ['P8+P2', 'P8+P2 — Perbaikan lalu kalibrasi'],
];

// Perhitungan Tanggal Jatuh Tempo Otomatis (SRS Klausul 20 & FR-M13-01)
export function calculateJatuhTempoDate(startDateStr, intervalMonths) {
  if (!startDateStr || !intervalMonths) return '';
  const interval = Number(intervalMonths);
  if (!Number.isFinite(interval) || interval <= 0) return '';

  try {
    const parts = startDateStr.slice(0, 10).split('-');
    if (parts.length !== 3) return '';
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const d = new Date(year, month, day);
    d.setMonth(d.getMonth() + interval);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
}

// Analisis Notifikasi / Status Jatuh Tempo H-90, H-30, H-7, Overdue (SRS 20.1 & FR-M13-05)
export function getDueStatus(dateStr) {
  if (!dateStr) return null;
  try {
    const target = new Date(dateStr.slice(0, 10));
    if (isNaN(target.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        level: 'overdue',
        label: `Lewat ${Math.abs(diffDays)} Hari`,
        days: diffDays,
        isOverdue: true,
        badgeClass: 'badge-rusak',
      };
    }
    if (diffDays <= 7) {
      return {
        level: 'h7',
        label: `H-${diffDays} Jatuh Tempo`,
        days: diffDays,
        isOverdue: false,
        badgeClass: 'badge-rusak',
      };
    }
    if (diffDays <= 30) {
      return {
        level: 'h30',
        label: `H-${diffDays} Jatuh Tempo`,
        days: diffDays,
        isOverdue: false,
        badgeClass: 'badge-kalibrasi',
      };
    }
    if (diffDays <= 90) {
      return {
        level: 'h90',
        label: `H-${diffDays} Jatuh Tempo`,
        days: diffDays,
        isOverdue: false,
        badgeClass: 'badge-gray',
      };
    }
    return {
      level: 'safe',
      label: 'Jatuh Tempo Masih Aman',
      days: diffDays,
      isOverdue: false,
      badgeClass: 'badge-aktif',
    };
  } catch {
    return null;
  }
}

// Perhitungan Status Kelayakan & Jenis Label Sistem (SRS Klausul 7, 7.1, 7.2)
export function computeEligibility(peralatan) {
  if (!peralatan) {
    return {
      statusKelayakan: 'Tidak Layak',
      jenisLabel: 'DO NOT USE',
      labelColor: '#EF4444',
      badgeClass: 'badge-rusak',
      reason: 'Data tidak tersedia',
    };
  }

  const detail = peralatan.detail || peralatan.detail_alat_ukur || peralatan.detail_alat_bantu || peralatan.detail_artefak_acuan || peralatan.detail_komponen_pendukung || {};
  const isVerified = peralatan.status_verifikasi === 'Disetujui';
  const isArchived = peralatan.status_alat === 'Dihapuskan';
  const isBroken = peralatan.status_alat === 'Rusak';
  const isReview = peralatan.status_verifikasi === 'Ditolak' || peralatan.status_alat === 'Dalam Peninjauan';
  const isQuarantine = peralatan.status_alat === 'Karantina' || !isVerified;

  // Cek segel: default utuh jika tidak dinyatakan sebaliknya
  const isSealBroken = peralatan.segel_utuh === false || detail.segel_utuh === false;

  // Tanggal jatuh tempo
  const dueDate = detail.tgl_jatuh_tempo || peralatan.tgl_jatuh_tempo || detail.tgl_kedaluwarsa;
  const dueStatus = dueDate ? getDueStatus(dueDate) : null;
  const isOverdue = dueStatus?.isOverdue;

  // Batasan penggunaan
  const hasLimitation = Boolean(
    peralatan.batasan_penggunaan ||
    detail.batasan_penggunaan ||
    detail.status_kelayakan === 'Terbatas'
  );

  // Aturan SRS 7.1 & 7.2
  if (isArchived) {
    return {
      statusKelayakan: 'Tidak Layak',
      jenisLabel: 'DO NOT USE',
      labelColor: '#EF4444',
      badgeClass: 'badge-dihapuskan',
      reason: 'Peralatan telah dihapuskan dari layanan.',
      dueStatus,
      isSealBroken,
    };
  }

  if (isBroken || isReview) {
    return {
      statusKelayakan: 'Tidak Layak',
      jenisLabel: 'DO NOT USE',
      labelColor: '#EF4444',
      badgeClass: 'badge-rusak',
      reason: 'Peralatan rusak / dalam peninjauan ketidaksesuaian.',
      dueStatus,
      isSealBroken,
    };
  }

  if (isQuarantine) {
    return {
      statusKelayakan: 'Tidak Layak',
      jenisLabel: 'DO NOT USE',
      labelColor: '#EF4444',
      badgeClass: 'badge-rusak',
      reason: 'Peralatan berstatus karantina / belum diverifikasi.',
      dueStatus,
      isSealBroken,
    };
  }

  if (isSealBroken) {
    return {
      statusKelayakan: 'Tidak Layak',
      jenisLabel: 'DO NOT USE',
      labelColor: '#EF4444',
      badgeClass: 'badge-rusak',
      reason: 'Segel kalibrasi/penyetelan rusak.',
      dueStatus,
      isSealBroken: true,
    };
  }

  if (isOverdue) {
    return {
      statusKelayakan: 'Tidak Layak',
      jenisLabel: 'DO NOT USE',
      labelColor: '#EF4444',
      badgeClass: 'badge-rusak',
      reason: `Masa berlaku telah terlewati (${dueStatus?.label}).`,
      dueStatus,
      isSealBroken,
    };
  }

  if (hasLimitation) {
    return {
      statusKelayakan: 'Terbatas',
      jenisLabel: 'LIMITED CALIBRATION',
      labelColor: '#F59E0B',
      badgeClass: 'badge-kalibrasi',
      reason: peralatan.batasan_penggunaan || detail.batasan_penggunaan || 'Terdapat batasan rentang ukur / kondisi tertentu.',
      dueStatus,
      isSealBroken,
    };
  }

  return {
    statusKelayakan: 'Layak',
    jenisLabel: 'CALIBRATION',
    labelColor: '#10B981',
    badgeClass: 'badge-aktif',
    reason: 'Peralatan memenuhi kriteria kelayakan operasional.',
    dueStatus,
    isSealBroken: false,
  };
}

