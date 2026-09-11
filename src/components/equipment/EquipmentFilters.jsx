import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { ruanganApi } from '../../utils/api';

const STATUSES = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'pending', label: 'Pending Verifikasi' },
  { value: 'ditolak', label: 'Ditolak' },
  { value: 'tidak_aktif', label: 'Tidak Aktif' },
];

export default function EquipmentFilters({ filters, onChange }) {
  const [ruanganList, setRuanganList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    ruanganApi.getAll()
      .then(res => {
        if (isMounted && res?.data) setRuanganList(res.data);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  return (
    <div className="eq-toolbar">
      <div className="eq-search-wrap">
        <Search size={16} className="eq-search-icon" />
        <input
          className="eq-search-input"
          type="text"
          placeholder="Cari nomor aset, nama peralatan, atau merek..."
          value={filters.query || ''}
          onChange={set('query')}
        />
      </div>

      <div className="eq-filters">
        <select className="eq-filter-select" value={filters.status || ''} onChange={set('status')}>
          <option value="">Semua Status Kelayakan</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <select className="eq-filter-select" value={filters.room || ''} onChange={set('room')}>
          <option value="">Semua Ruangan</option>
          {ruanganList.map(r => (
            <option key={r.id} value={r.id}>
              {r.kode_ruangan} - {r.nama_ruangan}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
