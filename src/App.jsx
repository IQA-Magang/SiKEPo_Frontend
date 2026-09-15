import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/equipment/EquipmentList';
import EquipmentCreate from './pages/equipment/EquipmentCreate';
import EquipmentDetailPage from './pages/equipment/EquipmentDetailPage';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import UserManagement from './pages/admin/UserManagement';
import LabsManagement from './pages/admin/LabsManagement';
import RuanganManagement from './pages/admin/RuanganManagement';
import PicManagement from './pages/admin/PicManagement';
import KategoriManagement from './pages/admin/KategoriManagement';
import AssetGroupManagement from './pages/admin/AssetGroupManagement';

const getPath = () => window.location.hash ? window.location.hash.replace('#', '') : '/login';

export default function App() {
  const [currentPath, setCurrentPath] = useState(getPath);

  useEffect(() => {
    const onHash = () => setCurrentPath(getPath());
    window.addEventListener('hashchange', onHash);

    const onSessionExpired = () => {
      navigate('/login');
    };
    window.addEventListener('sikepo_session_expired', onSessionExpired);

    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('sikepo_session_expired', onSessionExpired);
    };
  }, []);

  const navigate = (path) => { window.location.hash = path; setCurrentPath(path); };

  // ponytail: minimal auth guard based on backend JWT token
  const isAuth = Boolean(localStorage.getItem('sikepo_token'));
  if (!isAuth && currentPath !== '/forgot-password' && currentPath !== '/login') {
    return <Login onNavigate={navigate} />;
  }
  if (isAuth && currentPath === '/login') {
    return <Dashboard onNavigate={navigate} />;
  }

  // Route matching — order matters: specific before wildcard
  if (currentPath === '/forgot-password')   return <ForgotPassword onNavigate={navigate} />;
  if (currentPath === '/dashboard')         return <Dashboard onNavigate={navigate} />;
  if (currentPath === '/alat-ukur/tambah')  return <EquipmentCreate onNavigate={navigate} />;
  if (currentPath.startsWith('/alat-ukur/detail/')) {
    const equipmentId = currentPath.split('/').pop();
    return <EquipmentDetailPage equipmentId={equipmentId} onNavigate={navigate} />;
  }
  if (currentPath === '/alat-ukur')         return <EquipmentList onNavigate={navigate} />;
  if (currentPath === '/settings' || currentPath === '/pengaturan') return <Settings onNavigate={navigate} />;
  if (currentPath === '/profile')           return <Settings onNavigate={navigate} initialTab="profile" />;
  if (currentPath === '/users' || currentPath === '/admin/users') return <UserManagement onNavigate={navigate} initialTab="users" />;
  if (currentPath === '/admin/labs' || currentPath === '/admin/kelompok-lab') {
    return <LabsManagement onNavigate={navigate} />;
  }
  if (currentPath === '/admin/ruangan' || currentPath === '/admin/kelompok-lokasi') {
    return <RuanganManagement onNavigate={navigate} />;
  }
  if (currentPath === '/admin/pic-management') return <UserManagement onNavigate={navigate} initialTab="pic" />;
  if (currentPath === '/admin/kelompok-aset') return <AssetGroupManagement onNavigate={navigate} />;
  if (currentPath === '/admin/kelompok-peralatan' || currentPath === '/admin/kategori') {
    return <KategoriManagement onNavigate={navigate} />;
  }

  return <Login onNavigate={navigate} />;
}
