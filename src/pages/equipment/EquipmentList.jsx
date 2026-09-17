import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, QrCode, ChevronRight, RefreshCw } from 'lucide-react';
import { getEquipmentId, KATEGORI_OPTIONS, formatPhotoUrl, peralatanApi } from '../../utils/api.js';
import { ACCESS, ACTIONS, can } from '../../utils/permissions.js';
import QRScannerModal from '../../components/QRScannerModal.jsx';

// ------------------------------------------------------------------
// Daftar Peralatan
// ------------------------------------------------------------------
export default function EquipmentList({ onNavigate }) {
  const canCreate = can(ACCESS.INPUT_EQUIPMENT, ACTIONS.ADD);
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterKat, setFilterKat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isQrOpen, setIsQrOpen] = useState(false);

  useEffect(() => { loadData(); }, []);

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
    const matchKat = !filterKat || String(p.kategori_peralatan_id) === filterKat;
    const matchStatus = !filterStatus || p.status_alat === filterStatus;
    return matchQ && matchKat && matchStatus;
  });

  const statusOptions = ['Aktif', 'Dipinjam', 'Dalam Kalibrasi', 'Rusak', 'Dihapuskan'];

  const statusClass = {
    'Aktif':           'badge-aktif',
    'Dipinjam':        'badge-dipinjam',
    'Dalam Kalibrasi': 'badge-kalibrasi',
    'Rusak':           'badge-rusak',
    'Dihapuskan':      'badge-dihapuskan',
  };

  const kategoriLabel = {
    1: 'Alat Ukur', 2: 'Alat Bantu', 3: 'Artefak Acuan', 4: 'Komponen Pendukung'
  };

  return (
    <div className="page-container fade-in-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
        <div>
          <h1 className="page-title">Inventaris Peralatan</h1>
          <p className="page-subtitle">
            {loading ? 'Memuat...' : `${filtered.length} dari ${list.length} peralatan`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsQrOpen(true)}
            id="btn-scan-qr-header"
          >
            <QrCode size={16} style={{ color: 'var(--clr-primary-500)' }} /> Scan QR Code
          </button>
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
          {KATEGORI_OPTIONS.map((k) => (
            <option key={k.id} value={String(k.id)}>{k.label}</option>
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
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
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
          <p className="empty-state-desc">Coba ubah filter atau tambah peralatan baru.</p>
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
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const photoUrl = formatPhotoUrl(p.foto);
                const equipmentId = getEquipmentId(p);
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
                      <span className={`badge ${statusClass[p.status_alat] || 'badge-gray'}`}>
                        <span className="badge-dot" />
                        {p.status_alat}
                      </span>
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
                        <button
                          type="button"
                          onClick={() => onNavigate(`/peralatan/qr/${equipmentId}`)}
                          className="btn btn-ghost btn-sm"
                          title="Lihat QR Code"
                          id={`btn-qr-${equipmentId}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                        >
                          <QrCode size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Pemindai QR Code */}
      <QRScannerModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
