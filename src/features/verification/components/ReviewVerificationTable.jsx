import TableFilters from "../../../shared/components/ui/TableFilters.jsx";
import PaginatedDataTable from "../../../shared/components/ui/PaginatedDataTable.jsx";
import { ACTIVITY_OPTIONS, getActivityLabel } from "../verificationData.js";

export default function ReviewVerificationTable({
  items,
  pagination,
  columns,
  search,
  onSearchChange,
  labFilter,
  onLabChange,
  labs,
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
            id: "review-search",
            label: "Cari peralatan",
            placeholder: "Nama peralatan atau nomor aset",
            value: search,
            onChange: (event) => onSearchChange(event.target.value),
          },
          {
            type: "select",
            id: "review-laboratory",
            label: "Laboratorium",
            placeholder: "Semua laboratorium",
            value: labFilter,
            onChange: (event) => onLabChange(event.target.value),
            options: labs.map((lab) => ({
              value: String(lab.id),
              label: lab.nama_labs || lab.nama_lab || `Laboratorium ${lab.id}`,
            })),
          },
          {
            type: "select",
            id: "review-activity",
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
              : "Belum ada pengajuan verifikasi yang menunggu persetujuan Manager."
          }
        />
      </div>
    </>
  );
}
