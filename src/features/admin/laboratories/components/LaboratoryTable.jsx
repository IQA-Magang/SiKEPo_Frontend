import { Building2, Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '../../../../shared/components/ui/index.js';
import PaginatedDataTable from '../../../../shared/components/ui/PaginatedDataTable.jsx';
import { getLabManager } from '../laboratoryData.js';

export default function LaboratoryTable({
  labs,
  managers,
  pagination,
  totalLabs,
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
      header: 'Kode Lab',
      headerStyle: { width: 140 },
      render: (lab) => <code className="text-mono-xs lab-management__code">{lab.kode_labs}</code>,
    },
    {
      key: 'name',
      header: 'Nama Laboratorium',
      render: (lab) => <span className="lab-management__name">{lab.nama_labs}</span>,
    },
    {
      key: 'manager',
      header: 'Penanggung Jawab / Manager',
      render: (lab) => {
        const manager = getLabManager(lab, managers);
        return manager ? (
          <div className="lab-management__manager">
            <div className="lab-management__manager-avatar">
              {manager.name ? manager.name[0].toUpperCase() : 'M'}
            </div>
            <div className="lab-management__manager-copy">
              <div className="lab-management__manager-name">{manager.name}</div>
              <div className="lab-management__manager-email">{manager.email}</div>
            </div>
          </div>
        ) : <span className="lab-management__manager-missing">Belum ditentukan</span>;
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      headerStyle: { width: 100 },
      render: (lab) => (
        <div className="lab-management__actions">
          {canEdit && (
            <IconButton
              icon={<Pencil size={14} />}
              label={`Edit laboratorium ${lab.nama_labs}`}
              variant="ghost"
              size="sm"
              onClick={() => onEdit(lab)}
              id={`btn-edit-lab-${lab.id}`}
              title="Edit Lab"
            />
          )}
          {canDelete && (
            <IconButton
              icon={<Trash2 size={14} />}
              label={`Hapus laboratorium ${lab.nama_labs}`}
              variant="danger"
              size="sm"
              onClick={() => onDelete(lab.id)}
              disabled={deleting === lab.id}
              id={`btn-hapus-lab-${lab.id}`}
              title="Hapus Lab"
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
        rows={labs}
        pagination={pagination}
        rowKey={(lab) => lab.id}
        columns={columns}
      >
        <div className="table-footer-summary">
          <span>Total laboratorium pengujian: <strong>{labs.length}</strong> dari <strong>{totalLabs}</strong></span>
          <span>Standar: <strong>ISO/IEC 17025:2017</strong></span>
        </div>
      </PaginatedDataTable>
    </div>
  );
}
