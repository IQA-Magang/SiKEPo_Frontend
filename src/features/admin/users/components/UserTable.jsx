import { Pencil, Shield, Trash2 } from 'lucide-react';
import PaginatedDataTable from '../../../../shared/components/ui/PaginatedDataTable.jsx';
import { Button, IconButton } from '../../../../shared/components/ui/index.js';
import { ROLE_BADGE } from '../userData.js';

export default function UserTable({
  users,
  pagination,
  totalUsers,
  totalManagers,
  canEdit,
  canDelete,
  canSetPengelola,
  deleting,
  updatingPengelola,
  onEdit,
  onDelete,
  onTogglePengelola,
}) {
  const columns = [
    {
      key: 'number',
      header: '#',
      headerStyle: { width: 48 },
      render: (_, index) => pagination.startIndex + index + 1,
      cellStyle: { color: 'var(--clr-dark-400)' },
    },
    { key: 'nip', header: 'NIP', render: (user) => <code className="text-mono-xs">{user.nip}</code> },
    { key: 'name', header: 'Nama', render: (user) => <span style={{ fontWeight: 'var(--fw-medium)' }}>{user.name}</span> },
    { key: 'email', header: 'Email', render: (user) => <span style={{ color: 'var(--clr-dark-500)', fontSize: 'var(--text-sm)' }}>{user.email}</span> },
    { key: 'role', header: 'Role', render: (user) => <span className={`badge ${ROLE_BADGE[user.role] || 'badge-gray'}`}>{user.role}</span> },
    { key: 'position', header: 'Jabatan', render: (user) => <span style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-dark-600)' }}>{user.position}</span> },
    { key: 'manager', header: 'Pengelola', render: (user) => user.pengelola && <span className="badge badge-green"><Shield size={10} /> Pengelola</span> },
  ];

  if (canEdit || canDelete || canSetPengelola) {
    columns.push({
      key: 'actions',
      header: 'Aksi',
      headerStyle: { width: 180 },
      render: (user) => (
        <div className="table-action-btns" style={canSetPengelola ? { flexWrap: 'wrap' } : undefined}>
          {canSetPengelola && user.role === 'staff' && (
            <Button
              variant={user.pengelola ? 'secondary' : 'primary'}
              size="sm"
              icon={<Shield size={13} />}
              onClick={() => onTogglePengelola(user)}
              disabled={updatingPengelola === user.user_id}
              id={`btn-toggle-pengelola-user-${user.user_id}`}
              title={user.pengelola ? 'Lepas status pengelola' : 'Tetapkan sebagai pengelola'}
            >
              {updatingPengelola === user.user_id
                ? 'Menyimpan...'
                : user.pengelola ? 'Lepas Pengelola' : 'Tetapkan Pengelola'}
            </Button>
          )}
          {canEdit && (
            <IconButton
              icon={<Pencil size={13} />}
              label={`Edit pengguna ${user.name}`}
              variant="secondary"
              className="btn-action-icon"
              onClick={() => onEdit(user)}
              id={`btn-edit-user-${user.user_id}`}
              title="Edit pengguna"
              style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, padding: 0 }}
            />
          )}
          {canDelete && (
            <IconButton
              icon={<Trash2 size={13} />}
              label={`Hapus pengguna ${user.name}`}
              variant="secondary"
              className="btn-action-icon btn-action-delete"
              onClick={() => onDelete(user.user_id)}
              disabled={deleting === user.user_id}
              id={`btn-hapus-user-${user.user_id}`}
              title="Hapus pengguna"
              style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, padding: 0 }}
            />
          )}
        </div>
      ),
    });
  }

  return (
    <div className="table-card">
      <PaginatedDataTable
        wrapperClassName="table-borderless"
        className="data-table-mobile-priority data-table-users"
        rows={users}
        pagination={pagination}
        rowKey={(user) => user.user_id}
        columns={columns}
      >
        <div className="table-footer-summary">
          <span>Total pengguna terdaftar: <strong>{users.length}</strong> dari <strong>{totalUsers}</strong></span>
          <span>Total Pengelola Aktif: <strong>{totalManagers}</strong></span>
        </div>
      </PaginatedDataTable>
    </div>
  );
}
