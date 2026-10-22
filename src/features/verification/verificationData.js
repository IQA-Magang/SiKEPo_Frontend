/* Shared verification criteria, labels, and helpers. */

import { getEquipmentLabId } from "../../shared/services/api.js";

export const CHECKS = [
  "identitas",
  "kelengkapan",
  "firmware",
  "kondisi_fisik",
  "segel",
  "fungsi_awal",
  "metrologi",
  "sertifikat",
];

export const CHECK_LABELS = {
  identitas: "Identitas alat (merek, tipe/model, nomor seri)",
  kelengkapan: "Kelengkapan aksesori dan manual",
  firmware: "Versi peranti lunak/firmware",
  kondisi_fisik: "kondisi fisik",
  segel: "Keutuhan segel",
  fungsi_awal: "Fungsi awal",
  metrologi: "Karakteristik metrologi",
  sertifikat: "Sertifikat kalibrasi",
};

export const ACTIVITY_OPTIONS = [
  ["A1", "Penerimaan alat baru"],
  ["A2", "Setelah kalibrasi"],
  ["A3", "Setelah dipinjam/dipindah/disewa"],
  ["A4", "Setelah pemeliharaan"],
  ["A5", "Pengecekan antara/Verifikasi fungsi"],
];

export const ACTIVITY_REQUIREMENTS = {
  A1: {
    identitas: "W",
    kelengkapan: "W",
    firmware: "K",
    kondisi_fisik: "W",
    segel: "W",
    fungsi_awal: "W",
    metrologi: "W",
    sertifikat: "W",
  },
  A2: {
    identitas: "W",
    kelengkapan: "K",
    firmware: "K",
    kondisi_fisik: "W",
    segel: "W",
    fungsi_awal: "W",
    metrologi: "K",
    sertifikat: "W",
  },
  A3: {
    identitas: "W",
    kelengkapan: "-",
    firmware: "K",
    kondisi_fisik: "W",
    segel: "W",
    fungsi_awal: "-",
    metrologi: "K",
    sertifikat: "-",
  },
  A4: {
    identitas: "W",
    kelengkapan: "-",
    firmware: "W",
    kondisi_fisik: "W",
    segel: "W",
    fungsi_awal: "W",
    metrologi: "-",
    sertifikat: "-",
  },
  A5: {
    identitas: "W",
    kelengkapan: "K",
    firmware: "W",
    kondisi_fisik: "W",
    segel: "W",
    fungsi_awal: "W",
    metrologi: "K",
    sertifikat: "W",
  },
};

export const FOLLOW_UP_OPTIONS = [
  "Dapat Digunakan - Perbarui Daftar Peralatan",
  "Tidak Dapat Digunakan - Masuk Peralatan dalam Masa Peninjauan",
];

export function isMetrologyApplicable(equipment) {
  return String(equipment?.nomor_aset || "")
    .trim()
    .toUpperCase()
    .startsWith("KAL");
}

export function getActivityLabel(code) {
  return (
    ACTIVITY_OPTIONS.find(([activityCode]) => activityCode === code)?.[1] ||
    "Aktivitas peralatan"
  );
}

export function getEquipmentKeterangan(equipment) {
  if (equipment?.status_verifikasi === "Ditolak") {
    return "Perlu verifikasi ulang";
  }
  if (equipment?.status_verifikasi === "Diajukan") {
    return "Menunggu persetujuan Manager";
  }
  if (equipment?.status_verifikasi !== "Disetujui") {
    return "Menunggu verifikasi";
  }

  switch (equipment?.status_alat) {
    case "Aktif":
      return "Masuk inventaris";
    case "Dalam Kalibrasi":
      return "Sedang dikalibrasi";
    case "Dipinjam":
      return "Sedang dipinjam";
    case "Rusak":
      return "Dalam kondisi rusak";
    case "Karantina":
      return "Dalam karantina";
    default:
      return equipment?.status_alat || "Masuk inventaris";
  }
}

export function isEquipmentInUserLab(equipment, roomsById, userLabId) {
  if (userLabId == null) return false;
  const roomLabId = getEquipmentLabId(equipment, roomsById);

  return roomLabId != null && String(roomLabId) === String(userLabId);
}


export const emptyForm = () => ({
  id_peralatan: "",
  tanggal_verifikasi: new Date().toISOString().slice(0, 10),
  kode_aktivitas: "A1",
  tindak_lanjut: "Masuk layanan - label diperbarui",
  catatan: "",
  acuan_kriteria: "",
  nomor_sertifikat: "",
  penyedia_kalibrasi: "",
  berlaku_sampai: "",
  nilai_koreksi: "T Tidak diterapkan",
  firmware_versi_aktual: "",
  tb_alasan: {},
  ts_alasan: {},
  hasil_verifikasi: Object.fromEntries(CHECKS.map((key) => [key, ""])),
});
