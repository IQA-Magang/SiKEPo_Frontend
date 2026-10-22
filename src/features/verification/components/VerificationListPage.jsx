import { useState } from "react";
import { ClipboardCheck, Eye, FileText, Printer } from "lucide-react";
import { usePagination } from "../../../shared/components/ui/Pagination.jsx";
import {
  exportVerificationPdf,
  exportVerificationWord,
} from "../../../shared/lib/verificationPdf.js";
import { getEquipmentId, getEquipmentLabId } from "../../../shared/services/api.js";
import { Button, Tabs } from "../../../shared/components/ui/index.js";
import WorkflowGuide from "../../../shared/components/ui/WorkflowGuide.jsx";
import { ACTIVITY_OPTIONS, getActivityLabel } from "../verificationData.js";
import VerificationHistoryTable from "./VerificationHistoryTable.jsx";
import PendingVerificationTable from "./PendingVerificationTable.jsx";
import ReviewVerificationTable from "./ReviewVerificationTable.jsx";

export default function VerificationListPage({
  pendingEquipment,
  items,
  labs,
  role,
  staffIsPengelola,
  canApprove,
  busy,
  onNavigate,
  onReview,
  onSelect,
}) {
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingCategoryFilter, setPendingCategoryFilter] = useState("");
  const [pendingActivityFilter, setPendingActivityFilter] = useState("");
  const [labFilter, setLabFilter] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewActivityFilter, setReviewActivityFilter] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("");
  const [historyActivityFilter, setHistoryActivityFilter] = useState("");

  const id = (item) => item.id_verifikasi ?? item.id;
  const pendingItems = pendingEquipment.filter((item) => {
    const query = pendingSearch.trim().toLocaleLowerCase("id-ID");
    const searchable = [
      item.nama_peralatan,
      item.nomor_aset,
      item.merek,
      item.tipe_model,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("id-ID");
    const category = item.kategori_peralatan?.nama_kategori || "Kategori Umum";
    return (
      (!query || searchable.includes(query)) &&
      (!pendingCategoryFilter || category === pendingCategoryFilter) &&
      (!pendingActivityFilter ||
        String(item.kode_aktivitas || "").toUpperCase() === pendingActivityFilter) &&
      (!labFilter ||
        String(getEquipmentLabId(item)) === String(labFilter))
    );
  });
  const reviewItems = items.filter((item) => item.status === "Diajukan");
  const filteredReviewItems = reviewItems.filter((item) => {
    const query = reviewSearch.trim().toLocaleLowerCase("id-ID");
    const searchable = [
      item.peralatan?.nama_peralatan,
      item.peralatan?.nomor_aset,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("id-ID");
    return (
      (!query || searchable.includes(query)) &&
      (!labFilter ||
        String(getEquipmentLabId(item.peralatan)) === String(labFilter)) &&
      (!reviewActivityFilter ||
        String(item.kode_aktivitas || "").toUpperCase() === reviewActivityFilter)
    );
  });
  const pendingCategories = [
    ...new Set(
      pendingEquipment.map(
        (item) => item.kategori_peralatan?.nama_kategori || "Kategori Umum",
      ),
    ),
  ].sort((first, second) => first.localeCompare(second, "id-ID"));
  const completedItems = items.filter(
    (item) => item.status === "Disetujui" || item.status === "Ditolak",
  );
  const historyItems = completedItems.filter((item) => {
    const query = historySearch.trim().toLocaleLowerCase("id-ID");
    const equipmentName = item.peralatan?.nama_peralatan || "";
    const assetNumber = item.peralatan?.nomor_aset || "";
    const searchable = `${equipmentName} ${assetNumber}`.toLocaleLowerCase("id-ID");
    return (
      (!query || searchable.includes(query)) &&
      (!labFilter ||
        String(getEquipmentLabId(item.peralatan)) === String(labFilter)) &&
      (!historyStatusFilter || item.status === historyStatusFilter) &&
      (!historyActivityFilter ||
        String(item.kode_aktivitas || "").toUpperCase() === historyActivityFilter)
    );
  });
  const pendingPagination = usePagination(
    pendingItems.length,
    `${pendingSearch}\u0000${pendingCategoryFilter}\u0000${pendingActivityFilter}\u0000${labFilter}`,
  );
  const reviewPagination = usePagination(
    filteredReviewItems.length,
    `${reviewSearch}\u0000${reviewActivityFilter}\u0000${labFilter}`,
  );
  const historyPagination = usePagination(historyItems.length, labFilter);
  const pendingColumns = [
    {
      key: "number",
      header: "No.",
      headerStyle: { width: 40 },
      cellStyle: { color: "var(--clr-dark-400)", width: 40 },
      render: (_, index) => pendingPagination.startIndex + index + 1,
    },
    {
      key: "asset",
      header: "No. Aset",
      render: (item) => (
        <code
          style={{
            fontSize: "var(--text-xs)",
            background: "var(--clr-dark-100)",
            padding: "2px 6px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {item.nomor_aset || "-"}
        </code>
      ),
    },
    {
      key: "name",
      header: "Nama Peralatan",
      render: (item) => (
        <>
          <div style={{ fontWeight: "var(--fw-medium)", color: "var(--clr-dark-900)" }}>
            {item.nama_peralatan}
          </div>
          {item.merek && (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-dark-400)" }}>
              {item.merek}{item.tipe_model ? ` — ${item.tipe_model}` : ""}
            </div>
          )}
        </>
      ),
    },
    {
      key: "category-location",
      header: "Kategori & Lokasi",
      render: (item) => (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--clr-dark-700)" }}>
          <div>{item.kategori_peralatan?.nama_kategori || "Kategori Umum"}</div>
          <div style={{ color: "var(--clr-dark-400)" }}>
            {[
              item.laboratorium?.nama_lab ||
                item.laboratorium?.nama_labs ||
                item.ruangan?.labs?.nama_labs ||
                item.ruangan?.labs?.nama_lab,
              item.ruangan?.nama_ruangan,
            ].filter(Boolean).join(" · ") || "Lokasi belum tersedia"}
          </div>
        </div>
      ),
    },
    {
      key: "description",
      header: "Keterangan",
      render: (item) => (
        <>
          {getActivityLabel(item.kode_aktivitas)}
          {item.status_verifikasi === "Ditolak" && (
            <small style={{ display: "block", marginTop: 4, color: "var(--clr-danger-600, #b91c1c)" }}>
              Perlu verifikasi ulang
            </small>
          )}
        </>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      cellProps: () => ({ onClick: (event) => event.stopPropagation() }),
      render: (item) => (
        (staffIsPengelola || role === "admin") && (
          <Button
            variant="primary"
            size="sm"
            icon={<ClipboardCheck size={14} />}
            onClick={() =>
              onNavigate(
                `/verifikasi/${getEquipmentId(item)}?returnTo=${encodeURIComponent("/verifikasi")}`,
              )
            }
            title="Mulai pengisian tahapan verifikasi alat"
          >
            {item.status_verifikasi === "Ditolak" ? "Verifikasi Ulang" : "Mulai Verifikasi"}
          </Button>
        )
      ),
    },
  ];
  const reviewColumns = [
    {
      key: "number",
      header: "#",
      headerStyle: { width: 40 },
      cellStyle: { color: "var(--clr-dark-400)", width: 40 },
      render: (_, index) => reviewPagination.startIndex + index + 1,
    },
    {
      key: "asset",
      header: "No. Aset",
      render: (item) => (
        <code className="verification-asset-number">{item.peralatan?.nomor_aset || "-"}</code>
      ),
    },
    {
      key: "equipment",
      header: "Peralatan",
      render: (item) => (
        <div style={{ fontWeight: "var(--fw-medium)" }}>
          {item.peralatan?.nama_peralatan || `Peralatan ID ${item.id_peralatan}`}
        </div>
      ),
    },
    {
      key: "submitted-at",
      header: "Tanggal Pengajuan",
      render: (item) =>
        item.tanggal_verifikasi
          ? new Date(item.tanggal_verifikasi).toLocaleDateString("id-ID")
          : "-",
    },
    {
      key: "description",
      header: "Keterangan",
      render: (item) => getActivityLabel(item.kode_aktivitas),
    },
    {
      key: "actions",
      header: "Aksi",
      render: (item) =>
        canApprove ? (
          <Button
            variant="primary"
            size="sm"
            icon={<ClipboardCheck size={13} />}
            onClick={() => onReview(item)}
          >
            Tinjau Pengajuan
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => onSelect(item)}>
            Lihat Pengajuan
          </Button>
        ),
    },
  ];
  const historyColumns = [
    {
      key: "number",
      header: "No",
      headerStyle: { width: 40 },
      cellStyle: { color: "var(--clr-dark-400)", width: 40 },
      render: (_, index) => historyPagination.startIndex + index + 1,
    },
    {
      key: "asset",
      header: "No. Aset",
      render: (item) => <code className="verification-asset-number">{item.peralatan?.nomor_aset || "-"}</code>,
    },
    {
      key: "equipment",
      header: "Peralatan",
      render: (item) => (
        <div style={{ fontWeight: "var(--fw-medium)" }}>
          {item.peralatan?.nama_peralatan || `Peralatan ID ${item.id_peralatan}`}
        </div>
      ),
    },
    {
      key: "verified-at",
      header: "Tanggal Verifikasi",
      render: (item) =>
        item.tanggal_verifikasi
          ? new Date(item.tanggal_verifikasi).toLocaleDateString("id-ID")
          : "-",
    },
    {
      key: "description",
      header: "Keterangan",
      render: (item) => getActivityLabel(item.kode_aktivitas),
    },
    {
      key: "actions",
      header: "Aksi",
      render: (item) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
          <Button
            variant="secondary"
            size="sm"
            icon={<Eye size={14} />}
            onClick={() => onSelect(item)}
          >
            Lihat
          </Button>
          {item.status === "Disetujui" && (canApprove || staffIsPengelola) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="verification-export-action"
                icon={<Printer size={14} />}
                onClick={() => exportVerificationPdf(item)}
                title="Export PDF (TLKM13/F/003)"
              >
                PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="verification-export-action"
                icon={<FileText size={14} />}
                onClick={() => exportVerificationWord(item)}
                title="Ekspor Word"
              >
                Word
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  // =========================================================================

  return (
    <div className="page-container fade-in-up">
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--sp-3)",
        }}
      >
        <div>
          <h1 className="page-title">Verifikasi Peralatan</h1>
        </div>
      </div>

      <WorkflowGuide
        title="Petunjuk Alur Verifikasi"
        description="Ikuti tahapan berikut sampai verifikasi peralatan disetujui."
        steps={[
          {
            title: "Penunjukan Pengelola",
            description:
              "Manager menetapkan staff sebagai Pengelola",
          },
          {
            title: "Pilih Peralatan",
            description:
              "Pengelola memilih peralatan",
          },
          {
            title: "Isi dan Ajukan",
            description:
              "Isi hasil pemeriksaan dan tanda tangan pengelola",
          },
          {
            title: "Tinjauan Manager",
            description:
              "Manager menyetujui atau menolak pengajuan",
          },
          {
            title: "Verifikasi Berhasil",
            description:
              "Peralatan telah diverifikasi",
          },
        ]}  
      />

      {/* Tabs Alur Verifikasi */}
      <Tabs
        className="tabs"
        ariaLabel="Alur verifikasi"
        activeId={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            id: "pending",
            label: `Menunggu Verifikasi pengelola (${pendingItems.length})`,
          },
          ...((canApprove || role === "staff")
            ? [{
                id: "review",
                label: `Menunggu Persetujuan Manager (${filteredReviewItems.length})`,
              }]
            : []),
          {
            id: "history",
            label: `Riwayat Verifikasi (${historyItems.length})`,
          },
        ]}
      />

      {/* Tabel Konten per Tab */}
      <div className="verification-table-content">
        {/* TAB 1: MENUNGGU VERIFIKASI (Alat Perlu Verifikasi) */}
        {activeTab === "pending" && (
          <PendingVerificationTable
            items={pendingItems}
            pagination={pendingPagination}
            columns={pendingColumns}
            search={pendingSearch}
            onSearchChange={setPendingSearch}
            categoryFilter={pendingCategoryFilter}
            onCategoryChange={setPendingCategoryFilter}
            categories={pendingCategories}
            labFilter={labFilter}
            onLabChange={setLabFilter}
            labs={labs}
            activityFilter={pendingActivityFilter}
            onActivityChange={setPendingActivityFilter}
            busy={busy}
            onNavigate={onNavigate}
          />
        )}
        {/* TAB 2: PERSETUJUAN VERIFIKASI (Menunggu Persetujuan Manager) */}
        {activeTab === "review" && (
          <ReviewVerificationTable
            items={filteredReviewItems}
            pagination={reviewPagination}
            columns={reviewColumns}
            search={reviewSearch}
            onSearchChange={setReviewSearch}
            labFilter={labFilter}
            onLabChange={setLabFilter}
            labs={labs}
            activityFilter={reviewActivityFilter}
            onActivityChange={setReviewActivityFilter}
            busy={busy}
          />
        )}
        {/* TAB 3: RIWAYAT VERIFIKASI (Disetujui / Ditolak) */}
        {activeTab === "history" && (
          <VerificationHistoryTable
            items={historyItems}
            pagination={historyPagination}
            columns={historyColumns}
            search={historySearch}
            onSearchChange={setHistorySearch}
            labFilter={labFilter}
            onLabChange={setLabFilter}
            labs={labs}
            statusFilter={historyStatusFilter}
            onStatusChange={setHistoryStatusFilter}
            activityFilter={historyActivityFilter}
            onActivityChange={setHistoryActivityFilter}
            busy={busy}
          />
        )}
      </div>


    </div>
  );
}
