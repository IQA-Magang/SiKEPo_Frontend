import { Building2, Layers, Pencil, Trash2 } from 'lucide-react';
import PaginatedDataTable from '../../../../shared/components/ui/PaginatedDataTable.jsx';
import { IconButton } from '../../../../shared/components/ui/index.js';
import { getRoomLab, getRoomPic } from '../roomData.js';

export default function RoomTable({
  rooms,
  labs,
  users,
  pagination,
  totalRooms,
  canEdit,
  canDelete,
  deleting,
  onEdit,
  onDelete,
}) {
  const columns = [
    {
      key: 'number',
      header: '#',
      headerStyle: { width: 48 },
      render: (_, index) => pagination.startIndex + index + 1,
      cellStyle: { color: 'var(--clr-dark-400)' },
    },
    {
      key: 'code',
      header: 'Kode Ruangan',
      headerStyle: { width: 130 },
      render: (room) => (
        <code className="text-mono-xs" style={{ color: 'var(--clr-primary-700)', fontWeight: 700 }}>
          {room.kode_ruangan}
        </code>
      ),
    },
    {
      key: 'name',
      header: 'Nama Ruangan',
      render: (room) => <span style={{ fontWeight: 'var(--fw-semibold)' }}>{room.nama_ruangan}</span>,
    },
    {
      key: 'lab',
      header: 'Laboratorium',
      render: (room) => {
        const lab = getRoomLab(room, labs);
        return lab
          ? <span className="badge badge-gray" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Building2 size={12} />{lab.nama_labs}</span>
          : <span style={{ color: 'var(--clr-dark-400)', fontSize: 'var(--text-xs)' }}>-</span>;
      },
    },
    {
      key: 'floor',
      header: 'Lantai',
      render: (room) => (
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-dark-600)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Layers size={12} />{room.lantai_ruangan}
        </span>
      ),
    },
    {
      key: 'pic',
      header: 'PIC Ruangan',
      render: (room) => {
        const pic = getRoomPic(room, users);
        return pic
          ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--clr-primary-100)', color: 'var(--clr-primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                {pic.name ? pic.name[0].toUpperCase() : 'U'}
              </div>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)' }}>{pic.name}</span>
            </div>
          )
          : <span style={{ color: 'var(--clr-dark-400)', fontSize: 'var(--text-xs)', fontStyle: 'italic' }}>Belum ada PIC</span>;
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      headerStyle: { width: 100 },
      render: (room) => (
        <div className="table-action-btns">
          {canEdit && (
            <IconButton
              icon={<Pencil size={13} />}
              label={`Edit ruangan ${room.nama_ruangan}`}
              variant="secondary"
              className="btn-action-icon"
              onClick={() => onEdit(room)}
              id={`btn-edit-ruangan-${room.id}`}
              title="Edit Ruangan"
              style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, padding: 0 }}
            />
          )}
          {canDelete && (
            <IconButton
              icon={<Trash2 size={13} />}
              label={`Hapus ruangan ${room.nama_ruangan}`}
              variant="secondary"
              className="btn-action-icon btn-action-delete"
              onClick={() => onDelete(room.id)}
              disabled={deleting === room.id}
              id={`btn-hapus-ruangan-${room.id}`}
              title="Hapus Ruangan"
              style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, padding: 0 }}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="table-card">
      <PaginatedDataTable
        wrapperClassName="table-borderless"
        rows={rooms}
        pagination={pagination}
        rowKey={(room) => room.id}
        columns={columns}
      >
        <div className="table-footer-summary">
          <span>Total ruangan uji: <strong>{rooms.length}</strong> dari <strong>{totalRooms}</strong></span>
          <span>Tersebar di <strong>{labs.length}</strong> laboratorium</span>
        </div>
      </PaginatedDataTable>
    </div>
  );
}
