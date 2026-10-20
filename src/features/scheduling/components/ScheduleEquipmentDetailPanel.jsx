import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CalendarDays, Clock3, X } from "lucide-react";
import { Button } from "../../../shared/components/ui/index.js";
import {
  formatDate,
  getFrequencyLabel,
  getDaysUntilDue,
  getEquipmentStatusInfo,
  getScheduleLabel,
  getScheduleStatus,
  getScheduleStatusInfo,
} from "../schedulingData.js";

export default function ScheduleEquipmentDetailPanel({
  equipment,
  schedules,
  onClose,
  onRecordRealization,
}) {
  useEffect(() => {
    if (!equipment) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [equipment, onClose]);

  if (!equipment) return null;

  const equipmentStatus = getEquipmentStatusInfo(equipment.status_alat);
  const frequency = schedules.find((schedule) => schedule.frekuensi_penggunaan)
    ?.frekuensi_penggunaan;
  const frequencyLabel = getFrequencyLabel(frequency);
  const labName = equipment.lab?.kode_labs || equipment.lab?.nama_labs || "—";
  const roomName = equipment.ruangan?.nama_ruangan || "—";

  return createPortal(
    <div
      className="schedule-detail-backdrop"
      onClick={onClose}
    >
      <aside
        className="schedule-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="schedule-detail-header">
          <div className="schedule-detail-heading">
            <code>{equipment.nomor_aset || `ID ${equipment.id}`}{labName !== "—" ? ` · Lab ${labName}` : ""}</code>
            <h2 id="schedule-detail-title">{equipment.nama_peralatan || "Detail Peralatan"}</h2>
          </div>
          <button
            type="button"
            className="schedule-detail-close"
            onClick={onClose}
            aria-label="Tutup panel detail"
          >
            <X size={18} aria-hidden="true" />
          </button>
          <div className="schedule-detail-statusline">
            <span>Status alat <strong>{equipmentStatus.label}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Frekuensi <strong>{frequencyLabel}</strong></span>
          </div>
        </header>

        <div className="schedule-detail-content">
          <section className="schedule-detail-section" aria-labelledby="schedule-detail-schedule-heading">
            <div className="schedule-detail-section-heading">
              <CalendarDays size={17} aria-hidden="true" />
              <h3 id="schedule-detail-schedule-heading">Jadwal pemeriksaan</h3>
            </div>
            {schedules.length === 0 ? (
              <p className="schedule-detail-empty">Belum ada jadwal pemeriksaan untuk alat ini.</p>
            ) : (
              <div className="schedule-detail-schedule-list">
                {schedules.map((schedule) => {
                  const state = getScheduleStatus(schedule);
                  const status = getScheduleStatusInfo(state);
                  const days = getDaysUntilDue(schedule.tanggal_jatuh_tempo);
                  const isLate = days !== null && days < 0;
                  const method = schedule.metode_kalibrasi || schedule.metode_verifikasi;
                  const documentNumber = schedule.nomor_sertifikat || schedule.nomor_laporan;

                  return (
                    <article className="schedule-detail-schedule-card" key={schedule.id}>
                      <div className="schedule-detail-schedule-title">
                        <strong>{getScheduleLabel(schedule)}</strong>
                        <span className={`schedule-status-chip ${status.className}`}>{status.label}</span>
                      </div>
                      {isLate && (
                        <div className="schedule-detail-alert">
                          <AlertTriangle size={17} aria-hidden="true" />
                          <span>Jatuh tempo terlewat {Math.abs(days)} hari. Periksa tindak lanjut jadwal ini.</span>
                        </div>
                      )}
                      <div className="schedule-detail-fields">
                        <DetailField label="Interval" value={schedule.interval_bulan ? `${schedule.interval_bulan} bulan` : "—"} />
                        <DetailField label="Terakhir" value={formatDate(schedule.tanggal_realisasi || schedule.tanggal_terakhir)} />
                        <DetailField
                          label="Jatuh tempo"
                          value={formatDate(schedule.tanggal_jatuh_tempo)}
                          valueClassName={isLate ? "is-overdue" : ""}
                        />
                        <DetailField label="Metode" value={method || "—"} />
                        <DetailField label="No. dokumen" value={documentNumber || "—"} />
                        {schedule.alat_standar_benda_uji && (
                          <DetailField label="Alat standar / benda uji" value={schedule.alat_standar_benda_uji} />
                        )}
                        {schedule.jenis_pemeliharaan && (
                          <DetailField label="Jenis pemeliharaan" value={schedule.jenis_pemeliharaan} />
                        )}
                        <DetailField label="PIC" value={schedule.pic || "—"} />
                      </div>
                      {schedule.keterangan && (
                        <p className="schedule-detail-note">{schedule.keterangan}</p>
                      )}
                      <div className="schedule-detail-schedule-footer">
                        <span>
                          <Clock3 size={14} aria-hidden="true" />
                          {days === null
                            ? "Tanggal jatuh tempo belum tersedia"
                            : days < 0
                              ? `${Math.abs(days)} hari lewat`
                              : days === 0
                                ? "Jatuh tempo hari ini"
                                : `${days} hari lagi`}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onRecordRealization(schedule)}
                        >
                          Catat realisasi
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="schedule-detail-section" aria-labelledby="schedule-detail-equipment-heading">
            <div className="schedule-detail-section-heading">
              <h3 id="schedule-detail-equipment-heading">Informasi alat</h3>
            </div>
            <div className="schedule-detail-info-grid">
              <DetailField label="Merek" value={equipment.merek || "—"} />
              <DetailField label="Tipe / model" value={equipment.tipe_model || "—"} />
              <DetailField label="Nomor seri" value={equipment.nomor_seri || "—"} />
              <DetailField label="Laboratorium" value={equipment.lab?.nama_labs || labName} />
              <DetailField label="Ruangan" value={roomName} />
              <DetailField label="Status alat" value={equipmentStatus.label} />
            </div>
          </section>
        </div>
      </aside>
    </div>,
    document.body,
  );
}

function DetailField({ label, value, valueClassName = "" }) {
  return (
    <div className="schedule-detail-field">
      <span>{label}</span>
      <strong className={valueClassName}>{value}</strong>
    </div>
  );
}
