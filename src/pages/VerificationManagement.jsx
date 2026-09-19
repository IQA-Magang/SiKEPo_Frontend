import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FileCheck,
  RefreshCw,
  Send,
  XCircle,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { getCurrentUser, verifikasiApi, peralatanApi, getEquipmentId } from '../utils/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { getUserRole } from '../utils/permissions.js';
import { useNavigate } from '../router/Router.jsx';

const CHECKS = [
  'identitas',
  'kelengkapan',
  'firmware',
  'kondisi_fisik',
  'segel',
  'fungsi_awal',
  'metrologi',
  'sertifikat',
];

const CHECK_LABELS = {
  identitas: 'Identitas Alat Ukur',
  kelengkapan: 'Kelengkapan Aksesoris',
  firmware: 'Versi Firmware / Peranti Lunak',
  kondisi_fisik: 'Kondisi Fisik / Visual',
  segel: 'Keutuhan Segel Kalibrasi',
  fungsi_awal: 'Pemeriksaan Fungsi Awal',
  metrologi: 'Kesesuaian Spesifikasi Metrologi',
  sertifikat: 'Validitas Sertifikat Kalibrasi',
};

const ACTIVITY_OPTIONS = [
  ['A1', 'A1 — Penerimaan alat ukur baru'],
  ['A2', 'A2 — Setelah dikalibrasi'],
  ['A3', 'A3 — Setelah dipinjam'],
  ['A4', 'A4 — Setelah dipindahkan'],
  ['A5', 'A5 — Setelah diperbaiki'],
  ['A6', 'A6 — Setelah dipelihara'],
  ['A7', 'A7 — Segel rusak atau diragukan'],
  ['A2+A4', 'A2+A4 — Kalibrasi eksternal & pemindahan'],
  ['A5+A2', 'A5+A2 — Perbaikan lalu kalibrasi'],
  ['A4+A6', 'A4+A6 — Pindah dan pelihara'],
];

const FOLLOW_UP_OPTIONS = [
  'Masuk layanan - label diperbarui',
  'Masuk layanan - data inisial pengecekan antara diambil',
  'Kalibrasi ulang',
  'Perbaikan',
  'Penyetelan oleh pihak berwenang',
  'Klaim kepada pemasok / penyedia jasa kalibrasi',
  'Usulan penghapusan',
  'Lainnya',
];

const emptyForm = () => ({
  id_peralatan: '',
  tanggal_verifikasi: new Date().toISOString().slice(0, 10),
  kode_aktivitas: 'A1',
  tindak_lanjut: 'Masuk layanan - label diperbarui',
  catatan: '',
  acuan_kriteria: '',
  nomor_sertifikat: '',
  penyedia_kalibrasi: '',
  berlaku_sampai: '',
  nilai_koreksi: 'TB Tidak berlaku',
  peninjauan: 'Alat belum digunakan sejak aktivitas',
  tb_alasan: {},
  hasil_verifikasi: Object.fromEntries(CHECKS.map((key) => [key, 'S'])),
});

