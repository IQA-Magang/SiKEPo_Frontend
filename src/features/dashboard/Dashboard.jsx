import React, { useState, useEffect } from 'react';
import { Package, Building2, DoorOpen, Users, Plus, Bell, RefreshCw, ClipboardCheck, AlertTriangle, Clock3, CheckCircle2, CalendarDays, ArrowRight, ChevronLeft, ChevronRight, FileSignature } from 'lucide-react';
import { getCurrentUser, getEquipmentCategoryId, STATIC_EQUIPMENT_CATEGORIES, usersApi, labsApi, ruanganApi, kelompokAssetApi, peralatanApi, kategoriPeralatanApi, notificationApi, peminjamanApi, markNotificationsAsReadByRef, kalibrasiApi, verifikasiFungsiApi } from '../../shared/services/api.js';
import { can, ACCESS, ACTIONS } from '../../shared/utils/permissions.js';
import DataTable from '../../shared/components/ui/DataTable.jsx';

// ------------------------------------------------------------------
// Dashboard: tampilan berbeda berdasarkan role
// ------------------------------------------------------------------
export default function Dashboard({ onNavigate }) {
  const user = getCurrentUser();
  const role = user?.role || 'staff';

  return (
    <div className="page-container fade-in-up">
      {role === 'admin' ? (
        <AdminDashboard onNavigate={onNavigate} />
      ) : (
        <>
          <ScheduleDateCards onNavigate={onNavigate} />
          {role === 'manager' && <ManagerDashboard onNavigate={onNavigate} user={user} />}
          {role === 'staff' && <StaffDashboard onNavigate={onNavigate} user={user} />}
        </>
      )}
    </div>
  );
}

