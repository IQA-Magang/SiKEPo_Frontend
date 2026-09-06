import React, { useState } from 'react';
import { Search, Bell, User, ChevronDown, LogOut } from 'lucide-react';
import tthLogo from '../../assets/logo/tth-logo.png';

export default function Topbar({ user, onNavigate, title, searchValue, onSearchChange, searchPlaceholder }) {
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('sikepo_user');
    onNavigate('/login');
  };

  const userName = user?.name ?? 'Administrator';
  const userRole = user?.role ?? 'Admin';

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

        <div className="profile-wrapper">
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
                <span className="role-chip">{userRole}</span>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={handleLogout}>
                <LogOut size={15} /><span>Keluar Aplikasi</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
