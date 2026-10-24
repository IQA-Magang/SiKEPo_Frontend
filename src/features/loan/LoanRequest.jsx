import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Globe,
  Package,
  Send,
} from 'lucide-react';
import {
  getCurrentUser,
  peralatanApi,
  labsApi,
  ruanganApi,
  peminjamanApi,
  getEquipmentId,
  formatPhotoUrl,
  STATUS_BADGE_CLASS,
} from '../../shared/services/api.js';
import { useToast } from '../../app/providers/ToastContext.jsx';
import { useNavigate } from '../../app/router/Router.jsx';

// Prosedur Operasional — Peminjam mengajukan permohonan kepada Pengelola
// peralatan dengan menyebutkan:
// 1) peralatan yang dipinjam
// 2) tujuan penggunaan
// 3) lokasi penggunaan
// 4) rencana tanggal keluar dan kembali yang sudah diketahui oleh atasan Peminjam

// Identitas peminjam mengikuti butir 3.c (Peminjam adalah personel TTH) dan butir 6.b
// (peminjaman adalah penggunaan di luar lokasi tercatat). Butir 7.b menegaskan peminjam
// harus personel TTH yang kompeten dan berwenang mengoperasikan peralatan.

const emptyForm = (user) => ({
  // B. Peminjam (butir 3.c & dokumen peminjaman-peralatan.md)
  nama_peminjam: user?.name || '',
  nama_lab_asal: user?.labs?.nama_labs || user?.nama_labs || user?.lab || '',
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
  // F. Kelengkapan dan Aksesori (butir 8.1.c.2)
  kebutuhan_kelengkapan: '',
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
  const [rooms, setRooms] = useState([]);
  const [equipmentDetail, setEquipmentDetail] = useState({});
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Jadwal peminjaman aktif alat terpilih, untuk memastikan tanggal yang
  // dipilih tidak bertumpuk dengan peminjaman orang lain.
  const [schedules, setSchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

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
        const [res, labsRes, roomsRes] = await Promise.all([
          peralatanApi.getAll(),
          labsApi.getAll().catch(() => ({ data: [] })),
          ruanganApi.getAll().catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;

        const labList = labsRes.data || [];
        setEquipmentList(res.data || []);
        setLabs(labList);
        setRooms(roomsRes.data || []);

        const labId = currentUser?.labs_id ?? currentUser?.labs?.id ?? currentUser?.id_labs;
        const userLab = labList.find((lab) => String(lab.id) === String(labId));
        const labName = userLab?.nama_labs
          || currentUser?.labs?.nama_labs
          || currentUser?.nama_labs
          || currentUser?.lab
          || '';
        const managerName = userLab?.manager?.nama_lengkap
          || userLab?.manager?.name
          || currentUser?.manager?.nama_lengkap
          || currentUser?.manager?.name
          || (userLab ? `Manager Lab ${userLab.nama_labs}` : '');

        setForm((prev) => ({
          ...prev,
          nama_lab_asal: labName || prev.nama_lab_asal,
          atasan_peminjam: managerName || prev.atasan_peminjam,
        }));
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
  // yang dapat dipinjam. Alat berstatus Dipinjam tetap boleh diajukan, asal tanggalnya
  // tidak bertumpuk dengan peminjaman orang lain yang sudah berjalan.
  const eligibleEquipment = equipmentList.filter(
    (item) => item.status_verifikasi === 'Disetujui'
      && (item.status_alat === 'Aktif' || item.status_alat === 'Dipinjam')
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

  // Muat jadwal peminjaman lain yang masih berjalan untuk satu alat.
  useEffect(() => {
    if (!selectedId) {
      setSchedules([]);
      return undefined;
    }

    let cancelled = false;
    setScheduleLoading(true);

    peminjamanApi
      .getJadwal(selectedId)
      .then((res) => { if (!cancelled) setSchedules(res?.data || []); })
      .catch((err) => {
        if (!cancelled) {
          setSchedules([]);
          console.warn('Gagal memuat jadwal peminjaman peralatan:', err);
        }
      })
      .finally(() => { if (!cancelled) setScheduleLoading(false); });

    return () => { cancelled = true; };
  }, [selectedId]);

  function formatTgl(dateStr) {
    if (!dateStr) return '';
    const d = String(dateStr).slice(0, 10);
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }

  // Pesan yang sama dengan validasi di backend, supaya peminjam langsung tahu
  // sebelum mengirim pengajuan.
  const JADWAL_BENTROK_MESSAGE =
    'Alat sedang dipinjam orang lain pada rentang tanggal tersebut. Silakan pilih tanggal lain.';

  // Cari jadwal yang bentrok dengan rentang tanggal yang dipilih peminjam
  const conflictingSchedule = selectedId ? schedules.find((jadwal) => {
    const keluar = form.rencana_tanggal_keluar;
    const kembali = form.rencana_tanggal_kembali || form.rencana_tanggal_keluar;
    if (!keluar) return false;
    return keluar <= jadwal.rencana_tanggal_kembali && kembali >= jadwal.rencana_tanggal_keluar;
  }) : null;

  const jadwalBentrok = Boolean(conflictingSchedule);

  function handleLocationTypeChange(isExternal) {
    setForm((prev) => ({
      ...prev,
      lokasi_penggunaan: '',
      is_eksternal: isExternal,
      di_luar_tth: isExternal,
    }));
  }

  // Tanggal minimum memakai tanggal lokal (WIB), bukan UTC, agar tidak menggeser satu hari.
  const now = new Date();
  const hariIni = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const nextInspection = getNextInspectionDate(selectedEquipment, equipmentDetail);
  // Butir 7.d: rencana tanggal kembali tidak boleh melampaui jatuh tempo pemeriksaan berikutnya.
  const returnBeyondDueDate = Boolean(
    nextInspection && form.rencana_tanggal_kembali
      && new Date(`${form.rencana_tanggal_kembali}T00:00:00`) > nextInspection
  );

  function validate() {
    if (!selectedId) return 'Peralatan yang akan dipinjam wajib dipilih.';
    if (!form.nama_peminjam.trim()) return 'Nama peminjam wajib diisi.';
    if (!form.tujuan_penggunaan.trim()) return 'Tujuan penggunaan wajib diisi.';
    if (!form.lokasi_penggunaan.trim()) {
      return form.is_eksternal
        ? 'Lokasi tujuan eksternal wajib diisi.'
        : 'Ruangan tujuan internal wajib dipilih.';
    }
    if (!form.rencana_tanggal_keluar) return 'Rencana tanggal keluar wajib diisi.';
    if (!form.rencana_tanggal_kembali) return 'Rencana tanggal kembali wajib diisi.';
    if (form.rencana_tanggal_kembali < form.rencana_tanggal_keluar) {
      return 'Rencana tanggal kembali tidak boleh lebih awal dari rencana tanggal keluar.';
    }
    if (returnBeyondDueDate) {
      return `Rencana tanggal kembali tidak boleh melampaui tanggal jatuh tempo pemeriksaan berikutnya (${nextInspection.toLocaleDateString('id-ID')}). Pemeriksaan berkala harus dilaksanakan terlebih dahulu atau gunakan peralatan lain yang layak.`;
    }
    if (jadwalBentrok) {
      return conflictingSchedule
        ? `Alat sedang dipinjam orang lain pada rentang tanggal tersebut (${formatTgl(conflictingSchedule.rencana_tanggal_keluar)} s.d. ${formatTgl(conflictingSchedule.rencana_tanggal_kembali)}). Silakan pilih tanggal lain.`
        : JADWAL_BENTROK_MESSAGE;
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
        kebutuhan_aksesori: '',
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

          {selectedEquipment && (scheduleLoading ? (
            <div style={{ marginTop: 'var(--sp-2)', fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500, #64748B)' }}>
              Memuat jadwal peminjaman...
            </div>
          ) : schedules.length > 0 ? (
            <div
              style={{
                marginTop: 'var(--sp-3)',
                padding: 'var(--sp-3)',
                background: 'var(--clr-primary-50, #fff5f5)',
                border: '1px solid var(--clr-primary-200, #fed7d7)',
                borderRadius: 'var(--radius-md, 6px)',
                fontSize: 'var(--text-xs)',
                color: 'var(--clr-primary-900, #7f1d1d)',
              }}
            >
              <strong>Periode peminjaman yang sedang berlangsung / terjadwal:</strong>
              <ul style={{ margin: '6px 0 4px', paddingLeft: 18 }}>
                {schedules.map((jadwal) => (
                  <li key={jadwal.id}>
                    <strong>{formatTgl(jadwal.rencana_tanggal_keluar)} s.d. {formatTgl(jadwal.rencana_tanggal_kembali)}</strong>
                    {' '}({jadwal.kode || `PJM-${jadwal.id}`})
                  </li>
                ))}
              </ul>
              <div style={{ color: 'var(--clr-dark-600, #475569)', marginTop: 4 }}>
                ℹ️ Anda tetap dapat mengajukan peminjaman sebelum atau sesudah rentang tanggal di atas.
              </div>
            </div>
          ) : null)}
        </div>
      ) : null}

      {/* Form Pengajuan Peminjaman */}
      <form className="card card-padded" onSubmit={submitPermohonan}>
        {/* A. Identitas Peralatan — butir 8.1.a.1 */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)' }}>
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
                Hanya peralatan berstatus layak pakai yang dapat dipinjam. Alat yang sedang
                dipinjam orang lain tetap bisa diajukan selama tanggal pengajuan dan kembali
                berada di luar rentang peminjaman yang sudah berjalan.
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
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)' }}>
            B. Data Peminjam &amp; Atasan Peminjam
          </h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="input-nama-peminjam">Nama Peminjam</label>
              <input
                id="input-nama-peminjam"
                className="form-input"
                type="text"
                value={form.nama_peminjam || currentUser?.name || '-'}
                readOnly
                disabled
              />
              <span className="form-hint">Sesuai nama pada profil akun yang sedang login.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-lab-asal">Laboratorium / Unit Asal</label>
              <input
                id="input-lab-asal"
                className="form-input"
                type="text"
                value={form.nama_lab_asal || 'Laboratorium TTH'}
                readOnly
                disabled
              />
              <span className="form-hint">Sesuai unit/laboratorium pada profil peminjam.</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-atasan-peminjam">
                Atasan / Manajer Peminjam <span className="form-hint" style={{ display: 'inline' }}>(Untuk Validasi Pengajuan)</span>
              </label>
              <input
                id="input-atasan-peminjam"
                className="form-input"
                type="text"
                value={form.atasan_peminjam || 'Otomatis disinkronkan dengan Manajer Lab'}
                readOnly
                disabled
              />
              <span className="form-hint">
                Otomatis disinkronkan dengan Manajer Laboratorium asal peminjam untuk validasi (Tahap 1 Swimlane).
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
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)' }}>
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
              placeholder="Contoh: 12345"
              value={form.nomor_spk}
              onChange={(e) => setForm({ ...form, nomor_spk: e.target.value })}
            />
          </div>
        </div>

        {/* D. Lokasi Penggunaan — butir 8.1.a.3 */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)' }}>
            D. Lokasi Penggunaan
          </h3>
          <div className="form-group">
            <span className="form-label" style={{ marginBottom: 'var(--sp-2)', display: 'block' }}>
              Jenis Lokasi <span className="required">*</span>
            </span>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 'var(--sp-3)',
                marginTop: 4,
              }}
              role="radiogroup"
              aria-label="Pilih Jenis Lokasi Penggunaan"
            >
              {/* Pilihan 1: Internal TTH */}
              <div
                role="radio"
                aria-checked={!form.is_eksternal}
                tabIndex={0}
                onClick={() => handleLocationTypeChange(false)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleLocationTypeChange(false);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--sp-3)',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-lg, 8px)',
                  border: !form.is_eksternal
                    ? '2px solid var(--clr-primary-500, #EE2E24)'
                    : '1.5px solid var(--clr-dark-200, #E2E8F0)',
                  backgroundColor: !form.is_eksternal
                    ? 'var(--clr-primary-50, #fef2f2)'
                    : '#ffffff',
                  boxShadow: !form.is_eksternal
                    ? '0 2px 8px rgba(238, 46, 36, 0.12)'
                    : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-md, 6px)',
                    backgroundColor: !form.is_eksternal ? 'var(--clr-primary-100, #fee2e2)' : 'var(--clr-dark-100, #f1f5f9)',
                    color: !form.is_eksternal ? 'var(--clr-primary-600, #C92B21)' : 'var(--clr-dark-500, #64748B)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <Building2 size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span
                      style={{
                        fontWeight: 'var(--fw-semibold, 600)',
                        fontSize: 'var(--text-sm)',
                        color: !form.is_eksternal ? 'var(--clr-primary-800, #991b1b)' : 'var(--clr-dark-900, #0F172A)',
                      }}
                    >
                      Internal TTH
                    </span>
                    {!form.is_eksternal ? (
                      <CheckCircle2 size={18} style={{ color: 'var(--clr-primary-600, #C92B21)', flexShrink: 0 }} />
                    ) : (
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          border: '2px solid var(--clr-dark-300, #CBD5E1)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 'var(--text-xs)',
                      color: !form.is_eksternal ? 'var(--clr-primary-700, #b91c1c)' : 'var(--clr-dark-500, #64748B)',
                      lineHeight: 1.4,
                    }}
                  >
                    Penggunaan di laboratorium / ruangan internal TTH.
                  </p>
                </div>
              </div>

              {/* Pilihan 2: Eksternal TTH */}
              <div
                role="radio"
                aria-checked={form.is_eksternal}
                tabIndex={0}
                onClick={() => handleLocationTypeChange(true)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleLocationTypeChange(true);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--sp-3)',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-lg, 8px)',
                  border: form.is_eksternal
                    ? '2px solid var(--clr-primary-500, #EE2E24)'
                    : '1.5px solid var(--clr-dark-200, #E2E8F0)',
                  backgroundColor: form.is_eksternal
                    ? 'var(--clr-primary-50, #fef2f2)'
                    : '#ffffff',
                  boxShadow: form.is_eksternal
                    ? '0 2px 8px rgba(238, 46, 36, 0.12)'
                    : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-md, 6px)',
                    backgroundColor: form.is_eksternal ? 'var(--clr-primary-100, #fee2e2)' : 'var(--clr-dark-100, #f1f5f9)',
                    color: form.is_eksternal ? 'var(--clr-primary-600, #C92B21)' : 'var(--clr-dark-500, #64748B)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <Globe size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span
                      style={{
                        fontWeight: 'var(--fw-semibold, 600)',
                        fontSize: 'var(--text-sm)',
                        color: form.is_eksternal ? 'var(--clr-primary-800, #991b1b)' : 'var(--clr-dark-900, #0F172A)',
                      }}
                    >
                      Eksternal / di Luar TTH
                    </span>
                    {form.is_eksternal ? (
                      <CheckCircle2 size={18} style={{ color: 'var(--clr-primary-600, #C92B21)', flexShrink: 0 }} />
                    ) : (
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          border: '2px solid var(--clr-dark-300, #CBD5E1)',
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 'var(--text-xs)',
                      color: form.is_eksternal ? 'var(--clr-primary-700, #b91c1c)' : 'var(--clr-dark-500, #64748B)',
                      lineHeight: 1.4,
                    }}
                  >
                    Penggunaan di site mitra / lokasi lapangan di luar fisik TTH.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {form.is_eksternal ? (
            <div className="form-group" style={{ marginTop: 'var(--sp-3)' }}>
              <label className="form-label" htmlFor="input-lokasi-eksternal">Lokasi Tujuan Eksternal <span className="required">*</span></label>
              <textarea
                id="input-lokasi-eksternal"
                className="form-textarea"
                rows={3}
                placeholder="Nama instansi/site, alamat atau detail lokasi tujuan..."
                value={form.lokasi_penggunaan}
                onChange={(e) => setForm({ ...form, lokasi_penggunaan: e.target.value })}
                required
              />
              <span className="form-hint">
                Cantumkan nama instansi/site dan alamat atau detail lokasi. Peminjaman eksternal
                memerlukan <strong>Surat Keterangan Membawa Peralatan</strong>.
              </span>
            </div>
          ) : (
            <div className="form-group" style={{ marginTop: 'var(--sp-3)' }}>
              <label className="form-label" htmlFor="select-ruangan-tujuan">Ruangan Tujuan Internal <span className="required">*</span></label>
              <select
                id="select-ruangan-tujuan"
                className="form-select"
                value={form.lokasi_penggunaan}
                onChange={(e) => setForm({ ...form, lokasi_penggunaan: e.target.value })}
                required
              >
                <option value="">-- Pilih Ruangan Tujuan --</option>
                {labs.map((lab) => {
                  const labRooms = rooms.filter((room) => String(room.labs_id || room.labs?.id) === String(lab.id));
                  if (labRooms.length === 0) return null;
                  return (
                    <optgroup key={lab.id} label={`${lab.kode_labs || lab.nama_labs} — ${lab.nama_labs}`}>
                      {labRooms.map((room) => {
                        const locationValue = [room.kode_ruangan, room.nama_ruangan].filter(Boolean).join(' - ');
                        return <option key={room.id} value={locationValue}>{locationValue}</option>;
                      })}
                    </optgroup>
                  );
                })}
              </select>
              <span className="form-hint">
                Daftar ruangan diambil dari master Ruangan. Lokasi asal peralatan tidak berubah selama peminjaman.
              </span>
            </div>
          )}
        </div>

        {/* E. Rencana Tanggal */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-2)' }}>
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

          {jadwalBentrok && (
            <div
              style={{
                marginTop: 'var(--sp-3)',
                padding: 'var(--sp-3)',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md, 6px)',
                fontSize: 'var(--text-xs)',
                color: '#991b1b',
              }}
            >
              ⚠️ {conflictingSchedule
                ? `Alat sedang dipinjam orang lain pada ${formatTgl(conflictingSchedule.rencana_tanggal_keluar)} s.d. ${formatTgl(conflictingSchedule.rencana_tanggal_kembali)}. Silakan pilih tanggal lain.`
                : JADWAL_BENTROK_MESSAGE}
            </div>
          )}
        </div>

        {/* F. Kelengkapan dan Aksesori — butir 8.1.c.2 */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)' }}>
            F. Kelengkapan dan Aksesori
          </h3>
          <div className="form-group">
            <label className="form-label" htmlFor="input-kelengkapan">Kelengkapan dan Aksesori yang Dibutuhkan</label>
            <textarea
              id="input-kelengkapan"
              className="form-textarea"
              rows={3}
              placeholder="Contoh: modul pengujian, probe, kabel optik, bracket, adaptor daya AC/DC, baterai cadangan..."
              value={form.kebutuhan_kelengkapan}
              onChange={(e) => setForm({ ...form, kebutuhan_kelengkapan: e.target.value })}
            />
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
            style={{ padding: '8px 20px', fontSize: '13px', fontWeight: 600 }}
          >
            Batal
          </button>
          <button
            type="submit"
            className={`btn ${jadwalBentrok ? 'btn-secondary' : 'btn-primary'}`}
            disabled={isSubmitting || listLoading || detailLoading || jadwalBentrok}
            id="btn-ajukan-peminjaman"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 600,
            }}
            title={jadwalBentrok ? 'Tidak dapat mengajukan — jadwal bertumpuk dengan peminjaman lain' : ''}
          >
            <Send size={15} />
            {isSubmitting ? 'Mengirim Pengajuan...' : 'Ajukan Peminjaman'}
          </button>
        </div>
      </form>
    </div>
  );
}