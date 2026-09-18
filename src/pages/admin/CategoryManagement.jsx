import React, { useState, useEffect } from 'react';
import {
  Compass,
  Wrench,
  ShieldCheck,
  Box,
  Layers,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { getEquipmentCategoryId, peralatanApi } from '../../utils/api.js';

const CATEGORY_META = {
  1: {
    icon: Compass,
    color: '#EE2E24',
    bg: '#FEF2F2',
    border: '#FCA5A5',
    title: 'Alat Ukur (Measuring Equipment)',
    standard: 'ISO/IEC 17025 Klausul 6.4 - Peralatan',
    desc: 'Peralatan pengujian yang memiliki pengaruh langsung terhadap keabsahan hasil pengukuran atau kalibrasi metrologi.',
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
    title: 'Alat Bantu (Auxiliary Equipment)',
    standard: 'ISO/IEC 17025 Klausul 6.4 - Peralatan Pendukung',
    desc: 'Peralatan yang digunakan untuk mendukung kondisi pengujian, seperti pengatur suhu/kelembaban, power supply, atau meja getar.',
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
    title: 'Artefak Acuan (Reference Standards / Artifacts)',
    standard: 'ISO/IEC 17025 Klausul 6.5 - Ketertelusuran Metrologis',
    desc: 'Standar referensi dan material acuan bersertifikat (CRM) yang menjadi jangkar ketertelusuran hasil uji laboratorium.',
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
    title: 'Komponen Pendukung (Supporting Components)',
    standard: 'ISO/IEC 17025 Klausul 6.4 - Material Operasional',
    desc: 'Aksesoris, kabel RF berpresisi, konektor, attenuator, dan modul uji yang terhubung langsung dengan sistem pengujian.',
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

export default function CategoryManagement({ onNavigate }) {
  const [counts, setCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState(1);

  async function loadData() {
    setLoading(true);
    try {
      const res = await peralatanApi.getAll();
      const items = res.data || [];
      const tally = { 1: 0, 2: 0, 3: 0, 4: 0 };
      const categoryData = new Map();

      items.forEach((item) => {
        const kId = getEquipmentCategoryId(item);
        if (tally[kId] !== undefined) tally[kId]++;

        const category = item.kategori_peralatan;
        if (category?.id && (category.nama_kategori || category.description)) {
          categoryData.set(Number(category.id), {
            id: Number(category.id),
            ...(category.nama_kategori ? { label: category.nama_kategori } : {}),
            ...(category.description ? { desc: category.description } : {}),
          });
        }
      });

      setCategories(Array.from(categoryData.values()));
      setCounts(tally);
    } catch (err) {
      console.error('Gagal memuat data peralatan untuk kategori:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedCategory = categories.find((category) => category.id === selectedCat);
  const selectedMeta = selectedCategory ? (CATEGORY_META[selectedCategory.id] || CATEGORY_META[1]) : CATEGORY_META[1];
  const activeMeta = selectedMeta;
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="page-container fade-in-up">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="page-title">Klasifikasi Kategori Peralatan</h1>
            <span className="badge badge-blue">ISO/IEC 17025:2017</span>
          </div>
          <p className="page-subtitle">
            Standar klasifikasi, tata kelola metrologis, dan regulasi kepatuhan peralatan laboratorium uji
          </p>
        </div>
        <button
          className="btn btn-secondary btn-icon"
          onClick={loadData}
          id="btn-refresh-kategori"
          title="Segarkan data unit peralatan"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Grid 4 Kartu Kategori */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat.id] || CATEGORY_META[1];
          const Icon = meta.icon;
          const isSelected = selectedCat === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              style={{
                cursor: 'pointer',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--sp-4)',
                background: isSelected ? meta.bg : '#fff',
                border: `2px solid ${isSelected ? meta.color : 'var(--clr-dark-200)'}`,
                boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-md)',
                  background: meta.bg, border: `1px solid ${meta.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color,
                }}>
                  <Icon size={20} />
                </div>
                <span className="badge" style={{ background: '#fff', border: '1px solid var(--clr-dark-200)', fontWeight: 600 }}>
                  {loading ? '...' : `${counts[cat.id] || 0} unit`}
                </span>
              </div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--clr-dark-900)', margin: '0 0 4px' }}>
                {cat.label}
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', margin: 0, lineHeight: 1.4 }}>
                {cat.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Detail Spesifikasi Kategori Terpilih */}
      <div className="card" style={{ padding: 'var(--sp-6)', borderLeft: `5px solid ${activeMeta.color}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-lg)',
              background: activeMeta.bg, border: `1px solid ${activeMeta.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeMeta.color,
            }}>
              <ActiveIcon size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0, color: 'var(--clr-dark-900)' }}>
                {selectedCategory?.label || 'Kategori peralatan'}
              </h2>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', fontWeight: 500 }}>
                {activeMeta.standard}
              </span>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => onNavigate('/peralatan')}
            id="btn-lihat-peralatan-kat"
          >
            Lihat Inventaris Peralatan <ArrowRight size={15} />
          </button>
        </div>

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-dark-700)', lineHeight: 1.6, marginBottom: 'var(--sp-5)' }}>
          {selectedCategory?.desc || 'Deskripsi kategori belum tersedia.'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-5)' }}>
          {/* Kolom 1: Persyaratan Kepatuhan */}
          <div style={{ background: 'var(--clr-dark-50)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--sp-3)', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--clr-dark-800)' }}>
              <FileCheck size={16} style={{ color: activeMeta.color }} /> Persyaratan Kepatuhan ISO/IEC 17025
            </h3>
            <ul style={{ margin: 0, paddingLeft: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {activeMeta.requirements.map((req, idx) => (
                <li key={idx} style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-600)', lineHeight: 1.4 }}>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 2: Parameter Teknis Wajib */}
          <div style={{ background: 'var(--clr-dark-50)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '0 0 var(--sp-3)', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--clr-dark-800)' }}>
              <Layers size={16} style={{ color: activeMeta.color }} /> Parameter &amp; Atribut Data Khusus
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {activeMeta.specificFields.map((field, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', color: 'var(--clr-dark-700)' }}>
                  <CheckCircle2 size={13} style={{ color: 'var(--clr-green-600)', flexShrink: 0 }} />
                  <span>{field}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
