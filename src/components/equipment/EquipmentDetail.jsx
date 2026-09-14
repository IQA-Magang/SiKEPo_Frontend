import React, { useState, useEffect } from 'react';
import {
  ClipboardList, FileText,
  Package
} from 'lucide-react';
import EquipmentStatusBadge from './EquipmentStatusBadge';
import EquipmentDocuments from './EquipmentDocuments';
import { peralatanApi } from '../../utils/api';

const TABS = [
  { id: 'info', label: 'Informasi',  icon: ClipboardList },
  { id: 'docs', label: 'Dokumen',    icon: FileText },
];

function Row({ label, value }) {
  return (
    <div className="eq-detail-row">
      <span className="eq-detail-label">{label}</span>
      <span className="eq-detail-value">{value || '-'}</span>
    </div>
  );
}

export default function EquipmentDetail({ equipment, user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('info');
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sikepo_asset_documents') || '{}');
      setDocuments(stored[String(equipment.id)] || stored[String(equipment.nomor_aset || '')] || []);
    } catch (_) {
      setDocuments([]);
    }
  }, [equipment.id, equipment.nomor_aset]);

  const handleDocumentsChange = (nextDocuments) => {
    const metadata = nextDocuments.map(({ file: _file, ...document }) => document);
    setDocuments(nextDocuments);
    try {
      const stored = JSON.parse(localStorage.getItem('sikepo_asset_documents') || '{}');
      stored[String(equipment.id)] = metadata;
      if (equipment.nomor_aset) stored[String(equipment.nomor_aset)] = metadata;
      localStorage.setItem('sikepo_asset_documents', JSON.stringify(stored));
    } catch (_) {
      // Keep the current list available even if browser storage is unavailable.
    }
  };

  const assetNo     = equipment.nomor_aset || equipment.assetNumber || '-';
  const name        = equipment.nama_peralatan || equipment.name || '-';
  const brand       = equipment.merk || equipment.brand || '-';
  const model       = equipment.model || '-';
  const serial      = equipment.nomor_seri || equipment.serialNumber || '-';
  const category    = equipment.kategori_peralatan || equipment.category || 'Peralatan';
  const condition   = equipment.kondisi || 'sesuai';
  const status      = equipment.status_kelayakan || equipment.status || 'pending';
  const method      = equipment.metode || 'internal';
  const usageType   = equipment.jenis_pakai || 'tidak_habis_pakai';
  const roomName    = equipment.ruangan
    ? `${equipment.ruangan.kode_ruangan} - ${equipment.ruangan.nama_ruangan}`
    : (equipment.room || '-');
  const picName     = equipment.pic?.name || equipment.pic || '-';
  const inputBy     = equipment.input_by_user?.name || '-';
  const verifiedBy  = equipment.verified_by_user?.name || '-';

  return (
    <div className="eq-detail-layout">
      {/* LEFT: Tab navigation */}
      <aside className="eq-detail-nav">
        <div className="eq-detail-nav-card">
          <div className="eq-detail-nav-icon">
            <Package size={28} />
          </div>
          <p className="eq-detail-nav-name">{name}</p>
          <EquipmentStatusBadge status={status} />

          {equipment.id && (
            <div style={{ marginTop: '16px', textAlign: 'center', background: '#F9FAFB', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '6px' }}>QR Code Aset</span>
              <img
                src={peralatanApi.getQrCodeUrl(equipment.id)}
                alt="QR Code Aset"
                style={{ width: '110px', height: '110px', objectFit: 'contain', margin: '0 auto', display: 'block', borderRadius: '4px', background: '#FFFFFF' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <a
                href={peralatanApi.getQrCodeUrl(equipment.id)}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '11px', color: '#DC2626', display: 'inline-block', marginTop: '6px', fontWeight: 600, textDecoration: 'none' }}
              >
                Unduh / Buka QR
              </a>
            </div>
          )}
        </div>

        <nav className="eq-detail-tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`eq-detail-tab ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* RIGHT: Content */}
      <div className="eq-detail-content">
        {activeTab === 'info' && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Informasi Alat</h2>
                <p className="panel-subtitle">Data spesifikasi &amp; registrasi master peralatan</p>
              </div>
              <EquipmentStatusBadge status={status} />
            </div>

            <div className="eq-detail-rows">
              <Row label="Nomor Aset"        value={assetNo} />
              <Row label="Nama Peralatan"    value={name} />
              <Row label="Merek"             value={brand} />
              <Row label="Tipe / Model"      value={model} />
              <Row label="Nomor Seri"        value={serial} />
              <Row label="Kelompok Peralatan" value={category} />
              <Row label="Kondisi Fisik"     value={condition === 'sesuai' ? 'Sesuai (Normal)' : condition} />
              <Row label="Status Kelayakan"  value={status.toUpperCase()} />
              <Row label="Metode"            value={method === 'internal' ? 'Internal TTH' : 'Eksternal'} />
              <Row label="Jenis Pakai"       value={usageType === 'tidak_habis_pakai' ? 'Tidak Habis Pakai' : 'Habis Pakai'} />
              <Row label="Ruangan Lokasi"    value={roomName} />
              <Row label="Petugas PIC"       value={picName} />
              <Row label="Dicatat Oleh"      value={inputBy} />
              <Row label="Diverifikasi Oleh" value={verifiedBy} />
              <Row label="Catatan Terakhir"  value={equipment.verification_note || '-'} />
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="panel">
            <div className="panel-header">
              <div><h2>Dokumen Alat</h2><p className="panel-subtitle">Daftar dokumen &amp; arsip digital</p></div>
            </div>
            <EquipmentDocuments documents={documents} onChange={handleDocumentsChange} showActions={false} />
          </div>
        )}
      </div>
    </div>
  );
}
