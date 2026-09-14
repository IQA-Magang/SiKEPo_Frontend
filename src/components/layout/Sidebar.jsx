import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Wrench,
  ShieldCheck,
  Building2,
  Settings2,
  ChevronDown,
  X
} from 'lucide-react';
import { getStoredUser } from '../../utils/api';

function NavGroup({ label, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="nav-group">
      <button
        className="nav-group-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon size={16} className="nav-group-icon" />
          <span className="nav-group-label">{label}</span>
        </div>
        <ChevronDown
          size={13}
          className="nav-group-chevron"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        />
      </button>
      {open && (
        <div className="nav-group-children">
          {children}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ activePath, onNavigate, mobileOpen: _ext, onMobileClose: _extClose }) {
  const [userRole, setUserRole] = useState(() => (getStoredUser()?.role || 'staff').toLowerCase());
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setMobileOpen(prev => !prev);
    window.addEventListener('sikepo_toggle_mobile_sidebar', handleToggle);
    return () => window.removeEventListener('sikepo_toggle_mobile_sidebar', handleToggle);
  }, []);

  useEffect(() => {
    const handleUserChanged = (e) => {
      if (e.detail?.role) setUserRole(e.detail.role.toLowerCase());
    };
    window.addEventListener('sikepo_user_changed', handleUserChanged);
    return () => window.removeEventListener('sikepo_user_changed', handleUserChanged);
  }, []);

  const isManajemenAlatActive = ['/alat-ukur', '/peminjaman', '/verifikasi', '/peninjauan-peralatan', '/peralatan-usang', '/perbaikan'].some(
    p => activePath === p || activePath.startsWith(p + '/')
  );
  const isPengaturanActive = ['/admin/kelompok-peralatan', '/admin/kelompok-lab', '/admin/kelompok-aset', '/admin/kelompok-lokasi'].some(
    p => activePath === p
  );
  const isPemeriksaanActive = activePath.startsWith('/pemeriksaan/');

  const navigate = (path) => {
    onNavigate(path);
    setMobileOpen(false);
  };

  const NavItem = ({ label, path }) => {
    const isActive = activePath === path || (path !== '/dashboard' && activePath.startsWith(path + '/'));
    return (
      <button
        className={`nav-item nav-child ${isActive ? 'active' : ''}`}
        onClick={() => navigate(path)}
      >
        <span className="nav-label">{label}</span>
        {isActive && <div className="active-indicator" />}
      </button>
    );
  };

  const NavTopItem = ({ label, icon: Icon, path }) => {
    const isActive = activePath === path;
    return (
      <button
        className={`nav-item ${isActive ? 'active' : ''}`}
        onClick={() => navigate(path)}
      >
        <Icon className="nav-icon-svg" size={19} />
        <span className="nav-label">{label}</span>
        {isActive && <div className="active-indicator" />}
      </button>
    );
  };

  return (
    <>
      {/* Overlay untuk mobile */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar${mobileOpen ? ' sidebar-mobile-open' : ''}`}>
        {/* Header mobile dengan tombol tutup */}
        <div className="sidebar-mobile-header">
          <span className="sidebar-brand">SiKEPo</span>
          <button className="sidebar-close-btn" onClick={() => setMobileOpen(false)} aria-label="Tutup menu">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-top">
          <div className="sidebar-section-label">MENU UTAMA</div>
          <nav aria-label="Navigasi utama">
            <NavTopItem label="Dashboard" icon={LayoutDashboard} path="/dashboard" />

            {/* Manajemen alat dan tindak lanjut kondisi peralatan */}
            <NavGroup label="Manajemen Alat" icon={Wrench} defaultOpen={isManajemenAlatActive}>
              <NavItem label="Peralatan" path="/alat-ukur" />
              <NavItem label="Peminjaman" path="/peminjaman" />
              <NavItem label="Verifikasi" path="/verifikasi" />
              <NavItem label="Peninjauan Peralatan" path="/peninjauan-peralatan" />
              <NavItem label="Peralatan Usang" path="/peralatan-usang" />
              <NavItem label="Perbaikan" path="/perbaikan" />
            </NavGroup>

            <NavGroup label="Pemeriksaan Peralatan" icon={ShieldCheck} defaultOpen={isPemeriksaanActive}>
              <NavItem label="Kalibrasi" path="/pemeriksaan/kalibrasi" />
              <NavItem label="Verifikasi Fungsi" path="/pemeriksaan/verifikasi-fungsi" />
              <NavItem label="Pengecekan Antara" path="/pemeriksaan/pengecekan-antara" />
              <NavItem label="Pemeliharaan" path="/pemeriksaan/pemeliharaan" />
              <NavItem label="Karakterisasi Ulang" path="/pemeriksaan/karakterisasi-ulang" />
            </NavGroup>

            {/* Pengaturan master data — admin only */}
            {userRole === 'admin' && (
              <NavGroup label="Pengaturan" icon={Settings2} defaultOpen={isPengaturanActive}>
                <NavItem label="Kelompok Peralatan" path="/admin/kelompok-peralatan" />
                <NavItem label="Kelompok Lab" path="/admin/kelompok-lab" />
                <NavItem label="Kelompok Aset" path="/admin/kelompok-aset" />
                <NavItem label="Kelompok Lokasi" path="/admin/kelompok-lokasi" />
              </NavGroup>
            )}
          </nav>
        </div>

        <div className="sidebar-system-card">
          <div className="system-card-header">
            <ShieldCheck size={16} className="text-red" />
            <span>Telkom Test House</span>
          </div>
          <p className="system-card-desc">System of Knowing Equipment Position</p>
          <div className="system-card-ver">SIKEPO v1.0 • Stable</div>
        </div>
      </aside>
    </>
  );
}
