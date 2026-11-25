const LOG_STATUS_LABELS = {
  MENUNGGU_MANAGER_PEMINJAM: "Menunggu Atasan Peminjam",
  MENUNGGU_PENGELOLA: "Menunggu Review Pengelola",
  MENUNGGU_MANAGER_LAB: "Menunggu Manager Lab",
  MENUNGGU_SERAH_TERIMA: "Disetujui (Cek Pengelola)",
  DISETUJUI: "Disetujui",
  SIAP_DISERAHKAN: "Siap Diserahkan",
  SEDANG_DIPINJAM: "Sedang Dipinjam",
  DIKEMBALIKAN: "Dikembalikan",
  DIBATALKAN_TS: "Dibatalkan (Ada TS)",
  DITOLAK: "Ditolak",
  KADALUARSA: "Kadaluarsa",
  TAHAP_2_EVALUASI_LOG: "Evaluasi Log",
  TAHAP_3_TINDAKAN_LAPORAN: "Tindakan Laporan",
  TAHAP_4_SEBAB_PENYIMPANGAN: "Sebab Penyimpangan",
  TAHAP_5_TINDAK_LANJUT: "Tindak Lanjut",
  MENUNGGU_REVIEW_MANAGER: "Menunggu Review Manager",
  SELESAI: "Selesai",
};

/**
 * Mengubah kode status logbook backend (mis. SEDANG_DIPINJAM) menjadi label rapi.
 */
export function formatLogStatusLabel(status) {
  const raw = String(status ?? "").trim();
  if (!raw || raw === "—" || raw === "-") return raw || "—";
  if (LOG_STATUS_LABELS[raw]) return LOG_STATUS_LABELS[raw];

  const upper = raw.toUpperCase();
  if (LOG_STATUS_LABELS[upper]) return LOG_STATUS_LABELS[upper];

  if (/^[A-Z0-9_]+$/.test(raw)) {
    return raw
      .toLowerCase()
      .split("_")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return raw;
}

/**
 * Menentukan class badge CSS untuk status entri logbook peralatan.
 */
export function getLogStatusBadgeClass(status) {
  const raw = String(status ?? "").trim();
  const upper = raw.toUpperCase();

  if (
    ["DISETUJUI", "DIKEMBALIKAN", "SEDANG_DIPINJAM", "SELESAI"].includes(upper) ||
    ["Disetujui", "Divalidasi", "Selesai", "Aktif", "Aktif Kembali"].includes(raw)
  ) {
    return "badge-aktif";
  }

  if (
    ["DITOLAK", "KADALUARSA", "DIBATALKAN_TS"].includes(upper) ||
    ["Ditolak", "Dibatalkan", "Hentikan", "Tidak Aktif"].includes(raw)
  ) {
    return "badge-rusak";
  }

  return "badge-kalibrasi";
}
