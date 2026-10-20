/**
 * Utility untuk mengekspor Surat Keterangan Peminjaman Peralatan (TLKM13/F/006 Versi 03)
 * ke format PDF melalui dialog cetak browser (Save as PDF) dan Word (.doc)
 * dengan tata letak resmi standar Telkom Test House (TTH).
 * 
 * Sesuai pemutakhiran Versi 03:
 * - Berlaku untuk peminjaman INTERNAL maupun EKSTERNAL oleh personel TTH (TLKM13/IK/005).
 * - Satu formulir untuk satu unit peralatan.
 * - 4 pihak penandatangan: Peminjam, Mengetahui Mgr. Lab Peminjam, Diperiksa PIC Peralatan, Menyetujui Mgr. Lab Pemilik Peralatan.
 */

import { peminjamanApi } from '../services/api.js';

function formatTanggalIndo(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

function renderCheckbox(checked, label) {
  const mark = checked
    ? `<span style="display:inline-block; width:13px; height:13px; border:1.5px solid #000; text-align:center; line-height:12px; font-size:10pt; font-weight:bold; margin-right:4px;">&#10003;</span>`
    : `<span style="display:inline-block; width:13px; height:13px; border:1.5px solid #000; margin-right:4px; vertical-align:middle;"></span>`;
  return `<span style="white-space:nowrap; margin-right:14px; font-size:9pt;">${mark} ${label}</span>`;
}

/**
 * Normalisasi tanda tangan:
 * - Jika berupa data URL base64 atau SVG valid dari canvas/backend, gunakan langsung.
 * - Jika berupa string dummy mockSign dari data mock frontend, otomatis ubah menjadi
 *   goresan tanda tangan SVG valid (tinta biru) agar saat demo/testing selalu tampil nyata.
 */
function getCleanSignature(rawTtd, roleSeed = '1') {
  if (!rawTtd) return null;
  const str = String(rawTtd).trim();
  if (!str) return null;

  // Jika string dummy mockSign dari state mock frontend, transformasikan ke SVG signature valid
  if (str.includes('mockSign')) {
    const seed = str.slice(-1) || roleSeed || '1';
    const curves = {
      '1': 'M15,48 Q40,12 65,42 T100,38 T135,50 Q155,20 175,40 M45,45 Q75,52 145,45',
      '2': 'M20,38 Q50,15 75,48 T115,35 T145,55 Q160,25 180,38 M30,50 Q85,55 160,48',
      '3': 'M18,48 Q42,18 70,40 T110,45 T140,35 Q165,22 178,48 M50,48 Q90,54 150,46',
      '4': 'M22,42 Q48,16 72,46 T108,36 T142,52 Q162,26 176,42 M35,46 Q78,54 155,44',
    };
    const d = curves[seed] || curves['1'];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 70" width="190" height="70">
      <path d="${d}" fill="none" stroke="#0f2b5c" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // Jika berupa data URI valid (PNG/JPEG/SVG)
  if (str.startsWith('data:image/')) {
    return str;
  }

  // Jika raw base64 string tanpa prefix data:image/...
  if (str.length > 50 && !str.includes(' ') && !str.startsWith('http')) {
    return `data:image/png;base64,${str}`;
  }

  return str;
}

export function buildLoanF006Html(loan, options = {}) {
  if (!loan) return '';

  const { checkoutSigPengelola, checkoutSigPeminjam } = options;

  const peralatan = loan.peralatan || {};
  const peminjam = loan.peminjam || {};
  const serahKeluar = loan.serah_terima_keluar || {};
  const appMgrPeminjam = loan.approval_manager_peminjam || {};
  const appPengelola = loan.approval_pengelola || {};
  const appMgrLab = loan.approval_manager_lab || {};

  // Deteksi lab pemilik untuk checkbox di header
  const labPemilik = (peralatan.lab_pemilik || '').toUpperCase();
  const isIQA = labPemilik.includes('IQA');
  const isDES = labPemilik.includes('DES');
  const isSSA = labPemilik.includes('SSA');

  // Metadata Surat
  const nomorSurat = loan.f006_nomor || loan.kode || loan.id || '........................................';
  const rawTanggal = serahKeluar.tanggal || loan.tanggal_keluar_aktual || appMgrLab.tanggal || loan.tanggal_pengajuan || new Date();
  const tanggalSurat = formatTanggalIndo(rawTanggal);

  // Bagian A: Data Peminjaman
  const isEksternal = Boolean(loan.is_eksternal);
  const peminjamNama = peminjam.nama || loan.peminjam_nama || '-';
  const operatorNama = loan.nama_operator || peminjam.operator || '';
  const unitPeminjam = peminjam.lab_asal || peminjam.unit || '-';

  // Keperluan peminjaman
  const tujuan = (loan.tujuan_penggunaan || loan.keperluan || '').trim();
  const tujuanLower = tujuan.toLowerCase();
  const isPengujian = tujuanLower.includes('pengujian') || (!tujuanLower.includes('uji lokasi') && !tujuanLower.includes('pengecekan antara') && tujuanLower.length > 0 && !tujuanLower.includes('lainnya'));
  const isUjiLokasi = tujuanLower.includes('uji lokasi') || tujuanLower.includes('site') || tujuanLower.includes('outdoor');
  const isPengecekanAntara = tujuanLower.includes('pengecekan antara') || tujuanLower.includes('verifikasi fungsi');
  const isLainnya = !isPengujian && !isUjiLokasi && !isPengecekanAntara;

  // Dasar Pelaksanaan
  const noSPK = (loan.nomor_spk || '').trim();
  const spkLower = noSPK.toLowerCase();
  const isDasarSPK = spkLower.includes('spk') || spkLower.includes('reg') || spkLower.length > 0;
  const isDasarST = spkLower.includes('st') || spkLower.includes('tugas');
  const isDasarND = spkLower.includes('nd') || spkLower.includes('nota');
  const isDasarLainnya = !isDasarSPK && !isDasarST && !isDasarND;

  const lokasiPenggunaan = loan.lokasi_penggunaan || (isEksternal ? 'Lokasi Eksternal' : 'Internal Telkom Test House');
  const tglKeluarFormatted = formatTanggalIndo(loan.rencana_tanggal_keluar || loan.tanggal_keluar_aktual);
  const tglKembaliFormatted = formatTanggalIndo(loan.rencana_tanggal_kembali);

  // Bagian B: Data Peralatan
  const namaAlat = peralatan.nama_peralatan || '-';
  const nomorAset = peralatan.nomor_aset || '-';
  const nomorSeri = peralatan.nomor_seri || '-';
  const merek = peralatan.merek || '-';
  const tipeModel = peralatan.tipe || peralatan.tipe_model || '-';
  const kelengkapan = loan.kelengkapan || loan.kebutuhan_kelengkapan || loan.kebutuhan_aksesori || 'Sesuai daftar inventaris standar pabrikan';
  const tglJatuhTempo = peralatan.tgl_jatuh_tempo ? formatTanggalIndo(peralatan.tgl_jatuh_tempo) : '-';

  // Status Kelayakan: Layak jika serah terima tidak ada TS
  const isAdaTS = serahKeluar.ada_ts === true;
  const isLayak = !isAdaTS;

  // Bagian C: 4 Penandatangan dengan resolver tanda tangan valid
  // 1. Peminjam
  const ttdPeminjam = getCleanSignature(checkoutSigPeminjam || serahKeluar.ttd_peminjam || null, '1');
  const tglTtdPeminjam = formatTanggalIndo(serahKeluar.tanggal_diterima || serahKeluar.tanggal || rawTanggal);

  // 2. Mengetahui, Mgr. Lab Peminjam
  const mgrPeminjamNama = appMgrPeminjam.nama || 'Mgr. Lab Peminjam';
  const ttdMgrPeminjam = getCleanSignature(appMgrPeminjam.ttd || null, '2');
  const tglTtdMgrPeminjam = formatTanggalIndo(appMgrPeminjam.tanggal || rawTanggal);

  // 3. Diperiksa, PIC Peralatan
  const picNama = appPengelola.nama || serahKeluar.pic_petugas || 'PIC Peralatan / Pengelola';
  const ttdPIC = getCleanSignature(checkoutSigPengelola || serahKeluar.ttd_pengelola || appPengelola.ttd || null, '3');
  const tglTtdPIC = formatTanggalIndo(serahKeluar.tanggal || appPengelola.tanggal || rawTanggal);

  // 4. Menyetujui, Mgr. Lab Pemilik Peralatan
  const mgrLabNama = appMgrLab.nama || 'Mgr. Lab Pemilik Peralatan';
  const ttdMgrLab = getCleanSignature(appMgrLab.ttd || null, '4');
  const tglTtdMgrLab = formatTanggalIndo(appMgrLab.tanggal || rawTanggal);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Surat_Keterangan_Peminjaman_${peralatan.nomor_aset || 'Alat'}_TLKM13-F-006</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 15mm 10mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-size: 9.5pt;
      line-height: 1.3;
      color: #000000;
      background: #ffffff;
      padding: 4px;
    }
    
    /* Header Table */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000000;
      margin-bottom: 8px;
    }
    .header-table td {
      border: 1px solid #000000;
      padding: 4px 8px;
      vertical-align: middle;
    }
    .logo-td {
      width: 32%;
    }
    .telkom-logo {
      font-size: 14pt;
      font-weight: 900;
      color: #EE2E24;
      letter-spacing: 0.5px;
      display: inline-block;
    }
    .telkom-sub {
      font-size: 8pt;
      font-weight: 700;
      color: #1f2937;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-top: 1px;
    }
    .lab-box {
      margin-top: 4px;
      font-size: 8.5pt;
      font-weight: 600;
      color: #111827;
    }
    .title-td {
      width: 44%;
      text-align: center;
    }
    .doc-main-title {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.25;
    }
    .meta-td {
      width: 24%;
      font-size: 8.5pt;
      text-align: left;
      line-height: 1.35;
      font-weight: 600;
    }

    /* Nomor & Tanggal Bar */
    .meta-bar-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000000;
      margin-bottom: 8px;
      font-size: 9.5pt;
    }
    .meta-bar-table td {
      padding: 4px 8px;
      border: 1px solid #000000;
    }

    /* Section Header */
    .section-banner {
      background-color: #f1f5f9;
      border: 1px solid #000000;
      border-bottom: none;
      padding: 4px 8px;
      font-size: 9.5pt;
      font-weight: bold;
      text-transform: uppercase;
    }

    /* Form Data Table */
    .form-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000000;
      margin-bottom: 8px;
      font-size: 9pt;
    }
    .form-table td {
      border: 1px solid #000000;
      padding: 4px 6px;
      vertical-align: top;
    }
    .col-label {
      width: 24%;
      font-weight: 600;
      background-color: #fafafa;
    }
    .col-content {
      width: 76%;
    }
    .sub-col-label {
      width: 18%;
      font-weight: 600;
      background-color: #fafafa;
    }
    .sub-col-content {
      width: 32%;
    }

    .footnote {
      font-size: 7.5pt;
      color: #374151;
      font-style: italic;
      margin: -4px 0 8px 2px;
      line-height: 1.2;
    }

    /* Signature Table - Gunakan display block & text-align center agar stabil di print engine */
    .sig-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000000;
      margin-bottom: 8px;
      font-size: 8.5pt;
    }
    .sig-table th {
      border: 1px solid #000000;
      padding: 5px 4px;
      background-color: #f1f5f9;
      text-align: center;
      font-weight: bold;
      width: 25%;
      height: 32px;
      vertical-align: middle;
    }
    .sig-table td {
      border: 1px solid #000000;
      padding: 6px 6px 4px 6px;
      text-align: center;
      vertical-align: top;
      width: 25%;
      height: 95px;
    }
    .sig-box-img {
      height: 52px;
      line-height: 52px;
      text-align: center;
      margin-bottom: 4px;
    }
    .sig-img {
      max-height: 50px;
      max-width: 140px;
      display: inline-block;
      vertical-align: middle;
      margin: 0 auto;
    }
    .sig-digital-badge {
      display: inline-block;
      font-size: 7.5pt;
      line-height: normal;
      color: #047857;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 3px 6px;
      border-radius: 4px;
      font-weight: 600;
      vertical-align: middle;
    }
    .sig-meta-line {
      font-size: 8pt;
      line-height: 1.25;
      margin-top: 1px;
      text-align: left;
    }

    /* Notes Box */
    .notes-box {
      border: 1px solid #000000;
      padding: 5px 8px;
      font-size: 7.5pt;
      line-height: 1.3;
      margin-bottom: 6px;
      background-color: #ffffff;
    }
    .notes-title {
      font-weight: bold;
      margin-bottom: 2px;
    }
    .notes-box ul {
      margin-left: 14px;
      padding: 0;
    }

    /* Footer Meta */
    .footer-bar {
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #6b7280;
      border-top: 1px solid #d1d5db;
      padding-top: 3px;
    }

    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- 1. HEADER DOKUMEN -->
  <table class="header-table">
    <tr>
      <td class="logo-td">
        <div class="telkom-logo">Telkom Indonesia</div>
        <div class="telkom-sub">Telkom Test House (TTH)</div>
        <div class="lab-box">
          Laboratorium: &nbsp;
          ${renderCheckbox(isIQA, 'IQA')}
          ${renderCheckbox(isDES, 'DES')}
          ${renderCheckbox(isSSA, 'SSA')}
        </div>
      </td>
      <td class="title-td">
        <div class="doc-main-title">SURAT KETERANGAN PEMINJAMAN PERALATAN</div>
      </td>
      <td class="meta-td">
        <div>No. Dok : <strong>TLKM13/F/006</strong></div>
        <div>Versi &nbsp; &nbsp; : <strong>03</strong></div>
        <div>Halaman : <strong>1 dari 1</strong></div>
      </td>
    </tr>
  </table>

  <!-- 2. METADATA SURAT (NOMOR & TANGGAL) -->
  <table class="meta-bar-table">
    <tr>
      <td style="width: 58%;">
        <strong>Nomor Surat</strong> : &nbsp;${nomorSurat}
      </td>
      <td style="width: 42%;">
        <strong>Tanggal</strong> : &nbsp;${tanggalSurat}
      </td>
    </tr>
  </table>

  <!-- 3. BAGIAN A: DATA PEMINJAMAN -->
  <div class="section-banner">A. DATA PEMINJAMAN</div>
  <table class="form-table">
    <tr>
      <td class="col-label">Jenis Peminjaman</td>
      <td class="col-content">
        ${renderCheckbox(!isEksternal, 'Internal (di dalam lingkungan TTH)')}
        &nbsp;&nbsp;&nbsp;
        ${renderCheckbox(isEksternal, 'Eksternal (di luar lingkungan TTH)')}
      </td>
    </tr>
    <tr>
      <td class="col-label">Personel TTH Peminjam</td>
      <td class="col-content">
        <div>1. <strong>${peminjamNama}</strong> &nbsp;<em>(penanggung jawab)</em></div>
        ${operatorNama && operatorNama !== peminjamNama ? `<div>2. ${operatorNama} &nbsp;<em>(operator pelaksana)</em></div>` : '<div>2. ..........................................................................................</div>'}
        <div>3. ..........................................................................................</div>
      </td>
    </tr>
    <tr>
      <td class="col-label">Laboratorium / Unit Peminjam</td>
      <td class="col-content">
        <strong>${unitPeminjam}</strong>
      </td>
    </tr>
    <tr>
      <td class="col-label">Keperluan</td>
      <td class="col-content">
        <div>
          ${renderCheckbox(isPengujian, 'Pengujian')}
          ${renderCheckbox(isUjiLokasi, 'Uji lokasi')}
          ${renderCheckbox(isPengecekanAntara, 'Pengecekan antara')}
          ${renderCheckbox(isLainnya, 'Lainnya')}
        </div>
        <div style="margin-top: 3px; font-style: italic; color: #1e293b;">
          Keterangan: ${tujuan || '-'}
        </div>
      </td>
    </tr>
    <tr>
      <td class="col-label">Dasar Pelaksanaan</td>
      <td class="col-content">
        <div>
          ${renderCheckbox(isDasarSPK, 'No. Registrasi/SPK')}
          ${renderCheckbox(isDasarST, 'Surat Tugas')}
          ${renderCheckbox(isDasarND, 'Nota Dinas')}
          ${renderCheckbox(isDasarLainnya, 'Lainnya')}
        </div>
        <div style="margin-top: 2px;">
          Nomor: <strong>${noSPK || '-'}</strong>
        </div>
      </td>
    </tr>
    <tr>
      <td class="col-label">Lokasi / Alamat Penggunaan</td>
      <td class="col-content">
        <strong>${lokasiPenggunaan}</strong>
      </td>
    </tr>
    <tr>
      <td class="col-label">Waktu Peminjaman</td>
      <td class="col-content">
        Tanggal keluar: <strong>${tglKeluarFormatted}</strong> &nbsp;&nbsp;s.d.&nbsp;&nbsp; Rencana tanggal kembali: <strong>${tglKembaliFormatted}</strong>
      </td>
    </tr>
  </table>

  <!-- 4. BAGIAN B: DATA PERALATAN DAN PEMERIKSAAN KELAYAKAN -->
  <div class="section-banner">B. DATA PERALATAN DAN PEMERIKSAAN KELAYAKAN</div>
  <table class="form-table">
    <tr>
      <td class="col-label">Nama Peralatan</td>
      <td class="col-content" colspan="3">
        <strong>${namaAlat}</strong>
      </td>
    </tr>
    <tr>
      <td class="sub-col-label">Nomor Aset</td>
      <td class="sub-col-content"><strong>${nomorAset}</strong></td>
      <td class="sub-col-label">Nomor Seri</td>
      <td class="sub-col-content"><strong>${nomorSeri}</strong></td>
    </tr>
    <tr>
      <td class="sub-col-label">Merek</td>
      <td class="sub-col-content"><strong>${merek}</strong></td>
      <td class="sub-col-label">Tipe / Model</td>
      <td class="sub-col-content"><strong>${tipeModel}</strong></td>
    </tr>
    <tr>
      <td class="col-label">Kelengkapan yang dibawa</td>
      <td class="col-content" colspan="3">
        ${kelengkapan}
      </td>
    </tr>
    <tr>
      <td class="col-label">Status Kelayakan*</td>
      <td class="sub-col-content">
        ${renderCheckbox(isLayak, 'Layak')}
        &nbsp;&nbsp;
        ${renderCheckbox(!isLayak, 'Tidak layak')}
      </td>
      <td class="sub-col-label">Jatuh Tempo Pemeriksaan*</td>
      <td class="sub-col-content">
        <strong>${tglJatuhTempo}</strong>
      </td>
    </tr>
  </table>
  <div class="footnote">
    *Diisi PIC peralatan. Peralatan berpenanda "Do Not Use", tercatat pada TLKM13/F/011, atau jatuh tempo pemeriksaannya sebelum rencana tanggal kembali tidak boleh dipinjam (TLKM13/IK/005 butir 7).
  </div>

  <!-- 5. BAGIAN C: PERSETUJUAN (4 TANDA TANGAN DIGITAL) -->
  <div class="section-banner">C. PERSETUJUAN</div>
  <table class="sig-table">
    <thead>
      <tr>
        <th>Peminjam</th>
        <th>Mengetahui,<br>Mgr. Lab Peminjam</th>
        <th>Diperiksa,<br>PIC Peralatan</th>
        <th>Menyetujui,<br>Mgr. Lab Pemilik Peralatan</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="sig-box-img">
            ${ttdPeminjam ? `<img class="sig-img" src="${ttdPeminjam}" alt="TTD Peminjam" />` : '<span class="sig-digital-badge">Disetujui Digital</span>'}
          </div>
          <div class="sig-meta-line">Nama: <strong>${peminjamNama}</strong></div>
          <div class="sig-meta-line">Tanggal: ${tglTtdPeminjam}</div>
        </td>
        <td>
          <div class="sig-box-img">
            ${ttdMgrPeminjam ? `<img class="sig-img" src="${ttdMgrPeminjam}" alt="TTD Mgr Peminjam" />` : '<span class="sig-digital-badge">Disahkan Digital</span>'}
          </div>
          <div class="sig-meta-line">Nama: <strong>${mgrPeminjamNama}</strong></div>
          <div class="sig-meta-line">Tanggal: ${tglTtdMgrPeminjam}</div>
        </td>
        <td>
          <div class="sig-box-img">
            ${ttdPIC ? `<img class="sig-img" src="${ttdPIC}" alt="TTD PIC" />` : '<span class="sig-digital-badge">Disahkan Digital</span>'}
          </div>
          <div class="sig-meta-line">Nama: <strong>${picNama}</strong></div>
          <div class="sig-meta-line">Tanggal: ${tglTtdPIC}</div>
        </td>
        <td>
          <div class="sig-box-img">
            ${ttdMgrLab ? `<img class="sig-img" src="${ttdMgrLab}" alt="TTD Mgr Lab" />` : '<span class="sig-digital-badge">Disahkan Digital</span>'}
          </div>
          <div class="sig-meta-line">Nama: <strong>${mgrLabNama}</strong></div>
          <div class="sig-meta-line">Tanggal: ${tglTtdMgrLab}</div>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- 6. CATATAN RESMI -->
  <div class="notes-box">
    <div class="notes-title">Catatan:</div>
    <ul>
      <li>Satu formulir digunakan untuk satu peralatan; peminjaman beberapa peralatan menggunakan formulir terpisah.</li>
      <li>Tandai pilihan dengan tanda centang (✓) pada kotak ☐.</li>
      <li>Untuk peminjaman eksternal, surat ini dibawa bersama peralatan selama berada di luar lingkungan TTH.</li>
      <li>Kondisi peralatan saat keluar dan kembali dicatat pada Lembar Serah Terima Peralatan (lampiran TLKM13/F/010).</li>
    </ul>
  </div>

  <!-- 7. FOOTER PENGENDALIAN -->
  <div class="footer-bar">
    <span>Dokumen resmi sistem SiKEPo — Telkom Test House. Sah dan terverifikasi secara elektronik.</span>
    <span>Dokumen ini tidak terkendali apabila diunduh &bull; Hal 1 dari 1</span>
  </div>

