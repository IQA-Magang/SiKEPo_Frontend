import React, { useState, useMemo, useEffect } from 'react';
import { Plus, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import Sidebar from '../../components/layout/Sidebar';
import EquipmentFilters from '../../components/equipment/EquipmentFilters';
import EquipmentTable from '../../components/equipment/EquipmentTable';
import { peralatanApi, getStoredUser } from '../../utils/api';
import { mockEquipment } from '../../data/mockEquipment';

const EMPTY_FILTERS = { query: '', status: '', room: '', category: '' };

export default function EquipmentList({ onNavigate }) {
  const [user, setUser] = useState(getStoredUser);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const handleUserChanged = (e) => {
      if (e.detail) setUser(e.detail);
    };
    window.addEventListener('sikepo_user_changed', handleUserChanged);
    return () => window.removeEventListener('sikepo_user_changed', handleUserChanged);
  }, []);

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // Fetch from backend API
  const fetchEquipment = async () => {
    setLoading(true);
    setApiError('');
    try {
      const res = await peralatanApi.getAll({
        search: filters.query || undefined,
        ruangan_id: filters.room || undefined,
        status_kelayakan: filters.status || undefined,
        limit: 100
      });

      if (res?.data && Array.isArray(res.data)) {
        setEquipment(res.data);
      } else {
        setEquipment([]);
      }
    } catch (err) {
      console.warn('Gagal memuat peralatan dari API backend, menggunakan fallback offline:', err);
      setApiError(err.message || 'Gagal terhubung ke backend API');
      // Fallback ke mock data jika backend belum dinyalakan
      setEquipment(mockEquipment);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, [filters.status, filters.room]);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  // Local search filter if querying without re-triggering API immediately
  const filtered = useMemo(() => {
    const q = (filters.query || '').toLowerCase().trim();
    if (!q) return equipment;
    return equipment.filter(eq => {
      const name = eq.nama_peralatan || eq.name || '';
      const assetNo = eq.nomor_aset || eq.assetNumber || '';
      const serial = eq.nomor_seri || eq.serialNumber || '';
      const brand = eq.merk || eq.brand || '';
      const model = eq.model || '';
      const room = eq.ruangan?.nama_ruangan || eq.room || '';
      return [name, assetNo, serial, brand, model, room].some(f => f.toLowerCase().includes(q));
    });
  }, [equipment, filters.query]);

  const handleDelete = async (eq) => {
    if (deleteTarget?.id === eq.id) {
      try {
        await peralatanApi.delete(eq.id);
        showNotice(`Peralatan "${eq.nama_peralatan || eq.name}" berhasil dihapus.`);
        setDeleteTarget(null);
        fetchEquipment();
      } catch (err) {
        alert(`Gagal menghapus peralatan: ${err.message}`);
      }
    } else {
      setDeleteTarget(eq);
    }
  };

  return (
    <div className="app-shell">
      <Topbar user={user} onNavigate={onNavigate} title="Daftar Alat Ukur" onUpdateUser={(u) => setUser(u)} />
      <Sidebar activePath="/alat-ukur" onNavigate={onNavigate} />

      <main className="main-content">
        {notice && (
          <div className="eq-confirm-banner" style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} color="#059669" />
              <span>{notice}</span>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="eq-page-header">
          <div>
            <h1 className="eq-page-title">Daftar Peralatan</h1>
            <p className="eq-page-sub">Kelola seluruh inventaris peralatan laboratorium Telkom Test House</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-refresh" onClick={fetchEquipment} title="Perbarui data dari backend">
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            {isAdmin && (
              <button className="btn-hero-primary" onClick={() => onNavigate('/alat-ukur/tambah')}>
                <Plus size={16} /><span>Tambah Peralatan</span>
              </button>
            )}
          </div>
        </div>

        {/* Delete confirmation banner */}
        {deleteTarget && (
          <div className="eq-confirm-banner">
            <span>Hapus <strong>{deleteTarget.nama_peralatan || deleteTarget.name}</strong> ({deleteTarget.nomor_aset || deleteTarget.assetNumber})? Tindakan ini tidak dapat dibatalkan.</span>
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
              <h2>Data Peralatan</h2>
              <p className="panel-subtitle">
                {loading ? 'Memuat data dari backend...' : `${filtered.length} peralatan ditemukan`}
              </p>
            </div>
          </div>

          {apiError && (
            <div style={{ padding: '12px 18px', background: '#FEF2F2', borderBottom: '1px solid #FECACA', color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>Backend offline atau database kosong. Menampilkan mode tinjau.</span>
              </div>
            </div>
          )}

          <EquipmentTable
            equipment={filtered}
            isAdmin={isAdmin}
            userRole={user?.role?.toLowerCase()}
            onDetail={(id) => onNavigate(`/alat-ukur/${id}`)}
            onVerify={(id) => onNavigate(`/verifikasi?peralatan=${id}`)}
            onDelete={handleDelete}
            onBorrow={(eq) => onNavigate('/peminjaman')}
          />
        </div>
      </main>
    </div>
  );
}
