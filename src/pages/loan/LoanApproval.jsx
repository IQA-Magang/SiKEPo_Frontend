import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Check,
  X,
  Eraser,
  Printer,
  Send,
  AlertTriangle,
  User,
  Package,
  ShieldCheck,
  ArrowRight,
  Search,
  Filter,
  Eye,
  CalendarClock,
  MapPin,
  Sparkles,
  PlusCircle,
  FileCheck,
  ChevronRight,
  Info,
  Building2,
  RefreshCw,
  Award,
} from 'lucide-react';
import { getCurrentUser } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import LoanRequest from './LoanRequest.jsx';

// ============================================================================
// KOMPONEN DIGITAL SIGNATURE PAD (Mengadopsi Poin E Verifikasi)
// ============================================================================
function DigitalSignaturePad({
  value,
  onChange,
  label = 'Tanda Tangan Digital',
  required = true,
  helperText = 'Gunakan mouse, stylus, atau sentuhan layar',
}) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  // Inisialisasi canvas dengan DPI scaling tajam (Retina/HiDPI)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 560;
    const height = 130;

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a';
  }, []);

  // Gambar ulang jika ada data awal
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 560;
    const height = 130;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    if (!value) return undefined;

    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.drawImage(img, 0, 0, width, height);
      ctx.restore();
    };
    img.src = value;

    return () => {
      img.onload = null;
    };
  }, [value]);

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
    } catch { }
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
    } catch { }
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
          <span className="badge badge-success" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#15803d' }}>
            <CheckCircle2 size={12} /> Tanda tangan tercatat
          </span>
        ) : (
          <span className="badge badge-gray" style={{ fontSize: '11px' }}>
            Belum ditandatangani
          </span>
        )}
      </div>

      <div
        className="verification-signature-pad-frame"
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
            bottom: 28,
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
            height: 130,
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
        <span style={{ fontSize: '11px', color: 'var(--clr-dark-400, #94a3b8)' }}>{helperText}</span>
      </div>
    </div>
  );
}

