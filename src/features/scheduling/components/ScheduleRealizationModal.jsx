import { Button, FormField, Modal } from "../../../shared/components/ui/index.js";
import { getScheduleLabel } from "../schedulingData.js";

export default function ScheduleRealizationModal({
  schedule,
  date,
  onDateChange,
  onClose,
  onSubmit,
  saving,
}) {
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={saving}>
        Batal
      </Button>
      <Button type="submit" variant="primary" disabled={saving || !date}>
        {saving ? "Menyimpan..." : "Simpan Realisasi"}
      </Button>
    </>
  );

  return (
    <form onSubmit={onSubmit}>
      <Modal
        isOpen={Boolean(schedule)}
        onClose={saving ? undefined : onClose}
        title={`Catat Realisasi: ${schedule ? getScheduleLabel(schedule) : ""}`}
        description="Tanggal realisasi akan menjadi tanggal terakhir dan menghitung jatuh tempo berikutnya sesuai interval."
        footer={footer}
      >
        <FormField label="Tanggal Realisasi" htmlFor="realization-date" required>
          <input
            id="realization-date"
            className="form-input"
            type="date"
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
            required
          />
        </FormField>
      </Modal>
    </form>
  );
}
