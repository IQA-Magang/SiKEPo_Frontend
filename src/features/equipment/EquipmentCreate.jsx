import React, { useState, useEffect } from 'react';
import './equipment.css';
import { ArrowLeft, ArrowRight, Package, Upload, FileText, Trash2, Info, Layers, CheckCircle, Plus, HardDrive, ShieldCheck } from 'lucide-react';
import { peralatanApi, dokumenApi, labsApi, ruanganApi, kelompokAssetApi, STATIC_EQUIPMENT_CATEGORIES } from '../../shared/services/api.js';
import { useToast } from '../../app/providers/ToastContext.jsx';
import { Button, FormField } from '../../shared/components/ui/index.js';
import {
  buildEquipmentPayload,
  calculateCalibrationDueDate,
  EQUIPMENT_CREATE_STEPS,
  getEquipmentStepValidationError,
} from './equipmentCreateData.js';
import EquipmentTechnicalDetails from './components/EquipmentTechnicalDetails.jsx';

// ------------------------------------------------------------------
// Form Tambah Peralatan
// ------------------------------------------------------------------
export default function EquipmentCreate({ onNavigate }) {
  const { success: toastSuccess } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [documentFiles, setDocumentFiles] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Options
  const [labs, setLabs] = useState([]);
  const [ruangan, setRuangan] = useState([]);
  const [kelompokAset, setKelompokAset] = useState([]);
  const categories = STATIC_EQUIPMENT_CATEGORIES;
  const [loadingOpts, setLoadingOpts] = useState(true);

  // Form data
  const [form, setForm] = useState({
    // Step 0: Info Dasar
    nama_peralatan: '',
    kategori_id: 0,
    merek: '',
    tipe_model: '',
    nomor_seri: '',
    peranti_lunak_versi: '',
    keterangan: '',
    status_alat: 'Karantina',
    // Step 1: Lokasi
    lab_id: '',
    ruangan_id: '',
    kelompok_aset_id: '',
    // Step 2: Detail Teknis (dinamis per kategori)
    // Alat Ukur
    parameter_rentang_ukur: '',
    resolusi: '',
    akurasi_spesifikasi: '',
    satuan: '',
    metode_kelayakan: '',
    no_sertifikat: '',
    tgl_kalibrasi: '',
    tgl_jatuh_tempo: '',
    interval_bulan: '',
    nilai_koreksi: '',
    ketidakpastian: '',
    status_kelayakan: 'Layak',
    fungsi_sbg_alat_standar: false,
    jenis_label: 'calibration',
    // Alat Bantu
    fungsi_kegunaan: '',
    jenis_pemeriksaan_berkala: '',
    kriteria_pemeriksaan: '',
    tgl_pemeriksaan_terakhir: '',
    jadwal_karakterisasi_ulang: '',
    karakteristik_acuan: '',
    // Artefak Acuan
    jenis_deskripsi: '',
    karakteristik_yang_diacu: '',
    nilai_spesifikasi_karakterisasi: '',
    metode_karakterisasi: '',
    no_laporan_karakterisasi: '',
    tgl_karakterisasi_terakhir: '',
    kondisi_penyimpanan: '',
    status_artefak: 'aktif',
    // Komponen Pendukung
    sub_kategori: '',
    deskripsi_spesifikasi: '',
    sumber_pemasok: '',
    no_lot_batch_edisi: '',
    grade_mutu: '',
    satuan_kemasan: '',
    tgl_terima_terbit: '',
    tgl_kedaluwarsa: '',
    status_ketersediaan: 'Tersedia',
  });

  useEffect(() => {
    async function loadOptions() {
      try {
        const [l, r, k] = await Promise.allSettled([
          labsApi.getAll(),
          ruanganApi.getAll(),
          kelompokAssetApi.getAll(),
        ]);
        if (l.status === 'fulfilled') setLabs(l.value.data || []);
        if (r.status === 'fulfilled') setRuangan(r.value.data || []);
        if (k.status === 'fulfilled') setKelompokAset(k.value.data || []);
      } finally {
        setLoadingOpts(false);
      }
    }
    loadOptions();
  }, []);

  function setField(name, value) {
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (
        Number(prev.kategori_id) === 1 &&
        ['tgl_kalibrasi', 'interval_bulan'].includes(name)
      ) {
        updated.tgl_jatuh_tempo = calculateCalibrationDueDate(
          updated.tgl_kalibrasi,
          updated.interval_bulan,
        );
      }
      return updated;
    });
    if (error) setError('');
  }

  function handleSelectPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    if (error) setError('');
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  }

  function handleAddFiles(e) {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setDocumentFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const newUnique = selected.filter((f) => !existingNames.has(f.name));
      return [...prev, ...newUnique];
    });
    if (error) setError('');
    e.target.value = '';
  }

  function handleRemoveFile(index) {
    setDocumentFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function validateStep() {
    const validationError = getEquipmentStepValidationError(
      form,
      step,
      photoFile,
      documentFiles.length,
    );
    if (validationError) {
      setError(validationError);
      return false;
    }
    return true;
  }

  function nextStep() {
    if (!validateStep()) return;
    setError('');
    setStep((s) => s + 1);
  }

  function prevStep() {
    setError('');
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const payload = buildEquipmentPayload(form);

      const res = await peralatanApi.create(payload);
      const equipmentId = res.id || res.data?.id;
      if (!equipmentId) throw new Error('Peralatan tersimpan, tetapi ID peralatan tidak diterima.');

      // Upload foto jika ada
      if (photoFile) {
        await peralatanApi.uploadFoto(equipmentId, photoFile);
      }

      // Upload semua dokumen
      for (const file of documentFiles) {
        await dokumenApi.upload(equipmentId, file);
      }

      // Peralatan baru berstatus Karantina dan masuk ke daftar verifikasi (menunggu verifikasi)
      toastSuccess(`Peralatan "${form.nama_peralatan}" berhasil ditambahkan dan masuk ke daftar verifikasi.`);
      onNavigate('/verifikasi');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan peralatan.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-container fade-in-up" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
        <Button variant="ghost" className="btn-icon" onClick={() => onNavigate('/peralatan')} id="btn-kembali" aria-label="Kembali ke daftar peralatan">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="page-title" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-extrabold)' }}>
            Tambah Peralatan Baru
          </h1>
          <p className="page-subtitle">
            Langkah {step + 1} dari {EQUIPMENT_CREATE_STEPS.length}: <strong>{EQUIPMENT_CREATE_STEPS[step]}</strong>
          </p>
        </div>
      </div>

      {/* Stepper Header Modern */}
      <div className="stepper-header-card">
        {/* Progress Bar Top */}
        <div className="stepper-progress-track">
          <div
            className="stepper-progress-fill"
            style={{ width: `${((step + 1) / EQUIPMENT_CREATE_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Steps Grid Row */}
        <div className="stepper-steps-row">
          {EQUIPMENT_CREATE_STEPS.map((label, i) => {
            const isDone = i < step;
            const isActive = i === step;
            return (
              <div
                key={i}
                className={`stepper-pill ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                onClick={() => isDone && setStep(i)}
                style={{ cursor: isDone ? 'pointer' : 'default' }}
                title={`Langkah ${i + 1}: ${label}`}
              >
                <div className="stepper-pill-num">
                  {isDone ? '✓' : i + 1}
                </div>
                <span className="stepper-pill-label">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Card */}
      <div
        className="card card-padded"
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--clr-dark-200)',
          boxShadow: 'var(--shadow-md)',
          padding: 'var(--sp-8)',
        }}
      >
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--sp-6)', display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <Info size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* ---- STEP 0: Info Dasar ---- */}
        {step === 0 && (
          <div key="step-info-dasar" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', borderBottom: '1px solid var(--clr-dark-100)', paddingBottom: 'var(--sp-4)' }}>
              <Package size={22} style={{ color: 'var(--clr-primary-500)' }} />
              <div>
                <h2 className="section-title" style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Informasi Dasar Peralatan</h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', margin: 0 }}>Masukkan identitas dan kategori umum peralatan laboratorium</p>
              </div>
            </div>

            <FormField label="Nama Peralatan" htmlFor="input-nama" hint="Gunakan nama jenis alat yang mudah dikenali. Merek, tipe, dan nomor seri diisi pada kolom masing-masing." hintId="help-input-nama" required>
              <input
                id="input-nama"
                className="form-input"
                aria-describedby="help-input-nama"
                placeholder="Contoh: Digital Multimeter / Spektrofotometer UV-Vis"
                value={form.nama_peralatan}
                onChange={(e) => setField('nama_peralatan', e.target.value)}
                style={{ fontSize: 'var(--text-base)', padding: '10px 14px' }}
              />
            </FormField>

            {/* Upload Foto Peralatan */}
            <div className="form-group">
              <label className="form-label" htmlFor="input-foto-peralatan">
                Foto Peralatan <span className="required">*</span>
              </label>
              <FieldHelp id="help-foto">Unggah foto alat secara utuh dan jelas agar mudah dicocokkan saat inventarisasi.</FieldHelp>
              {photoPreview ? (
                <div style={{ position: 'relative', display: 'inline-block', maxWidth: 280 }}>
                  <img
                    src={photoPreview}
                    alt="Preview Peralatan"
                    style={{
                      width: '100%',
                      maxHeight: 200,
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--clr-dark-200)',
                    }}
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleRemovePhoto}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                    title="Hapus foto"
                  >
                    <Trash2 size={14} /> Hapus Foto
                  </Button>
                </div>
              ) : (
                <div
                  style={{
                    border: '2px dashed var(--clr-dark-300)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--sp-6)',
                    textAlign: 'center',
                    background: 'var(--clr-dark-50)',
                    transition: 'border-color var(--duration-fast)',
                  }}
                >
                  <div style={{ width: 44, height: 44, background: 'var(--clr-primary-50)', color: 'var(--clr-primary-500)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--sp-2)' }}>
                    <Upload size={20} />
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--clr-dark-800)', marginBottom: 2 }}>
                    Unggah Foto Peralatan
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', marginBottom: 'var(--sp-3)' }}>
                    Format yang didukung: JPG, PNG, WEBP (Maks. 5MB)
                  </p>
                  <label className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <Plus size={14} /> Pilih Foto Peralatan
                    <input
                      id="input-foto-peralatan"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleSelectPhoto}
                      aria-describedby="help-foto"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Kategori Peralatan <span className="required">*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--sp-3)' }}>
                {categories.map((k) => {
                  const isSelected = form.kategori_id === k.id;
                  return (
                    <div
                      key={k.id}
                      onClick={() => setField('kategori_id', k.id)}
                      id={`kat-${k.id}`}
                      style={{
                        padding: 'var(--sp-4)',
                        borderRadius: 'var(--radius-lg)',
                        border: `2px solid ${isSelected ? 'var(--clr-primary-500)' : 'var(--clr-dark-200)'}`,
                        background: isSelected ? 'var(--clr-primary-50)' : '#fff',
                        cursor: 'pointer',
                        transition: 'all var(--duration-fast)',
                        boxShadow: isSelected ? '0 2px 8px rgba(238, 46, 36, 0.12)' : 'none',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 'var(--fw-bold)',
                          color: isSelected ? 'var(--clr-primary-700)' : 'var(--clr-dark-900)',
                          fontSize: 'var(--text-sm)',
                          marginBottom: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        {k.label}
                        {isSelected && <CheckCircle size={16} style={{ color: 'var(--clr-primary-500)' }} />}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', lineHeight: '1.4' }}>{k.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-grid-3">
              <FormField label="Merek / Pabrikan" htmlFor="input-merek" hint="Isi nama produsen, bukan tipe atau nomor seri alat." hintId="help-input-merek" required>
                <input id="input-merek" className="form-input" placeholder="Fluke, Hioki, Keysight..." value={form.merek} onChange={(e) => setField('merek', e.target.value)} />
              </FormField>
              <FormField label="Tipe / Model" htmlFor="input-tipe" hint="Isi kode model yang tercetak pada label atau badan alat." hintId="help-input-tipe" required>
                <input id="input-tipe" className="form-input" placeholder="179, MR6000..." value={form.tipe_model} onChange={(e) => setField('tipe_model', e.target.value)} />
              </FormField>
              <FormField label="Nomor Seri (Serial Number)" htmlFor="input-seri" hint="Gunakan nomor unik unit yang tercetak pada badan alat; jangan isi nomor aset internal." hintId="help-input-seri" required>
                <input id="input-seri" className="form-input" placeholder="SN-88492019" value={form.nomor_seri} onChange={(e) => setField('nomor_seri', e.target.value)} />
              </FormField>
            </div>

            <FormField label={<><HardDrive size={15} style={{ color: 'var(--clr-primary-500)' }} /> Perangkat Lunak / Software (Versi/Firmware)</>} htmlFor="input-software" hint="Isi versi firmware yang tertanam di alat atau versi software yang digunakan untuk mengoperasikannya." hintId="help-input-software" required>
              <input
                id="input-software"
                className="form-input"
                aria-describedby="help-input-software"
                placeholder="Contoh: LabVIEW v2023 / Firmware v1.4.2"
                value={form.peranti_lunak_versi}
                onChange={(e) => setField('peranti_lunak_versi', e.target.value)}
              />
            </FormField>

            <FormField label="Keterangan Tambahan" htmlFor="input-keterangan" hint="Tambahkan kondisi khusus, kelengkapan, atau informasi identifikasi yang belum tercakup di kolom lain." hintId="help-input-keterangan" required>
              <textarea
                id="input-keterangan"
                className="form-textarea"
                aria-describedby="help-input-keterangan"
                placeholder="Catatan kondisi, kelengkapan aksesoris, atau riwayat penggunaan..."
                value={form.keterangan}
                onChange={(e) => setField('keterangan', e.target.value)}
                style={{ minHeight: 90 }}
              />
            </FormField>
          </div>
        )}

        {/* ---- STEP 1: Lokasi ---- */}
        {step === 1 && (
          <div key="step-lokasi-pic" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', borderBottom: '1px solid var(--clr-dark-100)', paddingBottom: 'var(--sp-4)' }}>
              <Package size={22} style={{ color: 'var(--clr-primary-500)' }} />
              <div>
                <h2 className="section-title" style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Lokasi Peralatan</h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', margin: 0 }}>Tentukan laboratorium, ruangan fisik, dan kelompok aset</p>
              </div>
            </div>

            {loadingOpts ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 'var(--radius-md)' }} />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-5)' }}>
                <FormField label="Laboratorium" htmlFor="select-lab" hint="Pilih laboratorium pemilik atau pengguna utama peralatan." hintId="help-select-lab" required>
                  <select id="select-lab" className="form-select" value={form.lab_id} onChange={(e) => setField('lab_id', e.target.value)} aria-describedby="help-select-lab">
                    <option value="">– Pilih Laboratorium –</option>
                    {labs.map((l) => (
                      <option key={l.id} value={l.id}>{l.nama_labs} ({l.kode_labs})</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Lokasi" htmlFor="select-ruangan" hint="Pilih ruangan fisik tempat alat disimpan; pilihan mengikuti laboratorium di atas." hintId="help-select-ruangan" required>
                  <select id="select-ruangan" className="form-select" value={form.ruangan_id} onChange={(e) => setField('ruangan_id', e.target.value)} aria-describedby="help-select-ruangan">
                    <option value="">– Pilih Lokasi –</option>
                    {ruangan
                      .filter((r) => !form.lab_id || String(r.labs_id) === String(form.lab_id))
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nama_ruangan} ({r.kode_ruangan}) — Lt. {r.lantai_ruangan}
                        </option>
                      ))}
                  </select>
                </FormField>

                <FormField label="Kelompok Aset" htmlFor="select-kelompok" hint="Kelompok aset menentukan pengelompokan inventaris dan awalan nomor aset." hintId="help-select-kelompok" required>
                  <select id="select-kelompok" className="form-select" value={form.kelompok_aset_id} onChange={(e) => setField('kelompok_aset_id', e.target.value)} aria-describedby="help-select-kelompok">
                    <option value="">– Pilih Kelompok Aset –</option>
                    {kelompokAset.map((k) => (
                      <option key={k.id} value={k.id}>{k.nama} ({k.kode})</option>
                    ))}
                  </select>
                </FormField>

              </div>
            )}
          </div>
        )}

        {/* ---- STEP 2: Detail Teknis ---- */}
        {step === 2 && (
          <div key="step-detail-teknis" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', borderBottom: '1px solid var(--clr-dark-100)', paddingBottom: 'var(--sp-4)' }}>
              <Layers size={22} style={{ color: 'var(--clr-primary-500)' }} />
              <div>
                <h2 className="section-title" style={{ margin: 0, fontSize: 'var(--text-lg)' }}>
                  Detail Teknis — {categories.find((k) => k.id === form.kategori_id)?.label || 'Kategori peralatan'}
                </h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', margin: 0 }}>
                  Spesifikasi metrologis dan parameter khusus standar ISO/IEC 17025
                </p>
              </div>
            </div>

            <EquipmentTechnicalDetails form={form} setField={setField} categoryId={form.kategori_id} />
          </div>
        )}

        {/* ---- STEP 3: Dokumen Wajib (MINIMAL 2 DOKUMEN) ---- */}
        {step === 3 && (
          <div key="step-dokumen-wajib" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', borderBottom: '1px solid var(--clr-dark-100)', paddingBottom: 'var(--sp-4)' }}>
              <FileText size={22} style={{ color: 'var(--clr-primary-500)' }} />
              <div>
                <h2 className="section-title" style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Dokumen Wajib Peralatan</h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', margin: 0 }}>
                  Lampirkan sertifikat kalibrasi, manual book, spesifikasi teknis, atau dokumen identifikasi resmi
                </p>
              </div>
            </div>

            {/* Alert Persyaratan Minimal 2 Dokumen */}
            <div
              style={{
                padding: 'var(--sp-4) var(--sp-5)',
                background: documentFiles.length >= 2 ? 'var(--clr-success-100)' : 'var(--clr-info-100)',
                border: `1px solid ${documentFiles.length >= 2 ? 'var(--clr-success-500)' : 'var(--clr-info-500)'}`,
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--sp-3)',
              }}
            >
              <ShieldCheck
                size={20}
                style={{
                  color: documentFiles.length >= 2 ? 'var(--clr-success-500)' : 'var(--clr-info-500)',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', marginBottom: 2 }}>
                  Persyaratan Dokumen: Minimal 2 File Wajib
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-700)', lineHeight: '1.5' }}>
                  Wajib menyimpan <strong>minimal 2 file dokumen</strong> untuk setiap peralatan baru (contoh: 1. Sertifikat Kalibrasi / Laporan Pemeriksaan, 2. Manual Book / Foto Seri Identifikasi).
                </div>
                <div style={{ marginTop: 6 }}>
                  <span
                    className={`badge ${documentFiles.length >= 2 ? 'badge-aktif' : 'badge-kalibrasi'}`}
                    style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)' }}
                  >
                    Terpilih: {documentFiles.length} dari minimal 2 dokumen
                  </span>
                </div>
              </div>
            </div>

            {/* Dropzone Multi-Upload */}
            <div className="form-group">
              <label className="form-label">
                Unggah File Dokumen <span className="required">* (Min. 2 file)</span>
              </label>

              <div
                style={{
                  border: '2px dashed var(--clr-dark-300)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'var(--sp-8)',
                  textAlign: 'center',
                  background: 'var(--clr-dark-50)',
                  transition: 'border-color var(--duration-fast)',
                }}
              >
                <div style={{ width: 48, height: 48, background: 'var(--clr-primary-50)', color: 'var(--clr-primary-500)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--sp-3)' }}>
                  <Upload size={24} />
                </div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--clr-dark-800)', marginBottom: 4 }}>
                  Pilih file dokumen peralatan
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', marginBottom: 'var(--sp-4)' }}>
                  Format yang didukung: PDF, JPG, PNG, DOCX, XLSX (Bisa pilih lebih dari 1 file sekaligus)
                </p>

                <label className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <Plus size={16} /> Pilih File Dokumen
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    style={{ display: 'none' }}
                    onChange={handleAddFiles}
                  />
                </label>
              </div>
            </div>

            {/* List Dokumen Terpilih */}
            {documentFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', color: 'var(--clr-dark-800)' }}>
                  Daftar Dokumen yang Dipesan ({documentFiles.length}):
                </h4>
                {documentFiles.map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--sp-3) var(--sp-4)',
                      background: '#fff',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--clr-dark-200)',
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', minWidth: 0 }}>
                      <FileText size={18} style={{ color: 'var(--clr-primary-500)', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--clr-dark-900)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {idx + 1}. {file.name}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-400)' }}>
                          {(file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="btn-icon"
                      onClick={() => handleRemoveFile(idx)}
                      title="Hapus file"
                      style={{ color: 'var(--clr-error-500)' }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---- STEP 4: Konfirmasi ---- */}
        {step === 4 && (
          <div key="step-konfirmasi" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', borderBottom: '1px solid var(--clr-dark-100)', paddingBottom: 'var(--sp-4)' }}>
              <CheckCircle size={22} style={{ color: 'var(--clr-primary-500)' }} />
              <div>
                <h2 className="section-title" style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Konfirmasi Data Sebelum Simpan</h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', margin: 0 }}>Pastikan seluruh data inventaris dan dokumen sudah benar</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', background: 'var(--clr-dark-50)', padding: 'var(--sp-5)', borderRadius: 'var(--radius-lg)' }}>
              <ConfirmRow label="Nama Peralatan" value={form.nama_peralatan} />

              <ConfirmRow label="Foto Peralatan" value={photoFile ? photoFile.name : '–'} />
              <ConfirmRow label="Kategori" value={categories.find((k) => k.id === form.kategori_id)?.label || '–'} />
              <ConfirmRow label="Merek / Tipe" value={[form.merek, form.tipe_model].filter(Boolean).join(' / ') || '–'} />
              <ConfirmRow label="No. Seri" value={form.nomor_seri || '–'} />
              <ConfirmRow label="Software / Versi" value={form.peranti_lunak_versi || '–'} />
              <ConfirmRow label="Ruangan ID" value={form.ruangan_id || '–'} />
              <ConfirmRow label="Kelompok Aset ID" value={form.kelompok_aset_id || '–'} />
              <ConfirmRow label="Jumlah Dokumen" value={`${documentFiles.length} file terlampir`} />
            </div>

            <div className="alert alert-info" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
              <Package size={18} style={{ flexShrink: 0 }} />
              <span>Nomor aset akan otomatis digenerate secara unik oleh sistem backend SiKEPo setelah disimpan.</span>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--sp-8)', paddingTop: 'var(--sp-6)', borderTop: '1px solid var(--clr-dark-100)' }}>
          <Button variant="secondary" onClick={prevStep} disabled={step === 0} id="btn-prev-step">
            <ArrowLeft size={16} /> Sebelumnya
          </Button>

          {step < EQUIPMENT_CREATE_STEPS.length - 1 ? (
            <Button variant="primary" onClick={nextStep} id="btn-next-step" style={{ padding: '10px 24px' }}>
              Lanjutkan <ArrowRight size={16} />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} disabled={submitting} id="btn-simpan-peralatan" style={{ padding: '10px 28px' }}>
              {submitting ? (
                <>
                  <div className="spinner" /> Menyimpan Data & Dokumen...
                </>
              ) : (
                <>
                  <CheckCircle size={18} /> Simpan Peralatan
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldHelp({ id, children }) {
  return (
    <p id={id} className="equipment-create-field-help">
      {children}
    </p>
  );
}

function ConfirmRow({ label, value }) {
  return (
    <div className="equipment-create-confirm-row">
      <div className="equipment-create-confirm-row__label">{label}</div>
      <div className="equipment-create-confirm-row__value">{value || '–'}</div>
    </div>
  );
}