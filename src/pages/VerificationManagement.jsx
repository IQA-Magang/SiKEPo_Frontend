import React, { useEffect, useRef, useState } from 'react';
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
  Eraser,
  Printer,
  X,
} from 'lucide-react';
import { getCurrentUser, verifikasiApi, peralatanApi, getEquipmentId, formatPhotoUrl } from '../utils/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { getUserRole, can, isStaffPic, ACCESS, ACTIONS } from '../utils/permissions.js';
import { useNavigate } from '../router/Router.jsx';
import { exportVerificationPdf } from '../utils/verificationPdf.js';

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
  ['P1', 'P1 — Peralatan baru diterima'],
  ['P2', 'P2 — Setelah kalibrasi'],
  ['P3', 'P3 — Setelah verifikasi fungsi'],
  ['P4', 'P4 — Setelah pengecekan antara/karakterisasi ulang'],
  ['P5', 'P5 — Setelah dipinjam/dipindahkan atau dikembalikan'],
  ['P6', 'P6 — Setelah pemeliharaan'],
  ['P7', 'P7 — Setelah penyesuaian'],
  ['P8', 'P8 — Setelah perbaikan'],
  ['P9', 'P9 — Kembali dari peninjauan tanpa perbaikan'],
  ['P2+P5', 'P2+P5 — Kalibrasi dan pengembalian'],
  ['P8+P2', 'P8+P2 — Perbaikan lalu kalibrasi'],
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

function DigitalSignaturePad({ value, onChange, label, required = true }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  // Inisialisasi canvas dengan DPI scaling agar garis tajam dan tidak buram di layar Retina / mobile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = 140;

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a';

    // Jika sudah ada data tanda tangan (base64 PNG), gambar ke canvas
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = value;
    }
  }, []);

  function getPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function handlePointerDown(e) {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    drawingRef.current = true;
    const { x, y } = getPoint(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const { x, y } = getPoint(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function handlePointerUp(e) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (canvasRef.current) {
      onChange(canvasRef.current.toDataURL('image/png'));
    }
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    onChange('');
  }

  return (
    <div className="form-group" style={{ marginBottom: 'var(--sp-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label className="form-label" style={{ margin: 0, fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-xs)' }}>
          {label} {required && <span style={{ color: 'var(--clr-error-500, #ef4444)' }}>*</span>}
        </label>
        {value ? (
          <span className="badge badge-aktif" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={12} /> Tanda tangan tercatat
          </span>
        ) : (
          <span className="badge badge-gray" style={{ fontSize: '11px' }}>
            Belum ditandatangani
          </span>
        )}
      </div>

      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-lg, 10px)',
          border: '1.5px dashed var(--clr-dark-300, #cbd5e1)',
          background: '#ffffff',
          overflow: 'hidden',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        {/* Garis batas panduan tanda tangan */}
        <div
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            bottom: 32,
            borderBottom: '1px dashed #cbd5e1',
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '10px', color: '#94a3b8', background: '#ffffff', padding: '0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Tanda Tangan di Atas Garis Ini
          </span>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>✕</span>
        </div>

        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            width: '100%',
            height: 140,
            display: 'block',
            cursor: 'crosshair',
            touchAction: 'none',
            position: 'relative',
            zIndex: 2,
          }}
          aria-label={label}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm text-error"
          onClick={clear}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', fontSize: '12px' }}
        >
          <Eraser size={14} /> Hapus & Goreskan Ulang
        </button>
        <span style={{ fontSize: '11px', color: 'var(--clr-dark-400)' }}>
          Gunakan mouse, stylus, atau sentuhan layar
        </span>
      </div>
    </div>
  );
}

