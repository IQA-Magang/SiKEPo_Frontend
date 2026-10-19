import React, { useEffect, useMemo, useState } from "react";
import { CalendarClock, Plus } from "lucide-react";
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
  getEquipmentId,
  jadwalPemeriksaanBerkalaApi,
  peralatanApi,
} from "../../shared/services/api.js";
import ScheduleFormModal from "./components/ScheduleFormModal.jsx";
import ScheduleRealizationModal from "./components/ScheduleRealizationModal.jsx";
import ScheduleTable from "./components/ScheduleTable.jsx";
import { getTodayInputValue, INITIAL_SCHEDULE_FORM } from "./schedulingData.js";

export default function JadwalPemeriksaanBerkala() {
  const { success, error } = useToast();
  const [schedules, setSchedules] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(INITIAL_SCHEDULE_FORM);
  const [search, setSearch] = useState("");
  const [realizationTarget, setRealizationTarget] = useState(null);
  const [realizationDate, setRealizationDate] = useState("");

  async function loadData() {
    setLoading(true);
    setLoadError("");
    try {
      const [scheduleResponse, equipmentResponse] = await Promise.all([
        jadwalPemeriksaanBerkalaApi.getAll(),
        peralatanApi.getAll(),
      ]);
      setSchedules(Array.isArray(scheduleResponse.data) ? scheduleResponse.data : []);
      setEquipment(Array.isArray(equipmentResponse.data) ? equipmentResponse.data : []);
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
    () => new Map(equipment.map((item) => [String(getEquipmentId(item)), item])),
    [equipment],
  );
  const scheduledEquipmentIds = useMemo(
    () => new Set(schedules.map((item) => String(item.peralatan_id))),
    [schedules],
  );
  const availableEquipment = equipment.filter((item) => {
    const id = getEquipmentId(item);
    return id != null && !scheduledEquipmentIds.has(String(id));
  });

  const filteredSchedules = schedules.filter((schedule) => {
    const equipmentItem = equipmentById.get(String(schedule.peralatan_id));
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [
      equipmentItem?.nama_peralatan,
      equipmentItem?.nomor_aset,
      schedule.jenis_jadwal,
      schedule.pic,
    ].some((value) => String(value || "").toLowerCase().includes(query));
  });
  const pagination = usePagination(filteredSchedules.length, search);

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
        title="Penjadwalan Pemeriksaan Berkala"
        subtitle="Kelola jadwal utama dan tambahan, lalu catat realisasi untuk menghitung jatuh tempo berikutnya."
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
            Buat Jadwal
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

      <div className="table-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Daftar Jadwal</h2>
            <p className="page-subtitle">{schedules.length} jadwal tercatat</p>
          </div>
        </div>
        <TableFilters
          fields={[{
            id: "schedule-search",
            label: "Cari jadwal",
            type: "search",
            placeholder: "Nama peralatan, nomor aset, jenis, atau PIC",
            value: search,
            onChange: (event) => setSearch(event.target.value),
          }]}
        />
        {loading ? (
          <LoadingState message="Memuat jadwal..." />
        ) : loadError ? (
          <ErrorState
            title="Gagal memuat jadwal"
            message={loadError}
            onRetry={loadData}
          />
        ) : filteredSchedules.length === 0 ? (
          <EmptyState
            icon={<CalendarClock size={28} />}
            title={search ? "Jadwal tidak ditemukan" : "Belum ada jadwal pemeriksaan"}
            description={
              search
                ? undefined
                : "Buat jadwal untuk mencatat pemeriksaan utama dan pemeriksaan tambahan peralatan."
            }
          />
        ) : (
          <ScheduleTable
            schedules={filteredSchedules}
            equipmentById={equipmentById}
            pagination={pagination}
            onRecordRealization={openRealization}
          />
        )}
      </div>
    </div>
  );
}
