import { Hand } from 'lucide-react';
import { getEquipmentId, STATUS_BADGE_CLASS } from '../../../shared/services/api.js';
import {
  Badge,
  Button,
} from '../../../shared/components/ui/index.js';
import PaginatedDataTable from '../../../shared/components/ui/PaginatedDataTable.jsx';

export default function EquipmentListTable({
  equipment,
  rooms,
  pagination,
  canViewVerification,
  canRequestLoan,
  onNavigate,
  returnPath,
}) {
  const columns = [
    {
      key: 'number',
      header: 'No.',
      headerStyle: { width: 40 },
      cellStyle: { color: 'var(--clr-dark-400)', width: 40 },
      render: (_, index) => pagination.startIndex + index + 1,
    },
    {
      key: 'asset',
      header: 'No. Aset',
      render: (item) => (
        <code className="equipment-list-table__asset-number">
          {item.nomor_aset || '–'}
        </code>
      ),
    },
    {
      key: 'name',
      header: 'Nama Peralatan',
      render: (item) => (
        <div className="equipment-list-table__identity">
          <span className="equipment-list-table__name">{item.nama_peralatan}</span>
          {(item.merek || item.tipe_model) && (
            <span className="equipment-list-table__metadata">
              {[item.merek, item.tipe_model].filter(Boolean).join(' — ')}
            </span>
          )}
          {item.peranti_lunak_versi && (
            <span className="equipment-list-table__firmware">
              Firmware: {item.peranti_lunak_versi}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'category-location',
      header: 'Kategori & Lokasi',
      render: (item) => {
        const room = rooms.find((candidate) => (
          String(candidate.id) === String(item.ruangan_id)
        ));
        const location = [room?.labs?.nama_labs, room?.nama_ruangan]
          .filter(Boolean)
          .join(' · ');

        return (
          <div className="equipment-list-table__stack">
            <Badge tone="neutral" className="equipment-list-table__category">
              {item.kategori_peralatan?.nama_kategori || '–'}
            </Badge>
            <span className="equipment-list-table__location">
              {location || 'Lokasi belum tersedia'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'description',
      header: 'Keterangan',
      render: (item) => {
        const approved = item.status_verifikasi === 'Disetujui';
        const rejected = item.status_verifikasi === 'Ditolak';
        const description = rejected
          ? 'Perlu verifikasi ulang'
          : !approved
            ? 'Menunggu verifikasi'
            : item.status_alat === 'Aktif'
              ? 'Masuk inventaris'
              : item.status_alat === 'Dalam Kalibrasi'
                ? 'Sedang dikalibrasi'
                : item.status_alat === 'Dipinjam'
                  ? 'Sedang dipinjam'
                  : item.status_alat === 'Rusak'
                    ? 'Dalam kondisi rusak'
                    : item.status_alat || 'Dalam proses';

        return (
          <Badge
            className={STATUS_BADGE_CLASS[rejected ? 'Rusak' : approved ? item.status_alat : 'Karantina'] || 'badge-gray'}
          >
            <span className="badge-dot" />
            {description}
          </Badge>
        );
      },
    },
    {
      key: 'last-user',
      header: 'Pemakai Terakhir',
      render: () => <span className="equipment-list-table__empty-value">–</span>,
    },
    {
      key: 'actions',
      header: 'Aksi',
      cellProps: () => ({ onClick: (event) => event.stopPropagation() }),
      render: (item) => {
        const itemId = getEquipmentId(item);
        const approved = item.status_verifikasi === 'Disetujui';
        const rejected = item.status_verifikasi === 'Ditolak';
        const detailPath = `/peralatan/detail/${itemId}?returnTo=${encodeURIComponent(returnPath)}`;
        const verificationPath = `/verifikasi/${itemId}?returnTo=${encodeURIComponent(returnPath)}`;

        return (
          <div className="equipment-list-table__actions">
            {canViewVerification && !approved && !rejected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate(verificationPath)}
                title="Mulai atau lanjutkan verifikasi"
              >
                Verifikasi
              </Button>
            )}
            {canViewVerification && rejected && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-error"
                  onClick={() => onNavigate(detailPath)}
                  title="Lihat Catatan Peninjauan (TLKM13/IK/012)"
                >
                  Tinjau
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate(verificationPath)}
                  title="Ajukan Verifikasi Ulang (TLKM13/IK/003)"
                >
                  Verifikasi Ulang
                </Button>
              </>
            )}
            {canRequestLoan && approved && item.status_alat === 'Aktif' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate('/peminjaman')}
                title="Pinjam peralatan"
              >
                <Hand size={14} />
                Pinjam
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="table-card">
      <PaginatedDataTable
        columns={columns}
        rows={equipment}
        pagination={pagination}
        rowKey={(item) => getEquipmentId(item)}
        className="data-table-mobile-priority equipment-list-table"
        rowProps={(item) => {
          const itemId = getEquipmentId(item);
          const detailPath = `/peralatan/detail/${itemId}?returnTo=${encodeURIComponent(returnPath)}`;

          return {
            className: 'cursor-pointer',
            onClick: () => onNavigate(detailPath),
            onKeyDown: (event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onNavigate(detailPath);
              }
            },
            tabIndex: 0,
            role: 'link',
            'aria-label': `Lihat detail ${item.nama_peralatan}`,
          };
        }}
        emptyMessage="Tidak ada peralatan ditemukan."
      />
    </div>
  );
}
