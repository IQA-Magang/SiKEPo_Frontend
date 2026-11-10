import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Grid2X2,
  Plus,
  XCircle,
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
  getAllPemeriksaanSchedules,
  getEquipmentId,
  pengecekanAntaraApi,
  pemeliharaanApi,
  peralatanApi,
  ruanganApi,
} from "../../shared/services/api.js";
import { getUserRole, isStaffPengelola } from "../../shared/utils/permissions.js";
import InspectionTabs from "../inspection/InspectionTabs.jsx";
import ScheduleFormModal from "./components/ScheduleFormModal.jsx";
import ScheduleRealizationModal from "./components/ScheduleRealizationModal.jsx";
import ScheduleEquipmentTable from "./components/ScheduleEquipmentTable.jsx";
import ScheduleEquipmentDetailPanel from "./components/ScheduleEquipmentDetailPanel.jsx";
import ScheduleTable from "./components/ScheduleTable.jsx";
import {
  getDaysUntilDue,
  formatDate,
  getScheduleStatus,
  getScheduleStatusInfo,
  getScheduleStatusOrder,
  getTodayInputValue,
  groupSchedulesByEquipment,
  INITIAL_SCHEDULE_FORM,
} from "./schedulingData.js";
import "./scheduling.css";

const SCHEDULE_TYPES = [
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

export default function PengecekanAntaraPemeliharaan({ initialType = "" }) {
  const { success, error } = useToast();
  const currentUser = getCurrentUser();
  const userRole = getUserRole(currentUser);
  const canReviewSchedules = userRole === "manager" || userRole === "admin";
  const [schedules, setSchedules] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(() => ({
    ...INITIAL_SCHEDULE_FORM,
    jenis_jadwal: initialType,
  }));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [labFilter, setLabFilter] = useState("");
  const [onlyMyEquipment, setOnlyMyEquipment] = useState(false);
  const [showAllStatuses, setShowAllStatuses] = useState(true);
  const [activeView, setActiveView] = useState(() => (
    userRole === "manager" ? "review" : "actions"
  ));
  const [reviewNotes, setReviewNotes] = useState({});
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
  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);

  async function loadData() {
    setLoading(true);
    setLoadError("");
    try {
      const [scheduleData, equipmentResponse, roomResponse] = await Promise.all([
        getAllPemeriksaanSchedules(),
        peralatanApi.getAll(),
        ruanganApi.getAll(),
      ]);
      if (!Array.isArray(scheduleData)) {
        throw new Error("Format respons data jadwal tidak valid.");
      }
      if (!Array.isArray(equipmentResponse?.data)) {
        throw new Error("Format respons data peralatan tidak valid.");
      }
      if (!Array.isArray(roomResponse?.data)) {
        throw new Error("Format respons data ruangan tidak valid.");
      }
      setSchedules(scheduleData);
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

  useEffect(() => {
    setTypeFilter(initialType);
    setForm((previous) => ({
      ...previous,
      jenis_jadwal: initialType,
      frekuensi_penggunaan: "",
    }));
  }, [initialType]);

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
  const availableEquipment = Array.from(equipmentById.values()).filter((item) => {
    const id = getEquipmentId(item);
    return id != null && (!form.jenis_jadwal || !schedules.some((schedule) => (
      String(schedule.peralatan_id) === String(id)
      && schedule.jenis_jadwal === form.jenis_jadwal
    )));
  });
  const currentUserId = currentUser?.user_id ?? currentUser?.id;
  const canManageSchedules = getUserRole(currentUser) === "admin"
    || isStaffPengelola(currentUser);
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
    setTypeFilter(initialType);
    setStatusFilter("");
    setOnlyMyEquipment(false);
    setShowAllStatuses(true);
  }

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "frekuensi_penggunaan" && !initialType
        ? { jenis_jadwal: value === "tinggi" ? "pengecekan_antara" : "pemeliharaan" }
        : {}),
    }));
  }

  const pendingReviews = filteredMatrixSchedules.filter(
    (schedule) => schedule.status_realisasi === "Menunggu Verifikasi",
  );

  async function reviewSchedule(schedule, decision) {
    if (!canReviewSchedules) return;
    const note = reviewNotes[schedule.record_id] || "";
    if (decision === "ditolak" && !note.trim()) {
      error("Catatan wajib diisi untuk menolak hasil pemeriksaan.");
      return;
    }
    setSaving(true);
    try {
      const api = schedule.jenis_jadwal === "pengecekan_antara"
        ? pengecekanAntaraApi
        : pemeliharaanApi;
      const response = await api.review(schedule.record_id, {
        keputusan: decision,
        catatan: note.trim(),
      });
      success(response.message || "Tinjauan pemeriksaan berhasil disimpan.");
      setReviewNotes((previous) => {
        const next = { ...previous };
        delete next[schedule.record_id];
        return next;
      });
      await loadData();
    } catch (reviewError) {
      error(reviewError.message || "Gagal menyimpan tinjauan pemeriksaan.");
    } finally {
      setSaving(false);
    }
  }

  async function createSchedule(event) {
    event.preventDefault();
    if (!canManageSchedules) {
      error("Hanya pengelola peralatan yang dapat membuat jadwal.");
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
      success(response.message || "Jadwal berhasil dibuat.");
      setForm({ ...INITIAL_SCHEDULE_FORM, jenis_jadwal: initialType });
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
    setRealizationForm({
      tanggal_realisasi: getTodayInputValue(),
      acuan_pembanding: "",
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
      error("Hanya pengelola peralatan yang dapat mencatat hasil pemeriksaan.");
      return;
    }
    setSaving(true);
    try {
      const api = realizationTarget.jenis_jadwal === "pengecekan_antara"
        ? pengecekanAntaraApi
        : pemeliharaanApi;
      const response = await api.updateRealisasi(
        realizationTarget.record_id,
        {
          ...realizationForm,
          nilai_acuan: realizationForm.nilai_acuan === ""
            ? undefined
            : Number(realizationForm.nilai_acuan),
          batas_toleransi: realizationForm.batas_toleransi === ""
            ? undefined
            : Number(realizationForm.batas_toleransi),
          pembacaan: realizationForm.pembacaan.map(Number),
        },
      );
      success(response.message || "Hasil tersimpan dan telah diajukan ke Manager untuk verifikasi.");
      setRealizationTarget(null);
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
        title="Pengecekan & Pemeliharaan"
        subtitle="Kelola jadwal peralatan, catat hasil pemeriksaan, dan pantau persetujuan verifikasi."
        actions={canManageSchedules ? (
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setRealizationTarget(null);
              setForm({ ...INITIAL_SCHEDULE_FORM, jenis_jadwal: initialType });
              setShowCreateForm(true);
            }}
            disabled={availableEquipment.length === 0}
          >
            Jadwal Baru
          </Button>
        ) : null}
      />
      <InspectionTabs activeType={typeFilter} />

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
      <ScheduleRealizationModal
        schedule={realizationTarget}
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
      <ScheduleEquipmentDetailPanel
        equipment={selectedEquipment}
        schedules={selectedEquipmentSchedules}
        onClose={() => setSelectedEquipmentId(null)}
        onRecordRealization={openRealization}
        canManage={canManageSchedules}
      />

      <section className="scheduling-workspace">
        <nav className="scheduling-tabs" aria-label="Tampilan jadwal">
          {canReviewSchedules && (
            <button
              type="button"
              className={`scheduling-tab${activeView === "review" ? " is-active" : ""}`}
              aria-pressed={activeView === "review"}
              onClick={() => setActiveView("review")}
            >
              <CheckCircle2 size={16} aria-hidden="true" />
              Persetujuan Manager
              <span className="schedule-review-count">{pendingReviews.length}</span>
            </button>
          )}
          <button
            type="button"
            className={`scheduling-tab${activeView === "actions" ? " is-active" : ""}`}
            aria-pressed={activeView === "actions"}
            onClick={() => {
              setActiveView("actions");
              setStatusFilter("");
              setShowAllStatuses(true);
            }}
          >
            <CalendarClock size={16} aria-hidden="true" />
            Jadwal
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
            ...(!initialType ? [{
              id: "schedule-type",
              label: "Jenis pemeriksaan",
              type: "select",
              placeholder: "Semua jenis",
              value: typeFilter,
              onChange: (event) => setTypeFilter(event.target.value),
              options: SCHEDULE_TYPES.map(({ key, label }) => ({ value: key, label })),
            }] : []),
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
        ) : activeView === "review" && pendingReviews.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={28} />}
            title="Tidak ada hasil menunggu persetujuan"
            description="Pengajuan pengecekan antara atau pemeliharaan dari pengelola lab akan tampil di sini."
          />
        ) : activeView === "review" ? (
          <ScheduleReviewTable
            schedules={pendingReviews}
            equipmentById={equipmentById}
            reviewNotes={reviewNotes}
            onNoteChange={(id, value) => setReviewNotes((previous) => ({ ...previous, [id]: value }))}
            onReview={reviewSchedule}
            saving={saving}
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
            canManage={canManageSchedules}
          />
        ) : (
          <ScheduleEquipmentTable
            groups={equipmentGroups}
            pagination={equipmentPagination}
            onRecordRealization={openRealization}
            onOpenDetails={(id) => setSelectedEquipmentId(id)}
            canManage={canManageSchedules}
          />
        )}
      </section>
    </div>
  );
}

