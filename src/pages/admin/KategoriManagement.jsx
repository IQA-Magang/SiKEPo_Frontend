import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  Plus,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Info,
  Server,
  Layers,
  Wrench,
  X,
  Pencil
} from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import Sidebar from '../../components/layout/Sidebar';
import { peralatanApi, getStoredUser } from '../../utils/api';

const DEFAULT_CATEGORIES = [
  {
    id: 'cat-1',
    nama: 'Peralatan Utama',
    value: 'peralatan',
    deskripsi: 'Alat ukur dan instrumen pengujian utama laboratorium.',
    isSystem: true
  },
  {
    id: 'cat-2',
    nama: 'Peralatan Bantu',
    value: 'Peralatan bantu',
    deskripsi: 'Peralatan pendukung operasional uji dan pengukuran.',
    isSystem: true
  },
  {
    id: 'cat-3',
    nama: 'Referensi Uji',
    value: 'referensi uji',
    deskripsi: 'Perangkat standar dan kalibrator acuan pengujian.',
    isSystem: true
  },
  {
    id: 'cat-4',
    nama: 'Golden Sample',
    value: 'golden sample',
    deskripsi: 'Sampel standar baku emas untuk verifikasi akurasi pengujian.',
    isSystem: true
  },
  {
    id: 'cat-5',
    nama: 'Komponen Pendukung',
    value: 'Komponen pendukung',
    deskripsi: 'Aksesoris, probe, kabel adaptor, dan komponen pelengkap.',
    isSystem: true
  }
];

const STORAGE_KEY = 'sikepo_custom_categories';
const EDITS_KEY = 'sikepo_category_edits';

