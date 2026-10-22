import React, { useEffect, useState } from 'react';
import { FolderKanban, Plus } from 'lucide-react';
import { kelompokAssetApi, labsApi, usersApi } from '../../../shared/services/api.js';
import { ACCESS, ACTIONS, can } from '../../../shared/utils/permissions.js';
import { useToast } from '../../../app/providers/ToastContext.jsx';
import { useConfirm } from '../../../app/providers/ConfirmContext.jsx';
import { usePagination } from '../../../shared/components/ui/Pagination.jsx';
import TableFilters from '../../../shared/components/ui/TableFilters.jsx';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from '../../../shared/components/ui/index.js';
import AssetGroupFormModal from './components/AssetGroupFormModal.jsx';
import AssetGroupTable from './components/AssetGroupTable.jsx';
import {
  EMPTY_ASSET_GROUP_FORM,
  createAssetGroupForm,
  createAssetGroupPayload,
  filterAssetGroups,
  getAssetGroupValidationError,
} from './assetGroupData.js';

export default function AssetGroupManagement() {
  const canAdd = can(ACCESS.MASTER_EQUIPMENT, ACTIONS.ADD);
  const canEdit = can(ACCESS.MASTER_EQUIPMENT, ACTIONS.EDIT);
  const canDelete = can(ACCESS.MASTER_EQUIPMENT, ACTIONS.DELETE);
  const toast = useToast();
  const confirm = useConfirm();

  const [assetGroups, setAssetGroups] = useState([]);
  const [labs, setLabs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_ASSET_GROUP_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterLab, setFilterLab] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setLoadError('');

    try {
      const [groupsResult, labsResult, usersResult] = await Promise.allSettled([
        kelompokAssetApi.getAll(),
        labsApi.getAll(),
        canAdd || canEdit ? usersApi.getAll() : Promise.resolve({ data: [] }),
      ]);

      if (groupsResult.status === 'fulfilled') {
        setAssetGroups(groupsResult.value.data || []);
      } else {
        setLoadError(groupsResult.reason?.message || 'Gagal memuat kelompok aset.');
      }

      if (labsResult.status === 'fulfilled') {
        setLabs(labsResult.value.data || []);
      }

      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value.data || []);
      }
    } catch (err) {
      setLoadError(err.message || 'Gagal memuat kelompok aset.');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setForm(EMPTY_ASSET_GROUP_FORM);
    setFormError('');
    setModal({ mode: 'create' });
  }

  function openEditModal(assetGroup) {
    setForm(createAssetGroupForm(assetGroup));
    setFormError('');
    setModal({ mode: 'edit', id: assetGroup.id });
  }

  function closeModal() {
    if (saving) return;
    setModal(null);
    setFormError('');
  }

  async function saveAssetGroup() {
    const validationError = getAssetGroupValidationError(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const payload = createAssetGroupPayload(form);
      if (modal.mode === 'create') {
        await kelompokAssetApi.create(payload);
      } else {
        await kelompokAssetApi.update(modal.id, payload);
      }

      const wasCreating = modal.mode === 'create';
      setModal(null);
      toast.success(
        wasCreating
          ? 'Kelompok aset baru berhasil ditambahkan.'
          : 'Data kelompok aset berhasil diperbarui.',
      );
      await loadData();
    } catch (err) {
      const message = err.message || 'Gagal menyimpan kelompok aset.';
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteAssetGroup(id) {
    const targetGroup = assetGroups.find((group) => group.id === id);
    const groupName = targetGroup?.nama ? `"${targetGroup.nama}"` : 'kelompok aset ini';
    const confirmed = await confirm({
      title: 'Hapus Kelompok Aset',
      message: `Apakah Anda yakin ingin menghapus ${groupName}? Seluruh pengelompokan peralatan uji terkait dapat terpengaruh.`,
      confirmText: 'Ya, Hapus Kelompok Aset',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    setDeletingId(id);
    try {
      await kelompokAssetApi.delete(id);
      setAssetGroups((currentGroups) => currentGroups.filter((group) => group.id !== id));
      toast.success(`Kelompok aset ${groupName} berhasil dihapus.`);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus kelompok aset.');
    } finally {
      setDeletingId(null);
    }
  }

  const filteredAssetGroups = filterAssetGroups(assetGroups, {
    search,
    labId: filterLab,
  });
  const pagination = usePagination(
    filteredAssetGroups.length,
    `${search}\u0000${filterLab}`,
  );

  return (
    <div className="page-container fade-in-up">
      <PageHeader
        title="Kelompok Aset Peralatan"
        subtitle={`Klasifikasi pengelompokan aset laboratorium (${filteredAssetGroups.length} terdaftar)`}
        actions={canAdd ? (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={16} />}
            onClick={openCreateModal}
            id="btn-tambah-kelompok-aset"
          >
            Tambah Kelompok Aset
          </Button>
        ) : null}
      />

      <TableFilters
        fields={[
          {
            type: 'search',
            id: 'input-search-kelompok-aset',
            label: 'Cari kelompok aset',
            placeholder: 'Kode, nama kelompok aset, atau PIC',
            value: search,
            onChange: (event) => setSearch(event.target.value),
          },
          {
            type: 'select',
            id: 'select-filter-lab-aset',
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
        <LoadingState message="Memuat kelompok aset..." />
      ) : loadError ? (
        <ErrorState
          title="Gagal memuat kelompok aset"
          message={loadError}
          onRetry={loadData}
        />
      ) : filteredAssetGroups.length === 0 ? (
        <EmptyState
          title="Tidak ada kelompok aset ditemukan"
          description="Belum ada data kelompok aset yang sesuai dengan pencarian saat ini."
          icon={<FolderKanban size={32} />}
          action={canAdd ? (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={openCreateModal}
            >
              Tambah Kelompok Aset
            </Button>
          ) : null}
        />
      ) : (
        <AssetGroupTable
          assetGroups={filteredAssetGroups}
          labs={labs}
          users={users}
          pagination={pagination}
          totalGroups={assetGroups.length}
          canEdit={canEdit}
          canDelete={canDelete}
          deletingId={deletingId}
          onEdit={openEditModal}
          onDelete={deleteAssetGroup}
        />
      )}

      <AssetGroupFormModal
        isOpen={Boolean(modal)}
        mode={modal?.mode}
        form={form}
        labs={labs}
        users={users}
        error={formError}
        saving={saving}
        onChange={setForm}
        onClose={closeModal}
        onSave={saveAssetGroup}
      />
    </div>
  );
}
