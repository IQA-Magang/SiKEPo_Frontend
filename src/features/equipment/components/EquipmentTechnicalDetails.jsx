import { FormField } from '../../../shared/components/ui/index.js';

function DetailInputField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  helpText,
  required = true,
  readOnly = false,
}) {
  return (
    <FormField
      label={label}
      htmlFor={id}
      hint={helpText}
      hintId={helpText ? `${id}-help` : undefined}
      required={required}
    >
      <input
        id={id}
        type={type}
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        aria-describedby={helpText ? `${id}-help` : undefined}
      />
    </FormField>
  );
}

function StandardEquipmentToggle({ id, checked, onChange }) {
  return (
    <label className="standard-equipment-toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />
      <span className="standard-equipment-toggle-copy">
        <strong>Digunakan sebagai alat standar</strong>
        <span>
          Tandai jika peralatan ini digunakan sebagai acuan untuk pengukuran atau pengujian.
        </span>
      </span>
    </label>
  );
}

function MeasuringEquipmentFields({ form, setField }) {
  return (
    <div className="form-grid-2">
      <DetailInputField
        id="d-sertifikat"
        label="No. Sertifikat Kalibrasi"
        value={form.no_sertifikat}
        onChange={(event) => setField('no_sertifikat', event.target.value)}
        placeholder="CAL-2026-0012"
        helpText="Salin nomor yang tercantum pada sertifikat kalibrasi terbaru."
      />
      <DetailInputField
        id="d-interval"
        label="Interval Kalibrasi (Bulan)"
        type="number"
        value={form.interval_bulan}
        onChange={(event) => setField('interval_bulan', event.target.value)}
        placeholder="12"
        helpText="Jarak waktu kalibrasi dalam bulan, dihitung dari tanggal kalibrasi terakhir."
      />
      <DetailInputField
        id="d-tgl-kalibrasi"
        label="Tgl. Kalibrasi Terakhir"
        type="date"
        value={form.tgl_kalibrasi}
        onChange={(event) => setField('tgl_kalibrasi', event.target.value)}
        helpText="Tanggal pelaksanaan yang tertera pada sertifikat."
      />
      <DetailInputField
        id="d-tgl-jatuh"
        label="Tgl. Jatuh Tempo Kalibrasi"
        type="date"
        value={form.tgl_jatuh_tempo}
        readOnly
        helpText="Dihitung otomatis dari tanggal kalibrasi terakhir dan interval kalibrasi."
      />
      <FormField
        label="Metode Kelayakan"
        htmlFor="d-metode-kelayakan"
        hint="Pilih cara penetapan kelayakan yang digunakan untuk alat ini."
        hintId="d-metode-kelayakan-help"
      >
        <select
          id="d-metode-kelayakan"
          className="form-select"
          value={form.metode_kelayakan || 'kalibrasi eksternal'}
          onChange={(event) => setField('metode_kelayakan', event.target.value)}
          aria-describedby="d-metode-kelayakan-help"
        >
          <option value="kalibrasi internal">Kalibrasi internal</option>
          <option value="kalibrasi eksternal">Kalibrasi eksternal</option>
          <option value="verifikasi fungsi (metode tertentu)">Verifikasi fungsi (metode tertentu)</option>
          <option value="verifikasi fungsi (uji banding)">Verifikasi fungsi (uji banding)</option>
        </select>
      </FormField>
      <FormField label="Status Kelayakan" htmlFor="d-status-kelayakan">
        <select
          id="d-status-kelayakan"
          className="form-select"
          value={form.status_kelayakan}
          onChange={(event) => setField('status_kelayakan', event.target.value)}
        >
          <option value="Layak">Layak</option>
          <option value="Terbatas">Terbatas</option>
          <option value="Tidak layak">Tidak layak</option>
        </select>
      </FormField>
      <FormField label="Jenis Label" htmlFor="d-jenis-label">
        <select
          id="d-jenis-label"
          className="form-select"
          value={form.jenis_label}
          onChange={(event) => setField('jenis_label', event.target.value)}
        >
          <option value="calibration">Kalibrasi</option>
          <option value="limited calibration">Kalibrasi terbatas</option>
          <option value="do not use">Jangan digunakan</option>
        </select>
      </FormField>
      <StandardEquipmentToggle
        id="d-alat-standar"
        checked={form.fungsi_sbg_alat_standar}
        onChange={(event) => setField('fungsi_sbg_alat_standar', event.target.checked)}
      />
    </div>
  );
}

