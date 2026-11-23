import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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
  FileCheck,
  Info,
  Building2,
  RefreshCw,
  AlertOctagon,
  ClipboardCheck,
  Download,
  UserCheck,
  Save,
  FileSignature,
  RotateCcw,
} from "lucide-react";
import {
  getCurrentUser,
  logbookApi,
  peminjamanApi,
  peralatanApi,
  akunApi,
  markNotificationsAsReadByRef,
} from "../../shared/services/api.js";
import WorkflowGuide from "../../shared/components/ui/WorkflowGuide.jsx";
import TableFilters from "../../shared/components/ui/TableFilters.jsx";
import Pagination, { usePagination } from "../../shared/components/ui/Pagination.jsx";
import { useToast } from "../../app/providers/ToastContext.jsx";
import {
  exportLoanF006Pdf,
  exportLoanF006Word,
} from "../../shared/lib/loanPdf.js";

// ============================================================================
// KOMPONEN DIGITAL SIGNATURE PAD (Mengadopsi Standar SiKEPo)
// ============================================================================
function DigitalSignaturePad({
  value,
  onChange,
  label = "Tanda Tangan Digital",
  required = true,
  helperText = "Gunakan mouse, stylus, atau sentuhan layar",
  savedSignature = "",
  onRestore,
  onForgetSaved,
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
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#0f172a";
  }, []);

  // Gambar ulang jika ada data awal
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 560;
    const height = 130;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    if (!value) return undefined;

    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      // Hitung scaling proporsional (contain) agar tanda tangan tidak gepeng / ter-stretch
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;

      let drawW, drawH, drawX, drawY;

      if (imgAspect > canvasAspect) {
        drawW = width;
        drawH = width / imgAspect;
        drawX = 0;
        drawY = (height - drawH) / 2;
      } else {
        drawH = height;
        drawW = height * imgAspect;
        drawX = (width - drawW) / 2;
        drawY = 0;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
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
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const { x, y } = getPoint(e);
    const ctx = canvasRef.current.getContext("2d");
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
      onChange(canvasRef.current.toDataURL("image/png"));
    }
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    onChange("");
  }

  return (
    <div
      className="form-group"
      style={{ marginBottom: "var(--sp-3)", maxWidth: 560 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <label
          className="form-label"
          style={{
            margin: 0,
            fontWeight: "var(--fw-semibold)",
            fontSize: "var(--text-xs)",
          }}
        >
          {label}{" "}
          {required && (
            <span style={{ color: "var(--clr-error-500, #ef4444)" }}>*</span>
          )}
        </label>
        {value ? (
          <span
            className="badge badge-success"
            style={{
              fontSize: "11px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "#dcfce7",
              color: "#15803d",
            }}
          >
            <CheckCircle2 size={12} /> Tanda tangan tercatat
          </span>
        ) : (
          <span className="badge badge-gray" style={{ fontSize: "11px" }}>
            Belum ditandatangani
          </span>
        )}
      </div>

      <div
        className="verification-signature-pad-frame"
        style={{
          position: "relative",
          borderRadius: "var(--radius-lg, 10px)",
          border: "1.5px dashed var(--clr-dark-300, #cbd5e1)",
          background: "#ffffff",
          overflow: "hidden",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 28,
            borderBottom: "1px dashed #cbd5e1",
            pointerEvents: "none",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              color: "#94a3b8",
              background: "#ffffff",
              padding: "0 4px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Tanda Tangan di Atas Garis Ini
          </span>
          <span style={{ fontSize: "10px", color: "#94a3b8" }}>✕</span>
        </div>

        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            width: "100%",
            height: 130,
            display: "block",
            cursor: "crosshair",
            touchAction: "none",
            position: "relative",
            zIndex: 2,
          }}
          aria-label={label}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 6,
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm text-error"
            onClick={clear}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "2px 8px",
              fontSize: "12px",
            }}
          >
            <Eraser size={14} /> Hapus & Goreskan Ulang
          </button>
          {!value && savedSignature && onRestore && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onRestore}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "2px 8px",
                fontSize: "12px",
                color: "#0284c7",
              }}
            >
              Gunakan Tersimpan
            </button>
          )}
          {savedSignature && onForgetSaved && (
            <button
              type="button"
              className="btn btn-ghost btn-sm text-error"
              onClick={onForgetSaved}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "2px 8px",
                fontSize: "12px",
              }}
            >
              Hapus Tersimpan
            </button>
          )}
        </div>
        <span
          style={{ fontSize: "11px", color: "var(--clr-dark-400, #94a3b8)" }}
        >
          {helperText}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// BUTIR PEMERIKSAAN SERAH TERIMA: aspek bertanda W pada kolom A3 (Pinjam & pindah)
// Hanya 5 butir ini yang ditampilkan dan diisi di form.
// ============================================================================
const LAMPIRAN_A_BUTIR = [
  "Identitas alat",
  "Kelengkapan aksesori & manual",
  "Kondisi fisik",
  "Keutuhan segel",
  "Fungsi awal",
];

// Indeks butir yang diisi otomatis dengan daftar kelengkapan peminjaman
const IDX_KELENGKAPAN = 1;

// Backend menerima tepat 5 butir A3 dengan nilai S atau TS
const JUMLAH_BUTIR = LAMPIRAN_A_BUTIR.length;

function lengkapiButirBackend(checks) {
  return checks.slice(0, JUMLAH_BUTIR);
}

// Data pengembalian lama menggabungkan tanggal & lokasi kejadian ke uraian_kejadian.
// Dipakai sebagai fallback bila tanggal_kejadian / lokasi_kejadian belum ada.
function uraikanKejadian(teks = "") {
  const cocok = String(teks).match(
    /^Tanggal kejadian: (.*)\nLokasi kejadian: (.*)\nUraian: ([\s\S]*)$/,
  );
  return cocok
    ? { tanggal: cocok[1], lokasi: cocok[2], uraian: cocok[3] }
    : { tanggal: "", lokasi: "", uraian: String(teks) };
}

// Ambil tanggal, lokasi, dan uraian kejadian dari serah_terima_kembali
function bacaKejadian(stb = {}) {
  const lama = uraikanKejadian(stb.uraian_kejadian || "");
  return {
    tanggal: stb.tanggal_kejadian
      ? String(stb.tanggal_kejadian).slice(0, 10)
      : lama.tanggal,
    lokasi: stb.lokasi_kejadian || lama.lokasi,
    uraian: lama.uraian,
  };
}

