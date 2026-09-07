import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Shield,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Lock,
  Mail,
  Hash,
  Award,
  UserCheck
} from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import Sidebar from '../../components/layout/Sidebar';
import { userApi } from '../../utils/api';

const EMPTY_FORM = {
  nip: '',
  name: '',
  email: '',
  password: '',
  role: 'staff',
  position: ''
};

export default function UserManagement({ onNavigate }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [notice, setNotice] = useState('');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('sikepo_user');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setUser(u);
        if (u.role?.toLowerCase() !== 'admin') {
          onNavigate('/dashboard');
        }
      } catch (e) {
        onNavigate('/dashboard');
      }
    } else {
      onNavigate('/login');
    }
  }, []);

  // Fetch users from backend API
  const fetchUsers = async () => {
    setLoading(true);
    setApiError('');
    try {
      const res = await userApi.getAll();
      if (res && res.data) {
        setUsers(res.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setApiError(err.message || 'Gagal terhubung ke backend API (/api/users)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter && u.role?.toLowerCase() !== roleFilter.toLowerCase()) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.nip && u.nip.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.position && u.position.toLowerCase().includes(q))
      );
    });
  }, [users, searchQuery, roleFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData(EMPTY_FORM);
    setFormError('');
    setModalMode('create');
  };

  // Open Edit Modal
  const handleOpenEdit = (targetUser) => {
    setSelectedUserId(targetUser.user_id);
    setFormData({
      nip: targetUser.nip || '',
      name: targetUser.name || '',
      email: targetUser.email || '',
      password: '', // optional on update
      role: targetUser.role || 'staff',
      position: targetUser.position || ''
    });
    setFormError('');
    setModalMode('edit');
  };

  // Submit Create or Edit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      if (modalMode === 'create') {
        if (!formData.password || formData.password.length < 6) {
          throw new Error('Password wajib diisi minimal 6 karakter');
        }
        await userApi.create(formData);
        showNotice(`User "${formData.name}" berhasil dibuat.`);
      } else if (modalMode === 'edit') {
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // do not send empty password
        await userApi.update(selectedUserId, payload);
        showNotice(`Data user "${formData.name}" berhasil diperbarui.`);
      }

      setModalMode(null);
      fetchUsers();
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirm and Execute Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userApi.delete(deleteTarget.user_id);
      showNotice(`User "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      alert(`Gagal menghapus user: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="app-shell">
      <Topbar
        user={user}
        onNavigate={onNavigate}
        title="Manajemen Pengguna"
        onUpdateUser={(updated) => setUser(updated)}
      />
      <Sidebar activePath="/users" onNavigate={onNavigate} />

      <main className="main-content">
        {/* Notice Banner */}
        {notice && (
          <div className="eq-confirm-banner" style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="#059669" />
              <span>{notice}</span>
            </div>
          </div>
        )}

        {/* Delete Confirmation Banner */}
        {deleteTarget && (
          <div className="eq-confirm-banner" style={{ background: '#FEF2F2', borderColor: '#FCA5A5', color: '#991B1B', marginBottom: '16px' }}>
            <span>
              Hapus akun <strong>{deleteTarget.name}</strong> (NIP: {deleteTarget.nip})? Akun ini tidak akan dapat login lagi.
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="eq-btn-action delete"
                disabled={deleting}
                onClick={handleConfirmDelete}
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
              <button
                className="eq-btn-cancel"
                style={{ padding: '6px 14px' }}
                onClick={() => setDeleteTarget(null)}
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="eq-page-header">
          <div>
            <h1 className="eq-page-title">Manajemen Akun Pengguna</h1>
            <p className="eq-page-sub">
              Kelola seluruh akun personel laboratorium Telkom Test House terhubung langsung ke database backend (`/api/users`)
            </p>
          </div>
          <button className="btn-hero-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>

        {/* Quick Summary Counts */}
        <section className="stats-grid" style={{ marginBottom: '20px' }}>
          <article className="stat-card black">
            <div className="stat-header">
              <span className="stat-badge">Database Aktif</span>
              <div className="stat-icon-wrapper"><Users size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">{users.length} Akun</strong>
              <span className="stat-title">Total Pengguna Terdaftar</span>
            </div>
            <div className="stat-footer">
              <span className="stat-sub">Terdaftar di tabel users MySQL</span>
            </div>
          </article>

          <article className="stat-card red">
            <div className="stat-header">
              <span className="stat-badge">Role Admin</span>
              <div className="stat-icon-wrapper"><Shield size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">
                {users.filter(u => u.role?.toLowerCase() === 'admin').length} Personel
              </strong>
              <span className="stat-title">Administrator Sistem</span>
            </div>
            <div className="stat-footer">
              <span className="stat-sub">Hak akses master data penuh</span>
            </div>
          </article>

          <article className="stat-card darkgray">
            <div className="stat-header">
              <span className="stat-badge">Role Manajer</span>
              <div className="stat-icon-wrapper"><UserCheck size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">
                {users.filter(u => u.role?.toLowerCase() === 'manager').length} Personel
              </strong>
              <span className="stat-title">Manajer Mutu & Lab</span>
            </div>
            <div className="stat-footer">
              <span className="stat-sub">Otorisasi verifikasi TLKM13/P</span>
            </div>
          </article>

          <article className="stat-card gray">
            <div className="stat-header">
              <span className="stat-badge">Role Staff</span>
              <div className="stat-icon-wrapper"><Award size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">
                {users.filter(u => u.role?.toLowerCase() === 'staff').length} Personel
              </strong>
              <span className="stat-title">Staff Pengujian Lab</span>
            </div>
            <div className="stat-footer">
              <span className="stat-sub">Operasional peminjaman alat</span>
            </div>
          </article>
        </section>

        {/* Filters and Search */}
        <div className="eq-filter-card" style={{ marginBottom: '16px' }}>
          <div className="eq-filter-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, NIP, email, atau jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="eq-filter-selects">
            <select
              className="eq-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Semua Peran (Role)</option>
              <option value="admin">Administrator</option>
              <option value="manager">Manajer</option>
              <option value="staff">Staff Lab</option>
            </select>

            <button
              className="btn-hero-secondary"
              style={{ padding: '8px 14px', fontSize: '12px' }}
              onClick={fetchUsers}
              title="Perbarui data dari database"
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Daftar Akun Pengguna</h2>
              <p className="panel-subtitle">
                {loading ? 'Memuat data dari backend...' : `${filteredUsers.length} pengguna ditemukan`}
              </p>
            </div>
          </div>

          {apiError && (
            <div style={{ padding: '16px 20px', background: '#FEF2F2', borderBottom: '1px solid #FECACA', color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} />
                <span>{apiError}</span>
              </div>
              <button className="btn-hero-secondary" style={{ padding: '4px 10px', fontSize: '11.5px' }} onClick={fetchUsers}>
                Coba Lagi
              </button>
            </div>
          )}

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIP Pegawai</th>
                  <th>Nama & Email</th>
                  <th>Peran (Role)</th>
                  <th>Jabatan / Posisi</th>
                  <th>Terdaftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => {
                  const roleLower = (u.role || 'staff').toLowerCase();
                  return (
                    <tr key={u.user_id || idx}>
                      <td><span className="eq-row-num">{String(idx + 1).padStart(2, '0')}</span></td>
                      <td>
                        <div className="table-id-cell">
                          <strong style={{ color: '#111827', fontFamily: 'monospace' }}>{u.nip}</strong>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong className="tool-name-text">{u.name}</strong>
                          <br />
                          <small style={{ color: '#6B7280' }}>{u.email}</small>
                        </div>
                      </td>
                      <td>
                        <span className={`role-tag-badge ${roleLower}`}>
                          <Shield size={11} />
                          {roleLower === 'admin' ? 'Admin' : roleLower === 'manager' ? 'Manajer' : 'Staff Lab'}
                        </span>
                      </td>
                      <td>
                        <span className="borrower-name">{u.position || '-'}</span>
                      </td>
                      <td>
                        <span className="date-text">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </span>
                      </td>
                      <td>
                        <div className="eq-actions">
                          <button
                            className="eq-btn-action edit"
                            onClick={() => handleOpenEdit(u)}
                            title="Edit Data User"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="eq-btn-action delete"
                            onClick={() => setDeleteTarget(u)}
                            title="Hapus Akun User"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center empty-table-cell">
                      Tidak ada data pengguna yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Tambah / Edit Pengguna */}
        {modalMode && (
          <div className="profile-modal-overlay" onClick={() => !formSubmitting && setModalMode(null)}>
            <div className="profile-modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
              <div className="profile-modal-header">
                <div>
                  <h2 className="profile-name-heading">
                    {modalMode === 'create' ? 'Tambah Pengguna Baru' : 'Ubah Data Pengguna'}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                    {modalMode === 'create' ? 'Daftarkan akun personel baru ke database backend' : `Memperbarui akun NIP: ${formData.nip}`}
                  </p>
                </div>
                <button className="profile-close-btn" onClick={() => !formSubmitting && setModalMode(null)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm}>
                <div className="profile-modal-body" style={{ gap: '14px' }}>
                  {formError && (
                    <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#991B1B', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={16} />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="eq-form-group">
                    <label className="eq-form-label"><Hash size={13} /> NIP Pegawai *</label>
                    <input
                      type="text"
                      className="eq-form-input"
                      placeholder="Contoh: 199503222019022004"
                      value={formData.nip}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      required
                    />
                  </div>

                  <div className="eq-form-group">
                    <label className="eq-form-label">Nama Lengkap *</label>
                    <input
                      type="text"
                      className="eq-form-input"
                      placeholder="Contoh: Siti Nurhaliza, S.T."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="eq-form-group">
                    <label className="eq-form-label"><Mail size={13} /> Email Resmi *</label>
                    <input
                      type="email"
                      className="eq-form-input"
                      placeholder="Contoh: sitinurhaliza@telkom.co.id"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="eq-form-group">
                    <label className="eq-form-label">
                      <Lock size={13} /> Password {modalMode === 'create' ? '*' : '(Opsional)'}
                    </label>
                    <input
                      type="password"
                      className="eq-form-input"
                      placeholder={modalMode === 'create' ? 'Minimal 6 karakter' : 'Kosongkan jika tidak ingin mengubah'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={modalMode === 'create'}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '12px' }}>
                    <div className="eq-form-group">
                      <label className="eq-form-label"><Shield size={13} /> Peran (Role) *</label>
                      <select
                        className="eq-form-input"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        required
                      >
                        <option value="staff">Staff Lab</option>
                        <option value="manager">Manajer</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    <div className="eq-form-group">
                      <label className="eq-form-label"><Award size={13} /> Jabatan / Posisi *</label>
                      <input
                        type="text"
                        className="eq-form-input"
                        placeholder="Contoh: PIC Lab Optik"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="profile-modal-footer" style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="eq-btn-cancel"
                    onClick={() => setModalMode(null)}
                    disabled={formSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-hero-primary"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? 'Menyimpan...' : modalMode === 'create' ? 'Simpan Pengguna' : 'Perbarui Pengguna'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