function AuxiliaryEquipmentFields({ form, setField }) {
  return (
    <div className="form-grid-2">
      <DetailInputField
        id="d-fungsi"
        label="Fungsi / Kegunaan"
        value={form.fungsi_kegunaan}
        onChange={(event) => setField('fungsi_kegunaan', event.target.value)}
        helpText="Jelaskan pekerjaan atau pengukuran yang dibantu alat ini."
      />
      <FormField
        label="Jenis Pemeriksaan Berkala"
        htmlFor="d-jenis-pemeriksaan"
        hint="Pilih aktivitas berkala yang digunakan untuk memastikan alat bantu tetap berfungsi."
        hintId="d-jenis-pemeriksaan-help"
        required
      >
        <select
          id="d-jenis-pemeriksaan"
          className="form-select"
          value={form.jenis_pemeriksaan_berkala || 'kalibrasi'}
          onChange={(event) => setField('jenis_pemeriksaan_berkala', event.target.value)}
        >
          <option value="kalibrasi">Kalibrasi</option>
          <option value="verifikasi fungsi">Verifikasi fungsi</option>
          <option value="pemeriksaan lain">Pemeriksaan lain</option>
        </select>
      </FormField>
      <DetailInputField
        id="d-interval-ab"
        label="Interval (Bulan)"
        type="number"
        value={form.interval_bulan}
        onChange={(event) => setField('interval_bulan', event.target.value)}
        helpText="Jarak antar pemeriksaan berkala dalam bulan."
      />
      <DetailInputField
        id="d-jatuh-ab"
        label="Tgl. Jatuh Tempo"
        type="date"
        value={form.tgl_jatuh_tempo}
        onChange={(event) => setField('tgl_jatuh_tempo', event.target.value)}
      />
      <DetailInputField
        id="d-tgl-pemeriksaan"
        label="Tgl. Pemeriksaan Terakhir"
        type="date"
        value={form.tgl_pemeriksaan_terakhir}
        onChange={(event) => setField('tgl_pemeriksaan_terakhir', event.target.value)}
      />
      <DetailInputField
        id="d-karakteristik-acuan"
        label="Karakteristik Acuan"
        value={form.karakteristik_acuan}
        onChange={(event) => setField('karakteristik_acuan', event.target.value)}
        required={false}
        helpText="Besaran atau karakteristik yang dijadikan acuan saat pemeriksaan."
      />
      <DetailInputField
        id="d-jadwal-karakterisasi"
        label="Jadwal Karakterisasi Ulang"
        value={form.jadwal_karakterisasi_ulang}
        onChange={(event) => setField('jadwal_karakterisasi_ulang', event.target.value)}
        required={false}
        helpText="Isi jadwal atau interval karakterisasi ulang bila berlaku."
      />
      <StandardEquipmentToggle
        id="d-alat-standar-ab"
        checked={form.fungsi_sbg_alat_standar}
        onChange={(event) => setField('fungsi_sbg_alat_standar', event.target.checked)}
      />
      <FormField
        label="Kriteria Pemeriksaan"
        htmlFor="d-kriteria"
        required
        style={{ gridColumn: '1/-1' }}
      >
        <textarea
          id="d-kriteria"
          className="form-textarea"
          value={form.kriteria_pemeriksaan}
          onChange={(event) => setField('kriteria_pemeriksaan', event.target.value)}
          style={{ minHeight: 80 }}
        />
      </FormField>
    </div>
  );
}

function ReferenceArtifactFields({ form, setField }) {
  return (
    <div className="form-grid-2">
      <DetailInputField
        id="d-jenis-aa"
        label="Jenis / Deskripsi Acuan"
        value={form.jenis_deskripsi}
        onChange={(event) => setField('jenis_deskripsi', event.target.value)}
      />
      <FormField label="Karakteristik yang Diacu" htmlFor="d-karakteristik" required>
        <select
          id="d-karakteristik"
          className="form-select"
          value={form.karakteristik_yang_diacu || 'visual'}
          onChange={(event) => setField('karakteristik_yang_diacu', event.target.value)}
        >
          <option value="visual">visual</option>
          <option value="dimension">dimension</option>
          <option value="kinerja funngsional">kinerja funngsional</option>
          <option value="visual & dimension">visual &amp; dimension</option>
          <option value="dimension & kinerja">dimension &amp; kinerja</option>
        </select>
      </FormField>
      <DetailInputField id="d-nilai-spec" label="Nilai Spesifikasi Karakterisasi" value={form.nilai_spesifikasi_karakterisasi} onChange={(event) => setField('nilai_spesifikasi_karakterisasi', event.target.value)} />
      <DetailInputField id="d-metode-kar" label="Metode Karakterisasi" value={form.metode_karakterisasi} onChange={(event) => setField('metode_karakterisasi', event.target.value)} />
      <DetailInputField id="d-no-laporan" label="No. Laporan Karakterisasi" value={form.no_laporan_karakterisasi} onChange={(event) => setField('no_laporan_karakterisasi', event.target.value)} />
      <DetailInputField id="d-tgl-kar" label="Tgl. Karakterisasi Terakhir" type="date" value={form.tgl_karakterisasi_terakhir} onChange={(event) => setField('tgl_karakterisasi_terakhir', event.target.value)} />
      <DetailInputField id="d-jatuh-aa" label="Tgl. Jatuh Tempo" type="date" value={form.tgl_jatuh_tempo} onChange={(event) => setField('tgl_jatuh_tempo', event.target.value)} />
      <DetailInputField
        id="d-kondisi"
        label="Kondisi Penyimpanan"
        value={form.kondisi_penyimpanan}
        onChange={(event) => setField('kondisi_penyimpanan', event.target.value)}
        helpText="Tulis batas suhu, kelembapan, atau kondisi penyimpanan yang dipersyaratkan."
      />
      <DetailInputField
        id="d-interval-aa"
        label="Interval Karakterisasi (Bulan)"
        type="number"
        value={form.interval_bulan}
        onChange={(event) => setField('interval_bulan', event.target.value)}
        required={false}
        helpText="Jarak waktu sampai karakterisasi ulang berikutnya."
      />
      <FormField label="Status Artefak" htmlFor="d-status-artefak">
        <select
          id="d-status-artefak"
          className="form-select"
          value={form.status_artefak}
          onChange={(event) => setField('status_artefak', event.target.value)}
        >
          <option value="aktif">Aktif</option>
          <option value="karantina">Karantina</option>
          <option value="dihapuskan">Dihapuskan</option>
        </select>
      </FormField>
    </div>
  );
}

