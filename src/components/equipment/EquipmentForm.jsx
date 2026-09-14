import React, { useState, useEffect } from 'react';
import { ruanganApi, userApi } from '../../utils/api';

const BASE_KATEGORI_OPTIONS = [
  { value: 'peralatan', label: 'Peralatan Utama' },
  { value: 'Peralatan bantu', label: 'Peralatan Bantu' },
  { value: 'referensi uji', label: 'Referensi Uji' },
  { value: 'golden sample', label: 'Golden Sample' },
  { value: 'Komponen pendukung', label: 'Komponen Pendukung' },
];

const KONDISI_OPTIONS = [
  { value: 'sesuai', label: 'Sesuai (Baik & Normal)' },
  { value: 'tidak_sesuai', label: 'Tidak Sesuai (Rusak / Butuh Perbaikan)' },
  { value: 'tidak_berlaku', label: 'Tidak Berlaku' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending (Menunggu Verifikasi)' },
  { value: 'aktif', label: 'Aktif (Siap Operasional)' },
  { value: 'ditolak', label: 'Ditolak' },
  { value: 'tidak_aktif', label: 'Tidak Aktif' },
];

const METODE_OPTIONS = [
  { value: 'internal', label: 'Internal TTH' },
  { value: 'eksternal', label: 'Eksternal (Pihak Ketiga)' },
];

const JENIS_PAKAI_OPTIONS = [
  { value: 'tidak_habis_pakai', label: 'Tidak Habis Pakai' },
  { value: 'habis_pakai', label: 'Habis Pakai' },
];

const EMPTY_FORM = {
  nomor_aset: '',
  nama_peralatan: '',
  merk: '',
  model: '',
  nomor_seri: '',
  ruangan_id: '',
  pic_id: '',
  kategori_peralatan: 'peralatan',
  kondisi: 'sesuai',
  status_kelayakan: 'pending',
  metode: 'internal',
  jenis_pakai: 'tidak_habis_pakai',
};

export default function EquipmentForm({ onNext, onCancel, initialData }) {
  const [data, setData] = useState(initialData || EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [ruanganList, setRuanganList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [kategoriOptions, setKategoriOptions] = useState(BASE_KATEGORI_OPTIONS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sikepo_custom_categories');
      if (stored) {
        const custom = JSON.parse(stored);
        const customOpts = custom.map(c => ({
          value: c.value,
          label: `${c.nama} (Kustom)`
        }));
        setKategoriOptions([...BASE_KATEGORI_OPTIONS, ...customOpts]);
      }
    } catch (e) {
      console.warn('Gagal memuat kategori custom:', e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([ruanganApi.getAll(), userApi.getAll()])
      .then(([rRes, uRes]) => {
        if (!isMounted) return;
        if (rRes?.data) setRuanganList(rRes.data);
        // PIC hanya Staff yang sudah ditetapkan sebagai PIC (pic=true), Admin tidak bisa jadi PIC
        if (uRes?.data) {
          const picStaff = uRes.data.filter(u =>
            u.role?.toLowerCase() === 'staff' && Boolean(u.pic)
          );
          setUsersList(picStaff);
        }
      })
      .catch((err) => console.warn('Failed to load form lookups:', err))
      .finally(() => {
        if (isMounted) setLoadingLookups(false);
      });

    return () => { isMounted = false; };
  }, []);


  const set = (key) => (e) => setData(prev => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!data.nomor_aset?.trim()) errs.nomor_aset = 'Nomor aset wajib diisi.';
    if (!data.nama_peralatan?.trim()) errs.nama_peralatan = 'Nama peralatan wajib diisi.';
    if (!data.nomor_seri?.trim()) errs.nomor_seri = 'Nomor seri wajib diisi untuk setiap unit alat.';
    if (!data.ruangan_id) errs.ruangan_id = 'Lokasi ruangan wajib dipilih.';
    if (!data.kategori_peralatan) errs.kategori_peralatan = 'Kategori peralatan wajib dipilih.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      // Clean and cast data before sending to next step
      const { jumlah: _jumlah, ...formWithoutQuantity } = data;
      const cleanPayload = {
        ...formWithoutQuantity,
        nomor_aset: data.nomor_aset.trim(),
        nama_peralatan: data.nama_peralatan.trim(),
        merk: data.merk.trim(),
        model: data.model.trim(),
        nomor_seri: data.nomor_seri.trim(),
        ruangan_id: Number(data.ruangan_id),
        pic_id: data.pic_id ? Number(data.pic_id) : null,
      };
      onNext(cleanPayload);
    }
  };

  return (
    <div>
      <div className="eq-form-grid">
        {/* KOLOM KIRI */}
        <div>
          {/* Nomor Aset */}
          <div className="eq-field-group">
            <label className="eq-field-label">
              Nomor Aset <span className="eq-required">*</span>
            </label>
            <input
              className={`eq-field-input ${errors.nomor_aset ? 'error' : ''}`}
              type="text"
              placeholder="Contoh: AST-001 / TTH-OTDR-001"
              value={data.nomor_aset}
              onChange={set('nomor_aset')}
            />
            {errors.nomor_aset && <span className="eq-field-error">{errors.nomor_aset}</span>}
          </div>

          {/* Nama Peralatan */}
          <div className="eq-field-group">
            <label className="eq-field-label">
              Nama Peralatan <span className="eq-required">*</span>
            </label>
            <input
              className={`eq-field-input ${errors.nama_peralatan ? 'error' : ''}`}
              type="text"
              placeholder="Contoh: OTDR EXFO FTB-1v2 Pro"
              value={data.nama_peralatan}
              onChange={set('nama_peralatan')}
            />
            {errors.nama_peralatan && <span className="eq-field-error">{errors.nama_peralatan}</span>}
          </div>

          {/* Merek & Model */}
          <div className="eq-form-row-2col">
            <div className="eq-field-group">
              <label className="eq-field-label">Merek</label>
              <input
                className="eq-field-input"
                type="text"
                placeholder="Contoh: EXFO"
                value={data.merk}
                onChange={set('merk')}
              />
            </div>
            <div className="eq-field-group">
              <label className="eq-field-label">Tipe / Model</label>
              <input
                className="eq-field-input"
                type="text"
                placeholder="Contoh: FTB-1v2 Pro"
                value={data.model}
                onChange={set('model')}
              />
            </div>
          </div>

          {/* Nomor Seri: satu entri hanya untuk satu unit alat */}
          <div className="eq-field-group">
            <div className="eq-field-group">
              <label className="eq-field-label">Nomor Seri <span className="eq-required">*</span></label>
              <input
                className={`eq-field-input ${errors.nomor_seri ? 'error' : ''}`}
                type="text"
                placeholder="Contoh: SN-8921820"
                value={data.nomor_seri}
                onChange={set('nomor_seri')}
              />
              {errors.nomor_seri && <span className="eq-field-error">{errors.nomor_seri}</span>}
            </div>
          </div>

          {/* Ruangan Penempatan */}
          <div className="eq-field-group">
            <label className="eq-field-label">
              Ruangan Penempatan <span className="eq-required">*</span>
            </label>
            <select
              className={`eq-field-input ${errors.ruangan_id ? 'error' : ''}`}
              value={data.ruangan_id}
              onChange={set('ruangan_id')}
              disabled={loadingLookups}
            >
              <option value="">-- {loadingLookups ? 'Memuat ruangan...' : 'Pilih Ruangan'} --</option>
              {ruanganList.map(r => (
                <option key={r.id} value={r.id}>
                  {r.kode_ruangan} - {r.nama_ruangan} {r.labs ? `(${r.labs.nama_labs})` : ''}
                </option>
              ))}
            </select>
            {errors.ruangan_id && <span className="eq-field-error">{errors.ruangan_id}</span>}
          </div>
        </div>

        {/* KOLOM KANAN */}
        <div>
          {/* Kelompok peralatan menggunakan field API kategori_peralatan */}
          <div className="eq-field-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="eq-field-label" style={{ marginBottom: 0 }}>
                Kelompok Peralatan <span className="eq-required">*</span>
              </label>
              <a
                href="#/admin/kelompok-peralatan"
                style={{ fontSize: '11px', color: 'var(--color-primary-red)', textDecoration: 'none', fontWeight: 600 }}
              >
                + Kelola Kelompok
              </a>
            </div>
            <select
              className={`eq-field-input ${errors.kategori_peralatan ? 'error' : ''}`}
              value={data.kategori_peralatan}
              onChange={set('kategori_peralatan')}
            >
              {kategoriOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.kategori_peralatan && <span className="eq-field-error">{errors.kategori_peralatan}</span>}
          </div>

          {/* Kondisi & Status Kelayakan (Enum Backend) */}
          <div className="eq-form-row-2col">
            <div className="eq-field-group">
              <label className="eq-field-label">Kondisi Alat</label>
              <select
                className="eq-field-input"
                value={data.kondisi}
                onChange={set('kondisi')}
              >
                {KONDISI_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="eq-field-group">
              <label className="eq-field-label">Status Kelayakan</label>
              <select
                className="eq-field-input"
                value={data.status_kelayakan}
                onChange={set('status_kelayakan')}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Metode & Jenis Pakai (Enum Backend) */}
          <div className="eq-form-row-2col">
            <div className="eq-field-group">
              <label className="eq-field-label">Metode Penggunaan</label>
              <select
                className="eq-field-input"
                value={data.metode}
                onChange={set('metode')}
              >
                {METODE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="eq-field-group">
              <label className="eq-field-label">Jenis Pakai</label>
              <select
                className="eq-field-input"
                value={data.jenis_pakai}
                onChange={set('jenis_pakai')}
              >
                {JENIS_PAKAI_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Petugas PIC */}
          <div className="eq-field-group">
            <label className="eq-field-label">Petugas PIC Penanggung Jawab (Opsional)</label>
            <select
              className="eq-field-input"
              value={data.pic_id}
              onChange={set('pic_id')}
              disabled={loadingLookups}
            >
              <option value="">
                {loadingLookups
                  ? 'Memuat daftar PIC...'
                  : usersList.length === 0
                    ? 'Belum ada Staff PIC yang ditetapkan'
                    : '-- Pilih Petugas PIC --'}
              </option>
              {usersList.map(u => (
                <option key={u.user_id} value={u.user_id}>
                  ★ {u.name} ({u.position || 'Staff'})
                </option>
              ))}
            </select>
            <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', display: 'block' }}>
              Hanya staff yang ditetapkan sebagai PIC oleh Admin yang ditampilkan di sini.
              {usersList.length === 0 && !loadingLookups && (
                <> Tetapkan PIC di menu <strong>Pengaturan → Penetapan PIC</strong>.</>
              )}
            </span>
          </div>

        </div>
      </div>

      <div className="eq-form-actions">
        <button className="eq-btn-cancel" type="button" onClick={onCancel}>Batal</button>
        <button className="eq-btn-next" type="button" onClick={handleNext}>Simpan &amp; Lanjut →</button>
      </div>
    </div>
  );
}
