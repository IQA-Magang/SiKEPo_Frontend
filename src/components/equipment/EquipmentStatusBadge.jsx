import React from 'react';

const CONFIG = {
  aktif:        { bg: '#DCFCE7', color: '#15803D', dot: '#16A34A', label: 'Aktif' },
  pending:      { bg: '#FEF3C7', color: '#B45309', dot: '#D97706', label: 'Pending' },
  ditolak:      { bg: '#FEE2E2', color: '#B91C1C', dot: '#DC2626', label: 'Ditolak' },
  tidak_aktif:  { bg: '#F3F4F6', color: '#4B5563', dot: '#6B7280', label: 'Tidak Aktif' },
  // Fallback aliases
  Tersedia:     { bg: '#DCFCE7', color: '#15803D', dot: '#16A34A', label: 'Tersedia' },
  Dipinjam:     { bg: '#DBEAFE', color: '#1D4ED8', dot: '#2563EB', label: 'Dipinjam' },
  Rusak:        { bg: '#FEE2E2', color: '#B91C1C', dot: '#DC2626', label: 'Rusak' },
  Maintenance:  { bg: '#FEF3C7', color: '#B45309', dot: '#D97706', label: 'Maintenance' },
};

export default function EquipmentStatusBadge({ status }) {
  const normalizedKey = status ? String(status).toLowerCase() : '';
  const cfg = CONFIG[normalizedKey] || CONFIG[status] || {
    bg: '#F3F4F6',
    color: '#374151',
    dot: '#6B7280',
    label: status || '-'
  };

  return (
    <span className="eq-status-badge" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      <span className="eq-status-dot" style={{ backgroundColor: cfg.dot }} />
      {cfg.label || status}
    </span>
  );
}
