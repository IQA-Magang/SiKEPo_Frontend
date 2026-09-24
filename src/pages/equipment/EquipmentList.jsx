import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, ChevronRight, RefreshCw, QrCode } from 'lucide-react';
import { getEquipmentId, getEquipmentCategoryId, formatPhotoUrl, peralatanApi, STATUS_ALAT_OPTIONS, STATUS_BADGE_CLASS } from '../../utils/api.js';
import { ACCESS, ACTIONS, can } from '../../utils/permissions.js';


// ------------------------------------------------------------------
// Daftar Peralatan
// ------------------------------------------------------------------
export default function EquipmentList({ onNavigate, initialLifecycle = 'active' }) {
  const canCreate = can(ACCESS.INPUT_EQUIPMENT, ACTIONS.ADD);
  const canViewVerification = can(ACCESS.EQUIPMENT_ELIGIBILITY, ACTIONS.VIEW);
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterKat, setFilterKat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [lifecycleView, setLifecycleView] = useState(initialLifecycle);


  useEffect(() => { loadData(); }, []);
  useEffect(() => { setLifecycleView(initialLifecycle); }, [initialLifecycle]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await peralatanApi.getAll();
      setList(res.data || []);
    } catch (err) {
      console.error('Gagal memuat peralatan:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filter
  const filtered = list.filter((p) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      p.nama_peralatan?.toLowerCase().includes(q) ||
      p.nomor_aset?.toLowerCase().includes(q) ||
      p.merek?.toLowerCase().includes(q);
    const catId = getEquipmentCategoryId(p);
    const matchKat = !filterKat || String(catId) === filterKat;
    const matchStatus = !filterStatus || p.status_alat === filterStatus;
    const approved = p.status_verifikasi === 'Disetujui';
    const rejected = p.status_verifikasi === 'Ditolak';
    const archived = p.status_alat === 'Dihapuskan';
    const pending = !approved && !rejected && !archived;
    const matchLifecycle = lifecycleView === 'active' ? approved && !archived
      : lifecycleView === 'pending' ? pending
        : lifecycleView === 'review' ? rejected
          : lifecycleView === 'archived' ? archived : true;
    return matchQ && matchKat && matchStatus && matchLifecycle;
  });

  const categories = Array.from(
    new Map(
      list
        .filter((item) => item.kategori_peralatan?.id && item.kategori_peralatan?.nama_kategori)
        .map((item) => [item.kategori_peralatan.id, item.kategori_peralatan])
    ).values()
  );
  const counts = {
    active: list.filter((item) => item.status_verifikasi === 'Disetujui' && item.status_alat !== 'Dihapuskan').length,
    pending: list.filter((item) => item.status_verifikasi !== 'Disetujui' && item.status_verifikasi !== 'Ditolak' && item.status_alat !== 'Dihapuskan').length,
    review: list.filter((item) => item.status_verifikasi === 'Ditolak').length,
    archived: list.filter((item) => item.status_alat === 'Dihapuskan').length,
  };
  const lifecycleCopy = {
    active: ['Daftar Peralatan', 'alat telah disetujui dan dapat digunakan'],
    pending: ['Menunggu Verifikasi', 'alat berada di karantina dan belum dapat digunakan'],
    review: ['Peralatan dalam Peninjauan', 'alat ditolak dan membutuhkan tindak lanjut'],
    archived: ['Arsip Peralatan', 'alat telah dihapuskan dari layanan'],
    all: ['Seluruh Peralatan', 'seluruh status siklus hidup peralatan'],
  };
  const [title, description] = lifecycleCopy[lifecycleView];

  return (
    <div className="page-container fade-in-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">
            {loading ? 'Memuat...' : `${filtered.length} ${description}`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>

          {canCreate && (
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('/peralatan/tambah')}
              id="btn-tambah-peralatan"
            >
              <Plus size={16} /> Tambah Peralatan
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 6, display: 'flex', gap: 6, width: 'fit-content', marginBottom: 'var(--sp-5)' }}>
        <button className={`btn btn-sm ${lifecycleView === 'active' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setLifecycleView('active')}>Daftar Peralatan ({counts.active})</button>
        <button className={`btn btn-sm ${lifecycleView === 'pending' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setLifecycleView('pending')}>Menunggu Verifikasi ({counts.pending})</button>
        <button className={`btn btn-sm ${lifecycleView === 'review' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setLifecycleView('review')}>Dalam Peninjauan ({counts.review})</button>
        <button className={`btn btn-sm ${lifecycleView === 'archived' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setLifecycleView('archived')}>Arsip ({counts.archived})</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
          <Search className="search-icon" />
          <input
            id="input-search-peralatan"
            className="form-input"
            type="text"
            placeholder="Cari nama, nomor aset, merek..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          id="select-filter-kategori"
          className="form-select"
          value={filterKat}
          onChange={(e) => setFilterKat(e.target.value)}
          style={{ width: 'auto', minWidth: 180 }}
        >
          <option value="">Semua Kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={String(category.id)}>{category.nama_kategori}</option>
          ))}
        </select>

        <select
          id="select-filter-status"
          className="form-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ width: 'auto', minWidth: 160 }}
        >
          <option value="">Semua Status</option>
          {STATUS_ALAT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <button
          className="btn btn-secondary btn-icon"
          onClick={loadData}
          title="Refresh"
          id="btn-refresh-peralatan"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Tabel */}
      {loading ? (
        <div className="card" style={{ padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={32} /></div>
          <p className="empty-state-title">Tidak ada peralatan ditemukan</p>
          <p className="empty-state-desc">Tidak ada peralatan pada tahap ini.</p>
          {canCreate && <button className="btn btn-primary" onClick={() => onNavigate('/peralatan/tambah')} style={{ marginTop: 'var(--sp-2)' }}>
            <Plus size={16} /> Tambah Peralatan Pertama
          </button>}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Foto</th>
                <th>Nama Peralatan</th>
                <th>No. Aset</th>
                <th>Kategori</th>
                <th>Status Proses</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const photoUrl = formatPhotoUrl(p.foto);
                const equipmentId = getEquipmentId(p);
                const categoryId = getEquipmentCategoryId(p);
                const approved = p.status_verifikasi === 'Disetujui';
                const rejected = p.status_verifikasi === 'Ditolak';
                const verificationLabel = p.status_verifikasi || 'Belum Diverifikasi';
                return (
                  <tr key={equipmentId}>
                    <td style={{ color: 'var(--clr-dark-400)', width: 40 }}>{i + 1}</td>
                    <td style={{ width: 56 }}>
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={p.nama_peralatan}
                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-dark-200)' }}
                        />
                      ) : (
                        <div style={{
                          width: 40, height: 40, borderRadius: 'var(--radius-md)',
                          background: 'var(--clr-dark-100)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Package size={16} style={{ color: 'var(--clr-dark-400)' }} />
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 'var(--fw-medium)', color: 'var(--clr-dark-900)' }}>{p.nama_peralatan}</div>
                      {p.merek && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-400)' }}>{p.merek}{p.tipe_model ? ` — ${p.tipe_model}` : ''}</div>}
                    </td>
                    <td>
                      <code style={{ fontSize: 'var(--text-xs)', background: 'var(--clr-dark-100)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                        {p.nomor_aset}
                      </code>
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontSize: 'var(--text-xs)' }}>
                        {p.kategori_peralatan?.nama_kategori || '–'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                        <span className={`badge ${STATUS_BADGE_CLASS[p.status_alat] || 'badge-gray'}`}>
                          <span className="badge-dot" />
                          {p.status_alat}
                        </span>
                        <span className="badge badge-gray" style={{ fontSize: 'var(--text-xs)' }}>
                          {verificationLabel}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--sp-1)' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => onNavigate(`/peralatan/detail/${equipmentId}`)}
                          title="Detail"
                          id={`btn-detail-${equipmentId}`}
                        >
                          <ChevronRight size={14} /> Detail
                        </button>
                        {canViewVerification && !approved && !rejected && <button className="btn btn-ghost btn-sm" onClick={() => onNavigate(`/verifikasi/${equipmentId}`)} title="Mulai atau lanjutkan verifikasi">Verifikasi</button>}
                        {canViewVerification && rejected && (
                          <>
                            <button className="btn btn-ghost btn-sm text-error" onClick={() => onNavigate(`/peralatan/detail/${equipmentId}`)} title="Lihat Catatan Peninjauan (TLKM13/IK/012)">Tinjau</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate(`/verifikasi/${equipmentId}`)} title="Ajukan Verifikasi Ulang (TLKM13/IK/003)">Verifikasi Ulang</button>
                          </>
                        )}
                        {approved && <button
                          type="button"
                          onClick={() => onNavigate(`/peralatan/qr/${equipmentId}`)}
                          className="btn btn-ghost btn-sm"
                          title="Lihat QR Code"
                          id={`btn-qr-${equipmentId}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                        >
                          <QrCode size={14} />
                        </button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
