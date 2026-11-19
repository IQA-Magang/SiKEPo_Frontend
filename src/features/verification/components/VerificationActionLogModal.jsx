import { useEffect, useState } from "react";
import { ErrorState, LoadingState, Modal } from "../../../shared/components/ui/index.js";
import { verifikasiApi } from "../../../shared/services/api.js";

function escapePrintHtml(value) {
  return String(value ?? "—").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

export default function VerificationActionLogModal({ verification, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const verificationId = verification?.id_verifikasi ?? verification?.id;

  useEffect(() => {
    if (!verificationId) return undefined;

    let active = true;
    setLoading(true);
    setLoadError("");

    verifikasiApi.getActionHistory(verificationId)
      .then((response) => {
        if (!Array.isArray(response?.data)) {
          throw new Error("Format data log verifikasi tidak valid.");
        }
        if (active) setLogs(response.data);
      })
      .catch((err) => {
        if (active) {
          setLoadError(err.message || "Gagal memuat log verifikasi.");
          setLogs([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [verificationId, retryCount]);

  const equipmentName = verification?.peralatan?.nama_peralatan
    || `Peralatan ID ${verification?.id_peralatan ?? "—"}`;

  function printLogs() {
    const rows = logs.map((item) => `
      <tr>
        <td>${escapePrintHtml(item.created_at ? new Date(item.created_at).toLocaleString("id-ID") : "—")}</td>
        <td>${escapePrintHtml(String(item.judul || item.aksi || "—").replaceAll("_", " "))}</td>
        <td>${escapePrintHtml(item.status)}</td>
        <td>${escapePrintHtml(item.user?.name || "Nama pengguna tidak tersedia")}</td>
        <td>${escapePrintHtml(item.keterangan)}</td>
      </tr>
    `).join("");
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Log Aktivitas Verifikasi</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
            h1 { font-size: 18px; margin: 0 0 4px; }
            p { margin: 0 0 16px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f1f5f9; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Log Aktivitas Verifikasi</h1>
          <p>${escapePrintHtml(equipmentName)}</p>
          <table>
            <thead><tr><th>Waktu</th><th>Aksi</th><th>Status</th><th>Pelaku</th><th>Keterangan</th></tr></thead>
            <tbody>${rows || '<tr><td colspan="5">Belum ada log aktivitas.</td></tr>'}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <Modal
      isOpen={Boolean(verification)}
      onClose={onClose}
      title="Log Aktivitas Verifikasi"
      description={`Riwayat aksi untuk ${equipmentName}.`}
      size="lg"
      footer={
        <button
          type="button"
          className="btn btn-secondary"
          onClick={printLogs}
          disabled={loading}
        >
          Cetak PDF Log
        </button>
      }
    >
      {loading ? (
        <LoadingState message="Memuat log verifikasi..." />
      ) : loadError ? (
        <ErrorState
          title="Gagal memuat log"
          message={loadError}
          onRetry={() => setRetryCount((count) => count + 1)}
        />
      ) : (
        logs.length === 0 ? (
          <p className="empty-state-desc">Belum ada log aktivitas untuk verifikasi ini.</p>
        ) : (
          <article className="equipment-verification-log-card">
            {logs.map((item, index) => (
                <div
                  className="equipment-verification-log-entry"
                  key={item.id_histori}
                  style={{ borderTop: index ? "1px solid var(--clr-dark-100)" : 0 }}
                >
                  <span className={`badge ${
                    item.status === "Disetujui"
                      ? "badge-aktif"
                      : item.status === "Ditolak"
                        ? "badge-rusak"
                        : "badge-kalibrasi"
                  }`}>
                    {item.status || "Verifikasi"}
                  </span>
                  <div className="equipment-verification-log-entry__content">
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--fw-semibold)", color: "var(--clr-dark-800)" }}>
                      {item.judul || String(item.aksi || "Aktivitas verifikasi").replaceAll("_", " ")}
                    </div>
                    {item.keterangan && (
                      <div style={{ marginTop: 4, fontSize: "var(--text-sm)", color: "var(--clr-dark-600)", whiteSpace: "pre-wrap" }}>
                        {item.keterangan}
                      </div>
                    )}
                    {item.user?.name && (
                      <div style={{ marginTop: 4, fontSize: "var(--text-xs)", color: "var(--clr-dark-500)" }}>
                        Oleh: {item.user.name}
                      </div>
                    )}
                    {item.created_at && (
                      <div style={{ marginTop: 4, fontSize: "var(--text-xs)", color: "var(--clr-dark-500)" }}>
                        {new Date(item.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                    )}
                  </div>
                </div>
            ))}
          </article>
        )
      )}
    </Modal>
  );
}
