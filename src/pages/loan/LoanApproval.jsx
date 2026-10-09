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
} from 'lucide-react';
import { getCurrentUser, logbookApi, peminjamanApi, peralatanApi } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
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
// 10 BUTIR PEMERIKSAAN RESMI LAMPIRAN A (Checklist Serah Terima Peralatan)
// ============================================================================
const LAMPIRAN_A_BUTIR = [
  'Identitas peralatan (nama, merek/tipe, nomor seri, nomor aset) sesuai daftar inventaris peralatan',
  'Label status terpasang, terbaca, dan berlaku sampai rencana tanggal kembali',
  'Segel atau penguncian pengaturan utuh (bila ada)',
  'Kondisi fisik casing, layar, tombol, dan konektor/port baik; tidak retak, penyok, atau kotor',
  'Kelengkapan aksesori, kabel, adaptor, catu daya/baterai sesuai daftar kelengkapan',
  'Fungsi dasar: menyala normal, swauji/inisialisasi berhasil, tidak ada pesan galat',
  'Versi peranti lunak/firmware sesuai yang tercatat (bila relevan)',
  'Konektor/antarmuka optik bersih dan tertutup pelindung (bila relevan)',
  'Wadah atau kemasan pelindung dalam kondisi baik',
  'Dokumen pendukung: instruksi/manual pengoperasian, salinan sertifikat/laporan verifikasi, Surat Keterangan Membawa Peralatan (peminjaman eksternal)',
];

