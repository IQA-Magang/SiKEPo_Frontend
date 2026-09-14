import React, { useState } from 'react';
import { Activity, ClipboardCheck, RefreshCw } from 'lucide-react';
import Topbar from '../components/layout/Topbar';
import Sidebar from '../components/layout/Sidebar';
import { getStoredUser } from '../utils/api';

const INSPECTION_CONFIG = {
  kalibrasi: {
    title: 'Kalibrasi',
    description: 'Kelola jadwal dan catatan kalibrasi peralatan.'
  },
  'verifikasi-fungsi': {
    title: 'Verifikasi Fungsi',
    description: 'Catat hasil verifikasi fungsi operasional peralatan.'
  },
  'pengecekan-antara': {
    title: 'Pengecekan Antara',
    description: 'Kelola pemeriksaan antara untuk menjaga keandalan alat.'
  },
  pemeliharaan: {
    title: 'Pemeliharaan',
    description: 'Catat pemeliharaan dan tindak lanjut kondisi peralatan.'
  },
  'karakterisasi-ulang': {
    title: 'Karakterisasi Ulang',
    description: 'Kelola proses karakterisasi ulang peralatan.'
  }
};

export default function InspectionManagement({ onNavigate, type }) {
  const [user, setUser] = useState(getStoredUser);
  const config = INSPECTION_CONFIG[type] || INSPECTION_CONFIG.kalibrasi;

  return (
    <div className="app-shell">
      <Topbar user={user} onNavigate={onNavigate} title={config.title} onUpdateUser={setUser} />
      <Sidebar activePath={`/pemeriksaan/${type}`} onNavigate={onNavigate} />
      <main className="main-content">
        <div className="eq-page-header">
          <div>
            <h1 className="eq-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={22} style={{ color: 'var(--color-primary-red)' }} />
              <span>{config.title}</span>
            </h1>
            <p className="eq-page-sub">{config.description}</p>
          </div>
          <button className="btn-refresh" onClick={() => window.location.reload()} title="Perbarui data">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Data {config.title}</h2>
              <p className="panel-subtitle">Belum ada pencatatan {config.title.toLowerCase()} yang tersedia.</p>
            </div>
          </div>
          <div className="eq-empty">
            <ClipboardCheck size={28} style={{ color: '#9CA3AF', marginBottom: '8px' }} />
            <p>Modul {config.title.toLowerCase()} siap dikembangkan pada tahap berikutnya.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