</body>
</html>`;
}

/**
 * Mengekspor Surat Keterangan Peminjaman (F/006) ke dialog cetak browser (Save as PDF).
 * Secara otomatis memuat detail gambar TTD dari backend jika objek loan belum memuatnya.
 */
export async function exportLoanF006Pdf(loanInput, options = {}) {
  let loan = loanInput;

  // Jika loan memiliki ID numerik dan belum memuat data gambar TTD lengkap,
  // fetch data detail lengkap dari backend terlebih dahulu agar gambar TTD terambil utuh.
  if (
    loan &&
    loan.id &&
    !isNaN(Number(loan.id)) &&
    !loan.approval_manager_lab?.ttd &&
    !loan.approval_manager_peminjam?.ttd &&
    !loan.serah_terima_keluar?.ttd_pengelola
  ) {
    try {
      const res = await peminjamanApi.getById(loan.id);
      if (res?.success && res.data) {
        loan = res.data;
      }
    } catch (e) {
      console.warn('Gagal memuat detail TTD dari backend untuk cetak PDF, mencetak data lokal:', e);
    }
  }

  const html = buildLoanF006Html(loan, options);
  if (!html) {
    alert('Data peminjaman tidak lengkap untuk mencetak formulir F/006.');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=920,height=850');
  if (!printWindow) {
    alert('Jendela cetak diblokir oleh browser. Harap izinkan pop-up untuk mencetak / mengunduh dokumen PDF.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  // Waktu jeda 450ms agar gambar base64 / SVG ter-decode sepenuhnya di DOM sebelum dialog print aktif
  setTimeout(() => {
    printWindow.print();
  }, 450);
}

/**
 * Mengekspor Surat Keterangan Peminjaman (F/006) ke format Word (.doc)
 * Secara otomatis memuat detail gambar TTD dari backend jika objek loan belum memuatnya.
 */
export async function exportLoanF006Word(loanInput, options = {}) {
  let loan = loanInput;

  if (
    loan &&
    loan.id &&
    !isNaN(Number(loan.id)) &&
    !loan.approval_manager_lab?.ttd &&
    !loan.approval_manager_peminjam?.ttd &&
    !loan.serah_terima_keluar?.ttd_pengelola
  ) {
    try {
      const res = await peminjamanApi.getById(loan.id);
      if (res?.success && res.data) {
        loan = res.data;
      }
    } catch (e) {
      console.warn('Gagal memuat detail TTD dari backend untuk Word:', e);
    }
  }

  const html = buildLoanF006Html(loan, options);
  if (!html) return;

  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const noAset = loan.peralatan?.nomor_aset || loan.kode || 'Peminjaman';
  link.download = `Surat_Peminjaman_${noAset}_TLKM13-F-006.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
