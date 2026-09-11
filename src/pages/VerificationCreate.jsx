import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardCheck, Loader2 } from 'lucide-react';
import Topbar from '../components/layout/Topbar';
import Sidebar from '../components/layout/Sidebar';
import { getStoredUser, peralatanApi, verifikasiApi } from '../utils/api';

const CHECKLIST_ITEMS = [
  { key: 'identitas', label: 'Identitas dan label alat' },
  { key: 'kelengkapan', label: 'Kelengkapan aksesoris pendukung' },
  { key: 'firmware', label: 'Versi firmware / perangkat lunak' },
  { key: 'kondisi_fisik', label: 'Pemeriksaan kondisi fisik' },
  { key: 'segel', label: 'Keutuhan segel kalibrasi' },
  { key: 'fungsi_awal', label: 'Uji fungsi awal (Power-On Self Test)' },
  { key: 'metrologi', label: 'Hasil pengukuran dan toleransi metrologi' },
  { key: 'sertifikat', label: 'Keabsahan sertifikat kalibrasi' }
];

const EMPTY_RESULTS = CHECKLIST_ITEMS.reduce((result, item) => ({ ...result, [item.key]: 'S' }), {
  catatan: ''
});

function EquipmentSummary({ equipment }) {
  const rows = [
    ['Nomor Aset', equipment.nomor_aset],
    ['Nama Peralatan', equipment.nama_peralatan],
    ['Merek / Model', `${equipment.merk || '-'} / ${equipment.model || '-'}`],
    ['Nomor Seri', equipment.nomor_seri],
    ['Ruangan', equipment.ruangan?.nama_ruangan || '-'],
    ['Petugas PIC', equipment.pic?.name || '-']
  ];

  return (
    <div className="verification-equipment-card">
      <div className="verification-equipment-icon"><ClipboardCheck size={22} /></div>
      <div>
        <span className="verification-kicker">Peralatan yang diverifikasi</span>
        <h2>{equipment.nama_peralatan || 'Peralatan'}</h2>
        <span className="verification-asset">Aset {equipment.nomor_aset || '-'}</span>
      </div>
      <div className="verification-equipment-grid">
        {rows.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value || '-'}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VerificationCreate({ onNavigate, equipmentId }) {
  const [user, setUser] = useState(getStoredUser);
  const [equipment, setEquipment] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    kode_aktivitas: 'TLKM13/P-001',
    tanggal_verifikasi: new Date().toISOString().split('T')[0],
    tindak_lanjut: '',
    catatan: '',
    hasil_verifikasi: { ...EMPTY_RESULTS }
  });

  useEffect(() => {
    const current = getStoredUser();
    if (current) setUser(current);
    else onNavigate('/login');

    peralatanApi.getById(equipmentId)
      .then((response) => setEquipment(response?.data || response))
      .catch((err) => setError(err.message || 'Data peralatan tidak dapat dimuat'))
      .finally(() => setLoading(false));

    const handleUserChanged = (event) => {
      if (event.detail) setUser(event.detail);
    };
    window.addEventListener('sikepo_user_changed', handleUserChanged);
    return () => window.removeEventListener('sikepo_user_changed', handleUserChanged);
  }, [equipmentId]);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateResult = (key, value) => setForm((current) => ({
    ...current,
    hasil_verifikasi: { ...current.hasil_verifikasi, [key]: value }
  }));

  const nextStep = () => {
    setError('');
    if (step === 1 && (!form.kode_aktivitas.trim() || !form.tanggal_verifikasi)) {
      setError('Kode aktivitas dan tanggal verifikasi wajib diisi.');
      return;
    }
    setStep((current) => Math.min(current + 1, 3));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await verifikasiApi.create({
        id_peralatan: Number(equipmentId),
        kode_aktivitas: form.kode_aktivitas.trim(),
        tanggal_verifikasi: form.tanggal_verifikasi,
        tindak_lanjut: form.tindak_lanjut.trim(),
        catatan: form.catatan.trim(),
        hasil_verifikasi: form.hasil_verifikasi
      });
      setSaved(true);
      setTimeout(() => onNavigate('/verifikasi'), 1400);
    } catch (err) {
      setError(err.message || 'Gagal menyimpan hasil verifikasi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <Topbar user={user} onNavigate={onNavigate} title="Input Verifikasi" onUpdateUser={(value) => setUser(value)} />
      <Sidebar activePath="/verifikasi" onNavigate={onNavigate} />
      <main className="main-content">
        <div className="eq-page-header">
          <div>
            <h1 className="eq-page-title">Input Verifikasi Peralatan</h1>
            <p className="eq-page-sub">Lengkapi pemeriksaan alat sesuai prosedur TLKM13/P</p>
          </div>
        </div>

        {saved ? (
          <div className="eq-success-state">
            <CheckCircle2 size={56} className="eq-success-icon" />
            <h2>Verifikasi Berhasil Disimpan</h2>
            <p>Hasil pemeriksaan telah terhubung dengan data peralatan.</p>
          </div>
        ) : (
          <div className="panel verification-create-panel">
            <div className="verification-stepper">
              {['Informasi', 'Pemeriksaan', 'Konfirmasi'].map((label, index) => {
                const itemStep = index + 1;
                return (
                  <React.Fragment key={label}>
                    <button type="button" className={`verification-step ${step >= itemStep ? 'active' : ''}`} onClick={() => itemStep < step && setStep(itemStep)}>
                      <span>{itemStep}</span>
                      <strong>{label}</strong>
                    </button>
                    {itemStep < 3 && <div className={`verification-step-line ${step > itemStep ? 'active' : ''}`} />}
                  </React.Fragment>
                );
              })}
            </div>

            {error && <div className="error-banner verification-error"><AlertCircle size={17} /><span>{error}</span></div>}
            {loading ? <div className="eq-empty-tab">Memuat data peralatan...</div> : !equipment ? <div className="eq-empty-tab">Data peralatan tidak ditemukan.</div> : (
              <form onSubmit={handleSubmit}>
                {step === 1 && (
                  <section className="verification-step-content">
                    <EquipmentSummary equipment={equipment} />
                    <div className="eq-form-grid verification-form-grid">
                      <div className="eq-field-group">
                        <label className="eq-field-label">Kode Aktivitas / SOP <span className="eq-required">*</span></label>
                        <input className="eq-field-input" value={form.kode_aktivitas} onChange={(event) => updateForm('kode_aktivitas', event.target.value)} placeholder="Contoh: TLKM13/P-001" required />
                      </div>
                      <div className="eq-field-group">
                        <label className="eq-field-label">Tanggal Verifikasi <span className="eq-required">*</span></label>
                        <input type="date" className="eq-field-input" value={form.tanggal_verifikasi} onChange={(event) => updateForm('tanggal_verifikasi', event.target.value)} required />
                      </div>
                    </div>
                  </section>
                )}

                {step === 2 && (
                  <section className="verification-step-content">
                    <div className="verification-section-heading"><div><h2>Checklist Pemeriksaan</h2><p>Pilih hasil pemeriksaan untuk setiap item.</p></div><span className="verification-legend">S Sesuai · TS Tidak Sesuai · TB Tidak Berlaku</span></div>
                    <div className="verification-checklist">
                      <div className="verification-checklist-head"><span>Item Pemeriksaan</span><span>S&nbsp;&nbsp;&nbsp;&nbsp; TS&nbsp;&nbsp;&nbsp;&nbsp; TB</span></div>
                      {CHECKLIST_ITEMS.map((item, index) => (
                        <div className="verification-checklist-row" key={item.key}>
                          <span><b>{index + 1}.</b> {item.label}</span>
                          <div className="verification-options">
                            {['S', 'TS', 'TB'].map((value) => <label key={value}><input type="radio" name={item.key} checked={form.hasil_verifikasi[item.key] === value} onChange={() => updateResult(item.key, value)} /> <span>{value}</span></label>)}
                          </div>
                        </div>
                      ))}
                      <div className="verification-checklist-note"><label className="eq-field-label">Catatan Checklist</label><textarea className="eq-field-input" rows="3" value={form.hasil_verifikasi.catatan} onChange={(event) => updateResult('catatan', event.target.value)} placeholder="Wajib diisi jika terdapat hasil TS atau TB" /></div>
                    </div>
                  </section>
                )}

                {step === 3 && (
                  <section className="verification-step-content">
                    <div className="verification-section-heading"><div><h2>Konfirmasi Verifikasi</h2><p>Periksa kembali data sebelum dikirim untuk persetujuan manager.</p></div></div>
                    <EquipmentSummary equipment={equipment} />
                    <div className="eq-form-grid verification-form-grid">
                      <div className="eq-field-group"><label className="eq-field-label">Tindak Lanjut</label><input className="eq-field-input" value={form.tindak_lanjut} onChange={(event) => updateForm('tindak_lanjut', event.target.value)} placeholder="Contoh: Kalibrasi ulang atau perbaikan sensor" /></div>
                      <div className="eq-field-group"><label className="eq-field-label">Catatan Tambahan</label><textarea className="eq-field-input" rows="2" value={form.catatan} onChange={(event) => updateForm('catatan', event.target.value)} placeholder="Catatan hasil pemeriksaan" /></div>
                    </div>
                  </section>
                )}

                <div className="eq-form-actions">
                  <button type="button" className="eq-btn-cancel" onClick={() => step === 1 ? onNavigate('/alat-ukur') : setStep((current) => current - 1)}>{step === 1 ? 'Batal' : 'Kembali'}</button>
                  {step < 3 ? <button type="button" className="eq-btn-next" onClick={nextStep}>Lanjut <span>→</span></button> : <button type="submit" className="eq-btn-next" disabled={saving}>{saving ? <><Loader2 size={15} className="spin" /> Menyimpan...</> : 'Kirim Verifikasi ✓'}</button>}
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
