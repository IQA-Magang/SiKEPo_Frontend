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
