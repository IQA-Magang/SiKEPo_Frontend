import TableFilters from "../../../shared/components/ui/TableFilters.jsx";
import PaginatedDataTable from "../../../shared/components/ui/PaginatedDataTable.jsx";
import { getEquipmentId } from "../../../shared/services/api.js";
import { ACTIVITY_OPTIONS, getActivityLabel } from "../verificationData.js";

export default function PendingVerificationTable({
  items,
  pagination,
  columns,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories,
  labFilter,
  onLabChange,
  labs,
  activityFilter,
  onActivityChange,
  busy,
  onNavigate,
}) {
  return (
    <>
      <TableFilters
        fields={[
          {
            type: "search",
            id: "pending-search",
            label: "Cari peralatan",
            placeholder: "Nama, nomor aset, atau merek",
            value: search,
            onChange: (event) => onSearchChange(event.target.value),
          },
          {
            type: "select",
            id: "pending-category",
            label: "Kategori",
            placeholder: "Semua kategori",
            value: categoryFilter,
            onChange: (event) => onCategoryChange(event.target.value),
            options: categories.map((category) => ({
              value: category,
              label: category,
            })),
          },
          {
            type: "select",
            id: "pending-laboratory",
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
            id: "pending-activity",
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
          rowKey={(item) => getEquipmentId(item)}
          wrapperClassName="table-borderless"
          rowProps={(item) => {
            const equipmentId = getEquipmentId(item);
            const detailPath = `/peralatan/detail/${equipmentId}?returnTo=${encodeURIComponent("/verifikasi")}`;
            return {
              className: "cursor-pointer",
              onClick: () => onNavigate(detailPath),
              onKeyDown: (event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onNavigate(detailPath);
                }
              },
              tabIndex: 0,
              role: "link",
              "aria-label": `Lihat detail ${item.nama_peralatan}`,
            };
          }}
          emptyMessage={
            busy
              ? "Memuat data peralatan..."
              : "Tidak ada peralatan yang menunggu verifikasi."
          }
        />
      </div>
    </>
  );
}
