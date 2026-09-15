import React, { useState, useEffect } from 'react';
import { Package, ArrowLeft, QrCode, Upload, FileText, Download, Eye } from 'lucide-react';
import { peralatanApi, dokumenApi, formatPhotoUrl, API_BASE } from '../../utils/api.js';
import { ACCESS, ACTIONS, can } from '../../utils/permissions.js';

// ------------------------------------------------------------------
// Halaman Detail Peralatan
// ------------------------------------------------------------------
export default function EquipmentDetail({ equipmentId, onNavigate }) {
  const [peralatan, setPeralatan] = useState(null);
  const [dokumen, setDokumen]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]             = useState('');

  useEffect(() => {
    loadData();
  }, [equipmentId]);

  async function loadData() {
    setLoading(true);
    try {
      // Ambil dari daftar semua (backend belum punya GET /api/peralatan/:id)
      const [allRes, docRes] = await Promise.allSettled([
        peralatanApi.getAll(),
        dokumenApi.getByPeralatanId(equipmentId),
      ]);
      if (allRes.status === 'fulfilled') {
        const found = (allRes.value.data || []).find((p) => String(p.id) === String(equipmentId));
        setPeralatan(found || null);
      }
      if (docRes.status === 'fulfilled') setDokumen(docRes.value.data || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg('');
    try {
      await peralatanApi.uploadFoto(equipmentId, file);
      setMsg('Foto berhasil diunggah!');
      loadData();
    } catch (err) {
      setMsg(`Gagal upload: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  if (loading) return (
    <div className="page-container fade-in-up">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60 }} />)}
      </div>
    </div>
  );

  if (!peralatan) return (
    <div className="page-container fade-in-up">
      <div className="empty-state">
        <div className="empty-state-icon"><Package size={32} /></div>
        <p className="empty-state-title">Peralatan tidak ditemukan</p>
        <button className="btn btn-secondary" onClick={() => onNavigate('/peralatan')}>
          <ArrowLeft size={16} /> Kembali
        </button>
      </div>
    </div>
  );

  const photoUrl = formatPhotoUrl(peralatan.foto);
  const qrUrl = peralatanApi.getQRCodeUrl(equipmentId);
  const canEditEquipment = can(ACCESS.INPUT_EQUIPMENT, ACTIONS.EDIT);

  const kategoriLabel = {
    1: 'Alat Ukur', 2: 'Alat Bantu', 3: 'Artefak Acuan', 4: 'Komponen Pendukung'
  };

  const statusClass = {
    'Aktif':           'badge-aktif',
    'Dipinjam':        'badge-dipinjam',
    'Dalam Kalibrasi': 'badge-kalibrasi',
    'Rusak':           'badge-rusak',
    'Dihapuskan':      'badge-dihapuskan',
  };

  return (
    <div className="page-container fade-in-up">
      {/* Back & Title */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => onNavigate('/peralatan')} id="btn-kembali-peralatan">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title">{peralatan.nama_peralatan}</h1>
          <p className="page-subtitle">
            <code style={{ fontSize: 'var(--text-xs)', background: 'var(--clr-dark-100)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
              {peralatan.nomor_aset}
            </code>
            {' '}
            <span className={`badge ${statusClass[peralatan.status_alat] || 'badge-gray'}`} style={{ marginLeft: 6 }}>
              {peralatan.status_alat}
            </span>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--sp-5)', alignItems: 'start' }}>
        {/* Kiri: Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          {/* Info Umum */}
          <div className="card card-padded">
            <h2 className="section-title">Informasi Umum</h2>
            <div className="form-grid-2">
              <InfoRow label="Nama Peralatan" value={peralatan.nama_peralatan} />
              <InfoRow label="No. Aset" value={peralatan.nomor_aset} mono />
              <InfoRow label="Kategori" value={kategoriLabel[peralatan.kategori_peralatan_id]} />
              <InfoRow label="Merek" value={peralatan.merek || '–'} />
              <InfoRow label="Tipe/Model" value={peralatan.tipe_model || '–'} />
              <InfoRow label="No. Seri" value={peralatan.nomor_seri || '–'} />
              <InfoRow label="Status" value={peralatan.status_alat} />
              <InfoRow label="Keterangan" value={peralatan.keterangan || '–'} />
            </div>
          </div>

          {/* Detail Kategori */}
          {peralatan.detail_alat_ukur && (
            <div className="card card-padded">
              <h2 className="section-title">Detail Alat Ukur</h2>
              <div className="form-grid-2">
                <InfoRow label="Parameter & Rentang Ukur" value={peralatan.detail_alat_ukur.parameter_rentang_ukur} />
                <InfoRow label="Resolusi" value={peralatan.detail_alat_ukur.resolusi} />
                <InfoRow label="Akurasi/Spesifikasi" value={peralatan.detail_alat_ukur.akurasi_spesifikasi} />
                <InfoRow label="No. Sertifikat" value={peralatan.detail_alat_ukur.no_sertifikat} />
                <InfoRow label="Tgl. Kalibrasi" value={formatDate(peralatan.detail_alat_ukur.tgl_kalibrasi)} />
                <InfoRow label="Jatuh Tempo" value={formatDate(peralatan.detail_alat_ukur.tgl_jatuh_tempo)} />
                <InfoRow label="Status Kelayakan" value={peralatan.detail_alat_ukur.status_kelayakan} />
              </div>
            </div>
          )}

          {/* Dokumen */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Dokumen Peralatan</h2>
              <span className="badge badge-gray">{dokumen.length} dokumen</span>
            </div>
            {dokumen.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--sp-8)' }}>
                <div className="empty-state-icon"><FileText size={24} /></div>
                <p className="empty-state-title">Belum ada dokumen</p>
              </div>
            ) : (
              <div style={{ padding: 'var(--sp-2)' }}>
                {dokumen.map((d) => (
                  <div key={d.id} style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                    padding: 'var(--sp-3)', borderRadius: 'var(--radius-lg)',
                    transition: 'background var(--duration-fast)',
                  }}
                  className="hover-bg"
                  >
                    <div style={{
                      width: 36, height: 36, background: 'var(--clr-info-100)', borderRadius: 'var(--radius-md)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <FileText size={16} style={{ color: 'var(--clr-info-500)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'var(--fw-medium)', fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.nama_dokumen}
                      </div>
                    </div>
                    <a
                      href={`${API_BASE}${d.path_dokumen.startsWith('/') ? '' : '/'}${d.path_dokumen}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      title="Unduh/Lihat"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kanan: Foto & QR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          {/* Foto */}
          <div className="card card-padded">
            <h2 className="section-title">Foto Peralatan</h2>
            {photoUrl ? (
              <img src={photoUrl} alt={peralatan.nama_peralatan} className="photo-preview" />
            ) : (
              <div style={{
                height: 180, background: 'var(--clr-dark-50)', borderRadius: 'var(--radius-lg)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 'var(--sp-2)', border: '2px dashed var(--clr-dark-200)',
              }}>
                <Package size={32} style={{ color: 'var(--clr-dark-300)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-400)' }}>Belum ada foto</span>
              </div>
            )}
            {canEditEquipment && <div style={{ marginTop: 'var(--sp-3)' }}>
              <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', justifyContent: 'center' }} htmlFor="input-upload-foto">
                {uploading ? <><div className="spinner" />Mengunggah...</> : <><Upload size={14} /> Ganti Foto</>}
              </label>
              <input
                id="input-upload-foto"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleUploadFoto}
                disabled={uploading}
              />
              {msg && (
                <p style={{ marginTop: 'var(--sp-2)', fontSize: 'var(--text-xs)', color: msg.startsWith('Gagal') ? 'var(--clr-error-500)' : 'var(--clr-success-500)' }}>
                  {msg}
                </p>
              )}
            </div>}
          </div>

          {/* QR Code */}
          <div className="card card-padded">
            <h2 className="section-title">QR Code</h2>
            <div className="qr-container">
              <img src={qrUrl} alt="QR Code" className="qr-image" id={`qr-img-${equipmentId}`} />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)' }}>
                QR mengacu pada nomor aset: <strong>{peralatan.nomor_aset}</strong>
              </p>
              <a
                href={qrUrl}
                download={`qr-${peralatan.nomor_aset}.png`}
                className="btn btn-secondary btn-sm"
                id="btn-unduh-qr"
              >
                <Download size={14} /> Unduh QR
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// helpers
function InfoRow({ label, value, mono }) {
  return (
    <div>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--clr-dark-500)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-dark-900)', fontFamily: mono ? 'monospace' : 'inherit' }}>
        {value || '–'}
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '–';
  try { return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }); }
  catch { return dateStr; }
}
