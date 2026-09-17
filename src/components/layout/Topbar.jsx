import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, ChevronDown, LogOut, Menu, Settings, ShieldCheck, QrCode } from 'lucide-react';
import { getCurrentUser, authApi } from '../../utils/api.js';
import NotificationBell from '../NotificationBell.jsx';
import QRScannerModal from '../QRScannerModal.jsx';

export default function Topbar({ currentPath, onNavigate, onToggleSidebar, onSearch }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [user, setUser] = useState(getCurrentUser);
  const [searchVal, setSearchVal] = useState('');
  const profileRef = useRef(null);

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

  function handleLogout() {
    authApi.logout();
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
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          className="topbar-hamburger"
          onClick={onToggleSidebar}
          aria-label="Buka menu navigasi"
          title="Buka Menu"
        >
          <Menu size={22} />
        </button>

        <div
          className="brand-wrap"
          onClick={() => onNavigate('/dashboard')}
          style={{ cursor: 'pointer' }}
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
          placeholder="Cari alat, kode inventaris, atau peminjam..."
          value={searchVal}
          onChange={handleSearchChange}
        />
      </div>

      {/* Topbar Right */}
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
        {/* Tombol Scan QR Code by ID */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setIsQrOpen(true)}
          title="Scan Kode QR Peralatan"
          id="btn-topbar-scan-qr"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <QrCode size={16} style={{ color: 'var(--clr-primary-500)' }} />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)' }}>Scan QR</span>
        </button>

        {/* Live Notification Bell */}
        <NotificationBell onNavigate={onNavigate} />

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

      {/* Modal Pemindai QR Code */}
      <QRScannerModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        onNavigate={onNavigate}
      />
    </header>
  );
}
