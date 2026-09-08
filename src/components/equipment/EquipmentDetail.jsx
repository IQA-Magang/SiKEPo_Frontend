import React, { useState } from 'react';
import {
  ClipboardList, BookOpen, FileText, ShieldCheck, MapPin,
  Package, Download, Eye, Check, AlertCircle, CheckCircle
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

export default function EquipmentDetail({ equipment, user }) {
  const [activeTab, setActiveTab] = useState('info');
  const [verifyStatus, setVerifyStatus] = useState(equipment.verification?.status || 'Terverifikasi');
  const [verifyNotice, setVerifyNotice] = useState('');

  const role = (user?.role || 'admin').toLowerCase();

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
              <div>
                <h2>Verifikasi & Kelayakan (TLKM13/P)</h2>
                <p className="panel-subtitle">Informasi verifikasi kelayakan operasional alat ukur</p>
              </div>
              <span className="compliance-tag">SOP TLKM13/P</span>
            </div>

            {verifyNotice && (
              <div className="eq-confirm-banner" style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} color="#059669" />
                  <span>{verifyNotice}</span>
                </div>
              </div>
            )}

            <div className="eq-detail-rows">
              <Row label="Status Verifikasi"   value={verifyStatus} />
              <Row label="Tanggal Verifikasi"  value={equipment.verification.date} />
              <Row label="Petugas Otorisasi"   value={equipment.verification.officer} />
              <Row label="Catatan TLKM13/P"    value={equipment.verification.note} />
            </div>

            {/* Role Action under TLKM13/P */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F3F4F6' }}>
              {role === 'manager' ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#111827', display: 'block' }}>Kewenangan Verifikasi Manajer</strong>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>Anda memiliki hak otorisasi kelayakan alat sesuai prosedur TLKM13/P</span>
                  </div>
                  <button
                    className="btn-hero-primary"
                    style={{ padding: '8px 16px', fontSize: '12.5px' }}
                    onClick={() => {
                      setVerifyStatus('Terverifikasi (Disetujui Manajer Mutu TLKM13/P)');
                      setVerifyNotice(`Alat "${equipment.name}" telah berhasil diverifikasi dan disahkan sesuai SOP TLKM13/P.`);
                      setTimeout(() => setVerifyNotice(''), 4000);
                    }}
                  >
                    <Check size={14} /> Verifikasi Kelayakan Alat
                  </button>
                </div>
              ) : role === 'staff' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '12px 14px', borderRadius: '10px' }}>
                  <AlertCircle size={18} color="#6B7280" />
                  <span style={{ fontSize: '12px', color: '#4B5563' }}>
                    Status kelayakan alat diverifikasi secara berkala oleh Manajer Mutu Laboratorium berdasarkan SOP TLKM13/P.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#FEF2F2', border: '1px solid #FECACA', padding: '12px 14px', borderRadius: '10px' }}>
                  <ShieldCheck size={18} color="#E30613" />
                  <span style={{ fontSize: '12px', color: '#991B1B' }}>
                    Administrator Sistem: Mengelola pencatatan master data verifikasi dan integrasi audit log sistem.
                  </span>
                </div>
              )}
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
