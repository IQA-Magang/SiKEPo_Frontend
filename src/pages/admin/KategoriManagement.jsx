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
  X
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

export default function KategoriManagement({ onNavigate }) {
  const [user, setUser] = useState(getStoredUser);
  const [categories, setCategories] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [modalError, setModalError] = useState('');

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

  // Load categories (defaults + localStorage)
  const loadCategories = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const custom = stored ? JSON.parse(stored) : [];
      setCategories([...DEFAULT_CATEGORIES, ...custom]);
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
      if (res?.data) {
        setEquipmentList(res.data);
      }
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
      const k = (eq.kategori_peralatan || '').toLowerCase();
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [equipmentList]);

  const handleCreateCategory = (e) => {
    e.preventDefault();
    setModalError('');

    const trimmedName = newCatName.trim();
    if (!trimmedName) {
      setModalError('Nama kelompok wajib diisi.');
      return;
    }

    const exists = categories.some(
      c => c.nama.toLowerCase() === trimmedName.toLowerCase() ||
           c.value.toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) {
      setModalError('Kelompok dengan nama tersebut sudah ada.');
      return;
    }

    const newCategory = {
      id: 'cat-custom-' + Date.now(),
      nama: trimmedName,
      value: trimmedName.toLowerCase().replace(/\s+/g, '_'),
      deskripsi: newCatDesc.trim() || 'Kelompok kustom ditambahkan oleh Admin.',
      isSystem: false,
      createdAt: new Date().toISOString()
    };

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const customList = stored ? JSON.parse(stored) : [];
      customList.push(newCategory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customList));

      loadCategories();
      setIsModalOpen(false);
      setNewCatName('');
      setNewCatDesc('');
      showToast(`Kelompok "${trimmedName}" berhasil disimpan secara lokal.`);
    } catch (err) {
      setModalError('Gagal menyimpan kategori: ' + err.message);
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
      alert('Gagal menghapus kategori: ' + err.message);
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
        {/* Toast */}
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
            <button className="btn-refresh" onClick={fetchData} title="Refresh data">
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              <span>Segarkan</span>
            </button>
            <button className="btn-hero-primary" onClick={() => setIsModalOpen(true)}>
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
                        {cat.isSystem ? (
                          <span style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>
                            Terkunci
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.nama)}
                            className="btn-icon"
                            style={{ color: '#DC2626', padding: '6px' }}
                            title="Hapus Kelompok Kustom"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Modal Tambah Kelompok */}
        {isModalOpen && (
          <div className="modal-backdrop">
            <div className="modal-card" style={{ maxWidth: '480px' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={20} style={{ color: 'var(--color-primary-red)' }} />
                  <h3 className="modal-title">Tambah Kelompok Peralatan</h3>
                </div>
                <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCategory}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {modalError && (
                    <div
                      style={{
                        background: '#FEE2E2',
                        color: '#991B1B',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <AlertCircle size={16} />
                      <span>{modalError}</span>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                      Nama Kelompok <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="eq-field-input"
                      placeholder="Contoh: Spektrum Analyzer / Alat Ukur Optik"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
                      Deskripsi Kelompok (Opsional)
                    </label>
                    <textarea
                      className="eq-field-input"
                      placeholder="Jelaskan fungsi atau jenis alat dalam kelompok ini..."
                      rows="3"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>

                  <div
                    style={{
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#92400E',
                      lineHeight: '1.5'
                    }}
                  >
                    <strong>Perhatian:</strong> Kelompok yang ditambahkan di sini disimpan pada konfigurasi frontend.
                    Untuk mengizinkan backend menerima kategori ini pada penambahan alat, minta tim backend untuk mendaftarkan nama ini pada enum validator.
                  </div>
                </div>

                <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn-primary">
                    Simpan Kelompok
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
