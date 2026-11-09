function escapeHtml(value) {
  return String(value ?? "—")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("id-ID");
}

export function exportEquipmentActivityLogPdf(log, equipment, typeLabel) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Izinkan pop-up browser untuk mengekspor log ke PDF.");
  }

  const record = log.record || {};
  const verification = record.verifikasi || record;
  const results = Array.isArray(verification.hasil_verifikasi)
    ? verification.hasil_verifikasi[0]
    : verification.hasil_verifikasi;
  const checkLabels = {
    identitas: "Identitas alat",
    kelengkapan: "Kelengkapan",
    firmware: "Firmware",
    kondisi_fisik: "Kondisi fisik",
    segel: "Keutuhan segel",
    fungsi_awal: "Fungsi awal",
    metrologi: "Karakteristik metrologi",
    sertifikat: "Sertifikat",
  };
  const rows = [
    ["Jenis log", typeLabel],
    ["Aktivitas", log.title],
    ["Status", log.status],
    ["Waktu", formatDate(log.date)],
    ["Pelaku", log.actor || record.user?.name],
    ["Keterangan", log.description || record.keterangan],
    ["Catatan", log.note || record.catatan_peninjauan || record.catatan],
    ["ID log", record.id_histori ?? record.id_log ?? record.id],
    ["ID referensi", record.referensi_id ?? record.id_verifikasi],
    ["Kode aktivitas", verification.kode_aktivitas],
    ["Keputusan", verification.keputusan],
    ["Tindak lanjut", verification.tindak_lanjut],
    [
      "PIC",
      verification.pic_user?.nama_lengkap ||
        verification.pic_user?.nama ||
        verification.pic_user?.name,
    ],
    [
      "Diverifikasi oleh",
      verification.verified_by_user?.nama_lengkap ||
        verification.verified_by_user?.nama ||
        verification.verified_by_user?.name,
    ],
    ...Object.entries(results || {}).map(([key, value]) => [
      `Hasil: ${checkLabels[key] || key.replaceAll("_", " ")}`,
      value,
    ]),
  ].filter(([, value]) => value !== undefined && value !== null && value !== "");

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Log ${escapeHtml(log.title || "Aktivitas")}</title>
        <style>
          @page { size: A4 portrait; margin: 18mm; }
          body { font: 12px Arial, sans-serif; color: #172033; }
          h1 { margin: 0 0 6px; font-size: 20px; }
          p { margin: 0 0 18px; color: #526174; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; border: 1px solid #cbd5e1; text-align: left; vertical-align: top; white-space: pre-wrap; }
          th { width: 30%; background: #f1f5f9; }
          @media screen { body { max-width: 760px; margin: 32px auto; } }
        </style>
      </head>
      <body>
        <h1>Log Aktivitas ${escapeHtml(typeLabel)}</h1>
        <p>${escapeHtml(equipment?.nama_peralatan)} (${escapeHtml(equipment?.nomor_aset)})</p>
        <table>
          <tbody>
            <tr><th>Peralatan</th><td>${escapeHtml(equipment?.nama_peralatan)}</td></tr>
            <tr><th>Nomor aset</th><td>${escapeHtml(equipment?.nomor_aset)}</td></tr>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
