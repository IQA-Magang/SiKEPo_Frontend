import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Package,
  ArrowLeft,
  Upload,
  FileText,
  Download,
  QrCode,
  Printer,
  Hand,
  RefreshCw,
} from "lucide-react";
import {
  fetchBlobWithAuth,
  peralatanApi,
  dokumenApi,
  kalibrasiApi,
  verifikasiFungsiApi,
  verifikasiApi,
  kelompokAssetApi,
  ruanganApi,
  labsApi,
  logbookApi,
  peminjamanApi,
  formatPhotoUrl,
  getEquipmentId,
  getEquipmentCategoryId,
  getCurrentUser,
  STATUS_BADGE_CLASS,
  API_BASE,
} from "../../shared/services/api.js";
import {
  ACCESS,
  ACTIONS,
  can,
  getUserRole,
  isStaffPengelola,
} from "../../shared/utils/permissions.js";
import { exportVerificationPdf } from "../../shared/lib/verificationPdf.js";
import { getSafeReturnPath } from "../../app/router/Router.jsx";

function getLogActionValue(log) {
  const record = log.record || log;
  const verification = record.verifikasi || record;
  if (log.jenis === "verifikasi") {
    if (verification?.kode_aktivitas) {
      return String(verification.kode_aktivitas).toUpperCase();
    }
    const activityName = getVerificationActivityName(log);
    if (activityName) return activityName;
  }
  return String(
    record.aksi ||
      log.title ||
      log.judul ||
      "lainnya",
  );
}

function getLogActionLabel(log, actionValue) {
  const record = log.record || log;
  const verification = record.verifikasi || record;
  if (log.jenis === "verifikasi") {
    const activityName = getVerificationActivityName(log);
    if (activityName) return activityName;
  }
  if (record.aksi) return log.title || log.judul || record.aksi.replaceAll("_", " ");
  return log.title || log.judul || actionValue;
}

function getVerificationActivityName(log) {
  const record = log?.record || log;
  const verification = record?.verifikasi || record;
  const name =
    verification?.nama_aktivitas ||
    record?.nama_aktivitas ||
    log?.nama_aktivitas;
  if (String(name || "").trim()) return String(name).trim();

  const code =
    verification?.kode_aktivitas ||
    record?.kode_aktivitas ||
    log?.kode_aktivitas;
  return code ? getActivityName(code) : "";
}

function getLogStatusBadgeClass(status) {
  if (["Disetujui", "Divalidasi", "Selesai", "Aktif", "Aktif Kembali"].includes(status)) {
    return "badge-aktif";
  }
  if (["Ditolak", "Dibatalkan", "Hentikan", "Tidak Aktif"].includes(status)) {
    return "badge-rusak";
  }
  return "badge-kalibrasi";
}

function isLogInTimeRange(value, range) {
  if (range === "all") return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  if (range === "week") {
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
    end.setTime(start.getTime());
    end.setDate(end.getDate() + 7);
  } else if (range === "month") {
    start.setDate(1);
    end.setTime(start.getTime());
    end.setMonth(end.getMonth() + 1);
  } else if (range === "year") {
    start.setMonth(0, 1);
    end.setTime(start.getTime());
    end.setFullYear(end.getFullYear() + 1);
  }

  return date >= start && date < end;
}

