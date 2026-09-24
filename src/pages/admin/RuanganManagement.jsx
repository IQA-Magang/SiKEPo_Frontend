import React, { useState, useEffect } from 'react';
import { DoorOpen, Plus, Pencil, Trash2, X, RefreshCw, Building2, Layers } from 'lucide-react';
import { ruanganApi, labsApi, usersApi, getCurrentUser } from '../../utils/api.js';
import { ACCESS, ACTIONS, can } from '../../utils/permissions.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';

const EMPTY_FORM = {
  nama_ruangan: '',
  kode_ruangan: '',
  lantai_ruangan: 'Lantai 1',
  labs_id: '',
  pic_user_id: '',
};

export default function RuanganManagement({ onNavigate }) {
  const canAdd = can(ACCESS.MASTER_EQUIPMENT, ACTIONS.ADD);
  const canEdit = can(ACCESS.MASTER_EQUIPMENT, ACTIONS.EDIT);
  const canDelete = can(ACCESS.MASTER_EQUIPMENT, ACTIONS.DELETE);
  const [ruanganList, setRuanganList] = useState([]);
  const [labs, setLabs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'create'|'edit', id }
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');
  const [filterLab, setFilterLab] = useState('');

  const toast = useToast();
  const confirm = useConfirm();

  // Escape key listener for modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && modal) {
        setModal(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [ruanganRes, labsRes, usersRes] = await Promise.allSettled([
        ruanganApi.getAll(),
        labsApi.getAll(),
        (canAdd || canEdit) ? usersApi.getAll() : Promise.resolve({ data: [] }),
      ]);

      if (ruanganRes.status === 'fulfilled') {
        setRuanganList(ruanganRes.value.data || []);
      } else {
        setError(ruanganRes.reason?.message || 'Gagal memuat ruangan');
      }

      if (labsRes.status === 'fulfilled') {
        setLabs(labsRes.value.data || []);
      }

      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setError('');
    setModal({ mode: 'create' });
  }

  function openEdit(item) {
    setForm({
      nama_ruangan: item.nama_ruangan || '',
      kode_ruangan: item.kode_ruangan || '',
      lantai_ruangan: item.lantai_ruangan || 'Lantai 1',
      labs_id: item.labs_id ? String(item.labs_id) : '',
      pic_user_id: item.pic_user_id ? String(item.pic_user_id) : '',
    });
    setError('');
    setModal({ mode: 'edit', id: item.id });
  }

  async function handleSave() {
    if (!form.nama_ruangan.trim() || !form.kode_ruangan.trim() || !form.lantai_ruangan.trim() || !form.labs_id || !form.pic_user_id) {
      setError('Kode Ruangan, Nama Ruangan, Lantai, Laboratorium, dan PIC Ruangan wajib diisi.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        nama_ruangan: form.nama_ruangan.trim(),
        kode_ruangan: form.kode_ruangan.trim().toUpperCase(),
        lantai_ruangan: form.lantai_ruangan.trim(),
        labs_id: form.labs_id ? Number(form.labs_id) : null,
        pic_user_id: form.pic_user_id ? Number(form.pic_user_id) : null,
      };

      if (modal.mode === 'create') {
        await ruanganApi.create(payload);
      } else {
        await ruanganApi.update(modal.id, payload);
      }

      setModal(null);
      toast.success(modal.mode === 'create' ? 'Ruangan uji baru berhasil ditambahkan.' : 'Data ruangan uji berhasil diperbarui.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan ruangan.');
      toast.error(err.message || 'Gagal menyimpan ruangan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const targetRoom = ruanganList.find((r) => r.id === id);
    const roomName = targetRoom?.nama_ruangan ? `"${targetRoom.nama_ruangan}"` : 'ruangan ini';

    const confirmed = await confirm({
      title: 'Hapus Ruangan Uji',
      message: `Apakah Anda yakin ingin menghapus ${roomName}? Seluruh data penempatan alat pada ruangan ini akan terpengaruh.`,
      confirmText: 'Ya, Hapus Ruangan',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    setDeleting(id);
    try {
      await ruanganApi.delete(id);
      setRuanganList((prev) => prev.filter((r) => r.id !== id));
      toast.success(`Ruangan ${roomName} berhasil dihapus.`);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus ruangan.');
    } finally {
      setDeleting(null);
    }
  }

  const filtered = ruanganList.filter((r) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      r.nama_ruangan?.toLowerCase().includes(q) ||
      r.kode_ruangan?.toLowerCase().includes(q) ||
      r.lantai_ruangan?.toLowerCase().includes(q) ||
      r.labs?.nama_labs?.toLowerCase().includes(q) ||
      r.pic_user?.name?.toLowerCase().includes(q);

    const matchLab = !filterLab || String(r.labs_id) === filterLab;

    return matchQ && matchLab;
  });

  return (
    <div className="page-container fade-in-up">
      {/* 1. Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Lokasi Penyimpanan</h1>
          <p className="page-subtitle">
            Daftar ruangan uji dan alokasi laboratorium ({filtered.length} terdaftar)
          </p>
        </div>
        {canAdd && (
          <button className="btn btn-primary" onClick={openCreate} id="btn-tambah-ruangan">
            <Plus size={16} /> Tambah Ruangan
          </button>
        )}
      </div>

      {/* 2. Filter Bar */}
      <div className="filter-toolbar">
        <div className="search-bar filter-search-wrap">
          <DoorOpen className="search-icon" size={16} />
          <input
            id="input-search-ruangan"
            className="form-input"
            type="text"
            placeholder="Cari kode, nama ruangan, PIC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          id="select-filter-lab"
          className="form-select filter-select"
          value={filterLab}
          onChange={(e) => setFilterLab(e.target.value)}
        >
          <option value="">Semua Laboratorium</option>
          {labs.map((l) => (
            <option key={l.id} value={String(l.id)}>
              {l.nama_labs} ({l.kode_labs})
            </option>
          ))}
        </select>

        <button
          className="btn btn-secondary btn-icon"
          onClick={loadData}
          id="btn-refresh-ruangan"
          title="Segarkan data ruangan"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* 3. Table Content Card */}
      {loading ? (
        <div className="card skeleton-list">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton skeleton-row" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <DoorOpen size={32} />
          </div>
          <p className="empty-state-title">Tidak ada ruangan ditemukan</p>
          {canAdd && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> Tambah Ruangan
            </button>
          )}
        </div>
      ) : (
        <div className="table-card">
          <div className="table-wrapper table-borderless">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 130 }}>Kode Ruangan</th>
                  <th>Nama Ruangan</th>
                  <th>Laboratorium</th>
                  <th>Lantai</th>
                  <th>PIC Ruangan</th>
                  <th style={{ width: 100 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const labObj = r.labs || labs.find((l) => l.id === r.labs_id);
                  const picObj = r.pic_user || users.find((u) => u.user_id === r.pic_user_id);

                  return (
                    <tr key={r.id}>
                      <td>
                        <code className="text-mono-xs" style={{ color: 'var(--clr-primary-700)', fontWeight: 700 }}>
                          {r.kode_ruangan}
                        </code>
                      </td>
                      <td style={{ fontWeight: 'var(--fw-semibold)' }}>{r.nama_ruangan}</td>
                      <td>
                        {labObj ? (
                          <span className="badge badge-gray" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Building2 size={12} />
                            {labObj.nama_labs}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--clr-dark-400)', fontSize: 'var(--text-xs)' }}>
                            -
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-dark-600)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Layers size={12} />
                          {r.lantai_ruangan}
                        </span>
                      </td>
                      <td>
                        {picObj ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                            <div
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: 'var(--clr-primary-100)',
                                color: 'var(--clr-primary-700)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 10,
                                fontWeight: 700,
                              }}
                            >
                              {picObj.name ? picObj.name[0].toUpperCase() : 'U'}
                            </div>
                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)' }}>
                              {picObj.name}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--clr-dark-400)', fontSize: 'var(--text-xs)', fontStyle: 'italic' }}>
                            Belum ada PIC
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="table-action-btns">
                          {canEdit && (
                            <button
                              className="btn-action-icon"
                              onClick={() => openEdit(r)}
                              id={`btn-edit-ruangan-${r.id}`}
                              title="Edit Ruangan"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="btn-action-icon btn-action-delete"
                              onClick={() => handleDelete(r.id)}
                              disabled={deleting === r.id}
                              id={`btn-hapus-ruangan-${r.id}`}
                              title="Hapus Ruangan"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 5. Summary Footer */}
          <div className="table-footer-summary">
            <span>Menampilkan <strong>{filtered.length}</strong> dari <strong>{ruanganList.length}</strong> total ruangan uji</span>
            <span>Tersebar di <strong>{labs.length}</strong> laboratorium</span>
          </div>
        </div>
      )}

      {/* Modal Ruangan */}
      {modal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="modal" id="modal-ruangan">
            <div className="modal-header">
              <h2 className="modal-title">
                {modal.mode === 'create' ? 'Tambah Ruangan Uji' : 'Edit Ruangan Uji'}
              </h2>
              <button className="modal-close" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="alert alert-error" style={{ marginBottom: 'var(--sp-4)' }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="modal-kode-ruangan">
                      Kode Ruangan <span className="required">*</span>
                    </label>
                    <input
                      id="modal-kode-ruangan"
                      className="form-input"
                      placeholder="Contoh: R-101, R-EMC-01"
                      value={form.kode_ruangan}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, kode_ruangan: e.target.value.toUpperCase() }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="modal-lantai-ruangan">
                      Lantai <span className="required">*</span>
                    </label>
                    <input
                      id="modal-lantai-ruangan"
                      className="form-input"
                      placeholder="Contoh: Lantai 1, Lantai 2, Basement"
                      value={form.lantai_ruangan}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, lantai_ruangan: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="modal-nama-ruangan">
                    Nama Ruangan <span className="required">*</span>
                  </label>
                  <input
                    id="modal-nama-ruangan"
                    className="form-input"
                    placeholder="Contoh: Ruang Uji Anechoic Chamber RF"
                    value={form.nama_ruangan}
                    onChange={(e) => setForm((p) => ({ ...p, nama_ruangan: e.target.value }))}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="modal-lab-select">
                      Laboratorium Terkait <span className="required">*</span>
                    </label>
                    <select
                      id="modal-lab-select"
                      className="form-select"
                      value={form.labs_id}
                      onChange={(e) => setForm((p) => ({ ...p, labs_id: e.target.value }))}
                    >
                      <option value="">-- Pilih Laboratorium --</option>
                      {labs.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nama_labs} ({l.kode_labs})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="modal-pic-select">
                      PIC Ruangan <span className="required">*</span>
                    </label>
                    <select
                      id="modal-pic-select"
                      className="form-select"
                      value={form.pic_user_id}
                      onChange={(e) => setForm((p) => ({ ...p, pic_user_id: e.target.value }))}
                    >
                      <option value="">-- Pilih PIC Ruangan --</option>
                      {users.map((u) => (
                        <option key={u.user_id} value={u.user_id}>
                          {u.name} {u.pic ? '(PIC)' : ''} - {u.role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setModal(null)}
                id="btn-batal-ruangan"
              >
                Batal
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                id="btn-simpan-ruangan"
              >
                {saving ? (
                  <>
                    <div className="spinner" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
