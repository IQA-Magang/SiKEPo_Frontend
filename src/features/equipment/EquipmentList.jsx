import React, { useState, useEffect } from 'react';
import { Package, Plus, RefreshCw, Hand } from 'lucide-react';
import { getEquipmentId, getEquipmentCategoryId, peralatanApi, ruanganApi, peminjamanApi, STATUS_BADGE_CLASS } from '../../shared/services/api.js';
import { ACCESS, ACTIONS, can } from '../../shared/utils/permissions.js';
import { usePagination } from '../../shared/components/ui/Pagination.jsx';
import PaginatedDataTable from '../../shared/components/ui/PaginatedDataTable.jsx';
import TableFilters from '../../shared/components/ui/TableFilters.jsx';


// ------------------------------------------------------------------
// Daftar Peralatan
// ------------------------------------------------------------------
export default function EquipmentList({
  onNavigate,
  initialLifecycle = 'all',
  returnPath = '/peralatan',
}) {
  const canCreate = can(ACCESS.INPUT_EQUIPMENT, ACTIONS.ADD);
  const canViewVerification = can(ACCESS.EQUIPMENT_ELIGIBILITY, ACTIONS.VIEW);
  const canRequestLoan = can(ACCESS.LOAN_REQUEST, ACTIONS.ADD);
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterKat, setFilterKat] = useState('');
  const [lifecycleView, setLifecycleView] = useState(initialLifecycle);
  const [rooms, setRooms] = useState([]);
  const [jadwal, setJadwal] = useState([]);
  const hariIni = new Date();
  const hariIniStr = `${hariIni.getFullYear()}-${String(hariIni.getMonth()+1).padStart(2,'0')}-${String(hariIni.getDate()).padStart(2,'0')}`;
  const jadwalPerAlat = new Map();
  for (const j of jadwal) {
    const pid = String(j.peralatan_id);
    if (!jadwalPerAlat.has(pid)) jadwalPerAlat.set(pid, []);
    jadwalPerAlat.get(pid).push(j);
  }
  function formatTgl(dateStr) {
    if (!dateStr) return '';
    const d = String(dateStr).slice(0, 10);
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }

  function isCurrentlyOut(p) {
    const pid = String(getEquipmentId(p));
    const ranges = jadwalPerAlat.get(pid) || [];
    for (const r of ranges) {
      if (hariIniStr >= r.rencana_tanggal_keluar && hariIniStr <= r.rencana_tanggal_kembali) return r;
    }
    if (p.status_alat === 'Dipinjam' && ranges.length > 0) {
      return ranges[0];
    }
    return null;
  }

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setLifecycleView(initialLifecycle); }, [initialLifecycle]);

  async function loadData() {
    setLoading(true);
    try {
      const [res, roomsRes, jadwalRes] = await Promise.all([
        peralatanApi.getAll(),
        ruanganApi.getAll().catch((err) => {
          console.error('Gagal memuat lokasi peralatan:', err);
          return { data: [] };
        }),
        peminjamanApi.getAllJadwal().catch(() => ({ data: [] })),
      ]);
      setList(res.data || []);
      setRooms(roomsRes.data || []);
      setJadwal(jadwalRes.data || []);
    } catch (err) {
      console.error('Gagal memuat peralatan:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filter
  const filtered = list.filter((p) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      p.nama_peralatan?.toLowerCase().includes(q) ||
      p.nomor_aset?.toLowerCase().includes(q) ||
      p.merek?.toLowerCase().includes(q);
    const catId = getEquipmentCategoryId(p);
    const matchKat = !filterKat || String(catId) === filterKat;
    const approved = p.status_verifikasi === 'Disetujui';
    const active = p.status_alat === 'Aktif';
    const rejected = p.status_verifikasi === 'Ditolak';
    const pending = !approved && !rejected;
    const matchLifecycle = lifecycleView === 'pending' ? pending
      : lifecycleView === 'review' ? rejected : active && approved;
    return matchQ && matchKat && matchLifecycle;
  });
  const pagination = usePagination(filtered.length, `${search}\u0000${filterKat}\u0000${lifecycleView}`);
  const columns = [
    {
      key: 'number',
      header: 'No.',
      headerStyle: { width: 40 },
      cellStyle: { color: 'var(--clr-dark-400)', width: 40 },
      render: (_, index) => pagination.startIndex + index + 1,
    },
    {
      key: 'asset',
      header: 'No. Aset',
      render: (equipment) => (
        <code style={{ fontSize: 'var(--text-xs)', background: 'var(--clr-dark-100)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
          {equipment.nomor_aset || '–'}
        </code>
      ),
    },
    {
      key: 'name',
      header: 'Nama Peralatan',
      render: (equipment) => (
        <>
          <div style={{ fontWeight: 'var(--fw-medium)', color: 'var(--clr-dark-900)' }}>
            {equipment.nama_peralatan}
          </div>
          {(equipment.merek || equipment.tipe_model) && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-400)' }}>
              {[equipment.merek, equipment.tipe_model].filter(Boolean).join(' — ')}
            </div>
          )}
          {equipment.peranti_lunak_versi && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)' }}>
              Firmware: {equipment.peranti_lunak_versi}
            </div>
          )}
        </>
      ),
    },
    {
      key: 'category-location',
      header: 'Kategori & Lokasi',
      render: (equipment) => {
        const room = rooms.find((item) => String(item.id) === String(equipment.ruangan_id));
        const location = [room?.labs?.nama_labs, room?.nama_ruangan].filter(Boolean).join(' · ');
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span className="badge badge-gray" style={{ fontSize: 'var(--text-xs)' }}>
              {equipment.kategori_peralatan?.nama_kategori || '–'}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)' }}>
              {location || 'Lokasi belum tersedia'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'description',
      header: 'Keterangan',
      render: (equipment) => {
        const approved = equipment.status_verifikasi === 'Disetujui';
        const rejected = equipment.status_verifikasi === 'Ditolak';
        const description = rejected
          ? 'Perlu verifikasi ulang'
          : !approved
            ? 'Menunggu verifikasi'
            : equipment.status_alat === 'Aktif'
              ? 'Masuk inventaris'
              : equipment.status_alat === 'Dalam Kalibrasi'
                ? 'Sedang dikalibrasi'
                : equipment.status_alat === 'Dipinjam'
                  ? 'Sedang dipinjam'
                  : equipment.status_alat === 'Rusak'
                    ? 'Dalam kondisi rusak'
                    : equipment.status_alat || 'Dalam proses';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span className={`badge ${STATUS_BADGE_CLASS[rejected ? 'Rusak' : approved ? equipment.status_alat : 'Karantina'] || 'badge-gray'}`}>
              <span className="badge-dot" />
              {description}
            </span>
          </div>
        );
      },
    },
    {
      key: 'last-user',
      header: 'Pemakai Terakhir',
      render: (p) => {
        if (!p.pemakai_terakhir) return <span style={{ color: 'var(--clr-dark-400)' }}>–</span>;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
            <span style={{ fontWeight: 600, color: 'var(--clr-dark-800)', fontSize: '13px' }}>
              {p.pemakai_terakhir.nama}
            </span>
            {p.pemakai_terakhir.sedang_digunakan ? (
              <span className="badge badge-warning" style={{ fontSize: '10px', padding: '1px 6px' }}>
                Sedang Digunakan
              </span>
            ) : (
              <small style={{ color: 'var(--clr-dark-500)', fontSize: '11px' }}>
                {p.pemakai_terakhir.tanggal_keluar ? String(p.pemakai_terakhir.tanggal_keluar).slice(0, 10) : ''}
              </small>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      cellProps: () => ({ onClick: (event) => event.stopPropagation() }),
      render: (equipment) => {
        const equipmentId = getEquipmentId(equipment);
        const approved = equipment.status_verifikasi === 'Disetujui';
        const rejected = equipment.status_verifikasi === 'Ditolak';
        const detailPath = `/peralatan/detail/${equipmentId}?returnTo=${encodeURIComponent(returnPath)}`;
        const verificationPath = `/verifikasi/${equipmentId}?returnTo=${encodeURIComponent(returnPath)}`;
        const out = isCurrentlyOut(equipment);
        return (
          <div style={{ display: 'flex', gap: 'var(--sp-1)' }}>
            {canViewVerification && !approved && !rejected && (
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate(verificationPath)} title="Mulai atau lanjutkan verifikasi">
                Verifikasi
              </button>
            )}
            {canViewVerification && rejected && (
              <>
                <button className="btn btn-ghost btn-sm text-error" onClick={() => onNavigate(detailPath)} title="Lihat Catatan Peninjauan (TLKM13/IK/012)">
                  Tinjau
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => onNavigate(verificationPath)} title="Ajukan Verifikasi Ulang (TLKM13/IK/003)">
                  Verifikasi Ulang
                </button>
              </>
            )}
            {canRequestLoan && approved && (
              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onNavigate(`/peminjaman/${equipmentId}`)}
                  title={out ? `Alat sedang dipinjam: ${out.rencana_tanggal_keluar} s.d. ${out.rencana_tanggal_kembali}. Klik untuk mengajukan peminjaman pada jadwal lain.` : "Pinjam peralatan"}
                  id={`btn-pinjam-${equipmentId}`}
                >
                  <Hand size={14} /> Pinjam
                </button>
                {out && (
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--clr-primary-700, #c53030)',
                      background: 'var(--clr-primary-50, #fff5f5)',
                      border: '1px solid var(--clr-primary-200, #fed7d7)',
                      padding: '1px 5px',
                      borderRadius: 'var(--radius-sm, 4px)',
                      whiteSpace: 'nowrap',
                      lineHeight: 1.25,
                      fontWeight: 'var(--fw-medium, 500)',
                    }}
                    title={`Dipinjam dari ${out.rencana_tanggal_keluar} s.d. ${out.rencana_tanggal_kembali}`}
                  >
                    Dipinjam: {formatTgl(out.rencana_tanggal_keluar)} – {formatTgl(out.rencana_tanggal_kembali)}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  const categories = Array.from(
    new Map(
      list
        .filter((item) => item.kategori_peralatan?.id && item.kategori_peralatan?.nama_kategori)
        .map((item) => [item.kategori_peralatan.id, item.kategori_peralatan])
    ).values()
  );
  const lifecycleCopy = {
    pending: ['Menunggu Verifikasi', 'peralatan menunggu pemeriksaan dan belum dapat digunakan'],
    review: ['Peralatan dalam Peninjauan', 'peralatan ditolak dan membutuhkan tindak lanjut'],
    all: ['Daftar Peralatan'],
  };
  const [title, description] = lifecycleCopy[lifecycleView];

  return (
    <div className="page-container fade-in-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
        <div>
          <h1 className="page-title">{title}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>

          {canCreate && (
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('/peralatan/tambah')}
              id="btn-tambah-peralatan"
            >
              <Plus size={16} /> Tambah Peralatan
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <TableFilters
        fields={[
          {
            type: 'search',
            id: 'input-search-peralatan',
            label: 'Cari peralatan',
            placeholder: 'Nama, nomor aset, atau merek',
            value: search,
            onChange: (event) => setSearch(event.target.value),
          },
          {
            type: 'select',
            id: 'select-filter-kategori',
            label: 'Kategori',
            placeholder: 'Semua Kategori',
            value: filterKat,
            onChange: (event) => setFilterKat(event.target.value),
            options: categories.map((category) => ({
              value: String(category.id),
              label: category.nama_kategori,
            })),
          },
        ]}
        actions={
          <button
            className="btn btn-secondary btn-icon"
            onClick={loadData}
            title="Refresh"
            id="btn-refresh-peralatan"
          >
            <RefreshCw size={16} />
          </button>
        }
      />

      {/* Tabel */}
      {loading ? (
        <div className="card" style={{ padding: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={32} /></div>
          <p className="empty-state-title">Tidak ada peralatan ditemukan</p>
          <p className="empty-state-desc">Daftar ini hanya menampilkan peralatan berstatus aktif yang telah disetujui manager.</p>
          {canCreate && <button className="btn btn-primary" onClick={() => onNavigate('/peralatan/tambah')} style={{ marginTop: 'var(--sp-2)' }}>
            <Plus size={16} /> Tambah Peralatan Pertama
          </button>}
        </div>
      ) : (
        <div className="table-card">
          <PaginatedDataTable
            columns={columns}
            rows={filtered}
            pagination={pagination}
            rowKey={(equipment) => getEquipmentId(equipment)}
            className="data-table-mobile-priority equipment-list-table"
            rowProps={(equipment) => {
              const equipmentId = getEquipmentId(equipment);
              const detailPath = `/peralatan/detail/${equipmentId}?returnTo=${encodeURIComponent(returnPath)}`;
              return {
                className: 'cursor-pointer',
                onClick: () => onNavigate(detailPath),
                onKeyDown: (event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onNavigate(detailPath);
                  }
                },
                tabIndex: 0,
                role: 'link',
                'aria-label': `Lihat detail ${equipment.nama_peralatan}`,
              };
            }}
            emptyMessage="Tidak ada peralatan ditemukan."
          />
        </div>
      )}

    </div>
  );
}