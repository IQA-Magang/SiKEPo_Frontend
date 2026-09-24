import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Package, Upload, FileText, Trash2, Info, Layers, CheckCircle, Plus, HardDrive, UserCheck, ShieldCheck } from 'lucide-react';
import { peralatanApi, dokumenApi, labsApi, ruanganApi, kelompokAssetApi, usersApi, getCurrentUser, STATIC_EQUIPMENT_CATEGORIES } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';

// Langkah-langkah stepper
const STEPS = ['Info Dasar', 'Lokasi & PIC', 'Detail Teknis', 'Dokumen Wajib', 'Konfirmasi'];

// ------------------------------------------------------------------
// Form Tambah Peralatan
// ------------------------------------------------------------------
export default function EquipmentCreate({ onNavigate }) {
  const { success: toastSuccess } = useToast();
  const [step, setStep]       = useState(0);
  const [submitting, setSub]  = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError]     = useState('');
  const [documentFiles, setDocumentFiles] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Options
  const [labs, setLabs]               = useState([]);
  const [ruangan, setRuangan]         = useState([]);
  const [kelompokAset, setKelompokAset] = useState([]);
  const [pics, setPics]               = useState([]);
  const [categories]                   = useState(STATIC_EQUIPMENT_CATEGORIES);
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
    // Step 1: Lokasi & PIC
    lab_id: '',
    ruangan_id: '',
    kelompok_aset_id: '',
    pic_id: '',
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
    // Alat Bantu
    fungsi_kegunaan: '',
    jenis_pemeriksaan_berkala: '',
    kriteria_pemeriksaan: '',
    tgl_pemeriksaan_terakhir: '',
    jadwal_karakterisasi_ulang: '',
    // Artefak Acuan
    jenis_deskripsi: '',
    karakteristik_yang_diacu: '',
    nilai_spesifikasi_karakterisasi: '',
    metode_karakterisasi: '',
    no_laporan_karakterisasi: '',
    tgl_karakterisasi_terakhir: '',
    kondisi_penyimpanan: '',
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
        const [l, r, k, u] = await Promise.allSettled([
          labsApi.getAll(),
          ruanganApi.getAll(),
          kelompokAssetApi.getAll(),
          usersApi.getAll(),
        ]);
        if (l.status === 'fulfilled') setLabs(l.value.data || []);
        if (r.status === 'fulfilled') setRuangan(r.value.data || []);
        if (k.status === 'fulfilled') setKelompokAset(k.value.data || []);
        if (u.status === 'fulfilled' && Array.isArray(u.value?.data)) {
          const staffPIC = u.value.data.filter((usr) => usr.pic === true || usr.pic === 1);
          setPics(staffPIC.length > 0 ? staffPIC : u.value.data);
        } else {
          // Fallback jika usersApi.getAll dibatasi oleh role backend
          const currentUser = getCurrentUser();
          if (currentUser) {
            setPics([{
              id: currentUser.user_id || currentUser.id,
              user_id: currentUser.user_id || currentUser.id,
              name: currentUser.name || currentUser.email,
              position: currentUser.position || currentUser.role,
            }]);
          }
        }

        const currentUser = getCurrentUser();
        const currentUserId = currentUser?.user_id || currentUser?.id;
        if (currentUser?.pic && currentUserId) {
          setForm((prev) => (prev.pic_id ? prev : { ...prev, pic_id: String(currentUserId) }));
        }
      } finally {
        setLoadingOpts(false);
      }
    }
    loadOptions();
  }, []);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
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
    if (step === 0) {
      if (!form.nama_peralatan.trim()) {
        setError('Nama peralatan wajib diisi.');
        return false;
      }
      if (!photoFile) {
        setError('Foto peralatan wajib diunggah.');
        return false;
      }
      if (!form.kategori_id) {
        setError('Kategori peralatan wajib dipilih.');
        return false;
      }
      if (!form.merek.trim()) {
        setError('Merek / Pabrikan wajib diisi.');
        return false;
      }
      if (!form.tipe_model.trim()) {
        setError('Tipe / Model wajib diisi.');
        return false;
      }
      if (!form.nomor_seri.trim()) {
        setError('Nomor Seri (Serial Number) wajib diisi.');
        return false;
      }
      if (!form.peranti_lunak_versi.trim()) {
        setError('Perangkat Lunak / Firmware wajib diisi.');
        return false;
      }
      if (!form.keterangan.trim()) {
        setError('Keterangan tambahan wajib diisi.');
        return false;
      }
    }
    if (step === 1) {
      if (!form.lab_id) {
        setError('Laboratorium wajib dipilih.');
        return false;
      }
      if (!form.ruangan_id) {
        setError('Lokasi ruangan wajib dipilih.');
        return false;
      }
      if (!form.kelompok_aset_id) {
        setError('Kelompok aset wajib dipilih.');
        return false;
      }
      if (!form.pic_id) {
        setError('Penanggung Jawab (PIC) wajib dipilih.');
        return false;
      }
    }
    if (step === 2) {
      if (form.kategori_id === 1) {
        if (!form.no_sertifikat.trim()) { setError('No. sertifikat kalibrasi wajib diisi.'); return false; }
        if (!form.interval_bulan) { setError('Interval kalibrasi (bulan) wajib diisi.'); return false; }
        if (!form.tgl_kalibrasi) { setError('Tanggal kalibrasi terakhir wajib diisi.'); return false; }
        if (!form.tgl_jatuh_tempo) { setError('Tanggal jatuh tempo kalibrasi wajib diisi.'); return false; }
      }
      if (form.kategori_id === 2) {
        if (!form.fungsi_kegunaan.trim()) { setError('Fungsi / Kegunaan wajib diisi.'); return false; }
        if (!form.jenis_pemeriksaan_berkala.trim()) { setError('Jenis pemeriksaan berkala wajib diisi.'); return false; }
        if (!form.interval_bulan) { setError('Interval pemeriksaan (bulan) wajib diisi.'); return false; }
        if (!form.tgl_jatuh_tempo) { setError('Tanggal jatuh tempo wajib diisi.'); return false; }
        if (!form.tgl_pemeriksaan_terakhir) { setError('Tanggal pemeriksaan terakhir wajib diisi.'); return false; }
        if (!form.kriteria_pemeriksaan.trim()) { setError('Kriteria pemeriksaan wajib diisi.'); return false; }
      }
      if (form.kategori_id === 3) {
        if (!form.jenis_deskripsi.trim()) { setError('Jenis / deskripsi acuan wajib diisi.'); return false; }
        if (!form.karakteristik_yang_diacu.trim()) { setError('Karakteristik yang diacu wajib diisi.'); return false; }
        if (!form.nilai_spesifikasi_karakterisasi.trim()) { setError('Nilai spesifikasi karakterisasi wajib diisi.'); return false; }
        if (!form.metode_karakterisasi.trim()) { setError('Metode karakterisasi wajib diisi.'); return false; }
        if (!form.no_laporan_karakterisasi.trim()) { setError('No. laporan karakterisasi wajib diisi.'); return false; }
        if (!form.tgl_karakterisasi_terakhir) { setError('Tanggal karakterisasi terakhir wajib diisi.'); return false; }
        if (!form.tgl_jatuh_tempo) { setError('Tanggal jatuh tempo wajib diisi.'); return false; }
        if (!form.kondisi_penyimpanan.trim()) { setError('Kondisi penyimpanan wajib diisi.'); return false; }
      }
      if (form.kategori_id === 4) {
        if (!form.sub_kategori.trim()) { setError('Sub kategori wajib diisi.'); return false; }
        if (!form.sumber_pemasok.trim()) { setError('Sumber / pemasok wajib diisi.'); return false; }
        if (!form.no_lot_batch_edisi.trim()) { setError('No. lot / batch / edisi wajib diisi.'); return false; }
        if (!form.grade_mutu.trim()) { setError('Grade mutu wajib diisi.'); return false; }
        if (!form.satuan_kemasan.trim()) { setError('Satuan kemasan wajib diisi.'); return false; }
        if (!form.tgl_terima_terbit) { setError('Tanggal terima / terbit wajib diisi.'); return false; }
        if (!form.tgl_kedaluwarsa) { setError('Tanggal kedaluwarsa wajib diisi.'); return false; }
        if (!form.deskripsi_spesifikasi.trim()) { setError('Deskripsi / spesifikasi wajib diisi.'); return false; }
        if (!form.status_ketersediaan.trim()) { setError('Status ketersediaan wajib diisi.'); return false; }
      }
    }
    if (step === 3) {
      if (documentFiles.length < 2) {
        setError('Minimal dua (2) file dokumen peralatan wajib diunggah.');
        return false;
      }
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

  function toIsoDate(val) {
    if (!val) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return `${val}T00:00:00Z`;
    }
    try {
      return new Date(val).toISOString();
    } catch {
      return null;
    }
  }

  async function handleSubmit() {
    setSub(true);
    setError('');
    try {
      const catId = Number(form.kategori_id);
      let detailPayload = {};

      if (catId === 1) {
        detailPayload = {
          peranti_lunak_versi: form.peranti_lunak_versi || '',
          metode_kelayakan: form.metode_kelayakan || 'kalibrasi eksternal',
          no_sertifikat: form.no_sertifikat || '',
          tgl_kalibrasi: toIsoDate(form.tgl_kalibrasi),
          tgl_jatuh_tempo: toIsoDate(form.tgl_jatuh_tempo),
          interval_bulan: Number(form.interval_bulan) || 0,
          fungsi_sbg_alat_standar: Boolean(form.fungsi_sbg_alat_standar),
          parameter_rentang_ukur: form.parameter_rentang_ukur || '',
          resolusi: form.resolusi || '',
          akurasi_spesifikasi: form.akurasi_spesifikasi || '',
          satuan: form.satuan || '',
          nilai_koreksi: form.nilai_koreksi || '',
          ketidakpastian: form.ketidakpastian || '',
        };
      } else if (catId === 2) {
        detailPayload = {
          fungsi_kegunaan: form.fungsi_kegunaan || '',
          peranti_lunak_versi: form.peranti_lunak_versi || '',
          jenis_pemeriksaan_berkala: form.jenis_pemeriksaan_berkala || 'pemeriksaan lain',
          kriteria_pemeriksaan: form.kriteria_pemeriksaan || '',
          tgl_pemeriksaan_terakhir: toIsoDate(form.tgl_pemeriksaan_terakhir),
          tgl_jatuh_tempo: toIsoDate(form.tgl_jatuh_tempo),
          interval_bulan: Number(form.interval_bulan) || 0,
          fungsi_sbg_alat_standar: Boolean(form.fungsi_sbg_alat_standar),
          karakteristik_acuan: form.karakteristik_acuan || '',
          jadwal_karakterisasi_ulang: form.jadwal_karakterisasi_ulang || '',
        };
      } else if (catId === 3) {
        detailPayload = {
          jenis_deskripsi: form.jenis_deskripsi || '',
          karakteristik_yang_diacu: form.karakteristik_yang_diacu || 'visual',
          nilai_spesifikasi_karakterisasi: form.nilai_spesifikasi_karakterisasi || '',
          metode_karakterisasi: form.metode_karakterisasi || '',
          no_laporan_karakterisasi: form.no_laporan_karakterisasi || '',
          tgl_karakterisasi_terakhir: toIsoDate(form.tgl_karakterisasi_terakhir),
          tgl_karakterisasi: toIsoDate(form.tgl_jatuh_tempo),
          interval_bulan: Number(form.interval_bulan) || 0,
          kondisi_penyimpanan: form.kondisi_penyimpanan || '',
          status: form.status_artefak || 'aktif',
        };
      } else if (catId === 4) {
        detailPayload = {
          sub_kategori: form.sub_kategori || 'data acuan',
          deskripsi_spesifikasi: form.deskripsi_spesifikasi || '',
          sumber_pemasok: form.sumber_pemasok || '',
          no_lot_batch_edisi: form.no_lot_batch_edisi || '',
          grade_mutu: form.grade_mutu || '',
          satuan_kemasan: form.satuan_kemasan || '',
          tgl_terima_terbit: toIsoDate(form.tgl_terima_terbit),
          tgl_kedaluwarsa: toIsoDate(form.tgl_kedaluwarsa),
          kondisi_penyimpanan: form.kondisi_penyimpanan || '',
          status_ketersediaan: form.status_ketersediaan || 'Tersedia',
        };
      }

      const payload = {
        nama_peralatan: form.nama_peralatan,
        kategori_id: catId,
        kategori_peralatan_id: catId,
        kelompok_aset_id: Number(form.kelompok_aset_id),
        ruangan_id: Number(form.ruangan_id),
        pic_id: Number(form.pic_id),
        merek: form.merek,
        tipe_model: form.tipe_model,
        nomor_seri: form.nomor_seri,
        peranti_lunak_versi: form.peranti_lunak_versi,
        keterangan: form.keterangan,
        // Peralatan baru tetap dikarantina sampai verifikasi P1 disetujui.
        status_alat: 'Karantina',
        detail: detailPayload,
      };

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
      setSub(false);
    }
  }

  // ---- SUCCESS STATE ----
  if (success) {
    return (
      <div className="page-container fade-in-up" style={{ maxWidth: 540, margin: '0 auto' }}>
        <div className="card card-padded" style={{ textAlign: 'center', padding: 'var(--sp-10)' }}>
          <div
            style={{
              width: 80,
              height: 80,
              background: 'var(--clr-success-100)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--sp-4)',
              boxShadow: '0 0 0 8px var(--clr-success-50)',
            }}
          >
            <CheckCircle size={44} style={{ color: 'var(--clr-success-500)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>
            Peralatan Berhasil Ditambahkan!
          </h2>
          <p style={{ color: 'var(--clr-dark-500)', marginBottom: 'var(--sp-3)' }}>Nomor aset yang ditetapkan oleh sistem:</p>
          <code
            style={{
              fontSize: 'var(--text-xl)',
              background: 'var(--clr-dark-100)',
              padding: 'var(--sp-3) var(--sp-6)',
              borderRadius: 'var(--radius-lg)',
              display: 'inline-block',
              fontWeight: 'var(--fw-bold)',
              letterSpacing: '1px',
              border: '1px solid var(--clr-dark-200)',
            }}
          >
            {success.nomor_aset}
          </code>
          <p style={{ marginTop: 'var(--sp-3)', fontSize: 'var(--text-sm)', color: 'var(--clr-dark-600)' }}>
            ID Sistem: <strong>{success.id}</strong>
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'center', marginTop: 'var(--sp-8)' }}>
            <button className="btn btn-secondary" onClick={() => onNavigate('/peralatan')} id="btn-kembali-daftar">
              <ArrowLeft size={16} /> Daftar Peralatan
            </button>
            {success.id && (
              <button className="btn btn-primary" onClick={() => onNavigate(`/peralatan/detail/${success.id}`)} id="btn-lihat-detail">
                Lihat Detail <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container fade-in-up" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', marginBottom: 'var(--sp-6)' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => onNavigate('/peralatan')} id="btn-kembali">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-extrabold)' }}>
            Tambah Peralatan Baru
          </h1>
          <p className="page-subtitle">
            Langkah {step + 1} dari {STEPS.length}: <strong>{STEPS[step]}</strong>
          </p>
        </div>
      </div>

      {/* Stepper Header Modern */}
      <div className="stepper-header-card">
        {/* Progress Bar Top */}
        <div className="stepper-progress-track">
          <div
            className="stepper-progress-fill"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Steps Grid Row */}
        <div className="stepper-steps-row">
          {STEPS.map((label, i) => {
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

            <div className="form-group">
              <label className="form-label" htmlFor="input-nama">
                Nama Peralatan <span className="required">*</span>
              </label>
              <input
                id="input-nama"
                className="form-input"
                placeholder="Contoh: Digital Multimeter / Spektrofotometer UV-Vis"
                value={form.nama_peralatan}
                onChange={(e) => setField('nama_peralatan', e.target.value)}
                style={{ fontSize: 'var(--text-base)', padding: '10px 14px' }}
              />
            </div>

            {/* Upload Foto Peralatan */}
            <div className="form-group">
              <label className="form-label">
                Foto Peralatan <span className="required">*</span>
              </label>
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
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleRemovePhoto}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                    title="Hapus foto"
                  >
                    <Trash2 size={14} /> Hapus Foto
                  </button>
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
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleSelectPhoto}
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
              <div className="form-group">
                <label className="form-label" htmlFor="input-merek">
                  Merek / Pabrikan <span className="required">*</span>
                </label>
                <input id="input-merek" className="form-input" placeholder="Fluke, Hioki, Keysight..." value={form.merek} onChange={(e) => setField('merek', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="input-tipe">
                  Tipe / Model <span className="required">*</span>
                </label>
                <input id="input-tipe" className="form-input" placeholder="179, MR6000..." value={form.tipe_model} onChange={(e) => setField('tipe_model', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="input-seri">
                  Nomor Seri (Serial Number) <span className="required">*</span>
                </label>
                <input id="input-seri" className="form-input" placeholder="SN-88492019" value={form.nomor_seri} onChange={(e) => setField('nomor_seri', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-software" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <HardDrive size={15} style={{ color: 'var(--clr-primary-500)' }} /> Perangkat Lunak / Software (Versi/Firmware) <span className="required">*</span>
              </label>
              <input
                id="input-software"
                className="form-input"
                placeholder="Contoh: LabVIEW v2023 / Firmware v1.4.2"
                value={form.peranti_lunak_versi}
                onChange={(e) => setField('peranti_lunak_versi', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-keterangan">
                Keterangan Tambahan <span className="required">*</span>
              </label>
              <textarea
                id="input-keterangan"
                className="form-textarea"
                placeholder="Catatan kondisi, kelengkapan aksesoris, atau riwayat penggunaan..."
                value={form.keterangan}
                onChange={(e) => setField('keterangan', e.target.value)}
                style={{ minHeight: 90 }}
              />
            </div>
          </div>
        )}

        {/* ---- STEP 1: Lokasi & PIC ---- */}
        {step === 1 && (
          <div key="step-lokasi-pic" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', borderBottom: '1px solid var(--clr-dark-100)', paddingBottom: 'var(--sp-4)' }}>
              <UserCheck size={22} style={{ color: 'var(--clr-primary-500)' }} />
              <div>
                <h2 className="section-title" style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Lokasi & Penanggung Jawab (PIC)</h2>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)', margin: 0 }}>Tentukan posisi laboratorium, ruangan fisik, kelompok aset, dan PIC alat</p>
              </div>
            </div>

            {loadingOpts ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 'var(--radius-md)' }} />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-5)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="select-lab">
                    Laboratorium <span className="required">*</span>
                  </label>
                  <select id="select-lab" className="form-select" value={form.lab_id} onChange={(e) => setField('lab_id', e.target.value)}>
                    <option value="">– Pilih Laboratorium –</option>
                    {labs.map((l) => (
                      <option key={l.id} value={l.id}>{l.nama_labs} ({l.kode_labs})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="select-ruangan">
                    Lokasi <span className="required">*</span>
                  </label>
                  <select id="select-ruangan" className="form-select" value={form.ruangan_id} onChange={(e) => setField('ruangan_id', e.target.value)}>
                    <option value="">– Pilih Lokasi –</option>
                    {ruangan
                      .filter((r) => !form.lab_id || String(r.labs_id) === String(form.lab_id))
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nama_ruangan} ({r.kode_ruangan}) — Lt. {r.lantai_ruangan}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="select-kelompok">
                    Kelompok Aset <span className="required">*</span>
                  </label>
                  <select id="select-kelompok" className="form-select" value={form.kelompok_aset_id} onChange={(e) => setField('kelompok_aset_id', e.target.value)}>
                    <option value="">– Pilih Kelompok Aset –</option>
                    {kelompokAset.map((k) => (
                      <option key={k.id} value={k.id}>{k.nama} ({k.kode})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="select-pic">
                    Penanggung Jawab (PIC) <span className="required">*</span>
                  </label>
                  <select id="select-pic" className="form-select" value={form.pic_id} onChange={(e) => setField('pic_id', e.target.value)}>
                    <option value="">– Pilih Staff / Officer PIC –</option>
                    {pics.map((u) => (
                      <option key={u.user_id || u.id} value={u.user_id || u.id}>
                        {u.name} — {u.position || u.email}
                      </option>
                    ))}
                  </select>
                </div>
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

            <DetailTeknis form={form} setField={setField} kategoriId={form.kategori_id} />
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

                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => handleRemoveFile(idx)}
                      title="Hapus file"
                      style={{ color: 'var(--clr-error-500)' }}
                    >
                      <Trash2 size={16} />
                    </button>
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
              <ConfirmRow label="PIC ID" value={form.pic_id || '–'} />
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
          <button className="btn btn-secondary" onClick={prevStep} disabled={step === 0} id="btn-prev-step">
            <ArrowLeft size={16} /> Sebelumnya
          </button>

          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={nextStep} id="btn-next-step" style={{ padding: '10px 24px' }}>
              Lanjutkan <ArrowRight size={16} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} id="btn-simpan-peralatan" style={{ padding: '10px 28px' }}>
              {submitting ? (
                <>
                  <div className="spinner" /> Menyimpan Data & Dokumen...
                </>
              ) : (
                <>
                  <CheckCircle size={18} /> Simpan Peralatan
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Komponen Input Stabil untuk Detail Teknis (Module-level agar fokus tidak hilang saat mengetik)
// ------------------------------------------------------------------
function DetailInputField({ id, label, type = 'text', value, onChange, placeholder }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label} <span className="required">*</span>
      </label>
      <input id={id} type={type} className="form-input" placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  );
}

// ------------------------------------------------------------------
// Detail Teknis per Kategori
// ------------------------------------------------------------------
function DetailTeknis({ form, setField, kategoriId }) {
  if (kategoriId === 1) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <div className="form-grid-2">
        <DetailInputField id="d-sertifikat" label="No. Sertifikat Kalibrasi" value={form.no_sertifikat} onChange={(e) => setField('no_sertifikat', e.target.value)} placeholder="CAL-2026-0012" />
        <DetailInputField id="d-interval" label="Interval Kalibrasi (Bulan)" type="number" value={form.interval_bulan} onChange={(e) => setField('interval_bulan', e.target.value)} placeholder="12" />
        <DetailInputField id="d-tgl-kalibrasi" label="Tgl. Kalibrasi Terakhir" type="date" value={form.tgl_kalibrasi} onChange={(e) => setField('tgl_kalibrasi', e.target.value)} />
        <DetailInputField id="d-tgl-jatuh" label="Tgl. Jatuh Tempo Kalibrasi" type="date" value={form.tgl_jatuh_tempo} onChange={(e) => setField('tgl_jatuh_tempo', e.target.value)} />
      </div>
    </div>
  );

  if (kategoriId === 2) return (
    <div className="form-grid-2">
      <DetailInputField id="d-fungsi" label="Fungsi / Kegunaan" value={form.fungsi_kegunaan} onChange={(e) => setField('fungsi_kegunaan', e.target.value)} />
      <DetailInputField id="d-jenis-pemeriksaan" label="Jenis Pemeriksaan Berkala" value={form.jenis_pemeriksaan_berkala} onChange={(e) => setField('jenis_pemeriksaan_berkala', e.target.value)} />
      <DetailInputField id="d-interval-ab" label="Interval (Bulan)" type="number" value={form.interval_bulan} onChange={(e) => setField('interval_bulan', e.target.value)} />
      <DetailInputField id="d-jatuh-ab" label="Tgl. Jatuh Tempo" type="date" value={form.tgl_jatuh_tempo} onChange={(e) => setField('tgl_jatuh_tempo', e.target.value)} />
      <DetailInputField id="d-tgl-pemeriksaan" label="Tgl. Pemeriksaan Terakhir" type="date" value={form.tgl_pemeriksaan_terakhir} onChange={(e) => setField('tgl_pemeriksaan_terakhir', e.target.value)} />
      <div className="form-group" style={{ gridColumn: '1/-1' }}>
        <label className="form-label" htmlFor="d-kriteria">
          Kriteria Pemeriksaan <span className="required">*</span>
        </label>
        <textarea id="d-kriteria" className="form-textarea" value={form.kriteria_pemeriksaan} onChange={(e) => setField('kriteria_pemeriksaan', e.target.value)} style={{ minHeight: 80 }} />
      </div>
    </div>
  );

  if (kategoriId === 3) return (
    <div className="form-grid-2">
      <DetailInputField id="d-jenis-aa" label="Jenis / Deskripsi Acuan" value={form.jenis_deskripsi} onChange={(e) => setField('jenis_deskripsi', e.target.value)} />
      <DetailInputField id="d-karakteristik" label="Karakteristik yang Diacu" value={form.karakteristik_yang_diacu} onChange={(e) => setField('karakteristik_yang_diacu', e.target.value)} />
      <DetailInputField id="d-nilai-spec" label="Nilai Spesifikasi Karakterisasi" value={form.nilai_spesifikasi_karakterisasi} onChange={(e) => setField('nilai_spesifikasi_karakterisasi', e.target.value)} />
      <DetailInputField id="d-metode-kar" label="Metode Karakterisasi" value={form.metode_karakterisasi} onChange={(e) => setField('metode_karakterisasi', e.target.value)} />
      <DetailInputField id="d-no-laporan" label="No. Laporan Karakterisasi" value={form.no_laporan_karakterisasi} onChange={(e) => setField('no_laporan_karakterisasi', e.target.value)} />
      <DetailInputField id="d-tgl-kar" label="Tgl. Karakterisasi Terakhir" type="date" value={form.tgl_karakterisasi_terakhir} onChange={(e) => setField('tgl_karakterisasi_terakhir', e.target.value)} />
      <DetailInputField id="d-jatuh-aa" label="Tgl. Jatuh Tempo" type="date" value={form.tgl_jatuh_tempo} onChange={(e) => setField('tgl_jatuh_tempo', e.target.value)} />
      <DetailInputField id="d-kondisi" label="Kondisi Penyimpanan" value={form.kondisi_penyimpanan} onChange={(e) => setField('kondisi_penyimpanan', e.target.value)} />
    </div>
  );

  if (kategoriId === 4) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <div className="form-grid-2">
        <DetailInputField id="d-subkat" label="Sub Kategori" value={form.sub_kategori} onChange={(e) => setField('sub_kategori', e.target.value)} />
        <DetailInputField id="d-pemasok" label="Sumber / Pemasok" value={form.sumber_pemasok} onChange={(e) => setField('sumber_pemasok', e.target.value)} />
        <DetailInputField id="d-lot" label="No. Lot / Batch / Edisi" value={form.no_lot_batch_edisi} onChange={(e) => setField('no_lot_batch_edisi', e.target.value)} />
        <DetailInputField id="d-grade" label="Grade Mutu" value={form.grade_mutu} onChange={(e) => setField('grade_mutu', e.target.value)} />
        <DetailInputField id="d-satuan-kemasan" label="Satuan Kemasan" value={form.satuan_kemasan} onChange={(e) => setField('satuan_kemasan', e.target.value)} />
        <DetailInputField id="d-tgl-terima" label="Tgl. Terima / Terbit" type="date" value={form.tgl_terima_terbit} onChange={(e) => setField('tgl_terima_terbit', e.target.value)} />
        <DetailInputField id="d-tgl-kadaluarsa" label="Tgl. Kedaluwarsa" type="date" value={form.tgl_kedaluwarsa} onChange={(e) => setField('tgl_kedaluwarsa', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="d-deskripsi-kp">
          Deskripsi / Spesifikasi <span className="required">*</span>
        </label>
        <textarea id="d-deskripsi-kp" className="form-textarea" value={form.deskripsi_spesifikasi} onChange={(e) => setField('deskripsi_spesifikasi', e.target.value)} style={{ minHeight: 80 }} />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="d-ketersediaan">
          Status Ketersediaan <span className="required">*</span>
        </label>
        <select id="d-ketersediaan" className="form-select" value={form.status_ketersediaan} onChange={(e) => setField('status_ketersediaan', e.target.value)}>
          {['Berlaku', 'Tersedia', 'Stok cukup', 'Stok menipis', 'Kedaluwarsa', 'Habis'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return <p>Pilih kategori pada langkah sebelumnya.</p>;
}

function ConfirmRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--sp-4)', padding: 'var(--sp-3) 0', borderBottom: '1px solid var(--clr-dark-100)' }}>
      <div style={{ width: 200, flexShrink: 0, fontSize: 'var(--text-sm)', color: 'var(--clr-dark-500)' }}>{label}</div>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--clr-dark-900)' }}>{value || '–'}</div>
    </div>
  );
}
