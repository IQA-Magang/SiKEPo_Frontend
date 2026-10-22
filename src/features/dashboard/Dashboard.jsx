import React, { useState, useEffect } from 'react';
import { Package, Building2, DoorOpen, Users, Plus, Bell, RefreshCw, ClipboardCheck, AlertTriangle, Clock3, CheckCircle2, CalendarDays, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCurrentUser, usersApi, labsApi, ruanganApi, kelompokAssetApi, peralatanApi, jadwalPemeriksaanBerkalaApi, notificationApi } from '../../shared/services/api.js';
import { can, ACCESS, ACTIONS } from '../../shared/utils/permissions.js';
import DataTable from '../../shared/components/ui/DataTable.jsx';
import { Button, Badge, Card, PageHeader, LoadingState, ErrorState, EmptyState } from '../../shared/components/ui/index.js';

// ------------------------------------------------------------------
// Dashboard: tampilan berbeda berdasarkan role
// ------------------------------------------------------------------
export default function Dashboard({ onNavigate }) {
  const user = getCurrentUser();
  const role = user?.role || 'staff';

  return (
    <div className="page-container fade-in-up">
      {role === 'admin'   && <AdminDashboard onNavigate={onNavigate} />}
      {role === 'manager' && <ManagerDashboard onNavigate={onNavigate} user={user} />}
      {role === 'staff'   && <StaffDashboard onNavigate={onNavigate} user={user} />}
      <ScheduleDateCards onNavigate={onNavigate} />
    </div>
  );
}

