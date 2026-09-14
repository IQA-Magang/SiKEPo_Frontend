import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, FileText, AlertCircle } from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import Sidebar from '../../components/layout/Sidebar';
import EquipmentStepper from '../../components/equipment/EquipmentStepper';
import EquipmentForm from '../../components/equipment/EquipmentForm';
import EquipmentDocuments from '../../components/equipment/EquipmentDocuments';
import { peralatanApi, getStoredUser, cacheEquipment } from '../../utils/api';

function ConfirmRow({ label, value }) {
  return (
    <div className="eq-detail-row">
      <span className="eq-detail-label">{label}</span>
      <span className="eq-detail-value">{value || '-'}</span>
    </div>
  );
}

export default function EquipmentCreate({ onNavigate }) {
  const [user, setUser] = useState(getStoredUser);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const current = getStoredUser();
    if (current) {
      setUser(current);
      if (current.role?.toLowerCase() !== 'admin') onNavigate('/alat-ukur');
    } else {
      onNavigate('/alat-ukur');
    }

    const handleUserChanged = (e) => {
      if (e.detail) setUser(e.detail);
    };
    window.addEventListener('sikepo_user_changed', handleUserChanged);
    return () => window.removeEventListener('sikepo_user_changed', handleUserChanged);
  }, []);

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    setApiError('');

    try {
      // Kirim hanya field yang diterima CreatePeralatanRequest di backend.
      const backendPayload = {
        nomor_aset: formData.nomor_aset,
        nama_peralatan: formData.nama_peralatan,
        kategori_id: Number(formData.kategori_id),
        kelompok_aset_id: Number(formData.kelompok_aset_id),
        ruangan_id: Number(formData.ruangan_id),
        pic_id: Number(formData.pic_id),
        merek: formData.merek || '',
        tipe_model: formData.tipe_model || '',
        nomor_seri: formData.nomor_seri || '',
        foto: formData.foto || '',
        status_alat: formData.status_alat || 'Aktif',
        keterangan: formData.keterangan || '',
        detail: formData.detail || {}
      };
      const response = await peralatanApi.create(backendPayload);
      // POST backend hanya mengembalikan status/message, jadi gunakan payload
      // yang sudah diterima backend untuk memperbarui daftar pada browser ini.
      const savedEquipment = response?.data && !Array.isArray(response.data)
        ? { ...backendPayload, ...response.data }
        : { ...backendPayload };
      cacheEquipment(savedEquipment);
      const documentMetadata = documents.map(({ file: _file, ...document }) => document);
      const storedDocuments = JSON.parse(localStorage.getItem('sikepo_asset_documents') || '{}');
      const keys = [backendPayload.nomor_aset, savedEquipment?.id].filter(Boolean).map(String);
      keys.forEach(key => { storedDocuments[key] = documentMetadata; });
      localStorage.setItem('sikepo_asset_documents', JSON.stringify(storedDocuments));
      setSaving(false);
      setSaved(true);
      setTimeout(() => onNavigate('/alat-ukur'), 2200);
    } catch (err) {
      console.error('Gagal menyimpan peralatan:', err);
      setSaving(false);
      setApiError(err.message || 'Gagal menyimpan peralatan ke database backend');
    }
  };

  if (saved) {
    return (
      <div className="app-shell">
        <Topbar user={user} onNavigate={onNavigate} title="Alat Ukur Baru" onUpdateUser={(u) => setUser(u)} />
        <Sidebar activePath="/alat-ukur" onNavigate={onNavigate} />
        <main className="main-content">
          <div className="eq-success-state">
            <CheckCircle2 size={56} className="eq-success-icon" />
            <h2>Alat Berhasil Disimpan!</h2>
            <p>Data alat ukur telah tersimpan di database backend. Mengalihkan ke daftar alat...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Topbar user={user} onNavigate={onNavigate} title="Tambah Peralatan Baru" onUpdateUser={(u) => setUser(u)} />
      <Sidebar activePath="/alat-ukur" onNavigate={onNavigate} />

      <main className="main-content">
        <div className="eq-page-header">
          <div>
            <h1 className="eq-page-title">Tambah Peralatan Baru</h1>
            <p className="eq-page-sub">Lengkapi informasi peralatan yang akan ditambahkan ke sistem</p>
          </div>
        </div>

        <div className="panel">
          <EquipmentStepper currentStep={step} />

          <div style={{ marginTop: '32px' }}>
            {step === 1 && (
              <EquipmentForm
                initialData={formData}
                onNext={(data) => { setFormData(data); setStep(2); }}
                onCancel={() => onNavigate('/alat-ukur')}
              />
            )}

            {step === 2 && (
              <EquipmentDocuments
                documents={documents}
                onChange={setDocuments}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <div>
                <h3 className="eq-confirm-title">Ringkasan Data Alat</h3>

                {apiError && (
                  <div className="error-banner" style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={16} />
                      <span>{apiError}</span>
                    </div>
                  </div>
                )}

                <div className="eq-confirm-section">
                  <h4 className="eq-confirm-section-title">Informasi Alat (Tersinkronisasi Database)</h4>
                  <div className="eq-detail-rows">
                    <ConfirmRow label="Nomor Aset"        value={formData?.nomor_aset} />
                    <ConfirmRow label="Nama Peralatan"    value={formData?.nama_peralatan} />
                    <ConfirmRow label="Merek"             value={formData?.merk} />
                    <ConfirmRow label="Tipe / Model"      value={formData?.model} />
                    <ConfirmRow label="Nomor Seri"        value={formData?.nomor_seri} />
                    <ConfirmRow label="Kelompok Peralatan" value={formData?.kategori_peralatan} />
                    <ConfirmRow label="Kondisi"           value={formData?.kondisi} />
                    <ConfirmRow label="Status Kelayakan"  value={formData?.status_kelayakan} />
                    <ConfirmRow label="Metode"            value={formData?.metode} />
                    <ConfirmRow label="Jenis Pakai"       value={formData?.jenis_pakai} />
                  </div>
                </div>

                <div className="eq-confirm-section">
                  <h4 className="eq-confirm-section-title">Dokumen Pendukung ({documents.length})</h4>
                  {documents.length === 0
                    ? <p className="eq-empty-tab">Tidak ada dokumen dilampirkan.</p>
                    : documents.map((d, i) => (
                        <div key={i} className="eq-doc-item">
                          <FileText size={18} className="eq-doc-icon" />
                          <div className="eq-doc-info">
                            <span className="eq-doc-name" title={d.name}>{d.name}</span>
                            <span className="eq-doc-meta">{d.type} · {d.size}</span>
                          </div>
                        </div>
                      ))
                  }
                </div>

                <div className="eq-form-actions">
                  <button className="eq-btn-cancel" onClick={() => setStep(2)} disabled={saving}>
                    ← Kembali
                  </button>
                  <button className="eq-btn-next" onClick={handleSave} disabled={saving}>
                    {saving ? <><Loader2 size={15} className="spin" /> Menyimpan ke Backend...</> : 'Simpan Alat ✓'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
