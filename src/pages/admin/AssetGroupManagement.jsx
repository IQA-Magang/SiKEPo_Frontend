import React, { useState, useEffect } from 'react';
import { FolderKanban, Plus, Pencil, Trash2, X, RefreshCw, Building2 } from 'lucide-react';
import { kelompokAssetApi, labsApi, usersApi } from '../../utils/api.js';
import { ACCESS, ACTIONS, can } from '../../utils/permissions.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';

const EMPTY_FORM = {
  kode: '',
  nama: '',
  lab_id: '',
  pic_id: '',
};

export default function AssetGroupManagement({ onNavigate }) {
  const canAdd = can(ACCESS.MASTER_EQUIPMENT, ACTIONS.ADD);
  const canEdit = can(ACCESS.MASTER_EQUIPMENT, ACTIONS.EDIT);
  const canDelete = can(ACCESS.MASTER_EQUIPMENT, ACTIONS.DELETE);
  const [assetGroups, setAssetGroups] = useState([]);
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
      const [groupsRes, labsRes, usersRes] = await Promise.allSettled([
        kelompokAssetApi.getAll(),
        labsApi.getAll(),
        (canAdd || canEdit) ? usersApi.getAll() : Promise.resolve({ data: [] }),
      ]);

      if (groupsRes.status === 'fulfilled') {
        setAssetGroups(groupsRes.value.data || []);
      } else {
        setError(groupsRes.reason?.message || 'Gagal memuat kelompok aset');
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
      kode: item.kode || '',
      nama: item.nama || '',
      lab_id: item.lab_id ? String(item.lab_id) : '',
      pic_id: item.pic_id ? String(item.pic_id) : '',
    });
    setError('');
    setModal({ mode: 'edit', id: item.id });
  }

  async function handleSave() {
    if (!form.kode.trim() || !form.nama.trim()) {
      setError('Kode dan Nama Kelompok Aset wajib diisi.');
      return;
    }
    if (!form.lab_id) {
      setError('Laboratorium wajib dipilih.');
      return;
    }
    if (!form.pic_id) {
      setError('PIC wajib dipilih.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        kode: form.kode.trim().toUpperCase(),
        nama: form.nama.trim(),
        lab_id: Number(form.lab_id),
        pic_id: Number(form.pic_id),
      };

      if (modal.mode === 'create') {
        await kelompokAssetApi.create(payload);
      } else {
        await kelompokAssetApi.update(modal.id, payload);
      }

      setModal(null);
      toast.success(modal.mode === 'create' ? 'Kelompok aset baru berhasil ditambahkan.' : 'Data kelompok aset berhasil diperbarui.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan kelompok aset.');
      toast.error(err.message || 'Gagal menyimpan kelompok aset.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const targetGroup = assetGroups.find((g) => g.id === id);
    const groupName = targetGroup?.nama ? `"${targetGroup.nama}"` : 'kelompok aset ini';

    const confirmed = await confirm({
      title: 'Hapus Kelompok Aset',
      message: `Apakah Anda yakin ingin menghapus ${groupName}? Seluruh pengelompokan peralatan uji terkait dapat terpengaruh.`,
      confirmText: 'Ya, Hapus Kelompok Aset',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    setDeleting(id);
    try {
      await kelompokAssetApi.delete(id);
      setAssetGroups((prev) => prev.filter((g) => g.id !== id));
      toast.success(`Kelompok aset ${groupName} berhasil dihapus.`);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus kelompok aset.');
    } finally {
      setDeleting(null);
    }
  }

  const filtered = assetGroups.filter((g) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      g.nama?.toLowerCase().includes(q) ||
      g.kode?.toLowerCase().includes(q) ||
      g.lab?.nama_labs?.toLowerCase().includes(q) ||
      g.pic?.name?.toLowerCase().includes(q);

    const matchLab = !filterLab || String(g.lab_id) === filterLab;

    return matchQ && matchLab;
  });

  return (
    <div className="page-container fade-in-up">
      {/* 1. Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Kelompok Aset Peralatan</h1>
          <p className="page-subtitle">
            Klasifikasi pengelompokan aset laboratorium ({filtered.length} terdaftar)
          </p>
        </div>
        {canAdd && (
          <button className="btn btn-primary" onClick={openCreate} id="btn-tambah-kelompok-aset">
            <Plus size={16} /> Tambah Kelompok Aset
          </button>
        )}
      </div>

      {/* 2. Filter Bar */}
      <div className="filter-toolbar">
        <div className="search-bar filter-search-wrap">
          <FolderKanban className="search-icon" size={16} />
          <input
            id="input-search-kelompok-aset"
            className="form-input"
            type="text"
            placeholder="Cari kode, nama kelompok aset, PIC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          id="select-filter-lab-aset"
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
          id="btn-refresh-kelompok-aset"
          title="Segarkan data kelompok aset"
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
            <FolderKanban size={32} />
          </div>
          <p className="empty-state-title">Tidak ada kelompok aset ditemukan</p>
          {canAdd && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> Tambah Kelompok Aset
            </button>
          )}
        </div>
      ) : (
        <div className="table-card">
          <div className="table-wrapper table-borderless">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 130 }}>Kode Kelompok</th>
                  <th>Nama Kelompok Aset</th>
                  <th>Laboratorium</th>
                  <th>PIC Aset</th>
                  <th style={{ width: 100 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => {
                  const labObj = g.lab || labs.find((l) => l.id === g.lab_id);
                  const picObj = g.pic || users.find((u) => u.user_id === g.pic_id);

                  return (
                    <tr key={g.id}>
                      <td>
                        <code className="text-mono-xs" style={{ color: 'var(--clr-primary-700)', fontWeight: 700 }}>
                          {g.kode}
                        </code>
                      </td>
                      <td style={{ fontWeight: 'var(--fw-semibold)' }}>{g.nama}</td>
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
                              {picObj.name ? picObj.name[0].toUpperCase() : 'P'}
                            </div>
                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)' }}>
                              {picObj.name}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--clr-dark-400)', fontSize: 'var(--text-xs)', fontStyle: 'italic' }}>
                            Belum ditentukan
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="table-action-btns">
                          {canEdit && (
                            <button
                              className="btn-action-icon"
                              onClick={() => openEdit(g)}
                              id={`btn-edit-kelompok-aset-${g.id}`}
                              title="Edit Kelompok Aset"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="btn-action-icon btn-action-delete"
                              onClick={() => handleDelete(g.id)}
                              disabled={deleting === g.id}
                              id={`btn-hapus-kelompok-aset-${g.id}`}
                              title="Hapus Kelompok Aset"
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
            <span>Menampilkan <strong>{filtered.length}</strong> dari <strong>{assetGroups.length}</strong> total kelompok aset</span>
            <span>Laboratorium Terkait: <strong>{labs.length}</strong></span>
          </div>
        </div>
      )}

      {/* Modal Kelompok Aset */}
      {modal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="modal" id="modal-kelompok-aset">
            <div className="modal-header">
              <h2 className="modal-title">
                {modal.mode === 'create'
                  ? 'Tambah Kelompok Aset'
                  : 'Edit Kelompok Aset'}
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
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-kode-aset">
                    Kode Kelompok Aset <span className="required">*</span>
                  </label>
                  <input
                    id="modal-kode-aset"
                    className="form-input"
                    placeholder="Contoh: KA-RF-01, KA-CAL-02"
                    value={form.kode}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, kode: e.target.value.toUpperCase() }))
                    }
                  />
                  <div className="form-hint">
                    Kode ini digunakan sebagai referensi penomoran aset ISO/IEC 17025.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="modal-nama-aset">
                    Nama Kelompok Aset <span className="required">*</span>
                  </label>
                  <input
                    id="modal-nama-aset"
                    className="form-input"
                    placeholder="Contoh: Spectrum Analyzer & Signal Generator Group"
                    value={form.nama}
                    onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="modal-lab-aset-select">
                      Laboratorium Terkait <span className="required">*</span>
                    </label>
                    <select
                      id="modal-lab-aset-select"
                      className="form-select"
                      value={form.lab_id}
                      onChange={(e) => setForm((p) => ({ ...p, lab_id: e.target.value }))}
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
                    <label className="form-label" htmlFor="modal-pic-aset-select">
                      PIC Kelompok Aset <span className="required">*</span>
                    </label>
                    <select
                      id="modal-pic-aset-select"
                      className="form-select"
                      value={form.pic_id}
                      onChange={(e) => setForm((p) => ({ ...p, pic_id: e.target.value }))}
                    >
                      <option value="">-- Pilih PIC Aset --</option>
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
                        {canDelete && <button
                className="btn btn-secondary"
                onClick={() => setModal(null)}
                id="btn-batal-kelompok-aset"
              >
                Batal
                        </button>}
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                id="btn-simpan-kelompok-aset"
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
