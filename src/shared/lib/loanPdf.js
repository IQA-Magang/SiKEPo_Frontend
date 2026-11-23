/**
 * Utility untuk mengekspor Surat Peminjaman Peralatan (TLKM13/F/00X Versi 01)
 * ke format PDF melalui dialog cetak browser (Save as PDF) dan Word (.doc).
 *
 * Isi mengikuti TLKM13/F/00X Versi 01:
 * - A. Data Peminjaman & Pengguna Peralatan, B. Data Peralatan,
 * - C. Persetujuan Peminjaman (Peminjam, Mgr. Lab Peminjam, Mgr. Lab Pemilik),
 * - D. Serah Terima dan Pemeriksaan Kondisi (kondisi keluar dan kembali).
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

// Escape teks dari data pengguna sebelum dimasukkan ke HTML cetak
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Butir pemeriksaan serah terima sesuai TLKM13/F/00X bagian D
const BUTIR_SERAH_TERIMA = [
  'Identitas peralatan dan label status',
  'Kelengkapan aksesori dan manual',
  'Kondisi fisik',
  'Keutuhan segel',
  'Fungsi awal (bila relevan)',
];

function renderKondisi(status) {
  const s = String(status || '').toUpperCase();
  return `${renderCheckbox(s === 'S', 'S')}${renderCheckbox(s === 'TS', 'TS')}`;
}

// Kotak tanda tangan: gambar bila ada, catatan bila tahap sudah tercatat tanpa tanda tangan
function renderSigBox(ttd, alt, sudahTercatat, catatan) {
  if (ttd) return `<img class="sig-img" src="${esc(ttd)}" alt="${esc(alt)}" />`;
  if (sudahTercatat) return `<span class="sig-digital-badge">${esc(catatan)}</span>`;
  return '';
}

export function buildLoanF006Html(loan, options = {}) {
  if (!loan) return '';

  const { checkoutSigPengelola, checkoutSigPeminjam } = options;

  const peralatan = loan.peralatan || {};
  const peminjam = loan.peminjam || {};
  const serahKeluar = loan.serah_terima_keluar || {};
  const serahKembali = loan.serah_terima_kembali || {};
  const appMgrPeminjam = loan.approval_manager_peminjam || {};
  const appPengelola = loan.approval_pengelola || {};
  const appMgrLab = loan.approval_manager_lab || {};

  // Laboratorium pemilik peralatan
  const labPemilik = (peralatan.lab_pemilik || '').toUpperCase();
  const isIQA = labPemilik.includes('IQA');
  const isDES = labPemilik.includes('DES');
  const isSSA = labPemilik.includes('SSA');

  const nomorSurat = loan.kode || loan.f006_nomor || loan.id || '........................................';

  // Bagian A: Data Peminjaman & Pengguna Peralatan
  const isEksternal = Boolean(loan.is_eksternal);
  const peminjamNama = peminjam.nama || loan.peminjam_nama || '-';
  const unitPeminjam = peminjam.lab_asal || peminjam.unit || '-';
  const kontakPeminjam = peminjam.kontak || peminjam.email || peminjam.telepon || '';
  const operatorNama = (loan.nama_operator || peminjam.operator || '').trim();

  const tujuan = (loan.tujuan_penggunaan || loan.keperluan || '').trim();
  const tujuanLower = tujuan.toLowerCase();
  const isUjiLokasi = tujuanLower.includes('uji lokasi') || tujuanLower.includes('site') || tujuanLower.includes('outdoor');
  const isPengecekanAntara = tujuanLower.includes('pengecekan antara') || tujuanLower.includes('verifikasi fungsi');
  const isPengujian = tujuanLower.length > 0 && !isUjiLokasi && !isPengecekanAntara && !tujuanLower.includes('lainnya');
  const isLainnya = !isPengujian && !isUjiLokasi && !isPengecekanAntara;

  const noSPK = (loan.nomor_spk || '').trim();
  const spkLower = noSPK.toLowerCase();
  const isDasarND = spkLower.includes('nd') || spkLower.includes('nota');
  const isDasarSPK = noSPK.length > 0 && !isDasarND;
  const isDasarLainnya = !isDasarSPK && !isDasarND;

  const lokasiPenggunaan = loan.lokasi_penggunaan || (isEksternal ? 'Lokasi Eksternal' : 'Internal Telkom Test House');
  const tglKeluar = formatTanggalIndo(loan.tanggal_keluar_aktual || loan.rencana_tanggal_keluar);
  const tglKembali = formatTanggalIndo(loan.rencana_tanggal_kembali);

  // Bagian B: Data Peralatan
  const namaAlat = peralatan.nama_peralatan || '-';
  const kelengkapan = loan.kebutuhan_kelengkapan || loan.kelengkapan || loan.kebutuhan_aksesori || '-';
  const tglJatuhTempo = peralatan.tgl_jatuh_tempo ? formatTanggalIndo(peralatan.tgl_jatuh_tempo) : '-';

  // Bagian C: Persetujuan Peminjaman (3 pihak)
  const labPeminjamLabel = unitPeminjam !== '-' ? unitPeminjam : 'Lab Peminjam';
  const labPemilikLabel = peralatan.lab_pemilik || 'Lab Pemilik';
  const ttdPeminjamAju = getCleanSignature(peminjam.ttd || null, '1');
  const ttdMgrPeminjam = getCleanSignature(appMgrPeminjam.ttd || null, '2');
  const ttdMgrLab = getCleanSignature(appMgrLab.ttd || null, '4');
  const mgrPeminjamSkip = appMgrPeminjam.status === 'skipped';

  // Bagian D: Serah Terima dan Pemeriksaan Kondisi
  const butirKeluar = Array.isArray(serahKeluar.lampiran_a) ? serahKeluar.lampiran_a : [];
  const butirKembali = Array.isArray(serahKembali.lampiran_a) ? serahKembali.lampiran_a : [];
  const sudahKembali = Boolean(serahKembali.tanggal);
  const rowsButir = BUTIR_SERAH_TERIMA.map((label, idx) => {
    const keluar = butirKeluar[idx] || {};
    const kembali = butirKembali[idx] || {};
    const ket = kembali.keterangan || keluar.keterangan || kembali.keterangan_keluar || '';
    return `<tr>
      <td style="text-align:center;">${idx + 1}.</td>
      <td>${esc(label)}</td>
      <td style="text-align:center;">${renderKondisi(keluar.status || kembali.status_keluar)}</td>
      <td style="text-align:center;">${renderKondisi(kembali.status)}</td>
      <td>${ket ? esc(ket) : (idx === 4 ? '<em>(wajib diisi)</em>' : '')}</td>
    </tr>`;
  }).join('');

  const perpanjanganDisetujui = (loan.perpanjangan || []).filter((p) => p.status === 'disetujui');
  const perpanjanganTerakhir = perpanjanganDisetujui[perpanjanganDisetujui.length - 1];
  const tglPerpanjangan = perpanjanganTerakhir ? formatTanggalIndo(perpanjanganTerakhir.tanggal_kembali_baru) : '..............................';
  const parafPerpanjangan = perpanjanganTerakhir ? esc(perpanjanganTerakhir.diputuskan_oleh || '-') : '.........................';

  const adaKejadian = Boolean(serahKembali.ada_kejadian);
  const ketKejadian = adaKejadian
    ? [serahKembali.uraian_kejadian,
      serahKembali.tanggal_kejadian ? `tanggal ${formatTanggalIndo(serahKembali.tanggal_kejadian)}` : '',
      serahKembali.lokasi_kejadian ? `lokasi ${serahKembali.lokasi_kejadian}` : '']
      .filter(Boolean).join('; ')
    : '';
  const tindakLanjut = serahKembali.tindak_lanjut || '';

  const pengelolaNama = serahKeluar.pic_petugas || appPengelola.nama || '';
  const ttdKeluarPengelola = getCleanSignature(checkoutSigPengelola || serahKeluar.ttd_pengelola || null, '3');
  const ttdKeluarPeminjam = getCleanSignature(checkoutSigPeminjam || serahKeluar.ttd_peminjam || null, '1');
  const ttdKembaliPeminjam = getCleanSignature(serahKembali.ttd_peminjam || null, '1');
  const ttdKembaliPengelola = getCleanSignature(serahKembali.ttd_pengelola || null, '3');

  const tglOrKosong = (d) => (d ? formatTanggalIndo(d) : '');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Surat_Peminjaman_${esc(peralatan.nomor_aset || 'Alat')}_TLKM13-F-00X</title>
  <style>
    @page { size: A4 portrait; margin: 10mm 15mm 10mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; font-size: 9pt; line-height: 1.3; color: #000; background: #fff; padding: 4px; }
    .header-table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 8px; }
    .header-table td { border: 1px solid #000; padding: 4px 8px; vertical-align: middle; }
    .telkom-logo { font-size: 14pt; font-weight: 900; color: #EE2E24; letter-spacing: 0.5px; }
    .telkom-sub { font-size: 8pt; font-weight: 700; color: #1f2937; text-transform: uppercase; }
    .doc-main-title { font-size: 11pt; font-weight: bold; text-transform: uppercase; text-align: center; letter-spacing: 0.5px; }
    .meta-td { width: 24%; font-size: 8.5pt; line-height: 1.35; font-weight: 600; }
    .section-banner { background-color: #f1f5f9; border: 1px solid #000; border-bottom: none; padding: 4px 8px; font-size: 9pt; font-weight: bold; }
    .section-banner em { font-weight: normal; }
    .form-table { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 8px; font-size: 8.5pt; }
    .form-table td, .form-table th { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
    .form-table th { background-color: #fafafa; font-weight: 600; text-align: center; }
    .lbl { font-weight: 600; background-color: #fafafa; width: 22%; }
    .sig-table { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 8px; font-size: 8.5pt; table-layout: fixed; }
    .sig-table th { border: 1px solid #000; padding: 4px; background-color: #f1f5f9; text-align: center; font-weight: normal; vertical-align: middle; }
    .sig-table td { border: 1px solid #000; padding: 4px 6px; text-align: center; vertical-align: top; }
    .sig-box { height: 54px; line-height: 54px; text-align: center; }
    .sig-img { max-height: 50px; max-width: 130px; display: inline-block; vertical-align: middle; }
    .sig-digital-badge { display: inline-block; font-size: 7pt; line-height: normal; color: #475569; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 5px; border-radius: 3px; vertical-align: middle; }
    .sig-meta { font-size: 8pt; text-align: left; line-height: 1.3; }
    .row-note td { font-size: 8.5pt; }
    .notes { font-size: 7.5pt; line-height: 1.35; margin: 2px 0 6px 2px; }
    .footer-bar { display: flex; justify-content: space-between; font-size: 7.5pt; color: #6b7280; border-top: 1px solid #d1d5db; padding-top: 3px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>

  <!-- HEADER DOKUMEN -->
  <table class="header-table">
    <tr>
      <td style="width:32%;">
        <div class="telkom-logo">Telkom Indonesia</div>
        <div class="telkom-sub">Telkom Test House (TTH)</div>
      </td>
      <td style="width:44%;"><div class="doc-main-title">SURAT PEMINJAMAN PERALATAN</div></td>
      <td class="meta-td">
        <div>No. Dok : <strong>TLKM13/F/00X</strong></div>
        <div>Versi &nbsp; &nbsp; : <strong>01</strong></div>
        <div>Halaman : <strong>1 dari 1</strong></div>
      </td>
    </tr>
  </table>

  <table class="form-table">
    <tr>
      <td style="width:55%;"><strong>Laboratorium Pemilik Peralatan:</strong> &nbsp;
        ${renderCheckbox(isIQA, 'IQA')}${renderCheckbox(isDES, 'DES')}${renderCheckbox(isSSA, 'SSA')}
      </td>
      <td style="width:45%;"><strong>Nomor Surat:</strong> &nbsp;${esc(nomorSurat)}</td>
    </tr>
  </table>

  <!-- A. DATA PEMINJAMAN & PENGGUNA PERALATAN -->
  <div class="section-banner">A. DATA PEMINJAMAN &amp; PENGGUNA PERALATAN <em>(diisi Peminjam)</em></div>
  <table class="form-table">
    <tr>
      <td class="lbl">Jenis Peminjaman</td>
      <td colspan="3">
        ${renderCheckbox(!isEksternal, 'Internal (di dalam lingkungan TTH)')}
        ${renderCheckbox(isEksternal, 'Eksternal (di luar lingkungan TTH)')}
      </td>
    </tr>
    <tr>
      <th style="width:8%;">No.</th>
      <th>Nama Personel TTH</th>
      <th style="width:24%;">Laboratorium / Unit</th>
      <th style="width:26%;">Kontak (Telp / Email)</th>
    </tr>
    <tr>
      <td style="text-align:center;">1.</td>
      <td><strong>${esc(peminjamNama)}</strong> <em>(Peminjam dan/atau Pengguna)</em></td>
      <td>${esc(unitPeminjam)}</td>
      <td>${esc(kontakPeminjam)}</td>
    </tr>
    <tr>
      <td style="text-align:center;">2.</td>
      <td>${operatorNama && operatorNama !== peminjamNama ? `${esc(operatorNama)} <em>(Pengguna)</em>` : ''}</td>
      <td>${operatorNama && operatorNama !== peminjamNama ? esc(unitPeminjam) : ''}</td>
      <td></td>
    </tr>
    <tr>
      <td class="lbl">Keperluan</td>
      <td colspan="3">
        <div>
          ${renderCheckbox(isPengujian, 'Pengujian')}${renderCheckbox(isUjiLokasi, 'Uji lokasi')}
          ${renderCheckbox(isPengecekanAntara, 'Pengecekan antara')}${renderCheckbox(isLainnya, 'Lainnya')}
        </div>
        <div style="margin-top:3px;">Keterangan: ${esc(tujuan || '-')}</div>
      </td>
    </tr>
    <tr>
      <td class="lbl">Dasar Pelaksanaan</td>
      <td colspan="3">
        <div>
          ${renderCheckbox(isDasarSPK, 'No. Registrasi/SPK')}${renderCheckbox(isDasarND, 'Nota Dinas')}${renderCheckbox(isDasarLainnya, 'Lainnya')}
        </div>
        <div style="margin-top:2px;">Nomor: <strong>${esc(noSPK || '-')}</strong></div>
      </td>
    </tr>
    <tr>
      <td class="lbl">Lokasi / Alamat Penggunaan</td>
      <td colspan="3"><strong>${esc(lokasiPenggunaan)}</strong></td>
    </tr>
    <tr>
      <td class="lbl">Tanggal Keluar</td>
      <td><strong>${esc(tglKeluar)}</strong></td>
      <td class="lbl">Rencana Tanggal Kembali</td>
      <td><strong>${esc(tglKembali)}</strong></td>
    </tr>
  </table>

  <!-- B. DATA PERALATAN -->
  <div class="section-banner">B. DATA PERALATAN <em>(diisi Pengelola Peralatan)</em></div>
  <table class="form-table">
    <tr>
      <td class="lbl">Nama / Jenis Peralatan</td>
      <td colspan="3"><strong>${esc(namaAlat)}</strong></td>
    </tr>
    <tr>
      <td class="lbl">Nomor Aset</td><td><strong>${esc(peralatan.nomor_aset || '-')}</strong></td>
      <td class="lbl">Nomor Seri</td><td><strong>${esc(peralatan.nomor_seri || '-')}</strong></td>
    </tr>
    <tr>
      <td class="lbl">Merek</td><td>${esc(peralatan.merek || '-')}</td>
      <td class="lbl">Tipe / Model</td><td>${esc(peralatan.tipe || peralatan.tipe_model || '-')}</td>
    </tr>
    <tr>
      <td class="lbl">Jumlah</td><td>1 unit</td>
      <td class="lbl">Kelengkapan yang dibawa</td><td>${esc(kelengkapan)}</td>
    </tr>
    <tr>
      <td class="lbl">Jatuh Tempo Pemeriksaan</td>
      <td colspan="3"><strong>${esc(tglJatuhTempo)}</strong> <em>(Jatuh tempo pemeriksaan tidak boleh sebelum rencana tanggal kembali)</em></td>
    </tr>
  </table>

  <!-- C. PERSETUJUAN PEMINJAMAN -->
  <div class="section-banner">C. PERSETUJUAN PEMINJAMAN</div>
  <table class="sig-table">
    <tr>
      <th>Diajukan,<br><strong>Peminjam</strong></th>
      <th>Mengetahui,<br><strong>Mgr. ${esc(labPeminjamLabel)}</strong></th>
      <th>Disetujui,<br><strong>Mgr. ${esc(labPemilikLabel)}</strong></th>
    </tr>
    <tr>
      <td>
        <div class="sig-box">${renderSigBox(ttdPeminjamAju, 'TTD Peminjam', Boolean(loan.tanggal_pengajuan), 'Diajukan di sistem')}</div>
        <div class="sig-meta">Nama: <strong>${esc(peminjamNama)}</strong></div>
        <div class="sig-meta">Tgl: ${esc(tglOrKosong(loan.tanggal_pengajuan))}</div>
      </td>
      <td>
        <div class="sig-box">${renderSigBox(ttdMgrPeminjam, 'TTD Mgr Lab Peminjam', appMgrPeminjam.status === 'approved' || mgrPeminjamSkip, mgrPeminjamSkip ? 'Sama dengan Mgr. Lab Pemilik' : 'Disetujui di sistem')}</div>
        <div class="sig-meta">Nama: <strong>${esc(appMgrPeminjam.nama || '')}</strong></div>
        <div class="sig-meta">Tgl: ${esc(tglOrKosong(appMgrPeminjam.tanggal))}</div>
      </td>
      <td>
        <div class="sig-box">${renderSigBox(ttdMgrLab, 'TTD Mgr Lab Pemilik', appMgrLab.status === 'approved', 'Disetujui di sistem')}</div>
        <div class="sig-meta">Nama: <strong>${esc(appMgrLab.nama || '')}</strong></div>
        <div class="sig-meta">Tgl: ${esc(tglOrKosong(appMgrLab.tanggal))}</div>
      </td>
    </tr>
  </table>

  <!-- D. SERAH TERIMA DAN PEMERIKSAAN KONDISI -->
  <div class="section-banner">D. SERAH TERIMA DAN PEMERIKSAAN KONDISI <em>(diisi Pengelola Peralatan bersama Peminjam)</em></div>
  <table class="form-table">
    <tr>
      <th style="width:6%;">No.</th>
      <th>Butir Pemeriksaan</th>
      <th style="width:15%;">Kondisi Keluar</th>
      <th style="width:15%;">Kondisi Kembali</th>
      <th style="width:26%;">Keterangan</th>
    </tr>
    ${rowsButir}
    <tr class="row-note">
      <td colspan="5"><strong>Perpanjangan s.d. tanggal:</strong> ${tglPerpanjangan} &nbsp;&nbsp; <strong>Paraf Pengelola Peralatan:</strong> ${parafPerpanjangan}</td>
    </tr>
    <tr class="row-note">
      <td colspan="5"><strong>Kejadian selama peminjaman:</strong>
        ${renderCheckbox(sudahKembali && !adaKejadian, 'Tidak ada')}${renderCheckbox(adaKejadian, 'Ada')}
        (Keterangan: ${adaKejadian ? esc(ketKejadian) : '......................'} )
      </td>
    </tr>
    <tr class="row-note">
      <td colspan="5"><strong>Tindak lanjut:</strong>
        ${renderCheckbox(tindakLanjut === 'SIAP_DIPINJAM', 'Peralatan kembali Aktif')}
        ${renderCheckbox(tindakLanjut === 'PERLU_VERIFIKASI' || tindakLanjut === 'DO_NOT_USE', 'Peralatan masuk proses Verifikasi')}
      </td>
    </tr>
  </table>
  <table class="sig-table">
    <tr>
      <th colspan="2"><strong>Saat keluar</strong></th>
      <th colspan="2"><strong>Saat kembali</strong></th>
    </tr>
    <tr>
      <th>Diserahkan,<br><strong>Pengelola Peralatan</strong></th>
      <th>Diterima,<br><strong>Peminjam</strong></th>
      <th>Diserahkan,<br><strong>Peminjam</strong></th>
      <th>Diterima dan diperiksa,<br><strong>Pengelola Peralatan</strong></th>
    </tr>
    <tr>
      <td>
        <div class="sig-box">${renderSigBox(ttdKeluarPengelola, 'TTD Pengelola saat keluar', Boolean(serahKeluar.tanggal), 'Dicatat di sistem')}</div>
        <div class="sig-meta">Nama: <strong>${esc(pengelolaNama)}</strong></div>
        <div class="sig-meta">Tgl: ${esc(tglOrKosong(serahKeluar.tanggal))}</div>
      </td>
      <td>
        <div class="sig-box">${renderSigBox(ttdKeluarPeminjam, 'TTD Peminjam saat keluar', Boolean(serahKeluar.tanggal_diterima), 'Dicatat di sistem')}</div>
        <div class="sig-meta">Nama: <strong>${esc(serahKeluar.peminjam_penerima || (serahKeluar.tanggal_diterima ? peminjamNama : ''))}</strong></div>
        <div class="sig-meta">Tgl: ${esc(tglOrKosong(serahKeluar.tanggal_diterima))}</div>
      </td>
      <td>
        <div class="sig-box">${renderSigBox(ttdKembaliPeminjam, 'TTD Peminjam saat kembali', sudahKembali, 'Dicatat di sistem')}</div>
        <div class="sig-meta">Nama: <strong>${esc(serahKembali.peminjam_penyerah || '')}</strong></div>
        <div class="sig-meta">Tgl: ${esc(tglOrKosong(serahKembali.tanggal))}</div>
      </td>
      <td>
        <div class="sig-box">${renderSigBox(ttdKembaliPengelola, 'TTD Pengelola saat kembali', sudahKembali, 'Dicatat di sistem')}</div>
        <div class="sig-meta">Nama: <strong>${esc(serahKembali.pic_penerima || '')}</strong></div>
        <div class="sig-meta">Tgl: ${esc(tglOrKosong(serahKembali.tanggal))}</div>
      </td>
    </tr>
  </table>

  <div class="notes">
    Tandai pilihan dengan (✓) pada kotak ☐.<br>
    Kode kondisi: S = Sesuai · TS = Tidak Sesuai. Satu butir TS saat kembali mewajibkan tindak lanjut di proses Verifikasi.
  </div>

  <div class="footer-bar">
    <span>Dokumen sistem SiKEPo — Telkom Test House.</span>
    <span>Dokumen ini tidak terkendali apabila diunduh &bull; Hal 1 dari 1</span>
  </div>

</body>
</html>`;
}

/**
 * Mengekspor Surat Peminjaman Peralatan (F/00X) ke dialog cetak browser (Save as PDF).
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
    !loan.peminjam?.ttd &&
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
    alert('Data peminjaman tidak lengkap untuk mencetak Surat Peminjaman Peralatan.');
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
 * Mengekspor Surat Peminjaman Peralatan (F/00X) ke format Word (.doc)
 * Secara otomatis memuat detail gambar TTD dari backend jika objek loan belum memuatnya.
 */
export async function exportLoanF006Word(loanInput, options = {}) {
  let loan = loanInput;

  if (
    loan &&
    loan.id &&
    !isNaN(Number(loan.id)) &&
    !loan.peminjam?.ttd &&
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
  link.download = `Surat_Peminjaman_${noAset}_TLKM13-F-00X.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
