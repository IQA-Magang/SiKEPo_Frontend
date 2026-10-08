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
  peminjamanApi,
  getEquipmentId,
  formatPhotoUrl,
  STATUS_BADGE_CLASS,
} from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useNavigate } from '../../router/Router.jsx';

// Prosedur Operasional — Peminjam mengajukan permohonan kepada Pengelola
// peralatan dengan menyebutkan:
// 1) peralatan yang dipinjam
// 2) tujuan penggunaan
// 3) lokasi penggunaan
// 4) rencana tanggal keluar dan kembali yang sudah diketahui oleh atasan Peminjam

// Identitas peminjam mengikuti butir 3.c (Peminjam adalah personel TTH) dan butir 6.b
// (peminjaman adalah penggunaan di luar lokasi tercatat). Butir 7.b menegaskan peminjam
// harus personel TTH yang kompeten dan berwenang mengoperasikan peralatan.

// Dokumen pendukung (butir 7.f dan 8.1.e)
const DOKUMEN_PENDUKUNG = [
  { value: 'logbook', label: 'Logbook Peralatan — disiapkan dan dibawa bersama peralatan' },
  { value: 'surat_keterangan_membawa', label: 'Surat Keterangan Membawa Peralatan — wajib untuk peminjaman eksternal' },
];

const emptyForm = (user) => ({
  // B. Peminjam (butir 3.c & dokumen peminjaman-peralatan.md)
  nama_peminjam: user?.name || '',
  nama_lab_asal: '',
  atasan_peminjam: '',
  nama_operator: '',
  // C. Tujuan Penggunaan (butir 8.1.a.2)
  tujuan_penggunaan: '',
  nomor_spk: '',
  // D. Lokasi Penggunaan (butir 8.1.a.3)
  lokasi_penggunaan: '',
  is_eksternal: false,
  di_luar_tth: false,
  // E. Rencana Tanggal (butir 8.1.a.4)
  rencana_tanggal_keluar: '',
  rencana_tanggal_kembali: '',
  tanggal_disetujui_atasan: false,
  // F. Kelengkapan (butir 8.1.c.2)
  kebutuhan_kelengkapan: '',
  kebutuhan_aksesori: '',
  dokumen_pendukung: ['logbook'],
  catatan: '',
});

