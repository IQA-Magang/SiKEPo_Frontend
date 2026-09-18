import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle,
  ClipboardCheck,
  FileCheck2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import { getCurrentUser, getEquipmentId, peralatanApi, verifikasiApi } from '../utils/api.js';
import { getUserRole } from '../utils/permissions.js';
import { useToast } from '../context/ToastContext.jsx';

const CHECKLIST = [
  ['identitas', 'Identitas dan label alat'],
  ['kelengkapan', 'Kelengkapan komponen'],
  ['firmware', 'Firmware / perangkat lunak'],
  ['kondisi_fisik', 'Kondisi fisik'],
  ['segel', 'Segel / pengaman'],
  ['fungsi_awal', 'Fungsi awal'],
  ['metrologi', 'Aspek metrologi'],
  ['sertifikat', 'Sertifikat / dokumen pendukung'],
];

const STATUS_CLASS = {
  Draft: 'badge-gray',
  Diajukan: 'badge-kalibrasi',
  Disetujui: 'badge-aktif',
  Ditolak: 'badge-rusak',
};

const initialChecklist = Object.fromEntries(CHECKLIST.map(([key]) => [key, 'S']));

function unwrap(response) {
  return response?.data || [];
}

function equipmentLabel(item) {
  if (!item) return 'Peralatan tidak ditemukan';
  return [item.nomor_aset, item.nama_peralatan, item.merek].filter(Boolean).join(' - ');
}

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value));
}

function getChecklistResult(item) {
  return item?.hasil_verifikasi?.[0] || {};
}

