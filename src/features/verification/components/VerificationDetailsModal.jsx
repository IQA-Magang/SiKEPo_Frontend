import { createPortal } from "react-dom";
import { CheckCircle2, FileText, Printer, XCircle } from "lucide-react";
import DataTable from "../../../shared/components/ui/DataTable.jsx";
import { Button } from "../../../shared/components/ui/index.js";
import {
  exportVerificationPdf,
  exportVerificationWord,
} from "../../../shared/lib/verificationPdf.js";
import SignatureDisplayCard from "./SignatureDisplayCard.jsx";
import VerificationDecisionForm from "./VerificationDecisionForm.jsx";
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
                                  ? key === "firmware"
                                    ? "badge-gray"
                                    : "badge-rusak"
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
                  <VerificationDecisionForm
                    approvalMode={approvalMode}
                    setApprovalMode={setApprovalMode}
                    managerSignature={managerSignature}
                    setManagerSignature={setManagerSignature}
                    handleSignatureChange={handleSignatureChange}
                    savedSignature={savedSignature}
                    forgetSavedSignature={forgetSavedSignature}
                    affirmApproved={affirmApproved}
                    setAffirmApproved={setAffirmApproved}
                    rejectReason={rejectReason}
                    setRejectReason={setRejectReason}
                    rejectCatatan={rejectCatatan}
                    setRejectCatatan={setRejectCatatan}
                  />
                )}
              </div>

              <div className="modal-footer verification-review-footer">
                {canApprove &&
                  selected.status === "Diajukan" &&
                  (approvalMode === "approve" ? (
                    <Button
                      variant="primary"
                      className="verification-review-confirm"
                      icon={<CheckCircle2 size={15} />}
                      disabled={
                        busy || !managerSignature?.trim() || !affirmApproved
                      }
                      onClick={handleApproveFromModal}
                    >
                      {busy ? "Menyetujui..." : "Konfirmasi Persetujuan"}
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      icon={<XCircle size={15} />}
                      disabled={
                        busy ||
                        !managerSignature?.trim() ||
                        !rejectReason.trim() ||
                        !rejectCatatan.trim()
                      }
                      onClick={handleRejectFromModal}
                    >
                      {busy ? "Menolak..." : "Konfirmasi Penolakan"}
                    </Button>
                  ))}
                {selected.status === "Disetujui" &&
                  (canApprove || staffIsPengelola) && (
                    <>
                      <Button
                        variant="secondary"
                        icon={<Printer size={15} />}
                        onClick={() => exportVerificationPdf(selected)}
                      >
                        Export PDF
                      </Button>
                      <Button
                        variant="secondary"
                        icon={<FileText size={15} />}
                        onClick={() => exportVerificationWord(selected)}
                      >
                        Export Word
                      </Button>
                    </>
                  )}
                <Button
                  variant="secondary"
                  onClick={() => setSelected(null)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
