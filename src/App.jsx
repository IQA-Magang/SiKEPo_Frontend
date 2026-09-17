import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar.jsx';
import Topbar from './components/layout/Topbar.jsx';

// Pages
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EquipmentList from './pages/equipment/EquipmentList.jsx';
import EquipmentDetail from './pages/equipment/EquipmentDetail.jsx';
import EquipmentCreate from './pages/equipment/EquipmentCreate.jsx';
import EquipmentQrPage from './pages/equipment/EquipmentQrPage.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';
import LabsManagement from './pages/admin/LabsManagement.jsx';
import RuanganManagement from './pages/admin/RuanganManagement.jsx';
import AssetGroupManagement from './pages/admin/AssetGroupManagement.jsx';
import CategoryManagement from './pages/admin/CategoryManagement.jsx';
import Settings from './pages/Settings.jsx';
import { ACCESS, ACTIONS, can } from './utils/permissions.js';

// Helper: ambil path dari hash
function getPathFromHash() {
  const hash = window.location.hash;
  if (!hash || hash === '#') return '/dashboard';
  const clean = hash.startsWith('#') ? hash.slice(1) : hash;
  return clean.startsWith('/') ? clean : `/${clean}`;
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(getPathFromHash);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem('sikepo_token'));

  // Sinkronisasi navigasi berbasis hash
  useEffect(() => {
    function handleHashChange() {
      const p = getPathFromHash();
      setCurrentPath(p);
      setSidebarOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleSessionExpired() {
      setToken(null);
      navigate('/login');
    }

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('sikepo_session_expired', handleSessionExpired);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('sikepo_session_expired', handleSessionExpired);
    };
  }, []);

  // Auth Guard
  useEffect(() => {
    const currentToken = localStorage.getItem('sikepo_token');
    setToken(currentToken);

    if (!currentToken && currentPath !== '/login') {
      window.location.hash = '/login';
    } else if (currentToken && currentPath === '/login') {
      window.location.hash = '/dashboard';
    }
  }, [currentPath]);

  function navigate(path) {
    window.location.hash = path;
  }

  // Jika halaman Login, render tanpa AppShell
  if (currentPath === '/login' || !token) {
    return <Login onNavigate={navigate} />;
  }

  // Route Resolver
  function renderContent() {
    // 1. Equipment Detail with dynamic ID: /peralatan/detail/:id
    if (currentPath.startsWith('/peralatan/detail/')) {
      const parts = currentPath.split('/');
      const id = parts[parts.length - 1];
      return <EquipmentDetail equipmentId={id} onNavigate={navigate} />;
    }
    if (currentPath.startsWith('/peralatan/qr/')) {
      const parts = currentPath.split('/');
      const id = parts[parts.length - 1];
      return <EquipmentQrPage equipmentId={id} onNavigate={navigate} />;
    }

    switch (currentPath) {
      case '/dashboard':
        return <Dashboard onNavigate={navigate} />;
      case '/peralatan':
        return <EquipmentList onNavigate={navigate} />;
      case '/peralatan/tambah':
        return can(ACCESS.INPUT_EQUIPMENT, ACTIONS.ADD) ? <EquipmentCreate onNavigate={navigate} /> : <EquipmentList onNavigate={navigate} />;
      case '/admin/users':
        return <UserManagement onNavigate={navigate} />;
      case '/admin/labs':
        return <LabsManagement onNavigate={navigate} />;
      case '/admin/ruangan':
        return <RuanganManagement onNavigate={navigate} />;
      case '/admin/kelompok-aset':
        return <AssetGroupManagement onNavigate={navigate} />;
      case '/admin/kategori':
        return <CategoryManagement onNavigate={navigate} />;
      case '/settings':
        return <Settings onNavigate={navigate} />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  }

  return (
    <div className="app-shell">
      {/* Mobile Drawer Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar Navigasi Berbasis Role */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={navigate}
        onClose={() => setSidebarOpen(false)}
        open={sidebarOpen}
      />

      {/* Topbar Header */}
      <Topbar
        currentPath={currentPath}
        onNavigate={navigate}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      {/* Konten Halaman Utama */}
      <main className="main-content" id="main-view">
        {renderContent()}
      </main>
    </div>
  );
}
