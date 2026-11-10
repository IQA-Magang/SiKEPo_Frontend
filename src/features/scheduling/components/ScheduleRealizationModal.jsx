import { AlertCircle, CheckCircle2, ClipboardCheck } from "lucide-react";
import { Button, FormField, Modal } from "../../../shared/components/ui/index.js";
import { getScheduleLabel, getTodayInputValue } from "../schedulingData.js";

const MAINTENANCE_TASKS = [
  "Bersihkan perangkat dan kipas",
  "Perbarui sistem dan antivirus",
  "Cadangkan data penting",
];

export default function ScheduleRealizationModal({
  schedule,
  form,
  onChange,
  onClose,
  onSubmit,
  saving,
  canManage,
}) {
  const isIntermediateCheck = schedule?.jenis_jadwal === "pengecekan_antara";
  const readings = form.pembacaan.map((value) => (
    value === "" ? Number.NaN : Number(value)
  ));
  const readingsComplete = readings.length === 5 && readings.every(Number.isFinite);
  const average = readingsComplete
    ? readings.reduce((sum, value) => sum + value, 0) / readings.length
    : null;
  const maxDeviation = readingsComplete && form.nilai_acuan !== ""
    ? Math.max(...readings.map((value) => Math.abs(value - Number(form.nilai_acuan))))
    : null;
  const withinTolerance = maxDeviation !== null && form.batas_toleransi !== ""
    && maxDeviation <= Number(form.batas_toleransi);
  const dateIsFuture = Boolean(form.tanggal_realisasi)
    && form.tanggal_realisasi > getTodayInputValue();
  const canSubmit = Boolean(
    form.tanggal_realisasi
    && !dateIsFuture
    && (isIntermediateCheck
      ? form.acuan_pembanding.trim()
        && form.nilai_acuan !== ""
        && form.batas_toleransi !== ""
        && readingsComplete
      : form.versi_perangkat_lunak.trim() && form.daftar_pekerjaan.length > 0),
  );

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={saving}>
        Batal
      </Button>
      <Button
        type="submit"
        form="schedule-result-form"
        variant="primary"
        disabled={saving || !canManage || !canSubmit}
        icon={<ClipboardCheck size={16} />}
      >
        {saving ? "Mengirim hasil..." : "Simpan & ajukan verifikasi"}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={Boolean(schedule)}
      onClose={saving ? undefined : onClose}
      title={`Catat hasil: ${schedule ? getScheduleLabel(schedule) : ""}`}
      description="Hasil dicatat sebagai verifikasi peralatan dan diteruskan ke Manager Lab untuk ditinjau."
      size="lg"
      className="schedule-result-modal"
      footer={footer}
    >
      <form id="schedule-result-form" onSubmit={onSubmit}>
        {isIntermediateCheck ? (
          <div className="schedule-result-content">
            <div className="schedule-result-callout">
              <span className="schedule-result-callout-icon"><CheckCircle2 size={17} /></span>
              <span>Masukkan lima pembacaan. Sistem membandingkan setiap hasil dengan nilai acuan dan batas toleransi.</span>
            </div>
            <div className="schedule-result-grid">
              <FormField
                label="Tanggal pengecekan"
                htmlFor="realization-date"
                hint={dateIsFuture ? "Tanggal realisasi tidak boleh di masa depan." : "Tanggal maksimal hari ini."}
                required
              >
                <input
                  id="realization-date"
                  className="form-input"
                  type="date"
                  max={getTodayInputValue()}
                  value={form.tanggal_realisasi}
                  onChange={(event) => onChange("tanggal_realisasi", event.target.value)}
                  required
                />
              </FormField>
              <FormField label="Acuan pembanding" htmlFor="check-reference" required>
                <input
                  id="check-reference"
                  className="form-input"
                  value={form.acuan_pembanding}
                  onChange={(event) => onChange("acuan_pembanding", event.target.value)}
                  placeholder="Nama/nomor acuan alat"
                  required
                />
              </FormField>
              <FormField label="Nilai acuan" htmlFor="check-reference-value" required>
                <input
                  id="check-reference-value"
                  className="form-input"
                  type="number"
                  step="any"
                  value={form.nilai_acuan}
                  onChange={(event) => onChange("nilai_acuan", event.target.value)}
                  required
                />
              </FormField>
              <FormField label="Batas toleransi" htmlFor="check-tolerance" required>
                <input
                  id="check-tolerance"
                  className="form-input"
                  type="number"
                  min="0"
                  step="any"
                  value={form.batas_toleransi}
                  onChange={(event) => onChange("batas_toleransi", event.target.value)}
                  required
                />
              </FormField>
            </div>

            <fieldset className="schedule-reading-fieldset">
              <legend>Lima hasil pembacaan</legend>
              <div className="schedule-reading-grid">
                {form.pembacaan.map((reading, index) => (
                  <FormField
                    key={`reading-${index + 1}`}
                    label={`Bacaan ${index + 1}`}
                    htmlFor={`check-reading-${index + 1}`}
                    required
                  >
                    <input
                      id={`check-reading-${index + 1}`}
                      className="form-input"
                      type="number"
                      step="any"
                      value={reading}
                      onChange={(event) => onChange("pembacaan", event.target.value, index)}
                      required
                    />
                    {reading !== "" && form.nilai_acuan !== "" && (
                      <span className="schedule-reading-delta">
                        Selisih {Math.abs(Number(reading) - Number(form.nilai_acuan)).toLocaleString("id-ID")}
                      </span>
                    )}
                  </FormField>
                ))}
              </div>
            </fieldset>

            <div className={`schedule-result-summary${maxDeviation === null ? "" : withinTolerance ? " is-pass" : " is-fail"}`}>
              {maxDeviation === null ? <AlertCircle size={18} /> : withinTolerance ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <div>
                <strong>
                  {maxDeviation === null
                    ? "Ringkasan hasil akan muncul setelah lima bacaan diisi"
                    : withinTolerance
                      ? "Hasil berada dalam batas toleransi"
                      : "Hasil melewati batas toleransi"}
                </strong>
                {average !== null && (
                  <span>Rata-rata {average.toLocaleString("id-ID")} · simpangan maksimum {maxDeviation.toLocaleString("id-ID")}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="schedule-result-content">
            <div className="schedule-result-callout">
              <span className="schedule-result-callout-icon"><ClipboardCheck size={17} /></span>
              <span>Catat versi perangkat lunak, pekerjaan yang dilakukan, dan temuan yang perlu ditinjau.</span>
            </div>
            <div className="schedule-result-grid">
              <FormField
                label="Tanggal pemeliharaan"
                htmlFor="realization-date"
                hint={dateIsFuture ? "Tanggal realisasi tidak boleh di masa depan." : "Tanggal maksimal hari ini."}
                required
              >
                <input
                  id="realization-date"
                  className="form-input"
                  type="date"
                  max={getTodayInputValue()}
                  value={form.tanggal_realisasi}
                  onChange={(event) => onChange("tanggal_realisasi", event.target.value)}
                  required
                />
              </FormField>
              <FormField label="Versi perangkat lunak" htmlFor="maintenance-version" required>
                <input
                  id="maintenance-version"
                  className="form-input"
                  value={form.versi_perangkat_lunak}
                  onChange={(event) => onChange("versi_perangkat_lunak", event.target.value)}
                  placeholder="Contoh: Windows 11 23H2"
                  required
                />
              </FormField>
            </div>

            <fieldset className="schedule-maintenance-fieldset">
              <legend>Butir pemeliharaan</legend>
              {MAINTENANCE_TASKS.map((task) => (
                <label className="schedule-maintenance-task" key={task}>
                  <input
                    type="checkbox"
                    checked={form.daftar_pekerjaan.includes(task)}
                    onChange={(event) => onChange("daftar_pekerjaan", { task, checked: event.target.checked })}
                  />
                  <span>{task}</span>
                </label>
              ))}
            </fieldset>

            <FormField label="Temuan dan tindakan" htmlFor="maintenance-findings">
              <textarea
                id="maintenance-findings"
                className="form-textarea"
                rows="3"
                value={form.temuan}
                onChange={(event) => onChange("temuan", event.target.value)}
                placeholder="Tuliskan temuan, tindakan, atau catatan (opsional)"
              />
            </FormField>
            <label className="schedule-component-impact">
              <input
                type="checkbox"
                checked={form.menyentuh_komponen}
                onChange={(event) => onChange("menyentuh_komponen", event.target.checked)}
              />
              <span>Pemeliharaan menyentuh bagian yang dapat memengaruhi hasil ukur</span>
            </label>
          </div>
        )}

        <p className="schedule-verification-note">
          Hasil akan masuk ke daftar persetujuan Manager pada modul pemeriksaan ini.
          Jatuh tempo berikutnya diperbarui setelah hasil disetujui.
        </p>
      </form>
    </Modal>
  );
}
