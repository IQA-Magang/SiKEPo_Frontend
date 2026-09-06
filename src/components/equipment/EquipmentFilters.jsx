import React from 'react';
import { Search } from 'lucide-react';
import { ROOMS, CATEGORIES, STATUSES } from '../../data/mockEquipment';

export default function EquipmentFilters({ filters, onChange }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  return (
    <div className="eq-toolbar">
      <div className="eq-search-wrap">
        <Search size={16} className="eq-search-icon" />
        <input
          className="eq-search-input"
          type="text"
          placeholder="Cari alat, nomor aset, ruangan, kategori..."
          value={filters.query}
          onChange={set('query')}
        />
      </div>

      <div className="eq-filters">
        <select className="eq-filter-select" value={filters.status} onChange={set('status')}>
          <option value="">Semua Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select className="eq-filter-select" value={filters.room} onChange={set('room')}>
          <option value="">Semua Ruangan</option>
          {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select className="eq-filter-select" value={filters.category} onChange={set('category')}>
          <option value="">Semua Kategori</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}
