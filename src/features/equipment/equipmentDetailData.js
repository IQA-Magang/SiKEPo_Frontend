import { getEquipmentCategoryId } from '../../shared/services/api.js';

export function parseVerificationNotes(rawNotes) {
  if (!rawNotes) return null;
  if (typeof rawNotes === 'object') return rawNotes;
  try {
    const parsed = JSON.parse(rawNotes);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function getVerificationCheckLabel(key) {
  const labels = {
    identitas: 'Identitas alat (merek, tipe/model, nomor seri)',
    kelengkapan: 'Kelengkapan aksesori dan manual',
    firmware: 'Versi peranti lunak/firmware',
    kondisi_fisik: 'kondisi fisik',
    segel: 'Keutuhan segel',
    fungsi_awal: 'Fungsi awal',
    metrologi: 'Karakteristik metrologi',
    sertifikat: 'Sertifikat kalibrasi',
  };
  return labels[key] || key.replaceAll('_', ' ');
}

export function formatVerificationResult(result, key) {
  if (key === 'firmware') {
    if (result === 'S') return 'Ada';
    if (result === 'TS') return 'Tidak Ada';
    if (result === 'TB') return 'Belum dinilai';
  }
  if (result === 'S') return 'Sesuai';
  if (result === 'TS') return 'Tidak Sesuai';
  if (result === 'TB') return 'Tidak Berlaku';
  return result;
}

export function getActivityName(code) {
  const activityNames = {
    A1: 'Penerimaan alat baru',
    A2: 'Kalibrasi',
    A3: 'Peminjaman / pemindahan / penyewaan',
    A4: 'Pemeliharaan',
    A5: 'Pengecekan antara / verifikasi fungsi',
  };
  const activityCode = String(code || '').trim().toUpperCase();
  return activityNames[activityCode] || code;
}

export function getEquipmentDetailRows(equipment) {
  const categoryId = getEquipmentCategoryId(equipment);
  const detail = equipment.detail ||
    equipment.detail_alat_ukur ||
    equipment.detail_alat_bantu ||
    equipment.detail_artefak_acuan ||
    equipment.detail_komponen_pendukung ||
    equipment;
  const fieldsByCategory = {
    1: [
      ['Metode Kelayakan', 'metode_kelayakan'],
      ['No. Sertifikat', 'no_sertifikat'],
      ['Kalibrasi Terakhir', 'tgl_kalibrasi', 'date'],
      ['Jatuh Tempo Kalibrasi', 'tgl_jatuh_tempo', 'date'],
      ['Interval Kalibrasi', 'interval_bulan', 'months'],
      ['Fungsi sebagai Alat Standar', 'fungsi_sbg_alat_standar', 'boolean'],
      ['Parameter / Rentang Ukur', 'parameter_rentang_ukur'],
      ['Resolusi', 'resolusi'],
      ['Akurasi Spesifikasi', 'akurasi_spesifikasi'],
      ['Satuan', 'satuan'],
      ['Nilai Koreksi', 'nilai_koreksi'],
      ['Ketidakpastian', 'ketidakpastian'],
      ['Jenis Label', 'jenis_label'],
      ['Status Kelayakan', 'status_kelayakan'],
    ],
    2: [
      ['Fungsi / Kegunaan', 'fungsi_kegunaan'],
      ['Jenis Pemeriksaan Berkala', 'jenis_pemeriksaan_berkala'],
      ['Kriteria Pemeriksaan', 'kriteria_pemeriksaan'],
      ['Tgl. Pemeriksaan Terakhir', 'tgl_pemeriksaan_terakhir', 'date'],
      ['Jatuh Tempo Pemeriksaan', 'tgl_jatuh_tempo', 'date'],
      ['Interval Pemeriksaan', 'interval_bulan', 'months'],
      ['Fungsi sebagai Alat Standar', 'fungsi_sbg_alat_standar', 'boolean'],
      ['Karakteristik Acuan', 'karakteristik_acuan'],
      ['Jadwal Karakterisasi Ulang', 'jadwal_karakterisasi_ulang'],
    ],
    3: [
      ['Jenis Deskripsi', 'jenis_deskripsi'],
      ['Karakteristik yang Diacu', 'karakteristik_yang_diacu'],
      ['Nilai Spesifikasi Karakterisasi', 'nilai_spesifikasi_karakterisasi'],
      ['Metode Karakterisasi', 'metode_karakterisasi'],
      ['No. Laporan Karakterisasi', 'no_laporan_karakterisasi'],
      ['Tgl. Karakterisasi Terakhir', 'tgl_karakterisasi_terakhir', 'date'],
      ['Tgl. Karakterisasi Ulang', 'tgl_karakterisasi', 'date'],
      ['Interval Karakterisasi', 'interval_bulan', 'months'],
      ['Kondisi Penyimpanan', 'kondisi_penyimpanan'],
      ['Status Artefak', 'status'],
    ],
    4: [
      ['Sub Kategori', 'sub_kategori'],
      ['Deskripsi / Spesifikasi', 'deskripsi_spesifikasi'],
      ['Grade Mutu', 'grade_mutu'],
      ['Sumber / Pemasok', 'sumber_pemasok'],
      ['No. Lot / Batch / Edisi', 'no_lot_batch_edisi'],
      ['Satuan Kemasan', 'satuan_kemasan'],
      ['Tgl. Terima / Terbit', 'tgl_terima_terbit', 'date'],
      ['Tgl. Kedaluwarsa', 'tgl_kedaluwarsa', 'date'],
      ['Kondisi Penyimpanan', 'kondisi_penyimpanan'],
      ['Status Ketersediaan', 'status_ketersediaan'],
    ],
  };

  return (fieldsByCategory[categoryId] || []).flatMap(([label, key, type]) => {
    const rawValue = detail[key];
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      if (categoryId === 1 && ['tgl_kalibrasi', 'tgl_jatuh_tempo'].includes(key)) {
        return [{ label, value: 'Belum tersedia' }];
      }
      return [];
    }

    let value = rawValue;
    if (type === 'date') value = formatDate(rawValue);
    if (type === 'months') value = rawValue ? `${rawValue} Bulan` : '';
    if (type === 'boolean') value = rawValue ? 'Ya' : 'Tidak';
    if (value === '') return [];
    return [{ label, value }];
  });
}

export function formatDate(dateString) {
  if (!dateString) return '–';
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
