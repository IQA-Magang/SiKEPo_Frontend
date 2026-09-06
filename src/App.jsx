import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import EquipmentList from './pages/equipment/EquipmentList';
import EquipmentCreate from './pages/equipment/EquipmentCreate';
import EquipmentDetailPage from './pages/equipment/EquipmentDetailPage';
import Peminjaman from './pages/Peminjaman';

const getPath = () => window.location.hash ? window.location.hash.replace('#', '') : '/login';

export default function App() {
  const [currentPath, setCurrentPath] = useState(getPath);

  useEffect(() => {
    const onHash = () => setCurrentPath(getPath());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (path) => { window.location.hash = path; setCurrentPath(path); };

  // Route matching — order matters: specific before wildcard
  if (currentPath === '/forgot-password')   return <ForgotPassword onNavigate={navigate} />;
  if (currentPath === '/dashboard')         return <Dashboard onNavigate={navigate} />;
  if (currentPath === '/alat-ukur/tambah')  return <EquipmentCreate onNavigate={navigate} />;
  if (currentPath === '/alat-ukur')         return <EquipmentList onNavigate={navigate} />;
  if (currentPath === '/peminjaman')        return <Peminjaman onNavigate={navigate} />;

  // Dynamic: /alat-ukur/:id
  const detailMatch = currentPath.match(/^\/alat-ukur\/(\d+)$/);
  if (detailMatch) return <EquipmentDetailPage onNavigate={navigate} equipmentId={detailMatch[1]} />;

  return <Login onNavigate={navigate} />;
}