// Jatuh tempo pemeriksaan berikutnya, dipakai untuk butir 7.d.
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
  const { success, error } = useToast();
  const currentUser = getCurrentUser();

  const [form, setForm] = useState(() => emptyForm(currentUser));
  const [selectedId, setSelectedId] = useState(equipmentId || '');
  const [equipmentList, setEquipmentList] = useState([]);
  const [labs, setLabs] = useState([]);
  const [equipmentDetail, setEquipmentDetail] = useState({});
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync selectedId when equipmentId prop changes
  useEffect(() => {
    if (equipmentId) {
      setSelectedId(equipmentId);
    }
  }, [equipmentId]);

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

  // Muat jadwal pemeriksaan berikutnya untuk butir 7.d.
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

  function handleExternalChange(checked) {
    setForm((prev) => {
      const docs = new Set(prev.dokumen_pendukung);
      if (checked) {
        docs.add('surat_keterangan_membawa');
      }
      return {
        ...prev,
        is_eksternal: checked,
        di_luar_tth: checked,
        dokumen_pendukung: Array.from(docs),
      };
    });
  }

  // Tanggal minimum memakai tanggal lokal (WIB), bukan UTC, agar tidak menggeser satu hari.
  const now = new Date();
  const hariIni = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const nextInspection = getNextInspectionDate(selectedEquipment, equipmentDetail);
  const isExternal = Boolean(form.is_eksternal || form.di_luar_tth);
  // Butir 7.d: rencana tanggal kembali tidak boleh melampaui jatuh tempo pemeriksaan berikutnya.
  const returnBeyondDueDate = Boolean(
    nextInspection && form.rencana_tanggal_kembali
      && new Date(`${form.rencana_tanggal_kembali}T00:00:00`) > nextInspection
  );
  // Peminjaman eksternal disertai Surat Keterangan Membawa Peralatan yang telah disetujui.
  const missingSuratKeterangan = isExternal
    && !form.dokumen_pendukung.includes('surat_keterangan_membawa');

  function validate() {
    if (!selectedId) return 'Peralatan yang akan dipinjam wajib dipilih.';
    if (!form.nama_peminjam.trim()) return 'Nama peminjam wajib diisi.';
    if (!form.tujuan_penggunaan.trim()) return 'Tujuan penggunaan wajib diisi.';
    if (!form.lokasi_penggunaan.trim()) return 'Lokasi penggunaan wajib diisi.';
    if (!form.rencana_tanggal_keluar) return 'Rencana tanggal keluar wajib diisi.';
    if (!form.rencana_tanggal_kembali) return 'Rencana tanggal kembali wajib diisi.';
    if (form.rencana_tanggal_kembali < form.rencana_tanggal_keluar) {
      return 'Rencana tanggal kembali tidak boleh lebih awal dari rencana tanggal keluar.';
    }
    if (returnBeyondDueDate) {
      return `Rencana tanggal kembali tidak boleh melampaui tanggal jatuh tempo pemeriksaan berikutnya (${nextInspection.toLocaleDateString('id-ID')}). Pemeriksaan berkala harus dilaksanakan terlebih dahulu atau gunakan peralatan lain yang layak.`;
    }
    // Rencana tanggal keluar dan kembali sudah diketahui oleh atasan Peminjam.
    if (!form.tanggal_disetujui_atasan) {
      return 'Rencana tanggal keluar dan kembali harus sudah diketahui oleh atasan peminjam.';
    }
    if (missingSuratKeterangan) {
      return 'Peminjaman eksternal wajib disertai Surat Keterangan Membawa Peralatan.';
    }
    return '';
  }

  async function submitPermohonan(event) {
    event.preventDefault();
    const invalidReason = validate();
    if (invalidReason) {
      error(invalidReason);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        peralatan_id: Number(selectedId),
        nama_operator: form.nama_operator?.trim() || '',
        tujuan_penggunaan: form.tujuan_penggunaan?.trim() || '',
        nomor_spk: form.nomor_spk?.trim() || '',
        lokasi_penggunaan: form.lokasi_penggunaan?.trim() || '',
        is_eksternal: Boolean(form.is_eksternal || form.di_luar_tth),
        rencana_tanggal_keluar: form.rencana_tanggal_keluar,
        rencana_tanggal_kembali: form.rencana_tanggal_kembali,
        kebutuhan_kelengkapan: form.kebutuhan_kelengkapan?.trim() || '',
        kebutuhan_aksesori: form.kebutuhan_aksesori?.trim() || '',
        catatan: form.catatan?.trim() || '',
      };

      const res = await peminjamanApi.create(payload);
      const kode = res?.data?.kode || '';
      success(res?.message || `Pengajuan peminjaman berhasil dikirim${kode ? ` (${kode})` : ''}!`);
      if (navigate) {
        navigate('/peminjaman');
      }
    } catch (err) {
      error(err.message || 'Gagal mengirim pengajuan peminjaman.');
    } finally {
      setIsSubmitting(false);
    }
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
              Peminjam mengajukan permohonan peminjaman peralatan kepada Pengelola peralatan.
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
                Jatuh tempo pemeriksaan berikutnya:{' '}
                <strong style={{ color: returnBeyondDueDate ? '#b91c1c' : 'var(--clr-dark-900, #0F172A)' }}>
                  {nextInspection.toLocaleDateString('id-ID')}
                </strong>
                {' — rencana tanggal kembali tidak boleh melampaui tanggal ini (butir 7.d).'}
              </>
            ) : (
              'Jadwal pemeriksaan berikutnya belum tersedia.'
            )}
          </div>
        </div>
      ) : null}

      {/* Form Pengajuan Peminjaman */}
      <form className="card card-padded" onSubmit={submitPermohonan}>
        {/* A. Identitas Peralatan — butir 8.1.a.1 */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={18} style={{ color: 'var(--clr-primary-500)' }} />
            A. Peralatan yang Dipinjam
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
              <span className="form-hint">
                Hanya peralatan berstatus layak pakai yang dapat dipinjam. Peminjaman
                adalah penggunaan peralatan di luar lokasi tercatat laboratorium.
              </span>
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

        {/* B. Peminjam & Atasan Peminjam — butir 3.c dan dokumen peminjaman-peralatan.md */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} style={{ color: 'var(--clr-primary-500)' }} />
            B. Data Peminjam & Atasan Peminjam
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

            <div className="form-group">
              <label className="form-label" htmlFor="input-atasan-peminjam">
                Atasan / Manajer Peminjam <span className="form-hint" style={{ display: 'inline' }}>(Untuk Validasi Pengajuan)</span>
              </label>
              <input
                id="input-atasan-peminjam"
                className="form-input"
                type="text"
                placeholder="Nama atasan langsung / Manajer peminjam..."
                value={form.atasan_peminjam}
                onChange={(e) => setForm({ ...form, atasan_peminjam: e.target.value })}
              />
              <span className="form-hint">
                Sistem akan mengirim notifikasi validasi ke Manajer Peminjam sebelum diteruskan ke Pengelola Peralatan (Tahap 2 Swimlane).
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-nama-operator">
                Pelaksana / Operator bila berbeda dengan Peminjam
              </label>
              <input
                id="input-nama-operator"
                className="form-input"
                type="text"
                placeholder="Isi bila peminjam bukan personel yang mengoperasikan peralatan"
                value={form.nama_operator}
                onChange={(e) => setForm({ ...form, nama_operator: e.target.value })}
              />
              <span className="form-hint">
                Peminjam/operator harus personel TTH yang kompeten dan berwenang mengoperasikan peralatan (butir 7.b).
              </span>
            </div>
          </div>
        </div>

        {/* C. Tujuan Penggunaan — butir 8.1.a.2 */}
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
              placeholder="Uraikan kegiatan pengujian / proyek yang akan menggunakan peralatan tersebut..."
              value={form.tujuan_penggunaan}
              onChange={(e) => setForm({ ...form, tujuan_penggunaan: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: 'var(--sp-3)' }}>
            <label className="form-label" htmlFor="input-nomor-spk">
              Nomor SPK / Surat Perintah Kerja <span className="form-hint" style={{ display: 'inline' }}>(Opsional)</span>
            </label>
            <input
              id="input-nomor-spk"
              className="form-input"
              type="text"
              placeholder="Contoh: SPK/TTH/2026/10-001..."
              value={form.nomor_spk}
              onChange={(e) => setForm({ ...form, nomor_spk: e.target.value })}
            />
          </div>
        </div>

        {/* D. Lokasi Penggunaan — butir 8.1.a.3 */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} style={{ color: 'var(--clr-primary-500)' }} />
            D. Lokasi Penggunaan
          </h3>
          <div className="form-group">
            <label className="form-label" htmlFor="input-lokasi-penggunaan">Lokasi Penggunaan <span className="required">*</span></label>
            <input
              id="input-lokasi-penggunaan"
              className="form-input"
              type="text"
              placeholder="Ruangan lab tujuan, lokasi pelanggan, atau site lapangan..."
              value={form.lokasi_penggunaan}
              onChange={(e) => setForm({ ...form, lokasi_penggunaan: e.target.value })}
              required
            />
            <span className="form-hint">
              Lokasi tercatat tidak berubah selama peminjaman; peralatan wajib dikembalikan ke lokasi
              tercatat semula (butir 6.b).
            </span>
          </div>

          <label className="checkbox-label" style={{ marginTop: 'var(--sp-3)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <input
              type="checkbox"
              checked={form.di_luar_tth}
              onChange={(e) => handleExternalChange(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span>
              Peralatan dibawa keluar lingkungan TTH (peminjaman eksternal).
              <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500, #64748B)' }}>
                Peminjaman eksternal otomatis menyertakan <strong>Surat Keterangan Membawa Peralatan</strong> yang wajib dicetak dan dibawa bersama alat.
              </span>
            </span>
          </label>
        </div>

        {/* E. Rencana Tanggal */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarClock size={18} style={{ color: 'var(--clr-primary-500)' }} />
            E. Rencana Tanggal Keluar dan Kembali
          </h3>
          <p className="page-subtitle" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--sp-3)' }}>
            Rencana tanggal harus sudah diketahui oleh atasan Peminjam sebelum permohonan diajukan.
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
                  Jatuh tempo kalibrasi berikutnya: <strong>{nextInspection.toLocaleDateString('id-ID')}</strong> (rencana kembali tidak boleh melampaui tanggal ini).
                </span>
              )}
            </div>
          </div>

          <label className="checkbox-label" style={{ marginTop: 'var(--sp-3)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <input
              type="checkbox"
              checked={form.tanggal_disetujui_atasan}
              onChange={(e) => setForm({ ...form, tanggal_disetujui_atasan: e.target.checked })}
              style={{ marginTop: 3 }}
            />
            <span>
              <strong>Rencana tanggal keluar dan kembali sudah dikoordinasikan dan diketahui oleh atasan Peminjam.</strong> <span className="required">*</span>
              <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500, #64748B)' }}>
                Dengan mencentang ini, Anda menyatakan jadwal peminjaman telah selaras dengan penugasan kerja dan siap divalidasi oleh Atasan / Manajer Peminjam.
              </span>
            </span>
          </label>
        </div>

        {/* F. Kelengkapan dan Dokumen — butir 8.1.c.2, 7.f, dan 8.1.e */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} style={{ color: 'var(--clr-primary-500)' }} />
            F. Kelengkapan dan Dokumen
          </h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="input-kelengkapan">Kelengkapan yang Dibutuhkan</label>
              <textarea
                id="input-kelengkapan"
                className="form-textarea"
                rows={2}
                placeholder="Contoh: modul pengujian, probe, kabel optik, bracket..."
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
                placeholder="Contoh: adaptor daya AC/DC, kabel grounding, baterai cadangan..."
                value={form.kebutuhan_aksesori}
                onChange={(e) => setForm({ ...form, kebutuhan_aksesori: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 'var(--sp-4)' }}>
            <label className="form-label" style={{ fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-xs)' }}>
              Dokumen Pendukung yang Disertai
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
                Peminjaman eksternal wajib menyertakan Surat Keterangan Membawa Peralatan.
              </span>
            )}
          </div>

          <div className="form-group" style={{ marginTop: 'var(--sp-4)' }}>
            <label className="form-label" htmlFor="input-catatan">Catatan Tambahan</label>
            <textarea
              id="input-catatan"
              className="form-textarea"
              rows={3}
              placeholder="Keterangan atau instruksi khusus penanganan yang perlu diketahui Pengelola peralatan..."
              value={form.catatan}
              onChange={(e) => setForm({ ...form, catatan: e.target.value })}
            />
          </div>
        </div>

        {/* G. Alur Proses Peminjaman — Swimlane SiKEPo */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileCheck size={18} style={{ color: 'var(--clr-primary-500)' }} />
            G. Alur Proses Persetujuan &amp; Serah Terima Peminjaman
          </h3>
          <div
            className="alert alert-info"
            style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 'var(--text-xs)', lineHeight: 1.6 }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ background: '#3b82f6', color: '#ffffff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>1</span>
              <div><strong>Pengajuan Peminjam:</strong> Peminjam mengisi form permohonan dengan jadwal yang diketahui atasannya. Sistem mencatat logbook dan mengirim notifikasi.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ background: '#3b82f6', color: '#ffffff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>2</span>
              <div><strong>Validasi Manajer Peminjam:</strong> Manajer peminjam memvalidasi urgensi dan jadwal kebutuhan pengujian.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ background: '#3b82f6', color: '#ffffff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>3</span>
              <div><strong>Pemeriksaan Pengelola (PIC):</strong> PIC alat memeriksa ketersediaan, kelayakan fungsi, dan operator, lalu meneruskan ke Manager Lab pemilik.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ background: '#3b82f6', color: '#ffffff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>4</span>
              <div><strong>Persetujuan Manager Lab Pemilik:</strong> Mgr. Lab mereview dan menyetujui peminjaman (butir 3.a &amp; 7.c).</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ background: '#3b82f6', color: '#ffffff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>5</span>
              <div><strong>Serah Terima &amp; Checklist Lampiran A:</strong> PIC dan peminjam memeriksa identitas, fisik, kelengkapan, dan fungsi alat sebelum digunakan.</div>
            </div>
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
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(backPath)}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || listLoading || detailLoading}
            id="btn-ajukan-peminjaman"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Send size={16} />
            {isSubmitting ? 'Mengirim Pengajuan...' : 'Ajukan Peminjaman'}
          </button>
        </div>
      </form>
    </div>
  );
}