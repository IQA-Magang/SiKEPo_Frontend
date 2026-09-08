import React from 'react';

const CONFIG = {
  Tersedia:    { bg: '#DCFCE7', color: '#15803D', dot: '#16A34A' },
  Dipinjam:    { bg: '#DBEAFE', color: '#1D4ED8', dot: '#2563EB' },
  Rusak:       { bg: '#FEE2E2', color: '#B91C1C', dot: '#DC2626' },
  Maintenance: { bg: '#FEF3C7', color: '#B45309', dot: '#D97706' },
};

export default function EquipmentStatusBadge({ status }) {
  const cfg = CONFIG[status] ?? { bg: '#F3F4F6', color: '#374151', dot: '#6B7280' };
  return (
    <span className="eq-status-badge" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      <span className="eq-status-dot" style={{ backgroundColor: cfg.dot }} />
      {status}
    </span>
  );
}
