import {
  Button,
  FormField,
  Modal,
} from '../../../../shared/components/ui/index.js';

export default function AssetGroupFormModal({
  isOpen,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreating ? 'Tambah Kelompok Aset' : 'Edit Kelompok Aset'}
      size="md"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button variant="primary" onClick={onSave} disabled={saving}>
            {saving
              ? 'Menyimpan...'
              : isCreating
                ? 'Simpan Kelompok Aset'
                : 'Perbarui Kelompok Aset'}
          </Button>
        </>
      )}
    >
      {error && (
        <p className="alert alert-error asset-group-form__error" role="alert">
          {error}
        </p>
      )}

      <div className="asset-group-form">
        <FormField
          label="Kode Kelompok Aset"
          htmlFor="modal-kode-aset"
          required
          hint="Kode ini digunakan sebagai referensi penomoran aset ISO/IEC 17025."
          hintId="modal-kode-aset-help"
        >
          <input
            id="modal-kode-aset"
            className="form-input"
            placeholder="Contoh: KA-RF-01, KA-CAL-02"
            value={form.kode}
            onChange={(event) => onChange((current) => ({
              ...current,
              kode: event.target.value.toUpperCase(),
            }))}
            aria-describedby="modal-kode-aset-help"
          />
        </FormField>

        <FormField
          label="Nama Kelompok Aset"
          htmlFor="modal-nama-aset"
          required
        >
          <input
            id="modal-nama-aset"
            className="form-input"
            placeholder="Contoh: Spectrum Analyzer & Signal Generator Group"
            value={form.nama}
            onChange={(event) => onChange((current) => ({
              ...current,
              nama: event.target.value,
            }))}
          />
        </FormField>

        <div className="form-grid-2">
          <FormField
            label="Laboratorium Terkait"
            htmlFor="modal-lab-aset-select"
            required
          >
            <select
              id="modal-lab-aset-select"
              className="form-select"
              value={form.lab_id}
              onChange={(event) => onChange((current) => ({
                ...current,
                lab_id: event.target.value,
              }))}
            >
              <option value="">-- Pilih Laboratorium --</option>
              {labs.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.nama_labs} ({lab.kode_labs})
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="PIC Kelompok Aset"
            htmlFor="modal-pic-aset-select"
            required
          >
            <select
              id="modal-pic-aset-select"
              className="form-select"
              value={form.pic_id}
              onChange={(event) => onChange((current) => ({
                ...current,
                pic_id: event.target.value,
              }))}
            >
              <option value="">-- Pilih PIC Aset --</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.name} {user.pengelola ? '(Pengelola)' : ''} - {user.role}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>
    </Modal>
  );
}