export default function Verification() {
  const { success, error } = useToast();
  const role = getUserRole();
  const currentUser = getCurrentUser();
  const canReview = role === 'manager' || role === 'admin';
  const currentUserId = Number(currentUser?.user_id || currentUser?.id || 0);

  const [items, setItems] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [signature, setSignature] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [form, setForm] = useState({
    id_peralatan: '',
    tanggal_verifikasi: new Date().toISOString().slice(0, 10),
    kode_aktivitas: `VER-${new Date().getFullYear()}-`,
    id_kriteria: '',
    tindak_lanjut: '',
    catatan: '',
    hasil_verifikasi: initialChecklist,
  });

  async function loadData() {
    setLoading(true);
    try {
      const [verificationResponse, equipmentResponse] = await Promise.all([
        verifikasiApi.getAll(),
        peralatanApi.getAll(),
      ]);
      setItems(unwrap(verificationResponse));
      setEquipment(unwrap(equipmentResponse));
    } catch (err) {
      error(err.message || 'Gagal memuat data verifikasi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const equipmentMap = useMemo(
    () => new Map(equipment.map((item) => [String(getEquipmentId(item)), item])),
    [equipment]
  );

  const pendingEquipment = useMemo(
    () => equipment.filter((item) => (
      item.status_verifikasi !== 'Disetujui' &&
      (role === 'admin' || Number(item.pic_id) === currentUserId)
    )),
    [currentUserId, equipment, role]
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return items.filter((item) => {
      const alat = item.peralatan || equipmentMap.get(String(item.id_peralatan));
      const matchesQuery = !normalizedQuery || [
        item.kode_aktivitas,
        item.status,
        equipmentLabel(alat),
      ].join(' ').toLowerCase().includes(normalizedQuery);
      return matchesQuery && (!filter || item.status === filter);
    });
  }, [equipmentMap, filter, items, query]);

  function updateForm(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function updateChecklist(name, value) {
    setForm((previous) => ({
      ...previous,
      hasil_verifikasi: { ...previous.hasil_verifikasi, [name]: value },
    }));
  }

  function resetForm() {
    setForm({
      id_peralatan: '',
      tanggal_verifikasi: new Date().toISOString().slice(0, 10),
      kode_aktivitas: `VER-${new Date().getFullYear()}-`,
      id_kriteria: '',
      tindak_lanjut: '',
      catatan: '',
      hasil_verifikasi: { ...initialChecklist },
    });
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!form.id_peralatan || !form.kode_aktivitas.trim()) {
      error('Peralatan dan kode aktivitas wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const response = await verifikasiApi.create({
        ...form,
        id_peralatan: Number(form.id_peralatan),
        id_kriteria: form.id_kriteria ? Number(form.id_kriteria) : null,
      });
      setItems((previous) => [response.data, ...previous]);
      setSelected(response.data);
      setShowForm(false);
      resetForm();
      success('Draft verifikasi berhasil dibuat.');
    } catch (err) {
      error(err.message || 'Gagal membuat draft verifikasi.');
    } finally {
      setSaving(false);
    }
  }

  async function runAction(action) {
    if (!selected) return;
    setSaving(true);
    try {
      let response;
      if (action === 'sign') {
        response = await verifikasiApi.signPic(selected.id_verifikasi, signature);
      } else if (action === 'approve') {
        response = await verifikasiApi.approve(selected.id_verifikasi, signature);
      } else {
        response = await verifikasiApi.reject(selected.id_verifikasi, rejectReason, rejectNote);
      }
      const updated = response.data;
      setItems((previous) => previous.map((item) => item.id_verifikasi === updated.id_verifikasi ? updated : item));
      setSelected(updated);
      setSignature('');
      setRejectReason('');
      setRejectNote('');
      success(action === 'sign' ? 'Verifikasi diajukan ke manager.' : action === 'approve' ? 'Verifikasi disetujui.' : 'Verifikasi ditolak.');
    } catch (err) {
      error(err.message || 'Tindakan verifikasi gagal.');
    } finally {
      setSaving(false);
    }
  }

  function isPic(item) {
    return currentUserId > 0 && Number(item?.pic_id) === currentUserId;
  }

  function getEquipment(item) {
    return item?.peralatan || equipmentMap.get(String(item?.id_peralatan));
  }

  return (
    <div className="page-container fade-in-up">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Verifikasi Peralatan</h1>
          <p className="page-subtitle">Pemeriksaan digital sebelum peralatan digunakan</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <button className="btn btn-secondary btn-icon" onClick={loadData} title="Muat ulang" disabled={loading}>
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm((value) => !value)}>
            <Plus size={16} /> Buat Verifikasi
          </button>
        </div>
      </div>

      {showForm && (
        <form className="card card-padded" onSubmit={handleCreate} style={{ marginBottom: 'var(--sp-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)' }}>
            <ClipboardCheck size={21} style={{ color: 'var(--clr-primary-500)' }} />
            <h2 className="section-title" style={{ margin: 0 }}>Buat Draft Verifikasi</h2>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="verification-equipment">Peralatan <span className="required">*</span></label>
              <select id="verification-equipment" className="form-select" value={form.id_peralatan} onChange={(event) => updateForm('id_peralatan', event.target.value)} required>
                <option value="">Pilih peralatan yang belum disetujui</option>
                {pendingEquipment.map((item) => <option key={getEquipmentId(item)} value={getEquipmentId(item)}>{equipmentLabel(item)} - {item.status_verifikasi || 'Belum Diverifikasi'}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="verification-code">Kode Aktivitas <span className="required">*</span></label>
              <input id="verification-code" className="form-input" value={form.kode_aktivitas} onChange={(event) => updateForm('kode_aktivitas', event.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="verification-date">Tanggal Verifikasi</label>
              <input id="verification-date" type="date" className="form-input" value={form.tanggal_verifikasi} onChange={(event) => updateForm('tanggal_verifikasi', event.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="verification-criteria">ID Kriteria</label>
              <input id="verification-criteria" type="number" min="1" className="form-input" value={form.id_kriteria} onChange={(event) => updateForm('id_kriteria', event.target.value)} placeholder="Opsional" />
            </div>
          </div>
          <div style={{ marginTop: 'var(--sp-5)' }}>
            <div className="form-label">Checklist hasil verifikasi</div>
            <div className="form-grid-2" style={{ marginTop: 'var(--sp-3)' }}>
              {CHECKLIST.map(([key, label]) => (
                <div className="form-group" key={key}>
                  <label className="form-label" htmlFor={`check-${key}`}>{label}</label>
                  <select id={`check-${key}`} className="form-select" value={form.hasil_verifikasi[key]} onChange={(event) => updateChecklist(key, event.target.value)}>
                    <option value="S">S - Sesuai</option>
                    <option value="TS">TS - Tidak Sesuai</option>
                    <option value="TB">TB - Tidak Berlaku</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
          <div className="form-grid-2" style={{ marginTop: 'var(--sp-2)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="verification-follow-up">Tindak Lanjut</label>
              <textarea id="verification-follow-up" className="form-textarea" value={form.tindak_lanjut} onChange={(event) => updateForm('tindak_lanjut', event.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="verification-note">Catatan Checklist</label>
              <textarea id="verification-note" className="form-textarea" value={form.catatan} onChange={(event) => updateForm('catatan', event.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)', marginTop: 'var(--sp-5)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Draft'}</button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-5)', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
          <Search className="search-icon" />
          <input className="form-input" placeholder="Cari kode, status, atau peralatan..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <select className="form-select" style={{ minWidth: 170, width: 'auto' }} value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="">Semua Status</option>
          {Object.keys(STATUS_CLASS).map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 'var(--sp-6)' }}><div className="skeleton" style={{ height: 220 }} /></div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FileCheck2 size={32} /></div>
          <p className="empty-state-title">Belum ada data verifikasi</p>
          <p className="empty-state-desc">Buat draft untuk memulai pemeriksaan peralatan.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead><tr><th>Kode</th><th>Peralatan</th><th>Tanggal</th><th>PIC</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {filteredItems.map((item) => {
                const alat = getEquipment(item);
                return (
                  <tr key={item.id_verifikasi}>
                    <td><code>{item.kode_aktivitas}</code></td>
                    <td><strong>{equipmentLabel(alat)}</strong></td>
                    <td>{formatDate(item.tanggal_verifikasi)}</td>
                    <td>{item.pic_user?.name || item.pic_user?.nama || item.pic_id || '-'}</td>
                    <td><span className={`badge ${STATUS_CLASS[item.status] || 'badge-gray'}`}>{item.status}</span></td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => setSelected(item)}>Buka</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="verification-detail-title" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 760, width: 'min(760px, calc(100vw - 32px))' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title" id="verification-detail-title">Detail Verifikasi</h2>
                <p style={{ margin: 0, color: 'var(--clr-dark-500)', fontSize: 'var(--text-sm)' }}>{selected.kode_aktivitas} - {equipmentLabel(getEquipment(selected))}</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelected(null)} aria-label="Tutup"><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
                <span className={`badge ${STATUS_CLASS[selected.status] || 'badge-gray'}`}>{selected.status}</span>
                <span style={{ color: 'var(--clr-dark-500)', fontSize: 'var(--text-sm)' }}>{formatDate(selected.tanggal_verifikasi)}</span>
              </div>
              <div className="form-grid-2">
                {CHECKLIST.map(([key, label]) => {
                  const value = getChecklistResult(selected)[key] || '-';
                  return <div key={key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--clr-dark-100)', padding: 'var(--sp-2) 0' }}><span>{label}</span><strong style={{ color: value === 'TS' ? 'var(--clr-error-500)' : 'var(--clr-success-500)' }}>{value}</strong></div>;
                })}
              </div>
              {selected.catatan && <div className="alert alert-info" style={{ marginTop: 'var(--sp-4)' }}>{selected.catatan}</div>}

              {selected.status === 'Draft' && isPic(selected) && (
                <div style={{ marginTop: 'var(--sp-5)', paddingTop: 'var(--sp-5)', borderTop: '1px solid var(--clr-dark-100)' }}>
                  <label className="form-label" htmlFor="pic-signature">Tanda tangan PIC <span className="required">*</span></label>
                  <input id="pic-signature" className="form-input" placeholder="Nama lengkap / tanda tangan elektronik" value={signature} onChange={(event) => setSignature(event.target.value)} />
                  <button className="btn btn-primary" style={{ marginTop: 'var(--sp-3)' }} disabled={saving || !signature.trim()} onClick={() => runAction('sign')}><Check size={16} /> Ajukan Verifikasi</button>
                </div>
              )}

              {selected.status === 'Diajukan' && canReview && (
                <div style={{ marginTop: 'var(--sp-5)', paddingTop: 'var(--sp-5)', borderTop: '1px solid var(--clr-dark-100)' }}>
                  <label className="form-label" htmlFor="manager-signature">Tanda tangan manager <span className="required">*</span></label>
                  <input id="manager-signature" className="form-input" placeholder="Nama lengkap / tanda tangan elektronik" value={signature} onChange={(event) => setSignature(event.target.value)} />
                  <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" disabled={saving || !signature.trim()} onClick={() => runAction('approve')}><CheckCircle size={16} /> Setujui</button>
                    <button className="btn btn-secondary" disabled={saving || !rejectReason.trim()} onClick={() => runAction('reject')}><XCircle size={16} /> Tolak</button>
                  </div>
                  <div className="form-grid-2" style={{ marginTop: 'var(--sp-3)' }}>
                    <input className="form-input" placeholder="Alasan penolakan" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
                    <input className="form-input" placeholder="Catatan peninjauan" value={rejectNote} onChange={(event) => setRejectNote(event.target.value)} />
                  </div>
                </div>
              )}

              {selected.status === 'Diajukan' && !canReview && <div className="alert alert-info" style={{ marginTop: 'var(--sp-5)' }}><ShieldCheck size={16} /> Menunggu pemeriksaan manager.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
