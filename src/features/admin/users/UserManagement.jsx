import React, { useState, useEffect } from 'react';
import { Users, Plus, RefreshCw } from 'lucide-react';
import { labsApi, usersApi } from '../../../shared/services/api.js';
import { ACCESS, ACTIONS, can, getUserRole } from '../../../shared/utils/permissions.js';
import { useToast } from '../../../app/providers/ToastContext.jsx';
import { useConfirm } from '../../../app/providers/ConfirmContext.jsx';
import { usePagination } from '../../../shared/components/ui/Pagination.jsx';
import TableFilters from '../../../shared/components/ui/TableFilters.jsx';
import { PageHeader, LoadingState, EmptyState, ErrorState, Button, Badge } from '../../../shared/components/ui/index.js';
import UserTable from './components/UserTable.jsx';
import UserFormModal from './components/UserFormModal.jsx';
import {
  EMPTY_USER_FORM,
  createUserForm,
  createUserPayload,
  filterUsers,
  getUserValidationError,
} from './userData.js';

export default function UserManagement({ viewOnly = false }) {
  const role = getUserRole();
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const canCreate = !viewOnly && can(ACCESS.MASTER_USERS, ACTIONS.ADD);
  const canEdit = !viewOnly && isAdmin && can(ACCESS.MASTER_USERS, ACTIONS.EDIT);
  const canDelete = !viewOnly && isAdmin && can(ACCESS.MASTER_USERS, ACTIONS.DELETE);
  const canSetPengelola = !viewOnly && isManager;
  const [users, setUsers]   = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null); // null | { mode: 'create'|'edit', data }
  const [form, setForm]     = useState(EMPTY_USER_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [deleting, setDeleting] = useState(null);
  const [updatingPengelola, setUpdatingPengelola] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

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

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [res, labsRes] = await Promise.all([
        usersApi.getAll(),
        isAdmin ? labsApi.getAll() : Promise.resolve({ data: [] }),
      ]);
      setUsers(res.data || []);
      setLabs(labsRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(EMPTY_USER_FORM);
    setError('');
    setModal({ mode: 'create' });
  }

  function openEdit(user) {
    setForm(createUserForm(user));
    setError('');
    setModal({ mode: 'edit', id: user.user_id });
  }

  async function handleSave() {
    const validationError = getUserValidationError(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = createUserPayload(form);
      if (modal.mode === 'create') {
        if (!form.password) { setError('Password wajib diisi saat membuat akun baru.'); setSaving(false); return; }
        await usersApi.create(payload);
      } else {
        await usersApi.update(modal.id, payload);
      }
      setModal(null);
      toast.success(modal.mode === 'create' ? 'Pengguna baru berhasil ditambahkan.' : 'Data pengguna berhasil disimpan.');
      loadData();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan.');
      toast.error(err.message || 'Gagal menyimpan data pengguna.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const targetUser = users.find((u) => u.user_id === id);
    const userName = targetUser?.name ? `"${targetUser.name}"` : 'pengguna ini';

    const confirmed = await confirm({
      title: 'Hapus Pengguna',
      message: `Apakah Anda yakin ingin menghapus akun ${userName}? Tindakan ini akan menghapus hak akses yang bersangkutan secara permanen.`,
      confirmText: 'Ya, Hapus Pengguna',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    setDeleting(id);
    try {
      await usersApi.delete(id);
      setUsers((prev) => prev.filter((u) => u.user_id !== id));
      toast.success(`Pengguna ${userName} berhasil dihapus.`);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus pengguna.');
    } finally {
      setDeleting(null);
    }
  }

  async function handleTogglePengelola(user) {
    const nextValue = !Boolean(user.pengelola);
    setUpdatingPengelola(user.user_id);
    try {
      const response = await usersApi.setPengelola(user.user_id, nextValue);
      const updatedUser = response.data;
      setUsers((previous) => previous.map((item) => (
        item.user_id === user.user_id ? updatedUser : item
      )));
      toast.success(nextValue ? 'Pengguna ditetapkan sebagai pengelola.' : 'Status pengelola berhasil dilepas.');
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui status pengelola.');
    } finally {
      setUpdatingPengelola(null);
    }
  }

  const filtered = filterUsers(users, { search, role: filterRole });
  const pagination = usePagination(filtered.length, `${search}\u0000${filterRole}`);

  return (
    <div className="page-container fade-in-up">
      <PageHeader
        title="Manajemen Pengguna"
        subtitle="Kelola akun personel laboratorium dan hak akses SiKEPo"
        actions={canCreate ? (
          <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreate} id="btn-tambah-user">
            Tambah Pengguna
          </Button>
        ) : null}
      />

      {(viewOnly || isManager) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {viewOnly && <Badge tone="neutral">Mode Lihat</Badge>}
          {isManager && <Badge tone="info">Pengguna di laboratorium Anda</Badge>}
        </div>
      )}

      <TableFilters
        fields={[
          {
            type: 'search',
            id: 'input-search-user',
            label: 'Cari pengguna',
            placeholder: 'Nama, email, atau NIP',
            value: search,
            onChange: (event) => setSearch(event.target.value),
          },
          {
            type: 'select',
            id: 'select-filter-role',
            label: 'Role',
            placeholder: 'Semua Role',
            value: filterRole,
            onChange: (event) => setFilterRole(event.target.value),
            options: [
              { value: 'admin', label: 'Administrator' },
              { value: 'manager', label: 'Manager' },
              { value: 'staff', label: 'Staff' },
            ],
          },
        ]}
        actions={
          <Button variant="secondary" size="sm" icon={<RefreshCw size={16} />} onClick={loadData} id="btn-refresh-user" title="Segarkan data pengguna">
            Segarkan
          </Button>
        }
      />

      {loading ? (
        <LoadingState message="Memuat daftar pengguna..." />
      ) : error ? (
        <ErrorState title="Gagal memuat pengguna" message={error} onRetry={loadData} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada pengguna ditemukan"
          description="Belum ada akun yang cocok dengan filter saat ini."
          icon={<Users size={32} />}
          action={canCreate ? (
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={openCreate}>
              Tambah Pengguna
            </Button>
          ) : null}
        />
      ) : (
        <UserTable
          users={filtered}
          pagination={pagination}
          totalUsers={users.length}
          totalManagers={users.filter((user) => user.pengelola).length}
          canEdit={canEdit}
          canDelete={canDelete}
          canSetPengelola={canSetPengelola}
          deleting={deleting}
          updatingPengelola={updatingPengelola}
          onEdit={openEdit}
          onDelete={handleDelete}
          onTogglePengelola={handleTogglePengelola}
        />
      )}

      {modal && ((modal.mode === 'create' && canCreate) || (modal.mode === 'edit' && canEdit)) && (
        <UserFormModal
          mode={modal.mode}
          form={form}
          labs={labs}
          isAdmin={isAdmin}
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
