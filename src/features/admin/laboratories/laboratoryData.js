export const EMPTY_LAB_FORM = Object.freeze({
  nama_labs: '',
  kode_labs: '',
  manager_id: '',
});

export function createLabForm(lab) {
  return {
    nama_labs: lab.nama_labs || '',
    kode_labs: lab.kode_labs || '',
    manager_id: lab.manager_id ? String(lab.manager_id) : '',
  };
}

export function getLabValidationError(form) {
  return !form.nama_labs.trim() || !form.kode_labs.trim() || !form.manager_id
    ? 'Kode Lab, Nama Lab, dan Manager / Penanggung Jawab wajib diisi.'
    : '';
}

export function createLabPayload(form) {
  return {
    nama_labs: form.nama_labs.trim(),
    kode_labs: form.kode_labs.trim().toUpperCase(),
    manager_id: form.manager_id ? Number(form.manager_id) : null,
  };
}

export function filterLabs(labs, search) {
  const query = search.toLowerCase();
  return labs.filter((lab) => (
    !query ||
    lab.nama_labs?.toLowerCase().includes(query) ||
    lab.kode_labs?.toLowerCase().includes(query) ||
    lab.manager?.name?.toLowerCase().includes(query)
  ));
}

export function getLabManager(lab, managers) {
  return lab.manager || managers.find((manager) => manager.user_id === lab.manager_id);
}
