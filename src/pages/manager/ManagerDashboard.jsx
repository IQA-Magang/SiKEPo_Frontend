import React, { useState } from 'react';
import {
  Calendar,
  Activity,
  Layers,
  FileSpreadsheet,
  Shield,
  FileCheck2,
  Check,
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

export default function ManagerDashboard({ user, onNavigate, onSwitchRole, recentLoans, searchQuery }) {
  const [actionNotice, setActionNotice] = useState('');

  // Manager state: Verification Queue under TLKM13/P
  const [verifications, setVerifications] = useState([
    {
      id: 'VRF-001',
      code: 'TTH-OSA-003',
      name: 'Optical Spectrum Analyzer Yokogawa',
      requester: 'Siti Nurhaliza (Lab Optik)',
      type: 'Mutasi Ruangan & Verifikasi',
      request: 'Mutasi R02 (Lab Optik) -> R01 (Lab Transmisi)',
      date: '07 Sep 2026',
      status: 'Menunggu Verifikasi',
    },
    {
      id: 'VRF-002',
      code: 'TTH-ETH-002',
      name: 'Ethernet Tester VeEX TX300s',
      requester: 'Eko Prasetyo (Sertifikasi)',
      type: 'Perubahan Kelayakan (TLKM13/P)',
      request: 'Ubah Status: Butuh Kalibrasi Ulang',
      date: '06 Sep 2026',
      status: 'Menunggu Verifikasi',
    },
    {
      id: 'VRF-003',
      code: 'TTH-PWR-007',
      name: 'Optical Power Meter Anritsu',
      requester: 'Dedi Kurniawan (Lab Frekuensi)',
      type: 'Verifikasi Kalibrasi Berkala',
      request: 'Sertifikat Kalibrasi Tahunan Baru',
      date: '05 Sep 2026',
      status: 'Menunggu Verifikasi',
    },
  ]);

  const userName = user?.name || 'Ir. Hendra Wijaya, M.T.';
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

  const handleApproveVerification = (id, name) => {
    setVerifications(prev => prev.map(item => item.id === id ? { ...item, status: 'Terverifikasi (Disetujui Manajer)' } : item));
    showNotice(`Alat "${name}" berhasil diverifikasi dan disahkan sesuai prosedur TLKM13/P.`);
  };

  const filteredLoans = (recentLoans || []).filter(loan =>
    [loan.tool, loan.borrower, loan.code].some(f => f.toLowerCase().includes((searchQuery || '').toLowerCase()))
  );

  const pendingCount = verifications.filter(v => v.status.includes('Menunggu')).length;

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

      {/* HERO BANNER - MANAGER */}
      <section className="hero-banner">
        <div className="hero-text-wrap">
          <div className="hero-role-row">
            <div className="date-chip">
              <Calendar size={13} />
              <span>{todayFormatted}</span>
            </div>
            <span className="role-tag-badge manager">
              <Shield size={12} />
              Manajer Penjaminan Mutu & Lab (TLKM13/P)
            </span>

            {/* Quick Role Switcher Pill */}
            <div className="role-switcher-banner" title="Pilih peran untuk menguji tampilan dashboard">
              <span className="role-switcher-label">Peran:</span>
              <button type="button" className="role-switch-pill" onClick={() => onSwitchRole('staff')}>Staff Lab</button>
              <button type="button" className="role-switch-pill active">Manajer</button>
              <button type="button" className="role-switch-pill" onClick={() => onSwitchRole('admin')}>Admin</button>
            </div>
          </div>

          <h1>Selamat Datang, {userName}! 📊</h1>
          <p>
            Executive Oversight & Kepatuhan TLKM13/P: Verifikasi kelayakan alat uji, otorisasi mutasi lokasi antar laboratorium, dan pemantauan utilisasi aset pengujian Telkom Test House.
          </p>
        </div>

        <div className="hero-actions">
          <button
            className="btn-hero-primary"
            onClick={() => {
              const el = document.getElementById('manager-verification-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <FileCheck2 size={16} /><span>Antrean Verifikasi ({pendingCount})</span>
          </button>
          <button className="btn-hero-secondary" onClick={() => onNavigate('/alat-ukur')}>
            <FileSpreadsheet size={16} /><span>Katalog Alat Ukur</span>
          </button>
        </div>
      </section>

      {/* STATS GRID - MANAGER */}
      <section className="stats-grid" aria-label="Ringkasan status manajer">
        <article className="stat-card black">
          <div className="stat-header">
            <span className="stat-badge">SOP TLKM13/P</span>
            <div className="stat-icon-wrapper"><CheckCircle2 size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">96.4%</strong>
            <span className="stat-title">Kepatuhan Kalibrasi</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">291 dari 302 alat valid</span>
          </div>
        </article>

        <article className="stat-card red">
          <div className="stat-header">
            <span className="stat-badge">Perlu Tindakan</span>
            <div className="stat-icon-wrapper"><AlertTriangle size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">{pendingCount} Berkas</strong>
            <span className="stat-title">Menunggu Verifikasi</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Permohonan mutasi & kelayakan</span>
          </div>
        </article>

        <article className="stat-card darkgray">
          <div className="stat-header">
            <span className="stat-badge">Kinerja Lab</span>
            <div className="stat-icon-wrapper"><Activity size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">78.2%</strong>
            <span className="stat-title">Tingkat Utilisasi Alat</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Efisiensi penggunaan aset lab</span>
          </div>
        </article>

        <article className="stat-card gray">
          <div className="stat-header">
            <span className="stat-badge">Peringatan Kalibrasi</span>
            <div className="stat-icon-wrapper"><Clock size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">8 Unit</strong>
            <span className="stat-title">Jatuh Tempo &lt; 30 Hari</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Perlu jadwal kalibrasi berkala</span>
          </div>
        </article>
      </section>

      {/* MANAGER VERIFICATION PANEL (TLKM13/P) */}
      <section id="manager-verification-section" className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <div>
            <h2>Antrean Verifikasi Kelayakan & Mutasi (Prosedur TLKM13/P)</h2>
            <p className="panel-subtitle">Kewenangan manajerial untuk verifikasi kelayakan alat, hasil kalibrasi, dan persetujuan mutasi ruangan</p>
          </div>
          <span className="compliance-tag">Otorisasi Manajer</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID & Kode Alat</th>
                <th>Nama Alat Ukur</th>
                <th>Pemohon (Staff PIC)</th>
                <th>Jenis Permohonan</th>
                <th>Status</th>
                <th>Aksi Manajer</th>
              </tr>
            </thead>
            <tbody>
              {verifications.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="table-id-cell">
                      <span className="loan-id-badge">{item.id}</span>
                      <small className="tool-code">{item.code}</small>
                    </div>
                  </td>
                  <td><strong>{item.name}</strong></td>
                  <td><span className="borrower-name">{item.requester}</span></td>
                  <td>
                    <span style={{ fontSize: '12px', color: '#1F2937' }}>{item.request}</span>
                    <div style={{ fontSize: '10.5px', color: '#6B7280' }}>{item.type}</div>
                  </td>
                  <td>
                    <span className={`verification-badge ${item.status.includes('Terverifikasi') ? 'approved' : ''}`}>
                      {item.status.includes('Terverifikasi') ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                      {item.status}
                    </span>
                  </td>
                  <td>
                    {!item.status.includes('Terverifikasi') ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn-table-action approve"
                          onClick={() => handleApproveVerification(item.id, item.name)}
                          title="Setujui dan verifikasi sesuai prosedur TLKM13/P"
                        >
                          <Check size={13} />
                          <span>Setujui</span>
                        </button>
                        <button
                          className="btn-table-action secondary"
                          onClick={() => showNotice(`Permohonan ${item.id} ditandai untuk peninjauan berkas.`)}
                        >
                          <span>Tinjau</span>
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>Telah Disahkan</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SHARED ANALYTICS PANELS */}
      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h2>Tingkat Ketersediaan & Utilisasi Lab</h2>
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
            <h2>Monitoring Peminjaman & Kepatuhan Pengembalian</h2>
            <p className="panel-subtitle">Pengawasan kepatuhan jadwal pengembalian alat lintas divisi</p>
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
