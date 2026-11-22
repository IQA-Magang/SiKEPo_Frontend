import React, { useState, useEffect } from "react";
import {
  ClipboardCheck,
  Download,
  Package,
  Plus,
  RotateCcw,
  Hand,
  Upload,
  X,
} from "lucide-react";
import {
  getEquipmentId,
  getEquipmentCategoryId,
  peralatanApi,
  labsApi,
  ruanganApi,
  peminjamanApi,
  getEquipmentLabId,
  STATUS_BADGE_CLASS,
} from "../../shared/services/api.js";
import { ACCESS, ACTIONS, can } from "../../shared/utils/permissions.js";
import { usePagination } from "../../shared/components/ui/Pagination.jsx";
import PaginatedDataTable from "../../shared/components/ui/PaginatedDataTable.jsx";
import TableFilters from "../../shared/components/ui/TableFilters.jsx";
import WorkflowGuide from "../../shared/components/ui/WorkflowGuide.jsx";
import { useToast } from "../../app/providers/ToastContext.jsx";

// ------------------------------------------------------------------
// Daftar Peralatan
// ------------------------------------------------------------------
export default function EquipmentList({
  onNavigate,
  initialLifecycle = "all",
  returnPath = "/peralatan",
}) {
  const canCreate = can(ACCESS.INPUT_EQUIPMENT, ACTIONS.ADD);
  const { success, error: showError } = useToast();
  const canViewVerification = can(ACCESS.EQUIPMENT_ELIGIBILITY, ACTIONS.VIEW);
  const canRequestLoan = can(ACCESS.LOAN_REQUEST, ACTIONS.ADD);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKat, setFilterKat] = useState("");
  const [filterLab, setFilterLab] = useState("");
  const [lifecycleView, setLifecycleView] = useState(initialLifecycle);
  const [labs, setLabs] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [jadwal, setJadwal] = useState([]);
  const [bulkPanelOpen, setBulkPanelOpen] = useState(false);
  const [templateDownloading, setTemplateDownloading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkWorkbook, setBulkWorkbook] = useState(null);
  const [bulkAttachments, setBulkAttachments] = useState([]);
  const [bulkUploadError, setBulkUploadError] = useState("");
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkInputKey, setBulkInputKey] = useState(0);
  const hariIni = new Date();
  const hariIniStr = `${hariIni.getFullYear()}-${String(hariIni.getMonth() + 1).padStart(2, "0")}-${String(hariIni.getDate()).padStart(2, "0")}`;
  const jadwalPerAlat = new Map();
  for (const j of jadwal) {
    const pid = String(j.peralatan_id);
    if (!jadwalPerAlat.has(pid)) jadwalPerAlat.set(pid, []);
    jadwalPerAlat.get(pid).push(j);
  }
  function formatTgl(dateStr) {
    if (!dateStr) return "";
    const d = String(dateStr).slice(0, 10);
    const parts = d.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }

  function isCurrentlyOut(p) {
    const pid = String(getEquipmentId(p));
    const ranges = jadwalPerAlat.get(pid) || [];
    for (const r of ranges) {
      if (
        hariIniStr >= r.rencana_tanggal_keluar &&
        hariIniStr <= r.rencana_tanggal_kembali
      )
        return r;
    }
    if (p.status_alat === "Dipinjam" && ranges.length > 0) {
      return ranges[0];
    }
    return null;
  }

  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    setLifecycleView(initialLifecycle);
  }, [initialLifecycle]);

  async function loadData() {
    setLoading(true);
    try {
      const [res, roomsRes, labsRes, jadwalRes] = await Promise.all([
        peralatanApi.getAll(),
        ruanganApi.getAll().catch((err) => {
          console.error("Gagal memuat lokasi peralatan:", err);
          return { data: [] };
        }),
        labsApi.getAll().catch((err) => {
          console.error("Gagal memuat laboratorium:", err);
          return { data: [] };
        }),
        peminjamanApi.getAllJadwal().catch(() => ({ data: [] })),
      ]);
      setList(res.data || []);
      setRooms(roomsRes.data || []);
      setLabs(labsRes.data || []);
      setJadwal(jadwalRes.data || []);
    } catch (err) {
      console.error("Gagal memuat peralatan:", err);
    } finally {
      setLoading(false);
    }
  }

  async function downloadBulkTemplate() {
    setTemplateDownloading(true);
    try {
      const blob = await peralatanApi.downloadBulkTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "template-upload-peralatan.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
    } catch (downloadError) {
      showError(downloadError.message || "Gagal mengunduh template Excel.");
    } finally {
      setTemplateDownloading(false);
    }
  }

  async function submitBulkUpload(event) {
    event.preventDefault();
    if (!canCreate || !bulkWorkbook) return;
    setBulkUploading(true);
    setBulkUploadError("");
    setBulkResult(null);
    try {
      const result = await peralatanApi.uploadBulk(bulkWorkbook, bulkAttachments);
      setBulkResult(result);
      setBulkWorkbook(null);
      setBulkAttachments([]);
      setBulkInputKey((key) => key + 1);
      await loadData();
      if (result.gagal > 0) {
        showError(`${result.message}. Periksa rincian baris yang gagal.`);
      } else {
        success(result.message || "Upload peralatan berhasil.");
      }
    } catch (uploadError) {
      setBulkUploadError(uploadError.message || "Gagal mengunggah data peralatan.");
    } finally {
      setBulkUploading(false);
    }
  }

  function addBulkAttachments(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selected.length) return;
    const names = new Set(bulkAttachments.map((file) => file.name.toLowerCase()));
    const duplicate = selected.find((file) => {
      const name = file.name.toLowerCase();
      if (names.has(name)) return true;
      names.add(name);
      return false;
    });
    if (duplicate) {
      setBulkUploadError(`Nama lampiran duplikat: ${duplicate.name}`);
      return;
    }
    setBulkAttachments((files) => [...files, ...selected]);
    setBulkUploadError("");
  }

  // Filter
  const roomsById = new Map(rooms.map((room) => [String(room.id), room]));
  const filtered = list.filter((p) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      p.nama_peralatan?.toLowerCase().includes(q) ||
      p.nomor_aset?.toLowerCase().includes(q) ||
      p.merek?.toLowerCase().includes(q);
    const catId = getEquipmentCategoryId(p);
    const matchKat = !filterKat || String(catId) === filterKat;
    const labId = getEquipmentLabId(p, roomsById);
    const matchLab = !filterLab || String(labId) === filterLab;
    const approved = p.status_verifikasi === "Disetujui";
    // Peralatan yang sedang dikalibrasi tetap tampil di daftar utama.
    const available = ["Aktif", "Dipinjam", "Dalam Kalibrasi"].includes(
      p.status_alat,
    );
    const rejected = p.status_verifikasi === "Ditolak";
    const activityCode = String(p.kode_aktivitas || "")
      .trim()
      .toUpperCase();
    const pending =
      !approved &&
      !rejected &&
      (activityCode === "A1" ||
        (activityCode === "A2" &&
          p.status_verifikasi === "Belum Diverifikasi"));
    const followUpVerification =
      ["Draft", "Diajukan"].includes(p.status_verifikasi) &&
      activityCode !== "" &&
      activityCode !== "A1";
    const returnedFromLoanAwaitingVerification =
      activityCode === "A3" &&
      p.status_verifikasi === "Belum Diverifikasi";
    const awaitingPostCalibrationVerification =
      activityCode === "A2" &&
      p.status_verifikasi === "Belum Diverifikasi";
    const matchLifecycle =
      lifecycleView === "pending"
        ? pending
        : lifecycleView === "review"
          ? rejected
          : (available && approved) ||
            followUpVerification ||
            returnedFromLoanAwaitingVerification ||
            awaitingPostCalibrationVerification;
    return matchQ && matchKat && matchLab && matchLifecycle;
  });
  const pagination = usePagination(
    filtered.length,
    `${search}\u0000${filterKat}\u0000${filterLab}\u0000${lifecycleView}`,
  );
  const columns = [
    {
      key: "number",
      header: "No.",
      headerStyle: { width: 40 },
      cellStyle: { color: "var(--clr-dark-400)", width: 40 },
      render: (_, index) => pagination.startIndex + index + 1,
    },
    {
      key: "asset",
      header: "No. Aset",
      render: (equipment) => (
        <code
          style={{
            fontSize: "var(--text-xs)",
            background: "var(--clr-dark-100)",
            padding: "2px 6px",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {equipment.nomor_aset || "–"}
        </code>
      ),
    },
    {
      key: "name",
      header: "Nama Peralatan",
      render: (equipment) => (
        <>
          <div
            style={{
              fontWeight: "var(--fw-medium)",
              color: "var(--clr-dark-900)",
            }}
          >
            {equipment.nama_peralatan}
          </div>
          {(equipment.merek || equipment.tipe_model) && (
            <div
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--clr-dark-400)",
              }}
            >
              {[equipment.merek, equipment.tipe_model]
                .filter(Boolean)
                .join(" — ")}
            </div>
          )}
          {equipment.peranti_lunak_versi && (
            <div
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--clr-dark-500)",
              }}
            >
              Firmware: {equipment.peranti_lunak_versi}
            </div>
          )}
        </>
      ),
    },
    {
      key: "category-location",
      header: "Kategori & Lokasi",
      render: (equipment) => {
        const room = rooms.find(
          (item) => String(item.id) === String(equipment.ruangan_id),
        );
        const location = [room?.labs?.nama_labs, room?.nama_ruangan]
          .filter(Boolean)
          .join(" · ");
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 4,
            }}
          >
            <span
              className="badge badge-gray"
              style={{ fontSize: "var(--text-xs)" }}
            >
              {equipment.kategori_peralatan?.nama_kategori || "–"}
            </span>
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--clr-dark-500)",
              }}
            >
              {location || "Lokasi belum tersedia"}
            </span>
          </div>
        );
      },
    },
    {
      key: "description",
      header: "Keterangan",
      render: (equipment) => {
        const approved = equipment.status_verifikasi === "Disetujui";
        const rejected = equipment.status_verifikasi === "Ditolak";
        const description = rejected
          ? "Perlu verifikasi ulang"
          : equipment.status_verifikasi === "Draft"
            ? "Perlu diverifikasi"
          : !approved
            ? "Menunggu verifikasi"
            : equipment.status_alat === "Aktif"
              ? "Masuk inventaris"
              : equipment.status_alat === "Dalam Kalibrasi"
                ? "Sedang dikalibrasi"
                : equipment.status_alat === "Dipinjam"
                  ? "Sedang dipinjam"
                  : equipment.status_alat === "Rusak"
                    ? "Dalam kondisi rusak"
                    : equipment.status_alat || "Dalam proses";
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 4,
            }}
          >
            <span
              className={`badge ${STATUS_BADGE_CLASS[rejected ? "Rusak" : approved ? equipment.status_alat : "Karantina"] || "badge-gray"}`}
            >
              <span className="badge-dot" />
              {description}
            </span>
          </div>
        );
      },
    },
    {
      key: "last-user",
      header: "Pemakai Terakhir",
      render: (p) => {
        if (!p.pemakai_terakhir)
          return <span style={{ color: "var(--clr-dark-400)" }}>–</span>;
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            <span
              style={{
                fontWeight: 600,
                color: "var(--clr-dark-800)",
                fontSize: "13px",
              }}
            >
              {p.pemakai_terakhir.nama}
            </span>
            {p.pemakai_terakhir.sedang_digunakan ? (
              <span
                className="badge badge-warning"
                style={{ fontSize: "10px", padding: "1px 6px" }}
              >
                Sedang Digunakan
              </span>
            ) : (
              <small style={{ color: "var(--clr-dark-500)", fontSize: "11px" }}>
                {p.pemakai_terakhir.tanggal_keluar
                  ? String(p.pemakai_terakhir.tanggal_keluar).slice(0, 10)
                  : ""}
              </small>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Aksi",
      cellProps: () => ({ onClick: (event) => event.stopPropagation() }),
      render: (equipment) => {
        const equipmentId = getEquipmentId(equipment);
        const approved = equipment.status_verifikasi === "Disetujui";
        const rejected = equipment.status_verifikasi === "Ditolak";
        const detailPath = `/peralatan/detail/${equipmentId}?returnTo=${encodeURIComponent(returnPath)}`;
        const verificationPath = `/verifikasi/${equipmentId}?returnTo=${encodeURIComponent(returnPath)}`;
        const out = isCurrentlyOut(equipment);
        return (
          <div style={{ display: "flex", gap: "var(--sp-1)" }}>
            {canViewVerification && !approved && !rejected && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onNavigate(verificationPath)}
                title="Mulai pengisian tahapan verifikasi alat"
              >
                <ClipboardCheck size={14} /> Verifikasi
              </button>
            )}
            {canViewVerification && rejected && (
              <>
                <button
                  className="btn btn-ghost btn-sm text-error"
                  onClick={() => onNavigate(detailPath)}
                  title="Lihat Catatan Peninjauan (TLKM13/IK/012)"
                >
                  Tinjau
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onNavigate(verificationPath)}
                  title="Mulai pengisian tahapan verifikasi alat"
                >
                  <ClipboardCheck size={14} /> Verifikasi Ulang
                </button>
              </>
            )}
            {canRequestLoan &&
              approved &&
              ["Aktif", "Dipinjam"].includes(equipment.status_alat) && (
              <div
                style={{
                  display: "inline-flex",
                  flexDirection: "column",
                  gap: 3,
                  alignItems: "flex-start",
                }}
              >
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onNavigate(`/peminjaman/${equipmentId}`)}
                  title={
                    out
                      ? `Alat sedang dipinjam: ${out.rencana_tanggal_keluar} s.d. ${out.rencana_tanggal_kembali}. Klik untuk mengajukan peminjaman pada jadwal lain.`
                      : "Pinjam peralatan"
                  }
                  id={`btn-pinjam-${equipmentId}`}
                >
                  <Hand size={14} /> Pinjam
                </button>
                {out && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--clr-primary-700, #c53030)",
                      background: "var(--clr-primary-50, #fff5f5)",
                      border: "1px solid var(--clr-primary-200, #fed7d7)",
                      padding: "1px 5px",
                      borderRadius: "var(--radius-sm, 4px)",
                      whiteSpace: "nowrap",
                      lineHeight: 1.25,
                      fontWeight: "var(--fw-medium, 500)",
                    }}
                    title={`Dipinjam dari ${out.rencana_tanggal_keluar} s.d. ${out.rencana_tanggal_kembali}`}
                  >
                    Dipinjam: {formatTgl(out.rencana_tanggal_keluar)} –{" "}
                    {formatTgl(out.rencana_tanggal_kembali)}
                  </span>
                )}
              </div>
              )}
          </div>
        );
      },
    },
  ];

  const categories = Array.from(
    new Map(
      list
        .filter(
          (item) =>
            item.kategori_peralatan?.id &&
            item.kategori_peralatan?.nama_kategori,
        )
        .map((item) => [item.kategori_peralatan.id, item.kategori_peralatan]),
    ).values(),
  );
  const lifecycleCopy = {
    pending: [
      "Menunggu Verifikasi",
      "peralatan aktivitas A1 yang menunggu pemeriksaan awal",
    ],
    review: [
      "Peninjauan Peralatan",
      "peralatan ditolak dan membutuhkan tindak lanjut",
    ],
    all: [
      "Daftar Peralatan",
      "Pantau data, status, dan kelayakan peralatan laboratorium.",
    ],
  };
  const [title, description] = lifecycleCopy[lifecycleView];

  return (
    <div className="page-container fade-in-up">
      {/* Header */}
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
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{description}</p>
        </div>
        <div
          style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}
        >
          {canCreate && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={downloadBulkTemplate}
                disabled={templateDownloading || bulkUploading}
                id="btn-download-template-peralatan"
              >
                <Download size={16} /> {templateDownloading ? "Mengunduh..." : "Template Excel"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setBulkPanelOpen((open) => !open);
                  setBulkUploadError("");
                  setBulkResult(null);
                }}
                aria-expanded={bulkPanelOpen}
                id="btn-upload-excel-peralatan"
              >
                <Upload size={16} /> Upload Excel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => onNavigate("/peralatan/tambah")}
                id="btn-tambah-peralatan"
              >
                <Plus size={16} /> Tambah Peralatan
              </button>
            </>
          )}
        </div>
      </div>

      {canCreate && bulkPanelOpen && (
        <section
          className="card"
          aria-label="Upload peralatan dari Excel"
          style={{ padding: "var(--sp-4)", marginBottom: "var(--sp-4)" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--sp-3)", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ margin: 0 }}>Upload peralatan dari Excel</h2>
              <p style={{ margin: "var(--sp-1) 0 0", color: "var(--clr-dark-500)" }}>
                Pilih kelompok aset, ruangan, dan Lab dari dropdown. Nama ruangan baru boleh diketik manual dan akan dibuat pada Lab yang dipilih. Pada sheet Alat Ukur dan Alat Bantu, baris pertama berwarna memisahkan kolom Kalibrasi dan Verifikasi Fungsi; isi bagian yang sesuai dengan pilihan metode di kolom H. Isi tanggal kalibrasi dan nomor sertifikat pada bagian Kalibrasi. Kolom K-M berisi pilihan alat standar, status alat, dan jenis label. Komponen Pendukung memiliki dropdown kategori dan ketersediaan.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setBulkPanelOpen(false)}
              aria-label="Tutup upload Excel"
              disabled={bulkUploading}
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={submitBulkUpload} style={{ display: "grid", gap: "var(--sp-3)", marginTop: "var(--sp-3)" }}>
            <label style={{ display: "grid", gap: "var(--sp-1)" }}>
              <span>File workbook (.xlsx) <strong aria-hidden="true">*</strong></span>
              <input
                key={`workbook-${bulkInputKey}`}
                type="file"
                accept=".xlsx"
                required={!bulkWorkbook}
                disabled={bulkUploading}
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  if (file && !file.name.toLowerCase().endsWith(".xlsx")) {
                    setBulkUploadError("File Excel harus berformat .xlsx.");
                    setBulkWorkbook(null);
                    event.target.value = "";
                    return;
                  }
                  if (file && file.size > 10 * 1024 * 1024) {
                    setBulkUploadError("Ukuran file Excel maksimal 10 MB.");
                    setBulkWorkbook(null);
                    event.target.value = "";
                    return;
                  }
                  setBulkWorkbook(file);
                  setBulkUploadError("");
                  setBulkResult(null);
                }}
              />
              {bulkWorkbook && <small>{bulkWorkbook.name}</small>}
            </label>

            <label style={{ display: "grid", gap: "var(--sp-1)" }}>
              <span>Lampiran (opsional)</span>
              <input
                key={`attachments-${bulkInputKey}`}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                disabled={bulkUploading}
                onChange={addBulkAttachments}
              />
            </label>
            {bulkAttachments.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: "var(--sp-5)" }}>
                {bulkAttachments.map((file) => (
                  <li key={`${file.name}-${file.size}`}>
                    {file.name}{" "}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setBulkAttachments((files) => files.filter((item) => item !== file))}
                      disabled={bulkUploading}
                      aria-label={`Hapus lampiran ${file.name}`}
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p style={{ margin: 0, color: "var(--clr-dark-500)", fontSize: "var(--text-sm)" }}>
              Maksimal 500 baris per upload. Nama lampiran harus sama persis dengan nama pada workbook.
            </p>
            {bulkUploadError && <p role="alert" style={{ margin: 0, color: "var(--clr-danger-700, #b42318)" }}>{bulkUploadError}</p>}
            <div>
              <button type="submit" className="btn btn-primary" disabled={bulkUploading || !bulkWorkbook}>
                <Upload size={16} /> {bulkUploading ? "Mengunggah..." : "Mulai Upload"}
              </button>
            </div>
          </form>

          {bulkResult && (
            <div role="status" style={{ marginTop: "var(--sp-4)" }}>
              <p><strong>{bulkResult.message}</strong></p>
              {Array.isArray(bulkResult.hasil) && bulkResult.hasil.length > 0 && (
                <div className="table-card" style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead><tr><th>Sheet</th><th>Baris</th><th>No. Aset</th><th>Hasil</th></tr></thead>
                    <tbody>
                      {bulkResult.hasil.map((row, index) => (
                        <tr key={`${row.sheet}-${row.row}-${index}`}>
                          <td>{row.sheet}</td>
                          <td>{row.row}</td>
                          <td>{row.nomor_aset || "—"}</td>
                          <td>{row.error ? `Gagal: ${row.error}` : "Berhasil"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <WorkflowGuide
        title="Alur Pengelolaan Peralatan"
        description="Ikuti tahapan pengelolaan peralatan dari pendataan hingga siap digunakan."
        steps={[
          {
            title: "Input Data Peralatan",
            description:
              "Catat identitas dan lokasi peralatan ke dalam sistem.",
          },
          {
            title: "Verifikasi Pengelola",
            description: "Pengelola memeriksa data dan kondisi awal peralatan.",
          },
          {
            title: "Persetujuan Manager Lab",
            description:
              "Manager Lab meninjau dan menyetujui hasil verifikasi.",
          },
          {
            title: "Masuk Inventaris",
            description: "Peralatan yang disetujui tercatat dalam inventaris.",
          },
          {
            title: "Pemeliharaan Berkala",
            description: "Pantau status dan jadwal pemeriksaan peralatan.",
          },
        ]}
      />

      {/* Filters */}
      <TableFilters
        fields={[
          {
            type: "search",
            id: "input-search-peralatan",
            label: "Cari peralatan",
            placeholder: "Nama, nomor aset, atau merek",
            value: search,
            onChange: (event) => setSearch(event.target.value),
          },
          {
            type: "select",
            id: "select-filter-kategori",
            label: "Kategori",
            placeholder: "Semua Kategori",
            value: filterKat,
            onChange: (event) => setFilterKat(event.target.value),
            options: categories.map((category) => ({
              value: String(category.id),
              label: category.nama_kategori,
            })),
          },
          {
            type: "select",
            id: "select-filter-lab",
            label: "Lab",
            placeholder: "Semua Lab",
            value: filterLab,
            onChange: (event) => setFilterLab(event.target.value),
            options: labs.map((lab) => ({
              value: String(lab.id),
              label: lab.nama_labs,
            })),
          },
        ]}
        actions={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSearch("");
              setFilterKat("");
              setFilterLab("");
            }}
            title="Reset filter"
            aria-label="Reset filter peralatan"
            id="btn-reset-filter-peralatan"
          >
            <RotateCcw size={16} />
          </button>
        }
      />

      {/* Tabel */}
      {loading ? (
        <div
          className="card"
          style={{
            padding: "var(--sp-6)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-3)",
          }}
        >
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 52 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Package size={32} />
          </div>
          <p className="empty-state-title">Tidak ada peralatan ditemukan</p>
          <p className="empty-state-desc">
            Daftar ini hanya menampilkan peralatan berstatus aktif yang telah
            disetujui manager.
          </p>
          {canCreate && (
            <button
              className="btn btn-primary"
              onClick={() => onNavigate("/peralatan/tambah")}
              style={{ marginTop: "var(--sp-2)" }}
            >
              <Plus size={16} /> Tambah Peralatan Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="table-card">
          <PaginatedDataTable
            columns={columns}
            rows={filtered}
            pagination={pagination}
            rowKey={(equipment) => getEquipmentId(equipment)}
            className="data-table-mobile-priority equipment-list-table"
            rowProps={(equipment) => {
              const equipmentId = getEquipmentId(equipment);
              const detailPath = `/peralatan/detail/${equipmentId}?returnTo=${encodeURIComponent(returnPath)}`;
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
                "aria-label": `Lihat detail ${equipment.nama_peralatan}`,
              };
            }}
            emptyMessage="Tidak ada peralatan ditemukan."
          />
        </div>
      )}
    </div>
  );
}
