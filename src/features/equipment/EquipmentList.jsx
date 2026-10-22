import React, { useState, useEffect } from 'react';
import './equipment.css';
import { Package, Plus } from 'lucide-react';
import { getCurrentUser, getEquipmentId, getEquipmentLabId, peralatanApi, ruanganApi, verifikasiApi } from '../../shared/services/api.js';
import { ACCESS, ACTIONS, can, getUserRole } from '../../shared/utils/permissions.js';
import { usePagination } from '../../shared/components/ui/Pagination.jsx';
import TableFilters from '../../shared/components/ui/TableFilters.jsx';
import { Button, PageHeader, LoadingState, EmptyState, ErrorState } from '../../shared/components/ui/index.js';
import ConfirmDialog from '../../shared/components/ui/ConfirmDialog.jsx';
import EquipmentListTable from './components/EquipmentListTable.jsx';
import { useToast } from '../../app/providers/ToastContext.jsx';
import {
  filterEquipment,
  getEquipmentCategories,
  getEquipmentLifecycleHeader,
  mergePendingVerificationActivity,
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
  const canReturnEquipment = can(ACCESS.RETURN_PROCESS, ACTIONS.EDIT);
  const { success: toastSuccess, error: toastError } = useToast();
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
  const [equipmentToReturn, setEquipmentToReturn] = useState(null);
  const [returningEquipmentId, setReturningEquipmentId] = useState(null);
  const [loaningEquipmentId, setLoaningEquipmentId] = useState(null);


  useEffect(() => { loadData(); }, []);
  useEffect(() => { setLifecycleView(initialLifecycle); }, [initialLifecycle]);

  async function loadData() {
    setLoading(true);
    setLoadError('');
    try {
      if (isLabScopedUser && currentUserLabId == null) {
        throw new Error('Akun pengguna belum terhubung dengan lab.');
      }
      const [res, roomsRes, verificationsRes] = await Promise.all([
        peralatanApi.getAll(),
        ruanganApi.getAll().catch((err) => {
          console.error('Gagal memuat lokasi peralatan:', err);
          if (isLabScopedUser) throw err;
          return { data: [] };
        }),
        verifikasiApi.getAll(),
      ]);
      if (!Array.isArray(res?.data) || !Array.isArray(verificationsRes?.data)) {
        throw new Error('Format data peralatan atau verifikasi tidak valid.');
      }
      setList(mergePendingVerificationActivity(res.data, verificationsRes.data));
      setRooms(roomsRes.data || []);
    } catch (err) {
      console.error('Gagal memuat peralatan:', err);
      setLoadError(err.message || 'Gagal memuat data peralatan.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmReturnEquipment() {
    if (!equipmentToReturn) return;

    const equipmentId = getEquipmentId(equipmentToReturn);
    setReturningEquipmentId(equipmentId);
    try {
      await peralatanApi.returnFromLoan(equipmentId);
      setEquipmentToReturn(null);
      toastSuccess('Peralatan dikembalikan dan masuk antrean verifikasi A3.');
      await loadData();
    } catch (err) {
      console.error('Gagal mencatat pengembalian peralatan:', err);
      toastError(err.message || 'Gagal mencatat pengembalian peralatan.');
    } finally {
      setReturningEquipmentId(null);
    }
  }

  async function markEquipmentAsLoaned(equipment) {
    const equipmentId = getEquipmentId(equipment);
    if (equipmentId == null) return;

    setLoaningEquipmentId(equipmentId);
    try {
      await peralatanApi.markAsLoaned(equipmentId);
      toastSuccess('Status peralatan berubah menjadi Dipinjam.');
      await loadData();
    } catch (err) {
      console.error('Gagal mengubah status peminjaman peralatan:', err);
      toastError(err.message || 'Gagal mengubah status peralatan.');
    } finally {
      setLoaningEquipmentId(null);
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
          description="Daftar ini menampilkan peralatan aktif yang disetujui serta peralatan dengan verifikasi lanjutan yang sedang diproses."
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
          loaningEquipmentId={loaningEquipmentId}
          onMarkAsLoaned={markEquipmentAsLoaned}
          canReturnEquipment={canReturnEquipment}
          returningEquipmentId={returningEquipmentId}
          onReturnEquipment={setEquipmentToReturn}
          onNavigate={onNavigate}
          returnPath={returnPath}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(equipmentToReturn)}
        title="Konfirmasi Pengembalian"
        message={`Tandai ${equipmentToReturn?.nama_peralatan || 'peralatan ini'} sudah selesai dipinjam? Status alat akan kembali Aktif dan masuk antrean verifikasi A3.`}
        confirmText={returningEquipmentId ? 'Memproses...' : 'Ya, Sudah Kembali'}
        cancelText="Batal"
        variant="primary"
        onConfirm={confirmReturnEquipment}
        onCancel={() => {
          if (returningEquipmentId == null) setEquipmentToReturn(null);
        }}
      />

    </div>
  );
}