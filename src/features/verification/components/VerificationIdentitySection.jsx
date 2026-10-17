import { FileCheck } from "lucide-react";
import { getActivityLabel } from "../verificationData.js";

export default function VerificationIdentitySection({equipmentInfo, form, setForm, role}) {
  return (
    <>
          {/* A. Identitas Alat Ukur dan Kegiatan */}
          <div style={{ marginBottom: "var(--sp-6)" }}>
            <h3
              style={{
                fontSize: "var(--text-base)",
                fontWeight: "var(--fw-bold)",
                marginBottom: "var(--sp-3)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <FileCheck
                size={18}
                style={{ color: "var(--clr-primary-500)" }}
              />
              A. Identitas Alat Ukur dan Kegiatan
            </h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Nomor Aset</label>
                <input
                  className="form-input"
                  type="text"
                  value={
                    equipmentInfo?.nomor_aset
                      ? `${equipmentInfo.nomor_aset}`
                      : `ID: ${form.id_peralatan}`
                  }
                  readOnly
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nama Peralatan</label>
                <input
                  className="form-input"
                  type="text"
                  value={equipmentInfo?.nama_peralatan || "-"}
                  readOnly
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Tanggal Verifikasi <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  className="form-input"
                  type="date"
                  value={form.tanggal_verifikasi}
                  onChange={(e) =>
                    setForm({ ...form, tanggal_verifikasi: e.target.value })
                  }
                  required
                />
              </div>

              {role === "manager" && <div className="form-group">
                <label className="form-label">
                  Kode Aktivitas
                </label>
                <input
                  className="form-input"
                  type="text"
                  value={
                    role === "manager"
                      ? form.kode_aktivitas
                      : getActivityLabel(form.kode_aktivitas)
                  }
                  readOnly
                  disabled
                />
                <small
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--clr-dark-500)",
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  Ditentukan otomatis oleh sistem berdasarkan status peralatan.
                </small>
              </div>}

              <div className="form-group">
                <label className="form-label">
                  Acuan Instruksi Kerja / Test Prosedur / Manual Book{" "}
                  <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  className="form-input"
                  placeholder="Isi nomor dokumen acuan (contoh: TLKM/IK/LAB/XXX)"
                  value={form.acuan_kriteria}
                  onChange={(e) =>
                    setForm({ ...form, acuan_kriteria: e.target.value })
                  }
                  required
                />
                <small
                  style={{
                    display: "block",
                    marginTop: 4,
                    color: "var(--clr-dark-500)",
                    fontSize: "var(--text-xs)",
                  }}
                >
                  Gunakan nomor Instruksi Kerja, Test Prosedur, atau Manual
                  Book sesuai format dokumen laboratorium.
                </small>
              </div>
            </div>
          </div>
    </>
  );
}