// Komponen kartu tampilan tanda tangan resmi untuk modal rincian & persetujuan
function SignatureDisplayCard({ title, roleLabel, signature, signerName, signerNip, signedAt }) {
  const isSigned = Boolean(signature);
  return (
    <div
      style={{
        border: '1px solid var(--clr-dark-200, #e2e8f0)',
        borderRadius: 'var(--radius-lg, 10px)',
        background: 'var(--clr-dark-50, #f8fafc)',
        padding: 'var(--sp-4)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: '11px', fontWeight: 'var(--fw-bold)', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--clr-dark-600)' }}>
          {title}
        </span>
        <span className={`badge ${isSigned ? 'badge-aktif' : 'badge-gray'}`} style={{ fontSize: '11px' }}>
          {isSigned ? 'Terverifikasi Digital' : 'Belum Ditandatangani'}
        </span>
      </div>

      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-md, 6px)',
          border: '1px solid var(--clr-dark-200, #e2e8f0)',
          minHeight: 85,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 6,
          marginBottom: 8,
        }}
      >
        {isSigned ? (
          <img
            src={signature}
            alt={title}
            style={{ maxHeight: 70, maxWidth: '100%', objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--clr-dark-400)', fontStyle: 'italic' }}>
            Menunggu tanda tangan digital...
          </span>
        )}
      </div>

      <div style={{ borderTop: '1px dashed var(--clr-dark-200, #e2e8f0)', paddingTop: 6 }}>
        <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--text-xs)', color: 'var(--clr-dark-900)' }}>
          {signerName || '-'}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--clr-dark-500)', marginTop: 1 }}>
          {signerNip || roleLabel || '-'}
        </div>
        {signedAt && (
          <div style={{ fontSize: '10px', color: 'var(--clr-dark-400)', marginTop: 2 }}>
            Tgl: {new Date(signedAt).toLocaleString('id-ID')}
          </div>
        )}
      </div>
    </div>
  );
}

const emptyForm = () => ({
  id_peralatan: '',
  tanggal_verifikasi: new Date().toISOString().slice(0, 10),
  kode_aktivitas: 'P1',
  tindak_lanjut: 'Masuk layanan - label diperbarui',
  catatan: '',
  acuan_kriteria: '',
  nomor_sertifikat: '',
  penyedia_kalibrasi: '',
  berlaku_sampai: '',
  nilai_koreksi: 'TB Tidak berlaku',
  peninjauan: 'Alat belum digunakan sejak aktivitas',
  tb_alasan: {},
  hasil_verifikasi: Object.fromEntries(CHECKS.map((key) => [key, ''])),
});

