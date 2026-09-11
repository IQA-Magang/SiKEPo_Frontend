import React, { useState, useEffect } from 'react';
import {
  ClipboardList, BookOpen, FileText, ShieldCheck, MapPin,
  Package, Check, AlertCircle, CheckCircle, Plus, X, Award
} from 'lucide-react';
import EquipmentStatusBadge from './EquipmentStatusBadge';
import { verifikasiApi } from '../../utils/api';

const TABS = [
  { id: 'info',     label: 'Informasi',       icon: ClipboardList },
  { id: 'verify',   label: 'Verifikasi Mutu', icon: ShieldCheck },
  { id: 'borrow',   label: 'Peminjaman',      icon: BookOpen },
  { id: 'docs',     label: 'Dokumen',         icon: FileText },
];

function Row({ label, value }) {
  return (
    <div className="eq-detail-row">
      <span className="eq-detail-label">{label}</span>
      <span className="eq-detail-value">{value || '-'}</span>
    </div>
  );
}

const CHECKLIST_ITEMS = [
  { key: 'identitas', label: '1. Identitas & Label Alat' },
  { key: 'kelengkapan', label: '2. Kelengkapan Aksesoris Pendukung' },
  { key: 'firmware', label: '3. Versi Firmware / Perangkat Lunak' },
  { key: 'kondisi_fisik', label: '4. Pemeriksaan Kondisi Fisik' },
  { key: 'segel', label: '5. Keutuhan Segel Kalibrasi' },
  { key: 'fungsi_awal', label: '6. Uji Fungsi Awal (Power-On Self Test)' },
  { key: 'metrologi', label: '7. Hasil Pengukuran & Toleransi Metrologi' },
  { key: 'sertifikat', label: '8. Keabsahan Sertifikat Kalibrasi' },
];

