import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './equipment.css';
import { Package, ArrowLeft, Upload, FileText, Download, QrCode, Printer } from 'lucide-react';
import { fetchBlobWithAuth, peralatanApi, dokumenApi, verifikasiApi, kelompokAssetApi, ruanganApi, labsApi, formatPhotoUrl, getEquipmentId, STATUS_BADGE_CLASS, API_BASE } from '../../shared/services/api.js';
import { ACCESS, ACTIONS, can, getUserRole, isStaffPengelola } from '../../shared/utils/permissions.js';
import { exportVerificationPdf } from '../../shared/lib/verificationPdf.js';
import { getSafeReturnPath } from '../../app/router/Router.jsx';
import { Card, Badge, Button, LoadingState, EmptyState } from '../../shared/components/ui/index.js';
import {
  formatDate,
  formatVerificationResult,
  getActivityName,
  getEquipmentDetailRows,
  getVerificationCheckLabel,
  parseVerificationNotes,
} from './equipmentDetailData.js';

function InfoRow({ label, value, mono }) {
  return (
    <div className="equipment-info-row">
      <div className="equipment-info-row__label">{label}</div>
      <div className={`equipment-info-row__value${mono ? ' is-mono' : ''}`}>
        {value || '–'}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Halaman Detail Peralatan
// ------------------------------------------------------------------
export default function EquipmentDetail({ equipmentId, onNavigate, initialSection = 'informasi' }) {
  const returnPath = getSafeReturnPath('/peralatan');
  const canEditEquipment = can(ACCESS.INPUT_EQUIPMENT, ACTIONS.EDIT);
  const canViewVerification = can(ACCESS.EQUIPMENT_ELIGIBILITY, ACTIONS.VIEW);
  const canExportVerification = can(ACCESS.EQUIPMENT_ELIGIBILITY, ACTIONS.EDIT)
    && (getUserRole() !== 'staff' || isStaffPengelola());
  const [peralatan, setPeralatan] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [dokumen, setDokumen]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]             = useState('');
  const [qrSrc, setQrSrc]         = useState('');
  const [reviewLogs, setReviewLogs] = useState([]);
  const [reviewLogError, setReviewLogError] = useState('');
  const [verificationLogs, setVerificationLogs] = useState([]);
  const [verificationLogError, setVerificationLogError] = useState('');
  const [qrError, setQrError] = useState('');
  const [selectedActivityLog, setSelectedActivityLog] = useState(null);
  const [selectedLogType, setSelectedLogType] = useState('verifikasi');
  const [activeDetailSection, setActiveDetailSection] = useState(initialSection);
  const [references, setReferences] = useState({ groups: [], rooms: [], labs: [] });

  useEffect(() => {
    setActiveDetailSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    loadData();
  }, [equipmentId]);

  useEffect(() => {
    if (!peralatan || peralatan.status_verifikasi !== 'Disetujui') {
      setQrSrc('');
      setQrError('');
      return undefined;
    }
    let objectUrl = '';
    async function loadQr() {
      try {
        const blob = await fetchBlobWithAuth(`/api/peralatan/${equipmentId}/qr`);
        objectUrl = URL.createObjectURL(blob);
        setQrSrc(objectUrl);
        setQrError('');
      } catch (err) {
        setQrSrc('');
        setQrError(err.message || 'QR Code gagal dimuat.');
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
    setLoadError('');
    setReviewLogError('');
    setVerificationLogError('');
    try {
      const [equipmentRes, docRes, reviewRes, verificationRes, groupsRes, roomsRes, labsRes] = await Promise.allSettled([
        peralatanApi.getById(equipmentId),
        dokumenApi.getByPeralatanId(equipmentId),
        verifikasiApi.getLogByPeralatanId(equipmentId),
        verifikasiApi.getHistoriByPeralatanId(equipmentId),
        kelompokAssetApi.getAll(),
        ruanganApi.getAll(),
        labsApi.getAll(),
      ]);
      if (equipmentRes.status === 'fulfilled') {
        const result = equipmentRes.value.data;
        const item = result?.peralatan || result;
        setPeralatan(item ? { ...item, detail: result?.detail ?? item.detail } : null);
      } else {
        setLoadError(equipmentRes.reason?.message || 'Gagal memuat data peralatan.');
      }
      if (docRes.status === 'fulfilled') setDokumen(docRes.value.data || []);
      if (reviewRes.status === 'fulfilled') {
        const logs = reviewRes.value.data;
        if (Array.isArray(logs)) {
          setReviewLogs(logs);
        } else {
          setReviewLogError('Format data log peninjauan tidak valid.');
        }
      } else {
        setReviewLogs([]);
        setReviewLogError(reviewRes.reason?.message || 'Gagal memuat log peninjauan.');
      }
      if (verificationRes.status === 'fulfilled') {
        const history = verificationRes.value.data?.histori;
        if (Array.isArray(history)) {
          setVerificationLogs(history);
        } else {
          setVerificationLogs([]);
          setVerificationLogError('Format respons histori verifikasi tidak valid.');
        }
      } else {
        setVerificationLogs([]);
        setVerificationLogError(verificationRes.reason?.message || 'Gagal memuat riwayat verifikasi.');
      }
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
      <LoadingState message="Memuat detail peralatan..." />
    </div>
  );

  if (!peralatan) return (
    <div className="page-container fade-in-up">
      <EmptyState
        title={loadError ? 'Gagal memuat peralatan' : 'Peralatan tidak ditemukan'}
        description={loadError || undefined}
        icon={<Package size={32} />}
        action={<Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => onNavigate(returnPath)}>Kembali</Button>}
      />
    </div>
  );

  const photoUrl = formatPhotoUrl(peralatan.foto);
  const canonicalEquipmentId = getEquipmentId(peralatan);
  const isVerified = peralatan.status_verifikasi === 'Disetujui';
  const displayStatus = isVerified ? peralatan.status_alat : 'Karantina';
  const visibleDetailSection = activeDetailSection === 'qr' && !isVerified
    ? 'informasi'
    : activeDetailSection;
  const technicalRows = getEquipmentDetailRows(peralatan);
  const verificationHistory = [
    ...verificationLogs.map((log, index) => ({
      id: `verification-${log.id_verifikasi ?? log.id ?? index}`,
      date: log.tanggal_verifikasi || log.created_at,
      status: log.status || 'Verifikasi',
      title: `Verifikasi${log.kode_aktivitas ? ` — ${getActivityName(log.kode_aktivitas)}` : ''}`,
      description: log.keputusan ? `Keputusan: ${log.keputusan}` : '',
      note: log.tindak_lanjut || '',
      record: log,
    })),
    ...reviewLogs.map((log, index) => ({
      id: `review-${log.id_log ?? index}`,
      date: log.created_at,
      status: log.status || 'Peninjauan',
      title: 'Catatan peninjauan',
      description: log.alasan || '',
      note: log.catatan || '',
      record: log,
    })),
  ].sort((first, second) => new Date(second.date || 0) - new Date(first.date || 0));
  const latestApprovedVerification = verificationLogs
    .filter((log) => log.status === 'Disetujui')
    .sort((first, second) => new Date(second.tanggal_verifikasi || second.created_at || 0) - new Date(first.tanggal_verifikasi || first.created_at || 0))[0];
  const logTypeLabels = {
    verifikasi: 'Log Verifikasi',
    peminjaman: 'Log Peminjaman',
    perpindahan: 'Log Perpindahan',
    penggunaan: 'Log Penggunaan',
    pemeriksaan: 'Log Pemeriksaan Berkala',
  };
  const assetGroup = references.groups.find((item) => String(item.id) === String(peralatan.kelompok_aset_id));
  const room = references.rooms.find((item) => String(item.id) === String(peralatan.ruangan_id));
  const labId = room?.labs_id ?? room?.labs?.id ?? assetGroup?.lab_id ?? assetGroup?.lab?.id;
  const lab = references.labs.find((item) => String(item.id) === String(labId)) || room?.labs || assetGroup?.lab;
  const pic = [room?.pic_user, assetGroup?.pic].find(
    (person) => person && String(person.user_id ?? person.id) === String(peralatan.pic_id)
  );
  const selectedLogNotes = selectedActivityLog
    ? parseVerificationNotes(selectedActivityLog.record.catatan || selectedActivityLog.record.verifikasi?.catatan)
    : null;
  const selectedLogVerification = selectedActivityLog
    ? (selectedActivityLog.record.verifikasi || selectedActivityLog.record)
    : null;

  async function handleDownloadQR() {
    const fileName = `QR-Peralatan-ID${canonicalEquipmentId}-${peralatan?.nomor_aset || 'aset'}.png`;
    let blobUrl = '';
    try {
      const blob = await fetchBlobWithAuth(`/api/peralatan/${canonicalEquipmentId}/qr`);
      blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setQrError(err.message || 'QR Code gagal diunduh.');
    } finally {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    }
  }

  return (
    <div className="page-container fade-in-up">
      {/* Back & Title */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <Button variant="ghost" className="btn-icon" onClick={() => onNavigate(returnPath)} id="btn-kembali-peralatan" aria-label="Kembali ke daftar peralatan">
          <ArrowLeft size={20} />
        </Button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="page-title" style={{ wordBreak: 'break-word' }}>{peralatan.nama_peralatan}</h1>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <code style={{ fontSize: 'var(--text-xs)', background: 'var(--clr-dark-100)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', wordBreak: 'break-all' }}>
              {peralatan.nomor_aset}
            </code>
            <Badge className={STATUS_BADGE_CLASS[displayStatus] || 'badge-gray'}>
              {displayStatus}
            </Badge>
            <Badge className={isVerified ? 'badge-aktif' : peralatan.status_verifikasi === 'Ditolak' ? 'badge-rusak' : 'badge-gray'}>
              Verifikasi: {peralatan.status_verifikasi || 'Belum Diverifikasi'}
            </Badge>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canViewVerification && !isVerified && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate(`/verifikasi/${canonicalEquipmentId}?returnTo=${encodeURIComponent(returnPath)}`)}
              title="Buka form verifikasi peralatan (TLKM13/IK/003)"
            >
              {peralatan.status_verifikasi === 'Ditolak' ? 'Ajukan Verifikasi Ulang' : 'Verifikasi / Periksa'}
            </Button>
          )}
        </div>
      </div>

      <div className="equipment-detail-layout">
        <nav className="equipment-detail-nav" aria-label="Bagian detail peralatan">
          {[
            ['informasi', 'Informasi'],
            ['dokumen', 'Dokumen'],
            ['qr', 'QR Code'],
            ['log', 'Log'],
          ].filter(([section]) => section !== 'qr' || isVerified).map(([section, label]) => (
            <button
              key={section}
              type="button"
              className={`equipment-detail-nav-button${visibleDetailSection === section ? ' is-active' : ''}`}
              onClick={() => setActiveDetailSection(section)}
              aria-current={visibleDetailSection === section ? 'page' : undefined}
            >
              {label}
            </button>
          ))}
        </nav>

        <main className="equipment-detail-content">
          {visibleDetailSection === 'log' && (
            <Card as="section" className="card-padded">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-3)', flexWrap: 'wrap', marginBottom: 'var(--sp-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <h2 className="card-title">Log Aktivitas Peralatan</h2>
                {selectedLogType === 'verifikasi' && verificationHistory.length > 0 && (
                  <Badge className="badge-gray">{verificationHistory.length}</Badge>
                )}
              </div>
              <select
                className="form-select"
                value={selectedLogType}
                onChange={(event) => setSelectedLogType(event.target.value)}
                aria-label="Pilih jenis log peralatan"
                style={{ width: 'auto', minWidth: 210 }}
              >
                {Object.entries(logTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {selectedLogType === 'verifikasi' ? (
              <>
                {(verificationLogError || reviewLogError) && (
                  <p className="alert alert-error" role="alert" style={{ margin: '0 0 var(--sp-3)' }}>
                    Gagal memuat sebagian log verifikasi: {[verificationLogError, reviewLogError].filter(Boolean).join(' ')}
                  </p>
                )}
                {verificationHistory.length === 0 ? (
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-dark-500)', fontStyle: 'italic', margin: 0 }}>
                    Belum ada log verifikasi.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {verificationHistory.map((log, index) => (
                      <div
                        key={log.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 'var(--sp-3)',
                          padding: 'var(--sp-3) 0',
                          borderBottom: index < verificationHistory.length - 1 ? '1px solid var(--clr-dark-200)' : 'none',
                        }}
                      >
                        <Badge className={log.status === 'Disetujui' ? 'badge-aktif' : log.status === 'Ditolak' ? 'badge-rusak' : 'badge-kalibrasi'}>
                          {log.status}
                        </Badge>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-dark-800)', fontWeight: 'var(--fw-medium)' }}>
                            {log.title}
                          </div>
                          {log.description && (
                            <div style={{ marginTop: 4, fontSize: 'var(--text-sm)', color: 'var(--clr-dark-600)' }}>
                              {log.description}
                            </div>
                          )}
                          {log.note && (
                            <div style={{ marginTop: 4, fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)' }}>
                              {log.note}
                            </div>
                          )}
                          <div style={{ marginTop: 4, fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)' }}>
                            {formatDate(log.date)}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedActivityLog(log)}
                        >
                          Tinjau
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-dark-500)', fontStyle: 'italic', margin: 0 }}>
                Sumber data {logTypeLabels[selectedLogType].toLowerCase()} belum tersedia.
              </p>
            )}
            </Card>
          )}

          {visibleDetailSection === 'informasi' && (
            <Card as="section" className="card-padded equipment-info-card">
                <div className="equipment-info-heading">
                  <div className="equipment-info-icon"><Package size={21} /></div>
                  <h2 className="card-title">Informasi Alat</h2>
                  <Badge className={displayStatus === 'Aktif' ? 'badge-aktif' : displayStatus === 'Rusak' ? 'badge-rusak' : 'badge-gray'}>
                    {displayStatus === 'Aktif' ? 'Tersedia' : displayStatus || '–'}
                  </Badge>
                  {isVerified && latestApprovedVerification && canExportVerification && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => exportVerificationPdf(latestApprovedVerification)}
                      title="Export PDF (TLKM13/F/003)"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}
                    >
                      <Printer size={14} /> Export PDF
                    </Button>
                  )}
                </div>
                <div className="equipment-info-body">
                  <div className="equipment-info-grid">
                    <InfoRow label="Nama Peralatan" value={peralatan.nama_peralatan} />
                    <InfoRow label="No. Aset" value={peralatan.nomor_aset} mono />
                    <InfoRow label="Kategori" value={peralatan.kategori_peralatan?.nama_kategori || '–'} />
                    <InfoRow label="Merek" value={peralatan.merek || '–'} />
                    <InfoRow label="Tipe/Model" value={peralatan.tipe_model || '–'} />
                    <InfoRow label="No. Seri" value={peralatan.nomor_seri || '–'} />
                    <InfoRow label="Perangkat Lunak / Software" value={peralatan.detail?.peranti_lunak_versi || peralatan.peranti_lunak_versi || '–'} />
                    <InfoRow label="Kelompok Aset" value={assetGroup ? `${assetGroup.nama}${assetGroup.kode ? ` (${assetGroup.kode})` : ''}` : 'Belum tersedia'} />
                    <InfoRow label="Ruangan" value={room ? `${room.nama_ruangan}${room.kode_ruangan ? ` (${room.kode_ruangan})` : ''}` : 'Belum tersedia'} />
                    <InfoRow label="PIC Peralatan" value={pic?.name || 'Belum tersedia'} />
                    <InfoRow label="Laboratorium" value={lab ? `${lab.nama_labs}${lab.kode_labs ? ` (${lab.kode_labs})` : ''}` : 'Belum tersedia'} />
                    <InfoRow label="Terdaftar Pada" value={formatDate(peralatan.created_at)} />
                    {technicalRows.map(({ label, value }) => (
                      <InfoRow key={label} label={label} value={value} />
                    ))}
                    {peralatan.kode_aktivitas && (
                      <InfoRow label="Nama Aktivitas" value={getActivityName(peralatan.kode_aktivitas)} />
                    )}
                    <InfoRow label="Keterangan" value={peralatan.keterangan || '–'} />
                  </div>
                  <div className="equipment-info-photo">
                    <h3 className="equipment-info-photo-title">Foto Peralatan</h3>
                  {photoUrl ? (
                    <img src={photoUrl} alt={peralatan.nama_peralatan} className="photo-preview" />
                  ) : (
                    <div className="equipment-photo-empty">
                      <Package size={32} />
                      <span>Belum ada foto</span>
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
                </div>
            </Card>
          )}

          {visibleDetailSection === 'dokumen' && (
          <Card as="section" className="card equipment-document-card" padding={false}>
            <div className="card-header">
              <h2 className="card-title">Dokumen Peralatan</h2>
              <Badge className="badge-gray">{dokumen.length} dokumen</Badge>
            </div>
            {dokumen.length === 0 ? (
              <EmptyState title="Belum ada dokumen" icon={<FileText size={24} />} />
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
                    <Button
                      as="a"
                      variant="ghost"
                      size="sm"
                      href={`${API_BASE}${d.path_dokumen.startsWith('/') ? '' : '/'}${d.path_dokumen}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Unduh/Lihat"
                    >
                      <Download size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
          )}

          {visibleDetailSection === 'qr' && isVerified && (
            <Card as="section" className="card-padded equipment-qr-card">
              <h2 className="section-title">QR Code Peralatan</h2>
              {isVerified ? (
                <div className="qr-container">
                  <p style={{ color: 'var(--clr-dark-500)', fontSize: 'var(--text-sm)', margin: 0 }}>
                    Arahkan kamera ponsel ke QR Code yang tampil di halaman ini.
                  </p>
                  <img
                    src={qrSrc}
                    alt={`QR Code Peralatan ID ${canonicalEquipmentId}`}
                    className="qr-image"
                    id={`qr-img-${canonicalEquipmentId}`}
                  />
                  {!qrSrc && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)' }}>Memuat QR Code...</span>}
                  {qrError && <p className="alert alert-error" role="alert" style={{ margin: 0 }}>{qrError}</p>}
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)' }}>
                    QR ID Peralatan: <strong>#{canonicalEquipmentId}</strong> ({peralatan.nomor_aset})
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadQR}
                    disabled={!qrSrc}
                    id="btn-unduh-qr"
                    style={{ cursor: 'pointer' }}
                  >
                    <Download size={14} /> Unduh QR
                  </Button>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: 'var(--sp-6)' }}>
                  <div className="empty-state-icon"><QrCode size={24} /></div>
                  <p className="empty-state-title">QR Code belum tersedia</p>
                  <p className="empty-state-desc">
                    QR Code dapat digunakan setelah peralatan disetujui manager.
                  </p>
                </div>
              )}
            </Card>
          )}
        </main>
      </div>
      {selectedActivityLog && (
        createPortal(
          <div
            className="modal-overlay equipment-log-review-overlay"
            role="presentation"
            onClick={() => setSelectedActivityLog(null)}
          >
            <section
              className="modal modal-lg equipment-log-review-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="equipment-log-review-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h2 className="modal-title" id="equipment-log-review-title">Tinjau {selectedActivityLog.title}</h2>
                  <p className="page-subtitle" style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)' }}>
                    {peralatan.nama_peralatan} ({peralatan.nomor_aset})
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedActivityLog(null)}
                >
                  Tutup
                </Button>
              </div>
              <div className="modal-body">
                <div className="equipment-info-grid">
                <InfoRow label="Jenis Log" value={selectedActivityLog.title.startsWith('Catatan') ? 'Peninjauan' : 'Verifikasi'} />
                <InfoRow label="Status" value={selectedActivityLog.status} />
                <InfoRow label="Tanggal" value={formatDate(selectedActivityLog.date)} />
                {selectedActivityLog.record.kode_aktivitas && (
                  <InfoRow label="Nama Aktivitas" value={getActivityName(selectedActivityLog.record.kode_aktivitas)} />
                )}
                {selectedActivityLog.record.keputusan && (
                  <InfoRow label="Keputusan" value={selectedActivityLog.record.keputusan} />
                )}
                {selectedActivityLog.record.alasan && (
                  <InfoRow label="Alasan Peninjauan" value={selectedActivityLog.record.alasan} />
                )}
                {selectedActivityLog.record.tindak_lanjut && (
                  <InfoRow label="Tindak Lanjut" value={selectedActivityLog.record.tindak_lanjut} />
                )}
                {selectedActivityLog.record.pic_user && (
                  <InfoRow
                    label="PIC"
                    value={selectedActivityLog.record.pic_user.nama_lengkap || selectedActivityLog.record.pic_user.nama || selectedActivityLog.record.pic_user.name || selectedActivityLog.record.pic_user.username}
                  />
                )}
                {selectedActivityLog.record.verified_by_user && (
                  <InfoRow
                    label="Diverifikasi Oleh"
                    value={selectedActivityLog.record.verified_by_user.nama_lengkap || selectedActivityLog.record.verified_by_user.nama || selectedActivityLog.record.verified_by_user.name || selectedActivityLog.record.verified_by_user.username}
                  />
                )}
                </div>
                {selectedLogNotes && (
                <section style={{ marginTop: 'var(--sp-4)' }}>
                  <h3 className="section-title">Data Pendukung Verifikasi</h3>
                  <div className="equipment-info-grid">
                    <InfoRow
                      label="Acuan Kriteria"
                      value={selectedLogNotes.acuan_kriteria || 'Spesifikasi Pabrikan / Prosedur Mutu TTH'}
                    />
                    <InfoRow
                      label="Nomor Sertifikat"
                      value={selectedLogNotes.sertifikat?.nomor}
                    />
                    <InfoRow
                      label="Berlaku Sampai"
                      value={selectedLogNotes.sertifikat?.berlaku_sampai}
                    />
                    <InfoRow
                      label="Penerapan Nilai Koreksi"
                      value={selectedLogNotes.sertifikat?.penerapan_nilai_koreksi}
                    />
                    {selectedLogNotes.catatan_pic && (
                      <InfoRow label="Catatan PIC" value={selectedLogNotes.catatan_pic} />
                    )}
                    {Object.entries(selectedLogNotes.alasan_tb || {}).map(([key, reason]) => (
                      <InfoRow
                        key={key}
                        label={`Alasan ${getVerificationCheckLabel(key)}`}
                        value={reason}
                      />
                    ))}
                  </div>
                </section>
                )}
                {(selectedActivityLog.record.catatan || selectedActivityLog.record.verifikasi?.catatan) && !selectedLogNotes && (
                <div style={{ marginTop: 'var(--sp-4)' }}>
                  <InfoRow
                    label="Catatan"
                    value={selectedActivityLog.record.catatan || selectedActivityLog.record.verifikasi.catatan}
                  />
                </div>
                )}
                {selectedLogVerification.hasil_verifikasi?.[0] && (
                <div style={{ marginTop: 'var(--sp-4)' }}>
                  <h3 className="section-title">Hasil Pemeriksaan</h3>
                  <div className="equipment-info-grid">
                    {[
                      ['Identitas Alat Ukur', 'identitas'],
                      ['Kelengkapan Aksesoris', 'kelengkapan'],
                      ['Firmware / Peranti Lunak', 'firmware'],
                      ['Kondisi Fisik / Visual', 'kondisi_fisik'],
                      ['Keutuhan Segel Kalibrasi', 'segel'],
                      ['Pemeriksaan Fungsi Awal', 'fungsi_awal'],
                      ['Kesesuaian Spesifikasi Metrologi', 'metrologi'],
                      ['Validitas Sertifikat Kalibrasi', 'sertifikat'],
                    ]
                      .filter(
                        ([, key]) =>
                          selectedLogVerification.kode_aktivitas !== 'A3' ||
                          !['kelengkapan', 'fungsi_awal'].includes(key),
                      )
                      .map(([label, key]) => (
                        <InfoRow
                          key={key}
                          label={label}
                          value={formatVerificationResult(
                            selectedLogVerification.hasil_verifikasi[0][key],
                            key,
                          )}
                        />
                      ))}
                  </div>
                </div>
                )}
              </div>
            </section>
          </div>,
          document.body
        )
      )}
    </div>
  );
}
