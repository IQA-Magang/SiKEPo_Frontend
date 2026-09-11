import React from 'react';
import { Eye, Pencil, Trash2, BookOpen } from 'lucide-react';
import EquipmentStatusBadge from './EquipmentStatusBadge';

export default function EquipmentTable({ equipment, isAdmin, userRole, onDetail, onEdit, onDelete, onBorrow }) {
  if (equipment.length === 0) {
    return (
      <div className="eq-empty">
        <p>Tidak ada alat ukur ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="custom-table">
        <thead>
          <tr>
            <th>No</th>
            <th>Nomor Aset</th>
            <th>Nama Peralatan</th>
            <th>Kategori</th>
            <th>Ruangan</th>
            <th>Status Kelayakan</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map((eq, idx) => {
            const assetNo = eq.nomor_aset || eq.assetNumber || '-';
            const name = eq.nama_peralatan || eq.name || '-';
            const brand = eq.merk || eq.brand || '';
            const model = eq.model || '';
            const category = eq.kategori_peralatan || eq.category || 'Peralatan';
            const roomName = eq.ruangan ? `${eq.ruangan.kode_ruangan} - ${eq.ruangan.nama_ruangan}` : (eq.room || '-');
            const status = eq.status_kelayakan || eq.status || 'pending';
            const canBorrow = (status === 'aktif' || status === 'Tersedia');

            return (
              <tr key={eq.id}>
                <td><span className="eq-row-num">{String(idx + 1).padStart(2, '0')}</span></td>
                <td><span className="loan-id-badge">{assetNo}</span></td>
                <td>
                  <div>
                    <strong className="tool-name-text">{name}</strong>
                    {(brand || model) && (
                      <>
                        <br />
                        <small className="tool-code">{brand} {model ? `· ${model}` : ''}</small>
                      </>
                    )}
                  </div>
                </td>
                <td><span className="eq-category-tag">{category}</span></td>
                <td><span className="eq-room-tag">{roomName}</span></td>
                <td><EquipmentStatusBadge status={status} /></td>
                <td>
                  <div className="eq-actions">
                    <button className="eq-btn-action detail" onClick={() => onDetail(eq.id)} title="Detail Alat">
                      <Eye size={14} /> Detail
                    </button>
                    {canBorrow && (isAdmin || userRole === 'staff' || !userRole) && (
                      <button className="eq-btn-action borrow" onClick={() => onBorrow(eq)} title="Pinjam Alat">
                        <BookOpen size={14} /> Pinjam
                      </button>
                    )}
                    {isAdmin && (
                      <>
                        {onEdit && (
                          <button className="eq-btn-action edit" onClick={() => onEdit(eq.id)} title="Edit">
                            <Pencil size={14} />
                          </button>
                        )}
                        <button className="eq-btn-action delete" onClick={() => onDelete(eq)} title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