export default function EquipmentDetail({ equipment, user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('info');
  const [verifikasiList, setVerifikasiList] = useState([]);
  const [loadingVerif, setLoadingVerif] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState('');

  // Modal Verifikasi Baru (Staff PIC)
  const [showVerifModal, setShowVerifModal] = useState(false);
  const [verifSubmitting, setVerifSubmitting] = useState(false);
  const [verifError, setVerifError] = useState('');
  const [verifForm, setVerifForm] = useState({
    kode_aktivitas: 'TLKM13/P-001',
    tindak_lanjut: '',
    catatan: '',
    hasil_verifikasi: {
      identitas: 'S',
      kelengkapan: 'S',
      firmware: 'S',
      kondisi_fisik: 'S',
      segel: 'S',
      fungsi_awal: 'S',
      metrologi: 'S',
      sertifikat: 'S',
      catatan: ''
    }
  });

  const role = (user?.role || 'staff').toLowerCase();

  const fetchVerifikasi = () => {
    if (!equipment?.id) return;
    setLoadingVerif(true);
    verifikasiApi.getByPeralatan(equipment.id)
      .then(res => {
        if (res?.data) setVerifikasiList(res.data);
      })
      .catch(() => {})
      .finally(() => setLoadingVerif(false));
  };

  useEffect(() => {
    if (activeTab === 'verify') {
      fetchVerifikasi();
    }
  }, [activeTab, equipment.id]);

  const showToast = (msg) => {
    setVerifyNotice(msg);
    setTimeout(() => setVerifyNotice(''), 4000);
  };

  const handleCreateVerifikasi = async (e) => {
    e.preventDefault();
    setVerifError('');
    setVerifSubmitting(true);

    try {
      await verifikasiApi.create({
        id_peralatan: Number(equipment.id),
        kode_aktivitas: verifForm.kode_aktivitas,
        tindak_lanjut: verifForm.tindak_lanjut,
        catatan: verifForm.catatan,
        hasil_verifikasi: verifForm.hasil_verifikasi
      });

      showToast('Form pemeriksaan verifikasi kelayakan berhasil diajukan.');
      setShowVerifModal(false);
      fetchVerifikasi();
    } catch (err) {
      setVerifError(err.message || 'Gagal menyimpan hasil verifikasi');
    } finally {
      setVerifSubmitting(false);
    }
  };

  const handleApproveVerif = async (verifId) => {
    try {
      await verifikasiApi.approve(verifId);
      showToast('Verifikasi alat berhasil disahkan oleh Manajer Mutu.');
      fetchVerifikasi();
    } catch (err) {
      alert(`Gagal mengesahkan verifikasi: ${err.message}`);
    }
  };

  const assetNo = equipment.nomor_aset || equipment.assetNumber || '-';
  const name = equipment.nama_peralatan || equipment.name || '-';
  const brand = equipment.merk || equipment.brand || '-';
  const model = equipment.model || '-';
  const serial = equipment.nomor_seri || equipment.serialNumber || '-';
  const count = equipment.jumlah || 1;
  const category = equipment.kategori_peralatan || equipment.category || 'Peralatan';
  const condition = equipment.kondisi || 'sesuai';
  const status = equipment.status_kelayakan || equipment.status || 'pending';
  const method = equipment.metode || 'internal';
  const usageType = equipment.jenis_pakai || 'tidak_habis_pakai';
  const roomName = equipment.ruangan ? `${equipment.ruangan.kode_ruangan} - ${equipment.ruangan.nama_ruangan}` : (equipment.room || '-');
  const picName = equipment.pic?.name || equipment.pic || '-';
  const inputBy = equipment.input_by_user?.name || '-';
  const verifiedBy = equipment.verified_by_user?.name || '-';

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
                <p className="panel-subtitle">Data spesifikasi & registrasi master peralatan</p>
              </div>
              <EquipmentStatusBadge status={status} />
            </div>

            <div className="eq-detail-rows">
              <Row label="Nomor Aset"        value={assetNo} />
              <Row label="Nama Peralatan"    value={name} />
              <Row label="Merek"             value={brand} />
              <Row label="Tipe / Model"      value={model} />
              <Row label="Nomor Seri"        value={serial} />
              <Row label="Jumlah Unit"       value={`${count} Unit`} />
              <Row label="Kategori"          value={category} />
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

        {activeTab === 'verify' && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2>Verifikasi & Kelayakan (SOP TLKM13/P)</h2>
                <p className="panel-subtitle">Riwayat inspeksi kelayakan fisik dan pengesahan mutu laboratorium (/api/verifikasi)</p>
              </div>
              <span className="compliance-tag">ISO/IEC 17025</span>
            </div>

            {verifyNotice && (
              <div className="eq-confirm-banner" style={{ background: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} color="#059669" />
                  <span>{verifyNotice}</span>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ fontSize: '13.5px', color: '#111827' }}>
                Riwayat Pemeriksaan Lapangan ({verifikasiList.length})
              </strong>
              {(role === 'staff' || role === 'admin') && (
                <button className="btn-hero-primary" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => setShowVerifModal(true)}>
                  <Plus size={14} /> <span>+ Input Hasil Ceklis</span>
                </button>
              )}
            </div>

            {loadingVerif ? (
              <p className="eq-empty-tab">Memuat data riwayat verifikasi...</p>
            ) : verifikasiList.length === 0 ? (
              <p className="eq-empty-tab">Belum ada catatan verifikasi inspeksi untuk peralatan ini.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {verifikasiList.map((v) => (
                  <div key={v.id_verifikasi} className="panel" style={{ border: '1px solid #E5E7EB', padding: '14px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: '#111827' }}>{v.kode_aktivitas}</strong>
                        <span style={{ marginLeft: '10px', fontSize: '12px', color: '#6B7280' }}>
                          {new Date(v.tanggal_verifikasi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <span className={`role-tag-badge ${v.keputusan === 'Layak' ? 'admin' : 'staff'}`}>
                        Keputusan: {v.keputusan || 'Menunggu'}
                      </span>
                    </div>

                    <div className="eq-detail-rows" style={{ marginTop: '8px' }}>
                      <Row label="Tindak Lanjut" value={v.tindak_lanjut} />
                      <Row label="Catatan" value={v.catatan} />
                      <Row label="Pengesah Mutu" value={v.verified_by_user ? `${v.verified_by_user.name} (${new Date(v.verified_at).toLocaleDateString('id-ID')})` : 'Menunggu Pengesahan Manajer'} />
                    </div>

                    {role === 'manager' && !v.verified_by && (
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn-hero-primary" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => handleApproveVerif(v.id_verifikasi)}>
                          <Check size={14} /> Sahkan Kelayakan (Approve)
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'borrow' && (
          <div className="panel">
            <div className="panel-header">
              <div><h2>Peminjaman</h2><p className="panel-subtitle">Status transaksi peminjaman alat</p></div>
            </div>
            <p className="eq-empty-tab">
              Peralatan ini berstatus <strong>{status}</strong>. Untuk mengajukan peminjaman atau melihat mutasi, silakan gunakan menu <strong>Peminjaman Alat</strong>.
            </p>
            {onNavigate && (
              <div style={{ marginTop: '14px' }}>
                <button className="btn-hero-secondary" onClick={() => onNavigate('/peminjaman')}>
                  Buka Menu Peminjaman →
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="panel">
            <div className="panel-header">
              <div><h2>Dokumen Alat</h2><p className="panel-subtitle">Daftar dokumen & arsip digital</p></div>
            </div>
            <p className="eq-empty-tab">Belum ada dokumen yang tersimpan di sistem.</p>
          </div>
        )}
      </div>

      {/* MODAL INPUT CEKLIS VERIFIKASI (ISO 17025) */}
      {showVerifModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal" style={{ maxWidth: '560px' }}>
            <div className="profile-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} className="text-red" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  Ceklis Pemeriksaan Kelayakan (TLKM13/P)
                </h3>
              </div>
              <button className="profile-modal-close" onClick={() => setShowVerifModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateVerifikasi}>
              <div className="profile-modal-body" style={{ padding: '20px', maxHeight: '65vh', overflowY: 'auto' }}>
                {verifError && (
                  <div className="error-banner" style={{ marginBottom: '14px' }}>
                    {verifError}
                  </div>
                )}

                <div className="eq-form-group">
                  <label className="eq-form-label">Kode Aktivitas / SOP *</label>
                  <input
                    type="text"
                    className="eq-form-input"
                    value={verifForm.kode_aktivitas}
                    onChange={(e) => setVerifForm({ ...verifForm, kode_aktivitas: e.target.value })}
                    required
                  />
                </div>

                <div style={{ margin: '14px 0 8px', fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                  8 Parameter Ceklis Lapangan (S = Sesuai, TS = Tidak Sesuai, TB = Tidak Berlaku):
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {CHECKLIST_ITEMS.map((item) => (
                    <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB', padding: '8px 12px', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: 500 }}>{item.label}</span>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {['S', 'TS', 'TB'].map((val) => (
                          <label key={val} style={{ fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <input
                              type="radio"
                              name={`ck-${item.key}`}
                              value={val}
                              checked={verifForm.hasil_verifikasi[item.key] === val}
                              onChange={() => setVerifForm({
                                ...verifForm,
                                hasil_verifikasi: { ...verifForm.hasil_verifikasi, [item.key]: val }
                              })}
                            />
                            <span>{val}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="eq-form-group" style={{ marginTop: '14px' }}>
                  <label className="eq-form-label">Tindak Lanjut / Rekomendasi</label>
                  <input
                    type="text"
                    className="eq-form-input"
                    placeholder="Contoh: Alat layak digunakan untuk pengujian kabel fiber"
                    value={verifForm.tindak_lanjut}
                    onChange={(e) => setVerifForm({ ...verifForm, tindak_lanjut: e.target.value })}
                  />
                </div>

                <div className="eq-form-group">
                  <label className="eq-form-label">Catatan Tambahan (Wajib jika ada TS atau TB)</label>
                  <textarea
                    className="eq-form-input"
                    rows="2"
                    placeholder="Masukkan rincian temuan pemeriksaan..."
                    value={verifForm.hasil_verifikasi.catatan}
                    onChange={(e) => setVerifForm({
                      ...verifForm,
                      catatan: e.target.value,
                      hasil_verifikasi: { ...verifForm.hasil_verifikasi, catatan: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="profile-modal-footer" style={{ display: 'flex', gap: '10px', padding: '16px 20px' }}>
                <button type="button" className="eq-btn-cancel" onClick={() => setShowVerifModal(false)} disabled={verifSubmitting}>
                  Batal
                </button>
                <button type="submit" className="btn-hero-primary" disabled={verifSubmitting}>
                  {verifSubmitting ? 'Mengirim...' : 'Simpan & Ajukan Verifikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
