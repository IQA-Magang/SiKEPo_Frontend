import {
  Box,
  Compass,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { getEquipmentCategoryId } from '../../../shared/services/api.js';

export const CATEGORY_META = {
  1: {
    icon: Compass,
    color: '#EE2E24',
    bg: '#FEF2F2',
    border: '#FCA5A5',
    standard: 'ISO/IEC 17025 Klausul 6.4 - Peralatan',
    description: 'Peralatan pengujian yang memiliki pengaruh langsung terhadap keabsahan hasil pengukuran atau kalibrasi metrologi.',
    requirements: [
      'Memerlukan kalibrasi berkala oleh laboratorium kalibrasi terakreditasi (ISO/IEC 17025)',
      'Dokumentasi sertifikat kalibrasi & penentuan interval kalibrasi',
      'Pengukuran ketidakpastian (measurement uncertainty) & traceability',
      'Pemeriksaan antara (intermediate checks) terjadwal',
    ],
    specificFields: [
      'Interval Kalibrasi (Bulan)',
      'Tanggal Kalibrasi Terakhir & Mendatang',
      'Penyedia Jasa Kalibrasi',
      'Rentang Ukur (Range) & Ketidakpastian (Uncertainty)',
    ],
  },
  2: {
    icon: Wrench,
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    standard: 'ISO/IEC 17025 Klausul 6.4 - Peralatan Pendukung',
    description: 'Peralatan yang digunakan untuk mendukung kondisi pengujian, seperti pengatur suhu/kelembaban, power supply, atau meja getar.',
    requirements: [
      'Pemeriksaan fisik dan fungsional secara berkala',
      'Pemantauan kestabilan unjuk kerja operasional',
      'Log perawatan berkala dan pembersihan rutin',
    ],
    specificFields: [
      'Interval Pemeriksaan (Bulan)',
      'Tanggal Pemeriksaan Terakhir & Berikutnya',
      'Kriteria Keberterimaan Fungsi',
      'Catatan Perawatan Preventif',
    ],
  },
  3: {
    icon: ShieldCheck,
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    standard: 'ISO/IEC 17025 Klausul 6.5 - Ketertelusuran Metrologis',
    description: 'Standar referensi dan material acuan bersertifikat (CRM) yang menjadi jangkar ketertelusuran hasil uji laboratorium.',
    requirements: [
      'Hanya digunakan untuk tujuan kalibrasi / verifikasi standar, bukan pengujian rutin',
      'Penyimpanan dalam kondisi lingkungan terkontrol ketat',
      'Karakterisasi acuan dan verifikasi drift berkala',
      'Sertifikat bahan acuan / acuan standar terdokumentasi',
    ],
    specificFields: [
      'Karakterisasi Acuan & Nilai Nominal',
      'Nilai Ketertelusuran / Traceability Linkage',
      'Masa Berlaku Nilai Sertifikat Acuan',
      'Protokol Penanganan & Penyimpanan Khusus',
    ],
  },
  4: {
    icon: Box,
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    standard: 'ISO/IEC 17025 Klausul 6.4 - Material Operasional',
    description: 'Aksesoris, kabel RF berpresisi, konektor, attenuator, dan modul uji yang terhubung langsung dengan sistem pengujian.',
    requirements: [
      'Verifikasi visual dan kontinuitas sebelum digunakan',
      'Pencegahan kerusakan mekanik pada konektor RF',
      'Pencatatan inventaris dan penggantian terjadwal',
    ],
    specificFields: [
      'Spesifikasi Konektor / Interface',
      'Impedansi / Rating Operasional',
      'Kondisi Keausan Pin & Kontak',
    ],
  },
};

export function getCategoryMeta(categoryId) {
  return CATEGORY_META[categoryId] || CATEGORY_META[1];
}

export function countEquipmentByCategory(equipment) {
  return equipment.reduce((counts, item) => {
    const categoryId = getEquipmentCategoryId(item);
    if (categoryId) counts[categoryId] = (counts[categoryId] || 0) + 1;
    return counts;
  }, {});
}
