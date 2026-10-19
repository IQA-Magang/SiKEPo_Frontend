import { Building2, Pencil, Trash2 } from 'lucide-react';
import {
  Badge,
  IconButton,
} from '../../../../shared/components/ui/index.js';
import PaginatedDataTable from '../../../../shared/components/ui/PaginatedDataTable.jsx';
import {
  getAssetGroupLab,
  getAssetGroupPic,
} from '../assetGroupData.js';

export default function AssetGroupTable({
  assetGroups,
  labs,
  users,
  pagination,
  totalGroups,
  canEdit,
  canDelete,
  deletingId,
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
      header: 'Kode Kelompok',
      headerStyle: { width: 130 },
      render: (group) => <code className="text-mono-xs asset-group-table__code">{group.kode}</code>,
    },
    {
      key: 'name',
      header: 'Nama Kelompok Aset',
      render: (group) => <span className="asset-group-table__name">{group.nama}</span>,
    },
    {
      key: 'lab',
      header: 'Laboratorium',
      render: (group) => {
        const lab = getAssetGroupLab(group, labs);
        return lab ? (
          <Badge tone="neutral" className="asset-group-table__lab">
            <Building2 size={12} />
            {lab.nama_labs}
          </Badge>
        ) : (
          <span className="asset-group-table__missing">-</span>
        );
      },
    },
    {
      key: 'pic',
      header: 'PIC Aset',
      render: (group) => {
        const pic = getAssetGroupPic(group, users);
        return pic ? (
          <div className="asset-group-table__pic">
            <span className="asset-group-table__avatar" aria-hidden="true">
              {pic.name ? pic.name[0].toUpperCase() : 'P'}
            </span>
            <span className="asset-group-table__pic-name">{pic.name}</span>
          </div>
        ) : (
          <span className="asset-group-table__missing asset-group-table__missing--italic">
            Belum ditentukan
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      headerStyle: { width: 100 },
      render: (group) => (
        <div className="asset-group-table__actions">
          {canEdit && (
            <IconButton
              icon={<Pencil size={14} />}
              label={`Edit kelompok aset ${group.nama}`}
              variant="ghost"
              size="sm"
              onClick={() => onEdit(group)}
              id={`btn-edit-kelompok-aset-${group.id}`}
              title="Edit Kelompok Aset"
            />
          )}
          {canDelete && (
            <IconButton
              icon={<Trash2 size={14} />}
              label={`Hapus kelompok aset ${group.nama}`}
              variant="danger"
              size="sm"
              onClick={() => onDelete(group.id)}
              disabled={deletingId === group.id}
              id={`btn-hapus-kelompok-aset-${group.id}`}
              title="Hapus Kelompok Aset"
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
        rows={assetGroups}
        pagination={pagination}
        rowKey={(group) => group.id}
        columns={columns}
      >
        <div className="table-footer-summary">
          <span>
            Total kelompok aset: <strong>{assetGroups.length}</strong> dari <strong>{totalGroups}</strong>
          </span>
          <span>
            Laboratorium terkait: <strong>{labs.length}</strong>
          </span>
        </div>
      </PaginatedDataTable>
    </div>
  );
}
