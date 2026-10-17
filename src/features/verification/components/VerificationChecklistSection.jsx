import { ACTIVITY_REQUIREMENTS, CHECKS, CHECK_LABELS, isMetrologyApplicable } from "../verificationData.js";

export default function VerificationChecklistSection({form, setForm, equipmentInfo}) {
  return (
    <>
          {/* B. Hasil Pemeriksaan Aspek Verifikasi */}
          <div style={{ marginBottom: "var(--sp-6)" }}>
            <div style={{ marginBottom: "var(--sp-3)" }}>
              <h3
                style={{
                  fontSize: "var(--text-base)",
                  fontWeight: "var(--fw-bold)",
                  margin: 0,
                }}
              >
                B. Hasil Pemeriksaan
              </h3>
              <p
                className="page-subtitle"
                style={{ fontSize: "var(--text-xs)", marginTop: 2 }}
              >
              </p>
            </div>

            {form.kode_aktivitas ? (
              <div className="form-grid-2">
                {CHECKS.filter(
                  (key) =>
                    ACTIVITY_REQUIREMENTS[form.kode_aktivitas][key] !== "-" &&
                    (key !== "metrologi" ||
                      isMetrologyApplicable(equipmentInfo)),
                ).map((key) => {
                  const requirement =
                    ACTIVITY_REQUIREMENTS[form.kode_aktivitas][key];
                  const isTB = form.hasil_verifikasi[key] === "TB";
                  const isTS = form.hasil_verifikasi[key] === "TS";
                  return (
                    <div
                      key={key}
                      className="form-group"
                      style={{
                        padding: "var(--sp-3)",
                        borderRadius: "var(--radius-md, 6px)",
                        background: isTS
                          ? "#fff1f2"
                          : isTB
                            ? "#f8fafc"
                            : "#f0fdf4",
                        border: `1px solid ${isTS ? "#fecdd3" : isTB ? "#e2e8f0" : "#bbf7d0"}`,
                      }}
                    >
                      <label
                        className="form-label"
                        style={{
                          fontWeight: "var(--fw-semibold)",
                          fontSize: "var(--text-xs)",
                        }}
                      >
                        {CHECK_LABELS[key]}
                        <span
                          style={{
                            marginLeft: 6,
                            color:
                              requirement === "W" || key === "firmware"
                                ? "#b91c1c"
                                : "#64748b",
                            fontWeight: "var(--fw-medium)",
                          }}
                        >
                          {key === "firmware"
                            ? "(Wajib: Ada/Tidak Ada)"
                            : requirement === "W"
                              ? "(Wajib)"
                              : "(Opsional)"}
                        </span>
                      </label>
                      <select
                        className="form-select"
                        value={form.hasil_verifikasi[key]}
                        onChange={(e) => {
                          const value = e.target.value;
                          setForm({
                            ...form,
                            hasil_verifikasi: {
                              ...form.hasil_verifikasi,
                              [key]: value,
                            },
                            ...(key === "firmware"
                              ? {
                                  firmware_versi_aktual:
                                    value === "S"
                                      ? equipmentInfo?.peranti_lunak_versi || ""
                                      : "",
                                }
                              : {}),
                          });
                        }}
                      >
                        <option value="">Pilih hasil verifikasi</option>
                        {key === "firmware" ? (
                          <>
                            <option value="S">Ada</option>
                            <option value="TS">Tidak Ada</option>
                          </>
                        ) : (
                          <>
                            <option value="S">Sesuai</option>
                            <option value="TS">Tidak Sesuai</option>
                          </>
                        )}
                        {key !== "firmware" && (
                          <option value="TB">Tidak Berlaku</option>
                        )}
                      </select>

                      {key === "firmware" && (
                        <div style={{ marginTop: 6 }}>
                          <small
                            style={{
                              display: "block",
                              marginBottom: 6,
                              color: "var(--clr-dark-500)",
                              fontSize: "var(--text-xs)",
                            }}
                          >
                            Versi tercatat pada data peralatan:{" "}
                            {equipmentInfo?.peranti_lunak_versi || "Belum dicatat"}
                          </small>
                          {form.hasil_verifikasi.firmware === "S" && (
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: "var(--text-xs)" }}>
                                Nama / versi firmware yang terpasang{" "}
                                <span style={{ color: "red" }}>*</span>
                              </label>
                              <input
                                className="form-input"
                                type="text"
                                value={form.firmware_versi_aktual}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    firmware_versi_aktual: e.target.value,
                                  })
                                }
                                placeholder="Masukkan nama atau versi firmware"
                                required
                              />
                              {form.firmware_versi_aktual.trim() &&
                                form.firmware_versi_aktual.trim() !==
                                  (equipmentInfo?.peranti_lunak_versi || "").trim() && (
                                  <small
                                    style={{
                                      display: "block",
                                      marginTop: 6,
                                      color: "#b45309",
                                      fontSize: "var(--text-xs)",
                                    }}
                                  >
                                    Versi berbeda dari data peralatan. Catat versi ini untuk pembaruan data peralatan.
                                  </small>
                                )}
                            </div>
                          )}
                        </div>
                      )}

                      {isTS && (
                        <div style={{ marginTop: 6 }}>
                          <label
                            className="form-label"
                            style={{ fontSize: "var(--text-xs)" }}
                          >
                            Keterangan / alasan{" "}
                            {key === "firmware" ? "Tidak Ada" : "Tidak Sesuai"}{" "}
                            <span style={{ color: "red" }}>*</span>
                          </label>
                          <textarea
                            className="form-textarea"
                            rows={2}
                            placeholder={`Jelaskan alasan hasil ${
                              key === "firmware" ? "Tidak Ada" : "Tidak Sesuai"
                            }...`}
                            value={form.ts_alasan[key] || ""}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                ts_alasan: {
                                  ...form.ts_alasan,
                                  [key]: event.target.value,
                                },
                              })
                            }
                            required
                          />
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            ) : (
              <p
                className="page-subtitle"
                style={{ fontSize: "var(--text-xs)" }}
              >
                Pilih kode aktivitas untuk menampilkan aspek pemeriksaan yang
                berlaku.
              </p>
            )}
          </div>
    </>
  );
}
