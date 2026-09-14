import React, { useState, useMemo, useEffect } from 'react';
import { Plus, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import Sidebar from '../../components/layout/Sidebar';
import EquipmentFilters from '../../components/equipment/EquipmentFilters';
import EquipmentTable from '../../components/equipment/EquipmentTable';
import { peralatanApi, getStoredUser, getCachedEquipment } from '../../utils/api';

const EMPTY_FILTERS = { query: '', status: '', room: '', category: '' };

export default function EquipmentList({ onNavigate }) {
  const [user, setUser] = useState(getStoredUser);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
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

  // Fetch from backend API, with cache fallback for newly created records.
  const fetchEquipment = async () => {
    setLoading(true);
    setApiError('');
    try {
      const response = await peralatanApi.getAll({
        search: filters.query || undefined,
        ruangan_id: filters.room || undefined,
        status_alat: filters.status || undefined
      });
      if (Array.isArray(response?.data)) {
        setEquipment(response.data);
      } else {
        setEquipment(getCachedEquipment());
      }
    } catch (err) {
      console.warn('Gagal memuat peralatan dari backend:', err);
      setEquipment(getCachedEquipment());
      setApiError(err.message || 'Gagal memuat data peralatan dari backend.');
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

  // Local search filter
  const filtered = useMemo(() => {
    const q = (filters.query || '').toLowerCase().trim();
    if (!q) return equipment;
    return equipment.filter(eq => {
      const name = eq.nama_peralatan || eq.name || '';
      const assetNo = eq.nomor_aset || eq.assetNumber || '';
      const serial = eq.nomor_seri || eq.serialNumber || '';
      const brand = eq.merk || eq.merek || eq.brand || '';
      const model = eq.tipe_model || eq.model || '';
      const room = eq.ruangan?.nama_ruangan || eq.room || '';
      return [name, assetNo, serial, brand, model, room].some(f => f.toLowerCase().includes(q));
    });
  }, [equipment, filters.query]);

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
            <div style={{ padding: '12px 18px', background: '#FEF2F2', borderBottom: '1px solid #FECACA', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
                <span>{apiError}</span>
            </div>
          )}

          <EquipmentTable
            equipment={filtered}
          />
        </div>
      </main>
    </div>
  );
}
