import React, { useState } from 'react';
import {
  User, KeyRound, AlertCircle,
  LogOut, Users, CheckCircle2, Check
} from 'lucide-react';
import { getCurrentUser, usersApi } from '../../shared/services/api.js';
import UserManagement from '../admin/users/UserManagement.jsx';
import { Button, FormField, Card, Badge, PageHeader, Tabs } from '../../shared/components/ui/index.js';

export default function Settings({ onNavigate }) {
  const user = getCurrentUser();
  const role = (user?.role || 'staff').toLowerCase();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'users'
  const [currentPassword, setCurrentPassword] = useState('');
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

    if (!currentPassword) {
      setPwdError('Password saat ini wajib diisi.');
      return;
    }
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
      // Panggil endpoint khusus change password: PUT /api/users/me/password
      // Hanya mengirim current_password dan new_password (tidak mengubah role/email/user lain)
      try {
        await usersApi.changePassword({
          current_password: currentPassword,
          new_password: password,
        });
        setPwdSuccess('Password berhasil diperbarui!');
        setCurrentPassword('');
        setPassword('');
        setConfirmPassword('');
      } catch (err) {
        // Fallback untuk admin jika route /api/users/me/password belum diaktifkan di backend (404)
        if (role === 'admin' && (err.status === 404 || String(err.message).includes('404'))) {
          if (!user?.user_id) {
            throw new Error('Data pengguna tidak ditemukan. Silakan login ulang.');
          }
          await usersApi.update(user.user_id, {
            nip: user.nip,
            name: user.name,
            email: user.email,
            role: user.role,
            position: user.position,
            pengelola: Boolean(user.pengelola),
            labs_id: user.labs_id ?? null,
            password: password,
          });
          setPwdSuccess('Password berhasil diperbarui!');
          setCurrentPassword('');
          setPassword('');
          setConfirmPassword('');
        } else {
          throw err;
        }
      }
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
      <PageHeader
        title="Pengaturan Sistem & Akun"
        subtitle="Kelola profil dan kredensial akun"
        style={{ marginBottom: '20px' }}
      />

      <Tabs
        className="settings-tabs"
        ariaLabel="Pengaturan akun"
        activeId={activeTab}
        onChange={setActiveTab}
        tabs={[
          {
            id: 'profile',
            idAttribute: 'tab-btn-profile',
            label: <><User size={16} /> Profil & Akun</>,
          },
          ...(canViewUsers
            ? [{
                id: 'users',
                idAttribute: 'tab-btn-users',
                label: <><Users size={16} /> Manajemen Pengguna {role === 'manager' ? '(Lihat)' : ''}</>,
              }]
            : []),
        ]}
      />

      {/* Tab 1: Profile & Password */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--sp-6)' }}>
          {/* Profile Card */}
          <Card padding style={{ padding: 'var(--sp-6)' }}>
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
                  <Badge tone={user?.role === 'admin' ? 'primary' : user?.role === 'manager' ? 'info' : 'neutral'}>
                    {user?.role?.toUpperCase() || 'STAFF'}
                  </Badge>
                  {user?.pengelola && <Badge tone="success">PENGELOLA</Badge>}
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
              <Button
                variant="outline"
                onClick={handleLogout}
                style={{ width: '100%', borderColor: 'var(--clr-error-500)', color: 'var(--clr-error-600)' }}
                id="btn-settings-logout"
                icon={<LogOut size={16} />}
              >
                Keluar dari Aplikasi
              </Button>
            </div>
          </Card>

          {/* Change Password Card */}
          <Card padding style={{ padding: 'var(--sp-6)' }}>
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
              <FormField label="Password Saat Ini" htmlFor="input-current-password" required>
                <input
                  id="input-current-password"
                  type="password"
                  className="form-input"
                  placeholder="Masukkan password saat ini"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </FormField>

              <FormField label="Password Baru" htmlFor="input-new-password" required>
                <input
                  id="input-new-password"
                  type="password"
                  className="form-input"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </FormField>

              <FormField label="Konfirmasi Password Baru" htmlFor="input-confirm-password">
                <input
                  id="input-confirm-password"
                  type="password"
                  className="form-input"
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </FormField>

              <Button
                type="submit"
                variant="primary"
                disabled={savingPassword}
                id="btn-simpan-password"
                style={{ alignSelf: 'flex-start' }}
                icon={!savingPassword ? <Check size={16} /> : undefined}
              >
                {savingPassword ? (
                  <>
                    <div className="spinner" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Password'
                )}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Tab 2: Manajemen Pengguna (Admin: Full, Manager: View Only) */}
      {activeTab === 'users' && canViewUsers && (
        <div style={{ marginTop: '10px' }}>
          <UserManagement onNavigate={onNavigate} />
        </div>
      )}

    </div>
  );
}
