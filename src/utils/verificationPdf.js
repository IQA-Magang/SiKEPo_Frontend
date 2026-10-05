/**
 * Utility untuk mengekspor dokumen verifikasi peralatan (TLKM13/F/003)
 * ke format PDF melalui dialog cetak browser (Save as PDF) dengan tata letak resmi
 * standar Telkom Test House (TTH).
 */

const CHECK_LABELS = {
  identitas: 'Identitas Alat Ukur',
  kelengkapan: 'Kelengkapan Aksesoris',
  firmware: 'Versi Firmware / Peranti Lunak',
  kondisi_fisik: 'Kondisi Fisik / Visual',
  segel: 'Keutuhan Segel Kalibrasi',
  fungsi_awal: 'Pemeriksaan Fungsi Awal',
  metrologi: 'Kesesuaian Spesifikasi Metrologi',
  sertifikat: 'Validitas Sertifikat Kalibrasi',
};

const CHECKS = [
  'identitas',
  'kelengkapan',
  'firmware',
  'kondisi_fisik',
  'segel',
  'fungsi_awal',
  'metrologi',
  'sertifikat',
];

const ACTIVITY_MAP = {
  P1: 'P1 — Peralatan baru diterima',
  P2: 'P2 — Setelah kalibrasi',
  P3: 'P3 — Setelah verifikasi fungsi',
  P4: 'P4 — Setelah pengecekan antara/karakterisasi ulang',
  P5: 'P5 — Setelah dipinjam/dipindahkan atau dikembalikan',
  P6: 'P6 — Setelah pemeliharaan',
  P7: 'P7 — Setelah penyesuaian',
  P8: 'P8 — Setelah perbaikan',
  P9: 'P9 — Kembali dari peninjauan tanpa perbaikan',
  'P2+P5': 'P2+P5 — Kalibrasi dan pengembalian',
  'P8+P2': 'P8+P2 — Perbaikan lalu kalibrasi',
};

