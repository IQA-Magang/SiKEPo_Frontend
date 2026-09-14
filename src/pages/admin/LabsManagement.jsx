import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  Shield,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import Sidebar from '../../components/layout/Sidebar';
import { labsApi, userApi, getStoredUser } from '../../utils/api';

const EMPTY_FORM = {
  nama_labs: '',
  kode_labs: '',
  manager_id: ''
};

export default function LabsManagement({ onNavigate }) {
  const [user, setUser] = useState(getStoredUser);
  const [labs, setLabs] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [notice, setNotice] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedLabId, setSelectedLabId] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const current = getStoredUser();
    if (current) {
      setUser(current);
      if (current.role?.toLowerCase() !== 'admin') {
        onNavigate('/dashboard');
      }
    } else {
      onNavigate('/login');
    }

    const handleUserChanged = (e) => {
      if (e.detail) setUser(e.detail);
    };
    window.addEventListener('sikepo_user_changed', handleUserChanged);
    return () => window.removeEventListener('sikepo_user_changed', handleUserChanged);
  }, []);

  // Fetch Labs & Manager Users
  const fetchData = async () => {
    setLoading(true);
    setApiError('');
    try {
      const [labsRes, usersRes] = await Promise.all([
        labsApi.getAll(),
        userApi.getAll()
      ]);

      if (labsRes && labsRes.data) {
        setLabs(labsRes.data);
      } else {
        setLabs([]);
      }

      if (usersRes && usersRes.data) {
        setManagers(usersRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch labs:', err);
      setApiError(err.message || 'Gagal terhubung ke backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  const filteredLabs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return labs.filter((item) => {
      if (!q) return true;
      return (
        item.nama_labs?.toLowerCase().includes(q) ||
        item.kode_labs?.toLowerCase().includes(q) ||
        item.manager?.name?.toLowerCase().includes(q)
      );
    });
  }, [labs, searchQuery]);

  const handleOpenCreate = () => {
    setFormData(EMPTY_FORM);
    setSelectedLabId(null);
    setFormError('');
    setModalMode('create');
  };

  const handleOpenEdit = (target) => {
    setSelectedLabId(target.id);
    setFormData({
      nama_labs: target.nama_labs || '',
      kode_labs: target.kode_labs || '',
      manager_id: target.manager_id ? String(target.manager_id) : ''
    });
    setFormError('');
    setModalMode('edit');
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const cleanNama = formData.nama_labs.trim();
      const cleanKode = formData.kode_labs.trim();
      const managerIdNum = formData.manager_id ? Number(formData.manager_id) : null;

      if (!cleanNama || !cleanKode) {
        throw new Error('Nama Laboratorium dan Kode Lab wajib diisi');
      }

      const payload = {
        nama_labs: cleanNama,
        kode_labs: cleanKode,
        manager_id: managerIdNum
      };

      if (modalMode === 'create') {
        await labsApi.create(payload);
        showNotice(`Lab "${cleanNama}" berhasil dibuat.`);
      } else if (modalMode === 'edit') {
        await labsApi.update(selectedLabId, payload);
        showNotice(`Lab "${cleanNama}" berhasil diperbarui.`);
      }

      setModalMode(null);
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan lab');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError('');
    try {
      await labsApi.delete(deleteTarget.id);
      showNotice(`Lab "${deleteTarget.nama_labs}" berhasil dihapus.`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setDeleteError(err.message || 'Gagal menghapus lab');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="app-shell">
      <Topbar
        user={user}
        onNavigate={onNavigate}
        title="Manajemen Laboratorium"
        onUpdateUser={(u) => setUser(u)}
      />

      <Sidebar activePath="/admin/kelompok-lab" onNavigate={onNavigate} />

      <main className="main-content">
        {/* Toast Notice */}
        {notice && (
          <div
            className="eq-confirm-banner"
            style={{
              background: '#ECFDF5',
              borderColor: '#A7F3D0',
              color: '#065F46',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} color="#059669" />
              <span>{notice}</span>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="eq-page-header">
          <div>
            <h1 className="eq-page-title">Manajemen Laboratorium</h1>
            <p className="eq-page-sub">
              Master data unit laboratorium Telkom Test House (/api/v1/labs)
            </p>
          </div>
          <button className="btn-hero-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Tambah Lab</span>
          </button>
        </div>

        {/* Stats Grid */}
        <section className="stats-grid" style={{ marginBottom: '20px' }}>
          <article className="stat-card black">
            <div className="stat-header">
              <span className="stat-badge">Total Unit</span>
              <div className="stat-icon-wrapper"><Building2 size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">{labs.length} Lab</strong>
              <span className="stat-title">Laboratorium Terdaftar</span>
            </div>
            <div className="stat-footer">
              <span className="stat-sub">Tercatat di sistem SiKEPo</span>
            </div>
          </article>

          <article className="stat-card red">
            <div className="stat-header">
              <span className="stat-badge">Dengan Manajer</span>
              <div className="stat-icon-wrapper"><UserCheck size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">
                {labs.filter((l) => Boolean(l.manager_id)).length} Lab
              </strong>
              <span className="stat-title">Memiliki PIC Manajer</span>
            </div>
            <div className="stat-footer">
              <span className="stat-sub">Pejabat pengesah verifikasi</span>
            </div>
          </article>
        </section>

        {/* Filter and Search */}
        <div className="eq-filter-card" style={{ marginBottom: '16px' }}>
          <div className="eq-filter-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama lab, kode lab, atau manajer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="eq-filter-selects">
            <button
              className="btn-refresh"
              onClick={fetchData}
              title="Perbarui data"
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Table Panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Daftar Laboratorium</h2>
              <p className="panel-subtitle">
                {loading ? 'Memuat data dari backend...' : `${filteredLabs.length} lab ditemukan`}
              </p>
            </div>
          </div>

          {apiError && (
            <div style={{ padding: '14px 20px', background: '#FEF2F2', borderBottom: '1px solid #FECACA', color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} />
                <span>{apiError}</span>
              </div>
              <button className="btn-hero-secondary" style={{ padding: '4px 10px', fontSize: '11.5px' }} onClick={fetchData}>
                Coba Lagi
              </button>
            </div>
          )}

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Kode Lab</th>
                  <th>Nama Laboratorium</th>
                  <th>Manajer Lab</th>
                  <th>Tanggal Dibuat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredLabs.map((l, idx) => (
                  <tr key={l.id || idx}>
                    <td><span className="eq-row-num">{String(idx + 1).padStart(2, '0')}</span></td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#111827' }}>
                        {l.kode_labs}
                      </span>
                    </td>
                    <td>
                      <strong className="tool-name-text">{l.nama_labs}</strong>
                    </td>
                    <td>
                      {l.manager ? (
                        <div>
                          <span style={{ fontWeight: 600, color: '#111827' }}>{l.manager.name}</span>
                          <br />
                          <small style={{ color: '#6B7280' }}>{l.manager.email}</small>
                        </div>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Belum Ditentukan</span>
                      )}
                    </td>
                    <td>
                      <span className="date-text">
                        {l.created_at ? new Date(l.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </span>
                    </td>
                    <td>
                      <div className="eq-actions">
                        <button
                          className="eq-btn-action edit"
                          onClick={() => handleOpenEdit(l)}
                          title="Edit Lab"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="eq-btn-action delete"
                          onClick={() => { setDeleteError(''); setDeleteTarget(l); }}
                          title="Hapus Lab"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredLabs.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#6B7280' }}>
                      Belum ada data laboratorium yang sesuai.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL CREATE / EDIT */}
      {modalMode && (
        <div className="profile-modal-overlay">
          <div className="profile-modal" style={{ maxWidth: '480px' }}>
            <div className="profile-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} className="text-red" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  {modalMode === 'create' ? 'Tambah Laboratorium Baru' : 'Ubah Data Laboratorium'}
                </h3>
              </div>
              <button className="profile-modal-close" onClick={() => setModalMode(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="profile-modal-body" style={{ padding: '20px' }}>
                {formError && (
                  <div className="error-banner" style={{ marginBottom: '14px' }}>
                    {formError}
                  </div>
                )}

                <div className="eq-form-group">
                  <label className="eq-form-label">Kode Laboratorium *</label>
                  <input
                    type="text"
                    className="eq-form-input"
                    placeholder="Contoh: LAB-OPT-01"
                    value={formData.kode_labs}
                    onChange={(e) => setFormData({ ...formData, kode_labs: e.target.value })}
                    required
                  />
                </div>

                <div className="eq-form-group">
                  <label className="eq-form-label">Nama Laboratorium *</label>
                  <input
                    type="text"
                    className="eq-form-input"
                    placeholder="Contoh: Laboratorium Transmisi & Optik"
                    value={formData.nama_labs}
                    onChange={(e) => setFormData({ ...formData, nama_labs: e.target.value })}
                    required
                  />
                </div>

                <div className="eq-form-group">
                  <label className="eq-form-label">Manajer Penanggung Jawab (Opsional)</label>
                  <select
                    className="eq-form-input"
                    value={formData.manager_id}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                  >
                    <option value="">-- Pilih Manajer (Opsional) --</option>
                    {managers.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.name} ({m.role ? m.role.toUpperCase() : 'USER'} - {m.position || 'Personel'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="profile-modal-footer" style={{ display: 'flex', gap: '10px', padding: '16px 20px' }}>
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
                  {formSubmitting ? 'Menyimpan...' : modalMode === 'create' ? 'Buat Lab' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRM DELETE */}
      {deleteTarget && (
        <div className="profile-modal-overlay">
          <div className="profile-modal" style={{ maxWidth: '420px' }}>
            <div className="profile-modal-header">
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#DC2626' }}>
                Konfirmasi Hapus Lab
              </h3>
              <button className="profile-modal-close" onClick={() => setDeleteTarget(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="profile-modal-body" style={{ padding: '20px' }}>
              {deleteError && (
                <div className="error-banner" style={{ marginBottom: '14px' }}>
                  {deleteError}
                </div>
              )}
              <p style={{ fontSize: '13.5px', color: '#374151', lineHeight: '1.5' }}>
                Apakah Anda yakin ingin menghapus lab <strong>"{deleteTarget.nama_labs}"</strong> ({deleteTarget.kode_labs})?
              </p>
            </div>
            <div className="profile-modal-footer" style={{ display: 'flex', gap: '10px', padding: '16px 20px' }}>
              <button className="eq-btn-cancel" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Batal
              </button>
              <button className="eq-btn-action delete" style={{ padding: '8px 16px' }} onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? 'Menghapus...' : 'Ya, Hapus Lab'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
