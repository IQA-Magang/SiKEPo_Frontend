import { createPortal } from "react-dom";
import { CheckCircle2, FileCheck, FileText, Printer, XCircle } from "lucide-react";
import DataTable from "../../../shared/components/ui/DataTable.jsx";
import {
  exportVerificationPdf,
  exportVerificationWord,
} from "../../../shared/lib/verificationPdf.js";
import SignatureField from "../../../shared/components/ui/SignatureField.jsx";
import SignatureDisplayCard from "./SignatureDisplayCard.jsx";
import {
  ACTIVITY_REQUIREMENTS,
  CHECKS,
  CHECK_LABELS,
  getActivityLabel,
  getEquipmentKeterangan,
} from "../verificationData.js";

export default function VerificationDetailsModal({
  selected,
  role,
  canApprove,
  staffIsPengelola,
  busy,
  managerSignature,
  setManagerSignature,
  approvalMode,
  setApprovalMode,
  rejectReason,
  setRejectReason,
  rejectCatatan,
  setRejectCatatan,
  affirmApproved,
  setAffirmApproved,
  handleApproveFromModal,
  handleRejectFromModal,
  handleSignatureChange,
  forgetSavedSignature,
  savedSignature,
  setSelected,
}) {
  function officialNotes(item) {
    try {
      const data = JSON.parse(item.catatan || "{}");
      return data.format === "TLKM13/F/003-v05" ? data : null;
    } catch {
      return null;
    }
  }

  return (
    <>
      {selected &&
        createPortal(
          <div
            className="modal-overlay verification-review-overlay"
            role="presentation"
            onClick={() => setSelected(null)}
          >
            <div
              className="modal modal-xl verification-review-modal"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h2 className="modal-title">
                    {role === "manager"
                      ? "Pengajuan Verifikasi"
                      : "Rincian Verifikasi"}
                  </h2>
                  <p
                    className="page-subtitle"
                    style={{ margin: "4px 0 0", fontSize: "var(--text-xs)" }}
                  >
                    {selected.peralatan?.nomor_aset
                      ? `${selected.peralatan.nomor_aset} — `
                      : ""}
                    {selected.peralatan?.nama_peralatan ||
                      `Peralatan ID ${selected.id_peralatan}`}
                  </p>
                </div>
              </div>

              <div className="modal-body">
                <div
                  className="form-grid-2 verification-review-summary"
                  style={{ marginBottom: "var(--sp-3)" }}
                >
                  <div>
                    <strong>
                      {role === "manager" ? "Kode Aktivitas:" : "Keterangan:"}
                    </strong>
                    <p style={{ margin: "2px 0 0" }}>
                      {role === "manager"
                        ? selected.kode_aktivitas || "-"
                        : getActivityLabel(selected.kode_aktivitas)}
                    </p>
                  </div>
                  <div>
                    <strong>Keterangan:</strong>
                    <p style={{ margin: "2px 0 0" }}>
                      <span
                        className={`badge ${
                          selected.status === "Disetujui"
                            ? "badge-aktif"
                            : selected.status === "Ditolak"
                              ? "badge-rusak"
                              : "badge-kalibrasi"
                        }`}
                      >
                        {getEquipmentKeterangan({
                          ...selected.peralatan,
                          status_verifikasi: selected.status,
                        })}
                      </span>
                    </p>
                  </div>
                  <div>
                    <strong>Tindak Lanjut:</strong>
                    <p style={{ margin: "2px 0 0" }}>
                      {selected.tindak_lanjut || "-"}
                    </p>
                  </div>
                  <div>
                    <strong>Tanggal:</strong>
                    <p style={{ margin: "2px 0 0" }}>
                      {selected.tanggal_verifikasi
                        ? new Date(
                            selected.tanggal_verifikasi,
                          ).toLocaleDateString("id-ID")
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="verification-review-signatures">
                  <SignatureDisplayCard
                    title="Tanda Tangan Pengelola Penguji"
                    roleLabel="Staff Pengelola Penguji"
                    signature={selected.pic_signature}
                    signerName={
                      selected.pic_user?.nama_lengkap ||
                      selected.pic?.nama_lengkap ||
                      selected.pic?.nama ||
                      "-"
                    }
                    signerNip={
                      selected.pic_user?.nip
                        ? `NIP: ${selected.pic_user.nip}`
                        : selected.pic_user?.username
                          ? `@${selected.pic_user.username}`
                          : null
                    }
                    signedAt={
                      selected.pic_signed_at || selected.tanggal_verifikasi
                    }
                  />
                  <SignatureDisplayCard
                    title="Persetujuan Manager"
                    roleLabel="Manager Laboratorium"
                    signature={selected.manager_signature}
                    signerName={
                      selected.verified_by_user?.nama_lengkap ||
                      selected.manager?.nama_lengkap ||
                      (selected.status === "Disetujui" ? "Manager Lab" : "-")
                    }
                    signerNip={
                      selected.verified_by_user?.nip
                        ? `NIP: ${selected.verified_by_user.nip}`
                        : selected.verified_by_user?.username
                          ? `@${selected.verified_by_user.username}`
                          : null
                    }
                    signedAt={
                      selected.manager_signed_at || selected.verified_at
                    }
                  />
                </div>

                <h4
                  style={{
                    margin: "var(--sp-4) 0 var(--sp-2)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  Hasil Aspek Pemeriksaan
                </h4>
                <DataTable
                  columns={[
                    {
                      key: "check",
                      header: "Hasil Pemeriksaan",
                      render: (key) => CHECK_LABELS[key],
                    },
                    {
                      key: "result",
                      header: "Penilaian",
                      render: (key) => {
                        const result =
                          selected.hasil_verifikasi?.[0]?.[key] || "-";
                        const label =
                          result === "S"
                            ? key === "firmware"
                              ? "Ada"
                              : "S (Sesuai)"
                            : result === "TS"
                              ? key === "firmware"
                                ? "Tidak Ada"
                                : "TS (Tidak Sesuai)"
                              : key === "firmware" && result === "TB"
                                ? "Belum dinilai"
                                : result;
                        return (
                          <span
                            className={`badge ${
                              result === "S"
                                ? "badge-aktif"
                                : result === "TS"
                                  ? "badge-rusak"
                                  : "badge-gray"
                            }`}
                          >
                            {label}
                          </span>
                        );
                      },
                    },
                    {
                      key: "reason",
                      header: "Alasan / Keterangan",
                      render: (key) => {
                        const result =
                          selected.hasil_verifikasi?.[0]?.[key] || "-";
                        const notes = officialNotes(selected);
                        return result === "TS"
                          ? notes?.alasan_ts?.[key] ||
                              "Belum ada alasan yang dicatat"
                          : result === "TB"
                            ? key === "firmware"
                              ? "-"
                              : notes?.alasan_tb?.[key] || "-"
                            : "-";
                      },
                    },
                  ]}
                  rows={CHECKS.filter(
                    (key) =>
                      ACTIVITY_REQUIREMENTS[selected.kode_aktivitas]?.[key] !==
                      "-",
                  )}
                  rowKey={(key) => key}
                />

                {officialNotes(selected) && (
                  <div style={{ marginTop: "var(--sp-4)" }}>
                    <h4
                      style={{
                        margin: "0 0 var(--sp-2)",
                        fontSize: "var(--text-sm)",
                      }}
                    >
                      Data Pendukung
                    </h4>
                    <div
                      className="form-grid-2 verification-review-notes"
                      style={{ fontSize: "var(--text-xs)" }}
                    >
                      <div>
                        <strong>Acuan Instruksi Kerja / Test Prosedur / Manual Book:</strong>
                        <p style={{ margin: "2px 0" }}>
                          {officialNotes(selected).acuan_kriteria || "-"}
                        </p>
                      </div>
                      <div>
                        <strong>Sertifikat:</strong>
                        <p style={{ margin: "2px 0" }}>
                          {officialNotes(selected).sertifikat?.nomor || "-"}
                          {officialNotes(selected).sertifikat?.berlaku_sampai
                            ? ` (s/d ${officialNotes(selected).sertifikat.berlaku_sampai})`
                            : ""}
                        </p>
                      </div>
                      <div>
                        <strong>Firmware terverifikasi:</strong>
                        <p style={{ margin: "2px 0" }}>
                          {officialNotes(selected).firmware?.versi_aktual || "-"}
                        </p>
                      </div>
                      <div>
                        <strong>Nilai Koreksi:</strong>
                        <p style={{ margin: "2px 0" }}>
                          {officialNotes(selected).sertifikat
                            ?.penerapan_nilai_koreksi || "-"}
                        </p>
                      </div>
                    </div>
                    {officialNotes(selected).catatan_pic && (
                      <div style={{ marginTop: "var(--sp-2)" }}>
                        <strong>Catatan Pengelola:</strong>
                        <p
                          style={{
                            margin: "2px 0",
                            fontSize: "var(--text-xs)",
                            background: "var(--clr-dark-50)",
                            padding: 8,
                            borderRadius: 4,
                          }}
                        >
                          {officialNotes(selected).catatan_pic}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Form Persetujuan Manager — inline di dalam modal tinjau */}
                {canApprove && selected.status === "Diajukan" && (
                  <div
                    style={{
                      marginTop: "var(--sp-5)",
                      borderTop: "2px solid var(--clr-dark-200)",
                      paddingTop: "var(--sp-4)",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--fw-bold)",
                        marginBottom: "var(--sp-3)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <FileCheck
                        size={16}
                        style={{ color: "var(--clr-primary-500)" }}
                      />
                      Keputusan Manager
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: "var(--sp-4)",
                      }}
                    >
                      <button
                        type="button"
                        className={`btn btn-sm ${approvalMode === "approve" ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setApprovalMode("approve")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <CheckCircle2 size={14} /> Setujui
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${approvalMode === "reject" ? "btn-ghost" : "btn-ghost"}`}
                        onClick={() => setApprovalMode("reject")}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          color:
                            approvalMode === "reject"
                              ? "var(--clr-error-500, #ef4444)"
                              : undefined,
                        }}
                      >
                        <XCircle size={14} /> Tolak
                      </button>
                    </div>

                    {approvalMode === "approve" ? (
                      <div>
                        <SignatureField
                          value={managerSignature}
                          onChange={(signature) =>
                            handleSignatureChange(
                              setManagerSignature,
                              signature,
                            )
                          }
                          label="Tanda Tangan Digital Manager"
                          savedSignature={savedSignature}
                          onRestore={() => setManagerSignature(savedSignature)}
                          onForgetSaved={forgetSavedSignature}
                        />
                        <div
                          style={{
                            marginTop: "var(--sp-3)",
                            padding: "var(--sp-3)",
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            borderRadius: "var(--radius-md)",
                          }}
                        >
                          <label
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 8,
                              cursor: "pointer",
                              fontSize: "var(--text-xs)",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={affirmApproved}
                              onChange={(e) =>
                                setAffirmApproved(e.target.checked)
                              }
                              style={{ marginTop: 2, flexShrink: 0 }}
                            />
                            <span>
                              Saya menyatakan peralatan ini{" "}
                              <strong>
                                telah memenuhi seluruh kriteria kelayakan
                              </strong>{" "}
                              sesuai prosedur TLKM13/F/003 dan persetujuan ini
                              sah secara sistem.
                            </span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <SignatureField
                          value={managerSignature}
                          onChange={(signature) =>
                            handleSignatureChange(
                              setManagerSignature,
                              signature,
                            )
                          }
                          label="Tanda Tangan Digital Manager untuk Penolakan"
                          savedSignature={savedSignature}
                          onRestore={() => setManagerSignature(savedSignature)}
                          onForgetSaved={forgetSavedSignature}
                        />
                        <div className="form-group">
                          <label className="form-label">
                            Alasan Penolakan{" "}
                            <span style={{ color: "red" }}>*</span>
                          </label>
                          <select
                            className="form-select"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          >
                            <option value="">Pilih alasan penolakan</option>
                            <option value="Hasil aspek tidak sesuai">
                              Hasil aspek tidak sesuai
                            </option>
                            <option value="Data pendukung belum sesuai">
                              Data pendukung belum sesuai
                            </option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">
                            Keterangan Alasan Penolakan{" "}
                            <span style={{ color: "red" }}>*</span>
                          </label>
                          <textarea
                            className="form-textarea"
                            rows={2}
                            placeholder="Jelaskan aspek atau data pendukung yang belum sesuai..."
                            value={rejectCatatan}
                            onChange={(e) => setRejectCatatan(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer verification-review-footer">
                {canApprove &&
                  selected.status === "Diajukan" &&
                  (approvalMode === "approve" ? (
                    <button
                      type="button"
                      className="btn btn-primary verification-review-confirm"
                      disabled={
                        busy || !managerSignature?.trim() || !affirmApproved
                      }
                      onClick={handleApproveFromModal}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <CheckCircle2 size={15} />
                      {busy ? "Menyetujui..." : "Konfirmasi Persetujuan"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={
                        busy ||
                        !managerSignature?.trim() ||
                        !rejectReason.trim() ||
                        !rejectCatatan.trim()
                      }
                      onClick={handleRejectFromModal}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        color: "var(--clr-error-500, #ef4444)",
                      }}
                    >
                      <XCircle size={15} />
                      {busy ? "Menolak..." : "Konfirmasi Penolakan"}
                    </button>
                  ))}
                {selected.status === "Disetujui" &&
                  (canApprove || staffIsPengelola) && (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => exportVerificationPdf(selected)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Printer size={15} /> Export PDF
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => exportVerificationWord(selected)}
                      >
                        Export Word
                      </button>
                    </>
                  )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelected(null)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
