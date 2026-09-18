import React from 'react';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from '../router/Router.jsx';
import { getCurrentUser } from '../utils/api.js';

export default function Forbidden() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const roleName = user?.role ? user.role.toUpperCase() : 'USER';

  return (
    <div className="page-container fade-in-up" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: 480, width: '100%', padding: 'var(--sp-8)', textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-full)',
            background: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--sp-4)',
          }}
        >
          <ShieldAlert size={32} />
        </div>

        <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', marginBottom: 'var(--sp-2)' }}>
          Akses Terbatas • 403 Forbidden
        </span>

        <h1 className="page-title" style={{ fontSize: 'var(--text-xl)', marginTop: 8, marginBottom: 8 }}>
          Akses Ditolak
        </h1>

        <p className="page-subtitle" style={{ marginBottom: 'var(--sp-6)' }}>
          Akun Anda saat ini ({roleName}) tidak memiliki hak otorisasi untuk mengakses fitur atau halaman ini. Silakan hubungi Administrator Lab jika Anda memerlukan akses.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => window.history.back()}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            <Home size={16} /> Ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
