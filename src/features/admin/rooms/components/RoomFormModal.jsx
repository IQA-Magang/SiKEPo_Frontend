import {
  Button,
  FormField,
  Modal,
} from '../../../../shared/components/ui/index.js';

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
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving} id="btn-batal-ruangan">Batal</Button>
          <Button variant="primary" size="sm" onClick={onSave} disabled={saving} id="btn-simpan-ruangan">
            {saving ? 'Menyimpan...' : isCreating ? 'Simpan Ruangan' : 'Perbarui Ruangan'}
          </Button>
        </>
      )}
    >
      {error && <p className="alert alert-error room-form__error" role="alert">{error}</p>}
      <div className="room-form">
        <FormField
          label="Nama Ruangan"
          htmlFor="modal-nama-ruangan"
          required
          hint="Kode ruangan akan dibuat otomatis oleh sistem setelah data disimpan."
          hintId="modal-nama-ruangan-help"
        >
          <input
            id="modal-nama-ruangan"
            className="form-input"
            placeholder="Contoh: Ruang Uji Anechoic Chamber RF"
            value={form.nama_ruangan}
            onChange={(event) => updateField('nama_ruangan', event.target.value)}
            aria-describedby="modal-nama-ruangan-help"
            required
          />
        </FormField>

        <div className="form-grid-2">
          <FormField label="Lantai" htmlFor="modal-lantai-ruangan" required>
            <input
              id="modal-lantai-ruangan"
              className="form-input"
              placeholder="Contoh: Lantai 1, Lantai 2, Basement"
              value={form.lantai_ruangan}
              onChange={(event) => updateField('lantai_ruangan', event.target.value)}
              required
            />
          </FormField>

          <FormField label="Laboratorium Terkait" htmlFor="modal-lab-select" required>
            <select id="modal-lab-select" className="form-select" value={form.labs_id} onChange={(event) => updateField('labs_id', event.target.value)} required>
              <option value="">-- Pilih Laboratorium --</option>
              {labs.map((lab) => (
                <option key={lab.id} value={lab.id}>{lab.nama_labs} ({lab.kode_labs})</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="PIC Ruangan" htmlFor="modal-pic-select" required>
          <select id="modal-pic-select" className="form-select" value={form.pic_user_id} onChange={(event) => updateField('pic_user_id', event.target.value)} required>
            <option value="">-- Pilih PIC Ruangan --</option>
            {users.map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {user.name} {user.pengelola ? '(Pengelola)' : ''} - {user.role}
              </option>
            ))}
          </select>
        </FormField>
      </div>
    </Modal>
  );
}
