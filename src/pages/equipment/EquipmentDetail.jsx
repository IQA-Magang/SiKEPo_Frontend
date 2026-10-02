import React, { useState, useEffect } from 'react';
import { Package, ArrowLeft, Upload, FileText, Download, QrCode } from 'lucide-react';
import { fetchBlobWithAuth, peralatanApi, dokumenApi, verifikasiApi, kelompokAssetApi, ruanganApi, labsApi, formatPhotoUrl, getEquipmentId, getEquipmentCategoryId, STATUS_BADGE_CLASS, API_BASE } from '../../utils/api.js';
import { ACCESS, ACTIONS, can } from '../../utils/permissions.js';

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
  const [references, setReferences] = useState({ groups: [], rooms: [], labs: [] });

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
    setPeralatan(null);
    try {
      const [equipmentRes, docRes, reviewRes, groupsRes, roomsRes, labsRes] = await Promise.allSettled([
        peralatanApi.getAll(),
        dokumenApi.getByPeralatanId(equipmentId),
        verifikasiApi.getLogByPeralatanId(equipmentId),
        kelompokAssetApi.getAll(),
        ruanganApi.getAll(),
        labsApi.getAll(),
      ]);
      if (equipmentRes.status === 'fulfilled') {
        const found = (equipmentRes.value.data || []).find(
          (item) => String(getEquipmentId(item)) === String(equipmentId)
        );
        setPeralatan(found || null);
      }
      if (docRes.status === 'fulfilled') setDokumen(docRes.value.data || []);
      if (reviewRes.status === 'fulfilled') setReviewLogs(reviewRes.value.data || []);
      setReferences({
        groups: groupsRes.status === 'fulfilled' ? groupsRes.value.data || [] : [],
        rooms: roomsRes.status === 'fulfilled' ? roomsRes.value.data || [] : [],
        labs: labsRes.status === 'fulfilled' ? labsRes.value.data || [] : [],
      });
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
  const technicalRows = getEquipmentDetailRows(peralatan);
  const assetGroup = references.groups.find((item) => String(item.id) === String(peralatan.kelompok_aset_id));
  const room = references.rooms.find((item) => String(item.id) === String(peralatan.ruangan_id));
  const labId = room?.labs_id ?? room?.labs?.id ?? assetGroup?.lab_id ?? assetGroup?.lab?.id;
  const lab = references.labs.find((item) => String(item.id) === String(labId)) || room?.labs || assetGroup?.lab;
  const pic = [room?.pic_user, assetGroup?.pic].find(
    (person) => person && String(person.user_id ?? person.id) === String(peralatan.pic_id)
  );

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
              <InfoRow label="Perangkat Lunak / Software" value={peralatan.detail?.peranti_lunak_versi || peralatan.peranti_lunak_versi || '–'} />
              <InfoRow label="Status" value={peralatan.status_alat} />
              <InfoRow label="Keterangan" value={peralatan.keterangan || '–'} />
              <InfoRow label="Kelompok Aset" value={assetGroup ? `${assetGroup.nama}${assetGroup.kode ? ` (${assetGroup.kode})` : ''}` : 'Belum tersedia'} />
              <InfoRow label="Ruangan" value={room ? `${room.nama_ruangan}${room.kode_ruangan ? ` (${room.kode_ruangan})` : ''}` : 'Belum tersedia'} />
              <InfoRow label="PIC Peralatan" value={pic?.name || 'Belum tersedia'} />
              <InfoRow label="Laboratorium" value={lab ? `${lab.nama_labs}${lab.kode_labs ? ` (${lab.kode_labs})` : ''}` : 'Belum tersedia'} />
              <InfoRow label="Terdaftar Pada" value={formatDate(peralatan.created_at)} />
              {technicalRows.map(({ label, value }) => (
                <InfoRow key={label} label={label} value={value} />
              ))}
            </div>
          </div>

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
function getEquipmentDetailRows(peralatan) {
  const categoryId = getEquipmentCategoryId(peralatan);
  const detail = peralatan.detail || peralatan.detail_alat_ukur || peralatan.detail_alat_bantu || peralatan.detail_artefak_acuan || peralatan.detail_komponen_pendukung || peralatan;
  const fieldsByCategory = {
    1: [
      ['Metode Kelayakan', 'metode_kelayakan'],
      ['No. Sertifikat', 'no_sertifikat'],
      ['Kalibrasi Terakhir', 'tgl_kalibrasi', 'date'],
      ['Jatuh Tempo Kalibrasi', 'tgl_jatuh_tempo', 'date'],
      ['Interval Kalibrasi', 'interval_bulan', 'months'],
      ['Fungsi sebagai Alat Standar', 'fungsi_sbg_alat_standar', 'boolean'],
      ['Parameter / Rentang Ukur', 'parameter_rentang_ukur'],
      ['Resolusi', 'resolusi'],
      ['Akurasi Spesifikasi', 'akurasi_spesifikasi'],
      ['Satuan', 'satuan'],
      ['Nilai Koreksi', 'nilai_koreksi'],
      ['Ketidakpastian', 'ketidakpastian'],
      ['Jenis Label', 'jenis_label'],
      ['Status Kelayakan', 'status_kelayakan'],
    ],
    2: [
      ['Fungsi / Kegunaan', 'fungsi_kegunaan'],
      ['Jenis Pemeriksaan Berkala', 'jenis_pemeriksaan_berkala'],
      ['Kriteria Pemeriksaan', 'kriteria_pemeriksaan'],
      ['Tgl. Pemeriksaan Terakhir', 'tgl_pemeriksaan_terakhir', 'date'],
      ['Jatuh Tempo Pemeriksaan', 'tgl_jatuh_tempo', 'date'],
      ['Interval Pemeriksaan', 'interval_bulan', 'months'],
      ['Fungsi sebagai Alat Standar', 'fungsi_sbg_alat_standar', 'boolean'],
      ['Karakteristik Acuan', 'karakteristik_acuan'],
      ['Jadwal Karakterisasi Ulang', 'jadwal_karakterisasi_ulang'],
    ],
    3: [
      ['Jenis Deskripsi', 'jenis_deskripsi'],
      ['Karakteristik yang Diacu', 'karakteristik_yang_diacu'],
      ['Nilai Spesifikasi Karakterisasi', 'nilai_spesifikasi_karakterisasi'],
      ['Metode Karakterisasi', 'metode_karakterisasi'],
      ['No. Laporan Karakterisasi', 'no_laporan_karakterisasi'],
      ['Tgl. Karakterisasi Terakhir', 'tgl_karakterisasi_terakhir', 'date'],
      ['Tgl. Karakterisasi Ulang', 'tgl_karakterisasi', 'date'],
      ['Interval Karakterisasi', 'interval_bulan', 'months'],
      ['Kondisi Penyimpanan', 'kondisi_penyimpanan'],
      ['Status Artefak', 'status'],
    ],
    4: [
      ['Sub Kategori', 'sub_kategori'],
      ['Deskripsi / Spesifikasi', 'deskripsi_spesifikasi'],
      ['Grade Mutu', 'grade_mutu'],
      ['Sumber / Pemasok', 'sumber_pemasok'],
      ['No. Lot / Batch / Edisi', 'no_lot_batch_edisi'],
      ['Satuan Kemasan', 'satuan_kemasan'],
      ['Tgl. Terima / Terbit', 'tgl_terima_terbit', 'date'],
      ['Tgl. Kedaluwarsa', 'tgl_kedaluwarsa', 'date'],
      ['Kondisi Penyimpanan', 'kondisi_penyimpanan'],
      ['Status Ketersediaan', 'status_ketersediaan'],
    ],
  };

  return (fieldsByCategory[categoryId] || []).flatMap(([label, key, type]) => {
    const rawValue = detail[key];
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      if (categoryId === 1 && ['tgl_kalibrasi', 'tgl_jatuh_tempo'].includes(key)) {
        return [{ label, value: 'Belum tersedia' }];
      }
      return [];
    }

    let value = rawValue;
    if (type === 'date') value = formatDate(rawValue);
    if (type === 'months') value = rawValue ? `${rawValue} Bulan` : '';
    if (type === 'boolean') value = rawValue ? 'Ya' : 'Tidak';
    if (value === '') return [];
    return [{ label, value }];
  });
}

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