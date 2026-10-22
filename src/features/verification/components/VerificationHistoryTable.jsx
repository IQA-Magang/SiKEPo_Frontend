import TableFilters from "../../../shared/components/ui/TableFilters.jsx";
import PaginatedDataTable from "../../../shared/components/ui/PaginatedDataTable.jsx";
import { ACTIVITY_OPTIONS, getActivityLabel } from "../verificationData.js";

export default function VerificationHistoryTable({
  items,
  pagination,
  columns,
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  activityFilter,
  onActivityChange,
  busy,
}) {
  return (
    <>
      <TableFilters
        fields={[
          {
            type: "search",
            id: "history-search",
            label: "Cari peralatan",
            placeholder: "Nama peralatan atau nomor aset",
            value: search,
            onChange: (event) => onSearchChange(event.target.value),
          },
          {
            type: "select",
            id: "history-status",
            label: "Status akhir",
            placeholder: "Semua status",
            value: statusFilter,
            onChange: (event) => onStatusChange(event.target.value),
            options: [
              { value: "Disetujui", label: "Disetujui" },
              { value: "Ditolak", label: "Ditolak" },
            ],
          },
          {
            type: "select",
            id: "history-activity",
            label: "Aktivitas",
            placeholder: "Semua aktivitas",
            value: activityFilter,
            onChange: (event) => onActivityChange(event.target.value),
            options: ACTIVITY_OPTIONS.map(([code]) => ({
              value: code,
              label: getActivityLabel(code),
            })),
          },
        ]}
      />
      <div className="table-card">
        <PaginatedDataTable
          columns={columns}
          rows={items}
          pagination={pagination}
          rowKey={(item) => item.id_verifikasi ?? item.id}
          wrapperClassName="table-borderless"
          emptyMessage={
            busy
              ? "Memuat data verifikasi..."
              : "Belum ada riwayat verifikasi yang selesai."
          }
        />
      </div>
    </>
  );
}
