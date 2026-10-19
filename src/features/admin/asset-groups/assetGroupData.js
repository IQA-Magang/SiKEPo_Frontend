export const EMPTY_ASSET_GROUP_FORM = Object.freeze({
  kode: '',
  nama: '',
  lab_id: '',
  pic_id: '',
});

export function createAssetGroupForm(assetGroup) {
  return {
    kode: assetGroup.kode || '',
    nama: assetGroup.nama || '',
    lab_id: assetGroup.lab_id ? String(assetGroup.lab_id) : '',
    pic_id: assetGroup.pic_id ? String(assetGroup.pic_id) : '',
  };
}

export function getAssetGroupValidationError(form) {
  if (!form.kode.trim() || !form.nama.trim()) {
    return 'Kode dan Nama Kelompok Aset wajib diisi.';
  }
  if (!form.lab_id) {
    return 'Laboratorium wajib dipilih.';
  }
  if (!form.pic_id) {
    return 'PIC wajib dipilih.';
  }
  return '';
}

export function createAssetGroupPayload(form) {
  return {
    kode: form.kode.trim().toUpperCase(),
    nama: form.nama.trim(),
    lab_id: Number(form.lab_id),
    pic_id: Number(form.pic_id),
  };
}

export function filterAssetGroups(assetGroups, { search, labId }) {
  const query = search.toLowerCase();

  return assetGroups.filter((assetGroup) => {
    const matchesQuery =
      !query ||
      assetGroup.nama?.toLowerCase().includes(query) ||
      assetGroup.kode?.toLowerCase().includes(query) ||
      assetGroup.lab?.nama_labs?.toLowerCase().includes(query) ||
      assetGroup.pic?.name?.toLowerCase().includes(query);
    const matchesLab = !labId || String(assetGroup.lab_id) === labId;

    return matchesQuery && matchesLab;
  });
}

export function getAssetGroupLab(assetGroup, labs) {
  return assetGroup.lab || labs.find((lab) => lab.id === assetGroup.lab_id);
}

export function getAssetGroupPic(assetGroup, users) {
  return assetGroup.pic || users.find((user) => user.user_id === assetGroup.pic_id);
}
