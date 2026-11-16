import { useCallback, useEffect, useState } from "react";
import {
  kalibrasiApi,
  getEquipmentId,
  peralatanApi,
  ruanganApi,
  verifikasiFungsiApi,
  verifikasiApi,
} from "../../../shared/services/api.js";
import {
  ACTIVITY_REQUIREMENTS,
  CHECKS,
  getApplicableRequirements,
  getEquipmentFirmwareVersion,
  getEquipmentInspectionMethod,
  isEquipmentInUserLab,
} from "../verificationData.js";

function getInspectionMethodHint(equipment) {
  const method = String(
    equipment?.metode_pemeriksaan ||
      equipment?.detail?.metode_pemeriksaan ||
      "",
  )
    .trim()
    .toLowerCase();
  if (method.includes("verifikasi")) return "verifikasi_fungsi";
  if (method.includes("kalibrasi")) return "kalibrasi";

  const activityCode = String(equipment?.kode_aktivitas || "").toUpperCase();
  if (activityCode === "A5") return "verifikasi_fungsi";
  if (activityCode === "A2") return "kalibrasi";

  const detail = equipment?.detail;
  if (
    detail?.jenis_pemeriksaan_berkala ||
    detail?.no_laporan ||
    detail?.pdf_laporan
  ) {
    return "verifikasi_fungsi";
  }
  if (
    detail?.metode ||
    detail?.no_sertifikat ||
    detail?.tgl_kalibrasi ||
    detail?.sertifikat_pdf
  ) {
    return "kalibrasi";
  }
  return "";
}

function getInspectionRecordTimestamp(record) {
  const timestamp = Date.parse(
    record.updated_at ||
      record.created_at ||
      record.tgl_pemeriksaan_terakhir ||
      record.tgl_kalibrasi ||
      "",
  );
  return Number.isNaN(timestamp) ? Number(record.id) || 0 : timestamp;
}

