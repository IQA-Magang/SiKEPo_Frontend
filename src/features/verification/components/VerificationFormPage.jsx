import { ArrowLeft, Package, Send } from "lucide-react";
import { getEquipmentId } from "../../../shared/services/api.js";
import { getActivityLabel } from "../verificationData.js";
import VerificationIdentitySection from "./VerificationIdentitySection.jsx";
import VerificationChecklistSection from "./VerificationChecklistSection.jsx";
import VerificationCertificateSection from "./VerificationCertificateSection.jsx";
import VerificationFollowUpSection from "./VerificationFollowUpSection.jsx";

export default function VerificationFormPage({
  equipmentId,
  canSubmit,
  navigate,
  returnPath,
  role,
  isLabScopedUser,
  loadingEquipment,
  equipmentInfo,
  form,
  setForm,
  submitVerifikasi,
  busy,
  savedSignature,
  picSignature,
  setPicSignature,
  handleSignatureChange,
  forgetSavedSignature,
}) {
  if (equipmentId) {
    if (!canSubmit) {
      return (
        <div className="page-container fade-in-up">
          <div className="card card-padded">
            <h1 className="page-title">Akses Pengajuan Verifikasi</h1>
            <p className="page-subtitle">
              Staff pengelola dan Manager dapat mengisi dan mengajukan
              verifikasi. Staff lainnya tetap dapat melihat verifikasi beserta
              detailnya.
            </p>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => navigate(returnPath)}
            >
              <ArrowLeft size={16} /> Kembali ke Verifikasi
            </button>
          </div>
        </div>
      );
    }

    const isRejected = equipmentInfo?.status_verifikasi === "Ditolak";
    const activityCode = equipmentInfo?.kode_aktivitas || "A1";
    const equipmentInfoMatchesRoute =
      String(getEquipmentId(equipmentInfo)) === String(equipmentId);
    if (isLabScopedUser && loadingEquipment) {
      return (
        <div className="page-container fade-in-up">
          <div className="card card-padded">
            <div className="skeleton" style={{ height: 48 }} />
          </div>
        </div>
      );
    }

    if (isLabScopedUser && (!equipmentInfo || !equipmentInfoMatchesRoute)) {
      return (
        <div className="page-container fade-in-up">
          <div className="card card-padded">
            <h1 className="page-title">Peralatan tidak tersedia</h1>
            <p className="page-subtitle">
              Data verifikasi hanya dapat dilihat oleh pengguna dari lab yang
              memiliki ruangan peralatan tersebut.
            </p>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => navigate(returnPath)}
            >
              <ArrowLeft size={16} /> Kembali ke Verifikasi
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="page-container fade-in-up">
        {/* Header navigasi */}
        <div
          className="page-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--sp-4)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-3)",
            }}
          >
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => navigate(returnPath)}
              title={
                returnPath === "/verifikasi"
                  ? "Kembali ke Verifikasi"
                  : "Kembali ke Peralatan"
              }
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="page-title">
                {role === "manager"
              ? "Tinjau Verifikasi Alat Ukur"
              : isRejected
                ? "Verifikasi Ulang Peralatan"
                : "Verifikasi Alat Ukur"}
              </h1>
              {/* <p className="page-subtitle">
                Form TLKM13/F/003 untuk mencatat pemeriksaan peralatan. Isi
                hasil sesuai acuan IK/TP/Manual Book, lalu kirim untuk tahap
                berikutnya.
              </p> */}
            </div>
          </div>

        </div>

        {/* Informasi Peralatan */}
        {loadingEquipment ? (
          <div
            className="card"
            style={{ padding: "var(--sp-4)", marginBottom: "var(--sp-4)" }}
          >
            <div className="skeleton" style={{ height: 48 }} />
          </div>
        ) : equipmentInfo ? (
          <div
            className="card"
            style={{
              padding: "var(--sp-4)",
              marginBottom: "var(--sp-5)",
              borderLeft: isRejected
                ? "4px solid var(--clr-danger-500, #ef4444)"
                : "4px solid var(--clr-primary-500, #3b82f6)",
              background: "var(--clr-dark-50, #f8fafc)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "var(--sp-3)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-3)",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "var(--radius-md, 8px)",
                    background: "var(--clr-primary-100, #e0e7ff)",
                    color: "var(--clr-primary-600, #4f46e5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Package size={22} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: "var(--fw-bold)",
                      fontSize: "var(--text-base)",
                      color: "var(--clr-dark-900)",
                    }}
                  >
                    {equipmentInfo.nama_peralatan}
                  </div>
                  <div
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--clr-dark-500)",
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      No. Aset:{" "}
                      <strong>{equipmentInfo.nomor_aset || "-"}</strong>
                    </span>
                    {equipmentInfo.merek && (
                      <span>
                        Merek: {equipmentInfo.merek}{" "}
                        {equipmentInfo.tipe_model || ""}
                      </span>
                    )}
                    {equipmentInfo.laboratorium && (
                      <span>
                        Lab: {equipmentInfo.laboratorium.nama_lab || "-"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  className={`badge ${equipmentInfo.status_verifikasi === "Disetujui" ? "badge-aktif" : isRejected ? "badge-rusak" : "badge-gray"}`}
                >
                  Verifikasi:{" "}
                  {equipmentInfo.status_verifikasi || "Belum Diverifikasi"}
                </span>
              </div>
            </div>
            <div
              style={{
                marginTop: "var(--sp-2)",
                fontSize: "var(--text-xs)",
                color: "var(--clr-dark-600)",
              }}
            >
              <strong>Keterangan:</strong>{" "}
              {activityCode} — {getActivityLabel(activityCode)}
            </div>

          </div>
        ) : null}

        {/* Form Pengisian Verifikasi */}
        <form className="card card-padded verification-form" onSubmit={submitVerifikasi}>
          <VerificationIdentitySection
            equipmentInfo={equipmentInfo}
            form={form}
            setForm={setForm}
            role={role}
          />
          <VerificationChecklistSection
            form={form}
            setForm={setForm}
            equipmentInfo={equipmentInfo}
          />
          <VerificationCertificateSection form={form} setForm={setForm} />
          <VerificationFollowUpSection
            form={form}
            setForm={setForm}
            picSignature={picSignature}
            savedSignature={savedSignature}
            setPicSignature={setPicSignature}
            handleSignatureChange={handleSignatureChange}
            forgetSavedSignature={forgetSavedSignature}
          />
          <div
            style={{
              display: "flex",
              gap: "var(--sp-3)",
              justifyContent: "flex-end",
              borderTop: "1px solid var(--clr-dark-200, #e2e8f0)",
              paddingTop: "var(--sp-4)",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(returnPath)}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy}
              id="btn-ajukan-verifikasi"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Send size={16} />
              {busy
                ? "Mengirim..."
                : role === "manager"
                  ? "Kirim Verifikasi"
                  : "Ajukan Verifikasi"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // =========================================================================

  return null;
}
