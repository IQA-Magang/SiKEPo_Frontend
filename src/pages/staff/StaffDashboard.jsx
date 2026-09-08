import React, { useState } from 'react';
import {
  Box,
  Plus,
  Calendar,
  Activity,
  Layers,
  Wrench,
  Shield,
  RotateCcw,
  CheckCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';

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

export default function StaffDashboard({ user, onNavigate, onSwitchRole, recentLoans, searchQuery }) {
  const [actionNotice, setActionNotice] = useState('');

  // Staff state: Active personal borrowed equipment
  const [staffLoans, setStaffLoans] = useState([
    {
      id: 'PMJ-089',
      code: 'TTH-OTDR-014',
      tool: 'OTDR EXFO FTB-1v2 Pro',
      room: 'Lab Transmisi (R01)',
      borrowDate: '06 Sep 2026',
      dueDate: '10 Sep 2026 (Besok)',
      purpose: 'Pengujian Redaman Kabel Fiber Core #12',
      isReturned: false,
    },
    {
      id: 'PMJ-088',
      code: 'TTH-OSA-003',
      tool: 'Optical Spectrum Analyzer Yokogawa',
      room: 'Lab Optik (R02)',
      borrowDate: '05 Sep 2026',
      dueDate: '12 Sep 2026',
      purpose: 'Pengukuran Spektrum Wavelength WDM',
      isReturned: false,
    },
    {
      id: 'PMJ-091',
      code: 'TTH-FUS-021',
      tool: 'Fusion Splicer Fujikura 90S',
      room: 'Lab Transmisi (R01)',
      borrowDate: '07 Sep 2026',
      dueDate: '15 Sep 2026',
      purpose: 'Penyambungan Patch Cord Sertifikasi',
      isReturned: false,
    },
  ]);

  const userName = user?.name || 'Siti Nurhaliza, S.T.';
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const showNotice = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 3500);
  };

  const handleReturnEquipment = (id, toolName) => {
    setStaffLoans(prev => prev.map(item => item.id === id ? { ...item, isReturned: true } : item));
    showNotice(`Alat "${toolName}" berhasil dikembalikan. Status tercatat di log peminjaman.`);
  };

  const filteredLoans = (recentLoans || []).filter(loan =>
    [loan.tool, loan.borrower, loan.code].some(f => f.toLowerCase().includes((searchQuery || '').toLowerCase()))
  );

  const activeBorrowedCount = staffLoans.filter(l => !l.isReturned).length;

  return (
    <>
      {/* Interactive Action Notice */}
      {actionNotice && (
        <div className="eq-confirm-banner" style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="#059669" />
            <span>{actionNotice}</span>
          </div>
        </div>
      )}

      {/* HERO BANNER - STAFF */}
      <section className="hero-banner">
        <div className="hero-text-wrap">
          <div className="hero-role-row">
            <div className="date-chip">
              <Calendar size={13} />
              <span>{todayFormatted}</span>
            </div>
            <span className="role-tag-badge staff">
              <Shield size={12} />
              Staff Operasional Lab (PIC Alat)
            </span>

            {/* Quick Role Switcher Pill */}
            <div className="role-switcher-banner" title="Pilih peran untuk menguji tampilan dashboard">
              <span className="role-switcher-label">Peran:</span>
              <button type="button" className="role-switch-pill active">Staff Lab</button>
              <button type="button" className="role-switch-pill" onClick={() => onSwitchRole('manager')}>Manajer</button>
              <button type="button" className="role-switch-pill" onClick={() => onSwitchRole('admin')}>Admin</button>
            </div>
          </div>

          <h1>Selamat Bertugas, {userName}! 🔬</h1>
          <p>
            Portal Operasional Pengujian: Cari ketersediaan alat ukur, ajukan peminjaman pengujian, perpanjangan, serta pantau batas pengembalian alat secara real-time.
          </p>
        </div>

        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={() => onNavigate('/peminjaman')}>
            <Plus size={16} /><span>Pinjam Alat</span>
          </button>
          <button className="btn-hero-secondary" onClick={() => onNavigate('/alat-ukur')}>
            <Wrench size={16} /><span>Cari Alat Siap Pakai</span>
          </button>
        </div>
      </section>

      {/* STATS GRID - STAFF */}
      <section className="stats-grid" aria-label="Ringkasan status staf">
        <article className="stat-card red">
          <div className="stat-header">
            <span className="stat-badge">Perlu Dikembalikan</span>
            <div className="stat-icon-wrapper"><Clock size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">{activeBorrowedCount} Unit</strong>
            <span className="stat-title">Alat Sedang Dipinjam</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Dalam pengujian aktif Anda</span>
          </div>
        </article>

        <article className="stat-card darkgray">
          <div className="stat-header">
            <span className="stat-badge">Batas Pengembalian</span>
            <div className="stat-icon-wrapper"><AlertTriangle size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">1 Unit Besok</strong>
            <span className="stat-title">Jatuh Tempo Mendekati</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">TTH-OTDR-014 (Core #12)</span>
          </div>
        </article>

        <article className="stat-card black">
          <div className="stat-header">
            <span className="stat-badge">Tersedia di Rak</span>
            <div className="stat-icon-wrapper"><CheckCircle2 size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">250 Unit</strong>
            <span className="stat-title">Alat Lab Siap Pakai</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Kondisi baik & terkalibrasi</span>
          </div>
        </article>

        <article className="stat-card gray">
          <div className="stat-header">
            <span className="stat-badge">Histori Anda</span>
            <div className="stat-icon-wrapper"><Box size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">14 Kali</strong>
            <span className="stat-title">Riwayat Pengujian Saya</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Total pengujian bulan ini</span>
          </div>
        </article>
      </section>

      {/* STAFF PERSONAL BORROWED TOOLS */}
      <section className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <div>
            <h2>Alat Laboratorium yang Sedang Anda Pinjam (Tugas Aktif)</h2>
            <p className="panel-subtitle">Daftar peralatan pengujian di bawah tanggung jawab Anda saat ini</p>
          </div>
          <button className="btn-hero-primary" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => onNavigate('/peminjaman')}>
            <Plus size={14} /><span>Pinjam Alat Baru</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID Pinjam & Kode</th>
                <th>Nama Alat Pengujian</th>
                <th>Lokasi Ruangan</th>
                <th>Tenggat Pengembalian</th>
                <th>Keperluan Pengujian</th>
                <th>Aksi Cepat</th>
              </tr>
            </thead>
            <tbody>
              {staffLoans.map((loan) => (
                <tr key={loan.id} style={loan.isReturned ? { opacity: 0.6 } : {}}>
                  <td>
                    <div className="table-id-cell">
                      <span className="loan-id-badge">{loan.id}</span>
                      <small className="tool-code">{loan.code}</small>
                    </div>
                  </td>
                  <td>
                    <strong className="tool-name-text" onClick={() => onNavigate('/alat-ukur')} style={{ cursor: 'pointer' }}>
                      {loan.tool}
                    </strong>
                  </td>
                  <td><span className="borrower-name">{loan.room}</span></td>
                  <td>
                    <span className="date-text" style={loan.dueDate.includes('Besok') ? { color: '#DC2626', fontWeight: 700 } : {}}>
                      {loan.dueDate}
                    </span>
                  </td>
                  <td><span style={{ fontSize: '12px', color: '#4B5563' }}>{loan.purpose}</span></td>
                  <td>
                    {!loan.isReturned ? (
                      <button
                        className="btn-table-action approve"
                        onClick={() => handleReturnEquipment(loan.id, loan.tool)}
                        title="Lakukan pengembalian alat ke rak laboratorium"
                      >
                        <RotateCcw size={13} />
                        <span>Kembalikan</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>
                        ✓ Dikembalikan
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Lab Availability Catalog */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F3F4F6' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>
            Kesiapan Alat per Laboratorium Pengujian
          </h3>
          <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 12px 0' }}>
            Pilih laboratorium untuk memeriksa posisi rak dan mengambil alat untuk pengujian
          </p>
          <div className="staff-quick-grid">
            <div className="staff-lab-card" onClick={() => onNavigate('/alat-ukur')} style={{ cursor: 'pointer' }}>
              <div className="staff-lab-header">
                <span className="staff-lab-name">Lab Optik (R01)</span>
                <span className="staff-lab-count">94</span>
              </div>
              <span className="staff-lab-sub">Unit Siap Pakai (18 dipinjam)</span>
            </div>
            <div className="staff-lab-card" onClick={() => onNavigate('/alat-ukur')} style={{ cursor: 'pointer' }}>
              <div className="staff-lab-header">
                <span className="staff-lab-name">Lab Frekuensi & RF (R02)</span>
                <span className="staff-lab-count">72</span>
              </div>
              <span className="staff-lab-sub">Unit Siap Pakai (12 dipinjam)</span>
            </div>
            <div className="staff-lab-card" onClick={() => onNavigate('/alat-ukur')} style={{ cursor: 'pointer' }}>
              <div className="staff-lab-header">
                <span className="staff-lab-name">Lab Ethernet (R03)</span>
                <span className="staff-lab-count">55</span>
              </div>
              <span className="staff-lab-sub">Unit Siap Pakai (10 dipinjam)</span>
            </div>
            <div className="staff-lab-card" onClick={() => onNavigate('/alat-ukur')} style={{ cursor: 'pointer' }}>
              <div className="staff-lab-header">
                <span className="staff-lab-name">Lab Power Supply (G01)</span>
                <span className="staff-lab-count">29</span>
              </div>
              <span className="staff-lab-sub">Unit Siap Pakai (12 dipinjam)</span>
            </div>
          </div>
        </div>
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
            <h2>Histori Pengujian & Peminjaman Laboratorium</h2>
            <p className="panel-subtitle">Daftar transaksi peminjaman alat laboratorium terkini</p>
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
