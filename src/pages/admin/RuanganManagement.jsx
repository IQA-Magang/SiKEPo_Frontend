import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Building2
} from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import Sidebar from '../../components/layout/Sidebar';
import { ruanganApi, labsApi, userApi, getStoredUser } from '../../utils/api';

const EMPTY_FORM = {
  nama_ruangan: '',
  kode_ruangan: '',
  labs_id: '',
  pic_user_id: ''
};

export default function RuanganManagement({ onNavigate }) {
  const [user, setUser] = useState(getStoredUser);
  const [ruanganList, setRuanganList] = useState([]);
  const [labsList, setLabsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [notice, setNotice] = useState('');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLabId, setFilterLabId] = useState('');

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedRuanganId, setSelectedRuanganId] = useState(null);
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

  const fetchData = async () => {
    setLoading(true);
    setApiError('');
    try {
      const [rRes, lRes, uRes] = await Promise.all([
        ruanganApi.getAll(),
        labsApi.getAll(),
        userApi.getAll()
      ]);

      if (rRes && rRes.data) {
        setRuanganList(rRes.data);
      } else {
        setRuanganList([]);
      }

      if (lRes && lRes.data) {
        setLabsList(lRes.data);
      }

      if (uRes && uRes.data) {
        setUsersList(uRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch ruangan data:', err);
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

  const filteredRuangan = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ruanganList.filter((item) => {
      if (filterLabId && String(item.labs_id) !== String(filterLabId)) {
        return false;
      }
      if (!q) return true;
      return (
        item.nama_ruangan?.toLowerCase().includes(q) ||
        item.kode_ruangan?.toLowerCase().includes(q) ||
        item.labs?.nama_labs?.toLowerCase().includes(q) ||
        item.pic_user?.name?.toLowerCase().includes(q)
      );
    });
  }, [ruanganList, searchQuery, filterLabId]);

  const handleOpenCreate = () => {
    setFormData(EMPTY_FORM);
    setSelectedRuanganId(null);
    setFormError('');
    setModalMode('create');
  };

  const handleOpenEdit = (target) => {
    setSelectedRuanganId(target.id);
    setFormData({
      nama_ruangan: target.nama_ruangan || '',
      kode_ruangan: target.kode_ruangan || '',
      labs_id: target.labs_id ? String(target.labs_id) : '',
      pic_user_id: target.pic_user_id ? String(target.pic_user_id) : ''
    });
    setFormError('');
    setModalMode('edit');
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const cleanNama = formData.nama_ruangan.trim();
      const cleanKode = formData.kode_ruangan.trim();
      const labsIdNum = formData.labs_id ? Number(formData.labs_id) : null;
      const picIdNum = formData.pic_user_id ? Number(formData.pic_user_id) : null;

      if (!cleanNama || !cleanKode) {
        throw new Error('Nama Ruangan dan Kode Ruangan wajib diisi');
      }

      if (!labsIdNum) {
        throw new Error('Laboratorium Induk wajib dipilih');
      }

      const payload = {
        nama_ruangan: cleanNama,
        kode_ruangan: cleanKode,
        labs_id: labsIdNum,
        pic_user_id: picIdNum
      };

      if (modalMode === 'create') {
        await ruanganApi.create(payload);
        showNotice(`Ruangan "${cleanNama}" berhasil dibuat.`);
      } else if (modalMode === 'edit') {
        await ruanganApi.update(selectedRuanganId, payload);
        showNotice(`Ruangan "${cleanNama}" berhasil diperbarui.`);
      }

      setModalMode(null);
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan ruangan');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError('');
    try {
      await ruanganApi.delete(deleteTarget.id);
      showNotice(`Ruangan "${deleteTarget.nama_ruangan}" berhasil dihapus.`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setDeleteError(err.message || 'Gagal menghapus ruangan');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="app-shell">
      <Topbar
        user={user}
        onNavigate={onNavigate}
        title="Manajemen Ruangan"
        onUpdateUser={(u) => setUser(u)}
      />

      <Sidebar activePath="/admin/kelompok-lokasi" onNavigate={onNavigate} />

      <main className="main-content">
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

        <div className="eq-page-header">
          <div>
            <h1 className="eq-page-title">Manajemen Ruangan</h1>
            <p className="eq-page-sub">
              Master data lokasi ruangan dan penempatan Peralatan
            </p>
          </div>
          <button className="btn-hero-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Tambah Ruangan</span>
          </button>
        </div>

        {/* Filters and Search */}
        <div className="eq-filter-card" style={{ marginBottom: '16px' }}>
          <div className="eq-filter-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama ruangan, kode, atau PIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="eq-filter-selects">
            <select
              className="eq-select"
              value={filterLabId}
              onChange={(e) => setFilterLabId(e.target.value)}
            >
              <option value="">Semua Laboratorium</option>
              {labsList.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nama_labs} ({l.kode_labs})
                </option>
              ))}
            </select>

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
              <h2>Daftar Ruangan</h2>
              <p className="panel-subtitle">
                {loading ? 'Memuat data dari backend...' : `${filteredRuangan.length} ruangan ditemukan`}
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
                  <th>Kode Ruangan</th>
                  <th>Nama Ruangan</th>
                  <th>Laboratorium Induk</th>
                  <th>Petugas PIC</th>
                  <th>Tanggal Dibuat</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredRuangan.map((r, idx) => (
                  <tr key={r.id || idx}>
                    <td><span className="eq-row-num">{String(idx + 1).padStart(2, '0')}</span></td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#111827' }}>
                        {r.kode_ruangan}
                      </span>
                    </td>
                    <td>
                      <strong className="tool-name-text">{r.nama_ruangan}</strong>
                    </td>
                    <td>
                      {r.labs ? (
                        <span className="borrower-name">{r.labs.nama_labs}</span>
                      ) : (
                        <span style={{ color: '#9CA3AF' }}>-</span>
                      )}
                    </td>
                    <td>
                      {r.pic_user ? (
                        <div>
                          <strong style={{ color: '#111827', fontSize: '13px' }}>{r.pic_user.name}</strong>
                          <br />
                          <small style={{ color: '#6B7280' }}>{r.pic_user.position || 'Staff'}</small>
                        </div>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Belum Ditugaskan</span>
                      )}
                    </td>
                    <td>
                      <span className="date-text">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </span>
                    </td>
                    <td>
                      <div className="eq-actions">
                        <button
                          className="eq-btn-action edit"
                          onClick={() => handleOpenEdit(r)}
                          title="Edit Ruangan"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="eq-btn-action delete"
                          onClick={() => { setDeleteError(''); setDeleteTarget(r); }}
                          title="Hapus Ruangan"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredRuangan.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#6B7280' }}>
                      Belum ada data ruangan yang sesuai.
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
                <Layers size={20} className="text-red" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  {modalMode === 'create' ? 'Tambah Ruangan Baru' : 'Ubah Data Ruangan'}
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
                  <label className="eq-form-label">Kode Ruangan *</label>
                  <input
                    type="text"
                    className="eq-form-input"
                    placeholder="Contoh: R-101"
                    value={formData.kode_ruangan}
                    onChange={(e) => setFormData({ ...formData, kode_ruangan: e.target.value })}
                    required
                  />
                </div>

                <div className="eq-form-group">
                  <label className="eq-form-label">Nama Ruangan *</label>
                  <input
                    type="text"
                    className="eq-form-input"
                    placeholder="Contoh: Ruang Uji Transmisi Serat Optik"
                    value={formData.nama_ruangan}
                    onChange={(e) => setFormData({ ...formData, nama_ruangan: e.target.value })}
                    required
                  />
                </div>

                <div className="eq-form-group">
                  <label className="eq-form-label">
                    Laboratorium Induk <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    className="eq-form-input"
                    value={formData.labs_id}
                    onChange={(e) => setFormData({ ...formData, labs_id: e.target.value })}
                    required
                  >
                    <option value="">-- Pilih Laboratorium --</option>
                    {labsList.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nama_labs} ({l.kode_labs})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="eq-form-group">
                  <label className="eq-form-label">Petugas PIC Ruangan (Opsional)</label>
                  <select
                    className="eq-form-input"
                    value={formData.pic_user_id}
                    onChange={(e) => setFormData({ ...formData, pic_user_id: e.target.value })}
                  >
                    <option value="">-- Pilih Petugas PIC --</option>
                    {usersList.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.name} {u.pic ? '★ [PIC]' : ''} ({u.role ? u.role.toUpperCase() : 'USER'} - {u.position || 'Personel'})
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
                  {formSubmitting ? 'Menyimpan...' : modalMode === 'create' ? 'Buat Ruangan' : 'Simpan Perubahan'}
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
                Konfirmasi Hapus Ruangan
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
                Apakah Anda yakin ingin menghapus ruangan <strong>"{deleteTarget.nama_ruangan}"</strong> ({deleteTarget.kode_ruangan})?
              </p>
            </div>
            <div className="profile-modal-footer" style={{ display: 'flex', gap: '10px', padding: '16px 20px' }}>
              <button className="eq-btn-cancel" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Batal
              </button>
              <button className="eq-btn-action delete" style={{ padding: '8px 16px' }} onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? 'Menghapus...' : 'Ya, Hapus Ruangan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