export default function KategoriManagement({ onNavigate }) {
  const [user, setUser] = useState(getStoredUser);
  const [categories, setCategories] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState('');

  // Modal State ('create' | 'edit' | null)
  const [modalMode, setModalMode] = useState(null);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [formData, setFormData] = useState({ nama: '', deskripsi: '' });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    const current = getStoredUser();
    if (current) {
      setUser(current);
      if (current.role?.toLowerCase() !== 'admin') {
        onNavigate('/dashboard');
      }
    } else {
      onNavigate('/login');
    }

    const handleUserChanged = (e) => {
      if (e.detail) setUser(e.detail);
    };
    window.addEventListener('sikepo_user_changed', handleUserChanged);
    return () => window.removeEventListener('sikepo_user_changed', handleUserChanged);
  }, [onNavigate]);

  // Load categories (defaults + localStorage custom + localStorage edits)
  const loadCategories = () => {
    try {
      const storedCustom = localStorage.getItem(STORAGE_KEY);
      const custom = storedCustom ? JSON.parse(storedCustom) : [];
      const storedEdits = localStorage.getItem(EDITS_KEY);
      const edits = storedEdits ? JSON.parse(storedEdits) : {};

      const combined = [...DEFAULT_CATEGORIES, ...custom].map(c => {
        if (edits[c.id]) {
          return { ...c, ...edits[c.id] };
        }
        return c;
      });

      setCategories(combined);
    } catch (e) {
      console.warn('Gagal membaca custom categories:', e);
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      loadCategories();
      const res = await peralatanApi.getAll();
      if (Array.isArray(res?.data)) setEquipmentList(res.data);
    } catch (err) {
      console.warn('Error loading equipment for categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  // Equipment count per category
  const countPerCategory = useMemo(() => {
    const map = {};
    equipmentList.forEach(eq => {
      const catVal = typeof eq.kategori_peralatan === 'object'
        ? (eq.kategori_peralatan?.nama_kategori || '')
        : (eq.kategori_peralatan || '');
      const k = String(catVal).toLowerCase();
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [equipmentList]);

  // Modal Handlers
  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedCatId(null);
    setFormData({ nama: '', deskripsi: '' });
    setFormError('');
  };

  const handleOpenEdit = (cat) => {
    setModalMode('edit');
    setSelectedCatId(cat.id);
    setFormData({
      nama: cat.nama || '',
      deskripsi: cat.deskripsi || ''
    });
    setFormError('');
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedCatId(null);
    setFormData({ nama: '', deskripsi: '' });
    setFormError('');
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    const trimmedName = formData.nama.trim();
    const trimmedDesc = formData.deskripsi.trim();

    if (!trimmedName) {
      setFormError('Nama Kelompok wajib diisi');
      setFormSubmitting(false);
      return;
    }

    try {
      if (modalMode === 'create') {
        const exists = categories.some(
          c => c.nama.toLowerCase() === trimmedName.toLowerCase() ||
               c.value.toLowerCase() === trimmedName.toLowerCase()
        );
        if (exists) {
          throw new Error('Kelompok dengan nama tersebut sudah ada.');
        }

        const newCategory = {
          id: 'cat-custom-' + Date.now(),
          nama: trimmedName,
          value: trimmedName.toLowerCase().replace(/\s+/g, '_'),
          deskripsi: trimmedDesc || 'Kelompok kustom ditambahkan oleh Admin.',
          isSystem: false,
          createdAt: new Date().toISOString()
        };

        const stored = localStorage.getItem(STORAGE_KEY);
        const customList = stored ? JSON.parse(stored) : [];
        customList.push(newCategory);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customList));

        loadCategories();
        handleCloseModal();
        showToast(`Kelompok "${trimmedName}" berhasil ditambahkan.`);
      } else if (modalMode === 'edit') {
        const target = categories.find(c => c.id === selectedCatId);
        if (!target) throw new Error('Kelompok tidak ditemukan');

        if (target.isSystem) {
          const storedEdits = localStorage.getItem(EDITS_KEY);
          const edits = storedEdits ? JSON.parse(storedEdits) : {};
          edits[selectedCatId] = {
            nama: trimmedName,
            deskripsi: trimmedDesc
          };
          localStorage.setItem(EDITS_KEY, JSON.stringify(edits));
        } else {
          const stored = localStorage.getItem(STORAGE_KEY);
          let customList = stored ? JSON.parse(stored) : [];
          customList = customList.map(c => c.id === selectedCatId ? {
            ...c,
            nama: trimmedName,
            deskripsi: trimmedDesc
          } : c);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(customList));
        }

        loadCategories();
        handleCloseModal();
        showToast(`Kelompok "${trimmedName}" berhasil diperbarui.`);
      }
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan kelompok');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteCategory = (catId, catName) => {
    if (!confirm(`Hapus kelompok kustom "${catName}"?`)) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let customList = stored ? JSON.parse(stored) : [];
      customList = customList.filter(c => c.id !== catId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customList));

      loadCategories();
      showToast(`Kelompok "${catName}" berhasil dihapus.`);
    } catch (err) {
      alert('Gagal menghapus kelompok: ' + err.message);
    }
  };

  const filteredCategories = categories.filter(c => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return c.nama.toLowerCase().includes(q) || c.value.toLowerCase().includes(q) || c.deskripsi.toLowerCase().includes(q);
  });

  return (
    <div className="app-shell">
      <Topbar
        user={user}
        onNavigate={onNavigate}
        title="Kelompok Peralatan"
        onUpdateUser={(u) => setUser(u)}
      />
      <Sidebar activePath="/admin/kelompok-peralatan" onNavigate={onNavigate} />

      <main className="main-content">
        {/* Toast Notification */}
        {notice && (
          <div
            style={{
              position: 'fixed',
              top: '20px',
              right: '24px',
              zIndex: 9999,
              background: '#065F46',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 500,
              fontSize: '14px'
            }}
          >
            <CheckCircle size={18} />
            <span>{notice}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="eq-page-header">
          <div>
            <h1 className="eq-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Tag size={22} style={{ color: 'var(--color-primary-red)' }} />
              <span>Kelola Kelompok Peralatan</span>
            </h1>
            <p className="eq-page-sub">
              Struktur klasifikasi dan kelompok inventaris peralatan laboratorium Telkom Test House
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn-refresh" onClick={fetchData} title="Refresh data">
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              <span>Segarkan</span>
            </button>
            <button
              type="button"
              className="btn-hero-primary"
              onClick={(e) => {
                e.preventDefault();
                handleOpenCreate();
              }}
            >
              <Plus size={15} />
              <span>Tambah Kelompok</span>
            </button>
          </div>
        </div>

        {/* Info Alert: Status Backend Integration */}
        <div
          style={{
            background: 'rgba(217, 43, 43, 0.05)',
            border: '1px solid rgba(217, 43, 43, 0.25)',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}
        >
          <Server size={22} style={{ color: 'var(--color-primary-red)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
            <strong style={{ color: 'var(--color-text-primary)', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
              Catatan Arsitektur Sistem Backend:
            </strong>
            Saat ini backend Go memvalidasi kelompok peralatan melalui <strong>Enum Baku (5 Kelompok Sistem)</strong>:
            <code style={{ background: '#f1f1f1', padding: '2px 6px', borderRadius: '4px', margin: '0 4px', fontSize: '12px' }}>
              peralatan, Peralatan bantu, referensi uji, golden sample, Komponen pendukung
            </code>.
            Jika menambahkan kategori kustom baru, pastikan tim pengembang backend telah memperbarui tabel database dan validator di
            <code style={{ background: '#f1f1f1', padding: '2px 6px', borderRadius: '4px', margin: '0 4px', fontSize: '12px' }}>
              peralatan_controller.go
            </code>
            agar data peralatan baru tidak ditolak oleh server.
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(217,43,43,0.1)' }}>
              <Tag size={20} style={{ color: 'var(--color-primary-red)' }} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{categories.length}</div>
              <div className="stat-label">Total Kelompok Terdaftar</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <CheckCircle size={20} style={{ color: '#10b981' }} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{DEFAULT_CATEGORIES.length}</div>
              <div className="stat-label">Kelompok Baku Sistem (Backend)</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(59,130,246,0.1)' }}>
              <Layers size={20} style={{ color: '#3b82f6' }} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{categories.length - DEFAULT_CATEGORIES.length}</div>
              <div className="stat-label">Kelompok Kustom Baru</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <Wrench size={20} style={{ color: '#f59e0b' }} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{equipmentList.length}</div>
              <div className="stat-label">Total Alat Terklasifikasi</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Search size={18} style={{ color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Cari kelompok berdasarkan nama atau kata kunci..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '14px',
                background: 'transparent'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Categories Table / List */}
        <div className="panel recent-loans-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Kelompok</th>
                  <th>Nilai Sistem (Key API)</th>
                  <th>Deskripsi</th>
                  <th>Status Integrasi</th>
                  <th>Jumlah Peralatan</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
                      Tidak ada kelompok yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat, idx) => {
                    const eqCount = countPerCategory[cat.value.toLowerCase()] || 0;

                    return (
                      <tr key={cat.id || idx}>
                        <td style={{ fontWeight: 600, color: '#6B7280' }}>{idx + 1}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Tag size={16} style={{ color: cat.isSystem ? 'var(--color-primary-red)' : '#3b82f6' }} />
                            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{cat.nama}</span>
                          </div>
                        </td>
                        <td>
                          <code style={{ background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                            {cat.value}
                          </code>
                        </td>
                        <td style={{ color: '#4B5563', fontSize: '13px', maxWidth: '280px' }}>
                          {cat.deskripsi}
                        </td>
                        <td>
                          {cat.isSystem ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: '#ECFDF5',
                                color: '#065F46',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 600
                              }}
                            >
                              <CheckCircle size={13} />
                              Bawaan Backend
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: '#EFF6FF',
                                color: '#1D4ED8',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 600
                              }}
                            >
                              <Info size={13} />
                              Kustom (Lokal)
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              background: eqCount > 0 ? '#FEF2F2' : '#F3F4F6',
                              color: eqCount > 0 ? 'var(--color-primary-red)' : '#6B7280',
                              fontWeight: 600,
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}
                          >
                            {eqCount} Unit
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleOpenEdit(cat);
                              }}
                              className="eq-btn-action edit"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 10px',
                                fontSize: '12px',
                                fontWeight: 600,
                                borderRadius: '6px',
                                background: '#EFF6FF',
                                color: '#1D4ED8',
                                border: '1px solid #BFDBFE',
                                cursor: 'pointer'
                              }}
                              title="Edit Kelompok Peralatan"
                            >
                              <Pencil size={13} />
                              <span>Edit</span>
                            </button>
                            {!cat.isSystem && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDeleteCategory(cat.id, cat.nama);
                                }}
                                className="btn-icon"
                                style={{ color: '#DC2626', padding: '6px' }}
                                title="Hapus Kelompok Kustom"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL FORM CREATE / EDIT */}
      {modalMode && (
        <div className="profile-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div className="profile-modal" style={{
            background: '#FAFBFD',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            border: '1px solid #E5E7EB'
          }}>
            {/* Header Modal */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px 16px',
              borderBottom: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Tag size={22} style={{ color: 'var(--color-primary-red)' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#000', fontFamily: 'inherit' }}>
                  {modalMode === 'create' ? 'Tambah Kelompok Peralatan' : 'Edit Kelompok Peralatan'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                style={{
                  background: '#fff',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  padding: '4px 6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#374151'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div style={{ padding: '0 24px 20px' }}>
                {formError && (
                  <div
                    className="eq-confirm-banner"
                    style={{
                      background: '#FEF2F2',
                      borderColor: '#FECACA',
                      color: '#991B1B',
                      marginBottom: '16px',
                      padding: '10px 14px',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={15} color="#DC2626" />
                      <span style={{ fontSize: '13px' }}>{formError}</span>
                    </div>
                  </div>
                )}

                {/* Field 1: Nama Kelompok */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    Nama Kelompok <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '14px',
                      borderRadius: '10px',
                      border: '1px solid #D1D5DB',
                      background: '#fff',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Contoh: Komponen Pendukung"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                {/* Field 2: Deskripsi Kelompok (Opsional) */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                    Deskripsi Kelompok (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '14px',
                      borderRadius: '10px',
                      border: '1px solid #D1D5DB',
                      background: '#fff',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Contoh: Aksesoris, probe, kabel adaptor, dan komponen pelengkap."
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  />
                </div>
              </div>

              {/* Footer Modal: Buttons Batal & Simpan Perubahan / Simpan Kelompok */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  padding: '12px 24px 20px',
                  background: '#FAFBFD'
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={formSubmitting}
                  style={{
                    padding: '5px 14px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#000',
                    background: '#fff',
                    border: '1px solid #000',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{
                    padding: '5px 14px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#000',
                    background: '#fff',
                    border: '1px solid #000',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {formSubmitting
                    ? 'Menyimpan...'
                    : modalMode === 'create'
                    ? 'Simpan Kelompok'
                    : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
