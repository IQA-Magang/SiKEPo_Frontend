import React from "react";
import "../scheduling.css";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Info,
  Layers,
  Wrench,
} from "lucide-react";
import { Button, FormField, Modal } from "../../../shared/components/ui/index.js";
import { getScheduleLabel, getTodayInputValue } from "../schedulingData.js";

const MAINTENANCE_TASK_OPTIONS = [
  {
    task: "Bersihkan perangkat dan kipas",
    desc: "Pembersihan debu fisik, ventilasi pendingin, dan kebersihan eksterior alat.",
  },
  {
    task: "Perbarui sistem dan antivirus",
    desc: "Pemeriksaan patch keamanan OS/firmware dan update database antivirus.",
  },
  {
    task: "Cadangkan data penting",
    desc: "Pencadangan file konfigurasi, profil pengukuran, dan arsip riwayat.",
  },
];

export default function ScheduleRealizationModal({
  schedule,
  equipment,
  form,
  onChange,
  onClose,
  onSubmit,
  saving,
  canManage,
}) {
  const isIntermediateCheck = schedule?.jenis_jadwal === "pengecekan_antara";
  const currentEquipment = equipment || schedule?.peralatan || schedule?.equipment;

  const readings = (form.pembacaan || []).map((value) => (
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
      ? form.acuan_pembanding?.trim()
        && form.nilai_acuan !== ""
        && form.batas_toleransi !== ""
        && readingsComplete
      : form.versi_perangkat_lunak?.trim() && (form.daftar_pekerjaan || []).length > 0),
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
      title={`Catat Hasil: ${isIntermediateCheck ? "Pengecekan Antara" : "Pemeliharaan"}`}
      description="Hasil dicatat sebagai verifikasi peralatan dan diteruskan ke Manager Lab untuk ditinjau."
      size="lg"
      className="schedule-result-modal"
      footer={footer}
    >
      <form id="schedule-result-form" onSubmit={onSubmit}>
        <div className="schedule-result-content">
          {/* Equipment Context Banner */}
          <div className="schedule-result-equipment-badge">
            <div className="schedule-result-equipment-icon">
              {isIntermediateCheck ? <Activity size={22} /> : <Wrench size={22} />}
            </div>
            <div className="schedule-result-equipment-meta">
              <div className="schedule-result-equipment-title">
                <span className="schedule-result-asset-tag">
                  {currentEquipment?.nomor_aset || `ID #${schedule?.peralatan_id}`}
                </span>
                <strong>{currentEquipment?.nama_peralatan || "Peralatan Laboratorium"}</strong>
              </div>
              <span className="schedule-result-equipment-sub">
                {isIntermediateCheck ? "Pemeriksaan Pengecekan Antara" : "Pemeliharaan Rutin / Berkala"}
                {schedule?.interval_bulan ? ` · Siklus setiap ${schedule.interval_bulan} bulan` : ""}
                {schedule?.frekuensi_penggunaan ? ` · Frekuensi ${schedule.frekuensi_penggunaan}` : ""}
              </span>
            </div>
          </div>

          {/* Callout Notice */}
          <div className="schedule-result-callout">
            <span className="schedule-result-callout-icon">
              <Info size={18} />
            </span>
            <span>
              {isIntermediateCheck
                ? "Masukkan 5 nilai hasil pembacaan. Sistem membandingkan setiap hasil pembacaan dengan nilai acuan dan batas toleransi secara otomatis."
                : "Catat versi perangkat lunak/firmware terkini, pilih butir pekerjaan yang selesai dilakukan, serta catat temuan teknis kondisi peralatan."}
            </span>
          </div>

          {isIntermediateCheck ? (
            <>
              {/* Card 1: Parameter Acuan & Tanggal */}
              <div className="schedule-form-section-card">
                <div className="schedule-form-section-header">
                  <div className="schedule-form-section-title">
                    <Layers size={15} />
                    <span>Parameter Acuan & Tanggal</span>
                  </div>
                  <span className="schedule-form-section-hint">Wajib diisi lengkap</span>
                </div>
                <div className="schedule-result-grid">
                  <FormField
                    label="Tanggal Pengecekan"
                    htmlFor="realization-date"
                    hint={dateIsFuture ? "Tanggal tidak boleh di masa depan." : "Maksimal hari ini."}
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

                  <FormField label="Acuan Pembanding" htmlFor="check-reference" required>
                    <input
                      id="check-reference"
                      className="form-input"
                      value={form.acuan_pembanding}
                      onChange={(event) => onChange("acuan_pembanding", event.target.value)}
                      placeholder="Contoh: Standar Kalibrator Fluke / Alat Acuan"
                      required
                    />
                  </FormField>

                  <FormField label="Nilai Acuan (Target)" htmlFor="check-reference-value" required>
                    <input
                      id="check-reference-value"
                      className="form-input"
                      type="number"
                      step="any"
                      value={form.nilai_acuan}
                      onChange={(event) => onChange("nilai_acuan", event.target.value)}
                      placeholder="Nilai nominal standar acuan"
                      required
                    />
                  </FormField>

                  <FormField label="Batas Toleransi (±)" htmlFor="check-tolerance" required>
                    <input
                      id="check-tolerance"
                      className="form-input"
                      type="number"
                      min="0"
                      step="any"
                      value={form.batas_toleransi}
                      onChange={(event) => onChange("batas_toleransi", event.target.value)}
                      placeholder="Batas deviasi maksimal yang diizinkan"
                      required
                    />
                  </FormField>
                </div>
              </div>

              {/* Card 2: 5 Pembacaan */}
              <div className="schedule-form-section-card">
                <div className="schedule-form-section-header">
                  <div className="schedule-form-section-title">
                    <Activity size={15} />
                    <span>Data 5 Kali Pembacaan Berulang</span>
                  </div>
                  <span className="schedule-form-section-hint">5 titik pengukuran</span>
                </div>

                <div className="schedule-reading-grid">
                  {(form.pembacaan || []).map((reading, index) => {
                    const hasVal = reading !== "";
                    const hasAcuan = form.nilai_acuan !== "";
                    const delta = hasVal && hasAcuan ? Math.abs(Number(reading) - Number(form.nilai_acuan)) : null;
                    const isPass = delta !== null && form.batas_toleransi !== "" ? delta <= Number(form.batas_toleransi) : null;

                    return (
                      <div className="schedule-reading-item" key={`reading-${index + 1}`}>
                        <span className="schedule-reading-item-label">Bacaan #{index + 1}</span>
                        <input
                          id={`check-reading-${index + 1}`}
                          className="schedule-reading-input"
                          type="number"
                          step="any"
                          value={reading}
                          placeholder="0.00"
                          onChange={(event) => onChange("pembacaan", event.target.value, index)}
                          required
                        />
                        <span
                          className={`schedule-reading-delta${
                            isPass === true ? " is-pass" : isPass === false ? " is-fail" : ""
                          }`}
                          title={delta !== null ? `Selisih terhadap nilai acuan: ${delta.toLocaleString("id-ID")}` : "Menunggu input"}
                        >
                          {delta !== null
                            ? `Δ ${delta.toLocaleString("id-ID", { maximumFractionDigits: 4 })}`
                            : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card 3: Evaluasi Hasil Otomatis */}
              <div className={`schedule-result-summary${maxDeviation === null ? "" : withinTolerance ? " is-pass" : " is-fail"}`}>
                <div className="schedule-summary-header">
                  {maxDeviation === null ? (
                    <>
                      <Info size={18} />
                      <span>Evaluasi Hasil Pembacaan</span>
                    </>
                  ) : withinTolerance ? (
                    <>
                      <CheckCircle2 size={19} />
                      <span>Hasil Berada Dalam Batas Toleransi (Sesuai)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={19} />
                      <span>Hasil Melebihi Batas Toleransi (Tidak Sesuai)</span>
                    </>
                  )}
                </div>

                <p className="schedule-summary-desc">
                  {maxDeviation === null
                    ? "Lengkapi seluruh 5 hasil pembacaan di atas untuk melihat kalkulasi rata-rata, simpangan maksimum, dan status toleransi."
                    : withinTolerance
                      ? "Peralatan bekerja dalam kondisi prima dan simpangan maksimum masih memenuhi batas toleransi yang ditetapkan."
                      : "Simpangan pembacaan melebihi batas toleransi. Manager Lab akan mengevaluasi apakah peralatan memerlukan kalibrasi ulang atau penyesuaian teknis."}
                </p>

                {average !== null && maxDeviation !== null && (
                  <div className="schedule-summary-metrics">
                    <div className="schedule-summary-metric-card">
                      <span className="schedule-summary-metric-label">Target Nilai Acuan</span>
                      <span className="schedule-summary-metric-val">
                        {Number(form.nilai_acuan).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="schedule-summary-metric-card">
                      <span className="schedule-summary-metric-label">Rata-rata (Mean)</span>
                      <span className="schedule-summary-metric-val">
                        {average.toLocaleString("id-ID", { maximumFractionDigits: 4 })}
                      </span>
                    </div>
                    <div className="schedule-summary-metric-card">
                      <span className="schedule-summary-metric-label">Simpangan Maksimum</span>
                      <span className="schedule-summary-metric-val">
                        {maxDeviation.toLocaleString("id-ID", { maximumFractionDigits: 4 })}
                        {" "}
                        <small style={{ fontSize: "11px", fontWeight: "normal", color: "var(--clr-dark-500)" }}>
                          (±{Number(form.batas_toleransi).toLocaleString("id-ID")})
                        </small>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Pemeliharaan - Card 1: Informasi Dasar */}
              <div className="schedule-form-section-card">
                <div className="schedule-form-section-header">
                  <div className="schedule-form-section-title">
                    <Calendar size={15} />
                    <span>Informasi Tanggal & Sistem</span>
                  </div>
                  <span className="schedule-form-section-hint">Wajib diisi</span>
                </div>
                <div className="schedule-result-grid">
                  <FormField
                    label="Tanggal Pemeliharaan"
                    htmlFor="realization-date"
                    hint={dateIsFuture ? "Tanggal tidak boleh di masa depan." : "Maksimal hari ini."}
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

                  <FormField label="Versi Perangkat Lunak / Firmware" htmlFor="maintenance-version" required>
                    <input
                      id="maintenance-version"
                      className="form-input"
                      value={form.versi_perangkat_lunak}
                      onChange={(event) => onChange("versi_perangkat_lunak", event.target.value)}
                      placeholder="Contoh: v2.4.1 / Windows 11 23H2 / N/A"
                      required
                    />
                  </FormField>
                </div>
              </div>

              {/* Pemeliharaan - Card 2: Checklist Pekerjaan */}
              <div className="schedule-form-section-card">
                <div className="schedule-form-section-header">
                  <div className="schedule-form-section-title">
                    <ClipboardCheck size={15} />
                    <span>Pekerjaan Pemeliharaan yang Dilakukan</span>
                  </div>
                  <span className="schedule-form-section-hint">
                    {(form.daftar_pekerjaan || []).length} dari {MAINTENANCE_TASK_OPTIONS.length} butir dipilih
                  </span>
                </div>

                <div className="schedule-maintenance-checklist">
                  {MAINTENANCE_TASK_OPTIONS.map((item) => {
                    const isChecked = (form.daftar_pekerjaan || []).includes(item.task);
                    return (
                      <div
                        className={`schedule-maintenance-task-tile${isChecked ? " is-checked" : ""}`}
                        key={item.task}
                        onClick={() =>
                          onChange("daftar_pekerjaan", {
                            task: item.task,
                            checked: !isChecked,
                          })
                        }
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(event) => {
                            event.stopPropagation();
                            onChange("daftar_pekerjaan", {
                              task: item.task,
                              checked: event.target.checked,
                            });
                          }}
                        />
                        <div className="schedule-maintenance-task-info">
                          <span className="schedule-maintenance-task-name">{item.task}</span>
                          <span className="schedule-maintenance-task-desc">{item.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pemeliharaan - Card 3: Temuan & Catatan Tindakan */}
              <div className="schedule-form-section-card">
                <div className="schedule-form-section-header">
                  <div className="schedule-form-section-title">
                    <FileText size={15} />
                    <span>Temuan Kondisi & Tindakan Teknis</span>
                  </div>
                  <span className="schedule-form-section-hint">Opsional</span>
                </div>

                <FormField label="Catatan Temuan / Tindakan Tambahan" htmlFor="maintenance-findings">
                  <textarea
                    id="maintenance-findings"
                    className="form-textarea"
                    rows="3"
                    value={form.temuan}
                    onChange={(event) => onChange("temuan", event.target.value)}
                    placeholder="Deskripsikan kondisi fisik peralatan, pembersihan komponen, perbaikan ringan, atau catatan teknis lainnya..."
                  />
                </FormField>

                {/* Warning impact switch */}
                <div
                  className={`schedule-component-impact-card${form.menyentuh_komponen ? " is-active" : ""}`}
                  onClick={() => onChange("menyentuh_komponen", !form.menyentuh_komponen)}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(form.menyentuh_komponen)}
                    onChange={(event) => {
                      event.stopPropagation();
                      onChange("menyentuh_komponen", event.target.checked);
                    }}
                  />
                  <div className="schedule-component-impact-info">
                    <span className="schedule-component-impact-title">
                      Pemeliharaan menyentuh bagian yang dapat memengaruhi hasil ukur
                    </span>
                    <span className="schedule-component-impact-desc">
                      Tandai opsi ini jika kegiatan pemeliharaan melibatkan sensor, modul akurasi, atau penggantian komponen internal yang memerlukan verifikasi/kalibrasi ulang.
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Workflow Note */}
          <p className="schedule-verification-note">
            <Info size={16} />
            <span>
              Hasil akan masuk ke antrean verifikasi Manager Lab. Jatuh tempo siklus berikutnya akan otomatis diperbarui setelah disetujui.
            </span>
          </p>
        </div>
      </form>
    </Modal>
  );
}
