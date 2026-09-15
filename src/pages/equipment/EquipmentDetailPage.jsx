import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import Sidebar from '../../components/layout/Sidebar';
import EquipmentDetail from '../../components/equipment/EquipmentDetail';
import { getCachedEquipment, getStoredUser, peralatanApi } from '../../utils/api';

export default function EquipmentDetailPage({ equipmentId, onNavigate }) {
  const [user, setUser] = useState(getStoredUser);
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadEquipment = async () => {
      try {
        const response = await peralatanApi.getAll();
        const list = Array.isArray(response?.data) ? response.data : [];
        const found = list.find((item) => String(item.id) === String(equipmentId));
        if (found) {
          if (isMounted) setEquipment(found);
          return;
        }

        const cached = getCachedEquipment().find((item) => String(item.id) === String(equipmentId));
        if (cached && isMounted) {
          setEquipment(cached);
        } else if (isMounted) {
          setError('Data detail peralatan tidak ditemukan.');
        }
      } catch (err) {
        const cached = getCachedEquipment().find((item) => String(item.id) === String(equipmentId));
        if (isMounted && cached) {
          setEquipment(cached);
        } else if (isMounted) {
          setError(err.message || 'Gagal mengambil detail peralatan.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadEquipment();
    return () => { isMounted = false; };
  }, [equipmentId]);

  if (loading) {
    return (
      <div className="app-shell">
        <Topbar user={user} onNavigate={onNavigate} title="Detail Peralatan" onUpdateUser={setUser} />
        <Sidebar activePath="/alat-ukur" onNavigate={onNavigate} />
        <main className="main-content eq-success-state">
          <Loader2 size={36} className="spin" aria-label="Memuat detail" />
          <p>Memuat detail peralatan...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Topbar user={user} onNavigate={onNavigate} title="Detail Peralatan" onUpdateUser={setUser} />
      <Sidebar activePath="/alat-ukur" onNavigate={onNavigate} />
      <main className="main-content">
        <button className="eq-back-btn" type="button" onClick={() => onNavigate('/alat-ukur')}>
          <ArrowLeft size={16} /> Kembali ke Daftar Peralatan
        </button>

        {error ? (
          <div className="error-banner" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        ) : (
          <EquipmentDetail equipment={equipment} user={user} onNavigate={onNavigate} />
        )}
      </main>
    </div>
  );
}
