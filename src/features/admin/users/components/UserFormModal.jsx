import { Button, ErrorState, Modal } from '../../../../shared/components/ui/index.js';

export default function UserFormModal({
  mode,
  form,
  labs,
  isAdmin,
  error,
  saving,
  onChange,
  onClose,
  onSave,
}) {
  const isCreating = mode === 'create';
  const updateField = (field, value) => onChange((current) => ({ ...current, [field]: value }));

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isCreating ? 'Tambah Pengguna' : 'Edit Pengguna'}
      size="lg"
      footer={(
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Batal</Button>
          <Button variant="primary" size="sm" onClick={onSave} disabled={saving}>
            {saving ? 'Menyimpan...' : isCreating ? 'Simpan Pengguna' : 'Perbarui Pengguna'}
          </Button>
        </>
      )}
    >
      {error && <ErrorState title="Validasi gagal" message={error} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="modal-nip">NIP <span className="required">*</span></label>
            <input id="modal-nip" className="form-input" placeholder="19850101" value={form.nip} onChange={(event) => updateField('nip', event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="modal-name">Nama Lengkap <span className="required">*</span></label>
            <input id="modal-name" className="form-input" value={form.name} onChange={(event) => updateField('name', event.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="modal-email">Email <span className="required">*</span></label>
            <input id="modal-email" type="email" className="form-input" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
          </div>
          {isAdmin && (
            <div className="form-group">
              <label className="form-label" htmlFor="modal-password">
                Password {mode === 'edit' && <span style={{ color: 'var(--clr-dark-400)', fontWeight: 400 }}>(kosongkan jika tidak diubah)</span>}
              </label>
              <input id="modal-password" type="password" className="form-input" value={form.password} onChange={(event) => updateField('password', event.target.value)} autoComplete="new-password" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="modal-role">Role <span className="required">*</span></label>
            <select id="modal-role" className="form-select" value={form.role} disabled={!isAdmin} onChange={(event) => updateField('role', event.target.value)}>
              <option value="admin">Administrator</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="modal-lab">Laboratorium {form.role !== 'admin' && <span className="required">*</span>}</label>
            <select id="modal-lab" className="form-select" value={form.labs_id} disabled={!isAdmin} onChange={(event) => updateField('labs_id', event.target.value)}>
              <option value="">Pilih laboratorium</option>
              {labs.map((lab) => <option key={lab.id} value={lab.id}>{lab.nama_labs}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="modal-position">Jabatan <span className="required">*</span></label>
            <input id="modal-position" className="form-input" value={form.position} onChange={(event) => updateField('position', event.target.value)} />
          </div>
          {isAdmin && (
            <div className="form-group">
              <label className="form-label" htmlFor="modal-pengelola">Pengelola</label>
              <label className="checkbox-row" htmlFor="modal-pengelola">
                <input id="modal-pengelola" type="checkbox" checked={form.pengelola} onChange={(event) => updateField('pengelola', event.target.checked)} />
                <span>Jadikan pengelola lab</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
