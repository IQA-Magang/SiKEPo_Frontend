import React, { useState, useEffect } from 'react';
import { Package, ArrowLeft, Upload, FileText, Download, QrCode, AlertTriangle, ShieldCheck, ShieldAlert, ShieldX, FileDown } from 'lucide-react';
import { fetchBlobWithAuth, peralatanApi, dokumenApi, verifikasiApi, formatPhotoUrl, getEquipmentId, getEquipmentCategoryId, STATUS_BADGE_CLASS, API_BASE, computeEligibility, getDueStatus } from '../../utils/api.js';
import { ACCESS, ACTIONS, can } from '../../utils/permissions.js';
import { exportVerificationPdf } from '../../utils/exportVerificationPdf.js';

// ------------------------------------------------------------------
// Halaman Detail Peralatan
// ------------------------------------------------------------------
export default function EquipmentDetail({ equipmentId, onNavigate }) {
  const canEditEquipment = can(ACCESS.INPUT_EQUIPMENT, ACTIONS.EDIT);
  const canViewVerification = can(ACCESS.EQUIPMENT_ELIGIBILITY, ACTIONS.VIEW);
  const [peralatan, setPeralatan] = useState(null);
  const [dokumen, setDokumen]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]             = useState('');
  const [qrSrc, setQrSrc]         = useState('');
  const [reviewLogs, setReviewLogs] = useState([]);

  useEffect(() => {
    loadData();
  }, [equipmentId]);

  useEffect(() => {
    if (!peralatan || peralatan.status_verifikasi !== 'Disetujui') {
      setQrSrc('');
      return undefined;
    }
    let objectUrl = '';
    async function loadQr() {
      try {
        const blob = await fetchBlobWithAuth(`/api/peralatan/${equipmentId}/qr`);
        objectUrl = URL.createObjectURL(blob);
        setQrSrc(objectUrl);
      } catch {
        setQrSrc('');
      }
    }
    loadQr();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [equipmentId, peralatan]);

  async function loadData() {
    setLoading(true);
    try {
      // Ambil dari daftar semua (backend belum punya GET /api/peralatan/:id)
      const [allRes, docRes, reviewRes] = await Promise.allSettled([
        peralatanApi.getAll(),
        dokumenApi.getByPeralatanId(equipmentId),
        verifikasiApi.getLogByPeralatanId(equipmentId),
      ]);
      if (allRes.status === 'fulfilled') {
        const found = (allRes.value.data || []).find((p) => String(getEquipmentId(p)) === String(equipmentId));
        setPeralatan(found || null);
      }
      if (docRes.status === 'fulfilled') setDokumen(docRes.value.data || []);
      if (reviewRes.status === 'fulfilled') setReviewLogs(reviewRes.value.data || []);
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
  const canonicalEquipmentId = getEquipmentId(peralatan);
  const isVerified = peralatan.status_verifikasi === 'Disetujui';

  async function handleDownloadQR() {
    const imgEl = document.getElementById(`qr-img-${canonicalEquipmentId}`);
    const currentQrSrc = imgEl?.src || qrSrc;
    const fileName = `QR-Peralatan-ID${canonicalEquipmentId}-${peralatan?.nomor_aset || 'aset'}.png`;

    try {
      const res = await fetch(currentQrSrc);
      if (!res.ok) throw new Error(`Gagal mengunduh QR (${res.status})`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback Canvas jika terjadi CORS
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 250;
        canvas.height = img.naturalHeight || 250;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      img.src = currentQrSrc;
    }
  }

  async function handleExportPdf() {
    try {
      const res = await verifikasiApi.getByPeralatanId(canonicalEquipmentId);
      const vData = res?.data?.[0] || res?.data || { peralatan, status: 'Disetujui' };
      exportVerificationPdf(vData, peralatan);
    } catch {
      exportVerificationPdf({ peralatan, status: 'Disetujui' }, peralatan);
    }
  }

  return (
    <div className="page-container fade-in-up">
      {/* Back & Title */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => onNavigate('/peralatan')} id="btn-kembali-peralatan">
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="page-title" style={{ wordBreak: 'break-word' }}>{peralatan.nama_peralatan}</h1>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <code style={{ fontSize: 'var(--text-xs)', background: 'var(--clr-dark-100)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', wordBreak: 'break-all' }}>
              {peralatan.nomor_aset}
            </code>
            <span className={`badge ${STATUS_BADGE_CLASS[peralatan.status_alat] || 'badge-gray'}`}>
              {peralatan.status_alat}
            </span>
            <span className={`badge ${isVerified ? 'badge-aktif' : peralatan.status_verifikasi === 'Ditolak' ? 'badge-rusak' : 'badge-gray'}`}>
              Verifikasi: {peralatan.status_verifikasi || 'Belum Diverifikasi'}
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isVerified && canViewVerification && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleExportPdf}
              title="Export Formulir Verifikasi ke PDF (TLKM13/F/003)"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <FileDown size={14} /> Export PDF Verifikasi
            </button>
          )}
          {canViewVerification && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate(`/verifikasi/${canonicalEquipmentId}`)}
              title="Buka form verifikasi peralatan (TLKM13/IK/003)"
            >
              {peralatan.status_verifikasi === 'Ditolak' ? 'Ajukan Verifikasi Ulang' : 'Verifikasi / Periksa'}
            </button>
          )}
        </div>
      </div>

      {/* SRS 7.2 — Lencana Kelayakan & Label Resmi */}
      {(() => {
        const elig = computeEligibility(peralatan);
        const detail = peralatan.detail || peralatan.detail_alat_ukur || peralatan.detail_alat_bantu || peralatan.detail_artefak_acuan || peralatan.detail_komponen_pendukung || {};
        const dueDate = detail.tgl_jatuh_tempo || peralatan.tgl_jatuh_tempo || detail.tgl_kedaluwarsa;
        const dueInfo = dueDate ? getDueStatus(dueDate) : null;
        const EligIcon = elig.statusKelayakan === 'Layak' ? ShieldCheck : elig.statusKelayakan === 'Terbatas' ? ShieldAlert : ShieldX;

        return (
          <>
            <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', marginBottom: 'var(--sp-4)' }}>
              {/* Label Resmi */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                borderRadius: 'var(--radius-lg)', background: elig.labelColor + '18',
                border: `1.5px solid ${elig.labelColor}`, fontWeight: 'var(--fw-bold)',
                fontSize: 'var(--text-sm)', color: elig.labelColor,
              }}>
                <EligIcon size={18} />
                {elig.jenisLabel}
              </div>
              {/* Status Kelayakan */}
              <span className={`badge ${elig.badgeClass}`} style={{ fontSize: 'var(--text-xs)' }}>
                Kelayakan: {elig.statusKelayakan}
              </span>
              {/* Keutuhan Segel */}
              <span className={`badge ${elig.isSealBroken ? 'badge-rusak' : 'badge-aktif'}`} style={{ fontSize: 'var(--text-xs)' }}>
                Segel: {elig.isSealBroken ? 'Rusak' : 'Utuh'}
              </span>
            </div>

            {/* Peringatan Jatuh Tempo (SRS 20.1) */}
            {dueInfo && dueInfo.level !== 'safe' && (
              <div className={`alert ${dueInfo.isOverdue ? 'alert-error' : dueInfo.level === 'h7' ? 'alert-error' : 'alert-warning'}`} style={{ marginBottom: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} />
                <span><strong>{dueInfo.isOverdue ? 'Jatuh Tempo Terlewati!' : 'Mendekati Jatuh Tempo'}</strong> — {dueInfo.label}</span>
              </div>
            )}
          </>
        );
      })()}

      {!isVerified && <div className="alert alert-warning" style={{ marginBottom: 'var(--sp-5)' }}>
        <strong>{peralatan.status_verifikasi === 'Ditolak' ? 'Peralatan dalam peninjauan.' : 'Menunggu verifikasi.'}</strong> {peralatan.status_verifikasi === 'Ditolak' ? 'Alat tidak layak digunakan hingga tindak lanjut selesai dan verifikasi ulang dilakukan.' : 'Alat berstatus karantina dan tidak dapat digunakan atau diproses dengan QR sebelum Manager Lab menyetujui verifikasi.'}
        {canViewVerification && (
          <button className="btn btn-primary btn-sm" style={{ marginLeft: 12 }} onClick={() => onNavigate(`/verifikasi/${canonicalEquipmentId}`)}>{peralatan.status_verifikasi === 'Ditolak' ? 'Ajukan Verifikasi Ulang (IK/003)' : 'Buka Verifikasi'}</button>
        )}
      </div>}

      <div className="equipment-detail-layout">
        {/* Kiri: Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          {/* Riwayat Peninjauan Ketidaksesuaian (TLKM13/IK/012) */}
          {(reviewLogs.length > 0 || peralatan.status_verifikasi === 'Ditolak') && (
            <div className="card card-padded" style={{ borderLeft: '4px solid #ef4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h2 className="section-title" style={{ margin: 0 }}>Riwayat Peninjauan (TLKM13/IK/012)</h2>
                  <p className="page-subtitle" style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)' }}>
                    Catatan evaluasi ketidaksesuaian dan penolakan verifikasi Manager Lab.
                  </p>
                </div>
                {canViewVerification && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onNavigate(`/verifikasi/${canonicalEquipmentId}`)}
                  >
                    Ajukan Verifikasi Ulang
                  </button>
                )}
              </div>

              {reviewLogs.length === 0 ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-dark-500)', fontStyle: 'italic', margin: 0 }}>
                  Peralatan berstatus Ditolak dalam peninjauan. Sesuai alur IK/012, peralatan berstatus Karantina hingga perbaikan (IK/013) selesai dan verifikasi ulang diajukan.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                  {reviewLogs.map((log, idx) => (
                    <div
                      key={log.id_log || idx}
                      style={{
                        padding: 'var(--sp-3)',
                        background: 'var(--clr-dark-50, #f8fafc)',
                        borderRadius: 'var(--radius-md, 6px)',
                        border: '1px solid var(--clr-dark-200, #e2e8f0)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="badge badge-rusak">{log.status || 'Ditolak'}</span>
                          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--clr-dark-700)' }}>
                            Peninjau: {log.manager?.nama_lengkap || log.manager?.nama || 'Manager Lab'}
                          </span>
                        </div>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)' }}>
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', marginBottom: 4 }}>
                        <strong>Alasan Ketidaksesuaian:</strong> {log.alasan || '–'}
                      </div>
                      {log.catatan && (
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-dark-600)' }}>
                          <strong>Catatan Tindak Lanjut:</strong> {log.catatan}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Info Umum */}
          <div className="card card-padded">
            <h2 className="section-title">Informasi Umum</h2>
            <div className="form-grid-2">
              <InfoRow label="Nama Peralatan" value={peralatan.nama_peralatan} />
              <InfoRow label="No. Aset" value={peralatan.nomor_aset} mono />
              <InfoRow label="Kategori" value={peralatan.kategori_peralatan?.nama_kategori || '–'} />
              <InfoRow label="Merek" value={peralatan.merek || '–'} />
              <InfoRow label="Tipe/Model" value={peralatan.tipe_model || '–'} />
              <InfoRow label="No. Seri" value={peralatan.nomor_seri || '–'} />
              <InfoRow label="Perangkat Lunak / Software" value={peralatan.peranti_lunak_versi || '–'} />
              <InfoRow label="Status" value={peralatan.status_alat} />
              <InfoRow label="Keterangan" value={peralatan.keterangan || '–'} />
            </div>
          </div>

          {/* Detail Kategori / Teknis */}
          {(() => {
            const catId = getEquipmentCategoryId(peralatan);
            const detail = peralatan.detail || peralatan.detail_alat_ukur || peralatan.detail_alat_bantu || peralatan.detail_artefak_acuan || peralatan.detail_komponen_pendukung;
            if (!detail) return null;

            if (catId === 1) {
              return (
                <div className="card card-padded">
                  <h2 className="section-title">Detail Teknis Alat Ukur</h2>
                  <div className="form-grid-2">
                    <InfoRow label="No. Sertifikat" value={detail.no_sertifikat || '–'} />
                    <InfoRow label="Metode Kelayakan" value={detail.metode_kelayakan || '–'} />
                    <InfoRow label="Tgl. Kalibrasi" value={formatDate(detail.tgl_kalibrasi)} />
                    <InfoRow label="Jatuh Tempo" value={formatDate(detail.tgl_jatuh_tempo)} />
                    <InfoRow label="Interval (Bulan)" value={detail.interval_bulan ? `${detail.interval_bulan} Bulan` : '–'} />
                    <InfoRow label="Status Kelayakan" value={detail.status_kelayakan || '–'} />
                    <InfoRow label="Rentang Ukur" value={detail.parameter_rentang_ukur || '–'} />
                    <InfoRow label="Akurasi / Resolusi" value={[detail.akurasi_spesifikasi, detail.resolusi].filter(Boolean).join(' / ') || '–'} />
                  </div>
                </div>
              );
            }

            if (catId === 2) {
              return (
                <div className="card card-padded">
                  <h2 className="section-title">Detail Teknis Alat Bantu</h2>
                  <div className="form-grid-2">
                    <InfoRow label="Fungsi / Kegunaan" value={detail.fungsi_kegunaan || '–'} />
                    <InfoRow label="Jenis Pemeriksaan" value={detail.jenis_pemeriksaan_berkala || '–'} />
                    <InfoRow label="Tgl. Pemeriksaan" value={formatDate(detail.tgl_pemeriksaan_terakhir)} />
                    <InfoRow label="Jatuh Tempo" value={formatDate(detail.tgl_jatuh_tempo)} />
                    <InfoRow label="Interval (Bulan)" value={detail.interval_bulan ? `${detail.interval_bulan} Bulan` : '–'} />
                    <InfoRow label="Kriteria Pemeriksaan" value={detail.kriteria_pemeriksaan || '–'} />
                  </div>
                </div>
              );
            }

            if (catId === 3) {
              return (
                <div className="card card-padded">
                  <h2 className="section-title">Detail Teknis Artefak Acuan</h2>
                  <div className="form-grid-2">
                    <InfoRow label="Jenis Deskripsi" value={detail.jenis_deskripsi || '–'} />
                    <InfoRow label="Karakteristik yang Diacu" value={detail.karakteristik_yang_diacu || '–'} />
                    <InfoRow label="Nilai Spesifikasi" value={detail.nilai_spesifikasi_karakterisasi || '–'} />
                    <InfoRow label="Metode Karakterisasi" value={detail.metode_karakterisasi || '–'} />
                    <InfoRow label="No. Laporan" value={detail.no_laporan_karakterisasi || '–'} />
                    <InfoRow label="Tgl. Karakterisasi" value={formatDate(detail.tgl_karakterisasi_terakhir)} />
                    <InfoRow label="Kondisi Penyimpanan" value={detail.kondisi_penyimpanan || '–'} />
                  </div>
                </div>
              );
            }

            if (catId === 4) {
              return (
                <div className="card card-padded">
                  <h2 className="section-title">Detail Komponen Pendukung</h2>
                  <div className="form-grid-2">
                    <InfoRow label="Sub Kategori" value={detail.sub_kategori || '–'} />
                    <InfoRow label="Sumber / Pemasok" value={detail.sumber_pemasok || '–'} />
                    <InfoRow label="No. Lot / Batch" value={detail.no_lot_batch_edisi || '–'} />
                    <InfoRow label="Satuan Kemasan" value={detail.satuan_kemasan || '–'} />
                    <InfoRow label="Tgl. Terima / Terbit" value={formatDate(detail.tgl_terima_terbit)} />
                    <InfoRow label="Tgl. Kedaluwarsa" value={formatDate(detail.tgl_kedaluwarsa)} />
                    <InfoRow label="Status Ketersediaan" value={detail.status_ketersediaan || '–'} />
                    <InfoRow label="Kondisi Penyimpanan" value={detail.kondisi_penyimpanan || '–'} />
                  </div>
                </div>
              );
            }

            return null;
          })()}

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

          {/* QR Code hanya tersedia setelah alat disetujui masuk inventaris */}
          {isVerified && <div className="card card-padded">
            <h2 className="section-title">QR Code (by ID)</h2>
            <div className="qr-container">
              <img
                src={qrSrc}
                alt={`QR Code Peralatan ID ${canonicalEquipmentId}`}
                className="qr-image"
                id={`qr-img-${canonicalEquipmentId}`}
              />
              {!qrSrc && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)' }}>Memuat QR Code...</span>}
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)' }}>
                QR ID Peralatan: <strong>#{canonicalEquipmentId}</strong> ({peralatan.nomor_aset})
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onNavigate(`/peralatan/qr/${canonicalEquipmentId}`)}
              >
                <QrCode size={14} /> Buka Halaman QR
              </button>
              <button
                type="button"
                onClick={handleDownloadQR}
                disabled={!qrSrc}
                className="btn btn-secondary btn-sm"
                id="btn-unduh-qr"
                style={{ cursor: 'pointer' }}
              >
                <Download size={14} /> Unduh QR
              </button>
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}

// helpers
function InfoRow({ label, value, mono }) {
  return (
    <div style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--clr-dark-500)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-dark-900)', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
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