export default function VerificationManagement({ equipmentId = null, onNavigate }) {
  const routerNavigate = useNavigate();
  const navigate = onNavigate || routerNavigate;
  const { success, error } = useToast();
  const currentUser = getCurrentUser();
  const role = getUserRole(currentUser);

  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(() => ({ ...emptyForm(), id_peralatan: equipmentId || '' }));
  const [busy, setBusy] = useState(false);
  const [equipmentInfo, setEquipmentInfo] = useState(null);
  const [reviewLogs, setReviewLogs] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(Boolean(equipmentId));

  // Memuat daftar verifikasi & log untuk tampilan pengawasan (manager review)
  async function loadList() {
    setBusy(true);
    try {
      const [verificationResult, logResult] = await Promise.all([
        verifikasiApi.getAll(),
        verifikasiApi.getLogPeninjauan(),
      ]);
      setItems(verificationResult.data || []);
      setLogs(logResult.data || []);
    } catch (err) {
      error(err.message || 'Gagal memuat data verifikasi.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!equipmentId) {
      loadList();
    }
  }, [equipmentId]);

  // Saat equipmentId tersedia (setelah input data peralatan atau klik tombol Verifikasi)
  useEffect(() => {
    if (!equipmentId) return;
    setForm((prev) => ({ ...prev, id_peralatan: String(equipmentId) }));

    async function fetchEquipment() {
      setLoadingEquipment(true);
      try {
        const [res, logRes] = await Promise.allSettled([
          peralatanApi.getAll(),
          verifikasiApi.getLogByPeralatanId(equipmentId),
        ]);

        if (res.status === 'fulfilled') {
          const found = (res.value.data || []).find(
            (p) => String(getEquipmentId(p)) === String(equipmentId)
          );
          if (found) {
            setEquipmentInfo(found);
            const isRejected = found.status_verifikasi === 'Ditolak';
            const detail = found.detail || {};

            setForm((prev) => ({
              ...prev,
              id_peralatan: String(equipmentId),
              kode_aktivitas: isRejected ? 'A5' : prev.kode_aktivitas || 'A1',
              peninjauan: isRejected
                ? 'Alat telah diperbaiki dan siap diverifikasi ulang'
                : prev.peninjauan,
              nomor_sertifikat: detail.no_sertifikat || prev.nomor_sertifikat,
              berlaku_sampai: detail.tgl_jatuh_tempo
                ? detail.tgl_jatuh_tempo.slice(0, 10)
                : prev.berlaku_sampai,
              acuan_kriteria: prev.acuan_kriteria || `KK-${found.nomor_aset || 'ALAT'}`,
            }));
          }
        }

        if (logRes.status === 'fulfilled' && Array.isArray(logRes.value.data)) {
          setReviewLogs(logRes.value.data);
        }
      } catch (err) {
        console.error('Gagal mengambil data peralatan:', err);
      } finally {
        setLoadingEquipment(false);
      }
    }

    fetchEquipment();
  }, [equipmentId]);

  // Submit verifikasi — langsung diajukan ke Manager (tanpa draft)
  async function submitVerifikasi(event) {
    event.preventDefault();

    const tbKeys = CHECKS.filter((key) => form.hasil_verifikasi[key] === 'TB');
    if (tbKeys.some((key) => !form.tb_alasan[key]?.trim())) {
      error('Setiap hasil TB (Tidak Berlaku) wajib disertai alasan penjelasan.');
      return;
    }

    if (Object.values(form.hasil_verifikasi).includes('TS') && !form.tindak_lanjut) {
      error('Hasil TS (Tidak Sesuai) harus disertai pemilihan tindak lanjut alat.');
      return;
    }

    setBusy(true);
    try {
      const catatanTerstruktur = JSON.stringify({
        format: 'TLKM13/F/003-v05',
        catatan_pic: form.catatan,
        acuan_kriteria: form.acuan_kriteria,
        sertifikat: {
          nomor: form.nomor_sertifikat,
          penyedia: form.penyedia_kalibrasi,
          berlaku_sampai: form.berlaku_sampai,
          penerapan_nilai_koreksi: form.nilai_koreksi,
        },
        peninjauan_hasil_sebelumnya: form.peninjauan,
        alasan_tb: form.tb_alasan,
      });

      // 1. Buat verifikasi
      const res = await verifikasiApi.create({
        id_peralatan: Number(form.id_peralatan),
        tanggal_verifikasi: form.tanggal_verifikasi,
        kode_aktivitas: form.kode_aktivitas,
        tindak_lanjut: form.tindak_lanjut,
        catatan: catatanTerstruktur,
        hasil_verifikasi: {
          ...form.hasil_verifikasi,
          catatan: JSON.stringify({ alasan_tb: form.tb_alasan }),
        },
      });

      // 2. Langsung tandatangani (sign PIC) agar status langsung 'Diajukan'
      const newId = res?.data?.id_verifikasi ?? res?.data?.id ?? res?.id;
      if (newId) {
        const signature =
          currentUser?.nama_lengkap || currentUser?.nama || currentUser?.email || 'PIC Lab';
        await verifikasiApi.signPic(newId, signature);
      }

      success('Verifikasi berhasil diajukan kepada Manager Lab untuk ditinjau.');

      if (equipmentId) {
        navigate(`/peralatan/detail/${equipmentId}`);
      } else {
        setForm(emptyForm());
        await loadList();
      }
    } catch (err) {
      error(err.message || 'Gagal mengajukan verifikasi.');
    } finally {
      setBusy(false);
    }
  }

  // Manager Actions
  async function approve(item) {
    const defaultSign = currentUser?.nama_lengkap || currentUser?.nama || '';
    const signature = window.prompt(
      'Masukkan tanda tangan/nama manager untuk menyetujui verifikasi:',
      defaultSign
    );
    if (!signature?.trim()) return;

    setBusy(true);
    try {
      await verifikasiApi.approve(item.id_verifikasi ?? item.id, signature.trim());
      success('Verifikasi berhasil disetujui. Status peralatan kini Aktif.');
      await loadList();
    } catch (err) {
      error(err.message || 'Gagal menyetujui verifikasi.');
    } finally {
      setBusy(false);
    }
  }

  async function reject(item) {
    const alasan = window.prompt('Masukkan alasan penolakan (evaluasi ketidaksesuaian):');
    if (!alasan?.trim()) return;
    const catatan = window.prompt('Catatan tindak lanjut tambahan (opsional):') || '';

    setBusy(true);
    try {
      await verifikasiApi.reject(item.id_verifikasi ?? item.id, {
        alasan: alasan.trim(),
        catatan,
      });
      success('Verifikasi ditolak dan dicatat pada log peninjauan (TLKM13/IK/012).');
      await loadList();
    } catch (err) {
      error(err.message || 'Gagal menolak verifikasi.');
    } finally {
      setBusy(false);
    }
  }

  const id = (item) => item.id_verifikasi ?? item.id;
  const officialNotes = (item) => {
    try {
      const data = JSON.parse(item.catatan || '{}');
      return data.format === 'TLKM13/F/003-v05' ? data : null;
    } catch {
      return null;
    }
  };

  // =========================================================================
  // VIEW 1: Form Verifikasi Langsung (Jika ada equipmentId)
  // Muncul setelah input data peralatan atau saat klik tombol Verifikasi
  // =========================================================================
  if (equipmentId) {
    const isRejected = equipmentInfo?.status_verifikasi === 'Ditolak';
    const hasTS = Object.values(form.hasil_verifikasi).includes('TS');

    return (
      <div className="page-container fade-in-up">
        {/* Header navigasi */}
        <div
          className="page-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--sp-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => navigate(`/peralatan/detail/${equipmentId}`)}
              title="Kembali ke Detail Peralatan"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="page-title">
                {isRejected ? 'Verifikasi Ulang Peralatan' : 'Form Verifikasi Alat Ukur'}
              </h1>
              <p className="page-subtitle">
                Prosedur TLKM13/F/003 — Verifikasi kelayakan fungsi dan metrologi sebelum masuk layanan.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`/peralatan/detail/${equipmentId}`)}
          >
            ← Kembali ke Detail
          </button>
        </div>

        {/* Informasi Peralatan */}
        {loadingEquipment ? (
          <div className="card" style={{ padding: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
            <div className="skeleton" style={{ height: 48 }} />
          </div>
        ) : equipmentInfo ? (
          <div
            className="card"
            style={{
              padding: 'var(--sp-4)',
              marginBottom: 'var(--sp-5)',
              borderLeft: isRejected ? '4px solid var(--clr-danger-500, #ef4444)' : '4px solid var(--clr-primary-500, #3b82f6)',
              background: 'var(--clr-dark-50, #f8fafc)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--sp-3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-md, 8px)',
                    background: 'var(--clr-primary-100, #e0e7ff)',
                    color: 'var(--clr-primary-600, #4f46e5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Package size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--text-base)', color: 'var(--clr-dark-900)' }}>
                    {equipmentInfo.nama_peralatan}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>No. Aset: <strong>{equipmentInfo.nomor_aset || '-'}</strong></span>
                    {equipmentInfo.merek && <span>Merek: {equipmentInfo.merek} {equipmentInfo.tipe_model || ''}</span>}
                    {equipmentInfo.laboratorium && <span>Lab: {equipmentInfo.laboratorium.nama_lab || '-'}</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge ${equipmentInfo.status_verifikasi === 'Disetujui' ? 'badge-aktif' : isRejected ? 'badge-rusak' : 'badge-gray'}`}>
                  Status: {equipmentInfo.status_verifikasi || 'Karantina (Belum Diverifikasi)'}
                </span>
              </div>
            </div>

            {/* Riwayat Peninjauan jika berstatus Ditolak */}
            {isRejected && reviewLogs.length > 0 && (
              <div
                style={{
                  marginTop: 'var(--sp-3)',
                  padding: 'var(--sp-3)',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-sm, 4px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#b91c1c', fontWeight: 'var(--fw-medium)', fontSize: 'var(--text-xs)', marginBottom: 2 }}>
                  <AlertTriangle size={14} /> Catatan Penolakan Terakhir (TLKM13/IK/012):
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: '#7f1d1d' }}>
                  {reviewLogs[0]?.alasan || reviewLogs[0]?.catatan || 'Peralatan memerlukan perbaikan sebelum verifikasi ulang.'}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Form Pengisian Verifikasi */}
        <form className="card card-padded" onSubmit={submitVerifikasi}>
          {/* A. Identitas Alat Ukur dan Kegiatan */}
          <div style={{ marginBottom: 'var(--sp-6)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileCheck size={18} style={{ color: 'var(--clr-primary-500)' }} />
              A. Identitas Alat Ukur dan Kegiatan
            </h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">ID / Nomor Aset Peralatan</label>
                <input
                  className="form-input"
                  type="text"
                  value={equipmentInfo?.nomor_aset ? `${equipmentInfo.nomor_aset} (ID: ${form.id_peralatan})` : `ID: ${form.id_peralatan}`}
                  readOnly
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tanggal Verifikasi <span style={{ color: 'red' }}>*</span></label>
                <input
                  className="form-input"
                  type="date"
                  value={form.tanggal_verifikasi}
                  onChange={(e) => setForm({ ...form, tanggal_verifikasi: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kode Aktivitas <span style={{ color: 'red' }}>*</span></label>
                <select
                  className="form-select"
                  value={form.kode_aktivitas}
                  onChange={(e) => setForm({ ...form, kode_aktivitas: e.target.value })}
                  required
                >
                  <option value="">-- Pilih Kode Aktivitas --</option>
                  {ACTIVITY_OPTIONS.map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Acuan Kriteria Keberterimaan <span style={{ color: 'red' }}>*</span></label>
                <input
                  className="form-input"
                  placeholder="Contoh: KK-OTDR-01 / Manual Book"
                  value={form.acuan_kriteria}
                  onChange={(e) => setForm({ ...form, acuan_kriteria: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* B. Hasil Pemeriksaan Aspek Verifikasi */}
          <div style={{ marginBottom: 'var(--sp-6)' }}>
            <div style={{ marginBottom: 'var(--sp-3)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', margin: 0 }}>
                B. Hasil Pemeriksaan (8 Aspek Verifikasi)
              </h3>
              <p className="page-subtitle" style={{ fontSize: 'var(--text-xs)', marginTop: 2 }}>
                Kriteria: <strong>S</strong> = Sesuai, <strong>TS</strong> = Tidak Sesuai, <strong>TB</strong> = Tidak Berlaku (wajib isi alasan).
              </p>
            </div>

            <div className="form-grid-2">
              {CHECKS.map((key) => {
                const isTB = form.hasil_verifikasi[key] === 'TB';
                const isTS = form.hasil_verifikasi[key] === 'TS';
                return (
                  <div
                    key={key}
                    className="form-group"
                    style={{
                      padding: 'var(--sp-3)',
                      borderRadius: 'var(--radius-md, 6px)',
                      background: isTS ? '#fff1f2' : isTB ? '#f8fafc' : '#f0fdf4',
                      border: `1px solid ${isTS ? '#fecdd3' : isTB ? '#e2e8f0' : '#bbf7d0'}`,
                    }}
                  >
                    <label className="form-label" style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-xs)' }}>
                      {CHECK_LABELS[key]}
                    </label>
                    <select
                      className="form-select"
                      value={form.hasil_verifikasi[key]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          hasil_verifikasi: {
                            ...form.hasil_verifikasi,
                            [key]: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="S">S — Sesuai</option>
                      <option value="TS">TS — Tidak Sesuai</option>
                      <option value="TB">TB — Tidak Berlaku</option>
                    </select>

                    {isTB && (
                      <input
                        className="form-input"
                        style={{ marginTop: 6, fontSize: 'var(--text-xs)' }}
                        placeholder="Alasan Tidak Berlaku (wajib diisi)..."
                        value={form.tb_alasan[key] || ''}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            tb_alasan: { ...form.tb_alasan, [key]: e.target.value },
                          })
                        }
                        required
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* C. Sertifikat Kalibrasi dan Nilai Koreksi */}
          <div style={{ marginBottom: 'var(--sp-6)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)' }}>
              C. Sertifikat Kalibrasi dan Nilai Koreksi
            </h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Nomor Sertifikat</label>
                <input
                  className="form-input"
                  placeholder="Nomor sertifikat kalibrasi (jika ada)"
                  value={form.nomor_sertifikat}
                  onChange={(e) => setForm({ ...form, nomor_sertifikat: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Penyedia Kalibrasi</label>
                <input
                  className="form-input"
                  placeholder="Laboratorium / Lembaga pengkalibrasi"
                  value={form.penyedia_kalibrasi}
                  onChange={(e) => setForm({ ...form, penyedia_kalibrasi: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Berlaku Sampai (Jatuh Tempo)</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.berlaku_sampai}
                  onChange={(e) => setForm({ ...form, berlaku_sampai: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Penerapan Nilai Koreksi</label>
                <select
                  className="form-select"
                  value={form.nilai_koreksi}
                  onChange={(e) => setForm({ ...form, nilai_koreksi: e.target.value })}
                >
                  <option value="Y Diterapkan">Y Diterapkan</option>
                  <option value="T Tidak diterapkan">T Tidak diterapkan</option>
                  <option value="TB Tidak berlaku">TB Tidak berlaku</option>
                </select>
              </div>
            </div>
          </div>

          {/* D. Peninjauan Hasil Pekerjaan Sebelumnya */}
          <div style={{ marginBottom: 'var(--sp-6)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)' }}>
              D. Peninjauan Hasil Pekerjaan Sebelumnya
            </h3>
            <div className="form-group">
              <select
                className="form-select"
                value={form.peninjauan}
                onChange={(e) => setForm({ ...form, peninjauan: e.target.value })}
              >
                <option value="Alat belum digunakan sejak aktivitas">Alat belum digunakan sejak aktivitas</option>
                <option value="Tidak berdampak pada hasil">Tidak berdampak pada hasil</option>
                <option value="Berpotensi berdampak - pekerjaan tidak sesuai">Berpotensi berdampak — pekerjaan tidak sesuai</option>
                <option value="Alat telah diperbaiki dan siap diverifikasi ulang">Alat telah diperbaiki dan siap diverifikasi ulang</option>
                <option value="Tidak berlaku">Tidak berlaku</option>
              </select>
            </div>
          </div>

          {/* E. Keputusan Kelayakan dan Tindak Lanjut */}
          <div style={{ marginBottom: 'var(--sp-6)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>
              E. Keputusan dan Tindak Lanjut
            </h3>
            <p className="page-subtitle" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--sp-3)' }}>
              Status kelayakan:{' '}
              {hasTS ? (
                <span style={{ color: '#b91c1c', fontWeight: 'bold' }}>
                  Tidak Layak Digunakan (Terdapat aspek TS — Karantina berlanjut)
                </span>
              ) : (
                <span style={{ color: '#15803d', fontWeight: 'bold' }}>
                  Direkomendasikan Layak Digunakan (Menunggu Persetujuan Manager Lab)
                </span>
              )}
            </p>

            <div className="form-group">
              <label className="form-label">Rencana Tindak Lanjut <span style={{ color: 'red' }}>*</span></label>
              <select
                className="form-select"
                value={form.tindak_lanjut}
                onChange={(e) => setForm({ ...form, tindak_lanjut: e.target.value })}
                required
              >
                <option value="">-- Pilih Tindak Lanjut --</option>
                {FOLLOW_UP_OPTIONS.map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginTop: 'var(--sp-3)' }}>
              <label className="form-label">Catatan Pemeriksaan PIC</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Catatan hasil verifikasi fisik, kelayakan, dan kesiapan alat..."
                value={form.catatan}
                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              />
            </div>
          </div>

          {/* Tombol Aksi — Tidak ada draft, langsung ajukan verifikasi */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--sp-3)',
              justifyContent: 'flex-end',
              borderTop: '1px solid var(--clr-dark-200, #e2e8f0)',
              paddingTop: 'var(--sp-4)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/peralatan/detail/${equipmentId}`)}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
              id="btn-ajukan-verifikasi"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Send size={16} />
              {busy ? 'Mengajukan Verifikasi...' : 'Ajukan Verifikasi'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: Daftar Verifikasi (Manager Review & Pengawasan)
  // Dibuka lewat menu sidebar /verifikasi tanpa ID spesifik
  // =========================================================================
  return (
    <div className="page-container fade-in-up">
      <div
        className="page-header"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--sp-3)',
        }}
      >
        <div>
          <h1 className="page-title">Verifikasi Peralatan</h1>
          <p className="page-subtitle">
            Daftar pengajuan verifikasi alat ukur (TLKM13/F/003) untuk evaluasi dan persetujuan Manager Lab.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/peralatan/menunggu-verifikasi')}
            title="Lihat alat yang masih di karantina dan perlu diverifikasi"
          >
            Peralatan Menunggu Verifikasi
          </button>
          <button
            className="btn btn-secondary btn-icon"
            onClick={() => setShowLogs(!showLogs)}
            title="Log Peninjauan (TLKM13/IK/012)"
          >
            <ClipboardCheck size={16} />
          </button>
          <button
            className="btn btn-secondary btn-icon"
            onClick={loadList}
            disabled={busy}
            title="Segarkan Data"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Log Peninjauan Ketidaksesuaian */}
      {showLogs && (
        <div className="card" style={{ marginBottom: 'var(--sp-4)', padding: 'var(--sp-4)' }}>
          <h2 style={{ marginTop: 0, fontSize: 'var(--text-base)' }}>Log Peninjauan Ketidaksesuaian (TLKM13/IK/012)</h2>
          {logs.length ? (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {logs.map((log, index) => (
                <li key={log.id_log || index} style={{ marginBottom: 4 }}>
                  <strong>{log.status || 'Ditolak'}</strong> — {log.alasan || log.catatan || 'Tanpa catatan'}
                  {log.created_at && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-400)', marginLeft: 8 }}>
                      ({new Date(log.created_at).toLocaleString('id-ID')})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state-desc" style={{ margin: 0 }}>Belum ada log peninjauan.</p>
          )}
        </div>
      )}

      {/* Tabel Pengajuan Verifikasi */}
      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Peralatan</th>
                <th>Tanggal Verifikasi</th>
                <th>Kode Aktivitas</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((item) => (
                  <tr key={id(item)}>
                    <td>
                      <div style={{ fontWeight: 'var(--fw-medium)' }}>
                        {item.peralatan?.nama_peralatan || `Peralatan ID ${item.id_peralatan}`}
                      </div>
                      {item.peralatan?.nomor_aset && (
                        <code style={{ fontSize: 'var(--text-xs)', background: 'var(--clr-dark-100)', padding: '2px 4px', borderRadius: 4 }}>
                          {item.peralatan.nomor_aset}
                        </code>
                      )}
                    </td>
                    <td>
                      {item.tanggal_verifikasi
                        ? new Date(item.tanggal_verifikasi).toLocaleDateString('id-ID')
                        : '-'}
                    </td>
                    <td>
                      <span className="badge badge-gray">{item.kode_aktivitas || '-'}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          item.status === 'Disetujui'
                            ? 'badge-aktif'
                            : item.status === 'Ditolak'
                            ? 'badge-rusak'
                            : 'badge-kalibrasi'
                        }`}
                      >
                        {item.status || '-'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setSelected(item)}
                        >
                          Rincian
                        </button>

                        {/* Aksi Persetujuan Manager */}
                        {item.status === 'Diajukan' && role === 'manager' && (
                          <>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--clr-success-600, #16a34a)' }}
                              disabled={busy}
                              onClick={() => approve(item)}
                              title="Setujui verifikasi alat"
                            >
                              <CheckCircle2 size={14} /> Setujui
                            </button>
                            <button
                              className="btn btn-ghost btn-sm text-error"
                              disabled={busy}
                              onClick={() => reject(item)}
                              title="Tolak verifikasi dan catat ketidaksesuaian"
                            >
                              <XCircle size={14} /> Tolak
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 'var(--sp-6)' }}>
                    {busy ? 'Memuat data verifikasi...' : 'Belum ada pengajuan verifikasi.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Rincian Verifikasi */}
      {selected && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setSelected(null)}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 700 }}
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Rincian Verifikasi TLKM13/F/003</h2>
                <p className="page-subtitle" style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)' }}>
                  {selected.peralatan?.nama_peralatan || `Peralatan ID ${selected.id_peralatan}`}
                  {selected.peralatan?.nomor_aset ? ` (${selected.peralatan.nomor_aset})` : ''}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSelected(null)}
              >
                Tutup
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid-2" style={{ marginBottom: 'var(--sp-3)' }}>
                <div>
                  <strong>Kode Aktivitas:</strong>
                  <p style={{ margin: '2px 0 0' }}>{selected.kode_aktivitas || '-'}</p>
                </div>
                <div>
                  <strong>Status:</strong>
                  <p style={{ margin: '2px 0 0' }}>
                    <span className="badge badge-gray">{selected.status || '-'}</span>
                  </p>
                </div>
                <div>
                  <strong>Tindak Lanjut:</strong>
                  <p style={{ margin: '2px 0 0' }}>{selected.tindak_lanjut || '-'}</p>
                </div>
                <div>
                  <strong>Tanggal:</strong>
                  <p style={{ margin: '2px 0 0' }}>
                    {selected.tanggal_verifikasi
                      ? new Date(selected.tanggal_verifikasi).toLocaleDateString('id-ID')
                      : '-'}
                  </p>
                </div>
              </div>

              <h4 style={{ margin: 'var(--sp-4) 0 var(--sp-2)', fontSize: 'var(--text-sm)' }}>
                Hasil 8 Aspek Pemeriksaan
              </h4>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Aspek</th>
                      <th>Hasil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CHECKS.map((key) => {
                      const hasil = selected.hasil_verifikasi?.[0]?.[key] || '-';
                      return (
                        <tr key={key}>
                          <td>{CHECK_LABELS[key]}</td>
                          <td>
                            <span
                              className={`badge ${
                                hasil === 'S'
                                  ? 'badge-aktif'
                                  : hasil === 'TS'
                                  ? 'badge-rusak'
                                  : 'badge-gray'
                              }`}
                            >
                              {hasil === 'S' ? 'S (Sesuai)' : hasil === 'TS' ? 'TS (Tidak Sesuai)' : hasil}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {officialNotes(selected) && (
                <div style={{ marginTop: 'var(--sp-4)' }}>
                  <h4 style={{ margin: '0 0 var(--sp-2)', fontSize: 'var(--text-sm)' }}>
                    Data Pendukung
                  </h4>
                  <div className="form-grid-2" style={{ fontSize: 'var(--text-xs)' }}>
                    <div>
                      <strong>Acuan Kriteria:</strong>
                      <p style={{ margin: '2px 0' }}>{officialNotes(selected).acuan_kriteria || '-'}</p>
                    </div>
                    <div>
                      <strong>Peninjauan Sebelumnya:</strong>
                      <p style={{ margin: '2px 0' }}>
                        {officialNotes(selected).peninjauan_hasil_sebelumnya || '-'}
                      </p>
                    </div>
                    <div>
                      <strong>Sertifikat:</strong>
                      <p style={{ margin: '2px 0' }}>
                        {officialNotes(selected).sertifikat?.nomor || '-'}
                        {officialNotes(selected).sertifikat?.berlaku_sampai
                          ? ` (s/d ${officialNotes(selected).sertifikat.berlaku_sampai})`
                          : ''}
                      </p>
                    </div>
                    <div>
                      <strong>Nilai Koreksi:</strong>
                      <p style={{ margin: '2px 0' }}>
                        {officialNotes(selected).sertifikat?.penerapan_nilai_koreksi || '-'}
                      </p>
                    </div>
                  </div>
                  {officialNotes(selected).catatan_pic && (
                    <div style={{ marginTop: 'var(--sp-2)' }}>
                      <strong>Catatan PIC:</strong>
                      <p style={{ margin: '2px 0', fontSize: 'var(--text-xs)', background: 'var(--clr-dark-50)', padding: 8, borderRadius: 4 }}>
                        {officialNotes(selected).catatan_pic}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelected(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
