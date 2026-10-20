import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CircleHelp,
  CircleX,
  Grid2X2,
  Pause,
  Plus,
  RefreshCw,
  ShieldCheck,
  Target,
  Wrench,
} from "lucide-react";
import { useToast } from "../../app/providers/ToastContext.jsx";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Button,
} from "../../shared/components/ui/index.js";
import TableFilters from "../../shared/components/ui/TableFilters.jsx";
import { usePagination } from "../../shared/components/ui/Pagination.jsx";
import {
  getCurrentUser,
  getEquipmentId,
  jadwalPemeriksaanBerkalaApi,
  peralatanApi,
  ruanganApi,
} from "../../shared/services/api.js";
import ScheduleFormModal from "./components/ScheduleFormModal.jsx";
import ScheduleRealizationModal from "./components/ScheduleRealizationModal.jsx";
import ScheduleEquipmentTable from "./components/ScheduleEquipmentTable.jsx";
import ScheduleTable from "./components/ScheduleTable.jsx";
import {
  getDaysUntilDue,
  getScheduleStatus,
  getScheduleStatusInfo,
  getScheduleStatusOrder,
  getTodayInputValue,
  groupSchedulesByEquipment,
  INITIAL_SCHEDULE_FORM,
} from "./schedulingData.js";
import "./scheduling.css";

const SCHEDULE_TYPES = [
  {
    key: "kalibrasi",
    label: "Kalibrasi",
    description: "Untuk alat yang bisa dikalibrasi",
    icon: Target,
  },
  {
    key: "verifikasi_fungsi",
    label: "Verifikasi Fungsi",
    description: "Untuk alat yang tidak bisa dikalibrasi",
    icon: ShieldCheck,
  },
  {
    key: "pengecekan_antara",
    label: "Pengecekan Antara",
    description: "Untuk alat yang sering dipakai",
    icon: Activity,
  },
  {
    key: "pemeliharaan",
    label: "Pemeliharaan",
    description: "Untuk alat yang jarang dipakai",
    icon: Wrench,
  },
];

const SCHEDULE_STATUS_CHIPS = [
  { key: "late", label: "Terlambat", icon: CircleX },
  { key: "urgent", label: "Mendesak", icon: Clock3 },
  { key: "soon", label: "Mendekati jatuh tempo", icon: CalendarDays },
  { key: "unset", label: "Belum diatur", icon: CircleHelp },
  { key: "safe", label: "Aman", icon: CheckCircle2 },
  { key: "doing", label: "Sedang diproses", icon: RefreshCw },
  { key: "hold", label: "Dijeda", icon: Pause },
];

