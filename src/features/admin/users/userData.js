export const EMPTY_USER_FORM = Object.freeze({
  nip: '',
  name: '',
  email: '',
  password: '',
  role: 'staff',
  position: '',
  pengelola: false,
  labs_id: '',
});

export const ROLE_BADGE = Object.freeze({
  admin: 'badge-role-admin',
  manager: 'badge-role-manager',
  staff: 'badge-role-staff',
});

export function createUserForm(user) {
  return {
    nip: user.nip || '',
    name: user.name || '',
    email: user.email || '',
    password: '',
    role: user.role || 'staff',
    position: user.position || '',
    pengelola: user.pengelola ?? false,
    labs_id: user.labs_id == null ? '' : String(user.labs_id),
  };
}

export function getUserValidationError(form) {
  if (!form.nip || !form.name || !form.email || !form.role || !form.position) {
    return 'Semua field wajib diisi kecuali password (saat edit).';
  }
  if (form.role !== 'admin' && !form.labs_id) {
    return 'Laboratorium wajib dipilih untuk pengguna dengan role Staff atau Manager.';
  }
  return '';
}

export function createUserPayload(form) {
  return {
    ...form,
    pengelola: Boolean(form.pengelola),
    labs_id: form.labs_id ? Number(form.labs_id) : null,
  };
}

export function filterUsers(users, { search, role }) {
  const query = search.toLowerCase();
  return users.filter((user) => {
    const matchesQuery =
      !query ||
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.nip?.includes(query);
    const matchesRole = !role || user.role === role;
    return matchesQuery && matchesRole;
  });
}
