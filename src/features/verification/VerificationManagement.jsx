import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  FileCheck,
  Send,
  XCircle,
  Package,
  Eraser,
  Eye,
  FileText,
  Printer,
  X,
} from "lucide-react";
import {
  getCurrentUser,
  getSavedSignature,
  saveSignature,
  removeSavedSignature,
  verifikasiApi,
  peralatanApi,
  ruanganApi,
  getEquipmentId,
} from "../../shared/services/api.js";
import { useToast } from "../../app/providers/ToastContext.jsx";
import {
  getUserRole,
  can,
  isStaffPengelola,
  ACCESS,
  ACTIONS,
} from "../../shared/utils/permissions.js";
import { getSafeReturnPath, useNavigate } from "../../app/router/Router.jsx";
import {
  exportVerificationPdf,
  exportVerificationWord,
} from "../../shared/lib/verificationPdf.js";
import Pagination, { usePagination } from "../../shared/components/ui/Pagination.jsx";
import DataTable from "../../shared/components/ui/DataTable.jsx";
import TableFilters from "../../shared/components/ui/TableFilters.jsx";

const CHECKS = [
  "identitas",
  "kelengkapan",
  "firmware",
  "kondisi_fisik",
  "segel",
  "fungsi_awal",
  "metrologi",
  "sertifikat",
];

const CHECK_LABELS = {
  identitas: "Identitas Alat Ukur",
  kelengkapan: "Kelengkapan Aksesori dan Manual",
  firmware: "Versi Firmware / Peranti Lunak",
  kondisi_fisik: "Kondisi Fisik",
  segel: "Keutuhan Label Kalibrasi dan Void",
  fungsi_awal: "Fungsi Kerja",
  metrologi: "Kesesuaian Spesifikasi Metrologi",
  sertifikat: "Validitas Sertifikat Kalibrasi",
};

const ACTIVITY_OPTIONS = [
  ["A1", "Penerimaan alat baru"],
  ["A2", "Setelah kalibrasi"],
  ["A3", "Setelah dipinjam/dipindah/disewa"],
  ["A4", "Setelah pemeliharaan"],
  ["A5", "Pengecekan antara/Verifikasi fungsi"],
];

const ACTIVITY_REQUIREMENTS = {
  A1: {
    identitas: "W",
    kelengkapan: "W",
    firmware: "K",
    kondisi_fisik: "W",
    segel: "W",
    fungsi_awal: "W",
    metrologi: "W",
    sertifikat: "W",
  },
  A2: {
    identitas: "W",
    kelengkapan: "K",
    firmware: "K",
    kondisi_fisik: "W",
    segel: "W",
    fungsi_awal: "W",
    metrologi: "K",
    sertifikat: "W",
  },
  A3: {
    identitas: "W",
    kelengkapan: "-",
    firmware: "K",
    kondisi_fisik: "W",
    segel: "W",
    fungsi_awal: "-",
    metrologi: "K",
    sertifikat: "-",
  },
  A4: {
    identitas: "W",
    kelengkapan: "-",
    firmware: "W",
    kondisi_fisik: "W",
    segel: "W",
    fungsi_awal: "W",
    metrologi: "-",
    sertifikat: "-",
  },
  A5: {
    identitas: "W",
    kelengkapan: "K",
    firmware: "W",
    kondisi_fisik: "W",
    segel: "W",
    fungsi_awal: "W",
    metrologi: "K",
    sertifikat: "W",
  },
};

const FOLLOW_UP_OPTIONS = [
  "Dapat Digunakan - Perbarui Daftar Peralatan",
  "Tidak Dapat Digunakan - Masuk Peralatan dalam Masa Peninjauan",
];

function isMetrologyApplicable(equipment) {
  return String(equipment?.nomor_aset || "")
    .trim()
    .toUpperCase()
    .startsWith("KAL");
}

function getActivityLabel(code) {
  return (
    ACTIVITY_OPTIONS.find(([activityCode]) => activityCode === code)?.[1] ||
    "Aktivitas peralatan"
  );
}

function getEquipmentKeterangan(equipment) {
  if (equipment?.status_verifikasi === "Ditolak") {
    return "Perlu verifikasi ulang";
  }
  if (equipment?.status_verifikasi === "Diajukan") {
    return "Menunggu persetujuan Manager";
  }
  if (equipment?.status_verifikasi !== "Disetujui") {
    return "Menunggu verifikasi";
  }

  switch (equipment?.status_alat) {
    case "Aktif":
      return "Masuk inventaris";
    case "Dalam Kalibrasi":
      return "Sedang dikalibrasi";
    case "Dipinjam":
      return "Sedang dipinjam";
    case "Rusak":
      return "Dalam kondisi rusak";
    case "Karantina":
      return "Dalam karantina";
    default:
      return equipment?.status_alat || "Masuk inventaris";
  }
}

function isEquipmentInUserLab(equipment, roomsById, userLabId) {
  if (userLabId == null) return false;

  const equipmentRoom = equipment?.ruangan;
  const roomId =
    equipment?.ruangan_id ?? equipment?.room_id ?? equipmentRoom?.id;
  const room = roomsById.get(String(roomId)) || equipmentRoom;
  const roomLabId = room?.labs_id ?? room?.labs?.id;

  return roomLabId != null && String(roomLabId) === String(userLabId);
}

function DigitalSignaturePad({
  value,
  onChange,
  label,
  required = true,
  savedSignature = "",
  onRestore,
  onForgetSaved,
}) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  // Inisialisasi canvas dengan DPI scaling agar garis tajam dan tidak buram di layar Retina / mobile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = 140;

    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#0f172a";
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = 140;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    if (!value) return undefined;

    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.drawImage(img, 0, 0, width, height);
      ctx.restore();
    };
    img.src = value;

    return () => {
      img.onload = null;
    };
  }, [value]);

  function getPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function handlePointerDown(e) {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    drawingRef.current = true;
    const { x, y } = getPoint(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const { x, y } = getPoint(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function handlePointerUp(e) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (canvasRef.current) {
      onChange(canvasRef.current.toDataURL("image/png"));
    }
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    onChange("");
  }

  return (
    <div className="form-group" style={{ marginBottom: "var(--sp-3)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <label
          className="form-label"
          style={{
            margin: 0,
            fontWeight: "var(--fw-semibold)",
            fontSize: "var(--text-xs)",
          }}
        >
          {label}{" "}
          {required && (
            <span style={{ color: "var(--clr-error-500, #ef4444)" }}>*</span>
          )}
        </label>
        {value ? (
          <span
            className="badge badge-aktif"
            style={{
              fontSize: "11px",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <CheckCircle2 size={12} /> Tanda tangan tercatat
          </span>
        ) : (
          <span className="badge badge-gray" style={{ fontSize: "11px" }}>
            Belum ditandatangani
          </span>
        )}
      </div>

      <div
        className="verification-signature-pad-frame"
        style={{
          position: "relative",
          borderRadius: "var(--radius-lg, 10px)",
          border: "1.5px dashed var(--clr-dark-300, #cbd5e1)",
          background: "#ffffff",
          overflow: "hidden",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        {/* Garis batas panduan tanda tangan */}
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 32,
            borderBottom: "1px dashed #cbd5e1",
            pointerEvents: "none",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              color: "#94a3b8",
              background: "#ffffff",
              padding: "0 4px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Tanda Tangan di Atas Garis Ini
          </span>
          <span style={{ fontSize: "10px", color: "#94a3b8" }}>✕</span>
        </div>

        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            width: "100%",
            height: 110,
            display: "block",
            cursor: "crosshair",
            touchAction: "none",
            position: "relative",
            zIndex: 2,
          }}
          aria-label={label}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 6,
        }}
      >
        <button
          type="button"
          className="btn btn-ghost btn-sm text-error"
          onClick={clear}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "2px 8px",
            fontSize: "12px",
          }}
        >
          <Eraser size={14} /> Hapus & Goreskan Ulang
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          {!value && savedSignature && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onRestore}
              style={{ padding: "2px 8px", fontSize: "12px" }}
            >
              Gunakan Tersimpan
            </button>
          )}
          {savedSignature && (
            <button
              type="button"
              className="btn btn-ghost btn-sm text-error"
              onClick={onForgetSaved}
              style={{ padding: "2px 8px", fontSize: "12px" }}
            >
              Hapus Tersimpan
            </button>
          )}
        </div>
      </div>
      <div
        style={{ marginTop: 4, fontSize: "11px", color: "var(--clr-dark-400)" }}
      >
        Tanda tangan tersimpan di sesi tab ini untuk akun Anda dan dihapus saat
        logout.
      </div>
      <div
        style={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}
      >
        <span style={{ fontSize: "11px", color: "var(--clr-dark-400)" }}>
          Gunakan mouse, stylus, atau sentuhan layar
        </span>
      </div>
    </div>
  );
}