export default function JadwalPemeriksaanBerkala() {
  const { success, error } = useToast();
  const [schedules, setSchedules] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(INITIAL_SCHEDULE_FORM);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [labFilter, setLabFilter] = useState("");
  const [onlyMyEquipment, setOnlyMyEquipment] = useState(false);
  const [showAllStatuses, setShowAllStatuses] = useState(false);
  const [activeView, setActiveView] = useState("actions");
  const [realizationTarget, setRealizationTarget] = useState(null);
  const [realizationDate, setRealizationDate] = useState("");

  async function loadData() {
    setLoading(true);
    setLoadError("");
    try {
      const [scheduleResponse, equipmentResponse, roomResponse] = await Promise.all([
        jadwalPemeriksaanBerkalaApi.getAll(),
        peralatanApi.getAll(),
        ruanganApi.getAll(),
      ]);
      setSchedules(Array.isArray(scheduleResponse.data) ? scheduleResponse.data : []);
      setEquipment(Array.isArray(equipmentResponse.data) ? equipmentResponse.data : []);
      setRooms(Array.isArray(roomResponse.data) ? roomResponse.data : []);
    } catch (err) {
      const message = err.message || "Gagal memuat data penjadwalan.";
      setLoadError(message);
      error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const equipmentById = useMemo(
    () => {
      const roomsById = new Map(rooms.map((room) => [String(room.id), room]));
      return new Map(equipment.map((item) => {
        const room = roomsById.get(String(item.ruangan_id));
        return [String(getEquipmentId(item)), {
          ...item,
          ruangan: room,
          lab: room?.labs,
        }];
      }));
    },
    [equipment, rooms],
  );
  const scheduledEquipmentIds = useMemo(
    () => new Set(schedules.map((item) => String(item.peralatan_id))),
    [schedules],
  );
  const availableEquipment = Array.from(equipmentById.values()).filter((item) => {
    const id = getEquipmentId(item);
    return id != null && !scheduledEquipmentIds.has(String(id));
  });
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.user_id ?? currentUser?.id;
  const labOptions = useMemo(() => {
    const labs = new Map();
    equipmentById.forEach((item) => {
      if (item.lab?.id == null) return;
      labs.set(String(item.lab.id), {
        value: String(item.lab.id),
        label: item.lab.kode_labs || item.lab.nama_labs,
      });
    });
    return Array.from(labs.values()).sort((left, right) => left.label.localeCompare(right.label));
  }, [equipmentById]);

  const filteredSchedules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return schedules.filter((schedule) => {
      const equipmentItem = equipmentById.get(String(schedule.peralatan_id));
      const matchesSearch = !query || [
        equipmentItem?.nama_peralatan,
        equipmentItem?.nomor_aset,
        schedule.jenis_jadwal,
        schedule.pic,
      ].some((value) => String(value || "").toLowerCase().includes(query));
      const state = getScheduleStatus(schedule, equipmentItem);
      const matchesStatus = statusFilter
        ? state === statusFilter
        : showAllStatuses || getScheduleStatusInfo(state).needsAction;
      const matchesType = !typeFilter || schedule.jenis_jadwal === typeFilter;
      const matchesLab = !labFilter || String(equipmentItem?.lab?.id) === labFilter;
      const matchesOwner = !onlyMyEquipment
        || (currentUserId != null
          && String(equipmentItem?.ruangan?.pic_user_id) === String(currentUserId));
      return matchesSearch && matchesStatus && matchesType && matchesLab && matchesOwner;
    }).sort((left, right) => {
      const leftEquipment = equipmentById.get(String(left.peralatan_id));
      const rightEquipment = equipmentById.get(String(right.peralatan_id));
      const statusDifference = getScheduleStatusOrder(getScheduleStatus(left, leftEquipment))
        - getScheduleStatusOrder(getScheduleStatus(right, rightEquipment));
      if (statusDifference) return statusDifference;
      return (getDaysUntilDue(left.tanggal_jatuh_tempo) ?? Number.MAX_SAFE_INTEGER)
        - (getDaysUntilDue(right.tanggal_jatuh_tempo) ?? Number.MAX_SAFE_INTEGER);
    });
  }, [
    schedules,
    equipmentById,
    search,
    statusFilter,
    showAllStatuses,
    typeFilter,
    labFilter,
    onlyMyEquipment,
    currentUserId,
  ]);
  const filteredMatrixSchedules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return schedules.filter((schedule) => {
      const item = equipmentById.get(String(schedule.peralatan_id));
      const matchesSearch = !query || [
        item?.nama_peralatan,
        item?.nomor_aset,
        schedule.jenis_jadwal,
        schedule.pic,
      ].some((value) => String(value || "").toLowerCase().includes(query));
      const matchesType = !typeFilter || schedule.jenis_jadwal === typeFilter;
      const matchesLab = !labFilter || String(item?.lab?.id) === labFilter;
      const matchesOwner = !onlyMyEquipment
        || (currentUserId != null
          && String(item?.ruangan?.pic_user_id) === String(currentUserId));
      return matchesSearch && matchesType && matchesLab && matchesOwner;
    });
  }, [schedules, equipmentById, search, typeFilter, labFilter, onlyMyEquipment, currentUserId]);
  const filterKey = `${search}-${statusFilter}-${typeFilter}-${labFilter}-${onlyMyEquipment}-${showAllStatuses}`;
  const schedulePagination = usePagination(filteredSchedules.length, filterKey);
  const equipmentGroups = useMemo(
    () => groupSchedulesByEquipment(filteredMatrixSchedules, equipmentById),
    [filteredMatrixSchedules, equipmentById],
  );
  const equipmentPagination = usePagination(equipmentGroups.length, filterKey);
  const summaryCards = useMemo(() => SCHEDULE_TYPES.map((type) => {
    const summary = schedules.reduce((counts, schedule) => {
      if (schedule.jenis_jadwal !== type.key) return counts;
      const state = getScheduleStatus(
        schedule,
        equipmentById.get(String(schedule.peralatan_id)),
      );
      if (state === "late") counts.late += 1;
      if (state === "urgent") counts.urgent += 1;
      if (state === "soon") counts.soon += 1;
      return counts;
    }, { late: 0, urgent: 0, soon: 0 });
    return { ...type, ...summary };
  }), [schedules, equipmentById]);

  function resetFilters() {
    setSearch("");
    setLabFilter("");
    setTypeFilter("");
    setStatusFilter("");
    setOnlyMyEquipment(false);
    setShowAllStatuses(false);
  }

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function createSchedule(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await jadwalPemeriksaanBerkalaApi.create({
        ...form,
        peralatan_id: Number(form.peralatan_id),
        interval_utama: Number(form.interval_utama),
        interval_tambahan: Number(form.interval_tambahan),
      });
      success(response.message || "Jadwal utama dan tambahan berhasil dibuat.");
      setForm(INITIAL_SCHEDULE_FORM);
      setShowCreateForm(false);
      await loadData();
    } catch (err) {
      error(err.message || "Gagal membuat jadwal pemeriksaan.");
    } finally {
      setSaving(false);
    }
  }

  function openRealization(schedule) {
    setRealizationTarget(schedule);
    setRealizationDate(getTodayInputValue());
  }

  async function saveRealization(event) {
    event.preventDefault();
    if (!realizationTarget || !realizationDate) return;
    setSaving(true);
    try {
      const response = await jadwalPemeriksaanBerkalaApi.updateRealisasi(
        realizationTarget.id,
        realizationDate,
      );
      success(response.message || "Realisasi dan jadwal berikutnya berhasil diperbarui.");
      setRealizationTarget(null);
      setRealizationDate("");
      await loadData();
    } catch (err) {
      error(err.message || "Gagal memperbarui realisasi jadwal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container fade-in-up">
      <PageHeader
        className="scheduling-page-header"
        eyebrow="PEMANTAUAN PERALATAN"
        title="Jadwal Pemeriksaan"
        subtitle="Pantau jadwal pemeriksaan dan catat realisasi peralatan."
        actions={(
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setRealizationTarget(null);
              setShowCreateForm(true);
            }}
            disabled={availableEquipment.length === 0}
          >
            Jadwal Baru
          </Button>
        )}
      />

      <ScheduleFormModal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={createSchedule}
        form={form}
        onChange={updateForm}
        availableEquipment={availableEquipment}
        saving={saving}
      />
      <ScheduleRealizationModal
        schedule={realizationTarget}
        date={realizationDate}
        onDateChange={setRealizationDate}
        onClose={() => setRealizationTarget(null)}
        onSubmit={saveRealization}
        saving={saving}
      />

      <section className="scheduling-summary" aria-label="Ringkasan jadwal">
        {summaryCards.map((summary) => (
          <SummaryCard
            key={summary.key}
            summary={summary}
            isSelected={typeFilter === summary.key}
            onClick={() => {
              setActiveView("actions");
              setStatusFilter("");
              setShowAllStatuses(false);
              setTypeFilter(typeFilter === summary.key ? "" : summary.key);
            }}
          />
        ))}
      </section>

      <section className="scheduling-workspace">
        <nav className="scheduling-tabs" aria-label="Tampilan jadwal">
          <button
            type="button"
            className={`scheduling-tab${activeView === "actions" ? " is-active" : ""}`}
            aria-pressed={activeView === "actions"}
            onClick={() => {
              setActiveView("actions");
              setStatusFilter("");
              setShowAllStatuses(false);
            }}
          >
            <span className="scheduling-tab-number">1</span>
            Daftar Tindakan
          </button>
          <button
            type="button"
            className={`scheduling-tab${activeView === "equipment" ? " is-active" : ""}`}
            aria-pressed={activeView === "equipment"}
            onClick={() => setActiveView("equipment")}
          >
            <span className="scheduling-tab-number">2</span>
            Per Alat
          </button>
        </nav>

        <TableFilters
          className="scheduling-filters"
          fields={[
            {
              id: "schedule-search",
              label: "Cari",
              type: "search",
              placeholder: "Nama peralatan, nomor aset, jenis, atau PIC",
              value: search,
              onChange: (event) => setSearch(event.target.value),
            },
            {
              id: "schedule-lab",
              label: "Lab",
              type: "select",
              placeholder: "Semua lab",
              value: labFilter,
              onChange: (event) => setLabFilter(event.target.value),
              options: labOptions,
            },
            {
              id: "schedule-type",
              label: "Jenis pemeriksaan",
              type: "select",
              placeholder: "Semua jenis",
              value: typeFilter,
              onChange: (event) => setTypeFilter(event.target.value),
              options: SCHEDULE_TYPES.map(({ key, label }) => ({ value: key, label })),
            },
          ]}
          actions={(
            <>
              <label className="scheduling-owner-filter">
                <input
                  type="checkbox"
                  checked={onlyMyEquipment}
                  onChange={(event) => setOnlyMyEquipment(event.target.checked)}
                />
                Hanya alat saya
              </label>
              <Button variant="secondary" onClick={resetFilters}>
                Atur ulang
              </Button>
            </>
          )}
        />
        {activeView === "actions" && (
          <div className="scheduling-status-filters" aria-label="Filter status jadwal">
            <button
              type="button"
              className={`scheduling-filter-chip is-need${!showAllStatuses && !statusFilter ? " is-selected" : ""}`}
              aria-pressed={!showAllStatuses && !statusFilter}
              onClick={() => {
                setStatusFilter("");
                setShowAllStatuses(false);
              }}
            >
              Perlu tindakan
            </button>
            <button
              type="button"
              className={`scheduling-filter-chip${showAllStatuses ? " is-selected" : ""}`}
              aria-pressed={showAllStatuses}
              onClick={() => {
                setStatusFilter("");
                setShowAllStatuses(true);
              }}
            >
              Semua
            </button>
            <span className="scheduling-chip-divider" aria-hidden="true" />
            {SCHEDULE_STATUS_CHIPS.map(({ key, label, icon: Icon }) => {
              const count = schedules.filter((schedule) => (
                getScheduleStatus(schedule, equipmentById.get(String(schedule.peralatan_id))) === key
              )).length;
              const selected = statusFilter === key;
              return (
                <button
                  type="button"
                  key={key}
                  className={`scheduling-filter-chip schedule-status-chip schedule-status--${key}${selected ? " is-selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => {
                    setShowAllStatuses(true);
                    setStatusFilter(selected ? "" : key);
                  }}
                >
                  <Icon size={14} aria-hidden="true" />
                  {label} <span>· {count}</span>
                </button>
              );
            })}
          </div>
        )}
        {activeView === "equipment" && (
          <div className="scheduling-equipment-heading">
            <span className="scheduling-equipment-heading-icon" aria-hidden="true">
              <Grid2X2 size={18} />
            </span>
            <div>
              <strong>Pemeriksaan per alat</strong>
              <span>Alat dengan masalah paling mendesak ada di atas</span>
            </div>
            <div className="scheduling-frequency-legend">
              <span><strong>Sering dipakai</strong> → Pengecekan Antara</span>
              <span><strong>Jarang dipakai</strong> → Pemeliharaan</span>
            </div>
          </div>
        )}
        {loading ? (
          <LoadingState message="Memuat jadwal..." />
        ) : loadError ? (
          <ErrorState
            title="Gagal memuat jadwal"
            message={loadError}
            onRetry={loadData}
          />
        ) : activeView === "actions" && filteredSchedules.length === 0 ? (
          <EmptyState
            icon={<CalendarClock size={28} />}
            title={
              search || statusFilter || typeFilter || labFilter || onlyMyEquipment
                ? "Jadwal tidak ditemukan"
                : "Belum ada jadwal pemeriksaan"
            }
            description={search || statusFilter || typeFilter || labFilter || onlyMyEquipment
              ? "Coba ubah atau atur ulang filter."
              : "Buat jadwal untuk mencatat pemeriksaan berkala peralatan."}
          />
        ) : activeView === "equipment" && equipmentGroups.length === 0 ? (
          <EmptyState
            icon={<CalendarClock size={28} />}
            title={search || typeFilter || labFilter || onlyMyEquipment ? "Peralatan tidak ditemukan" : "Belum ada jadwal pemeriksaan"}
            description="Buat jadwal untuk mengelompokkan pemeriksaan berdasarkan peralatan."
          />
        ) : activeView === "actions" ? (
          <ScheduleTable
            schedules={filteredSchedules}
            equipmentById={equipmentById}
            pagination={schedulePagination}
            onRecordRealization={openRealization}
          />
        ) : (
          <ScheduleEquipmentTable
            groups={equipmentGroups}
            pagination={equipmentPagination}
            onRecordRealization={openRealization}
          />
        )}
      </section>
    </div>
  );
}

function SummaryCard({ summary, isSelected, onClick }) {
  const Icon = summary.icon;
  return (
    <button
      type="button"
      className={`scheduling-summary-card${isSelected ? " is-selected" : ""}${summary.late ? " has-late" : ""}`}
      aria-pressed={isSelected}
      onClick={onClick}
    >
      <span className="scheduling-summary-heading">
        <span className="scheduling-summary-icon" aria-hidden="true"><Icon size={18} /></span>
        <span>
          <strong>{summary.label}</strong>
          <small>{summary.description}</small>
        </span>
      </span>
      <span className="scheduling-summary-late">
        <strong>{summary.late}</strong>
        <span>terlambat</span>
      </span>
      <span className="scheduling-summary-badges">
        <span className="schedule-status-chip schedule-status--urgent">{summary.urgent} mendesak</span>
        <span className="schedule-status-chip schedule-status--soon">{summary.soon} mendekati jatuh tempo</span>
      </span>
    </button>
  );
}
