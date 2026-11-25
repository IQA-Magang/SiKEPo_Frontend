import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
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
  akunApi,
  getEquipmentId,
  formatPhotoUrl,
  STATUS_BADGE_CLASS,
} from '../../shared/services/api.js';
import SignatureField from '../../shared/components/ui/SignatureField.jsx';
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
  const [detailEquipment, setDetailEquipment] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Jadwal peminjaman aktif alat terpilih, untuk memastikan tanggal yang
  // dipilih tidak bertumpuk dengan peminjaman orang lain.
  const [schedules, setSchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [applicantSignature, setApplicantSignature] = useState('');
  const [userSavedSig, setUserSavedSig] = useState('');
  const [targetLabId, setTargetLabId] = useState('');
  const [targetRoomId, setTargetRoomId] = useState('');

  // Dropdown keperluan penggunaan sesuai formulir standar TLKM13/F/006
  const [tujuanOpsi, setTujuanOpsi] = useState(() => {
    const t = form.tujuan_penggunaan?.trim() || '';
    if (!t) return '';
    if (t === 'Pengujian' || t === 'Uji lokasi' || t === 'Pengecekan antara') return t;
    return 'Lainnya';
  });
  const [tujuanLainnya, setTujuanLainnya] = useState(() => {
    const t = form.tujuan_penggunaan?.trim() || '';
    if (t.startsWith('Lainnya:')) return t.replace(/^Lainnya:\s*/, '');
    if (!['Pengujian', 'Uji lokasi', 'Pengecekan antara'].includes(t)) return t;
    return '';
  });

  const handleTujuanOpsiChange = (e) => {
    const val = e.target.value;
    setTujuanOpsi(val);
    if (val === 'Lainnya') {
      const desc = tujuanLainnya.trim();
      setForm((prev) => ({
        ...prev,
        tujuan_penggunaan: desc ? `Lainnya: ${desc}` : '',
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        tujuan_penggunaan: val,
      }));
    }
  };

  const handleTujuanLainnyaChange = (e) => {
    const text = e.target.value;
    setTujuanLainnya(text);
    setForm((prev) => ({
      ...prev,
      tujuan_penggunaan: text.trim() ? `Lainnya: ${text.trim()}` : '',
    }));
  };

  // Muat tanda tangan tersimpan akun untuk pra-isi kanvas pemohon
  useEffect(() => {
    let cancelled = false;
    akunApi.getTtd()
      .then((res) => {
        if (!cancelled && res?.data?.ttd) {
          setUserSavedSig(res.data.ttd);
          setApplicantSignature(res.data.ttd);
        }
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, []);

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

  // Sinkronisasi targetLabId dan targetRoomId bila lokasi_penggunaan sudah terisi
  useEffect(() => {
    if (!form.is_eksternal && form.lokasi_penggunaan && rooms.length > 0 && !targetRoomId) {
      const matchedRoom = rooms.find((r) => {
        const val1 = `${r.nama_ruangan} (${r.kode_ruangan}) — Lt. ${r.lantai_ruangan ?? r.lantai ?? 1}`;
        const val2 = [r.kode_ruangan, r.nama_ruangan].filter(Boolean).join(' - ');
        return form.lokasi_penggunaan === val1 || form.lokasi_penggunaan === val2 || (r.kode_ruangan && form.lokasi_penggunaan.includes(r.kode_ruangan));
      });
      if (matchedRoom) {
        setTargetRoomId(String(matchedRoom.id));
        const labId = matchedRoom.labs_id || matchedRoom.labs?.id || matchedRoom.lab_id;
        if (labId) setTargetLabId(String(labId));
      }
    }
  }, [form.is_eksternal, form.lokasi_penggunaan, rooms, targetRoomId]);

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

  // Muat detail peralatan (termasuk jatuh tempo pemeriksaan & flag sedang_diajukan terbaru).
  useEffect(() => {
    if (!selectedEquipment?.nomor_aset) {
      setEquipmentDetail({});
      setDetailEquipment(null);
      setSchedules([]);
      return undefined;
    }

    let cancelled = false;
    setDetailLoading(true);
    setScheduleLoading(true);

    async function loadDetail() {
      try {
        const res = await peralatanApi.getByAssetNumber(selectedEquipment.nomor_aset);
        if (!cancelled) {
          const freshEquipment = res?.data?.peralatan || (res?.data?.id ? res.data : null);
          setDetailEquipment(freshEquipment);
          setEquipmentDetail(res?.data?.detail || {});
          setSchedules(
            freshEquipment?.pengajuan_aktif
              ? [freshEquipment.pengajuan_aktif]
              : [],
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('Gagal memuat jadwal pemeriksaan peralatan:', err);
          setDetailEquipment(null);
          setSchedules(
            selectedEquipment?.pengajuan_aktif
              ? [selectedEquipment.pengajuan_aktif]
              : [],
          );
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
          setScheduleLoading(false);
        }
      }
    }

    loadDetail();
    return () => { cancelled = true; };
  }, [selectedEquipment]);

  function formatTgl(dateStr) {
    if (!dateStr) return '';
    const d = String(dateStr).slice(0, 10);
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }

  const activeEquipmentInfo = detailEquipment || selectedEquipment;
  const activePengajuan =
    activeEquipmentInfo?.pengajuan_aktif || schedules[0] || null;
  const isEquipmentBeingRequested = Boolean(
    activeEquipmentInfo?.sedang_diajukan ||
      activePengajuan ||
      (activeEquipmentInfo && activeEquipmentInfo.status_alat === 'Dipinjam'),
  );
  const isEquipmentUnavailable = Boolean(
    activeEquipmentInfo &&
      (activeEquipmentInfo.status_verifikasi !== 'Disetujui' ||
        activeEquipmentInfo.status_alat !== 'Aktif'),
  );
  const submitBlockedByExistingLoan = Boolean(
    isEquipmentBeingRequested || isEquipmentUnavailable,
  );

  // Cari jadwal yang bentrok dengan rentang tanggal yang dipilih peminjam
  const conflictingSchedule = selectedId ? schedules.find((jadwal) => {
    const keluar = form.rencana_tanggal_keluar;
    const kembali = form.rencana_tanggal_kembali || form.rencana_tanggal_keluar;
    if (!keluar) return false;
    return keluar <= jadwal.rencana_tanggal_kembali && kembali >= jadwal.rencana_tanggal_keluar;
  }) : null;

  const jadwalBentrok = Boolean(conflictingSchedule);

  const STATUS_PENGAJUAN_LABEL = {
    MENUNGGU_MANAGER_PEMINJAM: 'Menunggu Atasan Peminjam',
    MENUNGGU_PENGELOLA: 'Menunggu Review Pengelola',
    MENUNGGU_MANAGER_LAB: 'Menunggu Manager Lab Pemilik',
    DISETUJUI: 'Disetujui (Menunggu Serah Terima)',
    MENUNGGU_SERAH_TERIMA: 'Disetujui (Menunggu Serah Terima)',
    SIAP_DISERAHKAN: 'Siap Diserahkan',
    SEDANG_DIPINJAM: 'Sedang Dipinjam',
  };

  function handleLocationTypeChange(isExternal) {
    setForm((prev) => ({
      ...prev,
      lokasi_penggunaan: '',
      is_eksternal: isExternal,
      di_luar_tth: isExternal,
    }));
    setTargetLabId('');
    setTargetRoomId('');
  }

  function handleTargetLabChange(e) {
    const labId = e.target.value;
    setTargetLabId(labId);
    setTargetRoomId('');
    setForm((prev) => ({ ...prev, lokasi_penggunaan: '' }));
  }

  function handleTargetRoomChange(e) {
    const roomId = e.target.value;
    setTargetRoomId(roomId);
    const room = rooms.find((r) => String(r.id) === String(roomId));
    if (room) {
      const roomFormatted = `${room.nama_ruangan} (${room.kode_ruangan}) — Lt. ${room.lantai_ruangan ?? room.lantai ?? 1}`;
      setForm((prev) => ({
        ...prev,
        lokasi_penggunaan: roomFormatted,
      }));
      if (!targetLabId) {
        const labId = room.labs_id || room.labs?.id || room.lab_id;
        if (labId) setTargetLabId(String(labId));
      }
    } else {
      setForm((prev) => ({ ...prev, lokasi_penggunaan: '' }));
    }
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
    if (isEquipmentBeingRequested) {
      return activePengajuan?.kode
        ? `Peralatan ini sedang diajukan/dipinjam oleh orang lain (${activePengajuan.kode}). Pengajuan baru tidak dapat dikirim saat ini.`
        : 'Peralatan ini sedang diajukan atau dipinjam oleh orang lain. Pengajuan baru tidak dapat dikirim saat ini.';
    }
    if (isEquipmentUnavailable) {
      return 'Peralatan tidak sedang dalam status layak pakai (Aktif & Disetujui) untuk dipinjam.';
    }
    if (!form.nama_peminjam.trim()) return 'Nama peminjam wajib diisi.';
    if (!tujuanOpsi) return 'Keperluan / tujuan penggunaan wajib dipilih.';
    if (tujuanOpsi === 'Lainnya' && !tujuanLainnya.trim()) {
      return 'Keterangan keperluan lainnya wajib diisi.';
    }
    if (!form.lokasi_penggunaan.trim()) {
      if (form.is_eksternal) {
        return 'Lokasi tujuan eksternal wajib diisi.';
      }
      if (!targetLabId) {
        return 'Laboratorium tujuan wajib dipilih.';
      }
      return 'Lokasi / ruangan fisik tujuan wajib dipilih.';
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
        : 'Alat sedang dipinjam orang lain pada rentang tanggal tersebut.';
    }
    if (!form.kebutuhan_kelengkapan?.trim()) {
      return 'Kelengkapan dan aksesori wajib diisi.';
    }
    if (!applicantSignature?.trim()) {
      return 'Tanda tangan peminjam wajib dibubuhkan.';
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
      const finalTujuan = tujuanOpsi === 'Lainnya'
        ? (tujuanLainnya.trim() ? `Lainnya: ${tujuanLainnya.trim()}` : 'Lainnya')
        : tujuanOpsi;

      const payload = {
        peralatan_id: Number(selectedId),
        nama_operator: form.nama_operator?.trim() || '',
        tujuan_penggunaan: finalTujuan,
        nomor_spk: form.nomor_spk?.trim() || '',
        lokasi_penggunaan: form.lokasi_penggunaan?.trim() || '',
        is_eksternal: Boolean(form.is_eksternal || form.di_luar_tth),
        rencana_tanggal_keluar: form.rencana_tanggal_keluar,
        rencana_tanggal_kembali: form.rencana_tanggal_kembali,
        kebutuhan_kelengkapan: form.kebutuhan_kelengkapan?.trim() || '',
        kebutuhan_aksesori: '',
        catatan: form.catatan?.trim() || '',
        ttd: applicantSignature.trim(),
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

          {selectedEquipment && (scheduleLoading && !isEquipmentBeingRequested ? (
            <div style={{ marginTop: 'var(--sp-2)', fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500, #64748B)' }}>
              Memuat status pengajuan peralatan...
            </div>
          ) : (isEquipmentBeingRequested || isEquipmentUnavailable) ? (
            <div
              style={{
                marginTop: 'var(--sp-3)',
                padding: 'var(--sp-3)',
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: 'var(--radius-md, 6px)',
                fontSize: 'var(--text-xs)',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#991b1b' }}>
                  {isEquipmentBeingRequested
                    ? 'Peralatan ini sedang diajukan atau dipinjam oleh orang lain'
                    : `Peralatan tidak dapat dipinjam (Status: ${activeEquipmentInfo?.status_alat || '-'})`}
                </div>
                {activePengajuan ? (
                  <div style={{ marginTop: 4, lineHeight: 1.45, color: '#7f1d1d' }}>
                    Kode Tiket: <strong>{activePengajuan.kode || `PJM-${activePengajuan.peminjaman_id}`}</strong>{' '}
                    &bull; Status:{' '}
                    <strong>
                      {STATUS_PENGAJUAN_LABEL[activePengajuan.status] || activePengajuan.status}
                    </strong>
                    {activePengajuan.rencana_tanggal_keluar && activePengajuan.rencana_tanggal_kembali && (
                      <>
                        {' '}&bull; Jadwal:{' '}
                        <strong>
                          {formatTgl(activePengajuan.rencana_tanggal_keluar)} s.d.{' '}
                          {formatTgl(activePengajuan.rencana_tanggal_kembali)}
                        </strong>
                      </>
                    )}
                  </div>
                ) : null}
                <div style={{ color: '#991b1b', marginTop: 4 }}>
                  Tombol <strong>Ajukan Peminjaman</strong> dinonaktifkan sampai pengajuan yang berjalan selesai, ditolak, atau dibatalkan.
                </div>
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
                    {item.sedang_diajukan ? ' (Sedang Diajukan)' : ''}
                  </option>
                ))}
              </select>
              <span className="form-hint">
                Hanya peralatan berstatus layak pakai dan tidak sedang memiliki pengajuan aktif yang dapat dipinjam.
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
                Otomatis disinkronkan dengan Manajer Laboratorium asal peminjam untuk validasi.
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

        {/* C. Keperluan / Tujuan Penggunaan — butir 8.1.a.2 & formulir TLKM13/F/006 */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)' }}>
            C. Keperluan / Tujuan Penggunaan
          </h3>
          <div className="form-group">
            <label className="form-label" htmlFor="select-tujuan-penggunaan">
              Keperluan Penggunaan <span className="required">*</span>
            </label>
            <select
              id="select-tujuan-penggunaan"
              className="form-select"
              value={tujuanOpsi}
              onChange={handleTujuanOpsiChange}
              required
            >
              <option value="">-- Pilih Keperluan Penggunaan --</option>
              <option value="Pengujian">Pengujian</option>
              <option value="Uji lokasi">Uji lokasi</option>
              <option value="Pengecekan antara">Pengecekan antara</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Input manual bila memilih Lainnya */}
          {tujuanOpsi === 'Lainnya' && (
            <div className="form-group" style={{ marginTop: 'var(--sp-3)' }}>
              <label className="form-label" htmlFor="input-tujuan-lainnya">
                Keterangan Keperluan Lainnya <span className="required">*</span>
              </label>
              <input
                id="input-tujuan-lainnya"
                type="text"
                className="form-input"
                placeholder="Tuliskan keperluan penggunaan lainnya..."
                value={tujuanLainnya}
                onChange={handleTujuanLainnyaChange}
                required
              />
            </div>
          )}

          <div className="form-group" style={{ marginTop: 'var(--sp-3)' }}>
            <label className="form-label" htmlFor="input-nomor-spk">
              Dasar Pelaksanaan <span className="form-hint" style={{ display: 'inline' }}>(Opsional)</span>
            </label>
            <input
              id="input-nomor-spk"
              className="form-input"
              type="text"
              placeholder="Contoh: No. SPK (12345)"
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
            <div style={{ marginTop: 'var(--sp-3)' }}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="select-lab">
                    Laboratorium <span className="required">*</span>
                  </label>
                  <select
                    id="select-lab"
                    className="form-select"
                    value={targetLabId}
                    onChange={handleTargetLabChange}
                    required
                  >
                    <option value="">– Pilih Laboratorium –</option>
                    {labs.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nama_labs} ({l.kode_labs})
                      </option>
                    ))}
                  </select>
                  <span className="form-hint">
                    Pilih laboratorium pemilik atau pengguna utama peralatan.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="select-ruangan">
                    Lokasi <span className="required">*</span>
                  </label>
                  <select
                    id="select-ruangan"
                    className="form-select"
                    value={targetRoomId}
                    onChange={handleTargetRoomChange}
                    required
                  >
                    <option value="">– Pilih Lokasi –</option>
                    {rooms
                      .filter((r) => !targetLabId || String(r.labs_id || r.labs?.id || r.lab_id) === String(targetLabId))
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nama_ruangan} ({r.kode_ruangan}) — Lt. {r.lantai_ruangan ?? r.lantai ?? 1}
                        </option>
                      ))}
                  </select>
                  <span className="form-hint">
                    Pilih ruangan fisik tempat alat disimpan; pilihan mengikuti laboratorium di atas.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* E. Rencana Tanggal */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)' }}>
            E. Rencana Tanggal Keluar dan Kembali
          </h3>
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
              {conflictingSchedule
                ? `Alat sedang dipinjam/diajukan orang lain pada ${formatTgl(conflictingSchedule.rencana_tanggal_keluar)} s.d. ${formatTgl(conflictingSchedule.rencana_tanggal_kembali)}.`
                : 'Alat sedang dipinjam/diajukan orang lain pada rentang tanggal tersebut.'}
            </div>
          )}
        </div>

        {/* F. Kelengkapan dan Aksesori — butir 8.1.c.2 */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)' }}>
            F. Kelengkapan dan Aksesori
          </h3>
          <div className="form-group">
            <label className="form-label" htmlFor="input-kelengkapan">
              Kelengkapan dan Aksesori yang Dibutuhkan <span className="required">*</span>
            </label>
            <textarea
              id="input-kelengkapan"
              className="form-textarea"
              rows={3}
              required
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

        {/* G. Tanda Tangan Pemohon */}
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-3)' }}>
            G. Tanda Tangan Pemohon
          </h3>
          <SignatureField
            label="Tanda Tangan Pemohon / Peminjam"
            value={applicantSignature}
            onChange={setApplicantSignature}
            required={true}
            savedSignature={userSavedSig}
            onRestore={() => setApplicantSignature(userSavedSig)}
            onForgetSaved={() => {
              akunApi.deleteTtd().catch(() => { });
              setUserSavedSig('');
              setApplicantSignature('');
            }}
            savedSignatureHint="Tanda tangan tersimpan di akun Anda dan otomatis digunakan untuk pengajuan peminjaman."
            inputHint="Goreskan tanda tangan digital pemohon"
          />
        </div>

        {/* Peringatan dekat tombol submit bila peralatan sedang diajukan */}
        {submitBlockedByExistingLoan && (
          <div
            style={{
              marginBottom: 'var(--sp-4)',
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1.5px solid #fecaca',
              borderRadius: 'var(--radius-md, 6px)',
              fontSize: '12px',
              color: '#991b1b',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
            <span>
              {isEquipmentBeingRequested
                ? `Peralatan ini sedang diajukan oleh pengguna lain${activePengajuan?.kode ? ` (${activePengajuan.kode})` : ''}. Tombol Ajukan Peminjaman dinonaktifkan.`
                : 'Peralatan tidak sedang dalam status Aktif & Disetujui. Tombol Ajukan Peminjaman dinonaktifkan.'}
            </span>
          </div>
        )}

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
            className={`btn ${jadwalBentrok || submitBlockedByExistingLoan ? 'btn-secondary' : 'btn-primary'}`}
            disabled={isSubmitting || listLoading || detailLoading || jadwalBentrok || submitBlockedByExistingLoan}
            id="btn-ajukan-peminjaman"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 600,
              ...(jadwalBentrok || submitBlockedByExistingLoan
                ? { opacity: 0.65, cursor: 'not-allowed' }
                : {}),
            }}
            title={
              submitBlockedByExistingLoan
                ? 'Tidak dapat mengajukan — peralatan sedang diajukan/dipinjam oleh pengguna lain'
                : jadwalBentrok
                  ? 'Tidak dapat mengajukan — jadwal bertumpuk dengan peminjaman lain'
                  : ''
            }
          >
            <Send size={15} />
            {isSubmitting ? 'Mengirim Pengajuan...' : 'Ajukan Peminjaman'}
          </button>
        </div>
      </form>
    </div>
  );
}