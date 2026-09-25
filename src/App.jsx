import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar.jsx';
import Topbar from './components/layout/Topbar.jsx';
import {
  Router,
  Routes,
  Route,
  ProtectedRoute,
  useNavigate,
  useLocation,
  useParams,
  Navigate,
} from './router/Router.jsx';
import { ToastProvider, useToast } from './context/ToastContext.jsx';
import { ConfirmProvider } from './context/ConfirmContext.jsx';
import { getToken } from './utils/api.js';
import { ACCESS, ACTIONS } from './utils/permissions.js';

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
import NotFound from './pages/NotFound.jsx';
import Forbidden from './pages/Forbidden.jsx';
import VerificationManagement from './pages/VerificationManagement.jsx';
import LandingPage from './pages/LandingPage.jsx';
import QRScannerModal from './components/QRScannerModal.jsx';

// Wrapper for parameterized Equipment Detail
function EquipmentDetailRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <EquipmentDetail equipmentId={id} onNavigate={navigate} />;
}

// Wrapper for parameterized Equipment QR
function EquipmentQrRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <EquipmentQrPage equipmentId={id} onNavigate={navigate} />;
}

function VerificationRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <VerificationManagement equipmentId={id} onNavigate={navigate} />;
}

function EquipmentLifecycleRoute({ lifecycle }) {
  const navigate = useNavigate();
  return <EquipmentList onNavigate={navigate} initialLifecycle={lifecycle} />;
}

// Global Event Listener for API Auth & Forbidden Notifications
function GlobalAuthListener() {
  const { error, warning } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    function handleSessionExpired(e) {
      const msg = e.detail?.message || 'Sesi login telah berakhir. Silakan masuk kembali.';
      warning(msg, 5000);
      navigate('/login');
    }

    function handleForbidden(e) {
      const msg = e.detail?.message || 'Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.';
      error(msg, 5000);
    }

    window.addEventListener('sikepo_session_expired', handleSessionExpired);
    window.addEventListener('sikepo_auth_forbidden', handleForbidden);

    return () => {
      window.removeEventListener('sikepo_session_expired', handleSessionExpired);
      window.removeEventListener('sikepo_auth_forbidden', handleForbidden);
    };
  }, [error, warning, navigate]);

  return null;
}

// App Layout Shell (Topbar, Sidebar, Main Content)
function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      {/* Mobile Drawer Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        role="presentation"
      />

      {/* Sidebar Navigasi Berbasis Role */}
      <Sidebar
        currentPath={pathname}
        onNavigate={(path) => {
          navigate(path);
          setSidebarOpen(false);
        }}
        onClose={() => setSidebarOpen(false)}
        open={sidebarOpen}
      />

      {/* Topbar Header */}
      <Topbar
        currentPath={pathname}
        onNavigate={navigate}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onScanQr={() => setIsQrOpen(true)}
      />

      {/* Konten Halaman Utama */}
      <main className="main-content" id="main-view">
        {children}
      </main>

      <QRScannerModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        onNavigate={navigate}
      />
    </div>
  );
}

// Route Switcher
function AppContent() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const token = getToken();

  if (pathname === '/') {
    return <LandingPage onNavigate={navigate} />;
  }

  // Login page rendered without AppShell
  if (pathname === '/login') {
    if (token) {
      return <Navigate to="/dashboard" />;
    }
    return <Login onNavigate={navigate} />;
  }

  // If user has no token and is accessing anything else, ProtectedRoute will redirect to /login
  if (!token) {
    return <Navigate to="/" />;
  }

  return (
    <AppShell>
      <Routes fallback={<NotFound />}>
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard onNavigate={navigate} />
            </ProtectedRoute>
          }
        />

        {/* Equipment Routes */}
        <Route
          path="/peralatan"
          element={
            <ProtectedRoute feature={ACCESS.MASTER_EQUIPMENT}>
              <EquipmentList onNavigate={navigate} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/peralatan/tambah"
          element={
            <ProtectedRoute feature={ACCESS.INPUT_EQUIPMENT} action={ACTIONS.ADD}>
              <EquipmentCreate onNavigate={navigate} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/peralatan/detail/:id"
          element={
            <ProtectedRoute feature={ACCESS.MASTER_EQUIPMENT}>
              <EquipmentDetailRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/peralatan/qr/:id"
          element={
            <ProtectedRoute feature={ACCESS.QR_CODE}>
              <EquipmentQrRoute />
            </ProtectedRoute>
          }
        />
        <Route path="/peralatan/menunggu-verifikasi" element={<ProtectedRoute feature={ACCESS.EQUIPMENT_ELIGIBILITY}><EquipmentLifecycleRoute lifecycle="pending" /></ProtectedRoute>} />
        <Route path="/peralatan/dalam-peninjauan" element={<ProtectedRoute feature={ACCESS.EQUIPMENT_ELIGIBILITY}><EquipmentLifecycleRoute lifecycle="review" /></ProtectedRoute>} />
        <Route path="/peralatan/arsip" element={<ProtectedRoute feature={ACCESS.MASTER_EQUIPMENT}><EquipmentLifecycleRoute lifecycle="archived" /></ProtectedRoute>} />

        <Route
          path="/verifikasi"
          element={
            <ProtectedRoute feature={ACCESS.EQUIPMENT_ELIGIBILITY}>
              <VerificationManagement onNavigate={navigate} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verifikasi/:id"
          element={
            <ProtectedRoute feature={ACCESS.EQUIPMENT_ELIGIBILITY}>
              <VerificationRoute />
            </ProtectedRoute>
          }
        />

        {/* Admin Management Routes */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UserManagement onNavigate={navigate} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/labs"
          element={
            <ProtectedRoute feature={ACCESS.MASTER_LAB}>
              <LabsManagement onNavigate={navigate} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ruangan"
          element={
            <ProtectedRoute feature={ACCESS.MASTER_EQUIPMENT}>
              <RuanganManagement onNavigate={navigate} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/kelompok-aset"
          element={
            <ProtectedRoute feature={ACCESS.MASTER_EQUIPMENT}>
              <AssetGroupManagement onNavigate={navigate} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/kategori"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <CategoryManagement onNavigate={navigate} />
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute feature={ACCESS.SYSTEM_SETTINGS}>
              <Settings onNavigate={navigate} />
            </ProtectedRoute>
          }
        />

        {/* Error Pages */}
        <Route path="/unauthorized" element={<Forbidden />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <ConfirmProvider>
          <GlobalAuthListener />
          <AppContent />
        </ConfirmProvider>
      </ToastProvider>
    </Router>
  );
}
