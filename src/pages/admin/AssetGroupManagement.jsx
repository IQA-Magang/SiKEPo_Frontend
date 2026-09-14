import React, { useState } from 'react';
import { Archive, Plus } from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import Sidebar from '../../components/layout/Sidebar';
import { getStoredUser } from '../../utils/api';

export default function AssetGroupManagement({ onNavigate }) {
  const [user, setUser] = useState(getStoredUser);

  return (
    <div className="app-shell">
      <Topbar
        user={user}
        onNavigate={onNavigate}
        title="Kelompok Aset"
        onUpdateUser={setUser}
      />
      <Sidebar activePath="/admin/kelompok-aset" onNavigate={onNavigate} />

      <main className="main-content">
        <div className="eq-page-header">
          <div>
            <h1 className="eq-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Archive size={22} style={{ color: 'var(--color-primary-red)' }} />
              <span>Kelompok Aset</span>
            </h1>
            <p className="eq-page-sub">
              Pengaturan kelompok aset inventaris laboratorium
            </p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Data Kelompok Aset</h2>
              <p className="panel-subtitle">Belum ada kelompok aset yang tersedia.</p>
            </div>
            <button className="btn-hero-primary" disabled title="Fitur belum tersedia">
              <Plus size={15} />
              <span>Tambah Kelompok</span>
            </button>
          </div>
          <div className="eq-empty">
            <p>Data kelompok aset masih dikosongkan untuk sementara.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
