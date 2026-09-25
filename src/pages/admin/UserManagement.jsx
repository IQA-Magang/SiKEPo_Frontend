import React, { useState, useEffect } from 'react';
import { Users, Plus, Pencil, Trash2, X, RefreshCw, Shield } from 'lucide-react';
import { usersApi } from '../../utils/api.js';
import { ACCESS, ACTIONS, can } from '../../utils/permissions.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';

const EMPTY_FORM = { nip: '', name: '', email: '', password: '', role: 'staff', position: '', pic: false };

const ROLE_BADGE = {
  admin:   'badge-role-admin',
  manager: 'badge-role-manager',
  staff:   'badge-role-staff',
};

export default function UserManagement({ onNavigate, viewOnly = false }) {
  const canManage = !viewOnly && can(ACCESS.MASTER_USER_PIC, ACTIONS.ADD) && can(ACCESS.MASTER_USER_PIC, ACTIONS.EDIT) && can(ACCESS.MASTER_USER_PIC, ACTIONS.DELETE);
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null); // null | { mode: 'create'|'edit', data }
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const toast = useToast();
  const confirm = useConfirm();

  // Escape key listener for modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && modal) {
        setModal(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await usersApi.getAll();
      setUsers(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setError('');
    setModal({ mode: 'create' });
  }

  function openEdit(user) {
    setForm({
      nip: user.nip || '',
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'staff',
      position: user.position || '',
      pic: user.pic || false,
    });
    setError('');
    setModal({ mode: 'edit', id: user.user_id });
  }

  async function handleSave() {
    if (!form.nip || !form.name || !form.email || !form.role || !form.position) {
      setError('Semua field wajib diisi kecuali password (saat edit).');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, pic: Boolean(form.pic) };
      if (modal.mode === 'create') {
        if (!form.password) { setError('Password wajib diisi saat membuat akun baru.'); setSaving(false); return; }
        await usersApi.create(payload);
      } else {
        await usersApi.update(modal.id, payload);
      }
      setModal(null);
      toast.success(modal.mode === 'create' ? 'Pengguna baru berhasil ditambahkan.' : 'Data pengguna berhasil disimpan.');
      loadData();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan.');
      toast.error(err.message || 'Gagal menyimpan data pengguna.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const targetUser = users.find((u) => u.user_id === id);
    const userName = targetUser?.name ? `"${targetUser.name}"` : 'pengguna ini';

    const confirmed = await confirm({
      title: 'Hapus Pengguna',
      message: `Apakah Anda yakin ingin menghapus akun ${userName}? Tindakan ini akan menghapus hak akses yang bersangkutan secara permanen.`,
      confirmText: 'Ya, Hapus Pengguna',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    setDeleting(id);
    try {
      await usersApi.delete(id);
      setUsers((prev) => prev.filter((u) => u.user_id !== id));
      toast.success(`Pengguna ${userName} berhasil dihapus.`);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus pengguna.');
    } finally {
      setDeleting(null);
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchQ = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.nip?.includes(q);
    const matchRole = !filterRole || u.role === filterRole;
    return matchQ && matchRole;
  });

  return (
    <div className="page-container fade-in-up">
      {/* 1. Page Header */}
      <div className="page-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="page-title">Manajemen Pengguna</h1>
            {viewOnly && <span className="badge badge-gray">Mode Lihat (Manager)</span>}
          </div>
          <p className="page-subtitle">Kelola akun personel laboratorium dan hak akses SiKEPo</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={openCreate} id="btn-tambah-user">
            <Plus size={16} /> Tambah Pengguna
          </button>
        )}
      </div>

      {/* 2. Filter / Search Bar */}
      <div className="filter-toolbar">
        <div className="search-bar filter-search-wrap">
          <Users className="search-icon" size={16} />
          <input
            id="input-search-user"
            className="form-input"
            type="text"
            placeholder="Cari nama, email, NIP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="select-filter-role"
          className="form-select filter-select"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">Semua Role</option>
          <option value="admin">Administrator</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </select>
        <button
          className="btn btn-secondary btn-icon"
          onClick={loadData}
          id="btn-refresh-user"
          title="Segarkan data pengguna"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* 3. Content Table Card */}
      {loading ? (
        <div className="card skeleton-list">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={32} /></div>
          <p className="empty-state-title">Tidak ada pengguna ditemukan</p>
          {canManage && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> Tambah Pengguna
            </button>
          )}
        </div>
      ) : (
        <div className="table-card">
          <div className="table-wrapper table-borderless">
            <table className="data-table data-table-mobile-priority data-table-users">
              <thead>
                <tr>
                  <th>NIP</th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Jabatan</th>
                  <th>PIC</th>
                  {canManage && <th style={{ width: 100 }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.user_id}>
                    <td><code className="text-mono-xs">{u.nip}</code></td>
                    <td style={{ fontWeight: 'var(--fw-medium)' }}>{u.name}</td>
                    <td style={{ color: 'var(--clr-dark-500)', fontSize: 'var(--text-sm)' }}>{u.email}</td>
                    <td><span className={`badge ${ROLE_BADGE[u.role] || 'badge-gray'}`}>{u.role}</span></td>
                    <td style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-dark-600)' }}>{u.position}</td>
                    <td>
                      {u.pic && <span className="badge badge-green"><Shield size={10} /> PIC</span>}
                    </td>
                    {canManage && (
                      <td>
                        <div className="table-action-btns">
                          <button
                            className="btn-action-icon"
                            onClick={() => openEdit(u)}
                            id={`btn-edit-user-${u.user_id}`}
                            title="Edit pengguna"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="btn-action-icon btn-action-delete"
                            onClick={() => handleDelete(u.user_id)}
                            disabled={deleting === u.user_id}
                            id={`btn-hapus-user-${u.user_id}`}
                            title="Hapus pengguna"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. Summary Footer */}
          <div className="table-footer-summary">
            <span>Menampilkan <strong>{filtered.length}</strong> dari <strong>{users.length}</strong> total pengguna terdaftar</span>
            <span>Total PIC Aktif: <strong>{users.filter(u => u.pic).length}</strong></span>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && canManage && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal" id="modal-user">
            <div className="modal-header">
              <h2 className="modal-title">{modal.mode === 'create' ? 'Tambah Pengguna' : 'Edit Pengguna'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: 'var(--sp-4)' }}>{error}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="modal-nip">NIP <span className="required">*</span></label>
                    <input id="modal-nip" className="form-input" placeholder="19850101" value={form.nip} onChange={e => setForm(p => ({ ...p, nip: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="modal-name">Nama Lengkap <span className="required">*</span></label>
                    <input id="modal-name" className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="modal-email">Email <span className="required">*</span></label>
                    <input id="modal-email" type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="modal-password">Password {modal.mode === 'edit' && <span style={{ color: 'var(--clr-dark-400)', fontWeight: 400 }}>(kosongkan jika tidak diubah)</span>}</label>
                    <input id="modal-password" type="password" className="form-input" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} autoComplete="new-password" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="modal-role">Role <span className="required">*</span></label>
                    <select id="modal-role" className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                      <option value="admin">Administrator</option>
                      <option value="manager">Manager</option>
                      <option value="staff">Staff</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="modal-position">Jabatan <span className="required">*</span></label>
                    <input id="modal-position" className="form-input" placeholder="Teknisi Lab, Manajer Mutu..." value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} />
                  </div>
                </div>
                <label className="checkbox-label">
                  <input type="checkbox" checked={form.pic} onChange={e => setForm(p => ({ ...p, pic: e.target.checked }))} id="modal-pic" />
                  Tetapkan sebagai PIC (Penanggung Jawab Alat)
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)} id="btn-batal-modal">Batal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="btn-simpan-user">
                {saving ? <><div className="spinner" />Menyimpan...</> : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
