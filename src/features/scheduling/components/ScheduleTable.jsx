import { CheckCircle2 } from "lucide-react";
import { Button } from "../../../shared/components/ui/index.js";
import PaginatedDataTable from "../../../shared/components/ui/PaginatedDataTable.jsx";
import {
  formatDate,
  getFrequencyLabel,
  getDaysUntilDue,
  getEquipmentStatusInfo,
  getScheduleLabel,
  getScheduleStatus,
  getScheduleStatusInfo,
} from "../schedulingData.js";

export default function ScheduleTable({
  schedules,
  equipmentById,
  pagination,
  onRecordRealization,
  onOpenDetails,
}) {
  const columns = [
    {
      key: "asset",
      header: "Nomor aset",
      headerStyle: { minWidth: 110 },
      cellClassName: "schedule-table-asset",
      render: (schedule) => {
        const equipment = equipmentById.get(String(schedule.peralatan_id));
        return equipment?.nomor_aset || `#${schedule.peralatan_id}`;
      },
    },
    {
      key: "equipment",
      header: "Nama alat",
      headerStyle: { minWidth: 175 },
      render: (schedule) => {
        const equipment = equipmentById.get(String(schedule.peralatan_id));
        return (
          <div className="schedule-list-equipment">
            <button
              type="button"
              className="schedule-equipment-detail-trigger"
              onClick={() => onOpenDetails(schedule.peralatan_id)}
            >
              {equipment?.nama_peralatan || `Peralatan #${schedule.peralatan_id}`}
            </button>
            <span>
              Lab {equipment?.lab?.kode_labs || equipment?.lab?.nama_labs || "—"}
              {schedule.frekuensi_penggunaan
                ? ` · frekuensi ${getFrequencyLabel(schedule.frekuensi_penggunaan)}`
                : ""}
            </span>
          </div>
        );
      },
    },
    {
      key: "type",
      header: "Jenis pemeriksaan",
      headerStyle: { minWidth: 180 },
      render: (schedule) => (
        <div className="schedule-list-type">
          <strong>{getScheduleLabel(schedule)}</strong>
          <span>
            {[
              schedule.metode_kalibrasi || schedule.metode_verifikasi || schedule.jenis_pemeliharaan,
              schedule.interval_bulan ? `${schedule.interval_bulan} bulan` : "",
            ].filter(Boolean).join(" · ") || "—"}
          </span>
        </div>
      ),
    },
    {
      key: "last",
      header: "Terakhir",
      headerStyle: { minWidth: 120 },
      render: (schedule) => (
        <div className="schedule-list-type">
          <strong>{formatDate(schedule.tanggal_realisasi || schedule.tanggal_terakhir)}</strong>
          <span>{schedule.tanggal_realisasi ? "Realisasi" : "Tanggal tercatat"}</span>
        </div>
      ),
    },
    {
      key: "due",
      header: "Jatuh tempo",
      headerStyle: { minWidth: 135 },
      render: (schedule) => {
        const days = getDaysUntilDue(schedule.tanggal_jatuh_tempo);
        return (
          <div className="schedule-list-type">
            <strong>{formatDate(schedule.tanggal_jatuh_tempo)}</strong>
            <span className={days !== null && days < 0 ? "schedule-overdue" : ""}>
              {days === null
                ? "Jatuh tempo belum tersedia"
                : days < 0
                  ? `${Math.abs(days)} hari lewat`
                  : `${days} hari lagi`}
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status jatuh tempo",
      headerStyle: { minWidth: 150 },
      render: (schedule) => {
        const status = getScheduleStatusInfo(getScheduleStatus(schedule));
        return (
          <span className={`schedule-status-chip ${status.className}`}>
            {status.label}
          </span>
        );
      },
    },
    {
      key: "equipment_status",
      header: "Status alat",
      headerStyle: { minWidth: 125 },
      render: (schedule) => {
        const status = getEquipmentStatusInfo(
          equipmentById.get(String(schedule.peralatan_id))?.status_alat,
        );
        return status.className === "is-ready"
          ? <span className="schedule-equipment-ready">{status.label}</span>
          : <span className={`schedule-equipment-state ${status.className}`}>{status.label}</span>;
      },
    },
    {
      key: "actions",
      header: "Aksi",
      headerStyle: { width: 155, textAlign: "right" },
      cellStyle: { textAlign: "right", whiteSpace: "nowrap" },
      render: (schedule) => (
        <Button
          variant="secondary"
          size="sm"
          icon={<CheckCircle2 size={14} />}
          aria-label={`Catat hasil ${schedule.jenis_jadwal}`}
          onClick={() => onRecordRealization(schedule)}
        >
          Catat hasil
        </Button>
      ),
    },
  ];

  return (
    <PaginatedDataTable
      rows={schedules}
      columns={columns}
      pagination={pagination}
      rowKey={(schedule) => schedule.id}
      wrapperClassName="table-borderless scheduling-action-table"
      emptyMessage="Tidak ada jadwal yang cocok dengan pencarian."
    />
  );
}
