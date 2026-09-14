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
import { peralatanApi, userApi } from '../../utils/api';

const STATUS_ICON = { Dipinjam: Clock, Kembali: CheckCircle2, Terlambat: AlertTriangle };

export default function ManagerDashboard({ user, onNavigate, searchQuery }) {
  const [stats, setStats] = useState({ totalPeralatan: 0, totalPengguna: 0, totalRusak: 0, loading: true });

  const userName = user?.name || 'Manager';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eqRes, userRes] = await Promise.allSettled([
          peralatanApi.getAll({ limit: 500 }),
          userApi.getAll()
        ]);

        const allEq = eqRes.status === 'fulfilled' && eqRes.value?.data ? eqRes.value.data : [];
        const allUsers = userRes.status === 'fulfilled' && userRes.value?.data ? userRes.value.data : [];

        const rusak = allEq.filter(e =>
          e.kondisi === 'tidak_sesuai' || e.status_kelayakan === 'tidak_aktif' || e.status_kelayakan === 'ditolak'
        ).length;

        setStats({ totalPeralatan: allEq.length, totalPengguna: allUsers.length, totalRusak: rusak, loading: false });
      } catch (err) {
        console.warn('Manager dashboard fetch failed:', err);
        setStats(s => ({ ...s, loading: false }));
      }
    };
    fetchData();
  }, []);

  return (
    <>
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

    </>
  );
}
