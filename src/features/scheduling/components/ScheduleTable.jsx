import { CheckCircle2 } from "lucide-react";
import { Button } from "../../../shared/components/ui/index.js";
import PaginatedDataTable from "../../../shared/components/ui/PaginatedDataTable.jsx";
import {
  formatDate,
  getDueStatus,
  getScheduleLabel,
} from "../schedulingData.js";

export default function ScheduleTable({
  schedules,
  equipmentById,
  pagination,
  onRecordRealization,
}) {
  const columns = [
    {
      key: "number",
      header: "#",
      headerStyle: { width: 48 },
      cellStyle: { color: "var(--clr-dark-400)" },
      render: (_, index) => pagination.startIndex + index + 1,
    },
    {
      key: "equipment",
      header: "Peralatan",
      headerStyle: { minWidth: 190 },
      render: (schedule) => {
        const item = equipmentById.get(String(schedule.peralatan_id));
        return (
          <div>
            <div style={{ fontWeight: "var(--fw-medium)", color: "var(--clr-dark-900)" }}>
              {item?.nama_peralatan || `Peralatan #${schedule.peralatan_id}`}
            </div>
            <code style={{ fontSize: "var(--text-xs)", color: "var(--clr-dark-500)" }}>
              {item?.nomor_aset || "Nomor aset tidak tersedia"}
            </code>
          </div>
        );
      },
    },
    {
      key: "jenis_jadwal",
      header: "Jenis Pemeriksaan",
      headerStyle: { minWidth: 160 },
      render: (schedule) => (
        <div>
          <div>{getScheduleLabel(schedule)}</div>
          <small style={{ color: "var(--clr-dark-500)" }}>
            {schedule.peran_jadwal === "utama" ? "Jadwal utama" : "Jadwal tambahan"}
          </small>
        </div>
      ),
    },
    {
      key: "interval_bulan",
      header: "Interval",
      headerStyle: { width: 100 },
      render: (schedule) => `${schedule.interval_bulan} bulan`,
    },
    {
      key: "tanggal_terakhir",
      header: "Terakhir",
      render: (schedule) => formatDate(schedule.tanggal_terakhir),
    },
    {
      key: "tanggal_jatuh_tempo",
      header: "Jatuh Tempo",
      headerStyle: { minWidth: 170 },
      render: (schedule) => {
        const status = getDueStatus(schedule.tanggal_jatuh_tempo);
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            <span className={`badge ${status.className}`}>{status.label}</span>
            <small style={{ color: "var(--clr-dark-500)" }}>
              {formatDate(schedule.tanggal_jatuh_tempo)}
            </small>
          </div>
        );
      },
    },
    { key: "pic", header: "PIC", render: (schedule) => schedule.pic || "–" },
    {
      key: "actions",
      header: "Aksi",
      headerStyle: { width: 170 },
      render: (schedule) => (
        <div className="table-action-btns">
          <Button
            variant="secondary"
            size="sm"
            icon={<CheckCircle2 size={14} />}
            onClick={() => onRecordRealization(schedule)}
          >
            Catat Realisasi
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PaginatedDataTable
      rows={schedules}
      columns={columns}
      pagination={pagination}
      rowKey={(schedule) => schedule.id}
      wrapperClassName="table-borderless"
      emptyMessage="Tidak ada jadwal yang cocok dengan pencarian."
    />
  );
}
