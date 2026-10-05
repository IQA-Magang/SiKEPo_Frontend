import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  ClipboardCheck,
  FileCheck,
  FileText,
  Hand,
  MapPin,
  Package,
  Send,
  User,
} from 'lucide-react';
import {
  getCurrentUser,
  peralatanApi,
  labsApi,
  getEquipmentId,
  formatPhotoUrl,
  STATUS_BADGE_CLASS,
} from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useNavigate } from '../../router/Router.jsx';

// TLKM13/IK/005 butir 8.2 — Permohonan peminjaman sekurang-lurangnya memuat:
// 1) nama peralatan, merek/tipe, nomor seri, dan nomor aset (identitas di luar form, dipilih dari daftar)
// 2) nama peminjam, laboratorium/unit asal, dan nama operator apabila berbeda dari peminjam
// 3) tujuan penggunaan, termasuk nomor SPK atau kegiatan terkait apabila ada
// 4) lokasi tujuan penggunaan dan penyimpanan
// 5) rencana tanggal keluar dan rencana tanggal kembali
// 6) kebutuhan kelengkapan, aksesori, dan dokumen pendukung

// Dokumen pendukung yang lazim dilampirkan (butir 7.g, 7.h, 8.3.d, dan Lampiran A butir 10)
const DOKUMEN_PENDUKUNG = [
  { value: 'sertifikat_kalibrasi', label: 'Salinan sertifikat kalibrasi / laporan verifikasi (TLKM13/F/003)' },
  { value: 'manual_pengoperasian', label: 'Instruksi atau manual pengoperasian peralatan' },
  { value: 'surat_keterangan_membawa', label: 'TLKM13/F/006 Surat Keterangan Membawa Peralatan' },
  { value: 'pengamatan_lingkungan', label: 'TLKM13/F/005 Pengamatan Lingkungan (bila dipersyaratkan)' },
  { value: 'berita_acara', label: 'Berita acara / perjanjian peminjaman' },
];

const emptyForm = (user) => ({
  // B. Peminjam dan Operator (8.2.b.2)
  nama_peminjam: user?.name || '',
  nama_lab_asal: '',
  nama_operator: '',
  // C. Tujuan Penggunaan (8.2.b.3)
  tujuan_penggunaan: '',
  nomor_spk: '',
  kegiatan_terkait: '',
  // D. Lokasi Tujuan (8.2.b.4)
  lokasi_penggunaan: '',
  lokasi_penyimpanan: '',
  di_luar_tth: false,
  // E. Rencana Tanggal (8.2.b.5)
  rencana_tanggal_keluar: '',
  rencana_tanggal_kembali: '',
  // F. Kelengkapan, Aksesori, dan Dokumen (8.2.b.6)
  kebutuhan_kelengkapan: '',
  kebutuhan_aksesori: '',
  dokumen_pendukung: [],
  catatan: '',
});

