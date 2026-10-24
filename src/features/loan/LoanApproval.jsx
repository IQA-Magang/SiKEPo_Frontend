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
  AlertOctagon,
  ClipboardCheck,
  Download,
  UserCheck,
  Save,
  FileSignature,
} from 'lucide-react';
import { getCurrentUser, logbookApi, peminjamanApi, peralatanApi, markNotificationsAsReadByRef } from '../../shared/services/api.js';
import { useToast } from '../../app/providers/ToastContext.jsx';
import { exportLoanF006Pdf, exportLoanF006Word } from '../../shared/lib/loanPdf.js';
import LoanRequest from './LoanRequest.jsx';

// ============================================================================
// KOMPONEN DIGITAL SIGNATURE PAD (Mengadopsi Standar SiKEPo)
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
// 7 BUTIR PEMERIKSAAN RESMI TLKM13/F/010 (Lembar Serah Terima Peralatan Versi 01)
// ============================================================================
const LAMPIRAN_A_BUTIR = [
  'Identitas peralatan (nomor aset, nomor seri) sesuai dengan TLKM13/F/001',
  'Label status terpasang, terbaca, dan masih berlaku',
  'Kondisi fisik baik (casing, layar, tombol, konektor/port)',
  'Kelengkapan sesuai daftar',
  'Fungsi dasar normal (menyala, swauji/inisialisasi berhasil)',
  'Pemeriksaan fungsi khusus (bila perlu)',
  'Pemeriksaan fungsi khusus (bila perlu)',
];

// Indeks butir Bagian B F/010 yang boleh bernilai Tidak Berlaku (TB / N/A) sesuai TLKM13/F/010:
// Butir 6 (index 5): Pemeriksaan fungsi khusus (bila perlu)
// Butir 7 (index 6): Pemeriksaan fungsi khusus (bila perlu)
const BOLEH_NA_INDEXES = [5, 6];

// Fallback gambar PNG 1x1 valid untuk membypass validasi backend saat TTD tidak relevan / dibatalkan
const FALLBACK_EMPTY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// ============================================================================
// DATA DUMMY MOCK REALISTIS LENGKAP DENGAN SELURUH SIKLUS HIDUP
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
    approval_manager_peminjam: {
      nama: 'Manager Lab DES',
      nip: '1975081201',
      status: 'pending',
      tanggal: null,
      catatan: '',
      ttd: null,
    },
    approval_pengelola: {
      nama: 'Ahmad Fauzi, S.T.',
      nip: '1988042202',
      status: 'pending',
      tanggal: null,
      catatan: '',
      ttd: null,
      cek_spesifikasi: true,
      cek_operator: true,
      cek_jadwal_kalibrasi: true,
      cek_lokasi: true,
    },
    approval_manager_lab: {
      nama: 'Manager Lab IQA',
      nip: '1978021901',
      status: 'pending',
      tanggal: null,
      catatan: '',
      ttd: null,
    },
    serah_terima_keluar: null,
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
    status: 'MENUNGGU_PENGELOLA', // Tahap 2: Menunggu Review Pengelola
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
      cek_jadwal_kalibrasi: true,
      cek_lokasi: true,
    },
    approval_manager_lab: {
      nama: 'Manager Lab SSA',
      nip: '1979061803',
      status: 'pending',
      tanggal: null,
      catatan: '',
      ttd: null,
    },
    serah_terima_keluar: null,
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
    status: 'MENUNGGU_MANAGER_LAB', // Tahap 3: Menunggu Manager Lab Pemilik
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
      catatan: 'Spesifikasi, kualifikasi operator, dan jadwal aman. Telah diteruskan ke Manager Lab.',
      ttd: 'data:image/png;base64,mockSign3',
      cek_spesifikasi: true,
      cek_operator: true,
      cek_jadwal_kalibrasi: true,
      cek_lokasi: true,
    },
    approval_manager_lab: {
      nama: 'Manager Lab TIM',
      nip: '1978021901',
      status: 'pending',
      tanggal: null,
      catatan: '',
      ttd: null,
    },
    serah_terima_keluar: null,
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
    lokasi_penggunaan: 'Area OSP Bandung-Cimahi (Eksternal TTH)',
    is_eksternal: true,
    rencana_tanggal_keluar: '2026-10-07',
    rencana_tanggal_kembali: '2026-10-09',
    kelengkapan: 'Launch cable 1km FC-UPC, optical connector cleaner, adaptor AC, hardcase',
    status: 'MENUNGGU_SERAH_TERIMA', // Tahap 4: Disetujui Manager Lab, Menunggu Serah Terima Fisik (Lampiran A)
    approval_manager_peminjam: {
      nama: 'Manager Lab TIM',
      nip: '1979061803',
      status: 'approved',
      tanggal: '2026-10-03 13:00',
      catatan: 'Disetujui untuk kegiatan dinas lapangan OSP.',
      ttd: 'data:image/png;base64,mockSign1',
    },
    approval_pengelola: {
      nama: 'Irfan Maulana, S.T.',
      nip: '1987100502',
      status: 'approved',
      tanggal: '2026-10-03 14:40',
      catatan: 'Spesifikasi & operator valid. Diteruskan ke Manager Lab.',
      ttd: 'data:image/png;base64,mockSign3',
      cek_spesifikasi: true,
      cek_operator: true,
      cek_jadwal_kalibrasi: true,
      cek_lokasi: true,
    },
    approval_manager_lab: {
      nama: 'Manager Lab IQA',
      nip: '1978021901',
      status: 'approved',
      tanggal: '2026-10-03 16:10',
      catatan: 'Persetujuan akhir disahkan. Lanjutkan ke serah terima fisik keluar bersama peminjam.',
      ttd: 'data:image/png;base64,mockSign2',
    },
    serah_terima_keluar: null,
  },
  {
    id: 'PINJAM-2026-005',
    tanggal_pengajuan: '2026-10-01 10:00',
    peralatan: {
      id: 105,
      nama_peralatan: 'Precision Thermal Imager Fluke Ti480',
      nomor_aset: 'TTH-DES-THM-001',
      nomor_seri: 'FLK-TI480-8812',
      merek: 'Fluke',
      tipe: 'Ti480 PRO',
      lab_pemilik: 'Lab DES',
      tgl_jatuh_tempo: '2027-04-10',
    },
    peminjam: {
      nama: 'Rian Pratama',
      nip: '1992031501',
      lab_asal: 'Lab IQA',
      operator: 'Rian Pratama',
    },
    tujuan_penggunaan: 'Termografi panel distribusi catu daya laboratorium.',
    nomor_spk: 'SPK-MAINT-PWR-01',
    lokasi_penggunaan: 'Ruang Catu Daya Lab DES & IQA',
    is_eksternal: false,
    rencana_tanggal_keluar: '2026-10-02',
    rencana_tanggal_kembali: '2026-10-06',
    kelengkapan: 'Tas softcase, 2 baterai smart Li-ion, dock charger, tali gantung',
    status: 'SEDANG_DIPINJAM', // Serah Terima Keluar Selesai (Semua S)
    approval_manager_peminjam: {
      nama: 'Manager Lab IQA',
      nip: '1978021901',
      status: 'approved',
      tanggal: '2026-10-01 11:30',
      catatan: 'Disetujui untuk pemeliharaan rutin.',
      ttd: 'data:image/png;base64,mockSign1',
    },
    approval_pengelola: {
      nama: 'Ahmad Fauzi, S.T.',
      nip: '1988042202',
      status: 'approved',
      tanggal: '2026-10-01 13:10',
      catatan: 'Kondisi alat layak & siap digunakan.',
      ttd: 'data:image/png;base64,mockSign3',
      cek_spesifikasi: true,
      cek_operator: true,
      cek_jadwal_kalibrasi: true,
      cek_lokasi: true,
    },
    approval_manager_lab: {
      nama: 'Manager Lab DES',
      nip: '1975081201',
      status: 'approved',
      tanggal: '2026-10-01 15:00',
      catatan: 'Persetujuan diberikan.',
      ttd: 'data:image/png;base64,mockSign2',
    },
    serah_terima_keluar: {
      tanggal: '2026-10-02 08:45',
      pic_petugas: 'Ahmad Fauzi, S.T.',
      peminjam_penerima: 'Rian Pratama',
      lampiran_a: Array.from({ length: 7 }, (_, idx) => ({
        status: BOLEH_NA_INDEXES.includes(idx) ? 'TB' : 'S',
        keterangan: '',
      })),
      ada_ts: false,
      ttd_pengelola: 'data:image/png;base64,mockSign3',
      ttd_peminjam: 'data:image/png;base64,mockSign1',
      catatan: 'Peralatan diserahkan lengkap dan dalam kondisi prima.',
      f006_nomor: null,
    },
  },
  {
    id: 'PINJAM-2026-006',
    tanggal_pengajuan: '2026-09-28 13:40',
    peralatan: {
      id: 106,
      nama_peralatan: 'Sound Level Meter B&K 2250',
      nomor_aset: 'TTH-SSA-SLM-002',
      nomor_seri: 'BK-2250-9941',
      merek: 'Bruel & Kjaer',
      tipe: 'Type 2250 Hand-held Analyzer',
      lab_pemilik: 'Lab SSA',
      tgl_jatuh_tempo: '2026-12-01',
    },
    peminjam: {
      nama: 'Budi Santoso',
      nip: '1991090802',
      lab_asal: 'Lab SSA',
      operator: 'Budi Santoso',
    },
    tujuan_penggunaan: 'Uji tingkat kebisingan lingkungan outdoor generator TTH.',
    nomor_spk: 'SPK-ENV-NOISE-05',
    lokasi_penggunaan: 'Area Generator TTH',
    is_eksternal: false,
    rencana_tanggal_keluar: '2026-09-29',
    rencana_tanggal_kembali: '2026-10-01',
    kelengkapan: 'Mikrofon free-field, windscreen bola busa, tripod adaptor, baterai',
    status: 'DIBATALKAN_TS', // Ada TS saat serah terima -> Batal & alat DO_NOT_USE!
    approval_manager_peminjam: {
      nama: 'Manager Lab SSA',
      nip: '1981011502',
      status: 'approved',
      tanggal: '2026-09-28 14:00',
      catatan: 'Disetujui.',
      ttd: 'data:image/png;base64,mockSign2',
    },
    approval_pengelola: {
      nama: 'Sony Hartono, S.T.',
      nip: '1989021104',
      status: 'approved',
      tanggal: '2026-09-28 15:30',
      catatan: 'Diteruskan ke Manager Lab.',
      ttd: 'data:image/png;base64,mockSign3',
      cek_spesifikasi: true,
      cek_operator: true,
      cek_jadwal_kalibrasi: true,
      cek_lokasi: true,
    },
    approval_manager_lab: {
      nama: 'Manager Lab SSA',
      nip: '1979061803',
      status: 'approved',
      tanggal: '2026-09-28 16:45',
      catatan: 'Persetujuan disahkan.',
      ttd: 'data:image/png;base64,mockSign1',
    },
    serah_terima_keluar: {
      tanggal: '2026-09-29 09:15',
      pic_petugas: 'Sony Hartono, S.T.',
      peminjam_penerima: 'Budi Santoso',
      lampiran_a: [
        { status: 'S', keterangan: '' },
        { status: 'S', keterangan: '' },
        { status: 'S', keterangan: '' },
        { status: 'S', keterangan: '' },
        { status: 'TS', keterangan: 'Saat swauji unit gagal boot, timbul pesan error korelasi sensor mikrofon.' },
        { status: 'TB', keterangan: '' },
        { status: 'TB', keterangan: '' },
      ],
      ada_ts: true,
      ttd_pengelola: 'data:image/png;base64,mockSign3',
      ttd_peminjam: 'data:image/png;base64,mockSign2',
      catatan: 'Pemeriksaan menemukan butir 5 gagal fungsi dasar. Penyerahan dibatalkan dan alat diisolasi dengan penanda DO NOT USE.',
      f006_nomor: null,
    },
  },
  {
    id: 'PINJAM-2026-007',
    tanggal_pengajuan: '2026-09-20 09:00',
    peralatan: {
      id: 107,
      nama_peralatan: 'Digital Multimeter Keysight 34461A',
      nomor_aset: 'TTH-DES-DMM-001',
      nomor_seri: 'MY53210045',
      merek: 'Keysight',
      tipe: '34461A 6½ Digit',
      lab_pemilik: 'Lab DES',
      tgl_jatuh_tempo: '2027-01-15',
    },
    peminjam: {
      nama: 'Siti Aminah',
      nip: '1994052003',
      lab_asal: 'Lab DES',
      operator: 'Siti Aminah',
    },
    tujuan_penggunaan: 'Pengukuran tegangan referensi presisi rangkaian sensor IoT.',
    nomor_spk: 'SPK-UJI-IOT-09',
    lokasi_penggunaan: 'Lab DES',
    is_eksternal: false,
    rencana_tanggal_keluar: '2026-09-21',
    rencana_tanggal_kembali: '2026-09-25',
    kelengkapan: 'Test leads probe set, kabel daya AC, USB cable',
    status: 'DIKEMBALIKAN', // Siklus hidup lengkap F/010 selesai
    approval_manager_peminjam: {
      nama: 'Manager Lab DES',
      nip: '1975081201',
      status: 'approved',
      tanggal: '2026-09-20 10:15',
      catatan: 'Disetujui.',
      ttd: 'data:image/png;base64,mockSign1',
    },
    approval_pengelola: {
      nama: 'Ahmad Fauzi, S.T.',
      nip: '1988042202',
      status: 'approved',
      tanggal: '2026-09-20 11:30',
      catatan: 'Diteruskan ke Manager Lab.',
      ttd: 'data:image/png;base64,mockSign3',
      cek_spesifikasi: true,
      cek_operator: true,
      cek_jadwal_kalibrasi: true,
      cek_lokasi: true,
    },
    approval_manager_lab: {
      nama: 'Manager Lab DES',
      nip: '1975081201',
      status: 'approved',
      tanggal: '2026-09-20 13:00',
      catatan: 'Persetujuan disahkan.',
      ttd: 'data:image/png;base64,mockSign2',
    },
    serah_terima_keluar: {
      tanggal: '2026-09-21 08:30',
      pic_petugas: 'Ahmad Fauzi, S.T.',
      peminjam_penerima: 'Siti Aminah',
      lampiran_a: [
        { status: 'S', keterangan: '' },
        { status: 'S', keterangan: '' },
        { status: 'S', keterangan: '' },
        { status: 'S', keterangan: 'Lengkap test leads + kabel daya' },
        { status: 'S', keterangan: '' },
        { status: 'TB', keterangan: '' },
        { status: 'TB', keterangan: '' },
      ],
      ada_ts: false,
      ttd_pengelola: 'data:image/png;base64,mockSign3',
      ttd_peminjam: 'data:image/png;base64,mockSign1',
      catatan: 'Peralatan diserahkan dalam kondisi baik dan lengkap.',
      f006_nomor: null,
    },
    serah_terima_kembali: {
      tanggal: '2026-09-25 14:20',
      pic_penerima: 'Ahmad Fauzi, S.T.',
      peminjam_penyerah: 'Siti Aminah',
      ada_kejadian: false,
      uraian_kejadian: '',
      ada_ts: false,
      tindak_lanjut: 'PERLU_VERIFIKASI',
      alasan_tindak_lanjut: 'Semua butir sesuai; masuk status Karantina untuk verifikasi ulang IK/003',
      catatan: 'Alat dikembalikan bersih dan seluruh aksesori lengkap.',
      lampiran_a: [
        { nomor_butir: 1, butir: 'Identitas peralatan sesuai TLKM13/F/001', status_keluar: 'S', status: 'S', keterangan: '' },
        { nomor_butir: 2, butir: 'Label status terpasang, terbaca, dan masih berlaku', status_keluar: 'S', status: 'S', keterangan: '' },
        { nomor_butir: 3, butir: 'Kondisi fisik baik (casing, layar, tombol, konektor/port)', status_keluar: 'S', status: 'S', keterangan: '' },
        { nomor_butir: 4, butir: 'Kelengkapan sesuai daftar', status_keluar: 'S', status: 'S', keterangan: 'Lengkap' },
        { nomor_butir: 5, butir: 'Fungsi dasar normal (swauji berhasil)', status_keluar: 'S', status: 'S', keterangan: '' },
        { nomor_butir: 6, butir: 'Pemeriksaan fungsi khusus (bila perlu)', status_keluar: 'TB', status: 'TB', keterangan: '' },
        { nomor_butir: 7, butir: 'Pemeriksaan fungsi khusus (bila perlu)', status_keluar: 'TB', status: 'TB', keterangan: '' },
      ],
      ttd_pengelola: 'data:image/png;base64,mockSign3',
      ttd_peminjam: 'data:image/png;base64,mockSign1',
    },
  },
];