function SupportingComponentFields({ form, setField }) {
  return (
    <div className="equipment-technical-details__stack">
      <div className="form-grid-2">
        <FormField label="Sub Kategori" htmlFor="d-subkat" required>
          <select
            id="d-subkat"
            className="form-select"
            value={form.sub_kategori || 'data acuan'}
            onChange={(event) => setField('sub_kategori', event.target.value)}
          >
            <option value="data acuan">data acuan</option>
            <option value="pereaksi">pereaksi</option>
            <option value="bahan habis pakai">bahan habis pakai</option>
          </select>
        </FormField>
        <DetailInputField id="d-pemasok" label="Sumber / Pemasok" value={form.sumber_pemasok} onChange={(event) => setField('sumber_pemasok', event.target.value)} helpText="Nama produsen, pemasok, atau sumber penerbitan bahan." />
        <DetailInputField id="d-lot" label="No. Lot / Batch / Edisi" value={form.no_lot_batch_edisi} onChange={(event) => setField('no_lot_batch_edisi', event.target.value)} helpText="Nomor identifikasi lot pada label atau kemasan." />
        <DetailInputField id="d-grade" label="Grade Mutu" value={form.grade_mutu} onChange={(event) => setField('grade_mutu', event.target.value)} />
        <DetailInputField id="d-satuan-kemasan" label="Satuan Kemasan" value={form.satuan_kemasan} onChange={(event) => setField('satuan_kemasan', event.target.value)} />
        <DetailInputField id="d-tgl-terima" label="Tgl. Terima / Terbit" type="date" value={form.tgl_terima_terbit} onChange={(event) => setField('tgl_terima_terbit', event.target.value)} />
        <DetailInputField id="d-tgl-kadaluarsa" label="Tgl. Kedaluwarsa" type="date" value={form.tgl_kedaluwarsa} onChange={(event) => setField('tgl_kedaluwarsa', event.target.value)} helpText="Tanggal batas penggunaan sesuai label atau sertifikat bahan." />
        <DetailInputField id="d-kondisi-kp" label="Kondisi Penyimpanan" value={form.kondisi_penyimpanan} onChange={(event) => setField('kondisi_penyimpanan', event.target.value)} required={false} helpText="Cantumkan suhu, kelembapan, atau perlindungan khusus yang diperlukan." />
      </div>
      <FormField
        label="Deskripsi / Spesifikasi"
        htmlFor="d-deskripsi-kp"
        hint="Tuliskan spesifikasi penting seperti konsentrasi, ukuran, atau karakteristik yang membedakan bahan ini."
        hintId="d-deskripsi-kp-help"
        required
      >
        <textarea
          id="d-deskripsi-kp"
          className="form-textarea"
          value={form.deskripsi_spesifikasi}
          onChange={(event) => setField('deskripsi_spesifikasi', event.target.value)}
          style={{ minHeight: 80 }}
          aria-describedby="d-deskripsi-kp-help"
        />
      </FormField>
      <FormField label="Status Ketersediaan" htmlFor="d-ketersediaan" required>
        <select
          id="d-ketersediaan"
          className="form-select"
          value={form.status_ketersediaan}
          onChange={(event) => setField('status_ketersediaan', event.target.value)}
        >
          {['Berlaku', 'Tersedia', 'Stok cukup', 'Stok menipis', 'Kedaluwarsa', 'Habis'].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </FormField>
    </div>
  );
}

export default function EquipmentTechnicalDetails({ form, setField, categoryId }) {
  if (categoryId === 1) return <MeasuringEquipmentFields form={form} setField={setField} />;
  if (categoryId === 2) return <AuxiliaryEquipmentFields form={form} setField={setField} />;
  if (categoryId === 3) return <ReferenceArtifactFields form={form} setField={setField} />;
  if (categoryId === 4) return <SupportingComponentFields form={form} setField={setField} />;
  return <p>Pilih kategori pada langkah sebelumnya.</p>;
}
