import React, { useState, useEffect } from 'react';
import { Building2, Plus, Pencil, Trash2, X, RefreshCw, UserCheck, Shield } from 'lucide-react';
import { labsApi, usersApi } from '../../utils/api.js';
import { ACCESS, ACTIONS, can } from '../../utils/permissions.js';

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

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [labsRes, usersRes] = await Promise.allSettled([
        labsApi.getAll(),
        usersApi.getAll(),
      ]);

      if (labsRes.status === 'fulfilled') {
        setLabs(labsRes.value.data || []);
      } else {
        setError(labsRes.reason?.message || 'Gagal memuat data laboratorium');
      }

      if (usersRes.status === 'fulfilled') {
        const allUsers = usersRes.value.data || [];
        // Filter users who are managers or have managerial roles
        const mgrs = allUsers.filter((u) => u.role === 'manager' || u.role === 'admin');
        setManagers(mgrs.length > 0 ? mgrs : allUsers);
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
    if (!form.nama_labs.trim() || !form.kode_labs.trim()) {
      setError('Kode Lab dan Nama Lab wajib diisi.');
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
      await loadData();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan laboratorium.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Yakin ingin menghapus laboratorium ini?')) return;
    setDeleting(id);
    try {
      await labsApi.delete(id);
      setLabs((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err.message || 'Gagal menghapus laboratorium.');
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
      {/* Header */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--sp-3)',
        }}
      >
        <div>
          <h1 className="page-title">Laboratorium Pengujian</h1>
          <p className="page-subtitle">
            Kelola laboratorium uji Telkom Test House ({filtered.length} terdaftar)
          </p>
        </div>
        {canAdd && <button className="btn btn-primary" onClick={openCreate} id="btn-tambah-lab">
          <Plus size={16} /> Tambah Lab
        </button>}
      </div>

      {/* Filters & Actions */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--sp-3)',
          marginBottom: 'var(--sp-5)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
          <Building2 className="search-icon" style={{ width: 16, height: 16 }} />
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
          title="Segarkan data"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Table / Content */}
      {loading ? (
        <div
          className="card"
          style={{
            padding: 'var(--sp-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-3)',
          }}
        >
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 52 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Building2 size={32} />
          </div>
          <p className="empty-state-title">Tidak ada laboratorium ditemukan</p>
          {canAdd && <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Tambah Lab
          </button>}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Kode Lab</th>
                <th>Nama Laboratorium</th>
                <th>Penanggung Jawab / Manager</th>
                <th style={{ width: 120 }}>Aksi</th>
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
                      <code
                        style={{
                          fontSize: 'var(--text-xs)',
                          background: 'var(--clr-dark-100)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--clr-primary-700)',
                          fontWeight: 'var(--fw-bold)',
                        }}
                      >
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
                      <div style={{ display: 'flex', gap: 4 }}>
                        {canEdit && <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(lab)}
                          id={`btn-edit-lab-${lab.id}`}
                          title="Edit Lab"
                        >
                          <Pencil size={13} />
                        </button>}
                        {canDelete && <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(lab.id)}
                          disabled={deleting === lab.id}
                          id={`btn-hapus-lab-${lab.id}`}
                          title="Hapus Lab"
                        >
                          <Trash2 size={13} />
                        </button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
                    Manager / Penanggung Jawab
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