// Komponen kartu tampilan tanda tangan resmi untuk modal rincian & persetujuan
function SignatureDisplayCard({
  title,
  roleLabel,
  signature,
  signerName,
  signerNip,
  signedAt,
}) {
  const isSigned = Boolean(signature);
  return (
    <div
      className="verification-signature-card"
      style={{
        border: "1px solid var(--clr-dark-200, #e2e8f0)",
        borderRadius: "var(--radius-lg, 10px)",
        background: "var(--clr-dark-50, #f8fafc)",
        padding: "var(--sp-4)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: "var(--fw-bold)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--clr-dark-600)",
          }}
        >
          {title}
        </span>
        <span
          className={`badge ${isSigned ? "badge-aktif" : "badge-gray"}`}
          style={{ fontSize: "11px" }}
        >
          {isSigned ? "Terverifikasi Digital" : "Belum Ditandatangani"}
        </span>
      </div>

      <div
        style={{
          background: "#ffffff",
          borderRadius: "var(--radius-md, 6px)",
          border: "1px solid var(--clr-dark-200, #e2e8f0)",
          minHeight: 85,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 6,
          marginBottom: 8,
        }}
      >
        {isSigned ? (
          <img
            src={signature}
            alt={title}
            style={{
              maxHeight: 70,
              maxWidth: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        ) : (
          <span
            style={{
              fontSize: "12px",
              color: "var(--clr-dark-400)",
              fontStyle: "italic",
            }}
          >
            Menunggu tanda tangan digital...
          </span>
        )}
      </div>

      <div
        style={{
          borderTop: "1px dashed var(--clr-dark-200, #e2e8f0)",
          paddingTop: 6,
        }}
      >
        <div
          style={{
            fontWeight: "var(--fw-bold)",
            fontSize: "var(--text-xs)",
            color: "var(--clr-dark-900)",
          }}
        >
          {signerName || "-"}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--clr-dark-500)",
            marginTop: 1,
          }}
        >
          {signerNip || roleLabel || "-"}
        </div>
        {signedAt && (
          <div
            style={{
              fontSize: "10px",
              color: "var(--clr-dark-400)",
              marginTop: 2,
            }}
          >
            Tgl: {new Date(signedAt).toLocaleString("id-ID")}
          </div>
        )}
      </div>
    </div>
  );
}

const emptyForm = () => ({
  id_peralatan: "",
  tanggal_verifikasi: new Date().toISOString().slice(0, 10),
  kode_aktivitas: "A1",
  tindak_lanjut: "Masuk layanan - label diperbarui",
  catatan: "",
  acuan_kriteria: "",
  nomor_sertifikat: "",
  penyedia_kalibrasi: "",
  berlaku_sampai: "",
  nilai_koreksi: "T Tidak diterapkan",
  firmware_versi_aktual: "",
  tb_alasan: {},
  ts_alasan: {},
  hasil_verifikasi: Object.fromEntries(CHECKS.map((key) => [key, ""])),
});

