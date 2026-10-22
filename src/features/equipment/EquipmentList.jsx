import React, { useState, useEffect } from 'react';
import './equipment.css';
import { Package, Plus } from 'lucide-react';
import { getCurrentUser, getEquipmentLabId, peralatanApi, ruanganApi } from '../../shared/services/api.js';
import { ACCESS, ACTIONS, can, getUserRole } from '../../shared/utils/permissions.js';
import { usePagination } from '../../shared/components/ui/Pagination.jsx';
import TableFilters from '../../shared/components/ui/TableFilters.jsx';
import { Button, PageHeader, LoadingState, EmptyState, ErrorState } from '../../shared/components/ui/index.js';
import EquipmentListTable from './components/EquipmentListTable.jsx';
import {
  filterEquipment,
  getEquipmentCategories,
  getEquipmentLifecycleHeader,
} from './equipmentListData.js';


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
  const user = getCurrentUser();
  const role = getUserRole(user);
  const isLabScopedUser = role === 'staff' || role === 'manager';
  const currentUserLabId = user?.labs_id ?? user?.labs?.id;
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch]     = useState('');
  const [filterKat, setFilterKat] = useState('');
  const [filterLab, setFilterLab] = useState('');
  const [lifecycleView, setLifecycleView] = useState(initialLifecycle);
  const [rooms, setRooms] = useState([]);


  useEffect(() => { loadData(); }, []);
  useEffect(() => { setLifecycleView(initialLifecycle); }, [initialLifecycle]);

  async function loadData() {
    setLoading(true);
    setLoadError('');
    try {
      if (isLabScopedUser && currentUserLabId == null) {
        throw new Error('Akun pengguna belum terhubung dengan lab.');
      }
      const [res, roomsRes] = await Promise.all([
        peralatanApi.getAll(),
        ruanganApi.getAll().catch((err) => {
          console.error('Gagal memuat lokasi peralatan:', err);
          if (isLabScopedUser) throw err;
          return { data: [] };
        }),
      ]);
      setList(res.data || []);
      setRooms(roomsRes.data || []);
    } catch (err) {
      console.error('Gagal memuat peralatan:', err);
      setLoadError(err.message || 'Gagal memuat data peralatan.');
    } finally {
      setLoading(false);
    }
  }

  const roomsById = new Map(rooms.map((room) => [String(room.id), room]));
  const visibleList = isLabScopedUser
    ? list.filter((item) => {
        const labId = getEquipmentLabId(item, roomsById);
        return labId != null && String(labId) === String(currentUserLabId);
      })
    : list;
  const labsById = new Map();
  rooms.forEach((room) => {
    const lab = room.labs || room.laboratorium;
    const labId = room.labs_id ?? lab?.id;
    if (labId != null) {
      labsById.set(String(labId), {
        ...(lab || {}),
        id: lab?.id ?? labId,
        nama_labs: lab?.nama_labs || lab?.nama_lab || `Laboratorium ${labId}`,
      });
    }
  });
  const labs = Array.from(labsById.values())
    .filter((lab) => !isLabScopedUser || String(lab.id) === String(currentUserLabId))
    .sort((first, second) => first.nama_labs.localeCompare(second.nama_labs, 'id-ID'));
  const filtered = filterEquipment(visibleList, {
    search,
    categoryId: filterKat,
    labId: filterLab,
    roomsById,
    lifecycle: lifecycleView,
  });
  const pagination = usePagination(filtered.length, `${search}\u0000${filterKat}\u0000${filterLab}\u0000${lifecycleView}`);
  const categories = getEquipmentCategories(visibleList);
  const [title, description] = getEquipmentLifecycleHeader(lifecycleView);

  return (
    <div className="page-container fade-in-up">
      <PageHeader
        title={title}
        subtitle={description}
        actions={canCreate ? (
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => onNavigate('/peralatan/tambah')} id="btn-tambah-peralatan">
            Tambah Peralatan
          </Button>
        ) : null}
      />

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
          {
            type: 'select',
            id: 'select-filter-laboratorium-peralatan',
            label: 'Laboratorium',
            placeholder: 'Semua Laboratorium',
            value: filterLab,
            onChange: (event) => setFilterLab(event.target.value),
            options: labs.map((lab) => ({
              value: String(lab.id),
              label: lab.nama_labs || lab.nama_lab || `Laboratorium ${lab.id}`,
            })),
          },
        ]}
      />

      {loading ? (
        <LoadingState message="Memuat daftar peralatan..." />
      ) : loadError ? (
        <ErrorState title="Gagal memuat peralatan" message={loadError} onRetry={loadData} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada peralatan ditemukan"
          description="Daftar ini hanya menampilkan peralatan berstatus aktif yang telah disetujui manager."
          icon={<Package size={32} />}
          action={canCreate ? (
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => onNavigate('/peralatan/tambah')}>
              Tambah Peralatan Pertama
            </Button>
          ) : null}
        />
      ) : (
        <EquipmentListTable
          equipment={filtered}
          rooms={rooms}
          pagination={pagination}
          canViewVerification={canViewVerification}
          canRequestLoan={canRequestLoan}
          onNavigate={onNavigate}
          returnPath={returnPath}
        />
      )}

    </div>
  );
}