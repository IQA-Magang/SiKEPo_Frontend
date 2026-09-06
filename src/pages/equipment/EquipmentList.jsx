import React, { useState, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import Sidebar from '../../components/layout/Sidebar';
import EquipmentFilters from '../../components/equipment/EquipmentFilters';
import EquipmentTable from '../../components/equipment/EquipmentTable';
import { mockEquipment } from '../../data/mockEquipment';

const EMPTY_FILTERS = { query: '', status: '', room: '', category: '' };

export default function EquipmentList({ onNavigate }) {
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [equipment, setEquipment] = useState(mockEquipment);

  useEffect(() => {
    const raw = localStorage.getItem('sikepo_user');
    if (raw) try { setUser(JSON.parse(raw)); } catch (e) { console.error(e); }
  }, []);

  const isAdmin = user?.role === 'Admin';

  const filtered = useMemo(() => {
    const q = filters.query.toLowerCase();
    return equipment.filter(eq => {
      if (filters.status && eq.status !== filters.status) return false;
      if (filters.room && eq.room !== filters.room) return false;
      if (filters.category && eq.category !== filters.category) return false;
      if (!q) return true;
      return [eq.name, eq.assetNumber, eq.serialNumber, eq.room, eq.category, eq.brand]
        .some(f => f.toLowerCase().includes(q));
    });
  }, [equipment, filters]);

  const handleDelete = (eq) => {
    if (deleteTarget?.id === eq.id) {
      setEquipment(prev => prev.filter(e => e.id !== eq.id));
      setDeleteTarget(null);
    } else {
      setDeleteTarget(eq);
    }
  };

  return (
    <div className="app-shell">
      <Topbar user={user} onNavigate={onNavigate} title="Daftar Alat Ukur" />
      <Sidebar activePath="/alat-ukur" onNavigate={onNavigate} />

      <main className="main-content">
        {/* Page Header */}
        <div className="eq-page-header">
          <div>
            <h1 className="eq-page-title">Daftar Alat Ukur</h1>
            <p className="eq-page-sub">Kelola seluruh alat ukur laboratorium Telkom Test House</p>
          </div>
          {isAdmin && (
            <button className="btn-hero-primary" onClick={() => onNavigate('/alat-ukur/tambah')}>
              <Plus size={16} /><span>Tambah Alat</span>
            </button>
          )}
        </div>

        {/* Delete confirmation banner */}
        {deleteTarget && (
          <div className="eq-confirm-banner">
            <span>Hapus <strong>{deleteTarget.name}</strong>? Tindakan ini tidak dapat dibatalkan.</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="eq-btn-action delete" onClick={() => handleDelete(deleteTarget)}>Ya, Hapus</button>
              <button className="eq-btn-cancel" style={{ padding: '6px 14px' }} onClick={() => setDeleteTarget(null)}>Batal</button>
            </div>
          </div>
        )}

        {/* Filters */}
        <EquipmentFilters filters={filters} onChange={setFilters} />

        {/* Table */}
        <div className="panel" style={{ marginTop: '16px' }}>
          <div className="panel-header">
            <div>
              <h2>Data Alat Ukur</h2>
              <p className="panel-subtitle">{filtered.length} alat ditemukan</p>
            </div>
          </div>
          <EquipmentTable
            equipment={filtered}
            isAdmin={isAdmin}
            onDetail={(id) => onNavigate(`/alat-ukur/${id}`)}
            onEdit={(id) => onNavigate(`/alat-ukur/edit/${id}`)}
            onDelete={handleDelete}
            onBorrow={(eq) => alert(`Fitur Pinjam alat "${eq.name}" akan segera tersedia.`)}
          />
        </div>
      </main>
    </div>
  );
}
