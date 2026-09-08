import React, { useState, useEffect } from 'react';
import {
  Box,
  Plus,
  Calendar,
  ArrowUpRight,
  Activity,
  Layers,
  FileSpreadsheet,
  Shield,
  Users,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { userApi } from '../../utils/api';

const categoryDistribution = [
  { name: 'Optik & Transmisi', count: 112, percent: 37, color: '#E30613' },
  { name: 'Pengukuran Frekuensi & RF', count: 84, percent: 28, color: '#111111' },
  { name: 'Testing & Sertifikasi Ethernet', count: 65, percent: 21, color: '#4B5563' },
  { name: 'Power Supply & Catu Daya', count: 41, percent: 14, color: '#9CA3AF' },
];

const chartBars = [
  { label: 'Apr', pct: 85 },
  { label: 'Mei', pct: 78 },
  { label: 'Jun', pct: 92 },
  { label: 'Jul', pct: 88 },
  { label: 'Agu', pct: 80 },
  { label: 'Sep', pct: 83, active: true },
];

const STATUS_ICON = { Dipinjam: Clock, Kembali: CheckCircle2, Terlambat: AlertTriangle };

export default function AdminDashboard({ user, onNavigate, onSwitchRole, recentLoans, searchQuery }) {
  const [userCount, setUserCount] = useState(24);

  useEffect(() => {
    userApi.getAll()
      .then((res) => {
        if (res && res.data && Array.isArray(res.data)) {
          setUserCount(res.data.length);
        }
      })
      .catch((e) => console.warn('Could not fetch user count from backend:', e));
  }, []);

  const userName = user?.name || 'Ahmad Rizky (Administrator)';
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const filteredLoans = (recentLoans || []).filter(loan =>
    [loan.tool, loan.borrower, loan.code].some(f => f.toLowerCase().includes((searchQuery || '').toLowerCase()))
  );

  return (
    <>
      {/* HERO BANNER - ADMIN */}
      <section className="hero-banner">
        <div className="hero-text-wrap">
          <div className="hero-role-row">
            <div className="date-chip">
              <Calendar size={13} />
              <span>{todayFormatted}</span>
            </div>
            <span className="role-tag-badge admin">
              <Shield size={12} />
              Administrator Sistem
            </span>

            {/* Quick Role Switcher Pill */}
            <div className="role-switcher-banner" title="Pilih peran untuk menguji tampilan dashboard">
              <span className="role-switcher-label">Peran:</span>
              <button type="button" className="role-switch-pill" onClick={() => onSwitchRole('staff')}>Staff Lab</button>
              <button type="button" className="role-switch-pill" onClick={() => onSwitchRole('manager')}>Manajer</button>
              <button type="button" className="role-switch-pill active">Admin</button>
            </div>
          </div>

          <h1>Admin Console SiKEPo — Selamat Datang, {userName}! ⚙️</h1>
          <p>
            Pusat Kendali Sistem & Master Data: Kelola seluruh master data alat laboratorium, manajemen akun personel (RBAC /api/users), konfigurasi mutasi ruangan, dan pemantauan sistem.
          </p>
        </div>

        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={() => onNavigate('/alat-ukur/tambah')}>
            <Plus size={16} /><span>+ Tambah Alat Ukur</span>
          </button>
          <button className="btn-hero-secondary" onClick={() => onNavigate('/users')}>
            <Users size={16} /><span>Kelola Pengguna ({userCount})</span>
          </button>
        </div>
      </section>

      {/* STATS GRID - ADMIN */}
      <section className="stats-grid" aria-label="Ringkasan status admin">
        <article className="stat-card black">
          <div className="stat-header">
            <span className="stat-badge">Master Inventaris</span>
            <div className="stat-icon-wrapper"><Box size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">302 Unit</strong>
            <span className="stat-title">Total Master Data Alat</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">+12 unit baru bulan ini</span>
          </div>
        </article>

        <article className="stat-card red" onClick={() => onNavigate('/users')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span className="stat-badge">Akun RBAC Backend</span>
            <div className="stat-icon-wrapper"><Users size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">{userCount} Personel</strong>
            <span className="stat-title">Pengguna Terdaftar</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Terhubung ke database /api/users</span>
          </div>
        </article>

        <article className="stat-card darkgray">
          <div className="stat-header">
            <span className="stat-badge">Siap Pakai</span>
            <div className="stat-icon-wrapper"><CheckCircle2 size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">250 Unit</strong>
            <span className="stat-title">Alat Operasional Baik</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">82.7% beroperasi normal</span>
          </div>
        </article>

        <article className="stat-card gray">
          <div className="stat-header">
            <span className="stat-badge">Perlu Penanganan</span>
            <div className="stat-icon-wrapper"><AlertTriangle size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">17 Unit</strong>
            <span className="stat-title">Maintenance & Rusak</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Perbaikan & karantina sistem</span>
          </div>
        </article>
      </section>

      {/* ADMIN QUICK CONTROL GRID */}
      <section className="admin-quick-grid">
        <article className="admin-action-card">
          <div className="admin-card-top">
            <div className="admin-card-icon">
              <Box size={20} />
            </div>
            <div className="admin-card-text">
              <h3>Master Data Inventaris</h3>
              <p>Kelola data katalog alat ukur laboratorium, nomor aset BUMN, nomor seri, dan spesifikasi teknis.</p>
            </div>
          </div>
          <button className="admin-card-action" onClick={() => onNavigate('/alat-ukur')}>
            <span>Buka Master Data</span>
            <ArrowUpRight size={14} />
          </button>
        </article>

        <article className="admin-action-card">
          <div className="admin-card-top">
            <div className="admin-card-icon blue">
              <Users size={20} />
            </div>
            <div className="admin-card-text">
              <h3>Manajemen Akun Pengguna</h3>
              <p>Kelola akun dan hak akses: Administrator, Manajer Mutu, dan Staff Lab via backend `/api/users`.</p>
            </div>
          </div>
          <button className="admin-card-action" onClick={() => onNavigate('/users')}>
            <span>Kelola {userCount} Akun Personel</span>
            <ArrowUpRight size={14} />
          </button>
        </article>

        <article className="admin-action-card">
          <div className="admin-card-top">
            <div className="admin-card-icon purple">
              <Building2 size={20} />
            </div>
            <div className="admin-card-text">
              <h3>Master Ruangan & Mutasi</h3>
              <p>Konfigurasi penempatan alat laboratorium Telkom Test House (R01, R02, R03, Gudang).</p>
            </div>
          </div>
          <button className="admin-card-action" onClick={() => onNavigate('/alat-ukur')}>
            <span>Atur Lokasi Lab</span>
            <ArrowUpRight size={14} />
          </button>
        </article>
      </section>

      {/* SHARED ANALYTICS PANELS */}
      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h2>Tren Ketersediaan Alat Laboratorium</h2>
              <p className="panel-subtitle">Perbandingan status ketersediaan 6 bulan terakhir</p>
            </div>
            <span className="live-tag"><Activity size={12} /> Real-time</span>
          </div>

          <div className="chart-container">
            <div className="chart-grid-background">
              {['100%', '75%', '50%', '25%', '0%'].map(v => (
                <span key={v} className="chart-y-axis">{v}</span>
              ))}
            </div>
            <div className="chart-bars-group">
              {chartBars.map(({ label, pct, active }) => (
                <div key={label} className={`bar-column${active ? ' active' : ''}`}>
                  <div className="bar-fill" style={{ height: `${pct}%` }}>
                    <span className="bar-tooltip">{pct}% Tersedia</span>
                  </div>
                  <span className="bar-label">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-legend-row">
            {[['green', 'Tersedia (82.7%)'], ['purple', 'Dipinjam (11.6%)'], ['red', 'Perbaikan (5.7%)']].map(([cls, txt]) => (
              <div key={cls} className="legend-item">
                <span className={`legend-dot ${cls}`} /><span>{txt}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel category-panel">
          <div className="panel-header">
            <div>
              <h2>Distribusi Kategori Alat</h2>
              <p className="panel-subtitle">Total 302 unit terdistribusi</p>
            </div>
            <Layers size={18} className="text-muted" />
          </div>
          <div className="category-list">
            {categoryDistribution.map(({ name, count, percent, color }) => (
              <div key={name} className="category-item">
                <div className="category-info">
                  <span className="category-name">{name}</span>
                  <span className="category-count">{count} Unit ({percent}%)</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${percent}%`, backgroundColor: color }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* LOANS MONITORING TABLE */}
      <section className="panel recent-loans-panel">
        <div className="panel-header">
          <div>
            <h2>Aktivitas Peminjaman & Mutasi Terkini</h2>
            <p className="panel-subtitle">Log transaksi operasional alat laboratorium Telkom Test House</p>
          </div>
          <button className="btn-view-all" onClick={() => onNavigate('/peminjaman')}>
            <span>Lihat Semua Transaksi</span><ArrowUpRight size={15} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID & Kode Inventaris</th>
                <th>Perangkat / Alat</th>
                <th>Peminjam & Unit</th>
                <th>Tgl Pinjam</th>
                <th>Tgl Kembali</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => {
                const StatusIcon = STATUS_ICON[loan.status];
                return (
                  <tr key={loan.id}>
                    <td>
                      <div className="table-id-cell">
                        <span className="loan-id-badge">{loan.id}</span>
                        <small className="tool-code">{loan.code}</small>
                      </div>
                    </td>
                    <td>
                      <span className="tool-name-text" onClick={() => onNavigate('/alat-ukur')} style={{ cursor: 'pointer' }}>
                        {loan.tool}
                      </span>
                    </td>
                    <td><span className="borrower-name">{loan.borrower}</span></td>
                    <td><span className="date-text">{loan.date}</span></td>
                    <td><span className="date-text">{loan.returnDate}</span></td>
                    <td>
                      <span className={`status-badge status-${loan.statusTone}`}>
                        {StatusIcon && <StatusIcon size={12} />}
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
