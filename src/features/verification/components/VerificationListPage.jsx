import { useState } from "react";
import { ClipboardCheck, Eye, FileText, Printer } from "lucide-react";
import { usePagination } from "../../../shared/components/ui/Pagination.jsx";
import {
  exportVerificationPdf,
  exportVerificationWord,
} from "../../../shared/lib/verificationPdf.js";
import { getEquipmentId } from "../../../shared/services/api.js";
import { ACTIVITY_OPTIONS, getActivityLabel } from "../verificationData.js";
import VerificationHistoryTable from "./VerificationHistoryTable.jsx";
import PendingVerificationTable from "./PendingVerificationTable.jsx";
import ReviewVerificationTable from "./ReviewVerificationTable.jsx";

export default function VerificationListPage({
  pendingEquipment,
  items,
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
        String(item.kode_aktivitas || "").toUpperCase() === pendingActivityFilter)
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
      (!historyStatusFilter || item.status === historyStatusFilter) &&
      (!historyActivityFilter ||
        String(item.kode_aktivitas || "").toUpperCase() === historyActivityFilter)
    );
  });
  const pendingPagination = usePagination(
    pendingItems.length,
    `${pendingSearch}\u0000${pendingCategoryFilter}\u0000${pendingActivityFilter}`,
  );
  const reviewPagination = usePagination(
    filteredReviewItems.length,
    `${reviewSearch}\u0000${reviewActivityFilter}`,
  );
  const historyPagination = usePagination(historyItems.length);
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
          <button
            className="btn btn-primary btn-sm"
            onClick={() =>
              onNavigate(
                `/verifikasi/${getEquipmentId(item)}?returnTo=${encodeURIComponent("/verifikasi")}`,
              )
            }
            title="Mulai pengisian tahapan verifikasi alat"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <ClipboardCheck size={14} />
            {item.status_verifikasi === "Ditolak" ? "Verifikasi Ulang" : "Mulai Verifikasi"}
          </button>
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
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onReview(item)}
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <ClipboardCheck size={13} /> Tinjau Pengajuan
          </button>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={() => onSelect(item)}>
            Lihat Pengajuan
          </button>
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
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onSelect(item)}
            style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
          >
            <Eye size={14} /> Lihat
          </button>
          {item.status === "Disetujui" && (canApprove || staffIsPengelola) && (
            <>
              <button
                className="btn btn-ghost btn-sm verification-export-action"
                onClick={() => exportVerificationPdf(item)}
                title="Export PDF (TLKM13/F/003)"
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <Printer size={14} /> PDF
              </button>
              <button
                className="btn btn-ghost btn-sm verification-export-action"
                onClick={() => exportVerificationWord(item)}
                title="Ekspor Word"
                style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
              >
                <FileText size={14} /> Word
              </button>
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

      {/* Tabs Alur Verifikasi */}
      <div className="tabs" style={{ flexWrap: "wrap" }}>
        <button
          className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Menunggu Verifikasi ({pendingItems.length})
        </button>
        {(canApprove || role === "staff") && (
          <button
            className={`tab-btn ${activeTab === "review" ? "active" : ""}`}
            onClick={() => setActiveTab("review")}
          >
            Menunggu Persetujuan Manager ({filteredReviewItems.length})
          </button>
        )}
        <button
          className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Riwayat Verifikasi ({historyItems.length})
        </button>
      </div>

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