function ScheduleDateCards({ onNavigate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateKey(new Date()));

  useEffect(() => {
    async function load() {
      try {
        const [scheduleResponse, equipmentResponse] = await Promise.all([
          jadwalPemeriksaanBerkalaApi.getAll(),
          peralatanApi.getAll(),
        ]);
        if (!Array.isArray(scheduleResponse?.data) || !Array.isArray(equipmentResponse?.data)) {
          throw new Error('Format data jadwal atau peralatan tidak valid.');
        }
        const equipmentById = new Map(
          equipmentResponse.data.map((equipment) => [
            String(equipment.id ?? equipment.peralatan_id),
            equipment,
          ])
        );
        const schedules = scheduleResponse.data
          .map((schedule) => ({
            ...schedule,
            equipment: equipmentById.get(String(schedule.peralatan_id)),
            dueDate: schedule.tanggal_jatuh_tempo ? String(schedule.tanggal_jatuh_tempo).slice(0, 10) : '',
          }))
          .filter((schedule) => !schedule.dueDate || !Number.isNaN(new Date(`${schedule.dueDate}T00:00:00`).getTime()))
          .sort((first, second) => first.dueDate.localeCompare(second.dueDate));
        setItems(schedules);
        setLoadError('');
      } catch (err) {
        console.error('Gagal memuat kalender jadwal dashboard:', err);
        setLoadError(err.message || 'Gagal memuat jadwal pemeriksaan.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const scheduleTypeLabels = {
    kalibrasi: 'Kalibrasi',
    verifikasi_fungsi: 'Verifikasi Fungsi',
    pengecekan_antara: 'Pengecekan Antara',
    pemeliharaan: 'Pemeliharaan',
  };
  const monthLabel = visibleMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const firstDayOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const calendarStart = new Date(
    firstDayOfMonth.getFullYear(),
    firstDayOfMonth.getMonth(),
    1 - ((firstDayOfMonth.getDay() + 6) % 7)
  );
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart.getFullYear(), calendarStart.getMonth(), calendarStart.getDate() + index);
    return { date, key: getLocalDateKey(date) };
  });
  const schedulesByDate = new Map();
  items.forEach((schedule) => {
    if (!schedule.dueDate) return;
    const scheduledOnDate = schedulesByDate.get(schedule.dueDate) || [];
    scheduledOnDate.push(schedule);
    schedulesByDate.set(schedule.dueDate, scheduledOnDate);
  });
  const selectedDateValue = new Date(`${selectedDate}T00:00:00`);
  const selectedDateLabel = Number.isNaN(selectedDateValue.getTime())
    ? selectedDate
    : selectedDateValue.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const selectedSchedules = schedulesByDate.get(selectedDate) || [];

  function changeMonth(offset) {
    setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + offset, 1));
  }

  function selectDate(date, key) {
    setSelectedDate(key);
    if (date.getMonth() !== visibleMonth.getMonth() || date.getFullYear() !== visibleMonth.getFullYear()) {
      setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }

  return (
    <section className="dashboard-schedule-section" aria-labelledby="dashboard-schedule-title">
      <div className="dashboard-schedule-heading">
        <div>
          <h2 className="card-title" id="dashboard-schedule-title">Kalender Pemeriksaan</h2>
          <p className="page-subtitle">Pilih tanggal untuk melihat jadwal pemeriksaan peralatan.</p>
        </div>
        <Button variant="secondary" size="sm" icon={<ArrowRight size={14} />} onClick={() => onNavigate('/penjadwalan')}>
          Semua jadwal
        </Button>
      </div>

      {loadError ? (
        <ErrorState title="Gagal memuat kalender" message={loadError} onRetry={() => window.location.reload()} />
      ) : loading ? (
        <LoadingState message="Memuat kalender pemeriksaan..." />
      ) : (
        <div className="dashboard-calendar">
          <div className="dashboard-calendar-toolbar">
            <div className="dashboard-calendar-month">{monthLabel}</div>
            <div className="dashboard-calendar-controls">
              <Button variant="secondary" size="sm" onClick={() => changeMonth(-1)} aria-label="Bulan sebelumnya">
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  setSelectedDate(getLocalDateKey(today));
                }}
              >
                Hari ini
              </Button>
              <Button variant="secondary" size="sm" onClick={() => changeMonth(1)} aria-label="Bulan berikutnya">
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          <div className="dashboard-calendar-grid" aria-label={`Kalender ${monthLabel}`}>
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => (
              <div className="dashboard-calendar-weekday" key={day}>{day}</div>
            ))}
            {calendarDays.map(({ date, key }) => {
              const daySchedules = schedulesByDate.get(key) || [];
              const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
              const isToday = key === getLocalDateKey(new Date());
              const isSelected = key === selectedDate;
              return (
                <button
                  className={`dashboard-calendar-day${isCurrentMonth ? '' : ' is-outside-month'}${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}${daySchedules.length ? ' has-schedules' : ''}`}
                  key={key}
                  onClick={() => selectDate(date, key)}
                  aria-pressed={isSelected}
                  aria-label={`${date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}${daySchedules.length ? `, ${daySchedules.length} jadwal` : ''}`}
                >
                  <span className="dashboard-calendar-day-number">{date.getDate()}</span>
                  {daySchedules.length > 0 && (
                    <span className="dashboard-calendar-event-count">
                      <span className="dashboard-calendar-event-dot" />
                      {daySchedules.length} jadwal
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="dashboard-calendar-agenda">
            <div className="dashboard-calendar-agenda-heading">
              <h3>{selectedDateLabel}</h3>
              <Badge tone={selectedSchedules.length > 0 ? 'info' : 'neutral'}>{selectedSchedules.length} jadwal</Badge>
            </div>
            {selectedSchedules.length ? (
              <div className="dashboard-calendar-agenda-list">
                {selectedSchedules.map((schedule) => {
                  const dueDate = new Date(`${schedule.dueDate}T00:00:00`);
                  return (
                    <div className="dashboard-calendar-agenda-row" key={schedule.id}>
                      <div className={`dashboard-calendar-agenda-marker ${getDueDateBadgeClass(dueDate)}`} />
                      <div className="dashboard-calendar-agenda-info">
                        <strong>{schedule.equipment?.nama_peralatan || `Peralatan #${schedule.peralatan_id}`}</strong>
                        <span>
                          {schedule.equipment?.nomor_aset || 'Nomor aset tidak tersedia'}
                          {' · '}
                          {scheduleTypeLabels[schedule.jenis_jadwal] || schedule.jenis_jadwal || 'Pemeriksaan'}
                          {schedule.peran_jadwal ? ` · ${schedule.peran_jadwal}` : ''}
                        </span>
                      </div>
                      <Badge tone={getDueDateBadgeTone(dueDate)}>{formatDueDate(dueDate)}</Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="dashboard-calendar-no-events">
                <CalendarDays size={18} />
                <span>Tidak ada jadwal pada tanggal ini.</span>
                {items.length === 0 && (
                  <Button variant="primary" size="sm" onClick={() => onNavigate('/penjadwalan')}>
                    Buat Jadwal
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getProcessStage(equipment) {
  switch (equipment.status_verifikasi) {
    case 'Disetujui':
      return { label: 'Verifikasi selesai', description: 'Persetujuan manager sudah diberikan', tone: 'badge-aktif', badgeTone: 'success' };
    case 'Diajukan':
      return { label: 'Menunggu persetujuan', description: 'Pengajuan sedang menunggu manager', tone: 'badge-kalibrasi', badgeTone: 'warning' };
    case 'Ditolak':
      return { label: 'Perlu tindak lanjut', description: 'Perbaiki catatan lalu ajukan ulang', tone: 'badge-rusak', badgeTone: 'danger' };
    case 'Draft':
      return { label: 'Draft verifikasi', description: 'Belum diajukan untuk persetujuan manager', tone: 'badge-gray', badgeTone: 'neutral' };
    case 'Belum Diverifikasi':
    default:
      return { label: 'Belum diverifikasi', description: 'PIC perlu memulai pemeriksaan alat', tone: 'badge-gray', badgeTone: 'neutral' };
  }
}

function getCalibrationDueDate(equipment) {
  const scheduleDate = equipment.jadwal_terdekat?.tanggal_jatuh_tempo;
  if (scheduleDate) {
    const parsedScheduleDate = new Date(`${String(scheduleDate).slice(0, 10)}T00:00:00`);
    if (!Number.isNaN(parsedScheduleDate.getTime())) return parsedScheduleDate;
  }
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

function getDueDateBadgeTone(date) {
  if (!date) return 'neutral';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((date.getTime() - today.getTime()) / 86400000);
  if (days <= 0) return 'danger';
  if (days <= 30) return 'warning';
  return 'success';
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
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [u, l, r, p, k] = await Promise.allSettled([
        usersApi.getAll(),
        labsApi.getAll(),
        ruanganApi.getAll(),
        peralatanApi.getAll(),
        kelompokAssetApi.getAll(),
      ]);

      const pList = p.status === 'fulfilled' ? (p.value.data || []) : [];
      const rusakCount = pList.filter(item => item.status_alat === 'Rusak').length;
      const aktifCount = pList.filter(item => item.status_alat === 'Aktif').length;
      const kalibrasiCount = pList.filter(item => item.status_alat === 'Dalam Kalibrasi').length;
      const dipinjamCount = pList.filter(item => item.status_alat === 'Dipinjam').length;

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
      <PageHeader
        title="Dashboard Administrator"
        subtitle="Ringkasan inventaris peralatan, personel, dan monitoring peminjaman laboratorium Telkom Test House"
        eyebrow="Live Data"
        actions={(
          <>
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => onNavigate('/peralatan/tambah')} id="btn-tambah-peralatan">
              Tambah Peralatan
            </Button>
          </>
        )}
      />

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

      {/* Level 2: Ringkasan kondisi peralatan */}
      <div className="dash-level2-grid">
        <Card title="Kondisi & Tata Kelola Peralatan">
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
        </Card>

        <Card
          title="Tahapan Verifikasi"
          subtitle="Status proses dan tindak lanjut setiap pengajuan"
          action={(
            <Button variant="secondary" size="sm" onClick={() => onNavigate('/verifikasi')}>
              Buka Verifikasi
            </Button>
          )}
        >
          <ProcessSummary peralatan={loading ? [] : stats.processItems} />
        </Card>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [n, p] = await Promise.allSettled([
          notificationApi.getByUserId(user?.user_id),
          peralatanApi.getAll(),
        ]);
        if (n.status === 'fulfilled') setNotifications(n.value.data || []);
        if (p.status === 'fulfilled') setPeralatan(p.value.data || []);
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
      <PageHeader
        title="Dashboard Manager Lab"
        subtitle={`Selamat datang, ${user?.name}. Pantau kondisi peralatan di laboratorium Anda.`}
      />

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

      {/* Notifikasi terbaru */}
      {loading ? (
        <LoadingState message="Memuat notifikasi dan status peralatan..." />
      ) : unread.length > 0 ? (
        <Card
          className="dash-card-mb"
          title="Notifikasi Terbaru"
          action={<Badge tone="danger">{unread.length} belum dibaca</Badge>}
        >
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
            <Button variant="secondary" size="sm" onClick={() => onNavigate('/verifikasi')}>
              Buka Proses Verifikasi
            </Button>
          </div>
        </Card>
      ) : (
        <EmptyState
          title="Tidak ada notifikasi baru"
          description="Semua pemberitahuan sudah dibaca atau belum ada aktivitas terbaru."
          icon={<Bell size={22} />}
          action={<Button variant="secondary" size="sm" onClick={() => onNavigate('/verifikasi')}>Lihat proses</Button>}
        />
      )}

      <Card
        title="Tahapan Proses Peralatan"
        subtitle="Pantau verifikasi dari pengajuan PIC sampai keputusan manager."
        action={(
          <Button variant="secondary" size="sm" onClick={() => onNavigate('/verifikasi')}>
            Buka Verifikasi
          </Button>
        )}
      >
        {loading ? <LoadingState message="Memuat tahapan proses peralatan..." /> : (
          <ProcessSummary peralatan={peralatan} />
        )}
      </Card>
    </>
  );
}

// ------------------------------------------------------------------
// Staff Dashboard
// ------------------------------------------------------------------
function StaffDashboard({ onNavigate, user }) {
  const [peralatan, setPeralatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoadError, setDetailLoadError] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [equipmentResult, scheduleResult] = await Promise.allSettled([
          peralatanApi.getAll(),
          jadwalPemeriksaanBerkalaApi.getAll(),
        ]);
        if (equipmentResult.status === 'rejected') throw equipmentResult.reason;
        if (!Array.isArray(equipmentResult.value?.data)) {
          throw new Error('Format respons daftar peralatan tidak valid.');
        }

        const equipmentList = equipmentResult.value.data;
        let scheduleLoadFailed = false;
        let schedules = [];
        if (scheduleResult.status === 'fulfilled') {
          if (!Array.isArray(scheduleResult.value?.data)) {
            throw new Error('Format respons daftar jadwal tidak valid.');
          }
          schedules = scheduleResult.value.data;
        } else {
          scheduleLoadFailed = true;
          console.error('Gagal memuat jadwal pemeriksaan berkala:', scheduleResult.reason);
        }

        const schedulesByEquipment = new Map();
        schedules.forEach((schedule) => {
          const key = String(schedule.peralatan_id);
          const current = schedulesByEquipment.get(key);
          const date = schedule.tanggal_jatuh_tempo;
          if (!current || (date && (!current.tanggal_jatuh_tempo || date < current.tanggal_jatuh_tempo))) {
            schedulesByEquipment.set(key, schedule);
          }
        });
        const scheduledItems = equipmentList.map((equipment) => ({
          ...equipment,
          jadwal_terdekat: schedulesByEquipment.get(String(equipment.id ?? equipment.peralatan_id)),
        }));
        scheduledItems.sort((a, b) => {
          const dueA = getCalibrationDueDate(a);
          const dueB = getCalibrationDueDate(b);
          if (!dueA && !dueB) return String(a.nama_peralatan || '').localeCompare(String(b.nama_peralatan || ''));
          if (!dueA) return 1;
          if (!dueB) return -1;
          return dueA.getTime() - dueB.getTime();
        });

        setPeralatan(scheduledItems);
        setDetailLoadError(scheduleLoadFailed);
        setLoadError('');
      } catch (err) {
        setLoadError(err.message || 'Gagal memuat daftar peralatan dan jadwal.');
        setPeralatan([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard Staff Lab"
        subtitle={`Selamat datang, ${user?.name}.`}
      />

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

      {can(ACCESS.INPUT_EQUIPMENT, ACTIONS.ADD, user) && (
        <div className="dash-action-group dash-actions-mb">
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => onNavigate('/peralatan/tambah')} id="btn-tambah-peralatan-staff">
            Tambah Peralatan Baru
          </Button>
        </div>
      )}

      <Card
        title="Prioritas Pemeriksaan & Tahapan Proses"
        action={(
          <Button variant="secondary" size="sm" onClick={() => onNavigate('/penjadwalan')}>
            Buka Penjadwalan
          </Button>
        )}
      >
        {loadError && (
          <ErrorState title="Gagal memuat data" message={loadError} onRetry={() => window.location.reload()} />
        )}
        {detailLoadError && (
          <ErrorState
            title="Jadwal pemeriksaan tidak lengkap"
            message="Jadwal pemeriksaan berkala gagal dimuat. Tanggal dari data lama mungkin masih ditampilkan."
            variant={undefined}
          />
        )}
        {loading ? (
          <LoadingState message="Memuat prioritas pemeriksaan dan proses..." />
        ) : peralatan.length === 0 ? (
          <EmptyState
            title="Belum ada peralatan terdaftar"
            description="Tambahkan peralatan baru untuk mulai memantau jadwal pemeriksaan dan status proses."
            icon={<Package size={28} />}
            action={can(ACCESS.INPUT_EQUIPMENT, ACTIONS.ADD, user) ? <Button variant="primary" size="sm" onClick={() => onNavigate('/peralatan/tambah')}>Tambah Peralatan</Button> : null}
          />
        ) : (
          <DataTable
            wrapperClassName="table-borderless"
            rows={peralatan}
            rowKey={(equipment) => equipment.id}
            rowProps={(equipment) => ({
              className: 'cursor-pointer',
              onClick: () => onNavigate(`/peralatan/detail/${equipment.id}?returnTo=${encodeURIComponent('/dashboard')}`),
            })}
            columns={[
              { key: 'name', header: 'Nama Peralatan', cellStyle: { fontWeight: 'var(--fw-medium)' }, render: (equipment) => equipment.nama_peralatan },
              { key: 'asset', header: 'No. Aset', render: (equipment) => <code className="text-mono-xs">{equipment.nomor_aset}</code> },
              {
                key: 'due-date',
                header: 'Jatuh Tempo',
                render: (equipment) => {
                  const dueDate = getCalibrationDueDate(equipment);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                      <Badge tone={getDueDateBadgeTone(dueDate)}>{formatDueDate(dueDate)}</Badge>
                      {dueDate && <small style={{ color: 'var(--clr-dark-500)' }}>{dueDate.toLocaleDateString('id-ID')}</small>}
                    </div>
                  );
                },
              },
              {
                key: 'process',
                header: 'Status Proses',
                render: (equipment) => {
                  const process = getProcessStage(equipment);
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                      <Badge tone={process.badgeTone || 'neutral'}>{process.label}</Badge>
                      <small style={{ color: 'var(--clr-dark-500)' }}>{process.description}</small>
                    </div>
                  );
                },
              },
            ]}
          />
        )}
      </Card>
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
