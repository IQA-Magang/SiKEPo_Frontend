import React from 'react';
import { LayoutDashboard, Wrench, ArrowRightLeft, ShieldCheck, UserCheck, Users } from 'lucide-react';

export default function Sidebar({ activePath, onNavigate }) {
  let userRole = 'staff';
  try {
    const raw = localStorage.getItem('sikepo_user');
    if (raw) userRole = (JSON.parse(raw).role || 'staff').toLowerCase();
  } catch (e) {}

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Alat Ukur', icon: Wrench, path: '/alat-ukur' },
    { label: 'Peminjaman', icon: ArrowRightLeft, path: '/peminjaman' },
    ...(userRole === 'admin' ? [{ label: 'Kelola Pengguna', icon: Users, path: '/users' }] : []),
    { label: 'Profil & Akses', icon: UserCheck, path: '/profile' },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-section-label">MENU UTAMA</div>
        <nav aria-label="Navigasi utama">
          {menuItems.map(({ label, icon: Icon, path }) => {
            const isActive = activePath === path || (path !== '/dashboard' && activePath.startsWith(path));
            return (
              <button
                key={path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onNavigate(path)}
              >
                <Icon className="nav-icon-svg" size={19} />
                <span className="nav-label">{label}</span>
                {isActive && <div className="active-indicator" />}
              </button>
            );
          })}
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
  );
}
