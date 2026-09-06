import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Box,
  Plus,
  Calendar,
  ArrowUpRight,
  Activity,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import Topbar from '../components/layout/Topbar';
import Sidebar from '../components/layout/Sidebar';

const stats = [
  { label: 'Total Alat',            value: '302', subText: '+12 unit bulan ini',      tone: 'black',    icon: Box,          badge: 'Total Terdaftar'   },
  { label: 'Tersedia',              value: '250', subText: '82.7% siap pakai',         tone: 'red',      icon: CheckCircle2, badge: 'Kondisi Baik'      },
  { label: 'Dipinjam',              value: '35',  subText: '11.6% dalam pemakaian',    tone: 'darkgray', icon: Clock,        badge: 'Sedang Aktif'      },
  { label: 'Tidak Layak / Perbaikan', value: '17', subText: '5.7% butuh maintenance', tone: 'gray',     icon: AlertTriangle, badge: 'Perlu Penanganan' },
];

// ponytail: static mock data, replace with API call when backend ready
const recentLoans = [
  { id: 'PMJ-089', code: 'TTH-OTDR-014', tool: 'OTDR EXFO FTB-1v2 Pro',               borrower: 'Ahmad Rizky (Div. Optik)',      date: '06 Sep 2026', returnDate: '10 Sep 2026', status: 'Dipinjam',  statusTone: 'warning' },
  { id: 'PMJ-088', code: 'TTH-OSA-003',  tool: 'Optical Spectrum Analyzer Yokogawa',   borrower: 'Siti Nurhaliza (Lab Transmisi)', date: '05 Sep 2026', returnDate: '08 Sep 2026', status: 'Dipinjam',  statusTone: 'warning' },
  { id: 'PMJ-087', code: 'TTH-FUS-021',  tool: 'Fusion Splicer Fujikura 90S',          borrower: 'Budi Santoso (Mitra Teknik)',    date: '03 Sep 2026', returnDate: '06 Sep 2026', status: 'Kembali',   statusTone: 'success' },
  { id: 'PMJ-086', code: 'TTH-PWR-007',  tool: 'Optical Power Meter Anritsu',          borrower: 'Dedi Kurniawan (Lab Frekuensi)', date: '01 Sep 2026', returnDate: '04 Sep 2026', status: 'Kembali',   statusTone: 'success' },
  { id: 'PMJ-085', code: 'TTH-ETH-002',  tool: 'Ethernet Tester VeEX TX300s',          borrower: 'Eko Prasetyo (Sertifikasi)',     date: '28 Agu 2026', returnDate: '02 Sep 2026', status: 'Terlambat', statusTone: 'danger'  },
];

const categoryDistribution = [
  { name: 'Optik & Transmisi',            count: 112, percent: 37, color: '#E30613' },
  { name: 'Pengukuran Frekuensi & RF',    count: 84,  percent: 28, color: '#111111' },
  { name: 'Testing & Sertifikasi Ethernet', count: 65, percent: 21, color: '#4B5563' },
  { name: 'Power Supply & Catu Daya',     count: 41,  percent: 14, color: '#9CA3AF' },
];

// ponytail: static chart data, replace with API when ready
const chartBars = [
  { label: 'Apr', pct: 85 },
  { label: 'Mei', pct: 78 },
  { label: 'Jun', pct: 92 },
  { label: 'Jul', pct: 88 },
  { label: 'Agu', pct: 80 },
  { label: 'Sep', pct: 83, active: true },
];

const STATUS_ICON = { Dipinjam: Clock, Kembali: CheckCircle2, Terlambat: AlertTriangle };

export default function Dashboard({ onNavigate }) {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('sikepo_user');
    if (raw) try { setUser(JSON.parse(raw)); } catch (e) { console.error(e); }
  }, []);

  const userName = user?.name ?? 'Administrator';
  const todayFormatted = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const filteredLoans = recentLoans.filter(loan =>
    [loan.tool, loan.borrower, loan.code].some(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="app-shell">
      <Topbar
        user={user}
        onNavigate={onNavigate}
        searchValue={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
      />

      <Sidebar activePath="/dashboard" onNavigate={onNavigate} />

      <main className="main-content">
        <section className="hero-banner">
          <div className="hero-text-wrap">
            <div className="date-chip">
              <Calendar size={13} />
              <span>{todayFormatted}</span>
            </div>
            <h1>Selamat Datang Kembali, {userName}! 👋</h1>
            <p>Pantau status ketersediaan, peminjaman, dan posisi peralatan laboratorium Telkom Test House secara real-time.</p>
          </div>
          <div className="hero-actions">
            <button className="btn-hero-primary" onClick={() => onNavigate('/peminjaman')}>
              <Plus size={16} /><span>Pinjam Alat</span>
            </button>
            <button className="btn-hero-secondary" onClick={() => onNavigate('/alat-ukur')}>
              <FileSpreadsheet size={16} /><span>Data Alat</span>
            </button>
          </div>
        </section>

        <section className="stats-grid" aria-label="Ringkasan status alat">
          {stats.map(({ label, value, subText, tone, icon: Icon, badge }) => (
            <article className={`stat-card ${tone}`} key={label}>
              <div className="stat-header">
                <span className="stat-badge">{badge}</span>
                <div className="stat-icon-wrapper"><Icon size={20} /></div>
              </div>
              <div className="stat-body">
                <strong className="stat-value">{value}</strong>
                <span className="stat-title">{label}</span>
              </div>
              <div className="stat-footer">
                <span className="stat-sub">{subText}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="dashboard-grid">
          <article className="panel chart-panel">
            <div className="panel-header">
              <div>
                <h2>Tren Ketersediaan Alat</h2>
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

        <section className="panel recent-loans-panel">
          <div className="panel-header">
            <div>
              <h2>Aktivitas Peminjaman Terbaru</h2>
              <p className="panel-subtitle">Daftar transaksi peminjaman alat laboratorium terkini</p>
            </div>
            <button className="btn-view-all" onClick={() => onNavigate('/peminjaman')}>
              <span>Lihat Semua Peminjaman</span><ArrowUpRight size={15} />
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
                        <span
                          className="tool-name-text"
                          onClick={() => onNavigate('/alat-ukur')}
                          style={{ cursor: 'pointer' }}
                          title="Buka modul Alat Ukur"
                        >
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
                {filteredLoans.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center empty-table-cell">
                      Tidak ada data peminjaman yang cocok dengan pencarian "{searchQuery}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
