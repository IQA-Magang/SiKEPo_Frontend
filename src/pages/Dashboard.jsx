import React, { useState, useEffect } from 'react';
import { Package, Building2, DoorOpen, Users, Plus, Bell, RefreshCw, ClipboardCheck, AlertTriangle, Clock3, CheckCircle2 } from 'lucide-react';
import { getCurrentUser, usersApi, labsApi, ruanganApi, kelompokAssetApi, peralatanApi, notificationApi, peminjamanApi } from '../utils/api.js';
import { can, ACCESS, ACTIONS } from '../utils/permissions.js';

// ------------------------------------------------------------------
// Dashboard: tampilan berbeda berdasarkan role
// ------------------------------------------------------------------
export default function Dashboard({ onNavigate }) {
  const user = getCurrentUser();
  const role = user?.role || 'staff';

  return (
    <div className="page-container fade-in-up">
      {role === 'admin' && <AdminDashboard onNavigate={onNavigate} />}
      {role === 'manager' && <ManagerDashboard onNavigate={onNavigate} user={user} />}
      {role === 'staff' && <StaffDashboard onNavigate={onNavigate} user={user} />}
    </div>
  );
}

function getProcessStage(equipment) {
  switch (equipment.status_verifikasi) {
    case 'Disetujui':
      return { label: 'Verifikasi selesai', description: 'Persetujuan manager sudah diberikan', tone: 'badge-aktif' };
    case 'Diajukan':
      return { label: 'Menunggu persetujuan', description: 'Pengajuan sedang menunggu manager', tone: 'badge-kalibrasi' };
    case 'Ditolak':
      return { label: 'Perlu tindak lanjut', description: 'Perbaiki catatan lalu ajukan ulang', tone: 'badge-rusak' };
    case 'Draft':
      return { label: 'Draft verifikasi', description: 'Belum diajukan untuk persetujuan manager', tone: 'badge-gray' };
    case 'Belum Diverifikasi':
    default:
      return { label: 'Belum diverifikasi', description: 'PIC perlu memulai pemeriksaan alat', tone: 'badge-gray' };
  }
}

