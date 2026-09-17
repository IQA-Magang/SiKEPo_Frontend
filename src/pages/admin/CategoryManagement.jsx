import React, { useState, useEffect } from 'react';
import { Tags, ShieldCheck, Wrench, Compass, Box, CheckCircle2, ArrowRight, Edit3, Plus, X, Save } from 'lucide-react';
import { KATEGORI_OPTIONS, peralatanApi } from '../../utils/api.js';

const INITIAL_CATEGORY_DETAILS = {
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
  const [categories, setCategories] = useState(KATEGORI_OPTIONS);
  const [categoryDetails, setCategoryDetails] = useState(INITIAL_CATEGORY_DETAILS);
  const [counts, setCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState(1);

  // Modal States
  const [editModalCat, setEditModalCat] = useState(null);
  const [editForm, setEditForm] = useState({ label: '', desc: '', standard: '' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ label: '', desc: '', standard: '' });

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await peralatanApi.getAll();
        const items = res.data || [];
        const tally = {};
        categories.forEach(c => { tally[c.id] = 0; });
        items.forEach((item) => {
          const kId = Number(item.kategori_id);
          if (tally[kId] !== undefined) tally[kId]++;
        });
        setCounts(tally);
      } catch {
        // Offline / dev fallback
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [categories]);

  function handleOpenEdit(cat, e) {
    e.stopPropagation();
    const detail = categoryDetails[cat.id] || {};
    setEditModalCat(cat);
    setEditForm({
      label: cat.label,
      desc: cat.desc,
      standard: detail.standard || 'ISO/IEC 17025',
    });
  }

  function handleSaveEdit() {
    if (!editForm.label.trim()) return;
    setCategories(prev => prev.map(c => c.id === editModalCat.id ? { ...c, label: editForm.label, desc: editForm.desc } : c));
    setCategoryDetails(prev => ({
      ...prev,
      [editModalCat.id]: {
        ...(prev[editModalCat.id] || {}),
        title: `${editForm.label}`,
        standard: editForm.standard,
        desc: editForm.desc,
      }
    }));
    setEditModalCat(null);
  }

  function handleSaveAdd() {
    if (!addForm.label.trim()) return;
    const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    const newCat = { id: newId, label: addForm.label, desc: addForm.desc || 'Kategori tambahan' };
    setCategories(prev => [...prev, newCat]);
    setCategoryDetails(prev => ({
      ...prev,
      [newId]: {
        icon: Box,
        color: '#7C3AED',
        bg: '#F5F3FF',
        border: '#DDD6FE',
        title: addForm.label,
        standard: addForm.standard || 'ISO/IEC 17025',
        desc: addForm.desc,
        requirements: ['Pemeriksaan rutin & tata kelola aset terstandar'],
        specificFields: ['Keterangan Tambahan', 'Spesifikasi Khusus'],
      }
    }));
    setCounts(prev => ({ ...prev, [newId]: 0 }));
    setSelectedCat(newId);
    setIsAddModalOpen(false);
    setAddForm({ label: '', desc: '', standard: '' });
  }

  const activeDetail = categoryDetails[selectedCat] || {
    icon: Box,
    color: '#3B82F6',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    title: categories.find(c => c.id === selectedCat)?.label || 'Detail Kategori',
    standard: 'ISO/IEC 17025',
    desc: categories.find(c => c.id === selectedCat)?.desc || '-',
    requirements: ['Pemeriksaan berkala & pengujian terstandar'],
    specificFields: ['Interval Pemeriksaan', 'Spesifikasi Peralatan'],
  };
  const ActiveIcon = activeDetail.icon || Box;

  return (
    <div className="page-container fade-in-up">
      {/* Header & Button Tambah Kategori */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
        <div>
          <h1 className="page-title">Kelompok & Kategori Peralatan Lab</h1>
          <p className="page-subtitle">
            Klasifikasi standar ISO/IEC 17025 Telkom Test House untuk kepatuhan tata kelola peralatan
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)} id="btn-tambah-kategori">
          <Plus size={16} /> Tambah Kategori Baru
        </button>
      </div>

      {/* Grid Kategori Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 'var(--sp-4)',
          marginBottom: 'var(--sp-6)',
        }}
      >
        {categories.map((cat) => {
          const detail = categoryDetails[cat.id] || { icon: Box, color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' };
          const Icon = detail.icon || Box;
          const isSelected = selectedCat === cat.id;

          return (
            <div
              key={cat.id}
              className="card"
              onClick={() => setSelectedCat(cat.id)}
              style={{
                cursor: 'pointer',
                borderRadius: 'var(--radius-lg)',
                border: isSelected ? `2px solid ${detail.color}` : '1px solid var(--clr-dark-200)',
                background: isSelected ? detail.bg : 'var(--clr-surface)',
                transition: 'all 0.2s ease-in-out',
                transform: isSelected ? 'translateY(-3px)' : 'none',
                boxShadow: isSelected ? '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)' : '0 2px 5px rgba(0,0,0,0.03)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 'var(--sp-5)',
              }}
              id={`cat-card-${cat.id}`}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-3)' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-md)',
                      background: detail.bg,
                      border: `1px solid ${detail.border}`,
                      color: detail.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    }}
                  >
                    <Icon size={22} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--fw-bold)',
                        color: detail.color,
                        background: '#ffffff',
                        padding: '3px 9px',
                        borderRadius: 'var(--radius-full)',
                        border: `1px solid ${detail.border}`,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      }}
                    >
                      Kat #{cat.id}
                    </span>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={(e) => handleOpenEdit(cat, e)}
                      title="Edit Card Kategori"
                      style={{ color: 'var(--clr-dark-500)', padding: 4 }}
                    >
                      <Edit3 size={15} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-1)', color: 'var(--clr-dark-900)' }}>
                  {cat.label}
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', lineHeight: '1.5', marginBottom: 'var(--sp-4)', minHeight: 40 }}>
                  {cat.desc}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 'var(--sp-3)',
                  borderTop: '1px solid var(--clr-dark-100)',
                  marginTop: 'auto',
                }}
              >
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', fontWeight: 'var(--fw-medium)' }}>
                  Aset terdaftar:
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--fw-bold)',
                    color: detail.color,
                    backgroundColor: isSelected ? '#ffffff' : detail.bg,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${detail.border}`,
                  }}
                >
                  {loading ? '...' : `${counts[cat.id] || 0} unit`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Spesifikasi Kategori Terpilih */}
      <div className="card" style={{ padding: 'var(--sp-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
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
              {(activeDetail.requirements || []).map((req, idx) => (
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
              {(activeDetail.specificFields || []).map((field, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 'var(--text-xs)', color: 'var(--clr-dark-700)' }}>
                  <ArrowRight size={13} style={{ color: 'var(--clr-dark-400)', flexShrink: 0 }} />
                  <span>{field}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ---- MODAL EDIT CARD KATEGORI ---- */}
      {editModalCat && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: 440, maxWidth: '90%', padding: 'var(--sp-6)', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-bold)' }}>Edit Card Kategori #{editModalCat.id}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditModalCat(null)}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="form-group">
                <label className="form-label">Nama Kategori</label>
                <input className="form-input" value={editForm.label} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Standar Rujukan</label>
                <input className="form-input" value={editForm.standard} onChange={(e) => setEditForm({ ...editForm, standard: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi Ringkas</label>
                <textarea className="form-textarea" value={editForm.desc} onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })} style={{ minHeight: 80 }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)', marginTop: 'var(--sp-6)' }}>
              <button className="btn btn-secondary" onClick={() => setEditModalCat(null)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSaveEdit}><Save size={16} /> Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- MODAL TAMBAH KATEGORI BARU ---- */}
      {isAddModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: 460, maxWidth: '90%', padding: 'var(--sp-6)', background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-bold)' }}>Tambah Kategori Peralatan Baru</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setIsAddModalOpen(false)}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="form-group">
                <label className="form-label">Nama Kategori Peralatan <span className="required">*</span></label>
                <input className="form-input" placeholder="Misal: Alat Pengujian RF / Sensor Lingkungan" value={addForm.label} onChange={(e) => setAddForm({ ...addForm, label: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Standar Rujukan</label>
                <input className="form-input" placeholder="ISO/IEC 17025 Klausul 6.4..." value={addForm.standard} onChange={(e) => setAddForm({ ...addForm, standard: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Deskripsi Ringkas</label>
                <textarea className="form-textarea" placeholder="Jelaskan peruntukan dan kriteria instrumen dalam kategori ini..." value={addForm.desc} onChange={(e) => setAddForm({ ...addForm, desc: e.target.value })} style={{ minHeight: 80 }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-3)', marginTop: 'var(--sp-6)' }}>
              <button className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSaveAdd}><Plus size={16} /> Tambah Kategori</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