function formatTanggalKejadian(tanggal) {
  const d = new Date(tanggal);
  if (!tanggal || isNaN(d.getTime())) return tanggal || "-";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Fallback gambar PNG 1x1 valid untuk membypass validasi backend saat TTD tidak relevan / dibatalkan
const FALLBACK_EMPTY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// ============================================================================
// DATA DUMMY MOCK REALISTIS LENGKAP DENGAN SELURUH SIKLUS HIDUP
// ============================================================================
const INITIAL_LOAN_DATA = [
  {
    id: "PINJAM-2026-001",
    tanggal_pengajuan: "2026-10-04 09:30",
    peralatan: {
      id: 101,
      nama_peralatan: "Digital Storage Oscilloscope Keysight",
      nomor_aset: "TTH-IQA-OSC-001",
      nomor_seri: "MY58102341",
      merek: "Keysight",
      tipe: "DSOX3024T",
      lab_pemilik: "Lab IQA",
      tgl_jatuh_tempo: "2027-02-15",
    },
    peminjam: {
      nama: "Rian Pratama",
      nip: "1992031501",
      lab_asal: "Lab IQA",
      operator: "Rian Pratama (Peminjam Sendiri)",
    },
    tujuan_penggunaan:
      "Pengujian respon transien filter frekuensi dan analisis sinyal risetime.",
    nomor_spk: "SPK/TTH/2026/10/012",
    lokasi_penggunaan: "Lab IQA",
    is_eksternal: false,
    rencana_tanggal_keluar: "2026-10-07",
    rencana_tanggal_kembali: "2026-10-10",
    kelengkapan: "2 unit probe pasif 500MHz, kabel daya, manual book",
    status: "MENUNGGU_MANAGER_PEMINJAM", // Tahap 1
    approval_manager_peminjam: {
      nama: "Manager Lab DES",
      nip: "1975081201",
      status: "pending",
      tanggal: null,
      catatan: "",
      ttd: null,
    },
    approval_pengelola: {
      nama: "Ahmad Fauzi, S.T.",
      nip: "1988042202",
      status: "pending",
      tanggal: null,
      catatan: "",
      ttd: null,
      cek_spesifikasi: true,
      cek_operator: true,
      cek_jadwal_kalibrasi: true,
      cek_lokasi: true,
    },
    approval_manager_lab: {
      nama: "Manager Lab IQA",
      nip: "1978021901",
      status: "pending",
      tanggal: null,
      catatan: "",
      ttd: null,
    },
    serah_terima_keluar: null,
  },
  {
    id: "PINJAM-2026-002",
    tanggal_pengajuan: "2026-10-04 14:15",
    peralatan: {
      id: 102,
      nama_peralatan: "Handheld Spectrum Analyzer R&S",
      nomor_aset: "TTH-SSA-SPEC-003",
      nomor_seri: "RS-FPH-10928",
      merek: "Rohde & Schwarz",
      tipe: "Spectrum Rider FPH",
      lab_pemilik: "Lab SSA",
      tgl_jatuh_tempo: "2026-12-20",
    },
    peminjam: {
      nama: "Siti Aminah",
      nip: "1994052003",
      lab_asal: "Lab DES",
      operator: "Siti Aminah",
    },
    tujuan_penggunaan:
      "Verifikasi spektrum emisi radiasi tidak diinginkan modul LoRa Gateway.",
    nomor_spk: "SPK-UJI-LORA-88",
    lokasi_penggunaan: "Lab IQA",
    is_eksternal: false,
    rencana_tanggal_keluar: "2026-10-08",
    rencana_tanggal_kembali: "2026-10-12",
    kelengkapan: "Antena teleskopik, adaptor DC, attenuator 20dB",
    status: "MENUNGGU_PENGELOLA", // Tahap 2: Menunggu Review Pengelola
    approval_manager_peminjam: {
      nama: "Manager Lab SSA",
      nip: "1981011502",
      status: "approved",
      tanggal: "2026-10-04 16:30",
      catatan:
        "Disetujui. Pastikan operator mengikuti SOP penggunaan spektrum analyzer.",
      ttd: "data:image/png;base64,mockSign1",
    },
    approval_pengelola: {
      nama: "Bambang Sutrisno, S.T.",
      nip: "1986071401",
      status: "pending",
      tanggal: null,
      catatan: "",
      ttd: null,
      cek_spesifikasi: true,
      cek_operator: true,
      cek_jadwal_kalibrasi: true,
      cek_lokasi: true,
    },
    approval_manager_lab: {
      nama: "Manager Lab SSA",
      nip: "1979061803",
      status: "pending",
      tanggal: null,
      catatan: "",
      ttd: null,
    },
    serah_terima_keluar: null,
  },
  {
    id: "PINJAM-2026-003",
    tanggal_pengajuan: "2026-10-05 08:20",
    peralatan: {
      id: 103,
      nama_peralatan: "RF Power Sensor & Power Meter Keysight",
      nomor_aset: "TTH-TIM-PWR-005",
      nomor_seri: "MY45129984",
      merek: "Keysight",
      tipe: "N1913A / E9304A",
      lab_pemilik: "TIM",
      tgl_jatuh_tempo: "2027-01-10",
    },
    peminjam: {
      nama: "Budi Santoso",
      nip: "1991090802",
      lab_asal: "Lab SSA",
      operator: "Budi Santoso & Tim Pengujian Lapangan",
    },
    tujuan_penggunaan:
      "Pengukuran daya pancar RF BTS Telkomsel Outdoor dalam rangka verifikasi izin spektrum frekuensi radio.",
    nomor_spk: "SPK-EXT-TELKOMSEL-2026",
    lokasi_penggunaan:
      "Site BTS Telkomsel Kawasan Cikutra Bandung (Luar Lingkungan TTH)",
    is_eksternal: true, // EKSTERNAL! Wajib F/006
    rencana_tanggal_keluar: "2026-10-09",
    rencana_tanggal_kembali: "2026-10-14",
    kelengkapan:
      "Hardcase pelindung shockproof, power sensor head, kabel GPIB/USB, adaptor charger mobil",
    status: "MENUNGGU_MANAGER_LAB", // Tahap 3: Menunggu Manager Lab Pemilik
    approval_manager_peminjam: {
      nama: "Manager Lab SSA",
      nip: "1981011502",
      status: "approved",
      tanggal: "2026-10-05 09:00",
      catatan:
        "Pengujian resmi lapangan BTS pelanggan Telkomsel. Disetujui dibawa ke luar kantor.",
      ttd: "data:image/png;base64,mockSign2",
    },
    approval_pengelola: {
      nama: "Sony Hartono, S.T.",
      nip: "1989021104",
      status: "approved",
      tanggal: "2026-10-05 11:20",
      catatan:
        "Spesifikasi, kualifikasi operator, dan jadwal aman. Telah diteruskan ke Manager Lab.",
      ttd: "data:image/png;base64,mockSign3",
      cek_spesifikasi: true,
      cek_operator: true,
      cek_jadwal_kalibrasi: true,
      cek_lokasi: true,
    },
    approval_manager_lab: {
      nama: "Manager Lab TIM",
      nip: "1978021901",
      status: "pending",
      tanggal: null,
      catatan: "",
      ttd: null,
    },
    serah_terima_keluar: null,
  },
  {
    id: "PINJAM-2026-004",
    tanggal_pengajuan: "2026-10-03 11:00",
    peralatan: {
      id: 104,
      nama_peralatan: "Optical Time Domain Reflectometer (OTDR)",
      nomor_aset: "TTH-IQA-OTDR-002",
      nomor_seri: "EXFO-FTB-720",
      merek: "EXFO",
      tipe: "FTB-1v2 / FTB-720C",
      lab_pemilik: "Lab IQA",
      tgl_jatuh_tempo: "2026-11-30",
    },
    peminjam: {
      nama: "Doni Setiawan",
      nip: "1993112401",
      lab_asal: "TIM",
      operator: "Doni Setiawan",
    },
    tujuan_penggunaan:
      "Uji atenuasi sambungan serat optik OSP jalur Bandung-Cimahi.",
    nomor_spk: "SPK-OSP-099",
    lokasi_penggunaan: "Area OSP Bandung-Cimahi (Eksternal TTH)",
    is_eksternal: true,
    rencana_tanggal_keluar: "2026-10-07",
    rencana_tanggal_kembali: "2026-10-09",
    kelengkapan:
      "Launch cable 1km FC-UPC, optical connector cleaner, adaptor AC, hardcase",
    status: "MENUNGGU_SERAH_TERIMA", // Tahap 4: Disetujui Manager Lab, Menunggu Serah Terima Fisik (Lampiran A)
    approval_manager_peminjam: {
      nama: "Manager Lab TIM",
      nip: "1979061803",
      status: "approved",
      tanggal: "2026-10-03 13:00",
      catatan: "Disetujui untuk kegiatan dinas lapangan OSP.",
      ttd: "data:image/png;base64,mockSign1",
    },
    approval_pengelola: {
      nama: "Irfan Maulana, S.T.",
      nip: "1987100502",
      status: "approved",
      tanggal: "2026-10-03 14:40",
      catatan: "Spesifikasi & operator valid. Diteruskan ke Manager Lab.",
      ttd: "data:image/png;base64,mockSign3",
      cek_spesifikasi: true,
      cek_operator: true,
      cek_jadwal_kalibrasi: true,
      cek_lokasi: true,
    },
    approval_manager_lab: {
      nama: "Manager Lab IQA",
      nip: "1978021901",
      status: "approved",
      tanggal: "2026-10-03 16:10",
      catatan:
        "Persetujuan akhir disahkan. Lanjutkan ke serah terima fisik keluar bersama peminjam.",
      ttd: "data:image/png;base64,mockSign2",
    },
    serah_terima_keluar: null,
  },
  {
    id: "PINJAM-2026-005",
    tanggal_pengajuan: "2026-10-01 10:00",
    peralatan: {
      id: 105,
      nama_peralatan: "Precision Thermal Imager Fluke Ti480",
      nomor_aset: "TTH-DES-THM-001",
      nomor_seri: "FLK-TI480-8812",
      merek: "Fluke",
      tipe: "Ti480 PRO",
      lab_pemilik: "Lab DES",
      tgl_jatuh_tempo: "2027-04-10",
    },
    peminjam: {
      nama: "Rian Pratama",
      nip: "1992031501",
      lab_asal: "Lab IQA",
      operator: "Rian Pratama",
    },
    tujuan_penggunaan: "Termografi panel distribusi catu daya laboratorium.",
    nomor_spk: "SPK-MAINT-PWR-01",
    lokasi_penggunaan: "Ruang Catu Daya Lab DES & IQA",
    is_eksternal: false,
    rencana_tanggal_keluar: "2026-10-02",
    rencana_tanggal_kembali: "2026-10-06",
    kelengkapan:
      "Tas softcase, 2 baterai smart Li-ion, dock charger, tali gantung",
    status: "SEDANG_DIPINJAM", // Serah Terima Keluar Selesai (Semua S)
    approval_manager_peminjam: {
      nama: "Manager Lab IQA",
      nip: "1978021901",
      status: "approved",
      tanggal: "2026-10-01 11:30",
      catatan: "Disetujui untuk pemeliharaan rutin.",
      ttd: "data:image/png;base64,mockSign1",
    },
    approval_pengelola: {
      nama: "Ahmad Fauzi, S.T.",
      nip: "1988042202",
      status: "approved",
      tanggal: "2026-10-01 13:10",
      catatan: "Kondisi alat layak & siap digunakan.",
      ttd: "data:image/png;base64,mockSign3",
      cek_spesifikasi: true,
      cek_operator: true,
      cek_jadwal_kalibrasi: true,
      cek_lokasi: true,
    },
    approval_manager_lab: {
      nama: "Manager Lab DES",
      nip: "1975081201",
      status: "approved",
      tanggal: "2026-10-01 15:00",
      catatan: "Persetujuan diberikan.",
      ttd: "data:image/png;base64,mockSign2",
    },
    serah_terima_keluar: {
      tanggal: "2026-10-02 08:45",
      pic_petugas: "Ahmad Fauzi, S.T.",
      peminjam_penerima: "Rian Pratama",
      lampiran_a: Array.from({ length: JUMLAH_BUTIR }, () => ({
        status: "S",
        keterangan: "",
      })),
      ada_ts: false,
      ttd_pengelola: "data:image/png;base64,mockSign3",
      ttd_peminjam: "data:image/png;base64,mockSign1",
      catatan: "Peralatan diserahkan lengkap dan dalam kondisi prima.",
      f006_nomor: null,
    },
  },
  {
    id: "PINJAM-2026-006",
    tanggal_pengajuan: "2026-09-28 13:40",
    peralatan: {
      id: 106,
      nama_peralatan: "Sound Level Meter B&K 2250",
      nomor_aset: "TTH-SSA-SLM-002",
      nomor_seri: "BK-2250-9941",
      merek: "Bruel & Kjaer",
      tipe: "Type 2250 Hand-held Analyzer",
      lab_pemilik: "Lab SSA",
      tgl_jatuh_tempo: "2026-12-01",
    },
    peminjam: {
      nama: "Budi Santoso",
      nip: "1991090802",
      lab_asal: "Lab SSA",
      operator: "Budi Santoso",
    },
    tujuan_penggunaan:
      "Uji tingkat kebisingan lingkungan outdoor generator TTH.",
    nomor_spk: "SPK-ENV-NOISE-05",
    lokasi_penggunaan: "Area Generator TTH",
    is_eksternal: false,
    rencana_tanggal_keluar: "2026-09-29",
    rencana_tanggal_kembali: "2026-10-01",
    kelengkapan:
      "Mikrofon free-field, windscreen bola busa, tripod adaptor, baterai",
    status: "DIBATALKAN_TS", // Ada TS saat serah terima -> Batal & alat DO_NOT_USE!
    approval_manager_peminjam: {
      nama: "Manager Lab SSA",
      nip: "1981011502",
      status: "approved",
      tanggal: "2026-09-28 14:00",
      catatan: "Disetujui.",
      ttd: "data:image/png;base64,mockSign2",
    },
    approval_pengelola: {
      nama: "Sony Hartono, S.T.",
      nip: "1989021104",
      status: "approved",
      tanggal: "2026-09-28 15:30",
      catatan: "Diteruskan ke Manager Lab.",
      ttd: "data:image/png;base64,mockSign3",
      cek_spesifikasi: true,
      cek_operator: true,
      cek_jadwal_kalibrasi: true,
      cek_lokasi: true,
    },
    approval_manager_lab: {
      nama: "Manager Lab SSA",
      nip: "1979061803",
      status: "approved",
      tanggal: "2026-09-28 16:45",
      catatan: "Persetujuan disahkan.",
      ttd: "data:image/png;base64,mockSign1",
    },
    serah_terima_keluar: {
      tanggal: "2026-09-29 09:15",
      pic_petugas: "Sony Hartono, S.T.",
      peminjam_penerima: "Budi Santoso",
      lampiran_a: [
        { status: "S", keterangan: "" },
        { status: "S", keterangan: "" },
        { status: "S", keterangan: "" },
        { status: "S", keterangan: "" },
        {
          status: "TS",
          keterangan:
            "Saat swauji unit gagal boot, timbul pesan error korelasi sensor mikrofon.",
        },
      ],
      ada_ts: true,
      ttd_pengelola: "data:image/png;base64,mockSign3",
      ttd_peminjam: "data:image/png;base64,mockSign2",
      catatan:
        "Pemeriksaan menemukan butir 5 gagal fungsi dasar. Penyerahan dibatalkan dan alat diisolasi dengan penanda DO NOT USE.",
      f006_nomor: null,
    },
  },
  {
    id: "PINJAM-2026-007",
    tanggal_pengajuan: "2026-09-20 09:00",
    peralatan: {
      id: 107,
      nama_peralatan: "Digital Multimeter Keysight 34461A",
      nomor_aset: "TTH-DES-DMM-001",
      nomor_seri: "MY53210045",
      merek: "Keysight",
      tipe: "34461A 6½ Digit",
      lab_pemilik: "Lab DES",
      tgl_jatuh_tempo: "2027-01-15",
    },
    peminjam: {
      nama: "Siti Aminah",
      nip: "1994052003",
      lab_asal: "Lab DES",
      operator: "Siti Aminah",
    },
    tujuan_penggunaan:
      "Pengukuran tegangan referensi presisi rangkaian sensor IoT.",
    nomor_spk: "SPK-UJI-IOT-09",
    lokasi_penggunaan: "Lab DES",
    is_eksternal: false,
    rencana_tanggal_keluar: "2026-09-21",
    rencana_tanggal_kembali: "2026-09-25",
    kelengkapan: "Test leads probe set, kabel daya AC, USB cable",
    status: "DIKEMBALIKAN", // Siklus hidup lengkap F/010 selesai
    approval_manager_peminjam: {
      nama: "Manager Lab DES",
      nip: "1975081201",
      status: "approved",
      tanggal: "2026-09-20 10:15",
      catatan: "Disetujui.",
      ttd: "data:image/png;base64,mockSign1",
    },
    approval_pengelola: {
      nama: "Ahmad Fauzi, S.T.",
      nip: "1988042202",
      status: "approved",
      tanggal: "2026-09-20 11:30",
      catatan: "Diteruskan ke Manager Lab.",
      ttd: "data:image/png;base64,mockSign3",
      cek_spesifikasi: true,
      cek_operator: true,
      cek_jadwal_kalibrasi: true,
      cek_lokasi: true,
    },
    approval_manager_lab: {
      nama: "Manager Lab DES",
      nip: "1975081201",
      status: "approved",
      tanggal: "2026-09-20 13:00",
      catatan: "Persetujuan disahkan.",
      ttd: "data:image/png;base64,mockSign2",
    },
    serah_terima_keluar: {
      tanggal: "2026-09-21 08:30",
      pic_petugas: "Ahmad Fauzi, S.T.",
      peminjam_penerima: "Siti Aminah",
      lampiran_a: [
        { status: "S", keterangan: "" },
        { status: "S", keterangan: "" },
        { status: "S", keterangan: "" },
        { status: "S", keterangan: "Lengkap test leads + kabel daya" },
        { status: "S", keterangan: "" },
      ],
      ada_ts: false,
      ttd_pengelola: "data:image/png;base64,mockSign3",
      ttd_peminjam: "data:image/png;base64,mockSign1",
      catatan: "Peralatan diserahkan dalam kondisi baik dan lengkap.",
      f006_nomor: null,
    },
    serah_terima_kembali: {
      tanggal: "2026-09-25 14:20",
      pic_penerima: "Ahmad Fauzi, S.T.",
      peminjam_penyerah: "Siti Aminah",
      ada_kejadian: false,
      uraian_kejadian: "",
      ada_ts: false,
      tindak_lanjut: "PERLU_VERIFIKASI",
      alasan_tindak_lanjut:
        "Semua butir sesuai; masuk status Karantina untuk verifikasi ulang IK/003",
      catatan: "Alat dikembalikan bersih dan seluruh aksesori lengkap.",
      lampiran_a: [
        {
          nomor_butir: 1,
          butir: "Identitas peralatan sesuai TLKM13/F/001",
          status_keluar: "S",
          status: "S",
          keterangan: "",
        },
        {
          nomor_butir: 2,
          butir: "Label status terpasang, terbaca, dan masih berlaku",
          status_keluar: "S",
          status: "S",
          keterangan: "",
        },
        {
          nomor_butir: 3,
          butir: "Kondisi fisik baik (casing, layar, tombol, konektor/port)",
          status_keluar: "S",
          status: "S",
          keterangan: "",
        },
        {
          nomor_butir: 4,
          butir: "Kelengkapan sesuai daftar",
          status_keluar: "S",
          status: "S",
          keterangan: "Lengkap",
        },
        {
          nomor_butir: 5,
          butir: "Fungsi dasar normal (swauji berhasil)",
          status_keluar: "S",
          status: "S",
          keterangan: "",
        },
      ],
      ttd_pengelola: "data:image/png;base64,mockSign3",
      ttd_peminjam: "data:image/png;base64,mockSign1",
    },
  },
];

// Tanggal hari ini (zona waktu lokal) dalam format YYYY-MM-DD
function tanggalHariIni() {
  return new Date().toLocaleDateString("en-CA");
}

// Jumlah hari keterlambatan alat yang belum dikembalikan.
// Bernilai 0 bila alat tidak sedang dipinjam atau belum lewat rencana tanggal kembali.
function hariTerlambat(loan) {
  if (loan?.status !== "SEDANG_DIPINJAM" || !loan.rencana_tanggal_kembali) return 0;
  const batas = new Date(`${String(loan.rencana_tanggal_kembali).slice(0, 10)}T00:00:00`);
  const hariIni = new Date(`${tanggalHariIni()}T00:00:00`);
  const selisih = Math.round((hariIni - batas) / 86400000);
  return selisih > 0 ? selisih : 0;
}

// Status pengajuan yang alatnya belum diserahkan. Bila hari ini sudah lewat dari
// rencana tanggal kembali, backend mengubahnya menjadi KADALUARSA (job harian 07.00
// atau saat ada aksi), jadi aksi persetujuan dan serah terima tidak ditampilkan lagi.
const STATUS_BELUM_DISERAHKAN = [
  "MENUNGGU_MANAGER_PEMINJAM",
  "MENUNGGU_PENGELOLA",
  "MENUNGGU_MANAGER_LAB",
  "MENUNGGU_SERAH_TERIMA",
  "DISETUJUI",
  "SIAP_DISERAHKAN",
];

function lewatTanggalBelumDiserahkan(loan) {
  if (!STATUS_BELUM_DISERAHKAN.includes(loan?.status) || !loan.rencana_tanggal_kembali) return false;
  return String(loan.rencana_tanggal_kembali).slice(0, 10) < tanggalHariIni();
}

// Serah terima keluar dianggap selesai bila Pengelola dan Peminjam sama-sama sudah
// menandatangani. Sebelum itu, surat peminjaman belum boleh dicetak (daftar, detail,
// maupun form serah terima).
function serahTerimaSelesai(loan) {
  const st = loan?.serah_terima_keluar;
  return (
    ["SEDANG_DIPINJAM", "DIKEMBALIKAN"].includes(loan?.status) ||
    Boolean(st?.ttd_pengelola && st?.ttd_peminjam)
  );
}

// Badge pengganti "Sedang Dipinjam" bila alat sudah lewat rencana tanggal kembali
function metaTerlambat(hari) {
  return {
    label: `Belum Dikembalikan · Terlambat ${hari} hari`,
    badgeClass: "badge-error",
    color: "#b91c1c",
    bg: "#fee2e2",
  };
}

// Badge status peminjaman (Sesuai Alur 4 Tahap + Life Cycle Selesai)
const STATUS_META = {
  MENUNGGU_MANAGER_PEMINJAM: {
    label: "Menunggu Atasan Peminjam",
    badgeClass: "badge-warning",
    color: "#d97706",
    bg: "#fef3c7",
  },
  MENUNGGU_PENGELOLA: {
    label: "Menunggu Review Pengelola",
    badgeClass: "badge-info",
    color: "#0284c7",
    bg: "#e0f2fe",
  },
  MENUNGGU_MANAGER_LAB: {
    label: "Menunggu Manager Lab Pemilik",
    badgeClass: "badge-purple",
    color: "#7c3aed",
    bg: "#f3e8ff",
  },
  MENUNGGU_SERAH_TERIMA: {
    label: "Disetujui (Pemeriksaan Pengelola)",
    badgeClass: "badge-warning",
    color: "#ea580c",
    bg: "#fff7ed",
  },
  DISETUJUI: {
    label: "Disetujui (Pemeriksaan Pengelola)",
    badgeClass: "badge-warning",
    color: "#ea580c",
    bg: "#fff7ed",
  },
  SIAP_DISERAHKAN: {
    label: "Siap Diserahkan (Menunggu TTD Peminjam)",
    badgeClass: "badge-info",
    color: "#0284c7",
    bg: "#e0f2fe",
  },
  SEDANG_DIPINJAM: {
    label: "Sedang Dipinjam (Alat Diserahkan)",
    badgeClass: "badge-success",
    color: "#16a34a",
    bg: "#dcfce7",
  },
  DIKEMBALIKAN: {
    label: "Dikembalikan",
    badgeClass: "badge-success",
    color: "#059669",
    bg: "#d1fae5",
  },
  DIBATALKAN_TS: {
    label: "Dibatalkan (Ada TS - DO NOT USE)",
    badgeClass: "badge-error",
    color: "#b91c1c",
    bg: "#fee2e2",
  },
  DITOLAK: {
    label: "Ditolak",
    badgeClass: "badge-error",
    color: "#dc2626",
    bg: "#fee2e2",
  },
  KADALUARSA: {
    label: "Kadaluarsa",
    badgeClass: "badge-gray",
    color: "#64748b",
    bg: "#f1f5f9",
  },
};

export default function LoanApproval({ onNavigate }) {
  const { success, error: toastError, info } = useToast();
  const currentUser = getCurrentUser();
  const currentUserId = Number(currentUser?.user_id ?? currentUser?.id ?? 0);
  const currentUserRole = currentUser?.role || "staff";
  const currentUserLabId = Number(
    currentUser?.labs_id ?? currentUser?.lab_id ?? 0,
  );

  // State Utama
  const [loans, setLoans] = useState([]);
  const [isLoansLoading, setIsLoansLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);

  // MODAL MODE:
  // 'review': Untuk Tahap 1, Tahap 2 (Review Teknis), dan Tahap 3 (Approval Manager Lab)
  // 'checkout': Untuk Tahap 4 (Serah Terima Fisik Keluar - Lampiran A bersama Peminjam)
  // 'detail': Hanya melihat riwayat lengkap
  const [modalMode, setModalMode] = useState("review");

  // Tahap review aktif saat modal dibuka (ditentukan otomatis sesuai tiket yang direview)
  const [activeReviewStage, setActiveReviewStage] = useState("pengelola");
  // 'manager_peminjam' | 'pengelola' | 'manager_lab'

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("SEMUA");
  const [roleFilter, setRoleFilter] = useState("SEMUA");
  // 'SEMUA' | 'peminjam' | 'pengelola' | 'manajer_peminjam' | 'manager_lab'

  // Form State untuk Tindakan Approval Review (Tahap 1, 2, 3)
  const [decisionAction, setDecisionAction] = useState("setuju"); // 'setuju' | 'tolak'
  const [decisionNote, setDecisionNote] = useState("");
  const [digitalSignature, setDigitalSignature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alternativeEquipmentId, setAlternativeEquipmentId] = useState("");
  const [equipmentList, setEquipmentList] = useState([]);
  const [userSavedSig, setUserSavedSig] = useState("");

  // Muat tanda tangan akun dan master lab
  useEffect(() => {
    let cancelled = false;
    akunApi
      .getTtd()
      .then((res) => {
        if (!cancelled && res?.data?.ttd) {
          setUserSavedSig(res.data.ttd);
        }
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleForgetSavedSig() {
    try {
      await akunApi.deleteTtd();
      setUserSavedSig("");
      success("Tanda tangan tersimpan berhasil dihapus dari akun.");
    } catch {
      toastError("Gagal menghapus tanda tangan tersimpan.");
    }
  }

  // Form State untuk Verifikasi Teknis Pengelola di Tahap 2:
  const [techCheckSpec, setTechCheckSpec] = useState(true);
  const [techCheckOperator, setTechCheckOperator] = useState(true);
  const [techCheckSchedule, setTechCheckSchedule] = useState(true);
  const [techCheckLocation, setTechCheckLocation] = useState(true);

  // Form State untuk Serah Terima Fisik Keluar (Tahap 4: F/010)
  const [checkoutChecks, setCheckoutChecks] = useState(
    Array.from({ length: JUMLAH_BUTIR }, () => ({
      status: "S",
      keterangan: "",
    })),
  );
  const [checkoutNote, setCheckoutNote] = useState("");
  const [checkoutSigPengelola, setCheckoutSigPengelola] = useState("");
  const [checkoutSigPeminjam, setCheckoutSigPeminjam] = useState("");
  // Step serah terima fisik (Tahap 4): 'pengelola' (Langkah 4A: Lampiran A) | 'peminjam' (Langkah 4B: Konfirmasi Terima)
  const [checkoutStep, setCheckoutStep] = useState("pengelola");

  // Form State untuk Pengembalian (Kolom Kembali & Bagian D F/010)
  const [returnChecks, setReturnChecks] = useState(
    Array.from({ length: JUMLAH_BUTIR }, () => ({
      status: "S",
      keterangan: "",
    })),
  );
  const [adaKejadian, setAdaKejadian] = useState(false);
  const [uraianKejadian, setUraianKejadian] = useState("");
  const [tanggalKejadian, setTanggalKejadian] = useState("");
  const [lokasiKejadian, setLokasiKejadian] = useState("");
  const [returnCatatan, setReturnCatatan] = useState("");

  // Form State untuk Perpanjangan Peminjaman (Peminjam)
  const [extensionNewDate, setExtensionNewDate] = useState("");
  const [extensionReason, setExtensionReason] = useState("");
  const [isExtensionSubmitting, setIsExtensionSubmitting] = useState(false);

  // Form State untuk Pengesahan Perpanjangan (Pengelola Peralatan)
  const [extensionDecisionAction, setExtensionDecisionAction] =
    useState("setuju"); // 'setuju' | 'tolak'
  const [extensionDecisionNote, setExtensionDecisionNote] = useState("");
  const [extensionDecisionSig, setExtensionDecisionSig] = useState("");
  const [isExtensionDecisionSubmitting, setIsExtensionDecisionSubmitting] =
    useState(false);

  // State Logbook Peralatan Riil (GET /api/peralatan/:id/logbook)
  const [logbookData, setLogbookData] = useState([]);
  const [isLogbookLoading, setIsLogbookLoading] = useState(false);
  const [logbookError, setLogbookError] = useState(null);
  const [expandedLoanLogId, setExpandedLoanLogId] = useState(null);

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
    if (selectedLoan && modalMode === "review") {
      const timer = setTimeout(() => {
        if (decisionFormRef.current) {
          decisionFormRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedLoan, modalMode]);

  useEffect(() => {
    if (selectedLoan && modalMode === "checkout") {
      const timer = setTimeout(() => {
        if (checkoutStep === "peminjam") {
          checkoutSigRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        } else {
          checkoutPengelolaRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedLoan, modalMode, checkoutStep]);

  useEffect(() => {
    if (selectedLoan && modalMode === "return") {
      const timer = setTimeout(() => {
        returnFormRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedLoan, modalMode]);

  // Mendeteksi keterlibatan akun login terhadap suatu tiket peminjaman
  function getLoanUserRelationship(loan) {
    if (!loan) return {};
    const loanLabPeminjamId = Number(
      loan.lab_peminjam_id ??
      loan.peminjam?.lab_id ??
      loan.lab_peminjam?.id ??
      0,
    );
    const isDirectPeminjam =
      currentUserId > 0 &&
      (loan.peminjam?.user_id === currentUserId ||
        loan.peminjam_id === currentUserId);
    const isLabPeminjamStaff =
      currentUserRole === "staff" &&
      currentUserLabId > 0 &&
      loanLabPeminjamId === currentUserLabId;
    const isPeminjam = isDirectPeminjam || isLabPeminjamStaff;

    // Aturan Pengelola (27 Okt 2026):
    // 1. Role staff, pengelola = 1
    // 2. Satu lab dengan lab pemilik alat
    // 3. Bukan peminjam
    // 4. pengelola_id bernilai 0 (belum ada yg memeriksa) atau pengelola_id === currentUserId
    const isStaffPengelola =
      currentUserRole === "staff" &&
      (currentUser?.pengelola === true ||
        currentUser?.pengelola === 1 ||
        currentUser?.pengelola === "1");
    const isNotBorrower =
      currentUserId > 0 &&
      loan.peminjam?.user_id !== currentUserId &&
      loan.peminjam_id !== currentUserId;

    const isLabMatching =
      currentUserLabId > 0 && Number(loan.lab_pemilik_id) === currentUserLabId;

    const pengelolaAssignedId = Number(
      loan.approval_pengelola?.user_id ?? loan.pengelola_id ?? 0,
    );
    const isPengelola =
      currentUserId > 0 &&
      (pengelolaAssignedId === currentUserId ||
        (pengelolaAssignedId === 0 &&
          isStaffPengelola &&
          isNotBorrower &&
          isLabMatching));

    const isManagerPeminjam =
      currentUserId > 0 &&
      (loan.approval_manager_peminjam?.user_id === currentUserId ||
        loan.manajer_peminjam_id === currentUserId);
    const isManagerLab =
      currentUserId > 0 &&
      (loan.approval_manager_lab?.user_id === currentUserId ||
        loan.manager_lab_id === currentUserId);
    const isAdmin = currentUserRole === "admin";
    return {
      isPeminjam,
      isPengelola,
      isManagerPeminjam,
      isManagerLab,
      isAdmin,
    };
  }

  // Mendeteksi apakah tiket sedang menunggu review/tindakan dari akun login
  function getPendingActionForUser(loan) {
    if (!loan) return null;
    if (lewatTanggalBelumDiserahkan(loan)) return null;
    const {
      isPeminjam,
      isPengelola,
      isManagerPeminjam,
      isManagerLab,
      isAdmin,
    } = getLoanUserRelationship(loan);

    // Alur Serah Terima:
    // 4A: Disetujui Manager Lab (status: DISETUJUI / MENUNGGU_SERAH_TERIMA) -> Pengelola memeriksa fisik & isi Lampiran A
    // 4B: Pengelola selesai isi checklist (status: SIAP_DISERAHKAN) -> Peminjam periksa checklist & bubuhkan TTD terima
    const isStageApprovedPengelola =
      loan.status === "DISETUJUI" || loan.status === "MENUNGGU_SERAH_TERIMA";
    const isStageReadyPeminjam = loan.status === "SIAP_DISERAHKAN";

    // 1. Filter: PEMINJAM
    if (roleFilter === "peminjam") {
      if (isStageReadyPeminjam && (isPeminjam || isAdmin)) {
        return {
          canHandover: true,
          step: "peminjam",
          label: "Konfirmasi Terima & TTD Peminjam",
        };
      }
      return null;
    }

    // 2. Filter: PENGELOLA
    if (roleFilter === "pengelola") {
      if (loan.status === "MENUNGGU_PENGELOLA" && (isPengelola || isAdmin)) {
        return {
          canReview: true,
          stage: "pengelola",
          label: "Review Teknis Pengelola",
        };
      }
      if (
        loan.status === "SEDANG_DIPINJAM" &&
        loan.perpanjangan?.some((p) => p.status === "menunggu") &&
        (isPengelola || isAdmin)
      ) {
        return {
          canReviewExtension: true,
          label: "Pengesahan Perpanjangan: Review Pengelola",
        };
      }
      if (isStageApprovedPengelola && (isPengelola || isAdmin)) {
        return {
          canHandover: true,
          step: "pengelola",
          label: "Pengisian Pemeriksaan Kondisi & TTD Pengelola",
        };
      }
      return null;
    }

    // 3. Filter: MANAGER PEMINJAM
    if (roleFilter === "manajer_peminjam") {
      if (
        loan.status === "MENUNGGU_MANAGER_PEMINJAM" &&
        (isManagerPeminjam || isAdmin)
      ) {
        return {
          canReview: true,
          stage: "manager_peminjam",
          label: "Validasi Atasan Peminjam",
        };
      }
      return null;
    }

    // 4. Filter: MANAGER LAB
    if (roleFilter === "manager_lab") {
      if (loan.status === "MENUNGGU_MANAGER_LAB" && (isManagerLab || isAdmin)) {
        return {
          canReview: true,
          stage: "manager_lab",
          label: "Pengesahan Manager Lab",
        };
      }
      return null;
    }

    // Default (roleFilter === 'SEMUA'):
    if (
      loan.status === "MENUNGGU_MANAGER_PEMINJAM" &&
      (isManagerPeminjam || isAdmin)
    ) {
      return {
        canReview: true,
        stage: "manager_peminjam",
        label: "Validasi Atasan Peminjam",
      };
    }
    // Pengelola me-review kelayakan & ketersediaan alat di Tahap 2
    if (loan.status === "MENUNGGU_PENGELOLA" && (isAdmin || isPengelola)) {
      return {
        canReview: true,
        stage: "pengelola",
        label: "Review Teknis Pengelola",
      };
    }
    if (loan.status === "MENUNGGU_MANAGER_LAB" && (isManagerLab || isAdmin)) {
      return {
        canReview: true,
        stage: "manager_lab",
        label: "Pengesahan Manager Lab",
      };
    }
    // Review Perpanjangan Waktu (Wewenang Pengelola)
    if (
      loan.status === "SEDANG_DIPINJAM" &&
      loan.perpanjangan?.some((p) => p.status === "menunggu") &&
      (isPengelola || isAdmin)
    ) {
      return {
        canReviewExtension: true,
        label: "Pengesahan Perpanjangan: Review Pengelola",
      };
    }
    // Tahap 4A: Pengelola memeriksa & mengisi Lampiran A
    if (isStageApprovedPengelola && (isPengelola || isAdmin)) {
      return {
        canHandover: true,
        step: "pengelola",
        label: "Pengisian Pemeriksaan Kondisi & TTD Pengelola",
      };
    }
    // Tahap 4B: Peminjam konfirmasi penerimaan & TTD
    if (isStageReadyPeminjam && (isPeminjam || isAdmin)) {
      return {
        canHandover: true,
        step: "peminjam",
        label: "Konfirmasi Terima & TTD Peminjam",
      };
    }
    return null;
  }

  // Ambil daftar peralatan untuk opsi alternatif jika pengelola menolak
  useEffect(() => {
    let cancelled = false;
    peralatanApi
      .getAll()
      .then((res) => {
        if (!cancelled && Array.isArray(res?.data)) {
          setEquipmentList(
            res.data.filter(
              (item) =>
                item.status_verifikasi === "Disetujui" &&
                item.status_alat === "Aktif",
            ),
          );
        }
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, []);

  // Ambil daftar peminjaman dari Backend
  const fetchLoans = async () => {
    setIsLoansLoading(true);
    try {
      const params = {};
      if (roleFilter !== "SEMUA") {
        params.peran = roleFilter;
      }
      if (statusFilter === "MENUNGGU_SAYA") {
        params.menunggu_saya = true;
      } else if (statusFilter === "TERLAMBAT") {
        params.status = "SEDANG_DIPINJAM";
      } else if (statusFilter !== "SEMUA") {
        params.status = statusFilter;
      }
      const res = await peminjamanApi.getAll(params);
      if (res?.success && Array.isArray(res.data)) {
        setLoans(res.data);
      }
    } catch (err) {
      console.warn("Backend peminjaman offline/fallback:", err);
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
      const res = await logbookApi.getByPeralatanId(peralatanId, "peminjaman");
      if (res?.success && Array.isArray(res.data)) {
        setLogbookData(res.data);
      } else {
        setLogbookData([]);
      }
    } catch (err) {
      console.warn(
        "Backend logbook belum merespons, menggunakan fallback data:",
        err,
      );
      setLogbookError(err.message || "Koneksi ke backend logbook belum aktif.");
      // Fallback mock agar UI tidak kosong saat dev offline
      setLogbookData([
        {
          id: 1,
          jenis: "peminjaman",
          aksi: "pengajuan",
          judul: "Pengajuan peminjaman",
          status: "Diajukan",
          keterangan:
            "Pengajuan peminjaman dicatat pada logbook sistem SiKEPo.",
          referensi_id: 1,
          user: {
            user_id: 3,
            name: "Staff Lab",
          },
          created_at: "2026-10-06T10:39:07+07:00",
        },
      ]);
    } finally {
      setIsLogbookLoading(false);
    }
  }

  function printLoanActivityLog(loan) {
    const escapeHtml = (value) => String(value ?? "—").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);
    const ticketLogs = logbookData.filter(
      (log) => String(log.referensi_id ?? "") === String(loan.id),
    );
    const rows = ticketLogs.map((log) => `
      <tr>
        <td>${escapeHtml(log.created_at ? new Date(log.created_at).toLocaleString("id-ID") : "—")}</td>
        <td>${escapeHtml(String(log.judul || log.aksi || "—").replaceAll("_", " "))}</td>
        <td>${escapeHtml(log.status)}</td>
        <td>${escapeHtml(log.user?.name)}</td>
        <td>${escapeHtml(log.keterangan)}</td>
      </tr>
    `).join("");
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Log Aktivitas Peminjaman ${escapeHtml(loan.kode || loan.id)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
            h1 { font-size: 18px; margin: 0 0 4px; }
            p { margin: 0 0 16px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <h1>Log Aktivitas Peminjaman</h1>
          <p>Tiket ${escapeHtml(loan.kode || loan.id)} — ${escapeHtml(loan.peralatan?.nama_peralatan || "Peralatan")} (${escapeHtml(loan.peralatan?.nomor_aset)})</p>
          <table>
            <thead><tr><th>Waktu</th><th>Aksi</th><th>Status</th><th>Pelaku</th><th>Keterangan</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="5">Belum ada aksi peminjaman untuk tiket ini.</td></tr>'}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  // Filter data sesuai filter bar & role perspective
  const filteredLoans = loans.filter((item) => {
    const q = searchQuery.toLowerCase();
    const kode = (item.kode || String(item.id)).toLowerCase();
    const namaAlat = (item.peralatan?.nama_peralatan || "").toLowerCase();
    const noAset = (item.peralatan?.nomor_aset || "").toLowerCase();
    const namaPeminjam = (item.peminjam?.nama || "").toLowerCase();

    const matchSearch =
      kode.includes(q) ||
      namaAlat.includes(q) ||
      noAset.includes(q) ||
      namaPeminjam.includes(q);

    if (!matchSearch) return false;

    // Filter keterlibatan peran client-side
    if (roleFilter !== "SEMUA") {
      const rel = getLoanUserRelationship(item);
      if (roleFilter === "peminjam" && !rel.isPeminjam && !rel.isAdmin)
        return false;
      if (roleFilter === "pengelola" && !rel.isPengelola && !rel.isAdmin)
        return false;
      if (
        roleFilter === "manajer_peminjam" &&
        (!rel.isManagerPeminjam ||
          item.approval_manager_peminjam?.status === "skipped") &&
        !rel.isAdmin
      )
        return false;
      if (roleFilter === "manager_lab" && !rel.isManagerLab && !rel.isAdmin)
        return false;
    }

    if (statusFilter === "MENUNGGU_SAYA") {
      const pending = getPendingActionForUser(item);
      return Boolean(
        pending?.canReview ||
        pending?.canHandover ||
        pending?.canReturnConfirm ||
        pending?.canReviewExtension,
      );
    }
    if (statusFilter === "TERLAMBAT") {
      return hariTerlambat(item) > 0;
    }
    if (
      statusFilter === "DISETUJUI" ||
      statusFilter === "MENUNGGU_SERAH_TERIMA"
    ) {
      if (
        item.status !== "MENUNGGU_SERAH_TERIMA" &&
        item.status !== "DISETUJUI"
      )
        return false;
    } else if (statusFilter !== "SEMUA" && item.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const pagination = usePagination(
    filteredLoans.length,
    `${searchQuery}\u0000${roleFilter}\u0000${statusFilter}`,
  );
  const paginatedLoans = filteredLoans.slice(
    pagination.startIndex,
    pagination.endIndex,
  );

  // Buka Modal untuk Review Persetujuan (Tahap 1, 2, 3) atau Detail
  async function handleOpenReview(loan) {
    setSelectedLoan(loan);
    setModalMode("review");
    setDecisionNote("");
    setAlternativeEquipmentId("");
    setDigitalSignature(userSavedSig || "");

    // Tandai notifikasi tiket ini sebagai terbaca dan kurangi angka lonceng seketika
    const ticketCode =
      loan?.kode ||
      (typeof loan?.id === "number"
        ? `PJM-2026-${String(loan.id).padStart(3, "0")}`
        : String(loan?.id || ""));
    if (ticketCode) {
      markNotificationsAsReadByRef({ ticketCode });
    }

    // Deteksi tahap review secara otomatis dari status tiket dan hak akses akun
    const pendingAction = getPendingActionForUser(loan);
    const stage =
      pendingAction?.stage ||
      (loan.status === "MENUNGGU_MANAGER_PEMINJAM"
        ? "manager_peminjam"
        : loan.status === "MENUNGGU_PENGELOLA"
          ? "pengelola"
          : loan.status === "MENUNGGU_MANAGER_LAB"
            ? "manager_lab"
            : "pengelola");
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
    if (stage === "pengelola" && !isAllPassed) {
      setDecisionAction("tolak");
      setDecisionNote(
        "Tidak memenuhi kriteria verifikasi kelayakan & ketersediaan peralatan.",
      );
    } else {
      setDecisionAction("setuju");
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
        console.warn("Gagal fetch detail peminjaman review:", err);
      }
    }
  }

  // Toggle checklist verifikasi kelayakan & ketersediaan di Pengelola
  function handleTechCheckToggle(itemKey, isChecked) {
    let nextSchedule = itemKey === "schedule" ? isChecked : techCheckSchedule;
    let nextSpec = itemKey === "spec" ? isChecked : techCheckSpec;
    let nextOperator = itemKey === "operator" ? isChecked : techCheckOperator;
    let nextLocation = itemKey === "location" ? isChecked : techCheckLocation;

    if (itemKey === "schedule") setTechCheckSchedule(isChecked);
    if (itemKey === "spec") setTechCheckSpec(isChecked);
    if (itemKey === "operator") setTechCheckOperator(isChecked);
    if (itemKey === "location") setTechCheckLocation(isChecked);

    const isEksternal = Boolean(selectedLoan?.is_eksternal);
    const allPassed =
      nextSchedule &&
      nextSpec &&
      nextOperator &&
      (!isEksternal || nextLocation);

    if (!allPassed) {
      setDecisionAction("tolak");
      const uncheckedList = [];
      if (!nextSchedule) uncheckedList.push("Jadwal/Status Kalibrasi");
      if (!nextSpec) uncheckedList.push("Kesesuaian Spesifikasi Teknis");
      if (!nextOperator) uncheckedList.push("Kewenangan Operator");
      if (isEksternal && !nextLocation)
        uncheckedList.push("Kesiapan Lokasi Eksternal");

      const autoReason = `Tidak memenuhi kriteria verifikasi kelayakan & ketersediaan: ${uncheckedList.join(", ")}.`;
      if (
        !decisionNote.trim() ||
        decisionNote.startsWith("Tidak memenuhi kriteria verifikasi")
      ) {
        setDecisionNote(autoReason);
      }
    } else {
      setDecisionAction("setuju");
      if (decisionNote.startsWith("Tidak memenuhi kriteria verifikasi")) {
        setDecisionNote("");
      }
    }
  }

  // Buka Modal Khusus Serah Terima Keluar (Tahap 4: F/010)
  async function handleOpenCheckout(loan) {
    setSelectedLoan(loan);
    setModalMode("checkout");
    const ticketCode =
      loan?.kode ||
      (typeof loan?.id === "number"
        ? `PJM-2026-${String(loan.id).padStart(3, "0")}`
        : String(loan?.id || ""));
    if (ticketCode) {
      markNotificationsAsReadByRef({ ticketCode });
    }

    const pending = getPendingActionForUser(loan);
    const step =
      pending?.step ||
      (loan.status === "SIAP_DISERAHKAN" ? "peminjam" : "pengelola");
    setCheckoutStep(step);

    setCheckoutNote(loan.serah_terima_keluar?.catatan || "");
    setCheckoutSigPengelola(
      loan.serah_terima_keluar?.ttd_pengelola ||
      (step === "pengelola" ? userSavedSig : "") ||
      "",
    );
    setCheckoutSigPeminjam(
      loan.serah_terima_keluar?.ttd_peminjam ||
      (step === "peminjam" ? userSavedSig : "") ||
      "",
    );

    const kelengkapanList =
      loan.kebutuhan_kelengkapan || loan.kelengkapan || "";

    if (
      loan.serah_terima_keluar?.lampiran_a &&
      loan.serah_terima_keluar.lampiran_a.length > 0
    ) {
      setCheckoutChecks(
        loan.serah_terima_keluar.lampiran_a
          .slice(0, JUMLAH_BUTIR)
          .map((it, idx) => ({
            status: it.status || "S",
            keterangan:
              it.keterangan ||
              (idx === IDX_KELENGKAPAN && kelengkapanList
                ? `Sesuai daftar: ${kelengkapanList}`
                : ""),
          })),
      );
    } else {
      // Default: semua butir S. Butir kelengkapan pre-fill daftar kelengkapan bila ada
      setCheckoutChecks(
        Array.from({ length: JUMLAH_BUTIR }, (_, idx) => ({
          status: "S",
          keterangan:
            idx === IDX_KELENGKAPAN && kelengkapanList
              ? `Sesuai daftar: ${kelengkapanList}`
              : "",
        })),
      );
    }

    // Jika tiket numerik riil backend, ambil detail lengkap agar TTD Pengelola dan data lampiran A terambil utuh
    if (!isNaN(Number(loan.id))) {
      try {
        const detailRes = await peminjamanApi.getById(loan.id);
        if (detailRes?.success && detailRes.data) {
          const detail = detailRes.data;
          setSelectedLoan(detail);
          const detailKelengkapan =
            detail.kebutuhan_kelengkapan || detail.kelengkapan || "";
          if (detail.serah_terima_keluar) {
            setCheckoutNote(detail.serah_terima_keluar.catatan || "");
            if (detail.serah_terima_keluar.ttd_pengelola) {
              setCheckoutSigPengelola(detail.serah_terima_keluar.ttd_pengelola);
            }
            if (
              detail.serah_terima_keluar.lampiran_a &&
              detail.serah_terima_keluar.lampiran_a.length > 0
            ) {
              setCheckoutChecks(
                detail.serah_terima_keluar.lampiran_a
                  .slice(0, JUMLAH_BUTIR)
                  .map((it, idx) => ({
                    status: it.status || "S",
                    keterangan:
                      it.keterangan ||
                      (idx === IDX_KELENGKAPAN && detailKelengkapan
                        ? `Sesuai daftar: ${detailKelengkapan}`
                        : ""),
                  })),
              );
            }
          }
        }
      } catch (err) {
        console.warn("Gagal fetch detail peminjaman serah terima:", err);
      }
    }
  }

  // Buka Modal Khusus Pengembalian Peralatan
  async function handleOpenReturn(loan) {
    setSelectedLoan(loan);
    setModalMode("return");
    setAdaKejadian(false);
    setUraianKejadian("");
    setTanggalKejadian("");
    setLokasiKejadian(loan.lokasi_penggunaan || "");
    setReturnCatatan("");

    // Muat data kejadian dari akun peminjam jika ada
    const savedKejadian = localStorage.getItem(
      `sikepo_return_kejadian_${loan.id}`,
    );
    if (savedKejadian) {
      try {
        const parsed = JSON.parse(savedKejadian);
        if (parsed.adaKejadian !== undefined)
          setAdaKejadian(Boolean(parsed.adaKejadian));
        if (parsed.uraianKejadian) setUraianKejadian(parsed.uraianKejadian);
        if (parsed.tanggalKejadian) setTanggalKejadian(parsed.tanggalKejadian);
        if (parsed.lokasiKejadian) setLokasiKejadian(parsed.lokasiKejadian);
      } catch (_) { }
    }

    // Tandai notifikasi tiket ini sebagai terbaca dan kurangi angka lonceng seketika
    const ticketCode =
      loan?.kode ||
      (typeof loan?.id === "number"
        ? `PJM-2026-${String(loan.id).padStart(3, "0")}`
        : String(loan?.id || ""));
    if (ticketCode) {
      markNotificationsAsReadByRef({ ticketCode });
    }

    const kelengkapanList =
      loan.kebutuhan_kelengkapan || loan.kelengkapan || "";
    let initialChecks = Array.from({ length: JUMLAH_BUTIR }, (_, idx) => ({
      status: "S",
      keterangan:
        idx === IDX_KELENGKAPAN && kelengkapanList
          ? `Sesuai daftar: ${kelengkapanList}`
          : "",
    }));

    if (
      loan.serah_terima_kembali?.lampiran_a &&
      loan.serah_terima_kembali.lampiran_a.length > 0
    ) {
      initialChecks = loan.serah_terima_kembali.lampiran_a
        .slice(0, JUMLAH_BUTIR)
        .map((it) => ({
          status: it.status || "S",
          keterangan: it.keterangan || "",
        }));
    } else if (
      loan.serah_terima_keluar?.lampiran_a &&
      loan.serah_terima_keluar.lampiran_a.length > 0
    ) {
      initialChecks = loan.serah_terima_keluar.lampiran_a
        .slice(0, JUMLAH_BUTIR)
        .map((it, idx) => ({
          status: "S",
          keterangan:
            idx === IDX_KELENGKAPAN && kelengkapanList
              ? `Sesuai daftar: ${kelengkapanList}`
              : "",
        }));
    }
    setReturnChecks(initialChecks);

    if (loan.serah_terima_kembali) {
      const stb = loan.serah_terima_kembali;
      if (stb.ada_kejadian !== undefined)
        setAdaKejadian(Boolean(stb.ada_kejadian));
      if (stb.uraian_kejadian || stb.tanggal_kejadian) {
        const kejadian = bacaKejadian(stb);
        setUraianKejadian(kejadian.uraian);
        setTanggalKejadian(kejadian.tanggal);
        setLokasiKejadian(kejadian.lokasi);
      }
      if (stb.catatan) setReturnCatatan(stb.catatan);
    }

    if (!isNaN(Number(loan.id))) {
      try {
        const detailRes = await peminjamanApi.getById(loan.id);
        if (detailRes?.success && detailRes.data) {
          const detail = detailRes.data;
          setSelectedLoan(detail);
          const detailKelengkapan =
            detail.kebutuhan_kelengkapan || detail.kelengkapan || "";
          if (detail.serah_terima_kembali) {
            const stb = detail.serah_terima_kembali;
            if (stb.ada_kejadian !== undefined)
              setAdaKejadian(Boolean(stb.ada_kejadian));
            if (stb.uraian_kejadian || stb.tanggal_kejadian) {
              const kejadian = bacaKejadian(stb);
              setUraianKejadian(kejadian.uraian);
              setTanggalKejadian(kejadian.tanggal);
              setLokasiKejadian(kejadian.lokasi);
            }
            if (stb.catatan) setReturnCatatan(stb.catatan);
            if (stb.lampiran_a && stb.lampiran_a.length > 0) {
              setReturnChecks(
                stb.lampiran_a.slice(0, JUMLAH_BUTIR).map((it) => ({
                  status: it.status || "S",
                  keterangan: it.keterangan || "",
                })),
              );
            }
          } else if (
            detail.serah_terima_keluar?.lampiran_a &&
            detail.serah_terima_keluar.lampiran_a.length > 0
          ) {
            setReturnChecks(
              detail.serah_terima_keluar.lampiran_a
                .slice(0, JUMLAH_BUTIR)
                .map((it, idx) => ({
                  status: "S",
                  keterangan:
                    idx === IDX_KELENGKAPAN && detailKelengkapan
                      ? `Sesuai daftar: ${detailKelengkapan}`
                      : "",
                })),
            );
          }
        }
      } catch (err) {
        console.warn("Gagal fetch detail peminjaman pengembalian:", err);
      }
    }
  }

  // Buka Modal Hanya untuk Melihat Detail Riwayat
  async function handleOpenDetail(loan) {
    setSelectedLoan(loan);
    setModalMode("detail");

    // Tandai notifikasi tiket ini sebagai terbaca dan kurangi angka lonceng seketika
    const ticketCode =
      loan?.kode ||
      (typeof loan?.id === "number"
        ? `PJM-2026-${String(loan.id).padStart(3, "0")}`
        : String(loan?.id || ""));
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
        console.warn("Gagal fetch detail peminjaman:", err);
      }
    }
  }

  // Helper hitung minimum tanggal perpanjangan (H+1 dari rencana_tanggal_kembali)
  function getMinExtensionDate(loan) {
    if (!loan?.rencana_tanggal_kembali) {
      const now = new Date();
      now.setDate(now.getDate() + 1);
      return now.toISOString().split("T")[0];
    }
    const current = new Date(loan.rencana_tanggal_kembali);
    current.setDate(current.getDate() + 1);
    return current.toISOString().split("T")[0];
  }

  // Handler buka modal ajukan perpanjangan (Peminjam)
  function handleOpenExtensionRequest(loan) {
    setSelectedLoan(loan);
    setModalMode("extension_request");
    setExtensionReason("");
    setExtensionNewDate(getMinExtensionDate(loan));
  }

  // Handler buka modal review perpanjangan (Pengelola Peralatan)
  function handleOpenExtensionReview(loan) {
    const { isPengelola, isAdmin } = getLoanUserRelationship(loan);
    if (!isPengelola && !isAdmin) {
      toastError(
        "Hanya Pengelola Peralatan yang berwenang meninjau perpanjangan peminjaman.",
      );
      return;
    }
    setSelectedLoan(loan);
    setModalMode("extension_review");
    setExtensionDecisionAction("setuju");
    setExtensionDecisionNote("");
    setExtensionDecisionSig("");
  }

  // Handler Submit Pengajuan Perpanjangan (Peminjam)
  async function handleSubmitExtensionRequest(e) {
    e.preventDefault();
    if (!selectedLoan) return;

    if (!extensionNewDate) {
      toastError("Harap tentukan tanggal kembali baru.");
      return;
    }

    if (!extensionReason.trim()) {
      toastError("Harap isi alasan permohonan perpanjangan.");
      return;
    }

    if (extensionNewDate <= selectedLoan.rencana_tanggal_kembali) {
      toastError(
        `Tanggal kembali baru harus setelah tanggal kembali saat ini (${selectedLoan.rencana_tanggal_kembali}).`,
      );
      return;
    }

    setIsExtensionSubmitting(true);
    try {
      const payload = {
        tanggal_kembali_baru: extensionNewDate,
        alasan: extensionReason.trim(),
      };
      const res = await peminjamanApi.ajukanPerpanjangan(
        selectedLoan.id,
        payload,
      );
      if (res?.success) {
        success(
          "Permohonan perpanjangan berhasil diajukan dan sedang menunggu persetujuan Pengelola Peralatan.",
        );
        setSelectedLoan(null);
        fetchLoans();
      } else {
        toastError(res?.message || "Gagal mengajukan perpanjangan.");
      }
    } catch (err) {
      toastError(
        err.message || "Terjadi kesalahan saat mengajukan perpanjangan.",
      );
    } finally {
      setIsExtensionSubmitting(false);
    }
  }

  // Handler Submit Keputusan Perpanjangan (Pengelola)
  async function handleSubmitExtensionDecision(e) {
    e.preventDefault();
    if (!selectedLoan) return;

    const waitingPj = selectedLoan.perpanjangan?.find(
      (p) => p.status === "menunggu",
    );
    if (!waitingPj) {
      toastError(
        "Tidak ada pengajuan perpanjangan yang sedang menunggu verifikasi.",
      );
      return;
    }

    if (extensionDecisionAction === "tolak" && !extensionDecisionNote.trim()) {
      toastError("Harap isi alasan penolakan perpanjangan.");
      return;
    }

    setIsExtensionDecisionSubmitting(true);
    try {
      const payload = {
        keputusan: extensionDecisionAction,
        catatan: extensionDecisionNote.trim(),
      };
      const res = await peminjamanApi.keputusanPerpanjangan(
        selectedLoan.id,
        waitingPj.id,
        payload,
      );
      if (res?.success) {
        success(
          extensionDecisionAction === "setuju"
            ? "Perpanjangan peminjaman berhasil disetujui & disahkan."
            : "Perpanjangan peminjaman telah ditolak.",
        );
        setSelectedLoan(null);
        setModalMode(null);
        setExtensionDecisionAction("setuju");
        setExtensionDecisionNote("");
        setExtensionDecisionSig("");
        fetchLoans();
      } else {
        toastError(res?.message || "Gagal memproses keputusan perpanjangan.");
      }
    } catch (err) {
      toastError(err.message || "Terjadi kesalahan saat memproses keputusan.");
    } finally {
      setIsExtensionDecisionSubmitting(false);
    }
  }

  // Submit Keputusan Review Persetujuan (Tahap 1, 2, 3)
  async function handleSubmitDecision(e) {
    e.preventDefault();
    if (!selectedLoan) return;

    if (activeReviewStage === "pengelola") {
      const isAllTechChecksPassed =
        techCheckSchedule &&
        techCheckSpec &&
        techCheckOperator &&
        (!selectedLoan.is_eksternal || techCheckLocation);
      if (!isAllTechChecksPassed && decisionAction === "setuju") {
        toastError(
          "Semua butir kelayakan & ketersediaan wajib diceklis untuk menyetujui peminjaman.",
        );
        setDecisionAction("tolak");
        return;
      }
    }

    if (decisionAction === "setuju" && !digitalSignature?.trim()) {
      toastError(
        "Tanda tangan digital wajib dibubuhkan sebelum menyetujui pengajuan.",
      );
      return;
    }

    if (decisionAction === "tolak" && !decisionNote.trim()) {
      toastError("Alasan penolakan wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      const body = {
        keputusan: decisionAction, // "setuju" atau "tolak"
        catatan: decisionNote.trim(),
        ttd: digitalSignature?.trim() || "",
      };

      if (activeReviewStage === "pengelola") {
        body.cek_spesifikasi = Boolean(techCheckSpec);
        body.cek_operator = Boolean(techCheckOperator);
        body.cek_lokasi = Boolean(techCheckLocation);
      }

      if (
        decisionAction === "tolak" &&
        alternativeEquipmentId &&
        activeReviewStage === "pengelola"
      ) {
        body.alat_alternatif_id = Number(alternativeEquipmentId);
      }

      const isBackendId = !isNaN(Number(selectedLoan.id));
      if (isBackendId) {
        const res = await peminjamanApi.keputusan(selectedLoan.id, body);
        success(
          res?.message || `Keputusan ${decisionAction} berhasil dicatat.`,
        );
        markNotificationsAsReadByRef({ ticketCode: selectedLoan.kode });
        await fetchLoans();
      } else {
        // Fallback mutasi state in-memory bila sedang mode offline/mock
        const nowFormatted = new Date()
          .toLocaleString("id-ID", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
          .replace(/\./g, ":");

        setLoans((prevLoans) =>
          prevLoans.map((item) => {
            if (item.id !== selectedLoan.id) return item;

            const updated = { ...item };

            if (decisionAction === "tolak") {
              updated.status = "DITOLAK";
              if (activeReviewStage === "manager_peminjam") {
                updated.approval_manager_peminjam = {
                  ...updated.approval_manager_peminjam,
                  status: "rejected",
                  tanggal: nowFormatted,
                  catatan: decisionNote,
                  ttd: digitalSignature,
                };
              } else if (activeReviewStage === "pengelola") {
                updated.approval_pengelola = {
                  ...updated.approval_pengelola,
                  status: "rejected",
                  tanggal: nowFormatted,
                  catatan: decisionNote,
                  ttd: digitalSignature,
                  cek_spesifikasi: techCheckSpec,
                  cek_operator: techCheckOperator,
                  cek_jadwal_kalibrasi: techCheckSchedule,
                  cek_lokasi: techCheckLocation,
                };
              } else if (activeReviewStage === "manager_lab") {
                updated.approval_manager_lab = {
                  ...updated.approval_manager_lab,
                  status: "rejected",
                  tanggal: nowFormatted,
                  catatan: decisionNote,
                  ttd: digitalSignature,
                };
              }
              return updated;
            }

            // JIKA MENYETUJUI / MENERUSKAN:
            if (activeReviewStage === "manager_peminjam") {
              updated.status = "MENUNGGU_PENGELOLA";
              updated.approval_manager_peminjam = {
                ...updated.approval_manager_peminjam,
                status: "approved",
                tanggal: nowFormatted,
                catatan: decisionNote || "Disetujui oleh Atasan Peminjam.",
                ttd: digitalSignature,
              };
            } else if (activeReviewStage === "pengelola") {
              updated.status = "MENUNGGU_MANAGER_LAB";
              updated.approval_pengelola = {
                ...updated.approval_pengelola,
                status: "approved",
                tanggal: nowFormatted,
                catatan:
                  decisionNote ||
                  "Verifikasi teknis, wewenang operator, dan ketersediaan jadwal terpenuhi. Diteruskan ke Manager Lab.",
                ttd: digitalSignature,
                cek_spesifikasi: techCheckSpec,
                cek_operator: techCheckOperator,
                cek_jadwal_kalibrasi: techCheckSchedule,
                cek_lokasi: techCheckLocation,
              };
            } else if (activeReviewStage === "manager_lab") {
              updated.status = "DISETUJUI";
              updated.approval_manager_lab = {
                ...updated.approval_manager_lab,
                status: "approved",
                tanggal: nowFormatted,
                catatan:
                  decisionNote ||
                  "Persetujuan peminjaman disahkan. Silakan laksanakan serah terima keluar fisik menggunakan Pemeriksaan Kondisi.",
                ttd: digitalSignature,
              };
            }

            return updated;
          }),
        );

        success(
          decisionAction === "setuju"
            ? `Persetujuan berhasil disimpan! Tiket peminjaman ${selectedLoan.kode || selectedLoan.id} diperbarui.`
            : `Pengajuan peminjaman ${selectedLoan.kode || selectedLoan.id} ditolak.`,
        );
      }
      setSelectedLoan(null);
    } catch (err) {
      toastError(err.message || "Gagal menyimpan keputusan.");
      if (err.status === 409) {
        setSelectedLoan(null);
        await fetchLoans();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Submit Serah Terima Keluar Fisik (Tahap 4: F/010)
  async function handleSubmitCheckout(e) {
    e.preventDefault();
    if (!selectedLoan) return;

    if (checkoutStep === "pengelola") {
      // 1. Semua 5 butir wajib terisi statusnya (S atau TS)
      const butirKirim = lengkapiButirBackend(checkoutChecks);
      if (
        butirKirim.length !== JUMLAH_BUTIR ||
        butirKirim.some((i) => !i.status)
      ) {
        toastError(
          "Semua 5 butir pemeriksaan lembar serah terima (F/010) wajib diisi statusnya.",
        );
        return;
      }

      // 2. Butir TS wajib diisi penjelasannya pada kolom keterangan
      const adaItemTS = butirKirim.some((i) => i.status === "TS");
      if (adaItemTS) {
        const itemTSKosong = butirKirim.some(
          (i) => i.status === "TS" && !i.keterangan?.trim(),
        );
        if (itemTSKosong) {
          toastError(
            "Semua butir Tidak Sesuai (TS) wajib diisi penjelasannya pada kolom keterangan.",
          );
          return;
        }
      }

      // 3. Tanda tangan Pengelola Peralatan wajib jika tidak ada butir TS
      if (
        !adaItemTS &&
        (!checkoutSigPengelola?.trim() ||
          checkoutSigPengelola === FALLBACK_EMPTY_PNG)
      ) {
        toastError("Tanda tangan Pengelola Peralatan wajib dibubuhkan.");
        return;
      }

      setIsSubmitting(true);
      try {
        const payload = {
          lampiran_a: butirKirim.map((it) => ({
            status: it.status,
            keterangan: it.keterangan ? it.keterangan.trim() : "",
          })),
          catatan: checkoutNote ? checkoutNote.trim() : "",
          ttd:
            checkoutSigPengelola?.trim() ||
            (adaItemTS ? FALLBACK_EMPTY_PNG : ""),
        };

        const res = await peminjamanApi.serahTerima(selectedLoan.id, payload);
        if (res?.success === false) {
          throw new Error(
            res.message || "Gagal menyimpan checklist serah terima",
          );
        }

        markNotificationsAsReadByRef({ ticketCode: selectedLoan.kode });
        setSelectedLoan(null);
        await fetchLoans();

        if (adaItemTS) {
          toastError(
            `Serah terima dibatalkan karena terdapat butir TS. Tiket ${selectedLoan.kode || selectedLoan.id} ditutup dan status alat dialihkan menjadi DO NOT USE.`,
          );
        } else {
          success(
            `Pemeriksaan serah terima keluar berhasil disahkan! Tiket ${selectedLoan.kode || selectedLoan.id} kini berstatus SIAP_DISERAHKAN dan menunggu konfirmasi dari Peminjam.`,
          );
        }
      } catch (err) {
        toastError(err.message || "Gagal memproses serah terima keluar");
        if (err.status === 409) {
          setSelectedLoan(null);
          await fetchLoans();
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // checkoutStep === 'peminjam' (TTD wajib diisi)
      if (
        !checkoutSigPeminjam ||
        !checkoutSigPeminjam.trim() ||
        checkoutSigPeminjam === FALLBACK_EMPTY_PNG
      ) {
        toastError(
          "Tanda tangan peminjam wajib dibubuhkan sebelum mengonfirmasi penerimaan peralatan.",
        );
        return;
      }

      setIsSubmitting(true);
      try {
        const payload = {
          ttd: checkoutSigPeminjam.trim(),
        };

        const res = await peminjamanApi.konfirmasiTerima(
          selectedLoan.id,
          payload,
        );
        if (res?.success === false) {
          throw new Error(
            res.message || "Gagal mengonfirmasi penerimaan peralatan",
          );
        }

        markNotificationsAsReadByRef({ ticketCode: selectedLoan.kode });
        setSelectedLoan(null);
        await fetchLoans();

        success(
          `Penerimaan peralatan berhasil dikonfirmasi! Tiket ${selectedLoan.kode || selectedLoan.id} kini resmi berstatus SEDANG_DIPINJAM dan status alat menjadi Dipinjam.`,
        );
      } catch (err) {
        toastError(err.message || "Gagal mengonfirmasi penerimaan peralatan");
        if (err.status === 409) {
          setSelectedLoan(null);
          await fetchLoans();
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  // Pengesahan Pengembalian Peralatan oleh Pengelola: pemeriksaan fisik & fungsi + Bagian D, tanpa tanda tangan
  async function handleSubmitReturn(e) {
    e.preventDefault();
    if (!selectedLoan) return;

    // 1. Validasi 5 butir
    const butirKirim = lengkapiButirBackend(returnChecks);
    if (
      butirKirim.length !== JUMLAH_BUTIR ||
      butirKirim.some((i) => !i.status)
    ) {
      toastError(
        "Semua 5 butir pemeriksaan pengembalian wajib diisi statusnya (S atau TS).",
      );
      return;
    }

    // 2. Butir TS wajib diisi penjelasannya
    const itemTSKosong = butirKirim.some(
      (i) => i.status === "TS" && !i.keterangan?.trim(),
    );
    if (itemTSKosong) {
      toastError(
        "Semua butir Tidak Sesuai (TS) wajib diisi penjelasannya pada kolom keterangan.",
      );
      return;
    }

    // 3. Validasi Bagian D: Jika Ada Kejadian, tanggal dan uraian kejadian wajib diisi
    if (adaKejadian && !tanggalKejadian) {
      toastError("Tanggal kejadian wajib diisi.");
      return;
    }
    if (adaKejadian && !uraianKejadian.trim()) {
      toastError("Uraian kejadian abnormal wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        lampiran_a: butirKirim.map((it) => ({
          status: it.status,
          keterangan: it.keterangan ? it.keterangan.trim() : "",
        })),
        ada_kejadian: Boolean(adaKejadian),
        uraian_kejadian: adaKejadian ? uraianKejadian.trim() : "",
        tanggal_kejadian: adaKejadian ? tanggalKejadian : "",
        lokasi_kejadian: adaKejadian
          ? lokasiKejadian.trim() || selectedLoan.lokasi_penggunaan || ""
          : "",
        catatan: returnCatatan ? returnCatatan.trim() : "",
      };

      const res = await peminjamanApi.pengembalian(selectedLoan.id, payload);
      if (res?.success === false) {
        throw new Error(
          res.message || "Gagal mencatat pemeriksaan pengembalian",
        );
      }

      localStorage.removeItem(`sikepo_return_kejadian_${selectedLoan.id}`);

      markNotificationsAsReadByRef({ ticketCode: selectedLoan.kode });
      setSelectedLoan(null);
      await fetchLoans();

      success(
        `Pengembalian tiket ${selectedLoan.kode || selectedLoan.id} berhasil disahkan! Status peralatan telah diperbarui.`,
      );
    } catch (err) {
      toastError(err.message || "Gagal memproses pengembalian");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Hitung berapa TS dan S yang dipilih di form Keluar (F/010)
  const countTS = checkoutChecks
    .slice(0, LAMPIRAN_A_BUTIR.length)
    .filter((i) => i.status === "TS").length;
  const countS = checkoutChecks
    .slice(0, LAMPIRAN_A_BUTIR.length)
    .filter((i) => i.status === "S").length;

  // Hitung berapa TS dan S yang dipilih di form Pengembalian (F/010)
  const countReturnTS = returnChecks.filter((i) => i.status === "TS").length;
  const countReturnS = returnChecks.filter((i) => i.status === "S").length;

  return (
    <div
      className="page-container fade-in-up"
      style={{ paddingBottom: "var(--sp-8)" }}
    >
      {/* ==================================================================== */}
      {/* 1. HEADER HALAMAN                                                    */}
      {/* ==================================================================== */}
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "var(--sp-4)",
          marginBottom: "var(--sp-4)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              Modul Peminjaman & Persetujuan Peralatan
            </h1>
          </div>
          <p className="page-subtitle" style={{ marginTop: 4 }}>
            Kelola pengajuan peminjaman, proses verifikasi persetujuan resmi,
            dan pelaksanaan serah terima fisik peralatan laboratorium.
          </p>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ALUR PROSES PEMINJAMAN — SWIMLANE SIKEPO                             */}
      {/* ==================================================================== */}
      <WorkflowGuide
        title="Alur Proses Persetujuan & Serah Terima Peminjaman"
        description="Ikuti tahapan pengajuan, persetujuan, hingga serah terima peralatan."
        steps={[
          {
            title: "Pengajuan Peminjam",
            description:
              "Peminjam mengisi formulir pengajuan dan jadwal peminjaman.",
          },
          {
            title: "Validasi Manajer Peminjam",
            description:
              "Manajer peminjam memvalidasi urgensi dan jadwal pengujian.",
          },
          {
            title: "Pengelola Peralatan",
            description:
              "Pengelola memeriksa ketersediaan, kelayakan alat, dan operator.",
          },
          {
            title: "Persetujuan Manager Lab Pemilik",
            description:
              "Manager Lab pemilik meninjau dan menyetujui peminjaman.",
          },
          {
            title: "Serah Terima & Checklist Pemeriksaan Kondisi",
            description:
              "Pengelola dan peminjam memeriksa kondisi alat sebelum serah terima.",
          },
        ]}
      />

      {/* ==================================================================== */}
      {/* 2. BILAH FILTER & PENCARIAN                                          */}
      {/* ==================================================================== */}
      <TableFilters
        fields={[
          {
            type: "search",
            id: "loan-search",
            label: "Cari peralatan",
            placeholder: "Nama, nomor aset, atau peminjam...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
          },
          {
            type: "select",
            id: "loan-involvement",
            label: "Keterlibatan",
            placeholder: "Semua keterlibatan",
            placeholderValue: "SEMUA",
            value: roleFilter,
            onChange: (e) => setRoleFilter(e.target.value),
            options: [
              ...(currentUserRole === "staff"
                ? [
                  { value: "peminjam", label: "Sebagai Peminjam" },
                  { value: "pengelola", label: "Sebagai Pengelola Peralatan" },
                ]
                : []),
              ...(currentUserRole === "manager"
                ? [
                  { value: "manajer_peminjam", label: "Sebagai Atasan Peminjam" },
                  { value: "manager_lab", label: "Sebagai Manager Lab Pemilik" },
                ]
                : []),
              ...(currentUserRole === "admin"
                ? [
                  { value: "peminjam", label: "Peran Peminjam" },
                  { value: "pengelola", label: "Peran Pengelola Peralatan" },
                  { value: "manajer_peminjam", label: "Peran Atasan Peminjam" },
                  { value: "manager_lab", label: "Peran Manager Lab Pemilik" },
                ]
                : []),
            ],
          },
          {
            type: "select",
            id: "loan-activity",
            label: "Aktivitas",
            placeholder: "Semua aktivitas",
            placeholderValue: "SEMUA",
            value: statusFilter,
            onChange: (e) => setStatusFilter(e.target.value),
            options: [
              { value: "MENUNGGU_SAYA", label: "🔥 Menunggu Tindakan Saya" },
              { value: "MENUNGGU_MANAGER_PEMINJAM", label: "Menunggu Atasan Peminjam" },
              { value: "MENUNGGU_PENGELOLA", label: "Menunggu Review Pengelola" },
              { value: "MENUNGGU_MANAGER_LAB", label: "Menunggu Manager Lab" },
              { value: "DISETUJUI", label: "Disetujui (Cek Pengelola)" },
              { value: "SIAP_DISERAHKAN", label: "Siap Diserahkan (TTD Peminjam)" },
              { value: "SEDANG_DIPINJAM", label: "Sedang Dipinjam (Alat Diserahkan)" },
              { value: "TERLAMBAT", label: "Belum Dikembalikan (Terlambat)" },
              { value: "KADALUARSA", label: "Kadaluarsa" },
              { value: "DIKEMBALIKAN", label: "Dikembalikan" },
              { value: "DIBATALKAN_TS", label: "Dibatalkan (Ada TS - DO NOT USE)" },
              { value: "DITOLAK", label: "Ditolak" },
            ],
          },
        ]}
        actions={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("SEMUA");
              setStatusFilter("SEMUA");
            }}
            title="Reset filter"
            aria-label="Reset filter peminjaman"
          >
            <RotateCcw size={16} />
          </button>
        }
      />

      {/* ==================================================================== */}
      {/* 5. TABEL DAFTAR PEMINJAMAN                                           */}
      {/* ==================================================================== */}
      <div
        className="card"
        style={{ overflow: "hidden", marginBottom: "var(--sp-5)" }}
      >
        <div className="table-responsive">
          <table
            className="table"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "1.5px solid #e2e8f0",
                  textAlign: "left",
                }}
              >
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  No. Tiket & Tanggal
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Peralatan
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Peminjam
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Lokasi & Tipe
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Periode Pinjam
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#475569",
                    textAlign: "center",
                  }}
                >
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoansLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "var(--sp-8)",
                      color: "#64748b",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: "13px",
                      }}
                    >
                      <span
                        className="spinner"
                        style={{ width: 16, height: 16 }}
                      />{" "}
                      Memuat data peminjaman...
                    </div>
                  </td>
                </tr>
              ) : filteredLoans.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "var(--sp-6)",
                      color: "#94a3b8",
                    }}
                  >
                    Tidak ada data peminjaman yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedLoans.map((loan) => {
                  const terlambat = hariTerlambat(loan);
                  const meta = terlambat > 0
                    ? metaTerlambat(terlambat)
                    : lewatTanggalBelumDiserahkan(loan)
                      ? { ...STATUS_META.KADALUARSA, label: "Kadaluarsa (lewat rencana kembali)" }
                      : STATUS_META[loan.status] || {
                    label: loan.status,
                    badgeClass: "badge-gray",
                    color: "#64748b",
                    bg: "#f1f5f9",
                  };

                  // Deteksi peran akun login dan apakah tiket menunggu tindakan akun ini
                  const pendingAction = getPendingActionForUser(loan);
                  const isWaitingForReview = Boolean(pendingAction?.canReview);
                  const isReadyForHandover = Boolean(
                    pendingAction?.canHandover,
                  );
                  const {
                    isPeminjam,
                    isPengelola,
                    isManagerPeminjam,
                    isManagerLab,
                    isAdmin,
                  } = getLoanUserRelationship(loan);

                  return (
                    <tr
                      key={loan.id}
                      style={{
                        borderBottom: "1px solid #e2e8f0",
                        background:
                          isWaitingForReview ||
                            isReadyForHandover ||
                            pendingAction?.canReviewExtension
                            ? "#fffbeb"
                            : "#ffffff",
                        transition: "background 0.2s",
                      }}
                    >
                      {/* 1. ID Tiket */}
                      <td
                        style={{ padding: "12px 16px", verticalAlign: "top" }}
                      >
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: "13px",
                            color: "#0f172a",
                          }}
                        >
                          {loan.kode || loan.id}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          {loan.tanggal_pengajuan
                            ? String(loan.tanggal_pengajuan).slice(0, 10)
                            : ""}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            flexWrap: "wrap",
                            marginTop: 4,
                          }}
                        >
                          {/* Jika filter peran aktif, tampilkan hanya badge peran yang sedang disaring */}
                          {roleFilter === "peminjam" && (
                            <span
                              className="badge badge-primary"
                              style={{ fontSize: "9px", padding: "1px 5px" }}
                            >
                              Peminjam
                            </span>
                          )}
                          {roleFilter === "pengelola" && (
                            <span
                              className="badge badge-red"
                              style={{ fontSize: "9px", padding: "1px 5px" }}
                            >
                              Pengelola
                            </span>
                          )}
                          {roleFilter === "manajer_peminjam" && (
                            <span
                              className="badge badge-warning"
                              style={{ fontSize: "9px", padding: "1px 5px" }}
                            >
                              Atasan
                            </span>
                          )}
                          {roleFilter === "manager_lab" && (
                            <span
                              className="badge badge-secondary"
                              style={{ fontSize: "9px", padding: "1px 5px" }}
                            >
                              Mgr Lab
                            </span>
                          )}

                          {/* Jika filter peran 'SEMUA', tampilkan badge yang relevan tanpa tumpang tindih */}
                          {roleFilter === "SEMUA" && (
                            <>
                              {isPeminjam && (
                                <span
                                  className="badge badge-primary"
                                  style={{
                                    fontSize: "9px",
                                    padding: "1px 5px",
                                  }}
                                >
                                  Peminjam
                                </span>
                              )}
                              {isPengelola && (
                                <span
                                  className="badge badge-red"
                                  style={{
                                    fontSize: "9px",
                                    padding: "1px 5px",
                                  }}
                                >
                                  Pengelola
                                </span>
                              )}
                              {isManagerPeminjam &&
                                loan.approval_manager_peminjam?.status !==
                                "skipped" && (
                                  <span
                                    className="badge badge-warning"
                                    style={{
                                      fontSize: "9px",
                                      padding: "1px 5px",
                                    }}
                                  >
                                    Atasan
                                  </span>
                                )}
                              {isManagerLab && (
                                <span
                                  className="badge badge-secondary"
                                  style={{
                                    fontSize: "9px",
                                    padding: "1px 5px",
                                  }}
                                >
                                  Mgr Lab
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      {/* 2. Peralatan */}
                      <td
                        style={{ padding: "12px 16px", verticalAlign: "top" }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "13px",
                            color: "#0f172a",
                          }}
                        >
                          {loan.peralatan.nama_peralatan}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#64748b",
                            marginTop: 2,
                          }}
                        >
                          No. Aset: <strong>{loan.peralatan.nomor_aset}</strong>
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                          Pemilik: {loan.peralatan.lab_pemilik}
                        </div>
                      </td>

                      {/* 3. Peminjam */}
                      <td
                        style={{ padding: "12px 16px", verticalAlign: "top" }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "13px",
                            color: "#0f172a",
                          }}
                        >
                          {loan.peminjam.nama}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          {loan.peminjam.lab_asal}
                        </div>
                        {loan.peminjam.operator && (
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#0284c7",
                              marginTop: 2,
                            }}
                          >
                            Op: {loan.peminjam.operator}
                          </div>
                        )}
                      </td>

                      {/* 4. Lokasi & Eksternal */}
                      <td
                        style={{ padding: "12px 16px", verticalAlign: "top" }}
                      >
                        <div style={{ fontSize: "12px", color: "#1e293b" }}>
                          {loan.lokasi_penggunaan}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          {loan.is_eksternal ? (
                            <span
                              className="badge"
                              style={{
                                fontSize: "10px",
                                background: "#fee2e2",
                                color: "#b91c1c",
                                border: "1px solid #fecaca",
                                fontWeight: 600,
                              }}
                            >
                              Eksternal (Luar TTH)
                            </span>
                          ) : (
                            <span
                              className="badge"
                              style={{
                                fontSize: "10px",
                                background: "#f1f5f9",
                                color: "#475569",
                              }}
                            >
                              Internal TTH
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Periode Pinjam */}
                      <td
                        style={{
                          padding: "12px 16px",
                          verticalAlign: "top",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#0f172a",
                            fontWeight: 500,
                          }}
                        >
                          {loan.rencana_tanggal_keluar} s.d{" "}
                          {loan.rencana_tanggal_kembali}
                        </div>
                        {loan.rencana_tanggal_kembali_awal &&
                          loan.rencana_tanggal_kembali_awal !==
                          loan.rencana_tanggal_kembali && (
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#059669",
                                marginTop: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <span
                                style={{
                                  textDecoration: "line-through",
                                  color: "#94a3b8",
                                }}
                              >
                                {loan.rencana_tanggal_kembali_awal}
                              </span>
                              <span>➔ {loan.rencana_tanggal_kembali}</span>
                            </div>
                          )}
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#64748b",
                            marginTop: 2,
                          }}
                        >
                          Jatuh tempo kalibrasi:{" "}
                          {loan.peralatan.tgl_jatuh_tempo}
                        </div>
                      </td>

                      {/* 6. Status Approval & Mini Stepper */}
                      <td
                        style={{ padding: "12px 16px", verticalAlign: "top" }}
                      >
                        <span
                          className="badge"
                          style={{
                            fontSize: "11px",
                            background: meta.bg,
                            color: meta.color,
                            border: `1px solid ${meta.color}40`,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 8px",
                          }}
                        >
                          <Clock size={12} /> {meta.label}
                        </span>

                        {/* Indikator Menunggu Review Perpanjangan */}
                        {loan.status === "SEDANG_DIPINJAM" &&
                          loan.perpanjangan?.some(
                            (p) => p.status === "menunggu",
                          ) && (
                            <div style={{ marginTop: 4 }}>
                              <span
                                className="badge"
                                style={{
                                  fontSize: "10px",
                                  background: "#fef3c7",
                                  color: "#b45309",
                                  border: "1px solid #fde68a",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                  padding: "2px 6px",
                                  fontWeight: 700,
                                }}
                              >
                                <Clock size={9} /> Perpanjangan Menunggu
                              </span>
                            </div>
                          )}

                        {/* Mini Stepper 4 Tahap (Hijau = Selesai/Lolos | Merah = Ditolak | Abu = Belum) */}
                        <div
                          style={{ display: "flex", gap: 4, marginTop: 6 }}
                          title="Status Alur 4 Tahap: Hijau = Selesai/Disetujui | Merah = Ditolak | Abu-abu = Belum"
                        >
                          <span
                            title={
                              loan.status === "DIKEMBALIKAN"
                                ? "Tahap 1: Selesai Disetujui (Hijau)"
                                : loan.approval_manager_peminjam?.status ===
                                  "approved"
                                  ? "Tahap 1: Disetujui Atasan (Hijau)"
                                  : loan.approval_manager_peminjam?.status ===
                                    "skipped"
                                    ? "Tahap 1: Dilewati Otomatis (Hijau)"
                                    : loan.approval_manager_peminjam?.status ===
                                      "rejected"
                                      ? "Tahap 1: Ditolak (Merah)"
                                      : "Tahap 1: Belum Disetujui (Abu-abu)"
                            }
                            style={{
                              width: 14,
                              height: 6,
                              borderRadius: 3,
                              background:
                                loan.status === "DIKEMBALIKAN" ||
                                  loan.approval_manager_peminjam?.status ===
                                  "approved" ||
                                  loan.approval_manager_peminjam?.status ===
                                  "skipped"
                                  ? "#16a34a"
                                  : loan.approval_manager_peminjam?.status ===
                                    "rejected"
                                    ? "#dc2626"
                                    : "#cbd5e1",
                            }}
                          />
                          <span
                            title={
                              loan.status === "DIKEMBALIKAN"
                                ? "Tahap 2: Selesai Disetujui (Hijau)"
                                : loan.approval_pengelola?.status === "approved"
                                  ? "Tahap 2: Disetujui Pengelola (Hijau)"
                                  : loan.approval_pengelola?.status ===
                                    "rejected"
                                    ? "Tahap 2: Ditolak (Merah)"
                                    : "Tahap 2: Belum Disetujui (Abu-abu)"
                            }
                            style={{
                              width: 14,
                              height: 6,
                              borderRadius: 3,
                              background:
                                loan.status === "DIKEMBALIKAN" ||
                                  loan.approval_pengelola?.status === "approved"
                                  ? "#16a34a"
                                  : loan.approval_pengelola?.status ===
                                    "rejected"
                                    ? "#dc2626"
                                    : "#cbd5e1",
                            }}
                          />
                          <span
                            title={
                              loan.status === "DIKEMBALIKAN"
                                ? "Tahap 3: Selesai Disetujui (Hijau)"
                                : loan.approval_manager_lab?.status ===
                                  "approved"
                                  ? "Tahap 3: Disetujui Manager Lab (Hijau)"
                                  : loan.approval_manager_lab?.status ===
                                    "rejected"
                                    ? "Tahap 3: Ditolak (Merah)"
                                    : "Tahap 3: Belum Disetujui (Abu-abu)"
                            }
                            style={{
                              width: 14,
                              height: 6,
                              borderRadius: 3,
                              background:
                                loan.status === "DIKEMBALIKAN" ||
                                  loan.approval_manager_lab?.status === "approved"
                                  ? "#16a34a"
                                  : loan.approval_manager_lab?.status ===
                                    "rejected"
                                    ? "#dc2626"
                                    : "#cbd5e1",
                            }}
                          />
                          <span
                            title={
                              loan.status === "DIKEMBALIKAN"
                                ? "Tahap 4 & Selesai: Telah Dikembalikan (Hijau)"
                                : loan.status === "SEDANG_DIPINJAM"
                                  ? "Tahap 4: Selesai Diserahkan (Hijau)"
                                  : loan.status === "DIBATALKAN_TS"
                                    ? "Tahap 4: Dibatalkan TS (Merah)"
                                    : "Tahap 4: Belum Diserahkan (Abu-abu)"
                            }
                            style={{
                              width: 14,
                              height: 6,
                              borderRadius: 3,
                              background:
                                loan.status === "DIKEMBALIKAN" ||
                                  loan.status === "SEDANG_DIPINJAM"
                                  ? "#16a34a"
                                  : loan.status === "DIBATALKAN_TS"
                                    ? "#dc2626"
                                    : "#cbd5e1",
                            }}
                          />
                        </div>
                      </td>

                      {/* 7. Tombol Aksi Berdasarkan Wewenang Role */}
                      <td
                        style={{
                          padding: "12px 16px",
                          verticalAlign: "top",
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            alignItems: "stretch",
                            width: "100%",
                            maxWidth: "145px",
                            margin: "0 auto",
                          }}
                        >
                          {isReadyForHandover ? (
                            <button
                              type="button"
                              className={`btn ${pendingAction?.step === "peminjam" ? "btn-success" : "btn-primary"} btn-sm`}
                              onClick={() => handleOpenCheckout(loan)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 5,
                                fontSize: "12px",
                                padding: "5px 10px",
                                height: "28px",
                                boxSizing: "border-box",
                                fontWeight: 600,
                                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
                                ...(pendingAction?.step === "peminjam"
                                  ? {
                                      background: "#16a34a",
                                      borderColor: "#15803d",
                                      color: "#ffffff",
                                    }
                                  : {}),
                              }}
                            >
                              {pendingAction?.step === "peminjam" ? (
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
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 5,
                                fontSize: "12px",
                                padding: "5px 10px",
                                height: "28px",
                                boxSizing: "border-box",
                                fontWeight: 600,
                                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
                              }}
                            >
                              <ShieldCheck size={13} /> Tinjau Peminjaman
                            </button>
                          ) : loan.status === "SEDANG_DIPINJAM" ? (
                            <>
                              {/* Jika ada perpanjangan yang menunggu persetujuan Pengelola */}
                              {loan.perpanjangan?.some(
                                (p) => p.status === "menunggu",
                              ) ? (
                                isPengelola || isAdmin ? (
                                  <button
                                    type="button"
                                    className="btn btn-warning btn-sm"
                                    onClick={() =>
                                      handleOpenExtensionReview(loan)
                                    }
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 5,
                                      fontSize: "12px",
                                      padding: "5px 10px",
                                      height: "28px",
                                      boxSizing: "border-box",
                                      background: "#ea580c",
                                      borderColor: "#c2410c",
                                      color: "#ffffff",
                                      fontWeight: 600,
                                      boxShadow:
                                        "0 1px 2px rgba(0, 0, 0, 0.08)",
                                    }}
                                    title="Ada pengajuan perpanjangan yang membutuhkan review & keputusan Pengelola"
                                  >
                                    <ShieldCheck size={13} /> Review
                                    Perpanjangan
                                  </button>
                                ) : (
                                  <span
                                    className="badge badge-warning"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 4,
                                      fontSize: "11px",
                                      padding: "4px 8px",
                                      height: "28px",
                                      boxSizing: "border-box",
                                      cursor: "default",
                                    }}
                                    title="Permohonan perpanjangan sedang menunggu keputusan Pengelola Peralatan"
                                  >
                                    <Clock size={11} /> Menunggu Pengelola
                                  </span>
                                )
                              ) : /* Jika status SEDANG_DIPINJAM dan peminjam dapat mengajukan perpanjangan */
                                (isPeminjam || isAdmin) &&
                                  loan.dapat_diperpanjang ? (
                                  <button
                                    type="button"
                                    className="btn btn-sm"
                                    onClick={() =>
                                      handleOpenExtensionRequest(loan)
                                    }
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 5,
                                      fontSize: "12px",
                                      padding: "5px 10px",
                                      height: "28px",
                                      boxSizing: "border-box",
                                      background: "#f59e0b",
                                      borderColor: "#d97706",
                                      color: "#ffffff",
                                      fontWeight: 600,
                                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
                                    }}
                                    title="Ajukan permohonan perpanjangan waktu pengembalian peralatan"
                                  >
                                    <CalendarClock size={13} /> Ajukan
                                    Perpanjangan
                                  </button>
                                ) : null}

                              {isPengelola || isAdmin ? (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleOpenReturn(loan)}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 5,
                                    fontSize: "12px",
                                    padding: "5px 10px",
                                    height: "28px",
                                    boxSizing: "border-box",
                                    background: "#0284c7",
                                    borderColor: "#0369a1",
                                    color: "#ffffff",
                                    fontWeight: 600,
                                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
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
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 5,
                              fontSize: "12px",
                              padding: "5px 10px",
                              height: "28px",
                              boxSizing: "border-box",
                              fontWeight: 600,
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
                            }}
                            title="Lihat detail lengkap peminjaman dan riwayat logbook"
                          >
                            <Eye size={13} /> Detail
                          </button>

                          {serahTerimaSelesai(loan) && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => exportLoanF006Pdf(loan)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 5,
                                  fontSize: "12px",
                                  padding: "5px 10px",
                                  height: "28px",
                                  boxSizing: "border-box",
                                  color: "#1d4ed8",
                                  borderColor: "#bfdbfe",
                                  background: "#eff6ff",
                                  fontWeight: 600,
                                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
                                }}
                                title="Cetak Surat Peminjaman Peralatan (TLKM13/F/00X Versi 01)"
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
        {!isLoansLoading && (
          <Pagination
            totalItems={filteredLoans.length}
            currentPage={pagination.currentPage}
            onPageChange={pagination.setCurrentPage}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            totalPages={pagination.totalPages}
          />
        )}
      </div>

      {/* ==================================================================== */}
      {/* 6. MODAL 1: REVIEW PERSETUJUAN (TAHAP 1, 2, 3) & DETAIL             */}
      {/* ==================================================================== */}
      {selectedLoan &&
        modalMode !== "checkout" &&
        modalMode !== "return" &&
        modalMode !== "extension_request" &&
        modalMode !== "extension_review" &&
        (() => {
          const isReviewAction =
            modalMode === "review" &&
            getPendingActionForUser(selectedLoan)?.canReview;

          // Evaluasi data penolakan jika permohonan peminjaman ditolak (Tahap 1, 2, atau 3)
          const isLoanRejected =
            selectedLoan.status === "DITOLAK" ||
            selectedLoan.approval_manager_peminjam?.status === "rejected" ||
            selectedLoan.approval_pengelola?.status === "rejected" ||
            selectedLoan.approval_manager_lab?.status === "rejected";

          const rejectionInfo = (() => {
            if (!isLoanRejected) return null;

            if (selectedLoan.approval_pengelola?.status === "rejected") {
              const altEquip =
                selectedLoan.approval_pengelola?.alat_alternatif ||
                selectedLoan.alat_alternatif ||
                (selectedLoan.approval_pengelola?.alat_alternatif_id ||
                  selectedLoan.alat_alternatif_id
                  ? equipmentList.find(
                    (eq) =>
                      Number(eq.id) ===
                      Number(
                        selectedLoan.approval_pengelola?.alat_alternatif_id ||
                        selectedLoan.alat_alternatif_id,
                      ),
                  )
                  : null);

              return {
                stage: "Review Teknis Pengelola Peralatan",
                role: "Pengelola Peralatan",
                nama:
                  selectedLoan.approval_pengelola?.nama ||
                  selectedLoan.pengelola_nama ||
                  selectedLoan.pengelola?.name ||
                  "Pengelola Lab",
                nip: selectedLoan.approval_pengelola?.nip || "-",
                tanggal:
                  selectedLoan.approval_pengelola?.tanggal ||
                  selectedLoan.approval_pengelola?.updated_at ||
                  "",
                catatan: selectedLoan.approval_pengelola?.catatan || "",
                alatAlternatif: altEquip,
                failedChecks: [
                  selectedLoan.approval_pengelola?.cek_jadwal_kalibrasi ===
                  false && "Status / Jadwal Kalibrasi",
                  selectedLoan.approval_pengelola?.cek_spesifikasi === false &&
                  "Kesesuaian Spesifikasi Teknis",
                  selectedLoan.approval_pengelola?.cek_operator === false &&
                  "Kewenangan & Kompetensi Operator",
                  selectedLoan.approval_pengelola?.cek_lokasi === false &&
                  "Kesiapan & Keamanan Lokasi",
                ].filter(Boolean),
              };
            }

            if (selectedLoan.approval_manager_lab?.status === "rejected") {
              return {
                stage: "Persetujuan Akhir Manager Lab Pemilik",
                role: "Manager Lab Pemilik Peralatan",
                nama:
                  selectedLoan.approval_manager_lab?.nama ||
                  selectedLoan.manager_lab_nama ||
                  "Manager Lab",
                nip: selectedLoan.approval_manager_lab?.nip || "-",
                tanggal:
                  selectedLoan.approval_manager_lab?.tanggal ||
                  selectedLoan.approval_manager_lab?.updated_at ||
                  "",
                catatan: selectedLoan.approval_manager_lab?.catatan || "",
                alatAlternatif: null,
                failedChecks: [],
              };
            }

            if (selectedLoan.approval_manager_peminjam?.status === "rejected") {
              return {
                stage: "Validasi Atasan Peminjam",
                role: "Manager / Atasan Peminjam",
                nama:
                  selectedLoan.approval_manager_peminjam?.nama ||
                  selectedLoan.manajer_peminjam_nama ||
                  "Manager Peminjam",
                nip: selectedLoan.approval_manager_peminjam?.nip || "-",
                tanggal:
                  selectedLoan.approval_manager_peminjam?.tanggal ||
                  selectedLoan.approval_manager_peminjam?.updated_at ||
                  "",
                catatan: selectedLoan.approval_manager_peminjam?.catatan || "",
                alatAlternatif: null,
                failedChecks: [],
              };
            }

            // Fallback bila status 'DITOLAK' namun detail penolakan belum spesifik
            return {
              stage: "Tahap Persetujuan Peminjaman",
              role: "Penyetuju Peralatan",
              nama:
                selectedLoan.approval_pengelola?.nama ||
                selectedLoan.approval_manager_lab?.nama ||
                selectedLoan.approval_manager_peminjam?.nama ||
                "Petugas Penyetuju",
              nip: "-",
              tanggal: selectedLoan.tanggal_pengajuan || "",
              catatan:
                selectedLoan.catatan_penolakan ||
                selectedLoan.catatan ||
                "Permohonan peminjaman tidak disetujui.",
              alatAlternatif: null,
              failedChecks: [],
            };
          })();

          return createPortal(
            <div
              className="modal-overlay verification-review-overlay"
              role="presentation"
              onClick={() => setSelectedLoan(null)}
            >
              <div
                className="modal modal-xl verification-review-modal"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="modal-header">
                  <div>
                    <h2 className="modal-title">
                      Lembar Persetujuan Peminjaman Peralatan
                    </h2>
                    <p
                      className="page-subtitle"
                      style={{ margin: "4px 0 0", fontSize: "var(--text-xs)" }}
                    >
                      Formulir Otorisasi & Riwayat Persetujuan Peminjaman
                    </p>
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {/* Tombol cetak surat peminjaman hanya setelah serah terima keluar selesai */}
                    {serahTerimaSelesai(selectedLoan) && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontWeight: 600,
                            color: "#1e40af",
                            borderColor: "#bfdbfe",
                            background: "#eff6ff",
                            padding: "5px 12px",
                            height: "32px",
                          }}
                          onClick={() => exportLoanF006Pdf(selectedLoan)}
                          title="Cetak Surat Peminjaman Peralatan (TLKM13/F/00X Versi 01)"
                        >
                          <Printer size={14} /> Cetak Surat (PDF)
                        </button>
                      )}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => printLoanActivityLog(selectedLoan)}
                    >
                      <Printer size={14} /> Cetak PDF Log
                    </button>
                    <button
                      type="button"
                      className="modal-close"
                      onClick={() => setSelectedLoan(null)}
                      aria-label="Tutup"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="modal-body" ref={modalContentRef}>
                  <section style={{ marginBottom: "var(--sp-4)" }}>
                    {isLogbookLoading ? (
                      <p style={{ margin: 0, color: "var(--clr-dark-500)", fontSize: "var(--text-sm)" }}>
                        Memuat log peminjaman...
                      </p>
                    ) : logbookError ? (
                      <p className="alert alert-error" role="alert">{logbookError}</p>
                    ) : (
                      (() => {
                        const ticketLogs = logbookData
                          .filter((log) =>
                            String(log.referensi_id ?? "") === String(selectedLoan.id)
                          )
                          .sort((first, second) =>
                            new Date(second.created_at || 0) - new Date(first.created_at || 0)
                          );
                        const isExpanded = expandedLoanLogId === String(selectedLoan.id);
                        return (
                          <article className="equipment-verification-log-card">
                            <div className="equipment-verification-log-entry">
                              <span className="badge badge-primary">Tiket</span>
                              <div className="equipment-verification-log-entry__content">
                                <strong style={{ color: "var(--clr-dark-800)", fontSize: "var(--text-sm)" }}>
                                  Log Aktivitas Peminjaman
                                </strong>
                                <div style={{ marginTop: 4, color: "var(--clr-dark-600)", fontSize: "var(--text-sm)" }}>
                                  {ticketLogs.length} aksi tercatat untuk tiket {selectedLoan.kode || selectedLoan.id}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setExpandedLoanLogId(isExpanded ? null : String(selectedLoan.id))}
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? "Tutup Log" : `Log (${ticketLogs.length})`}
                              </button>
                            </div>
                            {isExpanded && (
                              <div>
                                {ticketLogs.length === 0 ? (
                                  <p className="empty-state-desc" style={{ margin: "0 16px 16px" }}>
                                    Belum ada aksi peminjaman yang tercatat untuk tiket ini.
                                  </p>
                                ) : ticketLogs.map((log, index) => {
                                  const status = log.status || "—";
                                  const statusClass =
                                    status === "DITOLAK" || status === "KADALUARSA"
                                      ? "badge-rusak"
                                      : ["DISETUJUI", "DIKEMBALIKAN", "SEDANG_DIPINJAM"].includes(status)
                                        ? "badge-aktif"
                                        : "badge-kalibrasi";
                                  return (
                                    <div
                                      className="equipment-verification-log-entry"
                                      key={log.id}
                                      style={{ borderTop: "1px solid var(--clr-dark-100)" }}
                                    >
                                      <span className={`badge ${statusClass}`}>{status}</span>
                                      <div className="equipment-verification-log-entry__content">
                                        <strong style={{ color: "var(--clr-dark-800)", fontSize: "var(--text-sm)" }}>
                                          {log.judul || String(log.aksi || "Aktivitas peminjaman").replaceAll("_", " ")}
                                        </strong>
                                        {log.keterangan && (
                                          <div style={{ marginTop: 4, color: "var(--clr-dark-600)", fontSize: "var(--text-sm)", whiteSpace: "pre-wrap" }}>
                                            {log.keterangan}
                                          </div>
                                        )}
                                        <div style={{ marginTop: 4, color: "var(--clr-dark-500)", fontSize: "var(--text-xs)" }}>
                                          {log.user?.name || (log.aksi === "kadaluarsa" ? "Sistem" : "Pelaku tidak tersedia")}
                                          {log.created_at && ` · ${new Date(log.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}`}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </article>
                        );
                      })()
                    )}
                  </section>

                  {/* Alasan pengajuan kadaluarsa */}
                  {selectedLoan.status === "KADALUARSA" && (
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1.5px solid #cbd5e1",
                        borderRadius: 8,
                        padding: "12px 14px",
                        marginBottom: "var(--sp-4)",
                        fontSize: "12px",
                        color: "#334155",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                      }}
                    >
                      <Clock size={18} style={{ color: "#64748b", flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <strong style={{ color: "#0f172a" }}>Pengajuan kadaluarsa.</strong>{" "}
                        {selectedLoan.alasan_pembatalan ||
                          `Belum sampai serah terima hingga rencana tanggal kembali ${selectedLoan.rencana_tanggal_kembali}.`}
                        <div style={{ marginTop: 4, color: "#64748b" }}>
                          Pengajuan ini tidak dapat diproses lagi. Bila peralatan masih dibutuhkan, ajukan peminjaman baru.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Banner Informasi / Aksi Perpanjangan Peminjaman */}
                  {selectedLoan.status === "SEDANG_DIPINJAM" &&
                    (() => {
                      const waitingPj = selectedLoan.perpanjangan?.find(
                        (p) => p.status === "menunggu",
                      );
                      const { isPeminjam, isPengelola, isManagerLab, isAdmin } =
                        getLoanUserRelationship(selectedLoan);

                      if (waitingPj) {
                        return (
                          <div
                            style={{
                              padding: "12px 16px",
                              background: "#fffbeb",
                              border: "1.5px solid #fef3c7",
                              borderRadius: "var(--radius-md, 8px)",
                              marginBottom: "var(--sp-4)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <Clock
                                size={24}
                                style={{ color: "#d97706", flexShrink: 0 }}
                              />
                              <div>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    color: "#92400e",
                                    fontSize: "13px",
                                  }}
                                >
                                  Permohonan Perpanjangan Waktu Sedang Diproses
                                </div>
                                <div
                                  style={{
                                    color: "#78350f",
                                    fontSize: "11px",
                                    marginTop: 2,
                                  }}
                                >
                                  Permintaan kembali hingga{" "}
                                  <strong>
                                    {waitingPj.tanggal_kembali_baru}
                                  </strong>{" "}
                                  diajukan pada{" "}
                                  {waitingPj.diajukan_pada
                                    ? String(waitingPj.diajukan_pada).slice(
                                      0,
                                      10,
                                    )
                                    : "-"}
                                  . Menunggu keputusan Pengelola Peralatan.
                                </div>
                              </div>
                            </div>
                            {isPengelola || isAdmin ? (
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() =>
                                  handleOpenExtensionReview(selectedLoan)
                                }
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  background: "#ea580c",
                                  borderColor: "#c2410c",
                                  color: "#ffffff",
                                  fontWeight: 600,
                                  fontSize: "12px",
                                  padding: "6px 14px",
                                }}
                              >
                                <ShieldCheck size={14} /> Review & Putuskan
                                Perpanjangan
                              </button>
                            ) : (
                              <span
                                className="badge badge-warning"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  fontSize: "11px",
                                  padding: "4px 10px",
                                  height: "28px",
                                }}
                              >
                                <Clock size={12} /> Menunggu Pengelola
                              </span>
                            )}
                          </div>
                        );
                      }

                      if (
                        selectedLoan.dapat_diperpanjang &&
                        (isPeminjam || isAdmin)
                      ) {
                        return (
                          <div
                            style={{
                              padding: "12px 16px",
                              background: "#fefce8",
                              border: "1.5px solid #fef08a",
                              borderRadius: "var(--radius-md, 8px)",
                              marginBottom: "var(--sp-4)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <CalendarClock
                                size={24}
                                style={{ color: "#ca8a04", flexShrink: 0 }}
                              />
                              <div>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    color: "#854d0e",
                                    fontSize: "13px",
                                  }}
                                >
                                  Peralatan Sedang Aktif Digunakan
                                </div>
                                <div
                                  style={{
                                    color: "#713f12",
                                    fontSize: "11px",
                                    marginTop: 2,
                                  }}
                                >
                                  Butuh waktu lebih lama untuk pengujian? Anda
                                  dapat mengajukan permohonan perpanjangan waktu
                                  pengembalian.
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() =>
                                handleOpenExtensionRequest(selectedLoan)
                              }
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                background: "#eab308",
                                borderColor: "#ca8a04",
                                color: "#ffffff",
                                fontWeight: 600,
                                fontSize: "12px",
                                padding: "6px 14px",
                              }}
                            >
                              <CalendarClock size={14} /> Ajukan Perpanjangan
                              Waktu
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
                      padding: "var(--sp-4)",
                      marginBottom: "var(--sp-5)",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        marginBottom: 12,
                        color: "#0f172a",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Package
                        size={16}
                        style={{ color: "var(--clr-primary-500)" }}
                      />
                      Informasi Peralatan & Rencana Peminjaman
                    </h3>
                    <div
                      className="form-grid-2"
                      style={{ fontSize: "13px", rowGap: 8 }}
                    >
                      <div>
                        <span
                          style={{
                            color: "#64748b",
                            fontSize: "11px",
                            display: "block",
                          }}
                        >
                          Nama Peralatan:
                        </span>
                        <strong>{selectedLoan.peralatan.nama_peralatan}</strong>
                      </div>
                      <div>
                        <span
                          style={{
                            color: "#64748b",
                            fontSize: "11px",
                            display: "block",
                          }}
                        >
                          Nomor Aset / Seri:
                        </span>
                        <strong>{selectedLoan.peralatan.nomor_aset}</strong> (
                        {selectedLoan.peralatan.nomor_seri})
                      </div>
                      <div>
                        <span
                          style={{
                            color: "#64748b",
                            fontSize: "11px",
                            display: "block",
                          }}
                        >
                          Pemilik Peralatan:
                        </span>
                        {selectedLoan.peralatan.lab_pemilik}
                      </div>
                      <div>
                        <span
                          style={{
                            color: "#64748b",
                            fontSize: "11px",
                            display: "block",
                          }}
                        >
                          Peminjam & Unit Asal:
                        </span>
                        <strong>{selectedLoan.peminjam.nama}</strong> (
                        {selectedLoan.peminjam.lab_asal})
                      </div>
                      <div>
                        <span
                          style={{
                            color: "#64748b",
                            fontSize: "11px",
                            display: "block",
                          }}
                        >
                          Tujuan Penggunaan:
                        </span>
                        <strong>{selectedLoan.tujuan_penggunaan || "-"}</strong>
                      </div>
                      <div>
                        <span
                          style={{
                            color: "#64748b",
                            fontSize: "11px",
                            display: "block",
                          }}
                        >
                          Dasar Pelaksanaan:
                        </span>
                        <strong>{selectedLoan.nomor_spk || "-"}</strong>
                      </div>
                      <div>
                        <span
                          style={{
                            color: "#64748b",
                            fontSize: "11px",
                            display: "block",
                          }}
                        >
                          Lokasi Penggunaan:
                        </span>
                        {selectedLoan.lokasi_penggunaan}
                      </div>
                      <div>
                        <span
                          style={{
                            color: "#64748b",
                            fontSize: "11px",
                            display: "block",
                          }}
                        >
                          Lingkup Peminjaman:
                        </span>
                        <span
                          className={`badge ${selectedLoan.is_eksternal ? "badge-error" : "badge-gray"}`}
                          style={{ fontSize: "11px" }}
                        >
                          {selectedLoan.is_eksternal ? "Eksternal" : "Internal"}
                        </span>
                      </div>
                      <div>
                        <span
                          style={{
                            color: "#64748b",
                            fontSize: "11px",
                            display: "block",
                          }}
                        >
                          Rencana Tanggal Peminjaman dan Pengembalian:
                        </span>
                        <strong>{selectedLoan.rencana_tanggal_keluar}</strong>{" "}
                        s.d{" "}
                        <strong>{selectedLoan.rencana_tanggal_kembali}</strong>
                        {hariTerlambat(selectedLoan) > 0 && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "#b91c1c",
                              background: "#fee2e2",
                              padding: "1px 6px",
                              borderRadius: 4,
                            }}
                          >
                            Terlambat {hariTerlambat(selectedLoan)} hari
                          </span>
                        )}
                      </div>
                      <div>
                        <span
                          style={{
                            color: "#64748b",
                            fontSize: "11px",
                            display: "block",
                          }}
                        >
                          Jatuh Tempo Kalibrasi:
                        </span>
                        <strong>
                          {selectedLoan.peralatan?.tgl_jatuh_tempo || "-"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* 2. HASIL VERIFIKASI KELAYAKAN & KETERSEDIAAN ALAT (HANYA UNTUK PENGELOLA & MANAGER LAB) */}
                  {(!isReviewAction || activeReviewStage !== "pengelola") &&
                    (() => {
                      const { isPengelola, isManagerLab, isAdmin } =
                        getLoanUserRelationship(selectedLoan);
                      const isStaffPengelola =
                        currentUserRole === "staff" &&
                        (currentUser?.pengelola === true ||
                          currentUser?.pengelola === 1 ||
                          currentUser?.pengelola === "1");
                      const isLabMatching =
                        currentUserLabId > 0 &&
                        Number(selectedLoan.lab_pemilik_id) ===
                        currentUserLabId;

                      const canViewVerifikasi =
                        isAdmin ||
                        isPengelola ||
                        (isStaffPengelola && isLabMatching) ||
                        isManagerLab ||
                        (currentUserRole === "manager" && isLabMatching);
                      if (!canViewVerifikasi) return null;

                      const isCurrentlyReviewingByPengelola =
                        modalMode === "review" &&
                        activeReviewStage === "pengelola";
                      const pengelolaStatus =
                        selectedLoan.approval_pengelola?.status;

                      // Status butir 1: Status & Jadwal Kalibrasi
                      const item1Checked = isCurrentlyReviewingByPengelola
                        ? techCheckSchedule
                        : pengelolaStatus === "approved"
                          ? true
                          : pengelolaStatus === "rejected"
                            ? (selectedLoan.approval_pengelola
                              ?.cek_jadwal_kalibrasi ?? false)
                            : null;

                      // Status butir 2: Kesesuaian Spesifikasi
                      const item2Checked = isCurrentlyReviewingByPengelola
                        ? techCheckSpec
                        : pengelolaStatus === "approved"
                          ? true
                          : pengelolaStatus === "rejected"
                            ? (selectedLoan.approval_pengelola
                              ?.cek_spesifikasi ?? false)
                            : null;

                      // Status butir 3: Kewenangan Operator
                      const item3Checked = isCurrentlyReviewingByPengelola
                        ? techCheckOperator
                        : pengelolaStatus === "approved"
                          ? true
                          : pengelolaStatus === "rejected"
                            ? (selectedLoan.approval_pengelola?.cek_operator ??
                              false)
                            : null;

                      // Status butir 4: Kesiapan Lokasi Eksternal
                      const item4Checked = isCurrentlyReviewingByPengelola
                        ? techCheckLocation
                        : pengelolaStatus === "approved"
                          ? true
                          : pengelolaStatus === "rejected"
                            ? (selectedLoan.approval_pengelola?.cek_lokasi ??
                              false)
                            : null;

                      const isAllPassed =
                        item1Checked &&
                        item2Checked &&
                        item3Checked &&
                        (!selectedLoan.is_eksternal || item4Checked);
                      const hasFailedItem =
                        item1Checked === false ||
                        item2Checked === false ||
                        item3Checked === false ||
                        (selectedLoan.is_eksternal && item4Checked === false);

                      return (
                        <div
                          className="card"
                          style={{
                            padding: "var(--sp-4)",
                            background: "#ffffff",
                            border: hasFailedItem
                              ? "1.5px solid #fecaca"
                              : isAllPassed
                                ? "1.5px solid #bbf7d0"
                                : "1px solid #cbd5e1",
                            borderRadius: "var(--radius-md, 8px)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 8,
                              flexWrap: "wrap",
                              gap: 6,
                            }}
                          >
                            <div>
                              <h3
                                style={{
                                  fontSize: "13px",
                                  fontWeight: "bold",
                                  margin: 0,
                                  color: "#0f172a",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <ShieldCheck
                                  size={16}
                                  style={{
                                    color: hasFailedItem
                                      ? "#dc2626"
                                      : isAllPassed
                                        ? "#16a34a"
                                        : "#2563eb",
                                  }}
                                />
                                Verifikasi Kelayakan & Ketersediaan Peralatan
                                (Pengelola)
                              </h3>
                              <div
                                style={{
                                  fontSize: "10.5px",
                                  color: "#64748b",
                                  marginTop: 1,
                                }}
                              >
                                Jika ada 1 butir tidak terpenuhi / tidak
                                diceklis, status otomatis{" "}
                                <strong>Ditolak</strong>.
                              </div>
                            </div>
                            <span
                              className={`badge ${hasFailedItem || pengelolaStatus === "rejected"
                                  ? "badge-error"
                                  : isAllPassed ||
                                    pengelolaStatus === "approved"
                                    ? "badge-success"
                                    : "badge-gray"
                                }`}
                              style={{ fontSize: "10.5px" }}
                            >
                              {isCurrentlyReviewingByPengelola
                                ? hasFailedItem
                                  ? "✕ Ditolak Otomatis (Ada Butir Tidak Diceklis)"
                                  : "✓ Semua Butir Diceklis (Lolos Verifikasi)"
                                : pengelolaStatus === "approved"
                                  ? "✓ Lolos Verifikasi Kelayakan"
                                  : pengelolaStatus === "rejected"
                                    ? "✕ Ditolak Pengelola (Tidak Memenuhi Syarat)"
                                    : "Menunggu Pemeriksaan Pengelola"}
                            </span>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fit, minmax(200px, 1fr))",
                              gap: 6,
                              fontSize: "11.5px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 6,
                                padding: "6px 8px",
                                background:
                                  item1Checked === true
                                    ? "#f0fdf4"
                                    : item1Checked === false
                                      ? "#fef2f2"
                                      : "#f8fafc",
                                borderRadius: 6,
                                border: `1px solid ${item1Checked === true ? "#bbf7d0" : item1Checked === false ? "#fecaca" : "#e2e8f0"}`,
                              }}
                            >
                              {item1Checked === true ? (
                                <CheckCircle2
                                  size={14}
                                  style={{
                                    color: "#16a34a",
                                    flexShrink: 0,
                                    marginTop: 1,
                                  }}
                                />
                              ) : item1Checked === false ? (
                                <XCircle
                                  size={14}
                                  style={{
                                    color: "#dc2626",
                                    flexShrink: 0,
                                    marginTop: 1,
                                  }}
                                />
                              ) : (
                                <Clock
                                  size={14}
                                  style={{
                                    color: "#64748b",
                                    flexShrink: 0,
                                    marginTop: 1,
                                  }}
                                />
                              )}
                              <div>
                                <strong>1. Status & Jadwal Kalibrasi</strong>
                                <div
                                  style={{
                                    fontSize: "10.5px",
                                    color: "#64748b",
                                  }}
                                >
                                  Jatuh tempo:{" "}
                                  {selectedLoan.peralatan?.tgl_jatuh_tempo ||
                                    "-"}{" "}
                                  (Alat layak pakai)
                                </div>
                                <div
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: 600,
                                    marginTop: 2,
                                    color:
                                      item1Checked === true
                                        ? "#16a34a"
                                        : item1Checked === false
                                          ? "#dc2626"
                                          : "#64748b",
                                  }}
                                >
                                  {item1Checked === true
                                    ? "✓ Diceklis (Memenuhi Syarat)"
                                    : item1Checked === false
                                      ? "✕ Tidak Diceklis (Gagal)"
                                      : "Belum Diperiksa"}
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 6,
                                padding: "6px 8px",
                                background:
                                  item2Checked === true
                                    ? "#f0fdf4"
                                    : item2Checked === false
                                      ? "#fef2f2"
                                      : "#f8fafc",
                                borderRadius: 6,
                                border: `1px solid ${item2Checked === true ? "#bbf7d0" : item2Checked === false ? "#fecaca" : "#e2e8f0"}`,
                              }}
                            >
                              {item2Checked === true ? (
                                <CheckCircle2
                                  size={14}
                                  style={{
                                    color: "#16a34a",
                                    flexShrink: 0,
                                    marginTop: 1,
                                  }}
                                />
                              ) : item2Checked === false ? (
                                <XCircle
                                  size={14}
                                  style={{
                                    color: "#dc2626",
                                    flexShrink: 0,
                                    marginTop: 1,
                                  }}
                                />
                              ) : (
                                <Clock
                                  size={14}
                                  style={{
                                    color: "#64748b",
                                    flexShrink: 0,
                                    marginTop: 1,
                                  }}
                                />
                              )}
                              <div>
                                <strong>2. Kesesuaian Spesifikasi</strong>
                                <div
                                  style={{
                                    fontSize: "10.5px",
                                    color: "#64748b",
                                  }}
                                >
                                  Rentang & toleransi alat sesuai pengujian
                                </div>
                                <div
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: 600,
                                    marginTop: 2,
                                    color:
                                      item2Checked === true
                                        ? "#16a34a"
                                        : item2Checked === false
                                          ? "#dc2626"
                                          : "#64748b",
                                  }}
                                >
                                  {item2Checked === true
                                    ? "✓ Diceklis (Memenuhi Syarat)"
                                    : item2Checked === false
                                      ? "✕ Tidak Diceklis (Gagal)"
                                      : "Belum Diperiksa"}
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 6,
                                padding: "6px 8px",
                                background:
                                  item3Checked === true
                                    ? "#f0fdf4"
                                    : item3Checked === false
                                      ? "#fef2f2"
                                      : "#f8fafc",
                                borderRadius: 6,
                                border: `1px solid ${item3Checked === true ? "#bbf7d0" : item3Checked === false ? "#fecaca" : "#e2e8f0"}`,
                              }}
                            >
                              {item3Checked === true ? (
                                <CheckCircle2
                                  size={14}
                                  style={{
                                    color: "#16a34a",
                                    flexShrink: 0,
                                    marginTop: 1,
                                  }}
                                />
                              ) : item3Checked === false ? (
                                <XCircle
                                  size={14}
                                  style={{
                                    color: "#dc2626",
                                    flexShrink: 0,
                                    marginTop: 1,
                                  }}
                                />
                              ) : (
                                <Clock
                                  size={14}
                                  style={{
                                    color: "#64748b",
                                    flexShrink: 0,
                                    marginTop: 1,
                                  }}
                                />
                              )}
                              <div>
                                <strong>3. Kewenangan Operator</strong>
                                <div
                                  style={{
                                    fontSize: "10.5px",
                                    color: "#64748b",
                                  }}
                                >
                                  Operator:{" "}
                                  {selectedLoan.peminjam?.operator ||
                                    selectedLoan.peminjam?.nama ||
                                    "-"}
                                </div>
                                <div
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: 600,
                                    marginTop: 2,
                                    color:
                                      item3Checked === true
                                        ? "#16a34a"
                                        : item3Checked === false
                                          ? "#dc2626"
                                          : "#64748b",
                                  }}
                                >
                                  {item3Checked === true
                                    ? "✓ Diceklis (Memenuhi Syarat)"
                                    : item3Checked === false
                                      ? "✕ Tidak Diceklis (Gagal)"
                                      : "Belum Diperiksa"}
                                </div>
                              </div>
                            </div>

                            {selectedLoan.is_eksternal && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: 6,
                                  padding: "6px 8px",
                                  background:
                                    item4Checked === true
                                      ? "#f0fdf4"
                                      : item4Checked === false
                                        ? "#fef2f2"
                                        : "#f8fafc",
                                  borderRadius: 6,
                                  border: `1px solid ${item4Checked === true ? "#bbf7d0" : item4Checked === false ? "#fecaca" : "#e2e8f0"}`,
                                }}
                              >
                                {item4Checked === true ? (
                                  <CheckCircle2
                                    size={14}
                                    style={{
                                      color: "#16a34a",
                                      flexShrink: 0,
                                      marginTop: 1,
                                    }}
                                  />
                                ) : item4Checked === false ? (
                                  <XCircle
                                    size={14}
                                    style={{
                                      color: "#dc2626",
                                      flexShrink: 0,
                                      marginTop: 1,
                                    }}
                                  />
                                ) : (
                                  <Clock
                                    size={14}
                                    style={{
                                      color: "#64748b",
                                      flexShrink: 0,
                                      marginTop: 1,
                                    }}
                                  />
                                )}
                                <div>
                                  <strong>4. Kesiapan Lokasi Eksternal</strong>
                                  <div
                                    style={{
                                      fontSize: "10.5px",
                                      color: "#64748b",
                                    }}
                                  >
                                    Lokasi: {selectedLoan.lokasi_penggunaan}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "10px",
                                      fontWeight: 600,
                                      marginTop: 2,
                                      color:
                                        item4Checked === true
                                          ? "#16a34a"
                                          : item4Checked === false
                                            ? "#dc2626"
                                            : "#64748b",
                                    }}
                                  >
                                    {item4Checked === true
                                      ? "✓ Diceklis (Memenuhi Syarat)"
                                      : item4Checked === false
                                        ? "✕ Tidak Diceklis (Gagal)"
                                        : "Belum Diperiksa"}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Catatan hasil verifikasi jika ada penolakan */}
                          {(hasFailedItem ||
                            pengelolaStatus === "rejected") && (
                              <div
                                style={{
                                  marginTop: 8,
                                  padding: "6px 10px",
                                  background: "#fef2f2",
                                  border: "1px solid #fecaca",
                                  borderRadius: 6,
                                  fontSize: "11px",
                                  color: "#991b1b",
                                }}
                              >
                                <strong>Catatan Pengelola:</strong>{" "}
                                {isCurrentlyReviewingByPengelola
                                  ? decisionNote ||
                                  "Terdapat butir verifikasi yang tidak diceklis, keputusan otomatis Ditolak."
                                  : selectedLoan.approval_pengelola?.catatan ||
                                  "Permohonan ditolak pada verifikasi kelayakan & ketersediaan oleh pengelola."}
                              </div>
                            )}
                        </div>
                      );
                    })()}

                  {/* JIKA STATUS SUDAH DISAHKAN MANAGER LAB & SIAP SERAH TERIMA */}
                  {(selectedLoan.status === "MENUNGGU_SERAH_TERIMA" ||
                    selectedLoan.status === "DISETUJUI") && (
                      <div
                        className="alert alert-warning"
                        style={{
                          padding: "var(--sp-4)",
                          marginBottom: "var(--sp-5)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 12,
                          background: "#fff7ed",
                          border: "1.5px solid #fed7aa",
                          borderRadius: "var(--radius-md, 8px)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <Package
                            size={24}
                            style={{ color: "#ea580c", flexShrink: 0 }}
                          />
                          <div>
                            <div
                              style={{
                                fontWeight: "bold",
                                color: "#9a3412",
                                fontSize: "13px",
                              }}
                            >
                              Persetujuan Manager Lab Telah Terbit!
                            </div>
                            <div style={{ fontSize: "12px", color: "#c2410c" }}>
                              {getPendingActionForUser(selectedLoan)?.canHandover
                                ? "Alur kini diarahkan kepada Anda untuk melakukan pemeriksaan fisik bersama dan pengisian Pemeriksaan Kondisi."
                                : "Persetujuan izin telah disahkan. Menunggu Pengelola Peralatan dan Peminjam melaksanakan serah terima fisik (Pemeriksaan Kondisi)."}
                            </div>
                          </div>
                        </div>
                        {getPendingActionForUser(selectedLoan)?.canHandover && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenCheckout(selectedLoan)}
                            style={{
                              fontWeight: 600,
                              fontSize: "12px",
                              padding: "6px 14px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Package size={14} /> Mulai Serah Terima Fisik
                            (Pemeriksaan Kondisi)
                          </button>
                        )}
                      </div>
                    )}

                  {/* JIKA STATUS SUDAH DIPERIKSA PENGELOLA & MENUNGGU KONFIRMASI PEMINJAM */}
                  {selectedLoan.status === "SIAP_DISERAHKAN" && (
                    <div
                      className="alert alert-info"
                      style={{
                        padding: "var(--sp-4)",
                        marginBottom: "var(--sp-5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 12,
                        background: "#f0f9ff",
                        border: "1.5px solid #bae6fd",
                        borderRadius: "var(--radius-md, 8px)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <CheckCircle2
                          size={24}
                          style={{ color: "#0284c7", flexShrink: 0 }}
                        />
                        <div>
                          <div
                            style={{
                              fontWeight: "bold",
                              color: "#0369a1",
                              fontSize: "13px",
                            }}
                          >
                            Checklist Pemeriksaan Kondisi Telah Diisi Pengelola!
                          </div>
                          <div style={{ fontSize: "12px", color: "#0284c7" }}>
                            {getPendingActionForUser(selectedLoan)?.canHandover
                              ? "Pengelola telah memeriksa dan menandatangani checklist Pemeriksaan Kondisi. Silakan konfirmasi penerimaan dan bubuhkan tanda tangan Anda."
                              : "Pemeriksaan fisik telah selesai dilakukan oleh Pengelola. Menunggu Peminjam melakukan konfirmasi dan tanda tangan digital."}
                          </div>
                        </div>
                      </div>
                      {getPendingActionForUser(selectedLoan)?.canHandover && (
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => handleOpenCheckout(selectedLoan)}
                          style={{
                            background: "#16a34a",
                            borderColor: "#15803d",
                            color: "#ffffff",
                            fontWeight: 600,
                            fontSize: "12px",
                            padding: "6px 14px",
                            display: "inline-flex",
                            alignItems: "center",
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
                        padding: "var(--sp-4)",
                        marginBottom: "var(--sp-5)",
                        background: selectedLoan.serah_terima_keluar.ada_ts
                          ? "#fef2f2"
                          : "#f0fdf4",
                        border: selectedLoan.serah_terima_keluar.ada_ts
                          ? "1.5px solid #fecaca"
                          : "1.5px solid #bbf7d0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 8,
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "13px",
                            fontWeight: "bold",
                            color: selectedLoan.serah_terima_keluar.ada_ts
                              ? "#991b1b"
                              : "#166534",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <ClipboardCheck size={16} />
                          Rekaman Serah Terima Fisik Keluar (Kolom Keluar)
                        </h4>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          Pemeriksaan:{" "}
                          {selectedLoan.serah_terima_keluar.tanggal
                            ? String(
                              selectedLoan.serah_terima_keluar.tanggal,
                            ).slice(0, 10)
                            : "-"}
                          {selectedLoan.serah_terima_keluar
                            .tanggal_diterima && (
                              <>
                                {" "}
                                | Diterima:{" "}
                                {String(
                                  selectedLoan.serah_terima_keluar
                                    .tanggal_diterima,
                                ).slice(0, 10)}
                              </>
                            )}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: 8,
                          fontSize: "12px",
                          marginBottom: 8,
                        }}
                      >
                        <div>
                          <span style={{ color: "#64748b", fontSize: "11px" }}>
                            PIC Pengelola (Pemeriksa):{" "}
                          </span>
                          <strong>
                            {selectedLoan.serah_terima_keluar.pic_petugas ||
                              selectedLoan.approval_pengelola?.nama ||
                              "-"}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", fontSize: "11px" }}>
                            Peminjam (Penerima):{" "}
                          </span>
                          <strong>
                            {selectedLoan.serah_terima_keluar
                              .peminjam_penerima ||
                              selectedLoan.peminjam?.nama ||
                              "-"}
                          </strong>
                        </div>
                      </div>

                      <p
                        style={{
                          margin: 0,
                          fontSize: "12px",
                          color: "#334155",
                        }}
                      >
                        <strong>Hasil:</strong>{" "}
                        {selectedLoan.serah_terima_keluar.ada_ts ? (
                          <span style={{ color: "#dc2626", fontWeight: 600 }}>
                            Dibatalkan karena terdapat butir Tidak Sesuai (TS).
                            Status alat dialihkan menjadi DO NOT USE.
                          </span>
                        ) : (
                          <span style={{ color: "#16a34a", fontWeight: 600 }}>
                            Memenuhi Syarat (Seluruh butir Sesuai). Peralatan
                            diserahterimakan kepada peminjam.
                          </span>
                        )}
                      </p>

                      {selectedLoan.serah_terima_keluar.catatan && (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: "12px",
                            color: "#475569",
                          }}
                        >
                          <strong>Catatan:</strong> "
                          {selectedLoan.serah_terima_keluar.catatan}"
                        </div>
                      )}

                      {/* Tanda Tangan Pengelola & Peminjam */}
                      {(selectedLoan.serah_terima_keluar.ttd_pengelola ||
                        selectedLoan.serah_terima_keluar.ttd_peminjam) && (
                          <div
                            style={{
                              display: "flex",
                              gap: 16,
                              marginTop: 12,
                              paddingTop: 10,
                              borderTop: "1px solid rgba(0,0,0,0.06)",
                              flexWrap: "wrap",
                            }}
                          >
                            {selectedLoan.serah_terima_keluar.ttd_pengelola && (
                              <div
                                style={{
                                  textAlign: "center",
                                  background: "#ffffff",
                                  padding: 8,
                                  borderRadius: 6,
                                  border: "1px dashed #cbd5e1",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "10px",
                                    color: "#64748b",
                                    fontWeight: 600,
                                    marginBottom: 4,
                                  }}
                                >
                                  TTD Pengelola (Keluar)
                                </div>
                                <img
                                  src={
                                    selectedLoan.serah_terima_keluar.ttd_pengelola
                                  }
                                  alt="TTD Pengelola"
                                  style={{
                                    maxHeight: 45,
                                    maxWidth: 120,
                                    objectFit: "contain",
                                  }}
                                />
                              </div>
                            )}
                            {selectedLoan.serah_terima_keluar.ttd_peminjam && (
                              <div
                                style={{
                                  textAlign: "center",
                                  background: "#ffffff",
                                  padding: 8,
                                  borderRadius: 6,
                                  border: "1px dashed #cbd5e1",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "10px",
                                    color: "#64748b",
                                    fontWeight: 600,
                                    marginBottom: 4,
                                  }}
                                >
                                  TTD Peminjam (Keluar)
                                </div>
                                <img
                                  src={
                                    selectedLoan.serah_terima_keluar.ttd_peminjam
                                  }
                                  alt="TTD Peminjam"
                                  style={{
                                    maxHeight: 45,
                                    maxWidth: 120,
                                    objectFit: "contain",
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )}

                  {/* JIKA STATUS SEDANG DIPINJAM -> TOMBOL AKSI PENGEMBALIAN */}
                  {selectedLoan.status === "SEDANG_DIPINJAM" &&
                    (() => {
                      const modalRel = getLoanUserRelationship(selectedLoan);
                      if (!modalRel.isPengelola && !modalRel.isAdmin)
                        return null;

                      return (
                        <div
                          style={{
                            padding: "var(--sp-4)",
                            marginBottom: "var(--sp-5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: 12,
                            background: "#f0fdf4",
                            border: "1.5px solid #bbf7d0",
                            borderRadius: "var(--radius-md, 8px)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <ClipboardCheck
                              size={24}
                              style={{ color: "#16a34a", flexShrink: 0 }}
                            />
                            <div>
                              <div
                                style={{
                                  fontWeight: "bold",
                                  color: "#166534",
                                  fontSize: "13px",
                                }}
                              >
                                Pemeriksaan Serah Terima Kembali
                              </div>
                              <div
                                style={{ fontSize: "12px", color: "#15803d" }}
                              >
                                Peralatan diserahkan kembali oleh peminjam.
                                Lakukan pemeriksaan 5 butir fisik & fungsi
                                bersama peminjam dan bubuhkan tanda tangan
                                bersama.
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenReturn(selectedLoan)}
                            style={{
                              background: "#16a34a",
                              borderColor: "#15803d",
                              color: "#ffffff",
                              fontWeight: 600,
                              fontSize: "12px",
                              padding: "6px 14px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <ClipboardCheck size={14} /> Buka Lembar Serah
                            Terima Kembali
                          </button>
                        </div>
                      );
                    })()}

                  {/* JIKA ADA REKAMAN PENGEMBALIAN */}
                  {selectedLoan.serah_terima_kembali && (
                    <div
                      className="card"
                      style={{
                        padding: "var(--sp-4)",
                        marginBottom: "var(--sp-5)",
                        background:
                          selectedLoan.serah_terima_kembali.tindak_lanjut ===
                            "SIAP_DIPINJAM"
                            ? "#f0fdf4"
                            : selectedLoan.serah_terima_kembali
                              .tindak_lanjut === "DO_NOT_USE" ||
                              selectedLoan.serah_terima_kembali.ada_ts ||
                              selectedLoan.serah_terima_kembali.ada_kejadian
                              ? "#fef2f2"
                              : "#f0fdf4",
                        border:
                          selectedLoan.serah_terima_kembali.tindak_lanjut ===
                            "SIAP_DIPINJAM"
                            ? "1.5px solid #bbf7d0"
                            : selectedLoan.serah_terima_kembali
                              .tindak_lanjut === "DO_NOT_USE" ||
                              selectedLoan.serah_terima_kembali.ada_ts ||
                              selectedLoan.serah_terima_kembali.ada_kejadian
                              ? "1.5px solid #fecaca"
                              : "1.5px solid #bbf7d0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 8,
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: "13px",
                            fontWeight: "bold",
                            color:
                              selectedLoan.serah_terima_kembali
                                .tindak_lanjut === "SIAP_DIPINJAM"
                                ? "#166534"
                                : selectedLoan.serah_terima_kembali
                                  .tindak_lanjut === "DO_NOT_USE"
                                  ? "#991b1b"
                                  : "#92400e",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <ClipboardCheck size={16} />
                          Rekaman Pengembalian Peralatan (Kolom Kembali & Kejadian)
                        </h4>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          Tanggal Kembali:{" "}
                          {selectedLoan.serah_terima_kembali.tanggal
                            ? String(
                              selectedLoan.serah_terima_kembali.tanggal,
                            ).slice(0, 10)
                            : "-"}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: 8,
                          fontSize: "12px",
                          marginBottom: 10,
                        }}
                      >
                        <div>
                          <span style={{ color: "#64748b", fontSize: "11px" }}>
                            PIC Pengelola (Penerima):{" "}
                          </span>
                          <strong>
                            {selectedLoan.serah_terima_kembali.pic_penerima ||
                              selectedLoan.approval_pengelola?.nama ||
                              "-"}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", fontSize: "11px" }}>
                            Peminjam (Penyerah):{" "}
                          </span>
                          <strong>
                            {selectedLoan.serah_terima_kembali
                              .peminjam_penyerah ||
                              selectedLoan.peminjam?.nama ||
                              "-"}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: "#64748b", fontSize: "11px" }}>
                            Tindak Lanjut Sistem:{" "}
                          </span>
                          <span
                            className={`badge ${selectedLoan.serah_terima_kembali
                                .tindak_lanjut === "SIAP_DIPINJAM"
                                ? "badge-success"
                                : selectedLoan.serah_terima_kembali
                                  .tindak_lanjut === "DO_NOT_USE"
                                  ? "badge-error"
                                  : "badge-warning"
                              }`}
                            style={{ fontSize: "11px", fontWeight: 700 }}
                          >
                            {selectedLoan.serah_terima_kembali.tindak_lanjut ===
                              "SIAP_DIPINJAM"
                              ? "AKTIF (Siap Dipinjam)"
                              : selectedLoan.serah_terima_kembali
                                .tindak_lanjut === "DO_NOT_USE"
                                ? "DO NOT USE (Isolasi Alat)"
                                : "KARANTINA (Verifikasi IK/003)"}
                          </span>
                        </div>
                      </div>

                      {/* Bagian B: Tabel Perbandingan Keluar vs Kembali */}
                      {Array.isArray(
                        selectedLoan.serah_terima_kembali.lampiran_a,
                      ) &&
                        selectedLoan.serah_terima_kembali.lampiran_a.length >
                        0 && (
                          <div
                            style={{
                              overflowX: "auto",
                              border: "1px solid #cbd5e1",
                              borderRadius: 6,
                              marginBottom: 10,
                              background: "#ffffff",
                            }}
                          >
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: "11.5px",
                              }}
                            >
                              <thead>
                                <tr
                                  style={{
                                    background: "#f1f5f9",
                                    borderBottom: "1px solid #cbd5e1",
                                  }}
                                >
                                  <th
                                    style={{
                                      padding: "6px 8px",
                                      width: 28,
                                      textAlign: "center",
                                      borderRight: "1px solid #cbd5e1",
                                    }}
                                  >
                                    No.
                                  </th>
                                  <th
                                    style={{
                                      padding: "6px 8px",
                                      borderRight: "1px solid #cbd5e1",
                                    }}
                                  >
                                    Butir Pemeriksaan
                                  </th>
                                  <th
                                    style={{
                                      padding: "6px 8px",
                                      width: 90,
                                      textAlign: "center",
                                      borderRight: "1px solid #cbd5e1",
                                    }}
                                  >
                                    Kondisi Keluar
                                  </th>
                                  <th
                                    style={{
                                      padding: "6px 8px",
                                      width: 95,
                                      textAlign: "center",
                                      borderRight: "1px solid #cbd5e1",
                                    }}
                                  >
                                    Kondisi Kembali
                                  </th>
                                  <th style={{ padding: "6px 8px" }}>
                                    Keterangan Pengembalian
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedLoan.serah_terima_kembali.lampiran_a
                                  .slice(0, LAMPIRAN_A_BUTIR.length)
                                  .map((it, idx) => (
                                    <tr
                                      key={idx}
                                      style={{
                                        borderBottom: "1px solid #f1f5f9",
                                      }}
                                    >
                                      <td
                                        style={{
                                          padding: "5px 8px",
                                          textAlign: "center",
                                          borderRight: "1px solid #cbd5e1",
                                          color: "#64748b",
                                        }}
                                      >
                                        {idx + 1}.
                                      </td>
                                      <td
                                        style={{
                                          padding: "5px 8px",
                                          borderRight: "1px solid #cbd5e1",
                                        }}
                                      >
                                        {LAMPIRAN_A_BUTIR[idx]}
                                      </td>
                                      <td
                                        style={{
                                          padding: "5px 8px",
                                          textAlign: "center",
                                          borderRight: "1px solid #cbd5e1",
                                        }}
                                      >
                                        <span
                                          style={{
                                            fontWeight: 600,
                                            color:
                                              it.status_keluar === "TS"
                                                ? "#dc2626"
                                                : it.status_keluar === "S"
                                                  ? "#15803d"
                                                  : "#64748b",
                                          }}
                                        >
                                          {it.status_keluar === "S" ||
                                          it.status_keluar === "TS"
                                            ? it.status_keluar
                                            : "-"}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          padding: "5px 8px",
                                          textAlign: "center",
                                          borderRight: "1px solid #cbd5e1",
                                        }}
                                      >
                                        <span
                                          style={{
                                            fontWeight: 700,
                                            color:
                                              it.status === "TS"
                                                ? "#dc2626"
                                                : it.status === "S"
                                                  ? "#15803d"
                                                  : "#64748b",
                                          }}
                                        >
                                          {it.status === "S" ||
                                          it.status === "TS"
                                            ? it.status
                                            : "-"}
                                        </span>
                                      </td>
                                      <td
                                        style={{
                                          padding: "5px 8px",
                                          color: "#475569",
                                        }}
                                      >
                                        {it.keterangan || "-"}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                      {/* Bagian D: Rekaman Kejadian */}
                      <div
                        style={{
                          padding: "8px 12px",
                          background: "#ffffff",
                          borderRadius: 6,
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>
                          Kejadian Selama Peminjaman:
                        </div>
                        <div
                          style={{
                            marginTop: 2,
                            color: selectedLoan.serah_terima_kembali
                              .ada_kejadian
                              ? "#dc2626"
                              : "#15803d",
                          }}
                        >
                          {selectedLoan.serah_terima_kembali.ada_kejadian ? (
                            <>
                              {(() => {
                                const kejadian = bacaKejadian(
                                  selectedLoan.serah_terima_kembali,
                                );
                                return (
                                  <>
                                    <strong>Ada Kejadian Abnormal:</strong> "
                                    {kejadian.uraian}"
                                    {kejadian.tanggal && (
                                      <div
                                        style={{
                                          marginTop: 2,
                                          fontSize: "11px",
                                          color: "#475569",
                                        }}
                                      >
                                        <strong>Tanggal:</strong>{" "}
                                        {formatTanggalKejadian(
                                          kejadian.tanggal,
                                        )}{" "}
                                        &nbsp;|&nbsp; <strong>Lokasi:</strong>{" "}
                                        {kejadian.lokasi}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          ) : (
                            <span>
                              Tidak ada kejadian abnormal selama peminjaman.
                            </span>
                          )}
                        </div>
                        {selectedLoan.serah_terima_kembali
                          .alasan_tindak_lanjut && (
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: "11px",
                                color: "#64748b",
                              }}
                            >
                              <strong>Catatan Tindak Lanjut:</strong>{" "}
                              {
                                selectedLoan.serah_terima_kembali
                                  .alasan_tindak_lanjut
                              }
                            </div>
                          )}
                      </div>

                      {selectedLoan.serah_terima_kembali.catatan && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#475569",
                            marginBottom: 8,
                          }}
                        >
                          <strong>Catatan Pengelola:</strong> "
                          {selectedLoan.serah_terima_kembali.catatan}"
                        </div>
                      )}

                      {/* Tanda Tangan Kembali */}
                      {(selectedLoan.serah_terima_kembali.ttd_pengelola ||
                        selectedLoan.serah_terima_kembali.ttd_peminjam) && (
                          <div
                            style={{
                              display: "flex",
                              gap: 16,
                              marginTop: 8,
                              paddingTop: 8,
                              borderTop: "1px solid rgba(0,0,0,0.06)",
                              flexWrap: "wrap",
                            }}
                          >
                            {selectedLoan.serah_terima_kembali.ttd_pengelola && (
                              <div
                                style={{
                                  textAlign: "center",
                                  background: "#ffffff",
                                  padding: 8,
                                  borderRadius: 6,
                                  border: "1px dashed #cbd5e1",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "10px",
                                    color: "#64748b",
                                    fontWeight: 600,
                                    marginBottom: 4,
                                  }}
                                >
                                  TTD Pengelola (Penerima)
                                </div>
                                <img
                                  src={
                                    selectedLoan.serah_terima_kembali
                                      .ttd_pengelola
                                  }
                                  alt="TTD Pengelola"
                                  style={{
                                    maxHeight: 45,
                                    maxWidth: 120,
                                    objectFit: "contain",
                                  }}
                                />
                              </div>
                            )}
                            {selectedLoan.serah_terima_kembali.ttd_peminjam && (
                              <div
                                style={{
                                  textAlign: "center",
                                  background: "#ffffff",
                                  padding: 8,
                                  borderRadius: 6,
                                  border: "1px dashed #cbd5e1",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "10px",
                                    color: "#64748b",
                                    fontWeight: 600,
                                    marginBottom: 4,
                                  }}
                                >
                                  TTD Peminjam (Penyerah)
                                </div>
                                <img
                                  src={
                                    selectedLoan.serah_terima_kembali.ttd_peminjam
                                  }
                                  alt="TTD Peminjam"
                                  style={{
                                    maxHeight: 45,
                                    maxWidth: 120,
                                    objectFit: "contain",
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )}

                  {/* Riwayat Perpanjangan Peminjaman */}
                  {Array.isArray(selectedLoan.perpanjangan) &&
                    selectedLoan.perpanjangan.length > 0 && (
                      <div
                        style={{
                          border: "1.5px solid #fed7aa",
                          borderRadius: "var(--radius-md, 8px)",
                          overflow: "hidden",
                          background: "#ffffff",
                          marginTop: "var(--sp-4)",
                        }}
                      >
                        <div
                          style={{
                            padding: "8px 12px",
                            background: "#fff7ed",
                            borderBottom: "1px solid #fed7aa",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <CalendarClock
                            size={16}
                            style={{ color: "#ea580c" }}
                          />
                          <strong
                            style={{ fontSize: "13px", color: "#9a3412" }}
                          >
                            Riwayat Permohonan Perpanjangan Waktu Peminjaman
                          </strong>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                          <table
                            style={{
                              width: "100%",
                              fontSize: "12px",
                              borderCollapse: "collapse",
                            }}
                          >
                            <thead>
                              <tr
                                style={{
                                  background: "#f8fafc",
                                  borderBottom: "1px solid #e2e8f0",
                                  color: "#475569",
                                }}
                              >
                                <th
                                  style={{
                                    padding: "8px 10px",
                                    textAlign: "center",
                                    width: 40,
                                  }}
                                >
                                  Ke-
                                </th>
                                <th
                                  style={{
                                    padding: "8px 10px",
                                    textAlign: "left",
                                  }}
                                >
                                  Tgl Pengajuan
                                </th>
                                <th
                                  style={{
                                    padding: "8px 10px",
                                    textAlign: "left",
                                  }}
                                >
                                  Perubahan Tanggal Kembali
                                </th>
                                <th
                                  style={{
                                    padding: "8px 10px",
                                    textAlign: "left",
                                  }}
                                >
                                  Alasan Permohonan
                                </th>
                                <th
                                  style={{
                                    padding: "8px 10px",
                                    textAlign: "center",
                                  }}
                                >
                                  Status
                                </th>
                                <th
                                  style={{
                                    padding: "8px 10px",
                                    textAlign: "left",
                                  }}
                                >
                                  Keputusan Pengelola
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedLoan.perpanjangan.map((item, idx) => {
                                const statusBg =
                                  item.status === "disetujui"
                                    ? "#dcfce7"
                                    : item.status === "ditolak"
                                      ? "#fee2e2"
                                      : "#fef3c7";
                                const statusColor =
                                  item.status === "disetujui"
                                    ? "#15803d"
                                    : item.status === "ditolak"
                                      ? "#b91c1c"
                                      : "#b45309";
                                const statusLabel =
                                  item.status === "disetujui"
                                    ? "Disetujui"
                                    : item.status === "ditolak"
                                      ? "Ditolak"
                                      : "Menunggu Verifikasi";

                                return (
                                  <tr
                                    key={item.id || idx}
                                    style={{
                                      borderBottom: "1px solid #f1f5f9",
                                    }}
                                  >
                                    <td
                                      style={{
                                        padding: "8px 10px",
                                        textAlign: "center",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {idx + 1}
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px 10px",
                                        whiteSpace: "nowrap",
                                        color: "#64748b",
                                      }}
                                    >
                                      <div>
                                        {item.diajukan_pada
                                          ? String(item.diajukan_pada).slice(
                                            0,
                                            10,
                                          )
                                          : "-"}
                                      </div>
                                      {item.diajukan_oleh && (
                                        <div
                                          style={{
                                            fontSize: "10px",
                                            color: "#94a3b8",
                                            marginTop: 2,
                                          }}
                                        >
                                          Oleh: {item.diajukan_oleh}
                                        </div>
                                      )}
                                    </td>
                                    <td style={{ padding: "8px 10px" }}>
                                      <span
                                        style={{
                                          textDecoration: "line-through",
                                          color: "#94a3b8",
                                        }}
                                      >
                                        {item.tanggal_kembali_lama}
                                      </span>{" "}
                                      ➔{" "}
                                      <strong style={{ color: "#059669" }}>
                                        {item.tanggal_kembali_baru}
                                      </strong>
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px 10px",
                                        fontStyle: "italic",
                                        color: "#334155",
                                      }}
                                    >
                                      "{item.alasan}"
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px 10px",
                                        textAlign: "center",
                                      }}
                                    >
                                      <span
                                        className="badge"
                                        style={{
                                          background: statusBg,
                                          color: statusColor,
                                          fontSize: "10px",
                                          padding: "2px 8px",
                                          fontWeight: 700,
                                        }}
                                      >
                                        {statusLabel}
                                      </span>
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px 10px",
                                        fontSize: "11px",
                                      }}
                                    >
                                      {item.status === "menunggu" ? (
                                        <span
                                          style={{
                                            color: "#b45309",
                                            fontStyle: "italic",
                                          }}
                                        >
                                          Menunggu telaah Pengelola
                                        </span>
                                      ) : (
                                        (() => {
                                          const catatanText =
                                            item.catatan_keputusan ||
                                            item.catatan;
                                          const pemutusNama =
                                            item.diputuskan_oleh ||
                                            item.pengelola?.nama ||
                                            item.manager_lab?.nama ||
                                            "Pengelola Peralatan";
                                          return (
                                            <div>
                                              <div
                                                style={{
                                                  color: "#1e293b",
                                                  fontWeight: catatanText
                                                    ? 600
                                                    : 400,
                                                }}
                                              >
                                                {catatanText ? (
                                                  <span>"{catatanText}"</span>
                                                ) : (
                                                  <span
                                                    style={{
                                                      color: "#94a3b8",
                                                      fontStyle: "italic",
                                                    }}
                                                  >
                                                    Tidak ada catatan khusus
                                                  </span>
                                                )}
                                              </div>
                                              <div
                                                style={{
                                                  color: "#64748b",
                                                  fontSize: "10px",
                                                  marginTop: 3,
                                                }}
                                              >
                                                Oleh:{" "}
                                                <strong>{pemutusNama}</strong>
                                                {item.diputuskan_pada &&
                                                  ` • ${String(item.diputuskan_pada).slice(0, 10)}`}
                                              </div>
                                              {(item.ttd ||
                                                item.ttd_manager_lab) && (
                                                  <div style={{ marginTop: 4 }}>
                                                    <img
                                                      src={
                                                        item.ttd ||
                                                        item.ttd_manager_lab
                                                      }
                                                      alt="TTD Pengesahan"
                                                      style={{
                                                        maxHeight: 35,
                                                        maxWidth: 100,
                                                        objectFit: "contain",
                                                      }}
                                                    />
                                                  </div>
                                                )}
                                            </div>
                                          );
                                        })()
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
                        border: "2px solid var(--clr-primary-500, #ee2e24)",
                        borderRadius: "var(--radius-lg, 12px)",
                        padding: "var(--sp-5)",
                        background: "#fffdfd",
                        boxShadow: "0 4px 12px rgba(238, 46, 36, 0.08)",
                        marginTop: "var(--sp-5)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <FileCheck size={18} style={{ color: "#991b1b" }} />
                          <h4
                            style={{
                              margin: 0,
                              fontSize: "14px",
                              fontWeight: "bold",
                              color: "#991b1b",
                            }}
                          >
                            Tindakan Keputusan:{" "}
                            {activeReviewStage === "manager_peminjam" &&
                              "Manager Peminjam"}
                            {activeReviewStage === "pengelola" &&
                              "Pengelola Peralatan"}
                            {activeReviewStage === "manager_lab" &&
                              "Manager Lab Pemilik"}
                          </h4>
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{
                            fontSize: "11px",
                            color: "#64748b",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                          onClick={() =>
                            modalContentRef.current?.scrollTo({
                              top: 0,
                              behavior: "smooth",
                            })
                          }
                        >
                          ↑ Lihat Rincian Lembar
                        </button>
                      </div>

                      {/* KHUSUS TAHAP 2 PENGELOLA PERALATAN: CHECKLIST VERIFIKASI TEKNIS (BUKAN LAMPIRAN A!) */}
                      {activeReviewStage === "pengelola" &&
                        (() => {
                          const isAllTechChecksPassed =
                            techCheckSchedule &&
                            techCheckSpec &&
                            techCheckOperator &&
                            (!selectedLoan.is_eksternal || techCheckLocation);

                          return (
                            <div
                              style={{
                                marginBottom: "var(--sp-4)",
                                padding: "12px",
                                background: isAllTechChecksPassed
                                  ? "#eff6ff"
                                  : "#fef2f2",
                                borderRadius: "8px",
                                border: isAllTechChecksPassed
                                  ? "1.5px solid #bfdbfe"
                                  : "1.5px solid #fecaca",
                                transition: "all 0.2s",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginBottom: 8,
                                  flexWrap: "wrap",
                                  gap: 6,
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "bold",
                                    fontSize: "13px",
                                    color: isAllTechChecksPassed
                                      ? "#1e40af"
                                      : "#991b1b",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <ShieldCheck size={16} />
                                  Checklist Verifikasi Kelayakan & Ketersediaan
                                  Alat:
                                </div>
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: 600,
                                    padding: "2px 8px",
                                    borderRadius: 12,
                                    background: isAllTechChecksPassed
                                      ? "#dbeafe"
                                      : "#fee2e2",
                                    color: isAllTechChecksPassed
                                      ? "#1e40af"
                                      : "#b91c1c",
                                  }}
                                >
                                  {isAllTechChecksPassed
                                    ? "✓ Syarat Lengkap"
                                    : "Ada Syarat Tidak Terpenuhi"}
                                </span>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 8,
                                  fontSize: "12px",
                                  color: "#1e293b",
                                }}
                              >
                                <label
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    cursor: "pointer",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={techCheckSchedule}
                                    onChange={(e) =>
                                      handleTechCheckToggle(
                                        "schedule",
                                        e.target.checked,
                                      )
                                    }
                                    style={{
                                      width: 16,
                                      height: 16,
                                      accentColor: "#2563eb",
                                    }}
                                  />
                                  <span>
                                    <strong>
                                      1. Status & Jadwal Kalibrasi:
                                    </strong>{" "}
                                    Alat berstatus LAYAK PAKAI dan rencana
                                    tanggal kembali (
                                    {selectedLoan.rencana_tanggal_kembali})
                                    tidak melampaui tanggal jatuh tempo
                                    kalibrasi (
                                    {selectedLoan.peralatan?.tgl_jatuh_tempo ||
                                      "-"}
                                    ).
                                  </span>
                                </label>

                                <label
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    cursor: "pointer",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={techCheckSpec}
                                    onChange={(e) =>
                                      handleTechCheckToggle(
                                        "spec",
                                        e.target.checked,
                                      )
                                    }
                                    style={{
                                      width: 16,
                                      height: 16,
                                      accentColor: "#2563eb",
                                    }}
                                  />
                                  <span>
                                    <strong>2. Kesesuaian Spesifikasi:</strong>{" "}
                                    Rentang ukur, kapasitas, dan batas toleransi
                                    alat sesuai dengan tujuan
                                    pengujian/kegiatan.
                                  </span>
                                </label>

                                <label
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    cursor: "pointer",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={techCheckOperator}
                                    onChange={(e) =>
                                      handleTechCheckToggle(
                                        "operator",
                                        e.target.checked,
                                      )
                                    }
                                    style={{
                                      width: 16,
                                      height: 16,
                                      accentColor: "#2563eb",
                                    }}
                                  />
                                  <span>
                                    <strong>3. Kewenangan Operator:</strong>{" "}
                                    Peminjam / Operator (
                                    {selectedLoan.peminjam?.operator ||
                                      selectedLoan.peminjam?.nama ||
                                      "-"}
                                    ) memiliki kewenangan dan kompetensi
                                    mengoperasikan alat ini.
                                  </span>
                                </label>

                                {selectedLoan.is_eksternal && (
                                  <label
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      cursor: "pointer",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={techCheckLocation}
                                      onChange={(e) =>
                                        handleTechCheckToggle(
                                          "location",
                                          e.target.checked,
                                        )
                                      }
                                      style={{
                                        width: 16,
                                        height: 16,
                                        accentColor: "#2563eb",
                                      }}
                                    />
                                    <span>
                                      <strong>
                                        4. Kesiapan Lokasi Eksternal:
                                      </strong>{" "}
                                      Kondisi lingkungan & catu daya di lokasi
                                      tujuan ({selectedLoan.lokasi_penggunaan})
                                      memenuhi syarat metode dan spesifikasi
                                      alat.
                                    </span>
                                  </label>
                                )}
                              </div>

                              {!isAllTechChecksPassed && (
                                <div
                                  style={{
                                    marginTop: 10,
                                    padding: "8px 12px",
                                    background: "#fee2e2",
                                    border: "1px solid #fecaca",
                                    borderRadius: 6,
                                    fontSize: "11px",
                                    color: "#991b1b",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  <AlertTriangle
                                    size={15}
                                    style={{ flexShrink: 0 }}
                                  />
                                  <span>
                                    <strong>Otomatis Ditolak:</strong> Karena
                                    terdapat butir verifikasi yang tidak
                                    diceklis, keputusan otomatis ditetapkan{" "}
                                    <strong>Tolak</strong> dan opsi persetujuan
                                    dinonaktifkan.
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                      {/* Pilihan Keputusan */}
                      <div
                        className="form-group"
                        style={{ marginBottom: "var(--sp-3)" }}
                      >
                        <label
                          className="form-label"
                          style={{ fontWeight: 600 }}
                        >
                          Keputusan{" "}
                          {activeReviewStage === "manager_peminjam"
                            ? "Manager Peminjam"
                            : activeReviewStage === "pengelola"
                              ? "Pengelola Peralatan"
                              : "Manager Lab"}{" "}
                          <span className="required">*</span>
                        </label>
                        <div
                          style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
                        >
                          <button
                            type="button"
                            id="btn-keputusan-setuju"
                            onClick={() => {
                              const isAllPassed =
                                techCheckSchedule &&
                                techCheckSpec &&
                                techCheckOperator &&
                                (!selectedLoan.is_eksternal ||
                                  techCheckLocation);
                              if (
                                activeReviewStage === "pengelola" &&
                                !isAllPassed
                              ) {
                                toastError(
                                  "Semua butir kelayakan & ketersediaan wajib diceklis untuk menyetujui peminjaman.",
                                );
                                setDecisionAction("tolak");
                                return;
                              }
                              setDecisionAction("setuju");
                            }}
                            disabled={
                              activeReviewStage === "pengelola" &&
                              !(
                                techCheckSchedule &&
                                techCheckSpec &&
                                techCheckOperator &&
                                (!selectedLoan.is_eksternal ||
                                  techCheckLocation)
                              )
                            }
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 16px",
                              borderRadius: "var(--radius-md, 8px)",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor:
                                activeReviewStage === "pengelola" &&
                                  !(
                                    techCheckSchedule &&
                                    techCheckSpec &&
                                    techCheckOperator &&
                                    (!selectedLoan.is_eksternal ||
                                      techCheckLocation)
                                  )
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                activeReviewStage === "pengelola" &&
                                  !(
                                    techCheckSchedule &&
                                    techCheckSpec &&
                                    techCheckOperator &&
                                    (!selectedLoan.is_eksternal ||
                                      techCheckLocation)
                                  )
                                  ? 0.5
                                  : 1,
                              transition: "all 0.15s ease",
                              border:
                                decisionAction === "setuju"
                                  ? "2px solid #16a34a"
                                  : "1.5px solid #cbd5e1",
                              background:
                                decisionAction === "setuju"
                                  ? "#f0fdf4"
                                  : "#ffffff",
                              color:
                                decisionAction === "setuju"
                                  ? "#15803d"
                                  : "#475569",
                              boxShadow:
                                decisionAction === "setuju"
                                  ? "0 1px 3px rgba(22, 163, 74, 0.15)"
                                  : "none",
                            }}
                          >
                            <CheckCircle2
                              size={16}
                              style={{
                                color:
                                  decisionAction === "setuju"
                                    ? "#16a34a"
                                    : "#94a3b8",
                              }}
                            />
                            <span>Setuju</span>
                          </button>

                          <button
                            type="button"
                            id="btn-keputusan-tolak"
                            onClick={() => setDecisionAction("tolak")}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "8px 16px",
                              borderRadius: "var(--radius-md, 8px)",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              border:
                                decisionAction === "tolak"
                                  ? "2px solid #dc2626"
                                  : "1.5px solid #cbd5e1",
                              background:
                                decisionAction === "tolak"
                                  ? "#fef2f2"
                                  : "#ffffff",
                              color:
                                decisionAction === "tolak"
                                  ? "#b91c1c"
                                  : "#475569",
                              boxShadow:
                                decisionAction === "tolak"
                                  ? "0 1px 3px rgba(220, 38, 38, 0.15)"
                                  : "none",
                            }}
                          >
                            <XCircle
                              size={16}
                              style={{
                                color:
                                  decisionAction === "tolak"
                                    ? "#dc2626"
                                    : "#94a3b8",
                              }}
                            />
                            <span>Tolak</span>
                          </button>
                        </div>
                      </div>

                      {/* Catatan Keputusan */}
                      <div
                        className="form-group"
                        style={{ marginBottom: "var(--sp-3)" }}
                      >
                        <label className="form-label">
                          {decisionAction === "setuju"
                            ? "Catatan / Arahan (Opsional)"
                            : "Alasan Penolakan (Wajib)"}
                        </label>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          placeholder={
                            decisionAction === "setuju"
                              ? "Catatan pemeriksaan teknis atau instruksi khusus..."
                              : "Uraikan alasan penolakan peralatan..."
                          }
                          value={decisionNote}
                          onChange={(e) => setDecisionNote(e.target.value)}
                          required={decisionAction === "tolak"}
                        />
                      </div>

                      {/* Opsi Usulan Peralatan Alternatif (Khusus Pengelola saat Menolak) */}
                      {decisionAction === "tolak" &&
                        activeReviewStage === "pengelola" && (
                          <div
                            className="form-group"
                            style={{ marginBottom: "var(--sp-3)" }}
                          >
                            <label
                              className="form-label"
                              htmlFor="input-alat-alternatif"
                            >
                              Usulkan Peralatan Alternatif{" "}
                              <span
                                className="form-hint"
                                style={{ display: "inline" }}
                              >
                                (Opsional)
                              </span>
                            </label>
                            <select
                              id="input-alat-alternatif"
                              className="form-select"
                              value={alternativeEquipmentId}
                              onChange={(e) =>
                                setAlternativeEquipmentId(e.target.value)
                              }
                            >
                              <option value="">
                                -- Tidak Ada Usulan Alat Pengganti --
                              </option>
                              {equipmentList
                                .filter(
                                  (eq) =>
                                    String(eq.id) !==
                                    String(selectedLoan?.peralatan?.id),
                                )
                                .map((eq) => (
                                  <option key={eq.id} value={eq.id}>
                                    {eq.nama_peralatan} (
                                    {eq.nomor_aset || "Tanpa No. Aset"})
                                  </option>
                                ))}
                            </select>
                            <span className="form-hint">
                              Alat alternatif ini dapat disarankan kepada
                              peminjam sebagai opsi pengganti yang layak.
                            </span>
                          </div>
                        )}

                      {/* Signature Pad */}
                      {decisionAction === "setuju" && (
                        <DigitalSignaturePad
                          value={digitalSignature}
                          onChange={setDigitalSignature}
                          label={`Tanda Tangan Digital ${activeReviewStage === "manager_peminjam"
                              ? "Manager Peminjam"
                              : activeReviewStage === "pengelola"
                                ? "Pengelola Peralatan"
                                : "Manager Lab"
                            }`}
                          required
                          savedSignature={userSavedSig}
                          onRestore={() => setDigitalSignature(userSavedSig)}
                          onForgetSaved={handleForgetSavedSig}
                        />
                      )}

                      {/* Tombol Eksekusi Modal */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 10,
                          marginTop: "var(--sp-4)",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setSelectedLoan(null)}
                          style={{
                            padding: "8px 20px",
                            fontSize: "13px",
                            fontWeight: 600,
                          }}
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className={`btn ${decisionAction === "setuju" ? "btn-primary" : "btn-secondary"}`}
                          disabled={isSubmitting}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 20px",
                            fontSize: "13px",
                            fontWeight: 600,
                            ...(decisionAction !== "setuju"
                              ? { color: "#dc2626", borderColor: "#fca5a5" }
                              : {}),
                          }}
                        >
                          {decisionAction === "setuju" ? (
                            <CheckCircle2 size={15} />
                          ) : (
                            <XCircle size={15} />
                          )}
                          {isSubmitting
                            ? "Memproses..."
                            : decisionAction === "setuju"
                              ? "Konfirmasi Persetujuan"
                              : "Konfirmasi Penolakan"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ================================================================ */}
                  {/* 5. KOTAK INFORMASI PENOLAKAN PERSETUJUAN PEMINJAMAN              */}
                  {/* ================================================================ */}
                  {rejectionInfo && (
                    <div
                      className="card"
                      style={{
                        padding: "var(--sp-5)",
                        marginTop: "var(--sp-4)",
                        background:
                          "linear-gradient(180deg, #fff5f5 0%, #ffffff 100%)",
                        border: "1.5px solid #fca5a5",
                        borderRadius: "var(--radius-lg, 10px)",
                        boxShadow: "0 4px 12px rgba(220, 38, 38, 0.08)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              background: "#fee2e2",
                              color: "#dc2626",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <AlertOctagon size={22} />
                          </div>
                          <div>
                            <h3
                              style={{
                                margin: 0,
                                fontSize: "15px",
                                fontWeight: 800,
                                color: "#991b1b",
                              }}
                            >
                              Permohonan Peminjaman Ditolak
                            </h3>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "12px",
                                color: "#b91c1c",
                                marginTop: 2,
                              }}
                            >
                              {rejectionInfo.stage}
                            </p>
                          </div>
                        </div>
                        <span
                          className="badge badge-error"
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "4px 10px",
                          }}
                        >
                          Status: Ditolak
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: 14,
                          paddingTop: 12,
                          borderTop: "1px solid #fee2e2",
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                          gap: 12,
                          fontSize: "12px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              color: "#64748b",
                              fontSize: "11px",
                              display: "block",
                            }}
                          >
                            Ditolak Oleh ({rejectionInfo.role}):
                          </span>
                          <strong
                            style={{ color: "#0f172a", fontSize: "13px" }}
                          >
                            {rejectionInfo.nama}
                          </strong>
                          {rejectionInfo.nip && rejectionInfo.nip !== "-" && (
                            <div style={{ color: "#64748b", fontSize: "11px" }}>
                              NIP: {rejectionInfo.nip}
                            </div>
                          )}
                        </div>
                        <div>
                          <span
                            style={{
                              color: "#64748b",
                              fontSize: "11px",
                              display: "block",
                            }}
                          >
                            Tanggal Keputusan Penolakan:
                          </span>
                          <strong style={{ color: "#0f172a" }}>
                            {rejectionInfo.tanggal || "-"}
                          </strong>
                        </div>
                      </div>

                      {/* Alasan Penolakan */}
                      <div
                        style={{
                          marginTop: 12,
                          padding: "10px 14px",
                          background: "#ffffff",
                          border: "1px solid #fecaca",
                          borderRadius: "var(--radius-md, 6px)",
                        }}
                      >
                        <span
                          style={{
                            color: "#991b1b",
                            fontSize: "11px",
                            fontWeight: 700,
                            display: "block",
                            textTransform: "uppercase",
                          }}
                        >
                          Alasan Penolakan:
                        </span>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: "12.5px",
                            color: "#1f2937",
                            fontStyle: "italic",
                            lineHeight: 1.5,
                          }}
                        >
                          "
                          {rejectionInfo.catatan ||
                            "Tidak ada uraian alasan penolakan yang dicantumkan."}
                          "
                        </p>
                      </div>

                      {/* Butir Cek Kelayakan yang Gagal (Khusus Penolakan Pengelola) */}
                      {rejectionInfo.failedChecks.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#991b1b",
                              fontWeight: 600,
                            }}
                          >
                            Butir Verifikasi yang Tidak Terpenuhi:
                          </span>
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              flexWrap: "wrap",
                              marginTop: 4,
                            }}
                          >
                            {rejectionInfo.failedChecks.map((fc, idx) => (
                              <span
                                key={idx}
                                className="badge badge-error"
                                style={{ fontSize: "10.5px" }}
                              >
                                ✕ {fc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Keterangan Tambahan: Usulan Peralatan Alternatif (Khusus Pengelola) */}
                      {rejectionInfo.alatAlternatif && (
                        <div
                          style={{
                            marginTop: 12,
                            padding: "12px 14px",
                            background: "#fffbeb",
                            border: "1.5px solid #fde68a",
                            borderRadius: "var(--radius-md, 8px)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              fontWeight: 700,
                              fontSize: "11px",
                              color: "#92400e",
                              textTransform: "uppercase",
                              letterSpacing: "0.03em",
                            }}
                          >
                            <Sparkles size={14} style={{ color: "#d97706" }} />
                            Usulan Peralatan Alternatif dari Pengelola:
                          </div>
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "#78350f",
                            }}
                          >
                            {rejectionInfo.alatAlternatif.nama_peralatan}
                          </div>
                          <div
                            style={{
                              fontSize: "11.5px",
                              color: "#92400e",
                              marginTop: 2,
                            }}
                          >
                            No. Aset:{" "}
                            <strong>
                              {rejectionInfo.alatAlternatif.nomor_aset || "-"}
                            </strong>
                            {rejectionInfo.alatAlternatif.merek
                              ? ` • Merek: ${rejectionInfo.alatAlternatif.merek}`
                              : ""}
                            {rejectionInfo.alatAlternatif.tipe ||
                              rejectionInfo.alatAlternatif.tipe_model
                              ? ` • Tipe: ${rejectionInfo.alatAlternatif.tipe || rejectionInfo.alatAlternatif.tipe_model}`
                              : ""}
                            {rejectionInfo.alatAlternatif.lokasi
                              ? ` • Lokasi: ${rejectionInfo.alatAlternatif.lokasi}`
                              : ""}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#b45309",
                              marginTop: 6,
                              fontStyle: "italic",
                            }}
                          >
                            Peminjam disarankan untuk mengajukan permohonan baru
                            menggunakan peralatan alternatif yang diusulkan di
                            atas.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div
                  className="modal-footer verification-review-footer"
                  style={{ justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    SiKEPo — Sistem Informasi Kelayakan Peralatan
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedLoan(null)}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          );
        })()}

      {/* ==================================================================== */}
      {/* 7. MODAL 2: SERAH TERIMA FISIK KELUAR (TAHAP 4 - LAMPIRAN A)          */}
      {/* ==================================================================== */}
      {selectedLoan &&
        modalMode === "checkout" &&
        createPortal(
          <div
            className="modal-overlay verification-review-overlay"
            role="presentation"
            onClick={() => setSelectedLoan(null)}
          >
            <div
              className="modal modal-xl verification-review-modal"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="modal-header">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Package
                      size={20}
                      style={{
                        color:
                          checkoutStep === "peminjam" ? "#0284c7" : "#ea580c",
                      }}
                    />
                    <h2 className="modal-title">
                      {checkoutStep === "peminjam"
                        ? "Konfirmasi Penerimaan Peralatan & TTD — Peminjam"
                        : "Pemeriksaan Serah Terima Fisik Keluar — Pengelola"}
                    </h2>
                  </div>
                  <p
                    className="page-subtitle"
                    style={{ margin: "4px 0 0", fontSize: "var(--text-xs)" }}
                  >
                    {checkoutStep === "peminjam"
                      ? `Tiket ${selectedLoan.kode || selectedLoan.id} — Periksa hasil kelayakan fisik 5 butir dari Pengelola dan bubuhkan tanda tangan tanda terima`
                      : `Tiket ${selectedLoan.kode || selectedLoan.id} — Pemeriksaan fisik 5 butir kelayakan alat oleh Pengelola sebelum diserahkan ke Peminjam`}
                  </p>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setSelectedLoan(null)}
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>

            {/* Stepper Progres Serah Terima 2 Langkah */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px var(--sp-6)",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                fontSize: "12px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: checkoutStep === "pengelola" ? 700 : 500,
                  color: checkoutStep === "pengelola" ? "#ea580c" : "#16a34a",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background:
                      checkoutStep === "pengelola" ? "#ea580c" : "#16a34a",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {checkoutStep === "peminjam" ? "✓" : "1"}
                </span>
                <span>Pengisian Pemeriksaan Kondisi & TTD (Pengelola)</span>
              </div>
              <span style={{ color: "#94a3b8" }}>➔</span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontWeight: checkoutStep === "peminjam" ? 700 : 500,
                  color: checkoutStep === "peminjam" ? "#0284c7" : "#94a3b8",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background:
                      checkoutStep === "peminjam" ? "#0284c7" : "#e2e8f0",
                    color: checkoutStep === "peminjam" ? "#ffffff" : "#64748b",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  2
                </span>
                <span>Konfirmasi Terima & TTD (Peminjam)</span>
              </div>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSubmitCheckout}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <div className="modal-body" ref={checkoutModalRef}>
              {/* Petunjuk Pengemasan Sesuai Butir 8.4 IK */}
              <div
                style={{
                  padding: "10px 14px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  marginBottom: "var(--sp-4)",
                  fontSize: "12px",
                  color: "#334155",
                }}
              >
                <strong style={{ color: "#0f172a" }}>
                  Ketentuan Pengemasan & Kelengkapan (Butir 8.4 IK):
                </strong>
                <ul style={{ margin: "4px 0 0 18px", padding: 0 }}>
                  <li>
                    Gunakan wadah/koper bawaan pabrikan atau wadah berperedam
                    guncangan.
                  </li>
                  <li>
                    Pasang tutup pelindung pada konektor/port (termasuk
                    antarmuka optik).
                  </li>
                  <li>
                    Kabel dan aksesori diikat rapi dan tidak menekan bagian
                    peralatan yang peka.
                  </li>
                  <li>
                    Beri penanda "mudah pecah" jika peralatan sensitif getaran.
                  </li>
                </ul>
              </div>

              {/* Rincian Singkat Alat */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                  padding: "10px 14px",
                  background: "#f1f5f9",
                  borderRadius: "8px",
                  marginBottom: "var(--sp-4)",
                  fontSize: "12px",
                }}
              >
                <div>
                  <span
                    style={{
                      color: "#64748b",
                      display: "block",
                      fontSize: "11px",
                    }}
                  >
                    Peralatan:
                  </span>
                  <strong>{selectedLoan.peralatan.nama_peralatan}</strong>
                </div>
                <div>
                  <span
                    style={{
                      color: "#64748b",
                      display: "block",
                      fontSize: "11px",
                    }}
                  >
                    No. Aset / Seri:
                  </span>
                  <strong>{selectedLoan.peralatan.nomor_aset}</strong> (
                  {selectedLoan.peralatan.nomor_seri})
                </div>
                <div>
                  <span
                    style={{
                      color: "#64748b",
                      display: "block",
                      fontSize: "11px",
                    }}
                  >
                    Peminjam / Penerima:
                  </span>
                  <strong>{selectedLoan.peminjam.nama}</strong> (
                  {selectedLoan.peminjam.lab_asal})
                </div>
              </div>

              {/* TABEL BAGIAN B TLKM13/F/010 (7 BUTIR PEMERIKSAAN RESMI) */}
              <div
                ref={checkoutPengelolaRef}
                style={{ marginBottom: "var(--sp-4)", scrollMarginTop: "16px" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "13px",
                      color: "#0f172a",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <ClipboardCheck size={16} style={{ color: "#16a34a" }} />
                    Pemeriksaan Serah Terima Peralatan
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      {checkoutStep === "pengelola"
                        ? "S = Sesuai | TS = Tidak Sesuai"
                        : "Status Terverifikasi Pengelola"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    overflowX: "auto",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "12px",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#e2e8f0", textAlign: "left" }}>
                        <th
                          style={{
                            padding: "8px 10px",
                            width: 32,
                            textAlign: "center",
                            borderRight: "1px solid #cbd5e1",
                          }}
                        >
                          No.
                        </th>
                        <th
                          style={{
                            padding: "8px 10px",
                            borderRight: "1px solid #cbd5e1",
                          }}
                        >
                          Butir Pemeriksaan
                        </th>
                        <th
                          style={{
                            padding: "8px 10px",
                            width: checkoutStep === "peminjam" ? 140 : 155,
                            textAlign: "center",
                            borderRight: "1px solid #cbd5e1",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Keluar (S/TS)
                        </th>
                        <th style={{ padding: "8px 10px" }}>Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {LAMPIRAN_A_BUTIR.map((butir, idx) => {
                        const item = checkoutChecks[idx] || {
                          status: "S",
                          keterangan: "",
                        };
                        const isTS = item.status === "TS";
                        const isS = item.status === "S";
                        return (
                          <tr
                            key={idx}
                            style={{
                              background: isTS
                                ? "#fef2f2"
                                : idx % 2 === 0
                                  ? "#ffffff"
                                  : "#f8fafc",
                              borderBottom: "1px solid #e2e8f0",
                            }}
                          >
                            <td
                              style={{
                                padding: "6px 10px",
                                textAlign: "center",
                                borderRight: "1px solid #cbd5e1",
                                fontWeight: 600,
                                color: "#475569",
                              }}
                            >
                              {idx + 1}.
                            </td>
                            <td
                              style={{
                                padding: "6px 10px",
                                borderRight: "1px solid #cbd5e1",
                                lineHeight: 1.35,
                              }}
                            >
                              {butir}
                              {idx === IDX_KELENGKAPAN &&
                                (selectedLoan.kebutuhan_kelengkapan ||
                                  selectedLoan.kelengkapan) && (
                                  <div
                                    style={{
                                      marginTop: 3,
                                      fontSize: "10.5px",
                                      color: "#0369a1",
                                      background: "#e0f2fe",
                                      padding: "2px 6px",
                                      borderRadius: 4,
                                      display: "inline-block",
                                    }}
                                  >
                                    Daftar Kelengkapan:{" "}
                                    <strong>
                                      {selectedLoan.kebutuhan_kelengkapan ||
                                        selectedLoan.kelengkapan}
                                    </strong>
                                  </div>
                                )}
                            </td>
                            <td
                              style={{
                                padding: "6px 10px",
                                textAlign: "center",
                                borderRight: "1px solid #cbd5e1",
                              }}
                            >
                              {checkoutStep === "pengelola" ? (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    justifyContent: "center",
                                    alignItems: "center",
                                  }}
                                >
                                  <label
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 2,
                                      cursor: "pointer",
                                      fontWeight: isS ? 700 : 400,
                                      color: isS ? "#16a34a" : "#64748b",
                                      fontSize: "11px",
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      name={`checkout_${idx}`}
                                      value="S"
                                      checked={isS}
                                      onChange={() => {
                                        const updated = [...checkoutChecks];
                                        updated[idx] = {
                                          ...updated[idx],
                                          status: "S",
                                        };
                                        setCheckoutChecks(updated);
                                      }}
                                      style={{ accentColor: "#16a34a" }}
                                    />
                                    S
                                  </label>
                                  <label
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 2,
                                      cursor: "pointer",
                                      fontWeight: isTS ? 700 : 400,
                                      color: isTS ? "#dc2626" : "#64748b",
                                      fontSize: "11px",
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      name={`checkout_${idx}`}
                                      value="TS"
                                      checked={isTS}
                                      onChange={() => {
                                        const updated = [...checkoutChecks];
                                        updated[idx] = {
                                          ...updated[idx],
                                          status: "TS",
                                        };
                                        setCheckoutChecks(updated);
                                      }}
                                      style={{ accentColor: "#dc2626" }}
                                    />
                                    TS
                                  </label>
                                </div>
                              ) : isTS ? (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "2px 8px",
                                    borderRadius: 4,
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    background: "#fef2f2",
                                    color: "#dc2626",
                                    border: "1px solid #fecaca",
                                  }}
                                >
                                  <AlertOctagon size={12} /> TS (Tidak Sesuai)
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    padding: "2px 8px",
                                    borderRadius: 4,
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    background: "#f0fdf4",
                                    color: "#166534",
                                    border: "1px solid #bbf7d0",
                                  }}
                                >
                                  <CheckCircle2 size={12} /> S (Sesuai)
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "4px 8px" }}>
                              {checkoutStep === "pengelola" ? (
                                <input
                                  type="text"
                                  value={item.keterangan}
                                  onChange={(e) => {
                                    const updated = [...checkoutChecks];
                                    updated[idx] = {
                                      ...updated[idx],
                                      keterangan: e.target.value,
                                    };
                                    setCheckoutChecks(updated);
                                  }}
                                  placeholder={
                                    isTS
                                      ? "Wajib jelaskan ketidaksesuaian..."
                                      : "Catatan opsional..."
                                  }
                                  required={isTS}
                                  style={{
                                    width: "100%",
                                    border: isTS
                                      ? "1.5px solid #f87171"
                                      : "1px solid #cbd5e1",
                                    borderRadius: 4,
                                    padding: "4px 8px",
                                    fontSize: "11px",
                                    background: isTS ? "#fff1f2" : "#ffffff",
                                    outline: "none",
                                  }}
                                />
                              ) : (
                                <span
                                  style={{
                                    fontSize: "11px",
                                    color: item.keterangan
                                      ? "#334155"
                                      : "#94a3b8",
                                  }}
                                >
                                  {item.keterangan || "-"}
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
              {checkoutStep === "peminjam" && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#eff6ff",
                    border: "1.5px solid #93c5fd",
                    borderRadius: "8px",
                    marginBottom: "var(--sp-2)",
                    fontSize: "12px",
                    color: "#1e40af",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <ShieldCheck
                    size={20}
                    style={{ color: "#2563eb", flexShrink: 0 }}
                  />
                  <div>
                    <strong>Pemeriksaan Fisik Pengelola Selesai:</strong>{" "}
                    Pengelola Peralatan (
                    {selectedLoan.serah_terima_keluar?.pic_petugas ||
                      "Pengelola Lab"}
                    ) telah memeriksa 5 butir kelayakan fisik & fungsi alat.
                    Silakan verifikasi hasil checklist di samping dan bubuhkan
                    tanda tangan tanda terima Anda.
                  </div>
                </div>
              )}

              {/* CRITICAL LOGIC GATE (SESUAI FLOWCHART: "Ada checkbox TS?") */}
              {countTS > 0 ? (
                <div
                  style={{
                    padding: "12px 16px",
                    background: "#fef2f2",
                    border: "2px solid #ef4444",
                    borderRadius: "8px",
                    marginBottom: "var(--sp-4)",
                    color: "#991b1b",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                    }}
                  >
                    <AlertOctagon
                      size={24}
                      style={{ color: "#dc2626", flexShrink: 0, marginTop: 2 }}
                    />
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "13px" }}>
                        PERINGATAN KRITIS: Ditemukan {countTS} Butir Tidak
                        Sesuai (TS)!
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          marginTop: 4,
                          lineHeight: 1.4,
                        }}
                      >
                        Sesuai prosedur operasional serah terima peralatan:
                        <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                          <li>
                            Peralatan yang menunjukkan kondisi tidak normal{" "}
                            <strong>TIDAK BOLEH DISERAHKAN</strong>.
                          </li>
                          <li>
                            Peminjaman otomatis <strong>DIBATALKAN</strong>.
                          </li>
                          <li>
                            Status alat akan dialihkan menjadi{" "}
                            <strong>DO NOT USE</strong> untuk penanganan
                            peninjauan teknis lebih lanjut.
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#f0fdf4",
                    border: "1.5px solid #86efac",
                    borderRadius: "8px",
                    marginBottom: "var(--sp-4)",
                    fontSize: "12px",
                    color: "#166534",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flex: 1,
                      minWidth: "240px",
                    }}
                  >
                    <CheckCircle2
                      size={20}
                      style={{ color: "#16a34a", flexShrink: 0 }}
                    />
                    <div>
                      <div>
                        <strong>Pemeriksaan Fisik Memenuhi Syarat:</strong>{" "}
                        {countS} butir Sesuai (S). Kondisi peralatan layak dan
                        memenuhi standar untuk diserahkan kepada peminjam.
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#15803d",
                          marginTop: 2,
                        }}
                      >
                        {!serahTerimaSelesai(selectedLoan)
                          ? "Dokumen dapat dicetak setelah Pengelola Peralatan dan Peminjam sama-sama menyelesaikan serah terima."
                          : selectedLoan.is_eksternal
                            ? "Peminjaman Eksternal: Wajib dicetak dan dibawa bersama alat untuk pemeriksaan pos Petugas Pengamanan TTH."
                            : "Peminjaman Internal: Siap dicetak atau diunduh sebagai arsip."}
                      </div>
                    </div>
                  </div>
                  {serahTerimaSelesai(selectedLoan) && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 600,
                        fontSize: "12px",
                        padding: "6px 12px",
                        height: "32px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                      onClick={() =>
                        exportLoanF006Pdf(selectedLoan, {
                          checkoutSigPengelola,
                          checkoutSigPeminjam,
                        })
                      }
                    >
                      <Printer size={14} /> Cetak PDF
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontWeight: 600,
                        fontSize: "12px",
                        padding: "6px 12px",
                        height: "32px",
                      }}
                      title="Unduh format dokumen Word (.doc)"
                      onClick={() =>
                        exportLoanF006Word(selectedLoan, {
                          checkoutSigPengelola,
                          checkoutSigPeminjam,
                        })
                      }
                    >
                      <Download size={13} /> Word
                    </button>
                  </div>
                  )}
                </div>
              )}

              {/* Catatan Serah Terima & Area Pengesahan */}
              <div ref={checkoutBottomRef} style={{ scrollMarginTop: "16px" }}>
                {checkoutStep === "pengelola" ? (
                  <div
                    className="form-group"
                    style={{ marginBottom: "var(--sp-4)" }}
                  >
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Catatan Serah Terima Keluar (Pengelola):
                    </label>
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
                      padding: "10px 14px",
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      marginBottom: "var(--sp-4)",
                      fontSize: "12px",
                      color: "#334155",
                    }}
                  >
                    <strong style={{ color: "#0f172a" }}>
                      Catatan dari Pengelola Peralatan:
                    </strong>
                    <div
                      style={{
                        marginTop: 4,
                        color: "#475569",
                        fontStyle: checkoutNote ? "normal" : "italic",
                      }}
                    >
                      {checkoutNote ||
                        selectedLoan.serah_terima_keluar?.catatan ||
                        "Tidak ada catatan tambahan dari pengelola."}
                    </div>
                  </div>
                )}

                {/* Area Tanda Tangan Digital */}
                {checkoutStep === "pengelola" ? (
                  countTS === 0 && (
                    <div style={{ marginBottom: "var(--sp-4)" }}>
                      <DigitalSignaturePad
                        value={checkoutSigPengelola}
                        onChange={setCheckoutSigPengelola}
                        label="Tanda Tangan Pengelola Peralatan"
                        required={true}
                        helperText="Tanda tangan digital untuk mengesahkan inspeksi fisik Pemeriksaan Kondisi"
                        savedSignature={userSavedSig}
                        onRestore={() => setCheckoutSigPengelola(userSavedSig)}
                        onForgetSaved={handleForgetSavedSig}
                      />
                    </div>
                  )
                ) : (
                  /* Langkah 4B (Peminjam): Tampilkan Status TTD Pengelola + Signature Pad Peminjam */
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "var(--sp-4)",
                      marginBottom: "var(--sp-4)",
                    }}
                  >
                    {/* Kolom 1: Status Pengesahan Pengelola */}
                    <div
                      style={{
                        padding: "12px",
                        background: "#f0fdf4",
                        border: "1.5px solid #86efac",
                        borderRadius: "8px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#166534",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          1. TTD Pengelola Peralatan (Disahkan)
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#0f172a",
                            marginTop: 4,
                          }}
                        >
                          {selectedLoan.serah_terima_keluar?.pic_petugas ||
                            selectedLoan.approval_pengelola?.nama ||
                            "Pengelola Lab"}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#475569",
                            marginTop: 2,
                          }}
                        >
                          Status: Telah memeriksa & menandatangani Pemeriksaan Kondisi
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 10,
                          minHeight: 65,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#ffffff",
                          borderRadius: 6,
                          border: "1px dashed #86efac",
                          padding: 6,
                        }}
                      >
                        {checkoutSigPengelola ||
                          selectedLoan.serah_terima_keluar?.ttd_pengelola ? (
                          <img
                            src={
                              checkoutSigPengelola ||
                              selectedLoan.serah_terima_keluar?.ttd_pengelola
                            }
                            alt="TTD Pengelola"
                            style={{
                              maxHeight: 55,
                              maxWidth: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#16a34a",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <CheckCircle2 size={14} /> Terverifikasi Secara
                            Digital
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
                        savedSignature={userSavedSig}
                        onRestore={() => setCheckoutSigPeminjam(userSavedSig)}
                        onForgetSaved={handleForgetSavedSig}
                      />
                    </div>
                  </div>
                )}
              </div>

              </div>

              {/* Tombol Eksekusi Serah Terima */}
              <div className="modal-footer verification-review-footer">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    marginRight: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                  onClick={() =>
                    checkoutModalRef.current?.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    })
                  }
                >
                  ↑ Kembali ke Atas
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedLoan(null)}
                  style={{
                    padding: "8px 20px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Batal
                </button>

                {checkoutStep === "pengelola" ? (
                  countTS > 0 ? (
                    <button
                      type="submit"
                      className="btn btn-secondary"
                      disabled={isSubmitting}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 600,
                        color: "#dc2626",
                        borderColor: "#fca5a5",
                        padding: "8px 20px",
                        fontSize: "13px",
                      }}
                    >
                      <AlertOctagon size={16} />
                      Konfirmasi Serah Terima
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 600,
                        padding: "8px 20px",
                        fontSize: "13px",
                      }}
                    >
                      <CheckCircle2 size={15} />
                      Konfirmasi Serah Terima
                    </button>
                  )
                ) : (
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={isSubmitting}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontWeight: 600,
                      background: "#16a34a",
                      borderColor: "#15803d",
                      color: "#ffffff",
                      padding: "8px 20px",
                      fontSize: "13px",
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Konfirmasi Serah Terima
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {/* ==================================================================== */}
      {/* 8. MODAL 3: LEMBAR SERAH TERIMA PENGEMBALIAN                         */}
      {/* ==================================================================== */}
      {selectedLoan &&
        modalMode === "return" &&
        createPortal(
          <div
            className="modal-overlay verification-review-overlay"
            role="presentation"
            onClick={() => setSelectedLoan(null)}
          >
            <div
              className="modal modal-xl verification-review-modal"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="modal-header">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Package size={20} style={{ color: "#059669" }} />
                    <h2 className="modal-title">
                      Lembar Serah Terima Peralatan — Pengembalian
                    </h2>
                  </div>
                  <p
                    className="page-subtitle"
                    style={{ margin: "4px 0 0", fontSize: "var(--text-xs)" }}
                  >
                    Pemeriksaan 5 Butir Kondisi Fisik & Fungsi Saat Kembali
                    (Komparasi Kondisi Awal vs Akhir) & Kejadian
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setSelectedLoan(null)}
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form
                onSubmit={handleSubmitReturn}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  minHeight: 0,
                  overflow: "hidden",
                }}
              >
                <div className="modal-body" ref={returnModalRef}>
              {/* Info keterlambatan pengembalian */}
              {hariTerlambat(selectedLoan) > 0 && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1.5px solid #fecaca",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: "var(--sp-4)",
                    fontSize: "12px",
                    color: "#991b1b",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Clock size={16} style={{ color: "#dc2626", flexShrink: 0 }} />
                  <span>
                    <strong>Terlambat {hariTerlambat(selectedLoan)} hari</strong>{" "}
                    dari rencana tanggal kembali {selectedLoan.rencana_tanggal_kembali}.
                    Keterlambatan dicatat di logbook peralatan.
                  </span>
                </div>
              )}

              {/* Bagian A: Data Identitas Peminjaman */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "12px 14px",
                  marginBottom: "var(--sp-4)",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "#64748b",
                    marginBottom: 8,
                  }}
                >
                  Identitas Peralatan & Peminjaman
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 12,
                    fontSize: "12px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: "11px",
                        display: "block",
                      }}
                    >
                      Kode Peminjaman
                    </span>
                    <strong style={{ color: "#0f172a" }}>
                      {selectedLoan.kode || selectedLoan.id}
                    </strong>
                  </div>
                  <div>
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: "11px",
                        display: "block",
                      }}
                    >
                      Peminjam
                    </span>
                    <strong style={{ color: "#0f172a" }}>
                      {selectedLoan.peminjam?.name ||
                        selectedLoan.peminjam_nama ||
                        "-"}
                    </strong>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      {selectedLoan.tujuan_divisi || "SSA"}
                    </div>
                  </div>
                  <div>
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: "11px",
                        display: "block",
                      }}
                    >
                      Peralatan Laboratorium
                    </span>
                    <strong style={{ color: "#0f172a" }}>
                      {selectedLoan.peralatan?.nama_alat ||
                        selectedLoan.nama_alat}
                    </strong>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      SN:{" "}
                      {selectedLoan.peralatan?.nomor_seri ||
                        selectedLoan.nomor_seri ||
                        "-"}{" "}
                      | Aset:{" "}
                      {selectedLoan.peralatan?.nomor_aset ||
                        selectedLoan.nomor_aset ||
                        "-"}
                    </div>
                  </div>
                  <div>
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: "11px",
                        display: "block",
                      }}
                    >
                      Rencana vs Realisasi Kembali
                    </span>
                    <strong style={{ color: "#0f172a" }}>
                      {selectedLoan.tgl_rencana_kembali || "-"}
                    </strong>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#059669",
                        fontWeight: 600,
                      }}
                    >
                      Dikembalikan: Hari Ini
                    </div>
                  </div>
                </div>
              </div>

              {/* Bagian B: Pemeriksaan Fisik & Fungsi (Tabel Komparasi Keluar vs Kembali) */}
              <div
                ref={returnFormRef}
                style={{ marginBottom: "var(--sp-4)", scrollMarginTop: "16px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#0f172a",
                    }}
                  >
                    Pemeriksaan Kondisi Peralatan (5 Butir
                    Pemeriksaan)
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span
                      style={{
                        fontSize: "11px",
                        background: "#dcfce7",
                        color: "#166534",
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontWeight: 700,
                      }}
                    >
                      {countReturnS} Sesuai (S)
                    </span>
                    {countReturnTS > 0 && (
                      <span
                        style={{
                          fontSize: "11px",
                          background: "#fee2e2",
                          color: "#991b1b",
                          padding: "2px 8px",
                          borderRadius: 10,
                          fontWeight: 700,
                        }}
                      >
                        {countReturnTS} Tidak Sesuai (TS)
                      </span>
                    )}

                  </div>
                </div>

                <div
                  style={{
                    overflowX: "auto",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "11.5px",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "#f1f5f9",
                          borderBottom: "2px solid #cbd5e1",
                          color: "#334155",
                        }}
                      >
                        <th
                          style={{
                            padding: "8px 6px",
                            textAlign: "center",
                            width: "36px",
                            borderRight: "1px solid #cbd5e1",
                          }}
                        >
                          No
                        </th>
                        <th
                          style={{
                            padding: "8px 10px",
                            textAlign: "left",
                            minWidth: "220px",
                            borderRight: "1px solid #cbd5e1",
                          }}
                        >
                          Butir Pemeriksaan
                        </th>
                        <th
                          style={{
                            padding: "8px 10px",
                            textAlign: "left",
                            width: "170px",
                            borderRight: "1px solid #cbd5e1",
                            background: "#fff7ed",
                          }}
                        >
                          <span style={{ color: "#c2410c", fontWeight: 800 }}>
                            Kondisi Saat Keluar
                          </span>
                        </th>
                        <th
                          style={{
                            padding: "8px 8px",
                            textAlign: "center",
                            width: "145px",
                            borderRight: "1px solid #cbd5e1",
                            background: "#f0fdf4",
                          }}
                        >
                          <span style={{ color: "#166534", fontWeight: 800 }}>
                            Kondisi Kembali
                          </span>
                        </th>
                        <th
                          style={{
                            padding: "8px 10px",
                            textAlign: "left",
                            minWidth: "180px",
                          }}
                        >
                          Keterangan / Temuan Saat Kembali
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {LAMPIRAN_A_BUTIR.map((butir, idx) => {
                        const item = returnChecks[idx] || {
                          status: "S",
                          keterangan: "",
                        };
                        const isS = item.status === "S";
                        const isTS = item.status === "TS";

                        // Ambil data serah terima keluar sebagai pembanding
                        const initialKeluar =
                          selectedLoan.serah_terima_keluar ||
                          selectedLoan.serah_terima;
                        const initialItem = initialKeluar?.lampiran_a?.[idx];
                        const initialStatus = initialItem?.status || "S";
                        const initialKet = initialItem?.keterangan || "";

                        return (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: "1px solid #e2e8f0",
                              background: isTS
                                ? "#fff1f2"
                                : idx % 2 === 0
                                  ? "#ffffff"
                                  : "#f8fafc",
                            }}
                          >
                            <td
                              style={{
                                padding: "7px 4px",
                                textAlign: "center",
                                fontWeight: 700,
                                color: "#64748b",
                                borderRight: "1px solid #cbd5e1",
                              }}
                            >
                              {idx + 1}
                            </td>
                            <td
                              style={{
                                padding: "7px 10px",
                                color: "#0f172a",
                                borderRight: "1px solid #cbd5e1",
                                lineHeight: 1.35,
                              }}
                            >
                              {butir}
                              {idx === IDX_KELENGKAPAN &&
                                (selectedLoan.kebutuhan_kelengkapan ||
                                  selectedLoan.kelengkapan) && (
                                  <div
                                    style={{
                                      marginTop: 3,
                                      fontSize: "10px",
                                      color: "#0369a1",
                                      background: "#e0f2fe",
                                      padding: "2px 6px",
                                      borderRadius: 4,
                                      display: "inline-block",
                                    }}
                                  >
                                    Daftar:{" "}
                                    <strong>
                                      {selectedLoan.kebutuhan_kelengkapan ||
                                        selectedLoan.kelengkapan}
                                    </strong>
                                  </div>
                                )}
                            </td>
                            {/* Kolom Pembanding: Kondisi Saat Keluar */}
                            <td
                              style={{
                                padding: "7px 10px",
                                borderRight: "1px solid #cbd5e1",
                                background: "#fffbeb",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  marginBottom: 2,
                                }}
                              >
                                {initialStatus === "S" && (
                                  <span
                                    style={{
                                      fontSize: "10.5px",
                                      background: "#dcfce7",
                                      color: "#166534",
                                      padding: "1px 6px",
                                      borderRadius: 4,
                                      fontWeight: 700,
                                    }}
                                  >
                                    S (Sesuai)
                                  </span>
                                )}
                                {initialStatus === "TS" && (
                                  <span
                                    style={{
                                      fontSize: "10.5px",
                                      background: "#fee2e2",
                                      color: "#991b1b",
                                      padding: "1px 6px",
                                      borderRadius: 4,
                                      fontWeight: 700,
                                    }}
                                  >
                                    TS (Tidak Sesuai)
                                  </span>
                                )}

                              </div>
                              {initialKet && (
                                <div
                                  style={{
                                    fontSize: "10.5px",
                                    color: "#78350f",
                                    fontStyle: "italic",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  &ldquo;{initialKet}&rdquo;
                                </div>
                              )}
                            </td>
                            {/* Kolom Input: Kondisi Saat Kembali */}
                            <td
                              style={{
                                padding: "7px 8px",
                                textAlign: "center",
                                borderRight: "1px solid #cbd5e1",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: 6,
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                <label
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 2,
                                    cursor: "pointer",
                                    fontWeight: isS ? 700 : 400,
                                    color: isS ? "#16a34a" : "#64748b",
                                    fontSize: "11px",
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name={`return_check_${idx}`}
                                    value="S"
                                    checked={isS}
                                    onChange={() => {
                                      const updated = [...returnChecks];
                                      updated[idx] = {
                                        ...updated[idx],
                                        status: "S",
                                      };
                                      setReturnChecks(updated);
                                    }}
                                    style={{ accentColor: "#16a34a" }}
                                  />
                                  S
                                </label>
                                <label
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 2,
                                    cursor: "pointer",
                                    fontWeight: isTS ? 700 : 400,
                                    color: isTS ? "#dc2626" : "#64748b",
                                    fontSize: "11px",
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name={`return_check_${idx}`}
                                    value="TS"
                                    checked={isTS}
                                    onChange={() => {
                                      const updated = [...returnChecks];
                                      updated[idx] = {
                                        ...updated[idx],
                                        status: "TS",
                                      };
                                      setReturnChecks(updated);
                                    }}
                                    style={{ accentColor: "#dc2626" }}
                                  />
                                  TS
                                </label>
                              </div>
                              {isTS && (
                                <div
                                  style={{
                                    fontSize: "9.5px",
                                    color: "#dc2626",
                                    fontWeight: 700,
                                    marginTop: 2,
                                  }}
                                >
                                  ⚠️ Alat Rusak / TS
                                </div>
                              )}
                            </td>
                            {/* Kolom Keterangan */}
                            <td style={{ padding: "7px 10px" }}>
                              <input
                                type="text"
                                value={item.keterangan || ""}
                                onChange={(e) => {
                                  const updated = [...returnChecks];
                                  updated[idx] = {
                                    ...updated[idx],
                                    keterangan: e.target.value,
                                  };
                                  setReturnChecks(updated);
                                }}
                                placeholder={
                                  isTS
                                    ? "Wajib jelaskan ketidaksesuaian/kerusakan..."
                                    : "Catatan kondisi kembali (opsional)..."
                                }
                                required={isTS}
                                style={{
                                  width: "100%",
                                  border: isTS
                                    ? "1.5px solid #f87171"
                                    : "1px solid #cbd5e1",
                                  borderRadius: 4,
                                  padding: "4px 8px",
                                  fontSize: "11px",
                                  background: isTS ? "#fff1f2" : "#ffffff",
                                  outline: "none",
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
                  background: adaKejadian ? "#fff1f2" : "#f8fafc",
                  border: adaKejadian
                    ? "1.5px solid #fecdd3"
                    : "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "12px 14px",
                  marginBottom: "var(--sp-4)",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: adaKejadian ? "#9f1239" : "#0f172a",
                    }}
                  >
                    Kejadian Selama Peminjaman & Tindak Lanjut
                  </div>
                  {adaKejadian && (
                    <span
                      style={{
                        fontSize: "10.5px",
                        background: "#dc2626",
                        color: "#ffffff",
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontWeight: 700,
                      }}
                    >
                      ⚠️ Peralatan Masuk Verifikasi
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    marginBottom: adaKejadian ? 10 : 0,
                  }}
                >
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: !adaKejadian ? 700 : 400,
                      color: !adaKejadian ? "#166534" : "#475569",
                    }}
                  >
                    <input
                      type="radio"
                      name="ada_kejadian_radio"
                      checked={!adaKejadian}
                      onChange={() => {
                        setAdaKejadian(false);
                        setUraianKejadian("");
                        setTanggalKejadian("");
                        setLokasiKejadian(
                          selectedLoan?.lokasi_penggunaan || "",
                        );
                      }}
                      style={{ accentColor: "#16a34a" }}
                    />
                    Tidak Ada Kejadian (Penggunaan Normal)
                  </label>
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: adaKejadian ? 700 : 400,
                      color: adaKejadian ? "#b91c1c" : "#475569",
                    }}
                  >
                    <input
                      type="radio"
                      name="ada_kejadian_radio"
                      checked={adaKejadian}
                      onChange={() => setAdaKejadian(true)}
                      style={{ accentColor: "#dc2626" }}
                    />
                    Ada Kejadian / Kerusakan / Malfungsi Selama Peminjaman
                  </label>
                </div>

                {adaKejadian && (
                  <div style={{ marginTop: 8 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            color: "#9f1239",
                            marginBottom: 4,
                          }}
                        >
                          Tanggal Kejadian{" "}
                          <span style={{ color: "#dc2626" }}>*</span>
                        </label>
                        <input
                          type="date"
                          value={tanggalKejadian}
                          onChange={(e) => setTanggalKejadian(e.target.value)}
                          min={
                            selectedLoan?.tanggal_keluar_aktual
                              ? String(
                                selectedLoan.tanggal_keluar_aktual,
                              ).slice(0, 10)
                              : undefined
                          }
                          max={new Date().toLocaleDateString("en-CA")}
                          required={adaKejadian}
                          style={{
                            width: "100%",
                            border: "1.5px solid #fda4af",
                            borderRadius: 6,
                            padding: "6px 10px",
                            fontSize: "11.5px",
                            background: "#ffffff",
                            outline: "none",
                            color: "#0f172a",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "11.5px",
                            fontWeight: 600,
                            color: "#9f1239",
                            marginBottom: 4,
                          }}
                        >
                          Lokasi Kejadian
                        </label>
                        <input
                          type="text"
                          value={lokasiKejadian}
                          onChange={(e) => setLokasiKejadian(e.target.value)}
                          placeholder={
                            selectedLoan?.lokasi_penggunaan || "Lokasi kejadian"
                          }
                          title="Terisi awal dari lokasi penggunaan pada pengajuan peminjaman, boleh diubah"
                          style={{
                            width: "100%",
                            border: "1.5px solid #fda4af",
                            borderRadius: 6,
                            padding: "6px 10px",
                            fontSize: "11.5px",
                            background: "#ffffff",
                            outline: "none",
                            color: "#0f172a",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        color: "#9f1239",
                        marginBottom: 4,
                      }}
                    >
                      Uraian Kejadian / Kronologi Kerusakan / Gejala Abnormal{" "}
                      <span style={{ color: "#dc2626" }}>* (Wajib Diisi)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={uraianKejadian}
                      onChange={(e) => setUraianKejadian(e.target.value)}
                      placeholder="Jelaskan secara rinci waktu kejadian, gejala abnormal, kesalahan operasi, jatuh, konsleting, atau kendala fisik/fungsi yang terjadi selama peminjaman..."
                      required={adaKejadian}
                      style={{
                        width: "100%",
                        border: "1.5px solid #fda4af",
                        borderRadius: 6,
                        padding: "6px 10px",
                        fontSize: "11.5px",
                        background: "#ffffff",
                        outline: "none",
                        color: "#0f172a",
                        resize: "vertical",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#be123c",
                        marginTop: 4,
                      }}
                    >
                      * Laporan kejadian ini akan tercatat dalam logbook alat
                      dan Penanggung Jawab Laboratorium akan melakukan
                      penanganan lebih lanjut.
                    </div>
                  </div>
                )}
              </div>

              {/* Indikator Reaktif Tindak Lanjut Status Peralatan */}
              {adaKejadian ? (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1.5px solid #f87171",
                    borderRadius: 8,
                    padding: "12px 14px",
                    marginBottom: "var(--sp-4)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <AlertOctagon
                    size={24}
                    style={{ color: "#dc2626", flexShrink: 0, marginTop: 2 }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 800,
                        color: "#991b1b",
                        marginBottom: 2,
                      }}
                    >
                      STATUS AKHIR PERALATAN: KARANTINA (Perlu Verifikasi)
                    </div>
                    <div
                      style={{
                        fontSize: "11.5px",
                        color: "#7f1d1d",
                        lineHeight: 1.4,
                      }}
                    >
                      Terdapat <strong>laporan kejadian selama peminjaman</strong>.
                      Setelah dikonfirmasi, peralatan langsung masuk antrean{" "}
                      <strong>Verifikasi Peralatan</strong> sebelum dapat
                      dipinjam kembali.
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1.5px solid #86efac",
                    borderRadius: 8,
                    padding: "12px 14px",
                    marginBottom: "var(--sp-4)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <CheckCircle2
                    size={24}
                    style={{ color: "#16a34a", flexShrink: 0, marginTop: 2 }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 800,
                        color: "#166534",
                        marginBottom: 2,
                      }}
                    >
                      STATUS AKHIR PERALATAN: AKTIF (Kembali ke Daftar
                      Peralatan)
                    </div>
                    <div
                      style={{
                        fontSize: "11.5px",
                        color: "#14532d",
                        lineHeight: 1.4,
                      }}
                    >
                      Tidak ada kejadian selama peminjaman ({countReturnS}{" "}
                      Sesuai
                      {countReturnTS > 0
                        ? `, ${countReturnTS} Tidak Sesuai dicatat sebagai temuan`
                        : ""}
                      ). Setelah dikonfirmasi, peralatan langsung kembali ke
                      daftar peralatan tanpa verifikasi. Bila peralatan kembali
                      setelah jatuh tempo pemeriksaan, sistem tetap
                      mengarahkannya ke verifikasi.
                    </div>
                  </div>
                </div>
              )}

              {/* Catatan Pengembalian Pengelola */}
              <div
                ref={returnBottomRef}
                style={{ marginBottom: "var(--sp-4)", scrollMarginTop: "16px" }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: 4,
                  }}
                >
                  Catatan Tambahan Pengembalian Pengelola Lab (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={returnCatatan}
                  onChange={(e) => setReturnCatatan(e.target.value)}
                  placeholder="Catatan tambahan mengenai kelengkapan, kebersihan, atau informasi lain saat pengembalian..."
                  style={{
                    width: "100%",
                    border: "1px solid #cbd5e1",
                    borderRadius: 6,
                    padding: "6px 10px",
                    fontSize: "11.5px",
                    background: "#ffffff",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>

              </div>

              {/* Tombol Aksi */}
              <div className="modal-footer verification-review-footer">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    marginRight: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                  onClick={() =>
                    returnModalRef.current?.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    })
                  }
                >
                  ↑ Kembali ke Atas
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                  onClick={() => setSelectedLoan(null)}
                  style={{
                    padding: "8px 20px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn"
                  disabled={isSubmitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 600,
                    background: adaKejadian ? "#dc2626" : "#16a34a",
                    borderColor: adaKejadian ? "#b91c1c" : "#15803d",
                    color: "#ffffff",
                    padding: "8px 20px",
                    fontSize: "13px",
                    borderRadius: "var(--radius-lg, 8px)",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {adaKejadian ? (
                    <AlertOctagon size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {isSubmitting ? "Menyimpan..." : "Konfirmasi Pengembalian"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {/* ==================================================================== */}
      {/* 8. MODAL 8: AJUKAN PERPANJANGAN PEMINJAMAN (OLEH PEMINJAM)            */}
      {/* ==================================================================== */}
      {selectedLoan &&
        modalMode === "extension_request" &&
        createPortal(
          <div
            className="modal-overlay verification-review-overlay"
            role="presentation"
            onClick={() => !isExtensionSubmitting && setSelectedLoan(null)}
          >
            <div
              className="modal modal-lg verification-review-modal"
              style={{ maxWidth: "600px" }}
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="modal-header">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CalendarClock size={20} style={{ color: "#d97706" }} />
                    <h2 className="modal-title">
                      Permohonan Perpanjangan Peminjaman
                    </h2>
                  </div>
                  <p
                    className="page-subtitle"
                    style={{ margin: "4px 0 0", fontSize: "var(--text-xs)" }}
                  >
                    Tiket: {selectedLoan.kode || selectedLoan.id} •{" "}
                    {selectedLoan.peralatan?.nama_peralatan}
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setSelectedLoan(null)}
                  disabled={isExtensionSubmitting}
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <form
                onSubmit={handleSubmitExtensionRequest}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  minHeight: 0,
                  overflow: "hidden",
                }}
              >
                <div className="modal-body">
              {/* Info Peralatan & Tanggal Saat Ini */}
              <div
                style={{
                  padding: "12px 14px",
                  background: "#f8fafc",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  marginBottom: "var(--sp-4)",
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  <div>
                    <span style={{ color: "#64748b" }}>Nomor Aset:</span>
                    <br />
                    <strong>{selectedLoan.peralatan?.nomor_aset || "-"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Lab Pemilik:</span>
                    <br />
                    <strong>
                      {selectedLoan.peralatan?.lab_pemilik || "-"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>
                      Tanggal Mulai Pinjam:
                    </span>
                    <br />
                    <strong>{selectedLoan.rencana_tanggal_keluar}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>
                      Rencana Kembali Saat Ini:
                    </span>
                    <br />
                    <strong style={{ color: "#ea580c" }}>
                      {selectedLoan.rencana_tanggal_kembali}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Tanggal Kembali Baru */}
              <div
                className="form-group"
                style={{ marginBottom: "var(--sp-4)" }}
              >
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Rencana Tanggal Kembali Baru{" "}
                  <span className="required">*</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  min={getMinExtensionDate(selectedLoan)}
                  value={extensionNewDate}
                  onChange={(e) => setExtensionNewDate(e.target.value)}
                  required
                />
                <span
                  className="form-help"
                  style={{ fontSize: "11px", color: "#64748b" }}
                >
                  Minimal tanggal setelah tanggal pengembalian saat ini (
                  {selectedLoan.rencana_tanggal_kembali}).
                </span>
              </div>

              {/* Alasan Perpanjangan */}
              <div
                className="form-group"
                style={{ marginBottom: "var(--sp-5)" }}
              >
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Alasan Permohonan Perpanjangan{" "}
                  <span className="required">*</span>
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

              </div>

              {/* Action Buttons */}
              <div className="modal-footer verification-review-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedLoan(null)}
                  disabled={isExtensionSubmitting}
                  style={{
                    padding: "8px 20px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isExtensionSubmitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 20px",
                    fontSize: "13px",
                    fontWeight: 600,
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
        </div>,
        document.body,
      )}

      {/* ==================================================================== */}
      {/* 9. MODAL 9: TINJAU PERPANJANGAN (OLEH PENGELOLA PERALATAN)           */}
      {/* ==================================================================== */}
      {selectedLoan &&
        modalMode === "extension_review" &&
        (() => {
          const waitingPj = selectedLoan.perpanjangan?.find(
            (p) => p.status === "menunggu",
          );

          return createPortal(
            <div
              className="modal-overlay verification-review-overlay"
              role="presentation"
              onClick={() =>
                !isExtensionDecisionSubmitting && setSelectedLoan(null)
              }
            >
              <div
                className="modal modal-lg verification-review-modal"
                style={{ maxWidth: "640px" }}
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="modal-header">
                  <div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <ShieldCheck size={20} style={{ color: "#ea580c" }} />
                      <h2 className="modal-title">
                        Tinjau Perpanjangan Peminjaman Peralatan
                      </h2>
                    </div>
                    <p
                      className="page-subtitle"
                      style={{ margin: "4px 0 0", fontSize: "var(--text-xs)" }}
                    >
                      Wewenang Pengelola Peralatan • Tiket{" "}
                      {selectedLoan.kode || selectedLoan.id}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="modal-close"
                    onClick={() => setSelectedLoan(null)}
                    disabled={isExtensionDecisionSubmitting}
                    aria-label="Tutup"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body */}
                <form
                  onSubmit={handleSubmitExtensionDecision}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minHeight: 0,
                    overflow: "hidden",
                  }}
                >
                  <div className="modal-body">
                  {/* Box Detail Pengajuan */}
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "#f8fafc",
                      borderRadius: 8,
                      border: "1.5px solid #e2e8f0",
                      marginBottom: "var(--sp-5)",
                      fontSize: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 800,
                            color: "#0f172a",
                            fontSize: "13px",
                          }}
                        >
                          {selectedLoan.peralatan?.nama_peralatan}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          Aset: {selectedLoan.peralatan?.nomor_aset} • Pemilik:{" "}
                          {selectedLoan.peralatan?.lab_pemilik}
                        </div>
                      </div>
                      <span
                        className="badge badge-warning"
                        style={{ fontSize: "11px" }}
                      >
                        Perpanjangan Diajukan
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                        padding: "8px 10px",
                        background: "#ffffff",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <span style={{ color: "#64748b" }}>Peminjam:</span>
                        <br />
                        <strong>
                          {selectedLoan.peminjam?.nama ||
                            selectedLoan.peminjam_nama ||
                            "-"}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b" }}>Diajukan Pada:</span>
                        <br />
                        <strong>
                          {waitingPj?.diajukan_pada
                            ? String(waitingPj.diajukan_pada).slice(0, 10)
                            : "-"}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b" }}>
                          Tanggal Kembali Saat Ini:
                        </span>
                        <br />
                        <strong
                          style={{
                            color: "#64748b",
                            textDecoration: "line-through",
                          }}
                        >
                          {waitingPj?.tanggal_kembali_lama ||
                            selectedLoan.rencana_tanggal_kembali}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b" }}>
                          Rencana Kembali Baru:
                        </span>
                        <br />
                        <strong style={{ color: "#059669", fontSize: "13px" }}>
                          {waitingPj?.tanggal_kembali_baru}
                        </strong>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "8px 10px",
                        background: "#fffbeb",
                        borderRadius: 6,
                        border: "1px solid #fef3c7",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#92400e",
                          marginBottom: 2,
                        }}
                      >
                        Alasan Permohonan Peminjam:
                      </div>
                      <div style={{ color: "#78350f", fontStyle: "italic" }}>
                        "{waitingPj?.alasan}"
                      </div>
                    </div>
                  </div>

                  {/* Pilihan Keputusan */}
                  <div
                    className="form-group"
                    style={{ marginBottom: "var(--sp-3)" }}
                  >
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Keputusan Pengelola Peralatan{" "}
                      <span className="required">*</span>
                    </label>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        id="btn-perpanjangan-setuju"
                        onClick={() => setExtensionDecisionAction("setuju")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 16px",
                          borderRadius: "var(--radius-md, 8px)",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          border:
                            extensionDecisionAction === "setuju"
                              ? "2px solid #16a34a"
                              : "1.5px solid #cbd5e1",
                          background:
                            extensionDecisionAction === "setuju"
                              ? "#f0fdf4"
                              : "#ffffff",
                          color:
                            extensionDecisionAction === "setuju"
                              ? "#15803d"
                              : "#475569",
                          boxShadow:
                            extensionDecisionAction === "setuju"
                              ? "0 1px 3px rgba(22, 163, 74, 0.15)"
                              : "none",
                        }}
                      >
                        <CheckCircle2
                          size={16}
                          style={{
                            color:
                              extensionDecisionAction === "setuju"
                                ? "#16a34a"
                                : "#94a3b8",
                          }}
                        />
                        <span>Setuju</span>
                      </button>

                      <button
                        type="button"
                        id="btn-perpanjangan-tolak"
                        onClick={() => setExtensionDecisionAction("tolak")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 16px",
                          borderRadius: "var(--radius-md, 8px)",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          border:
                            extensionDecisionAction === "tolak"
                              ? "2px solid #dc2626"
                              : "1.5px solid #cbd5e1",
                          background:
                            extensionDecisionAction === "tolak"
                              ? "#fef2f2"
                              : "#ffffff",
                          color:
                            extensionDecisionAction === "tolak"
                              ? "#b91c1c"
                              : "#475569",
                          boxShadow:
                            extensionDecisionAction === "tolak"
                              ? "0 1px 3px rgba(220, 38, 38, 0.15)"
                              : "none",
                        }}
                      >
                        <XCircle
                          size={16}
                          style={{
                            color:
                              extensionDecisionAction === "tolak"
                                ? "#dc2626"
                                : "#94a3b8",
                          }}
                        />
                        <span>Tolak</span>
                      </button>
                    </div>
                  </div>

                  {/* Catatan Keputusan */}
                  <div
                    className="form-group"
                    style={{ marginBottom: "var(--sp-3)" }}
                  >
                    <label className="form-label">
                      {extensionDecisionAction === "setuju"
                        ? "Catatan / Arahan (Opsional)"
                        : "Alasan Penolakan (Wajib)"}
                    </label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder={
                        extensionDecisionAction === "setuju"
                          ? "Catatan pemeriksaan teknis atau instruksi khusus..."
                          : "Uraikan alasan penolakan perpanjangan..."
                      }
                      value={extensionDecisionNote}
                      onChange={(e) => setExtensionDecisionNote(e.target.value)}
                      required={extensionDecisionAction === "tolak"}
                    />
                  </div>

                  </div>

                  {/* Action Buttons */}
                  <div className="modal-footer verification-review-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedLoan(null)}
                      disabled={isExtensionDecisionSubmitting}
                      style={{
                        padding: "8px 20px",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn"
                      disabled={isExtensionDecisionSubmitting}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 20px",
                        fontSize: "13px",
                        fontWeight: 600,
                        background:
                          extensionDecisionAction === "setuju"
                            ? "#16a34a"
                            : "#dc2626",
                        borderColor:
                          extensionDecisionAction === "setuju"
                            ? "#15803d"
                            : "#b91c1c",
                        color: "#ffffff",
                      }}
                    >
                      {isExtensionDecisionSubmitting ? (
                        <>
                          <RefreshCw size={15} className="spin" /> Memproses...
                        </>
                      ) : extensionDecisionAction === "setuju" ? (
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
            </div>,
            document.body,
          );
        })()}
    </div>
  );
}
