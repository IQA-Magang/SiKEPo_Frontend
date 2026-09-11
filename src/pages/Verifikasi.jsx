import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Check,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  CheckCircle2,
  X,
  ClipboardList
} from 'lucide-react';
import Topbar from '../components/layout/Topbar';
import Sidebar from '../components/layout/Sidebar';
import { verifikasiApi, peralatanApi, getStoredUser } from '../utils/api';

// Checklist items sesuai prosedur TLKM13/P backend
const CHECKLIST_ITEMS = [
  { key: 'identitas',    label: 'Identitas Alat' },
  { key: 'kelengkapan',  label: 'Kelengkapan Alat' },
  { key: 'firmware',     label: 'Firmware / Software' },
  { key: 'kondisi_fisik',label: 'Kondisi Fisik' },
  { key: 'segel',        label: 'Segel / Label' },
  { key: 'fungsi_awal',  label: 'Fungsi Awal (Power-On)' },
  { key: 'metrologi',    label: 'Metrologi / Akurasi' },
  { key: 'sertifikat',   label: 'Sertifikat Kalibrasi' },
];

const EMPTY_CHECKLIST = {
  identitas: 'S',
  kelengkapan: 'S',
  firmware: 'S',
  kondisi_fisik: 'S',
  segel: 'S',
  fungsi_awal: 'S',
  metrologi: 'S',
  sertifikat: 'S',
  catatan: ''
};

const EMPTY_FORM = {
  id_peralatan: '',
  kode_aktivitas: 'TLKM13/P-001',
  tanggal_verifikasi: new Date().toISOString().split('T')[0],
  tindak_lanjut: '',
  catatan: '',
  hasil_verifikasi: { ...EMPTY_CHECKLIST }
};

