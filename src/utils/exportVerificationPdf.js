// ------------------------------------------------------------------
// Utilitas Export PDF Formulir Verifikasi Peralatan (TLKM13/F/003)
// Sesuai klausul ISO/IEC 17025 & SRS SiKEPo TLKM13-01 Versi 1.1
// ------------------------------------------------------------------

import { computeEligibility } from './api.js';

export function exportVerificationPdf(verification, equipment = null) {
  if (!verification) return;

  const item = verification;
  const eq = equipment || verification.peralatan || {};

  // Parse catatan terstruktur
  let notes = {};
  try {
    const parsed = JSON.parse(item.catatan || '{}');
    if (parsed && typeof parsed === 'object') notes = parsed;
  } catch {
    notes = {};
  }

  const cert = notes.sertifikat || {};
  const alasanTb = notes.alasan_tb || {};
  const alasanTs = notes.alasan_ts || {};

  // Kelayakan per SRS 7.2
  const elig = computeEligibility({ ...eq, status_verifikasi: item.status });

  // 8 Aspek Klausul 9.1
  const CHECKS = [
    { key: 'identitas', code: 'a', label: 'Identitas Peralatan', desc: 'Kesesuaian nama, merek, tipe/model, nomor seri, dan nomor aset.' },
    { key: 'kelengkapan', code: 'b', label: 'Kelengkapan Aksesori & Manual', desc: 'Aksesori pendukung, probe, kabel, dan buku panduan operasional.' },
    { key: 'firmware', code: 'c', label: 'Versi Software / Firmware', desc: 'Pengecekan versi peranti lunak/firmware yang terpasang.' },
    { key: 'kondisi_fisik', code: 'd', label: 'Kondisi Fisik / Visual', desc: 'Pemeriksaan kebersihan, bebas korosi, keretakan, atau cacat mekanis.' },
    { key: 'segel', code: 'e', label: 'Keutuhan Segel Kalibrasi', desc: 'Keutuhan segel proteksi kalibrasi dan penyetelan pabrikan.' },
    { key: 'fungsi_awal', code: 'f', label: 'Fungsi Kerja / Operasional', desc: 'Uji fungsi daya, indikator, display, dan pengoperasian dasar.' },
    { key: 'metrologi', code: 'g', label: 'Karakteristik Metrologi', desc: 'Akurasi, resolusi, kestabilan nol (zero drift), dan linearitas.' },
    { key: 'sertifikat', code: 'h', label: 'Bukti Kelayakan / Sertifikat', desc: 'Ketersediaan dan keabsahan sertifikat kalibrasi yang berlaku.' },
  ];

  const aspectResults = item.hasil_verifikasi?.[0] || item.hasil_verifikasi || {};

  // Formatter tanggal
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const printDate = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const docHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Verifikasi_TLKM13_F_003_${eq.nomor_aset || item.id_verifikasi || 'aset'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
    }
    * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.4;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #0f172a;
      margin-bottom: 12px;
    }
    .header-table td {
      border: 1px solid #0f172a;
      padding: 6px 10px;
      vertical-align: middle;
    }
    .tth-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
      color: #b91c1c;
    }
    .tth-sub {
      font-size: 9.5px;
      color: #334155;
      margin: 2px 0 0;
      font-weight: 500;
    }
    .doc-meta {
      font-size: 9px;
      line-height: 1.35;
    }
    .section-title {
      background: #f1f5f9;
      border-left: 3.5px solid #b91c1c;
      padding: 4px 8px;
      font-weight: 700;
      font-size: 11px;
      margin: 10px 0 6px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .grid-info {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .grid-info td {
      padding: 3px 6px;
      font-size: 10.5px;
      vertical-align: top;
      border-bottom: 1px dotted #e2e8f0;
    }
    .grid-info .label {
      width: 22%;
      color: #475569;
      font-weight: 600;
    }
    .grid-info .val {
      width: 28%;
      color: #0f172a;
      font-weight: 600;
    }
    .table-aspects {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      margin-bottom: 10px;
    }
    .table-aspects th, .table-aspects td {
      border: 1px solid #cbd5e1;
      padding: 5px 7px;
      font-size: 10px;
      vertical-align: middle;
    }
    .table-aspects th {
      background: #f8fafc;
      font-weight: 700;
      text-align: left;
      color: #1e293b;
    }
    .badge-result {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 700;
      font-size: 9.5px;
      text-align: center;
    }
    .result-S { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .result-TS { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .result-TB { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .sig-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      border: 1px solid #cbd5e1;
    }
    .sig-table td {
      width: 50%;
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: center;
      vertical-align: top;
    }
    .sig-title {
      font-size: 10.5px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 4px;
    }
    .sig-img {
      max-height: 55px;
      max-width: 180px;
      display: block;
      margin: 6px auto;
      object-fit: contain;
    }
    .sig-empty {
      height: 55px;
      line-height: 55px;
      color: #94a3b8;
      font-style: italic;
      font-size: 10px;
    }
    .sig-name {
      font-weight: 700;
      font-size: 11px;
      text-decoration: underline;
      margin-top: 4px;
    }
    .sig-nip {
      font-size: 9.5px;
      color: #64748b;
    }
    .conclusion-box {
      border: 1.5px solid #10b981;
      background: #f0fdf4;
      padding: 8px 12px;
      border-radius: 4px;
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .conclusion-box.limited {
      border-color: #f59e0b;
      background: #fffbeb;
    }
    .conclusion-box.not-eligible {
      border-color: #ef4444;
      background: #fef2f2;
    }
    .footer-note {
      margin-top: 14px;
      font-size: 8.5px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
    }
  </style>
</head>
<body>

  <!-- HEADER DOKUMEN MUTU -->
  <table class="header-table">
    <tr>
      <td style="width: 25%; text-align: center;">
        <div style="font-weight: 900; font-size: 16px; color: #b91c1c; letter-spacing: 1px;">TELKOM</div>
        <div style="font-weight: 700; font-size: 10px; color: #1e293b;">TEST HOUSE</div>
      </td>
      <td style="width: 50%; text-align: center;">
        <h1 class="tth-title">FORMULIR VERIFIKASI PERALATAN</h1>
        <div class="tth-sub">Laboratorium Pengujian Perangkat Telekomunikasi — ISO/IEC 17025</div>
      </td>
      <td style="width: 25%;">
        <div class="doc-meta">
          <div><strong>No. Dok:</strong> TLKM13/F/003</div>
          <div><strong>Edisi / Rev:</strong> 01 / 05</div>
          <div><strong>Tgl Terbit:</strong> 2024</div>
          <div><strong>Status:</strong> ${item.status || 'Disetujui'}</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- BAGIAN 1: IDENTITAS PERALATAN -->
  <div class="section-title">I. Identitas Peralatan</div>
  <table class="grid-info">
    <tr>
      <td class="label">Nama Peralatan</td>
      <td class="val">${eq.nama_peralatan || item.peralatan?.nama_peralatan || '-'}</td>
      <td class="label">Nomor Aset / Inv</td>
      <td class="val"><code style="font-size: 10.5px; color: #b91c1c;">${eq.nomor_aset || item.peralatan?.nomor_aset || '-'}</code></td>
    </tr>
    <tr>
      <td class="label">Merek / Tipe Model</td>
      <td class="val">${eq.merek || '-'}${eq.tipe_model ? ` / ${eq.tipe_model}` : ''}</td>
      <td class="label">Nomor Seri (S/N)</td>
      <td class="val">${eq.nomor_seri || '-'}</td>
    </tr>
    <tr>
      <td class="label">Laboratorium / Ruangan</td>
      <td class="val">${eq.laboratorium?.nama_lab || eq.ruangan?.nama_ruangan || '-'}</td>
      <td class="label">PIC Penanggung Jawab</td>
      <td class="val">${eq.pic?.name || item.pic?.name || '-'}</td>
    </tr>
  </table>

  <!-- BAGIAN 2: INFORMASI VERIFIKASI & KALIBRASI -->
  <div class="section-title">II. Informasi & Pemicu Verifikasi (Klausul 10)</div>
  <table class="grid-info">
    <tr>
      <td class="label">Kode Aktivitas</td>
      <td class="val">${item.kode_aktivitas || 'P1'} — ${item.kode_aktivitas === 'P1' ? 'Peralatan baru' : item.kode_aktivitas === 'P2' ? 'Setelah kalibrasi' : 'Pemeriksaan rutin'}</td>
      <td class="label">Tanggal Verifikasi</td>
      <td class="val">${formatDate(item.tanggal_verifikasi)}</td>
    </tr>
    <tr>
      <td class="label">Nomor Sertifikat</td>
      <td class="val">${cert.nomor || '-'}</td>
      <td class="label">Lembaga Kalibrasi</td>
      <td class="val">${cert.penyedia || '-'}</td>
    </tr>
    <tr>
      <td class="label">Masa Berlaku Sertifikat</td>
      <td class="val">${formatDate(cert.berlaku_sampai)}</td>
      <td class="label">Penerapan Nilai Koreksi</td>
      <td class="val">${cert.penerapan_nilai_koreksi || 'TB Tidak berlaku'}</td>
    </tr>
    <tr>
      <td class="label">Acuan Kriteria Evaluasi</td>
      <td class="val" colspan="3">${notes.acuan_kriteria || 'Spesifikasi teknis pabrikan & manual instruksi kerja TTH'}</td>
    </tr>
  </table>

  <!-- BAGIAN 3: HASIL PEMERIKSAAN 8 ASPEK -->
  <div class="section-title">III. Hasil Pemeriksaan 8 Aspek Kelayakan (SRS Klausul 9.1)</div>
  <table class="table-aspects">
    <thead>
      <tr>
        <th style="width: 4%; text-align: center;">No</th>
        <th style="width: 32%;">Aspek Yang Diverifikasi</th>
        <th style="width: 36%;">Kriteria / Ruang Lingkup Pengecekan</th>
        <th style="width: 12%; text-align: center;">Hasil</th>
        <th style="width: 16%;">Alasan / Catatan</th>
      </tr>
    </thead>
    <tbody>
      ${CHECKS.map((c, idx) => {
        const val = aspectResults[c.key] || '-';
        const alasan = val === 'TB' ? (alasanTb[c.key] || '-') : val === 'TS' ? (alasanTs[c.key] || '-') : '-';
        return `
          <tr>
            <td style="text-align: center; font-weight: bold;">${c.code}</td>
            <td style="font-weight: 600;">${c.label}</td>
            <td style="color: #475569; font-size: 9px;">${c.desc}</td>
            <td style="text-align: center;">
              <span class="badge-result result-${val}">${val === 'S' ? 'Sesuai (S)' : val === 'TS' ? 'TS (Tidak Sesuai)' : val === 'TB' ? 'TB (Tidak Berlaku)' : val}</span>
            </td>
            <td style="font-size: 9px; color: #334155;">${alasan}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <!-- BAGIAN 4: KEPUTUSAN KELAYAKAN -->
  <div class="section-title">IV. Keputusan Kelayakan Operasional (SRS Klausul 7.2 & 9.2)</div>
  <div class="conclusion-box ${elig.jenisLabel === 'LIMITED CALIBRATION' ? 'limited' : elig.jenisLabel === 'DO NOT USE' ? 'not-eligible' : ''}">
    <div>
      <div style="font-size: 11px; font-weight: 700; color: #0f172a;">
        Status Kelayakan: <span style="text-transform: uppercase; color: ${elig.labelColor || '#15803d'}; font-size: 12px;">${elig.statusKelayakan || 'Layak'}</span>
      </div>
      <div style="font-size: 9.5px; color: #475569; margin-top: 2px;">
        Tindak Lanjut: <strong>${item.tindak_lanjut || 'Masuk layanan - label diperbarui'}</strong>
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 9px; font-weight: 700; color: #64748b;">JENIS LABEL RESMI TTH:</div>
      <div style="font-size: 13px; font-weight: 900; letter-spacing: 0.5px; color: ${elig.labelColor || '#15803d'};">
        ${elig.jenisLabel || 'CALIBRATION'}
      </div>
    </div>
  </div>

  ${notes.catatan_pic ? `
    <div style="margin-top: 6px; font-size: 9.5px; padding: 4px 8px; background: #f8fafc; border: 1px dotted #cbd5e1; border-radius: 4px;">
      <strong>Catatan Khusus PIC:</strong> ${notes.catatan_pic}
    </div>
  ` : ''}

  <!-- BAGIAN 5: PENGESAHAN & TANDA TANGAN ELEKTRONIK -->
  <table class="sig-table">
    <tr>
      <td>
        <div class="sig-title">Diverifikasi & Diajukan Oleh (Staff PIC):</div>
        ${item.pic_signature ? `<img class="sig-img" src="${item.pic_signature}" alt="Tanda Tangan PIC" />` : '<div class="sig-empty">Tanda Tangan Digital Tersimpan</div>'}
        <div class="sig-name">${item.pic?.name || eq.pic?.name || 'Staff PIC Laboratorium'}</div>
        <div class="sig-nip">Tanggal Pengajuan: ${formatDate(item.tanggal_verifikasi)}</div>
      </td>
      <td>
        <div class="sig-title">Disetujui Oleh (Manager Laboratorium):</div>
        ${item.manager_signature ? `<img class="sig-img" src="${item.manager_signature}" alt="Tanda Tangan Manager" />` : '<div class="sig-empty">Disetujui Secara Elektronik</div>'}
        <div class="sig-name">${item.manager?.name || 'Manager Laboratorium TTH'}</div>
        <div class="sig-nip">Status: Telah Disetujui & Disahkan Sesuai ISO/IEC 17025</div>
      </td>
    </tr>
  </table>

  <!-- FOOTER -->
  <div class="footer-note">
    <span>Dokumen ini dicetak secara otomatis dari Sistem Informasi Kelaikan Peralatan (SiKEPo) Telkom Test House</span>
    <span>Waktu Cetak: ${printDate} • Hal 1 dari 1</span>
  </div>

</body>
</html>
  `;

  // Cetak ke PDF melalui window.open (kompatibel semua browser modern)
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Pop-up diblokir browser. Izinkan pop-up untuk halaman ini agar bisa export PDF.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(docHtml);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
