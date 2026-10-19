import { Button, Modal } from '../../../../shared/components/ui/index.js';

export default function RoomFormModal({
  mode,
  form,
  labs,
  users,
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
      title={isCreating ? 'Tambah Ruangan Uji' : 'Edit Ruangan Uji'}
      size="md"
      className="modal-ruangan"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} id="btn-batal-ruangan">Batal</Button>
          <Button variant="primary" onClick={onSave} disabled={saving} id="btn-simpan-ruangan">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </>
      )}
    >
      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--sp-4)' }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="modal-kode-ruangan">Kode Ruangan <span className="required">*</span></label>
            <input
              id="modal-kode-ruangan"
              className="form-input"
              placeholder="Contoh: R-101, R-EMC-01"
              value={form.kode_ruangan}
              onChange={(event) => updateField('kode_ruangan', event.target.value.toUpperCase())}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="modal-lantai-ruangan">Lantai <span className="required">*</span></label>
            <input
              id="modal-lantai-ruangan"
              className="form-input"
              placeholder="Contoh: Lantai 1, Lantai 2, Basement"
              value={form.lantai_ruangan}
              onChange={(event) => updateField('lantai_ruangan', event.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="modal-nama-ruangan">Nama Ruangan <span className="required">*</span></label>
          <input
            id="modal-nama-ruangan"
            className="form-input"
            placeholder="Contoh: Ruang Uji Anechoic Chamber RF"
            value={form.nama_ruangan}
            onChange={(event) => updateField('nama_ruangan', event.target.value)}
          />
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="modal-lab-select">Laboratorium Terkait <span className="required">*</span></label>
            <select id="modal-lab-select" className="form-select" value={form.labs_id} onChange={(event) => updateField('labs_id', event.target.value)}>
              <option value="">-- Pilih Laboratorium --</option>
              {labs.map((lab) => (
                <option key={lab.id} value={lab.id}>{lab.nama_labs} ({lab.kode_labs})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="modal-pic-select">PIC Ruangan <span className="required">*</span></label>
            <select id="modal-pic-select" className="form-select" value={form.pic_user_id} onChange={(event) => updateField('pic_user_id', event.target.value)}>
              <option value="">-- Pilih PIC Ruangan --</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.name} {user.pengelola ? '(Pengelola)' : ''} - {user.role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
