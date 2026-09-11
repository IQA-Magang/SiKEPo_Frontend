import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Shield,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Lock,
  Mail,
  Hash,
  Award,
  UserCheck,
  Star,
  StarOff
} from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import Sidebar from '../../components/layout/Sidebar';
import { userApi, getStoredUser, setStoredUser } from '../../utils/api';

const EMPTY_FORM = {
  nip: '',
  name: '',
  email: '',
  password: '',
  role: 'staff',
  position: '',
  pic: false
};

export default function UserManagement({ onNavigate, initialTab = 'users', embedded = false }) {
  const [user, setUser] = useState(getStoredUser);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [updatingPic, setUpdatingPic] = useState(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const current = getStoredUser();
    if (current) {
      setUser(current);
      if (current.role?.toLowerCase() !== 'admin') {
        onNavigate('/dashboard');
      }
    } else {
      onNavigate('/login');
    }

    const handleUserChanged = (e) => {
      if (e.detail) setUser(e.detail);
    };
    window.addEventListener('sikepo_user_changed', handleUserChanged);
    return () => window.removeEventListener('sikepo_user_changed', handleUserChanged);
  }, []);

  // Fetch users from backend API
  const fetchUsers = async () => {
    setLoading(true);
    setApiError('');
    try {
      const res = await userApi.getAll();
      if (res && res.data) {
        setUsers(res.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setApiError(err.message || 'Gagal terhubung ke backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter && u.role?.toLowerCase() !== roleFilter.toLowerCase()) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.nip && u.nip.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.position && u.position.toLowerCase().includes(q))
      );
    });
  }, [users, searchQuery, roleFilter]);

  const staffList = useMemo(() => {
    return users.filter(u => u.role?.toLowerCase() === 'staff');
  }, [users]);

  const filteredStaff = useMemo(() => {
    return staffList.filter((u) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.nip && u.nip.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.position && u.position.toLowerCase().includes(q))
      );
    });
  }, [staffList, searchQuery]);

  const handleTogglePic = async (staffUser) => {
    setUpdatingPic(staffUser.user_id);
    try {
      const newPicStatus = !staffUser.pic;
      await userApi.update(staffUser.user_id, { ...staffUser, pic: newPicStatus });
      setUsers(prev =>
        prev.map(u => u.user_id === staffUser.user_id ? { ...u, pic: newPicStatus } : u)
      );
      showNotice(
        newPicStatus
          ? `${staffUser.name} berhasil ditetapkan sebagai Petugas PIC.`
          : `Status PIC ${staffUser.name} berhasil dicabut.`
      );
    } catch (err) {
      alert(`Gagal memperbarui status PIC: ${err.message}`);
    } finally {
      setUpdatingPic(null);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData(EMPTY_FORM);
    setFormError('');
    setModalMode('create');
  };

  // Open Edit Modal
  const handleOpenEdit = (targetUser) => {
    setSelectedUserId(targetUser.user_id);
    setFormData({
      nip: targetUser.nip || '',
      name: targetUser.name || '',
      email: targetUser.email || '',
      password: '', // optional on update
      role: targetUser.role || 'staff',
      position: targetUser.position || '',
      pic: Boolean(targetUser.pic)
    });
    setFormError('');
    setModalMode('edit');
  };

  // Submit Create or Edit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const cleanName = formData.name.trim();
      const cleanEmail = formData.email.trim();
      const cleanNip = formData.nip.trim();
      const cleanRole = (formData.role || 'staff').trim();
      const cleanPosition = formData.position.trim();
      const isPic = Boolean(formData.pic);

      if (!cleanName || !cleanEmail || !cleanNip || !cleanPosition) {
        throw new Error('Semua field wajib diisi (NIP, Nama, Email, Peran, Jabatan)');
      }

      if (modalMode === 'create') {
        if (!formData.password || formData.password.length < 6) {
          throw new Error('Password wajib diisi minimal 6 karakter');
        }
        await userApi.create({
          nip: cleanNip,
          name: cleanName,
          email: cleanEmail,
          password: formData.password,
          role: cleanRole,
          position: cleanPosition,
          pic: isPic
        });
        showNotice(`User "${cleanName}" berhasil dibuat.`);
      } else if (modalMode === 'edit') {
        if (!selectedUserId) {
          throw new Error('ID user tidak valid untuk pembaruan');
        }

        const payload = {
          nip: cleanNip,
          name: cleanName,
          email: cleanEmail,
          role: cleanRole,
          position: cleanPosition,
          pic: isPic
        };

        if (formData.password && formData.password.trim().length >= 6) {
          payload.password = formData.password.trim();
        }

        const res = await userApi.update(selectedUserId, payload);
        showNotice(`Data user "${cleanName}" berhasil diperbarui.`);

        // Jika user yang diedit adalah akun admin yang sedang login
        const currentUser = getStoredUser();
        if (currentUser && (currentUser.user_id === selectedUserId || currentUser.nip === cleanNip || currentUser.email === cleanEmail)) {
          const updatedCurrent = {
            ...currentUser,
            ...(res?.data || {}),
            name: cleanName,
            email: cleanEmail,
            nip: cleanNip,
            role: cleanRole,
            position: cleanPosition
          };
          setUser(updatedCurrent);
          setStoredUser(updatedCurrent);
        }
      }

      setModalMode(null);
      fetchUsers();
    } catch (err) {
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirm and Execute Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    // Guard: admin cannot delete their own account
    const currentUser = getStoredUser();
    if (
      currentUser &&
      (String(currentUser.user_id) === String(deleteTarget.user_id) ||
        currentUser.email === deleteTarget.email)
    ) {
      setDeleteError('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
      return;
    }

    setDeleting(true);
    setDeleteError('');
    try {
      await userApi.delete(deleteTarget.user_id);
      showNotice(`Akun "${deleteTarget.name}" (NIP: ${deleteTarget.nip}) berhasil dihapus dari database.`);
      setDeleteTarget(null);
      setDeleteError('');
      fetchUsers();
    } catch (err) {
      setDeleteError(err.message || 'Gagal menghapus user. Coba lagi.');
    } finally {
      setDeleting(false);
    }
  };

  const innerContent = (
    <>
      {/* Notice Banner */}
      {notice && (
          <div className="eq-confirm-banner" style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} color="#059669" />
              <span>{notice}</span>
            </div>
          </div>
        )}

        {/* Delete Confirmation Banner */}
        {deleteTarget && (
          <div style={{ marginBottom: '16px' }}>
            <div className="eq-confirm-banner" style={{ background: '#FEF2F2', borderColor: '#FCA5A5', color: '#991B1B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} color="#DC2626" />
                <span>
                  Konfirmasi hapus akun <strong>{deleteTarget.name}</strong> (NIP: <code>{deleteTarget.nip}</code>)?
                  Akun ini akan <strong>dihapus permanen</strong> dan tidak dapat login lagi.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  className="eq-btn-action delete"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  id="btn-confirm-delete"
                >
                  {deleting ? 'Menghapus...' : '🗑️ Ya, Hapus Permanen'}
                </button>
                <button
                  className="eq-btn-cancel"
                  style={{ padding: '6px 14px' }}
                  onClick={() => { setDeleteTarget(null); setDeleteError(''); }}
                  id="btn-cancel-delete"
                >
                  Batal
                </button>
              </div>
            </div>
            {/* Inline error from delete operation */}
            {deleteError && (
              <div style={{ marginTop: '8px', padding: '10px 14px', background: '#FFF1F2', borderRadius: '8px', border: '1px solid #FECDD3', color: '#BE123C', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} color="#BE123C" />
                <span>{deleteError}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation: Manajemen Pengguna & Penetapan PIC */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', borderBottom: '2px solid #E5E7EB', paddingBottom: '0px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              fontSize: '13.5px',
              fontWeight: 700,
              border: 'none',
              borderBottom: activeTab === 'users' ? '3px solid #E30613' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'users' ? '#E30613' : '#6B7280',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} />
            <span>Daftar Akun Pengguna ({users.length})</span>
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              fontSize: '13.5px',
              fontWeight: 700,
              border: 'none',
              borderBottom: activeTab === 'pic' ? '3px solid #E30613' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'pic' ? '#E30613' : '#6B7280',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setActiveTab('pic')}
          >
            <UserCheck size={16} />
            <span>Penetapan PIC Staff ({staffList.filter(u => u.pic).length})</span>
          </button>
        </div>

        {activeTab === 'users' ? (
          <>
            {/* Page Header */}
            <div className="eq-page-header">
              <div>
                <h1 className="eq-page-title">Manajemen Akun Pengguna</h1>
                <p className="eq-page-sub">
                  Kelola seluruh akun personel laboratorium Telkom Test House terhubung langsung ke database backend
                </p>
              </div>
              <button className="btn-hero-primary" onClick={handleOpenCreate}>
                <Plus size={16} />
                <span>Tambah Pengguna Baru</span>
              </button>
            </div>

            {/* Quick Summary Counts */}
            <section className="stats-grid" style={{ marginBottom: '20px' }}>
              <article className="stat-card black">
                <div className="stat-header">
                  <span className="stat-badge">Database Aktif</span>
                  <div className="stat-icon-wrapper"><Users size={20} /></div>
                </div>
                <div className="stat-body">
                  <strong className="stat-value">{users.length} Akun</strong>
                  <span className="stat-title">Total Pengguna Terdaftar</span>
                </div>
                <div className="stat-footer">
                  <span className="stat-sub">Terdaftar di tabel users MySQL</span>
                </div>
              </article>

              <article className="stat-card red">
                <div className="stat-header">
                  <span className="stat-badge">Role Admin</span>
                  <div className="stat-icon-wrapper"><Shield size={20} /></div>
                </div>
                <div className="stat-body">
                  <strong className="stat-value">
                    {users.filter(u => u.role?.toLowerCase() === 'admin').length} Personel
                  </strong>
                  <span className="stat-title">Administrator Sistem</span>
                </div>
                <div className="stat-footer">
                  <span className="stat-sub">Hak akses master data penuh</span>
                </div>
              </article>

              <article className="stat-card darkgray">
                <div className="stat-header">
                  <span className="stat-badge">Role Manajer</span>
                  <div className="stat-icon-wrapper"><UserCheck size={20} /></div>
                </div>
                <div className="stat-body">
                  <strong className="stat-value">
                    {users.filter(u => u.role?.toLowerCase() === 'manager').length} Personel
                  </strong>
                  <span className="stat-title">Manajer Mutu & Lab</span>
                </div>
                <div className="stat-footer">
                  <span className="stat-sub">Otorisasi verifikasi TLKM13/P</span>
                </div>
              </article>

              <article className="stat-card gray">
                <div className="stat-header">
                  <span className="stat-badge">Role Staff</span>
                  <div className="stat-icon-wrapper"><Award size={20} /></div>
                </div>
                <div className="stat-body">
                  <strong className="stat-value">
                    {users.filter(u => u.role?.toLowerCase() === 'staff').length} Personel
                  </strong>
                  <span className="stat-title">Staff Pengujian Lab</span>
                </div>
                <div className="stat-footer">
                  <span className="stat-sub">Operasional peminjaman alat</span>
                </div>
              </article>
            </section>

        {/* Filters and Search */}
        <div className="eq-filter-card" style={{ marginBottom: '16px' }}>
          <div className="eq-filter-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama, NIP, email, atau jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="eq-filter-selects">
            <select
              className="eq-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Semua Peran (Role)</option>
              <option value="admin">Administrator</option>
              <option value="manager">Manajer</option>
              <option value="staff">Staff Lab</option>
            </select>

            <button
              className="btn-refresh"
              onClick={fetchUsers}
              title="Perbarui data dari database"
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Daftar Akun Pengguna</h2>
              <p className="panel-subtitle">
                {loading ? 'Memuat data dari backend...' : `${filteredUsers.length} pengguna ditemukan`}
              </p>
            </div>
          </div>

          {apiError && (
            <div style={{ padding: '16px 20px', background: '#FEF2F2', borderBottom: '1px solid #FECACA', color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} />
                <span>{apiError}</span>
              </div>
              <button className="btn-hero-secondary" style={{ padding: '4px 10px', fontSize: '11.5px' }} onClick={fetchUsers}>
                Coba Lagi
              </button>
            </div>
          )}

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIP Pegawai</th>
                  <th>Nama & Email</th>
                  <th>Peran (Role)</th>
                  <th>Jabatan / Posisi</th>
                  <th>Terdaftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => {
                  const roleLower = (u.role || 'staff').toLowerCase();
                  const isSelf = user && (
                    String(user.user_id) === String(u.user_id) ||
                    user.email === u.email
                  );
                  return (
                    <tr key={u.user_id || idx} style={isSelf ? { background: '#F0FDF4' } : {}}>
                      <td><span className="eq-row-num">{String(idx + 1).padStart(2, '0')}</span></td>
                      <td>
                        <div className="table-id-cell">
                          <strong style={{ color: '#111827', fontFamily: 'monospace' }}>{u.nip}</strong>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong className="tool-name-text">{u.name}</strong>
                          {isSelf && (
                            <span style={{ marginLeft: '6px', fontSize: '10px', background: '#DCFCE7', color: '#16A34A', borderRadius: '4px', padding: '1px 6px', fontWeight: 600 }}>
                              Anda
                            </span>
                          )}
                          <br />
                          <small style={{ color: '#6B7280' }}>{u.email}</small>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <span className={`role-tag-badge ${roleLower}`}>
                            <Shield size={11} />
                            {roleLower === 'admin' ? 'Admin' : roleLower === 'manager' ? 'Manajer' : 'Staff Lab'}
                          </span>
                          {u.pic && (
                            <span style={{ fontSize: '10px', background: '#FEF3C7', color: '#92400E', borderRadius: '4px', padding: '1px 6px', fontWeight: 700, border: '1px solid #FDE68A' }}>
                              PIC Lab / Alat
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="borrower-name">{u.position || '-'}</span>
                      </td>
                      <td>
                        <span className="date-text">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </span>
                      </td>
                      <td>
                        <div className="eq-actions">
                          <button
                            className="eq-btn-action edit"
                            onClick={() => handleOpenEdit(u)}
                            title="Edit Data User"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="eq-btn-action delete"
                            onClick={() => { setDeleteError(''); setDeleteTarget(u); }}
                            title={isSelf ? 'Tidak bisa menghapus akun Anda sendiri' : 'Hapus Akun User'}
                            disabled={isSelf}
                            style={isSelf ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center empty-table-cell">
                      Tidak ada data pengguna yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
          </>
        ) : (
          /* ====================================================
             TAB PENETAPAN PIC STAFF
             ==================================================== */
          <>
            {/* Page Header PIC */}
            <div className="eq-page-header">
              <div>
                <h1 className="eq-page-title">Penetapan Petugas PIC</h1>
                <p className="eq-page-sub">
                  Tetapkan staff sebagai PIC (Person in Charge) penanggung jawab peralatan laboratorium.
                  Hanya Staff dengan status PIC yang dapat dipilih saat menambahkan peralatan baru.
                </p>
              </div>
            </div>

            {/* Quick Stats PIC */}
            <section className="stats-grid" style={{ marginBottom: '20px' }}>
              <article className="stat-card black">
                <div className="stat-header">
                  <span className="stat-badge">Total Staff</span>
                  <div className="stat-icon-wrapper"><Users size={20} /></div>
                </div>
                <div className="stat-body">
                  <strong className="stat-value">{staffList.length} Orang</strong>
                  <span className="stat-title">Total Staff Laboratorium</span>
                </div>
                <div className="stat-footer">
                  <span className="stat-sub">Personel penguji lab</span>
                </div>
              </article>

              <article className="stat-card red">
                <div className="stat-header">
                  <span className="stat-badge">Sudah PIC</span>
                  <div className="stat-icon-wrapper"><Star size={20} /></div>
                </div>
                <div className="stat-body">
                  <strong className="stat-value">{staffList.filter(u => u.pic).length} Orang</strong>
                  <span className="stat-title">Staff Berstatus PIC</span>
                </div>
                <div className="stat-footer">
                  <span className="stat-sub">Dapat dipilih di form alat</span>
                </div>
              </article>

              <article className="stat-card gray">
                <div className="stat-header">
                  <span className="stat-badge">Belum PIC</span>
                  <div className="stat-icon-wrapper"><StarOff size={20} /></div>
                </div>
                <div className="stat-body">
                  <strong className="stat-value">{staffList.filter(u => !u.pic).length} Orang</strong>
                  <span className="stat-title">Staff Biasa</span>
                </div>
                <div className="stat-footer">
                  <span className="stat-sub">Belum ditugaskan sebagai PIC</span>
                </div>
              </article>
            </section>

            {/* Filters and Search for PIC */}
            <div className="eq-filter-card" style={{ marginBottom: '16px' }}>
              <div className="eq-filter-search">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Cari staff berdasarkan nama, NIP, email, atau jabatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="eq-filter-selects">
                <button
                  className="btn-refresh"
                  onClick={fetchUsers}
                  title="Perbarui data dari database"
                >
                  <RefreshCw size={13} className={loading ? 'spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Staff PIC Table */}
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2>Daftar Staff & Status Penetapan PIC</h2>
                  <p className="panel-subtitle">
                    Klik tombol aksi di kolom sebelah kanan untuk menetapkan atau mencabut status PIC staff
                  </p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>No</th>
                      <th>NIP</th>
                      <th>Nama Staff</th>
                      <th>Jabatan / Posisi</th>
                      <th>Email</th>
                      <th style={{ textAlign: 'center', width: '160px' }}>Status PIC</th>
                      <th style={{ textAlign: 'center', width: '170px' }}>Aksi Penetapan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center" style={{ padding: '32px' }}>
                          <RefreshCw size={20} className="spin" style={{ display: 'inline', marginRight: '8px' }} />
                          Memuat data staff...
                        </td>
                      </tr>
                    ) : filteredStaff.map((s, idx) => (
                      <tr key={s.user_id}>
                        <td style={{ color: '#9CA3AF', fontSize: '12px' }}>{idx + 1}</td>
                        <td>
                          <code style={{ fontSize: '12px', background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>
                            {s.nip || '-'}
                          </code>
                        </td>
                        <td>
                          <strong style={{ fontSize: '13.5px', color: '#111827' }}>{s.name}</strong>
                        </td>
                        <td>{s.position || '-'}</td>
                        <td style={{ color: '#6B7280', fontSize: '13px' }}>{s.email}</td>
                        <td style={{ textAlign: 'center' }}>
                          {s.pic ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', borderRadius: '14px', fontSize: '11.5px', fontWeight: 700 }}>
                              <Star size={12} fill="#059669" color="#059669" />
                              <span>Petugas PIC</span>
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: '14px', fontSize: '11.5px', fontWeight: 500 }}>
                              <span>Bukan PIC</span>
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {s.pic ? (
                            <button
                              className="eq-btn-action delete"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              disabled={updatingPic === s.user_id}
                              onClick={() => handleTogglePic(s)}
                              title="Cabut status PIC staff ini"
                            >
                              <StarOff size={13} />
                              <span>{updatingPic === s.user_id ? 'Proses...' : 'Cabut PIC'}</span>
                            </button>
                          ) : (
                            <button
                              className="btn-hero-primary"
                              style={{ padding: '6px 14px', fontSize: '12px', background: '#059669', borderColor: '#059669' }}
                              disabled={updatingPic === s.user_id}
                              onClick={() => handleTogglePic(s)}
                              title="Tetapkan staff ini sebagai PIC peralatan"
                            >
                              <Star size={13} />
                              <span>{updatingPic === s.user_id ? 'Proses...' : 'Jadikan PIC'}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {!loading && filteredStaff.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center empty-table-cell">
                          Tidak ada data staff laboratorium yang cocok.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Modal: Tambah / Edit Pengguna */}
        {modalMode && (
          <div className="profile-modal-overlay" onClick={() => !formSubmitting && setModalMode(null)}>
            <div className="profile-modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
              <div className="profile-modal-header">
                <div>
                  <h2 className="profile-name-heading">
                    {modalMode === 'create' ? 'Tambah Pengguna Baru' : 'Ubah Data Pengguna'}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                    {modalMode === 'create' ? 'Daftarkan akun personel baru ke database backend' : `Memperbarui akun NIP: ${formData.nip}`}
                  </p>
                </div>
                <button className="profile-close-btn" onClick={() => !formSubmitting && setModalMode(null)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm}>
                <div className="profile-modal-body" style={{ gap: '14px' }}>
                  {formError && (
                    <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#991B1B', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={16} />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="eq-form-group">
                    <label className="eq-form-label"><Hash size={13} /> NIP Pegawai *</label>
                    <input
                      type="text"
                      className="eq-form-input"
                      placeholder="Contoh: 199503222019022004"
                      value={formData.nip}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      required
                    />
                  </div>

                  <div className="eq-form-group">
                    <label className="eq-form-label">Nama Lengkap *</label>
                    <input
                      type="text"
                      className="eq-form-input"
                      placeholder="Contoh: Siti Nurhaliza, S.T."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="eq-form-group">
                    <label className="eq-form-label"><Mail size={13} /> Email Resmi *</label>
                    <input
                      type="email"
                      className="eq-form-input"
                      placeholder="Contoh: sitinurhaliza@telkom.co.id"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="eq-form-group">
                    <label className="eq-form-label">
                      <Lock size={13} /> Password {modalMode === 'create' ? '*' : '(Opsional)'}
                    </label>
                    <input
                      type="password"
                      className="eq-form-input"
                      placeholder={modalMode === 'create' ? 'Minimal 6 karakter' : 'Kosongkan jika tidak ingin mengubah'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={modalMode === 'create'}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '12px' }}>
                    <div className="eq-form-group">
                      <label className="eq-form-label"><Shield size={13} /> Peran (Role) *</label>
                      <select
                        className="eq-form-input"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        required
                      >
                        <option value="staff">Staff Lab</option>
                        <option value="manager">Manajer</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    <div className="eq-form-group">
                      <label className="eq-form-label"><Award size={13} /> Jabatan / Posisi *</label>
                      <input
                        type="text"
                        className="eq-form-input"
                        placeholder="Contoh: PIC Lab Optik"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="eq-form-group" style={{ marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#374151', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        style={{ width: '16px', height: '16px', accentColor: '#E30613' }}
                        checked={Boolean(formData.pic)}
                        onChange={(e) => setFormData({ ...formData, pic: e.target.checked })}
                      />
                      <span>Tetapkan sebagai Petugas PIC (Penanggung Jawab Ruangan / Alat)</span>
                    </label>
                  </div>
                </div>

                <div className="profile-modal-footer" style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="eq-btn-cancel"
                    onClick={() => setModalMode(null)}
                    disabled={formSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-hero-primary"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? 'Menyimpan...' : modalMode === 'create' ? 'Simpan Pengguna' : 'Perbarui Pengguna'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  );

  if (embedded) {
    return <div style={{ marginTop: '8px' }}>{innerContent}</div>;
  }

  return (
    <div className="app-shell">
      <Topbar
        user={user}
        onNavigate={onNavigate}
        title="Manajemen Pengguna"
        onUpdateUser={(updated) => setUser(updated)}
      />
      <Sidebar activePath="/users" onNavigate={onNavigate} />

      <main className="main-content">
        {innerContent}
      </main>
    </div>
  );
}
