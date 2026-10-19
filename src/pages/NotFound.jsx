import React from 'react';
import { HelpCircle, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from '../app/router/Router.jsx';
import { Button, Card, Badge } from '../shared/components/ui/index.js';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="page-container fade-in-up" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card padding style={{ maxWidth: 480, width: '100%', padding: 'var(--sp-8)', textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-full)',
            background: 'var(--clr-primary-50, #FEF2F2)',
            color: 'var(--clr-primary-600, #E30613)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--sp-4)',
          }}
        >
          <HelpCircle size={32} />
        </div>

        <Badge tone="danger" style={{ marginBottom: 'var(--sp-2)' }}>
          Error 404
        </Badge>

        <h1 className="page-title" style={{ fontSize: 'var(--text-xl)', marginTop: 8, marginBottom: 8 }}>
          Halaman Tidak Ditemukan
        </h1>

        <p className="page-subtitle" style={{ marginBottom: 'var(--sp-6)' }}>
          Halaman yang Anda tuju mungkin telah dipindahkan, dihapus, atau alamat URL yang dimasukkan salah.
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
