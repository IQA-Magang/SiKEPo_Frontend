export const EMPTY_ROOM_FORM = Object.freeze({
  nama_ruangan: '',
  kode_ruangan: '',
  lantai_ruangan: 'Lantai 1',
  labs_id: '',
  pic_user_id: '',
});

export function createRoomForm(room) {
  return {
    nama_ruangan: room.nama_ruangan || '',
    kode_ruangan: room.kode_ruangan || '',
    lantai_ruangan: room.lantai_ruangan || 'Lantai 1',
    labs_id: room.labs_id ? String(room.labs_id) : '',
    pic_user_id: room.pic_user_id ? String(room.pic_user_id) : '',
  };
}

export function getRoomValidationError(form) {
  return !form.nama_ruangan.trim() || !form.kode_ruangan.trim() ||
    !form.lantai_ruangan.trim() || !form.labs_id || !form.pic_user_id
    ? 'Kode Ruangan, Nama Ruangan, Lantai, Laboratorium, dan PIC Ruangan wajib diisi.'
    : '';
}

export function createRoomPayload(form) {
  return {
    nama_ruangan: form.nama_ruangan.trim(),
    kode_ruangan: form.kode_ruangan.trim().toUpperCase(),
    lantai_ruangan: form.lantai_ruangan.trim(),
    labs_id: form.labs_id ? Number(form.labs_id) : null,
    pic_user_id: form.pic_user_id ? Number(form.pic_user_id) : null,
  };
}

export function filterRooms(rooms, { search, labId }) {
  const query = search.toLowerCase();
  return rooms.filter((room) => {
    const matchesQuery =
      !query ||
      room.nama_ruangan?.toLowerCase().includes(query) ||
      room.kode_ruangan?.toLowerCase().includes(query) ||
      room.lantai_ruangan?.toLowerCase().includes(query) ||
      room.labs?.nama_labs?.toLowerCase().includes(query) ||
      room.pic_user?.name?.toLowerCase().includes(query);
    const matchesLab = !labId || String(room.labs_id) === labId;
    return matchesQuery && matchesLab;
  });
}

export function getRoomLab(room, labs) {
  return room.labs || labs.find((lab) => lab.id === room.labs_id);
}

export function getRoomPic(room, users) {
  return room.pic_user || users.find((user) => user.user_id === room.pic_user_id);
}
