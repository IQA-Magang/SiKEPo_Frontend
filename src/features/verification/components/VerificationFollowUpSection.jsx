import SignatureField from "../../../shared/components/ui/SignatureField.jsx";
import { FOLLOW_UP_OPTIONS } from "../verificationData.js";

export default function VerificationFollowUpSection({
  form,
  setForm,
  picSignature,
  setPicSignature,
  handleSignatureChange,
}) {
  return (
    <>
          {/* D. Keputusan Kelayakan dan Tindak Lanjut */}
          <div style={{ marginBottom: "var(--sp-6)" }}>
            <h3
              style={{
                fontSize: "var(--text-base)",
                fontWeight: "var(--fw-bold)",
                marginBottom: "var(--sp-2)",
              }}
            >
              D. Keputusan dan Tindak Lanjut
            </h3>
            <div className="form-group">
              <label className="form-label">Rencana Tindak Lanjut</label>
              <select
                className="form-select"
                value={form.tindak_lanjut}
                disabled
              >
                <option value="">-- Pilih Tindak Lanjut --</option>
                {FOLLOW_UP_OPTIONS.map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
              <small
                style={{
                  display: "block",
                  marginTop: 6,
                  color: "var(--clr-dark-500)",
                  fontSize: "var(--text-xs)",
                }}
              >
                Ditentukan otomatis berdasarkan hasil pemeriksaan.
              </small>
            </div>

            <div className="form-group" style={{ marginTop: "var(--sp-3)" }}>
              <label className="form-label">
                Catatan Pemeriksaan Pengelola
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Catatan hasil verifikasi fisik, kelayakan, dan kesiapan alat..."
                value={form.catatan}
                onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginTop: "var(--sp-3)" }}>
              <div style={{ maxWidth: 520 }}>
                <SignatureField
                  value={picSignature}
                  onChange={(signature) =>
                    handleSignatureChange(setPicSignature, signature)
                  }
                  label="Tanda Tangan Pengelola"
                />
              </div>
            </div>
          </div>

          {/* Tombol Aksi — Tidak ada draft, langsung ajukan verifikasi */}
    </>
  );
}
