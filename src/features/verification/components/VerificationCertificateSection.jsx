
export default function VerificationCertificateSection({form, setForm}) {
  return (
    <>
          {/* C. Sertifikat Kalibrasi dan Nilai Koreksi */}
          <div style={{ marginBottom: "var(--sp-6)" }}>
            <h3
              style={{
                fontSize: "var(--text-base)",
                fontWeight: "var(--fw-bold)",
                marginBottom: "var(--sp-3)",
              }}
            >
              C. Sertifikat Kalibrasi dan Nilai Koreksi
            </h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Nomor Sertifikat</label>
                <input
                  className="form-input"
                  placeholder="Nomor sertifikat kalibrasi (jika ada)"
                  value={form.nomor_sertifikat}
                  onChange={(e) =>
                    setForm({ ...form, nomor_sertifikat: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Penyedia Kalibrasi</label>
                <input
                  className="form-input"
                  placeholder="Laboratorium / Lembaga pengkalibrasi"
                  value={form.penyedia_kalibrasi}
                  onChange={(e) =>
                    setForm({ ...form, penyedia_kalibrasi: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Berlaku Sampai (Jatuh Tempo)
                </label>
                <input
                  className="form-input"
                  type="date"
                  value={form.berlaku_sampai}
                  onChange={(e) =>
                    setForm({ ...form, berlaku_sampai: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Penerapan Nilai Koreksi</label>
                <select
                  className="form-select"
                  value={form.nilai_koreksi}
                  onChange={(e) =>
                    setForm({ ...form, nilai_koreksi: e.target.value })
                  }
                >
                  <option value="Y Diterapkan">Y - Diterapkan</option>
                  <option value="T Tidak diterapkan">T - Tidak Diterapkan</option>
                </select>
              </div>
            </div>
          </div>
    </>
  );
}
