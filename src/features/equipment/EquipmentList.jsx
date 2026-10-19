import React, { useState, useEffect } from 'react';
import './equipment.css';
import { Package, Plus, RefreshCw } from 'lucide-react';
import { peralatanApi, ruanganApi } from '../../shared/services/api.js';
import { ACCESS, ACTIONS, can } from '../../shared/utils/permissions.js';
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
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch]     = useState('');
  const [filterKat, setFilterKat] = useState('');
  const [lifecycleView, setLifecycleView] = useState(initialLifecycle);
  const [rooms, setRooms] = useState([]);


  useEffect(() => { loadData(); }, []);
  useEffect(() => { setLifecycleView(initialLifecycle); }, [initialLifecycle]);

  async function loadData() {
    setLoading(true);
    setLoadError('');
    try {
      const [res, roomsRes] = await Promise.all([
        peralatanApi.getAll(),
        ruanganApi.getAll().catch((err) => {
          console.error('Gagal memuat lokasi peralatan:', err);
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

  // Filter
  const filtered = filterEquipment(list, {
    search,
    categoryId: filterKat,
    lifecycle: lifecycleView,
  });
  const pagination = usePagination(filtered.length, `${search}\u0000${filterKat}\u0000${lifecycleView}`);
  const categories = getEquipmentCategories(list);
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
        ]}
        actions={
          <Button variant="secondary" size="sm" icon={<RefreshCw size={16} />} onClick={loadData} title="Refresh" id="btn-refresh-peralatan">
            Segarkan
          </Button>
        }
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