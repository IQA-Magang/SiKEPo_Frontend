import React, { useState, useEffect } from 'react';
import { ruanganApi, userApi, kelompokAssetApi } from '../../utils/api';

const KATEGORI_OPTIONS = [
  { id: 1, label: 'Alat Ukur (Sheet 1)', desc: 'Peralatan uji dengan parameter metrologi & kalibrasi' },
  { id: 2, label: 'Alat Bantu (Sheet 2)', desc: 'Peralatan pendukung dengan pemeriksaan berkala' },
  { id: 3, label: 'Artefak Acuan (Sheet 3)', desc: 'Standar referensi dengan karakterisasi acuan' },
  { id: 4, label: 'Komponen Pendukung (Sheet 4)', desc: 'Material/komponen pendukung operasional' },
];

const STATUS_ALAT_OPTIONS = [
  { value: 'Aktif', label: 'Aktif (Siap Digunakan)' },
  { value: 'Dipinjam', label: 'Dipinjam' },
  { value: 'Dalam Kalibrasi', label: 'Dalam Kalibrasi' },
  { value: 'Rusak', label: 'Rusak' },
  { value: 'Dihapuskan', label: 'Dihapuskan' },
];

const EMPTY_FORM = {
  nomor_aset: '',
  nama_peralatan: '',
  merek: '',
  tipe_model: '',
  nomor_seri: '',
  kategori_id: 1,
  kelompok_aset_id: '',
  ruangan_id: '',
  pic_id: '',
  status_alat: 'Aktif',
  keterangan: '',
  foto: '',
  // Detail spesifik kategori
  parameter_rentang_ukur: '',
  resolusi: '',
  akurasi_spesifikasi: '',
  satuan: '',
  fungsi_kegunaan: ''
};

