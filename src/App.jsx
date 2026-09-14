import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/equipment/EquipmentList';
import EquipmentCreate from './pages/equipment/EquipmentCreate';
import EquipmentDetailPage from './pages/equipment/EquipmentDetailPage';
import Verifikasi from './pages/Verifikasi';
import VerificationCreate from './pages/VerificationCreate';
import EquipmentOperationalView from './pages/equipment/EquipmentOperationalView';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import UserManagement from './pages/admin/UserManagement';
import LabsManagement from './pages/admin/LabsManagement';
import RuanganManagement from './pages/admin/RuanganManagement';
import PicManagement from './pages/admin/PicManagement';
import KategoriManagement from './pages/admin/KategoriManagement';
import AssetGroupManagement from './pages/admin/AssetGroupManagement';
import InspectionManagement from './pages/InspectionManagement';

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
  if (currentPath === '/alat-ukur')         return <EquipmentList onNavigate={navigate} />;
  const verificationCreateMatch = currentPath.match(/^\/verifikasi\?peralatan=(\d+)$/);
  if (verificationCreateMatch) return <VerificationCreate onNavigate={navigate} equipmentId={verificationCreateMatch[1]} />;
  if (currentPath === '/verifikasi')        return <Verifikasi onNavigate={navigate} />;
  if (currentPath === '/peninjauan-peralatan') return <EquipmentOperationalView onNavigate={navigate} view="review" />;
  if (currentPath === '/peralatan-usang') return <EquipmentOperationalView onNavigate={navigate} view="obsolete" />;
  if (currentPath === '/perbaikan') return <EquipmentOperationalView onNavigate={navigate} view="repair" />;
  const inspectionMatch = currentPath.match(/^\/pemeriksaan\/(kalibrasi|verifikasi-fungsi|pengecekan-antara|pemeliharaan|karakterisasi-ulang)$/);
  if (inspectionMatch) return <InspectionManagement onNavigate={navigate} type={inspectionMatch[1]} />;
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

  // Dynamic: /alat-ukur/:id
  const detailMatch = currentPath.match(/^\/alat-ukur\/(\d+)$/);
  if (detailMatch) return <EquipmentDetailPage onNavigate={navigate} equipmentId={detailMatch[1]} />;

  return <Login onNavigate={navigate} />;
}
