import React, { useState, useEffect, useMemo } from 'react';
import {
  Archive,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Building2,
  UserCheck,
  FolderTree,
  FileSpreadsheet
} from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import Sidebar from '../../components/layout/Sidebar';
import { kelompokAssetApi, labsApi, userApi, getStoredUser } from '../../utils/api';

const EMPTY_FORM = {
  kode: '',
  nama: '',
  lab_id: '',
  pic_id: ''
};

export default function AssetGroupManagement({ onNavigate }) {
  const [user, setUser] = useState(getStoredUser);
  const [groupList, setGroupList] = useState([]);
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
  const [selectedGroupId, setSelectedGroupId] = useState(null);
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
  }, [onNavigate]);

  const fetchData = async () => {
    setLoading(true);
    setApiError('');
    try {
      const [gRes, lRes, uRes] = await Promise.allSettled([
        kelompokAssetApi.getAll(),
        labsApi.getAll(),
        userApi.getAll()
      ]);

      if (gRes.status === 'fulfilled' && gRes.value?.data) {
        setGroupList(gRes.value.data);
      } else {
        setGroupList([]);
        if (gRes.status === 'rejected') console.warn('Kelompok asset fetch failed:', gRes.reason);
      }

      if (lRes.status === 'fulfilled' && lRes.value?.data) {
        setLabsList(lRes.value.data);
      }

      if (uRes.status === 'fulfilled' && uRes.value?.data) {
        setUsersList(uRes.value.data);
      }
    } catch (err) {
      console.error('Failed to fetch asset group data:', err);
      setApiError(err.message || 'Gagal terhubung ke backend API (/api/kelompok-asset)');
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

  // Filter PIC candidates (Staff users, prioritize PIC flag)
  const picCandidates = useMemo(() => {
    return usersList.filter(
      (u) => u.role?.toLowerCase() === 'staff' || Boolean(u.pic)
    );
  }, [usersList]);

  // Client-side search and filtering
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return groupList.filter((item) => {
      if (filterLabId && String(item.lab_id) !== String(filterLabId)) {
        return false;
      }
      if (!q) return true;
      const kode = item.kode || '';
      const nama = item.nama || '';
      const labName = item.lab?.nama_labs || '';
      const picName = item.pic?.name || '';
      return [kode, nama, labName, picName].some((f) => f.toLowerCase().includes(q));
    });
  }, [groupList, searchQuery, filterLabId]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData(EMPTY_FORM);
    setFormError('');
    setModalMode('create');
  };

  // Open Edit Modal
  const handleOpenEdit = (group) => {
    setSelectedGroupId(group.id);
    setFormData({
      kode: group.kode || '',
      nama: group.nama || '',
      lab_id: group.lab_id || '',
      pic_id: group.pic_id || ''
    });
    setFormError('');
    setModalMode('edit');
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedGroupId(null);
    setFormData(EMPTY_FORM);
    setFormError('');
  };

  // Submit Form (Create / Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const cleanKode = formData.kode.trim();
      const cleanNama = formData.nama.trim();
      const cleanLabId = Number(formData.lab_id);
      const cleanPicId = Number(formData.pic_id);

      if (!cleanKode) throw new Error('Kode kelompok aset wajib diisi');
      if (!cleanNama) throw new Error('Nama kelompok aset wajib diisi');
      if (!cleanLabId) throw new Error('Laboratorium wajib dipilih');
      if (!cleanPicId) throw new Error('Petugas PIC wajib dipilih');

      const payload = {
        kode: cleanKode,
        nama: cleanNama,
        lab_id: cleanLabId,
        pic_id: cleanPicId
      };

      if (modalMode === 'create') {
        await kelompokAssetApi.create(payload);
        showNotice(`Kelompok aset "${cleanNama}" berhasil dibuat.`);
      } else if (modalMode === 'edit') {
        await kelompokAssetApi.update(selectedGroupId, payload);
        showNotice(`Kelompok aset "${cleanNama}" berhasil diperbarui.`);
      }

      handleCloseModal();
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan kelompok aset');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');

    try {
      await kelompokAssetApi.delete(deleteTarget.id);
      showNotice(`Kelompok aset "${deleteTarget.nama}" berhasil dihapus.`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setDeleteError(err.message || 'Gagal menghapus kelompok aset');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="app-shell">
      <Topbar
        user={user}
        onNavigate={onNavigate}
        title="Kelompok Aset"
        onUpdateUser={setUser}
      />
      <Sidebar activePath="/admin/kelompok-aset" onNavigate={onNavigate} />

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

        {apiError && (
          <div
            className="eq-confirm-banner"
            style={{
              background: '#FEF2F2',
              borderColor: '#FECACA',
              color: '#991B1B',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} color="#DC2626" />
              <span>{apiError}</span>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="eq-page-header">
          <div>
            <h1 className="eq-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Archive size={22} style={{ color: 'var(--color-primary-red)' }} />
              <span>Kelompok Aset Laboratorium</span>
            </h1>
            <p className="eq-page-sub">
              Pengelompokan aset inventaris peralatan, penugasan PIC, dan keterkaitan laboratorium Telkom Test House
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-hero-secondary" onClick={fetchData} title="Muat ulang data">
              <RefreshCw size={15} />
              <span>Segarkan</span>
            </button>
            <button className="btn-hero-primary" onClick={handleOpenCreate}>
              <Plus size={15} />
              <span>Tambah Kelompok</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <section className="stats-grid" style={{ marginBottom: '20px' }}>
          <article className="stat-card black">
            <div className="stat-header">
              <span className="stat-badge">Kelompok Aset</span>
              <div className="stat-icon-wrapper"><Archive size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">{loading ? '—' : groupList.length}</strong>
              <span className="stat-title">Total Kelompok Terdaftar</span>
            </div>
            <div className="stat-footer">
              <span className="stat-sub">Sesuai basis data backend</span>
            </div>
          </article>

          <article className="stat-card darkgray">
            <div className="stat-header">
              <span className="stat-badge">Laboratorium</span>
              <div className="stat-icon-wrapper"><Building2 size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">{loading ? '—' : labsList.length}</strong>
              <span className="stat-title">Lab Terhubung</span>
            </div>
            <div className="stat-footer">
              <span className="stat-sub">Induk pengelolaan peralatan</span>
            </div>
          </article>

          <article className="stat-card gray">
            <div className="stat-header">
              <span className="stat-badge">Personel PIC</span>
              <div className="stat-icon-wrapper"><UserCheck size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">{loading ? '—' : picCandidates.length}</strong>
              <span className="stat-title">PIC Siap Ditugaskan</span>
            </div>
            <div className="stat-footer">
              <span className="stat-sub">Staf pemegang tanggung jawab</span>
            </div>
          </article>
        </section>

        {/* Panel Konten Utama */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Daftar Kelompok Aset</h2>
              <p className="panel-subtitle">
                {filteredGroups.length} data ditampilkan dari total {groupList.length} kelompok
              </p>
            </div>

            {/* Filter dan Search Controls */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="eq-search-wrapper" style={{ minWidth: '220px' }}>
                <Search size={15} className="eq-search-icon" />
                <input
                  type="text"
                  className="eq-search-input"
                  placeholder="Cari kode, nama, PIC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="eq-form-input"
                style={{ width: 'auto', padding: '7px 12px', fontSize: '13px' }}
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
            </div>
          </div>

          {loading ? (
            <div className="eq-empty" style={{ padding: '40px' }}>
              <RefreshCw size={24} className="spin text-muted" style={{ margin: '0 auto 12px' }} />
              <p>Memuat data kelompok aset dari database...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="eq-empty">
              <FolderTree size={36} color="#9CA3AF" style={{ marginBottom: '10px' }} />
              <p style={{ fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>
                {groupList.length === 0 ? 'Belum Ada Kelompok Aset' : 'Tidak Ada Data yang Cocok'}
              </p>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                {groupList.length === 0
                  ? 'Klik tombol "Tambah Kelompok" untuk mendaftarkan kelompok aset baru.'
                  : 'Coba ubah kata kunci pencarian atau filter laboratorium Anda.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>No</th>
                    <th>Kode Kelompok</th>
                    <th>Nama Kelompok Aset</th>
                    <th>Laboratorium</th>
                    <th>Petugas PIC</th>
                    <th>Dibuat Pada</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((group, idx) => (
                    <tr key={group.id || idx}>
                      <td>
                        <span className="eq-row-num">{String(idx + 1).padStart(2, '0')}</span>
                      </td>
                      <td>
                        <span
                          className="loan-id-badge"
                          style={{
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            background: '#F3F4F6',
                            color: '#1F2937'
                          }}
                        >
                          {group.kode}
                        </span>
                      </td>
                      <td>
                        <strong className="tool-name-text" style={{ fontSize: '13.5px' }}>
                          {group.nama}
                        </strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building2 size={14} color="#6B7280" />
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                            {group.lab?.nama_labs || `Lab #${group.lab_id}`}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <UserCheck size={14} color="#2563EB" />
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#1E40AF' }}>
                            {group.pic?.name || `PIC #${group.pic_id}`}
                          </span>
                        </div>
                        {group.pic?.nip && (
                          <div style={{ fontSize: '11px', color: '#6B7280', paddingLeft: '20px' }}>
                            NIP: {group.pic.nip}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>
                          {group.created_at
                            ? new Date(group.created_at).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                            : '-'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="eq-actions" style={{ justifyContent: 'center' }}>
                          <button
                            className="eq-btn-action edit"
                            onClick={() => handleOpenEdit(group)}
                            title="Edit Kelompok Aset"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="eq-btn-action delete"
                            onClick={() => setDeleteTarget(group)}
                            title="Hapus Kelompok Aset"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL CREATE / EDIT */}
      {modalMode && (
        <div className="profile-modal-overlay">
          <div className="profile-modal" style={{ maxWidth: '480px' }}>
            <div className="profile-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Archive size={20} className="text-red" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  {modalMode === 'create' ? 'Tambah Kelompok Aset Baru' : 'Edit Kelompok Aset'}
                </h3>
              </div>
              <button className="profile-modal-close" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="profile-modal-body" style={{ padding: '20px' }}>
                {formError && (
                  <div
                    className="eq-confirm-banner"
                    style={{
                      background: '#FEF2F2',
                      borderColor: '#FECACA',
                      color: '#991B1B',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={15} color="#DC2626" />
                      <span style={{ fontSize: '13px' }}>{formError}</span>
                    </div>
                  </div>
                )}

                <div className="eq-form-group">
                  <label className="eq-form-label">
                    Kode Kelompok Aset <span className="eq-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="eq-form-input"
                    placeholder="Contoh: OPT-FIBER atau TEL-TX"
                    value={formData.kode}
                    onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                    required
                  />
                  <small style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px', display: 'block' }}>
                    Kode unik pengelompokan pada laboratorium terkait
                  </small>
                </div>

                <div className="eq-form-group">
                  <label className="eq-form-label">
                    Nama Kelompok Aset <span className="eq-required">*</span>
                  </label>
                  <input
                    type="text"
                    className="eq-form-input"
                    placeholder="Contoh: Kelompok Alat Uji Serat Optik"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    required
                  />
                </div>

                <div className="eq-form-group">
                  <label className="eq-form-label">
                    Pilih Laboratorium <span className="eq-required">*</span>
                  </label>
                  <select
                    className="eq-form-input"
                    value={formData.lab_id}
                    onChange={(e) => setFormData({ ...formData, lab_id: e.target.value })}
                    required
                  >
                    <option value="">-- Pilih Laboratorium --</option>
                    {labsList.map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.nama_labs} ({lab.kode_labs})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="eq-form-group">
                  <label className="eq-form-label">
                    Pilih Petugas PIC <span className="eq-required">*</span>
                  </label>
                  <select
                    className="eq-form-input"
                    value={formData.pic_id}
                    onChange={(e) => setFormData({ ...formData, pic_id: e.target.value })}
                    required
                  >
                    <option value="">-- Pilih Personel PIC --</option>
                    {picCandidates.map((staff) => (
                      <option key={staff.user_id} value={staff.user_id}>
                        {staff.name} {staff.nip ? `(NIP: ${staff.nip})` : ''} - {staff.position || 'Staff'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                className="profile-modal-footer"
                style={{ display: 'flex', gap: '10px', padding: '16px 20px', borderTop: '1px solid #E5E7EB' }}
              >
                <button
                  type="button"
                  className="eq-btn-cancel"
                  onClick={handleCloseModal}
                  disabled={formSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-hero-primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Menyimpan...' : modalMode === 'create' ? 'Buat Kelompok' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="profile-modal-overlay">
          <div className="profile-modal" style={{ maxWidth: '420px' }}>
            <div className="profile-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={20} color="#DC2626" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#991B1B' }}>
                  Konfirmasi Hapus
                </h3>
              </div>
              <button className="profile-modal-close" onClick={() => setDeleteTarget(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="profile-modal-body" style={{ padding: '20px' }}>
              {deleteError && (
                <div
                  className="eq-confirm-banner"
                  style={{
                    background: '#FEF2F2',
                    borderColor: '#FECACA',
                    color: '#991B1B',
                    marginBottom: '12px'
                  }}
                >
                  <span>{deleteError}</span>
                </div>
              )}
              <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus kelompok aset <strong>"{deleteTarget.nama}"</strong> (Kode:{' '}
                <code>{deleteTarget.kode}</code>)?
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#6B7280' }}>
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div
              className="profile-modal-footer"
              style={{ display: 'flex', gap: '10px', padding: '16px 20px', borderTop: '1px solid #E5E7EB' }}
            >
              <button
                type="button"
                className="eq-btn-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-hero-primary"
                style={{ background: '#DC2626', borderColor: '#DC2626' }}
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Kelompok'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