export default function EquipmentForm({ onNext, onCancel, initialData }) {
  const [data, setData] = useState(initialData || EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [ruanganList, setRuanganList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [kelompokAssetList, setKelompokAssetList] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      ruanganApi.getAll().catch(() => ({ data: [] })),
      userApi.getAll().catch(() => ({ data: [] })),
      kelompokAssetApi.getAll().catch(() => ({ data: [] }))
    ])
      .then(([rRes, uRes, kRes]) => {
        if (!isMounted) return;
        if (rRes?.data) setRuanganList(rRes.data);
        if (uRes?.data) {
          // Tampilkan semua staff atau user yang bisa menjadi PIC
          setUsersList(uRes.data);
        }
        if (kRes?.data) setKelompokAssetList(kRes.data);
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
    if (!data.ruangan_id) errs.ruangan_id = 'Lokasi ruangan wajib dipilih.';
    if (!data.kategori_id) errs.kategori_id = 'Kategori peralatan wajib dipilih (1-4).';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildCategoryDetail = (catId, formData) => {
    switch (catId) {
      case 1:
        return {
          parameter_rentang_ukur: formData.parameter_rentang_ukur || 'Rentang Standar',
          resolusi: formData.resolusi || '0.01',
          akurasi_spesifikasi: formData.akurasi_spesifikasi || '±0.01',
          satuan: formData.satuan || 'Unit',
          peranti_lunak_versi: 'v1.0',
          metode_kelayakan: 'Kalibrasi Berkala',
          no_sertifikat: 'CERT-' + Date.now(),
          interval_bulan: 12,
          fungsi_sbg_alat_standar: true,
          status_kelayakan: 'Layak'
        };
      case 2:
        return {
          fungsi_kegunaan: formData.fungsi_kegunaan || 'Peralatan bantu operasional laboratorium',
          peranti_lunak_versi: 'v1.0',
          jenis_pemeriksaan_berkala: 'Pemeriksaan fungsi',
          kriteria_pemeriksaan: 'Berfungsi normal',
          interval_bulan: 6,
          fungsi_sbg_alat_standar: false
        };
      case 3:
        return {
          jenis_deskripsi: 'Artefak acuan standar pengujian',
          karakteristik_yang_diacu: 'Standar referensi',
          nilai_spesifikasi_karakterisasi: 'Toleransi presisi',
          metode_karakterisasi: 'Perbandingan langsung',
          no_laporan_karakterisasi: 'LAP-' + Date.now(),
          interval_bulan: 12,
          kondisi_penyimpanan: 'Suhu 20°C ± 2°C'
        };
      case 4:
        return {
          sub_kategori: 'Komponen Pendukung',
          deskripsi_spesifikasi: 'Komponen penunjang pengujian',
          sumber_pemasok: 'Distributor Resmi',
          grade_mutu: 'A',
          satuan_kemasan: 'Unit',
          kondisi_penyimpanan: 'Ruang penyimpanan alat',
          status_ketersediaan: 'Tersedia'
        };
      default:
        return {};
    }
  };

  const handleNext = () => {
    if (validate()) {
      const catId = Number(data.kategori_id) || 1;
      const kelompokId = Number(data.kelompok_aset_id) || (kelompokAssetList[0]?.id ? Number(kelompokAssetList[0].id) : 1);
      const ruanganId = Number(data.ruangan_id) || (ruanganList[0]?.id ? Number(ruanganList[0].id) : 1);
      const picId = Number(data.pic_id) || (usersList[0]?.user_id ? Number(usersList[0].user_id) : 1);

      const cleanPayload = {
        nomor_aset: data.nomor_aset.trim(),
        nama_peralatan: data.nama_peralatan.trim(),
        kategori_id: catId,
        kelompok_aset_id: kelompokId,
        ruangan_id: ruanganId,
        pic_id: picId,
        merek: (data.merek || data.merk || '').trim(),
        tipe_model: (data.tipe_model || data.model || '').trim(),
        nomor_seri: (data.nomor_seri || '').trim(),
        foto: data.foto || '',
        status_alat: data.status_alat || 'Aktif',
        keterangan: (data.keterangan || '').trim(),
        detail: buildCategoryDetail(catId, data),

        // Kompatibilitas UI Frontend
        merk: (data.merek || data.merk || '').trim(),
        model: (data.tipe_model || data.model || '').trim(),
        kondisi: 'sesuai',
        status_kelayakan: 'aktif',
        metode: 'internal',
        jenis_pakai: 'tidak_habis_pakai',
        kategori_peralatan: KATEGORI_OPTIONS.find(k => k.id === catId)?.label || 'Alat Ukur'
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

          {/* Merek & Tipe/Model */}
          <div className="eq-form-row-2col">
            <div className="eq-field-group">
              <label className="eq-field-label">Merek</label>
              <input
                className="eq-field-input"
                type="text"
                placeholder="Contoh: EXFO"
                value={data.merek || data.merk || ''}
                onChange={(e) => setData({ ...data, merek: e.target.value, merk: e.target.value })}
              />
            </div>
            <div className="eq-field-group">
              <label className="eq-field-label">Tipe / Model</label>
              <input
                className="eq-field-input"
                type="text"
                placeholder="Contoh: FTB-1v2 Pro"
                value={data.tipe_model || data.model || ''}
                onChange={(e) => setData({ ...data, tipe_model: e.target.value, model: e.target.value })}
              />
            </div>
          </div>

          {/* Nomor Seri */}
          <div className="eq-field-group">
            <label className="eq-field-label">Nomor Seri</label>
            <input
              className="eq-field-input"
              type="text"
              placeholder="Contoh: SN-8921820"
              value={data.nomor_seri}
              onChange={set('nomor_seri')}
            />
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
                  {r.kode_ruangan} - {r.nama_ruangan} ({r.lantai_ruangan || 'Lantai 1'}{r.labs ? ` - ${r.labs.nama_labs}` : ''})
                </option>
              ))}
            </select>
            {errors.ruangan_id && <span className="eq-field-error">{errors.ruangan_id}</span>}
          </div>
        </div>

        {/* KOLOM KANAN */}
        <div>
          {/* Kategori ID (Sesuai Backend 1 - 4) */}
          <div className="eq-field-group">
            <label className="eq-field-label">
              Kategori Peralatan (Klasifikasi Backend) <span className="eq-required">*</span>
            </label>
            <select
              className={`eq-field-input ${errors.kategori_id ? 'error' : ''}`}
              value={data.kategori_id}
              onChange={(e) => setData({ ...data, kategori_id: Number(e.target.value) })}
            >
              {KATEGORI_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label} — {opt.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Kelompok Aset */}
          <div className="eq-field-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="eq-field-label" style={{ marginBottom: 0 }}>
                Kelompok Aset
              </label>
              <a
                href="#/admin/kelompok-aset"
                style={{ fontSize: '11px', color: 'var(--color-primary-red)', textDecoration: 'none', fontWeight: 600 }}
              >
                + Kelola Kelompok Aset
              </a>
            </div>
            <select
              className="eq-field-input"
              value={data.kelompok_aset_id}
              onChange={set('kelompok_aset_id')}
              disabled={loadingLookups}
            >
              <option value="">
                {loadingLookups
                  ? 'Memuat kelompok aset...'
                  : kelompokAssetList.length === 0
                    ? '-- Gunakan Kelompok Default (ID: 1) --'
                    : '-- Pilih Kelompok Aset --'}
              </option>
              {kelompokAssetList.map(g => (
                <option key={g.id} value={g.id}>
                  [{g.kode}] {g.nama} {g.lab ? `(${g.lab.nama_labs})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Petugas PIC */}
          <div className="eq-field-group">
            <label className="eq-field-label">Petugas PIC Penanggung Jawab</label>
            <select
              className="eq-field-input"
              value={data.pic_id}
              onChange={set('pic_id')}
              disabled={loadingLookups}
            >
              <option value="">
                {loadingLookups ? 'Memuat daftar petugas...' : '-- Pilih Petugas PIC --'}
              </option>
              {usersList.map(u => (
                <option key={u.user_id} value={u.user_id}>
                  {u.pic ? '★ [PIC] ' : ''}{u.name} ({u.role?.toUpperCase()} - {u.position || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          {/* Status Alat (Backend Enum) */}
          <div className="eq-field-group">
            <label className="eq-field-label">Status Alat</label>
            <select
              className="eq-field-input"
              value={data.status_alat}
              onChange={set('status_alat')}
            >
              {STATUS_ALAT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Keterangan */}
          <div className="eq-field-group">
            <label className="eq-field-label">Keterangan / Catatan</label>
            <input
              className="eq-field-input"
              type="text"
              placeholder="Contoh: Alat operasional pengujian serat optik"
              value={data.keterangan}
              onChange={set('keterangan')}
            />
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
