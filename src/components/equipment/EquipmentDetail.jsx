import React, { useState, useEffect } from 'react';
import { ClipboardList, FileText, Package, Eye } from 'lucide-react';
import EquipmentStatusBadge from './EquipmentStatusBadge';
import EquipmentDocuments from './EquipmentDocuments';
import { ruanganApi, userApi, kelompokAssetApi, peralatanApi, formatPhotoUrl } from '../../utils/api';

const TABS = [
  { id: 'info', label: 'Informasi', icon: ClipboardList },
  { id: 'docs', label: 'Dokumen',   icon: FileText },
];

function Row({ label, value }) {
  return (
    <div className="eq-detail-row">
      <span className="eq-detail-label">{label}</span>
      <span className="eq-detail-value">{value || '-'}</span>
    </div>
  );
}

function formatDetailKey(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function EquipmentDetail({ equipment, user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('info');
  const [documents, setDocuments] = useState([]);
  const [showFullPhoto, setShowFullPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const [ruanganList, setRuanganList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [kelompokAssetList, setKelompokAssetList] = useState([]);

  useEffect(() => {
    setPhotoError(false);
  }, [equipment?.foto]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      ruanganApi.getAll().catch(() => ({ data: [] })),
      userApi.getAll().catch(() => ({ data: [] })),
      kelompokAssetApi.getAll().catch(() => ({ data: [] }))
    ]).then(([rRes, uRes, kRes]) => {
      if (!isMounted) return;
      if (rRes?.data) setRuanganList(rRes.data);
      if (uRes?.data) setUsersList(uRes.data);
      if (kRes?.data) setKelompokAssetList(kRes.data);
    }).catch(err => console.warn('Failed to load detail lookups:', err));

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!equipment) return;
    try {
      const stored = JSON.parse(localStorage.getItem('sikepo_asset_documents') || '{}');
      setDocuments(stored[String(equipment.id)] || stored[String(equipment.nomor_aset || '')] || []);
    } catch (_) {
      setDocuments([]);
    }
  }, [equipment?.id, equipment?.nomor_aset]);

  const handleDocumentsChange = (nextDocuments) => {
    const metadata = nextDocuments.map(({ file: _file, ...document }) => document);
    setDocuments(nextDocuments);
    try {
      const stored = JSON.parse(localStorage.getItem('sikepo_asset_documents') || '{}');
      stored[String(equipment.id)] = metadata;
      if (equipment.nomor_aset) stored[String(equipment.nomor_aset)] = metadata;
      localStorage.setItem('sikepo_asset_documents', JSON.stringify(stored));
    } catch (_) {
      // Keep state in memory fallback
    }
  };

  if (!equipment) {
    return (
      <div className="eq-empty">
        <p>Data peralatan tidak tersedia.</p>
      </div>
    );
  }

  const photoUrl = formatPhotoUrl(equipment.foto);
  const assetNo  = equipment.nomor_aset || equipment.assetNumber || '-';
  const name     = equipment.nama_peralatan || equipment.name || '-';
  const brand    = equipment.merek || equipment.merk || equipment.brand || '-';
  const model    = equipment.tipe_model || equipment.model || '-';
  const serial   = equipment.nomor_seri || equipment.serialNumber || '-';

  const categoryLabel = equipment.kategori_peralatan?.nama_kategori ||
    (equipment.kategori_id === 1 ? 'Alat Ukur (Metrologi & Kalibrasi)' :
     equipment.kategori_id === 2 ? 'Alat Bantu (Pemeriksaan Berkala)' :
     equipment.kategori_id === 3 ? 'Artefak Acuan (Standar Referensi)' :
     equipment.kategori_id === 4 ? 'Komponen Pendukung' : 'Alat Ukur');

  // Resolusi Kelompok Aset
  const kelompokId = equipment.kelompok_aset_id || equipment.kelompokAsetId || equipment.kelompok_asset_id;
  const foundGroup = kelompokAssetList.find(g => String(g.id) === String(kelompokId));

  const groupName = equipment.kelompok_aset?.nama
    ? `[${equipment.kelompok_aset.kode || 'KLP'}] ${equipment.kelompok_aset.nama}`
    : equipment.kelompok_asset?.nama
      ? `[${equipment.kelompok_asset.kode || 'KLP'}] ${equipment.kelompok_asset.nama}`
      : foundGroup
        ? `[${foundGroup.kode || foundGroup.kode_kelompok || 'KLP'}] ${foundGroup.nama || foundGroup.nama_kelompok || foundGroup.name}`
        : (equipment.kelompok_aset_name || (typeof equipment.kelompok_aset === 'string' ? equipment.kelompok_aset : '-'));

  const status = equipment.status_alat || equipment.status_kelayakan || equipment.status || 'Aktif';

  // Resolusi Ruangan Lokasi
  const ruanganId = equipment.ruangan_id || equipment.ruanganId;
  const foundRoom = ruanganList.find(r => String(r.id) === String(ruanganId));

  const roomName = equipment.ruangan?.nama_ruangan
    ? `${equipment.ruangan.kode_ruangan ? `${equipment.ruangan.kode_ruangan} - ` : ''}${equipment.ruangan.nama_ruangan}${equipment.ruangan.labs ? ` (${equipment.ruangan.labs.nama_labs})` : ''}`
    : foundRoom
      ? `${foundRoom.kode_ruangan ? `${foundRoom.kode_ruangan} - ` : ''}${foundRoom.nama_ruangan || foundRoom.nama}${foundRoom.labs ? ` (${foundRoom.labs.nama_labs})` : ''}`
      : (equipment.room || '-');

  // Resolusi Petugas PIC
  const picId = equipment.pic_id || equipment.picId;
  const foundPic = usersList.find(u => String(u.user_id || u.id) === String(picId));

  const picName = equipment.pic?.name
    ? `${equipment.pic.name}${equipment.pic.role ? ` (${equipment.pic.role.toUpperCase()}${equipment.pic.position ? ` - ${equipment.pic.position}` : ''})` : ''}`
    : foundPic
      ? `${foundPic.name || foundPic.username}${foundPic.role ? ` (${foundPic.role.toUpperCase()}${foundPic.position ? ` - ${foundPic.position}` : ''})` : ''}`
      : (typeof equipment.pic === 'string' && equipment.pic ? equipment.pic : '-');

  const keterangan = equipment.keterangan || '-';

  // Parse detail map dari backend
  let detailMap = {};
  if (equipment.detail) {
    if (typeof equipment.detail === 'object') {
      detailMap = equipment.detail;
    } else if (typeof equipment.detail === 'string') {
      try { detailMap = JSON.parse(equipment.detail); } catch (_) {}
    }
  }

  const hasValidPhoto = photoUrl && !photoError;

  return (
    <div className="eq-detail-layout">
      {/* LEFT: Card Navigation & Foto */}
      <aside className="eq-detail-nav">
        <div className="eq-detail-nav-card">
          <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 12px auto', borderRadius: '12px', overflow: 'hidden', background: '#F3F4F6', border: '1.5px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {hasValidPhoto ? (
              <>
                <img
                  src={photoUrl}
                  alt={name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                  onClick={() => setShowFullPhoto(true)}
                  onError={() => setPhotoError(true)}
                />
                <button
                  type="button"
                  onClick={() => setShowFullPhoto(true)}
                  style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 6px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Lihat foto penuh"
                >
                  <Eye size={12} />
                  <span>Lihat</span>
                </button>
              </>
            ) : (
              <Package size={36} color="#9CA3AF" />
            )}
          </div>

          <p className="eq-detail-nav-name" style={{ fontWeight: 700, fontSize: '15px', color: '#111827', margin: '0 0 8px 0' }}>{name}</p>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '8px' }}>
            {assetNo}
          </span>
          <EquipmentStatusBadge status={status} />

          {equipment.id && (
            <div style={{ marginTop: '16px', textAlign: 'center', background: '#F9FAFB', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '6px' }}>QR Code Aset Backend</span>
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
                Unduh / Buka QR Code
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
          <div>
            <div className="panel" style={{ marginBottom: '20px' }}>
              <div className="panel-header">
                <div>
                  <h2>Informasi Peralatan</h2>
                  <p className="panel-subtitle">Data master terdaftar di database backend</p>
                </div>
                <EquipmentStatusBadge status={status} />
              </div>

              <div className="eq-detail-rows">
                <Row label="Nomor Aset"         value={assetNo} />
                <Row label="Nama Peralatan"     value={name} />
                <Row label="Merek"              value={brand} />
                <Row label="Tipe / Model"       value={model} />
                <Row label="Nomor Seri"         value={serial} />
                <Row label="Kategori Peralatan" value={categoryLabel} />
                <Row label="Kelompok Aset"      value={groupName} />
                <Row label="Status Alat"        value={status} />
                <Row label="Ruangan Lokasi"     value={roomName} />
                <Row label="Petugas PIC"        value={picName} />
                <Row label="Keterangan / Catatan" value={keterangan} />
              </div>
            </div>

            {/* Detail Spesifikasi Kategori */}
            {Object.keys(detailMap).length > 0 && (
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Detail Spesifikasi Kategori</h2>
                    <p className="panel-subtitle">Atribut spesifik sesuai Sheet / Kategori Peralatan</p>
                  </div>
                </div>

                <div className="eq-detail-rows">
                  {Object.entries(detailMap).map(([k, v]) => (
                    <Row
                      key={k}
                      label={formatDetailKey(k)}
                      value={typeof v === 'boolean' ? (v ? 'Ya' : 'Tidak') : String(v)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Dokumen Alat</h2>
                <p className="panel-subtitle">Daftar dokumen &amp; arsip digital peralatan</p>
              </div>
            </div>
            <EquipmentDocuments documents={documents} onChange={handleDocumentsChange} showActions={false} />
          </div>
        )}
      </div>

      {/* Modal Lightbox Foto Penuh */}
      {showFullPhoto && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setShowFullPhoto(false)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', background: '#fff', padding: '16px', borderRadius: '12px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            {hasValidPhoto ? (
              <img
                src={photoUrl}
                alt={name}
                onError={() => setPhotoError(true)}
                style={{ maxWidth: '100%', maxHeight: '75vh', display: 'block', borderRadius: '8px', margin: '0 auto' }}
              />
            ) : (
              <div style={{ padding: '30px 20px', color: '#6B7280' }}>
                <Package size={48} style={{ margin: '0 auto 10px auto', display: 'block', color: '#9CA3AF' }} />
                <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>Gambar Peralatan Tidak Ditemukan</p>
                <small style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px', display: 'block' }}>File foto belum diunggah atau path URL gambar tidak ditemukan di server.</small>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{name} ({assetNo})</span>
              <button
                type="button"
                onClick={() => setShowFullPhoto(false)}
                style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
