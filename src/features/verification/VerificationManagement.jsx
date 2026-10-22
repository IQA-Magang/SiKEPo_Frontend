import React, { useState } from "react";
import {
  getCurrentUser,
  getSavedSignature,
  saveSignature,
  removeSavedSignature,
  verifikasiApi,
} from "../../shared/services/api.js";
import { useToast } from "../../app/providers/ToastContext.jsx";
import { getUserRole, isStaffPengelola } from "../../shared/utils/permissions.js";
import { getSafeReturnPath, useNavigate } from "../../app/router/Router.jsx";
import VerificationFormPage from "./components/VerificationFormPage.jsx";
import VerificationListPage from "./components/VerificationListPage.jsx";
import VerificationDetailsModal from "./components/VerificationDetailsModal.jsx";
import useVerificationManagement from "./hooks/useVerificationManagement.js";
import {
  ACTIVITY_REQUIREMENTS,
  CHECKS,
  CHECK_LABELS,
  emptyForm,
  isMetrologyApplicable,
} from "./verificationData.js";

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

  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(() => ({
    ...emptyForm(),
    id_peralatan: equipmentId || "",
  }));
  const [busy, setBusy] = useState(false);
  const [picSignature, setPicSignature] = useState(() =>
    getSavedSignature(currentUser),
  );
  const [managerSignature, setManagerSignature] = useState(() =>
    getSavedSignature(currentUser),
  );
  const [approvalMode, setApprovalMode] = useState("approve"); // 'approve' | 'reject'
  const [rejectReason, setRejectReason] = useState("");
  const [rejectCatatan, setRejectCatatan] = useState("");
  const [affirmApproved, setAffirmApproved] = useState(false);

  const {
    items,
    pendingEquipment,
    equipmentInfo,
    loadingEquipment,
    loadList,
    labs,
  } = useVerificationManagement({
    equipmentId,
    isLabScopedUser,
    currentUserLabId,
    setForm,
    setBusy,
    onError: error,
  });

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
        key === "firmware" || applicableRequirements[key] === "W"
          ? ["S", "TS"]
          : ["S", "TS", "TB"];
      return (
        verificationResults[key] &&
        !allowedResults.includes(verificationResults[key])
      );
    });
    if (invalidKeys.length > 0) {
      error(
        "Firmware hanya boleh Ada atau Tidak Ada; aspek wajib hanya boleh Sesuai atau Tidak Sesuai; aspek opsional boleh Tidak Berlaku.",
      );
      return;
    }
    const tsKeys = applicableKeys.filter(
      (key) => key !== "firmware" && verificationResults[key] === "TS",
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

    if (tsKeys.length > 0 && !form.tindak_lanjut) {
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

  function closeApprovalModal() {
    setManagerSignature(getSavedSignature(currentUser));
    setRejectReason("");
    setRejectCatatan("");
    setAffirmApproved(false);
  }

  async function handleApproveFromModal() {
    const target = selected;
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
    const target = selected;
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

  // VIEW 1: Form Verifikasi Langsung (Jika ada equipmentId)
  // Muncul setelah input data peralatan atau saat klik tombol Verifikasi
  // =========================================================================
  if (equipmentId) {
    return (
      <VerificationFormPage
        equipmentId={equipmentId}
        canSubmit={canSubmit}
        navigate={navigate}
        returnPath={returnPath}
        role={role}
        isLabScopedUser={isLabScopedUser}
        loadingEquipment={loadingEquipment}
        equipmentInfo={equipmentInfo}
        form={form}
        setForm={setForm}
        submitVerifikasi={submitVerifikasi}
        busy={busy}
        savedSignature={savedSignature}
        picSignature={picSignature}
        setPicSignature={setPicSignature}
        handleSignatureChange={handleSignatureChange}
        forgetSavedSignature={forgetSavedSignature}
      />
    );
  }
  // VIEW 2: Daftar Verifikasi (Manager Review & Pengawasan)
  // Dibuka lewat menu sidebar /verifikasi tanpa ID spesifik
  // =========================================================================
  return (
    <>
      <VerificationListPage
        pendingEquipment={pendingEquipment}
        items={items}
        labs={labs}
        role={role}
        staffIsPengelola={staffIsPengelola}
        canApprove={canApprove}
        busy={busy}
        onNavigate={navigate}
        onReview={(item) => {
          setManagerSignature(getSavedSignature(currentUser));
          setApprovalMode("approve");
          setRejectReason("");
          setRejectCatatan("");
          setAffirmApproved(false);
          setSelected(item);
        }}
        onSelect={setSelected}
      />
      <VerificationDetailsModal
        selected={selected}
        labs={labs}
        role={role}
        canApprove={canApprove}
        staffIsPengelola={staffIsPengelola}
        busy={busy}
        managerSignature={managerSignature}
        setManagerSignature={setManagerSignature}
        approvalMode={approvalMode}
        setApprovalMode={setApprovalMode}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        rejectCatatan={rejectCatatan}
        setRejectCatatan={setRejectCatatan}
        affirmApproved={affirmApproved}
        setAffirmApproved={setAffirmApproved}
        handleApproveFromModal={handleApproveFromModal}
        handleRejectFromModal={handleRejectFromModal}
        handleSignatureChange={handleSignatureChange}
        forgetSavedSignature={forgetSavedSignature}
        savedSignature={savedSignature}
        setSelected={setSelected}
      />
    </>
  );
}