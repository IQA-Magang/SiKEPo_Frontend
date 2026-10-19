import { Button, FormField, Modal } from '../../../../shared/components/ui/index.js';

export default function CategoryEditModal({
  category,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <Modal
      isOpen={Boolean(category)}
      onClose={onClose}
      title="Edit Kategori"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="edit-category-form"
            disabled={saving}
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </>
      )}
    >
      {category && (
        <form id="edit-category-form" className="category-management__edit-form" onSubmit={onSubmit}>
          <FormField label="Nama Kategori" htmlFor="edit-category-name" required>
            <input
              id="edit-category-name"
              className="form-input"
              value={category.nama_kategori || ''}
              onChange={(event) => onChange((current) => ({
                ...current,
                nama_kategori: event.target.value,
              }))}
              required
            />
          </FormField>
          <FormField label="Deskripsi" htmlFor="edit-category-description">
            <textarea
              id="edit-category-description"
              className="form-textarea"
              value={category.description || ''}
              onChange={(event) => onChange((current) => ({
                ...current,
                description: event.target.value,
              }))}
              maxLength={255}
            />
          </FormField>
        </form>
      )}
    </Modal>
  );
}
