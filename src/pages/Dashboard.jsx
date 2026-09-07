import React, { useState, useEffect } from 'react';
import Topbar from '../components/layout/Topbar';
import Sidebar from '../components/layout/Sidebar';
import AdminDashboard from './admin/AdminDashboard';
import ManagerDashboard from './manager/ManagerDashboard';
import StaffDashboard from './staff/StaffDashboard';
import { mockUsers } from '../data/mockUsers';

const recentLoans = [
  { id: 'PMJ-089', code: 'TTH-OTDR-014', tool: 'OTDR EXFO FTB-1v2 Pro',             borrower: 'Ahmad Rizky (Div. Optik)',      date: '06 Sep 2026', returnDate: '10 Sep 2026', status: 'Dipinjam',  statusTone: 'warning' },
  { id: 'PMJ-088', code: 'TTH-OSA-003',  tool: 'Optical Spectrum Analyzer Yokogawa', borrower: 'Siti Nurhaliza (Lab Transmisi)', date: '05 Sep 2026', returnDate: '08 Sep 2026', status: 'Dipinjam',  statusTone: 'warning' },
  { id: 'PMJ-087', code: 'TTH-FUS-021',  tool: 'Fusion Splicer Fujikura 90S',        borrower: 'Budi Santoso (Mitra Teknik)',    date: '03 Sep 2026', returnDate: '06 Sep 2026', status: 'Kembali',   statusTone: 'success' },
  { id: 'PMJ-086', code: 'TTH-PWR-007',  tool: 'Optical Power Meter Anritsu',        borrower: 'Dedi Kurniawan (Lab Frekuensi)', date: '01 Sep 2026', returnDate: '04 Sep 2026', status: 'Kembali',   statusTone: 'success' },
  { id: 'PMJ-085', code: 'TTH-ETH-002',  tool: 'Ethernet Tester VeEX TX300s',        borrower: 'Eko Prasetyo (Sertifikasi)',     date: '28 Agu 2026', returnDate: '02 Sep 2026', status: 'Terlambat', statusTone: 'danger'  },
];

export default function Dashboard({ onNavigate }) {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Quick switch role handler
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
        searchValue={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        onUpdateUser={(updated) => setUser(updated)}
      />

      <Sidebar activePath="/dashboard" onNavigate={onNavigate} />

      <main className="main-content">
        {role === 'manager' ? (
          <ManagerDashboard
            user={user}
            onNavigate={onNavigate}
            onSwitchRole={handleRoleChange}
            recentLoans={recentLoans}
            searchQuery={searchQuery}
          />
        ) : role === 'staff' ? (
          <StaffDashboard
            user={user}
            onNavigate={onNavigate}
            onSwitchRole={handleRoleChange}
            recentLoans={recentLoans}
            searchQuery={searchQuery}
          />
        ) : (
          <AdminDashboard
            user={user}
            onNavigate={onNavigate}
            onSwitchRole={handleRoleChange}
            recentLoans={recentLoans}
            searchQuery={searchQuery}
          />
        )}
      </main>
    </div>
  );
}
