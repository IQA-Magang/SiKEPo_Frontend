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
}) {
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={saving}>
        Batal
      </Button>
      <Button
        type="submit"
        variant="primary"
        disabled={saving || availableEquipment.length === 0}
      >
        {saving ? "Menyimpan..." : "Simpan Jadwal"}
      </Button>
    </>
  );

  return (
    <form onSubmit={onSubmit}>
      <Modal
        isOpen={isOpen}
        onClose={saving ? undefined : onClose}
        title="Buat Jadwal Pemeriksaan"
        description="Satu peralatan akan mendapat jadwal utama dan jadwal tambahan."
        size="xl"
        className="schedule-form-modal"
        footer={footer}
      >
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
                Semua peralatan sudah memiliki jadwal.
              </span>
            )}
          </FormField>

          <FormField label="Pemeriksaan Utama" htmlFor="schedule-main-type" required>
            <select
              id="schedule-main-type"
              className="form-select"
              name="jenis_utama"
              value={form.jenis_utama}
              onChange={onChange}
              required
            >
              <option value="kalibrasi">Kalibrasi</option>
              <option value="verifikasi_fungsi">Verifikasi Fungsi</option>
            </select>
          </FormField>

          <FormField
            label="Frekuensi Penggunaan"
            htmlFor="schedule-frequency"
            hint={
              form.frekuensi_penggunaan === "tinggi"
                ? "Jadwal tambahan: pengecekan antara."
                : "Jadwal tambahan: pemeliharaan."
            }
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
              <option value="tinggi">Tinggi</option>
              <option value="sedang">Sedang</option>
              <option value="rendah">Rendah</option>
            </select>
          </FormField>

          <FormField label="Interval Utama (bulan)" htmlFor="schedule-main-interval" required>
            <input
              id="schedule-main-interval"
              className="form-input"
              type="number"
              name="interval_utama"
              min="1"
              step="1"
              value={form.interval_utama}
              onChange={onChange}
              required
            />
          </FormField>

          <FormField label="Interval Tambahan (bulan)" htmlFor="schedule-extra-interval" required>
            <input
              id="schedule-extra-interval"
              className="form-input"
              type="number"
              name="interval_tambahan"
              min="1"
              step="1"
              value={form.interval_tambahan}
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

          <FormField label="Metode" htmlFor="schedule-method">
            <input
              id="schedule-method"
              className="form-input"
              name="metode"
              value={form.metode}
              onChange={onChange}
            />
          </FormField>

          <FormField
            label={form.jenis_utama === "kalibrasi" ? "Nomor Sertifikat" : "Nomor Laporan"}
            htmlFor="schedule-document"
          >
            <input
              id="schedule-document"
              className="form-input"
              name="nomor_dokumen"
              value={form.nomor_dokumen}
              onChange={onChange}
            />
          </FormField>

          {form.jenis_utama === "kalibrasi" && (
            <FormField label="Alat Standar / Benda Uji" htmlFor="schedule-standard">
              <input
                id="schedule-standard"
                className="form-input"
                name="alat_standar_benda_uji"
                value={form.alat_standar_benda_uji}
                onChange={onChange}
              />
            </FormField>
          )}

          <FormField label="Jenis Pemeliharaan" htmlFor="schedule-maintenance">
            <input
              id="schedule-maintenance"
              className="form-input"
              name="jenis_pemeliharaan"
              value={form.jenis_pemeliharaan}
              onChange={onChange}
            />
          </FormField>

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
      </Modal>
    </form>
  );
}
