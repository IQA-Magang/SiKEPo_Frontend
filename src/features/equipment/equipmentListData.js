import {
  getEquipmentCategoryId,
  getEquipmentId,
  getEquipmentLabId,
} from '../../shared/services/api.js';

const LIFECYCLE_HEADERS = {
  pending: [
    'Menunggu Verifikasi',
    'peralatan menunggu pemeriksaan dan belum dapat digunakan',
  ],
  review: [
    'Peralatan dalam Peninjauan',
    'peralatan ditolak dan membutuhkan tindak lanjut',
  ],
  all: ['Daftar Peralatan'],
};

export function getEquipmentCategories(equipmentList) {
  return Array.from(
    new Map(
      equipmentList
        .filter((item) => item.kategori_peralatan?.id && item.kategori_peralatan?.nama_kategori)
        .map((item) => [item.kategori_peralatan.id, item.kategori_peralatan]),
    ).values(),
  );
}

export function mergePendingVerificationActivity(equipmentList, verifications) {
  const latestByEquipmentId = new Map();

  verifications.forEach((verification) => {
    const equipmentId = verification.id_peralatan ?? getEquipmentId(verification.peralatan);
    if (equipmentId == null) return;

    const key = String(equipmentId);
    const current = latestByEquipmentId.get(key);
    const verificationId = Number(verification.id_verifikasi ?? verification.id);
    const currentId = Number(current?.id_verifikasi ?? current?.id);
    if (!current || (Number.isFinite(verificationId) && verificationId > currentId)) {
      latestByEquipmentId.set(key, verification);
    }
  });

  return equipmentList.map((equipment) => {
    const verification = latestByEquipmentId.get(String(getEquipmentId(equipment)));
    const activityCode = String(verification?.kode_aktivitas || '').trim().toUpperCase();
    if (
      !verification ||
      !['Draft', 'Diajukan'].includes(verification.status) ||
      !activityCode ||
      activityCode === 'A1'
    ) {
      return equipment;
    }

    return {
      ...equipment,
      kode_aktivitas: activityCode,
      status_verifikasi: verification.status,
    };
  });
}

export function filterEquipment(equipmentList, {
  search,
  categoryId,
  labId,
  roomsById,
  lifecycle,
}) {
  const query = search.toLowerCase();

  return equipmentList.filter((equipment) => {
    const matchesSearch =
      !query ||
      equipment.nama_peralatan?.toLowerCase().includes(query) ||
      equipment.nomor_aset?.toLowerCase().includes(query) ||
      equipment.merek?.toLowerCase().includes(query);
    const equipmentCategoryId = getEquipmentCategoryId(equipment);
    const matchesCategory =
      !categoryId || String(equipmentCategoryId) === categoryId;
    const equipmentLabId = getEquipmentLabId(equipment, roomsById);
    const matchesLab =
      !labId || String(equipmentLabId) === String(labId);
    const approved = equipment.status_verifikasi === 'Disetujui';
    const rejected = equipment.status_verifikasi === 'Ditolak';
    const pending = !approved && !rejected;
    const activityCode = String(equipment.kode_aktivitas || '').trim().toUpperCase();
    const isFollowUpVerification =
      ['Draft', 'Diajukan'].includes(equipment.status_verifikasi) &&
      activityCode !== '' &&
      activityCode !== 'A1';
    const isReturnedFromLoanAwaitingVerification =
      activityCode === 'A3' &&
      equipment.status_verifikasi === 'Belum Diverifikasi';
    const matchesLifecycle = lifecycle === 'pending'
      ? pending
      : lifecycle === 'review'
        ? rejected
        : (['Aktif', 'Dipinjam'].includes(equipment.status_alat) && approved) ||
          isFollowUpVerification ||
          isReturnedFromLoanAwaitingVerification;

    return matchesSearch && matchesCategory && matchesLab && matchesLifecycle;
  });
}

export function getEquipmentLifecycleHeader(lifecycle) {
  return LIFECYCLE_HEADERS[lifecycle] || LIFECYCLE_HEADERS.all;
}