function ScheduleDateCards({ onNavigate }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
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
        const [equipmentResponse, categoryResponse, loanResponse] = await Promise.all([
          peralatanApi.getAll(),
          kategoriPeralatanApi.getAll(),
          peminjamanApi.getAll(),
        ]);
        if (
          !Array.isArray(equipmentResponse?.data) ||
          !Array.isArray(categoryResponse?.data) ||
          !Array.isArray(loanResponse?.data)
        ) {
          throw new Error('Format data peminjaman, peralatan, atau kategori tidak valid.');
        }
        const equipmentById = new Map(
          equipmentResponse.data.map((equipment) => [
            String(equipment.id ?? equipment.peralatan_id),
            equipment,
          ])
        );
        const periodicEquipment = equipmentResponse.data.filter((equipment) =>
          [1, 2].includes(getEquipmentCategoryId(equipment))
        );
        const periodicCycleResults = await Promise.all(periodicEquipment.map(async (equipment) => {
          const equipmentId = equipment.id ?? equipment.peralatan_id;
          const categoryId = getEquipmentCategoryId(equipment);
          const [calibrationResponse, verificationResponse] = await Promise.all([
            kalibrasiApi.getByEquipment(equipmentId),
            verifikasiFungsiApi.getByEquipment(equipmentId),
          ]);
          if (!Array.isArray(calibrationResponse?.data) || !Array.isArray(verificationResponse?.data)) {
            throw new Error(`Format histori pemeriksaan berkala tidak valid untuk ${equipment.nama_peralatan || 'peralatan'}.`);
          }
          const toEvents = (records, kind, eventLabel, scheduleType) => records
            .filter((cycle) => ['direncanakan', 'dalam_proses'].includes(cycle.status))
            .map((cycle) => {
              const dueDate = kind === 'calibration-cycle'
                ? cycle.tgl_jatuh_tempo || cycle.perkiraan_kembali || cycle.tanggal_keluar
                : cycle.tgl_jatuh_tempo;
              const normalizedDueDate = dueDate ? String(dueDate).slice(0, 10) : '';
              return {
                ...cycle,
                id: `periodic-${kind}-${cycle.id}`,
                cycleId: cycle.id,
                kind,
                jenis_jadwal: scheduleType,
                eventLabel,
                equipment,
                categoryId: String(categoryId),
                startDate: normalizedDueDate,
                endDate: normalizedDueDate,
                dueDate: normalizedDueDate,
              };
            })
            .filter((cycle) =>
              cycle.dueDate &&
              !Number.isNaN(new Date(`${cycle.dueDate}T00:00:00`).getTime())
            );
          return [
            ...toEvents(calibrationResponse.data, 'calibration-cycle', 'Kalibrasi', 'kalibrasi'),
            ...toEvents(verificationResponse.data, 'verification-cycle', 'Verifikasi Fungsi', 'verifikasi_fungsi'),
          ];
        }));
        setCategories(
          STATIC_EQUIPMENT_CATEGORIES.map((category) => {
            const backendCategory = categoryResponse.data.find(
              (item) => String(item.id) === String(category.id)
            );
            return {
              id: category.id,
              nama_kategori: backendCategory?.nama_kategori || category.label,
            };
          })
        );
        const periodicSchedules = periodicCycleResults.flat();
        const activeLoanStatuses = new Set([
          'MENUNGGU_MANAGER_PEMINJAM',
          'MENUNGGU_PENGELOLA',
          'MENUNGGU_MANAGER_LAB',
          'DISETUJUI',
          'SIAP_DISERAHKAN',
          'SEDANG_DIPINJAM',
        ]);
        const loanSchedules = loanResponse.data
          .filter((loan) => activeLoanStatuses.has(String(loan.status || '').toUpperCase()))
          .map((loan) => {
            const equipment = equipmentById.get(String(loan.peralatan_id ?? loan.peralatan?.id))
              || loan.peralatan;
            const categoryId = getEquipmentCategoryId(equipment)
              ?? Number(equipment?.kategori_peralatan?.id ?? equipment?.kategori?.id);
            const startDate = loan.rencana_tanggal_keluar
              ? String(loan.rencana_tanggal_keluar).slice(0, 10)
              : '';
            const endDate = loan.rencana_tanggal_kembali
              ? String(loan.rencana_tanggal_kembali).slice(0, 10)
              : '';
            return {
              ...loan,
              id: `loan-${loan.id}`,
              kind: 'loan',
              eventLabel: 'Peminjaman',
              equipment,
              categoryId: Number.isInteger(categoryId) && categoryId > 0 ? String(categoryId) : '',
              startDate,
              endDate,
              dueDate: endDate,
            };
          })
          .filter((schedule) =>
            schedule.startDate &&
            schedule.endDate &&
            schedule.startDate <= schedule.endDate &&
            !Number.isNaN(new Date(`${schedule.startDate}T00:00:00`).getTime()) &&
            !Number.isNaN(new Date(`${schedule.endDate}T00:00:00`).getTime())
          );
        const schedules = [...periodicSchedules, ...loanSchedules]
          .sort((first, second) => first.startDate.localeCompare(second.startDate));
        setItems(schedules);
        setSelectedCategoryId('all');
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

  const filteredItems = selectedCategoryId === 'all'
    ? items
    : items.filter((schedule) => schedule.categoryId === selectedCategoryId);
  const scheduleTypeLabels = {
    kalibrasi: 'Kalibrasi',
    verifikasi_fungsi: 'Verifikasi Fungsi',
  };
  const loanStatusLabels = {
    MENUNGGU_MANAGER_PEMINJAM: 'Menunggu persetujuan atasan peminjam',
    MENUNGGU_PENGELOLA: 'Menunggu persetujuan pengelola',
    MENUNGGU_MANAGER_LAB: 'Menunggu persetujuan manager lab',
    DISETUJUI: 'Disetujui',
    SIAP_DISERAHKAN: 'Siap diserahkan',
    SEDANG_DIPINJAM: 'Sedang dipinjam',
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
  filteredItems.forEach((schedule) => {
    const start = new Date(`${schedule.startDate}T00:00:00`);
    const end = new Date(`${schedule.endDate}T00:00:00`);
    for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateKey = getLocalDateKey(date);
      const scheduledOnDate = schedulesByDate.get(dateKey) || [];
      scheduledOnDate.push(schedule);
      schedulesByDate.set(dateKey, scheduledOnDate);
    }
  });
  const selectedDateValue = new Date(`${selectedDate}T00:00:00`);
  const selectedDateLabel = Number.isNaN(selectedDateValue.getTime())
    ? selectedDate
    : selectedDateValue.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const selectedSchedules = schedulesByDate.get(selectedDate) || [];

  function changeMonth(offset) {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    setVisibleMonth(nextMonth);
    setSelectedDate(getLocalDateKey(nextMonth));
  }

  function selectDate(date, key) {
    setSelectedDate(key);
    if (date.getMonth() !== visibleMonth.getMonth() || date.getFullYear() !== visibleMonth.getFullYear()) {
      setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }

  function openPeriodicCycle(schedule) {
    const path = schedule.kind === 'calibration-cycle'
      ? '/pemeriksaan/kalibrasi'
      : '/pemeriksaan/verifikasi-fungsi';
    const action = schedule.kind === 'calibration-cycle' && schedule.status === 'direncanakan'
      ? 'checkout'
      : 'result';
    onNavigate(`${path}?cycleId=${encodeURIComponent(schedule.cycleId)}&action=${action}`);
  }

  return (
    <section className="dashboard-schedule-section" aria-labelledby="dashboard-schedule-title">
      <div className="dashboard-schedule-heading">
        <div>
          <h2 className="card-title" id="dashboard-schedule-title">Kalender Pemeriksaan Berkala Peralatan</h2>
          <p className="page-subtitle">Pilih bulan dan tanggal untuk melihat peralatan yang perlu diperiksa.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/penjadwalan')}>
          Semua jadwal <ArrowRight size={14} />
        </button>
      </div>

      {loadError ? (
        <div className="alert alert-warning" role="alert">{loadError}</div>
      ) : loading ? (
        <div className="card-padded" role="status">Memuat kalender pemeriksaan...</div>
      ) : (
        <div className="dashboard-calendar">
          <div className="dashboard-category-tabs" role="group" aria-label="Pilih kategori peralatan">
            <button
              className={`dashboard-category-tab${selectedCategoryId === 'all' ? ' is-active' : ''}`}
              type="button"
              aria-pressed={selectedCategoryId === 'all'}
              onClick={() => setSelectedCategoryId('all')}
            >
              <Package size={17} />
              <span>Semua kategori</span>
              <span className="dashboard-category-tab-count">{items.length}</span>
            </button>
            {categories.map((category) => {
              const categoryId = String(category.id);
              const count = items.filter((schedule) => schedule.categoryId === categoryId).length;
              const isSelected = selectedCategoryId === categoryId;
              return (
                <button
                  className={`dashboard-category-tab dashboard-category-tab--${categoryId}${isSelected ? ' is-active' : ''}`}
                  id={`dashboard-category-tab-${categoryId}`}
                  key={categoryId}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedCategoryId(categoryId)}
                >
                  <Package size={17} />
                  <span>{category.nama_kategori}</span>
                  <span className="dashboard-category-tab-count">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="dashboard-calendar-toolbar">
            <div className="dashboard-calendar-month">{monthLabel}</div>
            <div className="dashboard-calendar-controls">
              <button className="btn btn-secondary btn-sm" onClick={() => changeMonth(-1)} aria-label="Bulan sebelumnya">
                <ChevronLeft size={16} />
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const today = new Date();
                  setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  setSelectedDate(getLocalDateKey(today));
                }}
              >
                Hari ini
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => changeMonth(1)} aria-label="Bulan berikutnya">
                <ChevronRight size={16} />
              </button>
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
              <span>{selectedSchedules.length} jadwal</span>
            </div>
            {selectedSchedules.length ? (
              <div className="dashboard-calendar-agenda-list">
                {selectedSchedules.map((schedule) => {
                  const dueDate = new Date(`${schedule.dueDate}T00:00:00`);
                  const isPeriodicCycle = ['calibration-cycle', 'verification-cycle'].includes(schedule.kind);
                  const agendaContent = (
                    <>
                      <div className={`dashboard-calendar-agenda-marker ${getDueDateBadgeClass(dueDate)}`} />
                      <div className="dashboard-calendar-agenda-info">
                        <strong>{schedule.equipment?.nama_peralatan || `Peralatan #${schedule.peralatan_id}`}</strong>
                        <span>
                          {schedule.equipment?.nomor_aset || 'Nomor aset tidak tersedia'}
                          {' · '}
                          {schedule.kind === 'loan'
                            ? `${schedule.eventLabel} · ${loanStatusLabels[schedule.status] || schedule.status}`
                            : schedule.eventLabel || scheduleTypeLabels[schedule.jenis_jadwal] || schedule.jenis_jadwal || 'Pemeriksaan'}
                          {schedule.kind === 'loan'
                            ? ` · ${schedule.startDate} s.d. ${schedule.endDate}`
                            : ''}
                          {isPeriodicCycle ? ` · ${schedule.status === 'dalam_proses' ? 'Sedang diproses' : 'Direncanakan'}` : ''}
                          {schedule.peran_jadwal ? ` · ${schedule.peran_jadwal}` : ''}
                        </span>
                      </div>
                      <span className={`badge ${schedule.kind === 'loan' ? 'badge-dipinjam' : schedule.kind === 'inspection-approved' ? 'badge-aktif' : getDueDateBadgeClass(dueDate)}`}>
                        {schedule.kind === 'inspection-approved'
                          ? 'Disetujui'
                          : schedule.kind === 'loan'
                          ? selectedDate === schedule.startDate
                            ? 'Mulai'
                            : selectedDate === schedule.endDate
                              ? 'Pengembalian'
                              : 'Berlangsung'
                          : formatDueDate(dueDate)}
                      </span>
                    </>
                  );
                  return isPeriodicCycle ? (
                    <button
                      type="button"
                      className="dashboard-calendar-agenda-row is-actionable"
                      key={schedule.id}
                      onClick={() => openPeriodicCycle(schedule)}
                      aria-label={`Buka catat hasil ${schedule.eventLabel} untuk ${schedule.equipment?.nama_peralatan || 'peralatan'}`}
                    >
                      {agendaContent}
                    </button>
                  ) : (
                    <div className="dashboard-calendar-agenda-row" key={schedule.id}>
                      {agendaContent}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="dashboard-calendar-no-events">
                <CalendarDays size={18} />
                <span>Tidak ada jadwal pada tanggal ini.</span>
                {filteredItems.length === 0 && (
                  <button className="btn btn-primary btn-sm" onClick={() => onNavigate('/penjadwalan')}>Buat Jadwal</button>
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

function getLoanStatusBadge(status) {
  switch (status) {
    case 'MENUNGGU_MANAGER_PEMINJAM':
      return { label: 'Menunggu Atasan Peminjam', className: 'badge-kalibrasi' };
    case 'MENUNGGU_PENGELOLA':
      return { label: 'Menunggu Pengelola', className: 'badge-kalibrasi' };
    case 'MENUNGGU_MANAGER_LAB':
      return { label: 'Menunggu Manager Lab', className: 'badge-kalibrasi' };
    case 'DISETUJUI':
    case 'MENUNGGU_SERAH_TERIMA':
      return { label: 'Disetujui — Tunggu Serah Terima', className: 'badge-kalibrasi' };
    case 'SIAP_DISERAHKAN':
      return { label: 'Siap Diserahkan — Tunggu TTD Anda', className: 'badge-rusak' };
    case 'SEDANG_DIPINJAM':
      return { label: 'Sedang Dipinjam', className: 'badge-aktif' };
    case 'SELESAI':
      return { label: 'Selesai Dikembalikan', className: 'badge-gray' };
    case 'DITOLAK':
      return { label: 'Ditolak', className: 'badge-rusak' };
    default:
      return { label: status || '-', className: 'badge-gray' };
  }
}

function LoanPipelineSummary({ loans = [], onNavigate, loading = false }) {
  const total = loans.length;
  const tahap1 = loans.filter((l) => l.status === 'MENUNGGU_MANAGER_PEMINJAM').length;
  const tahap2 = loans.filter((l) => l.status === 'MENUNGGU_PENGELOLA').length;
  const tahap3 = loans.filter((l) => l.status === 'MENUNGGU_MANAGER_LAB').length;
  const tahap4 = loans.filter((l) => l.status === 'MENUNGGU_SERAH_TERIMA' || l.status === 'DISETUJUI' || l.status === 'SIAP_DISERAHKAN').length;

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
          Buka Peminjaman
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

        {/* ATASAN */}
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
            ATASAN
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706', margin: '4px 0 2px' }}>
            {loading ? '...' : tahap1}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Validasi atasan peminjam</div>
        </div>

        {/* PENGELOLA */}
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
            PENGELOLA
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0284c7', margin: '4px 0 2px' }}>
            {loading ? '...' : tahap2}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Review teknis & ketersediaan</div>
        </div>

        {/* MGR LAB */}
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
            MGR LAB
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7c3aed', margin: '4px 0 2px' }}>
            {loading ? '...' : tahap3}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Pengesahan izin final</div>
        </div>

        {/* SERAH TERIMA */}
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
            SERAH TERIMA
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
          <button className="btn-pill-primary" onClick={() => onNavigate('/peralatan/tambah')} id="btn-tambah-peralatan">
            <Plus size={16} /> Tambah Peralatan
          </button>
        </div>
      </div>

      {/* Level 1: 4 KPI Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-clickable blue" onClick={() => onNavigate('/peralatan')}>
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

        <div className="stat-card stat-card-clickable violet" onClick={() => onNavigate('/admin/users')}>
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

        <div className="stat-card stat-card-clickable red" onClick={() => onNavigate('/peralatan')}>
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

        <div className="stat-card stat-card-clickable teal" onClick={() => onNavigate('/admin/labs')}>
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

      <ScheduleDateCards onNavigate={onNavigate} />

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
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        fetchDashboardLoans().then(setLoans);
        const equipmentResponse = await peralatanApi.getAll();
        if (!Array.isArray(equipmentResponse?.data)) {
          throw new Error('Format respons daftar peralatan tidak valid.');
        }

        const scheduledItems = equipmentResponse.data;
        scheduledItems.sort((a, b) => {
          const dueA = getCalibrationDueDate(a);
          const dueB = getCalibrationDueDate(b);
          if (!dueA && !dueB) return String(a.nama_peralatan || '').localeCompare(String(b.nama_peralatan || ''));
          if (!dueA) return 1;
          if (!dueB) return -1;
          return dueA.getTime() - dueB.getTime();
        });

        setPeralatan(scheduledItems);
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



      {/* Tabel Status Peminjaman Peralatan Laboratorium Anda */}
      {loans.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--sp-6)' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title">Status Peminjaman Laboratorium Anda</h2>
              <p className="page-subtitle">Daftar permohonan peminjaman alat keluar dan masuk yang melibatkan laboratorium Anda.</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('/peminjaman')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Buka Peminjaman
            </button>
          </div>
          <div className="table-wrapper table-borderless">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kode Peminjaman</th>
                  <th>Peralatan</th>
                  <th>Lab Pemilik</th>
                  <th>Rentang Tanggal</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loans.slice(0, 5).map((l) => {
                  const badge = getLoanStatusBadge(l.status);
                  const isReady = l.status === 'SIAP_DISERAHKAN';
                  return (
                    <tr
                      key={l.id}
                      className="cursor-pointer"
                      onClick={() => {
                        onNavigate('/peminjaman');
                      }}
                    >
                      <td><code className="text-mono-xs" style={{ fontWeight: 600 }}>{l.kode || `PJM-${l.id}`}</code></td>
                      <td>
                        <div style={{ fontWeight: 'var(--fw-medium)' }}>{l.peralatan?.nama_peralatan || '-'}</div>
                        <small style={{ color: 'var(--clr-dark-500)' }}><code className="text-mono-xs">{l.peralatan?.nomor_aset || '-'}</code></small>
                      </td>
                      <td>{l.peralatan?.lab_pemilik || '-'}</td>
                      <td>
                        <div style={{ fontSize: '13px' }}>
                          {l.rencana_tanggal_keluar || '-'} &rarr; {l.rencana_tanggal_kembali || '-'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${badge.className}`}>{badge.label}</span>
                      </td>
                      <td>
                        {isReady ? (
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              background: '#ea580c',
                              color: '#fff',
                              borderColor: '#ea580c',
                              padding: '4px 10px',
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const ticketCode = l?.kode || (typeof l?.id === 'number' ? `PJM-2026-${String(l.id).padStart(3, '0')}` : String(l?.id || ''));
                              if (ticketCode) markNotificationsAsReadByRef({ ticketCode });
                              onNavigate('/peminjaman');
                            }}
                          >
                            Tanda Tangan Terima
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const ticketCode = l?.kode || (typeof l?.id === 'number' ? `PJM-2026-${String(l.id).padStart(3, '0')}` : String(l?.id || ''));
                              if (ticketCode) markNotificationsAsReadByRef({ ticketCode });
                              onNavigate('/peminjaman');
                            }}
                          >
                            Detail
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
            <h2 className="card-title">Prioritas Pemeriksaan & Tahapan Proses</h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('/penjadwalan')}>
            Buka Penjadwalan
          </button>
        </div>
        {loadError && (
          <div className="alert alert-warning" role="alert" style={{ margin: 'var(--sp-4)' }}>
            {loadError}
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
                      <span className={`badge ${getDueDateBadgeClass(dueDate)}`}>{formatDueDate(dueDate)}</span>
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
                      <span className={`badge ${process.tone}`}>{process.label}</span>
                      <small style={{ color: 'var(--clr-dark-500)' }}>{process.description}</small>
                    </div>
                  );
                },
              },
            ]}
          />
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
