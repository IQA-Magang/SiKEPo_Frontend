import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  UserCheck,
  Users,
  LogOut,
  Shield
} from 'lucide-react';
import Topbar from '../components/layout/Topbar';
import Sidebar from '../components/layout/Sidebar';
import AdminProfile from './admin/AdminProfile';
import ManagerProfile from './manager/ManagerProfile';
import StaffProfile from './staff/StaffProfile';
import UserManagement from './admin/UserManagement';
import { getStoredUser, setStoredUser, userApi } from '../utils/api';

export default function Settings({ onNavigate, initialTab = 'profile' }) {
  const [user, setUser] = useState(getStoredUser);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    // Sync active user from database on mount
    const syncUser = async () => {
      try {
        if (user?.user_id) {
          const res = await userApi.getById(user.user_id);
          if (res?.data) {
            const fresh = { ...user, ...res.data };
            setUser(fresh);
            setStoredUser(fresh);
            return;
          }
        }
        const listRes = await userApi.getAll();
        if (listRes?.data?.length && (user?.email || user?.nip)) {
          const found = listRes.data.find(u =>
            (user.email && u.email === user.email) ||
            (user.nip && u.nip === user.nip)
          );
          if (found) {
            const fresh = { ...user, ...found };
            setUser(fresh);
            setStoredUser(fresh);
          }
        }
      } catch {
        // ignore offline errors
      }
    };
    syncUser();

    const handleUserChanged = (e) => {
      if (e.detail) setUser(e.detail);
    };
    window.addEventListener('sikepo_user_changed', handleUserChanged);
    return () => window.removeEventListener('sikepo_user_changed', handleUserChanged);
  }, []);

  const handleUpdateUser = (updated) => {
    setUser(updated);
    setStoredUser(updated);
  };

  const handleLogout = () => {
    setStoredUser(null);
    localStorage.removeItem('sikepo_token');
    onNavigate('/login');
  };

  const role = (user?.role || 'staff').toLowerCase();
  const isAdmin = role === 'admin';

  return (
    <div className="app-shell">
      <Topbar
        user={user}
        onNavigate={onNavigate}
        title="Pengaturan Sistem & Akun"
        onUpdateUser={handleUpdateUser}
      />
      <Sidebar activePath="/settings" onNavigate={onNavigate} />

      <main className="main-content">
        {/* Page Header */}
        <div className="eq-page-header" style={{ marginBottom: '18px' }}>
          <div>
            <h1 className="eq-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SettingsIcon size={24} style={{ color: 'var(--color-primary-red)' }} />
              <span>Pengaturan Aplikasi</span>
            </h1>
            <p className="eq-page-sub">
              Pusat konfigurasi profil personel, manajemen pengguna sistem, dan sesi keamanan akun
            </p>
          </div>
        </div>

        {/* Tab Navigation: Profil, Manajemen Pengguna, Logout */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '22px',
            borderBottom: '2px solid #E5E7EB',
            paddingBottom: '0px',
            flexWrap: 'wrap'
          }}
        >
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '13.5px',
              fontWeight: 700,
              border: 'none',
              borderBottom: activeTab === 'profile' ? '3px solid #E30613' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'profile' ? '#E30613' : '#6B7280',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setActiveTab('profile')}
            id="tab-settings-profile"
          >
            <UserCheck size={16} />
            <span>Profil Personel</span>
          </button>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
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
            id="tab-settings-users"
          >
            <Users size={16} />
            <span>Manajemen Pengguna</span>
            {isAdmin && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '10px',
                  background: '#FEF2F2',
                  color: '#E30613',
                  border: '1px solid #FECDD3'
                }}
              >
                ADMIN
              </span>
            )}
          </button>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              fontSize: '13.5px',
              fontWeight: 700,
              border: 'none',
              borderBottom: activeTab === 'logout' ? '3px solid #E30613' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === 'logout' ? '#E30613' : '#6B7280',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setActiveTab('logout')}
            id="tab-settings-logout"
          >
            <LogOut size={16} />
            <span>Keluar Aplikasi</span>
          </button>
        </div>

        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <div className="settings-tab-pane">
            {role === 'manager' ? (
              <ManagerProfile
                user={user}
                onUpdateUser={handleUpdateUser}
                onNavigate={onNavigate}
              />
            ) : role === 'staff' ? (
              <StaffProfile
                user={user}
                onUpdateUser={handleUpdateUser}
                onNavigate={onNavigate}
              />
            ) : (
              <AdminProfile
                user={user}
                onUpdateUser={handleUpdateUser}
                onNavigate={onNavigate}
              />
            )}
          </div>
        )}

        {/* Tab 2: Manajemen Pengguna */}
        {activeTab === 'users' && (
          <div className="settings-tab-pane">
            {isAdmin ? (
              <UserManagement
                onNavigate={onNavigate}
                embedded={true}
                initialTab="users"
              />
            ) : (
              <div
                className="panel"
                style={{ maxWidth: '640px', margin: '30px auto', textAlign: 'center', padding: '36px 24px' }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: '#FEF2F2',
                    color: '#E30613',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}
                >
                  <Shield size={26} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>
                  Akses Terbatas: Khusus Administrator
                </h3>
                <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, margin: '0 0 20px' }}>
                  Menu Manajemen Pengguna dan Penetapan PIC memerlukan hak akses Administrator Sistem. Akun Anda saat ini memiliki peran <strong>{role.toUpperCase()}</strong>.
                </p>
                <button
                  className="btn-hero-primary"
                  onClick={() => setActiveTab('profile')}
                >
                  Kembali ke Profil
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Keluar Aplikasi (Logout) */}
        {activeTab === 'logout' && (
          <div className="settings-tab-pane">
            <div
              className="panel"
              style={{
                maxWidth: '560px',
                margin: '24px auto',
                padding: '32px 28px',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: '#FEF2F2',
                    color: '#E30613',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <LogOut size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>
                    Konfirmasi Keluar Aplikasi
                  </h2>
                  <p style={{ fontSize: '12.5px', color: '#6B7280', margin: 0 }}>
                    Akhiri sesi kerja akun Anda pada perangkat ini
                  </p>
                </div>
              </div>

              {/* Sesi Detail Card */}
              <div
                style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '22px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                  <div className="avatar-circle" style={{ width: '36px', height: '36px', background: '#E30613', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', borderRadius: '50%' }}>
                    {(user?.name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#111827', display: 'block' }}>{user?.name || 'Administrator'}</strong>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>{user?.email || 'admin@sikepo.test'}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', paddingTop: '10px', borderTop: '1px solid #E5E7EB' }}>
                  <div>
                    <span style={{ color: '#9CA3AF', display: 'block' }}>Peran / Role:</span>
                    <strong style={{ color: '#111827', textTransform: 'uppercase' }}>{role}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#9CA3AF', display: 'block' }}>NIP Personel:</span>
                    <strong style={{ color: '#111827' }}>{user?.nip || '-'}</strong>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5, marginBottom: '24px' }}>
                Dengan keluar dari sistem, token autentikasi sesi peramban Anda akan dihapus secara aman. Anda perlu memasukkan kredensial login kembali saat ingin mengakses SiKEPo.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="eq-btn-cancel"
                  style={{ padding: '9px 18px' }}
                  onClick={() => setActiveTab('profile')}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn-hero-primary"
                  style={{ padding: '9px 20px', background: '#DC2626', borderColor: '#DC2626' }}
                  onClick={handleLogout}
                  id="btn-confirm-logout"
                >
                  <LogOut size={15} />
                  <span>Ya, Keluar Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