export default function Verifikasi({ onNavigate }) {
  const [user, setUser] = useState(getStoredUser);
  const [verifikasiList, setVerifikasiList] = useState([]);
  const [peralatanList, setPeralatanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [notice, setNotice] = useState('');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal Buat Verifikasi
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Modal Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const handleUserChanged = (e) => {
      if (e.detail) setUser(e.detail);
    };
    window.addEventListener('sikepo_user_changed', handleUserChanged);
    return () => window.removeEventListener('sikepo_user_changed', handleUserChanged);
  }, []);

  const role = (user?.role || 'staff').toLowerCase();
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';

  const fetchData = async () => {
    setLoading(true);
    setApiError('');
    try {
      const [verRes, eqRes] = await Promise.all([
        verifikasiApi.getAll(),
        peralatanApi.getAll({ limit: 200 })
      ]);

      if (verRes?.data && Array.isArray(verRes.data)) {
        setVerifikasiList(verRes.data);
      } else {
        setVerifikasiList([]);
      }

      if (eqRes?.data && Array.isArray(eqRes.data)) {
        setPeralatanList(eqRes.data);
      }
    } catch (err) {
      console.warn('Gagal memuat data verifikasi:', err);
      setApiError(err.message || 'Gagal memuat data verifikasi dari backend (/api/verifikasi)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  // Status diambil dari field verified_by (backend tidak punya field "status")
  const getStatus = (v) => (v.verified_by ? 'approved' : 'pending');

  const filteredList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return verifikasiList.filter((v) => {
      if (statusFilter && getStatus(v) !== statusFilter) return false;
      if (!q) return true;
      const namaAlat = v.peralatan?.nama_peralatan || '';
      const nomorAset = v.peralatan?.nomor_aset || '';
      const kode = v.kode_aktivitas || '';
      const keputusan = v.keputusan || '';
      return [namaAlat, nomorAset, kode, keputusan].some((f) => f.toLowerCase().includes(q));
    });
  }, [verifikasiList, searchQuery, statusFilter]);

  // Hitung statistik
  const totalVerifikasi = verifikasiList.length;
  const pendingCount = verifikasiList.filter((v) => !v.verified_by).length;
  const approvedCount = verifikasiList.filter((v) => !!v.verified_by).length;

  // Helper update checklist item
  const setChecklist = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      hasil_verifikasi: { ...prev.hasil_verifikasi, [key]: value }
    }));
  };

  // Buat Verifikasi Baru
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (!formData.id_peralatan) {
        throw new Error('Peralatan wajib dipilih');
      }
      if (!formData.kode_aktivitas.trim()) {
        throw new Error('Kode aktivitas wajib diisi');
      }
      if (!formData.tanggal_verifikasi) {
        throw new Error('Tanggal verifikasi wajib diisi');
      }

      await verifikasiApi.create({
        id_peralatan: Number(formData.id_peralatan),
        kode_aktivitas: formData.kode_aktivitas.trim(),
        tanggal_verifikasi: formData.tanggal_verifikasi,
        tindak_lanjut: formData.tindak_lanjut.trim(),
        catatan: formData.catatan.trim(),
        hasil_verifikasi: formData.hasil_verifikasi
      });

      showToast('Verifikasi peralatan berhasil dibuat.');
      setShowCreateModal(false);
      setFormData(EMPTY_FORM);
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Gagal membuat verifikasi');
    } finally {
      setSubmitting(false);
    }
  };

  // Approve Verifikasi (Manager)
  const handleApprove = async (id, namaAlat) => {
    try {
      await verifikasiApi.approve(id);
      showToast(`Verifikasi untuk "${namaAlat}" berhasil disetujui.`);
      fetchData();
    } catch (err) {
      alert(`Gagal menyetujui verifikasi: ${err.message}`);
    }
  };

  // Hapus Verifikasi (Admin)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await verifikasiApi.delete(deleteTarget.id_verifikasi);
      showToast(`Verifikasi berhasil dihapus.`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setDeleteError(err.message || 'Gagal menghapus verifikasi');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="app-shell">
      <Topbar user={user} onNavigate={onNavigate} title="Verifikasi Peralatan" onUpdateUser={(u) => setUser(u)} />
      <Sidebar activePath="/verifikasi" onNavigate={onNavigate} />

      <main className="main-content">
        {/* Toast Notice */}
        {notice && (
          <div
            className="eq-confirm-banner"
            style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46', marginBottom: '16px' }}
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
            <h1 className="eq-page-title">Verifikasi Peralatan</h1>
            <p className="eq-page-sub">
              Pencatatan hasil verifikasi, kalibrasi, dan pemeriksaan kelayakan alat ukur
            </p>
          </div>
          <button className="btn-hero-primary" onClick={() => { setFormData(EMPTY_FORM); setFormError(''); setShowCreateModal(true); }}>
            <Plus size={16} />
            <span>+ Buat Verifikasi</span>
          </button>
        </div>

        {/* Stats Grid */}
        <section className="stats-grid" style={{ marginBottom: '20px' }}>
          <article className="stat-card black">
            <div className="stat-header">
              <span className="stat-badge">Total Verifikasi</span>
              <div className="stat-icon-wrapper"><ClipboardList size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">{totalVerifikasi} Catatan</strong>
              <span className="stat-title">Semua Rekam Verifikasi</span>
            </div>
          </article>

          <article className="stat-card red">
            <div className="stat-header">
              <span className="stat-badge">Menunggu Approval</span>
              <div className="stat-icon-wrapper"><Clock size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">{pendingCount} Alat</strong>
              <span className="stat-title">Pending Persetujuan Manager</span>
            </div>
          </article>

          <article className="stat-card darkgray">
            <div className="stat-header">
              <span className="stat-badge">Disetujui</span>
              <div className="stat-icon-wrapper"><CheckCircle2 size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">{approvedCount} Alat</strong>
              <span className="stat-title">Status Sudah Disetujui</span>
            </div>
          </article>
        </section>

        {/* Filter & Search */}
        <div className="eq-filter-card" style={{ marginBottom: '16px' }}>
          <div className="eq-filter-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari nama peralatan, kode aktivitas, atau keputusan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="eq-filter-selects">
            <select
              className="eq-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
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
              <h2>Daftar Verifikasi</h2>
              <p className="panel-subtitle">
                {loading ? 'Memuat data dari backend...' : `${filteredList.length} catatan ditemukan`}
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
                  <th>Peralatan</th>
                  <th>Kode Aktivitas</th>
                  <th>Tanggal</th>
                  <th>Keputusan</th>
                  <th>Catatan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((v, idx) => {
                  const status = getStatus(v);
                  const isPending = status === 'pending';
                  const namaAlat = v.peralatan?.nama_peralatan || `Peralatan #${v.id_peralatan}`;
                  const nomorAset = v.peralatan?.nomor_aset || '-';

                  return (
                    <tr key={v.id_verifikasi || idx}>
                      <td><span className="eq-row-num">{String(idx + 1).padStart(2, '0')}</span></td>
                      <td>
                        <div>
                          <strong className="tool-name-text">{namaAlat}</strong>
                          <br />
                          <small style={{ color: '#6B7280' }}>Aset: {nomorAset}</small>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: '#374151' }}>{v.kode_aktivitas || '-'}</span>
                      </td>
                      <td>
                        <span className="date-text">
                          {v.tanggal_verifikasi
                            ? new Date(v.tanggal_verifikasi).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })
                            : '-'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12.5px', color: v.keputusan ? '#374151' : '#9CA3AF', fontStyle: v.keputusan ? 'normal' : 'italic' }}>
                          {v.keputusan || 'Belum ditentukan'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: v.catatan ? '#4B5563' : '#9CA3AF', fontStyle: v.catatan ? 'normal' : 'italic' }}>
                          {v.catatan || 'Tidak ada catatan'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`role-tag-badge ${
                            status === 'approved' ? 'admin' : 'manager'
                          }`}
                        >
                          {status === 'approved' ? 'APPROVED' : 'PENDING'}
                        </span>
                      </td>
                      <td>
                        <div className="eq-actions">
                          {isPending && isManager && (
                            <button
                              className="btn-hero-primary"
                              style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }}
                              onClick={() => handleApprove(v.id_verifikasi, namaAlat)}
                              title="Setujui Verifikasi"
                            >
                              <Check size={12} /> Setujui
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              className="eq-btn-action delete"
                              onClick={() => { setDeleteError(''); setDeleteTarget(v); }}
                              title="Hapus Verifikasi"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}

                          {!isPending && !isAdmin && (
                            <span style={{ fontSize: '11px', color: '#9CA3AF', fontStyle: 'italic' }}>
                              —
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filteredList.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#6B7280' }}>
                      Belum ada catatan verifikasi yang sesuai.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#6B7280' }}>
                      Memuat data...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL BUAT VERIFIKASI */}
      {showCreateModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal" style={{ maxWidth: '580px' }}>
            <div className="profile-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} className="text-red" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  Buat Catatan Verifikasi Baru
                </h3>
              </div>
              <button className="profile-modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="profile-modal-body" style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                {formError && (
                  <div className="error-banner" style={{ marginBottom: '14px' }}>
                    {formError}
                  </div>
                )}

                {/* Pilih Peralatan */}
                <div className="eq-form-group">
                  <label className="eq-form-label">Pilih Peralatan *</label>
                  <select
                    className="eq-form-input"
                    value={formData.id_peralatan}
                    onChange={(e) => setFormData({ ...formData, id_peralatan: e.target.value })}
                    required
                  >
                    <option value="">-- Pilih Peralatan yang Diverifikasi --</option>
                    {peralatanList.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.nomor_aset} - {eq.nama_peralatan}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kode Aktivitas */}
                <div className="eq-form-group">
                  <label className="eq-form-label">Kode Aktivitas *</label>
                  <input
                    type="text"
                    className="eq-form-input"
                    placeholder="Contoh: TLKM13/P-001"
                    value={formData.kode_aktivitas}
                    onChange={(e) => setFormData({ ...formData, kode_aktivitas: e.target.value })}
                    required
                  />
                </div>

                {/* Tanggal Verifikasi */}
                <div className="eq-form-group">
                  <label className="eq-form-label">Tanggal Verifikasi *</label>
                  <input
                    type="date"
                    className="eq-form-input"
                    value={formData.tanggal_verifikasi}
                    onChange={(e) => setFormData({ ...formData, tanggal_verifikasi: e.target.value })}
                    required
                  />
                </div>

                {/* Checklist Hasil Verifikasi */}
                <div className="eq-form-group">
                  <label className="eq-form-label">Checklist Hasil Verifikasi *</label>
                  <div style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginTop: '6px'
                  }}>
                    {/* Header */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      padding: '8px 14px',
                      background: '#F9FAFB',
                      borderBottom: '1px solid #E5E7EB',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: '#6B7280'
                    }}>
                      <span>Item Pemeriksaan</span>
                      <span style={{ display: 'flex', gap: '24px', marginRight: '4px' }}>
                        <span style={{ width: '28px', textAlign: 'center' }}>S</span>
                        <span style={{ width: '28px', textAlign: 'center' }}>TS</span>
                        <span style={{ width: '28px', textAlign: 'center' }}>TB</span>
                      </span>
                    </div>
                    {/* Rows */}
                    {CHECKLIST_ITEMS.map((item, i) => (
                      <div key={item.key} style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        padding: '9px 14px',
                        alignItems: 'center',
                        background: i % 2 === 0 ? '#fff' : '#FAFAFA',
                        borderBottom: i < CHECKLIST_ITEMS.length - 1 ? '1px solid #F3F4F6' : 'none'
                      }}>
                        <span style={{ fontSize: '13px', color: '#374151' }}>{item.label}</span>
                        <span style={{ display: 'flex', gap: '24px', marginRight: '4px' }}>
                          {['S', 'TS', 'TB'].map((val) => (
                            <label key={val} style={{ display: 'flex', justifyContent: 'center', width: '28px', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name={`checklist-${item.key}`}
                                value={val}
                                checked={formData.hasil_verifikasi[item.key] === val}
                                onChange={() => setChecklist(item.key, val)}
                                style={{ cursor: 'pointer' }}
                              />
                            </label>
                          ))}
                        </span>
                      </div>
                    ))}
                    {/* Catatan checklist */}
                    <div style={{ padding: '10px 14px', borderTop: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                      <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '5px' }}>
                        Catatan Checklist
                      </label>
                      <input
                        type="text"
                        className="eq-form-input"
                        style={{ marginBottom: 0, fontSize: '12.5px' }}
                        placeholder="Catatan khusus untuk hasil checklist..."
                        value={formData.hasil_verifikasi.catatan}
                        onChange={(e) => setChecklist('catatan', e.target.value)}
                      />
                    </div>
                  </div>
                  <small style={{ color: '#6B7280', fontSize: '11.5px', marginTop: '5px', display: 'block' }}>
                    S = Sesuai &nbsp;·&nbsp; TS = Tidak Sesuai &nbsp;·&nbsp; TB = Tidak Berlaku
                  </small>
                </div>

                {/* Tindak Lanjut */}
                <div className="eq-form-group">
                  <label className="eq-form-label">Tindak Lanjut</label>
                  <input
                    type="text"
                    className="eq-form-input"
                    placeholder="Contoh: Kalibrasi ulang, perbaikan sensor..."
                    value={formData.tindak_lanjut}
                    onChange={(e) => setFormData({ ...formData, tindak_lanjut: e.target.value })}
                  />
                </div>

                {/* Catatan Tambahan */}
                <div className="eq-form-group">
                  <label className="eq-form-label">Catatan Tambahan</label>
                  <textarea
                    className="eq-form-input"
                    rows="3"
                    placeholder="Catatan detail hasil pemeriksaan, nomor sertifikat kalibrasi, dll..."
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  />
                </div>
              </div>

              <div className="profile-modal-footer" style={{ display: 'flex', gap: '10px', padding: '16px 20px' }}>
                <button
                  type="button"
                  className="eq-btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-hero-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Verifikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteTarget && (
        <div className="profile-modal-overlay">
          <div className="profile-modal" style={{ maxWidth: '420px' }}>
            <div className="profile-modal-header">
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#DC2626' }}>
                Konfirmasi Hapus Verifikasi
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
              <p style={{ fontSize: '13.5px', color: '#374151', lineHeight: '1.6' }}>
                Apakah Anda yakin ingin menghapus catatan verifikasi{' '}
                <strong>
                  "{deleteTarget.kode_aktivitas || `#${deleteTarget.id_verifikasi}`}" untuk{' '}
                  {deleteTarget.peralatan?.nama_peralatan || `Peralatan #${deleteTarget.id_peralatan}`}
                </strong>
                ? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="profile-modal-footer" style={{ display: 'flex', gap: '10px', padding: '16px 20px' }}>
              <button className="eq-btn-cancel" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Batal
              </button>
              <button
                className="eq-btn-action delete"
                style={{ padding: '8px 16px' }}
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
