import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, RefreshCw, UserCheck, Building2 } from 'lucide-react';
import { labsApi, usersApi } from '../../utils/api.js';
import { ACCESS, ACTIONS, can } from '../../utils/permissions.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';

const EMPTY_FORM = { nama_labs: '', kode_labs: '', manager_id: '' };

export default function LabsManagement({ onNavigate }) {
  const canAdd = can(ACCESS.MASTER_LAB, ACTIONS.ADD);
  const canEdit = can(ACCESS.MASTER_LAB, ACTIONS.EDIT);
  const canDelete = can(ACCESS.MASTER_LAB, ACTIONS.DELETE);
  const [labs, setLabs] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'create'|'edit', id }
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState('');

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
      const [labsRes, usersRes] = await Promise.allSettled([
        labsApi.getAll(),
        (canAdd || canEdit) ? usersApi.getAll() : Promise.resolve({ data: [] }),
      ]);

      if (labsRes.status === 'fulfilled') {
        setLabs(labsRes.value.data || []);
      } else {
        setError(labsRes.reason?.message || 'Gagal memuat data laboratorium');
      }

      if (usersRes.status === 'fulfilled') {
        const allUsers = usersRes.value.data || [];
        const managerUsers = allUsers.filter((u) => u.role === 'manager');
        setManagers(managerUsers.length > 0 ? managerUsers : allUsers);
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

  function openEdit(lab) {
    setForm({
      nama_labs: lab.nama_labs || '',
      kode_labs: lab.kode_labs || '',
      manager_id: lab.manager_id ? String(lab.manager_id) : '',
    });
    setError('');
    setModal({ mode: 'edit', id: lab.id });
  }

  async function handleSave() {
    if (!form.nama_labs.trim() || !form.kode_labs.trim() || !form.manager_id) {
      setError('Kode Lab, Nama Lab, dan Manager / Penanggung Jawab wajib diisi.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        nama_labs: form.nama_labs.trim(),
        kode_labs: form.kode_labs.trim().toUpperCase(),
        manager_id: form.manager_id ? Number(form.manager_id) : null,
      };

      if (modal.mode === 'create') {
        await labsApi.create(payload);
      } else {
        await labsApi.update(modal.id, payload);
      }

      setModal(null);
      toast.success(modal.mode === 'create' ? 'Laboratorium baru berhasil ditambahkan.' : 'Data laboratorium berhasil diperbarui.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan laboratorium.');
      toast.error(err.message || 'Gagal menyimpan laboratorium.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const targetLab = labs.find((item) => item.id === id);
    const labName = targetLab?.nama_labs ? `"${targetLab.nama_labs}"` : 'laboratorium ini';

    const confirmed = await confirm({
      title: 'Hapus Laboratorium',
      message: `Apakah Anda yakin ingin menghapus ${labName}? Seluruh data ruangan yang berelasi dapat terpengaruh.`,
      confirmText: 'Ya, Hapus Lab',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;

    setDeleting(id);
    try {
      await labsApi.delete(id);
      setLabs((prev) => prev.filter((item) => item.id !== id));
      toast.success(`Laboratorium ${labName} berhasil dihapus.`);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus laboratorium.');
    } finally {
      setDeleting(null);
    }
  }

  const filtered = labs.filter((lab) => {
    const q = search.toLowerCase();
    return (
      !q ||
      lab.nama_labs?.toLowerCase().includes(q) ||
      lab.kode_labs?.toLowerCase().includes(q) ||
      lab.manager?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container fade-in-up">
      {/* 1. Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Laboratorium Pengujian</h1>
          <p className="page-subtitle">
            Kelola laboratorium uji Telkom Test House ({filtered.length} terdaftar)
          </p>
        </div>
        {canAdd && (
          <button className="btn btn-primary" onClick={openCreate} id="btn-tambah-lab">
            <Plus size={16} /> Tambah Lab
          </button>
        )}
      </div>

      {/* 2. Filters & Actions */}
      <div className="filter-toolbar">
        <div className="search-bar filter-search-wrap">
          <Building2 className="search-icon" size={16} />
          <input
            id="input-search-lab"
            className="form-input"
            type="text"
            placeholder="Cari kode lab, nama lab, manager..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="btn btn-secondary btn-icon"
          onClick={loadData}
          id="btn-refresh-lab"
          title="Segarkan data laboratorium"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* 3. Table / Content Card */}
      {loading ? (
        <div className="card skeleton-list">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton skeleton-row" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Building2 size={32} />
          </div>
          <p className="empty-state-title">Tidak ada laboratorium ditemukan</p>
          {canAdd && (
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={16} /> Tambah Lab
            </button>
          )}
        </div>
      ) : (
        <div className="table-card">
          <div className="table-wrapper table-borderless">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Kode Lab</th>
                  <th>Nama Laboratorium</th>
                  <th>Penanggung Jawab / Manager</th>
                  <th style={{ width: 100 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lab) => {
                  const managerObj =
                    lab.manager ||
                    managers.find((m) => m.user_id === lab.manager_id);

                  return (
                    <tr key={lab.id}>
                      <td>
                        <code className="text-mono-xs" style={{ color: 'var(--clr-primary-700)', fontWeight: 700 }}>
                          {lab.kode_labs}
                        </code>
                      </td>
                      <td style={{ fontWeight: 'var(--fw-semibold)' }}>{lab.nama_labs}</td>
                      <td>
                        {managerObj ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                background: 'var(--clr-primary-50)',
                                color: 'var(--clr-primary-600)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              {managerObj.name
                                ? managerObj.name[0].toUpperCase()
                                : 'M'}
                            </div>
                            <div>
                              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-medium)' }}>
                                {managerObj.name}
                              </div>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-dark-500)' }}>
                                {managerObj.email}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--clr-dark-400)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
                            Belum ditentukan
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="table-action-btns">
                          {canEdit && (
                            <button
                              className="btn-action-icon"
                              onClick={() => openEdit(lab)}
                              id={`btn-edit-lab-${lab.id}`}
                              title="Edit Lab"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="btn-action-icon btn-action-delete"
                              onClick={() => handleDelete(lab.id)}
                              disabled={deleting === lab.id}
                              id={`btn-hapus-lab-${lab.id}`}
                              title="Hapus Lab"
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
            <span>Menampilkan <strong>{filtered.length}</strong> dari <strong>{labs.length}</strong> total laboratorium pengujian</span>
            <span>Standar: <strong>ISO/IEC 17025:2017</strong></span>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit */}
      {modal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="modal" id="modal-lab">
            <div className="modal-header">
              <h2 className="modal-title">
                {modal.mode === 'create' ? 'Tambah Laboratorium' : 'Edit Laboratorium'}
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
                  <label className="form-label" htmlFor="modal-lab-kode">
                    Kode Laboratorium <span className="required">*</span>
                  </label>
                  <input
                    id="modal-lab-kode"
                    className="form-input"
                    placeholder="Contoh: LAB-RF, LAB-EMC, LAB-CAL"
                    value={form.kode_labs}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, kode_labs: e.target.value.toUpperCase() }))
                    }
                  />
                  <div className="form-hint">Gunakan kode unik berupa singkatan resmi lab.</div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="modal-lab-nama">
                    Nama Laboratorium <span className="required">*</span>
                  </label>
                  <input
                    id="modal-lab-nama"
                    className="form-input"
                    placeholder="Contoh: Lab Radio Frequency & Microwave"
                    value={form.nama_labs}
                    onChange={(e) => setForm((p) => ({ ...p, nama_labs: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="modal-lab-manager">
                    Manager / Penanggung Jawab <span className="required">*</span>
                  </label>
                  <select
                    id="modal-lab-manager"
                    className="form-select"
                    value={form.manager_id}
                    onChange={(e) => setForm((p) => ({ ...p, manager_id: e.target.value }))}
                  >
                    <option value="">-- Pilih Manager Lab --</option>
                    {managers.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.name} ({m.position || m.role})
                      </option>
                    ))}
                  </select>
                  <div className="form-hint">
                    Manager ini akan menerima notifikasi status peralatan untuk lab terkait.
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setModal(null)}
                id="btn-batal-lab"
              >
                Batal
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                id="btn-simpan-lab"
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