// Indeks butir Lampiran A yang boleh dipilih Tidak Berlaku (TB) sesuai TLKM13/IK/005:
// Butir 3 (index 2): Segel (bila ada)
// Butir 7 (index 6): Versi software/firmware (bila relevan)
// Butir 8 (index 7): Konektor optik (bila relevan)
const BOLEH_TB_INDEXES = [2, 6, 7];

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
      lampiran_a: Array.from({ length: 10 }, () => ({ status: 'S', keterangan: '' })),
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
        { status: 'S', keterangan: '' },
        { status: 'TS', keterangan: 'Saat swauji unit gagal boot, timbul pesan error korelasi sensor mikrofon.' },
        { status: 'S', keterangan: '' },
        { status: 'S', keterangan: '' },
        { status: 'S', keterangan: '' },
        { status: 'S', keterangan: '' },
      ],
      ada_ts: true,
      ttd_pengelola: 'data:image/png;base64,mockSign3',
      ttd_peminjam: 'data:image/png;base64,mockSign2',
      catatan: 'Pemeriksaan menemukan butir 6 gagal fungsi dasar. Penyerahan dibatalkan dan alat diisolasi dengan penanda DO NOT USE.',
      f006_nomor: null,
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

  // Form State untuk Serah Terima Fisik Keluar (Tahap 4: Lampiran A)
  const [checkoutChecks, setCheckoutChecks] = useState(
    Array.from({ length: 10 }, () => ({ status: 'S', keterangan: '' }))
  );
  const [checkoutNote, setCheckoutNote] = useState('');
  const [checkoutSigPengelola, setCheckoutSigPengelola] = useState('');
  const [checkoutSigPeminjam, setCheckoutSigPeminjam] = useState('');
  // Step serah terima fisik (Tahap 4): 'pengelola' (Langkah 4A: Lampiran A) | 'peminjam' (Langkah 4B: Konfirmasi Terima)
  const [checkoutStep, setCheckoutStep] = useState('pengelola');

  // State Logbook Peralatan Riil (GET /api/peralatan/:id/logbook)
  const [logbookData, setLogbookData] = useState([]);
  const [isLogbookLoading, setIsLogbookLoading] = useState(false);
  const [logbookError, setLogbookError] = useState(null);

  // Mendeteksi keterlibatan akun login terhadap suatu tiket peminjaman
  function getLoanUserRelationship(loan) {
    if (!loan) return {};
    const isPeminjam = currentUserId > 0 && (loan.peminjam?.user_id === currentUserId || loan.peminjam_id === currentUserId);
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
      return null;
    }

    // Default (roleFilter === 'SEMUA'):
    if (loan.status === 'MENUNGGU_MANAGER_PEMINJAM' && (isManagerPeminjam || isAdmin)) {
      return { canReview: true, stage: 'manager_peminjam', label: 'Tahap 1: Validasi Atasan Peminjam' };
    }
    // Pengelola hanya me-review jika bukan peminjam di tiket ini (kecuali admin)
    if (loan.status === 'MENUNGGU_PENGELOLA' && (isAdmin || (isPengelola && !isPeminjam))) {
      return { canReview: true, stage: 'pengelola', label: 'Tahap 2: Review Teknis Pengelola' };
    }
    if (loan.status === 'MENUNGGU_MANAGER_LAB' && (isManagerLab || isAdmin)) {
      return { canReview: true, stage: 'manager_lab', label: 'Tahap 3: Pengesahan Manager Lab' };
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
      return Boolean(pending?.canReview || pending?.canHandover);
    }
    if (statusFilter === 'MENUNGGU_SERAH_TERIMA') {
      if (item.status !== 'MENUNGGU_SERAH_TERIMA' && item.status !== 'DISETUJUI') return false;
    } else if (statusFilter !== 'SEMUA' && item.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Buka Modal untuk Review Persetujuan (Tahap 1, 2, 3) atau Detail
  function handleOpenReview(loan) {
    setSelectedLoan(loan);
    setModalMode('review');
    setDecisionAction('setuju');
    setDecisionNote('');
    setAlternativeEquipmentId('');
    setDigitalSignature('');

    // Deteksi tahap review secara otomatis dari status tiket dan hak akses akun
    const pendingAction = getPendingActionForUser(loan);
    const stage = pendingAction?.stage || (
      loan.status === 'MENUNGGU_MANAGER_PEMINJAM' ? 'manager_peminjam' :
        loan.status === 'MENUNGGU_PENGELOLA' ? 'pengelola' :
          loan.status === 'MENUNGGU_MANAGER_LAB' ? 'manager_lab' : 'pengelola'
    );
    setActiveReviewStage(stage);

    // Reset checklist teknis Tahap 2
    setTechCheckSpec(loan.approval_pengelola?.cek_spesifikasi ?? true);
    setTechCheckOperator(loan.approval_pengelola?.cek_operator ?? true);
    setTechCheckSchedule(loan.approval_pengelola?.cek_jadwal_kalibrasi ?? true);
    setTechCheckLocation(loan.approval_pengelola?.cek_lokasi ?? true);

    fetchLogbook(loan.peralatan?.id);
  }

  // Buka Modal Khusus Serah Terima Keluar (Tahap 4: Lampiran A)
  async function handleOpenCheckout(loan) {
    setSelectedLoan(loan);
    setModalMode('checkout');
    setCheckoutNote(loan.serah_terima_keluar?.catatan || '');
    setCheckoutSigPengelola(loan.serah_terima_keluar?.ttd_pengelola || '');
    setCheckoutSigPeminjam(loan.serah_terima_keluar?.ttd_peminjam || '');

    const pending = getPendingActionForUser(loan);
    const step = pending?.step || (loan.status === 'SIAP_DISERAHKAN' ? 'peminjam' : 'pengelola');
    setCheckoutStep(step);

    if (loan.serah_terima_keluar?.lampiran_a && loan.serah_terima_keluar.lampiran_a.length > 0) {
      setCheckoutChecks(loan.serah_terima_keluar.lampiran_a.map((it) => ({
        status: it.status || 'S',
        keterangan: it.keterangan || '',
      })));
    } else {
      // Default: semua S
      setCheckoutChecks(Array.from({ length: 10 }, () => ({ status: 'S', keterangan: '' })));
    }

    // Jika tiket numerik riil backend, ambil detail lengkap agar TTD Pengelola dan data lampiran A terambil utuh
    if (!isNaN(Number(loan.id))) {
      try {
        const detailRes = await peminjamanApi.getById(loan.id);
        if (detailRes?.success && detailRes.data) {
          const detail = detailRes.data;
          setSelectedLoan(detail);
          if (detail.serah_terima_keluar) {
            setCheckoutNote(detail.serah_terima_keluar.catatan || '');
            if (detail.serah_terima_keluar.ttd_pengelola) {
              setCheckoutSigPengelola(detail.serah_terima_keluar.ttd_pengelola);
            }
            if (detail.serah_terima_keluar.lampiran_a && detail.serah_terima_keluar.lampiran_a.length > 0) {
              setCheckoutChecks(detail.serah_terima_keluar.lampiran_a.map((it) => ({
                status: it.status || 'S',
                keterangan: it.keterangan || '',
              })));
            }
          }
        }
      } catch (err) {
        console.warn('Gagal fetch detail peminjaman serah terima:', err);
      }
    }
  }

  // Buka Modal Hanya untuk Melihat Detail Riwayat
  function handleOpenDetail(loan) {
    setSelectedLoan(loan);
    setModalMode('detail');
    fetchLogbook(loan.peralatan?.id);
  }

  // Submit Keputusan Review Persetujuan (Tahap 1, 2, 3)
  async function handleSubmitDecision(e) {
    e.preventDefault();
    if (!selectedLoan) return;

    if (decisionAction === 'tolak' && !decisionNote.trim()) {
      toastError('Alasan penolakan wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      const body = {
        keputusan: decisionAction, // "setuju" atau "tolak"
        catatan: decisionNote.trim(),
      };
      if (decisionAction === 'tolak' && alternativeEquipmentId && activeReviewStage === 'pengelola') {
        body.alat_alternatif_id = Number(alternativeEquipmentId);
      }

      const isBackendId = !isNaN(Number(selectedLoan.id));
      if (isBackendId) {
        const res = await peminjamanApi.keputusan(selectedLoan.id, body);
        success(res?.message || `Keputusan ${decisionAction} berhasil dicatat.`);
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

  // Submit Serah Terima Keluar Fisik (Tahap 4: Lampiran A)
  async function handleSubmitCheckout(e) {
    e.preventDefault();
    if (!selectedLoan) return;

    if (checkoutStep === 'pengelola') {
      const adaItemTS = checkoutChecks.some((i) => i.status === 'TS');
      if (adaItemTS) {
        const itemTSKosong = checkoutChecks.some((i) => i.status === 'TS' && !i.keterangan?.trim());
        if (itemTSKosong) {
          toastError('Semua butir Tidak Sesuai (TS) wajib diisi penjelasannya pada kolom keterangan.');
          return;
        }
      }

      if (!checkoutSigPengelola) {
        toastError('Tanda tangan digital Pengelola Peralatan wajib dibubuhkan.');
        return;
      }

      setIsSubmitting(true);
      try {
        const payload = {
          lampiran_a: checkoutChecks.map((it) => ({
            status: it.status,
            keterangan: it.keterangan ? it.keterangan.trim() : '',
          })),
          catatan: checkoutNote ? checkoutNote.trim() : '',
          ttd: checkoutSigPengelola,
        };

        const res = await peminjamanApi.serahTerima(selectedLoan.id, payload);
        if (res?.success === false) {
          throw new Error(res.message || 'Gagal menyimpan checklist serah terima');
        }

        setSelectedLoan(null);
        await fetchLoans();

        if (adaItemTS) {
          toastError(
            `Serah terima dibatalkan karena terdapat butir TS. Tiket ${selectedLoan.kode || selectedLoan.id} ditutup dan status alat dialihkan menjadi DO_NOT_USE.`
          );
        } else {
          success(
            `Pemeriksaan Lampiran A berhasil disahkan! Tiket ${selectedLoan.kode || selectedLoan.id} kini menunggu konfirmasi dan tanda tangan penerimaan dari Peminjam.`
          );
        }
      } catch (err) {
        toastError(err.message || 'Gagal memproses serah terima keluar');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // checkoutStep === 'peminjam'
      if (!checkoutSigPeminjam) {
        toastError('Tanda tangan digital Peminjam/Penerima wajib dibubuhkan.');
        return;
      }

      setIsSubmitting(true);
      try {
        const payload = {
          ttd: checkoutSigPeminjam,
        };

        const res = await peminjamanApi.konfirmasiTerima(selectedLoan.id, payload);
        if (res?.success === false) {
          throw new Error(res.message || 'Gagal mengonfirmasi penerimaan peralatan');
        }

        setSelectedLoan(null);
        await fetchLoans();

        success(
          `Penerimaan peralatan berhasil dikonfirmasi & ditandatangani! Tiket ${selectedLoan.kode || selectedLoan.id} kini resmi berstatus SEDANG DIPINJAM.`
        );
      } catch (err) {
        toastError(err.message || 'Gagal mengonfirmasi penerimaan peralatan');
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  // Hitung berapa TS, TB, dan S yang dipilih di form Lampiran A
  const countTS = checkoutChecks.filter((i) => i.status === 'TS').length;
  const countTB = checkoutChecks.filter((i) => i.status === 'TB').length;
  const countS = checkoutChecks.filter((i) => i.status === 'S').length;

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
            Alur Persetujuan Resmi: Atasan Peminjam ➔ Pengelola (Review Teknis) ➔ Manager Lab ➔ <strong>Serah Terima Fisik (Lampiran A)</strong>.
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
                    <option value="manajer_peminjam">Sebagai Atasan Peminjam (Tahap 1)</option>
                    <option value="manager_lab">Sebagai Manager Lab Pemilik (Tahap 3)</option>
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
                <option value="MENUNGGU_SERAH_TERIMA">Tahap 4A: Disetujui (Cek Pengelola)</option>
                <option value="SIAP_DISERAHKAN">Tahap 4B: Siap Diserahkan (TTD Peminjam)</option>
                <option value="SEDANG_DIPINJAM">Sedang Dipinjam (Alat Diserahkan)</option>
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
                      const { isPeminjam, isPengelola, isManagerPeminjam, isManagerLab } = getLoanUserRelationship(loan);

                      return (
                        <tr
                          key={loan.id}
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            background: isWaitingForReview || isReadyForHandover ? '#fffbeb' : '#ffffff',
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
                                <span className="badge badge-purple" style={{ fontSize: '9px', padding: '1px 5px' }}>
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
                                  {isPengelola && !isPeminjam && (
                                    <span className="badge badge-purple" style={{ fontSize: '9px', padding: '1px 5px' }}>
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

                            {/* Mini Stepper 4 Tahap */}
                            <div style={{ display: 'flex', gap: 4, marginTop: 6 }} title="Progres: 1.Atasan | 2.Pengelola | 3.Mgr Lab | 4.Serah Terima">
                              <span
                                title={
                                  loan.approval_manager_peminjam?.status === 'skipped'
                                    ? 'Tahap 1: Dilewati Otomatis (Peminjam & Pemilik Lab Sama)'
                                    : 'Tahap 1: Manager Peminjam'
                                }
                                style={{
                                  width: 14,
                                  height: 6,
                                  borderRadius: 3,
                                  background:
                                    loan.approval_manager_peminjam?.status === 'approved'
                                      ? '#16a34a'
                                      : loan.approval_manager_peminjam?.status === 'skipped'
                                        ? '#0284c7'
                                        : loan.approval_manager_peminjam?.status === 'rejected'
                                          ? '#dc2626'
                                          : '#cbd5e1',
                                }}
                              />
                              <span
                                title="Tahap 2: Pengelola Peralatan (Teknis)"
                                style={{
                                  width: 14,
                                  height: 6,
                                  borderRadius: 3,
                                  background:
                                    loan.approval_pengelola?.status === 'approved'
                                      ? '#16a34a'
                                      : loan.approval_pengelola?.status === 'rejected'
                                        ? '#dc2626'
                                        : '#cbd5e1',
                                }}
                              />
                              <span
                                title="Tahap 3: Manager Lab Pemilik"
                                style={{
                                  width: 14,
                                  height: 6,
                                  borderRadius: 3,
                                  background:
                                    loan.approval_manager_lab?.status === 'approved'
                                      ? '#16a34a'
                                      : loan.approval_manager_lab?.status === 'rejected'
                                        ? '#dc2626'
                                        : '#cbd5e1',
                                }}
                              />
                              <span
                                title={
                                  loan.status === 'SEDANG_DIPINJAM'
                                    ? 'Tahap 4: Selesai Diserahkan'
                                    : loan.status === 'SIAP_DISERAHKAN'
                                      ? 'Tahap 4B: Menunggu TTD Peminjam'
                                      : loan.status === 'DISETUJUI' || loan.status === 'MENUNGGU_SERAH_TERIMA'
                                        ? 'Tahap 4A: Menunggu Cek Pengelola'
                                        : 'Tahap 4: Serah Terima Keluar (Lampiran A)'
                                }
                                style={{
                                  width: 14,
                                  height: 6,
                                  borderRadius: 3,
                                  background:
                                    loan.status === 'SEDANG_DIPINJAM'
                                      ? '#16a34a'
                                      : loan.status === 'DIBATALKAN_TS'
                                        ? '#dc2626'
                                        : loan.status === 'SIAP_DISERAHKAN'
                                          ? '#0284c7'
                                          : loan.status === 'DISETUJUI' || loan.status === 'MENUNGGU_SERAH_TERIMA'
                                            ? '#ea580c'
                                            : '#cbd5e1',
                                }}
                              />
                            </div>
                          </td>

                          {/* 7. Tombol Aksi Berdasarkan Wewenang Role */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'top', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                              {isReadyForHandover ? (
                                <button
                                  type="button"
                                  className={`btn ${pendingAction?.step === 'peminjam' ? 'btn-success' : 'btn-warning'} btn-sm`}
                                  onClick={() => handleOpenCheckout(loan)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    fontSize: '11px',
                                    padding: '5px 10px',
                                    background: pendingAction?.step === 'peminjam' ? '#16a34a' : '#ea580c',
                                    borderColor: pendingAction?.step === 'peminjam' ? '#15803d' : '#c2410c',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                  }}
                                >
                                  {pendingAction?.step === 'peminjam' ? (
                                    <>
                                      <CheckCircle2 size={13} /> Konfirmasi & TTD
                                    </>
                                  ) : (
                                    <>
                                      <Package size={13} /> Serah Terima (Lamp. A)
                                    </>
                                  )}
                                </button>
                              ) : isWaitingForReview ? (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleOpenReview(loan)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '12px', padding: '4px 10px' }}
                                >
                                  <ShieldCheck size={14} /> Review & TTD
                                </button>
                              ) : null}

                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenDetail(loan)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '11px', padding: '3px 8px' }}
                              >
                                <Eye size={13} /> Detail & Log
                              </button>
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
      {selectedLoan && modalMode !== 'checkout' && (
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
                  Formulir Otorisasi & Riwayat Persetujuan Peminjaman
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
              {/* Stepper Progres 4 Tahap */}
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
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>2. Atasan Peminjam</div>
                  <div
                    style={{
                      fontWeight: 'bold',
                      color: selectedLoan.approval_manager_peminjam?.status === 'approved' ? '#16a34a' : '#d97706',
                    }}
                  >
                    {selectedLoan.approval_manager_peminjam?.status === 'approved' ? '✓ Disetujui' : 'Menunggu'}
                  </div>
                </div>
                <ArrowRight size={14} style={{ color: '#94a3b8' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>3. Pengelola (Teknis)</div>
                  <div
                    style={{
                      fontWeight: 'bold',
                      color: selectedLoan.approval_pengelola?.status === 'approved' ? '#16a34a' : '#0284c7',
                    }}
                  >
                    {selectedLoan.approval_pengelola?.status === 'approved' ? '✓ Diteruskan' : 'Menunggu'}
                  </div>
                </div>
                <ArrowRight size={14} style={{ color: '#94a3b8' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>4. Manager Lab</div>
                  <div
                    style={{
                      fontWeight: 'bold',
                      color: selectedLoan.approval_manager_lab?.status === 'approved' ? '#16a34a' : '#7c3aed',
                    }}
                  >
                    {selectedLoan.approval_manager_lab?.status === 'approved' ? '✓ Disahkan' : 'Menunggu'}
                  </div>
                </div>
                <ArrowRight size={14} style={{ color: '#94a3b8' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>5. Serah Terima (Lamp. A)</div>
                  <div
                    style={{
                      fontWeight: 'bold',
                      color:
                        selectedLoan.status === 'SEDANG_DIPINJAM'
                          ? '#16a34a'
                          : selectedLoan.status === 'DIBATALKAN_TS'
                            ? '#dc2626'
                            : selectedLoan.status === 'SIAP_DISERAHKAN'
                              ? '#0284c7'
                              : selectedLoan.status === 'MENUNGGU_SERAH_TERIMA' || selectedLoan.status === 'DISETUJUI'
                                ? '#ea580c'
                                : '#64748b',
                    }}
                  >
                    {selectedLoan.status === 'SEDANG_DIPINJAM'
                      ? '✓ Diserahkan'
                      : selectedLoan.status === 'DIBATALKAN_TS'
                        ? '✕ Batal (TS)'
                        : selectedLoan.status === 'SIAP_DISERAHKAN'
                          ? 'TTD Peminjam'
                          : selectedLoan.status === 'MENUNGGU_SERAH_TERIMA' || selectedLoan.status === 'DISETUJUI'
                            ? 'Cek Pengelola'
                            : 'Belum'}
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
                        Eksternal (Keluar Lingkungan TTH - Butuh Dokumen F/006)
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

              {/* Status 3 Tanda Tangan Digital Resmi */}
              <div style={{ marginBottom: 'var(--sp-5)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: 12, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={16} style={{ color: 'var(--clr-primary-500)' }} />
                  Lembar Otorisasi Persetujuan 3 Tingkat
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
                      1. Menyetujui / Mengetahui:<br />
                      <span style={{ fontWeight: 'normal', color: '#64748b' }}>MANAGER PEMINJAM</span>
                    </div>
                    <div style={{ padding: '8px', borderRight: '1px solid #e2e8f0' }}>
                      2. Diperiksa Teknis oleh:<br />
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
                        <div style={{ fontWeight: 600 }}>{selectedLoan.approval_manager_peminjam?.nama || 'Manajer Peminjam'}</div>
                        <div style={{ color: '#64748b' }}>NIP: {selectedLoan.approval_manager_peminjam?.nip || '-'}</div>
                      </div>
                      <div style={{ margin: '8px 0', textAlign: 'center', minHeight: 45, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedLoan.approval_manager_peminjam?.status === 'skipped' ? (
                          <div style={{ borderBottom: '1px dashed #0284c7', paddingBottom: 2, display: 'inline-block' }}>
                            <span style={{ color: '#0284c7', fontWeight: 'bold', fontSize: '11px' }}>[ DILEWATI (MANAJER SAMA) ]</span>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>Otomatis diteruskan</div>
                          </div>
                        ) : selectedLoan.approval_manager_peminjam?.status === 'approved' || selectedLoan.approval_manager_peminjam?.ttd ? (
                          <div style={{ borderBottom: '1px dashed #16a34a', paddingBottom: 2, display: 'inline-block' }}>
                            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '12px' }}>[ VALIDASI DISETUJUI ]</span>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>
                              {selectedLoan.approval_manager_peminjam?.tanggal ? String(selectedLoan.approval_manager_peminjam.tanggal).slice(0, 10) : ''}
                            </div>
                          </div>
                        ) : selectedLoan.approval_manager_peminjam?.status === 'rejected' ? (
                          <div style={{ borderBottom: '1px dashed #dc2626', paddingBottom: 2, display: 'inline-block' }}>
                            <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '12px' }}>[ DITOLAK ]</span>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>
                              {selectedLoan.approval_manager_peminjam?.tanggal ? String(selectedLoan.approval_manager_peminjam.tanggal).slice(0, 10) : ''}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Belum Disetujui</span>
                        )}
                      </div>
                      <div style={{ color: '#475569', fontSize: '10px' }}>
                        {selectedLoan.approval_manager_peminjam?.catatan ? `"${selectedLoan.approval_manager_peminjam.catatan}"` : '-'}
                      </div>
                    </div>

                    {/* TTD 2: Pengelola Peralatan */}
                    <div style={{ padding: 10, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{selectedLoan.approval_pengelola?.nama || 'Pengelola Peralatan'}</div>
                        <div style={{ color: '#64748b' }}>NIP: {selectedLoan.approval_pengelola?.nip || '-'}</div>
                      </div>
                      <div style={{ margin: '8px 0', textAlign: 'center', minHeight: 45, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedLoan.approval_pengelola?.status === 'approved' || selectedLoan.approval_pengelola?.ttd ? (
                          <div style={{ borderBottom: '1px dashed #16a34a', paddingBottom: 2, display: 'inline-block' }}>
                            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '12px' }}>[ VERIFIKASI TEKNIS LOLOS ]</span>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>
                              {selectedLoan.approval_pengelola?.tanggal ? String(selectedLoan.approval_pengelola.tanggal).slice(0, 10) : ''}
                            </div>
                          </div>
                        ) : selectedLoan.approval_pengelola?.status === 'rejected' ? (
                          <div style={{ borderBottom: '1px dashed #dc2626', paddingBottom: 2, display: 'inline-block' }}>
                            <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '12px' }}>[ DITOLAK ]</span>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>
                              {selectedLoan.approval_pengelola?.tanggal ? String(selectedLoan.approval_pengelola.tanggal).slice(0, 10) : ''}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Belum Diperiksa</span>
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

                    {/* TTD 3: Manager Lab Pemilik */}
                    <div style={{ padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{selectedLoan.approval_manager_lab?.nama || 'Manager Lab'}</div>
                        <div style={{ color: '#64748b' }}>NIP: {selectedLoan.approval_manager_lab?.nip || '-'}</div>
                      </div>
                      <div style={{ margin: '8px 0', textAlign: 'center', minHeight: 45, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedLoan.approval_manager_lab?.status === 'approved' || selectedLoan.approval_manager_lab?.ttd ? (
                          <div style={{ borderBottom: '1px dashed #16a34a', paddingBottom: 2, display: 'inline-block' }}>
                            <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '12px' }}>[ PENGESAHAN DIBERIKAN ]</span>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>
                              {selectedLoan.approval_manager_lab?.tanggal ? String(selectedLoan.approval_manager_lab.tanggal).slice(0, 10) : ''}
                            </div>
                          </div>
                        ) : selectedLoan.approval_manager_lab?.status === 'rejected' ? (
                          <div style={{ borderBottom: '1px dashed #dc2626', paddingBottom: 2, display: 'inline-block' }}>
                            <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '12px' }}>[ DITOLAK ]</span>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>
                              {selectedLoan.approval_manager_lab?.tanggal ? String(selectedLoan.approval_manager_lab.tanggal).slice(0, 10) : ''}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Belum Disahkan</span>
                        )}
                      </div>
                      <div style={{ color: '#475569', fontSize: '10px' }}>
                        {selectedLoan.approval_manager_lab?.catatan ? `"${selectedLoan.approval_manager_lab.catatan}"` : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
                      className="btn btn-warning"
                      onClick={() => handleOpenCheckout(selectedLoan)}
                      style={{ background: '#ea580c', borderColor: '#c2410c', color: '#ffffff', fontWeight: 600 }}
                    >
                      Mulai Serah Terima Fisik (Lampiran A)
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
                      className="btn btn-success"
                      onClick={() => handleOpenCheckout(selectedLoan)}
                      style={{ background: '#16a34a', borderColor: '#15803d', color: '#ffffff', fontWeight: 600 }}
                    >
                      Konfirmasi Terima & TTD
                    </button>
                  )}
                </div>
              )}

              {/* JIKA SUDAH DISERAHKAN (LAMPIRAN A LENGKAP) */}
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: selectedLoan.serah_terima_keluar.ada_ts ? '#991b1b' : '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ClipboardCheck size={16} />
                      Rekaman Serah Terima Fisik Keluar (Lampiran A)
                    </h4>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Dilaksanakan: {selectedLoan.serah_terima_keluar.tanggal}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#334155' }}>
                    <strong>Hasil:</strong>{' '}
                    {selectedLoan.serah_terima_keluar.ada_ts ? (
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>
                        Dibatalkan karena ada butir Tidak Sesuai (TS). Status alat dialihkan menjadi DO_NOT_USE.
                      </span>
                    ) : (
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>
                        Seluruh 10 butir Sesuai (S). Alat telah resmi diserahkan kepada peminjam.
                      </span>
                    )}
                  </p>
                  <div style={{ marginTop: 8, fontSize: '11px', color: '#64748b' }}>
                    Catatan: "{selectedLoan.serah_terima_keluar.catatan}"
                  </div>
                </div>
              )}

              {/* ================================================================ */}
              {/* FORM AKSI APPROVAL AKTIF (OTOMATIS BERDASARKAN WEWENANG AKUN)    */}
              {/* ================================================================ */}
              {modalMode === 'review' &&
                getPendingActionForUser(selectedLoan)?.canReview && (
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
                        Tindakan Keputusan: {' '}
                        {activeReviewStage === 'manager_peminjam' && 'Manager Peminjam (Tahap 1: Validasi Urgensi)'}
                        {activeReviewStage === 'pengelola' && 'Pengelola Peralatan (Tahap 2: Review Teknis & Ketersediaan)'}
                        {activeReviewStage === 'manager_lab' && 'Manager Lab Pemilik (Tahap 3: Pengesahan Final)'}
                      </h4>
                      <span className="badge badge-error" style={{ fontSize: '11px' }}>
                        Wewenang Anda
                      </span>
                    </div>

                    {/* KHUSUS TAHAP 2 PENGELOLA PERALATAN: CHECKLIST VERIFIKASI TEKNIS (BUKAN LAMPIRAN A!) */}
                    {activeReviewStage === 'pengelola' && (
                      <div
                        style={{
                          marginBottom: 'var(--sp-4)',
                          padding: '12px',
                          background: '#eff6ff',
                          borderRadius: '8px',
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e40af', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ShieldCheck size={16} />
                          Checklist Verifikasi Kelayakan & Ketersediaan Alat:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '12px', color: '#1e293b' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={techCheckSchedule}
                              onChange={(e) => setTechCheckSchedule(e.target.checked)}
                              style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                            />
                            <span>
                              <strong>1. Status & Jadwal Kalibrasi:</strong> Alat berstatus LAYAK PAKAI dan rencana tanggal kembali ({selectedLoan.rencana_tanggal_kembali}) tidak melampaui tanggal jatuh tempo kalibrasi ({selectedLoan.peralatan.tgl_jatuh_tempo}).
                            </span>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={techCheckSpec}
                              onChange={(e) => setTechCheckSpec(e.target.checked)}
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
                              onChange={(e) => setTechCheckOperator(e.target.checked)}
                              style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                            />
                            <span>
                              <strong>3. Kewenangan Operator:</strong> Peminjam / Operator ({selectedLoan.peminjam.operator || selectedLoan.peminjam.nama}) memiliki kewenangan dan kompetensi mengoperasikan alat ini.
                            </span>
                          </label>

                          {selectedLoan.is_eksternal && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={techCheckLocation}
                                onChange={(e) => setTechCheckLocation(e.target.checked)}
                                style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                              />
                              <span>
                                <strong>4. Kesiapan Lokasi Eksternal:</strong> Kondisi lingkungan & catu daya di lokasi tujuan ({selectedLoan.lokasi_penggunaan}) memenuhi syarat metode dan spesifikasi alat.
                              </span>
                            </label>
                          )}
                        </div>


                      </div>
                    )}

                    {/* Pilihan Keputusan */}
                    <div className="form-group" style={{ marginBottom: 'var(--sp-3)' }}>
                      <label className="form-label" style={{ fontWeight: 600 }}>Keputusan <span className="required">*</span></label>
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
                            {activeReviewStage === 'pengelola'
                              ? '✓ Lolos Cek (Klik "Teruskan" ke Manager Lab)'
                              : activeReviewStage === 'manager_lab'
                                ? '✓ Setujui Permohonan (Sahkan Izin)'
                                : '✓ Setujui Pengajuan'}
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
                            {activeReviewStage === 'pengelola'
                              ? '✕ Tidak Lolos (Tolak / Usulkan Alat Lain)'
                              : '✕ Tolak Pengajuan'}
                          </span>
                        </label>
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
                          ? activeReviewStage === 'pengelola'
                            ? 'Teruskan ke Manager Lab'
                            : 'Simpan Persetujuan & TTD'
                          : 'Konfirmasi Penolakan'}
                      </button>
                    </div>
                  </form>
                )}

              {/* ================================================================ */}
              {/* TABEL LOGBOOK PERALATAN — DARI BACKEND                           */}
              {/* ================================================================ */}
              <div
                className="card"
                style={{
                  padding: 'var(--sp-4)',
                  marginTop: 'var(--sp-4)',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 'var(--radius-md, 8px)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: '13px',
                        fontWeight: 'bold',
                        margin: 0,
                        color: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <FileText size={16} style={{ color: 'var(--clr-primary-500)' }} />
                      Catatan Logbook Peralatan
                    </h3>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', marginTop: 2 }}>
                      Riwayat aktivitas otomatis dari endpoint <code>GET /api/peralatan/{selectedLoan.peralatan.id}/logbook</code>
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => fetchLogbook(selectedLoan.peralatan?.id)}
                    disabled={isLogbookLoading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '11px',
                      padding: '3px 8px',
                    }}
                  >
                    <RefreshCw size={12} className={isLogbookLoading ? 'spin' : ''} />
                    {isLogbookLoading ? 'Memuat...' : 'Muat Ulang'}
                  </button>
                </div>

                {isLogbookLoading ? (
                  <div style={{ textAlign: 'center', padding: 'var(--sp-4)', color: '#64748b', fontSize: '12px' }}>
                    <RefreshCw size={15} className="spin" style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }} />
                    Menghubungi endpoint backend...
                  </div>
                ) : logbookData.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 'var(--sp-4)',
                      color: '#94a3b8',
                      fontSize: '12px',
                      background: '#f8fafc',
                      borderRadius: 6,
                    }}
                  >
                    Belum ada riwayat logbook untuk peralatan ini di database.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                          <th style={{ padding: '6px 10px', color: '#475569', fontWeight: 600 }}>Waktu</th>
                          <th style={{ padding: '6px 10px', color: '#475569', fontWeight: 600 }}>Aktivitas</th>
                          <th style={{ padding: '6px 10px', color: '#475569', fontWeight: 600 }}>Status</th>
                          <th style={{ padding: '6px 10px', color: '#475569', fontWeight: 600 }}>Petugas / User</th>
                          <th style={{ padding: '6px 10px', color: '#475569', fontWeight: 600 }}>Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logbookData.map((log) => (
                          <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '6px 10px', whiteSpace: 'nowrap', color: '#64748b' }}>
                              {log.created_at
                                ? new Date(log.created_at).toLocaleString('id-ID', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }).replace(/\./g, ':')
                                : '-'}
                            </td>
                            <td style={{ padding: '6px 10px', fontWeight: 600, color: '#0f172a' }}>
                              {log.judul || log.aksi}
                            </td>
                            <td style={{ padding: '6px 10px' }}>
                              <span
                                className="badge badge-primary"
                                style={{ fontSize: '10px', padding: '2px 6px' }}
                              >
                                {log.status}
                              </span>
                            </td>
                            <td style={{ padding: '6px 10px', color: '#334155' }}>
                              {log.user?.name || `User #${log.user?.user_id || '-'}`}
                            </td>
                            <td style={{ padding: '6px 10px', color: '#64748b' }}>
                              {log.keterangan || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedLoan(null)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

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
            style={{
              width: '100%',
              maxWidth: '920px',
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
                      : 'Tahap 4A: Pemeriksaan Serah Terima Fisik (Lampiran A) — Pengelola'}
                  </h2>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: checkoutStep === 'peminjam' ? '#0284c7' : '#c2410c', marginTop: 2 }}>
                  {checkoutStep === 'peminjam'
                    ? `Tiket ${selectedLoan.kode || selectedLoan.id} — Periksa hasil kelayakan fisik dari Pengelola dan bubuhkan tanda tangan tanda terima`
                    : `Tiket ${selectedLoan.kode || selectedLoan.id} — Pemeriksaan fisik 10 butir kelayakan alat oleh Pengelola sebelum diserahkan ke Peminjam`}
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

              {/* Khusus Langkah 4B (Peminjam): Banner Informasi */}
              {checkoutStep === 'peminjam' && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#eff6ff',
                    border: '1.5px solid #93c5fd',
                    borderRadius: '8px',
                    marginBottom: 'var(--sp-4)',
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
                    {selectedLoan.serah_terima_keluar?.pic_petugas || 'Pengelola Lab'}) telah memeriksa 10 butir kelayakan fisik & fungsi alat. Silakan verifikasi hasil checklist di bawah dan bubuhkan tanda tangan tanda terima Anda.
                  </div>
                </div>
              )}

              {/* TABEL LAMPIRAN A (10 BUTIR PEMERIKSAAN RESMI) */}
              <div style={{ marginBottom: 'var(--sp-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ClipboardCheck size={16} style={{ color: '#16a34a' }} />
                    Daftar Periksa Serah Terima Peralatan (Lampiran A — Kolom Keluar)
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {checkoutStep === 'pengelola'
                      ? 'S = Sesuai | TS = Tidak Sesuai | TB = Tidak Berlaku (Khusus No. 3, 7, 8)'
                      : 'Status Terverifikasi Pengelola'}
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
                        const isTB = item.status === 'TB';
                        const canTB = BOLEH_TB_INDEXES.includes(idx);
                        return (
                          <tr
                            key={idx}
                            style={{
                              background: isTS ? '#fef2f2' : isTB ? '#f8fafc' : idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                              borderBottom: '1px solid #e2e8f0',
                            }}
                          >
                            <td style={{ padding: '6px 10px', textAlign: 'center', borderRight: '1px solid #cbd5e1', fontWeight: 600, color: '#475569' }}>
                              {idx + 1}.
                            </td>
                            <td style={{ padding: '6px 10px', borderRight: '1px solid #cbd5e1', lineHeight: 1.35 }}>
                              {butir}
                              {canTB && (
                                <span style={{ marginLeft: 6, fontSize: '10px', color: '#0284c7', background: '#e0f2fe', padding: '1px 5px', borderRadius: 3, border: '1px solid #bae6fd', fontWeight: 600 }}>
                                  Opsional (Boleh TB)
                                </span>
                              )}
                              {idx === 9 && selectedLoan.is_eksternal && (
                                <span style={{ marginLeft: 6, fontSize: '10px', color: '#dc2626', fontWeight: 600 }}>★ Wajib Eksternal</span>
                              )}
                            </td>
                            <td style={{ padding: '6px 10px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                              {checkoutStep === 'pengelola' ? (
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 2, cursor: 'pointer', fontWeight: item.status === 'S' ? 700 : 400, color: item.status === 'S' ? '#16a34a' : '#64748b', fontSize: '11px' }}>
                                    <input
                                      type="radio"
                                      name={`checkout_${idx}`}
                                      value="S"
                                      checked={item.status === 'S'}
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
                                  {canTB && (
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 2, cursor: 'pointer', fontWeight: isTB ? 700 : 400, color: isTB ? '#2563eb' : '#64748b', fontSize: '11px' }}>
                                      <input
                                        type="radio"
                                        name={`checkout_${idx}`}
                                        value="TB"
                                        checked={isTB}
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
                                isTB ? (
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
                                  placeholder={isTS ? 'Wajib jelaskan ketidaksesuaian...' : isTB ? 'Catatan tidak berlaku (opsional)...' : 'Catatan opsional...'}
                                  required={isTS}
                                  style={{
                                    width: '100%',
                                    border: isTS ? '1.5px solid #f87171' : isTB ? '1px solid #93c5fd' : '1px solid #cbd5e1',
                                    borderRadius: 4,
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    background: isTS ? '#fff1f2' : isTB ? '#f0f9ff' : '#ffffff',
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
                    <strong>Pemeriksaan Fisik Memenuhi Syarat:</strong> {countS} butir Sesuai (S){countTB > 0 ? `, ${countTB} butir Tidak Berlaku (TB)` : ''}. Kondisi peralatan layak dan memenuhi standar untuk diserahkan kepada peminjam.
                  </div>
                </div>
              )}

              {/* Jika Eksternal: Pratinjau Dokumen F/006 */}
              {selectedLoan.is_eksternal && countTS === 0 && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#eff6ff',
                    border: '1px solid #93c5fd',
                    borderRadius: '8px',
                    marginBottom: 'var(--sp-4)',
                    fontSize: '12px',
                    color: '#1e40af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={18} />
                    <span>
                      <strong>Dokumen F/006 (Surat Keterangan Membawa Peralatan):</strong> Telah disahkan secara otomatis. Wajib dicetak dan dibawa untuk pemeriksaan di pos Petugas Pengamanan TTH.
                    </span>
                  </div>
                  <span className="badge badge-info" style={{ whiteSpace: 'nowrap' }}>Siap Cetak</span>
                </div>
              )}

              {/* Catatan Serah Terima */}
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
                      label="Tanda Tangan Pengelola Peralatan (Petugas yang Menyerahkan Alat)"
                      required
                      helperText="Tanda tangan Anda akan mengesahkan hasil inspeksi fisik Lampiran A sebelum dialihkan ke peminjam"
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
                  <div>
                    <DigitalSignaturePad
                      value={checkoutSigPeminjam}
                      onChange={setCheckoutSigPeminjam}
                      label="2. Tanda Tangan Peminjam (Penerima Peralatan)"
                      required
                      helperText="Bubuhkan tanda tangan untuk mengonfirmasi penerimaan fisik peralatan"
                    />
                  </div>
                </div>
              )}

              {/* Tombol Eksekusi Serah Terima */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 'var(--sp-4)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedLoan(null)}>
                  Batal
                </button>

                {checkoutStep === 'pengelola' ? (
                  countTS > 0 ? (
                    <button
                      type="submit"
                      className="btn btn-error"
                      disabled={isSubmitting}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                    >
                      <AlertOctagon size={16} />
                      Batalkan Peminjaman & Tandai Alat DO NOT USE
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
                        fontWeight: 700,
                        background: '#ea580c',
                        borderColor: '#c2410c',
                        color: '#ffffff',
                      }}
                    >
                      <ArrowRight size={16} />
                      Sahkan Lampiran A & Teruskan ke Peminjam
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
                      fontWeight: 700,
                      background: '#16a34a',
                      borderColor: '#15803d',
                      color: '#ffffff',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Konfirmasi Penerimaan Peralatan & Sahkan TTD
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
