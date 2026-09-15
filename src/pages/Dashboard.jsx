import React, { useState, useEffect } from 'react';
import { Package, Building2, DoorOpen, Users, FolderKanban, Plus, ArrowRight, Bell, RefreshCw } from 'lucide-react';
import { getCurrentUser, usersApi, labsApi, ruanganApi, kelompokAssetApi, peralatanApi, notificationApi } from '../utils/api.js';

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
    kelompokAset: 0,
  });
  const [loading, setLoading] = useState(true);

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

      setStats({
        users: u.status === 'fulfilled' ? (u.value.data?.length ?? 0) : 0,
        labs: l.status === 'fulfilled' ? (l.value.data?.length ?? 0) : 0,
        ruangan: r.status === 'fulfilled' ? (r.value.data?.length ?? 0) : 0,
        peralatan: pList.length,
        alatRusak: rusakCount,
        kelompokAset: k.status === 'fulfilled' ? (k.value.data?.length ?? 0) : 0,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      {/* Header matching Screenshot 4 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111111', margin: 0, letterSpacing: '-0.4px' }}>
              Dashboard Administrator
            </h1>
            <span className="live-tag">Live Data</span>
          </div>
          <p style={{ fontSize: '13.5px', color: '#6B7280', margin: 0 }}>
            Ringkasan inventaris peralatan, personel, dan monitoring peminjaman laboratorium Telkom Test House
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-pill-secondary" onClick={load} id="btn-refresh-dashboard">
            <RefreshCw size={15} /> Segarkan
          </button>
          <button className="btn-pill-primary" onClick={() => onNavigate('/peralatan/tambah')} id="btn-tambah-peralatan">
            <Plus size={16} /> Tambah Peralatan
          </button>
        </div>
      </div>

      {/* Stat cards matching Screenshot 4 */}
      <div className="stats-grid">
        {/* Card 1: Inventaris */}
        <div className="stat-card black" onClick={() => onNavigate('/peralatan')} style={{ cursor: 'pointer' }}>
          <div>
            <div className="stat-header">
              <span className="stat-badge">Inventaris</span>
              <div className="stat-icon-wrapper">
                <Package size={20} />
              </div>
            </div>
            <span className="stat-value">{loading ? '...' : `${stats.peralatan} Unit`}</span>
            <span className="stat-title">Total Peralatan Terdaftar</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Lihat detail kelola aset &rarr;</span>
          </div>
        </div>

        {/* Card 2: Pengguna */}
        <div className="stat-card red" onClick={() => onNavigate('/admin/users')} style={{ cursor: 'pointer' }}>
          <div>
            <div className="stat-header">
              <span className="stat-badge">Pengguna</span>
              <div className="stat-icon-wrapper">
                <Users size={20} />
              </div>
            </div>
            <span className="stat-value">{loading ? '...' : `${stats.users} Personel`}</span>
            <span className="stat-title">Total Pengguna Sistem</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Kelola hak akses & PIC &rarr;</span>
          </div>
        </div>

        {/* Card 3: Alat Rusak */}
        <div className="stat-card gray" onClick={() => onNavigate('/peralatan')} style={{ cursor: 'pointer' }}>
          <div>
            <div className="stat-header">
              <span className="stat-badge">Alat Rusak</span>
              <div className="stat-icon-wrapper">
                <Building2 size={20} />
              </div>
            </div>
            <span className="stat-value">{loading ? '...' : `${stats.alatRusak} Unit`}</span>
            <span className="stat-title">Total Alat Tidak Layak Pakai</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Kondisi perbaikan & kalibrasi &rarr;</span>
          </div>
        </div>

        {/* Card 4: Laboratorium */}
        <div className="stat-card darkgray" onClick={() => onNavigate('/admin/labs')} style={{ cursor: 'pointer' }}>
          <div>
            <div className="stat-header">
              <span className="stat-badge">Laboratorium</span>
              <div className="stat-icon-wrapper">
                <DoorOpen size={20} />
              </div>
            </div>
            <span className="stat-value">{loading ? '...' : `${stats.labs} Lab`}</span>
            <span className="stat-title">Laboratorium Pengujian</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Ruang uji ISO/IEC 17025 &rarr;</span>
          </div>
        </div>
      </div>

      {/* Quick actions panel */}
      <div className="card card-padded" style={{ marginBottom: 'var(--sp-5)' }}>
        <h2 className="card-title" style={{ marginBottom: 'var(--sp-4)' }}>Aksi Cepat Master Data</h2>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
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
        const [p, n] = await Promise.allSettled([
          peralatanApi.getAll(),
          notificationApi.getByUserId(user?.user_id),
        ]);
        if (p.status === 'fulfilled') setPeralatan(p.value.data || []);
        if (n.status === 'fulfilled') setNotifications(n.value.data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

      <div className="stat-grid" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="stat-card accent-red">
          <div className={`stat-icon red`}><Package size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton" style={{ height: 32, width: 60 }} /> : peralatan.length}</div>
          <div className="stat-label">Total Peralatan</div>
        </div>
        <div className="stat-card accent-green">
          <div className={`stat-icon green`}><Package size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton" style={{ height: 32, width: 60 }} /> : aktif}</div>
          <div className="stat-label">Peralatan Aktif</div>
        </div>
        <div className="stat-card accent-blue">
          <div className={`stat-icon blue`}><RefreshCw size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton" style={{ height: 32, width: 60 }} /> : kalibrasi}</div>
          <div className="stat-label">Dalam Kalibrasi</div>
        </div>
        <div className="stat-card accent-amber">
          <div className={`stat-icon amber`}><Bell size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton" style={{ height: 32, width: 60 }} /> : unread.length}</div>
          <div className="stat-label">Notifikasi Baru</div>
        </div>
      </div>

      {/* Notifikasi terbaru */}
      {!loading && unread.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--sp-5)' }}>
          <div className="card-header">
            <h2 className="card-title">Notifikasi Peralatan Baru</h2>
            <span className="badge badge-red">{unread.length} belum dibaca</span>
          </div>
          <div style={{ padding: 'var(--sp-2)' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
          <h2 className="card-title">Inventaris Peralatan</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/peralatan')} id="btn-lihat-semua-peralatan">
            Lihat Semua <ArrowRight size={14} />
          </button>
        </div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 48 }} />)}
          </div>
        ) : peralatan.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={28} /></div>
            <p className="empty-state-title">Belum ada peralatan</p>
          </div>
        ) : (
          <div className="table-wrapper">
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
                  <tr key={p.id}>
                    <td style={{ fontWeight: 'var(--fw-medium)' }}>{p.nama_peralatan}</td>
                    <td><code style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)' }}>{p.nomor_aset}</code></td>
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
    peralatanApi.getAll()
      .then((res) => setPeralatan(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard Staff Lab</h1>
        <p className="page-subtitle">Selamat datang, <strong>{user?.name}</strong>.</p>
      </div>

      <div className="stat-grid" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="stat-card accent-red">
          <div className="stat-icon red"><Package size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton" style={{ height: 32, width: 60 }} /> : peralatan.length}</div>
          <div className="stat-label">Total Peralatan</div>
        </div>
        <div className="stat-card accent-green">
          <div className="stat-icon green"><Package size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton" style={{ height: 32, width: 60 }} /> : peralatan.filter(p => p.status_alat === 'Aktif').length}</div>
          <div className="stat-label">Peralatan Aktif</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)', flexWrap: 'wrap' }}>
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
          <div style={{ padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : peralatan.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={28} /></div>
            <p className="empty-state-title">Belum ada peralatan terdaftar</p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
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
                  <tr key={p.id}>
                    <td style={{ fontWeight: 'var(--fw-medium)' }}>{p.nama_peralatan}</td>
                    <td><code style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)' }}>{p.nomor_aset}</code></td>
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
  const map = {
    'Aktif':           'badge-aktif',
    'Dipinjam':        'badge-dipinjam',
    'Dalam Kalibrasi': 'badge-kalibrasi',
    'Rusak':           'badge-rusak',
    'Dihapuskan':      'badge-dihapuskan',
  };
  return (
    <span className={`badge ${map[status] || 'badge-gray'}`}>
      <span className="badge-dot" />
      {status || 'Tidak diketahui'}
    </span>
  );
}
