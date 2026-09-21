import React, { useState, useEffect, useRef } from 'react';
import { Search, User, ChevronDown, LogOut, Menu, Settings, QrCode } from 'lucide-react';
import { getCurrentUser, authApi } from '../../utils/api.js';
import { ACCESS, ACTIONS, can } from '../../utils/permissions.js';
import NotificationBell from '../NotificationBell.jsx';

import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';

export default function Topbar({ currentPath, onNavigate, onToggleSidebar, onSearch, onScanQr }) {
  const [profileOpen, setProfileOpen] = useState(false);

  const [user, setUser] = useState(getCurrentUser);
  const [searchVal, setSearchVal] = useState('');
  const profileRef = useRef(null);

  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    setUser(getCurrentUser());
  }, [currentPath]);

  // Handle outside click for profile dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [profileOpen]);

  async function handleLogout() {
    setProfileOpen(false);
    const confirmed = await confirm({
      title: 'Keluar dari SiKEPo',
      message: 'Apakah Anda yakin ingin mengakhiri sesi login saat ini?',
      confirmText: 'Keluar',
      cancelText: 'Batal',
      variant: 'warning',
    });
    if (!confirmed) return;

    authApi.logout();
    toast.info('Anda telah berhasil keluar dari akun.');
    onNavigate('/login');
  }

  function handleSearchChange(e) {
    setSearchVal(e.target.value);
    if (onSearch) onSearch(e.target.value);
  }

  const userName = user?.name || 'Administrator';
  const rawRole = user?.role || 'admin';
  const userRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="topbar-hamburger"
          onClick={onToggleSidebar}
          aria-label="Buka menu navigasi"
          title="Buka Menu"
        >
          <Menu size={22} />
        </button>

        <div
          className="brand-wrap brand-wrap-clickable"
          onClick={() => onNavigate('/dashboard')}
          title="Kembali ke Dashboard"
        >
          {/* TTH Logo SVG */}
          <div className="topbar-tth-logo">
            <svg width="42" height="30" viewBox="0 0 70 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 25C15 15 25 35 35 25C45 15 55 35 65 25" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
              <text x="35" y="44" fill="#FFFFFF" fontSize="13" fontWeight="800" textAnchor="middle" fontFamily="var(--font-sans)">tth</text>
            </svg>
            <div className="topbar-tth-sub">Telkom Test House</div>
          </div>

          <div className="brand-divider" />
          <span className="brand-name">SiKEPo</span>
        </div>
      </div>

      {/* Center Search Pill */}
      <div className="topbar-search">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Cari peralatan, kode aset, atau ruangan..."
          value={searchVal}
          onChange={handleSearchChange}
        />
      </div>

      {/* Topbar Right */}
      <div className="topbar-right">

        {can(ACCESS.QR_CODE, ACTIONS.VIEW, user) && (
          <button
            className="topbar-qr-btn"
            onClick={onScanQr}
            aria-label="Buka scanner QR peralatan"
            title="Scan QR Peralatan"
            id="btn-topbar-scan-qr"
          >
            <QrCode size={16} />
            <span className="topbar-btn-text">Scan QR</span>
          </button>
        )}

        {/* Live Notification Bell */}
        {user?.role === 'manager' && <NotificationBell onNavigate={onNavigate} />}

        <div className="profile-wrapper" ref={profileRef}>
          <button
            className="profile-button"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
            id="btn-topbar-profile"
          >
            <div className="avatar-circle">
              <User size={15} />
            </div>
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
                <p>{user?.email || 'admin@sikepo.tth'}</p>
                <span className="role-chip">{userRole}</span>
              </div>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                onClick={() => {
                  setProfileOpen(false);
                  onNavigate('/settings');
                }}
                id="btn-dropdown-settings"
              >
                <Settings size={16} />
                <span>Pengaturan</span>
              </button>
              <button
                className="dropdown-item text-red"
                onClick={handleLogout}
                id="btn-dropdown-logout"
              >
                <LogOut size={16} />
                <span>Keluar Aplikasi</span>
              </button>
            </div>
          )}
        </div>
      </div>


    </header>
  );
}
