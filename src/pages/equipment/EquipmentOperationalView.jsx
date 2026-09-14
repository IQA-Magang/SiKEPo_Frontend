import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ClipboardCheck, Eye, RefreshCw, Search, Wrench, Archive, ClipboardList } from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import Sidebar from '../../components/layout/Sidebar';
import EquipmentStatusBadge from '../../components/equipment/EquipmentStatusBadge';
import { getStoredUser, peralatanApi } from '../../utils/api';
import { mockEquipment } from '../../data/mockEquipment';

const VIEW_CONFIG = {
  review: {
    path: '/peninjauan-peralatan',
    title: 'Peninjauan Peralatan',
    description: 'Tinjau alat yang masih menunggu keputusan kelayakan atau perlu ditindaklanjuti.',
    icon: ClipboardList,
    matches: (item) => ['pending', 'ditolak'].includes(item.status_kelayakan || item.status)
  },
  obsolete: {
    path: '/peralatan-usang',
    title: 'Peralatan Usang',
    description: 'Pantau peralatan yang sudah tidak aktif atau tidak lagi berlaku.',
    icon: Archive,
    matches: (item) => ['tidak_aktif', 'tidak_berlaku'].includes(item.status_kelayakan || item.status) || item.kondisi === 'tidak_berlaku'
  },
  repair: {
    path: '/perbaikan',
    title: 'Perbaikan Peralatan',
    description: 'Kelola alat dengan kondisi tidak sesuai yang membutuhkan pemeriksaan dan perbaikan.',
    icon: Wrench,
    matches: (item) => item.kondisi === 'tidak_sesuai' || item.status_kelayakan === 'ditolak'
  }
};

export default function EquipmentOperationalView({ onNavigate, view }) {
  const config = VIEW_CONFIG[view];
  const [user, setUser] = useState(getStoredUser);
  const [equipment, setEquipment] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const handleUserChanged = (event) => {
      if (event.detail) setUser(event.detail);
    };
    window.addEventListener('sikepo_user_changed', handleUserChanged);
    return () => window.removeEventListener('sikepo_user_changed', handleUserChanged);
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    setApiError('');
    try {
      const response = await peralatanApi.getAll({ limit: 200 });
      setEquipment(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      setApiError(error.message || 'Gagal memuat data peralatan dari backend.');
      setEquipment(mockEquipment);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const filteredEquipment = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    return equipment.filter((item) => {
      if (!config.matches(item)) return false;
      if (!normalizedQuery) return true;
      const values = [
        item.nama_peralatan || item.name,
        item.nomor_aset || item.assetNumber,
        item.merk || item.brand,
        item.model,
        item.ruangan?.nama_ruangan || item.room
      ];
      return values.some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
    });
  }, [config, equipment, query]);

  const Icon = config.icon;
  const activeCount = filteredEquipment.filter((item) => (item.status_kelayakan || item.status) === 'aktif').length;

  return (
    <div className="app-shell">
      <Topbar user={user} onNavigate={onNavigate} title={config.title} onUpdateUser={setUser} />
      <Sidebar activePath={config.path} onNavigate={onNavigate} />
      <main className="main-content">
        <div className="eq-page-header">
          <div>
            <h1 className="eq-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icon size={23} style={{ color: 'var(--color-primary-red)' }} />
              <span>{config.title}</span>
            </h1>
            <p className="eq-page-sub">{config.description}</p>
          </div>
          <button className="btn-refresh" onClick={fetchEquipment} title="Perbarui data">
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <section className="stats-grid" style={{ marginBottom: '20px' }}>
          <article className="stat-card black">
            <div className="stat-header"><span className="stat-badge">Total Ditampilkan</span><div className="stat-icon-wrapper"><Icon size={20} /></div></div>
            <div className="stat-body"><strong className="stat-value">{filteredEquipment.length} Alat</strong><span className="stat-title">Sesuai kelompok halaman</span></div>
          </article>
          <article className="stat-card red">
            <div className="stat-header"><span className="stat-badge">Perlu Tindakan</span><div className="stat-icon-wrapper"><ClipboardCheck size={20} /></div></div>
            <div className="stat-body"><strong className="stat-value">{filteredEquipment.length - activeCount} Alat</strong><span className="stat-title">Belum berstatus aktif</span></div>
          </article>
        </section>

        <div className="eq-toolbar">
          <div className="eq-search-wrap">
            <Search size={16} className="eq-search-icon" />
            <input className="eq-search-input" type="search" placeholder="Cari nomor aset, nama, merek, atau ruangan..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>

        <div className="panel" style={{ marginTop: '16px' }}>
          <div className="panel-header">
            <div>
              <h2>Daftar {config.title}</h2>
              <p className="panel-subtitle">{loading ? 'Memuat data dari backend...' : `${filteredEquipment.length} peralatan ditemukan`}</p>
            </div>
          </div>
          {apiError && (
            <div style={{ padding: '12px 18px', background: '#FEF2F2', borderBottom: '1px solid #FECACA', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>Backend offline. Menampilkan data mode tinjau.</span>
            </div>
          )}
          {filteredEquipment.length === 0 ? (
            <div className="eq-empty"><p>Tidak ada peralatan dalam kelompok ini.</p></div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead><tr><th>No</th><th>Nomor Aset</th><th>Nama Peralatan</th><th>Ruangan</th><th>Kondisi</th><th>Status</th><th>Aksi</th></tr></thead>
                <tbody>
                  {filteredEquipment.map((item, index) => {
                    const name = item.nama_peralatan || item.name || '-';
                    const assetNo = item.nomor_aset || item.assetNumber || '-';
                    const condition = item.kondisi || '-';
                    const status = item.status_kelayakan || item.status || 'pending';
                    const room = item.ruangan ? `${item.ruangan.kode_ruangan} - ${item.ruangan.nama_ruangan}` : (item.room || '-');
                    return (
                      <tr key={item.id}>
                        <td><span className="eq-row-num">{String(index + 1).padStart(2, '0')}</span></td>
                        <td><span className="loan-id-badge">{assetNo}</span></td>
                        <td><strong className="tool-name-text">{name}</strong></td>
                        <td><span className="eq-room-tag">{room}</span></td>
                        <td>{condition === 'tidak_sesuai' ? 'Tidak Sesuai' : condition === 'tidak_berlaku' ? 'Tidak Berlaku' : 'Sesuai'}</td>
                        <td><EquipmentStatusBadge status={status} /></td>
                        <td><div className="eq-actions">
                          <button className="eq-btn-action detail" onClick={() => onNavigate(`/alat-ukur/${item.id}`)}><Eye size={14} /> Detail</button>
                          <button className="eq-btn-action verify" onClick={() => onNavigate(`/verifikasi?peralatan=${item.id}`)}><ClipboardCheck size={14} /> Verifikasi</button>
                        </div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
