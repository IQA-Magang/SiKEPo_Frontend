import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, Plus, RefreshCw, X } from 'lucide-react';
import { useToast } from '../../app/providers/ToastContext.jsx';
import {
  getEquipmentId,
  jadwalPemeriksaanBerkalaApi,
  peralatanApi,
} from '../../shared/services/api.js';
import PaginatedDataTable from '../../shared/components/ui/PaginatedDataTable.jsx';
import TableFilters from '../../shared/components/ui/TableFilters.jsx';
import { usePagination } from '../../shared/components/ui/Pagination.jsx';

const INITIAL_FORM = {
  peralatan_id: '',
  jenis_utama: 'kalibrasi',
  frekuensi_penggunaan: 'sedang',
  interval_utama: '',
  interval_tambahan: '',
  tanggal_terakhir: '',
  metode: '',
  nomor_dokumen: '',
  alat_standar_benda_uji: '',
  jenis_pemeliharaan: '',
  pic: '',
  keterangan: '',
};

const DATE_OPTIONS = { year: 'numeric', month: 'short', day: 'numeric' };

function formatDate(value) {
  const dateValue = String(value || '').slice(0, 10);
  if (!dateValue) return '–';
  const date = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '–' : date.toLocaleDateString('id-ID', DATE_OPTIONS);
}

function getTodayInputValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

function getScheduleLabel(schedule) {
  const typeLabels = {
    kalibrasi: 'Kalibrasi',
    verifikasi_fungsi: 'Verifikasi Fungsi',
    pengecekan_antara: 'Pengecekan Antara',
    pemeliharaan: 'Pemeliharaan',
  };
  return typeLabels[schedule.jenis_jadwal] || schedule.jenis_jadwal || '–';
}

function getDueStatus(value) {
  if (!value) return { label: 'Belum ada tanggal', className: 'badge-gray' };
  const dueDate = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(dueDate.getTime())) return { label: 'Tanggal tidak valid', className: 'badge-gray' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { label: `Terlambat ${Math.abs(days)} hari`, className: 'badge-rusak' };
  if (days <= 30) return { label: days === 0 ? 'Jatuh tempo hari ini' : `${days} hari lagi`, className: 'badge-kalibrasi' };
  return { label: 'Terjadwal', className: 'badge-aktif' };
}

