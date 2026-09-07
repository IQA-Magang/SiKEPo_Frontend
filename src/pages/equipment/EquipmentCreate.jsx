import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, FileText } from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import Sidebar from '../../components/layout/Sidebar';
import EquipmentStepper from '../../components/equipment/EquipmentStepper';
import EquipmentForm from '../../components/equipment/EquipmentForm';
import EquipmentDocuments from '../../components/equipment/EquipmentDocuments';

function ConfirmRow({ label, value }) {
  return (
    <div className="eq-detail-row">
      <span className="eq-detail-label">{label}</span>
      <span className="eq-detail-value">{value || '-'}</span>
    </div>
  );
}

export default function EquipmentCreate({ onNavigate }) {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('sikepo_user');
    if (raw) try {
      const u = JSON.parse(raw);
      setUser(u);
      // Redirect non-admin
      if (u.role !== 'Admin') onNavigate('/alat-ukur');
    } catch (e) { onNavigate('/alat-ukur'); }
    else onNavigate('/alat-ukur');
  }, []);

  const handleSave = () => {
    setSaving(true);
    // ponytail: simulate async save; replace with API call when backend ready
    setTimeout(() => { setSaving(false); setSaved(true); }, 1500);
    setTimeout(() => onNavigate('/alat-ukur'), 3000);
  };

  if (saved) {
    return (
      <div className="app-shell">
        <Topbar user={user} onNavigate={onNavigate} title="Alat Ukur Baru" />
        <Sidebar activePath="/alat-ukur" onNavigate={onNavigate} />
        <main className="main-content">
          <div className="eq-success-state">
            <CheckCircle2 size={56} className="eq-success-icon" />
            <h2>Alat Berhasil Disimpan!</h2>
            <p>Data alat ukur telah tersimpan. Mengalihkan ke daftar alat...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Topbar user={user} onNavigate={onNavigate} title="Alat Ukur Baru" />
      <Sidebar activePath="/alat-ukur" onNavigate={onNavigate} />

      <main className="main-content">
        <div className="eq-page-header">
          <div>
            <h1 className="eq-page-title">Alat Ukur Baru</h1>
            <p className="eq-page-sub">Lengkapi informasi alat ukur yang akan ditambahkan.</p>
          </div>
        </div>

        <div className="panel">
          <EquipmentStepper currentStep={step} />

          <div style={{ marginTop: '32px' }}>
            {step === 1 && (
              <EquipmentForm
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

                <div className="eq-confirm-section">
                  <h4 className="eq-confirm-section-title">Informasi Alat</h4>
                  <div className="eq-detail-rows">
                    <ConfirmRow label="Nomor Aset"  value={formData?.assetNumber} />
                    <ConfirmRow label="Nama Alat"   value={formData?.name} />
                    <ConfirmRow label="Merek"        value={formData?.brand} />
                    <ConfirmRow label="Tipe / Model" value={formData?.model} />
                    <ConfirmRow label="Nomor Seri"  value={formData?.serialNumber} />
                    <ConfirmRow label="Parameter"   value={formData?.parameter} />
                    <ConfirmRow label="Rentang Ukur" value={formData?.measurementRange} />
                    <ConfirmRow label="Resolusi"    value={formData?.resolution} />
                    <ConfirmRow label="Akurasi"     value={formData?.accuracy} />
                    <ConfirmRow label="Satuan"      value={formData?.unit} />
                    <ConfirmRow label="Ruang"       value={formData?.room} />
                    <ConfirmRow label="PIC"         value={formData?.pic} />
                    <ConfirmRow label="Frekuensi"   value={formData?.frequency} />
                  </div>
                </div>

                <div className="eq-confirm-section">
                  <h4 className="eq-confirm-section-title">Dokumen ({documents.length})</h4>
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
                  <button className="eq-btn-cancel" onClick={() => setStep(2)}>← Kembali</button>
                  <button className="eq-btn-next" onClick={handleSave} disabled={saving}>
                    {saving ? <><Loader2 size={15} className="eq-spinner" /> Menyimpan...</> : 'Simpan Alat ✓'}
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
