import React, { useEffect, useRef, useState } from "react";
import {
  akunApi,
  getCurrentUser,
  getSavedSignature,
  removeSavedSignature,
  saveSignature,
  dokumenApi,
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
  getEquipmentFirmwareVersion,
  getEquipmentInspectionMethod,
  getApplicableRequirements,
  getAutomaticFollowUp,
  isFirmwareOptionalForEquipment,
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
  const currentUserId = currentUser?.user_id ?? currentUser?.id;
  const signatureSavePromiseRef = useRef(Promise.resolve());
  const signatureEditedRef = useRef(false);

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

  useEffect(() => {
    let active = true;
    signatureEditedRef.current = false;
    const cachedSignature = getSavedSignature(currentUser);
    setPicSignature(cachedSignature);
    setManagerSignature(cachedSignature);

    async function loadSavedSignature() {
      try {
        const response = await akunApi.getTtd();
        if (!active) return;
        if (signatureEditedRef.current) return;

        const savedSignature = response?.data?.ttd || "";
        if (savedSignature) {
          saveSignature(savedSignature, currentUser);
          setPicSignature(savedSignature);
          setManagerSignature(savedSignature);
          return;
        }

        if (cachedSignature) {
          await akunApi.saveTtd(cachedSignature);
          if (!active || signatureEditedRef.current) return;
          setPicSignature(cachedSignature);
          setManagerSignature(cachedSignature);
        }
      } catch (err) {
        if (active) {
          error(
            err.message ||
              "Gagal memuat tanda tangan tersimpan dari akun.",
          );
        }
      }
    }

    loadSavedSignature();
    return () => {
      active = false;
    };
  }, [currentUserId]);

  const {
    items,
    pendingEquipment,
    equipmentInfo,
    loadingEquipment,
    loadList,
  } = useVerificationManagement({
    equipmentId,
    isLabScopedUser,
    currentUserLabId,
    setForm,
    setBusy,
    onError: error,
  });

  useEffect(() => {
    const tindakLanjut = getAutomaticFollowUp(form, equipmentInfo);
    setForm((previous) =>
      previous.tindak_lanjut === tindakLanjut
        ? previous
        : { ...previous, tindak_lanjut: tindakLanjut },
    );
  }, [equipmentInfo, form.hasil_verifikasi, form.kode_aktivitas, setForm]);

  function handleSignatureChange(setSignature, signature) {
    signatureEditedRef.current = true;
    setSignature(signature);
    if (setSignature === setPicSignature) {
      setManagerSignature(signature);
    } else {
      setPicSignature(signature);
    }
    try {
      if (signature) {
        saveSignature(signature, currentUser);
      } else {
        removeSavedSignature(currentUser);
      }
    } catch (err) {
      error(err.message || "Gagal menyimpan tanda tangan di perangkat.");
    }

    signatureSavePromiseRef.current = signatureSavePromiseRef.current
      .catch(() => {})
      .then(async () => {
        if (signature) {
          await akunApi.saveTtd(signature);
        } else {
          await akunApi.deleteTtd();
        }
      });
    signatureSavePromiseRef.current.catch((err) => {
      error(err.message || "Gagal menyimpan tanda tangan ke akun.");
    });
  }

  async function ensureSignatureSaved(signature) {
    await signatureSavePromiseRef.current;
    await akunApi.saveTtd(signature);
    saveSignature(signature, currentUser);
  }

  // Submit verifikasi — langsung diajukan ke Manager (tanpa draft)
  async function submitVerifikasi(event) {
    event.preventDefault();

    const inspectionMethod = getEquipmentInspectionMethod(equipmentInfo);
    const inspectionDocument = form.dokumen_pemeriksaan;
    if (
      inspectionMethod === "kalibrasi" &&
      (!form.tanggal_kalibrasi ||
        !form.nomor_sertifikat.trim() ||
        !form.penyedia_kalibrasi.trim())
    ) {
      error(
        "Lengkapi tanggal kalibrasi, nomor sertifikat, dan penerbit sertifikat.",
      );
      return;
    }
    if (
      inspectionMethod === "verifikasi_fungsi" &&
      (!form.tanggal_verifikasi_fungsi ||
        !form.nomor_laporan.trim() ||
        !form.pelaksana_verifikasi.trim() ||
        !form.hasil_verifikasi_fungsi)
    ) {
      error(
        "Lengkapi tanggal, nomor laporan, pelaksana, dan hasil verifikasi fungsi.",
      );
      return;
    }
    if (!inspectionDocument && !form.dokumen_pemeriksaan_url) {
      error("Dokumen hasil pemeriksaan wajib diunggah.");
      return;
    }
    if (
      inspectionDocument &&
      (!/\.pdf$/i.test(inspectionDocument.name) ||
        (inspectionDocument.type &&
          inspectionDocument.type !== "application/pdf"))
    ) {
      error("Dokumen hasil pemeriksaan harus berupa PDF.");
      return;
    }
    if (
      inspectionDocument &&
      (inspectionDocument.size <= 0 ||
        inspectionDocument.size > 15 * 1024 * 1024)
    ) {
      error("Ukuran dokumen PDF harus lebih dari 0 dan maksimal 15 MB.");
      return;
    }

    if (!picSignature) {
      error(
        "Tanda tangan Pengelola wajib tersedia sebelum verifikasi diajukan.",
      );
      return;
    }

    try {
      await ensureSignatureSaved(picSignature.trim());
    } catch (err) {
      error(err.message || "Gagal menyimpan tanda tangan Pengelola.");
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
    const applicableRequirements = getApplicableRequirements(
      equipmentInfo,
      requirements,
    );

    const verificationResults = Object.fromEntries(
      CHECKS.map((key) => [
        key,
        applicableRequirements[key] === "K" &&
        !form.hasil_verifikasi[key]?.trim()
          ? "TB"
          : form.hasil_verifikasi[key],
      ]),
    );
    const applicableKeys = CHECKS.filter(
      (key) => applicableRequirements[key] !== "-",
    );
    const requiredKeys = CHECKS.filter(
      (key) => applicableRequirements[key] === "W",
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
      !form.firmware_versi_aktual.trim() &&
      !isFirmwareOptionalForEquipment(equipmentInfo)
    ) {
      error("Versi firmware yang terpasang wajib diisi jika firmware tersedia.");
      return;
    }
    const invalidKeys = applicableKeys.filter((key) => {
      const allowedResults =
        key === "firmware"
          ? ["S", "TB"]
          : applicableRequirements[key] === "W"
          ? ["S", "TS"]
          : ["S", "TS", "TB"];
      return (
        verificationResults[key] &&
        !allowedResults.includes(verificationResults[key])
      );
    });
    if (invalidKeys.length > 0) {
      error(
        "Hasil firmware harus Ada atau Tidak Ada (TB); aspek wajib harus Sesuai atau Tidak Sesuai; aspek opsional boleh Tidak Berlaku.",
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

    const tindakLanjut = getAutomaticFollowUp(form, equipmentInfo);
    if (!tindakLanjut) {
      error("Lengkapi hasil pemeriksaan untuk menentukan tindak lanjut.");
      return;
    }

    setBusy(true);
    try {
      const catatanTerstruktur = JSON.stringify({
        format: "TLKM13/F/003-v05",
        catatan_pic: form.catatan,
        acuan_kriteria: form.acuan_kriteria,
        jenis_pemeriksaan: inspectionMethod,
        firmware: {
          versi_tercatat: getEquipmentFirmwareVersion(equipmentInfo),
          versi_aktual:
            verificationResults.firmware === "S"
              ? form.firmware_versi_aktual.trim()
              : "",
        },
        sertifikat: {
          nomor: form.nomor_sertifikat,
          penyedia: form.penyedia_kalibrasi,
          tanggal_kalibrasi: form.tanggal_kalibrasi,
          berlaku_sampai: form.berlaku_sampai,
          penerapan_nilai_koreksi: form.nilai_koreksi,
        },
        verifikasi_fungsi: {
          tanggal_pemeriksaan: form.tanggal_verifikasi_fungsi,
          nomor_laporan: form.nomor_laporan,
          pelaksana: form.pelaksana_verifikasi,
          hasil: form.hasil_verifikasi_fungsi,
        },
        dokumen_pemeriksaan:
          inspectionDocument?.name || form.dokumen_pemeriksaan_url,

        alasan_tb: form.tb_alasan,
        alasan_ts: form.ts_alasan,
      });

      // 1. Buat verifikasi
      const res = await verifikasiApi.create({
        id_peralatan: Number(form.id_peralatan),
        tanggal_verifikasi: form.tanggal_verifikasi,
        tindak_lanjut: tindakLanjut,
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
          nama_firmware:
            verificationResults.firmware === "S"
              ? form.firmware_versi_aktual.trim()
              : "",
          catatan: JSON.stringify({ alasan_tb: form.tb_alasan }),
        },
      });

      // 2. Tanda tangan PIC menjadi bukti pengajuan kepada Manager
      const newId = res?.data?.id_verifikasi ?? res?.data?.id ?? res?.id;
      if (!newId) {
        throw new Error("Verifikasi berhasil dibuat tetapi ID tidak ditemukan; tanda tangan belum tersimpan.");
      }
      await verifikasiApi.signPic(newId, picSignature);

      if (inspectionDocument) {
        try {
          const documentType =
            inspectionMethod === "kalibrasi"
              ? "Sertifikat Kalibrasi"
              : "Laporan Verifikasi Fungsi";
          const documentNumber =
            inspectionMethod === "kalibrasi"
              ? form.nomor_sertifikat.trim()
              : form.nomor_laporan.trim();
          await dokumenApi.upload(
            Number(form.id_peralatan),
            inspectionDocument,
            `${documentType} - ${documentNumber}`,
          );
        } catch (uploadError) {
          error(
            `Verifikasi berhasil diajukan, tetapi dokumen gagal diunggah. ${uploadError.message || "Silakan unggah dokumen melalui menu dokumen peralatan."}`,
          );
          navigate(returnPath);
          return;
        }
      }

      success(
        inspectionDocument
          ? "Verifikasi dan dokumen hasil pemeriksaan berhasil diajukan kepada Manager Lab."
          : "Verifikasi berhasil diajukan kepada Manager Lab.",
      );

      if (equipmentId) {
        navigate(returnPath);
      } else {
        setForm(emptyForm());
        await loadList();
      }
    } catch (err) {
      error(err.message || "Gagal mengajukan verifikasi.");
    } finally {
      setBusy(false);
    }
  }

  function closeApprovalModal() {
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
      await ensureSignatureSaved(managerSignature.trim());
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
      await ensureSignatureSaved(managerSignature.trim());
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
        picSignature={picSignature}
        setPicSignature={setPicSignature}
        handleSignatureChange={handleSignatureChange}
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
        role={role}
        staffIsPengelola={staffIsPengelola}
        canApprove={canApprove}
        busy={busy}
        onNavigate={navigate}
        onReview={(item) => {
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
        setSelected={setSelected}
      />
    </>
  );
}