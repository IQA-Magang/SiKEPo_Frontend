import React, { useState, useEffect } from 'react';
import Topbar from '../components/layout/Topbar';
import Sidebar from '../components/layout/Sidebar';
import AdminProfile from './admin/AdminProfile';
import ManagerProfile from './manager/ManagerProfile';
import StaffProfile from './staff/StaffProfile';
import { mockUsers } from '../data/mockUsers';
import { getStoredUser, setStoredUser, userApi } from '../utils/api';

export default function Profile({ onNavigate }) {
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    // 1. Sync from backend with comprehensive fallback (by id or by email/nip)
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

        // If user_id wasn't in state, find active user in database list
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
      } catch (e) {
        // If offline or network error, keep stored user
      }
    };

    syncUser();

    // 2. Listen to custom update events across components
    const handleUserChanged = (e) => {
      if (e.detail) {
        setUser(e.detail);
      }
    };

    window.addEventListener('sikepo_user_changed', handleUserChanged);
    return () => window.removeEventListener('sikepo_user_changed', handleUserChanged);
  }, []);

  const role = (user?.role || 'admin').toLowerCase();

  const handleUpdateUser = (updated) => {
    setUser(updated);
    setStoredUser(updated);
  };

  return (
    <div className="app-shell">
      <Topbar
        user={user}
        onNavigate={onNavigate}
        title="Profil Personel & Hak Akses"
        onUpdateUser={handleUpdateUser}
      />
      <Sidebar activePath="/profile" onNavigate={onNavigate} />

      <main className="main-content">
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
      </main>
    </div>
  );
}
