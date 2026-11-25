import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileCheck,
  FileText,
  Info,
  Printer,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import WorkflowGuide from "../../shared/components/ui/WorkflowGuide.jsx";
import TableFilters from "../../shared/components/ui/TableFilters.jsx";
import Pagination, { usePagination } from "../../shared/components/ui/Pagination.jsx";
import SignatureField from "../../shared/components/ui/SignatureField.jsx";
import { useToast } from "../../app/providers/ToastContext.jsx";

// Dummy PNG 1x1 transparan untuk tombol bantu isi cepat tanda tangan saat simulasi flow
const DUMMY_SIGNATURE_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export const TRIGGER_OPTIONS = [
  { code: "T1", label: "T1 — Hasil kalibrasi melampaui batas keberterimaan (Out of Tolerance)" },
  { code: "T2", label: "T2 — Hasil verifikasi peralatan (IK/003) dinyatakan Tidak Sesuai (TS)" },
  { code: "T3", label: "T3 — Penyimpangan pada pengecekan antara (Intermediate Check)" },
  { code: "T4", label: "T4 — Kerusakan fisik atau malfungsi saat pengembalian peminjaman (F/010)" },
  { code: "T5", label: "T5 — Keutuhan segel kalibrasi rusak / terbuka tanpa otorisasi" },
  { code: "T6", label: "T6 — Beban berlebih (overload) atau kesalahan pengoperasian di lapangan" },
  { code: "T7", label: "T7 — Hasil uji profisiensi / uji banding antar-laboratorium tidak memuaskan" },
  { code: "T8", label: "T8 — Keluhan pelanggan / keraguan teknis atas validitas hasil pengujian" },
  { code: "T9", label: "T9 — Kondisi lingkungan penyimpanan/penggunaan di luar spesifikasi alat" },
  { code: "T10", label: "T10 — Peringatan / penarikan teknis dari pabrikan atau pembaruan firmware" },
];

export const EVALUATION_QUESTIONS = [
  {
    key: "q1",
    label: "1. Apakah parameter yang menyimpang digunakan langsung pada kegiatan pemakaian/peminjaman ini?",
  },
  {
    key: "q2",
    label: "2. Apakah besar penyimpangan alat melampaui toleransi metode pengujian pada laporan ini?",
  },
  {
    key: "q3",
    label: "3. Apakah ketidakpastian/keabsahan data hasil pengujian pada log ini terpengaruh secara signifikan?",
  },
];

export const REPORT_ACTION_OPTIONS = [
  { value: "AMANDEMEN", label: "Amandemen Laporan" },
  { value: "DITARIK", label: "Ditarik (Recall)" },
  { value: "DIGANTI", label: "Diganti Laporan Baru" },
  { value: "DIUJI_ULANG", label: "Diuji Ulang (Retest)" },
];

export const CAUSE_OPTIONS = [
  {
    value: "Alat",
    label: "Alat",
    desc: "Penyimpangan berasal dari kerusakan atau pergeseran karakteristik teknis peralatan itu sendiri.",
  },
  {
    value: "Personel",
    label: "Personel",
    desc: "Penyimpangan akibat kekeliruan pembacaan, pengaturan, atau pengoperasian oleh personel.",
  },
  {
    value: "Metode",
    label: "Metode",
    desc: "Penyimpangan disebabkan ketidaksesuaian prosedur atau metode pemeriksaan yang diterapkan.",
  },
  {
    value: "Bahan Acuan",
    label: "Bahan Acuan",
    desc: "Penyimpangan berasal dari artefak standar / bahan acuan yang digunakan saat pemeriksaan.",
  },
];

const STATUS_META = {
  TAHAP_2_EVALUASI_LOG: {
    label: "Evaluasi Dampak Log (Pengelola)",
    color: "#b45309",
    bg: "#fef3c7",
    border: "#fde68a",
    stepIndex: 1,
  },
  TAHAP_3_TINDAKAN_LAPORAN: {
    label: "Tindakan Laporan Terdampak",
    color: "#c2410c",
    bg: "#ffedd5",
    border: "#fed7aa",
    stepIndex: 2,
  },
  TAHAP_4_SEBAB_PENYIMPANGAN: {
    label: "Penetapan Sebab Penyimpangan",
    color: "#1d4ed8",
    bg: "#dbeafe",
    border: "#bfdbfe",
    stepIndex: 3,
  },
  TAHAP_5_TINDAK_LANJUT: {
    label: "Keputusan Korektif & Rujukan IK",
    color: "#6d28d9",
    bg: "#ede9fe",
    border: "#ddd6fe",
    stepIndex: 4,
  },
  SELESAI: {
    label: "Selesai Ditinjau",
    color: "#15803d",
    bg: "#dcfce7",
    border: "#bbf7d0",
    stepIndex: 5,
  },
};

