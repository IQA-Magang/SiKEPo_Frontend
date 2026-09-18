import React, { useState } from 'react';
import {
  LayoutDashboard,
  Wrench,
  ShieldCheck,
  Settings2,
  ChevronDown,
  X
} from 'lucide-react';
import { ACCESS, ACTIONS, can, getUserRole } from '../../utils/permissions.js';

function NavGroup({ label, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="nav-group">
      <button
        className="nav-group-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="nav-group-left">
          <Icon size={15} className="nav-group-icon" />
          <span className="nav-group-label">{label}</span>
        </div>
        <ChevronDown
          size={13}
          className={`nav-group-chevron ${open ? 'open' : ''}`}
        />
      </button>
      {open && <div className="nav-group-children">{children}</div>}
    </div>
  );
}

export default function Sidebar({ currentPath, onNavigate, onClose, open: mobileOpen }) {
  const userRole = getUserRole();
  const canView = (feature) => can(feature, ACTIONS.VIEW);

  const isManajemenAlatActive =
    currentPath === '/peralatan' ||
    currentPath.startsWith('/peralatan/') ||
    ['/peminjaman', '/verifikasi', '/peninjauan-peralatan', '/peralatan-usang', '/perbaikan'].includes(currentPath);

  const isPengaturanActive = [
    '/admin/kategori',
    '/admin/labs',
    '/admin/kelompok-aset',
    '/admin/ruangan',
    '/admin/users',
  ].includes(currentPath);

  function navigate(path) {
    onNavigate(path);
    if (onClose) onClose();
  }

  const NavItem = ({ label, path, feature, roles, disabled = false }) => {
    if (feature && !canView(feature)) return null;
    if (roles && Array.isArray(roles) && !roles.includes(userRole)) return null;

    const isActive =
      currentPath === path || (path !== '/dashboard' && currentPath.startsWith(path + '/'));

    return (
      <button
        className={`nav-item nav-child ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && navigate(path)}
        disabled={disabled}
        aria-disabled={disabled}
        title={disabled ? 'Modul dalam pengembangan' : undefined}
      >
        <span className="nav-label">{label}</span>
        {disabled && <span className="nav-badge-soon">Segera</span>}
        {isActive && <div className="active-indicator" />}
      </button>
    );
  };

  const NavTopItem = ({ label, icon: Icon, path }) => {
    const isActive = currentPath === path;
    return (
      <button
        className={`nav-item ${isActive ? 'active' : ''}`}
        onClick={() => navigate(path)}
      >
        <Icon className="nav-icon-svg" size={17} />
        <span className="nav-label">{label}</span>
        {isActive && <div className="active-indicator" />}
      </button>
    );
  };

  return (
    <>
      <aside className={`sidebar ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        {/* Mobile Header with close button */}
        <div className="sidebar-mobile-header">
          <span className="sidebar-brand">SiKEPo</span>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Tutup menu">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-top">
          <div className="sidebar-section-label">MENU UTAMA</div>
          <nav aria-label="Navigasi utama">
            <NavTopItem label="Dashboard" icon={LayoutDashboard} path="/dashboard" />

            {/* MANAJEMEN ALAT */}
            <NavGroup
              label="MANAJEMEN ALAT"
              icon={Wrench}
              defaultOpen={isManajemenAlatActive}
            >
              <NavItem label="Peralatan" path="/peralatan" feature={ACCESS.MASTER_EQUIPMENT} />
              {/* <NavItem label="Peminjaman" path="/peminjaman" feature={ACCESS.LOAN_REQUEST} disabled /> */}
              <NavItem label="Verifikasi" path="/verifikasi" feature={ACCESS.DIGITAL_CHECK_FORM} />
              <NavItem label="Peninjauan Peralatan" path="/peninjauan-peralatan" feature={ACCESS.EQUIPMENT_ELIGIBILITY} disabled />
              <NavItem label="Peralatan Usang" path="/peralatan-usang" feature={ACCESS.EQUIPMENT_ELIGIBILITY} disabled />
              <NavItem label="Perbaikan" path="/perbaikan" feature={ACCESS.EQUIPMENT_USAGE} disabled />
            </NavGroup>

            {/* PEMERIKSAAN PERALATAN */}
            <NavGroup label="PEMERIKSAAN PERALATAN" icon={ShieldCheck} defaultOpen={false}>
              <NavItem label="Kalibrasi" path="/pemeriksaan/kalibrasi" feature={ACCESS.CALIBRATION_DOCUMENTS} disabled />
              <NavItem label="Verifikasi Fungsi" path="/pemeriksaan/verifikasi-fungsi" feature={ACCESS.EQUIPMENT_ELIGIBILITY} disabled />
              <NavItem label="Pengecekan Antara" path="/pemeriksaan/pengecekan-antara" feature={ACCESS.DIGITAL_CHECK_FORM} disabled />
              <NavItem label="Pemeliharaan" path="/pemeriksaan/pemeliharaan" feature={ACCESS.EQUIPMENT_USAGE} disabled />
              <NavItem label="Karakterisasi Ulang" path="/pemeriksaan/karakterisasi-ulang" feature={ACCESS.EQUIPMENT_ELIGIBILITY} disabled />
            </NavGroup>

            {/* PENGATURAN INVENTARIS */}
            {userRole !== 'staff' && (
              <NavGroup
                label="PENGATURAN INVENTARIS"
                icon={Settings2}
                defaultOpen={isPengaturanActive}
              >
                <NavItem label="Kelompok Peralatan" path="/admin/kategori" feature={ACCESS.MASTER_EQUIPMENT} roles={['admin', 'manager']} />
                <NavItem label="Kelompok Lab" path="/admin/labs" feature={ACCESS.MASTER_LAB} roles={['admin']} />
                <NavItem label="Kelompok Aset" path="/admin/kelompok-aset" feature={ACCESS.MASTER_EQUIPMENT} roles={['admin']} />
                <NavItem label="Kelompok Lokasi" path="/admin/ruangan" feature={ACCESS.MASTER_EQUIPMENT} roles={['admin']} />
              </NavGroup>
            )}
          </nav>
        </div>

        {/* Bottom System Card */}
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
