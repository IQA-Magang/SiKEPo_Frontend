import React, { useEffect, useState } from "react";
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
import { getUserRole, isStaffPengelola } from "../../shared/utils/permissions.js";
import { getSafeReturnPath, useNavigate } from "../../app/router/Router.jsx";
import VerificationFormPage from "./components/VerificationFormPage.jsx";
import VerificationListPage from "./components/VerificationListPage.jsx";
import VerificationDetailsModal from "./components/VerificationDetailsModal.jsx";
import {
  ACTIVITY_REQUIREMENTS,
  CHECKS,
  CHECK_LABELS,
  emptyForm,
  isEquipmentInUserLab,
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

  const [items, setItems] = useState([]);
  const [pendingEquipment, setPendingEquipment] = useState([]);
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