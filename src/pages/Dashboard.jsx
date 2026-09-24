import React, { useState, useEffect } from 'react';
import { Package, Building2, DoorOpen, Users, FolderKanban, Plus, ArrowRight, Bell, RefreshCw, QrCode } from 'lucide-react';
import QRScannerModal from '../components/QRScannerModal.jsx';
import { getCurrentUser, usersApi, labsApi, ruanganApi, kelompokAssetApi, peralatanApi, notificationApi, STATUS_BADGE_CLASS } from '../utils/api.js';

// ------------------------------------------------------------------
// Dashboard: tampilan berbeda berdasarkan role
// ------------------------------------------------------------------
export default function Dashboard({ onNavigate }) {
  const user = getCurrentUser();
  const role = user?.role || 'staff';

  return (
    <div className="page-container fade-in-up">
      {role === 'admin'   && <AdminDashboard onNavigate={onNavigate} user={user} />}
      {role === 'manager' && <ManagerDashboard onNavigate={onNavigate} user={user} />}
      {role === 'staff'   && <StaffDashboard onNavigate={onNavigate} user={user} />}
    </div>
  );
}

// ------------------------------------------------------------------
// Admin Dashboard
// ------------------------------------------------------------------
function AdminDashboard({ onNavigate, user }) {
  const [stats, setStats] = useState({
    users: 0,
    labs: 0,
    ruangan: 0,
    peralatan: 0,
    alatRusak: 0,
    alatAktif: 0,
    alatKalibrasi: 0,
    alatDipinjam: 0,
    kelompokAset: 0,
  });
  const [latestPeralatan, setLatestPeralatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isQrOpen, setIsQrOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [u, l, r, p, k] = await Promise.allSettled([
        usersApi.getAll(),
        labsApi.getAll(),
        ruanganApi.getAll(),
        peralatanApi.getAll(),
        kelompokAssetApi.getAll(),
      ]);

      const pList = p.status === 'fulfilled' ? (p.value.data || []) : [];
      const rusakCount = pList.filter(item => item.status_alat === 'Rusak').length;
      const aktifCount = pList.filter(item => item.status_alat === 'Aktif').length;
      const kalibrasiCount = pList.filter(item => item.status_alat === 'Dalam Kalibrasi').length;
      const dipinjamCount = pList.filter(item => item.status_alat === 'Dipinjam').length;

      setStats({
        users: u.status === 'fulfilled' ? (u.value.data?.length ?? 0) : 0,
        labs: l.status === 'fulfilled' ? (l.value.data?.length ?? 0) : 0,
        ruangan: r.status === 'fulfilled' ? (r.value.data?.length ?? 0) : 0,
        peralatan: pList.length,
        alatRusak: rusakCount,
        alatAktif: aktifCount,
        alatKalibrasi: kalibrasiCount,
        alatDipinjam: dipinjamCount,
        kelompokAset: k.status === 'fulfilled' ? (k.value.data?.length ?? 0) : 0,
      });
      setLatestPeralatan(pList.slice(0, 6));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      {/* Level 1: Page Header */}
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-title-row">
            <h1 className="page-title">Dashboard Administrator</h1>
            <span className="live-tag">Live Data</span>
          </div>
          <p className="page-subtitle">
            Ringkasan inventaris peralatan, personel, dan monitoring peminjaman laboratorium Telkom Test House
          </p>
        </div>
        <div className="dash-header-actions">
          <button className="btn-pill-secondary" onClick={load} id="btn-refresh-dashboard">
            <RefreshCw size={15} /> Segarkan
          </button>
          <button className="btn-pill-primary" onClick={() => onNavigate('/peralatan/tambah')} id="btn-tambah-peralatan">
            <Plus size={16} /> Tambah Peralatan
          </button>
        </div>
      </div>

      {/* Level 1: 4 KPI Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-clickable black" onClick={() => onNavigate('/peralatan')}>
          <div>
            <div className="stat-header">
              <span className="stat-badge">Inventaris</span>
              <div className="stat-icon-wrapper"><Package size={20} /></div>
            </div>
            <span className="stat-value">{loading ? '...' : `${stats.peralatan} Unit`}</span>
            <span className="stat-title">Total Peralatan Terdaftar</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Lihat detail kelola aset &rarr;</span>
          </div>
        </div>

        <div className="stat-card stat-card-clickable red" onClick={() => onNavigate('/admin/users')}>
          <div>
            <div className="stat-header">
              <span className="stat-badge">Pengguna</span>
              <div className="stat-icon-wrapper"><Users size={20} /></div>
            </div>
            <span className="stat-value">{loading ? '...' : `${stats.users} Personel`}</span>
            <span className="stat-title">Total Pengguna Sistem</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Kelola hak akses &amp; PIC &rarr;</span>
          </div>
        </div>

        <div className="stat-card stat-card-clickable gray" onClick={() => onNavigate('/peralatan')}>
          <div>
            <div className="stat-header">
              <span className="stat-badge">Alat Rusak</span>
              <div className="stat-icon-wrapper"><Building2 size={20} /></div>
            </div>
            <span className="stat-value">{loading ? '...' : `${stats.alatRusak} Unit`}</span>
            <span className="stat-title">Total Alat Tidak Layak Pakai</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Kondisi perbaikan &amp; kalibrasi &rarr;</span>
          </div>
        </div>

        <div className="stat-card stat-card-clickable darkgray" onClick={() => onNavigate('/admin/labs')}>
          <div>
            <div className="stat-header">
              <span className="stat-badge">Laboratorium</span>
              <div className="stat-icon-wrapper"><DoorOpen size={20} /></div>
            </div>
            <span className="stat-value">{loading ? '...' : `${stats.labs} Lab`}</span>
            <span className="stat-title">Laboratorium Pengujian</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Ruang uji ISO/IEC 17025 &rarr;</span>
          </div>
        </div>
      </div>

      {/* QR Scanner Card */}
      <div
        className="card card-padded"
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-4)' }}
        onClick={() => setIsQrOpen(true)}
        id="card-scan-qr"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, var(--clr-primary-600), var(--clr-primary-500))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
            }}
          >
            <QrCode size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--text-sm)', color: 'var(--clr-dark-900)' }}>
              Scan QR Code Peralatan
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', marginTop: 2 }}>
              Pindai kode QR untuk langsung membuka detail peralatan
            </div>
          </div>
        </div>
        <div
          style={{
            padding: '6px 16px',
            background: 'var(--clr-primary-600)',
            color: '#fff',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--fw-semibold)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Buka Scanner
        </div>
      </div>

      {/* Level 2: 2 Panel Detail (Distribusi Status & Aksi Cepat Master Data) */}
      <div className="dash-level2-grid">
        {/* Panel A: Distribusi Status Peralatan */}
        <div className="card card-padded">
          <h2 className="card-title dash-section-title">Distribusi Status Peralatan</h2>
          <div className="dash-category-list">
            <div className="dash-cat-item">
              <div className="dash-cat-header">
                <span>Aktif / Layak Pakai</span>
                <strong>{stats.alatAktif} Unit ({stats.peralatan ? Math.round((stats.alatAktif / stats.peralatan) * 100) : 0}%)</strong>
              </div>
              <div className="dash-cat-bar">
                <div
                  className="dash-cat-progress"
                  style={{
                    width: `${stats.peralatan ? (stats.alatAktif / stats.peralatan) * 100 : 0}%`,
                    background: '#22C55E',
                  }}
                />
              </div>
            </div>

            <div className="dash-cat-item">
              <div className="dash-cat-header">
                <span>Dalam Kalibrasi</span>
                <strong>{stats.alatKalibrasi} Unit ({stats.peralatan ? Math.round((stats.alatKalibrasi / stats.peralatan) * 100) : 0}%)</strong>
              </div>
              <div className="dash-cat-bar">
                <div
                  className="dash-cat-progress"
                  style={{
                    width: `${stats.peralatan ? (stats.alatKalibrasi / stats.peralatan) * 100 : 0}%`,
                    background: '#3B82F6',
                  }}
                />
              </div>
            </div>

            <div className="dash-cat-item">
              <div className="dash-cat-header">
                <span>Dipinjam / Digunakan</span>
                <strong>{stats.alatDipinjam} Unit ({stats.peralatan ? Math.round((stats.alatDipinjam / stats.peralatan) * 100) : 0}%)</strong>
              </div>
              <div className="dash-cat-bar">
                <div
                  className="dash-cat-progress"
                  style={{
                    width: `${stats.peralatan ? (stats.alatDipinjam / stats.peralatan) * 100 : 0}%`,
                    background: '#F59E0B',
                  }}
                />
              </div>
            </div>

            <div className="dash-cat-item">
              <div className="dash-cat-header">
                <span>Rusak / Perlu Penanganan</span>
                <strong>{stats.alatRusak} Unit ({stats.peralatan ? Math.round((stats.alatRusak / stats.peralatan) * 100) : 0}%)</strong>
              </div>
              <div className="dash-cat-bar">
                <div
                  className="dash-cat-progress"
                  style={{
                    width: `${stats.peralatan ? (stats.alatRusak / stats.peralatan) * 100 : 0}%`,
                    background: '#EF4444',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panel B: Aksi Cepat Master Data */}
        <div className="card card-padded">
          <h2 className="card-title dash-section-title">Aksi Cepat Master Data</h2>
          <div className="dash-action-group">
            <button className="btn btn-secondary" onClick={() => onNavigate('/admin/labs')} id="btn-kelola-lab">
              <Building2 size={16} /> Kelola Laboratorium
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('/admin/ruangan')} id="btn-kelola-ruangan">
              <DoorOpen size={16} /> Kelola Ruangan
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('/admin/kelompok-aset')} id="btn-kelola-kelompok">
              <FolderKanban size={16} /> Kelola Kelompok Aset
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('/admin/users')} id="btn-kelola-user">
              <Users size={16} /> Kelola Pengguna
            </button>
          </div>
        </div>
      </div>

      {/* Level 3: Tabel Peralatan Terbaru */}
      <div className="card card-padded">
        <div className="dash-card-header-row">
          <div>
            <h2 className="card-title">Inventaris Peralatan Terbaru</h2>
            <p className="page-subtitle">Daftar peralatan yang baru didaftarkan ke sistem SiKEPo</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/peralatan')} id="btn-admin-lihat-semua">
            Lihat Seluruh Peralatan <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : latestPeralatan.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={28} /></div>
            <p className="empty-state-title">Belum ada peralatan terdaftar</p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>No. Aset</th>
                  <th>Nama Peralatan</th>
                  <th>Kategori / Kelompok</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {latestPeralatan.map((p) => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => onNavigate(`/peralatan/detail/${p.id}`)}>
                    <td><code style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-600)', fontWeight: 600 }}>{p.nomor_aset}</code></td>
                    <td style={{ fontWeight: 'var(--fw-semibold)' }}>{p.nama_peralatan}</td>
                    <td><span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)' }}>{p.kategori || p.kelompok_aset?.nama || '-'}</span></td>
                    <td><StatusBadge status={p.status_alat} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <QRScannerModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        onNavigate={onNavigate}
      />
    </>
  );
}