const INITIAL_REVIEWS = [
  {
    id: 1,
    kode_tinjauan: "TNJ-2026-001",
    tanggal_masuk: "2026-11-20",
    pemicu_kode: "T2",
    pemicu_detail:
      "Hasil verifikasi berkala (IK/003) menunjukkan penyimpangan +1,8 dB pada frekuensi 13,5 GHz (batas toleransi ±0,5 dB).",
    status_alat: "DO NOT USE",
    status_tinjauan: "TAHAP_2_EVALUASI_LOG",
    peralatan: {
      id: 101,
      nama_peralatan: "Signal Generator Rohde & Schwarz SMB100A",
      nomor_aset: "IQA-SG-004",
      nomor_seri: "SN-140692",
      kategori: "Alat Ukur",
      lab: "Lab IQA",
      ruangan: "IQA-01 — Lab Uji RF",
      tgl_kondisi_normal_terakhir: "2026-11-01",
      tgl_do_not_use: "2026-11-20",
    },
    bukti_verifikasi: {
      kode_verifikasi: "VER-2026-089",
      aktivitas: "A2 —Setelah Kalibrasi",
      tanggal_periksa: "2026-11-20",
      pemeriksa: "Rendy Kamaluddin (Pengelola Lab IQA)",
      ringkasan_temuan:
        "Karakteristik metrologi Output Level pada rentang > 10 GHz tidak memenuhi spesifikasi pabrikan (+1,8 dB > ±0,5 dB). Peralatan diberi label DO NOT USE.",
    },
    usage_logs: [
      {
        id: "LOG-01",
        tanggal: "2026-11-05 s/d 2026-11-07",
        kode_referensi: "PJM-2026-031 / LHU-RF-112",
        peminjam: "Andi Pratama (Lab DES)",
        kegiatan: "Pengujian sensitivitas receiver perangkat CPE 2,4 GHz",
        q1: "Tidak",
        q2: "Tidak",
        q3: "Tidak",
        alasan_tidak_terdampak:
          "Pengujian hanya memakai frekuensi 2,4 GHz yang masih berada dalam batas toleransi (±0,15 dB).",
        tindakan_laporan: "",
      },
      {
        id: "LOG-02",
        tanggal: "2026-11-12 s/d 2026-11-15",
        kode_referensi: "PJM-2026-038 / LHU-RF-119",
        peminjam: "Budi Santoso (Lab IQA)",
        kegiatan: "Pengujian гармониk & respon frekuensi microwave link 13 GHz",
        q1: "Ya",
        q2: "Ya",
        q3: "Belum Diketahui",
        alasan_tidak_terdampak: "",
        tindakan_laporan: "",
      },
      {
        id: "LOG-03",
        tanggal: "2026-11-17 s/d 2026-11-18",
        kode_referensi: "PJM-2026-041 / LHU-RF-124",
        peminjam: "Siti Rahma (Lab SSA)",
        kegiatan: "Karakterisasi redaman kabel koaksial frekuensi tinggi 12–15 GHz",
        q1: "Ya",
        q2: "Belum Diketahui",
        q3: "Ya",
        alasan_tidak_terdampak: "",
        tindakan_laporan: "",
      },
    ],
    evaluasi_ttd_pengelola: "",
    evaluasi_at: "",
    langkah3_dikonfirmasi: false,
    langkah3_at: "",
    sebab_penyimpangan: "",
    tingkat_ketidaksesuaian: "",
    uraian_ketidaksesuaian: "",
    alasan_pelepasan: "",
    do_not_use_dihapus: false,
    keputusan_penyebab_ttd: "",
    keputusan_penyebab_at: "",
    usulan_korektif: "YA",
    alasan_tanpa_korektif: "",
    alat_masih_digunakan: "YA",
    alat_diperbaiki: "YA",
    rujukan_ik: "",
    catatan_manager_review: "",
    selesai_at: "",
  },
  {
    id: 2,
    kode_tinjauan: "TNJ-2026-002",
    tanggal_masuk: "2026-11-19",
    pemicu_kode: "T4",
    pemicu_detail:
      "Dilaporkan kejadian abnormal saat pengembalian peminjaman (F/010): layar indikator berkedip dan pembacaan arus DC tidak stabil.",
    status_alat: "DO NOT USE",
    status_tinjauan: "TAHAP_3_TINDAKAN_LAPORAN",
    peralatan: {
      id: 102,
      nama_peralatan: "Digital Multimeter Keysight 34465A",
      nomor_aset: "DES-MM-012",
      nomor_seri: "MY59001122",
      kategori: "Alat Ukur",
      lab: "Lab DES",
      ruangan: "DES-02 — Lab Uji Kelistrikan",
      tgl_kondisi_normal_terakhir: "2026-11-10",
      tgl_do_not_use: "2026-11-19",
    },
    bukti_verifikasi: {
      kode_verifikasi: "VER-2026-085",
      aktivitas: "A3 — Pengembalian Peminjaman Bermasalah",
      tanggal_periksa: "2026-11-19",
      pemeriksa: "Fajar Nugraha (Pengelola Lab DES)",
      ringkasan_temuan:
        "Fungsi pengukuran arus DC > 2A menunjukkan fluktuasi > 3%. Butir pemeriksaan fungsi awal bernilai TS.",
    },
    usage_logs: [
      {
        id: "LOG-11",
        tanggal: "2026-11-11 s/d 2026-11-13",
        kode_referensi: "PJM-2026-029 / LHU-EL-077",
        peminjam: "Dedi Kurniawan (Lab DES)",
        kegiatan: "Pengukuran tegangan standby modul power supply (mode DCV)",
        q1: "Tidak",
        q2: "Tidak",
        q3: "Tidak",
        alasan_tidak_terdampak: "Hanya menggunakan fungsi tegangan DC (DCV) yang terbukti masih akurat.",
        tindakan_laporan: "",
      },
      {
        id: "LOG-12",
        tanggal: "2026-11-16 s/d 2026-11-18",
        kode_referensi: "PJM-2026-035 / LHU-EL-082",
        peminjam: "Rina Wulandari (Lab IQA)",
        kegiatan: "Pengujian arus konsumsi penuh rectifier 5A",
        q1: "Ya",
        q2: "Ya",
        q3: "Ya",
        alasan_tidak_terdampak: "",
        tindakan_laporan: "DIUJI_ULANG",
      },
    ],
    evaluasi_ttd_pengelola: DUMMY_SIGNATURE_DATA_URL,
    evaluasi_at: "2026-11-19 14:20",
    langkah3_dikonfirmasi: false,
    langkah3_at: "",
    sebab_penyimpangan: "",
    tingkat_ketidaksesuaian: "",
    uraian_ketidaksesuaian: "",
    alasan_pelepasan: "",
    do_not_use_dihapus: false,
    keputusan_penyebab_ttd: "",
    keputusan_penyebab_at: "",
    usulan_korektif: "YA",
    alasan_tanpa_korektif: "",
    alat_masih_digunakan: "YA",
    alat_diperbaiki: "YA",
    rujukan_ik: "",
    catatan_manager_review: "",
    selesai_at: "",
  },
  {
    id: 3,
    kode_tinjauan: "TNJ-2026-003",
    tanggal_masuk: "2026-11-18",
    pemicu_kode: "T3",
    pemicu_detail:
      "Hasil pengecekan antara menunjukkan selisih pembacaan suhu +1,2 °C terhadap termometer standar acuan.",
    status_alat: "DO NOT USE",
    status_tinjauan: "TAHAP_4_SEBAB_PENYIMPANGAN",
    peralatan: {
      id: 103,
      nama_peralatan: "Climatic Chamber Espec PL-3KPH",
      nomor_aset: "IQA-CC-002",
      nomor_seri: "ES-998120",
      kategori: "Alat Bantu",
      lab: "Lab IQA",
      ruangan: "IQA-03 — Lab Uji Lingkungan",
      tgl_kondisi_normal_terakhir: "2026-11-02",
      tgl_do_not_use: "2026-11-18",
    },
    bukti_verifikasi: {
      kode_verifikasi: "VER-2026-081",
      aktivitas: "A4 — Tindak Lanjut Pengecekan Antara",
      tanggal_periksa: "2026-11-18",
      pemeriksa: "Rendy Kamaluddin (Pengelola Lab IQA)",
      ringkasan_temuan:
        "Seluruh log pemakaian sebelumnya menggunakan sensor eksternal terkalibrasi sehingga tidak ada laporan pengujian yang terdampak. Menunggu penetapan sebab penyimpangan.",
    },
    usage_logs: [
      {
        id: "LOG-21",
        tanggal: "2026-11-08 s/d 2026-11-10",
        kode_referensi: "PJM-2026-022 / LHU-ENV-041",
        peminjam: "Dimas Arya (Lab IQA)",
        kegiatan: "Uji ketahanan suhu perangkat ONT pada 40 °C",
        q1: "Tidak",
        q2: "Tidak",
        q3: "Tidak",
        alasan_tidak_terdampak: "Suhu ruang uji dipantau dengan data logger terkalibrasi independen (toleransi ±2 °C).",
        tindakan_laporan: "",
      },
    ],
    evaluasi_ttd_pengelola: DUMMY_SIGNATURE_DATA_URL,
    evaluasi_at: "2026-11-18 11:05",
    langkah3_dikonfirmasi: true,
    langkah3_at: "2026-11-18 11:05 (Otomatis dilewati: 0 log terdampak)",
    sebab_penyimpangan: "Personel",
    tingkat_ketidaksesuaian: "",
    uraian_ketidaksesuaian: "",
    alasan_pelepasan:
      "Penyimpangan saat pengecekan antara disebabkan peletakan probe sensor acuan terlalu dekat dengan hembusan kipas evaporator oleh personel.",
    do_not_use_dihapus: false,
    keputusan_penyebab_ttd: "",
    keputusan_penyebab_at: "",
    usulan_korektif: "TIDAK_PENGECUALIAN",
    alasan_tanpa_korektif: "",
    alat_masih_digunakan: "YA",
    alat_diperbaiki: "TIDAK",
    rujukan_ik: "",
    catatan_manager_review: "",
    selesai_at: "",
  },
  {
    id: 4,
    kode_tinjauan: "TNJ-2026-004",
    tanggal_masuk: "2026-11-15",
    pemicu_kode: "T1",
    pemicu_detail:
      "Sertifikat kalibrasi eksternal melaporkan deviasi redaman optik +0,85 dB pada panjang gelombang 1550 nm.",
    status_alat: "DO NOT USE",
    status_tinjauan: "TAHAP_5_TINDAK_LANJUT",
    peralatan: {
      id: 104,
      nama_peralatan: "Optical Attenuator EXFO FVA-60B",
      nomor_aset: "SSA-OA-007",
      nomor_seri: "EX-772104",
      kategori: "Alat Ukur",
      lab: "Lab SSA",
      ruangan: "SSA-01 — Lab Uji Optik",
      tgl_kondisi_normal_terakhir: "2026-10-25",
      tgl_do_not_use: "2026-11-15",
    },
    bukti_verifikasi: {
      kode_verifikasi: "VER-2026-074",
      aktivitas: "A2 — Setelah Kalibrasi",
      tanggal_periksa: "2026-11-15",
      pemeriksa: "Hendra Wijaya (Pengelola Lab SSA)",
      ringkasan_temuan:
        "Konektor optik internal mengalami degradasi mekanis. Penyebab telah ditetapkan: Alat (Ketidaksesuaian Mayor).",
    },
    usage_logs: [
      {
        id: "LOG-31",
        tanggal: "2026-11-01 s/d 2026-11-03",
        kode_referensi: "PJM-2026-018 / LHU-OPT-053",
        peminjam: "Siti Rahma (Lab SSA)",
        kegiatan: "Pengujian margin daya modul SFP+ 10G pada 1550 nm",
        q1: "Ya",
        q2: "Ya",
        q3: "Ya",
        alasan_tidak_terdampak: "",
        tindakan_laporan: "AMANDEMEN",
      },
    ],
    evaluasi_ttd_pengelola: DUMMY_SIGNATURE_DATA_URL,
    evaluasi_at: "2026-11-15 16:00",
    langkah3_dikonfirmasi: true,
    langkah3_at: "2026-11-16 09:30",
    sebab_penyimpangan: "Alat",
    tingkat_ketidaksesuaian: "Mayor",
    uraian_ketidaksesuaian: "Kerusakan fisik ferrule internal pada port output optik.",
    alasan_pelepasan: "",
    do_not_use_dihapus: false,
    keputusan_penyebab_ttd: DUMMY_SIGNATURE_DATA_URL,
    keputusan_penyebab_at: "2026-11-16 13:45",
    usulan_korektif: "YA",
    alasan_tanpa_korektif: "",
    alat_masih_digunakan: "YA",
    alat_diperbaiki: "YA",
    rujukan_ik: "IK/013 : Perbaikan Peralatan → IK/003 : Verifikasi Peralatan",
    catatan_manager_review: "",
    selesai_at: "",
  },
  {
    id: 5,
    kode_tinjauan: "TNJ-2026-005",
    tanggal_masuk: "2026-11-10",
    pemicu_kode: "T6",
    pemicu_detail: "Input RF mengalami overload daya saat pengujian pemancar daya tinggi.",
    status_alat: "Dihapus (IK/014)",
    status_tinjauan: "SELESAI",
    peralatan: {
      id: 105,
      nama_peralatan: "Spectrum Analyzer Anritsu MS2721B",
      nomor_aset: "IQA-SA-001",
      nomor_seri: "AN-092341",
      kategori: "Alat Ukur",
      lab: "Lab IQA",
      ruangan: "IQA-01 — Lab Uji RF",
      tgl_kondisi_normal_terakhir: "2026-10-15",
      tgl_do_not_use: "2026-11-10",
    },
    bukti_verifikasi: {
      kode_verifikasi: "VER-2026-069",
      aktivitas: "A5 — Pemeriksaan Insidental",
      tanggal_periksa: "2026-11-10",
      pemeriksa: "Rendy Kamaluddin (Pengelola Lab IQA)",
      ringkasan_temuan: "Modul mixer RF pertama terbakar dan suku cadang sudah discontinued dari pabrikan.",
    },
    usage_logs: [
      {
        id: "LOG-41",
        tanggal: "2026-10-20 s/d 2026-10-22",
        kode_referensi: "PJM-2026-011 / LHU-RF-088",
        peminjam: "Budi Santoso (Lab IQA)",
        kegiatan: "Pengukuran emisi spurious perangkat IoT 920 MHz",
        q1: "Tidak",
        q2: "Tidak",
        q3: "Tidak",
        alasan_tidak_terdampak: "Kerusakan overload baru terjadi pada tanggal 10 November 2026.",
        tindakan_laporan: "",
      },
    ],
    evaluasi_ttd_pengelola: DUMMY_SIGNATURE_DATA_URL,
    evaluasi_at: "2026-11-10 15:10",
    langkah3_dikonfirmasi: true,
    langkah3_at: "2026-11-10 15:10 (Otomatis dilewati: 0 log terdampak)",
    sebab_penyimpangan: "Alat",
    tingkat_ketidaksesuaian: "Kritis",
    uraian_ketidaksesuaian: "Kerusakan permanen modul RF front-end dan unit sudah melampaui umur teknis.",
    alasan_pelepasan: "",
    do_not_use_dihapus: false,
    keputusan_penyebab_ttd: DUMMY_SIGNATURE_DATA_URL,
    keputusan_penyebab_at: "2026-11-11 10:00",
    usulan_korektif: "YA",
    alasan_tanpa_korektif: "",
    alat_masih_digunakan: "TIDAK",
    alat_diperbaiki: "TIDAK",
    rujukan_ik: "IK/014 : Penghapusan Peralatan",
    catatan_manager_review:
      "Laporan peninjauan F/011 telah direview dan disetujui. Lanjutkan proses penghapusan aset sesuai IK/014.",
    selesai_at: "2026-11-11 14:30",
  },
];

