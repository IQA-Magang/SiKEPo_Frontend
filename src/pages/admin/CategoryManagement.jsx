import React, { useState, useEffect } from 'react';
import { Tags, ShieldCheck, Wrench, Compass, Box, CheckCircle2, ArrowRight, Package } from 'lucide-react';
import { KATEGORI_OPTIONS, peralatanApi } from '../../utils/api.js';

const CATEGORY_DETAILS = {
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
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState(1);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await peralatanApi.getAll();
        const items = res.data || [];
        const tally = { 1: 0, 2: 0, 3: 0, 4: 0 };
        items.forEach((item) => {
          const kId = Number(item.kategori_id);
          if (tally[kId] !== undefined) tally[kId]++;
        });
        setCounts(tally);
      } catch {
        // Abaikan jika offline / dev
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const activeDetail = CATEGORY_DETAILS[selectedCat];
  const ActiveIcon = activeDetail.icon;

  return (
    <div className="page-container fade-in-up">
      <div className="page-header">
        <h1 className="page-title">Kategori Peralatan Lab</h1>
        <p className="page-subtitle">
          Klasifikasi standar ISO/IEC 17025 Telkom Test House untuk kepatuhan tata kelola peralatan
        </p>
      </div>

      {/* Grid 4 Kategori Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--sp-4)',
          marginBottom: 'var(--sp-6)',
        }}
      >
        {KATEGORI_OPTIONS.map((cat) => {
          const detail = CATEGORY_DETAILS[cat.id];
          const Icon = detail.icon;
          const isSelected = selectedCat === cat.id;

          return (
            <div
              key={cat.id}
              className="card"
              onClick={() => setSelectedCat(cat.id)}
              style={{
                cursor: 'pointer',
                border: isSelected ? `2px solid ${detail.color}` : '1px solid var(--clr-dark-200)',
                background: isSelected ? detail.bg : 'var(--clr-surface)',
                transition: 'all var(--dur-normal)',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
              }}
              id={`cat-card-${cat.id}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-3)' }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-md)',
                    background: detail.bg,
                    border: `1px solid ${detail.border}`,
                    color: detail.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} />
                </div>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--fw-bold)',
                    color: detail.color,
                    background: '#fff',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    border: `1px solid ${detail.border}`,
                  }}
                >
                  Kategori {cat.id}
                </span>
              </div>

              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-1)' }}>
                {cat.label}
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', lineHeight: 'var(--lh-normal)', marginBottom: 'var(--sp-4)' }}>
                {cat.desc}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 'var(--sp-3)',
                  borderTop: '1px solid var(--clr-dark-100)',
                }}
              >
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)' }}>
                  Aset terdaftar:
                </span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: detail.color }}>
                  {loading ? '...' : `${counts[cat.id]} unit`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Spesifikasi Kategori Terpilih */}
      <div className="card" style={{ padding: 'var(--sp-6)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-lg)',
                background: activeDetail.bg,
                color: activeDetail.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActiveIcon size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-bold)', color: 'var(--clr-dark-900)' }}>
                {activeDetail.title}
              </h2>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-primary-700)', fontWeight: 'var(--fw-semibold)' }}>
                {activeDetail.standard}
              </span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => onNavigate('/peralatan')}
            id="btn-lihat-peralatan-kat"
          >
            <Package size={16} /> Lihat Aset Kategori Ini
          </button>
        </div>

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-dark-600)', lineHeight: 'var(--lh-relaxed)', marginBottom: 'var(--sp-6)' }}>
          {activeDetail.desc}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-6)' }}>
          {/* Persyaratan Kepatuhan */}
          <div style={{ background: 'var(--clr-dark-50)', padding: 'var(--sp-5)', borderRadius: 'var(--radius-lg)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)', color: 'var(--clr-dark-900)' }}>
              Standar & Ketentuan ISO/IEC 17025
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {activeDetail.requirements.map((req, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-2)', fontSize: 'var(--text-xs)', color: 'var(--clr-dark-700)' }}>
                  <CheckCircle2 size={14} style={{ color: activeDetail.color, flexShrink: 0, marginTop: 2 }} />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Form & Atribut Spesifik SiKEPo */}
          <div style={{ background: 'var(--clr-dark-50)', padding: 'var(--sp-5)', borderRadius: 'var(--radius-lg)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)', color: 'var(--clr-dark-900)' }}>
              Atribut Form Khusus di SiKEPo
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {activeDetail.specificFields.map((field, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 'var(--text-xs)', color: 'var(--clr-dark-700)' }}>
                  <ArrowRight size={13} style={{ color: 'var(--clr-dark-400)', flexShrink: 0 }} />
                  <span>{field}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
