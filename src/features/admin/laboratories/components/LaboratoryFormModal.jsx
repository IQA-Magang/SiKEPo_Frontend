import {
  Button,
  ErrorState,
  FormField,
  Modal,
} from '../../../../shared/components/ui/index.js';

export default function LaboratoryFormModal({
  mode,
  form,
  managers,
  error,
  saving,
  onChange,
  onClose,
  onSave,
}) {
  const isCreating = mode === 'create';

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isCreating ? 'Tambah Laboratorium' : 'Edit Laboratorium'}
      size="md"
      footer={(
        <>
          <Button variant="secondary" size="sm" onClick={onClose} id="btn-batal-lab">Batal</Button>
          <Button variant="primary" size="sm" onClick={onSave} disabled={saving} id="btn-simpan-lab">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </>
      )}
    >
      {error && <ErrorState title="Validasi gagal" message={error} />}
      <div className="lab-management__form">
        <FormField
          label="Kode Laboratorium"
          htmlFor="modal-lab-kode"
          required
          hint="Gunakan kode unik berupa singkatan resmi lab."
          hintId="modal-lab-kode-help"
        >
          <input
            id="modal-lab-kode"
            className="form-input"
            placeholder="Contoh: LAB-RF, LAB-EMC, LAB-CAL"
            value={form.kode_labs}
            onChange={(event) => onChange((current) => ({
              ...current,
              kode_labs: event.target.value.toUpperCase(),
            }))}
            aria-describedby="modal-lab-kode-help"
          />
        </FormField>

        <FormField label="Nama Laboratorium" htmlFor="modal-lab-nama" required>
          <input
            id="modal-lab-nama"
            className="form-input"
            placeholder="Contoh: Lab Radio Frequency & Microwave"
            value={form.nama_labs}
            onChange={(event) => onChange((current) => ({
              ...current,
              nama_labs: event.target.value,
            }))}
          />
        </FormField>

        <FormField
          label="Manager / Penanggung Jawab"
          htmlFor="modal-lab-manager"
          required
          hint="Manager ini akan menerima notifikasi status peralatan untuk lab terkait."
          hintId="modal-lab-manager-help"
        >
          <select
            id="modal-lab-manager"
            className="form-select"
            value={form.manager_id}
            onChange={(event) => onChange((current) => ({
              ...current,
              manager_id: event.target.value,
            }))}
            aria-describedby="modal-lab-manager-help"
          >
            <option value="">-- Pilih Manager Lab --</option>
            {managers.map((manager) => (
              <option key={manager.user_id} value={manager.user_id}>
                {manager.name} ({manager.position || manager.role})
              </option>
            ))}
          </select>
        </FormField>
      </div>
    </Modal>
  );
}