// ============================================================================
// DATA DUMMY MOCK REALISTIS (3 Approval Stages & Scenarios)
// ============================================================================
const INITIAL_LOAN_DATA = [
  {
    id: 'PINJAM-2026-001',
    tanggal_pengajuan: '2026-10-04 09:30',
    peralatan: {
      id: 101,
      nama_peralatan: 'Digital Storage Oscilloscope Keysight',
      nomor_aset: 'TTH-IQA-OSC-001',
      nomor_seri: 'MY58102341',
      merek: 'Keysight',
      tipe: 'DSOX3024T',
      lab_pemilik: 'Lab IQA',
      tgl_jatuh_tempo: '2027-02-15',
    },
    peminjam: {
      nama: 'Rian Pratama',
      nip: '1992031501',
      lab_asal: 'Lab IQA',
      operator: 'Rian Pratama (Peminjam Sendiri)',
    },
    tujuan_penggunaan: 'Pengujian respon transien filter frekuensi dan analisis sinyal risetime.',
    nomor_spk: 'SPK/TTH/2026/10/012',
    lokasi_penggunaan: 'Lab IQA',
    is_eksternal: false,
    rencana_tanggal_keluar: '2026-10-07',
    rencana_tanggal_kembali: '2026-10-10',
    kelengkapan: '2 unit probe pasif 500MHz, kabel daya, manual book',
    status: 'MENUNGGU_MANAGER_PEMINJAM', // Tahap 1
    // Approval 1: Manager Peminjam
    approval_manager_peminjam: {
      nama: 'Manager Lab DES',
      nip: '1975081201',
      status: 'pending', // pending | approved | rejected
      tanggal: null,
      catatan: '',
      ttd: null,
    },
    // Approval 2: Pengelola Peralatan
    approval_pengelola: {
      nama: 'Ahmad Fauzi, S.T.',
      nip: '1988042202',
      status: 'pending',
      tanggal: null,
      catatan: '',
      ttd: null,
      cek_spesifikasi: false,
      cek_operator: false,
      cek_ketersediaan: false,
    },
    // Approval 3: Manager Lab Pemilik
    approval_manager_lab: {
      nama: 'Manager Lab IQA',
      nip: '1978021901',
      status: 'pending',
      tanggal: null,
      catatan: '',
      ttd: null,
    },
  },
  {
    id: 'PINJAM-2026-002',
    tanggal_pengajuan: '2026-10-04 14:15',
    peralatan: {
      id: 102,
      nama_peralatan: 'Handheld Spectrum Analyzer R&S',
      nomor_aset: 'TTH-SSA-SPEC-003',
      nomor_seri: 'RS-FPH-10928',
      merek: 'Rohde & Schwarz',
      tipe: 'Spectrum Rider FPH',
      lab_pemilik: 'Lab SSA',
      tgl_jatuh_tempo: '2026-12-20',
    },
    peminjam: {
      nama: 'Siti Aminah',
      nip: '1994052003',
      lab_asal: 'Lab DES',
      operator: 'Siti Aminah',
    },
    tujuan_penggunaan: 'Verifikasi spektrum emisi radiasi tidak diinginkan modul LoRa Gateway.',
    nomor_spk: 'SPK-UJI-LORA-88',
    lokasi_penggunaan: 'Lab IQA',
    is_eksternal: false,
    rencana_tanggal_keluar: '2026-10-08',
    rencana_tanggal_kembali: '2026-10-12',
    kelengkapan: 'Antena teleskopik, adaptor DC, attenuator 20dB',
    status: 'MENUNGGU_PENGELOLA', // Tahap 2
    approval_manager_peminjam: {
      nama: 'Manager Lab SSA',
      nip: '1981011502',
      status: 'approved',
      tanggal: '2026-10-04 16:30',
      catatan: 'Disetujui. Pastikan operator mengikuti SOP penggunaan spektrum analyzer.',
      ttd: 'data:image/png;base64,mockSign1',
    },
    approval_pengelola: {
      nama: 'Bambang Sutrisno, S.T.',
      nip: '1986071401',
      status: 'pending',
      tanggal: null,
      catatan: '',
      ttd: null,
      cek_spesifikasi: true,
      cek_operator: true,
      cek_ketersediaan: true,
    },
    approval_manager_lab: {
      nama: 'Manager Lab TIM',
      nip: '1979061803',
      status: 'pending',
      tanggal: null,
      catatan: '',
      ttd: null,
    },
  },
  {
    id: 'PINJAM-2026-003',
    tanggal_pengajuan: '2026-10-05 08:20',
    peralatan: {
      id: 103,
      nama_peralatan: 'RF Power Sensor & Power Meter Keysight',
      nomor_aset: 'TTH-TIM-PWR-005',
      nomor_seri: 'MY45129984',
      merek: 'Keysight',
      tipe: 'N1913A / E9304A',
      lab_pemilik: 'TIM',
      tgl_jatuh_tempo: '2027-01-10',
    },
    peminjam: {
      nama: 'Budi Santoso',
      nip: '1991090802',
      lab_asal: 'Lab SSA',
      operator: 'Budi Santoso & Tim Pengujian Lapangan',
    },
    tujuan_penggunaan: 'Pengukuran daya pancar RF BTS Telkomsel Outdoor dalam rangka verifikasi izin spektrum frekuensi radio.',
    nomor_spk: 'SPK-EXT-TELKOMSEL-2026',
    lokasi_penggunaan: 'Site BTS Telkomsel Kawasan Cikutra Bandung (Luar Lingkungan TTH)',
    is_eksternal: true, // EKSTERNAL! Wajib F/006
    rencana_tanggal_keluar: '2026-10-09',
    rencana_tanggal_kembali: '2026-10-14',
    kelengkapan: 'Hardcase pelindung shockproof, power sensor head, kabel GPIB/USB, adaptor charger mobil',
    status: 'MENUNGGU_MANAGER_LAB', // Tahap 3
    approval_manager_peminjam: {
      nama: 'Manager Lab SSA',
      nip: '1981011502',
      status: 'approved',
      tanggal: '2026-10-05 09:00',
      catatan: 'Pengujian resmi lapangan BTS pelanggan Telkomsel. Disetujui dibawa ke luar kantor.',
      ttd: 'data:image/png;base64,mockSign2',
    },
    approval_pengelola: {
      nama: 'Sony Hartono, S.T.',
      nip: '1989021104',
      status: 'approved',
      tanggal: '2026-10-05 11:20',
      catatan: 'Peralatan telah dicek fungsi swauji. Baterai sehat. Dokumen sertifikat kalibrasi terlampir.',
      ttd: 'data:image/png;base64,mockSign3',
      cek_spesifikasi: true,
      cek_operator: true,
      cek_ketersediaan: true,
    },
    approval_manager_lab: {
      nama: 'Manager Lab IQA',
      nip: '1978021901',
      status: 'pending',
      tanggal: null,
      catatan: '',
      ttd: null,
    },
  },
  {
    id: 'PINJAM-2026-004',
    tanggal_pengajuan: '2026-10-03 11:00',
    peralatan: {
      id: 104,
      nama_peralatan: 'Optical Time Domain Reflectometer (OTDR)',
      nomor_aset: 'TTH-IQA-OTDR-002',
      nomor_seri: 'EXFO-FTB-720',
      merek: 'EXFO',
      tipe: 'FTB-1v2 / FTB-720C',
      lab_pemilik: 'Lab IQA',
      tgl_jatuh_tempo: '2026-11-30',
    },
    peminjam: {
      nama: 'Doni Setiawan',
      nip: '1993112401',
      lab_asal: 'TIM',
      operator: 'Doni Setiawan',
    },
    tujuan_penggunaan: 'Uji atenuasi sambungan serat optik OSP jalur Bandung-Cimahi.',
    nomor_spk: 'SPK-OSP-099',
    lokasi_penggunaan: 'Lab IQA',
    is_eksternal: false,
    rencana_tanggal_keluar: '2026-10-05',
    rencana_tanggal_kembali: '2026-10-08',
    kelengkapan: 'Launch cable 1km FC-UPC, optical connector cleaner, adaptor AC',
    status: 'DISETUJUI', // Selesai Approval 3 Tingkat
    approval_manager_peminjam: {
      nama: 'Manager Lab TIM',
      nip: '1979061803',
      status: 'approved',
      tanggal: '2026-10-03 13:00',
      catatan: 'Disetujui untuk pengujian sambungan serat optik.',
      ttd: 'data:image/png;base64,mockSign1',
    },
    approval_pengelola: {
      nama: 'Irfan Maulana, S.T.',
      nip: '1987100502',
      status: 'approved',
      tanggal: '2026-10-03 14:40',
      catatan: 'Kelengkapan siap. Konektor bersih tertutup pelindung.',
      ttd: 'data:image/png;base64,mockSign3',
      cek_spesifikasi: true,
      cek_operator: true,
      cek_ketersediaan: true,
    },
    approval_manager_lab: {
      nama: 'Manager Lab TIM',
      nip: '1979061803',
      status: 'approved',
      tanggal: '2026-10-03 16:10',
      catatan: 'Persetujuan akhir diberikan. Siap serah terima keluar Lampiran A.',
      ttd: 'data:image/png;base64,mockSign2',
    },
  },
];

