import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Star,
  StarOff,
  X
} from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import Sidebar from '../../components/layout/Sidebar';
import { userApi, getStoredUser } from '../../utils/api';

export default function PicManagement({ onNavigate }) {
  const [user, setUser] = useState(getStoredUser);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState(null); // user_id yang sedang diupdate

  useEffect(() => {
    const handleUserChanged = (e) => { if (e.detail) setUser(e.detail); };
    window.addEventListener('sikepo_user_changed', handleUserChanged);
    return () => window.removeEventListener('sikepo_user_changed', handleUserChanged);
  }, []);

  const role = (user?.role || 'staff').toLowerCase();
  // Hanya Admin yang boleh akses halaman ini
  useEffect(() => {
    if (role !== 'admin') {
      onNavigate('/dashboard');
    }
  }, [role]);

  const fetchStaff = async () => {
    setLoading(true);
    setApiError('');
    try {
      const res = await userApi.getAll();
      if (res?.data) {
        // Hanya tampilkan staff (bukan admin dan manager)
        const staff = res.data.filter(u => u.role?.toLowerCase() === 'staff');
        setStaffList(staff);
      }
    } catch (err) {
      setApiError(err.message || 'Gagal memuat daftar staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const showToast = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  const handleTogglePic = async (staffUser) => {
    setUpdating(staffUser.user_id);
    try {
      const newPicStatus = !staffUser.pic;
      await userApi.update(staffUser.user_id, { ...staffUser, pic: newPicStatus });
      setStaffList(prev =>
        prev.map(u => u.user_id === staffUser.user_id ? { ...u, pic: newPicStatus } : u)
      );
      showToast(
        newPicStatus
          ? `${staffUser.name} berhasil ditetapkan sebagai PIC.`
          : `Status PIC ${staffUser.name} berhasil dicabut.`
      );
    } catch (err) {
      alert(`Gagal mengubah status PIC: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const filteredStaff = staffList.filter(u => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return [u.name, u.email, u.position, u.nip].some(f => (f || '').toLowerCase().includes(q));
  });

  const picCount = staffList.filter(u => u.pic).length;

  return (
    <div className="app-shell">
      <Topbar user={user} onNavigate={onNavigate} title="Penetapan PIC Staff" onUpdateUser={(u) => setUser(u)} />
      <Sidebar activePath="/admin/pic-management" onNavigate={onNavigate} />

      <main className="main-content">
        {/* Toast */}
        {notice && (
          <div className="eq-confirm-banner" style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} color="#059669" />
              <span>{notice}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="eq-page-header">
          <div>
            <h1 className="eq-page-title">Penetapan Petugas PIC</h1>
            <p className="eq-page-sub">
              Tetapkan staff sebagai PIC (Person in Charge) penanggung jawab peralatan laboratorium.
              Hanya Staff dengan status PIC yang dapat dipilih saat menambahkan peralatan baru.
            </p>
          </div>
        </div>

        {/* Stats */}
        <section className="stats-grid" style={{ marginBottom: '20px' }}>
          <article className="stat-card black">
            <div className="stat-header">
              <span className="stat-badge">Total Staff</span>
              <div className="stat-icon-wrapper"><UserCheck size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">{staffList.length} Orang</strong>
              <span className="stat-title">Total Staff Laboratorium</span>
            </div>
          </article>

          <article className="stat-card red">
            <div className="stat-header">
              <span className="stat-badge">Sudah PIC</span>
              <div className="stat-icon-wrapper"><Star size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">{picCount} Orang</strong>
              <span className="stat-title">Staff Berstatus PIC</span>
            </div>
          </article>

          <article className="stat-card darkgray">
            <div className="stat-header">
              <span className="stat-badge">Belum PIC</span>
              <div className="stat-icon-wrapper"><StarOff size={20} /></div>
            </div>
            <div className="stat-body">
              <strong className="stat-value">{staffList.length - picCount} Orang</strong>
              <span className="stat-title">Staff Belum Ditetapkan</span>
            </div>
          </article>
        </section>

        {/* Info Box */}
        <div className="eq-filter-card" style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', marginBottom: '16px', padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertCircle size={16} color="#D97706" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: '12.5px', color: '#92400E', lineHeight: 1.6 }}>
              <strong>Aturan Penetapan PIC:</strong>
              <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                <li>Hanya user dengan role <strong>Staff</strong> yang dapat dijadikan PIC</li>
                <li>Admin dan Manager <strong>tidak bisa</strong> menjadi PIC peralatan</li>
                <li>PIC yang ditetapkan akan muncul di dropdown saat penambahan peralatan baru</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Search + Refresh */}
        <div className="eq-filter-card" style={{ marginBottom: '16px' }}>
          <div className="eq-filter-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari nama staff, email, atau NIP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="btn-hero-secondary"
            style={{ padding: '8px 14px', fontSize: '12px' }}
            onClick={fetchStaff}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Table */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Daftar Staff Laboratorium</h2>
              <p className="panel-subtitle">
                {loading ? 'Memuat data...' : `${filteredStaff.length} staff ditemukan`}
              </p>
            </div>
          </div>

          {apiError && (
            <div style={{ padding: '12px 20px', background: '#FEF2F2', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #FECACA' }}>
              <AlertCircle size={16} />
              <span>{apiError}</span>
              <button className="btn-hero-secondary" style={{ padding: '4px 10px', fontSize: '11px', marginLeft: 'auto' }} onClick={fetchStaff}>
                Coba Lagi
              </button>
            </div>
          )}

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Staff</th>
                  <th>Email</th>
                  <th>Jabatan / Posisi</th>
                  <th>NIP</th>
                  <th>Status PIC</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((s, idx) => (
                  <tr key={s.user_id}>
                    <td><span className="eq-row-num">{String(idx + 1).padStart(2, '0')}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {s.pic && <Star size={13} color="#D97706" />}
                        <strong className="tool-name-text">{s.name}</strong>
                      </div>
                    </td>
                    <td><span style={{ fontSize: '12.5px', color: '#374151' }}>{s.email || '-'}</span></td>
                    <td><span style={{ fontSize: '12.5px', color: '#4B5563' }}>{s.position || 'Staff Lab'}</span></td>
                    <td><span style={{ fontSize: '12px', color: '#6B7280', fontFamily: 'monospace' }}>{s.nip || '-'}</span></td>
                    <td>
                      <span className={`role-tag-badge ${s.pic ? 'admin' : 'manager'}`}>
                        {s.pic ? '★ PIC' : 'Bukan PIC'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={s.pic ? 'eq-btn-action delete' : 'btn-hero-primary'}
                        style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => handleTogglePic(s)}
                        disabled={updating === s.user_id}
                        title={s.pic ? 'Cabut Status PIC' : 'Jadikan PIC'}
                      >
                        {updating === s.user_id ? (
                          <RefreshCw size={12} className="spin" />
                        ) : s.pic ? (
                          <><StarOff size={12} /> Cabut PIC</>
                        ) : (
                          <><Star size={12} /> Jadikan PIC</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#6B7280' }}>
                      Tidak ada staff yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