// Badge status peminjaman (Sesuai Alur 4 Tahap + Life Cycle Selesai)
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
  MENUNGGU_SERAH_TERIMA: {
    label: 'Tahap 4A: Disetujui (Pemeriksaan Pengelola)',
    badgeClass: 'badge-warning',
    color: '#ea580c',
    bg: '#fff7ed',
  },
  DISETUJUI: {
    label: 'Tahap 4A: Disetujui (Pemeriksaan Pengelola)',
    badgeClass: 'badge-warning',
    color: '#ea580c',
    bg: '#fff7ed',
  },
  SIAP_DISERAHKAN: {
    label: 'Tahap 4B: Siap Diserahkan (Menunggu TTD Peminjam)',
    badgeClass: 'badge-info',
    color: '#0284c7',
    bg: '#e0f2fe',
  },
  SEDANG_DIPINJAM: {
    label: 'Sedang Dipinjam (Alat Diserahkan)',
    badgeClass: 'badge-success',
    color: '#16a34a',
    bg: '#dcfce7',
  },
  DIKEMBALIKAN: {
    label: 'Dikembalikan',
    badgeClass: 'badge-success',
    color: '#059669',
    bg: '#d1fae5',
  },
  DIBATALKAN_TS: {
    label: 'Dibatalkan (Ada TS - DO NOT USE)',
    badgeClass: 'badge-error',
    color: '#b91c1c',
    bg: '#fee2e2',
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
  const currentUserId = Number(currentUser?.user_id ?? currentUser?.id ?? 0);
  const currentUserRole = currentUser?.role || 'staff';
  const currentUserLabId = Number(currentUser?.labs_id ?? currentUser?.lab_id ?? 0);

  // State Utama
  const [loans, setLoans] = useState([]);
  const [isLoansLoading, setIsLoansLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create_form'

  // MODAL MODE:
  // 'review': Untuk Tahap 1, Tahap 2 (Review Teknis), dan Tahap 3 (Approval Manager Lab)
  // 'checkout': Untuk Tahap 4 (Serah Terima Fisik Keluar - Lampiran A bersama Peminjam)
  // 'detail': Hanya melihat riwayat lengkap
  const [modalMode, setModalMode] = useState('review');

  // Tahap review aktif saat modal dibuka (ditentukan otomatis sesuai tiket yang direview)
  const [activeReviewStage, setActiveReviewStage] = useState('pengelola');
  // 'manager_peminjam' | 'pengelola' | 'manager_lab'

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('SEMUA');
  const [roleFilter, setRoleFilter] = useState('SEMUA');
  // 'SEMUA' | 'peminjam' | 'pengelola' | 'manajer_peminjam' | 'manager_lab'

  // Form State untuk Tindakan Approval Review (Tahap 1, 2, 3)
  const [decisionAction, setDecisionAction] = useState('setuju'); // 'setuju' | 'tolak'
  const [decisionNote, setDecisionNote] = useState('');
  const [digitalSignature, setDigitalSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alternativeEquipmentId, setAlternativeEquipmentId] = useState('');
  const [equipmentList, setEquipmentList] = useState([]);

  // Form State untuk Verifikasi Teknis Pengelola di Tahap 2:
  const [techCheckSpec, setTechCheckSpec] = useState(true);
  const [techCheckOperator, setTechCheckOperator] = useState(true);
  const [techCheckSchedule, setTechCheckSchedule] = useState(true);
  const [techCheckLocation, setTechCheckLocation] = useState(true);

  // Form State untuk Serah Terima Fisik Keluar (Tahap 4: F/010)
  const [checkoutChecks, setCheckoutChecks] = useState(
    Array.from({ length: 7 }, () => ({ status: 'S', keterangan: '' }))
  );
  const [checkoutNote, setCheckoutNote] = useState('');
  const [checkoutSigPengelola, setCheckoutSigPengelola] = useState('');
  const [checkoutSigPeminjam, setCheckoutSigPeminjam] = useState('');
  // Step serah terima fisik (Tahap 4): 'pengelola' (Langkah 4A: Lampiran A) | 'peminjam' (Langkah 4B: Konfirmasi Terima)
  const [checkoutStep, setCheckoutStep] = useState('pengelola');

  // Form State untuk Pengembalian (Kolom Kembali & Bagian D F/010)
  const [returnChecks, setReturnChecks] = useState(
    Array.from({ length: 7 }, () => ({ status: 'S', keterangan: '' }))
  );
  const [adaKejadian, setAdaKejadian] = useState(false);
  const [uraianKejadian, setUraianKejadian] = useState('');
  const [returnCatatan, setReturnCatatan] = useState('');
  const [returnSigPengelola, setReturnSigPengelola] = useState('');
  const [returnSigPeminjam, setReturnSigPeminjam] = useState('');
  const [showDirectPeminjamSigPad, setShowDirectPeminjamSigPad] = useState(false);

  // Form State untuk Perpanjangan Peminjaman (Peminjam)
  const [extensionNewDate, setExtensionNewDate] = useState('');
  const [extensionReason, setExtensionReason] = useState('');
  const [isExtensionSubmitting, setIsExtensionSubmitting] = useState(false);

  // Form State untuk Pengesahan Perpanjangan (Manager Lab)
  const [extensionDecisionAction, setExtensionDecisionAction] = useState('setuju'); // 'setuju' | 'tolak'
  const [extensionDecisionNote, setExtensionDecisionNote] = useState('');
  const [extensionDecisionSig, setExtensionDecisionSig] = useState('');
  const [isExtensionDecisionSubmitting, setIsExtensionDecisionSubmitting] = useState(false);

  // State Logbook Peralatan Riil (GET /api/peralatan/:id/logbook)
  const [logbookData, setLogbookData] = useState([]);
  const [isLogbookLoading, setIsLogbookLoading] = useState(false);
  const [logbookError, setLogbookError] = useState(null);

  // Refs untuk navigasi langsung ke form tanpa scroll manual
  const decisionFormRef = useRef(null);
  const modalContentRef = useRef(null);
  const checkoutModalRef = useRef(null);
  const checkoutPengelolaRef = useRef(null);
  const checkoutBottomRef = useRef(null);
  const checkoutSigRef = useRef(null);
  const returnModalRef = useRef(null);
  const returnFormRef = useRef(null);
  const returnBottomRef = useRef(null);

  // Auto-scroll saat modal dibuka agar form langsung terlihat di layar
  useEffect(() => {
    if (selectedLoan && modalMode === 'review') {
      const timer = setTimeout(() => {
        if (decisionFormRef.current) {
          decisionFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedLoan, modalMode]);

  useEffect(() => {
    if (selectedLoan && modalMode === 'checkout') {
      const timer = setTimeout(() => {
        if (checkoutStep === 'peminjam') {
          checkoutSigRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          checkoutPengelolaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedLoan, modalMode, checkoutStep]);

  useEffect(() => {
    if (selectedLoan && modalMode === 'return') {
      const timer = setTimeout(() => {
        returnFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedLoan, modalMode]);

  // Mendeteksi keterlibatan akun login terhadap suatu tiket peminjaman
  function getLoanUserRelationship(loan) {
    if (!loan) return {};
    const loanLabPeminjamId = Number(loan.lab_peminjam_id ?? loan.peminjam?.lab_id ?? loan.lab_peminjam?.id ?? 0);
    const isDirectPeminjam = currentUserId > 0 && (loan.peminjam?.user_id === currentUserId || loan.peminjam_id === currentUserId);
    const isLabPeminjamStaff = currentUserRole === 'staff' && currentUserLabId > 0 && loanLabPeminjamId === currentUserLabId;
    const isPeminjam = isDirectPeminjam || isLabPeminjamStaff;

    const isPengelola = currentUserId > 0 && (loan.approval_pengelola?.user_id === currentUserId || loan.pengelola_id === currentUserId);
    const isManagerPeminjam = currentUserId > 0 && (loan.approval_manager_peminjam?.user_id === currentUserId || loan.manajer_peminjam_id === currentUserId);
    const isManagerLab = currentUserId > 0 && (loan.approval_manager_lab?.user_id === currentUserId || loan.manager_lab_id === currentUserId);
    const isAdmin = currentUserRole === 'admin';
    return { isPeminjam, isPengelola, isManagerPeminjam, isManagerLab, isAdmin };
  }

  // Mendeteksi apakah tiket sedang menunggu review/tindakan dari akun login
  function getPendingActionForUser(loan) {
    if (!loan) return null;
    const { isPeminjam, isPengelola, isManagerPeminjam, isManagerLab, isAdmin } = getLoanUserRelationship(loan);

    // Alur Serah Terima:
    // 4A: Disetujui Manager Lab (status: DISETUJUI / MENUNGGU_SERAH_TERIMA) -> Pengelola memeriksa fisik & isi Lampiran A
    // 4B: Pengelola selesai isi checklist (status: SIAP_DISERAHKAN) -> Peminjam periksa checklist & bubuhkan TTD terima
    const isStageApprovedPengelola = loan.status === 'DISETUJUI' || loan.status === 'MENUNGGU_SERAH_TERIMA';
    const isStageReadyPeminjam = loan.status === 'SIAP_DISERAHKAN';

    // 1. Filter: PEMINJAM
    if (roleFilter === 'peminjam') {
      if (isStageReadyPeminjam && (isPeminjam || isAdmin)) {
        return { canHandover: true, step: 'peminjam', label: 'Tahap 4B: Konfirmasi Terima & TTD Peminjam' };
      }
      return null;
    }

    // 2. Filter: PENGELOLA
    if (roleFilter === 'pengelola') {
      if (loan.status === 'MENUNGGU_PENGELOLA' && (isPengelola || isAdmin)) {
        return { canReview: true, stage: 'pengelola', label: 'Tahap 2: Review Teknis Pengelola' };
      }
      if (isStageApprovedPengelola && (isPengelola || isAdmin)) {
        return { canHandover: true, step: 'pengelola', label: 'Tahap 4A: Pengisian Lampiran A & TTD Pengelola' };
      }
      return null;
    }

    // 3. Filter: MANAGER PEMINJAM
    if (roleFilter === 'manajer_peminjam') {
      if (loan.status === 'MENUNGGU_MANAGER_PEMINJAM' && (isManagerPeminjam || isAdmin)) {
        return { canReview: true, stage: 'manager_peminjam', label: 'Tahap 1: Validasi Atasan Peminjam' };
      }
      return null;
    }

    // 4. Filter: MANAGER LAB
    if (roleFilter === 'manager_lab') {
      if (loan.status === 'MENUNGGU_MANAGER_LAB' && (isManagerLab || isAdmin)) {
        return { canReview: true, stage: 'manager_lab', label: 'Tahap 3: Pengesahan Manager Lab' };
      }
      if (loan.status === 'SEDANG_DIPINJAM' && loan.perpanjangan?.some((p) => p.status === 'menunggu') && (isManagerLab || isAdmin)) {
        return { canReviewExtension: true, label: 'Pengesahan Perpanjangan: Review Manager Lab' };
      }
      return null;
    }

    // Default (roleFilter === 'SEMUA'):
    if (loan.status === 'MENUNGGU_MANAGER_PEMINJAM' && (isManagerPeminjam || isAdmin)) {
      return { canReview: true, stage: 'manager_peminjam', label: 'Tahap 1: Validasi Atasan Peminjam' };
    }
    // Pengelola me-review kelayakan & ketersediaan alat di Tahap 2
    if (loan.status === 'MENUNGGU_PENGELOLA' && (isAdmin || isPengelola)) {
      return { canReview: true, stage: 'pengelola', label: 'Tahap 2: Review Teknis Pengelola' };
    }
    if (loan.status === 'MENUNGGU_MANAGER_LAB' && (isManagerLab || isAdmin)) {
      return { canReview: true, stage: 'manager_lab', label: 'Tahap 3: Pengesahan Manager Lab' };
    }
    // Review Perpanjangan Waktu (Wewenang Manager Lab)
    if (loan.status === 'SEDANG_DIPINJAM' && loan.perpanjangan?.some((p) => p.status === 'menunggu') && (isManagerLab || isAdmin)) {
      return { canReviewExtension: true, label: 'Pengesahan Perpanjangan: Review Manager Lab' };
    }
    // Tahap 4A: Pengelola memeriksa & mengisi Lampiran A
    if (isStageApprovedPengelola && (isPengelola || isAdmin)) {
      return { canHandover: true, step: 'pengelola', label: 'Tahap 4A: Pengisian Lampiran A & TTD Pengelola' };
    }
    // Tahap 4B: Peminjam konfirmasi penerimaan & TTD
    if (isStageReadyPeminjam && (isPeminjam || isAdmin)) {
      return { canHandover: true, step: 'peminjam', label: 'Tahap 4B: Konfirmasi Terima & TTD Peminjam' };
    }
    return null;
  }

  // Ambil daftar peralatan untuk opsi alternatif jika pengelola menolak
  useEffect(() => {
    let cancelled = false;
    peralatanApi.getAll()
      .then((res) => {
        if (!cancelled && Array.isArray(res?.data)) {
          setEquipmentList(res.data.filter((item) => item.status_verifikasi === 'Disetujui' && item.status_alat === 'Aktif'));
        }
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, []);

  // Ambil daftar peminjaman dari Backend
  const fetchLoans = async () => {
    setIsLoansLoading(true);
    try {
      const params = {};
      if (roleFilter !== 'SEMUA') {
        params.peran = roleFilter;
      }
      if (statusFilter === 'MENUNGGU_SAYA') {
        params.menunggu_saya = true;
      } else if (statusFilter !== 'SEMUA') {
        params.status = statusFilter;
      }
      const res = await peminjamanApi.getAll(params);
      if (res?.success && Array.isArray(res.data)) {
        setLoans(res.data);
      }
    } catch (err) {
      console.warn('Backend peminjaman offline/fallback:', err);
    } finally {
      setIsLoansLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [roleFilter, statusFilter]);

  // Ambil Catatan Logbook Peralatan dari Backend
  async function fetchLogbook(peralatanId) {
    if (!peralatanId) return;
    setIsLogbookLoading(true);
    setLogbookError(null);
    try {
      const res = await logbookApi.getByPeralatanId(peralatanId, 'peminjaman');
      if (res?.success && Array.isArray(res.data)) {
        setLogbookData(res.data);
      } else {
        setLogbookData([]);
      }
    } catch (err) {
      console.warn('Backend logbook belum merespons, menggunakan fallback data:', err);
      setLogbookError(err.message || 'Koneksi ke backend logbook belum aktif.');
      // Fallback mock agar UI tidak kosong saat dev offline
      setLogbookData([
        {
          id: 1,
          jenis: 'peminjaman',
          aksi: 'pengajuan',
          judul: 'Pengajuan peminjaman',
          status: 'Diajukan',
          keterangan: 'Pengajuan peminjaman dicatat pada logbook sistem SiKEPo.',
          referensi_id: 1,
          user: {
            user_id: 3,
            name: 'Staff Lab',
          },
          created_at: '2026-10-06T10:39:07+07:00',
        },
      ]);
    } finally {
      setIsLogbookLoading(false);
    }
  }

  // Filter data sesuai filter bar & role perspective
  const filteredLoans = loans.filter((item) => {
    const q = searchQuery.toLowerCase();
    const kode = (item.kode || String(item.id)).toLowerCase();
    const namaAlat = (item.peralatan?.nama_peralatan || '').toLowerCase();
    const noAset = (item.peralatan?.nomor_aset || '').toLowerCase();
    const namaPeminjam = (item.peminjam?.nama || '').toLowerCase();

    const matchSearch =
      kode.includes(q) ||
      namaAlat.includes(q) ||
      noAset.includes(q) ||
      namaPeminjam.includes(q);

    if (!matchSearch) return false;

    // Filter keterlibatan peran client-side
    if (roleFilter !== 'SEMUA') {
      const rel = getLoanUserRelationship(item);
      if (roleFilter === 'peminjam' && !rel.isPeminjam && !rel.isAdmin) return false;
      if (roleFilter === 'pengelola' && !rel.isPengelola && !rel.isAdmin) return false;
      if (roleFilter === 'manajer_peminjam' && (!rel.isManagerPeminjam || item.approval_manager_peminjam?.status === 'skipped') && !rel.isAdmin) return false;
      if (roleFilter === 'manager_lab' && !rel.isManagerLab && !rel.isAdmin) return false;
    }

    if (statusFilter === 'MENUNGGU_SAYA') {
      const pending = getPendingActionForUser(item);
      return Boolean(pending?.canReview || pending?.canHandover || pending?.canReturnConfirm || pending?.canReviewExtension);
    }
    if (statusFilter === 'DISETUJUI' || statusFilter === 'MENUNGGU_SERAH_TERIMA') {
      if (item.status !== 'MENUNGGU_SERAH_TERIMA' && item.status !== 'DISETUJUI') return false;
    } else if (statusFilter !== 'SEMUA' && item.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Buka Modal untuk Review Persetujuan (Tahap 1, 2, 3) atau Detail
  async function handleOpenReview(loan) {
    setSelectedLoan(loan);
    setModalMode('review');
    setDecisionNote('');
    setAlternativeEquipmentId('');
    setDigitalSignature('');

    // Tandai notifikasi tiket ini sebagai terbaca dan kurangi angka lonceng seketika
    const ticketCode = loan?.kode || (typeof loan?.id === 'number' ? `PJM-2026-${String(loan.id).padStart(4, '0')}` : String(loan?.id || ''));
    if (ticketCode) {
      markNotificationsAsReadByRef({ ticketCode });
    }

    // Deteksi tahap review secara otomatis dari status tiket dan hak akses akun
    const pendingAction = getPendingActionForUser(loan);
    const stage = pendingAction?.stage || (
      loan.status === 'MENUNGGU_MANAGER_PEMINJAM' ? 'manager_peminjam' :
        loan.status === 'MENUNGGU_PENGELOLA' ? 'pengelola' :
          loan.status === 'MENUNGGU_MANAGER_LAB' ? 'manager_lab' : 'pengelola'
    );
    setActiveReviewStage(stage);

    // Reset checklist teknis Tahap 2
    const sched = loan.approval_pengelola?.cek_jadwal_kalibrasi ?? true;
    const spec = loan.approval_pengelola?.cek_spesifikasi ?? true;
    const oper = loan.approval_pengelola?.cek_operator ?? true;
    const loc = loan.approval_pengelola?.cek_lokasi ?? true;

    setTechCheckSchedule(sched);
    setTechCheckSpec(spec);
    setTechCheckOperator(oper);
    setTechCheckLocation(loc);

    const isAllPassed = sched && spec && oper && (!loan.is_eksternal || loc);
    if (stage === 'pengelola' && !isAllPassed) {
      setDecisionAction('tolak');
      setDecisionNote('Tidak memenuhi kriteria verifikasi kelayakan & ketersediaan peralatan.');
    } else {
      setDecisionAction('setuju');
    }

    fetchLogbook(loan.peralatan?.id);

    // Ambil data peminjaman detail lengkap agar gambar TTD 3 tingkat terisi
    if (!isNaN(Number(loan.id))) {
      try {
        const detailRes = await peminjamanApi.getById(loan.id);
        if (detailRes?.success && detailRes.data) {
          setSelectedLoan(detailRes.data);
        }
      } catch (err) {
        console.warn('Gagal fetch detail peminjaman review:', err);
      }
    }
  }

  // Toggle checklist verifikasi kelayakan & ketersediaan di Pengelola
  function handleTechCheckToggle(itemKey, isChecked) {
    let nextSchedule = itemKey === 'schedule' ? isChecked : techCheckSchedule;
    let nextSpec = itemKey === 'spec' ? isChecked : techCheckSpec;
    let nextOperator = itemKey === 'operator' ? isChecked : techCheckOperator;
    let nextLocation = itemKey === 'location' ? isChecked : techCheckLocation;

    if (itemKey === 'schedule') setTechCheckSchedule(isChecked);
    if (itemKey === 'spec') setTechCheckSpec(isChecked);
    if (itemKey === 'operator') setTechCheckOperator(isChecked);
    if (itemKey === 'location') setTechCheckLocation(isChecked);

    const isEksternal = Boolean(selectedLoan?.is_eksternal);
    const allPassed = nextSchedule && nextSpec && nextOperator && (!isEksternal || nextLocation);

    if (!allPassed) {
      setDecisionAction('tolak');
      const uncheckedList = [];
      if (!nextSchedule) uncheckedList.push('Jadwal/Status Kalibrasi');
      if (!nextSpec) uncheckedList.push('Kesesuaian Spesifikasi Teknis');
      if (!nextOperator) uncheckedList.push('Kewenangan Operator');
      if (isEksternal && !nextLocation) uncheckedList.push('Kesiapan Lokasi Eksternal');

      const autoReason = `Tidak memenuhi kriteria verifikasi kelayakan & ketersediaan: ${uncheckedList.join(', ')}.`;
      if (!decisionNote.trim() || decisionNote.startsWith('Tidak memenuhi kriteria verifikasi')) {
        setDecisionNote(autoReason);
      }
    } else {
      setDecisionAction('setuju');
      if (decisionNote.startsWith('Tidak memenuhi kriteria verifikasi')) {
        setDecisionNote('');
      }
    }
  }

  // Buka Modal Khusus Serah Terima Keluar (Tahap 4: F/010)
  async function handleOpenCheckout(loan) {
    setSelectedLoan(loan);
    setModalMode('checkout');
    setCheckoutNote(loan.serah_terima_keluar?.catatan || '');
    setCheckoutSigPengelola(loan.serah_terima_keluar?.ttd_pengelola || '');
    setCheckoutSigPeminjam(loan.serah_terima_keluar?.ttd_peminjam || '');

    // Tandai notifikasi tiket ini sebagai terbaca dan kurangi angka lonceng seketika
    const ticketCode = loan?.kode || (typeof loan?.id === 'number' ? `PJM-2026-${String(loan.id).padStart(4, '0')}` : String(loan?.id || ''));
    if (ticketCode) {
      markNotificationsAsReadByRef({ ticketCode });
    }

    const pending = getPendingActionForUser(loan);
    const step = pending?.step || (loan.status === 'SIAP_DISERAHKAN' ? 'peminjam' : 'pengelola');
    setCheckoutStep(step);

    const kelengkapanList = loan.kebutuhan_kelengkapan || loan.kelengkapan || '';

    if (loan.serah_terima_keluar?.lampiran_a && loan.serah_terima_keluar.lampiran_a.length > 0) {
      setCheckoutChecks(loan.serah_terima_keluar.lampiran_a.slice(0, 7).map((it, idx) => ({
        status: (it.status === 'N/A' || it.status === 'TB') ? 'TB' : (it.status || 'S'),
        keterangan: it.keterangan || (idx === 3 && kelengkapanList ? `Sesuai daftar: ${kelengkapanList}` : ''),
      })));
    } else {
      // Default: 7 butir. Butir 1-5 = S, butir 6-7 = TB. Butir 4 pre-fill kelengkapan bila ada
      setCheckoutChecks(
        Array.from({ length: 7 }, (_, idx) => ({
          status: BOLEH_NA_INDEXES.includes(idx) ? 'TB' : 'S',
          keterangan: idx === 3 && kelengkapanList ? `Sesuai daftar: ${kelengkapanList}` : '',
        }))
      );
    }

    // Jika tiket numerik riil backend, ambil detail lengkap agar TTD Pengelola dan data lampiran A terambil utuh
    if (!isNaN(Number(loan.id))) {
      try {
        const detailRes = await peminjamanApi.getById(loan.id);
        if (detailRes?.success && detailRes.data) {
          const detail = detailRes.data;
          setSelectedLoan(detail);
          const detailKelengkapan = detail.kebutuhan_kelengkapan || detail.kelengkapan || '';
          if (detail.serah_terima_keluar) {
            setCheckoutNote(detail.serah_terima_keluar.catatan || '');
            if (detail.serah_terima_keluar.ttd_pengelola) {
              setCheckoutSigPengelola(detail.serah_terima_keluar.ttd_pengelola);
            }
            if (detail.serah_terima_keluar.lampiran_a && detail.serah_terima_keluar.lampiran_a.length > 0) {
              setCheckoutChecks(detail.serah_terima_keluar.lampiran_a.slice(0, 7).map((it, idx) => ({
                status: (it.status === 'N/A' || it.status === 'TB') ? 'TB' : (it.status || 'S'),
                keterangan: it.keterangan || (idx === 3 && detailKelengkapan ? `Sesuai daftar: ${detailKelengkapan}` : ''),
              })));
            }
          }
        }
      } catch (err) {
        console.warn('Gagal fetch detail peminjaman serah terima:', err);
      }
    }
  }

  // Buka Modal Khusus Pengembalian Peralatan
  async function handleOpenReturn(loan) {
    setSelectedLoan(loan);
    setModalMode('return');
    setAdaKejadian(false);
    setUraianKejadian('');
    setReturnCatatan('');
    setReturnSigPengelola('');
    setReturnSigPeminjam('');
    setShowDirectPeminjamSigPad(false);

    // Muat tanda tangan peminjam yang tersimpan dari akun peminjam
    const savedPeminjamSig = localStorage.getItem(`sikepo_return_peminjam_sig_${loan.id}`);
    if (savedPeminjamSig) {
      setReturnSigPeminjam(savedPeminjamSig);
    }

    // Muat data kejadian dari akun peminjam jika ada
    const savedKejadian = localStorage.getItem(`sikepo_return_kejadian_${loan.id}`);
    if (savedKejadian) {
      try {
        const parsed = JSON.parse(savedKejadian);
        if (parsed.adaKejadian !== undefined) setAdaKejadian(Boolean(parsed.adaKejadian));
        if (parsed.uraianKejadian) setUraianKejadian(parsed.uraianKejadian);
      } catch (_) { }
    }

    // Tandai notifikasi tiket ini sebagai terbaca dan kurangi angka lonceng seketika
    const ticketCode = loan?.kode || (typeof loan?.id === 'number' ? `PJM-2026-${String(loan.id).padStart(4, '0')}` : String(loan?.id || ''));
    if (ticketCode) {
      markNotificationsAsReadByRef({ ticketCode });
    }

    const kelengkapanList = loan.kebutuhan_kelengkapan || loan.kelengkapan || '';
    let initialChecks = Array.from({ length: 7 }, (_, idx) => ({
      status: BOLEH_NA_INDEXES.includes(idx) ? 'TB' : 'S',
      keterangan: idx === 3 && kelengkapanList ? `Sesuai daftar: ${kelengkapanList}` : '',
    }));

    if (loan.serah_terima_kembali?.lampiran_a && loan.serah_terima_kembali.lampiran_a.length > 0) {
      initialChecks = loan.serah_terima_kembali.lampiran_a.slice(0, 7).map((it) => ({
        status: (it.status === 'N/A' || it.status === 'TB') ? 'TB' : (it.status || 'S'),
        keterangan: it.keterangan || '',
      }));
    } else if (loan.serah_terima_keluar?.lampiran_a && loan.serah_terima_keluar.lampiran_a.length > 0) {
      initialChecks = loan.serah_terima_keluar.lampiran_a.slice(0, 7).map((it, idx) => ({
        status: (it.status === 'N/A' || it.status === 'TB') ? 'TB' : 'S',
        keterangan: it.status === 'S' && BOLEH_NA_INDEXES.includes(idx) ? (it.keterangan || '') : (idx === 3 && kelengkapanList ? `Sesuai daftar: ${kelengkapanList}` : ''),
      }));
    }
    setReturnChecks(initialChecks);

    if (loan.serah_terima_kembali) {
      const stb = loan.serah_terima_kembali;
      if (stb.ada_kejadian !== undefined) setAdaKejadian(Boolean(stb.ada_kejadian));
      if (stb.uraian_kejadian) setUraianKejadian(stb.uraian_kejadian);
      if (stb.catatan) setReturnCatatan(stb.catatan);
      if (stb.ttd_pengelola) setReturnSigPengelola(stb.ttd_pengelola);
    }

    if (!isNaN(Number(loan.id))) {
      try {
        const detailRes = await peminjamanApi.getById(loan.id);
        if (detailRes?.success && detailRes.data) {
          const detail = detailRes.data;
          setSelectedLoan(detail);
          const detailKelengkapan = detail.kebutuhan_kelengkapan || detail.kelengkapan || '';
          if (detail.serah_terima_kembali) {
            const stb = detail.serah_terima_kembali;
            if (stb.ada_kejadian !== undefined) setAdaKejadian(Boolean(stb.ada_kejadian));
            if (stb.uraian_kejadian) setUraianKejadian(stb.uraian_kejadian);
            if (stb.catatan) setReturnCatatan(stb.catatan);
            if (stb.ttd_pengelola) setReturnSigPengelola(stb.ttd_pengelola);
            if (stb.lampiran_a && stb.lampiran_a.length > 0) {
              setReturnChecks(stb.lampiran_a.slice(0, 7).map((it) => ({
                status: it.status || 'S',
                keterangan: it.keterangan || '',
              })));
            }
          } else if (detail.serah_terima_keluar?.lampiran_a && detail.serah_terima_keluar.lampiran_a.length > 0) {
            setReturnChecks(detail.serah_terima_keluar.lampiran_a.slice(0, 7).map((it, idx) => ({
              status: (it.status === 'N/A' || it.status === 'TB') ? 'TB' : 'S',
              keterangan: it.status === 'S' && BOLEH_NA_INDEXES.includes(idx) ? (it.keterangan || '') : (idx === 3 && detailKelengkapan ? `Sesuai daftar: ${detailKelengkapan}` : ''),
            })));
          }
        }
      } catch (err) {
        console.warn('Gagal fetch detail peminjaman pengembalian:', err);
      }
    }
  }

  // Buka Modal Hanya untuk Melihat Detail Riwayat
  async function handleOpenDetail(loan) {
    setSelectedLoan(loan);
    setModalMode('detail');

    // Tandai notifikasi tiket ini sebagai terbaca dan kurangi angka lonceng seketika
    const ticketCode = loan?.kode || (typeof loan?.id === 'number' ? `PJM-2026-${String(loan.id).padStart(4, '0')}` : String(loan?.id || ''));
    if (ticketCode) {
      markNotificationsAsReadByRef({ ticketCode });
    }

    fetchLogbook(loan.peralatan?.id);

    if (!isNaN(Number(loan.id))) {
      try {
        const detailRes = await peminjamanApi.getById(loan.id);
        if (detailRes?.success && detailRes.data) {
          setSelectedLoan(detailRes.data);
        }
      } catch (err) {
        console.warn('Gagal fetch detail peminjaman:', err);
      }
    }
  }

  // Helper hitung minimum tanggal perpanjangan (H+1 dari rencana_tanggal_kembali)
  function getMinExtensionDate(loan) {
    if (!loan?.rencana_tanggal_kembali) {
      const now = new Date();
      now.setDate(now.getDate() + 1);
      return now.toISOString().split('T')[0];
    }
    const current = new Date(loan.rencana_tanggal_kembali);
    current.setDate(current.getDate() + 1);
    return current.toISOString().split('T')[0];
  }

  // Handler buka modal ajukan perpanjangan (Peminjam)
  function handleOpenExtensionRequest(loan) {
    setSelectedLoan(loan);
    setModalMode('extension_request');
    setExtensionReason('');
    setExtensionNewDate(getMinExtensionDate(loan));
  }

  // Handler buka modal review perpanjangan (Manager Lab)
  function handleOpenExtensionReview(loan) {
    setSelectedLoan(loan);
    setModalMode('extension_review');
    setExtensionDecisionAction('setuju');
    setExtensionDecisionNote('');
    setExtensionDecisionSig('');
  }

  // Handler Submit Pengajuan Perpanjangan (Peminjam)
  async function handleSubmitExtensionRequest(e) {
    e.preventDefault();
    if (!selectedLoan) return;

    if (!extensionNewDate) {
      toastError('Harap tentukan tanggal kembali baru.');
      return;
    }

    if (!extensionReason.trim()) {
      toastError('Harap isi alasan permohonan perpanjangan.');
      return;
    }

    if (extensionNewDate <= selectedLoan.rencana_tanggal_kembali) {
      toastError(`Tanggal kembali baru harus setelah tanggal kembali saat ini (${selectedLoan.rencana_tanggal_kembali}).`);
      return;
    }

    setIsExtensionSubmitting(true);
    try {
      const payload = {
        tanggal_kembali_baru: extensionNewDate,
        alasan: extensionReason.trim(),
      };
      const res = await peminjamanApi.ajukanPerpanjangan(selectedLoan.id, payload);
      if (res?.success) {
        success('Permohonan perpanjangan berhasil diajukan dan sedang menunggu persetujuan Manager Lab.');
        setSelectedLoan(null);
        fetchLoans();
      } else {
        toastError(res?.message || 'Gagal mengajukan perpanjangan.');
      }
    } catch (err) {
      toastError(err.message || 'Terjadi kesalahan saat mengajukan perpanjangan.');
    } finally {
      setIsExtensionSubmitting(false);
    }
  }

  // Handler Submit Keputusan Perpanjangan (Manager Lab)
  async function handleSubmitExtensionDecision(e) {
    e.preventDefault();
    if (!selectedLoan) return;

    const waitingPj = selectedLoan.perpanjangan?.find((p) => p.status === 'menunggu');
    if (!waitingPj) {
      toastError('Tidak ada pengajuan perpanjangan yang sedang menunggu verifikasi.');
      return;
    }

    if (extensionDecisionAction === 'tolak' && !extensionDecisionNote.trim()) {
      toastError('Harap isi alasan penolakan perpanjangan.');
      return;
    }

    if (extensionDecisionAction === 'setuju' && !extensionDecisionSig) {
      toastError('Harap bubuhkan tanda tangan digital Anda untuk pengesahan.');
      return;
    }

    setIsExtensionDecisionSubmitting(true);
    try {
      const payload = {
        keputusan: extensionDecisionAction,
        catatan: extensionDecisionNote.trim(),
        ttd: extensionDecisionAction === 'setuju' ? extensionDecisionSig : '',
        // Fallback untuk backward-compatibility
        aksi: extensionDecisionAction,
        signature: extensionDecisionAction === 'setuju' ? extensionDecisionSig : undefined,
      };
      const res = await peminjamanApi.keputusanPerpanjangan(selectedLoan.id, waitingPj.id, payload);
      if (res?.success) {
        success(
          extensionDecisionAction === 'setuju'
            ? 'Perpanjangan peminjaman berhasil disetujui & disahkan.'
            : 'Perpanjangan peminjaman telah ditolak.'
        );
        setSelectedLoan(null);
        setModalMode(null);
        setExtensionDecisionAction('setuju');
        setExtensionDecisionNote('');
        setExtensionDecisionSig('');
        fetchLoans();
      } else {
        toastError(res?.message || 'Gagal memproses keputusan perpanjangan.');
      }
    } catch (err) {
      toastError(err.message || 'Terjadi kesalahan saat memproses keputusan.');
    } finally {
      setIsExtensionDecisionSubmitting(false);
    }
  }

  // Submit Keputusan Review Persetujuan (Tahap 1, 2, 3)
  async function handleSubmitDecision(e) {
    e.preventDefault();
    if (!selectedLoan) return;

    if (activeReviewStage === 'pengelola') {
      const isAllTechChecksPassed = techCheckSchedule && techCheckSpec && techCheckOperator && (!selectedLoan.is_eksternal || techCheckLocation);
      if (!isAllTechChecksPassed && decisionAction === 'setuju') {
        toastError('Semua butir kelayakan & ketersediaan wajib diceklis untuk menyetujui peminjaman.');
        setDecisionAction('tolak');
        return;
      }
    }

    if (decisionAction === 'setuju' && !digitalSignature?.trim()) {
      toastError('Tanda tangan digital wajib dibubuhkan sebelum menyetujui pengajuan.');
      return;
    }

    if (decisionAction === 'tolak' && !decisionNote.trim()) {
      toastError('Alasan penolakan wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      const body = {
        keputusan: decisionAction, // "setuju" atau "tolak"
        catatan: decisionNote.trim(),
        ttd: digitalSignature?.trim() || '',
      };

      if (activeReviewStage === 'pengelola') {
        body.cek_spesifikasi = Boolean(techCheckSpec);
        body.cek_operator = Boolean(techCheckOperator);
        body.cek_lokasi = Boolean(techCheckLocation);
      }

      if (decisionAction === 'tolak' && alternativeEquipmentId && activeReviewStage === 'pengelola') {
        body.alat_alternatif_id = Number(alternativeEquipmentId);
      }

      const isBackendId = !isNaN(Number(selectedLoan.id));
      if (isBackendId) {
        const res = await peminjamanApi.keputusan(selectedLoan.id, body);
        success(res?.message || `Keputusan ${decisionAction} berhasil dicatat.`);
        markNotificationsAsReadByRef({ ticketCode: selectedLoan.kode });
        await fetchLoans();
      } else {
        // Fallback mutasi state in-memory bila sedang mode offline/mock
        const nowFormatted = new Date().toLocaleString('id-ID', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }).replace(/\./g, ':');

        setLoans((prevLoans) =>
          prevLoans.map((item) => {
            if (item.id !== selectedLoan.id) return item;

            const updated = { ...item };

            if (decisionAction === 'tolak') {
              updated.status = 'DITOLAK';
              if (activeReviewStage === 'manager_peminjam') {
                updated.approval_manager_peminjam = {
                  ...updated.approval_manager_peminjam,
                  status: 'rejected',
                  tanggal: nowFormatted,
                  catatan: decisionNote,
                  ttd: digitalSignature,
                };
              } else if (activeReviewStage === 'pengelola') {
                updated.approval_pengelola = {
                  ...updated.approval_pengelola,
                  status: 'rejected',
                  tanggal: nowFormatted,
                  catatan: decisionNote,
                  ttd: digitalSignature,
                  cek_spesifikasi: techCheckSpec,
                  cek_operator: techCheckOperator,
                  cek_jadwal_kalibrasi: techCheckSchedule,
                  cek_lokasi: techCheckLocation,
                };
              } else if (activeReviewStage === 'manager_lab') {
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

            // JIKA MENYETUJUI / MENERUSKAN:
            if (activeReviewStage === 'manager_peminjam') {
              updated.status = 'MENUNGGU_PENGELOLA';
              updated.approval_manager_peminjam = {
                ...updated.approval_manager_peminjam,
                status: 'approved',
                tanggal: nowFormatted,
                catatan: decisionNote || 'Disetujui oleh Atasan Peminjam.',
                ttd: digitalSignature,
              };
            } else if (activeReviewStage === 'pengelola') {
              updated.status = 'MENUNGGU_MANAGER_LAB';
              updated.approval_pengelola = {
                ...updated.approval_pengelola,
                status: 'approved',
                tanggal: nowFormatted,
                catatan: decisionNote || 'Verifikasi teknis, wewenang operator, dan ketersediaan jadwal terpenuhi. Diteruskan ke Manager Lab.',
                ttd: digitalSignature,
                cek_spesifikasi: techCheckSpec,
                cek_operator: techCheckOperator,
                cek_jadwal_kalibrasi: techCheckSchedule,
                cek_lokasi: techCheckLocation,
              };
            } else if (activeReviewStage === 'manager_lab') {
              updated.status = 'DISETUJUI';
              updated.approval_manager_lab = {
                ...updated.approval_manager_lab,
                status: 'approved',
                tanggal: nowFormatted,
                catatan: decisionNote || 'Persetujuan peminjaman disahkan. Silakan laksanakan serah terima keluar fisik menggunakan Lampiran A.',
                ttd: digitalSignature,
              };
            }

            return updated;
          })
        );

        success(
          decisionAction === 'setuju'
            ? `Persetujuan berhasil disimpan! Tiket peminjaman ${selectedLoan.kode || selectedLoan.id} diperbarui.`
            : `Pengajuan peminjaman ${selectedLoan.kode || selectedLoan.id} ditolak.`
        );
      }
      setSelectedLoan(null);
    } catch (err) {
      toastError(err.message || 'Gagal menyimpan keputusan.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Submit Serah Terima Keluar Fisik (Tahap 4: F/010)
  async function handleSubmitCheckout(e) {
    e.preventDefault();
    if (!selectedLoan) return;

    if (checkoutStep === 'pengelola') {
      // 1. Semua 7 butir wajib terisi statusnya (S, TS, atau TB)
      if (checkoutChecks.length !== 7 || checkoutChecks.some((i) => !i.status)) {
        toastError('Semua 7 butir pemeriksaan lembar serah terima (F/010) wajib diisi statusnya.');
        return;
      }

      // 2. Status TB hanya boleh pada butir 6 dan 7 (fungsi khusus)
      const naSalahButir = checkoutChecks.some((it, idx) => (it.status === 'N/A' || it.status === 'TB') && !BOLEH_NA_INDEXES.includes(idx));
      if (naSalahButir) {
        toastError('Status Tidak Berlaku (TB) hanya diperbolehkan pada butir fungsi khusus nomor 6 dan 7.');
        return;
      }

      // 3. Butir TS wajib diisi penjelasannya pada kolom keterangan
      const adaItemTS = checkoutChecks.some((i) => i.status === 'TS');
      if (adaItemTS) {
        const itemTSKosong = checkoutChecks.some((i) => i.status === 'TS' && !i.keterangan?.trim());
        if (itemTSKosong) {
          toastError('Semua butir Tidak Sesuai (TS) wajib diisi penjelasannya pada kolom keterangan.');
          return;
        }
      }

      // 4. Butir fungsi khusus No 6 & 7 bernilai S wajib menuliskan jenis pemeriksaan
      const butirSKhususKosong = checkoutChecks.some(
        (i, idx) => BOLEH_NA_INDEXES.includes(idx) && i.status === 'S' && !i.keterangan?.trim()
      );
      if (butirSKhususKosong) {
        toastError('Butir fungsi khusus (No. 6 dan 7) yang bernilai Sesuai (S) wajib menuliskan jenis pemeriksaan pada keterangan.');
        return;
      }

      // 5. Tanda tangan Pengelola Peralatan wajib jika tidak ada butir TS
      if (!adaItemTS && (!checkoutSigPengelola?.trim() || checkoutSigPengelola === FALLBACK_EMPTY_PNG)) {
        toastError('Tanda tangan Pengelola Peralatan wajib dibubuhkan.');
        return;
      }

      setIsSubmitting(true);
      try {
        const payload = {
          lampiran_a: checkoutChecks.map((it) => ({
            status: it.status === 'TB' ? 'N/A' : it.status,
            keterangan: it.keterangan ? it.keterangan.trim() : '',
          })),
          catatan: checkoutNote ? checkoutNote.trim() : '',
          ttd: checkoutSigPengelola?.trim() || (adaItemTS ? FALLBACK_EMPTY_PNG : ''),
        };

        const res = await peminjamanApi.serahTerima(selectedLoan.id, payload);
        if (res?.success === false) {
          throw new Error(res.message || 'Gagal menyimpan checklist serah terima');
        }

        markNotificationsAsReadByRef({ ticketCode: selectedLoan.kode });
        setSelectedLoan(null);
        await fetchLoans();

        if (adaItemTS) {
          toastError(
            `Serah terima dibatalkan karena terdapat butir TS. Tiket ${selectedLoan.kode || selectedLoan.id} ditutup dan status alat dialihkan menjadi DO NOT USE.`
          );
        } else {
          success(
            `Pemeriksaan serah terima keluar berhasil disahkan! Tiket ${selectedLoan.kode || selectedLoan.id} kini berstatus SIAP_DISERAHKAN dan menunggu konfirmasi dari Peminjam.`
          );
        }
      } catch (err) {
        toastError(err.message || 'Gagal memproses serah terima keluar');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // checkoutStep === 'peminjam' (TTD wajib diisi)
      if (!checkoutSigPeminjam || !checkoutSigPeminjam.trim() || checkoutSigPeminjam === FALLBACK_EMPTY_PNG) {
        toastError('Tanda tangan peminjam wajib dibubuhkan sebelum mengonfirmasi penerimaan peralatan.');
        return;
      }

      setIsSubmitting(true);
      try {
        const payload = {
          ttd: checkoutSigPeminjam.trim(),
        };

        const res = await peminjamanApi.konfirmasiTerima(selectedLoan.id, payload);
        if (res?.success === false) {
          throw new Error(res.message || 'Gagal mengonfirmasi penerimaan peralatan');
        }

        markNotificationsAsReadByRef({ ticketCode: selectedLoan.kode });
        setSelectedLoan(null);
        await fetchLoans();

        success(
          `Penerimaan peralatan berhasil dikonfirmasi! Tiket ${selectedLoan.kode || selectedLoan.id} kini resmi berstatus SEDANG_DIPINJAM dan status alat menjadi Dipinjam.`
        );
      } catch (err) {
        toastError(err.message || 'Gagal mengonfirmasi penerimaan peralatan');
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  // Pengesahan Pengembalian Peralatan: Pemeriksaan fisik & fungsi + Tanda tangan Peminjam & Pengelola
  async function handleSubmitReturn(e) {
    e.preventDefault();
    if (!selectedLoan) return;

    // 1. Validasi 7 butir
    if (returnChecks.length !== 7 || returnChecks.some((i) => !i.status)) {
      toastError('Semua 7 butir pemeriksaan pengembalian wajib diisi statusnya (S, TS, atau TB).');
      return;
    }

    // 2. TB hanya boleh di butir 6 dan 7
    const naSalahButir = returnChecks.some((it, idx) => (it.status === 'N/A' || it.status === 'TB') && !BOLEH_NA_INDEXES.includes(idx));
    if (naSalahButir) {
      toastError('Status Tidak Berlaku (TB) hanya diperbolehkan pada butir fungsi khusus nomor 6 dan 7.');
      return;
    }

    // 3. Butir TS wajib diisi penjelasannya
    const itemTSKosong = returnChecks.some((i) => i.status === 'TS' && !i.keterangan?.trim());
    if (itemTSKosong) {
      toastError('Semua butir Tidak Sesuai (TS) wajib diisi penjelasannya pada kolom keterangan.');
      return;
    }

    // 4. Butir fungsi khusus S wajib diisi penjelasannya
    const naWajibKet = returnChecks.some((i, idx) => BOLEH_NA_INDEXES.includes(idx) && i.status === 'S' && !i.keterangan?.trim());
    if (naWajibKet) {
      toastError('Butir fungsi khusus (No. 6 dan 7) yang dinyatakan Sesuai (S) wajib menuliskan jenis pemeriksaan yang dilakukan pada kolom keterangan.');
      return;
    }

    // 5. Validasi Bagian D: Jika Ada Kejadian, uraian kejadian wajib diisi
    if (adaKejadian && !uraianKejadian.trim()) {
      toastError('Uraian kejadian abnormal wajib diisi pada Bagian D.');
      return;
    }

    // 6. Validasi Tanda Tangan: TTD Peminjam & TTD Pengelola
    if (!returnSigPeminjam?.trim() || returnSigPeminjam === FALLBACK_EMPTY_PNG) {
      toastError('Tanda tangan Peminjam (yang menyerahkan kembali) wajib dibubuhkan.');
      return;
    }
    if (!returnSigPengelola?.trim() || returnSigPengelola === FALLBACK_EMPTY_PNG) {
      toastError('Tanda tangan Pengelola Lab (pemeriksa pengembalian) wajib dibubuhkan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        lampiran_a: returnChecks.map((it) => ({
          status: it.status === 'TB' ? 'N/A' : it.status,
          keterangan: it.keterangan ? it.keterangan.trim() : '',
        })),
        ada_kejadian: Boolean(adaKejadian),
        uraian_kejadian: adaKejadian ? uraianKejadian.trim() : '',
        catatan: returnCatatan ? returnCatatan.trim() : '',
        ttd_pengelola: returnSigPengelola.trim(),
        ttd_peminjam: returnSigPeminjam.trim(),
      };

      const res = await peminjamanApi.pengembalian(selectedLoan.id, payload);
      if (res?.success === false) {
        throw new Error(res.message || 'Gagal mencatat pemeriksaan pengembalian');
      }

      // Bersihkan penyimpanan sementara tanda tangan peminjam
      localStorage.removeItem(`sikepo_return_peminjam_sig_${selectedLoan.id}`);
      localStorage.removeItem(`sikepo_return_kejadian_${selectedLoan.id}`);

      markNotificationsAsReadByRef({ ticketCode: selectedLoan.kode });
      setSelectedLoan(null);
      await fetchLoans();

      success(
        `Pengembalian tiket ${selectedLoan.kode || selectedLoan.id} berhasil disahkan! Status peralatan telah diperbarui.`
      );
    } catch (err) {
      toastError(err.message || 'Gagal memproses pengembalian');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Peminjam menyimpan tanda tangan pengembalian di akun peminjam
  function handleSavePeminjamReturn(e) {
    if (e) e.preventDefault();
    if (!selectedLoan) return;

    if (!returnSigPeminjam?.trim() || returnSigPeminjam === FALLBACK_EMPTY_PNG) {
      toastError('Tanda tangan digital Anda wajib dibubuhkan sebelum menyimpan.');
      return;
    }

    // Simpan tanda tangan peminjam ke localStorage
    localStorage.setItem(`sikepo_return_peminjam_sig_${selectedLoan.id}`, returnSigPeminjam.trim());
    if (adaKejadian) {
      localStorage.setItem(
        `sikepo_return_kejadian_${selectedLoan.id}`,
        JSON.stringify({ adaKejadian: true, uraianKejadian: uraianKejadian.trim() })
      );
    } else {
      localStorage.removeItem(`sikepo_return_kejadian_${selectedLoan.id}`);
    }

    markNotificationsAsReadByRef({ ticketCode: selectedLoan.kode });
    setSelectedLoan(null);
    success(
      `Tanda tangan pengembalian Anda untuk tiket ${selectedLoan.kode || selectedLoan.id} berhasil disimpan! Pengelola Lab akan memverifikasi fisik peralatan dan mengesahkan penerimaan.`
    );
  }

  // Hitung berapa TS, TB, dan S yang dipilih di form Keluar (F/010)
  const countTS = checkoutChecks.filter((i) => i.status === 'TS').length;
  const countNA = checkoutChecks.filter((i) => i.status === 'N/A' || i.status === 'TB').length;
  const countS = checkoutChecks.filter((i) => i.status === 'S').length;

  // Hitung berapa TS, TB, dan S yang dipilih di form Pengembalian (F/010)
  const countReturnTS = returnChecks.filter((i) => i.status === 'TS').length;
  const countReturnNA = returnChecks.filter((i) => i.status === 'N/A' || i.status === 'TB').length;
  const countReturnS = returnChecks.filter((i) => i.status === 'S').length;

  return (
    <div className="page-container fade-in-up" style={{ paddingBottom: 'var(--sp-8)' }}>
      {/* ==================================================================== */}
      {/* 1. HEADER HALAMAN                                                    */}
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

          </div>
          <p className="page-subtitle" style={{ marginTop: 4 }}>
            Kelola pengajuan peminjaman, proses verifikasi persetujuan resmi, dan pelaksanaan serah terima fisik peralatan laboratorium.
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
      {/* JIKA MEMILIH TAB: FORM PENGAJUAN BARU                                */}
      {/* ==================================================================== */}
      {activeTab === 'create_form' ? (
        <div style={{ marginTop: 'var(--sp-2)' }}>
          <LoanRequest onNavigate={() => setActiveTab('list')} />
        </div>
      ) : (
        <>
          {/* ==================================================================== */}
          {/* ALUR PROSES PEMINJAMAN — SWIMLANE SIKEPO                             */}
          {/* ==================================================================== */}
          <div
            className="card card-padded"
            style={{
              marginBottom: 'var(--sp-5)',
              background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
              border: '1px solid var(--clr-dark-200, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--sp-3)' }}>
              <FileCheck size={18} style={{ color: 'var(--clr-primary-500, #EE2E24)' }} />
              <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold, 600)', margin: 0, color: 'var(--clr-dark-900, #0f172a)' }}>
                Alur Proses Persetujuan &amp; Serah Terima Peminjaman
              </h2>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: 'var(--sp-3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: '#f8fafc', borderRadius: 'var(--radius-md, 6px)', border: '1px solid #e2e8f0', fontSize: 'var(--text-xs)', lineHeight: 1.5 }}>
                <span style={{ background: 'var(--clr-primary-500, #EE2E24)', color: '#ffffff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>1</span>
                <div><strong>Pengajuan Peminjam:</strong> Peminjam mengisi form permohonan dengan jadwal yang diketahui atasannya. Sistem mencatat logbook dan mengirim notifikasi.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: '#f8fafc', borderRadius: 'var(--radius-md, 6px)', border: '1px solid #e2e8f0', fontSize: 'var(--text-xs)', lineHeight: 1.5 }}>
                <span style={{ background: 'var(--clr-primary-500, #EE2E24)', color: '#ffffff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>2</span>
                <div><strong>Validasi Manajer Peminjam:</strong> Manajer peminjam memvalidasi urgensi dan jadwal kebutuhan pengujian.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: '#f8fafc', borderRadius: 'var(--radius-md, 6px)', border: '1px solid #e2e8f0', fontSize: 'var(--text-xs)', lineHeight: 1.5 }}>
                <span style={{ background: 'var(--clr-primary-500, #EE2E24)', color: '#ffffff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>3</span>
                <div><strong>Pemeriksaan Pengelola (PIC):</strong> PIC alat memeriksa ketersediaan, kelayakan fungsi, dan operator, lalu meneruskan ke Manager Lab pemilik.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: '#f8fafc', borderRadius: 'var(--radius-md, 6px)', border: '1px solid #e2e8f0', fontSize: 'var(--text-xs)', lineHeight: 1.5 }}>
                <span style={{ background: 'var(--clr-primary-500, #EE2E24)', color: '#ffffff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>4</span>
                <div><strong>Persetujuan Manager Lab Pemilik:</strong> Mgr. Lab mereview dan menyetujui peminjaman (butir 3.a &amp; 7.c).</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: '#f8fafc', borderRadius: 'var(--radius-md, 6px)', border: '1px solid #e2e8f0', fontSize: 'var(--text-xs)', lineHeight: 1.5 }}>
                <span style={{ background: 'var(--clr-primary-500, #EE2E24)', color: '#ffffff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>5</span>
                <div><strong>Serah Terima &amp; Checklist Lampiran A:</strong> PIC dan peminjam memeriksa identitas, fisik, kelengkapan, dan fungsi alat sebelum digunakan.</div>
              </div>
            </div>
          </div>

          {/* ==================================================================== */}
          {/* 2. BILAH FILTER & PENCARIAN                                          */}
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

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Filter size={15} style={{ color: '#64748b' }} />

              {/* Filter Keterlibatan Peran Akun */}
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ width: 'auto', minWidth: 200 }}
              >
                <option value="SEMUA">Semua Keterlibatan Saya</option>
                {currentUserRole === 'staff' && (
                  <>
                    <option value="peminjam">Sebagai Peminjam</option>
                    <option value="pengelola">Sebagai Pengelola Peralatan</option>
                  </>
                )}
                {currentUserRole === 'manager' && (
                  <>
                    <option value="manajer_peminjam">Sebagai Atasan Peminjam</option>
                    <option value="manager_lab">Sebagai Manager Lab Pemilik</option>
                  </>
                )}
                {currentUserRole === 'admin' && (
                  <>
                    <option value="peminjam">Peran Peminjam</option>
                    <option value="pengelola">Peran Pengelola Peralatan</option>
                    <option value="manajer_peminjam">Peran Atasan Peminjam</option>
                    <option value="manager_lab">Peran Manager Lab Pemilik</option>
                  </>
                )}
              </select>

              {/* Filter Status */}
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: 'auto', minWidth: 220 }}
              >
                <option value="SEMUA">Semua Status</option>
                <option value="MENUNGGU_SAYA">🔥 Menunggu Tindakan Saya</option>
                <option value="MENUNGGU_MANAGER_PEMINJAM">Tahap 1: Menunggu Atasan Peminjam</option>
                <option value="MENUNGGU_PENGELOLA">Tahap 2: Menunggu Review Pengelola</option>
                <option value="MENUNGGU_MANAGER_LAB">Tahap 3: Menunggu Manager Lab</option>
                <option value="DISETUJUI">Tahap 4A: Disetujui (Cek Pengelola)</option>
                <option value="SIAP_DISERAHKAN">Tahap 4B: Siap Diserahkan (TTD Peminjam)</option>
                <option value="SEDANG_DIPINJAM">Sedang Dipinjam (Alat Diserahkan)</option>
                <option value="DIKEMBALIKAN">Dikembalikan</option>
                <option value="DIBATALKAN_TS">Dibatalkan (Ada TS - DO NOT USE)</option>
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
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>Status Alur</th>
                    <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#475569', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoansLoading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--sp-8)', color: '#64748b' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '13px' }}>
                          <span className="spinner" style={{ width: 16, height: 16 }} /> Memuat data peminjaman...
                        </div>
                      </td>
                    </tr>
                  ) : filteredLoans.length === 0 ? (
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

                      // Deteksi peran akun login dan apakah tiket menunggu tindakan akun ini
                      const pendingAction = getPendingActionForUser(loan);
                      const isWaitingForReview = Boolean(pendingAction?.canReview);
                      const isReadyForHandover = Boolean(pendingAction?.canHandover);
                      const { isPeminjam, isPengelola, isManagerPeminjam, isManagerLab, isAdmin } = getLoanUserRelationship(loan);

                      return (
                        <tr
                          key={loan.id}
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            background: isWaitingForReview || isReadyForHandover || pendingAction?.canReviewExtension ? '#fffbeb' : '#ffffff',
                            transition: 'background 0.2s',
                          }}
                        >
                          {/* 1. ID Tiket */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>{loan.kode || loan.id}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{loan.tanggal_pengajuan ? String(loan.tanggal_pengajuan).slice(0, 10) : ''}</div>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                              {/* Jika filter peran aktif, tampilkan hanya badge peran yang sedang disaring */}
                              {roleFilter === 'peminjam' && (
                                <span className="badge badge-primary" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                  Peminjam
                                </span>
                              )}
                              {roleFilter === 'pengelola' && (
                                <span className="badge badge-red" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                  Pengelola
                                </span>
                              )}
                              {roleFilter === 'manajer_peminjam' && (
                                <span className="badge badge-warning" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                  Atasan
                                </span>
                              )}
                              {roleFilter === 'manager_lab' && (
                                <span className="badge badge-secondary" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                  Mgr Lab
                                </span>
                              )}

                              {/* Jika filter peran 'SEMUA', tampilkan badge yang relevan tanpa tumpang tindih */}
                              {roleFilter === 'SEMUA' && (
                                <>
                                  {isPeminjam && (
                                    <span className="badge badge-primary" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                      Peminjam
                                    </span>
                                  )}
                                  {isPengelola && (
                                    <span className="badge badge-red" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                      Pengelola
                                    </span>
                                  )}
                                  {isManagerPeminjam && loan.approval_manager_peminjam?.status !== 'skipped' && (
                                    <span className="badge badge-warning" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                      Atasan
                                    </span>
                                  )}
                                  {isManagerLab && (
                                    <span className="badge badge-secondary" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                      Mgr Lab
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
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
                                  Eksternal (Luar TTH)
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
                            {loan.rencana_tanggal_kembali_awal && loan.rencana_tanggal_kembali_awal !== loan.rencana_tanggal_kembali && (
                              <div style={{ fontSize: '10px', color: '#059669', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>{loan.rencana_tanggal_kembali_awal}</span>
                                <span>➔ {loan.rencana_tanggal_kembali}</span>
                              </div>
                            )}
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>
                              Jatuh tempo kalibrasi: {loan.peralatan.tgl_jatuh_tempo}
                            </div>
                          </td>

                          {/* 6. Status Approval & Mini Stepper */}
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

                            {/* Indikator Menunggu Review Perpanjangan */}
                            {loan.status === 'SEDANG_DIPINJAM' && loan.perpanjangan?.some((p) => p.status === 'menunggu') && (
                              <div style={{ marginTop: 4 }}>
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: '10px',
                                    background: '#fef3c7',
                                    color: '#b45309',
                                    border: '1px solid #fde68a',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    padding: '2px 6px',
                                    fontWeight: 700,
                                  }}
                                >
                                  <Clock size={9} /> Perpanjangan Menunggu
                                </span>
                              </div>
                            )}

                            {/* Mini Stepper 4 Tahap (Hijau = Selesai/Lolos | Merah = Ditolak | Abu = Belum) */}
                            <div style={{ display: 'flex', gap: 4, marginTop: 6 }} title="Status Alur 4 Tahap: Hijau = Selesai/Disetujui | Merah = Ditolak | Abu-abu = Belum">
                              <span
                                title={
                                  loan.status === 'DIKEMBALIKAN'
                                    ? 'Tahap 1: Selesai Disetujui (Hijau)'
                                    : loan.approval_manager_peminjam?.status === 'approved'
                                      ? 'Tahap 1: Disetujui Atasan (Hijau)'
                                      : loan.approval_manager_peminjam?.status === 'skipped'
                                        ? 'Tahap 1: Dilewati Otomatis (Hijau)'
                                        : loan.approval_manager_peminjam?.status === 'rejected'
                                          ? 'Tahap 1: Ditolak (Merah)'
                                          : 'Tahap 1: Belum Disetujui (Abu-abu)'
                                }
                                style={{
                                  width: 14,
                                  height: 6,
                                  borderRadius: 3,
                                  background:
                                    loan.status === 'DIKEMBALIKAN' ||
                                      loan.approval_manager_peminjam?.status === 'approved' ||
                                      loan.approval_manager_peminjam?.status === 'skipped'
                                      ? '#16a34a'
                                      : loan.approval_manager_peminjam?.status === 'rejected'
                                        ? '#dc2626'
                                        : '#cbd5e1',
                                }}
                              />
                              <span
                                title={
                                  loan.status === 'DIKEMBALIKAN'
                                    ? 'Tahap 2: Selesai Disetujui (Hijau)'
                                    : loan.approval_pengelola?.status === 'approved'
                                      ? 'Tahap 2: Disetujui Pengelola (Hijau)'
                                      : loan.approval_pengelola?.status === 'rejected'
                                        ? 'Tahap 2: Ditolak (Merah)'
                                        : 'Tahap 2: Belum Disetujui (Abu-abu)'
                                }
                                style={{
                                  width: 14,
                                  height: 6,
                                  borderRadius: 3,
                                  background:
                                    loan.status === 'DIKEMBALIKAN' ||
                                      loan.approval_pengelola?.status === 'approved'
                                      ? '#16a34a'
                                      : loan.approval_pengelola?.status === 'rejected'
                                        ? '#dc2626'
                                        : '#cbd5e1',
                                }}
                              />
                              <span
                                title={
                                  loan.status === 'DIKEMBALIKAN'
                                    ? 'Tahap 3: Selesai Disetujui (Hijau)'
                                    : loan.approval_manager_lab?.status === 'approved'
                                      ? 'Tahap 3: Disetujui Manager Lab (Hijau)'
                                      : loan.approval_manager_lab?.status === 'rejected'
                                        ? 'Tahap 3: Ditolak (Merah)'
                                        : 'Tahap 3: Belum Disetujui (Abu-abu)'
                                }
                                style={{
                                  width: 14,
                                  height: 6,
                                  borderRadius: 3,
                                  background:
                                    loan.status === 'DIKEMBALIKAN' ||
                                      loan.approval_manager_lab?.status === 'approved'
                                      ? '#16a34a'
                                      : loan.approval_manager_lab?.status === 'rejected'
                                        ? '#dc2626'
                                        : '#cbd5e1',
                                }}
                              />
                              <span
                                title={
                                  loan.status === 'DIKEMBALIKAN'
                                    ? 'Tahap 4 & Selesai: Telah Dikembalikan (Hijau)'
                                    : loan.status === 'SEDANG_DIPINJAM'
                                      ? 'Tahap 4: Selesai Diserahkan (Hijau)'
                                      : loan.status === 'DIBATALKAN_TS'
                                        ? 'Tahap 4: Dibatalkan TS (Merah)'
                                        : 'Tahap 4: Belum Diserahkan (Abu-abu)'
                                }
                                style={{
                                  width: 14,
                                  height: 6,
                                  borderRadius: 3,
                                  background:
                                    loan.status === 'DIKEMBALIKAN' || loan.status === 'SEDANG_DIPINJAM'
                                      ? '#16a34a'
                                      : loan.status === 'DIBATALKAN_TS'
                                        ? '#dc2626'
                                        : '#cbd5e1',
                                }}
                              />
                            </div>
                          </td>

                          {/* 7. Tombol Aksi Berdasarkan Wewenang Role */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'top', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'stretch', width: '100%', maxWidth: '145px', margin: '0 auto' }}>
                              {isReadyForHandover ? (
                                <button
                                  type="button"
                                  className={`btn ${pendingAction?.step === 'peminjam' ? 'btn-success' : 'btn-warning'} btn-sm`}
                                  onClick={() => handleOpenCheckout(loan)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 5,
                                    fontSize: '12px',
                                    padding: '5px 10px',
                                    height: '28px',
                                    boxSizing: 'border-box',
                                    background: pendingAction?.step === 'peminjam' ? '#16a34a' : '#ea580c',
                                    borderColor: pendingAction?.step === 'peminjam' ? '#15803d' : '#c2410c',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                                  }}
                                >
                                  {pendingAction?.step === 'peminjam' ? (
                                    <>
                                      <CheckCircle2 size={13} /> Konfirmasi & TTD
                                    </>
                                  ) : (
                                    <>
                                      <Package size={13} /> Serah Terima
                                    </>
                                  )}
                                </button>
                              ) : isWaitingForReview ? (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleOpenReview(loan)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 5,
                                    fontSize: '12px',
                                    padding: '5px 10px',
                                    height: '28px',
                                    boxSizing: 'border-box',
                                    fontWeight: 600,
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                                  }}
                                >
                                  <ShieldCheck size={13} /> Tinjau Peminjaman
                                </button>
                              ) : loan.status === 'SEDANG_DIPINJAM' ? (
                                <>
                                  {/* Jika ada perpanjangan yang menunggu persetujuan Manager Lab */}
                                  {loan.perpanjangan?.some((p) => p.status === 'menunggu') ? (
                                    (isManagerLab || isAdmin) ? (
                                      <button
                                        type="button"
                                        className="btn btn-warning btn-sm"
                                        onClick={() => handleOpenExtensionReview(loan)}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: 5,
                                          fontSize: '12px',
                                          padding: '5px 10px',
                                          height: '28px',
                                          boxSizing: 'border-box',
                                          background: '#ea580c',
                                          borderColor: '#c2410c',
                                          color: '#ffffff',
                                          fontWeight: 600,
                                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                                        }}
                                        title="Ada pengajuan perpanjangan yang membutuhkan review & pengesahan Manager Lab"
                                      >
                                        <ShieldCheck size={13} /> Review Perpanjangan
                                      </button>
                                    ) : (
                                      <span
                                        className="badge badge-warning"
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: 4,
                                          fontSize: '11px',
                                          padding: '4px 8px',
                                          height: '28px',
                                          boxSizing: 'border-box',
                                          cursor: 'default',
                                        }}
                                        title="Permohonan perpanjangan sedang menunggu pengesahan Manager Lab"
                                      >
                                        <Clock size={11} /> Menunggu Mgr Lab
                                      </span>
                                    )
                                  ) : (
                                    /* Jika status SEDANG_DIPINJAM dan peminjam dapat mengajukan perpanjangan */
                                    (isPeminjam || isAdmin) && loan.dapat_diperpanjang ? (
                                      <button
                                        type="button"
                                        className="btn btn-sm"
                                        onClick={() => handleOpenExtensionRequest(loan)}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: 5,
                                          fontSize: '12px',
                                          padding: '5px 10px',
                                          height: '28px',
                                          boxSizing: 'border-box',
                                          background: '#f59e0b',
                                          borderColor: '#d97706',
                                          color: '#ffffff',
                                          fontWeight: 600,
                                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                                        }}
                                        title="Ajukan permohonan perpanjangan waktu pengembalian peralatan"
                                      >
                                        <CalendarClock size={13} /> Ajukan Perpanjangan
                                      </button>
                                    ) : null
                                  )}

                                  {(isPengelola || isAdmin) ? (
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      onClick={() => handleOpenReturn(loan)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 5,
                                        fontSize: '12px',
                                        padding: '5px 10px',
                                        height: '28px',
                                        boxSizing: 'border-box',
                                        background: '#0284c7',
                                        borderColor: '#0369a1',
                                        color: '#ffffff',
                                        fontWeight: 600,
                                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                                      }}
                                      title="Lakukan pemeriksaan fisik pengembalian peralatan & tanda tangan bersama peminjam"
                                    >
                                      <ClipboardCheck size={13} /> Pengembalian
                                    </button>
                                  ) : null}
                                </>
                              ) : null}

                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenDetail(loan)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 5,
                                  fontSize: '12px',
                                  padding: '5px 10px',
                                  height: '28px',
                                  boxSizing: 'border-box',
                                  fontWeight: 600,
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                                }}
                                title="Lihat detail lengkap peminjaman dan riwayat logbook"
                              >
                                <Eye size={13} /> Detail
                              </button>

                              {(loan.approval_manager_lab?.status === 'approved' ||
                                ['DISETUJUI', 'MENUNGGU_SERAH_TERIMA', 'SIAP_DISERAHKAN', 'SEDANG_DIPINJAM', 'DIKEMBALIKAN'].includes(loan.status)) && (
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => exportLoanF006Pdf(loan)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 5,
                                      fontSize: '12px',
                                      padding: '5px 10px',
                                      height: '28px',
                                      boxSizing: 'border-box',
                                      color: '#1d4ed8',
                                      borderColor: '#bfdbfe',
                                      background: '#eff6ff',
                                      fontWeight: 600,
                                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                                    }}
                                    title="Cetak Surat Keterangan Peminjaman Peralatan (TLKM13/F/006 Versi 03)"
                                  >
                                    <Printer size={13} /> PDF
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
      {/* 6. MODAL 1: REVIEW PERSETUJUAN (TAHAP 1, 2, 3) & DETAIL             */}
      {/* ==================================================================== */}
      {selectedLoan && modalMode !== 'checkout' && modalMode !== 'return' && modalMode !== 'extension_request' && modalMode !== 'extension_review' && (() => {
        const isReviewAction = modalMode === 'review' && getPendingActionForUser(selectedLoan)?.canReview;
        return (
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
              ref={modalContentRef}
              style={{
                width: '100%',
                maxWidth: '960px',
                maxHeight: '92vh',
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
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>
                    Lembar Persetujuan Peminjaman Peralatan
                  </h2>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', marginTop: 3 }}>
                    Formulir Otorisasi & Riwayat Persetujuan Peminjaman
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Tombol Cetak F/006 bila sudah disahkan Manager Lab atau masuk proses serah terima */}
                  {(selectedLoan.approval_manager_lab?.status === 'approved' ||
                    ['DISETUJUI', 'MENUNGGU_SERAH_TERIMA', 'SIAP_DISERAHKAN', 'SEDANG_DIPINJAM', 'DIKEMBALIKAN'].includes(selectedLoan.status)) && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontWeight: 600,
                          color: '#1e40af',
                          borderColor: '#bfdbfe',
                          background: '#eff6ff',
                          padding: '5px 12px',
                          height: '32px',
                        }}
                        onClick={() => exportLoanF006Pdf(selectedLoan)}
                        title="Cetak Surat Keterangan Peminjaman Peralatan (TLKM13/F/006 Versi 03)"
                      >
                        <Printer size={14} /> Cetak F/006 (PDF)
                      </button>
                    )}
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon"
                    onClick={() => setSelectedLoan(null)}
                    aria-label="Tutup"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ padding: 'var(--sp-6)' }}>
                {/* Banner Informasi / Aksi Perpanjangan Peminjaman */}
                {selectedLoan.status === 'SEDANG_DIPINJAM' && (() => {
                  const waitingPj = selectedLoan.perpanjangan?.find((p) => p.status === 'menunggu');
                  const { isPeminjam, isManagerLab, isAdmin } = getLoanUserRelationship(selectedLoan);

                  if (waitingPj) {
                    return (
                      <div
                        style={{
                          padding: '12px 16px',
                          background: '#fffbeb',
                          border: '1.5px solid #fef3c7',
                          borderRadius: 'var(--radius-md, 8px)',
                          marginBottom: 'var(--sp-4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 10,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Clock size={24} style={{ color: '#d97706', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#92400e', fontSize: '13px' }}>
                              Permohonan Perpanjangan Waktu Sedang Diproses
                            </div>
                            <div style={{ color: '#78350f', fontSize: '11px', marginTop: 2 }}>
                              Permintaan kembali hingga <strong>{waitingPj.tanggal_kembali_baru}</strong> diajukan pada {waitingPj.diajukan_pada ? String(waitingPj.diajukan_pada).slice(0, 10) : '-'}. Menunggu pengesahan Manager Lab.
                            </div>
                          </div>
                        </div>
                        {(isManagerLab || isAdmin) && (
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => handleOpenExtensionReview(selectedLoan)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: '#ea580c',
                              borderColor: '#c2410c',
                              color: '#ffffff',
                              fontWeight: 600,
                              fontSize: '12px',
                              padding: '6px 14px',
                            }}
                          >
                            <ShieldCheck size={14} /> Review & Putuskan Perpanjangan
                          </button>
                        )}
                      </div>
                    );
                  }

                  if (selectedLoan.dapat_diperpanjang && (isPeminjam || isAdmin)) {
                    return (
                      <div
                        style={{
                          padding: '12px 16px',
                          background: '#fefce8',
                          border: '1.5px solid #fef08a',
                          borderRadius: 'var(--radius-md, 8px)',
                          marginBottom: 'var(--sp-4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 10,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <CalendarClock size={24} style={{ color: '#ca8a04', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#854d0e', fontSize: '13px' }}>
                              Peralatan Sedang Aktif Digunakan
                            </div>
                            <div style={{ color: '#713f12', fontSize: '11px', marginTop: 2 }}>
                              Butuh waktu lebih lama untuk pengujian? Anda dapat mengajukan permohonan perpanjangan waktu pengembalian.
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => handleOpenExtensionRequest(selectedLoan)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#eab308',
                            borderColor: '#ca8a04',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '12px',
                            padding: '6px 14px',
                          }}
                        >
                          <CalendarClock size={14} /> Ajukan Perpanjangan Waktu
                        </button>
                      </div>
                    );
                  }

                  return null;
                })()}

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
                    <div>
                      <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Tujuan Penggunaan:</span>
                      <strong>{selectedLoan.tujuan_penggunaan || '-'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>No. SPK:</span>
                      <strong>{selectedLoan.nomor_spk || '-'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Lokasi Penggunaan:</span>
                      {selectedLoan.lokasi_penggunaan}
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Lingkup Peminjaman:</span>
                      <span className={`badge ${selectedLoan.is_eksternal ? 'badge-error' : 'badge-gray'}`} style={{ fontSize: '11px' }}>
                        {selectedLoan.is_eksternal ? 'Eksternal' : 'Internal'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Rencana Tanggal Peminjaman dan Pengembalian:</span>
                      <strong>{selectedLoan.rencana_tanggal_keluar}</strong> s.d <strong>{selectedLoan.rencana_tanggal_kembali}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Jatuh Tempo Kalibrasi:</span>
                      <strong>{selectedLoan.peralatan?.tgl_jatuh_tempo || '-'}</strong>
                    </div>
                  </div>
                </div>

                {/* 1. Lembar Otorisasi Persetujuan 3 Tingkat */}
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
                      padding: '8px 12px',
                      background: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Award size={16} style={{ color: 'var(--clr-primary-500)' }} />
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                      Lembar Otorisasi Persetujuan 3 Tingkat
                    </strong>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      borderBottom: '1px solid #e2e8f0',
                      background: '#f1f5f9',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>
                      1. Menyetujui:<br />
                      <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '10px' }}>MANAGER PEMINJAM</span>
                    </div>
                    <div style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0' }}>
                      2. Diperiksa Teknis:<br />
                      <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '10px' }}>PENGELOLA PERALATAN</span>
                    </div>
                    <div style={{ padding: '6px 8px' }}>
                      3. Disahkan:<br />
                      <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '10px' }}>MANAGER LAB PEMILIK</span>
                    </div>
                  </div>

                  {/* Konten Box Tanda Tangan */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      minHeight: 110,
                      fontSize: '11px',
                    }}
                  >
                    {/* TTD 1: Manager Peminjam */}
                    <div style={{ padding: 8, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{selectedLoan.approval_manager_peminjam?.nama || 'Manajer Peminjam'}</div>
                        <div style={{ color: '#64748b', fontSize: '10px' }}>NIP: {selectedLoan.approval_manager_peminjam?.nip || '-'}</div>
                      </div>
                      <div style={{ margin: '4px 0', textAlign: 'center', minHeight: 55, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedLoan.approval_manager_peminjam?.status === 'skipped' ? (
                          <div style={{ borderBottom: '1px dashed #0284c7', paddingBottom: 2, display: 'inline-block' }}>
                            <span style={{ color: '#0284c7', fontWeight: 'bold', fontSize: '10.5px' }}>[ DILEWATI ]</span>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>Manajer Sama</div>
                          </div>
                        ) : selectedLoan.approval_manager_peminjam?.status === 'approved' || selectedLoan.approval_manager_peminjam?.ttd ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {selectedLoan.approval_manager_peminjam?.ttd ? (
                              <img
                                src={selectedLoan.approval_manager_peminjam.ttd}
                                alt="TTD Manager Peminjam"
                                style={{ maxHeight: 50, maxWidth: '100%', objectFit: 'contain' }}
                              />
                            ) : (
                              <div style={{ borderBottom: '1px dashed #16a34a', paddingBottom: 2, display: 'inline-block' }}>
                                <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '11px' }}>[ VALIDASI DISETUJUI ]</span>
                              </div>
                            )}
                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: 2 }}>
                              {selectedLoan.approval_manager_peminjam?.tanggal ? String(selectedLoan.approval_manager_peminjam.tanggal).slice(0, 10) : ''}
                            </div>
                          </div>
                        ) : selectedLoan.approval_manager_peminjam?.status === 'rejected' ? (
                          <div style={{ borderBottom: '1px dashed #dc2626', paddingBottom: 2, display: 'inline-block' }}>
                            <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '11px' }}>[ DITOLAK ]</span>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>
                              {selectedLoan.approval_manager_peminjam?.tanggal ? String(selectedLoan.approval_manager_peminjam.tanggal).slice(0, 10) : ''}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '10.5px' }}>Belum Validasi</span>
                        )}
                      </div>
                      <div style={{ color: '#475569', fontSize: '10px' }}>
                        {selectedLoan.approval_manager_peminjam?.catatan ? `"${selectedLoan.approval_manager_peminjam.catatan}"` : '-'}
                      </div>
                    </div>

                    {/* TTD 2: Pengelola Peralatan */}
                    <div style={{ padding: 8, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{selectedLoan.approval_pengelola?.nama || 'Pengelola Lab'}</div>
                        <div style={{ color: '#64748b', fontSize: '10px' }}>NIP: {selectedLoan.approval_pengelola?.nip || '-'}</div>
                      </div>
                      <div style={{ margin: '4px 0', textAlign: 'center', minHeight: 55, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedLoan.approval_pengelola?.status === 'approved' || selectedLoan.approval_pengelola?.ttd ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {selectedLoan.approval_pengelola?.ttd ? (
                              <img
                                src={selectedLoan.approval_pengelola.ttd}
                                alt="TTD Pengelola"
                                style={{ maxHeight: 50, maxWidth: '100%', objectFit: 'contain' }}
                              />
                            ) : (
                              <div style={{ borderBottom: '1px dashed #16a34a', paddingBottom: 2, display: 'inline-block' }}>
                                <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '11px' }}>[ LOLOS VERIFIKASI ]</span>
                              </div>
                            )}
                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: 2 }}>
                              {selectedLoan.approval_pengelola?.tanggal ? String(selectedLoan.approval_pengelola.tanggal).slice(0, 10) : ''}
                            </div>
                          </div>
                        ) : selectedLoan.approval_pengelola?.status === 'rejected' ? (
                          <div style={{ borderBottom: '1px dashed #dc2626', paddingBottom: 2, display: 'inline-block' }}>
                            <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '11px' }}>[ DITOLAK ]</span>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>
                              {selectedLoan.approval_pengelola?.tanggal ? String(selectedLoan.approval_pengelola.tanggal).slice(0, 10) : ''}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '10.5px' }}>Belum Diperiksa</span>
                        )}

                        {selectedLoan.approval_pengelola?.alat_alternatif && (
                          <div style={{ marginTop: 4, padding: '2px 6px', background: '#fef3c7', borderRadius: 4, fontSize: '10px', color: '#92400e', textAlign: 'left' }}>
                            Saran Pengganti: <strong>{selectedLoan.approval_pengelola.alat_alternatif.nama_peralatan}</strong>
                          </div>
                        )}
                      </div>
                      <div style={{ color: '#475569', fontSize: '10px' }}>
                        {selectedLoan.approval_pengelola?.catatan ? `"${selectedLoan.approval_pengelola.catatan}"` : '-'}
                      </div>
                    </div>

                    {/* TTD 3: Manager Lab */}
                    <div style={{ padding: 8, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{selectedLoan.approval_manager_lab?.nama || 'Manager Lab'}</div>
                        <div style={{ color: '#64748b', fontSize: '10px' }}>NIP: {selectedLoan.approval_manager_lab?.nip || '-'}</div>
                      </div>
                      <div style={{ margin: '4px 0', textAlign: 'center', minHeight: 55, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedLoan.approval_manager_lab?.status === 'approved' || selectedLoan.approval_manager_lab?.ttd ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {selectedLoan.approval_manager_lab?.ttd ? (
                              <img
                                src={selectedLoan.approval_manager_lab.ttd}
                                alt="TTD Manager Lab"
                                style={{ maxHeight: 50, maxWidth: '100%', objectFit: 'contain' }}
                              />
                            ) : (
                              <div style={{ borderBottom: '1px dashed #16a34a', paddingBottom: 2, display: 'inline-block' }}>
                                <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '11px' }}>[ DISAHKAN ]</span>
                              </div>
                            )}
                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: 2 }}>
                              {selectedLoan.approval_manager_lab?.tanggal ? String(selectedLoan.approval_manager_lab.tanggal).slice(0, 10) : ''}
                            </div>
                          </div>
                        ) : selectedLoan.approval_manager_lab?.status === 'rejected' ? (
                          <div style={{ borderBottom: '1px dashed #dc2626', paddingBottom: 2, display: 'inline-block' }}>
                            <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '11px' }}>[ DITOLAK ]</span>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>
                              {selectedLoan.approval_manager_lab?.tanggal ? String(selectedLoan.approval_manager_lab.tanggal).slice(0, 10) : ''}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '10.5px' }}>Belum Disahkan</span>
                        )}
                      </div>
                      <div style={{ color: '#475569', fontSize: '10px' }}>
                        {selectedLoan.approval_manager_lab?.catatan ? `"${selectedLoan.approval_manager_lab.catatan}"` : '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. HASIL VERIFIKASI KELAYAKAN & KETERSEDIAAN ALAT (PENGELOLA) */}
                {(!isReviewAction || activeReviewStage !== 'pengelola') && (() => {
                  const isCurrentlyReviewingByPengelola = modalMode === 'review' && activeReviewStage === 'pengelola';
                  const pengelolaStatus = selectedLoan.approval_pengelola?.status;

                  // Status butir 1: Status & Jadwal Kalibrasi
                  const item1Checked = isCurrentlyReviewingByPengelola
                    ? techCheckSchedule
                    : pengelolaStatus === 'approved'
                      ? true
                      : pengelolaStatus === 'rejected'
                        ? (selectedLoan.approval_pengelola?.cek_jadwal_kalibrasi ?? false)
                        : null;

                  // Status butir 2: Kesesuaian Spesifikasi
                  const item2Checked = isCurrentlyReviewingByPengelola
                    ? techCheckSpec
                    : pengelolaStatus === 'approved'
                      ? true
                      : pengelolaStatus === 'rejected'
                        ? (selectedLoan.approval_pengelola?.cek_spesifikasi ?? false)
                        : null;

                  // Status butir 3: Kewenangan Operator
                  const item3Checked = isCurrentlyReviewingByPengelola
                    ? techCheckOperator
                    : pengelolaStatus === 'approved'
                      ? true
                      : pengelolaStatus === 'rejected'
                        ? (selectedLoan.approval_pengelola?.cek_operator ?? false)
                        : null;

                  // Status butir 4: Kesiapan Lokasi Eksternal
                  const item4Checked = isCurrentlyReviewingByPengelola
                    ? techCheckLocation
                    : pengelolaStatus === 'approved'
                      ? true
                      : pengelolaStatus === 'rejected'
                        ? (selectedLoan.approval_pengelola?.cek_lokasi ?? false)
                        : null;

                  const isAllPassed = item1Checked && item2Checked && item3Checked && (!selectedLoan.is_eksternal || item4Checked);
                  const hasFailedItem = item1Checked === false || item2Checked === false || item3Checked === false || (selectedLoan.is_eksternal && item4Checked === false);

                  return (
                    <div
                      className="card"
                      style={{
                        padding: 'var(--sp-4)',
                        background: '#ffffff',
                        border: hasFailedItem ? '1.5px solid #fecaca' : isAllPassed ? '1.5px solid #bbf7d0' : '1px solid #cbd5e1',
                        borderRadius: 'var(--radius-md, 8px)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                        <div>
                          <h3 style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ShieldCheck size={16} style={{ color: hasFailedItem ? '#dc2626' : isAllPassed ? '#16a34a' : '#2563eb' }} />
                            Verifikasi Kelayakan & Ketersediaan Peralatan (Pengelola)
                          </h3>
                          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: 1 }}>
                            Jika ada 1 butir tidak terpenuhi / tidak diceklis, status otomatis <strong>Ditolak</strong>.
                          </div>
                        </div>
                        <span
                          className={`badge ${hasFailedItem || pengelolaStatus === 'rejected'
                            ? 'badge-error'
                            : isAllPassed || pengelolaStatus === 'approved'
                              ? 'badge-success'
                              : 'badge-gray'
                            }`}
                          style={{ fontSize: '10.5px' }}
                        >
                          {isCurrentlyReviewingByPengelola
                            ? (hasFailedItem
                              ? '✕ Ditolak Otomatis (Ada Butir Tidak Diceklis)'
                              : '✓ Semua Butir Diceklis (Lolos Verifikasi)')
                            : pengelolaStatus === 'approved'
                              ? '✓ Lolos Verifikasi Kelayakan'
                              : pengelolaStatus === 'rejected'
                                ? '✕ Ditolak Pengelola (Tidak Memenuhi Syarat)'
                                : 'Menunggu Pemeriksaan Pengelola'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 6, fontSize: '11.5px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 6,
                          padding: '6px 8px',
                          background: item1Checked === true ? '#f0fdf4' : item1Checked === false ? '#fef2f2' : '#f8fafc',
                          borderRadius: 6,
                          border: `1px solid ${item1Checked === true ? '#bbf7d0' : item1Checked === false ? '#fecaca' : '#e2e8f0'}`,
                        }}>
                          {item1Checked === true ? (
                            <CheckCircle2 size={14} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
                          ) : item1Checked === false ? (
                            <XCircle size={14} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
                          ) : (
                            <Clock size={14} style={{ color: '#64748b', flexShrink: 0, marginTop: 1 }} />
                          )}
                          <div>
                            <strong>1. Status & Jadwal Kalibrasi</strong>
                            <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                              Jatuh tempo: {selectedLoan.peralatan?.tgl_jatuh_tempo || '-'} (Alat layak pakai)
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: 600, marginTop: 2, color: item1Checked === true ? '#16a34a' : item1Checked === false ? '#dc2626' : '#64748b' }}>
                              {item1Checked === true ? '✓ Diceklis (Memenuhi Syarat)' : item1Checked === false ? '✕ Tidak Diceklis (Gagal)' : '⏳ Belum Diperiksa'}
                            </div>
                          </div>
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 6,
                          padding: '6px 8px',
                          background: item2Checked === true ? '#f0fdf4' : item2Checked === false ? '#fef2f2' : '#f8fafc',
                          borderRadius: 6,
                          border: `1px solid ${item2Checked === true ? '#bbf7d0' : item2Checked === false ? '#fecaca' : '#e2e8f0'}`,
                        }}>
                          {item2Checked === true ? (
                            <CheckCircle2 size={14} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
                          ) : item2Checked === false ? (
                            <XCircle size={14} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
                          ) : (
                            <Clock size={14} style={{ color: '#64748b', flexShrink: 0, marginTop: 1 }} />
                          )}
                          <div>
                            <strong>2. Kesesuaian Spesifikasi</strong>
                            <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                              Rentang & toleransi alat sesuai pengujian
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: 600, marginTop: 2, color: item2Checked === true ? '#16a34a' : item2Checked === false ? '#dc2626' : '#64748b' }}>
                              {item2Checked === true ? '✓ Diceklis (Memenuhi Syarat)' : item2Checked === false ? '✕ Tidak Diceklis (Gagal)' : '⏳ Belum Diperiksa'}
                            </div>
                          </div>
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 6,
                          padding: '6px 8px',
                          background: item3Checked === true ? '#f0fdf4' : item3Checked === false ? '#fef2f2' : '#f8fafc',
                          borderRadius: 6,
                          border: `1px solid ${item3Checked === true ? '#bbf7d0' : item3Checked === false ? '#fecaca' : '#e2e8f0'}`,
                        }}>
                          {item3Checked === true ? (
                            <CheckCircle2 size={14} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
                          ) : item3Checked === false ? (
                            <XCircle size={14} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
                          ) : (
                            <Clock size={14} style={{ color: '#64748b', flexShrink: 0, marginTop: 1 }} />
                          )}
                          <div>
                            <strong>3. Kewenangan Operator</strong>
                            <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                              Operator: {selectedLoan.peminjam?.operator || selectedLoan.peminjam?.nama || '-'}
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: 600, marginTop: 2, color: item3Checked === true ? '#16a34a' : item3Checked === false ? '#dc2626' : '#64748b' }}>
                              {item3Checked === true ? '✓ Diceklis (Memenuhi Syarat)' : item3Checked === false ? '✕ Tidak Diceklis (Gagal)' : '⏳ Belum Diperiksa'}
                            </div>
                          </div>
                        </div>

                        {selectedLoan.is_eksternal && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 6,
                            padding: '6px 8px',
                            background: item4Checked === true ? '#f0fdf4' : item4Checked === false ? '#fef2f2' : '#f8fafc',
                            borderRadius: 6,
                            border: `1px solid ${item4Checked === true ? '#bbf7d0' : item4Checked === false ? '#fecaca' : '#e2e8f0'}`,
                          }}>
                            {item4Checked === true ? (
                              <CheckCircle2 size={14} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
                            ) : item4Checked === false ? (
                              <XCircle size={14} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
                            ) : (
                              <Clock size={14} style={{ color: '#64748b', flexShrink: 0, marginTop: 1 }} />
                            )}
                            <div>
                              <strong>4. Kesiapan Lokasi Eksternal</strong>
                              <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                                Lokasi: {selectedLoan.lokasi_penggunaan}
                              </div>
                              <div style={{ fontSize: '10px', fontWeight: 600, marginTop: 2, color: item4Checked === true ? '#16a34a' : item4Checked === false ? '#dc2626' : '#64748b' }}>
                                {item4Checked === true ? '✓ Diceklis (Memenuhi Syarat)' : item4Checked === false ? '✕ Tidak Diceklis (Gagal)' : '⏳ Belum Diperiksa'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Catatan hasil verifikasi jika ada penolakan */}
                      {(hasFailedItem || pengelolaStatus === 'rejected') && (
                        <div style={{ marginTop: 8, padding: '6px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: '11px', color: '#991b1b' }}>
                          <strong>Catatan Pengelola:</strong> {isCurrentlyReviewingByPengelola ? (decisionNote || 'Terdapat butir verifikasi yang tidak diceklis, keputusan otomatis Ditolak.') : (selectedLoan.approval_pengelola?.catatan || 'Permohonan ditolak pada verifikasi kelayakan & ketersediaan oleh pengelola.')}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* JIKA STATUS SUDAH DISAHKAN MANAGER LAB & SIAP SERAH TERIMA */}
                {(selectedLoan.status === 'MENUNGGU_SERAH_TERIMA' || selectedLoan.status === 'DISETUJUI') && (
                  <div
                    className="alert alert-warning"
                    style={{
                      padding: 'var(--sp-4)',
                      marginBottom: 'var(--sp-5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      background: '#fff7ed',
                      border: '1.5px solid #fed7aa',
                      borderRadius: 'var(--radius-md, 8px)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Package size={24} style={{ color: '#ea580c', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#9a3412', fontSize: '13px' }}>
                          Persetujuan Manager Lab Telah Terbit!
                        </div>
                        <div style={{ fontSize: '12px', color: '#c2410c' }}>
                          {getPendingActionForUser(selectedLoan)?.canHandover
                            ? 'Alur kini diarahkan kepada Anda untuk melakukan pemeriksaan fisik bersama dan pengisian Lampiran A.'
                            : 'Persetujuan izin telah disahkan. Menunggu Pengelola Peralatan dan Peminjam melaksanakan serah terima fisik (Lampiran A).'}
                        </div>
                      </div>
                    </div>
                    {getPendingActionForUser(selectedLoan)?.canHandover && (
                      <button
                        type="button"
                        className="btn btn-warning btn-sm"
                        onClick={() => handleOpenCheckout(selectedLoan)}
                        style={{
                          background: '#ea580c',
                          borderColor: '#c2410c',
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '12px',
                          padding: '6px 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Package size={14} /> Mulai Serah Terima Fisik (Lampiran A)
                      </button>
                    )}
                  </div>
                )}

                {/* JIKA STATUS SUDAH DIPERIKSA PENGELOLA & MENUNGGU KONFIRMASI PEMINJAM */}
                {selectedLoan.status === 'SIAP_DISERAHKAN' && (
                  <div
                    className="alert alert-info"
                    style={{
                      padding: 'var(--sp-4)',
                      marginBottom: 'var(--sp-5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                      background: '#f0f9ff',
                      border: '1.5px solid #bae6fd',
                      borderRadius: 'var(--radius-md, 8px)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle2 size={24} style={{ color: '#0284c7', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#0369a1', fontSize: '13px' }}>
                          Checklist Lampiran A Telah Diisi Pengelola!
                        </div>
                        <div style={{ fontSize: '12px', color: '#0284c7' }}>
                          {getPendingActionForUser(selectedLoan)?.canHandover
                            ? 'Pengelola telah memeriksa dan menandatangani checklist Lampiran A. Silakan konfirmasi penerimaan dan bubuhkan tanda tangan Anda.'
                            : 'Pemeriksaan fisik telah selesai dilakukan oleh Pengelola. Menunggu Peminjam melakukan konfirmasi dan tanda tangan digital.'}
                        </div>
                      </div>
                    </div>
                    {getPendingActionForUser(selectedLoan)?.canHandover && (
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => handleOpenCheckout(selectedLoan)}
                        style={{
                          background: '#16a34a',
                          borderColor: '#15803d',
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '12px',
                          padding: '6px 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <CheckCircle2 size={14} /> Konfirmasi Terima & TTD
                      </button>
                    )}
                  </div>
                )}

                {/* JIKA SUDAH DISERAHKAN (F/010 KELUAR) */}
                {selectedLoan.serah_terima_keluar && (
                  <div
                    className="card"
                    style={{
                      padding: 'var(--sp-4)',
                      marginBottom: 'var(--sp-5)',
                      background: selectedLoan.serah_terima_keluar.ada_ts ? '#fef2f2' : '#f0fdf4',
                      border: selectedLoan.serah_terima_keluar.ada_ts ? '1.5px solid #fecaca' : '1.5px solid #bbf7d0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: selectedLoan.serah_terima_keluar.ada_ts ? '#991b1b' : '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ClipboardCheck size={16} />
                        Rekaman Serah Terima Fisik Keluar (Kolom Keluar)
                      </h4>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Pemeriksaan: {selectedLoan.serah_terima_keluar.tanggal ? String(selectedLoan.serah_terima_keluar.tanggal).slice(0, 10) : '-'}
                        {selectedLoan.serah_terima_keluar.tanggal_diterima && (
                          <> | Diterima: {String(selectedLoan.serah_terima_keluar.tanggal_diterima).slice(0, 10)}</>
                        )}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: '12px', marginBottom: 8 }}>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px' }}>PIC Pengelola (Pemeriksa): </span>
                        <strong>{selectedLoan.serah_terima_keluar.pic_petugas || selectedLoan.approval_pengelola?.nama || '-'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px' }}>Peminjam (Penerima): </span>
                        <strong>{selectedLoan.serah_terima_keluar.peminjam_penerima || selectedLoan.peminjam?.nama || '-'}</strong>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '12px', color: '#334155' }}>
                      <strong>Hasil:</strong>{' '}
                      {selectedLoan.serah_terima_keluar.ada_ts ? (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>
                          Dibatalkan karena terdapat butir Tidak Sesuai (TS). Status alat dialihkan menjadi DO NOT USE.
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>
                          Memenuhi Syarat (Seluruh butir Sesuai/TB). Peralatan diserahterimakan kepada peminjam.
                        </span>
                      )}
                    </p>

                    {selectedLoan.serah_terima_keluar.catatan && (
                      <div style={{ marginTop: 6, fontSize: '12px', color: '#475569' }}>
                        <strong>Catatan:</strong> "{selectedLoan.serah_terima_keluar.catatan}"
                      </div>
                    )}

                    {/* Tanda Tangan Pengelola & Peminjam */}
                    {(selectedLoan.serah_terima_keluar.ttd_pengelola || selectedLoan.serah_terima_keluar.ttd_peminjam) && (
                      <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.06)', flexWrap: 'wrap' }}>
                        {selectedLoan.serah_terima_keluar.ttd_pengelola && (
                          <div style={{ textAlign: 'center', background: '#ffffff', padding: 8, borderRadius: 6, border: '1px dashed #cbd5e1' }}>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: 4 }}>TTD Pengelola (Keluar)</div>
                            <img src={selectedLoan.serah_terima_keluar.ttd_pengelola} alt="TTD Pengelola" style={{ maxHeight: 45, maxWidth: 120, objectFit: 'contain' }} />
                          </div>
                        )}
                        {selectedLoan.serah_terima_keluar.ttd_peminjam && (
                          <div style={{ textAlign: 'center', background: '#ffffff', padding: 8, borderRadius: 6, border: '1px dashed #cbd5e1' }}>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: 4 }}>TTD Peminjam (Keluar)</div>
                            <img src={selectedLoan.serah_terima_keluar.ttd_peminjam} alt="TTD Peminjam" style={{ maxHeight: 45, maxWidth: 120, objectFit: 'contain' }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* JIKA STATUS SEDANG DIPINJAM -> TOMBOL AKSI PENGEMBALIAN */}
                {selectedLoan.status === 'SEDANG_DIPINJAM' && (() => {
                  const modalRel = getLoanUserRelationship(selectedLoan);
                  if (!modalRel.isPengelola && !modalRel.isAdmin) return null;

                  return (
                    <div
                      style={{
                        padding: 'var(--sp-4)',
                        marginBottom: 'var(--sp-5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                        background: '#f0fdf4',
                        border: '1.5px solid #bbf7d0',
                        borderRadius: 'var(--radius-md, 8px)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ClipboardCheck size={24} style={{ color: '#16a34a', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '13px' }}>
                            Pemeriksaan Serah Terima Kembali
                          </div>
                          <div style={{ fontSize: '12px', color: '#15803d' }}>
                            Peralatan diserahkan kembali oleh peminjam. Lakukan pemeriksaan 7 butir fisik & fungsi bersama peminjam dan bubuhkan tanda tangan bersama.
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenReturn(selectedLoan)}
                        style={{
                          background: '#16a34a',
                          borderColor: '#15803d',
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '12px',
                          padding: '6px 14px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <ClipboardCheck size={14} /> Buka Lembar Serah Terima Kembali
                      </button>
                    </div>
                  );
                })()}

                {/* JIKA ADA REKAMAN PENGEMBALIAN */}
                {selectedLoan.serah_terima_kembali && (
                  <div
                    className="card"
                    style={{
                      padding: 'var(--sp-4)',
                      marginBottom: 'var(--sp-5)',
                      background: selectedLoan.serah_terima_kembali.tindak_lanjut === 'DO_NOT_USE' || selectedLoan.serah_terima_kembali.ada_ts || selectedLoan.serah_terima_kembali.ada_kejadian ? '#fef2f2' : '#f0fdf4',
                      border: selectedLoan.serah_terima_kembali.tindak_lanjut === 'DO_NOT_USE' || selectedLoan.serah_terima_kembali.ada_ts || selectedLoan.serah_terima_kembali.ada_kejadian ? '1.5px solid #fecaca' : '1.5px solid #bbf7d0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: selectedLoan.serah_terima_kembali.tindak_lanjut === 'DO_NOT_USE' ? '#991b1b' : '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ClipboardCheck size={16} />
                        Rekaman Pengembalian Peralatan (Kolom Kembali & Bagian D)
                      </h4>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Tanggal Kembali: {selectedLoan.serah_terima_kembali.tanggal ? String(selectedLoan.serah_terima_kembali.tanggal).slice(0, 10) : '-'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: '12px', marginBottom: 10 }}>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px' }}>PIC Pengelola (Penerima): </span>
                        <strong>{selectedLoan.serah_terima_kembali.pic_penerima || selectedLoan.approval_pengelola?.nama || '-'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px' }}>Peminjam (Penyerah): </span>
                        <strong>{selectedLoan.serah_terima_kembali.peminjam_penyerah || selectedLoan.peminjam?.nama || '-'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11px' }}>Tindak Lanjut Sistem: </span>
                        <span
                          className={`badge ${selectedLoan.serah_terima_kembali.tindak_lanjut === 'DO_NOT_USE' ? 'badge-error' : 'badge-info'}`}
                          style={{ fontSize: '11px', fontWeight: 700 }}
                        >
                          {selectedLoan.serah_terima_kembali.tindak_lanjut === 'DO_NOT_USE' ? 'DO NOT USE (Isolasi Alat)' : 'KARANTINA (Verifikasi IK/003)'}
                        </span>
                      </div>
                    </div>

                    {/* Bagian B: Tabel Perbandingan Keluar vs Kembali */}
                    {Array.isArray(selectedLoan.serah_terima_kembali.lampiran_a) && selectedLoan.serah_terima_kembali.lampiran_a.length > 0 && (
                      <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: 6, marginBottom: 10, background: '#ffffff' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                              <th style={{ padding: '6px 8px', width: 28, textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>No.</th>
                              <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1' }}>Butir Pemeriksaan</th>
                              <th style={{ padding: '6px 8px', width: 90, textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>Kondisi Keluar</th>
                              <th style={{ padding: '6px 8px', width: 95, textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>Kondisi Kembali</th>
                              <th style={{ padding: '6px 8px' }}>Keterangan Pengembalian</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedLoan.serah_terima_kembali.lampiran_a.map((it, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '5px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1', color: '#64748b' }}>{it.nomor_butir || idx + 1}.</td>
                                <td style={{ padding: '5px 8px', borderRight: '1px solid #cbd5e1' }}>{it.butir || LAMPIRAN_A_BUTIR[idx]}</td>
                                <td style={{ padding: '5px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <span style={{ fontWeight: 600, color: it.status_keluar === 'TS' ? '#dc2626' : (it.status_keluar === 'N/A' || it.status_keluar === 'TB') ? '#64748b' : '#15803d' }}>
                                    {(it.status_keluar === 'N/A' || it.status_keluar === 'TB') ? 'TB' : (it.status_keluar || '-')}
                                  </span>
                                </td>
                                <td style={{ padding: '5px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                                  <span style={{ fontWeight: 700, color: it.status === 'TS' ? '#dc2626' : (it.status === 'N/A' || it.status === 'TB') ? '#64748b' : '#15803d' }}>
                                    {(it.status === 'N/A' || it.status === 'TB') ? 'TB' : (it.status || '-')}
                                  </span>
                                </td>
                                <td style={{ padding: '5px 8px', color: '#475569' }}>{it.keterangan || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Bagian D: Rekaman Kejadian */}
                    <div style={{ padding: '8px 12px', background: '#ffffff', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: '12px', marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>Bagian D — Kejadian Selama Peminjaman:</div>
                      <div style={{ marginTop: 2, color: selectedLoan.serah_terima_kembali.ada_kejadian ? '#dc2626' : '#15803d' }}>
                        {selectedLoan.serah_terima_kembali.ada_kejadian ? (
                          <>
                            <strong>Ada Kejadian Abnormal:</strong> "{selectedLoan.serah_terima_kembali.uraian_kejadian}"
                          </>
                        ) : (
                          <span>Tidak ada kejadian abnormal selama peminjaman.</span>
                        )}
                      </div>
                      {selectedLoan.serah_terima_kembali.alasan_tindak_lanjut && (
                        <div style={{ marginTop: 4, fontSize: '11px', color: '#64748b' }}>
                          <strong>Catatan Tindak Lanjut:</strong> {selectedLoan.serah_terima_kembali.alasan_tindak_lanjut}
                        </div>
                      )}
                    </div>

                    {selectedLoan.serah_terima_kembali.catatan && (
                      <div style={{ fontSize: '12px', color: '#475569', marginBottom: 8 }}>
                        <strong>Catatan Pengelola:</strong> "{selectedLoan.serah_terima_kembali.catatan}"
                      </div>
                    )}

                    {/* Tanda Tangan Kembali */}
                    {(selectedLoan.serah_terima_kembali.ttd_pengelola || selectedLoan.serah_terima_kembali.ttd_peminjam) && (
                      <div style={{ display: 'flex', gap: 16, marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)', flexWrap: 'wrap' }}>
                        {selectedLoan.serah_terima_kembali.ttd_pengelola && (
                          <div style={{ textAlign: 'center', background: '#ffffff', padding: 8, borderRadius: 6, border: '1px dashed #cbd5e1' }}>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: 4 }}>TTD Pengelola (Penerima)</div>
                            <img src={selectedLoan.serah_terima_kembali.ttd_pengelola} alt="TTD Pengelola" style={{ maxHeight: 45, maxWidth: 120, objectFit: 'contain' }} />
                          </div>
                        )}
                        {selectedLoan.serah_terima_kembali.ttd_peminjam && (
                          <div style={{ textAlign: 'center', background: '#ffffff', padding: 8, borderRadius: 6, border: '1px dashed #cbd5e1' }}>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginBottom: 4 }}>TTD Peminjam (Penyerah)</div>
                            <img src={selectedLoan.serah_terima_kembali.ttd_peminjam} alt="TTD Peminjam" style={{ maxHeight: 45, maxWidth: 120, objectFit: 'contain' }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Riwayat Perpanjangan Peminjaman */}
                {Array.isArray(selectedLoan.perpanjangan) && selectedLoan.perpanjangan.length > 0 && (
                  <div
                    style={{
                      border: '1.5px solid #fed7aa',
                      borderRadius: 'var(--radius-md, 8px)',
                      overflow: 'hidden',
                      background: '#ffffff',
                      marginTop: 'var(--sp-4)',
                    }}
                  >
                    <div
                      style={{
                        padding: '8px 12px',
                        background: '#fff7ed',
                        borderBottom: '1px solid #fed7aa',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <CalendarClock size={16} style={{ color: '#ea580c' }} />
                      <strong style={{ fontSize: '13px', color: '#9a3412' }}>
                        Riwayat Permohonan Perpanjangan Waktu Peminjaman
                      </strong>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                            <th style={{ padding: '8px 10px', textAlign: 'center', width: 40 }}>Ke-</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>Tgl Pengajuan</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>Perubahan Tanggal Kembali</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>Alasan Permohonan</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>Keputusan Manager Lab</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedLoan.perpanjangan.map((item, idx) => {
                            const statusBg =
                              item.status === 'disetujui' ? '#dcfce7' : item.status === 'ditolak' ? '#fee2e2' : '#fef3c7';
                            const statusColor =
                              item.status === 'disetujui' ? '#15803d' : item.status === 'ditolak' ? '#b91c1c' : '#b45309';
                            const statusLabel =
                              item.status === 'disetujui'
                                ? 'Disetujui'
                                : item.status === 'ditolak'
                                  ? 'Ditolak'
                                  : 'Menunggu Verifikasi';

                            return (
                              <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                                <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: '#64748b' }}>
                                  {item.diajukan_pada ? String(item.diajukan_pada).slice(0, 10) : '-'}
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>
                                    {item.tanggal_kembali_lama}
                                  </span>{' '}
                                  ➔ <strong style={{ color: '#059669' }}>{item.tanggal_kembali_baru}</strong>
                                </td>
                                <td style={{ padding: '8px 10px', fontStyle: 'italic', color: '#334155' }}>
                                  "{item.alasan}"
                                </td>
                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                  <span
                                    className="badge"
                                    style={{
                                      background: statusBg,
                                      color: statusColor,
                                      fontSize: '10px',
                                      padding: '2px 8px',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {statusLabel}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 10px', fontSize: '11px' }}>
                                  {item.status === 'menunggu' ? (
                                    <span style={{ color: '#b45309', fontStyle: 'italic' }}>
                                      Menunggu telaah Manager Lab
                                    </span>
                                  ) : (
                                    <div>
                                      <div style={{ color: '#1e293b' }}>
                                        {item.catatan ? item.catatan : '-'}
                                      </div>
                                      <div style={{ color: '#64748b', fontSize: '10px', marginTop: 2 }}>
                                        Oleh: {item.manager_lab?.nama || 'Manager Lab'} •{' '}
                                        {item.diputuskan_pada ? String(item.diputuskan_pada).slice(0, 10) : ''}
                                      </div>
                                      {item.ttd_manager_lab && (
                                        <div style={{ marginTop: 4 }}>
                                          <img
                                            src={item.ttd_manager_lab}
                                            alt="TTD Manager Lab"
                                            style={{ maxHeight: 35, maxWidth: 100, objectFit: 'contain' }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ================================================================ */}
                {/* FORM AKSI APPROVAL AKTIF (OTOMATIS BERDASARKAN WEWENANG AKUN)    */}
                {/* ================================================================ */}
                {isReviewAction && (
                  <form
                    ref={decisionFormRef}
                    id="form-keputusan-approval"
                    onSubmit={handleSubmitDecision}
                    style={{
                      border: '2px solid var(--clr-primary-500, #ee2e24)',
                      borderRadius: 'var(--radius-lg, 12px)',
                      padding: 'var(--sp-5)',
                      background: '#fffdfd',
                      boxShadow: '0 4px 12px rgba(238, 46, 36, 0.08)',
                      marginTop: 'var(--sp-5)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileCheck size={18} style={{ color: '#991b1b' }} />
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#991b1b' }}>
                          Tindakan Keputusan: {' '}
                          {activeReviewStage === 'manager_peminjam' && 'Manager Peminjam (Tahap 1: Validasi Urgensi)'}
                          {activeReviewStage === 'pengelola' && 'Pengelola Peralatan (Tahap 2: Review Teknis & Ketersediaan)'}
                          {activeReviewStage === 'manager_lab' && 'Manager Lab Pemilik (Tahap 3: Pengesahan Final)'}
                        </h4>
                      </div>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '11px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                      >
                        ↑ Lihat Rincian Lembar
                      </button>
                    </div>

                    {/* KHUSUS TAHAP 2 PENGELOLA PERALATAN: CHECKLIST VERIFIKASI TEKNIS (BUKAN LAMPIRAN A!) */}
                    {activeReviewStage === 'pengelola' && (() => {
                      const isAllTechChecksPassed =
                        techCheckSchedule &&
                        techCheckSpec &&
                        techCheckOperator &&
                        (!selectedLoan.is_eksternal || techCheckLocation);

                      return (
                        <div
                          style={{
                            marginBottom: 'var(--sp-4)',
                            padding: '12px',
                            background: isAllTechChecksPassed ? '#eff6ff' : '#fef2f2',
                            borderRadius: '8px',
                            border: isAllTechChecksPassed ? '1.5px solid #bfdbfe' : '1.5px solid #fecaca',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '13px', color: isAllTechChecksPassed ? '#1e40af' : '#991b1b', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <ShieldCheck size={16} />
                              Checklist Verifikasi Kelayakan & Ketersediaan Alat:
                            </div>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 12,
                                background: isAllTechChecksPassed ? '#dbeafe' : '#fee2e2',
                                color: isAllTechChecksPassed ? '#1e40af' : '#b91c1c',
                              }}
                            >
                              {isAllTechChecksPassed ? '✓ Syarat Lengkap' : '✕ Ada Syarat Tidak Terpenuhi'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '12px', color: '#1e293b' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={techCheckSchedule}
                                onChange={(e) => handleTechCheckToggle('schedule', e.target.checked)}
                                style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                              />
                              <span>
                                <strong>1. Status & Jadwal Kalibrasi:</strong> Alat berstatus LAYAK PAKAI dan rencana tanggal kembali ({selectedLoan.rencana_tanggal_kembali}) tidak melampaui tanggal jatuh tempo kalibrasi ({selectedLoan.peralatan?.tgl_jatuh_tempo || '-'}).
                              </span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={techCheckSpec}
                                onChange={(e) => handleTechCheckToggle('spec', e.target.checked)}
                                style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                              />
                              <span>
                                <strong>2. Kesesuaian Spesifikasi:</strong> Rentang ukur, kapasitas, dan batas toleransi alat sesuai dengan tujuan pengujian/kegiatan.
                              </span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={techCheckOperator}
                                onChange={(e) => handleTechCheckToggle('operator', e.target.checked)}
                                style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                              />
                              <span>
                                <strong>3. Kewenangan Operator:</strong> Peminjam / Operator ({selectedLoan.peminjam?.operator || selectedLoan.peminjam?.nama || '-'}) memiliki kewenangan dan kompetensi mengoperasikan alat ini.
                              </span>
                            </label>

                            {selectedLoan.is_eksternal && (
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={techCheckLocation}
                                  onChange={(e) => handleTechCheckToggle('location', e.target.checked)}
                                  style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                                />
                                <span>
                                  <strong>4. Kesiapan Lokasi Eksternal:</strong> Kondisi lingkungan & catu daya di lokasi tujuan ({selectedLoan.lokasi_penggunaan}) memenuhi syarat metode dan spesifikasi alat.
                                </span>
                              </label>
                            )}
                          </div>

                          {!isAllTechChecksPassed && (
                            <div
                              style={{
                                marginTop: 10,
                                padding: '8px 12px',
                                background: '#fee2e2',
                                border: '1px solid #fecaca',
                                borderRadius: 6,
                                fontSize: '11px',
                                color: '#991b1b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                              <span>
                                <strong>Otomatis Ditolak:</strong> Karena terdapat butir verifikasi yang tidak diceklis, keputusan otomatis ditetapkan <strong>Tolak</strong> dan opsi persetujuan dinonaktifkan.
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Pilihan Keputusan */}
                    <div className="form-group" style={{ marginBottom: 'var(--sp-3)' }}>
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        Keputusan {activeReviewStage === 'manager_peminjam'
                          ? 'Manager Peminjam'
                          : activeReviewStage === 'pengelola'
                            ? 'Pengelola Peralatan'
                            : 'Manager Lab'}{' '}
                        <span className="required">*</span>
                      </label>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          id="btn-keputusan-setuju"
                          onClick={() => {
                            const isAllPassed = techCheckSchedule && techCheckSpec && techCheckOperator && (!selectedLoan.is_eksternal || techCheckLocation);
                            if (activeReviewStage === 'pengelola' && !isAllPassed) {
                              toastError('Semua butir kelayakan & ketersediaan wajib diceklis untuk menyetujui peminjaman.');
                              setDecisionAction('tolak');
                              return;
                            }
                            setDecisionAction('setuju');
                          }}
                          disabled={activeReviewStage === 'pengelola' && !(techCheckSchedule && techCheckSpec && techCheckOperator && (!selectedLoan.is_eksternal || techCheckLocation))}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-md, 8px)',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: activeReviewStage === 'pengelola' && !(techCheckSchedule && techCheckSpec && techCheckOperator && (!selectedLoan.is_eksternal || techCheckLocation)) ? 'not-allowed' : 'pointer',
                            opacity: activeReviewStage === 'pengelola' && !(techCheckSchedule && techCheckSpec && techCheckOperator && (!selectedLoan.is_eksternal || techCheckLocation)) ? 0.5 : 1,
                            transition: 'all 0.15s ease',
                            border: decisionAction === 'setuju' ? '2px solid #16a34a' : '1.5px solid #cbd5e1',
                            background: decisionAction === 'setuju' ? '#f0fdf4' : '#ffffff',
                            color: decisionAction === 'setuju' ? '#15803d' : '#475569',
                            boxShadow: decisionAction === 'setuju' ? '0 1px 3px rgba(22, 163, 74, 0.15)' : 'none',
                          }}
                        >
                          <CheckCircle2 size={16} style={{ color: decisionAction === 'setuju' ? '#16a34a' : '#94a3b8' }} />
                          <span>Setuju</span>
                        </button>

                        <button
                          type="button"
                          id="btn-keputusan-tolak"
                          onClick={() => setDecisionAction('tolak')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-md, 8px)',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            border: decisionAction === 'tolak' ? '2px solid #dc2626' : '1.5px solid #cbd5e1',
                            background: decisionAction === 'tolak' ? '#fef2f2' : '#ffffff',
                            color: decisionAction === 'tolak' ? '#b91c1c' : '#475569',
                            boxShadow: decisionAction === 'tolak' ? '0 1px 3px rgba(220, 38, 38, 0.15)' : 'none',
                          }}
                        >
                          <XCircle size={16} style={{ color: decisionAction === 'tolak' ? '#dc2626' : '#94a3b8' }} />
                          <span>Tolak</span>
                        </button>
                      </div>
                    </div>

                    {/* Catatan Keputusan */}
                    <div className="form-group" style={{ marginBottom: 'var(--sp-3)' }}>
                      <label className="form-label">
                        {decisionAction === 'setuju' ? 'Catatan / Arahan (Opsional)' : 'Alasan Penolakan (Wajib)'}
                      </label>
                      <textarea
                        className="form-textarea"
                        rows={2}
                        placeholder={
                          decisionAction === 'setuju'
                            ? 'Catatan pemeriksaan teknis atau instruksi khusus...'
                            : 'Uraikan alasan penolakan peralatan...'
                        }
                        value={decisionNote}
                        onChange={(e) => setDecisionNote(e.target.value)}
                        required={decisionAction === 'tolak'}
                      />
                    </div>

                    {/* Opsi Usulan Peralatan Alternatif (Khusus Pengelola saat Menolak) */}
                    {decisionAction === 'tolak' && activeReviewStage === 'pengelola' && (
                      <div className="form-group" style={{ marginBottom: 'var(--sp-3)' }}>
                        <label className="form-label" htmlFor="input-alat-alternatif">
                          Usulkan Peralatan Alternatif <span className="form-hint" style={{ display: 'inline' }}>(Opsional)</span>
                        </label>
                        <select
                          id="input-alat-alternatif"
                          className="form-select"
                          value={alternativeEquipmentId}
                          onChange={(e) => setAlternativeEquipmentId(e.target.value)}
                        >
                          <option value="">-- Tidak Ada Usulan Alat Pengganti --</option>
                          {equipmentList
                            .filter((eq) => String(eq.id) !== String(selectedLoan?.peralatan?.id))
                            .map((eq) => (
                              <option key={eq.id} value={eq.id}>
                                {eq.nama_peralatan} ({eq.nomor_aset || 'Tanpa No. Aset'})
                              </option>
                            ))}
                        </select>
                        <span className="form-hint">
                          Alat alternatif ini dapat disarankan kepada peminjam sebagai opsi pengganti yang layak.
                        </span>
                      </div>
                    )}

                    {/* Signature Pad */}
                    {decisionAction === 'setuju' && (
                      <DigitalSignaturePad
                        value={digitalSignature}
                        onChange={setDigitalSignature}
                        label={`Tanda Tangan Digital ${activeReviewStage === 'manager_peminjam'
                          ? 'Manager Peminjam'
                          : activeReviewStage === 'pengelola'
                            ? 'Pengelola Peralatan'
                            : 'Manager Lab'
                          }`}
                        required
                      />
                    )}

                    {/* Tombol Eksekusi Modal */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 'var(--sp-4)' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setSelectedLoan(null)}
                        style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600 }}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className={`btn ${decisionAction === 'setuju' ? 'btn-primary' : 'btn-secondary'}`}
                        disabled={isSubmitting}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 20px',
                          fontSize: '13px',
                          fontWeight: 600,
                          ...(decisionAction !== 'setuju' ? { color: '#dc2626', borderColor: '#fca5a5' } : {}),
                        }}
                      >
                        {decisionAction === 'setuju' ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                        {isSubmitting
                          ? 'Memproses...'
                          : decisionAction === 'setuju'
                            ? 'Konfirmasi Persetujuan'
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
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  SiKEPo — Sistem Informasi Kelayakan Peralatan
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedLoan(null)}
                  style={{ padding: '6px 16px', fontSize: '12px', fontWeight: 600 }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================================================================== */}
      {/* 7. MODAL 2: SERAH TERIMA FISIK KELUAR (TAHAP 4 - LAMPIRAN A)          */}
      {/* ==================================================================== */}
      {selectedLoan && modalMode === 'checkout' && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
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
            ref={checkoutModalRef}
            style={{
              width: '100%',
              maxWidth: '960px',
              maxHeight: '92vh',
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
                borderBottom: checkoutStep === 'peminjam' ? '1.5px solid #7dd3fc' : '1.5px solid #fdba74',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: checkoutStep === 'peminjam' ? '#f0f9ff' : '#fff7ed',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Package size={22} style={{ color: checkoutStep === 'peminjam' ? '#0284c7' : '#ea580c' }} />
                  <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: 0, color: checkoutStep === 'peminjam' ? '#0369a1' : '#9a3412' }}>
                    {checkoutStep === 'peminjam'
                      ? 'Tahap 4B: Konfirmasi Penerimaan Peralatan & TTD — Peminjam'
                      : 'Tahap 4A: Pemeriksaan Serah Terima Fisik Keluar — Pengelola'}
                  </h2>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: checkoutStep === 'peminjam' ? '#0284c7' : '#c2410c', marginTop: 2 }}>
                  {checkoutStep === 'peminjam'
                    ? `Tiket ${selectedLoan.kode || selectedLoan.id} — Periksa hasil kelayakan fisik 7 butir dari Pengelola dan bubuhkan tanda tangan tanda terima`
                    : `Tiket ${selectedLoan.kode || selectedLoan.id} — Pemeriksaan fisik 7 butir kelayakan alat oleh Pengelola sebelum diserahkan ke Peminjam`}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  onClick={() => setSelectedLoan(null)}
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Stepper Progres Serah Terima 2 Langkah */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px var(--sp-6)',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                fontSize: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: checkoutStep === 'pengelola' ? 700 : 500,
                  color: checkoutStep === 'pengelola' ? '#ea580c' : '#16a34a',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: checkoutStep === 'pengelola' ? '#ea580c' : '#16a34a',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {checkoutStep === 'peminjam' ? '✓' : '1'}
                </span>
                <span>Langkah 4A: Pengisian Lampiran A & TTD (Pengelola)</span>
              </div>
              <span style={{ color: '#94a3b8' }}>➔</span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: checkoutStep === 'peminjam' ? 700 : 500,
                  color: checkoutStep === 'peminjam' ? '#0284c7' : '#94a3b8',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: checkoutStep === 'peminjam' ? '#0284c7' : '#e2e8f0',
                    color: checkoutStep === 'peminjam' ? '#ffffff' : '#64748b',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  2
                </span>
                <span>Langkah 4B: Konfirmasi Terima & TTD (Peminjam)</span>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitCheckout} style={{ padding: 'var(--sp-6)' }}>
              {/* Petunjuk Pengemasan Sesuai Butir 8.4 IK */}
              <div
                style={{
                  padding: '10px 14px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  marginBottom: 'var(--sp-4)',
                  fontSize: '12px',
                  color: '#334155',
                }}
              >
                <strong style={{ color: '#0f172a' }}>Ketentuan Pengemasan & Kelengkapan (Butir 8.4 IK):</strong>
                <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                  <li>Gunakan wadah/koper bawaan pabrikan atau wadah berperedam guncangan.</li>
                  <li>Pasang tutup pelindung pada konektor/port (termasuk antarmuka optik).</li>
                  <li>Kabel dan aksesori diikat rapi dan tidak menekan bagian peralatan yang peka.</li>
                  <li>Beri penanda "mudah pecah" jika peralatan sensitif getaran.</li>
                </ul>
              </div>

              {/* Rincian Singkat Alat */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                  padding: '10px 14px',
                  background: '#f1f5f9',
                  borderRadius: '8px',
                  marginBottom: 'var(--sp-4)',
                  fontSize: '12px',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Peralatan:</span>
                  <strong>{selectedLoan.peralatan.nama_peralatan}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>No. Aset / Seri:</span>
                  <strong>{selectedLoan.peralatan.nomor_aset}</strong> ({selectedLoan.peralatan.nomor_seri})
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Peminjam / Penerima:</span>
                  <strong>{selectedLoan.peminjam.nama}</strong> ({selectedLoan.peminjam.lab_asal})
                </div>
              </div>

              {/* TABEL BAGIAN B TLKM13/F/010 (7 BUTIR PEMERIKSAAN RESMI) */}
              <div ref={checkoutPengelolaRef} style={{ marginBottom: 'var(--sp-4)', scrollMarginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ClipboardCheck size={16} style={{ color: '#16a34a' }} />
                    Pemeriksaan Serah Terima Peralatan
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {checkoutStep === 'pengelola'
                        ? 'S = Sesuai | TS = Tidak Sesuai | TB = Tidak Berlaku (Khusus No. 6, 7)'
                        : 'Status Terverifikasi Pengelola'}
                    </div>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px', width: 32, textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>No.</th>
                        <th style={{ padding: '8px 10px', borderRight: '1px solid #cbd5e1' }}>Butir Pemeriksaan</th>
                        <th style={{ padding: '8px 10px', width: checkoutStep === 'peminjam' ? 140 : 155, textAlign: 'center', borderRight: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                          Keluar (S/TS/TB)
                        </th>
                        <th style={{ padding: '8px 10px' }}>Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {LAMPIRAN_A_BUTIR.map((butir, idx) => {
                        const item = checkoutChecks[idx] || { status: 'S', keterangan: '' };
                        const isTS = item.status === 'TS';
                        const isNA = item.status === 'N/A' || item.status === 'TB';
                        const isS = item.status === 'S';
                        const canNA = BOLEH_NA_INDEXES.includes(idx);
                        return (
                          <tr
                            key={idx}
                            style={{
                              background: isTS ? '#fef2f2' : isNA ? '#f8fafc' : idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                              borderBottom: '1px solid #e2e8f0',
                            }}
                          >
                            <td style={{ padding: '6px 10px', textAlign: 'center', borderRight: '1px solid #cbd5e1', fontWeight: 600, color: '#475569' }}>
                              {idx + 1}.
                            </td>
                            <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', lineHeight: 1.35 }}>
                              {butir}
                              {idx === 3 && (selectedLoan.kebutuhan_kelengkapan || selectedLoan.kelengkapan) && (
                                <div style={{ marginTop: 3, fontSize: '10.5px', color: '#0369a1', background: '#e0f2fe', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                                  Daftar Kelengkapan: <strong>{selectedLoan.kebutuhan_kelengkapan || selectedLoan.kelengkapan}</strong>
                                </div>
                              )}
                              {canNA && (
                                <span style={{ marginLeft: 6, fontSize: '10px', color: '#0284c7', background: '#e0f2fe', padding: '1px 5px', borderRadius: 3, border: '1px solid #bae6fd', fontWeight: 600 }}>
                                  Bila perlu (Boleh TB)
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                              {checkoutStep === 'pengelola' ? (
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 2, cursor: 'pointer', fontWeight: isS ? 700 : 400, color: isS ? '#16a34a' : '#64748b', fontSize: '11px' }}>
                                    <input
                                      type="radio"
                                      name={`checkout_${idx}`}
                                      value="S"
                                      checked={isS}
                                      onChange={() => {
                                        const updated = [...checkoutChecks];
                                        updated[idx] = { ...updated[idx], status: 'S' };
                                        setCheckoutChecks(updated);
                                      }}
                                      style={{ accentColor: '#16a34a' }}
                                    />
                                    S
                                  </label>
                                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 2, cursor: 'pointer', fontWeight: isTS ? 700 : 400, color: isTS ? '#dc2626' : '#64748b', fontSize: '11px' }}>
                                    <input
                                      type="radio"
                                      name={`checkout_${idx}`}
                                      value="TS"
                                      checked={isTS}
                                      onChange={() => {
                                        const updated = [...checkoutChecks];
                                        updated[idx] = { ...updated[idx], status: 'TS' };
                                        setCheckoutChecks(updated);
                                      }}
                                      style={{ accentColor: '#dc2626' }}
                                    />
                                    TS
                                  </label>
                                  {canNA && (
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 2, cursor: 'pointer', fontWeight: isNA ? 700 : 400, color: isNA ? '#2563eb' : '#64748b', fontSize: '11px' }}>
                                      <input
                                        type="radio"
                                        name={`checkout_${idx}`}
                                        value="TB"
                                        checked={isNA}
                                        onChange={() => {
                                          const updated = [...checkoutChecks];
                                          updated[idx] = { ...updated[idx], status: 'TB' };
                                          setCheckoutChecks(updated);
                                        }}
                                        style={{ accentColor: '#2563eb' }}
                                      />
                                      TB
                                    </label>
                                  )}
                                </div>
                              ) : (
                                isNA ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '2px 8px',
                                      borderRadius: 4,
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      background: '#f1f5f9',
                                      color: '#475569',
                                      border: '1px solid #cbd5e1',
                                    }}
                                  >
                                    TB (Tidak Berlaku)
                                  </span>
                                ) : isTS ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '2px 8px',
                                      borderRadius: 4,
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      background: '#fef2f2',
                                      color: '#dc2626',
                                      border: '1px solid #fecaca',
                                    }}
                                  >
                                    <AlertOctagon size={12} /> TS (Tidak Sesuai)
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '2px 8px',
                                      borderRadius: 4,
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      background: '#f0fdf4',
                                      color: '#166534',
                                      border: '1px solid #bbf7d0',
                                    }}
                                  >
                                    <CheckCircle2 size={12} /> S (Sesuai)
                                  </span>
                                )
                              )}
                            </td>
                            <td style={{ padding: '4px 8px' }}>
                              {checkoutStep === 'pengelola' ? (
                                <input
                                  type="text"
                                  value={item.keterangan}
                                  onChange={(e) => {
                                    const updated = [...checkoutChecks];
                                    updated[idx] = { ...updated[idx], keterangan: e.target.value };
                                    setCheckoutChecks(updated);
                                  }}
                                  placeholder={
                                    isTS
                                      ? 'Wajib jelaskan ketidaksesuaian...'
                                      : canNA && isS
                                        ? 'Wajib tuliskan jenis pemeriksaan fungsi khusus...'
                                        : isNA
                                          ? 'Catatan tidak relevan (opsional)...'
                                          : 'Catatan opsional...'
                                  }
                                  required={isTS || (canNA && isS)}
                                  style={{
                                    width: '100%',
                                    border: isTS ? '1.5px solid #f87171' : canNA && isS && !item.keterangan ? '1.5px solid #fbbf24' : isNA ? '1px solid #93c5fd' : '1px solid #cbd5e1',
                                    borderRadius: 4,
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    background: isTS ? '#fff1f2' : canNA && isS && !item.keterangan ? '#fffbeb' : isNA ? '#f0f9ff' : '#ffffff',
                                    outline: 'none',
                                  }}
                                />
                              ) : (
                                <span style={{ fontSize: '11px', color: item.keterangan ? '#334155' : '#94a3b8' }}>
                                  {item.keterangan || '-'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Khusus Langkah 4B (Peminjam): Banner Informasi */}
              {checkoutStep === 'peminjam' && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#eff6ff',
                    border: '1.5px solid #93c5fd',
                    borderRadius: '8px',
                    marginBottom: 'var(--sp-2)',
                    fontSize: '12px',
                    color: '#1e40af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <ShieldCheck size={20} style={{ color: '#2563eb', flexShrink: 0 }} />
                  <div>
                    <strong>Pemeriksaan Fisik Pengelola Selesai:</strong> Pengelola Peralatan (
                    {selectedLoan.serah_terima_keluar?.pic_petugas || 'Pengelola Lab'}) telah memeriksa 7 butir kelayakan fisik & fungsi alat. Silakan verifikasi hasil checklist di samping dan bubuhkan tanda tangan tanda terima Anda.
                  </div>
                </div>
              )}

              {/* CRITICAL LOGIC GATE (SESUAI FLOWCHART: "Ada checkbox TS?") */}
              {countTS > 0 ? (
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#fef2f2',
                    border: '2px solid #ef4444',
                    borderRadius: '8px',
                    marginBottom: 'var(--sp-4)',
                    color: '#991b1b',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <AlertOctagon size={24} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                        PERINGATAN KRITIS: Ditemukan {countTS} Butir Tidak Sesuai (TS)!
                      </div>
                      <div style={{ fontSize: '12px', marginTop: 4, lineHeight: 1.4 }}>
                        Sesuai prosedur operasional serah terima peralatan:
                        <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                          <li>Peralatan yang menunjukkan kondisi tidak normal <strong>TIDAK BOLEH DISERAHKAN</strong>.</li>
                          <li>Peminjaman otomatis <strong>DIBATALKAN</strong>.</li>
                          <li>Status alat akan dialihkan menjadi <strong>DO NOT USE</strong> untuk penanganan peninjauan teknis lebih lanjut.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: '8px',
                    marginBottom: 'var(--sp-4)',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <CheckCircle2 size={20} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <div style={{ fontSize: '12px' }}>
                    <strong>Pemeriksaan Fisik Memenuhi Syarat:</strong> {countS} butir Sesuai (S){countNA > 0 ? `, ${countNA} butir Tidak Berlaku (TB)` : ''}. Kondisi peralatan layak dan memenuhi standar untuk diserahkan kepada peminjam.
                  </div>
                </div>
              )}

              {/* Dokumen Resmi F/006 (Surat Keterangan Peminjaman Peralatan - Versi 03: Berlaku Internal & Eksternal) */}
              {countTS === 0 && (
                <div
                  style={{
                    padding: '12px 14px',
                    background: '#eff6ff',
                    border: '1.5px solid #93c5fd',
                    borderRadius: '8px',
                    marginBottom: 'var(--sp-4)',
                    fontSize: '12px',
                    color: '#1e40af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: '240px' }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 6,
                        background: '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1d4ed8',
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '12.5px' }}>
                        Dokumen TLKM13/F/006 Versi 03 (Surat Keterangan Peminjaman Peralatan)
                      </div>
                      <div style={{ fontSize: '11px', color: '#2563eb', marginTop: 2 }}>
                        {selectedLoan.is_eksternal
                          ? 'Peminjaman Eksternal: Wajib dicetak dan dibawa bersama alat untuk pemeriksaan pos Petugas Pengamanan TTH.'
                          : 'Peminjaman Internal: Dokumen otorisasi peminjaman resmi siap dicetak / diunduh sebagai arsip kendali ISO 17025.'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 600,
                        fontSize: '12px',
                        padding: '6px 12px',
                        height: '32px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }}
                      onClick={() => exportLoanF006Pdf(selectedLoan, { checkoutSigPengelola, checkoutSigPeminjam })}
                    >
                      <Printer size={14} /> Cetak F/006 (PDF)
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontWeight: 600,
                        fontSize: '12px',
                        padding: '6px 12px',
                        height: '32px',
                      }}
                      title="Unduh format dokumen Word (.doc)"
                      onClick={() => exportLoanF006Word(selectedLoan, { checkoutSigPengelola, checkoutSigPeminjam })}
                    >
                      <Download size={13} /> Word
                    </button>
                  </div>
                </div>
              )}

              {/* Catatan Serah Terima & Area Pengesahan */}
              <div ref={checkoutBottomRef} style={{ scrollMarginTop: '16px' }}>
                {checkoutStep === 'pengelola' ? (
                  <div className="form-group" style={{ marginBottom: 'var(--sp-4)' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Catatan Serah Terima Keluar (Pengelola):</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      value={checkoutNote}
                      onChange={(e) => setCheckoutNote(e.target.value)}
                      placeholder="Tambahkan catatan nomor koper, segel khusus, atau arahan keselamatan transportasi..."
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      marginBottom: 'var(--sp-4)',
                      fontSize: '12px',
                      color: '#334155',
                    }}
                  >
                    <strong style={{ color: '#0f172a' }}>Catatan dari Pengelola Peralatan:</strong>
                    <div style={{ marginTop: 4, color: '#475569', fontStyle: checkoutNote ? 'normal' : 'italic' }}>
                      {checkoutNote || selectedLoan.serah_terima_keluar?.catatan || 'Tidak ada catatan tambahan dari pengelola.'}
                    </div>
                  </div>
                )}

                {/* Area Tanda Tangan Digital */}
                {checkoutStep === 'pengelola' ? (
                  countTS === 0 && (
                    <div style={{ marginBottom: 'var(--sp-4)' }}>
                      <DigitalSignaturePad
                        value={checkoutSigPengelola}
                        onChange={setCheckoutSigPengelola}
                        label="Tanda Tangan Pengelola Peralatan"
                        required={true}
                        helperText="Tanda tangan digital untuk mengesahkan inspeksi fisik Lampiran A"
                      />
                    </div>
                  )
                ) : (
                  /* Langkah 4B (Peminjam): Tampilkan Status TTD Pengelola + Signature Pad Peminjam */
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 'var(--sp-4)',
                      marginBottom: 'var(--sp-4)',
                    }}
                  >
                    {/* Kolom 1: Status Pengesahan Pengelola */}
                    <div
                      style={{
                        padding: '12px',
                        background: '#f0fdf4',
                        border: '1.5px solid #86efac',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          1. TTD Pengelola Peralatan (Disahkan)
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                          {selectedLoan.serah_terima_keluar?.pic_petugas || selectedLoan.approval_pengelola?.nama || 'Pengelola Lab'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: 2 }}>
                          Status: Telah memeriksa & menandatangani Lampiran A
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 10,
                          minHeight: 65,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#ffffff',
                          borderRadius: 6,
                          border: '1px dashed #86efac',
                          padding: 6,
                        }}
                      >
                        {checkoutSigPengelola || selectedLoan.serah_terima_keluar?.ttd_pengelola ? (
                          <img
                            src={checkoutSigPengelola || selectedLoan.serah_terima_keluar?.ttd_pengelola}
                            alt="TTD Pengelola"
                            style={{ maxHeight: 55, maxWidth: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={14} /> Terverifikasi Secara Digital
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Kolom 2: Tanda Tangan Peminjam (Penerima) */}
                    <div ref={checkoutSigRef}>
                      <DigitalSignaturePad
                        value={checkoutSigPeminjam}
                        onChange={setCheckoutSigPeminjam}
                        label="2. Tanda Tangan Peminjam (Penerima Peralatan - Wajib)"
                        required={true}
                        helperText="Wajib: Tanda tangan digital untuk mengonfirmasi penerimaan fisik peralatan"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Tombol Eksekusi Serah Terima */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 'var(--sp-4)' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '12px', color: '#64748b', marginRight: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  onClick={() => checkoutModalRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  ↑ Kembali ke Atas
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedLoan(null)}
                  style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600 }}
                >
                  Batal
                </button>

                {checkoutStep === 'pengelola' ? (
                  countTS > 0 ? (
                    <button
                      type="submit"
                      className="btn btn-secondary"
                      disabled={isSubmitting}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 600,
                        color: '#dc2626',
                        borderColor: '#fca5a5',
                        padding: '8px 20px',
                        fontSize: '13px',
                      }}
                    >
                      <AlertOctagon size={16} />
                      Konfirmasi Serah Terima
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn btn-warning"
                      disabled={isSubmitting}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 600,
                        background: '#ea580c',
                        borderColor: '#c2410c',
                        color: '#ffffff',
                        padding: '8px 20px',
                        fontSize: '13px',
                      }}
                    >
                      <ArrowRight size={16} />
                      Konfirmasi Serah Terima
                    </button>
                  )
                ) : (
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={isSubmitting}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontWeight: 600,
                      background: '#16a34a',
                      borderColor: '#15803d',
                      color: '#ffffff',
                      padding: '8px 20px',
                      fontSize: '13px',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Konfirmasi Serah Terima
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. MODAL 3: LEMBAR SERAH TERIMA PENGEMBALIAN                         */}
      {/* ==================================================================== */}
      {selectedLoan && modalMode === 'return' && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
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
            ref={returnModalRef}
            style={{
              width: '100%',
              maxWidth: '960px',
              maxHeight: '94vh',
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
                borderBottom: '1.5px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ecfdf5',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Package size={22} style={{ color: '#059669' }} />
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#064e3b' }}>
                    Lembar Serah Terima Peralatan — Pengembalian
                  </h3>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#047857' }}>
                  Pemeriksaan 7 Butir Kondisi Fisik & Fungsi Saat Kembali (Komparasi Kondisi Awal vs Akhir) & Bagian D
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  onClick={() => setSelectedLoan(null)}
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitReturn} style={{ padding: 'var(--sp-6)' }}>
              {/* Petunjuk / Kebijakan Pengembalian */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 'var(--sp-4)',
                  fontSize: '12px',
                  color: '#334155',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                  <Info size={16} style={{ color: '#059669' }} />
                  Instruksi & Prosedur Serah Terima Kembali:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Bandingkan kondisi saat kembali dengan kondisi saat keluar pada <strong>7 Butir Pemeriksaan</strong> (Bagian B).
                  </li>
                  <li>
                    Opsi <strong>TB (Tidak Berlaku)</strong> hanya diperbolehkan pada pemeriksaan fungsi khusus (butir 6 & 7).
                  </li>
                  <li>
                    Jika ada butir <strong>TS (Tidak Sesuai)</strong> atau terdapat <strong>Kejadian Abnormal (Bagian D)</strong>, sistem secara otomatis menandai peralatan sebagai <strong>DO NOT USE</strong>.
                  </li>
                  <li>
                    Jika seluruh butir <strong>S (Sesuai) / TB</strong> tanpa insiden, status peralatan dialihkan ke <strong>KARANTINA (IK/003)</strong> untuk verifikasi ulang sebelum siap digunakan kembali.
                  </li>
                </ul>
              </div>

              {/* Bagian A: Data Identitas Peminjaman */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '12px 14px',
                  marginBottom: 'var(--sp-4)',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', marginBottom: 8 }}>
                  Bagian A: Identitas Peralatan & Peminjaman
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 12,
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Kode Peminjaman</span>
                    <strong style={{ color: '#0f172a' }}>{selectedLoan.kode || selectedLoan.id}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Peminjam</span>
                    <strong style={{ color: '#0f172a' }}>{selectedLoan.peminjam?.name || selectedLoan.peminjam_nama || '-'}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{selectedLoan.tujuan_divisi || 'SSA'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Peralatan Laboratorium</span>
                    <strong style={{ color: '#0f172a' }}>{selectedLoan.peralatan?.nama_alat || selectedLoan.nama_alat}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      SN: {selectedLoan.peralatan?.nomor_seri || selectedLoan.nomor_seri || '-'} | Aset: {selectedLoan.peralatan?.nomor_aset || selectedLoan.nomor_aset || '-'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Rencana vs Realisasi Kembali</span>
                    <strong style={{ color: '#0f172a' }}>{selectedLoan.tgl_rencana_kembali || '-'}</strong>
                    <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Dikembalikan: Hari Ini</div>
                  </div>
                </div>
              </div>

              {/* Bagian B: Pemeriksaan Fisik & Fungsi (Tabel Komparasi Keluar vs Kembali) */}
              <div ref={returnFormRef} style={{ marginBottom: 'var(--sp-4)', scrollMarginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a' }}>
                    Bagian B: Pemeriksaan Kondisi Peralatan (7 Butir Pemeriksaan)
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                      {countReturnS} Sesuai (S)
                    </span>
                    {countReturnTS > 0 && (
                      <span style={{ fontSize: '11px', background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                        {countReturnTS} Tidak Sesuai (TS)
                      </span>
                    )}
                    {countReturnNA > 0 && (
                      <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#075985', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                        {countReturnNA} TB
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                        <th style={{ padding: '8px 6px', textAlign: 'center', width: '36px', borderRight: '1px solid #cbd5e1' }}>No</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '220px', borderRight: '1px solid #cbd5e1' }}>Butir Pemeriksaan</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', width: '170px', borderRight: '1px solid #cbd5e1', background: '#fff7ed' }}>
                          <span style={{ color: '#c2410c', fontWeight: 800 }}>Kondisi Saat Keluar</span>
                        </th>
                        <th style={{ padding: '8px 8px', textAlign: 'center', width: '145px', borderRight: '1px solid #cbd5e1', background: '#f0fdf4' }}>
                          <span style={{ color: '#166534', fontWeight: 800 }}>Kondisi Kembali</span>
                        </th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '180px' }}>Keterangan / Temuan Saat Kembali</th>
                      </tr>
                    </thead>
                    <tbody>
                      {LAMPIRAN_A_BUTIR.map((butir, idx) => {
                        const item = returnChecks[idx] || { status: 'S', keterangan: '' };
                        const canNA = BOLEH_NA_INDEXES.includes(idx);
                        const isS = item.status === 'S';
                        const isTS = item.status === 'TS';
                        const isNA = item.status === 'N/A' || item.status === 'TB';

                        // Ambil data serah terima keluar sebagai pembanding
                        const initialKeluar = selectedLoan.serah_terima_keluar || selectedLoan.serah_terima;
                        const initialItem = initialKeluar?.lampiran_a?.[idx];
                        const initialStatus = initialItem?.status || (canNA ? 'TB' : 'S');
                        const initialKet = initialItem?.keterangan || '';

                        return (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: '1px solid #e2e8f0',
                              background: isTS ? '#fff1f2' : idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                            }}
                          >
                            <td style={{ padding: '7px 4px', textAlign: 'center', fontWeight: 700, color: '#64748b', borderRight: '1px solid #cbd5e1' }}>
                              {idx + 1}
                            </td>
                            <td style={{ padding: '7px 10px', color: '#0f172a', borderRight: '1px solid #cbd5e1', lineHeight: 1.35 }}>
                              {butir}
                              {idx === 3 && (selectedLoan.kebutuhan_kelengkapan || selectedLoan.kelengkapan) && (
                                <div style={{ marginTop: 3, fontSize: '10px', color: '#0369a1', background: '#e0f2fe', padding: '2px 6px', borderRadius: 4, display: 'inline-block' }}>
                                  Daftar: <strong>{selectedLoan.kebutuhan_kelengkapan || selectedLoan.kelengkapan}</strong>
                                </div>
                              )}
                              {canNA && (
                                <span style={{ marginLeft: 6, fontSize: '10px', color: '#0284c7', background: '#e0f2fe', padding: '1px 5px', borderRadius: 3, border: '1px solid #bae6fd', fontWeight: 600 }}>
                                  Bila perlu (Boleh TB)
                                </span>
                              )}
                            </td>
                            {/* Kolom Pembanding: Kondisi Saat Keluar */}
                            <td style={{ padding: '7px 10px', borderRight: '1px solid #cbd5e1', background: '#fffbeb' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                                {initialStatus === 'S' && (
                                  <span style={{ fontSize: '10.5px', background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                    S (Sesuai)
                                  </span>
                                )}
                                {initialStatus === 'TS' && (
                                  <span style={{ fontSize: '10.5px', background: '#fee2e2', color: '#991b1b', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                    TS (Tidak Sesuai)
                                  </span>
                                )}
                                {(initialStatus === 'N/A' || initialStatus === 'TB') && (
                                  <span style={{ fontSize: '10.5px', background: '#e0f2fe', color: '#075985', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                    TB
                                  </span>
                                )}
                              </div>
                              {initialKet && (
                                <div style={{ fontSize: '10.5px', color: '#78350f', fontStyle: 'italic', wordBreak: 'break-word' }}>
                                  &ldquo;{initialKet}&rdquo;
                                </div>
                              )}
                            </td>
                            {/* Kolom Input: Kondisi Saat Kembali */}
                            <td style={{ padding: '7px 8px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 2, cursor: 'pointer', fontWeight: isS ? 700 : 400, color: isS ? '#16a34a' : '#64748b', fontSize: '11px' }}>
                                  <input
                                    type="radio"
                                    name={`return_check_${idx}`}
                                    value="S"
                                    checked={isS}
                                    onChange={() => {
                                      const updated = [...returnChecks];
                                      updated[idx] = { ...updated[idx], status: 'S' };
                                      setReturnChecks(updated);
                                    }}
                                    style={{ accentColor: '#16a34a' }}
                                  />
                                  S
                                </label>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 2, cursor: 'pointer', fontWeight: isTS ? 700 : 400, color: isTS ? '#dc2626' : '#64748b', fontSize: '11px' }}>
                                  <input
                                    type="radio"
                                    name={`return_check_${idx}`}
                                    value="TS"
                                    checked={isTS}
                                    onChange={() => {
                                      const updated = [...returnChecks];
                                      updated[idx] = { ...updated[idx], status: 'TS' };
                                      setReturnChecks(updated);
                                    }}
                                    style={{ accentColor: '#dc2626' }}
                                  />
                                  TS
                                </label>
                                {canNA && (
                                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 2, cursor: 'pointer', fontWeight: isNA ? 700 : 400, color: isNA ? '#2563eb' : '#64748b', fontSize: '11px' }}>
                                    <input
                                      type="radio"
                                      name={`return_check_${idx}`}
                                      value="TB"
                                      checked={isNA}
                                      onChange={() => {
                                        const updated = [...returnChecks];
                                        updated[idx] = { ...updated[idx], status: 'TB' };
                                        setReturnChecks(updated);
                                      }}
                                      style={{ accentColor: '#2563eb' }}
                                    />
                                    TB
                                  </label>
                                )}
                              </div>
                              {isTS && (
                                <div style={{ fontSize: '9.5px', color: '#dc2626', fontWeight: 700, marginTop: 2 }}>
                                  ⚠️ Alat Rusak / TS
                                </div>
                              )}
                            </td>
                            {/* Kolom Keterangan */}
                            <td style={{ padding: '7px 10px' }}>
                              <input
                                type="text"
                                value={item.keterangan || ''}
                                onChange={(e) => {
                                  const updated = [...returnChecks];
                                  updated[idx] = { ...updated[idx], keterangan: e.target.value };
                                  setReturnChecks(updated);
                                }}
                                placeholder={
                                  isTS
                                    ? 'Wajib jelaskan ketidaksesuaian/kerusakan...'
                                    : canNA && isS
                                      ? 'Wajib tuliskan jenis pengujian fungsi khusus...'
                                      : isNA
                                        ? 'Catatan tidak relevan (opsional)...'
                                        : 'Catatan kondisi kembali (opsional)...'
                                }
                                required={isTS || (canNA && isS)}
                                style={{
                                  width: '100%',
                                  border: isTS ? '1.5px solid #f87171' : canNA && isS && !item.keterangan ? '1.5px solid #fbbf24' : isNA ? '1px solid #93c5fd' : '1px solid #cbd5e1',
                                  borderRadius: 4,
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  background: isTS ? '#fff1f2' : canNA && isS && !item.keterangan ? '#fffbeb' : isNA ? '#f0f9ff' : '#ffffff',
                                  outline: 'none',
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ============================================================ */}
              {/* BAGIAN D: KEJADIAN SELAMA PEMINJAMAN & TINDAK LANJUT         */}
              {/* ============================================================ */}
              <div
                style={{
                  background: adaKejadian ? '#fff1f2' : '#f8fafc',
                  border: adaKejadian ? '1.5px solid #fecdd3' : '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '12px 14px',
                  marginBottom: 'var(--sp-4)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: adaKejadian ? '#9f1239' : '#0f172a' }}>
                    Bagian D: Kejadian Selama Peminjaman & Tindak Lanjut
                  </div>
                  {adaKejadian && (
                    <span style={{ fontSize: '10.5px', background: '#dc2626', color: '#ffffff', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                      ⚠️ Status Peralatan Dialihkan: DO NOT USE
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: adaKejadian ? 10 : 0 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '12px', fontWeight: !adaKejadian ? 700 : 400, color: !adaKejadian ? '#166534' : '#475569' }}>
                    <input
                      type="radio"
                      name="ada_kejadian_radio"
                      checked={!adaKejadian}
                      onChange={() => {
                        setAdaKejadian(false);
                        setUraianKejadian('');
                      }}
                      style={{ accentColor: '#16a34a' }}
                    />
                    Tidak Ada Kejadian (Penggunaan Normal)
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '12px', fontWeight: adaKejadian ? 700 : 400, color: adaKejadian ? '#b91c1c' : '#475569' }}>
                    <input
                      type="radio"
                      name="ada_kejadian_radio"
                      checked={adaKejadian}
                      onChange={() => setAdaKejadian(true)}
                      style={{ accentColor: '#dc2626' }}
                    />
                    Ada Kejadian / Kerusakan / Malfungsi Selama Peminjaman
                  </label>
                </div>

                {adaKejadian && (
                  <div style={{ marginTop: 8 }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#9f1239', marginBottom: 4 }}>
                      Uraian Kejadian / Kronologi Kerusakan / Gejala Abnormal <span style={{ color: '#dc2626' }}>* (Wajib Diisi)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={uraianKejadian}
                      onChange={(e) => setUraianKejadian(e.target.value)}
                      placeholder="Jelaskan secara rinci waktu kejadian, gejala abnormal, kesalahan operasi, jatuh, konsleting, atau kendala fisik/fungsi yang terjadi selama peminjaman..."
                      required={adaKejadian}
                      style={{
                        width: '100%',
                        border: '1.5px solid #fda4af',
                        borderRadius: 6,
                        padding: '6px 10px',
                        fontSize: '11.5px',
                        background: '#ffffff',
                        outline: 'none',
                        color: '#0f172a',
                        resize: 'vertical',
                      }}
                    />
                    <div style={{ fontSize: '11px', color: '#be123c', marginTop: 4 }}>
                      * Laporan kejadian ini akan tercatat dalam logbook alat dan Penanggung Jawab Laboratorium akan melakukan penanganan lebih lanjut.
                    </div>
                  </div>
                )}
              </div>

              {/* Indikator Reaktif Tindak Lanjut Status Peralatan */}
              {countReturnTS > 0 || adaKejadian ? (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1.5px solid #f87171',
                    borderRadius: 8,
                    padding: '12px 14px',
                    marginBottom: 'var(--sp-4)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <AlertOctagon size={24} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#991b1b', marginBottom: 2 }}>
                      STATUS AKHIR PERALATAN: DO NOT USE
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#7f1d1d', lineHeight: 1.4 }}>
                      Ditemukan <strong>{countReturnTS} butir tidak sesuai (TS)</strong>
                      {countReturnTS > 0 && adaKejadian ? ' dan ' : ''}
                      {adaKejadian ? <strong>adanya laporan kejadian abnormal pada Bagian D</strong> : ''}.
                      Setelah pengesahan, sistem akan otomatis menetapkan label status alat ke <strong>DO NOT USE</strong> dan membekukannya dari peredaran peminjaman untuk diinvestigasi.
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: 8,
                    padding: '12px 14px',
                    marginBottom: 'var(--sp-4)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <CheckCircle2 size={24} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#166534', marginBottom: 2 }}>
                      STATUS AKHIR PERALATAN: KARANTINA (Perlu Verifikasi)
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#14532d', lineHeight: 1.4 }}>
                      Pemeriksaan kondisi kembali memenuhi standar ({countReturnS} Sesuai{countReturnNA > 0 ? `, ${countReturnNA} Tidak Berlaku (TB)` : ''}) dan tidak ada insiden abnormal.
                      Peralatan dialihkan ke status <strong>KARANTINA</strong> untuk diverifikasi ulang oleh Pengelola Lab sebelum dapat dipinjam kembali.
                    </div>
                  </div>
                </div>
              )}

              {/* Catatan Pengembalian Pengelola */}
              <div style={{ marginBottom: 'var(--sp-4)' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Catatan Tambahan Pengembalian Pengelola Lab (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={returnCatatan}
                  onChange={(e) => setReturnCatatan(e.target.value)}
                  placeholder="Catatan tambahan mengenai kelengkapan, kebersihan, atau informasi lain saat pengembalian..."
                  style={{
                    width: '100%',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: '11.5px',
                    background: '#ffffff',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* ============================================================ */}
              {/* BAGIAN C: PENGESAHAN & TANDA TANGAN SERAH TERIMA KEMBALI      */}
              {/* ============================================================ */}
              <div
                ref={returnBottomRef}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '14px',
                  marginBottom: 'var(--sp-4)',
                  scrollMarginTop: '16px',
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a' }}>
                    Bagian C: Pengesahan & Tanda Tangan Serah Terima Kembali
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>
                    Kedua belah pihak (Peminjam dan Pengelola Lab) membubuhkan tanda tangan digital untuk serah terima kembali peralatan.
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 16,
                  }}
                >
                  {/* Kolom 1: Tanda Tangan Peminjam (Yang Mengembalikan) */}
                  <div>
                    <DigitalSignaturePad
                      label={`1. Tanda Tangan Peminjam (${selectedLoan.peminjam?.name || selectedLoan.peminjam_nama || 'Peminjam'}) *`}
                      helperText="Personel yang menyerahkan kembali peralatan ke laboratorium"
                      value={returnSigPeminjam}
                      onChange={setReturnSigPeminjam}
                      required={true}
                    />
                  </div>

                  {/* Kolom 2: Tanda Tangan Pengelola Lab (Penerima Kembali) */}
                  <div>
                    <DigitalSignaturePad
                      label={`2. Tanda Tangan Pengelola Lab (${selectedLoan.pengelola?.name || selectedLoan.pengelola_nama || 'Pengelola Lab'}) *`}
                      helperText="Petugas yang memeriksa & menerima peralatan kembali"
                      value={returnSigPengelola}
                      onChange={setReturnSigPengelola}
                      required={true}
                    />
                  </div>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 10,
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: 'var(--sp-4)',
                }}
              >
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '12px', color: '#64748b', marginRight: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  onClick={() => returnModalRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  ↑ Kembali ke Atas
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                  onClick={() => setSelectedLoan(null)}
                  style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={isSubmitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontWeight: 600,
                    background: (countReturnTS > 0 || adaKejadian) ? '#dc2626' : '#16a34a',
                    borderColor: (countReturnTS > 0 || adaKejadian) ? '#b91c1c' : '#15803d',
                    color: '#ffffff',
                    padding: '8px 20px',
                    fontSize: '13px',
                    borderRadius: 'var(--radius-lg, 8px)',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {countReturnTS > 0 || adaKejadian ? <AlertOctagon size={16} /> : <CheckCircle2 size={16} />}
                  {isSubmitting
                    ? 'Menyimpan...'
                    : 'Konfirmasi Pengembalian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. MODAL 8: AJUKAN PERPANJANGAN PEMINJAMAN (OLEH PEMINJAM)            */}
      {/* ==================================================================== */}
      {selectedLoan && modalMode === 'extension_request' && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 'var(--sp-4)',
          }}
          onClick={() => !isExtensionSubmitting && setSelectedLoan(null)}
        >
          <div
            className="modal-content card"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '92vh',
              overflowY: 'auto',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: 0,
              background: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: 'var(--sp-4) var(--sp-6)',
                borderBottom: '1.5px solid #fed7aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fff7ed',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarClock size={22} style={{ color: '#d97706' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#9a3412' }}>
                    Permohonan Perpanjangan Peminjaman
                  </h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#c2410c' }}>
                    Tiket: {selectedLoan.kode || selectedLoan.id} • {selectedLoan.peralatan?.nama_peralatan}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setSelectedLoan(null)}
                disabled={isExtensionSubmitting}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmitExtensionRequest} style={{ padding: 'var(--sp-6)' }}>
              {/* Info Peralatan & Tanggal Saat Ini */}
              <div
                style={{
                  padding: '12px 14px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  marginBottom: 'var(--sp-4)',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Nomor Aset:</span><br />
                    <strong>{selectedLoan.peralatan?.nomor_aset || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Lab Pemilik:</span><br />
                    <strong>{selectedLoan.peralatan?.lab_pemilik || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Tanggal Mulai Pinjam:</span><br />
                    <strong>{selectedLoan.rencana_tanggal_keluar}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Rencana Kembali Saat Ini:</span><br />
                    <strong style={{ color: '#ea580c' }}>{selectedLoan.rencana_tanggal_kembali}</strong>
                  </div>
                </div>
              </div>

              {/* Tanggal Kembali Baru */}
              <div className="form-group" style={{ marginBottom: 'var(--sp-4)' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Rencana Tanggal Kembali Baru <span className="required">*</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  min={getMinExtensionDate(selectedLoan)}
                  value={extensionNewDate}
                  onChange={(e) => setExtensionNewDate(e.target.value)}
                  required
                />
                <span className="form-help" style={{ fontSize: '11px', color: '#64748b' }}>
                  Minimal tanggal setelah tanggal pengembalian saat ini ({selectedLoan.rencana_tanggal_kembali}).
                </span>
              </div>

              {/* Alasan Perpanjangan */}
              <div className="form-group" style={{ marginBottom: 'var(--sp-5)' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Alasan Permohonan Perpanjangan <span className="required">*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Jelaskan kebutuhan pengujian tambahan atau alasan teknis mengapa membutuhkan perpanjangan waktu..."
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #e2e8f0', paddingTop: 'var(--sp-4)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedLoan(null)}
                  disabled={isExtensionSubmitting}
                  style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600 }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isExtensionSubmitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: '#ea580c',
                    borderColor: '#c2410c',
                  }}
                >
                  {isExtensionSubmitting ? (
                    <>
                      <RefreshCw size={15} className="spin" /> Mengirimkan...
                    </>
                  ) : (
                    <>
                      <Send size={15} /> Ajukan Perpanjangan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 9. MODAL 9: PENGESAHAN PERPANJANGAN (OLEH MANAGER LAB)                 */}
      {/* ==================================================================== */}
      {selectedLoan && modalMode === 'extension_review' && (() => {
        const waitingPj = selectedLoan.perpanjangan?.find((p) => p.status === 'menunggu');

        return (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 'var(--sp-4)',
            }}
            onClick={() => !isExtensionDecisionSubmitting && setSelectedLoan(null)}
          >
            <div
              className="modal-content card"
              style={{
                width: '100%',
                maxWidth: '640px',
                maxHeight: '94vh',
                overflowY: 'auto',
                borderRadius: 'var(--radius-lg, 12px)',
                padding: 0,
                background: '#ffffff',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  padding: 'var(--sp-4) var(--sp-6)',
                  borderBottom: '1.5px solid #fed7aa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#fff7ed',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={22} style={{ color: '#ea580c' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#9a3412' }}>
                      Pengesahan Perpanjangan Peminjaman Peralatan
                    </h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#c2410c' }}>
                      Wewenang Manager Lab Pemilik Peralatan • Tiket {selectedLoan.kode || selectedLoan.id}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon"
                  onClick={() => setSelectedLoan(null)}
                  disabled={isExtensionDecisionSubmitting}
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmitExtensionDecision} style={{ padding: 'var(--sp-6)' }}>
                {/* Box Detail Pengajuan */}
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#f8fafc',
                    borderRadius: 8,
                    border: '1.5px solid #e2e8f0',
                    marginBottom: 'var(--sp-5)',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
                        {selectedLoan.peralatan?.nama_peralatan}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Aset: {selectedLoan.peralatan?.nomor_aset} • Pemilik: {selectedLoan.peralatan?.lab_pemilik}
                      </div>
                    </div>
                    <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                      Perpanjangan Diajukan
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '8px 10px', background: '#ffffff', borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 8 }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Peminjam:</span><br />
                      <strong>{selectedLoan.peminjam?.nama || selectedLoan.peminjam_nama || '-'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Diajukan Pada:</span><br />
                      <strong>{waitingPj?.diajukan_pada ? String(waitingPj.diajukan_pada).slice(0, 10) : '-'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Tanggal Kembali Saat Ini:</span><br />
                      <strong style={{ color: '#64748b', textDecoration: 'line-through' }}>{waitingPj?.tanggal_kembali_lama || selectedLoan.rencana_tanggal_kembali}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Rencana Kembali Baru:</span><br />
                      <strong style={{ color: '#059669', fontSize: '13px' }}>{waitingPj?.tanggal_kembali_baru}</strong>
                    </div>
                  </div>

                  <div style={{ padding: '8px 10px', background: '#fffbeb', borderRadius: 6, border: '1px solid #fef3c7' }}>
                    <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 2 }}>Alasan Permohonan Peminjam:</div>
                    <div style={{ color: '#78350f', fontStyle: 'italic' }}>"{waitingPj?.alasan}"</div>
                  </div>
                </div>

                {/* Pilihan Keputusan */}
                <div className="form-group" style={{ marginBottom: 'var(--sp-3)' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Keputusan Manager Lab <span className="required">*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      id="btn-perpanjangan-setuju"
                      onClick={() => setExtensionDecisionAction('setuju')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-md, 8px)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        border: extensionDecisionAction === 'setuju' ? '2px solid #16a34a' : '1.5px solid #cbd5e1',
                        background: extensionDecisionAction === 'setuju' ? '#f0fdf4' : '#ffffff',
                        color: extensionDecisionAction === 'setuju' ? '#15803d' : '#475569',
                        boxShadow: extensionDecisionAction === 'setuju' ? '0 1px 3px rgba(22, 163, 74, 0.15)' : 'none',
                      }}
                    >
                      <CheckCircle2 size={16} style={{ color: extensionDecisionAction === 'setuju' ? '#16a34a' : '#94a3b8' }} />
                      <span>Setuju</span>
                    </button>

                    <button
                      type="button"
                      id="btn-perpanjangan-tolak"
                      onClick={() => setExtensionDecisionAction('tolak')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-md, 8px)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        border: extensionDecisionAction === 'tolak' ? '2px solid #dc2626' : '1.5px solid #cbd5e1',
                        background: extensionDecisionAction === 'tolak' ? '#fef2f2' : '#ffffff',
                        color: extensionDecisionAction === 'tolak' ? '#b91c1c' : '#475569',
                        boxShadow: extensionDecisionAction === 'tolak' ? '0 1px 3px rgba(220, 38, 38, 0.15)' : 'none',
                      }}
                    >
                      <XCircle size={16} style={{ color: extensionDecisionAction === 'tolak' ? '#dc2626' : '#94a3b8' }} />
                      <span>Tolak</span>
                    </button>
                  </div>
                </div>

                {/* Catatan Keputusan */}
                <div className="form-group" style={{ marginBottom: 'var(--sp-3)' }}>
                  <label className="form-label">
                    {extensionDecisionAction === 'setuju' ? 'Catatan / Arahan (Opsional)' : 'Alasan Penolakan (Wajib)'}
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder={
                      extensionDecisionAction === 'setuju'
                        ? 'Catatan pemeriksaan teknis atau instruksi khusus...'
                        : 'Uraikan alasan penolakan perpanjangan...'
                    }
                    value={extensionDecisionNote}
                    onChange={(e) => setExtensionDecisionNote(e.target.value)}
                    required={extensionDecisionAction === 'tolak'}
                  />
                </div>

                {/* Tanda Tangan Digital Pad (Wajib jika Setuju) */}
                {extensionDecisionAction === 'setuju' && (
                  <div style={{ marginBottom: 'var(--sp-4)' }}>
                    <DigitalSignaturePad
                      value={extensionDecisionSig}
                      onChange={setExtensionDecisionSig}
                      label="Tanda Tangan Digital Manager Lab"
                      required={true}
                      helperText="Goreskan tanda tangan persetujuan perpanjangan"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #e2e8f0', paddingTop: 'var(--sp-4)' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedLoan(null)}
                    disabled={isExtensionDecisionSubmitting}
                    style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600 }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn"
                    disabled={isExtensionDecisionSubmitting}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 20px',
                      fontSize: '13px',
                      fontWeight: 600,
                      background: extensionDecisionAction === 'setuju' ? '#16a34a' : '#dc2626',
                      borderColor: extensionDecisionAction === 'setuju' ? '#15803d' : '#b91c1c',
                      color: '#ffffff',
                    }}
                  >
                    {isExtensionDecisionSubmitting ? (
                      <>
                        <RefreshCw size={15} className="spin" /> Memproses...
                      </>
                    ) : extensionDecisionAction === 'setuju' ? (
                      <>
                        <CheckCircle2 size={15} /> Konfirmasi Persetujuan
                      </>
                    ) : (
                      <>
                        <XCircle size={15} /> Konfirmasi Penolakan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

