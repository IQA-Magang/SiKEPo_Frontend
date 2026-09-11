import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import Sidebar from '../../components/layout/Sidebar';
import EquipmentDetail from '../../components/equipment/EquipmentDetail';
import { peralatanApi, getStoredUser } from '../../utils/api';
import { mockEquipment } from '../../data/mockEquipment';

export default function EquipmentDetailPage({ onNavigate, equipmentId }) {
  const [user, setUser] = useState(getStoredUser);
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUserChanged = (e) => {
      if (e.detail) setUser(e.detail);
    };
    window.addEventListener('sikepo_user_changed', handleUserChanged);
    return () => window.removeEventListener('sikepo_user_changed', handleUserChanged);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    peralatanApi.getById(equipmentId)
      .then(res => {
        if (!isMounted) return;
        if (res?.data) {
          setEquipment(res.data);
        } else {
          // Fallback ke mock jika id ada di mock data
          const fallback = mockEquipment.find(e => e.id === Number(equipmentId));
          setEquipment(fallback || null);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        const fallback = mockEquipment.find(e => e.id === Number(equipmentId));
        setEquipment(fallback || null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [equipmentId]);

  if (loading) {
    return (
      <div className="app-shell">
        <Topbar user={user} onNavigate={onNavigate} title="Detail Alat" onUpdateUser={(u) => setUser(u)} />
        <Sidebar activePath="/alat-ukur" onNavigate={onNavigate} />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <div style={{ textAlign: 'center', color: '#6B7280' }}>
            <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px' }} />
            <p>Memuat rincian peralatan dari backend...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="app-shell">
        <Topbar user={user} onNavigate={onNavigate} title="Detail Alat" onUpdateUser={(u) => setUser(u)} />
        <Sidebar activePath="/alat-ukur" onNavigate={onNavigate} />
        <main className="main-content">
          <div className="eq-empty">
            <p>Peralatan dengan ID <strong>{equipmentId}</strong> tidak ditemukan di database backend.</p>
            <button className="eq-btn-action detail" style={{ marginTop: '12px' }} onClick={() => onNavigate('/alat-ukur')}>
              ← Kembali ke Daftar
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Topbar user={user} onNavigate={onNavigate} title="Detail Alat" onUpdateUser={(u) => setUser(u)} />
      <Sidebar activePath="/alat-ukur" onNavigate={onNavigate} />

      <main className="main-content">
        <button className="eq-back-btn" onClick={() => onNavigate('/alat-ukur')}>
          <ArrowLeft size={16} /> Kembali ke Daftar Alat Ukur
        </button>

        <EquipmentDetail equipment={equipment} user={user} onNavigate={onNavigate} />
      </main>
    </div>
  );
}
