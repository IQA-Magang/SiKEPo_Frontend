import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import Sidebar from '../shared/components/layout/Sidebar.jsx';
import Topbar from '../shared/components/layout/Topbar.jsx';
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
import { ToastProvider, useToast } from './providers/ToastContext.jsx';
import { ConfirmProvider } from './providers/ConfirmContext.jsx';
import { getToken } from '../shared/services/api.js';
import { ACCESS, ACTIONS, getUserRole } from '../shared/utils/permissions.js';

// Pages are split into route-level chunks and loaded only when visited.
const Login = lazy(() => import('../features/auth/Login.jsx'));
const Dashboard = lazy(() => import('../features/dashboard/Dashboard.jsx'));
const EquipmentList = lazy(() => import('../features/equipment/EquipmentList.jsx'));
const EquipmentDetail = lazy(() => import('../features/equipment/EquipmentDetail.jsx'));
const EquipmentCreate = lazy(() => import('../features/equipment/EquipmentCreate.jsx'));
const UserManagement = lazy(() => import('../features/admin/users/UserManagement.jsx'));
const LabsManagement = lazy(() => import('../features/admin/laboratories/LabsManagement.jsx'));
const RuanganManagement = lazy(() => import('../features/admin/rooms/RuanganManagement.jsx'));
const AssetGroupManagement = lazy(() => import('../features/admin/asset-groups/AssetGroupManagement.jsx'));
const CategoryManagement = lazy(() => import('../features/admin/categories/CategoryManagement.jsx'));
const Settings = lazy(() => import('../features/settings/Settings.jsx'));
import NotFound from '../pages/NotFound.jsx';
import Forbidden from '../pages/Forbidden.jsx';
const VerificationManagement = lazy(() => import('../features/verification/VerificationManagement.jsx'));
const LandingPage = lazy(() => import('../pages/LandingPage.jsx'));
const GuestEquipmentPage = lazy(() => import('../features/guest-equipment/GuestEquipmentPage.jsx'));
const QRScannerModal = lazy(() => import('../shared/components/QRScannerModal.jsx'));

// Wrapper for parameterized Equipment Detail
function EquipmentDetailRoute({ initialSection = 'informasi' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  return <EquipmentDetail equipmentId={id} onNavigate={navigate} initialSection={initialSection} />;
}

function VerificationRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  return <VerificationManagement equipmentId={id} onNavigate={navigate} />;
}

function GuestEquipmentRoute() {
  const { nomor_aset } = useParams();
  const navigate = useNavigate();
  return <GuestEquipmentPage equipmentNumber={nomor_aset || ''} onNavigate={navigate} />;
}

function EquipmentLifecycleRoute({ lifecycle, returnPath }) {
  const navigate = useNavigate();
  return (
    <EquipmentList
      onNavigate={navigate}
      initialLifecycle={lifecycle}
      returnPath={returnPath}
    />
  );
}

function LoanRequestPlaceholder() {
  return (
    <div className="page-container fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Peminjaman Peralatan</h1>
          <p className="page-subtitle">Tampilan pengajuan peminjaman belum tersedia.</p>
        </div>
      </div>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="page-container" role="status" aria-live="polite">
      Memuat halaman...
    </div>
  );
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
  const hamburgerRef = useRef(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
        hamburgerRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  return (
    <div className="app-shell">
      {/* Mobile Drawer Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        role="button"
        aria-label="Tutup menu navigasi"
        aria-hidden={!sidebarOpen}
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
        hamburgerRef={hamburgerRef}
        onScanQr={() => setIsQrOpen(true)}
      />

      {/* Konten Halaman Utama */}
      <main className="main-content" id="main-view">
        {children}
      </main>

      {isQrOpen && (
        <Suspense fallback={null}>
          <QRScannerModal
            isOpen={isQrOpen}
            onClose={() => setIsQrOpen(false)}
            onNavigate={navigate}
          />
        </Suspense>
      )}
    </div>
  );
}

// Route Switcher
function AppContent() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const token = getToken();

  if (pathname === '/') {
    return (
      <Suspense fallback={<PageLoading />}>
        <LandingPage onNavigate={navigate} />
      </Suspense>
    );
  }

  // Login page rendered without AppShell
  if (pathname === '/login') {
    if (token) {
      return <Navigate to="/dashboard" />;
    }
    return (
      <Suspense fallback={<PageLoading />}>
        <Login onNavigate={navigate} />
      </Suspense>
    );
  }

  if (pathname.startsWith('/guest/peralatan/')) {
    return (
      <Suspense fallback={<PageLoading />}>
        <Routes fallback={<NotFound />}>
          <Route
            path="/guest/peralatan/:nomor_aset"
            element={<GuestEquipmentRoute />}
          />
        </Routes>
      </Suspense>
    );
  }

  // If user has no token and is accessing anything else, ProtectedRoute will redirect to /login
  if (!token) {
    return <Navigate to="/" />;
  }

  return (
    <AppShell>
      <Suspense fallback={<PageLoading />}>
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
              <EquipmentList onNavigate={navigate} returnPath="/peralatan" />
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
              <EquipmentDetailRoute initialSection="qr" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/peminjaman"
          element={
            <ProtectedRoute feature={ACCESS.LOAN_REQUEST} action={ACTIONS.ADD}>
              <LoanRequestPlaceholder />
            </ProtectedRoute>
          }
        />
        <Route path="/peralatan/menunggu-verifikasi" element={<ProtectedRoute feature={ACCESS.EQUIPMENT_ELIGIBILITY}><EquipmentLifecycleRoute lifecycle="pending" returnPath="/peralatan/menunggu-verifikasi" /></ProtectedRoute>} />
        <Route path="/peralatan/dalam-peninjauan" element={<ProtectedRoute feature={ACCESS.EQUIPMENT_ELIGIBILITY}><EquipmentLifecycleRoute lifecycle="review" returnPath="/peralatan/dalam-peninjauan" /></ProtectedRoute>} />
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
            <ProtectedRoute roles={['admin', 'manager']}>
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
      </Suspense>
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