export default function useVerificationManagement({
  equipmentId,
  isLabScopedUser,
  currentUserLabId,
  setForm,
  setBusy,
  onError,
}) {
  const [items, setItems] = useState([]);
  const [pendingEquipment, setPendingEquipment] = useState([]);
  const [equipmentInfo, setEquipmentInfo] = useState(null);
  const [loadingEquipment, setLoadingEquipment] = useState(Boolean(equipmentId));

  const loadList = useCallback(async () => {
    setBusy(true);
    try {
      if (isLabScopedUser && currentUserLabId == null) {
        throw new Error("Akun pengguna belum terhubung dengan lab.");
      }

      const [verificationResult, equipmentResult, roomsResult] =
        await Promise.allSettled([
          verifikasiApi.getAll(),
          peralatanApi.getAll(),
          ruanganApi.getAll(),
        ]);
      if (roomsResult.status !== "fulfilled") {
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

      const allVerifications =
        verificationResult.status === "fulfilled"
          ? verificationResult.value?.data || []
          : [];
      const latestVerificationByEquipmentId = new Map();
      allVerifications.forEach((item) => {
        const equipmentId = item.id_peralatan ?? getEquipmentId(item.peralatan);
        if (equipmentId == null) return;

        const key = String(equipmentId);
        if (!latestVerificationByEquipmentId.has(key)) {
          latestVerificationByEquipmentId.set(key, item);
        }
      });

      if (verificationResult.status === "fulfilled") {
        const enrichedVerifications = allVerifications.map((item) => {
          const listedEquipment = equipmentById.get(String(item.id_peralatan));
          const equipment = listedEquipment
            ? { ...listedEquipment, ...item.peralatan }
            : item.peralatan;
          if (!equipment) return item;

          const room =
            roomsById.get(String(equipment.ruangan_id ?? equipment.room_id ?? equipment.ruangan?.id ?? "")) ||
            equipment.ruangan;
          return {
            ...item,
            peralatan: {
              ...equipment,
              ruangan: room,
              laboratorium:
                equipment.laboratorium || room?.labs || room?.laboratorium,
            },
          };
        });
        setItems(
          isLabScopedUser
            ? enrichedVerifications.filter((item) => {
                const itemEquipment =
                  item.peralatan ||
                  equipmentById.get(String(item.id_peralatan));
                return isEquipmentInUserLab(
                  itemEquipment,
                  roomsById,
                  currentUserLabId,
                );
              })
            : enrichedVerifications,
        );
      }

      const pendingFollowUpEquipmentIds = new Set(
        [...latestVerificationByEquipmentId.entries()]
          .filter(([, item]) => {
            const activityCode = String(item.kode_aktivitas || "")
              .trim()
              .toUpperCase();
            return (
              ["Draft", "Diajukan"].includes(item.status) &&
              activityCode !== "" &&
              activityCode !== "A1" &&
              !(activityCode === "A3" && item.status === "Draft")
            );
          })
          .map(([equipmentId]) => equipmentId),
      );
      if (equipmentResult.status === "fulfilled") {
        const pending = allEquipment.filter((item) => {
          const activityCode = String(item.kode_aktivitas || "")
            .trim()
            .toUpperCase();
          return (
            item.status_verifikasi !== "Disetujui" &&
            item.status_verifikasi !== "Diajukan" &&
            ((activityCode === "" || activityCode === "A1") ||
              (["A2", "A3"].includes(activityCode) &&
                item.status_verifikasi === "Belum Diverifikasi")) &&
            !pendingFollowUpEquipmentIds.has(String(getEquipmentId(item)))
          );
        });
        const visiblePending = isLabScopedUser
          ? pending.filter((item) =>
              isEquipmentInUserLab(item, roomsById, currentUserLabId),
            )
          : pending;
        setPendingEquipment(
          visiblePending.map((item) => {
            const room =
              roomsById.get(String(item.ruangan_id ?? item.room_id ?? item.ruangan?.id ?? "")) ||
              item.ruangan;
            return {
              ...item,
              ruangan: room,
              laboratorium:
                item.laboratorium || room?.labs || room?.laboratorium,
            };
          }),
        );
      }
    } catch (err) {
      onError(err.message || "Gagal memuat data verifikasi.");
    } finally {
      setBusy(false);
    }
  }, [currentUserLabId, isLabScopedUser, onError, setBusy]);

  useEffect(() => {
    if (!equipmentId) loadList();
  }, [equipmentId, loadList]);

  useEffect(() => {
    if (!equipmentId) {
      setLoadingEquipment(false);
      setEquipmentInfo(null);
      return undefined;
    }

    setEquipmentInfo(null);
    setLoadingEquipment(true);
    setForm((previous) => ({
      ...previous,
      id_peralatan: String(equipmentId),
    }));
    let active = true;

    async function fetchEquipment() {
      try {
        if (isLabScopedUser && currentUserLabId == null) {
          throw new Error("Akun pengguna belum terhubung dengan lab.");
        }

        const [equipmentResult, roomsResult] = await Promise.allSettled([
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
            new Error(
              "Gagal memuat data peralatan untuk memeriksa lab pengguna.",
            )
          );
        }

        const rooms =
          roomsResult.status === "fulfilled"
            ? roomsResult.value?.data || []
            : [];
        const roomsById = new Map(
          rooms.map((room) => [String(room.id), room]),
        );

        if (equipmentResult.status !== "fulfilled") return;
        const found = (equipmentResult.value.data || []).find(
          (item) => String(getEquipmentId(item)) === String(equipmentId),
        );
        const canViewEquipment =
          found &&
          (!isLabScopedUser ||
            isEquipmentInUserLab(found, roomsById, currentUserLabId));
        if (!canViewEquipment || !active) return;

        const detailResponse = await peralatanApi.getByAssetNumber(
          found.nomor_aset,
        );
        const equipmentDetails = detailResponse?.data;
        if (!equipmentDetails?.peralatan || !active) {
          if (active) {
            throw new Error("Format detail peralatan tidak valid.");
          }
          return;
        }

        const equipmentWithDetails = {
          ...found,
          ...equipmentDetails.peralatan,
          detail: equipmentDetails.detail,
        };
        let inspectionMethod = getInspectionMethodHint(equipmentWithDetails);
        let inspectionRecord = equipmentDetails.detail;
        if (!inspectionMethod) {
          const historyResults = await Promise.allSettled([
            kalibrasiApi.getByEquipment(getEquipmentId(equipmentWithDetails)),
            verifikasiFungsiApi.getByEquipment(
              getEquipmentId(equipmentWithDetails),
            ),
          ]);
          const historyRecords = [];
          historyResults.forEach((result, index) => {
            const method = index === 0 ? "kalibrasi" : "verifikasi_fungsi";
            if (result.status === "rejected") {
              onError(
                result.reason?.message ||
                  `Gagal memuat histori ${method === "kalibrasi" ? "kalibrasi" : "verifikasi fungsi"}.`,
              );
              return;
            }
            if (!Array.isArray(result.value?.data)) {
              onError(
                `Format histori ${method === "kalibrasi" ? "kalibrasi" : "verifikasi fungsi"} tidak valid.`,
              );
              return;
            }
            result.value.data.forEach((record) =>
              historyRecords.push({ method, record }),
            );
          });
          historyRecords.sort(
            (left, right) =>
              getInspectionRecordTimestamp(right.record) -
                getInspectionRecordTimestamp(left.record) ||
              Number(right.record.id) - Number(left.record.id),
          );
          inspectionRecord = historyRecords[0]?.record || inspectionRecord;
          inspectionMethod =
            historyRecords[0]?.method ||
            getEquipmentInspectionMethod(equipmentWithDetails);
        }
        equipmentWithDetails.metode_pemeriksaan = inspectionMethod;
        if (!active) return;
        setEquipmentInfo(equipmentWithDetails);
        const detail = equipmentDetails.detail || {};
        const calibrationRecord =
          inspectionMethod === "kalibrasi" ? inspectionRecord : null;
        const functionVerificationRecord =
          inspectionMethod === "verifikasi_fungsi" ? inspectionRecord : null;
        const autoActivity = equipmentWithDetails.kode_aktivitas || "A1";
        const requirements = getApplicableRequirements(
          equipmentWithDetails,
          ACTIVITY_REQUIREMENTS[autoActivity] || {},
        );

        setForm((previous) => {
          const nextResults = { ...previous.hasil_verifikasi };
          CHECKS.forEach((key) => {
            if (requirements[key] === "-") {
              nextResults[key] = "TB";
            }
          });

          return {
            ...previous,
            id_peralatan: String(equipmentId),
            kode_aktivitas: autoActivity,
            nomor_sertifikat:
              calibrationRecord?.no_sertifikat ||
              previous.nomor_sertifikat,
            penyedia_kalibrasi:
              calibrationRecord?.diterbitkan_oleh ||
              previous.penyedia_kalibrasi,
            tanggal_kalibrasi: calibrationRecord?.tgl_kalibrasi
              ? calibrationRecord.tgl_kalibrasi.slice(0, 10)
              : previous.tanggal_kalibrasi,
            tanggal_verifikasi_fungsi:
              functionVerificationRecord?.tgl_pemeriksaan_terakhir
                ? functionVerificationRecord.tgl_pemeriksaan_terakhir.slice(
                    0,
                    10,
                  )
                : previous.tanggal_verifikasi_fungsi,
            nomor_laporan:
              functionVerificationRecord?.no_laporan || previous.nomor_laporan,
            pelaksana_verifikasi:
              functionVerificationRecord?.pelaksana ||
              previous.pelaksana_verifikasi,
            hasil_verifikasi_fungsi:
              functionVerificationRecord?.hasil ||
              previous.hasil_verifikasi_fungsi,
            berlaku_sampai: detail.tgl_jatuh_tempo
              ? detail.tgl_jatuh_tempo.slice(0, 10)
              : previous.berlaku_sampai,
            firmware_versi_aktual:
              getEquipmentFirmwareVersion(equipmentWithDetails) ||
              previous.firmware_versi_aktual,
            hasil_verifikasi: nextResults,
          };
        });
      } catch (err) {
        if (active) onError(err.message || "Gagal mengambil data peralatan.");
      } finally {
        if (active) setLoadingEquipment(false);
      }
    }

    fetchEquipment();
    return () => {
      active = false;
    };
  }, [
    currentUserLabId,
    equipmentId,
    isLabScopedUser,
    onError,
    setForm,
  ]);

  return {
    items,
    pendingEquipment,
    equipmentInfo,
    loadingEquipment,
    loadList,
  };
}