// Sesuai flowchart: "Terdapat satu jawaban 'Ya' atau 'belum diketahui'?" -> Ya = TERDAMPAK, Tidak = TIDAK TERDAMPAK
function isLogImpacted(log) {
  return [log.q1, log.q2, log.q3].some(
    (ans) => ans === "Ya" || ans === "Belum Diketahui",
  );
}

// Hitung rujukan IK otomatis sesuai percabangan flowchart Tahap 5
function computeRujukanIK(alatMasihDigunakan, alatDiperbaiki) {
  if (alatMasihDigunakan === "TIDAK") {
    return "IK/014 : Penghapusan Peralatan";
  }
  if (alatDiperbaiki === "YA") {
    return "IK/013 : Perbaikan Peralatan → IK/003 : Verifikasi Peralatan";
  }
  return "IK/003 : Verifikasi Peralatan";
}

function getTriggerLabel(code) {
  const found = TRIGGER_OPTIONS.find((t) => t.code === code);
  return found ? found.label : code;
}

export default function EquipmentReviewManagement({ onNavigate }) {
  const { success, error: toastError } = useToast();

  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("SEMUA");
  const [triggerFilter, setTriggerFilter] = useState("SEMUA");

  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [activeTabStage, setActiveTabStage] = useState(2);

  const selectedReview = reviews.find((item) => item.id === selectedReviewId) || null;

  const filteredReviews = reviews.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      item.kode_tinjauan.toLowerCase().includes(q) ||
      item.peralatan.nama_peralatan.toLowerCase().includes(q) ||
      item.peralatan.nomor_aset.toLowerCase().includes(q) ||
      item.peralatan.lab.toLowerCase().includes(q);
    if (!matchSearch) return false;

    if (statusFilter !== "SEMUA" && item.status_tinjauan !== statusFilter) {
      return false;
    }
    if (triggerFilter !== "SEMUA" && item.pemicu_kode !== triggerFilter) {
      return false;
    }
    return true;
  });

  const pagination = usePagination(
    filteredReviews.length,
    `${searchQuery}\u0000${statusFilter}\u0000${triggerFilter}`,
  );
  const paginatedReviews = filteredReviews.slice(
    pagination.startIndex,
    pagination.endIndex,
  );

  function handleOpenModal(review) {
    setSelectedReviewId(review.id);
    const meta = STATUS_META[review.status_tinjauan];
    setActiveTabStage(meta ? Math.min(Math.max(meta.stepIndex + 1, 2), 5) : 2);
  }

  function updateSelectedReview(updater) {
    setReviews((prev) =>
      prev.map((item) => (item.id === selectedReviewId ? updater(item) : item)),
    );
  }

  function handleUpdateLogAnswer(logId, field, value) {
    updateSelectedReview((rev) => ({
      ...rev,
      usage_logs: rev.usage_logs.map((log) =>
        log.id === logId ? { ...log, [field]: value } : log,
      ),
    }));
  }

  // Simpan Tahap 2: Evaluasi Dampak Log Pemakaian & Peminjaman
  function handleSaveStage2() {
    if (!selectedReview) return;

    for (const log of selectedReview.usage_logs) {
      const impacted = isLogImpacted(log);
      if (!impacted && !log.alasan_tidak_terdampak?.trim()) {
        toastError(
          `Alasan wajib diisi untuk log ${log.kode_referensi} yang ditandai TIDAK TERDAMPAK.`,
        );
        return;
      }
    }

    if (!selectedReview.evaluasi_ttd_pengelola) {
      toastError("Tanda tangan Pengelola Peralatan wajib diisi pada lembar evaluasi dampak.");
      return;
    }

    const impactedLogs = selectedReview.usage_logs.filter(isLogImpacted);
    const hasImpacted = impactedLogs.length > 0;
    const nowStr = new Date().toISOString().slice(0, 16).replace("T", " ");

    updateSelectedReview((rev) => ({
      ...rev,
      evaluasi_at: nowStr,
      langkah3_dikonfirmasi: !hasImpacted,
      langkah3_at: hasImpacted
        ? ""
        : `${nowStr} (Otomatis dilewati: tidak ada log terdampak)`,
      status_tinjauan: hasImpacted
        ? "TAHAP_3_TINDAKAN_LAPORAN"
        : "TAHAP_4_SEBAB_PENYIMPANGAN",
    }));

    if (hasImpacted) {
      setActiveTabStage(3);
      success(
        `Evaluasi dampak ditandatangani & notifikasi dikirim ke Manager Lab. Ditemukan ${impactedLogs.length} log TERDAMPAK — lanjut ke Tindakan Laporan.`,
      );
    } else {
      setActiveTabStage(4);
      success(
        "Evaluasi dampak ditandatangani & notifikasi dikirim ke Manager Lab. Tidak ada log TERDAMPAK — langsung lanjut ke Penetapan Sebab Penyimpangan.",
      );
    }
  }

  // Simpan Tahap 3: Tindakan per Laporan yang Terdampak
  function handleSaveStage3() {
    if (!selectedReview) return;
    const impactedLogs = selectedReview.usage_logs.filter(isLogImpacted);

    for (const log of impactedLogs) {
      if (!log.tindakan_laporan) {
        toastError(
          `Pilih tindakan laporan (Amandemen / Ditarik / Diganti / Diuji ulang) untuk ${log.kode_referensi}.`,
        );
        return;
      }
    }

    const nowStr = new Date().toISOString().slice(0, 16).replace("T", " ");
    updateSelectedReview((rev) => ({
      ...rev,
      langkah3_dikonfirmasi: true,
      langkah3_at: nowStr,
      status_tinjauan: "TAHAP_4_SEBAB_PENYIMPANGAN",
    }));

    setActiveTabStage(4);
    success("Tindakan per laporan terdampak dan konfirmasi Manager Lab berhasil dicatat.");
  }

  // Simpan Tahap 4: Penetapan Sebab Penyimpangan
  function handleSaveStage4() {
    if (!selectedReview) return;
    if (!selectedReview.sebab_penyimpangan) {
      toastError("Pilih sebab penyimpangan terlebih dahulu (Alat, Personel, Metode, atau Bahan Acuan).");
      return;
    }

    const isCauseAlat = selectedReview.sebab_penyimpangan === "Alat";
    if (isCauseAlat && !selectedReview.tingkat_ketidaksesuaian) {
      toastError("Tingkat ketidaksesuaian wajib dipilih apabila Penyebab = Alat.");
      return;
    }
    if (!isCauseAlat && !selectedReview.alasan_pelepasan?.trim()) {
      toastError("Alasan pelepasan dan penghapusan status DO NOT USE wajib diisi.");
      return;
    }
    if (!selectedReview.keputusan_penyebab_ttd) {
      toastError("Tanda tangan keputusan penyebab wajib diisi.");
      return;
    }

    const nowStr = new Date().toISOString().slice(0, 16).replace("T", " ");
    updateSelectedReview((rev) => ({
      ...rev,
      do_not_use_dihapus: !isCauseAlat,
      status_alat: !isCauseAlat ? "Aktif (DO NOT USE Dihapus)" : "DO NOT USE",
      keputusan_penyebab_at: nowStr,
      status_tinjauan: "TAHAP_5_TINDAK_LANJUT",
    }));

    setActiveTabStage(5);
    success(
      isCauseAlat
        ? "Keputusan penyebab (Alat) dan tingkat ketidaksesuaian berhasil direkam."
        : "Alasan pelepasan direkam dan status DO NOT USE pada peralatan dihapus.",
    );
  }

  // Simpan Tahap 5: Tindakan Korektif, Rujukan IK, Cetak & Review Manager Lab
  function handleSaveStage5() {
    if (!selectedReview) return;

    if (
      selectedReview.usulan_korektif === "TIDAK_PENGECUALIAN" &&
      !selectedReview.alasan_tanpa_korektif?.trim()
    ) {
      toastError("Alasan tidak perlu tindakan korektif (dengan pengecualian) wajib diisi.");
      return;
    }

    const rujukan = computeRujukanIK(
      selectedReview.alat_masih_digunakan,
      selectedReview.alat_diperbaiki,
    );
    const nowStr = new Date().toISOString().slice(0, 16).replace("T", " ");

    let finalStatusAlat = selectedReview.status_alat;
    if (selectedReview.alat_masih_digunakan === "TIDAK") {
      finalStatusAlat = "Dihapus (IK/014)";
    } else if (selectedReview.alat_diperbaiki === "YA") {
      finalStatusAlat = "Perbaikan (IK/013 → IK/003)";
    } else if (!selectedReview.do_not_use_dihapus) {
      finalStatusAlat = "Menunggu Verifikasi (IK/003)";
    }

    updateSelectedReview((rev) => ({
      ...rev,
      rujukan_ik: rujukan,
      status_alat: finalStatusAlat,
      selesai_at: nowStr,
      status_tinjauan: "SELESAI",
    }));

    success(`Peninjauan ${selectedReview.kode_tinjauan} selesai direview Manager Lab. Rujukan: ${rujukan}`);
  }

  // Cetak Laporan Peninjauan F/011
  function handlePrintReport(review) {
    const impactedCount = review.usage_logs.filter(isLogImpacted).length;
    const rujukan =
      review.rujukan_ik ||
      computeRujukanIK(review.alat_masih_digunakan, review.alat_diperbaiki);

    const win = window.open("", "_blank", "width=920,height=820");
    if (!win) {
      toastError("Pop-up cetak diblokir browser. Izinkan pop-up untuk mencetak laporan F/011.");
      return;
    }

    const rowsHtml = review.usage_logs
      .map((l, idx) => {
        const imp = isLogImpacted(l);
        return `
          <tr>
            <td style="text-align:center">${idx + 1}</td>
            <td><strong>${l.kode_referensi}</strong><br/><span style="font-size:10px;color:#475569">${l.tanggal}</span></td>
            <td>${l.peminjam}<br/><span style="font-size:10px;color:#475569">${l.kegiatan}</span></td>
            <td style="text-align:center">P1: ${l.q1} | P2: ${l.q2} | P3: ${l.q3}</td>
            <td style="text-align:center;font-weight:bold;color:${imp ? "#b91c1c" : "#15803d"}">
              ${imp ? "TERDAMPAK" : "TIDAK TERDAMPAK"}
            </td>
            <td>${imp ? `Tindakan: <strong>${l.tindakan_laporan || "-"}</strong>` : `Alasan: ${l.alasan_tidak_terdampak || "-"}`}</td>
          </tr>
        `;
      })
      .join("");

    win.document.write(`
      <!doctype html>
      <html>
      <head>
        <title>Laporan Peninjauan Peralatan — ${review.kode_tinjauan} (TLKM13/F/011)</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11.5px; color: #0f172a; padding: 24px; }
          h2 { margin: 0 0 4px; color: #991b1b; }
          .sub { font-size: 11px; color: #475569; margin-bottom: 16px; }
          .section { font-weight: bold; background: #f1f5f9; padding: 6px 10px; border-left: 4px solid #e30613; margin: 14px 0 8px; text-transform: uppercase; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; vertical-align: top; }
          th { background: #f8fafc; font-size: 11px; }
        </style>
      </head>
      <body>
        <h2>LEMBAR PENINJAUAN PERALATAN (TLKM13/F/011)</h2>
        <div class="sub">Kode Tinjauan: <strong>${review.kode_tinjauan}</strong> &bull; Tanggal Masuk: ${review.tanggal_masuk} &bull; Status: <strong>${STATUS_META[review.status_tinjauan]?.label || review.status_tinjauan}</strong></div>

        <div class="section">1. Identitas Peralatan & Pemicu Peninjauan</div>
        <table>
          <tr>
            <th width="22%">Nama Peralatan</th><td width="28%">${review.peralatan.nama_peralatan}</td>
            <th width="22%">No. Aset / No. Seri</th><td width="28%">${review.peralatan.nomor_aset} / ${review.peralatan.nomor_seri}</td>
          </tr>
          <tr>
            <th>Laboratorium / Ruangan</th><td>${review.peralatan.lab} (${review.peralatan.ruangan})</td>
            <th>Rentang Evaluasi Log</th><td>${review.peralatan.tgl_kondisi_normal_terakhir} s/d ${review.peralatan.tgl_do_not_use}</td>
          </tr>
          <tr>
            <th>Pemicu (T1–T10)</th><td colspan="3"><strong>${getTriggerLabel(review.pemicu_kode)}</strong><br/>${review.pemicu_detail}</td>
          </tr>
          <tr>
            <th>Bukti Hasil Verifikasi</th><td colspan="3"><strong>${review.bukti_verifikasi.kode_verifikasi} (${review.bukti_verifikasi.aktivitas})</strong> — ${review.bukti_verifikasi.ringkasan_temuan}</td>
          </tr>
        </table>

        <div class="section">2. Evaluasi Dampak Log Pemakaian & Peminjaman (${impactedCount} Terdampak dari ${review.usage_logs.length} Log)</div>
        <table>
          <thead>
            <tr>
              <th width="4%">No</th>
              <th width="18%">No. Referensi & Tanggal</th>
              <th width="26%">Peminjam & Kegiatan</th>
              <th width="18%">Jawaban 3 Pertanyaan</th>
              <th width="14%">Status Dampak</th>
              <th width="20%">Alasan / Tindakan Laporan</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>

        <div class="section">3. Sebab Penyimpangan & Keputusan Tindak Lanjut</div>
        <table>
          <tr>
            <th width="25%">Sebab Penyimpangan</th>
            <td width="25%"><strong>${review.sebab_penyimpangan || "-"}</strong></td>
            <th width="25%">${review.sebab_penyimpangan === "Alat" ? "Tingkat Ketidaksesuaian" : "Status Pelepasan DO NOT USE"}</th>
            <td width="25%">${review.sebab_penyimpangan === "Alat" ? `<strong>${review.tingkat_ketidaksesuaian || "-"}</strong> (${review.uraian_ketidaksesuaian || "-"})` : `DO NOT USE Dihapus — ${review.alasan_pelepasan || "-"}`}</td>
          </tr>
          <tr>
            <th>Usulan Tindakan Korektif</th>
            <td>${review.usulan_korektif === "TIDAK_PENGECUALIAN" ? `Tidak (Dengan Pengecualian): ${review.alasan_tanpa_korektif || "-"}` : "Ya"}</td>
            <th>Rujukan Prosedur (IK)</th>
            <td><strong>${rujukan}</strong></td>
          </tr>
          <tr>
            <th>Catatan Review Manager Lab</th>
            <td colspan="3">${review.catatan_manager_review || "-"}</td>
          </tr>
        </table>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <div className="page-container fade-in-up">
      {/* 1. HEADER HALAMAN */}
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
          <h1 className="page-title" style={{ margin: 0 }}>
            Modul Peninjauan Peralatan (TLKM13/F/011)
          </h1>
          <p className="page-subtitle" style={{ marginTop: 4 }}>
            Evaluasi dampak riwayat pemakaian/peminjaman, penetapan sebab penyimpangan, dan keputusan tindak lanjut peralatan berstatus DO NOT USE.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setReviews(INITIAL_REVIEWS);
              setSelectedReviewId(null);
              success("Data simulasi alur Peninjauan Peralatan (F/011) direset ke kondisi awal.");
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <RotateCcw size={14} /> Reset Data Simulasi
          </button>
        </div>
      </div>

      {/* 2. ALUR PROSES PENINJAUAN — SWIMLANE FLOWCHART */}
      <WorkflowGuide
        title="Alur Proses Peninjauan Peralatan (F/011)"
        description="Ikuti 5 tahapan peninjauan peralatan sejak pemicu DO NOT USE hingga review laporan akhir oleh Manager Lab."
        steps={[
          {
            title: "Deteksi Pemicu (T1–T10)",
            description:
              "Alat dengan pemicu T1–T10 masuk daftar peninjauan (F/011) dan sistem memberi tahu Pengelola.",
          },
          {
            title: "Evaluasi Dampak Log",
            description:
              "Pengelola menjawab 3 pertanyaan pada tiap baris log pemakaian/peminjaman lalu menandatangani.",
          },
          {
            title: "Tindakan Laporan Terdampak",
            description:
              "Jika ada log terdampak, ditetapkan tindakan per laporan (Amandemen, Ditarik, Diganti, Diuji ulang).",
          },
          {
            title: "Penetapan Sebab Penyimpangan",
            description:
              "Menetapkan penyebab (Alat, Personel, Metode, Bahan Acuan) dan keputusan status DO NOT USE.",
          },
          {
            title: "Tindak Lanjut & Review Laporan",
            description:
              "Menentukan tindakan korektif & rujukan IK (IK/014, IK/013, IK/003), cetak laporan, dan review Manager Lab.",
          },
        ]}
      />

      {/* 3. FILTER & PENCARIAN */}
      <TableFilters
        fields={[
          {
            type: "search",
            id: "review-f011-search",
            label: "Cari peralatan",
            placeholder: "Kode tinjauan, nama alat, atau nomor aset...",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
          },
          {
            type: "select",
            id: "review-f011-trigger",
            label: "Pemicu (T1–T10)",
            placeholder: "Semua pemicu",
            placeholderValue: "SEMUA",
            value: triggerFilter,
            onChange: (e) => setTriggerFilter(e.target.value),
            options: TRIGGER_OPTIONS.map((t) => ({
              value: t.code,
              label: t.label,
            })),
          },
          {
            type: "select",
            id: "review-f011-status",
            label: "Tahap Peninjauan",
            placeholder: "Semua tahap",
            placeholderValue: "SEMUA",
            value: statusFilter,
            onChange: (e) => setStatusFilter(e.target.value),
            options: [
              { value: "TAHAP_2_EVALUASI_LOG", label: "Evaluasi Dampak Log (Pengelola)" },
              { value: "TAHAP_3_TINDAKAN_LAPORAN", label: "Tindakan Laporan Terdampak" },
              { value: "TAHAP_4_SEBAB_PENYIMPANGAN", label: "Penetapan Sebab Penyimpangan" },
              { value: "TAHAP_5_TINDAK_LANJUT", label: "Keputusan Korektif & Rujukan IK" },
              { value: "SELESAI", label: "Selesai Ditinjau" },
            ],
          },
        ]}
        actions={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSearchQuery("");
              setTriggerFilter("SEMUA");
              setStatusFilter("SEMUA");
            }}
            title="Reset filter"
            aria-label="Reset filter peninjauan"
          >
            <RotateCcw size={16} />
          </button>
        }
      />

      {/* 5. TABEL DAFTAR PENINJAUAN (F/011) */}
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
                <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                  Kode & Tanggal
                </th>
                <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                  Peralatan
                </th>
                <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                  Pemicu (T1–T10)
                </th>
                <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                  Evaluasi Log
                </th>
                <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                  Penyebab & Rujukan IK
                </th>
                <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                  Status
                </th>
                <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 600, color: "#475569", textAlign: "center" }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedReviews.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "var(--sp-6)",
                      color: "#94a3b8",
                    }}
                  >
                    Tidak ada data peninjauan peralatan yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedReviews.map((rev) => {
                  const meta = STATUS_META[rev.status_tinjauan] || STATUS_META.TAHAP_2_EVALUASI_LOG;
                  const impactedCount = rev.usage_logs.filter(isLogImpacted).length;
                  const isPending = rev.status_tinjauan !== "SELESAI";

                  return (
                    <tr
                      key={rev.id}
                      style={{
                        borderBottom: "1px solid #e2e8f0",
                        background: isPending ? "#fffbeb" : "#ffffff",
                      }}
                    >
                      {/* 1. Kode & Tanggal */}
                      <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>
                          {rev.kode_tinjauan}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: 2 }}>
                          Masuk: {rev.tanggal_masuk}
                        </div>
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: 4,
                            fontSize: "10.5px",
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 6,
                            background: rev.do_not_use_dihapus ? "#dcfce7" : "#fee2e2",
                            color: rev.do_not_use_dihapus ? "#166534" : "#991b1b",
                          }}
                        >
                          {rev.status_alat}
                        </span>
                      </td>

                      {/* 2. Peralatan */}
                      <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "13px" }}>
                          {rev.peralatan.nama_peralatan}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#475569", marginTop: 2 }}>
                          <code>{rev.peralatan.nomor_aset}</code> &bull; SN: {rev.peralatan.nomor_seri}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: 2 }}>
                          {rev.peralatan.lab} ({rev.peralatan.ruangan})
                        </div>
                      </td>

                      {/* 3. Pemicu */}
                      <td style={{ padding: "12px 16px", verticalAlign: "top", maxWidth: 260 }}>
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: "#fef2f2",
                            color: "#b91c1c",
                            border: "1px solid #fecaca",
                            padding: "2px 8px",
                            borderRadius: 6,
                            marginBottom: 4,
                          }}
                        >
                          Pemicu {rev.pemicu_kode}
                        </span>
                        <div style={{ fontSize: "11.5px", color: "#334155", lineHeight: 1.35 }}>
                          {rev.pemicu_detail}
                        </div>
                      </td>

                      {/* 4. Evaluasi Log */}
                      <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>
                          {rev.usage_logs.length} Baris Log Diperiksa
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 10,
                              background: impactedCount > 0 ? "#fee2e2" : "#f1f5f9",
                              color: impactedCount > 0 ? "#b91c1c" : "#64748b",
                            }}
                          >
                            {impactedCount} Terdampak
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 10,
                              background: "#dcfce7",
                              color: "#166534",
                            }}
                          >
                            {rev.usage_logs.length - impactedCount} Tidak Terdampak
                          </span>
                        </div>
                      </td>

                      {/* 5. Penyebab & Rujukan IK */}
                      <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                        <div style={{ fontSize: "12px", color: "#0f172a" }}>
                          Penyebab:{" "}
                          <strong>{rev.sebab_penyimpangan || "Belum ditetapkan"}</strong>
                        </div>
                        <div style={{ fontSize: "11px", color: "#475569", marginTop: 3 }}>
                          Rujukan:{" "}
                          <span style={{ fontWeight: 600, color: "#991b1b" }}>
                            {rev.rujukan_ik || "-"}
                          </span>
                        </div>
                      </td>

                      {/* 6. Status */}
                      <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: "11.5px",
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: 999,
                            color: meta.color,
                            background: meta.bg,
                            border: `1px solid ${meta.border}`,
                          }}
                        >
                          {meta.label}
                        </span>
                      </td>

                      {/* 7. Aksi */}
                      <td style={{ padding: "12px 16px", verticalAlign: "top", textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            alignItems: "center",
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpenModal(rev)}
                            style={{
                              width: "126px",
                              justifyContent: "center",
                              fontSize: "12px",
                              height: "28px",
                            }}
                          >
                            {rev.status_tinjauan === "SELESAI" ? (
                              <>
                                <Eye size={13} /> Detail F/011
                              </>
                            ) : (
                              <>
                                <ClipboardCheck size={13} /> Tinjau Alat
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handlePrintReport(rev)}
                            style={{
                              width: "126px",
                              justifyContent: "center",
                              fontSize: "12px",
                              height: "28px",
                              color: "#1d4ed8",
                              borderColor: "#bfdbfe",
                              background: "#eff6ff",
                              fontWeight: 600,
                            }}
                          >
                            <Printer size={13} /> Cetak F/011
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
        <Pagination
          totalItems={filteredReviews.length}
          currentPage={pagination.currentPage}
          onPageChange={pagination.setCurrentPage}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          totalPages={pagination.totalPages}
        />
      </div>

      {/* 6. MODAL FORMULIR PENINJAUAN PERALATAN (TLKM13/F/011) */}
      {selectedReview &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => setSelectedReviewId(null)}
          >
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "980px",
                width: "96%",
                maxHeight: "92vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Modal Header */}
              <div className="modal-header">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ShieldAlert size={20} style={{ color: "#e30613" }} />
                    <h3 className="modal-title" style={{ margin: 0 }}>
                      Lembar Peninjauan Peralatan — {selectedReview.kode_tinjauan}
                    </h3>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: STATUS_META[selectedReview.status_tinjauan]?.bg,
                        color: STATUS_META[selectedReview.status_tinjauan]?.color,
                      }}
                    >
                      {STATUS_META[selectedReview.status_tinjauan]?.label}
                    </span>
                  </div>
                  <p
                    className="page-subtitle"
                    style={{ margin: "4px 0 0", fontSize: "var(--text-xs)" }}
                  >
                    {selectedReview.peralatan.nama_peralatan} ({selectedReview.peralatan.nomor_aset}) &bull;{" "}
                    {selectedReview.peralatan.lab}
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setSelectedReviewId(null)}
                  aria-label="Tutup"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="modal-body" style={{ overflowY: "auto", padding: "var(--sp-4)" }}>
                {/* Ringkasan Pemicu (T1-T10) & Bukti Hasil Verifikasi */}
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1.5px solid #fecaca",
                    borderRadius: 10,
                    padding: "12px 16px",
                    marginBottom: "var(--sp-4)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        color: "#991b1b",
                        textTransform: "uppercase",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <AlertOctagon size={16} /> Pemicu Peninjauan & Bukti Hasil Verifikasi
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        background: "#ffffff",
                        color: "#991b1b",
                        border: "1px solid #fca5a5",
                        padding: "2px 10px",
                        borderRadius: 6,
                      }}
                    >
                      Status Alat: {selectedReview.status_alat}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: 12,
                      fontSize: "12px",
                    }}
                  >
                    <div
                      style={{
                        background: "#ffffff",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #fee2e2",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                        Pemicu (T1 – T10)
                      </div>
                      <div style={{ fontWeight: 700, color: "#991b1b", marginTop: 2 }}>
                        {getTriggerLabel(selectedReview.pemicu_kode)}
                      </div>
                      <div style={{ color: "#334155", marginTop: 4, lineHeight: 1.4 }}>
                        {selectedReview.pemicu_detail}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#ffffff",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #fee2e2",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                        Bukti Hasil Verifikasi Peralatan
                      </div>
                      <div style={{ fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
                        {selectedReview.bukti_verifikasi.kode_verifikasi} &bull;{" "}
                        {selectedReview.bukti_verifikasi.aktivitas}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: 2 }}>
                        Diperiksa: {selectedReview.bukti_verifikasi.tanggal_periksa} oleh{" "}
                        {selectedReview.bukti_verifikasi.pemeriksa}
                      </div>
                      <div style={{ color: "#334155", marginTop: 4, lineHeight: 1.4 }}>
                        {selectedReview.bukti_verifikasi.ringkasan_temuan}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigasi Tab Langkah Peninjauan (Agar Mudah Menguji Seluruh Cabang Flowchart) */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: "var(--sp-4)",
                    paddingBottom: 10,
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  {[
                    {
                      stage: 2,
                      title: "Evaluasi Dampak Log (Pengelola)",
                      done: Boolean(selectedReview.evaluasi_at),
                    },
                    {
                      stage: 3,
                      title: "Tindakan Laporan Terdampak",
                      done: Boolean(selectedReview.langkah3_dikonfirmasi),
                    },
                    {
                      stage: 4,
                      title: "Sebab Penyimpangan",
                      done: Boolean(selectedReview.keputusan_penyebab_at),
                    },
                    {
                      stage: 5,
                      title: "Tindak Lanjut & Review Laporan",
                      done: selectedReview.status_tinjauan === "SELESAI",
                    },
                  ].map((tab, idx) => {
                    const isActive = activeTabStage === tab.stage;
                    return (
                      <button
                        key={tab.stage}
                        type="button"
                        onClick={() => setActiveTabStage(tab.stage)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 14px",
                          borderRadius: 8,
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          border: isActive
                            ? "1.5px solid #e30613"
                            : "1px solid #cbd5e1",
                          background: isActive
                            ? "#fff5f5"
                            : tab.done
                              ? "#f0fdf4"
                              : "#ffffff",
                          color: isActive
                            ? "#b91c1c"
                            : tab.done
                              ? "#166534"
                              : "#334155",
                        }}
                      >
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            background: isActive
                              ? "#e30613"
                              : tab.done
                                ? "#16a34a"
                                : "#e2e8f0",
                            color: isActive || tab.done ? "#ffffff" : "#475569",
                          }}
                        >
                          {tab.done ? "✓" : idx + 1}
                        </span>
                        {tab.title}
                      </button>
                    );
                  })}
                </div>

                {/* ============================================================== */}
                {/* TAB 2: EVALUASI DAMPAK LOG PEMAKAIAN & PEMINJAMAN              */}
                {/* ============================================================== */}
                {activeTabStage === 2 && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <h4 style={{ margin: 0, fontSize: "14px", color: "#0f172a" }}>
                          Log Pemakaian & Peminjaman Sejak Kondisi Normal Terakhir (
                          {selectedReview.peralatan.tgl_kondisi_normal_terakhir}) hingga DO NOT USE (
                          {selectedReview.peralatan.tgl_do_not_use})
                        </h4>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: 2 }}>
                          Jawab 3 pertanyaan evaluasi pada setiap baris log. Jika terdapat minimal satu jawaban{" "}
                          <strong>&quot;Ya&quot;</strong> atau <strong>&quot;Belum Diketahui&quot;</strong>, sistem otomatis menandai log sebagai{" "}
                          <strong style={{ color: "#b91c1c" }}>TERDAMPAK</strong>.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                      {selectedReview.usage_logs.map((log, index) => {
                        const impacted = isLogImpacted(log);
                        return (
                          <div
                            key={log.id}
                            style={{
                              border: impacted ? "1.5px solid #fca5a5" : "1.5px solid #86efac",
                              background: impacted ? "#fff5f5" : "#f0fdf4",
                              borderRadius: 10,
                              padding: "12px 14px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 8,
                                marginBottom: 10,
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>
                                  #{index + 1} &bull; {log.kode_referensi}
                                </span>
                                <span style={{ fontSize: "12px", color: "#475569", marginLeft: 8 }}>
                                  ({log.tanggal}) &mdash; {log.peminjam}
                                </span>
                                <div style={{ fontSize: "12px", color: "#334155", marginTop: 2 }}>
                                  Kegiatan: <strong>{log.kegiatan}</strong>
                                </div>
                              </div>
                              <span
                                style={{
                                  fontSize: "11.5px",
                                  fontWeight: 800,
                                  padding: "4px 10px",
                                  borderRadius: 999,
                                  background: impacted ? "#dc2626" : "#16a34a",
                                  color: "#ffffff",
                                }}
                              >
                                {impacted ? "TERDAMPAK" : "TIDAK TERDAMPAK"}
                              </span>
                            </div>

                            {/* 3 Pertanyaan per baris log */}
                            <div
                              style={{
                                background: "#ffffff",
                                borderRadius: 8,
                                padding: "10px 12px",
                                border: "1px solid #e2e8f0",
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                              }}
                            >
                              {EVALUATION_QUESTIONS.map((q) => (
                                <div
                                  key={q.key}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: 8,
                                    fontSize: "12px",
                                    paddingBottom: 6,
                                    borderBottom: "1px dashed #e2e8f0",
                                  }}
                                >
                                  <span style={{ color: "#1e293b", flex: 1, minWidth: 240 }}>
                                    {q.label}
                                  </span>
                                  <div style={{ display: "flex", gap: 12 }}>
                                    {["Ya", "Tidak", "Belum Diketahui"].map((opt) => (
                                      <label
                                        key={opt}
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 4,
                                          cursor: "pointer",
                                          fontWeight: log[q.key] === opt ? 700 : 400,
                                          color:
                                            log[q.key] === opt
                                              ? opt === "Tidak"
                                                ? "#15803d"
                                                : "#b91c1c"
                                              : "#475569",
                                        }}
                                      >
                                        <input
                                          type="radio"
                                          name={`${log.id}-${q.key}`}
                                          checked={log[q.key] === opt}
                                          onChange={() =>
                                            handleUpdateLogAnswer(log.id, q.key, opt)
                                          }
                                        />
                                        {opt}
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}

                              {/* Jika TIDAK TERDAMPAK -> Wajib isi alasan sesuai flowchart */}
                              {!impacted && (
                                <div style={{ marginTop: 4 }}>
                                  <label
                                    style={{
                                      display: "block",
                                      fontSize: "11.5px",
                                      fontWeight: 700,
                                      color: "#166534",
                                      marginBottom: 4,
                                    }}
                                  >
                                    Alasan Dinyatakan Tidak Terdampak{" "}
                                    <span style={{ color: "#dc2626" }}>*</span>
                                  </label>
                                  <input
                                    type="text"
                                    className="form-input"
                                    value={log.alasan_tidak_terdampak}
                                    onChange={(e) =>
                                      handleUpdateLogAnswer(
                                        log.id,
                                        "alasan_tidak_terdampak",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Jelaskan alasan teknis mengapa laporan/log pemakaian ini tidak terdampak..."
                                    style={{ fontSize: "12px", padding: "6px 10px" }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Tanda Tangan Lembar Evaluasi Dampak oleh Pengelola Peralatan */}
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #cbd5e1",
                        borderRadius: 10,
                        padding: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#0f172a" }}>
                          Pengesahan Lembar Evaluasi Dampak (Pengelola Peralatan)
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            updateSelectedReview((r) => ({
                              ...r,
                              evaluasi_ttd_pengelola: DUMMY_SIGNATURE_DATA_URL,
                            }))
                          }
                          style={{ fontSize: "11px" }}
                        >
                          Isi Cepat TTD Simulasi
                        </button>
                      </div>
                      <SignatureField
                        label="Tanda Tangan Pengelola Peralatan"
                        value={selectedReview.evaluasi_ttd_pengelola}
                        onChange={(sig) =>
                          updateSelectedReview((r) => ({
                            ...r,
                            evaluasi_ttd_pengelola: sig,
                          }))
                        }
                        savedSignature={DUMMY_SIGNATURE_DATA_URL}
                        onRestore={() =>
                          updateSelectedReview((r) => ({
                            ...r,
                            evaluasi_ttd_pengelola: DUMMY_SIGNATURE_DATA_URL,
                          }))
                        }
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          marginTop: 12,
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleSaveStage2}
                        >
                          <CheckCircle2 size={15} /> Tandatangani Evaluasi Dampak & Kirim Notifikasi ke Manager Lab
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* TAB 3: TINDAKAN PER LAPORAN YANG TERDAMPAK                     */}
                {/* ============================================================== */}
                {activeTabStage === 3 && (
                  <div>
                    {selectedReview.usage_logs.filter(isLogImpacted).length === 0 ? (
                      <div
                        style={{
                          background: "#f0fdf4",
                          border: "1.5px solid #86efac",
                          borderRadius: 10,
                          padding: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <CheckCircle2 size={24} style={{ color: "#16a34a" }} />
                          <div>
                            <div style={{ fontWeight: 700, color: "#166534", fontSize: "13px" }}>
                              Tidak Ada Log / Laporan yang Terdampak
                            </div>
                            <div style={{ fontSize: "12px", color: "#15803d", marginTop: 2 }}>
                              Sesuai percabangan flowchart (&quot;Apakah ada yang TERDAMPAK? = Tidak&quot;), tahap tindakan per laporan otomatis dilewati dan langsung menuju Penetapan Sebab Penyimpangan.
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setActiveTabStage(4)}
                        >
                          Lanjut ke Sebab Penyimpangan <ArrowRight size={14} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h4 style={{ margin: "0 0 4px", fontSize: "14px", color: "#0f172a" }}>
                          Penetapan Tindakan per Laporan yang Terdampak
                        </h4>
                        <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#64748b" }}>
                          Pilih tindakan untuk setiap laporan yang berstatus <strong>TERDAMPAK</strong> (Amandemen, Ditarik, Diganti, atau Diuji ulang), lalu konfirmasi selesai.
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                          {selectedReview.usage_logs
                            .filter(isLogImpacted)
                            .map((log, idx) => (
                              <div
                                key={log.id}
                                style={{
                                  background: "#fff5f5",
                                  border: "1.5px solid #fecaca",
                                  borderRadius: 10,
                                  padding: "12px 14px",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: 12,
                                }}
                              >
                                <div style={{ flex: 1, minWidth: 260 }}>
                                  <div style={{ fontWeight: 700, fontSize: "13px", color: "#991b1b" }}>
                                    Laporan Terdampak #{idx + 1}: {log.kode_referensi}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "#334155", marginTop: 2 }}>
                                    {log.peminjam} &bull; {log.tanggal}
                                  </div>
                                  <div style={{ fontSize: "11.5px", color: "#475569", marginTop: 2 }}>
                                    Kegiatan: {log.kegiatan}
                                  </div>
                                </div>

                                <div style={{ minWidth: 240 }}>
                                  <label
                                    style={{
                                      display: "block",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      color: "#991b1b",
                                      marginBottom: 4,
                                    }}
                                  >
                                    Tindakan atas Laporan <span style={{ color: "#dc2626" }}>*</span>
                                  </label>
                                  <select
                                    className="form-input"
                                    value={log.tindakan_laporan}
                                    onChange={(e) =>
                                      handleUpdateLogAnswer(
                                        log.id,
                                        "tindakan_laporan",
                                        e.target.value,
                                      )
                                    }
                                    style={{ fontSize: "12px", padding: "6px 10px" }}
                                  >
                                    <option value="">-- Pilih Tindakan Laporan --</option>
                                    {REPORT_ACTION_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSaveStage3}
                          >
                            <CheckCircle2 size={15} /> Konfirmasi Tindakan Laporan Selesai
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ============================================================== */}
                {/* TAB 4: PENETAPAN SEBAB PENYIMPANGAN & STATUS DO NOT USE        */}
                {/* ============================================================== */}
                {activeTabStage === 4 && (
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: "14px", color: "#0f172a" }}>
                      Penetapan Sebab Penyimpangan
                    </h4>
                    <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#64748b" }}>
                      Pilih sumber penyebab penyimpangan. Sesuai flowchart: jika <strong>Penyebab = Alat</strong> maka isi tingkat ketidaksesuaian; jika <strong>bukan Alat</strong> maka isi alasan pelepasan dan status <strong>DO NOT USE</strong> dihapus.
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 10,
                        marginBottom: 16,
                      }}
                    >
                      {CAUSE_OPTIONS.map((item) => {
                        const selected = selectedReview.sebab_penyimpangan === item.value;
                        return (
                          <div
                            key={item.value}
                            onClick={() =>
                              updateSelectedReview((r) => ({
                                ...r,
                                sebab_penyimpangan: item.value,
                              }))
                            }
                            style={{
                              padding: "12px",
                              borderRadius: 10,
                              cursor: "pointer",
                              border: selected
                                ? "2px solid #e30613"
                                : "1px solid #cbd5e1",
                              background: selected ? "#fff5f5" : "#ffffff",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                fontWeight: 700,
                                fontSize: "13px",
                                color: selected ? "#b91c1c" : "#0f172a",
                              }}
                            >
                              <span>Penyebab: {item.label}</span>
                              <input
                                type="radio"
                                checked={selected}
                                onChange={() => {}}
                              />
                            </div>
                            <div
                              style={{
                                fontSize: "11.5px",
                                color: "#475569",
                                marginTop: 4,
                                lineHeight: 1.35,
                              }}
                            >
                              {item.desc}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Percabangan Flowchart: Penyebab = Alat? */}
                    {selectedReview.sebab_penyimpangan === "Alat" && (
                      <div
                        style={{
                          background: "#fff5f5",
                          border: "1.5px solid #fecaca",
                          borderRadius: 10,
                          padding: "14px",
                          marginBottom: 16,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12.5px",
                            fontWeight: 700,
                            color: "#991b1b",
                            marginBottom: 10,
                          }}
                        >
                          Cabang Flowchart: Penyebab = Alat (Status DO NOT USE Tetap Berlaku)
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: 12,
                          }}
                        >
                          <div>
                            <label
                              style={{
                                display: "block",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#0f172a",
                                marginBottom: 4,
                              }}
                            >
                              Tingkat Ketidaksesuaian <span style={{ color: "#dc2626" }}>*</span>
                            </label>
                            <select
                              className="form-input"
                              value={selectedReview.tingkat_ketidaksesuaian}
                              onChange={(e) =>
                                updateSelectedReview((r) => ({
                                  ...r,
                                  tingkat_ketidaksesuaian: e.target.value,
                                }))
                              }
                              style={{ fontSize: "12px" }}
                            >
                              <option value="">-- Pilih Tingkat Ketidaksesuaian --</option>
                              <option value="Minor">Minor (Penyimpangan kecil / dapat dikoreksi faktor koreksi)</option>
                              <option value="Mayor">Mayor (Melampaui batas toleransi fungsi utama)</option>
                              <option value="Kritis">Kritis (Kerusakan perangkat keras / tidak layak pakai)</option>
                            </select>
                          </div>
                          <div>
                            <label
                              style={{
                                display: "block",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#0f172a",
                                marginBottom: 4,
                              }}
                            >
                              Uraian Teknis Ketidaksesuaian Alat
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              value={selectedReview.uraian_ketidaksesuaian}
                              onChange={(e) =>
                                updateSelectedReview((r) => ({
                                  ...r,
                                  uraian_ketidaksesuaian: e.target.value,
                                }))
                              }
                              placeholder="Uraian komponen atau parameter alat yang mengalami ketidaksesuaian..."
                              style={{ fontSize: "12px" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedReview.sebab_penyimpangan &&
                      selectedReview.sebab_penyimpangan !== "Alat" && (
                        <div
                          style={{
                            background: "#f0fdf4",
                            border: "1.5px solid #86efac",
                            borderRadius: 10,
                            padding: "14px",
                            marginBottom: 16,
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12.5px",
                              fontWeight: 700,
                              color: "#166534",
                              marginBottom: 6,
                            }}
                          >
                            Cabang Flowchart: Penyebab Bukan Alat ({selectedReview.sebab_penyimpangan}) — Status DO NOT USE Dihapus
                          </div>
                          <label
                            style={{
                              display: "block",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#14532d",
                              marginBottom: 4,
                            }}
                          >
                            Alasan Pelepasan & Penghapusan Status DO NOT USE{" "}
                            <span style={{ color: "#dc2626" }}>*</span>
                          </label>
                          <textarea
                            rows={2}
                            className="form-input"
                            value={selectedReview.alasan_pelepasan}
                            onChange={(e) =>
                              updateSelectedReview((r) => ({
                                ...r,
                                alasan_pelepasan: e.target.value,
                              }))
                            }
                            placeholder="Jelaskan bukti bahwa peralatan dalam kondisi baik dan penyimpangan murni berasal dari faktor non-alat..."
                            style={{ fontSize: "12px" }}
                          />
                        </div>
                      )}

                    {/* Tanda Tangan Keputusan Penyebab */}
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #cbd5e1",
                        borderRadius: 10,
                        padding: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#0f172a" }}>
                          Pengesahan Keputusan Penyebab Penyimpangan
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            updateSelectedReview((r) => ({
                              ...r,
                              keputusan_penyebab_ttd: DUMMY_SIGNATURE_DATA_URL,
                            }))
                          }
                          style={{ fontSize: "11px" }}
                        >
                          Isi Cepat TTD Simulasi
                        </button>
                      </div>
                      <SignatureField
                        label="Tanda Tangan Keputusan Penyebab"
                        value={selectedReview.keputusan_penyebab_ttd}
                        onChange={(sig) =>
                          updateSelectedReview((r) => ({
                            ...r,
                            keputusan_penyebab_ttd: sig,
                          }))
                        }
                        savedSignature={DUMMY_SIGNATURE_DATA_URL}
                        onRestore={() =>
                          updateSelectedReview((r) => ({
                            ...r,
                            keputusan_penyebab_ttd: DUMMY_SIGNATURE_DATA_URL,
                          }))
                        }
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleSaveStage4}
                        >
                          <CheckCircle2 size={15} /> Rekam Keputusan Penyebab & Lanjut ke Tindak Lanjut
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* TAB 5: TINDAK LANJUT KOREKTIF, RUJUKAN IK & REVIEW MANAGER LAB */}
                {/* ============================================================== */}
                {activeTabStage === 5 && (
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: "14px", color: "#0f172a" }}>
                      Keputusan Tindakan Korektif, Rujukan Prosedur (IK), & Review Laporan
                    </h4>
                    <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#64748b" }}>
                      Tentukan usulan tindakan korektif dan status kelanjutan penggunaan peralatan untuk menetapkan prosedur tindak lanjut secara otomatis.
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: 14,
                        marginBottom: 16,
                      }}
                    >
                      {/* Diamond 1: Mengusulkan tindakan korektif? */}
                      <div
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: 10,
                          padding: "12px 14px",
                        }}
                      >
                        <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                          1. Mengusulkan Tindakan Korektif?
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "12px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                            <input
                              type="radio"
                              checked={selectedReview.usulan_korektif === "YA"}
                              onChange={() =>
                                updateSelectedReview((r) => ({ ...r, usulan_korektif: "YA" }))
                              }
                            />
                            <strong>Ya</strong> — Usulkan tindakan korektif
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                            <input
                              type="radio"
                              checked={selectedReview.usulan_korektif === "TIDAK_PENGECUALIAN"}
                              onChange={() =>
                                updateSelectedReview((r) => ({
                                  ...r,
                                  usulan_korektif: "TIDAK_PENGECUALIAN",
                                }))
                              }
                            />
                            <strong>Tidak (Dengan Pengecualian)</strong>
                          </label>
                        </div>

                        {selectedReview.usulan_korektif === "TIDAK_PENGECUALIAN" && (
                          <div style={{ marginTop: 10 }}>
                            <label
                              style={{
                                display: "block",
                                fontSize: "11.5px",
                                fontWeight: 700,
                                color: "#991b1b",
                                marginBottom: 4,
                              }}
                            >
                              Alasan Tidak Perlu Tindakan Korektif <span style={{ color: "#dc2626" }}>*</span>
                            </label>
                            <textarea
                              rows={2}
                              className="form-input"
                              value={selectedReview.alasan_tanpa_korektif}
                              onChange={(e) =>
                                updateSelectedReview((r) => ({
                                  ...r,
                                  alasan_tanpa_korektif: e.target.value,
                                }))
                              }
                              placeholder="Jelaskan alasan pengecualian mengapa tidak diperlukan tindakan korektif..."
                              style={{ fontSize: "12px" }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Diamond 2 & 3: Apakah alat masih digunakan? -> Apakah alat diperbaiki? */}
                      <div
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: 10,
                          padding: "12px 14px",
                        }}
                      >
                        <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                          2. Apakah Alat Masih Digunakan?
                        </div>
                        <div style={{ display: "flex", gap: 16, fontSize: "12px", marginBottom: 12 }}>
                          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                            <input
                              type="radio"
                              checked={selectedReview.alat_masih_digunakan === "YA"}
                              onChange={() =>
                                updateSelectedReview((r) => ({
                                  ...r,
                                  alat_masih_digunakan: "YA",
                                }))
                              }
                            />
                            <strong>Ya (Masih Digunakan)</strong>
                          </label>
                          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                            <input
                              type="radio"
                              checked={selectedReview.alat_masih_digunakan === "TIDAK"}
                              onChange={() =>
                                updateSelectedReview((r) => ({
                                  ...r,
                                  alat_masih_digunakan: "TIDAK",
                                }))
                              }
                            />
                            <strong>Tidak (Hapus Peralatan)</strong>
                          </label>
                        </div>

                        {selectedReview.alat_masih_digunakan === "YA" && (
                          <div
                            style={{
                              paddingTop: 10,
                              borderTop: "1px dashed #cbd5e1",
                            }}
                          >
                            <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                              3. Apakah Alat Diperbaiki Terlebih Dahulu?
                            </div>
                            <div style={{ display: "flex", gap: 16, fontSize: "12px" }}>
                              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                                <input
                                  type="radio"
                                  checked={selectedReview.alat_diperbaiki === "YA"}
                                  onChange={() =>
                                    updateSelectedReview((r) => ({
                                      ...r,
                                      alat_diperbaiki: "YA",
                                    }))
                                  }
                                />
                                <strong>Ya (Perlu Perbaikan)</strong>
                              </label>
                              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                                <input
                                  type="radio"
                                  checked={selectedReview.alat_diperbaiki === "TIDAK"}
                                  onChange={() =>
                                    updateSelectedReview((r) => ({
                                      ...r,
                                      alat_diperbaiki: "TIDAK",
                                    }))
                                  }
                                />
                                <strong>Tidak (Langsung Verifikasi)</strong>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Kotak Hasil Keputusan Rujukan IK Otomatis */}
                    <div
                      style={{
                        background: "#fff5f5",
                        border: "1.5px solid #fca5a5",
                        borderRadius: 10,
                        padding: "12px 16px",
                        marginBottom: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#991b1b", textTransform: "uppercase" }}>
                          Keputusan Rujukan Prosedur (Sesuai Flowchart)
                        </div>
                        <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                          {computeRujukanIK(
                            selectedReview.alat_masih_digunakan,
                            selectedReview.alat_diperbaiki,
                          )}
                        </div>
                      </div>
                      {selectedReview.alat_masih_digunakan === "YA" && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSelectedReviewId(null);
                            onNavigate?.("/verifikasi");
                          }}
                          style={{ fontSize: "12px" }}
                        >
                          Buka Modul Verifikasi (IK/003) <ArrowRight size={13} />
                        </button>
                      )}
                    </div>

                    {/* Catatan Review Laporan oleh Manager Lab */}
                    <div style={{ marginBottom: 14 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#0f172a",
                          marginBottom: 4,
                        }}
                      >
                        Catatan Review Laporan Akhir (Manager Lab)
                      </label>
                      <textarea
                        rows={2}
                        className="form-input"
                        value={selectedReview.catatan_manager_review}
                        onChange={(e) =>
                          updateSelectedReview((r) => ({
                            ...r,
                            catatan_manager_review: e.target.value,
                          }))
                        }
                        placeholder="Catatan persetujuan / arahan Manager Lab setelah mereview laporan peninjauan F/011..."
                        style={{ fontSize: "12px" }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handlePrintReport(selectedReview)}
                        style={{
                          color: "#1d4ed8",
                          borderColor: "#bfdbfe",
                          background: "#eff6ff",
                          fontWeight: 600,
                        }}
                      >
                        <Printer size={15} /> Cetak Laporan F/011
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSaveStage5}
                      >
                        <CheckCircle2 size={15} /> Konfirmasi Review Manager Lab & Selesai
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer verification-review-footer">
                <div style={{ fontSize: "11.5px", color: "#64748b", marginRight: "auto" }}>
                  Formulir: <strong>TLKM13/F/011</strong> &bull; Klik tab tahapan di atas untuk mengecek simulasi setiap langkah flowchart.
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedReviewId(null)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
