import React, { useState, useEffect } from 'react';
import {
  Box,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  RefreshCw
} from 'lucide-react';
import { peralatanApi, peminjamanApi, getStoredUser } from '../../utils/api';

export default function StaffDashboard({ user, onNavigate, searchQuery }) {
  const [stats, setStats] = useState({ totalPeralatan: 0, totalDipinjam: 0, totalRusak: 0, loading: true });
  const [myLoans, setMyLoans] = useState([]);
  const [actionNotice, setActionNotice] = useState('');

  const userName = user?.name || 'Staff';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eqRes, loanRes] = await Promise.all([
          peralatanApi.getAll({ limit: 500 }),
          peminjamanApi.getAll()
        ]);

        const allEq = eqRes?.data || [];
        const allLoans = loanRes?.data || [];

        const rusak = allEq.filter(e =>
          e.kondisi === 'tidak_sesuai' || e.status_kelayakan === 'tidak_aktif'
        ).length;

        setStats({
          totalPeralatan: allEq.length,
          totalDipinjam: allLoans.filter(l => l.status === 'approved').length,
          totalRusak: rusak,
          loading: false
        });
        setMyLoans(allLoans.slice(0, 5));
      } catch (err) {
        console.warn('Staff dashboard fetch failed:', err);
        setStats(s => ({ ...s, loading: false }));
      }
    };
    fetchData();
  }, []);

  const showNotice = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 3500);
  };

  const filteredLoans = myLoans.filter(l => {
    const q = (searchQuery || '').toLowerCase();
    if (!q) return true;
    return (l.peralatan?.nama_peralatan || '').toLowerCase().includes(q);
  });

  return (
    <>
      {actionNotice && (
        <div className="eq-confirm-banner" style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="#059669" />
            <span>{actionNotice}</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="dashboard-page-header">
        <div className="dashboard-title-wrap">
          <h1>
            <span>Dashboard Staff Laboratorium</span>
            <span className="live-tag">Operasional</span>
          </h1>
          <p className="dashboard-subtitle">
            Pusat operasional inventaris peralatan uji dan pencatatan sirkulasi peminjaman
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-hero-secondary"
            style={{ color: '#111827', borderColor: '#E5E7EB', background: '#FFFFFF' }}
            onClick={() => window.location.reload()}
            title="Muat ulang data"
          >
            <RefreshCw size={15} />
            <span>Segarkan</span>
          </button>
          <button className="btn-hero-primary" onClick={() => onNavigate('/peminjaman')}>
            <Plus size={15} />
            <span>Pinjam Alat</span>
          </button>
        </div>
      </div>

      {/* STATS GRID */}
      <section className="stats-grid" aria-label="Ringkasan status staff">
        <article className="stat-card black" style={{ cursor: 'pointer' }} onClick={() => onNavigate('/alat-ukur')}>
          <div className="stat-header">
            <span className="stat-badge">Inventaris</span>
            <div className="stat-icon-wrapper"><Box size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">{stats.loading ? '—' : `${stats.totalPeralatan} Unit`}</strong>
            <span className="stat-title">Total Peralatan Terdaftar</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Klik untuk lihat semua peralatan</span>
          </div>
        </article>

        <article className="stat-card red" style={{ cursor: 'pointer' }} onClick={() => onNavigate('/peminjaman')}>
          <div className="stat-header">
            <span className="stat-badge">Dipinjam</span>
            <div className="stat-icon-wrapper"><Clock size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">{stats.loading ? '—' : `${stats.totalDipinjam} Unit`}</strong>
            <span className="stat-title">Peralatan Sedang Dipinjam</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Status: approved / aktif dipinjam</span>
          </div>
        </article>

        <article className="stat-card darkgray">
          <div className="stat-header">
            <span className="stat-badge">Alat Rusak</span>
            <div className="stat-icon-wrapper"><AlertTriangle size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">{stats.loading ? '—' : `${stats.totalRusak} Unit`}</strong>
            <span className="stat-title">Total Alat Tidak Layak</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Kondisi tidak sesuai / tidak aktif</span>
          </div>
        </article>

        <article className="stat-card gray" style={{ cursor: 'pointer' }} onClick={() => onNavigate('/peminjaman')}>
          <div className="stat-header">
            <span className="stat-badge">Ajukan Pinjam</span>
            <div className="stat-icon-wrapper"><Wrench size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">+ Pinjam</strong>
            <span className="stat-title">Ajukan Peminjaman Baru</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Klik untuk halaman peminjaman</span>
          </div>
        </article>
      </section>

      {/* QUICK ACTIONS */}
      <section className="admin-quick-grid">
        <article className="admin-action-card">
          <div className="admin-card-top">
            <div className="admin-card-icon">
              <Wrench size={20} />
            </div>
            <div className="admin-card-text">
              <h3>Katalog Peralatan</h3>
              <p>Lihat semua peralatan laboratorium yang tersedia dan siap untuk dipinjam.</p>
            </div>
          </div>
          <button className="admin-card-action" onClick={() => onNavigate('/alat-ukur')}>
            <span>Cari Peralatan</span>
            <ArrowUpRight size={14} />
          </button>
        </article>

        <article className="admin-action-card">
          <div className="admin-card-top">
            <div className="admin-card-icon blue">
              <Plus size={20} />
            </div>
            <div className="admin-card-text">
              <h3>Ajukan Peminjaman</h3>
              <p>Buat pengajuan peminjaman alat baru untuk kebutuhan pengujian laboratorium.</p>
            </div>
          </div>
          <button className="admin-card-action" onClick={() => onNavigate('/peminjaman')}>
            <span>Pinjam Alat</span>
            <ArrowUpRight size={14} />
          </button>
        </article>

        <article className="admin-action-card">
          <div className="admin-card-top">
            <div className="admin-card-icon purple">
              <CheckCircle2 size={20} />
            </div>
            <div className="admin-card-text">
              <h3>Verifikasi Peralatan</h3>
              <p>Catat hasil pemeriksaan dan kalibrasi peralatan yang menjadi tanggung jawab Anda.</p>
            </div>
          </div>
          <button className="admin-card-action" onClick={() => onNavigate('/verifikasi')}>
            <span>Buka Verifikasi</span>
            <ArrowUpRight size={14} />
          </button>
        </article>
      </section>

      {/* RECENT LOANS TABLE */}
      <section className="panel recent-loans-panel">
        <div className="panel-header">
          <div>
            <h2>Riwayat Peminjaman Terkini</h2>
            <p className="panel-subtitle">5 transaksi peminjaman terbaru dari sistem</p>
          </div>
          <button className="btn-view-all" onClick={() => onNavigate('/peminjaman')}>
            <span>Lihat Semua</span><ArrowUpRight size={15} />
          </button>
        </div>
        {filteredLoans.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
            {stats.loading ? 'Memuat data...' : 'Belum ada riwayat peminjaman.'}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Peralatan</th>
                  <th>Jumlah</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan, idx) => (
                  <tr key={loan.id || idx}>
                    <td>
                      <strong className="tool-name-text">{loan.peralatan?.nama_peralatan || `#${loan.peralatan_id}`}</strong>
                      <br />
                      <small style={{ color: '#6B7280' }}>{loan.catatan || ''}</small>
                    </td>
                    <td>{loan.jumlah || 1} unit</td>
                    <td>
                      <span className={`role-tag-badge ${loan.status === 'approved' ? 'admin' : loan.status === 'rejected' ? 'staff' : 'manager'}`}>
                        {(loan.status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="date-text">
                        {loan.created_at ? new Date(loan.created_at).toLocaleDateString('id-ID') : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
