export const INITIAL_SCHEDULE_FORM = {
  peralatan_id: "",
  jenis_utama: "kalibrasi",
  frekuensi_penggunaan: "sedang",
  interval_utama: "",
  interval_tambahan: "",
  tanggal_terakhir: "",
  metode: "",
  nomor_dokumen: "",
  alat_standar_benda_uji: "",
  jenis_pemeliharaan: "",
  pic: "",
  keterangan: "",
};

const DATE_OPTIONS = { year: "numeric", month: "short", day: "numeric" };

export function formatDate(value) {
  const dateValue = String(value || "").slice(0, 10);
  if (!dateValue) return "–";
  const date = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "–"
    : date.toLocaleDateString("id-ID", DATE_OPTIONS);
}

export function getTodayInputValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

export function getScheduleLabel(schedule) {
  const typeLabels = {
    kalibrasi: "Kalibrasi",
    verifikasi_fungsi: "Verifikasi Fungsi",
    pengecekan_antara: "Pengecekan Antara",
    pemeliharaan: "Pemeliharaan",
  };
  return typeLabels[schedule.jenis_jadwal] || schedule.jenis_jadwal || "–";
}

export function getDueStatus(value) {
  if (!value) return { label: "Belum ada tanggal", className: "badge-gray" };
  const dueDate = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(dueDate.getTime())) {
    return { label: "Tanggal tidak valid", className: "badge-gray" };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
  if (days < 0) {
    return {
      label: `Terlambat ${Math.abs(days)} hari`,
      className: "badge-rusak",
    };
  }
  if (days <= 30) {
    return {
      label: days === 0 ? "Jatuh tempo hari ini" : `${days} hari lagi`,
      className: "badge-kalibrasi",
    };
  }
  return { label: "Terjadwal", className: "badge-aktif" };
}
