import React, { useState, useEffect } from 'react';
import { DoorOpen, Plus } from 'lucide-react';
import { ruanganApi, labsApi, usersApi } from '../../../shared/services/api.js';
import { ACCESS, ACTIONS, can } from '../../../shared/utils/permissions.js';
import { useToast } from '../../../app/providers/ToastContext.jsx';
import { useConfirm } from '../../../app/providers/ConfirmContext.jsx';
import { usePagination } from '../../../shared/components/ui/Pagination.jsx';
import TableFilters from '../../../shared/components/ui/TableFilters.jsx';
import { PageHeader, LoadingState, EmptyState, ErrorState, Button } from '../../../shared/components/ui/index.js';
import RoomTable from './components/RoomTable.jsx';
import RoomFormModal from './components/RoomFormModal.jsx';
import {
  EMPTY_ROOM_FORM,
  createRoomForm,
  createRoomPayload,
  filterRooms,
  getRoomValidationError,
} from './roomData.js';

export default function RuanganManagement() {
  const canAdd = can(ACCESS.MASTER_EQUIPMENT, ACTIONS.ADD);
  const canEdit = can(ACCESS.MASTER_EQUIPMENT, ACTIONS.EDIT);
  const canDelete = can(ACCESS.MASTER_EQUIPMENT, ACTIONS.DELETE);
  const [ruanganList, setRuanganList] = useState([]);
  const [labs, setLabs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'create'|'edit', id }
  const [form, setForm] = useState(EMPTY_ROOM_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const [filterLab, setFilterLab] = useState('');

  const toast = useToast();
  const confirm = useConfirm();

  // Escape key listener for modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && modal) {
        setModal(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [ruanganRes, labsRes, usersRes] = await Promise.allSettled([
        ruanganApi.getAll(),
        labsApi.getAll(),
        (canAdd || canEdit) ? usersApi.getAll() : Promise.resolve({ data: [] }),
      ]);

      if (ruanganRes.status === 'fulfilled') {
        setRuanganList(ruanganRes.value.data || []);
      } else {
        setError(ruanganRes.reason?.message || 'Gagal memuat ruangan');
      }

      if (labsRes.status === 'fulfilled') {
        setLabs(labsRes.value.data || []);
      }

      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(EMPTY_ROOM_FORM);
    setError('');
    setModal({ mode: 'create' });
  }

  function openEdit(item) {
    setForm(createRoomForm(item));
    setError('');
    setModal({ mode: 'edit', id: item.id });
  }

  async function handleSave() {
    const validationError = getRoomValidationError(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = createRoomPayload(form);

      if (modal.mode === 'create') {
        await ruanganApi.create(payload);
      } else {
        await ruanganApi.update(modal.id, payload);
      }

      setModal(null);
      toast.success(modal.mode === 'create' ? 'Ruangan uji baru berhasil ditambahkan.' : 'Data ruangan uji berhasil diperbarui.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan ruangan.');
      toast.error(err.message || 'Gagal menyimpan ruangan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const targetRoom = ruanganList.find((r) => r.id === id);
    const roomName = targetRoom?.nama_ruangan ? `"${targetRoom.nama_ruangan}"` : 'ruangan ini';

    const confirmed = await confirm({
      title: 'Hapus Ruangan Uji',
      message: `Apakah Anda yakin ingin menghapus ${roomName}? Seluruh data penempatan alat pada ruangan ini akan terpengaruh.`,
      confirmText: 'Ya, Hapus Ruangan',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    setDeleting(id);
    try {
      await ruanganApi.delete(id);
      setRuanganList((prev) => prev.filter((r) => r.id !== id));
      toast.success(`Ruangan ${roomName} berhasil dihapus.`);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus ruangan.');
    } finally {
      setDeleting(null);
    }
  }

  const filtered = filterRooms(ruanganList, { search, labId: filterLab });
  const pagination = usePagination(filtered.length, `${search}\u0000${filterLab}`);

  return (
    <div className="page-container fade-in-up">
      <PageHeader
        title="Lokasi Penyimpanan"
        subtitle={`Daftar ruangan uji dan alokasi laboratorium (${filtered.length} terdaftar)`}
        actions={canAdd ? (
          <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreate} id="btn-tambah-ruangan">
            Tambah Ruangan
          </Button>
        ) : null}
      />

      <TableFilters
        fields={[
          {
            type: 'search',
            id: 'input-search-ruangan',
            label: 'Cari ruangan',
            placeholder: 'Kode, nama ruangan, atau PIC',
            value: search,
            onChange: (event) => setSearch(event.target.value),
          },
          {
            type: 'select',
            id: 'select-filter-lab',
            label: 'Laboratorium',
            placeholder: 'Semua Laboratorium',
            value: filterLab,
            onChange: (event) => setFilterLab(event.target.value),
            options: labs.map((lab) => ({
              value: String(lab.id),
              label: `${lab.nama_labs} (${lab.kode_labs})`,
            })),
          },
        ]}
      />

      {loading ? (
        <LoadingState message="Memuat daftar ruangan..." />
      ) : error ? (
        <ErrorState title="Gagal memuat ruangan" message={error} onRetry={loadData} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada ruangan ditemukan"
          description="Belum ada data ruangan yang sesuai dengan pencarian saat ini."
          icon={<DoorOpen size={32} />}
          action={canAdd ? (
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreate}>
              Tambah Ruangan
            </Button>
          ) : null}
        />
      ) : (
        <RoomTable
          rooms={filtered}
          labs={labs}
          users={users}
          pagination={pagination}
          totalRooms={ruanganList.length}
          canEdit={canEdit}
          canDelete={canDelete}
          deleting={deleting}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      {modal && (
        <RoomFormModal
          mode={modal.mode}
          form={form}
          labs={labs}
          users={users}
          error={error}
          saving={saving}
          onChange={setForm}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
