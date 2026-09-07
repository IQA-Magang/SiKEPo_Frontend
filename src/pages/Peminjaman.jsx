import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import Topbar from '../components/layout/Topbar';
import Sidebar from '../components/layout/Sidebar';

export default function Peminjaman({ onNavigate }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem('sikepo_user');
    if (raw) try { setUser(JSON.parse(raw)); } catch (e) { console.error(e); }
  }, []);

  return (
    <div className="app-shell">
      <Topbar user={user} onNavigate={onNavigate} title="Peminjaman Alat" onUpdateUser={(u) => setUser(u)} />
      <Sidebar activePath="/peminjaman" onNavigate={onNavigate} />

      <main className="main-content">
        <div className="eq-page-header">
          <div>
            <h1 className="eq-page-title">Peminjaman Alat</h1>
            <p className="eq-page-sub">Kelola dan pantau transaksi peminjaman alat laboratorium Telkom Test House</p>
          </div>
        </div>

        <section className="empty-state panel">
          <div className="empty-icon-ring">
            <ArrowRightLeft size={36} />
          </div>
          <h2>Modul Peminjaman</h2>
          <p>Modul manajemen <strong>Peminjaman</strong> SiKEPo Telkom Test House sedang disiapkan untuk integrasi database backend.</p>
          <div className="empty-actions">
            <button className="btn-hero-primary" onClick={() => onNavigate('/dashboard')}>
              Kembali ke Dashboard
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
