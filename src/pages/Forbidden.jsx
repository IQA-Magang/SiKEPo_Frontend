import React from 'react';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from '../app/router/Router.jsx';
import { getCurrentUser } from '../shared/services/api.js';
import { Button, Card, Badge } from '../shared/components/ui/index.js';

export default function Forbidden() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const roleName = user?.role ? user.role.toUpperCase() : 'USER';

  return (
    <div className="page-container fade-in-up" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card padding style={{ maxWidth: 480, width: '100%', padding: 'var(--sp-8)', textAlign: 'center' }}>
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

        <Badge tone="warning" style={{ marginBottom: 'var(--sp-2)' }}>
          Akses Terbatas • 403 Forbidden
        </Badge>

        <h1 className="page-title" style={{ fontSize: 'var(--text-xl)', marginTop: 8, marginBottom: 8 }}>
          Akses Ditolak
        </h1>

        <p className="page-subtitle" style={{ marginBottom: 'var(--sp-6)' }}>
          Akun Anda saat ini ({roleName}) tidak memiliki hak otorisasi untuk mengakses fitur atau halaman ini. Silakan hubungi Administrator Lab jika Anda memerlukan akses.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
          <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => window.history.back()}>
            Kembali
          </Button>
          <Button variant="primary" icon={<Home size={16} />} onClick={() => navigate('/dashboard')}>
            Ke Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