export default function VerificationManagement({ equipmentId = null, onNavigate }) {
  const routerNavigate = useNavigate();
  const navigate = onNavigate || routerNavigate;
  const { success, error } = useToast();
  const currentUser = getCurrentUser();
  const role = getUserRole(currentUser);
  const isStaffPIC = role === 'staff' && Boolean(currentUser?.pic);
  const canSubmit = isStaffPIC || role === 'admin';
  const canApprove = role === 'manager' || role === 'admin';
  const currentUserId = currentUser?.user_id ?? currentUser?.id;

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'review' | 'history'
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pendingEquipment, setPendingEquipment] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(() => ({ ...emptyForm(), id_peralatan: equipmentId || '' }));
  const [busy, setBusy] = useState(false);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [equipmentInfo, setEquipmentInfo] = useState(null);
  const [reviewLogs, setReviewLogs] = useState([]);
  const [picSignature, setPicSignature] = useState('');
  const [managerSignature, setManagerSignature] = useState('');
  const [approvalModalItem, setApprovalModalItem] = useState(null);
  const [approvalMode, setApprovalMode] = useState('approve'); // 'approve' | 'reject'
  const [rejectReason, setRejectReason] = useState('');
  const [rejectCatatan, setRejectCatatan] = useState('');
  const [affirmApproved, setAffirmApproved] = useState(false);

  // Memuat daftar verifikasi, log peninjauan, & daftar peralatan karantina/pending
  async function loadList() {
    setBusy(true);
    try {
      const [verificationResult, logResult, equipmentResult] = await Promise.allSettled([
        verifikasiApi.getAll(),
        verifikasiApi.getLogPeninjauan(),
        peralatanApi.getAll(),
      ]);
      if (verificationResult.status === 'fulfilled') {
        setItems(verificationResult.value?.data || []);
      }
      if (logResult.status === 'fulfilled') {
        setLogs(logResult.value?.data || []);
      }
      if (equipmentResult.status === 'fulfilled') {
        const all = equipmentResult.value?.data || [];
        // Peralatan yang perlu verifikasi awal (belum disetujui, belum diajukan, dan belum dihapus)
        const pending = all.filter(
          (p) => p.status_verifikasi !== 'Disetujui' && p.status_verifikasi !== 'Diajukan' && p.status_alat !== 'Dihapuskan'
        );
        const visiblePending = role === 'staff'
          ? pending.filter((p) => String(p.pic_id) === String(currentUserId))
          : pending;
        setPendingEquipment(visiblePending);
      }
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
              kode_aktivitas: isRejected ? 'P8' : prev.kode_aktivitas || 'P1',
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

    if (!picSignature) {
      error('Tanda tangan PIC wajib diisi sebelum verifikasi diajukan.');
      return;
    }

    const tbKeys = CHECKS.filter((key) => form.hasil_verifikasi[key] === 'TB');
    const missingKeys = CHECKS.filter((key) => !form.hasil_verifikasi[key]);
    if (missingKeys.length > 0) {
      error('Semua aspek verifikasi wajib dinilai dengan S, TS, atau TB.');
      return;
    }
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

      // 2. Tanda tangan PIC menjadi bukti pengajuan kepada Manager
      const newId = res?.data?.id_verifikasi ?? res?.data?.id ?? res?.id;
      if (newId) {
        await verifikasiApi.signPic(newId, picSignature);
      }

      success('Verifikasi berhasil diajukan kepada Manager Lab untuk ditinjau.');

      if (equipmentId) {
        navigate('/verifikasi');
      } else {
        setForm(emptyForm());
        setPicSignature('');
        await loadList();
      }
    } catch (err) {
      error(err.message || 'Gagal mengajukan verifikasi.');
    } finally {
      setBusy(false);
    }
  }

  // Manager Modal Actions
  function openApprovalModal(item) {
    setApprovalModalItem(item);
    setApprovalMode('approve');
    setManagerSignature('');
    setRejectReason('');
    setRejectCatatan('');
    setAffirmApproved(false);
  }

  function closeApprovalModal() {
    setApprovalModalItem(null);
    setManagerSignature('');
    setRejectReason('');
    setRejectCatatan('');
    setAffirmApproved(false);
  }

  async function handleApproveFromModal() {
    const target = selected || approvalModalItem;
    if (!target) return;
    if (!managerSignature?.trim()) {
      error('Tanda tangan digital manager wajib digoreskan sebelum verifikasi disetujui.');
      return;
    }
    if (!affirmApproved) {
      error('Harap centang pernyataan konfirmasi kelayakan peralatan.');
      return;
    }

    setBusy(true);
    try {
      const verifikasiId = target.id_verifikasi ?? target.id;
      await verifikasiApi.approve(verifikasiId, managerSignature.trim());
      success('Verifikasi berhasil disetujui. Status peralatan kini Aktif dan masuk ke inventaris.');
      closeApprovalModal();
      setSelected(null);
      await loadList();
    } catch (err) {
      error(err.message || 'Gagal menyetujui verifikasi.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRejectFromModal() {
    const target = selected || approvalModalItem;
    if (!target) return;
    if (!rejectReason.trim()) {
      error('Alasan penolakan / evaluasi ketidaksesuaian wajib diisi.');
      return;
    }

    setBusy(true);
    try {
      const verifikasiId = target.id_verifikasi ?? target.id;
      await verifikasiApi.reject(verifikasiId, {
        alasan: rejectReason.trim(),
        catatan: rejectCatatan.trim(),
      });
      success('Verifikasi ditolak dan dicatat pada log peninjauan (TLKM13/IK/012).');
      closeApprovalModal();
      setSelected(null);
      await loadList();
    } catch (err) {
      error(err.message || 'Gagal menolak verifikasi.');
    } finally {
      setBusy(false);
    }
  }

  const id = (item) => item.id_verifikasi ?? item.id;
  const reviewItems = items.filter((item) => item.status === 'Diajukan');
  const historyItems = items.filter((item) => item.status === 'Disetujui' || item.status === 'Ditolak');
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
    if (!canSubmit) {
      return (
        <div className="page-container fade-in-up">
          <div className="card card-padded">
            <h1 className="page-title">Akses Pengajuan Verifikasi</h1>
            <p className="page-subtitle">
              Hanya staff yang ditandai sebagai PIC yang dapat mengisi dan mengajukan verifikasi.
              Staff lainnya tetap dapat melihat verifikasi beserta detailnya.
            </p>
            <button className="btn btn-secondary" type="button" onClick={() => navigate('/verifikasi')}>
              <ArrowLeft size={16} /> Kembali ke Verifikasi
            </button>
          </div>
        </div>
      );
    }

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
                      <option value="">Pilih hasil verifikasi</option>
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

            <div className="form-group" style={{ marginTop: 'var(--sp-3)' }}>
              <label className="form-label">
                Tanda Tangan PIC <span style={{ color: 'red' }}>*</span>
              </label>
              <DigitalSignaturePad
                value={picSignature}
                onChange={setPicSignature}
                label="Tanda Tangan Digital PIC"
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
            Alur verifikasi kelayakan peralatan (TLKM13/F/003) sebelum diaktifkan ke dalam inventaris laboratorium.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {canSubmit && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/peralatan/tambah')}
              title="Tambah peralatan baru"
            >
              + Tambah Peralatan
            </button>
          )}
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

      {/* Tabs Alur Verifikasi */}
      <div className="card" style={{ padding: 6, display: 'flex', gap: 6, width: 'fit-content', marginBottom: 'var(--sp-5)', flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${activeTab === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('pending')}
        >
          Menunggu Verifikasi ({pendingEquipment.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'review' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('review')}
        >
          Persetujuan Manager ({reviewItems.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('history')}
        >
          Riwayat Verifikasi ({historyItems.length})
        </button>
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

      {/* Tabel Konten per Tab */}
      <div className="card">
        {/* TAB 1: MENUNGGU VERIFIKASI (Alat Perlu Verifikasi) */}
        {activeTab === 'pending' && (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Foto</th>
                  <th>Nama Peralatan</th>
                  <th>No. Aset</th>
                  <th>Kategori & Lokasi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingEquipment.length ? (
                  pendingEquipment.map((p, idx) => {
                    const eqId = getEquipmentId(p);
                    const photoUrl = formatPhotoUrl(p.foto);
                    const isRejected = p.status_verifikasi === 'Ditolak';
                    return (
                      <tr key={eqId}>
                        <td style={{ color: 'var(--clr-dark-400)', width: 40 }}>{idx + 1}</td>
                        <td style={{ width: 52 }}>
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
                          <div style={{ fontWeight: 'var(--fw-medium)', color: 'var(--clr-dark-900)' }}>
                            {p.nama_peralatan}
                          </div>
                          {p.merek && (
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-400)' }}>
                              {p.merek}{p.tipe_model ? ` — ${p.tipe_model}` : ''}
                            </div>
                          )}
                        </td>
                        <td>
                          <code style={{ fontSize: 'var(--text-xs)', background: 'var(--clr-dark-100)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                            {p.nomor_aset || '-'}
                          </code>
                        </td>
                        <td>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-700)' }}>
                            <div>{p.kategori_peralatan?.nama_kategori || 'Kategori Umum'}</div>
                            <div style={{ color: 'var(--clr-dark-400)' }}>{p.ruangan?.nama_ruangan || p.laboratorium?.nama_lab || '-'}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${isRejected ? 'badge-rusak' : 'badge-kalibrasi'}`}>
                            <span className="badge-dot" />
                            {isRejected ? 'Perlu Verifikasi Ulang' : 'Perlu Verifikasi'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {isStaffPIC || role === 'admin' ? (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => navigate(`/verifikasi/${eqId}`)}
                              title="Mulai pengisian tahapan verifikasi alat"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                            >
                              <ClipboardCheck size={14} />
                              {isRejected ? 'Verifikasi Ulang' : 'Mulai Verifikasi'}
                            </button>
                            ) : null}
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => navigate(`/peralatan/detail/${eqId}`)}
                              title="Lihat detail alat"
                            >
                              Detail Alat
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--sp-6)', color: 'var(--clr-dark-500)' }}>
                      {busy ? 'Memuat data peralatan...' : 'Tidak ada peralatan yang menunggu verifikasi.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: PERSETUJUAN VERIFIKASI (Menunggu Persetujuan Manager) */}
        {activeTab === 'review' && (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Peralatan</th>
                  <th>Tanggal Pengajuan</th>
                  <th>Kode Aktivitas</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reviewItems.length ? (
                  reviewItems.map((item) => (
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
                        <span className="badge badge-kalibrasi">
                          <span className="badge-dot" />
                          {item.status || 'Diajukan'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => { setManagerSignature(''); setApprovalMode('approve'); setRejectReason(''); setRejectCatatan(''); setAffirmApproved(false); setSelected(item); }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <ClipboardCheck size={13} /> Tinjau
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: 'var(--sp-6)', color: 'var(--clr-dark-500)' }}>
                      {busy ? 'Memuat data verifikasi...' : 'Belum ada pengajuan verifikasi yang menunggu persetujuan Manager.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: RIWAYAT VERIFIKASI (Disetujui / Ditolak) */}
        {activeTab === 'history' && (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Peralatan</th>
                  <th>Tanggal Verifikasi</th>
                  <th>Kode Aktivitas</th>
                  <th>Status Akhir</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {historyItems.length ? (
                  historyItems.map((item) => (
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
                              : 'badge-gray'
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
                            Tinjau
                          </button>
                          {item.status === 'Disetujui' && (canApprove || isStaffPIC) && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => exportVerificationPdf(item)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              title="Export PDF (TLKM13/F/003)"
                            >
                              <Printer size={13} /> Export PDF
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: 'var(--sp-6)', color: 'var(--clr-dark-500)' }}>
                      {busy ? 'Memuat data verifikasi...' : 'Belum ada riwayat verifikasi yang selesai.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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
                <h2 className="modal-title">Tinjau Verifikasi TLKM13/F/003</h2>
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
                    <span
                      className={`badge ${
                        selected.status === 'Disetujui'
                          ? 'badge-aktif'
                          : selected.status === 'Ditolak'
                          ? 'badge-rusak'
                          : 'badge-kalibrasi'
                      }`}
                    >
                      {selected.status || '-'}
                    </span>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                <SignatureDisplayCard
                  title="Tanda Tangan PIC Penguji"
                  roleLabel="Staff PIC Penguji"
                  signature={selected.pic_signature}
                  signerName={selected.pic_user?.nama_lengkap || selected.pic?.nama_lengkap || selected.pic?.nama || '-'}
                  signerNip={selected.pic_user?.nip ? `NIP: ${selected.pic_user.nip}` : (selected.pic_user?.username ? `@${selected.pic_user.username}` : null)}
                  signedAt={selected.pic_signed_at || selected.tanggal_verifikasi}
                />
                <SignatureDisplayCard
                  title="Persetujuan Manager"
                  roleLabel="Manager Laboratorium"
                  signature={selected.manager_signature}
                  signerName={selected.verified_by_user?.nama_lengkap || selected.manager?.nama_lengkap || (selected.status === 'Disetujui' ? 'Manager Lab' : '-')}
                  signerNip={selected.verified_by_user?.nip ? `NIP: ${selected.verified_by_user.nip}` : (selected.verified_by_user?.username ? `@${selected.verified_by_user.username}` : null)}
                  signedAt={selected.manager_signed_at || selected.verified_at}
                />
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

              {/* Form Persetujuan Manager — inline di dalam modal tinjau */}
              {canApprove && selected.status === 'Diajukan' && (
                <div style={{ marginTop: 'var(--sp-5)', borderTop: '2px solid var(--clr-dark-200)', paddingTop: 'var(--sp-4)' }}>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileCheck size={16} style={{ color: 'var(--clr-primary-500)' }} />
                    Keputusan Manager
                  </h3>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--sp-4)' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${approvalMode === 'approve' ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setApprovalMode('approve')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <CheckCircle2 size={14} /> Setujui
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${approvalMode === 'reject' ? 'btn-ghost' : 'btn-ghost'}`}
                      onClick={() => setApprovalMode('reject')}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: approvalMode === 'reject' ? 'var(--clr-error-500, #ef4444)' : undefined }}
                    >
                      <XCircle size={14} /> Tolak
                    </button>
                  </div>

                  {approvalMode === 'approve' ? (
                    <div>
                      <DigitalSignaturePad
                        value={managerSignature}
                        onChange={setManagerSignature}
                        label="Tanda Tangan Digital Manager"
                      />
                      <div
                        style={{
                          marginTop: 'var(--sp-3)',
                          padding: 'var(--sp-3)',
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 'var(--text-xs)' }}>
                          <input
                            type="checkbox"
                            checked={affirmApproved}
                            onChange={(e) => setAffirmApproved(e.target.checked)}
                            style={{ marginTop: 2, flexShrink: 0 }}
                          />
                          <span>
                            Saya menyatakan peralatan ini <strong>telah memenuhi seluruh kriteria kelayakan</strong> sesuai prosedur TLKM13/F/003 dan persetujuan ini sah secara sistem.
                          </span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="form-group">
                        <label className="form-label">Alasan Penolakan <span style={{ color: 'red' }}>*</span></label>
                        <textarea
                          className="form-textarea"
                          rows={3}
                          placeholder="Tuliskan aspek yang belum memenuhi kriteria..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Catatan Tindak Lanjut</label>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          placeholder="Instruksi perbaikan untuk PIC (opsional)..."
                          value={rejectCatatan}
                          onChange={(e) => setRejectCatatan(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {canApprove && selected.status === 'Diajukan' && (
                approvalMode === 'approve' ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busy || !managerSignature?.trim() || !affirmApproved}
                    onClick={handleApproveFromModal}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <CheckCircle2 size={15} />
                    {busy ? 'Menyetujui...' : 'Konfirmasi Persetujuan'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={busy || !rejectReason.trim()}
                    onClick={handleRejectFromModal}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--clr-error-500, #ef4444)' }}
                  >
                    <XCircle size={15} />
                    {busy ? 'Menolak...' : 'Konfirmasi Penolakan'}
                  </button>
                )
              )}
              {selected.status === 'Disetujui' && (canApprove || isStaffPIC) && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => exportVerificationPdf(selected)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Printer size={15} /> Export PDF
                </button>
              )}
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

