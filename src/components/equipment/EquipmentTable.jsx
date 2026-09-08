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
            <th>Nama Alat</th>
            <th>Kategori</th>
            <th>Ruang</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map((eq, idx) => (
            <tr key={eq.id}>
              <td><span className="eq-row-num">{String(idx + 1).padStart(2, '0')}</span></td>
              <td><span className="loan-id-badge">{eq.assetNumber}</span></td>
              <td>
                <div>
                  <span className="tool-name-text">{eq.name}</span>
                  <br />
                  <small className="tool-code">{eq.brand} · {eq.model}</small>
                </div>
              </td>
              <td><span className="eq-category-tag">{eq.category}</span></td>
              <td><span className="eq-room-tag">{eq.room}</span></td>
              <td><EquipmentStatusBadge status={eq.status} /></td>
              <td>
                <div className="eq-actions">
                  <button className="eq-btn-action detail" onClick={() => onDetail(eq.id)} title="Detail">
                    <Eye size={14} /> Detail
                  </button>
                  {eq.status === 'Tersedia' && (isAdmin || userRole === 'staff' || !userRole) && (
                    <button className="eq-btn-action borrow" onClick={() => onBorrow(eq)} title="Pinjam Alat">
                      <BookOpen size={14} /> Pinjam
                    </button>
                  )}
                  {isAdmin && (
                    <>
                      <button className="eq-btn-action edit" onClick={() => onEdit(eq.id)} title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button className="eq-btn-action delete" onClick={() => onDelete(eq)} title="Hapus">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