function escapeLogHtml(value) {
  return String(value ?? "—").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

// ------------------------------------------------------------------
// Halaman Detail Peralatan
// ------------------------------------------------------------------
export default function EquipmentDetail({
  equipmentId,
  onNavigate,
  initialSection = "informasi",
}) {
  const returnPath = getSafeReturnPath("/peralatan");
  const currentUser = getCurrentUser();
  const currentUserRole = String(currentUser?.role || "staff").toLowerCase();
  const canEditEquipment =
    currentUserRole === "admin" || isStaffPengelola(currentUser);
  const canViewVerification = can(ACCESS.EQUIPMENT_ELIGIBILITY, ACTIONS.VIEW);
  const canRequestLoan = can(ACCESS.LOAN_REQUEST, ACTIONS.ADD);
  const canExportVerification =
    can(ACCESS.EQUIPMENT_ELIGIBILITY, ACTIONS.EDIT) &&
    (getUserRole() !== "staff" || isStaffPengelola());
  const [peralatan, setPeralatan] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [dokumen, setDokumen] = useState([]);
  const [guideDocuments, setGuideDocuments] = useState([]);
  const [guideLoadError, setGuideLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [msg, setMsg] = useState("");
  const [qrSrc, setQrSrc] = useState("");
  const [reviewLogs, setReviewLogs] = useState([]);
  const [reviewLogError, setReviewLogError] = useState("");
  const [verificationLogs, setVerificationLogs] = useState([]);
  const [verificationActionLogs, setVerificationActionLogs] = useState([]);
  const [verificationLogError, setVerificationLogError] = useState("");
  const [qrError, setQrError] = useState("");
  const [selectedActivityLog, setSelectedActivityLog] = useState(null);
  const [selectedLogType, setSelectedLogType] = useState("verifikasi");
  const [logActionFilter, setLogActionFilter] = useState("");
  const [logTimeFilter, setLogTimeFilter] = useState("all");
  const [logbookData, setLogbookData] = useState([]);
  const [logbookLoading, setLogbookLoading] = useState(false);
  const [logbookError, setLogbookError] = useState("");
  const [periodicLogData, setPeriodicLogData] = useState([]);
  const [activeDetailSection, setActiveDetailSection] =
    useState(initialSection);
  const [references, setReferences] = useState({
    groups: [],
    rooms: [],
    labs: [],
  });
  const [jadwal, setJadwal] = useState([]);
  const hariIni = new Date();
  const hariIniStr = `${hariIni.getFullYear()}-${String(hariIni.getMonth() + 1).padStart(2, "0")}-${String(hariIni.getDate()).padStart(2, "0")}`;

  function formatTgl(dateStr) {
    if (!dateStr) return "";
    const d = String(dateStr).slice(0, 10);
    const parts = d.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }

  function isCurrentlyOut() {
    if (!peralatan) return null;
    if (peralatan.pengajuan_aktif) {
      return peralatan.pengajuan_aktif;
    }
    const pid = String(getEquipmentId(peralatan));
    for (const r of jadwal) {
      if (String(r.peralatan_id) === pid) {
        if (
          hariIniStr >= r.rencana_tanggal_keluar &&
          hariIniStr <= r.rencana_tanggal_kembali
        ) {
          return r;
        }
      }
    }
    if (peralatan.status_alat === "Dipinjam" && Array.isArray(jadwal)) {
      const match = jadwal.find((r) => String(r.peralatan_id) === pid);
      if (match) return match;
    }
    return null;
  }

  useEffect(() => {
    setActiveDetailSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    loadData();
  }, [equipmentId]);

  async function fetchLogbook(peralatanId, jenis) {
    setLogbookLoading(true);
    setLogbookError("");
    try {
      const res = await logbookApi.getByPeralatanId(peralatanId, jenis);
      const data = res?.data ?? res?.value?.data ?? res;
      if (Array.isArray(data)) {
        setLogbookData(data);
      } else {
        setLogbookData([]);
      }
    } catch (err) {
      setLogbookError(err?.message || "Gagal memuat log aktivitas.");
      setLogbookData([]);
    } finally {
      setLogbookLoading(false);
    }
  }

  useEffect(() => {
    if (
      !equipmentId ||
      selectedLogType === "verifikasi" ||
      ["kalibrasi", "verifikasi_fungsi"].includes(selectedLogType)
    ) {
      setLogbookData([]);
      setLogbookError("");
      return;
    }
    fetchLogbook(equipmentId, selectedLogType);
  }, [equipmentId, selectedLogType]);

  useEffect(() => {
    if (
      !equipmentId ||
      !["kalibrasi", "verifikasi_fungsi"].includes(selectedLogType)
    ) {
      setPeriodicLogData([]);
      return;
    }

    let active = true;
    setLogbookLoading(true);
    setLogbookError("");
    const api =
      selectedLogType === "kalibrasi"
        ? kalibrasiApi
        : verifikasiFungsiApi;

    api.getByEquipment(equipmentId)
      .then((response) => {
        if (!Array.isArray(response?.data)) {
          throw new Error("Format histori pemeriksaan tidak valid.");
        }
        if (!active) return;
        const isCalibration = selectedLogType === "kalibrasi";
        setPeriodicLogData(
          response.data
            .map((record, index) => {
              const statusLabels = {
                direncanakan: "Direncanakan",
                dalam_proses: "Sedang diproses",
                selesai: "Selesai",
                dibatalkan: "Dibatalkan",
              };
              const date =
                (isCalibration
                  ? record.tgl_kalibrasi
                  : record.tgl_pemeriksaan_terakhir) ||
                record.updated_at ||
                record.created_at;
              return {
                id: `periodic-${selectedLogType}-${record.id ?? index}`,
                jenis: selectedLogType,
                date,
                status: statusLabels[record.status] || record.status || "Pemeriksaan",
                title: isCalibration
                  ? `Kalibrasi${record.no_sertifikat ? ` — ${record.no_sertifikat}` : ""}`
                  : `Verifikasi Fungsi${record.no_laporan ? ` — ${record.no_laporan}` : ""}`,
                description: isCalibration
                  ? `${record.metode || "Metode belum dicatat"}${record.lab_kalibrasi ? ` · ${record.lab_kalibrasi}` : ""}`
                  : `${record.jenis_pemeriksaan_berkala || "Verifikasi fungsi"}${record.acuan_pembanding ? ` · Acuan: ${record.acuan_pembanding}` : ""}`,
                actor: record.pelaksana || "",
                record,
              };
            })
            .sort(
              (first, second) =>
                new Date(second.date || 0) - new Date(first.date || 0),
            ),
        );
      })
      .catch((err) => {
        if (active) {
          setPeriodicLogData([]);
          setLogbookError(err?.message || "Gagal memuat histori pemeriksaan.");
        }
      })
      .finally(() => {
        if (active) setLogbookLoading(false);
      });

    return () => {
      active = false;
    };
  }, [equipmentId, selectedLogType]);

  useEffect(() => {
    if (!peralatan || peralatan.status_verifikasi !== "Disetujui") {
      setQrSrc("");
      setQrError("");
      return undefined;
    }
    let objectUrl = "";
    async function loadQr() {
      try {
        const blob = await fetchBlobWithAuth(
          `/api/peralatan/${equipmentId}/qr`,
        );
        objectUrl = URL.createObjectURL(blob);
        setQrSrc(objectUrl);
        setQrError("");
      } catch (err) {
        setQrSrc("");
        setQrError(err.message || "QR Code gagal dimuat.");
      }
    }
    loadQr();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [equipmentId, peralatan]);

  async function loadData() {
    setLoading(true);
    setPeralatan(null);
    setLoadError("");
    setGuideDocuments([]);
    setGuideLoadError("");
    setReviewLogError("");
    setVerificationLogError("");
    setVerificationActionLogs([]);
    try {
      const [
        equipmentRes,
        docRes,
        reviewRes,
        verificationRes,
        groupsRes,
        roomsRes,
        labsRes,
        jadwalRes,
      ] = await Promise.allSettled([
        peralatanApi.getById(equipmentId),
        dokumenApi.getByPeralatanId(equipmentId),
        verifikasiApi.getLogByPeralatanId(equipmentId),
        verifikasiApi.getHistoriByPeralatanId(equipmentId),
        kelompokAssetApi.getAll(),
        ruanganApi.getAll(),
        labsApi.getAll(),
        peminjamanApi.getAllJadwal(),
      ]);
      if (equipmentRes.status === "fulfilled") {
        const result = equipmentRes.value.data;
        const item = result?.peralatan || result;
        setPeralatan(
          item ? { ...item, detail: result?.detail ?? item.detail } : null,
        );
        if (item) {
          const categoryId = getEquipmentCategoryId(item);
          const peralatanId = getEquipmentId(item);
          const method = String(item.metode_pemeriksaan || "")
            .trim()
            .toLowerCase();
          const isCalibration =
            method === "kalibrasi" || (!method && categoryId === 1);
          const isFunctionVerification =
            method === "verifikasi fungsi" || (!method && categoryId === 2);
          const guideApi = isCalibration
            ? kalibrasiApi
            : isFunctionVerification
              ? verifikasiFungsiApi
              : null;

          if (guideApi && peralatanId) {
            try {
              const response = await guideApi.getByEquipment(peralatanId);
              if (!Array.isArray(response?.data)) {
                throw new Error(
                  "Format respons dokumen panduan mutu tidak valid.",
                );
              }

              setGuideDocuments(
                response.data
                  .filter(
                    (record) =>
                      record.status === "selesai" &&
                      typeof (isCalibration
                        ? record.sertifikat_pdf
                        : record.pdf_laporan) === "string" &&
                      (isCalibration
                        ? record.sertifikat_pdf
                        : record.pdf_laporan).trim(),
                  )
                  .map((record) => {
                    const path = isCalibration
                      ? record.sertifikat_pdf
                      : record.pdf_laporan;
                    return {
                      id: record.id,
                      label: isCalibration
                        ? "Sertifikat Kalibrasi"
                        : "Laporan Verifikasi Fungsi",
                      number: isCalibration
                        ? record.no_sertifikat
                        : record.no_laporan,
                      date: isCalibration
                        ? record.tgl_kalibrasi
                        : record.tgl_pemeriksaan_terakhir,
                      url: formatPhotoUrl(path),
                    };
                  })
                  .filter((document) => document.url),
              );
            } catch (err) {
              setGuideLoadError(
                err?.message || "Gagal memuat dokumen panduan mutu.",
              );
            }
          }
        }
      } else {
        setLoadError(
          equipmentRes.reason?.message || "Gagal memuat data peralatan.",
        );
      }
      if (docRes.status === "fulfilled") setDokumen(docRes.value.data || []);
      if (reviewRes.status === "fulfilled") {
        const logs = reviewRes.value.data;
        if (Array.isArray(logs)) {
          setReviewLogs(logs);
        } else {
          setReviewLogError("Format data log peninjauan tidak valid.");
        }
      } else {
        setReviewLogs([]);
        setReviewLogError(
          reviewRes.reason?.message || "Gagal memuat log peninjauan.",
        );
      }
      if (verificationRes.status === "fulfilled") {
        const history = verificationRes.value.data?.histori;
        if (Array.isArray(history)) {
          setVerificationLogs(history);
          const actionResults = await Promise.allSettled(
            history.map((verification) =>
              verifikasiApi.getActionHistory(
                verification.id_verifikasi ?? verification.id,
              ),
            ),
          );
          const actionLogs = [];
          let actionLogError = "";
          actionResults.forEach((result, index) => {
            if (result.status === "rejected") {
              actionLogError ||= result.reason?.message
                || "Gagal memuat sebagian histori aksi verifikasi.";
              return;
            }
            if (!Array.isArray(result.value?.data)) {
              actionLogError ||= "Format histori aksi verifikasi tidak valid.";
              return;
            }
            const verification = history[index];
            result.value.data.forEach((entry) => {
              actionLogs.push({
                ...entry,
                verifikasi: verification,
                catatan: verification.catatan,
              });
            });
          });
          setVerificationActionLogs(actionLogs);
          if (actionLogError) setVerificationLogError(actionLogError);
        } else {
          setVerificationLogs([]);
          setVerificationActionLogs([]);
          setVerificationLogError(
            "Format respons histori verifikasi tidak valid.",
          );
        }
      } else {
        setVerificationLogs([]);
        setVerificationActionLogs([]);
        setVerificationLogError(
          verificationRes.reason?.message || "Gagal memuat riwayat verifikasi.",
        );
      }
      setReferences({
        groups:
          groupsRes.status === "fulfilled" ? groupsRes.value.data || [] : [],
        rooms: roomsRes.status === "fulfilled" ? roomsRes.value.data || [] : [],
        labs: labsRes.status === "fulfilled" ? labsRes.value.data || [] : [],
      });
      if (jadwalRes.status === "fulfilled") {
        const data = jadwalRes.value?.data || jadwalRes.value || [];
        setJadwal(Array.isArray(data) ? data : []);
      } else {
        setJadwal([]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg("");
    try {
      await peralatanApi.uploadFoto(equipmentId, file);
      setMsg("Foto berhasil diunggah!");
      await loadData();
    } catch (err) {
      setMsg(`Gagal upload: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleUploadDocument(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDocument(true);
    setMsg("");
    try {
      await dokumenApi.upload(equipmentId, file);
      setMsg("Dokumen berhasil diunggah!");
      await loadData();
    } catch (err) {
      setMsg(`Gagal mengunggah dokumen: ${err.message}`);
    } finally {
      setUploadingDocument(false);
      e.target.value = "";
    }
  }

  if (loading)
    return (
      <div className="page-container fade-in-up">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-4)",
          }}
        >
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 60 }} />
          ))}
        </div>
      </div>
    );

  if (!peralatan)
    return (
      <div className="page-container fade-in-up">
        <div className="empty-state">
          <div className="empty-state-icon">
            <Package size={32} />
          </div>
          <p className="empty-state-title">
            {loadError ? "Gagal memuat peralatan" : "Peralatan tidak ditemukan"}
          </p>
          {loadError && <p className="empty-state-desc">{loadError}</p>}
          <button
            className="btn btn-secondary"
            onClick={() => onNavigate(returnPath)}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
        </div>
      </div>
    );

  const photoUrl = formatPhotoUrl(peralatan.foto);
  const canonicalEquipmentId = getEquipmentId(peralatan);
  const isVerified = peralatan.status_verifikasi === "Disetujui";
  const isDoNotUse =
    String(peralatan.status_alat || "").trim().toLowerCase() === "do not use";
  const outRange = isCurrentlyOut();
  const canBorrowNow =
    canRequestLoan &&
    isVerified &&
    peralatan.status_alat === "Aktif";
  const displayStatus = isDoNotUse
    ? "Do Not Use"
    : isVerified
      ? peralatan.status_alat
      : "Karantina";
  const visibleDetailSection =
    activeDetailSection === "qr" && !isVerified
      ? "informasi"
      : activeDetailSection;
  const technicalRows = getEquipmentDetailRows(peralatan);
  const reviewLogByVerificationId = new Map(
    reviewLogs.map((log) => [String(log.id_verifikasi), log]),
  );
  const actionLogVerificationIds = new Set(
    verificationActionLogs.map((log) => String(log.id_verifikasi)),
  );
  const verificationHistory = [
    ...verificationActionLogs.map((log) => {
      const review = reviewLogByVerificationId.get(String(log.id_verifikasi));
      const isRejected = log.status === "Ditolak";
      return {
        id: `verification-action-${log.id_histori}`,
        jenis: "verifikasi",
        verificationId: String(log.id_verifikasi),
        date: log.created_at,
        status: log.status || "Verifikasi",
        title: log.judul || String(log.aksi || "Aktivitas verifikasi").replaceAll("_", " "),
        description: isRejected
          ? review?.alasan || log.keterangan || ""
          : log.keterangan || "",
        note: isRejected ? review?.catatan || "" : "",
        actor: log.user?.name || "",
        record: {
          ...log,
          ...(review ? { alasan: review.alasan, catatan_peninjauan: review.catatan } : {}),
        },
      };
    }),
    ...verificationLogs
      .filter((log) =>
        !actionLogVerificationIds.has(String(log.id_verifikasi ?? log.id)),
      )
      .map((log, index) => ({
        id: `verification-${log.id_verifikasi ?? log.id ?? index}`,
        jenis: "verifikasi",
        verificationId: String(log.id_verifikasi ?? log.id ?? `legacy-${index}`),
        date: log.tanggal_verifikasi || log.created_at,
        status: log.status || "Verifikasi",
        title: log.kode_aktivitas
          ? `Verifikasi — ${getActivityName(log.kode_aktivitas)}`
          : "Verifikasi",
        description: log.keputusan ? `Keputusan: ${log.keputusan}` : "",
        note: log.tindak_lanjut || "",
        record: log,
      })),
    ...reviewLogs
      .filter((log) => !actionLogVerificationIds.has(String(log.id_verifikasi)))
      .map((log, index) => ({
        id: `review-${log.id_log ?? index}`,
        jenis: "verifikasi",
        verificationId: String(log.id_verifikasi ?? `review-${log.id_log ?? index}`),
        date: log.created_at,
        status: log.status || "Peninjauan",
        title: "Catatan peninjauan",
        description: log.alasan || "",
        note: log.catatan || "",
        record: log,
      })),
  ].sort(
    (first, second) => new Date(second.date || 0) - new Date(first.date || 0),
  );
  const latestApprovedVerification = verificationLogs
    .filter((log) => log.status === "Disetujui")
    .sort(
      (first, second) =>
        new Date(second.tanggal_verifikasi || second.created_at || 0) -
        new Date(first.tanggal_verifikasi || first.created_at || 0),
    )[0];
  const logTypeLabels = {
    verifikasi: "Log Verifikasi",
    kalibrasi: "Log Kalibrasi",
    verifikasi_fungsi: "Log Verifikasi Fungsi",
    peminjaman: "Log Peminjaman",
    perpindahan: "Log Perpindahan",
    penggunaan: "Log Penggunaan",
    pemeriksaan: "Log Pemeriksaan Berkala",
  };
  const activeLogEntries =
    selectedLogType === "verifikasi"
      ? verificationHistory
      : ["kalibrasi", "verifikasi_fungsi"].includes(selectedLogType)
        ? periodicLogData
        : logbookData;
  const logActionOptions = Array.from(
    new Map(
      activeLogEntries.map((log) => {
        const value = getLogActionValue(log);
        return [value, getLogActionLabel(log, value)];
      }),
    ),
    ([value, label]) => ({ value, label }),
  ).sort((first, second) =>
    first.label.localeCompare(second.label, "id-ID"),
  );
  const matchesLogFilters = (log) =>
    (!logActionFilter || getLogActionValue(log) === logActionFilter) &&
    isLogInTimeRange(log.date || log.created_at, logTimeFilter);
  const filteredVerificationHistory =
    selectedLogType === "verifikasi"
      ? verificationHistory.filter(matchesLogFilters)
      : [];
  const filteredPeriodicLogData =
    ["kalibrasi", "verifikasi_fungsi"].includes(selectedLogType)
      ? periodicLogData.filter(matchesLogFilters)
      : [];
  const filteredLogbookData =
    selectedLogType !== "verifikasi"
      ? logbookData.filter(matchesLogFilters)
      : [];
  const groupEntriesByVerification = (entries) => {
    const groups = new Map();
    entries.forEach((entry) => {
      const key = entry.verificationId || entry.id;
      const group = groups.get(key) || [];
      group.push(entry);
      groups.set(key, group);
    });
    return Array.from(groups, ([id, groupLogs]) => ({
      id,
      logs: groupLogs.sort(
        (first, second) =>
          new Date(second.date || 0) - new Date(first.date || 0),
      ),
    })).sort(
      (first, second) =>
        new Date(second.logs[0]?.date || 0) -
        new Date(first.logs[0]?.date || 0),
    );
  };
  const verificationLogGroups = groupEntriesByVerification(verificationHistory)
    .filter((group) => group.logs.some(matchesLogFilters));
  const loanLogGroups = Array.from(
    filteredLogbookData.reduce((groups, log) => {
      const key = log.referensi_id ?? `log-${log.id}`;
      const group = groups.get(String(key)) || [];
      group.push(log);
      groups.set(String(key), group);
      return groups;
    }, new Map()),
    ([id, logs]) => ({
      id,
      logs: logs.sort(
        (first, second) =>
          new Date(second.created_at || 0) -
          new Date(first.created_at || 0),
      ),
    }),
  ).sort(
    (first, second) =>
      new Date(second.logs[0]?.created_at || 0) -
      new Date(first.logs[0]?.created_at || 0),
  );
  const displayedLogEntries =
    selectedLogType === "verifikasi"
      ? verificationLogGroups.map((group) => group.logs[0])
      : ["kalibrasi", "verifikasi_fungsi"].includes(selectedLogType)
        ? filteredPeriodicLogData
        : loanLogGroups.map((group) => group.logs[0]);
  const assetGroup = references.groups.find(
    (item) => String(item.id) === String(peralatan.kelompok_aset_id),
  );
  const room = references.rooms.find(
    (item) => String(item.id) === String(peralatan.ruangan_id),
  );
  const labId =
    room?.labs_id ??
    room?.labs?.id ??
    assetGroup?.lab_id ??
    assetGroup?.lab?.id;
  const lab =
    references.labs.find((item) => String(item.id) === String(labId)) ||
    room?.labs ||
    assetGroup?.lab;
  const currentUserLabId =
    currentUser?.labs_id ?? currentUser?.lab_id ?? currentUser?.labs?.id;
  const isOtherLabStaff =
    currentUserRole === "staff" &&
    currentUserLabId != null &&
    labId != null &&
    String(currentUserLabId) !== String(labId);
  const canViewLabDocuments = !isOtherLabStaff;
  const pic = [room?.pic_user, assetGroup?.pic].find(
    (person) =>
      person &&
      String(person.user_id ?? person.id) === String(peralatan.pic_id),
  );
  const selectedLogNotes = selectedActivityLog
    ? parseVerificationNotes(
        selectedActivityLog.record.catatan ||
          selectedActivityLog.record.verifikasi?.catatan,
      )
    : null;
  const selectedLogVerification = selectedActivityLog
    ? selectedActivityLog.record.verifikasi || selectedActivityLog.record
    : null;

  function handleSelectActivityLog(log, groupLogs = [log], showAllLogs = false) {
    setSelectedActivityLog({ ...log, groupLogs, showAllLogs });
  }

  function printLogEntries(entries, title) {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    const rows = entries.map((entry) => {
      const record = entry.record || entry;
      return `
        <tr>
          <td>${escapeLogHtml(formatDate(entry.date || entry.created_at))}</td>
          <td>${escapeLogHtml(entry.title || entry.judul || record.aksi)}</td>
          <td>${escapeLogHtml(entry.status || record.status)}</td>
          <td>${escapeLogHtml(entry.actor || record.user?.name)}</td>
          <td>${escapeLogHtml(entry.description || record.keterangan || entry.note)}</td>
        </tr>
      `;
    }).join("");
    printWindow.document.write(`
      <html>
        <head>
          <title>${escapeLogHtml(title)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
            h1 { font-size: 18px; margin: 0 0 4px; }
            p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <h1>${escapeLogHtml(title)}</h1>
          <table>
            <thead><tr><th>Waktu</th><th>Aksi</th><th>Status</th><th>Pelaku</th><th>Keterangan</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="5">Belum ada log.</td></tr>'}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function handlePrintActivityLog() {
    if (!selectedActivityLog) return;
    printLogEntries(
      selectedActivityLog.groupLogs || [selectedActivityLog],
      `Log ${logTypeLabels[selectedActivityLog.jenis] || "Peralatan"}`,
    );
  }

  function handlePrintAllEquipmentLogs() {
    printLogEntries(
      displayedLogEntries,
      `Semua ${logTypeLabels[selectedLogType] || "Log Peralatan"}`,
    );
  }

  async function handleDownloadQR() {
    const fileName = `QR-Peralatan-ID${canonicalEquipmentId}-${peralatan?.nomor_aset || "aset"}.png`;
    let blobUrl = "";
    try {
      const blob = await fetchBlobWithAuth(
        `/api/peralatan/${canonicalEquipmentId}/qr`,
      );
      blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setQrError(err.message || "QR Code gagal diunduh.");
    } finally {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    }
  }

  return (
    <div className="page-container fade-in-up">
      {/* Back & Title */}
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-4)",
          flexWrap: "wrap",
        }}
      >
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => onNavigate(returnPath)}
          id="btn-kembali-peralatan"
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="page-title" style={{ wordBreak: "break-word" }}>
            {peralatan.nama_peralatan}
          </h1>
          <p
            className="page-subtitle"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <code
              style={{
                fontSize: "var(--text-xs)",
                background: "var(--clr-dark-100)",
                padding: "2px 6px",
                borderRadius: "var(--radius-sm)",
                wordBreak: "break-all",
              }}
            >
              {peralatan.nomor_aset}
            </code>
            <span
              className={`badge ${STATUS_BADGE_CLASS[displayStatus] || "badge-gray"}`}
            >
              {displayStatus}
            </span>
            <span
              className={`badge ${isVerified ? "badge-aktif" : peralatan.status_verifikasi === "Ditolak" ? "badge-rusak" : "badge-gray"}`}
            >
              Verifikasi: {peralatan.status_verifikasi || "Belum Diverifikasi"}
            </span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {canBorrowNow && (
            <div
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
              }}
            >
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() =>
                  onNavigate(`/peminjaman/${canonicalEquipmentId}`)
                }
                title="Pinjam peralatan (TLKM13/IK/005)"
                id="btn-pinjam-detail"
              >
                <Hand size={14} /> Pinjam Peralatan
              </button>
            </div>
          )}
          {!canBorrowNow &&
            peralatan.status_alat === "Dipinjam" &&
            outRange && (
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--clr-primary-700, #c53030)",
                  background: "var(--clr-primary-50, #fff5f5)",
                  border: "1px solid var(--clr-primary-200, #fed7d7)",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-sm, 4px)",
                  fontWeight: "var(--fw-medium, 500)",
                  lineHeight: 1.25,
                }}
              >
                Sedang dipinjam: {formatTgl(outRange.rencana_tanggal_keluar)} –{" "}
                {formatTgl(outRange.rencana_tanggal_kembali)}
              </span>
            )}
          {canViewVerification && !isVerified && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() =>
                onNavigate(
                  `/verifikasi/${canonicalEquipmentId}?returnTo=${encodeURIComponent(returnPath)}`,
                )
              }
              title="Buka form verifikasi peralatan (TLKM13/IK/003)"
            >
              {peralatan.status_verifikasi === "Ditolak"
                ? "Ajukan Verifikasi Ulang"
                : "Verifikasi / Periksa"}
            </button>
          )}
        </div>
      </div>

      <div className="equipment-detail-layout">
        <nav
          className="equipment-detail-nav"
          aria-label="Bagian detail peralatan"
        >
          {[
            ["informasi", "Informasi"],
            ["dokumen", "Dokumen"],
            ["panduan-mutu", "Bukti Kelayakan"],
            ["qr", "QR Code"],
            ["log", "Log"],
          ]
            .filter(([section]) => section !== "qr" || isVerified)
            .filter(
              ([section]) =>
                canViewLabDocuments ||
                !["dokumen", "panduan-mutu"].includes(section),
            )
            .map(([section, label]) => (
              <button
                key={section}
                type="button"
                className={`equipment-detail-nav-button${visibleDetailSection === section ? " is-active" : ""}`}
                onClick={() => setActiveDetailSection(section)}
                aria-current={
                  visibleDetailSection === section ? "page" : undefined
                }
              >
                {label}
              </button>
            ))}
        </nav>

        <main className="equipment-detail-content">
          {visibleDetailSection === "log" && (
            <section className="card card-padded">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--sp-3)",
                  flexWrap: "wrap",
                  marginBottom: "var(--sp-4)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--sp-2)",
                  }}
                >
                  <h2 className="card-title">Log Aktivitas Peralatan</h2>
                  {activeLogEntries.length > 0 && (
                    <span className="badge badge-gray">
                      {selectedLogType === "verifikasi"
                        ? verificationLogGroups.length
                        : ["kalibrasi", "verifikasi_fungsi"].includes(selectedLogType)
                          ? filteredPeriodicLogData.length
                          : loanLogGroups.length}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", flexWrap: "wrap" }}>
                  <select
                    className="form-select"
                    value={selectedLogType}
                    onChange={(event) => {
                      setSelectedLogType(event.target.value);
                      setLogActionFilter("");
                      setLogbookData([]);
                      setLogbookError("");
                    }}
                    aria-label="Pilih jenis log peralatan"
                    style={{ width: "auto", minWidth: 210 }}
                  >
                    {Object.entries(logTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handlePrintAllEquipmentLogs}
                    disabled={displayedLogEntries.length === 0}
                  >
                    <Printer size={14} /> Cetak semua log yang tampil
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: "var(--sp-3)",
                  marginBottom: "var(--sp-4)",
                }}
              >
                <label className="form-field">
                  <span className="form-label">Aktivitas</span>
                  <select
                    className="form-select"
                    value={logActionFilter}
                    onChange={(event) => setLogActionFilter(event.target.value)}
                    aria-label="Filter aksi atau aktivitas log"
                  >
                    <option value="">Semua aktivitas</option>
                    {logActionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span className="form-label">Waktu</span>
                  <select
                    className="form-select"
                    value={logTimeFilter}
                    onChange={(event) => setLogTimeFilter(event.target.value)}
                    aria-label="Filter rentang waktu log"
                  >
                    <option value="all">Semua waktu</option>
                    <option value="week">Minggu ini</option>
                    <option value="month">Bulan ini</option>
                    <option value="year">Tahun ini</option>
                  </select>
                </label>
              </div>

              {selectedLogType === "verifikasi" ? (
                <>
                  {(verificationLogError || reviewLogError) && (
                    <p
                      className="alert alert-error"
                      role="alert"
                      style={{ margin: "0 0 var(--sp-3)" }}
                    >
                      Gagal memuat sebagian log verifikasi:{" "}
                      {[verificationLogError, reviewLogError]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  )}
                  {filteredVerificationHistory.length === 0 ? (
                    <p
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--clr-dark-500)",
                        fontStyle: "italic",
                        margin: 0,
                      }}
                    >
                      {verificationHistory.length === 0
                        ? "Belum ada log verifikasi."
                        : "Tidak ada log yang cocok dengan filter aktivitas dan waktu."}
                    </p>
                  ) : (
                    <div className="equipment-verification-log-list">
                      {verificationLogGroups.map(({ id, logs }) => {
                        const latestLog = logs[0];
                        return (
                        <article
                          className="equipment-verification-log-card"
                          key={id}
                          aria-label={`Log verifikasi: ${latestLog.title}`}
                        >
                          <div className="equipment-verification-log-entry">
                            <span
                              className={`badge ${getLogStatusBadgeClass(latestLog.status)}`}
                            >
                              {latestLog.status}
                            </span>
                            <div className="equipment-verification-log-entry__content">
                              <div
                                style={{
                                  fontSize: "var(--text-sm)",
                                  color: "var(--clr-dark-800)",
                                  fontWeight: "var(--fw-medium)",
                                }}
                              >
                                Verifikasi peralatan
                              </div>
                              {getVerificationActivityName(latestLog) && (
                                <div
                                  style={{
                                    marginTop: 4,
                                    fontSize: "var(--text-sm)",
                                    color: "var(--clr-dark-700)",
                                    fontWeight: "var(--fw-medium)",
                                  }}
                                >
                                  Nama aktivitas: {getVerificationActivityName(latestLog)}
                                </div>
                              )}
                              <div style={{ marginTop: 4, fontSize: "var(--text-sm)", color: "var(--clr-dark-600)" }}>
                                {logs.length} aksi tercatat · aksi terakhir: {latestLog.title}
                              </div>
                              {latestLog.actor && (
                                <div
                                  style={{
                                    marginTop: 4,
                                    fontSize: "var(--text-xs)",
                                    color: "var(--clr-dark-500)",
                                  }}
                                >
                                  Oleh: {latestLog.actor}
                                </div>
                              )}
                              {latestLog.date && (
                                <div
                                  style={{
                                    marginTop: 4,
                                    fontSize: "var(--text-xs)",
                                    color: "var(--clr-dark-500)",
                                  }}
                                >
                                  {formatDate(latestLog.date)}
                                </div>
                              )}
                            </div>
                            <div className="equipment-verification-log-actions">
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleSelectActivityLog(latestLog, logs, true)}
                              >
                                Log ({logs.length})
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleSelectActivityLog(latestLog, logs)}
                              >
                                Detail
                              </button>
                            </div>
                          </div>
                        </article>
                      )})}
                    </div>
                  )}
                </>
              ) : ["kalibrasi", "verifikasi_fungsi"].includes(selectedLogType) ? (
                <>
                  {logbookLoading ? (
                    <div style={{ textAlign: "center", padding: "var(--sp-4)", color: "#64748b", fontSize: "12px" }}>
                      Memuat log pemeriksaan berkala...
                    </div>
                  ) : logbookError ? (
                    <p className="alert alert-error" role="alert">{logbookError}</p>
                  ) : filteredPeriodicLogData.length === 0 ? (
                    <p style={{ margin: 0, color: "var(--clr-dark-500)", fontSize: "var(--text-sm)" }}>
                      Belum ada riwayat {logTypeLabels[selectedLogType].toLowerCase()}.
                    </p>
                  ) : (
                    <div className="equipment-verification-log-list">
                      {filteredPeriodicLogData.map((log) => (
                        <article className="equipment-verification-log-card" key={log.id}>
                          <div className="equipment-verification-log-entry">
                            <span className={`badge ${["Selesai", "Disetujui"].includes(log.status) ? "badge-aktif" : log.status === "Dibatalkan" ? "badge-rusak" : "badge-kalibrasi"}`}>
                              {log.status}
                            </span>
                            <div className="equipment-verification-log-entry__content">
                              <div style={{ fontSize: "var(--text-sm)", color: "var(--clr-dark-800)", fontWeight: "var(--fw-medium)" }}>
                                {log.title}
                              </div>
                              {log.description && (
                                <div style={{ marginTop: 4, fontSize: "var(--text-sm)", color: "var(--clr-dark-600)" }}>
                                  {log.description}
                                </div>
                              )}
                              {log.actor && (
                                <div style={{ marginTop: 4, fontSize: "var(--text-xs)", color: "var(--clr-dark-500)" }}>
                                  Pelaksana: {log.actor}
                                </div>
                              )}
                              <div style={{ marginTop: 4, fontSize: "var(--text-xs)", color: "var(--clr-dark-500)" }}>
                                {formatDate(log.date)}
                              </div>
                            </div>
                            <div className="equipment-verification-log-actions">
                              <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleSelectActivityLog(log)}>
                                Detail
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {logbookLoading ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "var(--sp-4)",
                        color: "#64748b",
                        fontSize: "12px",
                      }}
                    >
                      <RefreshCw
                        size={15}
                        className="spin"
                        style={{
                          display: "inline-block",
                          marginRight: 6,
                          verticalAlign: "middle",
                        }}
                      />
                      Memuat log {logTypeLabels[selectedLogType].toLowerCase()}
                      ...
                    </div>
                  ) : logbookError ? (
                    <p
                      className="alert alert-error"
                      role="alert"
                      style={{ margin: "0 0 var(--sp-3)" }}
                    >
                      {logbookError}
                    </p>
                  ) : filteredLogbookData.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "var(--sp-4)",
                        color: "#94a3b8",
                        fontSize: "12px",
                        background: "#f8fafc",
                        borderRadius: 6,
                      }}
                    >
                      {logbookData.length === 0
                        ? `Belum ada riwayat ${logTypeLabels[selectedLogType].toLowerCase()} untuk peralatan ini di database.`
                        : "Tidak ada log yang cocok dengan filter aktivitas dan waktu."}
                    </div>
                  ) : (
                    <div className="equipment-verification-log-list">
                      {loanLogGroups.map(({ id, logs }) => {
                        const activityLogs = logs.map((log) => ({
                          id: `logbook-${log.id}`,
                          jenis: selectedLogType,
                          date: log.created_at,
                          status: log.status || "—",
                          title: log.judul || log.aksi || "Aktivitas peminjaman",
                          description: log.keterangan || "",
                          actor: log.user?.name || "",
                          record: log,
                        }));
                        const latestLog = activityLogs[0];
                        return (
                          <article
                            className="equipment-verification-log-card"
                            key={id}
                            aria-label={`Log peminjaman: ${latestLog.title}`}
                          >
                            <div className="equipment-verification-log-entry">
                              <span className={`badge ${getLogStatusBadgeClass(latestLog.status)}`}>
                                {latestLog.status}
                              </span>
                              <div className="equipment-verification-log-entry__content">
                                <div
                                  style={{
                                    fontSize: "var(--text-sm)",
                                    color: "var(--clr-dark-800)",
                                    fontWeight: "var(--fw-medium)",
                                  }}
                                >
                                  {selectedLogType === "peminjaman"
                                    ? "Peminjaman peralatan"
                                    : latestLog.title}
                                </div>
                                <div style={{ marginTop: 4, fontSize: "var(--text-sm)", color: "var(--clr-dark-600)" }}>
                                  {activityLogs.length} aksi tercatat · aksi terakhir: {latestLog.title}
                                </div>
                                {latestLog.actor && (
                                  <div
                                    style={{
                                      marginTop: 4,
                                      fontSize: "var(--text-xs)",
                                      color: "var(--clr-dark-500)",
                                    }}
                                  >
                                    Oleh: {latestLog.actor}
                                  </div>
                                )}
                                {latestLog.date && (
                                  <div
                                    style={{
                                      marginTop: 4,
                                      fontSize: "var(--text-xs)",
                                      color: "var(--clr-dark-500)",
                                    }}
                                  >
                                    {formatDate(latestLog.date)}
                                  </div>
                                )}
                              </div>
                              <div className="equipment-verification-log-actions">
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleSelectActivityLog(latestLog, activityLogs, true)}
                                >
                                  Log ({activityLogs.length})
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleSelectActivityLog(latestLog, activityLogs)}
                                >
                                  Detail
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {visibleDetailSection === "informasi" && (
            <section className="card card-padded equipment-info-card">
              <div className="equipment-info-heading">
                <div className="equipment-info-icon">
                  <Package size={21} />
                </div>
                <h2 className="card-title">Informasi Alat</h2>
                <span
                  className={`badge ${displayStatus === "Aktif" ? "badge-aktif" : displayStatus === "Rusak" ? "badge-rusak" : "badge-gray"}`}
                >
                  {displayStatus === "Aktif"
                    ? "Tersedia"
                    : displayStatus || "–"}
                </span>
                {isVerified &&
                  latestApprovedVerification &&
                  canExportVerification && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        exportVerificationPdf(latestApprovedVerification)
                      }
                      title="Export PDF (TLKM13/F/003)"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginLeft: "auto",
                      }}
                    >
                      <Printer size={14} /> Export PDF
                    </button>
                  )}
              </div>
              <div className="equipment-info-body">
                <div className="equipment-info-grid">
                  <InfoRow
                    label="Nama Peralatan"
                    value={peralatan.nama_peralatan}
                  />
                  <InfoRow label="No. Aset" value={peralatan.nomor_aset} mono />
                  <InfoRow
                    label="Kategori"
                    value={peralatan.kategori_peralatan?.nama_kategori || "–"}
                  />
                  <InfoRow label="Merek" value={peralatan.merek || "–"} />
                  <InfoRow
                    label="Tipe/Model"
                    value={peralatan.tipe_model || "–"}
                  />
                  <InfoRow
                    label="No. Seri"
                    value={peralatan.nomor_seri || "–"}
                  />
                  <InfoRow
                    label="Perangkat Lunak / Software"
                    value={
                      peralatan.detail?.peranti_lunak_versi ||
                      peralatan.peranti_lunak_versi ||
                      "–"
                    }
                  />
                  <InfoRow
                    label="Kelompok Aset"
                    value={
                      assetGroup
                        ? `${assetGroup.nama}${assetGroup.kode ? ` (${assetGroup.kode})` : ""}`
                        : "Belum tersedia"
                    }
                  />
                  <InfoRow
                    label="Ruangan"
                    value={
                      room
                        ? `${room.nama_ruangan}${room.kode_ruangan ? ` (${room.kode_ruangan})` : ""}`
                        : "Belum tersedia"
                    }
                  />
                  <InfoRow
                    label="PIC Peralatan"
                    value={pic?.name || "Belum tersedia"}
                  />
                  <InfoRow
                    label="Laboratorium"
                    value={
                      lab
                        ? `${lab.nama_labs}${lab.kode_labs ? ` (${lab.kode_labs})` : ""}`
                        : "Belum tersedia"
                    }
                  />
                  <InfoRow
                    label="Terdaftar Pada"
                    value={formatDate(peralatan.created_at)}
                  />
                  {technicalRows.map(({ label, value }) => (
                    <InfoRow key={label} label={label} value={value} />
                  ))}
                  {peralatan.kode_aktivitas && (
                    <InfoRow
                      label="Nama Aktivitas"
                      value={getActivityName(peralatan.kode_aktivitas)}
                    />
                  )}
                  <InfoRow
                    label="Pemakai Terakhir"
                    value={
                      peralatan.pemakai_terakhir
                        ? `${peralatan.pemakai_terakhir.nama}${peralatan.pemakai_terakhir.sedang_digunakan ? " (Sedang Digunakan)" : peralatan.pemakai_terakhir.tanggal_keluar ? ` (${String(peralatan.pemakai_terakhir.tanggal_keluar).slice(0, 10)})` : ""}`
                        : "Belum pernah digunakan"
                    }
                  />
                  <InfoRow
                    label="Keterangan"
                    value={peralatan.keterangan || "–"}
                  />
                </div>
                <div className="equipment-info-photo">
                  <h3 className="equipment-info-photo-title">Foto Peralatan</h3>
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={peralatan.nama_peralatan}
                      className="photo-preview"
                    />
                  ) : (
                    <div className="equipment-photo-empty">
                      <Package size={32} />
                      <span>Belum ada foto</span>
                    </div>
                  )}
                  {canEditEquipment && (
                    <div style={{ marginTop: "var(--sp-3)" }}>
                      <label
                        className="btn btn-secondary"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                          justifyContent: "center",
                        }}
                        htmlFor="input-upload-foto"
                      >
                        {uploading ? (
                          <>
                            <div className="spinner" />
                            Mengunggah...
                          </>
                        ) : (
                          <>
                            <Upload size={14} /> {photoUrl ? "Ganti Foto" : "Unggah Foto"}
                          </>
                        )}
                      </label>
                      <input
                        id="input-upload-foto"
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleUploadFoto}
                        disabled={uploading}
                      />
                      {msg && (
                        <p
                          style={{
                            marginTop: "var(--sp-2)",
                            fontSize: "var(--text-xs)",
                            color: msg.startsWith("Gagal")
                              ? "var(--clr-error-500)"
                              : "var(--clr-success-500)",
                          }}
                        >
                          {msg}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {visibleDetailSection === "panduan-mutu" && canViewLabDocuments && (
            <section className="card card-padded equipment-guide-card">
              <div className="equipment-guide-heading">
                <h2 className="card-title">Bukti Kelayakan</h2>
                {/* <p>
                  Dokumen kalibrasi atau verifikasi fungsi untuk peralatan ini.
                </p> */}
              </div>
              {guideDocuments.length > 0 ? (
                <div style={{ display: "grid", gap: "var(--sp-3)" }}>
                  {guideDocuments.map((document) => (
                    <div
                      className="equipment-guide-document"
                      key={`${document.label}-${document.id}`}
                    >
                      <div className="equipment-guide-document-icon">
                        <FileText size={19} />
                      </div>
                      <div className="equipment-guide-document-copy">
                        <strong>{document.label}</strong>
                        {document.number && (
                          <span>Nomor dokumen: {document.number}</span>
                        )}
                        {document.date && (
                          <span>Tanggal: {formatTgl(document.date)}</span>
                        )}
                      </div>
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm"
                      >
                        <Download size={14} />
                        Lihat dokumen
                      </a>
                    </div>
                  ))}
                </div>
              ) : guideLoadError ? (
                <div className="empty-state" style={{ padding: "var(--sp-8)" }}>
                  <div className="empty-state-icon">
                    <FileText size={24} />
                  </div>
                  <p className="empty-state-title">
                    Dokumen panduan mutu gagal dimuat
                  </p>
                  <p className="empty-state-desc">{guideLoadError}</p>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: "var(--sp-8)" }}>
                  <div className="empty-state-icon">
                    <FileText size={24} />
                  </div>
                  <p className="empty-state-title">
                    Dokumen panduan mutu belum tersedia
                  </p>
                  <p className="empty-state-desc">
                    Dokumen akan tampil setelah sertifikat kalibrasi atau
                    laporan verifikasi fungsi diunggah.
                  </p>
                </div>
              )}
            </section>
          )}

          {visibleDetailSection === "dokumen" && canViewLabDocuments && (
            <section className="card equipment-document-card">
              <div className="card-header">
                <h2 className="card-title">Dokumen Peralatan</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                  <span className="badge badge-gray">
                    {dokumen.length} dokumen
                  </span>
                  {canEditEquipment && (
                    <label
                      className="btn btn-secondary btn-sm"
                      htmlFor="input-upload-dokumen"
                      style={{ cursor: uploadingDocument ? "wait" : "pointer" }}
                    >
                      <Upload size={14} />
                      {uploadingDocument ? "Mengunggah..." : "Unggah Dokumen"}
                    </label>
                  )}
                  {canEditEquipment && (
                    <input
                      id="input-upload-dokumen"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      style={{ display: "none" }}
                      onChange={handleUploadDocument}
                      disabled={uploadingDocument}
                    />
                  )}
                </div>
              </div>
              {dokumen.length === 0 ? (
                <div className="empty-state" style={{ padding: "var(--sp-8)" }}>
                  <div className="empty-state-icon">
                    <FileText size={24} />
                  </div>
                  <p className="empty-state-title">Belum ada dokumen</p>
                </div>
              ) : (
                <div style={{ padding: "var(--sp-2)" }}>
                  {dokumen.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--sp-3)",
                        padding: "var(--sp-3)",
                        borderRadius: "var(--radius-lg)",
                        transition: "background var(--duration-fast)",
                      }}
                      className="hover-bg"
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          background: "var(--clr-info-100)",
                          borderRadius: "var(--radius-md)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <FileText
                          size={16}
                          style={{ color: "var(--clr-info-500)" }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: "var(--fw-medium)",
                            fontSize: "var(--text-sm)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {d.nama_dokumen}
                        </div>
                      </div>
                      <a
                        href={`${API_BASE}${d.path_dokumen.startsWith("/") ? "" : "/"}${d.path_dokumen}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm"
                        title="Unduh/Lihat"
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {visibleDetailSection === "qr" && isVerified && (
            <section className="card card-padded equipment-qr-card">
              <h2 className="section-title">QR Code Peralatan</h2>
              {isVerified ? (
                <div className="qr-container">
                  <p
                    style={{
                      color: "var(--clr-dark-500)",
                      fontSize: "var(--text-sm)",
                      margin: 0,
                    }}
                  >
                    Arahkan kamera ponsel ke QR Code yang tampil di halaman ini.
                  </p>
                  <img
                    src={qrSrc}
                    alt={`QR Code Peralatan ID ${canonicalEquipmentId}`}
                    className="qr-image"
                    id={`qr-img-${canonicalEquipmentId}`}
                  />
                  {!qrSrc && (
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--clr-dark-500)",
                      }}
                    >
                      Memuat QR Code...
                    </span>
                  )}
                  {qrError && (
                    <p
                      className="alert alert-error"
                      role="alert"
                      style={{ margin: 0 }}
                    >
                      {qrError}
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--clr-dark-500)",
                    }}
                  >
                    QR ID Peralatan: <strong>#{canonicalEquipmentId}</strong> (
                    {peralatan.nomor_aset})
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    disabled={!qrSrc}
                    className="btn btn-secondary btn-sm"
                    id="btn-unduh-qr"
                    style={{ cursor: "pointer" }}
                  >
                    <Download size={14} /> Unduh QR
                  </button>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: "var(--sp-6)" }}>
                  <div className="empty-state-icon">
                    <QrCode size={24} />
                  </div>
                  <p className="empty-state-title">QR Code belum tersedia</p>
                  <p className="empty-state-desc">
                    QR Code dapat digunakan setelah peralatan disetujui manager.
                  </p>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
      {selectedActivityLog &&
        createPortal(
          <div
            className="modal-overlay equipment-log-review-overlay"
            role="presentation"
            onClick={() => setSelectedActivityLog(null)}
          >
            <section
              className="modal modal-lg equipment-log-review-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="equipment-log-review-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h2 className="modal-title" id="equipment-log-review-title">
                    {selectedActivityLog.showAllLogs
                      ? `Log ${selectedActivityLog.title}`
                      : `Detail ${selectedActivityLog.title}`}
                  </h2>
                  <p
                    className="page-subtitle"
                    style={{ margin: "4px 0 0", fontSize: "var(--text-xs)" }}
                  >
                    {peralatan.nama_peralatan} ({peralatan.nomor_aset})
                  </p>
                </div>
                <div style={{ display: "flex", gap: "var(--sp-2)" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handlePrintActivityLog}
                  >
                    <Printer size={14} /> Cetak PDF Log
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedActivityLog(null)}
                  >
                    Tutup
                  </button>
                </div>
              </div>
              <div className="modal-body">
                {selectedActivityLog.showAllLogs && (
                  <section style={{ marginBottom: "var(--sp-4)" }}>
                  <h3 className="section-title">
                    Semua aksi ({(selectedActivityLog.groupLogs || [selectedActivityLog]).length})
                  </h3>
                  <div className="equipment-verification-log-card">
                    {(selectedActivityLog.groupLogs || [selectedActivityLog]).map((log, index) => (
                      <div
                        className="equipment-verification-log-entry"
                        key={log.id || `${log.date}-${index}`}
                        style={{ borderTop: index ? "1px solid var(--clr-dark-100)" : 0 }}
                      >
                        <span className={`badge ${
                          getLogStatusBadgeClass(log.status)
                        }`}>
                          {log.status || "—"}
                        </span>
                        <div className="equipment-verification-log-entry__content">
                          <strong style={{ color: "var(--clr-dark-800)", fontSize: "var(--text-sm)" }}>
                            {log.title || log.judul || log.aksi || "Aktivitas"}
                          </strong>
                          {(log.description || log.keterangan) && (
                            <div style={{ marginTop: 4, color: "var(--clr-dark-600)", fontSize: "var(--text-sm)", whiteSpace: "pre-wrap" }}>
                              {log.description || log.keterangan}
                            </div>
                          )}
                          {(log.actor || log.user?.name) && (
                            <div style={{ marginTop: 4, color: "var(--clr-dark-500)", fontSize: "var(--text-xs)" }}>
                              Oleh: {log.actor || log.user?.name}
                            </div>
                          )}
                          {(log.date || log.created_at) && (
                            <div style={{ marginTop: 4, color: "var(--clr-dark-500)", fontSize: "var(--text-xs)" }}>
                              {formatDate(log.date || log.created_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  </section>
                )}
                {!selectedActivityLog.showAllLogs && (
                <div className="equipment-info-grid">
                  <InfoRow
                    label="Jenis Log"
                    value={
                      logTypeLabels[selectedActivityLog.jenis] || "Peninjauan"
                    }
                  />
                  <InfoRow label="Status" value={selectedActivityLog.status} />
                  <InfoRow
                    label="Tanggal"
                    value={formatDate(selectedActivityLog.date)}
                  />
                  {selectedActivityLog.jenis === "peminjaman" ? (
                    <>
                      <InfoRow
                        label="Aksi"
                        value={selectedActivityLog.record.aksi}
                      />
                      <InfoRow
                        label="ID Log"
                        value={selectedActivityLog.record.id}
                      />
                      <InfoRow
                        label="ID Peminjaman"
                        value={selectedActivityLog.record.referensi_id}
                      />
                      <InfoRow
                        label="Petugas / User"
                        value={selectedActivityLog.actor}
                      />
                      <InfoRow
                        label="Keterangan"
                        value={selectedActivityLog.description}
                      />
                    </>
                  ) : (
                    <>
                      {selectedLogVerification.kode_aktivitas && (
                        <InfoRow
                          label="Nama Aktivitas"
                          value={getActivityName(
                            selectedLogVerification.kode_aktivitas,
                          )}
                        />
                      )}
                      {selectedLogVerification.keputusan && (
                        <InfoRow
                          label="Keputusan"
                          value={selectedLogVerification.keputusan}
                        />
                      )}
                      {selectedActivityLog.record.alasan && (
                        <InfoRow
                          label="Alasan Peninjauan"
                          value={selectedActivityLog.record.alasan}
                        />
                      )}
                      {selectedActivityLog.record.catatan_peninjauan && (
                        <InfoRow
                          label="Catatan Peninjauan"
                          value={selectedActivityLog.record.catatan_peninjauan}
                        />
                      )}
                      {selectedLogVerification.tindak_lanjut && (
                        <InfoRow
                          label="Tindak Lanjut"
                          value={selectedLogVerification.tindak_lanjut}
                        />
                      )}
                      {selectedLogVerification.pic_user && (
                        <InfoRow
                          label="PIC"
                          value={
                            selectedLogVerification.pic_user.nama_lengkap ||
                            selectedLogVerification.pic_user.nama ||
                            selectedLogVerification.pic_user.name ||
                            selectedLogVerification.pic_user.username
                          }
                        />
                      )}
                      {selectedLogVerification.verified_by_user && (
                        <InfoRow
                          label="Diverifikasi Oleh"
                          value={
                            selectedLogVerification.verified_by_user
                              .nama_lengkap ||
                            selectedLogVerification.verified_by_user.nama ||
                            selectedLogVerification.verified_by_user.name ||
                            selectedLogVerification.verified_by_user.username
                          }
                        />
                      )}
                    </>
                  )}
                </div>
                )}
                {!selectedActivityLog.showAllLogs &&
                  selectedActivityLog.jenis !== "peminjaman" &&
                  selectedLogNotes && (
                  <section style={{ marginTop: "var(--sp-4)" }}>
                    <h3 className="section-title">Data Pendukung Verifikasi</h3>
                    <div className="equipment-info-grid">
                      <InfoRow
                        label="Acuan Kriteria"
                        value={
                          selectedLogNotes.acuan_kriteria ||
                          "Spesifikasi Pabrikan / Prosedur Mutu TTH"
                        }
                      />
                      <InfoRow
                        label="Nomor Sertifikat"
                        value={selectedLogNotes.sertifikat?.nomor}
                      />
                      <InfoRow
                        label="Berlaku Sampai"
                        value={selectedLogNotes.sertifikat?.berlaku_sampai}
                      />
                      <InfoRow
                        label="Penerapan Nilai Koreksi"
                        value={
                          selectedLogNotes.sertifikat?.penerapan_nilai_koreksi
                        }
                      />
                      {selectedLogNotes.catatan_pic && (
                        <InfoRow
                          label="Catatan PIC"
                          value={selectedLogNotes.catatan_pic}
                        />
                      )}
                      {Object.entries(selectedLogNotes.alasan_tb || {}).map(
                        ([key, reason]) => (
                          <InfoRow
                            key={key}
                            label={`Alasan ${getVerificationCheckLabel(key)}`}
                            value={reason}
                          />
                        ),
                      )}
                    </div>
                  </section>
                )}
                {!selectedActivityLog.showAllLogs &&
                  selectedActivityLog.jenis !== "peminjaman" &&
                  (selectedActivityLog.record.catatan ||
                    selectedActivityLog.record.verifikasi?.catatan) &&
                  !selectedLogNotes && (
                    <div style={{ marginTop: "var(--sp-4)" }}>
                      <InfoRow
                        label="Catatan"
                        value={
                          selectedActivityLog.record.catatan ||
                          selectedActivityLog.record.verifikasi.catatan
                        }
                      />
                    </div>
                  )}
                {!selectedActivityLog.showAllLogs &&
                  selectedActivityLog.jenis !== "peminjaman" &&
                  selectedLogVerification.hasil_verifikasi?.[0] && (
                    <div style={{ marginTop: "var(--sp-4)" }}>
                      <h3 className="section-title">Hasil Pemeriksaan</h3>
                      <div className="equipment-info-grid">
                        {[
                          ["Identitas Alat Ukur", "identitas"],
                          ["Kelengkapan Aksesoris", "kelengkapan"],
                          ["Firmware / Peranti Lunak", "firmware"],
                          ["Kondisi Fisik / Visual", "kondisi_fisik"],
                          ["Keutuhan Segel Kalibrasi", "segel"],
                          ["Pemeriksaan Fungsi Awal", "fungsi_awal"],
                          ["Kesesuaian Spesifikasi Metrologi", "metrologi"],
                          ["Validitas Sertifikat Kalibrasi", "sertifikat"],
                        ]
                          .filter(
                            ([, key]) =>
                              selectedLogVerification.kode_aktivitas !== "A3" ||
                              !["kelengkapan", "fungsi_awal"].includes(key),
                          )
                          .map(([label, key]) => (
                            <InfoRow
                              key={key}
                              label={label}
                              value={formatVerificationResult(
                                selectedLogVerification.hasil_verifikasi[0][key],
                                key,
                              )}
                            />
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            </section>
          </div>,
          document.body,
        )}
    </div>
  );
}

function parseVerificationNotes(rawNotes) {
  if (!rawNotes) return null;
  if (typeof rawNotes === "object") return rawNotes;
  try {
    const parsed = JSON.parse(rawNotes);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function getVerificationCheckLabel(key) {
  const labels = {
    identitas: "Identitas Alat Ukur",
    kelengkapan: "Kelengkapan Aksesoris",
    firmware: "Firmware / Peranti Lunak",
    kondisi_fisik: "Kondisi Fisik / Visual",
    segel: "Keutuhan Segel Kalibrasi",
    fungsi_awal: "Pemeriksaan Fungsi Awal",
    metrologi: "Kesesuaian Spesifikasi Metrologi",
    sertifikat: "Validitas Sertifikat Kalibrasi",
  };
  return labels[key] || key.replaceAll("_", " ");
}

function formatVerificationResult(result, key) {
  if (key === "firmware") {
    if (result === "S") return "Ada";
    if (result === "TS") return "Tidak Ada";
    if (result === "TB") return "Belum dinilai";
  }
  if (result === "S") return "Sesuai";
  if (result === "TS") return "Tidak Sesuai";
  if (result === "TB") return "Tidak Berlaku";
  return result;
}

// helpers
function getActivityName(code) {
  const activityNames = {
    A1: "Penerimaan alat baru",
    A2: "Kalibrasi",
    A3: "Peminjaman / pemindahan / penyewaan",
    A4: "Setelah pemeliharaan",
    A5: "Pengecekan antara / verifikasi fungsi",
  };
  const activityCode = String(code || "")
    .trim()
    .toUpperCase();
  return activityNames[activityCode] || code;
}

function getEquipmentDetailRows(peralatan) {
  const categoryId = getEquipmentCategoryId(peralatan);
  const method = String(peralatan.metode_pemeriksaan || "")
    .trim()
    .toLowerCase();
  const isFunctionVerification =
    method === "verifikasi fungsi" || (!method && categoryId === 2);
  const isCalibration = method === "kalibrasi" || (!method && categoryId === 1);
  const detail =
    peralatan.detail ||
    peralatan.detail_alat_ukur ||
    peralatan.detail_alat_bantu ||
    peralatan.detail_artefak_acuan ||
    peralatan.detail_komponen_pendukung ||
    peralatan;
  const verificationFields = [
    ["Jenis Pemeriksaan Berkala", "jenis_pemeriksaan_berkala"],
    ["Tgl. Pemeriksaan Terakhir", "tgl_pemeriksaan_terakhir", "date"],
    ["Jatuh Tempo Verifikasi Fungsi", "tgl_jatuh_tempo", "date"],
    ["Interval Verifikasi Fungsi", "interval_bulan", "months"],
    ["Fungsi sebagai Alat Standar", "fungsi_sbg_alat_standar", "boolean"],
    ["Acuan Pembanding", "acuan_pembanding"],
    ["Pelaksana", "pelaksana"],
    ["Hasil Verifikasi Fungsi", "hasil"],
    ["No. Laporan Verifikasi", "no_laporan"],
  ];
  const calibrationFields = [
    ["No. Sertifikat", "no_sertifikat"],
    ["Kalibrasi Terakhir", "tgl_kalibrasi", "date"],
    ["Jatuh Tempo Kalibrasi", "tgl_jatuh_tempo", "date"],
    ["Interval Kalibrasi", "interval_bulan", "months"],
  ];
  const fieldsByCategory = {
    1: isFunctionVerification
      ? verificationFields
      : [
          ["Metode Kelayakan", "metode_kelayakan"],
          ...calibrationFields,
          ["Fungsi sebagai Alat Standar", "fungsi_sbg_alat_standar", "boolean"],
          ["Parameter / Rentang Ukur", "parameter_rentang_ukur"],
          ["Resolusi", "resolusi"],
          ["Akurasi Spesifikasi", "akurasi_spesifikasi"],
          ["Satuan", "satuan"],
          ["Nilai Koreksi", "nilai_koreksi"],
          ["Ketidakpastian", "ketidakpastian"],
          ["Jenis Label", "jenis_label"],
          ["Status Kelayakan", "status_kelayakan"],
        ],
    2: isFunctionVerification
      ? verificationFields
      : [
          ["Metode Kalibrasi", "metode"],
          ["Laboratorium Kalibrasi", "lab_kalibrasi"],
          ...calibrationFields,
        ],
    3: [
      ["Jenis Deskripsi", "jenis_deskripsi"],
      ["Karakteristik yang Diacu", "karakteristik_yang_diacu"],
      ["Nilai Spesifikasi Karakterisasi", "nilai_spesifikasi_karakterisasi"],
      ["Metode Karakterisasi", "metode_karakterisasi"],
      ["No. Laporan Karakterisasi", "no_laporan_karakterisasi"],
      ["Tgl. Karakterisasi Terakhir", "tgl_karakterisasi_terakhir", "date"],
      ["Tgl. Karakterisasi Ulang", "tgl_karakterisasi", "date"],
      ["Interval Karakterisasi", "interval_bulan", "months"],
      ["Kondisi Penyimpanan", "kondisi_penyimpanan"],
      ["Status Artefak", "status"],
    ],
    4: [
      ["Sub Kategori", "sub_kategori"],
      ["Deskripsi / Spesifikasi", "deskripsi_spesifikasi"],
      ["Grade Mutu", "grade_mutu"],
      ["Sumber / Pemasok", "sumber_pemasok"],
      ["No. Lot / Batch / Edisi", "no_lot_batch_edisi"],
      ["Satuan Kemasan", "satuan_kemasan"],
      ["Tgl. Terima / Terbit", "tgl_terima_terbit", "date"],
      ["Tgl. Kedaluwarsa", "tgl_kedaluwarsa", "date"],
      ["Kondisi Penyimpanan", "kondisi_penyimpanan"],
      ["Status Ketersediaan", "status_ketersediaan"],
    ],
  };

  return (fieldsByCategory[categoryId] || []).flatMap(([label, key, type]) => {
    const rawValue = detail[key];
    if (rawValue === null || rawValue === undefined || rawValue === "") {
      if (isCalibration && ["tgl_kalibrasi", "tgl_jatuh_tempo"].includes(key)) {
        return [{ label, value: "Belum tersedia" }];
      }
      if (
        isFunctionVerification &&
        ["tgl_pemeriksaan_terakhir", "tgl_jatuh_tempo"].includes(key)
      ) {
        return [{ label, value: "Belum tersedia" }];
      }
      return [];
    }

    let value = rawValue;
    if (type === "date") value = formatDate(rawValue);
    if (type === "months") value = rawValue ? `${rawValue} Bulan` : "";
    if (type === "boolean") value = rawValue ? "Ya" : "Tidak";
    if (value === "") return [];
    return [{ label, value }];
  });
}

function InfoRow({ label, value, mono }) {
  return (
    <div style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
      <div
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: "var(--fw-semibold)",
          color: "var(--clr-dark-500)",
          marginBottom: 2,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--clr-dark-900)",
          fontFamily: mono ? "monospace" : "inherit",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}
      >
        {value || "–"}
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "–";
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