function getCalibrationDueDate(equipment) {
  const detail = equipment.detail
    || equipment.detail_alat_ukur
    || equipment.detail_alat_bantu
    || equipment.detail_artefak_acuan
    || equipment.detail_komponen_pendukung
    || {};
  const date = detail.tgl_jatuh_tempo
    || detail.tgl_karakterisasi
    || detail.tgl_kedaluwarsa
    || equipment.tgl_jatuh_tempo
    || equipment.tgl_karakterisasi;
  if (!date) return null;
  const parsed = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDueDate(date) {
  if (!date) return 'Jadwal belum tersedia';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((date.getTime() - today.getTime()) / 86400000);
  if (days < 0) return `Terlambat ${Math.abs(days)} hari`;
  if (days === 0) return 'Jatuh tempo hari ini';
  if (days <= 30) return `${days} hari lagi`;
  return `Jatuh tempo ${date.toLocaleDateString('id-ID')}`;
}

function getDueDateBadgeClass(date) {
  if (!date) return 'badge-gray';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((date.getTime() - today.getTime()) / 86400000);
  if (days <= 0) return 'badge-rusak';
  if (days <= 30) return 'badge-kalibrasi';
  return 'badge-aktif';
}

const DEFAULT_LOAN_DATA = [
  { id: 'PINJAM-2026-001', status: 'MENUNGGU_MANAGER_PEMINJAM' },
  { id: 'PINJAM-2026-002', status: 'MENUNGGU_PENGELOLA' },
  { id: 'PINJAM-2026-003', status: 'MENUNGGU_MANAGER_LAB' },
  { id: 'PINJAM-2026-004', status: 'MENUNGGU_SERAH_TERIMA' },
  { id: 'PINJAM-2026-005', status: 'SEDANG_DIPINJAM' },
  { id: 'PINJAM-2026-006', status: 'DITOLAK' },
];

async function fetchDashboardLoans() {
  try {
    const res = await peminjamanApi.getAll();
    if (res?.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  } catch {
    return DEFAULT_LOAN_DATA;
  }
}

function LoanPipelineSummary({ loans = [], onNavigate, loading = false }) {
  const total = loans.length;
  const tahap1 = loans.filter((l) => l.status === 'MENUNGGU_MANAGER_PEMINJAM').length;
  const tahap2 = loans.filter((l) => l.status === 'MENUNGGU_PENGELOLA').length;
  const tahap3 = loans.filter((l) => l.status === 'MENUNGGU_MANAGER_LAB').length;
  const tahap4 = loans.filter((l) => l.status === 'MENUNGGU_SERAH_TERIMA' || l.status === 'DISETUJUI').length;

  return (
    <div style={{ marginBottom: 'var(--sp-6)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--sp-3)',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <h2 className="card-title dash-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            Alur & Persetujuan Peminjaman Peralatan

          </h2>
          <p className="page-subtitle" style={{ margin: 0, marginTop: 2 }}>
            Ringkasan status proses permohonan peminjaman peralatan antar-laboratorium
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate('/peminjaman')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          Buka Modul Peminjaman &rarr;
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--sp-3)' }}>
        {/* TOTAL PENGAJUAN */}
        <div
          className="card stat-card-clickable"
          onClick={() => onNavigate('/peminjaman')}
          style={{
            padding: 'var(--sp-4)',
            borderLeft: '4px solid #3b82f6',
            borderRadius: 'var(--radius-lg, 12px)',
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            TOTAL PENGAJUAN
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', margin: '4px 0 2px' }}>
            {loading ? '...' : total}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Semua riwayat peminjaman</div>
        </div>

        {/* TAHAP 1 (ATASAN) */}
        <div
          className="card stat-card-clickable"
          onClick={() => onNavigate('/peminjaman')}
          style={{
            padding: 'var(--sp-4)',
            borderLeft: '4px solid #d97706',
            borderRadius: 'var(--radius-lg, 12px)',
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            TAHAP 1 (ATASAN)
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706', margin: '4px 0 2px' }}>
            {loading ? '...' : tahap1}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Validasi atasan peminjam</div>
        </div>

        {/* TAHAP 2 (PENGELOLA) */}
        <div
          className="card stat-card-clickable"
          onClick={() => onNavigate('/peminjaman')}
          style={{
            padding: 'var(--sp-4)',
            borderLeft: '4px solid #0284c7',
            borderRadius: 'var(--radius-lg, 12px)',
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            TAHAP 2 (PENGELOLA)
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0284c7', margin: '4px 0 2px' }}>
            {loading ? '...' : tahap2}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Review teknis & ketersediaan</div>
        </div>

        {/* TAHAP 3 (MGR LAB) */}
        <div
          className="card stat-card-clickable"
          onClick={() => onNavigate('/peminjaman')}
          style={{
            padding: 'var(--sp-4)',
            borderLeft: '4px solid #7c3aed',
            borderRadius: 'var(--radius-lg, 12px)',
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            TAHAP 3 (MGR LAB)
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7c3aed', margin: '4px 0 2px' }}>
            {loading ? '...' : tahap3}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Pengesahan izin final</div>
        </div>

        {/* TAHAP 4 (SERAH TERIMA) */}
        <div
          className="card stat-card-clickable"
          onClick={() => onNavigate('/peminjaman')}
          style={{
            padding: 'var(--sp-4)',
            borderLeft: '4px solid #ea580c',
            borderRadius: 'var(--radius-lg, 12px)',
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            TAHAP 4 (SERAH TERIMA)
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ea580c', margin: '4px 0 2px' }}>
            {loading ? '...' : tahap4}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Cek fisik Lampiran A bersama peminjam</div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Admin Dashboard
// ------------------------------------------------------------------
function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState({
    users: 0,
    labs: 0,
    ruangan: 0,
    peralatan: 0,
    alatRusak: 0,
    alatAktif: 0,
    alatKalibrasi: 0,
    alatDipinjam: 0,
    kelompokAset: 0,
    processItems: [],
  });
  const [loans, setLoans] = useState(DEFAULT_LOAN_DATA);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [u, l, r, p, k, loanData] = await Promise.allSettled([
        usersApi.getAll(),
        labsApi.getAll(),
        ruanganApi.getAll(),
        peralatanApi.getAll(),
        kelompokAssetApi.getAll(),
        fetchDashboardLoans(),
      ]);

      const pList = p.status === 'fulfilled' ? (p.value.data || []) : [];
      const rusakCount = pList.filter(item => item.status_alat === 'Rusak').length;
      const aktifCount = pList.filter(item => item.status_alat === 'Aktif').length;
      const kalibrasiCount = pList.filter(item => item.status_alat === 'Dalam Kalibrasi').length;
      const dipinjamCount = pList.filter(item => item.status_alat === 'Dipinjam').length;

      if (loanData.status === 'fulfilled' && loanData.value) {
        setLoans(loanData.value);
      }

      setStats({
        users: u.status === 'fulfilled' ? (u.value.data?.length ?? 0) : 0,
        labs: l.status === 'fulfilled' ? (l.value.data?.length ?? 0) : 0,
        ruangan: r.status === 'fulfilled' ? (r.value.data?.length ?? 0) : 0,
        peralatan: pList.length,
        alatRusak: rusakCount,
        alatAktif: aktifCount,
        alatKalibrasi: kalibrasiCount,
        alatDipinjam: dipinjamCount,
        kelompokAset: k.status === 'fulfilled' ? (k.value.data?.length ?? 0) : 0,
        processItems: pList,
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
      {/* Level 1: Page Header */}
      <div className="dash-header">
        <div className="dash-header-left">
          <div className="dash-title-row">
            <h1 className="page-title">Dashboard Administrator</h1>
            <span className="live-tag">Live Data</span>
          </div>
          <p className="page-subtitle">
            Ringkasan inventaris peralatan, personel, dan monitoring peminjaman laboratorium Telkom Test House
          </p>
        </div>
        <div className="dash-header-actions">
          <button className="btn-pill-secondary" onClick={load} id="btn-refresh-dashboard">
            <RefreshCw size={15} /> Segarkan
          </button>
          <button className="btn-pill-primary" onClick={() => onNavigate('/peralatan/tambah')} id="btn-tambah-peralatan">
            <Plus size={16} /> Tambah Peralatan
          </button>
        </div>
      </div>

      {/* Level 1: 4 KPI Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-clickable black" onClick={() => onNavigate('/peralatan')}>
          <div>
            <div className="stat-header">
              <span className="stat-badge">Inventaris</span>
              <div className="stat-icon-wrapper"><Package size={20} /></div>
            </div>
            <span className="stat-value">{loading ? '...' : `${stats.peralatan} Unit`}</span>
            <span className="stat-title">Total Peralatan Terdaftar</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Lihat detail kelola aset &rarr;</span>
          </div>
        </div>

        <div className="stat-card stat-card-clickable red" onClick={() => onNavigate('/admin/users')}>
          <div>
            <div className="stat-header">
              <span className="stat-badge">Pengguna</span>
              <div className="stat-icon-wrapper"><Users size={20} /></div>
            </div>
            <span className="stat-value">{loading ? '...' : `${stats.users} Personel`}</span>
            <span className="stat-title">Total Pengguna Sistem</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Kelola hak akses &amp; PIC &rarr;</span>
          </div>
        </div>

        <div className="stat-card stat-card-clickable gray" onClick={() => onNavigate('/peralatan')}>
          <div>
            <div className="stat-header">
              <span className="stat-badge">Alat Rusak</span>
              <div className="stat-icon-wrapper"><Building2 size={20} /></div>
            </div>
            <span className="stat-value">{loading ? '...' : `${stats.alatRusak} Unit`}</span>
            <span className="stat-title">Total Alat Tidak Layak Pakai</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Kondisi perbaikan &amp; kalibrasi &rarr;</span>
          </div>
        </div>

        <div className="stat-card stat-card-clickable darkgray" onClick={() => onNavigate('/admin/labs')}>
          <div>
            <div className="stat-header">
              <span className="stat-badge">Laboratorium</span>
              <div className="stat-icon-wrapper"><DoorOpen size={20} /></div>
            </div>
            <span className="stat-value">{loading ? '...' : `${stats.labs} Lab`}</span>
            <span className="stat-title">Laboratorium Pengujian</span>
          </div>
          <div className="stat-footer">
            <span className="stat-sub">Ruang uji ISO/IEC 17025 &rarr;</span>
          </div>
        </div>
      </div>

      {/* Ringkasan 5 Kotak Alur Peminjaman Peralatan (TLKM13/IK/005) */}
      <LoanPipelineSummary loans={loans} onNavigate={onNavigate} loading={loading} />

      {/* Level 2: Ringkasan kondisi peralatan */}
      <div className="dash-level2-grid">
        <div className="card card-padded">
          <h2 className="card-title dash-section-title">Kondisi & Tata Kelola Peralatan</h2>
          <div className="dash-category-list">
            <div className="dash-cat-item">
              <div className="dash-cat-header">
                <span>Aktif / Layak Pakai</span>
                <strong>{stats.alatAktif} Unit ({stats.peralatan ? Math.round((stats.alatAktif / stats.peralatan) * 100) : 0}%)</strong>
              </div>
              <div className="dash-cat-bar">
                <div
                  className="dash-cat-progress"
                  style={{
                    width: `${stats.peralatan ? (stats.alatAktif / stats.peralatan) * 100 : 0}%`,
                    background: '#22C55E',
                  }}
                />
              </div>
            </div>

            <div className="dash-cat-item">
              <div className="dash-cat-header">
                <span>Dalam Kalibrasi</span>
                <strong>{stats.alatKalibrasi} Unit ({stats.peralatan ? Math.round((stats.alatKalibrasi / stats.peralatan) * 100) : 0}%)</strong>
              </div>
              <div className="dash-cat-bar">
                <div
                  className="dash-cat-progress"
                  style={{
                    width: `${stats.peralatan ? (stats.alatKalibrasi / stats.peralatan) * 100 : 0}%`,
                    background: '#3B82F6',
                  }}
                />
              </div>
            </div>

            <div className="dash-cat-item">
              <div className="dash-cat-header">
                <span>Dipinjam / Digunakan</span>
                <strong>{stats.alatDipinjam} Unit ({stats.peralatan ? Math.round((stats.alatDipinjam / stats.peralatan) * 100) : 0}%)</strong>
              </div>
              <div className="dash-cat-bar">
                <div
                  className="dash-cat-progress"
                  style={{
                    width: `${stats.peralatan ? (stats.alatDipinjam / stats.peralatan) * 100 : 0}%`,
                    background: '#F59E0B',
                  }}
                />
              </div>
            </div>

            <div className="dash-cat-item">
              <div className="dash-cat-header">
                <span>Rusak / Perlu Penanganan</span>
                <strong>{stats.alatRusak} Unit ({stats.peralatan ? Math.round((stats.alatRusak / stats.peralatan) * 100) : 0}%)</strong>
              </div>
              <div className="dash-cat-bar">
                <div
                  className="dash-cat-progress"
                  style={{
                    width: `${stats.peralatan ? (stats.alatRusak / stats.peralatan) * 100 : 0}%`,
                    background: '#EF4444',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card card-padded">
          <div className="dash-card-header-row">
            <div>
              <h2 className="card-title dash-section-title">Tahapan Verifikasi</h2>
              <p className="page-subtitle">Status proses dan tindak lanjut setiap pengajuan</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/verifikasi')}>
              Buka Verifikasi
            </button>
          </div>
          <ProcessSummary peralatan={loading ? [] : stats.processItems} />
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
  const [loans, setLoans] = useState(DEFAULT_LOAN_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [n, p, loanData] = await Promise.allSettled([
          notificationApi.getByUserId(user?.user_id),
          peralatanApi.getAll(),
          fetchDashboardLoans(),
        ]);
        if (n.status === 'fulfilled') setNotifications(n.value.data || []);
        if (p.status === 'fulfilled') setPeralatan(p.value.data || []);
        if (loanData.status === 'fulfilled' && loanData.value) setLoans(loanData.value);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.user_id]);

  const unread = notifications.filter((n) => !n.is_read);
  const aktif = peralatan.filter((p) => p.status_alat === 'Aktif').length;
  const kalibrasi = peralatan.filter((p) => p.status_alat === 'Dalam Kalibrasi').length;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard Manager Lab</h1>
        <p className="page-subtitle">Selamat datang, <strong>{user?.name}</strong>. Pantau kondisi peralatan di laboratorium Anda.</p>
      </div>

      <div className="stats-grid dash-stats-mb">
        <div className="stat-card accent-red">
          <div className="stat-icon red"><Package size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton skeleton-stat" /> : peralatan.length}</div>
          <div className="stat-label">Total Peralatan</div>
        </div>
        <div className="stat-card accent-green">
          <div className="stat-icon green"><Package size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton skeleton-stat" /> : aktif}</div>
          <div className="stat-label">Peralatan Aktif</div>
        </div>
        <div className="stat-card accent-blue">
          <div className="stat-icon blue"><RefreshCw size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton skeleton-stat" /> : kalibrasi}</div>
          <div className="stat-label">Dalam Kalibrasi</div>
        </div>
        <div className="stat-card accent-amber">
          <div className="stat-icon amber"><Bell size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton skeleton-stat" /> : unread.length}</div>
          <div className="stat-label">Notifikasi Baru</div>
        </div>
      </div>

      {/* Ringkasan 5 Kotak Alur Peminjaman Peralatan (TLKM13/IK/005) */}
      <LoanPipelineSummary loans={loans} onNavigate={onNavigate} loading={loading} />

      {/* Notifikasi terbaru */}
      {!loading && unread.length > 0 && (
        <div className="card dash-card-mb">
          <div className="card-header">
            <h2 className="card-title">Notifikasi Terbaru</h2>
            <span className="badge badge-red">{unread.length} belum dibaca</span>
          </div>
          <div className="notif-list-container">
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
          <div style={{ padding: '0 var(--sp-4) var(--sp-4)', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/verifikasi')}>
              Buka Proses Verifikasi
            </button>
          </div>
        </div>
      )}

      <div className="card card-padded">
        <div className="dash-card-header-row">
          <div>
            <h2 className="card-title">Tahapan Proses Peralatan</h2>
            <p className="page-subtitle">Pantau verifikasi dari pengajuan PIC sampai keputusan manager.</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/verifikasi')}>
            Buka Verifikasi
          </button>
        </div>
        {loading ? <div className="skeleton-list">{[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}</div> : (
          <ProcessSummary peralatan={peralatan} />
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
  const [loans, setLoans] = useState(DEFAULT_LOAN_DATA);
  const [loading, setLoading] = useState(true);
  const [detailLoadError, setDetailLoadError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        fetchDashboardLoans().then(setLoans);
        const res = await peralatanApi.getAll();
        const equipmentList = res.data || [];
        const detailedItems = [];
        let failedDetailRequests = 0;

        for (let index = 0; index < equipmentList.length; index += 8) {
          const batch = equipmentList.slice(index, index + 8);
          const results = await Promise.allSettled(batch.map(async (equipment) => {
            if (!equipment.nomor_aset) return equipment;
            const detailResponse = await peralatanApi.getByAssetNumber(equipment.nomor_aset);
            return { ...equipment, detail: detailResponse.data?.data?.detail || null };
          }));

          results.forEach((result, batchIndex) => {
            if (result.status === 'fulfilled') {
              detailedItems.push(result.value);
            } else {
              failedDetailRequests += 1;
              detailedItems.push(batch[batchIndex]);
              console.warn(`Gagal memuat jadwal peralatan ${batch[batchIndex].nomor_aset || batchIndex + 1}:`, result.reason);
            }
          });
        }

        detailedItems.sort((a, b) => {
          const dueA = getCalibrationDueDate(a);
          const dueB = getCalibrationDueDate(b);
          if (!dueA && !dueB) return String(a.nama_peralatan || '').localeCompare(String(b.nama_peralatan || ''));
          if (!dueA) return 1;
          if (!dueB) return -1;
          return dueA.getTime() - dueB.getTime();
        });

        setPeralatan(detailedItems);
        setDetailLoadError(failedDetailRequests > 0);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard Staff Lab</h1>
        <p className="page-subtitle">Selamat datang, <strong>{user?.name}</strong>.</p>
      </div>

      <div className="stats-grid dash-stats-mb">
        <div className="stat-card accent-red">
          <div className="stat-icon red"><Package size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton skeleton-stat" /> : peralatan.length}</div>
          <div className="stat-label">Total Peralatan</div>
        </div>
        <div className="stat-card accent-green">
          <div className="stat-icon green"><Package size={20} /></div>
          <div className="stat-value">{loading ? <div className="skeleton skeleton-stat" /> : peralatan.filter(p => p.status_alat === 'Aktif').length}</div>
          <div className="stat-label">Peralatan Aktif</div>
        </div>
      </div>

      {/* Ringkasan 5 Kotak Alur Peminjaman Peralatan (TLKM13/IK/005) */}
      <LoanPipelineSummary loans={loans} onNavigate={onNavigate} loading={loading} />

      {can(ACCESS.INPUT_EQUIPMENT, ACTIONS.ADD, user) && (
        <div className="dash-action-group dash-actions-mb">
          <button className="btn btn-primary" onClick={() => onNavigate('/peralatan/tambah')} id="btn-tambah-peralatan-staff">
            <Plus size={16} /> Tambah Peralatan Baru
          </button>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Prioritas Kalibrasi & Tahapan Proses</h2>
            <p className="page-subtitle">Diurutkan dari tanggal jatuh tempo terdekat; jadwal yang belum tersedia ditampilkan terakhir.</p>
          </div>
        </div>
        {detailLoadError && (
          <div className="alert alert-warning" role="status" style={{ margin: '0 var(--sp-4) var(--sp-3)' }}>
            Sebagian jadwal jatuh tempo gagal dimuat. Tanggal tersebut mungkin belum tampil di daftar.
          </div>
        )}
        {loading ? (
          <div className="skeleton-list">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        ) : peralatan.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={28} /></div>
            <p className="empty-state-title">Belum ada peralatan terdaftar</p>
          </div>
        ) : (
          <div className="table-wrapper table-borderless">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Peralatan</th>
                  <th>No. Aset</th>
                  <th>Jatuh Tempo</th>
                  <th>Status Proses</th>
                </tr>
              </thead>
              <tbody>
                {peralatan.map((p) => {
                  const dueDate = getCalibrationDueDate(p);
                  const process = getProcessStage(p);
                  return (
                    <tr key={p.id} className="cursor-pointer" onClick={() => onNavigate(`/peralatan/detail/${p.id}`)}>
                      <td style={{ fontWeight: 'var(--fw-medium)' }}>{p.nama_peralatan}</td>
                      <td><code className="text-mono-xs">{p.nomor_aset}</code></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                          <span className={`badge ${getDueDateBadgeClass(dueDate)}`}>{formatDueDate(dueDate)}</span>
                          {dueDate && <small style={{ color: 'var(--clr-dark-500)' }}>{dueDate.toLocaleDateString('id-ID')}</small>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                          <span className={`badge ${process.tone}`}>{process.label}</span>
                          <small style={{ color: 'var(--clr-dark-500)' }}>{process.description}</small>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function ProcessSummary({ peralatan }) {
  const stages = [
    { status: 'Belum Diverifikasi', label: 'Belum dimulai', description: 'PIC perlu melakukan pemeriksaan', icon: ClipboardCheck, tone: 'gray' },
    { status: 'Draft', label: 'Draft', description: 'Pengajuan belum dikirim ke manager', icon: Clock3, tone: 'blue' },
    { status: 'Diajukan', label: 'Menunggu keputusan', description: 'Menunggu persetujuan manager', icon: Clock3, tone: 'amber' },
    { status: 'Ditolak', label: 'Perlu tindak lanjut', description: 'PIC perlu memperbaiki dan mengajukan ulang', icon: AlertTriangle, tone: 'red' },
    { status: 'Disetujui', label: 'Selesai disetujui', description: 'Verifikasi telah disetujui manager', icon: CheckCircle2, tone: 'green' },
  ];

  return (
    <div className="dash-process-grid">
      {stages.map(({ status, label, description, icon: Icon, tone }) => (
        <div className={`dash-process-card ${tone}`} key={status}>
          <div className="dash-process-icon"><Icon size={18} /></div>
          <div className="dash-process-count">{peralatan.filter((item) => (item.status_verifikasi || 'Belum Diverifikasi') === status).length}</div>
          <div className="dash-process-label">{label}</div>
          <div className="dash-process-description">{description}</div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------
// Status Badge helper
// ------------------------------------------------------------------