export default function VerificationManagement({
  equipmentId = null,
  onNavigate,
}) {
  const returnPath = getSafeReturnPath("/verifikasi");
  const routerNavigate = useNavigate();
  const navigate = onNavigate || routerNavigate;
  const { success, error } = useToast();
  const currentUser = getCurrentUser();
  const role = getUserRole(currentUser);
  const staffIsPengelola = role === "staff" && isStaffPengelola(currentUser);
  const isLabScopedUser = role === "staff" || role === "manager";
  const canSubmit = staffIsPengelola || role === "manager" || role === "admin";
  const canApprove = role === "manager" || role === "admin";
  const currentUserLabId = currentUser?.labs_id ?? currentUser?.labs?.id;
  const [savedSignature, setSavedSignature] = useState(() =>
    getSavedSignature(currentUser),
  );

  const [activeTab, setActiveTab] = useState("pending"); // 'pending' | 'review' | 'history'
  const [items, setItems] = useState([]);
  const [pendingEquipment, setPendingEquipment] = useState([]);
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingCategoryFilter, setPendingCategoryFilter] = useState("");
  const [pendingActivityFilter, setPendingActivityFilter] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewActivityFilter, setReviewActivityFilter] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("");
  const [historyActivityFilter, setHistoryActivityFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(() => ({
    ...emptyForm(),
    id_peralatan: equipmentId || "",
  }));
  const [busy, setBusy] = useState(false);
  const [loadingEquipment, setLoadingEquipment] = useState(
    Boolean(equipmentId),
  );
  const [equipmentInfo, setEquipmentInfo] = useState(null);
  const [picSignature, setPicSignature] = useState(() =>
    getSavedSignature(currentUser),
  );
  const [managerSignature, setManagerSignature] = useState(() =>
    getSavedSignature(currentUser),
  );
  const [approvalModalItem, setApprovalModalItem] = useState(null);
  const [approvalMode, setApprovalMode] = useState("approve"); // 'approve' | 'reject'
  const [rejectReason, setRejectReason] = useState("");
  const [rejectCatatan, setRejectCatatan] = useState("");
  const [affirmApproved, setAffirmApproved] = useState(false);

  function handleSignatureChange(setSignature, signature) {
    setSignature(signature);
    if (!signature) return;

    try {
      saveSignature(signature, currentUser);
      setSavedSignature(signature);
    } catch (err) {
      error(
        err.message ||
          "Tanda tangan digunakan, tetapi gagal disimpan untuk penggunaan berikutnya.",
      );
    }
  }

  function forgetSavedSignature() {
    try {
      removeSavedSignature(currentUser);
      setSavedSignature("");
      success("Tanda tangan tersimpan telah dihapus dari sesi ini.");
    } catch (err) {
      error(err.message || "Gagal menghapus tanda tangan tersimpan.");
    }
  }

  // Memuat daftar verifikasi dan peralatan yang menunggu verifikasi.
  async function loadList() {
    setBusy(true);
    try {
      if (isLabScopedUser && currentUserLabId == null) {
        throw new Error("Akun pengguna belum terhubung dengan lab.");
      }

      const [verificationResult, equipmentResult, roomsResult] =
        await Promise.allSettled([
          verifikasiApi.getAll(),
          peralatanApi.getAll(),
          isLabScopedUser ? ruanganApi.getAll() : Promise.resolve({ data: [] }),
        ]);
      if (isLabScopedUser && roomsResult.status !== "fulfilled") {
        throw (
          roomsResult.reason ||
          new Error("Gagal memuat data ruangan untuk memeriksa lab pengguna.")
        );
      }
      if (isLabScopedUser && equipmentResult.status !== "fulfilled") {
        throw (
          equipmentResult.reason ||
          new Error("Gagal memuat data peralatan untuk memeriksa lab pengguna.")
        );
      }
      const roomList =
        roomsResult.status === "fulfilled" ? roomsResult.value?.data || [] : [];
      const roomsById = new Map(
        roomList.map((room) => [String(room.id), room]),
      );
      const allEquipment =
        equipmentResult.status === "fulfilled"
          ? equipmentResult.value?.data || []
          : [];
      const equipmentById = new Map(
        allEquipment.map((equipment) => [
          String(getEquipmentId(equipment)),
          equipment,
        ]),
      );

      if (verificationResult.status === "fulfilled") {
        const allVerifications = verificationResult.value?.data || [];
        setItems(
          isLabScopedUser
            ? allVerifications.filter((item) => {
                const equipment =
                  item.peralatan ||
                  equipmentById.get(String(item.id_peralatan));
                return isEquipmentInUserLab(
                  equipment,
                  roomsById,
                  currentUserLabId,
                );
              })
            : allVerifications,
        );
      }
      if (equipmentResult.status === "fulfilled") {
        // Peralatan yang perlu verifikasi awal (belum disetujui, belum diajukan, dan belum dihapus)
        const pending = allEquipment.filter(
          (p) =>
            p.status_verifikasi !== "Disetujui" &&
            p.status_verifikasi !== "Diajukan",
        );
        const visiblePending =
          isLabScopedUser
            ? pending.filter((p) =>
                isEquipmentInUserLab(p, roomsById, currentUserLabId),
              )
            : pending;
        setPendingEquipment(
          visiblePending.map((equipment) => {
            const room =
              equipment.ruangan ||
              roomsById.get(
                String(equipment.ruangan_id ?? equipment.room_id ?? ""),
              );
            return {
              ...equipment,
              ruangan: room,
              laboratorium:
                equipment.laboratorium || room?.labs || equipment.laboratorium,
            };
          }),
        );
      }
    } catch (err) {
      error(err.message || "Gagal memuat data verifikasi.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!equipmentId) {
      loadList();
    }
  }, [equipmentId]);

  // Saat equipmentId tersedia (setelah input data peralatan atau klik tombol Verifikasi)
  useEffect(() => {
    if (!equipmentId) return;
    setEquipmentInfo(null);
    setForm((prev) => ({ ...prev, id_peralatan: String(equipmentId) }));

    async function fetchEquipment() {
      setLoadingEquipment(true);
      try {
        if (isLabScopedUser && currentUserLabId == null) {
          throw new Error("Akun pengguna belum terhubung dengan lab.");
        }

        const [res, roomsRes] = await Promise.allSettled([
          peralatanApi.getAll(),
          isLabScopedUser ? ruanganApi.getAll() : Promise.resolve({ data: [] }),
        ]);
        if (isLabScopedUser && roomsRes.status !== "fulfilled") {
          throw (
            roomsRes.reason ||
            new Error("Gagal memuat data ruangan untuk memeriksa lab pengguna.")
          );
        }
        if (isLabScopedUser && res.status !== "fulfilled") {
          throw (
            res.reason ||
            new Error(
              "Gagal memuat data peralatan untuk memeriksa lab pengguna.",
            )
          );
        }
        const roomList =
          roomsRes.status === "fulfilled" ? roomsRes.value?.data || [] : [];
        const roomsById = new Map(
          roomList.map((room) => [String(room.id), room]),
        );

        if (res.status === "fulfilled") {
          const found = (res.value.data || []).find(
            (p) => String(getEquipmentId(p)) === String(equipmentId),
          );
          const canViewEquipment =
            found &&
            (!isLabScopedUser ||
              isEquipmentInUserLab(found, roomsById, currentUserLabId));
          if (canViewEquipment) {
            setEquipmentInfo(found);
            const detail = found.detail || {};
            const autoActivity = found.kode_aktivitas || "A1";
            const reqs = ACTIVITY_REQUIREMENTS[autoActivity] || {};

            setForm((prev) => {
              const nextResults = { ...prev.hasil_verifikasi };
              CHECKS.forEach((key) => {
                if (
                  reqs[key] === "-" ||
                  (key === "metrologi" && !isMetrologyApplicable(found))
                ) {
                  nextResults[key] = "TB";
                }
              });

              return {
                ...prev,
                id_peralatan: String(equipmentId),
                kode_aktivitas: autoActivity,
                nomor_sertifikat: detail.no_sertifikat || prev.nomor_sertifikat,
                berlaku_sampai: detail.tgl_jatuh_tempo
                  ? detail.tgl_jatuh_tempo.slice(0, 10)
                  : prev.berlaku_sampai,
                firmware_versi_aktual:
                  found.peranti_lunak_versi || prev.firmware_versi_aktual,
                hasil_verifikasi: nextResults,
              };
            });
          }
        }
      } catch (err) {
        error(err.message || "Gagal mengambil data peralatan.");
      } finally {
        setLoadingEquipment(false);
      }
    }

    fetchEquipment();
  }, [equipmentId]);

  // Submit verifikasi — langsung diajukan ke Manager (tanpa draft)
  async function submitVerifikasi(event) {
    event.preventDefault();

    if (!picSignature) {
      error(
        "Tanda tangan Pengelola wajib tersedia sebelum verifikasi diajukan.",
      );
      return;
    }

    const requirements =
      ACTIVITY_REQUIREMENTS[form.kode_aktivitas] ||
      ACTIVITY_REQUIREMENTS[equipmentInfo?.kode_aktivitas] ||
      ACTIVITY_REQUIREMENTS.A1;
    if (!requirements) {
      error("Kode aktivitas peralatan tidak valid.");
      return;
    }
    const applicableRequirements = isMetrologyApplicable(equipmentInfo)
      ? requirements
      : { ...requirements, metrologi: "-" };

    const verificationResults = Object.fromEntries(
      CHECKS.map((key) => [
        key,
        applicableRequirements[key] === "K" &&
        key !== "firmware" &&
        !form.hasil_verifikasi[key]?.trim()
          ? "TB"
          : form.hasil_verifikasi[key],
      ]),
    );
    const applicableKeys = CHECKS.filter(
      (key) => applicableRequirements[key] !== "-",
    );
    const requiredKeys = CHECKS.filter(
      (key) => applicableRequirements[key] === "W" || key === "firmware",
    );
    const missingKeys = requiredKeys.filter(
      (key) => !verificationResults[key],
    );
    if (missingKeys.length > 0) {
      error(
        `Aspek wajib belum dinilai: ${missingKeys.map((key) => CHECK_LABELS[key]).join(", ")}.`,
      );
      return;
    }
    if (
      verificationResults.firmware === "S" &&
      !form.firmware_versi_aktual.trim()
    ) {
      error("Versi firmware yang terpasang wajib diisi jika firmware tersedia.");
      return;
    }
    const invalidKeys = applicableKeys.filter((key) => {
      const allowedResults =
        key === "firmware" ? ["S", "TS"] : ["S", "TS", "TB"];
      return (
        verificationResults[key] &&
        !allowedResults.includes(verificationResults[key])
      );
    });
    if (invalidKeys.length > 0) {
      error(
        "Hasil firmware hanya boleh Ada atau Tidak Ada; aspek lainnya hanya boleh Sesuai, Tidak Sesuai, atau Tidak Berlaku.",
      );
      return;
    }
    const tsKeys = applicableKeys.filter(
      (key) => verificationResults[key] === "TS",
    );
    if (tsKeys.some((key) => !form.ts_alasan[key]?.trim())) {
      error(
        `Alasan wajib diisi untuk hasil Tidak Sesuai/Tidak Ada: ${tsKeys
          .filter((key) => !form.ts_alasan[key]?.trim())
          .map((key) => CHECK_LABELS[key])
          .join(", ")}.`,
      );
      return;
    }

    if (
      applicableKeys.some((key) => verificationResults[key] === "TS") &&
      !form.tindak_lanjut
    ) {
      error(
        "Hasil TS (Tidak Sesuai/Tidak Ada) harus disertai pemilihan tindak lanjut alat.",
      );
      return;
    }

    setBusy(true);
    try {
      const catatanTerstruktur = JSON.stringify({
        format: "TLKM13/F/003-v05",
        catatan_pic: form.catatan,
        acuan_kriteria: form.acuan_kriteria,
        firmware: {
          versi_tercatat: equipmentInfo?.peranti_lunak_versi || "",
          versi_aktual:
            verificationResults.firmware === "S"
              ? form.firmware_versi_aktual.trim()
              : "",
        },
        sertifikat: {
          nomor: form.nomor_sertifikat,
          penyedia: form.penyedia_kalibrasi,
          berlaku_sampai: form.berlaku_sampai,
          penerapan_nilai_koreksi: form.nilai_koreksi,
        },

        alasan_tb: form.tb_alasan,
        alasan_ts: form.ts_alasan,
      });

      // 1. Buat verifikasi
      const res = await verifikasiApi.create({
        id_peralatan: Number(form.id_peralatan),
        tanggal_verifikasi: form.tanggal_verifikasi,
        tindak_lanjut: form.tindak_lanjut,
        catatan: catatanTerstruktur,
        hasil_verifikasi: {
          ...Object.fromEntries(
            CHECKS.map((key) => [
              key,
              applicableRequirements[key] === "-"
                ? "TB"
                : verificationResults[key],
            ]),
          ),
          catatan: JSON.stringify({ alasan_tb: form.tb_alasan }),
        },
      });

      // 2. Tanda tangan PIC menjadi bukti pengajuan kepada Manager
      const newId = res?.data?.id_verifikasi ?? res?.data?.id ?? res?.id;
      if (newId) {
        await verifikasiApi.signPic(newId, picSignature);
      }

      success(
        "Verifikasi berhasil diajukan kepada Manager Lab untuk ditinjau.",
      );

      if (equipmentId) {
        navigate(returnPath);
      } else {
        setForm(emptyForm());
        setPicSignature(getSavedSignature(currentUser));
        await loadList();
      }
    } catch (err) {
      error(err.message || "Gagal mengajukan verifikasi.");
    } finally {
      setBusy(false);
    }
  }

  // Manager Modal Actions
  function openApprovalModal(item) {
    setApprovalModalItem(item);
    setApprovalMode("approve");
    setManagerSignature(getSavedSignature(currentUser));
    setRejectReason("");
    setRejectCatatan("");
    setAffirmApproved(false);
  }

  function closeApprovalModal() {
    setApprovalModalItem(null);
    setManagerSignature(getSavedSignature(currentUser));
    setRejectReason("");
    setRejectCatatan("");
    setAffirmApproved(false);
  }

  async function handleApproveFromModal() {
    const target = selected || approvalModalItem;
    if (!target) return;
    if (!managerSignature?.trim()) {
      error(
        "Tanda tangan digital manager wajib tersedia sebelum verifikasi disetujui.",
      );
      return;
    }
    if (!affirmApproved) {
      error("Harap centang pernyataan konfirmasi kelayakan peralatan.");
      return;
    }

    setBusy(true);
    try {
      const verifikasiId = target.id_verifikasi ?? target.id;
      await verifikasiApi.approve(verifikasiId, managerSignature.trim());
      success(
        "Verifikasi berhasil disetujui. Status peralatan kini Aktif dan masuk ke inventaris.",
      );
      closeApprovalModal();
      setSelected(null);
      await loadList();
    } catch (err) {
      error(err.message || "Gagal menyetujui verifikasi.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRejectFromModal() {
    const target = selected || approvalModalItem;
    if (!target) return;
    if (!managerSignature?.trim()) {
      error("Tanda tangan digital manager wajib tersedia sebelum verifikasi ditolak.");
      return;
    }
    if (!rejectReason.trim()) {
      error("Alasan penolakan / evaluasi ketidaksesuaian wajib diisi.");
      return;
    }
    if (!rejectCatatan.trim()) {
      error("Keterangan alasan penolakan wajib diisi.");
      return;
    }

    setBusy(true);
    try {
      const verifikasiId = target.id_verifikasi ?? target.id;
      await verifikasiApi.reject(verifikasiId, {
        alasan: rejectReason.trim(),
        catatan: rejectCatatan.trim(),
        signature: managerSignature.trim(),
      });
      success(
        "Verifikasi ditolak dan dicatat pada log peninjauan (TLKM13/IK/012).",
      );
      closeApprovalModal();
      setSelected(null);
      await loadList();
    } catch (err) {
      error(err.message || "Gagal menolak verifikasi.");
    } finally {
      setBusy(false);
    }
  }

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
  const pendingPageItems = pendingItems.slice(
    pendingPagination.startIndex,
    pendingPagination.endIndex,
  );
  const reviewPageItems = filteredReviewItems.slice(
    reviewPagination.startIndex,
    reviewPagination.endIndex,
  );
  const historyPageItems = historyItems.slice(
    historyPagination.startIndex,
    historyPagination.endIndex,
  );
  const officialNotes = (item) => {
    try {
      const data = JSON.parse(item.catatan || "{}");
      return data.format === "TLKM13/F/003-v05" ? data : null;
    } catch {
      return null;
    }
  };
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
              navigate(
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
            onClick={() => {
              setManagerSignature(getSavedSignature(currentUser));
              setApprovalMode("approve");
              setRejectReason("");
              setRejectCatatan("");
              setAffirmApproved(false);
              setSelected(item);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            <ClipboardCheck size={13} /> Tinjau Pengajuan
          </button>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={() => setSelected(item)}>
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
            onClick={() => setSelected(item)}
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
  // VIEW 1: Form Verifikasi Langsung (Jika ada equipmentId)
  // Muncul setelah input data peralatan atau saat klik tombol Verifikasi
  // =========================================================================
  if (equipmentId) {
    if (!canSubmit) {
      return (
        <div className="page-container fade-in-up">
          <div className="card card-padded">
            <h1 className="page-title">Akses Pengajuan Verifikasi</h1>
            <p className="page-subtitle">
              Staff pengelola dan Manager dapat mengisi dan mengajukan
              verifikasi. Staff lainnya tetap dapat melihat verifikasi beserta
              detailnya.
            </p>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => navigate(returnPath)}
            >
              <ArrowLeft size={16} /> Kembali ke Verifikasi
            </button>
          </div>
        </div>
      );
    }

    const isRejected = equipmentInfo?.status_verifikasi === "Ditolak";
    const activityCode = equipmentInfo?.kode_aktivitas || "A1";
    const equipmentInfoMatchesRoute =
      String(getEquipmentId(equipmentInfo)) === String(equipmentId);
    if (isLabScopedUser && loadingEquipment) {
      return (
        <div className="page-container fade-in-up">
          <div className="card card-padded">
            <div className="skeleton" style={{ height: 48 }} />
          </div>
        </div>
      );
    }

    if (isLabScopedUser && (!equipmentInfo || !equipmentInfoMatchesRoute)) {
      return (
        <div className="page-container fade-in-up">
          <div className="card card-padded">
            <h1 className="page-title">Peralatan tidak tersedia</h1>
            <p className="page-subtitle">
              Data verifikasi hanya dapat dilihat oleh pengguna dari lab yang
              memiliki ruangan peralatan tersebut.
            </p>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => navigate(returnPath)}
            >
              <ArrowLeft size={16} /> Kembali ke Verifikasi
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="page-container fade-in-up">
        {/* Header navigasi */}
        <div
          className="page-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--sp-4)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-3)",
            }}
          >
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => navigate(returnPath)}
              title={
                returnPath === "/verifikasi"
                  ? "Kembali ke Verifikasi"
                  : "Kembali ke Peralatan"
              }
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="page-title">
                {role === "manager"
              ? "Tinjau Verifikasi Alat Ukur"
              : isRejected
                ? "Verifikasi Ulang Peralatan"
                : "Verifikasi Alat Ukur"}
              </h1>
              {/* <p className="page-subtitle">
                Form TLKM13/F/003 untuk mencatat pemeriksaan peralatan. Isi
                hasil sesuai acuan IK/TP/Manual Book, lalu kirim untuk tahap
                berikutnya.
              </p> */}
            </div>
          </div>

        </div>

        {/* Informasi Peralatan */}
        {loadingEquipment ? (
          <div
            className="card"
            style={{ padding: "var(--sp-4)", marginBottom: "var(--sp-4)" }}
          >
            <div className="skeleton" style={{ height: 48 }} />
          </div>
        ) : equipmentInfo ? (
          <div
            className="card"
            style={{
              padding: "var(--sp-4)",
              marginBottom: "var(--sp-5)",
              borderLeft: isRejected
                ? "4px solid var(--clr-danger-500, #ef4444)"
                : "4px solid var(--clr-primary-500, #3b82f6)",
              background: "var(--clr-dark-50, #f8fafc)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "var(--sp-3)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-3)",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "var(--radius-md, 8px)",
                    background: "var(--clr-primary-100, #e0e7ff)",
                    color: "var(--clr-primary-600, #4f46e5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Package size={22} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: "var(--fw-bold)",
                      fontSize: "var(--text-base)",
                      color: "var(--clr-dark-900)",
                    }}
                  >
                    {equipmentInfo.nama_peralatan}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--clr-dark-500)",
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      No. Aset:{" "}
                      <strong>{equipmentInfo.nomor_aset || "-"}</strong>
                    </span>
                    {equipmentInfo.merek && (
                      <span>
                        Merek: {equipmentInfo.merek}{" "}
                        {equipmentInfo.tipe_model || ""}
                      </span>
                    )}
                    {equipmentInfo.laboratorium && (
                      <span>
                        Lab: {equipmentInfo.laboratorium.nama_lab || "-"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  className={`badge ${equipmentInfo.status_verifikasi === "Disetujui" ? "badge-aktif" : isRejected ? "badge-rusak" : "badge-gray"}`}
                >
                  Verifikasi:{" "}
                  {equipmentInfo.status_verifikasi || "Belum Diverifikasi"}
                </span>
              </div>
            </div>
            <div
              style={{
                marginTop: "var(--sp-2)",
                fontSize: "var(--text-xs)",
                color: "var(--clr-dark-600)",
              }}
            >
              <strong>Keterangan:</strong>{" "}
              {activityCode} — {getActivityLabel(activityCode)}
            </div>

          </div>
        ) : null}

        {/* Form Pengisian Verifikasi */}
        <form className="card card-padded verification-form" onSubmit={submitVerifikasi}>
          {/* A. Identitas Alat Ukur dan Kegiatan */}
          <div style={{ marginBottom: "var(--sp-6)" }}>
            <h3
              style={{
                fontSize: "var(--text-base)",
                fontWeight: "var(--fw-bold)",
                marginBottom: "var(--sp-3)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <FileCheck
                size={18}
                style={{ color: "var(--clr-primary-500)" }}
              />
              A. Identitas Alat Ukur dan Kegiatan
            </h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Nomor Aset</label>
                <input
                  className="form-input"
                  type="text"
                  value={
                    equipmentInfo?.nomor_aset
                      ? `${equipmentInfo.nomor_aset}`
                      : `ID: ${form.id_peralatan}`
                  }
                  readOnly
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nama Peralatan</label>
                <input
                  className="form-input"
                  type="text"
                  value={equipmentInfo?.nama_peralatan || "-"}
                  readOnly
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Tanggal Verifikasi <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  className="form-input"
                  type="date"
                  value={form.tanggal_verifikasi}
                  onChange={(e) =>
                    setForm({ ...form, tanggal_verifikasi: e.target.value })
                  }
                  required
                />
              </div>

              {role === "manager" && <div className="form-group">
                <label className="form-label">
                  Kode Aktivitas
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={
                    role === "manager"
                      ? form.kode_aktivitas
                      : getActivityLabel(form.kode_aktivitas)
                  }
                  readOnly
                  disabled
                />
                <small
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--clr-dark-500)",
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  Ditentukan otomatis oleh sistem berdasarkan status peralatan.
                </small>
              </div>}

              <div className="form-group">
                <label className="form-label">
                  Acuan Instruksi Kerja / Test Prosedur / Manual Book{" "}
                  <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  className="form-input"
                  placeholder="Isi nomor dokumen acuan (contoh: TLKM/IK/LAB/XXX)"
                  value={form.acuan_kriteria}
                  onChange={(e) =>
                    setForm({ ...form, acuan_kriteria: e.target.value })
                  }
                  required
                />
                <small
                  style={{
                    display: "block",
                    marginTop: 4,
                    color: "var(--clr-dark-500)",
                    fontSize: "var(--text-xs)",
                  }}
                >
                  Gunakan nomor Instruksi Kerja, Test Prosedur, atau Manual
                  Book sesuai format dokumen laboratorium.
                </small>
              </div>
            </div>
          </div>

          {/* B. Hasil Pemeriksaan Aspek Verifikasi */}
          <div style={{ marginBottom: "var(--sp-6)" }}>
            <div style={{ marginBottom: "var(--sp-3)" }}>
              <h3
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--fw-bold)",
                  margin: 0,
                }}
              >
                B. Hasil Pemeriksaan
              </h3>
              <p
                className="page-subtitle"
                style={{ fontSize: "var(--text-xs)", marginTop: 2 }}
              >
              </p>
            </div>

            {form.kode_aktivitas ? (
              <div className="form-grid-2">
                {CHECKS.filter(
                  (key) =>
                    ACTIVITY_REQUIREMENTS[form.kode_aktivitas][key] !== "-" &&
                    (key !== "metrologi" ||
                      isMetrologyApplicable(equipmentInfo)),
                ).map((key) => {
                  const requirement =
                    ACTIVITY_REQUIREMENTS[form.kode_aktivitas][key];
                  const isTB = form.hasil_verifikasi[key] === "TB";
                  const isTS = form.hasil_verifikasi[key] === "TS";
                  return (
                    <div
                      key={key}
                      className="form-group"
                      style={{
                        padding: "var(--sp-3)",
                        borderRadius: "var(--radius-md, 6px)",
                        background: isTS
                          ? "#fff1f2"
                          : isTB
                            ? "#f8fafc"
                            : "#f0fdf4",
                        border: `1px solid ${isTS ? "#fecdd3" : isTB ? "#e2e8f0" : "#bbf7d0"}`,
                      }}
                    >
                      <label
                        className="form-label"
                        style={{
                          fontWeight: "var(--fw-semibold)",
                          fontSize: "var(--text-xs)",
                        }}
                      >
                        {CHECK_LABELS[key]}
                        <span
                          style={{
                            marginLeft: 6,
                            color:
                              requirement === "W" || key === "firmware"
                                ? "#b91c1c"
                                : "#64748b",
                            fontWeight: "var(--fw-medium)",
                          }}
                        >
                          {key === "firmware"
                            ? "(Wajib: Ada/Tidak Ada)"
                            : requirement === "W"
                              ? "(Wajib)"
                              : "(Opsional)"}
                        </span>
                      </label>
                      <select
                        className="form-select"
                        value={form.hasil_verifikasi[key]}
                        onChange={(e) => {
                          const value = e.target.value;
                          setForm({
                            ...form,
                            hasil_verifikasi: {
                              ...form.hasil_verifikasi,
                              [key]: value,
                            },
                            ...(key === "firmware"
                              ? {
                                  firmware_versi_aktual:
                                    value === "S"
                                      ? equipmentInfo?.peranti_lunak_versi || ""
                                      : "",
                                }
                              : {}),
                          });
                        }}
                      >
                        <option value="">Pilih hasil verifikasi</option>
                        {key === "firmware" ? (
                          <>
                            <option value="S">Ada</option>
                            <option value="TS">Tidak Ada</option>
                          </>
                        ) : (
                          <>
                            <option value="S">Sesuai</option>
                            <option value="TS">Tidak Sesuai</option>
                          </>
                        )}
                        {key !== "firmware" && (
                          <option value="TB">Tidak Berlaku</option>
                        )}
                      </select>

                      {key === "firmware" && (
                        <div style={{ marginTop: 6 }}>
                          <small
                            style={{
                              display: "block",
                              marginBottom: 6,
                              color: "var(--clr-dark-500)",
                              fontSize: "var(--text-xs)",
                            }}
                          >
                            Versi tercatat pada data peralatan:{" "}
                            {equipmentInfo?.peranti_lunak_versi || "Belum dicatat"}
                          </small>
                          {form.hasil_verifikasi.firmware === "S" && (
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: "var(--text-xs)" }}>
                                Nama / versi firmware yang terpasang{" "}
                                <span style={{ color: "red" }}>*</span>
                              </label>
                              <input
                                className="form-input"
                                type="text"
                                value={form.firmware_versi_aktual}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    firmware_versi_aktual: e.target.value,
                                  })
                                }
                                placeholder="Masukkan nama atau versi firmware"
                                required
                              />
                              {form.firmware_versi_aktual.trim() &&
                                form.firmware_versi_aktual.trim() !==
                                  (equipmentInfo?.peranti_lunak_versi || "").trim() && (
                                  <small
                                    style={{
                                      display: "block",
                                      marginTop: 6,
                                      color: "#b45309",
                                      fontSize: "var(--text-xs)",
                                    }}
                                  >
                                    Versi berbeda dari data peralatan. Catat versi ini untuk pembaruan data peralatan.
                                  </small>
                                )}
                            </div>
                          )}
                        </div>
                      )}

                      {isTS && (
                        <div style={{ marginTop: 6 }}>
                          <label
                            className="form-label"
                            style={{ fontSize: "var(--text-xs)" }}
                          >
                            Keterangan / alasan{" "}
                            {key === "firmware" ? "Tidak Ada" : "Tidak Sesuai"}{" "}
                            <span style={{ color: "red" }}>*</span>
                          </label>
                          <textarea
                            className="form-textarea"
                            rows={2}
                            placeholder={`Jelaskan alasan hasil ${
                              key === "firmware" ? "Tidak Ada" : "Tidak Sesuai"
                            }...`}
                            value={form.ts_alasan[key] || ""}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                ts_alasan: {
                                  ...form.ts_alasan,
                                  [key]: event.target.value,
                                },
                              })
                            }
                            required
                          />
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            ) : (
              <p
                className="page-subtitle"
                style={{ fontSize: "var(--text-xs)" }}
              >
                Pilih kode aktivitas untuk menampilkan aspek pemeriksaan yang
                berlaku.
              </p>
            )}
          </div>

          {/* C. Sertifikat Kalibrasi dan Nilai Koreksi */}
          <div style={{ marginBottom: "var(--sp-6)" }}>
            <h3
              style={{
                fontSize: "var(--text-base)",
                fontWeight: "var(--fw-bold)",
                marginBottom: "var(--sp-3)",
              }}
            >
              C. Sertifikat Kalibrasi dan Nilai Koreksi
            </h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Nomor Sertifikat</label>
                <input
                  className="form-input"
                  placeholder="Nomor sertifikat kalibrasi (jika ada)"
                  value={form.nomor_sertifikat}
                  onChange={(e) =>
                    setForm({ ...form, nomor_sertifikat: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Penyedia Kalibrasi</label>
                <input
                  className="form-input"
                  placeholder="Laboratorium / Lembaga pengkalibrasi"
                  value={form.penyedia_kalibrasi}
                  onChange={(e) =>
                    setForm({ ...form, penyedia_kalibrasi: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Berlaku Sampai (Jatuh Tempo)
                </label>
                <input
                  className="form-input"
                  type="date"
                  value={form.berlaku_sampai}
                  onChange={(e) =>
                    setForm({ ...form, berlaku_sampai: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Penerapan Nilai Koreksi</label>
                <select
                  className="form-select"
                  value={form.nilai_koreksi}
                  onChange={(e) =>
                    setForm({ ...form, nilai_koreksi: e.target.value })
                  }
                >
                  <option value="Y Diterapkan">Y - Diterapkan</option>
                  <option value="T Tidak diterapkan">T - Tidak Diterapkan</option>
                </select>
              </div>
            </div>
          </div>

          {/* D. Keputusan Kelayakan dan Tindak Lanjut */}
          <div style={{ marginBottom: "var(--sp-6)" }}>
            <h3
              style={{
                fontSize: "var(--text-base)",
                fontWeight: "var(--fw-bold)",
                marginBottom: "var(--sp-2)",
              }}
            >
              D. Keputusan dan Tindak Lanjut
            </h3>
            <div className="form-group">
              <label className="form-label">
                Rencana Tindak Lanjut <span style={{ color: "red" }}>*</span>
              </label>
              <select
                className="form-select"
                value={form.tindak_lanjut}
                onChange={(e) =>
                  setForm({ ...form, tindak_lanjut: e.target.value })
                }
                required
              >
                <option value="">-- Pilih Tindak Lanjut --</option>
                {FOLLOW_UP_OPTIONS.map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginTop: "var(--sp-3)" }}>
              <label className="form-label">
                Catatan Pemeriksaan Pengelola
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Catatan hasil verifikasi fisik, kelayakan, dan kesiapan alat..."
                value={form.catatan}
                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginTop: "var(--sp-3)" }}>
              <div style={{ maxWidth: 520 }}>
                <DigitalSignaturePad
                  value={picSignature}
                  onChange={(signature) =>
                    handleSignatureChange(setPicSignature, signature)
                  }
                  label="Tanda Tangan Pengelola"
                  savedSignature={savedSignature}
                  onRestore={() => setPicSignature(savedSignature)}
                  onForgetSaved={forgetSavedSignature}
                />
              </div>
            </div>
          </div>

          {/* Tombol Aksi — Tidak ada draft, langsung ajukan verifikasi */}
          <div
            style={{
              display: "flex",
              gap: "var(--sp-3)",
              justifyContent: "flex-end",
              borderTop: "1px solid var(--clr-dark-200, #e2e8f0)",
              paddingTop: "var(--sp-4)",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(returnPath)}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
              id="btn-ajukan-verifikasi"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Send size={16} />
              {busy
                ? "Mengirim..."
                : role === "manager"
                  ? "Kirim Verifikasi"
                  : "Ajukan Verifikasi"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: Daftar Verifikasi (Manager Review & Pengawasan)
  // Dibuka lewat menu sidebar /verifikasi tanpa ID spesifik
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

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* {canSubmit && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate("/peralatan/tambah")}
              title="Tambah peralatan baru"
            >
              + Tambah Peralatan
            </button>
          )} */}
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
          <div>
            <TableFilters
              fields={[
                {
                  type: "search",
                  id: "pending-search",
                  label: "Cari peralatan",
                  placeholder: "Nama, nomor aset, atau merek",
                  value: pendingSearch,
                  onChange: (event) => setPendingSearch(event.target.value),
                },
                {
                  type: "select",
                  id: "pending-category",
                  label: "Kategori",
                  placeholder: "Semua kategori",
                  value: pendingCategoryFilter,
                  onChange: (event) => setPendingCategoryFilter(event.target.value),
                  options: pendingCategories.map((category) => ({
                    value: category,
                    label: category,
                  })),
                },
                {
                  type: "select",
                  id: "pending-activity",
                  label: "Aktivitas",
                  placeholder: "Semua aktivitas",
                  value: pendingActivityFilter,
                  onChange: (event) => setPendingActivityFilter(event.target.value),
                  options: ACTIVITY_OPTIONS.map(([code]) => ({
                    value: code,
                    label: getActivityLabel(code),
                  })),
                },
              ]}
            />
            <div className="table-card">
              <DataTable
                columns={pendingColumns}
                rows={pendingPageItems}
                rowKey={(item) => getEquipmentId(item)}
                wrapperClassName="table-borderless"
                rowProps={(item) => {
                  const equipmentId = getEquipmentId(item);
                  const detailPath = `/peralatan/detail/${equipmentId}?returnTo=${encodeURIComponent("/verifikasi")}`;
                  return {
                    className: "cursor-pointer",
                    onClick: () => navigate(detailPath),
                    onKeyDown: (event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(detailPath);
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
              <Pagination
                totalItems={pendingItems.length}
                currentPage={pendingPagination.currentPage}
                onPageChange={pendingPagination.setCurrentPage}
                startIndex={pendingPagination.startIndex}
                endIndex={pendingPagination.endIndex}
                totalPages={pendingPagination.totalPages}
              />
            </div>
          </div>
        )}

        {/* TAB 2: PERSETUJUAN VERIFIKASI (Menunggu Persetujuan Manager) */}
        {activeTab === "review" && (
          <div>
            <TableFilters
              fields={[
                {
                  type: "search",
                  id: "review-search",
                  label: "Cari peralatan",
                  placeholder: "Nama peralatan atau nomor aset",
                  value: reviewSearch,
                  onChange: (event) => setReviewSearch(event.target.value),
                },
                {
                  type: "select",
                  id: "review-activity",
                  label: "Aktivitas",
                  placeholder: "Semua aktivitas",
                  value: reviewActivityFilter,
                  onChange: (event) => setReviewActivityFilter(event.target.value),
                  options: ACTIVITY_OPTIONS.map(([code]) => ({
                    value: code,
                    label: getActivityLabel(code),
                  })),
                },
              ]}
            />
            <div className="table-card">
              <DataTable
                columns={reviewColumns}
                rows={reviewPageItems}
                rowKey={(item) => id(item)}
                wrapperClassName="table-borderless"
                emptyMessage={
                  busy
                    ? "Memuat data verifikasi..."
                    : "Belum ada pengajuan verifikasi yang menunggu persetujuan Manager."
                }
              />
              <Pagination
                totalItems={filteredReviewItems.length}
                currentPage={reviewPagination.currentPage}
                onPageChange={reviewPagination.setCurrentPage}
                startIndex={reviewPagination.startIndex}
                endIndex={reviewPagination.endIndex}
                totalPages={reviewPagination.totalPages}
              />
            </div>
          </div>
        )}

        {/* TAB 3: RIWAYAT VERIFIKASI (Disetujui / Ditolak) */}
        {activeTab === "history" && (
          <div>
            <TableFilters
              fields={[
                {
                  type: "search",
                  id: "history-search",
                  label: "Cari peralatan",
                  placeholder: "Nama peralatan atau nomor aset",
                  value: historySearch,
                  onChange: (event) => setHistorySearch(event.target.value),
                },
                {
                  type: "select",
                  id: "history-status",
                  label: "Status akhir",
                  placeholder: "Semua status",
                  value: historyStatusFilter,
                  onChange: (event) => setHistoryStatusFilter(event.target.value),
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
                  value: historyActivityFilter,
                  onChange: (event) => setHistoryActivityFilter(event.target.value),
                  options: ACTIVITY_OPTIONS.map(([code]) => ({
                    value: code,
                    label: getActivityLabel(code),
                  })),
                },
              ]}
            />
            <div className="table-card">
              <DataTable
                columns={historyColumns}
                rows={historyPageItems}
                rowKey={(item) => id(item)}
                wrapperClassName="table-borderless"
                emptyMessage={
                  busy
                    ? "Memuat data verifikasi..."
                    : "Belum ada riwayat verifikasi yang selesai."
                }
              />
              <Pagination
                totalItems={historyItems.length}
                currentPage={historyPagination.currentPage}
                onPageChange={historyPagination.setCurrentPage}
                startIndex={historyPagination.startIndex}
                endIndex={historyPagination.endIndex}
                totalPages={historyPagination.totalPages}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modal Rincian Verifikasi */}
      {selected &&
        createPortal(
          <div
            className="modal-overlay verification-review-overlay"
            role="presentation"
            onClick={() => setSelected(null)}
          >
            <div
              className="modal modal-xl verification-review-modal"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">
                    {role === "manager"
                      ? "Pengajuan Verifikasi"
                      : "Rincian Verifikasi"}
                  </h2>
                  <p
                    className="page-subtitle"
                    style={{ margin: "4px 0 0", fontSize: "var(--text-xs)" }}
                  >
                    {selected.peralatan?.nomor_aset
                      ? `${selected.peralatan.nomor_aset} — `
                      : ""}
                    {selected.peralatan?.nama_peralatan ||
                      `Peralatan ID ${selected.id_peralatan}`}
                  </p>
                </div>
              </div>

              <div className="modal-body">
                <div
                  className="form-grid-2 verification-review-summary"
                  style={{ marginBottom: "var(--sp-3)" }}
                >
                  <div>
                    <strong>
                      {role === "manager" ? "Kode Aktivitas:" : "Keterangan:"}
                    </strong>
                    <p style={{ margin: "2px 0 0" }}>
                      {role === "manager"
                        ? selected.kode_aktivitas || "-"
                        : getActivityLabel(selected.kode_aktivitas)}
                    </p>
                  </div>
                  <div>
                    <strong>Keterangan:</strong>
                    <p style={{ margin: "2px 0 0" }}>
                      <span
                        className={`badge ${
                          selected.status === "Disetujui"
                            ? "badge-aktif"
                            : selected.status === "Ditolak"
                              ? "badge-rusak"
                              : "badge-kalibrasi"
                        }`}
                      >
                        {getEquipmentKeterangan({
                          ...selected.peralatan,
                          status_verifikasi: selected.status,
                        })}
                      </span>
                    </p>
                  </div>
                  <div>
                    <strong>Tindak Lanjut:</strong>
                    <p style={{ margin: "2px 0 0" }}>
                      {selected.tindak_lanjut || "-"}
                    </p>
                  </div>
                  <div>
                    <strong>Tanggal:</strong>
                    <p style={{ margin: "2px 0 0" }}>
                      {selected.tanggal_verifikasi
                        ? new Date(
                            selected.tanggal_verifikasi,
                          ).toLocaleDateString("id-ID")
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="verification-review-signatures">
                  <SignatureDisplayCard
                    title="Tanda Tangan Pengelola Penguji"
                    roleLabel="Staff Pengelola Penguji"
                    signature={selected.pic_signature}
                    signerName={
                      selected.pic_user?.nama_lengkap ||
                      selected.pic?.nama_lengkap ||
                      selected.pic?.nama ||
                      "-"
                    }
                    signerNip={
                      selected.pic_user?.nip
                        ? `NIP: ${selected.pic_user.nip}`
                        : selected.pic_user?.username
                          ? `@${selected.pic_user.username}`
                          : null
                    }
                    signedAt={
                      selected.pic_signed_at || selected.tanggal_verifikasi
                    }
                  />
                  <SignatureDisplayCard
                    title="Persetujuan Manager"
                    roleLabel="Manager Laboratorium"
                    signature={selected.manager_signature}
                    signerName={
                      selected.verified_by_user?.nama_lengkap ||
                      selected.manager?.nama_lengkap ||
                      (selected.status === "Disetujui" ? "Manager Lab" : "-")
                    }
                    signerNip={
                      selected.verified_by_user?.nip
                        ? `NIP: ${selected.verified_by_user.nip}`
                        : selected.verified_by_user?.username
                          ? `@${selected.verified_by_user.username}`
                          : null
                    }
                    signedAt={
                      selected.manager_signed_at || selected.verified_at
                    }
                  />
                </div>

                <h4
                  style={{
                    margin: "var(--sp-4) 0 var(--sp-2)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  Hasil Aspek Pemeriksaan
                </h4>
                <DataTable
                  columns={[
                    {
                      key: "check",
                      header: "Hasil Pemeriksaan",
                      render: (key) => CHECK_LABELS[key],
                    },
                    {
                      key: "result",
                      header: "Penilaian",
                      render: (key) => {
                        const result =
                          selected.hasil_verifikasi?.[0]?.[key] || "-";
                        const label =
                          result === "S"
                            ? key === "firmware"
                              ? "Ada"
                              : "S (Sesuai)"
                            : result === "TS"
                              ? key === "firmware"
                                ? "Tidak Ada"
                                : "TS (Tidak Sesuai)"
                              : key === "firmware" && result === "TB"
                                ? "Belum dinilai"
                                : result;
                        return (
                          <span
                            className={`badge ${
                              result === "S"
                                ? "badge-aktif"
                                : result === "TS"
                                  ? "badge-rusak"
                                  : "badge-gray"
                            }`}
                          >
                            {label}
                          </span>
                        );
                      },
                    },
                    {
                      key: "reason",
                      header: "Alasan / Keterangan",
                      render: (key) => {
                        const result =
                          selected.hasil_verifikasi?.[0]?.[key] || "-";
                        const notes = officialNotes(selected);
                        return result === "TS"
                          ? notes?.alasan_ts?.[key] ||
                              "Belum ada alasan yang dicatat"
                          : result === "TB"
                            ? key === "firmware"
                              ? "-"
                              : notes?.alasan_tb?.[key] || "-"
                            : "-";
                      },
                    },
                  ]}
                  rows={CHECKS.filter(
                    (key) =>
                      ACTIVITY_REQUIREMENTS[selected.kode_aktivitas]?.[key] !==
                      "-",
                  )}
                  rowKey={(key) => key}
                />

                {officialNotes(selected) && (
                  <div style={{ marginTop: "var(--sp-4)" }}>
                    <h4
                      style={{
                        margin: "0 0 var(--sp-2)",
                        fontSize: "var(--text-sm)",
                      }}
                    >
                      Data Pendukung
                    </h4>
                    <div
                      className="form-grid-2 verification-review-notes"
                      style={{ fontSize: "var(--text-xs)" }}
                    >
                      <div>
                        <strong>Acuan Instruksi Kerja / Test Prosedur / Manual Book:</strong>
                        <p style={{ margin: "2px 0" }}>
                          {officialNotes(selected).acuan_kriteria || "-"}
                        </p>
                      </div>
                      <div>
                        <strong>Sertifikat:</strong>
                        <p style={{ margin: "2px 0" }}>
                          {officialNotes(selected).sertifikat?.nomor || "-"}
                          {officialNotes(selected).sertifikat?.berlaku_sampai
                            ? ` (s/d ${officialNotes(selected).sertifikat.berlaku_sampai})`
                            : ""}
                        </p>
                      </div>
                      <div>
                        <strong>Firmware terverifikasi:</strong>
                        <p style={{ margin: "2px 0" }}>
                          {officialNotes(selected).firmware?.versi_aktual || "-"}
                        </p>
                      </div>
                      <div>
                        <strong>Nilai Koreksi:</strong>
                        <p style={{ margin: "2px 0" }}>
                          {officialNotes(selected).sertifikat
                            ?.penerapan_nilai_koreksi || "-"}
                        </p>
                      </div>
                    </div>
                    {officialNotes(selected).catatan_pic && (
                      <div style={{ marginTop: "var(--sp-2)" }}>
                        <strong>Catatan Pengelola:</strong>
                        <p
                          style={{
                            margin: "2px 0",
                            fontSize: "var(--text-xs)",
                            background: "var(--clr-dark-50)",
                            padding: 8,
                            borderRadius: 4,
                          }}
                        >
                          {officialNotes(selected).catatan_pic}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Form Persetujuan Manager — inline di dalam modal tinjau */}
                {canApprove && selected.status === "Diajukan" && (
                  <div
                    style={{
                      marginTop: "var(--sp-5)",
                      borderTop: "2px solid var(--clr-dark-200)",
                      paddingTop: "var(--sp-4)",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--fw-bold)",
                        marginBottom: "var(--sp-3)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <FileCheck
                        size={16}
                        style={{ color: "var(--clr-primary-500)" }}
                      />
                      Keputusan Manager
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: "var(--sp-4)",
                      }}
                    >
                      <button
                        type="button"
                        className={`btn btn-sm ${approvalMode === "approve" ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setApprovalMode("approve")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <CheckCircle2 size={14} /> Setujui
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${approvalMode === "reject" ? "btn-ghost" : "btn-ghost"}`}
                        onClick={() => setApprovalMode("reject")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          color:
                            approvalMode === "reject"
                              ? "var(--clr-error-500, #ef4444)"
                              : undefined,
                        }}
                      >
                        <XCircle size={14} /> Tolak
                      </button>
                    </div>

                    {approvalMode === "approve" ? (
                      <div>
                        <DigitalSignaturePad
                          value={managerSignature}
                          onChange={(signature) =>
                            handleSignatureChange(
                              setManagerSignature,
                              signature,
                            )
                          }
                          label="Tanda Tangan Digital Manager"
                          savedSignature={savedSignature}
                          onRestore={() => setManagerSignature(savedSignature)}
                          onForgetSaved={forgetSavedSignature}
                        />
                        <div
                          style={{
                            marginTop: "var(--sp-3)",
                            padding: "var(--sp-3)",
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            borderRadius: "var(--radius-md)",
                          }}
                        >
                          <label
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 8,
                              cursor: "pointer",
                              fontSize: "var(--text-xs)",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={affirmApproved}
                              onChange={(e) =>
                                setAffirmApproved(e.target.checked)
                              }
                              style={{ marginTop: 2, flexShrink: 0 }}
                            />
                            <span>
                              Saya menyatakan peralatan ini{" "}
                              <strong>
                                telah memenuhi seluruh kriteria kelayakan
                              </strong>{" "}
                              sesuai prosedur TLKM13/F/003 dan persetujuan ini
                              sah secara sistem.
                            </span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <DigitalSignaturePad
                          value={managerSignature}
                          onChange={(signature) =>
                            handleSignatureChange(
                              setManagerSignature,
                              signature,
                            )
                          }
                          label="Tanda Tangan Digital Manager untuk Penolakan"
                          savedSignature={savedSignature}
                          onRestore={() => setManagerSignature(savedSignature)}
                          onForgetSaved={forgetSavedSignature}
                        />
                        <div className="form-group">
                          <label className="form-label">
                            Alasan Penolakan{" "}
                            <span style={{ color: "red" }}>*</span>
                          </label>
                          <select
                            className="form-select"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          >
                            <option value="">Pilih alasan penolakan</option>
                            <option value="Hasil aspek tidak sesuai">
                              Hasil aspek tidak sesuai
                            </option>
                            <option value="Data pendukung belum sesuai">
                              Data pendukung belum sesuai
                            </option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">
                            Keterangan Alasan Penolakan{" "}
                            <span style={{ color: "red" }}>*</span>
                          </label>
                          <textarea
                            className="form-textarea"
                            rows={2}
                            placeholder="Jelaskan aspek atau data pendukung yang belum sesuai..."
                            value={rejectCatatan}
                            onChange={(e) => setRejectCatatan(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer verification-review-footer">
                {canApprove &&
                  selected.status === "Diajukan" &&
                  (approvalMode === "approve" ? (
                    <button
                      type="button"
                      className="btn btn-primary verification-review-confirm"
                      disabled={
                        busy || !managerSignature?.trim() || !affirmApproved
                      }
                      onClick={handleApproveFromModal}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <CheckCircle2 size={15} />
                      {busy ? "Menyetujui..." : "Konfirmasi Persetujuan"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={
                        busy ||
                        !managerSignature?.trim() ||
                        !rejectReason.trim() ||
                        !rejectCatatan.trim()
                      }
                      onClick={handleRejectFromModal}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        color: "var(--clr-error-500, #ef4444)",
                      }}
                    >
                      <XCircle size={15} />
                      {busy ? "Menolak..." : "Konfirmasi Penolakan"}
                    </button>
                  ))}
                {selected.status === "Disetujui" &&
                  (canApprove || staffIsPengelola) && (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => exportVerificationPdf(selected)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Printer size={15} /> Export PDF
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => exportVerificationWord(selected)}
                      >
                        Export Word
                      </button>
                    </>
                  )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelected(null)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
