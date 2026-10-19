export const EQUIPMENT_CREATE_STEPS = [
  'Info Dasar',
  'Lokasi',
  'Detail Teknis',
  'Dokumen Wajib',
  'Konfirmasi',
];

export function getEquipmentStepValidationError(form, step, photoFile, documentCount) {
  if (step === 0) {
    if (!form.nama_peralatan.trim()) return 'Nama peralatan wajib diisi.';
    if (!photoFile) return 'Foto peralatan wajib diunggah.';
    if (!form.kategori_id) return 'Kategori peralatan wajib dipilih.';
    const requiredFields = [
      ['merek', 'Merek / Pabrikan wajib diisi.'],
      ['tipe_model', 'Tipe / Model wajib diisi.'],
      ['nomor_seri', 'Nomor Seri (Serial Number) wajib diisi.'],
      ['peranti_lunak_versi', 'Perangkat Lunak / Firmware wajib diisi.'],
      ['keterangan', 'Keterangan tambahan wajib diisi.'],
    ];
    for (const [field, message] of requiredFields) {
      if (!form[field]?.trim()) return message;
    }
  }

  if (step === 1) {
    if (!form.lab_id) return 'Laboratorium wajib dipilih.';
    if (!form.ruangan_id) return 'Lokasi ruangan wajib dipilih.';
    if (!form.kelompok_aset_id) return 'Kelompok aset wajib dipilih.';
  }

  if (step === 2) {
    const categoryRequiredFields = {
      1: [
        ['no_sertifikat', 'No. sertifikat kalibrasi wajib diisi.'],
        ['interval_bulan', 'Interval kalibrasi (bulan) wajib diisi.'],
        ['tgl_kalibrasi', 'Tanggal kalibrasi terakhir wajib diisi.'],
        ['tgl_jatuh_tempo', 'Tanggal jatuh tempo kalibrasi wajib diisi.'],
      ],
      2: [
        ['fungsi_kegunaan', 'Fungsi / Kegunaan wajib diisi.'],
        ['jenis_pemeriksaan_berkala', 'Jenis pemeriksaan berkala wajib diisi.'],
        ['interval_bulan', 'Interval pemeriksaan (bulan) wajib diisi.'],
        ['tgl_jatuh_tempo', 'Tanggal jatuh tempo wajib diisi.'],
        ['tgl_pemeriksaan_terakhir', 'Tanggal pemeriksaan terakhir wajib diisi.'],
        ['kriteria_pemeriksaan', 'Kriteria pemeriksaan wajib diisi.'],
      ],
      3: [
        ['jenis_deskripsi', 'Jenis / deskripsi acuan wajib diisi.'],
        ['karakteristik_yang_diacu', 'Karakteristik yang diacu wajib diisi.'],
        ['nilai_spesifikasi_karakterisasi', 'Nilai spesifikasi karakterisasi wajib diisi.'],
        ['metode_karakterisasi', 'Metode karakterisasi wajib diisi.'],
        ['no_laporan_karakterisasi', 'No. laporan karakterisasi wajib diisi.'],
        ['tgl_karakterisasi_terakhir', 'Tanggal karakterisasi terakhir wajib diisi.'],
        ['tgl_jatuh_tempo', 'Tanggal jatuh tempo wajib diisi.'],
        ['kondisi_penyimpanan', 'Kondisi penyimpanan wajib diisi.'],
      ],
      4: [
        ['sub_kategori', 'Sub kategori wajib diisi.'],
        ['sumber_pemasok', 'Sumber / pemasok wajib diisi.'],
        ['no_lot_batch_edisi', 'No. lot / batch / edisi wajib diisi.'],
        ['grade_mutu', 'Grade mutu wajib diisi.'],
        ['satuan_kemasan', 'Satuan kemasan wajib diisi.'],
        ['tgl_terima_terbit', 'Tanggal terima / terbit wajib diisi.'],
        ['tgl_kedaluwarsa', 'Tanggal kedaluwarsa wajib diisi.'],
        ['deskripsi_spesifikasi', 'Deskripsi / spesifikasi wajib diisi.'],
        ['status_ketersediaan', 'Status ketersediaan wajib diisi.'],
      ],
    };

    for (const [field, message] of categoryRequiredFields[form.kategori_id] || []) {
      const value = form[field];
      if (typeof value === 'string' ? !value.trim() : !value) return message;
    }
  }

  if (step === 3 && documentCount < 2) {
    return 'Minimal dua (2) file dokumen peralatan wajib diunggah.';
  }

  return '';
}

function toIsoDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00Z`;
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
}

export function buildEquipmentPayload(form) {
  const categoryId = Number(form.kategori_id);
  let detail = {};

  if (categoryId === 1) {
    detail = {
      peranti_lunak_versi: form.peranti_lunak_versi || '',
      metode_kelayakan: form.metode_kelayakan || 'kalibrasi eksternal',
      no_sertifikat: form.no_sertifikat || '',
      tgl_kalibrasi: toIsoDate(form.tgl_kalibrasi),
      tgl_jatuh_tempo: toIsoDate(form.tgl_jatuh_tempo),
      interval_bulan: Number(form.interval_bulan) || 0,
      fungsi_sbg_alat_standar: Boolean(form.fungsi_sbg_alat_standar),
      jenis_label: form.jenis_label || 'calibration',
      status_kelayakan: form.status_kelayakan || 'Layak',
      parameter_rentang_ukur: form.parameter_rentang_ukur || '',
      resolusi: form.resolusi || '',
      akurasi_spesifikasi: form.akurasi_spesifikasi || '',
      satuan: form.satuan || '',
      nilai_koreksi: form.nilai_koreksi || '',
      ketidakpastian: form.ketidakpastian || '',
    };
  } else if (categoryId === 2) {
    detail = {
      fungsi_kegunaan: form.fungsi_kegunaan || '',
      peranti_lunak_versi: form.peranti_lunak_versi || '',
      jenis_pemeriksaan_berkala: form.jenis_pemeriksaan_berkala || 'pemeriksaan lain',
      kriteria_pemeriksaan: form.kriteria_pemeriksaan || '',
      tgl_pemeriksaan_terakhir: toIsoDate(form.tgl_pemeriksaan_terakhir),
      tgl_jatuh_tempo: toIsoDate(form.tgl_jatuh_tempo),
      interval_bulan: Number(form.interval_bulan) || 0,
      fungsi_sbg_alat_standar: Boolean(form.fungsi_sbg_alat_standar),
      karakteristik_acuan: form.karakteristik_acuan || '',
      jadwal_karakterisasi_ulang: form.jadwal_karakterisasi_ulang || '',
    };
  } else if (categoryId === 3) {
    detail = {
      jenis_deskripsi: form.jenis_deskripsi || '',
      karakteristik_yang_diacu: form.karakteristik_yang_diacu || 'visual',
      nilai_spesifikasi_karakterisasi: form.nilai_spesifikasi_karakterisasi || '',
      metode_karakterisasi: form.metode_karakterisasi || '',
      no_laporan_karakterisasi: form.no_laporan_karakterisasi || '',
      tgl_karakterisasi_terakhir: toIsoDate(form.tgl_karakterisasi_terakhir),
      tgl_karakterisasi: toIsoDate(form.tgl_jatuh_tempo),
      interval_bulan: Number(form.interval_bulan) || 0,
      kondisi_penyimpanan: form.kondisi_penyimpanan || '',
      status: form.status_artefak || 'aktif',
    };
  } else if (categoryId === 4) {
    detail = {
      sub_kategori: form.sub_kategori || 'data acuan',
      deskripsi_spesifikasi: form.deskripsi_spesifikasi || '',
      sumber_pemasok: form.sumber_pemasok || '',
      no_lot_batch_edisi: form.no_lot_batch_edisi || '',
      grade_mutu: form.grade_mutu || '',
      satuan_kemasan: form.satuan_kemasan || '',
      tgl_terima_terbit: toIsoDate(form.tgl_terima_terbit),
      tgl_kedaluwarsa: toIsoDate(form.tgl_kedaluwarsa),
      kondisi_penyimpanan: form.kondisi_penyimpanan || '',
      status_ketersediaan: form.status_ketersediaan || 'Tersedia',
    };
  }

  return {
    nama_peralatan: form.nama_peralatan,
    kategori_id: categoryId,
    kategori_peralatan_id: categoryId,
    kelompok_aset_id: Number(form.kelompok_aset_id),
    ruangan_id: Number(form.ruangan_id),
    merek: form.merek,
    tipe_model: form.tipe_model,
    nomor_seri: form.nomor_seri,
    peranti_lunak_versi: form.peranti_lunak_versi,
    keterangan: form.keterangan,
    status_alat: 'Karantina',
    detail,
  };
}

export function calculateCalibrationDueDate(calibrationDate, intervalMonths) {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(calibrationDate || '');
  const months = Number(intervalMonths);
  if (!dateParts || !Number.isInteger(months) || months <= 0) return '';

  const year = Number(dateParts[1]);
  const month = Number(dateParts[2]);
  const day = Number(dateParts[3]);
  const sourceDate = new Date(`${calibrationDate}T00:00:00Z`);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    Number.isNaN(sourceDate.getTime()) ||
    sourceDate.toISOString().slice(0, 10) !== calibrationDate
  ) {
    return '';
  }

  const targetMonthIndex = month - 1 + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  if (targetYear > 9999) return '';

  const targetMonth = targetMonthIndex % 12;
  const lastDayOfTargetMonth = new Date(0);
  lastDayOfTargetMonth.setUTCHours(0, 0, 0, 0);
  lastDayOfTargetMonth.setUTCFullYear(targetYear, targetMonth + 1, 0);
  const dueDay = Math.min(day, lastDayOfTargetMonth.getUTCDate());

  return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
}
