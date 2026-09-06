import React, { useState } from 'react';
import {
  ClipboardList, BookOpen, FileText, ShieldCheck, MapPin,
  Package, Download, Eye
} from 'lucide-react';
import EquipmentStatusBadge from './EquipmentStatusBadge';

const TABS = [
  { id: 'info',     label: 'Informasi',       icon: ClipboardList },
  { id: 'borrow',   label: 'Peminjaman',       icon: BookOpen },
  { id: 'docs',     label: 'Dokumen',          icon: FileText },
  { id: 'verify',   label: 'Verifikasi',       icon: ShieldCheck },
  { id: 'location', label: 'Riwayat Lokasi',   icon: MapPin },
];

function Row({ label, value }) {
  return (
    <div className="eq-detail-row">
      <span className="eq-detail-label">{label}</span>
      <span className="eq-detail-value">{value || '-'}</span>
    </div>
  );
}

export default function EquipmentDetail({ equipment }) {
  const [activeTab, setActiveTab] = useState('info');

  return (
    <div className="eq-detail-layout">
      {/* LEFT: Tab navigation */}
      <aside className="eq-detail-nav">
        <div className="eq-detail-nav-card">
          <div className="eq-detail-nav-icon">
            <Package size={28} />
          </div>
          <p className="eq-detail-nav-name">{equipment.name}</p>
          <EquipmentStatusBadge status={equipment.status} />
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
                <p className="panel-subtitle">Detail lengkap alat ukur</p>
              </div>
              <EquipmentStatusBadge status={equipment.status} />
            </div>
            <div className="eq-detail-image-wrap">
              <div className="eq-detail-image-placeholder">
                <Package size={48} />
                <span>Gambar Alat</span>
              </div>
            </div>
            <div className="eq-detail-rows">
              <Row label="Nomor Aset"     value={equipment.assetNumber} />
              <Row label="Merek"          value={equipment.brand} />
              <Row label="Model"          value={equipment.model} />
              <Row label="Nomor Seri"     value={equipment.serialNumber} />
              <Row label="Parameter"      value={equipment.parameter} />
              <Row label="Rentang Ukur"   value={equipment.measurementRange} />
              <Row label="Resolusi"       value={equipment.resolution} />
              <Row label="Akurasi"        value={equipment.accuracy} />
              <Row label="Satuan"         value={equipment.unit} />
              <Row label="Ruang"          value={equipment.room} />
              <Row label="PIC"            value={equipment.pic} />
              <Row label="Frekuensi"      value={equipment.frequency} />
              <Row label="Tgl Kalibrasi"  value={equipment.calibrationDate} />
              <Row label="Jatuh Tempo"    value={equipment.calibrationDueDate} />
            </div>
          </div>
        )}

        {activeTab === 'borrow' && (
          <div className="panel">
            <div className="panel-header">
              <div><h2>Peminjaman</h2><p className="panel-subtitle">Riwayat peminjaman alat</p></div>
            </div>
            {equipment.borrowingHistory.length === 0 ? (
              <p className="eq-empty-tab">Alat sedang tersedia. Belum ada riwayat peminjaman aktif.</p>
            ) : equipment.borrowingHistory.map((b, i) => (
              <div key={i} className="eq-borrow-card">
                <Row label="Peminjam"           value={b.borrower} />
                <Row label="Unit"               value={b.unit} />
                <Row label="Tanggal Pinjam"     value={b.borrowDate} />
                <Row label="Rencana Kembali"    value={b.returnDate} />
                <Row label="Status"             value={b.status} />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="panel">
            <div className="panel-header">
              <div><h2>Dokumen</h2><p className="panel-subtitle">Daftar dokumen alat</p></div>
            </div>
            {equipment.documents.length === 0 ? (
              <p className="eq-empty-tab">Belum ada dokumen yang tersimpan.</p>
            ) : equipment.documents.map((doc, i) => (
              <div key={i} className="eq-doc-item">
                <FileText size={18} className="eq-doc-icon" />
                <div className="eq-doc-info">
                  <span className="eq-doc-name">{doc.name}</span>
                  <span className="eq-doc-meta">{doc.type} · {doc.size}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="eq-btn-action detail"><Eye size={13} /> Lihat</button>
                  <button className="eq-btn-action edit"><Download size={13} /> Unduh</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'verify' && (
          <div className="panel">
            <div className="panel-header">
              <div><h2>Verifikasi</h2><p className="panel-subtitle">Informasi verifikasi alat</p></div>
            </div>
            <div className="eq-detail-rows">
              <Row label="Status Verifikasi"   value={equipment.verification.status} />
              <Row label="Tanggal Verifikasi"  value={equipment.verification.date} />
              <Row label="Petugas"             value={equipment.verification.officer} />
              <Row label="Catatan"             value={equipment.verification.note} />
            </div>
          </div>
        )}

        {activeTab === 'location' && (
          <div className="panel">
            <div className="panel-header">
              <div><h2>Riwayat Lokasi</h2><p className="panel-subtitle">Histori perpindahan alat</p></div>
            </div>
            {equipment.locationHistory.length === 0 ? (
              <p className="eq-empty-tab">Belum terdapat riwayat lokasi.</p>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Lokasi Sebelumnya</th>
                      <th>Lokasi Baru</th>
                      <th>Petugas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipment.locationHistory.map((h, i) => (
                      <tr key={i}>
                        <td><span className="date-text">{h.date}</span></td>
                        <td><span className="eq-room-tag">{h.from}</span></td>
                        <td><span className="eq-room-tag">{h.to}</span></td>
                        <td><span className="borrower-name">{h.officer}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
