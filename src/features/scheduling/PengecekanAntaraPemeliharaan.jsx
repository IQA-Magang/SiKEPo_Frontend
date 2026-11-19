import React, { useEffect, useMemo, useState } from "react";
import "../inspection/inspection.css";
import "./scheduling.css";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useToast } from "../../app/providers/ToastContext.jsx";
import {
  Button,
  ErrorState,
  FormField,
  LoadingState,
  Modal,
  PageHeader,
  Tabs,
} from "../../shared/components/ui/index.js";
import TableFilters from "../../shared/components/ui/TableFilters.jsx";
import WorkflowGuide from "../../shared/components/ui/WorkflowGuide.jsx";
import {
  getCurrentUser,
  getAllPemeriksaanSchedules,
  getEquipmentId,
  pengecekanAntaraApi,
  pemeliharaanApi,
  peralatanApi,
  ruanganApi,
} from "../../shared/services/api.js";
import { getUserRole, isStaffPengelola } from "../../shared/utils/permissions.js";
import ScheduleFormModal from "./components/ScheduleFormModal.jsx";
import ScheduleRealizationModal from "./components/ScheduleRealizationModal.jsx";
import {
  getTodayInputValue,
  INITIAL_SCHEDULE_FORM,
} from "./schedulingData.js";

const SCHEDULE_TYPES = [
  { key: "pengecekan_antara", label: "Pengecekan Antara" },
  { key: "pemeliharaan", label: "Pemeliharaan" },
];

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : "";
}

