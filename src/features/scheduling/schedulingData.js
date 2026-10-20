export const INITIAL_SCHEDULE_FORM = {
  peralatan_id: "",
  jenis_utama: "",
  frekuensi_penggunaan: "",
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

export function getDaysUntilDue(value) {
  const dateValue = String(value || "").slice(0, 10);
  if (!dateValue) return null;

  const dueDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(dueDate.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
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

export function getFrequencyLabel(value) {
  const labels = {
    tinggi: "Tinggi",
    sedang: "Sedang",
    rendah: "Rendah",
  };
  const frequency = String(value || "").trim().toLowerCase();
  return labels[frequency] || value || "Belum diatur";
}

export function getScheduleRole(schedule) {
  if (schedule.peran_jadwal === "tambahan" || schedule.peran_jadwal === "utama") {
    return schedule.peran_jadwal;
  }
  return ["pengecekan_antara", "pemeliharaan"].includes(schedule.jenis_jadwal)
    ? "tambahan"
    : "utama";
}

const SCHEDULE_STATUS = {
  late: { label: "Terlambat", className: "schedule-status--late", needsAction: true },
  urgent: { label: "Mendesak", className: "schedule-status--urgent", needsAction: true },
  soon: { label: "Mendekati jatuh tempo", className: "schedule-status--soon", needsAction: true },
  unset: { label: "Belum diatur", className: "schedule-status--unset", needsAction: true },
  safe: { label: "Aman", className: "schedule-status--safe", needsAction: false },
};

export function getScheduleStatus(schedule) {
  const days = getDaysUntilDue(schedule.tanggal_jatuh_tempo);
  if (days === null || !Number(schedule.interval_bulan)) return "unset";
  if (days < 0) return "late";
  if (days <= 30) return "urgent";
  if (days <= 90) return "soon";
  return "safe";
}

export function getScheduleStatusInfo(status) {
  return SCHEDULE_STATUS[status] || SCHEDULE_STATUS.unset;
}

export function getScheduleStatusOrder(status) {
  return ["late", "urgent", "soon", "unset", "safe"].indexOf(status);
}

export function getEquipmentStatusInfo(value) {
  const status = String(value || "").trim();
  const normalized = status.toLowerCase();
  if (!status) {
    return { label: "Belum tersedia", className: "is-unknown" };
  }
  if (normalized === "aktif") {
    return { label: status, className: "is-ready" };
  }
  if (normalized === "dipinjam") {
    return { label: "Dipinjam", className: "is-loaned" };
  }
  if (normalized === "dalam kalibrasi") {
    return { label: status, className: "is-processing" };
  }
  if (normalized === "rusak") {
    return { label: "Rusak", className: "is-broken" };
  }
  if (normalized === "karantina") {
    return { label: "Karantina", className: "is-hold" };
  }
  if (normalized === "dihapuskan") {
    return { label: "Dihapuskan", className: "is-removed" };
  }
  return { label: status, className: "is-unknown" };
}

export function groupSchedulesByEquipment(schedules, equipmentById) {
  const groups = new Map();

  schedules.forEach((schedule) => {
    const equipmentId = String(schedule.peralatan_id);
    if (!groups.has(equipmentId)) {
      groups.set(equipmentId, {
        id: equipmentId,
        equipment: equipmentById.get(equipmentId),
        mainSchedules: [],
        additionalSchedules: [],
      });
    }

    const group = groups.get(equipmentId);
    const target = getScheduleRole(schedule) === "tambahan"
      ? group.additionalSchedules
      : group.mainSchedules;
    target.push(schedule);
  });

  return Array.from(groups.values()).sort((left, right) => {
    const getEarliestDue = (group) => [...group.mainSchedules, ...group.additionalSchedules]
      .reduce((earliest, schedule) => {
        const days = getDaysUntilDue(schedule.tanggal_jatuh_tempo);
        return days !== null && (earliest === null || days < earliest) ? days : earliest;
      }, null);
    const leftDue = getEarliestDue(left);
    const rightDue = getEarliestDue(right);
    if (leftDue === null) return rightDue === null ? 0 : 1;
    if (rightDue === null) return -1;
    return leftDue - rightDue;
  });
}
