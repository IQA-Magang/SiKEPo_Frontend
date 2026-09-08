import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, ChevronDown, LogOut, UserCheck, Shield, Users } from 'lucide-react';
import tthLogo from '../../assets/logo/tth-logo.png';
import ProfileModal from '../ProfileModal';
import { getStoredUser, setStoredUser, userApi } from '../../utils/api';

export default function Topbar({ user, onNavigate, title, searchValue, onSearchChange, searchPlaceholder, onUpdateUser }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => user || getStoredUser());
  const profileRef = useRef(null);

  // Sync when prop user changes
  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);

  // Sync from backend database on mount to ensure live real name & role
  useEffect(() => {
    const syncRealUser = async () => {
      try {
        const stored = getStoredUser();
        if (stored?.user_id) {
          const res = await userApi.getById(stored.user_id);
          if (res?.data && res.data.name && res.data.name !== stored.name) {
            const fresh = { ...stored, ...res.data };
            setCurrentUser(fresh);
            setStoredUser(fresh);
            return;
          }
        }

        // Fallback: match by email/nip in backend list
        if (stored?.email || stored?.nip) {
          const listRes = await userApi.getAll();
          if (listRes?.data?.length) {
            const match = listRes.data.find(u =>
              (stored.email && u.email === stored.email) ||
              (stored.nip && u.nip === stored.nip)
            );
            if (match && (match.name !== stored.name || match.role !== stored.role)) {
              const fresh = { ...stored, ...match };
              setCurrentUser(fresh);
              setStoredUser(fresh);
            }
          }
        }
      } catch (err) {
        // Ignore offline error
      }
    };

    syncRealUser();
  }, []);

  // Sync when custom event sikepo_user_changed is triggered anywhere in the app
  useEffect(() => {
    const handleUserChanged = (e) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      }
    };
    window.addEventListener('sikepo_user_changed', handleUserChanged);
    return () => window.removeEventListener('sikepo_user_changed', handleUserChanged);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen]);

  const handleLogout = () => {
    setStoredUser(null);
    localStorage.removeItem('sikepo_token');
    onNavigate('/login');
  };

  const effectiveUser = currentUser || user;
  const userName = effectiveUser?.name || 'Administrator';
  const userRole = effectiveUser?.role ? (effectiveUser.role.charAt(0).toUpperCase() + effectiveUser.role.slice(1).toLowerCase()) : 'Admin';

  return (
    <header className="topbar">
      <div
        className="brand-wrap"
        onClick={() => onNavigate && onNavigate('/dashboard')}
        style={{ cursor: onNavigate ? 'pointer' : 'default' }}
        title="Kembali ke Dashboard"
      >
        <img src={tthLogo} alt="Telkom Test House Logo" className="topbar-logo" />
        <div className="brand-divider" />
        <span className="brand-name">SiKEPo</span>
      </div>

      {title ? (
        <span className="topbar-page-title">{title}</span>
      ) : (
        <div className="topbar-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder={searchPlaceholder || "Cari alat, kode inventaris, atau peminjam..."}
            value={searchValue ?? ''}
            onChange={onSearchChange}
            readOnly={!onSearchChange}
          />
        </div>
      )}

      <div className="topbar-right">
        <button className="icon-badge-button" title="Notifikasi">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        <div className="profile-wrapper" ref={profileRef}>
          <button className="profile-button" onClick={() => setProfileOpen(!profileOpen)} aria-expanded={profileOpen}>
            <div className="avatar-circle"><User size={15} /></div>
            <div className="user-meta">
              <span className="user-name-text">{userName}</span>
              <span className="user-role-badge">{userRole}</span>
            </div>
            <ChevronDown size={14} className={`chevron-icon ${profileOpen ? 'open' : ''}`} />
          </button>

          {profileOpen && (
            <div className="profile-dropdown-menu">
              <div className="dropdown-header">
                <strong>{userName}</strong>
                <p>{user?.email ?? 'admin@sikepo.test'}</p>
                {user?.position && (
                  <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0 6px' }}>
                    {user.position} {user.nip ? `• NIP: ${user.nip}` : ''}
                  </p>
                )}
                <span className="role-chip">{userRole}</span>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item profile-action-btn" onClick={() => { setProfileOpen(false); if (onNavigate) onNavigate('/profile'); }}>
                <UserCheck size={15} /><span>Profil Personel</span>
              </button>
              {userRole.toLowerCase() === 'admin' && (
                <button className="dropdown-item" onClick={() => { setProfileOpen(false); if (onNavigate) onNavigate('/users'); }}>
                  <Users size={15} /><span>Manajemen Pengguna</span>
                </button>
              )}
              <button className="dropdown-item" onClick={() => { setProfileOpen(false); setProfileModalOpen(true); }}>
                <Shield size={15} /><span>Matriks Hak Akses (TLKM13/P)</span>
              </button>
              <button className="dropdown-item" onClick={handleLogout}>
                <LogOut size={15} /><span>Keluar Aplikasi</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={effectiveUser}
      />
    </header>
  );
}