function ScheduleReviewTable({
  schedules,
  equipmentById,
  reviewNotes,
  onNoteChange,
  onReview,
  saving,
}) {
  return (
    <div className="schedule-review-list">
      {schedules.map((schedule) => {
        const equipment = equipmentById.get(String(schedule.peralatan_id));
        const isCheck = schedule.jenis_jadwal === "pengecekan_antara";
        const report = parseScheduleReport(isCheck ? schedule.data_pembacaan : schedule.daftar_pekerjaan);
        const tasks = Array.isArray(report) ? report : [];
        return (
          <article className="schedule-review-card" key={schedule.id}>
            <header className="schedule-review-card__header">
              <div>
                <span className="schedule-review-type">{isCheck ? "Pengecekan Antara" : "Pemeliharaan"}</span>
                <h3>{equipment?.nama_peralatan || `Peralatan #${schedule.peralatan_id}`}</h3>
                <span>{equipment?.nomor_aset || "Nomor aset tidak tersedia"} · diajukan {formatDate(schedule.tanggal_realisasi)}</span>
              </div>
              <span className="schedule-workflow-status is-pending">Menunggu persetujuan</span>
            </header>
            <div className="schedule-review-details">
              {isCheck ? (
                <>
                  <div><span>Acuan</span><strong>{schedule.acuan_pembanding || "—"}</strong></div>
                  <div><span>Nilai acuan</span><strong>{schedule.nilai_acuan ?? "—"}</strong></div>
                  <div><span>Batas toleransi</span><strong>{schedule.batas_toleransi ?? "—"}</strong></div>
                  <div><span>Simpangan maksimum</span><strong>{schedule.simpangan_maksimum ?? "—"}</strong></div>
                  <div className="schedule-review-details__wide">
                    <span>Lima hasil pembacaan</span>
                    <strong>{report?.pembacaan?.join(", ") || "Data pembacaan belum tersedia"}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div><span>Versi perangkat lunak</span><strong>{schedule.versi_perangkat_lunak || "—"}</strong></div>
                  <div><span>Menyentuh komponen</span><strong>{schedule.menyentuh_komponen ? "Ya" : "Tidak"}</strong></div>
                  <div className="schedule-review-details__wide">
                    <span>Pekerjaan</span>
                    <strong>{tasks.length ? tasks.join(", ") : "Daftar pekerjaan belum tersedia"}</strong>
                  </div>
                  <div className="schedule-review-details__wide">
                    <span>Temuan</span><strong>{schedule.temuan || "Tidak ada temuan"}</strong>
                  </div>
                </>
              )}
              <div><span>Hasil</span><strong>{schedule.hasil_realisasi || "—"}</strong></div>
            </div>
            <div className="schedule-review-card__actions">
              <textarea
                className="form-textarea"
                rows="2"
                value={reviewNotes[schedule.record_id] || ""}
                onChange={(event) => onNoteChange(schedule.record_id, event.target.value)}
                placeholder="Catatan Manager (wajib jika menolak)"
                aria-label={`Catatan tinjauan ${equipment?.nama_peralatan || "peralatan"}`}
              />
              <div>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<XCircle size={15} />}
                  disabled={saving}
                  onClick={() => onReview(schedule, "ditolak")}
                >
                  Tolak
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  icon={<CheckCircle2 size={15} />}
                  disabled={saving}
                  onClick={() => onReview(schedule, "disetujui")}
                >
                  Setujui
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
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