function displayDate(value) {
  const date = dateOnly(value);
  if (!date) return "—";
  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function dueState(value) {
  const date = dateOnly(value);
  if (!date) return { label: "Belum ada tanggal", tone: "neutral", days: null };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${date}T00:00:00`);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { label: `Terlambat ${Math.abs(days)} hari`, tone: "late", days };
  if (days === 0) return { label: "Jatuh tempo hari ini", tone: "urgent", days };
  if (days <= 7) return { label: "H-7", tone: "urgent", days };
  if (days <= 30) return { label: "H-30", tone: "soon", days };
  if (days <= 60) return { label: "H-60", tone: "h60", days };
  return { label: `${days} hari lagi`, tone: "safe", days };
}

function parseScheduleReport(value) {
  if (!value) return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default function PengecekanAntaraPemeliharaan({ initialType = "" }) {
  const { success, error } = useToast();
  const pageTitle = SCHEDULE_TYPES.find(({ key }) => key === initialType)?.label
    || (initialType === "pengecekan_antara" ? "Pengecekan Antara" : initialType === "pemeliharaan" ? "Pemeliharaan" : "Penjadwalan Pemeriksaan");
  
  const currentUser = getCurrentUser();
  const userRole = getUserRole(currentUser);
  const canManageSchedules = userRole === "admin" || userRole === "manager" || isStaffPengelola(currentUser);
  const canReviewSchedules = userRole === "manager" || userRole === "admin";

  const [schedules, setSchedules] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState("planned");
  const [search, setSearch] = useState("");

  // Create form modal state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(() => ({
    ...INITIAL_SCHEDULE_FORM,
    jenis_jadwal: initialType || "pengecekan_antara",
  }));

  // Realization modal state
  const [realizationTarget, setRealizationTarget] = useState(null);
  const [realizationForm, setRealizationForm] = useState({
    tanggal_realisasi: "",
    acuan_pembanding: "",
    nilai_acuan: "",
    batas_toleransi: "",
    pembacaan: ["", "", "", "", ""],
    versi_perangkat_lunak: "",
    daftar_pekerjaan: [],
    temuan: "",
    menyentuh_komponen: false,
  });

  // Review modal state (Manager)
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewNote, setReviewNote] = useState("");

  // Detail modal state (History)
  const [detailTarget, setDetailTarget] = useState(null);

  async function loadData() {
    setLoading(true);
    setLoadError("");
    const isManager = userRole === "manager";
    try {
      const [scheduleResult, equipmentResult, roomResult] = await Promise.allSettled([
        getAllPemeriksaanSchedules({ silent: true }),
        peralatanApi.getAll(),
        ruanganApi.getAll(),
      ]);

      if (equipmentResult.status === "rejected") {
        const msg = equipmentResult.reason?.message || "Gagal memuat data peralatan.";
        setLoadError(msg);
        if (!isManager || !equipmentResult.reason?.isNetworkError) error(msg);
        return;
      }
      if (roomResult.status === "rejected") {
        const msg = roomResult.reason?.message || "Gagal memuat data ruangan.";
        setLoadError(msg);
        if (!isManager || !roomResult.reason?.isNetworkError) error(msg);
        return;
      }

      const equipmentResponse = equipmentResult.value;
      const roomResponse = roomResult.value;

      if (!Array.isArray(equipmentResponse?.data)) {
        throw new Error("Format respons data peralatan tidak valid.");
      }
      if (!Array.isArray(roomResponse?.data)) {
        throw new Error("Format respons data ruangan tidak valid.");
      }

      const scheduleData = scheduleResult.status === "fulfilled" ? scheduleResult.value : [];
      if (scheduleResult.status === "rejected" && !isManager) {
        const msg = scheduleResult.reason?.message || "Gagal memuat jadwal.";
        setLoadError(msg);
        error(msg);
        return;
      }

      setSchedules(Array.isArray(scheduleData) ? scheduleData : []);
      setEquipment(equipmentResponse.data);
      setRooms(roomResponse.data);
    } catch (err) {
      const msg = err.message || "Gagal memuat data penjadwalan.";
      setLoadError(msg);
      if (!isManager || !err.isNetworkError) error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    setActiveView("planned");
  }, [initialType]);

  const equipmentById = useMemo(() => {
    const roomsById = new Map(rooms.map((room) => [String(room.id), room]));
    return new Map(equipment.map((item) => {
      const room = roomsById.get(String(item.ruangan_id));
      return [String(getEquipmentId(item)), {
        ...item,
        ruangan: room,
        lab: room?.labs,
      }];
    }));
  }, [equipment, rooms]);

  // Filter schedules by page type (pengecekan_antara or pemeliharaan)
  const currentTypeSchedules = useMemo(() => {
    if (!initialType) return schedules;
    return schedules.filter((s) => s.jenis_jadwal === initialType);
  }, [schedules, initialType]);

  const plannedSchedules = useMemo(() => {
    return currentTypeSchedules
      .filter((s) => s.status_realisasi === "Terjadwal")
      .sort((a, b) => {
        const dateA = dateOnly(a.tanggal_jatuh_tempo);
        const dateB = dateOnly(b.tanggal_jatuh_tempo);
        return (dateA || "9999-12-31").localeCompare(dateB || "9999-12-31");
      });
  }, [currentTypeSchedules]);

  const inProgressSchedules = useMemo(() => {
    return currentTypeSchedules
      .filter((s) => ["Menunggu Verifikasi", "Ditolak"].includes(s.status_realisasi))
      .sort((a, b) => {
        const dateA = dateOnly(a.tanggal_realisasi || a.updated_at);
        const dateB = dateOnly(b.tanggal_realisasi || b.updated_at);
        return (dateB || "0000-00-00").localeCompare(dateA || "0000-00-00");
      });
  }, [currentTypeSchedules]);

  const historySchedules = useMemo(() => {
    return currentTypeSchedules
      .filter((s) => s.status_realisasi === "Disetujui")
      .sort((a, b) => {
        const dateA = dateOnly(a.tanggal_realisasi || a.tanggal_terakhir || a.updated_at);
        const dateB = dateOnly(b.tanggal_realisasi || b.tanggal_terakhir || b.updated_at);
        return (dateB || "0000-00-00").localeCompare(dateA || "0000-00-00");
      });
  }, [currentTypeSchedules]);

  // Equipment with active schedules of this type
  const activeScheduleEquipmentIds = useMemo(() => {
    return new Set(
      currentTypeSchedules
        .filter((s) => ["Terjadwal", "Menunggu Verifikasi", "Ditolak"].includes(s.status_realisasi))
        .map((s) => String(s.peralatan_id))
    );
  }, [currentTypeSchedules]);

  // Available equipment for modal selection
  const availableEquipment = useMemo(() => {
    return Array.from(equipmentById.values()).filter((item) => {
      const id = getEquipmentId(item);
      return id != null && !activeScheduleEquipmentIds.has(String(id));
    });
  }, [equipmentById, activeScheduleEquipmentIds]);

  // Unscheduled equipment list (tab "Belum ada jadwal")
  const unscheduledEquipment = availableEquipment;
  const normalizedSearch = search.trim().toLocaleLowerCase("id-ID");
  const matchesScheduleSearch = (schedule) => {
    if (!normalizedSearch) return true;
    const equipmentItem = equipmentById.get(String(schedule.peralatan_id));
    return [
      equipmentItem?.nomor_aset,
      equipmentItem?.nama_peralatan,
      equipmentItem?.merek,
      equipmentItem?.tipe_model,
      schedule.acuan_pembanding,
      schedule.hasil_realisasi,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("id-ID")
      .includes(normalizedSearch);
  };
  const filteredPlannedSchedules = plannedSchedules.filter(matchesScheduleSearch);
  const filteredInProgressSchedules = inProgressSchedules.filter(matchesScheduleSearch);
  const filteredHistorySchedules = historySchedules.filter(matchesScheduleSearch);
  const filteredUnscheduledEquipment = unscheduledEquipment.filter((item) =>
    !normalizedSearch ||
    [item.nomor_aset, item.nama_peralatan, item.merek, item.tipe_model]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("id-ID")
      .includes(normalizedSearch),
  );

  function openCreate(equipmentItem = null) {
    const equipmentId = equipmentItem ? getEquipmentId(equipmentItem) : "";
    setRealizationTarget(null);
    setForm({
      ...INITIAL_SCHEDULE_FORM,
      jenis_jadwal: initialType || "pengecekan_antara",
      peralatan_id: equipmentId ? String(equipmentId) : "",
    });
    setShowCreateForm(true);
  }

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "frekuensi_penggunaan" && !initialType
        ? { jenis_jadwal: value === "tinggi" ? "pengecekan_antara" : "pemeliharaan" }
        : {}),
    }));
  }

  async function createSchedule(event) {
    event.preventDefault();
    if (!canManageSchedules) {
      error("Hanya pengelola peralatan atau admin yang dapat membuat jadwal.");
      return;
    }
    setSaving(true);
    try {
      const api = form.jenis_jadwal === "pengecekan_antara"
        ? pengecekanAntaraApi
        : pemeliharaanApi;
      const response = await api.create({
        ...form,
        peralatan_id: Number(form.peralatan_id),
        interval_bulan: Number(form.interval_bulan),
      });
      success(response.message || `Jadwal ${pageTitle.toLowerCase()} berhasil dibuat.`);
      setForm({ ...INITIAL_SCHEDULE_FORM, jenis_jadwal: initialType || "pengecekan_antara" });
      setShowCreateForm(false);
      await loadData();
    } catch (err) {
      error(err.message || `Gagal membuat jadwal ${pageTitle.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  }

  function openRealization(schedule) {
    setRealizationTarget(schedule);
    setRealizationForm({
      tanggal_realisasi: getTodayInputValue(),
      acuan_pembanding: schedule.acuan_pembanding || "",
      nilai_acuan: "",
      batas_toleransi: "",
      pembacaan: ["", "", "", "", ""],
      versi_perangkat_lunak: "",
      daftar_pekerjaan: [],
      temuan: "",
      menyentuh_komponen: false,
    });
  }

  async function saveRealization(event) {
    event.preventDefault();
    if (!realizationTarget || !realizationForm.tanggal_realisasi) return;
    if (!canManageSchedules) {
      error("Hanya pengelola peralatan atau admin yang dapat mencatat hasil pemeriksaan.");
      return;
    }
    setSaving(true);
    try {
      const api = realizationTarget.jenis_jadwal === "pengecekan_antara"
        ? pengecekanAntaraApi
        : pemeliharaanApi;
      const isCheck = realizationTarget.jenis_jadwal === "pengecekan_antara";

      const payload = isCheck
        ? {
          tanggal_realisasi: realizationForm.tanggal_realisasi,
          acuan_pembanding: realizationForm.acuan_pembanding,
          nilai_acuan: Number(realizationForm.nilai_acuan),
          batas_toleransi: Number(realizationForm.batas_toleransi),
          pembacaan: realizationForm.pembacaan.map(Number),
        }
        : {
          tanggal_realisasi: realizationForm.tanggal_realisasi,
          versi_perangkat_lunak: realizationForm.versi_perangkat_lunak,
          daftar_pekerjaan: realizationForm.daftar_pekerjaan,
          temuan: realizationForm.temuan,
          menyentuh_komponen: realizationForm.menyentuh_komponen,
        };

      const response = await api.updateRealisasi(realizationTarget.record_id, payload);
      success(response.message || "Hasil pemeriksaan berhasil disimpan dan diajukan ke Manager.");
      setRealizationTarget(null);
      await loadData();
    } catch (err) {
      error(err.message || "Gagal menyimpan hasil pemeriksaan.");
    } finally {
      setSaving(false);
    }
  }

  function openReview(schedule) {
    setReviewTarget(schedule);
    setReviewNote("");
  }

  async function handleReviewSubmit(decision) {
    if (!reviewTarget) return;
    if (decision === "ditolak" && !reviewNote.trim()) {
      error("Catatan Manager wajib diisi jika menolak hasil pemeriksaan.");
      return;
    }
    setSaving(true);
    try {
      const api = reviewTarget.jenis_jadwal === "pengecekan_antara"
        ? pengecekanAntaraApi
        : pemeliharaanApi;
      const response = await api.review(reviewTarget.record_id, {
        keputusan: decision,
        catatan: reviewNote.trim(),
      });
      success(response.message || `Hasil pemeriksaan berhasil ${decision === "disetujui" ? "disetujui" : "ditolak"}.`);
      setReviewTarget(null);
      setReviewNote("");
      await loadData();
    } catch (err) {
      error(err.message || "Gagal menyimpan tinjauan hasil pemeriksaan.");
    } finally {
      setSaving(false);
    }
  }

  function openDetail(schedule) {
    setDetailTarget(schedule);
  }

  const today = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const statusTabs = [
    {
      id: "planned",
      label: `Masuk rentang ${pageTitle.toLowerCase()}`,
      count: plannedSchedules.length,
      Icon: CalendarClock,
    },
    {
      id: "in-progress",
      label: `Sedang ${pageTitle.toLowerCase()}`,
      count: inProgressSchedules.length,
      Icon: RefreshCw,
    },
    {
      id: "unscheduled",
      label: "Belum ada jadwal",
      count: unscheduledEquipment.length,
      Icon: Plus,
    },
    {
      id: "history",
      label: "History",
      count: historySchedules.length,
      Icon: FileText,
    },
  ];

  return (
    <div className="page-container fade-in-up inspection-cycle-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{pageTitle}</h1>
          <p className="page-subtitle">
            Kelola jadwal, proses, dan histori {pageTitle.toLowerCase()} peralatan laboratorium.
          </p>
        </div>
      </div>

      {initialType === "pengecekan_antara" ? (
        <WorkflowGuide
          title="Alur Pengecekan Antara"
          description="Ikuti tahapan pengecekan rutin antar periode kalibrasi atau verifikasi."
          steps={[
            {
              title: "Buat Jadwal Pengecekan",
              description: "Pilih peralatan, frekuensi penggunaan, interval, dan acuan pembanding.",
            },
            {
              title: "Masuk Rentang Pengecekan",
              description: "Sistem menampilkan jadwal mendekati atau melewati jatuh tempo.",
            },
            {
              title: "Catat Hasil Pembacaan",
              description: "Isi tanggal, nilai acuan, batas toleransi, dan lima hasil pembacaan.",
            },
            {
              title: "Ajukan ke Manager",
              description: "Pengelola mengajukan hasil pengecekan untuk ditinjau.",
            },
            {
              title: "Persetujuan dan Riwayat",
              description: "Manager menyetujui atau menolak, lalu hasil tercatat dalam history.",
            },
          ]}
        />
      ) : initialType === "pemeliharaan" ? (
        <WorkflowGuide
          title="Alur Pemeliharaan Peralatan"
          description="Ikuti tahapan pemeliharaan dari penjadwalan hingga persetujuan hasil."
          steps={[
            {
              title: "Buat Jadwal Pemeliharaan",
              description: "Pilih peralatan, jenis pemeliharaan, interval, dan jadwal jatuh tempo.",
            },
            {
              title: "Masuk Rentang Pemeliharaan",
              description: "Pengelola melihat jadwal yang mendekati atau melewati jatuh tempo.",
            },
            {
              title: "Laksanakan Pemeliharaan",
              description: "Catat tanggal, versi perangkat lunak, pekerjaan, temuan, dan komponen yang disentuh.",
            },
            {
              title: "Ajukan Hasil",
              description: "Hasil realisasi diajukan kepada Manager Lab untuk ditinjau.",
            },
            {
              title: "Persetujuan dan Riwayat",
              description: "Manager menyetujui atau menolak; keputusan tercatat sebagai history.",
            },
          ]}
        />
      ) : (
        <WorkflowGuide
          title="Alur Penjadwalan Pemeriksaan"
          description="Pilih jenis pemeriksaan yang akan dijadwalkan dan ikuti alurnya."
          steps={[
            {
              title: "Pilih Jenis Pemeriksaan",
              description: "Gunakan Pengecekan Antara atau Pemeliharaan sesuai kebutuhan peralatan.",
            },
            {
              title: "Buat Jadwal",
              description: "Pilih peralatan, interval, dan data acuan yang diperlukan.",
            },
            {
              title: "Laksanakan Pemeriksaan",
              description: "Catat hasil sesuai jenis pengecekan atau pemeliharaan.",
            },
            {
              title: "Tinjauan Manager",
              description: "Manager meninjau hasil dan memutuskan disetujui atau ditolak.",
            },
            {
              title: "Riwayat Pemeriksaan",
              description: "Hasil yang disetujui tersedia pada History dan dashboard kalender.",
            },
          ]}
        />
      )}

      <Tabs
        className="settings-tabs"
        ariaLabel={`Status ${pageTitle.toLowerCase()}`}
        activeId={activeView}
        onChange={setActiveView}
        tabs={statusTabs.map(({ id, label, count: tabCount, Icon }) => ({
          id,
          idAttribute: `schedule-tab-${id}`,
          label: (
            <>
              <Icon size={16} />
              {label} ({tabCount})
            </>
          ),
        }))}
      />

      <TableFilters
        fields={[
          {
            type: "search",
            id: "schedule-search",
            label: "Cari peralatan",
            placeholder: "Nama, nomor aset, atau merek",
            value: search,
            onChange: (event) => setSearch(event.target.value),
          },
        ]}
        actions={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSearch("")}
            title="Reset pencarian"
            aria-label="Reset pencarian jadwal"
          >
            <RotateCcw size={16} />
          </button>
        }
      />

      {loading ? (
        <LoadingState message={`Memuat jadwal ${pageTitle.toLowerCase()}...`} />
      ) : loadError ? (
        <ErrorState
          title={`Gagal memuat ${pageTitle.toLowerCase()}`}
          message={loadError}
          onRetry={loadData}
        />
      ) : (
        <div className="inspection-cycle-layout">
          <div className="inspection-cycle-sections">
            {activeView === "planned" && (
              <section className="inspection-section">
                <header className="inspection-section__header">
                  <div>
                    <h2>1 · Masuk rentang {pageTitle.toLowerCase()}</h2>
                    <span>
                      {filteredPlannedSchedules.length
                        ? `${filteredPlannedSchedules.length} jadwal · terdekat ditampilkan lebih dulu`
                        : "Siklus aktif yang memerlukan tindak lanjut"}
                    </span>
                  </div>
                  <span className="inspection-section-count">{filteredPlannedSchedules.length}</span>
                </header>
                {filteredPlannedSchedules.length === 0 ? (
                  <div className="inspection-table-empty">
                    <Clock3 size={16} />
                    {normalizedSearch ? "Tidak ada jadwal yang cocok dengan pencarian." : `Belum ada jadwal ${pageTitle.toLowerCase()} yang menunggu.`}
                  </div>
                ) : (
                  <div className="inspection-table-scroll">
                    <table className="inspection-cycle-table">
                      <thead>
                        <tr>
                          <th>Peralatan</th>
                          <th>{initialType === "pengecekan_antara" ? "Frekuensi / acuan" : "Frekuensi / jenis"}</th>
                          <th>Jatuh tempo</th>
                          <th>Status</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPlannedSchedules.map((schedule) => {
                          const equipmentItem = equipmentById.get(String(schedule.peralatan_id));
                          const due = dueState(schedule.tanggal_jatuh_tempo);
                          return (
                            <tr
                              key={`${schedule.peralatan_id}-${schedule.id}`}
                              className={due.tone === "late" ? "is-overdue" : ""}
                            >
                              <td>
                                <div className="inspection-table-equipment">
                                  <strong>{equipmentItem?.nomor_aset || `ID ${schedule.peralatan_id}`}</strong>
                                  <span>{equipmentItem?.nama_peralatan || "Peralatan"}</span>
                                </div>
                              </td>
                              <td>
                                <div className="inspection-table-meta">
                                  <strong>
                                    {schedule.frekuensi_penggunaan
                                      ? `Frekuensi ${schedule.frekuensi_penggunaan}`
                                      : (schedule.interval_bulan ? `Interval ${schedule.interval_bulan} bulan` : pageTitle)}
                                  </strong>
                                  <span>
                                    {schedule.jenis_jadwal === "pengecekan_antara"
                                      ? (schedule.acuan_pembanding ? `Acuan: ${schedule.acuan_pembanding}` : `Setiap ${schedule.interval_bulan || 6} bulan`)
                                      : (schedule.jenis_pemeliharaan || `Setiap ${schedule.interval_bulan || 12} bulan`)}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div className="inspection-table-meta">
                                  <strong>{displayDate(schedule.tanggal_jatuh_tempo)}</strong>
                                  <span className={`inspection-due-text is-${due.tone}`}>{due.label}</span>
                                </div>
                              </td>
                              <td>
                                <span className="inspection-cycle-status inspection-cycle-status--direncanakan">
                                  Terjadwal
                                </span>
                              </td>
                              <td>
                                <div className="inspection-row-actions">
                                  {canManageSchedules ? (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      disabled={saving}
                                      onClick={() => openRealization(schedule)}
                                    >
                                      Catat hasil
                                    </Button>
                                  ) : (
                                    <span className="inspection-readonly-hint">Menunggu pelaksanaan</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {activeView === "in-progress" && (
              <section className="inspection-section">
                <header className="inspection-section__header">
                  <div>
                    <h2>2 · Sedang {pageTitle.toLowerCase()}</h2>
                    <span>
                      {filteredInProgressSchedules.length
                        ? `${filteredInProgressSchedules.length} siklus dalam proses verifikasi atau tindak lanjut`
                        : "Siklus yang sedang dikerjakan"}
                    </span>
                  </div>
                  <span className="inspection-section-count">{filteredInProgressSchedules.length}</span>
                </header>
                {filteredInProgressSchedules.length === 0 ? (
                  <div className="inspection-table-empty">
                    <Clock3 size={16} />
                    {normalizedSearch ? "Tidak ada hasil yang cocok dengan pencarian." : `Belum ada ${pageTitle.toLowerCase()} yang sedang berlangsung.`}
                  </div>
                ) : (
                  <div className="inspection-table-scroll">
                    <table className="inspection-cycle-table">
                      <thead>
                        <tr>
                          <th>Peralatan</th>
                          <th>Hasil pemeriksaan</th>
                          <th>Tanggal realisasi</th>
                          <th>Status</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInProgressSchedules.map((schedule) => {
                          const equipmentItem = equipmentById.get(String(schedule.peralatan_id));
                          const isPending = schedule.status_realisasi === "Menunggu Verifikasi";
                          const isRejected = schedule.status_realisasi === "Ditolak";
                          return (
                            <tr key={`${schedule.peralatan_id}-${schedule.id}`}>
                              <td>
                                <div className="inspection-table-equipment">
                                  <strong>{equipmentItem?.nomor_aset || `ID ${schedule.peralatan_id}`}</strong>
                                  <span>{equipmentItem?.nama_peralatan || "Peralatan"}</span>
                                </div>
                              </td>
                              <td>
                                <div className="inspection-table-meta">
                                  <strong>
                                    {schedule.hasil_realisasi || (isPending ? "Menunggu Verifikasi" : "Perlu tindak lanjut")}
                                  </strong>
                                  <span>
                                    {schedule.jenis_jadwal === "pengecekan_antara"
                                      ? (schedule.acuan_pembanding ? `Acuan: ${schedule.acuan_pembanding}` : "Hasil pembacaan tercatat")
                                      : (schedule.versi_perangkat_lunak ? `Versi: ${schedule.versi_perangkat_lunak}` : "Pemeriksaan fisik tercatat")}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div className="inspection-table-meta">
                                  <strong>{displayDate(schedule.tanggal_realisasi)}</strong>
                                  <span className="inspection-due-text is-soon">Diajukan</span>
                                </div>
                              </td>
                              <td>
                                <span
                                  className={`inspection-cycle-status inspection-cycle-status--${isPending ? "dalam_proses" : isRejected ? "dibatalkan" : "selesai"}`}
                                >
                                  {schedule.status_realisasi}
                                </span>
                              </td>
                              <td>
                                <div className="inspection-row-actions">
                                  {canReviewSchedules && isPending ? (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      disabled={saving}
                                      onClick={() => openReview(schedule)}
                                    >
                                      Tinjau & Setujui
                                    </Button>
                                  ) : canManageSchedules && isRejected ? (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      disabled={saving}
                                      onClick={() => openRealization(schedule)}
                                    >
                                      Catat ulang
                                    </Button>
                                  ) : (
                                    <span className="inspection-readonly-hint">
                                      {isPending
                                        ? "Menunggu verifikasi Manager"
                                        : `Ditolak: ${schedule.catatan_manager || "Perlu perbaikan"}`}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {activeView === "history" && (
              <section className="inspection-section">
                <header className="inspection-section__header">
                  <div>
                    <h2>3 · History</h2>
                    <span>Siklus yang telah selesai dan disetujui</span>
                  </div>
                  <span className="inspection-section-count">{filteredHistorySchedules.length}</span>
                </header>
                {filteredHistorySchedules.length === 0 ? (
                  <div className="inspection-table-empty">
                    <Clock3 size={16} />
                    {normalizedSearch ? "Tidak ada riwayat yang cocok dengan pencarian." : "History akan muncul setelah hasil pemeriksaan disetujui."}
                  </div>
                ) : (
                  <div className="inspection-table-scroll">
                    <table className="inspection-cycle-table">
                      <thead>
                        <tr>
                          <th>Peralatan</th>
                          <th>Hasil pemeriksaan</th>
                          <th>Tanggal selesai</th>
                          <th>Status</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHistorySchedules.map((schedule) => {
                          const equipmentItem = equipmentById.get(String(schedule.peralatan_id));
                          return (
                            <tr key={`${schedule.peralatan_id}-${schedule.id}`}>
                              <td>
                                <div className="inspection-table-equipment">
                                  <strong>{equipmentItem?.nomor_aset || `ID ${schedule.peralatan_id}`}</strong>
                                  <span>{equipmentItem?.nama_peralatan || "Peralatan"}</span>
                                </div>
                              </td>
                              <td>
                                <div className="inspection-table-meta">
                                  <strong>{schedule.hasil_realisasi || "Selesai"}</strong>
                                  <span>
                                    {schedule.jenis_jadwal === "pengecekan_antara"
                                      ? (schedule.acuan_pembanding ? `Acuan: ${schedule.acuan_pembanding}` : "Pemeriksaan selesai")
                                      : (schedule.versi_perangkat_lunak ? `Versi: ${schedule.versi_perangkat_lunak}` : "Pemeliharaan selesai")}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div className="inspection-table-meta">
                                  <strong>{displayDate(schedule.tanggal_realisasi || schedule.tanggal_terakhir)}</strong>
                                  <span className="inspection-due-text is-safe">Disetujui</span>
                                </div>
                              </td>
                              <td>
                                <span className="inspection-cycle-status inspection-cycle-status--selesai">
                                  Disetujui
                                </span>
                              </td>
                              <td>
                                <div className="inspection-row-actions">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => openDetail(schedule)}
                                  >
                                    Detail
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {activeView === "unscheduled" && (
              <section className="inspection-section inspection-empty-schedule">
                <header className="inspection-section__header">
                  <div>
                    <h2>Belum ada jadwal</h2>
                    <span>Peralatan tanpa siklus pemeriksaan berkala</span>
                  </div>
                  <span className="inspection-section-count">{filteredUnscheduledEquipment.length}</span>
                </header>
                {filteredUnscheduledEquipment.length === 0 ? (
                  <div className="inspection-table-empty">
                    <Clock3 size={16} />
                    {normalizedSearch ? "Tidak ada peralatan yang cocok dengan pencarian." : "Semua peralatan sudah memiliki jadwal."}
                  </div>
                ) : (
                  <div className="inspection-unscheduled-list">
                    {filteredUnscheduledEquipment.map((item) => (
                      <button
                        type="button"
                        key={getEquipmentId(item)}
                        onClick={() => openCreate(item)}
                      >
                        <span>
                          <strong>{item.nomor_aset || `ID ${getEquipmentId(item)}`}</strong>
                          {item.nama_peralatan}
                        </span>
                        <Plus size={16} />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      )}

      {/* Modal Buat Jadwal Baru */}
      <ScheduleFormModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={createSchedule}
        form={form}
        onChange={updateForm}
        availableEquipment={availableEquipment}
        saving={saving}
        allowAllFrequencies={!initialType}
      />

      {/* Modal Catat Realisasi (Staff) */}
      <ScheduleRealizationModal
        schedule={realizationTarget}
        equipment={equipmentById.get(String(realizationTarget?.peralatan_id))}
        form={realizationForm}
        onChange={(name, value, index) => {
          setRealizationForm((previous) => {
            if (name === "pembacaan") {
              const pembacaan = [...previous.pembacaan];
              pembacaan[index] = value;
              return { ...previous, pembacaan };
            }
            if (name === "daftar_pekerjaan") {
              const tasks = new Set(previous.daftar_pekerjaan);
              if (value.checked) tasks.add(value.task);
              else tasks.delete(value.task);
              return { ...previous, daftar_pekerjaan: Array.from(tasks) };
            }
            return { ...previous, [name]: value };
          });
        }}
        onClose={() => setRealizationTarget(null)}
        onSubmit={saveRealization}
        saving={saving}
        canManage={canManageSchedules}
      />

      {/* Modal Tinjau & Setujui (Manager) */}
      <Modal
        isOpen={Boolean(reviewTarget)}
        onClose={saving ? undefined : () => setReviewTarget(null)}
        title={`Tinjau Hasil ${pageTitle}`}
        description={`${equipmentById.get(String(reviewTarget?.peralatan_id))?.nomor_aset || ""} · ${equipmentById.get(String(reviewTarget?.peralatan_id))?.nama_peralatan || ""}`}
        size="lg"
        className="inspection-cycle-modal"
      >
        {reviewTarget && (
          <div className="inspection-side-form">
            <div className="inspection-form-grid">
              <FormField label="Peralatan">
                <input
                  className="form-input"
                  disabled
                  value={`${equipmentById.get(String(reviewTarget.peralatan_id))?.nomor_aset || ""} — ${equipmentById.get(String(reviewTarget.peralatan_id))?.nama_peralatan || ""}`}
                />
              </FormField>
              <FormField label="Tanggal Realisasi">
                <input
                  className="form-input"
                  disabled
                  value={displayDate(reviewTarget.tanggal_realisasi)}
                />
              </FormField>
            </div>

            {reviewTarget.jenis_jadwal === "pengecekan_antara" ? (
              <>
                <div className="inspection-form-grid">
                  <FormField label="Acuan Pembanding">
                    <input
                      className="form-input"
                      disabled
                      value={reviewTarget.acuan_pembanding || "—"}
                    />
                  </FormField>
                  <FormField label="Nilai Acuan">
                    <input
                      className="form-input"
                      disabled
                      value={reviewTarget.nilai_acuan != null ? String(reviewTarget.nilai_acuan) : "—"}
                    />
                  </FormField>
                </div>
                <div className="inspection-form-grid">
                  <FormField label="Batas Toleransi">
                    <input
                      className="form-input"
                      disabled
                      value={reviewTarget.batas_toleransi != null ? String(reviewTarget.batas_toleransi) : "—"}
                    />
                  </FormField>
                  <FormField label="Simpangan Maksimum">
                    <input
                      className="form-input"
                      disabled
                      value={reviewTarget.simpangan_maksimum != null ? String(reviewTarget.simpangan_maksimum) : "—"}
                    />
                  </FormField>
                </div>
                <FormField label="Lima Hasil Pembacaan">
                  <input
                    className="form-input"
                    disabled
                    value={
                      parseScheduleReport(reviewTarget.data_pembacaan)?.pembacaan?.join(", ")
                      || (Array.isArray(parseScheduleReport(reviewTarget.data_pembacaan))
                        ? parseScheduleReport(reviewTarget.data_pembacaan).join(", ")
                        : "Data pembacaan tercatat")
                    }
                  />
                </FormField>
                <FormField label="Hasil Evaluasi Realisasi">
                  <input
                    className="form-input"
                    disabled
                    value={reviewTarget.hasil_realisasi || "—"}
                  />
                </FormField>
              </>
            ) : (
              <>
                <div className="inspection-form-grid">
                  <FormField label="Versi Perangkat Lunak">
                    <input
                      className="form-input"
                      disabled
                      value={reviewTarget.versi_perangkat_lunak || "—"}
                    />
                  </FormField>
                  <FormField label="Menyentuh Komponen Kritis">
                    <input
                      className="form-input"
                      disabled
                      value={reviewTarget.menyentuh_komponen ? "Ya" : "Tidak"}
                    />
                  </FormField>
                </div>
                <FormField label="Daftar Pekerjaan Yang Dilakukan">
                  <input
                    className="form-input"
                    disabled
                    value={
                      Array.isArray(parseScheduleReport(reviewTarget.daftar_pekerjaan))
                        ? parseScheduleReport(reviewTarget.daftar_pekerjaan).join(", ")
                        : (reviewTarget.daftar_pekerjaan || "—")
                    }
                  />
                </FormField>
                <FormField label="Temuan Pemeriksaan">
                  <textarea
                    className="form-textarea"
                    rows="2"
                    disabled
                    value={reviewTarget.temuan || "Tidak ada temuan khusus."}
                  />
                </FormField>
                <FormField label="Hasil Pemeliharaan">
                  <input
                    className="form-input"
                    disabled
                    value={reviewTarget.hasil_realisasi || "—"}
                  />
                </FormField>
              </>
            )}

            <FormField
              label="Catatan Manager"
              htmlFor="manager-review-note"
              hint="Wajib diisi bila pengajuan ditolak untuk memberikan instruksi tindak lanjut."
            >
              <textarea
                id="manager-review-note"
                className="form-textarea"
                rows="2"
                placeholder="Tuliskan catatan verifikasi atau alasan penolakan..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              />
            </FormField>

            <div
              className="inspection-side-form__footer"
              style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
            >
              <Button
                variant="secondary"
                onClick={() => setReviewTarget(null)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                icon={<XCircle size={15} />}
                disabled={saving}
                onClick={() => handleReviewSubmit("ditolak")}
              >
                {saving ? "Menyimpan..." : "Tolak"}
              </Button>
              <Button
                variant="success"
                icon={<CheckCircle2 size={15} />}
                disabled={saving}
                onClick={() => handleReviewSubmit("disetujui")}
              >
                {saving ? "Menyimpan..." : "Setujui"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Detail Histori */}
      <Modal
        isOpen={Boolean(detailTarget)}
        onClose={() => setDetailTarget(null)}
        title={`Detail Histori ${pageTitle}`}
        description={`${equipmentById.get(String(detailTarget?.peralatan_id))?.nomor_aset || ""} · ${equipmentById.get(String(detailTarget?.peralatan_id))?.nama_peralatan || ""}`}
        size="md"
        className="inspection-cycle-modal"
      >
        {detailTarget && (
          <div className="inspection-side-form">
            <div className="inspection-form-grid">
              <FormField label="Peralatan">
                <input
                  className="form-input"
                  disabled
                  value={`${equipmentById.get(String(detailTarget.peralatan_id))?.nomor_aset || ""} — ${equipmentById.get(String(detailTarget.peralatan_id))?.nama_peralatan || ""}`}
                />
              </FormField>
              <FormField label="Tanggal Disetujui / Selesai">
                <input
                  className="form-input"
                  disabled
                  value={displayDate(detailTarget.tanggal_realisasi || detailTarget.tanggal_terakhir)}
                />
              </FormField>
            </div>

            {detailTarget.jenis_jadwal === "pengecekan_antara" ? (
              <>
                <div className="inspection-form-grid">
                  <FormField label="Acuan Pembanding">
                    <input
                      className="form-input"
                      disabled
                      value={detailTarget.acuan_pembanding || "—"}
                    />
                  </FormField>
                  <FormField label="Nilai Acuan">
                    <input
                      className="form-input"
                      disabled
                      value={detailTarget.nilai_acuan != null ? String(detailTarget.nilai_acuan) : "—"}
                    />
                  </FormField>
                </div>
                <div className="inspection-form-grid">
                  <FormField label="Batas Toleransi">
                    <input
                      className="form-input"
                      disabled
                      value={detailTarget.batas_toleransi != null ? String(detailTarget.batas_toleransi) : "—"}
                    />
                  </FormField>
                  <FormField label="Simpangan Maksimum">
                    <input
                      className="form-input"
                      disabled
                      value={detailTarget.simpangan_maksimum != null ? String(detailTarget.simpangan_maksimum) : "—"}
                    />
                  </FormField>
                </div>
                <FormField label="Hasil Evaluasi">
                  <input
                    className="form-input"
                    disabled
                    value={detailTarget.hasil_realisasi || "Selesai"}
                  />
                </FormField>
              </>
            ) : (
              <>
                <div className="inspection-form-grid">
                  <FormField label="Versi Perangkat Lunak">
                    <input
                      className="form-input"
                      disabled
                      value={detailTarget.versi_perangkat_lunak || "—"}
                    />
                  </FormField>
                  <FormField label="Menyentuh Komponen Kritis">
                    <input
                      className="form-input"
                      disabled
                      value={detailTarget.menyentuh_komponen ? "Ya" : "Tidak"}
                    />
                  </FormField>
                </div>
                <FormField label="Daftar Pekerjaan">
                  <input
                    className="form-input"
                    disabled
                    value={
                      Array.isArray(parseScheduleReport(detailTarget.daftar_pekerjaan))
                        ? parseScheduleReport(detailTarget.daftar_pekerjaan).join(", ")
                        : (detailTarget.daftar_pekerjaan || "—")
                    }
                  />
                </FormField>
                <FormField label="Hasil Pemeliharaan">
                  <input
                    className="form-input"
                    disabled
                    value={detailTarget.hasil_realisasi || "Selesai"}
                  />
                </FormField>
              </>
            )}

            {detailTarget.catatan_manager && (
              <FormField label="Catatan Manager">
                <textarea
                  className="form-textarea"
                  rows="2"
                  disabled
                  value={detailTarget.catatan_manager}
                />
              </FormField>
            )}

            <div
              className="inspection-side-form__footer"
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Button variant="secondary" onClick={() => setDetailTarget(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
