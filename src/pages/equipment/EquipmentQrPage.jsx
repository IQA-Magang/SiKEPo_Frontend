import React, { useEffect, useState } from 'react';
import { ArrowLeft, Download, Package, QrCode } from 'lucide-react';
import { getEquipmentId, peralatanApi } from '../../utils/api.js';

export default function EquipmentQrPage({ equipmentId, onNavigate }) {
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);

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

  async function downloadQr() {
    const response = await fetch(peralatanApi.getQRCodeUrl(equipmentId));
    if (!response.ok) throw new Error(`Gagal mengunduh QR (${response.status})`);
    const blobUrl = URL.createObjectURL(await response.blob());
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
  const qrUrl = peralatanApi.getQRCodeUrl(id);

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
        <div style={{ margin: 'var(--sp-5) auto', width: 'min(460px, 100%)', padding: 'var(--sp-5)', background: '#fff', border: '1px solid var(--clr-dark-200)', borderRadius: 'var(--radius-xl)' }}>
          <img
            src={qrUrl}
            alt={`QR Code ${equipment.nomor_aset || id}`}
            style={{ display: 'block', width: '100%', maxWidth: 420, margin: '0 auto' }}
          />
        </div>
        <div style={{ display: 'grid', gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)' }}>
          <strong>{equipment.nama_peralatan}</strong>
          <code style={{ fontSize: 'var(--text-sm)' }}>ID Sistem: {id}</code>
          <code style={{ fontSize: 'var(--text-sm)' }}>No. Aset: {equipment.nomor_aset || '–'}</code>
        </div>
        <button type="button" className="btn btn-secondary" onClick={downloadQr}>
          <Download size={15} /> Unduh QR
        </button>
      </div>
    </div>
  );
}
