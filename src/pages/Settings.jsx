import React, { useState } from 'react';
import {
  User, Shield, KeyRound, Check, AlertCircle,
  Building, Server, LogOut, CheckCircle2, Users, FileText
} from 'lucide-react';
import { getCurrentUser, usersApi, authApi, API_BASE } from '../utils/api.js';
import UserManagement from './admin/UserManagement.jsx';

export default function Settings({ onNavigate }) {
  const user = getCurrentUser();
  const role = (user?.role || 'staff').toLowerCase();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'users' | 'system'
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const canViewUsers = role === 'admin' || role === 'manager';

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!password) {
      setPwdError('Password baru tidak boleh kosong.');
      return;
    }
    if (password.length < 6) {
      setPwdError('Password minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setPwdError('Konfirmasi password tidak cocok.');
      return;
    }

    setSavingPassword(true);
    try {
      if (!user?.user_id) {
        throw new Error('Data pengguna tidak ditemukan. Silakan login ulang.');
      }

      await usersApi.update(user.user_id, {
        nip: user.nip,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        pic: Boolean(user.pic),
        password: password,
      });

      setPwdSuccess('Password berhasil diperbarui!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdError(err.message || 'Gagal mengubah password.');
    } finally {
      setSavingPassword(false);
    }
  }

  function handleLogout() {
    authApi.logout();
    onNavigate('/login');
  }

  return (
    <div className="page-container fade-in-up">
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1 className="page-title">Pengaturan Sistem & Akun</h1>
        <p className="page-subtitle">
          Kelola profil pengguna, kredensial, hak akses, dan status koneksi sistem
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #E5E7EB',
          marginBottom: '28px',
          overflowX: 'auto',
        }}
      >
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 700,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'profile' ? '#E30613' : '#6B7280',
            borderBottom: activeTab === 'profile' ? '3px solid #E30613' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
          id="tab-btn-profile"
        >
          <User size={16} /> Profil & Akun
        </button>

        {canViewUsers && (
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === 'users' ? '#E30613' : '#6B7280',
              borderBottom: activeTab === 'users' ? '3px solid #E30613' : '3px solid transparent',
              marginBottom: '-2px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
            id="tab-btn-users"
          >
            <Users size={16} /> Manajemen Pengguna {role === 'manager' ? '(Lihat)' : ''}
          </button>
        )}

        <button
          onClick={() => setActiveTab('system')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: 700,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'system' ? '#E30613' : '#6B7280',
            borderBottom: activeTab === 'system' ? '3px solid #E30613' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
          id="tab-btn-system"
        >
          <Server size={16} /> Status Sistem & Matriks Akses
        </button>
      </div>

      {/* Tab 1: Profile & Password */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--sp-6)' }}>
          {/* Profile Card */}
          <div className="card" style={{ padding: 'var(--sp-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #E30613, #B8000A)',
                  color: '#fff',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 'var(--fw-bold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(227, 6, 19, 0.3)',
                }}
              >
                {initials}
              </div>
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-bold)', color: 'var(--clr-dark-900)' }}>
                  {user?.name || 'Nama Pengguna'}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginTop: 4 }}>
                  <span className={`badge ${user?.role === 'admin' ? 'badge-role-admin' : user?.role === 'manager' ? 'badge-role-manager' : 'badge-role-staff'}`}>
                    {user?.role?.toUpperCase() || 'STAFF'}
                  </span>
                  {user?.pic && <span className="badge badge-green">PIC ALAT</span>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', borderTop: '1px solid var(--clr-dark-100)', paddingTop: 'var(--sp-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--clr-dark-500)' }}>Nomor Induk Pegawai (NIP)</span>
                <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--clr-dark-800)' }}>{user?.nip || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--clr-dark-500)' }}>Email Resmi</span>
                <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--clr-dark-800)' }}>{user?.email || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                <span style={{ color: 'var(--clr-dark-500)' }}>Jabatan</span>
                <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--clr-dark-800)' }}>{user?.position || '-'}</span>
              </div>
            </div>

            <div style={{ marginTop: 'var(--sp-6)', paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--clr-dark-100)' }}>
              <button
                className="btn btn-outline"
                onClick={handleLogout}
                style={{ width: '100%', borderColor: 'var(--clr-error-500)', color: 'var(--clr-error-600)' }}
                id="btn-settings-logout"
              >
                <LogOut size={16} /> Keluar dari Aplikasi
              </button>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="card" style={{ padding: 'var(--sp-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
              <KeyRound size={20} style={{ color: '#E30613' }} />
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)' }}>
                Ganti Kata Sandi
              </h3>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', marginBottom: 'var(--sp-4)' }}>
              Pastikan kata sandi baru Anda unik, kuat, dan minimal terdiri dari 6 karakter.
            </p>

            {pwdError && (
              <div className="alert alert-error" style={{ marginBottom: 'var(--sp-3)', fontSize: 'var(--text-xs)' }}>
                <AlertCircle size={14} /> {pwdError}
              </div>
            )}

            {pwdSuccess && (
              <div className="alert alert-success" style={{ marginBottom: 'var(--sp-3)', fontSize: 'var(--text-xs)' }}>
                <CheckCircle2 size={14} /> {pwdSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="input-new-password">
                  Password Baru
                </label>
                <input
                  id="input-new-password"
                  type="password"
                  className="form-input"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-confirm-password">
                  Konfirmasi Password Baru
                </label>
                <input
                  id="input-confirm-password"
                  type="password"
                  className="form-input"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={savingPassword}
                id="btn-simpan-password"
                style={{ alignSelf: 'flex-start' }}
              >
                {savingPassword ? (
                  <>
                    <div className="spinner" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Simpan Password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Manajemen Pengguna (Admin: Full, Manager: View Only) */}
      {activeTab === 'users' && canViewUsers && (
        <div style={{ marginTop: '10px' }}>
          <UserManagement onNavigate={onNavigate} viewOnly={role !== 'admin'} />
        </div>
      )}

      {/* Tab 3: System Status & Access Matrix */}
      {activeTab === 'system' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card" style={{ padding: 'var(--sp-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
              <Server size={20} style={{ color: '#E30613' }} />
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)' }}>
                Status Sistem & Konfigurasi Backend
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--sp-4)' }}>
              <div style={{ background: 'var(--clr-dark-50)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', marginBottom: 4 }}>Backend API Endpoint</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', fontFamily: 'monospace' }}>{API_BASE}</div>
              </div>

              <div style={{ background: 'var(--clr-dark-50)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', marginBottom: 4 }}>Standar Kepatuhan</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: '#E30613' }}>ISO/IEC 17025:2017</div>
              </div>

              <div style={{ background: 'var(--clr-dark-50)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', marginBottom: 4 }}>Organisasi Lab</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)' }}>Telkom Test House (TTH)</div>
              </div>

              <div style={{ background: 'var(--clr-dark-50)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', marginBottom: 4 }}>Versi Frontend</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)' }}>SiKEPo v2.0 (React 18 + Vite)</div>
              </div>
            </div>
          </div>

          {/* Akses Fitur Berdasarkan Modul Card */}
          <div className="card" style={{ padding: 'var(--sp-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
              <Shield size={20} style={{ color: '#E30613' }} />
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)' }}>
                Matriks Hak Akses Modul SiKEPo
              </h3>
            </div>

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', marginBottom: 'var(--sp-4)' }}>
              Pemetaan wewenang operasional antara <strong>Staff Lab (Personel TTH)</strong>, <strong>Manager Lab</strong>, dan <strong>Administrator</strong> sesuai prosedur ISO/IEC 17025 Telkom Test House.
            </p>

            <div className="table-wrapper">
              <table className="data-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Modul / Fitur</th>
                    <th>Staff Lab</th>
                    <th>Manager Lab</th>
                    <th>Administrator</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Data Master (Peralatan, Lab)</strong></td>
                    <td><span className="badge badge-gray">Lihat</span></td>
                    <td><span className="badge badge-gray">Lihat</span></td>
                    <td><span className="badge badge-green">Penuh (CRUD)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Input Alat Ukur Baru & Status</strong></td>
                    <td><span style={{ color: '#9CA3AF' }}>–</span></td>
                    <td><span className="badge badge-green">Penuh (CRUD)</span></td>
                    <td><span className="badge badge-green">Penuh (CRUD)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Peminjaman & Pengembalian</strong></td>
                    <td><span className="badge badge-blue">Tambah & Ubah</span></td>
                    <td><span className="badge badge-blue">Tambah & Ubah</span></td>
                    <td><span className="badge badge-green">Penuh (CRUD)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Tracking Lokasi & Histori</strong></td>
                    <td><span className="badge badge-gray">Lihat</span></td>
                    <td><span className="badge badge-gray">Lihat</span></td>
                    <td><span className="badge badge-green">Penuh (CRUD)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Laporan & Dokumen Kalibrasi</strong></td>
                    <td><span className="badge badge-gray">Unduh / Lihat</span></td>
                    <td><span className="badge badge-green">Penuh (CRUD)</span></td>
                    <td><span className="badge badge-green">Penuh (CRUD)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Manajemen Pengguna</strong></td>
                    <td><span style={{ color: '#9CA3AF' }}>–</span></td>
                    <td><span className="badge badge-gray">Lihat di Pengaturan</span></td>
                    <td><span className="badge badge-green">Penuh di Pengaturan</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
