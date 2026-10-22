import { getEquipmentCategoryId, getEquipmentLabId } from '../../shared/services/api.js';

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
    const matchesLifecycle = lifecycle === 'pending'
      ? pending
      : lifecycle === 'review'
        ? rejected
        : equipment.status_alat === 'Aktif' && approved;

    return matchesSearch && matchesCategory && matchesLab && matchesLifecycle;
  });
}

export function getEquipmentLifecycleHeader(lifecycle) {
  return LIFECYCLE_HEADERS[lifecycle] || LIFECYCLE_HEADERS.all;
}
