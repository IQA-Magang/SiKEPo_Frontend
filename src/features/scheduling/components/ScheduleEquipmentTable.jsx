import { Button } from "../../../shared/components/ui/index.js";
import PaginatedDataTable from "../../../shared/components/ui/PaginatedDataTable.jsx";
import {
  formatDate,
  getDaysUntilDue,
  getEquipmentStatusInfo,
  getScheduleLabel,
  getScheduleStatus,
  getScheduleStatusInfo,
} from "../schedulingData.js";

const FREQUENCY_LABELS = {
  tinggi: { label: "Tinggi", detail: "Hampir setiap bulan" },
  sedang: { label: "Sedang", detail: "Tidak rutin tiap bulan" },
  rendah: { label: "Rendah", detail: "Paling banyak 6 kali setahun" },
};

export default function ScheduleEquipmentTable({
  groups,
  pagination,
  onRecordRealization,
}) {
  const columns = [
    {
      key: "equipment",
      header: "Alat",
      headerStyle: { minWidth: 185 },
      render: (group) => (
        <div className="schedule-equipment-identity">
          <code>{group.equipment?.nomor_aset || `ID ${group.id}`}</code>
          <strong>{group.equipment?.nama_peralatan || `Peralatan #${group.id}`}</strong>
          <span>
            Lab {group.equipment?.lab?.kode_labs || group.equipment?.lab?.nama_labs || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "frequency",
      header: "Frekuensi pemakaian",
      headerStyle: { width: 165 },
      render: (group) => {
        const frequency = [...group.mainSchedules, ...group.additionalSchedules]
          .find((schedule) => schedule.frekuensi_penggunaan)?.frekuensi_penggunaan;
        const detail = FREQUENCY_LABELS[frequency];
        return (
          <div className="schedule-frequency">
            <strong>{detail?.label || "Belum diatur"}</strong>
            <span>{detail?.detail || "Frekuensi belum tersedia"}</span>
          </div>
        );
      },
    },
    {
      key: "equipment_status",
      header: "Status alat",
      headerStyle: { minWidth: 130 },
      render: (group) => <EquipmentStatus equipment={group.equipment} />,
    },
    {
      key: "main",
      header: "Kalibrasi / Verifikasi Fungsi",
      headerStyle: { minWidth: 230 },
      render: (group) => (
        <ScheduleCells
          schedules={group.mainSchedules}
          equipment={group.equipment}
          onRecordRealization={onRecordRealization}
        />
      ),
    },
    {
      key: "checking",
      header: "Pengecekan Antara",
      headerStyle: { minWidth: 210 },
      render: (group) => (
        <ScheduleCells
          schedules={group.additionalSchedules.filter((schedule) => (
            schedule.jenis_jadwal === "pengecekan_antara"
          ))}
          equipment={group.equipment}
          onRecordRealization={onRecordRealization}
          emptyHint={group.frequency === "tinggi" ? "Jadwal belum dibuat" : "Alat tidak sering dipakai"}
        />
      ),
    },
    {
      key: "maintenance",
      header: "Pemeliharaan",
      headerStyle: { minWidth: 210 },
      render: (group) => (
        <ScheduleCells
          schedules={group.additionalSchedules.filter((schedule) => (
            schedule.jenis_jadwal === "pemeliharaan"
          ))}
          equipment={group.equipment}
          onRecordRealization={onRecordRealization}
          emptyHint={group.frequency && group.frequency !== "tinggi"
            ? "Jadwal belum dibuat"
            : "Alat tidak jarang dipakai"}
        />
      ),
    },
  ];

  const rows = groups.map((group) => ({
    ...group,
    frequency: [...group.mainSchedules, ...group.additionalSchedules]
      .find((schedule) => schedule.frekuensi_penggunaan)?.frekuensi_penggunaan,
  }));

  return (
    <PaginatedDataTable
      rows={rows}
      columns={columns}
      pagination={pagination}
      rowKey={(group) => group.id}
      wrapperClassName="table-borderless scheduling-equipment-table"
      emptyMessage="Tidak ada peralatan yang cocok dengan filter."
    />
  );
}

function EquipmentStatus({ equipment }) {
  const status = getEquipmentStatusInfo(equipment?.status_alat);
  return status.className === "is-ready"
    ? <span className="schedule-equipment-ready">{status.label}</span>
    : <span className={`schedule-equipment-state ${status.className}`}>{status.label}</span>;
}

function ScheduleCells({
  schedules,
  equipment,
  onRecordRealization,
  emptyHint = "Belum ada jadwal",
}) {
  if (schedules.length === 0) {
    return <span className="schedule-cell-empty">{emptyHint}</span>;
  }

  return (
    <div className="schedule-cell-list">
      {schedules.map((schedule) => {
        const state = getScheduleStatus(schedule, equipment);
        const status = getScheduleStatusInfo(state);
        const days = getDaysUntilDue(schedule.tanggal_jatuh_tempo);
        const dueLabel = days === null
          ? "Interval belum diisi"
          : state === "hold"
            ? "Dijeda selama perbaikan"
            : days < 0
              ? `${Math.abs(days)} hari lewat`
              : `${days} hari lagi`;
        return (
          <div className="schedule-cell" key={schedule.id}>
            <strong className="schedule-cell-type">{getScheduleLabel(schedule)}</strong>
            <span className={`schedule-status-chip ${status.className}`}>
              {state === "safe" && <span aria-hidden="true">✓ </span>}
              {status.label}
            </span>
            <div className="schedule-cell-date">
              <strong>{formatDate(schedule.tanggal_jatuh_tempo)}</strong>
              <span className={days !== null && days < 0 ? "is-overdue" : ""}>{dueLabel}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRecordRealization(schedule)}
            >
              Catat realisasi
            </Button>
          </div>
        );
      })}
    </div>
  );
}
