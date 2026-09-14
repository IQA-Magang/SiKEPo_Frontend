import React, { useState, useEffect } from 'react';
import {
  Box,
  Plus,
  ArrowUpRight,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  RefreshCw
} from 'lucide-react';
import { getCachedEquipment } from '../../utils/api';

export default function StaffDashboard({ user, onNavigate, searchQuery }) {
  const [stats, setStats] = useState({ totalPeralatan: 0, totalRusak: 0, loading: true });
  const [actionNotice, setActionNotice] = useState('');

  const userName = user?.name || 'Staff';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allEq = getCachedEquipment();

        const rusak = allEq.filter(e =>
          e.kondisi === 'tidak_sesuai' || e.status_kelayakan === 'tidak_aktif'
        ).length;

        setStats({
          totalPeralatan: allEq.length,
          totalRusak: rusak,
          loading: false
        });
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
            Pusat operasional inventaris dan kelayakan peralatan uji
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
              <p>Lihat seluruh inventaris peralatan laboratorium.</p>
            </div>
          </div>
          <button className="admin-card-action" onClick={() => onNavigate('/alat-ukur')}>
            <span>Cari Peralatan</span>
            <ArrowUpRight size={14} />
          </button>
        </article>

      </section>

    </>
  );
}