// Badge status peminjaman
const STATUS_META = {
  MENUNGGU_MANAGER_PEMINJAM: {
    label: 'Tahap 1: Menunggu Atasan Peminjam',
    badgeClass: 'badge-warning',
    color: '#d97706',
    bg: '#fef3c7',
  },
  MENUNGGU_PENGELOLA: {
    label: 'Tahap 2: Menunggu Review Pengelola',
    badgeClass: 'badge-info',
    color: '#0284c7',
    bg: '#e0f2fe',
  },
  MENUNGGU_MANAGER_LAB: {
    label: 'Tahap 3: Menunggu Manager Lab Pemilik',
    badgeClass: 'badge-purple',
    color: '#7c3aed',
    bg: '#f3e8ff',
  },
  DISETUJUI: {
    label: 'Disetujui (Siap Serah Terima Keluar)',
    badgeClass: 'badge-success',
    color: '#16a34a',
    bg: '#dcfce7',
  },
  DITOLAK: {
    label: 'Ditolak',
    badgeClass: 'badge-error',
    color: '#dc2626',
    bg: '#fee2e2',
  },
};

export default function LoanApproval({ onNavigate }) {
  const { success, error: toastError, info } = useToast();
  const currentUser = getCurrentUser();

  // State Daftar Peminjaman
  const [loans, setLoans] = useState(INITIAL_LOAN_DATA);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'fixed_form' | 'create_form'

  // SIMULATOR PERAN / PERSPECTIVE SWITCHER
  // Memungkinkan user berganti kacamata peran dengan 1 klik untuk demo & testing
  const [activeRolePerspective, setActiveRolePerspective] = useState('manager_peminjam');
  // 'peminjam' | 'manager_peminjam' | 'pengelola' | 'manager_lab'

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('SEMUA');

  // Form State untuk Tindakan Approval saat Modal terbuka
  const [decisionAction, setDecisionAction] = useState('setuju'); // 'setuju' | 'tolak'
  const [decisionNote, setDecisionNote] = useState('');
  const [digitalSignature, setDigitalSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checkbox verifikasi teknis khusus Pengelola Peralatan
  const [techChecks, setTechChecks] = useState({
    spesifikasi: true,
    operator: true,
    ketersediaan: true,
    eksternal_ready: true,
  });

  // Filter data sesuai role perspective & filter bar
  const filteredLoans = loans.filter((item) => {
    // Filter Pencarian
    const q = searchQuery.toLowerCase();
    const matchSearch =
      item.id.toLowerCase().includes(q) ||
      item.peralatan.nama_peralatan.toLowerCase().includes(q) ||
      item.peralatan.nomor_aset.toLowerCase().includes(q) ||
      item.peminjam.nama.toLowerCase().includes(q);

    if (!matchSearch) return false;

    // Filter Status Khusus
    if (statusFilter === 'MENUNGGU_SAYA') {
      if (activeRolePerspective === 'manager_peminjam') return item.status === 'MENUNGGU_MANAGER_PEMINJAM';
      if (activeRolePerspective === 'pengelola') return item.status === 'MENUNGGU_PENGELOLA';
      if (activeRolePerspective === 'manager_lab') return item.status === 'MENUNGGU_MANAGER_LAB';
      return item.status !== 'DISETUJUI' && item.status !== 'DITOLAK';
    }
    if (statusFilter !== 'SEMUA' && item.status !== statusFilter) return false;

    return true;
  });

  // Buka Modal Approval untuk Item Tertentu
  function handleOpenReview(loan) {
    setSelectedLoan(loan);
    setDecisionAction('setuju');
    setDecisionNote('');
    setDigitalSignature('');
    setTechChecks({
      spesifikasi: true,
      operator: true,
      ketersediaan: true,
      eksternal_ready: true,
    });
  }

  // Submit Keputusan Approval
  function handleSubmitDecision(e) {
    e.preventDefault();
    if (!selectedLoan) return;

    if (!digitalSignature && decisionAction === 'setuju') {
      toastError('Tanda tangan digital wajib digoreskan sebelum menyetujui.');
      return;
    }

    if (decisionAction === 'tolak' && !decisionNote.trim()) {
      toastError('Alasan penolakan wajib diisi agar peminjam dapat mengetahui alasannya.');
      return;
    }

    setIsSubmitting(true);

    const nowFormatted = new Date().toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(/\./g, ':');

    // Update state berdasarkan peran yang sedang melakukan approval
    setLoans((prevLoans) =>
      prevLoans.map((item) => {
        if (item.id !== selectedLoan.id) return item;

        const updated = { ...item };

        if (decisionAction === 'tolak') {
          updated.status = 'DITOLAK';
          if (activeRolePerspective === 'manager_peminjam') {
            updated.approval_manager_peminjam = {
              ...updated.approval_manager_peminjam,
              status: 'rejected',
              tanggal: nowFormatted,
              catatan: decisionNote,
              ttd: digitalSignature,
            };
          } else if (activeRolePerspective === 'pengelola') {
            updated.approval_pengelola = {
              ...updated.approval_pengelola,
              status: 'rejected',
              tanggal: nowFormatted,
              catatan: decisionNote,
              ttd: digitalSignature,
            };
          } else if (activeRolePerspective === 'manager_lab') {
            updated.approval_manager_lab = {
              ...updated.approval_manager_lab,
              status: 'rejected',
              tanggal: nowFormatted,
              catatan: decisionNote,
              ttd: digitalSignature,
            };
          }
          return updated;
        }

        // Jika SETUJU / TERUSKAN:
        if (activeRolePerspective === 'manager_peminjam') {
          // Dari Tahap 1 -> Lanjut ke Tahap 2 (Pengelola Peralatan)
          updated.status = 'MENUNGGU_PENGELOLA';
          updated.approval_manager_peminjam = {
            ...updated.approval_manager_peminjam,
            status: 'approved',
            tanggal: nowFormatted,
            catatan: decisionNote || 'Disetujui oleh Atasan Peminjam.',
            ttd: digitalSignature,
          };
        } else if (activeRolePerspective === 'pengelola') {
          // Dari Tahap 2 -> Lanjut ke Tahap 3 (Manager Lab Pemilik)
          updated.status = 'MENUNGGU_MANAGER_LAB';
          updated.approval_pengelola = {
            ...updated.approval_pengelola,
            status: 'approved',
            tanggal: nowFormatted,
            catatan: decisionNote || 'Pemeriksaan teknis & ketersediaan lolos verifikasi.',
            ttd: digitalSignature,
            cek_spesifikasi: techChecks.spesifikasi,
            cek_operator: techChecks.operator,
            cek_ketersediaan: techChecks.ketersediaan,
          };
        } else if (activeRolePerspective === 'manager_lab') {
          // Dari Tahap 3 -> Selesai Disetujui Penuh (Siap Serah Terima Fisik)
          updated.status = 'DISETUJUI';
          updated.approval_manager_lab = {
            ...updated.approval_manager_lab,
            status: 'approved',
            tanggal: nowFormatted,
            catatan: decisionNote || 'Persetujuan akhir disahkan.',
            ttd: digitalSignature,
          };
        }

        return updated;
      })
    );

    setIsSubmitting(false);
    setSelectedLoan(null);
    success(
      decisionAction === 'setuju'
        ? `Persetujuan berhasil disimpan! Tiket peminjaman ${selectedLoan.id} diperbarui.`
        : `Pengajuan peminjaman ${selectedLoan.id} ditolak.`
    );
  }

  // Print Fixed Form
  function handlePrint() {
    window.print();
  }

  return (
    <div className="page-container fade-in-up" style={{ paddingBottom: 'var(--sp-8)' }}>
      {/* ==================================================================== */}
      {/* 1. HEADER HALAMAN & ROLE PERSPECTIVE SWITCHER                        */}
      {/* ==================================================================== */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--sp-4)',
          marginBottom: 'var(--sp-4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title" style={{ margin: 0 }}>Modul Peminjaman & Persetujuan Peralatan</h1>
            <span className="badge badge-purple" style={{ fontSize: '11px', fontWeight: 600 }}>TLKM13/IK/005</span>
          </div>
          <p className="page-subtitle" style={{ marginTop: 4 }}>
            Kelola pengajuan, alur persetujuan 3 tingkat (Atasan ➔ Pengelola ➔ Manager Lab), dan lembar serah terima resmi.
          </p>
        </div>

        {/* Tombol Buat Pengajuan */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className={`btn ${activeTab === 'create_form' ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => setActiveTab(activeTab === 'create_form' ? 'list' : 'create_form')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {activeTab === 'create_form' ? (
              <>
                <ChevronRight size={16} /> Kembali ke Daftar
              </>
            ) : (
              <>
                <PlusCircle size={16} /> Buat Pengajuan Baru
              </>
            )}
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. BILAH SIMULATOR PERAN / PERSPECTIVE SWITCHER                      */}
      {/* ==================================================================== */}
      <div
        className="card"
        style={{
          padding: 'var(--sp-3) var(--sp-4)',
          marginBottom: 'var(--sp-5)',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1.5px solid #cbd5e1',
          borderRadius: 'var(--radius-lg, 12px)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} style={{ color: 'var(--clr-primary-500, #ee2e24)' }} />
            <div>
              <span style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--text-sm)', color: '#0f172a' }}>
                Mode Simulator Peran (Demo & Testing):
              </span>
              <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                Pilih sudut pandang aktor untuk menguji alur approval tanpa perlu gonta-ganti akun.
              </span>
            </div>
          </div>

          {/* Toggle Button Group Peran */}
          <div
            style={{
              display: 'inline-flex',
              background: '#e2e8f0',
              padding: 3,
              borderRadius: 'var(--radius-md, 8px)',
              gap: 3,
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${activeRolePerspective === 'peminjam' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveRolePerspective('peminjam')}
              style={{ fontSize: '12px', padding: '4px 10px', height: 'auto' }}
            >
              Peminjam (Staff)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeRolePerspective === 'manager_peminjam' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveRolePerspective('manager_peminjam')}
              style={{ fontSize: '12px', padding: '4px 10px', height: 'auto' }}
            >
              1. Manager Peminjam
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeRolePerspective === 'pengelola' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveRolePerspective('pengelola')}
              style={{ fontSize: '12px', padding: '4px 10px', height: 'auto' }}
            >
              2. Pengelola Peralatan
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeRolePerspective === 'manager_lab' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveRolePerspective('manager_lab')}
              style={{ fontSize: '12px', padding: '4px 10px', height: 'auto' }}
            >
              3. Manager Lab Pemilik
            </button>
          </div>
        </div>

        {/* Keterangan Tugas Role Aktif */}
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid #e2e8f0',
            fontSize: '12px',
            color: '#334155',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Info size={14} style={{ color: '#0284c7', flexShrink: 0 }} />
          <span>
            {activeRolePerspective === 'peminjam' && (
              <strong>Mode Peminjam:</strong>
            )}
            {activeRolePerspective === 'peminjam' && ' Anda melihat daftar riwayat peminjaman pribadi, status persetujuan berjenjang, dan peralatan yang sedang Anda bawa.'}

            {activeRolePerspective === 'manager_peminjam' && (
              <strong>Wewenang Tahap 1:</strong>
            )}
            {activeRolePerspective === 'manager_peminjam' && ' Sebagai atasan langsung peminjam, Anda memvalidasi kebutuhan dinas dan rencana tanggal peminjaman staf Anda sebelum dikirim ke Pengelola Peralatan.'}

            {activeRolePerspective === 'pengelola' && (
              <strong>Wewenang Tahap 2:</strong>
            )}
            {activeRolePerspective === 'pengelola' && ' Sebagai Pengelola Peralatan, Anda memeriksa kualifikasi operator, spesifikasi teknis, jadwal kalibrasi alat, dan kesiapan lokasi (eksternal) sebelum meneruskan ke Manager Lab.'}

            {activeRolePerspective === 'manager_lab' && (
              <strong>Wewenang Tahap 3 (Final):</strong>
            )}
            {activeRolePerspective === 'manager_lab' && ' Sebagai Manager Lab Pemilik Peralatan, Anda memberikan pengesahan persetujuan final. Jika peminjaman eksternal, sistem akan mengizinkan cetak F/006.'}
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* JIKA MEMILIH TAB: FORM PENGAJUAN BARU (MEMAKAI LOANREQUEST TEMAN)     */}
      {/* ==================================================================== */}
      {activeTab === 'create_form' ? (
        <div style={{ marginTop: 'var(--sp-2)' }}>
          {/* <div
            className="alert alert-info"
            style={{ marginBottom: 'var(--sp-4)', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <Info size={18} />
            <span>
              Formulir di bawah ini terhubung langsung ke komponen form yang dibuat rekan Anda (<code>LoanRequest.jsx</code>).
            </span>
          </div> */}
          <LoanRequest onNavigate={() => setActiveTab('list')} />
        </div>
      ) : (
        <>
          {/* ==================================================================== */}
          {/* 3. KARTU METRIK KPI                                                  */}
          {/* ==================================================================== */}
          <div className="form-grid-4" style={{ marginBottom: 'var(--sp-5)' }}>
            <div className="card" style={{ padding: 'var(--sp-3) var(--sp-4)', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', textTransform: 'uppercase' }}>
                Total Pengajuan
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', marginTop: 4 }}>
                {loans.length}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>Semua riwayat peminjaman</div>
            </div>

            <div className="card" style={{ padding: 'var(--sp-3) var(--sp-4)', borderLeft: '4px solid #d97706' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', textTransform: 'uppercase' }}>
                Menunggu Tahap 1 (Atasan)
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706', marginTop: 4 }}>
                {loans.filter((l) => l.status === 'MENUNGGU_MANAGER_PEMINJAM').length}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>Validasi Manager Peminjam</div>
            </div>

            <div className="card" style={{ padding: 'var(--sp-3) var(--sp-4)', borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', textTransform: 'uppercase' }}>
                Menunggu Tahap 2 (Pengelola)
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0284c7', marginTop: 4 }}>
                {loans.filter((l) => l.status === 'MENUNGGU_PENGELOLA').length}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>Cek teknis & ketersediaan</div>
            </div>

            <div className="card" style={{ padding: 'var(--sp-3) var(--sp-4)', borderLeft: '4px solid #7c3aed' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', textTransform: 'uppercase' }}>
                Menunggu Tahap 3 (Mgr Lab)
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#7c3aed', marginTop: 4 }}>
                {loans.filter((l) => l.status === 'MENUNGGU_MANAGER_LAB').length}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>Persetujuan akhir Manager Lab</div>
            </div>
          </div>

          {/* ==================================================================== */}
          {/* 4. BILAH FILTER & PENCARIAN                                          */}
          {/* ==================================================================== */}
          <div
            className="card card-padded"
            style={{
              marginBottom: 'var(--sp-5)',
              display: 'flex',
              gap: 'var(--sp-3)',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            {/* Input Cari */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 280px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Cari ID tiket, nama alat, no aset, atau peminjam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>

            {/* Filter Status */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Filter size={15} style={{ color: '#64748b' }} />
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: 'auto', minWidth: 200 }}
              >
                <option value="SEMUA">Semua Status</option>
                <option value="MENUNGGU_SAYA">🔥 Menunggu Tindakan Saya (Role Aktif)</option>
                <option value="MENUNGGU_MANAGER_PEMINJAM">Menunggu Atasan Peminjam</option>
                <option value="MENUNGGU_PENGELOLA">Menunggu Pengelola Peralatan</option>
                <option value="MENUNGGU_MANAGER_LAB">Menunggu Manager Lab</option>
                <option value="DISETUJUI">Disetujui (Siap Keluar)</option>
                <option value="DITOLAK">Ditolak</option>
              </select>
            </div>
          </div>

          {/* ==================================================================== */}
          {/* 5. TABEL DAFTAR PEMINJAMAN                                           */}
          {/* ==================================================================== */}
          <div className="card" style={{ overflow: 'hidden', marginBottom: 'var(--sp-5)' }}>
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>No. Tiket & Tanggal</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>Peralatan</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>Peminjam</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>Lokasi & Tipe</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>Periode Pinjam</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>Status Approval</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--sp-6)', color: '#94a3b8' }}>
                        Tidak ada data peminjaman yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((loan) => {
                      const meta = STATUS_META[loan.status] || {
                        label: loan.status,
                        badgeClass: 'badge-gray',
                        color: '#64748b',
                        bg: '#f1f5f9',
                      };

                      // Cek apakah tiket ini sedang menunggu aksi dari peran aktif
                      const isWaitingForMyRole =
                        (activeRolePerspective === 'manager_peminjam' && loan.status === 'MENUNGGU_MANAGER_PEMINJAM') ||
                        (activeRolePerspective === 'pengelola' && loan.status === 'MENUNGGU_PENGELOLA') ||
                        (activeRolePerspective === 'manager_lab' && loan.status === 'MENUNGGU_MANAGER_LAB');

                      return (
                        <tr
                          key={loan.id}
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            background: isWaitingForMyRole ? '#fffbeb' : '#ffffff',
                            transition: 'background 0.2s',
                          }}
                        >
                          {/* 1. ID Tiket */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>{loan.id}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{loan.tanggal_pengajuan}</div>
                          </td>

                          {/* 2. Peralatan */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
                              {loan.peralatan.nama_peralatan}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>
                              No. Aset: <strong>{loan.peralatan.nomor_aset}</strong>
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                              Pemilik: {loan.peralatan.lab_pemilik}
                            </div>
                          </td>

                          {/* 3. Peminjam */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{loan.peminjam.nama}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{loan.peminjam.lab_asal}</div>
                            {loan.peminjam.operator && (
                              <div style={{ fontSize: '10px', color: '#0284c7', marginTop: 2 }}>
                                Op: {loan.peminjam.operator}
                              </div>
                            )}
                          </td>

                          {/* 4. Lokasi & Eksternal */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '12px', color: '#1e293b' }}>{loan.lokasi_penggunaan}</div>
                            <div style={{ marginTop: 4 }}>
                              {loan.is_eksternal ? (
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: '10px',
                                    background: '#fee2e2',
                                    color: '#b91c1c',
                                    border: '1px solid #fecaca',
                                    fontWeight: 600,
                                  }}
                                >
                                  Eksternal (Luar TTH - F/006)
                                </span>
                              ) : (
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: '10px',
                                    background: '#f1f5f9',
                                    color: '#475569',
                                  }}
                                >
                                  Internal TTH
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 5. Periode Pinjam */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: 500 }}>
                              {loan.rencana_tanggal_keluar} s.d {loan.rencana_tanggal_kembali}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>
                              Jatuh tempo kalibrasi: {loan.peralatan.tgl_jatuh_tempo}
                            </div>
                          </td>

                          {/* 6. Status Approval */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                            <span
                              className="badge"
                              style={{
                                fontSize: '11px',
                                background: meta.bg,
                                color: meta.color,
                                border: `1px solid ${meta.color}40`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 8px',
                              }}
                            >
                              <Clock size={12} /> {meta.label}
                            </span>

                            {/* Mini Stepper Indikator 3 Tahap */}
                            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                              <span
                                title="Tahap 1: Manager Peminjam"
                                style={{
                                  width: 18,
                                  height: 6,
                                  borderRadius: 3,
                                  background: loan.approval_manager_peminjam.status === 'approved' ? '#16a34a' : loan.approval_manager_peminjam.status === 'rejected' ? '#dc2626' : '#cbd5e1',
                                }}
                              />
                              <span
                                title="Tahap 2: Pengelola Peralatan"
                                style={{
                                  width: 18,
                                  height: 6,
                                  borderRadius: 3,
                                  background: loan.approval_pengelola.status === 'approved' ? '#16a34a' : loan.approval_pengelola.status === 'rejected' ? '#dc2626' : '#cbd5e1',
                                }}
                              />
                              <span
                                title="Tahap 3: Manager Lab"
                                style={{
                                  width: 18,
                                  height: 6,
                                  borderRadius: 3,
                                  background: loan.approval_manager_lab.status === 'approved' ? '#16a34a' : loan.approval_manager_lab.status === 'rejected' ? '#dc2626' : '#cbd5e1',
                                }}
                              />
                            </div>
                          </td>

                          {/* 7. Tombol Aksi */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'top', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              {isWaitingForMyRole ? (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleOpenReview(loan)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '12px', padding: '4px 10px' }}
                                >
                                  <ShieldCheck size={14} /> Review & TTD
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleOpenReview(loan)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '12px', padding: '4px 10px' }}
                                >
                                  <Eye size={14} /> Detail
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ==================================================================== */}
      {/* 6. MODAL DETAIL & REVIEW APPROVAL DENGAN DIGITAL SIGNATURE PAD       */}
      {/* ==================================================================== */}
      {selectedLoan && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 'var(--sp-4)',
          }}
          onClick={() => setSelectedLoan(null)}
        >
          <div
            className="modal-content card"
            style={{
              width: '100%',
              maxWidth: '850px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: 0,
              background: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: 'var(--sp-4) var(--sp-6)',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>
                    Lembar Persetujuan Peminjaman Peralatan
                  </h2>
                  <span className="badge badge-primary" style={{ fontSize: '11px' }}>
                    {selectedLoan.id}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', marginTop: 3 }}>
                  Format Resmi TLKM13/F/010 — Alur Persetujuan & Serah Terima
                </p>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setSelectedLoan(null)}
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 'var(--sp-6)' }}>
              {/* Stepper Progres Approval */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--sp-5)',
                  padding: 'var(--sp-3) var(--sp-4)',
                  background: '#f1f5f9',
                  borderRadius: 'var(--radius-md, 8px)',
                  fontSize: '11px',
                }}
              >
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>1. Diajukan</div>
                  <div style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ Selesai</div>
                </div>
                <ArrowRight size={14} style={{ color: '#94a3b8' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>2. Manager Peminjam</div>
                  <div
                    style={{
                      fontWeight: 'bold',
                      color: selectedLoan.approval_manager_peminjam.status === 'approved' ? '#16a34a' : '#d97706',
                    }}
                  >
                    {selectedLoan.approval_manager_peminjam.status === 'approved' ? '✓ Disetujui' : 'Menunggu'}
                  </div>
                </div>
                <ArrowRight size={14} style={{ color: '#94a3b8' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>3. Pengelola Peralatan</div>
                  <div
                    style={{
                      fontWeight: 'bold',
                      color: selectedLoan.approval_pengelola.status === 'approved' ? '#16a34a' : '#0284c7',
                    }}
                  >
                    {selectedLoan.approval_pengelola.status === 'approved' ? '✓ Diteruskan' : 'Menunggu'}
                  </div>
                </div>
                <ArrowRight size={14} style={{ color: '#94a3b8' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>4. Manager Lab</div>
                  <div
                    style={{
                      fontWeight: 'bold',
                      color: selectedLoan.approval_manager_lab.status === 'approved' ? '#16a34a' : '#7c3aed',
                    }}
                  >
                    {selectedLoan.approval_manager_lab.status === 'approved' ? '✓ Disahkan' : 'Menunggu'}
                  </div>
                </div>
              </div>

              {/* Rincian Peralatan & Pengajuan */}
              <div
                className="card"
                style={{
                  padding: 'var(--sp-4)',
                  marginBottom: 'var(--sp-5)',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: 12, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Package size={16} style={{ color: 'var(--clr-primary-500)' }} />
                  Informasi Peralatan & Rencana Peminjaman
                </h3>
                <div className="form-grid-2" style={{ fontSize: '13px', rowGap: 8 }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Nama Peralatan:</span>
                    <strong>{selectedLoan.peralatan.nama_peralatan}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Nomor Aset / Seri:</span>
                    <strong>{selectedLoan.peralatan.nomor_aset}</strong> ({selectedLoan.peralatan.nomor_seri})
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Pemilik Peralatan:</span>
                    {selectedLoan.peralatan.lab_pemilik}
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Peminjam & Unit Asal:</span>
                    <strong>{selectedLoan.peminjam.nama}</strong> ({selectedLoan.peminjam.lab_asal})
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Tujuan Penggunaan & No. SPK:</span>
                    {selectedLoan.tujuan_penggunaan}
                    {selectedLoan.nomor_spk && (
                      <span className="badge badge-gray" style={{ marginLeft: 8, fontSize: '11px' }}>
                        SPK: {selectedLoan.nomor_spk}
                      </span>
                    )}
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Lokasi Penggunaan:</span>
                    {selectedLoan.lokasi_penggunaan}
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Sifat Kegiatan:</span>
                    {selectedLoan.is_eksternal ? (
                      <span className="badge badge-error" style={{ fontSize: '11px' }}>
                        Eksternal (Keluar Lingkungan TTH - Butuh F/006)
                      </span>
                    ) : (
                      <span className="badge badge-gray" style={{ fontSize: '11px' }}>
                        Internal Lingkungan TTH
                      </span>
                    )}
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Rencana Tanggal:</span>
                    <strong>{selectedLoan.rencana_tanggal_keluar}</strong> s.d <strong>{selectedLoan.rencana_tanggal_kembali}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Jatuh Tempo Kalibrasi:</span>
                    <span style={{ color: '#15803d', fontWeight: 600 }}>{selectedLoan.peralatan.tgl_jatuh_tempo}</span> (Aman)
                  </div>
                </div>
              </div>

              {/* ================================================================ */}
              {/* LEMBAR FIXED FORM PREVIEW (3 TANDA TANGAN)                       */}
              {/* ================================================================ */}
              <div style={{ marginBottom: 'var(--sp-5)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: 12, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={16} style={{ color: 'var(--clr-primary-500)' }} />
                  Status Lembar Otorisasi & 3 Tanda Tangan (TLKM13/F/010)
                </h3>

                <div
                  style={{
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 'var(--radius-md, 8px)',
                    overflow: 'hidden',
                    background: '#ffffff',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      borderBottom: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                      1. Mengetahui / Menyetujui:<br />
                      <span style={{ fontWeight: 'normal', color: '#64748b' }}>MANAGER PEMINJAM</span>
                    </div>
                    <div style={{ padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                      2. Diperiksa oleh:<br />
                      <span style={{ fontWeight: 'normal', color: '#64748b' }}>PENGELOLA PERALATAN</span>
                    </div>
                    <div style={{ padding: '8px' }}>
                      3. Disahkan oleh:<br />
                      <span style={{ fontWeight: 'normal', color: '#64748b' }}>MANAGER LAB PEMILIK</span>
                    </div>
                  </div>

                  {/* Konten Box Tanda Tangan */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      minHeight: 120,
                      fontSize: '11px',
                    }}
                  >
                    {/* TTD 1: Manager Peminjam */}
                    <div style={{ padding: 10, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{selectedLoan.approval_manager_peminjam.nama}</div>
                        <div style={{ color: '#64748b' }}>NIP: {selectedLoan.approval_manager_peminjam.nip}</div>
                      </div>
                      <div style={{ margin: '8px 0', textAlign: 'center', minHeight: 45, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedLoan.approval_manager_peminjam.ttd ? (
                          <div style={{ borderBottom: '1px dashed #94a3b8', paddingBottom: 2, display: 'inline-block' }}>
                            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '13px' }}>[ TTD DIGITAL TERCATAT ]</span>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>{selectedLoan.approval_manager_peminjam.tanggal}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Belum Disetujui</span>
                        )}
                      </div>
                      <div style={{ color: '#475569', fontSize: '10px' }}>
                        {selectedLoan.approval_manager_peminjam.catatan ? `"${selectedLoan.approval_manager_peminjam.catatan}"` : '-'}
                      </div>
                    </div>

                    {/* TTD 2: Pengelola Peralatan */}
                    <div style={{ padding: 10, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{selectedLoan.approval_pengelola.nama}</div>
                        <div style={{ color: '#64748b' }}>NIP: {selectedLoan.approval_pengelola.nip}</div>
                      </div>
                      <div style={{ margin: '8px 0', textAlign: 'center', minHeight: 45, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedLoan.approval_pengelola.ttd ? (
                          <div style={{ borderBottom: '1px dashed #94a3b8', paddingBottom: 2, display: 'inline-block' }}>
                            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '13px' }}>[ TTD DIGITAL TERCATAT ]</span>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>{selectedLoan.approval_pengelola.tanggal}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Belum Diperiksa</span>
                        )}
                      </div>
                      <div style={{ color: '#475569', fontSize: '10px' }}>
                        {selectedLoan.approval_pengelola.catatan ? `"${selectedLoan.approval_pengelola.catatan}"` : '-'}
                      </div>
                    </div>

                    {/* TTD 3: Manager Lab */}
                    <div style={{ padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{selectedLoan.approval_manager_lab.nama}</div>
                        <div style={{ color: '#64748b' }}>NIP: {selectedLoan.approval_manager_lab.nip}</div>
                      </div>
                      <div style={{ margin: '8px 0', textAlign: 'center', minHeight: 45, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedLoan.approval_manager_lab.ttd ? (
                          <div style={{ borderBottom: '1px dashed #94a3b8', paddingBottom: 2, display: 'inline-block' }}>
                            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '13px' }}>[ TTD DIGITAL TERCATAT ]</span>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>{selectedLoan.approval_manager_lab.tanggal}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Belum Disahkan</span>
                        )}
                      </div>
                      <div style={{ color: '#475569', fontSize: '10px' }}>
                        {selectedLoan.approval_manager_lab.catatan ? `"${selectedLoan.approval_manager_lab.catatan}"` : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================================================================ */}
              {/* FORM AKSI APPROVAL AKTIF (SESUAI PERAN YANG DIPILIH)             */}
              {/* ================================================================ */}
              {activeRolePerspective !== 'peminjam' && (
                <form
                  onSubmit={handleSubmitDecision}
                  style={{
                    border: '2px solid var(--clr-primary-500, #ee2e24)',
                    borderRadius: 'var(--radius-lg, 12px)',
                    padding: 'var(--sp-4)',
                    background: '#fffdfd',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#991b1b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileCheck size={18} />
                      Tindakan Keputusan & Tanda Tangan: {' '}
                      {activeRolePerspective === 'manager_peminjam' && 'Manager Peminjam (Tahap 1)'}
                      {activeRolePerspective === 'pengelola' && 'Pengelola Peralatan (Tahap 2)'}
                      {activeRolePerspective === 'manager_lab' && 'Manager Lab Pemilik (Tahap 3 - Final)'}
                    </h4>
                    <span className="badge badge-error" style={{ fontSize: '11px' }}>
                      Peran Aktif Reviewer
                    </span>
                  </div>

                  {/* Checklist Khusus Pengelola Peralatan */}
                  {activeRolePerspective === 'pengelola' && (
                    <div
                      style={{
                        marginBottom: 'var(--sp-4)',
                        padding: 'var(--sp-3)',
                        background: '#f0fdf4',
                        borderRadius: 'var(--radius-md, 8px)',
                        border: '1px solid #bbf7d0',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: 6, color: '#166534' }}>
                        Daftar Periksa Kesesuaian Teknis (Butir 8.3 IK):
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={techChecks.spesifikasi}
                          onChange={(e) => setTechChecks({ ...techChecks, spesifikasi: e.target.checked })}
                        />
                        <span>Spesifikasi & rentang kerja peralatan sesuai dengan tujuan penggunaan.</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={techChecks.operator}
                          onChange={(e) => setTechChecks({ ...techChecks, operator: e.target.checked })}
                        />
                        <span>Peminjam atau operator berwenang dan kompeten mengoperasikan alat.</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={techChecks.ketersediaan}
                          onChange={(e) => setTechChecks({ ...techChecks, ketersediaan: e.target.checked })}
                        />
                        <span>Jadwal peminjaman tidak bentrok dengan kalibrasi atau agenda SPK lab pemilik.</span>
                      </label>
                    </div>
                  )}

                  {/* Pilihan Keputusan */}
                  <div className="form-group" style={{ marginBottom: 'var(--sp-3)' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Keputusan Persetujuan <span className="required">*</span></label>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="decision"
                          value="setuju"
                          checked={decisionAction === 'setuju'}
                          onChange={() => setDecisionAction('setuju')}
                        />
                        <span style={{ fontWeight: 600, color: '#16a34a' }}>
                          {activeRolePerspective === 'pengelola' ? '✓ Teruskan ke Manager Lab' : '✓ Setujui Permohonan'}
                        </span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="decision"
                          value="tolak"
                          checked={decisionAction === 'tolak'}
                          onChange={() => setDecisionAction('tolak')}
                        />
                        <span style={{ fontWeight: 600, color: '#dc2626' }}>
                          ✕ Tolak Pengajuan
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Catatan Keputusan */}
                  <div className="form-group" style={{ marginBottom: 'var(--sp-3)' }}>
                    <label className="form-label">
                      {decisionAction === 'setuju' ? 'Catatan / Arahan (Opsional)' : 'Alasan Penolakan (Wajib Diisi)'}
                    </label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder={
                        decisionAction === 'setuju'
                          ? 'Catatan pengesahan, instruksi kehati-hatian, atau tindak lanjut...'
                          : 'Uraikan alasan penolakan atau usulan peralatan lain yang dapat digunakan...'
                      }
                      value={decisionNote}
                      onChange={(e) => setDecisionNote(e.target.value)}
                      required={decisionAction === 'tolak'}
                    />
                  </div>

                  {/* Signature Pad */}
                  {decisionAction === 'setuju' && (
                    <DigitalSignaturePad
                      value={digitalSignature}
                      onChange={setDigitalSignature}
                      label={`Tanda Tangan Digital ${activeRolePerspective === 'manager_peminjam'
                        ? 'Manager Peminjam'
                        : activeRolePerspective === 'pengelola'
                          ? 'Pengelola Peralatan'
                          : 'Manager Lab'
                        }`}
                      required
                    />
                  )}

                  {/* Tombol Eksekusi Modal */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 'var(--sp-4)' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setSelectedLoan(null)}>
                      Batal
                    </button>
                    <button
                      type="submit"
                      className={`btn ${decisionAction === 'setuju' ? 'btn-primary' : 'btn-error'}`}
                      disabled={isSubmitting}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Send size={15} />
                      {decisionAction === 'setuju'
                        ? activeRolePerspective === 'pengelola'
                          ? 'Teruskan ke Manager Lab'
                          : 'Simpan Persetujuan & TTD'
                        : 'Konfirmasi Penolakan'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: 'var(--sp-3) var(--sp-6)',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
              }}
            >
              {/* Tombol cetak PDF di-hold sementara
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handlePrint}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={15} /> Cetak Lembar Peminjaman (PDF)
              </button>
              */}

              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedLoan(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
