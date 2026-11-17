import { formatPhotoUrl } from "../../../shared/services/api.js";

function DocumentUploadField({ form, setForm, label, id }) {
  const file = form.dokumen_pemeriksaan;

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label} <span style={{ color: "red" }}>*</span>
      </label>
      <input
        id={id}
        className="form-input"
        type="file"
        accept=".pdf,application/pdf"
        onChange={(event) =>
          setForm({
            ...form,
            dokumen_pemeriksaan: event.target.files?.[0] || null,
          })
        }
        required
      />
      <small
        style={{
          display: "block",
          marginTop: 6,
          color: "#64748b",
          fontSize: "var(--text-xs)",
        }}
      >
        Dokumen PDF, maksimal 15 MB.
        {file ? ` Dipilih: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB).` : ""}
      </small>
    </div>
  );
}

function ExistingDocument({ path, name }) {
  const url = formatPhotoUrl(path);
  if (!url) return null;
  const fileName =
    name || String(path).split(/[\\/]/).pop() || "Dokumen PDF";

  return (
    <div
      className="form-group"
      style={{ gridColumn: "1 / -1" }}
    >
      <label className="form-label">Dokumen PDF</label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--sp-3)",
          flexWrap: "wrap",
          padding: "var(--sp-3)",
          border: "1px solid #d1d5db",
          borderRadius: "var(--radius-md, 6px)",
          background: "#e5e7eb",
        }}
      >
        <span style={{ color: "#374151", overflowWrap: "anywhere" }}>
          {fileName}
        </span>
        <a
          className="btn btn-secondary btn-sm"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Lihat PDF
        </a>
      </div>
    </div>
  );
}

export default function VerificationCertificateSection({
  form,
  setForm,
  inspectionMethod,
  readOnly = false,
}) {
  const isFunctionVerification = inspectionMethod === "verifikasi_fungsi";
  const lockedFields = form.kunci_field_pemeriksaan || {};

  return (
    <div style={{ marginBottom: "var(--sp-6)" }}>
      <h3
        style={{
          fontSize: "var(--text-base)",
          fontWeight: "var(--fw-bold)",
          marginBottom: "var(--sp-3)",
        }}
      >
        {isFunctionVerification
          ? "C. Hasil Verifikasi Fungsi"
          : "C. Hasil Kalibrasi"}
      </h3>

      {isFunctionVerification ? (
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="tanggal-verifikasi-fungsi">
              Tanggal pemeriksaan <span style={{ color: "red" }}>*</span>
            </label>
            <input
              id="tanggal-verifikasi-fungsi"
              className="form-input"
              type="date"
              value={form.tanggal_verifikasi_fungsi}
              disabled={readOnly || lockedFields.tanggal_verifikasi_fungsi}
              onChange={(event) =>
                setForm({
                  ...form,
                  tanggal_verifikasi_fungsi: event.target.value,
                })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="nomor-laporan-fungsi">
              Nomor laporan <span style={{ color: "red" }}>*</span>
            </label>
            <input
              id="nomor-laporan-fungsi"
              className="form-input"
              value={form.nomor_laporan}
              disabled={readOnly || lockedFields.nomor_laporan}
              onChange={(event) =>
                setForm({ ...form, nomor_laporan: event.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="pelaksana-verifikasi-fungsi">
              Dilaksanakan oleh <span style={{ color: "red" }}>*</span>
            </label>
            <input
              id="pelaksana-verifikasi-fungsi"
              className="form-input"
              value={form.pelaksana_verifikasi}
              disabled={readOnly || lockedFields.pelaksana_verifikasi}
              onChange={(event) =>
                setForm({ ...form, pelaksana_verifikasi: event.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="hasil-verifikasi-fungsi">
              Hasil verifikasi fungsi <span style={{ color: "red" }}>*</span>
            </label>
            <select
              id="hasil-verifikasi-fungsi"
              className="form-select"
              value={form.hasil_verifikasi_fungsi}
              disabled={readOnly || lockedFields.hasil_verifikasi_fungsi}
              onChange={(event) =>
                setForm({
                  ...form,
                  hasil_verifikasi_fungsi: event.target.value,
                })
              }
              required
            >
              <option value="" disabled>
                Belum dicatat
              </option>
              <option value="sesuai">Sesuai</option>
              <option value="tidak sesuai">Tidak sesuai</option>
            </select>
          </div>

          {form.dokumen_pemeriksaan_url ? (
            <ExistingDocument
              path={form.dokumen_pemeriksaan_url}
              name={form.dokumen_pemeriksaan_nama}
            />
          ) : readOnly ? (
            <p className="inspection-form-note">
              Hasil verifikasi fungsi dicatat melalui menu Verifikasi Fungsi.
            </p>
          ) : (
            <DocumentUploadField
              form={form}
              setForm={setForm}
              id="dokumen-verifikasi-fungsi"
              label="Laporan verifikasi fungsi (PDF)"
            />
          )}
        </div>
      ) : (
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="tanggal-kalibrasi">
              Tanggal kalibrasi <span style={{ color: "red" }}>*</span>
            </label>
            <input
              id="tanggal-kalibrasi"
              className="form-input"
              type="date"
              value={form.tanggal_kalibrasi}
              disabled={readOnly || lockedFields.tanggal_kalibrasi}
              onChange={(event) =>
                setForm({ ...form, tanggal_kalibrasi: event.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="nomor-sertifikat">
              Nomor sertifikat <span style={{ color: "red" }}>*</span>
            </label>
            <input
              id="nomor-sertifikat"
              className="form-input"
              value={form.nomor_sertifikat}
              disabled={readOnly || lockedFields.nomor_sertifikat}
              onChange={(event) =>
                setForm({ ...form, nomor_sertifikat: event.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="penerbit-sertifikat">
              Diterbitkan oleh <span style={{ color: "red" }}>*</span>
            </label>
            <input
              id="penerbit-sertifikat"
              className="form-input"
              value={form.penyedia_kalibrasi}
              disabled={readOnly || lockedFields.penyedia_kalibrasi}
              onChange={(event) =>
                setForm({ ...form, penyedia_kalibrasi: event.target.value })
              }
              required
            />
          </div>

          {form.dokumen_pemeriksaan_url ? (
            <ExistingDocument
              path={form.dokumen_pemeriksaan_url}
              name={form.dokumen_pemeriksaan_nama}
            />
          ) : readOnly ? (
            <p className="inspection-form-note">
              Hasil kalibrasi dicatat melalui menu Kalibrasi.
            </p>
          ) : (
            <DocumentUploadField
              form={form}
              setForm={setForm}
              id="dokumen-sertifikat-kalibrasi"
              label="Sertifikat (PDF)"
            />
          )}
        </div>
      )}
    </div>
  );
}