// Jatuh tempo pemeriksaan berikutnya pada TLKM13/F/008, dipakai untuk,butir 7.b.
function getNextInspectionDate(equipment, detail) {
  const date = detail?.tgl_jatuh_tempo
    || detail?.tgl_karakterisasi
    || detail?.tgl_kedaluwarsa
    || equipment?.tgl_jatuh_tempo
    || equipment?.tgl_karakterisasi;
  if (!date) return null;
  const parsed = new Date(`${String(date).slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function LoanRequest({ equipmentId = null, onNavigate }) {
  const routerNavigate = useNavigate();
  const navigate = onNavigate || routerNavigate;
  const { error } = useToast();
  const currentUser = getCurrentUser();

  const [form, setForm] = useState(() => emptyForm(currentUser));
  const [selectedId, setSelectedId] = useState(equipmentId || '');
  const [equipmentList, setEquipmentList] = useState([]);
  const [labs, setLabs] = useState([]);
  const [equipmentDetail, setEquipmentDetail] = useState({});
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  // Muat daftar peralatan dan unit asal; unit asal peminjam diisi otomatis dari akun.
  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const [res, labsRes] = await Promise.all([
          peralatanApi.getAll(),
          labsApi.getAll().catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;

        const labList = labsRes.data || [];
        setEquipmentList(res.data || []);
        setLabs(labList);

        const labId = currentUser?.labs_id ?? currentUser?.labs?.id;
        const labName = labList.find((lab) => String(lab.id) === String(labId))?.nama_labs;
        if (labName) setForm((prev) => ({ ...prev, nama_lab_asal: prev.nama_lab_asal || labName }));
      } catch (err) {
        if (!cancelled) error(err.message || 'Gagal memuat daftar peralatan.');
      } finally {
        if (!cancelled) setListLoading(false);
      }
    }

    loadOptions();
    return () => { cancelled = true; };
  }, [error]);

  // Butir 7.a: hanya peralatan yang berstatus layak pakai dan telah disetujui verifikasinya
  // yang dapat dipinjam. Peralatan karantina, rusak, atau sedang dikalibrasi tidak eligible.
  const eligibleEquipment = equipmentList.filter(
    (item) => item.status_verifikasi === 'Disetujui' && item.status_alat === 'Aktif'
  );
  const selectedEquipment = equipmentList.find(
    (item) => String(getEquipmentId(item)) === String(selectedId)
  ) || null;
  // Peralatan yang masuk lewat URL tetap tampil pada daftar walau tidak lagi eligible.
  const equipmentOptions = selectedEquipment && !eligibleEquipment.includes(selectedEquipment)
    ? [selectedEquipment, ...eligibleEquipment]
    : eligibleEquipment;

  // Muat jadwal pemeriksaan berikutnya untuk,butir 7.b (pemeriksaan kelayakan butir 8.3.a).
  useEffect(() => {
    if (!selectedEquipment?.nomor_aset) {
      setEquipmentDetail({});
      return undefined;
    }

    let cancelled = false;
    setDetailLoading(true);

    async function loadDetail() {
      try {
        const res = await peralatanApi.getByAssetNumber(selectedEquipment.nomor_aset);
        if (!cancelled) setEquipmentDetail(res?.data?.detail || {});
      } catch (err) {
        if (!cancelled) console.warn('Gagal memuat jadwal pemeriksaan peralatan:', err);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }

    loadDetail();
    return () => { cancelled = true; };
  }, [selectedEquipment]);

  function toggleDokumen(value) {
    setForm((prev) => ({
      ...prev,
      dokumen_pendukung: prev.dokumen_pendukung.includes(value)
        ? prev.dokumen_pendukung.filter((item) => item !== value)
        : [...prev.dokumen_pendukung, value],
    }));
  }

  // Tanggal minimum memakai tanggal lokal (WIB), bukan UTC, agar tidak menggeser satu hari.
  const now = new Date();
  const hariIni = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const nextInspection = getNextInspectionDate(selectedEquipment, equipmentDetail);
  const isExternal = form.di_luar_teth;
  // Butir 7.b: rencana tanggal kembali tidak boleh melampaui jatuh tempo pemeriksaan berikutnya.
  const returnBeyondDueDate = Boolean(
    nextInspection && form.rencana_tanggal_kembali
      && new Date(`${form.rencana_tanggal_kembali}T00:00:00`) > nextInspection
  );
  // Butir 7.h / 8.2.d: setiap pengeluaran dari lingkungan TTH wajib disertai TLKM13/F/006.
  const missingSuratKeterangan = isExternal
    && form.lokasi_penggunaan.trim() !== ''
    && !form.dokumen_pendukung.includes('surat_keterangan_membawa');

  function validate() {
    if (!selectedId) return 'Peralatan yang akan dipinjam wajib dipilih.';
    if (!form.nama_peminjam.trim()) return 'Nama peminjam wajib diisi.';
    if (!form.nama_lab_asal.trim()) return 'Laboratorium/unit asal peminjam wajib diisi.';
    if (!form.tujuan_penggunaan.trim()) return 'Tujuan penggunaan wajib diisi.';
    if (!form.lokasi_penggunaan.trim()) return 'Lokasi tujuan penggunaan wajib diisi.';
    if (!form.lokasi_penyimpanan.trim()) return 'Lokasi penyimpanan wajib diisi.';
    if (!form.rencana_tanggal_keluar) return 'Rencana tanggal keluar wajib diisi.';
    if (!form.rencana_tanggal_kembali) return 'Rencana tanggal kembali wajib diisi.';
    if (form.rencana_tanggal_kembali < form.rencana_tanggal_keluar) {
      return 'Rencana tanggal kembali tidak boleh lebih awal dari rencana tanggal keluar.';
    }
    // Butir 8.2.a: permohonan diajukan sebelum rencana penggunaan, dengan memperhitungkan
    // waktu pemeriksaan, persetujuan, dan persiapan peralatan (butir 8.3 dan 8.4).
    if (form.rencana_tanggal_keluar < hariIni) {
      return 'Rencana tanggal keluar tidak boleh di masa lalu. Ajukan permohonan sebelum rencana penggunaan.';
    }
    if (returnBeyondDueDate) {
      return `Rencana tanggal kembali tidak boleh melampaui tanggal jatuh tempo pemeriksaan berikutnya (${nextInspection.toLocaleDateString('id-ID')}). Pemeriksaan berkala harus dilaksanakan terlebih dahulu atau gunakan peralatan lain yang layak.`;
    }
    if (missingSuratKeterangan) {
      return 'Peminjaman eksternal wajib menyertakan TLKM13/F/006 Surat Keterangan Membawa Peralatan.';
    }
    return '';
  }

  function submitPermohonan(event) {
    event.preventDefault();
    const invalidReason = validate();
    if (invalidReason) {
      error(invalidReason);
      return;
    }
    // Endpoint peminjaman belum tersedia di backend sehingga permohonan belum dapat disimpan.
    error('Penyimpanan permohonan peminjaman belum tersedia. Modul masih dalam pengembangan.');
  }

  const equipmentName = selectedEquipment?.nama_peralatan || 'Belum dipilih';
  const backPath = selectedId ? `/peralatan/detail/${selectedId}` : '/peralatan';

  return (
    <div className="page-container fade-in-up">
      {/* Header navigasi */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--sp-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={() => navigate(backPath)}
            title="Kembali"
            aria-label="Kembali"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">Form Pengajuan Peminjaman Peralatan</h1>
            <p className="page-subtitle">
              TLKM13/IK/005 butir 8.2 — permohonan diajukan peminjam kepada PIC peralatan sebelum rencana penggunaan.
            </p>
          </div>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(backPath)}>
          ← Kembali
        </button>
      </div>

      {/* Informasi Peralatan */}
      {listLoading ? (
        <div className="card" style={{ padding: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
          <div className="skeleton" style={{ height: 48 }} />
        </div>
      ) : selectedEquipment ? (
        <div
          className="card"
          style={{
            padding: 'var(--sp-4)',
            marginBottom: 'var(--sp-5)',
            borderLeft: '4px solid var(--clr-primary-500, #EE2E24)',
            background: 'var(--clr-dark-50, #F8FAFC)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--sp-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
              {formatPhotoUrl(selectedEquipment.foto) ? (
                <img
                  src={formatPhotoUrl(selectedEquipment.foto)}
                  alt={selectedEquipment.nama_peralatan}
                  style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 'var(--radius-md, 8px)', border: '1px solid var(--clr-dark-200, #E2E8F0)' }}
                />
              ) : (
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-md, 8px)',
                    background: 'var(--clr-primary-100, #FEE2E2)',
                    color: 'var(--clr-primary-600, #C92B21)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Package size={22} />
                </div>
              )}
              <div>
                <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--text-base)', color: 'var(--clr-dark-900, #0F172A)' }}>
                  {selectedEquipment.nama_peralatan}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500, #64748B)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>No. Aset: <strong>{selectedEquipment.nomor_aset || '-'}</strong></span>
                  <span>No. Seri: <strong>{selectedEquipment.nomor_seri || '-'}</strong></span>
                  {selectedEquipment.merek && <span>Merek/Tipe: {selectedEquipment.merek} {selectedEquipment.tipe_model || ''}</span>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`badge ${STATUS_BADGE_CLASS[selectedEquipment.status_alat] || 'badge-gray'}`}>
                Status: {selectedEquipment.status_alat || '-'}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 'var(--sp-3)', fontSize: 'var(--text-xs)', color: 'var(--clr-dark-600, #475569)' }}>
            {detailLoading ? (
              'Memuat jadwal pemeriksaan berikutnya...'
            ) : nextInspection ? (
              <>
                Jatuh tempo pemeriksaan berikutnya (TLKM13/F/008):{' '}
                <strong style={{ color: returnBeyondDueDate ? '#b91c1c' : 'var(--clr-dark-900, #0F172A)' }}>
                  {nextInspection.toLocaleDateString('id-ID')}
                </strong>
                {' — rencana tanggal kembali tidak boleh melampaui tanggal ini (butir 7.b).'}
              </>
            ) : (
              'Jadwal pemeriksaan berikutnya belum tersedia pada TLKM13/F/008.'
            )}
          </div>
        </div>
      ) : null}

      {/* Form Pengajuan Peminjaman */}
      <form className="card card-padded" onSubmit={submitPermohonan}>
        {/* A. Identitas Peralatan — butir 8.2.b.1 */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={18} style={{ color: 'var(--clr-primary-500)' }} />
            A. Identitas Peralatan
          </h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="select-peralatan">Peralatan yang Dipinjam <span className="required">*</span></label>
              <select
                id="select-peralatan"
                className="form-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={Boolean(equipmentId)}
                required
              >
                <option value="">-- Pilih Peralatan Layak Pakai --</option>
                {equipmentOptions.map((item) => (
                  <option key={getEquipmentId(item)} value={String(getEquipmentId(item))}>
                    {item.nama_peralatan} — {item.nomor_aset || 'tanpa no. aset'}
                  </option>
                ))}
              </select>
              <span className="form-hint">Hanya peralatan berstatus Aktif dan terverifikasi yang dapat dipinjam (butir 7.a).</span>
            </div>

            <div className="form-group">
              <label className="form-label">Nama Peralatan</label>
              <input className="form-input" type="text" value={equipmentName} readOnly disabled />
            </div>

            <div className="form-group">
              <label className="form-label">Merek / Tipe</label>
              <input
                className="form-input"
                type="text"
                value={[selectedEquipment?.merek, selectedEquipment?.tipe_model].filter(Boolean).join(' — ') || '-'}
                readOnly
                disabled
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nomor Seri</label>
              <input
                className="form-input"
                type="text"
                value={selectedEquipment?.nomor_seri || '-'}
                readOnly
                disabled
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nomor Aset</label>
              <input
                className="form-input"
                type="text"
                value={selectedEquipment?.nomor_aset || '-'}
                readOnly
                disabled
              />
            </div>
          </div>
        </div>

        {/* B. Peminjam dan Operator — butir 8.2.b.2 */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} style={{ color: 'var(--clr-primary-500)' }} />
            B. Peminjam dan Operator
          </h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="input-nama-peminjam">Nama Peminjam <span className="required">*</span></label>
              <input
                id="input-nama-peminjam"
                className="form-input"
                type="text"
                value={form.nama_peminjam}
                onChange={(e) => setForm({ ...form, nama_peminjam: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="select-lab-asal">Laboratorium / Unit Asal <span className="required">*</span></label>
              <select
                id="select-lab-asal"
                className="form-select"
                value={form.nama_lab_asal}
                onChange={(e) => setForm({ ...form, nama_lab_asal: e.target.value })}
                required
              >
                <option value="">-- Pilih Unit Asal --</option>
                {labs.map((lab) => (
                  <option key={lab.id} value={lab.nama_labs}>{lab.nama_labs}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="input-nama-operator">
                Nama Operator bila berbeda dengan peminjam
              </label>
              <input
                id="input-nama-operator"
                className="form-input"
                type="text"
                placeholder="Isi bila peminjam bukan operator yang mengoperasikan peralatan"
                value={form.nama_operator}
                onChange={(e) => setForm({ ...form, nama_operator: e.target.value })}
              />
              <span className="form-hint">
                Sesuai butir 7.d — peralatan hanya dioperasikan personel yang kompeten dan berwenang.
              </span>
            </div>
          </div>
        </div>

        {/* C. Tujuan Penggunaan — butir 8.2.b.3 */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardCheck size={18} style={{ color: 'var(--clr-primary-500)' }} />
            C. Tujuan Penggunaan
          </h3>
          <div className="form-group">
            <label className="form-label" htmlFor="input-tujuan">Tujuan Penggunaan <span className="required">*</span></label>
            <textarea
              id="input-tujuan"
              className="form-textarea"
              rows={3}
              placeholder="Uraikan kegiatan yang akan menggunakan peralatan tersebut..."
              value={form.tujuan_penggunaan}
              onChange={(e) => setForm({ ...form, tujuan_penggunaan: e.target.value })}
              required
            />
          </div>
          <div className="form-grid-2" style={{ marginTop: 'var(--sp-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="input-nomor-spk">Nomor SPK</label>
              <input
                id="input-nomor-spk"
                className="form-input"
                type="text"
                placeholder="Kosongkan bila tidak terkait SPK"
                value={form.nomor_spk}
                onChange={(e) => setForm({ ...form, nomor_spk: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-kegiatan-terkait">Kegiatan Terkait</label>
              <input
                id="input-kegiatan-terkait"
                className="form-input"
                type="text"
                placeholder="Uraian kegiatan atau jenis pekerjaan"
                value={form.kegiatan_terkait}
                onChange={(e) => setForm({ ...form, kegiatan_terkait: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* D. Lokasi Tujuan — butir 8.2.b.4 */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} style={{ color: 'var(--clr-primary-500)' }} />
            D. Lokasi Tujuan Penggunaan dan Penyimpanan
          </h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="input-lokasi-penggunaan">Lokasi Penggunaan <span className="required">*</span></label>
              <input
                id="input-lokasi-penggunaan"
                className="form-input"
                type="text"
                placeholder="Lab tujuan, lokasi pelanggan, atau lokasi lapangan"
                value={form.lokasi_penggunaan}
                onChange={(e) => setForm({ ...form, lokasi_penggunaan: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-lokasi-penyimpanan">Lokasi Penyimpanan <span className="required">*</span></label>
              <input
                id="input-lokasi-penyimpanan"
                className="form-input"
                type="text"
                placeholder="Tempat peralatan disimpan selama dan setelah peminjaman"
                value={form.lokasi_penyimpanan}
                onChange={(e) => setForm({ ...form, lokasi_penyimpanan: e.target.value })}
                required
              />
            </div>
          </div>

          <label className="checkbox-label" style={{ marginTop: 'var(--sp-3)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <input
              type="checkbox"
              checked={form.di_luar_tth}
              onChange={(e) => setForm({ ...form, di_luar_tth: e.target.checked })}
              style={{ marginTop: 3 }}
            />
            <span>
              Peralatan Akan Dibawa keluar Lingkungan TTH (peminjaman eksternal).
              <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500, #64748B)' }}>
                Peminjaman eksternal wajib disertai TLKM13/F/006 dan kondisi lingkungan lokasi tujuan diperiksa (butir 7.h, 8.2.d, dan 8.3.d).
              </span>
            </span>
          </label>
        </div>

        {/* E. Rencana Tanggal — butir 8.2.b.5 */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarClock size={18} style={{ color: 'var(--clr-primary-500)' }} />
            E. Rencana Tanggal Keluar dan Kembali
          </h3>
          <p className="page-subtitle" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--sp-3)' }}>
            Ajukan dengan memperhitungkan waktu pemeriksaan, persetujuan, dan persiapan peralatan (butir 8.2.a).
          </p>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="input-tanggal-keluar">Rencana Tanggal Keluar <span className="required">*</span></label>
              <input
                id="input-tanggal-keluar"
                className="form-input"
                type="date"
                min={hariIni}
                value={form.rencana_tanggal_keluar}
                onChange={(e) => setForm({ ...form, rencana_tanggal_keluar: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-tanggal-kembali">Rencana Tanggal Kembali <span className="required">*</span></label>
              <input
                id="input-tanggal-kembali"
                className="form-input"
                type="date"
                min={form.rencana_tanggal_keluar || hariIni}
                value={form.rencana_tanggal_kembali}
                onChange={(e) => setForm({ ...form, rencana_tanggal_kembali: e.target.value })}
                required
              />
              {nextInspection && (
                <span className="form-hint" style={{ color: returnBeyondDueDate ? '#b91c1c' : undefined }}>
                  Tidak boleh melewati {nextInspection.toLocaleDateString('id-ID')} (butir 7.b).
                </span>
              )}
            </div>
          </div>
        </div>

        {/* F. Kelengkapan, Aksesori, dan Dokumen — butir 8.2.b.6 */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} style={{ color: 'var(--clr-primary-500)' }} />
            F. Kebutuhan Kelengkapan, Aksesori, dan Dokumen
          </h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="input-kelengkapan">Kelengkapan yang Dibutuhkan</label>
              <textarea
                id="input-kelengkapan"
                className="form-textarea"
                rows={2}
                placeholder="Contoh: selang, adaptor, probe,ricket ukur..."
                value={form.kebutuhan_kelengkapan}
                onChange={(e) => setForm({ ...form, kebutuhan_kelengkapan: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-aksesori">Aksesori / Catu Daya / Baterai</label>
              <textarea
                id="input-aksesori"
                className="form-textarea"
                rows={2}
                placeholder="Contoh: 2 unit kabel, adaptor AC, baterai cadangan..."
                value={form.kebutuhan_aksesori}
                onChange={(e) => setForm({ ...form, kebutuhan_aksesori: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 'var(--sp-4)' }}>
            <label className="form-label" style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-xs)' }}>
              Dokumen Pendukung yang Disertakan
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {DOKUMEN_PENDUKUNG.map((doc) => (
                <label
                  key={doc.value}
                  className="checkbox-label"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: 'var(--sp-2) var(--sp-3)',
                    borderRadius: 'var(--radius-md, 6px)',
                    fontSize: 'var(--text-sm)',
                    background: form.dokumen_pendukung.includes(doc.value) ? '#f0fdf4' : 'transparent',
                    border: `1px solid ${form.dokumen_pendukung.includes(doc.value) ? '#bbf7d0' : 'transparent'}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.dokumen_pendukung.includes(doc.value)}
                    onChange={() => toggleDokumen(doc.value)}
                    style={{ marginTop: 3 }}
                  />
                  <span>{doc.label}</span>
                </label>
              ))}
            </div>
            {missingSuratKeterangan && (
              <span className="form-error-msg" style={{ display: 'block', marginTop: 6 }}>
                Peminjaman eksternal wajib menyertakan TLKM13/F/006 (butir 7.h).
              </span>
            )}
          </div>

          <div className="form-group" style={{ marginTop: 'var(--sp-4)' }}>
            <label className="form-label" htmlFor="input-catatan">Catatan Tambahan</label>
            <textarea
              id="input-catatan"
              className="form-textarea"
              rows={3}
              placeholder="Keterangan lain yang perlu diketahui PIC peralatan..."
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            />
          </div>
        </div>

        {/* G. Tata Kelola Permohonan — butir 8.2.c dan 8.2.d */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileCheck size={18} style={{ color: 'var(--clr-primary-500)' }} />
            G. Tata Kelola Permohonan
          </h3>
          <div
            className="alert alert-info"
            style={{ display: 'block', fontSize: 'var(--text-xs)', lineHeight: 1.7 }}
          >
            <div><Hand size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />Setelah diajukan, PIC peralatan memeriksa kelayakan dan ketersediaan (butir 8.3) sebelum meneruskan kepada pemberi persetujuan.</div>
            <div>Permohonan dicatat oleh PIC pada TLKM13/F/010 Logbook Peralatan (butir 8.2.c).</div>
            <div>
              {isExternal
                ? 'Karena peminjaman eksternal, peminjam bersama PIC menyiapkan TLKM13/F/006 Surat Keterangan Membawa Peralatan (butir 8.2.d).'
                : 'Peminjaman internal antar laboratorium di dalam lingkungan TTH tidak memerlukan TLKM13/F/006.'}
            </div>
            <div>Peralatan hanya diserahkan setelah persetujuan diperoleh (butir 8.3.f).</div>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--sp-3)',
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexWrap: 'wrap',
            borderTop: '1px solid var(--clr-dark-200, #E2E8F0)',
            paddingTop: 'var(--sp-4)',
          }}
        >
          <span style={{ marginRight: 'auto', fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500, #64748B)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <BadgeCheck size={14} /> Penyimpanan modul peminjaman belum tersedia
          </span>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(backPath)}>
            Batal
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled
            id="btn-ajukan-peminjaman"
            title="Modul peminjaman masih dalam pengembangan"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Send size={16} />
            Ajukan Peminjaman
          </button>
        </div>
      </form>
    </div>
  );
}