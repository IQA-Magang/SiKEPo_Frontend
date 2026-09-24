import React, { useEffect, useState } from 'react';
import { ArrowLeft, Download, Package, QrCode } from 'lucide-react';
import { fetchBlobWithAuth, getEquipmentId, peralatanApi, computeEligibility } from '../../utils/api.js';

export default function EquipmentQrPage({ equipmentId, onNavigate }) {
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrSrc, setQrSrc] = useState('');
  const [qrError, setQrError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadEquipment() {
      setLoading(true);
      try {
        const response = await peralatanApi.getAll();
        const found = (response.data || []).find(
          (item) => String(getEquipmentId(item)) === String(equipmentId),
        );
        if (mounted) setEquipment(found || null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadEquipment();
    return () => { mounted = false; };
  }, [equipmentId]);

  useEffect(() => {
    let objectUrl = '';
    async function loadQr() {
      try {
        const blob = await fetchBlobWithAuth(`/api/peralatan/${equipmentId}/qr`);
        objectUrl = URL.createObjectURL(blob);
        setQrSrc(objectUrl);
      } catch (err) {
        setQrSrc('');
        setQrError(`QR tidak dapat dimuat: ${err.message}`);
      }
    }
    loadQr();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [equipmentId]);

  async function downloadQr() {
    const blobUrl = URL.createObjectURL(
      await fetchBlobWithAuth(`/api/peralatan/${equipmentId}/qr`),
    );
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `QR-Peralatan-${equipmentId}-${equipment?.nomor_aset || 'aset'}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  }

  if (loading) {
    return <div className="page-container fade-in-up"><div className="card card-padded">Memuat QR Code...</div></div>;
  }

  if (!equipment) {
    return (
      <div className="page-container fade-in-up">
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={32} /></div>
          <p className="empty-state-title">Peralatan tidak ditemukan</p>
          <button className="btn btn-secondary" onClick={() => onNavigate('/peralatan')}>
            <ArrowLeft size={16} /> Kembali
          </button>
        </div>
      </div>
    );
  }

  const id = getEquipmentId(equipment);
  return (
    <div className="page-container fade-in-up" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => onNavigate(`/peralatan/detail/${id}`)} title="Kembali">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title">QR Code Peralatan</h1>
          <p className="page-subtitle">{equipment.nama_peralatan}</p>
        </div>
      </div>

      <div className="card card-padded" style={{ textAlign: 'center' }}>
        <QrCode size={28} style={{ color: 'var(--clr-primary-500)', marginBottom: 'var(--sp-2)' }} />
        <h2 className="section-title">Pindai QR Code Ini</h2>
        <p style={{ color: 'var(--clr-dark-500)', fontSize: 'var(--text-sm)' }}>
          Arahkan kamera ponsel ke QR Code yang tampil di halaman ini.
        </p>
        <div style={{ margin: 'var(--sp-5) auto', width: 'min(360px, 100%)', padding: 'var(--sp-5)', background: '#fff', border: '1px solid var(--clr-dark-200)', borderRadius: 'var(--radius-xl)' }}>
          <img
            src={qrSrc}
            alt={`QR Code ${equipment.nomor_aset || id}`}
            style={{ display: 'block', width: '100%', maxWidth: 300, height: 'auto', imageRendering: 'pixelated', margin: '0 auto' }}
          />
          {qrError && <p style={{ color: 'var(--clr-error-500)', fontSize: 'var(--text-sm)' }}>{qrError}</p>}
        </div>
        {(() => {
          const elig = computeEligibility(equipment);
          return (
            <div style={{ display: 'grid', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)' }}>
              <strong>{equipment.nama_peralatan}</strong>
              <code style={{ fontSize: 'var(--text-sm)' }}>ID Sistem: {id}</code>
              <code style={{ fontSize: 'var(--text-sm)' }}>No. Aset: {equipment.nomor_aset || '–'}</code>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px',
                  borderRadius: 'var(--radius-full)', background: elig.labelColor + '18',
                  border: `1.5px solid ${elig.labelColor}`, fontWeight: 'var(--fw-bold)',
                  fontSize: 'var(--text-xs)', color: elig.labelColor,
                }}>
                  {elig.jenisLabel}
                </span>
                <span className={`badge ${elig.isSealBroken ? 'badge-rusak' : 'badge-aktif'}`} style={{ fontSize: 'var(--text-xs)' }}>
                  Segel: {elig.isSealBroken ? 'Rusak' : 'Utuh'}
                </span>
              </div>
            </div>
          );
        })()}
        <button type="button" className="btn btn-secondary" onClick={downloadQr} disabled={!qrSrc}>
          <Download size={15} /> Unduh QR
        </button>
      </div>
    </div>
  );
}
