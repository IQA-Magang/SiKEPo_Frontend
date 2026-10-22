import React, { useState, useEffect } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { labsApi, usersApi } from '../../../shared/services/api.js';
import { ACCESS, ACTIONS, can } from '../../../shared/utils/permissions.js';
import { useToast } from '../../../app/providers/ToastContext.jsx';
import { useConfirm } from '../../../app/providers/ConfirmContext.jsx';
import { usePagination } from '../../../shared/components/ui/Pagination.jsx';
import TableFilters from '../../../shared/components/ui/TableFilters.jsx';
import { PageHeader, LoadingState, EmptyState, ErrorState, Button } from '../../../shared/components/ui/index.js';
import LaboratoryTable from './components/LaboratoryTable.jsx';
import LaboratoryFormModal from './components/LaboratoryFormModal.jsx';
import {
  EMPTY_LAB_FORM,
  createLabForm,
  createLabPayload,
  filterLabs,
  getLabValidationError,
} from './laboratoryData.js';

export default function LabsManagement() {
  const canAdd = can(ACCESS.MASTER_LAB, ACTIONS.ADD);
  const canEdit = can(ACCESS.MASTER_LAB, ACTIONS.EDIT);
  const canDelete = can(ACCESS.MASTER_LAB, ACTIONS.DELETE);
  const [labs, setLabs] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'create'|'edit', id }
  const [form, setForm] = useState(EMPTY_LAB_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');

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
      const [labsRes, usersRes] = await Promise.allSettled([
        labsApi.getAll(),
        (canAdd || canEdit) ? usersApi.getAll() : Promise.resolve({ data: [] }),
      ]);

      if (labsRes.status === 'fulfilled') {
        setLabs(labsRes.value.data || []);
      } else {
        setError(labsRes.reason?.message || 'Gagal memuat data laboratorium');
      }

      if (usersRes.status === 'fulfilled') {
        const allUsers = usersRes.value.data || [];
        const managerUsers = allUsers.filter((u) => u.role === 'manager');
        setManagers(managerUsers.length > 0 ? managerUsers : allUsers);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(EMPTY_LAB_FORM);
    setError('');
    setModal({ mode: 'create' });
  }

  function openEdit(lab) {
    setForm(createLabForm(lab));
    setError('');
    setModal({ mode: 'edit', id: lab.id });
  }

  async function handleSave() {
    const validationError = getLabValidationError(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = createLabPayload(form);

      if (modal.mode === 'create') {
        await labsApi.create(payload);
      } else {
        await labsApi.update(modal.id, payload);
      }

      setModal(null);
      toast.success(modal.mode === 'create' ? 'Laboratorium baru berhasil ditambahkan.' : 'Data laboratorium berhasil diperbarui.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan laboratorium.');
      toast.error(err.message || 'Gagal menyimpan laboratorium.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const targetLab = labs.find((item) => item.id === id);
    const labName = targetLab?.nama_labs ? `"${targetLab.nama_labs}"` : 'laboratorium ini';

    const confirmed = await confirm({
      title: 'Hapus Laboratorium',
      message: `Apakah Anda yakin ingin menghapus ${labName}? Seluruh data ruangan yang berelasi dapat terpengaruh.`,
      confirmText: 'Ya, Hapus Lab',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    setDeleting(id);
    try {
      await labsApi.delete(id);
      setLabs((prev) => prev.filter((item) => item.id !== id));
      toast.success(`Laboratorium ${labName} berhasil dihapus.`);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus laboratorium.');
    } finally {
      setDeleting(null);
    }
  }

  const filtered = filterLabs(labs, search);
  const pagination = usePagination(filtered.length, search);

  return (
    <div className="page-container fade-in-up">
      <PageHeader
        title="Laboratorium Pengujian"
        subtitle={`Kelola laboratorium uji Telkom Test House (${filtered.length} terdaftar)`}
        actions={canAdd ? (
          <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreate} id="btn-tambah-lab">
            Tambah Lab
          </Button>
        ) : null}
      />

      <TableFilters
        fields={[
          {
            type: 'search',
            id: 'input-search-lab',
            label: 'Cari laboratorium',
            placeholder: 'Kode, nama lab, atau manager',
            value: search,
            onChange: (event) => setSearch(event.target.value),
          },
        ]}
      />

      {loading ? (
        <LoadingState message="Memuat laboratorium..." />
      ) : error ? (
        <ErrorState title="Gagal memuat laboratorium" message={error} onRetry={loadData} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada laboratorium ditemukan"
          description="Belum ada data laboratorium yang sesuai dengan pencarian saat ini."
          icon={<Building2 size={32} />}
          action={canAdd ? (
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreate}>
              Tambah Lab
            </Button>
          ) : null}
        />
      ) : (
        <LaboratoryTable
          labs={filtered}
          managers={managers}
          pagination={pagination}
          totalLabs={labs.length}
          canEdit={canEdit}
          canDelete={canDelete}
          deleting={deleting}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      {modal && (
        <LaboratoryFormModal
          mode={modal.mode}
          form={form}
          managers={managers}
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
