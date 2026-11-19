import { useEffect, useState } from "react";
import DataTable from "../../../shared/components/ui/DataTable.jsx";
import { ErrorState, LoadingState, Modal } from "../../../shared/components/ui/index.js";
import { verifikasiApi } from "../../../shared/services/api.js";

const columns = [
  {
    key: "waktu",
    header: "Waktu",
    render: (item) =>
      item.created_at
        ? new Date(item.created_at).toLocaleString("id-ID")
        : "—",
  },
  {
    key: "aksi",
    header: "Aksi",
    render: (item) => String(item.aksi || "—").replaceAll("_", " "),
  },
  {
    key: "status",
    header: "Status",
    render: (item) => item.status || "—",
  },
  {
    key: "user",
    header: "Nama",
    render: (item) => item.user?.name || "Nama pengguna tidak tersedia",
  },
];

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

  return (
    <Modal
      isOpen={Boolean(verification)}
      onClose={onClose}
      title="Log Aktivitas Verifikasi"
      description={`Riwayat aksi untuk ${equipmentName}.`}
      size="lg"
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
        <DataTable
          columns={columns}
          rows={logs}
          rowKey={(item) => item.id_histori}
          ariaLabel="Log aktivitas verifikasi"
          emptyMessage="Belum ada log aktivitas untuk verifikasi ini."
        />
      )}
    </Modal>
  );
}
