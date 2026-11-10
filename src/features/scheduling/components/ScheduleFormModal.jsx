import { Button, FormField, Modal } from "../../../shared/components/ui/index.js";
import { getEquipmentId } from "../../../shared/services/api.js";

export default function ScheduleFormModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  onChange,
  availableEquipment,
  saving,
  allowAllFrequencies = false,
}) {
  const scheduleLabel = form.jenis_jadwal === "pengecekan_antara"
    ? "Pengecekan Antara"
    : form.jenis_jadwal === "pemeliharaan"
      ? "Pemeliharaan"
      : "Pengecekan / Pemeliharaan";
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={saving}>
        Batal
      </Button>
      <Button
        type="submit"
        form="schedule-create-form"
        variant="primary"
        disabled={saving || availableEquipment.length === 0}
      >
        {saving ? "Menyimpan..." : "Simpan Jadwal"}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={saving ? undefined : onClose}
      title={`Buat Jadwal ${scheduleLabel}`}
      description="Pengecekan antara dan pemeliharaan tersimpan sebagai jadwal terpisah."
      size="xl"
      className="schedule-form-modal"
      footer={footer}
    >
      <form id="schedule-create-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <FormField label="Peralatan" htmlFor="schedule-equipment" required>
            <select
              id="schedule-equipment"
              className="form-select"
              name="peralatan_id"
              value={form.peralatan_id}
              onChange={onChange}
              required
            >
              <option value="">Pilih peralatan</option>
              {availableEquipment.map((item) => (
                <option key={getEquipmentId(item)} value={getEquipmentId(item)}>
                  {item.nomor_aset ? `${item.nomor_aset} — ` : ""}
                  {item.nama_peralatan || "Peralatan"}
                </option>
              ))}
            </select>
            {availableEquipment.length === 0 && (
              <span className="form-hint">
                Semua peralatan sudah memiliki jadwal untuk jenis ini.
              </span>
            )}
          </FormField>

          <FormField
            label="Frekuensi Penggunaan"
            htmlFor="schedule-frequency"
            hint={form.jenis_jadwal === "pengecekan_antara"
              ? "Pengecekan antara digunakan untuk peralatan dengan frekuensi tinggi."
              : form.jenis_jadwal === "pemeliharaan"
                ? "Pemeliharaan digunakan untuk peralatan dengan frekuensi sedang atau rendah."
                : "Frekuensi tinggi membuat jadwal pengecekan antara; frekuensi sedang atau rendah untuk pemeliharaan."}
            required
          >
            <select
              id="schedule-frequency"
              className="form-select"
              name="frekuensi_penggunaan"
              value={form.frekuensi_penggunaan}
              onChange={onChange}
              required
            >
              <option value="">Pilih frekuensi penggunaan</option>
              {(allowAllFrequencies || form.jenis_jadwal === "pengecekan_antara" || !form.jenis_jadwal) && <option value="tinggi">Tinggi</option>}
              {(allowAllFrequencies || form.jenis_jadwal === "pemeliharaan" || !form.jenis_jadwal) && (
                <>
                  <option value="sedang">Sedang</option>
                  <option value="rendah">Rendah</option>
                </>
              )}
            </select>
          </FormField>

          <FormField label="Interval (bulan)" htmlFor="schedule-interval" required>
            <input
              id="schedule-interval"
              className="form-input"
              type="number"
              name="interval_bulan"
              min="1"
              max="120"
              step="1"
              value={form.interval_bulan}
              onChange={onChange}
              required
            />
          </FormField>

          <FormField label="Tanggal Terakhir" htmlFor="schedule-last-date" required>
            <input
              id="schedule-last-date"
              className="form-input"
              type="date"
              name="tanggal_terakhir"
              value={form.tanggal_terakhir}
              onChange={onChange}
              required
            />
          </FormField>

          {form.jenis_jadwal === "pengecekan_antara" && (
            <FormField label="Acuan pembanding (opsional)" htmlFor="schedule-reference">
              <input
                id="schedule-reference"
                className="form-input"
                name="acuan_pembanding"
                value={form.acuan_pembanding}
                onChange={onChange}
              />
            </FormField>
          )}

          {form.jenis_jadwal === "pemeliharaan" && (
            <FormField label="Jenis Pemeliharaan" htmlFor="schedule-maintenance">
              <input
                id="schedule-maintenance"
                className="form-input"
                name="jenis_pemeliharaan"
                value={form.jenis_pemeliharaan}
                onChange={onChange}
              />
            </FormField>
          )}

          <FormField label="PIC" htmlFor="schedule-pic">
            <input
              id="schedule-pic"
              className="form-input"
              name="pic"
              value={form.pic}
              onChange={onChange}
            />
          </FormField>

          <FormField label="Keterangan" htmlFor="schedule-notes">
            <textarea
              id="schedule-notes"
              className="form-textarea"
              name="keterangan"
              rows="2"
              value={form.keterangan}
              onChange={onChange}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
