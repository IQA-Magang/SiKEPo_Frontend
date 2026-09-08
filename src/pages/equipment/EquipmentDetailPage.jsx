import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import Sidebar from '../../components/layout/Sidebar';
import EquipmentDetail from '../../components/equipment/EquipmentDetail';
import { mockEquipment } from '../../data/mockEquipment';
import { getStoredUser } from '../../utils/api';

export default function EquipmentDetailPage({ onNavigate, equipmentId }) {
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    const handleUserChanged = (e) => {
      if (e.detail) setUser(e.detail);
    };
    window.addEventListener('sikepo_user_changed', handleUserChanged);
    return () => window.removeEventListener('sikepo_user_changed', handleUserChanged);
  }, []);

  const equipment = mockEquipment.find(e => e.id === Number(equipmentId));

  if (!equipment) {
    return (
      <div className="app-shell">
        <Topbar user={user} onNavigate={onNavigate} title="Detail Alat" onUpdateUser={(u) => setUser(u)} />
        <Sidebar activePath="/alat-ukur" onNavigate={onNavigate} />
        <main className="main-content">
          <div className="eq-empty">
            <p>Alat dengan ID <strong>{equipmentId}</strong> tidak ditemukan.</p>
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

        <EquipmentDetail equipment={equipment} user={user} />
      </main>
    </div>
  );
}
