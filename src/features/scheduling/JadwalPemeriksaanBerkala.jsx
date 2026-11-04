import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Grid2X2,
  Plus,
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
import ScheduleEquipmentDetailPanel from "./components/ScheduleEquipmentDetailPanel.jsx";
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
  { key: "kalibrasi", label: "Kalibrasi" },
  { key: "verifikasi_fungsi", label: "Verifikasi Fungsi" },
  { key: "pengecekan_antara", label: "Pengecekan Antara" },
  { key: "pemeliharaan", label: "Pemeliharaan" },
];

const SCHEDULE_STATUS_OPTIONS = [
  { key: "late", label: "Terlambat" },
  { key: "urgent", label: "Mendesak" },
  { key: "soon", label: "Mendekati jatuh tempo" },
  { key: "unset", label: "Belum diatur" },
  { key: "safe", label: "Aman" },
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
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);

  async function loadData() {
    setLoading(true);
    setLoadError("");
    try {
      const [scheduleResponse, equipmentResponse, roomResponse] = await Promise.all([
        jadwalPemeriksaanBerkalaApi.getAll(),
        peralatanApi.getAll(),
        ruanganApi.getAll(),
      ]);
      if (!Array.isArray(scheduleResponse?.data)) {
        throw new Error("Format respons data jadwal tidak valid.");
      }
      if (!Array.isArray(equipmentResponse?.data)) {
        throw new Error("Format respons data peralatan tidak valid.");
      }
      if (!Array.isArray(roomResponse?.data)) {
        throw new Error("Format respons data ruangan tidak valid.");
      }
      setSchedules(scheduleResponse.data);
      setEquipment(equipmentResponse.data);
      setRooms(roomResponse.data);
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
  const selectedEquipment = selectedEquipmentId == null
    ? null
    : equipmentById.get(String(selectedEquipmentId)) || null;
  const selectedEquipmentSchedules = useMemo(
    () => schedules.filter((schedule) => (
      String(schedule.peralatan_id) === String(selectedEquipmentId)
    )),
    [schedules, selectedEquipmentId],
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
      const state = getScheduleStatus(schedule);
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
      const statusDifference = getScheduleStatusOrder(getScheduleStatus(left))
        - getScheduleStatusOrder(getScheduleStatus(right));
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
        title="Penjadwalan"
        subtitle="Atur jadwal pemeriksaan berkala dan catat realisasi peralatan."
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
      <ScheduleEquipmentDetailPanel
        equipment={selectedEquipment}
        schedules={selectedEquipmentSchedules}
        onClose={() => setSelectedEquipmentId(null)}
        onRecordRealization={openRealization}
      />

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
            <CalendarClock size={16} aria-hidden="true" />
            Daftar Peralatan
          </button>
          <button
            type="button"
            className={`scheduling-tab${activeView === "equipment" ? " is-active" : ""}`}
            aria-pressed={activeView === "equipment"}
            onClick={() => setActiveView("equipment")}
          >
            <Grid2X2 size={16} aria-hidden="true" />
            Per Alat
          </button>
        </nav>

        <TableFilters
          className={`scheduling-filters${activeView === "actions" ? " has-status-filter" : ""}`}
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
            ...(activeView === "actions"
              ? [{
                id: "schedule-status",
                label: "Status jadwal",
                type: "select",
                placeholder: "Perlu tindakan",
                value: statusFilter || (showAllStatuses ? "all" : "needs_action"),
                onChange: (event) => {
                  const { value } = event.target;
                  setShowAllStatuses(value !== "needs_action");
                  setStatusFilter(value === "all" || value === "needs_action" ? "" : value);
                },
                options: [
                  { value: "needs_action", label: "Perlu tindakan" },
                  { value: "all", label: "Semua status" },
                  ...SCHEDULE_STATUS_OPTIONS.map(({ key, label }) => {
                    const count = schedules.filter((schedule) => (
                      getScheduleStatus(schedule) === key
                    )).length;
                    return { value: key, label: `${label} (${count})` };
                  }),
                ],
              }]
              : []),
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
            onOpenDetails={(id) => setSelectedEquipmentId(id)}
          />
        ) : (
          <ScheduleEquipmentTable
            groups={equipmentGroups}
            pagination={equipmentPagination}
            onRecordRealization={openRealization}
            onOpenDetails={(id) => setSelectedEquipmentId(id)}
          />
        )}
      </section>
    </div>
  );
}
