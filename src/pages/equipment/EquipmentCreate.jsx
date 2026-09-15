import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Package, Upload, FileText } from 'lucide-react';
import { peralatanApi, dokumenApi, labsApi, ruanganApi, kelompokAssetApi, usersApi, KATEGORI_OPTIONS } from '../../utils/api.js';

// Langkah-langkah stepper
const STEPS = ['Info Dasar', 'Lokasi & PIC', 'Detail Teknis', 'Dokumen Wajib', 'Konfirmasi'];

// ------------------------------------------------------------------
// Form Tambah Peralatan
// ------------------------------------------------------------------
export default function EquipmentCreate({ onNavigate }) {
  const [step, setStep]       = useState(0);
  const [submitting, setSub]  = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError]     = useState('');
  const [documentFile, setDocumentFile] = useState(null);

  // Options
  const [labs, setLabs]               = useState([]);
  const [ruangan, setRuangan]         = useState([]);
  const [kelompokAset, setKelompokAset] = useState([]);
  const [pics, setPics]               = useState([]);
  const [loadingOpts, setLoadingOpts] = useState(true);

  // Form data
  const [form, setForm] = useState({
    // Step 1: Info Dasar
    nama_peralatan: '', kategori_id: 1, merek: '', tipe_model: '', nomor_seri: '', keterangan: '', status_alat: 'Aktif',
    // Step 2: Lokasi & PIC
    lab_id: '', ruangan_id: '', kelompok_aset_id: '', pic_id: '',
    // Step 3: Detail Teknis (dinamis per kategori)
    // Alat Ukur
    parameter_rentang_ukur: '', resolusi: '', akurasi_spesifikasi: '', satuan: '',
    peranti_lunak_versi: '', metode_kelayakan: '', no_sertifikat: '',
    tgl_kalibrasi: '', tgl_jatuh_tempo: '', interval_bulan: '',
    nilai_koreksi: '', ketidakpastian: '', status_kelayakan: 'Layak',
    // Alat Bantu
    fungsi_kegunaan: '', jenis_pemeriksaan_berkala: '', kriteria_pemeriksaan: '',
    tgl_pemeriksaan_terakhir: '', jadwal_karakterisasi_ulang: '',
    // Artefak Acuan
    jenis_deskripsi: '', karakteristik_yang_diacu: '', nilai_spesifikasi_karakterisasi: '',
    metode_karakterisasi: '', no_laporan_karakterisasi: '', tgl_karakterisasi_terakhir: '', kondisi_penyimpanan: '',
    // Komponen Pendukung
    sub_kategori: '', deskripsi_spesifikasi: '', sumber_pemasok: '', no_lot_batch_edisi: '',
    grade_mutu: '', satuan_kemasan: '', tgl_terima_terbit: '', tgl_kedaluwarsa: '',
    status_ketersediaan: 'Tersedia',
  });

  useEffect(() => {
    async function loadOptions() {
      try {
        const [l, r, k, u] = await Promise.allSettled([
          labsApi.getAll(), ruanganApi.getAll(), kelompokAssetApi.getAll(), usersApi.getAll()
        ]);
        if (l.status === 'fulfilled') setLabs(l.value.data || []);
        if (r.status === 'fulfilled') setRuangan(r.value.data || []);
        if (k.status === 'fulfilled') setKelompokAset(k.value.data || []);
        if (u.status === 'fulfilled') {
          const staffPIC = (u.value.data || []).filter((usr) => usr.pic === true || usr.pic === 1);
          setPics(staffPIC.length > 0 ? staffPIC : (u.value.data || []));
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

  function validateStep() {
    if (step === 0) {
      if (!form.nama_peralatan.trim()) { setError('Nama peralatan wajib diisi.'); return false; }
    }
    if (step === 1) {
      if (!form.ruangan_id) { setError('Ruangan wajib dipilih.'); return false; }
      if (!form.kelompok_aset_id) { setError('Kelompok aset wajib dipilih.'); return false; }
      if (!form.pic_id) { setError('PIC wajib dipilih.'); return false; }
    }
    if (step === 3 && !documentFile) {
      setError('Minimal satu dokumen peralatan wajib diunggah.'); return false;
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
    setSub(true);
    setError('');
    try {
      const payload = {
        nama_peralatan:        form.nama_peralatan,
        kategori_id:           Number(form.kategori_id),
        kelompok_aset_id:      Number(form.kelompok_aset_id),
        ruangan_id:            Number(form.ruangan_id),
        pic_id:                Number(form.pic_id),
        merek:                 form.merek,
        tipe_model:            form.tipe_model,
        nomor_seri:            form.nomor_seri,
        keterangan:            form.keterangan,
        status_alat:           form.status_alat,
        // Detail teknis berdasarkan kategori
        ...(form.kategori_id === 1 && {
          detail_alat_ukur: {
            parameter_rentang_ukur: form.parameter_rentang_ukur,
            resolusi:               form.resolusi,
            akurasi_spesifikasi:    form.akurasi_spesifikasi,
            satuan:                 form.satuan,
            no_sertifikat:          form.no_sertifikat,
            tgl_kalibrasi:          form.tgl_kalibrasi || null,
            tgl_jatuh_tempo:        form.tgl_jatuh_tempo || null,
            interval_bulan:         Number(form.interval_bulan) || 0,
            nilai_koreksi:          form.nilai_koreksi,
            ketidakpastian:         form.ketidakpastian,
            status_kelayakan:       form.status_kelayakan,
          }
        }),
        ...(form.kategori_id === 2 && {
          detail_alat_bantu: {
            fungsi_kegunaan:              form.fungsi_kegunaan,
            jenis_pemeriksaan_berkala:    form.jenis_pemeriksaan_berkala,
            kriteria_pemeriksaan:         form.kriteria_pemeriksaan,
            tgl_pemeriksaan_terakhir:     form.tgl_pemeriksaan_terakhir || null,
            tgl_jatuh_tempo:              form.tgl_jatuh_tempo || null,
            interval_bulan:               Number(form.interval_bulan) || 0,
          }
        }),
        ...(form.kategori_id === 3 && {
          detail_artefak_acuan: {
            jenis_deskripsi:                form.jenis_deskripsi,
            karakteristik_yang_diacu:       form.karakteristik_yang_diacu,
            nilai_spesifikasi_karakterisasi: form.nilai_spesifikasi_karakterisasi,
            metode_karakterisasi:           form.metode_karakterisasi,
            no_laporan_karakterisasi:       form.no_laporan_karakterisasi,
            tgl_karakterisasi_terakhir:     form.tgl_karakterisasi_terakhir || null,
            tgl_jatuh_tempo:                form.tgl_jatuh_tempo || null,
            kondisi_penyimpanan:            form.kondisi_penyimpanan,
          }
        }),
        ...(form.kategori_id === 4 && {
          detail_komponen_pendukung: {
            sub_kategori:          form.sub_kategori,
            deskripsi_spesifikasi: form.deskripsi_spesifikasi,
            sumber_pemasok:        form.sumber_pemasok,
            no_lot_batch_edisi:    form.no_lot_batch_edisi,
            grade_mutu:            form.grade_mutu,
            satuan_kemasan:        form.satuan_kemasan,
            tgl_terima_terbit:     form.tgl_terima_terbit || null,
            tgl_kedaluwarsa:       form.tgl_kedaluwarsa || null,
            status_ketersediaan:   form.status_ketersediaan,
          }
        }),
      };

      const res = await peralatanApi.create(payload);
      const equipmentId = res.id || res.data?.id;
      if (!equipmentId) throw new Error('Peralatan tersimpan, tetapi ID peralatan tidak diterima.');
      await dokumenApi.upload(equipmentId, documentFile);
      setSuccess({ nomor_aset: res.nomor_aset || res.data?.nomor_aset, id: equipmentId });
    } catch (err) {
      setError(err.message || 'Gagal menyimpan peralatan.');
    } finally {
      setSub(false);
    }
  }

  // ---- SUCCESS STATE ----
  if (success) {
    return (
      <div className="page-container fade-in-up" style={{ maxWidth: 500, margin: '0 auto' }}>
        <div className="card card-padded" style={{ textAlign: 'center', padding: 'var(--sp-10)' }}>
          <div style={{ width: 72, height: 72, background: 'var(--clr-success-100)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--sp-4)' }}>
            <CheckCircle size={36} style={{ color: 'var(--clr-success-500)' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>
            Peralatan Berhasil Ditambahkan!
          </h2>
          <p style={{ color: 'var(--clr-dark-500)', marginBottom: 'var(--sp-2)' }}>Nomor aset yang ditetapkan:</p>
          <code style={{ fontSize: 'var(--text-xl)', background: 'var(--clr-dark-100)', padding: 'var(--sp-2) var(--sp-4)', borderRadius: 'var(--radius-lg)' }}>
            {success.nomor_aset}
          </code>
          <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'center', marginTop: 'var(--sp-6)' }}>
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
    <div className="page-container fade-in-up">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => onNavigate('/peralatan')} id="btn-kembali">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title">Tambah Peralatan Baru</h1>
          <p className="page-subtitle">Langkah {step + 1} dari {STEPS.length}: {STEPS[step]}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="stepper" style={{ marginBottom: 'var(--sp-6)' }}>
        {STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <div className="step">
              <div className="step-indicator">
                <div className={`step-num ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`step-label ${i < step ? 'done' : i === step ? 'active' : ''}`}>{label}</span>
              </div>
            </div>
            {i < STEPS.length - 1 && <div className={`step-connector ${i < step ? 'done' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Card */}
      <div className="card card-padded" style={{ maxWidth: 860 }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--sp-5)' }}>
            {error}
          </div>
        )}

        {/* ---- STEP 0: Info Dasar ---- */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
            <h2 className="section-title">Informasi Dasar Peralatan</h2>

            <div className="form-group">
              <label className="form-label" htmlFor="input-nama">Nama Peralatan <span className="required">*</span></label>
              <input id="input-nama" className="form-input" placeholder="Contoh: Multimeter Digital" value={form.nama_peralatan} onChange={(e) => setField('nama_peralatan', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Kategori Peralatan <span className="required">*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-3)' }}>
                {KATEGORI_OPTIONS.map((k) => (
                  <div
                    key={k.id}
                    onClick={() => setField('kategori_id', k.id)}
                    id={`kat-${k.id}`}
                    style={{
                      padding: 'var(--sp-4)',
                      borderRadius: 'var(--radius-lg)',
                      border: `2px solid ${form.kategori_id === k.id ? 'var(--clr-primary-500)' : 'var(--clr-dark-200)'}`,
                      background: form.kategori_id === k.id ? 'var(--clr-primary-50)' : '#fff',
                      cursor: 'pointer',
                      transition: 'all var(--duration-fast)',
                    }}
                  >
                    <div style={{ fontWeight: 'var(--fw-semibold)', color: form.kategori_id === k.id ? 'var(--clr-primary-700)' : 'var(--clr-dark-900)', marginBottom: 2 }}>{k.label}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)' }}>{k.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="input-merek">Merek</label>
                <input id="input-merek" className="form-input" placeholder="Fluke, Hioki..." value={form.merek} onChange={(e) => setField('merek', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="input-tipe">Tipe/Model</label>
                <input id="input-tipe" className="form-input" placeholder="179, MR6000..." value={form.tipe_model} onChange={(e) => setField('tipe_model', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="input-seri">Nomor Seri</label>
                <input id="input-seri" className="form-input" placeholder="SN-12345678" value={form.nomor_seri} onChange={(e) => setField('nomor_seri', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-keterangan">Keterangan</label>
              <textarea id="input-keterangan" className="form-textarea" placeholder="Catatan tambahan..." value={form.keterangan} onChange={(e) => setField('keterangan', e.target.value)} style={{ minHeight: 80 }} />
            </div>
          </div>
        )}

        {/* ---- STEP 1: Lokasi & PIC ---- */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
            <h2 className="section-title">Lokasi & Penanggung Jawab</h2>
            {loadingOpts ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="select-lab">Laboratorium</label>
                  <select id="select-lab" className="form-select" value={form.lab_id} onChange={(e) => setField('lab_id', e.target.value)}>
                    <option value="">– Pilih Lab –</option>
                    {labs.map((l) => <option key={l.id} value={l.id}>{l.nama_labs} ({l.kode_labs})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="select-ruangan">Ruangan Uji <span className="required">*</span></label>
                  <select id="select-ruangan" className="form-select" value={form.ruangan_id} onChange={(e) => setField('ruangan_id', e.target.value)}>
                    <option value="">– Pilih Ruangan –</option>
                    {ruangan
                      .filter((r) => !form.lab_id || String(r.labs_id) === String(form.lab_id))
                      .map((r) => <option key={r.id} value={r.id}>{r.nama_ruangan} ({r.kode_ruangan}) — Lt. {r.lantai_ruangan}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="select-kelompok">Kelompok Aset <span className="required">*</span></label>
                  <select id="select-kelompok" className="form-select" value={form.kelompok_aset_id} onChange={(e) => setField('kelompok_aset_id', e.target.value)}>
                    <option value="">– Pilih Kelompok –</option>
                    {kelompokAset.map((k) => <option key={k.id} value={k.id}>{k.nama} ({k.kode})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="select-pic">Penanggung Jawab (PIC) <span className="required">*</span></label>
                  <select id="select-pic" className="form-select" value={form.pic_id} onChange={(e) => setField('pic_id', e.target.value)}>
                    <option value="">– Pilih PIC –</option>
                    {pics.map((u) => <option key={u.user_id} value={u.user_id}>{u.name} — {u.position}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        {/* ---- STEP 2: Detail Teknis (per kategori) ---- */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
            <h2 className="section-title">
              Detail Teknis — {KATEGORI_OPTIONS.find(k => k.id === form.kategori_id)?.label}
            </h2>
            <DetailTeknis form={form} setField={setField} kategoriId={form.kategori_id} />
          </div>
        )}

        {/* ---- STEP 3: Dokumen Wajib ---- */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
            <h2 className="section-title">Dokumen Peralatan</h2>
            <div className="alert alert-info">
              <FileText size={16} style={{ flexShrink: 0 }} />
              <span>Minimal satu file dokumen wajib disimpan bersama data peralatan. Contoh: sertifikat kalibrasi, manual, atau dokumen identifikasi.</span>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="input-dokumen">File Dokumen <span className="required">*</span></label>
              <input id="input-dokumen" className="form-input" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" onChange={(e) => { setDocumentFile(e.target.files?.[0] || null); setError(''); }} />
              {documentFile && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--clr-success-500)' }}><Upload size={14} /> {documentFile.name}</div>}
            </div>
          </div>
        )}

        {/* ---- STEP 4: Konfirmasi ---- */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <h2 className="section-title">Konfirmasi Data</h2>
            <ConfirmRow label="Nama Peralatan" value={form.nama_peralatan} />
            <ConfirmRow label="Kategori" value={KATEGORI_OPTIONS.find(k => k.id === form.kategori_id)?.label} />
            <ConfirmRow label="Merek / Tipe" value={[form.merek, form.tipe_model].filter(Boolean).join(' / ') || '–'} />
            <ConfirmRow label="No. Seri" value={form.nomor_seri || '–'} />
            <ConfirmRow label="Ruangan ID" value={form.ruangan_id || '–'} />
            <ConfirmRow label="Kelompok Aset ID" value={form.kelompok_aset_id || '–'} />
            <ConfirmRow label="PIC ID" value={form.pic_id || '–'} />
            <div className="alert alert-info" style={{ marginTop: 'var(--sp-3)' }}>
              <Package size={16} style={{ flexShrink: 0 }} />
              <span>Nomor aset akan otomatis digenerate oleh sistem setelah disimpan.</span>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--sp-8)', paddingTop: 'var(--sp-5)', borderTop: '1px solid var(--clr-dark-100)' }}>
          <button className="btn btn-secondary" onClick={prevStep} disabled={step === 0} id="btn-prev-step">
            <ArrowLeft size={16} /> Sebelumnya
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={nextStep} id="btn-next-step">
              Lanjutkan <ArrowRight size={16} />
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} id="btn-simpan-peralatan">
              {submitting ? <><div className="spinner" /> Menyimpan...</> : <><CheckCircle size={16} /> Simpan Peralatan</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Komponen Detail Teknis per Kategori
// ------------------------------------------------------------------
function DetailTeknis({ form, setField, kategoriId }) {
  const F = ({ id, label, type = 'text', value, onChange, placeholder }) => (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <input id={id} type={type} className="form-input" placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  );

  if (kategoriId === 1) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <div className="form-grid-2">
        <F id="d-rentang" label="Parameter & Rentang Ukur" value={form.parameter_rentang_ukur} onChange={e => setField('parameter_rentang_ukur', e.target.value)} placeholder="0-1000V AC/DC" />
        <F id="d-resolusi" label="Resolusi" value={form.resolusi} onChange={e => setField('resolusi', e.target.value)} placeholder="0.001" />
        <F id="d-akurasi" label="Akurasi/Spesifikasi" value={form.akurasi_spesifikasi} onChange={e => setField('akurasi_spesifikasi', e.target.value)} placeholder="±0.5%" />
        <F id="d-satuan" label="Satuan" value={form.satuan} onChange={e => setField('satuan', e.target.value)} placeholder="Volt, Ampere..." />
        <F id="d-sertifikat" label="No. Sertifikat" value={form.no_sertifikat} onChange={e => setField('no_sertifikat', e.target.value)} />
        <F id="d-koreksi" label="Nilai Koreksi" value={form.nilai_koreksi} onChange={e => setField('nilai_koreksi', e.target.value)} />
        <F id="d-ketidakpastian" label="Ketidakpastian" value={form.ketidakpastian} onChange={e => setField('ketidakpastian', e.target.value)} />
        <F id="d-interval" label="Interval Kalibrasi (bulan)" type="number" value={form.interval_bulan} onChange={e => setField('interval_bulan', e.target.value)} />
        <F id="d-tgl-kalibrasi" label="Tgl. Kalibrasi Terakhir" type="date" value={form.tgl_kalibrasi} onChange={e => setField('tgl_kalibrasi', e.target.value)} />
        <F id="d-tgl-jatuh" label="Tgl. Jatuh Tempo" type="date" value={form.tgl_jatuh_tempo} onChange={e => setField('tgl_jatuh_tempo', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="d-kelayakan">Status Kelayakan</label>
        <select id="d-kelayakan" className="form-select" value={form.status_kelayakan} onChange={e => setField('status_kelayakan', e.target.value)}>
          {['Layak', 'Terbatas', 'Tidak layak'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );

  if (kategoriId === 2) return (
    <div className="form-grid-2">
      <F id="d-fungsi" label="Fungsi/Kegunaan" value={form.fungsi_kegunaan} onChange={e => setField('fungsi_kegunaan', e.target.value)} />
      <F id="d-jenis-pemeriksaan" label="Jenis Pemeriksaan Berkala" value={form.jenis_pemeriksaan_berkala} onChange={e => setField('jenis_pemeriksaan_berkala', e.target.value)} />
      <F id="d-interval-ab" label="Interval (bulan)" type="number" value={form.interval_bulan} onChange={e => setField('interval_bulan', e.target.value)} />
      <F id="d-jatuh-ab" label="Tgl. Jatuh Tempo" type="date" value={form.tgl_jatuh_tempo} onChange={e => setField('tgl_jatuh_tempo', e.target.value)} />
      <F id="d-tgl-pemeriksaan" label="Tgl. Pemeriksaan Terakhir" type="date" value={form.tgl_pemeriksaan_terakhir} onChange={e => setField('tgl_pemeriksaan_terakhir', e.target.value)} />
      <div className="form-group" style={{ gridColumn: '1/-1' }}>
        <label className="form-label" htmlFor="d-kriteria">Kriteria Pemeriksaan</label>
        <textarea id="d-kriteria" className="form-textarea" value={form.kriteria_pemeriksaan} onChange={e => setField('kriteria_pemeriksaan', e.target.value)} style={{ minHeight: 80 }} />
      </div>
    </div>
  );

  if (kategoriId === 3) return (
    <div className="form-grid-2">
      <F id="d-jenis-aa" label="Jenis/Deskripsi" value={form.jenis_deskripsi} onChange={e => setField('jenis_deskripsi', e.target.value)} />
      <F id="d-karakteristik" label="Karakteristik yang Diacu" value={form.karakteristik_yang_diacu} onChange={e => setField('karakteristik_yang_diacu', e.target.value)} />
      <F id="d-nilai-spec" label="Nilai Spesifikasi Karakterisasi" value={form.nilai_spesifikasi_karakterisasi} onChange={e => setField('nilai_spesifikasi_karakterisasi', e.target.value)} />
      <F id="d-metode-kar" label="Metode Karakterisasi" value={form.metode_karakterisasi} onChange={e => setField('metode_karakterisasi', e.target.value)} />
      <F id="d-no-laporan" label="No. Laporan Karakterisasi" value={form.no_laporan_karakterisasi} onChange={e => setField('no_laporan_karakterisasi', e.target.value)} />
      <F id="d-tgl-kar" label="Tgl. Karakterisasi Terakhir" type="date" value={form.tgl_karakterisasi_terakhir} onChange={e => setField('tgl_karakterisasi_terakhir', e.target.value)} />
      <F id="d-jatuh-aa" label="Tgl. Jatuh Tempo" type="date" value={form.tgl_jatuh_tempo} onChange={e => setField('tgl_jatuh_tempo', e.target.value)} />
      <F id="d-kondisi" label="Kondisi Penyimpanan" value={form.kondisi_penyimpanan} onChange={e => setField('kondisi_penyimpanan', e.target.value)} />
    </div>
  );

  if (kategoriId === 4) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <div className="form-grid-2">
        <F id="d-subkat" label="Sub Kategori" value={form.sub_kategori} onChange={e => setField('sub_kategori', e.target.value)} />
        <F id="d-pemasok" label="Sumber/Pemasok" value={form.sumber_pemasok} onChange={e => setField('sumber_pemasok', e.target.value)} />
        <F id="d-lot" label="No. Lot/Batch/Edisi" value={form.no_lot_batch_edisi} onChange={e => setField('no_lot_batch_edisi', e.target.value)} />
        <F id="d-grade" label="Grade Mutu" value={form.grade_mutu} onChange={e => setField('grade_mutu', e.target.value)} />
        <F id="d-satuan-kemasan" label="Satuan Kemasan" value={form.satuan_kemasan} onChange={e => setField('satuan_kemasan', e.target.value)} />
        <F id="d-tgl-terima" label="Tgl. Terima/Terbit" type="date" value={form.tgl_terima_terbit} onChange={e => setField('tgl_terima_terbit', e.target.value)} />
        <F id="d-tgl-kadaluarsa" label="Tgl. Kedaluwarsa" type="date" value={form.tgl_kedaluwarsa} onChange={e => setField('tgl_kedaluwarsa', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="d-deskripsi-kp">Deskripsi/Spesifikasi</label>
        <textarea id="d-deskripsi-kp" className="form-textarea" value={form.deskripsi_spesifikasi} onChange={e => setField('deskripsi_spesifikasi', e.target.value)} style={{ minHeight: 80 }} />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="d-ketersediaan">Status Ketersediaan</label>
        <select id="d-ketersediaan" className="form-select" value={form.status_ketersediaan} onChange={e => setField('status_ketersediaan', e.target.value)}>
          {['Berlaku','Tersedia','Stok cukup','Stok menipis','Kedaluwarsa','Habis'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );

  return <p>Pilih kategori pada langkah sebelumnya.</p>;
}

function ConfirmRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--sp-4)', padding: 'var(--sp-3) 0', borderBottom: '1px solid var(--clr-dark-100)' }}>
      <div style={{ width: 180, flexShrink: 0, fontSize: 'var(--text-sm)', color: 'var(--clr-dark-500)' }}>{label}</div>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)', color: 'var(--clr-dark-900)' }}>{value}</div>
    </div>
  );
}