function formatTanggalIndo(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function parseOfficialNotes(rawNotes) {
  if (!rawNotes) return {};
  try {
    const parsed = typeof rawNotes === 'string' ? JSON.parse(rawNotes) : rawNotes;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return { catatan_pic: String(rawNotes) };
  }
}

export function exportVerificationPdf(data) {
  if (!data) return;

  const peralatan = data.peralatan || {};
  const hasilList = Array.isArray(data.hasil_verifikasi) && data.hasil_verifikasi.length > 0
    ? data.hasil_verifikasi[0]
    : data.hasil_verifikasi || {};
  const officialNotes = parseOfficialNotes(data.catatan);
  const sertifikatData = officialNotes.sertifikat || {};
  const tbAlasan = officialNotes.alasan_tb || {};

  const picName = data.pic_user?.nama_lengkap || data.pic_user?.nama || data.pic_user?.name || data.pic_user?.username || data.pic_user?.email || 'PIC Peralatan';
  const picNip = data.pic_user?.nip ? `NIP. ${data.pic_user.nip}` : 'Staff Laboratorium';
  const managerName = data.verified_by_user?.nama_lengkap || data.verified_by_user?.nama || data.verified_by_user?.name || data.verified_by_user?.username || data.verified_by_user?.email || 'Manager Laboratorium';
  const managerNip = data.verified_by_user?.nip ? `NIP. ${data.verified_by_user.nip}` : 'Manager Lab';

  const tglVerifikasiFormatted = formatTanggalIndo(data.tanggal_verifikasi);
  const picSignedAtFormatted = formatTanggalIndo(data.pic_signed_at || data.tanggal_verifikasi);
  const managerSignedAtFormatted = formatTanggalIndo(data.manager_signed_at || data.verified_at);

  const kodeAktivitasLabel = ACTIVITY_MAP[data.kode_aktivitas] || data.kode_aktivitas || '-';

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Verifikasi_${peralatan.nomor_aset || 'Alat'}_TLKM13-F-003</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #111827;
      background: #ffffff;
      padding: 10px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border: 2px solid #000;
      margin-bottom: 12px;
    }
    .header-table td {
      border: 1px solid #000;
      padding: 6px 10px;
      vertical-align: middle;
    }
    .logo-box {
      width: 25%;
      text-align: center;
      font-weight: bold;
    }
    .logo-red {
      color: #EE2E24;
      font-size: 16pt;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .logo-sub {
      font-size: 8pt;
      color: #374151;
      text-transform: uppercase;
      font-weight: 600;
      margin-top: 2px;
    }
    .title-box {
      width: 50%;
      text-align: center;
    }
    .doc-main-title {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-sub-title {
      font-size: 10pt;
      font-weight: bold;
      color: #1f2937;
      margin-top: 3px;
    }
    .meta-box {
      width: 25%;
      font-size: 8pt;
      line-height: 1.4;
    }
    .section-title {
      background-color: #f3f4f6;
      border: 1px solid #374151;
      padding: 4px 8px;
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 10px;
      margin-bottom: 4px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 9.5pt;
    }
    .info-table td {
      padding: 4px 6px;
      vertical-align: top;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-label {
      width: 28%;
      color: #4b5563;
      font-weight: 600;
    }
    .info-sep {
      width: 2%;
      text-align: center;
    }
    .info-val {
      width: 70%;
      color: #111827;
      font-weight: 500;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0 10px 0;
      font-size: 9.5pt;
    }
    .data-table th, .data-table td {
      border: 1px solid #374151;
      padding: 5px 8px;
      text-align: left;
    }
    .data-table th {
      background-color: #e5e7eb;
      font-weight: bold;
      font-size: 9pt;
      text-transform: uppercase;
    }
    .text-center { text-align: center !important; }
    .badge-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: bold;
    }
    .badge-s { background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .badge-ts { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .badge-tb { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .status-box {
      border: 2px solid #16a34a;
      background-color: #f0fdf4;
      padding: 8px 12px;
      border-radius: 6px;
      margin: 10px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .status-text {
      font-size: 11pt;
      font-weight: bold;
      color: #15803d;
    }
    .sign-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      border: 1px solid #374151;
      page-break-inside: avoid;
    }
    .sign-table th {
      background-color: #f3f4f6;
      border: 1px solid #374151;
      padding: 6px;
      font-size: 9.5pt;
      text-align: center;
      width: 50%;
    }
    .sign-table td {
      border: 1px solid #374151;
      padding: 10px;
      vertical-align: bottom;
      text-align: center;
      height: 120px;
      width: 50%;
    }
    .sig-img {
      max-height: 70px;
      max-width: 200px;
      display: block;
      margin: 0 auto 6px auto;
      object-fit: contain;
    }
    .sig-name {
      font-weight: bold;
      font-size: 10pt;
      text-decoration: underline;
    }
    .sig-title {
      font-size: 8.5pt;
      color: #4b5563;
      margin-top: 2px;
    }
    .footer-note {
      margin-top: 12px;
      font-size: 7.5pt;
      color: #6b7280;
      display: flex;
      justify-content: space-between;
      border-top: 1px dashed #d1d5db;
      padding-top: 4px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <!-- HEADER STANDAR DOKUMEN MUTU TTH -->
  <table class="header-table">
    <tr>
      <td class="logo-box">
        <div class="logo-red">TELKOM TEST HOUSE</div>
        <div class="logo-sub">PT Telkom Indonesia (Persero) Tbk</div>
      </td>
      <td class="title-box">
        <div class="doc-main-title">FORMULIR VERIFIKASI ALAT UKUR</div>
        <div class="doc-sub-title">PENGUJIAN KELAYAKAN FUNGSI & METROLOGI</div>
      </td>
      <td class="meta-box">
        <div><strong>No. Dok:</strong> TLKM13/F/003</div>
        <div><strong>Edisi / Rev:</strong> 05 / 00</div>
        <div><strong>Tgl Efektif:</strong> ${tglVerifikasiFormatted}</div>
        <div><strong>Halaman:</strong> 1 dari 1</div>
      </td>
    </tr>
  </table>

  <!-- SECTION A: IDENTITAS ALAT & KEGIATAN -->
  <div class="section-title">A. Identitas Alat Ukur dan Kegiatan Verifikasi</div>
  <table class="info-table">
    <tr>
      <td class="info-label">Nama Peralatan</td>
      <td class="info-sep">:</td>
      <td class="info-val"><strong>${peralatan.nama_peralatan || '-'}</strong></td>
      <td class="info-label">Nomor Aset / Kode</td>
      <td class="info-sep">:</td>
      <td class="info-val"><strong>${peralatan.nomor_aset || '-'}</strong></td>
    </tr>
    <tr>
      <td class="info-label">Merek / Pabrikan</td>
      <td class="info-sep">:</td>
      <td class="info-val">${peralatan.merek || '-'}</td>
      <td class="info-label">Tipe / Model</td>
      <td class="info-sep">:</td>
      <td class="info-val">${peralatan.tipe_model || '-'}</td>
    </tr>
    <tr>
      <td class="info-label">Nomor Seri (Serial No.)</td>
      <td class="info-sep">:</td>
      <td class="info-val">${peralatan.nomor_seri || '-'}</td>
      <td class="info-label">Perangkat Lunak / Firmware</td>
      <td class="info-sep">:</td>
      <td class="info-val">${peralatan.peranti_lunak_versi || '-'}</td>
    </tr>
    <tr>
      <td class="info-label">Laboratorium / Ruangan</td>
      <td class="info-sep">:</td>
      <td class="info-val">${peralatan.laboratorium?.nama_labs || peralatan.laboratorium?.nama_lab || '-'} / ${peralatan.ruangan?.nama_ruangan || '-'}</td>
      <td class="info-label">Penanggung Jawab (PIC)</td>
      <td class="info-sep">:</td>
      <td class="info-val">${picName}</td>
    </tr>
    <tr>
      <td class="info-label">Tanggal Pelaksanaan</td>
      <td class="info-sep">:</td>
      <td class="info-val">${tglVerifikasiFormatted}</td>
      <td class="info-label">Kode Aktivitas</td>
      <td class="info-sep">:</td>
      <td class="info-val"><strong>${kodeAktivitasLabel}</strong></td>
    </tr>
    <tr>
      <td class="info-label">Acuan Kriteria Keberterimaan</td>
      <td class="info-sep">:</td>
      <td class="info-val" colspan="4">${officialNotes.acuan_kriteria || 'Spesifikasi Pabrikan / Prosedur Mutu TTH'}</td>
    </tr>
  </table>

  <!-- SECTION B: PEMERIKSAAN 8 ASPEK -->
  <div class="section-title">B. Hasil Pemeriksaan Aspek Kelayakan Peralatan</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 6%;" class="text-center">No</th>
        <th style="width: 44%;">Aspek yang Diverifikasi</th>
        <th style="width: 18%;" class="text-center">Hasil Penilaian</th>
        <th style="width: 32%;">Keterangan / Alasan (jika TB / TS)</th>
      </tr>
    </thead>
    <tbody>
      ${CHECKS.map((key, idx) => {
        const val = hasilList[key] || '-';
        let badgeClass = 'badge-tb';
        let labelHasil = val;
        if (val === 'S') { badgeClass = 'badge-s'; labelHasil = 'S (Sesuai)'; }
        else if (val === 'TS') { badgeClass = 'badge-ts'; labelHasil = 'TS (Tidak Sesuai)'; }
        else if (val === 'TB') { badgeClass = 'badge-tb'; labelHasil = 'TB (Tidak Berlaku)'; }

        const reason = val === 'TB' ? (tbAlasan[key] || '-') : (val === 'TS' ? 'Perlu tindakan perbaikan' : 'Memenuhi syarat');

        return `<tr>
          <td class="text-center">${idx + 1}</td>
          <td>${CHECK_LABELS[key]}</td>
          <td class="text-center"><span class="badge-status ${badgeClass}">${labelHasil}</span></td>
          <td style="font-size: 8.5pt; color: #374151;">${reason}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <!-- SECTION C: SERTIFIKAT & DATA PENDUKUNG -->
  <div class="section-title">C. Data Sertifikat Kalibrasi & Peninjauan Hasil</div>
  <table class="info-table">
    <tr>
      <td class="info-label">Nomor Sertifikat Kalibrasi</td>
      <td class="info-sep">:</td>
      <td class="info-val">${sertifikatData.nomor || '-'}</td>
      <td class="info-label">Penyedia / Lab Kalibrasi</td>
      <td class="info-sep">:</td>
      <td class="info-val">${sertifikatData.penyedia || '-'}</td>
    </tr>
    <tr>
      <td class="info-label">Masa Berlaku s/d</td>
      <td class="info-sep">:</td>
      <td class="info-val">${formatTanggalIndo(sertifikatData.berlaku_sampai)}</td>
      <td class="info-label">Penerapan Nilai Koreksi</td>
      <td class="info-sep">:</td>
      <td class="info-val">${sertifikatData.penerapan_nilai_koreksi || 'TB Tidak berlaku'}</td>
    </tr>
    <tr>
      <td class="info-label">Peninjauan Sebelumnya</td>
      <td class="info-sep">:</td>
      <td class="info-val" colspan="4">${officialNotes.peninjauan_hasil_sebelumnya || 'Alat belum digunakan sejak aktivitas verifikasi'}</td>
    </tr>
    ${officialNotes.catatan_pic ? `
    <tr>
      <td class="info-label">Catatan Pemeriksaan PIC</td>
      <td class="info-sep">:</td>
      <td class="info-val" colspan="4">${officialNotes.catatan_pic}</td>
    </tr>` : ''}
  </table>

  <!-- SECTION D: KEPUTUSAN KELAYAKAN -->
  <div class="section-title">D. Keputusan Kelayakan & Tindak Lanjut</div>
  <div class="status-box">
    <div>
      <span class="status-text">KEPUTUSAN: LAYAK DIGUNAKAN (DISETUJUI)</span>
      <div style="font-size: 8.5pt; color: #166534; margin-top: 2px;">
        Peralatan memenuhi seluruh kriteria keberterimaan dan diizinkan masuk layanan laboratorium aktif.
      </div>
    </div>
    <div style="font-size: 9pt; font-weight: 600; color: #166534; text-align: right;">
      Rencana Tindak Lanjut:<br>
      <span style="font-weight: normal; color: #1f2937;">${data.tindak_lanjut || 'Masuk layanan - label diperbarui'}</span>
    </div>
  </div>

  <!-- SECTION E: PENGESAHAN DAN TANDA TANGAN ELEKTRONIK -->
  <table class="sign-table">
    <thead>
      <tr>
        <th>Diverifikasi Oleh (PIC Peralatan)</th>
        <th>Disetujui Oleh (Manager Laboratorium)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          ${data.pic_signature ? `<img class="sig-img" src="${data.pic_signature}" alt="Tanda tangan PIC" />` : '<div style="height: 60px; line-height: 60px; color: #9ca3af; font-size: 9pt;">[Ditandatangani secara digital]</div>'}
          <div class="sig-name">${picName}</div>
          <div class="sig-title">${picNip}</div>
          <div class="sig-title">Tgl: ${picSignedAtFormatted}</div>
        </td>
        <td>
          ${data.manager_signature ? `<img class="sig-img" src="${data.manager_signature}" alt="Tanda tangan Manager" />` : '<div style="height: 60px; line-height: 60px; color: #9ca3af; font-size: 9pt;">[Disetujui secara digital]</div>'}
          <div class="sig-name">${managerName}</div>
          <div class="sig-title">${managerNip}</div>
          <div class="sig-title">Tgl: ${managerSignedAtFormatted}</div>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="footer-note">
    <span>Dokumen resmi sistem SiKEPo — Telkom Test House. Diterbitkan secara elektronik dan sah tanpa cap basah.</span>
    <span>ID Verifikasi: #${data.id_verifikasi || data.id || '-'} • Dicetak: ${new Date().toLocaleString('id-ID')}</span>
  </div>
</body>
</html>`;

  // Buka jendela cetak terisolasi untuk PDF
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    alert('Jendela cetak diblokir oleh browser. Harap izinkan popup untuk mengunduh / mengekspor dokumen PDF.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  // Waktu jeda agar gambar tanda tangan ter-render sepenuhnya sebelum print dialog muncul
  setTimeout(() => {
    printWindow.print();
  }, 400);
}
