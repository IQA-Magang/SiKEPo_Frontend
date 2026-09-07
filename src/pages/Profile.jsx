import React, { useState, useEffect } from 'react';
import Topbar from '../components/layout/Topbar';
import Sidebar from '../components/layout/Sidebar';
import AdminProfile from './admin/AdminProfile';
import ManagerProfile from './manager/ManagerProfile';
import StaffProfile from './staff/StaffProfile';
import { mockUsers } from '../data/mockUsers';

export default function Profile({ onNavigate }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('sikepo_user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const role = (user?.role || 'admin').toLowerCase();

  const handleRoleChange = (newRole) => {
    const template = mockUsers.find(u => u.role === newRole) || {
      name: newRole === 'manager' ? 'Ir. Hendra Wijaya, M.T.' : newRole === 'staff' ? 'Siti Nurhaliza, S.T.' : 'Ahmad Rizky',
      role: newRole,
      email: `${newRole}@sikepo.test`,
      nip: newRole === 'manager' ? '197509142000031001' : newRole === 'staff' ? '199503222019022004' : '198805122011011002',
      position: newRole === 'manager' ? 'Manager Penjaminan Mutu & Pengujian' : newRole === 'staff' ? 'Staff Pengujian Lab Optik (PIC)' : 'Administrator Sistem',
      division: newRole === 'manager' ? 'Manajemen Mutu Laboratorium (TLKM13/P)' : newRole === 'staff' ? 'Laboratorium Transmisi' : 'IT & Sistem Lab'
    };
    const updated = { ...(user || {}), ...template };
    setUser(updated);
    localStorage.setItem('sikepo_user', JSON.stringify(updated));
  };

  return (
    <div className="app-shell">
      <Topbar
        user={user}
        onNavigate={onNavigate}
        title="Profil Personel & Hak Akses"
        onUpdateUser={(updated) => setUser(updated)}
      />
      <Sidebar activePath="/profile" onNavigate={onNavigate} />

      <main className="main-content">
        {role === 'manager' ? (
          <ManagerProfile
            user={user}
            onUpdateUser={(updated) => setUser(updated)}
            onSwitchRole={handleRoleChange}
            onNavigate={onNavigate}
          />
        ) : role === 'staff' ? (
          <StaffProfile
            user={user}
            onUpdateUser={(updated) => setUser(updated)}
            onSwitchRole={handleRoleChange}
            onNavigate={onNavigate}
          />
        ) : (
          <AdminProfile
            user={user}
            onUpdateUser={(updated) => setUser(updated)}
            onSwitchRole={handleRoleChange}
            onNavigate={onNavigate}
          />
        )}
      </main>
    </div>
  );
}
