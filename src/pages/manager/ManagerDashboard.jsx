import React, { useState, useEffect } from 'react';
import {
  Activity,
  Layers,
  Check,
  CheckCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Box,
  Users,
  Wrench,
  RefreshCw
} from 'lucide-react';
import { peralatanApi, userApi, peminjamanApi, verifikasiApi } from '../../utils/api';

const STATUS_ICON = { Dipinjam: Clock, Kembali: CheckCircle2, Terlambat: AlertTriangle };

export default function ManagerDashboard({ user, onNavigate, searchQuery }) {
  const [stats, setStats] = useState({ totalPeralatan: 0, totalPengguna: 0, totalRusak: 0, loading: true });
  const [verifications, setVerifications] = useState([]);
  const [loans, setLoans] = useState([]);
  const [actionNotice, setActionNotice] = useState('');

  const userName = user?.name || 'Manager';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eqRes, userRes, verRes, loanRes] = await Promise.all([
          peralatanApi.getAll({ limit: 500 }),
          userApi.getAll(),
          verifikasiApi.getAll(),
          peminjamanApi.getAll()
        ]);

        const allEq = eqRes?.data || [];
        const allUsers = userRes?.data || [];
        const allVer = verRes?.data || [];
        const allLoans = loanRes?.data || [];

        const rusak = allEq.filter(e =>
          e.kondisi === 'tidak_sesuai' || e.status_kelayakan === 'tidak_aktif' || e.status_kelayakan === 'ditolak'
        ).length;

        setStats({ totalPeralatan: allEq.length, totalPengguna: allUsers.length, totalRusak: rusak, loading: false });
        setVerifications(allVer.filter(v => !v.verified_by).slice(0, 5));
        setLoans(allLoans.slice(0, 5));
      } catch (err) {
        console.warn('Manager dashboard fetch failed:', err);
        setStats(s => ({ ...s, loading: false }));
      }
    };
    fetchData();
  }, []);

  const showNotice = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(''), 3500);
  };

  const handleApproveVerification = async (id, name) => {
    try {
      await verifikasiApi.approve(id);
      setVerifications(prev => prev.filter(v => v.id_verifikasi !== id));
      showNotice(`Verifikasi untuk "${name}" berhasil disetujui.`);
    } catch (err) {
      alert(`Gagal menyetujui verifikasi: ${err.message}`);
    }
  };

  const filteredLoans = loans.filter(l => {
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
            <span>Dashboard Manajer Laboratorium</span>
            <span className="live-tag">Persetujuan Mutu</span>
          </h1>
          <p className="dashboard-subtitle">
            Pusat kendali persetujuan verifikasi kelayakan alat dan monitoring sirkulasi peminjaman
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
          <button className="btn-hero-primary" onClick={() => onNavigate('/verifikasi')}>
            <CheckCircle2 size={15} />
            <span>Verifikasi ({verifications.length})</span>
          </button>
        </div>
      </div>

      {/* STATS GRID */}
      <section className="stats-grid" aria-label="Ringkasan status manajer">
        <article className="stat-card black" style={{ cursor: 'pointer' }} onClick={() => onNavigate('/alat-ukur')}>
          <div className="stat-header">
            <span className="stat-badge">Inventaris</span>
            <div className="stat-icon-wrapper"><Box size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">{stats.loading ? '—' : `${stats.totalPeralatan} Unit`}</strong>
            <span className="stat-title">Total Peralatan Terdaftar</span>
          </div>
        </article>

        <article className="stat-card red">
          <div className="stat-header">
            <span className="stat-badge">Verifikasi Pending</span>
            <div className="stat-icon-wrapper"><AlertTriangle size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">{stats.loading ? '—' : `${verifications.length} Berkas`}</strong>
            <span className="stat-title">Menunggu Persetujuan Anda</span>
          </div>
        </article>

        <article className="stat-card darkgray" style={{ cursor: 'pointer' }} onClick={() => onNavigate('/users')}>
          <div className="stat-header">
            <span className="stat-badge">Pengguna</span>
            <div className="stat-icon-wrapper"><Users size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">{stats.loading ? '—' : `${stats.totalPengguna} Personel`}</strong>
            <span className="stat-title">Total Pengguna Sistem</span>
          </div>
        </article>

        <article className="stat-card gray">
          <div className="stat-header">
            <span className="stat-badge">Alat Rusak</span>
            <div className="stat-icon-wrapper"><Wrench size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">{stats.loading ? '—' : `${stats.totalRusak} Unit`}</strong>
            <span className="stat-title">Tidak Layak / Rusak</span>
          </div>
        </article>
      </section>

      {/* VERIFICATION QUEUE */}
      <section id="manager-verification-section" className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <div>
            <h2>Antrean Verifikasi Kelayakan</h2>
            <p className="panel-subtitle">Verifikasi pending yang perlu persetujuan Anda (Prosedur TLKM13/P)</p>
          </div>
          <button className="btn-view-all" onClick={() => onNavigate('/verifikasi')}>
            <span>Lihat Semua</span><ArrowUpRight size={15} />
          </button>
        </div>

        {verifications.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
            {stats.loading ? 'Memuat data verifikasi...' : 'Tidak ada verifikasi yang menunggu persetujuan. ✓'}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Peralatan</th>
                  <th>Jenis Verifikasi</th>
                  <th>Hasil</th>
                  <th>Tanggal</th>
                  <th>Aksi Manajer</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((item) => (
                  <tr key={item.id_verifikasi}>
                    <td>
                      <strong>{item.peralatan?.nama_peralatan || `Peralatan #${item.id_peralatan}`}</strong>
                      <br />
                      <small style={{ color: '#6B7280' }}>{item.peralatan?.nomor_aset || ''}</small>
                    </td>
                    <td><span style={{ fontSize: '12px' }}>{item.kode_aktivitas || '-'}</span></td>
                    <td><span style={{ fontSize: '12px' }}>{item.keputusan || 'Belum ditentukan'}</span></td>
                    <td>
                      <span className="date-text">
                        {item.tanggal_verifikasi ? new Date(item.tanggal_verifikasi).toLocaleDateString('id-ID') : '-'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-table-action approve"
                        onClick={() => handleApproveVerification(item.id_verifikasi, item.peralatan?.nama_peralatan || `#${item.id_peralatan}`)}
                      >
                        <Check size={13} />
                        <span>Setujui</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* RECENT LOANS */}
      <section className="panel recent-loans-panel">
        <div className="panel-header">
          <div>
            <h2>Monitoring Peminjaman Terkini</h2>
            <p className="panel-subtitle">5 transaksi peminjaman terbaru</p>
          </div>
          <button className="btn-view-all" onClick={() => onNavigate('/peminjaman')}>
            <span>Lihat Semua</span><ArrowUpRight size={15} />
          </button>
        </div>
        {filteredLoans.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
            {stats.loading ? 'Memuat data peminjaman...' : 'Belum ada transaksi peminjaman.'}
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
