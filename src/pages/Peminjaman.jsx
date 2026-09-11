import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRightLeft,
  Plus,
  Search,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileCheck2,
  Trash2
} from 'lucide-react';
import Topbar from '../components/layout/Topbar';
import Sidebar from '../components/layout/Sidebar';
import { peminjamanApi, peralatanApi, getStoredUser } from '../utils/api';

const EMPTY_LOAN_FORM = {
  peminjaman_id: '',
  peralatan_id: '',
  jumlah: 1,
  catatan: ''
};

export default function Peminjaman({ onNavigate }) {
  const [user, setUser] = useState(getStoredUser);
  const [loans, setLoans] = useState([]);
  const [activeEquipment, setActiveEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [notice, setNotice] = useState('');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal Pinjam Baru
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loanForm, setLoanForm] = useState(EMPTY_LOAN_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Modal Catat Kondisi
  const [kondisiModal, setKondisiModal] = useState(null); // { type: 'pinjam'|'kembali', loan }
  const [kondisiInput, setKondisiInput] = useState('Baik dan lengkap sesuai spesifikasi');
  const [catatanKondisi, setCatatanKondisi] = useState('');

  useEffect(() => {
    const handleUserChanged = (e) => {
      if (e.detail) setUser(e.detail);
    };
    window.addEventListener('sikepo_user_changed', handleUserChanged);
    return () => window.removeEventListener('sikepo_user_changed', handleUserChanged);
  }, []);

  const role = (user?.role || 'staff').toLowerCase();
  const isAdminOrManager = role === 'admin' || role === 'manager';

  const fetchLoans = async () => {
    setLoading(true);
    setApiError('');
    try {
      const [loanRes, eqRes] = await Promise.all([
        peminjamanApi.getAll(),
        peralatanApi.getAll({ limit: 100 })
      ]);

      if (loanRes?.data && Array.isArray(loanRes.data)) {
        setLoans(loanRes.data);
      } else {
        setLoans([]);
      }

      if (eqRes?.data && Array.isArray(eqRes.data)) {
        // Ambil alat yang aktif atau siap dipinjam
        setActiveEquipment(eqRes.data);
      }
    } catch (err) {
      console.warn('Gagal memuat transaksi peminjaman:', err);
      setApiError(err.message || 'Gagal memuat data peminjaman dari backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const showToast = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  const filteredLoans = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return loans.filter((l) => {
      if (statusFilter && l.status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (!q) return true;
      const toolName = l.peralatan?.nama_peralatan || '';
      const assetNo = l.peralatan?.nomor_aset || '';
      const pid = String(l.peminjaman_id);
      const note = l.catatan || '';
      return [toolName, assetNo, pid, note].some((f) => f.toLowerCase().includes(q));
    });
  }, [loans, searchQuery, statusFilter]);

  // Create Peminjaman
  const handleCreateLoan = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (!loanForm.peralatan_id) {
        throw new Error('Peralatan yang dipinjam wajib dipilih');
      }

      const generatedId = loanForm.peminjaman_id ? Number(loanForm.peminjaman_id) : Math.floor(Date.now() / 1000);

      await peminjamanApi.create({
        peminjaman_id: generatedId,
        peralatan_id: Number(loanForm.peralatan_id),
        jumlah: Number(loanForm.jumlah) || 1,
        catatan: loanForm.catatan.trim()
      });

      showToast('Pengajuan peminjaman alat berhasil dibuat.');
      setShowCreateModal(false);
      setLoanForm(EMPTY_LOAN_FORM);
      fetchLoans();
    } catch (err) {
      setFormError(err.message || 'Gagal membuat pengajuan peminjaman');
    } finally {
      setSubmitting(false);
    }
  };

  // Approve Peminjaman (Manager / Staff)
  const handleApprove = async (id) => {
    try {
      await peminjamanApi.approve(id, 'Disetujui oleh petugas laboratorium');
      showToast('Peminjaman alat berhasil disetujui (Approved).');
      fetchLoans();
    } catch (err) {
      alert(`Gagal menyetujui peminjaman: ${err.message}`);
    }
  };

  // Reject Peminjaman (Manager / Staff)
  const handleReject = async (id) => {
    const reason = window.prompt('Masukkan alasan penolakan peminjaman:');
    if (reason === null) return;

    try {
      await peminjamanApi.reject(id, reason || 'Ditolak');
      showToast('Peminjaman alat telah ditolak.');
      fetchLoans();
    } catch (err) {
      alert(`Gagal menolak peminjaman: ${err.message}`);
    }
  };

  // Set Kondisi (Pinjam / Kembali)
  const handleSaveKondisi = async () => {
    if (!kondisiModal) return;
    const { type, loan } = kondisiModal;

    try {
      if (type === 'pinjam') {
        await peminjamanApi.setKondisiPinjam(loan.id, {
          kondisi: kondisiInput,
          catatan: catatanKondisi
        });
        showToast('Kondisi fisik saat penyerahan alat berhasil dicatat.');
      } else {
        await peminjamanApi.setKondisiKembali(loan.id, {
          kondisi: kondisiInput,
          catatan: catatanKondisi
        });
        showToast('Kondisi fisik saat pengembalian alat berhasil dicatat.');
      }

      setKondisiModal(null);
      fetchLoans();
    } catch (err) {
      alert(`Gagal mencatat kondisi: ${err.message}`);
    }
  };

  // Delete Loan
  const handleDeleteLoan = async (id) => {
    if (!window.confirm('Hapus riwayat peminjaman ini?')) return;
    try {
      await peminjamanApi.delete(id);
      showToast('Data peminjaman berhasil dihapus.');
      fetchLoans();
    } catch (err) {
      alert(`Gagal menghapus peminjaman: ${err.message}`);
    }
  };

  return (
    <div className="app-shell">
      <Topbar user={user} onNavigate={onNavigate} title="Peminjaman Alat" onUpdateUser={(u) => setUser(u)} />
      <Sidebar activePath="/peminjaman" onNavigate={onNavigate} />

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
            <h1 className="eq-page-title">Peminjaman & Mutasi Alat</h1>
            <p className="eq-page-sub">
              Sistem pencatatan transaksi peminjaman, approval mutu, dan serah-terima fisik alat
            </p>
          </div>
          <button className="btn-hero-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            <span>+ Ajukan Peminjaman</span>
          </button>
        </div>

        {/* Stats Grid */}
        <section className="stats-grid" style={{ marginBottom: '20px' }}>
          <article className="stat-card black">
            <div className="stat-header">
              <span className="stat-badge">Total Peminjaman</span>
              <div className="stat-icon-wrapper"><ArrowRightLeft size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">{loans.length} Transaksi</strong>
              <span className="stat-title">Semua Riwayat Peminjaman</span>
            </div>
          </article>

          <article className="stat-card red">
            <div className="stat-header">
              <span className="stat-badge">Menunggu Approval</span>
              <div className="stat-icon-wrapper"><Clock size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">
                {loans.filter((l) => l.status === 'pending').length} Alat
              </strong>
              <span className="stat-title">Pending Persetujuan</span>
            </div>
          </article>

          <article className="stat-card darkgray">
            <div className="stat-header">
              <span className="stat-badge">Disetujui</span>
              <div className="stat-icon-wrapper"><CheckCircle2 size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">
                {loans.filter((l) => l.status === 'approved').length} Alat
              </strong>
              <span className="stat-title">Status Disetujui</span>
            </div>
          </article>
        </section>

        {/* Filter and Search */}
        <div className="eq-filter-card" style={{ marginBottom: '16px' }}>
          <div className="eq-filter-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari nama peralatan, nomor aset, atau catatan tujuan..."
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
              <option value="">Semua Status Approval</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              className="btn-refresh"
              onClick={fetchLoans}
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
              <h2>Data Transaksi Peminjaman</h2>
              <p className="panel-subtitle">
                {loading ? 'Memuat data dari backend...' : `${filteredLoans.length} transaksi ditemukan`}
              </p>
            </div>
          </div>

          {apiError && (
            <div style={{ padding: '14px 20px', background: '#FEF2F2', borderBottom: '1px solid #FECACA', color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} />
                <span>{apiError}</span>
              </div>
              <button className="btn-hero-secondary" style={{ padding: '4px 10px', fontSize: '11.5px' }} onClick={fetchLoans}>
                Coba Lagi
              </button>
            </div>
          )}

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>ID Peminjaman</th>
                  <th>Peralatan</th>
                  <th>Jumlah</th>
                  <th>Status Approval</th>
                  <th>Kondisi Pinjam</th>
                  <th>Kondisi Kembali</th>
                  <th>Aksi & Otorisasi</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((l, idx) => {
                  const statusLower = (l.status || 'pending').toLowerCase();
                  const isApproved = statusLower === 'approved';
                  const isPending = statusLower === 'pending';

                  return (
                    <tr key={l.id || idx}>
                      <td><span className="eq-row-num">{String(idx + 1).padStart(2, '0')}</span></td>
                      <td>
                        <span className="loan-id-badge">#{l.peminjaman_id}</span>
                        {l.created_at && (
                          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                            {new Date(l.created_at).toLocaleDateString('id-ID')}
                          </div>
                        )}
                      </td>
                      <td>
                        <div>
                          <strong className="tool-name-text">
                            {l.peralatan?.nama_peralatan || `Peralatan #${l.peralatan_id}`}
                          </strong>
                          <br />
                          <small style={{ color: '#6B7280' }}>
                            Aset: {l.peralatan?.nomor_aset || '-'} · {l.peralatan?.merk || ''}
                          </small>
                          {l.catatan && (
                            <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#4B5563', fontStyle: 'italic' }}>
                              "{l.catatan}"
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong>{l.jumlah} Unit</strong>
                      </td>
                      <td>
                        <span
                          className={`role-tag-badge ${
                            statusLower === 'approved' ? 'admin' : statusLower === 'rejected' ? 'staff' : 'manager'
                          }`}
                        >
                          {statusLower.toUpperCase()}
                        </span>
                        {l.verified_by_user && (
                          <div style={{ fontSize: '10.5px', color: '#6B7280', marginTop: '3px' }}>
                            Oleh: {l.verified_by_user.name}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: l.kondisi_saat_pinjam ? '#111827' : '#9CA3AF' }}>
                          {l.kondisi_saat_pinjam || 'Belum dicatat'}
                        </span>
                        {(role === 'staff' || isAdminOrManager) && (
                          <button
                            className="eq-btn-action edit"
                            style={{ display: 'inline-flex', padding: '2px 6px', fontSize: '10px', marginLeft: '6px' }}
                            onClick={() => {
                              setKondisiInput(l.kondisi_saat_pinjam || 'Baik dan lengkap');
                              setCatatanKondisi('');
                              setKondisiModal({ type: 'pinjam', loan: l });
                            }}
                            title="Catat kondisi serah terima pinjam"
                          >
                            Ubah
                          </button>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: l.kondisi_saat_kembali ? '#111827' : '#9CA3AF' }}>
                          {l.kondisi_saat_kembali || 'Belum kembali'}
                        </span>
                        {(role === 'staff' || isAdminOrManager) && (
                          <button
                            className="eq-btn-action edit"
                            style={{ display: 'inline-flex', padding: '2px 6px', fontSize: '10px', marginLeft: '6px' }}
                            onClick={() => {
                              setKondisiInput(l.kondisi_saat_kembali || 'Baik dan lengkap');
                              setCatatanKondisi('');
                              setKondisiModal({ type: 'kembali', loan: l });
                            }}
                            title="Catat kondisi saat dikembalikan"
                          >
                            Ubah
                          </button>
                        )}
                      </td>
                      <td>
                        <div className="eq-actions">
                          {isPending && (role === 'manager' || role === 'staff' || role === 'admin') && (
                            <>
                              <button
                                className="btn-hero-primary"
                                style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }}
                                onClick={() => handleApprove(l.id)}
                                title="Setujui Peminjaman"
                              >
                                <Check size={12} /> Setujui
                              </button>
                              <button
                                className="eq-btn-cancel"
                                style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }}
                                onClick={() => handleReject(l.id)}
                                title="Tolak Peminjaman"
                              >
                                <X size={12} /> Tolak
                              </button>
                            </>
                          )}

                          {isAdminOrManager && (
                            <button
                              className="eq-btn-action delete"
                              onClick={() => handleDeleteLoan(l.id)}
                              title="Hapus Transaksi"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filteredLoans.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#6B7280' }}>
                      Belum ada catatan peminjaman alat yang sesuai.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL AJUKAN PEMINJAMAN */}
      {showCreateModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal" style={{ maxWidth: '480px' }}>
            <div className="profile-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={20} className="text-red" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  Ajukan Peminjaman Peralatan
                </h3>
              </div>
              <button className="profile-modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLoan}>
              <div className="profile-modal-body" style={{ padding: '20px' }}>
                {formError && (
                  <div className="error-banner" style={{ marginBottom: '14px' }}>
                    {formError}
                  </div>
                )}

                <div className="eq-form-group">
                  <label className="eq-form-label">Nomor / ID Transaksi Peminjaman</label>
                  <input
                    type="number"
                    className="eq-form-input"
                    placeholder="Contoh: 1001 (Kosongkan untuk otomatis)"
                    value={loanForm.peminjaman_id}
                    onChange={(e) => setLoanForm({ ...loanForm, peminjaman_id: e.target.value })}
                  />
                </div>

                <div className="eq-form-group">
                  <label className="eq-form-label">Pilih Peralatan *</label>
                  <select
                    className="eq-form-input"
                    value={loanForm.peralatan_id}
                    onChange={(e) => setLoanForm({ ...loanForm, peralatan_id: e.target.value })}
                    required
                  >
                    <option value="">-- Pilih Alat Yang Ingin Dipinjam --</option>
                    {activeEquipment.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.nomor_aset || eq.assetNumber} - {eq.nama_peralatan || eq.name} ({eq.status_kelayakan || eq.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="eq-form-group">
                  <label className="eq-form-label">Jumlah Unit *</label>
                  <input
                    type="number"
                    min="1"
                    className="eq-form-input"
                    value={loanForm.jumlah}
                    onChange={(e) => setLoanForm({ ...loanForm, jumlah: e.target.value })}
                    required
                  />
                </div>

                <div className="eq-form-group">
                  <label className="eq-form-label">Tujuan Penggunaan & Catatan</label>
                  <textarea
                    className="eq-form-input"
                    rows="2"
                    placeholder="Contoh: Pengujian kabel fiber optik di Ruang Transmisi R01"
                    value={loanForm.catatan}
                    onChange={(e) => setLoanForm({ ...loanForm, catatan: e.target.value })}
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
                  {submitting ? 'Menyimpan...' : 'Ajukan Peminjaman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CATAT KONDISI FISIK (PINJAM / KEMBALI) */}
      {kondisiModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal" style={{ maxWidth: '440px' }}>
            <div className="profile-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck2 size={20} className="text-red" />
                <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700 }}>
                  Catat Kondisi Saat {kondisiModal.type === 'pinjam' ? 'Dipinjam' : 'Dikembalikan'}
                </h3>
              </div>
              <button className="profile-modal-close" onClick={() => setKondisiModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="profile-modal-body" style={{ padding: '20px' }}>
              <div className="eq-form-group">
                <label className="eq-form-label">Status Kondisi Fisik *</label>
                <select
                  className="eq-form-input"
                  value={kondisiInput}
                  onChange={(e) => setKondisiInput(e.target.value)}
                >
                  <option value="Baik dan lengkap sesuai spesifikasi">Baik dan lengkap sesuai spesifikasi</option>
                  <option value="Ada goresan ringan pada bodi">Ada goresan ringan pada bodi</option>
                  <option value="Aksesoris tidak lengkap">Aksesoris tidak lengkap</option>
                  <option value="Perlu perbaikan / kalibrasi">Perlu perbaikan / kalibrasi</option>
                </select>
              </div>

              <div className="eq-form-group">
                <label className="eq-form-label">Catatan Tambahan Petugas</label>
                <textarea
                  className="eq-form-input"
                  rows="2"
                  placeholder="Catatan kondisi fisik alat saat serah-terima..."
                  value={catatanKondisi}
                  onChange={(e) => setCatatanKondisi(e.target.value)}
                />
              </div>
            </div>

            <div className="profile-modal-footer" style={{ display: 'flex', gap: '10px', padding: '16px 20px' }}>
              <button className="eq-btn-cancel" onClick={() => setKondisiModal(null)}>
                Batal
              </button>
              <button className="btn-hero-primary" onClick={handleSaveKondisi}>
                Simpan Kondisi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
