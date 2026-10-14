import React, { lazy, Suspense, useState } from 'react';
import {
  ArrowRight,
  Check,
  Menu,
  QrCode,
  ShieldCheck,
  X,
} from 'lucide-react';
import tthLogo from '../assets/logo/tth-logo.png';
import '../styles/landing-page.css';

const QRScannerModal = lazy(() => import('../shared/components/QRScannerModal.jsx'));

const stats = [
  { label: 'Data inventaris', value: 'Terpusat' },
  { label: 'Dokumen teknis', value: 'Terintegrasi' },
  { label: 'Status peralatan', value: 'Terpantau' },
  { label: 'Kebutuhan audit', value: 'Siap' },
];

export default function LandingPage({ onNavigate }) {
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function openQrScanner() {
    setIsMobileMenuOpen(false);
    setIsQrScannerOpen(false);
    requestAnimationFrame(() => setIsQrScannerOpen(true));
  }

  return (
    <div className="landing-page">
      

      <div className="landing-container">
        <header className="landing-header">
          <div className="brand" aria-label="SiKEPo logo">
            <img className="brand-logo" src={tthLogo} alt="Telkom Test House" />
            <span>SiKEPo</span>
          </div>

          <nav className={`landing-nav${isMobileMenuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
            <span>Tentang</span>
            <span>Fitur</span>
            <span>Proses</span>
            <span>Kontak</span>
          </nav>

          <div className="header-actions">
            <button
              className="button-qr"
              onClick={openQrScanner}
              aria-label="Buka pemindai QR peralatan"
              title="Scan QR Peralatan"
            >
              <QrCode size={17} />
              <span>Scan QR</span>
            </button>
            <button className="button-secondary" onClick={() => onNavigate('/login')}>
              Masuk
            </button>
            <button
              className="mobile-menu-button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        <main>
          <section className="hero">
            <div className="hero-copy">
              <h1>
                System for Inventory <span>Knowledge of Equipment</span> Position & Operation
              </h1>
              <p>
                SiKEPo membantu Telkom Test House mencatat aset, memantau kalibrasi, mengelola dokumen,
                dan mempercepat proses verifikasi kelaikan secara terpusat.
              </p>
              <div className="hero-support">
                <ShieldCheck size={17} aria-hidden="true" />
                Dibangun untuk tata kelola laboratorium yang tertib dan siap diaudit
              </div>

              {/* <div className="hero-actions">
                <button className="button-primary" onClick={() => onNavigate('/login')}>
                  Masuk ke Sistem <ArrowRight size={17} />
                </button>
                <button className="button-secondary">
                  Lihat Cara Kerja
                </button>
              </div> */}

              <div className="hero-metrics">
                {stats.map((item) => (
                  <div key={item.label} className="metric">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-panel" aria-label="Preview dashboard SiKEPo">
              <div className="panel-body">
                <div className="panel-header">
                  <span>Monitoring Aset</span>
                  <span className="status-pill" aria-hidden="true" />
                </div>
                <div className="dashboard-summary">
                  <div><strong>1,248</strong><span>Total aset</span></div>
                  <div><strong>86%</strong><span>Aktif</span></div>
                  <div><strong>12</strong><span>Perlu tindak lanjut</span></div>
                </div>

                <div className="bar-grid" aria-label="chart data">
                  <div className="bar" />
                  <div className="bar" />
                  <div className="bar" />
                  <div className="bar" />
                  <div className="bar" />
                  <div className="bar" />
                </div>

                <div className="panel-list">
                  <div className="panel-list-item"><span><Check size={13} /></span> Inventaris tersimpan terpusat</div>
                  <div className="panel-list-item"><span><Check size={13} /></span> Jadwal verifikasi mudah dipantau</div>
                  <div className="panel-list-item"><span><Check size={13} /></span> Dokumen pendukung terintegrasi</div>
                </div>
              </div>

              {/* <div className="hero-score">
                <small>Status sistem</small>
                <strong>Terpantau</strong>
              </div> */}
            </div>
          </section>

        </main>
      </div>

      {isQrScannerOpen && (
        <Suspense fallback={null}>
          <QRScannerModal
            isOpen={isQrScannerOpen}
            onClose={() => setIsQrScannerOpen(false)}
            onNavigate={onNavigate}
          />
        </Suspense>
      )}
    </div>
  );
}
