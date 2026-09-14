import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Plus,
  Calendar,
  ArrowUpRight,
  Activity,
  Layers,
  Users,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { userApi, peralatanApi } from '../../utils/api';

// Mini Calendar Component
function MiniCalendar({ deadlines }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = viewDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Build set of days with deadlines
  const deadlineDays = useMemo(() => {
    const set = new Set();
    deadlines.forEach(d => {
      const dateStr = d.tanggal_kembali || d.tenggat || d.created_at;
      if (!dateStr) return;
      const loanDate = new Date(dateStr);
      // Tanggal deadline: jika ada tanggal_kembali gunakan langsung, jika created_at estimasi +7 hari
      const targetDate = d.tanggal_kembali ? loanDate : new Date(loanDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (targetDate.getMonth() === month && targetDate.getFullYear() === year) {
        set.add(targetDate.getDate());
      }
    });
    return set;
  }, [deadlines, month, year]);

  const weeks = [];
  let cells = Array(firstDay === 0 ? 6 : firstDay - 1).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const isToday = (d) => d && d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const hasDeadline = (d) => d && deadlineDays.has(d);

  return (
    <div className="mini-calendar">
      <div className="mini-cal-header">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="mini-cal-nav">
          <ChevronLeft size={14} />
        </button>
        <span className="mini-cal-title">{monthName}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="mini-cal-nav">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="mini-cal-grid">
        {['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map(d => (
          <div key={d} className="mini-cal-dow">{d}</div>
        ))}
        {weeks.flat().map((d, i) => (
          <div
            key={i}
            className={`mini-cal-day ${d ? '' : 'empty'} ${isToday(d) ? 'today' : ''} ${hasDeadline(d) ? 'has-deadline' : ''}`}
          >
            {d || ''}
          </div>
        ))}
      </div>
      <p className="mini-cal-note">
        <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />
        Kalender tenggat peminjaman aktif
      </p>
    </div>
  );
}

const STATUS_ICON = { Dipinjam: Clock, Kembali: CheckCircle2, Terlambat: AlertTriangle };

export default function AdminDashboard({ user, onNavigate, recentLoans, searchQuery }) {
  const [stats, setStats] = useState({
    totalPeralatan: 0,
    totalPengguna: 0,
    totalRusak: 0,
    totalPeminjaman: 0,
    loading: true
  });
  const [loans, setLoans] = useState([]);
  const [allLoansList, setAllLoansList] = useState([]);
  const [categoryDist, setCategoryDist] = useState([]);

  const userName = user?.name || 'Administrator';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [eqRes, userRes] = await Promise.allSettled([
          peralatanApi.getAll({ limit: 500 }),
          userApi.getAll()
        ]);

        const allEq = eqRes.status === 'fulfilled' && eqRes.value?.data ? eqRes.value.data : [];
        const allUsers = userRes.status === 'fulfilled' && userRes.value?.data ? userRes.value.data : [];

        // Hitung total rusak/tidak layak
        const rusak = allEq.filter(e =>
          e.kondisi === 'tidak_sesuai' || e.status_kelayakan === 'tidak_aktif' || e.status_kelayakan === 'ditolak'
        ).length;

        // Distribusi kategori
        const catMap = {};
        allEq.forEach(e => {
          const cat = e.kategori_peralatan || 'Lainnya';
          catMap[cat] = (catMap[cat] || 0) + 1;
        });
        const total = allEq.length || 1;
        const catList = Object.entries(catMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([name, count], i) => ({
            name,
            count,
            percent: Math.round((count / total) * 100),
            color: ['#E30613', '#111111', '#4B5563', '#9CA3AF'][i]
          }));

        setStats({
          totalPeralatan: allEq.length,
          totalPengguna: allUsers.length,
          totalRusak: rusak,
          totalPeminjaman: 0,
          loading: false
        });
        setCategoryDist(catList);
        setAllLoansList([]);
        setLoans([]);
      } catch (err) {
        console.warn('Dashboard stats fetch failed:', err);
        setStats(s => ({ ...s, loading: false }));
      }
    };
    fetchStats();
  }, []);

  const filteredLoans = loans.filter(l => {
    const q = (searchQuery || '').toLowerCase();
    if (!q) return true;
    const name = l.peralatan?.nama_peralatan || '';
    const aset = l.peralatan?.nomor_aset || '';
    return [name, aset].some(f => f.toLowerCase().includes(q));
  });

  return (
    <>
      {/* Page Header */}
      <div className="dashboard-page-header">
        <div className="dashboard-title-wrap">
          <h1>
            <span>Dashboard Administrator</span>
            <span className="live-tag">Live Data</span>
          </h1>
          <p className="dashboard-subtitle">
            Ringkasan inventaris peralatan, personel, dan monitoring peminjaman laboratorium Telkom Test House
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
          <button className="btn-hero-primary" onClick={() => onNavigate('/alat-ukur/tambah')}>
            <Plus size={15} />
            <span>Tambah Peralatan</span>
          </button>
        </div>
      </div>

      {/* STATS GRID - dari backend API */}
      <section className="stats-grid" aria-label="Ringkasan statistik">
        <article className="stat-card black" style={{ cursor: 'pointer' }} onClick={() => onNavigate('/alat-ukur')}>
          <div className="stat-header">
            <span className="stat-badge">Inventaris</span>
            <div className="stat-icon-wrapper"><Box size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">
              {stats.loading ? '—' : `${stats.totalPeralatan} Unit`}
            </strong>
            <span className="stat-title">Total Peralatan Terdaftar</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Klik untuk lihat semua peralatan</span>
          </div>
        </article>

        <article className="stat-card red" style={{ cursor: 'pointer' }} onClick={() => onNavigate('/users')}>
          <div className="stat-header">
            <span className="stat-badge">Pengguna</span>
            <div className="stat-icon-wrapper"><Users size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">
              {stats.loading ? '—' : `${stats.totalPengguna} Personel`}
            </strong>
            <span className="stat-title">Total Pengguna Sistem</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Klik untuk kelola akun pengguna</span>
          </div>
        </article>

        <article className="stat-card gray">
          <div className="stat-header">
            <span className="stat-badge">Alat Rusak</span>
            <div className="stat-icon-wrapper"><AlertTriangle size={20} /></div>
          </div>
          <div className="stat-body">
            <strong className="stat-value">
              {stats.loading ? '—' : `${stats.totalRusak} Unit`}
            </strong>
            <span className="stat-title">Total Alat Tidak Layak Pakai</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Kondisi rusak / ditolak / tidak aktif</span>
          </div>
        </article>
      </section>

      {/* ADMIN QUICK GRID */}
      <section className="admin-quick-grid">
        <article className="admin-action-card">
          <div className="admin-card-top">
            <div className="admin-card-icon">
              <Box size={20} />
            </div>
            <div className="admin-card-text">
              <h3>Master Data Inventaris</h3>
              <p>Kelola data katalog peralatan laboratorium, nomor aset BUMN, nomor seri, dan spesifikasi teknis.</p>
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
              <p>Kelola akun dan hak akses: Administrator, Manajer Mutu, dan Staff Lab via backend</p>
            </div>
          </div>
          <button className="admin-card-action" onClick={() => onNavigate('/users')}>
            <span>Kelola {stats.totalPengguna} Akun Personel</span>
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
          <button className="admin-card-action" onClick={() => onNavigate('/admin/ruangan')}>
            <span>Atur Lokasi Lab</span>
            <ArrowUpRight size={14} />
          </button>
        </article>
      </section>

    </>
  );
}