export default function JadwalPemeriksaanBerkala() {
  const { success, error } = useToast();
  const [schedules, setSchedules] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [search, setSearch] = useState('');
  const [realizationTarget, setRealizationTarget] = useState(null);
  const [realizationDate, setRealizationDate] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const [scheduleResponse, equipmentResponse] = await Promise.all([
        jadwalPemeriksaanBerkalaApi.getAll(),
        peralatanApi.getAll(),
      ]);
      setSchedules(Array.isArray(scheduleResponse.data) ? scheduleResponse.data : []);
      setEquipment(Array.isArray(equipmentResponse.data) ? equipmentResponse.data : []);
    } catch (err) {
      error(err.message || 'Gagal memuat data penjadwalan.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!showCreateForm) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !saving) setShowCreateForm(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateForm, saving]);

  const equipmentById = useMemo(
    () => new Map(equipment.map((item) => [String(getEquipmentId(item)), item])),
    [equipment]
  );
  const scheduledEquipmentIds = useMemo(
    () => new Set(schedules.map((item) => String(item.peralatan_id))),
    [schedules]
  );
  const availableEquipment = equipment.filter((item) => {
    const id = getEquipmentId(item);
    return id != null && !scheduledEquipmentIds.has(String(id));
  });

  const filteredSchedules = schedules.filter((schedule) => {
    const equipmentItem = equipmentById.get(String(schedule.peralatan_id));
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [
      equipmentItem?.nama_peralatan,
      equipmentItem?.nomor_aset,
      schedule.jenis_jadwal,
      schedule.pic,
    ].some((value) => String(value || '').toLowerCase().includes(query));
  });
  const pagination = usePagination(filteredSchedules.length, search);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function createSchedule(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await jadwalPemeriksaanBerkalaApi.create({
        ...form,
        peralatan_id: Number(form.peralatan_id),
        interval_utama: Number(form.interval_utama),
        interval_tambahan: Number(form.interval_tambahan),
      });
      success(response.message || 'Jadwal utama dan tambahan berhasil dibuat.');
      setForm(INITIAL_FORM);
      setShowCreateForm(false);
      await loadData();
    } catch (err) {
      error(err.message || 'Gagal membuat jadwal pemeriksaan.');
    } finally {
      setSaving(false);
    }
  }

  async function saveRealization(event) {
    event.preventDefault();
    if (!realizationTarget || !realizationDate) return;
    setSaving(true);
    try {
      const response = await jadwalPemeriksaanBerkalaApi.updateRealisasi(
        realizationTarget.id,
        realizationDate
      );
      success(response.message || 'Realisasi dan jadwal berikutnya berhasil diperbarui.');
      setRealizationTarget(null);
      setRealizationDate('');
      await loadData();
    } catch (err) {
      error(err.message || 'Gagal memperbarui realisasi jadwal.');
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    {
      key: 'number',
      header: '#',
      headerStyle: { width: 48 },
      cellStyle: { color: 'var(--clr-dark-400)' },
      render: (_, index) => pagination.startIndex + index + 1,
    },
    {
      key: 'equipment',
      header: 'Peralatan',
      headerStyle: { minWidth: 190 },
      render: (schedule) => {
        const item = equipmentById.get(String(schedule.peralatan_id));
        return (
          <div>
            <div style={{ fontWeight: 'var(--fw-medium)', color: 'var(--clr-dark-900)' }}>
              {item?.nama_peralatan || `Peralatan #${schedule.peralatan_id}`}
            </div>
            <code style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)' }}>
              {item?.nomor_aset || 'Nomor aset tidak tersedia'}
            </code>
          </div>
        );
      },
    },
    {
      key: 'jenis_jadwal',
      header: 'Jenis Pemeriksaan',
      headerStyle: { minWidth: 160 },
      render: (schedule) => (
        <div>
          <div>{getScheduleLabel(schedule)}</div>
          <small style={{ color: 'var(--clr-dark-500)' }}>
            {schedule.peran_jadwal === 'utama' ? 'Jadwal utama' : 'Jadwal tambahan'}
          </small>
        </div>
      ),
    },
    { key: 'interval_bulan', header: 'Interval', headerStyle: { width: 100 }, render: (schedule) => `${schedule.interval_bulan} bulan` },
    { key: 'tanggal_terakhir', header: 'Terakhir', render: (schedule) => formatDate(schedule.tanggal_terakhir) },
    {
      key: 'tanggal_jatuh_tempo',
      header: 'Jatuh Tempo',
      headerStyle: { minWidth: 170 },
      render: (schedule) => {
        const status = getDueStatus(schedule.tanggal_jatuh_tempo);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span className={`badge ${status.className}`}>{status.label}</span>
            <small style={{ color: 'var(--clr-dark-500)' }}>{formatDate(schedule.tanggal_jatuh_tempo)}</small>
          </div>
        );
      },
    },
    { key: 'pic', header: 'PIC', render: (schedule) => schedule.pic || '–' },
    {
      key: 'actions',
      header: 'Aksi',
      headerStyle: { width: 170 },
      render: (schedule) => (
        <div className="table-action-btns">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setRealizationTarget(schedule);
              setRealizationDate(getTodayInputValue());
            }}
          >
            <CheckCircle2 size={14} /> Catat Realisasi
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container fade-in-up">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Penjadwalan Pemeriksaan Berkala</h1>
          <p className="page-subtitle">
            Kelola jadwal utama dan tambahan, lalu catat realisasi untuk menghitung jatuh tempo berikutnya.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setRealizationTarget(null);
            setShowCreateForm(true);
          }}
          disabled={availableEquipment.length === 0}
        >
          <Plus size={16} /> Buat Jadwal
        </button>
      </div>

      {showCreateForm && (
        <div
          className="modal-overlay"
          onClick={() => !saving && setShowCreateForm(false)}
          role="presentation"
        >
          <form
            className="modal modal-xl"
            onSubmit={createSchedule}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-modal-title"
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title" id="schedule-modal-title">Buat Jadwal Pemeriksaan</h2>
                <p className="page-subtitle">Satu peralatan akan mendapat jadwal utama dan jadwal tambahan.</p>
              </div>
              <button
                className="modal-close"
                type="button"
                aria-label="Tutup form jadwal"
                onClick={() => setShowCreateForm(false)}
                disabled={saving}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="schedule-equipment">Peralatan <span className="required">*</span></label>
              <select id="schedule-equipment" className="form-select" name="peralatan_id" value={form.peralatan_id} onChange={updateForm} required>
                <option value="">Pilih peralatan</option>
                {availableEquipment.map((item) => (
                  <option key={getEquipmentId(item)} value={getEquipmentId(item)}>
                    {item.nomor_aset ? `${item.nomor_aset} — ` : ''}{item.nama_peralatan || 'Peralatan'}
                  </option>
                ))}
              </select>
              {availableEquipment.length === 0 && <span className="form-hint">Semua peralatan sudah memiliki jadwal.</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="schedule-main-type">Pemeriksaan Utama <span className="required">*</span></label>
              <select id="schedule-main-type" className="form-select" name="jenis_utama" value={form.jenis_utama} onChange={updateForm} required>
                <option value="kalibrasi">Kalibrasi</option>
                <option value="verifikasi_fungsi">Verifikasi Fungsi</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="schedule-frequency">Frekuensi Penggunaan <span className="required">*</span></label>
              <select id="schedule-frequency" className="form-select" name="frekuensi_penggunaan" value={form.frekuensi_penggunaan} onChange={updateForm} required>
                <option value="tinggi">Tinggi</option>
                <option value="sedang">Sedang</option>
                <option value="rendah">Rendah</option>
              </select>
              <span className="form-hint">
                {form.frekuensi_penggunaan === 'tinggi' ? 'Jadwal tambahan: pengecekan antara.' : 'Jadwal tambahan: pemeliharaan.'}
              </span>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="schedule-main-interval">Interval Utama (bulan) <span className="required">*</span></label>
              <input id="schedule-main-interval" className="form-input" type="number" name="interval_utama" min="1" step="1" value={form.interval_utama} onChange={updateForm} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="schedule-extra-interval">Interval Tambahan (bulan) <span className="required">*</span></label>
              <input id="schedule-extra-interval" className="form-input" type="number" name="interval_tambahan" min="1" step="1" value={form.interval_tambahan} onChange={updateForm} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="schedule-last-date">Tanggal Terakhir <span className="required">*</span></label>
              <input id="schedule-last-date" className="form-input" type="date" name="tanggal_terakhir" value={form.tanggal_terakhir} onChange={updateForm} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="schedule-method">Metode</label>
              <input id="schedule-method" className="form-input" name="metode" value={form.metode} onChange={updateForm} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="schedule-document">
                {form.jenis_utama === 'kalibrasi' ? 'Nomor Sertifikat' : 'Nomor Laporan'}
              </label>
              <input id="schedule-document" className="form-input" name="nomor_dokumen" value={form.nomor_dokumen} onChange={updateForm} />
            </div>
            {form.jenis_utama === 'kalibrasi' && (
              <div className="form-group">
                <label className="form-label" htmlFor="schedule-standard">Alat Standar / Benda Uji</label>
                <input id="schedule-standard" className="form-input" name="alat_standar_benda_uji" value={form.alat_standar_benda_uji} onChange={updateForm} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="schedule-maintenance">Jenis Pemeliharaan</label>
              <input id="schedule-maintenance" className="form-input" name="jenis_pemeliharaan" value={form.jenis_pemeliharaan} onChange={updateForm} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="schedule-pic">PIC</label>
              <input id="schedule-pic" className="form-input" name="pic" value={form.pic} onChange={updateForm} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="schedule-notes">Keterangan</label>
              <textarea id="schedule-notes" className="form-textarea" name="keterangan" rows="2" value={form.keterangan} onChange={updateForm} />
            </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" type="button" onClick={() => setShowCreateForm(false)} disabled={saving}>
                Batal
              </button>
              <button className="btn btn-primary" type="submit" disabled={saving || availableEquipment.length === 0}>
                {saving ? 'Menyimpan...' : 'Simpan Jadwal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {realizationTarget && (
        <form className="card card-padded" onSubmit={saveRealization} style={{ marginBottom: 'var(--sp-5)' }}>
          <div className="dash-card-header-row" style={{ marginBottom: 'var(--sp-4)' }}>
            <div>
              <h2 className="card-title">Catat Realisasi: {getScheduleLabel(realizationTarget)}</h2>
              <p className="page-subtitle">Tanggal realisasi akan menjadi tanggal terakhir dan menghitung jatuh tempo berikutnya sesuai interval.</p>
            </div>
            <button className="btn btn-ghost btn-icon" type="button" aria-label="Tutup" onClick={() => setRealizationTarget(null)}><X size={18} /></button>
          </div>
          <div className="form-group" style={{ maxWidth: 320 }}>
            <label className="form-label" htmlFor="realization-date">Tanggal Realisasi <span className="required">*</span></label>
            <input id="realization-date" className="form-input" type="date" value={realizationDate} onChange={(event) => setRealizationDate(event.target.value)} required />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--sp-4)' }}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Realisasi'}
            </button>
          </div>
        </form>
      )}

      <div className="table-card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Daftar Jadwal</h2>
            <p className="page-subtitle">{schedules.length} jadwal tercatat</p>
          </div>
        </div>
        <TableFilters
          fields={[{
            id: 'schedule-search',
            label: 'Cari jadwal',
            type: 'search',
            placeholder: 'Nama peralatan, nomor aset, jenis, atau PIC',
            value: search,
            onChange: (event) => setSearch(event.target.value),
          }]}
        />
        {loading ? (
          <div className="card-padded" role="status">Memuat jadwal...</div>
        ) : filteredSchedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarClock size={28} /></div>
            <p className="empty-state-title">{search ? 'Jadwal tidak ditemukan' : 'Belum ada jadwal pemeriksaan'}</p>
            {!search && <p className="page-subtitle">Buat jadwal untuk mencatat pemeriksaan utama dan pemeriksaan tambahan peralatan.</p>}
          </div>
        ) : (
          <PaginatedDataTable
            rows={filteredSchedules}
            columns={columns}
            pagination={pagination}
            rowKey={(schedule) => schedule.id}
            wrapperClassName="table-borderless"
            emptyMessage="Tidak ada jadwal yang cocok dengan pencarian."
          />
        )}
      </div>
    </div>
  );
}
