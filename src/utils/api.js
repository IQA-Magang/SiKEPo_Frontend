// Ponytail: lightweight fetch wrapper for backend API with JWT Bearer auth
const API_BASE = 'http://localhost:5000';

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
    const errorMsg = data?.message || data?.error || `HTTP error ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
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
  update: (id, userData) =>
    fetchWithAuth(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    }),

  // DELETE /api/users/:id (Admin only)
  delete: (id) =>
    fetchWithAuth(`/api/users/${id}`, {
      method: 'DELETE'
    })
};