// ------------------------------------------------------------------
// Manager Dashboard
// ------------------------------------------------------------------
function ManagerDashboard({ onNavigate, user }) {
  const [peralatan, setPeralatan] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [n, p] = await Promise.allSettled([
          notificationApi.getByUserId(user?.user_id),
          peralatanApi.getAll(),
        ]);
        if (n.status === 'fulfilled') setNotifications(n.value.data || []);
        if (p.status === 'fulfilled') setPeralatan(p.value.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.user_id]);

  const unread = notifications.filter((n) => !n.is_read);
  const aktif = peralatan.filter((p) => p.status_alat === 'Aktif').length;
  const rusak = peralatan.filter((p) => p.status_alat === 'Rusak').length;
  const kalibrasi = peralatan.filter((p) => p.status_alat === 'Dalam Kalibrasi').length;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard Manager Lab</h1>
        <p className="page-subtitle">Selamat datang, <strong>{user?.name}</strong>. Pantau kondisi peralatan di laboratorium Anda.</p>
      </div>

      <div className="stats-grid dash-stats-mb">
        <div className="stat-card accent-red">
          <div className="stat-icon red"><Package size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton skeleton-stat" /> : peralatan.length}</div>
          <div className="stat-label">Total Peralatan</div>
        </div>
        <div className="stat-card accent-green">
          <div className="stat-icon green"><Package size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton skeleton-stat" /> : aktif}</div>
          <div className="stat-label">Peralatan Aktif</div>
        </div>
        <div className="stat-card accent-blue">
          <div className="stat-icon blue"><RefreshCw size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton skeleton-stat" /> : kalibrasi}</div>
          <div className="stat-label">Dalam Kalibrasi</div>
        </div>
        <div className="stat-card accent-amber">
          <div className="stat-icon amber"><Bell size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton skeleton-stat" /> : unread.length}</div>
          <div className="stat-label">Notifikasi Baru</div>
        </div>
      </div>

      {/* Notifikasi terbaru */}
      {!loading && unread.length > 0 && (
        <div className="card dash-card-mb">
          <div className="card-header">
            <h2 className="card-title">Notifikasi Peralatan Baru</h2>
            <span className="badge badge-red">{unread.length} belum dibaca</span>
          </div>
          <div className="notif-list-container">
            {unread.slice(0, 5).map((n) => (
              <div key={n.id} className="notif-item unread">
                <div className="notif-icon"><Package size={16} /></div>
                <div className="notif-content">
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-msg">{n.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card card-padded">
        <div className="dash-card-header-row">
          <h2 className="card-title">Inventaris Peralatan</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/peralatan')} id="btn-lihat-semua-peralatan">
            Lihat Semua <ArrowRight size={14} />
          </button>
        </div>
        {loading ? (
          <div className="skeleton-list">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        ) : peralatan.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={28} /></div>
            <p className="empty-state-title">Belum ada peralatan</p>
          </div>
        ) : (
          <div className="table-wrapper table-borderless">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Peralatan</th>
                  <th>No. Aset</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {peralatan.slice(0, 8).map((p) => (
                  <tr key={p.id} className="cursor-pointer" onClick={() => onNavigate(`/peralatan/detail/${p.id}`)}>
                    <td style={{ fontWeight: 'var(--fw-medium)' }}>{p.nama_peralatan}</td>
                    <td><code className="text-mono-xs">{p.nomor_aset}</code></td>
                    <td><StatusBadge status={p.status_alat} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ------------------------------------------------------------------
// Staff Dashboard
// ------------------------------------------------------------------
function StaffDashboard({ onNavigate, user }) {
  const [peralatan, setPeralatan] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await peralatanApi.getAll();
        setPeralatan(res.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard Staff Lab</h1>
        <p className="page-subtitle">Selamat datang, <strong>{user?.name}</strong>.</p>
      </div>

      <div className="stats-grid dash-stats-mb">
        <div className="stat-card accent-red">
          <div className="stat-icon red"><Package size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton skeleton-stat" /> : peralatan.length}</div>
          <div className="stat-label">Total Peralatan</div>
        </div>
        <div className="stat-card accent-green">
          <div className="stat-icon green"><Package size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton skeleton-stat" /> : peralatan.filter(p => p.status_alat === 'Aktif').length}</div>
          <div className="stat-label">Peralatan Aktif</div>
        </div>
      </div>

      <div className="dash-action-group dash-actions-mb">
        <button className="btn btn-primary" onClick={() => onNavigate('/peralatan/tambah')} id="btn-tambah-peralatan-staff">
          <Plus size={16} /> Tambah Peralatan Baru
        </button>
        <button className="btn btn-secondary" onClick={() => onNavigate('/peralatan')} id="btn-inventaris">
          <Package size={16} /> Lihat Inventaris
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Peralatan Terbaru</h2>
        </div>
        {loading ? (
          <div className="skeleton-list">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        ) : peralatan.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={28} /></div>
            <p className="empty-state-title">Belum ada peralatan terdaftar</p>
          </div>
        ) : (
          <div className="table-wrapper table-borderless">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Peralatan</th>
                  <th>No. Aset</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {peralatan.slice(0, 10).map((p) => (
                  <tr key={p.id} className="cursor-pointer" onClick={() => onNavigate(`/peralatan/detail/${p.id}`)}>
                    <td style={{ fontWeight: 'var(--fw-medium)' }}>{p.nama_peralatan}</td>
                    <td><code className="text-mono-xs">{p.nomor_aset}</code></td>
                    <td><StatusBadge status={p.status_alat} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ------------------------------------------------------------------
// Status Badge helper
// ------------------------------------------------------------------
function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_BADGE_CLASS[status] || 'badge-gray'}`}>
      <span className="badge-dot" />
      {status || 'Tidak diketahui'}
    </span>
  );
}
