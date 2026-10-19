import { CheckCircle2, FileCheck, XCircle } from "lucide-react";
import { Button, FormField } from "../../../shared/components/ui/index.js";
import SignatureField from "../../../shared/components/ui/SignatureField.jsx";

export default function VerificationDecisionForm({
  approvalMode,
  setApprovalMode,
  managerSignature,
  setManagerSignature,
  handleSignatureChange,
  savedSignature,
  forgetSavedSignature,
  affirmApproved,
  setAffirmApproved,
  rejectReason,
  setRejectReason,
  rejectCatatan,
  setRejectCatatan,
}) {
  return (
    <section
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
        <FileCheck size={16} style={{ color: "var(--clr-primary-500)" }} />
        Keputusan Manager
      </h3>

      <div style={{ display: "flex", gap: 8, marginBottom: "var(--sp-4)" }}>
        <Button
          variant={approvalMode === "approve" ? "primary" : "ghost"}
          size="sm"
          icon={<CheckCircle2 size={14} />}
          aria-pressed={approvalMode === "approve"}
          onClick={() => setApprovalMode("approve")}
        >
          Setujui
        </Button>
        <Button
          variant={approvalMode === "reject" ? "danger" : "ghost"}
          size="sm"
          icon={<XCircle size={14} />}
          aria-pressed={approvalMode === "reject"}
          onClick={() => setApprovalMode("reject")}
        >
          Tolak
        </Button>
      </div>

      <SignatureField
        value={managerSignature}
        onChange={(signature) =>
          handleSignatureChange(setManagerSignature, signature)
        }
        label={
          approvalMode === "approve"
            ? "Tanda Tangan Digital Manager"
            : "Tanda Tangan Digital Manager untuk Penolakan"
        }
        savedSignature={savedSignature}
        onRestore={() => setManagerSignature(savedSignature)}
        onForgetSaved={forgetSavedSignature}
      />

      {approvalMode === "approve" ? (
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
              onChange={(event) => setAffirmApproved(event.target.checked)}
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <span>
              Saya menyatakan peralatan ini{" "}
              <strong>telah memenuhi seluruh kriteria kelayakan</strong> sesuai
              prosedur TLKM13/F/003 dan persetujuan ini sah secara sistem.
            </span>
          </label>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "var(--sp-3)" }}>
          <FormField label="Alasan Penolakan" htmlFor="reject-reason" required>
            <select
              id="reject-reason"
              className="form-select"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              required
            >
              <option value="">Pilih alasan penolakan</option>
              <option value="Hasil aspek tidak sesuai">
                Hasil aspek tidak sesuai
              </option>
              <option value="Data pendukung belum sesuai">
                Data pendukung belum sesuai
              </option>
            </select>
          </FormField>
          <FormField
            label="Keterangan Alasan Penolakan"
            htmlFor="reject-notes"
            required
          >
            <textarea
              id="reject-notes"
              className="form-textarea"
              rows={2}
              placeholder="Jelaskan aspek atau data pendukung yang belum sesuai..."
              value={rejectCatatan}
              onChange={(event) => setRejectCatatan(event.target.value)}
              required
            />
          </FormField>
        </div>
      )}
    </section>
  );
}
